namespace WebApp.Services.Implementations;

/// <summary>
/// Single backend definition of Phase 7 (Automated Readiness Review)
/// thresholds and freshness windows. Shared by the engine, the validator,
/// and the badge-award gate so the rules cannot drift between them.
///
/// Semantic model: Phase 7 = "automated readiness review completed, score
/// at or above threshold". NOT "LLM expert review", NOT "human-reviewed",
/// NOT "verified investor-ready" — those are downstream P1 items.
/// </summary>
public static class Phase7Requirements
{
    public const int ScoreThresholdForBadge = 70;
    public const int ScoreThresholdForAdvance = 70;

    /// <summary>
    /// A review snapshot older than this is considered stale and cannot
    /// gate phase advancement. Forces re-running the engine after material
    /// Phase 2-6 changes (cap-table edits, doc uploads, etc).
    /// </summary>
    public static readonly TimeSpan MaxReviewAgeForAdvance = TimeSpan.FromDays(30);

    public static bool MeetsBadgeThreshold(int overallScore) => overallScore >= ScoreThresholdForBadge;
    public static bool MeetsAdvanceThreshold(int overallScore) => overallScore >= ScoreThresholdForAdvance;

    public static bool IsFreshEnough(DateTime reviewedAt, DateTime? now = null)
    {
        var ts = (now ?? DateTime.UtcNow) - reviewedAt;
        return ts <= MaxReviewAgeForAdvance;
    }
}
