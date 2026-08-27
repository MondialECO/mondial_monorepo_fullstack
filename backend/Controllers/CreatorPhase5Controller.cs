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
    /// Phase 5 — The Crossroads. Path A (sell): Full Buyout planning + marketplace
    /// listing. Path B (build): company formation + funding preparation.
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

        // POST /api/creator/ip-valuation — recalculation persists a versioned
        // planning estimate, therefore this is a versioned workspace write.
        [HttpPost("ip-valuation")]
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

                // TAM is retained strictly as market-opportunity context. It must never
                // be converted into a project/IP price.
                double? tam = await CanonicalTamAsync(userId, p3);
                var resource = journey.Phase4Data?.ResourceCalculation;
                var launchInvestment = resource?.TotalLaunchBudgetMax > 0
                    ? resource.TotalLaunchBudgetMax
                    : resource?.TotalLaunchBudgetMin ?? 0;
                if (launchInvestment <= 0)
                    return UnprocessableEntity(ApiResponse.Error("Complete the Resource Calculator before creating a planning valuation estimate."));

                double readiness = p3.InvestorReadinessScore?.Total ?? 0;
                bool hasPlan = !string.IsNullOrEmpty(p3.BusinessPlanSessionId);
                bool legalOver50 = p3.LegalChecklist is { TotalCount: > 0 } &&
                                   (double)p3.LegalChecklist.CompletedCount / p3.LegalChecklist.TotalCount > 0.5;
                bool brandingResolved = !string.IsNullOrEmpty(p.Branding?.BrandingMethod) && p.Branding.BrandingMethod != "pending";
                var maturitySignals = (hasPlan ? 1 : 0) + (legalOver50 ? 1 : 0) + (brandingResolved ? 1 : 0)
                    + (p3.FormationGenerator != null ? 1 : 0);
                // Transparent planning method: the known launch-resource investment,
                // adjusted modestly by actual completion/readiness signals. This is a
                // planning range, not a market-cap or certified valuation formula.
                decimal readinessFactor = 0.75m + (decimal)Math.Clamp(readiness, 0, 100) / 100m * 0.35m;
                decimal maturityFactor = 0.85m + maturitySignals * 0.05m;
                decimal planningBase = launchInvestment * readinessFactor * maturityFactor;
                decimal min = Math.Round(planningBase * 0.80m, 0);
                decimal max = Math.Round(planningBase * 1.20m, 0);

                int p3Modules = (p3.ForecastSessionId != null ? 1 : 0) + (hasPlan ? 1 : 0) +
                                (p3.LegalChecklist != null ? 1 : 0) + (p3.FormationGenerator != null ? 1 : 0);
                string confidence = p3Modules >= 4 ? "high" : p3Modules >= 2 ? "medium" : "low";

                var valuation = new CreatorIpValuation
                {
                    EstimatedMin = Math.Round(min, 0),
                    EstimatedMax = Math.Round(max, 0),
                    Confidence = confidence,
                    MarketOpportunityContext = tam is > 0 ? Math.Round((decimal)tam.Value, 0) : null,
                    Breakdown = new CreatorIpValuationBreakdown
                    {
                        ConceptClarity = p.ClarityScore,
                        MarketPotential = tam is > 0 ? Math.Min(100, Math.Log10(tam.Value + 1) * 12.5) : 0,
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
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
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

                if (journey.Phase5Data?.ChosenPath != "sell")
                    return UnprocessableEntity(ApiResponse.Error("Marketplace publishing requires the Sell the Project path."));
                if ((request?.AskingPrice ?? 0) <= 0)
                    return UnprocessableEntity(ApiResponse.Error("Enter an asking price greater than zero for a Full Buyout listing."));
                var audience = request.Audience ?? "public";
                if (audience != "public" && audience != "matched" && audience != "private")
                    return UnprocessableEntity(ApiResponse.Error("audience must be public | matched | private."));

                var listing = new CreatorMarketplaceListing
                {
                    Status = "live",
                    SaleType = "full_buyout",
                    AskingPrice = request.AskingPrice,
                    NdaRequired = request.NdaRequired,
                    OpenToPurchase = true,
                    OpenToLicense = false,
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
                    matches = matchedBuyerIds,
                    hasMatches = matchedBuyerIds.Count > 0,
                    isEmpty = matchedBuyerIds.Count == 0,
                }));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
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

                if (string.IsNullOrWhiteSpace(request?.SelectedType) || !new[] { "SAS", "SAS-U", "SARL" }.Contains(request.SelectedType, StringComparer.OrdinalIgnoreCase))
                    return UnprocessableEntity(ApiResponse.Error("selectedType must be SAS | SAS-U | SARL."));
                if (ownership.Count == 0)
                    return UnprocessableEntity(ApiResponse.Error("Add at least one ownership entry."));
                if (ownership.Any(o => string.IsNullOrWhiteSpace(o.Holder) || !double.IsFinite(o.Percent) || o.Percent < 0 || o.Percent > 100))
                    return UnprocessableEntity(ApiResponse.Error("Each ownership entry needs a holder and a percentage from 0 to 100."));

                var sum = ownership.Sum(o => o.Percent);
                if (Math.Abs(sum - 100) > 0.01)
                    return UnprocessableEntity(ApiResponse.Error($"Ownership must sum to 100 (got {sum})."));
                var founder = ownership.Where(o => o.IsFounder).Sum(o => o.Percent);
                if (founder < 51)
                    return UnprocessableEntity(ApiResponse.Error("Founder must retain at least 51%."));

                var esop = ownership.Where(o => o.IsEsop).Sum(o => o.Percent);
                var warnings = new List<string>();
                if (esop < 10) warnings.Add("esop_recommended"); // non-blocking

                var formationSpId = string.IsNullOrWhiteSpace(request?.FormationSpId)
                    ? null
                    : request.FormationSpId.Trim();

                var formation = new CreatorCompanyFormation
                {
                    SelectedType = request!.SelectedType,
                    Ownership = ownership,
                    FormationSpId = formationSpId,
                    Status = "drafted",
                };

                var journey = await _journeys.SetCompanyFormationAsync(userId, formation, ideaId);
                return Ok(ApiResponse.Ok("Formation saved", new { formation = journey.Phase5Data.PathB.CompanyFormation, warnings }));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
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

                if (use.Count == 0 || use.Any(u => string.IsNullOrWhiteSpace(u.Category) || !double.IsFinite(u.Percent) || u.Percent < 0 || u.Percent > 100))
                    return UnprocessableEntity(ApiResponse.Error("Each use-of-funds entry needs a category and a percentage from 0 to 100."));

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
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }
    }
}
