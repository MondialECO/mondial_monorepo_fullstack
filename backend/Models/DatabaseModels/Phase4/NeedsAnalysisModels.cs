using System;
using System.Collections.Generic;

namespace WebApp.Models.DatabaseModels.Phase4
{
    public static class NeedCategories
    {
        public const string Team = "Team";
        public const string Services = "Services";
        public const string Technology = "Technology";
        public const string Finance = "Finance";
        public const string LegalAndAdministration = "Legal & Administration";
        public const string Marketing = "Marketing";
        public const string Sales = "Sales";
        public const string Operations = "Operations";
        public const string Training = "Training";
        public const string Infrastructure = "Infrastructure";

        public static readonly string[] All = new[]
        {
            Team,
            Services,
            Technology,
            Finance,
            LegalAndAdministration,
            Marketing,
            Sales,
            Operations,
            Training,
            Infrastructure
        };
    }

    public static class RequirementTypes
    {
        public const string Capability = "Capability";
        public const string Person = "Person";
        public const string ProfessionalService = "ProfessionalService";
        public const string Technology = "Technology";
        public const string FinancialResource = "FinancialResource";
        public const string LegalAdministrative = "LegalAdministrative";
        public const string OperationalResource = "OperationalResource";
        public const string TrainingCandidate = "TrainingCandidate";
        public const string Infrastructure = "Infrastructure";
        public const string Other = "Other";
    }

    public static class NeedSystemStatus
    {
        public const string Identified = "Identified";
        public const string NeedsReview = "NeedsReview";
        public const string Satisfied = "Satisfied";
        public const string NotRequired = "NotRequired";
    }

    public static class NeedFounderState
    {
        public const string Unreviewed = "Unreviewed";
        public const string Confirmed = "Confirmed";
        public const string InProgress = "InProgress";
        public const string Deferred = "Deferred";
        public const string ClaimedSatisfied = "ClaimedSatisfied";
    }

    public static class NeedPriority
    {
        public const string Critical = "Critical";
        public const string High = "High";
        public const string Medium = "Medium";
        public const string Low = "Low";
        public const string Optional = "Optional";
    }

    public static class NeedTiming
    {
        public const string Now = "Now";
        public const string Next30Days = "Next 30 Days";
        public const string Days30To60 = "30–60 Days";
        public const string Days60To90 = "60–90 Days";
        public const string BeforeLaunch = "Before Launch";
        public const string PostLaunch = "Post-Launch";
        public const string Later = "Later";

        public static string FromRoadmapStage(string stage) => stage switch
        {
            RoadmapStages.Now => Now,
            RoadmapStages.Next30Days => Next30Days,
            RoadmapStages.Days30To60 => Days30To60,
            RoadmapStages.Days60To90 => Days60To90,
            RoadmapStages.BeforeLaunch => BeforeLaunch,
            RoadmapStages.PostLaunch => PostLaunch,
            _ => Later
        };
    }

    public static class BudgetConfidence
    {
        public const string Known = "Known";
        public const string DerivedFromForecast = "DerivedFromForecast";
        public const string RangeOnly = "RangeOnly";
        public const string Unknown = "Unknown";
        public const string NeedsReview = "NeedsReview";
    }

    public class NeedsSourceVersions
    {
        public DateTime? ConstructionSnapshotUpdatedAt { get; set; }
        public DateTime? OperationalRoadmapUpdatedAt { get; set; }
        public int BusinessModelVersion { get; set; }
        public DateTime? BusinessModelUpdatedAt { get; set; }
        public int ForecastVersion { get; set; }
        public DateTime? ForecastUpdatedAt { get; set; }
        public DateTime? LegalAssessmentUpdatedAt { get; set; }
        public int LegalChecklistCompletedCount { get; set; }
        public int FormationVersion { get; set; }
        public DateTime? FormationUpdatedAt { get; set; }
        public DateTime? ProfessionalProfileUpdatedAt { get; set; }
    }

    public class CreatorNeed
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        /// <summary>Stable semantic key (e.g. team.technical-execution, service.accounting-support) used for reconciliation across refreshes.</summary>
        public string Key { get; set; } = string.Empty;
        public string Category { get; set; } = NeedCategories.Team;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string WhyNeeded { get; set; } = string.Empty;
        public string Priority { get; set; } = NeedPriority.Medium;
        public string Timing { get; set; } = NeedTiming.Now;

        /// <summary>System applicability status: Identified, NeedsReview, Satisfied, NotRequired.</summary>
        public string SystemStatus { get; set; } = NeedSystemStatus.Identified;

        /// <summary>Founder progress state: Unreviewed, Confirmed, InProgress, Deferred, ClaimedSatisfied.</summary>
        public string FounderState { get; set; } = NeedFounderState.Unreviewed;

        public bool Blocking { get; set; }
        public decimal? EstimatedBudget { get; set; }
        public string BudgetConfidence { get; set; } = Phase4.BudgetConfidence.Unknown;
        public string? CapabilityRequired { get; set; }
        public string RequirementType { get; set; } = RequirementTypes.Capability;
        public string? SuggestedSolutionType { get; set; }

        public List<string> RelatedRoadmapTaskKeys { get; set; } = new();
        public List<string> RelatedSnapshotItemKeys { get; set; } = new();
        public List<string> Source { get; set; } = new();
        public List<string> SourceReference { get; set; } = new();

        public bool FounderEdited { get; set; }
        public string? Notes { get; set; }
        public decimal? CustomBudget { get; set; }
        public string? CustomTiming { get; set; }

        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }

    public class NeedsAnalysis
    {
        public string Status { get; set; } = "Completed";
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public string Summary { get; set; } = string.Empty;

        /// <summary>Active unresolved requirements (SystemStatus == Identified or NeedsReview).</summary>
        public List<CreatorNeed> ActiveNeeds { get; set; } = new();

        /// <summary>Already covered or satisfied requirements kept separate from the active list.</summary>
        public List<CreatorNeed> CoveredRequirements { get; set; } = new();

        public Dictionary<string, int> CountsByCategory { get; set; } = new();
        public int CriticalNeedCount { get; set; }
        public int HighPriorityCount { get; set; }
        public int TotalActiveNeeds { get; set; }
        public int SatisfiedCount { get; set; }

        public NeedsSourceVersions SourceVersions { get; set; } = new();
        public string? ProfileVersion { get; set; }
        public bool FounderEdited { get; set; }
    }

    public class NeedsAnalysisResponse
    {
        public NeedsAnalysis? NeedsAnalysis { get; set; }
        public bool UpdateAvailable { get; set; }
        public List<string> ChangedSources { get; set; } = new();
        public int CriticalNeedCount { get; set; }
        public int HighPriorityCount { get; set; }
        public int TotalActiveNeeds { get; set; }
        public int SatisfiedCount { get; set; }
    }

    public class UpdateNeedStateRequest
    {
        public string? IdeaId { get; set; }
        public string NeedKey { get; set; } = string.Empty;
        public string? FounderState { get; set; }
        public string? Notes { get; set; }
        public decimal? CustomBudget { get; set; }
        public string? CustomTiming { get; set; }
    }
}
