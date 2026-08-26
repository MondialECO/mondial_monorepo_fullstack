using System.Net;
using System.Text;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using WebApp.Configuration.AiOptions;
using WebApp.Services.Ai;
using WebApp.Services.Ai.Providers;
using Xunit;

namespace WebApp.Tests.Unit;

public class OpenRouterClientTests
{
    private const string SuccessBody = """
    {
      "id": "gen-1",
      "model": "openai/gpt-oss-20b:free",
      "choices": [
        { "index": 0, "message": { "role": "assistant", "content": "Hello there" }, "finish_reason": "stop" }
      ],
      "usage": { "prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15, "cost": 0.0012 }
    }
    """;

    private const string EmptyChoicesBody = """
    {
      "id": "gen-empty",
      "model": "minimax/minimax-m2.7:free",
      "choices": []
    }
    """;

    private const string EmbeddedErrorBody = """
    {
      "id": "gen-err",
      "model": "minimax/minimax-m2.7:free",
      "error": {
        "message": "Provider returned upstream error",
        "code": 502,
        "type": "provider_error"
      }
    }
    """;

    private static AiCompletionRequest SampleRequest() => new()
    {
        Model = "openai/gpt-oss-20b:free",
        Messages = new[] { new AiMessage("system", "You are a probe."), new AiMessage("user", "ping") },
        MaxTokens = 64,
        Temperature = 0.2,
    };

    private static HttpResponseMessage Json(HttpStatusCode code, string body) =>
        new(code) { Content = new StringContent(body, Encoding.UTF8, "application/json") };

    private static OpenRouterClient ClientWith(HttpMessageHandler handler, string baseUrl = "https://openrouter.ai/api/v1/")
    {
        var http = new HttpClient(handler) { BaseAddress = new Uri(baseUrl) };
        return new OpenRouterClient(
            http,
            new OpenRouterSettings { MaxRetries = 2 },
            NullLogger<OpenRouterClient>.Instance,
            backoffProvider: (_, _) => TimeSpan.Zero,
            delayAsync: (_, _) => Task.CompletedTask);
    }

    private static OpenRouterClient FastClientWith(HttpMessageHandler handler, int maxRetries = 2)
    {
        var http = new HttpClient(handler) { BaseAddress = new Uri("https://openrouter.ai/api/v1/") };
        return new OpenRouterClient(
            http,
            new OpenRouterSettings { MaxRetries = maxRetries },
            NullLogger<OpenRouterClient>.Instance,
            backoffProvider: (_, _) => TimeSpan.Zero,
            delayAsync: (_, _) => Task.CompletedTask);
    }

    // ---- usage / text / cost extraction ----

    [Fact]
    public async Task Parses_text_usage_cost_and_finish_reason()
    {
        var client = ClientWith(new StubHandler((_, _) => Json(HttpStatusCode.OK, SuccessBody)));

        var result = await client.CompleteAsync(SampleRequest());

        result.Text.Should().Be("Hello there");
        result.Model.Should().Be("openai/gpt-oss-20b:free");
        result.FinishReason.Should().Be("stop");
        result.Usage.PromptTokens.Should().Be(10);
        result.Usage.CompletionTokens.Should().Be(5);
        result.Usage.TotalTokens.Should().Be(15);
        result.EstimatedCost.Should().Be(0.0012m);
    }

    [Fact]
    public async Task Posts_model_messages_and_usage_block()
    {
        var handler = new StubHandler((_, _) => Json(HttpStatusCode.OK, SuccessBody));
        var client = ClientWith(handler);

        await client.CompleteAsync(SampleRequest());

        handler.LastRequest!.Method.Should().Be(HttpMethod.Post);
        handler.LastRequest!.RequestUri!.AbsoluteUri.Should().Be("https://openrouter.ai/api/v1/chat/completions");
        handler.LastBody.Should().Contain("\"model\":\"openai/gpt-oss-20b:free\"");
        handler.LastBody.Should().Contain("\"role\":\"system\"");
        handler.LastBody.Should().Contain("\"max_tokens\":64");
        handler.LastBody.Should().Contain("\"include\":true");
    }

    [Fact]
    public async Task Posts_response_format_when_requested()
    {
        var handler = new StubHandler((_, _) => Json(HttpStatusCode.OK, SuccessBody));
        var client = ClientWith(handler);

        await client.CompleteAsync(new AiCompletionRequest
        {
            Model = "minimax/minimax-m2.7:free",
            Messages = new[] { new AiMessage("user", "test") },
            ResponseFormat = "json_object",
        });

        handler.LastBody.Should().Contain("\"response_format\":{\"type\":\"json_object\"}");
    }

