using MongoDB.Bson;
using WebApp.Models.DatabaseModels;
using WebApp.DbContext;

namespace WebApp.Services.Implementations;

public class InvestorMatcher : IInvestorMatcher
{
    private readonly MongoDbContext _dbContext;
    private readonly IInvestorService _investorService;
    private readonly ILogger<InvestorMatcher> _logger;

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
        var matches = new List<InvestorMatch>();

        // If no specific pool provided, find all active investors
        if (investorPoolIds == null || investorPoolIds.Count == 0)
        {
            var allInvestors = await _investorService.GetAllActiveInvestorsAsync();
            investorPoolIds = allInvestors.Select(i => i.Id).ToList();
        }

        foreach (var investorId in investorPoolIds)
        {
            try
            {
                var score = await CalculateMatchScoreAsync(company, investorId);

                // Only include if score is reasonably high
                if (score >= 40)
                {
                    var investor = await _investorService.GetInvestorAsync(investorId);

                    var match = new InvestorMatch
                    {
                        CompanyId = company.Id,
                        InvestorId = investorId,
                        MatchScore = score,
                        Status = "new",
                        InvestorPreferences = new InvestorPreferences
                        {
                            PreferredSectors = investor.PreferredSectors,
                            PreferredStages = investor.PreferredStages,
                            MinInvestmentAmount = investor.MinCheckSize,
                            MaxInvestmentAmount = investor.MaxCheckSize,
                            PreferredGeographies = investor.PreferredGeographies,
                            PreRataRightsRequired = investor.RequiresProRataRights,
                            BoardSeatRequired = investor.RequiresBoardSeat
                        },
                        Interactions = new List<InteractionRecord>(),
                        MatchedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    await _dbContext.InvestorMatches.InsertOneAsync(match);
                    matches.Add(match);
                }
            }
            catch (KeyNotFoundException)
            {
                _logger.LogWarning($"Investor {investorId} not found during matching");
            }
        }

        return matches.OrderByDescending(m => m.MatchScore).ToList();
    }

    public async Task<int> CalculateMatchScoreAsync(Companies company, string investorId)
    {
        return await Task.Run(() =>
        {
            int score = 0;

            // Stage alignment (0-25 points)
            var fundingRound = company.FundingRoundType?.ToLower() ?? "seed";
            score += fundingRound switch
            {
                "pre_seed" => 25,
                "seed" => 25,
                "series_a" => 20,
                "series_b" => 15,
                _ => 10
            };

            // Geography match (0-20 points)
            if (!string.IsNullOrEmpty(company.Country))
            {
                score += 20; // Placeholder - would check investor geography preferences
            }

            // Industry/sector alignment (0-30 points)
            if (!string.IsNullOrEmpty(company.Industry))
            {
                var techIndustries = new[] { "saas", "fintech", "healthtech", "edtech", "ai" };
                score += techIndustries.Contains(company.Industry.ToLower()) ? 30 : 15;
            }

            // Funding amount match (0-25 points)
            var askAmount = company.FundingAskAmount ?? 0;
            if (askAmount > 0)
            {
                // Assumes typical seed round is $500k-$2M
                if (askAmount >= 500000 && askAmount <= 2000000)
                    score += 25;
                else if (askAmount >= 100000 && askAmount <= 5000000)
                    score += 15;
                else
                    score += 5;
            }

            // Valuation reasonability (0-20 points)
            var valuation = company.Valuation ?? 0;
            if (valuation > 0 && askAmount > 0)
            {
                var percentageAsked = (askAmount / valuation) * 100;
                // Sweet spot is 15-35% dilution
                if (percentageAsked >= 15 && percentageAsked <= 35)
                    score += 20;
                else if (percentageAsked >= 10 && percentageAsked <= 50)
                    score += 10;
            }

            return Math.Min(score, 100);
        });
    }
}
