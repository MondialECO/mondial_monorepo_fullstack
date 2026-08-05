using MongoDB.Driver;
using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Repository;

public interface IMarketBenchmarkStore
{
    Task<MarketBenchmark?> GetBySectorKeyAsync(string sectorKey);
    Task<MarketBenchmark?> GetDefaultAsync();

    /// <summary>
    /// Inserts the initial general benchmark only when it does not already exist.
    /// Maintainer edits are intentionally never overwritten during startup.
    /// </summary>
    Task<bool> SeedGeneralAsync(MarketBenchmark benchmark);
}

public sealed class MarketBenchmarkStore : IMarketBenchmarkStore
{
    private readonly IMongoCollection<MarketBenchmark> _collection;

    public MarketBenchmarkStore(IMongoDatabase database)
    {
        _collection = database.GetCollection<MarketBenchmark>("MarketBenchmarks");
        CreateIndexesAsync().GetAwaiter().GetResult();
    }

    private Task CreateIndexesAsync() => _collection.Indexes.CreateManyAsync(new[]
    {
        new CreateIndexModel<MarketBenchmark>(
            Builders<MarketBenchmark>.IndexKeys.Ascending(x => x.SectorKey),
            new CreateIndexOptions { Name = "SectorKey", Unique = true }),
        new CreateIndexModel<MarketBenchmark>(
            Builders<MarketBenchmark>.IndexKeys.Ascending(x => x.IsDefault),
            new CreateIndexOptions<MarketBenchmark>
            {
                Name = "SingleDefault",
                Unique = true,
                PartialFilterExpression = Builders<MarketBenchmark>.Filter.Eq(x => x.IsDefault, true),
            }),
    });

    public async Task<MarketBenchmark?> GetBySectorKeyAsync(string sectorKey) =>
        await _collection.Find(x => x.SectorKey == sectorKey).FirstOrDefaultAsync();

    public async Task<MarketBenchmark?> GetDefaultAsync() =>
        await _collection.Find(x => x.IsDefault).FirstOrDefaultAsync();

    public async Task<bool> SeedGeneralAsync(MarketBenchmark benchmark)
    {
        var result = await _collection.UpdateOneAsync(
            x => x.SectorKey == benchmark.SectorKey,
            Builders<MarketBenchmark>.Update
                .SetOnInsert(x => x.SectorKey, benchmark.SectorKey)
                .SetOnInsert(x => x.Region, benchmark.Region)
                .SetOnInsert(x => x.Currency, benchmark.Currency)
                .SetOnInsert(x => x.DeveloperCostPerMonth, benchmark.DeveloperCostPerMonth)
                .SetOnInsert(x => x.DeveloperDurationMonths, benchmark.DeveloperDurationMonths)
                .SetOnInsert(x => x.HostingCostPerMonth, benchmark.HostingCostPerMonth)
                .SetOnInsert(x => x.LegalCost, benchmark.LegalCost)
                .SetOnInsert(x => x.MiscPercentage, benchmark.MiscPercentage)
                .SetOnInsert(x => x.LaunchDurationWeeksMin, benchmark.LaunchDurationWeeksMin)
                .SetOnInsert(x => x.LaunchDurationWeeksMax, benchmark.LaunchDurationWeeksMax)
                .SetOnInsert(x => x.LaunchVarianceMinPercentage, benchmark.LaunchVarianceMinPercentage)
                .SetOnInsert(x => x.LaunchVarianceMaxPercentage, benchmark.LaunchVarianceMaxPercentage)
                .SetOnInsert(x => x.GtmChannelSplit, benchmark.GtmChannelSplit)
                .SetOnInsert(x => x.BenchmarkGtmWeeks, benchmark.BenchmarkGtmWeeks)
                .SetOnInsert(x => x.IsDefault, benchmark.IsDefault)
                .SetOnInsert(x => x.DisplayLabel, benchmark.DisplayLabel)
                .SetOnInsert(x => x.SourceLabel, benchmark.SourceLabel)
                .SetOnInsert(x => x.SourceUrl, benchmark.SourceUrl)
                .SetOnInsert(x => x.SourceProvenance, benchmark.SourceProvenance)
                .SetOnInsert(x => x.EffectiveDate, benchmark.EffectiveDate)
                .SetOnInsert(x => x.Version, benchmark.Version)
                .SetOnInsert(x => x.LastUpdatedAt, benchmark.LastUpdatedAt),
            new UpdateOptions { IsUpsert = true });

        return result.UpsertedId != null;
    }
}
