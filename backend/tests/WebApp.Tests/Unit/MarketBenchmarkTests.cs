using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using Moq;
using WebApp.Controllers;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Models.Dtos;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Unit;

public class MarketBenchmarkTests
{
    private const string UserId = "11111111-1111-1111-1111-111111111111";

    [Fact]
    public async Task Resolver_normalizes_alias_before_sector_lookup()
    {
        var fintech = GeneralBenchmark();
        fintech.SectorKey = "fintech";
        fintech.IsDefault = false;
        fintech.DisplayLabel = "Benchmark: FinTech";

        var store = new Mock<IMarketBenchmarkStore>();
        store.Setup(x => x.GetBySectorKeyAsync("fintech")).ReturnsAsync(fintech);
        var resolver = new MarketBenchmarkResolver(store.Object);

        var result = await resolver.ResolveAsync("  Financial Technology  ");

        result.MatchType.Should().Be("sector");
        result.ResolvedBenchmarkSector.Should().Be("fintech");
        store.Verify(x => x.GetBySectorKeyAsync("fintech"), Times.Once);
        store.Verify(x => x.GetDefaultAsync(), Times.Never);
    }

    [Fact]
    public async Task Resolver_keeps_cleantech_distinct_and_labels_general_fallback()
    {
        var fallback = GeneralBenchmark();
        var store = new Mock<IMarketBenchmarkStore>();
        store.Setup(x => x.GetBySectorKeyAsync("cleantech"))
            .ReturnsAsync((MarketBenchmark?)null);
        store.Setup(x => x.GetDefaultAsync()).ReturnsAsync(fallback);
        var resolver = new MarketBenchmarkResolver(store.Object);

        var result = await resolver.ResolveAsync(" CleanTech ");

        result.RequestedSector.Should().Be("CleanTech");
        result.MatchType.Should().Be("general");
        result.ResolvedBenchmarkSector.Should().Be("general");
        result.Benchmark.DisplayLabel.Should().Be("General estimate — no sector-specific data yet");
        store.Verify(x => x.GetBySectorKeyAsync("cleantech"), Times.Once);
    }

    [Fact]
    public void General_seed_is_the_approved_eur_baseline()
    {
        var seed = MarketBenchmarkSeed.General();

        seed.Currency.Should().Be("EUR");
        seed.DeveloperCostPerMonth.Should().Be(4_000m);
        seed.DeveloperDurationMonths.Should().Be(3);
        seed.HostingCostPerMonth.Should().Be(80m);
        seed.LegalCost.Should().Be(2_000m);
        seed.MiscPercentage.Should().Be(10);
        seed.LaunchDurationWeeksMin.Should().Be(8);
        seed.LaunchDurationWeeksMax.Should().Be(12);
        seed.LaunchVarianceMinPercentage.Should().Be(-20);
        seed.LaunchVarianceMaxPercentage.Should().Be(20);
        seed.GtmChannelSplit.Sum(x => x.Percent).Should().Be(100);
        seed.BenchmarkGtmWeeks.Should().HaveCount(4);
        seed.IsDefault.Should().BeTrue();
    }

    [Fact]
    public void Legacy_ai_gtm_weeks_deserialize_but_are_never_written_again()
    {
        var legacy = new BsonDocument
        {
            ["WebPresence"] = new BsonArray(),
            ["AiGtmWeeks"] = new BsonArray
            {
                new BsonDocument
                {
                    ["Week"] = 1,
                    ["Title"] = "Foundations",
                    ["Tasks"] = new BsonArray { "Register domain" },
                    ["Completed"] = false,
                },
            },
            ["TargetAudiences"] = new BsonArray(),
            ["ChannelMix"] = new BsonArray(),
        };

        var hydrated = BsonSerializer.Deserialize<CreatorGtmSetup>(legacy);
        var rewritten = hydrated.ToBsonDocument();

        hydrated.BenchmarkGtmWeeks.Should().ContainSingle();
        rewritten.Contains("BenchmarkGtmWeeks").Should().BeTrue();
        rewritten.Contains("AiGtmWeeks").Should().BeFalse();
    }

