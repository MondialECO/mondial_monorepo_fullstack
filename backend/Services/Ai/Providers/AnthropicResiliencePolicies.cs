using Polly;
using Polly.Extensions.Http;

namespace WebApp.Services.Ai.Providers
{
    /// <summary>
    /// Polly retry policy for the typed Anthropic HttpClient. Retries transient
    /// HTTP failures (5xx, 408) and 429 rate-limits with caller-supplied backoff.
    /// Backoff is injected (not hard-coded) so unit tests can run with zero delay
    /// while production uses exponential backoff. Kept low — Hangfire adds its own
    /// retry layer, so compounding would multiply paid AI calls.
    /// </summary>
    public static class AnthropicResiliencePolicies
    {
        public static IAsyncPolicy<HttpResponseMessage> Retry(
            int maxRetries,
            Func<int, TimeSpan> backoff,
            Action<int>? onRetry = null)
        {
            return HttpPolicyExtensions
                .HandleTransientHttpError() // 5xx + 408
                .OrResult(r => (int)r.StatusCode == 429)
                .WaitAndRetryAsync(
                    Math.Max(0, maxRetries),
                    retryAttempt => backoff(retryAttempt),
                    onRetry: (_, _, attempt, _) => onRetry?.Invoke(attempt));
        }

        /// <summary>Exponential backoff: 1s, 2s, 4s, … capped at 30s.</summary>
        public static IAsyncPolicy<HttpResponseMessage> Default(int maxRetries, Action<int>? onRetry = null)
            => Retry(
                maxRetries,
                attempt => TimeSpan.FromSeconds(Math.Min(30, Math.Pow(2, attempt - 1))),
                onRetry);
    }
}
