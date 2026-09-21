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
    public class SkillsResolutionService : ISkillsResolutionService
    {
        private readonly ICreatorJourneyService _journeys;
        private readonly INeedsAnalysisService _needsService;
        private readonly ICapabilityResolutionPolicy _policy;
        private readonly IProfessionalProfileStore? _professionalStore;
        private readonly IProfileCompletenessResolver? _completenessResolver;

        public SkillsResolutionService(
            ICreatorJourneyService journeys,
            INeedsAnalysisService needsService,
            ICapabilityResolutionPolicy policy,
            IProfessionalProfileStore? professionalStore = null,
            IProfileCompletenessResolver? completenessResolver = null)
        {
            _journeys = journeys;
            _needsService = needsService;
            _policy = policy;
            _professionalStore = professionalStore;
            _completenessResolver = completenessResolver;
        }

        public async Task<SkillsPlanResponse> GetSkillsPlanAsync(string userId, string? ideaId = null)
        {
            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var plan = journey.Phase4Data?.SkillsPlan;

            if (plan == null)
            {
                return new SkillsPlanResponse
                {
                    SkillsPlan = null,
                    UpdateAvailable = false,
                    ChangedSources = new List<string>()
                };
            }

            var context = await BuildContextAsync(userId, journey, ideaId);
            var (isStale, changedSources) = DetectStaleness(plan.SourceVersions, context.CurrentSourceVersions);

            return BuildResponse(plan, isStale, changedSources, context);
        }

        public async Task<SkillsPlanResponse> GenerateSkillsPlanAsync(string userId, string? ideaId = null)
        {
            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var existing = journey.Phase4Data?.SkillsPlan;

            // Idempotency: Return existing plan if already generated
            if (existing != null)
            {
                var ctx = await BuildContextAsync(userId, journey, ideaId);
                var (isStale, changed) = DetectStaleness(existing.SourceVersions, ctx.CurrentSourceVersions);
                return BuildResponse(existing, isStale, changed, ctx);
            }

            // Enforce domain gates (must have completed Phase 3, HumainX, and non-stale snapshot, roadmap & needs)
            await EnforceGateAsync(userId, ideaId);

            var context = await BuildContextAsync(userId, journey, ideaId);
            var newPlan = ExecuteDerivation(context, existingPlan: null);

            // Single source of truth: Persisted strictly on CreatorJourney
            await _journeys.SetPhase4SkillsPlanAsync(userId, newPlan, ideaId);

            return BuildResponse(newPlan, updateAvailable: false, changedSources: new List<string>(), context);
        }

        public async Task<SkillsPlanResponse> RefreshSkillsPlanAsync(string userId, string? ideaId = null)
        {
            await EnforceGateAsync(userId, ideaId);

            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var existing = journey.Phase4Data?.SkillsPlan;

            var context = await BuildContextAsync(userId, journey, ideaId);
            var refreshedPlan = ExecuteDerivation(context, existingPlan: existing);

            // Single source of truth: Persisted on CreatorJourney
            await _journeys.SetPhase4SkillsPlanAsync(userId, refreshedPlan, ideaId);

            return BuildResponse(refreshedPlan, updateAvailable: false, changedSources: new List<string>(), context);
        }

        public async Task<SkillsPlanResponse> UpdateResolutionAsync(string userId, string resolutionKey, UpdateResolutionRequest request)
        {
            request ??= new UpdateResolutionRequest();
            var journey = await _journeys.GetOrCreateComposedAsync(userId, request.IdeaId);
            if (journey == null)
                throw new KeyNotFoundException($"Journey for user '{userId}' not found.");

            var plan = journey.Phase4Data?.SkillsPlan;

            if (plan == null)
                throw new KeyNotFoundException("Skills plan has not been generated yet.");

            var resolution = plan.Resolutions.FirstOrDefault(r => string.Equals(r.Key, resolutionKey, StringComparison.OrdinalIgnoreCase));
            if (resolution == null)
                throw new KeyNotFoundException($"Resolution '{resolutionKey}' not found in skills plan.");

            // Mandatory verification safety lock (Correction 6 & Rule 46): Cannot override statutory verification with Learn or Delegate
            if (resolution.IsMandatoryVerification &&
                (string.Equals(request.FounderDecision, FounderDecisionChoices.ChooseLearn, StringComparison.OrdinalIgnoreCase) ||
                 string.Equals(request.FounderDecision, FounderDecisionChoices.ChooseDelegate, StringComparison.OrdinalIgnoreCase)))
            {
                throw new InvalidOperationException("Statutory verification cannot be waived or overridden with learning or delegation.");
            }

            if (!string.IsNullOrWhiteSpace(request.FounderDecision))
            {
                resolution.FounderDecision = request.FounderDecision;
                resolution.FounderEdited = true;
            }

            if (request.FounderNotes != null)
            {
                resolution.FounderNotes = request.FounderNotes;
                resolution.FounderEdited = true;
            }

            if (!string.IsNullOrWhiteSpace(request.CustomTargetLevel))
            {
                resolution.CustomTargetLevel = request.CustomTargetLevel;
                resolution.FounderEdited = true;
            }

            resolution.UpdatedAt = DateTime.UtcNow;
            plan.FounderEdited = true;
            plan.UpdatedAt = DateTime.UtcNow;

            await _journeys.SetPhase4SkillsPlanAsync(userId, plan, request.IdeaId);

            var context = await BuildContextAsync(userId, journey, request.IdeaId);
            var (isStale, changedSources) = DetectStaleness(plan.SourceVersions, context.CurrentSourceVersions);
            return BuildResponse(plan, isStale, changedSources, context);
        }

        private async Task EnforceGateAsync(string userId, string? ideaId)
        {
            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);

            // Phase 3 gate
            var status = await _journeys.ComputePhaseStatusAsync(journey, phase1Complete: true);
            if (status.Phase3 == null || !string.Equals(status.Phase3.Status, "completed", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Phase 3 Business Plan Intelligence must be completed before generating your Skills Plan.");
            }

            // HumainX gate
            if (_professionalStore != null && _completenessResolver != null)
            {
                var profile = await _professionalStore.GetByUserIdAsync(userId, CancellationToken.None);
                var check = _completenessResolver.Resolve(profile);
                if (!check.Phase4Ready)
                {
                    throw new InvalidOperationException("Your HumainX professional profile requires skills and venture context before building your Skills Plan.");
                }
            }

            // Snapshot gate
            if (journey.Phase4Data?.ConstructionSnapshot == null)
            {
                throw new InvalidOperationException("Construction Snapshot must be generated before building your Skills Plan.");
            }

            // Roadmap gate
            if (journey.Phase4Data?.Roadmap == null)
            {
                throw new InvalidOperationException("Operational Roadmap must be generated before building your Skills Plan.");
            }

            // Phase 4.3 Needs Analysis gate (Rule 48: Needs must exist and be current)
            if (journey.Phase4Data?.NeedsAnalysis == null)
            {
                throw new InvalidOperationException("Phase 4.3 Needs & Requirements analysis must be completed before building your Skills Plan.");
            }

            var needsRes = await _needsService.GetNeedsAnalysisAsync(userId, ideaId);
            if (needsRes.UpdateAvailable)
            {
                throw new InvalidOperationException("Your Needs Analysis is stale because upstream sources changed. Please refresh Needs Analysis before building your Skills Plan.");
            }
        }

        private async Task<SkillsResolutionContext> BuildContextAsync(string userId, CreatorJourney journey, string? ideaId)
        {
            var ctx = new SkillsResolutionContext();
            ctx.NeedsAnalysis = journey.Phase4Data?.NeedsAnalysis;
            ctx.OperationalRoadmap = journey.Phase4Data?.Roadmap;

            var p3 = journey.Phase3Data ?? new CreatorPhase3Data();
            ctx.LegalAssessment = p3.LegalAssessment;
            ctx.Formation = p3.FormationGenerator;

            ProfessionalProfileRecord? profile = null;
            if (_professionalStore != null)
            {
                profile = await _professionalStore.GetByUserIdAsync(userId, CancellationToken.None);
            }

            if (profile != null)
            {
                ctx.ProfessionalProfile = profile;
                ctx.Skills = profile.Skills ?? new List<ProfileSkill>();
                ctx.Experiences = profile.Experiences ?? new List<ProfessionalExperience>();
                ctx.Education = profile.Education ?? new List<ProfessionalEducation>();
                ctx.Languages = profile.LanguageProficiencies ?? new List<ProfessionalLanguage>();
                ctx.VentureContext = profile.VentureContext;
            }

            ctx.CurrentSourceVersions = new SkillsSourceVersions
            {
                NeedsAnalysisUpdatedAt = journey.Phase4Data?.NeedsAnalysis?.UpdatedAt,
                OperationalRoadmapUpdatedAt = journey.Phase4Data?.Roadmap?.UpdatedAt,
                ProfessionalProfileUpdatedAt = profile?.UpdatedAt,
                WeeklyAvailability = profile?.VentureContext?.WeeklyAvailability ?? string.Empty,
                LearningPreference = profile?.VentureContext?.LearningPreference ?? string.Empty,
                DelegationPreference = profile?.VentureContext?.DelegationPreference ?? string.Empty,
                LegalAssessmentUpdatedAt = p3.LegalAssessment?.EvaluatedAt,
                FormationUpdatedAt = journey.UpdatedAt
            };

            return ctx;
        }

        private static (bool IsStale, List<string> ChangedSources) DetectStaleness(
            SkillsSourceVersions stored,
            SkillsSourceVersions current)
        {
            var changed = new List<string>();

            if (current.NeedsAnalysisUpdatedAt.HasValue && stored.NeedsAnalysisUpdatedAt.HasValue &&
                current.NeedsAnalysisUpdatedAt.Value > stored.NeedsAnalysisUpdatedAt.Value)
            {
                changed.Add("NeedsAnalysis");
            }

            if (current.OperationalRoadmapUpdatedAt.HasValue && stored.OperationalRoadmapUpdatedAt.HasValue &&
                current.OperationalRoadmapUpdatedAt.Value > stored.OperationalRoadmapUpdatedAt.Value)
            {
                changed.Add("OperationalRoadmap");
            }

            if (current.ProfessionalProfileUpdatedAt.HasValue && stored.ProfessionalProfileUpdatedAt.HasValue &&
                current.ProfessionalProfileUpdatedAt.Value > stored.ProfessionalProfileUpdatedAt.Value)
            {
                changed.Add("ProfessionalProfile");
            }

            if (!string.Equals(current.WeeklyAvailability, stored.WeeklyAvailability, StringComparison.OrdinalIgnoreCase))
            {
                changed.Add("WeeklyAvailability");
            }

            if (!string.Equals(current.LearningPreference, stored.LearningPreference, StringComparison.OrdinalIgnoreCase))
            {
                changed.Add("LearningPreference");
            }

            if (!string.Equals(current.DelegationPreference, stored.DelegationPreference, StringComparison.OrdinalIgnoreCase))
            {
                changed.Add("DelegationPreference");
            }

            if (current.LegalAssessmentUpdatedAt.HasValue && stored.LegalAssessmentUpdatedAt.HasValue &&
                current.LegalAssessmentUpdatedAt.Value > stored.LegalAssessmentUpdatedAt.Value)
            {
                changed.Add("LegalAssessment");
            }

            return (changed.Count > 0, changed);
        }

        private SkillsPlan ExecuteDerivation(SkillsResolutionContext context, SkillsPlan? existingPlan)
        {
            var existingResolutions = existingPlan?.Resolutions?.ToDictionary(r => r.Key) ?? new Dictionary<string, CapabilityResolution>();
            var existingActions = existingPlan?.LearningPlan?.ToDictionary(a => a.ResolutionKey) ?? new Dictionary<string, LearningAction>();

            var resolutions = new List<CapabilityResolution>();
            var learningPlan = new List<LearningAction>();
            var delegationPlan = new List<DelegationRequirement>();
            var verificationPlan = new List<VerificationRequirement>();
            var coveredCapabilities = new List<CoveredCapability>();

            var needsAnalysis = context.NeedsAnalysis ?? new NeedsAnalysis();

            // 1. PASS-THROUGH PHASE 4.3 ALREADY COVERED REQUIREMENTS (Correction 4)
            // Covered requirements from Phase 4.3 do not undergo redundant Learn/Delegate re-analysis
            foreach (var coveredNeed in needsAnalysis.CoveredRequirements)
            {
                var resKey = $"resolve.{SanitizeKey(coveredNeed.Key)}";
                var coveredRes = new CapabilityResolution
                {
                    Key = resKey,
                    NeedKey = coveredNeed.Key,
                    Capability = coveredNeed.CapabilityRequired ?? coveredNeed.Title,
                    NeedCategory = coveredNeed.Category,
                    ResolutionMode = ResolutionModes.Covered,
                    Confidence = ResolutionConfidence.High,
                    ReasonCode = ResolutionReasonCodes.ExistingCapabilitySufficient,
                    Why = coveredNeed.WhyNeeded,
                    Priority = coveredNeed.Priority,
                    Timing = coveredNeed.Timing,
                    Blocking = false,
                    Source = coveredNeed.Source ?? new List<string>(),
                    GeneratedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                // Reconcile founder notes if previously recorded
                if (existingResolutions.TryGetValue(resKey, out var prevCovered))
                {
                    coveredRes.FounderNotes = prevCovered.FounderNotes;
                    coveredRes.FounderEdited = prevCovered.FounderEdited;
                }

                resolutions.Add(coveredRes);
                coveredCapabilities.Add(new CoveredCapability
                {
                    ResolutionKey = resKey,
                    Capability = coveredRes.Capability,
                    CoverageSource = "Phase4.3Covered",
                    Evidence = coveredRes.Why,
                    Source = coveredRes.Source
                });
            }

            // 2. PROCESS ACTIVE UNRESOLVED REQUIREMENTS (Correction 4)
            foreach (var need in needsAnalysis.ActiveNeeds)
            {
                var resolution = _policy.ResolveNeed(need, context);

                // RECONCILIATION: Preserve Founder Decisions and Notes across refreshes (Correction 6)
                if (existingResolutions.TryGetValue(resolution.Key, out var prev))
                {
                    // If mandatory verification, ensure founder cannot retain an invalid Learn/Delegate override
                    if (!resolution.IsMandatoryVerification || prev.FounderDecision == FounderDecisionChoices.ChooseVerify || prev.FounderDecision == FounderDecisionChoices.AcceptedRecommendation)
                    {
                        resolution.FounderDecision = prev.FounderDecision;
                    }
                    resolution.FounderNotes = prev.FounderNotes;
                    resolution.FounderEdited = prev.FounderEdited;
                    resolution.CustomTargetLevel = prev.CustomTargetLevel;
                }

                resolutions.Add(resolution);

                // Derive Action Plans based on Resolution Mode
                switch (resolution.ResolutionMode)
                {
                    case ResolutionModes.Learn:
                        var action = _policy.GenerateLearningAction(resolution);
                        if (existingActions.TryGetValue(resolution.Key, out var prevAction))
                        {
                            action.FounderStatus = prevAction.FounderStatus;
                            action.FounderNotes = prevAction.FounderNotes;
                            action.FounderEdited = prevAction.FounderEdited;
                        }
                        resolution.LearningAction = action;
                        learningPlan.Add(action);
                        break;

                    case ResolutionModes.Delegate:
                        var del = _policy.GenerateDelegationRequirement(resolution);
                        resolution.DelegationRequirement = del;
                        delegationPlan.Add(del);
                        break;

                    case ResolutionModes.Verify:
                        var ver = _policy.GenerateVerificationRequirement(resolution);
                        resolution.VerificationRequirement = ver;
                        verificationPlan.Add(ver);
                        break;

                    case ResolutionModes.Covered:
                        coveredCapabilities.Add(_policy.GenerateCoveredCapability(resolution));
                        break;
                }
            }

            var learnCount = resolutions.Count(r => r.ResolutionMode == ResolutionModes.Learn);
            var delegateCount = resolutions.Count(r => r.ResolutionMode == ResolutionModes.Delegate);
            var verifyCount = resolutions.Count(r => r.ResolutionMode == ResolutionModes.Verify);
            var coveredCount = resolutions.Count(r => r.ResolutionMode == ResolutionModes.Covered);
            var needsReviewCount = resolutions.Count(r => r.ResolutionMode == ResolutionModes.NeedsReview);

            var summary = SynthesizeSummary(learnCount, delegateCount, verifyCount, coveredCount, needsReviewCount);

            return new SkillsPlan
            {
                Status = "Completed",
                GeneratedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Summary = summary,
                Resolutions = resolutions,
                LearningPlan = learningPlan,
                DelegationPlan = delegationPlan,
                VerificationPlan = verificationPlan,
                CoveredCapabilities = coveredCapabilities,
                SourceVersions = context.CurrentSourceVersions,
                FounderEdited = existingPlan?.FounderEdited ?? false,
                TotalResolutions = resolutions.Count,
                LearnCount = learnCount,
                DelegateCount = delegateCount,
                VerifyCount = verifyCount,
                CoveredCount = coveredCount,
                NeedsReviewCount = needsReviewCount
            };
        }

        private static string SynthesizeSummary(int learn, int del, int verify, int covered, int review)
        {
            var parts = new List<string>();
            if (learn > 0) parts.Add($"{learn} capability to learn");
            if (del > 0) parts.Add($"{del} specialized area recommended for delegation");
            if (verify > 0) parts.Add($"{verify} mandatory professional verification");
            if (covered > 0) parts.Add($"{covered} requirement already covered by your profile and team");
            if (review > 0) parts.Add($"{review} item requiring review");

            return string.Join("; ", parts) + ".";
        }

        private static SkillsPlanResponse BuildResponse(
            SkillsPlan plan,
            bool updateAvailable,
            List<string> changedSources,
            SkillsResolutionContext context)
        {
            var vc = context.VentureContext;
            var strongestSkills = (context.Skills ?? new List<ProfileSkill>())
                .Where(s => string.Equals(s.Level, "Advanced", StringComparison.OrdinalIgnoreCase) ||
                            string.Equals(s.Level, "Comfortable", StringComparison.OrdinalIgnoreCase))
                .Select(s => s.Name)
                .Take(5)
                .ToList();

            var preferredApproach = "Balanced execution";
            if (!string.IsNullOrWhiteSpace(vc?.LearningPreference)) preferredApproach = vc.LearningPreference;
            else if (!string.IsNullOrWhiteSpace(vc?.DelegationPreference)) preferredApproach = vc.DelegationPreference;

            var profileContext = new FounderProfileSummaryDto
            {
                CurrentSituation = vc?.CurrentSituation ?? "Active founder",
                WeeklyAvailability = vc?.WeeklyAvailability ?? "Standard",
                PreferredApproach = preferredApproach,
                StrongestRelevantCapabilities = strongestSkills
            };

            return new SkillsPlanResponse
            {
                SkillsPlan = plan,
                UpdateAvailable = updateAvailable,
                ChangedSources = changedSources,
                ProfileContext = profileContext,
                LearnCount = plan.LearnCount,
                DelegateCount = plan.DelegateCount,
                VerifyCount = plan.VerifyCount,
                CoveredCount = plan.CoveredCount,
                NeedsReviewCount = plan.NeedsReviewCount
            };
        }

        private static string SanitizeKey(string key)
        {
            return (key ?? string.Empty).ToLowerInvariant().Replace(' ', '-').Replace('.', '-');
        }
    }
}
