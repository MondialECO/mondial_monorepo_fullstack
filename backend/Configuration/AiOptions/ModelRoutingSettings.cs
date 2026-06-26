namespace WebApp.Configuration.AiOptions
{
    /// <summary>
    /// Maps an AI task type (e.g. "IdeaClarifier", "BusinessPlan", "Forecast",
    /// "Probe") to an Anthropic (Claude) model id. Populated from the
    /// "Ai:ModelRouting" configuration section and resolved by <c>ModelRouter</c>.
    /// </summary>
    public class ModelRoutingSettings
    {
        /// <summary>task-type → Anthropic model id.</summary>
        public Dictionary<string, string> Models { get; set; } = new();

        /// <summary>Fallback model id when no task-specific route exists.</summary>
        public string DefaultModel { get; set; } = "claude-haiku-4-5";
    }
}
