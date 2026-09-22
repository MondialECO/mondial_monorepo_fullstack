using System;
using System.Collections.Generic;

namespace WebApp.Models.Dtos
{
    /// <summary>
    /// Canonical Creator Dashboard Summary contract.
    /// Aggregates project identity, journey progress, deterministic next action,
    /// attention items, phase milestone statuses, and available generated results.
    /// </summary>
    public class CreatorDashboardSummaryDto
    {
        public DashboardProjectSummaryDto Project { get; set; } = new();
        public DashboardNextActionDto NextAction { get; set; } = new();
        public List<DashboardAttentionItemDto> AttentionItems { get; set; } = new();
        public DashboardJourneyOverviewDto Journey { get; set; } = new();
        public List<DashboardResultItemDto> Results { get; set; } = new();
        public DashboardPhase5SummaryDto Phase5 { get; set; } = new();
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class DashboardProjectSummaryDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Tagline { get; set; }
        public string? Concept { get; set; }
        public string? Category { get; set; }
        public string? Sector { get; set; }
        public double? ClarityScore { get; set; }
        public DashboardBrandSummaryDto Brand { get; set; } = new();
    }

    public class DashboardBrandSummaryDto
    {
        public bool HasBrandKit { get; set; }
        public string? BrandKitId { get; set; }
        /// <summary>not_started | in_progress | committed | skipped</summary>
        public string Status { get; set; } = "not_started";
        public string? LogoAsset { get; set; }
        public List<string>? ColorPalette { get; set; }
        public string? TypographyPairing { get; set; }
    }

    public class DashboardNextActionDto
    {
        public string Type { get; set; } = string.Empty;
        public int Phase { get; set; } = 2;
        public string Stage { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public string Href { get; set; } = string.Empty;
        public string Priority { get; set; } = "normal"; // high | normal | medium
        public string ButtonLabel { get; set; } = "Continue Setup";
    }

    public class DashboardAttentionItemDto
    {
        public string Id { get; set; } = string.Empty;
        /// <summary>BLOCKED | LEGAL_UPDATE | STALE_BLOCKING_DEPENDENCY | NEEDS_REVIEW | VALIDATION_REQUIRED | INFO</summary>
        public string Type { get; set; } = string.Empty;
        public int Phase { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Href { get; set; } = string.Empty;
        public string Severity { get; set; } = "warning"; // critical | warning | info
    }

    public class DashboardJourneyOverviewDto
    {
        public int CurrentPhase { get; set; } = 2;
        public int CompletedPhasesCount { get; set; }
        public int TotalPhasesCount { get; set; } = 4; // Phases 2, 3, 4, 5
        public List<DashboardPhaseMilestoneDto> Phases { get; set; } = new();
    }

    public class DashboardPhaseMilestoneDto
    {
        public int PhaseNumber { get; set; }
        public string Title { get; set; } = string.Empty;
        public string ShortName { get; set; } = string.Empty;
        /// <summary>locked | available | in_progress | complete | needs_review</summary>
        public string Status { get; set; } = "locked";
        public int CurrentStep { get; set; } = 1;
        public int TotalSteps { get; set; } = 1;
        public string Href { get; set; } = string.Empty;
        public List<DashboardSubstageDto> SubstageProgress { get; set; } = new();
    }

    public class DashboardSubstageDto
    {
        public string Key { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string Status { get; set; } = "locked"; // locked | available | in_progress | complete | stale
        public string Href { get; set; } = string.Empty;
    }

    public class DashboardResultItemDto
    {
        public string Key { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public int Phase { get; set; }
        /// <summary>Ready | Draft | Needs Review | Update Available</summary>
        public string Status { get; set; } = "Draft";
        public DateTime? UpdatedAt { get; set; }
        public bool IsStale { get; set; }
        public string Href { get; set; } = string.Empty;
        public bool Downloadable { get; set; }
        public string? ExportType { get; set; } // pdf | json | svg | view
    }

    public class DashboardPhase5SummaryDto
    {
        public bool IsUnlocked { get; set; }
        public string? ChosenPath { get; set; } // sell | build | null
        public string Status { get; set; } = "locked"; // locked | available | in_progress | completed
        public string Href { get; set; } = "/dashboard/creator/phase-5";
        public string GuidanceText { get; set; } = string.Empty;
    }
}