    // ---- permanent error mapping (no retry) ----

    [Fact]
    public async Task Maps_402_to_InsufficientCredits_without_retry()
    {
        var handler = new StubHandler((_, _) =>
            Json(HttpStatusCode.PaymentRequired, """{"error":{"message":"Insufficient credits"}}"""));
        var client = ClientWith(handler);

        var act = () => client.CompleteAsync(SampleRequest());

        (await act.Should().ThrowAsync<InsufficientCreditsException>())
            .Which.StatusCode.Should().Be(402);
        handler.Calls.Should().Be(1); // Permanent: no retry
    }

    [Fact]
    public async Task Maps_401_to_AiProviderException_without_retry()
    {
        var handler = new StubHandler((_, _) =>
            Json(HttpStatusCode.Unauthorized, """{"error":{"message":"Invalid API key"}}"""));
        var client = ClientWith(handler);

        var act = () => client.CompleteAsync(SampleRequest());

        (await act.Should().ThrowAsync<AiProviderException>())
            .Which.StatusCode.Should().Be(401);
        handler.Calls.Should().Be(1); // Permanent: no retry
    }

    [Fact]
    public async Task Maps_400_to_AiProviderException_without_retry()
    {
        var handler = new StubHandler((_, _) =>
            Json(HttpStatusCode.BadRequest, """{"error":{"message":"Invalid parameter model"}}"""));
        var client = ClientWith(handler);

        var act = () => client.CompleteAsync(SampleRequest());

        (await act.Should().ThrowAsync<AiProviderException>())
            .Which.StatusCode.Should().Be(400);
        handler.Calls.Should().Be(1); // Permanent: no retry
    }

    [Fact]
    public async Task RateLimit_with_daily_cap_fails_fast_without_retry()
    {
        var handler = new StubHandler((_, _) =>
        {
            var resp = Json((HttpStatusCode)429, """{"error":{"message":"daily quota exceeded"}}""");
            resp.Headers.Add("Retry-After", "3600"); // 1 hour
            return resp;
        });
        var client = ClientWith(handler);

        var act = () => client.CompleteAsync(SampleRequest());

        var ex = (await act.Should().ThrowAsync<AiRateLimitException>()).Which;
        ex.StatusCode.Should().Be(429);
        ex.RetryAfter.Should().Be(TimeSpan.FromSeconds(3600));
        handler.Calls.Should().Be(1); // Daily cap: no retry
    }

    // ---- transient error retries (429, 200 empty choices, 502/503) ----

    [Fact]
    public async Task Retries_429_burst_rate_limit_then_succeeds()
    {
        // Attempt 1: 429, Attempt 2: 200 OK
        var handler = new StubHandler((_, attempt) =>
        {
            if (attempt == 1)
            {
                var resp = Json((HttpStatusCode)429, """{"error":{"message":"slow down"}}""");
                resp.Headers.Add("Retry-After", "1");
                return resp;
            }
            return Json(HttpStatusCode.OK, SuccessBody);
        });

        var client = FastClientWith(handler, maxRetries: 2);
        var result = await client.CompleteAsync(SampleRequest());

        result.Text.Should().Be("Hello there");
        handler.Calls.Should().Be(2);
    }

    [Fact]
    public async Task Retries_200_with_empty_choices_then_succeeds()
    {
        // Attempt 1: 200 with empty choices, Attempt 2: 200 with valid choices
        var handler = new StubHandler((_, attempt) =>
            attempt == 1 ? Json(HttpStatusCode.OK, EmptyChoicesBody) : Json(HttpStatusCode.OK, SuccessBody));

        var client = FastClientWith(handler, maxRetries: 2);
        var result = await client.CompleteAsync(SampleRequest());

        result.Text.Should().Be("Hello there");
        handler.Calls.Should().Be(2);
    }

    [Fact]
    public async Task Retries_200_with_embedded_error_then_succeeds()
    {
        // Attempt 1: 200 with embedded error, Attempt 2: 200 with valid choices
        var handler = new StubHandler((_, attempt) =>
            attempt == 1 ? Json(HttpStatusCode.OK, EmbeddedErrorBody) : Json(HttpStatusCode.OK, SuccessBody));

        var client = FastClientWith(handler, maxRetries: 2);
        var result = await client.CompleteAsync(SampleRequest());

        result.Text.Should().Be("Hello there");
        handler.Calls.Should().Be(2);
    }

