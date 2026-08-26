using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.Ai;
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
            Model = "openai/gpt-oss-20b:free",
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

    // ---- Phase 7: starter-credit grant idempotency ----

    [SkippableFact]
    public async Task Starter_credit_grant_is_idempotent()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var credits = new AiCreditLedgerRepository(Db);
        var owner = Guid.NewGuid().ToString();

        (await credits.TryGrantInitialAsync(owner, 10)).Should().BeTrue();   // first grant
        (await credits.TryGrantInitialAsync(owner, 10)).Should().BeFalse();  // no-op
        (await credits.TryGrantInitialAsync(owner, 999)).Should().BeFalse(); // never re-grants

        (await credits.GetByOwnerAsync(owner))!.Balance.Should().Be(10);     // balance untouched
    }

    [SkippableFact]
    public async Task Credit_seeder_grants_once_per_user()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var users = Db.GetCollection<ApplicationUser>("users");
        var u1 = new ApplicationUser { Id = Guid.NewGuid(), UserName = "seed1@test" };
        var u2 = new ApplicationUser { Id = Guid.NewGuid(), UserName = "seed2@test" };
        await users.InsertManyAsync(new[] { u1, u2 });

        var seeder = Services.GetRequiredService<IAiCreditSeeder>();

        var first = await seeder.GrantStarterCreditsAsync(25);
        first.Should().BeGreaterThanOrEqualTo(2); // at least our two new users

        var credits = new AiCreditLedgerRepository(Db);
        (await credits.GetByOwnerAsync(u1.Id.ToString()))!.Balance.Should().Be(25);
        (await credits.GetByOwnerAsync(u2.Id.ToString()))!.Balance.Should().Be(25);

        // Idempotent: our two users are not re-granted on the second run.
        await seeder.GrantStarterCreditsAsync(25);
        (await credits.GetByOwnerAsync(u1.Id.ToString()))!.Balance.Should().Be(25);
    }

    // ---- Refund idempotency & concurrency tests A through H ----

    [SkippableFact]
    public async Task Refund_Single_And_SequentialDuplicate_Is_Idempotent()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var credits = new AiCreditLedgerRepository(Db);
        var owner = Guid.NewGuid().ToString();
        var opId = Guid.NewGuid().ToString();

        await credits.AddAsync(new AiCreditLedger { OwnerUserId = owner, Balance = 10, LifetimeSpent = 0 });
        (await credits.TryDebitAsync(owner, 5, new AiCreditDebit { OperationId = opId, Amount = 5, Reason = "BusinessPlan" })).Should().Be(CreditDebitResult.Applied);

        var stateAfterDebit = await credits.GetByOwnerAsync(owner);
        stateAfterDebit!.Balance.Should().Be(5);
        stateAfterDebit.LifetimeSpent.Should().Be(5);

        // A. Single refund
        var first = await credits.TryRefundAsync(owner, opId, 5, "generation_failed");
        first.Should().Be(CreditRefundResult.Applied);

        var stateAfterRefund1 = await credits.GetByOwnerAsync(owner);
        stateAfterRefund1!.Balance.Should().Be(10);
        stateAfterRefund1.LifetimeSpent.Should().Be(0);

        // B. Sequential duplicate refund
        var second = await credits.TryRefundAsync(owner, opId, 5, "generation_failed");
        second.Should().Be(CreditRefundResult.AlreadyRefunded);

        var stateAfterRefund2 = await credits.GetByOwnerAsync(owner);
        stateAfterRefund2!.Balance.Should().Be(10);
        stateAfterRefund2.LifetimeSpent.Should().Be(0);
    }

    [SkippableFact]
    public async Task Refund_Concurrent_Duplicates_Mutate_Exactly_Once()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var credits = new AiCreditLedgerRepository(Db);
        var owner = Guid.NewGuid().ToString();
        var opId = Guid.NewGuid().ToString();

        await credits.AddAsync(new AiCreditLedger { OwnerUserId = owner, Balance = 10, LifetimeSpent = 0 });
        await credits.TryDebitAsync(owner, 5, new AiCreditDebit { OperationId = opId, Amount = 5, Reason = "BusinessPlan" });

        // C & D. 10 concurrent duplicates
        var tasks = Enumerable.Range(0, 10).Select(_ => credits.TryRefundAsync(owner, opId, 5, "concurrent_fail")).ToList();
        var results = await Task.WhenAll(tasks);

        results.Count(r => r == CreditRefundResult.Applied).Should().Be(1);
        results.Count(r => r == CreditRefundResult.AlreadyRefunded).Should().Be(9);

        var finalState = await credits.GetByOwnerAsync(owner);
        finalState!.Balance.Should().Be(10);
        finalState.LifetimeSpent.Should().Be(0);
    }

    [SkippableFact]
    public async Task Refund_Different_Debits_Apply_Independently()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var credits = new AiCreditLedgerRepository(Db);
        var owner = Guid.NewGuid().ToString();
        var opA = Guid.NewGuid().ToString();
        var opB = Guid.NewGuid().ToString();

        await credits.AddAsync(new AiCreditLedger { OwnerUserId = owner, Balance = 20, LifetimeSpent = 0 });
        await credits.TryDebitAsync(owner, 5, new AiCreditDebit { OperationId = opA, Amount = 5, Reason = "JobA" });
        await credits.TryDebitAsync(owner, 5, new AiCreditDebit { OperationId = opB, Amount = 5, Reason = "JobB" });

        var state = await credits.GetByOwnerAsync(owner);
        state!.Balance.Should().Be(10);
        state.LifetimeSpent.Should().Be(10);

        // E. Both refunds apply once independently
        (await credits.TryRefundAsync(owner, opA, 5, "failed_A")).Should().Be(CreditRefundResult.Applied);
        (await credits.TryRefundAsync(owner, opB, 5, "failed_B")).Should().Be(CreditRefundResult.Applied);

        var finalState = await credits.GetByOwnerAsync(owner);
        finalState!.Balance.Should().Be(20);
        finalState.LifetimeSpent.Should().Be(0);
    }

    [SkippableFact]
    public async Task Refund_UnknownOperation_WrongUser_WrongAmount_Returns_Error_Zero_Mutation()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var credits = new AiCreditLedgerRepository(Db);
        var ownerA = Guid.NewGuid().ToString();
        var ownerB = Guid.NewGuid().ToString();
        var opA = Guid.NewGuid().ToString();

        await credits.AddAsync(new AiCreditLedger { OwnerUserId = ownerA, Balance = 10, LifetimeSpent = 0 });
        await credits.AddAsync(new AiCreditLedger { OwnerUserId = ownerB, Balance = 10, LifetimeSpent = 0 });
        await credits.TryDebitAsync(ownerA, 5, new AiCreditDebit { OperationId = opA, Amount = 5, Reason = "JobA" });

        // F. Unknown operation
        (await credits.TryRefundAsync(ownerA, "unknown-op", 5, "fail")).Should().Be(CreditRefundResult.DebitNotFound);

        // G. Wrong user
        (await credits.TryRefundAsync(ownerB, opA, 5, "fail")).Should().Be(CreditRefundResult.DebitNotFound);

        // H. Wrong amount
        (await credits.TryRefundAsync(ownerA, opA, 10, "fail")).Should().Be(CreditRefundResult.InvalidMismatch);

        // Assert 0 mutation
        var stateA = await credits.GetByOwnerAsync(ownerA);
        stateA!.Balance.Should().Be(5);
        stateA.LifetimeSpent.Should().Be(5);

        var stateB = await credits.GetByOwnerAsync(ownerB);
        stateB!.Balance.Should().Be(10);
        stateB.LifetimeSpent.Should().Be(0);
    }

    // ---- Debit idempotency & concurrency tests ----

    [SkippableFact]
    public async Task Debit_Duplicate_With_Same_OperationId_Is_Idempotent()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var credits = new AiCreditLedgerRepository(Db);
        var owner = Guid.NewGuid().ToString();
        var opId = "business-plan-session-123";

        await credits.AddAsync(new AiCreditLedger { OwnerUserId = owner, Balance = 10, LifetimeSpent = 0 });

        // First debit
        var first = await credits.TryDebitAsync(owner, 5, new AiCreditDebit { OperationId = opId, Amount = 5, Reason = "BusinessPlan" });
        first.Should().Be(CreditDebitResult.Applied);

        var state1 = await credits.GetByOwnerAsync(owner);
        state1!.Balance.Should().Be(5);
        state1.LifetimeSpent.Should().Be(5);
        state1.Debits.Should().HaveCount(1);
        state1.Debits[0].OperationId.Should().Be(opId);

        // Second debit with SAME OperationId
        var second = await credits.TryDebitAsync(owner, 5, new AiCreditDebit { OperationId = opId, Amount = 5, Reason = "BusinessPlan" });
        second.Should().Be(CreditDebitResult.AlreadyDebited);

        var state2 = await credits.GetByOwnerAsync(owner);
        state2!.Balance.Should().Be(5);
        state2.LifetimeSpent.Should().Be(5);
        state2.Debits.Should().HaveCount(1);
    }

    [SkippableFact]
    public async Task Debit_Concurrent_Duplicates_Mutate_Exactly_Once_And_Refund_Once()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var credits = new AiCreditLedgerRepository(Db);
        var owner = Guid.NewGuid().ToString();
        var opId = "concurrent-op-999";

        await credits.AddAsync(new AiCreditLedger { OwnerUserId = owner, Balance = 10, LifetimeSpent = 0 });

        // 10 concurrent debits with SAME OperationId
        var tasks = Enumerable.Range(0, 10).Select(_ => credits.TryDebitAsync(owner, 5, new AiCreditDebit
        {
            OperationId = opId,
            Amount = 5,
            Reason = "BusinessPlan"
        })).ToList();
        var results = await Task.WhenAll(tasks);

        results.Count(r => r == CreditDebitResult.Applied).Should().Be(1);
        results.Count(r => r == CreditDebitResult.AlreadyDebited).Should().Be(9);

        var stateAfterDebits = await credits.GetByOwnerAsync(owner);
        stateAfterDebits!.Balance.Should().Be(5);
        stateAfterDebits.LifetimeSpent.Should().Be(5);
        stateAfterDebits.Debits.Should().HaveCount(1);

        // Refund the OperationId
        var refund1 = await credits.TryRefundAsync(owner, opId, 5, "failed_job");
        refund1.Should().Be(CreditRefundResult.Applied);

        var stateAfterRefund1 = await credits.GetByOwnerAsync(owner);
        stateAfterRefund1!.Balance.Should().Be(10);
        stateAfterRefund1.LifetimeSpent.Should().Be(0);

        // Second refund attempt
        var refund2 = await credits.TryRefundAsync(owner, opId, 5, "failed_job");
        refund2.Should().Be(CreditRefundResult.AlreadyRefunded);

        var stateAfterRefund2 = await credits.GetByOwnerAsync(owner);
        stateAfterRefund2!.Balance.Should().Be(10);
        stateAfterRefund2.LifetimeSpent.Should().Be(0);
    }

    [SkippableFact]
    public async Task Debit_DifferentOperationIds_SameUser_And_SameOperationId_DifferentUsers_Are_Independent()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var credits = new AiCreditLedgerRepository(Db);
        var ownerA = Guid.NewGuid().ToString();
        var ownerB = Guid.NewGuid().ToString();
        var sharedOpText = "same-op-text";

        await credits.AddAsync(new AiCreditLedger { OwnerUserId = ownerA, Balance = 20, LifetimeSpent = 0 });
        await credits.AddAsync(new AiCreditLedger { OwnerUserId = ownerB, Balance = 20, LifetimeSpent = 0 });

        // Same user + different OperationIds
        (await credits.TryDebitAsync(ownerA, 5, new AiCreditDebit { OperationId = "op-A1", Amount = 5, Reason = "A1" })).Should().Be(CreditDebitResult.Applied);
        (await credits.TryDebitAsync(ownerA, 5, new AiCreditDebit { OperationId = "op-A2", Amount = 5, Reason = "A2" })).Should().Be(CreditDebitResult.Applied);

        var stateA = await credits.GetByOwnerAsync(ownerA);
        stateA!.Balance.Should().Be(10);
        stateA.LifetimeSpent.Should().Be(10);
        stateA.Debits.Should().HaveCount(2);

        // Different users + same textual OperationId
        (await credits.TryDebitAsync(ownerA, 5, new AiCreditDebit { OperationId = sharedOpText, Amount = 5, Reason = "shared" })).Should().Be(CreditDebitResult.Applied);
        (await credits.TryDebitAsync(ownerB, 5, new AiCreditDebit { OperationId = sharedOpText, Amount = 5, Reason = "shared" })).Should().Be(CreditDebitResult.Applied);

        (await credits.GetByOwnerAsync(ownerA))!.Debits.Should().HaveCount(3);
        (await credits.GetByOwnerAsync(ownerB))!.Debits.Should().HaveCount(1);
    }

    // ---- Starter Credit Policy & Legacy Normalization Tests ----

    [SkippableFact]
    public async Task Starter_Credit_Grant_Uses_200_And_Is_Idempotent()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var credits = new AiCreditLedgerRepository(Db);
        var owner = Guid.NewGuid().ToString();

        // Initial grant with 200
        var first = await credits.TryGrantInitialAsync(owner, 200);
        first.Should().BeTrue();

        var state1 = await credits.GetByOwnerAsync(owner);
        state1!.Balance.Should().Be(200);
        state1.LifetimeGranted.Should().Be(200);
        state1.LifetimeSpent.Should().Be(0);

        // Second grant attempt is no-op
        var second = await credits.TryGrantInitialAsync(owner, 200);
        second.Should().BeFalse();

        // Debit some credits
        await credits.TryDebitAsync(owner, 50, new AiCreditDebit { OperationId = "op-debit", Amount = 50, Reason = "test" });
        var state2 = await credits.GetByOwnerAsync(owner);
        state2!.Balance.Should().Be(150);

        // Calling TryGrantInitialAsync again does NOT top up existing spent balance
        var third = await credits.TryGrantInitialAsync(owner, 200);
        third.Should().BeFalse();

        var state3 = await credits.GetByOwnerAsync(owner);
        state3!.Balance.Should().Be(150);
        state3.LifetimeGranted.Should().Be(200);
    }

    [SkippableFact]
    public async Task NormalizeLegacyStarterCredits_Exhausted_Partial_Untouched_Current_And_Admin()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var credits = new AiCreditLedgerRepository(Db);
        var userA = Guid.NewGuid().ToString(); // exhausted
        var userB = Guid.NewGuid().ToString(); // partial
        var userC = Guid.NewGuid().ToString(); // untouched
        var userD = Guid.NewGuid().ToString(); // current (200)
        var userE = Guid.NewGuid().ToString(); // admin (>200)

        // Seed initial states
        await credits.AddAsync(new AiCreditLedger { OwnerUserId = userA, Balance = 0, LifetimeGranted = 100, LifetimeSpent = 100 });
        await credits.AddAsync(new AiCreditLedger { OwnerUserId = userB, Balance = 60, LifetimeGranted = 100, LifetimeSpent = 40 });
        await credits.AddAsync(new AiCreditLedger { OwnerUserId = userC, Balance = 100, LifetimeGranted = 100, LifetimeSpent = 0 });
        await credits.AddAsync(new AiCreditLedger { OwnerUserId = userD, Balance = 150, LifetimeGranted = 200, LifetimeSpent = 50 });
        await credits.AddAsync(new AiCreditLedger { OwnerUserId = userE, Balance = 300, LifetimeGranted = 300, LifetimeSpent = 0 });

        // Normalize users
        (await credits.TryNormalizeLegacyStarterCreditsForUserAsync(userA, 100, 200)).Should().BeTrue();
        (await credits.TryNormalizeLegacyStarterCreditsForUserAsync(userB, 100, 200)).Should().BeTrue();
        (await credits.TryNormalizeLegacyStarterCreditsForUserAsync(userC, 100, 200)).Should().BeTrue();
        (await credits.TryNormalizeLegacyStarterCreditsForUserAsync(userD, 100, 200)).Should().BeFalse();
        (await credits.TryNormalizeLegacyStarterCreditsForUserAsync(userE, 100, 200)).Should().BeFalse();

        // A. Exhausted: 100 granted / 100 spent / 0 balance -> 200 / 100 / 100
        var stateA = await credits.GetByOwnerAsync(userA);
        stateA!.LifetimeGranted.Should().Be(200);
        stateA.LifetimeSpent.Should().Be(100);
        stateA.Balance.Should().Be(100);

        // B. Partial: 100 / 40 / 60 -> 200 / 40 / 160
        var stateB = await credits.GetByOwnerAsync(userB);
        stateB!.LifetimeGranted.Should().Be(200);
        stateB.LifetimeSpent.Should().Be(40);
        stateB.Balance.Should().Be(160);

        // C. Untouched: 100 / 0 / 100 -> 200 / 0 / 200
        var stateC = await credits.GetByOwnerAsync(userC);
        stateC!.LifetimeGranted.Should().Be(200);
        stateC.LifetimeSpent.Should().Be(0);
        stateC.Balance.Should().Be(200);

        // D. Current user: 200 -> unchanged
        var stateD = await credits.GetByOwnerAsync(userD);
        stateD!.LifetimeGranted.Should().Be(200);
        stateD.LifetimeSpent.Should().Be(50);
        stateD.Balance.Should().Be(150);

        // E. Admin user: >200 -> unchanged
        var stateE = await credits.GetByOwnerAsync(userE);
        stateE!.LifetimeGranted.Should().Be(300);
        stateE.LifetimeSpent.Should().Be(0);
        stateE.Balance.Should().Be(300);
    }

    [SkippableFact]
    public async Task NormalizeLegacyStarterCredits_Sequential_DoubleRun_Is_Idempotent()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var credits = new AiCreditLedgerRepository(Db);
        var owner = Guid.NewGuid().ToString();

        await credits.AddAsync(new AiCreditLedger { OwnerUserId = owner, Balance = 0, LifetimeGranted = 100, LifetimeSpent = 100 });

        // Run 1: Applies
        var run1 = await credits.TryNormalizeLegacyStarterCreditsForUserAsync(owner, 100, 200);
        run1.Should().BeTrue();

        var state1 = await credits.GetByOwnerAsync(owner);
        state1!.LifetimeGranted.Should().Be(200);
        state1.Balance.Should().Be(100);
        state1.LifetimeSpent.Should().Be(100);

        // Run 2: No-op
        var run2 = await credits.TryNormalizeLegacyStarterCreditsForUserAsync(owner, 100, 200);
        run2.Should().BeFalse();

        var state2 = await credits.GetByOwnerAsync(owner);
        state2!.LifetimeGranted.Should().Be(200);
        state2.Balance.Should().Be(100);
        state2.LifetimeSpent.Should().Be(100);
    }

    [SkippableFact]
    public async Task NormalizeLegacyStarterCredits_Concurrent_Runs_Apply_Exactly_Once()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var credits = new AiCreditLedgerRepository(Db);
        var owner = Guid.NewGuid().ToString();

        await credits.AddAsync(new AiCreditLedger { OwnerUserId = owner, Balance = 20, LifetimeGranted = 100, LifetimeSpent = 80 });

        // 10 concurrent normalization attempts
        var tasks = Enumerable.Range(0, 10).Select(_ => credits.TryNormalizeLegacyStarterCreditsForUserAsync(owner, 100, 200)).ToList();
        var results = await Task.WhenAll(tasks);

        results.Count(r => r == true).Should().Be(1);
        results.Count(r => r == false).Should().Be(9);

        var finalState = await credits.GetByOwnerAsync(owner);
        finalState!.LifetimeGranted.Should().Be(200);
        finalState.LifetimeSpent.Should().Be(80);
        finalState.Balance.Should().Be(120);
    }
}
