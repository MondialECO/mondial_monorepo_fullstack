namespace WebApp.Services.Implementations;

/// <summary>
/// Single backend definition of Phase 8 (Automated Investor Matching)
/// requirements. Shared by the matcher, the validator, the interaction
/// recorder, and the status-update endpoint so they cannot drift.
///
/// Semantic model: Phase 8 = "automated investor matching, deterministic
/// rule-based engine, runs against real Investor profile fields". NOT
/// "AI matching", NOT LLM-driven — those are P1 swaps documented as
/// FUTURE-LLM TODO anchors in <c>InvestorMatcher.cs</c>.
/// </summary>
public static class Phase8Requirements
{
    /// <summary>Minimum number of persisted matches required to advance Phase 8.</summary>
    public const int MinPersistedMatches = 1;

    /// <summary>
    /// Advisory benchmark used only for reporting high-fit matches in analytics/insights.
    /// Does NOT gate match persistence, candidate availability, double opt-in, or phase progression.
    /// </summary>
    public const int AdvisoryHighFitThreshold = 70;

    public static readonly IReadOnlyList<string> AllowedInteractionTypes = new[]
    {
        "view",
        "message",
        "call",
        "proposal_sent",
        "term_sheet",
    };

    public static readonly IReadOnlyList<string> AllowedMatchStatuses = new[]
    {
        "new",
        "viewed",
        "saved",
        "interested",
        "reviewing",
        "matched",
        "accepted",
        "rejected",
        "passed",
    };

    public static bool IsValidInteractionType(string s)
        => !string.IsNullOrWhiteSpace(s)
            && AllowedInteractionTypes.Any(x => string.Equals(x, s, StringComparison.OrdinalIgnoreCase));

    public static bool IsValidMatchStatus(string s)
        => !string.IsNullOrWhiteSpace(s)
            && AllowedMatchStatuses.Any(x => string.Equals(x, s, StringComparison.OrdinalIgnoreCase));
}
