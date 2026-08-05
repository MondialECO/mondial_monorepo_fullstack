using WebApp.Models.DatabaseModels;

namespace WebApp.Models.Dtos;

public sealed class MarketBenchmarkResponse
{
    public string RequestedSector { get; set; } = string.Empty;
    public string ResolvedBenchmarkSector { get; set; } = string.Empty;
    public string MatchType { get; set; } = string.Empty;
    public string DisplayLabel { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string Currency { get; set; } = string.Empty;
    public MarketBenchmarkResourceDefaults ResourceDefaults { get; set; } = new();
    public MarketBenchmarkGtmDefaults GtmDefaults { get; set; } = new();
    public MarketBenchmarkSource Source { get; set; } = new();
    public DateTime EffectiveDate { get; set; }
    public int Version { get; set; }
    public DateTime LastUpdatedAt { get; set; }
}

public sealed class MarketBenchmarkResourceDefaults
{
    public decimal DeveloperCostPerMonth { get; set; }
    public int DeveloperDurationMonths { get; set; }
    public decimal HostingCostPerMonth { get; set; }
    public decimal LegalCost { get; set; }
    public double MiscPercentage { get; set; }
    public int LaunchDurationWeeksMin { get; set; }
    public int LaunchDurationWeeksMax { get; set; }
    public double LaunchVarianceMinPercentage { get; set; }
    public double LaunchVarianceMaxPercentage { get; set; }
}

public sealed class MarketBenchmarkGtmDefaults
{
    public List<CreatorChannelMix> ChannelSplit { get; set; } = new();
    public List<CreatorGtmWeek> BenchmarkGtmWeeks { get; set; } = new();
}

public sealed class MarketBenchmarkSource
{
    public string Label { get; set; } = string.Empty;
    public string? Url { get; set; }
    public string Provenance { get; set; } = string.Empty;
}
