using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Interface;
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
        private static readonly TimeSpan PathSwitchWindow = TimeSpan.FromHours(72);

        // Legacy Path-A value, retired in P1.10. Centralized here so the one-time
        // read-coercion is the ONLY reference to it; no consumer branches on it.
        private const string LegacyPathAlias = "buyout";

        public CreatorJourneyService(
            MongoDbContext context,
            IBusinessPlanSessionStore businessPlans,
            IForecastSessionStore forecasts)
        {
            _context = context;
            _businessPlans = businessPlans;
            _forecasts = forecasts;
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
            bool hasPlan = planSession != null
                && string.Equals(planSession.Status, "Completed", StringComparison.Ordinal) && planSession.CurrentVersion > 0;
            bool hasForecast = forecastSession != null
                && string.Equals(forecastSession.Status, "Completed", StringComparison.Ordinal) && forecastSession.CurrentVersion > 0;
            bool hasLegal = p3.LegalChecklist != null;
            bool hasFormation = p3.FormationGenerator != null;
            bool anyP3 = planStarted || forecastStarted || hasLegal || hasFormation;

            if (!p2Done) s.Phase3.Status = "locked";
            else if (hasForecast && hasPlan && hasLegal && hasFormation) s.Phase3.Status = "completed";
            else if (anyP3) s.Phase3.Status = "in_progress";
            else s.Phase3.Status = "available";
            // Step order: business plan (2) → forecast (3) → legal (4) → formation (5) → complete (6).
            // Uses success-gated hasPlan/hasForecast so a failed/pending job routes back to that step.
            s.Phase3.CurrentStep = !hasPlan ? 2 : !hasForecast ? 3 : !hasLegal ? 4 : !hasFormation ? 5 : 6;

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
        public async Task<CreatorJourney> UpdateProjectAsync(string userId, UpdateProjectRequest r)
        {
            var j = await GetOrCreateAsync(userId);
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
            if (r.Category != null) p.Category = r.Category;
            if (r.Sector != null) p.Sector = r.Sector;
            if (r.Tags != null) p.Tags = r.Tags;
            if (r.ClarityScore.HasValue) p.ClarityScore = r.ClarityScore.Value;

            await ReplaceAsync(j);
            return j;
        }

        public async Task<CreatorJourney> SetEntryPathAsync(string userId, string path)
        {
            if (path == "needs_discovery")
                throw new CreatorJourneyException(400, "Discovery path is no longer available.");
            if (path != "already_have_idea")
                throw new CreatorJourneyException(400, "Invalid entry path.");

            var j = await GetOrCreateAsync(userId);
            (j.Phase2Data ??= new CreatorPhase2Data()).SelectedEntryPath = path;
            await ReplaceAsync(j);
            return j;
        }

        public async Task<CreatorJourney> SetCrossroadsPathAsync(string userId, string path)
        {
            // Only the two canonical values are accepted; the legacy alias and any
            // other value are rejected here with 400.
            if (path != "sell_license" && path != "build")
                throw new CreatorJourneyException(400, "Path must be \"sell_license\" or \"build\".");

            var j = await GetOrCreateAsync(userId);
            var p5 = j.Phase5Data ??= new CreatorPhase5Data();

            // 72-hour switch lock: once a path is chosen, switching is allowed only
            // within the window. After it elapses, the choice is locked.
            if (!string.IsNullOrEmpty(p5.ChosenPath) && p5.ChosenPath != path && p5.PathSelectedAt.HasValue)
            {
                if (DateTime.UtcNow - p5.PathSelectedAt.Value > PathSwitchWindow)
                    throw new CreatorJourneyException(403, "Path is locked. Contact support to switch.");
            }

            if (p5.ChosenPath != path)
            {
                p5.ChosenPath = path;
                p5.PathSelectedAt = DateTime.UtcNow;
            }
            await ReplaceAsync(j);
            return j;
        }

        public async Task<CreatorJourney> AppendOutputAsync(string userId, AppendOutputRequest r)
        {
            var j = await GetOrCreateAsync(userId);
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

            // Atomic $push so a concurrent output save can't clobber this entry (a
            // full-document ReplaceAsync would lose one). Typed Push per key keeps the
            // class-map serialization byte-identical — no string paths. The default arm
            // is unreachable (the list switch above already threw on unknown keys) but
            // stays loud so a bad key can never push to a wrong/new field.
            var update = r.OutputKey switch
            {
                "forecastVersions" => Builders<CreatorJourney>.Update.Push(x => x.OutputSnapshots.ForecastVersions, entry),
                "businessPlanVersions" => Builders<CreatorJourney>.Update.Push(x => x.OutputSnapshots.BusinessPlanVersions, entry),
                "ipValuationVersions" => Builders<CreatorJourney>.Update.Push(x => x.OutputSnapshots.IpValuationVersions, entry),
                "legalChecklistVersions" => Builders<CreatorJourney>.Update.Push(x => x.OutputSnapshots.LegalChecklistVersions, entry),
                "formationVersions" => Builders<CreatorJourney>.Update.Push(x => x.OutputSnapshots.FormationVersions, entry),
                "pricingVersions" => Builders<CreatorJourney>.Update.Push(x => x.OutputSnapshots.PricingVersions, entry),
                "gtmPlanVersions" => Builders<CreatorJourney>.Update.Push(x => x.OutputSnapshots.GtmPlanVersions, entry),
                "matchingRuns" => Builders<CreatorJourney>.Update.Push(x => x.OutputSnapshots.MatchingRuns, entry),
                _ => throw new CreatorJourneyException(400, $"Unknown outputKey \"{r.OutputKey}\"."),
            };

            await _context.CreatorJourneys.UpdateOneAsync(
                f => f.Id == j.Id,
                update.Set(x => x.UpdatedAt, DateTime.UtcNow));
            return j;
        }

        public async Task<CreatorJourney> AppendChatMessageAsync(string userId, string sender, string text)
        {
            if (sender != "ai" && sender != "user")
                throw new CreatorJourneyException(400, "sender must be \"ai\" or \"user\".");

            var j = await GetOrCreateAsync(userId);
            var message = new CreatorChatMessage
            {
                Id = ObjectId.GenerateNewId().ToString(),
                Sender = sender,
                Text = text ?? string.Empty,
                Timestamp = DateTime.UtcNow,
            };

            // Atomic $push: two concurrent appends must both persist, in order. A
            // full-document ReplaceAsync would let the second write clobber the first
            // and silently drop a message. $push also creates Phase2Data.ChatMessages
            // if absent. UpdatedAt is set in the same update to preserve the bump that
            // ReplaceAsync used to apply — one atomic write, not two.
            await _context.CreatorJourneys.UpdateOneAsync(
                f => f.Id == j.Id,
                Builders<CreatorJourney>.Update
                    .Push(x => x.Phase2Data.ChatMessages, message)
                    .Set(x => x.UpdatedAt, DateTime.UtcNow));

            // Reflect the persisted append on the returned object (unchanged contract).
            var p2 = j.Phase2Data ??= new CreatorPhase2Data();
            p2.ChatMessages ??= new List<CreatorChatMessage>();
            p2.ChatMessages.Add(message);
            return j;
        }

        public async Task<CreatorJourney> ApplyClarifierMappingAsync(
            string userId, string clarifierSessionId, string problem, string targetUser,
            string solution, double clarityScore, List<string> tags, string marketGap = "", string creatorEdge = "")
        {
            var j = await GetOrCreateAsync(userId);
            var p = j.Project ??= new CreatorJourneyProject();
            p.Problem = problem ?? p.Problem;
            p.TargetUser = targetUser ?? p.TargetUser;
            p.Solution = solution ?? p.Solution;
            p.ClarityScore = clarityScore;
            if (!string.IsNullOrWhiteSpace(marketGap)) p.MarketGap = marketGap;
            if (!string.IsNullOrWhiteSpace(creatorEdge)) p.CreatorEdge = creatorEdge;
            if (tags != null && tags.Count > 0) p.Tags = tags;

            (j.Phase2Data ??= new CreatorPhase2Data()).ClarifierSessionId = clarifierSessionId;
            await ReplaceAsync(j);
            return j;
        }

        // Discovery convergence: map a confirmed Discovery concept onto the project and
        // link the concept-seeded clarifier session (created by the finalize-discovery
        // endpoint) so the shared tail + Phase 3 prerequisite are satisfied WITHOUT the
        // clarifier Q&A. Mirrors ApplyClarifierMappingAsync but also sets Concept/Category
        // (which the concept carries) in a single write. Path-B's mapping is untouched.
        public async Task<CreatorJourney> ApplyDiscoveryMappingAsync(
            string userId, string clarifierSessionId, CreatorDiscoveryConcept concept)
        {
            var j = await GetOrCreateAsync(userId);
            var p = j.Project ??= new CreatorJourneyProject();
            if (!string.IsNullOrWhiteSpace(concept.CoreProblem)) p.Problem = concept.CoreProblem;
            if (!string.IsNullOrWhiteSpace(concept.TargetUser)) p.TargetUser = concept.TargetUser;
            if (!string.IsNullOrWhiteSpace(concept.Solution)) p.Solution = concept.Solution;
            if (!string.IsNullOrWhiteSpace(concept.MarketGap)) p.MarketGap = concept.MarketGap;
            if (!string.IsNullOrWhiteSpace(concept.FounderEdge)) p.CreatorEdge = concept.FounderEdge;
            var conceptText = !string.IsNullOrWhiteSpace(concept.Concept) ? concept.Concept : concept.Description;
            if (!string.IsNullOrWhiteSpace(conceptText)) p.Concept = conceptText;
            if (!string.IsNullOrWhiteSpace(concept.Category)) { p.Category = concept.Category; p.Tags = new List<string> { concept.Category }; }
            p.ClarityScore = concept.Score;

            (j.Phase2Data ??= new CreatorPhase2Data()).ClarifierSessionId = clarifierSessionId;
            await ReplaceAsync(j);
            return j;
        }

        public async Task<CreatorJourney> SetBrandingLogoAsync(
            string userId, string logoAsset, string logoType, string brandingMethod,
            List<string> colorPalette = null, string paletteName = null, string typographyPairing = null)
        {
            var j = await GetOrCreateAsync(userId);
            var b = (j.Project ??= new CreatorJourneyProject()).Branding ??= new CreatorBranding();
            if (logoAsset != null) b.LogoAsset = logoAsset;
            if (logoType != null) b.LogoType = logoType;
            b.BrandingMethod = brandingMethod;
            if (colorPalette != null) b.ColorPalette = colorPalette;
            if (paletteName != null) b.PaletteName = paletteName;
            if (typographyPairing != null) b.TypographyPairing = typographyPairing;
            await ReplaceAsync(j);
            return j;
        }

        // ---- Discovery path working state (independent, targeted $set writes) ----

        public async Task<CreatorJourney> SetDiscoveryInputsAsync(string userId, CreatorDiscoveryInputs inputs)
        {
            if (inputs == null)
                throw new CreatorJourneyException(400, "inputs is required.");

            var j = await GetOrCreateAsync(userId);
            j.Phase2Data ??= new CreatorPhase2Data();
            j.Phase2Data.DiscoveryInputs = inputs;

            await _context.CreatorJourneys.UpdateOneAsync(
                f => f.Id == j.Id,
                Builders<CreatorJourney>.Update.Set(x => x.Phase2Data.DiscoveryInputs, inputs));

            return j;
        }

        public async Task<CreatorJourney> SetGeneratedConceptsAsync(string userId, List<CreatorDiscoveryConcept> concepts)
        {
            if (concepts == null)
                throw new CreatorJourneyException(400, "concepts is required.");

            var j = await GetOrCreateAsync(userId);
            j.Phase2Data ??= new CreatorPhase2Data();
            j.Phase2Data.GeneratedConcepts = concepts;

            await _context.CreatorJourneys.UpdateOneAsync(
                f => f.Id == j.Id,
                Builders<CreatorJourney>.Update.Set(x => x.Phase2Data.GeneratedConcepts, concepts));

            return j;
        }

        public async Task<CreatorJourney> SetSelectedConceptIdAsync(string userId, string conceptId)
        {
            if (string.IsNullOrWhiteSpace(conceptId))
                throw new CreatorJourneyException(400, "conceptId is required.");

            var j = await GetOrCreateAsync(userId);
            j.Phase2Data ??= new CreatorPhase2Data();
            j.Phase2Data.SelectedConceptId = conceptId;

            await _context.CreatorJourneys.UpdateOneAsync(
                f => f.Id == j.Id,
                Builders<CreatorJourney>.Update.Set(x => x.Phase2Data.SelectedConceptId, conceptId));

            return j;
        }

        // ---- Phase 3 deterministic modules ----

        public async Task<CreatorJourney> SetLegalChecklistAsync(string userId, CreatorLegalChecklist checklist)
        {
            var j = await GetOrCreateAsync(userId);
            checklist.TotalCount = checklist.Items?.Count ?? 0;
            checklist.CompletedCount = checklist.Items?.Count(i => i.Status == "done") ?? 0;
            (j.Phase3Data ??= new CreatorPhase3Data()).LegalChecklist = checklist;

            CreatorJourneyVersioning.Append(
                (j.OutputSnapshots ??= new CreatorOutputSnapshots()).LegalChecklistVersions,
                3, null, checklist.ToBsonDocument());

            await ReplaceAsync(j);
            return j;
        }

        public async Task<CreatorJourney> UpdateLegalChecklistItemAsync(string userId, string itemId, string status)
        {
            if (status != "pending" && status != "in_progress" && status != "done")
                throw new CreatorJourneyException(400, "status must be pending | in_progress | done.");

            var j = await GetOrCreateAsync(userId);
            var checklist = j.Phase3Data?.LegalChecklist
                ?? throw new CreatorJourneyException(404, "Legal checklist not generated yet.");

            var item = checklist.Items.FirstOrDefault(i => i.Id == itemId)
                ?? throw new CreatorJourneyException(404, "Checklist item not found.");

            item.Status = status;
            checklist.CompletedCount = checklist.Items.Count(i => i.Status == "done");
            await ReplaceAsync(j);
            return j;
        }

        public async Task<CreatorJourney> SetFormationAsync(string userId, CreatorFormationGenerator formation)
        {
            var j = await GetOrCreateAsync(userId);
            (j.Phase3Data ??= new CreatorPhase3Data()).FormationGenerator = formation;

            CreatorJourneyVersioning.Append(
                (j.OutputSnapshots ??= new CreatorOutputSnapshots()).FormationVersions,
                3, null, formation.ToBsonDocument());

            await ReplaceAsync(j);
            return j;
        }

        public async Task<CreatorJourney> SelectFormationTypeAsync(string userId, string selectedType)
        {
            if (selectedType != "SAS" && selectedType != "SARL" && selectedType != "SAS-U")
                throw new CreatorJourneyException(400, "selectedType must be SAS | SARL | SAS-U.");

            var j = await GetOrCreateAsync(userId);
            var formation = j.Phase3Data?.FormationGenerator
                ?? throw new CreatorJourneyException(404, "Formation not generated yet.");
            formation.SelectedType = selectedType;

            // Flip legal item 1 (company type selection) to done, if the checklist exists.
            var item1 = j.Phase3Data.LegalChecklist?.Items?.FirstOrDefault(i => i.Id == "company-type");
            if (item1 != null)
            {
                item1.Status = "done";
                j.Phase3Data.LegalChecklist.CompletedCount =
                    j.Phase3Data.LegalChecklist.Items.Count(i => i.Status == "done");
            }

            await ReplaceAsync(j);
            return j;
        }

        public async Task<CreatorJourney> SetPhase3SessionAsync(string userId, string kind, string sessionId)
        {
            if (string.IsNullOrWhiteSpace(sessionId))
                throw new CreatorJourneyException(400, "sessionId is required.");

            var j = await GetOrCreateAsync(userId);
            var p3 = j.Phase3Data ??= new CreatorPhase3Data();
            var snaps = j.OutputSnapshots ??= new CreatorOutputSnapshots();

            // Atomic targeted update: $set only the ONE session-id field + $push its
            // version entry. A full-document ReplaceAsync would let a concurrent
            // forecast/businessPlan start clobber the other's session id — silently
            // breaking Phase-3 gating. Because we $set a single field, the sibling
            // session id is never touched. UpdatedAt bumped in the same write.
            UpdateDefinition<CreatorJourney> update;
            switch (kind)
            {
                case "forecast":
                    p3.ForecastSessionId = sessionId;
                    update = Builders<CreatorJourney>.Update
                        .Set(x => x.Phase3Data.ForecastSessionId, sessionId)
                        .Push(x => x.OutputSnapshots.ForecastVersions,
                              CreatorJourneyVersioning.Append(snaps.ForecastVersions, 3, sessionId, null));
                    break;
                case "businessPlan":
                    p3.BusinessPlanSessionId = sessionId;
                    update = Builders<CreatorJourney>.Update
                        .Set(x => x.Phase3Data.BusinessPlanSessionId, sessionId)
                        .Push(x => x.OutputSnapshots.BusinessPlanVersions,
                              CreatorJourneyVersioning.Append(snaps.BusinessPlanVersions, 3, sessionId, null));
                    break;
                default:
                    throw new CreatorJourneyException(400, "kind must be \"forecast\" or \"businessPlan\".");
            }

            await _context.CreatorJourneys.UpdateOneAsync(
                f => f.Id == j.Id,
                update.Set(x => x.UpdatedAt, DateTime.UtcNow));
            return j;
        }

        public async Task<CreatorJourney> SetInvestorReadinessAsync(string userId, CreatorInvestorReadinessScore score)
        {
            var j = await GetOrCreateAsync(userId);
            (j.Phase3Data ??= new CreatorPhase3Data()).InvestorReadinessScore = score;
            await ReplaceAsync(j);
            return j;
        }

        // ---- Phase 4 ----

        public async Task<CreatorJourney> SetPhase4PricingAsync(string userId, string pricingModel, List<CreatorPricingTier> tiers)
        {
            var j = await GetOrCreateAsync(userId);
            var p4 = j.Phase4Data ??= new CreatorPhase4Data();
            p4.PricingModel = pricingModel;
            p4.Tiers = tiers ?? new List<CreatorPricingTier>();
            var entry = CreatorJourneyVersioning.Append(
                (j.OutputSnapshots ??= new CreatorOutputSnapshots()).PricingVersions, 4, null,
                new BsonDocument { ["pricingModel"] = pricingModel, ["tierCount"] = p4.Tiers.Count });

            // Atomic: $set only this method's own Phase4Data fields + $push its own
            // version array. Pricing/Resource/Gtm own disjoint fields, so a full-doc
            // ReplaceAsync (which a Gtm save could clobber) is replaced by a targeted
            // update that can't interfere with a sibling Phase-4 save.
            await _context.CreatorJourneys.UpdateOneAsync(
                f => f.Id == j.Id,
                Builders<CreatorJourney>.Update
                    .Set(x => x.Phase4Data.PricingModel, p4.PricingModel)
                    .Set(x => x.Phase4Data.Tiers, p4.Tiers)
                    .Push(x => x.OutputSnapshots.PricingVersions, entry)
                    .Set(x => x.UpdatedAt, DateTime.UtcNow));
            return j;
        }

        public async Task<CreatorJourney> SetPhase4ResourceAsync(string userId, CreatorResourceCalculation calc)
        {
            var j = await GetOrCreateAsync(userId);
            (j.Phase4Data ??= new CreatorPhase4Data()).ResourceCalculation = calc;
            var entry = CreatorJourneyVersioning.Append(
                (j.OutputSnapshots ??= new CreatorOutputSnapshots()).ResourcePlanVersions, 4, null,
                calc?.ToBsonDocument());

            // Atomic: $set only ResourceCalculation + $push its own version array —
            // disjoint from Pricing/Gtm, so sibling Phase-4 saves can't clobber it.
            await _context.CreatorJourneys.UpdateOneAsync(
                f => f.Id == j.Id,
                Builders<CreatorJourney>.Update
                    .Set(x => x.Phase4Data.ResourceCalculation, calc)
                    .Push(x => x.OutputSnapshots.ResourcePlanVersions, entry)
                    .Set(x => x.UpdatedAt, DateTime.UtcNow));
            return j;
        }

        public async Task<CreatorJourney> SetPhase4GtmAsync(string userId, CreatorGtmSetup gtm)
        {
            var j = await GetOrCreateAsync(userId);
            (j.Phase4Data ??= new CreatorPhase4Data()).GtmSetup = gtm;
            var entry = CreatorJourneyVersioning.Append(
                (j.OutputSnapshots ??= new CreatorOutputSnapshots()).GtmPlanVersions, 4, null,
                gtm?.ToBsonDocument());

            // Atomic: $set only GtmSetup + $push its own version array — disjoint from
            // Pricing/Resource, so sibling Phase-4 saves can't clobber it.
            await _context.CreatorJourneys.UpdateOneAsync(
                f => f.Id == j.Id,
                Builders<CreatorJourney>.Update
                    .Set(x => x.Phase4Data.GtmSetup, gtm)
                    .Push(x => x.OutputSnapshots.GtmPlanVersions, entry)
                    .Set(x => x.UpdatedAt, DateTime.UtcNow));
            return j;
        }

        // ---- Phase 5 ----

        public async Task<CreatorJourney> SetIpValuationAsync(string userId, CreatorIpValuation valuation)
        {
            var j = await GetOrCreateAsync(userId);
            var pathA = (j.Phase5Data ??= new CreatorPhase5Data()).PathA ??= new CreatorPathA();
            pathA.IpValuation = valuation;
            CreatorJourneyVersioning.Append(
                (j.OutputSnapshots ??= new CreatorOutputSnapshots()).IpValuationVersions, 5, null,
                valuation?.ToBsonDocument());
            await ReplaceAsync(j);
            return j;
        }

        public async Task<CreatorJourney> SetMarketplaceListingAsync(string userId, CreatorMarketplaceListing listing, List<string> matchedBuyerIds)
        {
            var j = await GetOrCreateAsync(userId);
            var pathA = (j.Phase5Data ??= new CreatorPhase5Data()).PathA ??= new CreatorPathA();
            pathA.MarketplaceListing = listing;
            if (matchedBuyerIds != null) pathA.MatchedBuyerIds = matchedBuyerIds;
            await ReplaceAsync(j);
            return j;
        }

        public async Task<CreatorJourney> SetCompanyFormationAsync(string userId, CreatorCompanyFormation formation)
        {
            var j = await GetOrCreateAsync(userId);
            var pathB = (j.Phase5Data ??= new CreatorPhase5Data()).PathB ??= new CreatorPathB();
            pathB.CompanyFormation = formation;
            await ReplaceAsync(j);
            return j;
        }

        public async Task<CreatorJourney> SetSeedFundingAsync(string userId, CreatorSeedFunding seedFunding, string companyId)
        {
            var j = await GetOrCreateAsync(userId);
            var p5 = j.Phase5Data ??= new CreatorPhase5Data();
            var pathB = p5.PathB ??= new CreatorPathB();
            pathB.SeedFunding = seedFunding;
            p5.CompletedAt = DateTime.UtcNow;            // starts the 72h switch-lock clock
            if (!string.IsNullOrEmpty(companyId)) j.CompanyId = companyId; // R10: link the spun company
            await ReplaceAsync(j);
            return j;
        }
    }
}
