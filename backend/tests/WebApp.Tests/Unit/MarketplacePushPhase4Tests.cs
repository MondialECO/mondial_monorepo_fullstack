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
using Xunit;

namespace WebApp.Tests.Unit
{
    public class MarketplacePushPhase4Tests
    {
        private readonly Mock<IMongoDatabase> _dbMock = new();
        private readonly Mock<IMongoCollection<CreatorIdea>> _ideasColMock = new();
        private readonly Mock<IMongoCollection<ProjectInterest>> _interestsColMock = new();
        private readonly Mock<IMongoCollection<MarketplaceProjectAccessGrant>> _grantsColMock = new();
        private readonly Mock<IMongoCollection<MarketplaceProjectAccessLog>> _logsColMock = new();
        private readonly Mock<IMongoCollection<DealExecution>> _dealsColMock = new();
        private readonly Mock<INotificationService> _notificationsMock = new();
        private readonly Mock<ILogger<DealsController>> _dealsLoggerMock = new();
        private readonly MongoDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        private readonly List<DealExecution> _dealsDb = new();
        private readonly List<MarketplaceProjectAccessLog> _logsDb = new();

        public MarketplacePushPhase4Tests()
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
                .ReturnsAsync((FilterDefinition<CreatorIdea> f, FindOptions<CreatorIdea, CreatorIdea> o, CancellationToken ct) => MakeCursor(new List<CreatorIdea>()));
            _grantsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<MarketplaceProjectAccessGrant>>(), It.IsAny<FindOptions<MarketplaceProjectAccessGrant, MarketplaceProjectAccessGrant>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((FilterDefinition<MarketplaceProjectAccessGrant> f, FindOptions<MarketplaceProjectAccessGrant, MarketplaceProjectAccessGrant> o, CancellationToken ct) => MakeCursor(new List<MarketplaceProjectAccessGrant>()));
            _interestsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<ProjectInterest>>(), It.IsAny<FindOptions<ProjectInterest, ProjectInterest>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((FilterDefinition<ProjectInterest> f, FindOptions<ProjectInterest, ProjectInterest> o, CancellationToken ct) => MakeCursor(new List<ProjectInterest>()));

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((FilterDefinition<DealExecution> f, FindOptions<DealExecution, DealExecution> o, CancellationToken ct) => MakeCursor(_dealsDb));

            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((FilterDefinition<DealExecution> f, DealExecution r, ReplaceOptions o, CancellationToken ct) =>
                {
                    var idx = _dealsDb.FindIndex(d => d.Id == r.Id);
                    if (idx >= 0)
                    {
                        _dealsDb[idx] = r;
                        return new ReplaceOneResult.Acknowledged(1, 1, r.Id);
                    }
                    return new ReplaceOneResult.Acknowledged(0, 0, null);
                });

            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), (ReplaceOptions)null!, It.IsAny<CancellationToken>()))
                .ReturnsAsync((FilterDefinition<DealExecution> f, DealExecution r, ReplaceOptions o, CancellationToken ct) =>
                {
                    var idx = _dealsDb.FindIndex(d => d.Id == r.Id);
                    if (idx >= 0)
                    {
                        _dealsDb[idx] = r;
                        return new ReplaceOneResult.Acknowledged(1, 1, r.Id);
                    }
                    return new ReplaceOneResult.Acknowledged(0, 0, null);
                });

            _logsColMock.Setup(c => c.InsertOneAsync(It.IsAny<MarketplaceProjectAccessLog>(), null, It.IsAny<CancellationToken>()))
                .Returns((MarketplaceProjectAccessLog log, InsertOneOptions o, CancellationToken ct) =>
                {
                    _logsDb.Add(log);
                    return Task.CompletedTask;
                });

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

        private DealsController CreateDealsController(string userId, string userRole = "Creator")
        {
            var companyServiceMock = new Mock<ICompanyService>();
            var controller = new DealsController(
                companyServiceMock.Object,
                _userManager,
                _context,
                _dealsLoggerMock.Object,
                _notificationsMock.Object
            );

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim("sub", userId),
                new Claim(ClaimTypes.Role, userRole)
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var claimsPrincipal = new ClaimsPrincipal(identity);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimsPrincipal }
            };

            return controller;
        }

        private DealExecution SeedAcceptedDeal(
            string dealId = "deal_phase4_1",
            string ideaId = "idea_1",
            string creatorId = "creator_1",
            string entrepreneurId = "ent_1")
        {
            var deal = new DealExecution
            {
                Id = dealId,
                IdeaId = ideaId,
                CreatorId = creatorId,
                EntrepreneurId = entrepreneurId,
                DealType = "EQUITY_PARTNERSHIP",
                DealStage = "ROLES_PENDING",
                Status = "initiated",
                CurrentTurn = "",
                AcceptedRevisionNumber = 1,
                AcceptedRevisionId = "rev_1",
                AcceptedAt = DateTime.UtcNow,
                Version = 1,
                EquityTerms = new EquityTerms
                {
                    EquityPercentage = 15,
                    CreatorRole = "Co-founder & Chief Scientist",
                    CashComponent = 5000,
                    VestingEnabled = true,
                    VestingMonths = 48,
                    CliffMonths = 12,
                    Responsibilities = new List<string> { "IP Handover", "Monthly Advisory" },
                    TimeCommitment = "5 hours / week"
                },
                Revisions = new List<TermSheetRevision>
                {
                    new TermSheetRevision
                    {
                        RevisionNumber = 1,
                        Status = "accepted",
                        OfferedByRole = "entrepreneur",
                        OfferedByUserId = entrepreneurId,
                        EquityTerms = new EquityTerms
                        {
                            EquityPercentage = 15,
                            CreatorRole = "Co-founder & Chief Scientist",
                            Responsibilities = new List<string> { "IP Handover", "Monthly Advisory" },
                            TimeCommitment = "5 hours / week"
                        }
                    }
                }
            };

            _dealsDb.Clear();
            _dealsDb.Add(deal);
            return deal;
        }

        // A. Negotiating deal cannot access roles setup (422)
        [Fact]
        public async Task TestA_NegotiatingDeal_CannotAccessRolesSetup()
        {
            var deal = SeedAcceptedDeal();
            deal.DealStage = "OFFER_NEGOTIATION";

            var controller = CreateDealsController("creator_1");
            var result = await controller.GetRoleAgreement(deal.Id);

            Assert.IsType<UnprocessableEntityObjectResult>(result);
        }

        // B. Rejected deal cannot access roles setup (422)
        [Fact]
        public async Task TestB_RejectedDeal_CannotAccessRolesSetup()
        {
            var deal = SeedAcceptedDeal();
            deal.DealStage = "REJECTED";

            var controller = CreateDealsController("creator_1");
            var result = await controller.GetRoleAgreement(deal.Id);

            Assert.IsType<UnprocessableEntityObjectResult>(result);
        }

        // C. Accepted deal enters ROLES_PENDING and auto-seeds RoleAgreement (200)
        [Fact]
        public async Task TestC_AcceptedDeal_EntersRolesPending_AutoSeeds()
        {
            var deal = SeedAcceptedDeal();
            deal.RoleAgreement = null; // Uninitialized

            var controller = CreateDealsController("creator_1");
            var result = await controller.GetRoleAgreement(deal.Id);

            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = response.Data.Should().BeOfType<RoleResponsibilityAgreementDto>().Subject;
            dto.CreatorRole.Should().Be("Co-founder & Chief Scientist");
            dto.EntrepreneurRole.Should().Be("CEO");
            dto.Version.Should().Be(1);
            dto.Status.Should().Be("AWAITING_CONFIRMATION");
        }

        // D. Initial Creator role seeded from accepted revision
        [Fact]
        public async Task TestD_InitialCreatorRole_SeededFromAcceptedRevision()
        {
            var deal = SeedAcceptedDeal();
            var controller = CreateDealsController("ent_1", "Entrepreneur");
            var result = await controller.GetRoleAgreement(deal.Id);

            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = response.Data.Should().BeOfType<RoleResponsibilityAgreementDto>().Subject;
            dto.CreatorResponsibilities.Should().Contain("IP Handover");
            dto.CreatorTimeCommitment.Should().Be("5 hours / week");
        }

        // E. Accepted Equity % cannot be changed through roles API (remains immutable)
        [Fact]
        public async Task TestE_AcceptedEquityPercentage_CannotBeChangedThroughRoles()
        {
            var deal = SeedAcceptedDeal();
            var controller = CreateDealsController("creator_1");

            var req = new UpdateRoleAgreementRequest
            {
                CreatorRole = "Chief Architect",
                CreatorResponsibilities = new List<string> { "Lead Roadmap", "Architecture Design" }
            };

            var result = await controller.UpdateRoleAgreement(deal.Id, req);
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = response.Data.Should().BeOfType<RoleResponsibilityAgreementDto>().Subject;

            dto.CommercialTerms.EquityPercentage.Should().Be(15);
            dto.CommercialTerms.CashComponent.Should().Be(5000);
            deal.EquityTerms!.EquityPercentage.Should().Be(15);
        }

        // F. Creator updates responsibilities -> version increments (V1 -> V2)
        [Fact]
        public async Task TestF_CreatorUpdatesResponsibilities_IncrementsVersion()
        {
            var deal = SeedAcceptedDeal();
            var controller = CreateDealsController("creator_1");

            var req = new UpdateRoleAgreementRequest
            {
                CreatorResponsibilities = new List<string> { "Deep Learning Architecture", "Bi-weekly syncs" }
            };

            var result = await controller.UpdateRoleAgreement(deal.Id, req);
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = response.Data.Should().BeOfType<RoleResponsibilityAgreementDto>().Subject;

            dto.Version.Should().Be(2);
            dto.Status.Should().Be("AWAITING_CONFIRMATION");
            dto.CreatorConfirmedVersion.Should().Be(0);
            dto.EntrepreneurConfirmedVersion.Should().Be(0);
        }

        // G. Entrepreneur updates responsibilities -> version increments (V2 -> V3)
        [Fact]
        public async Task TestG_EntrepreneurUpdatesResponsibilities_IncrementsVersion()
        {
            var deal = SeedAcceptedDeal();
            var cController = CreateDealsController("creator_1");
            await cController.UpdateRoleAgreement(deal.Id, new UpdateRoleAgreementRequest { CreatorRole = "CTO & Advisor" });

            var eController = CreateDealsController("ent_1", "Entrepreneur");
            var result = await eController.UpdateRoleAgreement(deal.Id, new UpdateRoleAgreementRequest
            {
                EntrepreneurRole = "Executive Chairman",
                EntrepreneurResponsibilities = new List<string> { "Series A Fundraising", "Executive Hiring" }
            });

            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = response.Data.Should().BeOfType<RoleResponsibilityAgreementDto>().Subject;
            dto.Version.Should().Be(3);
            dto.EntrepreneurRole.Should().Be("Executive Chairman");
        }

        // H. Creator confirms current version
        [Fact]
        public async Task TestH_CreatorConfirmsCurrentVersion()
        {
            var deal = SeedAcceptedDeal();
            var controller = CreateDealsController("creator_1");

            var result = await controller.ConfirmRoleAgreement(deal.Id);
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = response.Data.Should().BeOfType<RoleResponsibilityAgreementDto>().Subject;

            dto.CreatorConfirmedVersion.Should().Be(1);
            dto.EntrepreneurConfirmedVersion.Should().Be(0);
            dto.Status.Should().Be("CREATOR_CONFIRMED");
            deal.DealStage.Should().Be("ROLES_PENDING");
        }

        // I. Entrepreneur confirms current version
        [Fact]
        public async Task TestI_EntrepreneurConfirmsCurrentVersion()
        {
            var deal = SeedAcceptedDeal();
            var controller = CreateDealsController("ent_1", "Entrepreneur");

            var result = await controller.ConfirmRoleAgreement(deal.Id);
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = response.Data.Should().BeOfType<RoleResponsibilityAgreementDto>().Subject;

            dto.CreatorConfirmedVersion.Should().Be(0);
            dto.EntrepreneurConfirmedVersion.Should().Be(1);
            dto.Status.Should().Be("ENTREPRENEUR_CONFIRMED");
        }

        // J. Both confirm same version -> Status CONFIRMED & DealStage advances to CAP_TABLE_PENDING
        [Fact]
        public async Task TestJ_BothConfirmSameVersion_AdvancesToCapTablePending()
        {
            var deal = SeedAcceptedDeal();
            var cController = CreateDealsController("creator_1");
            await cController.ConfirmRoleAgreement(deal.Id);

            var eController = CreateDealsController("ent_1", "Entrepreneur");
            var result = await eController.ConfirmRoleAgreement(deal.Id);

            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = response.Data.Should().BeOfType<RoleResponsibilityAgreementDto>().Subject;

            dto.CreatorConfirmedVersion.Should().Be(1);
            dto.EntrepreneurConfirmedVersion.Should().Be(1);
            dto.Status.Should().Be("CONFIRMED");
            deal.DealStage.Should().Be("CAP_TABLE_PENDING");
        }

        // K. Confirmations from different versions do NOT confirm agreement
        [Fact]
        public async Task TestK_ConfirmationsFromDifferentVersions_DoNotConfirm()
        {
            var deal = SeedAcceptedDeal();
            var cController = CreateDealsController("creator_1");
            await cController.ConfirmRoleAgreement(deal.Id); // Confirmed V1

            // Entrepreneur edits -> advances to V2
            var eController = CreateDealsController("ent_1", "Entrepreneur");
            await eController.UpdateRoleAgreement(deal.Id, new UpdateRoleAgreementRequest { Notes = "Updated notes" });

            // Entrepreneur confirms V2
            var result = await eController.ConfirmRoleAgreement(deal.Id);
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = response.Data.Should().BeOfType<RoleResponsibilityAgreementDto>().Subject;

            dto.Version.Should().Be(2);
            dto.CreatorConfirmedVersion.Should().Be(0);
            dto.EntrepreneurConfirmedVersion.Should().Be(2);
            dto.Status.Should().Be("ENTREPRENEUR_CONFIRMED");
            deal.DealStage.Should().Be("ROLES_PENDING");
        }

        // L. Edit invalidates stale confirmation
        [Fact]
        public async Task TestL_EditInvalidatesStaleConfirmation()
        {
            var deal = SeedAcceptedDeal();
            var cController = CreateDealsController("creator_1");
            await cController.ConfirmRoleAgreement(deal.Id);
            deal.RoleAgreement!.CreatorConfirmedVersion.Should().Be(1);

            // Edit by Creator
            await cController.UpdateRoleAgreement(deal.Id, new UpdateRoleAgreementRequest { CreatorRole = "Founding Scientist" });

            deal.RoleAgreement.Version.Should().Be(2);
            deal.RoleAgreement.CreatorConfirmedVersion.Should().Be(0);
            deal.RoleAgreement.CreatorConfirmedAt.Should().BeNull();
            deal.RoleAgreement.Status.Should().Be("AWAITING_CONFIRMATION");
        }

        // M. Duplicate confirm is idempotent
        [Fact]
        public async Task TestM_DuplicateConfirm_IsIdempotent()
        {
            var deal = SeedAcceptedDeal();
            var cController = CreateDealsController("creator_1");

            var res1 = await cController.ConfirmRoleAgreement(deal.Id);
            var res2 = await cController.ConfirmRoleAgreement(deal.Id);

            var okResult1 = res1.Should().BeOfType<OkObjectResult>().Subject;
            var okResult2 = res2.Should().BeOfType<OkObjectResult>().Subject;

            var dto1 = okResult1.Value.Should().BeOfType<ApiResponse>().Subject.Data.Should().BeOfType<RoleResponsibilityAgreementDto>().Subject;
            var dto2 = okResult2.Value.Should().BeOfType<ApiResponse>().Subject.Data.Should().BeOfType<RoleResponsibilityAgreementDto>().Subject;

            dto1.Version.Should().Be(dto2.Version);
            dto1.CreatorConfirmedAt.Should().Be(dto2.CreatorConfirmedAt);
        }

        // N. Concurrent update returns 409 Conflict
        [Fact]
        public async Task TestN_ConcurrentUpdate_Returns409()
        {
            var deal = SeedAcceptedDeal();
            _dealsColMock
                .Setup(c => c.ReplaceOneAsync(
                    It.IsAny<FilterDefinition<DealExecution>>(),
                    It.IsAny<DealExecution>(),
                    It.IsAny<ReplaceOptions>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(0, 0, null)); // ModifiedCount = 0

            var cController = CreateDealsController("creator_1");
            var result = await cController.UpdateRoleAgreement(deal.Id, new UpdateRoleAgreementRequest { CreatorRole = "Architect" });

            var objectResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(409, objectResult.StatusCode);
        }

        // O. Edit / confirm race cannot finalize stale terms
        [Fact]
        public async Task TestO_EditConfirmRace_CannotFinalizeStaleTerms()
        {
            var deal = SeedAcceptedDeal();
            var cController = CreateDealsController("creator_1");
            await cController.ConfirmRoleAgreement(deal.Id); // Confirms V1

            // Change requested
            var eController = CreateDealsController("ent_1", "Entrepreneur");
            await eController.RequestRoleChanges(deal.Id, new RequestRoleChangesRequest { Feedback = "Need 10h commitment" });

            Assert.Equal(2, deal.RoleAgreement!.Version);
            Assert.Equal("CHANGES_REQUESTED", deal.RoleAgreement.Status);
            Assert.Equal(0, deal.RoleAgreement.CreatorConfirmedVersion);
            Assert.Equal("ROLES_PENDING", deal.DealStage);
        }

        // P. Unrelated user returns 403
        [Fact]
        public async Task TestP_UnrelatedUser_Returns403()
        {
            var deal = SeedAcceptedDeal();
            var controller = CreateDealsController("stranger_99");

            var getResult = await controller.GetRoleAgreement(deal.Id);
            Assert.IsType<ObjectResult>(getResult);
            Assert.Equal(403, ((ObjectResult)getResult).StatusCode);

            var updateResult = await controller.UpdateRoleAgreement(deal.Id, new UpdateRoleAgreementRequest());
            Assert.IsType<ObjectResult>(updateResult);
            Assert.Equal(403, ((ObjectResult)updateResult).StatusCode);
        }

        // Q. Idea A / Idea B isolation verified
        [Fact]
        public async Task TestQ_IdeaIsolation_IdeaAGrantCannotAccessIdeaB()
        {
            var dealA = SeedAcceptedDeal("deal_A", "idea_A", "creator_1", "ent_1");
            var dealB = new DealExecution
            {
                Id = "deal_B",
                IdeaId = "idea_B",
                CreatorId = "creator_2",
                EntrepreneurId = "ent_2",
                DealType = "EQUITY_PARTNERSHIP",
                DealStage = "ROLES_PENDING"
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { dealB }));

            var controller = CreateDealsController("creator_1"); // Creator of A only
            var result = await controller.GetRoleAgreement("deal_B");

            Assert.IsType<ObjectResult>(result);
            Assert.Equal(403, ((ObjectResult)result).StatusCode);
        }

        // R. Completion advances DealStage -> CAP_TABLE_PENDING
        [Fact]
        public async Task TestR_CompletionAdvancesDealStage_ToCapTablePending()
        {
            var deal = SeedAcceptedDeal();
            var cController = CreateDealsController("creator_1");
            var eController = CreateDealsController("ent_1", "Entrepreneur");

            await cController.ConfirmRoleAgreement(deal.Id);
            await eController.ConfirmRoleAgreement(deal.Id);

            Assert.Equal("CAP_TABLE_PENDING", deal.DealStage);
            Assert.Equal("CONFIRMED", deal.RoleAgreement!.Status);
            Assert.Contains(_logsDb, l => l.EventType == "roles_fully_confirmed");
        }
    }
}
