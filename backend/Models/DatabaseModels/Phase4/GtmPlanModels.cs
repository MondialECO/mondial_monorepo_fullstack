using System;
using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using WebApp.Models.Phase4;

namespace WebApp.Models.DatabaseModels.Phase4
{
    // =========================================================================
    // ENUMS
    // =========================================================================

    public enum SegmentPriority
    {
        Primary,
        Secondary,
        Later,
        NeedsValidation
    }

    public enum SalesMotion
    {
        SelfServe,
        FounderLedSales,
        InsideSales,
        ConsultativeSales,
        EnterpriseSales,
        ChannelSales,
        Marketplace,
        ProductLed,
        Hybrid
    }

    public enum GtmChannelType
    {
        OrganicSearch,
        PaidSearch,
        PaidSocial,
        OrganicSocial,
        ContentMarketing,
        EmailOutbound,
        ColdCalling,
        DirectSales,
        Partnerships,
        Communities,
        Referral,
        Affiliate,
        Influencer,
        Events,
        Webinars,
        Marketplaces,
        ProductLedGrowth,
        AppStore,
        LocalOutreach,
        PR,
        FounderLedSales,
        Reseller,
        ChannelPartner,
        Other
    }

    public enum ChannelPriority
    {
        Now,
        Next,
        Later,
        Experimental,
        NotRecommended,
        NeedsReview
    }

    public enum ChannelExecutionMode
    {
        FounderLed,
        Delegated,
        Hybrid,
        ExistingTeam,
        NeedsReview
    }

    public enum ChannelEffortLevel
    {
        Low,      // ~1 load point
        Medium,   // ~2 load points
        High      // ~4 load points
    }

    public enum LaunchStage
    {
        PreLaunch,
        SoftLaunch,
        Launch,
        PostLaunch,
        Scale
    }

    public enum GtmRiskType
    {
        ChannelFitUnknown,
        OfferNotValidated,
        PriceNotValidated,
        BudgetTooLow,
        FounderCapacityRisk,
        LongSalesCycle,
        NoProof,
        HighCompetition,
        OperationalCapacityRisk,
        AudienceTooBroad,
        MultiSidedLiquidityRisk,
        DependencyRisk
    }

    public enum GtmConfidence
    {
        Supported,
        Provisional,
        NeedsValidation,
        InsufficientEvidence
    }

    public enum GtmBudgetStatus
    {
        Supported,
        NeedsValidation,
        Confirmed
    }

    public enum GtmBudgetSourceType
    {
        FounderDeclared,
        ForecastAssumption,
        ExistingCompanyBudget,
        AwardedSupport,
        ConfirmedFinancing,
        Unknown
    }

    public enum SpendableStatus
    {
        ConfirmedAvailable,
        Planned,
        Potential,
        Unknown
    }

    public enum ExperimentThresholdStatus
    {
        EvidenceBased,
        FounderDefined,
        NeedsBaseline,
        NotApplicable
    }

    public enum ExperimentRunOutcome
    {
        Validated,
        Disproven,
        Inconclusive,
        Pivot
    }

    public enum GtmRecommendationReason
    {
        SEGMENT_REACHABLE,
        FOUNDER_CAPABILITY_MATCH,
        DELEGATION_AVAILABLE,
        BUDGET_COMPATIBLE,
        BUDGET_NOT_CONFIRMED,
        SALES_MOTION_MATCH,
        PRICE_MODEL_MATCH,
        LONG_SALES_CYCLE,
        LOW_FOUNDER_CAPACITY,
        OFFER_NOT_VALIDATED,
        PRICE_NOT_VALIDATED,
        SEARCH_INTENT_SUPPORTED,
        PARTNERSHIP_FIT,
        INSUFFICIENT_EVIDENCE
    }

    // =========================================================================
    // CAPACITY MODELS (Refinement 1)
    // =========================================================================

    public class FounderCapacityProfile
    {
        public CapacityTier Tier { get; set; }
        public string RawWeeklyAvailability { get; set; } = string.Empty;
        public int EstimatedWeeklyHours { get; set; }
        public int MaxActiveFounderLedChannels { get; set; }
        public int MaxLoadPoints { get; set; }
        public int CurrentLoadPoints { get; set; }
        public bool IsOverloaded => CurrentLoadPoints > MaxLoadPoints;
        public string CapacityWarning { get; set; } = string.Empty;
    }

