using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Integration;

/// <summary>
/// Real-MongoDB verification for the C-4 <see cref="ForecastSessionRepository"/>:
/// owner-scoped access, append-only version history, an immutable generated
/// snapshot with an editable working copy, the CurrentVersion pointer, and the
/// three locked indexes. Skips when Docker/Testcontainers is unavailable.
/// </summary>
public class ForecastSessionRepositoryIntegrationTests : IClassFixture<AppFixture>
{
    private readonly AppFixture _fx;

    public ForecastSessionRepositoryIntegrationTests(AppFixture fx) => _fx = fx;

    private IServiceProvider Services => _fx.Factory!.Services;
    private IMongoDatabase Db => Services.GetRequiredService<IMongoDatabase>();
    private ForecastSessionRepository Repo => Services.GetRequiredService<ForecastSessionRepository>();

    private static BsonDocument Forecast(int rev) => new()
    {
        ["schemaVersion"] = 1,
        ["revenueForecast"] = new BsonDocument { ["currency"] = "USD", ["monthly"] = new BsonArray { new BsonDocument { ["month"] = 1, ["amount"] = rev } } },
        ["advisoryNotice"] = "estimates only",
    };

    private async Task<ForecastSession> NewCompletedSession(string owner, string bpId)
    {
        var session = new ForecastSession
        {
            OwnerUserId = owner,
            BusinessPlanSessionId = bpId,
            Status = "Pending",
        };
        await Repo.AddAsync(session);
        var reqId = ObjectId.GenerateNewId().ToString();
        await Repo.SetRequestIdAsync(session.Id, reqId);
        session.RequestId = reqId;
        await Repo.AppendGeneratedVersionAsync(session.Id, Forecast(1000), reqId);
        return session;
    }

    [SkippableFact]
    public async Task Add_and_get_is_owner_scoped()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var owner = Guid.NewGuid().ToString();
        var bpId = ObjectId.GenerateNewId().ToString();

        var session = await NewCompletedSession(owner, bpId);

        (await Repo.GetOwnedAsync(session.Id, owner)).Should().NotBeNull();
        (await Repo.GetOwnedAsync(session.Id, Guid.NewGuid().ToString())).Should().BeNull(); // not the owner
        (await Repo.GetByRequestAsync(session.RequestId, owner))!.Id.Should().Be(session.Id);

        var byPlan = await Repo.ListByBusinessPlanAsync(bpId, owner, 0, 10);
        byPlan.Should().ContainSingle().Which.Id.Should().Be(session.Id);
        (await Repo.ListByOwnerAsync(owner, 0, 10)).Should().ContainSingle();
    }

    [SkippableFact]
    public async Task Generation_is_append_only_with_current_version_pointer()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var owner = Guid.NewGuid().ToString();

        var session = await NewCompletedSession(owner, ObjectId.GenerateNewId().ToString());
        await Repo.AppendGeneratedVersionAsync(session.Id, Forecast(2000), ObjectId.GenerateNewId().ToString()); // regenerate

        var loaded = await Repo.GetOwnedAsync(session.Id, owner);
        loaded!.Versions.Should().HaveCount(2);
        loaded.Versions.Select(v => v.Version).Should().Equal(1, 2); // append-only, monotonic
        loaded.CurrentVersion.Should().Be(2);
        loaded.Status.Should().Be("Completed");
        loaded.SchemaVersion.Should().Be(1);
        // First version is untouched by the second run.
        loaded.Versions[0].GeneratedContent!["revenueForecast"]["monthly"][0]["amount"].AsInt32.Should().Be(1000);
    }

    [SkippableFact]
    public async Task Edit_mutates_only_content_and_preserves_generated_snapshot()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var owner = Guid.NewGuid().ToString();

        var session = await NewCompletedSession(owner, ObjectId.GenerateNewId().ToString());
        var edited = Forecast(9999);
        await Repo.EditCurrentVersionAsync(session.Id, 1, edited);

        var v = (await Repo.GetOwnedAsync(session.Id, owner))!.Versions.Single();
        v.IsEdited.Should().BeTrue();
        v.Content!["revenueForecast"]["monthly"][0]["amount"].AsInt32.Should().Be(9999);     // editable copy changed
        v.GeneratedContent!["revenueForecast"]["monthly"][0]["amount"].AsInt32.Should().Be(1000); // snapshot immutable
    }

    [SkippableFact]
    public async Task Failure_transitions_record_error()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        var owner = Guid.NewGuid().ToString();

        var s1 = new ForecastSession { OwnerUserId = owner, BusinessPlanSessionId = ObjectId.GenerateNewId().ToString() };
        await Repo.AddAsync(s1);
        await Repo.SetFailedAsync(s1.Id, "provider error");
        var f = await Repo.GetOwnedAsync(s1.Id, owner);
        f!.Status.Should().Be("Failed");
        f.Error.Should().Be("provider error");

        var s2 = new ForecastSession { OwnerUserId = owner, BusinessPlanSessionId = ObjectId.GenerateNewId().ToString() };
        await Repo.AddAsync(s2);
        await Repo.SetNeedsReviewAsync(s2.Id, "unparseable");
        (await Repo.GetOwnedAsync(s2.Id, owner))!.Status.Should().Be("NeedsReview");
    }

    [SkippableFact]
    public async Task Indexes_are_created()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);
        _ = Repo; // resolve so ctor index creation has run

        var cursor = await Db.GetCollection<BsonDocument>("ForecastSessions").Indexes.ListAsync();
        var names = (await cursor.ToListAsync()).Select(d => d["name"].AsString).ToList();

        names.Should().Contain(new[] { "Owner_CreatedAt", "BusinessPlanSessionId", "RequestId" });
    }
}
