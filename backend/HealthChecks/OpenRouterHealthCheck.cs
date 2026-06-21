using System.Net.Http.Headers;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using WebApp.Configuration.AiOptions;

namespace WebApp.HealthChecks
{
    /// <summary>
    /// Readiness check for the OpenRouter provider. By default this is a cheap
    /// config-presence check (API key + valid base URL) — no network call — so
    /// /health/ready stays fast and offline-safe. When
    /// <c>OpenRouter:EnableHealthCheckPing</c> is true it additionally performs
    /// a lightweight authenticated GET /key to confirm the credential works.
    /// </summary>
    public class OpenRouterHealthCheck : IHealthCheck
    {
        private readonly OpenRouterSettings _settings;
        private readonly IHttpClientFactory _httpClientFactory;

        public const string PingClientName = "openrouter-health";

        public OpenRouterHealthCheck(IOptions<OpenRouterSettings> settings, IHttpClientFactory httpClientFactory)
        {
            _settings = settings.Value;
            _httpClientFactory = httpClientFactory;
        }

        public async Task<HealthCheckResult> CheckHealthAsync(
            HealthCheckContext context,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(_settings.ApiKey))
                return HealthCheckResult.Unhealthy("OpenRouter:ApiKey is not configured.");

            if (!Uri.TryCreate(_settings.BaseUrl, UriKind.Absolute, out var baseUri))
                return HealthCheckResult.Unhealthy($"OpenRouter:BaseUrl is not a valid absolute URL ('{_settings.BaseUrl}').");

            if (!_settings.EnableHealthCheckPing)
                return HealthCheckResult.Healthy("OpenRouter configured (config-only check).");

            try
            {
                var client = _httpClientFactory.CreateClient(PingClientName);
                client.Timeout = TimeSpan.FromSeconds(Math.Min(10, _settings.TimeoutSeconds));

                var url = baseUri.AbsoluteUri.TrimEnd('/') + "/key";
                using var req = new HttpRequestMessage(HttpMethod.Get, url);
                req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.ApiKey);

                using var resp = await client.SendAsync(req, cancellationToken);
                return resp.IsSuccessStatusCode
                    ? HealthCheckResult.Healthy("OpenRouter reachable and credential valid.")
                    : HealthCheckResult.Unhealthy($"OpenRouter ping failed: HTTP {(int)resp.StatusCode}.");
            }
            catch (Exception ex)
            {
                return HealthCheckResult.Unhealthy("OpenRouter ping failed (network error).", ex);
            }
        }
    }
}
