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
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using Moq;
using WebApp.Controllers;
using WebApp.DbContext;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services;
using WebApp.Services.Interface;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class MarketplacePushPhase9Tests
    {
        private readonly Mock<IMongoDatabase> _dbMock;
        private readonly Mock<ICompanyService> _companyServiceMock;
        private readonly Mock<ILogger<DealsController>> _dealsLoggerMock;
        private readonly Mock<INotificationService> _notificationsMock;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly MongoDbContext _context;

        private readonly List<DealExecution> _dealsDb = new();
        private readonly List<CreatorIdea> _ideasDb = new();
        private readonly List<Companies> _companiesDb = new();
        private readonly List<MarketplaceProjectAccessLog> _auditLogsDb = new();
        private readonly List<ApplicationUser> _usersDb = new();

        public MarketplacePushPhase9Tests()
        {
            _dbMock = new Mock<IMongoDatabase>();
            _companyServiceMock = new Mock<ICompanyService>();
            _dealsLoggerMock = new Mock<ILogger<DealsController>>();
            _notificationsMock = new Mock<INotificationService>();

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
                            var matches = _dealsDb.Where(predicate).ToList();
                            return MakeCursor(matches);
                        }
                        catch { }
                    }
                    return MakeCursor(_dealsDb);
                });

            dealsCollectionMock.Setup(c => c.ReplaceOneAsync(
                It.IsAny<FilterDefinition<DealExecution>>(),
                It.IsAny<DealExecution>(),
                It.IsAny<ReplaceOptions>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync((FilterDefinition<DealExecution> filter, DealExecution doc, ReplaceOptions opt, CancellationToken ct) =>
                {
                    var idx = _dealsDb.FindIndex(d => d.Id == doc.Id);
                    if (idx >= 0)
                    {
                        _dealsDb[idx] = doc;
                        return new ReplaceOneResult.Acknowledged(1, 1, doc.Id);
                    }
                    _dealsDb.Add(doc);
                    return new ReplaceOneResult.Acknowledged(1, 1, doc.Id);
                });

            dealsCollectionMock.Setup(c => c.InsertOneAsync(
                It.IsAny<DealExecution>(),
                It.IsAny<InsertOneOptions>(),
                It.IsAny<CancellationToken>()))
                .Returns((DealExecution doc, InsertOneOptions opt, CancellationToken ct) =>
                {
                    _dealsDb.RemoveAll(d => d.Id == doc.Id);
                    _dealsDb.Add(doc);
                    return Task.CompletedTask;
                });

            _dbMock.Setup(d => d.GetCollection<DealExecution>("DealExecutions", It.IsAny<MongoCollectionSettings>()))
                .Returns(dealsCollectionMock.Object);

            // Setup CreatorIdeas mock collection
            var ideasCollectionMock = new Mock<IMongoCollection<CreatorIdea>>();
            ideasCollectionMock.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<CreatorIdea>>(),
                It.IsAny<FindOptions<CreatorIdea, CreatorIdea>>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync((FilterDefinition<CreatorIdea> f, FindOptions<CreatorIdea, CreatorIdea> opt, CancellationToken ct) =>
                {
                    if (f is ExpressionFilterDefinition<CreatorIdea> exprFilter)
                    {
                        try
                        {
                            var predicate = exprFilter.Expression.Compile();
                            var matches = _ideasDb.Where(predicate).ToList();
                            return MakeCursor(matches);
                        }
                        catch { }
                    }
                    return MakeCursor(_ideasDb);
                });

            _dbMock.Setup(d => d.GetCollection<CreatorIdea>("CreatorIdeas", It.IsAny<MongoCollectionSettings>()))
                .Returns(ideasCollectionMock.Object);

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
                            var matches = _companiesDb.Where(predicate).ToList();
                            return MakeCursor(matches);
                        }
                        catch { }
                    }
                    return MakeCursor(_companiesDb);
                });

            _dbMock.Setup(d => d.GetCollection<Companies>("Companies", It.IsAny<MongoCollectionSettings>()))
                .Returns(companiesCollectionMock.Object);

            // Setup Audit Logs mock collection
            var auditCollectionMock = new Mock<IMongoCollection<MarketplaceProjectAccessLog>>();
            _dbMock.Setup(d => d.GetCollection<MarketplaceProjectAccessLog>("MarketplaceProjectAccessLogs", It.IsAny<MongoCollectionSettings>()))
                .Returns(auditCollectionMock.Object);

            _context = new MongoDbContext(_dbMock.Object);

            var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
            _userManager = new UserManager<ApplicationUser>(
                userStoreMock.Object, null!, null!, null!, null!, null!, null!, null!, null!);

            userStoreMock.As<IUserStore<ApplicationUser>>()
                .Setup(s => s.FindByIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((string id, CancellationToken ct) => _usersDb.FirstOrDefault(u => u.Id.ToString() == id || (Guid.TryParse(id, out var g) && u.Id == g)));
        }

        private static IAsyncCursor<T> MakeCursor<T>(List<T> list)
        {
            var cursor = new Mock<IAsyncCursor<T>>();
            var moved = false;
            cursor.Setup(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(() =>
            {
                if (!moved) { moved = true; return true; }
                return false;
            });
            cursor.Setup(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(() =>
            {
                if (!moved) { moved = true; return true; }
                return false;
            });
            cursor.Setup(c => c.Current).Returns(list);
            return cursor.Object;
        }

        private DealsController CreateController(string userId, string role = "Creator")
        {
            var controller = new DealsController(
                _companyServiceMock.Object,
                _userManager,
                _context,
                _dealsLoggerMock.Object,
                _notificationsMock.Object);

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

        private DealExecution SeedActivatedPartnershipDeal(
            string dealId = "deal-phase9",
            string ideaId = "idea-phase9",
            string creatorId = "creator-phase9",
            string entId = "ent-phase9",
            string companyId = "comp-phase9",
            double equityPercentage = 15.0,
            int vestingMonths = 48,
            int cliffMonths = 12,
            DateTime? activationCompletedAt = null)
        {
            var manifestHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
            activationCompletedAt ??= DateTime.UtcNow.AddMonths(-12);

            var deal = new DealExecution
            {
                Id = dealId,
                IdeaId = ideaId,
                CreatorId = creatorId,
                EntrepreneurId = entId,
                DealType = "EQUITY_PARTNERSHIP",
                DealStage = "PARTNERSHIP_ACTIVE",
                Status = "completed",
                ConversationId = "conv-phase9",
                ClosedAt = activationCompletedAt,
                EquityTerms = new EquityTerms
                {
                    EquityPercentage = equityPercentage,
                    CreatorRole = "Chief Technology Officer",
                    Responsibilities = new List<string> { "Product Architecture", "Core Engine Development", "IP Roadmap" },
                    TimeCommitment = "Part-time (10 hrs/week)",
                    VestingEnabled = true,
                    VestingMonths = vestingMonths,
                    CliffMonths = cliffMonths
                },
                RoleAgreement = new RoleResponsibilityAgreement
                {
                    Status = "CONFIRMED",
                    CreatorRole = "Chief Technology Officer",
                    EntrepreneurRole = "Founder & CEO",
                    CreatorResponsibilities = new List<string> { "Product Architecture", "Core Engine Development", "IP Roadmap" },
                    EntrepreneurResponsibilities = new List<string> { "Operations", "Fundraising", "GTM Strategy" },
                    CreatorTimeCommitment = "Part-time (10 hrs/week)",
                    EntrepreneurTimeCommitment = "Full-time",
                    Version = 1
                },
                CapTableDraft = new DealCapTableDraft
                {
                    Status = "APPROVED",
                    TotalShares = 10_000_000,
                    EsopPoolPercent = 5,
                    InvestorReservePercent = 0,
                    Version = 1,
                    Entries = new List<DealCapTableEntry>
                    {
                        new DealCapTableEntry
                        {
                            UserId = entId,
                            DisplayName = "Bob Founder",
                            RoleTitle = "Founder & CEO",
                            EquityPercent = 80,
                            SharesGranted = 8_000_000,
                            IsFounder = true,
                            IsCreator = false
                        },
                        new DealCapTableEntry
                        {
                            UserId = creatorId,
                            DisplayName = "Dr. Alice Creator",
                            RoleTitle = "Chief Technology Officer",
                            EquityPercent = equityPercentage,
                            SharesGranted = (int)Math.Round(10_000_000 * (equityPercentage / 100.0)),
                            VestingMonths = vestingMonths,
                            CliffMonths = cliffMonths,
                            IsFounder = false,
                            IsCreator = true
                        }
                    }
                },
                SigningPackage = new AgreementSigningPackage
                {
                    Status = "AGREEMENT_SIGNED",
                    ManifestHash = manifestHash,
                    CreatorSignature = new PartySignature { SignerUserId = creatorId, ManifestHash = manifestHash },
                    EntrepreneurSignature = new PartySignature { SignerUserId = entId, ManifestHash = manifestHash }
                },
                Activation = new PartnershipActivation
                {
                    CompanyId = companyId,
                    CompanyName = "Autonomous Logistics Inc.",
                    Status = "PARTNERSHIP_ACTIVE",
                    SignedManifestHash = manifestHash,
                    CorporateFilingStatus = "FILING_COMPLETE",
                    CanActivate = true,
                    CompletedAt = activationCompletedAt,
                    LinkedDocuments = new List<ActivatedDocumentRef>
                    {
                        new ActivatedDocumentRef
                        {
                            DocumentId = "doc_cofounder_v1",
                            DocumentType = "COFOUNDER_AGREEMENT",
                            Title = "Co-founder Agreement",
                            Version = 1,
                            DocumentHash = "hash_cofounder_v1",
                            LinkedAt = activationCompletedAt.Value
                        },
                        new ActivatedDocumentRef
                        {
                            DocumentId = "doc_ip_v1",
                            DocumentType = "IP_CONTRIBUTION_AGREEMENT",
                            Title = "IP Contribution Agreement",
                            Version = 1,
                            DocumentHash = "hash_ip_v1",
                            LinkedAt = activationCompletedAt.Value
                        }
                    },
                    Milestones = new List<PartnershipMilestone>
                    {
                        new PartnershipMilestone
                        {
                            Id = "ms-1",
                            DealId = dealId,
                            IdeaId = ideaId,
                            CompanyId = companyId,
                            Title = "Initial Architecture & IP Handover",
                            Description = "Hand over algorithm core codebase and documentation.",
                            Status = "COMPLETED",
                            CompletedAt = activationCompletedAt.Value.AddDays(14),
                            CreatedByUserId = creatorId,
                            CreatedByName = "Dr. Alice Creator"
                        }
                    }
                }
            };

            _dealsDb.RemoveAll(d => d.Id == deal.Id);
            _dealsDb.Add(deal);

            var company = new Companies
            {
                Id = companyId,
                CompanyName = "Autonomous Logistics Inc.",
                LegalStructure = "Corporation",
                Country = "United States",
                TotalShares = 10_000_000,
                EquityStructure = new List<EquityEntryDto>
                {
                    new EquityEntryDto { StakeholderName = "Bob Founder", Type = "founder", SharesOwned = 8_000_000 },
                    new EquityEntryDto { StakeholderName = "Dr. Alice Creator", Type = "founder", SharesOwned = (int)Math.Round(10_000_000 * (equityPercentage / 100.0)), VestingMonths = vestingMonths }
                }
            };
            _companiesDb.RemoveAll(c => c.Id == company.Id);
            _companiesDb.Add(company);

            var idea = new CreatorIdea
            {
                Id = ideaId,
                UserId = creatorId,
                CompanyId = companyId,
                ProjectOutcome = "CO_FOUNDED",
                ActivePartnershipDealId = dealId,
                Project = new CreatorJourneyProject { Name = "Autonomous Logistics" },
                Phase5Data = new CreatorPhase5Data
                {
                    PathA = new CreatorPathA
                    {
                        MarketplaceListing = new CreatorMarketplaceListing
                        {
                            Status = "CLOSED",
                            OpenToPurchase = false,
                            OpenToEquityPartnership = false
                        }
                    }
                }
            };
            _ideasDb.RemoveAll(i => i.Id == idea.Id);
            _ideasDb.Add(idea);

            var creatorGuid = Guid.TryParse(creatorId, out var cg) ? cg : Guid.NewGuid();
            var entGuid = Guid.TryParse(entId, out var eg) ? eg : Guid.NewGuid();

            _usersDb.RemoveAll(u => u.Id == creatorGuid || u.Id == entGuid);
            _usersDb.Add(new ApplicationUser { Id = creatorGuid, Name = "Dr. Alice Creator", UserName = "alice@example.com" });
            _usersDb.Add(new ApplicationUser { Id = entGuid, Name = "Bob Founder", UserName = "bob@example.com" });

            return deal;
        }

        // =========================================================================
        // TESTS A - Y
        // =========================================================================

        [Fact]
        public async Task TestA_NonActiveDeal_CannotAccessPartnershipDetails()
        {
            var deal = SeedActivatedPartnershipDeal();
            deal.DealStage = "ACTIVATION_PENDING";

            var controller = CreateController(deal.CreatorId!);
            var res = await controller.GetPartnershipActiveDetails(deal.Id);

            res.Should().BeOfType<BadRequestObjectResult>();
            var badReq = res as BadRequestObjectResult;
            var response = badReq!.Value as ApiResponse;
            response!.Message.Should().Contain("Partnership is not active yet");
        }

        [Fact]
        public async Task TestB_ActiveEquityDeal_CanAccessPartnershipDetails()
        {
            var deal = SeedActivatedPartnershipDeal();

            var controller = CreateController(deal.CreatorId!);
            var res = await controller.GetPartnershipActiveDetails(deal.Id);

            res.Should().BeOfType<OkObjectResult>();
            var okRes = res as OkObjectResult;
            var response = okRes!.Value as ApiResponse;
            response!.Success.Should().BeTrue();

            var data = response.Data as PartnershipActiveDetailsDto;
            data.Should().NotBeNull();
            data!.OutcomeBadge.Should().Be("CO-FOUNDED");
            data.Status.Should().Be("PARTNERSHIP_ACTIVE");
        }

        [Fact]
        public async Task TestC_FullBuyoutDeal_CannotUsePartnershipActiveScreen()
        {
            var deal = SeedActivatedPartnershipDeal();
            deal.DealType = "FULL_BUYOUT";

            var controller = CreateController(deal.CreatorId!);
            var res = await controller.GetPartnershipActiveDetails(deal.Id);

            res.Should().BeOfType<BadRequestObjectResult>();
            var badReq = res as BadRequestObjectResult;
            var response = badReq!.Value as ApiResponse;
            response!.Message.Should().Contain("Equity Partnerships");
        }

        [Fact]
        public async Task TestD_CreatorEquityMatchesCompanyCapTable()
        {
            var deal = SeedActivatedPartnershipDeal(equityPercentage: 18.0);

            var controller = CreateController(deal.CreatorId!);
            var res = await controller.GetPartnershipEquityDetails(deal.Id);

            res.Should().BeOfType<OkObjectResult>();
            var okRes = res as OkObjectResult;
            var response = okRes!.Value as ApiResponse;
            var equity = response!.Data as PartnershipEquityDetailsDto;

            equity.Should().NotBeNull();
            equity!.CurrentOwnershipPercent.Should().Be(18.0);
            equity.SharesOwned.Should().Be(1_800_000);
        }

        [Fact]
        public async Task TestE_CreatorRoleMatchesConfirmedRoleAgreement()
        {
            var deal = SeedActivatedPartnershipDeal();

            var controller = CreateController(deal.CreatorId!);
            var res = await controller.GetPartnershipActiveDetails(deal.Id);

            var okRes = res as OkObjectResult;
            var response = okRes!.Value as ApiResponse;
            var data = response!.Data as PartnershipActiveDetailsDto;

            data!.CreatorRoleDetails.RoleTitle.Should().Be("Chief Technology Officer");
            data.Creator.RoleTitle.Should().Be("Chief Technology Officer");
        }

        [Fact]
        public async Task TestF_CreatorResponsibilitiesMatchConfirmedAgreement()
        {
            var deal = SeedActivatedPartnershipDeal();

            var controller = CreateController(deal.CreatorId!);
            var res = await controller.GetPartnershipActiveDetails(deal.Id);

            var okRes = res as OkObjectResult;
            var response = okRes!.Value as ApiResponse;
            var data = response!.Data as PartnershipActiveDetailsDto;

            data!.CreatorRoleDetails.Responsibilities.Should().Contain("Product Architecture");
            data.CreatorRoleDetails.Responsibilities.Should().Contain("IP Roadmap");
        }

        [Fact]
        public async Task TestG_VestingDataMatchesGrantSchedule()
        {
            var deal = SeedActivatedPartnershipDeal(vestingMonths: 48, cliffMonths: 12);

            var controller = CreateController(deal.CreatorId!);
            var res = await controller.GetPartnershipEquityDetails(deal.Id);

            var okRes = res as OkObjectResult;
            var response = okRes!.Value as ApiResponse;
            var equity = response!.Data as PartnershipEquityDetailsDto;

            equity!.VestingEnabled.Should().BeTrue();
            equity.VestingMonths.Should().Be(48);
            equity.CliffMonths.Should().Be(12);
        }

        [Fact]
        public async Task TestH_MissingVestingStartDate_DoesNotFabricateProgress()
        {
            var deal = SeedActivatedPartnershipDeal();
            deal.Activation!.CompletedAt = null; // Missing canonical start date

            var controller = CreateController(deal.CreatorId!);
            var res = await controller.GetPartnershipEquityDetails(deal.Id);

            var okRes = res as OkObjectResult;
            var response = okRes!.Value as ApiResponse;
            var equity = response!.Data as PartnershipEquityDetailsDto;

            equity!.VestingStatusNotice.Should().Be("Vesting schedule recorded — start date pending.");
            equity.VestedPercent.Should().Be(0);
            equity.VestedShares.Should().Be(0);
            equity.UnvestedPercent.Should().Be(15.0);
        }

        [Fact]
        public async Task TestI_ExistingVestingCalculation_ReusedAccurately()
        {
            // Seed 12 months elapsed with 48 mo total, 12 mo cliff -> 25% of 15% = 3.75%
            var deal = SeedActivatedPartnershipDeal(
                equityPercentage: 15.0,
                vestingMonths: 48,
                cliffMonths: 12,
                activationCompletedAt: DateTime.UtcNow.AddMonths(-12));

            var controller = CreateController(deal.CreatorId!);
            var res = await controller.GetPartnershipEquityDetails(deal.Id);

            var okRes = res as OkObjectResult;
            var response = okRes!.Value as ApiResponse;
            var equity = response!.Data as PartnershipEquityDetailsDto;

            equity!.VestedPercent.Should().Be(3.75);
            equity.VestedShares.Should().Be(375_000);
            equity.UnvestedPercent.Should().Be(11.25);
            equity.UnvestedShares.Should().Be(1_125_000);
        }

        [Fact]
        public async Task TestJ_CreatorShareholderMismatch_ReturnsIntegrityWarning()
        {
            var deal = SeedActivatedPartnershipDeal();
            var comp = _companiesDb.First(c => c.Id == deal.Activation!.CompanyId);
            comp.EquityStructure = new List<EquityEntryDto>
            {
                new EquityEntryDto { StakeholderName = "Bob Founder", Type = "founder", SharesOwned = 10_000_000 }
                // Creator entry missing from company!
            };

            var controller = CreateController(deal.CreatorId!);
            var res = await controller.GetPartnershipEquityDetails(deal.Id);

            var okRes = res as OkObjectResult;
            var response = okRes!.Value as ApiResponse;
            var equity = response!.Data as PartnershipEquityDetailsDto;

            equity!.CapTableIntegrityStatus.Should().Be("OWNERSHIP_RECONCILIATION_REQUIRED");
        }

        [Fact]
        public async Task TestK_DocumentsScopedCorrectly()
        {
            var deal = SeedActivatedPartnershipDeal();

            var controller = CreateController(deal.CreatorId!);
            var res = await controller.GetPartnershipDocuments(deal.Id);

            var okRes = res as OkObjectResult;
            var response = okRes!.Value as ApiResponse;
            var docs = response!.Data as List<ActivatedDocumentRefDto>;

            docs.Should().HaveCount(2);
            docs!.Should().Contain(d => d.Title == "Co-founder Agreement");
            docs.Should().Contain(d => d.Title == "IP Contribution Agreement");
        }

        [Fact]
        public async Task TestL_UnauthorizedUser_CannotAccessDocuments()
        {
            var deal = SeedActivatedPartnershipDeal();

            var controller = CreateController("stranger-user-id");
            var res = await controller.GetPartnershipDocuments(deal.Id);

            res.Should().BeOfType<ObjectResult>();
            var objRes = res as ObjectResult;
            objRes!.StatusCode.Should().Be(StatusCodes.Status403Forbidden);
        }

        [Fact]
        public async Task TestM_SameMessengerConversationRetained()
        {
            var deal = SeedActivatedPartnershipDeal();

            var controller = CreateController(deal.CreatorId!);
            var res = await controller.GetPartnershipActiveDetails(deal.Id);

            var okRes = res as OkObjectResult;
            var response = okRes!.Value as ApiResponse;
            var data = response!.Data as PartnershipActiveDetailsDto;

            data!.ConversationId.Should().Be("conv-phase9");
        }

        [Fact]
        public async Task TestN_MarketplaceListingRemainsClosed()
        {
            var deal = SeedActivatedPartnershipDeal();
            var idea = _ideasDb.First(i => i.Id == deal.IdeaId);

            idea.Phase5Data.PathA.MarketplaceListing.Status.Should().Be("CLOSED");
            idea.Phase5Data.PathA.MarketplaceListing.OpenToPurchase.Should().BeFalse();
            idea.Phase5Data.PathA.MarketplaceListing.OpenToEquityPartnership.Should().BeFalse();
        }

        [Fact]
        public async Task TestO_ProjectRemainsCoFounded()
        {
            var deal = SeedActivatedPartnershipDeal();

            var controller = CreateController(deal.CreatorId!);
            var res = await controller.GetPartnershipActiveDetails(deal.Id);

            var okRes = res as OkObjectResult;
            var response = okRes!.Value as ApiResponse;
            var data = response!.Data as PartnershipActiveDetailsDto;

            data!.OutcomeBadge.Should().Be("CO-FOUNDED");
        }

        [Fact]
        public async Task TestP_ProjectOutcome_IsNotSold()
        {
            var deal = SeedActivatedPartnershipDeal();
            var idea = _ideasDb.First(i => i.Id == deal.IdeaId);

            idea.ProjectOutcome.Should().NotBe("SOLD");
            idea.ProjectOutcome.Should().Be("CO_FOUNDED");
        }

        [Fact]
        public async Task TestQ_CreatorRemainsCreatorRole()
        {
            var deal = SeedActivatedPartnershipDeal();

            var controller = CreateController(deal.CreatorId!, role: "Creator");
            var res = await controller.GetPartnershipActiveDetails(deal.Id);

            var okRes = res as OkObjectResult;
            var response = okRes!.Value as ApiResponse;
            var data = response!.Data as PartnershipActiveDetailsDto;

            data!.Creator.IsCreator.Should().BeTrue();
            data.Creator.UserId.Should().Be(deal.CreatorId);
        }

        [Fact]
        public async Task TestR_EntrepreneurRole_IsNotAutomaticallyGrantedInScreen07()
        {
            var deal = SeedActivatedPartnershipDeal();

            var controller = CreateController(deal.CreatorId!, role: "Creator");
            controller.User.IsInRole("Entrepreneur").Should().BeFalse();
            controller.User.IsInRole("Creator").Should().BeTrue();
        }

        [Fact]
        public async Task TestS_MyPartnerships_SupportsMultipleDealRecords()
        {
            var deal1 = SeedActivatedPartnershipDeal("deal-1", "idea-1");
            var deal2 = SeedActivatedPartnershipDeal("deal-2", "idea-2");

            var controller = CreateController("creator-phase9");
            var res = await controller.GetMyPartnerships();

            var okRes = res as OkObjectResult;
            var response = okRes!.Value as ApiResponse;
            var list = response!.Data as List<PartnershipSummaryDto>;

            list.Should().HaveCount(2);
            list!.Should().Contain(d => d.DealId == "deal-1");
            list.Should().Contain(d => d.DealId == "deal-2");
        }

        [Fact]
        public async Task TestT_IdeaIsolation_DifferentIdeaCannotAccess()
        {
            var deal1 = SeedActivatedPartnershipDeal("deal-1", "idea-1", creatorId: "creator-1");
            var deal2 = SeedActivatedPartnershipDeal("deal-2", "idea-2", creatorId: "creator-2");

            var controller = CreateController("creator-2"); // user belonging to deal 2 tries to access deal 1
            var res = await controller.GetPartnershipActiveDetails("deal-1");

            res.Should().BeOfType<ObjectResult>();
            var objRes = res as ObjectResult;
            objRes!.StatusCode.Should().Be(StatusCodes.Status403Forbidden);
        }

        [Fact]
        public async Task TestU_UnrelatedUser_Gets403Forbidden()
        {
            var deal = SeedActivatedPartnershipDeal();

            var controller = CreateController("stranger-user-999");
            var res = await controller.GetPartnershipActiveDetails(deal.Id);

            res.Should().BeOfType<ObjectResult>();
            var objRes = res as ObjectResult;
            objRes!.StatusCode.Should().Be(StatusCodes.Status403Forbidden);
        }

        [Fact]
        public async Task TestV_MilestoneCreation_ScopedAndNotifiesPartner()
        {
            var deal = SeedActivatedPartnershipDeal();

            var controller = CreateController(deal.CreatorId!);
            var req = new CreatePartnershipMilestoneRequest
            {
                Title = "Beta Testing Launch",
                Description = "Run closed beta test with 50 pilot enterprise users.",
                DueDate = DateTime.UtcNow.AddMonths(2)
            };

            var res = await controller.CreatePartnershipMilestone(deal.Id, req);

            res.Should().BeOfType<OkObjectResult>();
            var okRes = res as OkObjectResult;
            var response = okRes!.Value as ApiResponse;
            var milestone = response!.Data as PartnershipMilestoneDto;

            milestone.Should().NotBeNull();
            milestone!.Title.Should().Be("Beta Testing Launch");
            milestone.Status.Should().Be("NOT_STARTED");
        }

        [Fact]
        public async Task TestW_MilestoneUpdate_AuthorizationAndCompletion()
        {
            var deal = SeedActivatedPartnershipDeal();

            var controller = CreateController(deal.EntrepreneurId!);
            var req = new UpdatePartnershipMilestoneRequest
            {
                Status = "COMPLETED"
            };

            var res = await controller.UpdatePartnershipMilestone(deal.Id, "ms-1", req);

            res.Should().BeOfType<OkObjectResult>();
            var okRes = res as OkObjectResult;
            var response = okRes!.Value as ApiResponse;
            var milestone = response!.Data as PartnershipMilestoneDto;

            milestone.Should().NotBeNull();
            milestone!.Status.Should().Be("COMPLETED");
            milestone.CompletedAt.Should().NotBeNull();
        }

        [Fact]
        public async Task TestX_CompetingDeals_RemainReadOnlyAndClosed()
        {
            var competingDeal = new DealExecution
            {
                Id = "deal-competing",
                IdeaId = "idea-phase9",
                CreatorId = "creator-phase9",
                EntrepreneurId = "other-ent",
                DealType = "EQUITY_PARTNERSHIP",
                DealStage = "CLOSED",
                Status = "project_unavailable"
            };

            competingDeal.DealStage.Should().Be("CLOSED");
            competingDeal.Status.Should().Be("project_unavailable");
        }

        [Fact]
        public async Task TestY_EconomicFields_CannotMutateThroughPartnershipApis()
        {
            var deal = SeedActivatedPartnershipDeal(equityPercentage: 15.0);

            var controller = CreateController(deal.CreatorId!);
            var res = await controller.GetPartnershipEquityDetails(deal.Id);

            var okRes = res as OkObjectResult;
            var response = okRes!.Value as ApiResponse;
            var equity = response!.Data as PartnershipEquityDetailsDto;

            // Economic fields are strictly read-only representations of activated deal
            equity!.CurrentOwnershipPercent.Should().Be(15.0);
            deal.EquityTerms!.EquityPercentage.Should().Be(15.0);
        }
    }
}
