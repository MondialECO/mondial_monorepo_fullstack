using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
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
using WebApp.Services;
using WebApp.Services.Interface;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class MarketplacePushPhase5Tests
    {
        private readonly Mock<IMongoDatabase> _dbMock = new();
        private readonly Mock<IMongoCollection<CreatorIdea>> _ideasColMock = new();
        private readonly Mock<IMongoCollection<ProjectInterest>> _interestsColMock = new();
        private readonly Mock<IMongoCollection<MarketplaceProjectAccessGrant>> _grantsColMock = new();
        private readonly Mock<IMongoCollection<MarketplaceProjectAccessLog>> _logsColMock = new();
        private readonly Mock<IMongoCollection<DealExecution>> _dealsColMock = new();
        private readonly Mock<IMongoCollection<Companies>> _companiesColMock = new();
        private readonly Mock<INotificationService> _notificationsMock = new();
        private readonly Mock<ILogger<DealsController>> _dealsLoggerMock = new();
        private readonly MongoDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        private readonly List<DealExecution> _dealsDb = new();
        private readonly List<MarketplaceProjectAccessLog> _logsDb = new();
        private readonly List<Companies> _companiesDb = new();

        public MarketplacePushPhase5Tests()
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
            _dbMock.Setup(d => d.GetCollection<Companies>("Companies", null))
                .Returns(_companiesColMock.Object);

            _ideasColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), It.IsAny<FindOptions<CreatorIdea, CreatorIdea>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((FilterDefinition<CreatorIdea> f, FindOptions<CreatorIdea, CreatorIdea> o, CancellationToken ct) => MakeCursor(new List<CreatorIdea>()));
            _grantsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<MarketplaceProjectAccessGrant>>(), It.IsAny<FindOptions<MarketplaceProjectAccessGrant, MarketplaceProjectAccessGrant>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((FilterDefinition<MarketplaceProjectAccessGrant> f, FindOptions<MarketplaceProjectAccessGrant, MarketplaceProjectAccessGrant> o, CancellationToken ct) => MakeCursor(new List<MarketplaceProjectAccessGrant>()));
            _interestsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<ProjectInterest>>(), It.IsAny<FindOptions<ProjectInterest, ProjectInterest>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((FilterDefinition<ProjectInterest> f, FindOptions<ProjectInterest, ProjectInterest> o, CancellationToken ct) => MakeCursor(new List<ProjectInterest>()));
            _companiesColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<Companies>>(), It.IsAny<FindOptions<Companies, Companies>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((FilterDefinition<Companies> f, FindOptions<Companies, Companies> o, CancellationToken ct) => MakeCursor(_companiesDb));

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
            string dealStage = "CAP_TABLE_PENDING",
            string roleStatus = "CONFIRMED",
            double equityPercentage = 15.0,
            int vestingMonths = 48,
            int cliffMonths = 12)
        {
            var deal = new DealExecution
            {
                Id = "deal_phase5_1",
                IdeaId = "idea_phase5_1",
                CreatorId = "creator_1",
                EntrepreneurId = "ent_1",
                DealType = "EQUITY_PARTNERSHIP",
                DealStage = dealStage,
                AcceptedRevisionNumber = 1,
                EquityTerms = new EquityTerms
                {
                    EquityPercentage = equityPercentage,
                    CreatorRole = "Chief Scientist",
                    CashComponent = 5000,
                    VestingEnabled = true,
                    VestingMonths = vestingMonths,
                    CliffMonths = cliffMonths
                },
                RoleAgreement = new RoleResponsibilityAgreement
                {
                    CreatorRole = "Chief Scientist",
                    EntrepreneurRole = "CEO",
                    CreatorResponsibilities = new List<string> { "IP Handover", "Tech Architecture" },
                    EntrepreneurResponsibilities = new List<string> { "GTM", "Fundraising" },
                    Status = roleStatus,
                    CreatorConfirmedVersion = 1,
                    EntrepreneurConfirmedVersion = 1,
                    Version = 1
                },
                Version = 1
            };

            _dealsDb.Clear();
            _dealsDb.Add(deal);
            return deal;
        }

        // A. Deal not in CAP_TABLE_PENDING cannot access Screen 03
        [Fact]
        public async Task TestA_DealNotCapTablePending_CannotAccessScreen03()
        {
            var deal = SeedAcceptedDeal(dealStage: "OFFER_NEGOTIATION");
            var controller = CreateDealsController("creator_1");
            var result = await controller.GetCapTableDraft(deal.Id);

            result.Should().BeOfType<UnprocessableEntityObjectResult>();
        }

        // B. Role agreement must be confirmed first
        [Fact]
        public async Task TestB_RoleAgreementMustBeConfirmed()
        {
            var deal = SeedAcceptedDeal(roleStatus: "AWAITING_CONFIRMATION");
            var controller = CreateDealsController("creator_1");
            var result = await controller.GetCapTableDraft(deal.Id);

            result.Should().BeOfType<UnprocessableEntityObjectResult>();
        }

        // C. Initial draft seeds Creator accepted equity
        [Fact]
        public async Task TestC_InitialDraftSeedsCreatorAcceptedEquity()
        {
            var deal = SeedAcceptedDeal(equityPercentage: 18.5, vestingMonths: 36, cliffMonths: 6);
            var controller = CreateDealsController("creator_1");
            var result = await controller.GetCapTableDraft(deal.Id);

            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = response.Data.Should().BeOfType<DealCapTableDraftDto>().Subject;

            dto.CommercialTerms.EquityPercentage.Should().Be(18.5);
            var creatorEntry = dto.Entries.FirstOrDefault(e => e.IsCreator);
            creatorEntry.Should().NotBeNull();
            creatorEntry!.EquityPercent.Should().Be(18.5);
            creatorEntry.VestingMonths.Should().Be(36);
            creatorEntry.CliffMonths.Should().Be(6);
            creatorEntry.IsLocked.Should().BeTrue();
            dto.TotalAllocatedPercent.Should().Be(100.0);
        }

        // D. Accepted Creator equity cannot be changed through API
        [Fact]
        public async Task TestD_AcceptedCreatorEquity_CannotBeChanged()
        {
            var deal = SeedAcceptedDeal(equityPercentage: 15.0);
            var controller = CreateDealsController("ent_1", "Entrepreneur");
            // initialize draft
            await controller.GetCapTableDraft(deal.Id);

            var req = new UpdateCapTableDraftRequest
            {
                TotalShares = 10_000_000,
                Entries = new List<DealCapTableEntryDto>
                {
                    // Attempting to modify Creator equity to 10%
                    new DealCapTableEntryDto { UserId = "creator_1", EquityPercent = 10.0, IsCreator = true, VestingMonths = 48, CliffMonths = 12 },
                    new DealCapTableEntryDto { UserId = "ent_1", EquityPercent = 90.0, IsFounder = true }
                }
            };

            var result = await controller.UpdateCapTableDraft(deal.Id, req);
            result.Should().BeOfType<UnprocessableEntityObjectResult>();
        }

        // E. Accepted Vesting cannot be changed
        [Fact]
        public async Task TestE_AcceptedVesting_CannotBeChanged()
        {
            var deal = SeedAcceptedDeal(vestingMonths: 48);
            var controller = CreateDealsController("ent_1", "Entrepreneur");
            await controller.GetCapTableDraft(deal.Id);

            var req = new UpdateCapTableDraftRequest
            {
                TotalShares = 10_000_000,
                Entries = new List<DealCapTableEntryDto>
                {
                    // Attempting to change vesting from 48 to 12
                    new DealCapTableEntryDto { UserId = "creator_1", EquityPercent = 15.0, IsCreator = true, VestingMonths = 12, CliffMonths = 12 },
                    new DealCapTableEntryDto { UserId = "ent_1", EquityPercent = 85.0, IsFounder = true }
                }
            };

            var result = await controller.UpdateCapTableDraft(deal.Id, req);
            result.Should().BeOfType<UnprocessableEntityObjectResult>();
        }

        // F. Accepted Cliff cannot be changed
        [Fact]
        public async Task TestF_AcceptedCliff_CannotBeChanged()
        {
            var deal = SeedAcceptedDeal(cliffMonths: 12);
            var controller = CreateDealsController("ent_1", "Entrepreneur");
            await controller.GetCapTableDraft(deal.Id);

            var req = new UpdateCapTableDraftRequest
            {
                TotalShares = 10_000_000,
                Entries = new List<DealCapTableEntryDto>
                {
                    // Attempting to change cliff from 12 to 0
                    new DealCapTableEntryDto { UserId = "creator_1", EquityPercent = 15.0, IsCreator = true, VestingMonths = 48, CliffMonths = 0 },
                    new DealCapTableEntryDto { UserId = "ent_1", EquityPercent = 85.0, IsFounder = true }
                }
            };

            var result = await controller.UpdateCapTableDraft(deal.Id, req);
            result.Should().BeOfType<UnprocessableEntityObjectResult>();
        }

        // G. Total allocation != 100 rejected
        [Fact]
        public async Task TestG_OwnershipTotalNot100_Rejected()
        {
            var deal = SeedAcceptedDeal(equityPercentage: 15.0);
            var controller = CreateDealsController("ent_1", "Entrepreneur");
            await controller.GetCapTableDraft(deal.Id);

            var req = new UpdateCapTableDraftRequest
            {
                TotalShares = 10_000_000,
                Entries = new List<DealCapTableEntryDto>
                {
                    new DealCapTableEntryDto { UserId = "creator_1", EquityPercent = 15.0, IsCreator = true, VestingMonths = 48, CliffMonths = 12 },
                    new DealCapTableEntryDto { UserId = "ent_1", EquityPercent = 80.0, IsFounder = true } // 95% total
                }
            };

            var result = await controller.UpdateCapTableDraft(deal.Id, req);
            result.Should().BeOfType<UnprocessableEntityObjectResult>();
        }

        // H. Valid total 100 accepted
        [Fact]
        public async Task TestH_ValidTotal100_Accepted()
        {
            var deal = SeedAcceptedDeal(equityPercentage: 15.0);
            var controller = CreateDealsController("ent_1", "Entrepreneur");
            await controller.GetCapTableDraft(deal.Id);

            var req = new UpdateCapTableDraftRequest
            {
                TotalShares = 10_000_000,
                Entries = new List<DealCapTableEntryDto>
                {
                    new DealCapTableEntryDto { UserId = "creator_1", EquityPercent = 15.0, IsCreator = true, VestingMonths = 48, CliffMonths = 12 },
                    new DealCapTableEntryDto { UserId = "ent_1", EquityPercent = 75.0, IsFounder = true },
                    new DealCapTableEntryDto { DisplayName = "ESOP", EquityPercent = 10.0, StakeholderType = "esop" }
                },
                EsopPoolPercent = 10.0
            };

            var result = await controller.UpdateCapTableDraft(deal.Id, req);
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = response.Data.Should().BeOfType<DealCapTableDraftDto>().Subject;

            dto.Version.Should().Be(2);
            dto.TotalAllocatedPercent.Should().Be(100.0);
        }

        // I. Update increments cap table version & resets confirmations
        [Fact]
        public async Task TestI_UpdateIncrementsCapTableVersion_AndResetsConfirmations()
        {
            var deal = SeedAcceptedDeal(equityPercentage: 15.0);
            var creatorController = CreateDealsController("creator_1");
            await creatorController.GetCapTableDraft(deal.Id);
            await creatorController.ApproveCapTableDraft(deal.Id);

            deal.CapTableDraft!.CreatorConfirmedVersion.Should().Be(1);

            var entController = CreateDealsController("ent_1", "Entrepreneur");
            var req = new UpdateCapTableDraftRequest
            {
                TotalShares = 10_000_000,
                Entries = new List<DealCapTableEntryDto>
                {
                    new DealCapTableEntryDto { UserId = "creator_1", EquityPercent = 15.0, IsCreator = true, VestingMonths = 48, CliffMonths = 12 },
                    new DealCapTableEntryDto { UserId = "ent_1", EquityPercent = 80.0, IsFounder = true },
                    new DealCapTableEntryDto { DisplayName = "Reserve", EquityPercent = 5.0, StakeholderType = "investor_reserve" }
                }
            };

            var result = await entController.UpdateCapTableDraft(deal.Id, req);
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = response.Data.Should().BeOfType<DealCapTableDraftDto>().Subject;

            dto.Version.Should().Be(2);
            dto.CreatorConfirmedVersion.Should().Be(0);
            dto.CreatorConfirmedAt.Should().BeNull();
            dto.Status.Should().Be("AWAITING_CONFIRMATION");
        }

        // J. Creator approves current version
        [Fact]
        public async Task TestJ_CreatorApprovesCurrentVersion()
        {
            var deal = SeedAcceptedDeal(equityPercentage: 15.0);
            var controller = CreateDealsController("creator_1");
            await controller.GetCapTableDraft(deal.Id);

            var result = await controller.ApproveCapTableDraft(deal.Id);
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = response.Data.Should().BeOfType<DealCapTableDraftDto>().Subject;

            dto.CreatorConfirmedVersion.Should().Be(1);
            dto.CreatorConfirmedAt.Should().NotBeNull();
            dto.Status.Should().Be("CREATOR_APPROVED");
            deal.DealStage.Should().Be("CAP_TABLE_PENDING");
        }

        // K. Entrepreneur approves current version
        [Fact]
        public async Task TestK_EntrepreneurApprovesCurrentVersion()
        {
            var deal = SeedAcceptedDeal(equityPercentage: 15.0);
            var controller = CreateDealsController("ent_1", "Entrepreneur");
            await controller.GetCapTableDraft(deal.Id);

            var result = await controller.ApproveCapTableDraft(deal.Id);
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = response.Data.Should().BeOfType<DealCapTableDraftDto>().Subject;

            dto.EntrepreneurConfirmedVersion.Should().Be(1);
            dto.EntrepreneurConfirmedAt.Should().NotBeNull();
            dto.Status.Should().Be("ENTREPRENEUR_APPROVED");
        }

        // L. Both current version approvals -> APPROVED & advances to LEGAL_REVIEW_PENDING
        [Fact]
        public async Task TestL_BothCurrentVersionApprovals_ApprovedAndAdvancesToLegalReview()
        {
            var deal = SeedAcceptedDeal(equityPercentage: 15.0);
            var creatorController = CreateDealsController("creator_1");
            await creatorController.GetCapTableDraft(deal.Id);
            await creatorController.ApproveCapTableDraft(deal.Id);

            var entController = CreateDealsController("ent_1", "Entrepreneur");
            var result = await entController.ApproveCapTableDraft(deal.Id);

            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = response.Data.Should().BeOfType<DealCapTableDraftDto>().Subject;

            dto.Status.Should().Be("APPROVED");
            deal.DealStage.Should().Be("LEGAL_REVIEW_PENDING");
        }

        // M. Approvals from different versions do not approve
        [Fact]
        public async Task TestM_ApprovalsFromDifferentVersions_DoNotApprove()
        {
            var deal = SeedAcceptedDeal(equityPercentage: 15.0);
            var creatorController = CreateDealsController("creator_1");
            await creatorController.GetCapTableDraft(deal.Id);
            await creatorController.ApproveCapTableDraft(deal.Id);

            // Entrepreneur edits draft creating V2
            var entController = CreateDealsController("ent_1", "Entrepreneur");
            var req = new UpdateCapTableDraftRequest
            {
                TotalShares = 10_000_000,
                Entries = new List<DealCapTableEntryDto>
                {
                    new DealCapTableEntryDto { UserId = "creator_1", EquityPercent = 15.0, IsCreator = true, VestingMonths = 48, CliffMonths = 12 },
                    new DealCapTableEntryDto { UserId = "ent_1", EquityPercent = 80.0, IsFounder = true },
                    new DealCapTableEntryDto { DisplayName = "ESOP", EquityPercent = 5.0, StakeholderType = "esop" }
                }
            };
            await entController.UpdateCapTableDraft(deal.Id, req);

            // Entrepreneur approves V2, but Creator has not approved V2 yet
            var result = await entController.ApproveCapTableDraft(deal.Id);
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = response.Data.Should().BeOfType<DealCapTableDraftDto>().Subject;

            dto.Status.Should().Be("ENTREPRENEUR_APPROVED");
            deal.DealStage.Should().Be("CAP_TABLE_PENDING");
        }

        // N. Request changes invalidates stale confirmation and increments version
        [Fact]
        public async Task TestN_EditInvalidatesStaleConfirmation()
        {
            var deal = SeedAcceptedDeal(equityPercentage: 15.0);
            var creatorController = CreateDealsController("creator_1");
            await creatorController.GetCapTableDraft(deal.Id);
            await creatorController.ApproveCapTableDraft(deal.Id);

            var req = new RequestCapTableChangesRequest { Feedback = "Please add 5% ESOP." };
            var result = await creatorController.RequestCapTableChanges(deal.Id, req);

            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = response.Data.Should().BeOfType<DealCapTableDraftDto>().Subject;

            dto.Version.Should().Be(2);
            dto.CreatorConfirmedVersion.Should().Be(0);
            dto.Status.Should().Be("CHANGES_REQUESTED");
        }

        // O. Duplicate approve is idempotent
        [Fact]
        public async Task TestO_DuplicateApprove_IsIdempotent()
        {
            var deal = SeedAcceptedDeal(equityPercentage: 15.0);
            var controller = CreateDealsController("creator_1");
            await controller.GetCapTableDraft(deal.Id);
            await controller.ApproveCapTableDraft(deal.Id);

            var result = await controller.ApproveCapTableDraft(deal.Id);
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = response.Data.Should().BeOfType<DealCapTableDraftDto>().Subject;

            dto.Version.Should().Be(1);
            dto.CreatorConfirmedVersion.Should().Be(1);
        }

        // P. Concurrent update returns 409
        [Fact]
        public async Task TestP_ConcurrentUpdate_Returns409()
        {
            var deal = SeedAcceptedDeal(equityPercentage: 15.0);
            var controller = CreateDealsController("ent_1", "Entrepreneur");
            await controller.GetCapTableDraft(deal.Id);

            // Force mock to simulate concurrency conflict
            _dealsColMock.Setup(c => c.ReplaceOneAsync(
                It.IsAny<FilterDefinition<DealExecution>>(),
                It.IsAny<DealExecution>(),
                It.IsAny<ReplaceOptions>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(0, 0, null));

            var req = new UpdateCapTableDraftRequest
            {
                TotalShares = 10_000_000,
                Entries = new List<DealCapTableEntryDto>
                {
                    new DealCapTableEntryDto { UserId = "creator_1", EquityPercent = 15.0, IsCreator = true, VestingMonths = 48, CliffMonths = 12 },
                    new DealCapTableEntryDto { UserId = "ent_1", EquityPercent = 85.0, IsFounder = true }
                }
            };

            var result = await controller.UpdateCapTableDraft(deal.Id, req);
            var objResult = result.Should().BeOfType<ObjectResult>().Subject;
            objResult.StatusCode.Should().Be(409);
        }

        // Q. Edit vs Approve race is safe
        [Fact]
        public async Task TestQ_EditApproveRaceSafe()
        {
            var deal = SeedAcceptedDeal(equityPercentage: 15.0);
            var controller = CreateDealsController("creator_1");
            await controller.GetCapTableDraft(deal.Id);

            _dealsColMock.Setup(c => c.ReplaceOneAsync(
                It.IsAny<FilterDefinition<DealExecution>>(),
                It.IsAny<DealExecution>(),
                It.IsAny<ReplaceOptions>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(0, 0, null));

            var result = await controller.ApproveCapTableDraft(deal.Id);
            var objResult = result.Should().BeOfType<ObjectResult>().Subject;
            objResult.StatusCode.Should().Be(409);
        }

        // R. Actual Company remains unchanged
        [Fact]
        public async Task TestR_ActualCompanyRemainsUnchanged()
        {
            var deal = SeedAcceptedDeal(equityPercentage: 15.0);
            var creatorController = CreateDealsController("creator_1");
            await creatorController.GetCapTableDraft(deal.Id);
            await creatorController.ApproveCapTableDraft(deal.Id);

            var entController = CreateDealsController("ent_1", "Entrepreneur");
            await entController.ApproveCapTableDraft(deal.Id);

            _companiesColMock.Verify(c => c.InsertOneAsync(It.IsAny<Companies>(), It.IsAny<InsertOneOptions>(), It.IsAny<CancellationToken>()), Times.Never);
            _companiesColMock.Verify(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<Companies>>(), It.IsAny<Companies>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        // S. Unrelated user returns 403
        [Fact]
        public async Task TestS_UnrelatedUser_Returns403()
        {
            var deal = SeedAcceptedDeal();
            var controller = CreateDealsController("unrelated_user");
            var result = await controller.GetCapTableDraft(deal.Id);

            var objResult = result.Should().BeOfType<ObjectResult>().Subject;
            objResult.StatusCode.Should().Be(403);
        }

        // T. Idea isolation: unauthorized access forbidden
        [Fact]
        public async Task TestT_IdeaIsolation_UnauthorizedAccessForbidden()
        {
            var deal = SeedAcceptedDeal();
            var controller = CreateDealsController("another_idea_creator");
            var result = await controller.GetCapTableDraft(deal.Id);

            var objResult = result.Should().BeOfType<ObjectResult>().Subject;
            objResult.StatusCode.Should().Be(403);
        }

        // U. Completion advances to LEGAL_REVIEW_PENDING
        [Fact]
        public async Task TestU_CompletionAdvances_ToLegalReviewPending()
        {
            var deal = SeedAcceptedDeal(equityPercentage: 15.0);
            var creatorController = CreateDealsController("creator_1");
            await creatorController.GetCapTableDraft(deal.Id);
            await creatorController.ApproveCapTableDraft(deal.Id);

            var entController = CreateDealsController("ent_1", "Entrepreneur");
            var result = await entController.ApproveCapTableDraft(deal.Id);

            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            deal.DealStage.Should().Be("LEGAL_REVIEW_PENDING");
        }
    }
}
