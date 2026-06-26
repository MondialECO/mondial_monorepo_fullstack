using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Implementations;

/// <summary>
/// Single backend definition of Phase 6 (Data Room) requirements.
///
/// Semantic model: Phase 6 = "data room submitted, awaiting compliance review".
/// NOT "live due diligence", NOT "actively engaged investors" — those are
/// downstream phases.
/// </summary>
public static class Phase6Requirements
{
    /// <summary>Categories that must each contain at least one document.</summary>
    public static readonly IReadOnlyList<string> RequiredCategories = new[]
    {
        "legal",
        "financial",
        "business",
    };

    /// <summary>All allowed category strings. Uploads outside this whitelist are rejected.</summary>
    public static readonly IReadOnlyList<string> AllowedCategories = new[]
    {
        "legal",
        "financial",
        "business",
        "ip",
        "team",
    };

    public const int MinDocumentCount = 3; // matches the three required categories
    public const long MaxFileSizeBytes = 50 * 1024 * 1024; // 50 MB
    public const int MaxTitleLength = 200;

    public const string EventTypeView = "view";
    public const string EventTypeDownload = "download";

    // Access-level whitelist: which grants permit a *download* (and the
    // download-equivalent track-download event). view_only and comment do NOT.
    public static readonly IReadOnlyList<string> DownloadPermittedAccessLevels = new[]
    {
        "download",
        "full_access",
    };

    public static bool AccessLevelPermitsDownload(string accessLevel)
        => !string.IsNullOrWhiteSpace(accessLevel)
            && DownloadPermittedAccessLevels.Any(x =>
                string.Equals(x, accessLevel, StringComparison.OrdinalIgnoreCase));

    public static bool IsAllowedCategory(string category)
        => !string.IsNullOrWhiteSpace(category)
            && AllowedCategories.Any(c => string.Equals(c, category, StringComparison.OrdinalIgnoreCase));

    public static bool MatchesCategory(string actual, string required)
        => !string.IsNullOrWhiteSpace(actual)
            && string.Equals(actual, required, StringComparison.OrdinalIgnoreCase);

    public static bool IsTrackableEventType(string eventType)
        => string.Equals(eventType, EventTypeView, StringComparison.OrdinalIgnoreCase)
            || string.Equals(eventType, EventTypeDownload, StringComparison.OrdinalIgnoreCase);
}