    [Fact]
    public async Task Retries_502_then_503_then_succeeds_within_bound()
    {
        // Attempt 1: 502, Attempt 2: 503, Attempt 3: 200
        var handler = new StubHandler((_, attempt) => attempt switch
        {
            1 => Json(HttpStatusCode.BadGateway, "{}"),
            2 => Json(HttpStatusCode.ServiceUnavailable, "{}"),
            _ => Json(HttpStatusCode.OK, SuccessBody),
        });

        var client = FastClientWith(handler, maxRetries: 2);
        var result = await client.CompleteAsync(SampleRequest());

        result.Text.Should().Be("Hello there");
        handler.Calls.Should().Be(3);
    }

    [Fact]
    public async Task Exhausted_transient_retries_throws_user_friendly_provider_unavailable_message()
    {
        // All attempts return 503
        var handler = new StubHandler((_, _) => Json(HttpStatusCode.ServiceUnavailable, """{"error":{"message":"down"}}"""));
        var client = FastClientWith(handler, maxRetries: 2);

        var act = () => client.CompleteAsync(SampleRequest());

        var ex = (await act.Should().ThrowAsync<AiProviderException>()).Which;
        ex.Message.Should().Be(OpenRouterClient.ProviderUnavailableMessage);
        handler.Calls.Should().Be(3); // 1 initial + 2 retries = 3 total attempts
    }

    [Fact]
    public async Task Malformed_json_in_valid_choice_does_NOT_retry_transport()
    {
        // When the model returns a valid completion choice whose text is malformed JSON,
        // OpenRouterClient must return it on attempt 1 so task parser handles NeedsReview.
        const string MalformedChoiceBody = """
        {
          "id": "gen-malformed",
          "model": "minimax/minimax-m2.7:free",
          "choices": [
            { "index": 0, "message": { "role": "assistant", "content": "not valid json { xyz" }, "finish_reason": "stop" }
          ],
          "usage": { "prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15 }
        }
        """;

        var handler = new StubHandler((_, _) => Json(HttpStatusCode.OK, MalformedChoiceBody));
        var client = FastClientWith(handler, maxRetries: 2);

        var result = await client.CompleteAsync(SampleRequest());

        result.Text.Should().Be("not valid json { xyz");
        handler.Calls.Should().Be(1); // NO transport retry
    }

    [Fact]
    public async Task Exactly_bounded_number_of_provider_calls()
    {
        var handler = new StubHandler((_, _) => Json(HttpStatusCode.InternalServerError, "{}"));
        var client = FastClientWith(handler, maxRetries: 2);

        var act = () => client.CompleteAsync(SampleRequest());

        await act.Should().ThrowAsync<AiProviderException>();
        handler.Calls.Should().Be(3); // Exactly initial + 2 retries
    }

    // ---- header construction ----

    [Fact]
    public void ConfigureHttpClient_sets_auth_and_attribution_headers()
    {
        var settings = new OpenRouterSettings
        {
            ApiKey = "sk-or-test",
            BaseUrl = "https://openrouter.ai/api/v1",
            HttpReferer = "https://mondialbusiness.eu",
            AppTitle = "Mondial",
            TimeoutSeconds = 42,
        };
        using var http = new HttpClient();

        OpenRouterClient.ConfigureHttpClient(http, settings);

        http.BaseAddress.Should().Be(new Uri("https://openrouter.ai/api/v1/"));
        http.Timeout.Should().Be(TimeSpan.FromSeconds(42));
        http.DefaultRequestHeaders.Authorization!.Scheme.Should().Be("Bearer");
        http.DefaultRequestHeaders.Authorization!.Parameter.Should().Be("sk-or-test");
        http.DefaultRequestHeaders.GetValues("HTTP-Referer").Should().ContainSingle().Which.Should().Be("https://mondialbusiness.eu");
        http.DefaultRequestHeaders.GetValues("X-Title").Should().ContainSingle().Which.Should().Be("Mondial");
    }

    private sealed class StubHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, int, HttpResponseMessage> _responder;
        public int Calls { get; private set; }
        public HttpRequestMessage? LastRequest { get; private set; }
        public string? LastBody { get; private set; }

        public StubHandler(Func<HttpRequestMessage, int, HttpResponseMessage> responder) => _responder = responder;

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Calls++;
            LastRequest = request;
            if (request.Content is not null)
                LastBody = await request.Content.ReadAsStringAsync(cancellationToken);
            return _responder(request, Calls);
        }
    }
}
