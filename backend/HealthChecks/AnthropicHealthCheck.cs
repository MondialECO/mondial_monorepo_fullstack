using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using WebApp.Configuration.AiOptions;

namespace WebApp.HealthChecks
{
    /// <summary>
    /// Readiness check for the Anthropic provider. By default this is a cheap
    /// config-presence check (API key + valid base URL) — no network call — so
    /// /health/ready stays fast and offline-safe. When
    /// <c>Anthropic:EnableHealthCheckPing</c> is true it additionally performs a
    /// lightweight authenticated GET /v1/models to confirm the credential works.
    /// </summary>
    public class AnthropicHealthCheck : IHealthCheck
    {
        private readonly AnthropicSettings _settings;
        private readonly IHttpClientFactory _httpClientFactory;

        public const string PingClientName = "anthropic-health";

        public AnthropicHealthCheck(IOptions<AnthropicSettings> settings, IHttpClientFactory httpClientFactory)
        {
            _settings = settings.Value;
            _httpClientFactory = httpClientFactory;
        }

        public async Task<HealthCheckResult> CheckHealthAsync(
            HealthCheckContext context,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(_settings.ApiKey))
                return HealthCheckResult.Unhealthy("Anthropic:ApiKey is not configured.");

            if (!Uri.TryCreate(_settings.BaseUrl, UriKind.Absolute, out var baseUri))
                return HealthCheckResult.Unhealthy($"Anthropic:BaseUrl is not a valid absolute URL ('{_settings.BaseUrl}').");

            if (!_settings.EnableHealthCheckPing)
                return HealthCheckResult.Healthy("Anthropic configured (config-only check).");

            try
            {
                var client = _httpClientFactory.CreateClient(PingClientName);
                client.Timeout = TimeSpan.FromSeconds(Math.Min(10, _settings.TimeoutSeconds));

                var url = baseUri.AbsoluteUri.TrimEnd('/') + "/v1/models";
                using var req = new HttpRequestMessage(HttpMethod.Get, url);
                req.Headers.Add("x-api-key", _settings.ApiKey);
                req.Headers.Add("anthropic-version", _settings.ApiVersion);

                using var resp = await client.SendAsync(req, cancellationToken);
                return resp.IsSuccessStatusCode
                    ? HealthCheckResult.Healthy("Anthropic reachable and credential valid.")
                    : HealthCheckResult.Unhealthy($"Anthropic ping failed: HTTP {(int)resp.StatusCode}.");
            }
            catch (Exception ex)
            {
                return HealthCheckResult.Unhealthy("Anthropic ping failed (network error).", ex);
            }
        }
    }
}
