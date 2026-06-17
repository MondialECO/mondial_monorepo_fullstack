using System.Net;
using System.Text;
using FluentAssertions;
using Microsoft.Extensions.Http;
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
      "model": "openai/gpt-4o-mini",
      "choices": [
        { "index": 0, "message": { "role": "assistant", "content": "Hello there" }, "finish_reason": "stop" }
      ],
      "usage": { "prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15, "cost": 0.0012 }
    }
    """;

    private static AiCompletionRequest SampleRequest() => new()
    {
        Model = "openai/gpt-4o-mini",
        Messages = new[] { new AiMessage("system", "You are a probe."), new AiMessage("user", "ping") },
        MaxTokens = 64,
        Temperature = 0.2,
    };

    private static HttpResponseMessage Json(HttpStatusCode code, string body) =>
        new(code) { Content = new StringContent(body, Encoding.UTF8, "application/json") };

    private static OpenRouterClient ClientWith(HttpMessageHandler handler, string baseUrl = "https://openrouter.ai/api/v1/")
    {
        var http = new HttpClient(handler) { BaseAddress = new Uri(baseUrl) };
        return new OpenRouterClient(http, NullLogger<OpenRouterClient>.Instance);
    }

    // ---- usage / text / cost extraction ----

    [Fact]
    public async Task Parses_text_usage_cost_and_finish_reason()
    {
        var client = ClientWith(new StubHandler((_, _) => Json(HttpStatusCode.OK, SuccessBody)));

        var result = await client.CompleteAsync(SampleRequest());

        result.Text.Should().Be("Hello there");
        result.Model.Should().Be("openai/gpt-4o-mini");
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
        handler.LastBody.Should().Contain("\"model\":\"openai/gpt-4o-mini\"");
        handler.LastBody.Should().Contain("\"role\":\"system\"");
        handler.LastBody.Should().Contain("\"role\":\"user\"");
        handler.LastBody.Should().Contain("\"max_tokens\":64");
        handler.LastBody.Should().Contain("\"include\":true");
    }

    // ---- error mapping ----

    [Fact]
    public async Task Maps_402_to_InsufficientCredits()
    {
        var client = ClientWith(new StubHandler((_, _) =>
            Json(HttpStatusCode.PaymentRequired, """{"error":{"message":"Insufficient credits"}}""")));

        var act = () => client.CompleteAsync(SampleRequest());

        (await act.Should().ThrowAsync<InsufficientCreditsException>())
            .Which.StatusCode.Should().Be(402);
    }

    [Fact]
    public async Task Maps_429_to_RateLimit_with_retry_after()
    {
        var client = ClientWith(new StubHandler((_, _) =>
        {
            var resp = Json((HttpStatusCode)429, """{"error":{"message":"slow down"}}""");
            resp.Headers.Add("Retry-After", "7");
            return resp;
        }));

        var act = () => client.CompleteAsync(SampleRequest());

        var ex = (await act.Should().ThrowAsync<AiRateLimitException>()).Which;
        ex.StatusCode.Should().Be(429);
        ex.RetryAfter.Should().Be(TimeSpan.FromSeconds(7));
    }

    [Fact]
    public async Task Maps_500_to_AiProviderException()
    {
        var client = ClientWith(new StubHandler((_, _) =>
            Json(HttpStatusCode.InternalServerError, """{"error":{"message":"boom"}}""")));

        var act = () => client.CompleteAsync(SampleRequest());

        (await act.Should().ThrowAsync<AiProviderException>())
            .Which.StatusCode.Should().Be(500);
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

    // ---- retry behavior (Polly policy) ----

    [Fact]
    public async Task Retries_transient_5xx_then_succeeds()
    {
        // 503, 503, then 200 — policy with zero backoff so the test is fast.
        var counting = new StubHandler((_, attempt) =>
            attempt < 3 ? Json(HttpStatusCode.ServiceUnavailable, "{}") : Json(HttpStatusCode.OK, SuccessBody));

        var policy = OpenRouterResiliencePolicies.Retry(maxRetries: 3, backoff: _ => TimeSpan.Zero);
        var policyHandler = new PolicyHttpMessageHandler(policy) { InnerHandler = counting };

        var client = ClientWith(policyHandler);

        var result = await client.CompleteAsync(SampleRequest());

        result.Text.Should().Be("Hello there");
        counting.Calls.Should().Be(3); // 2 retries + final success
    }

    [Fact]
    public async Task Gives_up_after_max_retries_and_maps_error()
    {
        var counting = new StubHandler((_, _) => Json(HttpStatusCode.ServiceUnavailable, """{"error":{"message":"down"}}"""));

        var policy = OpenRouterResiliencePolicies.Retry(maxRetries: 2, backoff: _ => TimeSpan.Zero);
        var policyHandler = new PolicyHttpMessageHandler(policy) { InnerHandler = counting };
        var client = ClientWith(policyHandler);

        var act = () => client.CompleteAsync(SampleRequest());

        (await act.Should().ThrowAsync<AiProviderException>())
            .Which.StatusCode.Should().Be(503);
        counting.Calls.Should().Be(3); // initial + 2 retries
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
