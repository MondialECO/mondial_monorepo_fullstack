using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using StackExchange.Redis;
using System.Security.Claims;
using WebApp.DbContext;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Repository.Ai;

namespace WebApp.Controllers
{
    /// <summary>
    /// Phase 5 — The Crossroads. Path A (sell_license): IP valuation + marketplace
    /// listing. Path B (build): company formation + seed funding + company spin.
    /// Deterministic; reads/writes CreatorJourneys.phase5Data; versions carry
    /// phase: 5. Status stays derived (path-dependent). Buyer/investor matching is
    /// stubbed where the pool isn't ready — clearly marked, never fake-wired.
    /// </summary>
    [Route("api/creator")]
    [ApiController]
    [Authorize]
    public class CreatorPhase5Controller : ControllerBase
    {
        private readonly ICreatorJourneyService _journeys;
        private readonly ISpMatchingService _spMatching;
        private readonly ISmartMatchingService _smartMatching;
        private readonly MongoDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IForecastSessionStore _forecasts;
        private readonly IConnectionMultiplexer? _redis;

        public CreatorPhase5Controller(
            ICreatorJourneyService journeys, ISpMatchingService spMatching, ISmartMatchingService smartMatching,
            MongoDbContext context, UserManager<ApplicationUser> userManager,
            IForecastSessionStore forecasts, IServiceProvider services)
        {
            _journeys = journeys;
            _spMatching = spMatching;
            _smartMatching = smartMatching;
            _context = context;
            _userManager = userManager;
            _forecasts = forecasts;
            _redis = services.GetService(typeof(IConnectionMultiplexer)) as IConnectionMultiplexer;
        }

        /// <summary>Canonical TAM = the persisted forecast input (FG-2). Null if no forecast yet.</summary>
        private async Task<double?> CanonicalTamAsync(string userId, CreatorPhase3Data p3)
        {
            if (string.IsNullOrEmpty(p3?.ForecastSessionId)) return null;
            var fc = await _forecasts.GetOwnedAsync(p3.ForecastSessionId, userId);
            return fc?.Inputs?.Tam;
        }

        private async Task<string> CountryOfAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            return user?.Address?.Country ?? user?.Geography ?? "";
        }

        /// <summary>
        /// Server-derived match phase context. Matchmaking unlocks only at Phase 6
        /// (Build path, post Level Up). During Phase 5 the derived Phase-6 status is
        /// still "locked", so this returns a non-6 context and the match service
        /// yields an empty pool — a Phase-5 caller never sees a matched count.
        /// </summary>
        private async Task<int> DerivedMatchContextAsync(string userId, CreatorJourney journey)
        {
            var user = await _userManager.FindByIdAsync(userId);
            var phase1Complete = (user?.Onboarding?.Phase ?? 0) >= 1;
            var computed = await _journeys.ComputePhaseStatusAsync(journey, phase1Complete);
            return computed.Phase6.Status != "locked" ? 6 : 5;
        }

        private string GetUserId() =>
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("User not authenticated");

        // ======================= PART 3 — IP VALUATION (Path A) =======================

