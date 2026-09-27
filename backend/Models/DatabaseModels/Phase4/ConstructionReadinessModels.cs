using System;
using System.Collections.Generic;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels.Phase4
{
    // =========================================================================
    // CONSTRUCTION READINESS DOMAIN MODELS (Phase 4.9)
    // =========================================================================

    /// <summary>
    /// Represents the evaluation and recorded review for Step 4.9 Construction Readiness.
    /// </summary>
    [BsonIgnoreExtraElements]
    public class ConstructionReadinessReview
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        /// <summary>e.g. "Preparation in progress", "Ready for construction"</summary>
        public string Status { get; set; } = "Preparation in progress";

        /// <summary>
        /// Overall construction readiness score (0-100).
        /// Explicitly nullable: null represents "Score not yet calculated".
        /// </summary>
        public double? OverallScore { get; set; } = null;

        /// <summary>"NotCalculated" | "Calculated"</summary>
        public string ScoreStatus { get; set; } = "NotCalculated";

        /// <summary>Guidance explaining score state</summary>
        public string ScoreAvailabilityExplanation { get; set; } = "Review the available work and unresolved items below.";

        /// <summary>Position Headline (Section 1)</summary>
        public string PositionHeadline { get; set; } = string.Empty;

        /// <summary>What the founder can currently continue doing</summary>
        public string CurrentActionGuidance { get; set; } = string.Empty;

        /// <summary>Which critical dependency remains unresolved</summary>
        public string DependencyGuidance { get; set; } = string.Empty;

        /// <summary>Total count of saved artifacts (0-6)</summary>
        public int SavedArtifactsCount { get; set; }

        /// <summary>Six artifact cards (Section 2)</summary>
        public List<ReadinessArtifactCard> Artifacts { get; set; } = new();

        /// <summary>Issues requiring attention (Section 3)</summary>
        public List<ReadinessAttentionIssue> Issues { get; set; } = new();

        /// <summary>Recommended immediate next action (Section 4)</summary>
        public ReadinessNextAction? NextAction { get; set; }

        /// <summary>Timestamp when founder explicitly saved the review</summary>
        public DateTime? ReviewedAt { get; set; }

        /// <summary>Timestamp when this assessment was evaluated</summary>
        public DateTime EvaluatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>Policy version identifier</summary>
        public string PolicyVersion { get; set; } = "2026.1-construction-readiness";

        /// <summary>Content hash / fingerprint of upstream Phase 2, 3, 4 sources</summary>
        public string SourceFingerprint { get; set; } = string.Empty;

        /// <summary>Indicates if upstream data changed since last saved review</summary>
        public bool UpdateAvailable { get; set; } = false;

        /// <summary>Names of upstream sources that changed</summary>
        public List<string> ChangedSources { get; set; } = new();

        /// <summary>Authoritative Idea version</summary>
        public long IdeaVersion { get; set; }
    }

    [BsonIgnoreExtraElements]
    public class ReadinessArtifactCard
    {
        public string Id { get; set; } = string.Empty; // "brand_kit", "financial_forecast", "operational_roadmap", "pricing_decision", "launch_strategy", "launch_website"
        public string Title { get; set; } = string.Empty;
        public string Status { get; set; } = "Missing"; // "Available", "Generated", "Active", "Selected", "Saved", "Draft available", "Missing", "Update available"
        public string StatusColor { get; set; } = "gray"; // "emerald", "blue", "amber", "gray"
        public string Description { get; set; } = string.Empty;
        public string ActionLabel { get; set; } = string.Empty;
        public string ActionRoute { get; set; } = string.Empty;
    }

    [BsonIgnoreExtraElements]
    public class ReadinessAttentionIssue
    {
        public string Id { get; set; } = string.Empty; // "issue_technical_delivery", "issue_website_cta", "issue_website_version", "issue_marketing_budget", "issue_commercial_detail"
        public string Priority { get; set; } = "medium"; // "critical", "medium", "low"
        public string Title { get; set; } = string.Empty;
        public string Subtitle { get; set; } = string.Empty;
        public string Badge { get; set; } = string.Empty; // "Critical priority", "Asset action", "Selection", "Needs validation", "Commercial detail"
        public string BadgeColor { get; set; } = "gray"; // "rose", "amber", "blue", "gray"
        public string WhyItMatters { get; set; } = string.Empty;
        public string WhatIsAlreadyDecided { get; set; } = string.Empty;
        public string WhatIsStillNeeded { get; set; } = string.Empty;
        public List<string> WhatThisAffects { get; set; } = new();
        public string? ConnectedWork { get; set; }
        public string? ConnectedTaskId { get; set; }
        public string? SourcesText { get; set; }
        public string? ActionLabel { get; set; }
        public string? ActionRoute { get; set; }
        public string? SecondaryActionLabel { get; set; }
        public string? SecondaryActionRoute { get; set; }
        public string? ExtraInfo { get; set; }
    }

    [BsonIgnoreExtraElements]
    public class ReadinessNextAction
    {
        public string Type { get; set; } = "Existing roadmap task"; // "Existing roadmap task" | "Source review action"
        public string? EstimatedEffort { get; set; } // "1.5 hours" or null
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string PrimaryActionLabel { get; set; } = "Open roadmap task";
        public string PrimaryActionRoute { get; set; } = string.Empty;
        public string? SecondaryActionLabel { get; set; } = "View roadmap";
        public string? SecondaryActionRoute { get; set; } = string.Empty;
        public string? TaskId { get; set; }
    }

    public class SaveConstructionReadinessRequest
    {
        public string? IdeaId { get; set; }
        public long? ExpectedVersion { get; set; }
        public string? SourceFingerprint { get; set; }
    }

    public class ConstructionReadinessResponse
    {
        public ConstructionReadinessReview Review { get; set; } = new();
        public bool IsSaved { get; set; }
        public bool UpdateAvailable { get; set; }
        public List<string> ChangedSources { get; set; } = new();
        public long IdeaVersion { get; set; }
    }
}
