using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
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
using WebApp.Models.Dtos;
using WebApp.Services.Interface;
using WebApp.Services.Repository;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class EntrepreneurProjectConnectionsTests
    {
        private readonly Mock<IMongoDatabase> _dbMock = new();
        private readonly Mock<IMongoCollection<CreatorIdea>> _ideasColMock = new();
        private readonly Mock<IMongoCollection<ProjectInterest>> _interestsColMock = new();
        private readonly Mock<IMongoCollection<MarketplaceProjectAccessGrant>> _grantsColMock = new();
        private readonly Mock<IMongoCollection<DealExecution>> _dealsColMock = new();
        private readonly Mock<IMongoCollection<ApplicationUser>> _usersColMock = new();
        private readonly Mock<ICreatorIdeaStore> _ideasStoreMock = new();
        private readonly Mock<INotificationService> _notificationsMock = new();
        private readonly MongoDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        private readonly List<CreatorIdea> _ideasDb = new();
        private readonly List<ProjectInterest> _interestsDb = new();
        private readonly List<MarketplaceProjectAccessGrant> _grantsDb = new();
        private readonly List<DealExecution> _dealsDb = new();
        private readonly List<ApplicationUser> _usersDb = new();

        public EntrepreneurProjectConnectionsTests()
        {
            _dbMock.Setup(d => d.GetCollection<CreatorIdea>("CreatorIdeas", null)).Returns(_ideasColMock.Object);
            _dbMock.Setup(d => d.GetCollection<ProjectInterest>("ProjectInterests", null)).Returns(_interestsColMock.Object);
            _dbMock.Setup(d => d.GetCollection<MarketplaceProjectAccessGrant>("MarketplaceProjectAccessGrants", null)).Returns(_grantsColMock.Object);
            _dbMock.Setup(d => d.GetCollection<DealExecution>("DealExecutions", null)).Returns(_dealsColMock.Object);
            _dbMock.Setup(d => d.GetCollection<ApplicationUser>("applicationUsers", null)).Returns(_usersColMock.Object);

            _context = new MongoDbContext(_dbMock.Object);

            var userStore = new Mock<IUserStore<ApplicationUser>>();
            _userManager = new UserManager<ApplicationUser>(
                userStore.Object, null!, null!, null!, null!, null!, null!, null!, null!);

            SetupMockCollection(_ideasColMock, _ideasDb);
            SetupMockCollection(_interestsColMock, _interestsDb);
            SetupMockCollection(_grantsColMock, _grantsDb);
            SetupMockCollection(_dealsColMock, _dealsDb);
            SetupMockCollection(_usersColMock, _usersDb);
        }

        private static void SetupMockCollection<T>(Mock<IMongoCollection<T>> mock, List<T> list)
        {
            mock.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<T>>(),
                It.IsAny<FindOptions<T, T>>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync((FilterDefinition<T> f, FindOptions<T, T> opt, CancellationToken ct) =>
                {
                    if (f is ExpressionFilterDefinition<T> exprFilter)
                    {
                        try
                        {
                            var predicate = exprFilter.Expression.Compile();
                            var matches = list.Where(predicate).ToList();
                            return MakeCursor(matches);
                        }
                        catch { }
                    }
                    return MakeCursor(list);
                });
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

        private MarketplaceProjectsController CreateController(string userId, string role = "Entrepreneur")
        {
            var controller = new MarketplaceProjectsController(
                _context,
                _userManager,
                _ideasStoreMock.Object,
                null,
                _notificationsMock.Object
            );

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, userId),
                new(ClaimTypes.Role, role)
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
            };

            return controller;
        }

        [Fact]
        public async Task Test_1_NoInteractions_ReturnsEmptyList()
        {
            var controller = CreateController("ent-1");
            var result = await controller.GetEntrepreneurProjectConnections();

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var data = resp.Data.Should().BeAssignableTo<IEnumerable<EntrepreneurProjectConnectionDto>>().Subject.ToList();

            data.Should().BeEmpty();
        }

        [Fact]
        public async Task Test_2_PendingInterest_ReturnsCardWithPendingStatus()
        {
            var idea = new CreatorIdea
            {
                Id = "6a75d05b1165663d6b897a01",
                UserId = "creator-1",
                Project = new CreatorJourneyProject { Name = "AI Logistics OS", Sector = "Logistics", Tagline = "Smart freight routing" }
            };
            _ideasDb.Add(idea);

            var interest = new ProjectInterest
            {
                Id = ObjectId.GenerateNewId(),
                IdeaId = "6a75d05b1165663d6b897a01",
                CreatorId = "creator-1",
                EntrepreneurId = "ent-1",
                Status = "pending",
                CreatedAt = DateTime.UtcNow
            };
            _interestsDb.Add(interest);

            var controller = CreateController("ent-1");
            var result = await controller.GetEntrepreneurProjectConnections();

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var data = resp.Data.Should().BeAssignableTo<IEnumerable<EntrepreneurProjectConnectionDto>>().Subject.ToList();

            data.Should().HaveCount(1);
            data[0].IdeaId.Should().Be("6a75d05b1165663d6b897a01");
            data[0].ProjectName.Should().Be("AI Logistics OS");
            data[0].DisplayStatus.Should().Be("Interest Pending");
            data[0].Category.Should().Be("Pending");
        }

        [Fact]
        public async Task Test_3_AcceptedInterest_WithNdaPending_ReturnsNdaPending()
        {
            var idea = new CreatorIdea
            {
                Id = "6a75d05b1165663d6b897a02",
                UserId = "creator-2",
                Project = new CreatorJourneyProject { Name = "MedTech Vision", Sector = "Healthtech" },
                Phase5Data = new CreatorPhase5Data
                {
                    PathA = new CreatorPathA
                    {
                        MarketplaceListing = new CreatorMarketplaceListing { NdaRequired = true }
                    }
                }
            };
            _ideasDb.Add(idea);

            var interest = new ProjectInterest
            {
                Id = ObjectId.GenerateNewId(),
                IdeaId = "6a75d05b1165663d6b897a02",
                CreatorId = "creator-2",
                EntrepreneurId = "ent-1",
                Status = "accepted",
                CreatedAt = DateTime.UtcNow.AddDays(-2)
            };
            _interestsDb.Add(interest);

            var grant = new MarketplaceProjectAccessGrant
            {
                IdeaId = "6a75d05b1165663d6b897a02",
                EntrepreneurId = "ent-1",
                NdaRequired = true,
                NdaSigned = false
            };
            _grantsDb.Add(grant);

            var controller = CreateController("ent-1");
            var result = await controller.GetEntrepreneurProjectConnections();

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var data = resp.Data.Should().BeAssignableTo<IEnumerable<EntrepreneurProjectConnectionDto>>().Subject.ToList();

            data.Should().HaveCount(1);
            data[0].IdeaId.Should().Be("6a75d05b1165663d6b897a02");
            data[0].DisplayStatus.Should().Be("NDA Pending");
            data[0].NdaStatus.Should().Be("PENDING");
            data[0].Category.Should().Be("Pending");
        }

        [Fact]
        public async Task Test_4_ActiveDealExecution_OverridesInterestStatus()
        {
            var idea = new CreatorIdea
            {
                Id = "6a75d05b1165663d6b897a03",
                UserId = "creator-3",
                Project = new CreatorJourneyProject { Name = "FinTech Core", Sector = "Fintech" }
            };
            _ideasDb.Add(idea);

            var interest = new ProjectInterest
            {
                Id = ObjectId.GenerateNewId(),
                IdeaId = "6a75d05b1165663d6b897a03",
                CreatorId = "creator-3",
                EntrepreneurId = "ent-1",
                Status = "accepted"
            };
            _interestsDb.Add(interest);

            var deal = new DealExecution
            {
                Id = "deal-3",
                IdeaId = "6a75d05b1165663d6b897a03",
                CreatorId = "creator-3",
                EntrepreneurId = "ent-1",
                DealType = "EQUITY_PARTNERSHIP",
                DealStage = "LEGAL_REVIEW_PENDING",
                Status = "initiated",
                UpdatedAt = DateTime.UtcNow
            };
            _dealsDb.Add(deal);

            var controller = CreateController("ent-1");
            var result = await controller.GetEntrepreneurProjectConnections();

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var data = resp.Data.Should().BeAssignableTo<IEnumerable<EntrepreneurProjectConnectionDto>>().Subject.ToList();

            data.Should().HaveCount(1);
            data[0].IdeaId.Should().Be("6a75d05b1165663d6b897a03");
            data[0].DisplayStatus.Should().Be("Legal Review");
            data[0].Category.Should().Be("Active");
            data[0].DealExecutionId.Should().Be("deal-3");
            data[0].DealType.Should().Be("EQUITY_PARTNERSHIP");
        }

        [Fact]
        public async Task Test_5_FullBuyoutSold_ReturnsSoldCompleted()
        {
            var idea = new CreatorIdea
            {
                Id = "6a75d05b1165663d6b897a04",
                UserId = "creator-4",
                Project = new CreatorJourneyProject { Name = "SaaS Analytics Engine", Sector = "SaaS" }
            };
            _ideasDb.Add(idea);

            var deal = new DealExecution
            {
                Id = "deal-4",
                IdeaId = "6a75d05b1165663d6b897a04",
                CreatorId = "creator-4",
                EntrepreneurId = "ent-1",
                DealType = "FULL_BUYOUT",
                DealStage = "SOLD",
                Status = "sold",
                BuyoutSaleRecord = new BuyoutSaleRecord { Status = "SOLD" },
                UpdatedAt = DateTime.UtcNow
            };
            _dealsDb.Add(deal);

            var controller = CreateController("ent-1");
            var result = await controller.GetEntrepreneurProjectConnections();

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var data = resp.Data.Should().BeAssignableTo<IEnumerable<EntrepreneurProjectConnectionDto>>().Subject.ToList();

            data.Should().HaveCount(1);
            data[0].IdeaId.Should().Be("6a75d05b1165663d6b897a04");
            data[0].DisplayStatus.Should().Be("SOLD");
            data[0].Category.Should().Be("Completed");
            data[0].ProjectOutcome.Should().Be("SOLD");
        }

        [Fact]
        public async Task Test_6_PartnershipActive_ReturnsCompletedPartnershipActive()
        {
            var idea = new CreatorIdea
            {
                Id = "6a75d05b1165663d6b897a05",
                UserId = "creator-5",
                Project = new CreatorJourneyProject { Name = "CleanTech Grid", Sector = "Energy" }
            };
            _ideasDb.Add(idea);

            var deal = new DealExecution
            {
                Id = "deal-5",
                IdeaId = "6a75d05b1165663d6b897a05",
                CreatorId = "creator-5",
                EntrepreneurId = "ent-1",
                DealType = "EQUITY_PARTNERSHIP",
                DealStage = "PARTNERSHIP_ACTIVE",
                Status = "active",
                Activation = new PartnershipActivation { Status = "ACTIVATED" }
            };
            _dealsDb.Add(deal);

            var controller = CreateController("ent-1");
            var result = await controller.GetEntrepreneurProjectConnections();

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var data = resp.Data.Should().BeAssignableTo<IEnumerable<EntrepreneurProjectConnectionDto>>().Subject.ToList();

            data.Should().HaveCount(1);
            data[0].IdeaId.Should().Be("6a75d05b1165663d6b897a05");
            data[0].DisplayStatus.Should().Be("Partnership Active");
            data[0].Category.Should().Be("Completed");
            data[0].ProjectOutcome.Should().Be("PARTNERSHIP_ACTIVE");
        }

        [Fact]
        public async Task Test_7_MultipleIdeasSameCreator_ReturnsSeparateCards()
        {
            var ideaA = new CreatorIdea
            {
                Id = "6a75d05b1165663d6b897a0a",
                UserId = "creator-same",
                Project = new CreatorJourneyProject { Name = "Project Alpha", Sector = "AI" }
            };
            var ideaB = new CreatorIdea
            {
                Id = "6a75d05b1165663d6b897a0b",
                UserId = "creator-same",
                Project = new CreatorJourneyProject { Name = "Project Beta", Sector = "SaaS" }
            };
            _ideasDb.AddRange(new[] { ideaA, ideaB });

            _interestsDb.Add(new ProjectInterest
            {
                Id = ObjectId.GenerateNewId(),
                IdeaId = "6a75d05b1165663d6b897a0a",
                CreatorId = "creator-same",
                EntrepreneurId = "ent-1",
                Status = "pending"
            });
            _interestsDb.Add(new ProjectInterest
            {
                Id = ObjectId.GenerateNewId(),
                IdeaId = "6a75d05b1165663d6b897a0b",
                CreatorId = "creator-same",
                EntrepreneurId = "ent-1",
                Status = "accepted"
            });

            var controller = CreateController("ent-1");
            var result = await controller.GetEntrepreneurProjectConnections();

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var data = resp.Data.Should().BeAssignableTo<IEnumerable<EntrepreneurProjectConnectionDto>>().Subject.ToList();

            data.Should().HaveCount(2);
            data.Select(d => d.IdeaId).Should().Contain(new[] { "6a75d05b1165663d6b897a0a", "6a75d05b1165663d6b897a0b" });
        }

        [Fact]
        public async Task Test_8_Deduplication_OneCardPerIdea()
        {
            var idea = new CreatorIdea
            {
                Id = "6a75d05b1165663d6b897a0c",
                UserId = "creator-1",
                Project = new CreatorJourneyProject { Name = "Dedup Project" }
            };
            _ideasDb.Add(idea);

            // Same idea has ProjectInterest, NDA grant, and DealExecution
            _interestsDb.Add(new ProjectInterest
            {
                Id = ObjectId.GenerateNewId(),
                IdeaId = "6a75d05b1165663d6b897a0c",
                CreatorId = "creator-1",
                EntrepreneurId = "ent-1",
                Status = "accepted"
            });
            _grantsDb.Add(new MarketplaceProjectAccessGrant
            {
                IdeaId = "6a75d05b1165663d6b897a0c",
                EntrepreneurId = "ent-1",
                NdaSigned = true
            });
            _dealsDb.Add(new DealExecution
            {
                Id = "deal-dedup",
                IdeaId = "6a75d05b1165663d6b897a0c",
                CreatorId = "creator-1",
                EntrepreneurId = "ent-1",
                DealType = "EQUITY_PARTNERSHIP",
                DealStage = "CAP_TABLE_PENDING"
            });

            var controller = CreateController("ent-1");
            var result = await controller.GetEntrepreneurProjectConnections();

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var data = resp.Data.Should().BeAssignableTo<IEnumerable<EntrepreneurProjectConnectionDto>>().Subject.ToList();

            data.Should().HaveCount(1);
            data[0].IdeaId.Should().Be("6a75d05b1165663d6b897a0c");
            data[0].DisplayStatus.Should().Be("Cap Table Draft");
        }

        [Fact]
        public async Task Test_9_Isolation_EntrepreneurCannotSeeOtherEntrepreneurConnections()
        {
            var idea = new CreatorIdea
            {
                Id = "6a75d05b1165663d6b897a0d",
                UserId = "creator-1",
                Project = new CreatorJourneyProject { Name = "Other's Project" }
            };
            _ideasDb.Add(idea);

            _interestsDb.Add(new ProjectInterest
            {
                Id = ObjectId.GenerateNewId(),
                IdeaId = "6a75d05b1165663d6b897a0d",
                CreatorId = "creator-1",
                EntrepreneurId = "ent-OTHER",
                Status = "accepted"
            });

            var controller = CreateController("ent-1");
            var result = await controller.GetEntrepreneurProjectConnections();

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var data = resp.Data.Should().BeAssignableTo<IEnumerable<EntrepreneurProjectConnectionDto>>().Subject.ToList();

            data.Should().BeEmpty();
        }

        [Fact]
        public async Task Test_10_ClosedListing_RemainsVisibleInConnections()
        {
            var idea = new CreatorIdea
            {
                Id = "6a75d05b1165663d6b897a0e",
                UserId = "creator-1",
                Project = new CreatorJourneyProject { Name = "Closed Listing Project" },
                Phase5Data = new CreatorPhase5Data
                {
                    PathA = new CreatorPathA
                    {
                        MarketplaceListing = new CreatorMarketplaceListing { Status = "closed", Audience = "private" }
                    }
                }
            };
            _ideasDb.Add(idea);

            _interestsDb.Add(new ProjectInterest
            {
                Id = ObjectId.GenerateNewId(),
                IdeaId = "6a75d05b1165663d6b897a0e",
                CreatorId = "creator-1",
                EntrepreneurId = "ent-1",
                Status = "accepted"
            });

            var controller = CreateController("ent-1");
            var result = await controller.GetEntrepreneurProjectConnections();

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var data = resp.Data.Should().BeAssignableTo<IEnumerable<EntrepreneurProjectConnectionDto>>().Subject.ToList();

            data.Should().HaveCount(1);
            data[0].IdeaId.Should().Be("6a75d05b1165663d6b897a0e");
            data[0].ProjectName.Should().Be("Closed Listing Project");
        }

        [Fact]
        public async Task Test_11_AuthenticatedUserGuid_ProjectInterest_ReturnsCorrectConnection()
        {
            const string userGuid = "e85516ec-a621-4c73-b065-e879c9d66651";
            const string ideaMongoId = "6a75d05b1165663d6b897a05";

            var idea = new CreatorIdea
            {
                Id = ideaMongoId,
                UserId = "creator-guid-1",
                Project = new CreatorJourneyProject { Name = "AI Healthcare Assistant", Sector = "Healthtech" }
            };
            _ideasDb.Add(idea);

            _interestsDb.Add(new ProjectInterest
            {
                Id = ObjectId.GenerateNewId(),
                IdeaId = ideaMongoId,
                CreatorId = "creator-guid-1",
                EntrepreneurId = userGuid,
                Status = "pending",
                CreatedAt = DateTime.UtcNow
            });

            var controller = CreateController(userGuid);
            var result = await controller.GetEntrepreneurProjectConnections();

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var data = resp.Data.Should().BeAssignableTo<IEnumerable<EntrepreneurProjectConnectionDto>>().Subject.ToList();

            data.Should().HaveCount(1);
            data[0].IdeaId.Should().Be(ideaMongoId);
            data[0].ProjectName.Should().Be("AI Healthcare Assistant");
            data[0].DisplayStatus.Should().Be("Interest Pending");
        }

        [Fact]
        public async Task Test_12_AuthenticatedUserGuid_MarketplaceProjectAccessGrant_ReturnsCorrectConnection()
        {
            const string userGuid = "e85516ec-a621-4c73-b065-e879c9d66651";
            const string ideaMongoId = "6a75d05b1165663d6b897a06";

            var idea = new CreatorIdea
            {
                Id = ideaMongoId,
                UserId = "creator-guid-2",
                Project = new CreatorJourneyProject { Name = "Enterprise Drone Cloud", Sector = "Logistics" }
            };
            _ideasDb.Add(idea);

            _grantsDb.Add(new MarketplaceProjectAccessGrant
            {
                Id = ObjectId.GenerateNewId(),
                IdeaId = ideaMongoId,
                CreatorId = "creator-guid-2",
                EntrepreneurId = userGuid,
                NdaRequired = true,
                NdaSigned = true,
                GrantedAt = DateTime.UtcNow
            });

            var controller = CreateController(userGuid);
            var result = await controller.GetEntrepreneurProjectConnections();

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var data = resp.Data.Should().BeAssignableTo<IEnumerable<EntrepreneurProjectConnectionDto>>().Subject.ToList();

            data.Should().HaveCount(1);
            data[0].IdeaId.Should().Be(ideaMongoId);
            data[0].ProjectName.Should().Be("Enterprise Drone Cloud");
            data[0].DisplayStatus.Should().Be("NDA Signed");
        }

        [Fact]
        public async Task Test_13_AuthenticatedUserGuid_DealExecution_ReturnsCorrectConnection()
        {
            const string userGuid = "e85516ec-a621-4c73-b065-e879c9d66651";
            const string ideaMongoId = "6a75d05b1165663d6b897a07";

            var idea = new CreatorIdea
            {
                Id = ideaMongoId,
                UserId = "creator-guid-3",
                Project = new CreatorJourneyProject { Name = "Quantum Encryption Mesh", Sector = "Security" }
            };
            _ideasDb.Add(idea);

            _dealsDb.Add(new DealExecution
            {
                Id = "deal-guid-1",
                IdeaId = ideaMongoId,
                CreatorId = "creator-guid-3",
                EntrepreneurId = userGuid,
                DealType = "FULL_BUYOUT",
                DealStage = "TERMS_NEGOTIATION",
                Status = "initiated",
                UpdatedAt = DateTime.UtcNow
            });

            var controller = CreateController(userGuid);
            var result = await controller.GetEntrepreneurProjectConnections();

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var data = resp.Data.Should().BeAssignableTo<IEnumerable<EntrepreneurProjectConnectionDto>>().Subject.ToList();

            data.Should().HaveCount(1);
            data[0].IdeaId.Should().Be(ideaMongoId);
            data[0].ProjectName.Should().Be("Quantum Encryption Mesh");
            data[0].DisplayStatus.Should().Be("Buyout Terms");
            data[0].Category.Should().Be("Active");
        }

        [Fact]
        public async Task Test_14_MalformedOrNonHexIdeaId_DoesNotCrashEndpoint()
        {
            const string userGuid = "e85516ec-a621-4c73-b065-e879c9d66651";

            // Non-hex / malformed ideaId
            _interestsDb.Add(new ProjectInterest
            {
                Id = ObjectId.GenerateNewId(),
                IdeaId = "invalid-guid-formatted-id-12345",
                CreatorId = "creator-guid-4",
                EntrepreneurId = userGuid,
                Status = "pending",
                CreatedAt = DateTime.UtcNow
            });

            var controller = CreateController(userGuid);
            var result = await controller.GetEntrepreneurProjectConnections();

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var data = resp.Data.Should().BeAssignableTo<IEnumerable<EntrepreneurProjectConnectionDto>>().Subject.ToList();

            data.Should().HaveCount(1);
            data[0].IdeaId.Should().Be("invalid-guid-formatted-id-12345");
            data[0].ProjectName.Should().Be("Untitled Project");
        }

        [Fact]
        public async Task Test_15_ScenarioA_SoldBuyout_ClosedListing_ReturnsProjectDetail()
        {
            const string buyerId = "buyer-guid-1";
            const string ideaId = "6a75d05b1165663d6b897a20";

            var idea = new CreatorIdea
            {
                Id = ideaId,
                UserId = "creator-1",
                AcquiredByUserId = buyerId,
                ProjectOutcome = "SOLD",
                Project = new CreatorJourneyProject { Name = "Acquired FinTech Suite" },
                Phase5Data = new CreatorPhase5Data
                {
                    PathA = new CreatorPathA
                    {
                        MarketplaceListing = new CreatorMarketplaceListing { Status = "closed", Audience = "private" }
                    }
                }
            };
            _ideasDb.Add(idea);

            _dealsDb.Add(new DealExecution
            {
                Id = "deal-sold-1",
                IdeaId = ideaId,
                CreatorId = "creator-1",
                EntrepreneurId = buyerId,
                DealType = "FULL_BUYOUT",
                DealStage = "SOLD",
                Status = "sold"
            });

            var controller = CreateController(buyerId);
            var result = await controller.GetProjectDetail(ideaId);

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var data = resp.Data.Should().BeOfType<MarketplaceProjectDto>().Subject;
            data.IdeaId.Should().Be(ideaId);
            data.ProjectName.Should().Be("Acquired FinTech Suite");
        }

        [Fact]
        public async Task Test_16_ScenarioB_PartnershipActive_ClosedListing_ReturnsProjectDetail()
        {
            const string entId = "partner-guid-1";
            const string ideaId = "6a75d05b1165663d6b897a21";

            var idea = new CreatorIdea
            {
                Id = ideaId,
                UserId = "creator-1",
                ProjectOutcome = "CO_FOUNDED",
                Project = new CreatorJourneyProject { Name = "Active Partnership AI" },
                Phase5Data = new CreatorPhase5Data
                {
                    PathA = new CreatorPathA
                    {
                        MarketplaceListing = new CreatorMarketplaceListing { Status = "closed", Audience = "private" }
                    }
                }
            };
            _ideasDb.Add(idea);

            _dealsDb.Add(new DealExecution
            {
                Id = "deal-part-1",
                IdeaId = ideaId,
                CreatorId = "creator-1",
                EntrepreneurId = entId,
                DealType = "EQUITY_PARTNERSHIP",
                DealStage = "PARTNERSHIP_ACTIVE",
                Status = "active"
            });

            var controller = CreateController(entId);
            var result = await controller.GetProjectDetail(ideaId);

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var data = resp.Data.Should().BeOfType<MarketplaceProjectDto>().Subject;
            data.IdeaId.Should().Be(ideaId);
            data.ProjectName.Should().Be("Active Partnership AI");
        }

        [Fact]
        public async Task Test_17_ScenarioC_UnrelatedEntrepreneur_ClosedListing_Returns404()
        {
            const string unrelatedUserId = "unrelated-user-guid";
            const string ideaId = "6a75d05b1165663d6b897a22";

            var idea = new CreatorIdea
            {
                Id = ideaId,
                UserId = "creator-1",
                Project = new CreatorJourneyProject { Name = "Private Project" },
                Phase5Data = new CreatorPhase5Data
                {
                    PathA = new CreatorPathA
                    {
                        MarketplaceListing = new CreatorMarketplaceListing { Status = "closed", Audience = "private" }
                    }
                }
            };
            _ideasDb.Add(idea);

            var controller = CreateController(unrelatedUserId);
            var result = await controller.GetProjectDetail(ideaId);

            var notFound = result.Should().BeOfType<NotFoundObjectResult>().Subject;
            var resp = notFound.Value.Should().BeOfType<ApiResponse>().Subject;
            resp.Success.Should().BeFalse();
            resp.Message.Should().Contain("private");
        }

        [Fact]
        public async Task Test_18_ScenarioD_DeclinedInterest_ClosedListing_ReturnsProjectDetail()
        {
            const string entId = "declined-ent-guid";
            const string ideaId = "6a75d05b1165663d6b897a23";

            var idea = new CreatorIdea
            {
                Id = ideaId,
                UserId = "creator-1",
                Project = new CreatorJourneyProject { Name = "Declined Inquiry Idea" },
                Phase5Data = new CreatorPhase5Data
                {
                    PathA = new CreatorPathA
                    {
                        MarketplaceListing = new CreatorMarketplaceListing { Status = "closed", Audience = "private" }
                    }
                }
            };
            _ideasDb.Add(idea);

            _interestsDb.Add(new ProjectInterest
            {
                Id = ObjectId.GenerateNewId(),
                IdeaId = ideaId,
                CreatorId = "creator-1",
                EntrepreneurId = entId,
                Status = "declined"
            });

            var controller = CreateController(entId);
            var result = await controller.GetProjectDetail(ideaId);

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var data = resp.Data.Should().BeOfType<MarketplaceProjectDto>().Subject;
            data.IdeaId.Should().Be(ideaId);
            data.ProjectName.Should().Be("Declined Inquiry Idea");
        }

        [Fact]
        public async Task Test_19_ScenarioE_ActiveRelationship_ClosedListing_ReturnsProjectDetail()
        {
            const string entId = "active-deal-ent-guid";
            const string ideaId = "6a75d05b1165663d6b897a24";

            var idea = new CreatorIdea
            {
                Id = ideaId,
                UserId = "creator-1",
                Project = new CreatorJourneyProject { Name = "In-Flight Deal Project" },
                Phase5Data = new CreatorPhase5Data
                {
                    PathA = new CreatorPathA
                    {
                        MarketplaceListing = new CreatorMarketplaceListing { Status = "closed", Audience = "private" }
                    }
                }
            };
            _ideasDb.Add(idea);

            _dealsDb.Add(new DealExecution
            {
                Id = "deal-flight-1",
                IdeaId = ideaId,
                CreatorId = "creator-1",
                EntrepreneurId = entId,
                DealType = "FULL_BUYOUT",
                DealStage = "BUYOUT_SIGNATURE_PENDING",
                Status = "initiated"
            });

            var controller = CreateController(entId);
            var result = await controller.GetProjectDetail(ideaId);

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var data = resp.Data.Should().BeOfType<MarketplaceProjectDto>().Subject;
            data.IdeaId.Should().Be(ideaId);
            data.ProjectName.Should().Be("In-Flight Deal Project");
        }
    }
}
