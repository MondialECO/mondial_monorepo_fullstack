using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Repository;

namespace WebApp.Controllers
{
    /// <summary>
    /// Phase 6 — Smart Matchmaking + Level Up. Phase 6 only unlocks on Path B
    /// (chosenPath === "build"); the derived engine gates it. Reads/writes
    /// CreatorJourneys.phase6Data; versions carry phase: 6. Level Up is permanent,
    /// atomic, and idempotent. No manual status writes.
    /// </summary>
    [Route("api/creator")]
    [ApiController]
    [Authorize]
    public class CreatorPhase6Controller : ControllerBase
    {
        private readonly ICreatorJourneyService _journeys;
        private readonly ISmartMatchingService _matching;
        private readonly MongoDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<ApplicationRole> _roleManager;
        private readonly IDealEventPublisher _events;
        private readonly ICompanyService _companies;
        private readonly ICreatorIdeaStore _ideas;
        private readonly IMongoClient _mongoClient;
        private readonly bool _transactionsEnabled;
        private readonly bool _isDevelopment;
        private readonly ILogger<CreatorPhase6Controller> _logger;

        public CreatorPhase6Controller(
            ICreatorJourneyService journeys, ISmartMatchingService matching,
            MongoDbContext context, UserManager<ApplicationUser> userManager,
            RoleManager<ApplicationRole> roleManager, IDealEventPublisher events,
            ICompanyService companies, ICreatorIdeaStore ideas, IMongoClient mongoClient, IConfiguration config,
            IHostEnvironment environment, ILogger<CreatorPhase6Controller> logger)
        {
            _journeys = journeys;
            _matching = matching;
            _context = context;
            _userManager = userManager;
            _roleManager = roleManager;
            _events = events;
            _companies = companies;
            _ideas = ideas;
            _mongoClient = mongoClient;
            _isDevelopment = environment.IsDevelopment();
            // Multi-doc transactions require a replica set / Atlas. Production runs a
            // replica set, so this defaults TRUE. Standalone-local dev sets it false
            // ("Mongo:TransactionsEnabled": false) to use the logged ordered-writes
            // fallback. Never a silent downgrade — the fallback path WARN-logs.
            _transactionsEnabled = config.GetValue("Mongo:TransactionsEnabled", true);
            _logger = logger;
        }

        private string GetUserId() =>
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("User not authenticated");

        private async Task<CreatorReadinessResponse> BuildReadinessAsync(string userId, CreatorJourney journey)
        {
            var user = await _userManager.FindByIdAsync(userId);
            var phase1Complete = (user?.Onboarding?.Phase ?? 0) >= 1;
            var computed = await _journeys.ComputePhaseStatusAsync(journey, phase1Complete);
            var project = journey.Project ?? new CreatorJourneyProject();
            var p5 = journey.Phase5Data ?? new CreatorPhase5Data();
            var isBuild = p5.ChosenPath == "build";
            var isSell = p5.ChosenPath == "sell" || p5.ChosenPath == "sell_license";
            var requirements = new List<CreatorReadinessRequirement>
            {
                new() { Key = "verification", Label = "Verify your identity", Route = "/dashboard/creator/phase-1", Complete = phase1Complete, Required = true },
                new() { Key = "idea_core", Label = "Define your idea", Route = "/dashboard/creator/phase-2", Complete = !string.IsNullOrWhiteSpace(project.Problem) && !string.IsNullOrWhiteSpace(project.TargetUser) && !string.IsNullOrWhiteSpace(project.Solution), Required = true },
                new() { Key = "business_planning", Label = "Complete your business plan", Route = "/dashboard/creator/phase-3/business-plan", Complete = computed.Phase3.Status == "completed", Required = true },
                new() { Key = "commercial_preparation", Label = "Prepare your commercial offer", Route = "/dashboard/creator/offer-pricing", Complete = computed.Phase4.Status == "completed", Required = true },
                new() { Key = "direction", Label = "Choose your direction", Route = "/dashboard/creator/crossroads", Complete = !string.IsNullOrWhiteSpace(p5.ChosenPath), Required = true },
                new() { Key = "company_setup", Label = "Complete company planning", Route = "/dashboard/creator/crossroads", Complete = isBuild && p5.PathB?.CompanyFormation != null, Required = isBuild },
                new() { Key = "funding_preparation", Label = "Set your funding target", Route = "/dashboard/creator/crossroads", Complete = isBuild && p5.PathB?.SeedFunding != null, Required = isBuild },
            };
            var missing = requirements.Where(x => x.Required && !x.Complete).Select(x => x.Key).ToList();
            // The score is path-aware: Build-only rows must not lower a Sell
            // project's readiness merely because they are intentionally irrelevant.
            var relevant = requirements.Where(x => x.Required).ToList();
            var complete = relevant.Count(x => x.Complete);
            var response = new CreatorReadinessResponse
            {
                OverallProgress = relevant.Count == 0 ? 0 : (int)Math.Round(complete * 100d / relevant.Count),
                LevelUpEligible = isBuild && missing.Count == 0,
                SelectedPath = p5.ChosenPath ?? "",
                Requirements = requirements,
                MissingRequired = missing,
            };
            response.NextBestAction = isSell
                ? (p5.PathA?.MarketplaceListing?.Status == "live" ? null : new CreatorReadinessRequirement { Key = "publish_full_buyout", Label = "Publish your Full Buyout listing", Route = "/dashboard/creator/crossroads", Required = false })
                : response.LevelUpEligible
                    ? new CreatorReadinessRequirement { Key = "level_up", Label = "Become an Entrepreneur", Route = "/dashboard/creator/investors", Required = true, Complete = true }
                    : requirements.FirstOrDefault(x => x.Required && !x.Complete);
            return response;
        }

