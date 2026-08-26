using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using WebApp.Configuration.AiOptions;

namespace WebApp.Services.Ai.Providers
{
    /// <summary>
    /// Typed-HttpClient implementation of <see cref="IAiProvider"/> over the
    /// OpenRouter /chat/completions API. Auth/attribution headers and BaseAddress
    /// are configured on the typed client in AddAiServices.
    ///
    /// Resilience & Error Classification:
    /// - Transient provider failures (HTTP 429 burst rate limits, 500/502/503/504,
    ///   network timeouts, network errors, HTTP 200 with empty choices, and HTTP 200
    ///   with embedded errors) are retried with bounded exponential backoff + jitter
    ///   (up to MaxRetries retries; default 2 retries, 3 total attempts).
    /// - Permanent errors (HTTP 400 Bad Request, 401/403 Auth, 402 Payment Required,
    ///   404, 422, daily quota 429) fail fast on attempt 1 without retry.
    /// - User-facing error message after retry exhaustion: "AI provider temporarily unavailable. Please try again."
    /// - Detailed provider diagnostic logs are recorded safely without logging API keys or prompts.
    /// </summary>
    public sealed class OpenRouterClient : IAiProvider
    {
        private readonly HttpClient _http;
        private readonly OpenRouterSettings _settings;
        private readonly ILogger<OpenRouterClient> _logger;
        private readonly Func<int, TimeSpan, TimeSpan>? _backoffProvider;
        private readonly Func<TimeSpan, CancellationToken, Task>? _delayAsync;

        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        public const string ProviderUnavailableMessage = "AI provider temporarily unavailable. Please try again.";

        [ActivatorUtilitiesConstructor]
        public OpenRouterClient(
            HttpClient http,
            IOptions<OpenRouterSettings> settings,
            ILogger<OpenRouterClient> logger)
            : this(http, settings.Value, logger, null, null)
        {
        }

        public OpenRouterClient(
            HttpClient http,
            OpenRouterSettings settings,
            ILogger<OpenRouterClient> logger,
            Func<int, TimeSpan, TimeSpan>? backoffProvider = null,
            Func<TimeSpan, CancellationToken, Task>? delayAsync = null)
        {
            _http = http;
            _settings = settings ?? new OpenRouterSettings();
            _logger = logger;
            _backoffProvider = backoffProvider;
            _delayAsync = delayAsync;
        }

        public OpenRouterClient(HttpClient http, ILogger<OpenRouterClient> logger)
            : this(http, new OpenRouterSettings { MaxRetries = 2 }, logger, null, null)
        {
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
            client.DefaultRequestHeaders.Add("X-Title", settings.AppTitle);
        }

