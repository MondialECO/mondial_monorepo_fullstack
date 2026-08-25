using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
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
using WebApp.Models.DatabaseModels.Ai;
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
    private CreatorPhase6Controller BuildController(string userId, string ideaId, long expectedVersion, MongoDbContext? contextOverride = null)
    {
        var scope = Sp.CreateScope();
        var ctx = contextOverride ?? scope.ServiceProvider.GetRequiredService<MongoDbContext>();
        var controller = new CreatorPhase6Controller(
            scope.ServiceProvider.GetRequiredService<ICreatorJourneyService>(),
            scope.ServiceProvider.GetRequiredService<ISmartMatchingService>(),
            ctx,
            scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>(),
            scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>(),
            scope.ServiceProvider.GetRequiredService<IDealEventPublisher>(),
            scope.ServiceProvider.GetRequiredService<ICompanyService>(),
            scope.ServiceProvider.GetRequiredService<WebApp.Services.Repository.ICreatorIdeaStore>(),
            scope.ServiceProvider.GetRequiredService<IMongoClient>(),
            scope.ServiceProvider.GetRequiredService<IConfiguration>(),
            scope.ServiceProvider.GetRequiredService<IHostEnvironment>(),
            NullLogger<CreatorPhase6Controller>.Instance);

        var http = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId)
            }, "test"))
        };
        var queryDict = new Dictionary<string, Microsoft.Extensions.Primitives.StringValues>
        {
            { "ideaId", ideaId },
            { "expectedVersion", expectedVersion.ToString() }
        };
        http.Request.Query = new QueryCollection(queryDict);
        http.Request.QueryString = new QueryString($"?ideaId={ideaId}&expectedVersion={expectedVersion}");
        controller.ControllerContext = new ControllerContext { HttpContext = http };
        return controller;
    }

    // Seed a user + a build-path journey with seed funding + ownership (cap-table plan),
    // and ensure the Entrepreneur role exists. Returns the userId (Guid string).
    private async Task<(string UserId, string IdeaId)> SeedBuildPathUserAsync(bool withOwnership = true)
    {
        using var scope = Sp.CreateScope();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roles = scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>();
        var journeys = scope.ServiceProvider.GetRequiredService<ICreatorJourneyService>();
        var ideas = scope.ServiceProvider.GetRequiredService<ICreatorIdeaService>();

        if (await roles.FindByNameAsync("Entrepreneur") == null)
            await roles.CreateAsync(new ApplicationRole { Name = "Entrepreneur", Description = "Entrepreneur" });

        var user = new ApplicationUser
        {
            UserName = $"u{Guid.NewGuid():N}@test.com", Email = $"u{Guid.NewGuid():N}@test.com", Name = "Test",
            Onboarding = new OnboardingState { Phase = 1 },
        };
        (await users.CreateAsync(user, "Passw0rd!Passw0rd!")).Succeeded.Should().BeTrue();
        var userId = user.Id.ToString();

        await journeys.GetOrCreateAsync(userId);
        var idea = await ideas.CreateIdeaAsync(userId);
        var planId = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
        var forecastId = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
        await Coll<BusinessPlanSession>("BusinessPlanSessions").InsertOneAsync(new BusinessPlanSession
        {
            Id = planId, OwnerUserId = userId, BusinessIdeaId = idea.Id, ClarifierSessionId = MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
            Status = "Completed", CurrentVersion = 1,
            Versions = new() { new BusinessPlanVersion { Version = 1, Content = new MongoDB.Bson.BsonDocument("test", true), GeneratedContent = new MongoDB.Bson.BsonDocument("test", true) } },
        });
        await Coll<ForecastSession>("ForecastSessions").InsertOneAsync(new ForecastSession
        {
            Id = forecastId, OwnerUserId = userId, BusinessIdeaId = idea.Id, BusinessPlanSessionId = planId,
            Status = "Completed", CurrentVersion = 1,
            Versions = new() { new ForecastVersion { Version = 1, Content = new MongoDB.Bson.BsonDocument("test", true), GeneratedContent = new MongoDB.Bson.BsonDocument("test", true) } },
        });
        idea.Project = new CreatorJourneyProject
        {
            Name = "Transaction test idea", Problem = "Problem", TargetUser = "User", Solution = "Solution", ClarityScore = 80,
            Branding = new CreatorBranding { BrandingMethod = "designer" },
        };
        idea.Phase3Data = new CreatorPhase3Data
        {
            BusinessPlanSessionId = planId, ForecastSessionId = forecastId,
            FormationGenerator = new CreatorFormationGenerator { SelectedType = "SAS" },
        };
        idea.Phase4Data = new CreatorPhase4Data
        {
            PricingModel = "subscription",
            Tiers = new() { new CreatorPricingTier { Name = "Starter" }, new CreatorPricingTier { Name = "Growth" }, new CreatorPricingTier { Name = "Scale" } },
            ResourceCalculation = new CreatorResourceCalculation { MonthlyRunningCost = 2_000 },
            GtmSetup = new CreatorGtmSetup(),
        };
        idea.Phase5Data = new CreatorPhase5Data
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
        await Coll<CreatorIdea>("CreatorIdeas").ReplaceOneAsync(x => x.Id == idea.Id && x.UserId == userId, idea);
        return (userId, idea.Id);
    }

    private IMongoCollection<T> Coll<T>(string name) =>
        Sp.GetRequiredService<IMongoDatabase>().GetCollection<T>(name);

    private T GetScoped<T>() where T : notnull => Sp.CreateScope().ServiceProvider.GetRequiredService<T>();

    [SkippableFact]
    public async Task Abort_rolls_back_everything_and_clean_retry_succeeds_once()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var (userId, ideaId) = await SeedBuildPathUserAsync();
        var userGuid = Guid.Parse(userId);

        // ---- 1) Forced mid-transaction failure (user write throws after company + journey) ----
        var faultCtx = new FaultUserWriteMongoDbContext(GetScoped<IMongoDatabase>(), ThrowingUserCollection());
        var faulted = BuildController(userId, ideaId, 1, faultCtx);
        var aborted = await faulted.LevelUp(ideaId);

        // #6 endpoint returned an error (500), not success.
        aborted.Should().BeOfType<ObjectResult>();
        ((ObjectResult)aborted).StatusCode.Should().Be(500);

        // #1 no company, #2 no profile, #5 no entrepreneur role, #3/#4 journey flag/companyId unset.
        (await Coll<Companies>("Companies").CountDocumentsAsync(c => c.OwnerId == userId)).Should().Be(0);
        (await Coll<EntrepreneurProfileRecord>("EntrepreneurProfiles").CountDocumentsAsync(p => p.UserId == userId)).Should().Be(0);

        var journeys = GetScoped<ICreatorJourneyService>();
        var j = await journeys.GetOrCreateAsync(userId);
        j.Phase6Data?.LevelUpTriggered.Should().NotBe(true);   // #3 — THE key assertion
        string.IsNullOrEmpty(j.CompanyId).Should().BeTrue();    // #4

        var user = (await GetScoped<UserManager<ApplicationUser>>().FindByIdAsync(userId))!;
        var entRoleId = (await GetScoped<RoleManager<ApplicationRole>>().FindByNameAsync("Entrepreneur"))!.Id;
        (user.Roles ?? new List<Guid>()).Should().NotContain(entRoleId); // #5

        // ---- 7) Clean retry (no fault) succeeds fully, exactly once ----
        var ok = await BuildController(userId, ideaId, 1).LevelUp(ideaId);
        ok.Should().BeOfType<OkObjectResult>();

        (await Coll<Companies>("Companies").CountDocumentsAsync(c => c.OwnerId == userId)).Should().Be(1);
        (await Coll<EntrepreneurProfileRecord>("EntrepreneurProfiles").CountDocumentsAsync(p => p.UserId == userId)).Should().Be(1);
        var j2 = await journeys.GetOrCreateAsync(userId);
        j2.Phase6Data!.LevelUpTriggered.Should().BeTrue();
        j2.CompanyId.Should().NotBeNullOrEmpty();
        var user2 = (await GetScoped<UserManager<ApplicationUser>>().FindByIdAsync(userId))!;
        user2.Roles.Should().Contain(entRoleId);
    }

    [SkippableFact]
    public async Task Happy_path_commits_once_with_cap_table_seeded()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var (userId, ideaId) = await SeedBuildPathUserAsync(withOwnership: true);
        var result = await BuildController(userId, ideaId, 1).LevelUp(ideaId);
        result.Should().BeOfType<OkObjectResult>();

        (await Coll<Companies>("Companies").CountDocumentsAsync(c => c.OwnerId == userId)).Should().Be(1);
        (await Coll<EntrepreneurProfileRecord>("EntrepreneurProfiles").CountDocumentsAsync(p => p.UserId == userId)).Should().Be(1);

        var journeys = GetScoped<ICreatorJourneyService>();
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

        var (userId, ideaId) = await SeedBuildPathUserAsync();
        (await BuildController(userId, ideaId, 1).LevelUp(ideaId)).Should().BeOfType<OkObjectResult>();
        // Second call hits the fast-path idempotency guard (already triggered).
        (await BuildController(userId, ideaId, 2).LevelUp(ideaId)).Should().BeOfType<OkObjectResult>();

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
        var (userId, ideaId) = await SeedBuildPathUserAsync(withOwnership: false);
        var result = await BuildController(userId, ideaId, 1).LevelUp(ideaId);
        result.Should().BeOfType<OkObjectResult>();

        var journeys = GetScoped<ICreatorJourneyService>();
        var j = await journeys.GetOrCreateAsync(userId);
        j.Phase6Data!.LevelUpTriggered.Should().BeTrue();          // core committed
        j.CompanyId.Should().NotBeNullOrEmpty();
        (await Coll<Companies>("Companies").CountDocumentsAsync(c => c.OwnerId == userId)).Should().Be(1);
        (await Coll<Phase4CapTable>("Phase4CapTables").CountDocumentsAsync(c => c.CompanyId == j.CompanyId))
            .Should().Be(0);                                        // no cap table, core intact
    }
}
