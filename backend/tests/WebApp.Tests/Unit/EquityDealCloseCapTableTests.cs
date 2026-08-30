using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;
using Moq;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services;
using WebApp.Services.Interface;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

public class EquityDealCloseCapTableTests
{
    private readonly Mock<MongoDbContext> _mockDbContext;
    private readonly Mock<IMongoCollection<CompanyPortfolioHolding>> _mockHoldingsCollection;
    private readonly Mock<IMongoCollection<Companies>> _mockCompaniesCollection;
    private readonly Mock<IMongoCollection<DealExecution>> _mockDealExecutionsCollection;
    private readonly Mock<IMongoCollection<InvestorMatch>> _mockMatchesCollection;
    private readonly Mock<IMongoCollection<Investor>> _mockInvestorsCollection;
    private readonly Mock<IMongoCollection<ApplicationUser>> _mockUsersCollection;
    private readonly Mock<IMongoCollection<Phase4CapTable>> _mockCapTablesCollection;
    private readonly Mock<IMongoCollection<Phase4ShareIssuance>> _mockShareIssuancesCollection;
    private readonly Mock<IMongoCollection<Phase4OwnershipHistory>> _mockOwnershipHistoriesCollection;
    private readonly Mock<IPhaseNotificationService> _mockNotificationService;
    private readonly Mock<SaveFile> _mockSaveFile;
    private readonly Mock<UserManager<ApplicationUser>> _mockUserManager;

    private readonly List<CompanyPortfolioHolding> _holdingsDb = new();
    private readonly List<Phase4CapTable> _capTablesDb = new();
    private readonly List<Phase4ShareIssuance> _issuancesDb = new();
    private readonly List<Phase4OwnershipHistory> _historyDb = new();
    private readonly List<Companies> _companiesDb = new();
    private readonly List<DealExecution> _dealsDb = new();

