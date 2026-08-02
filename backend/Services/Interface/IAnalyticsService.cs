using WebApp.Models.Dtos;

namespace WebApp.Services.Interface;

public interface IAnalyticsService
{
    Task<ServiceProviderResult<ProviderDashboardResponse>> GetProviderOverviewAsync(string providerId, string? currency);
    Task<ServiceProviderResult<AnalyticsDashboardResponse>> GetDashboardAsync(string providerId, AnalyticsQuery query);
    Task<ServiceProviderResult<List<GrowthTaskResponse>>> GetGrowthTasksAsync(string providerId);
    Task<ServiceProviderResult<GrowthTaskResponse>> CreateGrowthTaskAsync(string providerId, CreateGrowthTaskRequest request);
    Task<ServiceProviderResult<GrowthTaskResponse>> UpdateGrowthTaskStatusAsync(string providerId, string id, UpdateGrowthTaskStatusRequest request);
    Task<ServiceProviderResult<AnalyticsSummaryResponse>> GetAnalyticsSummaryAsync(string providerId, string listingIdOrAll, string range, CancellationToken ct);
    Task<ServiceProviderResult<AnalyticsTimeseriesResponse>> GetAnalyticsTimeseriesAsync(string providerId, string listingIdOrAll, string range, CancellationToken ct);
    Task<ServiceProviderResult<AnalyticsListingsResponse>> GetAnalyticsListingsAsync(string providerId, CancellationToken ct);
}
