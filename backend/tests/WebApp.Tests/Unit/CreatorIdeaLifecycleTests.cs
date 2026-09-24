using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using MongoDB.Driver;
using Moq;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using WebApp.DbContext;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class CreatorIdeaLifecycleTests
    {
        private class TestHarness
        {
            public InMemoryCreatorIdeaStore IdeaStore { get; } = new();
            public ConcurrentDictionary<string, CreatorJourney> JourneysDb { get; } = new();
            public Mock<UserManager<ApplicationUser>> UserManagerMock { get; }
            public Mock<IMongoCollection<CreatorJourney>> JourneysCollectionMock { get; }
            public CreatorJourneyService JourneyService { get; }
            public CreatorDashboardService DashboardService { get; }

            public TestHarness(int userOnboardingPhase = 1)
            {
                var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
                UserManagerMock = new Mock<UserManager<ApplicationUser>>(userStoreMock.Object, null!, null!, null!, null!, null!, null!, null!, null!);

                UserManagerMock.Setup(u => u.FindByIdAsync(It.IsAny<string>()))
                    .ReturnsAsync((string uid) => new ApplicationUser
                    {
                        Id = Guid.NewGuid(),
                        UserName = uid,
                        Onboarding = new OnboardingState { Phase = userOnboardingPhase }
                    });

                var dbMock = new Mock<IMongoDatabase>();
                JourneysCollectionMock = new Mock<IMongoCollection<CreatorJourney>>();

                JourneysCollectionMock.Setup(c => c.FindAsync(
                    It.IsAny<FilterDefinition<CreatorJourney>>(),
                    It.IsAny<FindOptions<CreatorJourney, CreatorJourney>>(),
                    It.IsAny<CancellationToken>()))
                    .ReturnsAsync((FilterDefinition<CreatorJourney> f, FindOptions<CreatorJourney, CreatorJourney> opt, CancellationToken ct) =>
                    {
                        string? targetUserId = null;
                        try
                        {
                            var serializerRegistry = MongoDB.Bson.Serialization.BsonSerializer.SerializerRegistry;
                            var documentSerializer = serializerRegistry.GetSerializer<CreatorJourney>();
                            var rendered = f.Render(new MongoDB.Driver.RenderArgs<CreatorJourney>(documentSerializer, serializerRegistry));
                            if (rendered.Contains("UserId"))
                            {
                                targetUserId = rendered["UserId"].AsString;
                            }
                        }
                        catch { }

                        List<CreatorJourney> items;
                        if (targetUserId != null && JourneysDb.TryGetValue(targetUserId, out var j))
                        {
                            items = new List<CreatorJourney> { j };
                        }
                        else if (targetUserId != null)
                        {
                            items = new List<CreatorJourney>();
                        }
                        else
                        {
                            items = JourneysDb.Values.ToList();
                        }

                        var cursorMock = new Mock<IAsyncCursor<CreatorJourney>>();
                        cursorMock.Setup(c => c.Current).Returns(items);
                        cursorMock.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(items.Any()).Returns(false);
                        cursorMock.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(items.Any()).ReturnsAsync(false);
                        return cursorMock.Object;
                    });

                JourneysCollectionMock.Setup(c => c.InsertOneAsync(
                    It.IsAny<CreatorJourney>(),
                    It.IsAny<InsertOneOptions>(),
                    It.IsAny<CancellationToken>()))
                    .Callback<CreatorJourney, InsertOneOptions, CancellationToken>((j, opt, ct) =>
                    {
                        JourneysDb[j.UserId] = j;
                    })
                    .Returns(Task.CompletedTask);

                JourneysCollectionMock.Setup(c => c.ReplaceOneAsync(
                    It.IsAny<FilterDefinition<CreatorJourney>>(),
                    It.IsAny<CreatorJourney>(),
                    It.IsAny<ReplaceOptions>(),
                    It.IsAny<CancellationToken>()))
                    .Callback<FilterDefinition<CreatorJourney>, CreatorJourney, ReplaceOptions, CancellationToken>((filter, journey, opts, ct) =>
                    {
                        JourneysDb[journey.UserId] = journey;
                    })
                    .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

                JourneysCollectionMock.Setup(c => c.UpdateOneAsync(
                    It.IsAny<FilterDefinition<CreatorJourney>>(),
                    It.IsAny<UpdateDefinition<CreatorJourney>>(),
                    It.IsAny<UpdateOptions>(),
                    It.IsAny<CancellationToken>()))
                    .ReturnsAsync(new UpdateResult.Acknowledged(1, 1, null));

                dbMock.Setup(d => d.GetCollection<CreatorJourney>("CreatorJourneys", null))
                    .Returns(JourneysCollectionMock.Object);

                var context = new MongoDbContext(dbMock.Object);

                JourneyService = new CreatorJourneyService(
                    context,
                    Mock.Of<IBusinessPlanSessionStore>(),
                    Mock.Of<IForecastSessionStore>(),
                    IdeaStore,
                    Mock.Of<IClarifierSessionStore>(),
                    null,
                    null,
                    null,
                    null,
                    UserManagerMock.Object);

                DashboardService = new CreatorDashboardService(
                    JourneyService,
                    IdeaStore,
                    Mock.Of<IBrandKitStore>(),
                    Mock.Of<IProfessionalProfileStore>(),
                    UserManagerMock.Object);
            }
        }

        public class InMemoryCreatorIdeaStore : ICreatorIdeaStore
        {
            public List<CreatorIdea> Ideas { get; } = new();

            public Task AddAsync(CreatorIdea idea)
            {
                lock (Ideas) { Ideas.Add(idea); }
                return Task.CompletedTask;
            }

            public Task<CreatorIdea?> GetOwnedAsync(string ideaId, string ownerUserId)
            {
                lock (Ideas)
                {
                    var idea = Ideas.FirstOrDefault(i => i.Id == ideaId && i.UserId == ownerUserId);
                    return Task.FromResult(idea);
                }
            }

            public Task<List<CreatorIdea>> ListByUserAsync(string ownerUserId)
            {
                lock (Ideas)
                {
                    var list = Ideas.Where(i => i.UserId == ownerUserId).OrderByDescending(i => i.UpdatedAt).ToList();
                    return Task.FromResult(list);
                }
            }

            public Task<CreatorIdea?> GetByClarifierAsync(string clarifierSessionId, string ownerUserId) => Task.FromResult<CreatorIdea?>(null);
            public Task<CreatorIdea?> GetByBusinessPlanAsync(string businessPlanSessionId, string ownerUserId) => Task.FromResult<CreatorIdea?>(null);
            public Task TouchAsync(string ideaId, string ownerUserId) => Task.CompletedTask;
            public Task SetOutputSnapshotsAsync(string ideaId, string ownerUserId, CreatorOutputSnapshots snapshots) => Task.CompletedTask;
            public Task<bool> UpdateAsync(string ideaId, string ownerUserId, UpdateDefinition<CreatorIdea> update, long? expectedVersion = null, IClientSessionHandle? session = null) => Task.FromResult(true);
            public Task<bool> SyncBrandKitSummaryAsync(string ideaId, string ownerUserId, string brandingMethod, string logoAsset, string paletteName, string typographyPairing, string? brandKitId = null, int? brandKitVersion = null, DateTime? syncedAt = null, IClientSessionHandle? session = null) => Task.FromResult(true);
        }

        // Scenario 1: New Creator opens Dashboard -> CreatorIdeas count = 0, ActiveIdeaId = null
        [Fact]
        public async Task Scenario1_NewCreator_OpensDashboard_ZeroIdeas_ActiveIdeaIdNull()
        {
            var harness = new TestHarness(userOnboardingPhase: 1);
            var userId = "new-creator-s1";

            // Initialize a blank journey in memory
            harness.JourneysDb[userId] = new CreatorJourney { UserId = userId, ActiveIdeaId = null, BusinessIdeaId = null };

            var summary = await harness.DashboardService.GetSummaryAsync(userId);

            summary.Should().NotBeNull();
            harness.IdeaStore.Ideas.Should().BeEmpty();
            summary.Project.Id.Should().BeEmpty();
            summary.NextAction.Should().NotBeNull();
            summary.NextAction.Href.Should().Be("/dashboard/creator/phase-2/clarifier");
            summary.NextAction.Href.Should().NotContain("?ideaId=");
        }

        // Scenario 2: Reload Dashboard multiple times -> CreatorIdeas remains 0, no business-state write caused by GET
        [Fact]
        public async Task Scenario2_ReloadDashboardMultipleTimes_CreatorIdeasRemainsZero_NoMutation()
        {
            var harness = new TestHarness(userOnboardingPhase: 1);
            var userId = "new-creator-s2";
            harness.JourneysDb[userId] = new CreatorJourney { UserId = userId, ActiveIdeaId = null, BusinessIdeaId = null };

            for (int i = 0; i < 5; i++)
            {
                var summary = await harness.DashboardService.GetSummaryAsync(userId);
                summary.Should().NotBeNull();
            }

            harness.IdeaStore.Ideas.Should().BeEmpty("GET operations on Dashboard must NEVER insert an idea");
            harness.JourneysDb[userId].ActiveIdeaId.Should().BeNull("Dashboard reads must not mutate ActiveIdeaId");
        }

        // Scenario 3: Phase 1 incomplete -> Dashboard Next Action points to Phase 1, Clarifier init returns 403, 0 ideas created
        [Fact]
        public async Task Scenario3_Phase1Incomplete_DashboardPointsToPhase1_ClarifierInitThrows403_ZeroIdeas()
        {
            var harness = new TestHarness(userOnboardingPhase: 0); // Onboarding.Phase = 0
            var userId = "unverified-creator-s3";
            harness.JourneysDb[userId] = new CreatorJourney { UserId = userId, ActiveIdeaId = null, BusinessIdeaId = null };

            var summary = await harness.DashboardService.GetSummaryAsync(userId);
            summary.NextAction.Phase.Should().Be(1);
            summary.NextAction.Href.Should().Be("/dashboard/creator/phase-1");

            // Attempting to initialize Clarifier must fail with 403
            var act = async () => await harness.JourneyService.GetOrCreateClarifierIdeaAsync(userId);
            var ex = await act.Should().ThrowAsync<CreatorJourneyException>();
            ex.Which.StatusCode.Should().Be(403);

            harness.IdeaStore.Ideas.Should().BeEmpty();
        }

        // Scenario 4: Phase 1 complete + zero ideas -> Dashboard CTA = /dashboard/creator/phase-2/clarifier (without ?ideaId=)
        [Fact]
        public async Task Scenario4_Phase1Complete_ZeroIdeas_DashboardCta_PointsToClarifierWithoutIdeaId()
        {
            var harness = new TestHarness(userOnboardingPhase: 1);
            var userId = "verified-creator-s4";
            harness.JourneysDb[userId] = new CreatorJourney { UserId = userId, ActiveIdeaId = null, BusinessIdeaId = null };

            var summary = await harness.DashboardService.GetSummaryAsync(userId);
            summary.NextAction.Phase.Should().Be(2);
            summary.NextAction.Href.Should().Be("/dashboard/creator/phase-2/clarifier");
            summary.NextAction.Href.Should().NotContain("?ideaId=");
            harness.IdeaStore.Ideas.Should().BeEmpty();
        }

        // Scenario 5: First Clarifier entry -> exactly ONE CreatorIdea created, correct UserId, ActiveIdeaId set correctly
        [Fact]
        public async Task Scenario5_FirstClarifierEntry_CreatesExactlyOneIdea_SetsUserIdAndActiveIdeaId()
        {
            var harness = new TestHarness(userOnboardingPhase: 1);
            var userId = "creator-s5";
            harness.JourneysDb[userId] = new CreatorJourney { UserId = userId, ActiveIdeaId = null, BusinessIdeaId = null };

            var idea = await harness.JourneyService.GetOrCreateClarifierIdeaAsync(userId);

            idea.Should().NotBeNull();
            idea.UserId.Should().Be(userId);
            harness.IdeaStore.Ideas.Should().HaveCount(1);
            harness.JourneysDb[userId].ActiveIdeaId.Should().Be(idea.Id);
        }

        // Scenario 6: Refresh Clarifier -> same idea reused, no second CreatorIdea
        [Fact]
        public async Task Scenario6_RefreshClarifier_ReusesSameIdea_NoSecondIdea()
        {
            var harness = new TestHarness(userOnboardingPhase: 1);
            var userId = "creator-s6";
            harness.JourneysDb[userId] = new CreatorJourney { UserId = userId, ActiveIdeaId = null, BusinessIdeaId = null };

            var firstIdea = await harness.JourneyService.GetOrCreateClarifierIdeaAsync(userId);
            var refreshedIdea = await harness.JourneyService.GetOrCreateClarifierIdeaAsync(userId);

            refreshedIdea.Id.Should().Be(firstIdea.Id);
            harness.IdeaStore.Ideas.Should().HaveCount(1);
        }

        // Scenario 7: Leave and re-enter Clarifier -> same active idea reused
        [Fact]
        public async Task Scenario7_LeaveAndReenterClarifier_ReusesSameIdea()
        {
            var harness = new TestHarness(userOnboardingPhase: 1);
            var userId = "creator-s7";
            harness.JourneysDb[userId] = new CreatorJourney { UserId = userId, ActiveIdeaId = null, BusinessIdeaId = null };

            var first = await harness.JourneyService.GetOrCreateClarifierIdeaAsync(userId);

            // Re-read dashboard
            var summary = await harness.DashboardService.GetSummaryAsync(userId);
            summary.Project.Id.Should().Be(first.Id);

            // Re-enter clarifier
            var reentered = await harness.JourneyService.GetOrCreateClarifierIdeaAsync(userId);
            reentered.Id.Should().Be(first.Id);
            harness.IdeaStore.Ideas.Should().HaveCount(1);
        }

        // Scenario 8: Existing Creator with active idea -> existing idea reused, no new idea
        [Fact]
        public async Task Scenario8_ExistingCreatorWithActiveIdea_ReusedWithoutCreatingNew()
        {
            var harness = new TestHarness(userOnboardingPhase: 1);
            var userId = "creator-s8";
            var existingIdea = new CreatorIdea
            {
                Id = "existing-idea-123",
                UserId = userId,
                Project = new CreatorJourneyProject { Name = "Existing Project" }
            };
            harness.IdeaStore.Ideas.Add(existingIdea);
            harness.JourneysDb[userId] = new CreatorJourney { UserId = userId, ActiveIdeaId = existingIdea.Id, BusinessIdeaId = existingIdea.Id };

            var resolved = await harness.JourneyService.GetOrCreateClarifierIdeaAsync(userId);
            resolved.Id.Should().Be("existing-idea-123");
            harness.IdeaStore.Ideas.Should().HaveCount(1);
        }

        // Scenario 9: Foreign ideaId -> rejected by backend ownership validation, no cross-account data exposed
        [Fact]
        public async Task Scenario9_ForeignIdeaId_RejectedByOwnershipValidation()
        {
            var harness = new TestHarness(userOnboardingPhase: 1);
            var userA = "creator-user-a";
            var userB = "creator-user-b";

            var foreignIdea = new CreatorIdea
            {
                Id = "foreign-idea-xyz",
                UserId = userB,
                Project = new CreatorJourneyProject { Name = "User B Secret Project" }
            };
            harness.IdeaStore.Ideas.Add(foreignIdea);

            // User A attempts to read User B's idea
            var act = async () => await harness.JourneyService.TryResolveIdeaAsync(userA, foreignIdea.Id);
            var ex = await act.Should().ThrowAsync<CreatorJourneyException>();
            ex.Which.StatusCode.Should().Be(403);
        }

        // Scenario 10: Logout / account switch -> isolation
        [Fact]
        public async Task Scenario10_AccountSwitch_MaintainsTotalIsolation()
        {
            var harness = new TestHarness(userOnboardingPhase: 1);
            var userA = "creator-user-a";
            var userB = "creator-user-b";

            harness.JourneysDb[userA] = new CreatorJourney { UserId = userA, ActiveIdeaId = null, BusinessIdeaId = null };
            harness.JourneysDb[userB] = new CreatorJourney { UserId = userB, ActiveIdeaId = null, BusinessIdeaId = null };

            // User A creates idea
            var ideaA = await harness.JourneyService.GetOrCreateClarifierIdeaAsync(userA);

            // User B logs in (brand new)
            var summaryB = await harness.DashboardService.GetSummaryAsync(userB);
            summaryB.Project.Id.Should().BeEmpty();
            summaryB.NextAction.Href.Should().NotContain(ideaA.Id);

            var ideaB = await harness.JourneyService.GetOrCreateClarifierIdeaAsync(userB);
            ideaB.Id.Should().NotBe(ideaA.Id);
            ideaB.UserId.Should().Be(userB);
            harness.IdeaStore.Ideas.Should().HaveCount(2);
        }

        // Scenario 11: CONCURRENT INITIALIZATION -> fire multiple Clarifier initialize requests concurrently
        [Fact]
        public async Task Scenario11_ConcurrentClarifierInitialization_ResolvesToSameIdea_CreatesExactlyOne()
        {
            var harness = new TestHarness(userOnboardingPhase: 1);
            var userId = "concurrent-creator-s11";
            harness.JourneysDb[userId] = new CreatorJourney { UserId = userId, ActiveIdeaId = null, BusinessIdeaId = null };

            // Fire 10 concurrent initialize calls
            var tasks = Enumerable.Range(0, 10).Select(_ => harness.JourneyService.GetOrCreateClarifierIdeaAsync(userId));
            var results = await Task.WhenAll(tasks);

            var firstId = results[0].Id;
            foreach (var res in results)
            {
                res.Id.Should().Be(firstId, "All concurrent requests must resolve to the identical idea ID");
            }

            harness.IdeaStore.Ideas.Should().HaveCount(1, "Exactly ONE CreatorIdea must be created under concurrency");
            harness.JourneysDb[userId].ActiveIdeaId.Should().Be(firstId);
        }

        // Scenario 12: Stale/invalid ActiveIdeaId -> never silently reuses foreign/non-owned idea
        [Fact]
        public async Task Scenario12_StaleOrForeignActiveIdeaId_ReconcilesCleanly_DoesNotLeak()
        {
            var harness = new TestHarness(userOnboardingPhase: 1);
            var userA = "creator-user-a";
            var userB = "creator-user-b";

            var userBIdea = new CreatorIdea
            {
                Id = "user-b-idea",
                UserId = userB,
                Project = new CreatorJourneyProject { Name = "User B Project" }
            };
            harness.IdeaStore.Ideas.Add(userBIdea);

            // Corrupted or stale pointer on User A's journey pointing to User B's idea
            harness.JourneysDb[userA] = new CreatorJourney { UserId = userA, ActiveIdeaId = userBIdea.Id, BusinessIdeaId = userBIdea.Id };

            // Resolve for User A must NOT return User B's idea
            var resolvedIdea = await harness.JourneyService.TryResolveIdeaAsync(userA);
            resolvedIdea.Should().BeNull("Stale or foreign active idea ID must not be returned");

            // Calling Clarifier init for User A must mint User A's own idea rather than trusting the foreign pointer
            var userAIdea = await harness.JourneyService.GetOrCreateClarifierIdeaAsync(userA);
            userAIdea.UserId.Should().Be(userA);
            userAIdea.Id.Should().NotBe(userBIdea.Id);
        }
    }
}
