namespace WebApp.Services.Implementations
{
    /// <summary>
    /// Whether a Phase 3 output was built from an upstream input that has since moved on.
    /// Display-only: nothing regenerates automatically.
    /// </summary>
    public static class Phase3UpstreamStaleness
    {
        /// <summary>
        /// Market Study / Business Plan: built from one C-2 session, current C-2 is another.
        /// Unknown current or built-from (legacy) → not stale.
        /// </summary>
        public static bool ClarifierStale(string? builtFromClarifierSessionId, string? currentClarifierSessionId) =>
            !string.IsNullOrWhiteSpace(builtFromClarifierSessionId)
            && !string.IsNullOrWhiteSpace(currentClarifierSessionId)
            && !string.Equals(builtFromClarifierSessionId, currentClarifierSessionId, StringComparison.Ordinal);

        /// <summary>
        /// Business Model: built from a market study (session + version); the current market study is a
        /// different session or a newer version. Versions that predate version tracking fall back to
        /// timestamps: the market study's current version is newer than the business model version.
        /// </summary>
        public static bool MarketStudyStale(
            string? builtFromStudyId, int? builtFromStudyVersion, DateTime builtAt,
            string? currentStudyId, int? currentStudyVersion, DateTime? currentStudyVersionCreatedAt)
        {
            if (string.IsNullOrWhiteSpace(currentStudyId) || string.IsNullOrWhiteSpace(builtFromStudyId))
                return false;
            if (!string.Equals(builtFromStudyId, currentStudyId, StringComparison.Ordinal))
                return true;
            if (builtFromStudyVersion.HasValue && currentStudyVersion.HasValue)
                return currentStudyVersion.Value > builtFromStudyVersion.Value;
            return currentStudyVersionCreatedAt.HasValue && currentStudyVersionCreatedAt.Value > builtAt;
        }
    }
}