    [Fact]
    public async Task Benchmark_endpoint_returns_match_metadata_and_defaults()
    {
        var resolution = GeneralResolution("FinTech");
        var resolver = new Mock<IMarketBenchmarkResolver>();
        resolver.Setup(x => x.ResolveAsync("FinTech")).ReturnsAsync(resolution);
        var controller = Controller(Mock.Of<ICreatorJourneyService>(), resolver.Object);

        var result = await controller.Benchmark("FinTech");

        var response = ((OkObjectResult)result).Value.Should().BeOfType<ApiResponse>().Subject;
        var data = response.Data.Should().BeOfType<MarketBenchmarkResponse>().Subject;
        data.RequestedSector.Should().Be("FinTech");
        data.MatchType.Should().Be("general");
        data.DisplayLabel.Should().Be("General estimate — no sector-specific data yet");
        data.Currency.Should().Be("EUR");
        data.GtmDefaults.BenchmarkGtmWeeks.Should().HaveCount(4);
    }

    [Fact]
    public async Task Pricing_insights_uses_forecast_arpu_without_fabricating_competitor_data()
    {
        var journey = Journey("SaaS");
        journey.Phase3Data = new CreatorPhase3Data { ForecastSessionId = "forecast-1" };
        journey.Phase4Data.Tiers = new List<CreatorPricingTier>
        {
            Tier("Selected package", 45),
        };
        var journeys = new Mock<ICreatorJourneyService>();
        journeys.Setup(x => x.GetOrCreateComposedAsync(UserId, null)).ReturnsAsync(journey);
        var forecasts = new Mock<IForecastSessionStore>();
        forecasts.Setup(x => x.GetOwnedAsync("forecast-1", UserId)).ReturnsAsync(new ForecastSession
        {
            Id = "forecast-1",
            Inputs = new ForecastInputs { Arpu = 30 },
            UpdatedAt = new DateTime(2026, 8, 25, 0, 0, 0, DateTimeKind.Utc),
        });
        var controller = Controller(journeys.Object, Mock.Of<IMarketBenchmarkResolver>(), forecasts.Object);

        var result = await controller.PricingInsights();

        var response = ((OkObjectResult)result).Value.Should().BeOfType<ApiResponse>().Subject;
        var json = System.Text.Json.JsonSerializer.Serialize(response.Data);
        json.Should().Contain("forecast_assumption");
        json.Should().Contain("selectedEntryPrice\":45");
        json.Should().Contain("Competitor pricing data unavailable");
        json.Should().NotContain("Bonsai");
        json.Should().NotContain("Generic SaaS");
    }

    [Fact]
    public async Task Pricing_save_keeps_the_user_tier_and_marks_a_large_forecast_difference_for_review()
    {
        var journey = Journey("SaaS");
        journey.Phase3Data = new CreatorPhase3Data { ForecastSessionId = "forecast-1" };
        var journeys = new Mock<ICreatorJourneyService>();
        journeys.Setup(x => x.GetOrCreateComposedAsync(UserId, null)).ReturnsAsync(journey);
        journeys.Setup(x => x.SetPhase4PricingAsync(
                UserId,
                "subscription",
                It.IsAny<List<CreatorPricingTier>>(),
                It.IsAny<CreatorPricingForecastContext?>(),
                null))
            .ReturnsAsync(journey);
        var forecasts = new Mock<IForecastSessionStore>();
        forecasts.Setup(x => x.GetOwnedAsync("forecast-1", UserId)).ReturnsAsync(new ForecastSession
        {
            Id = "forecast-1",
            Inputs = new ForecastInputs { Arpu = 30 },
            UpdatedAt = DateTime.UtcNow,
        });
        var controller = Controller(journeys.Object, Mock.Of<IMarketBenchmarkResolver>(), forecasts.Object);
        var request = new SetPricingRequest
        {
            PricingModel = "subscription",
            Tiers = new List<CreatorPricingTier>
            {
                Tier("Starter", 45), Tier("Growth", 80), Tier("Scale", 120),
            },
        };

        var result = await controller.SetPricing(request);

        result.Should().BeOfType<OkObjectResult>();
        journeys.Verify(x => x.SetPhase4PricingAsync(
            UserId,
            "subscription",
            It.Is<List<CreatorPricingTier>>(tiers => tiers[0].Price == 45),
            It.Is<CreatorPricingForecastContext?>(context =>
                context != null
                && context.ForecastSessionId == "forecast-1"
                && context.ForecastArpu == 30
                && context.IsPotentiallyOutdated),
            null), Times.Once);
    }

