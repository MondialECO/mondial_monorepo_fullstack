using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using MongoDB.Driver;
using Moq;
using System.Security.Claims;
using WebApp.Controllers;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Services;
using WebApp.Services.Interface;
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Integration;

/// <summary>
/// Empirically proves the Tier-1a Level Up atomicity against a REAL single-node
/// replica set (<see cref="ReplicaSetAppFixture"/>, Mongo:TransactionsEnabled=true):
/// a fault injected AFTER the company + levelUpTriggered writes but BEFORE commit
/// must roll EVERYTHING back, and a clean retry must then fully succeed with exactly
/// one company + one profile.
///
/// NOTE: requires Docker + a replica set. Skips when unavailable — see SkipReason.
/// </summary>
public class LevelUpTransactionIntegrationTests : IClassFixture<ReplicaSetAppFixture>
{
    private readonly ReplicaSetAppFixture _fx;
    public LevelUpTransactionIntegrationTests(ReplicaSetAppFixture fx) => _fx = fx;

    private IServiceProvider Sp => _fx.Factory!.Services;

    // A MongoDbContext whose ApplicationUsers.UpdateOneAsync throws — the LAST
    // in-transaction write (role + companyId), which runs AFTER the company + journey
    // (levelUpTriggered) writes. Everything else uses the real collections so the
    // transaction has genuine pending writes when it aborts.
    private sealed class FaultUserWriteMongoDbContext : MongoDbContext
    {
        private readonly IMongoCollection<ApplicationUser> _faultyUsers;
        public FaultUserWriteMongoDbContext(IMongoDatabase db, IMongoCollection<ApplicationUser> faultyUsers)
            : base(db) => _faultyUsers = faultyUsers;
        public override IMongoCollection<ApplicationUser> ApplicationUsers => _faultyUsers;
    }

