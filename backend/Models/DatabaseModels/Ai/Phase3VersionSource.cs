namespace WebApp.Models.DatabaseModels.Ai
{
    /// <summary>
    /// The upstream input a Phase 3 output version was generated from. Recorded on every new
    /// version so the UI can tell when the current upstream has moved on (stale signal).
    /// </summary>
    public sealed record Phase3VersionSource(
        string? ClarifierSessionId,
        string? MarketStudySessionId = null,
        int? MarketStudyVersion = null);
}
