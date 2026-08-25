using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Interface;
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
        // Multi-idea STEP 2: mint the per-idea document at Phase-2 finalize and stamp the
        // anchoring clarifier. Additive — nothing reads CreatorIdeas / the anchor yet.
        private readonly ICreatorIdeaStore _creatorIdeas;
        private readonly IClarifierSessionStore _clarifiers;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private static readonly TimeSpan PathSwitchWindow = TimeSpan.FromHours(72);

        // Legacy Path-A value, retired in P1.10. Centralized here so the one-time
        // read-coercion is the ONLY reference to it; no consumer branches on it.
        private const string LegacyPathAlias = "buyout";

        public CreatorJourneyService(
            MongoDbContext context,
            IBusinessPlanSessionStore businessPlans,
            IForecastSessionStore forecasts,
            ICreatorIdeaStore creatorIdeas,
            IClarifierSessionStore clarifiers,
            IHttpContextAccessor httpContextAccessor = null)
        {
            _context = context;
            _businessPlans = businessPlans;
            _forecasts = forecasts;
            _creatorIdeas = creatorIdeas;
            _clarifiers = clarifiers;
            _httpContextAccessor = httpContextAccessor;
        }

        // =================================================================
        // STEP 4 CUTOVER — per-idea resolution + dual-write plumbing.
        // The IDEA document is the source of truth; every write mirrors to the
        // journey (MIRROR — remove in/before step 6: mirroring is undefined once a
        // user has two ideas). Reads come from the idea via the composed view.
        // =================================================================

        /// <summary>
        /// Resolve the caller's idea. An explicit id must be owned by the caller.
        /// ActiveIdeaId remains a navigation preference only.
        /// No id → the active idea; a stale pointer repoints to the most recent idea;
        /// no ideas at all → mint the first from the journey's inline blocks.
        /// Persists any pointer change atomically and reflects it on the in-memory j.
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
                // Stale pointer — fall through to recovery.
            }

            var existing = await _creatorIdeas.ListByUserAsync(j.UserId);
            if (existing.Count > 0)
            {
                await SetActiveIdeaPointerAsync(j, existing[0].Id);
                return existing[0];
            }

            var idea = new CreatorIdea
            {
                UserId = j.UserId,
                Status = "active",
                Project = j.Project ?? new CreatorJourneyProject(),
                Phase2Data = j.Phase2Data ?? new CreatorPhase2Data(),
                Phase3Data = j.Phase3Data ?? new CreatorPhase3Data(),
                Phase4Data = j.Phase4Data ?? new CreatorPhase4Data(),
                Phase5Data = j.Phase5Data ?? new CreatorPhase5Data(),
                SmartMatchmaking = j.Phase6Data?.SmartMatchmaking ?? new CreatorSmartMatchmaking(),
                OutputSnapshots = j.OutputSnapshots ?? new CreatorOutputSnapshots(),
            };
            await _creatorIdeas.AddAsync(idea); // ObjectId id assigned on insert
            await SetActiveIdeaPointerAsync(j, idea.Id);
            return idea;
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
            j.Project = idea.Project ??= new CreatorJourneyProject();
            j.Phase2Data = idea.Phase2Data ??= new CreatorPhase2Data();
            j.Phase3Data = idea.Phase3Data ??= new CreatorPhase3Data();
            j.Phase4Data = idea.Phase4Data ??= new CreatorPhase4Data();
            j.Phase5Data = idea.Phase5Data ??= new CreatorPhase5Data();
            var p6 = j.Phase6Data ??= new CreatorPhase6Data();
            p6.SmartMatchmaking = idea.SmartMatchmaking ??= new CreatorSmartMatchmaking();
            // Phase 6 is PER-IDEA (step 6iii): only THE leveled-up idea shows Level-Up
            // completion — the user's other ideas never inherit it. Strict equality:
            // the step-1 backfill guarantees LeveledUpIdeaId for every leveled-up user.
            p6.LevelUpTriggered = !string.IsNullOrEmpty(j.LeveledUpIdeaId) && j.LeveledUpIdeaId == idea.Id;
            j.OutputSnapshots = idea.OutputSnapshots ??= new CreatorOutputSnapshots();
            j.IdeaVersion = idea.Version > 0 ? idea.Version : 1;
            return j;
        }

        /// <summary>Targeted optimistic write on the per-idea source of truth.</summary>
        private async Task WriteIdeaAsync(CreatorIdea idea, UpdateDefinition<CreatorIdea> update)
        {
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
            var idea = await ResolveIdeaAsync(j, ideaId);
            return OverlayIdea(j, idea);
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
            bool clarified = p.ClarityScore > 0 && !string.IsNullOrEmpty(p2.ClarifierSessionId);

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
            bool planStarted = !string.IsNullOrEmpty(p3.BusinessPlanSessionId);
            bool forecastStarted = !string.IsNullOrEmpty(p3.ForecastSessionId);
            var planSession = planStarted ? await _businessPlans.GetOwnedAsync(p3.BusinessPlanSessionId, j.UserId) : null;
            var forecastSession = forecastStarted ? await _forecasts.GetOwnedAsync(p3.ForecastSessionId, j.UserId) : null;
            // Shared predicate (AiSessionSuccess) — the masterplan endpoint uses the
            // SAME rule, so the engine and the endpoint cannot drift.
            bool hasPlan = planSession != null
                && WebApp.Services.Ai.AiSessionSuccess.IsComplete(planSession.Status, planSession.CurrentVersion);
            bool hasForecast = forecastSession != null
                && WebApp.Services.Ai.AiSessionSuccess.IsComplete(forecastSession.Status, forecastSession.CurrentVersion);
            // Legal checklist is ADVISORY: it never gates Phase-3 completion. The items
            // are pure self-attestation (checkbox cycling, no verification), so requiring
            // them added friction, not assurance. `legalPresent` (checklist generated)
            // still marks "in progress"; completion needs plan + forecast + formation only.
            bool legalPresent = p3.LegalChecklist != null;
            bool hasFormation = p3.FormationGenerator != null;
            bool anyP3 = planStarted || forecastStarted || legalPresent || hasFormation;

            if (!p2Done) s.Phase3.Status = "locked";
            else if (hasForecast && hasPlan && hasFormation) s.Phase3.Status = "completed";
            else if (anyP3) s.Phase3.Status = "in_progress";
            else s.Phase3.Status = "available";
            // Step order: business plan (2) → forecast (3) → legal (4) → formation (5) → complete (6).
            // Success-gated hasPlan/hasForecast; legal is advisory, so the cursor points at
            // compliance only until the checklist is generated — outstanding items never trap it.
            s.Phase3.CurrentStep = !hasPlan ? 2 : !hasForecast ? 3 : !legalPresent ? 4 : !hasFormation ? 5 : 6;

            bool p3Done = s.Phase3.Status == "completed";

            // ---- Phase 4 ----
            var p4 = j.Phase4Data ?? new CreatorPhase4Data();
            bool hasPricing = !string.IsNullOrEmpty(p4.PricingModel) && (p4.Tiers?.Count ?? 0) >= 3;
            bool hasResource = p4.ResourceCalculation != null;
            bool hasGtm = p4.GtmSetup != null;
            bool anyP4 = hasPricing || hasResource || hasGtm || (p4.Tiers?.Count ?? 0) > 0;

            if (!p3Done) s.Phase4.Status = "locked";
            else if (hasPricing && hasResource && hasGtm) s.Phase4.Status = "completed";
            else if (anyP4) s.Phase4.Status = "in_progress";
            else s.Phase4.Status = "available";
            s.Phase4.CurrentStep = !hasPricing ? 1 : !hasResource ? 2 : !hasGtm ? 3 : 4;

            bool p4Done = s.Phase4.Status == "completed";

            // ---- Phase 5 ----
            var p5 = j.Phase5Data ?? new CreatorPhase5Data();
            bool chosen = !string.IsNullOrEmpty(p5.ChosenPath);
            bool listingLive = p5.PathA?.MarketplaceListing?.Status == "live";
            bool seedPresent = p5.PathB?.SeedFunding != null;

            if (!p4Done) s.Phase5.Status = "locked";
            else if (chosen && (listingLive || seedPresent)) s.Phase5.Status = "completed";
            else if (chosen) s.Phase5.Status = "in_progress";
            else s.Phase5.Status = "available";

            bool p5Done = s.Phase5.Status == "completed";

            // ---- Phase 6 (Build path only) ----
            var p6 = j.Phase6Data ?? new CreatorPhase6Data();
            if (!p5Done) s.Phase6.Status = "locked";
            else if (p5.ChosenPath != "build") s.Phase6.Status = "locked"; // only Build unlocks matchmaking
            else if (p6.LevelUpTriggered) s.Phase6.Status = "completed";
            else if (p6.SmartMatchmaking?.Status == "live") s.Phase6.Status = "in_progress";
            else s.Phase6.Status = "available";

            return s;
        }

        // Phase 2 step derivation.
        //   2=discovery form, 3=ai-processing, 4=idea-cards, 5=idea-confirm,
        //   6=clarifier, 7=idea-summary, 8=concept-name, 9=branding,
        //   10=hire-designer, 11=logo-tool, 12=complete.
        // Discovery steps 3–5 (2C-2) are derived from the persisted Discovery
        // working-state (DiscoveryInputs/GeneratedConcepts/SelectedConceptId), but only
        // for a user actually on the Discovery path. The reliable discriminator is
        // SelectedEntryPath: the backend only ever stores "already_have_idea" (Path-B);
        // Discovery leaves it null. We gate on "NOT Path-B" so that a path-switcher —
        // someone who tried Discovery (leaving stale DiscoveryInputs/GeneratedConcepts)
        // then chose already-have-idea and is now clarifying — is NOT pulled back into
        // Discovery by that stale data; they correctly derive to 6 (clarifier). Once
        // clarified, both entry paths converge into the shared 6+ tail below. Step 2
        // (blank discovery form) persists no data, so it is not field-derivable — such a
        // user resolves to the entry/Smart Gate; the field-derivable range here is 3–5.
        private static int DerivePhase2Step(CreatorJourneyProject p, CreatorPhase2Data p2, bool brandingResolved, bool clarified)
        {
            if (!clarified)
            {
                // Discovery steps apply only when the user is NOT on Path-B. Path-B is
                // positively identified by SelectedEntryPath == "already_have_idea".
                bool onPathB = p2.SelectedEntryPath == "already_have_idea";
                if (!onPathB)
                {
                    // Discovery working-state, newest signal first.
                    if (!string.IsNullOrWhiteSpace(p2.SelectedConceptId)) return 5;  // concept picked → confirm
                    if ((p2.GeneratedConcepts?.Count ?? 0) > 0) return 4;            // concepts ready → pick
                    if (p2.DiscoveryInputs != null) return 3;                        // inputs saved → generating
                }
                return 6;                                                            // Path-B / no Discovery → clarifying
            }
            if (string.IsNullOrEmpty(p.Solution) || string.IsNullOrEmpty(p.Problem)) return 7; // confirm summary
            if (string.IsNullOrWhiteSpace(p.Name)) return 8;            // name the concept
            if (!brandingResolved) return 9;                            // branding decision
            return 12;                                                  // ready to complete
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
            var p5 = j.Phase5Data ??= new CreatorPhase5Data();

            // 72-hour switch lock: once a path is chosen, switching is allowed only
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

        // Discovery convergence: map a confirmed Discovery concept onto the project and
        // link the concept-seeded clarifier session (created by the finalize-discovery
        // endpoint) so the shared tail + Phase 3 prerequisite are satisfied WITHOUT the
        // clarifier Q&A. Mirrors ApplyClarifierMappingAsync but also sets Concept/Category
        // (which the concept carries) in a single write. Path-B's mapping is untouched.
        public async Task<CreatorJourney> ApplyDiscoveryMappingAsync(
            string userId, string clarifierSessionId, CreatorDiscoveryConcept concept, string ideaId = null)
        {
            // Mint/converge semantics — same active-idea convergence as the clarifier path,
            // so discovery-then-clarify (either order) lands on exactly ONE idea.
            var j = await GetOrCreateAsync(userId);
            var idea = await ResolveIdeaAsync(j, ideaId);
            OverlayIdea(j, idea);
            var p = j.Project ??= new CreatorJourneyProject();
            CreatorIdeaCoreMapper.ApplyDiscovery(p, concept);

            (j.Phase2Data ??= new CreatorPhase2Data()).ClarifierSessionId = clarifierSessionId;
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
            string ideaId = null)
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

            await WriteIdeaAsync(idea, Builders<CreatorIdea>.Update.Set(x => x.Project.Branding, b));
            return j;
        }

        // ---- Discovery path working state (independent, targeted $set writes) ----

        public async Task<CreatorJourney> SetDiscoveryInputsAsync(string userId, CreatorDiscoveryInputs inputs, string ideaId = null)
        {
            if (inputs == null)
                throw new CreatorJourneyException(400, "inputs is required.");

            var j = await GetOrCreateAsync(userId);
            var idea = await ResolveIdeaAsync(j, ideaId);
            OverlayIdea(j, idea);
            j.Phase2Data ??= new CreatorPhase2Data();
            j.Phase2Data.DiscoveryInputs = inputs;

            await WriteIdeaAsync(idea, Builders<CreatorIdea>.Update.Set(x => x.Phase2Data.DiscoveryInputs, inputs));
            return j;
        }

        public async Task<CreatorJourney> SetGeneratedConceptsAsync(string userId, List<CreatorDiscoveryConcept> concepts, string ideaId = null)
        {
            if (concepts == null)
                throw new CreatorJourneyException(400, "concepts is required.");

            var j = await GetOrCreateAsync(userId);
            var idea = await ResolveIdeaAsync(j, ideaId);
            OverlayIdea(j, idea);
            j.Phase2Data ??= new CreatorPhase2Data();
            j.Phase2Data.GeneratedConcepts = concepts;

            await WriteIdeaAsync(idea, Builders<CreatorIdea>.Update.Set(x => x.Phase2Data.GeneratedConcepts, concepts));
            return j;
        }

        public async Task<CreatorJourney> SetSelectedConceptIdAsync(string userId, string conceptId, string ideaId = null)
        {
            if (string.IsNullOrWhiteSpace(conceptId))
                throw new CreatorJourneyException(400, "conceptId is required.");

            var j = await GetOrCreateAsync(userId);
            var idea = await ResolveIdeaAsync(j, ideaId);
            OverlayIdea(j, idea);
            j.Phase2Data ??= new CreatorPhase2Data();
            j.Phase2Data.SelectedConceptId = conceptId;

            await WriteIdeaAsync(idea, Builders<CreatorIdea>.Update.Set(x => x.Phase2Data.SelectedConceptId, conceptId));
            return j;
        }

        // ---- Phase 3 deterministic modules ----

        public async Task<CreatorJourney> SetLegalChecklistAsync(string userId, CreatorLegalChecklist checklist, string ideaId = null)
        {
            var j = await GetOrCreateAsync(userId);
            var idea = await ResolveIdeaAsync(j, ideaId);
            OverlayIdea(j, idea);
            checklist.TotalCount = checklist.Items?.Count ?? 0;
            checklist.CompletedCount = checklist.Items?.Count(i => i.Status == "done") ?? 0;
            (j.Phase3Data ??= new CreatorPhase3Data()).LegalChecklist = checklist;

            var entry = CreatorJourneyVersioning.Append(
                (j.OutputSnapshots ??= new CreatorOutputSnapshots()).LegalChecklistVersions,
                3, null, checklist.ToBsonDocument());

            await WriteIdeaAsync(idea, Builders<CreatorIdea>.Update
                .Set(x => x.Phase3Data.LegalChecklist, checklist)
                .Push(x => x.OutputSnapshots.LegalChecklistVersions, entry));
            return j;
        }

        public async Task<CreatorJourney> UpdateLegalChecklistItemAsync(string userId, string itemId, string status, string ideaId = null)
        {
            if (status != "pending" && status != "in_progress" && status != "done")
                throw new CreatorJourneyException(400, "status must be pending | in_progress | done.");

            var j = await GetOrCreateAsync(userId);
            var idea = await ResolveIdeaAsync(j, ideaId);
            OverlayIdea(j, idea);
            var checklist = j.Phase3Data?.LegalChecklist
                ?? throw new CreatorJourneyException(404, "Legal checklist not generated yet.");

            var item = checklist.Items.FirstOrDefault(i => i.Id == itemId)
                ?? throw new CreatorJourneyException(404, "Checklist item not found.");

            item.Status = status;
            checklist.CompletedCount = checklist.Items.Count(i => i.Status == "done");

            await WriteIdeaAsync(idea, Builders<CreatorIdea>.Update.Set(x => x.Phase3Data.LegalChecklist, checklist));
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
            formation.SelectedType = selectedType;

            var ideaUpdate = Builders<CreatorIdea>.Update.Set(x => x.Phase3Data.FormationGenerator.SelectedType, selectedType);

            // Flip legal item 1 (company type selection) to done, if the checklist exists.
            var item1 = j.Phase3Data.LegalChecklist?.Items?.FirstOrDefault(i => i.Id == "company-type");
            if (item1 != null)
            {
                item1.Status = "done";
                j.Phase3Data.LegalChecklist.CompletedCount =
                    j.Phase3Data.LegalChecklist.Items.Count(i => i.Status == "done");
                ideaUpdate = ideaUpdate.Set(x => x.Phase3Data.LegalChecklist, j.Phase3Data.LegalChecklist);
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
                    throw new CreatorJourneyException(400, "kind must be \"forecast\" or \"businessPlan\".");
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

        // ---- Phase 4 ----

        public async Task<CreatorJourney> SetPhase4PricingAsync(string userId, string pricingModel, List<CreatorPricingTier> tiers, CreatorPricingForecastContext? forecastContext = null, string ideaId = null)
        {
            var j = await GetOrCreateAsync(userId);
            var idea = await ResolveIdeaAsync(j, ideaId);
            OverlayIdea(j, idea);
            var p4 = j.Phase4Data ??= new CreatorPhase4Data();
            p4.PricingModel = pricingModel;
            p4.Tiers = tiers ?? new List<CreatorPricingTier>();
            p4.PricingForecastContext = forecastContext;
            var entry = CreatorJourneyVersioning.Append(
                (j.OutputSnapshots ??= new CreatorOutputSnapshots()).PricingVersions, 4, null,
                new BsonDocument { ["pricingModel"] = pricingModel, ["tierCount"] = p4.Tiers.Count });

            // Atomic: $set only this method's own Phase4Data fields + $push its own
            // version array (disjoint from Resource/Gtm). Idea = source of truth.
            await WriteIdeaAsync(idea, Builders<CreatorIdea>.Update
                .Set(x => x.Phase4Data.PricingModel, p4.PricingModel)
                .Set(x => x.Phase4Data.Tiers, p4.Tiers)
                .Set(x => x.Phase4Data.PricingForecastContext, p4.PricingForecastContext)
                .Push(x => x.OutputSnapshots.PricingVersions, entry));
            return j;
        }

        public async Task<CreatorJourney> SetPhase4ResourceAsync(string userId, CreatorResourceCalculation calc, string ideaId = null)
        {
            var j = await GetOrCreateAsync(userId);
            var idea = await ResolveIdeaAsync(j, ideaId);
            OverlayIdea(j, idea);
            (j.Phase4Data ??= new CreatorPhase4Data()).ResourceCalculation = calc;
            var entry = CreatorJourneyVersioning.Append(
                (j.OutputSnapshots ??= new CreatorOutputSnapshots()).ResourcePlanVersions, 4, null,
                calc?.ToBsonDocument());

            // Atomic: $set only ResourceCalculation + $push its own version array —
            // disjoint from Pricing/Gtm. Idea = source of truth.
            await WriteIdeaAsync(idea, Builders<CreatorIdea>.Update
                .Set(x => x.Phase4Data.ResourceCalculation, calc)
                .Push(x => x.OutputSnapshots.ResourcePlanVersions, entry));
            return j;
        }

        public async Task<CreatorJourney> SetPhase4GtmAsync(string userId, CreatorGtmSetup gtm, string ideaId = null)
        {
            var j = await GetOrCreateAsync(userId);
            var idea = await ResolveIdeaAsync(j, ideaId);
            OverlayIdea(j, idea);
            (j.Phase4Data ??= new CreatorPhase4Data()).GtmSetup = gtm;
            var entry = CreatorJourneyVersioning.Append(
                (j.OutputSnapshots ??= new CreatorOutputSnapshots()).GtmPlanVersions, 4, null,
                gtm?.ToBsonDocument());

            // Atomic: $set only GtmSetup + $push its own version array — disjoint from
            // Pricing/Resource. Idea = source of truth.
            await WriteIdeaAsync(idea, Builders<CreatorIdea>.Update
                .Set(x => x.Phase4Data.GtmSetup, gtm)
                .Push(x => x.OutputSnapshots.GtmPlanVersions, entry));
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
