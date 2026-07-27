using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApp.Models;
using WebApp.Models.Dtos;
using WebApp.Services.Interface;

namespace WebApp.Controllers;

[ApiController, Authorize]
[Route("api/service-provider/analytics")]
public class AnalyticsController(IAnalyticsService service) : ControllerBase
{
    private string CurrentUserId => User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? throw new UnauthorizedAccessException();

    [HttpGet]
    public async Task<IActionResult> Dashboard([FromQuery] AnalyticsQuery query) =>
        Map(await service.GetDashboardAsync(CurrentUserId, query));

    [HttpGet("growth-tasks")]
    public async Task<IActionResult> GrowthTasks() =>
        Map(await service.GetGrowthTasksAsync(CurrentUserId));

    [HttpPost("growth-tasks")]
    public async Task<IActionResult> CreateGrowthTask(CreateGrowthTaskRequest request) =>
        Map(await service.CreateGrowthTaskAsync(CurrentUserId, request));

    [HttpPut("growth-tasks/{id}/status")]
    public async Task<IActionResult> UpdateGrowthTaskStatus(string id, UpdateGrowthTaskStatusRequest request) =>
        Map(await service.UpdateGrowthTaskStatusAsync(CurrentUserId, id, request));

    private IActionResult Map<T>(ServiceProviderResult<T> result) => result.Outcome switch
    {
        ServiceProviderOutcome.Ok => Ok(ApiResponse.Ok(result.Message, result.Value)),
        ServiceProviderOutcome.NotFound => NotFound(ApiResponse.Error(result.Message, HttpContext.TraceIdentifier)),
        ServiceProviderOutcome.Conflict => Conflict(ApiResponse.Error(result.Message, HttpContext.TraceIdentifier)),
        _ => StatusCode(500, ApiResponse.Error("Unexpected error.", HttpContext.TraceIdentifier)),
    };
}
