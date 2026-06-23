using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using WebApp.Configuration.AiOptions;

namespace WebApp.Services.Ai.Providers
{
    /// <summary>
    /// Typed-HttpClient implementation of <see cref="IAiProvider"/> over the
    /// OpenRouter /chat/completions API. Auth/attribution headers and BaseAddress
    /// are configured on the typed client in AddAiServices; Polly retry is layered
    /// there too. This class owns request shaping, usage extraction and error
    /// mapping to the <c>AiException</c> hierarchy.
    /// </summary>
    public sealed class OpenRouterClient : IAiProvider
    {
        private readonly HttpClient _http;
        private readonly ILogger<OpenRouterClient> _logger;

        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        public OpenRouterClient(HttpClient http, ILogger<OpenRouterClient> logger)
        {
            _http = http;
            _logger = logger;
        }

        /// <summary>
        /// Applies BaseAddress, timeout and the OpenRouter auth/attribution
        /// headers to a typed HttpClient. Shared by the DI registration and unit
        /// tests so header construction has a single, verifiable source.
        /// </summary>
        public static void ConfigureHttpClient(HttpClient client, OpenRouterSettings settings)
        {
            client.BaseAddress = new Uri(settings.BaseUrl.TrimEnd('/') + "/");
            client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", settings.ApiKey);
            client.DefaultRequestHeaders.Add("HTTP-Referer", settings.HttpReferer);
            client.DefaultRequestHeaders.Add("X-OpenRouter-Title", settings.AppTitle);
        }

        public async Task<AiCompletion> CompleteAsync(AiCompletionRequest request, CancellationToken cancellationToken = default)
        {
            var payload = new OpenRouterChatRequest
            {
                Model = request.Model,
                MaxTokens = request.MaxTokens,
                Temperature = request.Temperature,
                Messages = request.Messages
                    .Select(m => new OpenRouterMessage { Role = m.Role, Content = m.Content })
                    .ToList(),
            };

            HttpResponseMessage response;
            try
            {
                response = await _http.PostAsJsonAsync("chat/completions", payload, JsonOptions, cancellationToken);
            }
            catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)
            {
                // HttpClient.Timeout elapsed (not a caller cancellation).
                throw new AiProviderException("OpenRouter request timed out.", inner: ex);
            }
            catch (HttpRequestException ex)
            {
                throw new AiProviderException("OpenRouter request failed (network error).", inner: ex);
            }

            if (!response.IsSuccessStatusCode)
            {
                await ThrowMappedErrorAsync(response, cancellationToken);
            }

            OpenRouterChatResponse? body;
            try
            {
                body = await response.Content.ReadFromJsonAsync<OpenRouterChatResponse>(JsonOptions, cancellationToken);
            }
            catch (JsonException ex)
            {
                throw new AiProviderException("OpenRouter returned an unparseable response body.", (int)response.StatusCode, ex);
            }

            if (body?.Choices is not { Count: > 0 })
                throw new AiProviderException("OpenRouter response contained no choices.", (int)response.StatusCode);

            var choice = body.Choices[0];
            var usage = body.Usage;

            return new AiCompletion
            {
                Text = choice.Message?.Content ?? string.Empty,
                Model = body.Model ?? request.Model,
                FinishReason = choice.FinishReason,
                Usage = new AiTokenUsage(
                    usage?.PromptTokens ?? 0,
                    usage?.CompletionTokens ?? 0,
                    usage?.TotalTokens ?? 0),
                EstimatedCost = usage?.Cost ?? 0m,
            };
        }

        /// <summary>
        /// Maps an unsuccessful OpenRouter response to the AiException hierarchy.
        /// Always throws. Reads the body best-effort to surface the provider's
        /// error message.
        /// </summary>
        private async Task ThrowMappedErrorAsync(HttpResponseMessage response, CancellationToken cancellationToken)
        {
            var status = (int)response.StatusCode;
            string? providerMessage = null;
            try
            {
                var err = await response.Content.ReadFromJsonAsync<OpenRouterErrorResponse>(JsonOptions, cancellationToken);
                providerMessage = err?.Error?.Message;
            }
            catch
            {
                // Non-JSON error body — fall back to the status reason phrase.
            }

            var message = string.IsNullOrWhiteSpace(providerMessage)
                ? $"OpenRouter request failed with status {status} ({response.ReasonPhrase})."
                : $"OpenRouter error ({status}): {providerMessage}";

            _logger.LogWarning("OpenRouter call failed: status={Status} message={Message}", status, message);

            throw response.StatusCode switch
            {
                HttpStatusCode.PaymentRequired // 402 — upstream provider billing, NOT the user's balance
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
