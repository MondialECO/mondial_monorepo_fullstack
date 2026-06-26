using System.Security.Cryptography;
using System.Text;
using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Implementations;

/// <summary>
/// Post-completion side effects fired when an entrepreneur completes Phase 4.
/// Mirrors <see cref="Phase3CompletionEvents"/>: best-effort, fire-and-forget,
/// swallows all exceptions so it can never block or fail the phase advance.
///
/// 4a) bump InvestorReadyScore (+12, clamp 100)
/// 4b) bump TrustScore (+15, clamp 100)
/// 4c) enqueue the cap-table snapshot to the Smart Matchmaking outbox
///     (idempotent upsert keyed on "{companyId}:phase4")
/// </summary>
public static class Phase4CompletionEvents
{
    public static async Task RunAsync(MongoDbContext db, Companies company)
    {
        try
        {
            // 4a + 4b — running scores, clamped at 100, persisted together.
            var newInvestorReady = Math.Min(100, (company.InvestorReadyScore ?? 0) + 12);
            var newTrust = Math.Min(100, company.TrustScore + 15);

            await db.Companies.UpdateOneAsync(
                Builders<Companies>.Filter.Eq(c => c.Id, company.Id),
                Builders<Companies>.Update
                    .Set(c => c.InvestorReadyScore, newInvestorReady)
                    .Set(c => c.TrustScore, newTrust)
                    .Set(c => c.UpdatedAt, DateTime.UtcNow));

            company.InvestorReadyScore = newInvestorReady;
            company.TrustScore = newTrust;

            // 4c — enqueue the latest cap table snapshot to the matchmaking outbox.
            var capTable = await db.Phase4CapTables
                .Find(c => c.CompanyId == company.Id)
                .SortByDescending(c => c.RecordedAt)
                .FirstOrDefaultAsync();

            var founderCount = capTable?.Grants.Count(g =>
                string.Equals(g.StakeholderType, "founder", StringComparison.OrdinalIgnoreCase)) ?? 0;
            var investorCount = capTable?.Grants.Count(g =>
                string.Equals(g.StakeholderType, "investor", StringComparison.OrdinalIgnoreCase)) ?? 0;

            var idempotencyKey = $"{company.Id}:phase4";

            var payload = new BsonDocument
            {
                { "idempotency_key", idempotencyKey },
                { "entrepreneur_id", company.Id },
                { "phase4_complete", true },
                { "equity", new BsonDocument
                    {
                        { "total_shares", capTable?.TotalShares ?? 0 },
                        { "esop_pool_percent", capTable?.EsopPoolPercent ?? 0 },
                        { "founder_grant_count", founderCount },
                        { "investor_grant_count", investorCount },
                    }
                },
                { "scores", new BsonDocument
                    {
                        { "investor_ready_score", newInvestorReady },
                        { "trust_score", newTrust },
                    }
                },
            };

            // Idempotent upsert: deterministic _id from the idempotency key keeps
            // re-runs from duplicating the row (and avoids an _id mutation on
            // replace). Same outbox the Phase 3 completion writes to.
            var deterministicId = DeterministicObjectId(idempotencyKey);
            await db.MatchmakingQueue.ReplaceOneAsync(
                Builders<MatchmakingQueueItem>.Filter.Eq(x => x.Id, deterministicId),
                new MatchmakingQueueItem
                {
                    Id = deterministicId,
                    CompanyId = company.Id,
                    Payload = payload,
                    Status = "pending",
                    CreatedAt = DateTime.UtcNow,
                },
                new ReplaceOptions { IsUpsert = true });
        }
        catch
        {
            // Intentionally swallowed: completion events are best-effort and must
            // never break the phase advance.
        }
    }

    private static string DeterministicObjectId(string key)
    {
        var hash = MD5.HashData(Encoding.UTF8.GetBytes(key));
        return new ObjectId(hash[..12]).ToString();
    }
}
