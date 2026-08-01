using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApp.Models;
using WebApp.Models.Dtos;
using WebApp.Services.Interface;

namespace WebApp.Controllers;

/// <summary>Module 3 actor-scoped acquisition surface. Module 4 conversion is absent.</summary>
[ApiController, Authorize]
[Route("api/leads")]
public class LeadsController : ControllerBase
{
    private readonly ILeadsService _service;
    public LeadsController(ILeadsService service) => _service = service;
    private string CurrentUserId => User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? throw new UnauthorizedAccessException();

    // Provider inbox / interactions
    [HttpGet("inbox")]
    public async Task<IActionResult> Inbox([FromQuery] LeadQueryRequest query) => Map(await _service.GetInboxAsync(CurrentUserId, query));
    [HttpGet("briefs/{id}")]
    public async Task<IActionResult> Brief(string id) => Map(await _service.GetBriefAsync(CurrentUserId, id));
    [HttpPut("briefs/{id}/interaction")]
    public async Task<IActionResult> Interaction(string id, UpdateBriefInteractionRequest request) => Map(await _service.UpdateInteractionAsync(CurrentUserId, id, request));

    // Client brief lifecycle
    [HttpPost("briefs")]
    public async Task<IActionResult> CreateBrief(CreateClientBriefRequest request) => Map(await _service.CreateBriefAsync(CurrentUserId, request));
    [HttpPost("briefs/{id}/publish")]
    public async Task<IActionResult> PublishBrief(string id) => Map(await _service.PublishBriefAsync(CurrentUserId, id));
    [HttpPost("briefs/{id}/close")]
    public async Task<IActionResult> CloseBrief(string id) => Map(await _service.CloseBriefAsync(CurrentUserId, id));

    // Provider proposal workspace / pipeline
    [HttpGet("proposals")]
    public async Task<IActionResult> Proposals() => Map(await _service.GetProviderProposalsAsync(CurrentUserId));
    // Client-scoped list. Declared before "proposals/{id}" for readability; routing
    // prefers the literal segment over the parameterized one regardless of order.
    [HttpGet("proposals/mine")]
    public async Task<IActionResult> MyProposals() => Map(await _service.GetClientProposalsAsync(CurrentUserId));
    [HttpGet("proposals/{id}")]
    public async Task<IActionResult> Proposal(string id) => Map(await _service.GetProposalAsync(CurrentUserId, id));
    [HttpPost("proposals")]
    public async Task<IActionResult> CreateProposal(UpsertProposalRequest request) => Map(await _service.CreateDraftAsync(CurrentUserId, request));
    [HttpPut("proposals/{id}")]
    public async Task<IActionResult> UpdateProposal(string id, UpsertProposalRequest request) => Map(await _service.UpdateDraftAsync(CurrentUserId, id, request));
    [HttpPost("proposals/{id}/submit")]
    public async Task<IActionResult> Submit(string id) => Map(await _service.SubmitAsync(CurrentUserId, id));
    [HttpPost("proposals/{id}/withdraw")]
    public async Task<IActionResult> Withdraw(string id) => Map(await _service.WithdrawAsync(CurrentUserId, id));
    [HttpPost("proposals/{id}/duplicate")]
    public async Task<IActionResult> Duplicate(string id) => Map(await _service.DuplicateExpiredAsync(CurrentUserId, id));
    [HttpPost("proposals/{id}/revise")]
    public async Task<IActionResult> Revise(string id, UpsertProposalRequest request) => Map(await _service.ReviseAsync(CurrentUserId, id, request));

    // Client review path
    [HttpPost("proposals/{id}/view")]
    public async Task<IActionResult> ViewProposal(string id) => Map(await _service.MarkViewedAsync(CurrentUserId, id));
    [HttpPost("proposals/{id}/request-changes")]
    public async Task<IActionResult> RequestChanges(string id) => Map(await _service.RequestChangesAsync(CurrentUserId, id));
    [HttpPost("proposals/{id}/review")]
    public async Task<IActionResult> Review(string id) => Map(await _service.StartReviewAsync(CurrentUserId, id));
    [HttpPost("proposals/{id}/accept")]
    public async Task<IActionResult> Accept(string id, AcceptProposalRequest request) => Map(await _service.AcceptAsync(CurrentUserId, id, request));
    [HttpPost("proposals/{id}/decline")]
    public async Task<IActionResult> Decline(string id) => Map(await _service.DeclineAsync(CurrentUserId, id));

    // Published package purchase / manual fallback
    [HttpPost("package-purchases")]
    public async Task<IActionResult> Purchase(PackagePurchaseRequest request) => Map(await _service.PurchasePackageAsync(CurrentUserId, request));
    [HttpPost("proposals/{id}/provider-approve")]
    public async Task<IActionResult> ProviderApprove(string id) => Map(await _service.ProviderReviewOrderRequestAsync(CurrentUserId, id, true));
    [HttpPost("proposals/{id}/provider-decline")]
    public async Task<IActionResult> ProviderDecline(string id) => Map(await _service.ProviderReviewOrderRequestAsync(CurrentUserId, id, false));

    private IActionResult Map<T>(ServiceProviderResult<T> result) => result.Outcome switch
    {
        ServiceProviderOutcome.Ok => Ok(ApiResponse.Ok(result.Message, result.Value)),
        ServiceProviderOutcome.NotFound => NotFound(ApiResponse.Error(result.Message, HttpContext.TraceIdentifier)),
        ServiceProviderOutcome.Conflict => Conflict(ApiResponse.Error(result.Message, HttpContext.TraceIdentifier)),
        _ => StatusCode(500, ApiResponse.Error("Unexpected error.", HttpContext.TraceIdentifier)),
    };
}
