using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;

namespace WebApp.Services.Implementations;

public class PhaseValidator : IPhaseValidator
{
    private readonly MongoDbContext _dbContext;

    public PhaseValidator(MongoDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<(bool IsValid, List<string> Errors)> ValidatePhase1Async(Companies company)
    {
        return await Task.Run(() =>
        {
            var errors = new List<string>();

            if (string.IsNullOrWhiteSpace(company.CompanyName))
                errors.Add("Company name is required");

            if (string.IsNullOrWhiteSpace(company.Industry))
                errors.Add("Industry is required");

            if (string.IsNullOrWhiteSpace(company.Website))
                errors.Add("Website is required");

            if (string.IsNullOrWhiteSpace(company.Tagline))
                errors.Add("Tagline is required");

            return (errors.Count == 0, errors);
        });
    }

    public async Task<(bool IsValid, List<string> Errors)> ValidatePhase2Async(Companies company)
    {
        return await Task.Run(() =>
        {
            var errors = new List<string>();

            if (string.IsNullOrWhiteSpace(company.LegalName))
                errors.Add("Legal name is required");

            if (string.IsNullOrWhiteSpace(company.RegistrationNumber))
                errors.Add("Registration number (SIRET) is required");

            if (string.IsNullOrWhiteSpace(company.LegalStructure))
                errors.Add("Legal structure is required");

            if (string.IsNullOrWhiteSpace(company.IncorporationDate))
                errors.Add("Incorporation date is required");

            if (string.IsNullOrWhiteSpace(company.RegisteredAddress))
                errors.Add("Registered address is required");

            if (string.IsNullOrWhiteSpace(company.Country))
                errors.Add("Country is required");

            // Check beneficial owners — validate canonical fields, not just count.
            if (company.BeneficialOwnersDto == null || company.BeneficialOwnersDto.Count == 0)
            {
                errors.Add("At least one beneficial owner is required");
            }
            else
            {
                for (var i = 0; i < company.BeneficialOwnersDto.Count; i++)
                {
                    var owner = company.BeneficialOwnersDto[i];
                    if (string.IsNullOrWhiteSpace(owner.FullName))
                        errors.Add($"Beneficial owner #{i + 1}: full name is required");
                    if (string.IsNullOrWhiteSpace(owner.Email))
                        errors.Add($"Beneficial owner #{i + 1}: email is required");
                    if (owner.OwnershipPercent <= 0 || owner.OwnershipPercent > 100)
                        errors.Add($"Beneficial owner #{i + 1}: ownership percent must be between 0 and 100");
                }
            }

            // Check documents — backend-authoritative required set.
            // Phase 2 completion means every required document type has been
            // submitted with a non-rejected status. Pending and approved both count.
            var statuses = company.DocumentStatuses ?? new List<DocumentStatusResponse>();
            foreach (var requiredType in Phase2Requirements.RequiredDocumentTypes)
            {
                var hasAcceptable = statuses.Any(d =>
                    Phase2Requirements.MatchesType(d.Type, requiredType) &&
                    Phase2Requirements.IsAcceptableStatus(d.Status));

                if (!hasAcceptable)
                    errors.Add($"Required document '{requiredType}' is missing or rejected");
            }

            return (errors.Count == 0, errors);
        });
    }

    public async Task<(bool IsValid, List<string> Errors)> ValidatePhase3Async(Companies company)
    {
        var errors = new List<string>();

        // Revenue ----------------------------------------------------------
        var totalRevenue = (company.Q1Revenue ?? 0) + (company.Q2Revenue ?? 0) + (company.Q3Revenue ?? 0) + (company.Q4Revenue ?? 0);
        if (totalRevenue <= 0)
            errors.Add("Must have positive quarterly revenue data");

        // Valuation --------------------------------------------------------
        if (company.Valuation == null || company.Valuation <= 0)
            errors.Add("Valuation must be calculated");

        // Equity totals reconcile to TotalShares (90-100%) -----------------
        if (company.EquityStructure == null || company.EquityStructure.Count == 0)
        {
            errors.Add("Equity structure must be defined");
        }
        else if (company.TotalShares == null || company.TotalShares <= 0)
        {
            errors.Add("Total shares must be set");
        }
        else
        {
            var totalOwnershipPercent = company.EquityStructure.Sum(e => (e.SharesOwned / (double)company.TotalShares) * 100);
            if (totalOwnershipPercent < Phase3Requirements.EquityMinPercentOfTotalShares ||
                totalOwnershipPercent > Phase3Requirements.EquityMaxPercentOfTotalShares)
                errors.Add($"Equity ownership must total ~100% of TotalShares (currently {totalOwnershipPercent:F2}%)");
        }

        // Funding ask ------------------------------------------------------
        if (company.FundingAskAmount == null || company.FundingAskAmount <= 0)
            errors.Add("Funding ask amount is required");

        if (string.IsNullOrWhiteSpace(company.FundingRoundType))
            errors.Add("Funding round type must be specified");

        // Capital allocation total (95-105%) when provided -----------------
        if (company.CapitalAllocation != null && company.CapitalAllocation.Count > 0)
        {
            var allocationTotal = company.CapitalAllocation.Sum(c => c.Percent);
            if (allocationTotal < Phase3Requirements.AllocationMinTotalPercent ||
                allocationTotal > Phase3Requirements.AllocationMaxTotalPercent)
                errors.Add($"Capital allocation must total ~100% (currently {allocationTotal:F2}%)");
        }
        else
        {
            errors.Add("Capital allocation breakdown is required");
        }

        // Cash position ----------------------------------------------------
        if (company.MonthlyBurn == null || company.MonthlyBurn <= 0)
            errors.Add("Monthly burn rate is required (> 0)");
        if (company.CurrentFunds == null || company.CurrentFunds < 0)
            errors.Add("Current funds must be set (>= 0)");

        // KPI baseline -----------------------------------------------------
        var latestKpi = await _dbContext.Phase3Kpis
            .Find(k => k.CompanyId == company.Id)
            .SortByDescending(k => k.RecordedAt)
            .FirstOrDefaultAsync();

        var kpiErrors = Phase3Requirements.ValidateKpiBaseline(latestKpi);
        errors.AddRange(kpiErrors);

        // Required financial reports submitted (non-rejected) --------------
        var reports = await _dbContext.Phase3FinancialReports
            .Find(r => r.CompanyId == company.Id)
            .ToListAsync();

        foreach (var requiredType in Phase3Requirements.RequiredReportTypes)
        {
            var hasAcceptable = reports.Any(r =>
                Phase3Requirements.MatchesReportType(r.Type, requiredType) &&
                Phase3Requirements.IsAcceptableReportStatus(r.Status));

            if (!hasAcceptable)
                errors.Add($"Required financial report '{requiredType}' is missing or rejected");
        }

        return (errors.Count == 0, errors);
    }

    public async Task<(bool IsValid, List<string> Errors)> ValidatePhase4Async(Companies company)
    {
        return await Task.Run(() =>
        {
            var errors = new List<string>();

            if (company.EquityStructure == null || company.EquityStructure.Count == 0)
                errors.Add("Cap table must be defined");

            if (company.TotalShares == null || company.TotalShares <= 0)
                errors.Add("Total shares must be set");

            var totalOwnership = company.EquityStructure?.Sum(e => (e.SharesOwned / (double)company.TotalShares) * 100) ?? 0;
            if (totalOwnership < 90 || totalOwnership > 100)
                errors.Add($"Cap table must total 100% (currently {totalOwnership:F2}%)");

            return (errors.Count == 0, errors);
        });
    }

    public async Task<(bool IsValid, List<string> Errors)> ValidatePhase5Async(Companies company)
    {
        return await Task.Run(() =>
        {
            var errors = new List<string>();

            if (company.FundingAskAmount == null || company.FundingAskAmount <= 0)
                errors.Add("Funding ask amount is required");

            if (string.IsNullOrWhiteSpace(company.FundingRoundType))
                errors.Add("Funding round type must be specified");

            if (company.CapitalAllocation == null || company.CapitalAllocation.Count == 0)
                errors.Add("Capital allocation breakdown is required");

            var allocationTotal = company.CapitalAllocation?.Sum(c => c.Percent) ?? 0;
            if (allocationTotal < 95 || allocationTotal > 105)
                errors.Add($"Capital allocation must total 100% (currently {allocationTotal:F2}%)");

            if (company.ResourceMap?.HiringPlan?.Count == 0)
                errors.Add("Hiring plan is required");

            return (errors.Count == 0, errors);
        });
    }

    public async Task<(bool IsValid, List<string> Errors)> ValidatePhase6Async(Companies company)
    {
        return await Task.Run(() =>
        {
            var errors = new List<string>();

            if (!company.IsDataRoomLive)
                errors.Add("Data room must be published");

            if (company.DataRoomDocuments == null || company.DataRoomDocuments.Count == 0)
                errors.Add("Data room must contain at least one document");

            var requiredCategories = new[] { "legal", "financial", "business" };
            var uploadedCategories = company.DataRoomDocuments?
                .Select(d => d.Category?.ToLower())
                .Where(c => requiredCategories.Contains(c))
                .Distinct()
                .ToList() ?? new List<string>();

            var missingCategories = requiredCategories.Except(uploadedCategories).ToList();
            if (missingCategories.Count > 0)
                errors.Add($"Missing required document categories: {string.Join(", ", missingCategories)}");

            return (errors.Count == 0, errors);
        });
    }

    public async Task<(bool IsValid, List<string> Errors)> ValidatePhase7Async(Companies company)
    {
        return await Task.Run(() =>
        {
            var errors = new List<string>();

            if (company.AiReview == null)
                errors.Add("AI review must be completed");

            if (company.AiReview?.OverallScore < 60)
                errors.Add($"AI review score must be at least 60 (currently {company.AiReview?.OverallScore})");

            if (!company.AiReview?.InvestorReadyBadge ?? false)
                errors.Add("Company must receive investor-ready badge");

            return (errors.Count == 0, errors);
        });
    }

    public async Task<(bool IsValid, List<string> Errors)> ValidatePhase8Async(Companies company)
    {
        return await Task.Run(() =>
        {
            var errors = new List<string>();

            // Phase 8 is informational - just track investor interactions
            // No strict validation needed - investors will be matched automatically

            return (errors.Count == 0, errors);
        });
    }

    public async Task<(bool IsValid, List<string> Errors)> ValidatePhase9Async(Companies company)
    {
        return await Task.Run(() =>
        {
            var errors = new List<string>();

            // Phase 9 validation happens per deal, not at company level
            // This is a placeholder for when needed

            return (errors.Count == 0, errors);
        });
    }
}
