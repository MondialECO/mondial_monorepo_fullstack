using WebApp.Models.DatabaseModels.Legal;

namespace WebApp.Models.Dtos
{
    public class UpdateLegalItemStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }

    public class AttachLegalItemEvidenceRequest
    {
        public string DocumentId { get; set; } = string.Empty;
        public string? Status { get; set; }
        public string? Notes { get; set; }
    }

    public class UnlinkLegalItemEvidenceRequest
    {
        public string DocumentId { get; set; } = string.Empty;
    }

    public class UpdateEvidenceStatusRequest
    {
        public string Status { get; set; } = string.Empty;
        public string? Notes { get; set; }
    }

    public class ReplaceLegalEvidenceRequest
    {
        public string OldLinkId { get; set; } = string.Empty;
        public string NewDocumentId { get; set; } = string.Empty;
        public string? Notes { get; set; }
    }

    public class LegalEvidenceLinkDto
    {
        public string Id { get; set; } = string.Empty;
        public string DocumentId { get; set; } = string.Empty;
        public string DocumentTitle { get; set; } = string.Empty;
        public string DocumentFileName { get; set; } = string.Empty;
        public string MimeType { get; set; } = "application/octet-stream";
        public long? SizeBytes { get; set; }
        public string RequirementId { get; set; } = string.Empty;
        public string RequirementTitle { get; set; } = string.Empty;
        public string Stage { get; set; } = string.Empty;
        public string Status { get; set; } = "linked";
        public DateTime LinkedAt { get; set; } = DateTime.UtcNow;
        public string? Notes { get; set; }
    }

    public class LegalEvidenceAuditEntryDto
    {
        public string Id { get; set; } = string.Empty;
        public string CreatorIdeaId { get; set; } = string.Empty;
        public string RequirementId { get; set; } = string.Empty;
        public string RequirementTitle { get; set; } = string.Empty;
        public string DocumentId { get; set; } = string.Empty;
        public string DocumentTitle { get; set; } = string.Empty;
        public string Action { get; set; } = "linked";
        public string Detail { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string ActorUserId { get; set; } = string.Empty;
    }

    public class LegalComplianceOverviewDto
    {
        public bool HasAssessment { get; set; }
        public CreatorLegalAssessment? Assessment { get; set; }
        public string Jurisdiction { get; set; } = "FR";
        public string RulesVersion { get; set; } = "FR-2026.1";
        public double PlanningReadinessPct { get; set; }
        public List<LegalStageBreakdown> StageBreakdown { get; set; } = new();
        public List<string> DetectedArchetypes { get; set; } = new();
        public bool IsPotentiallyOutdated { get; set; }
        public LegalStaleMetadata? StaleMetadata { get; set; }
        public LegalReconciliationSummary? ReconciliationSummary { get; set; }
        public List<OfficialSourceReference> OfficialSources { get; set; } = new();
        public List<LegalEvidenceLink> EvidenceLinks { get; set; } = new();
        public List<LegalEvidenceAuditEntry> EvidenceAuditTrail { get; set; } = new();
        public string Disclaimer { get; set; } = "Planning guidance only. Based on your current business information, MBC identified these requirements as potentially applicable in France. This feature does not constitute statutory legal advice.";
    }

    public class Phase3FreshnessOverviewDto
    {
        public bool AnyStale { get; set; }

        // 3.3 Forecast Freshness
        public bool ForecastNeedsReview { get; set; }
        public string ForecastReviewReason { get; set; } = "";
        public bool IsTamOverridden { get; set; }
        public decimal? MarketStudyTam { get; set; }
        public decimal? ForecastTam { get; set; }

        // 3.4 Legal Freshness
        public bool LegalIsStale { get; set; }
        public string LegalStaleReason { get; set; } = "";
        public LegalStaleMetadata? LegalStaleMetadata { get; set; }

        // 3.6 Business Plan Freshness
        public bool BusinessPlanIsStale { get; set; }
        public List<string> BusinessPlanStaleSections { get; set; } = new(); // e.g. ["Section 07", "Section 08", "Section 12"]
        public bool Section12IsStale { get; set; }
        public bool Section12HasUserEdits { get; set; }

        // 3.7 Investor Readiness Freshness
        public bool ReadinessUpdateAvailable { get; set; }
        public List<string> ReadinessChangedSources { get; set; } = new();
    }
}
