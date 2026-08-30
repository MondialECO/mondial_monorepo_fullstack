using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;
using Moq;
using WebApp.Controllers;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services;
using WebApp.Services.Interface;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

public class InvestorPortfolioHoldingsTests
{
    private readonly Mock<MongoDbContext> _mockDbContext;
    private readonly Mock<IMongoCollection<CompanyPortfolioHolding>> _mockHoldingsCollection;
    private readonly Mock<IMongoCollection<Companies>> _mockCompaniesCollection;
    private readonly Mock<IMongoCollection<DealExecution>> _mockDealExecutionsCollection;
    private readonly Mock<IMongoCollection<InvestorMatch>> _mockMatchesCollection;
    private readonly Mock<IMongoCollection<Investor>> _mockInvestorsCollection;
    private readonly Mock<IMongoCollection<ApplicationUser>> _mockUsersCollection;
    private readonly Mock<IInvestmentsService> _mockInvestmentsService;
    private readonly Mock<IInvestorService> _mockInvestorService;
    private readonly Mock<ICompanyService> _mockCompanyService;
    private readonly Mock<IPhaseNotificationService> _mockNotificationService;
    private readonly Mock<SaveFile> _mockSaveFile;
    private readonly Mock<UserManager<ApplicationUser>> _mockUserManager;
    private readonly List<CompanyPortfolioHolding> _holdingsDb;

    private readonly Mock<IMongoDatabase> _mongoDbMock = new();

