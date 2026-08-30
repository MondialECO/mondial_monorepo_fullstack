using WebApp.Models.DatabaseModels;

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

    public static DateTime? GetReadinessInputsLastMaterialChangeAt(Companies? company)
    {
        if (company == null) return null;
        var dates = new List<DateTime>();
        if (company.InvestorReadinessInputsLastMaterialChangeAt.HasValue)
            dates.Add(company.InvestorReadinessInputsLastMaterialChangeAt.Value);
        if (company.DataRoomLastMaterialChangeAt.HasValue)
            dates.Add(company.DataRoomLastMaterialChangeAt.Value);
        return dates.Count > 0 ? dates.Max() : null;
    }

    public static bool IsFreshEnough(DateTime reviewedAt, DateTime? now = null)
    {
        var ts = (now ?? DateTime.UtcNow) - reviewedAt;
        return ts <= MaxReviewAgeForAdvance;
    }

    public static bool IsFreshEnough(DateTime reviewedAt, DateTime? lastMaterialChangeAt, DateTime? now)
    {
        var ts = (now ?? DateTime.UtcNow) - reviewedAt;
        if (ts > MaxReviewAgeForAdvance) return false;
        if (lastMaterialChangeAt.HasValue && lastMaterialChangeAt.Value > reviewedAt) return false;
        return true;
    }

    public static bool IsFreshEnough(DateTime reviewedAt, DateTime? dataRoomLastMaterialChangeAt, DateTime? readinessInputsLastMaterialChangeAt, DateTime? now)
    {
        var ts = (now ?? DateTime.UtcNow) - reviewedAt;
        if (ts > MaxReviewAgeForAdvance) return false;
        if (dataRoomLastMaterialChangeAt.HasValue && dataRoomLastMaterialChangeAt.Value > reviewedAt) return false;
        if (readinessInputsLastMaterialChangeAt.HasValue && readinessInputsLastMaterialChangeAt.Value > reviewedAt) return false;
        return true;
    }

    public static bool IsCurrentlyInvestorReady(Companies? company, DateTime? now = null)
    {
        if (company == null) return false;
        if (company.AiReview == null) return false;
        if (!MeetsAdvanceThreshold(company.AiReview.OverallScore)) return false;
        if (!company.AiReview.InvestorReadyBadge) return false;
        if (!company.IsInvestorReady) return false;

        var reviewedAt = company.LastAiReviewAt ?? company.AiReview.ReviewedAt;
        var lastChange = GetReadinessInputsLastMaterialChangeAt(company);
        if (!IsFreshEnough(reviewedAt, lastChange, now))
            return false;

        return true;
    }
}
