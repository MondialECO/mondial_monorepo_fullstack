using System.Threading.Tasks;
using WebApp.Models.DatabaseModels.Phase4;

namespace WebApp.Services.Interface
{
    public interface INeedsAnalysisService
    {
        Task<NeedsAnalysisResponse> GetNeedsAnalysisAsync(string userId, string? ideaId = null);
        Task<NeedsAnalysisResponse> GenerateNeedsAnalysisAsync(string userId, string? ideaId = null);
        Task<NeedsAnalysisResponse> RefreshNeedsAnalysisAsync(string userId, string? ideaId = null);
        Task<NeedsAnalysisResponse> UpdateNeedStateAsync(string userId, string needKey, UpdateNeedStateRequest request);
    }
}
