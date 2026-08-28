using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
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
    public class BuyoutE2EAcceptanceTests
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

        public BuyoutE2EAcceptanceTests()
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

        private DealExecution CreateFullBuyoutDealReadyForCompletion()
        {
            const string manifestHash = "test_manifest_hash_acceptance_12345678";
            return new DealExecution
            {
                Id = "deal-1",
                IdeaId = "idea-1",
                CreatorId = "creator-1",
                EntrepreneurId = "buyer-1",
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
                    DealId = "deal-1",
                    IdeaId = "idea-1",
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
                    DealId = "deal-1",
                    IdeaId = "idea-1",
                    DealType = "FULL_BUYOUT",
                    Status = "AGREEMENT_SIGNED",
                    AcceptedBuyoutRevisionNumber = 1,
                    AssetManifestVersion = 1,
                    AssetManifestHash = manifestHash,
                    ManifestHash = manifestHash,
                    CreatorSignature = new PartySignature { SignerRole = "Creator", SignerUserId = "creator-1", ManifestHash = manifestHash, SignedAt = DateTime.UtcNow },
                    EntrepreneurSignature = new PartySignature { SignerRole = "Entrepreneur", SignerUserId = "buyer-1", ManifestHash = manifestHash, SignedAt = DateTime.UtcNow }
                },
                BuyoutClosing = new BuyoutClosing
                {
                    Id = "closing-1",
                    DealId = "deal-1",
                    IdeaId = "idea-1",
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
                    DealId = "deal-1",
                    IdeaId = "idea-1",
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
                    SellerConfirmedAt = DateTime.UtcNow,
                    BuyerConfirmedAt = DateTime.UtcNow,
                    Assets = new List<BuyoutHandoverAsset>
                    {
                        new BuyoutHandoverAsset { AssetId = "asset_brand", AssetType = "Brand", DisplayName = "Brand & Trademark", Status = "VERIFIED", BuyerVerifiedAt = DateTime.UtcNow },
                        new BuyoutHandoverAsset { AssetId = "asset_logo", AssetType = "Logo", DisplayName = "Logo & Design Assets", Status = "VERIFIED", BuyerVerifiedAt = DateTime.UtcNow },
                        new BuyoutHandoverAsset { AssetId = "asset_bp", AssetType = "Business Plan", DisplayName = "Business Plan", Status = "VERIFIED", BuyerVerifiedAt = DateTime.UtcNow },
                        new BuyoutHandoverAsset { AssetId = "asset_dom", AssetType = "Domain", DisplayName = "Primary Domain (mondial.eco)", Status = "VERIFIED", BuyerVerifiedAt = DateTime.UtcNow },
                        new BuyoutHandoverAsset { AssetId = "asset_code", AssetType = "Source Code", DisplayName = "Full Stack Codebase", Status = "VERIFIED", BuyerVerifiedAt = DateTime.UtcNow }
                    }
                }
            };
        }

        // ==========================================
        // AUDIT A-E: FULL BUYOUT FINAL STATE & INTEGRITY
        // ==========================================

        [Fact]
        public async Task Audit_A_Through_E_FullBuyout_FinalSale_Economic_And_Asset_Integrity()
        {
            var deal = CreateFullBuyoutDealReadyForCompletion();
            var idea = new CreatorIdea
            {
                Id = "idea-1",
                UserId = "creator-1",
                Project = new CreatorJourneyProject
                {
                    Name = "Mondial Analytics"
                }
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));
            _ideasColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), It.IsAny<FindOptions<CreatorIdea, CreatorIdea>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<CreatorIdea> { idea }));
            _interestsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<ProjectInterest>>(), It.IsAny<FindOptions<ProjectInterest, ProjectInterest>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<ProjectInterest>()));

            var controller = CreateController("buyer-1", "Entrepreneur");
            var result = await controller.CompleteBuyoutSale("deal-1", new CompleteBuyoutSaleRequest());

            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value as ApiResponse;
            var dealDto = response!.Data.Should().BeOfType<EquityDealDto>().Subject;

            // Audit A: Final State SOLD
            dealDto.DealStage.Should().Be("SOLD");
            dealDto.Status.Should().Be("completed");
            deal.BuyoutHandover!.Status.Should().Be("COMPLETED");

            // Audit B: Economic Integrity (0 Drift)
            dealDto.BuyoutTerms!.PurchasePrice.Should().Be(27500m);
            dealDto.BuyoutClosing!.PurchasePrice.Should().Be(27500m);
            dealDto.BuyoutSaleRecord!.PurchasePrice.Should().Be(27500m);
            idea.SalePrice.Should().Be(27500m);

            // Audit C: Asset Scope Integrity
            dealDto.BuyoutSaleRecord.TransferredAssets.Should().HaveCount(5);
            dealDto.BuyoutSaleRecord.TransferredAssets.Should().Contain("Brand & Trademark");
            dealDto.BuyoutSaleRecord.TransferredAssets.Should().Contain("Primary Domain (mondial.eco)");
            dealDto.BuyoutSaleRecord.TransferredAssets.Should().Contain("Full Stack Codebase");

            // Audit D: Hash & Version Chain Valid
            dealDto.BuyoutSaleRecord.ManifestHash.Should().Be("test_manifest_hash_acceptance_12345678");
            dealDto.BuyoutSaleRecord.SigningPackageId.Should().Be("sign-pkg-1");
            dealDto.BuyoutSaleRecord.ClosingId.Should().Be("closing-1");
            dealDto.BuyoutSaleRecord.HandoverId.Should().Be("handover-1");

            // Audit F-H: Idea Outcome & Buyer Acquisition Linked
            idea.ProjectOutcome.Should().Be("SOLD");
            idea.ProjectOutcome.Should().NotBe("CO_FOUNDED");
            idea.ActiveBuyoutDealId.Should().Be("deal-1");
            idea.AcquiredByUserId.Should().Be("buyer-1");
            idea.SoldAt.Should().NotBeNull();
        }

        // ==========================================
        // AUDIT I-N: CANONICAL QUERIES & SECURITY
        // ==========================================

        [Fact]
        public async Task Audit_I_Through_N_GetMyBuyoutSales_And_Security_Authorization()
        {
            var deal = CreateFullBuyoutDealReadyForCompletion();
            deal.DealStage = "SOLD";
            deal.Status = "completed";
            deal.BuyoutSaleRecord = new BuyoutSaleRecord
            {
                Id = "sale-1",
                DealId = "deal-1",
                IdeaId = "idea-1",
                ProjectName = "Mondial Analytics",
                SellerUserId = "creator-1",
                SellerName = "Alice Creator",
                BuyerUserId = "buyer-1",
                BuyerName = "Bob Buyer",
                PurchasePrice = 27500m,
                Currency = "EUR",
                SoldAt = DateTime.UtcNow,
                TransferredAssets = new List<string> { "Brand & Trademark", "Full Stack Codebase" },
                Status = "SOLD",
                AuditReference = "SALE-REF-001"
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            // 1. Seller queries my-sales (Completed sale appears for Seller)
            var allDeals = new List<DealExecution> { deal };
            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((FilterDefinition<DealExecution> filter, FindOptions<DealExecution, DealExecution> opts, CancellationToken ct) =>
                {
                    try
                    {
                        var serializerRegistry = MongoDB.Bson.Serialization.BsonSerializer.SerializerRegistry;
                        var documentSerializer = serializerRegistry.GetSerializer<DealExecution>();
                        var rendered = filter.Render(documentSerializer, serializerRegistry).ToString();
                        
                        var filtered = allDeals.Where(d =>
                        {
                            if (rendered.Contains("_id") && !rendered.Contains(d.Id)) return false;
                            if (rendered.Contains("CreatorId") && !rendered.Contains(d.CreatorId ?? "___none___")) return false;
                            if (rendered.Contains("EntrepreneurId") && !rendered.Contains(d.EntrepreneurId ?? "___none___")) return false;
                            return true;
                        }).ToList();

                        return MakeCursor(filtered);
                    }
                    catch
                    {
                        return MakeCursor(allDeals);
                    }
                });

            var creatorCtrl = CreateController("creator-1");
            var creatorSalesResult = await creatorCtrl.GetMyBuyoutSales();
            var okCreator = creatorSalesResult.Should().BeOfType<OkObjectResult>().Subject;
            var respCreator = okCreator.Value as ApiResponse;
            var listCreator = respCreator!.Data.Should().BeAssignableTo<List<BuyoutSaleRecordDto>>().Subject;
            listCreator.Should().HaveCount(1);
            listCreator[0].PurchasePrice.Should().Be(27500m);
            listCreator[0].Status.Should().Be("SOLD");

            // 2. Buyer queries my-acquisitions (Completed acquisition appears for Buyer)
            var buyerCtrl = CreateController("buyer-1", "Entrepreneur");
            var buyerAcquisitionsResult = await buyerCtrl.GetMyAcquisitions();
            var okBuyerAcq = buyerAcquisitionsResult.Should().BeOfType<OkObjectResult>().Subject;
            var respBuyerAcq = okBuyerAcq.Value as ApiResponse;
            var listBuyerAcq = respBuyerAcq!.Data.Should().BeAssignableTo<List<BuyoutSaleRecordDto>>().Subject;
            listBuyerAcq.Should().HaveCount(1);

            // 2b. Buyer queries my-sales (Must NOT return buyer-side deals in seller sales ledger)
            var buyerSalesResult = await buyerCtrl.GetMyBuyoutSales();
            var okBuyerSales = buyerSalesResult.Should().BeOfType<OkObjectResult>().Subject;
            var respBuyerSales = okBuyerSales.Value as ApiResponse;
            var listBuyerSales = respBuyerSales!.Data.Should().BeAssignableTo<List<BuyoutSaleRecordDto>>().Subject;
            listBuyerSales.Should().BeEmpty();

            // 3. Unauthorized intruder queries sale record
            var intruderCtrl = CreateController("intruder-999");
            var intruderResult = await intruderCtrl.GetBuyoutSaleRecord("deal-1");
            var forbidden = intruderResult.Should().BeOfType<ObjectResult>().Subject;
            forbidden.StatusCode.Should().Be(403);

            // 4. Multi-Role User U tests:
            // Deal A: User U is SELLER (CreatorId = "user-u"), Buyer = "user-x"
            // Deal B: Seller = "user-y", User U is BUYER (EntrepreneurId = "user-u")
            var dealA = new DealExecution
            {
                Id = "deal-a",
                IdeaId = "idea-a",
                CreatorId = "user-u",
                EntrepreneurId = "user-x",
                DealType = "FULL_BUYOUT",
                DealStage = "BUYOUT_LEGAL_REVIEW_PENDING",
                Status = "ACTIVE",
                BuyoutTerms = new BuyoutTerms { PurchasePrice = 35000m }
            };

            var dealB = new DealExecution
            {
                Id = "deal-b",
                IdeaId = "idea-b",
                CreatorId = "user-y",
                EntrepreneurId = "user-u",
                DealType = "FULL_BUYOUT",
                DealStage = "BUYOUT_SIGNATURE_PENDING",
                Status = "ACTIVE",
                BuyoutTerms = new BuyoutTerms { PurchasePrice = 50000m }
            };

            allDeals = new List<DealExecution> { dealA, dealB };

            var userUCtrl = CreateController("user-u");
            var userUActiveResult = await userUCtrl.GetMyActiveBuyoutDeals();
            var okUserUActive = userUActiveResult.Should().BeOfType<OkObjectResult>().Subject;
            var respUserUActive = okUserUActive.Value as ApiResponse;
            var listUserUActive = respUserUActive!.Data.Should().BeAssignableTo<List<EquityDealDto>>().Subject;

            // User U sees Deal A (where U is Seller), but Deal B (where U is Buyer) does NOT leak into Creator My Sales
            listUserUActive.Should().HaveCount(1);
            listUserUActive[0].Id.Should().Be("deal-a");
            listUserUActive[0].DealStage.Should().Be("BUYOUT_LEGAL_REVIEW_PENDING");

            // User U queries Active Acquisitions (Buyer side) -> receives Deal B (where U is Buyer), NOT Deal A
            var userUAcqResult = await userUCtrl.GetMyActiveAcquisitions();
            var okUserUAcq = userUAcqResult.Should().BeOfType<OkObjectResult>().Subject;
            var respUserUAcq = okUserUAcq.Value as ApiResponse;
            var listUserUAcq = respUserUAcq!.Data.Should().BeAssignableTo<List<EquityDealDto>>().Subject;
            listUserUAcq.Should().HaveCount(1);
            listUserUAcq[0].Id.Should().Be("deal-b");
            listUserUAcq[0].DealStage.Should().Be("BUYOUT_SIGNATURE_PENDING");

            // Buyer of Deal A (user-x) queries Creator active buyout deals -> should be empty
            var userXCtrl = CreateController("user-x");
            var userXActiveResult = await userXCtrl.GetMyActiveBuyoutDeals();
            var okUserXActive = userXActiveResult.Should().BeOfType<OkObjectResult>().Subject;
            var respUserXActive = okUserXActive.Value as ApiResponse;
            var listUserXActive = respUserXActive!.Data.Should().BeAssignableTo<List<EquityDealDto>>().Subject;
            listUserXActive.Should().BeEmpty();

            // Buyer of Deal A (user-x) queries Active Acquisitions -> receives Deal A
            var userXAcqResult = await userXCtrl.GetMyActiveAcquisitions();
            var okUserXAcq = userXAcqResult.Should().BeOfType<OkObjectResult>().Subject;
            var respUserXAcq = okUserXAcq.Value as ApiResponse;
            var listUserXAcq = respUserXAcq!.Data.Should().BeAssignableTo<List<EquityDealDto>>().Subject;
            listUserXAcq.Should().HaveCount(1);
            listUserXAcq[0].Id.Should().Be("deal-a");
        }
    }
}
