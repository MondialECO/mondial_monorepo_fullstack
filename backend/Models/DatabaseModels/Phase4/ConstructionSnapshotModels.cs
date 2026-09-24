using System;
using System.Collections.Generic;

namespace WebApp.Models.DatabaseModels.Phase4
{
    public static class ConstructionCategories
    {
        public const string BusinessFoundation = "Business Foundation";
        public const string Brand = "Brand";
        public const string Market = "Market";
        public const string BusinessModel = "Business Model";
        public const string Finance = "Finance";
        public const string LegalAndAdministration = "Legal & Administration";
        public const string Team = "Team";
        public const string Skills = "Skills";
        public const string Services = "Services";
        public const string Technology = "Technology";
        public const string Funding = "Funding";
        public const string Pricing = "Pricing";
        public const string GoToMarket = "Go-to-Market";
        public const string LaunchAssets = "Launch Assets";
        public const string Operations = "Operations";
    }

    public static class ConstructionItemStatus
    {
        public const string Ready = "Ready";
        public const string Partial = "Partial";
        public const string Missing = "Missing";
        public const string Critical = "Critical";
        public const string Optional = "Optional";
        public const string NeedsReview = "NeedsReview";
    }

    public static class ConstructionItemPriority
    {
        public const string Critical = "Critical";
        public const string High = "High";
        public const string Medium = "Medium";
        public const string Low = "Low";
        public const string Optional = "Optional";
    }

    public class ConstructionSnapshotItem
    {
        public string Key { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Status { get; set; } = ConstructionItemStatus.Ready;
        public string Priority { get; set; } = ConstructionItemPriority.Medium;
        public string Reason { get; set; } = string.Empty;
        public List<string> Source { get; set; } = new();
        public List<string> SourceReference { get; set; } = new();
        public string RecommendedNextStep { get; set; } = string.Empty;
        public bool Blocking { get; set; }
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    }

    public class Phase4SourceVersions
    {
        public int ProjectVersion { get; set; }
        public DateTime? ProjectUpdatedAt { get; set; }

        public string? MarketStudySessionId { get; set; }
        public int MarketStudyVersion { get; set; }
        public DateTime? MarketStudyUpdatedAt { get; set; }

        public string? BusinessModelSessionId { get; set; }
        public int BusinessModelVersion { get; set; }
        public DateTime? BusinessModelUpdatedAt { get; set; }

        public string? ForecastSessionId { get; set; }
        public int ForecastVersion { get; set; }
        public DateTime? ForecastUpdatedAt { get; set; }

        public string? BusinessPlanSessionId { get; set; }
        public int BusinessPlanVersion { get; set; }
        public DateTime? BusinessPlanUpdatedAt { get; set; }

        public int LegalChecklistCompletedCount { get; set; }
        public DateTime? LegalAssessmentUpdatedAt { get; set; }

        public int FormationVersion { get; set; }
        public DateTime? FormationUpdatedAt { get; set; }

        public DateTime? ProfessionalProfileUpdatedAt { get; set; }
    }

    public class ConstructionSnapshot
    {
        public string Status { get; set; } = "Completed";
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public string OverallSummary { get; set; } = string.Empty;

        public List<ConstructionSnapshotItem> ReadyItems { get; set; } = new();
        public List<ConstructionSnapshotItem> PartialItems { get; set; } = new();
        public List<ConstructionSnapshotItem> MissingItems { get; set; } = new();
        public List<ConstructionSnapshotItem> CriticalItems { get; set; } = new();
        public List<ConstructionSnapshotItem> OptionalItems { get; set; } = new();

        public List<string> Categories { get; set; } = new();
        public Phase4SourceVersions SourceReferences { get; set; } = new();
        public string? ProfileVersion { get; set; }
        public bool FounderEdited { get; set; }
    }

    public class ConstructionSnapshotResponse
    {
        public ConstructionSnapshot Snapshot { get; set; } = new();
        public bool UpdateAvailable { get; set; }
        public List<string> ChangedSources { get; set; } = new();
        public int ReadyCount { get; set; }
        public int PartialCount { get; set; }
        public int MissingCount { get; set; }
        public int CriticalCount { get; set; }
        public int OptionalCount { get; set; }
        public long IdeaVersion { get; set; }
    }
}