        public async Task<AiCompletion> CompleteAsync(AiCompletionRequest request, CancellationToken cancellationToken = default)
        {
            var maxRetries = Math.Max(0, _settings.MaxRetries);
            var maxAttempts = 1 + maxRetries; // e.g. 1 initial + 2 retries = 3 attempts

            var payload = new OpenRouterChatRequest
            {
                Model = request.Model,
                MaxTokens = request.MaxTokens,
                Temperature = request.Temperature,
                ResponseFormat = !string.IsNullOrWhiteSpace(request.ResponseFormat)
                    ? new OpenRouterResponseFormat { Type = request.ResponseFormat }
                    : null,
                Messages = request.Messages
                    .Select(m => new OpenRouterMessage { Role = m.Role, Content = m.Content })
                    .ToList(),
            };

            Exception? lastException = null;

            for (var attempt = 1; attempt <= maxAttempts; attempt++)
            {
                cancellationToken.ThrowIfCancellationRequested();

                HttpResponseMessage response;
                try
                {
                    response = await _http.PostAsJsonAsync("chat/completions", payload, JsonOptions, cancellationToken);
                }
                catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)
                {
                    lastException = new AiProviderException("OpenRouter request timed out.", inner: ex);
                    _logger.LogWarning("OpenRouter call timed out on attempt {Attempt}/{MaxAttempts}.", attempt, maxAttempts);

                    if (attempt < maxAttempts)
                    {
                        var delay = ComputeBackoff(attempt, null);
                        await SleepAsync(delay, cancellationToken);
                        continue;
                    }

                    throw new AiProviderException(ProviderUnavailableMessage, inner: lastException);
                }
                catch (HttpRequestException ex)
                {
                    lastException = new AiProviderException("OpenRouter network request failed.", inner: ex);
                    _logger.LogWarning(ex, "OpenRouter network error on attempt {Attempt}/{MaxAttempts}.", attempt, maxAttempts);

                    if (attempt < maxAttempts)
                    {
                        var delay = ComputeBackoff(attempt, null);
                        await SleepAsync(delay, cancellationToken);
                        continue;
                    }

                    throw new AiProviderException(ProviderUnavailableMessage, inner: lastException);
                }

                var statusCode = (int)response.StatusCode;

                // Permanent failures — do NOT retry (fail fast on attempt 1)
                if (response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden)
                {
                    var msg = await ReadErrorMessageAsync(response, cancellationToken);
                    _logger.LogError("OpenRouter authentication failed with status {Status}: {Message}", statusCode, msg);
                    throw new AiProviderException($"OpenRouter authentication failed ({statusCode}): {msg}", statusCode);
                }

                if (response.StatusCode == HttpStatusCode.PaymentRequired) // 402
                {
                    var msg = await ReadErrorMessageAsync(response, cancellationToken);
                    _logger.LogWarning("OpenRouter billing/credits error (402): {Message}", msg);
                    throw new InsufficientCreditsException($"OpenRouter error (402): {msg}", 402)
                    {
                        Source = CreditFailureSource.ProviderPaymentRequired
                    };
                }

                if (response.StatusCode == HttpStatusCode.BadRequest ||
                    response.StatusCode == HttpStatusCode.NotFound ||
                    response.StatusCode == HttpStatusCode.UnprocessableEntity)
                {
                    var msg = await ReadErrorMessageAsync(response, cancellationToken);
                    _logger.LogError("OpenRouter client error ({Status}): {Message}", statusCode, msg);
                    throw new AiProviderException($"OpenRouter client error ({statusCode}): {msg}", statusCode);
                }

                // Rate limit (429)
                if (response.StatusCode == HttpStatusCode.TooManyRequests)
                {
                    var retryAfter = ReadRetryAfter(response);
                    var msg = await ReadErrorMessageAsync(response, cancellationToken);

                    // If daily cap (Retry-After > 10m), fail immediately
                    if (retryAfter.HasValue && retryAfter.Value > TimeSpan.FromMinutes(10))
                    {
                        _logger.LogWarning("OpenRouter daily rate limit reached ({Status}, retry-after={RetryAfter}): {Message}", statusCode, retryAfter, msg);
                        throw new AiRateLimitException($"OpenRouter rate limit reached: {msg}", retryAfter, statusCode);
                    }

                    lastException = new AiRateLimitException($"OpenRouter rate limit ({statusCode}): {msg}", retryAfter, statusCode);
                    _logger.LogWarning("OpenRouter 429 rate limit on attempt {Attempt}/{MaxAttempts} (retry-after={RetryAfter}): {Message}",
                        attempt, maxAttempts, retryAfter?.TotalSeconds, msg);

                    if (attempt < maxAttempts)
                    {
                        var delay = ComputeBackoff(attempt, retryAfter);
                        await SleepAsync(delay, cancellationToken);
                        continue;
                    }

                    throw new AiRateLimitException(ProviderUnavailableMessage, retryAfter, 429, lastException);
                }

                // 5xx or other non-success HTTP status
                if (!response.IsSuccessStatusCode)
                {
                    var msg = await ReadErrorMessageAsync(response, cancellationToken);
                    lastException = new AiProviderException($"OpenRouter error ({statusCode}): {msg}", statusCode);
                    _logger.LogWarning("OpenRouter server error {Status} on attempt {Attempt}/{MaxAttempts}: {Message}",
                        statusCode, attempt, maxAttempts, msg);

                    if (attempt < maxAttempts)
                    {
                        var delay = ComputeBackoff(attempt, ReadRetryAfter(response));
                        await SleepAsync(delay, cancellationToken);
                        continue;
                    }

                    throw new AiProviderException(ProviderUnavailableMessage, statusCode, lastException);
                }

                // HTTP 200 OK — inspect response body
                string rawJson;
                OpenRouterChatResponse? body;
                try
                {
                    rawJson = await response.Content.ReadAsStringAsync(cancellationToken);
                    body = JsonSerializer.Deserialize<OpenRouterChatResponse>(rawJson, JsonOptions);
                }
                catch (JsonException ex)
                {
                    lastException = new AiProviderException("OpenRouter returned unparseable JSON.", statusCode, ex);
                    _logger.LogWarning("OpenRouter returned unparseable JSON on attempt {Attempt}/{MaxAttempts}.", attempt, maxAttempts);

                    if (attempt < maxAttempts)
                    {
                        var delay = ComputeBackoff(attempt, null);
                        await SleepAsync(delay, cancellationToken);
                        continue;
                    }

                    throw new AiProviderException(ProviderUnavailableMessage, statusCode, lastException);
                }

                // Check for embedded error inside 200 response
                if (body?.Error != null && !string.IsNullOrWhiteSpace(body.Error.Message))
                {
                    var errCode = body.Error.Code?.ToString() ?? "unknown";
                    lastException = new AiProviderException($"OpenRouter 200 with embedded error ({errCode}): {body.Error.Message}", statusCode);
                    _logger.LogWarning("OpenRouter returned 200 with embedded error on attempt {Attempt}/{MaxAttempts}: code={Code} type={Type} message={Message}",
                        attempt, maxAttempts, body.Error.Code, body.Error.Type, body.Error.Message);

                    if (attempt < maxAttempts)
                    {
                        var delay = ComputeBackoff(attempt, null);
                        await SleepAsync(delay, cancellationToken);
                        continue;
                    }

                    throw new AiProviderException(ProviderUnavailableMessage, statusCode, lastException);
                }

                // Check for empty or unusable choices
                if (body?.Choices is not { Count: > 0 })
                {
                    var snippet = SafeResponseSnippet(rawJson);
                    lastException = new AiProviderException($"OpenRouter response contained no choices (status 200, id={body?.Id}, model={body?.Model}).", statusCode);
                    _logger.LogWarning("OpenRouter returned 200 with no choices on attempt {Attempt}/{MaxAttempts}: id={Id} model={Model} snippet={Snippet}",
                        attempt, maxAttempts, body?.Id, body?.Model, snippet);

                    if (attempt < maxAttempts)
                    {
                        var delay = ComputeBackoff(attempt, null);
                        await SleepAsync(delay, cancellationToken);
                        continue;
                    }

                    throw new AiProviderException(ProviderUnavailableMessage, statusCode, lastException);
                }

                var choice = body.Choices[0];

                // Check if choice aborted with finish_reason=error and empty content
                if (string.IsNullOrWhiteSpace(choice.Message?.Content) &&
                    string.Equals(choice.FinishReason, "error", StringComparison.OrdinalIgnoreCase))
                {
                    lastException = new AiProviderException("OpenRouter choice finished with error and empty content.", statusCode);
                    _logger.LogWarning("OpenRouter choice finished with error on attempt {Attempt}/{MaxAttempts}.", attempt, maxAttempts);

                    if (attempt < maxAttempts)
                    {
                        var delay = ComputeBackoff(attempt, null);
                        await SleepAsync(delay, cancellationToken);
                        continue;
                    }

                    throw new AiProviderException(ProviderUnavailableMessage, statusCode, lastException);
                }

                // Valid completion!
                return new AiCompletion
                {
                    Text = choice.Message?.Content ?? string.Empty,
                    Model = body.Model ?? request.Model,
                    FinishReason = choice.FinishReason,
                    Usage = new AiTokenUsage(
                        body.Usage?.PromptTokens ?? 0,
                        body.Usage?.CompletionTokens ?? 0,
                        body.Usage?.TotalTokens ?? 0),
                    EstimatedCost = body.Usage?.Cost ?? 0m,
                };
            }

