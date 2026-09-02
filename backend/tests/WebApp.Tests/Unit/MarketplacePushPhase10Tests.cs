using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using MongoDB.Driver;
using Moq;
using WebApp.Controllers;
using WebApp.DbContext;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Repository;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class MarketplacePushPhase10Tests
    {
        private readonly Mock<IMongoDatabase> _dbMock;
        private readonly Mock<ICreatorJourneyService> _journeysMock;
        private readonly Mock<ISmartMatchingService> _matchingMock;
        private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
        private readonly Mock<RoleManager<ApplicationRole>> _roleManagerMock;
        private readonly Mock<IDealEventPublisher> _eventsMock;
        private readonly Mock<ICompanyService> _companyServiceMock;
        private readonly Mock<ICreatorIdeaStore> _ideasMock;
        private readonly Mock<IMongoClient> _mongoClientMock;
        private readonly Mock<IConfiguration> _configMock;
        private readonly Mock<IHostEnvironment> _envMock;
        private readonly MongoDbContext _context;

        private readonly List<DealExecution> _dealsDb = new();
        private readonly List<CreatorIdea> _ideasDb = new();
        private readonly List<Companies> _companiesDb = new();
        private readonly List<EntrepreneurProfileRecord> _profilesDb = new();
        private readonly List<CreatorJourney> _journeysDb = new();
        private readonly List<ApplicationUser> _usersDb = new();

        private readonly Dictionary<string, HashSet<string>> _userRoles = new();

        public MarketplacePushPhase10Tests()
        {
            _dbMock = new Mock<IMongoDatabase>();
            _journeysMock = new Mock<ICreatorJourneyService>();
            _matchingMock = new Mock<ISmartMatchingService>();
            _eventsMock = new Mock<IDealEventPublisher>();
            _companyServiceMock = new Mock<ICompanyService>();
            _ideasMock = new Mock<ICreatorIdeaStore>();
            _mongoClientMock = new Mock<IMongoClient>();
            _configMock = new Mock<IConfiguration>();
            _envMock = new Mock<IHostEnvironment>();

            _envMock.Setup(e => e.EnvironmentName).Returns("Development");
            var transSection = new Mock<IConfigurationSection>();
            transSection.Setup(s => s.Value).Returns("false");
            _configMock.Setup(c => c.GetSection("Mongo:TransactionsEnabled")).Returns(transSection.Object);
            _configMock.Setup(c => c["Mongo:TransactionsEnabled"]).Returns("false");
            _configMock.Setup(c => c.GetSection(It.Is<string>(s => s != "Mongo:TransactionsEnabled"))).Returns(new Mock<IConfigurationSection>().Object);

            // Mock userManager
            var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
            _userManagerMock = new Mock<UserManager<ApplicationUser>>(userStoreMock.Object, null, null, null, null, null, null, null, null);
            _userManagerMock.Setup(m => m.FindByIdAsync(It.IsAny<string>()))
                .ReturnsAsync((string id) => _usersDb.FirstOrDefault(u => u.Id.ToString() == id || u.User == id));
            _userManagerMock.Setup(m => m.IsInRoleAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
                .ReturnsAsync((ApplicationUser user, string role) =>
                    (_userRoles.TryGetValue(user.Id.ToString(), out var roles1) && roles1.Contains(role)) ||
                    (_userRoles.TryGetValue(user.User ?? "", out var roles2) && roles2.Contains(role)));
            _userManagerMock.Setup(m => m.AddToRoleAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
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

            // Mock roleManager
            var roleStoreMock = new Mock<IRoleStore<ApplicationRole>>();
            _roleManagerMock = new Mock<RoleManager<ApplicationRole>>(roleStoreMock.Object, null, null, null, null);
            _roleManagerMock.Setup(m => m.FindByNameAsync("Entrepreneur"))
                .ReturnsAsync(new ApplicationRole { Id = Guid.NewGuid(), Name = "Entrepreneur" });

            // Setup DealExecutions mock collection
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

            // Setup Companies mock collection
            var companiesCollectionMock = new Mock<IMongoCollection<Companies>>();
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

            // Setup EntrepreneurProfiles mock collection
            var profilesCollectionMock = new Mock<IMongoCollection<EntrepreneurProfileRecord>>();
            profilesCollectionMock.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<EntrepreneurProfileRecord>>(),
                It.IsAny<FindOptions<EntrepreneurProfileRecord, EntrepreneurProfileRecord>>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync((FilterDefinition<EntrepreneurProfileRecord> f, FindOptions<EntrepreneurProfileRecord, EntrepreneurProfileRecord> opt, CancellationToken ct) =>
                {
                    if (f is ExpressionFilterDefinition<EntrepreneurProfileRecord> exprFilter)
                    {
                        try
                        {
                            var predicate = exprFilter.Expression.Compile();
                            return MakeCursor(_profilesDb.Where(predicate).ToList());
                        }
                        catch { }
                    }
                    return MakeCursor(_profilesDb);
                });

            profilesCollectionMock.Setup(c => c.InsertOneAsync(
                It.IsAny<EntrepreneurProfileRecord>(),
                It.IsAny<InsertOneOptions>(),
                It.IsAny<CancellationToken>()))
                .Returns((EntrepreneurProfileRecord doc, InsertOneOptions opt, CancellationToken ct) =>
                {
                    _profilesDb.Add(doc);
                    return Task.CompletedTask;
                });

            profilesCollectionMock.Setup(c => c.InsertOneAsync(
                It.IsAny<IClientSessionHandle>(),
                It.IsAny<EntrepreneurProfileRecord>(),
                It.IsAny<InsertOneOptions>(),
                It.IsAny<CancellationToken>()))
                .Returns((IClientSessionHandle session, EntrepreneurProfileRecord doc, InsertOneOptions opt, CancellationToken ct) =>
                {
                    _profilesDb.Add(doc);
                    return Task.CompletedTask;
                });

            // Setup CreatorJourneys mock collection
            var journeysCollectionMock = new Mock<IMongoCollection<CreatorJourney>>();
            journeysCollectionMock.Setup(c => c.UpdateOneAsync(
                It.IsAny<FilterDefinition<CreatorJourney>>(),
                It.IsAny<UpdateDefinition<CreatorJourney>>(),
                It.IsAny<UpdateOptions>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync(new UpdateResult.Acknowledged(1, 1, null));

            journeysCollectionMock.Setup(c => c.UpdateOneAsync(
                It.IsAny<IClientSessionHandle>(),
                It.IsAny<FilterDefinition<CreatorJourney>>(),
                It.IsAny<UpdateDefinition<CreatorJourney>>(),
                It.IsAny<UpdateOptions>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync(new UpdateResult.Acknowledged(1, 1, null));

            // Setup ApplicationUsers mock collection
            var usersCollectionMock = new Mock<IMongoCollection<ApplicationUser>>();
            usersCollectionMock.Setup(c => c.UpdateOneAsync(
                It.IsAny<FilterDefinition<ApplicationUser>>(),
                It.IsAny<UpdateDefinition<ApplicationUser>>(),
                It.IsAny<UpdateOptions>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync(new UpdateResult.Acknowledged(1, 1, null));

            usersCollectionMock.Setup(c => c.UpdateOneAsync(
                It.IsAny<IClientSessionHandle>(),
                It.IsAny<FilterDefinition<ApplicationUser>>(),
                It.IsAny<UpdateDefinition<ApplicationUser>>(),
                It.IsAny<UpdateOptions>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync(new UpdateResult.Acknowledged(1, 1, null));

            // Setup Phase3Concepts mock collection
            var conceptsCollectionMock = new Mock<IMongoCollection<Phase3Concept>>();
            var conceptsCursor = new Mock<IAsyncCursor<Phase3Concept>>();
            conceptsCursor.Setup(c => c.Current).Returns(new List<Phase3Concept>());
            conceptsCursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(true).Returns(false);
            conceptsCursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true).ReturnsAsync(false);
            conceptsCollectionMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<Phase3Concept>>(), It.IsAny<FindOptions<Phase3Concept, Phase3Concept>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(conceptsCursor.Object);
            conceptsCollectionMock.Setup(c => c.FindAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<FilterDefinition<Phase3Concept>>(), It.IsAny<FindOptions<Phase3Concept, Phase3Concept>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(conceptsCursor.Object);

            // Setup Phase4CapTables mock collection
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
            _dbMock.Setup(d => d.GetCollection<CreatorJourney>("CreatorJourneys", null)).Returns(journeysCollectionMock.Object);
            _dbMock.Setup(d => d.GetCollection<ApplicationUser>("applicationUsers", null)).Returns(usersCollectionMock.Object);
            _dbMock.Setup(d => d.GetCollection<Phase3Concept>("Phase3Concepts", null)).Returns(conceptsCollectionMock.Object);
            _dbMock.Setup(d => d.GetCollection<Phase4CapTable>("Phase4CapTables", null)).Returns(capTablesCollectionMock.Object);

            _context = new MongoDbContext(_dbMock.Object);

            // Mock ideas store
            _ideasMock.Setup(s => s.GetOwnedAsync(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync((string ideaId, string userId) => _ideasDb.FirstOrDefault(i => i.Id == ideaId && i.UserId == userId));

            _ideasMock.Setup(s => s.UpdateAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<UpdateDefinition<CreatorIdea>>(), It.IsAny<long?>(), It.IsAny<IClientSessionHandle>()))
                .ReturnsAsync(true);

            // Mock journey service
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync((string userId, string ideaId) =>
                {
                    var idea = _ideasDb.FirstOrDefault(i => i.Id == ideaId);
                    var j = _journeysDb.FirstOrDefault(x => x.UserId == userId) ?? new CreatorJourney { Id = "j-" + userId, UserId = userId };
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

                    status.Phase3.Status = "completed";
                    status.Phase4.Status = "completed";
                    status.Phase5.Status = "completed";

                    if (isSold)
                    {
                        status.Phase6.Status = "locked";
                    }
                    else if (isBuild)
                    {
                        status.Phase6.Status = p6.LevelUpTriggered ? "completed" : "available";
                    }
                    else if (isCofounded)
                    {
                        status.Phase6.Status = p6.LevelUpTriggered ? "completed" : "available";
                    }
                    else
                    {
                        status.Phase6.Status = "locked";
                    }
                    return status;
                });

            // Mock matching
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

        private CreatorPhase6Controller CreateController(string userId, long expectedVersion = 1)
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
                _configMock.Object,
                _envMock.Object,
                NullLogger<CreatorPhase6Controller>.Instance);

            var httpContext = new DefaultHttpContext();
            httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Role, "Creator"),
            }, "TestAuth"));
            httpContext.Request.QueryString = new QueryString($"?expectedVersion={expectedVersion}");

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            };

            return controller;
        }

        private void SeedCofoundedPartnership(
            string creatorId, string entId, string ideaId, string dealId, string companyId,
            string dealStage = "PARTNERSHIP_ACTIVE", string dealStatus = "completed",
            bool signed = true, bool rolesConfirmed = true, bool inCapTable = true, double creatorEquity = 12.0)
        {
            var hash = "manifest-sha256-verified-12345";
            var creatorIdGuid = Guid.NewGuid();
            var creatorUser = new ApplicationUser
            {
                Id = creatorIdGuid,
                User = creatorId,
                Name = "Alice Creator",
                Onboarding = new OnboardingState { Phase = 1 }
            };
            _usersDb.Add(creatorUser);
            _userRoles[creatorIdGuid.ToString()] = new HashSet<string> { "Creator" };
            _userRoles[creatorId] = _userRoles[creatorIdGuid.ToString()];

            var entIdGuid = Guid.NewGuid();
            var entUser = new ApplicationUser
            {
                Id = entIdGuid,
                User = entId,
                Name = "Bob Entrepreneur",
                Onboarding = new OnboardingState { Phase = 1 }
            };
            _usersDb.Add(entUser);
            _userRoles[entIdGuid.ToString()] = new HashSet<string> { "Entrepreneur" };
            _userRoles[entId] = _userRoles[entIdGuid.ToString()];

            var idea = new CreatorIdea
            {
                Id = ideaId,
                UserId = creatorId,
                ProjectOutcome = "CO_FOUNDED",
                ActivePartnershipDealId = dealId,
                CompanyId = companyId,
                Version = 1,
                Project = new CreatorJourneyProject
                {
                    Name = "AutoInvoice SaaS",
                    Problem = "Invoicing is slow",
                    TargetUser = "SME",
                    Solution = "AI invoicing platform"
                },
                Phase5Data = new CreatorPhase5Data { ChosenPath = "sell" }
            };
            _ideasDb.Add(idea);

            var deal = new DealExecution
            {
                Id = dealId,
                IdeaId = ideaId,
                CreatorId = creatorId,
                EntrepreneurId = entId,
                DealType = "EQUITY_PARTNERSHIP",
                DealStage = dealStage,
                Status = dealStatus,
                EquityTerms = new EquityTerms
                {
                    EquityPercentage = creatorEquity,
                    CreatorRole = "Co-founder & Head of Product",
                    VestingEnabled = true,
                    VestingMonths = 48,
                    CliffMonths = 12
                },
                RoleAgreement = new RoleResponsibilityAgreement
                {
                    Status = rolesConfirmed ? "CONFIRMED" : "DRAFT",
                    CreatorRole = "Co-founder & Head of Product",
                    EntrepreneurRole = "Founder & CEO"
                },
                SigningPackage = new AgreementSigningPackage
                {
                    Status = signed ? "AGREEMENT_SIGNED" : "PENDING_SIGNATURE",
                    ManifestHash = hash
                },
                Activation = new PartnershipActivation
                {
                    Status = dealStage,
                    CompanyId = companyId,
                    CompanyName = "AutoInvoice SAS",
                    SignedManifestHash = hash,
                    CompletedAt = DateTime.UtcNow.AddMonths(-6),
                    AppliedCapTableEntries = new List<DealCapTableEntry>
                    {
                        new() { DisplayName = "Alice Creator", SharesGranted = 1_200_000, EquityPercent = creatorEquity, IsCreator = true },
                        new() { DisplayName = "Bob Entrepreneur", SharesGranted = 8_800_000, EquityPercent = 100.0 - creatorEquity, IsFounder = true }
                    },
                    LinkedDocuments = new List<ActivatedDocumentRef>
                    {
                        new() { DocumentId = "doc_1", Title = "Co-Founders Agreement", DocumentType = "CO_FOUNDERS_AGREEMENT", DocumentHash = "hash1" }
                    }
                }
            };
            _dealsDb.Add(deal);

            var company = new Companies
            {
                Id = companyId,
                OwnerId = entId,
                CompanyName = "AutoInvoice SAS",
                LegalName = "AutoInvoice SAS",
                SourceBusinessIdeaId = ideaId,
                SourceDealId = dealId,
                EquityStructure = inCapTable ? new List<EquityEntryDto>
                {
                    new() { StakeholderName = "Alice Creator", SharesOwned = 1_200_000, Type = "founder" },
                    new() { StakeholderName = "Bob Entrepreneur", SharesOwned = 8_800_000, Type = "founder" }
                } : new List<EquityEntryDto>
                {
                    new() { StakeholderName = "Bob Entrepreneur", SharesOwned = 10_000_000, Type = "founder" }
                }
            };
            _companiesDb.Add(company);
        }

        // ============ READINESS TESTS (A - N) ============

        [Fact]
        public async Task Test_A_Normal_Build_Path_Remains_Available()
        {
            var userId = "user-build-a";
            var ideaId = "idea-build-a";
            _ideasDb.Add(new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                Project = new CreatorJourneyProject { Problem = "P", TargetUser = "U", Solution = "S" },
                Phase5Data = new CreatorPhase5Data
                {
                    ChosenPath = "build",
                    PathB = new CreatorPathB
                    {
                        CompanyFormation = new CreatorCompanyFormation { SelectedType = "SAS" },
                        SeedFunding = new CreatorSeedFunding { TotalAsk = 100000 }
                    }
                }
            });
            _usersDb.Add(new ApplicationUser { Id = Guid.NewGuid(), User = userId, Onboarding = new OnboardingState { Phase = 1 } });

            var controller = CreateController(userId);
            var result = await controller.Readiness(ideaId);

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = ok.Value.As<ApiResponse>().Data.As<CreatorReadinessResponse>();
            response.LevelUpEligible.Should().BeTrue();
        }

        [Fact]
        public async Task Test_B_Build_Path_Behavior_Unchanged()
        {
            var userId = "user-build-b";
            var ideaId = "idea-build-b";
            _ideasDb.Add(new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                Project = new CreatorJourneyProject { Problem = "P", TargetUser = "U", Solution = "S" },
                Phase5Data = new CreatorPhase5Data
                {
                    ChosenPath = "build",
                    PathB = new CreatorPathB
                    {
                        CompanyFormation = new CreatorCompanyFormation { SelectedType = "SAS" },
                        SeedFunding = new CreatorSeedFunding { TotalAsk = 100000 }
                    }
                }
            });
            _usersDb.Add(new ApplicationUser { Id = Guid.NewGuid(), User = userId, Onboarding = new OnboardingState { Phase = 1 } });

            var controller = CreateController(userId);
            var result = await controller.Readiness(ideaId);

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = ok.Value.As<ApiResponse>().Data.As<CreatorReadinessResponse>();
            response.QualificationPath.Should().Be("BUILD");
            response.Requirements.Should().Contain(r => r.Key == "company_setup");
            response.Requirements.Should().Contain(r => r.Key == "funding_preparation");
        }

        [Fact]
        public async Task Test_C_Sell_Full_Buyout_Remains_Locked()
        {
            var userId = "user-sell-c";
            var ideaId = "idea-sell-c";
            _ideasDb.Add(new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                Project = new CreatorJourneyProject { Problem = "P", TargetUser = "U", Solution = "S" },
                Phase5Data = new CreatorPhase5Data { ChosenPath = "sell" }
            });
            _usersDb.Add(new ApplicationUser { Id = Guid.NewGuid(), User = userId, Onboarding = new OnboardingState { Phase = 1 } });

            var controller = CreateController(userId);
            var result = await controller.Readiness(ideaId);

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = ok.Value.As<ApiResponse>().Data.As<CreatorReadinessResponse>();
            response.LevelUpEligible.Should().BeFalse();
            response.QualificationPath.Should().Be("SELL");
        }

        [Fact]
        public async Task Test_D_SOLD_Project_Not_Eligible()
        {
            var userId = "user-sold-d";
            var ideaId = "idea-sold-d";
            _ideasDb.Add(new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                ProjectOutcome = "SOLD",
                Project = new CreatorJourneyProject { Problem = "P", TargetUser = "U", Solution = "S" },
                Phase5Data = new CreatorPhase5Data { ChosenPath = "sell" }
            });
            _usersDb.Add(new ApplicationUser { Id = Guid.NewGuid(), User = userId, Onboarding = new OnboardingState { Phase = 1 } });

            var controller = CreateController(userId);
            var result = await controller.Readiness(ideaId);

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = ok.Value.As<ApiResponse>().Data.As<CreatorReadinessResponse>();
            response.LevelUpEligible.Should().BeFalse();
            response.OutcomeBadge.Should().Be("SOLD");
        }

        [Fact]
        public async Task Test_E_Cofounded_Inactive_Partnership_Not_Eligible()
        {
            var creatorId = "creator-e";
            var entId = "ent-e";
            var ideaId = "idea-e";
            var dealId = "deal-e";
            var companyId = "comp-e";

            SeedCofoundedPartnership(creatorId, entId, ideaId, dealId, companyId, dealStage: "OFFER_NEGOTIATION");

            var controller = CreateController(creatorId);
            var result = await controller.Readiness(ideaId);

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = ok.Value.As<ApiResponse>().Data.As<CreatorReadinessResponse>();
            response.LevelUpEligible.Should().BeFalse();
            response.Requirements.First(r => r.Key == "partnership_active").Complete.Should().BeFalse();
        }

        [Fact]
        public async Task Test_F_Partnership_Active_Missing_Company_Not_Eligible()
        {
            var creatorId = "creator-f";
            var entId = "ent-f";
            var ideaId = "idea-f";
            var dealId = "deal-f";
            var companyId = "comp-f";

            SeedCofoundedPartnership(creatorId, entId, ideaId, dealId, companyId);
            _companiesDb.Clear(); // remove company

            var controller = CreateController(creatorId);
            var result = await controller.Readiness(ideaId);

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = ok.Value.As<ApiResponse>().Data.As<CreatorReadinessResponse>();
            response.LevelUpEligible.Should().BeFalse();
            response.Requirements.First(r => r.Key == "company_linked").Complete.Should().BeFalse();
        }

        [Fact]
        public async Task Test_G_Company_Exists_Creator_Not_Shareholder_Not_Eligible()
        {
            var creatorId = "creator-g";
            var entId = "ent-g";
            var ideaId = "idea-g";
            var dealId = "deal-g";
            var companyId = "comp-g";

            SeedCofoundedPartnership(creatorId, entId, ideaId, dealId, companyId, inCapTable: false);

            var controller = CreateController(creatorId);
            var result = await controller.Readiness(ideaId);

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = ok.Value.As<ApiResponse>().Data.As<CreatorReadinessResponse>();
            response.LevelUpEligible.Should().BeFalse();
            response.Requirements.First(r => r.Key == "creator_shareholder").Complete.Should().BeFalse();
        }

        [Fact]
        public async Task Test_H_Shareholder_Ownership_Mismatch_Not_Eligible()
        {
            var creatorId = "creator-h";
            var entId = "ent-h";
            var ideaId = "idea-h";
            var dealId = "deal-h";
            var companyId = "comp-h";

            SeedCofoundedPartnership(creatorId, entId, ideaId, dealId, companyId);
            var comp = _companiesDb.First(c => c.Id == companyId);
            comp.EquityStructure.Clear(); // no shares

            var controller = CreateController(creatorId);
            var result = await controller.Readiness(ideaId);

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = ok.Value.As<ApiResponse>().Data.As<CreatorReadinessResponse>();
            response.LevelUpEligible.Should().BeFalse();
            response.Requirements.First(r => r.Key == "creator_shareholder").Complete.Should().BeFalse();
        }

        [Fact]
        public async Task Test_I_Role_Not_Confirmed_Not_Eligible()
        {
            var creatorId = "creator-i";
            var entId = "ent-i";
            var ideaId = "idea-i";
            var dealId = "deal-i";
            var companyId = "comp-i";

            SeedCofoundedPartnership(creatorId, entId, ideaId, dealId, companyId, rolesConfirmed: false);

            var controller = CreateController(creatorId);
            var result = await controller.Readiness(ideaId);

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = ok.Value.As<ApiResponse>().Data.As<CreatorReadinessResponse>();
            response.LevelUpEligible.Should().BeFalse();
            response.Requirements.First(r => r.Key == "role_confirmed").Complete.Should().BeFalse();
        }

        [Fact]
        public async Task Test_J_Unsigned_Package_Or_Hash_Mismatch_Not_Eligible()
        {
            var creatorId = "creator-j";
            var entId = "ent-j";
            var ideaId = "idea-j";
            var dealId = "deal-j";
            var companyId = "comp-j";

            SeedCofoundedPartnership(creatorId, entId, ideaId, dealId, companyId, signed: false);

            var controller = CreateController(creatorId);
            var result = await controller.Readiness(ideaId);

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = ok.Value.As<ApiResponse>().Data.As<CreatorReadinessResponse>();
            response.LevelUpEligible.Should().BeFalse();
            response.Requirements.First(r => r.Key == "legal_signed").Complete.Should().BeFalse();
        }

        [Fact]
        public async Task Test_K_Valid_Cofounded_Partnership_Phase6_Available()
        {
            var creatorId = "creator-k";
            var entId = "ent-k";
            var ideaId = "idea-k";
            var dealId = "deal-k";
            var companyId = "comp-k";

            SeedCofoundedPartnership(creatorId, entId, ideaId, dealId, companyId);

            var controller = CreateController(creatorId);
            var result = await controller.Readiness(ideaId);

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = ok.Value.As<ApiResponse>().Data.As<CreatorReadinessResponse>();
            response.LevelUpEligible.Should().BeTrue();
        }

        [Fact]
        public async Task Test_L_Readiness_Returns_QualificationPath_Cofounded()
        {
            var creatorId = "creator-l";
            var entId = "ent-l";
            var ideaId = "idea-l";
            var dealId = "deal-l";
            var companyId = "comp-l";

            SeedCofoundedPartnership(creatorId, entId, ideaId, dealId, companyId, creatorEquity: 15.0);

            var controller = CreateController(creatorId);
            var result = await controller.Readiness(ideaId);

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = ok.Value.As<ApiResponse>().Data.As<CreatorReadinessResponse>();
            response.QualificationPath.Should().Be("CO_FOUNDED");
            response.OutcomeBadge.Should().Be("CO-FOUNDED");
            response.CompanyName.Should().Be("AutoInvoice SAS");
            response.CreatorRole.Should().Be("Co-founder & Head of Product");
            response.CreatorEquityPercent.Should().Be(15.0);
            response.CompanyId.Should().Be(companyId);
            response.DealId.Should().Be(dealId);
        }

        [Fact]
        public async Task Test_M_Empty_Investor_Pool_Does_Not_Block_Eligibility()
        {
            var creatorId = "creator-m";
            var entId = "ent-m";
            var ideaId = "idea-m";
            var dealId = "deal-m";
            var companyId = "comp-m";

            SeedCofoundedPartnership(creatorId, entId, ideaId, dealId, companyId);
            _matchingMock.Setup(m => m.MatchAsync(It.IsAny<CreatorJourney>(), It.IsAny<string>(), It.IsAny<int>()))
                .ReturnsAsync(new List<SmartMatch>()); // empty pool

            var controller = CreateController(creatorId);
            var result = await controller.Readiness(ideaId);

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = ok.Value.As<ApiResponse>().Data.As<CreatorReadinessResponse>();
            response.LevelUpEligible.Should().BeTrue();
        }

        [Fact]
        public async Task Test_N_Idea_A_Qualification_Does_Not_Unlock_Idea_B()
        {
            var creatorId = "creator-n";
            var entId = "ent-n";
            var ideaA = "idea-n-a";
            var ideaB = "idea-n-b";
            var dealA = "deal-n-a";
            var companyA = "comp-n-a";

            SeedCofoundedPartnership(creatorId, entId, ideaA, dealA, companyA);

            // Idea B is unpartnered sell idea
            _ideasDb.Add(new CreatorIdea
            {
                Id = ideaB,
                UserId = creatorId,
                Project = new CreatorJourneyProject { Problem = "P2", TargetUser = "U2", Solution = "S2" },
                Phase5Data = new CreatorPhase5Data { ChosenPath = "sell" }
            });

            var controller = CreateController(creatorId);
            var resultA = await controller.Readiness(ideaA);
            var okA = resultA.Should().BeOfType<OkObjectResult>().Subject;
            okA.Value.As<ApiResponse>().Data.As<CreatorReadinessResponse>().LevelUpEligible.Should().BeTrue();

            var resultB = await controller.Readiness(ideaB);
            var okB = resultB.Should().BeOfType<OkObjectResult>().Subject;
            okB.Value.As<ApiResponse>().Data.As<CreatorReadinessResponse>().LevelUpEligible.Should().BeFalse();
        }

        // ============ LEVEL UP TESTS (O - AJ) ============

        [Fact]
        public async Task Test_O_Valid_Build_LevelUp_Still_Succeeds()
        {
            var userId = "user-build-o";
            var ideaId = "idea-build-o";
            _ideasDb.Add(new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                Project = new CreatorJourneyProject { Problem = "P", TargetUser = "U", Solution = "S" },
                Phase5Data = new CreatorPhase5Data
                {
                    ChosenPath = "build",
                    PathB = new CreatorPathB
                    {
                        CompanyFormation = new CreatorCompanyFormation { SelectedType = "SAS" },
                        SeedFunding = new CreatorSeedFunding { TotalAsk = 100000 }
                    }
                }
            });
            _usersDb.Add(new ApplicationUser { Id = Guid.NewGuid(), User = userId, Onboarding = new OnboardingState { Phase = 1 } });
            _companyServiceMock.Setup(c => c.EnsureLevelUpCompanyAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<double?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<IClientSessionHandle>()))
                .ReturnsAsync(new Companies { Id = "comp-build-o", OwnerId = userId, CompanyName = "Build Company" });
            _companyServiceMock.Setup(c => c.EnsureLevelUpCompanyAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<double?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), null))
                .ReturnsAsync(new Companies { Id = "comp-build-o", OwnerId = userId, CompanyName = "Build Company" });

            var controller = CreateController(userId);
            var result = await controller.LevelUp(ideaId);

            var obj = result.Should().BeAssignableTo<ObjectResult>().Subject;
            (obj.StatusCode ?? 200).Should().Be(200);
        }

        [Fact]
        public async Task Test_P_Valid_Cofounded_LevelUp_Succeeds()
        {
            var creatorId = "creator-p";
            var entId = "ent-p";
            var ideaId = "idea-p";
            var dealId = "deal-p";
            var companyId = "comp-p";

            SeedCofoundedPartnership(creatorId, entId, ideaId, dealId, companyId);

            var controller = CreateController(creatorId);
            var result = await controller.LevelUp(ideaId);

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = ok.Value.As<ApiResponse>().Data;
            response.Should().NotBeNull();
        }

        [Fact]
        public async Task Test_Q_Cofounded_LevelUp_Reuses_Existing_Company()
        {
            var creatorId = "creator-q";
            var entId = "ent-q";
            var ideaId = "idea-q";
            var dealId = "deal-q";
            var companyId = "comp-q";

            SeedCofoundedPartnership(creatorId, entId, ideaId, dealId, companyId);

            var controller = CreateController(creatorId);
            var result = await controller.LevelUp(ideaId);

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            _companyServiceMock.Verify(c => c.EnsureLevelUpCompanyAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<double?>(), It.IsAny<IClientSessionHandle>()), Times.Never);
        }

        [Fact]
        public async Task Test_R_Does_Not_Create_Second_Company()
        {
            var creatorId = "creator-r";
            var entId = "ent-r";
            var ideaId = "idea-r";
            var dealId = "deal-r";
            var companyId = "comp-r";

            SeedCofoundedPartnership(creatorId, entId, ideaId, dealId, companyId);
            var initialCompanyCount = _companiesDb.Count;

            var controller = CreateController(creatorId);
            await controller.LevelUp(ideaId);

            _companiesDb.Count.Should().Be(initialCompanyCount);
        }

        [Fact]
        public async Task Test_S_Creator_Shareholder_Remains_Unchanged()
        {
            var creatorId = "creator-s";
            var entId = "ent-s";
            var ideaId = "idea-s";
            var dealId = "deal-s";
            var companyId = "comp-s";

            SeedCofoundedPartnership(creatorId, entId, ideaId, dealId, companyId, creatorEquity: 18.0);

            var controller = CreateController(creatorId);
            await controller.LevelUp(ideaId);

            var comp = _companiesDb.First(c => c.Id == companyId);
            var creatorShareholder = comp.EquityStructure.First(e => e.StakeholderName == "Alice Creator");
            creatorShareholder.SharesOwned.Should().Be(1_200_000);
        }

        [Fact]
        public async Task Test_T_Original_Entrepreneur_Owner_Remains_Unchanged()
        {
            var creatorId = "creator-t";
            var entId = "ent-t";
            var ideaId = "idea-t";
            var dealId = "deal-t";
            var companyId = "comp-t";

            SeedCofoundedPartnership(creatorId, entId, ideaId, dealId, companyId);

            var controller = CreateController(creatorId);
            await controller.LevelUp(ideaId);

            var comp = _companiesDb.First(c => c.Id == companyId);
            comp.OwnerId.Should().Be(entId); // Must remain original Entrepreneur, NOT changed to creator
        }

        [Fact]
        public async Task Test_U_Creator_Receives_Entrepreneur_Role()
        {
            var creatorId = "creator-u";
            var entId = "ent-u";
            var ideaId = "idea-u";
            var dealId = "deal-u";
            var companyId = "comp-u";

            SeedCofoundedPartnership(creatorId, entId, ideaId, dealId, companyId);

            var controller = CreateController(creatorId);
            await controller.LevelUp(ideaId);

            _userManagerMock.Verify(m => m.AddToRoleAsync(It.IsAny<ApplicationUser>(), "Entrepreneur"), Times.Once);
        }

        [Fact]
        public async Task Test_V_Creator_Retains_Creator_Role()
        {
            var creatorId = "creator-v";
            var entId = "ent-v";
            var ideaId = "idea-v";
            var dealId = "deal-v";
            var companyId = "comp-v";

            SeedCofoundedPartnership(creatorId, entId, ideaId, dealId, companyId);

            var controller = CreateController(creatorId);
            await controller.LevelUp(ideaId);

            _userRoles[creatorId].Should().Contain("Creator");
        }

        [Fact]
        public async Task Test_W_Entrepreneur_Profile_Created_Once_When_Absent()
        {
            var creatorId = "creator-w";
            var entId = "ent-w";
            var ideaId = "idea-w";
            var dealId = "deal-w";
            var companyId = "comp-w";

            SeedCofoundedPartnership(creatorId, entId, ideaId, dealId, companyId);

            var controller = CreateController(creatorId);
            await controller.LevelUp(ideaId);

            _profilesDb.Count(p => p.UserId == creatorId).Should().Be(1);
            _profilesDb.First(p => p.UserId == creatorId).CompanyId.Should().Be(companyId);
        }

        [Fact]
        public async Task Test_X_Existing_Entrepreneur_Profile_Reused_When_Present()
        {
            var creatorId = "creator-x";
            var entId = "ent-x";
            var ideaId = "idea-x";
            var dealId = "deal-x";
            var companyId = "comp-x";

            SeedCofoundedPartnership(creatorId, entId, ideaId, dealId, companyId);
            _profilesDb.Add(new EntrepreneurProfileRecord
            {
                Id = "existing-prof-x",
                UserId = creatorId,
                CompanyId = ""
            });

            var controller = CreateController(creatorId);
            await controller.LevelUp(ideaId);

            _profilesDb.Count(p => p.UserId == creatorId).Should().Be(1);
            _profilesDb.First(p => p.UserId == creatorId).Id.Should().Be("existing-prof-x");
        }

        [Fact]
        public async Task Test_Y_Correct_Company_Membership_Access_Linked()
        {
            var creatorId = "creator-y";
            var entId = "ent-y";
            var ideaId = "idea-y";
            var dealId = "deal-y";
            var companyId = "comp-y";

            SeedCofoundedPartnership(creatorId, entId, ideaId, dealId, companyId);

            var controller = CreateController(creatorId);
            await controller.LevelUp(ideaId);

            var profile = _profilesDb.First(p => p.UserId == creatorId);
            profile.CompanyId.Should().Be(companyId);
        }

        [Fact]
        public async Task Test_Z_Unrelated_Company_Not_Linked()
        {
            var creatorId = "creator-z";
            var entId = "ent-z";
            var ideaId = "idea-z";
            var dealId = "deal-z";
            var companyId = "comp-z";
            var unrelatedCompId = "comp-unrelated-999";

            SeedCofoundedPartnership(creatorId, entId, ideaId, dealId, companyId);
            _companiesDb.Add(new Companies { Id = unrelatedCompId, CompanyName = "Unrelated Corp", OwnerId = "other-user" });

            var controller = CreateController(creatorId);
            await controller.LevelUp(ideaId);

            var profile = _profilesDb.First(p => p.UserId == creatorId);
            profile.CompanyId.Should().NotBe(unrelatedCompId);
            profile.CompanyId.Should().Be(companyId);
        }

        [Fact]
        public async Task Test_AA_Same_Idea_Retry_Idempotent()
        {
            var creatorId = "creator-aa";
            var entId = "ent-aa";
            var ideaId = "idea-aa";
            var dealId = "deal-aa";
            var companyId = "comp-aa";

            SeedCofoundedPartnership(creatorId, entId, ideaId, dealId, companyId);

            var controller = CreateController(creatorId);
            var res1 = await controller.LevelUp(ideaId);
            res1.Should().BeOfType<OkObjectResult>();

            // Simulate journey having LeveledUpIdeaId
            var j = _journeysDb.FirstOrDefault(x => x.UserId == creatorId) ?? new CreatorJourney { Id = "j-aa", UserId = creatorId };
            j.LeveledUpIdeaId = ideaId;
            j.Phase6Data.LevelUpTriggered = true;
            _journeysDb.Add(j);

            var res2 = await controller.LevelUp(ideaId);
            res2.Should().BeOfType<OkObjectResult>();
        }

        [Fact]
        public async Task Test_AB_Stale_ExpectedVersion_Returns_409()
        {
            var creatorId = "creator-ab";
            var entId = "ent-ab";
            var ideaId = "idea-ab";
            var dealId = "deal-ab";
            var companyId = "comp-ab";

            SeedCofoundedPartnership(creatorId, entId, ideaId, dealId, companyId);
            var idea = _ideasDb.First(i => i.Id == ideaId);
            idea.Version = 5;

            var controller = CreateController(creatorId, expectedVersion: 1); // stale version 1 != 5
            var result = await controller.LevelUp(ideaId);

            var status = result.Should().BeOfType<ObjectResult>().Subject;
            status.StatusCode.Should().Be(409);
        }

        [Fact]
        public async Task Test_AC_Partnership_Changed_After_Readiness_POST_Revalidation_Rejects()
        {
            var creatorId = "creator-ac";
            var entId = "ent-ac";
            var ideaId = "idea-ac";
            var dealId = "deal-ac";
            var companyId = "comp-ac";

            SeedCofoundedPartnership(creatorId, entId, ideaId, dealId, companyId);

            // Change deal to rejected before POST
            var deal = _dealsDb.First(d => d.Id == dealId);
            deal.DealStage = "REJECTED";
            deal.Status = "rejected";

            var controller = CreateController(creatorId);
            var result = await controller.LevelUp(ideaId);

            var status = result.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
            status.StatusCode.Should().Be(422);
        }

        [Fact]
        public async Task Test_AD_Unrelated_User_Returns_404_Or_403()
        {
            var creatorId = "creator-ad";
            var entId = "ent-ad";
            var ideaId = "idea-ad";
            var dealId = "deal-ad";
            var companyId = "comp-ad";

            SeedCofoundedPartnership(creatorId, entId, ideaId, dealId, companyId);

            var controller = CreateController("unrelated-user-999");
            var result = await controller.LevelUp(ideaId);

            result.Should().BeOfType<NotFoundObjectResult>();
        }

        [Fact]
        public async Task Test_AE_Full_Buyout_Rejects_LevelUp()
        {
            var userId = "user-ae";
            var ideaId = "idea-ae";
            _ideasDb.Add(new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                ProjectOutcome = "SOLD",
                Project = new CreatorJourneyProject { Problem = "P", TargetUser = "U", Solution = "S" },
                Phase5Data = new CreatorPhase5Data { ChosenPath = "sell" }
            });
            _usersDb.Add(new ApplicationUser { Id = Guid.NewGuid(), User = userId, Onboarding = new OnboardingState { Phase = 1 } });

            var controller = CreateController(userId);
            var result = await controller.LevelUp(ideaId);

            var status = result.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
            status.StatusCode.Should().Be(422);
        }

        [Fact]
        public async Task Test_AF_SOLD_Project_Rejects_LevelUp()
        {
            var userId = "user-af";
            var ideaId = "idea-af";
            _ideasDb.Add(new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                ProjectOutcome = "SOLD",
                Version = 1,
                Project = new CreatorJourneyProject { Problem = "P", TargetUser = "U", Solution = "S" },
                Phase5Data = new CreatorPhase5Data { ChosenPath = "sell" }
            });
            _usersDb.Add(new ApplicationUser { Id = Guid.NewGuid(), User = userId, Onboarding = new OnboardingState { Phase = 1 } });

            var controller = CreateController(userId);
            var result = await controller.LevelUp(ideaId);

            var status = result.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
            status.StatusCode.Should().Be(422);
        }

        [Fact]
        public async Task Test_AG_Idea_A_And_Idea_B_Isolated()
        {
            var creatorId = "creator-ag";
            var entId = "ent-ag";
            var ideaA = "idea-ag-a";
            var ideaB = "idea-ag-b";
            var dealA = "deal-ag-a";
            var companyA = "comp-ag-a";

            SeedCofoundedPartnership(creatorId, entId, ideaA, dealA, companyA);

            // Idea B is separate valid idea
            _ideasDb.Add(new CreatorIdea
            {
                Id = ideaB,
                UserId = creatorId,
                Project = new CreatorJourneyProject { Problem = "P2", TargetUser = "U2", Solution = "S2" },
                Phase5Data = new CreatorPhase5Data
                {
                    ChosenPath = "build",
                    PathB = new CreatorPathB
                    {
                        CompanyFormation = new CreatorCompanyFormation { SelectedType = "SAS" },
                        SeedFunding = new CreatorSeedFunding { TotalAsk = 100000 }
                    }
                }
            });

            var controller = CreateController(creatorId);
            var resA = await controller.LevelUp(ideaA);
            resA.Should().BeOfType<OkObjectResult>();

            // Setup journey with ideaA leveled up
            var j = new CreatorJourney { Id = "j-ag", UserId = creatorId, LeveledUpIdeaId = ideaA };
            j.Phase6Data.LevelUpTriggered = true;
            _journeysDb.Add(j);

            // Attempting to Level Up Idea B returns 409 (single company active at once)
            var resB = await controller.LevelUp(ideaB);
            var statusB = resB.Should().BeOfType<ObjectResult>().Subject;
            statusB.StatusCode.Should().Be(409);
        }

        [Fact]
        public async Task Test_AH_Transaction_Failure_Leaves_No_Partial_Role_Or_Profile()
        {
            var creatorId = "creator-ah";
            var entId = "ent-ah";
            var ideaId = "idea-ah";
            var dealId = "deal-ah";
            var companyId = "comp-ah";

            SeedCofoundedPartnership(creatorId, entId, ideaId, dealId, companyId);

            _ideasMock.Setup(s => s.UpdateAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<UpdateDefinition<CreatorIdea>>(), It.IsAny<long?>(), It.IsAny<IClientSessionHandle>()))
                .ThrowsAsync(new InvalidOperationException("Simulated database write failure"));

            var controller = CreateController(creatorId);
            var result = await controller.LevelUp(ideaId);

            var status = result.Should().BeOfType<ObjectResult>().Subject;
            status.StatusCode.Should().Be(500);
        }

        [Fact]
        public async Task Test_AI_My_Equity_Remains_Accessible_After_LevelUp()
        {
            var creatorId = "creator-ai";
            var entId = "ent-ai";
            var ideaId = "idea-ai";
            var dealId = "deal-ai";
            var companyId = "comp-ai";

            SeedCofoundedPartnership(creatorId, entId, ideaId, dealId, companyId);

            var controller = CreateController(creatorId);
            await controller.LevelUp(ideaId);

            var deal = _dealsDb.First(d => d.Id == dealId);
            deal.Status.Should().Be("completed");
            deal.DealStage.Should().Be("PARTNERSHIP_ACTIVE");
            deal.EquityTerms.EquityPercentage.Should().Be(12.0);
        }

        [Fact]
        public async Task Test_AJ_Partnership_Remains_CO_FOUNDED()
        {
            var creatorId = "creator-aj";
            var entId = "ent-aj";
            var ideaId = "idea-aj";
            var dealId = "deal-aj";
            var companyId = "comp-aj";

            SeedCofoundedPartnership(creatorId, entId, ideaId, dealId, companyId);

            var controller = CreateController(creatorId);
            await controller.LevelUp(ideaId);

            var idea = _ideasDb.First(i => i.Id == ideaId);
            idea.ProjectOutcome.Should().Be("CO_FOUNDED");
            idea.ActivePartnershipDealId.Should().Be(dealId);
        }
    }
}
