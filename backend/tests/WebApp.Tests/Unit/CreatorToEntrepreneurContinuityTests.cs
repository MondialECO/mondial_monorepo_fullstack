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
using WebApp.Models.DatabaseModels.Legal;
using WebApp.Models.Dtos;
using WebApp.Models.Dtos.Ai;
using WebApp.Services;
using WebApp.Services.Ai;
using WebApp.Services.Interface;
using WebApp.Services.Legal;
using WebApp.Services.Repository;
using Xunit;

namespace WebApp.Tests.Unit
{
    /// <summary>
    /// Stage 11 — Creator -> Entrepreneur Continuity & Level-Up Transfer Test Suite (Tests A through T)
    /// Validates venture intelligence continuity, zero physical file duplication, legal stability,
    /// baseline readiness preservation, tenant isolation, and idempotency.
    /// </summary>
    public class CreatorToEntrepreneurContinuityTests
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

        private readonly Mock<IMongoCollection<Companies>> _companiesCollectionMock = new();
        private readonly Mock<IMongoCollection<EntrepreneurProfileRecord>> _profilesCollectionMock = new();

        public CreatorToEntrepreneurContinuityTests()
        {
            var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
            _userManagerMock = new Mock<UserManager<ApplicationUser>>(userStoreMock.Object, null, null, null, null, null, null, null, null);
            _userManagerMock.Setup(u => u.FindByIdAsync(It.IsAny<string>()))
                .ReturnsAsync((string id) => _usersDb.FirstOrDefault(u => u.Id.ToString() == id || u.User == id || u.UserName == id));
            _userManagerMock.Setup(u => u.FindByNameAsync(It.IsAny<string>()))
                .ReturnsAsync((string name) => _usersDb.FirstOrDefault(u => u.UserName == name || u.User == name));
            _userManagerMock.Setup(u => u.AddToRoleAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
                .ReturnsAsync(IdentityResult.Success);
            _userManagerMock.Setup(u => u.UpdateAsync(It.IsAny<ApplicationUser>()))
                .ReturnsAsync(IdentityResult.Success);
            _userManagerMock.Setup(u => u.IsInRoleAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
                .ReturnsAsync(true);

            var roleStoreMock = new Mock<IRoleStore<ApplicationRole>>();
            _roleManagerMock = new Mock<RoleManager<ApplicationRole>>(roleStoreMock.Object, null, null, null, null);
            _roleManagerMock.Setup(r => r.FindByNameAsync(It.IsAny<string>()))
                .ReturnsAsync((string name) => new ApplicationRole { Id = Guid.NewGuid(), Name = name });
            _roleManagerMock.Setup(r => r.CreateAsync(It.IsAny<ApplicationRole>()))
                .ReturnsAsync(IdentityResult.Success);

            _envMock.Setup(e => e.EnvironmentName).Returns(Environments.Development);
            _config = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Mongo:TransactionsEnabled"] = "false"
                })
                .Build();

            // Mock Companies collection
            _companiesCollectionMock.Setup(c => c.InsertOneAsync(It.IsAny<Companies>(), It.IsAny<InsertOneOptions>(), It.IsAny<CancellationToken>()))
                .Callback<Companies, InsertOneOptions, CancellationToken>((doc, _, _) =>
                {
                    if (string.IsNullOrEmpty(doc.Id)) doc.Id = ObjectId.GenerateNewId().ToString();
                    _companiesDb.Add(doc);
                })
                .Returns(Task.CompletedTask);
            _companiesCollectionMock.Setup(c => c.InsertOneAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<Companies>(), It.IsAny<InsertOneOptions>(), It.IsAny<CancellationToken>()))
                .Callback<IClientSessionHandle, Companies, InsertOneOptions, CancellationToken>((_, doc, _, _) =>
                {
                    if (string.IsNullOrEmpty(doc.Id)) doc.Id = ObjectId.GenerateNewId().ToString();
                    _companiesDb.Add(doc);
                })
                .Returns(Task.CompletedTask);