    // =========================================================================
    // SALES MOTION CONTEXT (Refinement 5)
    // =========================================================================

    public class SalesMotionContext
    {
        public string CustomerType { get; set; } = "B2B"; // B2B, B2C, Marketplace, etc.
        public string BuyingComplexity { get; set; } = "Medium"; // Low, Medium, High, Complex
        public int DecisionMakerCount { get; set; } = 1;
        public string OfferComplexity { get; set; } = "Standardized"; // Standardized, Configurable, Bespoke
        public string ImplementationEffort { get; set; } = "SelfServe"; // Instant, SelfServe, Assisted, CustomIntegration
        public string ContractValueBasis { get; set; } = "Mid"; // Micro, Low, Mid, HighTicket, Enterprise
        public string SalesCycleEvidence { get; set; } = string.Empty;
        public bool SelfServeFeasibility { get; set; } = true;
        public string TrustRequirement { get; set; } = "Standard"; // Standard, High, Regulated
        public decimal ReferencePrice { get; set; }
    }

    // =========================================================================
    // METRIC DEFINITIONS (Measurement Contract)
    // =========================================================================

    public class GtmMetricDefinition
    {
        public string Key { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string FunnelStage { get; set; } = string.Empty;
        public string Definition { get; set; } = string.Empty;
        public string Numerator { get; set; } = string.Empty;
        public string Denominator { get; set; } = string.Empty;
        public string DataSource { get; set; } = string.Empty;
        public decimal? Baseline { get; set; }
        public decimal? Target { get; set; }
        public ExperimentThresholdStatus TargetStatus { get; set; } = ExperimentThresholdStatus.NeedsBaseline;
        public string MeasurementFrequency { get; set; } = "Weekly";
    }

    // =========================================================================
    // SEGMENT STRATEGY (ICP vs Persona, Multi-sided)
    // =========================================================================

    public class GtmSegmentStrategy
    {
        public string SegmentKey { get; set; } = string.Empty;
        public string SegmentName { get; set; } = string.Empty;
        public SegmentPriority Priority { get; set; }
        public string SideRole { get; set; } = "SingleAudience"; // SingleAudience, SupplySide, DemandSide
        public string WhyNow { get; set; } = string.Empty;
        public string Problem { get; set; } = string.Empty;
        public string DesiredOutcome { get; set; } = string.Empty;
        public string ValueProposition { get; set; } = string.Empty;
        public string OfferKey { get; set; } = string.Empty;
        public decimal SelectedPrice { get; set; }
        public bool IsFounderPrice { get; set; }
        public string PrimaryMessage { get; set; } = string.Empty;
        public List<string> KeyObjections { get; set; } = new();
        public List<string> ReachabilityEvidence { get; set; } = new();
        public List<GtmChannelType> RecommendedChannels { get; set; } = new();
        public SalesMotion SalesMotion { get; set; }
        public string FunnelEntry { get; set; } = string.Empty;
        public GtmConfidence ValidationStatus { get; set; } = GtmConfidence.NeedsValidation;
        public List<string> SourceReferences { get; set; } = new();

        // ICP vs Persona distinction
        public string CompanyIcpDescription { get; set; } = string.Empty;
        public string PersonaBuyer { get; set; } = string.Empty;
        public string PersonaDecisionMaker { get; set; } = string.Empty;
        public string PersonaUser { get; set; } = string.Empty;
        public string PersonaInfluencer { get; set; } = string.Empty;
    }

    // =========================================================================
    // POSITIONING & MESSAGING STRATEGY
    // =========================================================================

    public class GtmPositioningStrategy
    {
        public string TargetCustomer { get; set; } = string.Empty;
        public string CoreProblem { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string PrimaryPromise { get; set; } = string.Empty;
        public string Differentiator { get; set; } = string.Empty;
        public string Evidence { get; set; } = string.Empty;
        public string CallToActionIntent { get; set; } = string.Empty;
        public bool PositioningMismatch { get; set; }
        public string MismatchExplanation { get; set; } = string.Empty;
        public List<string> SupportingMessages { get; set; } = new();
        public List<string> ProofPoints { get; set; } = new();
        public List<string> Objections { get; set; } = new();
        public List<string> ResponseAngles { get; set; } = new();
    }

