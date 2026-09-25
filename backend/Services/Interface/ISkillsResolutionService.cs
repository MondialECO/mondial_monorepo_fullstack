using System.Threading.Tasks;
using WebApp.Models.DatabaseModels.Phase4;

namespace WebApp.Services.Interface
{
    public interface ISkillsResolutionService
    {
        Task<SkillsPlanResponse> GetSkillsPlanAsync(string userId, string? ideaId = null);
        Task<SkillsPlanResponse> GenerateSkillsPlanAsync(string userId, string? ideaId = null);
        Task<SkillsPlanResponse> RefreshSkillsPlanAsync(string userId, string? ideaId = null);
        Task<SkillsPlanResponse> KeepCurrentSkillsPlanAsync(string userId, string? ideaId = null);
        Task<SkillsPlanResponse> UpdateResolutionAsync(string userId, string resolutionKey, UpdateResolutionRequest request);
    }
}
