using FluentAssertions;
using MongoDB.Driver;
using Moq;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// Phase 8 validator: at least one persisted match clearing
/// Phase8Requirements.MinScoreToCount; well-formed rows only; matcher-
/// provenance gates (rationale + engineVersion + matchedAt + preferences
/// snapshot + investor hydratability).
/// </summary>
public class Phase8ValidatorTests
{
    private readonly Mock<MongoDbContext> _mockDb;
    private readonly Mock<IMongoCollection<InvestorMatch>> _matchesColl;
    private readonly Mock<IMongoCollection<Investor>> _investorsColl;
    private readonly PhaseValidator _validator;

    public Phase8ValidatorTests()
    {
        _mockDb = new Mock<MongoDbContext>(
            new MongoClient("mongodb://localhost:27017").GetDatabase("mondial_test"));
        _matchesColl = new Mock<IMongoCollection<InvestorMatch>>();
        _investorsColl = new Mock<IMongoCollection<Investor>>();
        _mockDb.Setup(d => d.InvestorMatches).Returns(_matchesColl.Object);
        _mockDb.Setup(d => d.Investors).Returns(_investorsColl.Object);
        _validator = new PhaseValidator(_mockDb.Object);
    }

    private void SetupMatches(IEnumerable<InvestorMatch> matches)
    {
        var list = matches.ToList();
        var cursor = new Mock<IAsyncCursor<InvestorMatch>>();
        cursor.Setup(c => c.Current).Returns(list);
        cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(list.Count > 0).ReturnsAsync(false);
        _matchesColl.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<InvestorMatch>>(),
                It.IsAny<FindOptions<InvestorMatch, InvestorMatch>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(cursor.Object);
    }

    private void SetupInvestorExists(bool exists)
    {
        var list = exists ? new List<Investor> { new() { Id = "inv-1" } } : new List<Investor>();
        var cursor = new Mock<IAsyncCursor<Investor>>();
        cursor.Setup(c => c.Current).Returns(list);
        cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(list.Count > 0).ReturnsAsync(false);
        _investorsColl.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<Investor>>(),
                It.IsAny<FindOptions<Investor, Investor>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(cursor.Object);
    }

    private static InvestorMatch ProperMatch(int score = 80, string id = "m-1", string investorId = "inv-1") => new()
    {
        Id = id,
        CompanyId = "comp-1",
        InvestorId = investorId,
        MatchScore = score,
        Status = "new",
        MatchRationale = "Hits: sector match (saas); stage match (seed) | Misses: -",
        EngineVersion = InvestorMatcher.EngineVersion,
        MatchedAt = DateTime.UtcNow,
        InvestorPreferences = new InvestorPreferences
        {
            PreferredSectors = new List<string> { "saas" },
            PreferredStages = new List<string> { "seed" },
            MinInvestmentAmount = 100_000,
            MaxInvestmentAmount = 1_000_000,
        },
    };

    [Fact]
    public async Task Phase8_NoMatches_Fails()
    {
        SetupMatches(Enumerable.Empty<InvestorMatch>());
        var (isValid, errors) = await _validator.ValidatePhase8Async(new Companies { Id = "comp-1" });
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("at least"));
    }

    [Fact]
    public async Task Phase8_LowScoreOnly_Fails()
    {
        var m = ProperMatch(score: 20);
        SetupMatches(new[] { m });
        SetupInvestorExists(true);
        var (isValid, errors) = await _validator.ValidatePhase8Async(new Companies { Id = "comp-1" });
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains($"score >= {Phase8Requirements.MinScoreToCount}"));
    }

    [Fact]
    public async Task Phase8_InvalidStatus_Fails()
    {
        var m = ProperMatch();
        m.Status = "weird";
        SetupMatches(new[] { m });
        SetupInvestorExists(true);
        var (isValid, errors) = await _validator.ValidatePhase8Async(new Companies { Id = "comp-1" });
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("invalid status"));
    }

    [Fact]
    public async Task Phase8_MalformedRow_Fails()
    {
        var m = ProperMatch();
        m.InvestorId = "";
        SetupMatches(new[] { m });
        SetupInvestorExists(false);
        var (isValid, errors) = await _validator.ValidatePhase8Async(new Companies { Id = "comp-1" });
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("has no investorId"));
    }

    [Fact]
    public async Task Phase8_InvalidInteractionType_Fails()
    {
        var m = ProperMatch();
        m.Interactions = new List<InteractionRecord>
        {
            new() { Type = "<script>", Details = "x", Timestamp = DateTime.UtcNow },
        };
        SetupMatches(new[] { m });
        SetupInvestorExists(true);
        var (isValid, errors) = await _validator.ValidatePhase8Async(new Companies { Id = "comp-1" });
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("invalid interaction type"));
    }

    [Fact]
    public async Task Phase8_OneHighScoreValid_Passes()
    {
        SetupMatches(new[] { ProperMatch() });
        SetupInvestorExists(true);
        var (isValid, errors) = await _validator.ValidatePhase8Async(new Companies { Id = "comp-1" });
        isValid.Should().BeTrue();
        errors.Should().BeEmpty();
    }

    [Fact]
    public async Task Phase8_MinimalHandRolledRow_Fails()
    {
        // Exact attack the verdict called out: someone POSTs a match with
        // score=80 + status=new and nothing else. Pre-hardening, this passed.
        SetupMatches(new[]
        {
            new InvestorMatch
            {
                Id = "m-1", CompanyId = "comp-1", InvestorId = "inv-1",
                MatchScore = 80, Status = "new",
            },
        });
        SetupInvestorExists(true);
        var (isValid, errors) = await _validator.ValidatePhase8Async(new Companies { Id = "comp-1" });
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("missing MatchRationale"));
        errors.Should().Contain(e => e.Contains("unexpected engineVersion"));
        errors.Should().Contain(e => e.Contains("no MatchedAt"));
        errors.Should().Contain(e => e.Contains("no investorPreferences snapshot"));
    }

    [Fact]
    public async Task Phase8_MatcherProducedRow_WithMissingInvestor_Fails()
    {
        SetupMatches(new[] { ProperMatch() });
        SetupInvestorExists(false);
        var (isValid, errors) = await _validator.ValidatePhase8Async(new Companies { Id = "comp-1" });
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("no longer exists"));
    }

    [Fact]
    public async Task Phase8_MissingMatchedAt_Fails()
    {
        // Otherwise valid matcher-produced row, but MatchedAt is null. Before
        // the nullable fix, the model defaulted to DateTime.UtcNow on
        // deserialization and this row would silently pass the freshness gate.
        var m = ProperMatch();
        m.MatchedAt = null;
        SetupMatches(new[] { m });
        SetupInvestorExists(true);

        var (isValid, errors) = await _validator.ValidatePhase8Async(new Companies { Id = "comp-1" });

        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("no MatchedAt"));
    }

    [Fact]
    public async Task Phase8_EmptyPreferencesSnapshot_Fails()
    {
        var m = ProperMatch();
        m.InvestorPreferences = new InvestorPreferences(); // empty
        SetupMatches(new[] { m });
        SetupInvestorExists(true);
        var (isValid, errors) = await _validator.ValidatePhase8Async(new Companies { Id = "comp-1" });
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("investorPreferences snapshot is empty"));
    }
}
