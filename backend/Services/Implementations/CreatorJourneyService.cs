using System.Collections.Concurrent;
using Microsoft.AspNetCore.Identity;
using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Legal;
using WebApp.Models.Dtos;
using WebApp.Services.Interface;
using WebApp.Services.Legal;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;

namespace WebApp.Services.Implementations
{
    /// <summary>
    /// Thrown for journey validation failures; the controller maps <see cref="StatusCode"/>
    /// directly (400 invalid input, 403 locked/forbidden, 422 unmet prerequisites).
    /// </summary>
    public class CreatorJourneyException : Exception
    {
        public int StatusCode { get; }
        public CreatorJourneyException(int statusCode, string message) : base(message) => StatusCode = statusCode;
    }

    public class CreatorJourneyService : ICreatorJourneyService
    {
        private readonly MongoDbContext _context;
        // Phase-3 completion is gated on the linked AI sessions actually succeeding
        // (Status=Completed with Content), not on the session id merely existing —
        // ids are linked at generation start, so a failed/pending job must not complete P3.
        private readonly IBusinessPlanSessionStore _businessPlans;
        private readonly IForecastSessionStore _forecasts;
        private readonly IMarketStudySessionStore _marketStudies;
        private readonly IBusinessModelSessionStore _businessModels;
        // Multi-idea STEP 2: mint the per-idea document at Phase-2 finalize and stamp the
        // anchoring clarifier. Additive — nothing reads CreatorIdeas / the anchor yet.
        private readonly ICreatorIdeaStore _creatorIdeas;
        private readonly IClarifierSessionStore _clarifiers;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILegalApplicabilityEngine? _legalEngine;
        private readonly UserManager<ApplicationUser>? _userManager;
        private static readonly ConcurrentDictionary<string, SemaphoreSlim> _creationLocks = new();
        private static readonly TimeSpan PathSwitchWindow = TimeSpan.FromDays(30);

        // Legacy Path-A value, retired in P1.10. Centralized here so the one-time
        // read-coercion is the ONLY reference to it; no consumer branches on it.
        private const string LegacyPathAlias = "buyout";

        public CreatorJourneyService(
            MongoDbContext context,
            IBusinessPlanSessionStore businessPlans,
            IForecastSessionStore forecasts,
            ICreatorIdeaStore creatorIdeas,
            IClarifierSessionStore clarifiers,
            IHttpContextAccessor httpContextAccessor = null,
            IMarketStudySessionStore marketStudies = null,
            IBusinessModelSessionStore businessModels = null,
            ILegalApplicabilityEngine legalEngine = null,
            UserManager<ApplicationUser> userManager = null)
        {
            _context = context;
            _businessPlans = businessPlans;
            _forecasts = forecasts;
            _creatorIdeas = creatorIdeas;
            _clarifiers = clarifiers;
            _httpContextAccessor = httpContextAccessor;
            _marketStudies = marketStudies;
            _businessModels = businessModels;
            _legalEngine = legalEngine;
            _userManager = userManager;
        }

        // =================================================================
        // STEP 4 CUTOVER — per-idea resolution + dual-write plumbing.
        // The IDEA document is the source of truth; every write mirrors to the
        // journey (MIRROR — remove in/before step 6: mirroring is undefined once a
        // user has two ideas). Reads come from the idea via the composed view.
        // =================================================================

        /// <summary>
        /// Pure read-only idea resolution. Returns existing owned idea or null if zero ideas exist.
        /// NEVER creates ideas and NEVER mutates database state.
        /// </summary>
        public async Task<CreatorIdea?> TryResolveIdeaAsync(string userId, string ideaId = null)
        {
            var j = await GetOrCreateAsync(userId);
            return await TryResolveIdeaAsync(j, ideaId);
        }

        /// <summary>
        /// Pure read-only idea resolution on an already loaded journey.
        /// NEVER creates ideas and NEVER mutates database state.
        /// </summary>
        public async Task<CreatorIdea?> TryResolveIdeaAsync(CreatorJourney j, string ideaId = null)
        {
            if (!string.IsNullOrEmpty(ideaId))
            {
                var owned = await _creatorIdeas.GetOwnedAsync(ideaId, j.UserId);
                if (owned == null)
                    throw new CreatorJourneyException(403, "Idea not found or access denied.");
                if (!string.Equals(owned.UserId, j.UserId, StringComparison.Ordinal))
                    throw new CreatorJourneyException(409, "You've switched to a different idea elsewhere — refresh this page and try again.");
                return owned;
            }

            if (!string.IsNullOrEmpty(j.ActiveIdeaId))
            {
                var active = await _creatorIdeas.GetOwnedAsync(j.ActiveIdeaId, j.UserId);
                if (active != null)
                    return active;
                // Stale pointer — fall through without mutating database on read.
            }

            var existing = await _creatorIdeas.ListByUserAsync(j.UserId);
            if (existing.Count > 0)
            {
                var canonical = existing.FirstOrDefault(x => x.Status == "active" && !string.Equals(x.ProjectOutcome, "SOLD", StringComparison.OrdinalIgnoreCase)) ?? existing[0];
                return canonical;
            }

            // Zero ideas exist: pure read returns null. NEVER mint or write to DB.
            return null;
        }

        /// <summary>
        /// Resolve the caller's idea for mutations. An explicit id must be owned by the caller.
        /// ActiveIdeaId remains a navigation preference only.
        /// If no ideas exist at mutation time, delegates to GetOrCreateClarifierIdeaAsync.
        /// </summary>
        private async Task<CreatorIdea> ResolveIdeaAsync(CreatorJourney j, string ideaId)
        {
            if (!string.IsNullOrEmpty(ideaId))
            {
                var owned = await _creatorIdeas.GetOwnedAsync(ideaId, j.UserId);
                if (owned == null)
                    throw new CreatorJourneyException(404, "Idea not found.");
                if (!string.Equals(owned.UserId, j.UserId, StringComparison.Ordinal))
                    throw new CreatorJourneyException(409, "You've switched to a different idea elsewhere — refresh this page and try again.");
                return owned;
            }

            if (!string.IsNullOrEmpty(j.ActiveIdeaId))
            {
                var active = await _creatorIdeas.GetOwnedAsync(j.ActiveIdeaId, j.UserId);
                if (active != null)
                    return active;
            }

            var existing = await _creatorIdeas.ListByUserAsync(j.UserId);
            if (existing.Count > 0)
            {
                var canonical = existing.FirstOrDefault(x => x.Status == "active" && !string.Equals(x.ProjectOutcome, "SOLD", StringComparison.OrdinalIgnoreCase)) ?? existing[0];
                await SetActiveIdeaPointerAsync(j, canonical.Id);
                return canonical;
            }

            return await GetOrCreateClarifierIdeaAsync(j.UserId);
        }

        /// <summary>
        /// Explicit Clarifier entry initialization. Idempotent and race-safe.
        /// Verifies Phase 1 completion, reuses existing active idea if present,
        /// or atomically creates exactly one CreatorIdea and sets ActiveIdeaId.
        /// </summary>
        public async Task<CreatorIdea> GetOrCreateClarifierIdeaAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new UnauthorizedAccessException("User not authenticated.");

            if (_userManager != null)
            {
                var user = await _userManager.FindByIdAsync(userId);
                bool phase1Complete = (user?.Onboarding?.Phase ?? 0) >= 1;
                if (!phase1Complete)
                {
                    throw new CreatorJourneyException(403, "Phase 1 onboarding must be completed before entering Phase 2.");
                }
            }

            var sem = _creationLocks.GetOrAdd(userId, _ => new SemaphoreSlim(1, 1));
            await sem.WaitAsync();
            try
            {
                var j = await GetOrCreateAsync(userId);

                // 1. If journey.ActiveIdeaId exists AND belongs to current user: reuse it
                if (!string.IsNullOrEmpty(j.ActiveIdeaId))
                {
                    var active = await _creatorIdeas.GetOwnedAsync(j.ActiveIdeaId, userId);
                    if (active != null)
                        return active;
                }

                // 2. If ActiveIdeaId was missing or stale, resolve from existing user ideas
                var existing = await _creatorIdeas.ListByUserAsync(userId);
                if (existing.Count > 0)
                {
                    var canonical = existing.FirstOrDefault(x => x.Status == "active" && !string.Equals(x.ProjectOutcome, "SOLD", StringComparison.OrdinalIgnoreCase)) ?? existing[0];
                    await SetActiveIdeaPointerAsync(j, canonical.Id);
                    return canonical;
                }

                // 3. Exactly zero ideas exist: create exactly ONE CreatorIdea
                var idea = new CreatorIdea
                {
                    Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
                    UserId = userId,
                    Status = "active",
                    Project = j.Project ?? new CreatorJourneyProject(),
                    Phase2Data = j.Phase2Data ?? new CreatorPhase2Data(),
                    Phase3Data = j.Phase3Data ?? new CreatorPhase3Data(),
                    Phase4Data = j.Phase4Data ?? new CreatorPhase4Data(),
                    Phase5Data = j.Phase5Data ?? new CreatorPhase5Data(),
                    SmartMatchmaking = j.Phase6Data?.SmartMatchmaking ?? new CreatorSmartMatchmaking(),
                    OutputSnapshots = j.OutputSnapshots ?? new CreatorOutputSnapshots(),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    LastActiveAt = DateTime.UtcNow
                };
                await _creatorIdeas.AddAsync(idea);
                await SetActiveIdeaPointerAsync(j, idea.Id);
                return idea;
            }
            finally
            {
                sem.Release();
            }
        }

