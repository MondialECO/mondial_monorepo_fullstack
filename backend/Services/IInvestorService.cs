using WebApp.Models.DatabaseModels;

namespace WebApp.Services;

public interface IInvestorService
{
    Task<Investor> CreateInvestorAsync(Investor investor);
    Task<Investor> GetInvestorAsync(string investorId);
    Task<List<Investor>> GetAllActiveInvestorsAsync();
    Task<List<Investor>> FindInvestorsByPreferencesAsync(
        List<string> sectors,
        List<string> stages,
        double minCheckSize,
        double maxCheckSize,
        string geography);
    Task<Investor> UpdateInvestorAsync(string investorId, Investor investor);
    Task DeleteInvestorAsync(string investorId);
    Task<int> GetInvestorMatchCountAsync(string investorId);
}
