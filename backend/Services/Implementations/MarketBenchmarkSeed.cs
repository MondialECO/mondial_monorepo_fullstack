using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Implementations;

public static class MarketBenchmarkSeed
{
    private static readonly DateTime InitialEffectiveDate =
        new(2026, 8, 5, 0, 0, 0, DateTimeKind.Utc);

    public static MarketBenchmark General() => new()
    {
        SectorKey = "general",
        Region = "General",
        Currency = "EUR",
        DeveloperCostPerMonth = 4_000m,
        DeveloperDurationMonths = 3,
        HostingCostPerMonth = 80m,
        LegalCost = 2_000m,
        MiscPercentage = 10,
        LaunchDurationWeeksMin = 8,
        LaunchDurationWeeksMax = 12,
        LaunchVarianceMinPercentage = -20,
        LaunchVarianceMaxPercentage = 20,
        GtmChannelSplit = new()
        {
            new() { Channel = "Content / SEO", Percent = 40 },
            new() { Channel = "Paid ads", Percent = 30 },
            new() { Channel = "Community", Percent = 30 },
        },
        BenchmarkGtmWeeks = new()
        {
            new() { Week = 1, Title = "Foundations", Tasks = new() { "Register domain", "Ship landing page", "Set up email capture" } },
            new() { Week = 2, Title = "Beta Outreach", Tasks = new() { "Invite beta users", "Collect feedback", "Iterate messaging" } },
            new() { Week = 3, Title = "ProductHunt Prep", Tasks = new() { "Assets + copy", "Line up hunters", "Schedule launch" } },
            new() { Week = 4, Title = "Launch Week", Tasks = new() { "Go live", "Activate channels", "Track conversions" } },
        },
        IsDefault = true,
        DisplayLabel = "General estimate — no sector-specific data yet",
        SourceLabel = "Mondial maintained general benchmark",
        SourceUrl = null,
        SourceProvenance = "Initial maintained baseline migrated from the former deterministic Phase 4 estimates.",
        EffectiveDate = InitialEffectiveDate,
        Version = 1,
        LastUpdatedAt = InitialEffectiveDate,
    };
}
