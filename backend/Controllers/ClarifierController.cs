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
using WebApp.Services.Repository;

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
        private readonly ICreatorIdeaStore _creatorIdeas;

        public ClarifierController(
            IClarifierSessionStore sessions,
            IAiJobService jobService,
            IAiCreditService creditService,
            IAuditLogger audit,
            IOptions<AiSettings> settings,
            ILogger<ClarifierController> logger,
            ICreatorIdeaStore creatorIdeas)
        {
            _sessions = sessions;
            _jobService = jobService;
            _creditService = creditService;
            _audit = audit;
            _settings = settings.Value;
            _logger = logger;
            _creatorIdeas = creatorIdeas;
        }

        private string CurrentUserId =>
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException();

        [HttpPost]
        public async Task<IActionResult> Start([FromBody] StartClarifierRequest request)
        {
            var owner = CurrentUserId;

            if (string.IsNullOrWhiteSpace(request?.BusinessIdeaId))
                return BadRequest(ApiResponse.Error("businessIdeaId is required.", HttpContext.TraceIdentifier));
            if (!ObjectId.TryParse(request.BusinessIdeaId, out _) || await _creatorIdeas.GetOwnedAsync(request.BusinessIdeaId, owner) == null)
                return NotFound(ApiResponse.Error("Idea not found.", HttpContext.TraceIdentifier));

            if (!_settings.Enabled)
                return StatusCode(503, ApiResponse.Error("AI features are currently disabled.", HttpContext.TraceIdentifier));
            if (!_settings.Features.Clarifier)
                return StatusCode(503, ApiResponse.Error("The Idea Clarifier is currently disabled.", HttpContext.TraceIdentifier));

            var inFlightKey = $"{owner}:clarifier:{request.BusinessIdeaId}";
            var session = new ClarifierSession
            {
                OwnerUserId = owner,
                BusinessIdeaId = string.IsNullOrWhiteSpace(request.BusinessIdeaId) ? null : request.BusinessIdeaId,
                Status = "Pending",
                Input = BuildInput(request.RawIdea),
                InFlightKey = inFlightKey,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            var (created, activeSession) = await _sessions.TryCreateInFlightAsync(session);
            if (!created)
            {
                _logger.LogInformation("In-flight ClarifierSession {SessionId} joined for idea {BusinessIdeaId} by user {UserId}.",
                    activeSession.Id, request.BusinessIdeaId, owner);
                return Ok(ApiResponse.Ok("Idea Clarifier started.", new { sessionId = activeSession.Id, jobId = activeSession.RequestId }));
            }

            _audit.Record("IdeaClarifier.Start", owner, success: true,
                new { sessionId = session.Id, businessIdeaId = session.BusinessIdeaId });

            var creditOperationId = ObjectId.GenerateNewId().ToString();
            try
            {
                await _creditService.DebitForJobAsync(owner, AiJobType.IdeaClarifier, creditOperationId);
            }
            catch (InsufficientCreditsException ex)
            {
                // 402 here is always the creator's own zero balance: DebitForJobAsync is
                // local-ledger-only and never calls the provider. A provider 402 (our
                // OpenRouter billing) exists only in the async job path and surfaces via
                // the session's Failed state, not this catch.
                await _sessions.SetFailedAsync(session.Id, "Insufficient credits.");
                return StatusCode(402, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }

            // The handler reads sessionId from the job input to write back results.
            var input = new BsonDocument(session.Input!)
            {
                ["sessionId"] = session.Id,
                ["creditOperationId"] = creditOperationId
            };
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

            if (!string.IsNullOrWhiteSpace(businessIdeaId))
            {
                if (!ObjectId.TryParse(businessIdeaId, out _) || await _creatorIdeas.GetOwnedAsync(businessIdeaId, owner) == null)
                    return NotFound(ApiResponse.Error("Idea not found.", HttpContext.TraceIdentifier));
            }

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
            ["whyNow"] = raw.WhyNow ?? "",
            ["riskiestAssumption"] = raw.RiskiestAssumption ?? "",
            ["founderAdvantage"] = raw.FounderAdvantage ?? "",
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
