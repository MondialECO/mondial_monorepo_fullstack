namespace WebApp.Services.Implementations;

/// <summary>
/// Single backend definition of the required Phase 2 document set.
/// Frontend uploads use these exact <c>documentType</c> IDs (case-insensitive match).
///
/// Semantic model: Phase 2 completion means "all required documents submitted".
/// A document is considered submitted if it exists in <c>company.DocumentStatuses</c>
/// with a status other than <see cref="DocumentStatusRejected"/>.
/// Human/automated review of the document is a separate concern tracked by status
/// transitions; it does NOT gate Phase 2 completion.
/// </summary>
public static class Phase2Requirements
{
    public const string DocumentStatusPending = "pending";
    public const string DocumentStatusApproved = "approved";
    public const string DocumentStatusRejected = "rejected";

    public static readonly IReadOnlyList<string> RequiredDocumentTypes = new[]
    {
        "kbis",
        "articles",
        "license",
        "tax",
    };

    /// <summary>
    /// A status is acceptable for Phase 2 submission completion when it is set and
    /// is not <see cref="DocumentStatusRejected"/>. Pending and approved both count.
    /// </summary>
    public static bool IsAcceptableStatus(string status)
    {
        if (string.IsNullOrWhiteSpace(status)) return false;
        return !string.Equals(status, DocumentStatusRejected, StringComparison.OrdinalIgnoreCase);
    }

    public static bool MatchesType(string documentType, string required)
    {
        if (string.IsNullOrWhiteSpace(documentType)) return false;
        return string.Equals(documentType, required, StringComparison.OrdinalIgnoreCase);
    }
}
