using System;
using System.Collections.Generic;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Phase4;

namespace WebApp.Models.Phase4
{
    public class GtmSegmentItem
    {
        public string Name { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
        public string PainPoints { get; set; } = string.Empty;
        public string WillingnessToPay { get; set; } = string.Empty;
        public string Accessibility { get; set; } = string.Empty;
        public bool IsSupplySide { get; set; }
        public bool IsDemandSide { get; set; }
        public string BuyerPersona { get; set; } = string.Empty;
        public string DecisionMakerPersona { get; set; } = string.Empty;
        public string UserPersona { get; set; } = string.Empty;
    }

    public class GtmOfferItem
    {
        public string Key { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string RevenueModel { get; set; } = string.Empty;
        public decimal RecommendedPrice { get; set; }
        public decimal? FounderSelectedPrice { get; set; }
        public decimal EffectivePrice { get; set; }
        public bool IsFounderPrice { get; set; }
        public string Currency { get; set; } = "EUR";
        public string BillingPeriod { get; set; } = "Monthly";
        public List<string> Features { get; set; } = new();
        public string TargetSegment { get; set; } = string.Empty;
    }

    public class GtmForecastContext
    {
        public string SessionId { get; set; } = string.Empty;
        public int Version { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public decimal? MarketingBudget { get; set; }
        public decimal? ForecastCac { get; set; }
        public decimal? Arpu { get; set; }
        public decimal? MonthlyOpex { get; set; }
        public bool HasForecast { get; set; }
    }

    public class GtmContext
    {
        public string UserId { get; set; } = string.Empty;
        public string? IdeaId { get; set; }
        public CreatorJourneyProject Project { get; set; } = new();

        // Phase 3 inputs
        public List<GtmSegmentItem> TargetSegments { get; set; } = new();
        public string PositioningStatement { get; set; } = string.Empty;
        public string PositioningCategory { get; set; } = string.Empty;
        public string PrimaryPromise { get; set; } = string.Empty;
        public string Differentiator { get; set; } = string.Empty;
        public string EvidencePoints { get; set; } = string.Empty;
        public List<string> CompetitorNames { get; set; } = new();
        public List<string> CompetitorWeaknesses { get; set; } = new();
        public List<string> ValuePropositions { get; set; } = new();
        public List<string> JobsToBeDone { get; set; } = new();
        public List<string> PainPoints { get; set; } = new();

        // Phase 4.6 Pricing inputs
        public string PrimaryRevenueModel { get; set; } = string.Empty;
        public List<string> RevenueModels { get; set; } = new();
        public List<GtmOfferItem> Offers { get; set; } = new();
        public PricingConfidence PricingValidationStatus { get; set; } = PricingConfidence.NeedsValidation;
        public List<PricingExperiment> PricingExperiments { get; set; } = new();

        // Financial & Budget inputs
        public GtmForecastContext Forecast { get; set; } = new();
        public bool SupportPlanAvailable { get; set; }
        public decimal? ConfirmedGrantBudget { get; set; } // Only if verified/awarded
        public decimal? PotentialGrantBudget { get; set; } // Informational only, NOT spendable

        // Founder profile & capacity (Refinement 1)
        public string WeeklyAvailability { get; set; } = "10–20 hours/week";
        public string CurrentSituation { get; set; } = string.Empty;
        public List<string> FounderCapabilities { get; set; } = new();
        public List<string> DelegatedCapabilities { get; set; } = new();

        // Phase 4 Roadmap & Needs
        public List<RoadmapTask> RoadmapTasks { get; set; } = new();
        public List<CreatorNeed> NeedsItems { get; set; } = new();

        // Consumed versions
        public GtmConsumedSources CurrentSourceVersions { get; set; } = new();
    }
}
