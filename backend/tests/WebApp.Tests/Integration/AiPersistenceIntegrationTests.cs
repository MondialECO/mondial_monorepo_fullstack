using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Integration;

/// <summary>
/// Real-MongoDB round-trip + index-creation verification for the 7 AI
/// repositories. Resolves the singletons from the booted app (which triggers
/// their ctor index creation) and asserts against the live IntegrationTest db.
/// Skips when Docker/Testcontainers is unavailable.
/// </summary>
public class AiPersistenceIntegrationTests : IClassFixture<AppFixture>
{
    private readonly AppFixture _fx;

    public AiPersistenceIntegrationTests(AppFixture fx) => _fx = fx;

    private IServiceProvider Services => _fx.Factory!.Services;
    private IMongoDatabase Db => Services.GetRequiredService<IMongoDatabase>();

    private static async Task<List<string>> IndexNamesAsync(IMongoDatabase db, string collection)
    {
        var cursor = await db.GetCollection<BsonDocument>(collection).Indexes.ListAsync();
        var docs = await cursor.ToListAsync();
        return docs.Select(d => d["name"].AsString).ToList();
    }

    [SkippableFact]
    public async Task Repositories_round_trip_all_entities()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var owner = Guid.NewGuid().ToString();

        var requestRepo = Services.GetRequiredService<AiRequestRepository>();
        var request = new AiRequest
        {
            OwnerUserId = owner,
            JobType = "Probe",
            InputPayload = new BsonDocument("idea", "x"),
            PromptKey = "probe",
            PromptVersion = 1,
        };
        await requestRepo.AddAsync(request);
        request.Id.Should().NotBeNullOrEmpty(); // ObjectId generated on insert
        (await requestRepo.GetByIdAsync(request.Id)).OwnerUserId.Should().Be(owner);

        var responseRepo = Services.GetRequiredService<AiResponseRepository>();
        var response = new AiResponse
        {
            RequestId = request.Id,
            OwnerUserId = owner,
            Model = "openai/gpt-4o-mini",
            RawText = "hi",
            TokenUsage = new AiResponseTokenUsage { PromptTokens = 1, CompletionTokens = 2, TotalTokens = 3 },
        };
        await responseRepo.AddAsync(response);
        (await responseRepo.GetByIdAsync(response.Id)).TokenUsage.TotalTokens.Should().Be(3);

        var usageRepo = Services.GetRequiredService<AiModelUsageRepository>();
        var usage = new AiModelUsage { OwnerUserId = owner, RequestId = request.Id, Model = "m", TotalTokens = 3, EstimatedCost = 0.001m, TaskType = "Probe" };
        await usageRepo.AddAsync(usage);
        (await usageRepo.GetByIdAsync(usage.Id)).EstimatedCost.Should().Be(0.001m);

        var feedbackRepo = Services.GetRequiredService<AiFeedbackRepository>();
        var feedback = new AiFeedback { OwnerUserId = owner, ResponseId = response.Id, Rating = 5 };
        await feedbackRepo.AddAsync(feedback);
        (await feedbackRepo.GetByIdAsync(feedback.Id)).Rating.Should().Be(5);

        var insightRepo = Services.GetRequiredService<AiInsightRepository>();
        var insight = new AiInsight { OwnerUserId = owner, Type = "market", Payload = new BsonDocument("k", 1) };
        await insightRepo.AddAsync(insight);
        (await insightRepo.GetByIdAsync(insight.Id)).Type.Should().Be("market");

        var promptRepo = Services.GetRequiredService<PromptVersionRepository>();
        var prompt = new PromptVersion { Key = Guid.NewGuid().ToString(), Version = 1, SystemText = "sys", IsActive = true };
        await promptRepo.AddAsync(prompt);
        (await promptRepo.GetByIdAsync(prompt.Id)).SystemText.Should().Be("sys");

        var creditRepo = Services.GetRequiredService<AiCreditLedgerRepository>();
        var credit = new AiCreditLedger { OwnerUserId = owner, Balance = 10, LifetimeGranted = 10 };
        await creditRepo.AddAsync(credit);
        (await creditRepo.GetByIdAsync(credit.Id)).Balance.Should().Be(10);
    }

    [SkippableFact]
    public async Task Indexes_are_created_for_all_collections()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        // Resolve every repo so the ctor index creation has run.
        Services.GetRequiredService<AiRequestRepository>();
        Services.GetRequiredService<AiResponseRepository>();
        Services.GetRequiredService<AiModelUsageRepository>();
        Services.GetRequiredService<AiFeedbackRepository>();
        Services.GetRequiredService<AiInsightRepository>();
        Services.GetRequiredService<PromptVersionRepository>();
        Services.GetRequiredService<AiCreditLedgerRepository>();

        (await IndexNamesAsync(Db, "AIRequests")).Should().Contain(new[] { "Owner_CreatedAt", "Status", "HangfireJobId" });
        (await IndexNamesAsync(Db, "AIResponses")).Should().Contain(new[] { "RequestId", "Owner_CreatedAt" });
        (await IndexNamesAsync(Db, "ModelUsage")).Should().Contain(new[] { "Owner_CreatedAt", "Model_CreatedAt" });
        (await IndexNamesAsync(Db, "AIFeedback")).Should().Contain(new[] { "ResponseId", "Owner_CreatedAt" });
        (await IndexNamesAsync(Db, "AIInsights")).Should().Contain("Owner_Type_CreatedAt");
        (await IndexNamesAsync(Db, "PromptVersions")).Should().Contain(new[] { "Key_Version_Unique", "Active_Per_Key_Unique" });
        (await IndexNamesAsync(Db, "AICredits")).Should().Contain("OwnerUserId_Unique");
    }

    [SkippableFact]
    public async Task AICredits_owner_is_unique()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var repo = Services.GetRequiredService<AiCreditLedgerRepository>();
        var owner = Guid.NewGuid().ToString();

        await repo.AddAsync(new AiCreditLedger { OwnerUserId = owner, Balance = 5 });

        var act = () => repo.AddAsync(new AiCreditLedger { OwnerUserId = owner, Balance = 7 });
        await act.Should().ThrowAsync<MongoWriteException>();
    }

    [SkippableFact]
    public async Task PromptVersions_key_version_is_unique()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var repo = Services.GetRequiredService<PromptVersionRepository>();
        var key = Guid.NewGuid().ToString();

        await repo.AddAsync(new PromptVersion { Key = key, Version = 1, SystemText = "a", IsActive = false });

        var act = () => repo.AddAsync(new PromptVersion { Key = key, Version = 1, SystemText = "b", IsActive = false });
        await act.Should().ThrowAsync<MongoWriteException>();
    }
}
