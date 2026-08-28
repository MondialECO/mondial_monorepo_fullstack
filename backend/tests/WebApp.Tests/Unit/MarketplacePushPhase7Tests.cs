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
using System.Security.Cryptography;
using System.Text;
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
    public class MarketplacePushPhase7Tests
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
        private readonly List<CreatorIdea> _ideasDb = new();

        public MarketplacePushPhase7Tests()
        {
            _dbMock.Setup(d => d.GetCollection<CreatorIdea>("CreatorIdeas", null)).Returns(_ideasColMock.Object);
            _dbMock.Setup(d => d.GetCollection<ProjectInterest>("ProjectInterests", null)).Returns(_interestsColMock.Object);
            _dbMock.Setup(d => d.GetCollection<MarketplaceProjectAccessGrant>("MarketplaceProjectAccessGrants", null)).Returns(_grantsColMock.Object);
            _dbMock.Setup(d => d.GetCollection<MarketplaceProjectAccessLog>("MarketplaceProjectAccessLogs", null)).Returns(_logsColMock.Object);
            _dbMock.Setup(d => d.GetCollection<DealExecution>("DealExecutions", null)).Returns(_dealsColMock.Object);
            _dbMock.Setup(d => d.GetCollection<Companies>("Companies", null)).Returns(_companiesColMock.Object);
            _dbMock.Setup(d => d.GetCollection<ServiceProviderProfileRecord>("ServiceProviderProfiles", null)).Returns(_spProfilesColMock.Object);

            _ideasColMock.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), It.IsAny<FindOptions<CreatorIdea, CreatorIdea>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((FilterDefinition<CreatorIdea> f, FindOptions<CreatorIdea, CreatorIdea> o, CancellationToken ct) => MakeCursor(_ideasDb));
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

            userStoreMock.As<IUserStore<ApplicationUser>>()
                .Setup(s => s.FindByIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((string id, CancellationToken ct) => _usersDb.FirstOrDefault(u => u.Id.ToString() == id || (Guid.TryParse(id, out var g) && u.Id == g)));

            _context = new MongoDbContext(_dbMock.Object);
        }

        private static IAsyncCursor<T> MakeCursor<T>(List<T> items)
        {
            var cursorMock = new Mock<IAsyncCursor<T>>();
            cursorMock.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>()))
                .Returns(true)
                .Returns(false);
            cursorMock.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(true)
                .ReturnsAsync(false);
            cursorMock.Setup(c => c.Current).Returns(items);
            return cursorMock.Object;
        }

        private DealsController CreateController(string userId, string userRole = "Creator")
        {
            var controller = new DealsController(
                _companyServiceMock.Object,
                _userManager,
                _context,
                _dealsLoggerMock.Object,
                _notificationsMock.Object
            );

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, userId),
                new(ClaimTypes.Role, userRole)
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };

            return controller;
        }

        private DealExecution SeedApprovedDealForSigning(string dealId = "deal-1", string creatorId = "creator-1", string entId = "ent-1")
        {
            var creatorGuid = Guid.TryParse(creatorId, out var cg) ? cg : Guid.NewGuid();
            var entGuid = Guid.TryParse(entId, out var eg) ? eg : Guid.NewGuid();
            _usersDb.RemoveAll(u => u.Id == creatorGuid || u.Id == entGuid);
            _usersDb.Add(new ApplicationUser { Id = creatorGuid, Name = "Alice Creator", UserName = "alice@example.com" });
            _usersDb.Add(new ApplicationUser { Id = entGuid, Name = "Bob Founder", UserName = "bob@example.com" });

            var legalPkg = new LegalReviewPackage
            {
                Id = "legal-pkg-1",
                DealId = dealId,
                IdeaId = "idea-1",
                Jurisdiction = "Delaware, USA",
                CompanyContext = "CASE_A_PRE_INCORPORATION",
                Status = "APPROVED",
                Version = 1,
                CreatorApprovedVersion = 1,
                EntrepreneurApprovedVersion = 1,
                CreatorApprovedAt = DateTime.UtcNow.AddHours(-2),
                EntrepreneurApprovedAt = DateTime.UtcNow.AddHours(-1),
                AssignedLegalProviderId = "sp-legal-1",
                AssignedLegalProviderName = "Attorney Smith, Esq.",
                ProviderReviewStatus = "REVIEW_COMPLETE",
                ProviderReviewedAt = DateTime.UtcNow.AddHours(-1),
                AcceptedOfferRevisionNumber = 1,
                RoleAgreementVersion = 1,
                CapTableVersion = 1,
                Documents = new List<LegalDocument>
                {
                    new() { Id = "doc_cofounder_v1", DocumentType = "COFOUNDER_AGREEMENT", Title = "Co-founder Agreement", RequirementType = "REQUIRED", ContentMarkdown = "# Co-founder Agreement", ContentHash = "hash1", Version = 1, Status = "REVIEWED" },
                    new() { Id = "doc_ip_v1", DocumentType = "IP_CONTRIBUTION_AGREEMENT", Title = "IP Contribution Agreement", RequirementType = "REQUIRED", ContentMarkdown = "# IP Contribution", ContentHash = "hash2", Version = 1, Status = "REVIEWED" },
                    new() { Id = "doc_vesting_v1", DocumentType = "VESTING_AGREEMENT", Title = "Vesting Agreement", RequirementType = "REQUIRED", ContentMarkdown = "# Vesting Agreement", ContentHash = "hash3", Version = 1, Status = "REVIEWED" },
                }
            };

            var deal = new DealExecution
            {
                Id = dealId,
                IdeaId = "idea-1",
                DealType = "EQUITY_PARTNERSHIP",
                DealStage = "SIGNATURE_PENDING",
                Status = "initiated",
                CreatorId = creatorId,
                EntrepreneurId = entId,
                ConversationId = "conv-1",
                AcceptedRevisionNumber = 1,
                AcceptedAt = DateTime.UtcNow.AddDays(-1),
                EquityTerms = new EquityTerms
                {
                    EquityPercentage = 15,
                    CreatorRole = "Chief Scientist",
                    VestingEnabled = true,
                    VestingMonths = 48,
                    CliffMonths = 12
                },
                RoleAgreement = new RoleResponsibilityAgreement
                {
                    Id = "role-1",
                    DealId = dealId,
                    Status = "CONFIRMED",
                    Version = 1,
                    CreatorConfirmedVersion = 1,
                    EntrepreneurConfirmedVersion = 1
                },
                CapTableDraft = new DealCapTableDraft
                {
                    Id = "cap-1",
                    DealId = dealId,
                    Status = "APPROVED",
                    Version = 1,
                    CreatorConfirmedVersion = 1,
                    EntrepreneurConfirmedVersion = 1,
                    Entries = new List<DealCapTableEntry>
                    {
                        new() { UserId = creatorId, RoleTitle = "Chief Scientist", DisplayName = "Alice Creator", EquityPercent = 15, SharesGranted = 150000, ShareClass = "Common", IsCreator = true },
                        new() { UserId = entId, RoleTitle = "CEO", DisplayName = "Bob Founder", EquityPercent = 85, SharesGranted = 850000, ShareClass = "Common", IsFounder = true }
                    }
                },
                LegalPackage = legalPkg,
                Version = 1
            };

            _dealsDb.RemoveAll(d => d.Id == deal.Id);
            _dealsDb.Add(deal);
            return deal;
        }

        // =========================================================================
        // TESTS
        // =========================================================================

        [Fact]
        public async Task Test_A_WrongDealStage_CannotPrepareOrSign()
        {
            var deal = SeedApprovedDealForSigning("deal-wrong-stage");
            deal.DealStage = "LEGAL_REVIEW_PENDING";

            var controller = CreateController("creator-1");
            var res = await controller.SignAgreement("deal-wrong-stage", new SignAgreementRequest());

            var unproc = res.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
            var resp = unproc.Value.Should().BeOfType<ApiResponse>().Subject;
            resp.Message.Should().Contain("Signing is not available in stage 'LEGAL_REVIEW_PENDING'");
        }

        [Fact]
        public async Task Test_B_LegalPackageMustBeApproved()
        {
            var deal = SeedApprovedDealForSigning("deal-unapproved-pkg");
            deal.LegalPackage!.Status = "IN_REVIEW";

            var controller = CreateController("creator-1");
            var res = await controller.GetSigningPackage("deal-unapproved-pkg");

            res.Should().BeOfType<UnprocessableEntityObjectResult>();
        }

        [Fact]
        public async Task Test_C_ProviderReviewMustBeComplete()
        {
            var deal = SeedApprovedDealForSigning("deal-provider-incomplete");
            deal.LegalPackage!.ProviderReviewStatus = "IN_REVIEW";

            var controller = CreateController("creator-1");
            var res = await controller.SignAgreement("deal-provider-incomplete", new SignAgreementRequest());

            res.Should().BeOfType<UnprocessableEntityObjectResult>();
        }

        [Fact]
        public async Task Test_C2_NoProviderAssigned_AllowsSigning()
        {
            var deal = SeedApprovedDealForSigning("deal-no-provider-sign");
            deal.LegalPackage!.AssignedLegalProviderId = null;
            deal.LegalPackage.AssignedLegalProviderName = null;
            deal.LegalPackage.ProviderReviewStatus = "NOT_ASSIGNED";

            var controller = CreateController("creator-1");
            var res = await controller.GetSigningPackage("deal-no-provider-sign");

            var ok = res.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = resp.Data.Should().BeOfType<AgreementSigningPackageDto>().Subject;
            dto.Status.Should().Be("PENDING_SIGNATURES");
        }

        [Fact]
        public async Task Test_D_SigningPackageBindsApprovedLegalPackageVersion()
        {
            var deal = SeedApprovedDealForSigning("deal-bind-v");
            var controller = CreateController("creator-1");

            var res = await controller.GetSigningPackage("deal-bind-v");
            var ok = res.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = resp.Data.Should().BeOfType<AgreementSigningPackageDto>().Subject;

            dto.LegalPackageVersion.Should().Be(deal.LegalPackage!.Version);
            dto.AcceptedOfferRevisionNumber.Should().Be(1);
            dto.RoleAgreementVersion.Should().Be(1);
            dto.CapTableVersion.Should().Be(1);
        }

        [Fact]
        public async Task Test_E_ManifestIncludesAllRequiredDocumentHashes()
        {
            var deal = SeedApprovedDealForSigning("deal-manifest");
            var controller = CreateController("creator-1");

            var res = await controller.GetSigningPackage("deal-manifest");
            var ok = res.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = resp.Data.Should().BeOfType<AgreementSigningPackageDto>().Subject;

            dto.ManifestHash.Should().NotBeNullOrWhiteSpace();
            dto.Documents.Count.Should().Be(3);
            dto.Documents.All(d => !string.IsNullOrEmpty(d.DocumentHash)).Should().BeTrue();
        }

        [Fact]
        public async Task Test_F_CreatorSignsSuccessfully()
        {
            var deal = SeedApprovedDealForSigning("deal-creator-sign");
            var controller = CreateController("creator-1");

            var prep = await controller.GetSigningPackage("deal-creator-sign");
            var prepOk = prep.Should().BeOfType<OkObjectResult>().Subject;
            var prepDto = prepOk.Value.Should().BeOfType<ApiResponse>().Subject.Data.Should().BeOfType<AgreementSigningPackageDto>().Subject;
            var manifest = prepDto.ManifestHash;

            var res = await controller.SignAgreement("deal-creator-sign", new SignAgreementRequest
            {
                ManifestHash = manifest,
                LegalPackageVersion = 1,
                ConsentStatement = "I agree to all terms."
            });

            var ok = res.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = resp.Data.Should().BeOfType<AgreementSigningPackageDto>().Subject;

            dto.Status.Should().Be("CREATOR_SIGNED");
            dto.CreatorSignature.Should().NotBeNull();
            dto.CreatorSignature!.SignerUserId.Should().Be("creator-1");
            dto.CreatorSignature.SignerRole.Should().Be("Creator");
            dto.CreatorSignature.SignatureHash.Should().NotBeNullOrWhiteSpace();
            dto.EntrepreneurSignature.Should().BeNull();
        }

        [Fact]
        public async Task Test_G_EntrepreneurSignsSuccessfully()
        {
            var deal = SeedApprovedDealForSigning("deal-ent-sign");
            var controller = CreateController("ent-1", "Entrepreneur");

            var prep = await controller.GetSigningPackage("deal-ent-sign");
            var prepOk = prep.Should().BeOfType<OkObjectResult>().Subject;
            var prepDto = prepOk.Value.Should().BeOfType<ApiResponse>().Subject.Data.Should().BeOfType<AgreementSigningPackageDto>().Subject;
            var manifest = prepDto.ManifestHash;

            var res = await controller.SignAgreement("deal-ent-sign", new SignAgreementRequest
            {
                ManifestHash = manifest,
                LegalPackageVersion = 1
            });

            var ok = res.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = resp.Data.Should().BeOfType<AgreementSigningPackageDto>().Subject;

            dto.Status.Should().Be("ENTREPRENEUR_SIGNED");
            dto.EntrepreneurSignature.Should().NotBeNull();
            dto.EntrepreneurSignature!.SignerUserId.Should().Be("ent-1");
            dto.EntrepreneurSignature.SignerRole.Should().Be("Entrepreneur");
            dto.CreatorSignature.Should().BeNull();
        }

        [Fact]
        public async Task Test_H_EitherPartyCanSignFirst()
        {
            // Entrepreneur signs first
            var deal = SeedApprovedDealForSigning("deal-ent-first");
            var controllerEnt = CreateController("ent-1", "Entrepreneur");

            var prep = await controllerEnt.GetSigningPackage("deal-ent-first");
            var prepOk = prep.Should().BeOfType<OkObjectResult>().Subject;
            var prepDto = prepOk.Value.Should().BeOfType<ApiResponse>().Subject.Data.Should().BeOfType<AgreementSigningPackageDto>().Subject;
            var manifest = prepDto.ManifestHash;

            var resEnt = await controllerEnt.SignAgreement("deal-ent-first", new SignAgreementRequest { ManifestHash = manifest, LegalPackageVersion = 1 });
            resEnt.Should().BeOfType<OkObjectResult>();

            // Creator signs second
            var controllerCreator = CreateController("creator-1");
            var resCreator = await controllerCreator.SignAgreement("deal-ent-first", new SignAgreementRequest { ManifestHash = manifest, LegalPackageVersion = 1 });

            var ok = resCreator.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = resp.Data.Should().BeOfType<AgreementSigningPackageDto>().Subject;

            dto.Status.Should().Be("AGREEMENT_SIGNED");
            dto.CreatorSignature.Should().NotBeNull();
            dto.EntrepreneurSignature.Should().NotBeNull();
        }

        [Fact]
        public async Task Test_I_BothSignaturesMustReferenceSameManifestHash()
        {
            var deal = SeedApprovedDealForSigning("deal-same-manifest");
            var controllerCreator = CreateController("creator-1");
            var controllerEnt = CreateController("ent-1", "Entrepreneur");

            var prep = await controllerCreator.GetSigningPackage("deal-same-manifest");
            var prepOk = prep.Should().BeOfType<OkObjectResult>().Subject;
            var prepDto = prepOk.Value.Should().BeOfType<ApiResponse>().Subject.Data.Should().BeOfType<AgreementSigningPackageDto>().Subject;
            var manifest = prepDto.ManifestHash;

            await controllerCreator.SignAgreement("deal-same-manifest", new SignAgreementRequest { ManifestHash = manifest, LegalPackageVersion = 1 });
            await controllerEnt.SignAgreement("deal-same-manifest", new SignAgreementRequest { ManifestHash = manifest, LegalPackageVersion = 1 });

            deal.SigningPackage!.CreatorSignature!.ManifestHash.Should().Be(manifest);
            deal.SigningPackage.EntrepreneurSignature!.ManifestHash.Should().Be(manifest);
            deal.SigningPackage.CreatorSignature.ManifestHash.Should().Be(deal.SigningPackage.EntrepreneurSignature.ManifestHash);
        }

        [Fact]
        public async Task Test_J_BothSigned_TransitionsTo_AGREEMENT_SIGNED()
        {
            var deal = SeedApprovedDealForSigning("deal-both-signed");
            var controllerCreator = CreateController("creator-1");
            var controllerEnt = CreateController("ent-1", "Entrepreneur");

            var prep = await controllerCreator.GetSigningPackage("deal-both-signed");
            var prepOk = prep.Should().BeOfType<OkObjectResult>().Subject;
            var prepDto = prepOk.Value.Should().BeOfType<ApiResponse>().Subject.Data.Should().BeOfType<AgreementSigningPackageDto>().Subject;
            var manifest = prepDto.ManifestHash;

            await controllerCreator.SignAgreement("deal-both-signed", new SignAgreementRequest { ManifestHash = manifest, LegalPackageVersion = 1 });
            var res = await controllerEnt.SignAgreement("deal-both-signed", new SignAgreementRequest { ManifestHash = manifest, LegalPackageVersion = 1 });

            var ok = res.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var dto = resp.Data.Should().BeOfType<AgreementSigningPackageDto>().Subject;

            dto.Status.Should().Be("AGREEMENT_SIGNED");
            dto.FinalizedAt.Should().NotBeNull();
        }

        [Fact]
        public async Task Test_K_DealStage_AdvancesTo_ACTIVATION_PENDING()
        {
            var deal = SeedApprovedDealForSigning("deal-stage-adv");
            var controllerCreator = CreateController("creator-1");
            var controllerEnt = CreateController("ent-1", "Entrepreneur");

            var prep = await controllerCreator.GetSigningPackage("deal-stage-adv");
            var prepOk = prep.Should().BeOfType<OkObjectResult>().Subject;
            var prepDto = prepOk.Value.Should().BeOfType<ApiResponse>().Subject.Data.Should().BeOfType<AgreementSigningPackageDto>().Subject;
            var manifest = prepDto.ManifestHash;

            await controllerCreator.SignAgreement("deal-stage-adv", new SignAgreementRequest { ManifestHash = manifest, LegalPackageVersion = 1 });
            await controllerEnt.SignAgreement("deal-stage-adv", new SignAgreementRequest { ManifestHash = manifest, LegalPackageVersion = 1 });

            deal.DealStage.Should().Be("ACTIVATION_PENDING");
        }

        [Fact]
        public async Task Test_L_DuplicateCreatorSign_IsIdempotent()
        {
            var deal = SeedApprovedDealForSigning("deal-dup-creator");
            var controller = CreateController("creator-1");

            var prep = await controller.GetSigningPackage("deal-dup-creator");
            var prepOk = prep.Should().BeOfType<OkObjectResult>().Subject;
            var prepDto = prepOk.Value.Should().BeOfType<ApiResponse>().Subject.Data.Should().BeOfType<AgreementSigningPackageDto>().Subject;
            var manifest = prepDto.ManifestHash;

            var res1 = await controller.SignAgreement("deal-dup-creator", new SignAgreementRequest { ManifestHash = manifest, LegalPackageVersion = 1 });
            var ts1 = deal.SigningPackage!.CreatorSignature!.SignedAt;
            var hash1 = deal.SigningPackage.CreatorSignature.SignatureHash;

            var res2 = await controller.SignAgreement("deal-dup-creator", new SignAgreementRequest { ManifestHash = manifest, LegalPackageVersion = 1 });

            deal.SigningPackage.CreatorSignature.SignedAt.Should().Be(ts1);
            deal.SigningPackage.CreatorSignature.SignatureHash.Should().Be(hash1);
            res2.Should().BeOfType<OkObjectResult>();
        }

        [Fact]
        public async Task Test_M_DuplicateEntrepreneurSign_IsIdempotent()
        {
            var deal = SeedApprovedDealForSigning("deal-dup-ent");
            var controller = CreateController("ent-1", "Entrepreneur");

            var prep = await controller.GetSigningPackage("deal-dup-ent");
            var prepOk = prep.Should().BeOfType<OkObjectResult>().Subject;
            var prepDto = prepOk.Value.Should().BeOfType<ApiResponse>().Subject.Data.Should().BeOfType<AgreementSigningPackageDto>().Subject;
            var manifest = prepDto.ManifestHash;

            var res1 = await controller.SignAgreement("deal-dup-ent", new SignAgreementRequest { ManifestHash = manifest, LegalPackageVersion = 1 });
            var ts1 = deal.SigningPackage!.EntrepreneurSignature!.SignedAt;
            var hash1 = deal.SigningPackage.EntrepreneurSignature.SignatureHash;

            var res2 = await controller.SignAgreement("deal-dup-ent", new SignAgreementRequest { ManifestHash = manifest, LegalPackageVersion = 1 });

            deal.SigningPackage.EntrepreneurSignature.SignedAt.Should().Be(ts1);
            deal.SigningPackage.EntrepreneurSignature.SignatureHash.Should().Be(hash1);
            res2.Should().BeOfType<OkObjectResult>();
        }

        [Fact]
        public async Task Test_N_SimultaneousSignaturesSafe()
        {
            var deal = SeedApprovedDealForSigning("deal-simultaneous");
            var controllerCreator = CreateController("creator-1");
            var controllerEnt = CreateController("ent-1", "Entrepreneur");

            var prep = await controllerCreator.GetSigningPackage("deal-simultaneous");
            var prepOk = prep.Should().BeOfType<OkObjectResult>().Subject;
            var prepDto = prepOk.Value.Should().BeOfType<ApiResponse>().Subject.Data.Should().BeOfType<AgreementSigningPackageDto>().Subject;
            var manifest = prepDto.ManifestHash;

            var t1 = controllerCreator.SignAgreement("deal-simultaneous", new SignAgreementRequest { ManifestHash = manifest, LegalPackageVersion = 1 });
            var t2 = controllerEnt.SignAgreement("deal-simultaneous", new SignAgreementRequest { ManifestHash = manifest, LegalPackageVersion = 1 });

            await Task.WhenAll(t1, t2);

            deal.SigningPackage!.CreatorSignature.Should().NotBeNull();
            deal.SigningPackage.EntrepreneurSignature.Should().NotBeNull();
            deal.SigningPackage.Status.Should().Be("AGREEMENT_SIGNED");
            deal.DealStage.Should().Be("ACTIVATION_PENDING");
        }

        [Fact]
        public async Task Test_O_StaleSigningPackage_Returns_409()
        {
            var deal = SeedApprovedDealForSigning("deal-stale");
            var controller = CreateController("creator-1");

            var res = await controller.SignAgreement("deal-stale", new SignAgreementRequest
            {
                ManifestHash = "stale_hash_from_old_page_load",
                LegalPackageVersion = 1
            });

            var conflict = res.Should().BeOfType<ObjectResult>().Subject;
            conflict.StatusCode.Should().Be(409);
        }

        [Fact]
        public async Task Test_P_ChangedLegalDoc_InvalidatesSigningPackage()
        {
            var deal = SeedApprovedDealForSigning("deal-change-doc");
            var controller = CreateController("creator-1");

            var prep = await controller.GetSigningPackage("deal-change-doc");
            var prepOk = prep.Should().BeOfType<OkObjectResult>().Subject;
            var prepDto = prepOk.Value.Should().BeOfType<ApiResponse>().Subject.Data.Should().BeOfType<AgreementSigningPackageDto>().Subject;
            var manifest = prepDto.ManifestHash;

            await controller.SignAgreement("deal-change-doc", new SignAgreementRequest { ManifestHash = manifest, LegalPackageVersion = 1 });
            deal.SigningPackage!.Status.Should().Be("CREATOR_SIGNED");

            // Request change from signing screen
            var res = await controller.RequestSigningLegalChange("deal-change-doc", new RequestSigningLegalChangeRequest
            {
                Feedback = "Need to modify section 3 vesting acceleration."
            });

            res.Should().BeOfType<OkObjectResult>();
            deal.DealStage.Should().Be("LEGAL_REVIEW_PENDING");
            deal.SigningPackage.Status.Should().Be("INVALIDATED");
            deal.LegalPackage!.Status.Should().Be("CHANGES_REQUESTED");
            deal.LegalPackage.Version.Should().Be(2);
        }

        [Fact]
        public async Task Test_Q_OldSignatureCannotCarryToNewPackage()
        {
            var deal = SeedApprovedDealForSigning("deal-no-carry");
            var controllerCreator = CreateController("creator-1");
            var controllerEnt = CreateController("ent-1", "Entrepreneur");

            var prep = await controllerCreator.GetSigningPackage("deal-no-carry");
            var prepOk = prep.Should().BeOfType<OkObjectResult>().Subject;
            var prepDto = prepOk.Value.Should().BeOfType<ApiResponse>().Subject.Data.Should().BeOfType<AgreementSigningPackageDto>().Subject;
            var manifestV1 = prepDto.ManifestHash;

            await controllerCreator.SignAgreement("deal-no-carry", new SignAgreementRequest { ManifestHash = manifestV1, LegalPackageVersion = 1 });

            // Legal change
            await controllerEnt.RequestSigningLegalChange("deal-no-carry", new RequestSigningLegalChangeRequest { Feedback = "Update IP clause" });

            // Approve V2
            deal.LegalPackage!.CreatorApprovedVersion = 2;
            deal.LegalPackage.EntrepreneurApprovedVersion = 2;
            deal.LegalPackage.ProviderReviewStatus = "REVIEW_COMPLETE";
            deal.LegalPackage.Status = "APPROVED";
            deal.DealStage = "SIGNATURE_PENDING";

            // Get new signing package
            var prep2 = await controllerCreator.GetSigningPackage("deal-no-carry");
            var prep2Ok = prep2.Should().BeOfType<OkObjectResult>().Subject;
            var prep2Dto = prep2Ok.Value.Should().BeOfType<ApiResponse>().Subject.Data.Should().BeOfType<AgreementSigningPackageDto>().Subject;
            var manifestV2 = prep2Dto.ManifestHash;

            manifestV2.Should().NotBe(manifestV1);
            deal.SigningPackage!.LegalPackageVersion.Should().Be(2);
            deal.SigningPackage.CreatorSignature.Should().BeNull();
            deal.SigningPackage.EntrepreneurSignature.Should().BeNull();
            deal.SigningPackage.Status.Should().Be("PENDING_SIGNATURES");
        }

        [Fact]
        public async Task Test_R_UnauthorizedUser_Returns_403()
        {
            var deal = SeedApprovedDealForSigning("deal-unauth");
            var controller = CreateController("random-intruder");

            var res = await controller.SignAgreement("deal-unauth", new SignAgreementRequest());
            res.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(403);
        }

        [Fact]
        public async Task Test_S_LegalProviderCannotSignAsParty()
        {
            var deal = SeedApprovedDealForSigning("deal-sp-sign");
            var controller = CreateController("sp-legal-1", "ServiceProvider");

            var prep = await controller.GetSigningPackage("deal-sp-sign");
            var prepOk = prep.Should().BeOfType<OkObjectResult>().Subject;
            var prepDto = prepOk.Value.Should().BeOfType<ApiResponse>().Subject.Data.Should().BeOfType<AgreementSigningPackageDto>().Subject;
            var manifest = prepDto.ManifestHash;

            var res = await controller.SignAgreement("deal-sp-sign", new SignAgreementRequest { ManifestHash = manifest, LegalPackageVersion = 1 });
            res.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(403);
        }

        [Fact]
        public async Task Test_T_IdeaA_And_IdeaB_AreIsolated()
        {
            var dealA = SeedApprovedDealForSigning("deal-A", "creator-A", "ent-A");
            var dealB = SeedApprovedDealForSigning("deal-B", "creator-B", "ent-B");

            var controllerA = CreateController("creator-A");
            var res = await controllerA.GetSigningPackage("deal-B");

            res.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(403);
        }

        [Fact]
        public async Task Test_U_DocumentDownloadAuthorizationEnforced()
        {
            var deal = SeedApprovedDealForSigning("deal-doc-auth");
            var controllerCreator = CreateController("creator-1");
            var controllerIntruder = CreateController("intruder-99");

            var okRes = await controllerCreator.GetSigningDocument("deal-doc-auth", "doc_cofounder_v1");
            okRes.Should().BeOfType<OkObjectResult>();

            var deniedRes = await controllerIntruder.GetSigningDocument("deal-doc-auth", "doc_cofounder_v1");
            deniedRes.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(403);
        }

        [Fact]
        public async Task Test_V_RequestLegalChangeReturnsToLegalReview()
        {
            var deal = SeedApprovedDealForSigning("deal-return-legal");
            var controller = CreateController("creator-1");

            var res = await controller.RequestSigningLegalChange("deal-return-legal", new RequestSigningLegalChangeRequest
            {
                Feedback = "Please clarify voting threshold in shareholder agreement."
            });

            res.Should().BeOfType<OkObjectResult>();
            deal.DealStage.Should().Be("LEGAL_REVIEW_PENDING");
            deal.LegalPackage!.Status.Should().Be("CHANGES_REQUESTED");
        }

        [Fact]
        public async Task Test_W_SignatureAuditHistoryPreservedAfterInvalidation()
        {
            var deal = SeedApprovedDealForSigning("deal-audit-pres");
            var controller = CreateController("creator-1");

            var prep = await controller.GetSigningPackage("deal-audit-pres");
            var prepOk = prep.Should().BeOfType<OkObjectResult>().Subject;
            var prepDto = prepOk.Value.Should().BeOfType<ApiResponse>().Subject.Data.Should().BeOfType<AgreementSigningPackageDto>().Subject;
            var manifest = prepDto.ManifestHash;

            await controller.SignAgreement("deal-audit-pres", new SignAgreementRequest { ManifestHash = manifest, LegalPackageVersion = 1 });
            await controller.RequestSigningLegalChange("deal-audit-pres", new RequestSigningLegalChangeRequest { Feedback = "Need adjustments" });

            _logsDb.Any(a => a.EventType == "creator_signed").Should().BeTrue();
            _logsDb.Any(a => a.EventType == "signing_package_invalidated").Should().BeTrue();
            _logsDb.Any(a => a.EventType == "legal_change_requested_from_signing").Should().BeTrue();
        }

        [Fact]
        public async Task Test_X_ActualCompanyRemainsUnchanged()
        {
            var deal = SeedApprovedDealForSigning("deal-no-comp-mut");
            var company = new Companies
            {
                Id = "company-1",
                CompanyName = "Original Enterprise LLC",
                Country = "Delaware, USA",
                OwnerId = "ent-1"
            };
            _companiesDb.Add(company);

            var controllerCreator = CreateController("creator-1");
            var controllerEnt = CreateController("ent-1", "Entrepreneur");

            var prep = await controllerCreator.GetSigningPackage("deal-no-comp-mut");
            var prepOk = prep.Should().BeOfType<OkObjectResult>().Subject;
            var prepDto = prepOk.Value.Should().BeOfType<ApiResponse>().Subject.Data.Should().BeOfType<AgreementSigningPackageDto>().Subject;
            var manifest = prepDto.ManifestHash;

            await controllerCreator.SignAgreement("deal-no-comp-mut", new SignAgreementRequest { ManifestHash = manifest, LegalPackageVersion = 1 });
            await controllerEnt.SignAgreement("deal-no-comp-mut", new SignAgreementRequest { ManifestHash = manifest, LegalPackageVersion = 1 });

            // Company must NOT be mutated in Screen 05
            company.CompanyName.Should().Be("Original Enterprise LLC");
            _companyServiceMock.VerifyNoOtherCalls();
        }

        [Fact]
        public async Task Test_Y_ProjectIsNotMarked_CO_FOUNDED()
        {
            var deal = SeedApprovedDealForSigning("deal-not-cofounded");
            var idea = new CreatorIdea
            {
                Id = "idea-1",
                Status = "published",
                Project = new CreatorJourneyProject { Name = "Clean Energy Grid" }
            };
            _ideasDb.Add(idea);

            var controllerCreator = CreateController("creator-1");
            var controllerEnt = CreateController("ent-1", "Entrepreneur");

            var prep = await controllerCreator.GetSigningPackage("deal-not-cofounded");
            var prepOk = prep.Should().BeOfType<OkObjectResult>().Subject;
            var prepDto = prepOk.Value.Should().BeOfType<ApiResponse>().Subject.Data.Should().BeOfType<AgreementSigningPackageDto>().Subject;
            var manifest = prepDto.ManifestHash;

            await controllerCreator.SignAgreement("deal-not-cofounded", new SignAgreementRequest { ManifestHash = manifest, LegalPackageVersion = 1 });
            await controllerEnt.SignAgreement("deal-not-cofounded", new SignAgreementRequest { ManifestHash = manifest, LegalPackageVersion = 1 });

            // Idea must NOT be marked CO_FOUNDED in Screen 05 (reserved for Screen 06/07)
            idea.Status.Should().NotBe("CO_FOUNDED");
            idea.Status.Should().Be("published");
        }

        [Fact]
        public async Task Test_Z_DuplicateCompletionTransitionOccursExactlyOnce()
        {
            var deal = SeedApprovedDealForSigning("deal-exact-once");
            var controllerCreator = CreateController("creator-1");
            var controllerEnt = CreateController("ent-1", "Entrepreneur");

            var prep = await controllerCreator.GetSigningPackage("deal-exact-once");
            var prepOk = prep.Should().BeOfType<OkObjectResult>().Subject;
            var prepDto = prepOk.Value.Should().BeOfType<ApiResponse>().Subject.Data.Should().BeOfType<AgreementSigningPackageDto>().Subject;
            var manifest = prepDto.ManifestHash;

            await controllerCreator.SignAgreement("deal-exact-once", new SignAgreementRequest { ManifestHash = manifest, LegalPackageVersion = 1 });
            var res1 = await controllerEnt.SignAgreement("deal-exact-once", new SignAgreementRequest { ManifestHash = manifest, LegalPackageVersion = 1 });
            var res2 = await controllerEnt.SignAgreement("deal-exact-once", new SignAgreementRequest { ManifestHash = manifest, LegalPackageVersion = 1 });

            res1.Should().BeOfType<OkObjectResult>();
            res2.Should().BeOfType<OkObjectResult>();

            _logsDb.Count(a => a.EventType == "agreement_fully_signed").Should().Be(1);
            deal.SigningPackage!.Status.Should().Be("AGREEMENT_SIGNED");
            deal.DealStage.Should().Be("ACTIVATION_PENDING");
        }
    }
}
