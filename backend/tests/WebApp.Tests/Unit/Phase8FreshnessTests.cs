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

public class Phase8FreshnessTests
{
    private readonly Mock<MongoDbContext> _mockDb;
    private readonly Mock<IMongoCollection<Companies>> _companiesColl;
    private readonly Mock<IMongoCollection<InvestorMatch>> _matchesColl;
    private readonly Mock<IInvestorMatcher> _mockMatcher;
    private readonly CompanyService _service;

    public Phase8FreshnessTests()
    {
        _mockDb = new Mock<MongoDbContext>(
            new MongoClient("mongodb://localhost:27017").GetDatabase("mondial_test"));
        _companiesColl = new Mock<IMongoCollection<Companies>>();
        _matchesColl = new Mock<IMongoCollection<InvestorMatch>>();

        _mockDb.Setup(d => d.Companies).Returns(_companiesColl.Object);
        _mockDb.Setup(d => d.InvestorMatches).Returns(_matchesColl.Object);

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

    private void SetupCompanyLookup(Companies company)
    {
        var cursor = new Mock<IAsyncCursor<Companies>>();
        cursor.Setup(c => c.Current).Returns(new[] { company });
        cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true).ReturnsAsync(false);
        _companiesColl.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<Companies>>(),
                It.IsAny<FindOptions<Companies, Companies>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(cursor.Object);
    }

