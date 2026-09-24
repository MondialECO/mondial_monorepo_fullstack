using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Models.DatabaseModels.Phase4;
using WebApp.Models.Phase4;
using WebApp.Services.Interface;
using WebApp.Services.Repository.Ai;

namespace WebApp.Services.Implementations
{
    public class OperationalRoadmapService : IOperationalRoadmapService
    {
        private readonly ICreatorJourneyService _journeys;
        private readonly IConstructionSnapshotService _snapshotService;
        private readonly IRoadmapScheduler _scheduler;
        private readonly IProfessionalProfileStore? _professionalStore;
        private readonly IProfileCompletenessResolver? _completenessResolver;
        private readonly IForecastSessionStore? _forecasts;
        private readonly IBusinessPlanSessionStore? _businessPlans;

        public OperationalRoadmapService(
            ICreatorJourneyService journeys,
            IConstructionSnapshotService snapshotService,
            IRoadmapScheduler scheduler,
            IProfessionalProfileStore? professionalStore = null,
            IProfileCompletenessResolver? completenessResolver = null,
            IForecastSessionStore? forecasts = null,
            IBusinessPlanSessionStore? businessPlans = null)
        {
            _journeys = journeys;
            _snapshotService = snapshotService;
            _scheduler = scheduler;
            _professionalStore = professionalStore;
            _completenessResolver = completenessResolver;
            _forecasts = forecasts;
            _businessPlans = businessPlans;
        }

        public async Task<OperationalRoadmapResponse> GetRoadmapAsync(string userId, string? ideaId = null)
        {
            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var roadmap = journey.Phase4Data?.Roadmap;

            var context = await BuildContextAsync(userId, journey, ideaId);

            if (roadmap == null)
            {
                var capacityTier = _scheduler.ResolveCapacityTier(context.WeeklyAvailability);
                return new OperationalRoadmapResponse
                {
                    Roadmap = null,
                    UpdateAvailable = false,
                    ChangedSources = new List<string>(),
                    WeeklyAvailability = context.WeeklyAvailability,
                    CapacityTier = capacityTier.ToString(),
                    MaxNowTasks = GetMaxNowTasks(capacityTier),
                    CapacityMessage = GetCapacityMessage(capacityTier),
                    IdeaVersion = journey.IdeaVersion
                };
            }

            PopulateUnblocks(roadmap.Tasks);
            var (isStale, changedSources) = DetectStaleness(roadmap.SourceVersions, context);

            return BuildResponse(roadmap, isStale, changedSources, context, journey.IdeaVersion);
        }

        public async Task<OperationalRoadmapResponse> GenerateRoadmapAsync(string userId, string? ideaId = null)
        {
            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var existingRoadmap = journey.Phase4Data?.Roadmap;

            // Idempotency: Return existing roadmap if already generated
            if (existingRoadmap != null)
            {
                var ctx = await BuildContextAsync(userId, journey, ideaId);
                PopulateUnblocks(existingRoadmap.Tasks);
                var (isStale, changed) = DetectStaleness(existingRoadmap.SourceVersions, ctx);
                return BuildResponse(existingRoadmap, isStale, changed, ctx, journey.IdeaVersion);
            }

            // Enforce domain gates
            await ValidatePrerequisitesAsync(userId, journey, ideaId);

            var context = await BuildContextAsync(userId, journey, ideaId);
            var newRoadmap = BuildRoadmapInternal(context, existingRoadmap: null);

            var savedJourney = await _journeys.SetPhase4RoadmapAsync(userId, newRoadmap, ideaId);

            PopulateUnblocks(newRoadmap.Tasks);
            return BuildResponse(newRoadmap, updateAvailable: false, changedSources: new List<string>(), context, savedJourney?.IdeaVersion ?? journey.IdeaVersion);
        }

        public async Task<OperationalRoadmapResponse> RefreshRoadmapAsync(string userId, string? ideaId = null)
        {
            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var existingRoadmap = journey.Phase4Data?.Roadmap;

            await ValidatePrerequisitesAsync(userId, journey, ideaId);

            var context = await BuildContextAsync(userId, journey, ideaId);
            var refreshedRoadmap = BuildRoadmapInternal(context, existingRoadmap);

            var savedJourney = await _journeys.SetPhase4RoadmapAsync(userId, refreshedRoadmap, ideaId);

            PopulateUnblocks(refreshedRoadmap.Tasks);
            return BuildResponse(refreshedRoadmap, updateAvailable: false, changedSources: new List<string>(), context, savedJourney?.IdeaVersion ?? journey.IdeaVersion);
        }

        public async Task<OperationalRoadmapResponse> UpdateTaskStateAsync(string userId, UpdateRoadmapTaskRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.TaskId))
            {
                throw new ArgumentException("TaskId is required for updating task state.");
            }

            var journey = await _journeys.GetOrCreateComposedAsync(userId, request.IdeaId);
            var roadmap = journey.Phase4Data?.Roadmap;

            if (roadmap == null)
            {
                throw new InvalidOperationException("Roadmap has not been generated yet.");
            }

            var task = roadmap.Tasks.FirstOrDefault(t => t.Id == request.TaskId || t.Key == request.TaskId);
            if (task == null)
            {
                throw new KeyNotFoundException($"Task with ID '{request.TaskId}' not found in roadmap.");
            }

            // Update founder-controlled state
            if (!string.IsNullOrWhiteSpace(request.Status))
            {
                task.Status = request.Status;
                task.FounderEdited = true;
                task.UpdatedAt = DateTime.UtcNow;
            }

            if (request.FounderNotes != null)
            {
                task.FounderNotes = request.FounderNotes;
                task.FounderEdited = true;
                task.UpdatedAt = DateTime.UtcNow;
            }

            if (!string.IsNullOrWhiteSpace(request.TargetWindow))
            {
                task.TargetWindow = request.TargetWindow;
                task.FounderEdited = true;
                task.UpdatedAt = DateTime.UtcNow;
            }

            if (!string.IsNullOrWhiteSpace(request.EstimatedEffort))
            {
                task.EstimatedEffort = request.EstimatedEffort;
                task.FounderEdited = true;
                task.UpdatedAt = DateTime.UtcNow;
            }

            if (request.EstimatedEffortHours.HasValue)
            {
                task.EstimatedEffortHours = request.EstimatedEffortHours.Value;
                task.FounderEdited = true;
                task.UpdatedAt = DateTime.UtcNow;
            }

            roadmap.FounderEdited = true;
            roadmap.UpdatedAt = DateTime.UtcNow;

