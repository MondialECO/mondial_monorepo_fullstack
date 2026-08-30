using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using MongoDB.Driver;
using Moq;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using Xunit;

namespace WebApp.Tests.Unit;

public class EntrepreneurPhase8ToPhase10ProgressionTests
{
    private readonly Mock<MongoDbContext> _mockDbContext;
    private readonly Mock<IMongoCollection<Companies>> _mockCompaniesCollection;
    private readonly Mock<IMongoCollection<DealExecution>> _mockDealsCollection;
    private readonly Mock<IMongoCollection<InvestorMatch>> _mockMatchesCollection;
    private readonly Mock<IMongoCollection<CompanyPortfolioHolding>> _mockHoldingsCollection;
    private readonly Mock<IMongoCollection<Phase4CapTable>> _mockCapTablesCollection;
    private readonly Mock<IPhaseValidator> _mockValidator;
    private readonly List<Companies> _companiesDb = new();
    private readonly List<DealExecution> _dealsDb = new();
    private readonly List<CompanyPortfolioHolding> _holdingsDb = new();
    private readonly List<Phase4CapTable> _capTablesDb = new();

    public EntrepreneurPhase8ToPhase10ProgressionTests()
    {
        _mockDbContext = new Mock<MongoDbContext>(
            new MongoClient("mongodb://localhost:27017").GetDatabase("mondial_test"));
        _mockCompaniesCollection = new Mock<IMongoCollection<Companies>>();
        _mockDealsCollection = new Mock<IMongoCollection<DealExecution>>();
        _mockMatchesCollection = new Mock<IMongoCollection<InvestorMatch>>();
        _mockHoldingsCollection = new Mock<IMongoCollection<CompanyPortfolioHolding>>();
        _mockCapTablesCollection = new Mock<IMongoCollection<Phase4CapTable>>();
        _mockValidator = new Mock<IPhaseValidator>();

        _mockDbContext.Setup(d => d.Companies).Returns(_mockCompaniesCollection.Object);
        _mockDbContext.Setup(d => d.DealExecutions).Returns(_mockDealsCollection.Object);
        _mockDbContext.Setup(d => d.InvestorMatches).Returns(_mockMatchesCollection.Object);
        _mockDbContext.Setup(d => d.CompanyPortfolioHoldings).Returns(_mockHoldingsCollection.Object);
        _mockDbContext.Setup(d => d.Phase4CapTables).Returns(_mockCapTablesCollection.Object);

        // Setup Companies find/replace
        _mockCompaniesCollection.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<Companies>>(),
                It.IsAny<FindOptions<Companies, Companies>>(),
                default))
            .ReturnsAsync((FilterDefinition<Companies> f, FindOptions<Companies, Companies> _, CancellationToken _) =>
            {
                var cursor = new Mock<IAsyncCursor<Companies>>();
                cursor.Setup(x => x.Current).Returns(_companiesDb);
                cursor.SetupSequence(x => x.MoveNextAsync(It.IsAny<CancellationToken>()))
                    .ReturnsAsync(true).ReturnsAsync(false);
                return cursor.Object;
            });

        _mockCompaniesCollection.Setup(c => c.ReplaceOneAsync(
                It.IsAny<FilterDefinition<Companies>>(),
                It.IsAny<Companies>(),
                It.IsAny<ReplaceOptions>(),
                default))
            .Callback<FilterDefinition<Companies>, Companies, ReplaceOptions, CancellationToken>((_, updated, _, _) =>
            {
                var idx = _companiesDb.FindIndex(x => x.Id == updated.Id);
                if (idx >= 0) _companiesDb[idx] = updated;
                else _companiesDb.Add(updated);
            })
            .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));

        // Setup Holdings insertion
        _mockHoldingsCollection.Setup(c => c.InsertOneAsync(
                It.IsAny<CompanyPortfolioHolding>(),
                null,
                default))
            .Callback<CompanyPortfolioHolding, InsertOneOptions, CancellationToken>((h, _, _) => _holdingsDb.Add(h))
            .Returns(Task.CompletedTask);

        // Setup CapTables find/replace
        _mockCapTablesCollection.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<Phase4CapTable>>(),
                It.IsAny<FindOptions<Phase4CapTable, Phase4CapTable>>(),
                default))
            .ReturnsAsync((FilterDefinition<Phase4CapTable> f, FindOptions<Phase4CapTable, Phase4CapTable> _, CancellationToken _) =>
            {
                var cursor = new Mock<IAsyncCursor<Phase4CapTable>>();
                cursor.Setup(x => x.Current).Returns(_capTablesDb);
                cursor.SetupSequence(x => x.MoveNextAsync(It.IsAny<CancellationToken>()))
                    .ReturnsAsync(true).ReturnsAsync(false);
                return cursor.Object;
            });

        _mockCapTablesCollection.Setup(c => c.ReplaceOneAsync(
                It.IsAny<FilterDefinition<Phase4CapTable>>(),
                It.IsAny<Phase4CapTable>(),
                It.IsAny<ReplaceOptions>(),
                default))
            .Callback<FilterDefinition<Phase4CapTable>, Phase4CapTable, ReplaceOptions, CancellationToken>((_, updated, _, _) =>
            {
                var idx = _capTablesDb.FindIndex(x => x.Id == updated.Id);
                if (idx >= 0) _capTablesDb[idx] = updated;
                else _capTablesDb.Add(updated);
            })
            .ReturnsAsync(new ReplaceOneResult.Acknowledged(1, 1, null));
    }

    private CompanyService CreateService()
    {
        var mockValuation = new Mock<IValuationEngine>();
        var mockCapTable = new Mock<ICapTableCalculator>();
        var mockMatcher = new Mock<IInvestorMatcher>();
        var mockAiReview = new Mock<IAiReviewEngine>();
        var mockDocMgr = new Mock<IDocumentManager>();
        var mockEvents = new Mock<IDealEventPublisher>();
        var mockServiceProvider = new Mock<IServiceProvider>();

        return new CompanyService(
            _mockDbContext.Object,
            mockValuation.Object,
            mockCapTable.Object,
            mockMatcher.Object,
            mockAiReview.Object,
            mockDocMgr.Object,
            _mockValidator.Object,
            mockEvents.Object,
            null,
            mockServiceProvider.Object
        );
    }

    [Fact]
    public async Task Phase8_Complete_SetsCurrentPhase9()
    {
        var company = new Companies
        {
            Id = "comp-p8-1",
            OwnerId = "user-1",
            CurrentPhase = 8,
            CompletedPhases = new List<int> { 2, 3, 4, 5, 6, 7 },
        };
        _companiesDb.Clear();
        _companiesDb.Add(company);

        _mockValidator.Setup(v => v.ValidatePhase8Async(It.IsAny<Companies>()))
            .ReturnsAsync((true, new List<string>()));

        var service = CreateService();
        var progress = await service.AdvancePhaseAsync("comp-p8-1", 8, new { });

        progress.CurrentPhase.Should().Be(9);
        company.CurrentPhase.Should().Be(9);
    }

    [Fact]
    public async Task Phase8_Complete_AddsOnlyPhase8ToCompleted()
    {
        var company = new Companies
        {
            Id = "comp-p8-2",
            OwnerId = "user-1",
            CurrentPhase = 8,
            CompletedPhases = new List<int> { 2, 3, 4, 5, 6, 7 },
        };
        _companiesDb.Clear();
        _companiesDb.Add(company);

        _mockValidator.Setup(v => v.ValidatePhase8Async(It.IsAny<Companies>()))
            .ReturnsAsync((true, new List<string>()));

        var service = CreateService();
        var progress = await service.AdvancePhaseAsync("comp-p8-2", 8, new { });

        progress.CompletedPhases.Should().Contain(8);
        progress.CompletedPhases.Should().NotContain(9);
        progress.CompletedPhases.Should().NotContain(10);
        company.CompletedPhases.Should().BeEquivalentTo(new[] { 2, 3, 4, 5, 6, 7, 8 });
    }

    [Fact]
    public async Task Phase8_Complete_DoesNotAutoCompletePhase9()
    {
        var company = new Companies
        {
            Id = "comp-p8-3",
            OwnerId = "user-1",
            CurrentPhase = 8,
            CompletedPhases = new List<int> { 2, 3, 4, 5, 6, 7 },
        };
        _companiesDb.Clear();
        _companiesDb.Add(company);

        _mockValidator.Setup(v => v.ValidatePhase8Async(It.IsAny<Companies>()))
            .ReturnsAsync((true, new List<string>()));

        var service = CreateService();
        var progress = await service.AdvancePhaseAsync("comp-p8-3", 8, new { });

        progress.CompletedPhases.Should().NotContain(9);
        progress.CurrentPhase.Should().NotBe(10);
    }

    [Fact]
    public async Task Phase8_Complete_DoesNotEnterPhase10()
    {
        var company = new Companies
        {
            Id = "comp-p8-4",
            OwnerId = "user-1",
            CurrentPhase = 8,
            CompletedPhases = new List<int> { 2, 3, 4, 5, 6, 7 },
        };
        _companiesDb.Clear();
        _companiesDb.Add(company);

        _mockValidator.Setup(v => v.ValidatePhase8Async(It.IsAny<Companies>()))
            .ReturnsAsync((true, new List<string>()));

        var service = CreateService();
        var progress = await service.AdvancePhaseAsync("comp-p8-4", 8, new { });

        progress.CurrentPhase.Should().Be(9);
    }

    [Fact]
    public async Task Phase8_RepeatedAdvance_DoesNotCorruptProgress()
    {
        var company = new Companies
        {
            Id = "comp-p8-5",
            OwnerId = "user-1",
            CurrentPhase = 9,
            CompletedPhases = new List<int> { 2, 3, 4, 5, 6, 7, 8 },
        };
        _companiesDb.Clear();
        _companiesDb.Add(company);

        var service = CreateService();
        // Trying to advance phase 8 when currentPhase is 9 must throw InvalidOperationException
        var act = () => service.AdvancePhaseAsync("comp-p8-5", 8, new { });
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Current phase is 9*");

        company.CurrentPhase.Should().Be(9);
        company.CompletedPhases.Should().BeEquivalentTo(new[] { 2, 3, 4, 5, 6, 7, 8 });
    }

    [Fact]
    public async Task Phase9_SignedDeal_DoesNotCompletePhase()
    {
        var validator = new PhaseValidator(_mockDbContext.Object);
        var deals = new List<DealExecution>
        {
            new()
            {
                Id = "deal-signed-1",
                CompanyId = "comp-p9-1",
                Status = "signed",
                Investors = new List<DealParticipant> { new() { InvestorId = "inv-1", Status = "interested" } },
                TermSheet = new TermSheet { Status = "signed" },
            }
        };

        var cursor = new Mock<IAsyncCursor<DealExecution>>();
        cursor.Setup(c => c.Current).Returns(deals);
        cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true).ReturnsAsync(false);
        _mockDealsCollection.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<DealExecution>>(),
                It.IsAny<FindOptions<DealExecution, DealExecution>>(),
                default))
            .ReturnsAsync(cursor.Object);

        var (isValid, errors) = await validator.ValidatePhase9Async(new Companies { Id = "comp-p9-1" });
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("terminal success state"));
    }

    [Fact]
    public async Task Phase9_SignedDeal_KeepsCurrentPhase9()
    {
        var company = new Companies
        {
            Id = "comp-p9-2",
            OwnerId = "user-1",
            CurrentPhase = 9,
            CompletedPhases = new List<int> { 2, 3, 4, 5, 6, 7, 8 },
        };
        _companiesDb.Clear();
        _companiesDb.Add(company);

        _mockValidator.Setup(v => v.ValidatePhase9Async(It.IsAny<Companies>()))
            .ReturnsAsync((false, new List<string> { "At least one deal must be in a terminal success state (completed)" }));

        var service = CreateService();
        var act = () => service.AdvancePhaseAsync("comp-p9-2", 9, new { });
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*terminal success state*");

        company.CurrentPhase.Should().Be(9);
        company.CompletedPhases.Should().NotContain(9);
    }

    [Fact]
    public async Task Phase9_CompletedDeal_AllowsCompletion()
    {
        var validator = new PhaseValidator(_mockDbContext.Object);
        var deals = new List<DealExecution>
        {
            new()
            {
                Id = "deal-completed-1",
                CompanyId = "comp-p9-3",
                Status = "completed",
                Investors = new List<DealParticipant> { new() { InvestorId = "inv-1", Status = "funded" } },
                TermSheet = new TermSheet { Status = "signed" },
            }
        };

        var cursor = new Mock<IAsyncCursor<DealExecution>>();
        cursor.Setup(c => c.Current).Returns(deals);
        cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true).ReturnsAsync(false);
        _mockDealsCollection.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<DealExecution>>(),
                It.IsAny<FindOptions<DealExecution, DealExecution>>(),
                default))
            .ReturnsAsync(cursor.Object);

        var (isValid, errors) = await validator.ValidatePhase9Async(new Companies { Id = "comp-p9-3" });
        isValid.Should().BeTrue();
        errors.Should().BeEmpty();
    }

    [Fact]
    public async Task Phase9_CompletedDeal_SetsCurrentPhase10()
    {
        var company = new Companies
        {
            Id = "comp-p9-4",
            OwnerId = "user-1",
            CurrentPhase = 9,
            CompletedPhases = new List<int> { 2, 3, 4, 5, 6, 7, 8 },
        };
        _companiesDb.Clear();
        _companiesDb.Add(company);

        _mockValidator.Setup(v => v.ValidatePhase9Async(It.IsAny<Companies>()))
            .ReturnsAsync((true, new List<string>()));

        var service = CreateService();
        var progress = await service.AdvancePhaseAsync("comp-p9-4", 9, new { });

        progress.CurrentPhase.Should().Be(10);
        company.CurrentPhase.Should().Be(10);
    }

    [Fact]
    public async Task Phase9_CompletedDeal_AddsPhase9ToCompleted()
    {
        var company = new Companies
        {
            Id = "comp-p9-5",
            OwnerId = "user-1",
            CurrentPhase = 9,
            CompletedPhases = new List<int> { 2, 3, 4, 5, 6, 7, 8 },
        };
        _companiesDb.Clear();
        _companiesDb.Add(company);

        _mockValidator.Setup(v => v.ValidatePhase9Async(It.IsAny<Companies>()))
            .ReturnsAsync((true, new List<string>()));

        var service = CreateService();
        var progress = await service.AdvancePhaseAsync("comp-p9-5", 9, new { });

        progress.CompletedPhases.Should().Contain(9);
        company.CompletedPhases.Should().BeEquivalentTo(new[] { 2, 3, 4, 5, 6, 7, 8, 9 });
    }
}
