using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.DbContext;
using WebApp.Services.Implementations;

namespace WebApp.Services;

public class CompanyService : ICompanyService
{
    private readonly MongoDbContext _dbContext;
    private readonly IValuationEngine _valuationEngine;
    private readonly ICapTableCalculator _capTableCalculator;
    private readonly IInvestorMatcher _investorMatcher;
    private readonly IAiReviewEngine _aiReviewEngine;
    private readonly IDocumentManager _documentManager;
    private readonly IPhaseValidator _phaseValidator;

    public CompanyService(
        MongoDbContext dbContext,
        IValuationEngine valuationEngine,
        ICapTableCalculator capTableCalculator,
        IInvestorMatcher investorMatcher,
        IAiReviewEngine aiReviewEngine,
        IDocumentManager documentManager,
        IPhaseValidator phaseValidator)
    {
        _dbContext = dbContext;
        _valuationEngine = valuationEngine;
        _capTableCalculator = capTableCalculator;
        _investorMatcher = investorMatcher;
        _aiReviewEngine = aiReviewEngine;
        _documentManager = documentManager;
        _phaseValidator = phaseValidator;
    }

    // ============ PHASE FLOW ============

    public async Task<CompanyProgressResponse> GetCurrentPhaseAsync(string userId)
    {
        var company = await GetCompanyByUserIdAsync(userId);
        if (company == null)
            // Universal Phase 1 is already complete; no company yet means not started Entrepreneur Phase 2.
            return new CompanyProgressResponse
            {
                CompanyId = string.Empty,
                CurrentPhase = 2,
                CompletedPhases = new List<int>(),
                OverallProgressPercent = 0,
                TrustScore = 0,
                IsInvestorReady = false,
                CreatedAt = DateTime.UtcNow,
                LastUpdatedAt = DateTime.UtcNow
            };

        return BuildProgressResponse(company);
    }

    public async Task<CompanyProgressResponse> AdvancePhaseAsync(string companyId, int phaseToComplete, object phaseData)
    {
        var company = await GetCompanyAsync(companyId);

        company.CompletedPhases ??= new List<int>();

        // Validate phase progression. Completing phase 9 advances currentPhase
        // to 10 (terminal "Journey Complete" state). Phase 10 itself cannot be
        // "completed" — it has no business logic to validate.
        if (phaseToComplete < 2 || phaseToComplete > 9)
            throw new ArgumentException("Phase must be between 2 and 9");

        // phaseToComplete is the phase being completed, so currentPhase must equal phaseToComplete
        if (company.CurrentPhase != phaseToComplete)
            throw new InvalidOperationException(
                $"Cannot complete phase {phaseToComplete}. Current phase is {company.CurrentPhase}");

        // Validate the phase before moving to the next one.
        var (isValid, errors) = await ValidatePhaseAsync(company, phaseToComplete);
        if (!isValid)
            throw new InvalidOperationException($"Cannot advance: {string.Join(", ", errors)}");

        // Mark the phase as completed and advance to the next phase.
        if (!company.CompletedPhases.Contains(phaseToComplete))
            company.CompletedPhases.Add(phaseToComplete);

        company.CurrentPhase = phaseToComplete + 1;

        company.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Companies>.Filter.Eq(c => c.Id, company.Id);
        await _dbContext.Companies.ReplaceOneAsync(filter, company);

        return BuildProgressResponse(company);
    }

