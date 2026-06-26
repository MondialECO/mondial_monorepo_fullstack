using WebApp.Models.DatabaseModels;

namespace WebApp.Services;

public interface IInvestorMatcher
{
    Task<List<InvestorMatch>> FindMatchesAsync(
        Companies company,
        List<string> investorPoolIds
    );

    Task<int> CalculateMatchScoreAsync(
        Companies company,
        string investorId
    );
}
