using MongoDB.Bson;
using WebApp.Models.DatabaseModels;
using WebApp.DbContext;

namespace WebApp.Services.Implementations;

/// <summary>
/// Automated Investor Matching engine.
///
/// ====================================================================
/// CURRENT MODE: deterministic rule-based matcher over real Investor
/// profile fields (PreferredSectors, PreferredStages, MinCheckSize /
/// MaxCheckSize, PreferredGeographies, RequiresProRataRights /
/// RequiresBoardSeat) intersected with company state (Industry,
/// FundingRoundType, FundingAskAmount, Country, ShareType posture).
/// ====================================================================
/// This is NOT an LLM-based matcher. It is NOT "AI" matching. Despite the
/// legacy class name being used by the rest of the app, the engine is a
/// per-investor weighted intersection scorer. Each investor receives a
/// distinct score driven by their own preferences; the per-match
/// <c>MatchRationale</c> is built deterministically from the dimensions
/// that hit and missed.
///
/// All user-facing copy should say "Automated Investor Matching", NOT
/// "AI Matching" / "AI Matched" / "AI-powered" — see the dev banner in
/// the Phase 8 frontend page.
///
/// ====================================================================
/// FUTURE LLM INTEGRATION (P1 — DO NOT WIRE YET, NO PROVIDER CREDENTIALS).
/// ====================================================================
/// When the org has Claude/OpenAI/Anthropic credentials and a budget for
/// inference, replace <see cref="CalculateMatchScoreAsync"/> with the flow
/// described inline below. Keep the rule-based matcher as the
/// no-credentials fallback so dev / CI runs do not require a network call.
/// EngineVersion on the persisted match identifies which engine produced it.
/// </summary>
public class InvestorMatcher : IInvestorMatcher
{
    private readonly MongoDbContext _dbContext;
    private readonly IInvestorService _investorService;
    private readonly ILogger<InvestorMatcher> _logger;

    public const string EngineVersion = "rule_based_v1";

    public InvestorMatcher(
        MongoDbContext dbContext,
        IInvestorService investorService,
        ILogger<InvestorMatcher> logger)
    {
        _dbContext = dbContext;
        _investorService = investorService;
        _logger = logger;
    }

    public async Task<List<InvestorMatch>> FindMatchesAsync(
        Companies company,
        List<string> investorPoolIds)
    {
        // --- FUTURE LLM step 1: assemble a deterministic company snapshot ---
        // var companySnapshot = CompanySnapshotBuilder.Build(company,
        //     capTable, fundingProfile, dataRoom, /* etc */);
        // Hash the snapshot for prompt-cache keying.

        var matches = new List<InvestorMatch>();

        if (investorPoolIds == null || investorPoolIds.Count == 0)
        {
            var allInvestors = await _investorService.GetAllActiveInvestorsAsync();
            investorPoolIds = allInvestors.Select(i => i.Id).ToList();
        }

        // Replace any prior matches for this company so the persisted set
        // always reflects the latest engine run. Interaction history per
        // (company, investor) is intentionally NOT preserved here: when an
        // interaction-preserving model is needed, switch to an upsert by
        // (CompanyId, InvestorId) and merge Interactions.
        await _dbContext.InvestorMatches.DeleteManyAsync(
            MongoDB.Driver.Builders<InvestorMatch>.Filter.Eq(m => m.CompanyId, company.Id));

        foreach (var investorId in investorPoolIds)
        {
            try
            {
                var investor = await _investorService.GetInvestorAsync(investorId);

                // --- FUTURE LLM step 2: call the model to rank this pair ---
                // var llmRaw = await _llmProvider.RankAsync(companySnapshot, investorSnapshot);
                // var (parsedScore, parsedRationale) = SchemaValidator.Parse(llmRaw);
                // if (parse failed OR no credentials) FALL BACK TO the rule scorer below.

                var (score, rationale) = ScoreAndExplain(company, investor);

                if (score < Phase8Requirements.MinScoreToCount)
                    continue;

                var investmentRangeSnapshot = investor.MaxCheckSize > 0
                    ? $"EUR {investor.MinCheckSize:N0}-{investor.MaxCheckSize:N0}"
                    : "EUR (range unset)";

                var match = new InvestorMatch
                {
                    Id = ObjectId.GenerateNewId().ToString(),
                    CompanyId = company.Id,
                    InvestorId = investorId,
                    MatchScore = score,
                    MatchRationale = rationale,
                    EngineVersion = EngineVersion,
                    Status = "new",
                    InvestorPreferences = new InvestorPreferences
                    {
                        PreferredSectors = investor.PreferredSectors,
                        PreferredStages = investor.PreferredStages,
                        MinInvestmentAmount = investor.MinCheckSize,
                        MaxInvestmentAmount = investor.MaxCheckSize,
                        PreferredGeographies = investor.PreferredGeographies,
                        PreRataRightsRequired = investor.RequiresProRataRights,
                        BoardSeatRequired = investor.RequiresBoardSeat,
                    },
                    InvestorNameSnapshot = investor.Name ?? investor.Id,
                    InvestorTypeSnapshot = investor.Type ?? "(unspecified)",
                    InvestmentRangeSnapshot = investmentRangeSnapshot,
                    PreferredSectorsSnapshot = investor.PreferredSectors?.ToList() ?? new List<string>(),
                    Interactions = new List<InteractionRecord>(),
                    MatchedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                };

                await _dbContext.InvestorMatches.InsertOneAsync(match);
                matches.Add(match);
            }
            catch (KeyNotFoundException)
            {
                _logger.LogWarning($"Investor {investorId} not found during matching");
            }
        }

        return matches.OrderByDescending(m => m.MatchScore).ToList();
    }

