using System.Threading.Tasks;
using WebApp.Models.DatabaseModels.Phase4;

namespace WebApp.Services.Interface
{
    public interface IGtmStrategyService
    {
        Task<GtmStrategyResponse> GetGtmStrategyAsync(string userId, string? ideaId = null);
        Task<GtmStrategyResponse> GenerateGtmStrategyAsync(string userId, string? ideaId = null);
        Task<GtmStrategyResponse> RefreshGtmStrategyAsync(string userId, string? ideaId = null);
        Task<GtmStrategyResponse> UpdateGtmChannelAsync(string userId, string channelKey, UpdateGtmChannelRequest request);
        Task<GtmStrategyResponse> RecordExperimentRunAsync(string userId, string experimentKey, RecordExperimentRunRequest request);
    }
}