    public async Task<CompanyProgressResponse> GetPhaseProgressAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);
        return BuildProgressResponse(company);
    }

    // ============ PHASE 1: IDENTITY & ONBOARDING ============

    public async Task<Companies> CreateCompanyAsync(string userId, CreateCompanyDto dto)
    {
        var company = new Companies
        {
            Id = ObjectId.GenerateNewId().ToString(),
            OwnerId = userId,
            CompanyName = dto.CompanyName,
            Industry = dto.Industry,
            Website = dto.Website,
            Tagline = dto.Tagline,
            CurrentPhase = 2,
            CompletedPhases = new List<int>(),
            TrustScore = 0,
            IsInvestorReady = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _dbContext.Companies.InsertOneAsync(company);
        return company;
    }

    public async Task<Companies> GetCompanyAsync(string companyId)
    {
        return await _dbContext.Companies.Find(c => c.Id == companyId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException($"Company {companyId} not found");
    }

    public async Task<Companies> GetCompanyByUserIdAsync(string userId)
    {
        return await _dbContext.Companies.Find(c => c.OwnerId == userId).FirstOrDefaultAsync();
    }

    // ============ PHASE 2: LEGAL INFO & DOCUMENTS ============

    public async Task<Companies> UpdateLegalInfoAsync(string companyId, UpdateLegalInfoRequest request)
    {
        var company = await GetCompanyAsync(companyId);

        company.LegalName = request.LegalName;
        company.RegistrationNumber = request.RegistrationNumber;
        company.LegalStructure = request.LegalStructure;
        company.IncorporationDate = request.IncorporationDate;
        company.RegisteredAddress = request.RegisteredAddress;
        company.Country = request.Country;
        company.NafCode = request.NafCode;
        company.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Companies>.Filter.Eq(c => c.Id, companyId);
        await _dbContext.Companies.ReplaceOneAsync(filter, company);

        return company;
    }

    public async Task<DocumentStatusResponse> UploadDocumentAsync(string companyId, DocumentUploadRequest request)
    {
        if (request?.File == null || request.File.Length == 0)
            throw new ArgumentException("Uploaded file is required");

        if (string.IsNullOrWhiteSpace(request.DocumentType))
            throw new ArgumentException("documentType is required");

        var company = await GetCompanyAsync(companyId);

        // Read the multipart upload stream into bytes for the document manager.
        byte[] fileBytes;
        await using (var ms = new MemoryStream())
        {
            await request.File.CopyToAsync(ms);
            fileBytes = ms.ToArray();
        }

        var fileName = request.File.FileName;
        var storagePath = await _documentManager.SaveDocumentAsync(companyId, fileName, fileBytes);

        var docId = ObjectId.GenerateNewId().ToString();
        var document = new DocumentStatusResponse
        {
            DocumentId = docId,
            Type = request.DocumentType,
            FileName = fileName,
            Status = "pending",
            UploadedAt = DateTime.UtcNow,
            ReviewNote = null,
            StoragePath = storagePath,
            FileSize = request.File.Length
        };

        if (company.DocumentStatuses == null)
            company.DocumentStatuses = new List<DocumentStatusResponse>();

        company.DocumentStatuses.Add(document);
        company.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Companies>.Filter.Eq(c => c.Id, companyId);
        await _dbContext.Companies.ReplaceOneAsync(filter, company);

        return document;
    }

    public async Task<List<DocumentStatusResponse>> GetDocumentStatusAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);
        return company.DocumentStatuses ?? new List<DocumentStatusResponse>();
    }

    public async Task<Companies> UpdateBeneficialOwnersAsync(string companyId, UpdateBeneficialOwnersRequest request)
    {
        var company = await GetCompanyAsync(companyId);

        company.BeneficialOwnersDto = request.Owners;
        company.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Companies>.Filter.Eq(c => c.Id, companyId);
        await _dbContext.Companies.ReplaceOneAsync(filter, company);

        return company;
    }

    // ============ PHASE 3: FINANCIAL & KPI ============

    public async Task<Companies> SaveRevenueDataAsync(string companyId, SaveRevenueDataRequest request)
    {
        var company = await GetCompanyAsync(companyId);

        company.Q1Revenue = request.Q1Revenue;
        company.Q2Revenue = request.Q2Revenue;
        company.Q3Revenue = request.Q3Revenue;
        company.Q4Revenue = request.Q4Revenue;
        company.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Companies>.Filter.Eq(c => c.Id, companyId);
        await _dbContext.Companies.ReplaceOneAsync(filter, company);

        return company;
    }

    public async Task<FinancialSummaryResponse> CalculateValuationAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);

        var totalRevenue = (company.Q1Revenue ?? 0) + (company.Q2Revenue ?? 0) + (company.Q3Revenue ?? 0) + (company.Q4Revenue ?? 0);
        var growthRate = CalculateGrowthRate(company);
        var runwayMonths = CalculateRunway(company);

        var valuation = await _valuationEngine.CalculateValuationAsync(
            totalRevenue,
            growthRate,
            company.Industry,
            runwayMonths
        );

        company.Valuation = valuation.EstimatedValuation;
        company.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Companies>.Filter.Eq(c => c.Id, companyId);
        await _dbContext.Companies.ReplaceOneAsync(filter, company);

        return new FinancialSummaryResponse
        {
            TotalRevenue = totalRevenue,
            FinalValuation = valuation.EstimatedValuation,
            MonthlyRecurringRevenue = totalRevenue / 12,
            AnnualRecurringRevenue = totalRevenue,
            RunwayMonths = runwayMonths,
            GrowthRate = growthRate,
            LastUpdatedAt = DateTime.UtcNow
        };
    }

    public async Task<Companies> SaveEquityStructureAsync(string companyId, SaveEquityStructureRequest request)
    {
        var company = await GetCompanyAsync(companyId);

        company.EquityStructure = request.Entries;
        company.EsopPoolPercent = request.EsopPoolPercent;
        company.EsopVestingMonths = request.EsopVestingMonths;
        company.TotalShares = request.TotalShares;
        company.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Companies>.Filter.Eq(c => c.Id, companyId);
        await _dbContext.Companies.ReplaceOneAsync(filter, company);

        return company;
    }

    public async Task<Companies> SaveFundingAskAsync(string companyId, SaveFundingAskRequest request)
    {
        if (request == null) throw new ArgumentException("Request body required");
        if (!double.IsFinite(request.RaiseAmount) || request.RaiseAmount <= 0)
            throw new ArgumentException("raiseAmount must be a finite number > 0");
        if (!double.IsFinite(request.PreMoneyValuation) ||
            request.PreMoneyValuation < Phase5Requirements.ValuationMin)
            throw new ArgumentException($"preMoneyValuation must be >= {Phase5Requirements.ValuationMin}");

        // EquityOfferedPercent is optional at write time (Phase 3 doesn't collect it).
        // Phase 5 validator enforces it before phase advancement.
        if (request.EquityOfferedPercent.HasValue)
        {
            if (!double.IsFinite(request.EquityOfferedPercent.Value) ||
                request.EquityOfferedPercent.Value <= Phase5Requirements.EquityOfferedMin ||
                request.EquityOfferedPercent.Value > Phase5Requirements.EquityOfferedMax)
                throw new ArgumentException(
                    $"equityOfferedPercent must be in ({Phase5Requirements.EquityOfferedMin}, {Phase5Requirements.EquityOfferedMax}]");
        }

        // ShareType is optional at write time; whitelist enforced when provided
        // and at Phase 5 advancement.
        if (!string.IsNullOrWhiteSpace(request.ShareType) &&
            !Phase5Requirements.IsValidShareType(request.ShareType))
            throw new ArgumentException(
                $"shareType must be one of: {string.Join(", ", Phase5Requirements.ShareTypeWhitelist)}");

        // Per-row validation of capital allocation + hiring plan at write time
        // so malformed rows are rejected before they ever reach Mongo.
        if (request.CapitalAllocation != null && request.CapitalAllocation.Count > 0)
        {
            var allocErrors = Phase5Requirements.ValidateAllocationRows(request.CapitalAllocation);
            if (allocErrors.Count > 0) throw new ArgumentException(string.Join("; ", allocErrors));
        }
        if (request.ResourceMap?.HiringPlan != null && request.ResourceMap.HiringPlan.Count > 0)
        {
            var hireErrors = Phase5Requirements.ValidateHiringPlanRows(request.ResourceMap.HiringPlan);
            if (hireErrors.Count > 0) throw new ArgumentException(string.Join("; ", hireErrors));
        }

        var company = await GetCompanyAsync(companyId);

        company.FundingAskAmount = request.RaiseAmount;
        company.FundingRoundType = request.RoundType;
        company.PreMoneyValuation = request.PreMoneyValuation;
        if (request.EquityOfferedPercent.HasValue)
            company.EquityOfferedPercent = request.EquityOfferedPercent.Value;
        if (!string.IsNullOrWhiteSpace(request.ShareType))
            company.ShareType = request.ShareType.ToLowerInvariant();
        company.CapitalAllocation = request.CapitalAllocation;
        company.ResourceMap = request.ResourceMap;
        company.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Companies>.Filter.Eq(c => c.Id, companyId);
        await _dbContext.Companies.ReplaceOneAsync(filter, company);

        return company;
    }

    public async Task<FinancialSummaryResponse> GetFinancialSummaryAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);

        var totalRevenue = (company.Q1Revenue ?? 0) + (company.Q2Revenue ?? 0) + (company.Q3Revenue ?? 0) + (company.Q4Revenue ?? 0);
        var runwayMonths = CalculateRunway(company);

        return new FinancialSummaryResponse
        {
            TotalRevenue = totalRevenue,
            FinalValuation = company.Valuation ?? 0,
            MonthlyRecurringRevenue = totalRevenue / 12,
            AnnualRecurringRevenue = totalRevenue,
            RunwayMonths = runwayMonths,
            GrowthRate = CalculateGrowthRate(company),
            LastUpdatedAt = company.UpdatedAt
        };
    }

    // ============ PHASE 3 EXTENSIONS: CASH POSITION / MONTHLY REVENUE / KPI / REPORTS ============

    public async Task<Companies> SaveCashPositionAsync(string companyId, SaveCashPositionRequest request)
    {
        if (request == null)
            throw new ArgumentException("Request body required");
        if (request.CurrentFunds < 0)
            throw new ArgumentException("currentFunds must be >= 0");
        if (request.MonthlyBurn < 0)
            throw new ArgumentException("monthlyBurn must be >= 0");

        var company = await GetCompanyAsync(companyId);
        company.CurrentFunds = request.CurrentFunds;
        company.MonthlyBurn = request.MonthlyBurn;
        company.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Companies>.Filter.Eq(c => c.Id, companyId);
        await _dbContext.Companies.ReplaceOneAsync(filter, company);
        return company;
    }

    public async Task<List<MonthlyRevenueResponse>> SaveMonthlyRevenueAsync(string companyId, SaveMonthlyRevenueRequest request)
    {
        if (request?.Entries == null || request.Entries.Count == 0)
            throw new ArgumentException("At least one monthly revenue entry is required");

        // Confirm the company exists & is owned by caller (ownership enforced at controller).
        await GetCompanyAsync(companyId);

        foreach (var entry in request.Entries)
        {
            if (string.IsNullOrWhiteSpace(entry.YearMonth) ||
                !System.Text.RegularExpressions.Regex.IsMatch(entry.YearMonth, "^\\d{4}-\\d{2}$"))
                throw new ArgumentException($"yearMonth '{entry.YearMonth}' must be YYYY-MM");
            if (entry.Revenue < 0)
                throw new ArgumentException($"revenue for {entry.YearMonth} must be >= 0");

            var filter = Builders<Phase3MonthlyRevenue>.Filter.And(
                Builders<Phase3MonthlyRevenue>.Filter.Eq(x => x.CompanyId, companyId),
                Builders<Phase3MonthlyRevenue>.Filter.Eq(x => x.YearMonth, entry.YearMonth));

            var doc = new Phase3MonthlyRevenue
            {
                Id = ObjectId.GenerateNewId().ToString(),
                CompanyId = companyId,
                YearMonth = entry.YearMonth,
                Revenue = entry.Revenue,
                SectorBreakdown = entry.SectorBreakdown ?? new Dictionary<string, double>(),
                RecordedAt = DateTime.UtcNow,
            };

            // Upsert by (companyId, yearMonth) so the same month can be edited.
            await _dbContext.Phase3MonthlyRevenues.ReplaceOneAsync(
                filter, doc, new ReplaceOptions { IsUpsert = true });
        }

        return await GetMonthlyRevenueAsync(companyId);
    }

    public async Task<List<MonthlyRevenueResponse>> GetMonthlyRevenueAsync(string companyId)
    {
        await GetCompanyAsync(companyId);

        var docs = await _dbContext.Phase3MonthlyRevenues
            .Find(x => x.CompanyId == companyId)
            .SortBy(x => x.YearMonth)
            .ToListAsync();

        return docs.Select(d => new MonthlyRevenueResponse
        {
            YearMonth = d.YearMonth,
            Revenue = d.Revenue,
            SectorBreakdown = d.SectorBreakdown ?? new Dictionary<string, double>(),
            RecordedAt = d.RecordedAt,
        }).ToList();
    }

    public async Task<KpiBaselineResponse> SaveKpiBaselineAsync(string companyId, SaveKpiBaselineRequest request)
    {
        if (request == null)
            throw new ArgumentException("Request body required");

        await GetCompanyAsync(companyId);

        var doc = new Phase3Kpi
        {
            Id = ObjectId.GenerateNewId().ToString(),
            CompanyId = companyId,
            Mrr = request.Mrr,
            Arr = request.Arr,
            GrossMarginPercent = request.GrossMarginPercent,
            Cac = request.Cac,
            Ltv = request.Ltv,
            ChurnPercent = request.ChurnPercent,
            ActiveAccounts = request.ActiveAccounts,
            RecordedAt = DateTime.UtcNow,
        };

        var validationErrors = Phase3Requirements.ValidateKpiBaseline(doc);
        if (validationErrors.Count > 0)
            throw new ArgumentException(string.Join("; ", validationErrors));

        await _dbContext.Phase3Kpis.InsertOneAsync(doc);
        return MapKpi(doc);
    }

    public async Task<KpiBaselineResponse?> GetKpiBaselineAsync(string companyId)
    {
        await GetCompanyAsync(companyId);

        var latest = await _dbContext.Phase3Kpis
            .Find(x => x.CompanyId == companyId)
            .SortByDescending(x => x.RecordedAt)
            .FirstOrDefaultAsync();

        return latest == null ? null : MapKpi(latest);
    }

    public async Task<FinancialReportResponse> UploadFinancialReportAsync(string companyId, FinancialReportUploadRequest request)
    {
        if (request?.File == null || request.File.Length == 0)
            throw new ArgumentException("Uploaded file is required");
        if (string.IsNullOrWhiteSpace(request.ReportType))
            throw new ArgumentException("reportType is required");

        await GetCompanyAsync(companyId);

        byte[] bytes;
        await using (var ms = new MemoryStream())
        {
            await request.File.CopyToAsync(ms);
            bytes = ms.ToArray();
        }

        var fileName = request.File.FileName;
        var storagePath = await _documentManager.SaveDocumentAsync(companyId, fileName, bytes);

        var doc = new Phase3FinancialReport
        {
            Id = ObjectId.GenerateNewId().ToString(),
            CompanyId = companyId,
            Type = request.ReportType.ToLowerInvariant(),
            FileName = fileName,
            StoragePath = storagePath,
            FileSize = request.File.Length,
            Status = Phase3Requirements.ReportStatusPending,
            UploadedAt = DateTime.UtcNow,
        };

        await _dbContext.Phase3FinancialReports.InsertOneAsync(doc);
        return MapReport(doc);
    }

    public async Task<List<FinancialReportResponse>> GetFinancialReportsAsync(string companyId)
    {
        await GetCompanyAsync(companyId);

        var docs = await _dbContext.Phase3FinancialReports
            .Find(x => x.CompanyId == companyId)
            .SortByDescending(x => x.UploadedAt)
            .ToListAsync();

        return docs.Select(MapReport).ToList();
    }

    private static KpiBaselineResponse MapKpi(Phase3Kpi k) => new()
    {
        Mrr = k.Mrr,
        Arr = k.Arr,
        GrossMarginPercent = k.GrossMarginPercent,
        Cac = k.Cac,
        Ltv = k.Ltv,
        ChurnPercent = k.ChurnPercent,
        ActiveAccounts = k.ActiveAccounts,
        RecordedAt = k.RecordedAt,
    };

    private static FinancialReportResponse MapReport(Phase3FinancialReport r) => new()
    {
        ReportId = r.Id,
        Type = r.Type,
        FileName = r.FileName,
        Status = r.Status,
        UploadedAt = r.UploadedAt,
        FileSize = r.FileSize,
        StoragePath = r.StoragePath,
        ReviewNote = r.ReviewNote,
    };

    // ============ PHASE 4: EQUITY STRUCTURE & DILUTION ============

    public async Task<SaveEquityStructureRequest> GetCapTableAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);

        return new SaveEquityStructureRequest
        {
            Entries = company.EquityStructure ?? new List<EquityEntryDto>(),
            EsopPoolPercent = company.EsopPoolPercent ?? 0,
            EsopVestingMonths = company.EsopVestingMonths ?? 0,
            TotalShares = company.TotalShares ?? 1000000
        };
    }

    public async Task<DilutionSimulationResponse> SimulateDilutionAsync(string companyId, SimulateDilutionRequest request)
    {
        var company = await GetCompanyAsync(companyId);
        var currentCapTable = company.EquityStructure ?? new List<EquityEntryDto>();

        var scenarios = await _capTableCalculator.SimulateDilutionAsync(
            currentCapTable,
            request.FundingAmount,
            request.PostMoneyValuation,
            request.RoundType
        );

        return new DilutionSimulationResponse { Scenarios = scenarios };
    }

    // ============ PHASE 4 EXTENSIONS: CAP TABLE / VESTING / OWNERSHIP HISTORY / ISSUANCE ============

    public async Task<CapTableSnapshotResponse> SubmitCapTableAsync(string companyId, SubmitCapTableRequest request)
    {
        // Write-time validation = shape + per-grant + duplicate detection only.
        // Totals reconciliation + founder presence are enforced at phase
        // advancement (ValidatePhase4Async), so partial cap-table progress
        // can be saved across steps without erroring out the user.
        var shapeErrors = Phase4Requirements.ValidateCapTableShape(request);
        if (shapeErrors.Count > 0)
            throw new ArgumentException(string.Join("; ", shapeErrors));

        var grantErrors = Phase4Requirements.ValidateGrants(request.Grants, request.TotalShares);
        if (grantErrors.Count > 0)
            throw new ArgumentException(string.Join("; ", grantErrors));

        var duplicateErrors = Phase4Requirements.ValidateDuplicateRows(request);
        if (duplicateErrors.Count > 0)
            throw new ArgumentException(string.Join("; ", duplicateErrors));

        var company = await GetCompanyAsync(companyId);

        // Determine next version.
        var existingLatest = await _dbContext.Phase4CapTables
            .Find(c => c.CompanyId == companyId)
            .SortByDescending(c => c.Version)
            .FirstOrDefaultAsync();
        var nextVersion = (existingLatest?.Version ?? 0) + 1;

        var snapshot = new Phase4CapTable
        {
            Id = ObjectId.GenerateNewId().ToString(),
            CompanyId = companyId,
            Version = nextVersion,
            TotalShares = request.TotalShares,
            EsopPoolPercent = request.EsopPoolPercent,
            EsopVestingMonths = request.EsopVestingMonths,
            Grants = request.Grants.Select(g => new EquityGrant
            {
                GrantId = string.IsNullOrWhiteSpace(g.GrantId) ? ObjectId.GenerateNewId().ToString() : g.GrantId,
                StakeholderName = g.StakeholderName,
                StakeholderType = g.StakeholderType,
                ShareClass = (g.ShareClass ?? string.Empty).ToLowerInvariant(),
                SharesGranted = g.SharesGranted,
                InvestmentAmount = g.InvestmentAmount,
                GrantDate = g.GrantDate ?? DateTime.UtcNow,
                CliffMonths = g.CliffMonths,
                TotalVestMonths = g.TotalVestMonths,
            }).ToList(),
            RecordedAt = DateTime.UtcNow,
        };

        await _dbContext.Phase4CapTables.InsertOneAsync(snapshot);

        // Mirror the latest snapshot into the Companies model for legacy
        // consumers (validator already reads Phase4CapTables; this keeps Phase 3
        // and other callers consistent).
        company.TotalShares = snapshot.TotalShares;
        company.EsopPoolPercent = snapshot.EsopPoolPercent;
        company.EsopVestingMonths = snapshot.EsopVestingMonths;
        company.EquityStructure = snapshot.Grants.Select(g => new EquityEntryDto
        {
            StakeholderName = g.StakeholderName,
            Type = g.StakeholderType,
            SharesOwned = g.SharesGranted,
            VestingMonths = g.TotalVestMonths,
            InvestmentAmount = g.InvestmentAmount,
        }).ToList();
        company.UpdatedAt = DateTime.UtcNow;
        await _dbContext.Companies.ReplaceOneAsync(
            Builders<Companies>.Filter.Eq(c => c.Id, companyId), company);

        return MapCapTableSnapshot(snapshot);
    }

    public async Task<CapTableSnapshotResponse?> GetLatestCapTableSnapshotAsync(string companyId)
    {
        await GetCompanyAsync(companyId);
        var latest = await _dbContext.Phase4CapTables
            .Find(c => c.CompanyId == companyId)
            .SortByDescending(c => c.RecordedAt)
            .FirstOrDefaultAsync();
        return latest == null ? null : MapCapTableSnapshot(latest);
    }

    public async Task<List<VestingScheduleResponse>> SaveVestingSchedulesAsync(string companyId, SaveVestingScheduleRequest request)
    {
        if (request?.Entries == null || request.Entries.Count == 0)
            throw new ArgumentException("At least one vesting entry is required");

        foreach (var e in request.Entries)
        {
            if (string.IsNullOrWhiteSpace(e.StakeholderName))
                throw new ArgumentException("Vesting entry stakeholder name is required");
            if (e.SharesGranted <= 0)
                throw new ArgumentException($"Vesting entry for '{e.StakeholderName}': shares must be > 0");
            var ve = Phase4Requirements.ValidateVesting(e.CliffMonths, e.TotalVestMonths, e.StakeholderName);
            if (ve.Count > 0) throw new ArgumentException(string.Join("; ", ve));
        }

        await GetCompanyAsync(companyId);

        // Replace any existing schedules for the same GrantId (idempotent saves).
        foreach (var e in request.Entries)
        {
            var grantId = string.IsNullOrWhiteSpace(e.GrantId) ? ObjectId.GenerateNewId().ToString() : e.GrantId;
            var filter = Builders<Phase4VestingSchedule>.Filter.And(
                Builders<Phase4VestingSchedule>.Filter.Eq(x => x.CompanyId, companyId),
                Builders<Phase4VestingSchedule>.Filter.Eq(x => x.GrantId, grantId));

            var doc = new Phase4VestingSchedule
            {
                Id = ObjectId.GenerateNewId().ToString(),
                CompanyId = companyId,
                GrantId = grantId,
                StakeholderName = e.StakeholderName,
                SharesGranted = e.SharesGranted,
                GrantDate = e.GrantDate,
                CliffMonths = e.CliffMonths,
                TotalVestMonths = e.TotalVestMonths,
                RecordedAt = DateTime.UtcNow,
            };

            await _dbContext.Phase4VestingSchedules.ReplaceOneAsync(
                filter, doc, new ReplaceOptions { IsUpsert = true });
        }

        return await GetVestingSchedulesAsync(companyId);
    }

    public async Task<List<VestingScheduleResponse>> GetVestingSchedulesAsync(string companyId)
    {
        await GetCompanyAsync(companyId);
        var now = DateTime.UtcNow;
        var docs = await _dbContext.Phase4VestingSchedules
            .Find(v => v.CompanyId == companyId)
            .SortBy(v => v.GrantDate)
            .ToListAsync();

        return docs.Select(v =>
        {
            var months = Phase4Requirements.MonthsBetween(v.GrantDate, now);
            var pct = Phase4Requirements.ComputeVestedPercent(months, v.CliffMonths, v.TotalVestMonths);
            var shares = Phase4Requirements.ComputeVestedShares(v.SharesGranted, months, v.CliffMonths, v.TotalVestMonths);
            return new VestingScheduleResponse
            {
                GrantId = v.GrantId,
                StakeholderName = v.StakeholderName,
                SharesGranted = v.SharesGranted,
                GrantDate = v.GrantDate,
                CliffMonths = v.CliffMonths,
                TotalVestMonths = v.TotalVestMonths,
                VestedPercentNow = pct,
                VestedSharesNow = shares,
            };
        }).ToList();
    }

    public async Task<List<OwnershipHistoryResponse>> SaveOwnershipHistoryAsync(string companyId, SaveOwnershipHistoryRequest request)
    {
        if (request?.Entries == null || request.Entries.Count == 0)
            throw new ArgumentException("At least one ownership history entry is required");

        foreach (var e in request.Entries)
        {
            if (string.IsNullOrWhiteSpace(e.RoundName))
                throw new ArgumentException("Ownership history entry: roundName is required");
            if (e.FounderOwnershipBefore < 0 || e.FounderOwnershipBefore > 100 ||
                e.FounderOwnershipAfter < 0 || e.FounderOwnershipAfter > 100 ||
                e.InvestorOwnership < 0 || e.InvestorOwnership > 100 ||
                e.EsopOwnership < 0 || e.EsopOwnership > 100)
                throw new ArgumentException($"Ownership history '{e.RoundName}': percentages must be between 0 and 100");
            if (e.Valuation < 0)
                throw new ArgumentException($"Ownership history '{e.RoundName}': valuation must be >= 0");
        }

        await GetCompanyAsync(companyId);

        // Replace entire history for this company (idempotent on the full set).
        await _dbContext.Phase4OwnershipHistories.DeleteManyAsync(h => h.CompanyId == companyId);
        var docs = request.Entries.Select(e => new Phase4OwnershipHistory
        {
            Id = ObjectId.GenerateNewId().ToString(),
            CompanyId = companyId,
            RoundName = e.RoundName,
            EventDate = e.EventDate ?? DateTime.UtcNow,
            FounderOwnershipBefore = e.FounderOwnershipBefore,
            FounderOwnershipAfter = e.FounderOwnershipAfter,
            InvestorOwnership = e.InvestorOwnership,
            EsopOwnership = e.EsopOwnership,
            Valuation = e.Valuation,
            Notes = e.Notes,
            RecordedAt = DateTime.UtcNow,
        }).ToList();
        if (docs.Count > 0)
            await _dbContext.Phase4OwnershipHistories.InsertManyAsync(docs);

        return await GetOwnershipHistoryAsync(companyId);
    }

    public async Task<List<OwnershipHistoryResponse>> GetOwnershipHistoryAsync(string companyId)
    {
        await GetCompanyAsync(companyId);
        var docs = await _dbContext.Phase4OwnershipHistories
            .Find(h => h.CompanyId == companyId)
            .SortBy(h => h.EventDate)
            .ToListAsync();
        return docs.Select(MapOwnershipHistory).ToList();
    }

    public async Task<ShareIssuanceResponse> RecordShareIssuanceAsync(string companyId, RecordShareIssuanceRequest request)
    {
        if (request == null) throw new ArgumentException("Request body required");
        if (string.IsNullOrWhiteSpace(request.IssuedTo))
            throw new ArgumentException("issuedTo is required");
        if (!ShareClasses.IsValid(request.ShareClass))
            throw new ArgumentException($"Invalid share class '{request.ShareClass}'");
        if (request.SharesIssued <= 0)
            throw new ArgumentException("sharesIssued must be > 0");
        if (request.PricePerShare.HasValue && request.PricePerShare.Value < 0)
            throw new ArgumentException("pricePerShare must be >= 0");

        await GetCompanyAsync(companyId);

        var doc = new Phase4ShareIssuance
        {
            Id = ObjectId.GenerateNewId().ToString(),
            CompanyId = companyId,
            IssuedTo = request.IssuedTo,
            ShareClass = request.ShareClass.ToLowerInvariant(),
            SharesIssued = request.SharesIssued,
            PricePerShare = request.PricePerShare,
            Reason = request.Reason,
            IssuedAt = DateTime.UtcNow,
        };

        await _dbContext.Phase4ShareIssuances.InsertOneAsync(doc);

        return new ShareIssuanceResponse
        {
            IssuanceId = doc.Id,
            IssuedTo = doc.IssuedTo,
            ShareClass = doc.ShareClass,
            SharesIssued = doc.SharesIssued,
            PricePerShare = doc.PricePerShare,
            Reason = doc.Reason,
            IssuedAt = doc.IssuedAt,
        };
    }

    private static CapTableSnapshotResponse MapCapTableSnapshot(Phase4CapTable c) => new()
    {
        CapTableId = c.Id,
        Version = c.Version,
        TotalShares = c.TotalShares,
        EsopPoolPercent = c.EsopPoolPercent,
        EsopVestingMonths = c.EsopVestingMonths,
        RecordedAt = c.RecordedAt,
        Grants = c.Grants.Select(g => new EquityGrantDto
        {
            GrantId = g.GrantId,
            StakeholderName = g.StakeholderName,
            StakeholderType = g.StakeholderType,
            ShareClass = g.ShareClass,
            SharesGranted = g.SharesGranted,
            InvestmentAmount = g.InvestmentAmount,
            GrantDate = g.GrantDate,
            CliffMonths = g.CliffMonths,
            TotalVestMonths = g.TotalVestMonths,
        }).ToList(),
    };

    private static OwnershipHistoryResponse MapOwnershipHistory(Phase4OwnershipHistory h) => new()
    {
        RoundName = h.RoundName,
        EventDate = h.EventDate,
        FounderOwnershipBefore = h.FounderOwnershipBefore,
        FounderOwnershipAfter = h.FounderOwnershipAfter,
        InvestorOwnership = h.InvestorOwnership,
        EsopOwnership = h.EsopOwnership,
        Valuation = h.Valuation,
        Notes = h.Notes,
        RecordedAt = h.RecordedAt,
    };

    // ============ PHASE 5: FUNDING ASK & PITCH ============

    public async Task<PitchDeckResponse> UploadPitchDeckAsync(string companyId, PitchDeckUploadRequest request)
    {
        if (request?.File == null || request.File.Length == 0)
            throw new ArgumentException("Uploaded file is required");

        var company = await GetCompanyAsync(companyId);

        byte[] bytes;
        await using (var ms = new MemoryStream())
        {
            await request.File.CopyToAsync(ms);
            bytes = ms.ToArray();
        }

        var fileName = request.File.FileName;
        var storagePath = await _documentManager.SaveDocumentAsync(companyId, fileName, bytes);
        var uploadedAt = DateTime.UtcNow;

        company.PitchDeckFileName = fileName;
        company.PitchDeckUploadedAt = uploadedAt;
        company.PitchDeckStoragePath = storagePath;
        company.PitchDeckFileSize = request.File.Length;
        company.UpdatedAt = uploadedAt;

        await _dbContext.Companies.FindOneAndUpdateAsync(
            Builders<Companies>.Filter.Eq(c => c.Id, company.Id),
            Builders<Companies>.Update
                .Set(c => c.PitchDeckFileName, fileName)
                .Set(c => c.PitchDeckUploadedAt, uploadedAt)
                .Set(c => c.PitchDeckStoragePath, storagePath)
                .Set(c => c.PitchDeckFileSize, request.File.Length)
                .Set(c => c.UpdatedAt, uploadedAt));

        return new PitchDeckResponse
        {
            FileName = fileName,
            StoragePath = storagePath,
            FileSize = request.File.Length,
            UploadedAt = uploadedAt,
        };
    }

    public async Task<PitchDeckResponse?> GetPitchDeckAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);
        if (string.IsNullOrWhiteSpace(company.PitchDeckFileName)) return null;
        return new PitchDeckResponse
        {
            FileName = company.PitchDeckFileName,
            StoragePath = company.PitchDeckStoragePath,
            FileSize = company.PitchDeckFileSize ?? 0,
            UploadedAt = company.PitchDeckUploadedAt ?? DateTime.MinValue,
        };
    }

    public async Task<Companies> SaveFundingNarrativeAsync(string companyId, string narrative)
    {
        if (string.IsNullOrWhiteSpace(narrative))
            throw new ArgumentException("narrative is required");
        if (narrative.Trim().Length < Phase5Requirements.NarrativeMinLength)
            throw new ArgumentException(
                $"narrative must be at least {Phase5Requirements.NarrativeMinLength} characters");

        var company = await GetCompanyAsync(companyId);
        company.FundingNarrative = narrative;
        company.UpdatedAt = DateTime.UtcNow;

        var result = await _dbContext.Companies.FindOneAndUpdateAsync(
            Builders<Companies>.Filter.Eq(c => c.Id, company.Id),
            Builders<Companies>.Update
                .Set(c => c.FundingNarrative, narrative)
                .Set(c => c.UpdatedAt, DateTime.UtcNow),
            new FindOneAndUpdateOptions<Companies> { ReturnDocument = ReturnDocument.After }
        );

        return result ?? company;
    }

    public async Task<FundingNarrativeResponse> GetFundingNarrativeAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);
        return new FundingNarrativeResponse { Narrative = company.FundingNarrative ?? string.Empty };
    }

    public async Task<Companies> SaveOutreachCampaignAsync(string companyId, List<string> investorIds, string template)
    {
        if (string.IsNullOrWhiteSpace(template))
            throw new ArgumentException("template is required");

        var company = await GetCompanyAsync(companyId);

        // TODO: P1 - Queue background job for email outreach
        company.OutreachCampaignTemplate = template;
        company.OutreachInvestorList = investorIds ?? new List<string>();
        company.OutreachCampaignStartedAt = DateTime.UtcNow;
        company.UpdatedAt = DateTime.UtcNow;

        var result = await _dbContext.Companies.FindOneAndUpdateAsync(
            Builders<Companies>.Filter.Eq(c => c.Id, company.Id),
            Builders<Companies>.Update
                .Set(c => c.OutreachCampaignTemplate, template)
                .Set(c => c.OutreachInvestorList, company.OutreachInvestorList)
                .Set(c => c.OutreachCampaignStartedAt, DateTime.UtcNow)
                .Set(c => c.UpdatedAt, DateTime.UtcNow),
            new FindOneAndUpdateOptions<Companies> { ReturnDocument = ReturnDocument.After }
        );

        return result ?? company;
    }

    public async Task<FundingProfileResponse> GetFundingProfileAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);
        return new FundingProfileResponse
        {
            FundingAskAmount = company.FundingAskAmount,
            FundingRoundType = company.FundingRoundType,
            PreMoneyValuation = company.PreMoneyValuation,
            EquityOfferedPercent = company.EquityOfferedPercent,
            ShareType = company.ShareType,
            CapitalAllocation = company.CapitalAllocation ?? new List<CapitalAllocationDto>(),
            ResourceMap = company.ResourceMap,
            PitchDeckFileName = company.PitchDeckFileName,
            PitchDeckUploadedAt = company.PitchDeckUploadedAt,
            FundingNarrative = company.FundingNarrative,
            HasOutreachCampaign = !string.IsNullOrWhiteSpace(company.OutreachCampaignTemplate),
        };
    }

    // ============ PHASE 6: DATA ROOM ============

    public async Task<DataRoomDocumentResponse> UploadDataRoomDocumentAsync(string companyId, UploadDataRoomDocumentRequest request, string uploadedByUserId)
    {
        if (request?.File == null || request.File.Length == 0)
            throw new ArgumentException("Uploaded file is required");
        if (request.File.Length > Phase6Requirements.MaxFileSizeBytes)
            throw new ArgumentException(
                $"File size {request.File.Length} exceeds {Phase6Requirements.MaxFileSizeBytes}");
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new ArgumentException("title is required");
        if (request.Title.Length > Phase6Requirements.MaxTitleLength)
            throw new ArgumentException(
                $"title must be <= {Phase6Requirements.MaxTitleLength} characters");
        if (!Phase6Requirements.IsAllowedCategory(request.Category))
            throw new ArgumentException(
                $"category must be one of: {string.Join(", ", Phase6Requirements.AllowedCategories)}");

        var company = await GetCompanyAsync(companyId);

        byte[] bytes;
        await using (var ms = new MemoryStream())
        {
            await request.File.CopyToAsync(ms);
            bytes = ms.ToArray();
        }

        var fileName = request.File.FileName;
        var storagePath = await _documentManager.SaveDocumentAsync(companyId, fileName, bytes);

        var doc = new DataRoomDocumentResponse
        {
            DocumentId = ObjectId.GenerateNewId().ToString(),
            Title = request.Title,
            Category = request.Category.ToLowerInvariant(),
            Status = "draft",
            UploadedAt = DateTime.UtcNow,
            ViewCount = 0,
            DownloadCount = 0,
            FileName = fileName,
            MimeType = request.File.ContentType,
            FileSize = request.File.Length,
            StoragePath = storagePath,
            UploadedBy = uploadedByUserId,
        };

        if (company.DataRoomDocuments == null)
            company.DataRoomDocuments = new List<DataRoomDocumentResponse>();

        company.DataRoomDocuments.Add(doc);
        company.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Companies>.Filter.Eq(c => c.Id, companyId);
        await _dbContext.Companies.ReplaceOneAsync(filter, company);

        return doc;
    }

    public async Task<DataRoomStatusResponse> PublishDataRoomAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);
        var docs = company.DataRoomDocuments ?? new List<DataRoomDocumentResponse>();

        if (docs.Count < Phase6Requirements.MinDocumentCount)
            throw new InvalidOperationException(
                $"Cannot publish: need at least {Phase6Requirements.MinDocumentCount} documents (currently {docs.Count})");

        var uploadedCategories = docs
            .Select(d => (d.Category ?? string.Empty).ToLowerInvariant())
            .Distinct()
            .ToList();
        var missing = Phase6Requirements.RequiredCategories
            .Where(req => !uploadedCategories.Any(u => string.Equals(u, req, StringComparison.OrdinalIgnoreCase)))
            .ToList();
        if (missing.Count > 0)
            throw new InvalidOperationException(
                $"Cannot publish: missing required categories ({string.Join(", ", missing)})");

        foreach (var d in docs)
        {
            if (string.IsNullOrWhiteSpace(d.StoragePath))
                throw new InvalidOperationException(
                    $"Cannot publish: document '{d.FileName}' has no storagePath (malformed upload)");
            if (d.FileSize <= 0)
                throw new InvalidOperationException(
                    $"Cannot publish: document '{d.FileName}' has fileSize 0");
        }

        company.IsDataRoomLive = true;
        company.UpdatedAt = DateTime.UtcNow;

        await _dbContext.Companies.ReplaceOneAsync(
            Builders<Companies>.Filter.Eq(c => c.Id, companyId), company);

        return await GetDataRoomStatusAsync(companyId);
    }

    /// <summary>
    /// Centralised data-room access policy. Owner always passes. Non-owners
    /// must satisfy: room published, grant exists, grant not expired, NDA
    /// accepted when required, and (when <paramref name="requireDownloadPermission"/>
    /// is true) grant.AccessLevel is in <see cref="Phase6Requirements.DownloadPermittedAccessLevels"/>.
    ///
    /// Used by both <see cref="DownloadDataRoomDocumentAsync"/> and
    /// <see cref="TrackDataRoomEventAsync"/> so an analytics event can never
    /// be persisted unless the caller could have actually performed the action.
    /// </summary>
    private async Task EnsureDataRoomAccessAsync(
        Companies company, string callerUserId, bool callerIsOwner, bool requireDownloadPermission)
    {
        if (callerIsOwner) return;

        if (!company.IsDataRoomLive)
            throw new UnauthorizedAccessException("Data room is not published");

        var grant = company.DataRoomAccessRecords?
            .FirstOrDefault(g => string.Equals(g.InvestorId, callerUserId, StringComparison.Ordinal));
        if (grant == null)
            throw new UnauthorizedAccessException("No data-room access grant for this investor");
        if (grant.ExpiresAt != default && grant.ExpiresAt < DateTime.UtcNow)
            throw new UnauthorizedAccessException("Data-room access grant has expired");

        if (requireDownloadPermission && !Phase6Requirements.AccessLevelPermitsDownload(grant.AccessLevel))
            throw new UnauthorizedAccessException(
                $"Access level '{grant.AccessLevel}' does not permit downloads (requires one of: {string.Join(", ", Phase6Requirements.DownloadPermittedAccessLevels)})");

        if (company.IsDataRoomNdaRequired)
        {
            var nda = await _dbContext.Phase6NdaAcceptances
                .Find(n => n.CompanyId == company.Id && n.InvestorId == callerUserId)
                .FirstOrDefaultAsync();
            if (nda == null)
                throw new UnauthorizedAccessException("NDA acceptance is required");
        }
    }

    /// <summary>
    /// Download a data-room document. Owner can always download. Non-owner
    /// callers must satisfy the centralised access policy AND have an
    /// access-level that permits downloads (download | full_access).
    /// </summary>
    public async Task<(byte[] Content, DataRoomDocumentResponse Document)> DownloadDataRoomDocumentAsync(
        string companyId, string documentId, string callerUserId, bool callerIsOwner)
    {
        var company = await GetCompanyAsync(companyId);
        var doc = company.DataRoomDocuments?
            .FirstOrDefault(d => string.Equals(d.DocumentId, documentId, StringComparison.Ordinal));
        if (doc == null)
            throw new KeyNotFoundException($"Document {documentId} not found");
        if (string.IsNullOrWhiteSpace(doc.StoragePath))
            throw new InvalidOperationException("Document storage path is missing");

        await EnsureDataRoomAccessAsync(company, callerUserId, callerIsOwner, requireDownloadPermission: true);

        var bytes = await File.ReadAllBytesAsync(doc.StoragePath);
        return (bytes, doc);
    }

    public async Task<Phase6AccessLogResponse> TrackDataRoomEventAsync(
        string companyId, string documentId, string investorId, bool callerIsOwner, string eventType, string ipHash)
    {
        if (!Phase6Requirements.IsTrackableEventType(eventType))
            throw new ArgumentException($"eventType must be '{Phase6Requirements.EventTypeView}' or '{Phase6Requirements.EventTypeDownload}'");

        var company = await GetCompanyAsync(companyId);
        var doc = company.DataRoomDocuments?
            .FirstOrDefault(d => string.Equals(d.DocumentId, documentId, StringComparison.Ordinal));
        if (doc == null)
            throw new KeyNotFoundException($"Document {documentId} not found");

        // SAME authorization policy as real access. track-download additionally
        // requires the download access-level so view_only / comment grants
        // cannot poison the download counter.
        var requireDownload = string.Equals(eventType, Phase6Requirements.EventTypeDownload, StringComparison.OrdinalIgnoreCase);
        await EnsureDataRoomAccessAsync(company, investorId, callerIsOwner, requireDownloadPermission: requireDownload);

        var log = new Phase6AccessLog
        {
            Id = ObjectId.GenerateNewId().ToString(),
            CompanyId = companyId,
            DocumentId = documentId,
            InvestorId = investorId,
            EventType = eventType.ToLowerInvariant(),
            OccurredAt = DateTime.UtcNow,
            IpHash = ipHash,
        };
        await _dbContext.Phase6AccessLogs.InsertOneAsync(log);

        // Increment the denormalised counter on the embedded document for
        // cheap UI reads (analytics still derives from the log collection).
        var docFilter = Builders<Companies>.Filter.And(
            Builders<Companies>.Filter.Eq(c => c.Id, companyId),
            Builders<Companies>.Filter.ElemMatch(c => c.DataRoomDocuments, d => d.DocumentId == documentId));
        var update = string.Equals(eventType, Phase6Requirements.EventTypeView, StringComparison.OrdinalIgnoreCase)
            ? Builders<Companies>.Update.Inc("DataRoomDocuments.$.ViewCount", 1)
            : Builders<Companies>.Update.Inc("DataRoomDocuments.$.DownloadCount", 1);
        await _dbContext.Companies.UpdateOneAsync(docFilter, update);

        return new Phase6AccessLogResponse
        {
            Id = log.Id,
            DocumentId = log.DocumentId,
            InvestorId = log.InvestorId,
            EventType = log.EventType,
            OccurredAt = log.OccurredAt,
        };
    }

    public async Task<DataRoomAnalyticsResponse> GetDataRoomAnalyticsAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);
        var docs = company.DataRoomDocuments ?? new List<DataRoomDocumentResponse>();

        var logs = await _dbContext.Phase6AccessLogs
            .Find(l => l.CompanyId == companyId)
            .ToListAsync();

        var docEngagement = docs.Select(d =>
        {
            var docLogs = logs.Where(l => l.DocumentId == d.DocumentId).ToList();
            return new DocumentEngagementResponse
            {
                DocumentId = d.DocumentId,
                Title = d.Title,
                Category = d.Category,
                ViewCount = docLogs.Count(l => l.EventType == Phase6Requirements.EventTypeView),
                DownloadCount = docLogs.Count(l => l.EventType == Phase6Requirements.EventTypeDownload),
                UniqueInvestors = docLogs.Select(l => l.InvestorId).Distinct().Count(),
                LastEventAt = docLogs.OrderByDescending(l => l.OccurredAt).FirstOrDefault()?.OccurredAt,
            };
        }).ToList();

        var investorEngagement = logs
            .GroupBy(l => l.InvestorId)
            .Select(g => new InvestorEngagementResponse
            {
                InvestorId = g.Key,
                ViewCount = g.Count(l => l.EventType == Phase6Requirements.EventTypeView),
                DownloadCount = g.Count(l => l.EventType == Phase6Requirements.EventTypeDownload),
                DocumentsTouched = g.Select(l => l.DocumentId).Distinct().Count(),
                LastEventAt = g.OrderByDescending(l => l.OccurredAt).First().OccurredAt,
            })
            .OrderByDescending(i => i.LastEventAt)
            .ToList();

        return new DataRoomAnalyticsResponse
        {
            TotalDocuments = docs.Count,
            TotalViews = logs.Count(l => l.EventType == Phase6Requirements.EventTypeView),
            TotalDownloads = logs.Count(l => l.EventType == Phase6Requirements.EventTypeDownload),
            UniqueInvestorsEngaged = logs.Select(l => l.InvestorId).Distinct().Count(),
            DocumentEngagement = docEngagement,
            InvestorEngagement = investorEngagement,
        };
    }

    public async Task<List<Phase6AccessLogResponse>> GetDataRoomActivityTimelineAsync(string companyId)
    {
        await GetCompanyAsync(companyId);
        var logs = await _dbContext.Phase6AccessLogs
            .Find(l => l.CompanyId == companyId)
            .SortByDescending(l => l.OccurredAt)
            .ToListAsync();
        return logs.Select(l => new Phase6AccessLogResponse
        {
            Id = l.Id,
            DocumentId = l.DocumentId,
            InvestorId = l.InvestorId,
            EventType = l.EventType,
            OccurredAt = l.OccurredAt,
        }).ToList();
    }

    public async Task AcceptDataRoomNdaAsync(string companyId, string investorId, string ndaText, string ipHash)
    {
        await GetCompanyAsync(companyId);

        var ndaTextHash = Convert.ToHexString(
            System.Security.Cryptography.SHA256.HashData(
                System.Text.Encoding.UTF8.GetBytes(ndaText ?? string.Empty)));

        var nda = new Phase6NdaAcceptance
        {
            Id = ObjectId.GenerateNewId().ToString(),
            CompanyId = companyId,
            InvestorId = investorId,
            AcceptedAt = DateTime.UtcNow,
            NdaTextHash = ndaTextHash,
            IpHash = ipHash,
        };

        var filter = Builders<Phase6NdaAcceptance>.Filter.And(
            Builders<Phase6NdaAcceptance>.Filter.Eq(n => n.CompanyId, companyId),
            Builders<Phase6NdaAcceptance>.Filter.Eq(n => n.InvestorId, investorId));
        await _dbContext.Phase6NdaAcceptances.ReplaceOneAsync(
            filter, nda, new ReplaceOptions { IsUpsert = true });
    }

    public async Task<DataRoomStatusResponse> GetDataRoomStatusAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);

        return new DataRoomStatusResponse
        {
            IsLive = company.IsDataRoomLive,
            NdaRequired = company.IsDataRoomNdaRequired,
            TotalDocuments = company.DataRoomDocuments?.Count ?? 0,
            Documents = company.DataRoomDocuments ?? new List<DataRoomDocumentResponse>(),
            AccessGrants = company.DataRoomAccessRecords ?? new List<DataRoomAccessRecord>()
        };
    }

    public async Task<DataRoomStatusResponse> GrantDataRoomAccessAsync(string companyId, DataRoomAccessRequest request)
    {
        var company = await GetCompanyAsync(companyId);

        var accessRecord = new DataRoomAccessRecord
        {
            InvestorId = request.InvestorId,
            AccessLevel = request.AccessLevel,
            GrantedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(request.DaysValid)
        };

        if (company.DataRoomAccessRecords == null)
            company.DataRoomAccessRecords = new List<DataRoomAccessRecord>();

        company.DataRoomAccessRecords.Add(accessRecord);
        company.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Companies>.Filter.Eq(c => c.Id, companyId);
        await _dbContext.Companies.ReplaceOneAsync(filter, company);

        return await GetDataRoomStatusAsync(companyId);
    }

    public async Task RevokeDataRoomAccessAsync(string companyId, string investorId)
    {
        var company = await GetCompanyAsync(companyId);

        if (company.DataRoomAccessRecords != null)
        {
            company.DataRoomAccessRecords = company.DataRoomAccessRecords
                .Where(r => r.InvestorId != investorId)
                .ToList();

            company.UpdatedAt = DateTime.UtcNow;
            var filter = Builders<Companies>.Filter.Eq(c => c.Id, companyId);
            await _dbContext.Companies.ReplaceOneAsync(filter, company);
        }
    }

    public async Task UpdateNdaRequirementAsync(string companyId, bool required)
    {
        var company = await GetCompanyAsync(companyId);
        company.IsDataRoomNdaRequired = required;
        company.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Companies>.Filter.Eq(c => c.Id, companyId);
        await _dbContext.Companies.ReplaceOneAsync(filter, company);
    }

    // ============ PHASE 7: AI REVIEW ============

    public async Task<AiReviewResponse> RunAiReviewAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);

        var review = await _aiReviewEngine.RunReviewAsync(company);

        // Mirror the latest snapshot to the company doc for the cheap
        // "current score" read path used by the frontend.
        company.AiReview = review;
        company.LastAiReviewAt = review.ReviewedAt;
        company.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Companies>.Filter.Eq(c => c.Id, companyId);
        await _dbContext.Companies.ReplaceOneAsync(filter, company);

        // Persist an immutable history snapshot so trends + the badge-award
        // audit trail survive future re-runs.
        var snapshot = new Phase7ReviewSnapshot
        {
            Id = ObjectId.GenerateNewId().ToString(),
            CompanyId = companyId,
            OverallScore = review.OverallScore,
            ScoreBreakdown = review.ScoreBreakdown,
            InvestorReadyBadge = review.InvestorReadyBadge,
            Recommendations = review.Recommendations ?? new List<RecommendationDto>(),
            ReviewedAt = review.ReviewedAt,
            EngineVersion = "rule_based_v1",
        };
        await _dbContext.Phase7ReviewSnapshots.InsertOneAsync(snapshot);

        return review;
    }

    public async Task<AiReviewResponse> GetAiReviewScoreAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);
        return company.AiReview ?? throw new InvalidOperationException("No automated review found for this company");
    }

    public async Task<List<RecommendationDto>> GetRecommendationsAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);
        return company.AiReview?.Recommendations ?? new List<RecommendationDto>();
    }

    public async Task<List<Phase7ReviewSnapshot>> GetAiReviewHistoryAsync(string companyId)
    {
        await GetCompanyAsync(companyId);
        return await _dbContext.Phase7ReviewSnapshots
            .Find(s => s.CompanyId == companyId)
            .SortByDescending(s => s.ReviewedAt)
            .ToListAsync();
    }

    public async Task AwardInvestorReadyBadgeAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);

        // Hard precondition: a valid, passing review must exist on the
        // company. Without this gate, a direct POST /investor-ready can
        // fake the company-level IsInvestorReady flag — visible downstream
        // even though the validator catches the spoof at advancePhase time.
        if (company.AiReview == null)
            throw new InvalidOperationException("Cannot award badge: no automated review has been run");
        if (!Phase7Requirements.MeetsBadgeThreshold(company.AiReview.OverallScore))
            throw new InvalidOperationException(
                $"Cannot award badge: review score {company.AiReview.OverallScore} is below the {Phase7Requirements.ScoreThresholdForBadge} threshold");
        if (!company.AiReview.InvestorReadyBadge)
            throw new InvalidOperationException(
                "Cannot award badge: latest review did not award InvestorReadyBadge");

        // Freshness gate: same window the phase validator enforces. Without
        // this, a stale-but-passing review can be used to flip IsInvestorReady
        // long after the underlying Phase 2-6 data has drifted.
        var reviewedAt = company.LastAiReviewAt ?? company.AiReview.ReviewedAt;
        if (!Phase7Requirements.IsFreshEnough(reviewedAt))
        {
            throw new InvalidOperationException(
                "Cannot award badge: latest automated review is stale. Rerun the review before awarding investor-ready status.");
        }

        company.IsInvestorReady = true;
        company.InvestorReadyBadgeAwardedAt = DateTime.UtcNow;
        company.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Companies>.Filter.Eq(c => c.Id, companyId);
        await _dbContext.Companies.ReplaceOneAsync(filter, company);
    }

    // ============ PHASE 8: INVESTOR MATCHING ============

    public async Task<List<InvestorMatchResponse>> GetMatchedInvestorsAsync(string companyId)
    {
        var matches = await _dbContext.InvestorMatches
            .Find(m => m.CompanyId == companyId)
            .SortByDescending(m => m.MatchScore)
            .ToListAsync();

        // Serve from the immutable snapshot fields persisted by the matcher
        // at creation time. The live Investor record is consulted only as a
        // backfill for legacy rows that pre-date the snapshot — never as the
        // primary read path. This guarantees no null-filled investor cards
        // even if the live Investor record has been deleted or mutated.
        var results = new List<InvestorMatchResponse>();
        foreach (var m in matches)
        {
            var investorName = m.InvestorNameSnapshot;
            var investorType = m.InvestorTypeSnapshot;
            var investmentRange = m.InvestmentRangeSnapshot;
            var preferredSectors = m.PreferredSectorsSnapshot?.Count > 0
                ? m.PreferredSectorsSnapshot
                : m.InvestorPreferences?.PreferredSectors ?? new List<string>();

            // Legacy backfill: rows that pre-date the snapshot fields will
            // have null snapshots. Try the live Investor record to populate.
            if (string.IsNullOrWhiteSpace(investorName) || string.IsNullOrWhiteSpace(investorType))
            {
                try
                {
                    var investor = await _dbContext.Investors
                        .Find(i => i.Id == m.InvestorId)
                        .FirstOrDefaultAsync();
                    if (investor != null)
                    {
                        investorName ??= investor.Name;
                        investorType ??= investor.Type;
                        if (string.IsNullOrWhiteSpace(investmentRange) && investor.MaxCheckSize > 0)
                            investmentRange = $"EUR {investor.MinCheckSize:N0}-{investor.MaxCheckSize:N0}";
                        if (preferredSectors.Count == 0)
                            preferredSectors = investor.PreferredSectors ?? new List<string>();
                    }
                }
                catch
                {
                    // Live investor lookup failed; fall through to the
                    // hard-fallback below so the response never carries null.
                }
            }

            results.Add(new InvestorMatchResponse
            {
                MatchId = m.Id,
                InvestorId = m.InvestorId,
                InvestorName = !string.IsNullOrWhiteSpace(investorName) ? investorName : m.InvestorId,
                MatchScore = m.MatchScore,
                InvestorType = !string.IsNullOrWhiteSpace(investorType) ? investorType : "(unknown)",
                PreferredRound = m.InvestorPreferences?.PreferredStages?.FirstOrDefault() ?? "(unspecified)",
                InvestmentRange = !string.IsNullOrWhiteSpace(investmentRange) ? investmentRange : "EUR (range unset)",
                PreferredSectors = preferredSectors,
                Status = m.Status,
                MatchRationale = m.MatchRationale,
                EngineVersion = m.EngineVersion,
                MatchedAt = m.MatchedAt,
                SavedAt = m.SavedAt,
                AcceptedAt = m.AcceptedAt,
                RejectedAt = m.RejectedAt,
            });
        }
        return results;
    }

    public async Task<List<InvestorMatchResponse>> RegenerateInvestorMatchesAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);
        await _investorMatcher.FindMatchesAsync(company, investorPoolIds: null);
        return await GetMatchedInvestorsAsync(companyId);
    }

    public async Task RecordInvestorInteractionAsync(string companyId, RecordInteractionRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.MatchId))
            throw new ArgumentException("matchId is required");
        if (!Phase8Requirements.IsValidInteractionType(request.InteractionType))
            throw new ArgumentException(
                $"interactionType must be one of: {string.Join(", ", Phase8Requirements.AllowedInteractionTypes)}");

        var match = await _dbContext.InvestorMatches
            .Find(m => m.Id == request.MatchId && m.CompanyId == companyId)
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException($"Match {request.MatchId} not found");

        var interaction = new InteractionRecord
        {
            Type = request.InteractionType.ToLowerInvariant(),
            Details = request.Details,
            Timestamp = DateTime.UtcNow,
            InitiatedBy = "company"
        };

        match.Interactions.Add(interaction);
        match.LastInteractionAt = DateTime.UtcNow;
        match.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<InvestorMatch>.Filter.Eq(m => m.Id, match.Id);
        await _dbContext.InvestorMatches.ReplaceOneAsync(filter, match);
    }

    public async Task<InvestorMatchResponse> UpdateMatchStatusAsync(string companyId, string matchId, string status)
    {
        if (!Phase8Requirements.IsValidMatchStatus(status))
            throw new ArgumentException(
                $"status must be one of: {string.Join(", ", Phase8Requirements.AllowedMatchStatuses)}");

        var match = await _dbContext.InvestorMatches
            .Find(m => m.Id == matchId && m.CompanyId == companyId)
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException($"Match {matchId} not found");

        match.Status = status.ToLowerInvariant();
        match.UpdatedAt = DateTime.UtcNow;

        // Record decisive transitions so the audit trail survives later
        // status changes.
        switch (match.Status)
        {
            case "saved": match.SavedAt = DateTime.UtcNow; break;
            case "accepted": match.AcceptedAt = DateTime.UtcNow; break;
            case "rejected": match.RejectedAt = DateTime.UtcNow; break;
        }

        var filter = Builders<InvestorMatch>.Filter.Eq(m => m.Id, match.Id);
        await _dbContext.InvestorMatches.ReplaceOneAsync(filter, match);

        var hydrated = await GetMatchedInvestorsAsync(companyId);
        return hydrated.FirstOrDefault(r => r.MatchId == matchId);
    }

    public async Task<MatchingInsightsResponse> GetMatchingInsightsAsync(string companyId)
    {
        var matches = await _dbContext.InvestorMatches
            .Find(m => m.CompanyId == companyId)
            .ToListAsync();

        var interactionsCount = matches.Sum(m => m.Interactions?.Count ?? 0);
        var average = matches.Count > 0 ? matches.Average(m => (double)m.MatchScore) : 0;
        var lastMatchedAt = matches.OrderByDescending(m => m.MatchedAt).FirstOrDefault()?.MatchedAt;

        return new MatchingInsightsResponse
        {
            TotalMatches = matches.Count,
            HighScoreMatches = matches.Count(m => m.MatchScore >= Phase8Requirements.MinScoreToCount),
            InteractionsCount = interactionsCount,
            AverageScore = Math.Round(average, 2),
            LastMatchedAt = lastMatchedAt,
        };
    }

    // ============ PHASE 9: DEAL EXECUTION ============

    public async Task<DealStatusResponse> CreateDealAsync(string companyId, CreateDealRequest request, string actorUserId, string ipHash)
    {
        if (request == null) throw new ArgumentException("Request body required");
        if (string.IsNullOrWhiteSpace(request.InvestorId))
            throw new ArgumentException("investorId is required");
        if (request.TermSheet == null)
            throw new ArgumentException("termSheet is required");
        if (!double.IsFinite(request.TermSheet.TotalRaiseAmount) || request.TermSheet.TotalRaiseAmount <= 0)
            throw new ArgumentException("termSheet.totalRaiseAmount must be > 0");
        if (!double.IsFinite(request.TermSheet.PostMoneyValuation) || request.TermSheet.PostMoneyValuation <= 0)
            throw new ArgumentException("termSheet.postMoneyValuation must be > 0");

        // InvestorId must resolve to a live Investor row. Without this, callers
        // can spawn deals against arbitrary strings and the deal timeline will
        // render orphaned investor identities forever.
        var investor = await _dbContext.Investors
            .Find(i => i.Id == request.InvestorId)
            .FirstOrDefaultAsync()
            ?? throw new ArgumentException($"investorId '{request.InvestorId}' does not match any investor");

        var dealId = ObjectId.GenerateNewId().ToString();
        var deal = new DealExecution
        {
            Id = dealId,
            CompanyId = companyId,
            Status = Phase9Requirements.DealStatusInitiated,
            InvestorNameSnapshot = investor.Name,
            InvestorTypeSnapshot = investor.Type,
            CreatedByUserId = actorUserId,
            Investors = new List<DealParticipant>
            {
                new DealParticipant
                {
                    InvestorId = request.InvestorId,
                    InvestorName = investor.Name,
                    CommittedAmount = request.TermSheet.TotalRaiseAmount,
                    Status = Phase9Requirements.ParticipantStatusInterested,
                    EquityPercentage = (request.TermSheet.TotalRaiseAmount / request.TermSheet.PostMoneyValuation) * 100,
                }
            },
            TermSheet = new TermSheet
            {
                TotalRaiseAmount = request.TermSheet.TotalRaiseAmount,
                PostMoneyValuation = request.TermSheet.PostMoneyValuation,
                EquityType = request.TermSheet.EquityType,
                ProRataRights = request.TermSheet.ProRataRights,
                LiquidationPreference = request.TermSheet.LiquidationPreference,
                BoardSeats = request.TermSheet.BoardSeats,
                ProposedClosingDate = request.TermSheet.ProposedClosingDate,
                Status = Phase9Requirements.TermSheetStatusDraft,
            },
            DueDiligenceChecklist = new List<DueDigligenceItem>(),
            ClosingChecklist = new List<ClosingChecklistItem>(),
            Milestones = new List<DealMilestone>(),
            NegotiationStatus = new DealNegotiationStatus(),
            DealDocuments = new List<DealDocument>(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        await _dbContext.DealExecutions.InsertOneAsync(deal);

        await AppendDealActivityAsync(
            companyId, dealId,
            Phase9Requirements.ActivityDealCreated,
            fromStatus: null,
            toStatus: deal.Status,
            actorUserId, ipHash,
            notes: $"Deal created with investor {investor.Name}");

        return MapDealToResponse(deal);
    }

    public async Task<DealStatusResponse> GetDealAsync(string dealId)
    {
        var deal = await _dbContext.DealExecutions
            .Find(d => d.Id == dealId)
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException($"Deal {dealId} not found");

        return MapDealToResponse(deal);
    }

    public async Task<string?> GetDealCompanyIdAsync(string dealId)
    {
        var deal = await _dbContext.DealExecutions
            .Find(d => d.Id == dealId)
            .Project(d => d.CompanyId)
            .FirstOrDefaultAsync();

        return deal;
    }

    public async Task<List<DealStatusResponse>> GetCompanyDealsAsync(string companyId)
    {
        var deals = await _dbContext.DealExecutions
            .Find(d => d.CompanyId == companyId)
            .ToListAsync();

        return deals.Select(MapDealToResponse).ToList();
    }

    public async Task<DealStatusResponse> UpdateTermSheetAsync(string dealId, TermSheetRequest request, string actorUserId, string ipHash)
    {
        if (request == null) throw new ArgumentException("Request body required");
        if (!double.IsFinite(request.TotalRaiseAmount) || request.TotalRaiseAmount <= 0)
            throw new ArgumentException("totalRaiseAmount must be > 0");
        if (!double.IsFinite(request.PostMoneyValuation) || request.PostMoneyValuation <= 0)
            throw new ArgumentException("postMoneyValuation must be > 0");

        var deal = await GetDealOrThrowAsync(dealId);

        if (Phase9Requirements.IsTerminalDealStatus(deal.Status))
            throw new InvalidOperationException(
                $"Cannot update term sheet on deal in terminal status '{deal.Status}'");

        // Term-sheet status auto-transitions to 'negotiating' from any
        // pre-signed state. Enforce the transition graph rather than just
        // overwriting.
        var fromTsStatus = deal.TermSheet.Status ?? Phase9Requirements.TermSheetStatusDraft;
        var toTsStatus = Phase9Requirements.TermSheetStatusNegotiating;
        if (!string.Equals(fromTsStatus, toTsStatus, StringComparison.OrdinalIgnoreCase) &&
            !Phase9Requirements.IsValidTermSheetTransition(fromTsStatus, toTsStatus))
            throw new InvalidOperationException(
                $"Illegal term sheet transition '{fromTsStatus}' -> '{toTsStatus}'");

        deal.TermSheet.TotalRaiseAmount = request.TotalRaiseAmount;
        deal.TermSheet.PostMoneyValuation = request.PostMoneyValuation;
        deal.TermSheet.EquityType = request.EquityType;
        deal.TermSheet.ProRataRights = request.ProRataRights;
        deal.TermSheet.LiquidationPreference = request.LiquidationPreference;
        deal.TermSheet.BoardSeats = request.BoardSeats;
        deal.TermSheet.ProposedClosingDate = request.ProposedClosingDate;
        deal.TermSheet.Status = toTsStatus;
        deal.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<DealExecution>.Filter.Eq(d => d.Id, dealId);
        await _dbContext.DealExecutions.ReplaceOneAsync(filter, deal);

        await AppendDealActivityAsync(
            deal.CompanyId, dealId,
            Phase9Requirements.ActivityTermSheetUpdated,
            fromStatus: fromTsStatus, toStatus: toTsStatus,
            actorUserId, ipHash, notes: null);

        return MapDealToResponse(deal);
    }

    public async Task<DealStatusResponse> ProgressChecklistAsync(string dealId, ChecklistItemDto item, string actorUserId, string ipHash)
    {
        if (item == null || string.IsNullOrWhiteSpace(item.Item))
            throw new ArgumentException("checklist item.Item is required");

        var deal = await GetDealOrThrowAsync(dealId);

        if (Phase9Requirements.IsTerminalDealStatus(deal.Status))
            throw new InvalidOperationException(
                $"Cannot mutate checklist on deal in terminal status '{deal.Status}'");

        var checklistItem = deal.ClosingChecklist.FirstOrDefault(c =>
            string.Equals(c.Item, item.Item, StringComparison.Ordinal));
        if (checklistItem == null)
        {
            // Insert if missing — UI may create + complete in the same call.
            checklistItem = new ClosingChecklistItem
            {
                Item = item.Item,
                Owner = item.Owner,
                DueDate = item.DueDate,
            };
            deal.ClosingChecklist.Add(checklistItem);
        }
        checklistItem.Completed = item.Completed;
        if (item.Completed)
            checklistItem.CompletedAt = DateTime.UtcNow;
        else
            checklistItem.CompletedAt = null;

        deal.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<DealExecution>.Filter.Eq(d => d.Id, dealId);
        await _dbContext.DealExecutions.ReplaceOneAsync(filter, deal);

        await AppendDealActivityAsync(
            deal.CompanyId, dealId,
            Phase9Requirements.ActivityChecklistUpdated,
            fromStatus: null, toStatus: null,
            actorUserId, ipHash,
            notes: $"{item.Item}: {(item.Completed ? "completed" : "reopened")}");

        return MapDealToResponse(deal);
    }

    public async Task<DealStatusResponse> CloseDealAsync(string dealId, string actorUserId, string ipHash)
    {
        var deal = await GetDealOrThrowAsync(dealId);

        // Close = transition Status -> "completed". Enforced via the deal
        // state machine, so callers can't bypass the "signed" precondition.
        var from = deal.Status;
        var to = Phase9Requirements.DealStatusCompleted;
        if (!Phase9Requirements.IsValidDealTransition(from, to))
            throw new InvalidOperationException(
                $"Cannot close deal: illegal transition '{from}' -> '{to}'. Deal must be in 'signed' before completion.");

        deal.Status = to;
        deal.ClosedAt = DateTime.UtcNow;
        deal.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<DealExecution>.Filter.Eq(d => d.Id, dealId);
        await _dbContext.DealExecutions.ReplaceOneAsync(filter, deal);

        await AppendDealActivityAsync(
            deal.CompanyId, dealId,
            Phase9Requirements.ActivityDealClosed,
            fromStatus: from, toStatus: to,
            actorUserId, ipHash, notes: null);

        return MapDealToResponse(deal);
    }

    public async Task<DealStatusResponse> UpdateDealStatusAsync(string dealId, UpdateDealStatusRequest request, string actorUserId, string ipHash)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Status))
            throw new ArgumentException("status is required");
        if (!Phase9Requirements.IsValidDealStatus(request.Status))
            throw new ArgumentException(
                $"status must be one of: {string.Join(", ", Phase9Requirements.DealStatusWhitelist)}");

        var deal = await GetDealOrThrowAsync(dealId);

        var from = deal.Status;
        var to = request.Status.ToLowerInvariant();

        if (string.Equals(from, to, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"Deal is already in status '{to}'");

        if (!Phase9Requirements.IsValidDealTransition(from, to))
            throw new InvalidOperationException(
                $"Illegal deal status transition '{from}' -> '{to}'");

        deal.Status = to;
        deal.UpdatedAt = DateTime.UtcNow;
        if (string.Equals(to, Phase9Requirements.DealStatusCompleted, StringComparison.OrdinalIgnoreCase))
            deal.ClosedAt = DateTime.UtcNow;

        var filter = Builders<DealExecution>.Filter.Eq(d => d.Id, dealId);
        await _dbContext.DealExecutions.ReplaceOneAsync(filter, deal);

        await AppendDealActivityAsync(
            deal.CompanyId, dealId,
            Phase9Requirements.ActivityDealStatusChanged,
            fromStatus: from, toStatus: to,
            actorUserId, ipHash, notes: request.Notes);

        return MapDealToResponse(deal);
    }

    public async Task<DealStatusResponse> SignTermSheetAsync(string dealId, SignTermSheetRequest request, string actorUserId, string ipHash)
    {
        if (request?.File == null || request.File.Length == 0)
            throw new ArgumentException("Signed term sheet file is required");
        if (request.File.Length > Phase9Requirements.MaxDealDocumentSizeBytes)
            throw new ArgumentException(
                $"File size {request.File.Length} exceeds {Phase9Requirements.MaxDealDocumentSizeBytes}");

        var deal = await GetDealOrThrowAsync(dealId);

        if (Phase9Requirements.IsTerminalDealStatus(deal.Status))
            throw new InvalidOperationException(
                $"Cannot sign term sheet on deal in terminal status '{deal.Status}'");

        // Term-sheet axis transition: anything -> signed must be a legal
        // transition. (draft/proposed/negotiating must move via 'agreed'
        // first; the graph captures that.)
        var fromTs = deal.TermSheet.Status ?? Phase9Requirements.TermSheetStatusDraft;
        var toTs = Phase9Requirements.TermSheetStatusSigned;
        if (!Phase9Requirements.IsValidTermSheetTransition(fromTs, toTs))
            throw new InvalidOperationException(
                $"Illegal term sheet transition '{fromTs}' -> '{toTs}'. Mark as 'agreed' before signing.");

        // Persist the signed-agreement file.
        byte[] bytes;
        await using (var ms = new MemoryStream())
        {
            await request.File.CopyToAsync(ms);
            bytes = ms.ToArray();
        }
        var storagePath = await _documentManager.SaveDocumentAsync(deal.CompanyId, request.File.FileName, bytes);

        var doc = new DealDocument
        {
            DocumentId = ObjectId.GenerateNewId().ToString(),
            FileName = request.File.FileName,
            StoragePath = storagePath,
            FileSize = request.File.Length,
            MimeType = request.File.ContentType,
            DocumentKind = "term_sheet",
            UploadedBy = actorUserId,
            UploadedAt = DateTime.UtcNow,
        };
        deal.DealDocuments.Add(doc);

        deal.TermSheet.Status = toTs;
        deal.TermSheet.SignedAt = DateTime.UtcNow;
        deal.TermSheet.SignedDocumentId = doc.DocumentId;

        // Deal axis side-effect: from agreement_sent -> signed. Other states
        // simply persist the term-sheet artefact without moving the deal axis.
        string fromDeal = deal.Status;
        string toDeal = deal.Status;
        if (Phase9Requirements.IsValidDealTransition(deal.Status, Phase9Requirements.DealStatusSigned))
        {
            toDeal = Phase9Requirements.DealStatusSigned;
            deal.Status = toDeal;
        }
        deal.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<DealExecution>.Filter.Eq(d => d.Id, dealId);
        await _dbContext.DealExecutions.ReplaceOneAsync(filter, deal);

        await AppendDealActivityAsync(
            deal.CompanyId, dealId,
            Phase9Requirements.ActivityTermSheetSigned,
            fromStatus: fromDeal, toStatus: toDeal,
            actorUserId, ipHash,
            notes: $"Term sheet signed (document {doc.DocumentId})");

        return MapDealToResponse(deal);
    }

    public async Task<DealStatusResponse> MutateDueDiligenceItemAsync(string dealId, MutateDueDiligenceItemRequest request, string actorUserId, string ipHash)
    {
        if (request == null) throw new ArgumentException("Request body required");
        if (string.IsNullOrWhiteSpace(request.ItemName))
            throw new ArgumentException("itemName is required");
        if (!Phase9Requirements.IsValidDueDiligenceCategory(request.Category))
            throw new ArgumentException(
                $"category must be one of: {string.Join(", ", Phase9Requirements.DueDiligenceCategoryWhitelist)}");
        if (!Phase9Requirements.IsValidDueDiligenceStatus(request.Status))
            throw new ArgumentException(
                $"status must be one of: {string.Join(", ", Phase9Requirements.DueDiligenceStatusWhitelist)}");

        var deal = await GetDealOrThrowAsync(dealId);

        if (Phase9Requirements.IsTerminalDealStatus(deal.Status))
            throw new InvalidOperationException(
                $"Cannot mutate diligence items on deal in terminal status '{deal.Status}'");

        var existing = deal.DueDiligenceChecklist
            .FirstOrDefault(d => string.Equals(d.ItemName, request.ItemName, StringComparison.Ordinal));
        if (existing == null)
        {
            existing = new DueDigligenceItem
            {
                ItemName = request.ItemName,
                CreatedAt = DateTime.UtcNow,
            };
            deal.DueDiligenceChecklist.Add(existing);
        }
        existing.Category = request.Category.ToLowerInvariant();
        existing.Status = request.Status.ToLowerInvariant();
        existing.AssignedTo = request.AssignedTo;
        existing.DueDate = request.DueDate;
        existing.Notes = request.Notes;

        deal.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<DealExecution>.Filter.Eq(d => d.Id, dealId);
        await _dbContext.DealExecutions.ReplaceOneAsync(filter, deal);

        await AppendDealActivityAsync(
            deal.CompanyId, dealId,
            Phase9Requirements.ActivityDueDiligenceUpdated,
            fromStatus: null, toStatus: existing.Status,
            actorUserId, ipHash,
            notes: $"{existing.ItemName} -> {existing.Status}");

        return MapDealToResponse(deal);
    }

    public async Task<DealDocumentResponse> UploadDealDocumentAsync(string dealId, UploadDealDocumentRequest request, string actorUserId, string ipHash)
    {
        if (request?.File == null || request.File.Length == 0)
            throw new ArgumentException("Uploaded file is required");
        if (request.File.Length > Phase9Requirements.MaxDealDocumentSizeBytes)
            throw new ArgumentException(
                $"File size {request.File.Length} exceeds {Phase9Requirements.MaxDealDocumentSizeBytes}");
        if (!Phase9Requirements.IsValidDealDocumentKind(request.DocumentKind))
            throw new ArgumentException(
                $"documentKind must be one of: {string.Join(", ", Phase9Requirements.DealDocumentKindWhitelist)}");

        var deal = await GetDealOrThrowAsync(dealId);

        byte[] bytes;
        await using (var ms = new MemoryStream())
        {
            await request.File.CopyToAsync(ms);
            bytes = ms.ToArray();
        }

        var storagePath = await _documentManager.SaveDocumentAsync(deal.CompanyId, request.File.FileName, bytes);
        var doc = new DealDocument
        {
            DocumentId = ObjectId.GenerateNewId().ToString(),
            FileName = request.File.FileName,
            StoragePath = storagePath,
            FileSize = request.File.Length,
            MimeType = request.File.ContentType,
            DocumentKind = request.DocumentKind.ToLowerInvariant(),
            UploadedBy = actorUserId,
            UploadedAt = DateTime.UtcNow,
        };

        deal.DealDocuments.Add(doc);
        deal.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<DealExecution>.Filter.Eq(d => d.Id, dealId);
        await _dbContext.DealExecutions.ReplaceOneAsync(filter, deal);

        await AppendDealActivityAsync(
            deal.CompanyId, dealId,
            Phase9Requirements.ActivityDocumentUploaded,
            fromStatus: null, toStatus: null,
            actorUserId, ipHash,
            notes: $"{doc.DocumentKind}: {doc.FileName}");

        return MapDealDocument(doc);
    }

    public async Task<(byte[] Content, DealDocumentResponse Document)> GetDealDocumentAsync(string dealId, string documentId)
    {
        var deal = await GetDealOrThrowAsync(dealId);
        var doc = deal.DealDocuments?
            .FirstOrDefault(d => string.Equals(d.DocumentId, documentId, StringComparison.Ordinal))
            ?? throw new KeyNotFoundException($"Deal document {documentId} not found");
        if (string.IsNullOrWhiteSpace(doc.StoragePath))
            throw new InvalidOperationException("Document storage path is missing");

        var bytes = await File.ReadAllBytesAsync(doc.StoragePath);
        return (bytes, MapDealDocument(doc));
    }

    public async Task<List<DealActivityLogResponse>> GetDealActivityAsync(string dealId)
    {
        await GetDealOrThrowAsync(dealId);
        var logs = await _dbContext.Phase9DealActivityLogs
            .Find(l => l.DealId == dealId)
            .SortByDescending(l => l.OccurredAt)
            .ToListAsync();

        return logs.Select(l => new DealActivityLogResponse
        {
            Id = l.Id,
            DealId = l.DealId,
            EventType = l.EventType,
            FromStatus = l.FromStatus,
            ToStatus = l.ToStatus,
            ActorUserId = l.ActorUserId,
            OccurredAt = l.OccurredAt,
            Notes = l.Notes,
        }).ToList();
    }

    private async Task<DealExecution> GetDealOrThrowAsync(string dealId)
    {
        return await _dbContext.DealExecutions
            .Find(d => d.Id == dealId)
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException($"Deal {dealId} not found");
    }

    private async Task AppendDealActivityAsync(
        string companyId, string dealId, string eventType,
        string fromStatus, string toStatus,
        string actorUserId, string ipHash, string notes)
    {
        if (!Phase9Requirements.IsValidActivityEventType(eventType))
            throw new InvalidOperationException($"Invalid activity eventType '{eventType}'");

        await _dbContext.Phase9DealActivityLogs.InsertOneAsync(new Phase9DealActivityLog
        {
            Id = ObjectId.GenerateNewId().ToString(),
            CompanyId = companyId,
            DealId = dealId,
            EventType = eventType,
            FromStatus = fromStatus,
            ToStatus = toStatus,
            ActorUserId = actorUserId,
            OccurredAt = DateTime.UtcNow,
            IpHash = ipHash,
            Notes = notes,
        });
    }

    private static DealDocumentResponse MapDealDocument(DealDocument d) => new()
    {
        DocumentId = d.DocumentId,
        FileName = d.FileName,
        FileSize = d.FileSize,
        MimeType = d.MimeType,
        DocumentKind = d.DocumentKind,
        UploadedBy = d.UploadedBy,
        UploadedAt = d.UploadedAt,
    };

    // ============ HELPERS ============

    private int CalculateOverallProgress(Companies company)
    {
        if (company.CompletedPhases == null)
            return 0;

        return (int)Math.Round((company.CompletedPhases.Count / 9d) * 100);
    }

    private CompanyProgressResponse BuildProgressResponse(Companies company)
    {
        return new CompanyProgressResponse
        {
            CompanyId = company.Id,
            CurrentPhase = company.CurrentPhase,
            CompletedPhases = company.CompletedPhases ?? new List<int>(),
            OverallProgressPercent = CalculateOverallProgress(company),
            TrustScore = company.TrustScore,
            IsInvestorReady = company.IsInvestorReady,
            CreatedAt = company.CreatedAt,
            LastUpdatedAt = company.UpdatedAt
        };
    }

    private double CalculateGrowthRate(Companies company)
    {
        var revenues = new[] { company.Q1Revenue ?? 0, company.Q2Revenue ?? 0, company.Q3Revenue ?? 0, company.Q4Revenue ?? 0 };

        if (revenues[0] == 0) return 0;

        var growthQ1ToQ2 = (revenues[1] - revenues[0]) / revenues[0];
        var growthQ2ToQ3 = revenues[1] != 0 ? (revenues[2] - revenues[1]) / revenues[1] : 0;
        var growthQ3ToQ4 = revenues[2] != 0 ? (revenues[3] - revenues[2]) / revenues[2] : 0;

        return (growthQ1ToQ2 + growthQ2ToQ3 + growthQ3ToQ4) / 3;
    }

    private int CalculateRunway(Companies company)
    {
        var monthlyBurn = company.MonthlyBurn ?? 0;
        if (monthlyBurn <= 0) return 0;

        var currentFunds = company.CurrentFunds ?? 0;
        return (int)(currentFunds / monthlyBurn);
    }

    private DealStatusResponse MapDealToResponse(DealExecution deal)
    {
        return new DealStatusResponse
        {
            DealId = deal.Id,
            Status = deal.Status,
            ProgressPercent = CalculateDealProgress(deal),
            TermSheet = new TermSheetResponse
            {
                TotalRaiseAmount = deal.TermSheet.TotalRaiseAmount,
                PostMoneyValuation = deal.TermSheet.PostMoneyValuation,
                EquityType = deal.TermSheet.EquityType,
                InvestorEquityPercent = deal.TermSheet.InvestorEquityPercent,
                ProRataRights = deal.TermSheet.ProRataRights,
                Status = deal.TermSheet.Status,
                SignedAt = deal.TermSheet.SignedAt
            },
            ClosingChecklist = deal.ClosingChecklist.Select(c => new ChecklistItemDto
            {
                Item = c.Item,
                Completed = c.Completed,
                Owner = c.Owner,
                DueDate = c.DueDate
            }).ToList(),
            Investors = deal.Investors.Select(inv => new DealParticipantStatusDto
            {
                InvestorId = inv.InvestorId,
                CommittedAmount = inv.CommittedAmount,
                Status = inv.Status
            }).ToList()
        };
    }

    private double CalculateDealProgress(DealExecution deal)
    {
        if (deal.ClosingChecklist.Count == 0) return 0;
        var completed = deal.ClosingChecklist.Count(c => c.Completed);
        return (completed / (double)deal.ClosingChecklist.Count) * 100;
    }

    private async Task<(bool IsValid, List<string> Errors)> ValidatePhaseAsync(Companies company, int phase)
    {
        return phase switch
        {
            1 => await _phaseValidator.ValidatePhase1Async(company),
            2 => await _phaseValidator.ValidatePhase2Async(company),
            3 => await _phaseValidator.ValidatePhase3Async(company),
            4 => await _phaseValidator.ValidatePhase4Async(company),
            5 => await _phaseValidator.ValidatePhase5Async(company),
            6 => await _phaseValidator.ValidatePhase6Async(company),
            7 => await _phaseValidator.ValidatePhase7Async(company),
            8 => await _phaseValidator.ValidatePhase8Async(company),
            9 => await _phaseValidator.ValidatePhase9Async(company),
            _ => (false, new List<string> { "Invalid phase" })
        };
    }
}
