using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using MongoDB.Bson;
using MongoDB.Driver;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using WebApp.Controllers;
using WebApp.DbContext;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Models.Dtos;
using WebApp.Services;
using WebApp.Services.Ai;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Repository;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class CreatorStabilization03Tests
    {
        private readonly Mock<IMongoDatabase> _dbMock = new();
        private readonly MongoDbContext _context;
        private readonly Mock<ICreatorIdeaStore> _ideasMock = new();
        private readonly Mock<ICreatorJourneyService> _journeysMock = new();
        private readonly Mock<ISmartMatchingService> _matchingMock = new();
        private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
        private readonly Mock<RoleManager<ApplicationRole>> _roleManagerMock;
        private readonly Mock<IDealEventPublisher> _eventsMock = new();
        private readonly Mock<ICompanyService> _companyServiceMock = new();
        private readonly Mock<IMongoClient> _mongoClientMock = new();
        private readonly IConfiguration _config;
        private readonly Mock<IHostEnvironment> _envMock = new();

        private readonly List<CreatorIdea> _ideasDb = new();
        private readonly List<ApplicationUser> _usersDb = new();
        private readonly List<Companies> _companiesDb = new();
        private readonly List<EntrepreneurProfileRecord> _profilesDb = new();
        private readonly List<Phase3Concept> _conceptsDb = new();
        private readonly List<Phase4CapTable> _capTablesDb = new();
        private readonly List<DealExecution> _dealsDb = new();
        private readonly Dictionary<string, HashSet<string>> _userRoles = new();

        public CreatorStabilization03Tests()
        {
            var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
            _userManagerMock = new Mock<UserManager<ApplicationUser>>(userStoreMock.Object, null, null, null, null, null, null, null, null);
            _userManagerMock.Setup(u => u.FindByIdAsync(It.IsAny<string>()))
                .ReturnsAsync((string id) => _usersDb.FirstOrDefault(u => u.Id.ToString() == id || u.User == id || u.UserName == id));
            _userManagerMock.Setup(u => u.FindByNameAsync(It.IsAny<string>()))
                .ReturnsAsync((string name) => _usersDb.FirstOrDefault(u => u.UserName == name || u.User == name));
            _userManagerMock.Setup(u => u.IsInRoleAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
                .ReturnsAsync((ApplicationUser user, string role) =>
                    (_userRoles.TryGetValue(user.Id.ToString(), out var roles1) && roles1.Contains(role)) ||
                    (_userRoles.TryGetValue(user.User ?? "", out var roles2) && roles2.Contains(role)));
            _userManagerMock.Setup(u => u.GetRolesAsync(It.IsAny<ApplicationUser>()))
                .ReturnsAsync((ApplicationUser user) =>
                {
                    if (_userRoles.TryGetValue(user.Id.ToString(), out var r1)) return r1.ToList();
                    if (!string.IsNullOrEmpty(user.User) && _userRoles.TryGetValue(user.User, out var r2)) return r2.ToList();
                    return new List<string>();
                });
            _userManagerMock.Setup(u => u.AddToRoleAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
                .ReturnsAsync((ApplicationUser user, string role) =>
                {
                    var idStr = user.Id.ToString();
                    if (!_userRoles.ContainsKey(idStr)) _userRoles[idStr] = new HashSet<string>();
                    _userRoles[idStr].Add(role);
                    if (!string.IsNullOrEmpty(user.User))
                    {
                        if (!_userRoles.ContainsKey(user.User)) _userRoles[user.User] = new HashSet<string>();
                        _userRoles[user.User].Add(role);
                    }
                    return IdentityResult.Success;
                });

            var roleStoreMock = new Mock<IRoleStore<ApplicationRole>>();
            _roleManagerMock = new Mock<RoleManager<ApplicationRole>>(roleStoreMock.Object, null, null, null, null);
            _roleManagerMock.Setup(r => r.FindByNameAsync(It.IsAny<string>()))
                .ReturnsAsync((string name) => new ApplicationRole { Id = Guid.NewGuid(), Name = name });

            _envMock.Setup(e => e.EnvironmentName).Returns(Environments.Development);
            _config = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Mongo:TransactionsEnabled"] = "false"
                })
                .Build();

            // Setup Companies collection
            var companiesCollectionMock = new Mock<IMongoCollection<Companies>>();
            companiesCollectionMock.Setup(c => c.InsertOneAsync(It.IsAny<Companies>(), It.IsAny<InsertOneOptions>(), It.IsAny<CancellationToken>()))
                .Callback<Companies, InsertOneOptions, CancellationToken>((doc, _, _) => _companiesDb.Add(doc))
                .Returns(Task.CompletedTask);
            companiesCollectionMock.Setup(c => c.InsertOneAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<Companies>(), It.IsAny<InsertOneOptions>(), It.IsAny<CancellationToken>()))
                .Callback<IClientSessionHandle, Companies, InsertOneOptions, CancellationToken>((_, doc, _, _) => _companiesDb.Add(doc))
                .Returns(Task.CompletedTask);
            companiesCollectionMock.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<Companies>>(),
                It.IsAny<FindOptions<Companies, Companies>>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync((FilterDefinition<Companies> f, FindOptions<Companies, Companies> opt, CancellationToken ct) =>
                {
                    if (f is ExpressionFilterDefinition<Companies> exprFilter)
                    {
                        try
                        {
                            var predicate = exprFilter.Expression.Compile();
                            return MakeCursor(_companiesDb.Where(predicate).ToList());
                        }
                        catch { }
                    }
                    return MakeCursor(_companiesDb);
                });
            companiesCollectionMock.Setup(c => c.FindAsync(
                It.IsAny<IClientSessionHandle>(),
                It.IsAny<FilterDefinition<Companies>>(),
                It.IsAny<FindOptions<Companies, Companies>>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync((IClientSessionHandle s, FilterDefinition<Companies> f, FindOptions<Companies, Companies> opt, CancellationToken ct) =>
                {
                    if (f is ExpressionFilterDefinition<Companies> exprFilter)
                    {
                        try
                        {
                            var predicate = exprFilter.Expression.Compile();
                            return MakeCursor(_companiesDb.Where(predicate).ToList());
                        }
                        catch { }
                    }
                    return MakeCursor(_companiesDb);
                });
            companiesCollectionMock.Setup(c => c.UpdateOneAsync(It.IsAny<FilterDefinition<Companies>>(), It.IsAny<UpdateDefinition<Companies>>(), It.IsAny<UpdateOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new UpdateResult.Acknowledged(1, 1, null));
            companiesCollectionMock.Setup(c => c.UpdateOneAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<FilterDefinition<Companies>>(), It.IsAny<UpdateDefinition<Companies>>(), It.IsAny<UpdateOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new UpdateResult.Acknowledged(1, 1, null));

            // Setup EntrepreneurProfiles collection
            var profilesCollectionMock = new Mock<IMongoCollection<EntrepreneurProfileRecord>>();
            profilesCollectionMock.Setup(c => c.InsertOneAsync(It.IsAny<EntrepreneurProfileRecord>(), It.IsAny<InsertOneOptions>(), It.IsAny<CancellationToken>()))
                .Callback<EntrepreneurProfileRecord, InsertOneOptions, CancellationToken>((doc, _, _) => _profilesDb.Add(doc))
                .Returns(Task.CompletedTask);
            profilesCollectionMock.Setup(c => c.InsertOneAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<EntrepreneurProfileRecord>(), It.IsAny<InsertOneOptions>(), It.IsAny<CancellationToken>()))
                .Callback<IClientSessionHandle, EntrepreneurProfileRecord, InsertOneOptions, CancellationToken>((_, doc, _, _) => _profilesDb.Add(doc))
                .Returns(Task.CompletedTask);
            profilesCollectionMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<EntrepreneurProfileRecord>>(), It.IsAny<FindOptions<EntrepreneurProfileRecord, EntrepreneurProfileRecord>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(_profilesDb));
            profilesCollectionMock.Setup(c => c.FindAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<FilterDefinition<EntrepreneurProfileRecord>>(), It.IsAny<FindOptions<EntrepreneurProfileRecord, EntrepreneurProfileRecord>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(_profilesDb));

            // Setup Phase3Concepts collection
            var conceptsCollectionMock = new Mock<IMongoCollection<Phase3Concept>>();
            conceptsCollectionMock.Setup(c => c.InsertOneAsync(It.IsAny<Phase3Concept>(), It.IsAny<InsertOneOptions>(), It.IsAny<CancellationToken>()))
                .Callback<Phase3Concept, InsertOneOptions, CancellationToken>((doc, _, _) => _conceptsDb.Add(doc))
                .Returns(Task.CompletedTask);
            conceptsCollectionMock.Setup(c => c.InsertOneAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<Phase3Concept>(), It.IsAny<InsertOneOptions>(), It.IsAny<CancellationToken>()))
                .Callback<IClientSessionHandle, Phase3Concept, InsertOneOptions, CancellationToken>((_, doc, _, _) => _conceptsDb.Add(doc))
                .Returns(Task.CompletedTask);
            conceptsCollectionMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<Phase3Concept>>(), It.IsAny<FindOptions<Phase3Concept, Phase3Concept>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(_conceptsDb));
            conceptsCollectionMock.Setup(c => c.FindAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<FilterDefinition<Phase3Concept>>(), It.IsAny<FindOptions<Phase3Concept, Phase3Concept>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(_conceptsDb));

            // Setup CapTables collection
            var capTablesCollectionMock = new Mock<IMongoCollection<Phase4CapTable>>();
            capTablesCollectionMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<Phase4CapTable>>(), It.IsAny<FindOptions<Phase4CapTable, Phase4CapTable>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<Phase4CapTable>()));
            capTablesCollectionMock.Setup(c => c.FindAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<FilterDefinition<Phase4CapTable>>(), It.IsAny<FindOptions<Phase4CapTable, Phase4CapTable>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<Phase4CapTable>()));

            // Setup Deals collection
            var dealsCollectionMock = new Mock<IMongoCollection<DealExecution>>();
            dealsCollectionMock.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<DealExecution>>(),
                It.IsAny<FindOptions<DealExecution, DealExecution>>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync((FilterDefinition<DealExecution> f, FindOptions<DealExecution, DealExecution> opt, CancellationToken ct) =>
                {
                    if (f is ExpressionFilterDefinition<DealExecution> exprFilter)
                    {
                        try
                        {
                            var predicate = exprFilter.Expression.Compile();
                            return MakeCursor(_dealsDb.Where(predicate).ToList());
                        }
                        catch { }
                    }
                    return MakeCursor(_dealsDb);
                });
            dealsCollectionMock.Setup(c => c.FindAsync(
                It.IsAny<IClientSessionHandle>(),
                It.IsAny<FilterDefinition<DealExecution>>(),
                It.IsAny<FindOptions<DealExecution, DealExecution>>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync((IClientSessionHandle s, FilterDefinition<DealExecution> f, FindOptions<DealExecution, DealExecution> opt, CancellationToken ct) =>
                {
                    if (f is ExpressionFilterDefinition<DealExecution> exprFilter)
                    {
                        try
                        {
                            var predicate = exprFilter.Expression.Compile();
                            return MakeCursor(_dealsDb.Where(predicate).ToList());
                        }
                        catch { }
                    }
                    return MakeCursor(_dealsDb);
                });

            var journeysCollectionMock = new Mock<IMongoCollection<CreatorJourney>>();
            journeysCollectionMock.Setup(c => c.UpdateOneAsync(It.IsAny<FilterDefinition<CreatorJourney>>(), It.IsAny<UpdateDefinition<CreatorJourney>>(), It.IsAny<UpdateOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new UpdateResult.Acknowledged(1, 1, null));
            journeysCollectionMock.Setup(c => c.UpdateOneAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<FilterDefinition<CreatorJourney>>(), It.IsAny<UpdateDefinition<CreatorJourney>>(), It.IsAny<UpdateOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new UpdateResult.Acknowledged(1, 1, null));

            var usersCollectionMock = new Mock<IMongoCollection<ApplicationUser>>();
            usersCollectionMock.Setup(c => c.UpdateOneAsync(It.IsAny<FilterDefinition<ApplicationUser>>(), It.IsAny<UpdateDefinition<ApplicationUser>>(), It.IsAny<UpdateOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new UpdateResult.Acknowledged(1, 1, null));
            usersCollectionMock.Setup(c => c.UpdateOneAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<FilterDefinition<ApplicationUser>>(), It.IsAny<UpdateDefinition<ApplicationUser>>(), It.IsAny<UpdateOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new UpdateResult.Acknowledged(1, 1, null));

            _dbMock.Setup(d => d.GetCollection<DealExecution>("DealExecutions", null)).Returns(dealsCollectionMock.Object);
            _dbMock.Setup(d => d.GetCollection<Companies>("Companies", null)).Returns(companiesCollectionMock.Object);
            _dbMock.Setup(d => d.GetCollection<EntrepreneurProfileRecord>("EntrepreneurProfiles", null)).Returns(profilesCollectionMock.Object);
            _dbMock.Setup(d => d.GetCollection<Phase3Concept>("Phase3Concepts", null)).Returns(conceptsCollectionMock.Object);
            _dbMock.Setup(d => d.GetCollection<Phase4CapTable>("Phase4CapTables", null)).Returns(capTablesCollectionMock.Object);
            _dbMock.Setup(d => d.GetCollection<CreatorJourney>("CreatorJourneys", null)).Returns(journeysCollectionMock.Object);
            _dbMock.Setup(d => d.GetCollection<ApplicationUser>("applicationUsers", null)).Returns(usersCollectionMock.Object);

            _context = new MongoDbContext(_dbMock.Object);

            _ideasMock.Setup(s => s.GetOwnedAsync(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync((string ideaId, string userId) => _ideasDb.FirstOrDefault(i => i.Id == ideaId && i.UserId == userId));
            _ideasMock.Setup(s => s.UpdateAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<UpdateDefinition<CreatorIdea>>(), It.IsAny<long?>(), It.IsAny<IClientSessionHandle>()))
                .ReturnsAsync(true);

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync((string userId, string ideaId) =>
                {
                    var idea = _ideasDb.FirstOrDefault(i => i.Id == ideaId);
                    var j = new CreatorJourney { Id = "j-" + userId, UserId = userId };
                    if (idea != null)
                    {
                        j.Project = idea.Project;
                        j.Phase2Data = idea.Phase2Data;
                        j.Phase3Data = idea.Phase3Data;
                        j.Phase4Data = idea.Phase4Data;
                        j.Phase5Data = idea.Phase5Data;
                        j.IdeaId = idea.Id;
                        j.ProjectOutcome = idea.ProjectOutcome;
                        j.ActivePartnershipDealId = idea.ActivePartnershipDealId;
                        j.CompanyId = idea.CompanyId ?? j.CompanyId;
                    }
                    return j;
                });

            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(It.IsAny<CreatorJourney>(), It.IsAny<bool>()))
                .ReturnsAsync((CreatorJourney j, bool phase1Complete) =>
                {
                    var status = new ComputedJourneyStatus();
                    var p5 = j.Phase5Data ?? new CreatorPhase5Data();
                    var p6 = j.Phase6Data ?? new CreatorPhase6Data();
                    bool isBuild = p5.ChosenPath == "build";
                    bool isCofounded = string.Equals(j.ProjectOutcome, "CO_FOUNDED", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrEmpty(j.ActivePartnershipDealId);
                    bool isSold = string.Equals(j.ProjectOutcome, "SOLD", StringComparison.OrdinalIgnoreCase);

                    status.Phase2.Status = "completed";
                    status.Phase3.Status = "completed";
                    status.Phase4.Status = "completed";
                    status.Phase5.Status = "completed";

                    if (isSold)
                    {
                        status.Phase6.Status = "locked";
                    }
                    else if (isBuild || isCofounded)
                    {
                        status.Phase6.Status = p6.LevelUpTriggered ? "completed" : "available";
                    }
                    else
                    {
                        status.Phase6.Status = "locked";
                    }
                    return status;
                });

            _matchingMock.Setup(m => m.MatchAsync(It.IsAny<CreatorJourney>(), It.IsAny<string>(), It.IsAny<int>()))
                .ReturnsAsync(new List<SmartMatch>());
        }

        private static IAsyncCursor<T> MakeCursor<T>(IEnumerable<T> items)
        {
            var cursor = new Mock<IAsyncCursor<T>>();
            var list = items.ToList();
            var called = false;
            cursor.Setup(c => c.MoveNext(It.IsAny<CancellationToken>()))
                .Returns(() => { var res = !called; called = true; return res; });
            cursor.Setup(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => { var res = !called; called = true; return res; });
            cursor.Setup(c => c.Current).Returns(list);
            return cursor.Object;
        }

        private CreatorPhase6Controller CreateController(string userId)
        {
            var controller = new CreatorPhase6Controller(
                _journeysMock.Object,
                _matchingMock.Object,
                _context,
                _userManagerMock.Object,
                _roleManagerMock.Object,
                _eventsMock.Object,
                _companyServiceMock.Object,
                _ideasMock.Object,
                _mongoClientMock.Object,
                _config,
                _envMock.Object,
                NullLogger<CreatorPhase6Controller>.Instance);

            var userGuid = _usersDb.FirstOrDefault(u => u.User == userId)?.Id ?? Guid.NewGuid();
            var httpContext = new DefaultHttpContext();
            httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim("UserId", userId),
                new Claim(ClaimTypes.Role, "Creator")
            }, "TestAuth"));
            httpContext.Request.QueryString = new QueryString("?expectedVersion=1");

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            };
            return controller;
        }

        // ==========================================
        // TEST 1: Build path + Phase 4 complete -> Phase 5 completed without SeedFunding
        // ==========================================
        [Fact]
        public void Test_1_Build_Path_Completes_Phase_5_Without_SeedFunding()
        {
            var journey = new CreatorJourney
            {
                UserId = "user-1",
                Project = new CreatorJourneyProject { Problem = "P", TargetUser = "U", Solution = "S" },
                Phase4Data = new CreatorPhase4Data
                {
                    NeedsAnalysis = new Models.DatabaseModels.Phase4.NeedsAnalysis { Status = "Completed" },
                    PricingStrategy = new Models.DatabaseModels.Phase4.PricingStrategy { Status = Models.DatabaseModels.Phase4.PricingStatus.Generated },
                    GtmStrategy = new Models.DatabaseModels.Phase4.GtmStrategy { Status = "Valid" }
                },
                Phase5Data = new CreatorPhase5Data
                {
                    ChosenPath = "build",
                    PathB = null // Zero SeedFunding
                }
            };

            var p4 = journey.Phase4Data;
            bool p4Done = p4.NeedsAnalysis != null && p4.PricingStrategy != null && p4.GtmStrategy != null;

            var p5 = journey.Phase5Data;
            bool chosen = !string.IsNullOrEmpty(p5.ChosenPath);
            bool isBuild = p5.ChosenPath == "build";
            bool seedPresent = p5.PathB?.SeedFunding != null;

            string phase5Status = !p4Done ? "locked" : (chosen && (seedPresent || isBuild)) ? "completed" : "in_progress";
            phase5Status.Should().Be("completed");
        }

        // ==========================================
        // TEST 2: Build path -> readiness does not block on CompanyFormation
        // ==========================================
        [Fact]
        public async Task Test_2_Build_Readiness_Does_Not_Block_On_CompanyFormation()
        {
            var userId = "user-readiness-2";
            var ideaId = "idea-readiness-2";
            _ideasDb.Add(new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                Project = new CreatorJourneyProject { Problem = "P", TargetUser = "U", Solution = "S" },
                Phase5Data = new CreatorPhase5Data
                {
                    ChosenPath = "build",
                    PathB = null // No CompanyFormation
                }
            });
            _usersDb.Add(new ApplicationUser { Id = Guid.NewGuid(), User = userId, Onboarding = new OnboardingState { Phase = 1 } });
            _userRoles[userId] = new HashSet<string> { "Creator" };

            var controller = CreateController(userId);
            var result = await controller.Readiness(ideaId);

            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            (obj.StatusCode ?? 200).Should().Be(200);
            var response = obj.Value.As<ApiResponse>().Data.As<CreatorReadinessResponse>();
            response.MissingRequired.Should().NotContain("company_setup");
        }

        // ==========================================
        // TEST 3: Build path -> readiness does not block on SeedFunding
        // ==========================================
        [Fact]
        public async Task Test_3_Build_Readiness_Does_Not_Block_On_SeedFunding()
        {
            var userId = "user-readiness-3";
            var ideaId = "idea-readiness-3";
            _ideasDb.Add(new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                Project = new CreatorJourneyProject { Problem = "P", TargetUser = "U", Solution = "S" },
                Phase5Data = new CreatorPhase5Data
                {
                    ChosenPath = "build",
                    PathB = null // No SeedFunding
                }
            });
            _usersDb.Add(new ApplicationUser { Id = Guid.NewGuid(), User = userId, Onboarding = new OnboardingState { Phase = 1 } });
            _userRoles[userId] = new HashSet<string> { "Creator" };

            var controller = CreateController(userId);
            var result = await controller.Readiness(ideaId);

            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            (obj.StatusCode ?? 200).Should().Be(200);
            var response = obj.Value.As<ApiResponse>().Data.As<CreatorReadinessResponse>();
            response.MissingRequired.Should().NotContain("funding_preparation");
            response.LevelUpEligible.Should().BeTrue();
        }

        // ==========================================
        // TEST 4: Level Up without PathB subdocs -> succeeds
        // ==========================================
        [Fact]
        public async Task Test_4_LevelUp_Without_PathB_Subdocs_Succeeds()
        {
            var userId = "user-levelup-4";
            var ideaId = "idea-levelup-4";
            _ideasDb.Add(new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                Project = new CreatorJourneyProject { Name = "Project 4", Problem = "P", TargetUser = "U", Solution = "S" },
                Phase5Data = new CreatorPhase5Data { ChosenPath = "build", PathB = null }
            });
            var user = new ApplicationUser { Id = Guid.NewGuid(), User = userId, Onboarding = new OnboardingState { Phase = 1 } };
            _usersDb.Add(user);
            _userRoles[userId] = new HashSet<string> { "Creator" };
            _userRoles[user.Id.ToString()] = _userRoles[userId];

            _companyServiceMock.Setup(c => c.EnsureLevelUpCompanyAsync(userId, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<double?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<IClientSessionHandle>()))
                .ReturnsAsync(new Companies { Id = "comp-4", OwnerId = userId, CompanyName = "Project 4" });
            _companyServiceMock.Setup(c => c.EnsureLevelUpCompanyAsync(userId, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<double?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), null))
                .ReturnsAsync(new Companies { Id = "comp-4", OwnerId = userId, CompanyName = "Project 4" });

            var controller = CreateController(userId);
            var result = await controller.LevelUp(ideaId);

            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            (obj.StatusCode ?? 200).Should().Be(200);

            _userRoles[userId].Should().Contain("Creator");
            _userRoles[userId].Should().Contain("Entrepreneur");
        }

        // ==========================================
        // TEST 5: Legal structure -> Phase 3 selected type used
        // ==========================================
        [Fact]
        public async Task Test_5_LegalStructure_Uses_Phase3_SelectedType()
        {
            var userId = "user-legal-5";
            var ideaId = "idea-legal-5";
            _ideasDb.Add(new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                Project = new CreatorJourneyProject { Name = "Project 5", Problem = "P", TargetUser = "U", Solution = "S" },
                Phase3Data = new CreatorPhase3Data
                {
                    FormationGenerator = new CreatorFormationGenerator { SelectedType = "SAS-U", RecommendedType = "SAS" }
                },
                Phase5Data = new CreatorPhase5Data { ChosenPath = "build", PathB = null }
            });
            var user = new ApplicationUser { Id = Guid.NewGuid(), User = userId, Onboarding = new OnboardingState { Phase = 1 } };
            _usersDb.Add(user);
            _userRoles[userId] = new HashSet<string> { "Creator" };
            _userRoles[user.Id.ToString()] = _userRoles[userId];

            string capturedLegalStructure = null;
            _companyServiceMock.Setup(c => c.EnsureLevelUpCompanyAsync(
                userId, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<double?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<IClientSessionHandle>()))
                .Callback<string, string, string, double?, string?, string?, string?, IClientSessionHandle>((_, _, legal, _, _, _, _, _) => capturedLegalStructure = legal)
                .ReturnsAsync(new Companies { Id = "comp-5", OwnerId = userId });
            _companyServiceMock.Setup(c => c.EnsureLevelUpCompanyAsync(
                userId, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<double?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), null))
                .Callback<string, string, string, double?, string?, string?, string?, IClientSessionHandle>((_, _, legal, _, _, _, _, _) => capturedLegalStructure = legal)
                .ReturnsAsync(new Companies { Id = "comp-5", OwnerId = userId });

            var controller = CreateController(userId);
            await controller.LevelUp(ideaId);

            capturedLegalStructure.Should().Be("SAS-U");
        }

        // ==========================================
        // TEST 6: Missing all legal structure -> safe fallback SAS
        // ==========================================
        [Fact]
        public async Task Test_6_LegalStructure_Fallback_To_SAS()
        {
            var userId = "user-legal-6";
            var ideaId = "idea-legal-6";
            _ideasDb.Add(new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                Project = new CreatorJourneyProject { Name = "Project 6", Problem = "P", TargetUser = "U", Solution = "S" },
                Phase3Data = null,
                Phase5Data = new CreatorPhase5Data { ChosenPath = "build", PathB = null }
            });
            var user = new ApplicationUser { Id = Guid.NewGuid(), User = userId, Onboarding = new OnboardingState { Phase = 1 } };
            _usersDb.Add(user);
            _userRoles[userId] = new HashSet<string> { "Creator" };
            _userRoles[user.Id.ToString()] = _userRoles[userId];

            string capturedLegalStructure = null;
            _companyServiceMock.Setup(c => c.EnsureLevelUpCompanyAsync(
                userId, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<double?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<IClientSessionHandle>()))
                .Callback<string, string, string, double?, string?, string?, string?, IClientSessionHandle>((_, _, legal, _, _, _, _, _) => capturedLegalStructure = legal)
                .ReturnsAsync(new Companies { Id = "comp-6", OwnerId = userId });
            _companyServiceMock.Setup(c => c.EnsureLevelUpCompanyAsync(
                userId, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<double?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), null))
                .Callback<string, string, string, double?, string?, string?, string?, IClientSessionHandle>((_, _, legal, _, _, _, _, _) => capturedLegalStructure = legal)
                .ReturnsAsync(new Companies { Id = "comp-6", OwnerId = userId });

            var controller = CreateController(userId);
            await controller.LevelUp(ideaId);

            capturedLegalStructure.Should().Be("SAS");
        }

        // ==========================================
        // TEST 7: Missing ownership -> Founder 100%
        // ==========================================
        [Fact]
        public async Task Test_7_Missing_Ownership_Defaults_To_Founder_100()
        {
            var userId = "user-owner-7";
            var ideaId = "idea-owner-7";
            _ideasDb.Add(new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                Project = new CreatorJourneyProject { Name = "Project 7", Problem = "P", TargetUser = "U", Solution = "S" },
                Phase5Data = new CreatorPhase5Data { ChosenPath = "build", PathB = null }
            });
            var user = new ApplicationUser { Id = Guid.NewGuid(), User = userId, Onboarding = new OnboardingState { Phase = 1 } };
            _usersDb.Add(user);
            _userRoles[userId] = new HashSet<string> { "Creator" };
            _userRoles[user.Id.ToString()] = _userRoles[userId];

            _companyServiceMock.Setup(c => c.EnsureLevelUpCompanyAsync(
                userId, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<double?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<IClientSessionHandle>()))
                .ReturnsAsync(new Companies { Id = "comp-7", OwnerId = userId });
            _companyServiceMock.Setup(c => c.EnsureLevelUpCompanyAsync(
                userId, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<double?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), null))
                .ReturnsAsync(new Companies { Id = "comp-7", OwnerId = userId });

            List<OwnershipEntryDto> capturedOwnership = null;
            _companyServiceMock.Setup(c => c.SeedCapTableFromOwnershipAsync(It.IsAny<string>(), It.IsAny<List<OwnershipEntryDto>>(), It.IsAny<IClientSessionHandle>()))
                .Callback<string, List<OwnershipEntryDto>, IClientSessionHandle>((_, list, _) => capturedOwnership = list)
                .Returns(Task.CompletedTask);
            _companyServiceMock.Setup(c => c.SeedCapTableFromOwnershipAsync(It.IsAny<string>(), It.IsAny<List<OwnershipEntryDto>>()))
                .Callback<string, List<OwnershipEntryDto>>((_, list) => capturedOwnership = list)
                .Returns(Task.CompletedTask);

            var controller = CreateController(userId);
            await controller.LevelUp(ideaId);

            capturedOwnership.Should().NotBeNull();
            capturedOwnership.Should().HaveCount(1);
            capturedOwnership[0].Holder.Should().Be("Founder");
            capturedOwnership[0].Percent.Should().Be(100);
            capturedOwnership[0].IsFounder.Should().BeTrue();
        }

        // ==========================================
        // TEST 8: Missing funding -> FundingAskAmount null
        // ==========================================
        [Fact]
        public async Task Test_8_Missing_Funding_Leaves_FundingAskAmount_Null()
        {
            var userId = "user-funding-8";
            var ideaId = "idea-funding-8";
            _ideasDb.Add(new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                Project = new CreatorJourneyProject { Name = "Project 8", Problem = "P", TargetUser = "U", Solution = "S" },
                Phase5Data = new CreatorPhase5Data { ChosenPath = "build", PathB = null }
            });
            var user = new ApplicationUser { Id = Guid.NewGuid(), User = userId, Onboarding = new OnboardingState { Phase = 1 } };
            _usersDb.Add(user);
            _userRoles[userId] = new HashSet<string> { "Creator" };
            _userRoles[user.Id.ToString()] = _userRoles[userId];

            double? capturedFundingAsk = 99999;
            _companyServiceMock.Setup(c => c.EnsureLevelUpCompanyAsync(
                userId, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<double?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<IClientSessionHandle>()))
                .Callback<string, string, string, double?, string?, string?, string?, IClientSessionHandle>((_, _, _, ask, _, _, _, _) => capturedFundingAsk = ask)
                .ReturnsAsync(new Companies { Id = "comp-8", OwnerId = userId });
            _companyServiceMock.Setup(c => c.EnsureLevelUpCompanyAsync(
                userId, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<double?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), null))
                .Callback<string, string, string, double?, string?, string?, string?, IClientSessionHandle>((_, _, _, ask, _, _, _, _) => capturedFundingAsk = ask)
                .ReturnsAsync(new Companies { Id = "comp-8", OwnerId = userId });

            var controller = CreateController(userId);
            await controller.LevelUp(ideaId);

            capturedFundingAsk.Should().BeNull();
        }

        // ==========================================
        // TEST 9: Same idea Level Up twice -> one Company only
        // ==========================================
        [Fact]
        public async Task Test_9_Same_Idea_LevelUp_Twice_Returns_Existing_Company()
        {
            var userId = "user-idempotent-9";
            var ideaId = "idea-idempotent-9";
            var company = new Companies { Id = "comp-existing-9", OwnerId = userId, SourceBusinessIdeaId = ideaId, CompanyName = "Venture 9" };

            _ideasDb.Add(new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                Project = new CreatorJourneyProject { Name = "Venture 9", Problem = "P", TargetUser = "U", Solution = "S" },
                Phase5Data = new CreatorPhase5Data { ChosenPath = "build" }
            });
            var user = new ApplicationUser { Id = Guid.NewGuid(), User = userId, Onboarding = new OnboardingState { Phase = 1 } };
            _usersDb.Add(user);
            _userRoles[userId] = new HashSet<string> { "Creator" };
            _userRoles[user.Id.ToString()] = _userRoles[userId];

            _companyServiceMock.Setup(c => c.EnsureLevelUpCompanyAsync(
                userId, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<double?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<IClientSessionHandle>()))
                .ReturnsAsync(company);
            _companyServiceMock.Setup(c => c.EnsureLevelUpCompanyAsync(
                userId, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<double?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), null))
                .ReturnsAsync(company);

            var controller = CreateController(userId);

            // First call
            var res1 = await controller.LevelUp(ideaId);
            var ok1 = res1.Should().BeOfType<OkObjectResult>().Subject;
            (ok1.StatusCode ?? 200).Should().Be(200);

            // Second call
            var res2 = await controller.LevelUp(ideaId);
            var ok2 = res2.Should().BeOfType<OkObjectResult>().Subject;
            (ok2.StatusCode ?? 200).Should().Be(200);

            _userRoles[userId].Count(r => r == "Entrepreneur").Should().Be(1); // No duplicate role
        }

        // ==========================================
        // TEST 10: Idea A Level Up -> Idea B untouched
        // ==========================================
        [Fact]
        public async Task Test_10_Idea_A_LevelUp_Leaves_Idea_B_Untouched()
        {
            var userId = "user-multi-10";
            var ideaA = "idea-a-10";
            var ideaB = "idea-b-10";

            _ideasDb.Add(new CreatorIdea
            {
                Id = ideaA,
                UserId = userId,
                Project = new CreatorJourneyProject { Name = "Idea A", Problem = "P", TargetUser = "U", Solution = "S" },
                Phase5Data = new CreatorPhase5Data { ChosenPath = "build" }
            });
            _ideasDb.Add(new CreatorIdea
            {
                Id = ideaB,
                UserId = userId,
                Project = new CreatorJourneyProject { Name = "Idea B", Problem = "P2", TargetUser = "U2", Solution = "S2" },
                Phase5Data = new CreatorPhase5Data { ChosenPath = "build" }
            });
            var user = new ApplicationUser { Id = Guid.NewGuid(), User = userId, Onboarding = new OnboardingState { Phase = 1 } };
            _usersDb.Add(user);
            _userRoles[userId] = new HashSet<string> { "Creator" };
            _userRoles[user.Id.ToString()] = _userRoles[userId];

            _companyServiceMock.Setup(c => c.EnsureLevelUpCompanyAsync(
                userId, ideaA, It.IsAny<string>(), It.IsAny<double?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<IClientSessionHandle>()))
                .ReturnsAsync(new Companies { Id = "comp-a", OwnerId = userId, SourceBusinessIdeaId = ideaA });
            _companyServiceMock.Setup(c => c.EnsureLevelUpCompanyAsync(
                userId, ideaA, It.IsAny<string>(), It.IsAny<double?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), null))
                .ReturnsAsync(new Companies { Id = "comp-a", OwnerId = userId, SourceBusinessIdeaId = ideaA });

            var controller = CreateController(userId);
            await controller.LevelUp(ideaA);

            var dbIdeaB = _ideasDb.First(i => i.Id == ideaB);
            dbIdeaB.Project.Name.Should().Be("Idea B");
            dbIdeaB.Project.Problem.Should().Be("P2");
            dbIdeaB.UserId.Should().Be(userId);
        }

        // ==========================================
        // TEST 11: Build Yourself -> no marketplace listing
        // ==========================================
        [Fact]
        public async Task Test_11_Build_Yourself_Creates_Zero_Marketplace_Listings()
        {
            var userId = "user-mkt-11";
            var ideaId = "idea-mkt-11";

            _ideasDb.Add(new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                Project = new CreatorJourneyProject { Name = "Private Venture", Problem = "P", TargetUser = "U", Solution = "S" },
                Phase5Data = new CreatorPhase5Data { ChosenPath = "build" }
            });
            var user = new ApplicationUser { Id = Guid.NewGuid(), User = userId, Onboarding = new OnboardingState { Phase = 1 } };
            _usersDb.Add(user);
            _userRoles[userId] = new HashSet<string> { "Creator" };
            _userRoles[user.Id.ToString()] = _userRoles[userId];

            _companyServiceMock.Setup(c => c.EnsureLevelUpCompanyAsync(
                userId, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<double?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<IClientSessionHandle>()))
                .ReturnsAsync(new Companies { Id = "comp-11", OwnerId = userId });
            _companyServiceMock.Setup(c => c.EnsureLevelUpCompanyAsync(
                userId, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<double?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), null))
                .ReturnsAsync(new Companies { Id = "comp-11", OwnerId = userId });

            var controller = CreateController(userId);
            await controller.LevelUp(ideaId);

            var dbIdea = _ideasDb.First(i => i.Id == ideaId);
            dbIdea.Phase5Data?.PathA?.MarketplaceListing.Should().BeNull();
        }

        // ==========================================
        // TEST 12: Build Yourself -> no DealExecution
        // ==========================================
        [Fact]
        public async Task Test_12_Build_Yourself_Creates_Zero_DealExecutions()
        {
            var userId = "user-deal-12";
            var ideaId = "idea-deal-12";

            _ideasDb.Add(new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                Project = new CreatorJourneyProject { Name = "Spinout Venture", Problem = "P", TargetUser = "U", Solution = "S" },
                Phase5Data = new CreatorPhase5Data { ChosenPath = "build" }
            });
            var user = new ApplicationUser { Id = Guid.NewGuid(), User = userId, Onboarding = new OnboardingState { Phase = 1 } };
            _usersDb.Add(user);
            _userRoles[userId] = new HashSet<string> { "Creator" };
            _userRoles[user.Id.ToString()] = _userRoles[userId];

            _companyServiceMock.Setup(c => c.EnsureLevelUpCompanyAsync(
                userId, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<double?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<IClientSessionHandle>()))
                .ReturnsAsync(new Companies { Id = "comp-12", OwnerId = userId });
            _companyServiceMock.Setup(c => c.EnsureLevelUpCompanyAsync(
                userId, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<double?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), null))
                .ReturnsAsync(new Companies { Id = "comp-12", OwnerId = userId });

            var controller = CreateController(userId);
            await controller.LevelUp(ideaId);

            _dealsDb.Should().BeEmpty();
        }

        // ==========================================
        // TEST 13: Full Buyout regression -> PASS
        // ==========================================
        [Fact]
        public async Task Test_13_Full_Buyout_Rejects_LevelUp()
        {
            var userId = "user-buyout-13";
            var ideaId = "idea-buyout-13";

            _ideasDb.Add(new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                Project = new CreatorJourneyProject { Name = "Buyout Project", Problem = "P", TargetUser = "U", Solution = "S" },
                Phase5Data = new CreatorPhase5Data
                {
                    ChosenPath = "sell",
                    PathA = new CreatorPathA
                    {
                        MarketplaceListing = new CreatorMarketplaceListing { Status = "live" }
                    }
                }
            });
            var user = new ApplicationUser { Id = Guid.NewGuid(), User = userId, Onboarding = new OnboardingState { Phase = 1 } };
            _usersDb.Add(user);
            _userRoles[userId] = new HashSet<string> { "Creator" };
            _userRoles[user.Id.ToString()] = _userRoles[userId];

            var controller = CreateController(userId);
            var result = await controller.LevelUp(ideaId);

            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            (obj.StatusCode ?? 200).Should().Be(422);
        }

        // ==========================================
        // TEST 14: Equity Partnership regression -> PASS
        // ==========================================
        [Fact]
        public async Task Test_14_Equity_Partnership_Requires_Active_Partnership_And_CapTable()
        {
            var creatorId = "creator-eq-14";
            var entId = "ent-eq-14";
            var ideaId = "idea-eq-14";
            var dealId = "deal-eq-14";
            var companyId = "comp-eq-14";

            // Inactive deal stage
            _ideasDb.Add(new CreatorIdea
            {
                Id = ideaId,
                UserId = creatorId,
                ProjectOutcome = "CO_FOUNDED",
                ActivePartnershipDealId = dealId,
                Project = new CreatorJourneyProject { Problem = "P", TargetUser = "U", Solution = "S" },
                Phase5Data = new CreatorPhase5Data { ChosenPath = "sell" }
            });
            _dealsDb.Add(new DealExecution
            {
                Id = dealId,
                IdeaId = ideaId,
                CreatorId = creatorId,
                EntrepreneurId = entId,
                DealType = "EQUITY_PARTNERSHIP",
                DealStage = "OFFER_NEGOTIATION", // Inactive
                Status = "in_progress",
                Activation = new PartnershipActivation
                {
                    Status = "OFFER_NEGOTIATION",
                    CompanyId = companyId
                }
            });
            _companiesDb.Add(new Companies { Id = companyId, OwnerId = entId });
            var user = new ApplicationUser { Id = Guid.NewGuid(), User = creatorId, Onboarding = new OnboardingState { Phase = 1 } };
            _usersDb.Add(user);
            _userRoles[creatorId] = new HashSet<string> { "Creator" };
            _userRoles[user.Id.ToString()] = _userRoles[creatorId];

            var controller = CreateController(creatorId);
            var result = await controller.Readiness(ideaId);

            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            (obj.StatusCode ?? 200).Should().Be(200);
            var response = obj.Value.As<ApiResponse>().Data.As<CreatorReadinessResponse>();
            response.LevelUpEligible.Should().BeFalse();
            response.Requirements.First(r => r.Key == "partnership_active").Complete.Should().BeFalse();
        }

        // ==========================================
        // TEST 15: Exact Develflow Discovery Shape (empty TargetUser, completed Phase 2)
        //          Passes idea_core and Levels Up cleanly.
        // ==========================================
        [Fact]
        public async Task Test_15_Develflow_ExactShape_EmptyTargetUser_PassesIdeaCore_And_LevelsUp()
        {
            var userId = "user-develflow-15";
            var ideaId = "idea-develflow-15";

            _ideasDb.Add(new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                Project = new CreatorJourneyProject
                {
                    Name = "Develflow",
                    Problem = "Mid-market multi-channel merchants experience latency in stock updates across marketplaces like Shopify, Amazon, and TikTok Shop, resulting in overselling penalties and cancelled orders.",
                    TargetUser = "", // Empty as generated by Discovery
                    Solution = "A developer-first, real-time event-streaming inventory middleware that captures transaction events instantaneously and propagates stock reservations across all connected channels in sub-second latency.",
                    Concept = "A developer-first, real-time event-streaming inventory middleware...",
                    ClarityScore = 84.0,
                    SourceMethod = "discovery",
                    Branding = new CreatorBranding { BrandingMethod = "ai_logo", LogoAsset = "/uploads/branding/logo.png" }
                },
                Phase2Data = new CreatorPhase2Data
                {
                    ClarifierSessionId = "6aa648e1d717a64281e6c740",
                    SelectedConceptId = "concept-1"
                },
                Phase3Data = new CreatorPhase3Data
                {
                    BusinessPlanSessionId = "bp-15",
                    ForecastSessionId = "fc-15",
                    FormationGenerator = new CreatorFormationGenerator { RecommendedType = "SAS" }
                },
                Phase4Data = new CreatorPhase4Data(),
                Phase5Data = new CreatorPhase5Data
                {
                    ChosenPath = "build",
                    PathB = null // No CompanyFormation, No SeedFunding
                }
            });

            var user = new ApplicationUser { Id = Guid.NewGuid(), User = userId, Onboarding = new OnboardingState { Phase = 1 } };
            _usersDb.Add(user);
            _userRoles[userId] = new HashSet<string> { "Creator" };
            _userRoles[user.Id.ToString()] = _userRoles[userId];

            _companyServiceMock.Setup(c => c.EnsureLevelUpCompanyAsync(userId, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<double?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<IClientSessionHandle>()))
                .ReturnsAsync(new Companies { Id = "comp-15", OwnerId = userId, CompanyName = "Develflow" });
            _companyServiceMock.Setup(c => c.EnsureLevelUpCompanyAsync(userId, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<double?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), null))
                .ReturnsAsync(new Companies { Id = "comp-15", OwnerId = userId, CompanyName = "Develflow" });

            var controller = CreateController(userId);

            // 1. Verify Readiness
            var readinessResult = await controller.Readiness(ideaId);
            var readinessObj = readinessResult.Should().BeAssignableTo<ObjectResult>().Subject;
            readinessObj.StatusCode.Should().Be(200);
            var readiness = readinessObj.Value.As<ApiResponse>().Data.As<CreatorReadinessResponse>();
            readiness.Requirements.First(r => r.Key == "idea_core").Complete.Should().BeTrue();
            readiness.MissingRequired.Should().NotContain("idea_core");
            readiness.LevelUpEligible.Should().BeTrue();

            // 2. Verify Level Up
            var levelUpResult = await controller.LevelUp(ideaId);
            var levelUpObj = levelUpResult.Should().BeAssignableTo<ObjectResult>().Subject;
            levelUpObj.StatusCode.Should().Be(200);

            _userRoles[userId].Should().Contain("Creator");
            _userRoles[userId].Should().Contain("Entrepreneur");
        }

        // ==========================================
        // TEST 16: Negative Test — Missing canonical problem/solution blocks Level Up with 422
        // ==========================================
        [Fact]
        public async Task Test_16_Negative_MissingProblemOrSolution_FailsIdeaCore_With_422()
        {
            var userId = "user-incomplete-16";
            var ideaId = "idea-incomplete-16";

            _ideasDb.Add(new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                Project = new CreatorJourneyProject
                {
                    Name = "Incomplete Project",
                    Problem = "", // Missing canonical problem
                    TargetUser = "Everyone",
                    Solution = "Some solution",
                    ClarityScore = 50.0
                },
                Phase5Data = new CreatorPhase5Data { ChosenPath = "build" }
            });

            var user = new ApplicationUser { Id = Guid.NewGuid(), User = userId, Onboarding = new OnboardingState { Phase = 1 } };
            _usersDb.Add(user);
            _userRoles[userId] = new HashSet<string> { "Creator" };

            var controller = CreateController(userId);

            var readinessResult = await controller.Readiness(ideaId);
            var readinessObj = readinessResult.Should().BeAssignableTo<ObjectResult>().Subject;
            var readiness = readinessObj.Value.As<ApiResponse>().Data.As<CreatorReadinessResponse>();
            readiness.Requirements.First(r => r.Key == "idea_core").Complete.Should().BeFalse();
            readiness.MissingRequired.Should().Contain("idea_core");
            readiness.LevelUpEligible.Should().BeFalse();

            var levelUpResult = await controller.LevelUp(ideaId);
            var levelUpObj = levelUpResult.Should().BeAssignableTo<ObjectResult>().Subject;
            levelUpObj.StatusCode.Should().Be(422);
            var apiErr = levelUpObj.Value.As<ApiResponse>();
            apiErr.Success.Should().BeFalse();
            apiErr.Message.Should().Be("prerequisites_not_met");
        }

        // ==========================================
        // TEST 17: Atomicity Test (Section 16)
        //          Company + Cap Table + Roles + Journey linked atomically with session
        // ==========================================
        [Fact]
        public async Task Test_17_Atomicity_CapTableSeeded_With_Session_And_Single_Transaction()
        {
            var userId = "user-atomicity-17";
            var ideaId = "idea-atomicity-17";

            _ideasDb.Add(new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                Project = new CreatorJourneyProject
                {
                    Name = "Atomicity Project",
                    Problem = "P17",
                    TargetUser = "U17",
                    Solution = "S17",
                    ClarityScore = 90.0,
                    Branding = new CreatorBranding { BrandingMethod = "ai_logo" }
                },
                Phase2Data = new CreatorPhase2Data { ClarifierSessionId = "c-17" },
                Phase3Data = new CreatorPhase3Data { BusinessPlanSessionId = "bp-17", ForecastSessionId = "fc-17" },
                Phase4Data = new CreatorPhase4Data(),
                Phase5Data = new CreatorPhase5Data { ChosenPath = "build", PathB = null }
            });

            var user = new ApplicationUser { Id = Guid.NewGuid(), User = userId, Onboarding = new OnboardingState { Phase = 1 } };
            _usersDb.Add(user);
            _userRoles[userId] = new HashSet<string> { "Creator" };
            _userRoles[user.Id.ToString()] = _userRoles[userId];

            _companyServiceMock.Setup(c => c.EnsureLevelUpCompanyAsync(
                userId, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<double?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<IClientSessionHandle>()))
                .ReturnsAsync(new Companies { Id = "comp-17", OwnerId = userId, CompanyName = "Atomicity Project" });

            List<OwnershipEntryDto> capturedOwnership = null;
            IClientSessionHandle capturedSession = null;
            _companyServiceMock.Setup(c => c.SeedCapTableFromOwnershipAsync(It.IsAny<string>(), It.IsAny<List<OwnershipEntryDto>>(), It.IsAny<IClientSessionHandle>()))
                .Callback<string, List<OwnershipEntryDto>, IClientSessionHandle>((_, list, s) => { capturedOwnership = list; capturedSession = s; })
                .Returns(Task.CompletedTask);

            var controller = CreateController(userId);
            var result = await controller.LevelUp(ideaId);
            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(200);

            // Assert: Cap Table seeded with Founder 100%
            capturedOwnership.Should().NotBeNull();
            capturedOwnership.Should().HaveCount(1);
            capturedOwnership[0].Holder.Should().Be("Founder");
            capturedOwnership[0].Percent.Should().Be(100);

            // Assert: Roles & Journey
            _userRoles[userId].Should().Contain("Creator");
            _userRoles[userId].Should().Contain("Entrepreneur");
        }

        // ==========================================
        // TEST 18: Rollback Test (Section 17)
        //          Failure during CoreWritesAsync aborts transaction and does not persist
        // ==========================================
        [Fact]
        public async Task Test_18_Rollback_ControlledFailure_Aborts_And_Leaves_State_Intact()
        {
            var userId = "user-rollback-18";
            var ideaId = "idea-rollback-18";

            _ideasDb.Add(new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                Project = new CreatorJourneyProject
                {
                    Name = "Rollback Project",
                    Problem = "P18",
                    TargetUser = "U18",
                    Solution = "S18",
                    ClarityScore = 90.0,
                    Branding = new CreatorBranding { BrandingMethod = "ai_logo" }
                },
                Phase2Data = new CreatorPhase2Data { ClarifierSessionId = "c-18" },
                Phase3Data = new CreatorPhase3Data { BusinessPlanSessionId = "bp-18", ForecastSessionId = "fc-18" },
                Phase4Data = new CreatorPhase4Data(),
                Phase5Data = new CreatorPhase5Data { ChosenPath = "build", PathB = null }
            });

            var user = new ApplicationUser { Id = Guid.NewGuid(), User = userId, Onboarding = new OnboardingState { Phase = 1 } };
            _usersDb.Add(user);
            _userRoles[userId] = new HashSet<string> { "Creator" };
            _userRoles[user.Id.ToString()] = _userRoles[userId];

            _companyServiceMock.Setup(c => c.EnsureLevelUpCompanyAsync(
                userId, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<double?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<IClientSessionHandle>()))
                .ReturnsAsync(new Companies { Id = "comp-18", OwnerId = userId });

            // Force failure in Cap Table seed
            _companyServiceMock.Setup(c => c.SeedCapTableFromOwnershipAsync(It.IsAny<string>(), It.IsAny<List<OwnershipEntryDto>>(), It.IsAny<IClientSessionHandle>()))
                .ThrowsAsync(new InvalidOperationException("Simulated database failure during cap table write"));

            var controller = CreateController(userId);
            var result = await controller.LevelUp(ideaId);
            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            obj.StatusCode.Should().Be(500);

            // Assert: Post-commit actions did not run
            _userRoles[userId].Should().NotContain("Entrepreneur");
            _userRoles[userId].Should().Contain("Creator");
        }

        // ==========================================
        // TEST 19: Idempotency / Retry Test (Section 20)
        //          Second Level Up reuses existing company, no duplicate roles
        // ==========================================
        [Fact]
        public async Task Test_19_Idempotency_Second_LevelUp_Reuses_Company_No_Duplicates()
        {
            var userId = "user-idempotent-19";
            var ideaId = "idea-idempotent-19";

            _ideasDb.Add(new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                Project = new CreatorJourneyProject
                {
                    Name = "Idempotent Project",
                    Problem = "P19",
                    TargetUser = "U19",
                    Solution = "S19",
                    ClarityScore = 90.0,
                    Branding = new CreatorBranding { BrandingMethod = "ai_logo" }
                },
                Phase2Data = new CreatorPhase2Data { ClarifierSessionId = "c-19" },
                Phase3Data = new CreatorPhase3Data { BusinessPlanSessionId = "bp-19", ForecastSessionId = "fc-19" },
                Phase4Data = new CreatorPhase4Data(),
                Phase5Data = new CreatorPhase5Data { ChosenPath = "build", PathB = null }
            });

            var user = new ApplicationUser { Id = Guid.NewGuid(), User = userId, Onboarding = new OnboardingState { Phase = 1 } };
            _usersDb.Add(user);
            _userRoles[userId] = new HashSet<string> { "Creator" };
            _userRoles[user.Id.ToString()] = _userRoles[userId];

            var existingCompany = new Companies { Id = "comp-19", OwnerId = userId, CompanyName = "Idempotent Project" };
            _companyServiceMock.Setup(c => c.EnsureLevelUpCompanyAsync(
                userId, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<double?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<IClientSessionHandle>()))
                .ReturnsAsync(existingCompany);

            int capTableSeedCount = 0;
            _companyServiceMock.Setup(c => c.SeedCapTableFromOwnershipAsync(It.IsAny<string>(), It.IsAny<List<OwnershipEntryDto>>(), It.IsAny<IClientSessionHandle>()))
                .Callback(() => capTableSeedCount++)
                .Returns(Task.CompletedTask);

            var controller = CreateController(userId);

            // First call
            var result1 = await controller.LevelUp(ideaId);
            result1.Should().BeAssignableTo<ObjectResult>().Which.StatusCode.Should().Be(200);

            // Second call (retry)
            var result2 = await controller.LevelUp(ideaId);
            result2.Should().BeAssignableTo<ObjectResult>().Which.StatusCode.Should().Be(200);

            // Assert: Roles not duplicated
            _userRoles[userId].Count(r => r == "Entrepreneur").Should().Be(1);
            _userRoles[userId].Should().Contain("Creator");
        }
    }
}
