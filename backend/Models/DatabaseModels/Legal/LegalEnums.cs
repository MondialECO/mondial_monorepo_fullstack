namespace WebApp.Models.DatabaseModels.Legal
{
    /// <summary>
    /// Chronological execution stages for legal & compliance requirements.
    /// Controlled 5-stage taxonomy for France MVP.
    /// </summary>
    public static class LegalStages
    {
        public const string BeforeCreation = "before_creation";
        public const string CompanyCreation = "company_creation";
        public const string BeforeLaunch = "before_launch";
        public const string BeforeSale = "before_sale";
        public const string Ongoing = "ongoing";

        public static readonly string[] All =
        [
            BeforeCreation,
            CompanyCreation,
            BeforeLaunch,
            BeforeSale,
            Ongoing
        ];

        public static string GetDisplayName(string stage) => stage switch
        {
            BeforeCreation => "Before Company Creation",
            CompanyCreation => "Company Creation",
            BeforeLaunch => "Before Website Launch",
            BeforeSale => "Before First Sale",
            Ongoing => "Ongoing Compliance",
            _ => stage
        };
    }

    /// <summary>
    /// Lifecycle statuses for checklist/roadmap items.
    /// Backwards-compatible with legacy "pending" and "done".
    /// </summary>
    public static class LegalItemStatuses
    {
        public const string NotStarted = "not_started";
        public const string NeedsInformation = "needs_information";
        public const string ActionRequired = "action_required";
        public const string InProgress = "in_progress";
        public const string ReadyForReview = "ready_for_review";
        public const string Reviewed = "reviewed";
        public const string Completed = "completed";
        public const string NotApplicable = "not_applicable";

        // Legacy compatibility aliases
        public const string LegacyPending = "pending";
        public const string LegacyDone = "done";

        public static bool IsCompleted(string? status) =>
            string.Equals(status, Completed, System.StringComparison.OrdinalIgnoreCase) ||
            string.Equals(status, Reviewed, System.StringComparison.OrdinalIgnoreCase) ||
            string.Equals(status, LegacyDone, System.StringComparison.OrdinalIgnoreCase);

        public static bool IsActive(string? status) =>
            !string.Equals(status, NotApplicable, System.StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Priority level for legal requirements.
    /// </summary>
    public static class LegalPriorities
    {
        public const string Critical = "critical";
        public const string Recommended = "recommended";
        public const string Optional = "optional";
    }

    /// <summary>
    /// Evaluation outcome of the deterministic applicability engine.
    /// </summary>
    public static class ApplicabilityEvaluationStatuses
    {
        public const string Applicable = "applicable";
        public const string NotApplicable = "not_applicable";
        public const string NeedsInformation = "needs_information";
    }

    /// <summary>
    /// Signal provenance confidence level.
    /// </summary>
    public static class SignalConfidenceLevels
    {
        public const string Confirmed = "confirmed";
        public const string Derived = "derived";
        public const string Unknown = "unknown";
    }

    /// <summary>
    /// Statuses for evidence links in the Legal Evidence Vault.
    /// Explicitly avoids misleading authoritative claims such as "Legally Certified".
    /// </summary>
    public static class LegalEvidenceStatuses
    {
        public const string Linked = "linked";
        public const string NeedsReview = "needs_review";
        public const string AcceptedForPlanning = "accepted_for_planning";
        public const string Replaced = "replaced";
        public const string Archived = "archived";

        public static readonly string[] All =
        [
            Linked,
            NeedsReview,
            AcceptedForPlanning,
            Replaced,
            Archived
        ];
    }

    /// <summary>
    /// Audit trail actions for evidence lifecycle tracking.
    /// </summary>
    public static class LegalEvidenceAuditActions
    {
        public const string Uploaded = "uploaded";
        public const string Linked = "linked";
        public const string Unlinked = "unlinked";
        public const string Replaced = "replaced";
        public const string StatusChanged = "status_changed";
    }
}

