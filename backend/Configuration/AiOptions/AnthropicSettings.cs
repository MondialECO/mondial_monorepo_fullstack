namespace WebApp.Configuration.AiOptions
{
    /// <summary>
    /// Anthropic (Claude) provider configuration. The <see cref="ApiKey"/> is a
    /// secret (supplied via env var <c>Anthropic__ApiKey</c> or user-secrets) and
    /// is validated fail-fast at startup by <c>StartupConfigValidation</c>. The
    /// remaining values are non-secret and may live in appsettings.json.
    ///
    /// Bound from the "Anthropic" configuration section in AddAiServices.
    /// </summary>
    public class AnthropicSettings
    {
        public const string SectionName = "Anthropic";

        /// <summary>Secret API key (sk-ant-...). Required — app refuses to boot without it.</summary>
        public string ApiKey { get; set; } = string.Empty;

        /// <summary>Anthropic API base URL (the Messages endpoint lives at /v1/messages).</summary>
        public string BaseUrl { get; set; } = "https://api.anthropic.com";

        /// <summary>Sent as the required <c>anthropic-version</c> header.</summary>
        public string ApiVersion { get; set; } = "2023-06-01";

        /// <summary>Per-request HTTP timeout in seconds.</summary>
        public int TimeoutSeconds { get; set; } = 60;

        /// <summary>Max transient-retry attempts at the HTTP layer (Polly).</summary>
        public int MaxRetries { get; set; } = 3;

        /// <summary>
        /// When true, the readiness health check performs a live auth ping
        /// (GET /v1/models). Off by default so /health/ready does not depend on
        /// outbound network reachability or spend a request.
        /// </summary>
        public bool EnableHealthCheckPing { get; set; } = false;
    }
}
