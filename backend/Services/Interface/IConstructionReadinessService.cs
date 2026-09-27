using System.Threading.Tasks;
using WebApp.Models.DatabaseModels.Phase4;

namespace WebApp.Services.Interface
{
    public interface IConstructionReadinessService
    {
        Task<ConstructionReadinessResponse> GetReadinessAssessmentAsync(string userId, string? ideaId = null);
        Task<ConstructionReadinessResponse> SaveReadinessReviewAsync(string userId, SaveConstructionReadinessRequest request);
    }
}
