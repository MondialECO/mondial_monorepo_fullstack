using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Implementations;

/// <summary>
/// Post-completion side effects fired when an entrepreneur completes Phase 5.
/// Mirrors <see cref="Phase3CompletionEvents"/> and <see cref="Phase4CompletionEvents"/>:
/// best-effort: catches every exception so it can never block or fail the phase
/// advance, but logs failures (via the supplied <see cref="ILogger"/>) instead
/// of swallowing them silently.
///
/// 5a) bump InvestorReadyScore (+13, clamp 100)
/// 5b) bump TrustScore (+10, clamp 100)
/// 5c) set FundingAskLive = true
/// 5d) enqueue the equity-offer snapshot to the Smart Matchmaking outbox
///     (idempotent upsert keyed on "{companyId}:phase5")
/// </summary>
public static class Phase5CompletionEvents
{
    public static async Task RunAsync(MongoDbContext db, Companies company, ILogger? logger = null)
    {
        try
        {
            logger?.LogInformation("Phase5CompletionEvents starting for {CompanyId}", company.Id);

            // Idempotency guard: AdvancePhaseAsync already blocks a second
            // advance (CurrentPhase has moved past 5), but if these events are
            // ever re-driven, FundingAskLive==true means scores were already
            // bumped — skip to avoid double-incrementing. The queue upsert below
            // is independently idempotent (deterministic _id).
            if (company.FundingAskLive == true)
            {
                logger?.LogInformation(
                    "Phase5CompletionEvents skipped for {CompanyId}: already processed.", company.Id);
                return;
            }

            // 5a + 5b + 5c — running scores (clamped) and the funding-live flag,
            // persisted together.
            var newInvestorReady = Math.Min(100,
                (company.InvestorReadyScore ?? 0) + Phase5Requirements.InvestorReadyScoreIncrement);
            var newTrust = Math.Min(100,
                company.TrustScore + Phase5Requirements.TrustScoreIncrement);

            await db.Companies.UpdateOneAsync(
                Builders<Companies>.Filter.Eq(c => c.Id, company.Id),
                Builders<Companies>.Update
                    .Set(c => c.InvestorReadyScore, newInvestorReady)
                    .Set(c => c.TrustScore, newTrust)
                    .Set(c => c.FundingAskLive, true)
                    .Set(c => c.UpdatedAt, DateTime.UtcNow));

            company.InvestorReadyScore = newInvestorReady;
            company.TrustScore = newTrust;
            company.FundingAskLive = true;

            // 5d — enqueue the equity offer snapshot, read inline from Companies.
            // min_ticket comes from the explicit MinimumTicketEur field — never
            // derived from a capital-allocation row.
            BsonValue minTicket = company.MinimumTicketEur.HasValue
                ? new BsonDouble(company.MinimumTicketEur.Value)
                : BsonNull.Value;

            var idempotencyKey = $"{company.Id}:phase5";

            var payload = new BsonDocument
            {
                { "idempotency_key", idempotencyKey },
                { "entrepreneur_id", company.Id },
                { "phase5_complete", true },
                { "funding_ask_live", true },
                { "equity_offer", new BsonDocument
                    {
                        { "amount", Num(company.FundingAskAmount) },
                        { "round", Str(company.FundingRoundType) },
                        { "pre_money", Num(company.PreMoneyValuation) },
                        { "equity_pct", Num(company.EquityOfferedPercent) },
                        { "share_type", Str(company.ShareType) },
                        { "min_ticket", minTicket },
                    }
                },
                { "scores", new BsonDocument
                    {
                        { "investor_ready_score", newInvestorReady },
                        { "trust_score", newTrust },
                    }
                },
            };

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

            logger?.LogInformation(
                "Phase5CompletionEvents complete for {CompanyId}. IRS={IRS}, Trust={Trust}, queue enqueued.",
                company.Id, newInvestorReady, newTrust);
        }
        catch (Exception ex)
        {
            // Best-effort: never break the phase advance, but surface the failure
            // so incomplete scores / queue entries are diagnosable.
            logger?.LogError(ex,
                "Phase5CompletionEvents failed for {CompanyId}. Scores/FundingAskLive/queue may be incomplete.",
                company.Id);
        }
    }

    private static BsonValue Num(double? d) => d.HasValue ? new BsonDouble(d.Value) : BsonNull.Value;
    private static BsonValue Str(string? s) => s == null ? BsonNull.Value : new BsonString(s);

    private static string DeterministicObjectId(string key)
    {
        var hash = MD5.HashData(Encoding.UTF8.GetBytes(key));
        return new ObjectId(hash[..12]).ToString();
    }
}
