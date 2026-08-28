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
    public class MarketplacePushPhase6Tests
    {
        private readonly Mock<IMongoDatabase> _dbMock = new();
        private readonly Mock<IMongoCollection<CreatorIdea>> _ideasColMock = new();
        private readonly Mock<IMongoCollection<ProjectInterest>> _interestsColMock = new();
        private readonly Mock<IMongoCollection<MarketplaceProjectAccessGrant>> _grantsColMock = new();
        private readonly Mock<IMongoCollection<MarketplaceProjectAccessLog>> _logsColMock = new();
        private readonly Mock<IMongoCollection<DealExecution>> _dealsColMock = new();
        private readonly Mock<IMongoCollection<Companies>> _companiesColMock = new();
        private readonly Mock<IMongoCollection<ServiceProviderProfileRecord>> _spProfilesColMock = new();
        private readonly Mock<INotificationService> _notificationsMock = new();
        private readonly Mock<ILogger<DealsController>> _dealsLoggerMock = new();
        private readonly Mock<ICompanyService> _companyServiceMock = new();
        private readonly MongoDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        private readonly List<DealExecution> _dealsDb = new();
        private readonly List<MarketplaceProjectAccessLog> _logsDb = new();
        private readonly List<Companies> _companiesDb = new();
        private readonly List<ServiceProviderProfileRecord> _spProfilesDb = new();
        private readonly List<ApplicationUser> _usersDb = new();

        public MarketplacePushPhase6Tests()
        {
            _dbMock.Setup(d => d.GetCollection<CreatorIdea>("CreatorIdeas", null)).Returns(_ideasColMock.Object);
            _dbMock.Setup(d => d.GetCollection<ProjectInterest>("ProjectInterests", null)).Returns(_interestsColMock.Object);
            _dbMock.Setup(d => d.GetCollection<MarketplaceProjectAccessGrant>("MarketplaceProjectAccessGrants", null)).Returns(_grantsColMock.Object);
            _dbMock.Setup(d => d.GetCollection<MarketplaceProjectAccessLog>("MarketplaceProjectAccessLogs", null)).Returns(_logsColMock.Object);
            _dbMock.Setup(d => d.GetCollection<DealExecution>("DealExecutions", null)).Returns(_dealsColMock.Object);
            _dbMock.Setup(d => d.GetCollection<Companies>("Companies", null)).Returns(_companiesColMock.Object);
            _dbMock.Setup(d => d.GetCollection<ServiceProviderProfileRecord>("ServiceProviderProfiles", null)).Returns(_spProfilesColMock.Object);

            _ideasColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), It.IsAny<FindOptions<CreatorIdea, CreatorIdea>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((FilterDefinition<CreatorIdea> f, FindOptions<CreatorIdea, CreatorIdea> o, CancellationToken ct) => MakeCursor(new List<CreatorIdea>()));
            _grantsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<MarketplaceProjectAccessGrant>>(), It.IsAny<FindOptions<MarketplaceProjectAccessGrant, MarketplaceProjectAccessGrant>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((FilterDefinition<MarketplaceProjectAccessGrant> f, FindOptions<MarketplaceProjectAccessGrant, MarketplaceProjectAccessGrant> o, CancellationToken ct) => MakeCursor(new List<MarketplaceProjectAccessGrant>()));
            _interestsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<ProjectInterest>>(), It.IsAny<FindOptions<ProjectInterest, ProjectInterest>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((FilterDefinition<ProjectInterest> f, FindOptions<ProjectInterest, ProjectInterest> o, CancellationToken ct) => MakeCursor(new List<ProjectInterest>()));
            _companiesColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<Companies>>(), It.IsAny<FindOptions<Companies, Companies>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((FilterDefinition<Companies> f, FindOptions<Companies, Companies> o, CancellationToken ct) => MakeCursor(_companiesDb));
            _spProfilesColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<ServiceProviderProfileRecord>>(), It.IsAny<FindOptions<ServiceProviderProfileRecord, ServiceProviderProfileRecord>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((FilterDefinition<ServiceProviderProfileRecord> f, FindOptions<ServiceProviderProfileRecord, ServiceProviderProfileRecord> o, CancellationToken ct) => MakeCursor(_spProfilesDb));

            _dealsColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((FilterDefinition<DealExecution> f, FindOptions<DealExecution, DealExecution> o, CancellationToken ct) =>
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

            _logsColMock.Setup(c => c.InsertOneAsync(It.IsAny<MarketplaceProjectAccessLog>(), null, It.IsAny<CancellationToken>()))
                .Returns((MarketplaceProjectAccessLog log, InsertOneOptions o, CancellationToken ct) =>
                {
                    _logsDb.Add(log);
                    return Task.CompletedTask;
                });

            var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
            var userRoleStoreMock = userStoreMock.As<IUserRoleStore<ApplicationUser>>();
            userRoleStoreMock.Setup(s => s.GetRolesAsync(It.IsAny<ApplicationUser>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((ApplicationUser u, CancellationToken ct) => new List<string> { "LegalProvider" });

            _userManager = new UserManager<ApplicationUser>(
                userStoreMock.Object,
                null!, null!, null!, null!, null!, null!, null!, null!);

            userStoreMock.Setup(s => s.FindByIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((string id, CancellationToken ct) => _usersDb.FirstOrDefault(u => u.Id.ToString() == id));

            _context = new MongoDbContext(_dbMock.Object);
        }

        private DealsController CreateController(string userId, string userRole = "Creator")
        {
            var controller = new DealsController(
                _companyServiceMock.Object,
                _userManager,
                _context,
                _dealsLoggerMock.Object,
                _notificationsMock.Object);

            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim("sub", userId),
                new Claim(ClaimTypes.Role, userRole)
            }, "mock"));

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };

            return controller;
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

        private DealExecution SeedApprovedDeal(string dealId = "deal-1", string creatorId = "creator-1", string entId = "ent-1", string jurisdiction = "Delaware, USA")
        {
            var deal = new DealExecution
            {
                Id = dealId,
                IdeaId = "idea-1",
                CreatorId = creatorId,
                EntrepreneurId = entId,
                DealType = "EQUITY_PARTNERSHIP",
                DealStage = "LEGAL_REVIEW_PENDING",
                AcceptedRevisionNumber = 1,
                EquityTerms = new EquityTerms
                {
                    EquityPercentage = 20,
                    CreatorRole = "CTO",
                    CashComponent = 5000,
                    VestingEnabled = true,
                    VestingMonths = 48,
                    CliffMonths = 12
                },
                RoleAgreement = new RoleResponsibilityAgreement
                {
                    Status = "CONFIRMED",
                    CreatorConfirmedVersion = 1,
                    EntrepreneurConfirmedVersion = 1,
                    CreatorRole = "CTO",
                    EntrepreneurRole = "CEO",
                    CreatorResponsibilities = new List<string> { "Lead Engineering", "Architecture" },
                    EntrepreneurResponsibilities = new List<string> { "Go-to-market", "Fundraising" },
                    Version = 1
                },
                CapTableDraft = new DealCapTableDraft
                {
                    Status = "APPROVED",
                    Version = 1,
                    CreatorConfirmedVersion = 1,
                    EntrepreneurConfirmedVersion = 1,
                    Entries = new List<DealCapTableEntry>
                    {
                        new() { UserId = creatorId, RoleTitle = "CTO", DisplayName = "Creator", EquityPercent = 20, SharesGranted = 200000, ShareClass = "Common", IsCreator = true, VestingMonths = 48, CliffMonths = 12 },
                        new() { UserId = entId, RoleTitle = "CEO", DisplayName = "Entrepreneur", EquityPercent = 80, SharesGranted = 800000, ShareClass = "Common", IsFounder = true }
                    }
                }
            };

            _dealsDb.RemoveAll(d => d.Id == deal.Id);
            _dealsDb.Add(deal);

            var creatorGuid = Guid.TryParse(creatorId, out var cg) ? cg : Guid.NewGuid();
            var entGuid = Guid.TryParse(entId, out var eg) ? eg : Guid.NewGuid();
            _usersDb.RemoveAll(u => u.Id == creatorGuid || u.Id == entGuid);
            _usersDb.Add(new ApplicationUser { Id = creatorGuid, Name = "Alice Creator", UserName = "creator_user" });
            _usersDb.Add(new ApplicationUser { Id = entGuid, Name = "Bob Founder", UserName = "ent_user" });

            if (!string.IsNullOrEmpty(jurisdiction))
            {
                _companiesDb.RemoveAll(c => c.OwnerId == entId);
                _companiesDb.Add(new Companies
                {
                    Id = $"comp-{entId}",
                    OwnerId = entId,
                    CompanyName = "Acme Ventures Inc",
                    Country = jurisdiction
                });
            }

            return deal;
        }

        [Fact]
        public async Task Test_A_WrongDealStage_CannotEnterLegalReview()
        {
            var deal = SeedApprovedDeal();
            deal.DealStage = "ROLES_PENDING";

            var controller = CreateController(deal.CreatorId);
            var result = await controller.GetLegalPackage(deal.Id);

            result.Should().BeOfType<UnprocessableEntityObjectResult>();
        }

        [Fact]
        public async Task Test_B_CapTableMustBeApproved_ToEnterLegalReview()
        {
            var deal = SeedApprovedDeal();
            deal.CapTableDraft!.Status = "DRAFT";

            var controller = CreateController(deal.CreatorId);
            var result = await controller.GetLegalPackage(deal.Id);

            result.Should().BeOfType<UnprocessableEntityObjectResult>();
        }

        [Fact]
        public async Task Test_C_LegalPackageGeneratedFromAcceptedTermsAndRolesAndCapTable()
        {
            var deal = SeedApprovedDeal();
            var controller = CreateController(deal.CreatorId);

            var result = await controller.GetLegalPackage(deal.Id);
            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = resp.Data.Should().BeOfType<LegalReviewPackageDto>().Subject;

            dto.Should().NotBeNull();
            dto.Documents.Should().HaveCountGreaterOrEqualTo(4);
            dto.Documents.Should().Contain(d => d.DocumentType == "COFOUNDER_AGREEMENT");
            dto.Documents.Should().Contain(d => d.DocumentType == "IP_CONTRIBUTION_AGREEMENT");
            dto.Documents.Should().Contain(d => d.DocumentType == "VESTING_AGREEMENT");
            dto.Documents.Should().Contain(d => d.DocumentType == "SHAREHOLDER_AGREEMENT");

            // SHA256 hashes must be non-empty lowercase hex
            foreach (var doc in dto.Documents)
            {
                doc.ContentHash.Should().HaveLength(64);
                doc.ContentHash.Should().MatchRegex("^[a-f0-9]{64}$");
            }
        }

        [Fact]
        public async Task Test_D_MissingJurisdiction_BlocksFinalApproval()
        {
            var deal = SeedApprovedDeal(jurisdiction: "");
            var controller = CreateController(deal.CreatorId);

            // Initialize package
            await controller.GetLegalPackage(deal.Id);

            // Clear jurisdiction on seeded package
            deal.LegalPackage!.Jurisdiction = null;
            deal.LegalPackage.ProviderReviewStatus = "REVIEW_COMPLETE";

            var approveResult = await controller.ApproveLegalPackage(deal.Id);
            approveResult.Should().BeOfType<UnprocessableEntityObjectResult>();
        }

        [Fact]
        public async Task Test_E_UnverifiedOrWrongCategoryProvider_CannotBeAssigned()
        {
            var deal = SeedApprovedDeal();
            var controller = CreateController(deal.CreatorId);

            var spUserGuid = Guid.Parse("33333333-3333-3333-3333-333333333333");
            _usersDb.Add(new ApplicationUser { Id = spUserGuid, Name = "Non Legal User" });

            // Profile has only Design category and Tier1
            _spProfilesDb.Clear();
            _spProfilesDb.Add(new ServiceProviderProfileRecord
            {
                UserId = spUserGuid.ToString(),
                ProviderTier = ProviderTier.Tier1,
                VerificationStatus = ServiceProviderVerificationStatus.Pending,
                ServiceCategories = new List<ServiceCategory> { ServiceCategory.Design }
            });

            var result = await controller.InviteLegalProvider(deal.Id, new InviteLegalProviderRequest
            {
                ProviderId = spUserGuid.ToString()
            });

            result.Should().BeOfType<UnprocessableEntityObjectResult>();
        }

        [Fact]
        public async Task Test_F_ValidVerifiedLegalProvider_CanBeAssigned()
        {
            var deal = SeedApprovedDeal();
            var controller = CreateController(deal.CreatorId);

            var spUserGuid = Guid.Parse("44444444-4444-4444-4444-444444444444");
            _usersDb.Add(new ApplicationUser { Id = spUserGuid, Name = "Attorney Smith" });

            _spProfilesDb.Clear();
            _spProfilesDb.Add(new ServiceProviderProfileRecord
            {
                UserId = spUserGuid.ToString(),
                ProviderTier = ProviderTier.Tier2,
                VerificationStatus = ServiceProviderVerificationStatus.Verified,
                ServiceCategories = new List<ServiceCategory> { ServiceCategory.Legal }
            });

            var result = await controller.InviteLegalProvider(deal.Id, new InviteLegalProviderRequest
            {
                ProviderId = spUserGuid.ToString()
            });

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = resp.Data.Should().BeOfType<LegalReviewPackageDto>().Subject;

            dto.AssignedLegalProviderId.Should().Be(spUserGuid.ToString());
            dto.ProviderReviewStatus.Should().Be("ASSIGNED");
        }

        [Fact]
        public async Task Test_G_LegalProviderGetsScopedDataOnly()
        {
            var deal = SeedApprovedDeal();
            var controller = CreateController(deal.CreatorId);

            var spGuid = Guid.Parse("44444444-4444-4444-4444-444444444444");
            _usersDb.Add(new ApplicationUser { Id = spGuid, Name = "Attorney Smith" });
            _spProfilesDb.Clear();
            _spProfilesDb.Add(new ServiceProviderProfileRecord
            {
                UserId = spGuid.ToString(),
                ProviderTier = ProviderTier.Tier2,
                VerificationStatus = ServiceProviderVerificationStatus.Verified,
                ServiceCategories = new List<ServiceCategory> { ServiceCategory.Legal }
            });

            await controller.InviteLegalProvider(deal.Id, new InviteLegalProviderRequest { ProviderId = spGuid.ToString() });

            // Query as the SP
            var spController = CreateController(spGuid.ToString(), "LegalProvider");
            var result = await spController.GetLegalPackage(deal.Id);
            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = resp.Data.Should().BeOfType<LegalReviewPackageDto>().Subject;

            dto.Should().NotBeNull();
            dto.CommercialTerms.Should().NotBeNull();
            dto.Documents.Should().NotBeEmpty();
        }

        [Fact]
        public async Task Test_H_UnassignedProvider_CannotReviewOrApprove()
        {
            var deal = SeedApprovedDeal();
            var sp1Guid = "44444444-4444-4444-4444-444444444444";
            var sp2Guid = "55555555-5555-5555-5555-555555555555";

            _spProfilesDb.Clear();
            _spProfilesDb.Add(new ServiceProviderProfileRecord
            {
                UserId = sp1Guid,
                ProviderTier = ProviderTier.Tier2,
                VerificationStatus = ServiceProviderVerificationStatus.Verified,
                ServiceCategories = new List<ServiceCategory> { ServiceCategory.Legal }
            });

            var controller = CreateController(deal.CreatorId);
            await controller.InviteLegalProvider(deal.Id, new InviteLegalProviderRequest { ProviderId = sp1Guid });

            // SP2 attempts to review
            var unassignedController = CreateController(sp2Guid, "LegalProvider");
            var result = await unassignedController.ProviderLegalReview(deal.Id, new ProviderLegalReviewRequest
            {
                ReviewStatus = "REVIEW_COMPLETE"
            });

            var forbidden = result.Should().BeOfType<ObjectResult>().Subject;
            forbidden.StatusCode.Should().Be(403);
        }

        [Fact]
        public async Task Test_I_DocumentVersionsPreserved_WhenChangesRequested()
        {
            var deal = SeedApprovedDeal();
            var controller = CreateController(deal.CreatorId);

            await controller.GetLegalPackage(deal.Id);
            deal.LegalPackage!.Version.Should().Be(1);

            var reqResult = await controller.RequestLegalChanges(deal.Id, new RequestLegalChangesRequest
            {
                Feedback = "Please update IP transfer clause definition."
            });

            var ok = reqResult.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = resp.Data.Should().BeOfType<LegalReviewPackageDto>().Subject;

            dto.Version.Should().Be(2);
            dto.Documents.All(d => d.Version == 2).Should().BeTrue();
        }

        [Fact]
        public async Task Test_J_DocumentHashChanges_WhenContentVersionChanges()
        {
            var deal = SeedApprovedDeal();
            var controller = CreateController(deal.CreatorId);

            var v1Result = await controller.GetLegalPackage(deal.Id);
            var v1Resp = ((OkObjectResult)v1Result).Value as ApiResponse;
            var v1Dto = (LegalReviewPackageDto)v1Resp!.Data!;
            var v1Hash = v1Dto.Documents.First(d => d.DocumentType == "COFOUNDER_AGREEMENT").ContentHash;

            var v2Result = await controller.RequestLegalChanges(deal.Id, new RequestLegalChangesRequest
            {
                Feedback = "Modify terms"
            });
            var v2Resp = ((OkObjectResult)v2Result).Value as ApiResponse;
            var v2Dto = (LegalReviewPackageDto)v2Resp!.Data!;
            var v2Hash = v2Dto.Documents.First(d => d.DocumentType == "COFOUNDER_AGREEMENT").ContentHash;

            v2Hash.Should().NotBe(v1Hash);
        }

        [Fact]
        public async Task Test_K_UpstreamSourceVersionsBoundToLegalPackage()
        {
            var deal = SeedApprovedDeal();
            deal.AcceptedRevisionNumber = 2;
            deal.RoleAgreement!.Version = 3;
            deal.RoleAgreement.CreatorConfirmedVersion = 3;
            deal.RoleAgreement.EntrepreneurConfirmedVersion = 3;
            deal.CapTableDraft!.Version = 4;
            deal.CapTableDraft.CreatorConfirmedVersion = 4;
            deal.CapTableDraft.EntrepreneurConfirmedVersion = 4;

            var controller = CreateController(deal.CreatorId);
            var result = await controller.GetLegalPackage(deal.Id);
            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = resp.Data.Should().BeOfType<LegalReviewPackageDto>().Subject;

            dto.AcceptedOfferRevisionNumber.Should().Be(2);
            dto.RoleAgreementVersion.Should().Be(3);
            dto.CapTableVersion.Should().Be(4);
        }

        [Fact]
        public async Task Test_L_ProviderRequestsChanges_IncrementsVersionAndResetsApprovals()
        {
            var deal = SeedApprovedDeal();
            var spGuid = "44444444-4444-4444-4444-444444444444";
            var creatorController = CreateController(deal.CreatorId);

            _spProfilesDb.Clear();
            _spProfilesDb.Add(new ServiceProviderProfileRecord
            {
                UserId = spGuid,
                ProviderTier = ProviderTier.Tier2,
                VerificationStatus = ServiceProviderVerificationStatus.Verified,
                ServiceCategories = new List<ServiceCategory> { ServiceCategory.Legal }
            });

            await creatorController.InviteLegalProvider(deal.Id, new InviteLegalProviderRequest { ProviderId = spGuid });

            // Fake an existing creator approval
            deal.LegalPackage!.CreatorApprovedVersion = 1;
            deal.LegalPackage.CreatorApprovedAt = DateTime.UtcNow;

            var spController = CreateController(spGuid, "LegalProvider");
            var reviewResult = await spController.ProviderLegalReview(deal.Id, new ProviderLegalReviewRequest
            {
                ReviewStatus = "CHANGES_REQUESTED",
                Notes = "Add standard indemnification clause"
            });

            var ok = reviewResult.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = resp.Data.Should().BeOfType<LegalReviewPackageDto>().Subject;

            dto.Version.Should().Be(2);
            dto.ProviderReviewStatus.Should().Be("CHANGES_REQUESTED");
            dto.CreatorApprovedVersion.Should().Be(0);
            dto.CreatorApprovedAt.Should().BeNull();
        }

        [Fact]
        public async Task Test_M_AiExplanation_DoesNotMutatePackageState()
        {
            var deal = SeedApprovedDeal();
            var controller = CreateController(deal.CreatorId);

            await controller.GetLegalPackage(deal.Id);
            var docId = deal.LegalPackage!.Documents.First().Id;
            var initialVersion = deal.LegalPackage.Version;
            var initialStatus = deal.LegalPackage.Status;

            var explainResult = await controller.ExplainLegalDocument(deal.Id, docId);
            explainResult.Should().BeOfType<OkObjectResult>();

            deal.LegalPackage.Version.Should().Be(initialVersion);
            deal.LegalPackage.Status.Should().Be(initialStatus);
        }

        [Fact]
        public async Task Test_N_AiExplanation_ReturnsDisclaimerAndKeyTakeaways()
        {
            var deal = SeedApprovedDeal();
            var controller = CreateController(deal.CreatorId);

            await controller.GetLegalPackage(deal.Id);
            var docId = deal.LegalPackage!.Documents.First(d => d.DocumentType == "COFOUNDER_AGREEMENT").Id;

            var result = await controller.ExplainLegalDocument(deal.Id, docId);
            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var data = resp.Data.Should().BeOfType<ExplainLegalDocumentResponse>().Subject;

            data.Disclaimer.Should().Contain("AI-generated explanation — not legal advice");
            data.KeyTakeaways.Should().NotBeEmpty();
        }

        [Fact]
        public async Task Test_O_ProviderReviewComplete_SetsReviewedStatus()
        {
            var deal = SeedApprovedDeal();
            var spGuid = "44444444-4444-4444-4444-444444444444";
            var creatorController = CreateController(deal.CreatorId);

            _spProfilesDb.Clear();
            _spProfilesDb.Add(new ServiceProviderProfileRecord
            {
                UserId = spGuid,
                ProviderTier = ProviderTier.Tier2,
                VerificationStatus = ServiceProviderVerificationStatus.Verified,
                ServiceCategories = new List<ServiceCategory> { ServiceCategory.Legal }
            });

            await creatorController.InviteLegalProvider(deal.Id, new InviteLegalProviderRequest { ProviderId = spGuid });

            var spController = CreateController(spGuid, "LegalProvider");
            var result = await spController.ProviderLegalReview(deal.Id, new ProviderLegalReviewRequest
            {
                ReviewStatus = "REVIEW_COMPLETE",
                Notes = "All legal terms verified."
            });

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = resp.Data.Should().BeOfType<LegalReviewPackageDto>().Subject;

            dto.ProviderReviewStatus.Should().Be("REVIEW_COMPLETE");
            dto.ProviderReviewedAt.Should().NotBeNull();
            dto.Documents.All(d => d.Status == "REVIEWED").Should().BeTrue();
        }

        [Fact]
        public async Task Test_P_CreatorApprovesCurrentPackage()
        {
            var deal = SeedApprovedDeal();
            var controller = CreateController(deal.CreatorId);

            await controller.GetLegalPackage(deal.Id);
            deal.LegalPackage!.ProviderReviewStatus = "REVIEW_COMPLETE";

            var result = await controller.ApproveLegalPackage(deal.Id);
            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = resp.Data.Should().BeOfType<LegalReviewPackageDto>().Subject;

            dto.CreatorApprovedVersion.Should().Be(1);
            dto.Status.Should().Be("CREATOR_APPROVED");
            deal.DealStage.Should().Be("LEGAL_REVIEW_PENDING");
        }

        [Fact]
        public async Task Test_Q_EntrepreneurApprovesCurrentPackage()
        {
            var deal = SeedApprovedDeal();
            var controller = CreateController(deal.EntrepreneurId, "Entrepreneur");

            await controller.GetLegalPackage(deal.Id);
            deal.LegalPackage!.ProviderReviewStatus = "REVIEW_COMPLETE";

            var result = await controller.ApproveLegalPackage(deal.Id);
            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = resp.Data.Should().BeOfType<LegalReviewPackageDto>().Subject;

            dto.EntrepreneurApprovedVersion.Should().Be(1);
            dto.Status.Should().Be("ENTREPRENEUR_APPROVED");
            deal.DealStage.Should().Be("LEGAL_REVIEW_PENDING");
        }

        [Fact]
        public async Task Test_R_MismatchedApprovalVersions_DoNotFinalize()
        {
            var deal = SeedApprovedDeal();
            var creatorController = CreateController(deal.CreatorId);
            var entController = CreateController(deal.EntrepreneurId, "Entrepreneur");

            await creatorController.GetLegalPackage(deal.Id);
            deal.LegalPackage!.ProviderReviewStatus = "REVIEW_COMPLETE";

            // Creator approves V1
            await creatorController.ApproveLegalPackage(deal.Id);

            // Entrepreneur requests changes -> V2
            await entController.RequestLegalChanges(deal.Id, new RequestLegalChangesRequest { Feedback = "Update" });
            deal.LegalPackage.ProviderReviewStatus = "REVIEW_COMPLETE";

            // Entrepreneur approves V2
            await entController.ApproveLegalPackage(deal.Id);

            deal.LegalPackage.Status.Should().Be("ENTREPRENEUR_APPROVED");
            deal.DealStage.Should().Be("LEGAL_REVIEW_PENDING");
        }

        [Fact]
        public async Task Test_S_PackageRevision_InvalidatesStaleApprovals()
        {
            var deal = SeedApprovedDeal();
            var creatorController = CreateController(deal.CreatorId);

            await creatorController.GetLegalPackage(deal.Id);
            deal.LegalPackage!.ProviderReviewStatus = "REVIEW_COMPLETE";
            await creatorController.ApproveLegalPackage(deal.Id);

            deal.LegalPackage.CreatorApprovedVersion.Should().Be(1);

            // Request changes
            await creatorController.RequestLegalChanges(deal.Id, new RequestLegalChangesRequest { Feedback = "New Clause" });

            deal.LegalPackage.CreatorApprovedVersion.Should().Be(0);
            deal.LegalPackage.EntrepreneurApprovedVersion.Should().Be(0);
            deal.LegalPackage.Status.Should().Be("CHANGES_REQUESTED");
        }

        [Fact]
        public async Task Test_T_ProviderReviewRequired_BeforeFinalApproval()
        {
            var deal = SeedApprovedDeal();
            var creatorController = CreateController(deal.CreatorId);

            await creatorController.GetLegalPackage(deal.Id);
            deal.LegalPackage!.ProviderReviewStatus = "NOT_ASSIGNED";

            var result = await creatorController.ApproveLegalPackage(deal.Id);
            result.Should().BeOfType<UnprocessableEntityObjectResult>();
        }

        [Fact]
        public async Task Test_U_BothCurrentApprovalsAndProviderReview_SetsApproved()
        {
            var deal = SeedApprovedDeal();
            var creatorController = CreateController(deal.CreatorId);
            var entController = CreateController(deal.EntrepreneurId, "Entrepreneur");

            await creatorController.GetLegalPackage(deal.Id);
            deal.LegalPackage!.ProviderReviewStatus = "REVIEW_COMPLETE";

            await creatorController.ApproveLegalPackage(deal.Id);
            var result = await entController.ApproveLegalPackage(deal.Id);

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = resp.Data.Should().BeOfType<LegalReviewPackageDto>().Subject;

            dto.Status.Should().Be("APPROVED");
        }

        [Fact]
        public async Task Test_V_FullApproval_AdvancesDealStageToSignaturePending()
        {
            var deal = SeedApprovedDeal();
            var creatorController = CreateController(deal.CreatorId);
            var entController = CreateController(deal.EntrepreneurId, "Entrepreneur");

            await creatorController.GetLegalPackage(deal.Id);
            deal.LegalPackage!.ProviderReviewStatus = "REVIEW_COMPLETE";

            await creatorController.ApproveLegalPackage(deal.Id);
            await entController.ApproveLegalPackage(deal.Id);

            deal.DealStage.Should().Be("SIGNATURE_PENDING");
        }

        [Fact]
        public async Task Test_W_ActualCompanyRecords_RemainUnchanged()
        {
            var deal = SeedApprovedDeal();
            var initialCompany = _companiesDb.First();
            var initialName = initialCompany.CompanyName;

            var creatorController = CreateController(deal.CreatorId);
            var entController = CreateController(deal.EntrepreneurId, "Entrepreneur");

            await creatorController.GetLegalPackage(deal.Id);
            deal.LegalPackage!.ProviderReviewStatus = "REVIEW_COMPLETE";

            await creatorController.ApproveLegalPackage(deal.Id);
            await entController.ApproveLegalPackage(deal.Id);

            var currentCompany = _companiesDb.First();
            currentCompany.CompanyName.Should().Be(initialName);
        }

        [Fact]
        public async Task Test_X_UnrelatedUser_Receives403()
        {
            var deal = SeedApprovedDeal();
            var unrelatedController = CreateController("stranger-user-99");

            var result = await unrelatedController.GetLegalPackage(deal.Id);
            var forbidden = result.Should().BeOfType<ObjectResult>().Subject;
            forbidden.StatusCode.Should().Be(403);
        }

        [Fact]
        public async Task Test_Y_UnrelatedServiceProvider_Receives403()
        {
            var deal = SeedApprovedDeal();
            var sp1Guid = "44444444-4444-4444-4444-444444444444";
            var unrelatedSpGuid = "99999999-9999-9999-9999-999999999999";

            _spProfilesDb.Clear();
            _spProfilesDb.Add(new ServiceProviderProfileRecord
            {
                UserId = sp1Guid,
                ProviderTier = ProviderTier.Tier2,
                VerificationStatus = ServiceProviderVerificationStatus.Verified,
                ServiceCategories = new List<ServiceCategory> { ServiceCategory.Legal }
            });

            var creatorController = CreateController(deal.CreatorId);
            await creatorController.InviteLegalProvider(deal.Id, new InviteLegalProviderRequest { ProviderId = sp1Guid });

            var unrelatedSpController = CreateController(unrelatedSpGuid, "LegalProvider");
            var result = await unrelatedSpController.GetLegalPackage(deal.Id);

            var forbidden = result.Should().BeOfType<ObjectResult>().Subject;
            forbidden.StatusCode.Should().Be(403);
        }

        [Fact]
        public async Task Test_Z_IdeaA_And_IdeaB_AreIsolated()
        {
            var dealA = SeedApprovedDeal("deal-A", "creator-A", "ent-A");
            var dealB = SeedApprovedDeal("deal-B", "creator-B", "ent-B");

            var controllerA = CreateController("creator-A");
            var resA = await controllerA.GetLegalPackage("deal-A");
            var okA = resA.Should().BeOfType<OkObjectResult>().Subject;
            var respA = okA.Value.Should().BeOfType<ApiResponse>().Subject;
            var dtoA = respA.Data.Should().BeOfType<LegalReviewPackageDto>().Subject;

            dtoA.Should().NotBeNull();

            var resForbidden = await controllerA.GetLegalPackage("deal-B");
            var forbidden = resForbidden.Should().BeOfType<ObjectResult>().Subject;
            forbidden.StatusCode.Should().Be(403);
        }

        [Fact]
        public async Task Test_AA_DuplicateApprovals_AreIdempotent()
        {
            var deal = SeedApprovedDeal();
            var creatorController = CreateController(deal.CreatorId);

            await creatorController.GetLegalPackage(deal.Id);
            deal.LegalPackage!.ProviderReviewStatus = "REVIEW_COMPLETE";

            var res1 = await creatorController.ApproveLegalPackage(deal.Id);
            var res2 = await creatorController.ApproveLegalPackage(deal.Id);

            res1.Should().BeOfType<OkObjectResult>();
            res2.Should().BeOfType<OkObjectResult>();
            deal.LegalPackage.CreatorApprovedVersion.Should().Be(1);
        }

        [Fact]
        public async Task Test_AB_ConcurrentApproveAndRevision_Safe()
        {
            var deal = SeedApprovedDeal();
            var creatorController = CreateController(deal.CreatorId);
            var entController = CreateController(deal.EntrepreneurId, "Entrepreneur");

            await creatorController.GetLegalPackage(deal.Id);
            deal.LegalPackage!.ProviderReviewStatus = "REVIEW_COMPLETE";

            // Creator approves
            await creatorController.ApproveLegalPackage(deal.Id);

            // Concurrent revision requested
            await entController.RequestLegalChanges(deal.Id, new RequestLegalChangesRequest { Feedback = "Need edits" });

            // Creator's approval should have been invalidated by revision
            deal.LegalPackage.CreatorApprovedVersion.Should().Be(0);
            deal.LegalPackage.Version.Should().Be(2);
            deal.LegalPackage.Status.Should().Be("CHANGES_REQUESTED");
        }
    }
}
