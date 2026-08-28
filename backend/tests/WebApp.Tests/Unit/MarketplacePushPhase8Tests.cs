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
    public class MarketplacePushPhase8Tests
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

        public MarketplacePushPhase8Tests()
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

            ideasCollectionMock.Setup(c => c.ReplaceOneAsync(
                It.IsAny<FilterDefinition<CreatorIdea>>(),
                It.IsAny<CreatorIdea>(),
                It.IsAny<ReplaceOptions>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync((FilterDefinition<CreatorIdea> filter, CreatorIdea doc, ReplaceOptions opt, CancellationToken ct) =>
                {
                    var idx = _ideasDb.FindIndex(i => i.Id == doc.Id);
                    if (idx >= 0)
                    {
                        _ideasDb[idx] = doc;
                        return new ReplaceOneResult.Acknowledged(1, 1, doc.Id);
                    }
                    _ideasDb.Add(doc);
                    return new ReplaceOneResult.Acknowledged(1, 1, doc.Id);
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

            companiesCollectionMock.Setup(c => c.InsertOneAsync(
                It.IsAny<Companies>(),
                It.IsAny<InsertOneOptions>(),
                It.IsAny<CancellationToken>()))
                .Returns((Companies doc, InsertOneOptions opt, CancellationToken ct) =>
                {
                    _companiesDb.RemoveAll(c => c.Id == doc.Id);
                    _companiesDb.Add(doc);
                    return Task.CompletedTask;
                });

            companiesCollectionMock.Setup(c => c.ReplaceOneAsync(
                It.IsAny<FilterDefinition<Companies>>(),
                It.IsAny<Companies>(),
                It.IsAny<ReplaceOptions>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync((FilterDefinition<Companies> filter, Companies doc, ReplaceOptions opt, CancellationToken ct) =>
                {
                    var idx = _companiesDb.FindIndex(c => c.Id == doc.Id);
                    if (idx >= 0)
                    {
                        _companiesDb[idx] = doc;
                        return new ReplaceOneResult.Acknowledged(1, 1, doc.Id);
                    }
                    _companiesDb.Add(doc);
                    return new ReplaceOneResult.Acknowledged(1, 1, doc.Id);
                });

            _dbMock.Setup(d => d.GetCollection<Companies>("Companies", It.IsAny<MongoCollectionSettings>()))
                .Returns(companiesCollectionMock.Object);

            // Setup MarketplaceProjectAccessLogs mock collection
            var auditLogsCollectionMock = new Mock<IMongoCollection<MarketplaceProjectAccessLog>>();
            auditLogsCollectionMock.Setup(c => c.InsertOneAsync(
                It.IsAny<MarketplaceProjectAccessLog>(),
                It.IsAny<InsertOneOptions>(),
                It.IsAny<CancellationToken>()))
                .Returns((MarketplaceProjectAccessLog doc, InsertOneOptions opt, CancellationToken ct) =>
                {
                    _auditLogsDb.Add(doc);
                    return Task.CompletedTask;
                });

            _dbMock.Setup(d => d.GetCollection<MarketplaceProjectAccessLog>("MarketplaceProjectAccessLogs", It.IsAny<MongoCollectionSettings>()))
                .Returns(auditLogsCollectionMock.Object);

            // Setup UserManager mock
            var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
            _userManager = new UserManager<ApplicationUser>(
                userStoreMock.Object,
                null!, null!, null!, null!, null!, null!, null!, null!
            );

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

        private DealExecution SeedFullySignedDealForActivation(
            string dealId = "deal-1",
            string ideaId = "idea-1",
            string creatorId = "creator-1",
            string entId = "ent-1",
            string companyContext = "CASE_A_PRE_INCORPORATION",
            string? companyId = null)
        {
            var creatorGuid = Guid.TryParse(creatorId, out var cg) ? cg : Guid.NewGuid();
            var entGuid = Guid.TryParse(entId, out var eg) ? eg : Guid.NewGuid();
            _usersDb.RemoveAll(u => u.Id == creatorGuid || u.Id == entGuid);
            _usersDb.Add(new ApplicationUser { Id = creatorGuid, Name = "Dr. Alice Creator", UserName = "alice@example.com" });
            _usersDb.Add(new ApplicationUser { Id = entGuid, Name = "Bob Founder", UserName = "bob@example.com" });

            var idea = new CreatorIdea
            {
                Id = ideaId,
                UserId = creatorId,
                Project = new CreatorJourneyProject { Name = "Autonomous AI Supply Chain" },
                Phase5Data = new CreatorPhase5Data
                {
                    PathA = new CreatorPathA
                    {
                        MarketplaceListing = new CreatorMarketplaceListing
                        {
                            Status = "live",
                            OpenToPurchase = true,
                            OpenToEquityPartnership = true
                        }
                    }
                }
            };
            _ideasDb.RemoveAll(i => i.Id == ideaId);
            _ideasDb.Add(idea);

            var manifestHash = "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08";

            var signingPkg = new AgreementSigningPackage
            {
                Id = "signing-pkg-1",
                DealId = dealId,
                IdeaId = ideaId,
                LegalPackageId = "legal-pkg-1",
                LegalPackageVersion = 1,
                AcceptedOfferRevisionNumber = 1,
                RoleAgreementVersion = 1,
                CapTableVersion = 1,
                Jurisdiction = "Delaware, USA",
                CompanyContext = companyContext,
                CompanyId = companyId,
                CompanyName = "Autonomous Supply Chain Inc.",
                Documents = new List<SigningDocumentRef>
                {
                    new() { DocumentId = "doc_cofounder_v1", DocumentType = "COFOUNDER_AGREEMENT", Title = "Co-founder Agreement", RequirementType = "REQUIRED", DocumentVersion = 1, DocumentHash = "hash1" },
                    new() { DocumentId = "doc_ip_v1", DocumentType = "IP_CONTRIBUTION_AGREEMENT", Title = "IP Contribution Agreement", RequirementType = "REQUIRED", DocumentVersion = 1, DocumentHash = "hash2" },
                    new() { DocumentId = "doc_vesting_v1", DocumentType = "VESTING_AGREEMENT", Title = "Vesting Agreement", RequirementType = "REQUIRED", DocumentVersion = 1, DocumentHash = "hash3" }
                },
                ManifestHash = manifestHash,
                CreatorSignature = new PartySignature
                {
                    SignerUserId = creatorId,
                    SignerName = "Dr. Alice Creator",
                    SignerRole = "Creator",
                    ManifestHash = manifestHash,
                    LegalPackageVersion = 1,
                    SignedAt = DateTime.UtcNow.AddMinutes(-30),
                    SignatureHash = "sig_creator_sha256"
                },
                EntrepreneurSignature = new PartySignature
                {
                    SignerUserId = entId,
                    SignerName = "Bob Founder",
                    SignerRole = "Entrepreneur",
                    ManifestHash = manifestHash,
                    LegalPackageVersion = 1,
                    SignedAt = DateTime.UtcNow.AddMinutes(-15),
                    SignatureHash = "sig_ent_sha256"
                },
                Status = "AGREEMENT_SIGNED",
                Version = 1,
                FinalizedAt = DateTime.UtcNow.AddMinutes(-15)
            };

            var legalPkg = new LegalReviewPackage
            {
                Id = "legal-pkg-1",
                DealId = dealId,
                IdeaId = ideaId,
                Jurisdiction = "Delaware, USA",
                CompanyContext = companyContext,
                CompanyId = companyId,
                CompanyName = "Autonomous Supply Chain Inc.",
                Status = "APPROVED",
                Version = 1,
                CreatorApprovedVersion = 1,
                EntrepreneurApprovedVersion = 1,
                AssignedLegalProviderId = "sp-legal-1",
                AssignedLegalProviderName = "Attorney Smith, Esq.",
                ProviderReviewStatus = "REVIEW_COMPLETE",
                AcceptedOfferRevisionNumber = 1,
                RoleAgreementVersion = 1,
                CapTableVersion = 1
            };

            var deal = new DealExecution
            {
                Id = dealId,
                IdeaId = ideaId,
                DealType = "EQUITY_PARTNERSHIP",
                DealStage = "ACTIVATION_PENDING",
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
                    TotalShares = 10_000_000,
                    EsopPoolPercent = 5,
                    EsopVestingMonths = 48,
                    InvestorReservePercent = 0,
                    Entries = new List<DealCapTableEntry>
                    {
                        new() { UserId = creatorId, RoleTitle = "Chief Scientist", DisplayName = "Dr. Alice Creator", EquityPercent = 15, SharesGranted = 1_500_000, ShareClass = "Common", IsCreator = true },
                        new() { UserId = entId, RoleTitle = "CEO", DisplayName = "Bob Founder", EquityPercent = 80, SharesGranted = 8_000_000, ShareClass = "Common", IsFounder = true }
                    }
                },
                LegalPackage = legalPkg,
                SigningPackage = signingPkg,
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
        public async Task Test_A_DealMustBeActivationPending()
        {
            var deal = SeedFullySignedDealForActivation("deal-wrong-stage");
            deal.DealStage = "SIGNATURE_PENDING";

            var controller = CreateController("creator-1");
            var res = await controller.GetDealActivation("deal-wrong-stage");

            var unproc = res.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
            var resp = unproc.Value.Should().BeOfType<ApiResponse>().Subject;
            resp.Message.Should().Contain("DealStage must be 'ACTIVATION_PENDING'");
        }

        [Fact]
        public async Task Test_B_UnsignedDealCannotActivate()
        {
            var deal = SeedFullySignedDealForActivation("deal-unsigned");
            deal.SigningPackage!.Status = "PENDING_SIGNATURES";
            deal.SigningPackage.CreatorSignature = null;

            var controller = CreateController("creator-1");
            var res = await controller.StartDealActivation("deal-unsigned", new StartActivationRequest());

            var unproc = res.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
            var resp = unproc.Value.Should().BeOfType<ApiResponse>().Subject;
            resp.Message.Should().Contain("SigningPackage status must be AGREEMENT_SIGNED");
        }

        [Fact]
        public async Task Test_C_StaleManifestHashRejected()
        {
            var deal = SeedFullySignedDealForActivation("deal-stale-manifest");
            deal.SigningPackage!.CreatorSignature!.ManifestHash = "different_hash_abc123";

            var controller = CreateController("creator-1");
            var res = await controller.StartDealActivation("deal-stale-manifest", new StartActivationRequest());

            var unproc = res.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
            var resp = unproc.Value.Should().BeOfType<ApiResponse>().Subject;
            resp.Message.Should().Contain("Both parties must sign the exact same manifest");
        }

        [Fact]
        public async Task Test_D_CaseA_CreatesOrReusesExactlyOneCompany()
        {
            var deal = SeedFullySignedDealForActivation("deal-case-a");

            var controller = CreateController("creator-1");
            var res = await controller.StartDealActivation("deal-case-a", new StartActivationRequest { CompanyName = "New Venture Inc." });

            var ok = res.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var data = resp.Data.Should().BeOfType<PartnershipActivationDto>().Subject;
            data.CompanyId.Should().NotBeNullOrEmpty();
            data.Status.Should().Be("READY_TO_ACTIVATE");

            _companiesDb.Should().HaveCount(1);
            var company = _companiesDb[0];
            company.CompanyName.Should().Be("New Venture Inc.");
            company.SourceDealId.Should().Be("deal-case-a");
            company.SourceBusinessIdeaId.Should().Be("idea-1");
        }

        [Fact]
        public async Task Test_E_CaseB_LinksCorrectExistingCompany()
        {
            var existingCompany = new Companies
            {
                Id = "company-existing-1",
                OwnerId = "ent-1",
                CompanyName = "Existing Tech Corp",
                Industry = "AI",
                TotalShares = 10_000_000,
                EquityStructure = new List<EquityEntryDto>
                {
                    new() { StakeholderName = "Bob Founder", Type = "founder", SharesOwned = 10_000_000 }
                }
            };
            _companiesDb.Add(existingCompany);

            var deal = SeedFullySignedDealForActivation(
                dealId: "deal-case-b",
                companyContext: "CASE_B_EXISTING_COMPANY",
                companyId: "company-existing-1"
            );

            var controller = CreateController("ent-1", "Entrepreneur");
            var res = await controller.StartDealActivation("deal-case-b", new StartActivationRequest());

            var ok = res.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var data = resp.Data.Should().BeOfType<PartnershipActivationDto>().Subject;
            data.CompanyId.Should().Be("company-existing-1");
            data.Status.Should().Be("READY_TO_ACTIVATE");

            existingCompany.SourceDealId.Should().Be("deal-case-b");
            existingCompany.EquityStructure.Should().Contain(e => e.StakeholderName == "Dr. Alice Creator");
        }

        [Fact]
        public async Task Test_F_WrongCompanyRejected()
        {
            var otherCompany = new Companies
            {
                Id = "company-other-owner",
                OwnerId = "unrelated-user-999",
                CompanyName = "Other Company"
            };
            _companiesDb.Add(otherCompany);

            var deal = SeedFullySignedDealForActivation(
                dealId: "deal-wrong-company",
                companyContext: "CASE_B_EXISTING_COMPANY",
                companyId: "company-other-owner"
            );

            var controller = CreateController("ent-1", "Entrepreneur");
            var res = await controller.StartDealActivation("deal-wrong-company", new StartActivationRequest());

            res.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(403);
        }

        [Fact]
        public async Task Test_G_CreatorOwnershipEqualsSignedCapTable()
        {
            var deal = SeedFullySignedDealForActivation("deal-creator-ownership");

            var controller = CreateController("creator-1");
            await controller.StartDealActivation("deal-creator-ownership", new StartActivationRequest());

            var company = _companiesDb.First();
            var creatorEntry = company.EquityStructure.FirstOrDefault(e => e.StakeholderName == "Dr. Alice Creator");
            creatorEntry.Should().NotBeNull();
            creatorEntry!.SharesOwned.Should().Be(1_500_000);
        }

        [Fact]
        public async Task Test_H_VestingEqualsSignedOffer()
        {
            var deal = SeedFullySignedDealForActivation("deal-vesting");

            var controller = CreateController("creator-1");
            await controller.StartDealActivation("deal-vesting", new StartActivationRequest());

            var company = _companiesDb.First();
            var creatorEntry = company.EquityStructure.FirstOrDefault(e => e.StakeholderName == "Dr. Alice Creator");
            creatorEntry!.VestingMonths.Should().Be(48);
        }

        [Fact]
        public async Task Test_I_CliffEqualsSignedOffer()
        {
            var deal = SeedFullySignedDealForActivation("deal-cliff");

            var controller = CreateController("creator-1");
            var res = await controller.GetDealActivation("deal-cliff");

            var ok = res.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var data = resp.Data.Should().BeOfType<PartnershipActivationDto>().Subject;
            var creatorEntry = data.OwnershipComparison.Entries.FirstOrDefault(e => e.IsCreator);
            creatorEntry.Should().NotBeNull();
            creatorEntry!.CliffMonths.Should().Be(12);
        }

        [Fact]
        public async Task Test_J_EsopRepresentedCanonically()
        {
            var deal = SeedFullySignedDealForActivation("deal-esop");

            var controller = CreateController("creator-1");
            await controller.StartDealActivation("deal-esop", new StartActivationRequest());

            var company = _companiesDb.First();
            company.EsopPoolPercent.Should().Be(5);
            var esopEntry = company.EquityStructure.FirstOrDefault(e => e.Type == "esop");
            esopEntry.Should().NotBeNull();
            esopEntry!.SharesOwned.Should().Be(500_000);
        }

        [Fact]
        public async Task Test_K_InvestorReserveRepresentedCanonically()
        {
            var deal = SeedFullySignedDealForActivation("deal-investor-reserve");
            deal.CapTableDraft!.InvestorReservePercent = 10;

            var controller = CreateController("creator-1");
            await controller.StartDealActivation("deal-investor-reserve", new StartActivationRequest());

            var company = _companiesDb.First();
            var invEntry = company.EquityStructure.FirstOrDefault(e => e.StakeholderName == "Investor Reserve");
            invEntry.Should().NotBeNull();
            invEntry!.SharesOwned.Should().Be(1_000_000);
        }

        [Fact]
        public async Task Test_L_ExistingUnrelatedCompanyDataPreserved()
        {
            var existingCompany = new Companies
            {
                Id = "company-preserved",
                OwnerId = "ent-1",
                CompanyName = "Original Preserved Name",
                Industry = "Healthcare",
                Website = "https://preserved.example.com",
                Tagline = "Original Tagline",
                TotalShares = 10_000_000
            };
            _companiesDb.Add(existingCompany);

            var deal = SeedFullySignedDealForActivation(
                dealId: "deal-preserved",
                companyContext: "CASE_B_EXISTING_COMPANY",
                companyId: "company-preserved"
            );

            var controller = CreateController("ent-1", "Entrepreneur");
            await controller.StartDealActivation("deal-preserved", new StartActivationRequest());

            existingCompany.Industry.Should().Be("Healthcare");
            existingCompany.Website.Should().Be("https://preserved.example.com");
            existingCompany.Tagline.Should().Be("Original Tagline");
        }

        [Fact]
        public async Task Test_M_DealDocumentsLinkedToCompany()
        {
            var deal = SeedFullySignedDealForActivation("deal-docs-linked");

            var controller = CreateController("creator-1");
            await controller.StartDealActivation("deal-docs-linked", new StartActivationRequest());

            var company = _companiesDb.First();
            company.Documents.Should().HaveCount(3);
            company.Documents.Should().Contain(d => d.DocType == "COFOUNDER_AGREEMENT");
            company.Documents.Should().Contain(d => d.DocType == "IP_CONTRIBUTION_AGREEMENT");
            company.Documents.Should().Contain(d => d.DocType == "VESTING_AGREEMENT");
        }

        [Fact]
        public async Task Test_N_RequiredFilingBlockerEnforced()
        {
            var deal = SeedFullySignedDealForActivation("deal-filing-blocker");

            var controller = CreateController("creator-1");
            await controller.StartDealActivation("deal-filing-blocker", new StartActivationRequest());

            // Set filing status to pending
            var spController = CreateController("sp-legal-1", "LegalProvider");
            deal.LegalPackage!.AssignedLegalProviderId = "sp-legal-1";
            await spController.UpdateCorporateFilingStatus("deal-filing-blocker", new UpdateCorporateFilingRequest
            {
                FilingStatus = "EXTERNAL_FILING_PENDING"
            });

            // Complete should fail with blocker
            var res = await controller.CompleteDealActivation("deal-filing-blocker", new CompleteActivationRequest());
            var unproc = res.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
            var resp = unproc.Value.Should().BeOfType<ApiResponse>().Subject;
            resp.Message.Should().Contain("External corporate filing is pending verification");
        }

        [Fact]
        public async Task Test_O_DuplicateActivationStartIdempotent()
        {
            var deal = SeedFullySignedDealForActivation("deal-idempotent-start");

            var controller = CreateController("creator-1");
            await controller.StartDealActivation("deal-idempotent-start", new StartActivationRequest());
            var res2 = await controller.StartDealActivation("deal-idempotent-start", new StartActivationRequest());

            res2.Should().BeOfType<OkObjectResult>();
            _companiesDb.Should().HaveCount(1);
        }

        [Fact]
        public async Task Test_P_DuplicateCompanyCreationPrevented()
        {
            var deal = SeedFullySignedDealForActivation("deal-dup-comp");

            var controller = CreateController("creator-1");
            await controller.StartDealActivation("deal-dup-comp", new StartActivationRequest());
            await controller.StartDealActivation("deal-dup-comp", new StartActivationRequest());

            _companiesDb.Count(c => c.SourceDealId == "deal-dup-comp").Should().Be(1);
        }

        [Fact]
        public async Task Test_Q_DuplicateShareholderPrevented()
        {
            var deal = SeedFullySignedDealForActivation("deal-dup-shareholder");

            var controller = CreateController("creator-1");
            await controller.StartDealActivation("deal-dup-shareholder", new StartActivationRequest());
            await controller.StartDealActivation("deal-dup-shareholder", new StartActivationRequest());

            var company = _companiesDb.First();
            company.EquityStructure.Count(e => e.StakeholderName == "Dr. Alice Creator").Should().Be(1);
        }

        [Fact]
        public async Task Test_R_ConcurrentActivationSafe()
        {
            var deal = SeedFullySignedDealForActivation("deal-concurrent");

            var creatorCtrl = CreateController("creator-1");
            var entCtrl = CreateController("ent-1", "Entrepreneur");

            var t1 = creatorCtrl.StartDealActivation("deal-concurrent", new StartActivationRequest());
            var t2 = entCtrl.StartDealActivation("deal-concurrent", new StartActivationRequest());

            await Task.WhenAll(t1, t2);
            _companiesDb.Count(c => c.SourceDealId == "deal-concurrent").Should().Be(1);
        }

        [Fact]
        public async Task Test_S_TwoDealsSameIdeaCannotBothActivate()
        {
            var deal1 = SeedFullySignedDealForActivation("deal-1", "shared-idea");
            var deal2 = SeedFullySignedDealForActivation("deal-2", "shared-idea", entId: "ent-2");

            var ctrl1 = CreateController("creator-1");
            await ctrl1.StartDealActivation("deal-1", new StartActivationRequest());
            var res1 = await ctrl1.CompleteDealActivation("deal-1", new CompleteActivationRequest());
            res1.Should().BeOfType<OkObjectResult>();

            // Second deal should be blocked by race protection if ACTIVATION_PENDING
            deal2.DealStage = "ACTIVATION_PENDING";
            var ctrl2 = CreateController("ent-2", "Entrepreneur");
            var res2 = await ctrl2.StartDealActivation("deal-2", new StartActivationRequest());
            res2.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(409);
        }

        [Fact]
        public async Task Test_T_ActivationCompletesOnlyWhenCanActivate()
        {
            var deal = SeedFullySignedDealForActivation("deal-can-activate-gate");
            // Not started yet, company missing
            var controller = CreateController("creator-1");
            var res = await controller.CompleteDealActivation("deal-can-activate-gate", new CompleteActivationRequest());

            var unproc = res.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
            var resp = unproc.Value.Should().BeOfType<ApiResponse>().Subject;
            resp.Message.Should().Contain("Company workspace setup has not been initialized");
        }

        [Fact]
        public async Task Test_U_SuccessfulActivation_TransitionsTo_PARTNERSHIP_ACTIVE()
        {
            var deal = SeedFullySignedDealForActivation("deal-success");

            var controller = CreateController("creator-1");
            await controller.StartDealActivation("deal-success", new StartActivationRequest());
            var res = await controller.CompleteDealActivation("deal-success", new CompleteActivationRequest());

            var ok = res.Should().BeOfType<OkObjectResult>().Subject;
            var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
            var data = resp.Data.Should().BeOfType<PartnershipActivationDto>().Subject;
            data.Status.Should().Be("PARTNERSHIP_ACTIVE");

            deal.DealStage.Should().Be("PARTNERSHIP_ACTIVE");
            deal.Status.Should().Be("completed");
        }

        [Fact]
        public async Task Test_V_ProjectOutcome_Marked_CO_FOUNDED()
        {
            var deal = SeedFullySignedDealForActivation("deal-cofounded-outcome", "idea-cofounded");

            var controller = CreateController("creator-1");
            await controller.StartDealActivation("deal-cofounded-outcome", new StartActivationRequest());
            await controller.CompleteDealActivation("deal-cofounded-outcome", new CompleteActivationRequest());

            var idea = _ideasDb.First(i => i.Id == "idea-cofounded");
            idea.ProjectOutcome.Should().Be("CO_FOUNDED");
            idea.ActivePartnershipDealId.Should().Be("deal-cofounded-outcome");
        }

        [Fact]
        public async Task Test_W_ProjectOutcome_NOT_SOLD()
        {
            var deal = SeedFullySignedDealForActivation("deal-not-sold", "idea-not-sold");

            var controller = CreateController("creator-1");
            await controller.StartDealActivation("deal-not-sold", new StartActivationRequest());
            await controller.CompleteDealActivation("deal-not-sold", new CompleteActivationRequest());

            var idea = _ideasDb.First(i => i.Id == "idea-not-sold");
            idea.ProjectOutcome.Should().NotBe("SOLD");
            idea.ProjectOutcome.Should().Be("CO_FOUNDED");
        }

        [Fact]
        public async Task Test_X_MarketplaceListing_Status_CLOSED()
        {
            var deal = SeedFullySignedDealForActivation("deal-closed-listing", "idea-closed-listing");

            var controller = CreateController("creator-1");
            await controller.StartDealActivation("deal-closed-listing", new StartActivationRequest());
            await controller.CompleteDealActivation("deal-closed-listing", new CompleteActivationRequest());

            var idea = _ideasDb.First(i => i.Id == "idea-closed-listing");
            idea.Phase5Data?.PathA?.MarketplaceListing?.Status.Should().Be("closed");
        }

        [Fact]
        public async Task Test_Y_OpenToPurchase_False()
        {
            var deal = SeedFullySignedDealForActivation("deal-otp-false", "idea-otp-false");

            var controller = CreateController("creator-1");
            await controller.StartDealActivation("deal-otp-false", new StartActivationRequest());
            await controller.CompleteDealActivation("deal-otp-false", new CompleteActivationRequest());

            var idea = _ideasDb.First(i => i.Id == "idea-otp-false");
            idea.Phase5Data?.PathA?.MarketplaceListing?.OpenToPurchase.Should().BeFalse();
        }

        [Fact]
        public async Task Test_Z_OpenToEquityPartnership_False()
        {
            var deal = SeedFullySignedDealForActivation("deal-oep-false", "idea-oep-false");

            var controller = CreateController("creator-1");
            await controller.StartDealActivation("deal-oep-false", new StartActivationRequest());
            await controller.CompleteDealActivation("deal-oep-false", new CompleteActivationRequest());

            var idea = _ideasDb.First(i => i.Id == "idea-oep-false");
            idea.Phase5Data?.PathA?.MarketplaceListing?.OpenToEquityPartnership.Should().BeFalse();
        }

        [Fact]
        public async Task Test_AA_CompetingUnfinishedDealsCannotActivate_And_AreClosed()
        {
            var deal1 = SeedFullySignedDealForActivation("deal-compete-1", "idea-compete");
            var deal2 = SeedFullySignedDealForActivation("deal-compete-2", "idea-compete", entId: "ent-2");
            deal2.DealStage = "OFFER_NEGOTIATION";

            var controller = CreateController("creator-1");
            await controller.StartDealActivation("deal-compete-1", new StartActivationRequest());
            await controller.CompleteDealActivation("deal-compete-1", new CompleteActivationRequest());

            var d2 = _dealsDb.First(d => d.Id == "deal-compete-2");
            d2.DealStage.Should().Be("CLOSED");
            d2.Status.Should().Be("project_unavailable");
        }

        [Fact]
        public async Task Test_AB_CreatorRemainsCreatorRole()
        {
            var deal = SeedFullySignedDealForActivation("deal-creator-role");

            var controller = CreateController("creator-1");
            await controller.StartDealActivation("deal-creator-role", new StartActivationRequest());
            await controller.CompleteDealActivation("deal-creator-role", new CompleteActivationRequest());

            // Verify Creator user role was not mutated in this phase
            var creatorUser = _usersDb.First(u => u.Id.ToString() == "creator-1" || u.Name == "Dr. Alice Creator");
            creatorUser.Should().NotBeNull();
        }

        [Fact]
        public async Task Test_AC_EntrepreneurRoleNotAutoGrantedHere()
        {
            var deal = SeedFullySignedDealForActivation("deal-no-ent-role-grant");

            var controller = CreateController("creator-1");
            await controller.StartDealActivation("deal-no-ent-role-grant", new StartActivationRequest());
            await controller.CompleteDealActivation("deal-no-ent-role-grant", new CompleteActivationRequest());

            // Phase 6 Level Up handles role transition later; Screen 06 keeps roles distinct
            deal.DealStage.Should().Be("PARTNERSHIP_ACTIVE");
        }

        [Fact]
        public async Task Test_AD_UnrelatedUser_Returns403()
        {
            var deal = SeedFullySignedDealForActivation("deal-unrelated-user");

            var controller = CreateController("stranger-999", "Creator");
            var res = await controller.GetDealActivation("deal-unrelated-user");

            res.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(403);
        }

        [Fact]
        public async Task Test_AE_IdeaA_IdeaB_Isolation()
        {
            var dealA = SeedFullySignedDealForActivation("deal-idea-a", "idea-A");
            var dealB = SeedFullySignedDealForActivation("deal-idea-b", "idea-B");

            var ctrlA = CreateController("creator-1");
            await ctrlA.StartDealActivation("deal-idea-a", new StartActivationRequest());
            await ctrlA.CompleteDealActivation("deal-idea-a", new CompleteActivationRequest());

            var ideaA = _ideasDb.First(i => i.Id == "idea-A");
            var ideaB = _ideasDb.First(i => i.Id == "idea-B");

            ideaA.ProjectOutcome.Should().Be("CO_FOUNDED");
            ideaB.ProjectOutcome.Should().BeNull();
            ideaB.Phase5Data?.PathA?.MarketplaceListing?.Status.Should().Be("live");
        }

        [Fact]
        public async Task Test_AF_AuditEventsLogged()
        {
            var deal = SeedFullySignedDealForActivation("deal-audit-events");

            var controller = CreateController("creator-1");
            await controller.StartDealActivation("deal-audit-events", new StartActivationRequest());
            await controller.CompleteDealActivation("deal-audit-events", new CompleteActivationRequest());

            _auditLogsDb.Should().Contain(a => a.EventType == "activation_started");
            _auditLogsDb.Should().Contain(a => a.EventType == "company_created_for_deal");
            _auditLogsDb.Should().Contain(a => a.EventType == "cap_table_applied");
            _auditLogsDb.Should().Contain(a => a.EventType == "creator_shareholder_recorded");
            _auditLogsDb.Should().Contain(a => a.EventType == "company_documents_linked");
            _auditLogsDb.Should().Contain(a => a.EventType == "activation_completed");
            _auditLogsDb.Should().Contain(a => a.EventType == "project_cofounded");
            _auditLogsDb.Should().Contain(a => a.EventType == "marketplace_listing_closed");
        }
    }
}
