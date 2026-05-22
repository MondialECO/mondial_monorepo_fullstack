using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.DbContext;

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
            throw new InvalidOperationException($"No company found for user {userId}");

        return BuildProgressResponse(company);
    }

    public async Task<CompanyProgressResponse> AdvancePhaseAsync(string companyId, int phaseNumber, object phaseData)
    {
        var company = await GetCompanyAsync(companyId);

        company.CompletedPhases ??= new List<int>();

        // Validate phase progression
        if (phaseNumber < 1 || phaseNumber > 9)
            throw new ArgumentException("Phase must be between 1 and 9");

        if (phaseNumber <= company.CurrentPhase)
            return BuildProgressResponse(company);

        if (phaseNumber != company.CurrentPhase + 1)
            throw new InvalidOperationException(
                $"Cannot skip phases. Current phase is {company.CurrentPhase}, requested {phaseNumber}");

        // Validate the CURRENT phase before moving to the next one.
        if (company.CurrentPhase >= 1)
        {
            var (isValid, errors) = await ValidatePhaseAsync(company, company.CurrentPhase);
            if (!isValid)
                throw new InvalidOperationException($"Cannot advance: {string.Join(", ", errors)}");
        }

        // Mark the previous phase completed and move to the next one.
        if (!company.CompletedPhases.Contains(company.CurrentPhase))
            company.CompletedPhases.Add(company.CurrentPhase);

        company.CurrentPhase = phaseNumber;

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
            CurrentPhase = 1,
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
        var company = await GetCompanyAsync(companyId);

        // Save file using document manager
        var fileUrl = await _documentManager.SaveDocumentAsync(companyId, request.FileName, request.FileContent);

        // Create document record
        var docId = ObjectId.GenerateNewId().ToString();
        var document = new DocumentStatusResponse
        {
            DocumentId = docId,
            Type = request.DocumentType,
            FileName = request.FileName,
            Status = "pending",
            UploadedAt = DateTime.UtcNow,
            ReviewNote = null
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
        var company = await GetCompanyAsync(companyId);

        company.FundingAskAmount = request.RaiseAmount;
        company.FundingRoundType = request.RoundType;
        company.PreMoneyValuation = request.PreMoneyValuation;
        company.ShareType = request.ShareType;
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

    // ============ PHASE 6: DATA ROOM ============

    public async Task<DataRoomDocumentResponse> UploadDataRoomDocumentAsync(string companyId, UploadDataRoomDocumentRequest request)
    {
        var company = await GetCompanyAsync(companyId);

        var fileUrl = await _documentManager.SaveDocumentAsync(companyId, request.FileName, request.FileContent);

        var doc = new DataRoomDocumentResponse
        {
            DocumentId = ObjectId.GenerateNewId().ToString(),
            Title = request.Title,
            Category = request.Category,
            Status = "draft",
            UploadedAt = DateTime.UtcNow,
            ViewCount = 0
        };

        if (company.DataRoomDocuments == null)
            company.DataRoomDocuments = new List<DataRoomDocumentResponse>();

        company.DataRoomDocuments.Add(doc);
        company.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Companies>.Filter.Eq(c => c.Id, companyId);
        await _dbContext.Companies.ReplaceOneAsync(filter, company);

        return doc;
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

        company.AiReview = review;
        company.LastAiReviewAt = DateTime.UtcNow;
        company.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<Companies>.Filter.Eq(c => c.Id, companyId);
        await _dbContext.Companies.ReplaceOneAsync(filter, company);

        return review;
    }

    public async Task<AiReviewResponse> GetAiReviewScoreAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);
        return company.AiReview ?? throw new InvalidOperationException("No AI review found for this company");
    }

    public async Task<List<RecommendationDto>> GetRecommendationsAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);
        return company.AiReview?.Recommendations ?? new List<RecommendationDto>();
    }

    public async Task AwardInvestorReadyBadgeAsync(string companyId)
    {
        var company = await GetCompanyAsync(companyId);
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
            .ToListAsync();

        return matches.Select(m => new InvestorMatchResponse
        {
            MatchId = m.Id,
            InvestorId = m.InvestorId,
            MatchScore = m.MatchScore,
            Status = m.Status
        }).ToList();
    }

    public async Task RecordInvestorInteractionAsync(string companyId, RecordInteractionRequest request)
    {
        var match = await _dbContext.InvestorMatches
            .Find(m => m.Id == request.MatchId && m.CompanyId == companyId)
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException($"Match {request.MatchId} not found");

        var interaction = new InteractionRecord
        {
            Type = request.InteractionType,
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

    public async Task<List<InvestorMatch>> GetMatchingInsightsAsync(string companyId)
    {
        return await _dbContext.InvestorMatches
            .Find(m => m.CompanyId == companyId)
            .ToListAsync();
    }

    // ============ PHASE 9: DEAL EXECUTION ============

    public async Task<DealStatusResponse> CreateDealAsync(string companyId, CreateDealRequest request)
    {
        var deal = new DealExecution
        {
            CompanyId = companyId,
            Status = "negotiation",
            Investors = new List<DealParticipant>
            {
                new DealParticipant
                {
                    InvestorId = request.InvestorId,
                    CommittedAmount = request.TermSheet.TotalRaiseAmount,
                    Status = "interested",
                    EquityPercentage = (request.TermSheet.TotalRaiseAmount / request.TermSheet.PostMoneyValuation) * 100
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
                Status = "draft"
            },
            DueDiligenceChecklist = new List<DueDigligenceItem>(),
            ClosingChecklist = new List<ClosingChecklistItem>(),
            Milestones = new List<DealMilestone>(),
            NegotiationStatus = new DealNegotiationStatus(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _dbContext.DealExecutions.InsertOneAsync(deal);

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

    public async Task<DealStatusResponse> UpdateTermSheetAsync(string dealId, TermSheetRequest request)
    {
        var deal = await _dbContext.DealExecutions
            .Find(d => d.Id == dealId)
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException($"Deal {dealId} not found");

        deal.TermSheet.TotalRaiseAmount = request.TotalRaiseAmount;
        deal.TermSheet.PostMoneyValuation = request.PostMoneyValuation;
        deal.TermSheet.EquityType = request.EquityType;
        deal.TermSheet.ProRataRights = request.ProRataRights;
        deal.TermSheet.LiquidationPreference = request.LiquidationPreference;
        deal.TermSheet.BoardSeats = request.BoardSeats;
        deal.TermSheet.ProposedClosingDate = request.ProposedClosingDate;
        deal.TermSheet.Status = "negotiating";
        deal.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<DealExecution>.Filter.Eq(d => d.Id, dealId);
        await _dbContext.DealExecutions.ReplaceOneAsync(filter, deal);

        return MapDealToResponse(deal);
    }

    public async Task<DealStatusResponse> ProgressChecklistAsync(string dealId, ChecklistItemDto item)
    {
        var deal = await _dbContext.DealExecutions
            .Find(d => d.Id == dealId)
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException($"Deal {dealId} not found");

        var checklistItem = deal.ClosingChecklist.FirstOrDefault(c => c.Item == item.Item);
        if (checklistItem != null)
        {
            checklistItem.Completed = item.Completed;
            if (item.Completed)
                checklistItem.CompletedAt = DateTime.UtcNow;
        }

        deal.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<DealExecution>.Filter.Eq(d => d.Id, dealId);
        await _dbContext.DealExecutions.ReplaceOneAsync(filter, deal);

        return MapDealToResponse(deal);
    }

    public async Task<DealStatusResponse> CloseDealAsync(string dealId)
    {
        var deal = await _dbContext.DealExecutions
            .Find(d => d.Id == dealId)
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException($"Deal {dealId} not found");

        deal.Status = "closed";
        deal.ClosedAt = DateTime.UtcNow;
        deal.UpdatedAt = DateTime.UtcNow;

        var filter = Builders<DealExecution>.Filter.Eq(d => d.Id, dealId);
        await _dbContext.DealExecutions.ReplaceOneAsync(filter, deal);

        return MapDealToResponse(deal);
    }

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
