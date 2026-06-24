using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.Ai;
using WebApp.Services.Ai.Jobs;
using WebApp.Services.Ai.Providers;
using WebApp.Services.Ai.Prompts;
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Integration;

/// <summary>
/// AI job-engine lifecycle against real MongoDB, with a FAKE provider so the
/// request → job → response flow is deterministic and needs no real API key.
/// The "probe" prompt is seeded by app startup. Skips without Docker.
/// </summary>
public class AiJobEngineIntegrationTests : IClassFixture<AppFixture>
{
    private readonly AppFixture _fx;
    public AiJobEngineIntegrationTests(AppFixture fx) => _fx = fx;

    private IServiceProvider Services => _fx.Factory!.Services;
    private IMongoDatabase Db => Services.GetRequiredService<IMongoDatabase>();

    private static AiCompletion Canned() => new()
    {
        Text = "pipeline ok",
        Model = "test/model",
        Usage = new AiTokenUsage(10, 5, 15),
        FinishReason = "stop",
        EstimatedCost = 0.0001m,
    };

    private AiJobRunner BuildRunner(IAiProvider provider) => new(
        new AiRequestRepository(Db),
        new AiResponseRepository(Db),
        new AiModelUsageRepository(Db),
        new AiTaskHandlerRegistry(new IAiTaskHandler[] { new NoOpProbeHandler() }),
        Services.GetRequiredService<IPromptVersionStore>(),
        new PromptBuilder(),
        Services.GetRequiredService<IModelRouter>(),
        provider,
        Services.GetRequiredService<IAiJobCompletionHandler>(),
        Services.GetRequiredService<IClarifierSessionStore>(),
        Services.GetRequiredService<IBusinessPlanSessionStore>(),
        Services.GetRequiredService<IForecastSessionStore>(),
        NullLogger<AiJobRunner>.Instance);

    [SkippableFact]
    public async Task Probe_runs_full_request_job_response_lifecycle()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var owner = Guid.NewGuid().ToString();
        var requests = new AiRequestRepository(Db);

        var req = new AiRequest { OwnerUserId = owner, JobType = "Probe", Status = "Pending", InputPayload = new BsonDocument("message", "ping") };
        await requests.AddAsync(req);

        var provider = new RecordingProvider(Canned());
        await BuildRunner(provider).RunAsync(req.Id);

        provider.Calls.Should().Be(1);
        provider.Last!.Messages.Should().HaveCount(2); // system + user from PromptBuilder

        var updated = await requests.GetByIdAsync(req.Id);
        updated!.Status.Should().Be("Completed");
        updated.PromptKey.Should().Be("probe");
        updated.PromptVersion.Should().Be(PromptTemplate.Probe.Version);

        var response = (await new AiResponseRepository(Db).FindAsync(r => r.RequestId == req.Id)).FirstOrDefault();
        response.Should().NotBeNull();
        response!.RawText.Should().Be("pipeline ok");
        response.TokenUsage.TotalTokens.Should().Be(15);
        response.OutputPayload!["text"].AsString.Should().Be("pipeline ok");

