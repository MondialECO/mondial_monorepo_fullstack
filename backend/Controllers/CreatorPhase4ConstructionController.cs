using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using WebApp.Models;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;

namespace WebApp.Controllers
{
    /// <summary>
    /// Canonical Phase 4 API — Step 4.1 Construction Snapshot.
    /// Exclusively scoped under /api/creator/phase4/*.
    /// </summary>
    [Route("api/creator/phase4")]
    [ApiController]
    [Authorize]
    public class CreatorPhase4ConstructionController : ControllerBase
    {
        private readonly IConstructionSnapshotService _snapshotService;
        private readonly IOperationalRoadmapService _roadmapService;
        private readonly INeedsAnalysisService _needsService;
        private readonly ISkillsResolutionService _skillsService;
        private readonly ISupportPlanService _supportService;
        private readonly IPricingStrategyService _pricingService;
        private readonly IGtmStrategyService _gtmService;

        public CreatorPhase4ConstructionController(
            IConstructionSnapshotService snapshotService,
            IOperationalRoadmapService roadmapService,
            INeedsAnalysisService needsService,
            ISkillsResolutionService skillsService,
            ISupportPlanService supportService,
            IPricingStrategyService pricingService,
            IGtmStrategyService gtmService)
        {
            _snapshotService = snapshotService;
            _roadmapService = roadmapService;
            _needsService = needsService;
            _skillsService = skillsService;
            _supportService = supportService;
            _pricingService = pricingService;
            _gtmService = gtmService;
        }

        private string GetUserId() =>
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("User not authenticated");

