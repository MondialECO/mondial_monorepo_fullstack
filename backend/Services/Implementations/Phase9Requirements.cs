namespace WebApp.Services.Implementations;

/// <summary>
/// Single backend definition of Phase 9 (Deal Execution) requirements.
/// Shared by the deal service, validator, controller, and tests so the
/// deal lifecycle cannot drift across components.
///
/// Semantic model: deterministic deal pipeline driven by an explicit state
/// machine. Status mutations only via transitions present in the per-axis
/// transition graphs. Illegal transitions throw and surface as HTTP 400.
/// </summary>
public static class Phase9Requirements
{
    // ----- Deal axis ----------------------------------------------------

    public const string DealStatusInitiated = "initiated";
    public const string DealStatusContacted = "contacted";
    public const string DealStatusInterested = "interested";
    public const string DealStatusMeetingScheduled = "meeting_scheduled";
    public const string DealStatusDueDiligence = "due_diligence";
    public const string DealStatusNegotiating = "negotiating";
    public const string DealStatusTermSheet = "term_sheet";
    public const string DealStatusAgreementSent = "agreement_sent";
    public const string DealStatusSigned = "signed";
    public const string DealStatusCompleted = "completed";
    public const string DealStatusRejected = "rejected";
    public const string DealStatusWithdrawn = "withdrawn";

    public static readonly IReadOnlyList<string> DealStatusWhitelist = new[]
    {
        DealStatusInitiated,
        DealStatusContacted,
        DealStatusInterested,
        DealStatusMeetingScheduled,
        DealStatusDueDiligence,
        DealStatusNegotiating,
        DealStatusTermSheet,
        DealStatusAgreementSent,
        DealStatusSigned,
        DealStatusCompleted,
        DealStatusRejected,
        DealStatusWithdrawn,
    };

    /// <summary>
    /// Terminal states. No outbound transitions; UpdateDealStatus from these
    /// is rejected as an illegal transition.
    /// </summary>
    public static readonly IReadOnlyList<string> DealTerminalStates = new[]
    {
        DealStatusCompleted,
        DealStatusRejected,
        DealStatusWithdrawn,
    };

    /// <summary>
    /// Terminal states that count toward Phase 9 advancement. A "rejected" or
    /// "withdrawn" deal is terminal but does NOT advance the company.
    /// </summary>
    public static readonly IReadOnlyList<string> RequiredTerminalStatesForCompletion = new[]
    {
        DealStatusSigned,
        DealStatusCompleted,
    };

    /// <summary>
    /// Minimum number of deals (in any state) the company must have before
    /// Phase 9 can advance. We additionally require ≥1 deal in a successful
    /// terminal state — see <see cref="RequiredTerminalStatesForCompletion"/>.
    /// </summary>
    public const int MinDealsForCompletion = 1;

