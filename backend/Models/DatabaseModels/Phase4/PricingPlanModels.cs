using System;
using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels.Phase4
{
    // =========================================================================
    // ENUMS
    // =========================================================================

    public enum RevenueModelType
    {
        OneTime,
        Subscription,
        UsageBased,
        TransactionFee,
        Commission,
        Retainer,
        ProjectBased,
        Freemium,
        Tiered,
        MarketplaceFee,
        Licensing,
        Hybrid,
        Other
    }

    public enum BillingFrequency
    {
        Monthly,
        Annual,
        OneOff,
        PerUse,
        Milestone,
        Hourly,
        Retainer
    }

    public enum PriceEvidenceType
    {
        FounderAssumption,
        ForecastAssumption,
        CompetitorEvidence,
        CustomerResearch,
        MarketStudy,
        CostBased,
        ValueBased,
        HistoricalSales,
        NeedsReview
    }

    public enum MarketPriceEvidenceType
    {
        CompetitorObserved,
        CustomerInterview,
        CustomerSurvey,
        HistoricalSale,
        PaidPilot,
        PreOrder,
        QuoteAccepted,
        MarketStudyEstimate,
        ModelEstimate,
        Unknown
    }

    public enum MarketPriceValidationLevel
    {
        EmpiricallyValidated,
        Supported,
        Indicative,
        Unvalidated,
        Unknown
    }

    public enum PricingConfidence
    {
        Validated,
        Supported,
        Provisional,
        NeedsValidation
    }

    public enum MarginTargetType
    {
        Percentage,
        AbsoluteAmount
    }

    public enum ForecastAlignmentBasis
    {
        MonthlyRevenuePerCustomer,
        AnnualRevenuePerCustomer,
        AverageOrderValue,
        RevenuePerTransaction,
        TakeRate,
        RevenuePerProject,
        NeedsReview
    }

    public enum ForecastAlignmentStatus
    {
        Aligned,
        MinorVariance,
        MaterialVariance,
        NeedsReview
    }

    public enum PricingRiskType
    {
        BelowCost,
        MarginTooThin,
        ForecastMismatch,
        UnsupportedPremium,
        OverComplexPricing,
        NoPriceEvidence,
        CustomerSegmentMismatch,
        DiscountRisk,
        UnvalidatedWillingnessToPay
    }

    public enum PricingRiskSeverity
    {
        Low,
        Medium,
        High,
        Critical
    }

    public enum TaxMode
    {
        TaxExclusive,           // HT (Hors Taxes) - configured explicit tax-exclusive
        TaxInclusive,           // TTC (Toutes Taxes Comprises) - configured explicit tax-inclusive
        Exempt,                 // Explicitly exempt from VAT / taxes
        NotApplicableOrUnknown  // Default when tax status not legally evidenced / unconfigured
    }

    public enum PricingStatus
    {
        Draft,
        Generated,
        Refreshed,
        NeedsValidation,
        Stale
    }

    // =========================================================================
    // SUPPORTING MODELS
    // =========================================================================

    public class PricePresentation
    {
        [BsonElement("Currency")]
        public string Currency { get; set; } = "EUR";

        [BsonElement("TaxMode")]
        [BsonRepresentation(BsonType.String)]
        public TaxMode TaxMode { get; set; } = TaxMode.NotApplicableOrUnknown;

        [BsonElement("TaxRateReference")]
        public string? TaxRateReference { get; set; }

        [BsonElement("DisplayPrice")]
        public string DisplayPrice { get; set; } = string.Empty;
    }

    public class PriceEvidence
    {
        [BsonElement("Type")]
        [BsonRepresentation(BsonType.String)]
        public PriceEvidenceType Type { get; set; } = PriceEvidenceType.NeedsReview;

        [BsonElement("Value")]
        public decimal? Value { get; set; }

        [BsonElement("SourceReference")]
        public string SourceReference { get; set; } = string.Empty;

        [BsonElement("Confidence")]
        [BsonRepresentation(BsonType.String)]
        public PricingConfidence Confidence { get; set; } = PricingConfidence.NeedsValidation;

        [BsonElement("UpdatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class PricingMaterialityPolicy
    {
        /// <summary>
        /// Relative variance threshold (e.g. 0.20m = 20%). Configurable per model/basis.
        /// </summary>
        [BsonElement("RelativeVarianceThreshold")]
        public decimal RelativeVarianceThreshold { get; set; } = 0.20m;

        [BsonElement("AbsoluteVarianceThreshold")]
        public decimal? AbsoluteVarianceThreshold { get; set; }

        [BsonElement("RevenueModel")]
        public string RevenueModel { get; set; } = string.Empty;

        [BsonElement("ComparisonBasis")]
        [BsonRepresentation(BsonType.String)]
        public ForecastAlignmentBasis ComparisonBasis { get; set; } = ForecastAlignmentBasis.MonthlyRevenuePerCustomer;
    }

    public class UnitEconomics
    {
        [BsonElement("PricePerUnit")]
        public decimal PricePerUnit { get; set; }

        [BsonElement("VariableCostPerUnit")]
        public decimal VariableCostPerUnit { get; set; }

        [BsonElement("ContributionMargin")]
        public decimal ContributionMargin { get; set; }

        [BsonElement("ContributionMarginRate")]
        public decimal ContributionMarginRate { get; set; }

        [BsonElement("GrossMargin")]
        public decimal? GrossMargin { get; set; }

        [BsonElement("GrossMarginRate")]
        public decimal? GrossMarginRate { get; set; }

        [BsonElement("MinimumPriceFloor")]
        public decimal? MinimumPriceFloor { get; set; }

        [BsonElement("MarginTargetType")]
        [BsonRepresentation(BsonType.String)]
        public MarginTargetType MarginTargetType { get; set; } = MarginTargetType.Percentage;

        [BsonElement("BreakEvenVolume")]
        public int? BreakEvenVolume { get; set; }

        [BsonElement("CACReference")]
        public decimal? CACReference { get; set; }

        [BsonElement("LTVReference")]
        public decimal? LTVReference { get; set; }

        [BsonElement("LtvCacRatio")]
        public double? LtvCacRatio { get; set; }

        [BsonElement("PaybackPeriod")]
        public double? PaybackPeriod { get; set; }

        /// <summary>
        /// Validated | Supported | NeedsReview
        /// </summary>
        [BsonElement("ValidationStatus")]
        public string ValidationStatus { get; set; } = "Supported";
    }

    public class ForecastAlignmentDto
    {
        [BsonElement("Status")]
        [BsonRepresentation(BsonType.String)]
        public ForecastAlignmentStatus Status { get; set; } = ForecastAlignmentStatus.NeedsReview;

        [BsonElement("Basis")]
        [BsonRepresentation(BsonType.String)]
        public ForecastAlignmentBasis Basis { get; set; } = ForecastAlignmentBasis.MonthlyRevenuePerCustomer;

        [BsonElement("ForecastArpu")]
        public decimal? ForecastArpu { get; set; }

        [BsonElement("ProposedEquivalentValue")]
        public decimal ProposedEquivalentValue { get; set; }

        [BsonElement("VariancePercentage")]
        public decimal VariancePercentage { get; set; }

        [BsonElement("Explanation")]
        public string Explanation { get; set; } = string.Empty;

        [BsonElement("Recommendation")]
        public string Recommendation { get; set; } = string.Empty;

        [BsonElement("MaterialityPolicyApplied")]
        public PricingMaterialityPolicy? MaterialityPolicyApplied { get; set; }
    }

    public class PricingRisk
    {
        [BsonElement("Key")]
        public string Key { get; set; } = string.Empty;

        [BsonElement("Type")]
        [BsonRepresentation(BsonType.String)]
        public PricingRiskType Type { get; set; } = PricingRiskType.NoPriceEvidence;

        [BsonElement("Severity")]
        [BsonRepresentation(BsonType.String)]
        public PricingRiskSeverity Severity { get; set; } = PricingRiskSeverity.Medium;

        [BsonElement("Description")]
        public string Description { get; set; } = string.Empty;

        [BsonElement("Evidence")]
        public string Evidence { get; set; } = string.Empty;

        [BsonElement("Recommendation")]
        public string Recommendation { get; set; } = string.Empty;

        [BsonElement("NeedsValidation")]
        public bool NeedsValidation { get; set; } = true;
    }

    public class PricingExperiment
    {
        [BsonElement("Hypothesis")]
        public string Hypothesis { get; set; } = string.Empty;

        [BsonElement("Segment")]
        public string Segment { get; set; } = string.Empty;

        [BsonElement("VariantA")]
        public string VariantA { get; set; } = string.Empty;

        [BsonElement("VariantB")]
        public string VariantB { get; set; } = string.Empty;

        [BsonElement("Metric")]
        public string Metric { get; set; } = string.Empty;

        [BsonElement("DurationGuidance")]
        public string DurationGuidance { get; set; } = string.Empty;

        [BsonElement("SampleRequirement")]
        public string SampleRequirement { get; set; } = string.Empty;

        [BsonElement("Status")]
        public string Status { get; set; } = "Recommended";
    }

    public class PricingOffer
    {
        [BsonElement("Id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        /// <summary>
        /// Stable key across regenerations (e.g. "pricing.segment.starter", "pricing.service.retainer")
        /// </summary>
        [BsonElement("Key")]
        public string Key { get; set; } = string.Empty;

        [BsonElement("Name")]
        public string Name { get; set; } = string.Empty;

        [BsonElement("CustomerSegment")]
        public string CustomerSegment { get; set; } = string.Empty;

        [BsonElement("ValueDelivered")]
        public string ValueDelivered { get; set; } = string.Empty;

        [BsonElement("IncludedFeatures")]
        public List<string> IncludedFeatures { get; set; } = new();

        [BsonElement("PricingModel")]
        [BsonRepresentation(BsonType.String)]
        public RevenueModelType PricingModel { get; set; } = RevenueModelType.Subscription;

        [BsonElement("BillingFrequency")]
        [BsonRepresentation(BsonType.String)]
        public BillingFrequency BillingFrequency { get; set; } = BillingFrequency.Monthly;

        /// <summary>
        /// Effective price active in the system (FounderPrice ?? RecommendedPrice)
        /// </summary>
        [BsonElement("Price")]
        public decimal Price { get; set; }

        [BsonElement("Currency")]
        public string Currency { get; set; } = "EUR";

        // --- INVARIANT: THREE DISTINCT PRICES NEVER CONFLATED ---
        [BsonElement("RecommendedPrice")]
        public decimal RecommendedPrice { get; set; }

        [BsonElement("FounderPrice")]
        public decimal? FounderPrice { get; set; }

        [BsonElement("MarketReferencePrice")]
        public decimal? MarketReferencePrice { get; set; }

        [BsonElement("ValidatedMarketPrice")]
        public decimal? ValidatedMarketPrice { get; set; }

        [BsonElement("MarketPriceEvidenceType")]
        [BsonRepresentation(BsonType.String)]
        public MarketPriceEvidenceType MarketPriceEvidenceType { get; set; } = MarketPriceEvidenceType.Unknown;

        [BsonElement("MarketPriceValidationLevel")]
        [BsonRepresentation(BsonType.String)]
        public MarketPriceValidationLevel MarketPriceValidationLevel { get; set; } = MarketPriceValidationLevel.Unvalidated;

        [BsonElement("Presentation")]
        public PricePresentation Presentation { get; set; } = new();

        [BsonElement("FounderEdited")]
        public bool FounderEdited { get; set; }

        [BsonElement("VariablePricingRule")]
        public string? VariablePricingRule { get; set; }

        [BsonElement("MinimumCommitment")]
        public string? MinimumCommitment { get; set; }

        [BsonElement("SetupFee")]
        public decimal? SetupFee { get; set; }

        [BsonElement("TrialOrFreeEntry")]
        public string? TrialOrFreeEntry { get; set; }

        [BsonElement("TargetGrossMargin")]
        public decimal? TargetGrossMargin { get; set; }

        [BsonElement("EstimatedGrossMargin")]
        public decimal? EstimatedGrossMargin { get; set; }

        [BsonElement("PriceEvidence")]
        public PriceEvidence PriceEvidence { get; set; } = new();

        [BsonElement("Confidence")]
        [BsonRepresentation(BsonType.String)]
        public PricingConfidence Confidence { get; set; } = PricingConfidence.NeedsValidation;

        [BsonElement("UnitEconomics")]
        public UnitEconomics UnitEconomics { get; set; } = new();

        [BsonElement("ForecastAlignment")]
        public ForecastAlignmentDto? ForecastAlignment { get; set; }

        [BsonElement("Notes")]
        public string? Notes { get; set; }
    }

    public class DiscountPolicy
    {
        [BsonElement("LaunchDiscount")]
        public string? LaunchDiscount { get; set; }

        [BsonElement("AnnualBillingDiscount")]
        public string? AnnualBillingDiscount { get; set; }

        [BsonElement("VolumeDiscount")]
        public string? VolumeDiscount { get; set; }

        [BsonElement("PromotionalLimit")]
        public string? PromotionalLimit { get; set; }

        [BsonElement("MarginImpact")]
        public string? MarginImpact { get; set; }

        [BsonElement("Notes")]
        public string? Notes { get; set; }
    }

    public class FreeEntryStrategy
    {
        [BsonElement("Exists")]
        public bool Exists { get; set; }

        [BsonElement("Purpose")]
        public string? Purpose { get; set; }

        [BsonElement("FreeLimit")]
        public string? FreeLimit { get; set; }

        [BsonElement("ConversionTrigger")]
        public string? ConversionTrigger { get; set; }

        [BsonElement("PaidUpgradePath")]
        public string? PaidUpgradePath { get; set; }

        [BsonElement("EconomicsWarning")]
        public string? EconomicsWarning { get; set; }
    }

    public class LaunchPricingRecommendation
    {
        [BsonElement("RecommendedModel")]
        [BsonRepresentation(BsonType.String)]
        public RevenueModelType RecommendedModel { get; set; } = RevenueModelType.Subscription;

        [BsonElement("UnderlyingRevenueModels")]
        public List<string> UnderlyingRevenueModels { get; set; } = new();

        [BsonElement("RecommendedOffers")]
        public List<string> RecommendedOffers { get; set; } = new();

        [BsonElement("Reasoning")]
        public string Reasoning { get; set; } = string.Empty;

        [BsonElement("Confidence")]
        [BsonRepresentation(BsonType.String)]
        public PricingConfidence Confidence { get; set; } = PricingConfidence.NeedsValidation;

        [BsonElement("ValidationRequired")]
        public bool ValidationRequired { get; set; }

        [BsonElement("FinancialWarnings")]
        public List<string> FinancialWarnings { get; set; } = new();

        [BsonElement("NextValidationStep")]
        public string NextValidationStep { get; set; } = string.Empty;
    }

    public class PricingSourceVersions
    {
        [BsonElement("MarketStudyVersion")]
        public int MarketStudyVersion { get; set; }

        [BsonElement("MarketStudyUpdatedAt")]
        public DateTime? MarketStudyUpdatedAt { get; set; }

        [BsonElement("BusinessModelVersion")]
        public int BusinessModelVersion { get; set; }

        [BsonElement("BusinessModelUpdatedAt")]
        public DateTime? BusinessModelUpdatedAt { get; set; }

        [BsonElement("ForecastVersion")]
        public int ForecastVersion { get; set; }

        [BsonElement("ForecastUpdatedAt")]
        public DateTime? ForecastUpdatedAt { get; set; }

        [BsonElement("BusinessPlanVersion")]
        public int BusinessPlanVersion { get; set; }

        [BsonElement("BusinessPlanUpdatedAt")]
        public DateTime? BusinessPlanUpdatedAt { get; set; }

        [BsonElement("ProjectUpdatedAt")]
        public DateTime? ProjectUpdatedAt { get; set; }

        [BsonElement("NeedsAnalysisUpdatedAt")]
        public DateTime? NeedsAnalysisUpdatedAt { get; set; }

        [BsonElement("SupportPlanUpdatedAt")]
        public DateTime? SupportPlanUpdatedAt { get; set; }

        [BsonElement("SupportPlanConsumed")]
        public bool SupportPlanConsumed { get; set; } = false;

        /// <summary>
        /// List of sources actually consumed to construct this pricing strategy.
        /// Conditional staleness triggers ONLY when a consumed source changes.
        /// </summary>
        [BsonElement("ConsumedSources")]
        public List<string> ConsumedSources { get; set; } = new();
    }

    // =========================================================================
    // ROOT STRATEGY ENTITY (Persisted on CreatorJourney.Phase4Data.PricingStrategy)
    // =========================================================================

    public class PricingStrategy
    {
        [BsonElement("Status")]
        [BsonRepresentation(BsonType.String)]
        public PricingStatus Status { get; set; } = PricingStatus.Draft;

        [BsonElement("GeneratedAt")]
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("UpdatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("Summary")]
        public string Summary { get; set; } = string.Empty;

        /// <summary>
        /// Primary revenue model (e.g. Subscription, Retainer, Commission, OneTime)
        /// </summary>
        [BsonElement("PrimaryRevenueModel")]
        [BsonRepresentation(BsonType.String)]
        public RevenueModelType PrimaryRevenueModel { get; set; } = RevenueModelType.Subscription;

        /// <summary>
        /// Explicit underlying revenue streams for multi-stream/hybrid setups
        /// (e.g. ["Subscription", "SetupFee"], ["Commission", "SellerSubscription"])
        /// </summary>
        [BsonElement("RevenueModels")]
        public List<string> RevenueModels { get; set; } = new();

        [BsonElement("CustomerSegments")]
        public List<string> CustomerSegments { get; set; } = new();

        [BsonElement("Offers")]
        public List<PricingOffer> Offers { get; set; } = new();

        [BsonElement("FreeEntryStrategy")]
        public FreeEntryStrategy? FreeEntryStrategy { get; set; }

        [BsonElement("DiscountPolicy")]
        public DiscountPolicy? DiscountPolicy { get; set; }

        [BsonElement("UnitEconomicsSummary")]
        public UnitEconomics UnitEconomicsSummary { get; set; } = new();

        [BsonElement("ForecastAlignment")]
        public ForecastAlignmentDto? ForecastAlignment { get; set; }

        [BsonElement("PricingRisks")]
        public List<PricingRisk> PricingRisks { get; set; } = new();

        [BsonElement("PricingExperiments")]
        public List<PricingExperiment> PricingExperiments { get; set; } = new();

        [BsonElement("LaunchRecommendation")]
        public LaunchPricingRecommendation LaunchRecommendation { get; set; } = new();

        [BsonElement("SourceVersions")]
        public PricingSourceVersions SourceVersions { get; set; } = new();

        [BsonElement("FounderEdited")]
        public bool FounderEdited { get; set; }
    }

    // =========================================================================
    // REQUEST & RESPONSE DTOs
    // =========================================================================

    public class PricingStrategyResponse
    {
        public PricingStrategy? Strategy { get; set; }
        public bool UpdateAvailable { get; set; }
        public List<string> ChangedSources { get; set; } = new();
        public PrerequisiteGateDto? PrerequisiteGate { get; set; }
        public long IdeaVersion { get; set; }
    }

    public class GeneratePricingRequest
    {
        public string? IdeaId { get; set; }
        public long? ExpectedVersion { get; set; }
    }

    public class RefreshPricingRequest
    {
        public string? IdeaId { get; set; }
        public long? ExpectedVersion { get; set; }
    }

    public class UpdatePricingOfferRequest
    {
        public string? IdeaId { get; set; }
        public long? ExpectedVersion { get; set; }
        public decimal? FounderPrice { get; set; }
        public string? Name { get; set; }
        public string? BillingFrequency { get; set; }
        public List<string>? IncludedFeatures { get; set; }
        public List<string>? FeaturesIncluded { get; set; }
        public decimal? SetupFee { get; set; }
        public decimal? LaunchDiscountPercentage { get; set; }
        public string? Notes { get; set; }
        public string? FounderNotes { get; set; }
        public bool? ResetToRecommendation { get; set; }
    }
}
