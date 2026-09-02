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
using WebApp.Services.Interface;
using WebApp.Services.Repository;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class CreatorDataContinuityTests
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

        public CreatorDataContinuityTests()
        {
            var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
            _userManagerMock = new Mock<UserManager<ApplicationUser>>(userStoreMock.Object, null, null, null, null, null, null, null, null);
            _userManagerMock.Setup(u => u.FindByIdAsync(It.IsAny<string>()))
                .ReturnsAsync((string id) => _usersDb.FirstOrDefault(u => u.Id.ToString() == id || u.User == id || u.UserName == id));
            _userManagerMock.Setup(u => u.FindByNameAsync(It.IsAny<string>()))
                .ReturnsAsync((string name) => _usersDb.FirstOrDefault(u => u.UserName == name || u.User == name));

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

            // Setup Companies mock collection
            var companiesCollectionMock = new Mock<IMongoCollection<Companies>>();
            companiesCollectionMock.Setup(c => c.InsertOneAsync(It.IsAny<Companies>(), It.IsAny<InsertOneOptions>(), It.IsAny<CancellationToken>()))
                .Callback<Companies, InsertOneOptions, CancellationToken>((doc, _, _) => _companiesDb.Add(doc))
                .Returns(Task.CompletedTask);
            companiesCollectionMock.Setup(c => c.InsertOneAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<Companies>(), It.IsAny<InsertOneOptions>(), It.IsAny<CancellationToken>()))
                .Callback<IClientSessionHandle, Companies, InsertOneOptions, CancellationToken>((_, doc, _, _) => _companiesDb.Add(doc))
                .Returns(Task.CompletedTask);
            companiesCollectionMock.Setup(c => c.UpdateOneAsync(It.IsAny<FilterDefinition<Companies>>(), It.IsAny<UpdateDefinition<Companies>>(), It.IsAny<UpdateOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new UpdateResult.Acknowledged(1, 1, null));
            companiesCollectionMock.Setup(c => c.UpdateOneAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<FilterDefinition<Companies>>(), It.IsAny<UpdateDefinition<Companies>>(), It.IsAny<UpdateOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new UpdateResult.Acknowledged(1, 1, null));

            // Setup EntrepreneurProfiles mock collection
            var profilesCollectionMock = new Mock<IMongoCollection<EntrepreneurProfileRecord>>();
            profilesCollectionMock.Setup(c => c.InsertOneAsync(It.IsAny<EntrepreneurProfileRecord>(), It.IsAny<InsertOneOptions>(), It.IsAny<CancellationToken>()))
                .Callback<EntrepreneurProfileRecord, InsertOneOptions, CancellationToken>((doc, _, _) => _profilesDb.Add(doc))
                .Returns(Task.CompletedTask);
            profilesCollectionMock.Setup(c => c.InsertOneAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<EntrepreneurProfileRecord>(), It.IsAny<InsertOneOptions>(), It.IsAny<CancellationToken>()))
                .Callback<IClientSessionHandle, EntrepreneurProfileRecord, InsertOneOptions, CancellationToken>((_, doc, _, _) => _profilesDb.Add(doc))
                .Returns(Task.CompletedTask);
            var profilesCursor = new Mock<IAsyncCursor<EntrepreneurProfileRecord>>();
            profilesCursor.Setup(c => c.Current).Returns(new List<EntrepreneurProfileRecord>());
            profilesCursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(true).Returns(false);
            profilesCursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true).ReturnsAsync(false);
            profilesCollectionMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<EntrepreneurProfileRecord>>(), It.IsAny<FindOptions<EntrepreneurProfileRecord, EntrepreneurProfileRecord>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(profilesCursor.Object);
            profilesCollectionMock.Setup(c => c.FindAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<FilterDefinition<EntrepreneurProfileRecord>>(), It.IsAny<FindOptions<EntrepreneurProfileRecord, EntrepreneurProfileRecord>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(profilesCursor.Object);

            // Setup Phase3Concepts mock collection
            var conceptsCollectionMock = new Mock<IMongoCollection<Phase3Concept>>();
            conceptsCollectionMock.Setup(c => c.InsertOneAsync(It.IsAny<Phase3Concept>(), It.IsAny<InsertOneOptions>(), It.IsAny<CancellationToken>()))
                .Callback<Phase3Concept, InsertOneOptions, CancellationToken>((doc, _, _) => _conceptsDb.Add(doc))
                .Returns(Task.CompletedTask);
            conceptsCollectionMock.Setup(c => c.InsertOneAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<Phase3Concept>(), It.IsAny<InsertOneOptions>(), It.IsAny<CancellationToken>()))
                .Callback<IClientSessionHandle, Phase3Concept, InsertOneOptions, CancellationToken>((_, doc, _, _) => _conceptsDb.Add(doc))
                .Returns(Task.CompletedTask);
            var conceptsCursor = new Mock<IAsyncCursor<Phase3Concept>>();
            conceptsCursor.Setup(c => c.Current).Returns(new List<Phase3Concept>());
            conceptsCursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(true).Returns(false);
            conceptsCursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true).ReturnsAsync(false);
            conceptsCollectionMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<Phase3Concept>>(), It.IsAny<FindOptions<Phase3Concept, Phase3Concept>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(conceptsCursor.Object);
            conceptsCollectionMock.Setup(c => c.FindAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<FilterDefinition<Phase3Concept>>(), It.IsAny<FindOptions<Phase3Concept, Phase3Concept>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(conceptsCursor.Object);

            // Setup CreatorJourneys mock collection
            var journeysCollectionMock = new Mock<IMongoCollection<CreatorJourney>>();
            journeysCollectionMock.Setup(c => c.UpdateOneAsync(It.IsAny<FilterDefinition<CreatorJourney>>(), It.IsAny<UpdateDefinition<CreatorJourney>>(), It.IsAny<UpdateOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new UpdateResult.Acknowledged(1, 1, null));
            journeysCollectionMock.Setup(c => c.UpdateOneAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<FilterDefinition<CreatorJourney>>(), It.IsAny<UpdateDefinition<CreatorJourney>>(), It.IsAny<UpdateOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new UpdateResult.Acknowledged(1, 1, null));

            // Setup ApplicationUsers mock collection
            var usersCollectionMock = new Mock<IMongoCollection<ApplicationUser>>();
            usersCollectionMock.Setup(c => c.UpdateOneAsync(It.IsAny<FilterDefinition<ApplicationUser>>(), It.IsAny<UpdateDefinition<ApplicationUser>>(), It.IsAny<UpdateOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new UpdateResult.Acknowledged(1, 1, null));
            usersCollectionMock.Setup(c => c.UpdateOneAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<FilterDefinition<ApplicationUser>>(), It.IsAny<UpdateDefinition<ApplicationUser>>(), It.IsAny<UpdateOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new UpdateResult.Acknowledged(1, 1, null));

            var dealsCollectionMock = new Mock<IMongoCollection<DealExecution>>();
            var dealsCursor = new Mock<IAsyncCursor<DealExecution>>();
            dealsCursor.Setup(c => c.Current).Returns(new List<DealExecution>());
            dealsCursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(true).Returns(false);
            dealsCursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true).ReturnsAsync(false);
            dealsCollectionMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(dealsCursor.Object);
            dealsCollectionMock.Setup(c => c.FindAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(dealsCursor.Object);

            var capTablesCollectionMock = new Mock<IMongoCollection<Phase4CapTable>>();
            var capTablesCursor = new Mock<IAsyncCursor<Phase4CapTable>>();
            capTablesCursor.Setup(c => c.Current).Returns(new List<Phase4CapTable>());
            capTablesCursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(true).Returns(false);
            capTablesCursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true).ReturnsAsync(false);
            capTablesCollectionMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<Phase4CapTable>>(), It.IsAny<FindOptions<Phase4CapTable, Phase4CapTable>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(capTablesCursor.Object);
            capTablesCollectionMock.Setup(c => c.FindAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<FilterDefinition<Phase4CapTable>>(), It.IsAny<FindOptions<Phase4CapTable, Phase4CapTable>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(capTablesCursor.Object);

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

        [Fact]
        public async Task Test_Core_Transfer_Populates_Company_And_Phase3Concept()
        {
            var userId = "creator-core";
            var ideaId = "idea-core";

            var project = new CreatorJourneyProject
            {
                Name = "Nova Project",
                Sector = "Technology",
                Tagline = "Build faster",
                Problem = "Problem X",
                Solution = "Solution Y",
                TargetUser = "Founders",
                ClarityScore = 95
            };

            var journey = new CreatorJourney
            {
                Id = "journey-core",
                UserId = userId,
                BusinessIdeaId = ideaId,
                Project = project,
                Phase3Data = new CreatorPhase3Data
                {
                    BusinessPlanSessionId = "bp-sess-123",
                    ForecastSessionId = "fc-sess-456"
                },
                Phase4Data = new CreatorPhase4Data
                {
                    PricingModel = "subscription"
                },
                Phase5Data = new CreatorPhase5Data
                {
                    ChosenPath = "build",
                    PathB = new CreatorPathB
                    {
                        CompanyFormation = new CreatorCompanyFormation
                        {
                            SelectedType = "SAS",
                            Ownership = new List<CreatorOwnershipEntry>
                            {
                                new() { Holder = "Founder", Percent = 80, IsFounder = true },
                                new() { Holder = "ESOP", Percent = 20, IsEsop = true }
                            }
                        },
                        SeedFunding = new CreatorSeedFunding
                        {
                            TotalAsk = 50000,
                            UseOfFunds = new List<CreatorUseOfFunds>
                            {
                                new() { Category = "Product", Percent = 50 },
                                new() { Category = "Marketing", Percent = 50 }
                            }
                        }
                    }
                }
            };

            _ideasDb.Add(new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                Project = project,
                Version = 1,
                Phase5Data = journey.Phase5Data
            });

            _usersDb.Add(new ApplicationUser
            {
                Id = Guid.NewGuid(),
                User = userId,
                UserName = userId,
                Onboarding = new OnboardingState { Phase = 1 }
            });

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(userId, ideaId))
                .ReturnsAsync(journey);

            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(It.IsAny<CreatorJourney>(), It.IsAny<bool>()))
                .ReturnsAsync(new ComputedJourneyStatus
                {
                    Phase1 = new ComputedPhaseStatus { Status = "completed" },
                    Phase2 = new ComputedPhaseStatus { Status = "completed" },
                    Phase3 = new ComputedPhaseStatus { Status = "completed" },
                    Phase4 = new ComputedPhaseStatus { Status = "completed" },
                    Phase5 = new ComputedPhaseStatus { Status = "completed" },
                    Phase6 = new ComputedPhaseStatus { Status = "available" }
                });

            _companyServiceMock.Setup(c => c.EnsureLevelUpCompanyAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<double?>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<IClientSessionHandle>()))
                .ReturnsAsync((string uId, string sLink, string legStruct, double? ask, string? cName, string? ind, string? tag, IClientSessionHandle s) =>
                {
                    var comp = new Companies
                    {
                        Id = "comp-nova-1",
                        OwnerId = uId,
                        SourceBusinessIdeaId = sLink,
                        CompanyName = cName ?? "",
                        Industry = ind ?? "",
                        Tagline = tag ?? "",
                        LegalStructure = legStruct,
                        FundingAskAmount = ask,
                        CurrentPhase = 2
                    };
                    _companiesDb.Add(comp);
                    return comp;
                });

            var controller = CreateController(userId);
            var result = await controller.LevelUp(ideaId);

            if (result is UnprocessableEntityObjectResult unproc)
            {
                var val = System.Text.Json.JsonSerializer.Serialize(unproc.Value);
                throw new Exception("LevelUp returned 422: " + val);
            }

            result.Should().BeOfType<OkObjectResult>();

            // Verify Company core transfer
            var comp = _companiesDb.FirstOrDefault(c => c.OwnerId == userId);
            comp.Should().NotBeNull();
            comp!.CompanyName.Should().Be("Nova Project");
            comp.Industry.Should().Be("Technology");
            comp.Tagline.Should().Be("Build faster");
            comp.LegalStructure.Should().Be("SAS");
            comp.SourceBusinessIdeaId.Should().Be(ideaId);
            comp.FundingAskAmount.Should().Be(50000);

            // Verify Phase3Concept prefilled
            var concept = _conceptsDb.FirstOrDefault(c => c.CompanyId == comp.Id);
            concept.Should().NotBeNull();
            concept!.OneLiner.Should().Be("Build faster");
            concept.ProblemStatement.Should().Be("Problem X");
            concept.SolutionDescription.Should().Be("Solution Y");
            concept.BusinessModel.Should().Be("subscription");

            // Verify Cap Table was seeded
            _companyServiceMock.Verify(c => c.SubmitCapTableAsync(comp.Id, It.Is<SubmitCapTableRequest>(r =>
                r.TotalShares == 1_000_000 && r.EsopPoolPercent == 20 && r.Grants.Count == 2)), Times.Once);
        }

        [Fact]
        public async Task Test_MultiIdea_Lookup_Maintains_Company_Isolation()
        {
            var valuationMock = new Mock<IValuationEngine>();
            var capTableMock = new Mock<ICapTableCalculator>();
            var investorMatcherMock = new Mock<IInvestorMatcher>();
            var aiReviewMock = new Mock<IAiReviewEngine>();
            var docMgrMock = new Mock<IDocumentManager>();
            var phaseValidatorMock = new Mock<IPhaseValidator>();
            var dealEventsMock = new Mock<IDealEventPublisher>();

            var companiesList = new List<Companies>();
            var compCollectionMock = new Mock<IMongoCollection<Companies>>();
            compCollectionMock.Setup(c => c.InsertOneAsync(It.IsAny<Companies>(), It.IsAny<InsertOneOptions>(), It.IsAny<CancellationToken>()))
                .Callback<Companies, InsertOneOptions, CancellationToken>((doc, _, _) => companiesList.Add(doc))
                .Returns(Task.CompletedTask);

            // Setup FindAsync behavior using ExpressionFilterDefinition predicate
            compCollectionMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<Companies>>(), It.IsAny<FindOptions<Companies, Companies>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((FilterDefinition<Companies> filter, FindOptions<Companies, Companies> _, CancellationToken _) =>
                {
                    List<Companies> matched = new();
                    if (filter is ExpressionFilterDefinition<Companies> expr)
                    {
                        var fn = expr.Expression.Compile();
                        matched = companiesList.Where(fn).ToList();
                    }
                    else
                    {
                        matched = companiesList.ToList();
                    }

                    var cursor = new Mock<IAsyncCursor<Companies>>();
                    cursor.Setup(c => c.Current).Returns(matched);
                    cursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(true).Returns(false);
                    cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true).ReturnsAsync(false);
                    return cursor.Object;
                });

            var dbMock = new Mock<IMongoDatabase>();
            dbMock.Setup(d => d.GetCollection<Companies>("Companies", null)).Returns(compCollectionMock.Object);
            var context = new MongoDbContext(dbMock.Object);

            var companyService = new CompanyService(
                context,
                valuationMock.Object,
                capTableMock.Object,
                investorMatcherMock.Object,
                aiReviewMock.Object,
                docMgrMock.Object,
                phaseValidatorMock.Object,
                dealEventsMock.Object,
                NullLogger<CompanyService>.Instance);

            var userId = "creator-multi";
            var ideaA = "idea-A";
            var ideaB = "idea-B";

            // Level Up Idea A
            var compA = await companyService.EnsureLevelUpCompanyAsync(
                userId, ideaA, "SAS", 100000, "Project A", "Tech", "Tagline A");

            // Level Up Idea B
            var compB = await companyService.EnsureLevelUpCompanyAsync(
                userId, ideaB, "SARL", 200000, "Project B", "Health", "Tagline B");

            compA.Id.Should().NotBe(compB.Id);
            compA.SourceBusinessIdeaId.Should().Be(ideaA);
            compB.SourceBusinessIdeaId.Should().Be(ideaB);
            compA.CompanyName.Should().Be("Project A");
            compB.CompanyName.Should().Be("Project B");

            // Retry Idea A -> must reuse compA
            var compARetry = await companyService.EnsureLevelUpCompanyAsync(
                userId, ideaA, "SAS", 100000, "Project A", "Tech", "Tagline A");

            compARetry.Id.Should().Be(compA.Id);
        }

        [Fact]
        public async Task CofounderEquityDeal_CompanyFormation_BootstrapsPhase3Concept()
        {
            var compCollectionMock = new Mock<IMongoCollection<Companies>>();
            var ideasCollectionMock = new Mock<IMongoCollection<CreatorIdea>>();
            var conceptsCollectionMock = new Mock<IMongoCollection<Phase3Concept>>();

            var companiesDb = new List<Companies>();
            var ideasDb = new List<CreatorIdea>();
            var conceptsDb = new List<Phase3Concept>();

            compCollectionMock.Setup(c => c.InsertOneAsync(It.IsAny<Companies>(), null, default))
                .Callback<Companies, InsertOneOptions, CancellationToken>((comp, opt, ct) => companiesDb.Add(comp))
                .Returns(Task.CompletedTask);

            conceptsCollectionMock.Setup(c => c.InsertOneAsync(It.IsAny<Phase3Concept>(), null, default))
                .Callback<Phase3Concept, InsertOneOptions, CancellationToken>((concept, opt, ct) => conceptsDb.Add(concept))
                .Returns(Task.CompletedTask);

            var dbMock = new Mock<IMongoDatabase>();
            dbMock.Setup(d => d.GetCollection<Companies>("Companies", null)).Returns(compCollectionMock.Object);
            dbMock.Setup(d => d.GetCollection<CreatorIdea>("CreatorIdeas", null)).Returns(ideasCollectionMock.Object);
            dbMock.Setup(d => d.GetCollection<Phase3Concept>("Phase3Concepts", null)).Returns(conceptsCollectionMock.Object);

            var ideaId = "idea-cofounder-123";
            var companyId = "comp-cofounder-456";

            var creatorIdea = new CreatorIdea
            {
                Id = ideaId,
                Project = new CreatorJourneyProject
                {
                    Name = "CoFounder Tech",
                    Tagline = "Next Gen AI Collaboration",
                    Problem = "Founders struggle to find aligned technical cofounders.",
                    Solution = "Verified matchmaking and equity vesting workflows.",
                    Sector = "FinTech",
                    Category = "B2B_SaaS",
                    Tags = new List<string> { "AI", "Startup", "Equity" },
                    ClarityScore = 92
                },
                Phase4Data = new CreatorPhase4Data
                {
                    PricingModel = "subscription"
                }
            };
            ideasDb.Add(creatorIdea);

            var company = new Companies
            {
                Id = companyId,
                OwnerId = "entrepreneur-user-1",
                SourceBusinessIdeaId = ideaId,
                SourceDealId = "deal-cofounder-789",
                CompanyName = "CoFounder Tech SAS",
                CurrentPhase = 2
            };
            companiesDb.Add(company);

            // Setup FindAsync mocks for mongo collections
            compCollectionMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<Companies>>(), It.IsAny<FindOptions<Companies, Companies>>(), default))
                .ReturnsAsync(() => {
                    var cursor = new Mock<IAsyncCursor<Companies>>();
                    cursor.Setup(c => c.Current).Returns(companiesDb);
                    cursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(true).Returns(false);
                    cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true).ReturnsAsync(false);
                    return cursor.Object;
                });

            ideasCollectionMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), It.IsAny<FindOptions<CreatorIdea, CreatorIdea>>(), default))
                .ReturnsAsync(() => {
                    var cursor = new Mock<IAsyncCursor<CreatorIdea>>();
                    cursor.Setup(c => c.Current).Returns(ideasDb);
                    cursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(true).Returns(false);
                    cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true).ReturnsAsync(false);
                    return cursor.Object;
                });

            conceptsCollectionMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<Phase3Concept>>(), It.IsAny<FindOptions<Phase3Concept, Phase3Concept>>(), default))
                .ReturnsAsync(() => {
                    var cursor = new Mock<IAsyncCursor<Phase3Concept>>();
                    cursor.Setup(c => c.Current).Returns(conceptsDb);
                    cursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(true).Returns(false);
                    cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true).ReturnsAsync(false);
                    return cursor.Object;
                });

            var context = new MongoDbContext(dbMock.Object);
            var companyService = new CompanyService(
                context,
                new Mock<IValuationEngine>().Object,
                new Mock<ICapTableCalculator>().Object,
                new Mock<IInvestorMatcher>().Object,
                new Mock<IAiReviewEngine>().Object,
                new Mock<IDocumentManager>().Object,
                new Mock<IPhaseValidator>().Object,
                new Mock<IDealEventPublisher>().Object,
                NullLogger<CompanyService>.Instance);

            // Act: bootstrap company
            var success = await companyService.BootstrapCompanyFromCreatorProjectAsync(companyId, ideaId, "deal-cofounder-789", false);

            // Assert
            success.Should().BeTrue();
            conceptsDb.Should().HaveCount(1);

            var seededConcept = conceptsDb.First();
            seededConcept.CompanyId.Should().Be(companyId);
            seededConcept.OneLiner.Should().Be("Next Gen AI Collaboration");
            seededConcept.ProblemStatement.Should().Be("Founders struggle to find aligned technical cofounders.");
            seededConcept.SolutionDescription.Should().Be("Verified matchmaking and equity vesting workflows.");
            seededConcept.SectorTags.Should().Contain("FinTech");
            seededConcept.KeywordTags.Should().Contain("AI");
            seededConcept.BusinessModel.Should().Be("subscription");
        }

        [Fact]
        public async Task SaveConceptAsync_ElevatorPitchExceeding160Characters_SucceedsWithoutError()
        {
            var compCollectionMock = new Mock<IMongoCollection<Companies>>();
            var conceptsCollectionMock = new Mock<IMongoCollection<Phase3Concept>>();

            var companiesDb = new List<Companies>();
            var conceptsDb = new List<Phase3Concept>();

            var companyId = "comp-long-pitch-123";
            var company = new Companies
            {
                Id = companyId,
                OwnerId = "user-1",
                CompanyName = "Deep Tech SAS",
                CurrentPhase = 3
            };
            companiesDb.Add(company);

            compCollectionMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<Companies>>(), It.IsAny<FindOptions<Companies, Companies>>(), default))
                .ReturnsAsync(() => {
                    var cursor = new Mock<IAsyncCursor<Companies>>();
                    cursor.Setup(c => c.Current).Returns(companiesDb);
                    cursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(true).Returns(false);
                    cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true).ReturnsAsync(false);
                    return cursor.Object;
                });

            conceptsCollectionMock.Setup(c => c.FindOneAndUpdateAsync(
                It.IsAny<FilterDefinition<Phase3Concept>>(),
                It.IsAny<UpdateDefinition<Phase3Concept>>(),
                It.IsAny<FindOneAndUpdateOptions<Phase3Concept, Phase3Concept>>(),
                default))
                .ReturnsAsync(new Phase3Concept
                {
                    CompanyId = companyId,
                    OneLiner = "long pitch",
                    ProblemStatement = "problem",
                    SolutionDescription = "solution",
                    Stage = "idea",
                    BusinessModel = "SaaS_Subscription",
                    SectorTags = new List<string> { "AI" },
                    KeywordTags = new List<string> { "AI" },
                    ClarityScore = 100,
                    RecordedAt = DateTime.UtcNow
                });

            var dbMock = new Mock<IMongoDatabase>();
            dbMock.Setup(d => d.GetCollection<Companies>("Companies", null)).Returns(compCollectionMock.Object);
            dbMock.Setup(d => d.GetCollection<Phase3Concept>("Phase3Concepts", null)).Returns(conceptsCollectionMock.Object);

            var context = new MongoDbContext(dbMock.Object);
            var companyService = new CompanyService(
                context,
                new Mock<IValuationEngine>().Object,
                new Mock<ICapTableCalculator>().Object,
                new Mock<IInvestorMatcher>().Object,
                new Mock<IAiReviewEngine>().Object,
                new Mock<IDocumentManager>().Object,
                new Mock<IPhaseValidator>().Object,
                new Mock<IDealEventPublisher>().Object,
                NullLogger<CompanyService>.Instance);

            var longPitch = "Our comprehensive end-to-end platform automates startup financial readiness, scorecard valuations, and cap table modelling for founders and investors across global markets.";
            longPitch.Length.Should().BeGreaterThan(160);

            var req = new SaveConceptRequest
            {
                OneLiner = longPitch,
                ProblemStatement = "Founders struggle with investor data readiness.",
                SolutionDescription = "Automated AI-assisted valuation and diligence pipeline.",
                Stage = "idea",
                BusinessModel = "SaaS_Subscription",
                SectorTags = new List<string> { "FinTech", "AI" },
                KeywordTags = new List<string> { "SaaS" }
            };

            // Act: saving concept with pitch > 160 characters
            var resp = await companyService.SaveConceptAsync(companyId, req);

            // Assert
            resp.Should().NotBeNull();
            resp.OneLiner.Should().Be(longPitch);
            resp.ClarityScore.Should().Be(100);
        }

        [Fact]
        public async Task EquityPartnership_CapTableWithEsopAndInvestorReserve_DoesNotDuplicatePoolsAndEquals100Percent()
        {
            // Arrange
            var idea = new CreatorIdea
            {
                Id = "idea-cap-clean",
                Project = new CreatorProject { Name = "Clean Venture", Category = "AI" }
            };
            _ideasDb.Add(idea);

            var deal = new DealExecution
            {
                Id = "deal-cap-clean",
                IdeaId = "idea-cap-clean",
                DealType = "EQUITY_PARTNERSHIP",
                DealStage = "ACTIVATION_PENDING",
                CreatorId = "creator-user",
                EntrepreneurId = "ent-user",
                EquityTerms = new EquityTerms { EquityPercentage = 30.0, VestingMonths = 48, CliffMonths = 12 },
                SigningPackage = new SigningPackage
                {
                    Status = "AGREEMENT_SIGNED",
                    CreatorSignature = new SignatureInfo { SignedAt = DateTime.UtcNow, SignerName = "Creator" },
                    EntrepreneurSignature = new SignatureInfo { SignedAt = DateTime.UtcNow, SignerName = "Entrepreneur" }
                },
                CapTableDraft = new DealCapTableDraft
                {
                    DealId = "deal-cap-clean",
                    TotalShares = 10_000_000,
                    EsopPoolPercent = 5.0,
                    InvestorReservePercent = 5.0,
                    EsopVestingMonths = 48,
                    Entries = new List<DealCapTableEntry>
                    {
                        new() { DisplayName = "Creator", IsCreator = true, SharesGranted = 3_000_000, EquityPercent = 30.0 },
                        new() { DisplayName = "Entrepreneur", IsFounder = true, SharesGranted = 6_000_000, EquityPercent = 60.0 },
                        new() { DisplayName = "Employee Option Pool (ESOP)", IsEsop = true, StakeholderType = "esop", SharesGranted = 500_000, EquityPercent = 5.0 },
                        new() { DisplayName = "Future Investor Reserve", IsInvestorReserve = true, StakeholderType = "investor_reserve", SharesGranted = 500_000, EquityPercent = 5.0 }
                    }
                }
            };

            var dealsCollectionMock = new Mock<IMongoCollection<DealExecution>>();
            dealsCollectionMock.Setup(d => d.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() =>
                {
                    var cursor = new Mock<IAsyncCursor<DealExecution>>();
                    cursor.Setup(c => c.Current).Returns(new List<DealExecution> { deal });
                    cursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(true).Returns(false);
                    cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true).ReturnsAsync(false);
                    return cursor.Object;
                });
            dealsCollectionMock.Setup(d => d.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

            _dbMock.Setup(d => d.GetCollection<DealExecution>("DealExecutions", null)).Returns(dealsCollectionMock.Object);

            var context = CreateContext();
            var controller = CreateController(context, "ent-user");

            // Act 1: First activation
            var res1 = await controller.StartDealActivation("deal-cap-clean", new StartActivationRequest());
            var ok1 = res1.Should().BeOfType<OkObjectResult>().Subject;
            var data1 = ((ApiResponse)ok1.Value!).Data as PartnershipActivationDto;

            var company = _companiesDb.First(c => c.Id == data1!.CompanyId);

            // Assert 1: Exactly 4 entries, no duplicate ESOP/Reserve, total = 10,000,000 (100%)
            company.EquityStructure.Should().HaveCount(4);
            company.EquityStructure.Sum(e => e.SharesOwned).Should().Be(10_000_000);
            company.EquityStructure.Count(e => e.Type == "esop" || e.StakeholderName.Contains("ESOP")).Should().Be(1);
            company.EquityStructure.Count(e => e.StakeholderName.Contains("Investor Reserve")).Should().Be(1);

            // Act 2: Second activation (idempotency check)
            var res2 = await controller.StartDealActivation("deal-cap-clean", new StartActivationRequest());
            res2.Should().BeOfType<OkObjectResult>();

            // Assert 2: Still exactly 4 entries, total remains 10,000,000 (100%)
            company.EquityStructure.Should().HaveCount(4);
            company.EquityStructure.Sum(e => e.SharesOwned).Should().Be(10_000_000);
        }
    }
}
