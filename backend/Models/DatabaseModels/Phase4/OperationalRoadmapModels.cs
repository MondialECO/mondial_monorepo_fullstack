using System;
using System.Collections.Generic;

namespace WebApp.Models.DatabaseModels.Phase4
{
    public static class RoadmapStages
    {
        public const string Now = "NOW";
        public const string Next30Days = "NEXT_30_DAYS";
        public const string Days30To60 = "DAYS_30_TO_60";
        public const string Days60To90 = "DAYS_60_TO_90";
        public const string BeforeLaunch = "BEFORE_LAUNCH";
        public const string PostLaunch = "POST_LAUNCH";

        public static readonly string[] AllStages = new[]
        {
            Now,
            Next30Days,
            Days30To60,
            Days60To90,
            BeforeLaunch,
            PostLaunch
        };

        public static string GetUserFacingLabel(string stage) => stage switch
        {
            Now => "Now",
            Next30Days => "Next 30 Days",
            Days30To60 => "30–60 Days",
            Days60To90 => "60–90 Days",
            BeforeLaunch => "Before Launch",
            PostLaunch => "Post-Launch",
            _ => stage
        };
    }

    public static class RoadmapTaskStatus
    {
        public const string NotStarted = "NotStarted";
        public const string InProgress = "InProgress";
        public const string Blocked = "Blocked";
        public const string Done = "Done";
        public const string Skipped = "Skipped";
        public const string NeedsReview = "NeedsReview";
    }

    public static class RoadmapTaskPriority
    {
        public const string Critical = "Critical";
        public const string High = "High";
        public const string Medium = "Medium";
        public const string Low = "Low";
        public const string Optional = "Optional";
    }

    public static class RoadmapTaskEffort
    {
        public const string VerySmall = "Very Small";
        public const string Small = "Small";
        public const string Medium = "Medium";
        public const string Large = "Large";
        public const string VeryLarge = "Very Large";
    }

    public static class RoadmapCategories
    {
        public const string Business = "Business";
        public const string Brand = "Brand";
        public const string Market = "Market";
        public const string Finance = "Finance";
        public const string LegalAndAdministration = "Legal & Administration";
        public const string Formation = "Formation";
        public const string Team = "Team";
        public const string Skills = "Skills";
        public const string Services = "Services";
        public const string Technology = "Technology";
        public const string Funding = "Funding";
        public const string Pricing = "Pricing";
        public const string GoToMarket = "Go-to-Market";
        public const string Launch = "Launch";
        public const string Operations = "Operations";
    }

    public class RoadmapTask
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        /// <summary>Stable semantic key (e.g. legal.structure-confirmation, tech.define-execution-gap) used for reconciliation across refreshes.</summary>
        public string Key { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = RoadmapCategories.Business;
        public string Stage { get; set; } = RoadmapStages.Now;
        public string Priority { get; set; } = RoadmapTaskPriority.Medium;
        public string Status { get; set; } = RoadmapTaskStatus.NotStarted;
        public bool Blocking { get; set; }
        public string Why { get; set; } = string.Empty;
        public string EstimatedEffort { get; set; } = RoadmapTaskEffort.Medium;
        public string EstimatedDuration { get; set; } = string.Empty;
        public List<string> Dependencies { get; set; } = new();
        public List<string> Source { get; set; } = new();
        public List<string> SourceReference { get; set; } = new();
        public string? RelatedSnapshotItemKey { get; set; }
        public string? EarliestStart { get; set; }
        public string? TargetWindow { get; set; }
        public bool RequiresExternalAction { get; set; }
        public bool FounderEdited { get; set; }
        public string? FounderNotes { get; set; }
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }

    public class NextBestAction
    {
        public string TaskId { get; set; } = string.Empty;
        public string TaskKey { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string WhyNow { get; set; } = string.Empty;
        public string Priority { get; set; } = RoadmapTaskPriority.High;
        public bool Blocking { get; set; }
        public List<string> Source { get; set; } = new();
    }

    public class RoadmapStageGroup
    {
        public string Stage { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public List<RoadmapTask> Tasks { get; set; } = new();
    }

    public class OperationalRoadmap
    {
        public string Status { get; set; } = "Active";
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public string RoadmapSummary { get; set; } = string.Empty;
        public List<RoadmapStageGroup> Stages { get; set; } = new();
        public List<RoadmapTask> Tasks { get; set; } = new();
        public NextBestAction? NextBestAction { get; set; }
        public Phase4SourceVersions SourceVersions { get; set; } = new();
        public string? ProfileVersion { get; set; }
        public bool FounderEdited { get; set; }
    }

    public class OperationalRoadmapResponse
    {
        public OperationalRoadmap? Roadmap { get; set; }
        public bool UpdateAvailable { get; set; }
        public List<string> ChangedSources { get; set; } = new();
        public int ActiveTasksCount { get; set; }
        public int CriticalTasksCount { get; set; }
        public int CompletedTasksCount { get; set; }
    }

    public class UpdateRoadmapTaskRequest
    {
        public string? IdeaId { get; set; }
        public string TaskId { get; set; } = string.Empty;
        public string? Status { get; set; }
        public string? FounderNotes { get; set; }
    }
}
