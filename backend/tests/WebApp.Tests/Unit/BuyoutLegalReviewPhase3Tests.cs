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
    public class BuyoutLegalReviewPhase3Tests
    {
        private readonly Mock<IMongoDatabase> _dbMock = new();
        private readonly Mock<IMongoCollection<CreatorIdea>> _ideasColMock = new();
        private readonly Mock<IMongoCollection<ProjectInterest>> _interestsColMock = new();
        private readonly Mock<IMongoCollection<MarketplaceProjectAccessGrant>> _grantsColMock = new();
        private readonly Mock<IMongoCollection<MarketplaceProjectAccessLog>> _logsColMock = new();
        private readonly Mock<IMongoCollection<DealExecution>> _dealsColMock = new();
        private readonly Mock<IMongoCollection<ServiceProviderProfileRecord>> _spProfilesColMock = new();
        private readonly Mock<INotificationService> _notificationsMock = new();
        private readonly Mock<ICompanyService> _companyServiceMock = new();
        private readonly Mock<ILogger<DealsController>> _dealsLoggerMock = new();
        private readonly MongoDbContext _context;
        private readonly Mock<IUserStore<ApplicationUser>> _userStoreMock = new();
        private readonly UserManager<ApplicationUser> _userManager;

        public BuyoutLegalReviewPhase3Tests()
        {
            _dbMock.Setup(d => d.GetCollection<CreatorIdea>("CreatorIdeas", null)).Returns(_ideasColMock.Object);
            _dbMock.Setup(d => d.GetCollection<ProjectInterest>("ProjectInterests", null)).Returns(_interestsColMock.Object);
            _dbMock.Setup(d => d.GetCollection<MarketplaceProjectAccessGrant>("MarketplaceProjectAccessGrants", null)).Returns(_grantsColMock.Object);
            _dbMock.Setup(d => d.GetCollection<MarketplaceProjectAccessLog>("MarketplaceProjectAccessLogs", null)).Returns(_logsColMock.Object);
            _dbMock.Setup(d => d.GetCollection<DealExecution>("DealExecutions", null)).Returns(_dealsColMock.Object);
            _dbMock.Setup(d => d.GetCollection<ServiceProviderProfileRecord>("ServiceProviderProfiles", null)).Returns(_spProfilesColMock.Object);

            _ideasColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), It.IsAny<FindOptions<CreatorIdea, CreatorIdea>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<CreatorIdea>()));
            _grantsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<MarketplaceProjectAccessGrant>>(), It.IsAny<FindOptions<MarketplaceProjectAccessGrant, MarketplaceProjectAccessGrant>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<MarketplaceProjectAccessGrant>()));
            _interestsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<ProjectInterest>>(), It.IsAny<FindOptions<ProjectInterest, ProjectInterest>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<ProjectInterest>()));
            _spProfilesColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<ServiceProviderProfileRecord>>(), It.IsAny<FindOptions<ServiceProviderProfileRecord, ServiceProviderProfileRecord>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<ServiceProviderProfileRecord>
                {
                    new ServiceProviderProfileRecord
                    {
                        UserId = "legal_prov_1",
                        ProviderId = "legal_prov_1",
                        ServiceCategories = new List<ServiceCategory> { ServiceCategory.Legal },
                        VerificationStatus = ServiceProviderVerificationStatus.Verified
                    }
                }));

            _context = new MongoDbContext(_dbMock.Object);

            _userManager = new UserManager<ApplicationUser>(
                _userStoreMock.Object, null!, null!, null!, null!, null!, null!, null!, null!);
        }

        private static IAsyncCursor<T> MakeCursor<T>(List<T> list)
        {
            var cursor = new Mock<IAsyncCursor<T>>();
            var moveNextCalls = 0;
            cursor.Setup(c => c.MoveNext(It.IsAny<CancellationToken>()))
                .Returns(() => moveNextCalls++ == 0);
            cursor.Setup(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => moveNextCalls++ == 0);
            cursor.Setup(c => c.Current).Returns(list);
            return cursor.Object;
        }

        private DealsController CreateController(string userId)
        {
            var ctrl = new DealsController(
                _companyServiceMock.Object,
                _userManager,
                _context,
                _dealsLoggerMock.Object,
                _notificationsMock.Object
            );

            var httpContext = new DefaultHttpContext();
            var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, userId) };
            httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
            ctrl.ControllerContext = new ControllerContext { HttpContext = httpContext };
            return ctrl;
        }

        private DealExecution CreateAcceptedBuyoutDeal(string dealId = "deal_buyout_1", string creatorId = "creator_1", string entId = "ent_1", decimal price = 27500, bool includeCode = false)
        {
            var included = new List<string>
            {
                "Full Intellectual Property & Concept Ownership",
                "Complete Business Plan & Financial Model",
                "Brand Identity, Logo & Design Assets",
                "Financial Forecast & Unit Economics",
                "Go-To-Market & Growth Strategy",
                "Domain Name & DNS Records"
            };

            if (includeCode)
            {
                included.Add("Source Code & Technical Repositories");
            }

            return new DealExecution
            {
                Id = dealId,
                IdeaId = "idea_1",
                CreatorId = creatorId,
                EntrepreneurId = entId,
                ConversationId = "convo_1",
                DealType = "FULL_BUYOUT",
                DealStage = "BUYOUT_TERMS_ACCEPTED",
                Status = "initiated",
                AcceptedRevisionNumber = 1,
                BuyoutTerms = new BuyoutTerms
                {
                    PurchasePrice = price,
                    HandoverPeriodWeeks = 3,
                    TransitionSupportWeeks = 6,
                    IncludedAssets = included,
                    ExpiresAt = DateTime.UtcNow.AddDays(10),
                    Notes = "Commercial terms agreed."
                },
                Revisions = new List<TermSheetRevision>
                {
                    new TermSheetRevision
                    {
                        RevisionNumber = 1,
                        OfferedByRole = "entrepreneur",
                        OfferedByUserId = entId,
                        Status = "accepted",
                        BuyoutTerms = new BuyoutTerms
                        {
                            PurchasePrice = price,
                            HandoverPeriodWeeks = 3,
                            TransitionSupportWeeks = 6,
                            IncludedAssets = included,
                            ExpiresAt = DateTime.UtcNow.AddDays(10),
                            Notes = "Commercial terms agreed."
                        }
                    }
                }
            };
        }

        // ==========================================
        // TESTS
        // ==========================================

        [Fact]
        public async Task TestA_WrongDealStage_CannotEnterBuyoutLegalReview_Returns422()
        {
            var deal = CreateAcceptedBuyoutDeal();
            deal.DealStage = "OFFER_NEGOTIATION"; // Not accepted yet

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));

            var ctrl = CreateController("creator_1");
            var result = await ctrl.GetBuyoutLegalPackage(deal.Id);

            var unproc = result.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
            unproc.StatusCode.Should().Be(422);
        }

        [Fact]
        public async Task TestB_DealTypeMustBeFullBuyout_EquityDealReturns422()
        {
            var deal = CreateAcceptedBuyoutDeal();
            deal.DealType = "EQUITY_PARTNERSHIP";

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));

            var ctrl = CreateController("creator_1");
            var result = await ctrl.GetBuyoutLegalPackage(deal.Id);

            var unproc = result.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
            unproc.StatusCode.Should().Be(422);
        }

        [Fact]
        public async Task TestC_AcceptedRevisionRequired_NullRevisionReturns422()
        {
            var deal = CreateAcceptedBuyoutDeal();
            deal.AcceptedRevisionNumber = null;

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));

            var ctrl = CreateController("creator_1");
            var result = await ctrl.GetBuyoutLegalPackage(deal.Id);

            var unproc = result.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
            unproc.StatusCode.Should().Be(422);
        }

        [Fact]
        public async Task TestD_PurchasePriceSeededFromAcceptedRevision_NotAskingPrice()
        {
            var deal = CreateAcceptedBuyoutDeal(price: 27500);

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, BsonValue.Create(deal.Id)));

            var ctrl = CreateController("creator_1");
            var result = await ctrl.GetBuyoutLegalPackage(deal.Id);

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var data = resp.Data.Should().BeOfType<BuyoutLegalPackageDto>().Subject;
            data.PurchasePrice.Should().Be(27500);
            data.AssetManifest!.PurchasePrice.Should().Be(27500);
            data.HandoverPeriodWeeks.Should().Be(3);
            data.TransitionSupportWeeks.Should().Be(6);
        }

        [Fact]
        public async Task TestE_AssetClassification_AvailableAndExternalAndMissing()
        {
            var deal = CreateAcceptedBuyoutDeal(includeCode: true); // includes Domain and Source Code

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, BsonValue.Create(deal.Id)));

            var ctrl = CreateController("creator_1");
            var result = await ctrl.GetBuyoutLegalPackage(deal.Id);

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var data = resp.Data.Should().BeOfType<BuyoutLegalPackageDto>().Subject;

            var assets = data.AssetManifest!.Assets;
            assets.Should().Contain(a => a.AssetType == "IP_RIGHTS" && a.AvailabilityStatus == "AVAILABLE_IN_PLATFORM");
            assets.Should().Contain(a => a.AssetType == "DOMAIN" && a.AvailabilityStatus == "EXTERNAL_TRANSFER_REQUIRED" && a.ExternalTransferRequired);
            assets.Should().Contain(a => a.AssetType == "SOURCE_CODE" && a.AvailabilityStatus == "MISSING");
            data.Blockers.Should().Contain(b => b.Contains("Source Code"));
        }

        [Fact]
        public async Task TestF_MissingAsset_BlocksFinalApproval_Returns422()
        {
            var deal = CreateAcceptedBuyoutDeal(includeCode: true);
            deal.BuyoutLegalPackage = new BuyoutLegalReviewPackage
            {
                DealId = deal.Id,
                Version = 1,
                ProviderReviewStatus = "REVIEW_COMPLETE"
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));

            var ctrl = CreateController("creator_1");
            var result = await ctrl.ApproveBuyoutLegalPackage(deal.Id, new ApproveBuyoutLegalPackageRequest { LegalPackageVersion = 1 });

            var unproc = result.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
            unproc.StatusCode.Should().Be(422);
            var err = unproc.Value.Should().BeOfType<ApiResponse>().Subject;
            err.Message.Should().Contain("Source Code");
        }

        [Fact]
        public async Task TestG_CommercialChangeAttempt_RejectedWith422()
        {
            var deal = CreateAcceptedBuyoutDeal(includeCode: false);

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));

            var ctrl = CreateController("creator_1");
            var result = await ctrl.RequestBuyoutLegalChanges(deal.Id, new RequestBuyoutLegalChangesRequest
            {
                DocumentId = "doc_buyout_apa_v1",
                Comment = "Can we lower the purchase price to €25,000?"
            });

            var unproc = result.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
            unproc.StatusCode.Should().Be(422);
            var err = unproc.Value.Should().BeOfType<ApiResponse>().Subject;
            err.Message.Should().Contain("requires commercial renegotiation");
        }

        [Fact]
        public async Task TestH_LegalWordingChangeRequest_IncrementsVersionToV2_ResetsApprovals()
        {
            var deal = CreateAcceptedBuyoutDeal(includeCode: false);
            deal.BuyoutLegalPackage = new BuyoutLegalReviewPackage
            {
                DealId = deal.Id,
                Version = 1,
                CreatorApprovedVersion = 1,
                Status = "CREATOR_APPROVED"
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, BsonValue.Create(deal.Id)));

            var ctrl = CreateController("ent_1");
            var result = await ctrl.RequestBuyoutLegalChanges(deal.Id, new RequestBuyoutLegalChangesRequest
            {
                DocumentId = "doc_buyout_apa_v1",
                Comment = "Please clarify the legal entity name for the buyer."
            });

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var data = resp.Data.Should().BeOfType<BuyoutLegalPackageDto>().Subject;
            data.Version.Should().Be(2);
            data.CreatorApprovedVersion.Should().Be(0);
            data.EntrepreneurApprovedVersion.Should().Be(0);
            data.Status.Should().Be("CHANGES_REQUESTED");
        }

        [Fact]
        public async Task TestI_BilateralApproval_TransitionsTo_BuyoutSignaturePending()
        {
            var deal = CreateAcceptedBuyoutDeal(includeCode: false);
            deal.BuyoutLegalPackage = new BuyoutLegalReviewPackage
            {
                DealId = deal.Id,
                Version = 1,
                ProviderReviewStatus = "REVIEW_COMPLETE",
                CreatorApprovedVersion = 0,
                EntrepreneurApprovedVersion = 0,
                Status = "AWAITING_REVIEW"
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, BsonValue.Create(deal.Id)));

            // 1. Creator approves V1
            var creatorCtrl = CreateController("creator_1");
            var res1 = await creatorCtrl.ApproveBuyoutLegalPackage(deal.Id, new ApproveBuyoutLegalPackageRequest { LegalPackageVersion = 1 });
            var ok1 = res1.Should().BeOfType<OkObjectResult>().Subject;
            var resp1 = ok1.Value.Should().BeOfType<ApiResponse>().Subject;
            var data1 = resp1.Data.Should().BeOfType<BuyoutLegalPackageDto>().Subject;
            data1.Status.Should().Be("CREATOR_APPROVED");
            deal.DealStage.Should().Be("BUYOUT_TERMS_ACCEPTED");

            // 2. Entrepreneur approves V1
            var entCtrl = CreateController("ent_1");
            var res2 = await entCtrl.ApproveBuyoutLegalPackage(deal.Id, new ApproveBuyoutLegalPackageRequest { LegalPackageVersion = 1 });
            var ok2 = res2.Should().BeOfType<OkObjectResult>().Subject;
            var resp2 = ok2.Value.Should().BeOfType<ApiResponse>().Subject;
            var data2 = resp2.Data.Should().BeOfType<BuyoutLegalPackageDto>().Subject;
            data2.Status.Should().Be("APPROVED");
            deal.DealStage.Should().Be("BUYOUT_SIGNATURE_PENDING");

            // Verify strict isolation: No CapTable, No RoleAgreement, No Activation
            deal.CapTableDraft.Should().BeNull();
            deal.RoleAgreement.Should().BeNull();
            deal.Activation.Should().BeNull();
        }

        [Fact]
        public async Task TestJ_UnrelatedUser_AccessReturns403()
        {
            var deal = CreateAcceptedBuyoutDeal();

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));

            var ctrl = CreateController("unrelated_user_99");
            var result = await ctrl.GetBuyoutLegalPackage(deal.Id);

            var forbidden = result.Should().BeOfType<ObjectResult>().Subject;
            forbidden.StatusCode.Should().Be(403);
        }

        [Fact]
        public async Task TestK_ExplainLegalDocument_ReturnsPlainLanguageWithDisclaimer()
        {
            var deal = CreateAcceptedBuyoutDeal(includeCode: false);

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, BsonValue.Create(deal.Id)));

            var ctrl = CreateController("creator_1");
            var result = await ctrl.ExplainBuyoutLegalDocument(deal.Id, "doc_buyout_apa_v1");

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var data = resp.Data.Should().BeOfType<ExplainBuyoutLegalDocumentResponse>().Subject;
            data.Explanation.Should().Contain("€27,500");
            data.Disclaimer.Should().Be("AI-generated explanation — not legal advice.");
        }

        [Fact]
        public async Task TestL_UnassignedProvider_AttemptReviewReturns403()
        {
            var deal = CreateAcceptedBuyoutDeal(includeCode: false);
            deal.BuyoutLegalPackage = new BuyoutLegalReviewPackage
            {
                DealId = deal.Id,
                Version = 1,
                AssignedLegalProviderId = "legal_prov_1"
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            var ctrl = CreateController("random_provider_99");
            var result = await ctrl.ReviewBuyoutLegalPackage(deal.Id, new ReviewBuyoutLegalPackageRequest
            {
                Status = "REVIEW_COMPLETE",
                Notes = "Looks good"
            });

            var forbidden = result.Should().BeOfType<ObjectResult>().Subject;
            forbidden.StatusCode.Should().Be(403);
        }

        [Fact]
        public async Task TestM_ProviderReviewComplete_UpdatesStatus()
        {
            var deal = CreateAcceptedBuyoutDeal(includeCode: false);
            deal.BuyoutLegalPackage = new BuyoutLegalReviewPackage
            {
                DealId = deal.Id,
                Version = 1,
                AssignedLegalProviderId = "legal_prov_1",
                ProviderReviewStatus = "ASSIGNED"
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, BsonValue.Create(deal.Id)));

            var ctrl = CreateController("legal_prov_1");
            var result = await ctrl.ReviewBuyoutLegalPackage(deal.Id, new ReviewBuyoutLegalPackageRequest
            {
                Status = "REVIEW_COMPLETE",
                Notes = "All contracts verified against accepted terms."
            });

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var data = resp.Data.Should().BeOfType<BuyoutLegalPackageDto>().Subject;
            data.ProviderReviewStatus.Should().Be("REVIEW_COMPLETE");
            data.ProviderReviewNotes.Should().Be("All contracts verified against accepted terms.");
        }

        [Fact]
        public async Task TestN_ProviderReviseDocument_UpdatesHashAndTimestamp()
        {
            var deal = CreateAcceptedBuyoutDeal(includeCode: false);
            deal.BuyoutLegalPackage = new BuyoutLegalReviewPackage
            {
                DealId = deal.Id,
                Version = 1,
                AssignedLegalProviderId = "legal_prov_1",
                Documents = new List<BuyoutLegalDocument>
                {
                    new BuyoutLegalDocument
                    {
                        Id = "doc_test_1",
                        DocumentType = "ASSET_PURCHASE_AGREEMENT",
                        Title = "Asset Purchase Agreement",
                        ContentMarkdown = "Original Content",
                        ContentHash = "hash1",
                        Version = 1,
                        Status = "GENERATED"
                    }
                }
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, BsonValue.Create(deal.Id)));

            var ctrl = CreateController("legal_prov_1");
            var result = await ctrl.ReviseBuyoutDocument(deal.Id, "doc_test_1", new ReviseBuyoutDocumentRequest
            {
                ContentMarkdown = "Updated contract language by legal counsel."
            });

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var data = resp.Data.Should().BeOfType<BuyoutLegalPackageDto>().Subject;
            var updatedDoc = data.Documents.Find(d => d.Id == "doc_test_1");
            updatedDoc.Should().NotBeNull();
            updatedDoc!.Version.Should().Be(2);
            updatedDoc.Status.Should().Be("REVIEWED");
            updatedDoc.ContentHash.Should().NotBe("hash1");
        }

        [Fact]
        public async Task TestO_VersionConflict_Returns409()
        {
            var deal = CreateAcceptedBuyoutDeal(includeCode: false);
            deal.BuyoutLegalPackage = new BuyoutLegalReviewPackage
            {
                DealId = deal.Id,
                Version = 2,
                ProviderReviewStatus = "REVIEW_COMPLETE"
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));

            var ctrl = CreateController("creator_1");
            var result = await ctrl.ApproveBuyoutLegalPackage(deal.Id, new ApproveBuyoutLegalPackageRequest
            {
                LegalPackageVersion = 1 // Outdated version
            });

            var conflict = result.Should().BeOfType<ObjectResult>().Subject;
            conflict.StatusCode.Should().Be(409);
        }

        [Fact]
        public async Task TestP_NoFinalTransferOrSoldOutcomeYet()
        {
            var deal = CreateAcceptedBuyoutDeal(includeCode: false);
            deal.BuyoutLegalPackage = new BuyoutLegalReviewPackage
            {
                DealId = deal.Id,
                Version = 1,
                ProviderReviewStatus = "REVIEW_COMPLETE",
                CreatorApprovedVersion = 1,
                Status = "CREATOR_APPROVED"
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, BsonValue.Create(deal.Id)));

            var entCtrl = CreateController("ent_1");
            var result = await entCtrl.ApproveBuyoutLegalPackage(deal.Id, new ApproveBuyoutLegalPackageRequest { LegalPackageVersion = 1 });

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            deal.DealStage.Should().Be("BUYOUT_SIGNATURE_PENDING");
            deal.Status.Should().Be("initiated");
            // Marketplace listing not closed, outcome not marked SOLD
        }

        [Fact]
        public async Task TestQ_NoProvider_ManifestComplete_BilateralApprovals_UnlocksSigning()
        {
            // Case A: No legal provider assigned -> Bilateral approval completes legal stage and unlocks signing
            var deal = CreateAcceptedBuyoutDeal(includeCode: false);
            deal.BuyoutLegalPackage = new BuyoutLegalReviewPackage
            {
                DealId = deal.Id,
                Version = 1,
                AssignedLegalProviderId = null, // No provider invited
                ProviderReviewStatus = "NOT_ASSIGNED",
                CreatorApprovedVersion = 0,
                EntrepreneurApprovedVersion = 0,
                Status = "AWAITING_REVIEW"
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, BsonValue.Create(deal.Id)));

            // 1. Creator approves
            var creatorCtrl = CreateController("creator_1");
            var res1 = await creatorCtrl.ApproveBuyoutLegalPackage(deal.Id, new ApproveBuyoutLegalPackageRequest { LegalPackageVersion = 1 });
            var ok1 = res1.Should().BeOfType<OkObjectResult>().Subject;
            var resp1 = ok1.Value.Should().BeOfType<ApiResponse>().Subject;
            var data1 = resp1.Data.Should().BeOfType<BuyoutLegalPackageDto>().Subject;
            data1.Status.Should().Be("CREATOR_APPROVED");
            deal.DealStage.Should().Be("BUYOUT_TERMS_ACCEPTED");

            // 2. Entrepreneur approves
            var entCtrl = CreateController("ent_1");
            var res2 = await entCtrl.ApproveBuyoutLegalPackage(deal.Id, new ApproveBuyoutLegalPackageRequest { LegalPackageVersion = 1 });
            var ok2 = res2.Should().BeOfType<OkObjectResult>().Subject;
            var resp2 = ok2.Value.Should().BeOfType<ApiResponse>().Subject;
            var data2 = resp2.Data.Should().BeOfType<BuyoutLegalPackageDto>().Subject;
            data2.Status.Should().Be("APPROVED");
            deal.DealStage.Should().Be("BUYOUT_SIGNATURE_PENDING");
        }

        [Fact]
        public async Task TestR_ProviderAssigned_ProviderPending_AllowsPartyApprovals_KeepsStagePendingUntilProviderReview()
        {
            // Provider is assigned but review is pending: Creator and Entrepreneur approvals succeed (200 OK),
            // stage remains pending until provider completes review.
            var deal = CreateAcceptedBuyoutDeal(includeCode: false);
            deal.BuyoutLegalPackage = new BuyoutLegalReviewPackage
            {
                DealId = deal.Id,
                Version = 1,
                AssignedLegalProviderId = "legal_prov_1",
                ProviderReviewStatus = "ASSIGNED", // Not yet reviewed
                ProviderReviewedVersion = 0,
                CreatorApprovedVersion = 0,
                EntrepreneurApprovedVersion = 0,
                Status = "AWAITING_REVIEW"
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, BsonValue.Create(deal.Id)));

            // 1. Creator approves while provider review is pending -> Returns 200 OK
            var creatorCtrl = CreateController("creator_1");
            var res1 = await creatorCtrl.ApproveBuyoutLegalPackage(deal.Id, new ApproveBuyoutLegalPackageRequest { LegalPackageVersion = 1 });
            var ok1 = res1.Should().BeOfType<OkObjectResult>().Subject;
            var resp1 = ok1.Value.Should().BeOfType<ApiResponse>().Subject;
            var data1 = resp1.Data.Should().BeOfType<BuyoutLegalPackageDto>().Subject;
            data1.CreatorApprovedVersion.Should().Be(1);
            deal.DealStage.Should().Be("BUYOUT_TERMS_ACCEPTED"); // Stage remains incomplete

            // 2. Entrepreneur approves while provider review is pending -> Returns 200 OK
            var entCtrl = CreateController("ent_1");
            var res2 = await entCtrl.ApproveBuyoutLegalPackage(deal.Id, new ApproveBuyoutLegalPackageRequest { LegalPackageVersion = 1 });
            var ok2 = res2.Should().BeOfType<OkObjectResult>().Subject;
            var resp2 = ok2.Value.Should().BeOfType<ApiResponse>().Subject;
            var data2 = resp2.Data.Should().BeOfType<BuyoutLegalPackageDto>().Subject;
            data2.EntrepreneurApprovedVersion.Should().Be(1);
            deal.DealStage.Should().Be("BUYOUT_TERMS_ACCEPTED"); // Stage still incomplete because provider review is missing

            // 3. Provider completes review last -> Triggers stage completion to BUYOUT_SIGNATURE_PENDING
            var provCtrl = CreateController("legal_prov_1");
            var res3 = await provCtrl.ReviewBuyoutLegalPackage(deal.Id, new ReviewBuyoutLegalPackageRequest
            {
                Status = "REVIEW_COMPLETE",
                Notes = "All legal terms verified."
            });
            var ok3 = res3.Should().BeOfType<OkObjectResult>().Subject;
            var resp3 = ok3.Value.Should().BeOfType<ApiResponse>().Subject;
            var data3 = resp3.Data.Should().BeOfType<BuyoutLegalPackageDto>().Subject;
            data3.Status.Should().Be("APPROVED");
            data3.ProviderReviewedVersion.Should().Be(1);
            deal.DealStage.Should().Be("BUYOUT_SIGNATURE_PENDING");
        }

        [Fact]
        public async Task TestS_ProviderReview_CompletesStage_WhenBilateralAlreadyApproved()
        {
            // Case D: Bilateral approved first, provider completes review last -> triggers transition
            var deal = CreateAcceptedBuyoutDeal(includeCode: false);
            deal.BuyoutLegalPackage = new BuyoutLegalReviewPackage
            {
                DealId = deal.Id,
                Version = 1,
                AssignedLegalProviderId = "legal_prov_1",
                ProviderReviewStatus = "ASSIGNED",
                CreatorApprovedVersion = 1,
                EntrepreneurApprovedVersion = 1,
                Status = "AWAITING_REVIEW"
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, BsonValue.Create(deal.Id)));

            var provCtrl = CreateController("legal_prov_1");
            var result = await provCtrl.ReviewBuyoutLegalPackage(deal.Id, new ReviewBuyoutLegalPackageRequest
            {
                Status = "REVIEW_COMPLETE",
                Notes = "All legal terms verified."
            });

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var data = resp.Data.Should().BeOfType<BuyoutLegalPackageDto>().Subject;
            data.Status.Should().Be("APPROVED");
            data.ProviderReviewedVersion.Should().Be(1);
            deal.DealStage.Should().Be("BUYOUT_SIGNATURE_PENDING");
        }

        [Fact]
        public async Task TestT_RequestChanges_ResetsProviderReview_AndApprovals()
        {
            // Case G & H: Request changes increments version and invalidates old provider review and approvals
            var deal = CreateAcceptedBuyoutDeal(includeCode: false);
            deal.BuyoutLegalPackage = new BuyoutLegalReviewPackage
            {
                DealId = deal.Id,
                Version = 1,
                AssignedLegalProviderId = "legal_prov_1",
                ProviderReviewStatus = "REVIEW_COMPLETE",
                ProviderReviewedVersion = 1,
                CreatorApprovedVersion = 1,
                EntrepreneurApprovedVersion = 1,
                Status = "APPROVED"
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, BsonValue.Create(deal.Id)));

            var ctrl = CreateController("creator_1");
            var result = await ctrl.RequestBuyoutLegalChanges(deal.Id, new RequestBuyoutLegalChangesRequest
            {
                DocumentId = "doc_buyout_apa_v1",
                Comment = "Clarify IP warranty clause in Section 4."
            });

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var data = resp.Data.Should().BeOfType<BuyoutLegalPackageDto>().Subject;
            data.Version.Should().Be(2);
            data.CreatorApprovedVersion.Should().Be(0);
            data.EntrepreneurApprovedVersion.Should().Be(0);
            data.ProviderReviewStatus.Should().Be("ASSIGNED");
            data.ProviderReviewedVersion.Should().Be(0);
        }

        [Fact]
        public async Task TestU_LateProviderInvite_AfterStageComplete_BlockedWith422()
        {
            // Case: Deal already moved to BUYOUT_SIGNATURE_PENDING cannot invite provider
            var deal = CreateAcceptedBuyoutDeal(includeCode: false);
            deal.DealStage = "BUYOUT_SIGNATURE_PENDING";
            deal.BuyoutLegalPackage = new BuyoutLegalReviewPackage
            {
                DealId = deal.Id,
                Version = 1,
                Status = "APPROVED"
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DealExecution> { deal }));

            var ctrl = CreateController("creator_1");
            var result = await ctrl.InviteBuyoutLegalProvider(deal.Id, new InviteBuyoutLegalProviderRequest
            {
                ProviderId = "legal_prov_1"
            });

            var unproc = result.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
            unproc.StatusCode.Should().Be(422);
            var err = unproc.Value.Should().BeOfType<ApiResponse>().Subject;
            err.Message.Should().Contain("Cannot assign a legal provider once Legal & Transfer stage has completed");
        }

        [Fact]
        public async Task TestV_OrderIndependence_CreatorLast_TransitionsTo_BuyoutSignaturePending()
        {
            // Ordering: Provider reviews V1 -> Entrepreneur approves V1 -> Creator approves V1 last -> transitions
            var deal = CreateAcceptedBuyoutDeal(includeCode: false);
            deal.BuyoutLegalPackage = new BuyoutLegalReviewPackage
            {
                DealId = deal.Id,
                Version = 1,
                AssignedLegalProviderId = "legal_prov_1",
                ProviderReviewStatus = "ASSIGNED",
                ProviderReviewedVersion = 0,
                CreatorApprovedVersion = 0,
                EntrepreneurApprovedVersion = 0,
                Status = "AWAITING_REVIEW"
            };

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, BsonValue.Create(deal.Id)));

            // 1. Provider reviews first
            var provCtrl = CreateController("legal_prov_1");
            var res1 = await provCtrl.ReviewBuyoutLegalPackage(deal.Id, new ReviewBuyoutLegalPackageRequest { Status = "REVIEW_COMPLETE" });
            res1.Should().BeOfType<OkObjectResult>();
            deal.DealStage.Should().Be("BUYOUT_TERMS_ACCEPTED");

            // 2. Entrepreneur approves second
            var entCtrl = CreateController("ent_1");
            var res2 = await entCtrl.ApproveBuyoutLegalPackage(deal.Id, new ApproveBuyoutLegalPackageRequest { LegalPackageVersion = 1 });
            res2.Should().BeOfType<OkObjectResult>();
            deal.DealStage.Should().Be("BUYOUT_TERMS_ACCEPTED");

            // 3. Creator approves last
            var creatorCtrl = CreateController("creator_1");
            var res3 = await creatorCtrl.ApproveBuyoutLegalPackage(deal.Id, new ApproveBuyoutLegalPackageRequest { LegalPackageVersion = 1 });
            var ok3 = res3.Should().BeOfType<OkObjectResult>().Subject;
            var resp3 = ok3.Value.Should().BeOfType<ApiResponse>().Subject;
            var data3 = resp3.Data.Should().BeOfType<BuyoutLegalPackageDto>().Subject;
            data3.Status.Should().Be("APPROVED");
            deal.DealStage.Should().Be("BUYOUT_SIGNATURE_PENDING");
        }

        [Fact]
        public async Task TestW_TrueApiJourney_InviteProvider_PartyApprovals_ProviderReview_UnlocksSigning()
        {
            // True API journey through actual endpoints without artificial fixture mutation
            var deal = CreateAcceptedBuyoutDeal(includeCode: false);
            // No legal package pre-seeded (seeded on first access)
            deal.BuyoutLegalPackage = null;

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<DealExecution> { deal }));
            _dealsColMock.Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<DealExecution>(), It.IsAny<ReplaceOptions>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, BsonValue.Create(deal.Id)));

            // 1. Creator invites legal provider
            var creatorCtrl = CreateController("creator_1");
            var inviteRes = await creatorCtrl.InviteBuyoutLegalProvider(deal.Id, new InviteBuyoutLegalProviderRequest
            {
                ProviderId = "legal_prov_1"
            });
            inviteRes.Should().BeOfType<OkObjectResult>();
            deal.BuyoutLegalPackage.Should().NotBeNull();
            deal.BuyoutLegalPackage!.AssignedLegalProviderId.Should().Be("legal_prov_1");

            // 2. Creator approves V1 via endpoint
            var crApproveRes = await creatorCtrl.ApproveBuyoutLegalPackage(deal.Id, new ApproveBuyoutLegalPackageRequest { LegalPackageVersion = 1 });
            var okCr = crApproveRes.Should().BeOfType<OkObjectResult>().Subject;
            var respCr = okCr.Value.Should().BeOfType<ApiResponse>().Subject;
            var dataCr = respCr.Data.Should().BeOfType<BuyoutLegalPackageDto>().Subject;
            dataCr.CreatorApprovedVersion.Should().Be(1);
            deal.DealStage.Should().Be("BUYOUT_TERMS_ACCEPTED"); // Still pending

            // 3. Entrepreneur approves V1 via endpoint
            var entCtrl = CreateController("ent_1");
            var enApproveRes = await entCtrl.ApproveBuyoutLegalPackage(deal.Id, new ApproveBuyoutLegalPackageRequest { LegalPackageVersion = 1 });
            var okEn = enApproveRes.Should().BeOfType<OkObjectResult>().Subject;
            var respEn = okEn.Value.Should().BeOfType<ApiResponse>().Subject;
            var dataEn = respEn.Data.Should().BeOfType<BuyoutLegalPackageDto>().Subject;
            dataEn.EntrepreneurApprovedVersion.Should().Be(1);
            deal.DealStage.Should().Be("BUYOUT_TERMS_ACCEPTED"); // Still pending because provider review is required

            // 4. Provider conducts review via endpoint
            var provCtrl = CreateController("legal_prov_1");
            var provReviewRes = await provCtrl.ReviewBuyoutLegalPackage(deal.Id, new ReviewBuyoutLegalPackageRequest
            {
                Status = "REVIEW_COMPLETE",
                Notes = "Verified against accepted terms."
            });
            var okProv = provReviewRes.Should().BeOfType<OkObjectResult>().Subject;
            var respProv = okProv.Value.Should().BeOfType<ApiResponse>().Subject;
            var dataProv = respProv.Data.Should().BeOfType<BuyoutLegalPackageDto>().Subject;
            dataProv.Status.Should().Be("APPROVED");
            dataProv.ProviderReviewedVersion.Should().Be(1);

            // Final state: Stage completed and Signing unlocked!
            deal.DealStage.Should().Be("BUYOUT_SIGNATURE_PENDING");
        }
    }
}
