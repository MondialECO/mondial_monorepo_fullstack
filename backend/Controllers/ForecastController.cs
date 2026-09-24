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
using WebApp.Services.Repository;

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
        private readonly ICreatorIdeaStore _creatorIdeas;
        private readonly IAiJobService _jobService;
        private readonly IAiCreditService _creditService;
        private readonly IAuditLogger _audit;
        private readonly AiSettings _settings;
        private readonly ILogger<ForecastController> _logger;
        private readonly IBusinessModelSessionStore? _businessModels;
        private readonly IMarketStudySessionStore? _marketStudies;
        private readonly IFinancialAssumptionsService? _assumptionsService;

        private static readonly JsonSerializerOptions CamelCase = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        };

        public ForecastController(
            IForecastSessionStore sessions,
            IBusinessPlanSessionStore businessPlans,
            ICreatorIdeaStore creatorIdeas,
            IAiJobService jobService,
            IAiCreditService creditService,
            IAuditLogger audit,
            IOptions<AiSettings> settings,
            ILogger<ForecastController> logger,
            IBusinessModelSessionStore? businessModels = null,
            IMarketStudySessionStore? marketStudies = null,
            IFinancialAssumptionsService? assumptionsService = null)
        {
            _sessions = sessions;
            _businessPlans = businessPlans;
            _creatorIdeas = creatorIdeas;
            _jobService = jobService;
            _creditService = creditService;
            _audit = audit;
            _settings = settings.Value;
            _logger = logger;
            _businessModels = businessModels;
            _marketStudies = marketStudies;
            _assumptionsService = assumptionsService;
        }

        private string CurrentUserId =>
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException();

        /// <summary>
        /// AI-suggested Starting Budget based on the creator's real project context
        /// (Step 3.2 Business Model Canvas OPEX/unit economics, Step 3.1 TAM, idea parameters).
        /// Returns founder-confirmed/edited value if already persisted.
        /// </summary>
        [HttpGet("budget-suggestion")]
        public async Task<IActionResult> GetBudgetSuggestion([FromQuery] string? ideaId = null)
        {
            var owner = CurrentUserId;
            if (string.IsNullOrWhiteSpace(ideaId))
                return BadRequest(ApiResponse.Error("ideaId is required", HttpContext.TraceIdentifier));

            var idea = await _creatorIdeas.GetOwnedAsync(ideaId, owner);
            if (idea == null)
                return NotFound(ApiResponse.Error("Idea not found.", HttpContext.TraceIdentifier));

            // 1. Progressive Assumptions: Check if prepared session inputs already exist
            if (_assumptionsService != null)
            {
                var session = await _assumptionsService.GetOrCreateForecastSessionAsync(idea.Id, owner);
                if (session.Inputs?.StartingBudget.HasValue == true)
                {
                    var prov = session.Inputs.Provenance != null && session.Inputs.Provenance.TryGetValue("startingBudget", out var p)
                        ? p
                        : (session.Inputs.StartingBudgetProvenance ?? "ai_suggested");

                    var rationale = session.Inputs.StartingBudgetRationale
                        ?? (session.Inputs.Rationales != null && session.Inputs.Rationales.TryGetValue("startingBudget", out var r) ? r : null)
                        ?? "Tailored launch runway grounded in your business model.";

                    return Ok(ApiResponse.Ok("Budget suggestion", new
                    {
                        suggestedBudget = session.Inputs.StartingBudget.Value,
                        rationale,
                        runwayMonths = 6,
                        provenance = prov
                    }));
                }
            }

            // 2. Check if user already confirmed or stored a starting budget
            var latestSession = (await _sessions.ListByOwnerAsync(owner, 0, 5))
                .FirstOrDefault(s => s.BusinessIdeaId == idea.Id);

            if (latestSession?.Inputs?.StartingBudget.HasValue == true)
            {
                var prov = latestSession.Inputs.Provenance != null && latestSession.Inputs.Provenance.TryGetValue("startingBudget", out var p)
                    ? p
                    : "founder_confirmed";

                return Ok(ApiResponse.Ok("Budget suggestion", new
                {
                    suggestedBudget = latestSession.Inputs.StartingBudget.Value,
                    rationale = "Pre-filled from your existing saved forecast assumptions.",
                    runwayMonths = 6,
                    provenance = prov
                }));
            }

            // 3. Fallback: Derive AI-grounded suggestion from Step 3.2 (Business Model) and Step 3.1 (Market Study)
            BusinessModelSession? bm = null;
            if (!string.IsNullOrWhiteSpace(idea.Phase3Data?.BusinessModelSessionId) && _businessModels != null)
            {
                bm = await _businessModels.GetOwnedAsync(idea.Phase3Data.BusinessModelSessionId, owner);
            }

            var projectName = idea.Project?.Name ?? "your venture";
            double opex = 8000;
            double cac = 150;
            int runwayMonths = 6;

            var bmContent = bm?.Versions?.FirstOrDefault(v => v.Version == bm.CurrentVersion)?.Content;
            if (bmContent != null)
            {
                if (bmContent.Contains("unitEconomics") && bmContent["unitEconomics"].IsBsonDocument)
                {
                    var ue = bmContent["unitEconomics"].AsBsonDocument;
                    if (ue.Contains("cac") && ue["cac"].IsBsonDocument && ue["cac"].AsBsonDocument.Contains("amount"))
                    {
                        var amt = ue["cac"].AsBsonDocument["amount"].ToDouble();
                        if (amt > 0) cac = amt;
                    }
                }
                if (bmContent.Contains("canvas") && bmContent["canvas"].IsBsonDocument)
                {
                    var canvas = bmContent["canvas"].AsBsonDocument;
                    if (canvas.Contains("costStructure"))
                    {
                        var csStr = canvas["costStructure"].ToJson().ToLowerInvariant();
                        if (csStr.Contains("enterprise") || csStr.Contains("hardware") || csStr.Contains("inventory"))
                            opex = 12000;
                        else if (csStr.Contains("lean") || csStr.Contains("digital") || csStr.Contains("micro"))
                            opex = 5000;
                    }
                }
            }

            double calculated = Math.Round((opex * runwayMonths + (75 * cac)) / 1000.0) * 1000.0;
            double finalSuggested = Math.Clamp(calculated, 15000, 150000);

            var industrySector = !string.IsNullOrWhiteSpace(idea.Project?.Sector) ? idea.Project.Sector : (idea.Project?.Category ?? "business");
            string rationaleFallback = $"Based on your {industrySector} model for {projectName} with projected operating costs of ~€{opex:N0}/mo and customer acquisition allowance, a {runwayMonths}-month starting runway of €{finalSuggested:N0} provides sufficient capital to launch and achieve initial traction.";

            return Ok(ApiResponse.Ok("Budget suggestion", new
            {
                suggestedBudget = finalSuggested,
                rationale = rationaleFallback,
                runwayMonths,
                provenance = "ai_suggested"
            }));
        }

        /// <summary>
        /// Get the canonical forecast session for a given idea.
        /// </summary>
        [HttpGet("session")]
        public async Task<IActionResult> GetSessionByIdea([FromQuery] string? ideaId = null)
        {
            var owner = CurrentUserId;
            if (string.IsNullOrWhiteSpace(ideaId))
                return BadRequest(ApiResponse.Error("ideaId is required", HttpContext.TraceIdentifier));

            var idea = await _creatorIdeas.GetOwnedAsync(ideaId, owner);
            if (idea == null)
                return NotFound(ApiResponse.Error("Idea not found.", HttpContext.TraceIdentifier));

            if (_assumptionsService == null)
                return StatusCode(500, ApiResponse.Error("Assumptions service unavailable.", HttpContext.TraceIdentifier));

            var session = await _assumptionsService.GetOrCreateForecastSessionAsync(ideaId, owner);
            return Ok(ApiResponse.Ok("OK", ToDto(session, includeVersionContent: true)));
        }

        /// <summary>
        /// Get prepared progressive financial assumptions for an idea.
        /// </summary>
        [HttpGet("assumptions")]
        public async Task<IActionResult> GetAssumptions([FromQuery] string? ideaId = null)
        {
            var owner = CurrentUserId;
            if (string.IsNullOrWhiteSpace(ideaId))
                return BadRequest(ApiResponse.Error("ideaId is required", HttpContext.TraceIdentifier));

            var idea = await _creatorIdeas.GetOwnedAsync(ideaId, owner);
            if (idea == null)
                return NotFound(ApiResponse.Error("Idea not found.", HttpContext.TraceIdentifier));

            if (_assumptionsService == null)
                return StatusCode(500, ApiResponse.Error("Assumptions service unavailable.", HttpContext.TraceIdentifier));

            var session = await _assumptionsService.GetOrCreateForecastSessionAsync(ideaId, owner);
            var isCompleted = session.HasValidCompletedForecast();
            if (session.Inputs != null)
            {
                session.Inputs.HasCompletedForecast = isCompleted;
            }

            return Ok(ApiResponse.Ok("OK", new
            {
                sessionId = session.Id,
                status = session.Status,
                hasCompletedForecast = isCompleted,
                inputs = session.Inputs
            }));
        }

        /// <summary>
        /// Update founder assumptions on the idea's forecast session.
        /// </summary>
        [HttpPut("assumptions")]
        public async Task<IActionResult> UpdateAssumptions([FromBody] UpdateFinancialAssumptionsDto request, [FromQuery] string? ideaId = null)
        {
            var owner = CurrentUserId;
            var effectiveIdeaId = !string.IsNullOrWhiteSpace(ideaId) ? ideaId : request?.BusinessIdeaId;
            if (string.IsNullOrWhiteSpace(effectiveIdeaId))
                return BadRequest(ApiResponse.Error("ideaId is required", HttpContext.TraceIdentifier));

            var idea = await _creatorIdeas.GetOwnedAsync(effectiveIdeaId, owner);
            if (idea == null)
                return NotFound(ApiResponse.Error("Idea not found.", HttpContext.TraceIdentifier));

            if (_assumptionsService == null)
                return StatusCode(500, ApiResponse.Error("Assumptions service unavailable.", HttpContext.TraceIdentifier));

            var session = await _assumptionsService.UpdateFounderAssumptionsAsync(effectiveIdeaId, owner, request!);
            return Ok(ApiResponse.Ok("Assumptions updated", new
            {
                sessionId = session.Id,
                inputs = session.Inputs
            }));
        }

        [HttpPost]
        public async Task<IActionResult> Start([FromBody] StartForecastRequest request)
        {
            var owner = CurrentUserId;

            if (!_settings.Enabled)
                return StatusCode(503, ApiResponse.Error("AI features are currently disabled.", HttpContext.TraceIdentifier));
            if (!_settings.Features.Forecast)
                return StatusCode(503, ApiResponse.Error("The Forecast generator is currently disabled.", HttpContext.TraceIdentifier));

            // The forecast can use a completed business plan (when available, e.g. regenerations
            // or legacy flows) or build directly from the business idea (canonical new flow where
            // Forecast is Step 3.3 and Business Plan is Step 3.6).
            BusinessPlanSession? plan = null;
            if (!string.IsNullOrWhiteSpace(request.BusinessPlanSessionId))
            {
                if (!ObjectId.TryParse(request.BusinessPlanSessionId, out _))
                    return UnprocessableEntity(ApiResponse.Error("business_plan_required", HttpContext.TraceIdentifier,
                        new { message = "Invalid business plan session id." }));

                plan = await _businessPlans.GetOwnedAsync(request.BusinessPlanSessionId, owner);
                if (plan is null)
                    return UnprocessableEntity(ApiResponse.Error("business_plan_not_found", HttpContext.TraceIdentifier,
                        new { message = "Business plan not found." }));
                if (!IsPlanUsable(plan))
                    return UnprocessableEntity(ApiResponse.Error("business_plan_not_complete", HttpContext.TraceIdentifier,
                        new { message = "Complete your business plan before running the forecast." }));
            }
            else if (string.IsNullOrWhiteSpace(request.BusinessIdeaId))
            {
                return BadRequest(ApiResponse.Error("ideaId is required", HttpContext.TraceIdentifier));
            }

            var isSubscriptionModel = !string.Equals(request.BusinessModelType, "ecommerce", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(request.BusinessModelType, "marketplace", StringComparison.OrdinalIgnoreCase);

            if (isSubscriptionModel)
            {
                if (!request.MonthlyChurnPct.HasValue)
                    return UnprocessableEntity(ApiResponse.Error("churn_required", HttpContext.TraceIdentifier,
                        new { message = "Enter your monthly churn rate before running the forecast." }));
                if (request.MonthlyChurnPct.Value <= 0 || request.MonthlyChurnPct.Value > 50)
                    return UnprocessableEntity(ApiResponse.Error("churn_out_of_range", HttpContext.TraceIdentifier,
                        new { message = "Monthly churn must be between 0 and 50%." }));
            }
            else
            {
                if (request.MonthlyChurnPct.HasValue && (request.MonthlyChurnPct.Value < 0 || request.MonthlyChurnPct.Value > 50))
                    return UnprocessableEntity(ApiResponse.Error("churn_out_of_range", HttpContext.TraceIdentifier,
                        new { message = "Monthly churn must be between 0 and 50%." }));
            }

            var planSessionId = plan?.Id;
            // Multi-idea STEP 2: inherit the idea anchor from the plan (if present) or request value.
            var businessIdeaId = !string.IsNullOrWhiteSpace(plan?.BusinessIdeaId)
                ? plan.BusinessIdeaId
                : (string.IsNullOrWhiteSpace(request.BusinessIdeaId) ? null : request.BusinessIdeaId);

            if (!string.IsNullOrWhiteSpace(businessIdeaId))
            {
                if (!ObjectId.TryParse(businessIdeaId, out _) || await _creatorIdeas.GetOwnedAsync(businessIdeaId, owner) == null)
                    return NotFound(ApiResponse.Error("Idea not found.", HttpContext.TraceIdentifier));
            }

            var inFlightKey = !string.IsNullOrEmpty(planSessionId)
                ? $"{owner}:forecast:{planSessionId}"
                : $"{owner}:forecast:idea:{businessIdeaId ?? "standalone"}";


            // Canonical TAM anchoring from Step 3.1 Market Study (Single Source of Truth)
            double? canonicalTam = request.Tam;
            if (!string.IsNullOrWhiteSpace(businessIdeaId) && _marketStudies != null)
            {
                var ideaDoc = await _creatorIdeas.GetOwnedAsync(businessIdeaId, owner);
                if (!string.IsNullOrWhiteSpace(ideaDoc?.Phase3Data?.MarketStudySessionId))
                {
                    var ms = await _marketStudies.GetOwnedAsync(ideaDoc.Phase3Data.MarketStudySessionId, owner);
                    var msContent = ms?.Versions.FirstOrDefault(v => v.Version == ms.CurrentVersion)?.Content;
                    if (msContent != null && msContent.Contains("marketSizing") && msContent["marketSizing"].IsBsonDocument)
                    {
                        var sizing = msContent["marketSizing"].AsBsonDocument;
                        if (sizing.Contains("tam") && sizing["tam"].IsBsonDocument && sizing["tam"].AsBsonDocument.Contains("value"))
                        {
                            canonicalTam = sizing["tam"].AsBsonDocument["value"].ToDouble();
                        }
                    }
                }
            }

            // Create the session first so it owns the lifecycle (source of truth).
            var session = new ForecastSession
            {
                OwnerUserId = owner,
                BusinessPlanSessionId = planSessionId,
                Inputs = new ForecastInputs
                {
                    StartingBudget = request.StartingBudget,
                    LaunchSubscribers = request.LaunchSubscribers,
                    VariableCost = request.VariableCost,
                    Arpu = request.Arpu,
                    Opex = request.Opex,
                    MonthlyGrowthPct = request.MonthlyGrowthPct,
                    Tam = canonicalTam ?? request.Tam,
                    MonthlyChurnPct = request.MonthlyChurnPct,
                    BusinessModelType = request.BusinessModelType,
                    AverageOrderValue = request.AverageOrderValue,
                    TakeRatePct = request.TakeRatePct,
                    TaxRatePct = request.TaxRatePct,
                    Provenance = request.Provenance,
                    UpdatedAt = DateTime.UtcNow
                },
                BusinessIdeaId = businessIdeaId,
                Status = "Pending",
                InFlightKey = inFlightKey,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            var (created, activeSession) = await _sessions.TryCreateInFlightAsync(session);
            if (!created)
            {
                _logger.LogInformation("In-flight ForecastSession {SessionId} joined for business plan {BusinessPlanSessionId} by user {UserId}.",
                    activeSession.Id, planSessionId, owner);
                return Ok(ApiResponse.Ok("Forecast generation started.", new { sessionId = activeSession.Id, jobId = activeSession.RequestId }));
            }

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

        /// <summary>Run the AI generation again by idea context.</summary>
        [HttpPost("regenerate")]
        public async Task<IActionResult> RegenerateByIdea([FromQuery] string? ideaId = null, [FromBody] StartForecastRequest? request = null)
        {
            var owner = CurrentUserId;
            var effectiveIdeaId = !string.IsNullOrWhiteSpace(ideaId) ? ideaId : request?.BusinessIdeaId;
            if (string.IsNullOrWhiteSpace(effectiveIdeaId))
                return BadRequest(ApiResponse.Error("ideaId is required", HttpContext.TraceIdentifier));

            var idea = await _creatorIdeas.GetOwnedAsync(effectiveIdeaId, owner);
            if (idea == null)
                return NotFound(ApiResponse.Error("Idea not found.", HttpContext.TraceIdentifier));

            if (_assumptionsService == null)
                return StatusCode(500, ApiResponse.Error("Assumptions service unavailable.", HttpContext.TraceIdentifier));

            var session = await _assumptionsService.GetOrCreateForecastSessionAsync(effectiveIdeaId, owner);
            return await Regenerate(session.Id, request, effectiveIdeaId);
        }

        /// <summary>Run the AI generation again, preserving prior versions.</summary>
        [HttpPost("{sessionId}/regenerate")]
        public async Task<IActionResult> Regenerate(string sessionId, [FromBody] StartForecastRequest? request = null, [FromQuery] string? ideaId = null)
        {
            var owner = CurrentUserId;

            if (!_settings.Enabled)
                return StatusCode(503, ApiResponse.Error("AI features are currently disabled.", HttpContext.TraceIdentifier));
            if (!_settings.Features.Forecast)
                return StatusCode(503, ApiResponse.Error("The Forecast generator is currently disabled.", HttpContext.TraceIdentifier));

            var effectiveIdeaId = !string.IsNullOrWhiteSpace(ideaId) ? ideaId : request?.BusinessIdeaId;
            if (!string.IsNullOrWhiteSpace(effectiveIdeaId))
            {
                var idea = await _creatorIdeas.GetOwnedAsync(effectiveIdeaId, owner);
                if (idea == null)
                    return NotFound(ApiResponse.Error("Idea not found.", HttpContext.TraceIdentifier));
            }

            if (!ObjectId.TryParse(sessionId, out _))
                return NotFound(ApiResponse.Error("Session not found.", HttpContext.TraceIdentifier));

            var session = await _sessions.GetOwnedAsync(sessionId, owner);
            if (session is null)
                return NotFound(ApiResponse.Error("Session not found.", HttpContext.TraceIdentifier));

            if (request is not null)
            {
                var newInputs = new ForecastInputs
                {
                    StartingBudget = request.StartingBudget ?? session.Inputs?.StartingBudget,
                    LaunchSubscribers = request.LaunchSubscribers ?? session.Inputs?.LaunchSubscribers,
                    VariableCost = request.VariableCost ?? session.Inputs?.VariableCost,
                    Arpu = request.Arpu ?? session.Inputs?.Arpu,
                    Opex = request.Opex ?? session.Inputs?.Opex,
                    MonthlyGrowthPct = request.MonthlyGrowthPct ?? session.Inputs?.MonthlyGrowthPct,
                    Tam = session.Inputs?.Tam ?? request.Tam, // Canonical TAM from Step 3.1 preserved
                    MonthlyChurnPct = request.MonthlyChurnPct ?? session.Inputs?.MonthlyChurnPct,
                    Provenance = request.Provenance ?? session.Inputs?.Provenance ?? new Dictionary<string, string>(),
                    BusinessModelType = request.BusinessModelType ?? session.Inputs?.BusinessModelType,
                    AverageOrderValue = request.AverageOrderValue ?? session.Inputs?.AverageOrderValue,
                    TakeRatePct = request.TakeRatePct ?? session.Inputs?.TakeRatePct,
                    TaxRatePct = request.TaxRatePct ?? session.Inputs?.TaxRatePct,
                    StartingBudgetRationale = session.Inputs?.StartingBudgetRationale,
                    MarketStudyVersion = session.Inputs?.MarketStudyVersion,
                    BusinessModelVersion = session.Inputs?.BusinessModelVersion,
                    Rationales = session.Inputs?.Rationales,
                    NeedsFounderInput = session.Inputs?.NeedsFounderInput,
                    ActiveDrivers = session.Inputs?.ActiveDrivers,
                    UpdatedAt = DateTime.UtcNow
                };
                session.Inputs = newInputs;
                await _sessions.UpdateInputsAsync(session.Id, newInputs);
            }

            // Atomically acquire in-flight lock BEFORE debiting
            var (acquired, activeSession) = await _sessions.TryAcquireRegenerateLockAsync(sessionId, owner);
            if (!acquired)
            {
                _logger.LogInformation("In-flight Forecast regenerate joined for session {SessionId} by user {UserId}.",
                    sessionId, owner);
                return Ok(ApiResponse.Ok("Forecast regeneration started.", new { sessionId = activeSession!.Id, jobId = activeSession.RequestId }));
            }

            _audit.Record("Forecast.Regenerate", owner, success: true,
                new { sessionId = session.Id, currentVersion = session.CurrentVersion });

            var jobId = await EnqueueGenerationAsync(session, owner);
            if (jobId is null)
                return StatusCode(402, ApiResponse.Error("Insufficient credits.", HttpContext.TraceIdentifier));

            return Ok(ApiResponse.Ok("Forecast generation started.", new { sessionId = session.Id, jobId }));
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
            var creditOperationId = ObjectId.GenerateNewId().ToString();
            try
            {
                await _creditService.DebitForJobAsync(owner, AiJobType.Forecast, creditOperationId);
            }
            catch (InsufficientCreditsException)
            {
                // Unset InFlightKey via SetFailedAsync (which calls TryRestoreCompletedAsync when CurrentVersion > 0)
                await _sessions.SetFailedAsync(session.Id, "Insufficient credits.");
                return null;
            }

            var input = new BsonDocument
            {
                ["sessionId"] = session.Id,
                ["creditOperationId"] = creditOperationId
            };
            if (!string.IsNullOrEmpty(session.BusinessPlanSessionId))
                input["businessPlanSessionId"] = session.BusinessPlanSessionId;
            if (session.BusinessIdeaId != null)
                input["businessIdeaId"] = session.BusinessIdeaId;
            // Standalone forecast inputs → the handler computes from these.
            if (session.Inputs is not null)
            {
                if (session.Inputs.StartingBudget.HasValue) input["startingBudget"] = session.Inputs.StartingBudget.Value;
                if (session.Inputs.LaunchSubscribers.HasValue) input["launchSubscribers"] = session.Inputs.LaunchSubscribers.Value;
                if (session.Inputs.VariableCost.HasValue) input["variableCost"] = session.Inputs.VariableCost.Value;
                if (session.Inputs.Arpu.HasValue) input["arpu"] = session.Inputs.Arpu.Value;
                if (session.Inputs.Opex.HasValue) input["opex"] = session.Inputs.Opex.Value;
                if (session.Inputs.MonthlyGrowthPct.HasValue) input["monthlyGrowthPct"] = session.Inputs.MonthlyGrowthPct.Value;
                if (session.Inputs.Tam.HasValue) input["tam"] = session.Inputs.Tam.Value;
                if (session.Inputs.MonthlyChurnPct.HasValue) input["monthlyChurnPct"] = session.Inputs.MonthlyChurnPct.Value;
                if (!string.IsNullOrWhiteSpace(session.Inputs.BusinessModelType)) input["businessModelType"] = session.Inputs.BusinessModelType;
                if (session.Inputs.AverageOrderValue.HasValue) input["averageOrderValue"] = session.Inputs.AverageOrderValue.Value;
                if (session.Inputs.TakeRatePct.HasValue) input["takeRatePct"] = session.Inputs.TakeRatePct.Value;
                if (session.Inputs.TaxRatePct.HasValue) input["taxRatePct"] = session.Inputs.TaxRatePct.Value;
                if (session.Inputs.ActiveDrivers != null)
                {
                    var adDoc = new BsonDocument();
                    foreach (var (k, v) in session.Inputs.ActiveDrivers)
                        adDoc[k] = v;
                    input["activeDrivers"] = adDoc;
                }
            }

            try
            {
                var jobId = await _jobService.EnqueueAsync(AiJobType.Forecast, owner, input);
                await _sessions.SetRequestIdAsync(session.Id, jobId);
                return jobId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to enqueue forecast job after credit debit for user {OwnerUserId}", owner);
                try
                {
                    await _creditService.RefundForJobAsync(owner, AiJobType.Forecast, creditOperationId, "Enqueue failed before acceptance");
                }
                catch (Exception refundEx)
                {
                    _logger.LogCritical(refundEx, "CRITICAL: Credit compensation failed for user {OwnerUserId} after forecast enqueue failure", owner);
                }

                await _sessions.SetFailedAsync(session.Id, "Enqueue failed.");
                throw;
            }
        }

        private static ForecastSessionDto ToDto(ForecastSession s, bool includeVersionContent)
        {
            var latestValid = s.GetLatestValidCompletedVersion();
            var current = s.Versions.FirstOrDefault(v => v.Version == s.CurrentVersion);
            var activeContent = current?.Content ?? latestValid?.Content;

            return new ForecastSessionDto
            {
                SessionId = s.Id,
                Status = s.Status,
                BusinessPlanSessionId = s.BusinessPlanSessionId,
                BusinessIdeaId = s.BusinessIdeaId,
                CurrentVersion = s.CurrentVersion,
                LatestValidVersion = latestValid?.Version,
                HasValidCompletedForecast = latestValid != null,
                SchemaVersion = s.SchemaVersion,
                Inputs = s.Inputs, // the stored generation inputs, for form pre-fill
                Output = activeContent is null ? null : BsonTypeMapper.MapToDotNetValue(activeContent),
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
