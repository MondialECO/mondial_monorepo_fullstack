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

            if (roadmap == null)
            {
                return new OperationalRoadmapResponse
                {
                    Roadmap = null,
                    UpdateAvailable = false,
                    ChangedSources = new List<string>()
                };
            }

            var context = await BuildContextAsync(userId, journey, ideaId);
            var (isStale, changedSources) = DetectStaleness(roadmap.SourceVersions, context);

            return BuildResponse(roadmap, isStale, changedSources);
        }

        public async Task<OperationalRoadmapResponse> GenerateRoadmapAsync(string userId, string? ideaId = null)
        {
            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var existingRoadmap = journey.Phase4Data?.Roadmap;

            // Idempotency: Return existing roadmap if already generated
            if (existingRoadmap != null)
            {
                var ctx = await BuildContextAsync(userId, journey, ideaId);
                var (isStale, changed) = DetectStaleness(existingRoadmap.SourceVersions, ctx);
                return BuildResponse(existingRoadmap, isStale, changed);
            }

            // Enforce domain gates
            await ValidatePrerequisitesAsync(userId, journey, ideaId);

            var context = await BuildContextAsync(userId, journey, ideaId);
            var newRoadmap = BuildRoadmapInternal(context, existingRoadmap: null);

            await _journeys.SetPhase4RoadmapAsync(userId, newRoadmap, ideaId);

            return BuildResponse(newRoadmap, updateAvailable: false, changedSources: new List<string>());
        }

        public async Task<OperationalRoadmapResponse> RefreshRoadmapAsync(string userId, string? ideaId = null)
        {
            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var existingRoadmap = journey.Phase4Data?.Roadmap;

            await ValidatePrerequisitesAsync(userId, journey, ideaId);

            var context = await BuildContextAsync(userId, journey, ideaId);
            var refreshedRoadmap = BuildRoadmapInternal(context, existingRoadmap);

            await _journeys.SetPhase4RoadmapAsync(userId, refreshedRoadmap, ideaId);

            return BuildResponse(refreshedRoadmap, updateAvailable: false, changedSources: new List<string>());
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

            roadmap.FounderEdited = true;
            roadmap.UpdatedAt = DateTime.UtcNow;

            // Recalculate Next Best Action dynamically
            roadmap.NextBestAction = _scheduler.SelectNextBestAction(roadmap.Tasks);

            // Re-group into stages for response
            roadmap.Stages = RegroupStages(roadmap.Tasks);

            await _journeys.SetPhase4RoadmapAsync(userId, roadmap, request.IdeaId);

            var context = await BuildContextAsync(userId, journey, request.IdeaId);
            var (isStale, changedSources) = DetectStaleness(roadmap.SourceVersions, context);

            return BuildResponse(roadmap, isStale, changedSources);
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
                LegalChecklistCompletedCount = p3.LegalChecklist?.CompletedCount ?? 0,
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
                    }
                }
            }

            // 3. Schedule and order tasks
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
                        EstimatedEffort = RoadmapTaskEffort.Large,
                        Source = new List<string>(item.Source) { "Construction Snapshot" },
                        SourceReference = new List<string>(item.SourceReference) { item.Key },
                        RelatedSnapshotItemKey = item.Key,
                        EarliestStart = RoadmapStages.Now
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
                        EstimatedEffort = RoadmapTaskEffort.Medium,
                        Source = new List<string>(item.Source) { "Construction Snapshot" },
                        SourceReference = new List<string>(item.SourceReference) { item.Key },
                        RelatedSnapshotItemKey = item.Key,
                        EarliestStart = RoadmapStages.Next30Days
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
                        EstimatedEffort = RoadmapTaskEffort.Small,
                        Source = new List<string>(item.Source) { "Construction Snapshot" },
                        SourceReference = new List<string>(item.SourceReference) { item.Key },
                        RelatedSnapshotItemKey = item.Key,
                        EarliestStart = RoadmapStages.Now
                    });
                }
            }

            // 4. Map Legal Checklist Requirements with strict Temporal Fidelity
            if (context.LegalChecklist?.Items != null)
            {
                foreach (var legalItem in context.LegalChecklist.Items)
                {
                    if (legalItem.Status == "completed" || legalItem.Status == "not_applicable") continue;

                    var rawId = legalItem.Id ?? legalItem.Title;
                    var taskKey = rawId.StartsWith("legal.") ? rawId : $"legal.{Slugify(rawId)}";
                    if (candidates.Any(c => c.Key == taskKey)) continue;

                    string stage = MapLegalStage(legalItem.Stage);
                    bool isBlocking = legalItem.Priority?.ToLowerInvariant() == "critical" || legalItem.Stage == "company_creation";

                    candidates.Add(new RoadmapTask
                    {
                        Key = taskKey,
                        Title = legalItem.Title,
                        Description = legalItem.WhyItApplies,
                        Category = RoadmapCategories.LegalAndAdministration,
                        Priority = legalItem.Priority?.ToLowerInvariant() == "critical" ? RoadmapTaskPriority.Critical : RoadmapTaskPriority.High,
                        Blocking = isBlocking,
                        Why = $"Statutory requirement ({legalItem.Category}): {legalItem.WhyItApplies}",
                        EstimatedEffort = legalItem.RequiresEvidence ? RoadmapTaskEffort.Medium : RoadmapTaskEffort.Small,
                        Source = new List<string> { "Legal Assessment" },
                        SourceReference = new List<string> { legalItem.Id },
                        EarliestStart = stage
                    });
                }
            }

            // 5. Map Company Formation Prerequisite Tasks
            if (context.Formation != null && !string.IsNullOrEmpty(context.Formation.SelectedType))
            {
                var formKey = "formation.confirm-structure";
                if (!candidates.Any(c => c.Key == formKey))
                {
                    candidates.Add(new RoadmapTask
                    {
                        Key = formKey,
                        Title = $"Confirm {context.Formation.SelectedType} Entity Formation Plan",
                        Description = $"Review and validate the chosen legal structure ({context.Formation.SelectedType}) with all founders.",
                        Category = RoadmapCategories.Formation,
                        Priority = RoadmapTaskPriority.High,
                        Blocking = true,
                        Why = "Entity structure defines capital allocation, founder liability, and administrative obligations.",
                        EstimatedEffort = RoadmapTaskEffort.Medium,
                        Source = new List<string> { "Formation & Team" },
                        EarliestStart = RoadmapStages.Now
                    });
                }
            }

            // 6. Establish Logical DAG Dependencies across Tasks
            WireDependencies(candidates);

            return candidates;
        }

        private static void WireDependencies(List<RoadmapTask> candidates)
        {
            var taskByKey = candidates.ToDictionary(c => c.Key, c => c);

            // Structure confirmation must precede company creation legal items
            if (taskByKey.TryGetValue("formation.confirm-structure", out var formationTask))
            {
                foreach (var legalTask in candidates.Where(c => c.Key.StartsWith("legal.") && c.Key != "formation.confirm-structure"))
                {
                    if (!legalTask.Dependencies.Contains(formationTask.Key))
                    {
                        legalTask.Dependencies.Add(formationTask.Key);
                    }
                }
            }

            // Critical technology execution must precede showcase website launch
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

            if (curr.LegalChecklistCompletedCount != stored.LegalChecklistCompletedCount)
                changed.Add("Legal Assessment");

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
            List<string> changedSources)
        {
            int active = roadmap.Tasks.Count(t => t.Status != RoadmapTaskStatus.Done && t.Status != RoadmapTaskStatus.Skipped);
            int critical = roadmap.Tasks.Count(t => t.Priority == RoadmapTaskPriority.Critical && t.Status != RoadmapTaskStatus.Done);
            int completed = roadmap.Tasks.Count(t => t.Status == RoadmapTaskStatus.Done);

            return new OperationalRoadmapResponse
            {
                Roadmap = roadmap,
                UpdateAvailable = updateAvailable,
                ChangedSources = changedSources,
                ActiveTasksCount = active,
                CriticalTasksCount = critical,
                CompletedTasksCount = completed
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

        private static string MapLegalStage(string? legalStage)
        {
            if (string.IsNullOrWhiteSpace(legalStage)) return RoadmapStages.Now;
            var s = legalStage.ToLowerInvariant();

            if (s.Contains("before_creation") || s.Contains("before company"))
                return RoadmapStages.Now;
            if (s.Contains("company_creation"))
                return RoadmapStages.Next30Days;
            if (s.Contains("before_launch") || s.Contains("before first sale"))
                return RoadmapStages.BeforeLaunch;
            if (s.Contains("ongoing"))
                return RoadmapStages.PostLaunch;

            return RoadmapStages.Days30To60;
        }

        private static string Slugify(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return Guid.NewGuid().ToString().Substring(0, 8);
            return text.Trim().ToLowerInvariant().Replace(" ", "-").Replace("/", "-").Replace("&", "and");
        }
    }
}