    // =========================================================================
    // CHANNEL STRATEGY (Refinements 1 & 2)
    // =========================================================================

    public class GtmChannelStrategy
    {
        public string Key { get; set; } = string.Empty;
        public GtmChannelType Channel { get; set; }
        public string ChannelName { get; set; } = string.Empty;
        public string TargetSegment { get; set; } = string.Empty;
        public string Objective { get; set; } = string.Empty;
        public string WhyThisChannel { get; set; } = string.Empty;
        public string WhyNow { get; set; } = string.Empty;
        public string WhyNotOther { get; set; } = string.Empty;
        public List<GtmRecommendationReason> ReasonCodes { get; set; } = new();
        public LaunchStage Stage { get; set; }
        public ChannelPriority Priority { get; set; }
        public string Owner { get; set; } = "Founder";
        public ChannelExecutionMode ExecutionMode { get; set; }
        public ChannelEffortLevel EffortLevel { get; set; } = ChannelEffortLevel.Medium;
        public int LoadPoints { get; set; } = 2;
        public decimal? BudgetAmount { get; set; }
        public string TimeRequirement { get; set; } = string.Empty;
        public List<string> Preconditions { get; set; } = new();
        public List<string> KeyActions { get; set; } = new();
        public List<string> Metrics { get; set; } = new();
        public List<string> StopConditions { get; set; } = new();
        public List<string> ScaleConditions { get; set; } = new();
        public List<string> Evidence { get; set; } = new();
        public GtmConfidence Confidence { get; set; }
        public bool FounderEdited { get; set; }
        public string? FounderNotes { get; set; }
    }

    // =========================================================================
    // LAUNCH PLAN & ACTIONS
    // =========================================================================

    public class GtmLaunchAction
    {
        public string Key { get; set; } = string.Empty;
        public LaunchStage Stage { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Objective { get; set; } = string.Empty;
        public string TargetSegment { get; set; } = string.Empty;
        public GtmChannelType Channel { get; set; }
        public string Owner { get; set; } = "Founder";
        public string Timing { get; set; } = string.Empty;
        public List<string> DependencyKeys { get; set; } = new();
        public List<string> RelatedRoadmapTaskKeys { get; set; } = new();
        public decimal? Budget { get; set; }
        public string TimeRequirement { get; set; } = string.Empty;
        public List<string> CompletionCriteria { get; set; } = new();
        public List<string> SourceReferences { get; set; } = new();
        public string FounderStatus { get; set; } = "Pending"; // Pending, InProgress, Completed, Deferred
        public string? FounderNotes { get; set; }
        public bool FounderEdited { get; set; }
    }

    public class GtmLaunchPlan
    {
        public List<GtmLaunchAction> PreLaunch { get; set; } = new();
        public List<GtmLaunchAction> SoftLaunch { get; set; } = new();
        public List<GtmLaunchAction> Launch { get; set; } = new();
        public List<GtmLaunchAction> PostLaunch { get; set; } = new();
        public List<string> ScaleCriteria { get; set; } = new();
        public List<string> StopConditions { get; set; } = new();
    }

    // =========================================================================
    // EXPERIMENTS & RUNS (Refinements 3 & 6)
    // =========================================================================

    public class MetricObservation
    {
        public string MetricKey { get; set; } = string.Empty;
        public string MetricName { get; set; } = string.Empty;
        public decimal Value { get; set; }
        public string Notes { get; set; } = string.Empty;
    }

    public class ExperimentRun
    {
        public string RunId { get; set; } = Guid.NewGuid().ToString("N");
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
        public decimal ActualSpend { get; set; }
        public string ActualEffort { get; set; } = string.Empty;
        public string Observations { get; set; } = string.Empty;
        public List<MetricObservation> MetricsObserved { get; set; } = new();
        public ExperimentRunOutcome Outcome { get; set; } = ExperimentRunOutcome.Inconclusive;
        public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
        public string RecordedBy { get; set; } = "Founder";
    }