        /// <summary>Atomic ActiveIdeaId repoint ($set only) + in-memory reflection.</summary>
        private async Task SetActiveIdeaPointerAsync(CreatorJourney j, string ideaId)
        {
            j.ActiveIdeaId = ideaId;
            await _context.CreatorJourneys.UpdateOneAsync(
                f => f.Id == j.Id,
                Builders<CreatorJourney>.Update
                    .Set(x => x.ActiveIdeaId, ideaId)
                    .Set(x => x.UpdatedAt, DateTime.UtcNow));
        }

        /// <summary>
        /// Overlay the idea's per-idea blocks onto the in-memory journey object, so
        /// (a) existing mutation/read logic operates on the IDEA's data, and (b) the
        /// returned object serializes idea-sourced content in the unchanged response
        /// shape. Journey-level fields (ActiveIdeaId, LeveledUpIdeaId, CompanyId,
        /// Phase-6 Level-Up markers) stay the journey's own. Never persisted by itself.
        /// </summary>
        private static CreatorJourney OverlayIdea(CreatorJourney j, CreatorIdea idea)
        {
            var canonicalNeeds = j.Phase4Data?.NeedsAnalysis;
            var canonicalSkills = j.Phase4Data?.SkillsPlan;
            var canonicalSupport = j.Phase4Data?.SupportPlan;
            var canonicalPricing = j.Phase4Data?.PricingStrategy;
            var canonicalGtm = j.Phase4Data?.GtmStrategy;
            var canonicalSnapshot = j.Phase4Data?.ConstructionSnapshot;
            var canonicalRoadmap = j.Phase4Data?.Roadmap;
            var canonicalVersions = j.Phase4Data?.SourceVersions;
            j.Project = idea.Project ??= new CreatorJourneyProject();
            j.Phase2Data = idea.Phase2Data ??= new CreatorPhase2Data();
            j.Phase3Data = idea.Phase3Data ??= new CreatorPhase3Data();
            j.Phase4Data = idea.Phase4Data ??= new CreatorPhase4Data();
            if (canonicalNeeds != null)
            {
                j.Phase4Data.NeedsAnalysis = canonicalNeeds;
            }
            if (canonicalSkills != null)
            {
                j.Phase4Data.SkillsPlan = canonicalSkills;
            }
            if (canonicalSupport != null)
            {
                j.Phase4Data.SupportPlan = canonicalSupport;
            }
            if (canonicalPricing != null)
            {
                j.Phase4Data.PricingStrategy = canonicalPricing;
            }
            if (canonicalGtm != null)
            {
                j.Phase4Data.GtmStrategy = canonicalGtm;
            }
            if (canonicalSnapshot != null)
            {
                j.Phase4Data.ConstructionSnapshot = canonicalSnapshot;
            }
            if (canonicalRoadmap != null)
            {
                j.Phase4Data.Roadmap = canonicalRoadmap;
            }
            if (canonicalVersions != null)
            {
                j.Phase4Data.SourceVersions = canonicalVersions;
            }
            j.Phase5Data = idea.Phase5Data ??= new CreatorPhase5Data();
            var p6 = j.Phase6Data ??= new CreatorPhase6Data();
            p6.SmartMatchmaking = idea.SmartMatchmaking ??= new CreatorSmartMatchmaking();
            // Phase 6 is PER-IDEA (step 6iii): only THE leveled-up idea shows Level-Up
            // completion — the user's other ideas never inherit it. Strict equality:
            // the step-1 backfill guarantees LeveledUpIdeaId for every leveled-up user.
            p6.LevelUpTriggered = !string.IsNullOrEmpty(j.LeveledUpIdeaId) && j.LeveledUpIdeaId == idea.Id;
            j.OutputSnapshots = idea.OutputSnapshots ??= new CreatorOutputSnapshots();
            j.IdeaVersion = idea.Version > 0 ? idea.Version : 1;
            j.IdeaId = idea.Id;
            j.ProjectOutcome = idea.ProjectOutcome;
            j.ActivePartnershipDealId = idea.ActivePartnershipDealId;
            if (!string.IsNullOrEmpty(idea.CompanyId)) j.CompanyId = idea.CompanyId;
            return j;
        }

        /// <summary>Targeted optimistic write on the per-idea source of truth.</summary>
        private async Task WriteIdeaAsync(CreatorIdea idea, UpdateDefinition<CreatorIdea> update)
        {
            if (string.Equals(idea.ProjectOutcome, "SOLD", StringComparison.OrdinalIgnoreCase))
                throw new CreatorJourneyException(422, "This project has been sold and is permanently read-only.");

            var http = _httpContextAccessor?.HttpContext;
            long? expectedVersion = null;
            if (http != null)
            {
                var submittedIdeaId = http.Request.Query["ideaId"].ToString();
                if (string.IsNullOrWhiteSpace(submittedIdeaId))
                    throw new CreatorJourneyException(400, "ideaId is required for Creator changes.");
                if (!string.Equals(submittedIdeaId, idea.Id, StringComparison.Ordinal))
                    throw new CreatorJourneyException(400, "Submitted ideaId does not match the workspace idea.");

                if (http.Items.TryGetValue("CreatorIdeaVersion", out var current) && current is long version)
                    expectedVersion = version;
                else if (!long.TryParse(http.Request.Query["expectedVersion"], out var submittedVersion) || submittedVersion < 1)
                    throw new CreatorJourneyException(400, "expectedVersion is required for Creator changes.");
                else
                    expectedVersion = submittedVersion;
            }

            var updated = await _creatorIdeas.UpdateAsync(idea.Id, idea.UserId, update, expectedVersion);
            if (!updated)
                throw new CreatorJourneyException(409, "This idea was updated in another tab. Refresh to load the latest version before continuing.");

            if (expectedVersion.HasValue)
            {
                var nextVersion = expectedVersion.Value + 1;
                http!.Items["CreatorIdeaVersion"] = nextVersion;
                idea.Version = nextVersion;
            }
        }

        public async Task<CreatorJourney> GetOrCreateComposedAsync(string userId, string ideaId = null)
        {
            var j = await GetOrCreateAsync(userId);
            var idea = await TryResolveIdeaAsync(j, ideaId);
            if (idea == null)
            {
                // Pure read: no idea exists for this user.
                // Keep ActiveIdeaId null, return j unmodified without write.
                if (string.IsNullOrEmpty(ideaId))
                {
                    j.ActiveIdeaId = null;
                }
                return j;
            }
            return OverlayIdea(j, idea);
        }

        public async Task<CreatorIdea> ResolveIdeaAsync(string userId, string ideaId = null)
        {
            var j = await GetOrCreateAsync(userId);
            return await ResolveIdeaAsync(j, ideaId);
        }

        public async Task<CreatorJourney> GetOrCreateAsync(string userId)
        {
            var existing = await _context.CreatorJourneys.Find(j => j.UserId == userId).FirstOrDefaultAsync();
            if (existing != null)
            {
                // One-time data migration: coerce any legacy Path-A value to the
                // canonical "sell_license" so no document carries the retired alias.
                if (existing.Phase5Data?.ChosenPath == LegacyPathAlias)
                {
                    existing.Phase5Data.ChosenPath = "sell_license";
                    await ReplaceAsync(existing);
                }
                return existing;
            }

            var journey = new CreatorJourney { UserId = userId };
            try
            {
                await _context.CreatorJourneys.InsertOneAsync(journey);
            }
            catch (MongoWriteException ex) when (ex.WriteError?.Category == ServerErrorCategory.DuplicateKey)
            {
                // Lost an insert race against a concurrent first-load; re-read the winner.
                journey = await _context.CreatorJourneys.Find(j => j.UserId == userId).FirstOrDefaultAsync();
            }
            return journey;
        }

        public async Task ReplaceAsync(CreatorJourney journey)
        {
            journey.UpdatedAt = DateTime.UtcNow;
            await _context.CreatorJourneys.ReplaceOneAsync(j => j.Id == journey.Id, journey);
        }

        public async Task ReplaceAsync(CreatorJourney journey, IClientSessionHandle session)
        {
            journey.UpdatedAt = DateTime.UtcNow;
            await _context.CreatorJourneys.ReplaceOneAsync(session, j => j.Id == journey.Id, journey);
        }