        [HttpGet("readiness")]
        public async Task<IActionResult> Readiness([FromQuery] string ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
                return Ok(ApiResponse.Ok("OK", await BuildReadinessAsync(userId, journey)));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // Maps the Phase-5 ownership PLAN (percentages) → a Phase-4 cap-table request
        // and writes it via the canonical SubmitCapTableAsync path (no parallel writer).
        // Percentages are converted to shares against a conventional total; the
        // entrepreneur refines real share counts in Phase 4.
        private async Task SeedCapTableFromPlanAsync(string companyId, List<CreatorOwnershipEntry> ownership)
        {
            const int totalShares = 1_000_000;
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var grants = new List<EquityGrantDto>();
            int i = 0;
            foreach (var o in ownership)
            {
                i++;
                if (o.Percent <= 0) continue; // shares must be > 0 (validation)
                var name = string.IsNullOrWhiteSpace(o.Holder) ? $"Holder {i}" : o.Holder.Trim();
                // De-dup on (name, shareClass) — validation rejects duplicates.
                while (!seen.Add($"{name.ToLowerInvariant()}::common")) name = $"{name} {i}";
                grants.Add(new EquityGrantDto
                {
                    StakeholderName = name,
                    StakeholderType = o.IsFounder ? "founder" : o.IsEsop ? "esop" : "investor",
                    ShareClass = "common",
                    SharesGranted = Math.Max(1, (int)Math.Round(o.Percent / 100.0 * totalShares)),
                });
            }
            if (grants.Count == 0) return;

            var esopPct = ownership.Where(o => o.IsEsop).Sum(o => o.Percent);
            var request = new SubmitCapTableRequest
            {
                TotalShares = totalShares,
                EsopPoolPercent = esopPct,
                EsopVestingMonths = esopPct > 0 ? 48 : 0, // required > 0 when ESOP pool non-zero
                Grants = grants,
            };
            await _companies.SubmitCapTableAsync(companyId, request);
        }

        private static readonly string[] MatchingTips =
        {
            "A complete business plan lifts your match quality with most funds.",
            "Investors respond fastest when your raise fits their typical check size.",
            "Sector-focused funds convert better than generalists — target tightly.",
        };

        private async Task<string> CountryOfAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            return user?.Address?.Country ?? user?.Geography ?? "";
        }

        /// <summary>
        /// Server-derived match phase context. Matchmaking is a Phase-6 privilege:
        /// the real, derived engine unlocks Phase 6 only on the Build path after
        /// Level Up. We return 6 ONLY when the derived Phase-6 status is unlocked;
        /// otherwise a non-6 context, which the match service honours as an empty
        /// pool. Callers must never pass a client-supplied or hardcoded 6.
        /// </summary>
        private async Task<int> DerivedMatchContextAsync(string userId, CreatorJourney journey)
        {
            var user = await _userManager.FindByIdAsync(userId);
            var phase1Complete = (user?.Onboarding?.Phase ?? 0) >= 1;
            var computed = await _journeys.ComputePhaseStatusAsync(journey, phase1Complete);
            return computed.Phase6.Status != "locked" ? 6 : 5;
        }

