using Microsoft.AspNetCore.Authorization;
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
    /// Phase 4 (Offer &amp; Resource Setup) — three deterministic steps: Services &amp;
    /// Pricing (4.1), Resource Calculator (4.2), Web &amp; GTM Setup (4.3). No AI
    /// session. Reads/writes CreatorJourneys.phase4Data; every output version carries
    /// phase: 4 (audit R6). Status stays derived. Verified-providers reuse the shared
    /// SpMatchingService + the P1.7 workroom flow — no new SP system here.
    /// </summary>
    [Route("api/creator/offer")]
    [ApiController]
    [Authorize]
    public class CreatorPhase4Controller : ControllerBase
    {
        private readonly ICreatorJourneyService _journeys;
        public CreatorPhase4Controller(ICreatorJourneyService journeys) => _journeys = journeys;

        private string GetUserId() =>
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("User not authenticated");

        private static readonly HashSet<string> PricingModels =
            new(StringComparer.OrdinalIgnoreCase) { "subscription", "one_time", "freemium", "usage_based" };

        // Static sector → competitor reference (MVP). Deterministic.
        // TODO: swap to IAiProvider / live research when model-router ready.
        private static readonly Dictionary<string, (string[] competitors, decimal avg)> SectorCompetitors = new(StringComparer.OrdinalIgnoreCase)
        {
            ["FinTech"] = (new[] { "Bonsai (€19)", "HoneyBook (€16)", "Moxie (€20)" }, 18m),
            ["SaaS"] = (new[] { "Notion (€8)", "Airtable (€10)", "Linear (€8)" }, 9m),
            ["Ecommerce"] = (new[] { "Shopify (€27)", "BigCommerce (€29)", "Wix (€16)" }, 24m),
        };

        // ======================= 4.1 — SERVICES & PRICING =======================

        // GET /api/creator/offer/pricing-insights
        [HttpGet("pricing-insights")]
        public async Task<IActionResult> PricingInsights([FromQuery] string ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId); // idea-sourced sector
                var sector = journey.Project?.Sector ?? "";
                var (competitors, avg) = SectorCompetitors.TryGetValue(sector, out var hit)
                    ? hit : (new[] { "Generic SaaS A (€12)", "Generic SaaS B (€15)" }, 13m);
                return Ok(ApiResponse.Ok("OK", new { competitors, sectorAveragePrice = avg }));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // POST /api/creator/offer/pricing
        [HttpPost("pricing")]
        public async Task<IActionResult> SetPricing([FromBody] SetPricingRequest request, [FromQuery] string ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                if (request == null || string.IsNullOrWhiteSpace(request.PricingModel) || !PricingModels.Contains(request.PricingModel))
                    return UnprocessableEntity(ApiResponse.Error("pricingModel must be subscription | one_time | freemium | usage_based."));

                var tiers = request.Tiers ?? new List<CreatorPricingTier>();
                if (tiers.Count < 3 || tiers.Count > 5)
                    return UnprocessableEntity(ApiResponse.Error("Provide between 3 and 5 tiers."));
                foreach (var t in tiers)
                {
                    if (string.IsNullOrWhiteSpace(t.Name)) return UnprocessableEntity(ApiResponse.Error("Each tier needs a name."));
                    if (t.Price < 0) return UnprocessableEntity(ApiResponse.Error($"Tier \"{t.Name}\" price must be ≥ 0."));
                    if ((t.Features?.Count ?? 0) < 3) return UnprocessableEntity(ApiResponse.Error($"Tier \"{t.Name}\" needs at least 3 features."));
                }
                if (tiers.Count(t => t.IsHighlighted) > 1)
                    return UnprocessableEntity(ApiResponse.Error("At most one tier can be highlighted (Most Popular)."));

                var journey = await _journeys.SetPhase4PricingAsync(userId, request.PricingModel.ToLowerInvariant(), tiers, ideaId);

                // Deterministic insight: basic tier above sector average +30% → suggest lowering.
                var sector = journey.Project?.Sector ?? "";
                var avg = SectorCompetitors.TryGetValue(sector, out var hit) ? hit.avg : 13m;
                var basic = tiers.Where(t => t.Price > 0).OrderBy(t => t.Price).FirstOrDefault();
                string suggestion = basic != null && basic.Price > avg * 1.3m
                    ? $"Your entry tier (€{basic.Price}) is well above the sector average (€{avg}). Consider lowering it to improve conversion."
                    : null;

                return Ok(ApiResponse.Ok("Pricing saved", new { phase4 = journey.Phase4Data, suggestion }));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // ======================= 4.2 — RESOURCE CALCULATOR =======================

        // POST /api/creator/offer/resource-calculator
        [HttpPost("resource-calculator")]
        public async Task<IActionResult> ResourceCalculator([FromBody] ResourceCalcRequest request, [FromQuery] string ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var team = request?.TeamRequirements ?? new List<CreatorTeamRequirement>();
                var saas = request?.SaasStack ?? new List<CreatorSaasItem>();

                decimal teamRecurring = team.Where(t => !t.OneTime).Sum(t => t.Cost * Math.Max(1, t.DurationMonths));
                decimal oneTime = team.Where(t => t.OneTime).Sum(t => t.Cost);
                decimal monthlyRunning = saas.Sum(s => s.MonthlyCost);

                decimal launchMin = Math.Round(teamRecurring * 0.8m, 0);
                decimal launchMax = Math.Round(teamRecurring * 1.2m + oneTime, 0);

                // Budget breakdown from actual category sums, normalized to 100.
                decimal teamCost = teamRecurring + oneTime;
                decimal toolsCost = monthlyRunning * 3;       // ~launch window
                decimal legalCost = 2000m;                    // flat MVP estimate // TODO: derive
                decimal miscCost = Math.Round((teamCost + toolsCost + legalCost) * 0.10m, 0);
                decimal total = teamCost + toolsCost + legalCost + miscCost;
                double Pct(decimal v) => total > 0 ? Math.Round((double)(v / total) * 100, 1) : 0;

                var calc = new CreatorResourceCalculation
                {
                    TeamRequirements = team,
                    SaasStack = saas,
                    TotalLaunchBudgetMin = launchMin,
                    TotalLaunchBudgetMax = launchMax,
                    MonthlyRunningCost = monthlyRunning,
                    TimeToLaunchWeeksMin = 8,   // TODO: scale by a complexity score when available
                    TimeToLaunchWeeksMax = 12,
                    BudgetBreakdown = new CreatorBudgetBreakdown
                    {
                        TeamPct = Pct(teamCost),
                        ToolsPct = Pct(toolsCost),
                        LegalPct = Pct(legalCost),
                        MiscPct = Pct(miscCost),
                    },
                };

                var journey = await _journeys.SetPhase4ResourceAsync(userId, calc, ideaId);
                return Ok(ApiResponse.Ok("Resource plan computed", journey.Phase4Data.ResourceCalculation));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // ======================= 4.3 — WEB & GTM SETUP =======================

        // POST /api/creator/offer/gtm-setup
        [HttpPost("gtm-setup")]
        public async Task<IActionResult> GtmSetup([FromBody] GtmSetupRequest request, [FromQuery] string ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var web = request?.WebPresence ?? new List<CreatorWebPresenceItem>();
                var audiences = request?.TargetAudiences ?? new List<string>();
                var channelMix = request?.ChannelMix ?? new List<CreatorChannelMix>();

                if (audiences.Count > 8)
                    return UnprocessableEntity(ApiResponse.Error("Up to 8 target audiences."));

                var sum = channelMix.Sum(c => c.Percent);
                if (channelMix.Count > 0 && Math.Abs(sum - 100) > 0.01)
                    return UnprocessableEntity(ApiResponse.Error($"Channel mix must sum to 100 (got {sum})."));

                bool DonePresence(string id) => web.Any(w => string.Equals(w.Id, id, StringComparison.OrdinalIgnoreCase) && w.Done);
                bool foundations = DonePresence("domain") && DonePresence("landing-page");

                // Deterministic 4-week GTM template; Week 1 auto-checks on domain+landing.
                var weeks = new List<CreatorGtmWeek>
                {
                    new() { Week = 1, Title = "Foundations", Tasks = new() { "Register domain", "Ship landing page", "Set up email capture" }, Completed = foundations },
                    new() { Week = 2, Title = "Beta Outreach", Tasks = new() { "Invite beta users", "Collect feedback", "Iterate messaging" } },
                    new() { Week = 3, Title = "ProductHunt Prep", Tasks = new() { "Assets + copy", "Line up hunters", "Schedule launch" } },
                    new() { Week = 4, Title = "Launch Week", Tasks = new() { "Go live", "Activate channels", "Track conversions" } },
                };

                var gtm = new CreatorGtmSetup
                {
                    WebPresence = web,
                    TargetAudiences = audiences,
                    ChannelMix = channelMix,
                    AiGtmWeeks = weeks,
                };

                var journey = await _journeys.SetPhase4GtmAsync(userId, gtm, ideaId);
                return Ok(ApiResponse.Ok("GTM setup saved", journey.Phase4Data.GtmSetup));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // ======================= COMPLETION =======================

        // PATCH /api/creator/offer/complete
        [HttpPatch("complete")]
        public async Task<IActionResult> Complete([FromQuery] string ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId); // idea-sourced modules
                var p4 = journey.Phase4Data ?? new CreatorPhase4Data();

                if (string.IsNullOrEmpty(p4.PricingModel) || (p4.Tiers?.Count ?? 0) < 3)
                    return UnprocessableEntity(ApiResponse.Error("Missing module: pricing"));
                if (p4.ResourceCalculation == null)
                    return UnprocessableEntity(ApiResponse.Error("Missing module: resource_calculator"));
                if (p4.GtmSetup == null)
                    return UnprocessableEntity(ApiResponse.Error("Missing module: gtm_setup"));

                // Status auto-derives to completed via the engine; nothing to write.
                return Ok(ApiResponse.Ok("Phase 4 complete", new { complete = true }));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }
    }
}
