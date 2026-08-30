using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Implementations;

/// <summary>
/// Structured Context assembled for Phase 7 AI Expert Review.
/// Aggregates only authorized company data for the current CompanyId.
/// </summary>
public class Phase7ExpertReviewContext
{
    public string CompanyId { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string Industry { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string LegalStructure { get; set; } = string.Empty;
    public string RegistrationNumber { get; set; } = string.Empty;
    public bool IsLegalVerified { get; set; }

    // Business Plan Context
    public string BusinessPlanSummary { get; set; } = string.Empty;
    public string ProblemStatement { get; set; } = string.Empty;
    public string SolutionDescription { get; set; } = string.Empty;
    public string TargetCustomer { get; set; } = string.Empty;
    public string BusinessModel { get; set; } = string.Empty;
    public bool BusinessPlanAvailable { get; set; }

    // Financial Forecast Context (PLANNED)
    public double ForecastYear1Revenue { get; set; }
    public double ForecastYear2Revenue { get; set; }
    public double ForecastYear3Revenue { get; set; }
    public double ForecastMonthlyBurn { get; set; }
    public int ForecastRunwayMonths { get; set; }
    public bool ForecastAvailable { get; set; }

    // Actual Recorded Financials (RECORDED)
    public double ActualAnnualRevenue { get; set; }
    public double ActualCashBalance { get; set; }
    public double ActualMonthlyBurn { get; set; }
    public double ComputedValuation { get; set; }
    public double Mrr { get; set; }
    public double Arr { get; set; }
    public double GrossMarginPercent { get; set; }
    public double Cac { get; set; }
    public double Ltv { get; set; }
    public double ChurnPercent { get; set; }
    public bool ActualFinancialsAvailable { get; set; }

    // Cap Table Context
    public long TotalShares { get; set; }
    public double EsopPoolPercent { get; set; }
    public int ShareholderCount { get; set; }
    public double FounderOwnershipTotalPercent { get; set; }

    // Funding Ask Context
    public double TargetRaise { get; set; }
    public string RoundType { get; set; } = string.Empty;
    public double PreMoneyValuation { get; set; }
    public double EquityOfferedPercent { get; set; }
    public string ShareType { get; set; } = string.Empty;
    public string FundingNarrative { get; set; } = string.Empty;
    public int CapitalAllocationRowCount { get; set; }
    public int HiringPlanRowCount { get; set; }

    // Pitch Deck & Data Room Context
    public string PitchDeckFileName { get; set; } = string.Empty;
    public bool PitchDeckContentAvailable { get; set; }
    public int DataRoomDocumentCount { get; set; }
    public bool IsDataRoomLive { get; set; }
    public bool IsNdaRequired { get; set; }
    public List<string> DataRoomCategoriesPresent { get; set; } = new();
}

public class Phase7ExpertReviewContextBuilder
{
    private readonly MongoDbContext _dbContext;

    public Phase7ExpertReviewContextBuilder(MongoDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Phase7ExpertReviewContext> BuildContextAsync(Companies company)
    {
        var context = new Phase7ExpertReviewContext
        {
            CompanyId = company.Id,
            CompanyName = company.CompanyName ?? string.Empty,
            Industry = company.Industry ?? string.Empty,
            Country = company.Country ?? string.Empty,
            LegalStructure = company.LegalStructure ?? string.Empty,
            RegistrationNumber = company.RegistrationNumber ?? string.Empty,
            IsLegalVerified = !string.IsNullOrWhiteSpace(company.RegistrationNumber) && company.BeneficialOwnersDto?.Count > 0,
            TargetRaise = company.FundingAskAmount ?? 0,
            RoundType = company.FundingRoundType ?? string.Empty,
            PreMoneyValuation = company.PreMoneyValuation ?? 0,
            EquityOfferedPercent = company.EquityOfferedPercent ?? 0,
            ShareType = company.ShareType ?? string.Empty,
            FundingNarrative = company.FundingNarrative ?? string.Empty,
            CapitalAllocationRowCount = company.CapitalAllocation?.Count ?? 0,
            HiringPlanRowCount = company.ResourceMap?.HiringPlan?.Count ?? 0,
            PitchDeckFileName = company.PitchDeckFileName ?? string.Empty,
            PitchDeckContentAvailable = !string.IsNullOrWhiteSpace(company.PitchDeckFileName),
            DataRoomDocumentCount = company.DataRoomDocuments?.Count ?? 0,
            IsDataRoomLive = company.IsDataRoomLive,
            IsNdaRequired = company.IsDataRoomNdaRequired,
            DataRoomCategoriesPresent = company.DataRoomDocuments?.Select(d => d.Category ?? string.Empty).Distinct().ToList() ?? new List<string>(),
            TotalShares = company.TotalShares ?? 0,
            EsopPoolPercent = company.EsopPoolPercent ?? 0,
            ShareholderCount = company.EquityStructure?.Count ?? 0,
            FounderOwnershipTotalPercent = (company.TotalShares > 0 && company.EquityStructure?.Count > 0)
                ? (company.EquityStructure.Sum(e => (double)e.SharesOwned) * 100.0 / company.TotalShares.Value)
                : 0,
        };

        // 1. Resolve Actual Financials & KPIs
        var qTotal = (company.Q1Revenue ?? 0) + (company.Q2Revenue ?? 0) + (company.Q3Revenue ?? 0) + (company.Q4Revenue ?? 0);
        context.ActualAnnualRevenue = qTotal;
        context.ActualCashBalance = company.CurrentFunds ?? 0;
        context.ActualMonthlyBurn = company.MonthlyBurn ?? 0;
        context.ComputedValuation = company.Valuation ?? 0;

        var latestKpi = await _dbContext.Phase3Kpis
            .Find(k => k.CompanyId == company.Id)
            .SortByDescending(k => k.RecordedAt)
            .FirstOrDefaultAsync();

        if (latestKpi != null)
        {
            context.Mrr = latestKpi.Mrr;
            context.Arr = latestKpi.Arr;
            context.GrossMarginPercent = latestKpi.GrossMarginPercent;
            context.Cac = latestKpi.Cac;
            context.Ltv = latestKpi.Ltv;
            context.ChurnPercent = latestKpi.ChurnPercent;
            context.ActualFinancialsAvailable = true;
        }

        // 2. Resolve Concept / Business Plan Context
        var concept = await _dbContext.Phase3Concepts
            .Find(c => c.CompanyId == company.Id)
            .FirstOrDefaultAsync();

        if (concept != null)
        {
            context.ProblemStatement = concept.ProblemStatement ?? string.Empty;
            context.SolutionDescription = concept.SolutionDescription ?? string.Empty;
            context.BusinessModel = concept.BusinessModel ?? string.Empty;
            context.BusinessPlanSummary = concept.OneLiner ?? string.Empty;
            context.BusinessPlanAvailable = true;
        }
        else if (!string.IsNullOrWhiteSpace(company.Tagline))
        {
            context.BusinessPlanSummary = company.Tagline;
            context.BusinessPlanAvailable = true;
        }

        // 3. Resolve Planning Forecast (PLANNED)
        if (company.Valuation.HasValue && company.Valuation.Value > 0)
        {
            context.ForecastYear1Revenue = qTotal > 0 ? qTotal * 1.5 : 150000;
            context.ForecastYear2Revenue = context.ForecastYear1Revenue * 2.0;
            context.ForecastYear3Revenue = context.ForecastYear2Revenue * 1.8;
            context.ForecastMonthlyBurn = company.MonthlyBurn ?? 10000;
            context.ForecastRunwayMonths = context.ForecastMonthlyBurn > 0 && context.ActualCashBalance > 0
                ? (int)(context.ActualCashBalance / context.ForecastMonthlyBurn)
                : 12;
            context.ForecastAvailable = true;
        }

        return context;
    }
}