    public class GtmExperiment
    {
        public string Key { get; set; } = string.Empty;
        public string Hypothesis { get; set; } = string.Empty;
        public string Segment { get; set; } = string.Empty;
        public GtmChannelType Channel { get; set; }
        public string Offer { get; set; } = string.Empty;
        public string MessageAngle { get; set; } = string.Empty;
        public decimal? BudgetCap { get; set; }
        public string Timebox { get; set; } = "2 weeks";
        public string PrimaryMetric { get; set; } = string.Empty;
        public decimal? TargetValue { get; set; }
        public ExperimentThresholdStatus TargetStatus { get; set; } = ExperimentThresholdStatus.NeedsBaseline;
        public string SuccessCondition { get; set; } = string.Empty;
        public string StopCondition { get; set; } = string.Empty;
        public string EvidenceRequired { get; set; } = string.Empty;
        public string Status { get; set; } = "Draft"; // Draft, Active, Completed, Cancelled
        public string? Result { get; set; }
        
        // Immutable historical runs (Refinement 6)
        public List<ExperimentRun> Runs { get; set; } = new();
    }

    // =========================================================================
    // BUDGET PLAN & ALLOCATION (Refinement 4)
    // =========================================================================

    public class GtmChannelAllocation
    {
        public GtmChannelType Channel { get; set; }
        public string ChannelName { get; set; } = string.Empty;
        public decimal? Amount { get; set; }
        public decimal? Percentage { get; set; }
        public string Purpose { get; set; } = string.Empty;
        public string Evidence { get; set; } = string.Empty;
        public bool FounderEdited { get; set; }
    }

    public class GtmBudgetPlan
    {
        public decimal? TotalAvailableBudget { get; set; }
        public string Currency { get; set; } = "EUR";
        public GtmBudgetSourceType BudgetSource { get; set; } = GtmBudgetSourceType.Unknown;
        public SpendableStatus SpendableStatus { get; set; } = SpendableStatus.Unknown;
        public GtmBudgetStatus ValidationStatus { get; set; } = GtmBudgetStatus.NeedsValidation;
        public decimal? ForecastCacAssumption { get; set; }
        public decimal? ObservedCac { get; set; }
        public decimal? ValidatedCac { get; set; }
        public List<GtmChannelAllocation> ChannelAllocations { get; set; } = new();
        public decimal? ExperimentReserve { get; set; }
        public decimal? Contingency { get; set; }
        public string ProvenanceExplanation { get; set; } = string.Empty;
    }

    // =========================================================================
    // RISKS & ASSUMPTIONS
    // =========================================================================

    public class GtmRisk
    {
        public string Key { get; set; } = string.Empty;
        public GtmRiskType Type { get; set; }
        public string Severity { get; set; } = "Medium"; // Low, Medium, High, Critical
        public string Description { get; set; } = string.Empty;
        public string Evidence { get; set; } = string.Empty;
        public string Mitigation { get; set; } = string.Empty;
        public bool ValidationRequired { get; set; } = true;
    }

    public class GtmAssumption
    {
        public string Key { get; set; } = string.Empty;
        public string Statement { get; set; } = string.Empty;
        public string Evidence { get; set; } = string.Empty;
        public GtmConfidence Confidence { get; set; } = GtmConfidence.NeedsValidation;
        public string ValidationMethod { get; set; } = string.Empty;
        public string Status { get; set; } = "Unvalidated"; // Unvalidated, InTesting, Validated, Rejected
    }

    // =========================================================================
    // CONSUMED SOURCES & VERSIONS (Refinement 7)
    // =========================================================================

    public class GtmConsumedSources
    {
        public int MarketStudyVersion { get; set; }
        public int BusinessModelVersion { get; set; }
        public int ForecastVersion { get; set; }
        public int BusinessPlanVersion { get; set; }
        public DateTime? PricingStrategyUpdatedAt { get; set; }
        public string PricingOffersFingerprint { get; set; } = string.Empty;
        public decimal? ConsumedForecastMarketingBudget { get; set; }
        public decimal? ConsumedForecastArpu { get; set; }
        public decimal? ConsumedForecastCac { get; set; }
        public DateTime? RoadmapUpdatedAt { get; set; }
        public DateTime? NeedsAnalysisUpdatedAt { get; set; }
        public DateTime? SkillsPlanUpdatedAt { get; set; }
        public DateTime? ProfessionalProfileUpdatedAt { get; set; }
        public DateTime? ProjectUpdatedAt { get; set; }
        public string ConsumedWeeklyAvailability { get; set; } = string.Empty;
        public bool SupportPlanConsumed { get; set; }
        public DateTime? SupportPlanUpdatedAt { get; set; }
        public List<string> ConsumedKeys { get; set; } = new();
    }

