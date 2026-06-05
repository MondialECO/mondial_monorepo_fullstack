namespace WebApp.Configuration.AiOptions
{
    /// <summary>
    /// Top-level AI feature configuration. Bound from the "Ai" section. Holds
    /// the model-routing map, default credit economics, regeneration limits,
    /// cache TTL, and per-module feature flags. Only configuration + binding is
    /// in Phase 0 scope; the services that consume these land in later phases.
    /// </summary>
    public class AiSettings
    {
        public const string SectionName = "Ai";

        /// <summary>Master kill-switch for AI enqueue (rollback without redeploy).</summary>
        public bool Enabled { get; set; } = true;

        /// <summary>task-type → model routing.</summary>
        public ModelRoutingSettings ModelRouting { get; set; } = new();

        /// <summary>Default credit cost charged per AI job, by task type.</summary>
        public Dictionary<string, int> CreditCosts { get; set; } = new();

        /// <summary>Max regenerations allowed per source request.</summary>
        public int RegenerationLimit { get; set; } = 3;

        /// <summary>Cache TTL (seconds) for cacheable AI responses.</summary>
        public int CacheTtlSeconds { get; set; } = 86400;

        /// <summary>Per-module feature flags (Clarifier / BusinessPlan / Forecast).</summary>
        public AiFeatureFlags Features { get; set; } = new();

        /// <summary>
        /// Starter AI credit balance granted to each existing user at startup
        /// when <see cref="GrantStarterCreditsToExisting"/> is on. 0 = no grant.
        /// </summary>
        public int StarterCredits { get; set; } = 0;

        /// <summary>
        /// Config gate for the one-time idempotent starter-credit backfill. Off
        /// by default — must be opted into per environment.
        /// </summary>
        public bool GrantStarterCreditsToExisting { get; set; } = false;
    }

    public class AiFeatureFlags
    {
        public bool Clarifier { get; set; } = true;
        public bool BusinessPlan { get; set; } = true;
        public bool Forecast { get; set; } = true;
    }
}
