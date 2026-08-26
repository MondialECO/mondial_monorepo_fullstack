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
    /// C-3 Business Plan surface. Owner-scoped: a user can only generate plans for
    /// their own clarifier sessions and read/edit their own plans. The session is
    /// the C-3 source of truth; each generation runs a single AI engine job
    /// (AIRequests/AIResponses) under the hood via <see cref="IAiJobService"/> and is
    /// preserved as an append-only version (locked C-3 decisions #4/#5). Edits update
    /// the current version without an AI run (locked C-3 decision #6). Responses use
    /// the shared <see cref="ApiResponse"/> envelope.
    /// </summary>
    [ApiController]
    [Route("api/ai/business-plan")]
    [Authorize]
    [EnableRateLimiting("ai")]
    public class BusinessPlanController : ControllerBase
    {
        private readonly IBusinessPlanSessionStore _sessions;
        private readonly IClarifierSessionStore _clarifiers;
        private readonly IAiJobService _jobService;
        private readonly IAiCreditService _creditService;
        private readonly IAuditLogger _audit;
        private readonly AiSettings _settings;
        private readonly ILogger<BusinessPlanController> _logger;

        private static readonly JsonSerializerOptions CamelCase = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        };

        private readonly StackExchange.Redis.IConnectionMultiplexer? _redis;

        public BusinessPlanController(
            IBusinessPlanSessionStore sessions,
            IClarifierSessionStore clarifiers,
            IAiJobService jobService,
            IAiCreditService creditService,
            IAuditLogger audit,
            IOptions<AiSettings> settings,
            ILogger<BusinessPlanController> logger,
            IServiceProvider services)
        {
            _sessions = sessions;
            _clarifiers = clarifiers;
            _jobService = jobService;
            _creditService = creditService;
            _audit = audit;
            _settings = settings.Value;
            _logger = logger;
            _redis = services.GetService(typeof(StackExchange.Redis.IConnectionMultiplexer)) as StackExchange.Redis.IConnectionMultiplexer;
        }

        private string CurrentUserId =>
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException();

        [HttpPost]
        public async Task<IActionResult> Start([FromBody] StartBusinessPlanRequest request)
        {
            var owner = CurrentUserId;

            if (!_settings.Enabled)
                return StatusCode(503, ApiResponse.Error("AI features are currently disabled.", HttpContext.TraceIdentifier));
            if (!_settings.Features.BusinessPlan)
                return StatusCode(503, ApiResponse.Error("The Business Plan generator is currently disabled.", HttpContext.TraceIdentifier));

            if (!ObjectId.TryParse(request.ClarifierSessionId, out _))
                return NotFound(ApiResponse.Error("Clarifier session not found.", HttpContext.TraceIdentifier));

            // The clarifier output is the sole authoritative input (locked decision #2):
            // require a completed clarifier session owned by the caller.
            var clarifier = await _clarifiers.GetOwnedAsync(request.ClarifierSessionId, owner);
            if (clarifier is null)
                return NotFound(ApiResponse.Error("Clarifier session not found.", HttpContext.TraceIdentifier));
            if (!string.Equals(clarifier.Status, "Completed", StringComparison.Ordinal) || clarifier.Output is null)
                return Conflict(ApiResponse.Error("The clarifier session must be completed before generating a business plan.", HttpContext.TraceIdentifier));

            // Multi-idea STEP 2: inherit the idea anchor from the (already-loaded, validated)
            // clarifier so every plan — including regenerations — joins the SAME idea. Falls
            // back to the optional request value for non-creator-flow callers.
            var businessIdeaId = !string.IsNullOrWhiteSpace(clarifier.BusinessIdeaId)
                ? clarifier.BusinessIdeaId
                : (string.IsNullOrWhiteSpace(request.BusinessIdeaId) ? null : request.BusinessIdeaId);

            // Pre-allocate the session ID so it serves as the stable idempotency key for debit and compensation
            var sessionId = ObjectId.GenerateNewId().ToString();

            // Step 1: Secure credit debit BEFORE creating or persisting the session.
            try
            {
                await _creditService.DebitForJobAsync(owner, AiJobType.BusinessPlan, sessionId);
            }
            catch (InsufficientCreditsException)
            {
                _audit.Record("BusinessPlan.Start", owner, success: false,
                    new { clarifierSessionId = request.ClarifierSessionId, businessIdeaId, error = "insufficient_credits" });
                return StatusCode(402, ApiResponse.Error("Insufficient credits.", HttpContext.TraceIdentifier));
            }

            // Step 2: Create session in-memory and persist
            var session = new BusinessPlanSession
            {
                Id = sessionId,
                OwnerUserId = owner,
                ClarifierSessionId = request.ClarifierSessionId,
                BusinessIdeaId = businessIdeaId,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            try
            {
                await _sessions.AddAsync(session);

                var input = new BsonDocument
                {
                    ["sessionId"] = session.Id,
                    ["clarifierSessionId"] = session.ClarifierSessionId,
                };
                if (session.BusinessIdeaId != null)
                    input["businessIdeaId"] = session.BusinessIdeaId;

                var jobId = await _jobService.EnqueueAsync(AiJobType.BusinessPlan, owner, input);
                await _sessions.SetRequestIdAsync(session.Id, jobId);

                _audit.Record("BusinessPlan.Start", owner, success: true,
                    new { sessionId = session.Id, clarifierSessionId = session.ClarifierSessionId, businessIdeaId, jobId });

                return Ok(ApiResponse.Ok("Business plan generation started.", new { sessionId = session.Id, jobId }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to complete session creation or job enqueue after credit debit for user {OwnerUserId}", owner);
                try
                {
                    await _creditService.RefundForJobAsync(owner, AiJobType.BusinessPlan, sessionId, "Start generation failed before acceptance");
                }
                catch (Exception refundEx)
                {
                    _logger.LogCritical(refundEx, "CRITICAL: Credit compensation failed for user {OwnerUserId} after generation failure", owner);
                }

                if (!string.IsNullOrEmpty(session.Id))
                {
                    try
                    {
                        await _sessions.DeleteAsync(session.Id);
                    }
                    catch (Exception deleteEx)
                    {
                        _logger.LogWarning(deleteEx, "Failed to clean up unaccepted session {SessionId}", session.Id);
                    }
                }

                _audit.Record("BusinessPlan.Start", owner, success: false,
                    new { clarifierSessionId = request.ClarifierSessionId, businessIdeaId, error = "session_or_enqueue_failed" });

                return StatusCode(500, ApiResponse.Error("Failed to start business plan generation. Please retry.", HttpContext.TraceIdentifier));
            }
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
        public async Task<IActionResult> List(string? clarifierSessionId = null, string? businessIdeaId = null, int skip = 0, int limit = 30)
        {
            skip = Math.Max(0, skip);
            limit = Math.Clamp(limit, 1, 100);
            var owner = CurrentUserId;

            List<BusinessPlanSession> sessions;
            if (!string.IsNullOrWhiteSpace(clarifierSessionId))
                sessions = await _sessions.ListByClarifierAsync(clarifierSessionId, owner, skip, limit);
            else if (!string.IsNullOrWhiteSpace(businessIdeaId))
                sessions = await _sessions.ListByIdeaAsync(businessIdeaId, owner, skip, limit);
            else
                sessions = await _sessions.ListByOwnerAsync(owner, skip, limit);

            return Ok(ApiResponse.Ok("OK", sessions.Select(s => ToDto(s, includeVersionContent: false))));
        }

        /// <summary>Run the AI generation again, preserving prior versions (locked decision #5).</summary>
        [HttpPost("{sessionId}/regenerate")]
        public async Task<IActionResult> Regenerate(string sessionId)
        {
            var owner = CurrentUserId;

            if (!_settings.Enabled)
                return StatusCode(503, ApiResponse.Error("AI features are currently disabled.", HttpContext.TraceIdentifier));
            if (!_settings.Features.BusinessPlan)
                return StatusCode(503, ApiResponse.Error("The Business Plan generator is currently disabled.", HttpContext.TraceIdentifier));
            if (!ObjectId.TryParse(sessionId, out _))
                return NotFound(ApiResponse.Error("Session not found.", HttpContext.TraceIdentifier));

            var session = await _sessions.GetOwnedAsync(sessionId, owner);
            if (session is null)
                return NotFound(ApiResponse.Error("Session not found.", HttpContext.TraceIdentifier));

            // Re-validate the authoritative input still exists and is usable.
            var clarifier = await _clarifiers.GetOwnedAsync(session.ClarifierSessionId, owner);
            if (clarifier is null || !string.Equals(clarifier.Status, "Completed", StringComparison.Ordinal) || clarifier.Output is null)
                return Conflict(ApiResponse.Error("The source clarifier session is no longer available or not completed.", HttpContext.TraceIdentifier));

            var operationId = ObjectId.GenerateNewId().ToString();

            // Secure credit debit first
            try
            {
                await _creditService.DebitForJobAsync(owner, AiJobType.BusinessPlan, operationId);
            }
            catch (InsufficientCreditsException)
            {
                _audit.Record("BusinessPlan.Regenerate", owner, success: false,
                    new { sessionId = session.Id, currentVersion = session.CurrentVersion, error = "insufficient_credits" });
                return StatusCode(402, ApiResponse.Error("Insufficient credits.", HttpContext.TraceIdentifier));
            }

            try
            {
                var input = new BsonDocument
                {
                    ["sessionId"] = session.Id,
                    ["clarifierSessionId"] = session.ClarifierSessionId,
                };
                if (session.BusinessIdeaId != null)
                    input["businessIdeaId"] = session.BusinessIdeaId;

                var jobId = await _jobService.EnqueueAsync(AiJobType.BusinessPlan, owner, input);
                await _sessions.SetRequestIdAsync(session.Id, jobId);
                await _sessions.SetProcessingAsync(session.Id);

                _audit.Record("BusinessPlan.Regenerate", owner, success: true,
                    new { sessionId = session.Id, currentVersion = session.CurrentVersion, jobId });

                return Ok(ApiResponse.Ok("Business plan regeneration started.", new { sessionId = session.Id, jobId }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to enqueue business plan regeneration for session {SessionId}", session.Id);
                try
                {
                    await _creditService.RefundForJobAsync(owner, AiJobType.BusinessPlan, operationId, "Regenerate failed before acceptance");
                }
                catch (Exception refundEx)
                {
                    _logger.LogCritical(refundEx, "CRITICAL: Credit compensation failed for user {OwnerUserId} after regeneration failure", owner);
                }

                _audit.Record("BusinessPlan.Regenerate", owner, success: false,
                    new { sessionId = session.Id, currentVersion = session.CurrentVersion, error = "enqueue_failed" });

                return StatusCode(500, ApiResponse.Error("Failed to regenerate business plan. Please retry.", HttpContext.TraceIdentifier));
            }
        }

        /// <summary>
        /// Re-run C-3 to refresh a SINGLE section (audit P1.8). Rate-limited to
        /// 100/day/user. The job is scoped to one section: the handler regenerates only
        /// the requested C-3 field and splices it into a clone of the current plan via
        /// <see cref="WebApp.Services.Ai.Jobs.BusinessPlanSections.ReplaceField"/>, so the
        /// other sections are byte-for-byte preserved, the version is bumped, and a new
        /// immutable snapshot is appended. Only the 5 rewritable display sections are
        /// accepted (the 4 derived sections come from other modules).
        /// </summary>
        [HttpPost("rewrite-section")]
        public async Task<IActionResult> RewriteSection([FromBody] RewriteSectionRequest request)
        {
            var owner = CurrentUserId;

            if (!_settings.Enabled || !_settings.Features.BusinessPlan)
                return StatusCode(503, ApiResponse.Error("The Business Plan generator is currently disabled.", HttpContext.TraceIdentifier));
            if (string.IsNullOrWhiteSpace(request?.BusinessPlanSessionId) || string.IsNullOrWhiteSpace(request.SectionId))
                return BadRequest(ApiResponse.Error("businessPlanSessionId and sectionId are required.", HttpContext.TraceIdentifier));
            if (!ObjectId.TryParse(request.BusinessPlanSessionId, out _))
                return NotFound(ApiResponse.Error("Session not found.", HttpContext.TraceIdentifier));
            if (!BusinessPlanSections.IsRewritable(request.SectionId))
                return UnprocessableEntity(ApiResponse.Error("section_not_editable", HttpContext.TraceIdentifier,
                    new { sectionId = request.SectionId }));

            // 100/day/user (Redis sliding-ish daily counter). Permissive if Redis is off.
            if (_redis != null)
            {
                var db = _redis.GetDatabase();
                var key = $"rate:bp_rewrite:{owner}";
                var count = await db.StringIncrementAsync(key);
                if (count == 1) await db.KeyExpireAsync(key, TimeSpan.FromSeconds(86400));
                if (count > 100)
                {
                    var ttl = await db.KeyTimeToLiveAsync(key);
                    return StatusCode(429, ApiResponse.Error("rate_limit_exceeded", HttpContext.TraceIdentifier,
                        new { retryAfterSeconds = (int)(ttl?.TotalSeconds ?? 86400) }));
                }
            }

            var session = await _sessions.GetOwnedAsync(request.BusinessPlanSessionId, owner);
            if (session is null)
                return NotFound(ApiResponse.Error("Session not found.", HttpContext.TraceIdentifier));
            if (session.CurrentVersion <= 0)
                return Conflict(ApiResponse.Error("There is no generated plan to rewrite a section of yet.", HttpContext.TraceIdentifier));

            var clarifier = await _clarifiers.GetOwnedAsync(session.ClarifierSessionId, owner);
            if (clarifier is null || !string.Equals(clarifier.Status, "Completed", StringComparison.Ordinal) || clarifier.Output is null)
                return Conflict(ApiResponse.Error("The source clarifier session is no longer available or not completed.", HttpContext.TraceIdentifier));

            var operationId = ObjectId.GenerateNewId().ToString();

            // Secure credit debit first
            try
            {
                await _creditService.DebitForJobAsync(owner, AiJobType.BusinessPlan, operationId);
            }
            catch (InsufficientCreditsException)
            {
                _audit.Record("BusinessPlan.RewriteSection", owner, success: false,
                    new { sessionId = session.Id, sectionId = request.SectionId, error = "insufficient_credits" });
                return StatusCode(402, ApiResponse.Error("Insufficient credits.", HttpContext.TraceIdentifier));
            }

            try
            {
                var input = new BsonDocument
                {
                    ["sessionId"] = session.Id,
                    ["clarifierSessionId"] = session.ClarifierSessionId,
                    ["sectionId"] = request.SectionId,
                };
                if (session.BusinessIdeaId != null)
                    input["businessIdeaId"] = session.BusinessIdeaId;

                var jobId = await _jobService.EnqueueAsync(AiJobType.BusinessPlan, owner, input);
                await _sessions.SetRequestIdAsync(session.Id, jobId);
                await _sessions.SetProcessingAsync(session.Id);

                _audit.Record("BusinessPlan.RewriteSection", owner, success: true,
                    new { sessionId = session.Id, sectionId = request.SectionId, jobId });

                return Ok(ApiResponse.Ok("Section rewrite started.", new { sessionId = session.Id, jobId, sectionId = request.SectionId }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to enqueue section rewrite for session {SessionId}", session.Id);
                try
                {
                    await _creditService.RefundForJobAsync(owner, AiJobType.BusinessPlan, operationId, "RewriteSection failed before acceptance");
                }
                catch (Exception refundEx)
                {
                    _logger.LogCritical(refundEx, "CRITICAL: Credit compensation failed for user {OwnerUserId} after rewrite failure", owner);
                }

                _audit.Record("BusinessPlan.RewriteSection", owner, success: false,
                    new { sessionId = session.Id, sectionId = request.SectionId, error = "enqueue_failed" });

                return StatusCode(500, ApiResponse.Error("Failed to rewrite section. Please retry.", HttpContext.TraceIdentifier));
            }
        }

        /// <summary>
        /// Persist a MANUAL edit of one display section's primary text to the canonical
        /// plan (no AI run). Goes through the SAME splice the AI rewrite uses
        /// (<see cref="WebApp.Services.Ai.Jobs.BusinessPlanSections"/>, source "edit" →
        /// section status "edited"): other sections preserved, version bumped, a new
        /// immutable snapshot appended (locked C-3 decision #5). Only the 5 rewritable
        /// display sections are editable.
        /// </summary>
        [HttpPatch("{sessionId}/section")]
        public async Task<IActionResult> EditSection(string sessionId, [FromBody] EditSectionRequest request)
        {
            if (!ObjectId.TryParse(sessionId, out _))
                return NotFound(ApiResponse.Error("Session not found.", HttpContext.TraceIdentifier));
            if (string.IsNullOrWhiteSpace(request?.SectionId))
                return BadRequest(ApiResponse.Error("sectionId is required.", HttpContext.TraceIdentifier));
            if (!BusinessPlanSections.IsRewritable(request.SectionId))
                return UnprocessableEntity(ApiResponse.Error("section_not_editable", HttpContext.TraceIdentifier,
                    new { sectionId = request.SectionId }));

            var owner = CurrentUserId;
            var session = await _sessions.GetOwnedAsync(sessionId, owner);
            if (session is null)
                return NotFound(ApiResponse.Error("Session not found.", HttpContext.TraceIdentifier));
            if (session.CurrentVersion <= 0)
                return Conflict(ApiResponse.Error("There is no generated plan to edit yet.", HttpContext.TraceIdentifier));

            var current = session.Versions.FirstOrDefault(v => v.Version == session.CurrentVersion);
            if (current?.Content is null)
                return Conflict(ApiResponse.Error("There is no current plan content to edit.", HttpContext.TraceIdentifier));

            BsonDocument spliced;
            try
            {
                spliced = BusinessPlanSections.ReplaceSectionText(current.Content, request.SectionId, request.Content ?? string.Empty);
            }
            catch (ArgumentException ex)
            {
                return UnprocessableEntity(ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            spliced["schemaVersion"] = BusinessPlanOutputDto.CurrentSchemaVersion;

            // Same append-only persistence as the AI path: bump version + append snapshot.
            await _sessions.AppendGeneratedVersionAsync(session.Id, spliced, "manual-edit");

            _audit.Record("BusinessPlan.EditSection", owner, success: true,
                new { sessionId = session.Id, sectionId = request.SectionId, version = session.CurrentVersion + 1 });

            var updated = await _sessions.GetOwnedAsync(session.Id, owner);
            return Ok(ApiResponse.Ok("Section updated.", ToDto(updated!, includeVersionContent: true)));
        }

        /// <summary>Edit the current version's plan in place — no AI run (locked decision #6).</summary>
        [HttpPut("{sessionId}")]
        public async Task<IActionResult> Edit(string sessionId, [FromBody] EditBusinessPlanRequest request)
        {
            if (!ObjectId.TryParse(sessionId, out _))
                return NotFound(ApiResponse.Error("Session not found.", HttpContext.TraceIdentifier));

            var owner = CurrentUserId;
            var session = await _sessions.GetOwnedAsync(sessionId, owner);
            if (session is null)
                return NotFound(ApiResponse.Error("Session not found.", HttpContext.TraceIdentifier));
            if (session.CurrentVersion <= 0)
                return Conflict(ApiResponse.Error("There is no generated plan to edit yet.", HttpContext.TraceIdentifier));

            // Normalize to the camelCase contract shape and pin the schema version.
            var json = JsonSerializer.Serialize(request.Plan, CamelCase);
            BsonDocument content;
            try
            {
                content = BsonDocument.Parse(json);
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse.Error($"Invalid plan content: {ex.Message}", HttpContext.TraceIdentifier));
            }
            content["schemaVersion"] = BusinessPlanOutputDto.CurrentSchemaVersion;

            await _sessions.EditCurrentVersionAsync(session.Id, session.CurrentVersion, content);

            _audit.Record("BusinessPlan.Edit", owner, success: true,
                new { sessionId = session.Id, version = session.CurrentVersion });

            var updated = await _sessions.GetOwnedAsync(session.Id, owner);
            return Ok(ApiResponse.Ok("Business plan updated.", ToDto(updated!, includeVersionContent: true)));
        }


        private static BusinessPlanSessionDto ToDto(BusinessPlanSession s, bool includeVersionContent)
        {
            var current = s.Versions.FirstOrDefault(v => v.Version == s.CurrentVersion);

            return new BusinessPlanSessionDto
            {
                SessionId = s.Id,
                Status = s.Status,
                ClarifierSessionId = s.ClarifierSessionId,
                BusinessIdeaId = s.BusinessIdeaId,
                CurrentVersion = s.CurrentVersion,
                SchemaVersion = s.SchemaVersion,
                Output = current?.Content is null ? null : BsonTypeMapper.MapToDotNetValue(current.Content),
                Versions = s.Versions
                    .OrderBy(v => v.Version)
                    .Select(v => new BusinessPlanVersionDto
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