            throw new AiProviderException(ProviderUnavailableMessage, inner: lastException);
        }

        private TimeSpan ComputeBackoff(int attempt, TimeSpan? retryAfterHeader)
        {
            if (retryAfterHeader.HasValue && retryAfterHeader.Value > TimeSpan.Zero && retryAfterHeader.Value <= TimeSpan.FromSeconds(10))
            {
                return retryAfterHeader.Value;
            }

            var baseSeconds = Math.Pow(2, attempt - 1);
            var jitterMs = Random.Shared.Next(50, 250);
            var delay = TimeSpan.FromSeconds(baseSeconds) + TimeSpan.FromMilliseconds(jitterMs);

            if (_backoffProvider != null)
                return _backoffProvider(attempt, delay);

            return delay;
        }

        private async Task SleepAsync(TimeSpan delay, CancellationToken cancellationToken)
        {
            if (_delayAsync != null)
            {
                await _delayAsync(delay, cancellationToken);
                return;
            }

            await Task.Delay(delay, cancellationToken);
        }

        private static async Task<string?> ReadErrorMessageAsync(HttpResponseMessage response, CancellationToken cancellationToken)
        {
            try
            {
                var err = await response.Content.ReadFromJsonAsync<OpenRouterErrorResponse>(JsonOptions, cancellationToken);
                if (!string.IsNullOrWhiteSpace(err?.Error?.Message))
                    return err.Error.Message;
            }
            catch
            {
            }

            try
            {
                var text = await response.Content.ReadAsStringAsync(cancellationToken);
                if (!string.IsNullOrWhiteSpace(text))
                    return SafeResponseSnippet(text, 150);
            }
            catch
            {
            }

            return response.ReasonPhrase;
        }

        private static string SafeResponseSnippet(string? raw, int maxLen = 200)
        {
            if (string.IsNullOrWhiteSpace(raw)) return "(empty)";
            var clean = raw.Replace("\r", " ").Replace("\n", " ").Trim();
            return clean.Length <= maxLen ? clean : clean[..maxLen] + "...";
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