    public InvestorPortfolioHoldingsTests()
    {
        _holdingsDb = new List<CompanyPortfolioHolding>();
        _mockDbContext = new Mock<MongoDbContext>(_mongoDbMock.Object);
        _mockHoldingsCollection = new Mock<IMongoCollection<CompanyPortfolioHolding>>();
        _mockCompaniesCollection = new Mock<IMongoCollection<Companies>>();
        _mockDealExecutionsCollection = new Mock<IMongoCollection<DealExecution>>();
        _mockMatchesCollection = new Mock<IMongoCollection<InvestorMatch>>();
        _mockInvestorsCollection = new Mock<IMongoCollection<Investor>>();
        _mockUsersCollection = new Mock<IMongoCollection<ApplicationUser>>();
        _mockInvestmentsService = new Mock<IInvestmentsService>();
        _mockInvestorService = new Mock<IInvestorService>();
        _mockCompanyService = new Mock<ICompanyService>();
        _mockNotificationService = new Mock<IPhaseNotificationService>();
        _mockSaveFile = new Mock<SaveFile>();

        var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
        _mockUserManager = new Mock<UserManager<ApplicationUser>>(
            userStoreMock.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        _mockDbContext.Setup(db => db.CompanyPortfolioHoldings).Returns(_mockHoldingsCollection.Object);
        _mockDbContext.Setup(db => db.Companies).Returns(_mockCompaniesCollection.Object);
        _mockDbContext.Setup(db => db.DealExecutions).Returns(_mockDealExecutionsCollection.Object);
        _mockDbContext.Setup(db => db.InvestorMatches).Returns(_mockMatchesCollection.Object);
        _mockDbContext.Setup(db => db.Investors).Returns(_mockInvestorsCollection.Object);
        _mockDbContext.Setup(db => db.ApplicationUsers).Returns(_mockUsersCollection.Object);

        _mockHoldingsCollection
            .Setup(c => c.InsertOneAsync(It.IsAny<CompanyPortfolioHolding>(), null, default))
            .Callback<CompanyPortfolioHolding, InsertOneOptions, CancellationToken>((h, _, _) => _holdingsDb.Add(h))
            .Returns(Task.CompletedTask);

        _mockUsersCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<ApplicationUser>>(), It.IsAny<FindOptions<ApplicationUser, ApplicationUser>>(), default))
            .ReturnsAsync(() => MockCursor(new List<ApplicationUser>()).Object);
        _mockInvestorsCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<Investor>>(), It.IsAny<FindOptions<Investor, Investor>>(), default))
            .ReturnsAsync(() => MockCursor(new List<Investor>()).Object);
        _mockMatchesCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<InvestorMatch>>(), It.IsAny<FindOptions<InvestorMatch, InvestorMatch>>(), default))
            .ReturnsAsync(() => MockCursor(new List<InvestorMatch>()).Object);
        _mockCompaniesCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<Companies>>(), It.IsAny<FindOptions<Companies, Companies>>(), default))
            .ReturnsAsync(() => MockCursor(new List<Companies>()).Object);
        _mockHoldingsCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CompanyPortfolioHolding>>(), It.IsAny<FindOptions<CompanyPortfolioHolding, CompanyPortfolioHolding>>(), default))
            .ReturnsAsync(() => MockCursor(new List<CompanyPortfolioHolding>()).Object);

        _mockCompanyService.Setup(c => c.ReconcileClosedDealPortfolioHoldingsAsync(It.IsAny<string?>())).ReturnsAsync(0);
        _mockInvestmentsService.Setup(i => i.GetByInvestorAsync(It.IsAny<Guid>())).ReturnsAsync(new List<Investments>());
    }

    private CompanyService CreateCompanyService()
    {
        var mockValuation = new Mock<IValuationEngine>();
        var mockCapTable = new Mock<ICapTableCalculator>();
        var mockMatcher = new Mock<IInvestorMatcher>();
        var mockAiReview = new Mock<IAiReviewEngine>();
        var mockDocMgr = new Mock<IDocumentManager>();
        var mockValidator = new Mock<IPhaseValidator>();
        var mockEvents = new Mock<IDealEventPublisher>();
        var mockServiceProvider = new Mock<IServiceProvider>();
        mockServiceProvider
            .Setup(sp => sp.GetService(typeof(IPhaseNotificationService)))
            .Returns(_mockNotificationService.Object);

        return new CompanyService(
            _mockDbContext.Object,
            mockValuation.Object,
            mockCapTable.Object,
            mockMatcher.Object,
            mockAiReview.Object,
            mockDocMgr.Object,
            mockValidator.Object,
            mockEvents.Object,
            null,
            mockServiceProvider.Object
        );
    }

    [Fact]
    public async Task CloseDeal_CreatesCompanyPortfolioHolding_WithCorrectProvenance()
    {
        var service = CreateCompanyService();
        var companyId = ObjectId.GenerateNewId().ToString();
        var dealId = ObjectId.GenerateNewId().ToString();
        var investorId = "inv-100";

        var company = new Companies { Id = companyId, CompanyName = "Acme Robotics", Industry = "AI" };
        _mockCompaniesCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<Companies>>(), It.IsAny<FindOptions<Companies, Companies>>(), default))
            .ReturnsAsync(() => MockCursor(new List<Companies> { company }).Object);

        _mockHoldingsCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CompanyPortfolioHolding>>(), It.IsAny<FindOptions<CompanyPortfolioHolding, CompanyPortfolioHolding>>(), default))
            .ReturnsAsync(() => MockCursor(new List<CompanyPortfolioHolding>()).Object);

        var match = new InvestorMatch { Id = "match-99", CompanyId = companyId, InvestorId = investorId };
        _mockMatchesCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<InvestorMatch>>(), It.IsAny<FindOptions<InvestorMatch, InvestorMatch>>(), default))
            .ReturnsAsync(() => MockCursor(new List<InvestorMatch> { match }).Object);

        var deal = new DealExecution
        {
            Id = dealId,
            CompanyId = companyId,
            Status = "completed",
            ClosedAt = DateTime.UtcNow,
            Investors = new List<DealParticipant>
            {
                new DealParticipant
                {
                    InvestorId = investorId,
                    CommittedAmount = 150000,
                    EquityPercentage = 10.0
                }
            },
            TermSheet = new TermSheet
            {
                EquityType = "preferred",
                TotalRaiseAmount = 150000,
                PostMoneyValuation = 1500000,
                InvestorEquityPercent = 10.0
            }
        };

        await service.CreateCompanyPortfolioHoldingsForDealAsync(deal, "user-founder");

        Assert.Single(_holdingsDb);
        var holding = _holdingsDb[0];
        Assert.Equal(investorId, holding.InvestorId);
        Assert.Equal(companyId, holding.CompanyId);
        Assert.Equal("Acme Robotics", holding.CompanyName);
        Assert.Equal(dealId, holding.DealExecutionId);
        Assert.Equal("match-99", holding.MatchId);
        Assert.Equal(150000, holding.InvestmentAmount);
        Assert.Equal("equity", holding.InstrumentType);
        Assert.Equal(10.0, holding.EquityPercentage);
        Assert.Equal(1500000, holding.EntryValuation);
        Assert.Equal("active", holding.Status);
    }

    [Fact]
    public async Task CloseDeal_SafeDoesNotFakeOwnership()
    {
        var service = CreateCompanyService();
        var companyId = ObjectId.GenerateNewId().ToString();
        var dealId = ObjectId.GenerateNewId().ToString();
        var investorId = "inv-safe";

        var company = new Companies { Id = companyId, CompanyName = "SafeCorp" };
        _mockCompaniesCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<Companies>>(), It.IsAny<FindOptions<Companies, Companies>>(), default))
            .ReturnsAsync(() => MockCursor(new List<Companies> { company }).Object);
        _mockHoldingsCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CompanyPortfolioHolding>>(), It.IsAny<FindOptions<CompanyPortfolioHolding, CompanyPortfolioHolding>>(), default))
            .ReturnsAsync(() => MockCursor(new List<CompanyPortfolioHolding>()).Object);
        _mockMatchesCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<InvestorMatch>>(), It.IsAny<FindOptions<InvestorMatch, InvestorMatch>>(), default))
            .ReturnsAsync(() => MockCursor(new List<InvestorMatch>()).Object);

        var deal = new DealExecution
        {
            Id = dealId,
            CompanyId = companyId,
            Status = "completed",
            ClosedAt = DateTime.UtcNow,
            Investors = new List<DealParticipant>
            {
                new DealParticipant { InvestorId = investorId, CommittedAmount = 250000 }
            },
            TermSheet = new TermSheet
            {
                EquityType = "safe",
                TotalRaiseAmount = 250000,
                PostMoneyValuation = 5000000,
                InvestorEquityPercent = 5.0
            }
        };

        await service.CreateCompanyPortfolioHoldingsForDealAsync(deal, "user-founder");

        Assert.Single(_holdingsDb);
        var holding = _holdingsDb[0];
        Assert.Equal("safe", holding.InstrumentType);
        Assert.Null(holding.EquityPercentage);
        Assert.Equal(250000, holding.InvestmentAmount);
    }

    [Fact]
    public async Task CloseDeal_ConvertibleAndDebt_DoNotFakeOwnership()
    {
        var service = CreateCompanyService();
        var companyId = ObjectId.GenerateNewId().ToString();
        var dealId = ObjectId.GenerateNewId().ToString();

        var company = new Companies { Id = companyId, CompanyName = "DebtCorp" };
        _mockCompaniesCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<Companies>>(), It.IsAny<FindOptions<Companies, Companies>>(), default))
            .ReturnsAsync(() => MockCursor(new List<Companies> { company }).Object);
        _mockHoldingsCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CompanyPortfolioHolding>>(), It.IsAny<FindOptions<CompanyPortfolioHolding, CompanyPortfolioHolding>>(), default))
            .ReturnsAsync(() => MockCursor(new List<CompanyPortfolioHolding>()).Object);
        _mockMatchesCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<InvestorMatch>>(), It.IsAny<FindOptions<InvestorMatch, InvestorMatch>>(), default))
            .ReturnsAsync(() => MockCursor(new List<InvestorMatch>()).Object);

        var deal = new DealExecution
        {
            Id = dealId,
            CompanyId = companyId,
            Status = "completed",
            Investors = new List<DealParticipant>
            {
                new DealParticipant { InvestorId = "inv-debt", CommittedAmount = 100000 }
            },
            TermSheet = new TermSheet
            {
                EquityType = "debt",
                TotalRaiseAmount = 100000
            }
        };

        await service.CreateCompanyPortfolioHoldingsForDealAsync(deal, "user-founder");

        Assert.Single(_holdingsDb);
        var holding = _holdingsDb[0];
        Assert.Equal("debt", holding.InstrumentType);
        Assert.Null(holding.EquityPercentage);
    }

    [Fact]
    public async Task CloseDeal_Idempotent_NoDuplicateHolding()
    {
        var service = CreateCompanyService();
        var companyId = ObjectId.GenerateNewId().ToString();
        var dealId = ObjectId.GenerateNewId().ToString();
        var investorId = "inv-100";

        var existingHolding = new CompanyPortfolioHolding
        {
            Id = "holding-1",
            InvestorId = investorId,
            DealExecutionId = dealId,
            CompanyId = companyId
        };

        _mockCompaniesCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<Companies>>(), It.IsAny<FindOptions<Companies, Companies>>(), default))
            .ReturnsAsync(() => MockCursor(new List<Companies> { new Companies { Id = companyId, CompanyName = "Acme" } }).Object);
        _mockHoldingsCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CompanyPortfolioHolding>>(), It.IsAny<FindOptions<CompanyPortfolioHolding, CompanyPortfolioHolding>>(), default))
            .ReturnsAsync(() => MockCursor(new List<CompanyPortfolioHolding> { existingHolding }).Object);

        var deal = new DealExecution
        {
            Id = dealId,
            CompanyId = companyId,
            Status = "completed",
            Investors = new List<DealParticipant>
            {
                new DealParticipant { InvestorId = investorId, CommittedAmount = 50000 }
            }
        };

        await service.CreateCompanyPortfolioHoldingsForDealAsync(deal, "user-founder");

        Assert.Empty(_holdingsDb);
    }

    [Fact]
    public async Task CloseDeal_NotCompleted_NoHoldingCreated()
    {
        var service = CreateCompanyService();
        var deal = new DealExecution
        {
            Id = "deal-draft",
            CompanyId = "comp-1",
            Status = "draft",
            Investors = new List<DealParticipant> { new DealParticipant { InvestorId = "inv-1" } }
        };

        await service.CreateCompanyPortfolioHoldingsForDealAsync(deal, "user-founder");

        Assert.Empty(_holdingsDb);
    }

    [Fact]
    public async Task DealWithTwoInvestors_CreatesTwoSeparateHoldings()
    {
        var service = CreateCompanyService();
        var companyId = ObjectId.GenerateNewId().ToString();
        var dealId = ObjectId.GenerateNewId().ToString();

        var company = new Companies { Id = companyId, CompanyName = "MultiCorp" };
        _mockCompaniesCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<Companies>>(), It.IsAny<FindOptions<Companies, Companies>>(), default))
            .ReturnsAsync(() => MockCursor(new List<Companies> { company }).Object);
        _mockHoldingsCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CompanyPortfolioHolding>>(), It.IsAny<FindOptions<CompanyPortfolioHolding, CompanyPortfolioHolding>>(), default))
            .ReturnsAsync(() => MockCursor(new List<CompanyPortfolioHolding>()).Object);
        _mockMatchesCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<InvestorMatch>>(), It.IsAny<FindOptions<InvestorMatch, InvestorMatch>>(), default))
            .ReturnsAsync(() => MockCursor(new List<InvestorMatch>()).Object);

        var deal = new DealExecution
        {
            Id = dealId,
            CompanyId = companyId,
            Status = "completed",
            Investors = new List<DealParticipant>
            {
                new DealParticipant { InvestorId = "inv-A", CommittedAmount = 100000, EquityPercentage = 8.0 },
                new DealParticipant { InvestorId = "inv-B", CommittedAmount = 50000, EquityPercentage = 4.0 }
            },
            TermSheet = new TermSheet
            {
                EquityType = "equity",
                TotalRaiseAmount = 150000,
                PostMoneyValuation = 1250000
            }
        };

        await service.CreateCompanyPortfolioHoldingsForDealAsync(deal, "user-founder");

        Assert.Equal(2, _holdingsDb.Count);
        var holdingA = _holdingsDb.Find(h => h.InvestorId == "inv-A");
        var holdingB = _holdingsDb.Find(h => h.InvestorId == "inv-B");

        Assert.NotNull(holdingA);
        Assert.Equal(100000, holdingA.InvestmentAmount);
        Assert.Equal(8.0, holdingA.EquityPercentage);

        Assert.NotNull(holdingB);
        Assert.Equal(50000, holdingB.InvestmentAmount);
        Assert.Equal(4.0, holdingB.EquityPercentage);
    }

    [Fact]
    public async Task Portfolio_Security_InvestorACannotReadInvestorB()
    {
        var userAGuid = Guid.NewGuid().ToString();
        var controller = CreateInvestorPhaseController(userAGuid, "inv-A");

        var holdingB = new CompanyPortfolioHolding
        {
            Id = "holding-B",
            InvestorId = "inv-B",
            InvestorUserId = Guid.NewGuid().ToString(),
            CompanyId = "comp-1",
            CompanyName = "Secret Corp",
            InvestmentAmount = 500000
        };

        _mockHoldingsCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CompanyPortfolioHolding>>(), It.IsAny<FindOptions<CompanyPortfolioHolding, CompanyPortfolioHolding>>(), default))
            .ReturnsAsync(() => MockCursor(new List<CompanyPortfolioHolding> { holdingB }).Object);

        var result = await controller.GetPortfolioHolding("holding-B");

        var statusResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(403, statusResult.StatusCode);
    }

    [Fact]
    public async Task Backfill_CompletedDealCreatesMissingHolding_AndSkipsExisting()
    {
        var service = CreateCompanyService();
        var companyId = ObjectId.GenerateNewId().ToString();
        var deal1Id = ObjectId.GenerateNewId().ToString();
        var deal2Id = ObjectId.GenerateNewId().ToString();
        var investorId = "inv-backfill";

        var company = new Companies { Id = companyId, CompanyName = "Legacy Co" };
        _mockCompaniesCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<Companies>>(), It.IsAny<FindOptions<Companies, Companies>>(), default))
            .ReturnsAsync(() => MockCursor(new List<Companies> { company }).Object);

        var existingHolding = new CompanyPortfolioHolding
        {
            Id = "holding-existing",
            InvestorId = investorId,
            DealExecutionId = deal1Id,
            CompanyId = companyId
        };

        _mockHoldingsCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CompanyPortfolioHolding>>(), It.IsAny<FindOptions<CompanyPortfolioHolding, CompanyPortfolioHolding>>(), default))
            .ReturnsAsync(() => MockCursor(new List<CompanyPortfolioHolding> { existingHolding }).Object);

        var deal1 = new DealExecution
        {
            Id = deal1Id,
            CompanyId = companyId,
            Status = "completed",
            Investors = new List<DealParticipant> { new DealParticipant { InvestorId = investorId, CommittedAmount = 10000 } }
        };
        var deal2 = new DealExecution
        {
            Id = deal2Id,
            CompanyId = companyId,
            Status = "completed",
            Investors = new List<DealParticipant> { new DealParticipant { InvestorId = investorId, CommittedAmount = 25000, EquityPercentage = 5.0 } },
            TermSheet = new TermSheet { EquityType = "equity", TotalRaiseAmount = 25000, InvestorEquityPercent = 5.0 }
        };

        _mockDealExecutionsCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), default))
            .ReturnsAsync(() => MockCursor(new List<DealExecution> { deal1, deal2 }).Object);

        var count = await service.ReconcileClosedDealPortfolioHoldingsAsync(investorId);

        Assert.Equal(2, count);
    }

    [Fact]
    public async Task PortfolioStats_UsesCompanyHoldingsAndAvoidsFakeMath()
    {
        var userGuid = Guid.NewGuid().ToString();
        var controller = CreateInvestorPhaseController(userGuid, "inv-stats");

        var holding = new CompanyPortfolioHolding
        {
            Id = "holding-1",
            InvestorId = "inv-stats",
            InvestorUserId = userGuid,
            CompanyId = "comp-1",
            CompanyName = "RoboTech",
            InvestmentAmount = 75000,
            InstrumentType = "equity",
            EquityPercentage = 7.5,
            Status = "active"
        };

        _mockHoldingsCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CompanyPortfolioHolding>>(), It.IsAny<FindOptions<CompanyPortfolioHolding, CompanyPortfolioHolding>>(), default))
            .ReturnsAsync(() => MockCursor(new List<CompanyPortfolioHolding> { holding }).Object);

        var result = await controller.GetStats();
        var okResult = Assert.IsType<OkObjectResult>(result);
        var stats = Assert.IsType<InvestorStatsResponse>(okResult.Value);

        Assert.Equal(75000, stats.TotalInvested);
        Assert.Equal(1, stats.CompaniesInvested);
        Assert.Equal(1, stats.ActiveInvestments);
        Assert.Equal(1, stats.CompanyHoldings.Count);
        Assert.Equal("RoboTech", stats.CompanyHoldings[0].CompanyName);
        Assert.Equal(7.5, stats.CompanyHoldings[0].EquityPercentage);
    }

    private InvestorPhaseController CreateInvestorPhaseController(string userId, string investorId)
    {
        var controller = new InvestorPhaseController(
            _mockDbContext.Object,
            Mock.Of<ILogger<InvestorPhaseController>>(),
            _mockUserManager.Object,
            _mockInvestmentsService.Object,
            _mockInvestorService.Object,
            _mockCompanyService.Object,
            _mockNotificationService.Object,
            _mockSaveFile.Object
        );

        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Role, "Investor")
        }, "TestAuth"));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };

        var parsedGuid = Guid.TryParse(userId, out var g) ? g : Guid.NewGuid();

        var appUser = new ApplicationUser
        {
            Id = parsedGuid,
            Email = "investor@mondial.test",
            Onboarding = new OnboardingState { Phase = 1 },
            InvestorProfile = new InvestorProfile { InvestorId = investorId }
        };

        _mockUserManager.Setup(m => m.FindByIdAsync(userId)).ReturnsAsync(appUser);

        return controller;
    }

    private static Mock<IAsyncCursor<T>> MockCursor<T>(List<T> list)
    {
        var cursor = new Mock<IAsyncCursor<T>>();
        var moveNextCalls = 0;
        cursor.Setup(c => c.MoveNext(It.IsAny<CancellationToken>()))
            .Returns(() => moveNextCalls++ == 0);
        cursor.Setup(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => moveNextCalls++ == 0);
        cursor.Setup(c => c.Current).Returns(list);
        return cursor;
    }
}