        // GET /api/creator/phase4/construction-snapshot?ideaId={ideaId}
        [HttpGet("construction-snapshot")]
        public async Task<IActionResult> GetSnapshot([FromQuery] string? ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var result = await _snapshotService.GetSnapshotAsync(userId, ideaId);
                if (result.IdeaVersion > 0)
                {
                    Response.Headers["X-Creator-Idea-Version"] = result.IdeaVersion.ToString();
                }
                return Ok(ApiResponse.Ok("Construction snapshot retrieved", result));
            }
            catch (CreatorJourneyException ex)
            {
                return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // POST /api/creator/phase4/construction-snapshot/generate
        [HttpPost("construction-snapshot/generate")]
        public async Task<IActionResult> GenerateSnapshot(
            [FromBody] GenerateSnapshotRequest? request,
            [FromQuery] string? ideaId = null,
            [FromQuery] long? expectedVersion = null)
        {
            try
            {
                if (!string.IsNullOrWhiteSpace(request?.IdeaId) && !string.IsNullOrWhiteSpace(ideaId) && !string.Equals(request.IdeaId.Trim(), ideaId.Trim(), StringComparison.Ordinal))
                {
                    return BadRequest(ApiResponse.Error("Conflicting ideaId provided in request URL query and request body.", HttpContext.TraceIdentifier));
                }

                var resolvedIdeaId = !string.IsNullOrWhiteSpace(request?.IdeaId) ? request.IdeaId.Trim() : ideaId?.Trim();
                if (string.IsNullOrWhiteSpace(resolvedIdeaId))
                {
                    return BadRequest(ApiResponse.Error("ideaId is required for Creator changes.", HttpContext.TraceIdentifier));
                }

                if (expectedVersion.HasValue && request?.ExpectedVersion.HasValue == true && expectedVersion.Value != request.ExpectedVersion.Value)
                {
                    return BadRequest(ApiResponse.Error("Conflicting expectedVersion provided in request URL query and request body.", HttpContext.TraceIdentifier));
                }

                var resolvedVersion = expectedVersion ?? request?.ExpectedVersion;
                if (resolvedVersion.HasValue && resolvedVersion.Value > 0)
                {
                    HttpContext.Items["CreatorIdeaVersion"] = resolvedVersion.Value;
                }

                var userId = GetUserId();
                var result = await _snapshotService.GenerateSnapshotAsync(userId, resolvedIdeaId);
                if (result.IdeaVersion > 0)
                {
                    Response.Headers["X-Creator-Idea-Version"] = result.IdeaVersion.ToString();
                }
                return Ok(ApiResponse.Ok("Construction snapshot generated", result));
            }
            catch (CreatorJourneyException ex)
            {
                return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // POST /api/creator/phase4/construction-snapshot/refresh
        [HttpPost("construction-snapshot/refresh")]
        public async Task<IActionResult> RefreshSnapshot(
            [FromBody] GenerateSnapshotRequest? request,
            [FromQuery] string? ideaId = null,
            [FromQuery] long? expectedVersion = null)
        {
            try
            {
                if (!string.IsNullOrWhiteSpace(request?.IdeaId) && !string.IsNullOrWhiteSpace(ideaId) && !string.Equals(request.IdeaId.Trim(), ideaId.Trim(), StringComparison.Ordinal))
                {
                    return BadRequest(ApiResponse.Error("Conflicting ideaId provided in request URL query and request body.", HttpContext.TraceIdentifier));
                }

                var resolvedIdeaId = !string.IsNullOrWhiteSpace(request?.IdeaId) ? request.IdeaId.Trim() : ideaId?.Trim();
                if (string.IsNullOrWhiteSpace(resolvedIdeaId))
                {
                    return BadRequest(ApiResponse.Error("ideaId is required for Creator changes.", HttpContext.TraceIdentifier));
                }

                if (expectedVersion.HasValue && request?.ExpectedVersion.HasValue == true && expectedVersion.Value != request.ExpectedVersion.Value)
                {
                    return BadRequest(ApiResponse.Error("Conflicting expectedVersion provided in request URL query and request body.", HttpContext.TraceIdentifier));
                }

                var resolvedVersion = expectedVersion ?? request?.ExpectedVersion;
                if (resolvedVersion.HasValue && resolvedVersion.Value > 0)
                {
                    HttpContext.Items["CreatorIdeaVersion"] = resolvedVersion.Value;
                }

                var userId = GetUserId();
                var result = await _snapshotService.RefreshSnapshotAsync(userId, resolvedIdeaId);
                if (result.IdeaVersion > 0)
                {
                    Response.Headers["X-Creator-Idea-Version"] = result.IdeaVersion.ToString();
                }
                return Ok(ApiResponse.Ok("Construction snapshot refreshed", result));
            }
            catch (CreatorJourneyException ex)
            {
                return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // ---------------- STEP 4.2 OPERATIONAL ROADMAP ----------------

        // GET /api/creator/phase4/roadmap?ideaId={ideaId}
        [HttpGet("roadmap")]
        public async Task<IActionResult> GetRoadmap([FromQuery] string? ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var result = await _roadmapService.GetRoadmapAsync(userId, ideaId);
                if (result.IdeaVersion > 0)
                {
                    Response.Headers["X-Creator-Idea-Version"] = result.IdeaVersion.ToString();
                }
                return Ok(ApiResponse.Ok("Operational roadmap retrieved", result));
            }
            catch (CreatorJourneyException ex)
            {
                return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // POST /api/creator/phase4/roadmap/generate
        [HttpPost("roadmap/generate")]
        public async Task<IActionResult> GenerateRoadmap(
            [FromBody] GenerateSnapshotRequest? request,
            [FromQuery] string? ideaId = null,
            [FromQuery] long? expectedVersion = null)
        {
            try
            {
                if (!string.IsNullOrWhiteSpace(request?.IdeaId) && !string.IsNullOrWhiteSpace(ideaId) && !string.Equals(request.IdeaId.Trim(), ideaId.Trim(), StringComparison.Ordinal))
                {
                    return BadRequest(ApiResponse.Error("Conflicting ideaId provided in request URL query and request body.", HttpContext.TraceIdentifier));
                }

                var resolvedIdeaId = !string.IsNullOrWhiteSpace(request?.IdeaId) ? request.IdeaId.Trim() : ideaId?.Trim();
                if (string.IsNullOrWhiteSpace(resolvedIdeaId))
                {
                    return BadRequest(ApiResponse.Error("ideaId is required for Creator changes.", HttpContext.TraceIdentifier));
                }

                if (expectedVersion.HasValue && request?.ExpectedVersion.HasValue == true && expectedVersion.Value != request.ExpectedVersion.Value)
                {
                    return BadRequest(ApiResponse.Error("Conflicting expectedVersion provided in request URL query and request body.", HttpContext.TraceIdentifier));
                }

                var resolvedVersion = expectedVersion ?? request?.ExpectedVersion;
                if (resolvedVersion.HasValue && resolvedVersion.Value > 0)
                {
                    HttpContext.Items["CreatorIdeaVersion"] = resolvedVersion.Value;
                }

                var userId = GetUserId();
                var result = await _roadmapService.GenerateRoadmapAsync(userId, resolvedIdeaId);
                if (result.IdeaVersion > 0)
                {
                    Response.Headers["X-Creator-Idea-Version"] = result.IdeaVersion.ToString();
                }
                return Ok(ApiResponse.Ok("Operational roadmap generated", result));
            }
            catch (CreatorJourneyException ex)
            {
                return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // POST /api/creator/phase4/roadmap/refresh
        [HttpPost("roadmap/refresh")]
        public async Task<IActionResult> RefreshRoadmap(
            [FromBody] GenerateSnapshotRequest? request,
            [FromQuery] string? ideaId = null,
            [FromQuery] long? expectedVersion = null)
        {
            try
            {
                if (!string.IsNullOrWhiteSpace(request?.IdeaId) && !string.IsNullOrWhiteSpace(ideaId) && !string.Equals(request.IdeaId.Trim(), ideaId.Trim(), StringComparison.Ordinal))
                {
                    return BadRequest(ApiResponse.Error("Conflicting ideaId provided in request URL query and request body.", HttpContext.TraceIdentifier));
                }

                var resolvedIdeaId = !string.IsNullOrWhiteSpace(request?.IdeaId) ? request.IdeaId.Trim() : ideaId?.Trim();
                if (string.IsNullOrWhiteSpace(resolvedIdeaId))
                {
                    return BadRequest(ApiResponse.Error("ideaId is required for Creator changes.", HttpContext.TraceIdentifier));
                }

                if (expectedVersion.HasValue && request?.ExpectedVersion.HasValue == true && expectedVersion.Value != request.ExpectedVersion.Value)
                {
                    return BadRequest(ApiResponse.Error("Conflicting expectedVersion provided in request URL query and request body.", HttpContext.TraceIdentifier));
                }

                var resolvedVersion = expectedVersion ?? request?.ExpectedVersion;
                if (resolvedVersion.HasValue && resolvedVersion.Value > 0)
                {
                    HttpContext.Items["CreatorIdeaVersion"] = resolvedVersion.Value;
                }

                var userId = GetUserId();
                var result = await _roadmapService.RefreshRoadmapAsync(userId, resolvedIdeaId);
                if (result.IdeaVersion > 0)
                {
                    Response.Headers["X-Creator-Idea-Version"] = result.IdeaVersion.ToString();
                }
                return Ok(ApiResponse.Ok("Operational roadmap refreshed", result));
            }
            catch (CreatorJourneyException ex)
            {
                return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // PATCH /api/creator/phase4/roadmap/task
        [HttpPatch("roadmap/task")]
        public async Task<IActionResult> UpdateRoadmapTask(
            [FromBody] Models.DatabaseModels.Phase4.UpdateRoadmapTaskRequest request,
            [FromQuery] string? ideaId = null,
            [FromQuery] long? expectedVersion = null)
        {
            try
            {
                if (!string.IsNullOrWhiteSpace(request?.IdeaId) && !string.IsNullOrWhiteSpace(ideaId) && !string.Equals(request.IdeaId.Trim(), ideaId.Trim(), StringComparison.Ordinal))
                {
                    return BadRequest(ApiResponse.Error("Conflicting ideaId provided in request URL query and request body.", HttpContext.TraceIdentifier));
                }

                var resolvedIdeaId = !string.IsNullOrWhiteSpace(request?.IdeaId) ? request.IdeaId.Trim() : ideaId?.Trim();
                if (string.IsNullOrWhiteSpace(resolvedIdeaId))
                {
                    return BadRequest(ApiResponse.Error("ideaId is required for Creator changes.", HttpContext.TraceIdentifier));
                }
                request.IdeaId = resolvedIdeaId;

                if (expectedVersion.HasValue && request.ExpectedVersion.HasValue && expectedVersion.Value != request.ExpectedVersion.Value)
                {
                    return BadRequest(ApiResponse.Error("Conflicting expectedVersion provided in request URL query and request body.", HttpContext.TraceIdentifier));
                }

                var resolvedVersion = expectedVersion ?? request.ExpectedVersion;
                if (resolvedVersion.HasValue && resolvedVersion.Value > 0)
                {
                    HttpContext.Items["CreatorIdeaVersion"] = resolvedVersion.Value;
                }

                var userId = GetUserId();
                var result = await _roadmapService.UpdateTaskStateAsync(userId, request);
                if (result.IdeaVersion > 0)
                {
                    Response.Headers["X-Creator-Idea-Version"] = result.IdeaVersion.ToString();
                }
                return Ok(ApiResponse.Ok("Roadmap task updated", result));
            }
            catch (CreatorJourneyException ex)
            {
                return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (KeyNotFoundException ex)
            {
                return StatusCode(StatusCodes.Status404NotFound, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // POST /api/creator/phase4/roadmap/activate
        [HttpPost("roadmap/activate")]
        public async Task<IActionResult> ActivateRoadmap(
            [FromBody] GenerateSnapshotRequest? request,
            [FromQuery] string? ideaId = null,
            [FromQuery] long? expectedVersion = null)
        {
            try
            {
                if (!string.IsNullOrWhiteSpace(request?.IdeaId) && !string.IsNullOrWhiteSpace(ideaId) && !string.Equals(request.IdeaId.Trim(), ideaId.Trim(), StringComparison.Ordinal))
                {
                    return BadRequest(ApiResponse.Error("Conflicting ideaId provided in request URL query and request body.", HttpContext.TraceIdentifier));
                }

                var resolvedIdeaId = !string.IsNullOrWhiteSpace(request?.IdeaId) ? request.IdeaId.Trim() : ideaId?.Trim();
                if (string.IsNullOrWhiteSpace(resolvedIdeaId))
                {
                    return BadRequest(ApiResponse.Error("ideaId is required for Creator changes.", HttpContext.TraceIdentifier));
                }

                if (expectedVersion.HasValue && request?.ExpectedVersion.HasValue == true && expectedVersion.Value != request.ExpectedVersion.Value)
                {
                    return BadRequest(ApiResponse.Error("Conflicting expectedVersion provided in request URL query and request body.", HttpContext.TraceIdentifier));
                }

                var resolvedVersion = expectedVersion ?? request?.ExpectedVersion;
                if (resolvedVersion.HasValue && resolvedVersion.Value > 0)
                {
                    HttpContext.Items["CreatorIdeaVersion"] = resolvedVersion.Value;
                }

                var userId = GetUserId();
                var result = await _roadmapService.ActivateRoadmapAsync(userId, resolvedIdeaId);
                if (result.IdeaVersion > 0)
                {
                    Response.Headers["X-Creator-Idea-Version"] = result.IdeaVersion.ToString();
                }
                return Ok(ApiResponse.Ok("Operational roadmap activated", result));
            }
            catch (CreatorJourneyException ex)
            {
                return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // PUT /api/creator/phase4/roadmap/availability
        [HttpPut("roadmap/availability")]
        public async Task<IActionResult> UpdateAvailability(
            [FromBody] Models.DatabaseModels.Phase4.UpdateAvailabilityRequest request,
            [FromQuery] string? ideaId = null,
            [FromQuery] long? expectedVersion = null)
        {
            try
            {
                if (!string.IsNullOrWhiteSpace(request?.IdeaId) && !string.IsNullOrWhiteSpace(ideaId) && !string.Equals(request.IdeaId.Trim(), ideaId.Trim(), StringComparison.Ordinal))
                {
                    return BadRequest(ApiResponse.Error("Conflicting ideaId provided in request URL query and request body.", HttpContext.TraceIdentifier));
                }

                var resolvedIdeaId = !string.IsNullOrWhiteSpace(request?.IdeaId) ? request.IdeaId.Trim() : ideaId?.Trim();
                if (string.IsNullOrWhiteSpace(resolvedIdeaId))
                {
                    return BadRequest(ApiResponse.Error("ideaId is required for Creator changes.", HttpContext.TraceIdentifier));
                }
                request.IdeaId = resolvedIdeaId;

                if (expectedVersion.HasValue && request.ExpectedVersion.HasValue && expectedVersion.Value != request.ExpectedVersion.Value)
                {
                    return BadRequest(ApiResponse.Error("Conflicting expectedVersion provided in request URL query and request body.", HttpContext.TraceIdentifier));
                }

                var resolvedVersion = expectedVersion ?? request.ExpectedVersion;
                if (resolvedVersion.HasValue && resolvedVersion.Value > 0)
                {
                    HttpContext.Items["CreatorIdeaVersion"] = resolvedVersion.Value;
                }

                var userId = GetUserId();
                var result = await _roadmapService.UpdateAvailabilityAsync(userId, request);
                if (result.IdeaVersion > 0)
                {
                    Response.Headers["X-Creator-Idea-Version"] = result.IdeaVersion.ToString();
                }
                return Ok(ApiResponse.Ok("Weekly availability updated", result));
            }
            catch (CreatorJourneyException ex)
            {
                return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // POST /api/creator/phase4/roadmap/keep-current
        [HttpPost("roadmap/keep-current")]
        public async Task<IActionResult> KeepCurrentRoadmap(
            [FromBody] GenerateSnapshotRequest? request,
            [FromQuery] string? ideaId = null,
            [FromQuery] long? expectedVersion = null)
        {
            try
            {
                if (!string.IsNullOrWhiteSpace(request?.IdeaId) && !string.IsNullOrWhiteSpace(ideaId) && !string.Equals(request.IdeaId.Trim(), ideaId.Trim(), StringComparison.Ordinal))
                {
                    return BadRequest(ApiResponse.Error("Conflicting ideaId provided in request URL query and request body.", HttpContext.TraceIdentifier));
                }

                var resolvedIdeaId = !string.IsNullOrWhiteSpace(request?.IdeaId) ? request.IdeaId.Trim() : ideaId?.Trim();
                if (string.IsNullOrWhiteSpace(resolvedIdeaId))
                {
                    return BadRequest(ApiResponse.Error("ideaId is required for Creator changes.", HttpContext.TraceIdentifier));
                }

                if (expectedVersion.HasValue && request?.ExpectedVersion.HasValue == true && expectedVersion.Value != request.ExpectedVersion.Value)
                {
                    return BadRequest(ApiResponse.Error("Conflicting expectedVersion provided in request URL query and request body.", HttpContext.TraceIdentifier));
                }

                var resolvedVersion = expectedVersion ?? request?.ExpectedVersion;
                if (resolvedVersion.HasValue && resolvedVersion.Value > 0)
                {
                    HttpContext.Items["CreatorIdeaVersion"] = resolvedVersion.Value;
                }

                var userId = GetUserId();
                var result = await _roadmapService.KeepCurrentRoadmapAsync(userId, resolvedIdeaId);
                if (result.IdeaVersion > 0)
                {
                    Response.Headers["X-Creator-Idea-Version"] = result.IdeaVersion.ToString();
                }
                return Ok(ApiResponse.Ok("Roadmap current version preserved", result));
            }
            catch (CreatorJourneyException ex)
            {
                return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // ---------------- STEP 4.3 NEEDS & REQUIREMENTS ----------------

        // GET /api/creator/phase4/needs?ideaId={ideaId}
        [HttpGet("needs")]
        public async Task<IActionResult> GetNeeds([FromQuery] string? ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var result = await _needsService.GetNeedsAnalysisAsync(userId, ideaId);
                if (result.IdeaVersion > 0)
                {
                    Response.Headers["X-Creator-Idea-Version"] = result.IdeaVersion.ToString();
                }
                return Ok(ApiResponse.Ok("Needs analysis retrieved", result));
            }
            catch (CreatorJourneyException ex)
            {
                return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // POST /api/creator/phase4/needs/generate
        [HttpPost("needs/generate")]
        public async Task<IActionResult> GenerateNeeds(
            [FromBody] GenerateSnapshotRequest? request,
            [FromQuery] string? ideaId = null,
            [FromQuery] long? expectedVersion = null)
        {
            try
            {
                if (!string.IsNullOrWhiteSpace(request?.IdeaId) && !string.IsNullOrWhiteSpace(ideaId) && !string.Equals(request.IdeaId.Trim(), ideaId.Trim(), StringComparison.Ordinal))
                {
                    return BadRequest(ApiResponse.Error("Conflicting ideaId provided in request URL query and request body.", HttpContext.TraceIdentifier));
                }

                var resolvedIdeaId = !string.IsNullOrWhiteSpace(request?.IdeaId) ? request.IdeaId.Trim() : ideaId?.Trim();
                if (string.IsNullOrWhiteSpace(resolvedIdeaId))
                {
                    return BadRequest(ApiResponse.Error("ideaId is required for Creator changes.", HttpContext.TraceIdentifier));
                }

                if (expectedVersion.HasValue && request?.ExpectedVersion.HasValue == true && expectedVersion.Value != request.ExpectedVersion.Value)
                {
                    return BadRequest(ApiResponse.Error("Conflicting expectedVersion provided in request URL query and request body.", HttpContext.TraceIdentifier));
                }

                var resolvedVersion = expectedVersion ?? request?.ExpectedVersion;
                if (resolvedVersion.HasValue && resolvedVersion.Value > 0)
                {
                    HttpContext.Items["CreatorIdeaVersion"] = resolvedVersion.Value;
                }

                var userId = GetUserId();
                var result = await _needsService.GenerateNeedsAnalysisAsync(userId, resolvedIdeaId);
                if (result.IdeaVersion > 0)
                {
                    Response.Headers["X-Creator-Idea-Version"] = result.IdeaVersion.ToString();
                }
                return Ok(ApiResponse.Ok("Needs analysis generated", result));
            }
            catch (CreatorJourneyException ex)
            {
                return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // POST /api/creator/phase4/needs/refresh
        [HttpPost("needs/refresh")]
        public async Task<IActionResult> RefreshNeeds(
            [FromBody] GenerateSnapshotRequest? request,
            [FromQuery] string? ideaId = null,
            [FromQuery] long? expectedVersion = null)
        {
            try
            {
                if (!string.IsNullOrWhiteSpace(request?.IdeaId) && !string.IsNullOrWhiteSpace(ideaId) && !string.Equals(request.IdeaId.Trim(), ideaId.Trim(), StringComparison.Ordinal))
                {
                    return BadRequest(ApiResponse.Error("Conflicting ideaId provided in request URL query and request body.", HttpContext.TraceIdentifier));
                }

                var resolvedIdeaId = !string.IsNullOrWhiteSpace(request?.IdeaId) ? request.IdeaId.Trim() : ideaId?.Trim();
                if (string.IsNullOrWhiteSpace(resolvedIdeaId))
                {
                    return BadRequest(ApiResponse.Error("ideaId is required for Creator changes.", HttpContext.TraceIdentifier));
                }

                if (expectedVersion.HasValue && request?.ExpectedVersion.HasValue == true && expectedVersion.Value != request.ExpectedVersion.Value)
                {
                    return BadRequest(ApiResponse.Error("Conflicting expectedVersion provided in request URL query and request body.", HttpContext.TraceIdentifier));
                }

                var resolvedVersion = expectedVersion ?? request?.ExpectedVersion;
                if (resolvedVersion.HasValue && resolvedVersion.Value > 0)
                {
                    HttpContext.Items["CreatorIdeaVersion"] = resolvedVersion.Value;
                }

                var userId = GetUserId();
                var result = await _needsService.RefreshNeedsAnalysisAsync(userId, resolvedIdeaId);
                if (result.IdeaVersion > 0)
                {
                    Response.Headers["X-Creator-Idea-Version"] = result.IdeaVersion.ToString();
                }
                return Ok(ApiResponse.Ok("Needs analysis refreshed", result));
            }
            catch (CreatorJourneyException ex)
            {
                return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // PATCH /api/creator/phase4/needs/{needKey}?ideaId={ideaId}
        [HttpPatch("needs/{needKey}")]
        public async Task<IActionResult> UpdateNeedState(
            [FromRoute] string needKey,
            [FromBody] Models.DatabaseModels.Phase4.UpdateNeedStateRequest request,
            [FromQuery] string? ideaId = null,
            [FromQuery] long? expectedVersion = null)
        {
            try
            {
                request ??= new Models.DatabaseModels.Phase4.UpdateNeedStateRequest();

                if (!string.IsNullOrWhiteSpace(request?.IdeaId) && !string.IsNullOrWhiteSpace(ideaId) && !string.Equals(request.IdeaId.Trim(), ideaId.Trim(), StringComparison.Ordinal))
                {
                    return BadRequest(ApiResponse.Error("Conflicting ideaId provided in request URL query and request body.", HttpContext.TraceIdentifier));
                }

                var resolvedIdeaId = !string.IsNullOrWhiteSpace(request?.IdeaId) ? request.IdeaId.Trim() : ideaId?.Trim();
                if (string.IsNullOrWhiteSpace(resolvedIdeaId))
                {
                    return BadRequest(ApiResponse.Error("ideaId is required for Creator changes.", HttpContext.TraceIdentifier));
                }
                request.IdeaId = resolvedIdeaId;

                if (expectedVersion.HasValue && request.ExpectedVersion.HasValue && expectedVersion.Value != request.ExpectedVersion.Value)
                {
                    return BadRequest(ApiResponse.Error("Conflicting expectedVersion provided in request URL query and request body.", HttpContext.TraceIdentifier));
                }

                var resolvedVersion = expectedVersion ?? request.ExpectedVersion;
                if (resolvedVersion.HasValue && resolvedVersion.Value > 0)
                {
                    HttpContext.Items["CreatorIdeaVersion"] = resolvedVersion.Value;
                }

                var userId = GetUserId();
                var result = await _needsService.UpdateNeedStateAsync(userId, needKey, request);
                if (result.IdeaVersion > 0)
                {
                    Response.Headers["X-Creator-Idea-Version"] = result.IdeaVersion.ToString();
                }
                return Ok(ApiResponse.Ok("Need state updated", result));
            }
            catch (CreatorJourneyException ex)
            {
                return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (KeyNotFoundException ex)
            {
                return StatusCode(StatusCodes.Status404NotFound, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // POST /api/creator/phase4/needs/keep-current
        [HttpPost("needs/keep-current")]
        public async Task<IActionResult> KeepCurrentNeeds(
            [FromBody] GenerateSnapshotRequest? request,
            [FromQuery] string? ideaId = null,
            [FromQuery] long? expectedVersion = null)
        {
            try
            {
                if (!string.IsNullOrWhiteSpace(request?.IdeaId) && !string.IsNullOrWhiteSpace(ideaId) && !string.Equals(request.IdeaId.Trim(), ideaId.Trim(), StringComparison.Ordinal))
                {
                    return BadRequest(ApiResponse.Error("Conflicting ideaId provided in request URL query and request body.", HttpContext.TraceIdentifier));
                }

                var resolvedIdeaId = !string.IsNullOrWhiteSpace(request?.IdeaId) ? request.IdeaId.Trim() : ideaId?.Trim();
                if (string.IsNullOrWhiteSpace(resolvedIdeaId))
                {
                    return BadRequest(ApiResponse.Error("ideaId is required for Creator changes.", HttpContext.TraceIdentifier));
                }

                if (expectedVersion.HasValue && request?.ExpectedVersion.HasValue == true && expectedVersion.Value != request.ExpectedVersion.Value)
                {
                    return BadRequest(ApiResponse.Error("Conflicting expectedVersion provided in request URL query and request body.", HttpContext.TraceIdentifier));
                }

                var resolvedVersion = expectedVersion ?? request?.ExpectedVersion;
                if (resolvedVersion.HasValue && resolvedVersion.Value > 0)
                {
                    HttpContext.Items["CreatorIdeaVersion"] = resolvedVersion.Value;
                }

                var userId = GetUserId();
                var result = await _needsService.KeepCurrentNeedsAsync(userId, resolvedIdeaId);
                if (result.IdeaVersion > 0)
                {
                    Response.Headers["X-Creator-Idea-Version"] = result.IdeaVersion.ToString();
                }
                return Ok(ApiResponse.Ok("Needs current version preserved", result));
            }
            catch (CreatorJourneyException ex)
            {
                return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // GET /api/creator/phase4/skills-plan?ideaId={ideaId}
        [HttpGet("skills-plan")]
        public async Task<IActionResult> GetSkillsPlan([FromQuery] string? ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var result = await _skillsService.GetSkillsPlanAsync(userId, ideaId);
                return Ok(ApiResponse.Ok("Skills plan retrieved", result));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(401, ApiResponse.Error(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(403, ApiResponse.Error(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // POST /api/creator/phase4/skills-plan/generate
        [HttpPost("skills-plan/generate")]
        public async Task<IActionResult> GenerateSkillsPlan([FromBody] GenerateSnapshotRequest? request)
        {
            try
            {
                var userId = GetUserId();
                var result = await _skillsService.GenerateSkillsPlanAsync(userId, request?.IdeaId);
                return Ok(ApiResponse.Ok("Skills plan generated", result));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(401, ApiResponse.Error(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(403, ApiResponse.Error(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // POST /api/creator/phase4/skills-plan/refresh
        [HttpPost("skills-plan/refresh")]
        public async Task<IActionResult> RefreshSkillsPlan([FromBody] GenerateSnapshotRequest? request)
        {
            try
            {
                var userId = GetUserId();
                var result = await _skillsService.RefreshSkillsPlanAsync(userId, request?.IdeaId);
                return Ok(ApiResponse.Ok("Skills plan refreshed", result));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(401, ApiResponse.Error(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(403, ApiResponse.Error(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // PATCH /api/creator/phase4/skills-plan/{resolutionKey}?ideaId={ideaId}
        [HttpPatch("skills-plan/{resolutionKey}")]
        public async Task<IActionResult> UpdateResolution(
            [FromRoute] string resolutionKey,
            [FromQuery] string? ideaId,
            [FromBody] Models.DatabaseModels.Phase4.UpdateResolutionRequest request)
        {
            try
            {
                var userId = GetUserId();
                request ??= new Models.DatabaseModels.Phase4.UpdateResolutionRequest();
                if (!string.IsNullOrWhiteSpace(ideaId) && string.IsNullOrWhiteSpace(request.IdeaId))
                {
                    request.IdeaId = ideaId;
                }
                var result = await _skillsService.UpdateResolutionAsync(userId, resolutionKey, request);
                return Ok(ApiResponse.Ok("Resolution updated", result));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(401, ApiResponse.Error(ex.Message));
            }
            catch (KeyNotFoundException ex)
            {
                return StatusCode(404, ApiResponse.Error(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(403, ApiResponse.Error(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // =========================================================================
        // PHASE 4.5 — AIDS, GRANTS & SUPPORT ENGINE
        // =========================================================================

        // GET /api/creator/phase4/support?ideaId={ideaId}
        [HttpGet("support")]
        public async Task<IActionResult> GetSupportPlan([FromQuery] string? ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var result = await _supportService.GetSupportPlanAsync(userId, ideaId);
                return Ok(ApiResponse.Ok("Support plan retrieved", result));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(401, ApiResponse.Error(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(403, ApiResponse.Error(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // POST /api/creator/phase4/support/generate
        [HttpPost("support/generate")]
        public async Task<IActionResult> GenerateSupportPlan([FromBody] GenerateSnapshotRequest? request)
        {
            try
            {
                var userId = GetUserId();
                var result = await _supportService.GenerateSupportPlanAsync(userId, request?.IdeaId);
                return Ok(ApiResponse.Ok("Support plan generated", result));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(401, ApiResponse.Error(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(403, ApiResponse.Error(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // POST /api/creator/phase4/support/refresh
        [HttpPost("support/refresh")]
        public async Task<IActionResult> RefreshSupportPlan([FromBody] GenerateSnapshotRequest? request)
        {
            try
            {
                var userId = GetUserId();
                var result = await _supportService.RefreshSupportPlanAsync(userId, request?.IdeaId);
                return Ok(ApiResponse.Ok("Support plan refreshed", result));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(401, ApiResponse.Error(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(403, ApiResponse.Error(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // PATCH /api/creator/phase4/support/{matchKey}?ideaId={ideaId}
        [HttpPatch("support/{matchKey}")]
        public async Task<IActionResult> UpdateFounderSupportState(
            [FromRoute] string matchKey,
            [FromQuery] string? ideaId,
            [FromBody] Models.DatabaseModels.Phase4.UpdateFounderSupportStateRequest request)
        {
            try
            {
                var userId = GetUserId();
                request ??= new Models.DatabaseModels.Phase4.UpdateFounderSupportStateRequest();
                if (!string.IsNullOrWhiteSpace(ideaId) && string.IsNullOrWhiteSpace(request.IdeaId))
                {
                    request.IdeaId = ideaId;
                }
                var result = await _supportService.UpdateFounderSupportStateAsync(userId, matchKey, request);
                return Ok(ApiResponse.Ok("Support application state updated", result));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(401, ApiResponse.Error(ex.Message));
            }
            catch (KeyNotFoundException ex)
            {
                return StatusCode(404, ApiResponse.Error(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(403, ApiResponse.Error(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // PATCH /api/creator/phase4/support/context/{factKey}?ideaId={ideaId}
        [HttpPatch("support/context/{factKey}")]
        public async Task<IActionResult> AnswerEligibilityFact(
            [FromRoute] string factKey,
            [FromQuery] string? ideaId,
            [FromBody] Models.DatabaseModels.Phase4.AnswerEligibilityFactRequest request)
        {
            try
            {
                var userId = GetUserId();
                request ??= new Models.DatabaseModels.Phase4.AnswerEligibilityFactRequest();
                var effectiveIdeaId = !string.IsNullOrWhiteSpace(ideaId) ? ideaId : request.IdeaId;
                var result = await _supportService.AnswerEligibilityFactAsync(userId, factKey, request.Value, effectiveIdeaId);
                return Ok(ApiResponse.Ok("Eligibility context fact updated", result));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(401, ApiResponse.Error(ex.Message));
            }
            catch (KeyNotFoundException ex)
            {
                return StatusCode(404, ApiResponse.Error(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(403, ApiResponse.Error(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // =====================================================================
        // STEP 4.6 · PRICING & REVENUE MODEL ENDPOINTS
        // =====================================================================

        // GET /api/creator/phase4/pricing?ideaId={ideaId}
        [HttpGet("pricing")]
        public async Task<IActionResult> GetPricing([FromQuery] string? ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var result = await _pricingService.GetPricingStrategyAsync(userId, ideaId);
                return Ok(ApiResponse.Ok("Pricing strategy retrieved", result));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(401, ApiResponse.Error(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(403, ApiResponse.Error(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // POST /api/creator/phase4/pricing/generate
        [HttpPost("pricing/generate")]
        public async Task<IActionResult> GeneratePricing([FromBody] Models.DatabaseModels.Phase4.GeneratePricingRequest? request = null)
        {
            try
            {
                var userId = GetUserId();
                var result = await _pricingService.GeneratePricingStrategyAsync(userId, request?.IdeaId);
                return Ok(ApiResponse.Ok("Pricing strategy generated", result));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(401, ApiResponse.Error(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(403, ApiResponse.Error(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // POST /api/creator/phase4/pricing/refresh
        [HttpPost("pricing/refresh")]
        public async Task<IActionResult> RefreshPricing([FromBody] Models.DatabaseModels.Phase4.RefreshPricingRequest? request = null)
        {
            try
            {
                var userId = GetUserId();
                var result = await _pricingService.RefreshPricingStrategyAsync(userId, request?.IdeaId);
                return Ok(ApiResponse.Ok("Pricing strategy refreshed", result));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(401, ApiResponse.Error(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(403, ApiResponse.Error(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // PATCH /api/creator/phase4/pricing/{offerKey}?ideaId={ideaId}
        [HttpPatch("pricing/{offerKey}")]
        public async Task<IActionResult> UpdatePricingOffer(
            [FromRoute] string offerKey,
            [FromQuery] string? ideaId,
            [FromBody] Models.DatabaseModels.Phase4.UpdatePricingOfferRequest request)
        {
            try
            {
                var userId = GetUserId();
                request ??= new Models.DatabaseModels.Phase4.UpdatePricingOfferRequest();
                if (!string.IsNullOrWhiteSpace(ideaId) && string.IsNullOrWhiteSpace(request.IdeaId))
                {
                    request.IdeaId = ideaId;
                }
                var result = await _pricingService.UpdatePricingOfferAsync(userId, offerKey, request);
                return Ok(ApiResponse.Ok("Pricing offer updated and economics recalculated", result));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(401, ApiResponse.Error(ex.Message));
            }
            catch (KeyNotFoundException ex)
            {
                return StatusCode(404, ApiResponse.Error(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(403, ApiResponse.Error(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // =====================================================================
        // STEP 4.7 · GTM & LAUNCH STRATEGY ENDPOINTS
        // =====================================================================

        // GET /api/creator/phase4/gtm?ideaId={ideaId}
        [HttpGet("gtm")]
        public async Task<IActionResult> GetGtm([FromQuery] string? ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var result = await _gtmService.GetGtmStrategyAsync(userId, ideaId);
                return Ok(ApiResponse.Ok("GTM launch strategy retrieved", result));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(401, ApiResponse.Error(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(403, ApiResponse.Error(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // POST /api/creator/phase4/gtm/generate
        [HttpPost("gtm/generate")]
        public async Task<IActionResult> GenerateGtm([FromBody] Models.DatabaseModels.Phase4.GenerateGtmRequest? request = null)
        {
            try
            {
                var userId = GetUserId();
                var result = await _gtmService.GenerateGtmStrategyAsync(userId, request?.IdeaId);
                return Ok(ApiResponse.Ok("GTM launch strategy generated", result));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(401, ApiResponse.Error(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(403, ApiResponse.Error(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // POST /api/creator/phase4/gtm/refresh
        [HttpPost("gtm/refresh")]
        public async Task<IActionResult> RefreshGtm([FromBody] Models.DatabaseModels.Phase4.RefreshGtmRequest? request = null)
        {
            try
            {
                var userId = GetUserId();
                var result = await _gtmService.RefreshGtmStrategyAsync(userId, request?.IdeaId);
                return Ok(ApiResponse.Ok("GTM launch strategy refreshed", result));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(401, ApiResponse.Error(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(403, ApiResponse.Error(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // PATCH /api/creator/phase4/gtm/{channelKey}?ideaId={ideaId}
        [HttpPatch("gtm/{channelKey}")]
        public async Task<IActionResult> UpdateGtmChannel(
            [FromRoute] string channelKey,
            [FromQuery] string? ideaId,
            [FromBody] Models.DatabaseModels.Phase4.UpdateGtmChannelRequest request)
        {
            try
            {
                var userId = GetUserId();
                request ??= new Models.DatabaseModels.Phase4.UpdateGtmChannelRequest();
                if (!string.IsNullOrWhiteSpace(ideaId) && string.IsNullOrWhiteSpace(request.IdeaId))
                {
                    request.IdeaId = ideaId;
                }
                var result = await _gtmService.UpdateGtmChannelAsync(userId, channelKey, request);
                return Ok(ApiResponse.Ok("GTM channel updated", result));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(401, ApiResponse.Error(ex.Message));
            }
            catch (KeyNotFoundException ex)
            {
                return StatusCode(404, ApiResponse.Error(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(403, ApiResponse.Error(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }

        // PATCH /api/creator/phase4/gtm/experiments/{experimentKey}?ideaId={ideaId}
        [HttpPatch("gtm/experiments/{experimentKey}")]
        public async Task<IActionResult> RecordExperimentRun(
            [FromRoute] string experimentKey,
            [FromQuery] string? ideaId,
            [FromBody] Models.DatabaseModels.Phase4.RecordExperimentRunRequest request)
        {
            try
            {
                var userId = GetUserId();
                request ??= new Models.DatabaseModels.Phase4.RecordExperimentRunRequest();
                if (!string.IsNullOrWhiteSpace(ideaId) && string.IsNullOrWhiteSpace(request.IdeaId))
                {
                    request.IdeaId = ideaId;
                }
                var result = await _gtmService.RecordExperimentRunAsync(userId, experimentKey, request);
                return Ok(ApiResponse.Ok("Experiment run recorded", result));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(401, ApiResponse.Error(ex.Message));
            }
            catch (KeyNotFoundException ex)
            {
                return StatusCode(404, ApiResponse.Error(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(403, ApiResponse.Error(ex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
            }
        }
    }

    public class GenerateSnapshotRequest
    {
        public string? IdeaId { get; set; }
        public long? ExpectedVersion { get; set; }
    }
}
