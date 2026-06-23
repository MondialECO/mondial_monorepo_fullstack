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
using WebApp.Services.Audit;
using WebApp.Services.Repository.Ai;

namespace WebApp.Controllers
{
    /// <summary>
    /// C-4 Forecast surface. Owner-scoped: a user can only generate forecasts from
    /// their own (Completed) business-plan sessions and read/edit their own forecasts.
    /// The session is the C-4 source of truth; each generation runs a single AI engine
    /// job (AIRequests/AIResponses) under the hood via <see cref="IAiJobService"/> and
    /// is preserved as an append-only version. Edits update the current version without
    /// an AI run. Notifications + realtime updates are delivered by the shared job
    /// engine completion pipeline (no controller involvement). Responses use the shared
    /// <see cref="ApiResponse"/> envelope, mirroring <see cref="BusinessPlanController"/>.
    /// </summary>
    [ApiController]
    [Route("api/ai/forecast")]
    [Authorize]
    [EnableRateLimiting("ai")]
    public class ForecastController : ControllerBase
    {
        private readonly IForecastSessionStore _sessions;
        private readonly IBusinessPlanSessionStore _businessPlans;
        private readonly IAiJobService _jobService;
        private readonly IAiCreditService _creditService;
        private readonly IAuditLogger _audit;
        private readonly AiSettings _settings;
        private readonly ILogger<ForecastController> _logger;

        private static readonly JsonSerializerOptions CamelCase = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        };