        // GET /api/creator/smart-matches
        // NOTE: the phaseContext query param is accepted for backwards compatibility
        // but IGNORED — the phase is derived server-side so a client can no longer
        // unlock matches by passing ?phaseContext=6 before Level Up.
        [HttpGet("smart-matches")]
        public async Task<IActionResult> SmartMatches([FromQuery] int phaseContext = 6, [FromQuery] string ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId); // idea-sourced match inputs
                var country = await CountryOfAsync(userId);

                var context = await DerivedMatchContextAsync(userId, journey);
                var matches = await _matching.MatchAsync(journey, country, context);

                return Ok(ApiResponse.Ok("OK", new { matches, isEmpty = matches.Count == 0 }));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // GET /api/creator/investors  → { featured, qualified[], matchingTip }
        [HttpGet("investors")]
        public async Task<IActionResult> Investors([FromQuery] string ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId); // idea-sourced match inputs
                var country = await CountryOfAsync(userId);

                // Derived — below Phase 6 this returns an empty pool (no leak).
                var context = await DerivedMatchContextAsync(userId, journey);
                var matches = await _matching.MatchAsync(journey, country, context);
                var featured = matches.FirstOrDefault();
                var qualified = matches.Skip(1).ToList();
                // Rotate the tip deterministically by match count (no Random in this env).
                var tip = MatchingTips[matches.Count % MatchingTips.Length];

                return Ok(ApiResponse.Ok("OK", new { featured, qualified, matchingTip = tip, isEmpty = matches.Count == 0 }));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // POST /api/creator/level-up — permanent, atomic, idempotent.
        [HttpPost("level-up")]
        public async Task<IActionResult> LevelUp([FromQuery] string ideaId = null)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrWhiteSpace(ideaId))
                    return BadRequest(ApiResponse.Error("ideaId is required for Creator changes.", HttpContext.TraceIdentifier));
                if (!long.TryParse(Request.Query["expectedVersion"], out var expectedVersion) || expectedVersion < 1)
                    return BadRequest(ApiResponse.Error("expectedVersion is required for Creator changes.", HttpContext.TraceIdentifier));
                var ownedIdea = await _ideas.GetOwnedAsync(ideaId, userId);
                if (ownedIdea == null)
                    return NotFound(ApiResponse.Error("Idea not found.", HttpContext.TraceIdentifier));
                if ((ownedIdea.Version > 0 ? ownedIdea.Version : 1) != expectedVersion)
                    return StatusCode(409, ApiResponse.Error("This idea was updated in another tab. Refresh to load the latest version before continuing.", HttpContext.TraceIdentifier));
                // STEP 4: prerequisites are checked against the resolved idea's data.
                // No id → the active idea (today's single-idea behavior); explicit id →
                // owned-or-404 inside the composed resolve. Once-per-user stays guarded below.
                var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
                var levelUpIdeaId = ideaId;
                var p5 = journey.Phase5Data ?? new CreatorPhase5Data();
                var p6 = journey.Phase6Data ??= new CreatorPhase6Data();

                // Idempotency is USER-LEVEL (step 6iii): the composed p6.LevelUpTriggered
                // is now per-idea, so the once-per-user guard reads the journey's
                // LeveledUpIdeaId directly. Same idea → idempotent return; a DIFFERENT
                // idea → 409 (the entrepreneur side stays 1:1 — one company per user).
                if (!string.IsNullOrEmpty(journey.LeveledUpIdeaId) ||
                    !string.IsNullOrEmpty(p6.EntrepreneurProfileId)) // defensive legacy marker
                {
                    if (journey.LeveledUpIdeaId == levelUpIdeaId || string.IsNullOrEmpty(journey.LeveledUpIdeaId))
                    {
                        return Ok(ApiResponse.Ok("Already leveled up", new
                        {
                            levelUpComplete = true,
                            entrepreneurProfileId = p6.EntrepreneurProfileId,
                            redirectTo = "/dashboard/entrepreneur",
                        }));
                    }
                    return StatusCode(409, ApiResponse.Error("Another idea has already been taken through Level Up.", HttpContext.TraceIdentifier));
                }

