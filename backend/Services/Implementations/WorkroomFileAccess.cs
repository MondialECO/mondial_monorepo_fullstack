using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Implementations;

/// <summary>The outcome of a workroom file download authorization check.</summary>
public enum WorkroomFileAccessResult
{
    /// <summary>Caller may read the bytes.</summary>
    Allowed,

    /// <summary>
    /// Caller is not entitled to know this file exists — not a participant of its
    /// engagement, or a client asking for a provider-private file. Must surface as 404,
    /// never 403, so the response cannot be used to probe for file ids.
    /// </summary>
    Denied,

    /// <summary>
    /// Caller is entitled to the file but it is not servable yet — still scanning, or
    /// quarantined by the scanner. Distinct from Denied because telling a legitimate
    /// participant "not ready" leaks nothing they cannot already see in their file list.
    /// </summary>
    NotReady,
}

/// <summary>
/// The authorization rule for workroom file downloads, kept as a pure function so it can
/// be tested exhaustively without a Mongo instance or the twelve-dependency service.
/// Security-relevant logic living in one greppable place is the point; callers do the IO
/// and hand the results here.
/// </summary>
public static class WorkroomFileAccess
{
    /// <param name="file">The file record, or null when no such id exists.</param>
    /// <param name="engagement">
    /// The file's engagement, or null when the caller is not a participant of it (i.e.
    /// the participant-scoped lookup returned nothing).
    /// </param>
    /// <param name="actorId">The authenticated caller.</param>
    public static WorkroomFileAccessResult Evaluate(
        WorkroomFile? file,
        WorkroomEngagement? engagement,
        string actorId)
    {
        // No file, or the caller is not a participant of its engagement. Both collapse to
        // the same answer so the two cases are indistinguishable from outside.
        if (file is null || engagement is null) return WorkroomFileAccessResult.Denied;

        // Provider-private files are invisible to the client even though the client is a
        // participant of the engagement. This is the one rule the static-file serving it
        // replaces could never enforce.
        if (file.ProviderPrivate && actorId != engagement.ProviderId)
            return WorkroomFileAccessResult.Denied;

        // Mirrors isFileDownloadable() in src/lib/workroom-files.ts, enforced server-side
        // so bypassing the UI does not reach a Scanning, Failed or Restricted file.
        if (file.Status != WorkroomFileStatus.Ready) return WorkroomFileAccessResult.NotReady;

        // A record with no stored path never completed its upload.
        if (string.IsNullOrWhiteSpace(file.StoragePath)) return WorkroomFileAccessResult.NotReady;

        return WorkroomFileAccessResult.Allowed;
    }
}