    private static IMongoCollection<ApplicationUser> ThrowingUserCollection()
    {
        var mock = new Mock<IMongoCollection<ApplicationUser>>();
        mock.Setup(c => c.UpdateOneAsync(
                It.IsAny<IClientSessionHandle>(),
                It.IsAny<FilterDefinition<ApplicationUser>>(),
                It.IsAny<UpdateDefinition<ApplicationUser>>(),
                It.IsAny<UpdateOptions>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("injected mid-transaction failure (user write)"));
        return mock.Object;
    }

    // Build a Level Up controller for a given user, with an optional fault context.
    private CreatorPhase6Controller BuildController(string userId, MongoDbContext? contextOverride = null)
    {
        var ctx = contextOverride ?? Sp.GetRequiredService<MongoDbContext>();
        var controller = new CreatorPhase6Controller(
            Sp.GetRequiredService<ICreatorJourneyService>(),
            Sp.GetRequiredService<ISmartMatchingService>(),
            ctx,
            Sp.GetRequiredService<UserManager<ApplicationUser>>(),
            Sp.GetRequiredService<RoleManager<ApplicationRole>>(),
            Sp.GetRequiredService<IDealEventPublisher>(),
            Sp.GetRequiredService<ICompanyService>(),
            Sp.GetRequiredService<IMongoClient>(),
            Sp.GetRequiredService<IConfiguration>(),
            NullLogger<CreatorPhase6Controller>.Instance);

        var http = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId)
            }, "test"))
        };
        controller.ControllerContext = new ControllerContext { HttpContext = http };
        return controller;
    }

    // Seed a user + a build-path journey with seed funding + ownership (cap-table plan),
    // and ensure the Entrepreneur role exists. Returns the userId (Guid string).
    private async Task<string> SeedBuildPathUserAsync(bool withOwnership = true)
    {
        var users = Sp.GetRequiredService<UserManager<ApplicationUser>>();
        var roles = Sp.GetRequiredService<RoleManager<ApplicationRole>>();
        var journeys = Sp.GetRequiredService<ICreatorJourneyService>();

        if (await roles.FindByNameAsync("Entrepreneur") == null)
            await roles.CreateAsync(new ApplicationRole { Name = "Entrepreneur", Description = "Entrepreneur" });

        var user = new ApplicationUser { UserName = $"u{Guid.NewGuid():N}@test.com", Email = $"u{Guid.NewGuid():N}@test.com", Name = "Test" };
        (await users.CreateAsync(user, "Passw0rd!Passw0rd!")).Succeeded.Should().BeTrue();
        var userId = user.Id.ToString();

        var journey = await journeys.GetOrCreateAsync(userId);
        journey.Phase5Data = new CreatorPhase5Data
        {
            ChosenPath = "build",
            PathB = new CreatorPathB
            {
                SeedFunding = new CreatorSeedFunding { TotalAsk = 150000 },
                CompanyFormation = new CreatorCompanyFormation
                {
                    SelectedType = "SAS",
                    Ownership = withOwnership
                        ? new List<CreatorOwnershipEntry>
                        {
                            new() { Holder = "Founder", Percent = 80, IsFounder = true },
                            new() { Holder = "ESOP", Percent = 10, IsEsop = true },
                            new() { Holder = "Co-founder", Percent = 10 },
                        }
                        : new List<CreatorOwnershipEntry>(),
                },
            },
        };
        await journeys.ReplaceAsync(journey);
        return userId;
    }

    private IMongoCollection<T> Coll<T>(string name) =>
        Sp.GetRequiredService<IMongoDatabase>().GetCollection<T>(name);

    [SkippableFact]
    public async Task Abort_rolls_back_everything_and_clean_retry_succeeds_once()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var userId = await SeedBuildPathUserAsync();
        var userGuid = Guid.Parse(userId);

        // ---- 1) Forced mid-transaction failure (user write throws after company + journey) ----
        var faultCtx = new FaultUserWriteMongoDbContext(Sp.GetRequiredService<IMongoDatabase>(), ThrowingUserCollection());
        var faulted = BuildController(userId, faultCtx);
        var aborted = await faulted.LevelUp();

        // #6 endpoint returned an error (500), not success.
        aborted.Should().BeOfType<ObjectResult>();
        ((ObjectResult)aborted).StatusCode.Should().Be(500);

        // #1 no company, #2 no profile, #5 no entrepreneur role, #3/#4 journey flag/companyId unset.
        (await Coll<Companies>("Companies").CountDocumentsAsync(c => c.OwnerId == userId)).Should().Be(0);
        (await Coll<EntrepreneurProfileRecord>("EntrepreneurProfiles").CountDocumentsAsync(p => p.UserId == userId)).Should().Be(0);

        var journeys = Sp.GetRequiredService<ICreatorJourneyService>();
        var j = await journeys.GetOrCreateAsync(userId);
        j.Phase6Data?.LevelUpTriggered.Should().NotBe(true);   // #3 — THE key assertion
        string.IsNullOrEmpty(j.CompanyId).Should().BeTrue();    // #4

        var user = await Coll<ApplicationUser>("ApplicationUsers").Find(u => u.Id == userGuid).FirstAsync();
        var entRoleId = (await Sp.GetRequiredService<RoleManager<ApplicationRole>>().FindByNameAsync("Entrepreneur"))!.Id;
        (user.Roles ?? new List<Guid>()).Should().NotContain(entRoleId); // #5

        // ---- 7) Clean retry (no fault) succeeds fully, exactly once ----
        var ok = await BuildController(userId).LevelUp();
        ok.Should().BeOfType<OkObjectResult>();

        (await Coll<Companies>("Companies").CountDocumentsAsync(c => c.OwnerId == userId)).Should().Be(1);
        (await Coll<EntrepreneurProfileRecord>("EntrepreneurProfiles").CountDocumentsAsync(p => p.UserId == userId)).Should().Be(1);
        var j2 = await journeys.GetOrCreateAsync(userId);
        j2.Phase6Data!.LevelUpTriggered.Should().BeTrue();
        j2.CompanyId.Should().NotBeNullOrEmpty();
        var user2 = await Coll<ApplicationUser>("ApplicationUsers").Find(u => u.Id == userGuid).FirstAsync();
        user2.Roles.Should().Contain(entRoleId);
    }

    [SkippableFact]
    public async Task Happy_path_commits_once_with_cap_table_seeded()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var userId = await SeedBuildPathUserAsync(withOwnership: true);
        var result = await BuildController(userId).LevelUp();
        result.Should().BeOfType<OkObjectResult>();

        (await Coll<Companies>("Companies").CountDocumentsAsync(c => c.OwnerId == userId)).Should().Be(1);
        (await Coll<EntrepreneurProfileRecord>("EntrepreneurProfiles").CountDocumentsAsync(p => p.UserId == userId)).Should().Be(1);

        var journeys = Sp.GetRequiredService<ICreatorJourneyService>();
        var j = await journeys.GetOrCreateAsync(userId);
        j.Phase6Data!.LevelUpTriggered.Should().BeTrue();
        j.CompanyId.Should().NotBeNullOrEmpty();

        // Cap table seeded post-commit (Option B) from the ownership plan.
        (await Coll<Phase4CapTable>("Phase4CapTables").CountDocumentsAsync(c => c.CompanyId == j.CompanyId))
            .Should().BeGreaterThan(0);
    }

    [SkippableFact]
    public async Task Idempotent_double_level_up_creates_no_duplicates()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var userId = await SeedBuildPathUserAsync();
        (await BuildController(userId).LevelUp()).Should().BeOfType<OkObjectResult>();
        // Second call hits the fast-path idempotency guard (already triggered).
        (await BuildController(userId).LevelUp()).Should().BeOfType<OkObjectResult>();

        (await Coll<Companies>("Companies").CountDocumentsAsync(c => c.OwnerId == userId)).Should().Be(1);
        (await Coll<EntrepreneurProfileRecord>("EntrepreneurProfiles").CountDocumentsAsync(p => p.UserId == userId)).Should().Be(1);
    }

    [SkippableFact]
    public async Task Cap_table_absence_does_not_block_the_committed_core()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        // Empty ownership → the post-commit cap-table seed is skipped entirely. This
        // exercises the Option B boundary: the committed core (company + journey flag +
        // profile + role) must stand on its own, with no cap table. A real SubmitCapTable
        // throw is handled identically — it runs AFTER commit inside a try/catch.
        var userId = await SeedBuildPathUserAsync(withOwnership: false);
        var result = await BuildController(userId).LevelUp();
        result.Should().BeOfType<OkObjectResult>();

        var journeys = Sp.GetRequiredService<ICreatorJourneyService>();
        var j = await journeys.GetOrCreateAsync(userId);
        j.Phase6Data!.LevelUpTriggered.Should().BeTrue();          // core committed
        j.CompanyId.Should().NotBeNullOrEmpty();
        (await Coll<Companies>("Companies").CountDocumentsAsync(c => c.OwnerId == userId)).Should().Be(1);
        (await Coll<Phase4CapTable>("Phase4CapTables").CountDocumentsAsync(c => c.CompanyId == j.CompanyId))
            .Should().Be(0);                                        // no cap table, core intact
    }
}
