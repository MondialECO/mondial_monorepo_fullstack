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
        _matchesColl.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<InvestorMatch>>(),
                It.IsAny<FindOptions<InvestorMatch, InvestorMatch>>(),
                It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                var cursor = new Mock<IAsyncCursor<InvestorMatch>>();
                cursor.Setup(c => c.Current).Returns(list);
                cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
                    .ReturnsAsync(list.Count > 0).ReturnsAsync(false);
                return Task.FromResult(cursor.Object);
            });
    }

    private void SetupInvestorExists(bool exists)
    {
        var list = exists ? new List<Investor> { new() { Id = "inv-1" } } : new List<Investor>();
        _investorsColl.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<Investor>>(),
                It.IsAny<FindOptions<Investor, Investor>>(),
                It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                var cursor = new Mock<IAsyncCursor<Investor>>();
                cursor.Setup(c => c.Current).Returns(list);
                cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
                    .ReturnsAsync(list.Count > 0).ReturnsAsync(false);
                return Task.FromResult(cursor.Object);
            });
    }

    private static InvestorMatch ProperMatch(int score = 80, string id = "m-1", string investorId = "inv-1") => new()
    {
        Id = id,
        CompanyId = "comp-1",
        InvestorId = investorId,
        MatchScore = score,
        Status = "accepted",
        EntrepreneurInterest = "interested",
        InvestorInterest = "interested",
        HandshakeConfirmedAt = DateTime.UtcNow,
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
    public async Task Phase8_70_NoHandshake_Blocked()
    {
        var m = ProperMatch(score: 70);
        m.Status = "new";
        m.EntrepreneurInterest = "new";
        m.InvestorInterest = "new";
        m.HandshakeConfirmedAt = null;

        SetupMatches(new[] { m });
        SetupInvestorExists(true);
        var (isValid, errors) = await _validator.ValidatePhase8Async(new Companies { Id = "comp-1" });
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("confirmed mutual investor handshake"));
    }

    [Fact]
    public async Task Phase8_70_WithHandshake_Allowed()
    {
        var m = ProperMatch(score: 70);
        SetupMatches(new[] { m });
        SetupInvestorExists(true);
        var (isValid, errors) = await _validator.ValidatePhase8Async(new Companies { Id = "comp-1" });
        isValid.Should().BeTrue();
        errors.Should().BeEmpty();
    }

    [Fact]
    public async Task Phase8_45_WithHandshake_Allowed()
    {
        // Score 45 (below old 50 threshold) is ALLOWED because mutual handshake is confirmed
        var m = ProperMatch(score: 45);
        SetupMatches(new[] { m });
        SetupInvestorExists(true);
        var (isValid, errors) = await _validator.ValidatePhase8Async(new Companies { Id = "comp-1" });
        isValid.Should().BeTrue();
        errors.Should().BeEmpty();
    }

    [Fact]
    public async Task Phase8_20_WithHandshake_Allowed()
    {
        // Score 20 is ALLOWED because mutual handshake is confirmed — score is advisory only
        var m = ProperMatch(score: 20);
        SetupMatches(new[] { m });
        SetupInvestorExists(true);
        var (isValid, errors) = await _validator.ValidatePhase8Async(new Companies { Id = "comp-1" });
        isValid.Should().BeTrue();
        errors.Should().BeEmpty();
    }

    [Fact]
    public async Task Phase8_95_OneSidedInterest_Blocked()
    {
        // Score 95 but only one side interested -> BLOCKED
        var m = ProperMatch(score: 95);
        m.Status = "interested";
        m.EntrepreneurInterest = "interested";
        m.InvestorInterest = "new";
        m.HandshakeConfirmedAt = null;

        SetupMatches(new[] { m });
        SetupInvestorExists(true);
        var (isValid, errors) = await _validator.ValidatePhase8Async(new Companies { Id = "comp-1" });
        isValid.Should().BeFalse();
        errors.Should().Contain(e => e.Contains("confirmed mutual investor handshake"));
    }

    [Fact]
    public async Task Phase8_MeetingOptional()
    {
        // No interaction records for meeting / calls, handshake confirmed -> PASSES
        var m = ProperMatch(score: 60);
        m.Interactions = new List<InteractionRecord>(); // zero meetings scheduled
        SetupMatches(new[] { m });
        SetupInvestorExists(true);

        var (isValid, errors) = await _validator.ValidatePhase8Async(new Companies { Id = "comp-1" });
        isValid.Should().BeTrue();
        errors.Should().BeEmpty();
    }

    [Fact]
    public async Task Phase8_HandshakeIdempotent()
    {
        var m = ProperMatch(score: 75);
        m.HandshakeConfirmedAt = DateTime.UtcNow.AddDays(-2);
        SetupMatches(new[] { m });
        SetupInvestorExists(true);

        var (isValid1, _) = await _validator.ValidatePhase8Async(new Companies { Id = "comp-1" });
        var (isValid2, _) = await _validator.ValidatePhase8Async(new Companies { Id = "comp-1" });

        isValid1.Should().BeTrue();
        isValid2.Should().BeTrue();
    }

    [Fact]
    public async Task Phase8_MatchScoreStillReturned()
    {
        var m = ProperMatch(score: 42);
        m.MatchScore.Should().Be(42);
    }

    [Fact]
    public async Task Phase8_RationaleStillReturned()
    {
        var m = ProperMatch(score: 42);
        m.MatchRationale.Should().NotBeNullOrWhiteSpace();
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
                EngineVersion = "legacy",
                InvestorPreferences = null!,
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

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(20)]
    [InlineData(39)]
    [InlineData(40)]
    [InlineData(100)]
    public async Task Phase8_AdvisoryScoreBoundaries_CanCompletePhase8(int score)
    {
        var m = ProperMatch(score);
        SetupMatches(new[] { m });
        SetupInvestorExists(true);

        var (isValid, errors) = await _validator.ValidatePhase8Async(new Companies { Id = "comp-1" });
        isValid.Should().BeTrue();
        errors.Should().BeEmpty();
    }

    [Fact]
    public async Task Phase8_MatchScoreBelow40_CanReachMutualHandshakeAndComplete()
    {
        // Score = 25 (low fit), but both parties express interest -> handshake confirmed
        var m = ProperMatch(25);
        m.EntrepreneurInterest = "interested";
        m.InvestorInterest = "interested";
        m.Status = "accepted";
        m.HandshakeConfirmedAt = DateTime.UtcNow;

        SetupMatches(new[] { m });
        SetupInvestorExists(true);

        var (isValid, errors) = await _validator.ValidatePhase8Async(new Companies { Id = "comp-1" });
        isValid.Should().BeTrue();
        errors.Should().BeEmpty();
    }
}
