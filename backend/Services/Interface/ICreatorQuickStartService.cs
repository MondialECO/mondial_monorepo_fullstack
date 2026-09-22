using System.Threading;
using System.Threading.Tasks;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;

namespace WebApp.Services.Interface;

/// <summary>
/// Domain service for the one-time Creator HumainX Quick Start onboarding flow.
/// Authoritative state resolver and step progression engine.
/// </summary>
public interface ICreatorQuickStartService
{
    Task<HumainXQuickStartStatusDto> GetStatusAsync(string userId, CancellationToken ct = default);
    Task<HumainXQuickStartStatusDto> ConfirmStep1Async(string userId, QuickStartStep1RequestDto dto, CancellationToken ct = default);
    Task<HumainXQuickStartStatusDto> ConfirmStep2Async(string userId, QuickStartStep2RequestDto dto, CancellationToken ct = default);
    Task<HumainXQuickStartStatusDto> CompleteAsync(string userId, QuickStartStep3RequestDto dto, CancellationToken ct = default);
    HumainXQuickStartStatusDto ResolveStatus(HumainXQuickStartState? state);
}
