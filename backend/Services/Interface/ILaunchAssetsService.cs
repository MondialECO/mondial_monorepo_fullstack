using System.Threading.Tasks;
using WebApp.Models.DatabaseModels.Phase4;

namespace WebApp.Services.Interface
{
    public interface ILaunchAssetsService
    {
        Task<LaunchAssetsResponse> GetLaunchAssetsAsync(string userId, string? ideaId = null);
        Task<LaunchAssetsResponse> GenerateLaunchAssetsAsync(string userId, string? ideaId = null);
        Task<LaunchAssetsResponse> RefreshLaunchAssetsAsync(string userId, string? ideaId = null);
        Task<LaunchAssetsResponse> UpdateLaunchAssetsAsync(string userId, UpdateLaunchAssetsRequest request);
        Task<LaunchAssetsResponse> CreateNewVersionAsync(string userId, string? ideaId = null);
        Task<string> GetSourceCodeBundleAsync(string userId, string? ideaId = null);
    }
}