            // Recalculate Next Best Action dynamically
            roadmap.NextBestAction = _scheduler.SelectNextBestAction(roadmap.Tasks);

            // Re-group into stages for response
            roadmap.Stages = RegroupStages(roadmap.Tasks);

            var savedJourney = await _journeys.SetPhase4RoadmapAsync(userId, roadmap, request.IdeaId);

            var context = await BuildContextAsync(userId, journey, request.IdeaId);
            PopulateUnblocks(roadmap.Tasks);
            var (isStale, changedSources) = DetectStaleness(roadmap.SourceVersions, context);

            return BuildResponse(roadmap, isStale, changedSources, context, savedJourney?.IdeaVersion ?? journey.IdeaVersion);
        }

        public async Task<OperationalRoadmapResponse> ActivateRoadmapAsync(string userId, string? ideaId = null)
        {
            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var roadmap = journey.Phase4Data?.Roadmap;

            await ValidatePrerequisitesAsync(userId, journey, ideaId);
            var context = await BuildContextAsync(userId, journey, ideaId);

            if (roadmap == null)
            {
                roadmap = BuildRoadmapInternal(context, existingRoadmap: null);
            }

            roadmap.Status = "Active";
            roadmap.UpdatedAt = DateTime.UtcNow;

            var savedJourney = await _journeys.SetPhase4RoadmapAsync(userId, roadmap, ideaId);

            PopulateUnblocks(roadmap.Tasks);
            return BuildResponse(roadmap, updateAvailable: false, changedSources: new List<string>(), context, savedJourney?.IdeaVersion ?? journey.IdeaVersion);
        }

        public async Task<OperationalRoadmapResponse> UpdateAvailabilityAsync(string userId, UpdateAvailabilityRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.WeeklyAvailability))
            {
                throw new ArgumentException("WeeklyAvailability is required.");
            }

            // 1. Update Professional Profile
            if (_professionalStore != null)
            {
                var prof = await _professionalStore.GetByUserIdAsync(userId, CancellationToken.None);
                if (prof != null)
                {
                    prof.VentureContext ??= new ProfileVentureContext();
                    prof.VentureContext.WeeklyAvailability = request.WeeklyAvailability.Trim();
                    prof.UpdatedAt = DateTime.UtcNow;
                    await _professionalStore.UpsertAsync(prof, cancellationToken: CancellationToken.None);
                }
            }

            var journey = await _journeys.GetOrCreateComposedAsync(userId, request.IdeaId);
            var existingRoadmap = journey.Phase4Data?.Roadmap;

            var context = await BuildContextAsync(userId, journey, request.IdeaId);
            context.WeeklyAvailability = request.WeeklyAvailability.Trim();

            if (existingRoadmap != null)
            {
                // Re-sequence with new capacity tier while preserving existing tasks and edits
                var refreshedRoadmap = BuildRoadmapInternal(context, existingRoadmap);
                var savedJourney = await _journeys.SetPhase4RoadmapAsync(userId, refreshedRoadmap, request.IdeaId);
                PopulateUnblocks(refreshedRoadmap.Tasks);
                return BuildResponse(refreshedRoadmap, updateAvailable: false, changedSources: new List<string>(), context, savedJourney?.IdeaVersion ?? journey.IdeaVersion);
            }
            else
            {
                var newRoadmap = BuildRoadmapInternal(context, existingRoadmap: null);
                var savedJourney = await _journeys.SetPhase4RoadmapAsync(userId, newRoadmap, request.IdeaId);
                PopulateUnblocks(newRoadmap.Tasks);
                return BuildResponse(newRoadmap, updateAvailable: false, changedSources: new List<string>(), context, savedJourney?.IdeaVersion ?? journey.IdeaVersion);
            }
        }

        public async Task<OperationalRoadmapResponse> KeepCurrentRoadmapAsync(string userId, string? ideaId = null)
        {
            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var roadmap = journey.Phase4Data?.Roadmap;

            if (roadmap == null)
            {
                throw new InvalidOperationException("Roadmap has not been generated yet.");
            }

            var context = await BuildContextAsync(userId, journey, ideaId);
            roadmap.SourceVersions = context.CurrentSourceVersions;
            roadmap.UpdatedAt = DateTime.UtcNow;

            var savedJourney = await _journeys.SetPhase4RoadmapAsync(userId, roadmap, ideaId);

            PopulateUnblocks(roadmap.Tasks);
            return BuildResponse(roadmap, updateAvailable: false, changedSources: new List<string>(), context, savedJourney?.IdeaVersion ?? journey.IdeaVersion);
        }

        private async Task ValidatePrerequisitesAsync(string userId, CreatorJourney journey, string? ideaId)
        {
            // 1. Phase 3 Complete
            var phaseStatus = await _journeys.ComputePhaseStatusAsync(journey, phase1Complete: true);
            if (phaseStatus?.Phase3?.Status != "completed")
            {
                throw new InvalidOperationException("Phase 3 must be completed before generating Phase 4.2 Operational Roadmap.");
            }

            // 2. HumainX Profile Phase 4 Ready
            if (_professionalStore != null && _completenessResolver != null)
            {
                var prof = await _professionalStore.GetByUserIdAsync(userId, CancellationToken.None);
                var comp = _completenessResolver.Resolve(prof);
                if (!comp.Phase4Ready)
                {
                    throw new InvalidOperationException(
                        $"HumainX profile must be completed for Phase 4. Missing: {string.Join(", ", comp.MissingForPhase4)}");
                }
            }

            // 3. Construction Snapshot exists
            if (journey.Phase4Data?.ConstructionSnapshot == null)
            {
                throw new InvalidOperationException(
                    "Phase 4.1 Construction Snapshot must be generated before building the Operational Roadmap.");
            }
        }

        private async Task<RoadmapContext> BuildContextAsync(string userId, CreatorJourney journey, string? ideaId)
        {
            var p3 = journey.Phase3Data ?? new CreatorPhase3Data();
            var snapshot = journey.Phase4Data?.ConstructionSnapshot ?? new ConstructionSnapshot();

            ForecastSession? forecast = null;
            if (_forecasts != null && !string.IsNullOrEmpty(p3.ForecastSessionId))
            {
                forecast = await _forecasts.GetOwnedAsync(p3.ForecastSessionId, userId);
            }

            BusinessPlanSession? plan = null;
            if (_businessPlans != null && !string.IsNullOrEmpty(p3.BusinessPlanSessionId))
            {
                plan = await _businessPlans.GetOwnedAsync(p3.BusinessPlanSessionId, userId);
            }

            ProfessionalProfileRecord? profile = null;
            if (_professionalStore != null)
            {
                profile = await _professionalStore.GetByUserIdAsync(userId, CancellationToken.None);
            }

            var venture = profile?.VentureContext;

            var versions = new Phase4SourceVersions
            {
                ProjectVersion = journey.Project.CurrentVersion,
                ProjectUpdatedAt = DateTime.UtcNow,
                MarketStudySessionId = p3.MarketStudySessionId,
                BusinessModelSessionId = p3.BusinessModelSessionId,
                ForecastSessionId = p3.ForecastSessionId,
                ForecastVersion = forecast?.CurrentVersion ?? 1,
                ForecastUpdatedAt = forecast?.UpdatedAt,
                BusinessPlanSessionId = p3.BusinessPlanSessionId,
                BusinessPlanVersion = plan?.CurrentVersion ?? 1,
                BusinessPlanUpdatedAt = plan?.UpdatedAt,
                LegalChecklistCompletedCount = p3.LegalAssessment?.Items?.Count(i => i.Status == "completed") ?? (p3.LegalChecklist?.CompletedCount ?? 0),
                LegalAssessmentUpdatedAt = p3.LegalAssessment?.EvaluatedAt,
                FormationVersion = p3.FormationGenerator != null ? 1 : 0,
                FormationUpdatedAt = journey.UpdatedAt,
                ProfessionalProfileUpdatedAt = profile?.UpdatedAt ?? DateTime.UtcNow
            };

            return new RoadmapContext
            {
                UserId = userId,
                IdeaId = ideaId ?? string.Empty,
                Project = journey.Project,
                ConstructionSnapshot = snapshot,
                CurrentSourceVersions = versions,
                Forecast = forecast,
                LegalAssessment = p3.LegalAssessment,
                LegalChecklist = p3.LegalChecklist,
                Formation = p3.FormationGenerator,
                BusinessPlan = plan,
                Profile = profile,
                VentureContext = venture,
                WeeklyAvailability = venture?.WeeklyAvailability ?? "10–20 hours/week",
                CurrentSituation = venture?.CurrentSituation ?? string.Empty,
                PreviousExperience = venture?.PreviousEntrepreneurialExperience ?? string.Empty
            };
        }

        private OperationalRoadmap BuildRoadmapInternal(RoadmapContext context, OperationalRoadmap? existingRoadmap)
        {
            var capacity = _scheduler.ResolveCapacityTier(context.WeeklyAvailability);

            // 1. Generate Task Candidates from Snapshot, Legal, Formation, Finance
            var candidates = GenerateTaskCandidates(context);

            // 2. Reconcile with existing founder-controlled state if refreshing
            if (existingRoadmap?.Tasks != null && existingRoadmap.Tasks.Count > 0)
            {
                var existingByKey = existingRoadmap.Tasks
                    .Where(t => !string.IsNullOrEmpty(t.Key))
                    .ToDictionary(t => t.Key, t => t);

                foreach (var candidate in candidates)
                {
                    if (existingByKey.TryGetValue(candidate.Key, out var existingTask))
                    {
                        // Preserve founder modifications
                        candidate.Id = existingTask.Id;
                        candidate.Status = existingTask.Status;
                        candidate.FounderEdited = existingTask.FounderEdited;
                        candidate.FounderNotes = existingTask.FounderNotes;
                        candidate.UpdatedAt = existingTask.UpdatedAt;
                        if (existingTask.Dependencies != null && existingTask.Dependencies.Count > 0)
                        {
                            foreach (var dep in existingTask.Dependencies)
                            {
                                if (!candidate.Dependencies.Contains(dep))
                                {
                                    candidate.Dependencies.Add(dep);
                                }
                            }
                        }
                    }
                }
            }

            // 3. Establish and resolve explicit dependencies across reconciled candidates
            WireDependencies(candidates, context);

            // 4. Schedule and order tasks
            var scheduledTasks = _scheduler.ScheduleTasks(candidates, capacity, context);

            // 4. Group by stage
            var stageGroups = RegroupStages(scheduledTasks);

            // 5. Select Next Best Action
            var nextBestAction = _scheduler.SelectNextBestAction(scheduledTasks);

            // 6. Synthesize Roadmap Summary
            string summary = GenerateRoadmapSummary(scheduledTasks, capacity, nextBestAction);

            return new OperationalRoadmap
            {
                Status = "Active",
                GeneratedAt = existingRoadmap?.GeneratedAt ?? DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                RoadmapSummary = summary,
                Stages = stageGroups,
                Tasks = scheduledTasks,
                NextBestAction = nextBestAction,
                SourceVersions = context.CurrentSourceVersions,
                FounderEdited = existingRoadmap?.FounderEdited ?? false
            };
        }

        private List<RoadmapTask> GenerateTaskCandidates(RoadmapContext context)
        {
            var candidates = new List<RoadmapTask>();
            var snapshot = context.ConstructionSnapshot;

            // 1. Map Critical Snapshot Items (Immediate priority)
            if (snapshot.CriticalItems != null)
            {
                foreach (var item in snapshot.CriticalItems)
                {
                    var taskKey = item.Key;
                    if (string.IsNullOrEmpty(taskKey)) taskKey = $"critical.{Slugify(item.Title)}";
                    candidates.Add(new RoadmapTask
                    {
                        Key = taskKey,
                        Title = $"Resolve {item.Title}",
                        Description = item.Reason,
                        Category = MapCategory(item.Category),
                        Priority = RoadmapTaskPriority.Critical,
                        Blocking = item.Blocking,
                        Why = item.Reason,
                        ExpectedResult = $"Concrete resolution and verified implementation of {item.Title}.",
                        EstimatedEffort = RoadmapTaskEffort.Large,
                        EstimatedEffortHours = 6.0,
                        Source = new List<string>(item.Source) { "Construction Snapshot" },
                        SourceReference = new List<string>(item.SourceReference) { item.Key },
                        RelatedSnapshotItemKey = item.Key,
                        EarliestStart = ResolveSnapshotItemEarliestStage(item, isCritical: true)
                    });
                }
            }

            // 2. Map Missing & High Priority Snapshot Items
            if (snapshot.MissingItems != null)
            {
                foreach (var item in snapshot.MissingItems)
                {
                    var taskKey = item.Key;
                    if (string.IsNullOrEmpty(taskKey)) taskKey = $"missing.{Slugify(item.Title)}";
                    // Deduplicate if already created under critical
                    if (candidates.Any(c => c.Key == taskKey)) continue;

                    candidates.Add(new RoadmapTask
                    {
                        Key = taskKey,
                        Title = $"Structure {item.Title}",
                        Description = item.Reason,
                        Category = MapCategory(item.Category),
                        Priority = item.Priority == ConstructionItemPriority.High ? RoadmapTaskPriority.High : RoadmapTaskPriority.Medium,
                        Blocking = item.Blocking,
                        Why = item.Reason,
                        ExpectedResult = $"Structured capability and asset readiness for {item.Title}.",
                        EstimatedEffort = RoadmapTaskEffort.Medium,
                        EstimatedEffortHours = 3.5,
                        Source = new List<string>(item.Source) { "Construction Snapshot" },
                        SourceReference = new List<string>(item.SourceReference) { item.Key },
                        RelatedSnapshotItemKey = item.Key,
                        EarliestStart = ResolveSnapshotItemEarliestStage(item, isCritical: false)
                    });
                }
            }

            // 3. Map Partial & NeedsReview Snapshot Items
            if (snapshot.PartialItems != null)
            {
                foreach (var item in snapshot.PartialItems)
                {
                    var taskKey = item.Key;
                    if (string.IsNullOrEmpty(taskKey)) taskKey = $"review.{Slugify(item.Title)}";
                    if (candidates.Any(c => c.Key == taskKey)) continue;

                    candidates.Add(new RoadmapTask
                    {
                        Key = taskKey,
                        Title = item.Status == ConstructionItemStatus.NeedsReview ? $"Review {item.Title}" : $"Complete {item.Title}",
                        Description = item.Reason,
                        Category = MapCategory(item.Category),
                        Priority = item.Status == ConstructionItemStatus.NeedsReview ? RoadmapTaskPriority.High : RoadmapTaskPriority.Medium,
                        Blocking = false,
                        Why = item.Reason,
                        ExpectedResult = $"Reviewed, updated, and approved status for {item.Title}.",
                        EstimatedEffort = RoadmapTaskEffort.Small,
                        EstimatedEffortHours = 1.5,
                        Source = new List<string>(item.Source) { "Construction Snapshot" },
                        SourceReference = new List<string>(item.SourceReference) { item.Key },
                        RelatedSnapshotItemKey = item.Key,
                        EarliestStart = ResolveSnapshotItemEarliestStage(item, isCritical: false)
                    });
                }
            }

            // 4. Map Legal Requirements (from LegalAssessment or fallback LegalChecklist)
            var legalItems = context.LegalAssessment?.Items ?? context.LegalChecklist?.Items;
            if (legalItems != null)
            {
                foreach (var legalItem in legalItems)
                {
                    if (legalItem.Status == "completed" || legalItem.Status == "not_applicable") continue;

                    var rawId = legalItem.Id ?? legalItem.Title ?? "item";
                    var taskKey = rawId.StartsWith("legal.") ? rawId : $"legal.{Slugify(rawId)}";
                    if (candidates.Any(c => c.Key == taskKey)) continue;

                    bool isDpae = rawId.IndexOf("FR-SOC-002", StringComparison.OrdinalIgnoreCase) >= 0 || rawId.IndexOf("DPAE", StringComparison.OrdinalIgnoreCase) >= 0;
                    string? stage = MapLegalStage(legalItem.Id, legalItem.Stage, legalItem.Category);
                    bool isBlocking = legalItem.Priority?.ToLowerInvariant() == "critical" || legalItem.Stage == "company_creation";
                    bool isExternal = legalItem.Stage == "company_creation" || legalItem.RequiresEvidence;

                    string targetWindow = isDpae
                        ? "Timing unresolved (≤ 8 days before employee start date)"
                        : string.Empty;

                    string whyText = isDpae
                        ? "Statutory requirement (social): Déclaration Préalable à l'Embauche (DPAE) must be submitted to URSSAF at earliest 8 days before the employee's effective start date. Timing is unresolved until an explicit employee start date is established."
                        : $"Statutory requirement ({legalItem.Category}): {legalItem.WhyItApplies}";

                    candidates.Add(new RoadmapTask
                    {
                        Key = taskKey,
                        Title = legalItem.Title ?? rawId,
                        Description = isDpae
                            ? "Mandatory pre-hiring social declaration (DPAE) to URSSAF before onboarding employees. Timing is unresolved until specific employee hiring dates are planned."
                            : (legalItem.WhyItApplies ?? string.Empty),
                        Category = RoadmapCategories.LegalAndAdministration,
                        Priority = legalItem.Priority?.ToLowerInvariant() == "critical" ? RoadmapTaskPriority.Critical : RoadmapTaskPriority.High,
                        Blocking = isBlocking,
                        Why = whyText,
                        ExpectedResult = $"Statutory compliance and administrative clearance for {legalItem.Title}.",
                        EstimatedEffort = legalItem.RequiresEvidence ? RoadmapTaskEffort.Medium : RoadmapTaskEffort.Small,
                        EstimatedEffortHours = legalItem.RequiresEvidence ? 3.5 : 1.5,
                        RequiresExternalAction = isExternal,
                        EstimatedDuration = isExternal ? "3–7 business days" : string.Empty,
                        Source = new List<string> { "Legal Assessment" },
                        SourceReference = new List<string> { rawId },
                        EarliestStart = stage,
                        TargetWindow = !string.IsNullOrEmpty(targetWindow) ? targetWindow : null
                    });
                }
            }

            // 5. Map Company Formation Prerequisite Tasks (Phase 4 Planning linked to Phase 5 Registration Guide)
            if (context.Formation != null && !string.IsNullOrEmpty(context.Formation.SelectedType))
            {
                var formKey = "formation.confirm-structure";
                if (!candidates.Any(c => c.Key == formKey))
                {
                    candidates.Add(new RoadmapTask
                    {
                        Key = formKey,
                        Title = $"Confirm {context.Formation.SelectedType} Entity Formation Plan",
                        Description = $"Review and validate the chosen legal structure ({context.Formation.SelectedType}), initial capital contributions, and founder governance ahead of Phase 5 formal company registration.",
                        Category = RoadmapCategories.Formation,
                        Priority = RoadmapTaskPriority.High,
                        Blocking = true,
                        Why = "Entity structure planning establishes capital allocation and governance rules before filing on INPI Guichet Unique.",
                        ExpectedResult = $"Documented {context.Formation.SelectedType} incorporation plan with founder consensus ready for Phase 5 registration guide execution.",
                        EstimatedEffort = RoadmapTaskEffort.Medium,
                        EstimatedEffortHours = 3.5,
                        RequiresExternalAction = false,
                        EstimatedDuration = "2–5 business days",
                        Source = new List<string> { "Formation & Team" },
                        EarliestStart = RoadmapStages.Now
                    });
                }

                // Map Skill Gaps from Formation assessment
                if (context.Formation.YouNeed != null)
                {
                    foreach (var gap in context.Formation.YouNeed)
                    {
                        var skillLabel = !string.IsNullOrWhiteSpace(gap.Label) ? gap.Label : (gap.SpSpecialty ?? "Specialist");
                        var skillKey = $"skill-gap.{Slugify(skillLabel)}";
                        if (candidates.Any(c => c.Key == skillKey)) continue;

                        candidates.Add(new RoadmapTask
                        {
                            Key = skillKey,
                            Title = $"Engage {skillLabel} Capability",
                            Description = $"Secure {skillLabel} expertise ({gap.SpSpecialty ?? "specialist"}) to support venture development and operational milestones.",
                            Category = RoadmapCategories.Skills,
                            Priority = RoadmapTaskPriority.High,
                            Blocking = false,
                            Why = $"Formation assessment identified a capability gap for {skillLabel}.",
                            ExpectedResult = $"Qualified {skillLabel} contributor, advisor, or service provider contracted.",
                            EstimatedEffort = RoadmapTaskEffort.Medium,
                            EstimatedEffortHours = 3.5,
                            Source = new List<string> { "Formation & Team" },
                            EarliestStart = RoadmapStages.Days30To60
                        });
                    }
                }
            }

            // 6. Establish Logical DAG Dependencies across Tasks with Explicit Resolution
            WireDependencies(candidates, context);

            return candidates;
        }

        private static void WireDependencies(List<RoadmapTask> candidates, RoadmapContext context)
        {
            var taskByKey = candidates.ToDictionary(c => c.Key, c => c);

            // 1. Identify confirmed completed prerequisite keys
            var confirmedCompletedKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            if (context.LegalAssessment?.Items != null)
            {
                foreach (var item in context.LegalAssessment.Items.Where(i => i.Status == "completed"))
                {
                    if (!string.IsNullOrEmpty(item.Id))
                    {
                        confirmedCompletedKeys.Add(item.Id);
                        confirmedCompletedKeys.Add($"legal.{Slugify(item.Id)}");
                        confirmedCompletedKeys.Add(Slugify(item.Id));
                    }
                }
            }
            if (context.LegalChecklist?.Items != null)
            {
                foreach (var item in context.LegalChecklist.Items.Where(i => i.Status == "completed"))
                {
                    if (!string.IsNullOrEmpty(item.Id))
                    {
                        confirmedCompletedKeys.Add(item.Id);
                        confirmedCompletedKeys.Add($"legal.{Slugify(item.Id)}");
                        confirmedCompletedKeys.Add(Slugify(item.Id));
                    }
                }
            }
            if (context.ConstructionSnapshot.ReadyItems != null)
            {
                foreach (var item in context.ConstructionSnapshot.ReadyItems)
                {
                    if (!string.IsNullOrEmpty(item.Key))
                        confirmedCompletedKeys.Add(item.Key);
                }
            }

            // 2. Identify confirmed inapplicable prerequisite keys
            var confirmedInapplicableKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            if (context.LegalAssessment?.Items != null)
            {
                foreach (var item in context.LegalAssessment.Items.Where(i => i.Status == "not_applicable"))
                {
                    if (!string.IsNullOrEmpty(item.Id))
                    {
                        confirmedInapplicableKeys.Add(item.Id);
                        confirmedInapplicableKeys.Add($"legal.{Slugify(item.Id)}");
                        confirmedInapplicableKeys.Add(Slugify(item.Id));
                    }
                }
            }
            var formType = (context.Formation?.SelectedType ?? string.Empty).ToUpperInvariant();
            if (formType.Contains("EI") || formType.Contains("MICRO") || formType.Contains("AUTO"))
            {
                confirmedInapplicableKeys.Add("fr-corp-001");
                confirmedInapplicableKeys.Add("legal.fr-corp-001");
                confirmedInapplicableKeys.Add("fr-corp-002");
                confirmedInapplicableKeys.Add("legal.fr-corp-002");
                confirmedInapplicableKeys.Add("fr-corp-003");
                confirmedInapplicableKeys.Add("legal.fr-corp-003");
                confirmedInapplicableKeys.Add("fr-corp-005");
                confirmedInapplicableKeys.Add("legal.fr-corp-005");
            }

            // Structure confirmation (Phase 4 planning) must precede company creation and downstream legal items (Phase 5 execution)
            if (taskByKey.TryGetValue("formation.confirm-structure", out var formationTask))
            {
                foreach (var legalTask in candidates.Where(c => (c.Category == RoadmapCategories.LegalAndAdministration || c.Key.StartsWith("legal.")) && c.Key != "formation.confirm-structure"))
                {
                    if (!legalTask.Key.Contains("fr-reg-001"))
                    {
                        if (!legalTask.Dependencies.Contains(formationTask.Key))
                        {
                            legalTask.Dependencies.Add(formationTask.Key);
                        }
                    }
                }
            }

            // Capital deposit (FR-CORP-001) & Statuts (FR-CORP-002) precede JAL (FR-CORP-003) and Registration (FR-CORP-004)
            var corp1 = candidates.FirstOrDefault(c => c.Key.Contains("fr-corp-001"));
            var corp2 = candidates.FirstOrDefault(c => c.Key.Contains("fr-corp-002"));
            var corp3 = candidates.FirstOrDefault(c => c.Key.Contains("fr-corp-003"));
            var corp4 = candidates.FirstOrDefault(c => c.Key.Contains("fr-corp-004") || c.Key.Contains("registration"));
            var rbe = candidates.FirstOrDefault(c => c.Key.Contains("fr-corp-005") || c.Key.Contains("beneficial"));

            if (corp1 != null && corp3 != null && !corp3.Dependencies.Contains(corp1.Key))
                corp3.Dependencies.Add(corp1.Key);
            if (corp2 != null && corp3 != null && !corp3.Dependencies.Contains(corp2.Key))
                corp3.Dependencies.Add(corp2.Key);

            // RBE preparation (FR-CORP-005) precedes/accompanies company registration submission (FR-CORP-004)
            if (corp2 != null && rbe != null && !rbe.Dependencies.Contains(corp2.Key))
            {
                rbe.Dependencies.Add(corp2.Key);
            }

            // Company registration filing (FR-CORP-004) requires JAL (FR-CORP-003), Capital deposit (FR-CORP-001), Statuts (FR-CORP-002), and RBE declaration (FR-CORP-005)
            if (corp4 != null)
            {
                if (corp3 != null && !corp4.Dependencies.Contains(corp3.Key))
                    corp4.Dependencies.Add(corp3.Key);
                if (corp1 != null && !corp4.Dependencies.Contains(corp1.Key))
                    corp4.Dependencies.Add(corp1.Key);
                if (corp2 != null && !corp4.Dependencies.Contains(corp2.Key))
                    corp4.Dependencies.Add(corp2.Key);
                if (rbe != null && !corp4.Dependencies.Contains(rbe.Key))
                    corp4.Dependencies.Add(rbe.Key);
            }

            // Company registration (FR-CORP-004) precedes insurance, payment gateway, e-invoicing, and post-launch social security
            if (corp4 != null)
            {
                foreach (var depTask in candidates.Where(c => c.Key.Contains("fr-ins-001") || c.Key.Contains("fr-pay-001") || c.Key.Contains("fr-soc-001") || c.Key.Contains("fr-tax-001") || c.Key.Contains("fr-corp-006")))
                {
                    if (!depTask.Dependencies.Contains(corp4.Key))
                    {
                        depTask.Dependencies.Add(corp4.Key);
                    }
                }
            }

            // DPAE (FR-SOC-002) is tied to employee hiring / skill gap engagement if planned
            var dpaeTask = candidates.FirstOrDefault(c => c.Key.Contains("fr-soc-002") || c.Key.Contains("dpae"));
            var teamOrSkillTask = candidates.FirstOrDefault(c => c.Category == RoadmapCategories.Skills || c.Category == RoadmapCategories.Team || c.Key.Contains("skill-gap"));
            if (dpaeTask != null)
            {
                if (teamOrSkillTask != null && !dpaeTask.Dependencies.Contains(teamOrSkillTask.Key))
                {
                    dpaeTask.Dependencies.Add(teamOrSkillTask.Key);
                }
                else if (corp4 != null && !dpaeTask.Dependencies.Contains(corp4.Key))
                {
                    dpaeTask.Dependencies.Add(corp4.Key);
                }
            }

            // Privacy Policy precedes Cookie Consent CMP & Mentions Légales
            var privacyTask = candidates.FirstOrDefault(c => c.Key.Contains("fr-priv-001") || c.Key.Contains("privacy"));
            var cookieTask = candidates.FirstOrDefault(c => c.Key.Contains("fr-priv-002") || c.Key.Contains("cookie"));
            var webTask = candidates.FirstOrDefault(c => c.Key.Contains("fr-web-001") || c.Key.Contains("mentions-legales") || c.Key.Contains("website"));

            if (privacyTask != null && cookieTask != null && !cookieTask.Dependencies.Contains(privacyTask.Key))
            {
                cookieTask.Dependencies.Add(privacyTask.Key);
            }
            if (privacyTask != null && webTask != null && !webTask.Dependencies.Contains(privacyTask.Key))
            {
                webTask.Dependencies.Add(privacyTask.Key);
            }

            // Pricing tiers precedes CGV & Pre-launch QA
            var pricingTask = candidates.FirstOrDefault(c => c.Key.Contains("pricing"));
            var cgvTask = candidates.FirstOrDefault(c => c.Key.Contains("fr-cons-001") || c.Key.Contains("terms"));
            if (pricingTask != null && cgvTask != null && !cgvTask.Dependencies.Contains(pricingTask.Key))
            {
                cgvTask.Dependencies.Add(pricingTask.Key);
            }

            // Critical technology execution must precede pre-launch QA and launch tasks
            var techCritical = candidates.FirstOrDefault(c => c.Key.Contains("technical_execution") || c.Key.Contains("software"));
            var launchTasks = candidates.Where(c => c.Category == RoadmapCategories.Launch || c.Key.Contains("launch"));

            if (techCritical != null)
            {
                foreach (var lt in launchTasks)
                {
                    if (lt.Key != techCritical.Key && !lt.Dependencies.Contains(techCritical.Key))
                    {
                        lt.Dependencies.Add(techCritical.Key);
                    }
                }
            }

            // 3. Explicit Dependency Resolution Pass:
            // - Confirmed completed: satisfied (removed from blocking dependencies).
            // - Confirmed inapplicable: removed from dependencies.
            // - Missing for unknown reasons: RETAINED as unresolved blocker; task status marked Blocked with explicit explanation.
            foreach (var task in candidates)
            {
                var resolvedDeps = new List<string>();
                foreach (var dep in task.Dependencies)
                {
                    if (string.IsNullOrWhiteSpace(dep) || dep == task.Key)
                    {
                        continue; // Skip self-loops or empty keys
                    }

                    if (taskByKey.ContainsKey(dep))
                    {
                        // Active prerequisite candidate present in roadmap
                        resolvedDeps.Add(dep);
                    }
                    else if (confirmedCompletedKeys.Contains(dep))
                    {
                        // Confirmed completed: satisfied
                        continue;
                    }
                    else if (confirmedInapplicableKeys.Contains(dep))
                    {
                        // Confirmed inapplicable: removed
                        continue;
                    }
                    else
                    {
                        // Missing for unknown reasons: keep as unresolved blocker
                        resolvedDeps.Add(dep);
                        if (task.Status != RoadmapTaskStatus.Done && task.Status != RoadmapTaskStatus.InProgress)
                        {
                            task.Status = RoadmapTaskStatus.Blocked;
                        }
                        if (!task.Why.Contains($"[Blocked by unresolved prerequisite: {dep}]"))
                        {
                            task.Why = $"{task.Why} [Blocked by unresolved prerequisite: {dep}]".Trim();
                        }
                    }
                }
                task.Dependencies = resolvedDeps.Distinct().ToList();
            }
        }

        private static void PopulateUnblocks(List<RoadmapTask> tasks)
        {
            if (tasks == null || tasks.Count == 0) return;

            foreach (var task in tasks)
            {
                task.Unblocks = tasks
                    .Where(other => other.Dependencies != null && (other.Dependencies.Contains(task.Key) || (!string.IsNullOrEmpty(task.Id) && other.Dependencies.Contains(task.Id))))
                    .Select(other => other.Title)
                    .Distinct()
                    .ToList();
            }
        }

        private static int GetMaxNowTasks(CapacityTier tier) => tier switch
        {
            CapacityTier.VeryLight => 2,
            CapacityTier.Light => 3,
            CapacityTier.Standard => 5,
            CapacityTier.Accelerated => 7,
            CapacityTier.Intensive => 9,
            _ => 3
        };

        private static string GetCapacityMessage(CapacityTier tier) => tier switch
        {
            CapacityTier.VeryLight => "Under 5 hours/week permits at most 2 Now tasks to prevent founder burnout.",
            CapacityTier.Light => "5–10 hours/week permits at most 3 Now tasks.",
            CapacityTier.Standard => "10–20 hours/week permits up to 5 Now tasks (Standard pacing).",
            CapacityTier.Accelerated => "20–30 hours/week permits up to 7 Now tasks (Accelerated pacing).",
            CapacityTier.Intensive => "Full-time availability (30+ hours/week) permits up to 9 Now tasks.",
            _ => "Capacity paced for your current availability."
        };

        private static double? ResolveDefaultEffortHours(RoadmapTask task)
        {
            if (task.EstimatedEffortHours.HasValue) return task.EstimatedEffortHours.Value;
            return task.EstimatedEffort switch
            {
                RoadmapTaskEffort.VerySmall => 0.5,
                RoadmapTaskEffort.Small => 1.5,
                RoadmapTaskEffort.Medium => 3.5,
                RoadmapTaskEffort.Large => 6.0,
                RoadmapTaskEffort.VeryLarge => 12.0,
                _ => null
            };
        }

        private static List<RoadmapStageGroup> RegroupStages(List<RoadmapTask> tasks)
        {
            var groups = new List<RoadmapStageGroup>();

            foreach (var stage in RoadmapStages.AllStages)
            {
                var stageTasks = tasks.Where(t => t.Stage == stage).ToList();
                if (stageTasks.Count > 0)
                {
                    groups.Add(new RoadmapStageGroup
                    {
                        Stage = stage,
                        Label = RoadmapStages.GetUserFacingLabel(stage),
                        Tasks = stageTasks
                    });
                }
            }

            return groups;
        }

        private static string GenerateRoadmapSummary(List<RoadmapTask> tasks, CapacityTier capacity, NextBestAction? next)
        {
            int activeCount = tasks.Count(t => t.Status != RoadmapTaskStatus.Done);
            int criticalCount = tasks.Count(t => t.Priority == RoadmapTaskPriority.Critical && t.Status != RoadmapTaskStatus.Done);
            string pacingDesc = capacity switch
            {
                CapacityTier.VeryLight => "paced conservatively for very focused weekly hours (<5h/week)",
                CapacityTier.Light => "balanced for part-time availability (5–10h/week)",
                CapacityTier.Standard => "structured for standard commitment (10–20h/week)",
                CapacityTier.Accelerated => "accelerated for high weekly availability (20–30h/week)",
                CapacityTier.Intensive => "intensive for full-time execution (30h+/week)",
                _ => "balanced for your current availability"
            };

            if (criticalCount > 0 && next != null)
            {
                return $"You have {criticalCount} critical item(s) requiring resolution before downstream execution. Your roadmap is {pacingDesc}, with '{next.Title}' selected as your immediate next best action.";
            }

            return $"Your operational roadmap contains {activeCount} action item(s) {pacingDesc} to prepare your venture for build and launch.";
        }

        private static (bool IsStale, List<string> ChangedSources) DetectStaleness(
            Phase4SourceVersions? stored,
            RoadmapContext current)
        {
            var changed = new List<string>();
            if (stored == null) return (false, changed);

            var curr = current.CurrentSourceVersions;

            if (curr.ProjectVersion != stored.ProjectVersion)
                changed.Add("Project");

            if (curr.ForecastVersion != stored.ForecastVersion)
                changed.Add("Financial Forecast");

            if (curr.BusinessPlanVersion != stored.BusinessPlanVersion)
                changed.Add("Business Plan");

            if (curr.LegalChecklistCompletedCount != stored.LegalChecklistCompletedCount ||
                (curr.LegalAssessmentUpdatedAt.HasValue && stored.LegalAssessmentUpdatedAt.HasValue &&
                 curr.LegalAssessmentUpdatedAt.Value > stored.LegalAssessmentUpdatedAt.Value.AddSeconds(2)) ||
                (curr.LegalAssessmentUpdatedAt.HasValue != stored.LegalAssessmentUpdatedAt.HasValue))
            {
                changed.Add("Legal Assessment");
            }

            if (curr.ProfessionalProfileUpdatedAt.HasValue && stored.ProfessionalProfileUpdatedAt.HasValue &&
                curr.ProfessionalProfileUpdatedAt.Value > stored.ProfessionalProfileUpdatedAt.Value.AddSeconds(2))
            {
                changed.Add("Professional Profile / Availability");
            }

            return (changed.Count > 0, changed);
        }

        private static OperationalRoadmapResponse BuildResponse(
            OperationalRoadmap roadmap,
            bool updateAvailable,
            List<string> changedSources,
            RoadmapContext? context = null,
            long ideaVersion = 0)
        {
            int total = roadmap.Tasks.Count;
            int active = roadmap.Tasks.Count(t => t.Status != RoadmapTaskStatus.Done && t.Status != RoadmapTaskStatus.Skipped);
            int critical = roadmap.Tasks.Count(t => t.Priority == RoadmapTaskPriority.Critical && t.Status != RoadmapTaskStatus.Done);
            int completed = roadmap.Tasks.Count(t => t.Status == RoadmapTaskStatus.Done);

            var availability = context?.WeeklyAvailability ?? "10–20 hours/week";
            var capacityTier = context != null ? (new RoadmapScheduler()).ResolveCapacityTier(availability) : CapacityTier.Standard;

            var nowTasks = roadmap.Tasks.Where(t => t.Stage == RoadmapStages.Now).ToList();
            double knownHours = 0;
            int unestimatedCount = 0;

            foreach (var t in nowTasks)
            {
                var h = ResolveDefaultEffortHours(t);
                if (h.HasValue)
                {
                    knownHours += h.Value;
                }
                else
                {
                    unestimatedCount++;
                }
            }

            return new OperationalRoadmapResponse
            {
                Roadmap = roadmap,
                UpdateAvailable = updateAvailable,
                ChangedSources = changedSources,
                TotalTasksCount = total,
                ActiveTasksCount = active,
                CriticalTasksCount = critical,
                CompletedTasksCount = completed,
                IdeaVersion = ideaVersion,
                WeeklyAvailability = availability,
                CapacityTier = capacityTier.ToString(),
                CapacityMessage = GetCapacityMessage(capacityTier),
                MaxNowTasks = GetMaxNowTasks(capacityTier),
                KnownEffortHours = knownHours > 0 ? Math.Round(knownHours, 1) : null,
                UnestimatedTasksCount = unestimatedCount,
                PlanStatus = roadmap.Status ?? "Active"
            };
        }

        private static string MapCategory(string snapshotCategory) => snapshotCategory switch
        {
            ConstructionCategories.BusinessFoundation => RoadmapCategories.Business,
            ConstructionCategories.Brand => RoadmapCategories.Brand,
            ConstructionCategories.Market => RoadmapCategories.Market,
            ConstructionCategories.BusinessModel => RoadmapCategories.Business,
            ConstructionCategories.Finance => RoadmapCategories.Finance,
            ConstructionCategories.LegalAndAdministration => RoadmapCategories.LegalAndAdministration,
            ConstructionCategories.Team => RoadmapCategories.Team,
            ConstructionCategories.Skills => RoadmapCategories.Skills,
            ConstructionCategories.Services => RoadmapCategories.Services,
            ConstructionCategories.Technology => RoadmapCategories.Technology,
            ConstructionCategories.Funding => RoadmapCategories.Funding,
            ConstructionCategories.Pricing => RoadmapCategories.Pricing,
            ConstructionCategories.GoToMarket => RoadmapCategories.GoToMarket,
            ConstructionCategories.LaunchAssets => RoadmapCategories.Launch,
            ConstructionCategories.Operations => RoadmapCategories.Operations,
            _ => RoadmapCategories.Business
        };

        private static string ResolveSnapshotItemEarliestStage(ConstructionSnapshotItem item, bool isCritical)
        {
            var cat = item.Category ?? string.Empty;
            var key = (item.Key ?? string.Empty).ToLowerInvariant();

            if (cat == ConstructionCategories.LaunchAssets || key.Contains("launch"))
                return RoadmapStages.BeforeLaunch;

            if (cat == ConstructionCategories.Operations || key.Contains("operation"))
                return RoadmapStages.PostLaunch;

            if (cat == ConstructionCategories.GoToMarket || key.Contains("gtm") || key.Contains("market-entry") || key.Contains("outreach"))
                return RoadmapStages.Days60To90;

            if (cat == ConstructionCategories.Pricing || cat == ConstructionCategories.Brand || cat == ConstructionCategories.Skills || cat == ConstructionCategories.Funding)
                return RoadmapStages.Days30To60;

            if (cat == ConstructionCategories.Technology || cat == ConstructionCategories.Services)
                return isCritical ? RoadmapStages.Now : RoadmapStages.Days30To60;

            if (cat == ConstructionCategories.BusinessFoundation || cat == ConstructionCategories.Market || cat == ConstructionCategories.Team)
                return isCritical ? RoadmapStages.Now : RoadmapStages.Next30Days;

            return isCritical ? RoadmapStages.Now : RoadmapStages.Next30Days;
        }

        private static string? MapLegalStage(string? ruleId, string? legalStage, string? category)
        {
            var id = (ruleId ?? string.Empty).ToUpperInvariant();
            
            // 1. Regulated sector checks must occur before company creation
            if (id.Contains("FR-REG-001")) return RoadmapStages.Now;

            // 2. Company formation & formal registration formalities (SAS, SARL, etc.)
            // Initial RBE (FR-CORP-005) preparation is conducted alongside bylaws (statuts) for the INPI Guichet Unique registration dossier.
            if (id.Contains("FR-CORP-001") || id.Contains("FR-CORP-002") || id.Contains("FR-CORP-003") || id.Contains("FR-CORP-004") || id.Contains("FR-CORP-005"))
                return RoadmapStages.Next30Days;

            // 3. Operational preparation: Trademark search & Professional indemnity insurance (RC Pro)
            if (id.Contains("FR-IP-001") || id.Contains("FR-INS-001"))
                return RoadmapStages.Days30To60;

            // 4. Pre-hiring DPAE declarations: timing derived from actual employee start date (unresolved by default, skill gap alone does not assume Month 2)
            if (id.Contains("FR-SOC-002"))
                return null;

            // 5. Data protection & payment integrations
            if (id.Contains("FR-PRIV-001") || id.Contains("FR-PRIV-002") || id.Contains("FR-PRIV-003") || id.Contains("FR-PAY-001") || id.Contains("FR-MKT-001"))
                return RoadmapStages.Days60To90;

            // 6. Mandatory gates before public launch / commercial sales
            if (id.Contains("FR-WEB-001") || id.Contains("FR-CONS-001") || id.Contains("FR-CONS-002") || id.Contains("FR-CONS-003") || id.Contains("FR-TAX-001"))
                return RoadmapStages.BeforeLaunch;

            // 7. Post-launch / ongoing recurring obligations
            // Annual accounts approval and filing (FR-CORP-006) and recurring founder social regime affiliation (FR-SOC-001)
            if (id.Contains("FR-SOC-001") || id.Contains("FR-CORP-006"))
                return RoadmapStages.PostLaunch;

            // Fallback based on legalStage and category
            if (string.IsNullOrWhiteSpace(legalStage)) return RoadmapStages.Days30To60;
            var s = legalStage.ToLowerInvariant();
            var c = (category ?? string.Empty).ToLowerInvariant();

            if (s.Contains("before_creation") || s.Contains("before company"))
                return RoadmapStages.Now;
            if (s.Contains("company_creation"))
                return RoadmapStages.Next30Days;
            if (s.Contains("before_launch") || s.Contains("before_sale") || s.Contains("before first sale"))
            {
                if (c.Contains("intellectual") || c.Contains("insurance")) return RoadmapStages.Days30To60;
                if (c.Contains("privacy") || c.Contains("payment") || c.Contains("market")) return RoadmapStages.Days60To90;
                return RoadmapStages.BeforeLaunch;
            }
            if (s.Contains("ongoing") || s.Contains("post"))
                return RoadmapStages.PostLaunch;

            return RoadmapStages.Days30To60;
        }

        private static string? MapLegalStage(string? legalStage) => MapLegalStage(null, legalStage, null);

        private static string Slugify(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return Guid.NewGuid().ToString().Substring(0, 8);
            return text.Trim().ToLowerInvariant().Replace(" ", "-").Replace("/", "-").Replace("&", "and");
        }
    }
}
