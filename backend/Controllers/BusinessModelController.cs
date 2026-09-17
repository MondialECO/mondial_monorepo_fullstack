using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.Configuration.AiOptions;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Models.Dtos.Ai;
using WebApp.Services.Ai;
using WebApp.Services.Ai.Jobs;
using WebApp.Services.Audit;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;

namespace WebApp.Controllers
{
    /// <summary>
    /// Phase 3.2 Business Model controller. Owner-scoped: generates and manages
    /// Business Model sessions (9-block Canvas with Market Study footnotes, tiered revenue, unit economics, assumptions).
    /// Costs 18 credits per generation.
    /// </summary>
    [ApiController]
    [Route("api/ai/business-model")]
    [Authorize]
    [EnableRateLimiting("ai")]
    public class BusinessModelController : ControllerBase
    {
        private readonly IBusinessModelSessionStore _sessions;
        private readonly IMarketStudySessionStore _marketStudies;
        private readonly IClarifierSessionStore _clarifiers;
        private readonly ICreatorIdeaStore _creatorIdeas;
        private readonly IAiJobService _jobService;
        private readonly IAiCreditService _creditService;
        private readonly IAuditLogger _audit;
        private readonly AiSettings _settings;
        private readonly ILogger<BusinessModelController> _logger;

        private static readonly JsonSerializerOptions CamelCase = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        };

