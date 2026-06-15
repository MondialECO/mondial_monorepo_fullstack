using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Implementations;

/// <summary>
/// Post-completion side effects fired when an entrepreneur completes Phase 3.
/// These MUST NOT block or fail the phase advance — <see cref="RunAsync"/>
/// swallows all exceptions so the advance response is never affected.
///
/// 5a) bump InvestorReadyScore (+18, clamp 100)
/// 5b) bump TrustScore (+20, clamp 100)
/// 5c) enqueue the Smart Matchmaking payload (no live event bus → MatchmakingQueue outbox)
/// </summary>
public static class Phase3CompletionEvents
{
    public static async Task RunAsync(MongoDbContext db, Companies company)
    {
        try
        {
            // 5a + 5b — running scores, clamped at 100, persisted together.
            var newInvestorReady = Math.Min(100, (company.InvestorReadyScore ?? 0) + 18);
            var newTrust = Math.Min(100, company.TrustScore + 20);

            await db.Companies.UpdateOneAsync(
                Builders<Companies>.Filter.Eq(c => c.Id, company.Id),
                Builders<Companies>.Update
                    .Set(c => c.InvestorReadyScore, newInvestorReady)
                    .Set(c => c.TrustScore, newTrust)
                    .Set(c => c.UpdatedAt, DateTime.UtcNow));

            company.InvestorReadyScore = newInvestorReady;
            company.TrustScore = newTrust;

            // 5c — build the matchmaking payload from the latest KPI + concept.
            var kpi = await db.Phase3Kpis
                .Find(k => k.CompanyId == company.Id)
                .SortByDescending(k => k.RecordedAt)
                .FirstOrDefaultAsync();
            var concept = await db.Phase3Concepts
                .Find(c => c.CompanyId == company.Id)
                .FirstOrDefaultAsync();

            var ttm = (company.Q1Revenue ?? 0) + (company.Q2Revenue ?? 0)
                      + (company.Q3Revenue ?? 0) + (company.Q4Revenue ?? 0);
            var growthPct = ComputeGrowthPct(company);

            BsonValue ltvCac = kpi != null && kpi.Cac > 0 ? kpi.Ltv / kpi.Cac : BsonNull.Value;
            BsonValue burnMultiple =
                company.MonthlyBurn is > 0 && kpi != null && kpi.Arr > 0
                    ? company.MonthlyBurn.Value / (kpi.Arr / 12)
                    : BsonNull.Value;

            var payload = new BsonDocument
            {
                { "entrepreneur_id", company.Id },
                { "phase3_complete", true },
                { "financials", new BsonDocument
                    {
                        { "TTM_revenue", ttm },
                        { "avg_quarterly_growth", growthPct },
                        { "final_valuation", company.Valuation ?? 0 },
                        { "valuation_currency", "EUR" },
                        { "sector_multiplier", company.ValuationRevenueMultiple ?? 0 },
                        { "risk_discount_rate", company.ValuationRiskDiscountRate ?? 0 },
                    }
                },
                { "kpis", new BsonDocument
                    {
                        { "MRR", kpi?.Mrr ?? 0 },
                        { "ARR", kpi?.Arr ?? 0 },
                        { "LTV_CAC_ratio", ltvCac },
                        { "burn_multiple", burnMultiple },
                        { "churn_rate", kpi?.ChurnPercent ?? 0 },
                        { "NPS", company.Nps.HasValue ? new BsonInt32(company.Nps.Value) : BsonNull.Value },
                        { "data_source", "manual" },
                    }
                },
                { "concept", new BsonDocument
                    {
                        { "stage", Str(concept?.Stage) },
                        { "business_model", Str(concept?.BusinessModel) },
                        { "sector_tags", new BsonArray(concept?.SectorTags ?? new List<string>()) },
                        { "keyword_tags", new BsonArray(concept?.KeywordTags ?? new List<string>()) },
                    }
                },
                { "scores", new BsonDocument
                    {
                        { "investor_ready_score", newInvestorReady },
                        { "trust_score", newTrust },
                        { "phase3_overall_score", 100 },
                    }
                },
            };

            await db.MatchmakingQueue.InsertOneAsync(new MatchmakingQueueItem
            {
                CompanyId = company.Id,
                Payload = payload,
                Status = "pending",
                CreatedAt = DateTime.UtcNow,
            });
        }
        catch
        {
            // Intentionally swallowed: completion events are best-effort and must
            // never break the phase advance. (No ILogger here; controller logs the
            // advance itself.)
        }
    }

    private static BsonValue Str(string? s) => s == null ? BsonNull.Value : new BsonString(s);

    private static double ComputeGrowthPct(Companies c)
    {
        var r = new[] { c.Q1Revenue ?? 0, c.Q2Revenue ?? 0, c.Q3Revenue ?? 0, c.Q4Revenue ?? 0 };
        if (r[0] == 0) return 0;
        var g1 = (r[1] - r[0]) / r[0];
        var g2 = r[1] != 0 ? (r[2] - r[1]) / r[1] : 0;
        var g3 = r[2] != 0 ? (r[3] - r[2]) / r[2] : 0;
        return ((g1 + g2 + g3) / 3) * 100;
    }
}