    /// <summary>
    /// Outbound transitions per deal status. "rejected" and "withdrawn"
    /// are reachable from almost everywhere — those branches are encoded here
    /// rather than special-cased in code so the graph stays the single
    /// source of truth.
    /// </summary>
    public static readonly IReadOnlyDictionary<string, IReadOnlySet<string>> DealStatusTransitions =
        new Dictionary<string, IReadOnlySet<string>>(StringComparer.OrdinalIgnoreCase)
        {
            [DealStatusInitiated] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                DealStatusContacted, DealStatusWithdrawn,
            },
            [DealStatusContacted] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                DealStatusInterested, DealStatusRejected, DealStatusWithdrawn,
            },
            [DealStatusInterested] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                DealStatusMeetingScheduled, DealStatusDueDiligence, DealStatusRejected, DealStatusWithdrawn,
            },
            [DealStatusMeetingScheduled] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                DealStatusDueDiligence, DealStatusNegotiating, DealStatusRejected, DealStatusWithdrawn,
            },
            [DealStatusDueDiligence] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                DealStatusNegotiating, DealStatusRejected, DealStatusWithdrawn,
            },
            [DealStatusNegotiating] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                DealStatusTermSheet, DealStatusRejected, DealStatusWithdrawn,
            },
            [DealStatusTermSheet] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                DealStatusAgreementSent, DealStatusNegotiating, DealStatusRejected, DealStatusWithdrawn,
            },
            [DealStatusAgreementSent] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                DealStatusSigned, DealStatusRejected, DealStatusWithdrawn,
            },
            [DealStatusSigned] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                DealStatusCompleted,
            },
            // Terminal states — no outbound transitions.
            [DealStatusCompleted] = new HashSet<string>(StringComparer.OrdinalIgnoreCase),
            [DealStatusRejected] = new HashSet<string>(StringComparer.OrdinalIgnoreCase),
            [DealStatusWithdrawn] = new HashSet<string>(StringComparer.OrdinalIgnoreCase),
        };

    // ----- Term sheet axis ----------------------------------------------

    public const string TermSheetStatusDraft = "draft";
    public const string TermSheetStatusProposed = "proposed";
    public const string TermSheetStatusNegotiating = "negotiating";
    public const string TermSheetStatusAgreed = "agreed";
    public const string TermSheetStatusSigned = "signed";
    public const string TermSheetStatusRejected = "rejected";

    public static readonly IReadOnlyList<string> TermSheetStatusWhitelist = new[]
    {
        TermSheetStatusDraft,
        TermSheetStatusProposed,
        TermSheetStatusNegotiating,
        TermSheetStatusAgreed,
        TermSheetStatusSigned,
        TermSheetStatusRejected,
    };

    public static readonly IReadOnlyDictionary<string, IReadOnlySet<string>> TermSheetStatusTransitions =
        new Dictionary<string, IReadOnlySet<string>>(StringComparer.OrdinalIgnoreCase)
        {
            [TermSheetStatusDraft] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                TermSheetStatusProposed, TermSheetStatusRejected,
            },
            [TermSheetStatusProposed] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                TermSheetStatusNegotiating, TermSheetStatusAgreed, TermSheetStatusRejected,
            },
            [TermSheetStatusNegotiating] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                TermSheetStatusAgreed, TermSheetStatusRejected,
            },
            [TermSheetStatusAgreed] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                TermSheetStatusSigned, TermSheetStatusRejected,
            },
            [TermSheetStatusSigned] = new HashSet<string>(StringComparer.OrdinalIgnoreCase),
            [TermSheetStatusRejected] = new HashSet<string>(StringComparer.OrdinalIgnoreCase),
        };

    // ----- Participant axis ---------------------------------------------

    public const string ParticipantStatusInterested = "interested";
    public const string ParticipantStatusNegotiating = "negotiating";
    public const string ParticipantStatusCommitted = "committed";
    public const string ParticipantStatusFunded = "funded";
    public const string ParticipantStatusWithdrawn = "withdrawn";

    public static readonly IReadOnlyList<string> ParticipantStatusWhitelist = new[]
    {
        ParticipantStatusInterested,
        ParticipantStatusNegotiating,
        ParticipantStatusCommitted,
        ParticipantStatusFunded,
        ParticipantStatusWithdrawn,
    };

    public static readonly IReadOnlyDictionary<string, IReadOnlySet<string>> ParticipantStatusTransitions =
        new Dictionary<string, IReadOnlySet<string>>(StringComparer.OrdinalIgnoreCase)
        {
            [ParticipantStatusInterested] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                ParticipantStatusNegotiating, ParticipantStatusWithdrawn,
            },
            [ParticipantStatusNegotiating] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                ParticipantStatusCommitted, ParticipantStatusWithdrawn,
            },
            [ParticipantStatusCommitted] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                ParticipantStatusFunded, ParticipantStatusWithdrawn,
            },
            [ParticipantStatusFunded] = new HashSet<string>(StringComparer.OrdinalIgnoreCase),
            [ParticipantStatusWithdrawn] = new HashSet<string>(StringComparer.OrdinalIgnoreCase),
        };

    // ----- Due-diligence axis -------------------------------------------

    public const string DueDiligenceStatusPending = "pending";
    public const string DueDiligenceStatusInProgress = "in_progress";
    public const string DueDiligenceStatusCompleted = "completed";
    public const string DueDiligenceStatusFlagged = "flagged";

    public static readonly IReadOnlyList<string> DueDiligenceStatusWhitelist = new[]
    {
        DueDiligenceStatusPending,
        DueDiligenceStatusInProgress,
        DueDiligenceStatusCompleted,
        DueDiligenceStatusFlagged,
    };

    public static readonly IReadOnlyList<string> DueDiligenceCategoryWhitelist = new[]
    {
        "legal", "financial", "technical", "business",
    };

    // ----- Document kinds ------------------------------------------------

    public static readonly IReadOnlyList<string> DealDocumentKindWhitelist = new[]
    {
        "term_sheet", "signed_agreement", "due_diligence", "other",
    };

    public const long MaxDealDocumentSizeBytes = 50L * 1024L * 1024L; // 50 MB

    // ----- Activity log event types -------------------------------------

    public const string ActivityDealCreated = "deal_created";
    public const string ActivityDealStatusChanged = "deal_status_changed";
    public const string ActivityTermSheetUpdated = "term_sheet_updated";
    public const string ActivityTermSheetSigned = "term_sheet_signed";
    public const string ActivityDueDiligenceUpdated = "due_diligence_updated";
    public const string ActivityChecklistUpdated = "checklist_updated";
    public const string ActivityDocumentUploaded = "deal_document_uploaded";
    public const string ActivityDealClosed = "deal_closed";

    public static readonly IReadOnlyList<string> ActivityEventTypeWhitelist = new[]
    {
        ActivityDealCreated,
        ActivityDealStatusChanged,
        ActivityTermSheetUpdated,
        ActivityTermSheetSigned,
        ActivityDueDiligenceUpdated,
        ActivityChecklistUpdated,
        ActivityDocumentUploaded,
        ActivityDealClosed,
    };

    // ----- Helpers ------------------------------------------------------

    public static bool IsValidDealStatus(string s)
        => !string.IsNullOrWhiteSpace(s)
            && DealStatusWhitelist.Any(x => string.Equals(x, s, StringComparison.OrdinalIgnoreCase));

    public static bool IsValidTermSheetStatus(string s)
        => !string.IsNullOrWhiteSpace(s)
            && TermSheetStatusWhitelist.Any(x => string.Equals(x, s, StringComparison.OrdinalIgnoreCase));

    public static bool IsValidParticipantStatus(string s)
        => !string.IsNullOrWhiteSpace(s)
            && ParticipantStatusWhitelist.Any(x => string.Equals(x, s, StringComparison.OrdinalIgnoreCase));

    public static bool IsValidDueDiligenceStatus(string s)
        => !string.IsNullOrWhiteSpace(s)
            && DueDiligenceStatusWhitelist.Any(x => string.Equals(x, s, StringComparison.OrdinalIgnoreCase));

    public static bool IsValidDueDiligenceCategory(string s)
        => !string.IsNullOrWhiteSpace(s)
            && DueDiligenceCategoryWhitelist.Any(x => string.Equals(x, s, StringComparison.OrdinalIgnoreCase));

    public static bool IsValidDealDocumentKind(string s)
        => !string.IsNullOrWhiteSpace(s)
            && DealDocumentKindWhitelist.Any(x => string.Equals(x, s, StringComparison.OrdinalIgnoreCase));

    public static bool IsValidActivityEventType(string s)
        => !string.IsNullOrWhiteSpace(s)
            && ActivityEventTypeWhitelist.Any(x => string.Equals(x, s, StringComparison.OrdinalIgnoreCase));

    public static bool IsTerminalDealStatus(string s)
        => !string.IsNullOrWhiteSpace(s)
            && DealTerminalStates.Any(x => string.Equals(x, s, StringComparison.OrdinalIgnoreCase));

    public static bool IsValidDealTransition(string from, string to)
        => IsValidDealStatus(from) && IsValidDealStatus(to) &&
            DealStatusTransitions.TryGetValue(from, out var allowed) &&
            allowed.Contains(to);

    public static bool IsValidTermSheetTransition(string from, string to)
        => IsValidTermSheetStatus(from) && IsValidTermSheetStatus(to) &&
            TermSheetStatusTransitions.TryGetValue(from, out var allowed) &&
            allowed.Contains(to);

    public static bool IsValidParticipantTransition(string from, string to)
        => IsValidParticipantStatus(from) && IsValidParticipantStatus(to) &&
            ParticipantStatusTransitions.TryGetValue(from, out var allowed) &&
            allowed.Contains(to);
}