        var usage = (await new AiModelUsageRepository(Db).FindAsync(u => u.RequestId == req.Id)).ToList();
        usage.Should().ContainSingle();
        usage[0].EstimatedCost.Should().Be(0.0001m);
        usage[0].TaskType.Should().Be("Probe");
    }

    [SkippableFact]
    public async Task Completed_request_is_idempotent_no_provider_call()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var owner = Guid.NewGuid().ToString();
        var requests = new AiRequestRepository(Db);

        var req = new AiRequest { OwnerUserId = owner, JobType = "Probe", Status = "Completed" };
        await requests.AddAsync(req);

        var provider = new RecordingProvider(throwIfCalled: new InvalidOperationException("must not be called"));
        await BuildRunner(provider).RunAsync(req.Id); // must NOT throw

        provider.Calls.Should().Be(0);
        (await new AiResponseRepository(Db).FindAsync(r => r.RequestId == req.Id)).Should().BeEmpty();
    }

    [SkippableFact]
    public async Task Failed_provider_marks_request_failed()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var owner = Guid.NewGuid().ToString();
        var requests = new AiRequestRepository(Db);

        var req = new AiRequest { OwnerUserId = owner, JobType = "Probe", Status = "Pending" };
        await requests.AddAsync(req);

        var provider = new RecordingProvider(throwIfCalled: new AiProviderException("boom", 500));
        var act = () => BuildRunner(provider).RunAsync(req.Id);
        await act.Should().ThrowAsync<AiProviderException>(); // rethrown for Hangfire

        var failed = await requests.GetByIdAsync(req.Id);
        failed!.Status.Should().Be("Failed");
        failed.Error.Should().NotBeNullOrEmpty(); // error persisted

        // No partial persistence: neither a response nor a usage row is written.
        (await new AiResponseRepository(Db).FindAsync(r => r.RequestId == req.Id)).Should().BeEmpty();
        (await new AiModelUsageRepository(Db).FindAsync(u => u.RequestId == req.Id)).Should().BeEmpty();
    }

    [SkippableFact]
    public async Task Enqueue_persists_request_and_is_ownership_scoped()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var owner = Guid.NewGuid().ToString();
        var svc = Services.GetRequiredService<IAiJobService>();

        var id = await svc.EnqueueAsync(AiJobType.Probe, owner, new BsonDocument("message", "hi"));

        var doc = await new AiRequestRepository(Db).GetByIdAsync(id);
        doc.Should().NotBeNull();
        doc!.OwnerUserId.Should().Be(owner);
        doc.JobType.Should().Be("Probe");
        doc.HangfireJobId.Should().NotBeNullOrEmpty();

        (await svc.GetStatusAsync(id, owner)).Should().NotBeNull();
        (await svc.GetStatusAsync(id, "another-user")).Should().BeNull(); // ownership scoped
    }

    // ---- Phase 5: notification persistence on terminal states ----

    [SkippableFact]
    public async Task Completed_job_persists_success_notification_for_owner()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var owner = Guid.NewGuid();
        var requests = new AiRequestRepository(Db);
        var req = new AiRequest { OwnerUserId = owner.ToString(), JobType = "Probe", Status = "Pending", InputPayload = new BsonDocument("message", "ping") };
        await requests.AddAsync(req);

        await BuildRunner(new RecordingProvider(Canned())).RunAsync(req.Id);

        var notifs = await Db.GetCollection<Notification>("Notifications").Find(n => n.UserId == owner).ToListAsync();
        notifs.Should().Contain(n => n.Title == "AI job complete");
    }

    [SkippableFact]
    public async Task Failed_job_persists_failure_notification_for_owner()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var owner = Guid.NewGuid();
        var requests = new AiRequestRepository(Db);
        var req = new AiRequest { OwnerUserId = owner.ToString(), JobType = "Probe", Status = "Pending" };
        await requests.AddAsync(req);

        var act = () => BuildRunner(new RecordingProvider(new AiProviderException("boom", 500))).RunAsync(req.Id);
        await act.Should().ThrowAsync<AiProviderException>();

        var notifs = await Db.GetCollection<Notification>("Notifications").Find(n => n.UserId == owner).ToListAsync();
        notifs.Should().Contain(n => n.Title == "AI job failed");
    }

    private sealed class RecordingProvider : IAiProvider
    {
        private readonly AiCompletion? _result;
        private readonly Exception? _throw;
        public int Calls { get; private set; }
        public AiCompletionRequest? Last { get; private set; }

        public RecordingProvider(AiCompletion result) => _result = result;
        public RecordingProvider(Exception throwIfCalled) => _throw = throwIfCalled;

        public Task<AiCompletion> CompleteAsync(AiCompletionRequest request, CancellationToken cancellationToken = default)
        {
            Calls++;
            Last = request;
            if (_throw is not null) throw _throw;
            return Task.FromResult(_result!);
        }
    }
}
