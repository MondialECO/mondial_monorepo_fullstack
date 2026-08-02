using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApp.Models;
using WebApp.Models.Dtos;
using WebApp.Services.Interface;

namespace WebApp.Controllers;

[ApiController, Authorize]
[Route("api/workroom")]
public class WorkroomController(IWorkroomService service) : ControllerBase
{
    private string CurrentUserId => User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? throw new UnauthorizedAccessException();

    [HttpGet("engagements")] public async Task<IActionResult> Engagements() => Map(await service.GetEngagementsAsync(CurrentUserId));
    [HttpGet("engagements/{id}")] public async Task<IActionResult> Engagement(string id) => Map(await service.GetEngagementAsync(CurrentUserId, id));
    [HttpPost("engagements/{id}/contract/confirm")] public async Task<IActionResult> ConfirmContract(string id, ConfirmContractRequest r) => Map(await service.SignContractAsync(CurrentUserId, id, r.ExplicitlyConfirmed));
    [HttpPost("milestones/{id}/fund")] public async Task<IActionResult> Fund(string id) => Map(await service.FundMilestoneAsync(CurrentUserId, id));
    [HttpPost("milestones/{id}/activate")] public async Task<IActionResult> Activate(string id) => Map(await service.ActivateMilestoneAsync(CurrentUserId, id));
    [HttpPost("milestones/{id}/deliverables")] public async Task<IActionResult> Submit(string id, SubmitDeliverableRequest r) => Map(await service.SubmitDeliverableAsync(CurrentUserId, id, r));
    [HttpPost("milestones/{id}/revisions")] public async Task<IActionResult> Revision(string id, CreateRevisionRequest r) => Map(await service.RequestRevisionAsync(CurrentUserId, id, r));
    [HttpPost("milestones/{id}/approve")] public async Task<IActionResult> Approve(string id) => Map(await service.ApproveMilestoneAsync(CurrentUserId, id));
    [HttpPost("milestones/{id}/disputes")] public async Task<IActionResult> Dispute(string id, OpenDisputeRequest r) => Map(await service.OpenDisputeAsync(CurrentUserId, id, r.Reason));
    [HttpPost("engagements/{id}/pause")] public async Task<IActionResult> Pause(string id, PauseEngagementRequest r) => Map(await service.PauseEngagementAsync(CurrentUserId, id, r.Reason));
    [HttpPost("engagements/{id}/resume")] public async Task<IActionResult> Resume(string id) => Map(await service.ResumeEngagementAsync(CurrentUserId, id));
    [HttpPost("milestones/{id}/extension")] public async Task<IActionResult> Extension(string id, ExtensionRequest r) => Map(await service.RequestExtensionAsync(CurrentUserId, id, r.Days, r.Reason));
    [HttpPost("milestones/{id}/extension-decision")] public async Task<IActionResult> ExtensionDecision(string id, ExtensionDecisionRequest r) => Map(await service.DecideExtensionAsync(CurrentUserId, id, r.Approve, r.Days, r.Reason));
    [HttpPost("revisions/{id}/start")] public async Task<IActionResult> StartRevision(string id) => Map(await service.StartRevisionAsync(CurrentUserId, id));
    [HttpPost("milestones/{id}/resolve-dispute"), Authorize(Roles = "Admin")] public async Task<IActionResult> ResolveDispute(string id, ResolveDisputeRequest r) => Map(await service.ResolveDisputeAsync(CurrentUserId, id, r.Outcome, r.Reason));
    [HttpPost("engagements/{id}/complete")] public async Task<IActionResult> Complete(string id) => Map(await service.CompleteEngagementAsync(CurrentUserId, id));
    [HttpPost("engagements/{id}/reviews")] public async Task<IActionResult> Review(string id, CreateReviewRequest r) => Map(await service.SubmitReviewAsync(CurrentUserId, id, r));
    [HttpPost("reviews/{id}/response")] public async Task<IActionResult> ReviewResponse(string id, ProviderReviewResponseRequest r) => Map(await service.RespondToReviewAsync(CurrentUserId, id, r.Response));
    [HttpPost("engagements/{id}/files")]
    [RequestSizeLimit(20 * 1024 * 1024)]
    public async Task<IActionResult> Upload(string id, IFormFile file, [FromForm] string? milestoneId, [FromForm] bool providerPrivate = false) => Map(await service.UploadFileAsync(CurrentUserId, id, milestoneId, file, providerPrivate));
    [HttpPost("engagements/{id}/tasks")] public async Task<IActionResult> Task(string id, CreateTaskRequest r) => Map(await service.CreateTaskAsync(CurrentUserId, id, r));
    [HttpPost("engagements/{id}/client-input")] public async Task<IActionResult> Input(string id, CreateClientInputRequest r) => Map(await service.RequestClientInputAsync(CurrentUserId, id, r));
    [HttpPost("engagements/{id}/time-entries")] public async Task<IActionResult> Time(string id, CreateTimeEntryRequest r) => Map(await service.AddTimeEntryAsync(CurrentUserId, id, r));

    private IActionResult Map<T>(ServiceProviderResult<T> result) => result.Outcome switch
    {
        ServiceProviderOutcome.Ok => Ok(ApiResponse.Ok(result.Message, result.Value)),
        ServiceProviderOutcome.NotFound => NotFound(ApiResponse.Error(result.Message, HttpContext.TraceIdentifier)),
        ServiceProviderOutcome.Conflict => Conflict(ApiResponse.Error(result.Message, HttpContext.TraceIdentifier)),
        _ => StatusCode(500, ApiResponse.Error("Unexpected error.", HttpContext.TraceIdentifier)),
    };
}
