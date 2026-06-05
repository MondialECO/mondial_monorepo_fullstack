namespace WebApp.Services.Ai.Prompts
{
    /// <summary>
    /// In-code descriptor for a prompt template. Doubles as the carrier returned
    /// by <c>IPromptVersionStore.GetActiveAsync</c> (mapped from the active
    /// <c>PromptVersions</c> document) so the builder consumes one shape
    /// regardless of source. Module-specific templates (Clarifier / BusinessPlan
    /// / Forecast) are added by C-2/3/4; C-1 ships only the Probe template.
    /// </summary>
    public sealed class PromptTemplate
    {
        public required string Key { get; init; }
        public required int Version { get; init; }
        public required string SystemText { get; init; }
        public string? OutputContract { get; init; }

        /// <summary>
        /// The Probe template — the only task that executes end-to-end in C-1
        /// (health/self-test). Real module prompts arrive with their modules.
        /// </summary>
        public static readonly PromptTemplate Probe = new()
        {
            Key = "probe",
            Version = 1,
            SystemText =
                "You are Mondial's AI self-test probe. Confirm the AI pipeline is " +
                "working by responding succinctly and accurately to the user's task. " +
                "Do not fabricate data; if asked something you cannot verify, say so.",
            OutputContract =
                "Respond in plain text, at most two short sentences. No markdown, no preamble.",
        };

        /// <summary>All in-code templates seeded into <c>PromptVersions</c> on startup.</summary>
        public static readonly IReadOnlyList<PromptTemplate> All = new[] { Probe };
    }
}
