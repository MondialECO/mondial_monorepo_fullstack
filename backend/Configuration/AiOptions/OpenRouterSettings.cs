namespace WebApp.Configuration.AiOptions
{
    /// <summary>
    /// OpenRouter provider configuration. The <see cref="ApiKey"/> is a secret
    /// (supplied via env var <c>OpenRouter__ApiKey</c> or user-secrets) and is
    /// validated fail-fast at startup by <c>StartupConfigValidation</c>. The
    /// remaining values are non-secret and may live in appsettings.json.
    ///
    /// Bound from the "OpenRouter" configuration section in AddAiServices.
    /// The typed HttpClient / provider implementation lands in Phase 1; this
    /// class is the Phase 0 scaffold so config + validation are wired now.
    /// </summary>
    public class OpenRouterSettings
    {
        public const string SectionName = "OpenRouter";

        /// <summary>Secret API key. Required — app refuses to boot without it.</summary>
        public string ApiKey { get; set; } = "";

        /// <summary>OpenRouter chat-completions base URL.</summary>
        public string BaseUrl { get; set; } = "https://openrouter.ai/api/v1";

        /// <summary>Sent as the <c>HTTP-Referer</c> header (OpenRouter attribution).</summary>
        public string HttpReferer { get; set; } = "https://mondialbusiness.eu";

        /// <summary>Sent as the <c>X-Title</c> header (OpenRouter attribution).</summary>
        public string AppTitle { get; set; } = "Mondial";

        /// <summary>Per-request HTTP timeout in seconds.</summary>
        public int TimeoutSeconds { get; set; } = 60;

        /// <summary>Max transient-retry attempts at the HTTP layer (Phase 1 / Polly).</summary>
        public int MaxRetries { get; set; } = 3;
    }
}
