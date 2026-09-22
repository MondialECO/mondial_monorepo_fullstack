using System.Threading;
using System.Threading.Tasks;
using WebApp.Models.Dtos;

namespace WebApp.Services.Interface
{
    /// <summary>
    /// Service for synthesizing the canonical Creator Dashboard summary.
    /// Aggregates existing domain data without recalculating underlying business logic.
    /// </summary>
    public interface ICreatorDashboardService
    {
        Task<CreatorDashboardSummaryDto> GetSummaryAsync(string userId, string? ideaId = null, CancellationToken ct = default);
    }
}
