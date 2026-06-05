using WebApp.Models.Dtos.Ai;

namespace WebApp.Services.Ai
{
    /// <summary>
    /// Read-only aggregation for the usage/insights endpoints. Owner-scoped.
    /// </summary>
    public interface IAiUsageService
    {
        Task<AiUsageDto> GetUsageAsync(string ownerUserId);
        Task<List<AiInsightDto>> GetInsightsAsync(string ownerUserId, int skip, int limit);
    }
}
