using System.Security.Claims;
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
using WebApp.Services.Audit;
using WebApp.Services.Repository.Ai;

namespace WebApp.Controllers
{
    /// <summary>
    /// C-2 Idea Clarifier surface. Owner-scoped: a user can only start sessions
    /// for themselves and read their own sessions. The session is the C-2 source
    /// of truth; the AI engine job (AIRequests/AIResponses) is enqueued under the
    /// hood via <see cref="IAiJobService"/>. Responses use the shared
    /// <see cref="ApiResponse"/> envelope.
    /// </summary>
    [ApiController]
    [Route("api/ai/idea-clarifier")]
    [Authorize]
    [EnableRateLimiting("ai")]
    public class ClarifierController : ControllerBase
    {
        private readonly IClarifierSessionStore _sessions;
        private readonly IAiJobService _jobService;
        private readonly IAiCreditService _creditService;
        private readonly IAuditLogger _audit;
        private readonly AiSettings _settings;
        private readonly ILogger<ClarifierController> _logger;

        public ClarifierController(
            IClarifierSessionStore sessions,
            IAiJobService jobService,
            IAiCreditService creditService,
            IAuditLogger audit,
            IOptions<AiSettings> settings,
            ILogger<ClarifierController> logger)
        {
            _sessions = sessions;
            _jobService = jobService;
            _creditService = creditService;
            _audit = audit;
            _settings = settings.Value;
            _logger = logger;
        }

        private string CurrentUserId =>
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException();

        [HttpPost]
        public async Task<IActionResult> Start([FromBody] StartClarifierRequest request)
        {
            var owner = CurrentUserId;

            if (!_settings.Enabled)
                return StatusCode(503, ApiResponse.Error("AI features are currently disabled.", HttpContext.TraceIdentifier));
            if (!_settings.Features.Clarifier)
                return StatusCode(503, ApiResponse.Error("The Idea Clarifier is currently disabled.", HttpContext.TraceIdentifier));

            // Create the session first so it owns the lifecycle (source of truth).
            var session = new ClarifierSession
            {
                OwnerUserId = owner,
                BusinessIdeaId = string.IsNullOrWhiteSpace(request.BusinessIdeaId) ? null : request.BusinessIdeaId,
                Status = "Pending",
                Input = BuildInput(request.RawIdea),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };
            await _sessions.AddAsync(session); // ObjectId id assigned here

            _audit.Record("IdeaClarifier.Start", owner, success: true,
                new { sessionId = session.Id, businessIdeaId = session.BusinessIdeaId });

            try
            {
                await _creditService.DebitForJobAsync(owner, AiJobType.IdeaClarifier);
            }
            catch (InsufficientCreditsException ex)
            {
                await _sessions.SetFailedAsync(session.Id, "Insufficient credits.");
                return StatusCode(402, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }

            // The handler reads sessionId from the job input to write back results.
            var input = new BsonDocument(session.Input!) { ["sessionId"] = session.Id };
            var jobId = await _jobService.EnqueueAsync(AiJobType.IdeaClarifier, owner, input);
            await _sessions.SetRequestIdAsync(session.Id, jobId);

            return Ok(ApiResponse.Ok("Idea Clarifier started.", new { sessionId = session.Id, jobId }));
        }

        [HttpGet("{sessionId}")]
        public async Task<IActionResult> Get(string sessionId)
        {
            if (!ObjectId.TryParse(sessionId, out _))
                return NotFound(ApiResponse.Error("Session not found.", HttpContext.TraceIdentifier));

            var session = await _sessions.GetOwnedAsync(sessionId, CurrentUserId);
            if (session is null)
                return NotFound(ApiResponse.Error("Session not found.", HttpContext.TraceIdentifier));

            return Ok(ApiResponse.Ok("OK", ToDto(session)));
        }

        [HttpGet]
        public async Task<IActionResult> List(string? businessIdeaId = null, int skip = 0, int limit = 30)
        {
            skip = Math.Max(0, skip);
            limit = Math.Clamp(limit, 1, 100);
            var owner = CurrentUserId;

            var sessions = string.IsNullOrWhiteSpace(businessIdeaId)
                ? await _sessions.ListByOwnerAsync(owner, skip, limit)
                : await _sessions.ListByIdeaAsync(businessIdeaId, owner, skip, limit);

            return Ok(ApiResponse.Ok("OK", sessions.Select(ToDto)));
        }

        private static BsonDocument BuildInput(RawIdeaInput raw) => new()
        {
            ["title"] = raw.Title ?? "",
            ["problemStatement"] = raw.ProblemStatement ?? "",
            ["targetAudience"] = raw.TargetAudience ?? "",
            ["description"] = raw.Description ?? "",
            ["existingAlternatives"] = raw.ExistingAlternatives ?? "",
        };

        private static ClarifierSessionDto ToDto(ClarifierSession s) => new()
        {
            SessionId = s.Id,
            Status = s.Status,
            BusinessIdeaId = s.BusinessIdeaId,
            ClarityScore = s.ClarityScore,
            Output = s.Output is null ? null : BsonTypeMapper.MapToDotNetValue(s.Output),
            Error = s.Error,
            CreatedAt = s.CreatedAt,
            UpdatedAt = s.UpdatedAt,
        };
    }
}