    // Interface signature retained for backward-compat callers; the new
    // ScoreAndExplain method is the actual implementation.
    public async Task<int> CalculateMatchScoreAsync(Companies company, string investorId)
    {
        var investor = await _investorService.GetInvestorAsync(investorId);
        var (score, _) = ScoreAndExplain(company, investor);
        return score;
    }

    /// <summary>
    /// Deterministic, weighted intersection between company state and
    /// investor preferences across the full set of product-doc dimensions.
    /// Returns the 0-100 score plus a human-readable rationale that names
    /// every scored dimension (hit or miss).
    ///
    /// Weights (sum = 100):
    ///   Sector              0-25  (Industry  ∩ PreferredSectors)
    ///   Stage               0-15  (FundingRoundType ∩ PreferredStages)
    ///   Check-size band     0-20  (FundingAskAmount in [Min,Max] CheckSize)
    ///   Geography           0-10  (Country   ∩ PreferredGeographies)
    ///   Share-type fit      0-5   (ShareType ∩ PreferredEquityTypes)
    ///   Investment history  0-10  (SuccessfulExits / CompletedDeals /
    ///                              ActiveInvestments / AverageCheckSize fit)
    ///   Revenue stage       0-7   (derived from Q1-Q4 totals, intersected
    ///                              with investor PreferredStages)
    ///   Market size         0-4   (Companies.MarketSizeEstimate bands)
    ///   Growth potential    0-4   (Companies.GrowthPotentialScore 0-100)
    /// </summary>
    internal (int Score, string Rationale) ScoreAndExplain(Companies company, Investor investor)
    {
        var hits = new List<string>();
        var misses = new List<string>();
        int score = 0;

        // ---- Sector (0-25) -------------------------------------------------
        if (!string.IsNullOrWhiteSpace(company.Industry))
        {
            if (investor.PreferredSectors?.Any(s =>
                    string.Equals(s, company.Industry, StringComparison.OrdinalIgnoreCase)) == true)
            {
                score += 25;
                hits.Add($"sector match ({company.Industry})");
            }
            else if (investor.PreferredSectors == null || investor.PreferredSectors.Count == 0)
            {
                score += 12;
                hits.Add("investor sector-agnostic");
            }
            else
            {
                misses.Add($"sector mismatch (company={company.Industry}, investor prefers {string.Join("/", investor.PreferredSectors)})");
            }
        }
        else
        {
            misses.Add("sector not evaluable (company industry unset)");
        }

        // ---- Stage (0-15) --------------------------------------------------
        if (!string.IsNullOrWhiteSpace(company.FundingRoundType))
        {
            if (investor.PreferredStages?.Any(s =>
                    string.Equals(s, company.FundingRoundType, StringComparison.OrdinalIgnoreCase)) == true)
            {
                score += 15;
                hits.Add($"stage match ({company.FundingRoundType})");
            }
            else if (investor.PreferredStages == null || investor.PreferredStages.Count == 0)
            {
                score += 7;
                hits.Add("investor stage-agnostic");
            }
            else
            {
                misses.Add($"stage mismatch (company={company.FundingRoundType}, investor prefers {string.Join("/", investor.PreferredStages)})");
            }
        }
        else
        {
            misses.Add("stage not evaluable (company funding round unset)");
        }

        // ---- Check-size band (0-20) ---------------------------------------
        var ask = company.FundingAskAmount ?? 0;
        if (ask > 0 && investor.MaxCheckSize > 0)
        {
            if (ask >= investor.MinCheckSize && ask <= investor.MaxCheckSize)
            {
                score += 20;
                hits.Add($"check size in band (ask EUR {ask:N0} within EUR {investor.MinCheckSize:N0}-{investor.MaxCheckSize:N0})");
            }
            else if (ask >= investor.MinCheckSize * 0.5 && ask <= investor.MaxCheckSize * 1.5)
            {
                score += 8;
                hits.Add("check size adjacent to band");
            }
            else
            {
                misses.Add($"check size outside band (ask EUR {ask:N0} vs investor EUR {investor.MinCheckSize:N0}-{investor.MaxCheckSize:N0})");
            }
        }
        else
        {
            misses.Add("check-size not evaluable (missing ask or investor band)");
        }

        // ---- Geography (0-10) ----------------------------------------------
        if (!string.IsNullOrWhiteSpace(company.Country))
        {
            if (investor.PreferredGeographies?.Any(g =>
                    string.Equals(g, company.Country, StringComparison.OrdinalIgnoreCase)) == true)
            {
                score += 10;
                hits.Add($"geography match ({company.Country})");
            }
            else if (investor.PreferredGeographies == null || investor.PreferredGeographies.Count == 0)
            {
                score += 5;
                hits.Add("investor geography-agnostic");
            }
            else
            {
                misses.Add($"geography mismatch (company={company.Country}, investor prefers {string.Join("/", investor.PreferredGeographies)})");
            }
        }
        else
        {
            misses.Add("geography not evaluable (company country unset)");
        }

        // ---- Share type (0-5) ---------------------------------------------
        if (!string.IsNullOrWhiteSpace(company.ShareType) &&
            investor.PreferredEquityTypes?.Count > 0)
        {
            if (investor.PreferredEquityTypes.Any(t =>
                    string.Equals(t, company.ShareType, StringComparison.OrdinalIgnoreCase)))
            {
                score += 5;
                hits.Add($"share-type match ({company.ShareType})");
            }
            else
            {
                misses.Add($"share-type mismatch (company={company.ShareType}, investor prefers {string.Join("/", investor.PreferredEquityTypes)})");
            }
        }
        else
        {
            misses.Add("share-type not evaluable (company shareType or investor equity types unset)");
        }

        // ---- Investment history (0-10) ------------------------------------
        // Active, experienced investors deploying near the ask size score highest.
        // Brand-new / dormant investors score lower; misalignment with average
        // ticket size further reduces confidence.
        {
            int historyPoints = 0;
            var historyHits = new List<string>();
            var historyMisses = new List<string>();

            // Experience: completed deals + exits.
            if (investor.CompletedDeals >= 10 || investor.SuccessfulExits >= 2)
            {
                historyPoints += 4;
                historyHits.Add($"experienced ({investor.CompletedDeals} deals, {investor.SuccessfulExits} exits)");
            }
            else if (investor.CompletedDeals >= 3 || investor.SuccessfulExits >= 1)
            {
                historyPoints += 2;
                historyHits.Add($"some track record ({investor.CompletedDeals} deals, {investor.SuccessfulExits} exits)");
            }
            else
            {
                historyMisses.Add("limited deal history (< 3 completed deals, 0 exits)");
            }

            // Activity: still investing.
            if (investor.ActiveInvestments > 0)
            {
                historyPoints += 3;
                historyHits.Add($"active ({investor.ActiveInvestments} live investments)");
            }
            else
            {
                historyMisses.Add("inactive (no live investments on file)");
            }

            // Average check fit: ask within 0.5x-2x of investor's historical avg.
            if (ask > 0 && investor.AverageCheckSize > 0)
            {
                var ratio = ask / investor.AverageCheckSize;
                if (ratio >= 0.5 && ratio <= 2.0)
                {
                    historyPoints += 3;
                    historyHits.Add($"ask aligns with historical avg check (EUR {investor.AverageCheckSize:N0})");
                }
                else
                {
                    historyMisses.Add($"ask diverges from historical avg check (ask EUR {ask:N0} vs avg EUR {investor.AverageCheckSize:N0})");
                }
            }
            else
            {
                historyMisses.Add("historical check-size fit not evaluable");
            }

            score += historyPoints;
            hits.AddRange(historyHits.Select(h => "investment-history: " + h));
            misses.AddRange(historyMisses.Select(m => "investment-history: " + m));
        }

        // ---- Revenue stage (0-7) ------------------------------------------
        // Derive a revenue classification from Q1-Q4 totals and intersect
        // with the investor's PreferredStages (proxy for revenue appetite).
        {
            var revenue = (company.Q1Revenue ?? 0) + (company.Q2Revenue ?? 0)
                          + (company.Q3Revenue ?? 0) + (company.Q4Revenue ?? 0);
            string revenueStage;
            string[] compatibleInvestorStages;
            if (revenue <= 0)
            {
                revenueStage = "pre-revenue";
                compatibleInvestorStages = new[] { "pre_seed", "seed" };
            }
            else if (revenue < 250_000)
            {
                revenueStage = "early-revenue";
                compatibleInvestorStages = new[] { "pre_seed", "seed" };
            }
            else if (revenue < 2_000_000)
            {
                revenueStage = "scaling";
                compatibleInvestorStages = new[] { "seed", "series_a" };
            }
            else
            {
                revenueStage = "growth-stage";
                compatibleInvestorStages = new[] { "series_a", "series_b", "series_c" };
            }

            if (investor.PreferredStages == null || investor.PreferredStages.Count == 0)
            {
                score += 3;
                hits.Add($"revenue-stage: {revenueStage} (investor stage-agnostic)");
            }
            else if (investor.PreferredStages.Any(s =>
                         compatibleInvestorStages.Any(c => string.Equals(c, s, StringComparison.OrdinalIgnoreCase))))
            {
                score += 7;
                hits.Add($"revenue-stage: {revenueStage} aligns with investor stage appetite");
            }
            else
            {
                misses.Add(
                    $"revenue-stage: {revenueStage} does not match investor stages ({string.Join("/", investor.PreferredStages)})");
            }
        }

        // ---- Market size (0-4) --------------------------------------------
        // Deterministic banding on the persisted MarketSizeEstimate (EUR TAM).
        {
            var market = company.MarketSizeEstimate ?? 0;
            if (market >= 1_000_000_000)        // >= EUR 1B TAM
            {
                score += 4;
                hits.Add($"market-size: EUR {market:N0} (large TAM)");
            }
            else if (market >= 100_000_000)
            {
                score += 3;
                hits.Add($"market-size: EUR {market:N0} (mid TAM)");
            }
            else if (market >= 10_000_000)
            {
                score += 1;
                hits.Add($"market-size: EUR {market:N0} (small TAM)");
            }
            else if (market > 0)
            {
                misses.Add($"market-size: EUR {market:N0} (tiny TAM, < EUR 10M)");
            }
            else
            {
                misses.Add("market-size not evaluable (MarketSizeEstimate unset)");
            }
        }

        // ---- Growth potential (0-4) ---------------------------------------
        // Deterministic banding on the persisted GrowthPotentialScore (0-100).
        // No AI estimates: the value is set by a backend input only.
        {
            var growth = company.GrowthPotentialScore ?? -1;
            if (growth >= 80)
            {
                score += 4;
                hits.Add($"growth-potential: {growth:F0}/100 (high)");
            }
            else if (growth >= 60)
            {
                score += 3;
                hits.Add($"growth-potential: {growth:F0}/100 (above average)");
            }
            else if (growth >= 40)
            {
                score += 2;
                hits.Add($"growth-potential: {growth:F0}/100 (average)");
            }
            else if (growth >= 0)
            {
                misses.Add($"growth-potential: {growth:F0}/100 (low)");
            }
            else
            {
                misses.Add("growth-potential not evaluable (GrowthPotentialScore unset)");
            }
        }

        // ---- Rationale string (must mention every dimension; hits + misses
        // together cover the full set) -------------------------------------
        var rationaleParts = new List<string>();
        if (hits.Count > 0) rationaleParts.Add("Hits: " + string.Join("; ", hits));
        if (misses.Count > 0) rationaleParts.Add("Misses: " + string.Join("; ", misses));
        var rationale = rationaleParts.Count > 0
            ? string.Join(" | ", rationaleParts)
            : "No scoring dimensions evaluable";

        // --- FUTURE LLM step 3: replace `rationale` above with the model's
        // free-form explanation, validated against a JSON schema. Keep the
        // deterministic template as fallback when validation fails or no
        // credentials are configured.

        return (Math.Min(score, 100), rationale);
    }
}
