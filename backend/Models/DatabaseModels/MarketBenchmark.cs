using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels;

/// <summary>
/// Maintained Phase 4 planning reference data. One document represents one
/// canonical sector; exactly one row is marked as the general fallback.
/// </summary>
public sealed class MarketBenchmark
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string SectorKey { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string Currency { get; set; } = "EUR";

    public decimal DeveloperCostPerMonth { get; set; }
    public int DeveloperDurationMonths { get; set; }
    public decimal HostingCostPerMonth { get; set; }
    public decimal LegalCost { get; set; }
    public double MiscPercentage { get; set; }

    public int LaunchDurationWeeksMin { get; set; }
    public int LaunchDurationWeeksMax { get; set; }
    public double LaunchVarianceMinPercentage { get; set; }
    public double LaunchVarianceMaxPercentage { get; set; }

    public List<CreatorChannelMix> GtmChannelSplit { get; set; } = new();
    public List<CreatorGtmWeek> BenchmarkGtmWeeks { get; set; } = new();

    public bool IsDefault { get; set; }
    public string DisplayLabel { get; set; } = string.Empty;
    public string SourceLabel { get; set; } = string.Empty;
    public string? SourceUrl { get; set; }
    public string SourceProvenance { get; set; } = string.Empty;
    public DateTime EffectiveDate { get; set; }
    public int Version { get; set; }
    public DateTime LastUpdatedAt { get; set; }
}
