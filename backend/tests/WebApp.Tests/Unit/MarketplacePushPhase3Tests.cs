using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;
using Moq;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using WebApp.Controllers;
using WebApp.DbContext;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services;
using WebApp.Services.Interface;
using WebApp.Services.Repository;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class MarketplacePushPhase3Tests
    {
        private readonly Mock<IMongoDatabase> _dbMock = new();
        private readonly Mock<IMongoCollection<CreatorIdea>> _ideasColMock = new();
        private readonly Mock<IMongoCollection<ProjectInterest>> _interestsColMock = new();
        private readonly Mock<IMongoCollection<MarketplaceProjectAccessGrant>> _grantsColMock = new();
        private readonly Mock<IMongoCollection<MarketplaceProjectAccessLog>> _logsColMock = new();
        private readonly Mock<IMongoCollection<DealExecution>> _dealsColMock = new();
        private readonly Mock<ICreatorIdeaStore> _ideasStoreMock = new();
        private readonly Mock<INotificationService> _notificationsMock = new();
        private readonly Mock<ICompanyService> _companyServiceMock = new();
        private readonly Mock<ILogger<DealsController>> _dealsLoggerMock = new();
        private readonly MongoDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public MarketplacePushPhase3Tests()
        {
            _dbMock.Setup(d => d.GetCollection<CreatorIdea>("CreatorIdeas", null))
                .Returns(_ideasColMock.Object);
            _dbMock.Setup(d => d.GetCollection<ProjectInterest>("ProjectInterests", null))
                .Returns(_interestsColMock.Object);
            _dbMock.Setup(d => d.GetCollection<MarketplaceProjectAccessGrant>("MarketplaceProjectAccessGrants", null))
                .Returns(_grantsColMock.Object);
            _dbMock.Setup(d => d.GetCollection<MarketplaceProjectAccessLog>("MarketplaceProjectAccessLogs", null))
                .Returns(_logsColMock.Object);
            _dbMock.Setup(d => d.GetCollection<DealExecution>("DealExecutions", null))
                .Returns(_dealsColMock.Object);

            _ideasColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), It.IsAny<FindOptions<CreatorIdea, CreatorIdea>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<CreatorIdea>()));
            _grantsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<MarketplaceProjectAccessGrant>>(), It.IsAny<FindOptions<MarketplaceProjectAccessGrant, MarketplaceProjectAccessGrant>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<MarketplaceProjectAccessGrant>()));
            _interestsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<ProjectInterest>>(), It.IsAny<FindOptions<ProjectInterest, ProjectInterest>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<ProjectInterest>()));

            _context = new MongoDbContext(_dbMock.Object);

            var userStore = new Mock<IUserStore<ApplicationUser>>();
            _userManager = new UserManager<ApplicationUser>(
                userStore.Object, null!, null!, null!, null!, null!, null!, null!, null!);
        }

        private static IAsyncCursor<T> MakeCursor<T>(List<T> list)
        {
            var cursor = new Mock<IAsyncCursor<T>>();
            cursor.Setup(c => c.Current).Returns(list);
            cursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>()))
                .Returns(list.Count > 0).Returns(false);
            cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(list.Count > 0).ReturnsAsync(false);
            return cursor.Object;
        }

        private MarketplaceProjectsController CreateMarketplaceController(string userId)
        {
            var controller = new MarketplaceProjectsController(
                _context,
                _userManager,
                _ideasStoreMock.Object,
                null,
                _notificationsMock.Object);

            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId)
            }, "mock"));

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };

            return controller;
        }

        private DealsController CreateDealsController(string userId)
        {
            var controller = new DealsController(
                _companyServiceMock.Object,
                _userManager,
                _context,
                _dealsLoggerMock.Object,
                _notificationsMock.Object);

            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId)
            }, "mock"));

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };

            return controller;
        }

        private static CreatorIdea CreateSampleIdea(string ideaId, string ownerId, List<string>? dealModes = null)
        {
            return new CreatorIdea
            {
                Id = ideaId,
                UserId = ownerId,
                Project = new CreatorJourneyProject
                {
                    Name = "Autonomous Fleet Manager",
                    Tagline = "AI orchestrator for autonomous logistics fleets",
                    Problem = "Fleet coordination bottleneck",
                    Solution = "Multi-agent coordination protocol",
                    Sector = "Robotics & Logistics",
                    ClarityScore = 95
                },
                Phase5Data = new CreatorPhase5Data
                {
                    ChosenPath = "sell",
                    PathA = new CreatorPathA
                    {
                        MarketplaceListing = new CreatorMarketplaceListing
                        {
                            Status = "available",
                            Audience = "public",
                            NdaRequired = true,
                            DealModes = dealModes ?? new List<string> { "full_buyout", "equity_partnership" },
                            PublishedAt = DateTime.UtcNow
                        }
                    }
                }
            };
        }

        [Fact]
        public async Task TestA_NonAcceptedInterest_CannotCreateOffer()
        {
            var controller = CreateMarketplaceController("ent_1");
            var idea = CreateSampleIdea("idea_1", "creator_1");
            var pendingInterest = new ProjectInterest
            {
                Id = ObjectId.GenerateNewId(),
                IdeaId = "idea_1",
                CreatorId = "creator_1",
                EntrepreneurId = "ent_1",
                Status = "pending"
            };

            _ideasColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), It.IsAny<FindOptions<CreatorIdea, CreatorIdea>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<CreatorIdea> { idea }));
            _interestsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<ProjectInterest>>(), It.IsAny<FindOptions<ProjectInterest, ProjectInterest>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<ProjectInterest> { pendingInterest }));

            var req = new CreateEquityOfferRequest
            {
                EquityPercentage = 12,
                CreatorRole = "Co-founder",
                VestingEnabled = true,
                VestingMonths = 48,
                CliffMonths = 12
            };

            var result = await controller.CreateEquityOffer("idea_1", req);
            result.Should().BeOfType<UnprocessableEntityObjectResult>();
        }

        [Fact]
        public async Task TestB_NoPrivateAccess_CannotCreateOffer()
        {
            var controller = CreateMarketplaceController("ent_1");
            var idea = CreateSampleIdea("idea_1", "creator_1");
            var acceptedInterest = new ProjectInterest
            {
                Id = ObjectId.GenerateNewId(),
                IdeaId = "idea_1",
                CreatorId = "creator_1",
                EntrepreneurId = "ent_1",
                Status = "accepted"
            };

            _ideasColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), It.IsAny<FindOptions<CreatorIdea, CreatorIdea>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<CreatorIdea> { idea }));
            _interestsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<ProjectInterest>>(), It.IsAny<FindOptions<ProjectInterest, ProjectInterest>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<ProjectInterest> { acceptedInterest }));
            _grantsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<MarketplaceProjectAccessGrant>>(), It.IsAny<FindOptions<MarketplaceProjectAccessGrant, MarketplaceProjectAccessGrant>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<MarketplaceProjectAccessGrant>())); // No grant

            var req = new CreateEquityOfferRequest
            {
                EquityPercentage = 12,
                CreatorRole = "Co-founder"
            };

            var result = await controller.CreateEquityOffer("idea_1", req);
            var statusResult = result.Should().BeOfType<ObjectResult>().Subject;
            statusResult.StatusCode.Should().Be(403);
        }

        [Fact]
        public async Task TestC_DisabledDealMode_CannotCreateEquityOffer()
        {
            var controller = CreateMarketplaceController("ent_1");
            // Only full_buyout is enabled, equity_partnership is disabled
            var idea = CreateSampleIdea("idea_1", "creator_1", dealModes: new List<string> { "full_buyout" });
            var acceptedInterest = new ProjectInterest
            {
                Id = ObjectId.GenerateNewId(),
                IdeaId = "idea_1",
                CreatorId = "creator_1",
                EntrepreneurId = "ent_1",
                Status = "accepted"
            };

            _ideasColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), It.IsAny<FindOptions<CreatorIdea, CreatorIdea>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<CreatorIdea> { idea }));
            _interestsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<ProjectInterest>>(), It.IsAny<FindOptions<ProjectInterest, ProjectInterest>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<ProjectInterest> { acceptedInterest }));

            var req = new CreateEquityOfferRequest
            {
                EquityPercentage = 12,
                CreatorRole = "Co-founder"
            };

            var result = await controller.CreateEquityOffer("idea_1", req);
            result.Should().BeOfType<UnprocessableEntityObjectResult>();
        }

        [Fact]
        public async Task TestD_ValidEquityOfferV1_Created()
        {
            var controller = CreateMarketplaceController("ent_1");
            var idea = CreateSampleIdea("idea_1", "creator_1");
            var interest = new ProjectInterest
            {
                Id = ObjectId.GenerateNewId(),
                IdeaId = "idea_1",
                CreatorId = "creator_1",
                EntrepreneurId = "ent_1",
                Status = "accepted",
                ConversationId = ObjectId.GenerateNewId().ToString()
            };
            var grant = new MarketplaceProjectAccessGrant
            {
                IdeaId = "idea_1",
                EntrepreneurId = "ent_1",
                NdaSigned = true,
                Status = "active"
            };

            _ideasColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), It.IsAny<FindOptions<CreatorIdea, CreatorIdea>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<CreatorIdea> { idea }));
            _interestsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<ProjectInterest>>(), It.IsAny<FindOptions<ProjectInterest, ProjectInterest>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<ProjectInterest> { interest }));
            _grantsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<MarketplaceProjectAccessGrant>>(), It.IsAny<FindOptions<MarketplaceProjectAccessGrant, MarketplaceProjectAccessGrant>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<MarketplaceProjectAccessGrant> { grant }));
            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution>())); // No existing deal

            var req = new CreateEquityOfferRequest
            {
                EquityPercentage = 15,
                CreatorRole = "Co-founder & Technical Lead",
                CashComponent = 5000,
                VestingEnabled = true,
                VestingMonths = 48,
                CliffMonths = 12,
                Responsibilities = new List<string> { "Architecture", "Engineering Team Hiring" },
                TimeCommitment = "10 hours / week",
                Notes = "Excited to partner on this project!"
            };

            var result = await controller.CreateEquityOffer("idea_1", req);
            var createdResult = result.Should().BeOfType<ObjectResult>().Subject;
            createdResult.StatusCode.Should().Be(201);

            var response = createdResult.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = response.Data.Should().BeOfType<EquityDealDto>().Subject;
            dto.DealType.Should().Be("EQUITY_PARTNERSHIP");
            dto.DealStage.Should().Be("OFFER_NEGOTIATION");
            dto.CurrentTurn.Should().Be("creator");
            dto.CurrentRevisionNumber.Should().Be(1);
            dto.ActiveTerms.EquityPercentage.Should().Be(15);
            dto.ActiveTerms.CreatorRole.Should().Be("Co-founder & Technical Lead");
            dto.ActiveTerms.CashComponent.Should().Be(5000);
            dto.Revisions.Should().HaveCount(1);
            dto.Revisions[0].RevisionNumber.Should().Be(1);
            dto.Revisions[0].OfferedByRole.Should().Be("entrepreneur");

            _dealsColMock.Verify(d => d.InsertOneAsync(It.Is<DealExecution>(x =>
                x.IdeaId == "idea_1" &&
                x.CurrentTurn == "creator" &&
                x.Revisions.Count == 1), null, default), Times.Once);
        }

        [Fact]
        public async Task TestE_V1_Immutable_WhenCountered()
        {
            var dealsController = CreateDealsController("creator_1");
            var dealId = "deal_123";

            var v1Terms = new EquityTerms
            {
                EquityPercentage = 12,
                CreatorRole = "Co-founder",
                CashComponent = 5000,
                VestingEnabled = true,
                VestingMonths = 48,
                CliffMonths = 12
            };

            var v1 = new TermSheetRevision
            {
                RevisionNumber = 1,
                OfferedByRole = "entrepreneur",
                OfferedByUserId = "ent_1",
                Status = "pending",
                EquityTerms = v1Terms,
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            };

            var deal = new DealExecution
            {
                Id = dealId,
                DealType = "EQUITY_PARTNERSHIP",
                DealStage = "OFFER_NEGOTIATION",
                IdeaId = "idea_1",
                CreatorId = "creator_1",
                EntrepreneurId = "ent_1",
                CurrentTurn = "creator",
                EquityTerms = v1Terms,
                Revisions = new List<TermSheetRevision> { v1 },
                Version = 1
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), (ReplaceOptions)null, default))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

            var counterReq = new CounterEquityOfferRequest
            {
                EquityPercentage = 18,
                CreatorRole = "Co-founder & CTO",
                CashComponent = 10000,
                VestingEnabled = true,
                VestingMonths = 48,
                CliffMonths = 12
            };

            var result = await dealsController.CounterOffer(dealId, counterReq);
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = response.Data.Should().BeOfType<EquityDealDto>().Subject;

            // V1 terms must remain immutable in history with status countered
            dto.Revisions.Should().HaveCount(2);
            dto.Revisions[0].RevisionNumber.Should().Be(1);
            dto.Revisions[0].Status.Should().Be("countered");
            dto.Revisions[0].Terms.EquityPercentage.Should().Be(12);

            // V2 contains creator's new terms
            dto.Revisions[1].RevisionNumber.Should().Be(2);
            dto.Revisions[1].Status.Should().Be("pending");
            dto.Revisions[1].OfferedByRole.Should().Be("creator");
            dto.Revisions[1].Terms.EquityPercentage.Should().Be(18);

            dto.CurrentTurn.Should().Be("entrepreneur");
        }

        [Fact]
        public async Task TestF_CreatorCounter_CreatesV2()
        {
            var dealsController = CreateDealsController("creator_1");
            var deal = new DealExecution
            {
                Id = "deal_123",
                DealType = "EQUITY_PARTNERSHIP",
                DealStage = "OFFER_NEGOTIATION",
                CreatorId = "creator_1",
                EntrepreneurId = "ent_1",
                CurrentTurn = "creator",
                Revisions = new List<TermSheetRevision>
                {
                    new() { RevisionNumber = 1, OfferedByRole = "entrepreneur", Status = "pending", EquityTerms = new EquityTerms { EquityPercentage = 10, CreatorRole = "Advisor" } }
                },
                Version = 1
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), (ReplaceOptions)null, default))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

            var result = await dealsController.CounterOffer("deal_123", new CounterEquityOfferRequest
            {
                EquityPercentage = 20,
                CreatorRole = "Co-founder"
            });

            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = response.Data.Should().BeOfType<EquityDealDto>().Subject;

            dto.CurrentRevisionNumber.Should().Be(2);
            dto.CurrentTurn.Should().Be("entrepreneur");
            dto.ActiveTerms.EquityPercentage.Should().Be(20);
        }

        [Fact]
        public async Task TestG_EntrepreneurCounter_CreatesV3()
        {
            var dealsController = CreateDealsController("ent_1");
            var deal = new DealExecution
            {
                Id = "deal_123",
                DealType = "EQUITY_PARTNERSHIP",
                DealStage = "OFFER_NEGOTIATION",
                CreatorId = "creator_1",
                EntrepreneurId = "ent_1",
                CurrentTurn = "entrepreneur", // Entrepreneur's turn after creator's V2
                Revisions = new List<TermSheetRevision>
                {
                    new() { RevisionNumber = 1, OfferedByRole = "entrepreneur", Status = "countered", EquityTerms = new EquityTerms { EquityPercentage = 10, CreatorRole = "Advisor" } },
                    new() { RevisionNumber = 2, OfferedByRole = "creator", Status = "pending", EquityTerms = new EquityTerms { EquityPercentage = 20, CreatorRole = "Co-founder" } }
                },
                Version = 2
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), (ReplaceOptions)null, default))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

            var result = await dealsController.CounterOffer("deal_123", new CounterEquityOfferRequest
            {
                EquityPercentage = 15,
                CreatorRole = "Co-founder"
            });

            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = response.Data.Should().BeOfType<EquityDealDto>().Subject;

            dto.CurrentRevisionNumber.Should().Be(3);
            dto.CurrentTurn.Should().Be("creator");
            dto.ActiveTerms.EquityPercentage.Should().Be(15);
            dto.Revisions.Should().HaveCount(3);
        }

        [Fact]
        public async Task TestH_PriorRevisions_Retained()
        {
            var dealsController = CreateDealsController("creator_1");
            var deal = new DealExecution
            {
                Id = "deal_123",
                CreatorId = "creator_1",
                EntrepreneurId = "ent_1",
                Revisions = new List<TermSheetRevision>
                {
                    new() { RevisionNumber = 1, OfferedByRole = "entrepreneur", Status = "countered", EquityTerms = new EquityTerms { EquityPercentage = 10, CreatorRole = "Advisor" } },
                    new() { RevisionNumber = 2, OfferedByRole = "creator", Status = "countered", EquityTerms = new EquityTerms { EquityPercentage = 20, CreatorRole = "Co-founder" } },
                    new() { RevisionNumber = 3, OfferedByRole = "entrepreneur", Status = "pending", EquityTerms = new EquityTerms { EquityPercentage = 15, CreatorRole = "Co-founder" } }
                }
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));

            var result = await dealsController.GetDealRevisions("deal_123");
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            var revisions = response.Data.Should().BeOfType<List<EquityOfferRevisionDto>>().Subject;

            revisions.Should().HaveCount(3);
            revisions[0].RevisionNumber.Should().Be(1);
            revisions[1].RevisionNumber.Should().Be(2);
            revisions[2].RevisionNumber.Should().Be(3);
        }

        [Fact]
        public async Task TestI_WrongTurnAction_Rejected()
        {
            // It is Creator's turn, but Entrepreneur tries to counter again
            var dealsController = CreateDealsController("ent_1");
            var deal = new DealExecution
            {
                Id = "deal_123",
                DealType = "EQUITY_PARTNERSHIP",
                DealStage = "OFFER_NEGOTIATION",
                CreatorId = "creator_1",
                EntrepreneurId = "ent_1",
                CurrentTurn = "creator", // Waiting on creator
                Revisions = new List<TermSheetRevision>
                {
                    new() { RevisionNumber = 1, OfferedByRole = "entrepreneur", Status = "pending", EquityTerms = new EquityTerms { EquityPercentage = 10, CreatorRole = "Advisor" } }
                }
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));

            var result = await dealsController.CounterOffer("deal_123", new CounterEquityOfferRequest
            {
                EquityPercentage = 12,
                CreatorRole = "Co-founder"
            });

            result.Should().BeOfType<UnprocessableEntityObjectResult>();
        }

        [Fact]
        public async Task TestJ_CreatorAccepts_AdvancesToRolesPending()
        {
            var dealsController = CreateDealsController("creator_1");
            var deal = new DealExecution
            {
                Id = "deal_123",
                DealType = "EQUITY_PARTNERSHIP",
                DealStage = "OFFER_NEGOTIATION",
                CreatorId = "creator_1",
                EntrepreneurId = "ent_1",
                CurrentTurn = "creator",
                Revisions = new List<TermSheetRevision>
                {
                    new() { RevisionNumber = 1, OfferedByRole = "entrepreneur", Status = "pending", EquityTerms = new EquityTerms { EquityPercentage = 15, CreatorRole = "Co-founder" } }
                },
                Version = 1
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), (ReplaceOptions)null, default))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

            var result = await dealsController.AcceptOffer("deal_123");
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = response.Data.Should().BeOfType<EquityDealDto>().Subject;

            dto.DealStage.Should().Be("ROLES_PENDING");
            dto.CurrentTurn.Should().BeEmpty();
            dto.AcceptedRevisionNumber.Should().Be(1);
            dto.AcceptedAt.Should().NotBeNull();
            dto.Revisions[0].Status.Should().Be("accepted");
        }

        [Fact]
        public async Task TestK_AcceptedRevisionId_PointsToFinalVersion()
        {
            var dealsController = CreateDealsController("creator_1");
            var deal = new DealExecution
            {
                Id = "deal_123",
                DealType = "EQUITY_PARTNERSHIP",
                DealStage = "OFFER_NEGOTIATION",
                CreatorId = "creator_1",
                EntrepreneurId = "ent_1",
                CurrentTurn = "creator",
                Revisions = new List<TermSheetRevision>
                {
                    new() { RevisionNumber = 1, Status = "countered", EquityTerms = new EquityTerms { EquityPercentage = 10 } },
                    new() { RevisionNumber = 2, Status = "countered", EquityTerms = new EquityTerms { EquityPercentage = 20 } },
                    new() { RevisionNumber = 3, Status = "pending", EquityTerms = new EquityTerms { EquityPercentage = 15 } }
                },
                Version = 3
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), (ReplaceOptions)null, default))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

            var result = await dealsController.AcceptOffer("deal_123");
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var dto = (okResult.Value as ApiResponse)!.Data as EquityDealDto;

            dto!.AcceptedRevisionNumber.Should().Be(3);
            dto.DealStage.Should().Be("ROLES_PENDING");
        }

        [Fact]
        public async Task TestL_Reject_DoesNotDeleteListing()
        {
            var dealsController = CreateDealsController("creator_1");
            var deal = new DealExecution
            {
                Id = "deal_123",
                DealType = "EQUITY_PARTNERSHIP",
                DealStage = "OFFER_NEGOTIATION",
                CreatorId = "creator_1",
                EntrepreneurId = "ent_1",
                CurrentTurn = "creator",
                Revisions = new List<TermSheetRevision>
                {
                    new() { RevisionNumber = 1, Status = "pending" }
                },
                Version = 1
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), (ReplaceOptions)null, default))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

            var result = await dealsController.RejectOffer("deal_123");
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var dto = (okResult.Value as ApiResponse)!.Data as EquityDealDto;

            dto!.DealStage.Should().Be("REJECTED");
            dto.Status.Should().Be("rejected");

            // CreatorIdeas collection is NEVER deleted or modified to closed
            _ideasColMock.Verify(i => i.DeleteOneAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), default), Times.Never);
        }

        [Fact]
        public async Task TestM_ExpiredRevision_CannotAccept()
        {
            var dealsController = CreateDealsController("creator_1");
            var expiredRev = new TermSheetRevision
            {
                RevisionNumber = 1,
                Status = "pending",
                ExpiresAt = DateTime.UtcNow.AddDays(-2) // Expired 2 days ago
            };

            var deal = new DealExecution
            {
                Id = "deal_123",
                DealType = "EQUITY_PARTNERSHIP",
                DealStage = "OFFER_NEGOTIATION",
                CreatorId = "creator_1",
                EntrepreneurId = "ent_1",
                CurrentTurn = "creator",
                Revisions = new List<TermSheetRevision> { expiredRev }
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));

            var result = await dealsController.AcceptOffer("deal_123");
            result.Should().BeOfType<UnprocessableEntityObjectResult>();
        }

        [Fact]
        public async Task TestN_DuplicateRetry_DoesNotDuplicateRevision()
        {
            var controller = CreateMarketplaceController("ent_1");
            var idea = CreateSampleIdea("idea_1", "creator_1");
            var interest = new ProjectInterest
            {
                Id = ObjectId.GenerateNewId(),
                IdeaId = "idea_1",
                CreatorId = "creator_1",
                EntrepreneurId = "ent_1",
                Status = "accepted"
            };
            var grant = new MarketplaceProjectAccessGrant
            {
                IdeaId = "idea_1",
                EntrepreneurId = "ent_1",
                NdaSigned = true,
                Status = "active"
            };
            var existingDeal = new DealExecution
            {
                Id = "deal_1",
                IdeaId = "idea_1",
                EntrepreneurId = "ent_1",
                CreatorId = "creator_1",
                DealStage = "OFFER_NEGOTIATION",
                Revisions = new List<TermSheetRevision>
                {
                    new() { RevisionNumber = 1, Status = "pending" }
                }
            };

            _ideasColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), It.IsAny<FindOptions<CreatorIdea, CreatorIdea>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<CreatorIdea> { idea }));
            _interestsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<ProjectInterest>>(), It.IsAny<FindOptions<ProjectInterest, ProjectInterest>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<ProjectInterest> { interest }));
            _grantsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<MarketplaceProjectAccessGrant>>(), It.IsAny<FindOptions<MarketplaceProjectAccessGrant, MarketplaceProjectAccessGrant>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<MarketplaceProjectAccessGrant> { grant }));
            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { existingDeal }));

            var req = new CreateEquityOfferRequest
            {
                EquityPercentage = 15,
                CreatorRole = "Co-founder"
            };

            var result = await controller.CreateEquityOffer("idea_1", req);
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;

            // Does not insert duplicate deal
            _dealsColMock.Verify(d => d.InsertOneAsync(It.IsAny<DealExecution>(), null, default), Times.Never);
        }

        [Fact]
        public async Task TestP_UnrelatedUser_Returns403()
        {
            var dealsController = CreateDealsController("unrelated_intruder");
            var deal = new DealExecution
            {
                Id = "deal_123",
                CreatorId = "creator_1",
                EntrepreneurId = "ent_1",
                DealStage = "OFFER_NEGOTIATION"
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));

            var result = await dealsController.GetDeal("deal_123");
            var statusResult = result.Should().BeOfType<ObjectResult>().Subject;
            statusResult.StatusCode.Should().Be(403);
        }

        [Fact]
        public async Task TestQ_IdeaIsolation_IdeaAGrantCannotAccessIdeaB()
        {
            var controller = CreateMarketplaceController("ent_1");
            var ideaB = CreateSampleIdea("idea_B", "creator_1");
            var interestB = new ProjectInterest
            {
                Id = ObjectId.GenerateNewId(),
                IdeaId = "idea_B",
                EntrepreneurId = "ent_1",
                Status = "accepted"
            };

            // Grant is only for idea_A, caller expresses offer on idea_B
            _ideasColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), It.IsAny<FindOptions<CreatorIdea, CreatorIdea>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<CreatorIdea> { ideaB }));
            _interestsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<ProjectInterest>>(), It.IsAny<FindOptions<ProjectInterest, ProjectInterest>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<ProjectInterest> { interestB }));
            _grantsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<MarketplaceProjectAccessGrant>>(), It.IsAny<FindOptions<MarketplaceProjectAccessGrant, MarketplaceProjectAccessGrant>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<MarketplaceProjectAccessGrant>())); // No grant for idea_B

            var req = new CreateEquityOfferRequest { EquityPercentage = 15, CreatorRole = "Co-founder" };
            var result = await controller.CreateEquityOffer("idea_B", req);
            var statusResult = result.Should().BeOfType<ObjectResult>().Subject;
            statusResult.StatusCode.Should().Be(403);
        }

        [Fact]
        public async Task TestO_ConcurrentCounter_OptimisticConcurrencyHandlesRace()
        {
            var dealsController = CreateDealsController("creator_1");
            var deal = new DealExecution
            {
                Id = "deal_123",
                DealType = "EQUITY_PARTNERSHIP",
                DealStage = "OFFER_NEGOTIATION",
                CreatorId = "creator_1",
                EntrepreneurId = "ent_1",
                CurrentTurn = "creator",
                Revisions = new List<TermSheetRevision>
                {
                    new() { RevisionNumber = 1, OfferedByRole = "entrepreneur", Status = "pending", EquityTerms = new EquityTerms { EquityPercentage = 10 } }
                },
                Version = 1
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));
            // Simulate that another concurrent request modified version first (ModifiedCount == 0)
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(0, 0, null));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), (ReplaceOptions)null, default))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(0, 0, null));

            var result = await dealsController.CounterOffer("deal_123", new CounterEquityOfferRequest
            {
                EquityPercentage = 20,
                CreatorRole = "Co-founder"
            });

            var conflictResult = result.Should().BeOfType<ConflictObjectResult>().Subject;
            conflictResult.StatusCode.Should().Be(409);
        }

        [Fact]
        public async Task TestR_AskQuestion_DoesNotMutateOffer()
        {
            var dealsController = CreateDealsController("creator_1");
            var deal = new DealExecution
            {
                Id = "deal_123",
                DealType = "EQUITY_PARTNERSHIP",
                DealStage = "OFFER_NEGOTIATION",
                CreatorId = "creator_1",
                EntrepreneurId = "ent_1",
                CurrentTurn = "creator",
                ConversationId = "convo_123",
                Revisions = new List<TermSheetRevision>
                {
                    new() { RevisionNumber = 1, Status = "pending", EquityTerms = new EquityTerms { EquityPercentage = 12 } }
                },
                Version = 1
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));

            // Read deal to simulate viewing before asking a question
            var result = await dealsController.GetDeal("deal_123");
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var dto = (okResult.Value as ApiResponse)!.Data as EquityDealDto;

            dto!.DealStage.Should().Be("OFFER_NEGOTIATION");
            dto.CurrentRevisionNumber.Should().Be(1);
            dto.CurrentTurn.Should().Be("creator");

            // Deal was not replaced/mutated
            _dealsColMock.Verify(d => d.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), default), Times.Never);
        }

        [Fact]
        public async Task TestS_ValidBuyoutOfferV1_Created()
        {
            var controller = CreateMarketplaceController("ent_1");
            var idea = CreateSampleIdea("idea_1", "creator_1", dealModes: new List<string> { "full_buyout" });
            var interest = new ProjectInterest
            {
                Id = ObjectId.GenerateNewId(),
                IdeaId = "idea_1",
                CreatorId = "creator_1",
                EntrepreneurId = "ent_1",
                Status = "accepted",
                ConversationId = ObjectId.GenerateNewId().ToString()
            };
            var grant = new MarketplaceProjectAccessGrant
            {
                IdeaId = "idea_1",
                EntrepreneurId = "ent_1",
                NdaSigned = true,
                Status = "active"
            };

            _ideasColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), It.IsAny<FindOptions<CreatorIdea, CreatorIdea>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<CreatorIdea> { idea }));
            _interestsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<ProjectInterest>>(), It.IsAny<FindOptions<ProjectInterest, ProjectInterest>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<ProjectInterest> { interest }));
            _grantsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<MarketplaceProjectAccessGrant>>(), It.IsAny<FindOptions<MarketplaceProjectAccessGrant, MarketplaceProjectAccessGrant>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<MarketplaceProjectAccessGrant> { grant }));
            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution>()));

            var req = new CreateBuyoutOfferRequest
            {
                PurchasePrice = 25000,
                HandoverPeriodWeeks = 2,
                TransitionSupportWeeks = 4,
                Notes = "All IP included"
            };

            var result = await controller.CreateBuyoutOffer("idea_1", req);
            var created = result.Should().BeOfType<ObjectResult>().Subject;
            created.StatusCode.Should().Be(201);

            var apiRes = created.Value as ApiResponse;
            var dto = apiRes!.Data as EquityDealDto;
            dto.Should().NotBeNull();
            dto!.DealType.Should().Be("FULL_BUYOUT");
            dto.DealStage.Should().Be("OFFER_NEGOTIATION");
            dto.BuyoutTerms.Should().NotBeNull();
            dto.BuyoutTerms!.PurchasePrice.Should().Be(25000);
            dto.BuyoutTerms.HandoverPeriodWeeks.Should().Be(2);

            _dealsColMock.Verify(d => d.InsertOneAsync(It.Is<DealExecution>(de =>
                de.DealType == "FULL_BUYOUT" &&
                de.BuyoutTerms!.PurchasePrice == 25000 &&
                de.DealStage == "OFFER_NEGOTIATION" &&
                de.Revisions.Count == 1 &&
                de.Revisions[0].BuyoutTerms!.PurchasePrice == 25000
            ), It.IsAny<InsertOneOptions>(), default), Times.Once);
        }

        [Fact]
        public async Task TestT_BuyoutOffer_RejectsZeroPurchasePrice()
        {
            var controller = CreateMarketplaceController("ent_1");
            var idea = CreateSampleIdea("idea_1", "creator_1", dealModes: new List<string> { "full_buyout" });
            var interest = new ProjectInterest
            {
                Id = ObjectId.GenerateNewId(),
                IdeaId = "idea_1",
                CreatorId = "creator_1",
                EntrepreneurId = "ent_1",
                Status = "accepted",
                ConversationId = ObjectId.GenerateNewId().ToString()
            };
            var grant = new MarketplaceProjectAccessGrant
            {
                IdeaId = "idea_1",
                EntrepreneurId = "ent_1",
                NdaSigned = true,
                Status = "active"
            };

            _ideasColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), It.IsAny<FindOptions<CreatorIdea, CreatorIdea>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<CreatorIdea> { idea }));
            _interestsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<ProjectInterest>>(), It.IsAny<FindOptions<ProjectInterest, ProjectInterest>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<ProjectInterest> { interest }));
            _grantsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<MarketplaceProjectAccessGrant>>(), It.IsAny<FindOptions<MarketplaceProjectAccessGrant, MarketplaceProjectAccessGrant>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<MarketplaceProjectAccessGrant> { grant }));

            var req = new CreateBuyoutOfferRequest
            {
                PurchasePrice = 0 // Invalid
            };

            var result = await controller.CreateBuyoutOffer("idea_1", req);
            result.Should().BeOfType<UnprocessableEntityObjectResult>();
        }

        [Fact]
        public async Task TestU_BuyoutOffer_RequiresAcceptedInterest()
        {
            var controller = CreateMarketplaceController("ent_1");
            var idea = CreateSampleIdea("idea_1", "creator_1", dealModes: new List<string> { "full_buyout" });
            // Pending interest (not yet accepted by creator)
            var interest = new ProjectInterest
            {
                Id = ObjectId.GenerateNewId(),
                IdeaId = "idea_1",
                CreatorId = "creator_1",
                EntrepreneurId = "ent_1",
                Status = "pending"
            };

            _ideasColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), It.IsAny<FindOptions<CreatorIdea, CreatorIdea>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<CreatorIdea> { idea }));
            _interestsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<ProjectInterest>>(), It.IsAny<FindOptions<ProjectInterest, ProjectInterest>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<ProjectInterest> { interest }));

            var req = new CreateBuyoutOfferRequest
            {
                PurchasePrice = 30000
            };

            var result = await controller.CreateBuyoutOffer("idea_1", req);
            result.Should().BeOfType<UnprocessableEntityObjectResult>();
        }

        [Fact]
        public async Task TestV_Creator_CounterBuyoutOffer_CreatesV2_TurnsToEntrepreneur()
        {
            var dealsController = CreateDealsController("creator_1");
            var deal = new DealExecution
            {
                Id = "deal_buyout_1",
                IdeaId = "idea_1",
                CreatorId = "creator_1",
                EntrepreneurId = "ent_1",
                DealType = "FULL_BUYOUT",
                DealStage = "OFFER_NEGOTIATION",
                Status = "initiated",
                CurrentTurn = "creator",
                Version = 1,
                BuyoutTerms = new BuyoutTerms
                {
                    PurchasePrice = 25000,
                    HandoverPeriodWeeks = 2,
                    TransitionSupportWeeks = 4,
                    IncludedAssets = new List<string> { "Brand", "Business Plan" }
                },
                Revisions = new List<TermSheetRevision>
                {
                    new TermSheetRevision
                    {
                        RevisionNumber = 1,
                        OfferedByRole = "entrepreneur",
                        OfferedByUserId = "ent_1",
                        Status = "pending",
                        BuyoutTerms = new BuyoutTerms { PurchasePrice = 25000, HandoverPeriodWeeks = 2 },
                        ExpiresAt = DateTime.UtcNow.AddDays(7)
                    }
                }
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

            var counterReq = new CounterEquityOfferRequest
            {
                BuyoutTerms = new BuyoutTermsDto
                {
                    PurchasePrice = 30000,
                    HandoverPeriodWeeks = 4,
                    TransitionSupportWeeks = 2,
                    IncludedAssets = new List<string> { "Brand", "Business Plan", "Domain" }
                }
            };

            var result = await dealsController.CounterOffer("deal_buyout_1", counterReq);
            result.Should().BeOfType<OkObjectResult>();

            deal.Revisions.Should().HaveCount(2);
            deal.Revisions[0].Status.Should().Be("countered");
            deal.Revisions[1].RevisionNumber.Should().Be(2);
            deal.Revisions[1].Status.Should().Be("pending");
            deal.Revisions[1].OfferedByRole.Should().Be("creator");
            deal.Revisions[1].BuyoutTerms!.PurchasePrice.Should().Be(30000);
            deal.CurrentTurn.Should().Be("entrepreneur");
            deal.BuyoutTerms!.PurchasePrice.Should().Be(30000);
        }

        [Fact]
        public async Task TestW_Entrepreneur_CounterBuyoutOffer_CreatesV3_TurnsToCreator()
        {
            var dealsController = CreateDealsController("ent_1");
            var deal = new DealExecution
            {
                Id = "deal_buyout_1",
                IdeaId = "idea_1",
                CreatorId = "creator_1",
                EntrepreneurId = "ent_1",
                DealType = "FULL_BUYOUT",
                DealStage = "OFFER_NEGOTIATION",
                Status = "initiated",
                CurrentTurn = "entrepreneur",
                Version = 2,
                BuyoutTerms = new BuyoutTerms { PurchasePrice = 30000 },
                Revisions = new List<TermSheetRevision>
                {
                    new TermSheetRevision { RevisionNumber = 1, Status = "countered", BuyoutTerms = new BuyoutTerms { PurchasePrice = 25000 } },
                    new TermSheetRevision { RevisionNumber = 2, Status = "pending", OfferedByRole = "creator", BuyoutTerms = new BuyoutTerms { PurchasePrice = 30000 }, ExpiresAt = DateTime.UtcNow.AddDays(7) }
                }
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

            var counterReq = new CounterEquityOfferRequest
            {
                BuyoutTerms = new BuyoutTermsDto
                {
                    PurchasePrice = 28000,
                    HandoverPeriodWeeks = 3,
                    TransitionSupportWeeks = 4,
                    IncludedAssets = new List<string> { "Brand", "Business Plan", "Domain" }
                }
            };

            var result = await dealsController.CounterOffer("deal_buyout_1", counterReq);
            result.Should().BeOfType<OkObjectResult>();

            deal.Revisions.Should().HaveCount(3);
            deal.Revisions[1].Status.Should().Be("countered");
            deal.Revisions[2].RevisionNumber.Should().Be(3);
            deal.Revisions[2].Status.Should().Be("pending");
            deal.Revisions[2].OfferedByRole.Should().Be("entrepreneur");
            deal.Revisions[2].BuyoutTerms!.PurchasePrice.Should().Be(28000);
            deal.CurrentTurn.Should().Be("creator");
        }

        [Fact]
        public async Task TestX_Creator_AcceptBuyoutOffer_EntersBuyoutTermsAccepted_NoRolesPending()
        {
            var dealsController = CreateDealsController("creator_1");
            var deal = new DealExecution
            {
                Id = "deal_buyout_1",
                IdeaId = "idea_1",
                CreatorId = "creator_1",
                EntrepreneurId = "ent_1",
                DealType = "FULL_BUYOUT",
                DealStage = "OFFER_NEGOTIATION",
                Status = "initiated",
                CurrentTurn = "creator",
                Version = 3,
                BuyoutTerms = new BuyoutTerms { PurchasePrice = 28000 },
                Revisions = new List<TermSheetRevision>
                {
                    new TermSheetRevision { RevisionNumber = 1, Status = "countered", BuyoutTerms = new BuyoutTerms { PurchasePrice = 25000 } },
                    new TermSheetRevision { RevisionNumber = 2, Status = "countered", BuyoutTerms = new BuyoutTerms { PurchasePrice = 30000 } },
                    new TermSheetRevision { RevisionNumber = 3, Status = "pending", OfferedByRole = "entrepreneur", BuyoutTerms = new BuyoutTerms { PurchasePrice = 28000 }, ExpiresAt = DateTime.UtcNow.AddDays(7) }
                }
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

            var result = await dealsController.AcceptOffer("deal_buyout_1");
            result.Should().BeOfType<OkObjectResult>();

            deal.DealStage.Should().Be("BUYOUT_TERMS_ACCEPTED");
            deal.DealStage.Should().NotBe("ROLES_PENDING");
            deal.DealStage.Should().NotBe("CAP_TABLE_PENDING");
            deal.CurrentTurn.Should().BeEmpty();
            deal.AcceptedRevisionNumber.Should().Be(3);
            deal.Revisions[2].Status.Should().Be("accepted");
            deal.RoleAgreement.Should().BeNull();
            deal.CapTableDraft.Should().BeNull();
        }

        [Fact]
        public async Task TestY_WrongTurn_BuyoutCounter_Or_Accept_Returns422()
        {
            var dealsController = CreateDealsController("ent_1"); // It is creator's turn
            var deal = new DealExecution
            {
                Id = "deal_buyout_1",
                IdeaId = "idea_1",
                CreatorId = "creator_1",
                EntrepreneurId = "ent_1",
                DealType = "FULL_BUYOUT",
                DealStage = "OFFER_NEGOTIATION",
                Status = "initiated",
                CurrentTurn = "creator",
                BuyoutTerms = new BuyoutTerms { PurchasePrice = 25000 },
                Revisions = new List<TermSheetRevision>
                {
                    new TermSheetRevision { RevisionNumber = 1, Status = "pending", OfferedByRole = "entrepreneur", BuyoutTerms = new BuyoutTerms { PurchasePrice = 25000 } }
                }
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            var counterReq = new CounterEquityOfferRequest
            {
                BuyoutTerms = new BuyoutTermsDto { PurchasePrice = 27000 }
            };

            var counterResult = await dealsController.CounterOffer("deal_buyout_1", counterReq);
            counterResult.Should().BeOfType<UnprocessableEntityObjectResult>();

            var acceptResult = await dealsController.AcceptOffer("deal_buyout_1");
            acceptResult.Should().BeOfType<UnprocessableEntityObjectResult>();
        }

        [Fact]
        public async Task TestZ_ExpiredBuyoutOffer_CannotBeAccepted_Returns422()
        {
            var dealsController = CreateDealsController("creator_1");
            var deal = new DealExecution
            {
                Id = "deal_buyout_1",
                IdeaId = "idea_1",
                CreatorId = "creator_1",
                EntrepreneurId = "ent_1",
                DealType = "FULL_BUYOUT",
                DealStage = "OFFER_NEGOTIATION",
                Status = "initiated",
                CurrentTurn = "creator",
                BuyoutTerms = new BuyoutTerms { PurchasePrice = 25000 },
                Revisions = new List<TermSheetRevision>
                {
                    new TermSheetRevision
                    {
                        RevisionNumber = 1,
                        Status = "pending",
                        OfferedByRole = "entrepreneur",
                        BuyoutTerms = new BuyoutTerms { PurchasePrice = 25000 },
                        ExpiresAt = DateTime.UtcNow.AddHours(-2) // Expired
                    }
                }
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            var result = await dealsController.AcceptOffer("deal_buyout_1");
            result.Should().BeOfType<UnprocessableEntityObjectResult>();
        }

        [Fact]
        public async Task TestAA_BuyoutOffer_Reject_SetsRejected_KeepsMarketplaceActive()
        {
            var dealsController = CreateDealsController("creator_1");
            var deal = new DealExecution
            {
                Id = "deal_buyout_1",
                IdeaId = "idea_1",
                CreatorId = "creator_1",
                EntrepreneurId = "ent_1",
                DealType = "FULL_BUYOUT",
                DealStage = "OFFER_NEGOTIATION",
                Status = "initiated",
                CurrentTurn = "creator",
                BuyoutTerms = new BuyoutTerms { PurchasePrice = 25000 },
                Revisions = new List<TermSheetRevision>
                {
                    new TermSheetRevision { RevisionNumber = 1, Status = "pending", BuyoutTerms = new BuyoutTerms { PurchasePrice = 25000 } }
                }
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

            var result = await dealsController.RejectOffer("deal_buyout_1");
            result.Should().BeOfType<OkObjectResult>();

            deal.DealStage.Should().Be("REJECTED");
            deal.Status.Should().Be("rejected");
            deal.Revisions[0].Status.Should().Be("rejected");
        }

        [Fact]
        public async Task TestAB_UnrelatedUser_CannotAccessOrCounterBuyoutDeal_Returns403()
        {
            var dealsController = CreateDealsController("unrelated_user");
            var deal = new DealExecution
            {
                Id = "deal_buyout_1",
                IdeaId = "idea_1",
                CreatorId = "creator_1",
                EntrepreneurId = "ent_1",
                DealType = "FULL_BUYOUT",
                DealStage = "OFFER_NEGOTIATION",
                CurrentTurn = "creator"
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            var counterReq = new CounterEquityOfferRequest
            {
                BuyoutTerms = new BuyoutTermsDto { PurchasePrice = 35000 }
            };

            var counterResult = await dealsController.CounterOffer("deal_buyout_1", counterReq);
            counterResult.Should().BeOfType<ObjectResult>();
            ((ObjectResult)counterResult).StatusCode.Should().Be(403);

            var acceptResult = await dealsController.AcceptOffer("deal_buyout_1");
            acceptResult.Should().BeOfType<ObjectResult>();
            ((ObjectResult)acceptResult).StatusCode.Should().Be(403);
        }

        [Fact]
        public async Task TestAC_DuplicateAccept_IsIdempotent()
        {
            var dealsController = CreateDealsController("creator_1");
            var deal = new DealExecution
            {
                Id = "deal_buyout_1",
                IdeaId = "idea_1",
                CreatorId = "creator_1",
                EntrepreneurId = "ent_1",
                DealType = "FULL_BUYOUT",
                DealStage = "BUYOUT_TERMS_ACCEPTED",
                Status = "initiated",
                CurrentTurn = "",
                AcceptedRevisionNumber = 1,
                BuyoutTerms = new BuyoutTerms { PurchasePrice = 25000 },
                Revisions = new List<TermSheetRevision>
                {
                    new TermSheetRevision { RevisionNumber = 1, Status = "accepted", BuyoutTerms = new BuyoutTerms { PurchasePrice = 25000 } }
                }
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));

            var result = await dealsController.AcceptOffer("deal_buyout_1");
            result.Should().BeOfType<OkObjectResult>();
        }
    }
}
