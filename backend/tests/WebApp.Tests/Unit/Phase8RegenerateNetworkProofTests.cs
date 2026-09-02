using FluentAssertions;
using MongoDB.Driver;
using Moq;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

public class Phase8RegenerateNetworkProofTests
{
    private readonly Mock<MongoDbContext> _mockDb;
    private readonly Mock<IMongoCollection<Companies>> _companiesColl;
    private readonly Mock<IMongoCollection<InvestorMatch>> _matchesColl;
    private readonly Mock<IMongoCollection<DealExecution>> _dealsColl;
    private readonly Mock<IInvestorMatcher> _mockMatcher;
    private readonly CompanyService _service;

    private readonly List<InvestorMatch> _matchesDb = new();
    private readonly List<DealExecution> _dealsDb = new();

    public Phase8RegenerateNetworkProofTests()
    {
        _mockDb = new Mock<MongoDbContext>(
            new MongoClient("mongodb://localhost:27017").GetDatabase("mondial_test"));
        _companiesColl = new Mock<IMongoCollection<Companies>>();
        _matchesColl = new Mock<IMongoCollection<InvestorMatch>>();
        _dealsColl = new Mock<IMongoCollection<DealExecution>>();

        _mockDb.Setup(d => d.Companies).Returns(_companiesColl.Object);
        _mockDb.Setup(d => d.InvestorMatches).Returns(_matchesColl.Object);
        _mockDb.Setup(d => d.DealExecutions).Returns(_dealsColl.Object);

        _mockMatcher = new Mock<IInvestorMatcher>();

        _service = new CompanyService(
            _mockDb.Object,
            new Mock<IValuationEngine>().Object,
            new Mock<ICapTableCalculator>().Object,
            _mockMatcher.Object,
            new Mock<IAiReviewEngine>().Object,
            new Mock<IDocumentManager>().Object,
            new Mock<IPhaseValidator>().Object,
            new Mock<IDealEventPublisher>().Object);
    }

    [Fact]
    public async Task Phase8_Regenerate_UpdatesMatches_AndDoesNotCreateDeals()
    {
        // ARRANGE: Company in Phase 8 with fresh AI readiness
        var now = DateTime.UtcNow;
        var company = new Companies
        {
            Id = "comp-p8-network-proof",
            OwnerId = "owner-p8",
            CompanyName = "Proof Co",
            CurrentPhase = 8,
            CompletedPhases = new List<int> { 1, 2, 3, 4, 5, 6, 7 },
            LastAiReviewAt = now,
            DataRoomLastMaterialChangeAt = now.AddDays(-1),
            AiReview = new AiReviewResponse
            {
                OverallScore = 88,
                InvestorReadyBadge = true,
                ReviewedAt = now,
            },
            IsInvestorReady = true,
        };

        // Existing match prior to regenerate
        _matchesDb.Add(new InvestorMatch
        {
            Id = "match-old-1",
            CompanyId = company.Id,
            InvestorId = "inv-1",
            MatchScore = 70,
            MatchRationale = "Initial match",
            EngineVersion = InvestorMatcher.EngineVersion,
            Status = "new",
        });

        // Setup MongoDB Cursor mocks
        var compCursor = new Mock<IAsyncCursor<Companies>>();
        compCursor.Setup(c => c.Current).Returns(new[] { company });
        compCursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true).ReturnsAsync(false);
        _companiesColl.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<Companies>>(),
                It.IsAny<FindOptions<Companies, Companies>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(compCursor.Object);

        var matchesCursor = new Mock<IAsyncCursor<InvestorMatch>>();
        matchesCursor.Setup(c => c.Current).Returns(_matchesDb);
        matchesCursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true).ReturnsAsync(false);
        _matchesColl.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<InvestorMatch>>(),
                It.IsAny<FindOptions<InvestorMatch, InvestorMatch>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(matchesCursor.Object);

        var dealsCursor = new Mock<IAsyncCursor<DealExecution>>();
        dealsCursor.Setup(c => c.Current).Returns(_dealsDb);
        dealsCursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true).ReturnsAsync(false);
        _dealsColl.Setup(d => d.FindAsync(
                It.IsAny<FilterDefinition<DealExecution>>(),
                It.IsAny<FindOptions<DealExecution, DealExecution>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(dealsCursor.Object);

        _mockMatcher.Setup(m => m.FindMatchesAsync(It.IsAny<Companies>(), It.IsAny<List<string>>()))
            .Callback<Companies, List<string>>((co, pool) =>
            {
                _matchesDb.Clear();
                _matchesDb.Add(new InvestorMatch
                {
                    Id = "match-new-1",
                    CompanyId = co.Id,
                    InvestorId = "inv-1",
                    MatchScore = 92,
                    MatchRationale = "Regenerated fit",
                    EngineVersion = InvestorMatcher.EngineVersion,
                    Status = "new",
                });
                _matchesDb.Add(new InvestorMatch
                {
                    Id = "match-new-2",
                    CompanyId = co.Id,
                    InvestorId = "inv-2",
                    MatchScore = 85,
                    MatchRationale = "Regenerated fit 2",
                    EngineVersion = InvestorMatcher.EngineVersion,
                    Status = "new",
                });
            })
            .ReturnsAsync(() => _matchesDb);

        // Record counts BEFORE
        var dealsCountBefore = _dealsDb.Count;
        var matchesCountBefore = _matchesDb.Count;

        dealsCountBefore.Should().Be(0);
        matchesCountBefore.Should().Be(1);

        // ACT: Execute RegenerateInvestorMatchesAsync
        var result = await _service.RegenerateInvestorMatchesAsync(company.Id);

        // Record counts AFTER
        var dealsCountAfter = _dealsDb.Count;
        var matchesCountAfter = result.Count;

        // ASSERT: Strict invariants
        _mockMatcher.Verify(m => m.FindMatchesAsync(It.Is<Companies>(c => c.Id == company.Id), null), Times.Once);
        _dealsColl.Verify(d => d.InsertOneAsync(It.IsAny<DealExecution>(), It.IsAny<InsertOneOptions>(), It.IsAny<CancellationToken>()), Times.Never);

        dealsCountAfter.Should().Be(0, "Regenerate must NEVER create or modify DealExecution rows");
        dealsCountAfter.Should().Be(dealsCountBefore);
        matchesCountAfter.Should().Be(2);
    }
}
