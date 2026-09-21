using System;
using System.Collections.Generic;

namespace WebApp.Models.DatabaseModels.Phase4
{
    public static class ResolutionModes
    {
        public const string Learn = "Learn";
        public const string Delegate = "Delegate";
        public const string Verify = "Verify";
        public const string Covered = "Covered";
        public const string NeedsReview = "NeedsReview";

        public static readonly string[] All = new[] { Learn, Delegate, Verify, Covered, NeedsReview };
    }

    public static class ResolutionConfidence
    {
        public const string High = "High";
        public const string Medium = "Medium";
        public const string Low = "Low";
        public const string NeedsReview = "NeedsReview";
    }

    public static class LearningFeasibility
    {
        public const string High = "High";
        public const string Medium = "Medium";
        public const string Low = "Low";
        public const string NotApplicable = "NotApplicable";
        public const string NeedsReview = "NeedsReview";
    }

    public static class LearningFormats
    {
        public const string SelfGuided = "SelfGuided";
        public const string StructuredCourse = "StructuredCourse";
        public const string Mentoring = "Mentoring";
        public const string HandsOnPractice = "HandsOnPractice";
        public const string Workshop = "Workshop";
        public const string Certification = "Certification";
        public const string Mixed = "Mixed";
        public const string NeedsReview = "NeedsReview";
    }

    public static class SuggestedResourceTypes
    {
        public const string Freelancer = "Freelancer";
        public const string ServiceProvider = "ServiceProvider";
        public const string Employee = "Employee";
        public const string Advisor = "Advisor";
        public const string Agency = "Agency";
        public const string Cofounder = "Cofounder";
        public const string Specialist = "Specialist";
        public const string NeedsReview = "NeedsReview";
    }

    public static class VerificationTypes
    {
        public const string ProfessionalReview = "ProfessionalReview";
        public const string Licence = "Licence";
        public const string Certification = "Certification";
        public const string LegalValidation = "LegalValidation";
        public const string AccountingValidation = "AccountingValidation";
        public const string ComplianceReview = "ComplianceReview";
        public const string InsuranceValidation = "InsuranceValidation";
        public const string Other = "Other";
    }

    public static class FounderDecisionChoices
    {
        public const string AcceptedRecommendation = "AcceptedRecommendation";
        public const string ChooseLearn = "ChooseLearn";
        public const string ChooseDelegate = "ChooseDelegate";
        public const string ChooseVerify = "ChooseVerify";
        public const string DeferDecision = "DeferDecision";
    }

    public static class ResolutionReasonCodes
    {
        public const string MandatoryProfessionalVerification = "MANDATORY_PROFESSIONAL_VERIFICATION";
        public const string ExistingCapabilitySufficient = "EXISTING_CAPABILITY_SUFFICIENT";
        public const string ExistingTeamCoverage = "EXISTING_TEAM_COVERAGE";
        public const string NoMatchingCapability = "NO_MATCHING_CAPABILITY";
        public const string LowAvailableTime = "LOW_AVAILABLE_TIME";
        public const string HighRequirementComplexity = "HIGH_REQUIREMENT_COMPLEXITY";
        public const string LaunchCritical = "LAUNCH_CRITICAL";
        public const string LearningPreference = "LEARNING_PREFERENCE";
        public const string DelegationPreference = "DELEGATION_PREFERENCE";
        public const string InsufficientEvidence = "INSUFFICIENT_EVIDENCE";
        public const string FeasibleLearningPath = "FEASIBLE_LEARNING_PATH";
    }

    public class CapabilityResolution
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        /// <summary>Stable semantic key (e.g. resolve.team.skills-software-development) for refresh reconciliation.</summary>
        public string Key { get; set; } = string.Empty;
        public string NeedKey { get; set; } = string.Empty;
        public string Capability { get; set; } = string.Empty;
        public string NeedCategory { get; set; } = string.Empty;
        /// <summary>System recommendation: Learn, Delegate, Verify, Covered, NeedsReview.</summary>
        public string ResolutionMode { get; set; } = ResolutionModes.NeedsReview;
        public string Confidence { get; set; } = ResolutionConfidence.NeedsReview;
        public string Why { get; set; } = string.Empty;
        public string ReasonCode { get; set; } = string.Empty;
        public string? CurrentSkillLevel { get; set; }
        public List<string> CurrentEvidence { get; set; } = new();
        public string RequiredCapabilityLevel { get; set; } = "Comfortable";
        public string Priority { get; set; } = NeedPriority.Medium;
        public string Timing { get; set; } = NeedTiming.Now;
        public bool Blocking { get; set; }
        public string? EstimatedEffort { get; set; }
        public string LearningFeasibility { get; set; } = Phase4.LearningFeasibility.NotApplicable;
        public bool IsMandatoryVerification { get; set; }
        public string? AuthoritySource { get; set; }
        public List<string> RelatedRoadmapTaskKeys { get; set; } = new();
        public List<string> Source { get; set; } = new();
        public List<string> SourceReference { get; set; } = new();

        /// <summary>Creator choice (AcceptedRecommendation, ChooseLearn, ChooseDelegate, ChooseVerify, DeferDecision). NEVER rewrites ResolutionMode.</summary>
        public string? FounderDecision { get; set; }
        public string? FounderNotes { get; set; }
        public bool FounderEdited { get; set; }
        public string? CustomTargetLevel { get; set; }

