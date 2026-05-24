using FluentAssertions;
using MongoDB.Driver;
using Moq;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Services;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// Phase 8 matcher: regression for the "ignores investor preferences" bug.
/// Same company + different investors MUST yield different scores when the
/// investor profiles differ on sector, stage, check-size band, or geography.
/// </summary>
public class Phase8MatcherTests
{
    private readonly InvestorMatcher _matcher;

    public Phase8MatcherTests()
    {
        var ctx = new Mock<MongoDbContext>(
            new MongoClient("mongodb://localhost:27017").GetDatabase("mondial_test"));
        _matcher = new InvestorMatcher(
            ctx.Object,
            new Mock<IInvestorService>().Object,
            new Mock<ILogger<InvestorMatcher>>().Object);
    }

    private static Companies SampleCompany() => new()
    {
        Id = "comp-1",
        Industry = "saas",
        FundingRoundType = "seed",
        FundingAskAmount = 1_000_000,
        Country = "France",
        ShareType = "preferred",
    };

    [Fact]
    public void SectorHit_OutscoresSectorMiss()
    {
        var company = SampleCompany();
        var hitInvestor = new Investor
        {
            Id = "inv-hit",
            PreferredSectors = new List<string> { "saas" },
            PreferredStages = new List<string> { "seed" },
            MinCheckSize = 500_000,
            MaxCheckSize = 2_000_000,
            PreferredGeographies = new List<string> { "France" },
        };
        var missInvestor = new Investor
        {
            Id = "inv-miss",
            PreferredSectors = new List<string> { "biotech" },
            PreferredStages = new List<string> { "seed" },
            MinCheckSize = 500_000,
            MaxCheckSize = 2_000_000,
            PreferredGeographies = new List<string> { "France" },
        };

        var (hitScore, hitRationale) = _matcher.ScoreAndExplain(company, hitInvestor);
        var (missScore, missRationale) = _matcher.ScoreAndExplain(company, missInvestor);

        hitScore.Should().BeGreaterThan(missScore);
        hitRationale.Should().Contain("sector match (saas)");
        missRationale.Should().Contain("sector mismatch");
    }

    [Fact]
    public void CheckSizeInBand_OutscoresOutOfBand()
    {
        var company = SampleCompany();
        var inBand = new Investor
        {
            Id = "inv-in",
            PreferredSectors = new List<string> { "saas" },
            PreferredStages = new List<string> { "seed" },
            MinCheckSize = 500_000,
            MaxCheckSize = 2_000_000,
            PreferredGeographies = new List<string> { "France" },
        };
        var outOfBand = new Investor
        {
            Id = "inv-out",
            PreferredSectors = new List<string> { "saas" },
            PreferredStages = new List<string> { "seed" },
            MinCheckSize = 50_000_000,
            MaxCheckSize = 100_000_000,
            PreferredGeographies = new List<string> { "France" },
        };

        var (inScore, _) = _matcher.ScoreAndExplain(company, inBand);
        var (outScore, outRationale) = _matcher.ScoreAndExplain(company, outOfBand);

        inScore.Should().BeGreaterThan(outScore);
        outRationale.Should().Contain("check size outside band");
    }

    [Fact]
    public void GeographyHit_OutscoresGeographyMiss()
    {
        var company = SampleCompany();
        var hit = new Investor
        {
            Id = "inv-geo-hit",
            PreferredSectors = new List<string> { "saas" },
            PreferredStages = new List<string> { "seed" },
            MinCheckSize = 500_000,
            MaxCheckSize = 2_000_000,
            PreferredGeographies = new List<string> { "France" },
        };
        var miss = new Investor
        {
            Id = "inv-geo-miss",
            PreferredSectors = new List<string> { "saas" },
            PreferredStages = new List<string> { "seed" },
            MinCheckSize = 500_000,
            MaxCheckSize = 2_000_000,
            PreferredGeographies = new List<string> { "Brazil" },
        };

        var (hitScore, _) = _matcher.ScoreAndExplain(company, hit);
        var (missScore, _) = _matcher.ScoreAndExplain(company, miss);

        hitScore.Should().BeGreaterThan(missScore);
    }

    [Fact]
    public void EngineVersion_IsRuleBasedV1()
    {
        InvestorMatcher.EngineVersion.Should().Be("rule_based_v1");
    }

    [Fact]
    public void Rationale_NeverEmpty()
    {
        var (_, rationale) = _matcher.ScoreAndExplain(SampleCompany(), new Investor
        {
            Id = "inv-x",
            PreferredSectors = new List<string> { "saas" },
            PreferredStages = new List<string> { "seed" },
            MinCheckSize = 500_000,
            MaxCheckSize = 2_000_000,
            PreferredGeographies = new List<string> { "France" },
        });
        rationale.Should().NotBeNullOrWhiteSpace();
        rationale.Should().Contain("Hits:");
    }

    // ============================================================
    // P0-1: four new dimensions — each must move the score
    // ============================================================

