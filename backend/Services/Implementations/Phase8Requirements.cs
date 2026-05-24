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
    /// Threshold a match score must clear to be persisted as a match candidate
    /// (filter at the matcher write path) AND to count toward the validator's
    /// "at least one high-quality match" requirement.
    /// </summary>
    public const int MinScoreToCount = 40;

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
