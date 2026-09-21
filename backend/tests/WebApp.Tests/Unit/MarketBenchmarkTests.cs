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

    private static MarketBenchmark GeneralBenchmark() => MarketBenchmarkSeed.General();
}
