using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApp.Models;
using WebApp.Models.Dtos;
using WebApp.Services.Interface;

namespace WebApp.Controllers;

/// <summary>
/// D-1 Stage 1 (Verification &amp; Onboarding) Service Provider surface. Owner-scoped:
/// every action targets the authenticated user's embedded ServiceProviderProfile;
/// the owner id is taken from the principal and never accepted from the body.
/// Request shapes are validated by the global ValidationFilter (Phase 3 validators);
/// all decision logic lives in <see cref="IServiceProviderService"/>, so this
/// controller only maps outcomes onto the shared <see cref="ApiResponse"/> envelope.
/// Marketplace, matching, proposals, workrooms, escrow, reviews, reputation, and
/// admin approval are out of scope.
/// </summary>
[ApiController]
[Route("api/service-provider")]
[Authorize]
public class ServiceProviderController : ControllerBase
{
    private readonly IServiceProviderService _service;

    public ServiceProviderController(IServiceProviderService service)
    {
        _service = service;
    }

    private string CurrentUserId =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? throw new UnauthorizedAccessException();

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile() =>
        Map(await _service.GetProfileAsync(CurrentUserId));

    [HttpPut("profile")]
    public async Task<IActionResult> UpsertProfile([FromBody] CreateOrUpdateServiceProviderProfileRequest request) =>
        Map(await _service.UpsertProfileAsync(CurrentUserId, request));

    [HttpPost("portfolio")]
    public async Task<IActionResult> AddPortfolioItem([FromBody] AddPortfolioItemRequest request) =>
        Map(await _service.AddPortfolioItemAsync(CurrentUserId, request));

    [HttpPut("portfolio")]
    public async Task<IActionResult> UpdatePortfolioItem([FromBody] UpdatePortfolioItemRequest request) =>
        Map(await _service.UpdatePortfolioItemAsync(CurrentUserId, request));

    [HttpDelete("portfolio/{index:int}")]
    public async Task<IActionResult> DeletePortfolioItem(int index) =>
        Map(await _service.DeletePortfolioItemAsync(CurrentUserId, index));

    [HttpPost("submit-verification")]
    public async Task<IActionResult> SubmitVerification([FromBody] SubmitVerificationRequest request) =>
        Map(await _service.SubmitVerificationAsync(CurrentUserId, request));

    /// <summary>Map a service result onto the shared ApiResponse envelope and HTTP status.</summary>
    private IActionResult Map<T>(ServiceProviderResult<T> result) => result.Outcome switch
    {
        ServiceProviderOutcome.Ok => Ok(ApiResponse.Ok(result.Message, result.Value)),
        ServiceProviderOutcome.NotFound => NotFound(ApiResponse.Error(result.Message, HttpContext.TraceIdentifier)),
        ServiceProviderOutcome.Conflict => Conflict(ApiResponse.Error(result.Message, HttpContext.TraceIdentifier)),
        _ => StatusCode(500, ApiResponse.Error("Unexpected error.", HttpContext.TraceIdentifier)),
    };
}
