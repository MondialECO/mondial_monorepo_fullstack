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
    public class BuyoutAgreementSigningPhase4Tests
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

        public BuyoutAgreementSigningPhase4Tests()
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

        private DealExecution CreateApprovedBuyoutDeal(
            string creatorId = "creator_1",
            string entrepreneurId = "ent_1",
            string dealId = "deal_buyout_test")
        {
            var manifest = new BuyoutAssetTransferManifest
            {
                DealId = dealId,
                IdeaId = "idea_1",
                AcceptedRevisionNumber = 1,
                PurchasePrice = 35000,
                Currency = "EUR",
                HandoverPeriodWeeks = 3,
                TransitionSupportWeeks = 4,
                Version = 1,
                ManifestHash = "manifest_sha256_mock_hash",
                Assets = new List<BuyoutAssetEntry>
                {
                    new BuyoutAssetEntry
                    {
                        AssetType = "IP_RIGHTS",
                        DisplayName = "Full Intellectual Property Ownership",
                        AvailabilityStatus = "AVAILABLE_IN_PLATFORM",
                        TransferRequired = true
                    },
                    new BuyoutAssetEntry
                    {
                        AssetType = "BUSINESS_DOCUMENT",
                        DisplayName = "Complete Business Plan & Financial Model",
                        AvailabilityStatus = "AVAILABLE_IN_PLATFORM",
                        TransferRequired = true
                    }
                }
            };

            var legalPkg = new BuyoutLegalReviewPackage
            {
                Id = "pkg_legal_1",
                DealId = dealId,
                IdeaId = "idea_1",
                Jurisdiction = "European Union (Standard Commercial)",
                Version = 1,
                Status = "APPROVED",
                ProviderReviewStatus = "REVIEW_COMPLETE",
                CreatorApprovedVersion = 1,
                EntrepreneurApprovedVersion = 1,
                CreatorApprovedAt = DateTime.UtcNow.AddHours(-2),
                EntrepreneurApprovedAt = DateTime.UtcNow.AddHours(-1),
                AcceptedBuyoutRevisionNumber = 1,
                AssetManifestVersion = 1,
                Documents = new List<BuyoutLegalDocument>
                {
                    new BuyoutLegalDocument
                    {
                        Id = "doc_apa_v1",
                        DocumentType = "ASSET_PURCHASE_AGREEMENT",
                        Title = "Asset Purchase Agreement",
                        RequirementType = "REQUIRED",
                        ContentMarkdown = "# ASSET PURCHASE AGREEMENT\n\nPrice: €35,000",
                        ContentHash = "apa_content_hash_123",
                        Version = 1,
                        Status = "REVIEWED"
                    },
                    new BuyoutLegalDocument
                    {
                        Id = "doc_transfer_sched_v1",
                        DocumentType = "ASSET_TRANSFER_SCHEDULE",
                        Title = "Asset Transfer Schedule",
                        RequirementType = "REQUIRED",
                        ContentMarkdown = "# ASSET TRANSFER SCHEDULE\n\nAll items listed in manifest",
                        ContentHash = "sched_content_hash_123",
                        Version = 1,
                        Status = "REVIEWED"
                    }
                }
            };

            return new DealExecution
            {
                Id = dealId,
                IdeaId = "idea_1",
                CreatorId = creatorId,
                EntrepreneurId = entrepreneurId,
                DealType = "FULL_BUYOUT",
                DealStage = "BUYOUT_SIGNATURE_PENDING",
                Status = "active",
                AcceptedRevisionNumber = 1,
                AcceptedAt = DateTime.UtcNow.AddDays(-1),
                BuyoutTerms = new BuyoutTerms
                {
                    PurchasePrice = 35000,
                    HandoverPeriodWeeks = 3,
                    TransitionSupportWeeks = 4,
                    IncludedAssets = new List<string> { "Full Intellectual Property Ownership", "Complete Business Plan & Financial Model" }
                },
                BuyoutAssetManifest = manifest,
                BuyoutLegalPackage = legalPkg,
                Version = 1
            };
        }

        [Fact]
        public async Task GetBuyoutSigningPackage_WrongDealType_Returns422()
        {
            var deal = CreateApprovedBuyoutDeal();
            deal.DealType = "EQUITY_PARTNERSHIP";

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            var ctrl = CreateController("creator_1");
            var result = await ctrl.GetBuyoutSigningPackage(deal.Id);

            var unproc = result.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
            var resp = unproc.Value.Should().BeOfType<ApiResponse>().Subject;
            resp.Success.Should().BeFalse();
            resp.Message.Should().Contain("FULL_BUYOUT");
        }

        [Fact]
        public async Task GetBuyoutSigningPackage_WrongDealStage_Returns422()
        {
            var deal = CreateApprovedBuyoutDeal();
            deal.DealStage = "BUYOUT_TERMS_ACCEPTED"; // Not yet approved/ready for signature

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            var ctrl = CreateController("creator_1");
            var result = await ctrl.GetBuyoutSigningPackage(deal.Id);

            var unproc = result.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
            var resp = unproc.Value.Should().BeOfType<ApiResponse>().Subject;
            resp.Success.Should().BeFalse();
            resp.Message.Should().Contain("Signing is not available in stage");
        }

        [Fact]
        public async Task GetBuyoutSigningPackage_UnapprovedLegalPackage_Returns422()
        {
            var deal = CreateApprovedBuyoutDeal();
            deal.BuyoutLegalPackage!.Status = "CHANGES_REQUESTED";

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            var ctrl = CreateController("creator_1");
            var result = await ctrl.GetBuyoutSigningPackage(deal.Id);

            var unproc = result.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
            var resp = unproc.Value.Should().BeOfType<ApiResponse>().Subject;
            resp.Success.Should().BeFalse();
            resp.Message.Should().Contain("APPROVED");
        }

        [Fact]
        public async Task GetBuyoutSigningPackage_SeedsPackageWithAcceptedTermsAndManifestHash()
        {
            var deal = CreateApprovedBuyoutDeal();

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

            var ctrl = CreateController("creator_1");
            var result = await ctrl.GetBuyoutSigningPackage(deal.Id);

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            resp.Success.Should().BeTrue();

            var data = resp.Data.Should().BeOfType<BuyoutSigningPackageDto>().Subject;
            data.PurchasePrice.Should().Be(35000);
            data.HandoverPeriodWeeks.Should().Be(3);
            data.TransitionSupportWeeks.Should().Be(4);
            data.BuyoutLegalPackageVersion.Should().Be(1);
            data.AssetManifestVersion.Should().Be(1);
            data.ManifestHash.Should().NotBeNullOrWhiteSpace();
            data.Status.Should().Be("PENDING_SIGNATURES");
            data.Documents.Should().HaveCount(2);
        }

        [Fact]
        public async Task SignBuyoutAgreement_CreatorSignsFirst_SetsCreatorSigned()
        {
            var deal = CreateApprovedBuyoutDeal();

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

            var ctrl = CreateController("creator_1");

            // 1. Get package to seed manifest hash
            var getResult = await ctrl.GetBuyoutSigningPackage(deal.Id);
            var getOk = getResult.Should().BeOfType<OkObjectResult>().Subject;
            var getDto = getOk.Value.Should().BeOfType<ApiResponse>().Subject.Data.Should().BeOfType<BuyoutSigningPackageDto>().Subject;

            // 2. Creator signs
            var signReq = new SignBuyoutAgreementRequest
            {
                ManifestHash = getDto.ManifestHash,
                ExpectedLegalPackageVersion = 1,
                ConsentStatement = "I agree to all buyout terms."
            };

            var signResult = await ctrl.SignBuyoutAgreement(deal.Id, signReq);
            var signOk = signResult.Should().BeOfType<OkObjectResult>().Subject;
            var signDto = signOk.Value.Should().BeOfType<ApiResponse>().Subject.Data.Should().BeOfType<BuyoutSigningPackageDto>().Subject;

            signDto.Status.Should().Be("CREATOR_SIGNED");
            signDto.CreatorSignature.Should().NotBeNull();
            signDto.CreatorSignature!.SignerRole.Should().Be("Creator");
            signDto.EntrepreneurSignature.Should().BeNull();
            deal.DealStage.Should().Be("BUYOUT_SIGNATURE_PENDING"); // Not yet fully signed
        }

        [Fact]
        public async Task SignBuyoutAgreement_BuyerSignsFirst_SetsBuyerSigned()
        {
            var deal = CreateApprovedBuyoutDeal();

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

            var entCtrl = CreateController("ent_1", "Entrepreneur");

            var getResult = await entCtrl.GetBuyoutSigningPackage(deal.Id);
            var getDto = (getResult as OkObjectResult)!.Value.Should().BeOfType<ApiResponse>().Subject.Data.Should().BeOfType<BuyoutSigningPackageDto>().Subject;

            var signReq = new SignBuyoutAgreementRequest
            {
                ManifestHash = getDto.ManifestHash,
                ExpectedLegalPackageVersion = 1,
                ConsentStatement = "I agree as buyer."
            };

            var signResult = await entCtrl.SignBuyoutAgreement(deal.Id, signReq);
            var signDto = (signResult as OkObjectResult)!.Value.Should().BeOfType<ApiResponse>().Subject.Data.Should().BeOfType<BuyoutSigningPackageDto>().Subject;

            signDto.Status.Should().Be("BUYER_SIGNED");
            signDto.EntrepreneurSignature.Should().NotBeNull();
            signDto.EntrepreneurSignature!.SignerRole.Should().Be("Entrepreneur");
            signDto.CreatorSignature.Should().BeNull();
        }

        [Fact]
        public async Task SignBuyoutAgreement_BothPartiesSign_TransitionsToBuyoutClosingPending()
        {
            var deal = CreateApprovedBuyoutDeal();

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

            var creatorCtrl = CreateController("creator_1");
            var entCtrl = CreateController("ent_1", "Entrepreneur");

            var getDto = (await creatorCtrl.GetBuyoutSigningPackage(deal.Id) as OkObjectResult)!.Value.Should().BeOfType<ApiResponse>().Subject.Data.Should().BeOfType<BuyoutSigningPackageDto>().Subject;

            var signReq = new SignBuyoutAgreementRequest
            {
                ManifestHash = getDto.ManifestHash,
                ExpectedLegalPackageVersion = 1
            };

            // 1. Creator signs
            await creatorCtrl.SignBuyoutAgreement(deal.Id, signReq);

            // 2. Buyer signs
            var finalRes = await entCtrl.SignBuyoutAgreement(deal.Id, signReq);
            var finalDto = (finalRes as OkObjectResult)!.Value.Should().BeOfType<ApiResponse>().Subject.Data.Should().BeOfType<BuyoutSigningPackageDto>().Subject;

            finalDto.Status.Should().Be("AGREEMENT_SIGNED");
            finalDto.CreatorSignature.Should().NotBeNull();
            finalDto.EntrepreneurSignature.Should().NotBeNull();
            finalDto.FinalizedAt.Should().NotBeNull();
            finalDto.AuditReference.Should().Contain("buyout_deal_");

            deal.DealStage.Should().Be("BUYOUT_CLOSING_PENDING");
            deal.BuyoutSigningPackage!.Status.Should().Be("AGREEMENT_SIGNED");
        }

        [Fact]
        public async Task SignBuyoutAgreement_MismatchedManifestHash_Returns409()
        {
            var deal = CreateApprovedBuyoutDeal();

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            var ctrl = CreateController("creator_1");
            await ctrl.GetBuyoutSigningPackage(deal.Id);

            var signReq = new SignBuyoutAgreementRequest
            {
                ManifestHash = "tampered_fake_manifest_hash_123",
                ExpectedLegalPackageVersion = 1
            };

            var signResult = await ctrl.SignBuyoutAgreement(deal.Id, signReq);
            var conflict = signResult.Should().BeOfType<ObjectResult>().Subject;
            conflict.StatusCode.Should().Be(409);
        }

        [Fact]
        public async Task SignBuyoutAgreement_StaleExpectedVersion_Returns409()
        {
            var deal = CreateApprovedBuyoutDeal();

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            var ctrl = CreateController("creator_1");
            var getDto = (await ctrl.GetBuyoutSigningPackage(deal.Id) as OkObjectResult)!.Value.Should().BeOfType<ApiResponse>().Subject.Data.Should().BeOfType<BuyoutSigningPackageDto>().Subject;

            var signReq = new SignBuyoutAgreementRequest
            {
                ManifestHash = getDto.ManifestHash,
                ExpectedLegalPackageVersion = 0 // Stale version
            };

            var signResult = await ctrl.SignBuyoutAgreement(deal.Id, signReq);
            var conflict = signResult.Should().BeOfType<ObjectResult>().Subject;
            conflict.StatusCode.Should().Be(409);
        }

        [Fact]
        public async Task SignBuyoutAgreement_DuplicateSignature_IsIdempotent()
        {
            var deal = CreateApprovedBuyoutDeal();

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

            var ctrl = CreateController("creator_1");
            var getDto = (await ctrl.GetBuyoutSigningPackage(deal.Id) as OkObjectResult)!.Value.Should().BeOfType<ApiResponse>().Subject.Data.Should().BeOfType<BuyoutSigningPackageDto>().Subject;

            var signReq = new SignBuyoutAgreementRequest
            {
                ManifestHash = getDto.ManifestHash,
                ExpectedLegalPackageVersion = 1
            };

            // First sign
            var res1 = await ctrl.SignBuyoutAgreement(deal.Id, signReq);
            var dto1 = (res1 as OkObjectResult)!.Value.Should().BeOfType<ApiResponse>().Subject.Data.Should().BeOfType<BuyoutSigningPackageDto>().Subject;
            var sigHash1 = dto1.CreatorSignature!.SignatureHash;
            var signedAt1 = dto1.CreatorSignature.SignedAt;

            // Second sign (identical)
            var res2 = await ctrl.SignBuyoutAgreement(deal.Id, signReq);
            var dto2 = (res2 as OkObjectResult)!.Value.Should().BeOfType<ApiResponse>().Subject.Data.Should().BeOfType<BuyoutSigningPackageDto>().Subject;

            dto2.CreatorSignature!.SignatureHash.Should().Be(sigHash1);
            dto2.CreatorSignature.SignedAt.Should().Be(signedAt1);
        }

        [Fact]
        public async Task RequestBuyoutSigningLegalChange_CommercialChangeAttempt_Returns422()
        {
            var deal = CreateApprovedBuyoutDeal();

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            var ctrl = CreateController("creator_1");

            var req = new RequestBuyoutSigningLegalChangeRequest
            {
                Feedback = "Please reduce price to €30,000",
                RequestedChangeType = "COMMERCIAL_TERMS"
            };

            var result = await ctrl.RequestBuyoutSigningLegalChange(deal.Id, req);
            var unproc = result.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
            var resp = unproc.Value.Should().BeOfType<ApiResponse>().Subject;
            resp.Success.Should().BeFalse();
            resp.Message.Should().Contain("Commercial terms");
        }

        [Fact]
        public async Task RequestBuyoutSigningLegalChange_WordingChange_InvalidatesPackageAndReturnsToLegalReview()
        {
            var deal = CreateApprovedBuyoutDeal();

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

            var ctrl = CreateController("creator_1");

            // Seed signing package
            await ctrl.GetBuyoutSigningPackage(deal.Id);
            deal.BuyoutSigningPackage.Should().NotBeNull();

            var req = new RequestBuyoutSigningLegalChangeRequest
            {
                Feedback = "Please clarify clause 3.2 on transition orientation hours.",
                RequestedChangeType = "LEGAL_WORDING"
            };

            var result = await ctrl.RequestBuyoutSigningLegalChange(deal.Id, req);
            var ok = result.Should().BeOfType<OkObjectResult>().Subject;

            deal.BuyoutSigningPackage!.Status.Should().Be("INVALIDATED");
            deal.DealStage.Should().Be("BUYOUT_TERMS_ACCEPTED");
            deal.BuyoutLegalPackage!.Version.Should().Be(2);
            deal.BuyoutLegalPackage.Status.Should().Be("CHANGES_REQUESTED");
            deal.BuyoutLegalPackage.CreatorApprovedVersion.Should().Be(0);
            deal.BuyoutLegalPackage.EntrepreneurApprovedVersion.Should().Be(0);
        }

        [Fact]
        public async Task FinalBuyoutSignedPackage_RequiresAgreementSignedStatus()
        {
            var deal = CreateApprovedBuyoutDeal();

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            var ctrl = CreateController("creator_1");
            await ctrl.GetBuyoutSigningPackage(deal.Id);

            // Attempt to get final package while pending
            var res = await ctrl.GetFinalBuyoutSignedPackage(deal.Id);
            res.Should().BeOfType<UnprocessableEntityObjectResult>();
        }

        [Fact]
        public async Task UnrelatedUser_CannotAccessBuyoutSigning_Returns403()
        {
            var deal = CreateApprovedBuyoutDeal();

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            var strangerCtrl = CreateController("stranger_user_999");
            var result = await strangerCtrl.GetBuyoutSigningPackage(deal.Id);

            var forbidden = result.Should().BeOfType<ObjectResult>().Subject;
            forbidden.StatusCode.Should().Be(403);
        }

        [Fact]
        public async Task IsolationCheck_NoCapTable_NoRoleAgreement_NoActivation_ProjectNotSold()
        {
            var deal = CreateApprovedBuyoutDeal();

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

            var creatorCtrl = CreateController("creator_1");
            var entCtrl = CreateController("ent_1", "Entrepreneur");

            var getDto = (await creatorCtrl.GetBuyoutSigningPackage(deal.Id) as OkObjectResult)!.Value.Should().BeOfType<ApiResponse>().Subject.Data.Should().BeOfType<BuyoutSigningPackageDto>().Subject;

            var signReq = new SignBuyoutAgreementRequest
            {
                ManifestHash = getDto.ManifestHash,
                ExpectedLegalPackageVersion = 1
            };

            await creatorCtrl.SignBuyoutAgreement(deal.Id, signReq);
            await entCtrl.SignBuyoutAgreement(deal.Id, signReq);

            // Strict Isolation Assertions
            deal.CapTableDraft.Should().BeNull();
            deal.RoleAgreement.Should().BeNull();
            deal.Activation.Should().BeNull();
            deal.SigningPackage.Should().BeNull(); // Co-founder signing package must remain null
            deal.DealStage.Should().Be("BUYOUT_CLOSING_PENDING");
            deal.Status.Should().Be("active");
            deal.ClosedAt.Should().BeNull();
        }

        [Fact]
        public async Task GetBuyoutSigningPackage_NoProviderAssigned_Returns200AndSeedsPackage()
        {
            // Option B: Legal provider optional (not invited). Both Creator and Entrepreneur can load signing package.
            var deal = CreateApprovedBuyoutDeal();
            deal.BuyoutLegalPackage!.AssignedLegalProviderId = null;
            deal.BuyoutLegalPackage!.ProviderReviewStatus = "NOT_ASSIGNED";
            deal.BuyoutLegalPackage!.ProviderReviewedVersion = 0;

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

            var creatorCtrl = CreateController("creator_1");
            var res = await creatorCtrl.GetBuyoutSigningPackage(deal.Id);
            var ok = res.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            resp.Success.Should().BeTrue();
            var data = resp.Data.Should().BeOfType<BuyoutSigningPackageDto>().Subject;
            data.Status.Should().Be("PENDING_SIGNATURES");
            data.PurchasePrice.Should().Be(35000);

            // Entrepreneur can load identical package
            var entCtrl = CreateController("ent_1", "Entrepreneur");
            var resEnt = await entCtrl.GetBuyoutSigningPackage(deal.Id);
            var okEnt = resEnt.Should().BeOfType<OkObjectResult>().Subject;
            var dataEnt = (okEnt.Value as ApiResponse)!.Data.Should().BeOfType<BuyoutSigningPackageDto>().Subject;
            dataEnt.ManifestHash.Should().Be(data.ManifestHash);
        }

        [Fact]
        public async Task GetBuyoutSigningPackage_ProviderAssigned_ReviewPending_Returns422()
        {
            // When a legal provider IS assigned, their review must be complete before signing unlocks
            var deal = CreateApprovedBuyoutDeal();
            deal.BuyoutLegalPackage!.AssignedLegalProviderId = "legal_prov_1";
            deal.BuyoutLegalPackage!.ProviderReviewStatus = "ASSIGNED"; // review pending
            deal.BuyoutLegalPackage!.ProviderReviewedVersion = 0;

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            var creatorCtrl = CreateController("creator_1");
            var res = await creatorCtrl.GetBuyoutSigningPackage(deal.Id);
            var unproc = res.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
            unproc.StatusCode.Should().Be(422);
            var resp = unproc.Value.Should().BeOfType<ApiResponse>().Subject;
            resp.Message.Should().Contain("Legal Service Provider review must be marked REVIEW_COMPLETE");
        }

        [Fact]
        public async Task SignBuyoutAgreement_ReverseOrder_EntrepreneurSignsFirst_CreatorSignsSecond_TransitionsToClosingPending()
        {
            var deal = CreateApprovedBuyoutDeal();

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

            var creatorCtrl = CreateController("creator_1");
            var entCtrl = CreateController("ent_1", "Entrepreneur");

            var getDto = (await entCtrl.GetBuyoutSigningPackage(deal.Id) as OkObjectResult)!.Value.Should().BeOfType<ApiResponse>().Subject.Data.Should().BeOfType<BuyoutSigningPackageDto>().Subject;

            var signReq = new SignBuyoutAgreementRequest
            {
                ManifestHash = getDto.ManifestHash,
                ExpectedLegalPackageVersion = 1,
                ConsentStatement = "Entrepreneur signs buyout agreement."
            };

            // 1. Entrepreneur signs first
            var res1 = await entCtrl.SignBuyoutAgreement(deal.Id, signReq);
            var ok1 = res1.Should().BeOfType<OkObjectResult>().Subject;
            var data1 = (ok1.Value as ApiResponse)!.Data.Should().BeOfType<BuyoutSigningPackageDto>().Subject;
            data1.Status.Should().Be("BUYER_SIGNED");
            data1.EntrepreneurSignature.Should().NotBeNull();
            data1.CreatorSignature.Should().BeNull();
            deal.DealStage.Should().Be("BUYOUT_SIGNATURE_PENDING");

            // 2. Creator signs second
            var res2 = await creatorCtrl.SignBuyoutAgreement(deal.Id, signReq);
            var ok2 = res2.Should().BeOfType<OkObjectResult>().Subject;
            var data2 = (ok2.Value as ApiResponse)!.Data.Should().BeOfType<BuyoutSigningPackageDto>().Subject;
            data2.Status.Should().Be("AGREEMENT_SIGNED");
            data2.CreatorSignature.Should().NotBeNull();
            data2.EntrepreneurSignature.Should().NotBeNull();
            deal.DealStage.Should().Be("BUYOUT_CLOSING_PENDING");
        }

        [Fact]
        public async Task GetBuyoutSigningPackage_HistoricalStages_Returns200()
        {
            var deal = CreateApprovedBuyoutDeal();
            deal.DealStage = "BUYOUT_CLOSING_PENDING";

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

            var creatorCtrl = CreateController("creator_1");
            var res = await creatorCtrl.GetBuyoutSigningPackage(deal.Id);
            res.Should().BeOfType<OkObjectResult>();

            deal.DealStage = "BUYOUT_HANDOVER_PENDING";
            var resHandover = await creatorCtrl.GetBuyoutSigningPackage(deal.Id);
            resHandover.Should().BeOfType<OkObjectResult>();

            deal.DealStage = "SOLD";
            var resSold = await creatorCtrl.GetBuyoutSigningPackage(deal.Id);
            resSold.Should().BeOfType<OkObjectResult>();
        }
    }
}
