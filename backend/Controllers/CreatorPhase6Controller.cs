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
            var isCofounded = string.Equals(journey.ProjectOutcome, "CO_FOUNDED", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrEmpty(journey.ActivePartnershipDealId);
            var isSold = string.Equals(journey.ProjectOutcome, "SOLD", StringComparison.OrdinalIgnoreCase);

            if (isCofounded)
            {
                // ROUTE B — CO-FOUNDED EQUITY PARTNERSHIP READINESS
                var deal = !string.IsNullOrEmpty(journey.ActivePartnershipDealId)
                    ? await _context.DealExecutions.Find(d => d.Id == journey.ActivePartnershipDealId).FirstOrDefaultAsync()
                    : null;

                bool isPartnershipActive = deal != null &&
                    deal.DealType == "EQUITY_PARTNERSHIP" &&
                    deal.DealStage == "PARTNERSHIP_ACTIVE" &&
                    deal.Status == "completed" &&
                    deal.Activation?.Status == "PARTNERSHIP_ACTIVE" &&
                    deal.CreatorId == userId;

                var companyId = deal?.Activation?.CompanyId ?? journey.CompanyId;
                var company = !string.IsNullOrEmpty(companyId)
                    ? await _context.Companies.Find(c => c.Id == companyId).FirstOrDefaultAsync()
                    : null;

                bool isCompanyLinked = company != null;

                var creatorShares = deal?.Activation?.AppliedCapTableEntries?.FirstOrDefault(e => e.IsCreator)?.SharesGranted;
                var creatorEntry = company?.EquityStructure?.FirstOrDefault(e => e.SharesOwned > 0 &&
                    ((!string.IsNullOrEmpty(user?.Name) && e.StakeholderName?.Contains(user.Name, StringComparison.OrdinalIgnoreCase) == true) ||
                     (!string.IsNullOrEmpty(userId) && e.StakeholderName?.Contains(userId, StringComparison.OrdinalIgnoreCase) == true) ||
                     (e.StakeholderName?.Contains("Creator", StringComparison.OrdinalIgnoreCase) == true) ||
                     (creatorShares.HasValue && creatorShares.Value > 0 && e.SharesOwned == creatorShares.Value)));

                bool isCreatorShareholder = creatorEntry != null;

                bool isRoleConfirmed = deal?.RoleAgreement?.Status == "CONFIRMED" && !string.IsNullOrEmpty(deal?.RoleAgreement?.CreatorRole);

                bool isEquityRecorded = deal?.EquityTerms != null && deal.EquityTerms.EquityPercentage > 0;

                bool isLegalSigned = deal?.SigningPackage?.Status == "AGREEMENT_SIGNED" &&
                    !string.IsNullOrEmpty(deal?.SigningPackage?.ManifestHash) &&
                    deal?.SigningPackage?.ManifestHash == deal?.Activation?.SignedManifestHash;

                bool isDocumentsAvailable = (deal?.Activation?.LinkedDocuments?.Count ?? 0) > 0 || (company?.Documents?.Count ?? 0) > 0;

                var cofoundedRequirements = new List<CreatorReadinessRequirement>
                {
                    new() { Key = "verification", Label = "Verify your identity", Route = "/dashboard/creator/phase-1", Complete = phase1Complete, Required = true, Blocking = true, Status = phase1Complete ? "COMPLETE" : "PENDING", Details = phase1Complete ? "Identity verified" : "Universal identity verification required" },
                    new() { Key = "partnership_active", Label = "Partnership active", Route = $"/dashboard/creator/partnerships/{deal?.Id ?? ""}", Complete = isPartnershipActive, Required = true, Blocking = true, Status = isPartnershipActive ? "COMPLETE" : "PENDING", Details = isPartnershipActive ? "Equity partnership active and completed" : "Active equity partnership required" },
                    new() { Key = "company_linked", Label = "Company linked", Route = $"/dashboard/creator/partnerships/{deal?.Id ?? ""}", Complete = isCompanyLinked, Required = true, Blocking = true, Status = isCompanyLinked ? $"Linked to {company?.CompanyName ?? "Operating Company"}" : "Operating company must be linked" },
                    new() { Key = "creator_shareholder", Label = "Creator shareholder recorded", Route = $"/dashboard/creator/partnerships/{deal?.Id ?? ""}", Complete = isCreatorShareholder, Required = true, Blocking = true, Status = isCreatorShareholder ? "Recorded on company cap table" : "Shareholder record missing on company cap table" },
                    new() { Key = "role_confirmed", Label = "Role confirmed", Route = $"/dashboard/creator/partnerships/{deal?.Id ?? ""}", Complete = isRoleConfirmed, Required = true, Blocking = true, Status = isRoleConfirmed ? $"Confirmed role: {deal?.RoleAgreement?.CreatorRole}" : "Bilateral role agreement must be confirmed" },
                    new() { Key = "equity_recorded", Label = "Equity recorded", Route = $"/dashboard/creator/partnerships/{deal?.Id ?? ""}", Complete = isEquityRecorded, Required = true, Blocking = true, Status = isEquityRecorded ? $"Equity grant: {deal?.EquityTerms?.EquityPercentage}%" : "Equity terms must be recorded" },
                    new() { Key = "legal_signed", Label = "Legal package signed", Route = $"/dashboard/creator/partnerships/{deal?.Id ?? ""}", Complete = isLegalSigned, Required = true, Blocking = true, Status = isLegalSigned ? "All agreements signed with matching manifest hash" : "Signed legal package required" },
                    new() { Key = "company_documents", Label = "Company documents available", Route = $"/dashboard/creator/partnerships/{deal?.Id ?? ""}", Complete = isDocumentsAvailable, Required = true, Blocking = true, Status = isDocumentsAvailable ? "Executed documents deposited" : "Linked documents pending deposit" },
                };

                var missing = cofoundedRequirements.Where(x => x.Required && !x.Complete).Select(x => x.Key).ToList();
                var completeCount = cofoundedRequirements.Count(x => x.Complete);

                ApplicationUser entUser = null;
                if (!string.IsNullOrEmpty(deal?.EntrepreneurId))
                {
                    try { entUser = await _userManager.FindByIdAsync(deal.EntrepreneurId); } catch { }
                }

                var response = new CreatorReadinessResponse
                {
                    OverallProgress = (int)Math.Round(completeCount * 100d / cofoundedRequirements.Count),
                    LevelUpEligible = missing.Count == 0,
                    SelectedPath = "co_founded",
                    QualificationPath = "CO_FOUNDED",
                    CompanyName = company?.CompanyName ?? deal?.Activation?.CompanyName ?? "Operating Company",
                    CreatorRole = deal?.RoleAgreement?.CreatorRole ?? deal?.EquityTerms?.CreatorRole ?? "Co-founder",
                    CreatorEquityPercent = deal?.EquityTerms?.EquityPercentage,
                    PartnerName = entUser?.Name ?? entUser?.UserName ?? "Entrepreneur",
                    CompanyId = company?.Id ?? deal?.Activation?.CompanyId,
                    DealId = deal?.Id,
                    OutcomeBadge = "CO-FOUNDED",
                    Requirements = cofoundedRequirements,
                    MissingRequired = missing,
                };

                response.NextBestAction = response.LevelUpEligible
                    ? new CreatorReadinessRequirement { Key = "level_up", Label = "Level Up to Entrepreneur", Route = "/dashboard/creator/investors", Required = true, Complete = true, Status = "READY" }
                    : cofoundedRequirements.FirstOrDefault(x => x.Required && !x.Complete);

                return response;
            }

            // ROUTE A — BUILD / SOLO FOUNDER READINESS (Unchanged)
            var requirements = new List<CreatorReadinessRequirement>
            {
                new() { Key = "verification", Label = "Verify your identity", Route = "/dashboard/creator/phase-1", Complete = phase1Complete, Required = true, Blocking = true, Status = phase1Complete ? "COMPLETE" : "PENDING" },
                new() { Key = "idea_core", Label = "Define your idea", Route = "/dashboard/creator/phase-2", Complete = !string.IsNullOrWhiteSpace(project.Problem) && !string.IsNullOrWhiteSpace(project.TargetUser) && !string.IsNullOrWhiteSpace(project.Solution), Required = true, Blocking = true, Status = !string.IsNullOrWhiteSpace(project.Problem) && !string.IsNullOrWhiteSpace(project.TargetUser) && !string.IsNullOrWhiteSpace(project.Solution) ? "COMPLETE" : "PENDING" },
                new() { Key = "business_planning", Label = "Complete your business plan", Route = "/dashboard/creator/phase-3/business-plan", Complete = computed.Phase3.Status == "completed", Required = true, Blocking = true, Status = computed.Phase3.Status == "completed" ? "COMPLETE" : "PENDING" },
                new() { Key = "commercial_preparation", Label = "Prepare your commercial offer", Route = "/dashboard/creator/offer-pricing", Complete = computed.Phase4.Status == "completed", Required = true, Blocking = true, Status = computed.Phase4.Status == "completed" ? "COMPLETE" : "PENDING" },
                new() { Key = "direction", Label = "Choose your direction", Route = "/dashboard/creator/crossroads", Complete = !string.IsNullOrWhiteSpace(p5.ChosenPath), Required = true, Blocking = true, Status = !string.IsNullOrWhiteSpace(p5.ChosenPath) ? "COMPLETE" : "PENDING" },
                new() { Key = "company_setup", Label = "Complete company planning", Route = "/dashboard/creator/crossroads", Complete = isBuild && p5.PathB?.CompanyFormation != null, Required = isBuild, Blocking = true, Status = isBuild && p5.PathB?.CompanyFormation != null ? "COMPLETE" : "PENDING" },
                new() { Key = "funding_preparation", Label = "Set your funding target", Route = "/dashboard/creator/crossroads", Complete = isBuild && p5.PathB?.SeedFunding != null, Required = isBuild, Blocking = true, Status = isBuild && p5.PathB?.SeedFunding != null ? "COMPLETE" : "PENDING" },
            };

            var buildMissing = requirements.Where(x => x.Required && !x.Complete).Select(x => x.Key).ToList();
            var buildRelevant = requirements.Where(x => x.Required).ToList();
            var buildComplete = buildRelevant.Count(x => x.Complete);

            var buildResponse = new CreatorReadinessResponse
            {
                OverallProgress = buildRelevant.Count == 0 ? 0 : (int)Math.Round(buildComplete * 100d / buildRelevant.Count),
                LevelUpEligible = isBuild && buildMissing.Count == 0 && !isSold,
                SelectedPath = p5.ChosenPath ?? "",
                QualificationPath = isBuild ? "BUILD" : (isSell ? "SELL" : "UNSET"),
                OutcomeBadge = isSold ? "SOLD" : null,
                Requirements = requirements,
                MissingRequired = buildMissing,
            };

            buildResponse.NextBestAction = isSell
                ? (p5.PathA?.MarketplaceListing?.Status == "live" ? null : new CreatorReadinessRequirement { Key = "publish_full_buyout", Label = "Publish your Full Buyout listing", Route = "/dashboard/creator/crossroads", Required = false })
                : buildResponse.LevelUpEligible
                    ? new CreatorReadinessRequirement { Key = "level_up", Label = "Become an Entrepreneur", Route = "/dashboard/creator/investors", Required = true, Complete = true, Status = "READY" }
                    : requirements.FirstOrDefault(x => x.Required && !x.Complete);

            return buildResponse;
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
        /// the real, derived engine unlocks Phase 6 only on the Build path or Co-founded path after
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

                // Block Full Buyout / SOLD projects immediately
                if (string.Equals(ownedIdea.ProjectOutcome, "SOLD", StringComparison.OrdinalIgnoreCase))
                    return UnprocessableEntity(ApiResponse.Error("Full Buyout projects are not eligible for Level Up.", HttpContext.TraceIdentifier));

                var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
                var levelUpIdeaId = ideaId;
                var p5 = journey.Phase5Data ?? new CreatorPhase5Data();
                var p6 = journey.Phase6Data ??= new CreatorPhase6Data();
                var entRole = await _roleManager.FindByNameAsync("Entrepreneur");
                if (entRole == null)
                    _logger.LogWarning("Level Up: 'Entrepreneur' role missing in DB; user role will not be set for {UserId}.", userId);

                // Re-evaluate readiness
                var readiness = await BuildReadinessAsync(userId, journey);
                if (!readiness.LevelUpEligible)
                    return UnprocessableEntity(ApiResponse.Error("prerequisites_not_met", HttpContext.TraceIdentifier, new { missing = readiness.MissingRequired }));

                bool isCofounded = readiness.QualificationPath == "CO_FOUNDED";

                // Idempotency: same idea -> return canonical already-leveled-up response; different idea -> 409
                if (!string.IsNullOrEmpty(journey.LeveledUpIdeaId) || !string.IsNullOrEmpty(p6.EntrepreneurProfileId))
                {
                    if (journey.LeveledUpIdeaId == levelUpIdeaId || string.IsNullOrEmpty(journey.LeveledUpIdeaId))
                    {
                        if (entRole != null)
                        {
                            try
                            {
                                var targetUser = await _userManager.FindByIdAsync(userId);
                                if (targetUser != null && !await _userManager.IsInRoleAsync(targetUser, "Entrepreneur"))
                                {
                                    await _userManager.AddToRoleAsync(targetUser, "Entrepreneur");
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogWarning(ex, "Failed to reconcile missing 'Entrepreneur' role for {UserId} on idempotent call.", userId);
                            }
                        }
                        return Ok(ApiResponse.Ok("Already leveled up", new
                        {
                            levelUpComplete = true,
                            qualificationPath = readiness.QualificationPath,
                            companyId = journey.CompanyId ?? readiness.CompanyId,
                            companyName = readiness.CompanyName,
                            creatorRole = readiness.CreatorRole,
                            creatorEquityPercent = readiness.CreatorEquityPercent,
                            entrepreneurProfileId = p6.EntrepreneurProfileId,
                            redirectTo = "/dashboard/entrepreneur",
                        }));
                    }
                    return StatusCode(409, ApiResponse.Error("Another idea has already been taken through Level Up.", HttpContext.TraceIdentifier));
                }

                // A multi-document Level Up must never masquerade as atomic in a production-like environment.
                if (!_transactionsEnabled && !_isDevelopment)
                    return StatusCode(StatusCodes.Status503ServiceUnavailable,
                        ApiResponse.Error("Level Up requires a transaction-capable Mongo deployment. Please contact support.", HttpContext.TraceIdentifier));

                Guid.TryParse(userId, out var userGuid);
                string companyId = null;
                Companies companyDoc = null;
                DealExecution dealDoc = null;

                if (isCofounded)
                {
                    // Strict server-side revalidation of canonical records
                    dealDoc = !string.IsNullOrEmpty(ownedIdea.ActivePartnershipDealId)
                        ? await _context.DealExecutions.Find(d => d.Id == ownedIdea.ActivePartnershipDealId).FirstOrDefaultAsync()
                        : null;

                    if (dealDoc == null ||
                        dealDoc.DealType != "EQUITY_PARTNERSHIP" ||
                        dealDoc.DealStage != "PARTNERSHIP_ACTIVE" ||
                        dealDoc.Status != "completed" ||
                        dealDoc.Activation?.Status != "PARTNERSHIP_ACTIVE" ||
                        dealDoc.CreatorId != userId)
                    {
                        return UnprocessableEntity(ApiResponse.Error("Active equity partnership required for Co-founded Level Up.", HttpContext.TraceIdentifier));
                    }

                    var linkedCompanyId = dealDoc.Activation?.CompanyId ?? ownedIdea.CompanyId;
                    companyDoc = !string.IsNullOrEmpty(linkedCompanyId)
                        ? await _context.Companies.Find(c => c.Id == linkedCompanyId).FirstOrDefaultAsync()
                        : null;

                    if (companyDoc == null)
                        return UnprocessableEntity(ApiResponse.Error("Operating company record not found for active partnership.", HttpContext.TraceIdentifier));

                    var userDoc = await _userManager.FindByIdAsync(userId);
                    var creatorShares = dealDoc.Activation?.AppliedCapTableEntries?.FirstOrDefault(e => e.IsCreator)?.SharesGranted;
                    var creatorEntry = companyDoc.EquityStructure?.FirstOrDefault(e => e.SharesOwned > 0 &&
                        ((!string.IsNullOrEmpty(userDoc?.Name) && e.StakeholderName?.Contains(userDoc.Name, StringComparison.OrdinalIgnoreCase) == true) ||
                         (!string.IsNullOrEmpty(userId) && e.StakeholderName?.Contains(userId, StringComparison.OrdinalIgnoreCase) == true) ||
                         (e.StakeholderName?.Contains("Creator", StringComparison.OrdinalIgnoreCase) == true) ||
                         (creatorShares.HasValue && creatorShares.Value > 0 && e.SharesOwned == creatorShares.Value)));

                    if (creatorEntry == null)
                        return UnprocessableEntity(ApiResponse.Error("Creator is not recorded in company ownership cap table.", HttpContext.TraceIdentifier));

                    if (dealDoc.SigningPackage?.Status != "AGREEMENT_SIGNED" ||
                        string.IsNullOrEmpty(dealDoc.SigningPackage?.ManifestHash) ||
                        dealDoc.SigningPackage.ManifestHash != dealDoc.Activation?.SignedManifestHash)
                    {
                        return UnprocessableEntity(ApiResponse.Error("Signed legal package manifest hash mismatch.", HttpContext.TraceIdentifier));
                    }

                    if (dealDoc.RoleAgreement?.Status != "CONFIRMED")
                        return UnprocessableEntity(ApiResponse.Error("Bilateral role agreement not confirmed.", HttpContext.TraceIdentifier));

                    companyId = companyDoc.Id;
                }

                // Check existing Entrepreneur Profile to prevent duplicates
                var existingProfile = await _context.EntrepreneurProfiles.Find(p => p.UserId == userId).FirstOrDefaultAsync();
                var profileId = existingProfile?.Id ?? ObjectId.GenerateNewId().ToString();

                var profile = existingProfile ?? new EntrepreneurProfileRecord
                {
                    Id = profileId,
                    UserId = userId,
                    BusinessIdeaId = !string.IsNullOrEmpty(journey.BusinessIdeaId) ? journey.BusinessIdeaId : levelUpIdeaId,
                    Project = journey.Project,
                    OfferSetup = journey.Phase4Data,
                    Masterplan = journey.Phase3Data,
                    PathB = p5.PathB,
                };

                // The ATOMIC CORE writes
                async Task CoreWritesAsync(IClientSessionHandle session)
                {
                    if (isCofounded)
                    {
                        // Co-founded path: REUSE existing company. DO NOT create new company and DO NOT overwrite OwnerId!
                        profile.CompanyId = companyId;
                        if (existingProfile == null)
                        {
                            if (session is null) await _context.EntrepreneurProfiles.InsertOneAsync(profile);
                            else await _context.EntrepreneurProfiles.InsertOneAsync(session, profile);
                        }
                        else if (string.IsNullOrEmpty(existingProfile.CompanyId))
                        {
                            var profileUpd = Builders<EntrepreneurProfileRecord>.Update.Set(p => p.CompanyId, companyId);
                            if (session is null) await _context.EntrepreneurProfiles.UpdateOneAsync(p => p.Id == existingProfile.Id, profileUpd);
                            else await _context.EntrepreneurProfiles.UpdateOneAsync(session, p => p.Id == existingProfile.Id, profileUpd);
                        }
                    }
                    else
                    {
                        // Build path: EnsureLevelUpCompanyAsync creates/reuses company where OwnerId = userId
                        var formation = p5.PathB?.CompanyFormation;
                        var seed = p5.PathB?.SeedFunding;
                        var sourceLink = !string.IsNullOrEmpty(journey.BusinessIdeaId) ? journey.BusinessIdeaId
                            : !string.IsNullOrEmpty(levelUpIdeaId) ? levelUpIdeaId : journey.Id;
                        double? fundingAsk = seed?.TotalAsk > 0 ? (double?)(double)seed.TotalAsk : null;

                        var company = await _companies.EnsureLevelUpCompanyAsync(
                            userId, sourceLink, formation?.SelectedType, fundingAsk, session);
                        companyId = company.Id;
                        profile.CompanyId = companyId;

                        if (existingProfile == null)
                        {
                            if (session is null) await _context.EntrepreneurProfiles.InsertOneAsync(profile);
                            else await _context.EntrepreneurProfiles.InsertOneAsync(session, profile);
                        }
                    }

                    journey.CompanyId = companyId;
                    journey.LeveledUpIdeaId = levelUpIdeaId;
                    p6.LevelUpTriggered = true;
                    p6.LevelUpTriggeredAt = DateTime.UtcNow;
                    p6.EntrepreneurProfileId = profile.Id;
                    (p6.SmartMatchmaking ??= new CreatorSmartMatchmaking()).Status = "live";

                    // Update CreatorIdea optimistic concurrency
                    var ideaUpdated = await _ideas.UpdateAsync(
                        levelUpIdeaId,
                        userId,
                        Builders<CreatorIdea>.Update.Set(x => x.SmartMatchmaking, p6.SmartMatchmaking),
                        expectedVersion,
                        session);
                    if (!ideaUpdated)
                        throw new CreatorJourneyException(409, "This idea was updated in another tab. Refresh to load the latest version before continuing.");

                    // Update CreatorJourney
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

                    // Update ApplicationUser (add Entrepreneur role while retaining Creator role)
                    if (userGuid != Guid.Empty)
                    {
                        var upd = Builders<ApplicationUser>.Update.Set(u => u.EntrepreneurProfile.CompanyId, companyId);
                        if (entRole != null)
                        {
                            upd = upd.AddToSet(u => u.Roles, entRole.Id);
                        }
                        var filter = Builders<ApplicationUser>.Filter.Eq("_id", userGuid) | Builders<ApplicationUser>.Filter.Eq("_id", userId);
                        if (session is null) await _context.ApplicationUsers.UpdateOneAsync(filter, upd);
                        else await _context.ApplicationUsers.UpdateOneAsync(session, filter, upd);
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
                    _logger.LogWarning("Mongo:TransactionsEnabled=false — Level Up using non-atomic ordered-writes fallback (standalone dev only) for {UserId}.", userId);
                    await CoreWritesAsync(null);
                }

                // ---- Post-commit, best-effort ----
                if (entRole != null)
                {
                    try
                    {
                        var targetUser = await _userManager.FindByIdAsync(userId);
                        if (targetUser != null && !await _userManager.IsInRoleAsync(targetUser, "Entrepreneur"))
                        {
                            await _userManager.AddToRoleAsync(targetUser, "Entrepreneur");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Role update post-Level-Up failed for {UserId}.", userId);
                    }
                }

                // Cap table seeding for Build path only
                if (!isCofounded)
                {
                    var formation = p5.PathB?.CompanyFormation;
                    if ((formation?.Ownership?.Count ?? 0) > 0)
                    {
                        try { await SeedCapTableFromPlanAsync(companyId, formation.Ownership); }
                        catch (Exception ex) { _logger.LogWarning(ex, "Cap-table seed failed post-Level-Up for {CompanyId}; re-enterable at Phase 4.", companyId); }
                    }
                }

                // SignalR event
                try
                {
                    await _events.PublishAsync(new[] { userId }, "LevelUpComplete", new
                    {
                        qualificationPath = isCofounded ? "CO_FOUNDED" : "BUILD",
                        companyId = companyId,
                        entrepreneurProfileId = profile.Id,
                        redirectTo = "/dashboard/entrepreneur",
                    });
                }
                catch (Exception ex) { _logger.LogWarning(ex, "LevelUpComplete SignalR emit failed for {UserId}.", userId); }

                // Log audit trail
                _logger.LogInformation("Level Up complete: userId={UserId}, ideaId={IdeaId}, qualificationPath={Path}, companyId={CompanyId}, profileId={ProfileId}",
                    userId, levelUpIdeaId, isCofounded ? "CO_FOUNDED" : "BUILD", companyId, profile.Id);

                return Ok(ApiResponse.Ok("Level up complete", new
                {
                    levelUpComplete = true,
                    qualificationPath = isCofounded ? "CO_FOUNDED" : "BUILD",
                    companyId = companyId,
                    companyName = companyDoc?.CompanyName ?? readiness.CompanyName,
                    creatorRole = isCofounded ? (dealDoc?.RoleAgreement?.CreatorRole ?? readiness.CreatorRole) : "Founder",
                    creatorEquityPercent = isCofounded ? (dealDoc?.EquityTerms?.EquityPercentage ?? readiness.CreatorEquityPercent) : 100.0,
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
