namespace WebApp.Configuration.AiOptions
{
    /// <summary>
    /// Maps an AI task type (e.g. "IdeaClarifier", "BusinessPlan", "Forecast",
    /// "Probe") to an OpenRouter model id. Populated from the "Ai:ModelRouting"
    /// configuration section. The resolving <c>ModelRouter</c> is implemented in
    /// Phase 1; this is the Phase 0 binding target.
    /// </summary>
    public class ModelRoutingSettings
    {
        /// <summary>task-type → OpenRouter model id.</summary>
        public Dictionary<string, string> Models { get; set; } = new();

        /// <summary>Fallback model id when no task-specific route exists.</summary>
        public string DefaultModel { get; set; } = "openai/gpt-4o-mini";
    }
}