    private static Investor BaselineInvestor() => new()
    {
        Id = "inv-baseline",
        PreferredSectors = new List<string> { "saas" },
        PreferredStages = new List<string> { "seed" },
        MinCheckSize = 500_000,
        MaxCheckSize = 2_000_000,
        PreferredGeographies = new List<string> { "France" },
    };

    [Fact]
    public void InvestmentHistory_ExperiencedInvestor_OutscoresNewbie()
    {
        var company = SampleCompany();
        var experienced = BaselineInvestor();
        experienced.CompletedDeals = 20;
        experienced.SuccessfulExits = 5;
        experienced.ActiveInvestments = 8;
        experienced.AverageCheckSize = 1_000_000;

        var newbie = BaselineInvestor();
        newbie.CompletedDeals = 0;
        newbie.SuccessfulExits = 0;
        newbie.ActiveInvestments = 0;
        newbie.AverageCheckSize = 0;

        var (expScore, expRationale) = _matcher.ScoreAndExplain(company, experienced);
        var (newScore, newRationale) = _matcher.ScoreAndExplain(company, newbie);

        expScore.Should().BeGreaterThan(newScore);
        expRationale.Should().Contain("investment-history: experienced");
        newRationale.Should().Contain("limited deal history");
    }

    [Fact]
    public void RevenueStage_ScalingCompanyWithSeriesAInvestor_OutscoresPreSeedFit()
    {
        // Scaling company (between 250k and 2M revenue) aligns with seed/series_a.
        var company = SampleCompany();
        company.Q1Revenue = 200_000;
        company.Q2Revenue = 200_000;
        company.Q3Revenue = 200_000;
        company.Q4Revenue = 200_000; // total = 800k => scaling

        var seriesA = BaselineInvestor();
        seriesA.PreferredStages = new List<string> { "series_a" };

        var preSeedOnly = BaselineInvestor();
        preSeedOnly.PreferredStages = new List<string> { "pre_seed" };

        var (aScore, aRationale) = _matcher.ScoreAndExplain(company, seriesA);
        var (psScore, psRationale) = _matcher.ScoreAndExplain(company, preSeedOnly);

        aScore.Should().BeGreaterThan(psScore);
        aRationale.Should().Contain("revenue-stage: scaling aligns");
        psRationale.Should().Contain("revenue-stage: scaling does not match");
    }

    [Fact]
    public void MarketSize_LargeTAM_OutscoresTinyTAM()
    {
        var bigMarket = SampleCompany();
        bigMarket.MarketSizeEstimate = 5_000_000_000; // EUR 5B

        var tinyMarket = SampleCompany();
        tinyMarket.MarketSizeEstimate = 1_000_000; // EUR 1M

        var investor = BaselineInvestor();
        var (bigScore, bigRationale) = _matcher.ScoreAndExplain(bigMarket, investor);
        var (tinyScore, tinyRationale) = _matcher.ScoreAndExplain(tinyMarket, investor);

        bigScore.Should().BeGreaterThan(tinyScore);
        bigRationale.Should().Contain("market-size:");
        bigRationale.Should().Contain("large TAM");
        tinyRationale.Should().Contain("tiny TAM");
    }

    [Fact]
    public void GrowthPotential_HighScore_OutscoresLowScore()
    {
        var highGrowth = SampleCompany();
        highGrowth.GrowthPotentialScore = 90;

        var lowGrowth = SampleCompany();
        lowGrowth.GrowthPotentialScore = 20;

        var investor = BaselineInvestor();
        var (hi, hiRationale) = _matcher.ScoreAndExplain(highGrowth, investor);
        var (lo, loRationale) = _matcher.ScoreAndExplain(lowGrowth, investor);

        hi.Should().BeGreaterThan(lo);
        hiRationale.Should().Contain("growth-potential: 90/100 (high)");
        loRationale.Should().Contain("growth-potential: 20/100 (low)");
    }

    [Fact]
    public void Rationale_MentionsAllEightDimensions()
    {
        // A fully-evaluable company × investor pair so every dimension fires
        // either Hits or Misses (the validator-relevant property is that
        // each dimension is named in the rationale).
        var company = SampleCompany();
        company.MarketSizeEstimate = 500_000_000;
        company.GrowthPotentialScore = 75;
        company.Q1Revenue = 200_000;
        company.Q2Revenue = 200_000;
        company.Q3Revenue = 200_000;
        company.Q4Revenue = 200_000;

        var investor = BaselineInvestor();
        investor.PreferredEquityTypes = new List<string> { "preferred" };
        investor.CompletedDeals = 5;
        investor.ActiveInvestments = 3;
        investor.AverageCheckSize = 1_000_000;

        var (_, rationale) = _matcher.ScoreAndExplain(company, investor);

        // Each of the 8 product-doc dimensions must be referenced.
        rationale.Should().Contain("sector");
        rationale.Should().Contain("stage");
        rationale.Should().Contain("check size");
        rationale.Should().Contain("geography");
        rationale.Should().Contain("share-type");
        rationale.Should().Contain("investment-history");
        rationale.Should().Contain("revenue-stage");
        rationale.Should().Contain("market-size");
        rationale.Should().Contain("growth-potential");
    }
}
