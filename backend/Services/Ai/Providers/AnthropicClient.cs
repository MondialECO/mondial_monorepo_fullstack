using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using WebApp.Configuration.AiOptions;

namespace WebApp.Services.Ai.Providers
{
    /// <summary>
    /// Typed-HttpClient implementation of <see cref="IAiProvider"/> over the
    /// Anthropic /v1/messages API. Auth (<c>x-api-key</c>) + <c>anthropic-version</c>
    /// headers and BaseAddress are configured on the typed client in AddAiServices;
    /// Polly retry is layered there too. This class owns request shaping (system vs
    /// messages split), usage extraction, cost estimation and error mapping to the
    /// <c>AiException</c> hierarchy. Swapping providers touches only this class —
    /// jobs/handlers depend on <see cref="IAiProvider"/>, never on Anthropic directly.
    /// </summary>
    public sealed class AnthropicClient : IAiProvider
    {
        private readonly HttpClient _http;
        private readonly ILogger<AnthropicClient> _logger;

        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        // Anthropic requires max_tokens on every request; fall back if a handler omits it.
        private const int DefaultMaxTokens = 4096;

        public AnthropicClient(HttpClient http, ILogger<AnthropicClient> logger)
        {
            _http = http;
            _logger = logger;
        }

        /// <summary>
        /// Applies BaseAddress, timeout and the Anthropic auth/version headers to a
        /// typed HttpClient. Shared by the DI registration and unit tests so header
        /// construction has a single, verifiable source.
        /// </summary>
        public static void ConfigureHttpClient(HttpClient client, AnthropicSettings settings)
        {
            client.BaseAddress = new Uri(settings.BaseUrl.TrimEnd('/') + "/");
            client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
            client.DefaultRequestHeaders.Add("x-api-key", settings.ApiKey);
            client.DefaultRequestHeaders.Add("anthropic-version", settings.ApiVersion);
        }

        public async Task<AiCompletion> CompleteAsync(AiCompletionRequest request, CancellationToken cancellationToken = default)
        {
            // Anthropic takes the system prompt as a TOP-LEVEL field, not a message.
            // PromptBuilder emits one "system" message + one "user" message; split them.
            var systemText = string.Join("\n\n", request.Messages
                .Where(m => string.Equals(m.Role, "system", StringComparison.OrdinalIgnoreCase))
                .Select(m => m.Content));

            var messages = request.Messages
                .Where(m => !string.Equals(m.Role, "system", StringComparison.OrdinalIgnoreCase))
                .Select(m => new AnthropicMessage { Role = m.Role, Content = m.Content })
                .ToList();

            var payload = new AnthropicMessagesRequest
            {
                Model = request.Model,
                MaxTokens = request.MaxTokens ?? DefaultMaxTokens,
                Temperature = request.Temperature,
                System = string.IsNullOrWhiteSpace(systemText) ? null : systemText,
                Messages = messages,
            };

            HttpResponseMessage response;
            try
            {
                response = await _http.PostAsJsonAsync("v1/messages", payload, JsonOptions, cancellationToken);
            }
            catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)
            {
                // HttpClient.Timeout elapsed (not a caller cancellation).
                throw new AiProviderException("Anthropic request timed out.", inner: ex);
            }
            catch (HttpRequestException ex)
            {
                throw new AiProviderException("Anthropic request failed (network error).", inner: ex);
            }

            if (!response.IsSuccessStatusCode)
            {
                await ThrowMappedErrorAsync(response, cancellationToken);
            }

            AnthropicMessagesResponse? body;
            try
            {
                body = await response.Content.ReadFromJsonAsync<AnthropicMessagesResponse>(JsonOptions, cancellationToken);
            }
            catch (JsonException ex)
            {
                throw new AiProviderException("Anthropic returned an unparseable response body.", (int)response.StatusCode, ex);
            }

            // Text comes from the first text content block.
            var text = body?.Content?.FirstOrDefault(b => string.Equals(b.Type, "text", StringComparison.OrdinalIgnoreCase))?.Text;
            if (text is null)
                throw new AiProviderException("Anthropic response contained no text content.", (int)response.StatusCode);

            var inputTokens = body!.Usage?.InputTokens ?? 0;
            var outputTokens = body.Usage?.OutputTokens ?? 0;

            return new AiCompletion
            {
                Text = text,
                Model = body.Model ?? request.Model,
                FinishReason = body.StopReason,
                // Anthropic reports input/output separately; total is their sum.
                Usage = new AiTokenUsage(inputTokens, outputTokens, inputTokens + outputTokens),
                // Anthropic does not return a cost; estimate from list prices (telemetry only).
                EstimatedCost = EstimateCostUsd(body.Model ?? request.Model, inputTokens, outputTokens),
            };
        }

        /// <summary>
        /// Estimates USD cost from token counts. Anthropic omits cost from the
        /// response, so we price it ourselves for <c>ModelUsage.EstimatedCost</c>
        /// (telemetry only — the credit ledger is unaffected). Rates are list prices
        /// per 1M tokens, input/output billed at different rates.
        /// </summary>
        private static decimal EstimateCostUsd(string model, int inputTokens, int outputTokens)
        {
            var (inPerMillion, outPerMillion) = model.Contains("haiku", StringComparison.OrdinalIgnoreCase)
                ? (1.00m, 5.00m)     // claude-haiku-4-5 (approx)
                : (3.00m, 15.00m);   // claude-sonnet-4-6
            return inputTokens / 1_000_000m * inPerMillion
                 + outputTokens / 1_000_000m * outPerMillion;
        }

        /// <summary>
        /// Maps an unsuccessful Anthropic response to the AiException hierarchy.
        /// Always throws. Reads the body best-effort to surface the provider's error.
        /// </summary>
        private async Task ThrowMappedErrorAsync(HttpResponseMessage response, CancellationToken cancellationToken)
        {
            var status = (int)response.StatusCode;
            string? providerMessage = null;
            try
            {
                var err = await response.Content.ReadFromJsonAsync<AnthropicErrorResponse>(JsonOptions, cancellationToken);
                providerMessage = err?.Error?.Message;
            }
            catch
            {
                // Non-JSON error body — fall back to the status reason phrase.
            }

            var message = string.IsNullOrWhiteSpace(providerMessage)
                ? $"Anthropic request failed with status {status} ({response.ReasonPhrase})."
                : $"Anthropic error ({status}): {providerMessage}";

            _logger.LogWarning("Anthropic call failed: status={Status} message={Message}", status, message);

            throw response.StatusCode switch
            {
                // 401 = invalid/unauthorized key or billing on OUR account — a provider-side
                // issue, surfaced to the user as 503 (not the creator's own balance).
                HttpStatusCode.Unauthorized
                    => new InsufficientCreditsException(message, status)
                        { Source = CreditFailureSource.ProviderPaymentRequired },
                HttpStatusCode.TooManyRequests // 429
                    => new AiRateLimitException(message, ReadRetryAfter(response), status),
                _ => new AiProviderException(message, status),
            };
        }

        private static TimeSpan? ReadRetryAfter(HttpResponseMessage response)
        {
            var ra = response.Headers.RetryAfter;
            if (ra is null) return null;
            if (ra.Delta is { } delta) return delta;
            if (ra.Date is { } date) return date - DateTimeOffset.UtcNow;
            return null;
        }
    }
}
