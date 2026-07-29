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
/// Marketplace, matching, proposals, workrooms, and escrow are out of scope;
/// post-verification admin moderation remains on the separate admin controller.
/// </summary>
[ApiController]
[Route("api/service-provider")]
[Authorize]
public class ServiceProviderController : ControllerBase
{
    private readonly IServiceProviderService _service;
    private readonly IServiceProviderMediaService _media;
    private readonly IProfileEditorService _editor;

    public ServiceProviderController(
        IServiceProviderService service,
        IServiceProviderMediaService media,
        IProfileEditorService editor)
    {
        _service = service;
        _media = media;
        _editor = editor;
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

    // ---- Profile editor (four-step wizard) ----
    // The draft surface is deliberately separate from the publish surface above:
    // draft writes never change what visitors see, and only Submit publishes.

    [HttpGet("profile/editor/draft")]
    public async Task<IActionResult> GetProfileDraft(CancellationToken cancellationToken) =>
        Map(await _editor.GetDraftAsync(CurrentUserId, cancellationToken));

    [HttpPut("profile/editor/draft")]
    public async Task<IActionResult> SaveProfileDraft(
        [FromBody] ProfileDraftRequest request,
        CancellationToken cancellationToken) =>
        Map(await _editor.SaveDraftAsync(CurrentUserId, request, cancellationToken));

    [HttpDelete("profile/editor/draft")]
    public async Task<IActionResult> DiscardProfileDraft(CancellationToken cancellationToken) =>
        Map(await _editor.DiscardDraftAsync(CurrentUserId, cancellationToken));

    [HttpPost("profile/editor/submit")]
    public async Task<IActionResult> SubmitProfileEditor(
        [FromBody] SubmitProfileEditorRequest request,
        CancellationToken cancellationToken) =>
        Map(await _editor.SubmitAsync(CurrentUserId, request, cancellationToken));

    [HttpPut("profile/editor/credentials")]
    public async Task<IActionResult> UpsertCredential(
        [FromBody] ProviderCredentialRequest request,
        CancellationToken cancellationToken) =>
        Map(await _editor.UpsertCredentialAsync(CurrentUserId, request, cancellationToken));

    [HttpPost("profile/editor/credentials/{credentialId}/document")]
    [RequestSizeLimit(10 * 1024 * 1024 + 64 * 1024)]
    public async Task<IActionResult> UploadCredentialDocument(
        string credentialId,
        IFormFile file,
        CancellationToken cancellationToken) =>
        Map(await _editor.UploadCredentialDocumentAsync(CurrentUserId, credentialId, file, cancellationToken));

    [HttpDelete("profile/editor/credentials/{credentialId}")]
    public async Task<IActionResult> DeleteCredential(
        string credentialId,
        CancellationToken cancellationToken) =>
        Map(await _editor.DeleteCredentialAsync(CurrentUserId, credentialId, cancellationToken));

    [HttpPost("portfolio")]
    public async Task<IActionResult> AddPortfolioItem([FromBody] AddPortfolioItemRequest request) =>
        Map(await _service.AddPortfolioItemAsync(CurrentUserId, request));

    [HttpPut("portfolio")]
    public async Task<IActionResult> UpdatePortfolioItem([FromBody] UpdatePortfolioItemRequest request) =>
        Map(await _service.UpdatePortfolioItemAsync(CurrentUserId, request));

    [HttpDelete("portfolio/{portfolioItemId}")]
    public async Task<IActionResult> DeletePortfolioItem(string portfolioItemId) =>
        Map(await _service.DeletePortfolioItemAsync(CurrentUserId, portfolioItemId));

    [HttpPost("media/profile-image")]
    [RequestSizeLimit(5 * 1024 * 1024 + 64 * 1024)]
    public async Task<IActionResult> UploadProfileImage(IFormFile file, CancellationToken cancellationToken) =>
        Map(await _media.UploadProfileMediaAsync(CurrentUserId, ProviderProfileMediaKind.ProfileImage, file, cancellationToken));

    [HttpDelete("media/profile-image")]
    public async Task<IActionResult> RemoveProfileImage(CancellationToken cancellationToken) =>
        Map(await _media.RemoveProfileMediaAsync(CurrentUserId, ProviderProfileMediaKind.ProfileImage, cancellationToken));

    [HttpPost("media/cover-image")]
    [RequestSizeLimit(8 * 1024 * 1024 + 64 * 1024)]
    public async Task<IActionResult> UploadCoverImage(IFormFile file, CancellationToken cancellationToken) =>
        Map(await _media.UploadProfileMediaAsync(CurrentUserId, ProviderProfileMediaKind.CoverImage, file, cancellationToken));

    [HttpDelete("media/cover-image")]
    public async Task<IActionResult> RemoveCoverImage(CancellationToken cancellationToken) =>
        Map(await _media.RemoveProfileMediaAsync(CurrentUserId, ProviderProfileMediaKind.CoverImage, cancellationToken));

    [HttpPost("portfolio/{portfolioItemId}/image")]
    [RequestSizeLimit(8 * 1024 * 1024 + 64 * 1024)]
    public async Task<IActionResult> UploadPortfolioImage(
        string portfolioItemId,
        IFormFile file,
        [FromForm] string? caption,
        CancellationToken cancellationToken) =>
        Map(await _media.UploadPortfolioImageAsync(CurrentUserId, portfolioItemId, file, caption, cancellationToken));

    [HttpDelete("portfolio/{portfolioItemId}/image")]
    public async Task<IActionResult> RemovePortfolioImage(string portfolioItemId, CancellationToken cancellationToken) =>
        Map(await _media.RemovePortfolioImageAsync(CurrentUserId, portfolioItemId, cancellationToken));

    [HttpPost("submit-verification")]
    public async Task<IActionResult> SubmitVerification([FromBody] SubmitVerificationRequest request) =>
        Map(await _service.SubmitVerificationAsync(CurrentUserId, request));

    // ---- Module 1: Profile & Trust (owner-scoped, post-verification, non-blocking) ----

    [HttpGet("trust")]
    public async Task<IActionResult> GetTrust() =>
        Map(await _service.GetTrustAsync(CurrentUserId));

    [HttpGet("skills-test/status")]
    public async Task<IActionResult> GetSkillsTestStatus() =>
        Map(await _service.GetSkillsTestStatusAsync(CurrentUserId));

    [HttpGet("skills-test/questions")]
    public async Task<IActionResult> GetSkillsTestQuestions([FromQuery] string category) =>
        Map(await _service.GetSkillsTestQuestionsAsync(CurrentUserId, category));

    [HttpPost("skills-test/submit")]
    public async Task<IActionResult> SubmitSkillsTest([FromBody] SubmitSkillsTestRequest request) =>
        Map(await _service.SubmitSkillsTestAsync(CurrentUserId, request));

    /// <summary>Map a service result onto the shared ApiResponse envelope and HTTP status.</summary>
    private IActionResult Map<T>(ServiceProviderResult<T> result) => result.Outcome switch
    {
        ServiceProviderOutcome.Ok => Ok(ApiResponse.Ok(result.Message, result.Value)),
        ServiceProviderOutcome.NotFound => NotFound(ApiResponse.Error(result.Message, HttpContext.TraceIdentifier)),
        ServiceProviderOutcome.Conflict => Conflict(ApiResponse.Error(result.Message, HttpContext.TraceIdentifier)),
        ServiceProviderOutcome.Invalid => BadRequest(ApiResponse.Error(result.Message, HttpContext.TraceIdentifier)),
        _ => StatusCode(500, ApiResponse.Error("Unexpected error.", HttpContext.TraceIdentifier)),
    };
}
