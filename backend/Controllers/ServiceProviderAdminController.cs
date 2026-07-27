using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApp.Models;
using WebApp.Models.Dtos;
using WebApp.Services.Interface;

namespace WebApp.Controllers;

/// <summary>
/// Admin moderation of Service Provider verification. Normal first submissions
/// auto-verify; this surface approves remediation resubmissions in UnderReview
/// or rejects an UnderReview/already-Verified provider. The admin identity comes
/// from the principal, never the body.
/// All decision logic lives in <see cref="IServiceProviderService"/>; this
/// controller maps outcomes onto the shared <see cref="ApiResponse"/> envelope.
/// This is separate from the Universal KYC gate. No marketplace, discovery,
/// matching, or reputation coupling is introduced here.
/// </summary>
[ApiController]
[Route("api/admin/service-provider")]
[Authorize(Roles = "Admin")]
public class ServiceProviderAdminController : ControllerBase
{
    private readonly IServiceProviderService _service;

    public ServiceProviderAdminController(IServiceProviderService service)
    {
        _service = service;
    }

    private string CurrentUserId =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? throw new UnauthorizedAccessException();

    [HttpGet("pending")]
    public async Task<IActionResult> Pending() =>
        Map(await _service.GetPendingVerificationsAsync());

    [HttpPost("verification/{providerUserId}/approve")]
    public async Task<IActionResult> Approve(string providerUserId) =>
        Map(await _service.ApproveVerificationAsync(providerUserId, CurrentUserId));

    [HttpPost("verification/{providerUserId}/reject")]
    public async Task<IActionResult> Reject(string providerUserId, [FromBody] RejectProviderVerificationRequest request) =>
        Map(await _service.RejectVerificationAsync(providerUserId, CurrentUserId, request.Reason));

    private IActionResult Map<T>(ServiceProviderResult<T> result) => result.Outcome switch
    {
        ServiceProviderOutcome.Ok => Ok(ApiResponse.Ok(result.Message, result.Value)),
        ServiceProviderOutcome.NotFound => NotFound(ApiResponse.Error(result.Message, HttpContext.TraceIdentifier)),
        ServiceProviderOutcome.Conflict => Conflict(ApiResponse.Error(result.Message, HttpContext.TraceIdentifier)),
        _ => StatusCode(500, ApiResponse.Error("Unexpected error.", HttpContext.TraceIdentifier)),
    };
}