                var readiness = await BuildReadinessAsync(userId, journey);
                if (!readiness.LevelUpEligible)
                    return UnprocessableEntity(ApiResponse.Error("prerequisites_not_met", HttpContext.TraceIdentifier, new { missing = readiness.MissingRequired }));

                // A multi-document Level Up must never masquerade as atomic in a
                // production-like environment. The ordered fallback is deliberately
                // local-development-only for standalone Mongo installations.
                if (!_transactionsEnabled && !_isDevelopment)
                    return StatusCode(StatusCodes.Status503ServiceUnavailable,
                        ApiResponse.Error("Level Up requires a transaction-capable Mongo deployment. Please contact support.", HttpContext.TraceIdentifier));

                // Provenance + plan inputs. (The Phase-5 spin stays dead intentionally;
                // the company is created here keyed by OwnerId at CurrentPhase=2.)
                var formation = p5.PathB?.CompanyFormation;
                var seed = p5.PathB?.SeedFunding;
                var sourceLink = !string.IsNullOrEmpty(journey.BusinessIdeaId) ? journey.BusinessIdeaId
                    : !string.IsNullOrEmpty(levelUpIdeaId) ? levelUpIdeaId : journey.Id; // idea anchor is the provenance
                double? fundingAsk = seed?.TotalAsk > 0 ? (double?)(double)seed.TotalAsk : null; // Phase-5 totalAsk is authoritative

                // UserManager can't take a Mongo session, so we write the role + companyId
                // directly to the user doc inside the transaction. Read the role id first.
                var entRole = await _roleManager.FindByNameAsync("Entrepreneur");
                if (entRole == null)
                    _logger.LogWarning("Level Up: 'Entrepreneur' role missing in DB; user role will not be set for {UserId}.", userId);
                Guid.TryParse(userId, out var userGuid);

                // Pre-generate the profile id so the journey can reference it in the same txn.
                var profile = new EntrepreneurProfileRecord
                {
                    Id = ObjectId.GenerateNewId().ToString(),
                    UserId = userId,
                    BusinessIdeaId = !string.IsNullOrEmpty(journey.BusinessIdeaId) ? journey.BusinessIdeaId : levelUpIdeaId,
                    Project = journey.Project,
                    OfferSetup = journey.Phase4Data,
                    Masterplan = journey.Phase3Data,
                    PathB = p5.PathB,
                };
                string companyId = null;

                // The ATOMIC CORE: company + entrepreneur profile + journey flag + user
                // (role + companyId). All commit together or roll back together. Because
                // levelUpTriggered is written HERE, a rollback leaves it unset → a retry
                // starts clean and complete. Cap table + SignalR are intentionally NOT here.
                async Task CoreWritesAsync(IClientSessionHandle session)
                {
                    var company = await _companies.EnsureLevelUpCompanyAsync(
                        userId, sourceLink, formation?.SelectedType, fundingAsk, session);
                    companyId = company.Id;
                    profile.CompanyId = companyId;

                    if (session is null) await _context.EntrepreneurProfiles.InsertOneAsync(profile);
                    else await _context.EntrepreneurProfiles.InsertOneAsync(session, profile);

                    journey.CompanyId = companyId;
                    journey.LeveledUpIdeaId = levelUpIdeaId; // which idea became the company (user-level, once)
                    p6.LevelUpTriggered = true;
                    p6.LevelUpTriggeredAt = DateTime.UtcNow;
                    p6.EntrepreneurProfileId = profile.Id;
                    (p6.SmartMatchmaking ??= new CreatorSmartMatchmaking()).Status = "live";

                    // The per-idea match state is a critical part of the transition, not
                    // a best-effort mirror. Match its optimistic-concurrency token inside
                    // the same Mongo transaction as the new Entrepreneur identity.
                    var ideaUpdated = await _ideas.UpdateAsync(
                        levelUpIdeaId,
                        userId,
                        Builders<CreatorIdea>.Update.Set(x => x.SmartMatchmaking, p6.SmartMatchmaking),
                        expectedVersion,
                        session);
                    if (!ideaUpdated)
                        throw new CreatorJourneyException(409, "This idea was updated in another tab. Refresh to load the latest version before continuing.");

                    // Step 6iii: TARGETED user-level $set — never ReplaceAsync(journey),
                    // which would write the composed (idea) phase blocks onto the frozen
                    // journey copy. Only pointers + Level-Up markers are journey writes now.
                    var journeyUpdate = Builders<CreatorJourney>.Update
                        .Set(x => x.CompanyId, companyId)
                        .Set(x => x.LeveledUpIdeaId, levelUpIdeaId)
                        .Set(x => x.Phase6Data.LevelUpTriggered, true)
                        .Set(x => x.Phase6Data.LevelUpTriggeredAt, p6.LevelUpTriggeredAt)
                        .Set(x => x.Phase6Data.EntrepreneurProfileId, profile.Id)
                        .Set(x => x.Phase6Data.SmartMatchmaking, p6.SmartMatchmaking)
                        .Set(x => x.UpdatedAt, DateTime.UtcNow);
                    if (session is null) await _context.CreatorJourneys.UpdateOneAsync(x => x.Id == journey.Id, journeyUpdate);
                    else await _context.CreatorJourneys.UpdateOneAsync(session, x => x.Id == journey.Id, journeyUpdate);

                    if (userGuid != Guid.Empty)
                    {
                        var upd = Builders<ApplicationUser>.Update.Set(u => u.EntrepreneurProfile.CompanyId, companyId);
                        var filter = Builders<ApplicationUser>.Filter.Eq("_id", userGuid) | Builders<ApplicationUser>.Filter.Eq("_id", userId);
                        if (session is null) await _context.ApplicationUsers.UpdateOneAsync(filter, upd);
                        else await _context.ApplicationUsers.UpdateOneAsync(session, filter, upd);

                        if (entRole != null)
                        {
                            var targetUser = await _userManager.FindByIdAsync(userId);
                            if (targetUser != null && !await _userManager.IsInRoleAsync(targetUser, "Entrepreneur"))
                            {
                                await _userManager.AddToRoleAsync(targetUser, "Entrepreneur");
                            }
                        }
                    }
                }

