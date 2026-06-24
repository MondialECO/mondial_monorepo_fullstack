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

public class AnthropicClientTests
{
    private const string SuccessBody = """
    {
      "id": "msg_1",
      "model": "claude-sonnet-4-6",
      "content": [{ "type": "text", "text": "Hello there" }],
      "stop_reason": "end_turn",
      "usage": { "input_tokens": 10, "output_tokens": 5 }
    }
    """;

    private static AiCompletionRequest SampleRequest() => new()
    {
        Model = "claude-sonnet-4-6",
        Messages = new[] { new AiMessage("system", "You are a probe."), new AiMessage("user", "ping") },
        MaxTokens = 64,
        Temperature = 0.2,
    };

    private static HttpResponseMessage Json(HttpStatusCode code, string body) =>
        new(code) { Content = new StringContent(body, Encoding.UTF8, "application/json") };

    private static AnthropicClient ClientWith(HttpMessageHandler handler, string baseUrl = "https://api.anthropic.com/")
    {
        var http = new HttpClient(handler) { BaseAddress = new Uri(baseUrl) };
        return new AnthropicClient(http, NullLogger<AnthropicClient>.Instance);
    }

    // ---- text / usage / cost extraction ----

    [Fact]
    public async Task Parses_text_usage_and_estimates_cost()
    {
        var client = ClientWith(new StubHandler((_, _) => Json(HttpStatusCode.OK, SuccessBody)));

        var result = await client.CompleteAsync(SampleRequest());

        result.Text.Should().Be("Hello there");
        result.Model.Should().Be("claude-sonnet-4-6");
        result.FinishReason.Should().Be("end_turn");
        result.Usage.PromptTokens.Should().Be(10);
        result.Usage.CompletionTokens.Should().Be(5);
        result.Usage.TotalTokens.Should().Be(15); // input + output
        // sonnet list price: 10/1M*$3 + 5/1M*$15 = 0.00003 + 0.000075
        result.EstimatedCost.Should().Be(0.000105m);
    }

    [Fact]
    public async Task Posts_model_max_tokens_system_field_and_user_message()
    {
        var handler = new StubHandler((_, _) => Json(HttpStatusCode.OK, SuccessBody));
        var client = ClientWith(handler);

        await client.CompleteAsync(SampleRequest());

        handler.LastRequest!.Method.Should().Be(HttpMethod.Post);
        handler.LastRequest!.RequestUri!.AbsoluteUri.Should().Be("https://api.anthropic.com/v1/messages");
        handler.LastBody.Should().Contain("\"model\":\"claude-sonnet-4-6\"");
        handler.LastBody.Should().Contain("\"max_tokens\":64");
        // system prompt is hoisted to the top-level "system" field, NOT a message
        handler.LastBody.Should().Contain("\"system\":\"You are a probe.\"");
        handler.LastBody.Should().Contain("\"role\":\"user\"");
        handler.LastBody.Should().NotContain("\"role\":\"system\"");
    }

    // ---- error mapping ----

    [Fact]
    public async Task Maps_401_to_InsufficientCredits_ProviderPaymentRequired()
    {
        var client = ClientWith(new StubHandler((_, _) =>
            Json(HttpStatusCode.Unauthorized, """{"type":"error","error":{"message":"invalid x-api-key"}}""")));

        var ex = (await ((Func<Task>)(() => client.CompleteAsync(SampleRequest())))
            .Should().ThrowAsync<InsufficientCreditsException>()).Which;

        ex.StatusCode.Should().Be(401);
        ex.Source.Should().Be(CreditFailureSource.ProviderPaymentRequired);
    }

    [Fact]
    public async Task Maps_429_to_RateLimit_with_retry_after()
    {
        var client = ClientWith(new StubHandler((_, _) =>
        {
            var resp = Json((HttpStatusCode)429, """{"type":"error","error":{"message":"slow down"}}""");
            resp.Headers.Add("Retry-After", "7");
            return resp;
        }));

        var ex = (await ((Func<Task>)(() => client.CompleteAsync(SampleRequest())))
            .Should().ThrowAsync<AiRateLimitException>()).Which;
        ex.StatusCode.Should().Be(429);
        ex.RetryAfter.Should().Be(TimeSpan.FromSeconds(7));
    }

    [Fact]
    public async Task Maps_500_to_AiProviderException()
    {
        var client = ClientWith(new StubHandler((_, _) =>
            Json(HttpStatusCode.InternalServerError, """{"type":"error","error":{"message":"boom"}}""")));

        (await ((Func<Task>)(() => client.CompleteAsync(SampleRequest())))
            .Should().ThrowAsync<AiProviderException>())
            .Which.StatusCode.Should().Be(500);
    }

    // ---- header construction ----

    [Fact]
    public void ConfigureHttpClient_sets_apikey_and_version_headers()
    {
        var settings = new AnthropicSettings
        {
            ApiKey = "sk-ant-test",
            BaseUrl = "https://api.anthropic.com",
            ApiVersion = "2023-06-01",
            TimeoutSeconds = 42,
        };
        using var http = new HttpClient();

        AnthropicClient.ConfigureHttpClient(http, settings);

        http.BaseAddress.Should().Be(new Uri("https://api.anthropic.com/"));
        http.Timeout.Should().Be(TimeSpan.FromSeconds(42));
        http.DefaultRequestHeaders.GetValues("x-api-key").Should().ContainSingle().Which.Should().Be("sk-ant-test");
        http.DefaultRequestHeaders.GetValues("anthropic-version").Should().ContainSingle().Which.Should().Be("2023-06-01");
    }

    // ---- retry behavior (Polly policy) ----

    [Fact]
    public async Task Retries_transient_5xx_then_succeeds()
    {
        var counting = new StubHandler((_, attempt) =>
            attempt < 3 ? Json(HttpStatusCode.ServiceUnavailable, "{}") : Json(HttpStatusCode.OK, SuccessBody));

        var policy = AnthropicResiliencePolicies.Retry(maxRetries: 3, backoff: _ => TimeSpan.Zero);
        var policyHandler = new PolicyHttpMessageHandler(policy) { InnerHandler = counting };

        var client = ClientWith(policyHandler);

        var result = await client.CompleteAsync(SampleRequest());

        result.Text.Should().Be("Hello there");
        counting.Calls.Should().Be(3); // 2 retries + final success
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
