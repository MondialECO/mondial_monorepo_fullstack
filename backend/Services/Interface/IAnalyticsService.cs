using WebApp.Models.Dtos;

namespace WebApp.Services.Interface;

public interface IAnalyticsService
{
    Task<ServiceProviderResult<AnalyticsDashboardResponse>> GetDashboardAsync(string providerId, AnalyticsQuery query);
    Task<ServiceProviderResult<List<GrowthTaskResponse>>> GetGrowthTasksAsync(string providerId);
    Task<ServiceProviderResult<GrowthTaskResponse>> CreateGrowthTaskAsync(string providerId, CreateGrowthTaskRequest request);
    Task<ServiceProviderResult<GrowthTaskResponse>> UpdateGrowthTaskStatusAsync(string providerId, string id, UpdateGrowthTaskStatusRequest request);
}