        // GET /api/creator/ip-valuation
        [HttpGet("ip-valuation")]
        public async Task<IActionResult> IpValuation([FromQuery] string ideaId = null)
        {
            try
            {
                var userId = GetUserId();

                // 10/day/user (Redis). Permissive if Redis is off.
                if (_redis != null)
                {
                    var db = _redis.GetDatabase();
                    var key = $"rate:valuation:{userId}";
                    var count = await db.StringIncrementAsync(key);
                    if (count == 1) await db.KeyExpireAsync(key, TimeSpan.FromSeconds(86400));
                    if (count > 10)
                    {
                        var ttl = await db.KeyTimeToLiveAsync(key);
                        return StatusCode(429, ApiResponse.Error("rate_limit_exceeded", HttpContext.TraceIdentifier,
                            new { retryAfterSeconds = (int)(ttl?.TotalSeconds ?? 86400) }));
                    }
                }

                var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId); // idea-sourced inputs
                var p = journey.Project ?? new CreatorJourneyProject();
                var p3 = journey.Phase3Data ?? new CreatorPhase3Data();

                double readiness = p3.InvestorReadinessScore?.Total ?? 0;
                double bbase = (p.ClarityScore + readiness) / 2;

                // Canonical TAM = the persisted forecast input (FG-2 unification) — the SAME
                // source the readiness score reads, via the SAME tier helper. Null (no
                // forecast yet) degrades identically everywhere.
                double? tam = await CanonicalTamAsync(userId, p3);
                double marketMult = CreatorScoring.MarketMult(tam);
                double marketPotential = CreatorScoring.MarketPotential(tam);

                bool hasPlan = !string.IsNullOrEmpty(p3.BusinessPlanSessionId);
                bool legalOver50 = p3.LegalChecklist is { TotalCount: > 0 } &&
                                   (double)p3.LegalChecklist.CompletedCount / p3.LegalChecklist.TotalCount > 0.5;
                bool brandingResolved = !string.IsNullOrEmpty(p.Branding?.BrandingMethod) && p.Branding.BrandingMethod != "pending";

                double stageMult = (hasPlan ? 0.15 : 0) + (legalOver50 ? 0.10 : 0) + (brandingResolved ? 0.05 : 0);

                decimal min = Math.Max(5000m, (decimal)(bbase * marketMult * (1 + stageMult) * 250));
                decimal max = Math.Min(200000m, (decimal)(bbase * marketMult * (1 + stageMult) * 800));

                int p3Modules = (p3.ForecastSessionId != null ? 1 : 0) + (hasPlan ? 1 : 0) +
                                (p3.LegalChecklist != null ? 1 : 0) + (p3.FormationGenerator != null ? 1 : 0);
                string confidence = p3Modules >= 4 ? "high" : p3Modules >= 2 ? "medium" : "low";

                var valuation = new CreatorIpValuation
                {
                    EstimatedMin = Math.Round(min, 0),
                    EstimatedMax = Math.Round(max, 0),
                    Confidence = confidence,
                    Breakdown = new CreatorIpValuationBreakdown
                    {
                        ConceptClarity = p.ClarityScore,
                        MarketPotential = marketPotential,
                        TechFeasibility = p3.FormationGenerator != null ? 75 : 50,
                        FounderCredibility = !string.IsNullOrWhiteSpace(p.CreatorEdge) && p.CreatorEdge.Length > 50 ? 80 : 60,
                        BusinessPlanQuality = hasPlan ? 90 : 40,
                    },
                };

                journey = await _journeys.SetIpValuationAsync(userId, valuation, ideaId);

                // Audit log.
                await _context.IpValuations.InsertOneAsync(new IpValuationRecord
                {
                    UserId = userId,
                    BusinessIdeaId = journey.BusinessIdeaId,
                    EstimatedMin = valuation.EstimatedMin,
                    EstimatedMax = valuation.EstimatedMax,
                    Confidence = confidence,
                    Breakdown = valuation.Breakdown,
                });

                return Ok(ApiResponse.Ok("OK", valuation));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // ======================= PART 4 — MARKETPLACE (Path A) =======================

        // POST /api/creator/marketplace/publish
        [HttpPost("marketplace/publish")]
        public async Task<IActionResult> Publish([FromBody] MarketplacePublishRequest request, [FromQuery] string ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId); // idea-sourced path gate

                if (journey.Phase5Data?.ChosenPath != "sell_license")
                    return UnprocessableEntity(ApiResponse.Error("Marketplace publishing requires the sell_license path."));
                if (!(request?.OpenToPurchase ?? false) && !(request?.OpenToLicense ?? false))
                    return UnprocessableEntity(ApiResponse.Error("Enable at least one of purchase or license."));
                var audience = request.Audience ?? "public";
                if (audience != "public" && audience != "matched" && audience != "private")
                    return UnprocessableEntity(ApiResponse.Error("audience must be public | matched | private."));

                var listing = new CreatorMarketplaceListing
                {
                    Status = "live",
                    NdaRequired = request.NdaRequired,
                    OpenToPurchase = request.OpenToPurchase,
                    OpenToLicense = request.OpenToLicense,
                    Audience = audience,
                    PublishedAt = DateTime.UtcNow,
                };

                // Buyer matching via the shared service (phaseContext=5). The buyer pool
                // is genuinely empty in this environment → honest empty list, not a stub.
                var matchedBuyerIds = new List<string>();
                if (audience == "matched")
                {
                    var country = await CountryOfAsync(userId);
                    var buyerMatches = await _smartMatching.MatchAsync(journey, country, 5);
                    matchedBuyerIds = buyerMatches.Select(m => m.CandidateId).ToList();
                }

                journey = await _journeys.SetMarketplaceListingAsync(userId, listing, matchedBuyerIds, ideaId);
                return Ok(ApiResponse.Ok("Listing published", new
                {
                    listing = journey.Phase5Data.PathA.MarketplaceListing,
                    matchedBuyerIds,
                    isEmpty = matchedBuyerIds.Count == 0, // honest empty state, not a stub flag
                }));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // ======================= PART 5 — FORMATION + SEED (Path B) =======================

        // POST /api/creator/company-formation
        [HttpPost("company-formation")]
        public async Task<IActionResult> CompanyFormation([FromBody] CompanyFormationRequest request, [FromQuery] string ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var ownership = request?.Ownership ?? new List<CreatorOwnershipEntry>();

                var sum = ownership.Sum(o => o.Percent);
                if (Math.Abs(sum - 100) > 0.01)
                    return UnprocessableEntity(ApiResponse.Error($"Ownership must sum to 100 (got {sum})."));
                var founder = ownership.Where(o => o.IsFounder).Sum(o => o.Percent);
                if (founder < 51)
                    return UnprocessableEntity(ApiResponse.Error("Founder must retain at least 51%."));

                var esop = ownership.Where(o => o.IsEsop).Sum(o => o.Percent);
                var warnings = new List<string>();
                if (esop < 10) warnings.Add("esop_recommended"); // non-blocking

                var formation = new CreatorCompanyFormation
                {
                    SelectedType = request.SelectedType,
                    Ownership = ownership,
                    FormationSpId = request.FormationSpId,
                    Status = "drafted",
                };

                var journey = await _journeys.SetCompanyFormationAsync(userId, formation, ideaId);
                return Ok(ApiResponse.Ok("Formation saved", new { formation = journey.Phase5Data.PathB.CompanyFormation, warnings }));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // POST /api/creator/seed-funding
        [HttpPost("seed-funding")]
        public async Task<IActionResult> SeedFunding([FromBody] SeedFundingRequest request, [FromQuery] string ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var use = request?.UseOfFunds ?? new List<CreatorUseOfFunds>();

                var sum = use.Sum(u => u.Percent);
                if (Math.Abs(sum - 100) > 0.01)
                    return UnprocessableEntity(ApiResponse.Error($"Use of funds must sum to 100 (got {sum})."));
                if ((request?.TotalAsk ?? 0) < 10000)
                    return UnprocessableEntity(ApiResponse.Error("Total ask must be at least €10,000."));

                var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId); // idea-sourced cross-phase reads
                var monthlyRunning = journey.Phase4Data?.ResourceCalculation?.MonthlyRunningCost ?? 0;
                double? runway = monthlyRunning > 0 ? (double)(request.TotalAsk / monthlyRunning) : null;

                // Investor matched-count via the shared service, gated on the
                // SERVER-DERIVED phase — not a hardcoded 6. In Phase 5 matchmaking is
                // still locked, so this is an honest 0; the real count first appears
                // after Level Up unlocks Phase 6.
                var country = await CountryOfAsync(userId);
                var matchContext = await DerivedMatchContextAsync(userId, journey);
                var investorMatches = await _smartMatching.MatchAsync(journey, country, matchContext);
                int matchedInvestorCount = investorMatches.Count;

                var seed = new CreatorSeedFunding
                {
                    TotalAsk = request.TotalAsk,
                    UseOfFunds = use,
                    InvestorTypesTargeted = request.InvestorTypesTargeted ?? new List<string>(),
                    MatchedInvestorCount = matchedInvestorCount,
                    EstimatedRunwayMonths = runway ?? 0,
                };

                // The company is created at Level Up (CompanyService.EnsureLevelUpCompanyAsync),
                // not here — Phase 5 only records seed funding against the existing companyId.
                journey = await _journeys.SetSeedFundingAsync(userId, seed, journey.CompanyId, ideaId);
                return Ok(ApiResponse.Ok("Seed funding saved", new
                {
                    seedFunding = journey.Phase5Data.PathB.SeedFunding,
                    companyId = journey.CompanyId,
                    matchedInvestorCount,
                    investorPoolEmpty = matchedInvestorCount == 0, // honest empty state
                }));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }
    }
}