        public ForecastController(
            IForecastSessionStore sessions,
            IBusinessPlanSessionStore businessPlans,
            IAiJobService jobService,
            IAiCreditService creditService,
            IAuditLogger audit,
            IOptions<AiSettings> settings,
            ILogger<ForecastController> logger)
        {
            _sessions = sessions;
            _businessPlans = businessPlans;
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
        public async Task<IActionResult> Start([FromBody] StartForecastRequest request)
        {
            var owner = CurrentUserId;

            if (!_settings.Enabled)
                return StatusCode(503, ApiResponse.Error("AI features are currently disabled.", HttpContext.TraceIdentifier));
            if (!_settings.Features.Forecast)
                return StatusCode(503, ApiResponse.Error("The Forecast generator is currently disabled.", HttpContext.TraceIdentifier));

            // The forecast REQUIRES a completed business plan (new order: plan = step 2,
            // forecast = step 3). Enforced server-side so a direct API call can't bypass
            // the frontend guard — both layers express the same rule (no R3-class divergence).
            // The numeric Inputs still apply; businessPlanSessionId is required-in-flow here
            // but stays nullable/BsonIgnoreIfNull at the storage layer.
            if (string.IsNullOrWhiteSpace(request.BusinessPlanSessionId) || !ObjectId.TryParse(request.BusinessPlanSessionId, out _))
                return UnprocessableEntity(ApiResponse.Error("business_plan_required", HttpContext.TraceIdentifier,
                    new { message = "Generate your business plan before running the forecast." }));

            var plan = await _businessPlans.GetOwnedAsync(request.BusinessPlanSessionId, owner);
            if (plan is null)
                return UnprocessableEntity(ApiResponse.Error("business_plan_not_found", HttpContext.TraceIdentifier,
                    new { message = "Business plan not found." }));
            if (!IsPlanUsable(plan))
                return UnprocessableEntity(ApiResponse.Error("business_plan_not_complete", HttpContext.TraceIdentifier,
                    new { message = "Complete your business plan before running the forecast." }));

            // Churn is required-in-flow (drives the readiness LTV/CAC), nullable-at-storage
            // for older sessions. Bound: 0 < churn <= 50 (%/month) — above ~50%/month a
            // subscription business is non-viable, so we reject rather than score it.
            if (!request.MonthlyChurnPct.HasValue)
                return UnprocessableEntity(ApiResponse.Error("churn_required", HttpContext.TraceIdentifier,
                    new { message = "Enter your monthly churn rate before running the forecast." }));
            if (request.MonthlyChurnPct.Value <= 0 || request.MonthlyChurnPct.Value > 50)
                return UnprocessableEntity(ApiResponse.Error("churn_out_of_range", HttpContext.TraceIdentifier,
                    new { message = "Monthly churn must be between 0 and 50%." }));

            var planSessionId = request.BusinessPlanSessionId;
            var businessIdeaId = string.IsNullOrWhiteSpace(request.BusinessIdeaId) ? null : request.BusinessIdeaId;

            // Create the session first so it owns the lifecycle (source of truth).
            var session = new ForecastSession
            {
                OwnerUserId = owner,
                BusinessPlanSessionId = planSessionId,
                Inputs = new ForecastInputs
                {
                    Arpu = request.Arpu,
                    Opex = request.Opex,
                    MonthlyGrowthPct = request.MonthlyGrowthPct,
                    Tam = request.Tam,
                    MonthlyChurnPct = request.MonthlyChurnPct,
                },
                BusinessIdeaId = businessIdeaId,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };
            await _sessions.AddAsync(session); // ObjectId id assigned here

            _audit.Record("Forecast.Start", owner, success: true,
                new { sessionId = session.Id, businessPlanSessionId = session.BusinessPlanSessionId, businessIdeaId });

            var jobId = await EnqueueGenerationAsync(session, owner);
            if (jobId is null)
                return StatusCode(402, ApiResponse.Error("Insufficient credits.", HttpContext.TraceIdentifier));

            return Ok(ApiResponse.Ok("Forecast generation started.", new { sessionId = session.Id, jobId }));
        }

        [HttpGet("{sessionId}")]
        public async Task<IActionResult> Get(string sessionId)
        {
            if (!ObjectId.TryParse(sessionId, out _))
                return NotFound(ApiResponse.Error("Session not found.", HttpContext.TraceIdentifier));

            var session = await _sessions.GetOwnedAsync(sessionId, CurrentUserId);
            if (session is null)
                return NotFound(ApiResponse.Error("Session not found.", HttpContext.TraceIdentifier));

            return Ok(ApiResponse.Ok("OK", ToDto(session, includeVersionContent: true)));
        }

        [HttpGet]
        public async Task<IActionResult> List(string? businessPlanSessionId = null, int skip = 0, int limit = 30)
        {
            skip = Math.Max(0, skip);
            limit = Math.Clamp(limit, 1, 100);
            var owner = CurrentUserId;

            List<ForecastSession> sessions;
            if (!string.IsNullOrWhiteSpace(businessPlanSessionId))
                sessions = await _sessions.ListByBusinessPlanAsync(businessPlanSessionId, owner, skip, limit);
            else
                sessions = await _sessions.ListByOwnerAsync(owner, skip, limit);

            return Ok(ApiResponse.Ok("OK", sessions.Select(s => ToDto(s, includeVersionContent: false))));
        }

        /// <summary>Run the AI generation again, preserving prior versions.</summary>
        [HttpPost("{sessionId}/regenerate")]
        public async Task<IActionResult> Regenerate(string sessionId)
        {
            var owner = CurrentUserId;

            if (!_settings.Enabled)
                return StatusCode(503, ApiResponse.Error("AI features are currently disabled.", HttpContext.TraceIdentifier));
            if (!_settings.Features.Forecast)
                return StatusCode(503, ApiResponse.Error("The Forecast generator is currently disabled.", HttpContext.TraceIdentifier));
            if (!ObjectId.TryParse(sessionId, out _))
                return NotFound(ApiResponse.Error("Session not found.", HttpContext.TraceIdentifier));

            var session = await _sessions.GetOwnedAsync(sessionId, owner);
            if (session is null)
                return NotFound(ApiResponse.Error("Session not found.", HttpContext.TraceIdentifier));

            // Regenerate re-runs from the session's stored inputs + its linked business
            // plan (validated at Start). The plan is the forecast's authoritative context.

            _audit.Record("Forecast.Regenerate", owner, success: true,
                new { sessionId = session.Id, currentVersion = session.CurrentVersion });

            var jobId = await EnqueueGenerationAsync(session, owner);
            if (jobId is null)
                return StatusCode(402, ApiResponse.Error("Insufficient credits.", HttpContext.TraceIdentifier));

            await _sessions.SetProcessingAsync(session.Id);

            return Ok(ApiResponse.Ok("Forecast regeneration started.", new { sessionId = session.Id, jobId }));
        }

        /// <summary>Edit the current version's forecast in place — no AI run.</summary>
        [HttpPut("{sessionId}")]
        public async Task<IActionResult> Edit(string sessionId, [FromBody] EditForecastRequest request)
        {
            if (!ObjectId.TryParse(sessionId, out _))
                return NotFound(ApiResponse.Error("Session not found.", HttpContext.TraceIdentifier));

            var owner = CurrentUserId;
            var session = await _sessions.GetOwnedAsync(sessionId, owner);
            if (session is null)
                return NotFound(ApiResponse.Error("Session not found.", HttpContext.TraceIdentifier));
            if (session.CurrentVersion <= 0)
                return Conflict(ApiResponse.Error("There is no generated forecast to edit yet.", HttpContext.TraceIdentifier));

            // Normalize to the camelCase contract shape and pin the schema version.
            var json = JsonSerializer.Serialize(request.Forecast, CamelCase);
            BsonDocument content;
            try
            {
                content = BsonDocument.Parse(json);
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse.Error($"Invalid forecast content: {ex.Message}", HttpContext.TraceIdentifier));
            }
            content["schemaVersion"] = ForecastOutputDto.CurrentSchemaVersion;

            await _sessions.EditCurrentVersionAsync(session.Id, session.CurrentVersion, content);

            _audit.Record("Forecast.Edit", owner, success: true,
                new { sessionId = session.Id, version = session.CurrentVersion });

            var updated = await _sessions.GetOwnedAsync(session.Id, owner);
            return Ok(ApiResponse.Ok("Forecast updated.", ToDto(updated!, includeVersionContent: true)));
        }

