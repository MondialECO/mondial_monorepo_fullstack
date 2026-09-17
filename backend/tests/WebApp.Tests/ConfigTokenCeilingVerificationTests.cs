using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.Configuration.AiOptions;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.Ai;
using WebApp.Services.Ai.Jobs;
using WebApp.Services.Ai.Prompts;
using WebApp.Services.Ai.Providers;
using WebApp.Services.Implementations;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;
using Xunit;
using Xunit.Abstractions;

namespace WebApp.Tests;

public class ConfigTokenCeilingVerificationTests
{
    private readonly ITestOutputHelper _output;
    private readonly IMongoDatabase _db;
    private readonly IConfiguration _config;
    private readonly OpenRouterClient _provider;

    public ConfigTokenCeilingVerificationTests(ITestOutputHelper output)
    {
        _output = output;
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir != null && !File.Exists(Path.Combine(dir.FullName, "backend", "appsettings.json")))
        {
            dir = dir.Parent;
        }
        var basePath = dir != null ? Path.Combine(dir.FullName, "backend") : Path.GetFullPath("../../../../../backend");
        _config = new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .Build();

        var connectionString = "mongodb+srv://mongoDB:hr11100010@cluster0.nsfffx4.mongodb.net/";
        var dbName = "MondialEcoDev";
        var client = new MongoClient(connectionString);
        _db = client.GetDatabase(dbName);

        var httpClient = new HttpClient();
        var openRouterSettings = new OpenRouterSettings
        {
            ApiKey = _config["OpenRouter:ApiKey"] ?? "",
            BaseUrl = _config["OpenRouter:BaseUrl"] ?? "https://openrouter.ai/api/v1/",
            HttpReferer = _config["OpenRouter:HttpReferer"] ?? "https://mondialbusiness.eu",
            AppTitle = _config["OpenRouter:AppTitle"] ?? "Mondial ECO Platform",
            TimeoutSeconds = 180,
            MaxRetries = 2
        };
        OpenRouterClient.ConfigureHttpClient(httpClient, openRouterSettings);
        _provider = new OpenRouterClient(httpClient, openRouterSettings, NullLogger<OpenRouterClient>.Instance);
    }

    [Fact]
    public async Task Config_Bound_Token_Limit_Overrides_Constant_And_Is_Used_In_Live_Request()
    {
        // 1. Simulate custom configuration override (e.g. MarketStudy = 6789)
        var customSettings = new AiSettings
        {
            OutputTokenLimits = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
            {
                ["MarketStudy"] = 6789
            }
        };
        var options = Options.Create(customSettings);

        var handler = new MarketStudyHandler(
            new MarketStudySessionRepository(_db),
            new ClarifierSessionRepository(_db),
            new CreatorIdeaRepository(_db),
            new BusinessIdeasRepository(_db),
            new MarketBenchmarkResolver(new MarketBenchmarkStore(_db)),
            new AiInsightWriter(new AiInsightRepository(_db)),
            NullLogger<MarketStudyHandler>.Instance,
            options);

        var request = new AiRequest
        {
            OwnerUserId = "b1e8c269-87e1-43eb-8f2e-25b28d6c6d0a",
            JobType = "MarketStudy",
            Status = "Processing",
            InputPayload = new BsonDocument
            {
                ["marketStudySessionId"] = "6aabb285140ccaba4306156d",
                ["clarifierSessionId"] = "6aaa755e5a4ed41c538e7187",
                ["businessIdeaId"] = "6aa70d62ed34eb53a2a9e814"
            }
        };

        var prep = await handler.PrepareAsync(request);
        _output.WriteLine($"[Config Override Test] Configured: 6789 -> PrepareAsync resolved MaxTokens: {prep.MaxTokens}");
        prep.MaxTokens.Should().Be(6789, "Handler must honor the dynamic configuration value from OutputTokenLimits");

        // Execute live with this custom limit to verify OpenRouter accepts and respects it
        var promptStore = new PromptVersionStore(new PromptVersionRepository(_db), NullLogger<PromptVersionStore>.Instance);
        var promptBuilder = new PromptBuilder();
        var template = await promptStore.GetActiveAsync(prep.PromptKey);
        var composition = promptBuilder.Build(template!, prep.UserContext, prep.Task);

        var completion = await _provider.CompleteAsync(new AiCompletionRequest
        {
            Model = "google/gemini-3.8-flash",
            Messages = composition.Messages,
            MaxTokens = prep.MaxTokens,
            Temperature = prep.Temperature,
            ResponseFormat = prep.ResponseFormat
        });

        _output.WriteLine($"[Live Request Test] OpenRouter returned: FinishReason='{completion.FinishReason}', CompletionTokens={completion.Usage.CompletionTokens} with max_tokens={prep.MaxTokens}");
        completion.FinishReason.Should().Be("stop");
    }

    [Fact]
    public async Task Missing_Config_Key_Falls_Back_Safely_To_DefaultMaxOutputTokens()
    {
        // 2. Empty configuration (missing key)
        var emptySettings = new AiSettings
        {
            OutputTokenLimits = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
        };
        var options = Options.Create(emptySettings);

        var handler = new BusinessModelHandler(
            new BusinessModelSessionRepository(_db),
            new MarketStudySessionRepository(_db),
            new ClarifierSessionRepository(_db),
            new CreatorIdeaRepository(_db),
            new BusinessIdeasRepository(_db),
            new AiInsightWriter(new AiInsightRepository(_db)),
            NullLogger<BusinessModelHandler>.Instance,
            options);

        var request = new AiRequest
        {
            OwnerUserId = "b1e8c269-87e1-43eb-8f2e-25b28d6c6d0a",
            JobType = "BusinessModel",
            Status = "Processing",
            InputPayload = new BsonDocument()
        };

        var prep = await handler.PrepareAsync(request);
        _output.WriteLine($"[Fallback Test] Missing key -> PrepareAsync resolved MaxTokens: {prep.MaxTokens} (expected {BusinessModelHandler.DefaultMaxOutputTokens})");
        prep.MaxTokens.Should().Be(BusinessModelHandler.DefaultMaxOutputTokens);
    }
}
