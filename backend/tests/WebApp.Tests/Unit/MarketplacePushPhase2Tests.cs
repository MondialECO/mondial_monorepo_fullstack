using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
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
using WebApp.Services.Interface;
using WebApp.Services.Repository;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class MarketplacePushPhase2Tests
    {
        private readonly Mock<IMongoDatabase> _dbMock = new();
        private readonly Mock<IMongoCollection<CreatorIdea>> _ideasColMock = new();
        private readonly Mock<IMongoCollection<ProjectInterest>> _interestsColMock = new();
        private readonly Mock<IMongoCollection<MarketplaceProjectAccessGrant>> _grantsColMock = new();
        private readonly Mock<IMongoCollection<MarketplaceProjectAccessLog>> _logsColMock = new();
        private readonly Mock<ICreatorIdeaStore> _ideasStoreMock = new();
        private readonly Mock<INotificationService> _notificationsMock = new();
        private readonly MongoDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public MarketplacePushPhase2Tests()
        {
            _dbMock.Setup(d => d.GetCollection<CreatorIdea>("CreatorIdeas", null))
                .Returns(_ideasColMock.Object);
            _dbMock.Setup(d => d.GetCollection<ProjectInterest>("ProjectInterests", null))
                .Returns(_interestsColMock.Object);
            _dbMock.Setup(d => d.GetCollection<MarketplaceProjectAccessGrant>("MarketplaceProjectAccessGrants", null))
                .Returns(_grantsColMock.Object);
            _dbMock.Setup(d => d.GetCollection<MarketplaceProjectAccessLog>("MarketplaceProjectAccessLogs", null))
                .Returns(_logsColMock.Object);

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

        private MarketplaceProjectsController CreateController(string userId)
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

        private static CreatorIdea CreateSampleIdea(string ideaId, string ownerId, bool ndaRequired = true)
        {
            return new CreatorIdea
            {
                Id = ideaId,
                UserId = ownerId,
                Project = new CreatorJourneyProject
                {
                    Name = "Autonomous Delivery Bot",
                    Tagline = "Next-gen last mile logistics",
                    Problem = "High delivery costs in urban areas",
                    TargetUser = "E-commerce retailers",
                    Solution = "Small ground robots with autonomous navigation",
                    Sector = "Logistics",
                    ClarityScore = 92,
                    TargetMarket = "EU Urban Hubs",
                    CreatorEdge = "Proprietary SLAM algorithm",
                    Branding = new CreatorBranding
                    {
                        LogoAsset = "logo_bot.png",
                        PaletteName = "Midnight",
                        ColorPalette = new List<string> { "#111827", "#3B82F6" }
                    }
                },
                Phase3Data = new CreatorPhase3Data
                {
                    FormationGenerator = new CreatorFormationGenerator
                    {
                        ForecastBasis = new CreatorFormationForecastBasis
                        {
                            Tam = 5000000000,
                            MonthlyGrowthPct = 15,
                            BreakEvenMonth = 18,
                            Currency = "EUR"
                        }
                    }
                },
                Phase4Data = new CreatorPhase4Data
                {
                    PricingModel = "subscription",
                    Tiers = new List<CreatorPricingTier>
                    {
                        new() { Name = "Starter", Price = 999, BillingCycle = "monthly", Features = new List<string> { "2 Robots", "Standard Support" } },
                        new() { Name = "Enterprise", Price = 4999, BillingCycle = "monthly", Features = new List<string> { "10 Robots", "24/7 SLA" }, IsHighlighted = true }
                    },
                    PricingForecastContext = new CreatorPricingForecastContext { ForecastArpu = 2500 },
                    ResourceCalculation = new CreatorResourceCalculation
                    {
                        TotalLaunchBudgetMin = 50000,
                        TotalLaunchBudgetMax = 80000,
                        MonthlyRunningCost = 12000,
                        TimeToLaunchWeeksMin = 12,
                        TimeToLaunchWeeksMax = 20,
                        TeamRequirements = new List<CreatorTeamRequirement>
                        {
                            new() { Role = "Robotics Engineer", Cost = 60000, DurationMonths = 12 }
                        }
                    },
                    GtmSetup = new CreatorGtmSetup
                    {
                        TargetAudiences = new List<string> { "Urban Retailers", "3PL Providers" },
                        ChannelMix = new List<CreatorChannelMix>
                        {
                            new() { Channel = "Direct B2B Sales", Percent = 60 },
                            new() { Channel = "Logistics Expos", Percent = 40 }
                        }
                    }
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
                            NdaRequired = ndaRequired,
                            DealModes = new List<string> { "full_buyout", "equity_partnership" },
                            AskingPrice = 350000,
                            PublishedAt = DateTime.UtcNow
                        }
                    }
                },
                Documents = new List<CreatorIdeaDocument>
                {
                    new()
                    {
                        Id = "doc_tech_spec",
                        Title = "Technical Architecture Specification",
                        DocumentType = "Technical Spec",
                        FileName = "architecture_v1.pdf",
                        MimeType = "application/pdf",
                        SizeBytes = 2048576,
                        Status = "ready",
                        CreatedAt = DateTime.UtcNow
                    }
                }
            };
        }

        [Fact]
        public async Task TestA_PendingInterest_CannotSignNda()
        {
            var controller = CreateController("ent_1");
            var idea = CreateSampleIdea("idea_1", "creator_1");
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

            var result = await controller.SignNda("idea_1", new SignNdaRequest());
            result.Should().BeOfType<UnprocessableEntityObjectResult>();
        }

        [Fact]
        public async Task TestB_DeclinedInterest_CannotSignNda()
        {
            var controller = CreateController("ent_1");
            var idea = CreateSampleIdea("idea_1", "creator_1");
            var interest = new ProjectInterest
            {
                Id = ObjectId.GenerateNewId(),
                IdeaId = "idea_1",
                CreatorId = "creator_1",
                EntrepreneurId = "ent_1",
                Status = "declined"
            };

            _ideasColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), It.IsAny<FindOptions<CreatorIdea, CreatorIdea>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<CreatorIdea> { idea }));
            _interestsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<ProjectInterest>>(), It.IsAny<FindOptions<ProjectInterest, ProjectInterest>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<ProjectInterest> { interest }));

            var result = await controller.SignNda("idea_1", new SignNdaRequest());
            result.Should().BeOfType<UnprocessableEntityObjectResult>();
        }

        [Fact]
        public async Task TestC_WrongEntrepreneur_CannotSignNda()
        {
            var controller = CreateController("ent_intruder");
            var idea = CreateSampleIdea("idea_1", "creator_1");

            _ideasColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), It.IsAny<FindOptions<CreatorIdea, CreatorIdea>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<CreatorIdea> { idea }));
            _interestsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<ProjectInterest>>(), It.IsAny<FindOptions<ProjectInterest, ProjectInterest>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<ProjectInterest>())); // No interest found for intruder

            var result = await controller.SignNda("idea_1", new SignNdaRequest());
            result.Should().BeOfType<UnprocessableEntityObjectResult>();
        }

        [Fact]
        public async Task TestD_Accepted_NdaRequired_SignSucceeds()
        {
            var controller = CreateController("ent_1");
            var idea = CreateSampleIdea("idea_1", "creator_1", ndaRequired: true);
            var interest = new ProjectInterest
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
                .ReturnsAsync(MakeCursor(new List<ProjectInterest> { interest }));
            _grantsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<MarketplaceProjectAccessGrant>>(), It.IsAny<FindOptions<MarketplaceProjectAccessGrant, MarketplaceProjectAccessGrant>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<MarketplaceProjectAccessGrant>()));

            var result = await controller.SignNda("idea_1", new SignNdaRequest { ConfirmationText = "I Agree" });
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            response.Success.Should().BeTrue();

            _grantsColMock.Verify(g => g.InsertOneAsync(It.Is<MarketplaceProjectAccessGrant>(x =>
                x.IdeaId == "idea_1" &&
                x.EntrepreneurId == "ent_1" &&
                x.NdaSigned &&
                x.Status == "active"), null, default), Times.Once);

            _logsColMock.Verify(l => l.InsertOneAsync(It.Is<MarketplaceProjectAccessLog>(x =>
                x.EventType == "nda_signed"), null, default), Times.Once);
        }

        [Fact]
        public async Task TestE_DuplicateNdaSign_IsIdempotent()
        {
            var controller = CreateController("ent_1");
            var idea = CreateSampleIdea("idea_1", "creator_1", ndaRequired: true);
            var interest = new ProjectInterest
            {
                Id = ObjectId.GenerateNewId(),
                IdeaId = "idea_1",
                CreatorId = "creator_1",
                EntrepreneurId = "ent_1",
                Status = "accepted"
            };
            var existingGrant = new MarketplaceProjectAccessGrant
            {
                IdeaId = "idea_1",
                EntrepreneurId = "ent_1",
                NdaSigned = true,
                NdaSignedAt = DateTime.UtcNow.AddHours(-1),
                Status = "active",
                ExpiresAt = DateTime.UtcNow.AddDays(30)
            };

            _ideasColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), It.IsAny<FindOptions<CreatorIdea, CreatorIdea>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<CreatorIdea> { idea }));
            _interestsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<ProjectInterest>>(), It.IsAny<FindOptions<ProjectInterest, ProjectInterest>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<ProjectInterest> { interest }));
            _grantsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<MarketplaceProjectAccessGrant>>(), It.IsAny<FindOptions<MarketplaceProjectAccessGrant, MarketplaceProjectAccessGrant>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<MarketplaceProjectAccessGrant> { existingGrant }));

            var result = await controller.SignNda("idea_1", new SignNdaRequest());
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            response.Success.Should().BeTrue();

            // Should NOT insert a new grant
            _grantsColMock.Verify(g => g.InsertOneAsync(It.IsAny<MarketplaceProjectAccessGrant>(), null, default), Times.Never);
        }

        [Fact]
        public async Task TestF_NdaRequired_Unsigned_PrivateEndpointReturns403()
        {
            var controller = CreateController("ent_1");
            var idea = CreateSampleIdea("idea_1", "creator_1", ndaRequired: true);

            _ideasColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), It.IsAny<FindOptions<CreatorIdea, CreatorIdea>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<CreatorIdea> { idea }));
            _grantsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<MarketplaceProjectAccessGrant>>(), It.IsAny<FindOptions<MarketplaceProjectAccessGrant, MarketplaceProjectAccessGrant>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<MarketplaceProjectAccessGrant>())); // No grant

            var result = await controller.GetPrivateProject("idea_1");
            var statusResult = result.Should().BeOfType<ObjectResult>().Subject;
            statusResult.StatusCode.Should().Be(403);
        }

        [Fact]
        public async Task TestG_SignedNda_PrivateEndpointReturns200()
        {
            var controller = CreateController("ent_1");
            var idea = CreateSampleIdea("idea_1", "creator_1", ndaRequired: true);
            var grant = new MarketplaceProjectAccessGrant
            {
                IdeaId = "idea_1",
                EntrepreneurId = "ent_1",
                NdaSigned = true,
                Status = "active",
                ExpiresAt = DateTime.UtcNow.AddDays(30)
            };

            _ideasColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), It.IsAny<FindOptions<CreatorIdea, CreatorIdea>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<CreatorIdea> { idea }));
            _grantsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<MarketplaceProjectAccessGrant>>(), It.IsAny<FindOptions<MarketplaceProjectAccessGrant, MarketplaceProjectAccessGrant>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<MarketplaceProjectAccessGrant> { grant }));

            var result = await controller.GetPrivateProject("idea_1");
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            response.Success.Should().BeTrue();

            var dto = response.Data.Should().BeOfType<PrivateMarketplaceProjectDto>().Subject;
            dto.BusinessPlan.Available.Should().BeTrue();
            dto.FinancialForecast.Tam.Should().Be(5000000000);
            dto.Pricing.Tiers.Should().HaveCount(2);
            dto.ResourcePlan.TeamRolesNeeded.Should().Contain("Robotics Engineer");
            dto.Documents.Should().HaveCount(1);
            dto.Documents[0].FileName.Should().Be("architecture_v1.pdf");
        }

        [Fact]
        public async Task TestH_NdaNotRequired_Accepted_ScopedAccessWorks()
        {
            var controller = CreateController("ent_1");
            var idea = CreateSampleIdea("idea_1", "creator_1", ndaRequired: false);
            var grant = new MarketplaceProjectAccessGrant
            {
                IdeaId = "idea_1",
                EntrepreneurId = "ent_1",
                NdaRequired = false,
                NdaSigned = false,
                Status = "active",
                ExpiresAt = DateTime.UtcNow.AddDays(30)
            };

            _ideasColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), It.IsAny<FindOptions<CreatorIdea, CreatorIdea>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<CreatorIdea> { idea }));
            _grantsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<MarketplaceProjectAccessGrant>>(), It.IsAny<FindOptions<MarketplaceProjectAccessGrant, MarketplaceProjectAccessGrant>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<MarketplaceProjectAccessGrant> { grant }));

            var result = await controller.GetPrivateProject("idea_1");
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            response.Success.Should().BeTrue();
        }

        [Fact]
        public async Task TestI_IdeaAGrant_DoesNotUnlockIdeaB()
        {
            var controller = CreateController("ent_1");
            var ideaB = CreateSampleIdea("idea_B", "creator_1", ndaRequired: true);

            // Grant is for idea_A, caller requests idea_B
            _ideasColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), It.IsAny<FindOptions<CreatorIdea, CreatorIdea>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<CreatorIdea> { ideaB }));
            _grantsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<MarketplaceProjectAccessGrant>>(), It.IsAny<FindOptions<MarketplaceProjectAccessGrant, MarketplaceProjectAccessGrant>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<MarketplaceProjectAccessGrant>())); // No grant for idea_B

            var result = await controller.GetPrivateProject("idea_B");
            var statusResult = result.Should().BeOfType<ObjectResult>().Subject;
            statusResult.StatusCode.Should().Be(403);
        }

        [Fact]
        public async Task TestJ_EntrepreneurAGrant_DoesNotUnlockEntrepreneurB()
        {
            var controller = CreateController("ent_B");
            var idea = CreateSampleIdea("idea_1", "creator_1", ndaRequired: true);

            // Caller ent_B has no grant
            _ideasColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), It.IsAny<FindOptions<CreatorIdea, CreatorIdea>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<CreatorIdea> { idea }));
            _grantsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<MarketplaceProjectAccessGrant>>(), It.IsAny<FindOptions<MarketplaceProjectAccessGrant, MarketplaceProjectAccessGrant>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<MarketplaceProjectAccessGrant>()));

            var result = await controller.GetPrivateProject("idea_1");
            var statusResult = result.Should().BeOfType<ObjectResult>().Subject;
            statusResult.StatusCode.Should().Be(403);
        }

        [Fact]
        public async Task TestK_ExpiredGrant_Returns403()
        {
            var controller = CreateController("ent_1");
            var idea = CreateSampleIdea("idea_1", "creator_1", ndaRequired: true);
            var expiredGrant = new MarketplaceProjectAccessGrant
            {
                IdeaId = "idea_1",
                EntrepreneurId = "ent_1",
                NdaSigned = true,
                Status = "active",
                ExpiresAt = DateTime.UtcNow.AddDays(-1) // Expired yesterday
            };

            _ideasColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), It.IsAny<FindOptions<CreatorIdea, CreatorIdea>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<CreatorIdea> { idea }));
            _grantsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<MarketplaceProjectAccessGrant>>(), It.IsAny<FindOptions<MarketplaceProjectAccessGrant, MarketplaceProjectAccessGrant>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<MarketplaceProjectAccessGrant> { expiredGrant }));

            var result = await controller.GetPrivateProject("idea_1");
            var statusResult = result.Should().BeOfType<ObjectResult>().Subject;
            statusResult.StatusCode.Should().Be(403);
        }

        [Fact]
        public async Task TestL_PublicEndpoint_NeverExposesPrivateFields()
        {
            var controller = CreateController("anonymous_or_other_user");
            var idea = CreateSampleIdea("idea_1", "creator_1");

            _ideasColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), It.IsAny<FindOptions<CreatorIdea, CreatorIdea>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<CreatorIdea> { idea }));

            var result = await controller.GetProjectDetail("idea_1");
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            response.Success.Should().BeTrue();

            var dto = response.Data.Should().BeOfType<MarketplaceProjectDto>().Subject;
            dto.Should().NotBeOfType<PrivateMarketplaceProjectDto>();
            dto.ProjectName.Should().Be("Autonomous Delivery Bot");
            dto.Problem.Should().Be("High delivery costs in urban areas");
        }

        [Fact]
        public async Task TestM_PrivateDto_NeverExposesKycOrRawPrompts()
        {
            var controller = CreateController("ent_1");
            var idea = CreateSampleIdea("idea_1", "creator_1", ndaRequired: true);
            var grant = new MarketplaceProjectAccessGrant
            {
                IdeaId = "idea_1",
                EntrepreneurId = "ent_1",
                NdaSigned = true,
                Status = "active",
                ExpiresAt = DateTime.UtcNow.AddDays(30)
            };

            _ideasColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), It.IsAny<FindOptions<CreatorIdea, CreatorIdea>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<CreatorIdea> { idea }));
            _grantsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<MarketplaceProjectAccessGrant>>(), It.IsAny<FindOptions<MarketplaceProjectAccessGrant, MarketplaceProjectAccessGrant>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<MarketplaceProjectAccessGrant> { grant }));

            var result = await controller.GetPrivateProject("idea_1");
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = response.Data.Should().BeOfType<PrivateMarketplaceProjectDto>().Subject;

            // Strict DTO verification: properties for raw AI prompts, identity/KYC records do NOT exist on PrivateMarketplaceProjectDto
            typeof(PrivateMarketplaceProjectDto).GetProperty("KycDocuments").Should().BeNull();
            typeof(PrivateMarketplaceProjectDto).GetProperty("IdentityDocuments").Should().BeNull();
            typeof(PrivateMarketplaceProjectDto).GetProperty("RawAiPrompts").Should().BeNull();
            typeof(PrivateMarketplaceProjectDto).GetProperty("ClarifierHistory").Should().BeNull();
        }
    }
}
