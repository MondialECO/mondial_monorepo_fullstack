using WebApp.Models.DatabaseModels;
using WebApp.Services.Interface;
using WebApp.Services.Repository;

namespace WebApp.Services.Implementations;

public sealed class MarketBenchmarkResolver : IMarketBenchmarkResolver
{
    private readonly IMarketBenchmarkStore _store;

    // Keep taxonomy aliases explicit and editable. ClimaTech and CleanTech are
    // intentionally absent because the current product taxonomy treats them as
    // distinct values, not spelling variants.
    private static readonly IReadOnlyDictionary<string, string> SectorAliases =
        new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["financial technology"] = "fintech",
            ["e-commerce"] = "ecommerce",
            ["e commerce"] = "ecommerce",
            ["artificial intelligence"] = "ai/ml",
            ["artificial intelligence / machine learning"] = "ai/ml",
        };

    public MarketBenchmarkResolver(IMarketBenchmarkStore store) => _store = store;

    public async Task<MarketBenchmarkResolution> ResolveAsync(string? requestedSector)
    {
        var requested = requestedSector?.Trim() ?? string.Empty;
        var key = NormalizeSectorKey(requested);
        var sectorBenchmark = string.IsNullOrEmpty(key)
            ? null
            : await _store.GetBySectorKeyAsync(key);

        if (sectorBenchmark != null)
        {
            return new MarketBenchmarkResolution
            {
                RequestedSector = requested,
                ResolvedBenchmarkSector = sectorBenchmark.SectorKey,
                MatchType = "sector",
                Benchmark = sectorBenchmark,
            };
        }

        var fallback = await _store.GetDefaultAsync()
            ?? throw new InvalidOperationException("The general market benchmark has not been configured.");

        return new MarketBenchmarkResolution
        {
            RequestedSector = requested,
            ResolvedBenchmarkSector = fallback.SectorKey,
            MatchType = "general",
            Benchmark = fallback,
        };
    }

    internal static string NormalizeSectorKey(string sector)
    {
        var normalized = sector.Trim().ToLowerInvariant();
        return SectorAliases.TryGetValue(normalized, out var canonical)
            ? canonical
            : normalized;
    }
}
