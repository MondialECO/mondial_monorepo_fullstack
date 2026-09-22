using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels.Legal
{
    /// <summary>
    /// Traceability record explaining why a rule matched or was excluded.
    /// Provides 100% deterministic explanation without LLM hallucination.
    /// </summary>
    public class LegalEvaluationTrace
    {
        [BsonElement("RuleId")]
        public string RuleId { get; set; } = string.Empty;

        [BsonElement("RuleTitle")]
        public string RuleTitle { get; set; } = string.Empty;

        [BsonElement("Status")]
        public string Status { get; set; } = ApplicabilityEvaluationStatuses.Applicable;

        [BsonElement("MatchedConditions")]
        public List<string> MatchedConditions { get; set; } = new();

        [BsonElement("MissingSignals")]
        public List<string> MissingSignals { get; set; } = new();

        [BsonElement("TraceRationale")]
        public string TraceRationale { get; set; } = string.Empty;
    }

    /// <summary>
    /// Metrics per chronological stage.
    /// </summary>
    public class LegalStageBreakdown
    {
        [BsonElement("Stage")]
        public string Stage { get; set; } = string.Empty;

        [BsonElement("StageName")]
        public string StageName { get; set; } = string.Empty;

        [BsonElement("TotalCount")]
        public int TotalCount { get; set; }

        [BsonElement("CompletedCount")]
        public int CompletedCount { get; set; }

        [BsonElement("CriticalCount")]
        public int CriticalCount { get; set; }
    }

    /// <summary>
    /// Top-level persistent Legal Assessment entity for a Creator Idea.
    /// Captures the complete deterministic evaluation state, rules version,
    /// snapshot hash for change detection, and personalized roadmap items.
    /// </summary>
    public class CreatorLegalAssessment
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("CreatorIdeaId")]
        public string CreatorIdeaId { get; set; } = string.Empty;

        [BsonElement("UserId")]
        public string UserId { get; set; } = string.Empty;

        [BsonElement("Jurisdiction")]
        public string Jurisdiction { get; set; } = "FR";

        [BsonElement("RulesVersion")]
        public string RulesVersion { get; set; } = "FR-2026.1";

        [BsonElement("RulesFingerprint")]
        public string RulesFingerprint { get; set; } = string.Empty;

        [BsonElement("RulesLastVerifiedAt")]
        [BsonIgnoreIfNull]
        public DateTime? RulesLastVerifiedAt { get; set; }

        [BsonElement("AssessmentVersion")]
        public int AssessmentVersion { get; set; } = 1;

        /// <summary>
        /// SHA-256 fingerprint of the normalized business profile at evaluation time.
        /// Used for dirty-state detection when upstream Business Model or Clarifier changes.
        /// </summary>
        [BsonElement("BusinessSnapshotHash")]
        public string BusinessSnapshotHash { get; set; } = string.Empty;

        [BsonElement("IsPotentiallyOutdated")]
        public bool IsPotentiallyOutdated { get; set; } = false;

        [BsonElement("EvaluatedAt")]
        public DateTime EvaluatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("LastRelevantBusinessChangeAt")]
        [BsonIgnoreIfNull]
        public DateTime? LastRelevantBusinessChangeAt { get; set; }

        [BsonElement("BusinessProfile")]
        public LegalBusinessProfile BusinessProfile { get; set; } = new();

        [BsonElement("DetectedArchetypes")]
        public List<string> DetectedArchetypes { get; set; } = new();

        /// <summary>
        /// Weighted Planning Readiness (0.0% to 100.0%).
        /// Feeds the 15-point Step 3.7 Investor Readiness Audit.
        /// </summary>
        [BsonElement("PlanningReadinessPct")]
        public double PlanningReadinessPct { get; set; }

        [BsonElement("StageBreakdown")]
        public List<LegalStageBreakdown> StageBreakdown { get; set; } = new();

        [BsonElement("Items")]
        public List<CreatorLegalChecklistItem> Items { get; set; } = new();

        [BsonElement("EvaluationTraces")]
        public List<LegalEvaluationTrace> EvaluationTraces { get; set; } = new();

        [BsonElement("EvidenceLinks")]
        public List<LegalEvidenceLink> EvidenceLinks { get; set; } = new();

        [BsonElement("EvidenceAuditTrail")]
        public List<LegalEvidenceAuditEntry> EvidenceAuditTrail { get; set; } = new();

        [BsonElement("StaleMetadata")]
        [BsonIgnoreIfNull]
        public LegalStaleMetadata? StaleMetadata { get; set; }

        [BsonElement("ReconciliationSummary")]
        [BsonIgnoreIfNull]
        public LegalReconciliationSummary? ReconciliationSummary { get; set; }

        [BsonElement("Disclaimer")]
        public string Disclaimer { get; set; } =
            "Based on your current business information, MBC identified these requirements as potentially applicable in France. " +
            "This feature provides planning guidance and does not constitute legal advice. Consult verified French legal counsel before filing.";
    }

    public static class LegalStaleReasons
    {
        public const string None = "None";
        public const string BusinessDataChanged = "BusinessDataChanged";
        public const string RulesUpdated = "RulesUpdated";
        public const string JurisdictionChanged = "JurisdictionChanged";
        public const string AssessmentVersionChanged = "AssessmentVersionChanged";
        public const string Unknown = "Unknown";
    }

    public class LegalSignalDiff
    {
        [BsonElement("SignalKey")]
        public string SignalKey { get; set; } = string.Empty;

        [BsonElement("HumanLabel")]
        public string HumanLabel { get; set; } = string.Empty;

        [BsonElement("PreviousValue")]
        public bool PreviousValue { get; set; }

        [BsonElement("CurrentValue")]
        public bool CurrentValue { get; set; }

        /// <summary>
        /// "added" | "removed" | "modified"
        /// </summary>
        [BsonElement("ChangeType")]
        public string ChangeType { get; set; } = "added";

        /// <summary>
        /// e.g. "+ Consumer customers" or "- Physical storefront"
        /// </summary>
        [BsonElement("HumanDescription")]
        public string HumanDescription { get; set; } = string.Empty;
    }

    public class LegalStaleMetadata
    {
        [BsonElement("IsStale")]
        public bool IsStale { get; set; }

        [BsonElement("StaleReason")]
        public string StaleReason { get; set; } = LegalStaleReasons.None;

        [BsonElement("StaleDetectedAt")]
        [BsonIgnoreIfNull]
        public DateTime? StaleDetectedAt { get; set; }

        [BsonElement("LastEvaluatedAt")]
        [BsonIgnoreIfNull]
        public DateTime? LastEvaluatedAt { get; set; }

        [BsonElement("CurrentRulesVersion")]
        public string CurrentRulesVersion { get; set; } = "FR-2026.1";

        [BsonElement("AssessmentRulesVersion")]
        public string AssessmentRulesVersion { get; set; } = "FR-2026.1";

        [BsonElement("Diffs")]
        public List<LegalSignalDiff> Diffs { get; set; } = new();

        [BsonElement("HumanChangeDescriptions")]
        public List<string> HumanChangeDescriptions { get; set; } = new();
    }

    public class ReconciliationRequirementItem
    {
        [BsonElement("Id")]
        public string Id { get; set; } = string.Empty;

        [BsonElement("Title")]
        public string Title { get; set; } = string.Empty;

        [BsonElement("Stage")]
        public string Stage { get; set; } = string.Empty;

        [BsonElement("Priority")]
        public string Priority { get; set; } = string.Empty;

        [BsonElement("Category")]
        public string Category { get; set; } = string.Empty;
    }

    public class LegalReconciliationSummary
    {
        [BsonElement("AddedRequirements")]
        public List<ReconciliationRequirementItem> AddedRequirements { get; set; } = new();

        [BsonElement("RemovedRequirements")]
        public List<ReconciliationRequirementItem> RemovedRequirements { get; set; } = new();

        [BsonElement("UnchangedRequirementsCount")]
        public int UnchangedRequirementsCount { get; set; }

        [BsonElement("TotalApplicableCount")]
        public int TotalApplicableCount { get; set; }

        [BsonElement("ReconciledAt")]
        public DateTime ReconciledAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Association linking a project document in CreatorIdea.Documents to a specific statutory requirement.
    /// Supports N-to-N relationships: one requirement may have multiple evidence documents,
    /// and one document may substantiate multiple legal requirements.
    /// </summary>
    public class LegalEvidenceLink
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("DocumentId")]
        public string DocumentId { get; set; } = string.Empty;

        [BsonElement("DocumentTitle")]
        public string DocumentTitle { get; set; } = string.Empty;

        [BsonElement("DocumentFileName")]
        public string DocumentFileName { get; set; } = string.Empty;

        [BsonElement("MimeType")]
        public string MimeType { get; set; } = "application/octet-stream";

        [BsonElement("SizeBytes")]
        public long? SizeBytes { get; set; }

        [BsonElement("RequirementId")]
        public string RequirementId { get; set; } = string.Empty;

        [BsonElement("RequirementTitle")]
        public string RequirementTitle { get; set; } = string.Empty;

        [BsonElement("Stage")]
        public string Stage { get; set; } = string.Empty;

        /// <summary>
        /// Status of this evidence link:
        /// 'linked' | 'needs_review' | 'accepted_for_planning' | 'replaced' | 'archived'
        /// </summary>
        [BsonElement("Status")]
        public string Status { get; set; } = "linked";

        [BsonElement("LinkedAt")]
        public DateTime LinkedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("Notes")]
        [BsonIgnoreIfNull]
        public string? Notes { get; set; }
    }

    /// <summary>
    /// Chronological, immutable activity record for evidence operations in Creator Phase 3.
    /// Captures actions such as upload, linking, unlinking, replacement, and status updates.
    /// </summary>
    public class LegalEvidenceAuditEntry
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("CreatorIdeaId")]
        public string CreatorIdeaId { get; set; } = string.Empty;

        [BsonElement("RequirementId")]
        public string RequirementId { get; set; } = string.Empty;

        [BsonElement("RequirementTitle")]
        public string RequirementTitle { get; set; } = string.Empty;

        [BsonElement("DocumentId")]
        public string DocumentId { get; set; } = string.Empty;

        [BsonElement("DocumentTitle")]
        public string DocumentTitle { get; set; } = string.Empty;

        /// <summary>
        /// Action type: 'uploaded' | 'linked' | 'unlinked' | 'replaced' | 'status_changed'
        /// </summary>
        [BsonElement("Action")]
        public string Action { get; set; } = "linked";

        [BsonElement("Detail")]
        public string Detail { get; set; } = string.Empty;

        [BsonElement("Timestamp")]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [BsonElement("ActorUserId")]
        public string ActorUserId { get; set; } = string.Empty;
    }
}

