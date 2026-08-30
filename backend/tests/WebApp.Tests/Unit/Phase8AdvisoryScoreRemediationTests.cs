using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using Moq;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Services;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

public class Phase8AdvisoryScoreRemediationTests
{
    private readonly Mock<MongoDbContext> _mockDb;
    private readonly Mock<IMongoCollection<InvestorMatch>> _matchesColl;
    private readonly Mock<IMongoCollection<Investor>> _investorsColl;
    private readonly Mock<IInvestorService> _mockInvestorService;
    private readonly Mock<ILogger<InvestorMatcher>> _mockLogger;
    private readonly InvestorMatcher _matcher;
    private readonly PhaseValidator _validator;
    private readonly List<InvestorMatch> _matchesDb = new();
    private readonly List<Investor> _investorsDb = new();

    public Phase8AdvisoryScoreRemediationTests()
    {
        _mockDb = new Mock<MongoDbContext>(
            new MongoClient("mongodb://localhost:27017").GetDatabase("mondial_test"));
        _matchesColl = new Mock<IMongoCollection<InvestorMatch>>();
        _investorsColl = new Mock<IMongoCollection<Investor>>();
        _mockInvestorService = new Mock<IInvestorService>();
        _mockLogger = new Mock<ILogger<InvestorMatcher>>();

        _mockDb.Setup(d => d.InvestorMatches).Returns(_matchesColl.Object);
        _mockDb.Setup(d => d.Investors).Returns(_investorsColl.Object);

        _matchesColl.Setup(c => c.InsertOneAsync(
                It.IsAny<InvestorMatch>(),
                It.IsAny<InsertOneOptions>(),
                It.IsAny<CancellationToken>()))
            .Callback<InvestorMatch, InsertOneOptions, CancellationToken>((m, _, _) => _matchesDb.Add(m))
            .Returns(Task.CompletedTask);

        _matchesColl.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<InvestorMatch>>(),
                It.IsAny<FindOptions<InvestorMatch, InvestorMatch>>(),
                It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                var cursor = new Mock<IAsyncCursor<InvestorMatch>>();
                cursor.Setup(c => c.Current).Returns(_matchesDb);
                cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
                    .ReturnsAsync(_matchesDb.Count > 0).ReturnsAsync(false);
                return Task.FromResult(cursor.Object);
            });

        _investorsColl.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<Investor>>(),
                It.IsAny<FindOptions<Investor, Investor>>(),
                It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                var cursor = new Mock<IAsyncCursor<Investor>>();
                cursor.Setup(c => c.Current).Returns(_investorsDb);
                cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
                    .ReturnsAsync(_investorsDb.Count > 0).ReturnsAsync(false);
                return Task.FromResult(cursor.Object);
            });

        _matcher = new InvestorMatcher(_mockDb.Object, _mockInvestorService.Object, _mockLogger.Object);
        _validator = new PhaseValidator(_mockDb.Object);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(20)]
    [InlineData(39)]
    [InlineData(40)]
    [InlineData(100)]
    public async Task Phase8_MatchScore_CanPersistAndIsValidAdvisoryScore(int targetScore)
    {
        var company = new Companies
        {
            Id = "comp-score-test",
            Industry = "fintech",
            FundingRoundType = "seed",
            FundingAskAmount = 1_000_000,
            Country = "France",
            ShareType = "preferred",
        };

        var investor = new Investor
        {
            Id = $"inv-{targetScore}",
            Name = $"Investor {targetScore}",
            PreferredSectors = targetScore > 20 ? new List<string> { "fintech" } : new List<string> { "biotech" },
            PreferredStages = targetScore > 30 ? new List<string> { "seed" } : new List<string> { "series_b" },
            MinCheckSize = 500_000,
            MaxCheckSize = 2_000_000,
            PreferredGeographies = new List<string> { "France" },
        };

        _mockInvestorService.Setup(s => s.GetInvestorAsync(investor.Id))
            .ReturnsAsync(investor);

        var matches = await _matcher.FindMatchesAsync(company, new List<string> { investor.Id });

        matches.Should().HaveCount(1);
        matches[0].InvestorId.Should().Be(investor.Id);
        matches[0].MatchScore.Should().BeInRange(0, 100);
        _matchesDb.Should().Contain(m => m.InvestorId == investor.Id);
    }

    [Fact]
    public async Task Phase8_AllLowScoreScenario_ReturnsAndRanksAllCandidatesAndCanComplete()
    {
        // 4 real eligible investors with varying low scores (e.g. 12, 24, 31, 39)
        var company = new Companies
        {
            Id = "comp-all-low",
            Industry = "robotics",
            FundingRoundType = "pre_seed",
            FundingAskAmount = 250_000,
            Country = "Germany",
            ShareType = "common",
        };

        var inv1 = new Investor { Id = "inv-1", Name = "Inv 1", PreferredSectors = new List<string> { "crypto" }, PreferredStages = new List<string> { "series_a" }, MinCheckSize = 1_000_000, MaxCheckSize = 5_000_000, PreferredGeographies = new List<string> { "USA" } };
        var inv2 = new Investor { Id = "inv-2", Name = "Inv 2", PreferredSectors = new List<string> { "robotics" }, PreferredStages = new List<string> { "series_c" }, MinCheckSize = 5_000_000, MaxCheckSize = 20_000_000, PreferredGeographies = new List<string> { "Japan" } };
        var inv3 = new Investor { Id = "inv-3", Name = "Inv 3", PreferredSectors = new List<string> { "ai" }, PreferredStages = new List<string> { "pre_seed" }, MinCheckSize = 100_000, MaxCheckSize = 500_000, PreferredGeographies = new List<string> { "Germany" } };
        var inv4 = new Investor { Id = "inv-4", Name = "Inv 4", PreferredSectors = new List<string> { "robotics" }, PreferredStages = new List<string> { "pre_seed" }, MinCheckSize = 2_000_000, MaxCheckSize = 10_000_000, PreferredGeographies = new List<string> { "Germany" } };

        _investorsDb.AddRange(new[] { inv1, inv2, inv3, inv4 });
        _mockInvestorService.Setup(s => s.GetInvestorAsync("inv-1")).ReturnsAsync(inv1);
        _mockInvestorService.Setup(s => s.GetInvestorAsync("inv-2")).ReturnsAsync(inv2);
        _mockInvestorService.Setup(s => s.GetInvestorAsync("inv-3")).ReturnsAsync(inv3);
        _mockInvestorService.Setup(s => s.GetInvestorAsync("inv-4")).ReturnsAsync(inv4);

        var matches = await _matcher.FindMatchesAsync(company, new List<string> { "inv-1", "inv-2", "inv-3", "inv-4" });

        // All 4 candidates must persist and not be dropped by any score filter
        matches.Should().HaveCount(4);
        matches.Should().BeInDescendingOrder(m => m.MatchScore);

        // Every match has valid rationale explaining hits and misses
        foreach (var m in matches)
        {
            m.MatchRationale.Should().NotBeNullOrWhiteSpace();
            m.ScoreComponents.Should().NotBeNull();
        }

        // Test interaction & completion with the lowest-scoring match
        var lowestMatch = matches.Last();
        lowestMatch.EntrepreneurInterest = "interested";
        lowestMatch.InvestorInterest = "interested";
        lowestMatch.Status = "accepted";
        lowestMatch.HandshakeConfirmedAt = DateTime.UtcNow;

        var (isValid, errors) = await _validator.ValidatePhase8Async(company);
        isValid.Should().BeTrue();
        errors.Should().BeEmpty();
    }

    [Fact]
    public async Task Phase8_MatchExplanation_ExplainsMismatchesAccurately()
    {
        var company = new Companies
        {
            Id = "comp-explain",
            Industry = "healthcare",
            FundingRoundType = "seed",
            FundingAskAmount = 750_000,
            Country = "Sweden",
            ShareType = "safe",
        };

        var investor = new Investor
        {
            Id = "inv-mismatch",
            Name = "Venture Outlier",
            PreferredSectors = new List<string> { "gaming", "web3" },
            PreferredStages = new List<string> { "series_b" },
            MinCheckSize = 5_000_000,
            MaxCheckSize = 15_000_000,
            PreferredGeographies = new List<string> { "Singapore" },
        };

        _mockInvestorService.Setup(s => s.GetInvestorAsync("inv-mismatch")).ReturnsAsync(investor);

        var matches = await _matcher.FindMatchesAsync(company, new List<string> { "inv-mismatch" });
        matches.Should().HaveCount(1);
        var m = matches[0];

        m.MatchScore.Should().BeLessThan(40);
        m.MatchRationale.Should().Contain("sector mismatch");
        m.MatchRationale.Should().Contain("stage mismatch");
        m.MatchRationale.Should().Contain("check size outside band");
        m.MatchRationale.Should().Contain("geography mismatch");
    }
}