        // =================================================================
        // THE DERIVED-STATUS ENGINE (audit Section 2).
        // Pure function of artifact presence + Phase-1 completion. Never stored.
        // Computed sequentially p1→p6 so each phase can gate on the previous.
        // =================================================================
        public async Task<ComputedJourneyStatus> ComputePhaseStatusAsync(CreatorJourney j, bool phase1Complete)
        {
            var s = new ComputedJourneyStatus();

            // ---- Phase 1 (universal verification, lives on ApplicationUser) ----
            s.Phase1.Status = phase1Complete ? "completed" : "in_progress";

            // ---- Phase 2 ----
            var p = j.Project ?? new CreatorJourneyProject();
            var p2 = j.Phase2Data ?? new CreatorPhase2Data();
            bool brandingResolved = !string.IsNullOrEmpty(p.Branding?.BrandingMethod);
            bool nameSet = !string.IsNullOrWhiteSpace(p.Name);
            // Linear Clarifier flow: clarified if a clarifier session scored the idea,
            // or historical compatibility if an earlier user completed idea definition (problem, solution, score)
            // so they continue smoothly from their current canonical step without repeating.
            bool clarified = (p.ClarityScore > 0 && !string.IsNullOrEmpty(p2.ClarifierSessionId))
                || (p.ClarityScore > 0 && !string.IsNullOrEmpty(p.Problem) && !string.IsNullOrEmpty(p.Solution));

            if (!phase1Complete)
            {
                s.Phase2.Status = "locked";
            }
            else if (nameSet && p.ClarityScore > 0 && brandingResolved)
            {
                s.Phase2.Status = "completed";
            }
            else if ((p2.ChatMessages?.Count ?? 0) > 0 || nameSet || clarified)
            {
                s.Phase2.Status = "in_progress";
            }
            else
            {
                s.Phase2.Status = "available";
            }
            s.Phase2.CurrentStep = DerivePhase2Step(p, p2, brandingResolved, clarified);

            bool p2Done = s.Phase2.Status == "completed";

            // ---- Phase 3 ----
            var p3 = j.Phase3Data ?? new CreatorPhase3Data();
            // "Started" = a session id is linked (linked at generation start). "Completed" =
            // the AI job genuinely succeeded (Status=Completed with Content). A linked-but-
            // failed/pending session counts as started (keeps P3 in_progress + resumable),
            // but NOT as complete (so a failed job can't unlock Phase 4 with no real output).
            bool marketStudyStarted = !string.IsNullOrEmpty(p3.MarketStudySessionId);
            bool businessModelStarted = !string.IsNullOrEmpty(p3.BusinessModelSessionId);
            bool planStarted = !string.IsNullOrEmpty(p3.BusinessPlanSessionId);
            bool forecastStarted = !string.IsNullOrEmpty(p3.ForecastSessionId);

            var marketStudySession = marketStudyStarted && _marketStudies != null ? await _marketStudies.GetOwnedAsync(p3.MarketStudySessionId, j.UserId) : null;
            var businessModelSession = businessModelStarted && _businessModels != null ? await _businessModels.GetOwnedAsync(p3.BusinessModelSessionId, j.UserId) : null;
            var planSession = planStarted ? await _businessPlans.GetOwnedAsync(p3.BusinessPlanSessionId, j.UserId) : null;
            var forecastSession = forecastStarted ? await _forecasts.GetOwnedAsync(p3.ForecastSessionId, j.UserId) : null;

            // Shared predicate (AiSessionSuccess) — the masterplan endpoint uses the
            // SAME rule, so the engine and the endpoint cannot drift.
            bool hasMarketStudy = marketStudySession != null
                && WebApp.Services.Ai.AiSessionSuccess.IsComplete(marketStudySession.Status, marketStudySession.CurrentVersion);
            bool hasBusinessModel = businessModelSession != null
                && WebApp.Services.Ai.AiSessionSuccess.IsComplete(businessModelSession.Status, businessModelSession.CurrentVersion);
            bool hasPlan = planSession != null
                && WebApp.Services.Ai.AiSessionSuccess.IsComplete(planSession.Status, planSession.CurrentVersion);
            bool hasForecast = forecastSession != null
                && WebApp.Services.Ai.AiSessionSuccess.IsComplete(forecastSession.Status, forecastSession.CurrentVersion);

            // Legal & Compliance intelligence is mandatory for new journeys.
            // A legacy record bypass applies ONLY to pre-existing legacy records that completed
            // plan + forecast + formation before the 7-step market-led sequence was introduced.
            bool legalPresent = p3.LegalAssessment != null || p3.LegalChecklist != null;
            bool hasFormation = p3.FormationGenerator != null;
            bool anyP3 = marketStudyStarted || businessModelStarted || planStarted || forecastStarted || legalPresent || hasFormation;

            bool isLegacyRecord = hasPlan && hasForecast && hasFormation && !marketStudyStarted && !businessModelStarted;
            bool newJourneyComplete = hasMarketStudy && hasBusinessModel && hasForecast && legalPresent && hasFormation && hasPlan;

            if (!p2Done) s.Phase3.Status = "locked";
            else if (newJourneyComplete) s.Phase3.Status = "completed";
            else if (isLegacyRecord) s.Phase3.Status = "completed"; // legacy creator bypass only for legacy records
            else if (anyP3) s.Phase3.Status = "in_progress";
            else s.Phase3.Status = "available";

            // Canonical 7-step sequence (Artifact state > numeric historical step number as source of truth):
            //   Step 3.1: Market Study (/phase-3/market-study)
            //   Step 3.2: Business Model (/phase-3/business-model)
            //   Step 3.3: Financial Forecast (/phase-3/forecast)
            //   Step 3.4: Legal & Compliance (/phase-3/compliance)
            //   Step 3.5: Company Formation & Team (/phase-3/formation)
            //   Step 3.6: Executive Business Plan (/phase-3/business-plan)
            //   Step 3.7: Investor Readiness Complete (/phase-3/complete)
            if (isLegacyRecord)
            {
                s.Phase3.CurrentStep = 7;
            }
            else
            {
                s.Phase3.CurrentStep =
                    !hasMarketStudy ? 1 :
                    !hasBusinessModel ? 2 :
                    !hasForecast ? 3 :
                    !legalPresent ? 4 :
                    !hasFormation ? 5 :
                    !hasPlan ? 6 : 7;
            }

            bool p3Done = s.Phase3.Status == "completed";

            // ---- Phase 4 (Construction Engine) ----
            var p4 = j.Phase4Data ?? new CreatorPhase4Data();
            var p4Eval = Phase4CompletionResolver.Resolve(p4);
            bool anyP4 = p4Eval.SnapshotResolved || p4Eval.RoadmapResolved || p4Eval.NeedsResolved || p4Eval.SkillsResolved || p4Eval.SupportResolved || p4Eval.PricingResolved || p4Eval.GtmResolved;
            bool p4Complete = p4Eval.IsComplete;

            if (!p3Done) s.Phase4.Status = "locked";
            else if (p4Complete) s.Phase4.Status = "completed";
            else if (anyP4) s.Phase4.Status = "in_progress";
            else s.Phase4.Status = "available";

            s.Phase4.CurrentStep =
                !p4Eval.SnapshotResolved ? 1 :
                !p4Eval.RoadmapResolved ? 2 :
                !p4Eval.NeedsResolved ? 3 :
                !p4Eval.SkillsResolved ? 4 :
                !p4Eval.SupportResolved ? 5 :
                !p4Eval.PricingResolved ? 6 :
                !p4Eval.GtmResolved ? 7 : 8;

            bool p4Done = s.Phase4.Status == "completed";

            // ---- Phase 5 ----
            var p5 = j.Phase5Data ?? new CreatorPhase5Data();
            bool chosen = !string.IsNullOrEmpty(p5.ChosenPath);
            bool isBuild = p5.ChosenPath == "build";
            bool listingLive = p5.PathA?.MarketplaceListing?.Status == "live";
            bool seedPresent = p5.PathB?.SeedFunding != null;

            if (!p4Done) s.Phase5.Status = "locked";
            else if (chosen && (listingLive || seedPresent || isBuild)) s.Phase5.Status = "completed";
            else if (chosen) s.Phase5.Status = "in_progress";
            else s.Phase5.Status = "available";

            bool p5Done = s.Phase5.Status == "completed";

            // ---- Phase 6 (Two Valid Routes: BUILD or CO_FOUNDED; SOLD / Full Buyout locked) ----
            var p6 = j.Phase6Data ?? new CreatorPhase6Data();
            bool isCofounded = string.Equals(j.ProjectOutcome, "CO_FOUNDED", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrEmpty(j.ActivePartnershipDealId);
            bool isSoldOrBuyout = string.Equals(j.ProjectOutcome, "SOLD", StringComparison.OrdinalIgnoreCase);

            if (isSoldOrBuyout)
            {
                s.Phase6.Status = "locked"; // Full Buyout is strictly locked
            }
            else if (isBuild && p5Done)
            {
                if (p6.LevelUpTriggered) s.Phase6.Status = "completed";
                else if (p6.SmartMatchmaking?.Status == "live") s.Phase6.Status = "in_progress";
                else s.Phase6.Status = "available";
            }
            else if (isCofounded)
            {
                if (p6.LevelUpTriggered) s.Phase6.Status = "completed";
                else if (p6.SmartMatchmaking?.Status == "live") s.Phase6.Status = "in_progress";
                else s.Phase6.Status = "available";
            }
            else
            {
                s.Phase6.Status = "locked";
            }

            return s;
        }

        private static int DerivePhase2Step(CreatorJourneyProject p, CreatorPhase2Data p2, bool brandingResolved, bool clarified)
        {
            if (!clarified) return 6; // in clarifier
            if (string.IsNullOrEmpty(p.Solution) || string.IsNullOrEmpty(p.Problem)) return 7; // confirm summary
            if (string.IsNullOrWhiteSpace(p.Name)) return 8; // name the concept
            if (!brandingResolved) return 9; // branding decision
            return 12; // ready to complete
        }

        // =================================================================
        // Mutations
        // =================================================================
        public async Task<CreatorJourney> UpdateProjectAsync(string userId, UpdateProjectRequest r, string ideaId = null)
        {
            // Partial update: an empty payload is a caller bug — reject it loudly
            // instead of a silent no-op (also guards the null-body NRE).
            if (r == null || (r.Name == null && r.Tagline == null && r.Concept == null
                && r.TargetUser == null && r.Problem == null && r.Solution == null
                && r.MarketGap == null && r.CreatorEdge == null && r.Category == null
                && r.ExistingAlternatives == null && r.WhyNow == null && r.RiskiestAssumption == null
                && r.TargetMarket == null && r.Geography == null && r.Sector == null && r.Tags == null && !r.ClarityScore.HasValue))
                throw new CreatorJourneyException(400, "Provide at least one field to update.");

            var j = await GetOrCreateAsync(userId);
            var idea = await ResolveIdeaAsync(j, ideaId);
            OverlayIdea(j, idea); // mutation below operates on the IDEA's blocks
            var p = j.Project ??= new CreatorJourneyProject();

            if (r.Name != null)
            {
                var name = r.Name.Trim();
                if (name.Length > 60)
                    throw new CreatorJourneyException(400, "Project name must be 60 characters or fewer.");
                var generic = new[] { "hub", "app", "pro", "platform" };
                if (generic.Contains(name.ToLowerInvariant()))
                    throw new CreatorJourneyException(400, $"\"{name}\" is too generic — choose a distinctive name.");
                p.Name = name;
            }

            if (r.Tagline != null) p.Tagline = r.Tagline;
            if (r.Concept != null) p.Concept = r.Concept;
            if (r.TargetUser != null) p.TargetUser = r.TargetUser;
            if (r.Problem != null) p.Problem = r.Problem;
            if (r.Solution != null) p.Solution = r.Solution;
            if (r.MarketGap != null) p.MarketGap = r.MarketGap;
            if (r.CreatorEdge != null) p.CreatorEdge = r.CreatorEdge;
            if (r.ExistingAlternatives != null) p.ExistingAlternatives = r.ExistingAlternatives;
            if (r.WhyNow != null) p.WhyNow = r.WhyNow;
            if (r.RiskiestAssumption != null) p.RiskiestAssumption = r.RiskiestAssumption;
            if (r.TargetMarket != null) p.TargetMarket = r.TargetMarket;
            if (r.Geography != null) p.Geography = r.Geography;
            if (r.Category != null) p.Category = r.Category;
            if (r.Sector != null) p.Sector = r.Sector;
            if (r.Tags != null) p.Tags = r.Tags;
            if (r.ClarityScore.HasValue) p.ClarityScore = r.ClarityScore.Value;

            await WriteIdeaAsync(idea, Builders<CreatorIdea>.Update.Set(x => x.Project, p));
            return j;
        }

        public async Task<CreatorJourney> SetEntryPathAsync(string userId, string path, string ideaId = null)
        {
            if (path == "needs_discovery")
                throw new CreatorJourneyException(400, "Discovery path is no longer available.");
            if (path != "already_have_idea")
                throw new CreatorJourneyException(400, "Invalid entry path.");

            var j = await GetOrCreateAsync(userId);
            var idea = await ResolveIdeaAsync(j, ideaId);
            OverlayIdea(j, idea);
            (j.Phase2Data ??= new CreatorPhase2Data()).SelectedEntryPath = path;

            await WriteIdeaAsync(idea, Builders<CreatorIdea>.Update.Set(x => x.Phase2Data.SelectedEntryPath, path));
            return j;
        }

        public async Task<CreatorJourney> SetCrossroadsPathAsync(string userId, string path, string ideaId = null)
        {
            // New Creator choices are Full Buyout or Build. Historical
            // "sell_license" records remain readable, but clients cannot select it.
            if (path != "sell" && path != "build")
                throw new CreatorJourneyException(400, "Path must be \"sell\" or \"build\".");

            var j = await GetOrCreateAsync(userId);
            var idea = await ResolveIdeaAsync(j, ideaId);
            OverlayIdea(j, idea);

            // Server-side Phase 4 completion guard:
            var p4 = j.Phase4Data ?? new CreatorPhase4Data();
            var p4Eval = Phase4CompletionResolver.Resolve(p4);
            if (!p4Eval.IsComplete)
                throw new CreatorJourneyException(403, $"Cannot choose crossroads path until Phase 4 is complete. Unresolved stages: {string.Join(", ", p4Eval.UnresolvedStages)}");

            var p5 = j.Phase5Data ??= new CreatorPhase5Data();

            // 30-day switch lock: once a path is chosen, switching is allowed only
            // within the window. After it elapses, the choice is locked.
            if (!string.IsNullOrEmpty(p5.ChosenPath) && p5.ChosenPath != "sell_license" && p5.ChosenPath != path && p5.PathSelectedAt.HasValue)
            {
                if (DateTime.UtcNow - p5.PathSelectedAt.Value > PathSwitchWindow)
                    throw new CreatorJourneyException(403, "Path is locked. Contact support to switch.");
            }

            if (p5.ChosenPath != path)
            {
                p5.ChosenPath = path;
                p5.PathSelectedAt = DateTime.UtcNow;
            }
            await WriteIdeaAsync(idea, Builders<CreatorIdea>.Update.Set(x => x.Phase5Data, p5));
            return j;
        }

        public async Task<CreatorJourney> AppendOutputAsync(string userId, AppendOutputRequest r, string ideaId = null)
        {
            var j = await GetOrCreateAsync(userId);
            var idea = await ResolveIdeaAsync(j, ideaId);
            OverlayIdea(j, idea); // snaps below = the IDEA's version history (source of truth)
            var snaps = j.OutputSnapshots ??= new CreatorOutputSnapshots();

            // Select the in-memory list (updates the returned object + computes Version).
            var list = r.OutputKey switch
            {
                "forecastVersions" => snaps.ForecastVersions,
                "businessPlanVersions" => snaps.BusinessPlanVersions,
                "ipValuationVersions" => snaps.IpValuationVersions,
                "legalChecklistVersions" => snaps.LegalChecklistVersions,
                "formationVersions" => snaps.FormationVersions,
                "pricingVersions" => snaps.PricingVersions,
                "gtmPlanVersions" => snaps.GtmPlanVersions,
                "matchingRuns" => snaps.MatchingRuns,
                _ => throw new CreatorJourneyException(400, $"Unknown outputKey \"{r.OutputKey}\"."),
            };

            var data = r.Payload != null ? BsonDocument.Parse(r.Payload.ToJson()) : null;
            var entry = CreatorJourneyVersioning.Append(list, r.Phase, r.SessionId, data); // newest LAST, own phase

            // Idea = source of truth: atomic typed $push so a concurrent output save
            // can't clobber this entry. The default arm is unreachable (the list switch
            // above already threw) but stays loud so a bad key can never push wrong.
            var ideaUpdate = r.OutputKey switch
            {
                "forecastVersions" => Builders<CreatorIdea>.Update.Push(x => x.OutputSnapshots.ForecastVersions, entry),
                "businessPlanVersions" => Builders<CreatorIdea>.Update.Push(x => x.OutputSnapshots.BusinessPlanVersions, entry),
                "ipValuationVersions" => Builders<CreatorIdea>.Update.Push(x => x.OutputSnapshots.IpValuationVersions, entry),
                "legalChecklistVersions" => Builders<CreatorIdea>.Update.Push(x => x.OutputSnapshots.LegalChecklistVersions, entry),
                "formationVersions" => Builders<CreatorIdea>.Update.Push(x => x.OutputSnapshots.FormationVersions, entry),
                "pricingVersions" => Builders<CreatorIdea>.Update.Push(x => x.OutputSnapshots.PricingVersions, entry),
                "gtmPlanVersions" => Builders<CreatorIdea>.Update.Push(x => x.OutputSnapshots.GtmPlanVersions, entry),
                "matchingRuns" => Builders<CreatorIdea>.Update.Push(x => x.OutputSnapshots.MatchingRuns, entry),
                _ => throw new CreatorJourneyException(400, $"Unknown outputKey \"{r.OutputKey}\"."),
            };
            await WriteIdeaAsync(idea, ideaUpdate);
            return j;
        }

        public async Task<CreatorJourney> AppendChatMessageAsync(string userId, string sender, string text, string ideaId = null)
        {
            if (sender != "ai" && sender != "user")
                throw new CreatorJourneyException(400, "sender must be \"ai\" or \"user\".");

            var j = await GetOrCreateAsync(userId);
            var idea = await ResolveIdeaAsync(j, ideaId);
            OverlayIdea(j, idea);
            var message = new CreatorChatMessage
            {
                Id = ObjectId.GenerateNewId().ToString(),
                Sender = sender,
                Text = text ?? string.Empty,
                Timestamp = DateTime.UtcNow,
            };

            // Idea = source of truth: atomic $push (two concurrent appends both persist).
            await WriteIdeaAsync(idea, Builders<CreatorIdea>.Update.Push(x => x.Phase2Data.ChatMessages, message));

            // Reflect the persisted append on the returned object (unchanged contract).
            var p2 = j.Phase2Data ??= new CreatorPhase2Data();
            p2.ChatMessages ??= new List<CreatorChatMessage>();
            p2.ChatMessages.Add(message);
            return j;
        }

        public async Task<CreatorJourney> ApplyClarifierMappingAsync(
            string userId, string clarifierSessionId, string problem, string targetUser,
            string solution, double clarityScore, List<string> tags, string marketGap = "", string creatorEdge = "",
            string existingAlternatives = "", string whyNow = "", string riskiestAssumption = "", string ideaId = null)
        {
            // Mint/converge semantics: this finalize maps onto the ACTIVE idea (minting
            // the first one for a brand-new user) — an explicit ideaId is meaningless here.
            var j = await GetOrCreateAsync(userId);
            var idea = await ResolveIdeaAsync(j, ideaId);
            OverlayIdea(j, idea);
            var p = j.Project ??= new CreatorJourneyProject();
            CreatorIdeaCoreMapper.ApplyClarifier(
                p, problem, targetUser, solution, clarityScore, tags, marketGap, creatorEdge,
                existingAlternatives, whyNow, riskiestAssumption);

            (j.Phase2Data ??= new CreatorPhase2Data()).ClarifierSessionId = clarifierSessionId;
            // STEP 2 anchor: the (possibly new) clarifier joins this idea; plan/forecast inherit it.
            if (!string.IsNullOrEmpty(clarifierSessionId))
                await _clarifiers.SetBusinessIdeaIdAsync(clarifierSessionId, idea.Id);

            await WriteIdeaAsync(idea, Builders<CreatorIdea>.Update
                .Set(x => x.Project, p)
                .Set(x => x.Phase2Data, j.Phase2Data));
            return j;
        }


        public async Task<CreatorJourney> SetBrandingLogoAsync(
            string userId, string logoAsset, string logoType, string brandingMethod,
            List<string> colorPalette = null, string paletteName = null, string typographyPairing = null,
            string ideaId = null, string designerId = null, string conversationId = null)
        {
            var j = await GetOrCreateAsync(userId);
            var idea = await ResolveIdeaAsync(j, ideaId);
            OverlayIdea(j, idea);
            var b = (j.Project ??= new CreatorJourneyProject()).Branding ??= new CreatorBranding();
            if (logoAsset != null) b.LogoAsset = logoAsset;
            if (logoType != null) b.LogoType = logoType;
            b.BrandingMethod = brandingMethod;
            if (colorPalette != null) b.ColorPalette = colorPalette;
            if (paletteName != null) b.PaletteName = paletteName;
            if (typographyPairing != null) b.TypographyPairing = typographyPairing;
            if (designerId != null)
            {
                b.DesignerId = designerId;
                b.BookedAt = DateTime.UtcNow;
            }
            if (conversationId != null) b.ConversationId = conversationId;

            await WriteIdeaAsync(idea, Builders<CreatorIdea>.Update.Set(x => x.Project.Branding, b));
            return j;
        }


        // ---- Phase 3 deterministic modules ----

        /// <summary>
        /// Backward-compatibility adapter for legacy checklist item updates.
        /// Purely delegates to canonical LegalAssessment logic without independent legacy business rules.
        /// </summary>
        public async Task<CreatorJourney> UpdateLegalChecklistItemAsync(string userId, string itemId, string status, string ideaId = null)
        {
            var j = await GetOrCreateAsync(userId);
            var idea = await ResolveIdeaAsync(j, ideaId);
            OverlayIdea(j, idea);

            // Canonical: delegate directly to LegalAssessment
            if (j.Phase3Data?.LegalAssessment != null)
            {
                return await UpdateLegalAssessmentItemStatusAsync(userId, itemId, status, ideaId);
            }

            // Fallback for legacy documents: migrate checklist items into LegalAssessment container and delegate
            var checklist = j.Phase3Data?.LegalChecklist
                ?? throw new CreatorJourneyException(404, "Legal checklist not generated yet.");

            var migratedAssessment = new CreatorLegalAssessment
            {
                CreatorIdeaId = idea.Id,
                UserId = userId,
                Items = checklist.Items ?? new List<CreatorLegalChecklistItem>(),
                EvaluatedAt = DateTime.UtcNow
            };
            (j.Phase3Data ??= new CreatorPhase3Data()).LegalAssessment = migratedAssessment;
            await WriteIdeaAsync(idea, Builders<CreatorIdea>.Update.Set(x => x.Phase3Data.LegalAssessment, migratedAssessment));

            // Delegate to canonical logic
            return await UpdateLegalAssessmentItemStatusAsync(userId, itemId, status, ideaId);
        }


        public async Task<CreatorJourney> SetLegalAssessmentAsync(string userId, CreatorLegalAssessment assessment, string ideaId = null)
        {
            var j = await GetOrCreateAsync(userId);
            var idea = await ResolveIdeaAsync(j, ideaId);
            OverlayIdea(j, idea);

            var p3 = j.Phase3Data ??= new CreatorPhase3Data();
            p3.LegalAssessment = assessment;

            await WriteIdeaAsync(idea, Builders<CreatorIdea>.Update
                .Set(x => x.Phase3Data.LegalAssessment, assessment));
            return j;
        }

        public async Task<CreatorJourney> UpdateLegalAssessmentItemStatusAsync(string userId, string itemId, string status, string ideaId = null)
        {
            var j = await GetOrCreateAsync(userId);
            var idea = await ResolveIdeaAsync(j, ideaId);
            OverlayIdea(j, idea);

            var assessment = j.Phase3Data?.LegalAssessment;
            if (assessment == null)
                throw new CreatorJourneyException(404, "Legal assessment not generated yet.");

            var item = assessment.Items.FirstOrDefault(i => string.Equals(i.Id, itemId, StringComparison.OrdinalIgnoreCase));
            if (item == null)
                throw new CreatorJourneyException(404, $"Requirement item '{itemId}' not found in assessment.");

            item.Status = status;
            if (LegalItemStatuses.IsCompleted(status))
            {
                item.CompletedAt = DateTime.UtcNow;
            }
            else
            {
                item.CompletedAt = null;
            }

            // Recompute readiness and stage breakdowns
            if (_legalEngine != null)
            {
                assessment.PlanningReadinessPct = _legalEngine.ComputePlanningReadiness(assessment.Items);
            }
            foreach (var breakdown in assessment.StageBreakdown)
            {
                var stageItems = assessment.Items.Where(i => string.Equals(i.Stage, breakdown.Stage, StringComparison.OrdinalIgnoreCase)).ToList();
                breakdown.CompletedCount = stageItems.Count(i => LegalItemStatuses.IsCompleted(i.Status));
            }

            await WriteIdeaAsync(idea, Builders<CreatorIdea>.Update
                .Set(x => x.Phase3Data.LegalAssessment, assessment));
            return j;
        }

        public async Task<CreatorJourney> AttachLegalAssessmentItemEvidenceAsync(string userId, string itemId, string documentId, string status = null, string notes = null, string ideaId = null)
        {
            var j = await GetOrCreateAsync(userId);
            var idea = await ResolveIdeaAsync(j, ideaId);
            OverlayIdea(j, idea);

            var assessment = j.Phase3Data?.LegalAssessment;
            if (assessment == null)
                throw new CreatorJourneyException(404, "Legal assessment not generated yet.");

            var item = assessment.Items.FirstOrDefault(i => string.Equals(i.Id, itemId, StringComparison.OrdinalIgnoreCase));
            if (item == null)
                throw new CreatorJourneyException(404, $"Requirement item '{itemId}' not found in assessment.");

            // Security check: Document must exist on the owned idea
            var doc = idea.Documents?.FirstOrDefault(d => string.Equals(d.Id, documentId, StringComparison.OrdinalIgnoreCase));
            if (doc == null)
                throw new CreatorJourneyException(404, $"Document '{documentId}' not found on this project.");

            item.EvidenceDocumentId = doc.Id;
            item.EvidenceFileName = doc.FileName;

            // Automatically transition status to ready_for_review if not already completed
            if (!LegalItemStatuses.IsCompleted(item.Status))
            {
                item.Status = LegalItemStatuses.ReadyForReview;
            }

            // Record or update LegalEvidenceLink
            var linkStatus = !string.IsNullOrWhiteSpace(status) ? status : LegalEvidenceStatuses.Linked;
            assessment.EvidenceLinks ??= new List<LegalEvidenceLink>();
            var existingLink = assessment.EvidenceLinks.FirstOrDefault(l =>
                string.Equals(l.RequirementId, itemId, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(l.DocumentId, documentId, StringComparison.OrdinalIgnoreCase));

            if (existingLink != null)
            {
                existingLink.Status = linkStatus;
                existingLink.Notes = notes ?? existingLink.Notes;
            }
            else
            {
                assessment.EvidenceLinks.Add(new LegalEvidenceLink
                {
                    DocumentId = doc.Id,
                    DocumentTitle = string.IsNullOrWhiteSpace(doc.Title) ? doc.FileName : doc.Title,
                    DocumentFileName = doc.FileName,
                    MimeType = doc.MimeType,
                    SizeBytes = doc.SizeBytes,
                    RequirementId = item.Id,
                    RequirementTitle = string.IsNullOrWhiteSpace(item.Title) ? item.Label : item.Title,
                    Stage = item.Stage,
                    Status = linkStatus,
                    LinkedAt = DateTime.UtcNow,
                    Notes = notes
                });
            }

            // Append Audit Trail entry
            assessment.EvidenceAuditTrail ??= new List<LegalEvidenceAuditEntry>();
            assessment.EvidenceAuditTrail.Add(new LegalEvidenceAuditEntry
            {
                CreatorIdeaId = idea.Id,
                RequirementId = item.Id,
                RequirementTitle = string.IsNullOrWhiteSpace(item.Title) ? item.Label : item.Title,
                DocumentId = doc.Id,
                DocumentTitle = doc.FileName,
                Action = LegalEvidenceAuditActions.Linked,
                Detail = $"Evidence '{doc.FileName}' linked to requirement '{item.Title ?? item.Label}'.",
                Timestamp = DateTime.UtcNow,
                ActorUserId = userId
            });

            if (_legalEngine != null)
            {
                assessment.PlanningReadinessPct = _legalEngine.ComputePlanningReadiness(assessment.Items);
            }
            foreach (var breakdown in assessment.StageBreakdown)
            {
                var stageItems = assessment.Items.Where(i => string.Equals(i.Stage, breakdown.Stage, StringComparison.OrdinalIgnoreCase)).ToList();
                breakdown.CompletedCount = stageItems.Count(i => LegalItemStatuses.IsCompleted(i.Status));
            }

            await WriteIdeaAsync(idea, Builders<CreatorIdea>.Update
                .Set(x => x.Phase3Data.LegalAssessment, assessment));
            return j;
        }

        public async Task<CreatorJourney> UnlinkLegalAssessmentItemEvidenceAsync(string userId, string itemId, string documentId, string ideaId = null)
        {
            var j = await GetOrCreateAsync(userId);
            var idea = await ResolveIdeaAsync(j, ideaId);
            OverlayIdea(j, idea);

            var assessment = j.Phase3Data?.LegalAssessment;
            if (assessment == null)
                throw new CreatorJourneyException(404, "Legal assessment not generated yet.");

            var item = assessment.Items.FirstOrDefault(i => string.Equals(i.Id, itemId, StringComparison.OrdinalIgnoreCase));
            if (item == null)
                throw new CreatorJourneyException(404, $"Requirement item '{itemId}' not found in assessment.");

            var doc = idea.Documents?.FirstOrDefault(d => string.Equals(d.Id, documentId, StringComparison.OrdinalIgnoreCase));
            var docName = doc?.FileName ?? documentId;

            // Remove link
            if (assessment.EvidenceLinks != null)
            {
                assessment.EvidenceLinks.RemoveAll(l =>
                    string.Equals(l.RequirementId, itemId, StringComparison.OrdinalIgnoreCase) &&
                    string.Equals(l.DocumentId, documentId, StringComparison.OrdinalIgnoreCase));
            }

            // Update item primary evidence reference
            if (string.Equals(item.EvidenceDocumentId, documentId, StringComparison.OrdinalIgnoreCase))
            {
                var remainingLink = assessment.EvidenceLinks?.FirstOrDefault(l =>
                    string.Equals(l.RequirementId, itemId, StringComparison.OrdinalIgnoreCase));

                if (remainingLink != null)
                {
                    item.EvidenceDocumentId = remainingLink.DocumentId;
                    item.EvidenceFileName = remainingLink.DocumentFileName;
                }
                else
                {
                    item.EvidenceDocumentId = null;
                    item.EvidenceFileName = null;
                    // If status was ready_for_review, revert to action_required
                    if (string.Equals(item.Status, LegalItemStatuses.ReadyForReview, StringComparison.OrdinalIgnoreCase))
                    {
                        item.Status = LegalItemStatuses.ActionRequired;
                    }
                }
            }

            // Append Audit Trail entry
            assessment.EvidenceAuditTrail ??= new List<LegalEvidenceAuditEntry>();
            assessment.EvidenceAuditTrail.Add(new LegalEvidenceAuditEntry
            {
                CreatorIdeaId = idea.Id,
                RequirementId = item.Id,
                RequirementTitle = string.IsNullOrWhiteSpace(item.Title) ? item.Label : item.Title,
                DocumentId = documentId,
                DocumentTitle = docName,
                Action = LegalEvidenceAuditActions.Unlinked,
                Detail = $"Evidence '{docName}' unlinked from requirement '{item.Title ?? item.Label}'. Physical file preserved in project vault.",
                Timestamp = DateTime.UtcNow,
                ActorUserId = userId
            });

            if (_legalEngine != null)
            {
                assessment.PlanningReadinessPct = _legalEngine.ComputePlanningReadiness(assessment.Items);
            }
            foreach (var breakdown in assessment.StageBreakdown)
            {
                var stageItems = assessment.Items.Where(i => string.Equals(i.Stage, breakdown.Stage, StringComparison.OrdinalIgnoreCase)).ToList();
                breakdown.CompletedCount = stageItems.Count(i => LegalItemStatuses.IsCompleted(i.Status));
            }

            await WriteIdeaAsync(idea, Builders<CreatorIdea>.Update
                .Set(x => x.Phase3Data.LegalAssessment, assessment));
            return j;
        }

        public async Task<CreatorJourney> UpdateLegalEvidenceStatusAsync(string userId, string linkId, string newStatus, string notes = null, string ideaId = null)
        {
            var j = await GetOrCreateAsync(userId);
            var idea = await ResolveIdeaAsync(j, ideaId);
            OverlayIdea(j, idea);

            var assessment = j.Phase3Data?.LegalAssessment;
            if (assessment == null)
                throw new CreatorJourneyException(404, "Legal assessment not generated yet.");

            var link = assessment.EvidenceLinks?.FirstOrDefault(l => string.Equals(l.Id, linkId, StringComparison.OrdinalIgnoreCase));
            if (link == null)
                throw new CreatorJourneyException(404, $"Evidence link '{linkId}' not found.");

            var oldStatus = link.Status;
            link.Status = newStatus;
            if (notes != null) link.Notes = notes;

            assessment.EvidenceAuditTrail ??= new List<LegalEvidenceAuditEntry>();
            assessment.EvidenceAuditTrail.Add(new LegalEvidenceAuditEntry
            {
                CreatorIdeaId = idea.Id,
                RequirementId = link.RequirementId,
                RequirementTitle = link.RequirementTitle,
                DocumentId = link.DocumentId,
                DocumentTitle = link.DocumentFileName,
                Action = LegalEvidenceAuditActions.StatusChanged,
                Detail = $"Evidence status changed from '{oldStatus}' to '{newStatus}'.",
                Timestamp = DateTime.UtcNow,
                ActorUserId = userId
            });

            await WriteIdeaAsync(idea, Builders<CreatorIdea>.Update
                .Set(x => x.Phase3Data.LegalAssessment, assessment));
            return j;
        }

        public async Task<CreatorJourney> ReplaceLegalEvidenceAsync(string userId, string oldLinkId, string newDocumentId, string notes = null, string ideaId = null)
        {
            var j = await GetOrCreateAsync(userId);
            var idea = await ResolveIdeaAsync(j, ideaId);
            OverlayIdea(j, idea);

            var assessment = j.Phase3Data?.LegalAssessment;
            if (assessment == null)
                throw new CreatorJourneyException(404, "Legal assessment not generated yet.");

            var oldLink = assessment.EvidenceLinks?.FirstOrDefault(l => string.Equals(l.Id, oldLinkId, StringComparison.OrdinalIgnoreCase));
            if (oldLink == null)
                throw new CreatorJourneyException(404, $"Old evidence link '{oldLinkId}' not found.");

            var newDoc = idea.Documents?.FirstOrDefault(d => string.Equals(d.Id, newDocumentId, StringComparison.OrdinalIgnoreCase));
            if (newDoc == null)
                throw new CreatorJourneyException(404, $"New document '{newDocumentId}' not found in project vault.");

            var item = assessment.Items.FirstOrDefault(i => string.Equals(i.Id, oldLink.RequirementId, StringComparison.OrdinalIgnoreCase));
            if (item == null)
                throw new CreatorJourneyException(404, $"Requirement item '{oldLink.RequirementId}' not found in assessment.");

            // 1. Mark old link as Replaced
            oldLink.Status = LegalEvidenceStatuses.Replaced;

            // 2. Create new link
            var newLink = new LegalEvidenceLink
            {
                DocumentId = newDoc.Id,
                DocumentTitle = newDoc.Title ?? newDoc.FileName,
                DocumentFileName = newDoc.FileName,
                MimeType = newDoc.MimeType ?? "application/octet-stream",
                SizeBytes = newDoc.SizeBytes,
                RequirementId = item.Id,
                RequirementTitle = string.IsNullOrWhiteSpace(item.Title) ? item.Label : item.Title,
                Stage = item.Stage,
                Status = LegalEvidenceStatuses.Linked,
                LinkedAt = DateTime.UtcNow,
                Notes = notes
            };
            assessment.EvidenceLinks ??= new List<LegalEvidenceLink>();
            assessment.EvidenceLinks.Add(newLink);

            // 3. Update primary item reference to new document
            item.EvidenceDocumentId = newDoc.Id;
            item.EvidenceFileName = newDoc.FileName;

            // 4. Append audit trail entry for replacement
            assessment.EvidenceAuditTrail ??= new List<LegalEvidenceAuditEntry>();
            assessment.EvidenceAuditTrail.Add(new LegalEvidenceAuditEntry
            {
                CreatorIdeaId = idea.Id,
                RequirementId = item.Id,
                RequirementTitle = string.IsNullOrWhiteSpace(item.Title) ? item.Label : item.Title,
                DocumentId = newDoc.Id,
                DocumentTitle = newDoc.FileName,
                Action = LegalEvidenceAuditActions.Replaced,
                Detail = $"Replaced evidence '{oldLink.DocumentFileName}' with new file '{newDoc.FileName}'. Previous document preserved in vault.",
                Timestamp = DateTime.UtcNow,
                ActorUserId = userId
            });

            await WriteIdeaAsync(idea, Builders<CreatorIdea>.Update
                .Set(x => x.Phase3Data.LegalAssessment, assessment));
            return j;
        }

        public async Task<CreatorJourney> SetFormationAsync(string userId, CreatorFormationGenerator formation, string ideaId = null)
        {
            var j = await GetOrCreateAsync(userId);
            var idea = await ResolveIdeaAsync(j, ideaId);
            OverlayIdea(j, idea);
            (j.Phase3Data ??= new CreatorPhase3Data()).FormationGenerator = formation;

            var entry = CreatorJourneyVersioning.Append(
                (j.OutputSnapshots ??= new CreatorOutputSnapshots()).FormationVersions,
                3, null, formation.ToBsonDocument());

            await WriteIdeaAsync(idea, Builders<CreatorIdea>.Update
                .Set(x => x.Phase3Data.FormationGenerator, formation)
                .Push(x => x.OutputSnapshots.FormationVersions, entry));
            return j;
        }

        public async Task<CreatorJourney> SelectFormationTypeAsync(string userId, string selectedType, string ideaId = null)
        {
            if (selectedType != "SAS" && selectedType != "SARL" && selectedType != "SAS-U")
                throw new CreatorJourneyException(400, "selectedType must be SAS | SARL | SAS-U.");

            var j = await GetOrCreateAsync(userId);
            var idea = await ResolveIdeaAsync(j, ideaId);
            OverlayIdea(j, idea);
            var formation = j.Phase3Data?.FormationGenerator
                ?? throw new CreatorJourneyException(404, "Formation not generated yet.");
            
            bool isOverride = !string.IsNullOrEmpty(selectedType) &&
                              !string.Equals(selectedType, formation.RecommendedType, StringComparison.OrdinalIgnoreCase);

            formation.SelectedType = selectedType;
            formation.IsOverride = isOverride;

            var ideaUpdate = Builders<CreatorIdea>.Update
                .Set(x => x.Phase3Data.FormationGenerator.SelectedType, selectedType)
                .Set(x => x.Phase3Data.FormationGenerator.IsOverride, isOverride);

            // Canonical: update company-type item in LegalAssessment if present (0 new writers to LegalChecklist)
            var assessmentItem = j.Phase3Data.LegalAssessment?.Items?.FirstOrDefault(i => i.Id == "company-type");
            if (assessmentItem != null)
            {
                assessmentItem.Status = "done";
                assessmentItem.CompletedAt = DateTime.UtcNow;
                if (_legalEngine != null)
                {
                    j.Phase3Data.LegalAssessment.PlanningReadinessPct = _legalEngine.ComputePlanningReadiness(j.Phase3Data.LegalAssessment.Items);
                }
                ideaUpdate = ideaUpdate.Set(x => x.Phase3Data.LegalAssessment, j.Phase3Data.LegalAssessment);
            }

            await WriteIdeaAsync(idea, ideaUpdate);
            return j;
        }

        // 3.5b: persist self-declared skills + derived gaps + optional co-founder draft.
        // Targeted atomic $set/$push (single UpdateOneAsync) — no full-document replace, so a
        // concurrent write can't clobber it. Sets SkillsDeclared=true (direction B of the
        // clobber guard: declaration always supersedes the ExtractStrengths echo).
        public async Task<CreatorJourney> DeclareFormationSkillsAsync(
            string userId, List<string> youHave, List<CreatorSkillGap> youNeed,
            List<string> matchedSpIds, CreatorCofounderDraft cofounder, string ideaId = null)
        {
            var j = await GetOrCreateAsync(userId);
            var idea = await ResolveIdeaAsync(j, ideaId);
            OverlayIdea(j, idea);
            var formation = j.Phase3Data?.FormationGenerator
                ?? throw new CreatorJourneyException(404, "Formation not generated yet.");

            // Reflect on the in-memory object (returned to the caller + version snapshot).
            formation.YouHave = youHave;
            formation.YouNeed = youNeed;
            formation.MatchedSpIds = matchedSpIds;
            formation.SkillsDeclared = true;
            if (cofounder != null) formation.CofounderDraft = cofounder;

            var entry = CreatorJourneyVersioning.Append(
                (j.OutputSnapshots ??= new CreatorOutputSnapshots()).FormationVersions, 3, null,
                formation.ToBsonDocument());

            var ideaUpdate = Builders<CreatorIdea>.Update
                .Set(x => x.Phase3Data.FormationGenerator.YouHave, youHave)
                .Set(x => x.Phase3Data.FormationGenerator.YouNeed, youNeed)
                .Set(x => x.Phase3Data.FormationGenerator.MatchedSpIds, matchedSpIds)
                .Set(x => x.Phase3Data.FormationGenerator.SkillsDeclared, true)
                .Push(x => x.OutputSnapshots.FormationVersions, entry);
            if (cofounder != null)
                ideaUpdate = ideaUpdate.Set(x => x.Phase3Data.FormationGenerator.CofounderDraft, cofounder);
            await WriteIdeaAsync(idea, ideaUpdate);
            return j;
        }

        public async Task<CreatorJourney> SetPhase3SessionAsync(string userId, string kind, string sessionId, string ideaId = null)
        {
            if (string.IsNullOrWhiteSpace(sessionId))
                throw new CreatorJourneyException(400, "sessionId is required.");

            var j = await GetOrCreateAsync(userId);
            var idea = await ResolveIdeaAsync(j, ideaId);
            OverlayIdea(j, idea);
            var p3 = j.Phase3Data ??= new CreatorPhase3Data();
            var snaps = j.OutputSnapshots ??= new CreatorOutputSnapshots();

            // Atomic targeted update: $set only the ONE session-id field + $push its
            // version entry, so a concurrent forecast/businessPlan start can't clobber
            // the sibling session id. Idea = the only write target.
            UpdateDefinition<CreatorIdea> ideaUpdate;
            switch (kind)
            {
                case "marketStudy":
                    p3.MarketStudySessionId = sessionId;
                    ideaUpdate = Builders<CreatorIdea>.Update
                        .Set(x => x.Phase3Data.MarketStudySessionId, sessionId);
                    break;
                case "businessModel":
                    p3.BusinessModelSessionId = sessionId;
                    ideaUpdate = Builders<CreatorIdea>.Update
                        .Set(x => x.Phase3Data.BusinessModelSessionId, sessionId);
                    break;
                case "forecast":
                    p3.ForecastSessionId = sessionId;
                    ideaUpdate = Builders<CreatorIdea>.Update
                        .Set(x => x.Phase3Data.ForecastSessionId, sessionId)
                        .Push(x => x.OutputSnapshots.ForecastVersions,
                              CreatorJourneyVersioning.Append(snaps.ForecastVersions, 3, sessionId, null));
                    break;
                case "businessPlan":
                    p3.BusinessPlanSessionId = sessionId;
                    ideaUpdate = Builders<CreatorIdea>.Update
                        .Set(x => x.Phase3Data.BusinessPlanSessionId, sessionId)
                        .Push(x => x.OutputSnapshots.BusinessPlanVersions,
                              CreatorJourneyVersioning.Append(snaps.BusinessPlanVersions, 3, sessionId, null));
                    break;
                default:
                    throw new CreatorJourneyException(400, "kind must be \"marketStudy\", \"businessModel\", \"forecast\", or \"businessPlan\".");
            }

            await WriteIdeaAsync(idea, ideaUpdate);
            return j;
        }

        public async Task<CreatorJourney> SetInvestorReadinessAsync(string userId, CreatorInvestorReadinessScore score, string ideaId = null)
        {
            var j = await GetOrCreateAsync(userId);
            var idea = await ResolveIdeaAsync(j, ideaId);
            OverlayIdea(j, idea);
            (j.Phase3Data ??= new CreatorPhase3Data()).InvestorReadinessScore = score;

            await WriteIdeaAsync(idea, Builders<CreatorIdea>.Update.Set(x => x.Phase3Data.InvestorReadinessScore, score));
            return j;
        }

        // ---- Phase 4 (Construction Engine) ----

        public async Task<CreatorJourney> SetPhase4ConstructionSnapshotAsync(string userId, Models.DatabaseModels.Phase4.ConstructionSnapshot snapshot, Models.DatabaseModels.Phase4.Phase4SourceVersions sourceVersions, string ideaId = null)
        {
            var j = await GetOrCreateAsync(userId);
            var idea = await ResolveIdeaAsync(j, ideaId);
            OverlayIdea(j, idea);
            var p4 = j.Phase4Data ??= new CreatorPhase4Data();
            p4.ConstructionSnapshot = snapshot;
            p4.SourceVersions = sourceVersions;

            await WriteIdeaAsync(idea, Builders<CreatorIdea>.Update
                .Set(x => x.Phase4Data.ConstructionSnapshot, snapshot)
                .Set(x => x.Phase4Data.SourceVersions, sourceVersions));
            return j;
        }

        public async Task<CreatorJourney> SetPhase4RoadmapAsync(string userId, Models.DatabaseModels.Phase4.OperationalRoadmap roadmap, string ideaId = null)
        {
            var j = await GetOrCreateAsync(userId);
            var idea = await ResolveIdeaAsync(j, ideaId);
            OverlayIdea(j, idea);
            var p4 = j.Phase4Data ??= new CreatorPhase4Data();
            p4.Roadmap = roadmap;

            await WriteIdeaAsync(idea, Builders<CreatorIdea>.Update
                .Set(x => x.Phase4Data.Roadmap, roadmap));
            return j;
        }

        public async Task<CreatorJourney> SetPhase4NeedsAnalysisAsync(string userId, Models.DatabaseModels.Phase4.NeedsAnalysis needsAnalysis, string ideaId = null)
        {
            var j = await GetOrCreateAsync(userId);
            var p4 = j.Phase4Data ??= new CreatorPhase4Data();
            p4.NeedsAnalysis = needsAnalysis;

            // Single source of truth: Persisted on CreatorJourney, NO dual write to CreatorIdea
            await _context.CreatorJourneys.UpdateOneAsync(
                f => f.Id == j.Id,
                Builders<CreatorJourney>.Update
                    .Set(x => x.Phase4Data.NeedsAnalysis, needsAnalysis)
                    .Set(x => x.UpdatedAt, DateTime.UtcNow));
            return j;
        }

        public async Task<CreatorJourney> SetPhase4SkillsPlanAsync(string userId, Models.DatabaseModels.Phase4.SkillsPlan skillsPlan, string ideaId = null)
        {
            var j = await GetOrCreateAsync(userId);
            var p4 = j.Phase4Data ??= new CreatorPhase4Data();
            p4.SkillsPlan = skillsPlan;

            // Single source of truth: Persisted on CreatorJourney, NO dual write to CreatorIdea
            await _context.CreatorJourneys.UpdateOneAsync(
                f => f.Id == j.Id,
                Builders<CreatorJourney>.Update
                    .Set(x => x.Phase4Data.SkillsPlan, skillsPlan)
                    .Set(x => x.UpdatedAt, DateTime.UtcNow));
            return j;
        }

        public async Task<CreatorJourney> SetPhase4SupportPlanAsync(string userId, Models.DatabaseModels.Phase4.SupportPlan supportPlan, string ideaId = null)
        {
            var j = await GetOrCreateAsync(userId);
            var p4 = j.Phase4Data ??= new CreatorPhase4Data();
            p4.SupportPlan = supportPlan;

            // Single source of truth: Persisted on CreatorJourney, NO dual write to CreatorIdea
            await _context.CreatorJourneys.UpdateOneAsync(
                f => f.Id == j.Id,
                Builders<CreatorJourney>.Update
                    .Set(x => x.Phase4Data.SupportPlan, supportPlan)
                    .Set(x => x.UpdatedAt, DateTime.UtcNow));
            return j;
        }

        public async Task<CreatorJourney> SetPhase4PricingStrategyAsync(string userId, Models.DatabaseModels.Phase4.PricingStrategy pricingStrategy, string ideaId = null)
        {
            var j = await GetOrCreateAsync(userId);
            var p4 = j.Phase4Data ??= new CreatorPhase4Data();
            p4.PricingStrategy = pricingStrategy;

            // Single source of truth: Persisted on CreatorJourney, NO dual write to CreatorIdea
            await _context.CreatorJourneys.UpdateOneAsync(
                f => f.Id == j.Id,
                Builders<CreatorJourney>.Update
                    .Set(x => x.Phase4Data.PricingStrategy, pricingStrategy)
                    .Set(x => x.UpdatedAt, DateTime.UtcNow));
            return j;
        }

        public async Task<CreatorJourney> SetPhase4GtmStrategyAsync(string userId, Models.DatabaseModels.Phase4.GtmStrategy gtmStrategy, string ideaId = null)
        {
            var j = await GetOrCreateAsync(userId);
            var p4 = j.Phase4Data ??= new CreatorPhase4Data();
            p4.GtmStrategy = gtmStrategy;

            // Single source of truth: Persisted on CreatorJourney, NO dual write to CreatorIdea
            await _context.CreatorJourneys.UpdateOneAsync(
                f => f.Id == j.Id,
                Builders<CreatorJourney>.Update
                    .Set(x => x.Phase4Data.GtmStrategy, gtmStrategy)
                    .Set(x => x.UpdatedAt, DateTime.UtcNow));
            return j;
        }

        // ---- Phase 5 ----

        public async Task<CreatorJourney> SetIpValuationAsync(string userId, CreatorIpValuation valuation, string ideaId = null)
        {
            var j = await GetOrCreateAsync(userId);
            var idea = await ResolveIdeaAsync(j, ideaId);
            OverlayIdea(j, idea);
            var pathA = (j.Phase5Data ??= new CreatorPhase5Data()).PathA ??= new CreatorPathA();
            pathA.IpValuation = valuation;
            var entry = CreatorJourneyVersioning.Append(
                (j.OutputSnapshots ??= new CreatorOutputSnapshots()).IpValuationVersions, 5, null,
                valuation?.ToBsonDocument());

            await WriteIdeaAsync(idea, Builders<CreatorIdea>.Update
                .Set(x => x.Phase5Data.PathA, pathA)
                .Push(x => x.OutputSnapshots.IpValuationVersions, entry));
            return j;
        }

        public async Task<CreatorJourney> SetMarketplaceListingAsync(string userId, CreatorMarketplaceListing listing, List<string> matchedBuyerIds, string ideaId = null)
        {
            var j = await GetOrCreateAsync(userId);
            var idea = await ResolveIdeaAsync(j, ideaId);
            OverlayIdea(j, idea);
            var pathA = (j.Phase5Data ??= new CreatorPhase5Data()).PathA ??= new CreatorPathA();
            pathA.MarketplaceListing = listing;
            if (matchedBuyerIds != null) pathA.MatchedBuyerIds = matchedBuyerIds;

            await WriteIdeaAsync(idea, Builders<CreatorIdea>.Update.Set(x => x.Phase5Data.PathA, pathA));
            return j;
        }

        public async Task<CreatorJourney> SetCompanyFormationAsync(string userId, CreatorCompanyFormation formation, string ideaId = null)
        {
            var j = await GetOrCreateAsync(userId);
            var idea = await ResolveIdeaAsync(j, ideaId);
            OverlayIdea(j, idea);
            var pathB = (j.Phase5Data ??= new CreatorPhase5Data()).PathB ??= new CreatorPathB();
            pathB.CompanyFormation = formation;

            await WriteIdeaAsync(idea, Builders<CreatorIdea>.Update.Set(x => x.Phase5Data.PathB, pathB));
            return j;
        }

        public async Task<CreatorJourney> SetSeedFundingAsync(string userId, CreatorSeedFunding seedFunding, string companyId, string ideaId = null)
        {
            var j = await GetOrCreateAsync(userId);
            var idea = await ResolveIdeaAsync(j, ideaId);
            OverlayIdea(j, idea);
            var p5 = j.Phase5Data ??= new CreatorPhase5Data();
            var pathB = p5.PathB ??= new CreatorPathB();
            pathB.SeedFunding = seedFunding;
            p5.CompletedAt = DateTime.UtcNow;            // starts the 72h switch-lock clock
            if (!string.IsNullOrEmpty(companyId)) j.CompanyId = companyId; // R10: journey-level company link (user-level, not per-idea)

            await WriteIdeaAsync(idea, Builders<CreatorIdea>.Update.Set(x => x.Phase5Data, p5));
            // CompanyId is USER-LEVEL (survives mirror removal) — targeted $set, never a
            // phase-block write. Only fires when a company link actually exists.
            if (!string.IsNullOrEmpty(companyId))
                await _context.CreatorJourneys.UpdateOneAsync(
                    f => f.Id == j.Id,
                    Builders<CreatorJourney>.Update
                        .Set(x => x.CompanyId, companyId)
                        .Set(x => x.UpdatedAt, DateTime.UtcNow));
            return j;
        }
    }
}
