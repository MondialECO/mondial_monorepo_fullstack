using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels.Phase4;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations
{
    public class SupportCatalogueService : ISupportCatalogueService
    {
        private readonly MongoDbContext _context;
        private readonly IEnumerable<ISupportSourceAdapter> _adapters;

        public SupportCatalogueService(MongoDbContext context, IEnumerable<ISupportSourceAdapter> adapters)
        {
            _context = context;
            _adapters = adapters;
        }

        public async Task EnsureCatalogueSeededAsync()
        {
            // Seed registry records and opportunities if catalog is empty or missing sources
            foreach (var adapter in _adapters)
            {
                var registryRecord = adapter.GetRegistryMetadata();
                var existingRegistry = await _context.SupportSourceRegistry
                    .Find(r => r.SourceId == adapter.SourceId)
                    .FirstOrDefaultAsync();

                if (existingRegistry == null)
                {
                    await _context.SupportSourceRegistry.InsertOneAsync(registryRecord);
                }

                // Ingest baseline opportunities from this adapter
                var opportunities = await adapter.FetchAndNormalizeAsync();
                foreach (var opp in opportunities)
                {
                    var existingOpp = await _context.SupportOpportunities
                        .Find(o => o.ExternalId == opp.ExternalId)
                        .FirstOrDefaultAsync();

                    if (existingOpp == null)
                    {
                        await _context.SupportOpportunities.InsertOneAsync(opp);
                        await RecordSnapshotAsync(opp.SourceId, opp.ExternalId, opp.RawSourceFingerprint);
                    }
                    else
                    {
                        // Deduplication rule (Refinement): Primary official source takes precedence over aggregator duplicates
                        bool shouldOverride = IsHigherAuthority(opp.CatalogueSource, existingOpp.CatalogueSource);
                        if (shouldOverride)
                        {
                            opp.Id = existingOpp.Id; // preserve ObjectId
                            await _context.SupportOpportunities.ReplaceOneAsync(o => o.Id == existingOpp.Id, opp);
                            await RecordSnapshotAsync(opp.SourceId, opp.ExternalId, opp.RawSourceFingerprint);
                        }
                    }
                }
            }
        }

        private static bool IsHigherAuthority(string newSource, string existingSource)
        {
            int Rank(string source)
            {
                if (source.Contains("Service-Public") || source.Contains("URSSAF") || source.Contains("France Travail"))
                    return 4; // PrimaryOfficial
                if (source.Contains("Bpifrance") || source.Contains("Région") || source.Contains("Commission"))
                    return 3; // InstitutionalOfficial
                if (source.Contains("Aides-entreprises"))
                    return 2; // OfficialAggregator
                return 1;     // Secondary
            }

            return Rank(newSource) > Rank(existingSource);
        }

        public async Task<List<SupportOpportunity>> GetActiveOpportunitiesAsync(string country, string? region = null)
        {
            await EnsureCatalogueSeededAsync();

            var filterBuilder = Builders<SupportOpportunity>.Filter;
            var filter = filterBuilder.Eq(x => x.Status, SupportStatus.Active);

            // Country/Jurisdiction filtering
            if (!string.IsNullOrWhiteSpace(country))
            {
                filter &= (filterBuilder.Eq(x => x.Jurisdiction, country) | filterBuilder.Eq(x => x.Jurisdiction, "EU"));
            }

            var allActive = await _context.SupportOpportunities.Find(filter).ToListAsync();

            // Filter out opportunities whose deadline has already passed
            var now = DateTime.UtcNow;
            var nonExpired = allActive.Where(opp =>
            {
                if (opp.ApplicationDeadline.HasValue && opp.ApplicationDeadline.Value < now)
                {
                    return false;
                }
                if (opp.EffectiveTo.HasValue && opp.EffectiveTo.Value < now)
                {
                    return false;
                }
                return true;
            }).ToList();

            // Geographic prefiltering (national + target region)
            if (!string.IsNullOrWhiteSpace(region))
            {
                return nonExpired.Where(opp =>
                    opp.GeographicScope == "National" ||
                    opp.GeographicScope == "European" ||
                    opp.EligibleLocations == null ||
                    !opp.EligibleLocations.Any() ||
                    opp.EligibleLocations.Any(loc => loc.Equals(region, StringComparison.OrdinalIgnoreCase))
                ).ToList();
            }

            return nonExpired;
        }

        public async Task<SupportOpportunity?> GetOpportunityByIdAsync(string opportunityId)
        {
            return await _context.SupportOpportunities
                .Find(o => o.ExternalId == opportunityId || o.Id.ToString() == opportunityId)
                .FirstOrDefaultAsync();
        }

        public async Task<List<SupportSourceRegistryRecord>> GetSourceRegistryAsync()
        {
            return await _context.SupportSourceRegistry.Find(_ => true).ToListAsync();
        }

        public async Task SyncSourceAsync(string sourceId)
        {
            var adapter = _adapters.FirstOrDefault(a => a.SourceId == sourceId);
            if (adapter == null) return;

            var opportunities = await adapter.FetchAndNormalizeAsync();
            foreach (var opp in opportunities)
            {
                var existing = await _context.SupportOpportunities.Find(o => o.ExternalId == opp.ExternalId).FirstOrDefaultAsync();
                if (existing != null)
                {
                    opp.Id = existing.Id;
                    await _context.SupportOpportunities.ReplaceOneAsync(o => o.Id == existing.Id, opp);
                }
                else
                {
                    await _context.SupportOpportunities.InsertOneAsync(opp);
                }
                await RecordSnapshotAsync(opp.SourceId, opp.ExternalId, opp.RawSourceFingerprint);
            }

            await _context.SupportSourceRegistry.UpdateOneAsync(
                r => r.SourceId == sourceId,
                Builders<SupportSourceRegistryRecord>.Update
                    .Set(r => r.LastSuccessfulSyncAt, DateTime.UtcNow)
                    .Set(r => r.LastCheckedAt, DateTime.UtcNow));
        }

        public async Task<bool> IsSourceFreshAsync(string sourceId)
        {
            var registry = await _context.SupportSourceRegistry.Find(r => r.SourceId == sourceId).FirstOrDefaultAsync();
            if (registry == null || !registry.LastCheckedAt.HasValue) return false;

            var adapter = _adapters.FirstOrDefault(a => a.SourceId == sourceId);
            if (adapter != null)
            {
                return await adapter.ValidateFreshnessAsync(registry.LastCheckedAt.Value);
            }

            return (DateTime.UtcNow - registry.LastCheckedAt.Value).TotalDays < 60;
        }

        public async Task<SupportSourceSnapshot> RecordSnapshotAsync(string sourceId, string externalId, string? payload = null)
        {
            var adapter = _adapters.FirstOrDefault(a => a.SourceId == sourceId);
            SupportSourceSnapshot snapshot;
            if (adapter != null)
            {
                snapshot = await adapter.CreateSnapshotAsync(externalId, payload);
            }
            else
            {
                snapshot = new SupportSourceSnapshot
                {
                    SourceId = sourceId,
                    OpportunityExternalId = externalId,
                    RetrievedAt = DateTime.UtcNow,
                    SourceUpdatedAt = DateTime.UtcNow,
                    ContentFingerprint = $"fp-{sourceId}-{externalId}",
                    ParserVersion = "1.0",
                    NormalizationVersion = "1.0",
                    RawPayload = payload
                };
            }

            await _context.SupportSourceSnapshots.InsertOneAsync(snapshot);
            return snapshot;
        }
    }
}
