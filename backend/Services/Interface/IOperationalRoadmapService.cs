using System.Threading.Tasks;
using WebApp.Models.DatabaseModels.Phase4;

namespace WebApp.Services.Interface
{
    public interface IOperationalRoadmapService
    {
        Task<OperationalRoadmapResponse> GetRoadmapAsync(string userId, string? ideaId = null);
        Task<OperationalRoadmapResponse> GenerateRoadmapAsync(string userId, string? ideaId = null);
        Task<OperationalRoadmapResponse> RefreshRoadmapAsync(string userId, string? ideaId = null);
        Task<OperationalRoadmapResponse> UpdateTaskStateAsync(string userId, UpdateRoadmapTaskRequest request);
        Task<OperationalRoadmapResponse> ActivateRoadmapAsync(string userId, string? ideaId = null);
        Task<OperationalRoadmapResponse> UpdateAvailabilityAsync(string userId, UpdateAvailabilityRequest request);
        Task<OperationalRoadmapResponse> KeepCurrentRoadmapAsync(string userId, string? ideaId = null);
    }
}
