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
    public class BuyoutHandoverPhase6Tests
    {
        private readonly Mock<IMongoDatabase> _dbMock = new();
        private readonly Mock<IMongoCollection<CreatorIdea>> _ideasColMock = new();
        private readonly Mock<IMongoCollection<ProjectInterest>> _interestsColMock = new();
        private readonly Mock<IMongoCollection<MarketplaceProjectAccessGrant>> _grantsColMock = new();
        private readonly Mock<IMongoCollection<MarketplaceProjectAccessLog>> _logsColMock = new();
        private readonly Mock<IMongoCollection<DealExecution>> _dealsColMock = new();
        private readonly Mock<INotificationService> _notificationsMock = new();
        private readonly Mock<ICompanyService> _companyServiceMock = new();
        private readonly Mock<ILogger<DealsController>> _dealsLoggerMock = new();
        private readonly MongoDbContext _context;
        private readonly Mock<IUserStore<ApplicationUser>> _userStoreMock = new();
        private readonly UserManager<ApplicationUser> _userManager;

        public BuyoutHandoverPhase6Tests()
        {
            _dbMock.Setup(d => d.GetCollection<CreatorIdea>("CreatorIdeas", null)).Returns(_ideasColMock.Object);
            _dbMock.Setup(d => d.GetCollection<ProjectInterest>("ProjectInterests", null)).Returns(_interestsColMock.Object);
            _dbMock.Setup(d => d.GetCollection<MarketplaceProjectAccessGrant>("MarketplaceProjectAccessGrants", null)).Returns(_grantsColMock.Object);
            _dbMock.Setup(d => d.GetCollection<MarketplaceProjectAccessLog>("MarketplaceProjectAccessLogs", null)).Returns(_logsColMock.Object);
            _dbMock.Setup(d => d.GetCollection<DealExecution>("DealExecutions", null)).Returns(_dealsColMock.Object);

            _ideasColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), It.IsAny<FindOptions<CreatorIdea, CreatorIdea>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<CreatorIdea>()));
            _ideasColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), It.IsAny<CreatorIdea>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

            _grantsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<MarketplaceProjectAccessGrant>>(), It.IsAny<FindOptions<MarketplaceProjectAccessGrant, MarketplaceProjectAccessGrant>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<MarketplaceProjectAccessGrant>()));
            _logsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<MarketplaceProjectAccessLog>>(), It.IsAny<FindOptions<MarketplaceProjectAccessLog, MarketplaceProjectAccessLog>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<MarketplaceProjectAccessLog>()));
            _interestsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<ProjectInterest>>(), It.IsAny<FindOptions<ProjectInterest, ProjectInterest>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<ProjectInterest>()));
            _interestsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<ProjectInterest>>(), It.IsAny<ProjectInterest>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution>()));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

            _userStoreMock.Setup(s => s.FindByIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((string id, CancellationToken ct) => new ApplicationUser { Id = Guid.TryParse(id, out var g) ? g : Guid.NewGuid(), UserName = $"User_{id}", Name = $"User_{id}" });

            _context = new MongoDbContext(_dbMock.Object);

            _userManager = new UserManager<ApplicationUser>(
                _userStoreMock.Object, null!, null!, null!, null!, null!, null!, null!, null!
            );
        }

        private static IAsyncCursor<T> MakeCursor<T>(List<T> items)
        {
            var mockCursor = new Mock<IAsyncCursor<T>>();
            var moved = false;
            mockCursor.Setup(c => c.MoveNext(It.IsAny<CancellationToken>()))
                .Returns(() => { if (!moved) { moved = true; return true; } return false; });
            mockCursor.Setup(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => { if (!moved) { moved = true; return true; } return false; });
            mockCursor.Setup(c => c.Current).Returns(items);
            return mockCursor.Object;
        }

        private DealsController CreateController(string userId, string role = "Creator")
        {
            var ctrl = new DealsController(
                _companyServiceMock.Object,
                _userManager,
                _context,
                _dealsLoggerMock.Object,
                _notificationsMock.Object
            );

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Name, $"User_{userId}"),
                new Claim(ClaimTypes.Role, role)
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            ctrl.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
            };

            return ctrl;
        }

        private DealExecution CreateValidHandoverDeal(string dealId = "deal-1", string creatorId = "creator-1", string buyerId = "buyer-1", string ideaId = "idea-1")
        {
            const string manifestHash = "test_manifest_hash_phase6_12345678";
            return new DealExecution
            {
                Id = dealId,
                IdeaId = ideaId,
                CreatorId = creatorId,
                EntrepreneurId = buyerId,
                DealType = "FULL_BUYOUT",
                DealStage = "BUYOUT_HANDOVER_PENDING",
                Status = "in_progress",
                AcceptedRevisionNumber = 1,
                Version = 1,
                BuyoutTerms = new BuyoutTerms
                {
                    PurchasePrice = 27500m,
                    HandoverPeriodWeeks = 2,
                    TransitionSupportWeeks = 4,
                    IncludedAssets = new List<string> { "Brand", "Logo", "Business Plan", "Domain", "Source Code" }
                },
                BuyoutAssetManifest = new BuyoutAssetTransferManifest
                {
                    Id = "manifest-1",
                    DealId = dealId,
                    IdeaId = ideaId,
                    AcceptedRevisionNumber = 1,
                    PurchasePrice = 27500m,
                    Currency = "EUR",
                    Version = 1,
                    ManifestHash = manifestHash,
                    Assets = new List<BuyoutAssetEntry>
                    {
                        new BuyoutAssetEntry { AssetType = "Brand", DisplayName = "Brand & Trademark", TransferRequired = true, AvailabilityStatus = "AVAILABLE_IN_PLATFORM" },
                        new BuyoutAssetEntry { AssetType = "Logo", DisplayName = "Logo & Design Assets", TransferRequired = true, AvailabilityStatus = "AVAILABLE_IN_PLATFORM" },
                        new BuyoutAssetEntry { AssetType = "Business Plan", DisplayName = "Business Plan", TransferRequired = true, AvailabilityStatus = "AVAILABLE_IN_PLATFORM" },
                        new BuyoutAssetEntry { AssetType = "Domain", DisplayName = "Primary Domain (mondial.eco)", TransferRequired = true, AvailabilityStatus = "EXTERNAL_TRANSFER_REQUIRED" },
                        new BuyoutAssetEntry { AssetType = "Source Code", DisplayName = "Full Stack Codebase", TransferRequired = true, AvailabilityStatus = "EXTERNAL_TRANSFER_REQUIRED" }
                    }
                },
                BuyoutSigningPackage = new BuyoutSigningPackage
                {
                    Id = "sign-pkg-1",
                    DealId = dealId,
                    IdeaId = ideaId,
                    DealType = "FULL_BUYOUT",
                    Status = "AGREEMENT_SIGNED",
                    AcceptedBuyoutRevisionNumber = 1,
                    AssetManifestVersion = 1,
                    AssetManifestHash = manifestHash,
                    ManifestHash = manifestHash,
                    CreatorSignature = new PartySignature
                    {
                        SignerRole = "Creator",
                        SignerUserId = creatorId,
                        ManifestHash = manifestHash,
                        SignedAt = DateTime.UtcNow.AddHours(-2)
                    },
                    EntrepreneurSignature = new PartySignature
                    {
                        SignerRole = "Entrepreneur",
                        SignerUserId = buyerId,
                        ManifestHash = manifestHash,
                        SignedAt = DateTime.UtcNow.AddHours(-1)
                    }
                },
                BuyoutClosing = new BuyoutClosing
                {
                    Id = "closing-1",
                    DealId = dealId,
                    IdeaId = ideaId,
                    DealType = "FULL_BUYOUT",
                    AcceptedRevisionNumber = 1,
                    SigningPackageId = "sign-pkg-1",
                    ManifestHash = manifestHash,
                    PurchasePrice = 27500m,
                    Currency = "EUR",
                    PaymentMethod = "BANK_TRANSFER",
                    PaymentStatus = "PAYMENT_CONFIRMED",
                    ClosingStatus = "READY_FOR_HANDOVER",
                    CanProceedToHandover = true
                },
                BuyoutHandover = new BuyoutHandover
                {
                    Id = "handover-1",
                    DealId = dealId,
                    IdeaId = ideaId,
                    DealType = "FULL_BUYOUT",
                    AcceptedRevisionNumber = 1,
                    AssetManifestVersion = 1,
                    AssetManifestHash = manifestHash,
                    SigningPackageId = "sign-pkg-1",
                    ManifestHash = manifestHash,
                    ClosingId = "closing-1",
                    Status = "IN_PROGRESS",
                    StartedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    Version = 1,
                    Assets = new List<BuyoutHandoverAsset>
                    {
                        new BuyoutHandoverAsset { AssetId = "asset_brand", AssetType = "Brand", DisplayName = "Brand & Trademark", DeliveryType = "AVAILABLE_IN_PLATFORM", IsRequired = true, Status = "PENDING", Version = 1 },
                        new BuyoutHandoverAsset { AssetId = "asset_logo", AssetType = "Logo", DisplayName = "Logo & Design Assets", DeliveryType = "AVAILABLE_IN_PLATFORM", IsRequired = true, Status = "PENDING", Version = 1 },
                        new BuyoutHandoverAsset { AssetId = "asset_business_plan", AssetType = "Business Plan", DisplayName = "Business Plan", DeliveryType = "AVAILABLE_IN_PLATFORM", IsRequired = true, Status = "PENDING", Version = 1 },
                        new BuyoutHandoverAsset { AssetId = "asset_domain", AssetType = "Domain", DisplayName = "Primary Domain (mondial.eco)", DeliveryType = "EXTERNAL_TRANSFER_REQUIRED", IsRequired = true, Status = "PENDING", Version = 1 },
                        new BuyoutHandoverAsset { AssetId = "asset_source_code", AssetType = "Source Code", DisplayName = "Full Stack Codebase", DeliveryType = "EXTERNAL_TRANSFER_REQUIRED", IsRequired = true, Status = "PENDING", Version = 1 }
                    }
                }
            };
        }

        // ==========================================
        // 1. ENTRY GATE TESTS (A - E)
        // ==========================================

        [Fact]
        public async Task Test_A_DealType_MustBe_FULL_BUYOUT()
        {
            var deal = CreateValidHandoverDeal();
            deal.DealType = "EQUITY_PARTNERSHIP";

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));

            var controller = CreateController("creator-1");
            var result = await controller.GetBuyoutHandover("deal-1");

            var unprocessable = result.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
            var response = unprocessable.Value as ApiResponse;
            response!.Message.Should().Contain("only available for FULL_BUYOUT");
        }

        [Fact]
        public async Task Test_B_DealStage_MustBe_BUYOUT_HANDOVER_PENDING()
        {
            var deal = CreateValidHandoverDeal();
            deal.DealStage = "BUYOUT_CLOSING_PENDING";

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));

            var controller = CreateController("creator-1");
            var result = await controller.GetBuyoutHandover("deal-1");

            var unprocessable = result.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
            var response = unprocessable.Value as ApiResponse;
            response!.Message.Should().Contain("Must be BUYOUT_HANDOVER_PENDING");
        }

        [Fact]
        public async Task Test_C_PAYMENT_CONFIRMED_Required()
        {
            var deal = CreateValidHandoverDeal();
            deal.BuyoutClosing!.PaymentStatus = "PAYMENT_PENDING";

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));

            var controller = CreateController("creator-1");
            var result = await controller.GetBuyoutHandover("deal-1");

            var unprocessable = result.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
            var response = unprocessable.Value as ApiResponse;
            response!.Message.Should().Contain("Payment receipt must be confirmed");
        }

        [Fact]
        public async Task Test_D_SignedManifestHash_MustMatch_Closing()
        {
            var deal = CreateValidHandoverDeal();
            deal.BuyoutClosing!.ManifestHash = "tampered_hash_99999999";

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));

            var controller = CreateController("creator-1");
            var result = await controller.GetBuyoutHandover("deal-1");

            var unprocessable = result.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
            var response = unprocessable.Value as ApiResponse;
            response!.Message.Should().Contain("Closing manifest hash does not match");
        }

        // ==========================================
        // 2. HANDOVER SEEDING & IMMUTABILITY (F - G)
        // ==========================================

        [Fact]
        public async Task Test_F_Handover_Seeds_Exact_IncludedAssets()
        {
            var deal = CreateValidHandoverDeal();
            deal.BuyoutHandover = null; // Test automatic seeding

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));

            var controller = CreateController("creator-1");
            var result = await controller.GetBuyoutHandover("deal-1");

            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value as ApiResponse;
            var dto = response!.Data.Should().BeOfType<BuyoutHandoverDto>().Subject;

            dto.Assets.Should().HaveCount(5);
            dto.Assets.Should().Contain(a => a.DisplayName == "Brand & Trademark");
            dto.Assets.Should().Contain(a => a.DisplayName == "Primary Domain (mondial.eco)");
            dto.Assets.Should().Contain(a => a.DisplayName == "Full Stack Codebase");
            dto.CanCompleteSale.Should().BeFalse();
        }

        // ==========================================
        // 3. DELIVERY & VERIFICATION WORKFLOWS (H - N)
        // ==========================================

        [Fact]
        public async Task Test_H_Creator_Can_Deliver_Platform_Asset()
        {
            var deal = CreateValidHandoverDeal();

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));

            var controller = CreateController("creator-1");
            var result = await controller.DeliverBuyoutAsset("deal-1", "asset_business_plan", new DeliverBuyoutAssetRequest
            {
                DeliveryReference = "DOC-BP-V1-EXPORT",
                Notes = "Exported latest Business Plan PDF to deal bundle."
            });

            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value as ApiResponse;
            var dto = response!.Data.Should().BeOfType<BuyoutHandoverDto>().Subject;

            var asset = dto.Assets.Find(a => a.AssetId == "asset_business_plan");
            asset!.Status.Should().Be("DELIVERED");
            asset.DeliveryReference.Should().Be("DOC-BP-V1-EXPORT");
            asset.SellerDeliveredAt.Should().NotBeNull();
        }

        [Fact]
        public async Task Test_I_Buyer_Cannot_Mark_Seller_Delivery()
        {
            var deal = CreateValidHandoverDeal();

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));

            var controller = CreateController("buyer-1"); // Buyer attempting delivery
            var result = await controller.DeliverBuyoutAsset("deal-1", "asset_business_plan", new DeliverBuyoutAssetRequest
            {
                DeliveryReference = "DOC-BP-V1-EXPORT"
            });

            var forbidden = result.Should().BeOfType<ObjectResult>().Subject;
            forbidden.StatusCode.Should().Be(403);
        }

        [Fact]
        public async Task Test_J_Buyer_Can_Verify_Delivered_Asset()
        {
            var deal = CreateValidHandoverDeal();
            deal.BuyoutHandover!.Assets.Find(a => a.AssetId == "asset_business_plan")!.Status = "DELIVERED";

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));

            var controller = CreateController("buyer-1");
            var result = await controller.VerifyBuyoutAsset("deal-1", "asset_business_plan", new VerifyBuyoutAssetRequest
            {
                Notes = "Reviewed document, all sections confirmed."
            });

            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value as ApiResponse;
            var dto = response!.Data.Should().BeOfType<BuyoutHandoverDto>().Subject;

            var asset = dto.Assets.Find(a => a.AssetId == "asset_business_plan");
            asset!.Status.Should().Be("VERIFIED");
            asset.BuyerVerifiedAt.Should().NotBeNull();
        }

        [Fact]
        public async Task Test_K_Cannot_Verify_Undelivered_Asset()
        {
            var deal = CreateValidHandoverDeal();
            deal.BuyoutHandover!.Assets.Find(a => a.AssetId == "asset_domain")!.Status = "PENDING";

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));

            var controller = CreateController("buyer-1");
            var result = await controller.VerifyBuyoutAsset("deal-1", "asset_domain", new VerifyBuyoutAssetRequest());

            var unprocessable = result.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
            var response = unprocessable.Value as ApiResponse;
            response!.Message.Should().Contain("Seller must deliver the asset first");
        }

        [Fact]
        public async Task Test_N_Issue_Blocks_Sale_Completion()
        {
            var deal = CreateValidHandoverDeal();

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));

            var controller = CreateController("buyer-1");
            var result = await controller.ReportBuyoutAssetIssue("deal-1", "asset_domain", new ReportBuyoutAssetIssueRequest
            {
                IssueReason = "Domain transfer auth code expired."
            });

            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value as ApiResponse;
            var dto = response!.Data.Should().BeOfType<BuyoutHandoverDto>().Subject;

            dto.Status.Should().Be("CHANGES_REQUESTED");
            dto.CanCompleteSale.Should().BeFalse();
            dto.Blockers.Should().Contain(b => b.Contains("Domain transfer auth code expired"));
        }

        [Fact]
        public async Task Test_O_All_Assets_Verified_Enables_CanCompleteSale()
        {
            var deal = CreateValidHandoverDeal();

            // Mark all assets VERIFIED and record bilateral confirmations
            foreach (var a in deal.BuyoutHandover!.Assets)
            {
                a.Status = "VERIFIED";
                a.BuyerVerifiedAt = DateTime.UtcNow;
            }
            deal.BuyoutHandover.SellerConfirmedAt = DateTime.UtcNow;
            deal.BuyoutHandover.BuyerConfirmedAt = DateTime.UtcNow;

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));

            var controller = CreateController("buyer-1");
            var result = await controller.GetBuyoutHandover("deal-1");

            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value as ApiResponse;
            var dto = response!.Data.Should().BeOfType<BuyoutHandoverDto>().Subject;

            dto.CanCompleteSale.Should().BeTrue();
            dto.Blockers.Should().BeEmpty();
        }

        // ==========================================
        // 4. FINAL SALE COMPLETION & OUTCOME INVARIANTS (V - AN)
        // ==========================================

        [Fact]
        public async Task Test_W_CompleteSale_Sets_ProjectOutcome_SOLD_Not_CO_FOUNDED()
        {
            var deal = CreateValidHandoverDeal();

            foreach (var a in deal.BuyoutHandover!.Assets)
            {
                a.Status = "VERIFIED";
                a.BuyerVerifiedAt = DateTime.UtcNow;
            }
            deal.BuyoutHandover.SellerConfirmedAt = DateTime.UtcNow;
            deal.BuyoutHandover.BuyerConfirmedAt = DateTime.UtcNow;

            var idea = new CreatorIdea
            {
                Id = "idea-1",
                UserId = "creator-1",
                Project = new CreatorJourneyProject { Name = "Mondial Eco" }
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));
            _ideasColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), It.IsAny<FindOptions<CreatorIdea, CreatorIdea>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<CreatorIdea> { idea }));

            var controller = CreateController("buyer-1");
            var result = await controller.CompleteBuyoutSale("deal-1", new CompleteBuyoutSaleRequest());

            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value as ApiResponse;
            var dealDto = response!.Data.Should().BeOfType<EquityDealDto>().Subject;

            // Invariants
            dealDto.DealStage.Should().Be("SOLD");
            dealDto.Status.Should().Be("completed");
            dealDto.BuyoutSaleRecord.Should().NotBeNull();
            dealDto.BuyoutSaleRecord!.Status.Should().Be("SOLD");
            dealDto.BuyoutSaleRecord.PurchasePrice.Should().Be(27500m);

            // Idea Outcome Invariants
            idea.ProjectOutcome.Should().Be("SOLD");
            idea.ProjectOutcome.Should().NotBe("CO_FOUNDED");
            idea.ActiveBuyoutDealId.Should().Be("deal-1");
            idea.AcquiredByUserId.Should().Be("buyer-1");
            idea.SoldAt.Should().NotBeNull();
            idea.SalePrice.Should().Be(27500m);

            // No Co-founder or Cap Table state
            deal.Activation.Should().BeNull();
            deal.CapTableDraft.Should().BeNull();
        }

        [Fact]
        public async Task Test_AK_Competing_Buyout_Deal_Cannot_Finalize_After_SOLD()
        {
            var deal = CreateValidHandoverDeal();

            foreach (var a in deal.BuyoutHandover!.Assets)
            {
                a.Status = "VERIFIED";
            }
            deal.BuyoutHandover.SellerConfirmedAt = DateTime.UtcNow;
            deal.BuyoutHandover.BuyerConfirmedAt = DateTime.UtcNow;

            // Idea is ALREADY SOLD to another deal
            var idea = new CreatorIdea
            {
                Id = "idea-1",
                UserId = "creator-1",
                ProjectOutcome = "SOLD",
                ActiveBuyoutDealId = "deal-other-999"
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));
            _ideasColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), It.IsAny<FindOptions<CreatorIdea, CreatorIdea>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<CreatorIdea> { idea }));

            var controller = CreateController("buyer-1");
            var result = await controller.CompleteBuyoutSale("deal-1", new CompleteBuyoutSaleRequest());

            var conflict = result.Should().BeOfType<ConflictObjectResult>().Subject;
            var response = conflict.Value as ApiResponse;
            response!.Message.Should().Contain("already been sold in another completed buyout");
        }

        [Fact]
        public async Task Test_AM_Buyout_Cannot_Finalize_If_Idea_Is_CO_FOUNDED()
        {
            var deal = CreateValidHandoverDeal();

            foreach (var a in deal.BuyoutHandover!.Assets)
            {
                a.Status = "VERIFIED";
            }
            deal.BuyoutHandover.SellerConfirmedAt = DateTime.UtcNow;
            deal.BuyoutHandover.BuyerConfirmedAt = DateTime.UtcNow;

            // Idea is ALREADY CO_FOUNDED
            var idea = new CreatorIdea
            {
                Id = "idea-1",
                UserId = "creator-1",
                ProjectOutcome = "CO_FOUNDED",
                ActivePartnershipDealId = "partnership-deal-888"
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));
            _ideasColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), It.IsAny<FindOptions<CreatorIdea, CreatorIdea>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<CreatorIdea> { idea }));

            var controller = CreateController("buyer-1");
            var result = await controller.CompleteBuyoutSale("deal-1", new CompleteBuyoutSaleRequest());

            var conflict = result.Should().BeOfType<ConflictObjectResult>().Subject;
            var response = conflict.Value as ApiResponse;
            response!.Message.Should().Contain("already been activated under an equity co-founder partnership");
        }

        [Fact]
        public async Task Test_AN_Duplicate_Finalization_Is_Idempotent()
        {
            var deal = CreateValidHandoverDeal();
            deal.DealStage = "SOLD";
            deal.Status = "completed";
            deal.BuyoutHandover = new BuyoutHandover
            {
                Status = "COMPLETED",
                CompletedAt = DateTime.UtcNow.AddMinutes(-10)
            };
            deal.BuyoutSaleRecord = new BuyoutSaleRecord
            {
                Id = "sale-rec-1",
                Status = "SOLD",
                PurchasePrice = 27500m
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));

            var controller = CreateController("buyer-1");
            var result = await controller.CompleteBuyoutSale("deal-1", new CompleteBuyoutSaleRequest());

            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value as ApiResponse;
            response!.Message.Should().Contain("already finalized");
        }

        [Fact]
        public async Task Test_T_Unauthorized_User_Returns_403()
        {
            var deal = CreateValidHandoverDeal();

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));

            var controller = CreateController("unrelated-intruder-user");
            var result = await controller.GetBuyoutHandover("deal-1");

            var forbidden = result.Should().BeOfType<ObjectResult>().Subject;
            forbidden.StatusCode.Should().Be(403);
        }
    }
}
