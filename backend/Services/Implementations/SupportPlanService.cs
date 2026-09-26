using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Phase4;
using WebApp.Models.Phase4;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations
{
    public class SupportPlanService : ISupportPlanService
    {
        private readonly ICreatorJourneyService _journeys;
        private readonly INeedsAnalysisService _needsService;
        private readonly ISkillsResolutionService _skillsService;
        private readonly ISupportCatalogueService _catalogueService;
        private readonly ISupportMatchingService _matchingService;
        private readonly IProfessionalProfileStore? _professionalStore;
        private readonly IProfileCompletenessResolver? _completenessResolver;

        public SupportPlanService(
            ICreatorJourneyService journeys,
            INeedsAnalysisService needsService,
            ISkillsResolutionService skillsService,
            ISupportCatalogueService catalogueService,
            ISupportMatchingService matchingService,
            IProfessionalProfileStore? professionalStore = null,
            IProfileCompletenessResolver? completenessResolver = null)
        {
            _journeys = journeys;
            _needsService = needsService;
            _skillsService = skillsService;
            _catalogueService = catalogueService;
            _matchingService = matchingService;
            _professionalStore = professionalStore;
            _completenessResolver = completenessResolver;
        }

        public async Task<SupportPlanResponse> GetSupportPlanAsync(string userId, string? ideaId = null)
        {
            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var plan = journey.Phase4Data?.SupportPlan;

            var profile = await GetProfileAsync(userId);
            var gate = await EvaluateGateAsync(userId, journey, profile, ideaId);

            if (plan == null)
            {
                return new SupportPlanResponse
                {
                    SupportPlan = null,
                    UpdateAvailable = false,
                    ChangedSources = new List<string>(),
                    Summary = new SupportPlanSummary(),
                    FounderProfileSummary = BuildProfileSummary(profile),
                    PrerequisiteGate = gate
                };
            }

            var currentVersions = BuildCurrentVersions(journey, profile);
            var (isStale, changedSources) = DetectStaleness(plan.SourceVersions, currentVersions);

            return new SupportPlanResponse
            {
                SupportPlan = plan,
                UpdateAvailable = isStale,
                ChangedSources = changedSources,
                Summary = plan.Summary ?? _matchingService.ComputeSummary(plan.Matches),
                FounderProfileSummary = BuildProfileSummary(profile),
                PrerequisiteGate = gate,
                IdeaVersion = journey.IdeaVersion
            };
        }

        public async Task<SupportPlanResponse> GenerateSupportPlanAsync(string userId, string? ideaId = null)
        {
            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var existing = journey.Phase4Data?.SupportPlan;

            var profile = await GetProfileAsync(userId);
            var gate = await EvaluateGateAsync(userId, journey, profile, ideaId);

            // Idempotency: Return existing plan if already generated
            if (existing != null)
            {
                var currentVer = BuildCurrentVersions(journey, profile);
                var (stale, changed) = DetectStaleness(existing.SourceVersions, currentVer);
                return new SupportPlanResponse
                {
                    SupportPlan = existing,
                    UpdateAvailable = stale,
                    ChangedSources = changed,
                    Summary = existing.Summary ?? _matchingService.ComputeSummary(existing.Matches),
                    FounderProfileSummary = BuildProfileSummary(profile),
                    PrerequisiteGate = gate,
                    IdeaVersion = journey.IdeaVersion
                };
            }

            // Enforce domain gates
            await EnforceGateAsync(userId, ideaId);

            // Ensure catalogue seeded
            await _catalogueService.EnsureCatalogueSeededAsync();

            var context = await _matchingService.BuildEligibilityContextAsync(userId, journey, profile);
            var candidates = await _catalogueService.GetActiveOpportunitiesAsync(context.Country, context.Region);
            var matches = await _matchingService.MatchOpportunitiesAsync(context, candidates);
            var missingFacts = _matchingService.ExtractMissingEligibilityFacts(matches, context);
            var checklists = _matchingService.BuildApplicationChecklists(matches, journey);
            var summary = _matchingService.ComputeSummary(matches);
            var topMatches = _matchingService.SelectTopMatches(matches);

            var newPlan = new SupportPlan
            {
                Status = "Generated",
                GeneratedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Summary = summary,
                Matches = matches,
                TopMatches = topMatches,
                MissingEligibilityFacts = missingFacts,
                ApplicationChecklists = checklists,
                SourceVersions = BuildCurrentVersions(journey, profile),
                SourceFreshness = new SupportSourceFreshness
                {
                    LastCheckedAt = DateTime.UtcNow,
                    IsFresh = true,
                    UnverifiedSources = new List<string>()
                },
                FounderEdited = false,
                RecordedEligibilityFacts = new Dictionary<string, string>()
            };

            // Single source of truth: Persisted on CreatorJourney.Phase4Data.SupportPlan
            await _journeys.SetPhase4SupportPlanAsync(userId, newPlan, ideaId);

            return new SupportPlanResponse
            {
                SupportPlan = newPlan,
                UpdateAvailable = false,
                ChangedSources = new List<string>(),
                Summary = newPlan.Summary,
                FounderProfileSummary = BuildProfileSummary(profile),
                PrerequisiteGate = gate,
                IdeaVersion = journey.IdeaVersion
            };
        }

        public async Task<SupportPlanResponse> RefreshSupportPlanAsync(string userId, string? ideaId = null)
        {
            await EnforceGateAsync(userId, ideaId);

            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var existing = journey.Phase4Data?.SupportPlan;
            var profile = await GetProfileAsync(userId);
            var gate = await EvaluateGateAsync(userId, journey, profile, ideaId);

            await _catalogueService.EnsureCatalogueSeededAsync();

            var recordedFacts = existing?.RecordedEligibilityFacts ?? new Dictionary<string, string>();
            var context = await _matchingService.BuildEligibilityContextAsync(userId, journey, profile, recordedFacts);
            var candidates = await _catalogueService.GetActiveOpportunitiesAsync(context.Country, context.Region);
            var matches = await _matchingService.MatchOpportunitiesAsync(context, candidates);

            // Preserve founder application states & notes by stable key
            if (existing?.Matches != null)
            {
                foreach (var match in matches)
                {
                    var prev = existing.Matches.FirstOrDefault(m => string.Equals(m.Key, match.Key, StringComparison.OrdinalIgnoreCase));
                    if (prev != null)
                    {
                        match.FounderApplicationState = prev.FounderApplicationState;
                        match.FounderNotes = prev.FounderNotes;
                        match.FounderEdited = prev.FounderEdited;
                    }
                }
            }

            var missingFacts = _matchingService.ExtractMissingEligibilityFacts(matches, context);
            var checklists = _matchingService.BuildApplicationChecklists(matches, journey);
            var summary = _matchingService.ComputeSummary(matches);
            var topMatches = _matchingService.SelectTopMatches(matches);

            var refreshedPlan = new SupportPlan
            {
                Status = "Refreshed",
                GeneratedAt = existing?.GeneratedAt ?? DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Summary = summary,
                Matches = matches,
                TopMatches = topMatches,
                MissingEligibilityFacts = missingFacts,
                ApplicationChecklists = checklists,
                SourceVersions = BuildCurrentVersions(journey, profile),
                SourceFreshness = new SupportSourceFreshness
                {
                    LastCheckedAt = DateTime.UtcNow,
                    IsFresh = true,
                    UnverifiedSources = new List<string>()
                },
                FounderEdited = existing?.FounderEdited ?? false,
                RecordedEligibilityFacts = recordedFacts
            };

            await _journeys.SetPhase4SupportPlanAsync(userId, refreshedPlan, ideaId);

            return new SupportPlanResponse
            {
                SupportPlan = refreshedPlan,
                UpdateAvailable = false,
                ChangedSources = new List<string>(),
                Summary = refreshedPlan.Summary,
                FounderProfileSummary = BuildProfileSummary(profile),
                PrerequisiteGate = gate,
                IdeaVersion = journey.IdeaVersion
            };
        }

        public async Task<SupportPlanResponse> UpdateFounderSupportStateAsync(string userId, string matchKey, UpdateFounderSupportStateRequest request)
        {
            request ??= new UpdateFounderSupportStateRequest();
            var journey = await _journeys.GetOrCreateComposedAsync(userId, request.IdeaId);
            if (journey == null)
                throw new KeyNotFoundException($"Journey for user '{userId}' not found.");

            var plan = journey.Phase4Data?.SupportPlan;
            if (plan == null)
                throw new KeyNotFoundException("Support Plan has not been generated yet.");

            var match = plan.Matches.FirstOrDefault(m => string.Equals(m.Key, matchKey, StringComparison.OrdinalIgnoreCase));
            if (match == null)
                throw new KeyNotFoundException($"Support match '{matchKey}' not found.");

            if (!string.IsNullOrWhiteSpace(request.ApplicationState))
            {
                match.FounderApplicationState = request.ApplicationState;
                match.FounderEdited = true;
                if (string.Equals(request.ApplicationState, FounderApplicationState.Awarded, StringComparison.OrdinalIgnoreCase))
                {
                    match.EligibilityStatus = EligibilityStatus.Awarded;
                }
            }

            if (request.FounderNotes != null)
            {
                match.FounderNotes = request.FounderNotes;
                match.FounderEdited = true;
            }

            // Also update in TopMatches if present
            var topMatch = plan.TopMatches.FirstOrDefault(m => string.Equals(m.Key, matchKey, StringComparison.OrdinalIgnoreCase));
            if (topMatch != null)
            {
                topMatch.FounderApplicationState = match.FounderApplicationState;
                topMatch.EligibilityStatus = match.EligibilityStatus;
                topMatch.FounderNotes = match.FounderNotes;
                topMatch.FounderEdited = match.FounderEdited;
            }

            plan.FounderEdited = true;
            plan.UpdatedAt = DateTime.UtcNow;

            await _journeys.SetPhase4SupportPlanAsync(userId, plan, request.IdeaId);

            var profile = await GetProfileAsync(userId);
            var gate = await EvaluateGateAsync(userId, journey, profile, request.IdeaId);

            return new SupportPlanResponse
            {
                SupportPlan = plan,
                UpdateAvailable = false,
                ChangedSources = new List<string>(),
                Summary = plan.Summary ?? _matchingService.ComputeSummary(plan.Matches),
                FounderProfileSummary = BuildProfileSummary(profile),
                PrerequisiteGate = gate,
                IdeaVersion = journey.IdeaVersion
            };
        }

        public async Task<SupportPlanResponse> AnswerEligibilityFactAsync(string userId, string factKey, string value, string? ideaId = null)
        {
            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            if (journey == null)
                throw new KeyNotFoundException($"Journey for user '{userId}' not found.");

            var plan = journey.Phase4Data?.SupportPlan;
            if (plan == null)
                throw new KeyNotFoundException("Support Plan has not been generated yet.");

            plan.RecordedEligibilityFacts[factKey] = value;

            var profile = await GetProfileAsync(userId);
            var context = await _matchingService.BuildEligibilityContextAsync(userId, journey, profile, plan.RecordedEligibilityFacts);
            var candidates = await _catalogueService.GetActiveOpportunitiesAsync(context.Country, context.Region);
            var matches = await _matchingService.MatchOpportunitiesAsync(context, candidates);

            // Preserve previous founder decisions
            foreach (var match in matches)
            {
                var prev = plan.Matches.FirstOrDefault(m => string.Equals(m.Key, match.Key, StringComparison.OrdinalIgnoreCase));
                if (prev != null)
                {
                    match.FounderApplicationState = prev.FounderApplicationState;
                    match.FounderNotes = prev.FounderNotes;
                    match.FounderEdited = prev.FounderEdited;
                }
            }

            plan.Matches = matches;
            plan.TopMatches = _matchingService.SelectTopMatches(matches);
            plan.MissingEligibilityFacts = _matchingService.ExtractMissingEligibilityFacts(matches, context);
            plan.ApplicationChecklists = _matchingService.BuildApplicationChecklists(matches, journey);
            plan.Summary = _matchingService.ComputeSummary(matches);
            plan.UpdatedAt = DateTime.UtcNow;

            await _journeys.SetPhase4SupportPlanAsync(userId, plan, ideaId);

            var gate = await EvaluateGateAsync(userId, journey, profile, ideaId);

            return new SupportPlanResponse
            {
                SupportPlan = plan,
                UpdateAvailable = false,
                ChangedSources = new List<string>(),
                Summary = plan.Summary,
                FounderProfileSummary = BuildProfileSummary(profile),
                PrerequisiteGate = gate,
                IdeaVersion = journey.IdeaVersion
            };
        }

        private async Task EnforceGateAsync(string userId, string? ideaId)
        {
            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);

            // 1. Phase 3 gate
            var status = await _journeys.ComputePhaseStatusAsync(journey, phase1Complete: true);
            if (status.Phase3 == null || !string.Equals(status.Phase3.Status, "completed", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Phase 3 Business Plan Intelligence must be completed before generating your Aids, Grants & Support Plan.");
            }

            // 2. HumainX gate
            if (_professionalStore != null && _completenessResolver != null)
            {
                var profile = await _professionalStore.GetByUserIdAsync(userId, CancellationToken.None);
                if (profile != null)
                {
                    var check = _completenessResolver.Resolve(profile);
                    if (check != null && !check.Phase4Ready)
                    {
                        throw new InvalidOperationException("Your HumainX professional profile requires skills and venture context before building your Aids, Grants & Support Plan.");
                    }
                }
            }

            // 3. Snapshot gate
            if (journey.Phase4Data?.ConstructionSnapshot == null)
            {
                throw new InvalidOperationException("Construction Snapshot must be generated before building your Aids, Grants & Support Plan.");
            }

            // 4. Roadmap gate
            if (journey.Phase4Data?.Roadmap == null)
            {
                throw new InvalidOperationException("Operational Roadmap must be generated before building your Aids, Grants & Support Plan.");
            }

            // 5. Needs Analysis gate
            if (journey.Phase4Data?.NeedsAnalysis == null)
            {
                throw new InvalidOperationException("Needs Analysis must be completed before building your Aids, Grants & Support Plan.");
            }

            var needsRes = await _needsService.GetNeedsAnalysisAsync(userId, ideaId);
            if (needsRes.UpdateAvailable)
            {
                throw new InvalidOperationException("Your Needs Analysis is stale because upstream sources changed. Please refresh Needs Analysis before building your Aids, Grants & Support Plan.");
            }

            // 6. Skills Plan gate (SKILLS_PLAN_REFRESH_REQUIRED)
            if (journey.Phase4Data?.SkillsPlan == null)
            {
                throw new InvalidOperationException("Skills & Training Plan must be completed before building your Aids, Grants & Support Plan.");
            }

            var skillsRes = await _skillsService.GetSkillsPlanAsync(userId, ideaId);
            if (skillsRes.UpdateAvailable)
            {
                throw new InvalidOperationException("Your Skills Plan is stale (SKILLS_PLAN_REFRESH_REQUIRED). Please refresh your Skills Plan before building your Aids, Grants & Support Plan.");
            }
        }

        private async Task<PrerequisiteGateDto> EvaluateGateAsync(string userId, CreatorJourney journey, ProfessionalProfileRecord? profile, string? ideaId)
        {
            var gate = new PrerequisiteGateDto();
            var blocking = new List<string>();

            // Phase 3
            var status = await _journeys.ComputePhaseStatusAsync(journey, phase1Complete: true);
            gate.Phase3Completed = status?.Phase3 != null && string.Equals(status.Phase3.Status, "completed", StringComparison.OrdinalIgnoreCase);
            if (!gate.Phase3Completed) blocking.Add("Phase 3 Business Plan Intelligence must be completed.");

            // HumainX
            if (_completenessResolver != null && profile != null)
            {
                var check = _completenessResolver.Resolve(profile);
                gate.HumainXReady = check?.Phase4Ready ?? true;
                if (!gate.HumainXReady) blocking.Add("HumainX profile must be completed for Phase 4.");
            }

            // Construction Snapshot
            gate.ConstructionSnapshotExists = journey.Phase4Data?.ConstructionSnapshot != null;
            if (!gate.ConstructionSnapshotExists) blocking.Add("Construction Snapshot must be generated.");

            // Roadmap
            gate.OperationalRoadmapExists = journey.Phase4Data?.Roadmap != null;
            if (!gate.OperationalRoadmapExists) blocking.Add("Operational Roadmap must be generated.");

            // Needs Analysis
            gate.NeedsAnalysisExists = journey.Phase4Data?.NeedsAnalysis != null;
            if (!gate.NeedsAnalysisExists)
            {
                blocking.Add("Needs Analysis must be generated.");
                gate.NeedsAnalysisCurrent = false;
            }
            else
            {
                try
                {
                    var needsRes = await _needsService.GetNeedsAnalysisAsync(userId, ideaId);
                    gate.NeedsAnalysisCurrent = !needsRes.UpdateAvailable;
                    if (!gate.NeedsAnalysisCurrent) blocking.Add("Needs Analysis is stale.");
                }
                catch { }
            }

            // Skills Plan
            gate.SkillsPlanExists = journey.Phase4Data?.SkillsPlan != null;
            if (!gate.SkillsPlanExists)
            {
                blocking.Add("Skills Plan must be generated.");
                gate.SkillsPlanCurrent = false;
            }
            else
            {
                try
                {
                    var skillsRes = await _skillsService.GetSkillsPlanAsync(userId, ideaId);
                    gate.SkillsPlanCurrent = !skillsRes.UpdateAvailable;
                    if (!gate.SkillsPlanCurrent) blocking.Add("Skills Plan is stale (SKILLS_PLAN_REFRESH_REQUIRED).");
                }
                catch { }
            }

            gate.BlockingReasons = blocking;
            gate.CanAccess = blocking.Count == 0;
            return gate;
        }

        private async Task<ProfessionalProfileRecord?> GetProfileAsync(string userId)
        {
            if (_professionalStore == null) return null;
            try
            {
                return await _professionalStore.GetByUserIdAsync(userId, CancellationToken.None);
            }
            catch
            {
                return null;
            }
        }

        private static SupportSourceVersions BuildCurrentVersions(CreatorJourney journey, ProfessionalProfileRecord? profile)
        {
            return new SupportSourceVersions
            {
                SnapshotGeneratedAt = journey.Phase4Data?.ConstructionSnapshot?.GeneratedAt,
                RoadmapGeneratedAt = journey.Phase4Data?.Roadmap?.GeneratedAt,
                NeedsGeneratedAt = journey.Phase4Data?.NeedsAnalysis?.UpdatedAt,
                SkillsGeneratedAt = journey.Phase4Data?.SkillsPlan?.UpdatedAt,
                ProfileUpdatedAt = profile?.UpdatedAt,
                ForecastUpdatedAt = journey.Phase3Data?.FormationGenerator?.ForecastBasis != null ? journey.UpdatedAt : null,
                CatalogueRuleVersion = "1.0"
            };
        }

        private static (bool IsStale, List<string> ChangedSources) DetectStaleness(
            SupportSourceVersions? stored,
            SupportSourceVersions current)
        {
            var changed = new List<string>();
            if (stored == null) return (true, new List<string> { "InitialPlan" });

            if (current.SnapshotGeneratedAt.HasValue && stored.SnapshotGeneratedAt.HasValue &&
                current.SnapshotGeneratedAt.Value > stored.SnapshotGeneratedAt.Value)
            {
                changed.Add("ConstructionSnapshot");
            }

            if (current.RoadmapGeneratedAt.HasValue && stored.RoadmapGeneratedAt.HasValue &&
                current.RoadmapGeneratedAt.Value > stored.RoadmapGeneratedAt.Value)
            {
                changed.Add("OperationalRoadmap");
            }

            if (current.NeedsGeneratedAt.HasValue && stored.NeedsGeneratedAt.HasValue &&
                current.NeedsGeneratedAt.Value > stored.NeedsGeneratedAt.Value)
            {
                changed.Add("NeedsAnalysis");
            }

            if (current.SkillsGeneratedAt.HasValue && stored.SkillsGeneratedAt.HasValue &&
                current.SkillsGeneratedAt.Value > stored.SkillsGeneratedAt.Value)
            {
                changed.Add("SkillsPlan");
            }

            if (current.ProfileUpdatedAt.HasValue && stored.ProfileUpdatedAt.HasValue &&
                current.ProfileUpdatedAt.Value > stored.ProfileUpdatedAt.Value)
            {
                changed.Add("ProfessionalProfile");
            }

            if (current.ForecastUpdatedAt.HasValue && stored.ForecastUpdatedAt.HasValue &&
                current.ForecastUpdatedAt.Value > stored.ForecastUpdatedAt.Value)
            {
                changed.Add("FinancialForecast");
            }

            if (!string.Equals(current.CatalogueRuleVersion, stored.CatalogueRuleVersion, StringComparison.OrdinalIgnoreCase))
            {
                changed.Add("CatalogueRuleVersion");
            }

            return (changed.Count > 0, changed);
        }

        private static FounderProfileSummaryDto? BuildProfileSummary(ProfessionalProfileRecord? profile)
        {
            if (profile == null) return null;
            var vc = profile.VentureContext;
            var skills = profile.Skills?
                .Select(s => s.Name)
                .Take(5)
                .ToList() ?? new List<string>();

            return new FounderProfileSummaryDto
            {
                CurrentSituation = vc?.CurrentSituation ?? "Active founder",
                WeeklyAvailability = vc?.WeeklyAvailability ?? "Standard",
                PreferredApproach = vc?.LearningPreference ?? vc?.DelegationPreference ?? "Balanced",
                StrongestRelevantCapabilities = skills
            };
        }
    }
}
