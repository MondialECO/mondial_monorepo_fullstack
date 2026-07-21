namespace WebApp.Configuration.AiOptions
{
    /// <summary>
    /// Maps an AI task type (e.g. "IdeaClarifier", "BusinessPlan", "Forecast",
    /// "Probe", "IdeaGenerator") to an OpenRouter model id (single-provider
    /// architecture: all AI routes through <c>OpenRouterClient</c> to meta-llama
    /// models). Populated from the "Ai:ModelRouting" configuration section and
    /// resolved by <c>ModelRouter</c>.
    /// </summary>
    public class ModelRoutingSettings
    {
        /// <summary>task-type → OpenRouter model id.</summary>
        public Dictionary<string, string> Models { get; set; } = new();

        /// <summary>
        /// Fallback model id when no task-specific route exists. Must be a real
        /// OpenRouter model so a config-binding failure degrades to a working
        /// model, not a non-existent one. Mirrors the "Ai:ModelRouting:DefaultModel"
        /// value in appsettings.
        /// </summary>
        public string DefaultModel { get; set; } = "meta-llama/llama-3.1-8b-instruct";
    }
}
