namespace WebApp.Services.Ai
{
    /// <summary>
    /// THE success predicate for AI sessions (business plan / forecast): a session
    /// counts as a completed module only when the job genuinely succeeded — terminal
    /// <c>Completed</c> AND at least one generated version. Shared by the
    /// derived-status engine and the masterplan completion endpoint so the two can
    /// never drift (same approach as <c>CreatorLegalChecklist.MandatoryItemsDone</c>;
    /// they previously disagreed, letting a Failed plan produce a readiness score
    /// while the engine kept Phase 3 incomplete with no explanation).
    /// </summary>
    public static class AiSessionSuccess
    {
        public static bool IsComplete(string? status, int currentVersion) =>
            string.Equals(status, "Completed", System.StringComparison.Ordinal) && currentVersion > 0;
    }
}