        public LearningAction? LearningAction { get; set; }
        public DelegationRequirement? DelegationRequirement { get; set; }
        public VerificationRequirement? VerificationRequirement { get; set; }

        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }

    public class LearningAction
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string ResolutionKey { get; set; } = string.Empty;
        public string Capability { get; set; } = string.Empty;
        public string Objective { get; set; } = string.Empty;
        public string? CurrentLevel { get; set; }
        public string TargetLevel { get; set; } = "Comfortable";
        public string Priority { get; set; } = NeedPriority.Medium;
        public string Timing { get; set; } = NeedTiming.Now;
        public string EstimatedLearningEffort { get; set; } = "Medium";
        public string LearningFormat { get; set; } = LearningFormats.SelfGuided;
        public List<string> LearningTopics { get; set; } = new();
        public List<string> CompletionCriteria { get; set; } = new();
        public List<string> Source { get; set; } = new();
        public string FounderStatus { get; set; } = "NotStarted"; // NotStarted, InProgress, Completed, Skipped
        public string? FounderNotes { get; set; }
        public bool FounderEdited { get; set; }
    }

    public class DelegationRequirement
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string ResolutionKey { get; set; } = string.Empty;
        public string Capability { get; set; } = string.Empty;
        public string RequirementSummary { get; set; } = string.Empty;
        public string Priority { get; set; } = NeedPriority.Medium;
        public string Timing { get; set; } = NeedTiming.Now;
        public bool Blocking { get; set; }
        public string SuggestedResourceType { get; set; } = SuggestedResourceTypes.ServiceProvider;
        public string ExpectedOutcome { get; set; } = string.Empty;
        public List<string> Source { get; set; } = new();
        public string FounderStatus { get; set; } = "NotStarted";
        public string? FounderNotes { get; set; }
    }

    public class VerificationRequirement
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string ResolutionKey { get; set; } = string.Empty;
        public string Requirement { get; set; } = string.Empty;
        public string VerificationType { get; set; } = VerificationTypes.ProfessionalReview;
        public string WhyRequired { get; set; } = string.Empty;
        public string? AuthoritySource { get; set; }
        public string Timing { get; set; } = NeedTiming.Now;
        public bool Blocking { get; set; }
        public List<string> EvidenceRequired { get; set; } = new();
        public List<string> Source { get; set; } = new();
        public bool IsMandatory { get; set; } = true;
        public LearningAction? OptionalLearningSupplement { get; set; }
        public string FounderStatus { get; set; } = "NotStarted";
        public string? FounderNotes { get; set; }
    }

    public class CoveredCapability
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string ResolutionKey { get; set; } = string.Empty;
        public string Capability { get; set; } = string.Empty;
        public string CoverageSource { get; set; } = string.Empty; // FounderSkill, TeamMember, Phase3Progress
        public string Evidence { get; set; } = string.Empty;
        public string? CurrentLevel { get; set; }
        public List<string> Source { get; set; } = new();
    }

    public class SkillsSourceVersions
    {
        public DateTime? NeedsAnalysisUpdatedAt { get; set; }
        public DateTime? OperationalRoadmapUpdatedAt { get; set; }
        public DateTime? ProfessionalProfileUpdatedAt { get; set; }
        public string WeeklyAvailability { get; set; } = string.Empty;
        public string LearningPreference { get; set; } = string.Empty;
        public string DelegationPreference { get; set; } = string.Empty;
        public DateTime? LegalAssessmentUpdatedAt { get; set; }
        public DateTime? FormationUpdatedAt { get; set; }
    }

    public class SkillsPlan
    {
        public string Status { get; set; } = "Completed";
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public string Summary { get; set; } = string.Empty;

        public List<CapabilityResolution> Resolutions { get; set; } = new();
        public List<LearningAction> LearningPlan { get; set; } = new();
        public List<DelegationRequirement> DelegationPlan { get; set; } = new();
        public List<VerificationRequirement> VerificationPlan { get; set; } = new();
        public List<CoveredCapability> CoveredCapabilities { get; set; } = new();

        public SkillsSourceVersions SourceVersions { get; set; } = new();
        public bool FounderEdited { get; set; }

        public int TotalResolutions { get; set; }
        public int LearnCount { get; set; }
        public int DelegateCount { get; set; }
        public int VerifyCount { get; set; }
        public int CoveredCount { get; set; }
        public int NeedsReviewCount { get; set; }
    }

    public class FounderProfileSummaryDto
    {
        public string CurrentSituation { get; set; } = string.Empty;
        public string WeeklyAvailability { get; set; } = string.Empty;
        public string PreferredApproach { get; set; } = string.Empty;
        public List<string> StrongestRelevantCapabilities { get; set; } = new();
    }

    public class SkillsPlanResponse
    {
        public SkillsPlan? SkillsPlan { get; set; }
        public bool UpdateAvailable { get; set; }
        public List<string> ChangedSources { get; set; } = new();
        public FounderProfileSummaryDto? ProfileContext { get; set; }
        public int LearnCount { get; set; }
        public int DelegateCount { get; set; }
        public int VerifyCount { get; set; }
        public int CoveredCount { get; set; }
        public int NeedsReviewCount { get; set; }
    }

    public class UpdateResolutionRequest
    {
        public string? IdeaId { get; set; }
        public string ResolutionKey { get; set; } = string.Empty;
        public string? FounderDecision { get; set; }
        public string? FounderNotes { get; set; }
        public string? CustomTargetLevel { get; set; }
    }
}