                if (_transactionsEnabled)
                {
                    using var session = await _mongoClient.StartSessionAsync();
                    session.StartTransaction();
                    try
                    {
                        await CoreWritesAsync(session);
                        await session.CommitTransactionAsync();
                    }
                    catch (CreatorJourneyException ex)
                    {
                        try { await session.AbortTransactionAsync(); } catch { /* nothing to abort */ }
                        return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
                    }
                    catch (Exception ex)
                    {
                        try { await session.AbortTransactionAsync(); } catch { /* nothing to abort */ }
                        _logger.LogError(ex, "Level Up transaction aborted for {UserId}; rolled back (nothing persisted).", userId);
                        return StatusCode(500, ApiResponse.Error("Level up failed and was rolled back. Please retry.", HttpContext.TraceIdentifier));
                    }
                }
                else
                {
                    // Documented standalone-dev fallback: ordered writes, NOT atomic.
                    // WARN-logged so it is never a silent downgrade. Production MUST run a
                    // replica set with Mongo:TransactionsEnabled=true.
                    _logger.LogWarning("Mongo:TransactionsEnabled=false — Level Up using non-atomic ordered-writes fallback (standalone dev only) for {UserId}.", userId);
                    await CoreWritesAsync(null);
                }

                // ---- Post-commit, best-effort (NOT part of the atomic guarantee) ----
                // Cap table (Option B): plan data, re-enterable at Phase 4 — a leveled-up
                // user with an empty cap table is a valid recoverable state. Never blocks.
                if ((formation?.Ownership?.Count ?? 0) > 0)
                {
                    try { await SeedCapTableFromPlanAsync(companyId, formation.Ownership); }
                    catch (Exception ex) { _logger.LogWarning(ex, "Cap-table seed failed post-Level-Up for {CompanyId}; re-enterable at Phase 4.", companyId); }
                }
                // SignalR notification (not data) — a miss is a missed toast, not inconsistency.
                try
                {
                    await _events.PublishAsync(new[] { userId }, "LevelUpComplete", new
                    {
                        entrepreneurProfileId = profile.Id,
                        redirectTo = "/dashboard/entrepreneur",
                    });
                }
                catch (Exception ex) { _logger.LogWarning(ex, "LevelUpComplete SignalR emit failed for {UserId}.", userId); }

                return Ok(ApiResponse.Ok("Level up complete", new
                {
                    levelUpComplete = true,
                    entrepreneurProfileId = profile.Id,
                    redirectTo = "/dashboard/entrepreneur",
                }));
            }
            catch (CreatorJourneyException ex) { return StatusCode(ex.StatusCode, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }
    }
}
