using System.Security.Claims;
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

namespace WebApp.Tests.Unit;

public class EquityPartnershipNewCompanyTests
{
    private readonly Mock<IMongoDatabase> _dbMock;
    private readonly MongoDbContext _context;
    private readonly Mock<ICompanyService> _companyServiceMock;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly Mock<INotificationService> _notificationsMock;
    private readonly Mock<ILogger<DealsController>> _dealsLoggerMock;

    private readonly List<DealExecution> _dealsDb = new();
    private readonly List<CreatorIdea> _ideasDb = new();
    private readonly List<Companies> _companiesDb = new();
    private readonly List<ApplicationUser> _usersDb = new();
    private readonly List<ProjectInterest> _interestsDb = new();
    private readonly List<MarketplaceProjectAccessLog> _auditLogsDb = new();

    public EquityPartnershipNewCompanyTests()
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

        // Setup ApplicationUsers mock collection
        var usersCollectionMock = new Mock<IMongoCollection<ApplicationUser>>();
        usersCollectionMock.Setup(c => c.FindAsync(
            It.IsAny<FilterDefinition<ApplicationUser>>(),
            It.IsAny<FindOptions<ApplicationUser, ApplicationUser>>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync((FilterDefinition<ApplicationUser> f, FindOptions<ApplicationUser, ApplicationUser> opt, CancellationToken ct) =>
            {
                if (f is ExpressionFilterDefinition<ApplicationUser> exprFilter)
                {
                    try
                    {
                        var predicate = exprFilter.Expression.Compile();
                        var matches = _usersDb.Where(predicate).ToList();
                        return MakeCursor(matches);
                    }
                    catch { }
                }
                return MakeCursor(_usersDb);
            });

        _dbMock.Setup(d => d.GetCollection<ApplicationUser>("applicationUsers", It.IsAny<MongoCollectionSettings>()))
            .Returns(usersCollectionMock.Object);

        // Setup ProjectInterests mock collection
        var interestsCollectionMock = new Mock<IMongoCollection<ProjectInterest>>();
        interestsCollectionMock.Setup(c => c.FindAsync(
            It.IsAny<FilterDefinition<ProjectInterest>>(),
            It.IsAny<FindOptions<ProjectInterest, ProjectInterest>>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync((FilterDefinition<ProjectInterest> f, FindOptions<ProjectInterest, ProjectInterest> opt, CancellationToken ct) => MakeCursor(_interestsDb));

        _dbMock.Setup(d => d.GetCollection<ProjectInterest>("ProjectInterests", It.IsAny<MongoCollectionSettings>()))
            .Returns(interestsCollectionMock.Object);

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

    private DealsController CreateController(string userId, string role = "Creator")
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
            new(ClaimTypes.Name, userId == "creator-1" ? "Alice Creator" : "Bob Entrepreneur"),
            new(ClaimTypes.Role, role)
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        return controller;
    }

    private DealExecution SeedFullySignedDeal(
        string dealId = "deal-1",
        string ideaId = "idea-1",
        string creatorId = "creator-1",
        string entId = "ent-1",
        double creatorEquity = 20.0)
    {
        var creatorGuid = Guid.TryParse(creatorId, out var cg) ? cg : Guid.NewGuid();
        var entGuid = Guid.TryParse(entId, out var eg) ? eg : Guid.NewGuid();

        _usersDb.RemoveAll(u => u.Id == creatorGuid || u.Id == entGuid);
        _usersDb.Add(new ApplicationUser
        {
            Id = creatorGuid,
            Name = "Dr. Alice Creator",
            UserName = "alice@example.com",
            EntrepreneurProfile = new EntrepreneurProfile()
        });
        _usersDb.Add(new ApplicationUser
        {
            Id = entGuid,
            Name = "Bob Entrepreneur",
            UserName = "bob@example.com",
            EntrepreneurProfile = new EntrepreneurProfile { CompanyId = "existing-active-comp" }
        });

        var idea = new CreatorIdea
        {
            Id = ideaId,
            UserId = creatorId,
            Project = new CreatorJourneyProject
            {
                Name = "Autonomous AI Supply Chain",
                Category = "Supply Chain",
                Tagline = "Next-gen supply chain automation"
            },
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

        var entEquity = 100.0 - creatorEquity;
        var totalShares = 10_000_000;
        var creatorShares = (int)Math.Round(totalShares * (creatorEquity / 100.0));
        var entShares = totalShares - creatorShares;

        var deal = new DealExecution
        {
            Id = dealId,
            DealType = "EQUITY_PARTNERSHIP",
            DealStage = "ACTIVATION_PENDING",
            Status = "active",
            IdeaId = ideaId,
            CreatorId = creatorId,
            EntrepreneurId = entId,
            AcceptedRevisionNumber = 1,
            EquityTerms = new EquityTerms
            {
                EquityPercentage = creatorEquity,
                CreatorRole = "Chief AI Officer",
                VestingMonths = 48,
                CliffMonths = 12
            },
            RoleAgreement = new RoleResponsibilityAgreement
            {
                Status = "CONFIRMED",
                Version = 1,
                CreatorRole = "Chief AI Officer",
                EntrepreneurRole = "CEO"
            },
            CapTableDraft = new DealCapTableDraft
            {
                Status = "APPROVED",
                Version = 1,
                TotalShares = totalShares,
                Entries = new List<DealCapTableEntry>
                {
                    new()
                    {
                        Id = "entry-creator",
                        UserId = creatorId,
                        DisplayName = "Dr. Alice Creator",
                        RoleTitle = "Chief AI Officer",
                        StakeholderType = "CO_FOUNDER",
                        ShareClass = "COMMON",
                        EquityPercent = creatorEquity,
                        SharesGranted = creatorShares,
                        IsCreator = true,
                        IsFounder = false
                    },
                    new()
                    {
                        Id = "entry-ent",
                        UserId = entId,
                        DisplayName = "Bob Entrepreneur",
                        RoleTitle = "CEO",
                        StakeholderType = "FOUNDER",
                        ShareClass = "COMMON",
                        EquityPercent = entEquity,
                        SharesGranted = entShares,
                        IsCreator = false,
                        IsFounder = true
                    }
                }
            },
            SigningPackage = new AgreementSigningPackage
            {
                Id = $"signing-pkg-{dealId}",
                DealId = dealId,
                IdeaId = ideaId,
                Status = "AGREEMENT_SIGNED",
                ManifestHash = "hash-12345",
                CreatorSignature = new PartySignature
                {
                    SignerUserId = creatorId,
                    SignerName = "Dr. Alice Creator",
                    SignerRole = "Creator",
                    ManifestHash = "hash-12345",
                    LegalPackageVersion = 1,
                    SignedAt = DateTime.UtcNow.AddMinutes(-30),
                    SignatureHash = "sig_creator_sha256"
                },
                EntrepreneurSignature = new PartySignature
                {
                    SignerUserId = entId,
                    SignerName = "Bob Entrepreneur",
                    SignerRole = "Entrepreneur",
                    ManifestHash = "hash-12345",
                    LegalPackageVersion = 1,
                    SignedAt = DateTime.UtcNow.AddMinutes(-15),
                    SignatureHash = "sig_ent_sha256"
                }
            }
        };

        _dealsDb.RemoveAll(d => d.Id == dealId);
        _dealsDb.Add(deal);

        return deal;
    }

    [Fact]
    public async Task EquityActivation_ZeroExistingCompanies_CreatesNew()
    {
        var deal = SeedFullySignedDeal("deal-zero-comp", "idea-zero", "creator-1", "ent-1", 20.0);

        var controller = CreateController("ent-1", "Entrepreneur");
        var res = await controller.StartDealActivation("deal-zero-comp", new StartActivationRequest());

        var ok = res.Should().BeOfType<OkObjectResult>().Subject;
        var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
        var data = resp.Data.Should().BeOfType<PartnershipActivationDto>().Subject;

        data.CompanyId.Should().NotBeNullOrEmpty();
        var company = _companiesDb.FirstOrDefault(c => c.Id == data.CompanyId);
        company.Should().NotBeNull();
        company!.OwnerId.Should().Be("ent-1");
        company.SourceBusinessIdeaId.Should().Be("idea-zero");
        company.SourceDealId.Should().Be("deal-zero-comp");
        company.CurrentPhase.Should().Be(2);
        company.VerificationStatus.Should().Be("pending");
    }

    [Fact]
    public async Task EquityActivation_OneExistingCompany_DoesNotReuseIt_CreatesSecond()
    {
        var existingCompany = new Companies
        {
            Id = "company-existing-1",
            OwnerId = "ent-1",
            CompanyName = "Existing Enterprise Corp",
            Industry = "Logistics",
            CurrentPhase = 4,
            TotalShares = 5_000_000,
            EquityStructure = new List<EquityEntryDto>
            {
                new() { StakeholderName = "Bob Entrepreneur", Type = "founder", SharesOwned = 5_000_000 }
            }
        };
        _companiesDb.Add(existingCompany);

        var deal = SeedFullySignedDeal("deal-second", "idea-second", "creator-1", "ent-1", 25.0);

        var controller = CreateController("ent-1", "Entrepreneur");
        var res = await controller.StartDealActivation("deal-second", new StartActivationRequest());

        var ok = res.Should().BeOfType<OkObjectResult>().Subject;
        var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
        var data = resp.Data.Should().BeOfType<PartnershipActivationDto>().Subject;

        data.CompanyId.Should().NotBe("company-existing-1");

        // Existing company is completely untouched
        existingCompany.CurrentPhase.Should().Be(4);
        existingCompany.SourceDealId.Should().BeNull();
        existingCompany.EquityStructure.Should().HaveCount(1);
        existingCompany.EquityStructure.First().StakeholderName.Should().Be("Bob Entrepreneur");

        // New company created with negotiated cap table
        var newCompany = _companiesDb.FirstOrDefault(c => c.Id == data.CompanyId);
        newCompany.Should().NotBeNull();
        newCompany!.SourceDealId.Should().Be("deal-second");
        newCompany.SourceBusinessIdeaId.Should().Be("idea-second");
        newCompany.EquityStructure.Should().Contain(e => e.StakeholderName == "Dr. Alice Creator");
    }

    [Fact]
    public async Task EquityActivation_MultipleExistingCompanies_CreatesAdditionalDedicatedCompany()
    {
        var compA = new Companies { Id = "comp-A", OwnerId = "ent-1", CompanyName = "Company A", CurrentPhase = 3 };
        var compB = new Companies { Id = "comp-B", OwnerId = "ent-1", CompanyName = "Company B", CurrentPhase = 5 };
        _companiesDb.Add(compA);
        _companiesDb.Add(compB);

        var deal = SeedFullySignedDeal("deal-third", "idea-third", "creator-1", "ent-1", 30.0);

        var controller = CreateController("ent-1", "Entrepreneur");
        var res = await controller.StartDealActivation("deal-third", new StartActivationRequest());

        var ok = res.Should().BeOfType<OkObjectResult>().Subject;
        var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
        var data = resp.Data.Should().BeOfType<PartnershipActivationDto>().Subject;

        data.CompanyId.Should().NotBe("comp-A");
        data.CompanyId.Should().NotBe("comp-B");

        compA.SourceDealId.Should().BeNull();
        compB.SourceDealId.Should().BeNull();

        _companiesDb.Should().HaveCount(3);
    }

    [Fact]
    public async Task EquityCompany_CapTable_SeedsNegotiatedEquityPercentages()
    {
        var deal = SeedFullySignedDeal("deal-equity-split", "idea-split", "creator-1", "ent-1", 20.0);

        var controller = CreateController("ent-1", "Entrepreneur");
        var res = await controller.StartDealActivation("deal-equity-split", new StartActivationRequest());

        var ok = res.Should().BeOfType<OkObjectResult>().Subject;
        var resp = ok.Value.Should().BeOfType<ApiResponse>().Subject;
        var data = resp.Data.Should().BeOfType<PartnershipActivationDto>().Subject;

        var company = _companiesDb.First(c => c.Id == data.CompanyId);
        var creatorEntry = company.EquityStructure.FirstOrDefault(e => e.StakeholderName == "Dr. Alice Creator");
        var entEntry = company.EquityStructure.FirstOrDefault(e => e.StakeholderName == "Bob Entrepreneur");

        creatorEntry.Should().NotBeNull();
        creatorEntry!.SharesOwned.Should().Be(2_000_000); // 20% of 10M

        entEntry.Should().NotBeNull();
        entEntry!.SharesOwned.Should().Be(8_000_000); // 80% of 10M

        (creatorEntry.SharesOwned + entEntry.SharesOwned).Should().Be(10_000_000);
    }

    [Fact]
    public async Task EquityActivation_IdempotentReactivation_ReturnsSameCompany()
    {
        var deal = SeedFullySignedDeal("deal-idempotent", "idea-idem", "creator-1", "ent-1", 15.0);

        var controller = CreateController("ent-1", "Entrepreneur");

        var res1 = await controller.StartDealActivation("deal-idempotent", new StartActivationRequest());
        var ok1 = res1.Should().BeOfType<OkObjectResult>().Subject;
        var data1 = ((ApiResponse)ok1.Value!).Data as PartnershipActivationDto;

        var res2 = await controller.StartDealActivation("deal-idempotent", new StartActivationRequest());
        var ok2 = res2.Should().BeOfType<OkObjectResult>().Subject;
        var data2 = ((ApiResponse)ok2.Value!).Data as PartnershipActivationDto;

        data2!.CompanyId.Should().Be(data1!.CompanyId);
        _companiesDb.Count(c => c.SourceDealId == "deal-idempotent").Should().Be(1);
    }

    [Fact]
    public async Task EquityActivation_CompleteDealActivation_UpdatesProjectOutcomeAndActiveCompany()
    {
        var deal = SeedFullySignedDeal("deal-complete", "idea-complete", "creator-1", "ent-1", 20.0);

        var controller = CreateController("ent-1", "Entrepreneur");
        await controller.StartDealActivation("deal-complete", new StartActivationRequest());

        var completeRes = await controller.CompleteDealActivation("deal-complete", new CompleteActivationRequest());
        completeRes.Should().BeOfType<OkObjectResult>();

        deal.DealStage.Should().Be("PARTNERSHIP_ACTIVE");
        deal.Status.Should().Be("completed");

        var idea = _ideasDb.First(i => i.Id == "idea-complete");
        idea.ProjectOutcome.Should().Be("CO_FOUNDED");
        idea.ActivePartnershipDealId.Should().Be("deal-complete");
        idea.CompanyId.Should().Be(deal.CompanyId);
    }
}
