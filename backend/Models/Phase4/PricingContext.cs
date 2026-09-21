using System;
using System.Collections.Generic;
using WebApp.Models.DatabaseModels.Phase4;

namespace WebApp.Models.Phase4
{
    public class PricingContext
    {
        public PricingProjectContext Project { get; set; } = new();
        public List<PricingCustomerSegmentItem> CustomerSegments { get; set; } = new();
        public List<PricingValuePropItem> ValuePropositions { get; set; } = new();
        public List<PricingRevenueStreamItem> RevenueStreams { get; set; } = new();
        public List<PricingExistingAssumptionItem> ExistingPricingAssumptions { get; set; } = new();
        public List<PricingCompetitorItem> CompetitorEvidence { get; set; } = new();
        public List<PricingMarketEvidenceItem> MarketEvidence { get; set; } = new();
        public PricingCostStructureContext CostStructure { get; set; } = new();
        public PricingForecastContext Forecast { get; set; } = new();
        public PricingLegalContext Legal { get; set; } = new();
        public PricingNeedsContext Needs { get; set; } = new();
        public PricingSupportContext Support { get; set; } = new();
        public PricingSourceVersions CurrentSourceVersions { get; set; } = new();
        public PricingMaterialityPolicy MaterialityPolicy { get; set; } = new();
        public TaxMode? ExplicitTaxMode { get; set; }
    }

    public class PricingProjectContext
    {
        public string IdeaId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Sector { get; set; } = string.Empty;
        public string Problem { get; set; } = string.Empty;
        public string Solution { get; set; } = string.Empty;
        public string TargetUser { get; set; } = string.Empty;
        public string Positioning { get; set; } = string.Empty;
        public string Stage { get; set; } = "pre_launch";
    }

    public class PricingCustomerSegmentItem
    {
        public string Segment { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
        public string SourceFootnote { get; set; } = string.Empty;
    }

    public class PricingValuePropItem
    {
        public string Headline { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
        public string SourceFootnote { get; set; } = string.Empty;
    }

    public class PricingRevenueStreamItem
    {
        public string Stream { get; set; } = string.Empty;
        public string SourceFootnote { get; set; } = string.Empty;
    }

    public class PricingExistingAssumptionItem
    {
        public string TierName { get; set; } = string.Empty;
        public string Pricing { get; set; } = string.Empty;
        public string TargetSegment { get; set; } = string.Empty;
        public List<string> Features { get; set; } = new();
        public decimal? ProjectedContributionPct { get; set; }
        public decimal? ParsedPrice { get; set; }
        public string? ParsedFrequency { get; set; }
    }

    public class PricingCompetitorItem
    {
        public string Name { get; set; } = string.Empty;
        public string PricingModel { get; set; } = string.Empty;
        public string EstimatedPrice { get; set; } = string.Empty;
        public string ThreatLevel { get; set; } = string.Empty;
        public List<string> Strengths { get; set; } = new();
        public List<string> Weaknesses { get; set; } = new();
        public string ExploitableGap { get; set; } = string.Empty;
        public string SourceAttribution { get; set; } = string.Empty;
    }

    public class PricingCostStructureContext
    {
        public List<string> RawCostItems { get; set; } = new();
        public decimal EstimatedMonthlyFixedCosts { get; set; }
        public decimal EstimatedVariableCostPerUnit { get; set; }
        public decimal DefaultRequiredMarginRate { get; set; } = 0.40m; // 40% target contribution margin
        public decimal DefaultRequiredMarginAmount { get; set; } = 20.0m;
        public MarginTargetType MarginTargetType { get; set; } = MarginTargetType.Percentage;
    }

    public class PricingForecastContext
    {
        public string SessionId { get; set; } = string.Empty;
        public int Version { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public bool HasForecast { get; set; }

        public decimal? Arpu { get; set; }
        public decimal? MonthlyOpex { get; set; }
        public decimal? MonthlyGrowthPct { get; set; }
        public decimal? MonthlyChurnPct { get; set; }
        public decimal? Tam { get; set; }

        public List<decimal> MonthlyRevenues { get; set; } = new();
        public List<decimal> MonthlyFixedCosts { get; set; } = new();
        public List<decimal> MonthlyVariableCosts { get; set; } = new();

        public int? BreakEvenMonth { get; set; }
        public bool BreakEvenAchieved { get; set; }
        public string? BreakEvenSummary { get; set; }
    }

    public class PricingLegalContext
    {
        public string RecommendedType { get; set; } = string.Empty;
        public string SelectedType { get; set; } = string.Empty;
        public TaxMode ConfiguredTaxMode { get; set; } = TaxMode.NotApplicableOrUnknown;
        public TaxMode InferredTaxMode { get; set; } = TaxMode.NotApplicableOrUnknown;
        public bool? IsVatExempt { get; set; }
        public bool? HasVatRegistration { get; set; }
        public string? ExplicitTaxDisplayMode { get; set; }
        public string? TaxRateReference { get; set; }
    }

    public class PricingNeedsContext
    {
        public int ActiveNeedsCount { get; set; }
        public decimal TotalEstimatedBudget { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class PricingSupportContext
    {
        public int EligibleMatchesCount { get; set; }
        public decimal TotalEstimatedSubsidies { get; set; }
        public bool ConsumedInPricing { get; set; } = false;
        public DateTime? UpdatedAt { get; set; }
    }

    public class PricingMarketEvidenceItem
    {
        public MarketPriceEvidenceType EvidenceType { get; set; } = MarketPriceEvidenceType.Unknown;
        public decimal Price { get; set; }
        public string Source { get; set; } = string.Empty;
        public MarketPriceValidationLevel ValidationLevel { get; set; } = MarketPriceValidationLevel.Unvalidated;
    }
}
