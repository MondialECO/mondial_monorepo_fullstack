using System.Threading.Tasks;
using WebApp.Models.DatabaseModels.Phase4;

namespace WebApp.Services.Interface
{
    public interface ISupportPlanService
    {
        Task<SupportPlanResponse> GetSupportPlanAsync(string userId, string? ideaId = null);
        Task<SupportPlanResponse> GenerateSupportPlanAsync(string userId, string? ideaId = null);
        Task<SupportPlanResponse> RefreshSupportPlanAsync(string userId, string? ideaId = null);
        Task<SupportPlanResponse> UpdateFounderSupportStateAsync(string userId, string matchKey, UpdateFounderSupportStateRequest request);
        Task<SupportPlanResponse> AnswerEligibilityFactAsync(string userId, string factKey, string value, string? ideaId = null);
    }
}