        /// <summary>A business plan is usable as forecast input once it has a completed current version.</summary>
        private static bool IsPlanUsable(BusinessPlanSession plan) =>
            string.Equals(plan.Status, "Completed", StringComparison.Ordinal) && plan.CurrentVersion > 0;

        /// <summary>
        /// Debit the Forecast credit cost and enqueue one engine job. Returns the job
        /// id, or null when the owner has insufficient credits (caller maps to 402).
        /// </summary>
        private async Task<string?> EnqueueGenerationAsync(ForecastSession session, string owner)
        {
            try
            {
                await _creditService.DebitForJobAsync(owner, AiJobType.Forecast);
            }
            catch (InsufficientCreditsException)
            {
                // Only fail the session on the very first attempt; a regenerate keeps
                // the existing completed forecast intact.
                if (session.CurrentVersion <= 0)
                    await _sessions.SetFailedAsync(session.Id, "Insufficient credits.");
                return null;
            }

            var input = new BsonDocument { ["sessionId"] = session.Id };
            if (!string.IsNullOrEmpty(session.BusinessPlanSessionId))
                input["businessPlanSessionId"] = session.BusinessPlanSessionId;
            if (session.BusinessIdeaId != null)
                input["businessIdeaId"] = session.BusinessIdeaId;
            // Standalone forecast inputs → the handler computes from these.
            if (session.Inputs is not null)
            {
                if (session.Inputs.Arpu.HasValue) input["arpu"] = session.Inputs.Arpu.Value;
                if (session.Inputs.Opex.HasValue) input["opex"] = session.Inputs.Opex.Value;
                if (session.Inputs.MonthlyGrowthPct.HasValue) input["monthlyGrowthPct"] = session.Inputs.MonthlyGrowthPct.Value;
                if (session.Inputs.Tam.HasValue) input["tam"] = session.Inputs.Tam.Value;
                if (session.Inputs.MonthlyChurnPct.HasValue) input["monthlyChurnPct"] = session.Inputs.MonthlyChurnPct.Value;
            }

            var jobId = await _jobService.EnqueueAsync(AiJobType.Forecast, owner, input);
            await _sessions.SetRequestIdAsync(session.Id, jobId);
            return jobId;
        }

        private static ForecastSessionDto ToDto(ForecastSession s, bool includeVersionContent)
        {
            var current = s.Versions.FirstOrDefault(v => v.Version == s.CurrentVersion);

            return new ForecastSessionDto
            {
                SessionId = s.Id,
                Status = s.Status,
                BusinessPlanSessionId = s.BusinessPlanSessionId,
                BusinessIdeaId = s.BusinessIdeaId,
                CurrentVersion = s.CurrentVersion,
                SchemaVersion = s.SchemaVersion,
                Output = current?.Content is null ? null : BsonTypeMapper.MapToDotNetValue(current.Content),
                Versions = s.Versions
                    .OrderBy(v => v.Version)
                    .Select(v => new ForecastVersionDto
                    {
                        Version = v.Version,
                        IsEdited = v.IsEdited,
                        RequestId = v.RequestId,
                        Content = includeVersionContent && v.Content is not null
                            ? BsonTypeMapper.MapToDotNetValue(v.Content)
                            : null,
                        CreatedAt = v.CreatedAt,
                        UpdatedAt = v.UpdatedAt,
                    })
                    .ToList(),
                Error = s.Error,
                CreatedAt = s.CreatedAt,
                UpdatedAt = s.UpdatedAt,
            };
        }
    }
}
