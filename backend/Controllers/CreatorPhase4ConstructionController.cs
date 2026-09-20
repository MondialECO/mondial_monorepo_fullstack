using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApp.Models;
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

        public CreatorPhase4ConstructionController(
            IConstructionSnapshotService snapshotService,
            IOperationalRoadmapService roadmapService)
        {
            _snapshotService = snapshotService;
            _roadmapService = roadmapService;
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
                return Ok(ApiResponse.Ok("Construction snapshot retrieved", result));
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

        // POST /api/creator/phase4/construction-snapshot/generate
        [HttpPost("construction-snapshot/generate")]
        public async Task<IActionResult> GenerateSnapshot([FromBody] GenerateSnapshotRequest? request)
        {
            try
            {
                var userId = GetUserId();
                var result = await _snapshotService.GenerateSnapshotAsync(userId, request?.IdeaId);
                return Ok(ApiResponse.Ok("Construction snapshot generated", result));
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

        // POST /api/creator/phase4/construction-snapshot/refresh
        [HttpPost("construction-snapshot/refresh")]
        public async Task<IActionResult> RefreshSnapshot([FromBody] GenerateSnapshotRequest? request)
        {
            try
            {
                var userId = GetUserId();
                var result = await _snapshotService.RefreshSnapshotAsync(userId, request?.IdeaId);
                return Ok(ApiResponse.Ok("Construction snapshot refreshed", result));
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

        // ---------------- STEP 4.2 OPERATIONAL ROADMAP ----------------

        // GET /api/creator/phase4/roadmap?ideaId={ideaId}
        [HttpGet("roadmap")]
        public async Task<IActionResult> GetRoadmap([FromQuery] string? ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var result = await _roadmapService.GetRoadmapAsync(userId, ideaId);
                return Ok(ApiResponse.Ok("Operational roadmap retrieved", result));
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

        // POST /api/creator/phase4/roadmap/generate
        [HttpPost("roadmap/generate")]
        public async Task<IActionResult> GenerateRoadmap([FromBody] GenerateSnapshotRequest? request)
        {
            try
            {
                var userId = GetUserId();
                var result = await _roadmapService.GenerateRoadmapAsync(userId, request?.IdeaId);
                return Ok(ApiResponse.Ok("Operational roadmap generated", result));
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

        // POST /api/creator/phase4/roadmap/refresh
        [HttpPost("roadmap/refresh")]
        public async Task<IActionResult> RefreshRoadmap([FromBody] GenerateSnapshotRequest? request)
        {
            try
            {
                var userId = GetUserId();
                var result = await _roadmapService.RefreshRoadmapAsync(userId, request?.IdeaId);
                return Ok(ApiResponse.Ok("Operational roadmap refreshed", result));
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

        // PATCH /api/creator/phase4/roadmap/task
        [HttpPatch("roadmap/task")]
        public async Task<IActionResult> UpdateRoadmapTask([FromBody] Models.DatabaseModels.Phase4.UpdateRoadmapTaskRequest request)
        {
            try
            {
                var userId = GetUserId();
                var result = await _roadmapService.UpdateTaskStateAsync(userId, request);
                return Ok(ApiResponse.Ok("Roadmap task updated", result));
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
    }
}