        public BusinessModelController(
            IBusinessModelSessionStore sessions,
            IMarketStudySessionStore marketStudies,
            IClarifierSessionStore clarifiers,
            ICreatorIdeaStore creatorIdeas,
            IAiJobService jobService,
            IAiCreditService creditService,
            IAuditLogger audit,
            IOptions<AiSettings> settings,
            ILogger<BusinessModelController> logger)
        {
            _sessions = sessions;
            _marketStudies = marketStudies;
            _clarifiers = clarifiers;
            _creatorIdeas = creatorIdeas;
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
        public async Task<IActionResult> Start([FromBody] StartBusinessModelRequest request)
        {
            var owner = CurrentUserId;

            if (!_settings.Enabled)
                return StatusCode(503, ApiResponse.Error("AI features are currently disabled.", HttpContext.TraceIdentifier));
            if (!_settings.Features.BusinessModel)
                return StatusCode(503, ApiResponse.Error("The Business Model generator is currently disabled.", HttpContext.TraceIdentifier));

            if (!ObjectId.TryParse(request.MarketStudySessionId, out _))
                return NotFound(ApiResponse.Error("Market study session not found.", HttpContext.TraceIdentifier));

            var marketStudy = await _marketStudies.GetOwnedAsync(request.MarketStudySessionId, owner);
            if (marketStudy is null)
                return NotFound(ApiResponse.Error("Market study session not found.", HttpContext.TraceIdentifier));
            if (!string.Equals(marketStudy.Status, "Completed", StringComparison.Ordinal) || marketStudy.Versions.Count == 0)
                return Conflict(ApiResponse.Error("The market study session must be completed before generating a business model.", HttpContext.TraceIdentifier));

            var clarifierSessionId = !string.IsNullOrWhiteSpace(marketStudy.ClarifierSessionId)
                ? marketStudy.ClarifierSessionId
                : request.ClarifierSessionId ?? "";

            var businessIdeaId = !string.IsNullOrWhiteSpace(marketStudy.BusinessIdeaId)
                ? marketStudy.BusinessIdeaId
                : (string.IsNullOrWhiteSpace(request.BusinessIdeaId) ? null : request.BusinessIdeaId);

            if (!string.IsNullOrWhiteSpace(businessIdeaId))
            {
                if (!ObjectId.TryParse(businessIdeaId, out _) || await _creatorIdeas.GetOwnedAsync(businessIdeaId, owner) == null)
                    return NotFound(ApiResponse.Error("Idea not found.", HttpContext.TraceIdentifier));
            }

            var sessionId = ObjectId.GenerateNewId().ToString();
            var inFlightKey = $"{owner}:business_model:{request.MarketStudySessionId}";

            var session = new BusinessModelSession
            {
                Id = sessionId,
                OwnerUserId = owner,
                MarketStudySessionId = request.MarketStudySessionId,
                ClarifierSessionId = clarifierSessionId,
                BusinessIdeaId = businessIdeaId,
                Status = "Pending",
                InFlightKey = inFlightKey,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            var (created, activeSession) = await _sessions.TryCreateInFlightAsync(session);
            if (!created)
            {
                _logger.LogInformation("In-flight BusinessModelSession {SessionId} joined for market study {StudyId} by user {UserId}.",
                    activeSession.Id, request.MarketStudySessionId, owner);
                return Ok(ApiResponse.Ok("Business model generation started.", new { sessionId = activeSession.Id, jobId = activeSession.RequestId }));
            }

            try
            {
                await _creditService.DebitForJobAsync(owner, AiJobType.BusinessModel, sessionId);
            }
            catch (InsufficientCreditsException)
            {
                await _sessions.SetFailedAsync(session.Id, "Insufficient credits.");
                _audit.Record("BusinessModel.Start", owner, success: false,
                    new { marketStudySessionId = request.MarketStudySessionId, businessIdeaId, error = "insufficient_credits" });
                return StatusCode(402, ApiResponse.Error("Insufficient credits.", HttpContext.TraceIdentifier));
            }

            try
            {
                var input = new BsonDocument
                {
                    ["sessionId"] = session.Id,
                    ["marketStudySessionId"] = session.MarketStudySessionId,
                    ["clarifierSessionId"] = session.ClarifierSessionId,
                    ["creditOperationId"] = sessionId,
                };
                if (session.BusinessIdeaId != null)
                    input["businessIdeaId"] = session.BusinessIdeaId;

                var jobId = await _jobService.EnqueueAsync(AiJobType.BusinessModel, owner, input);
                await _sessions.SetRequestIdAsync(session.Id, jobId);

                // Wire session to creator idea phase 3 data if idea exists
                if (!string.IsNullOrWhiteSpace(session.BusinessIdeaId))
                {
                    var updateDef = Builders<CreatorIdea>.Update.Set(x => x.Phase3Data.BusinessModelSessionId, session.Id);
                    await _creatorIdeas.UpdateAsync(session.BusinessIdeaId, owner, updateDef);
                }

                _audit.Record("BusinessModel.Start", owner, success: true,
                    new { sessionId = session.Id, marketStudySessionId = session.MarketStudySessionId, businessIdeaId, jobId });

                return Ok(ApiResponse.Ok("Business model generation started.", new { sessionId = session.Id, jobId }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to enqueue business model job after credit debit for user {OwnerUserId}", owner);
                try
                {
                    await _creditService.RefundForJobAsync(owner, AiJobType.BusinessModel, sessionId, "Start generation failed before acceptance");
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

                _audit.Record("BusinessModel.Start", owner, success: false,
                    new { marketStudySessionId = request.MarketStudySessionId, businessIdeaId, error = "session_or_enqueue_failed" });

                return StatusCode(500, ApiResponse.Error("Failed to start business model generation. Please retry.", HttpContext.TraceIdentifier));
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
        public async Task<IActionResult> List(string? marketStudySessionId = null, string? businessIdeaId = null, int skip = 0, int limit = 30)
        {
            skip = Math.Max(0, skip);
            limit = Math.Clamp(limit, 1, 100);
            var owner = CurrentUserId;

            if (!string.IsNullOrWhiteSpace(marketStudySessionId))
            {
                if (!ObjectId.TryParse(marketStudySessionId, out _) || await _marketStudies.GetOwnedAsync(marketStudySessionId, owner) == null)
                    return NotFound(ApiResponse.Error("Market study session not found.", HttpContext.TraceIdentifier));
            }
            if (!string.IsNullOrWhiteSpace(businessIdeaId))
            {
                if (!ObjectId.TryParse(businessIdeaId, out _) || await _creatorIdeas.GetOwnedAsync(businessIdeaId, owner) == null)
                    return NotFound(ApiResponse.Error("Idea not found.", HttpContext.TraceIdentifier));
            }

            List<BusinessModelSession> sessions;
            if (!string.IsNullOrWhiteSpace(marketStudySessionId))
                sessions = await _sessions.ListByMarketStudyAsync(marketStudySessionId, owner, skip, limit);
            else if (!string.IsNullOrWhiteSpace(businessIdeaId))
                sessions = await _sessions.ListByIdeaAsync(businessIdeaId, owner, skip, limit);
            else
                sessions = await _sessions.ListByOwnerAsync(owner, skip, limit);

            return Ok(ApiResponse.Ok("OK", sessions.Select(s => ToDto(s, includeVersionContent: false))));
        }

        [HttpPost("{sessionId}/regenerate")]
        public async Task<IActionResult> Regenerate(string sessionId)
        {
            var owner = CurrentUserId;

            if (!_settings.Enabled)
                return StatusCode(503, ApiResponse.Error("AI features are currently disabled.", HttpContext.TraceIdentifier));
            if (!_settings.Features.BusinessModel)
                return StatusCode(503, ApiResponse.Error("The Business Model generator is currently disabled.", HttpContext.TraceIdentifier));
            if (!ObjectId.TryParse(sessionId, out _))
                return NotFound(ApiResponse.Error("Session not found.", HttpContext.TraceIdentifier));

            var session = await _sessions.GetOwnedAsync(sessionId, owner);
            if (session is null)
                return NotFound(ApiResponse.Error("Session not found.", HttpContext.TraceIdentifier));

            var marketStudy = await _marketStudies.GetOwnedAsync(session.MarketStudySessionId, owner);
            if (marketStudy is null || !string.Equals(marketStudy.Status, "Completed", StringComparison.Ordinal) || marketStudy.Versions.Count == 0)
                return Conflict(ApiResponse.Error("The source market study session is no longer available or not completed.", HttpContext.TraceIdentifier));

            var (acquired, activeSession) = await _sessions.TryAcquireRegenerateLockAsync(sessionId, owner);
            if (!acquired)
            {
                _logger.LogInformation("In-flight BusinessModel regenerate joined for session {SessionId} by user {UserId}.",
                    sessionId, owner);
                return Ok(ApiResponse.Ok("Business model regeneration started.", new { sessionId = activeSession!.Id, jobId = activeSession.RequestId }));
            }

            var operationId = ObjectId.GenerateNewId().ToString();

            try
            {
                await _creditService.DebitForJobAsync(owner, AiJobType.BusinessModel, operationId);
            }
            catch (InsufficientCreditsException)
            {
                await _sessions.SetFailedAsync(session.Id, "Insufficient credits.");
                _audit.Record("BusinessModel.Regenerate", owner, success: false,
                    new { sessionId = session.Id, currentVersion = session.CurrentVersion, error = "insufficient_credits" });
                return StatusCode(402, ApiResponse.Error("Insufficient credits.", HttpContext.TraceIdentifier));
            }

            try
            {
                var input = new BsonDocument
                {
                    ["sessionId"] = session.Id,
                    ["marketStudySessionId"] = session.MarketStudySessionId,
                    ["clarifierSessionId"] = session.ClarifierSessionId,
                    ["creditOperationId"] = operationId,
                };
                if (session.BusinessIdeaId != null)
                    input["businessIdeaId"] = session.BusinessIdeaId;

                var jobId = await _jobService.EnqueueAsync(AiJobType.BusinessModel, owner, input);
                await _sessions.SetRequestIdAsync(session.Id, jobId);
                await _sessions.SetProcessingAsync(session.Id);

                _audit.Record("BusinessModel.Regenerate", owner, success: true,
                    new { sessionId = session.Id, currentVersion = session.CurrentVersion, jobId });

                return Ok(ApiResponse.Ok("Business model regeneration started.", new { sessionId = session.Id, jobId }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to enqueue business model regeneration for session {SessionId}", session.Id);
                try
                {
                    await _creditService.RefundForJobAsync(owner, AiJobType.BusinessModel, operationId, "Regenerate failed before acceptance");
                }
                catch (Exception refundEx)
                {
                    _logger.LogCritical(refundEx, "CRITICAL: Credit compensation failed for user {OwnerUserId} after regeneration failure", owner);
                }

                _audit.Record("BusinessModel.Regenerate", owner, success: false,
                    new { sessionId = session.Id, currentVersion = session.CurrentVersion, error = "enqueue_failed" });

                return StatusCode(500, ApiResponse.Error("Failed to regenerate business model. Please retry.", HttpContext.TraceIdentifier));
            }
        }

        private static BusinessModelSessionDto ToDto(BusinessModelSession session, bool includeVersionContent)
        {
            var active = session.Versions.FirstOrDefault(v => v.Version == session.CurrentVersion);
            var output = active?.Content is not null
                ? JsonSerializer.Deserialize<object>(active.Content.ToJson(), CamelCase)
                : null;

            return new BusinessModelSessionDto
            {
                SessionId = session.Id,
                Status = session.Status,
                MarketStudySessionId = session.MarketStudySessionId,
                ClarifierSessionId = session.ClarifierSessionId,
                BusinessIdeaId = session.BusinessIdeaId,
                CurrentVersion = session.CurrentVersion,
                SchemaVersion = session.SchemaVersion,
                Output = output,
                Versions = session.Versions.Select(v => new BusinessModelVersionDto
                {
                    Version = v.Version,
                    IsEdited = v.IsEdited,
                    RequestId = v.RequestId,
                    Content = includeVersionContent && v.Content is not null
                        ? JsonSerializer.Deserialize<object>(v.Content.ToJson(), CamelCase)
                        : null,
                    CreatedAt = v.CreatedAt,
                    UpdatedAt = v.UpdatedAt,
                }).ToList(),
                Error = session.Error,
                CreatedAt = session.CreatedAt,
                UpdatedAt = session.UpdatedAt,
            };
        }
    }
}
