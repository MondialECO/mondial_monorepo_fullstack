using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Interface;

public interface IMarketBenchmarkResolver
{
    Task<MarketBenchmarkResolution> ResolveAsync(string? requestedSector);
}

public sealed class MarketBenchmarkResolution
{
    public string RequestedSector { get; init; } = string.Empty;
    public string ResolvedBenchmarkSector { get; init; } = string.Empty;
    public string MatchType { get; init; } = "general";
    public MarketBenchmark Benchmark { get; init; } = new();
}