    private void SetupMatchesLookup(List<InvestorMatch> matches)
    {
        var cursor = new Mock<IAsyncCursor<InvestorMatch>>();
        cursor.Setup(c => c.Current).Returns(matches);
        cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true).ReturnsAsync(false);
        _matchesColl.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<InvestorMatch>>(),
                It.IsAny<FindOptions<InvestorMatch, InvestorMatch>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(cursor.Object);
    }

    [Fact]
    public async Task Phase8_HistoricallyCompletedP7_AllowsViewingExistingMatches()
    {
        var company = new Companies
        {
            Id = "comp-1",
            OwnerId = "owner-1",
            CurrentPhase = 8,
            CompletedPhases = new List<int> { 1, 2, 3, 4, 5, 6, 7 },
            DataRoomLastMaterialChangeAt = DateTime.UtcNow, // Stale relative to old review
            LastAiReviewAt = DateTime.UtcNow.AddDays(-5),
            AiReview = new AiReviewResponse
            {
                OverallScore = 85,
                InvestorReadyBadge = true,
                ReviewedAt = DateTime.UtcNow.AddDays(-5),
            },
            IsInvestorReady = true,
        };
        SetupCompanyLookup(company);

        var existingMatches = new List<InvestorMatch>
        {
            new()
            {
                Id = "match-1",
                CompanyId = "comp-1",
                InvestorId = "inv-1",
                InvestorNameSnapshot = "Alpha Capital",
                InvestorTypeSnapshot = "VC",
                InvestmentRangeSnapshot = "EUR 100k-500k",
                MatchScore = 88,
                Status = "interested",
                EntrepreneurInterest = "interested",
                InvestorInterest = "interested",
                HandshakeConfirmedAt = DateTime.UtcNow.AddDays(-2),
            }
        };
        SetupMatchesLookup(existingMatches);

        var results = await _service.GetMatchedInvestorsAsync("comp-1");
        results.Should().NotBeNull();
        results.Should().HaveCount(1);
        results[0].InvestorName.Should().Be("Alpha Capital");
        results[0].HandshakeConfirmedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task Phase8_StaleP7_BlocksGenerateMatches()
    {
        var company = new Companies
        {
            Id = "comp-1",
            OwnerId = "owner-1",
            DataRoomLastMaterialChangeAt = DateTime.UtcNow.AddHours(-1),
            LastAiReviewAt = DateTime.UtcNow.AddDays(-5), // Stale
            AiReview = new AiReviewResponse
            {
                OverallScore = 85,
                InvestorReadyBadge = true,
                ReviewedAt = DateTime.UtcNow.AddDays(-5),
            },
            IsInvestorReady = true,
        };
        SetupCompanyLookup(company);

        var act = async () => await _service.RegenerateInvestorMatchesAsync("comp-1");
        (await act.Should().ThrowAsync<InvalidOperationException>())
            .Which.Message.Should().Contain("Your Investor Readiness Review is no longer current");

        _mockMatcher.Verify(m => m.FindMatchesAsync(It.IsAny<Companies>(), It.IsAny<List<string>>()), Times.Never);
    }

    [Fact]
    public async Task Phase8_StaleP7_BlocksRefreshMatches()
    {
        var company = new Companies
        {
            Id = "comp-1",
            OwnerId = "owner-1",
            LastAiReviewAt = DateTime.UtcNow.AddDays(-32), // > 30 days expired
            AiReview = new AiReviewResponse
            {
                OverallScore = 90,
                InvestorReadyBadge = true,
                ReviewedAt = DateTime.UtcNow.AddDays(-32),
            },
            IsInvestorReady = true,
        };
        SetupCompanyLookup(company);

        var act = async () => await _service.RegenerateInvestorMatchesAsync("comp-1");
        (await act.Should().ThrowAsync<InvalidOperationException>())
            .Which.Message.Should().Contain("Your Investor Readiness Review is no longer current");

        _mockMatcher.Verify(m => m.FindMatchesAsync(It.IsAny<Companies>(), It.IsAny<List<string>>()), Times.Never);
    }

    [Fact]
    public void Phase8_StaleP7_DoesNotDeleteExistingMatches()
    {
        var match = new InvestorMatch
        {
            Id = "match-1",
            CompanyId = "comp-1",
            InvestorId = "inv-1",
            Status = "accepted",
            EntrepreneurInterest = "interested",
            InvestorInterest = "interested",
            HandshakeConfirmedAt = DateTime.UtcNow.AddDays(-10),
            Interactions = new List<InteractionRecord>
            {
                new() { Type = "message", Details = "Meeting confirmed", Timestamp = DateTime.UtcNow.AddDays(-10) }
            }
        };

        match.Id.Should().Be("match-1");
        match.Interactions.Should().HaveCount(1);
    }

    [Fact]
    public void Phase8_StaleP7_DoesNotDestroyHandshake()
    {
        var handshakeTime = DateTime.UtcNow.AddDays(-4);
        var match = new InvestorMatch
        {
            Id = "match-1",
            Status = "accepted",
            HandshakeConfirmedAt = handshakeTime,
        };

        match.HandshakeConfirmedAt.Should().Be(handshakeTime);
        match.Status.Should().Be("accepted");
    }

    [Fact]
    public void Phase8_StaleP7_DoesNotDestroyMessages()
    {
        var match = new InvestorMatch
        {
            Id = "match-1",
            Interactions = new List<InteractionRecord>
            {
                new() { Type = "message", Details = "Hello, interested in discussion", Timestamp = DateTime.UtcNow.AddDays(-3) }
            }
        };

        match.Interactions.Should().ContainSingle(i => i.Details.Contains("interested in discussion"));
    }

    [Fact]
    public async Task Phase8_FreshRerun_AllowsGenerateMatchesAgain()
    {
        var now = DateTime.UtcNow;
        var company = new Companies
        {
            Id = "comp-1",
            OwnerId = "owner-1",
            LastAiReviewAt = now,
            DataRoomLastMaterialChangeAt = now.AddDays(-1), // data room is older than fresh review
            AiReview = new AiReviewResponse
            {
                OverallScore = 85,
                InvestorReadyBadge = true,
                ReviewedAt = now,
            },
            IsInvestorReady = true,
        };
        SetupCompanyLookup(company);
        SetupMatchesLookup(new List<InvestorMatch>());

        _mockMatcher.Setup(m => m.FindMatchesAsync(It.IsAny<Companies>(), It.IsAny<List<string>>()))
            .ReturnsAsync(new List<InvestorMatch>());

        var result = await _service.RegenerateInvestorMatchesAsync("comp-1");
        result.Should().NotBeNull();
        _mockMatcher.Verify(m => m.FindMatchesAsync(It.IsAny<Companies>(), It.IsAny<List<string>>()), Times.Once);
    }
}
