using System.Threading.Tasks;
using WebApp.Models.DatabaseModels.Phase4;

namespace WebApp.Services.Interface
{
    public interface IConstructionSnapshotService
    {
        Task<ConstructionSnapshotResponse> GetSnapshotAsync(string userId, string? ideaId);
        Task<ConstructionSnapshotResponse> GenerateSnapshotAsync(string userId, string? ideaId);
        Task<ConstructionSnapshotResponse> RefreshSnapshotAsync(string userId, string? ideaId);
    }
}