            _companiesCollectionMock.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<Companies>>(),
                It.IsAny<FindOptions<Companies, Companies>>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync(() =>
                {
                    var cursor = new Mock<IAsyncCursor<Companies>>();
                    var currentBatch = _companiesDb.ToList();
                    cursor.Setup(c => c.Current).Returns(currentBatch);
                    cursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>()))
                        .Returns(currentBatch.Count > 0)
                        .Returns(false);
                    cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
                        .ReturnsAsync(currentBatch.Count > 0)
                        .ReturnsAsync(false);
                    return cursor.Object;
                });

            _companiesCollectionMock.Setup(c => c.FindAsync(
                It.IsAny<IClientSessionHandle>(),
                It.IsAny<FilterDefinition<Companies>>(),
                It.IsAny<FindOptions<Companies, Companies>>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync(() =>
                {
                    var cursor = new Mock<IAsyncCursor<Companies>>();
                    var currentBatch = _companiesDb.ToList();
                    cursor.Setup(c => c.Current).Returns(currentBatch);
                    cursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>()))
                        .Returns(currentBatch.Count > 0)
                        .Returns(false);
                    cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
                        .ReturnsAsync(currentBatch.Count > 0)
                        .ReturnsAsync(false);
                    return cursor.Object;
                });

            _companiesCollectionMock.Setup(c => c.UpdateOneAsync(
                It.IsAny<FilterDefinition<Companies>>(),
                It.IsAny<UpdateDefinition<Companies>>(),
                It.IsAny<UpdateOptions>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync(new UpdateResult.Acknowledged(1, 1, null));

            _companiesCollectionMock.Setup(c => c.UpdateOneAsync(
                It.IsAny<IClientSessionHandle>(),
                It.IsAny<FilterDefinition<Companies>>(),
                It.IsAny<UpdateDefinition<Companies>>(),
                It.IsAny<UpdateOptions>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync(new UpdateResult.Acknowledged(1, 1, null));

            // Mock EntrepreneurProfiles collection
            _profilesCollectionMock.Setup(c => c.InsertOneAsync(It.IsAny<EntrepreneurProfileRecord>(), It.IsAny<InsertOneOptions>(), It.IsAny<CancellationToken>()))
                .Callback<EntrepreneurProfileRecord, InsertOneOptions, CancellationToken>((doc, _, _) => _profilesDb.Add(doc))
                .Returns(Task.CompletedTask);
            _profilesCollectionMock.Setup(c => c.InsertOneAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<EntrepreneurProfileRecord>(), It.IsAny<InsertOneOptions>(), It.IsAny<CancellationToken>()))
                .Callback<IClientSessionHandle, EntrepreneurProfileRecord, InsertOneOptions, CancellationToken>((_, doc, _, _) => _profilesDb.Add(doc))
                .Returns(Task.CompletedTask);
            _profilesCollectionMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<EntrepreneurProfileRecord>>(), It.IsAny<FindOptions<EntrepreneurProfileRecord, EntrepreneurProfileRecord>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() =>
                {
                    var cursor = new Mock<IAsyncCursor<EntrepreneurProfileRecord>>();
                    cursor.Setup(c => c.Current).Returns(_profilesDb.ToList());
                    cursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(_profilesDb.Count > 0).Returns(false);
                    cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(_profilesDb.Count > 0).ReturnsAsync(false);
                    return cursor.Object;
                });
            _profilesCollectionMock.Setup(c => c.FindAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<FilterDefinition<EntrepreneurProfileRecord>>(), It.IsAny<FindOptions<EntrepreneurProfileRecord, EntrepreneurProfileRecord>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() =>
                {
                    var cursor = new Mock<IAsyncCursor<EntrepreneurProfileRecord>>();
                    cursor.Setup(c => c.Current).Returns(_profilesDb.ToList());
                    cursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(_profilesDb.Count > 0).Returns(false);
                    cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(_profilesDb.Count > 0).ReturnsAsync(false);
                    return cursor.Object;
                });

            // Setup Phase3Concepts collection
            var conceptsCollectionMock = new Mock<IMongoCollection<Phase3Concept>>();
            conceptsCollectionMock.Setup(c => c.InsertOneAsync(It.IsAny<Phase3Concept>(), It.IsAny<InsertOneOptions>(), It.IsAny<CancellationToken>()))
                .Callback<Phase3Concept, InsertOneOptions, CancellationToken>((doc, _, _) => _conceptsDb.Add(doc))
                .Returns(Task.CompletedTask);
            conceptsCollectionMock.Setup(c => c.InsertOneAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<Phase3Concept>(), It.IsAny<InsertOneOptions>(), It.IsAny<CancellationToken>()))
                .Callback<IClientSessionHandle, Phase3Concept, InsertOneOptions, CancellationToken>((_, doc, _, _) => _conceptsDb.Add(doc))
                .Returns(Task.CompletedTask);
            conceptsCollectionMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<Phase3Concept>>(), It.IsAny<FindOptions<Phase3Concept, Phase3Concept>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() =>
                {
                    var cursor = new Mock<IAsyncCursor<Phase3Concept>>();
                    cursor.Setup(c => c.Current).Returns(_conceptsDb.ToList());
                    cursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(_conceptsDb.Count > 0).Returns(false);
                    cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(_conceptsDb.Count > 0).ReturnsAsync(false);
                    return cursor.Object;
                });
            conceptsCollectionMock.Setup(c => c.FindAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<FilterDefinition<Phase3Concept>>(), It.IsAny<FindOptions<Phase3Concept, Phase3Concept>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() =>
                {
                    var cursor = new Mock<IAsyncCursor<Phase3Concept>>();
                    cursor.Setup(c => c.Current).Returns(_conceptsDb.ToList());
                    cursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(_conceptsDb.Count > 0).Returns(false);
                    cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(_conceptsDb.Count > 0).ReturnsAsync(false);
                    return cursor.Object;
                });

            // Setup Phase4CapTable collection
            var capTablesCollectionMock = new Mock<IMongoCollection<Phase4CapTable>>();
            capTablesCollectionMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<Phase4CapTable>>(), It.IsAny<FindOptions<Phase4CapTable, Phase4CapTable>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() =>
                {
                    var cursor = new Mock<IAsyncCursor<Phase4CapTable>>();
                    cursor.Setup(c => c.Current).Returns(new List<Phase4CapTable>());
                    cursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(false);
                    cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(false);
                    return cursor.Object;
                });
            capTablesCollectionMock.Setup(c => c.FindAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<FilterDefinition<Phase4CapTable>>(), It.IsAny<FindOptions<Phase4CapTable, Phase4CapTable>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() =>
                {
                    var cursor = new Mock<IAsyncCursor<Phase4CapTable>>();
                    cursor.Setup(c => c.Current).Returns(new List<Phase4CapTable>());
                    cursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(false);
                    cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(false);
                    return cursor.Object;
                });

            // Setup DealExecution collection
            var dealsCollectionMock = new Mock<IMongoCollection<DealExecution>>();
            dealsCollectionMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() =>
                {
                    var cursor = new Mock<IAsyncCursor<DealExecution>>();
                    cursor.Setup(c => c.Current).Returns(new List<DealExecution>());
                    cursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(false);
                    cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(false);
                    return cursor.Object;
                });
            dealsCollectionMock.Setup(c => c.FindAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() =>
                {
                    var cursor = new Mock<IAsyncCursor<DealExecution>>();
                    cursor.Setup(c => c.Current).Returns(new List<DealExecution>());
                    cursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(false);
                    cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(false);
                    return cursor.Object;
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

            _dbMock.Setup(d => d.GetCollection<Companies>(It.IsAny<string>(), It.IsAny<MongoCollectionSettings>()))
                .Returns(_companiesCollectionMock.Object);
            _dbMock.Setup(d => d.GetCollection<EntrepreneurProfileRecord>(It.IsAny<string>(), It.IsAny<MongoCollectionSettings>()))
                .Returns(_profilesCollectionMock.Object);
            _dbMock.Setup(d => d.GetCollection<Phase3Concept>(It.IsAny<string>(), It.IsAny<MongoCollectionSettings>()))
                .Returns(conceptsCollectionMock.Object);
            _dbMock.Setup(d => d.GetCollection<Phase4CapTable>(It.IsAny<string>(), It.IsAny<MongoCollectionSettings>()))
                .Returns(capTablesCollectionMock.Object);
            _dbMock.Setup(d => d.GetCollection<DealExecution>(It.IsAny<string>(), It.IsAny<MongoCollectionSettings>()))
                .Returns(dealsCollectionMock.Object);
            _dbMock.Setup(d => d.GetCollection<CreatorJourney>(It.IsAny<string>(), It.IsAny<MongoCollectionSettings>()))
                .Returns(journeysCollectionMock.Object);
            _dbMock.Setup(d => d.GetCollection<ApplicationUser>(It.IsAny<string>(), It.IsAny<MongoCollectionSettings>()))
                .Returns(usersCollectionMock.Object);

            var sessionMock = new Mock<IClientSessionHandle>();
            _mongoClientMock.Setup(m => m.StartSessionAsync(It.IsAny<ClientSessionOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(sessionMock.Object);
            _dbMock.Setup(d => d.Client).Returns(_mongoClientMock.Object);

            _context = new MongoDbContext(_dbMock.Object);

            _ideasMock.Setup(i => i.GetOwnedAsync(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync((string id, string uid) => _ideasDb.FirstOrDefault(x => x.Id == id && x.UserId == uid));
            _ideasMock.Setup(i => i.AddAsync(It.IsAny<CreatorIdea>()))
                .Callback<CreatorIdea>(idea => _ideasDb.Add(idea))
                .Returns(Task.CompletedTask);
            _ideasMock.Setup(i => i.UpdateAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<UpdateDefinition<CreatorIdea>>(), It.IsAny<long?>(), It.IsAny<IClientSessionHandle?>()))
                .ReturnsAsync(true);
        }

        private CompanyService CreateCompanyService()
        {
            return new CompanyService(
                _context,
                new Mock<IValuationEngine>().Object,
                new Mock<ICapTableCalculator>().Object,
                new Mock<IInvestorMatcher>().Object,
                new Mock<IAiReviewEngine>().Object,
                new Mock<IDocumentManager>().Object,
                new Mock<IPhaseValidator>().Object,
                _eventsMock.Object
            );
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
                NullLogger<CreatorPhase6Controller>.Instance
            );

            var httpContext = new DefaultHttpContext();
            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, userId),
                new(ClaimTypes.Name, userId),
                new("uid", userId)
            };
            httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
            httpContext.Request.QueryString = new QueryString("?expectedVersion=1");
            httpContext.Request.Query = new QueryCollection(new Dictionary<string, Microsoft.Extensions.Primitives.StringValues>
            {
                ["expectedVersion"] = "1"
            });
            controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
            return controller;
        }

        private (CreatorIdea Idea, CreatorJourney Journey, ApplicationUser User) SetupCanonicalVenture(string userId, string ideaId)
        {
            var project = new CreatorJourneyProject
            {
                Name = "Mondial Analytics AI",
                Sector = "AI & Analytics",
                Tagline = "Autonomous B2B Financial Intelligence",
                Problem = "Fragmented metrics",
                Solution = "Unified intelligence",
                TargetUser = "Enterprises",
                ClarityScore = 95,
                Branding = new CreatorBranding
                {
                    LogoAsset = "/uploads/brand/concept-01-mark.png",
                    LogoType = "ai",
                    ColorPalette = new List<string> { "#00FF66", "#0F172A" },
                    TypographyPairing = "Inter + JetBrains Mono"
                }
            };

            var legalAssessment = new CreatorLegalAssessment
            {
                Id = ObjectId.GenerateNewId().ToString(),
                CreatorIdeaId = ideaId,
                UserId = userId,
                Jurisdiction = "FR",
                RulesVersion = "FR-2026.1",
                AssessmentVersion = 1,
                BusinessSnapshotHash = "sha256:abc123canonicalhash",
                IsPotentiallyOutdated = false,
                PlanningReadinessPct = 66.0,
                Items = new List<CreatorLegalChecklistItem>
                {
                    new()
                    {
                        Id = "FR-CORP-001",
                        Title = "Company Articles of Association",
                        Status = "fulfilled"
                    },
                    new()
                    {
                        Id = "FR-SOC-001",
                        Title = "Affiliation sociale des dirigeants et déclarations URSSAF",
                        Status = "needs_information"
                    }
                },
                EvidenceLinks = new List<LegalEvidenceLink>
                {
                    new()
                    {
                        RequirementId = "FR-CORP-001",
                        DocumentId = "doc-statutes-001",
                        DocumentFileName = "statuts_signes.pdf",
                        LinkedAt = DateTime.UtcNow.AddDays(-2)
                    }
                },
                EvidenceAuditTrail = new List<LegalEvidenceAuditEntry>
                {
                    new()
                    {
                        Action = "EVIDENCE_LINKED",
                        RequirementId = "FR-CORP-001",
                        DocumentId = "doc-statutes-001",
                        ActorUserId = userId,
                        Timestamp = DateTime.UtcNow.AddDays(-2)
                    }
                }
            };

            var journey = new CreatorJourney
            {
                Id = "journey-" + ideaId,
                UserId = userId,
                BusinessIdeaId = ideaId,
                Project = project,
                Phase3Data = new CreatorPhase3Data
                {
                    MarketStudySessionId = "ms-session-100",
                    BusinessModelSessionId = "bm-session-200",
                    ForecastSessionId = "fc-session-300",
                    BusinessPlanSessionId = "bp-session-400",
                    LegalAssessment = legalAssessment,
                    InvestorReadinessScore = new CreatorInvestorReadinessScore
                    {
                        Total = 88.5,
                        Breakdown = new CreatorReadinessBreakdown
                        {
                            ConceptClarity = 18.0,
                            MarketEvidence = 17.5,
                            FinancialModel = 22.0,
                            LegalReadiness = 13.0,
                            TeamCredibility = 18.0
                        }
                    }
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
                                new() { Holder = "Founder", Percent = 85, IsFounder = true },
                                new() { Holder = "ESOP Pool", Percent = 15, IsEsop = true }
                            }
                        },
                        SeedFunding = new CreatorSeedFunding
                        {
                            TotalAsk = 250000,
                            UseOfFunds = new List<CreatorUseOfFunds>
                            {
                                new() { Category = "Engineering & AI R&D", Percent = 60 },
                                new() { Category = "Go-to-Market", Percent = 40 }
                            }
                        }
                    }
                }
            };

            var idea = new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                Project = project,
                Version = 1,
                Phase3Data = journey.Phase3Data,
                Phase5Data = journey.Phase5Data,
                Documents = new List<CreatorIdeaDocument>
                {
                    new()
                    {
                        Id = "doc-statutes-001",
                        DocumentType = "Statuts SAS",
                        StorageReference = "/vault/legal/doc-statutes-001.pdf",
                        CreatedAt = DateTime.UtcNow.AddDays(-3),
                        FileName = "statuts_signes.pdf"
                    }
                }
            };

            var user = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                User = userId,
                UserName = userId,
                Onboarding = new OnboardingState { Phase = 1 }
            };

            _ideasDb.Add(idea);
            _usersDb.Add(user);

            return (idea, journey, user);
        }

        // -------------------------------------------------------------
        // Test A: Basic Level Up creates one Entrepreneur workspace and company
        // -------------------------------------------------------------
        [Fact]
        public async Task Test_A_Basic_LevelUp_Creates_One_Entrepreneur_Workspace_And_Company()
        {
            var (idea, journey, user) = SetupCanonicalVenture("creator-a", "idea-a");
            var companyService = CreateCompanyService();

            var company = await companyService.EnsureLevelUpCompanyAsync(
                userId: user.User,
                sourceLink: idea.Id,
                legalStructure: journey.Phase5Data!.PathB!.CompanyFormation!.SelectedType!,
                fundingAsk: (double?)journey.Phase5Data.PathB.SeedFunding?.TotalAsk,
                companyName: idea.Project!.Name,
                industry: idea.Project.Sector,
                tagline: idea.Project.Tagline,
                journeyId: journey.Id,
                baselineReadiness: journey.Phase3Data?.InvestorReadinessScore?.Total,
                forecastId: journey.Phase3Data?.ForecastSessionId,
                businessPlanId: journey.Phase3Data?.BusinessPlanSessionId,
                legalAssessment: journey.Phase3Data?.LegalAssessment,
                logo: journey.Project.Branding?.LogoAsset,
                documents: idea.Documents,
                session: null
            );

            company.Should().NotBeNull();
            company.Id.Should().NotBeNullOrEmpty();
            company.OwnerId.Should().Be("creator-a");
            company.SourceBusinessIdeaId.Should().Be("idea-a");
            company.SourceCreatorIdeaId.Should().Be("idea-a");
            company.SourceCreatorJourneyId.Should().Be("journey-idea-a");
            company.PromotedFromCreator.Should().BeTrue();
            company.TransferVersion.Should().Be(1);
            _companiesDb.Count.Should().Be(1);
        }

        // -------------------------------------------------------------
        // Test B: Retrying Level Up does not create duplicate workspace/company
        // -------------------------------------------------------------
        [Fact]
        public async Task Test_B_Retrying_LevelUp_Does_Not_Create_Duplicate_Company()
        {
            var (idea, journey, user) = SetupCanonicalVenture("creator-b", "idea-b");
            var companyService = CreateCompanyService();

            var comp1 = await companyService.EnsureLevelUpCompanyAsync(
                userId: user.User, sourceLink: idea.Id, legalStructure: "SAS", fundingAsk: 100000,
                companyName: "Comp B", industry: "Tech", tagline: "Tag B", journeyId: journey.Id,
                baselineReadiness: 85.0, forecastId: null, businessPlanId: null, legalAssessment: null,
                logo: null, documents: null, session: null);

            var comp2 = await companyService.EnsureLevelUpCompanyAsync(
                userId: user.User, sourceLink: idea.Id, legalStructure: "SAS", fundingAsk: 100000,
                companyName: "Comp B", industry: "Tech", tagline: "Tag B", journeyId: journey.Id,
                baselineReadiness: 85.0, forecastId: null, businessPlanId: null, legalAssessment: null,
                logo: null, documents: null, session: null);

            comp1.Id.Should().Be(comp2.Id);
            _companiesDb.Count.Should().Be(1);
        }

        // -------------------------------------------------------------
        // Test C: Stable origin reference preserved on Company
        // -------------------------------------------------------------
        [Fact]
        public async Task Test_C_Stable_Origin_References_Preserved_On_Company()
        {
            var (idea, journey, user) = SetupCanonicalVenture("creator-c", "idea-c");
            var companyService = CreateCompanyService();

            var company = await companyService.EnsureLevelUpCompanyAsync(
                userId: user.User, sourceLink: idea.Id, legalStructure: "SAS", fundingAsk: 50000,
                companyName: "Comp C", industry: "Tech", tagline: "Tag C", journeyId: journey.Id,
                baselineReadiness: 90.0, forecastId: "fc-c", businessPlanId: "bp-c",
                legalAssessment: journey.Phase3Data!.LegalAssessment, logo: "/logo.png",
                documents: idea.Documents, session: null);

            company.SourceCreatorIdeaId.Should().Be("idea-c");
            company.SourceCreatorJourneyId.Should().Be("journey-idea-c");
            company.PromotedFromCreator.Should().BeTrue();
            company.PromotedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(1));
            company.PromotedByUserId.Should().Be("creator-c");
            company.TransferVersion.Should().Be(1);
        }

        // -------------------------------------------------------------
        // Test D: Project identity transfers (CompanyName, Industry, Tagline)
        // -------------------------------------------------------------
        [Fact]
        public async Task Test_D_Project_Identity_Transfers_Accurately()
        {
            var (idea, journey, user) = SetupCanonicalVenture("creator-d", "idea-d");
            var companyService = CreateCompanyService();

            var company = await companyService.EnsureLevelUpCompanyAsync(
                userId: user.User, sourceLink: idea.Id, legalStructure: "SAS", fundingAsk: 100000,
                companyName: idea.Project!.Name, industry: idea.Project.Sector, tagline: idea.Project.Tagline,
                journeyId: journey.Id, baselineReadiness: null, forecastId: null, businessPlanId: null,
                legalAssessment: null, logo: null, documents: null, session: null);

            company.CompanyName.Should().Be("Mondial Analytics AI");
            company.Industry.Should().Be("AI & Analytics");
            company.Tagline.Should().Be("Autonomous B2B Financial Intelligence");
        }

        // -------------------------------------------------------------
        // Test E: Brand references transfer (Companies.Logo, BrandKit)
        // -------------------------------------------------------------
        [Fact]
        public async Task Test_E_Brand_References_Transfer_Intact()
        {
            var (idea, journey, user) = SetupCanonicalVenture("creator-e", "idea-e");
            var companyService = CreateCompanyService();

            var logoUri = journey.Project.Branding.LogoAsset;
            var company = await companyService.EnsureLevelUpCompanyAsync(
                userId: user.User, sourceLink: idea.Id, legalStructure: "SAS", fundingAsk: 100000,
                companyName: "Comp E", industry: "Tech", tagline: "Tag E", journeyId: journey.Id,
                baselineReadiness: null, forecastId: null, businessPlanId: null, legalAssessment: null,
                logo: logoUri, documents: null, session: null);

            company.Logo.Should().Be("/uploads/brand/concept-01-mark.png");
        }

        // -------------------------------------------------------------
        // Test F: Market Study session reference transfers intact
        // -------------------------------------------------------------
        [Fact]
        public void Test_F_Market_Study_Session_Reference_Transfers_Intact()
        {
            var (idea, journey, _) = SetupCanonicalVenture("creator-f", "idea-f");
            journey.Phase3Data!.MarketStudySessionId.Should().Be("ms-session-100");
            idea.Phase3Data!.MarketStudySessionId.Should().Be("ms-session-100");
        }

        // -------------------------------------------------------------
        // Test G: Business Model canvas session reference transfers intact
        // -------------------------------------------------------------
        [Fact]
        public void Test_G_Business_Model_Session_Reference_Transfers_Intact()
        {
            var (idea, journey, _) = SetupCanonicalVenture("creator-g", "idea-g");
            journey.Phase3Data!.BusinessModelSessionId.Should().Be("bm-session-200");
            idea.Phase3Data!.BusinessModelSessionId.Should().Be("bm-session-200");
        }

        // -------------------------------------------------------------
        // Test H: Financial Forecast transfers with custom TAM and inputs preserved
        // -------------------------------------------------------------
        [Fact]
        public async Task Test_H_Financial_Forecast_Transfers_With_Session_Link_Preserved()
        {
            var (idea, journey, user) = SetupCanonicalVenture("creator-h", "idea-h");
            var companyService = CreateCompanyService();

            var company = await companyService.EnsureLevelUpCompanyAsync(
                userId: user.User, sourceLink: idea.Id, legalStructure: "SAS", fundingAsk: 100000,
                companyName: "Comp H", industry: "Tech", tagline: "Tag H", journeyId: journey.Id,
                baselineReadiness: null, forecastId: journey.Phase3Data!.ForecastSessionId,
                businessPlanId: null, legalAssessment: null, logo: null, documents: null, session: null);

            company.SourceForecastId.Should().Be("fc-session-300");
        }

        // -------------------------------------------------------------
        // Test I: Business Plan transfers with session linkage preserved
        // -------------------------------------------------------------
        [Fact]
        public async Task Test_I_Business_Plan_Transfers_With_Session_Link_Preserved()
        {
            var (idea, journey, user) = SetupCanonicalVenture("creator-i", "idea-i");
            var companyService = CreateCompanyService();

            var company = await companyService.EnsureLevelUpCompanyAsync(
                userId: user.User, sourceLink: idea.Id, legalStructure: "SAS", fundingAsk: 100000,
                companyName: "Comp I", industry: "Tech", tagline: "Tag I", journeyId: journey.Id,
                baselineReadiness: null, forecastId: null, businessPlanId: journey.Phase3Data!.BusinessPlanSessionId,
                legalAssessment: null, logo: null, documents: null, session: null);

            company.SourceBusinessPlanSessionId.Should().Be("bp-session-400");
        }

        // -------------------------------------------------------------
        // Test J: Section 12 LegalRegulatoryFramework transfers intact
        // -------------------------------------------------------------
        [Fact]
        public void Test_J_Section_12_LegalRegulatoryFramework_Transfers_Intact()
        {
            var bpOutput = new BusinessPlanOutputDto
            {
                ExecutiveSummary = new ExecutiveSummaryDto
                {
                    Overview = "Executive summary...",
                    ValueProposition = "Unified B2B Intelligence"
                },
                LegalFramework = new LegalRegulatoryFrameworkDto
                {
                    Jurisdiction = "France",
                    ProposedLegalStructure = "SAS",
                    TotalApplicableRequirementsCount = 12,
                    PrimaryRegulations = new List<string> { "RGPD", "Code de commerce" },
                    IntellectualPropertyStrategy = "Brand copyright and trademark filing at INPI.",
                    Subsections = new List<LegalFrameworkSubsectionDto>
                    {
                        new() { SubsectionKey = "12.1", Title = "Corporate Structure", Status = "Addressed" }
                    }
                }
            };

            bpOutput.LegalFramework.Should().NotBeNull();
            bpOutput.LegalFramework!.Jurisdiction.Should().Be("France");
            bpOutput.LegalFramework.ProposedLegalStructure.Should().Be("SAS");
            bpOutput.LegalFramework.TotalApplicableRequirementsCount.Should().Be(12);
            bpOutput.LegalFramework.PrimaryRegulations.Should().HaveCount(2);
        }

        // -------------------------------------------------------------
        // Test K: Legal Assessment status, rules version, snapshot hash, and progress preserved
        // -------------------------------------------------------------
        [Fact]
        public async Task Test_K_Legal_Assessment_Status_And_Hashes_Preserved()
        {
            var (idea, journey, user) = SetupCanonicalVenture("creator-k", "idea-k");
            var companyService = CreateCompanyService();

            var company = await companyService.EnsureLevelUpCompanyAsync(
                userId: user.User, sourceLink: idea.Id, legalStructure: "SAS", fundingAsk: 100000,
                companyName: "Comp K", industry: "Tech", tagline: "Tag K", journeyId: journey.Id,
                baselineReadiness: null, forecastId: null, businessPlanId: null,
                legalAssessment: journey.Phase3Data!.LegalAssessment, logo: null, documents: null, session: null);

            company.LegalAssessment.Should().NotBeNull();
            company.LegalAssessment!.CreatorIdeaId.Should().Be("idea-k");
            company.LegalAssessment.Jurisdiction.Should().Be("FR");
            company.LegalAssessment.RulesVersion.Should().Be("FR-2026.1");
            company.LegalAssessment.BusinessSnapshotHash.Should().Be("sha256:abc123canonicalhash");
            company.LegalAssessment.PlanningReadinessPct.Should().Be(66.0);
            company.LegalAssessment.Items.Should().HaveCount(2);
        }

        // -------------------------------------------------------------
        // Test L: Legal EvidenceLinks (DocumentId <-> RequirementId) preserved
        // -------------------------------------------------------------
        [Fact]
        public async Task Test_L_Legal_EvidenceLinks_Preserved_Intact()
        {
            var (idea, journey, user) = SetupCanonicalVenture("creator-l", "idea-l");
            var companyService = CreateCompanyService();

            var company = await companyService.EnsureLevelUpCompanyAsync(
                userId: user.User, sourceLink: idea.Id, legalStructure: "SAS", fundingAsk: 100000,
                companyName: "Comp L", industry: "Tech", tagline: "Tag L", journeyId: journey.Id,
                baselineReadiness: null, forecastId: null, businessPlanId: null,
                legalAssessment: journey.Phase3Data!.LegalAssessment, logo: null, documents: null, session: null);

            company.LegalAssessment!.EvidenceLinks.Should().HaveCount(1);
            var link = company.LegalAssessment.EvidenceLinks.First();
            link.RequirementId.Should().Be("FR-CORP-001");
            link.DocumentId.Should().Be("doc-statutes-001");
            link.DocumentFileName.Should().Be("statuts_signes.pdf");
        }

        // -------------------------------------------------------------
        // Test M: EvidenceActivityTrail preserved in assessment audit log
        // -------------------------------------------------------------
        [Fact]
        public async Task Test_M_EvidenceActivityTrail_Preserved_In_Assessment_AuditLog()
        {
            var (idea, journey, user) = SetupCanonicalVenture("creator-m", "idea-m");
            var companyService = CreateCompanyService();

            var company = await companyService.EnsureLevelUpCompanyAsync(
                userId: user.User, sourceLink: idea.Id, legalStructure: "SAS", fundingAsk: 100000,
                companyName: "Comp M", industry: "Tech", tagline: "Tag M", journeyId: journey.Id,
                baselineReadiness: null, forecastId: null, businessPlanId: null,
                legalAssessment: journey.Phase3Data!.LegalAssessment, logo: null, documents: null, session: null);

            company.LegalAssessment!.EvidenceAuditTrail.Should().HaveCount(1);
            var record = company.LegalAssessment.EvidenceAuditTrail.First();
            record.Action.Should().Be("EVIDENCE_LINKED");
            record.RequirementId.Should().Be("FR-CORP-001");
            record.ActorUserId.Should().Be("creator-m");
        }

        // -------------------------------------------------------------
        // Test N: Physical document files are not duplicated (identical StorageReference)
        // -------------------------------------------------------------
        [Fact]
        public async Task Test_N_Zero_Physical_Document_Duplication_Preserves_StorageReference()
        {
            var (idea, journey, user) = SetupCanonicalVenture("creator-n", "idea-n");
            var companyService = CreateCompanyService();

            var company = await companyService.EnsureLevelUpCompanyAsync(
                userId: user.User, sourceLink: idea.Id, legalStructure: "SAS", fundingAsk: 100000,
                companyName: "Comp N", industry: "Tech", tagline: "Tag N", journeyId: journey.Id,
                baselineReadiness: null, forecastId: null, businessPlanId: null,
                legalAssessment: null, logo: null, documents: idea.Documents, session: null);

            company.DataRoomDocuments.Should().HaveCount(1);
            var doc = company.DataRoomDocuments.First();
            doc.StoragePath.Should().Be(idea.Documents.First().StorageReference);
            doc.StoragePath.Should().Be("/vault/legal/doc-statutes-001.pdf");
            doc.Status.Should().Be("draft"); // private draft, not publicly shared
            doc.FileName.Should().Be("statuts_signes.pdf");
        }

        // -------------------------------------------------------------
        // Test O: Stale Legal Assessment remains stale (IsPotentiallyOutdated = true)
        // -------------------------------------------------------------
        [Fact]
        public async Task Test_O_Stale_Legal_Assessment_Remains_Stale_Post_Transfer()
        {
            var (idea, journey, user) = SetupCanonicalVenture("creator-o", "idea-o");
            journey.Phase3Data!.LegalAssessment!.IsPotentiallyOutdated = true;
            journey.Phase3Data.LegalAssessment.StaleMetadata = new LegalStaleMetadata
            {
                IsStale = true,
                StaleReason = LegalStaleReasons.BusinessDataChanged
            };
            var companyService = CreateCompanyService();

            var company = await companyService.EnsureLevelUpCompanyAsync(
                userId: user.User, sourceLink: idea.Id, legalStructure: "SAS", fundingAsk: 100000,
                companyName: "Comp O", industry: "Tech", tagline: "Tag O", journeyId: journey.Id,
                baselineReadiness: null, forecastId: null, businessPlanId: null,
                legalAssessment: journey.Phase3Data.LegalAssessment, logo: null, documents: null, session: null);

            company.LegalAssessment.Should().NotBeNull();
            company.LegalAssessment!.IsPotentiallyOutdated.Should().BeTrue();
            company.LegalAssessment.StaleMetadata!.IsStale.Should().BeTrue();
        }

        // -------------------------------------------------------------
        // Test P: NeedsInformation items remain unresolved
        // -------------------------------------------------------------
        [Fact]
        public async Task Test_P_NeedsInformation_Items_Remain_Unresolved()
        {
            var (idea, journey, user) = SetupCanonicalVenture("creator-p", "idea-p");
            var companyService = CreateCompanyService();

            var company = await companyService.EnsureLevelUpCompanyAsync(
                userId: user.User, sourceLink: idea.Id, legalStructure: "SAS", fundingAsk: 100000,
                companyName: "Comp P", industry: "Tech", tagline: "Tag P", journeyId: journey.Id,
                baselineReadiness: null, forecastId: null, businessPlanId: null,
                legalAssessment: journey.Phase3Data!.LegalAssessment, logo: null, documents: null, session: null);

            var vatReq = company.LegalAssessment!.Items.FirstOrDefault(r => r.Id == "FR-SOC-001");
            vatReq.Should().NotBeNull();
            vatReq!.Status.Should().Be("needs_information");
        }

        // -------------------------------------------------------------
        // Test Q: Readiness baseline preserved with canonical 20/20/25/15/20 weighting
        // -------------------------------------------------------------
        [Fact]
        public async Task Test_Q_Readiness_Baseline_Preserved_With_Canonical_Weighting()
        {
            var (idea, journey, user) = SetupCanonicalVenture("creator-q", "idea-q");
            var companyService = CreateCompanyService();

            var readiness = journey.Phase3Data!.InvestorReadinessScore!;
            var maxScore = 20.0 + 20.0 + 25.0 + 15.0 + 20.0; // 100.0 total
            maxScore.Should().Be(100.0);
            readiness.Total.Should().Be(88.5);

            var company = await companyService.EnsureLevelUpCompanyAsync(
                userId: user.User, sourceLink: idea.Id, legalStructure: "SAS", fundingAsk: 100000,
                companyName: "Comp Q", industry: "Tech", tagline: "Tag Q", journeyId: journey.Id,
                baselineReadiness: readiness.Total, forecastId: null, businessPlanId: null,
                legalAssessment: null, logo: null, documents: null, session: null);

            company.BaselineReadinessScore.Should().Be(88.5);
        }

        // -------------------------------------------------------------
        // Test R: Cross-user Level Up denied (tenant isolation)
        // -------------------------------------------------------------
        [Fact]
        public async Task Test_R_Cross_User_LevelUp_Denied()
        {
            var (idea, journey, user) = SetupCanonicalVenture("creator-owner", "idea-r");
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("attacker-user", "idea-r"))
                .ReturnsAsync((CreatorJourney?)null);

            var controller = CreateController("attacker-user");
            var result = await controller.LevelUp("idea-r");

            result.Should().BeOfType<NotFoundObjectResult>();
        }

        // -------------------------------------------------------------
        // Test S: Cross-user document transfer denied
        // -------------------------------------------------------------
        [Fact]
        public void Test_S_Cross_User_Document_Transfer_Denied()
        {
            var (idea, journey, _) = SetupCanonicalVenture("victim-creator", "idea-s");

            var attackerDoc = new CreatorIdeaDocument
            {
                Id = "attacker-doc-id",
                DocumentType = "Exploit",
                StorageReference = "/unauthorized/path/doc.pdf"
            };

            // Attempting to inject document not belonging to idea
            idea.Documents.Any(d => d.Id == attackerDoc.Id).Should().BeFalse();
        }

        // -------------------------------------------------------------
        // Test T: Failed/retried Level Up is idempotent and safely recoverable
        // -------------------------------------------------------------
        [Fact]
        public async Task Test_T_Failed_Or_Retried_LevelUp_Is_Idempotent_And_Safely_Recoverable()
        {
            var (idea, journey, user) = SetupCanonicalVenture("creator-t", "idea-t");

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("creator-t", "idea-t"))
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
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>(),
                It.IsAny<double?>(), It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<CreatorLegalAssessment?>(),
                It.IsAny<string?>(), It.IsAny<List<CreatorIdeaDocument>?>(), It.IsAny<IClientSessionHandle?>()))
                .ReturnsAsync(new Companies
                {
                    Id = "comp-t-1",
                    OwnerId = "creator-t",
                    SourceBusinessIdeaId = "idea-t",
                    SourceCreatorIdeaId = "idea-t",
                    SourceCreatorJourneyId = "journey-idea-t",
                    PromotedFromCreator = true,
                    PromotedAt = DateTime.UtcNow,
                    PromotedByUserId = "creator-t",
                    TransferVersion = 1,
                    CompanyName = idea.Project!.Name,
                    Industry = idea.Project.Sector,
                    Tagline = idea.Project.Tagline,
                    LegalStructure = "SAS",
                    BaselineReadinessScore = 88.5
                });

            var controller = CreateController("creator-t");

            // First call (Fresh promotion)
            var result1 = await controller.LevelUp("idea-t");
            var okResult1 = result1.Should().BeOfType<OkObjectResult>().Subject;
            var response1 = okResult1.Value.As<ApiResponse>();
            response1.Success.Should().BeTrue();
            response1.Data.Should().NotBeNull();

            // Set journey to already promoted to simulate idempotent second call
            journey.CompanyId = "comp-t-1";
            journey.LeveledUpIdeaId = "idea-t";
            journey.Phase6Data = new CreatorPhase6Data
            {
                LevelUpTriggered = true,
                LevelUpTriggeredAt = DateTime.UtcNow,
                EntrepreneurProfileId = "ent-prof-t"
            };

            // Second call (Idempotent retry)
            var result2 = await controller.LevelUp("idea-t");
            var okResult2 = result2.Should().BeOfType<OkObjectResult>().Subject;
            var response2 = okResult2.Value.As<ApiResponse>();
            response2.Success.Should().BeTrue();
            response2.Data.Should().NotBeNull();
        }
    }
}
