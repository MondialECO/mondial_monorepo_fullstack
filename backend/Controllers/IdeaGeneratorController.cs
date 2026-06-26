using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
    [ApiController]
    [Route("api/ai/idea-generator")]
    [Authorize]
    public class IdeaGeneratorController : ControllerBase
    {
        private readonly IIdeaGenerationSessionRepository _sessions;
        private readonly IAiJobService _jobService;
        private readonly IAiCreditService _creditService;
        private readonly AiSettings _settings;
        private readonly ILogger<IdeaGeneratorController> _logger;

        public IdeaGeneratorController(
            IIdeaGenerationSessionRepository sessions,
            IAiJobService jobService,
            IAiCreditService creditService,
            IOptions<AiSettings> settings,
            ILogger<IdeaGeneratorController> logger)
        {
            _sessions = sessions;
            _jobService = jobService;
            _creditService = creditService;
            _settings = settings.Value;
            _logger = logger;
        }

        private string CurrentUserId =>
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException();

        [HttpPost]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status402PaymentRequired)]
        [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
        [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
        public async Task<IActionResult> Start([FromBody] StartIdeaGenerationRequest request, CancellationToken cancellationToken)
        {
            var owner = CurrentUserId;

            if (!_settings.Enabled)
                return StatusCode(503, ApiResponse.Error("AI features are currently disabled.", HttpContext.TraceIdentifier));
            if (!_settings.Features.IdeaGenerator)
                return StatusCode(503, ApiResponse.Error("The Idea Generator is currently disabled.", HttpContext.TraceIdentifier));

            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
                return BadRequest(ApiResponse.Error(errors, HttpContext.TraceIdentifier));
            }

            try
            {
                // CRITICAL: Credit check BEFORE session creation
                await _creditService.DebitForJobAsync(owner, AiJobType.IdeaGenerator);
            }
            catch (InsufficientCreditsException ex)
            {
                _logger.LogWarning("User {UserId} insufficient credits for IdeaGenerator", owner);
                return StatusCode(402, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (AiRateLimitException ex)
            {
                return StatusCode(429, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }

            // Create session AFTER credit check passes
            var session = new IdeaGenerationSession
            {
                OwnerUserId = owner,
                Status = "Pending",
                Input = new IdeaGenerationInput
                {
                    Sectors = request.Sectors,
                    ObservedProblem = request.ObservedProblem,
                    Strengths = request.Strengths
                },
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var created = await _sessions.CreateAsync(session, cancellationToken);

            // Enqueue job
            var input = new BsonDocument
            {
                { "sectors", new BsonArray(request.Sectors) },
                { "observedProblem", request.ObservedProblem },
                { "strengths", new BsonArray(request.Strengths) },
                { "sessionId", created.Id.ToString() }
            };

            var jobId = await _jobService.EnqueueAsync(AiJobType.IdeaGenerator, owner, input);

            return Ok(ApiResponse.Ok("Idea generation started.", new { sessionId = created.Id.ToString(), jobId }));
        }

        [HttpGet("{sessionId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Get(string sessionId, CancellationToken cancellationToken)
        {
            if (!ObjectId.TryParse(sessionId, out _))
                return NotFound(ApiResponse.Error("Session not found.", HttpContext.TraceIdentifier));

            var session = await _sessions.GetByIdAsync(sessionId, cancellationToken);
            if (session == null)
                return NotFound(ApiResponse.Error("Session not found.", HttpContext.TraceIdentifier));

            var dto = new IdeaGenerationSessionDto
            {
                SessionId = session.Id.ToString(),
                Status = session.Status,
                BusinessIdeaId = session.BusinessIdeaId,
                Input = session.Input,
                Output = session.Output,
                ErrorMessage = session.ErrorMessage,
                CreatedAt = session.CreatedAt,
                UpdatedAt = session.UpdatedAt
            };

            return Ok(ApiResponse.Ok("OK", dto));
        }
    }
}
