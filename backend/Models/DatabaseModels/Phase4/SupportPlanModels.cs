using System;
using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels.Phase4
{
    // =========================================================================
    // CANONICAL TAXONOMY & ENUMS
    // =========================================================================

    public static class SupportType
    {
        public const string Grant = "Grant";
        public const string Subsidy = "Subsidy";
        public const string SocialContributionExemption = "SocialContributionExemption";
        public const string TaxRelief = "TaxRelief";
        public const string TaxCredit = "TaxCredit";
        public const string Allowance = "Allowance";
        public const string Loan = "Loan";
        public const string HonorLoan = "HonorLoan";
        public const string Guarantee = "Guarantee";
        public const string Advance = "Advance";
        public const string EquitySupport = "EquitySupport";
        public const string EmploymentSupport = "EmploymentSupport";
        public const string InnovationSupport = "InnovationSupport";
        public const string TrainingFunding = "TrainingFunding";
        public const string ExportSupport = "ExportSupport";
        public const string RegionalSupport = "RegionalSupport";
        public const string EuropeanFunding = "EuropeanFunding";
        public const string CompetitionOrPrize = "CompetitionOrPrize";
        public const string Incubation = "Incubation";
        public const string Mentoring = "Mentoring";
        public const string AdvisorySupport = "AdvisorySupport";
        public const string Other = "Other";
    }

    public static class SupportStatus
    {
        public const string Active = "Active";
        public const string Upcoming = "Upcoming";
        public const string ClosingSoon = "ClosingSoon";
        public const string Closed = "Closed";
        public const string Suspended = "Suspended";
        public const string Unknown = "Unknown";
        public const string NeedsReview = "NeedsReview";
    }

    public static class SourceAuthority
    {
        public const string PrimaryOfficial = "PrimaryOfficial";
        public const string OfficialAggregator = "OfficialAggregator";
        public const string InstitutionalOfficial = "InstitutionalOfficial";
        public const string SecondaryReference = "SecondaryReference";
    }

    public static class EligibilityStatus
    {
        public const string Eligible = "Eligible";
        public const string EligibleToApply = "EligibleToApply";
        public const string PotentiallyEligible = "PotentiallyEligible";
        public const string NeedsInformation = "NeedsInformation";
        public const string NotYetEligible = "NotYetEligible";
        public const string NotEligible = "NotEligible";
        public const string Awarded = "Awarded";
        public const string Expired = "Expired";
        public const string NeedsReview = "NeedsReview";
    }

    /// <summary>
    /// Distinguishes statutory entitlement from competitive awards or loans.
    /// In UI, competitive or loan cases display "Eligible to Apply" rather than "Eligible for Funding".
    /// </summary>
    public static class SelectionMode
    {
        public const string Entitlement = "Entitlement";
        public const string Discretionary = "Discretionary";
        public const string Competitive = "Competitive";
        public const string CreditAssessment = "CreditAssessment";
        public const string NeedsReview = "NeedsReview";
    }

    public static class RuleNormalizationStatus
    {
        public const string VerifiedStructured = "VerifiedStructured";
        public const string HumanValidated = "HumanValidated";
        public const string Ambiguous = "Ambiguous";
        public const string Rejected = "Rejected";
    }

    public static class MatchConfidence
    {
        public const string High = "High";
        public const string Medium = "Medium";
        public const string Low = "Low";
        public const string NeedsReview = "NeedsReview";
    }

    public static class ApplicationReadiness
    {
        public const string ReadyToApply = "ReadyToApply";
        public const string AlmostReady = "AlmostReady";
        public const string MissingInformation = "MissingInformation";
        public const string PrerequisiteRequired = "PrerequisiteRequired";
        public const string NotYetEligible = "NotYetEligible";
        public const string NotApplicable = "NotApplicable";
    }

    public static class FounderApplicationState
    {
        public const string NotStarted = "NotStarted";
        public const string Reviewing = "Reviewing";
        public const string Preparing = "Preparing";
        public const string ReadyToApply = "ReadyToApply";
        public const string Applied = "Applied";
        public const string Awarded = "Awarded";
        public const string Rejected = "Rejected";
        public const string Withdrawn = "Withdrawn";
        public const string Skipped = "Skipped";
    }

    public static class RuleOperator
    {
        public const string Equals = "Equals";
        public const string NotEquals = "NotEquals";
        public const string In = "In";
        public const string NotIn = "NotIn";
        public const string GreaterThan = "GreaterThan";
        public const string LessThan = "LessThan";
        public const string Between = "Between";
        public const string Exists = "Exists";
        public const string LocationWithin = "LocationWithin";
        public const string DateBefore = "DateBefore";
        public const string DateAfter = "DateAfter";
        public const string Contains = "Contains";
    }

    // =========================================================================
    // DEDICATED CATALOGUE PERSISTENCE ENTITIES
    // =========================================================================

    [BsonIgnoreExtraElements]
    public class SupportSourceRegistryRecord
    {
        [BsonId]
        public ObjectId Id { get; set; } = ObjectId.GenerateNewId();

        public string SourceId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string AuthorityLevel { get; set; } = SourceAuthority.PrimaryOfficial;
        public string Jurisdiction { get; set; } = "FR";
        public string GeographicScope { get; set; } = "National"; // National, Regional, European, Local
        public string SourceType { get; set; } = "PublicAdministration";
        public string BaseReference { get; set; } = string.Empty;
        public string AdapterType { get; set; } = string.Empty;
        public DateTime? LastSuccessfulSyncAt { get; set; }
        public DateTime? LastCheckedAt { get; set; }
        public string FreshnessPolicy { get; set; } = "RollingNational";
        public bool Enabled { get; set; } = true;
        public string? Notes { get; set; }
    }

    [BsonIgnoreExtraElements]
    public class SupportSourceSnapshot
    {
        [BsonId]
        public ObjectId Id { get; set; } = ObjectId.GenerateNewId();

        public string SourceId { get; set; } = string.Empty;
        public string OpportunityExternalId { get; set; } = string.Empty;
        public DateTime RetrievedAt { get; set; } = DateTime.UtcNow;
        public DateTime? SourceUpdatedAt { get; set; }
        public string SourceUrl { get; set; } = string.Empty;
        public string ContentFingerprint { get; set; } = string.Empty;
        public string ParserVersion { get; set; } = "1.0";
        public string NormalizationVersion { get; set; } = "1.0";
        public string? RawPayload { get; set; }
    }

    [BsonIgnoreExtraElements]
    public class SupportOpportunity
    {
        [BsonId]
        public ObjectId Id { get; set; } = ObjectId.GenerateNewId();

        public string ExternalId { get; set; } = string.Empty;
        public string SourceId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string SupportType { get; set; } = Phase4.SupportType.Grant;
        public string SelectionMode { get; set; } = Phase4.SelectionMode.Discretionary;

        // Nuanced Authority Attribution
        public string ProgrammeOwner { get; set; } = string.Empty;        // e.g. "French State", "Region Île-de-France"
        public string ManagingAuthority { get; set; } = string.Empty;     // e.g. "Bpifrance", "France Travail", "URSSAF"
        public string ApplicationAuthority { get; set; } = string.Empty;  // e.g. "URSSAF Portal", "France Travail Agency"
        public string CatalogueSource { get; set; } = string.Empty;       // e.g. "Aides-entreprises.fr", "Service-Public"
        public List<string> AuthoritativeRuleSources { get; set; } = new();

        public string Jurisdiction { get; set; } = "FR";
        public string GeographicScope { get; set; } = "National";
        public List<string> EligibleLocations { get; set; } = new();      // Region names, departments, or empty for all

        public string TargetAudience { get; set; } = string.Empty;
        public List<string> EligibleBusinessStages { get; set; } = new(); // Idea, Creation, EarlyStage, Growth
        public List<string> EligibleLegalForms { get; set; } = new();     // SAS, SASU, SARL, MicroEntreprise, etc.
        public List<string> EligibleSectors { get; set; } = new();
        public List<string> ExcludedSectors { get; set; } = new();

        // Support Value (Never hardcoded in code; parsed from versioned source)
        public decimal? SupportValueMin { get; set; }
        public decimal? SupportValueMax { get; set; }
        public string SupportValueDescription { get; set; } = "Varies";
        public string SupportValueType { get; set; } = "EstimatedAmount"; // FixedGrant, ExemptionPercentage, LoanLimit, SubsidyRate

        public List<string> SupportedExpenses { get; set; } = new();      // Feasibility, Equipment, Hiring, Training, R&D
        public List<string> RelatedNeedCategories { get; set; } = new();  // Finance, Team, Technology, Training, LegalAdmin

        // Application Timing & Rules
        public ApplicationTiming TimingRules { get; set; } = new();
        public DateTime? ApplicationDeadline { get; set; }
        public bool IsRolling { get; set; } = true;
        public List<string> EvidenceRequired { get; set; } = new();

        public string OfficialReference { get; set; } = string.Empty;
        public string OfficialUrl { get; set; } = string.Empty;
        public DateTime EffectiveFrom { get; set; } = DateTime.UtcNow;
        public DateTime? EffectiveTo { get; set; }
        public DateTime LastVerifiedAt { get; set; } = DateTime.UtcNow;
        public DateTime? SourceUpdatedAt { get; set; }
        public string Status { get; set; } = SupportStatus.Active;
        public string RawSourceFingerprint { get; set; } = string.Empty;

        // Versioned Deterministic Rules
        public List<SupportEligibilityRule> EligibilityRules { get; set; } = new();
    }

    [BsonIgnoreExtraElements]
    public class SupportEligibilityRule
    {
        public string RuleId { get; set; } = string.Empty;
        public string Field { get; set; } = string.Empty;                // e.g. "Country", "Region", "BusinessStage", "CurrentSituation", "LegalForm"
        public string Operator { get; set; } = RuleOperator.Equals;
        public string ExpectedValue { get; set; } = string.Empty;        // Or comma-separated for In/NotIn, range for Between
        public bool Required { get; set; } = true;
        public string NormalizationStatus { get; set; } = RuleNormalizationStatus.VerifiedStructured;
        public string Description { get; set; } = string.Empty;
        public string? SourceReference { get; set; }
    }

    [BsonIgnoreExtraElements]
    public class SupportRuleVersionRecord
    {
        [BsonId]
        public ObjectId Id { get; set; } = ObjectId.GenerateNewId();

        public string RuleId { get; set; } = string.Empty;
        public string RuleVersion { get; set; } = "1.0";
        public DateTime EffectiveFrom { get; set; } = DateTime.UtcNow;
        public DateTime? EffectiveTo { get; set; }
        public DateTime LastVerifiedAt { get; set; } = DateTime.UtcNow;
        public string SourceReference { get; set; } = string.Empty;
        public string NormalizationStatus { get; set; } = RuleNormalizationStatus.VerifiedStructured;
        public List<SupportEligibilityRule> Rules { get; set; } = new();
    }

    public class ApplicationTiming
    {
        public DateTime? EarliestApplyAt { get; set; }
        public DateTime? LatestApplyAt { get; set; }
        public bool MustApplyBeforeExpense { get; set; }
        public bool MustApplyBeforeCreation { get; set; }
        public bool MustApplyAfterCreation { get; set; }
        public bool Rolling { get; set; } = true;
        public string TimingNotes { get; set; } = string.Empty;
    }

    // =========================================================================
    // CREATOR PROJECT EMBEDDED SUPPORT PLAN
    // =========================================================================

    [BsonIgnoreExtraElements]
    public class SupportPlan
    {
        public string Status { get; set; } = "Generated"; // Generated, Stale, Refreshed
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public SupportPlanSummary Summary { get; set; } = new();

        public List<SupportMatch> Matches { get; set; } = new();
        public List<SupportMatch> TopMatches { get; set; } = new();
        public List<MissingEligibilityFact> MissingEligibilityFacts { get; set; } = new();
        public List<SupportApplicationChecklist> ApplicationChecklists { get; set; } = new();

        public SupportSourceVersions SourceVersions { get; set; } = new();
        public SupportSourceFreshness SourceFreshness { get; set; } = new();
        public bool FounderEdited { get; set; }

        // Context facts recorded specifically for this project (e.g. registration with France Travail)
        public Dictionary<string, string> RecordedEligibilityFacts { get; set; } = new();
    }

    public class SupportPlanSummary
    {
        public int EligibleCount { get; set; }
        public int PotentialCount { get; set; }
        public int NeedsInfoCount { get; set; }
        public int ReadyToPrepareCount { get; set; }
        public int ActionCount { get; set; }
        public int TopMatchCount { get; set; }
        public int TotalEvaluatedCount { get; set; }
    }

    [BsonIgnoreExtraElements]
    public class SupportMatch
    {
        /// <summary>Stable key: support.{sourceId}.{externalOpportunityId}</summary>
        public string Key { get; set; } = string.Empty;
        public string OpportunityId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string SupportType { get; set; } = Phase4.SupportType.Grant;
        public string SelectionMode { get; set; } = Phase4.SelectionMode.Discretionary;

        public string ProgrammeOwner { get; set; } = string.Empty;
        public string ManagingAuthority { get; set; } = string.Empty;
        public string ApplicationAuthority { get; set; } = string.Empty;
        public string CatalogueSource { get; set; } = string.Empty;
        public string SourceAuthority { get; set; } = Phase4.SourceAuthority.PrimaryOfficial;
        public string OfficialReference { get; set; } = string.Empty;
        public string OfficialUrl { get; set; } = string.Empty;

        // Deterministic Eligibility Evaluation
        public string EligibilityStatus { get; set; } = Phase4.EligibilityStatus.PotentiallyEligible;
        public string MatchConfidence { get; set; } = Phase4.MatchConfidence.Medium;
        public List<string> WhyMatched { get; set; } = new();
        public List<string> ConditionsMet { get; set; } = new();
        public List<string> ConditionsMissing { get; set; } = new();
        public List<string> ConditionsFailed { get; set; } = new();
        public List<string> ReasonCodes { get; set; } = new();

        // Cross-Phase Linkages
        public List<string> RelatedNeedKeys { get; set; } = new();
        public List<string> RelatedRoadmapTaskKeys { get; set; } = new();

        // Financial value description (source-driven, never code constant)
        public decimal? EstimatedSupportValue { get; set; }
        public string SupportValueDescription { get; set; } = "Varies";
        public string SupportValueType { get; set; } = "EstimatedAmount";

        public ApplicationTiming Timing { get; set; } = new();
        public string ApplicationReadiness { get; set; } = Phase4.ApplicationReadiness.AlmostReady;
        public string RecommendedNextStep { get; set; } = string.Empty;
        public List<string> SourceReferences { get; set; } = new();
        public DateTime EvaluatedAt { get; set; } = DateTime.UtcNow;
        public string RuleVersion { get; set; } = "1.0";

        // Separate Founder Application State
        public string FounderApplicationState { get; set; } = Phase4.FounderApplicationState.NotStarted;
        public string? FounderNotes { get; set; }
        public bool FounderEdited { get; set; }

        public DateTime? SourceLastCheckedAt { get; set; }
        public DateTime OpportunityLastVerifiedAt { get; set; } = DateTime.UtcNow;
    }

    public class MissingEligibilityFact
    {
        public string Key { get; set; } = string.Empty;
        public string Question { get; set; } = string.Empty;
        public string WhyNeeded { get; set; } = string.Empty;
        public List<string> RelatedOpportunityIds { get; set; } = new();
        public string DataType { get; set; } = "boolean"; // boolean, select, text, number
        public List<string>? AllowedValues { get; set; }
        public string? CurrentValue { get; set; }
        public bool Required { get; set; } = true;
    }

    public class SupportApplicationChecklist
    {
        public string OpportunityId { get; set; } = string.Empty;
        public string OpportunityKey { get; set; } = string.Empty;
        public string OpportunityName { get; set; } = string.Empty;
        public List<ApplicationChecklistItem> Items { get; set; } = new();
        public int ReadyCount { get; set; }
        public int MissingCount { get; set; }
        public string ReadinessStatus { get; set; } = Phase4.ApplicationReadiness.AlmostReady;
    }

    public class ApplicationChecklistItem
    {
        public string Key { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public bool Required { get; set; } = true;
        public string Status { get; set; } = "Ready"; // Ready, Missing, InProgress, NotRequired
        public string? ExistingArtifactReference { get; set; } // e.g. "Phase 3 Business Plan", "Phase 3 Financial Forecast"
        public string? MissingInformationKey { get; set; }
        public string? Notes { get; set; }
    }

    public class SupportSourceVersions
    {
        public DateTime? SnapshotGeneratedAt { get; set; }
        public DateTime? RoadmapGeneratedAt { get; set; }
        public DateTime? NeedsGeneratedAt { get; set; }
        public DateTime? SkillsGeneratedAt { get; set; }
        public DateTime? ProfileUpdatedAt { get; set; }
        public DateTime? ForecastUpdatedAt { get; set; }
        public string CatalogueRuleVersion { get; set; } = "1.0";
    }

    public class SupportSourceFreshness
    {
        public DateTime LastCheckedAt { get; set; } = DateTime.UtcNow;
        public bool IsFresh { get; set; } = true;
        public List<string> UnverifiedSources { get; set; } = new();
    }

    // =========================================================================
    // NORMALIZED ELIGIBILITY CONTEXT
    // =========================================================================

    public class SupportEligibilityContext
    {
        public string UserId { get; set; } = string.Empty;
        public string IdeaId { get; set; } = string.Empty;
        public string Country { get; set; } = "FR";
        public string Region { get; set; } = string.Empty;
        public string? Department { get; set; }
        public string CurrentSituation { get; set; } = string.Empty; // JobSeeker, Employed, Student, etc.
        public string BusinessStage { get; set; } = "Idea";          // Idea, Creation, EarlyStage, Growth
        public string FormationStatus { get; set; } = "NotCreated";  // NotCreated, InProgress, Registered
        public string LegalForm { get; set; } = string.Empty;        // SAS, SASU, SARL, etc.
        public string Sector { get; set; } = string.Empty;
        public string ActivityType { get; set; } = string.Empty;
        public DateTime? CompanyCreatedAt { get; set; }
        public string EmploymentStatus { get; set; } = string.Empty;
        public string WeeklyAvailability { get; set; } = string.Empty;

        public List<string> ProjectNeeds { get; set; } = new();
        public List<string> UnresolvedNeedKeys { get; set; } = new();
        public decimal? EstimatedLaunchCapital { get; set; }
        public bool HasInnovativeActivity { get; set; }
        public bool HasHiringPlans { get; set; }
        public bool HasTrainingNeeds { get; set; }
        public bool HasExportAmbitions { get; set; }

        public Dictionary<string, string> KnownEligibilityFacts { get; set; } = new();
        public HashSet<string> ConfirmedAwardOpportunityKeys { get; set; } = new();
    }

    // =========================================================================
    // API REQUEST & RESPONSE ENVELOPES
    // =========================================================================

    public class SupportPlanResponse
    {
        public SupportPlan? SupportPlan { get; set; }
        public bool UpdateAvailable { get; set; }
        public List<string> ChangedSources { get; set; } = new();
        public SupportPlanSummary Summary { get; set; } = new();
        public FounderProfileSummaryDto? FounderProfileSummary { get; set; }
        public PrerequisiteGateDto? PrerequisiteGate { get; set; }
        public long IdeaVersion { get; set; }
    }

    public class GenerateSupportPlanRequest
    {
        public string? IdeaId { get; set; }
        public long? ExpectedVersion { get; set; }
    }

    public class RefreshSupportPlanRequest
    {
        public string? IdeaId { get; set; }
        public long? ExpectedVersion { get; set; }
    }

    public class UpdateFounderSupportStateRequest
    {
        public string? IdeaId { get; set; }
        public long? ExpectedVersion { get; set; }
        public string ApplicationState { get; set; } = Phase4.FounderApplicationState.NotStarted;
        public string? FounderNotes { get; set; }
    }

    public class AnswerEligibilityFactRequest
    {
        public string? IdeaId { get; set; }
        public long? ExpectedVersion { get; set; }
        public string FactKey { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
    }

    public class PrerequisiteGateDto
    {
        public bool CanAccess { get; set; } = true;
        public bool Phase3Completed { get; set; } = true;
        public bool HumainXReady { get; set; } = true;
        public bool ConstructionSnapshotExists { get; set; } = true;
        public bool OperationalRoadmapExists { get; set; } = true;
        public bool NeedsAnalysisExists { get; set; } = true;
        public bool NeedsAnalysisCurrent { get; set; } = true;
        public bool SkillsPlanExists { get; set; } = true;
        public bool SkillsPlanCurrent { get; set; } = true;
        public List<string> BlockingReasons { get; set; } = new();
    }
}
