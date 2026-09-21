using System.Threading.Tasks;
using WebApp.Models.DatabaseModels.Phase4;

namespace WebApp.Services.Interface
{
    public interface IPricingStrategyService
    {
        Task<PricingStrategyResponse> GetPricingStrategyAsync(string userId, string? ideaId = null);
        Task<PricingStrategyResponse> GeneratePricingStrategyAsync(string userId, string? ideaId = null);
        Task<PricingStrategyResponse> RefreshPricingStrategyAsync(string userId, string? ideaId = null);
        Task<PricingStrategyResponse> UpdatePricingOfferAsync(string userId, string offerKey, UpdatePricingOfferRequest request);
    }
}
