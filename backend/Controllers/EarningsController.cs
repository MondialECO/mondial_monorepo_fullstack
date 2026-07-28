using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApp.Models;
using WebApp.Models.Dtos;
using WebApp.Services.Interface;

namespace WebApp.Controllers;

[ApiController, Authorize(Roles = "ServiceProvider")]
[Route("api/earnings")]
public class EarningsController(IWorkroomService service) : ControllerBase
{
    private string CurrentUserId => User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? throw new UnauthorizedAccessException();
    [HttpGet] public async Task<IActionResult> Summary([FromQuery] string? currency = null) => Map(await service.GetFinancialSummaryAsync(CurrentUserId, currency));
    [HttpGet("statements")] public async Task<IActionResult> Statement([FromQuery] DateTime from, [FromQuery] DateTime to, [FromQuery] string? currency = null) => Map(await service.GetStatementAsync(CurrentUserId, from, to, currency));
    [HttpPost("payout-methods")] public async Task<IActionResult> Method(AddPayoutMethodRequest r) => Map(await service.AddPayoutMethodAsync(CurrentUserId, r));
    [HttpPut("payout-methods/{methodId}/default")] public async Task<IActionResult> DefaultMethod(string methodId) => Map(await service.SetDefaultPayoutMethodAsync(CurrentUserId, methodId));
    [HttpDelete("payout-methods/{methodId}")] public async Task<IActionResult> RemoveMethod(string methodId) => Map(await service.RemovePayoutMethodAsync(CurrentUserId, methodId));
    [HttpPut("tax-settings")] public async Task<IActionResult> Tax(UpdateTaxSettingsRequest r) => Map(await service.UpdateTaxSettingsAsync(CurrentUserId, r));
    [HttpPost("payouts")] public async Task<IActionResult> Payout(CreatePayoutRequest r) => Map(await service.RequestPayoutAsync(CurrentUserId, r));
    private IActionResult Map<T>(ServiceProviderResult<T> result) => result.Outcome switch
    {
        ServiceProviderOutcome.Ok => Ok(ApiResponse.Ok(result.Message, result.Value)),
        ServiceProviderOutcome.NotFound => NotFound(ApiResponse.Error(result.Message, HttpContext.TraceIdentifier)),
        ServiceProviderOutcome.Conflict => Conflict(ApiResponse.Error(result.Message, HttpContext.TraceIdentifier)),
        _ => StatusCode(500, ApiResponse.Error("Unexpected error.", HttpContext.TraceIdentifier)),
    };
}
