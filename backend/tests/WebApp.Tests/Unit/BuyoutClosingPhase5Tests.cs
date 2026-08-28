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
    public class BuyoutClosingPhase5Tests
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

        public BuyoutClosingPhase5Tests()
        {
            _dbMock.Setup(d => d.GetCollection<CreatorIdea>("CreatorIdeas", null)).Returns(_ideasColMock.Object);
            _dbMock.Setup(d => d.GetCollection<ProjectInterest>("ProjectInterests", null)).Returns(_interestsColMock.Object);
            _dbMock.Setup(d => d.GetCollection<MarketplaceProjectAccessGrant>("MarketplaceProjectAccessGrants", null)).Returns(_grantsColMock.Object);
            _dbMock.Setup(d => d.GetCollection<MarketplaceProjectAccessLog>("MarketplaceProjectAccessLogs", null)).Returns(_logsColMock.Object);
            _dbMock.Setup(d => d.GetCollection<DealExecution>("DealExecutions", null)).Returns(_dealsColMock.Object);

            _ideasColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), It.IsAny<FindOptions<CreatorIdea, CreatorIdea>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<CreatorIdea>()));
            _grantsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<MarketplaceProjectAccessGrant>>(), It.IsAny<FindOptions<MarketplaceProjectAccessGrant, MarketplaceProjectAccessGrant>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<MarketplaceProjectAccessGrant>()));
            _logsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<MarketplaceProjectAccessLog>>(), It.IsAny<FindOptions<MarketplaceProjectAccessLog, MarketplaceProjectAccessLog>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<MarketplaceProjectAccessLog>()));
            _interestsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<ProjectInterest>>(), It.IsAny<FindOptions<ProjectInterest, ProjectInterest>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<ProjectInterest>()));
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
            var principal = new ClaimsPrincipal(identity);

            ctrl.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };

            return ctrl;
        }

        private DealExecution CreateSignedBuyoutDeal(
            string creatorId = "creator_1",
            string entrepreneurId = "ent_1",
            string dealId = "deal_closing_test",
            decimal purchasePrice = 27500,
            string currency = "EUR")
        {
            var manifestHash = "manifest_sha256_canonical_closing_hash_123";
            var manifest = new BuyoutAssetTransferManifest
            {
                DealId = dealId,
                IdeaId = "idea_1",
                AcceptedRevisionNumber = 1,
                PurchasePrice = purchasePrice,
                Currency = currency,
                HandoverPeriodWeeks = 2,
                TransitionSupportWeeks = 4,
                Version = 1,
                ManifestHash = manifestHash,
                Assets = new List<BuyoutAssetEntry>
                {
                    new BuyoutAssetEntry
                    {
                        AssetType = "IP_RIGHTS",
                        DisplayName = "Full Intellectual Property Ownership",
                        AvailabilityStatus = "AVAILABLE_IN_PLATFORM",
                        TransferRequired = true
                    }
                }
            };

            var signingPkg = new BuyoutSigningPackage
            {
                Id = "pkg_signed_1",
                DealId = dealId,
                IdeaId = "idea_1",
                DealType = "FULL_BUYOUT",
                AcceptedBuyoutRevisionNumber = 1,
                BuyoutLegalPackageId = "pkg_legal_1",
                BuyoutLegalPackageVersion = 1,
                AssetManifestVersion = 1,
                AssetManifestHash = "asset_manifest_hash_1",
                PurchasePrice = purchasePrice,
                Currency = currency,
                HandoverPeriodWeeks = 2,
                TransitionSupportWeeks = 4,
                ManifestHash = manifestHash,
                Status = "AGREEMENT_SIGNED",
                Version = 1,
                FinalizedAt = DateTime.UtcNow.AddHours(-1),
                CreatorSignature = new PartySignature
                {
                    SignerUserId = creatorId,
                    SignerName = "Dr. Alice Smith",
                    SignerRole = "Creator",
                    ManifestHash = manifestHash,
                    LegalPackageVersion = 1,
                    SignedAt = DateTime.UtcNow.AddHours(-2),
                    SignatureHash = "creator_sig_hash_123",
                    ConsentStatement = "I agree to all terms."
                },
                EntrepreneurSignature = new PartySignature
                {
                    SignerUserId = entrepreneurId,
                    SignerName = "Bob Buyer",
                    SignerRole = "Entrepreneur",
                    ManifestHash = manifestHash,
                    LegalPackageVersion = 1,
                    SignedAt = DateTime.UtcNow.AddHours(-1),
                    SignatureHash = "buyer_sig_hash_123",
                    ConsentStatement = "I agree as buyer."
                }
            };

            return new DealExecution
            {
                Id = dealId,
                IdeaId = "idea_1",
                CreatorId = creatorId,
                EntrepreneurId = entrepreneurId,
                DealType = "FULL_BUYOUT",
                DealStage = "BUYOUT_CLOSING_PENDING",
                Status = "active",
                AcceptedRevisionNumber = 1,
                AcceptedAt = DateTime.UtcNow.AddDays(-1),
                BuyoutTerms = new BuyoutTerms
                {
                    PurchasePrice = purchasePrice,
                    HandoverPeriodWeeks = 2,
                    TransitionSupportWeeks = 4,
                    IncludedAssets = new List<string> { "Full Intellectual Property Ownership" }
                },
                BuyoutAssetManifest = manifest,
                BuyoutSigningPackage = signingPkg,
                Version = 1
            };
        }

        [Fact]
        public async Task GetBuyoutClosing_WrongDealType_Returns422()
        {
            var deal = CreateSignedBuyoutDeal();
            deal.DealType = "EQUITY_PARTNERSHIP";

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            var ctrl = CreateController("creator_1");
            var result = await ctrl.GetBuyoutClosing(deal.Id);

            var unproc = result.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
            var resp = unproc.Value.Should().BeOfType<ApiResponse>().Subject;
            resp.Success.Should().BeFalse();
            resp.Message.Should().Contain("FULL_BUYOUT");
        }

        [Fact]
        public async Task GetBuyoutClosing_WrongDealStage_Returns422()
        {
            var deal = CreateSignedBuyoutDeal();
            deal.DealStage = "BUYOUT_SIGNATURE_PENDING"; // Not yet in closing

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            var ctrl = CreateController("creator_1");
            var result = await ctrl.GetBuyoutClosing(deal.Id);

            var unproc = result.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
            var resp = unproc.Value.Should().BeOfType<ApiResponse>().Subject;
            resp.Success.Should().BeFalse();
            resp.Message.Should().Contain("Closing is not available in stage");
        }

        [Fact]
        public async Task GetBuyoutClosing_UnsignedPackage_Returns422()
        {
            var deal = CreateSignedBuyoutDeal();
            deal.BuyoutSigningPackage!.Status = "CREATOR_SIGNED"; // Pending buyer

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            var ctrl = CreateController("creator_1");
            var result = await ctrl.GetBuyoutClosing(deal.Id);

            var unproc = result.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
            var resp = unproc.Value.Should().BeOfType<ApiResponse>().Subject;
            resp.Success.Should().BeFalse();
            resp.Message.Should().Contain("AGREEMENT_SIGNED");
        }

        [Fact]
        public async Task GetBuyoutClosing_SeedsClosingFromSignedPurchasePriceAndManifestHash()
        {
            var deal = CreateSignedBuyoutDeal(purchasePrice: 27500, currency: "EUR");

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            var ctrl = CreateController("creator_1");
            var result = await ctrl.GetBuyoutClosing(deal.Id);

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            resp.Success.Should().BeTrue();

            var data = resp.Data.Should().BeOfType<BuyoutClosingDto>().Subject;
            data.PurchasePrice.Should().Be(27500);
            data.Currency.Should().Be("EUR");
            data.ManifestHash.Should().Be("manifest_sha256_canonical_closing_hash_123");
            data.PaymentStatus.Should().Be("NOT_STARTED");
            data.ClosingStatus.Should().Be("PENDING");
            data.CanProceedToHandover.Should().BeFalse();
            data.Blockers.Should().Contain(b => b.Contains("Buyer has not yet submitted"));
        }

        [Fact]
        public async Task SubmitBuyoutPayment_BuyerSubmits_SetsPaymentSubmittedAndVerificationPending()
        {
            var deal = CreateSignedBuyoutDeal(purchasePrice: 27500, currency: "EUR");

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            var entCtrl = CreateController("ent_1", "Entrepreneur");

            var submitReq = new SubmitBuyoutPaymentRequest
            {
                PaymentMethod = "BANK_TRANSFER",
                PaymentReference = "SEPA-TX-987654321",
                PaymentAmount = 27500,
                PaymentCurrency = "EUR",
                DocumentReference = "wire_receipt_doc_001",
                DocumentName = "Wire Transfer Receipt",
                Notes = "Wire initiated via Deutsche Bank IBAN DE89370400440532013000."
            };

            var result = await entCtrl.SubmitBuyoutPayment(deal.Id, submitReq);
            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            resp.Success.Should().BeTrue();

            var data = resp.Data.Should().BeOfType<BuyoutClosingDto>().Subject;
            data.PaymentStatus.Should().Be("PAYMENT_SUBMITTED");
            data.ClosingStatus.Should().Be("PAYMENT_VERIFICATION");
            data.PaymentReference.Should().Be("SEPA-TX-987654321");
            data.BuyerConfirmedAt.Should().NotBeNull();
            data.CreatorConfirmedAt.Should().BeNull();
            data.CanProceedToHandover.Should().BeFalse(); // Submission alone != confirmed
            data.Evidence.Should().HaveCount(1);
            deal.DealStage.Should().Be("BUYOUT_CLOSING_PENDING"); // Stage does not transition yet
        }

        [Fact]
        public async Task SubmitBuyoutPayment_AmountMismatch_Returns422()
        {
            var deal = CreateSignedBuyoutDeal(purchasePrice: 27500, currency: "EUR");

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            var entCtrl = CreateController("ent_1", "Entrepreneur");

            var submitReq = new SubmitBuyoutPaymentRequest
            {
                PaymentMethod = "BANK_TRANSFER",
                PaymentReference = "SEPA-TX-PARTIAL",
                PaymentAmount = 20000, // Mismatched price attempt
                PaymentCurrency = "EUR"
            };

            var result = await entCtrl.SubmitBuyoutPayment(deal.Id, submitReq);
            var unproc = result.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
            var resp = unproc.Value.Should().BeOfType<ApiResponse>().Subject;
            resp.Success.Should().BeFalse();
            resp.Message.Should().Contain("does not match the agreed locked purchase price");
        }

        [Fact]
        public async Task SubmitBuyoutPayment_CurrencyMismatch_Returns422()
        {
            var deal = CreateSignedBuyoutDeal(purchasePrice: 27500, currency: "EUR");

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            var entCtrl = CreateController("ent_1", "Entrepreneur");

            var submitReq = new SubmitBuyoutPaymentRequest
            {
                PaymentMethod = "BANK_TRANSFER",
                PaymentReference = "USD-TX-123",
                PaymentAmount = 27500,
                PaymentCurrency = "USD" // Mismatched currency
            };

            var result = await entCtrl.SubmitBuyoutPayment(deal.Id, submitReq);
            var unproc = result.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
            var resp = unproc.Value.Should().BeOfType<ApiResponse>().Subject;
            resp.Success.Should().BeFalse();
            resp.Message.Should().Contain("does not match the agreed currency");
        }

        [Fact]
        public async Task ConfirmBuyoutPaymentReceipt_CreatorConfirms_SetsPaymentConfirmedAndTransitionsToHandoverPending()
        {
            var deal = CreateSignedBuyoutDeal(purchasePrice: 27500, currency: "EUR");

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            var entCtrl = CreateController("ent_1", "Entrepreneur");
            var creatorCtrl = CreateController("creator_1");

            // 1. Buyer submits payment
            await entCtrl.SubmitBuyoutPayment(deal.Id, new SubmitBuyoutPaymentRequest
            {
                PaymentMethod = "BANK_TRANSFER",
                PaymentReference = "SEPA-TX-987654321",
                PaymentAmount = 27500,
                PaymentCurrency = "EUR"
            });

            // 2. Creator confirms receipt
            var confirmResult = await creatorCtrl.ConfirmBuyoutPaymentReceipt(deal.Id, new ConfirmBuyoutPaymentRequest
            {
                Notes = "Full funds received in bank account."
            });

            var ok = confirmResult.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            resp.Success.Should().BeTrue();

            var data = resp.Data.Should().BeOfType<BuyoutClosingDto>().Subject;
            data.PaymentStatus.Should().Be("PAYMENT_CONFIRMED");
            data.ClosingStatus.Should().Be("READY_FOR_HANDOVER");
            data.CanProceedToHandover.Should().BeTrue();
            data.CreatorConfirmedAt.Should().NotBeNull();
            data.PaymentCompletedAt.Should().NotBeNull();
            data.ReadyForHandoverAt.Should().NotBeNull();

            // DealStage transitions to BUYOUT_HANDOVER_PENDING
            deal.DealStage.Should().Be("BUYOUT_HANDOVER_PENDING");
        }

        [Fact]
        public async Task ConfirmBuyoutPaymentReceipt_BuyerCannotConfirmOwnPayment_Returns403()
        {
            var deal = CreateSignedBuyoutDeal(purchasePrice: 27500, currency: "EUR");

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            var entCtrl = CreateController("ent_1", "Entrepreneur");

            var result = await entCtrl.ConfirmBuyoutPaymentReceipt(deal.Id, new ConfirmBuyoutPaymentRequest());
            var forbidden = result.Should().BeOfType<ObjectResult>().Subject;
            forbidden.StatusCode.Should().Be(403);
        }

        [Fact]
        public async Task SubmitBuyoutPayment_DuplicateSubmission_IsIdempotent()
        {
            var deal = CreateSignedBuyoutDeal(purchasePrice: 27500, currency: "EUR");

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            var entCtrl = CreateController("ent_1", "Entrepreneur");

            var submitReq = new SubmitBuyoutPaymentRequest
            {
                PaymentMethod = "BANK_TRANSFER",
                PaymentReference = "SEPA-TX-DUPLICATE",
                PaymentAmount = 27500,
                PaymentCurrency = "EUR"
            };

            var res1 = await entCtrl.SubmitBuyoutPayment(deal.Id, submitReq);
            var res2 = await entCtrl.SubmitBuyoutPayment(deal.Id, submitReq);

            res1.Should().BeOfType<OkObjectResult>();
            res2.Should().BeOfType<OkObjectResult>();

            deal.BuyoutClosing!.Evidence.Should().HaveCount(1); // Evidence not duplicated
        }

        [Fact]
        public async Task ConfirmBuyoutPaymentReceipt_DuplicateConfirmation_IsIdempotent()
        {
            var deal = CreateSignedBuyoutDeal(purchasePrice: 27500, currency: "EUR");

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            var creatorCtrl = CreateController("creator_1");
            var entCtrl = CreateController("ent_1", "Entrepreneur");

            await entCtrl.SubmitBuyoutPayment(deal.Id, new SubmitBuyoutPaymentRequest
            {
                PaymentReference = "SEPA-TX-123"
            });

            var res1 = await creatorCtrl.ConfirmBuyoutPaymentReceipt(deal.Id, new ConfirmBuyoutPaymentRequest());
            var res2 = await creatorCtrl.ConfirmBuyoutPaymentReceipt(deal.Id, new ConfirmBuyoutPaymentRequest());

            res1.Should().BeOfType<OkObjectResult>();
            res2.Should().BeOfType<OkObjectResult>();
            deal.DealStage.Should().Be("BUYOUT_HANDOVER_PENDING");
        }

        [Fact]
        public async Task DisputeBuyoutPayment_SetsDisputedAndBlocksHandover()
        {
            var deal = CreateSignedBuyoutDeal(purchasePrice: 27500, currency: "EUR");

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            var creatorCtrl = CreateController("creator_1");
            var entCtrl = CreateController("ent_1", "Entrepreneur");

            await entCtrl.SubmitBuyoutPayment(deal.Id, new SubmitBuyoutPaymentRequest
            {
                PaymentReference = "SEPA-INVALID-TX"
            });

            var disputeRes = await creatorCtrl.DisputeBuyoutPayment(deal.Id, new DisputeBuyoutPaymentRequest
            {
                DisputeReason = "Bank transfer reference was not located by bank after 5 business days."
            });

            var ok = disputeRes.Should().BeOfType<OkObjectResult>().Subject;
            var data = ok.Value.Should().BeOfType<ApiResponse>().Subject.Data.Should().BeOfType<BuyoutClosingDto>().Subject;

            data.PaymentStatus.Should().Be("PAYMENT_DISPUTED");
            data.ClosingStatus.Should().Be("DISPUTED");
            data.CanProceedToHandover.Should().BeFalse();
            data.DisputeReason.Should().Contain("not located by bank");

            // Attempting to confirm during dispute is rejected
            var confirmAttempt = await creatorCtrl.ConfirmBuyoutPaymentReceipt(deal.Id, new ConfirmBuyoutPaymentRequest());
            confirmAttempt.Should().BeOfType<UnprocessableEntityObjectResult>();
        }

        [Fact]
        public async Task SubmitBuyoutPayment_StaleVersion_Returns409()
        {
            var deal = CreateSignedBuyoutDeal(purchasePrice: 27500, currency: "EUR");

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            var entCtrl = CreateController("ent_1", "Entrepreneur");
            await entCtrl.GetBuyoutClosing(deal.Id);

            var submitReq = new SubmitBuyoutPaymentRequest
            {
                PaymentReference = "SEPA-TX-123",
                ExpectedVersion = 999 // Stale version mismatch
            };

            var res = await entCtrl.SubmitBuyoutPayment(deal.Id, submitReq);
            var conflict = res.Should().BeOfType<ObjectResult>().Subject;
            conflict.StatusCode.Should().Be(409);
        }

        [Fact]
        public async Task UnrelatedUser_CannotAccessClosing_Returns403()
        {
            var deal = CreateSignedBuyoutDeal();

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            var strangerCtrl = CreateController("stranger_999");
            var result = await strangerCtrl.GetBuyoutClosing(deal.Id);

            var forbidden = result.Should().BeOfType<ObjectResult>().Subject;
            forbidden.StatusCode.Should().Be(403);
        }

        [Fact]
        public async Task IsolationCheck_NoAssetHandover_NoSold_NoActivation_NoCapTable()
        {
            var deal = CreateSignedBuyoutDeal(purchasePrice: 27500, currency: "EUR");

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            var creatorCtrl = CreateController("creator_1");
            var entCtrl = CreateController("ent_1", "Entrepreneur");

            await entCtrl.SubmitBuyoutPayment(deal.Id, new SubmitBuyoutPaymentRequest
            {
                PaymentReference = "SEPA-TX-FULL"
            });
            await creatorCtrl.ConfirmBuyoutPaymentReceipt(deal.Id, new ConfirmBuyoutPaymentRequest());

            // Phase 5 Success Guardrails
            deal.DealStage.Should().Be("BUYOUT_HANDOVER_PENDING");
            deal.Status.Should().Be("active");
            deal.ClosedAt.Should().BeNull(); // NOT sold yet

            // Co-founder Isolation
            deal.CapTableDraft.Should().BeNull();
            deal.RoleAgreement.Should().BeNull();
            deal.Activation.Should().BeNull();
            deal.SigningPackage.Should().BeNull();

            // No asset marked delivered in Phase 5
            deal.BuyoutAssetManifest!.Assets.Should().NotContain(a => a.AvailabilityStatus == "TRANSFERRED_TO_BUYER");
        }
    }
}
