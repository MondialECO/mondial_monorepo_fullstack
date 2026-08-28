using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;

namespace WebApp.Controllers
{
    /// <summary>
    /// Multi-idea STEP 6(i) — idea management: list / create / switch-active. Thin
    /// wrappers over <see cref="ICreatorIdeaService"/> (step 3); no business logic
    /// here. Additive — nothing calls these until the my-ideas UI lands.
    /// </summary>
    [Route("api/creator")]
    [ApiController]
    [Authorize]
    public class CreatorIdeasController : ControllerBase
    {
        private readonly ICreatorIdeaService _ideas;
        private readonly ICreatorJourneyService _journeys;

        public CreatorIdeasController(ICreatorIdeaService ideas, ICreatorJourneyService journeys)
        {
            _ideas = ideas;
            _journeys = journeys;
        }

        private string GetUserId() =>
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("User not authenticated");

        // GET /api/creator/ideas — lightweight card DTOs, most-recently-active first.
        // A user with no ideas gets an honest empty list (a read never mints; the
        // first idea is minted by the journey/composed read or Phase-2 finalize).
        [HttpGet("ideas")]
        public async Task<IActionResult> ListIdeas()
        {
            try
            {
                var userId = GetUserId();
                var journey = await _journeys.GetOrCreateAsync(userId); // user-level pointers only
                var ideas = await _ideas.ListIdeasByUserAsync(userId);

                var dtos = ideas.Select(i => new
                {
                    ideaId = i.Id,
                    name = i.Project?.Name ?? string.Empty,
                    concept = i.Project?.Concept ?? string.Empty,
                    // Card fallback for legacy Path-B ideas whose Concept was never set —
                    // the card must not claim "no concept" when the idea has real content.
                    problem = i.Project?.Problem ?? string.Empty,
                    status = i.Status,
                    createdAt = i.CreatedAt,
                    lastActiveAt = i.LastActiveAt,
                    isActive = i.Id == journey.ActiveIdeaId,
                    isLeveledUp = i.Id == journey.LeveledUpIdeaId,
                    // COARSE display hint only (artifact presence, no session fetches, no
                    // derivation) — deliberately NOT the authoritative derived status,
                    // which needs per-idea session reads and is computed when the user
                    // actually enters the idea. Good enough for a "Continue" card label.
                    phaseReached = PhaseReached(i),
                    projectOutcome = i.ProjectOutcome ?? string.Empty,
                    activeBuyoutDealId = i.ActiveBuyoutDealId,
                    activePartnershipDealId = i.ActivePartnershipDealId,
                    salePrice = i.SalePrice,
                    soldAt = i.SoldAt,
                    acquiredByUserId = i.AcquiredByUserId,
                }).ToList();

                return Ok(ApiResponse.Ok("OK", new { ideas = dtos }));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // POST /api/creator/ideas — mint a blank idea and make it active. Allowed
        // after Level Up (only leveling up AGAIN is blocked, elsewhere).
        [HttpPost("ideas")]
        public async Task<IActionResult> CreateIdea()
        {
            try
            {
                var userId = GetUserId();
                var idea = await _ideas.CreateIdeaAsync(userId);
                return Ok(ApiResponse.Ok("Idea created", new { ideaId = idea.Id }));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // PATCH /api/creator/ideas/active — switch the active idea. Owned-check 404
        // inside the service (never a silent fallback).
        [HttpPatch("ideas/active")]
        public async Task<IActionResult> SetActiveIdea([FromBody] SetActiveIdeaRequest request)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrWhiteSpace(request?.IdeaId))
                    return BadRequest(ApiResponse.Error("ideaId is required."));

                var idea = await _ideas.SetActiveIdeaAsync(userId, request.IdeaId);
                return Ok(ApiResponse.Ok("Active idea switched", new { activeIdeaId = idea.Id }));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // Coarse phase marker from artifact presence alone — cheap by construction.
        // (2 = identity in progress … 6 = matchmaking/Level-Up territory.)
        private static int PhaseReached(CreatorIdea i)
        {
            if (i.Phase5Data?.PathB?.SeedFunding != null || i.Phase5Data?.PathA?.MarketplaceListing != null) return 6;
            if (!string.IsNullOrEmpty(i.Phase5Data?.ChosenPath)) return 5;
            if (!string.IsNullOrEmpty(i.Phase4Data?.PricingModel) || i.Phase4Data?.ResourceCalculation != null || i.Phase4Data?.GtmSetup != null) return 4;
            if (!string.IsNullOrEmpty(i.Phase3Data?.BusinessPlanSessionId) || i.Phase3Data?.LegalChecklist != null || i.Phase3Data?.FormationGenerator != null) return 3;
            return 2;
        }

        public class SetActiveIdeaRequest { public string IdeaId { get; set; } }
    }
}
