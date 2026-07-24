using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using WebApp.Configuration.AiOptions;
using WebApp.Models;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Models.Dtos.Ai;
using WebApp.Services.Ai;
using WebApp.Services.Ai.Jobs;
using WebApp.Services.Repository.Ai;

namespace WebApp.Controllers
{
    /// <summary>
    /// C-1 AI surface. All actions are owner-scoped: a user can only enqueue
    /// jobs for themselves and read their own jobs/results/usage/insights.
    /// Responses use the shared <see cref="ApiResponse"/> envelope.
    /// </summary>
    [ApiController]
    [Route("api/ai")]
    [Authorize]
    public class AiController : ControllerBase
    {
        private readonly IAiJobService _jobService;
        private readonly IAiUsageService _usageService;
        private readonly IAiCreditService _creditService;
        private readonly AiTaskHandlerRegistry _handlers;
        private readonly AiResponseRepository _responses;
        private readonly AiFeedbackRepository _feedback;
        private readonly AiSettings _settings;
        private readonly ILogger<AiController> _logger;

        public AiController(
            IAiJobService jobService,
            IAiUsageService usageService,
            IAiCreditService creditService,
            AiTaskHandlerRegistry handlers,
            AiResponseRepository responses,
            AiFeedbackRepository feedback,
            IOptions<AiSettings> settings,
            ILogger<AiController> logger)
        {
            _jobService = jobService;
            _usageService = usageService;
            _creditService = creditService;
            _handlers = handlers;
            _responses = responses;
            _feedback = feedback;
            _settings = settings.Value;
            _logger = logger;
        }

        private string CurrentUserId =>
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException();

        [HttpPost("jobs")]
        [EnableRateLimiting("ai")]
        public async Task<IActionResult> EnqueueJob([FromBody] EnqueueAiJobRequest request)
        {
            var owner = CurrentUserId;

            if (!_settings.Enabled)
                return StatusCode(503, ApiResponse.Error("AI features are currently disabled.", HttpContext.TraceIdentifier));

            // Validator already guarantees a parseable type.
            var jobType = Enum.Parse<AiJobType>(request.JobType);

            if (!_handlers.IsSupported(jobType))
                return BadRequest(ApiResponse.Error($"Job type '{jobType}' is not available.", HttpContext.TraceIdentifier));

            try
            {
                await _creditService.DebitForJobAsync(owner, jobType);
            }
            catch (InsufficientCreditsException ex)
            {
                // 402 here means exactly one thing: the creator's own credits are
                // exhausted. DebitForJobAsync is local-ledger-only — it never calls the
                // provider, so a ProviderPaymentRequired can't reach this catch (that
                // failure exists only in the async job path, surfaced via the session).
                return StatusCode(402, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }

            var input = request.Input is { ValueKind: JsonValueKind.Object } je
                ? BsonDocument.Parse(je.GetRawText())
                : null;

            var jobId = await _jobService.EnqueueAsync(jobType, owner, input);
            return Ok(ApiResponse.Ok("AI job enqueued.", new { jobId }));
        }

        [HttpGet("jobs/{id}")]
        public async Task<IActionResult> GetJob(string id)
        {
            if (!ObjectId.TryParse(id, out _))
                return NotFound(ApiResponse.Error("Job not found.", HttpContext.TraceIdentifier));

            var owner = CurrentUserId;
            var request = await _jobService.GetStatusAsync(id, owner);
            if (request is null)
                return NotFound(ApiResponse.Error("Job not found.", HttpContext.TraceIdentifier));

            var dto = new AiJobStatusDto
            {
                JobId = request.Id,
                JobType = request.JobType,
                Status = request.Status,
                Error = request.Error,
                CreatedAt = request.CreatedAt,
                UpdatedAt = request.UpdatedAt,
            };

            if (string.Equals(request.Status, "Completed", StringComparison.Ordinal))
            {
                var response = await _responses.GetByRequestAsync(request.Id, owner);
                if (response is not null)
                {
                    dto.Result = new AiJobResultDto
                    {
                        ResponseId = response.Id,
                        Model = response.Model,
                        Text = response.RawText,
                        Output = response.OutputPayload is null ? null : BsonTypeMapper.MapToDotNetValue(response.OutputPayload),
                        TotalTokens = response.TokenUsage.TotalTokens,
                        FinishReason = response.FinishReason,
                    };
                }
            }

            return Ok(ApiResponse.Ok("OK", dto));
        }

        [HttpGet("usage")]
        public async Task<IActionResult> GetUsage()
            => Ok(ApiResponse.Ok("OK", await _usageService.GetUsageAsync(CurrentUserId)));

        [HttpGet("insights")]
        public async Task<IActionResult> GetInsights(int skip = 0, int limit = 30)
        {
            skip = Math.Max(0, skip);
            limit = Math.Clamp(limit, 1, 100);
            return Ok(ApiResponse.Ok("OK", await _usageService.GetInsightsAsync(CurrentUserId, skip, limit)));
        }

        [HttpPost("feedback")]
        public async Task<IActionResult> SubmitFeedback([FromBody] AiFeedbackRequest request)
        {
            var owner = CurrentUserId;

            if (!ObjectId.TryParse(request.ResponseId, out _))
                return NotFound(ApiResponse.Error("Response not found.", HttpContext.TraceIdentifier));

            // Ownership: a foreign/unknown response id returns 404 (no enumeration).
            var response = await _responses.GetOwnedAsync(request.ResponseId, owner);
            if (response is null)
                return NotFound(ApiResponse.Error("Response not found.", HttpContext.TraceIdentifier));

            await _feedback.AddAsync(new AiFeedback
            {
                OwnerUserId = owner,
                ResponseId = request.ResponseId,
                Rating = request.Rating,
                Comment = request.Comment,
                CreatedAt = DateTime.UtcNow,
            });

            return Ok(ApiResponse.Ok("Feedback recorded."));
        }
    }
}