    [Fact]
    public async Task Empty_resource_request_uses_resolved_benchmark_values()
    {
        var journeys = new Mock<ICreatorJourneyService>();
        journeys.Setup(x => x.GetOrCreateComposedAsync(UserId, null))
            .ReturnsAsync(Journey("FinTech"));
        CreatorResourceCalculation? saved = null;
        journeys.Setup(x => x.SetPhase4ResourceAsync(UserId, It.IsAny<CreatorResourceCalculation>(), null))
            .Callback<string, CreatorResourceCalculation, string>((_, value, _) => saved = value)
            .ReturnsAsync(() => Journey("FinTech", resource: saved));
        var resolver = new Mock<IMarketBenchmarkResolver>();
        resolver.Setup(x => x.ResolveAsync("FinTech")).ReturnsAsync(GeneralResolution("FinTech"));
        var controller = Controller(journeys.Object, resolver.Object);

        var result = await controller.ResourceCalculator(new ResourceCalcRequest());

        result.Should().BeOfType<OkObjectResult>();
        saved.Should().NotBeNull();
        saved!.TeamRequirements.Should().ContainSingle(x =>
            x.Cost == 4_000m && x.DurationMonths == 3 && x.Role == "Full-stack developer");
        saved.SaasStack.Should().ContainSingle(x => x.Name == "Hosting" && x.MonthlyCost == 80m);
        saved.TimeToLaunchWeeksMin.Should().Be(8);
        saved.TimeToLaunchWeeksMax.Should().Be(12);
        saved.TotalLaunchBudgetMin.Should().Be(12_531m);
        saved.TotalLaunchBudgetMax.Should().Be(18_797m);
    }

    [Fact]
    public async Task Empty_gtm_request_uses_benchmark_split_and_week_plan()
    {
        var journeys = new Mock<ICreatorJourneyService>();
        journeys.Setup(x => x.GetOrCreateComposedAsync(UserId, null))
            .ReturnsAsync(Journey("SaaS"));
        CreatorGtmSetup? saved = null;
        journeys.Setup(x => x.SetPhase4GtmAsync(UserId, It.IsAny<CreatorGtmSetup>(), null))
            .Callback<string, CreatorGtmSetup, string>((_, value, _) => saved = value)
            .ReturnsAsync(() => Journey("SaaS", gtm: saved));
        var resolver = new Mock<IMarketBenchmarkResolver>();
        resolver.Setup(x => x.ResolveAsync("SaaS")).ReturnsAsync(GeneralResolution("SaaS"));
        var controller = Controller(journeys.Object, resolver.Object);

        var result = await controller.GtmSetup(new GtmSetupRequest());

        result.Should().BeOfType<OkObjectResult>();
        saved.Should().NotBeNull();
        saved!.ChannelMix.Select(x => x.Percent).Should().Equal(40, 30, 30);
        saved.BenchmarkGtmWeeks.Should().HaveCount(4);
        saved.BenchmarkGtmWeeks[0].Completed.Should().BeFalse();
    }

    private static CreatorPhase4Controller Controller(
        ICreatorJourneyService journeys,
        IMarketBenchmarkResolver resolver,
        IForecastSessionStore? forecasts = null) => new(journeys, resolver, forecasts)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(
                        new[] { new Claim(ClaimTypes.NameIdentifier, UserId) },
                        "test")),
                },
            },
        };

    private static CreatorJourney Journey(
        string sector,
        CreatorResourceCalculation? resource = null,
        CreatorGtmSetup? gtm = null) => new()
    {
        UserId = UserId,
        Project = new CreatorJourneyProject { Sector = sector },
        Phase4Data = new CreatorPhase4Data
        {
            ResourceCalculation = resource,
            GtmSetup = gtm,
        },
    };

    private static MarketBenchmarkResolution GeneralResolution(string requestedSector) => new()
    {
        RequestedSector = requestedSector,
        ResolvedBenchmarkSector = "general",
        MatchType = "general",
        Benchmark = GeneralBenchmark(),
    };

    private static MarketBenchmark GeneralBenchmark() => MarketBenchmarkSeed.General();

    private static CreatorPricingTier Tier(string name, decimal price) => new()
    {
        Name = name,
        Price = price,
        Features = new List<string> { "One", "Two", "Three" },
    };
}