    // =========================================================================
    // ROOT STRATEGY ENTITY (Persisted on CreatorJourney.Phase4Data.GtmStrategy)
    // =========================================================================

    public class GtmStrategy
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        public string Status { get; set; } = "Draft"; // Draft, Valid, Stale
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public string ExecutiveSummary { get; set; } = string.Empty;

        // Segments
        public string PrimaryLaunchSegment { get; set; } = string.Empty;
        public List<GtmSegmentStrategy> SegmentStrategies { get; set; } = new();

        // Positioning & Messaging
        public GtmPositioningStrategy PositioningStrategy { get; set; } = new();

        // Channels & Capacity
        public List<GtmChannelStrategy> ChannelStrategy { get; set; } = new();
        public FounderCapacityProfile FounderExecutionPlan { get; set; } = new();
        public List<string> DelegationPlan { get; set; } = new();

        // Funnel & Launch Plan
        public List<string> FunnelStrategy { get; set; } = new();
        public GtmLaunchPlan LaunchPlan { get; set; } = new();

        // Experiments & Metrics
        public List<GtmExperiment> Experiments { get; set; } = new();
        public List<GtmMetricDefinition> MetricsFramework { get; set; } = new();

        // Budget
        public GtmBudgetPlan BudgetPlan { get; set; } = new();

        // Risks & Assumptions
        public List<GtmRisk> Risks { get; set; } = new();
        public List<GtmAssumption> Assumptions { get; set; } = new();

        // Traceability & Overrides
        public GtmConsumedSources SourceVersions { get; set; } = new();
        public Dictionary<string, string> FounderOverrides { get; set; } = new();

        // Validation Flags
        public bool PricingValidationRequired { get; set; }
        public string PricingValidationNotice { get; set; } = string.Empty;
        public bool CapacityWarningActive { get; set; }
    }

    // =========================================================================
    // API DTOs
    // =========================================================================

    public class GtmStrategyResponse
    {
        public GtmStrategy? Strategy { get; set; }
        public bool UpdateAvailable { get; set; }
        public List<string> ChangedSources { get; set; } = new();
        public PrerequisiteGateDto? PrerequisiteGate { get; set; }
        public long IdeaVersion { get; set; }
    }

    public class GenerateGtmRequest
    {
        public string? IdeaId { get; set; }
        public long? ExpectedVersion { get; set; }
    }

    public class RefreshGtmRequest
    {
        public string? IdeaId { get; set; }
        public long? ExpectedVersion { get; set; }
    }

    public class UpdateGtmChannelRequest
    {
        public string? IdeaId { get; set; }
        public long? ExpectedVersion { get; set; }
        public ChannelPriority? Priority { get; set; }
        public ChannelExecutionMode? ExecutionMode { get; set; }
        public string? Owner { get; set; }
        public decimal? BudgetAmount { get; set; }
        public string? TimeRequirement { get; set; }
        public string? FounderNotes { get; set; }
    }

    public class RecordExperimentRunRequest
    {
        public string? IdeaId { get; set; }
        public long? ExpectedVersion { get; set; }
        public decimal ActualSpend { get; set; }
        public string ActualEffort { get; set; } = string.Empty;
        public string Observations { get; set; } = string.Empty;
        public List<MetricObservation> MetricsObserved { get; set; } = new();
        public ExperimentRunOutcome Outcome { get; set; } = ExperimentRunOutcome.Inconclusive;
        public string? StatusUpdate { get; set; } // e.g. "Completed", "Active"
    }

    public class UpdateGtmStrategyRequest
    {
        public string? IdeaId { get; set; }
        public long? ExpectedVersion { get; set; }
        public string? CustomOutreachMessage { get; set; }
        public string? CustomCustomerGroup { get; set; }
        public int? WeeklyHoursAvailable { get; set; }
        public decimal? SpendableBudget { get; set; }
        public int? TargetContacted { get; set; }
        public int? TargetReplies { get; set; }
        public int? TargetDemos { get; set; }
        public int? TargetPurchases { get; set; }
        public string? Status { get; set; } // e.g. "Active", "Draft", "Valid"
    }
}


