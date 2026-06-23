using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;

namespace WebApp.Controllers
{
    /// <summary>
    /// Creator journey persistence (Phases 2–6). Replaces the old localStorage-only
    /// model: this is the backend source of truth. Phase/step status is DERIVED here
    /// on every read and returned alongside the journey, so the frontend never owns
    /// status. All responses use the shared <see cref="ApiResponse"/> envelope (R11).
    /// </summary>
    [Route("api/creator")]
    [ApiController]
    [Authorize]
    public class CreatorJourneyController : ControllerBase
    {
        private readonly ICreatorJourneyService _journeys;
        private readonly UserManager<ApplicationUser> _userManager;

        public CreatorJourneyController(ICreatorJourneyService journeys, UserManager<ApplicationUser> userManager)
        {
            _journeys = journeys;
            _userManager = userManager;
        }

        private string GetUserId() =>
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("User not authenticated");

        /// <summary>Phase 1 (universal verification) lives on ApplicationUser.Onboarding.Phase.</summary>
        private async Task<bool> IsPhase1CompleteAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            return (user?.Onboarding?.Phase ?? 0) >= 1;
        }

        private async Task<IActionResult> OkJourneyAsync(string userId, CreatorJourney journey, string message)
        {
            var phase1 = await IsPhase1CompleteAsync(userId);
            var computedStatus = _journeys.ComputePhaseStatus(journey, phase1);
            return Ok(ApiResponse.Ok(message, new { journey, computedStatus }));
        }

        // GET /api/creator/journey → { journey, computedStatus }
        [HttpGet("journey")]
        public async Task<IActionResult> GetJourney()
        {
            try
            {
                var userId = GetUserId();
                var journey = await _journeys.GetOrCreateAsync(userId);
                return await OkJourneyAsync(userId, journey, "Journey loaded");
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // PATCH /api/creator/journey/project
        [HttpPatch("journey/project")]
        public async Task<IActionResult> UpdateProject([FromBody] UpdateProjectRequest request)
        {
            try
            {
                var userId = GetUserId();
                var journey = await _journeys.UpdateProjectAsync(userId, request);
                return await OkJourneyAsync(userId, journey, "Project updated");
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // PATCH /api/creator/journey/phase2/entry-path  — only "already_have_idea"
        [HttpPatch("journey/phase2/entry-path")]
        public async Task<IActionResult> SetEntryPath([FromBody] EntryPathRequest request)
        {
            try
            {
                var userId = GetUserId();
                var journey = await _journeys.SetEntryPathAsync(userId, request?.Path);
                return await OkJourneyAsync(userId, journey, "Entry path set");
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // PATCH /api/creator/journey/phase5/path  — "sell_license" | "build"; 72h lock
        [HttpPatch("journey/phase5/path")]
        public async Task<IActionResult> SetCrossroadsPath([FromBody] CrossroadsPathRequest request)
        {
            try
            {
                var userId = GetUserId();
                var journey = await _journeys.SetCrossroadsPathAsync(userId, request?.Path);
                return await OkJourneyAsync(userId, journey, "Crossroads path set");
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // POST /api/creator/journey/output  — append versioned output (newest last, own phase)
        [HttpPost("journey/output")]
        public async Task<IActionResult> AppendOutput([FromBody] AppendOutputRequest request)
        {
            try
            {
                var userId = GetUserId();
                var journey = await _journeys.AppendOutputAsync(userId, request);
                return await OkJourneyAsync(userId, journey, "Output appended");
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }
    }
}