    public EquityDealCloseCapTableTests()
    {
        var mongoDbMock = new Mock<IMongoDatabase>();
        _mockDbContext = new Mock<MongoDbContext>(mongoDbMock.Object);
        _mockHoldingsCollection = new Mock<IMongoCollection<CompanyPortfolioHolding>>();
        _mockCompaniesCollection = new Mock<IMongoCollection<Companies>>();
        _mockDealExecutionsCollection = new Mock<IMongoCollection<DealExecution>>();
        _mockMatchesCollection = new Mock<IMongoCollection<InvestorMatch>>();
        _mockInvestorsCollection = new Mock<IMongoCollection<Investor>>();
        _mockUsersCollection = new Mock<IMongoCollection<ApplicationUser>>();
        _mockCapTablesCollection = new Mock<IMongoCollection<Phase4CapTable>>();
        _mockShareIssuancesCollection = new Mock<IMongoCollection<Phase4ShareIssuance>>();
        _mockOwnershipHistoriesCollection = new Mock<IMongoCollection<Phase4OwnershipHistory>>();
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
        _mockDbContext.Setup(db => db.Phase4CapTables).Returns(_mockCapTablesCollection.Object);
        _mockDbContext.Setup(db => db.Phase4ShareIssuances).Returns(_mockShareIssuancesCollection.Object);
        _mockDbContext.Setup(db => db.Phase4OwnershipHistories).Returns(_mockOwnershipHistoriesCollection.Object);

        // In-memory collections callbacks
        _mockHoldingsCollection
            .Setup(c => c.InsertOneAsync(It.IsAny<CompanyPortfolioHolding>(), null, default))
            .Callback<CompanyPortfolioHolding, InsertOneOptions, CancellationToken>((h, _, _) => _holdingsDb.Add(h))
            .Returns(Task.CompletedTask);

        _mockCapTablesCollection
            .Setup(c => c.InsertOneAsync(It.IsAny<Phase4CapTable>(), null, default))
            .Callback<Phase4CapTable, InsertOneOptions, CancellationToken>((ct, _, _) => _capTablesDb.Add(ct))
            .Returns(Task.CompletedTask);

        _mockShareIssuancesCollection
            .Setup(c => c.InsertOneAsync(It.IsAny<Phase4ShareIssuance>(), null, default))
            .Callback<Phase4ShareIssuance, InsertOneOptions, CancellationToken>((si, _, _) => _issuancesDb.Add(si))
            .Returns(Task.CompletedTask);

        _mockOwnershipHistoriesCollection
            .Setup(c => c.InsertOneAsync(It.IsAny<Phase4OwnershipHistory>(), null, default))
            .Callback<Phase4OwnershipHistory, InsertOneOptions, CancellationToken>((oh, _, _) => _historyDb.Add(oh))
            .Returns(Task.CompletedTask);

        _mockCompaniesCollection
            .Setup(c => c.ReplaceOneAsync(It.IsAny<FilterDefinition<Companies>>(), It.IsAny<Companies>(), (ReplaceOptions)null, default))
            .Callback<FilterDefinition<Companies>, Companies, ReplaceOptions, CancellationToken>((_, comp, _, _) =>
            {
                var idx = _companiesDb.FindIndex(c => c.Id == comp.Id);
                if (idx >= 0) _companiesDb[idx] = comp;
                else _companiesDb.Add(comp);
            })
            .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));
        _mockCompaniesCollection
            .Setup(c => c.ReplaceOneAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<FilterDefinition<Companies>>(), It.IsAny<Companies>(), (ReplaceOptions)null, default))
            .Callback<IClientSessionHandle, FilterDefinition<Companies>, Companies, ReplaceOptions, CancellationToken>((_, _, comp, _, _) =>
            {
                var idx = _companiesDb.FindIndex(c => c.Id == comp.Id);
                if (idx >= 0) _companiesDb[idx] = comp;
                else _companiesDb.Add(comp);
            })
            .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

        // Setup cursors (both 3-param and 4-param session overloads for Mongo FindFluent compatibility)
        _mockUsersCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<ApplicationUser>>(), It.IsAny<FindOptions<ApplicationUser, ApplicationUser>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => MockCursor(new List<ApplicationUser>()).Object);
        _mockUsersCollection.Setup(c => c.FindAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<FilterDefinition<ApplicationUser>>(), It.IsAny<FindOptions<ApplicationUser, ApplicationUser>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => MockCursor(new List<ApplicationUser>()).Object);

        _mockInvestorsCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<Investor>>(), It.IsAny<FindOptions<Investor, Investor>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => MockCursor(new List<Investor>()).Object);
        _mockInvestorsCollection.Setup(c => c.FindAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<FilterDefinition<Investor>>(), It.IsAny<FindOptions<Investor, Investor>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => MockCursor(new List<Investor>()).Object);

        _mockMatchesCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<InvestorMatch>>(), It.IsAny<FindOptions<InvestorMatch, InvestorMatch>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => MockCursor(new List<InvestorMatch>()).Object);
        _mockMatchesCollection.Setup(c => c.FindAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<FilterDefinition<InvestorMatch>>(), It.IsAny<FindOptions<InvestorMatch, InvestorMatch>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => MockCursor(new List<InvestorMatch>()).Object);

        _mockCompaniesCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<Companies>>(), It.IsAny<FindOptions<Companies, Companies>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => MockCursor(_companiesDb).Object);
        _mockCompaniesCollection.Setup(c => c.FindAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<FilterDefinition<Companies>>(), It.IsAny<FindOptions<Companies, Companies>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => MockCursor(_companiesDb).Object);

        _mockHoldingsCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<CompanyPortfolioHolding>>(), It.IsAny<FindOptions<CompanyPortfolioHolding, CompanyPortfolioHolding>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => MockCursor(new List<CompanyPortfolioHolding>()).Object);
        _mockHoldingsCollection.Setup(c => c.FindAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<FilterDefinition<CompanyPortfolioHolding>>(), It.IsAny<FindOptions<CompanyPortfolioHolding, CompanyPortfolioHolding>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => MockCursor(new List<CompanyPortfolioHolding>()).Object);

        _mockCapTablesCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<Phase4CapTable>>(), It.IsAny<FindOptions<Phase4CapTable, Phase4CapTable>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => MockCursor(_capTablesDb.OrderByDescending(c => c.Version).ToList()).Object);
        _mockCapTablesCollection.Setup(c => c.FindAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<FilterDefinition<Phase4CapTable>>(), It.IsAny<FindOptions<Phase4CapTable, Phase4CapTable>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => MockCursor(_capTablesDb.OrderByDescending(c => c.Version).ToList()).Object);

        _mockShareIssuancesCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<Phase4ShareIssuance>>(), It.IsAny<FindOptions<Phase4ShareIssuance, Phase4ShareIssuance>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => MockCursor(_issuancesDb).Object);
        _mockShareIssuancesCollection.Setup(c => c.FindAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<FilterDefinition<Phase4ShareIssuance>>(), It.IsAny<FindOptions<Phase4ShareIssuance, Phase4ShareIssuance>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => MockCursor(_issuancesDb).Object);

        _mockOwnershipHistoriesCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<Phase4OwnershipHistory>>(), It.IsAny<FindOptions<Phase4OwnershipHistory, Phase4OwnershipHistory>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => MockCursor(_historyDb).Object);
        _mockOwnershipHistoriesCollection.Setup(c => c.FindAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<FilterDefinition<Phase4OwnershipHistory>>(), It.IsAny<FindOptions<Phase4OwnershipHistory, Phase4OwnershipHistory>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => MockCursor(_historyDb).Object);

        _mockDealExecutionsCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => MockCursor(_dealsDb).Object);
        _mockDealExecutionsCollection.Setup(c => c.FindAsync(It.IsAny<IClientSessionHandle>(), It.IsAny<FilterDefinition<DealExecution>>(), It.IsAny<FindOptions<DealExecution, DealExecution>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => MockCursor(_dealsDb).Object);
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
            mockServiceProvider.Object);
    }

    private static Mock<IAsyncCursor<T>> MockCursor<T>(List<T> list)
    {
        var cursor = new Mock<IAsyncCursor<T>>();
        cursor.Setup(c => c.Current).Returns(list);
        cursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>()))
            .Returns(list.Count > 0)
            .Returns(false);
        cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(list.Count > 0)
            .ReturnsAsync(false);
        return cursor;
    }

    private (Companies company, DealExecution deal) SetupEquityDeal(
        string companyId = "comp-123",
        string investorId = "inv-456",
        double equityPercent = 10.0,
        double amount = 100_000,
        double postValuation = 1_000_000)
    {
        var company = new Companies
        {
            Id = companyId,
            CompanyName = "TechNova",
            TotalShares = 1_000_000,
            EquityStructure = new List<EquityEntryDto>
            {
                new EquityEntryDto
                {
                    StakeholderName = "Alice Founder",
                    Type = "founder",
                    SharesOwned = 1_000_000,
                    VestingMonths = 48
                }
            }
        };
        _companiesDb.Add(company);

        var initialCapTable = new Phase4CapTable
        {
            Id = ObjectId.GenerateNewId().ToString(),
            CompanyId = companyId,
            Version = 1,
            TotalShares = 1_000_000,
            Grants = new List<EquityGrant>
            {
                new EquityGrant
                {
                    GrantId = ObjectId.GenerateNewId().ToString(),
                    StakeholderName = "Alice Founder",
                    StakeholderType = "founder",
                    ShareClass = "common",
                    SharesGranted = 1_000_000,
                    GrantDate = DateTime.UtcNow.AddMonths(-12)
                }
            }
        };
        _capTablesDb.Add(initialCapTable);

        var deal = new DealExecution
        {
            Id = "deal-999",
            CompanyId = companyId,
            Status = Phase9Requirements.DealStatusCompleted,
            ClosedAt = DateTime.UtcNow,
            InvestorNameSnapshot = "Apex Capital",
            Signatures = new DealSignatures
            {
                FounderSignedAt = DateTime.UtcNow,
                FounderSignedByUserId = "founder-user-1",
                InvestorSignedAt = DateTime.UtcNow,
                InvestorSignedByInvestorId = investorId
            },
            TermSheet = new TermSheet
            {
                EquityType = "preferred",
                InvestorEquityPercent = equityPercent,
                TotalRaiseAmount = amount,
                PostMoneyValuation = postValuation
            },
            Investors = new List<DealParticipant>
            {
                new DealParticipant
                {
                    InvestorId = investorId,
                    InvestorName = "Apex Capital",
                    CommittedAmount = amount,
                    EquityPercentage = equityPercent,
                    Status = "confirmed"
                }
            }
        };
        _dealsDb.Add(deal);

        return (company, deal);
    }

    [Fact]
    public async Task EquityClose_AddsInvestorToCapTable()
    {
        var (company, deal) = SetupEquityDeal();
        var service = CreateCompanyService();

        await service.ApplyEquityDealToCapTableAsync(deal, "actor-1");

        var latestCapTable = _capTablesDb.LastOrDefault();
        Assert.NotNull(latestCapTable);
        Assert.Equal(2, latestCapTable.Version);

        var investorGrant = latestCapTable.Grants.FirstOrDefault(g => g.InvestorId == "inv-456");
        Assert.NotNull(investorGrant);
        Assert.Equal("Apex Capital", investorGrant.StakeholderName);
        Assert.Equal("investor", investorGrant.StakeholderType);
        Assert.Equal(100_000, investorGrant.InvestmentAmount);
        Assert.True(investorGrant.SharesGranted > 0);
    }

    [Fact]
    public async Task EquityClose_PortfolioMatchesCapTableOwnership()
    {
        var (company, deal) = SetupEquityDeal(equityPercent: 10.0);
        var service = CreateCompanyService();

        await service.CreateCompanyPortfolioHoldingsForDealAsync(deal, "actor-1");
        await service.ApplyEquityDealToCapTableAsync(deal, "actor-1");

        var holding = _holdingsDb.FirstOrDefault(h => h.DealExecutionId == deal.Id && h.InvestorId == "inv-456");
        Assert.NotNull(holding);
        Assert.Equal(10.0, holding.EquityPercentage);

        var latestCapTable = _capTablesDb.LastOrDefault();
        Assert.NotNull(latestCapTable);
        var grant = latestCapTable.Grants.FirstOrDefault(g => g.InvestorId == "inv-456");
        Assert.NotNull(grant);

        // Dilution: 10% on 1,000,000 pre-shares -> 111,111 new shares out of 1,111,111 total shares = 10.0%
        double capTableInvestorPct = (grant.SharesGranted / (double)latestCapTable.TotalShares) * 100.0;
        Assert.Equal(holding.EquityPercentage.Value, Math.Round(capTableInvestorPct, 1));
    }

    [Fact]
    public async Task EquityClose_PreservesDealExecutionProvenance()
    {
        var (company, deal) = SetupEquityDeal();
        var service = CreateCompanyService();

        await service.ApplyEquityDealToCapTableAsync(deal, "actor-1");

        var latestCapTable = _capTablesDb.LastOrDefault();
        var grant = latestCapTable?.Grants.FirstOrDefault(g => g.InvestorId == "inv-456");
        Assert.NotNull(grant);
        Assert.Equal("deal-999", grant.DealExecutionId);
        Assert.Equal("Investment Deal", grant.Source);

        var issuance = _issuancesDb.FirstOrDefault(si => si.DealExecutionId == deal.Id);
        Assert.NotNull(issuance);
        Assert.Equal(deal.Id, issuance.DealExecutionId);
        Assert.Equal(deal.CompanyId, issuance.CompanyId);

        var history = _historyDb.FirstOrDefault(h => h.DealExecutionId == deal.Id);
        Assert.NotNull(history);
        Assert.Equal(deal.Id, history.DealExecutionId);
    }

    [Fact]
    public async Task EquityClose_PreservesInvestorId()
    {
        var (company, deal) = SetupEquityDeal(investorId: "inv-custom-777");
        var service = CreateCompanyService();

        await service.ApplyEquityDealToCapTableAsync(deal, "actor-1");

        var latestCapTable = _capTablesDb.LastOrDefault();
        var grant = latestCapTable?.Grants.FirstOrDefault(g => g.InvestorId == "inv-custom-777");
        Assert.NotNull(grant);
        Assert.Equal("inv-custom-777", grant.InvestorId);
    }

    [Fact]
    public async Task EquityClose_IdempotentNoDuplicateIssuance()
    {
        var (company, deal) = SetupEquityDeal();
        var service = CreateCompanyService();

        // Run once
        await service.ApplyEquityDealToCapTableAsync(deal, "actor-1");
        var snapshotCount1 = _capTablesDb.Count;
        var issuanceCount1 = _issuancesDb.Count;

        // Run twice (retry)
        await service.ApplyEquityDealToCapTableAsync(deal, "actor-1");
        var snapshotCount2 = _capTablesDb.Count;
        var issuanceCount2 = _issuancesDb.Count;

        Assert.Equal(snapshotCount1, snapshotCount2);
        Assert.Equal(issuanceCount1, issuanceCount2);
    }

    [Fact]
    public async Task EquityClose_CapTableTotals100()
    {
        var (company, deal) = SetupEquityDeal(equityPercent: 15.0);
        var service = CreateCompanyService();

        await service.ApplyEquityDealToCapTableAsync(deal, "actor-1");

        var latestCapTable = _capTablesDb.LastOrDefault();
        Assert.NotNull(latestCapTable);

        double totalPct = latestCapTable.Grants.Sum(g => (g.SharesGranted / (double)latestCapTable.TotalShares) * 100.0);
        Assert.Equal(100.0, Math.Round(totalPct, 1));
    }

    [Fact]
    public async Task EquityClose_UsesExistingDilutionLogic()
    {
        var (company, deal) = SetupEquityDeal(equityPercent: 20.0);
        var service = CreateCompanyService();

        await service.ApplyEquityDealToCapTableAsync(deal, "actor-1");

        var latestCapTable = _capTablesDb.LastOrDefault();
        Assert.NotNull(latestCapTable);

        // Pre-shares: 1,000,000. Investor 20% -> new shares = (20/80) * 1,000,000 = 250,000 shares. Total = 1,250,000.
        var founderGrant = latestCapTable.Grants.FirstOrDefault(g => g.StakeholderType == "founder");
        var investorGrant = latestCapTable.Grants.FirstOrDefault(g => g.StakeholderType == "investor");

        Assert.NotNull(founderGrant);
        Assert.NotNull(investorGrant);
        Assert.Equal(1_000_000, founderGrant.SharesGranted); // Founder keeps all existing shares!
        Assert.Equal(250_000, investorGrant.SharesGranted);
        Assert.Equal(1_250_000, latestCapTable.TotalShares);

        // Founder diluted from 100% to 80% (1,000,000 / 1,250,000)
        double founderPct = (founderGrant.SharesGranted / (double)latestCapTable.TotalShares) * 100.0;
        Assert.Equal(80.0, Math.Round(founderPct, 1));
    }

    [Fact]
    public async Task SecondEquityDeal_SameInvestorAggregatesCorrectly()
    {
        var (company, deal1) = SetupEquityDeal(equityPercent: 10.0);
        var service = CreateCompanyService();

        // Round 1
        await service.ApplyEquityDealToCapTableAsync(deal1, "actor-1");

        // Round 2 with same investor
        var deal2 = new DealExecution
        {
            Id = "deal-888",
            CompanyId = company.Id,
            Status = Phase9Requirements.DealStatusCompleted,
            ClosedAt = DateTime.UtcNow,
            InvestorNameSnapshot = "Apex Capital",
            Signatures = new DealSignatures
            {
                FounderSignedAt = DateTime.UtcNow,
                FounderSignedByUserId = "founder-user-1",
                InvestorSignedAt = DateTime.UtcNow,
                InvestorSignedByInvestorId = "inv-456"
            },
            TermSheet = new TermSheet
            {
                EquityType = "preferred",
                InvestorEquityPercent = 10.0,
                TotalRaiseAmount = 200_000,
                PostMoneyValuation = 2_000_000
            },
            Investors = new List<DealParticipant>
            {
                new DealParticipant
                {
                    InvestorId = "inv-456",
                    InvestorName = "Apex Capital",
                    CommittedAmount = 200_000,
                    EquityPercentage = 10.0,
                    Status = "confirmed"
                }
            }
        };

        await service.ApplyEquityDealToCapTableAsync(deal2, "actor-1");

        var latestCapTable = _capTablesDb.LastOrDefault();
        Assert.NotNull(latestCapTable);
        Assert.Equal(3, latestCapTable.Version);

        var investorGrants = latestCapTable.Grants.Where(g => g.InvestorId == "inv-456").ToList();
        Assert.Equal(2, investorGrants.Count); // Both independent deal issuances preserved!
    }

    [Fact]
    public async Task MultiInvestorEquityDeal_CreatesCorrectOwnershipForEach()
    {
        var (company, deal) = SetupEquityDeal();
        deal.Investors = new List<DealParticipant>
        {
            new DealParticipant
            {
                InvestorId = "inv-A",
                InvestorName = "Investor Alpha",
                CommittedAmount = 60_000,
                EquityPercentage = 6.0,
                Status = "confirmed"
            },
            new DealParticipant
            {
                InvestorId = "inv-B",
                InvestorName = "Investor Beta",
                CommittedAmount = 40_000,
                EquityPercentage = 4.0,
                Status = "confirmed"
            }
        };

        var service = CreateCompanyService();
        await service.ApplyEquityDealToCapTableAsync(deal, "actor-1");

        var latestCapTable = _capTablesDb.LastOrDefault();
        Assert.NotNull(latestCapTable);

        var grantA = latestCapTable.Grants.FirstOrDefault(g => g.InvestorId == "inv-A");
        var grantB = latestCapTable.Grants.FirstOrDefault(g => g.InvestorId == "inv-B");

        Assert.NotNull(grantA);
        Assert.NotNull(grantB);
        Assert.Equal("Investor Alpha", grantA.StakeholderName);
        Assert.Equal("Investor Beta", grantB.StakeholderName);
        Assert.True(grantA.SharesGranted > grantB.SharesGranted);
    }

    [Fact]
    public async Task SafeClose_DoesNotModifyCapTable()
    {
        var (company, deal) = SetupEquityDeal();
        deal.TermSheet.EquityType = "safe";

        var service = CreateCompanyService();
        await service.ApplyEquityDealToCapTableAsync(deal, "actor-1");

        // Version should remain 1 (no mutation)
        var latestCapTable = _capTablesDb.LastOrDefault();
        Assert.Equal(1, latestCapTable?.Version);
        Assert.DoesNotContain(latestCapTable!.Grants, g => g.InvestorId == "inv-456");
    }

    [Fact]
    public async Task ConvertibleClose_DoesNotModifyCapTable()
    {
        var (company, deal) = SetupEquityDeal();
        deal.TermSheet.EquityType = "convertible_note";

        var service = CreateCompanyService();
        await service.ApplyEquityDealToCapTableAsync(deal, "actor-1");

        var latestCapTable = _capTablesDb.LastOrDefault();
        Assert.Equal(1, latestCapTable?.Version);
        Assert.DoesNotContain(latestCapTable!.Grants, g => g.InvestorId == "inv-456");
    }

    [Fact]
    public async Task DebtClose_DoesNotModifyCapTable()
    {
        var (company, deal) = SetupEquityDeal();
        deal.TermSheet.EquityType = "debt";

        var service = CreateCompanyService();
        await service.ApplyEquityDealToCapTableAsync(deal, "actor-1");

        var latestCapTable = _capTablesDb.LastOrDefault();
        Assert.Equal(1, latestCapTable?.Version);
        Assert.DoesNotContain(latestCapTable!.Grants, g => g.InvestorId == "inv-456");
    }

    [Fact]
    public async Task UnsignedDeal_DoesNotModifyCapTable()
    {
        var (company, deal) = SetupEquityDeal();
        deal.Signatures.InvestorSignedAt = null; // Missing investor signature

        var service = CreateCompanyService();
        await service.ApplyEquityDealToCapTableAsync(deal, "actor-1");

        var latestCapTable = _capTablesDb.LastOrDefault();
        Assert.Equal(1, latestCapTable?.Version);
        Assert.DoesNotContain(latestCapTable!.Grants, g => g.InvestorId == "inv-456");
    }

    [Fact]
    public async Task RejectedDeal_DoesNotModifyCapTable()
    {
        var (company, deal) = SetupEquityDeal();
        deal.Status = Phase9Requirements.DealStatusRejected;

        var service = CreateCompanyService();
        await service.ApplyEquityDealToCapTableAsync(deal, "actor-1");

        var latestCapTable = _capTablesDb.LastOrDefault();
        Assert.Equal(1, latestCapTable?.Version);
        Assert.DoesNotContain(latestCapTable!.Grants, g => g.InvestorId == "inv-456");
    }

    [Fact]
    public async Task FailedClose_DoesNotCreatePartialOwnership()
    {
        var (company, deal) = SetupEquityDeal(equityPercent: -5.0); // Invalid negative equity

        var service = CreateCompanyService();
        await service.ApplyEquityDealToCapTableAsync(deal, "actor-1");

        var latestCapTable = _capTablesDb.LastOrDefault();
        Assert.Equal(1, latestCapTable?.Version);
        Assert.DoesNotContain(latestCapTable!.Grants, g => g.InvestorId == "inv-456");
    }

    [Fact]
    public async Task LegacyCompletedEquityDeal_ReconcilesMissingCapTableEntry()
    {
        var (company, deal) = SetupEquityDeal();
        var service = CreateCompanyService();

        // Reconcile
        var processed = await service.ReconcileClosedDealCapTablesAsync(company.Id);

        Assert.Equal(1, processed);
        var latestCapTable = _capTablesDb.LastOrDefault();
        Assert.Equal(2, latestCapTable?.Version);
        Assert.Contains(latestCapTable!.Grants, g => g.InvestorId == "inv-456");
    }

    [Fact]
    public async Task LegacyReconciliation_SkipsExistingEntry()
    {
        var (company, deal) = SetupEquityDeal();
        var service = CreateCompanyService();

        // First apply
        await service.ApplyEquityDealToCapTableAsync(deal, "actor-1");
        var versionAfterFirst = _capTablesDb.Last().Version;

        // Reconcile
        await service.ReconcileClosedDealCapTablesAsync(company.Id);
        var versionAfterReconcile = _capTablesDb.Last().Version;

        Assert.Equal(versionAfterFirst, versionAfterReconcile);
    }

    [Fact]
    public async Task MultiInvestor_10_10_FinalOwnershipIs10_10()
    {
        // Existing shares: 1,000, A = 10%, B = 10%
        var (company, deal) = SetupEquityDeal();
        _capTablesDb[0].TotalShares = 1000;
        _capTablesDb[0].Grants[0].SharesGranted = 1000;

        deal.Investors = new List<DealParticipant>
        {
            new DealParticipant { InvestorId = "inv-A", InvestorName = "Investor A", CommittedAmount = 100_000, EquityPercentage = 10.0, Status = "confirmed" },
            new DealParticipant { InvestorId = "inv-B", InvestorName = "Investor B", CommittedAmount = 100_000, EquityPercentage = 10.0, Status = "confirmed" }
        };

        var service = CreateCompanyService();
        await service.ApplyEquityDealToCapTableAsync(deal, "actor-1");

        var latestCapTable = _capTablesDb.Last();
        // Total = 1,250; Existing = 1,000 (80%), A = 125 (10%), B = 125 (10%)
        Assert.Equal(1250, latestCapTable.TotalShares);

        var grantA = latestCapTable.Grants.FirstOrDefault(g => g.InvestorId == "inv-A");
        var grantB = latestCapTable.Grants.FirstOrDefault(g => g.InvestorId == "inv-B");
        var founderGrant = latestCapTable.Grants.FirstOrDefault(g => g.StakeholderType == "founder");

        Assert.NotNull(grantA);
        Assert.NotNull(grantB);
        Assert.NotNull(founderGrant);

        Assert.Equal(125, grantA.SharesGranted);
        Assert.Equal(125, grantB.SharesGranted);
        Assert.Equal(1000, founderGrant.SharesGranted);

        double pctA = grantA.SharesGranted / (double)latestCapTable.TotalShares * 100.0;
        double pctB = grantB.SharesGranted / (double)latestCapTable.TotalShares * 100.0;
        double pctFounder = founderGrant.SharesGranted / (double)latestCapTable.TotalShares * 100.0;

        Assert.Equal(10.0, Math.Round(pctA, 2));
        Assert.Equal(10.0, Math.Round(pctB, 2));
        Assert.Equal(80.0, Math.Round(pctFounder, 2));
        Assert.Equal(100.0, Math.Round(pctA + pctB + pctFounder, 2));
    }

    [Fact]
    public async Task MultiInvestor_5_15_FinalOwnershipIs5_15()
    {
        // Existing shares: 1,000, A = 5%, B = 15%
        var (company, deal) = SetupEquityDeal();
        _capTablesDb[0].TotalShares = 1000;
        _capTablesDb[0].Grants[0].SharesGranted = 1000;

        deal.Investors = new List<DealParticipant>
        {
            new DealParticipant { InvestorId = "inv-A", InvestorName = "Investor A", CommittedAmount = 50_000, EquityPercentage = 5.0, Status = "confirmed" },
            new DealParticipant { InvestorId = "inv-B", InvestorName = "Investor B", CommittedAmount = 150_000, EquityPercentage = 15.0, Status = "confirmed" }
        };

        var service = CreateCompanyService();
        await service.ApplyEquityDealToCapTableAsync(deal, "actor-1");

        var latestCapTable = _capTablesDb.Last();
        // Total = 1,250; Existing = 1,000 (80%), New = 250
        Assert.Equal(1250, latestCapTable.TotalShares);

        var grantA = latestCapTable.Grants.FirstOrDefault(g => g.InvestorId == "inv-A");
        var grantB = latestCapTable.Grants.FirstOrDefault(g => g.InvestorId == "inv-B");
        var founderGrant = latestCapTable.Grants.FirstOrDefault(g => g.StakeholderType == "founder");

        Assert.NotNull(grantA);
        Assert.NotNull(grantB);
        Assert.NotNull(founderGrant);

        Assert.Equal(250, grantA.SharesGranted + grantB.SharesGranted);
        Assert.Equal(1000, founderGrant.SharesGranted);

        double pctA = grantA.SharesGranted / (double)latestCapTable.TotalShares * 100.0;
        double pctB = grantB.SharesGranted / (double)latestCapTable.TotalShares * 100.0;
        double pctFounder = founderGrant.SharesGranted / (double)latestCapTable.TotalShares * 100.0;

        Assert.InRange(pctA, 4.9, 5.1);
        Assert.InRange(pctB, 14.9, 15.1);
        Assert.Equal(80.0, Math.Round(pctFounder, 2));
        Assert.Equal(100.0, Math.Round(pctA + pctB + pctFounder, 2));
    }

    [Fact]
    public async Task MultiInvestor_ThreeParticipants_FinalTargetsPreserved()
    {
        // Existing shares: 10,000, A = 7.5%, B = 12.5%, C = 5%
        var (company, deal) = SetupEquityDeal();
        _capTablesDb[0].TotalShares = 10000;
        _capTablesDb[0].Grants[0].SharesGranted = 10000;

        deal.Investors = new List<DealParticipant>
        {
            new DealParticipant { InvestorId = "inv-A", InvestorName = "Investor A", CommittedAmount = 75_000, EquityPercentage = 7.5, Status = "confirmed" },
            new DealParticipant { InvestorId = "inv-B", InvestorName = "Investor B", CommittedAmount = 125_000, EquityPercentage = 12.5, Status = "confirmed" },
            new DealParticipant { InvestorId = "inv-C", InvestorName = "Investor C", CommittedAmount = 50_000, EquityPercentage = 5.0, Status = "confirmed" }
        };

        var service = CreateCompanyService();
        await service.ApplyEquityDealToCapTableAsync(deal, "actor-1");

        var latestCapTable = _capTablesDb.Last();
        Assert.Equal(13333, latestCapTable.TotalShares);

        var grantA = latestCapTable.Grants.FirstOrDefault(g => g.InvestorId == "inv-A");
        var grantB = latestCapTable.Grants.FirstOrDefault(g => g.InvestorId == "inv-B");
        var grantC = latestCapTable.Grants.FirstOrDefault(g => g.InvestorId == "inv-C");
        var founderGrant = latestCapTable.Grants.FirstOrDefault(g => g.StakeholderType == "founder");

        Assert.NotNull(grantA);
        Assert.NotNull(grantB);
        Assert.NotNull(grantC);
        Assert.NotNull(founderGrant);

        Assert.Equal(3333, grantA.SharesGranted + grantB.SharesGranted + grantC.SharesGranted);
        Assert.Equal(10000, founderGrant.SharesGranted);

        double pctA = grantA.SharesGranted / (double)latestCapTable.TotalShares * 100.0;
        double pctB = grantB.SharesGranted / (double)latestCapTable.TotalShares * 100.0;
        double pctC = grantC.SharesGranted / (double)latestCapTable.TotalShares * 100.0;
        double pctFounder = founderGrant.SharesGranted / (double)latestCapTable.TotalShares * 100.0;

        Assert.InRange(pctA, 7.4, 7.6);
        Assert.InRange(pctB, 12.4, 12.6);
        Assert.InRange(pctC, 4.9, 5.1);
        Assert.Equal(100.0, Math.Round(pctA + pctB + pctC + pctFounder, 2));
    }

    [Fact]
    public async Task MultiInvestor_OrderIndependent()
    {
        // Setup Run 1: A then B
        var (company1, deal1) = SetupEquityDeal();
        deal1.Investors = new List<DealParticipant>
        {
            new DealParticipant { InvestorId = "inv-A", InvestorName = "Investor A", CommittedAmount = 100_000, EquityPercentage = 10.0, Status = "confirmed" },
            new DealParticipant { InvestorId = "inv-B", InvestorName = "Investor B", CommittedAmount = 100_000, EquityPercentage = 10.0, Status = "confirmed" }
        };
        var service1 = CreateCompanyService();
        await service1.ApplyEquityDealToCapTableAsync(deal1, "actor-1");
        var capTable1 = _capTablesDb.Last();

        var sharesA1 = capTable1.Grants.First(g => g.InvestorId == "inv-A").SharesGranted;
        var sharesB1 = capTable1.Grants.First(g => g.InvestorId == "inv-B").SharesGranted;

        // Reset and Setup Run 2: B then A
        _capTablesDb.Clear();
        _issuancesDb.Clear();
        _historyDb.Clear();
        var (company2, deal2) = SetupEquityDeal();
        deal2.Investors = new List<DealParticipant>
        {
            new DealParticipant { InvestorId = "inv-B", InvestorName = "Investor B", CommittedAmount = 100_000, EquityPercentage = 10.0, Status = "confirmed" },
            new DealParticipant { InvestorId = "inv-A", InvestorName = "Investor A", CommittedAmount = 100_000, EquityPercentage = 10.0, Status = "confirmed" }
        };
        var service2 = CreateCompanyService();
        await service2.ApplyEquityDealToCapTableAsync(deal2, "actor-1");
        var capTable2 = _capTablesDb.Last();

        var sharesA2 = capTable2.Grants.First(g => g.InvestorId == "inv-A").SharesGranted;
        var sharesB2 = capTable2.Grants.First(g => g.InvestorId == "inv-B").SharesGranted;

        // Both runs MUST produce identical allocations
        Assert.Equal(sharesA1, sharesA2);
        Assert.Equal(sharesB1, sharesB2);
        Assert.Equal(capTable1.TotalShares, capTable2.TotalShares);
    }

    [Fact]
    public async Task MultiInvestor_TotalCapTable100()
    {
        var (company, deal) = SetupEquityDeal();
        deal.Investors = new List<DealParticipant>
        {
            new DealParticipant { InvestorId = "inv-A", InvestorName = "Investor A", CommittedAmount = 100_000, EquityPercentage = 12.0, Status = "confirmed" },
            new DealParticipant { InvestorId = "inv-B", InvestorName = "Investor B", CommittedAmount = 80_000, EquityPercentage = 8.0, Status = "confirmed" }
        };
        var service = CreateCompanyService();
        await service.ApplyEquityDealToCapTableAsync(deal, "actor-1");

        var latestCapTable = _capTablesDb.Last();
        double totalPct = latestCapTable.Grants.Sum(g => g.SharesGranted / (double)latestCapTable.TotalShares * 100.0);
        Assert.Equal(100.0, Math.Round(totalPct, 4));
    }

    [Fact]
    public async Task MultiInvestor_ExistingHoldersDilutedProRata()
    {
        var (company, deal) = SetupEquityDeal();
        // 2 founders: F1 = 600,000 (60%), F2 = 400,000 (40%)
        _capTablesDb[0].TotalShares = 1_000_000;
        _capTablesDb[0].Grants = new List<EquityGrant>
        {
            new EquityGrant { GrantId = "g-1", StakeholderName = "Founder 1", StakeholderType = "founder", SharesGranted = 600_000 },
            new EquityGrant { GrantId = "g-2", StakeholderName = "Founder 2", StakeholderType = "founder", SharesGranted = 400_000 }
        };

        deal.Investors = new List<DealParticipant>
        {
            new DealParticipant { InvestorId = "inv-A", InvestorName = "Investor A", CommittedAmount = 100_000, EquityPercentage = 10.0, Status = "confirmed" },
            new DealParticipant { InvestorId = "inv-B", InvestorName = "Investor B", CommittedAmount = 100_000, EquityPercentage = 10.0, Status = "confirmed" }
        };

        var service = CreateCompanyService();
        await service.ApplyEquityDealToCapTableAsync(deal, "actor-1");

        var latestCapTable = _capTablesDb.Last();
        var f1 = latestCapTable.Grants.First(g => g.GrantId == "g-1");
        var f2 = latestCapTable.Grants.First(g => g.GrantId == "g-2");

        // Absolute share counts must NOT change
        Assert.Equal(600_000, f1.SharesGranted);
        Assert.Equal(400_000, f2.SharesGranted);

        // Ratio between founders must remain strictly 60:40 (1.5x)
        double pctF1 = f1.SharesGranted / (double)latestCapTable.TotalShares * 100.0;
        double pctF2 = f2.SharesGranted / (double)latestCapTable.TotalShares * 100.0;

        Assert.Equal(48.0, Math.Round(pctF1, 2)); // 60% of 80% = 48%
        Assert.Equal(32.0, Math.Round(pctF2, 2)); // 40% of 80% = 32%
        Assert.Equal(1.5, Math.Round(pctF1 / pctF2, 4));
    }

    [Fact]
    public async Task MultiInvestor_PortfolioMatchesCapTable()
    {
        var (company, deal) = SetupEquityDeal();
        deal.Investors = new List<DealParticipant>
        {
            new DealParticipant { InvestorId = "inv-A", InvestorName = "Investor A", CommittedAmount = 100_000, EquityPercentage = 10.0, Status = "confirmed" },
            new DealParticipant { InvestorId = "inv-B", InvestorName = "Investor B", CommittedAmount = 100_000, EquityPercentage = 10.0, Status = "confirmed" }
        };

        var service = CreateCompanyService();
        await service.CreateCompanyPortfolioHoldingsForDealAsync(deal, "actor-1");
        await service.ApplyEquityDealToCapTableAsync(deal, "actor-1");

        var latestCapTable = _capTablesDb.Last();
        var holdingA = _holdingsDb.FirstOrDefault(h => h.InvestorId == "inv-A");
        var holdingB = _holdingsDb.FirstOrDefault(h => h.InvestorId == "inv-B");

        Assert.NotNull(holdingA);
        Assert.NotNull(holdingB);

        var grantA = latestCapTable.Grants.First(g => g.InvestorId == "inv-A");
        var grantB = latestCapTable.Grants.First(g => g.InvestorId == "inv-B");

        double capTablePctA = grantA.SharesGranted / (double)latestCapTable.TotalShares * 100.0;
        double capTablePctB = grantB.SharesGranted / (double)latestCapTable.TotalShares * 100.0;

        Assert.Equal(holdingA.EquityPercentage.Value, Math.Round(capTablePctA, 1));
        Assert.Equal(holdingB.EquityPercentage.Value, Math.Round(capTablePctB, 1));
    }

    [Fact]
    public async Task MultiInvestor_ReconcileDoesNotDiluteAgain()
    {
        var (company, deal) = SetupEquityDeal();
        deal.Investors = new List<DealParticipant>
        {
            new DealParticipant { InvestorId = "inv-A", InvestorName = "Investor A", CommittedAmount = 100_000, EquityPercentage = 10.0, Status = "confirmed" },
            new DealParticipant { InvestorId = "inv-B", InvestorName = "Investor B", CommittedAmount = 100_000, EquityPercentage = 10.0, Status = "confirmed" }
        };

        var service = CreateCompanyService();
        await service.ApplyEquityDealToCapTableAsync(deal, "actor-1");

        var totalSharesAfterFirst = _capTablesDb.Last().TotalShares;
        var grantsCountAfterFirst = _capTablesDb.Last().Grants.Count;

        // Reconcile again
        await service.ReconcileClosedDealCapTablesAsync(company.Id);

        var totalSharesAfterReconcile = _capTablesDb.Last().TotalShares;
        var grantsCountAfterReconcile = _capTablesDb.Last().Grants.Count;

        Assert.Equal(totalSharesAfterFirst, totalSharesAfterReconcile);
        Assert.Equal(grantsCountAfterFirst, grantsCountAfterReconcile);
    }

    [Fact]
    public async Task MultiInvestor_InvalidAggregateRejected()
    {
        var (company, deal) = SetupEquityDeal();
        // A = 60%, B = 50% => 110% (impossible aggregate equity)
        deal.Investors = new List<DealParticipant>
        {
            new DealParticipant { InvestorId = "inv-A", InvestorName = "Investor A", CommittedAmount = 600_000, EquityPercentage = 60.0, Status = "confirmed" },
            new DealParticipant { InvestorId = "inv-B", InvestorName = "Investor B", CommittedAmount = 500_000, EquityPercentage = 50.0, Status = "confirmed" }
        };

        var service = CreateCompanyService();
        await service.ApplyEquityDealToCapTableAsync(deal, "actor-1");

        // Cap table should NOT be corrupted / no new version created
        var latestCapTable = _capTablesDb.Last();
        Assert.Equal(1, latestCapTable.Version);
        Assert.DoesNotContain(latestCapTable.Grants, g => g.InvestorId == "inv-A" || g.InvestorId == "inv-B");
    }
}
