using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Phase4;
using WebApp.Models.Phase4;
using WebApp.Services.Interface;
using WebApp.Services.Repository.Ai;

namespace WebApp.Services.Implementations
{
    public class GtmStrategyService : IGtmStrategyService
    {
        private readonly ICreatorJourneyService _journeys;
        private readonly IConstructionSnapshotService _snapshotService;
        private readonly IOperationalRoadmapService _roadmapService;
        private readonly INeedsAnalysisService _needsService;
        private readonly ISkillsResolutionService _skillsService;
        private readonly ISupportPlanService _supportService;
        private readonly IPricingStrategyService _pricingService;
        private readonly IGtmPolicyEngine _policyEngine;
        private readonly IFounderCapacityResolver _capacityResolver;
        private readonly IMarketStudySessionStore? _marketStudies;
        private readonly IBusinessModelSessionStore? _businessModels;
        private readonly IForecastSessionStore? _forecasts;
        private readonly IBusinessPlanSessionStore? _businessPlans;
        private readonly IProfessionalProfileStore? _professionalStore;
        private readonly IProfileCompletenessResolver? _completenessResolver;
        private readonly ILogger<GtmStrategyService> _logger;

        public GtmStrategyService(
            ICreatorJourneyService journeys,
            IConstructionSnapshotService snapshotService,
            IOperationalRoadmapService roadmapService,
            INeedsAnalysisService needsService,
            ISkillsResolutionService skillsService,
            ISupportPlanService supportService,
            IPricingStrategyService pricingService,
            IGtmPolicyEngine policyEngine,
            IFounderCapacityResolver capacityResolver,
            ILogger<GtmStrategyService> logger,
            IMarketStudySessionStore? marketStudies = null,
            IBusinessModelSessionStore? businessModels = null,
            IForecastSessionStore? forecasts = null,
            IBusinessPlanSessionStore? businessPlans = null,
            IProfessionalProfileStore? professionalStore = null,
            IProfileCompletenessResolver? completenessResolver = null)
        {
            _journeys = journeys;
            _snapshotService = snapshotService;
            _roadmapService = roadmapService;
            _needsService = needsService;
            _skillsService = skillsService;
            _supportService = supportService;
            _pricingService = pricingService;
            _policyEngine = policyEngine;
            _capacityResolver = capacityResolver;
            _logger = logger;
            _marketStudies = marketStudies;
            _businessModels = businessModels;
            _forecasts = forecasts;
            _businessPlans = businessPlans;
            _professionalStore = professionalStore;
            _completenessResolver = completenessResolver;
        }

        public async Task<GtmStrategyResponse> GetGtmStrategyAsync(string userId, string? ideaId = null)
        {
            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var existing = journey.Phase4Data?.GtmStrategy;

            var gateResult = await CheckGateAsync(userId, ideaId);

            if (existing == null)
            {
                return new GtmStrategyResponse
                {
                    Strategy = null,
                    UpdateAvailable = false,
                    ChangedSources = new List<string>(),
                    PrerequisiteGate = gateResult,
                    IdeaVersion = journey.IdeaVersion
                };
            }

            var context = await BuildContextAsync(userId, journey, ideaId);
            var (isStale, changed) = DetectStaleness(existing.SourceVersions, context.CurrentSourceVersions);

            return new GtmStrategyResponse
            {
                Strategy = existing,
                UpdateAvailable = isStale,
                ChangedSources = changed,
                PrerequisiteGate = gateResult,
                IdeaVersion = journey.IdeaVersion
            };
        }

        public async Task<GtmStrategyResponse> GenerateGtmStrategyAsync(string userId, string? ideaId = null)
        {
            var gateResult = await CheckGateAsync(userId, ideaId);
            if (!gateResult.CanAccess)
            {
                throw new InvalidOperationException($"PREREQUISITE_GATE_FAILED: {string.Join(" ", gateResult.BlockingReasons)}");
            }

            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var existing = journey.Phase4Data?.GtmStrategy;
            if (existing != null)
            {
                // Idempotent: return existing
                return new GtmStrategyResponse
                {
                    Strategy = existing,
                    UpdateAvailable = false,
                    ChangedSources = new List<string>(),
                    PrerequisiteGate = gateResult,
                    IdeaVersion = journey.IdeaVersion
                };
            }

            var context = await BuildContextAsync(userId, journey, ideaId);
            var strategy = ExecuteDerivation(context, existing: null);

            // Persist strictly on CreatorJourney.Phase4Data.GtmStrategy
            var updatedJourney = await _journeys.SetPhase4GtmStrategyAsync(userId, strategy, ideaId);

            return new GtmStrategyResponse
            {
                Strategy = strategy,
                UpdateAvailable = false,
                ChangedSources = new List<string>(),
                PrerequisiteGate = gateResult,
                IdeaVersion = updatedJourney?.IdeaVersion ?? journey.IdeaVersion
            };
        }

        public async Task<GtmStrategyResponse> RefreshGtmStrategyAsync(string userId, string? ideaId = null)
        {
            var gateResult = await CheckGateAsync(userId, ideaId);
            if (!gateResult.CanAccess)
            {
                throw new InvalidOperationException($"PREREQUISITE_GATE_FAILED: {string.Join(" ", gateResult.BlockingReasons)}");
            }

            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var existing = journey.Phase4Data?.GtmStrategy;
            var context = await BuildContextAsync(userId, journey, ideaId);

            var strategy = ExecuteDerivation(context, existing);

            var updatedJourney = await _journeys.SetPhase4GtmStrategyAsync(userId, strategy, ideaId);

            return new GtmStrategyResponse
            {
                Strategy = strategy,
                UpdateAvailable = false,
                ChangedSources = new List<string>(),
                PrerequisiteGate = gateResult,
                IdeaVersion = updatedJourney?.IdeaVersion ?? journey.IdeaVersion
            };
        }

        public async Task<GtmStrategyResponse> UpdateGtmChannelAsync(string userId, string channelKey, UpdateGtmChannelRequest request)
        {
            var journey = await _journeys.GetOrCreateComposedAsync(userId, request.IdeaId);
            var strategy = journey.Phase4Data?.GtmStrategy;
            if (strategy == null)
            {
                throw new KeyNotFoundException("GTM Strategy has not been generated yet.");
            }

            var channel = strategy.ChannelStrategy.FirstOrDefault(c => c.Key == channelKey);
            if (channel == null)
            {
                throw new KeyNotFoundException($"Channel with key '{channelKey}' not found in strategy.");
            }

            // Apply founder overrides
            if (request.Priority.HasValue) channel.Priority = request.Priority.Value;
            if (request.ExecutionMode.HasValue) channel.ExecutionMode = request.ExecutionMode.Value;
            if (!string.IsNullOrWhiteSpace(request.Owner)) channel.Owner = request.Owner;
            if (request.BudgetAmount.HasValue) channel.BudgetAmount = request.BudgetAmount.Value;
            if (!string.IsNullOrWhiteSpace(request.TimeRequirement)) channel.TimeRequirement = request.TimeRequirement;
            if (request.FounderNotes != null) channel.FounderNotes = request.FounderNotes;

            channel.FounderEdited = true;
            strategy.FounderOverrides[channelKey] = $"Priority:{channel.Priority}|Mode:{channel.ExecutionMode}|Owner:{channel.Owner}";
            strategy.UpdatedAt = DateTime.UtcNow;

            // Recalculate capacity load with new channel configuration
            var context = await BuildContextAsync(userId, journey, request.IdeaId);
            var capacityProfile = _capacityResolver.ResolveCapacityProfile(context.WeeklyAvailability, strategy.ChannelStrategy);
            strategy.FounderExecutionPlan = capacityProfile;
            strategy.CapacityWarningActive = capacityProfile.IsOverloaded;

            var updatedJourney = await _journeys.SetPhase4GtmStrategyAsync(userId, strategy, request.IdeaId);

            return new GtmStrategyResponse
            {
                Strategy = strategy,
                UpdateAvailable = false,
                ChangedSources = new List<string>(),
                IdeaVersion = updatedJourney?.IdeaVersion ?? journey.IdeaVersion
            };
        }

        public async Task<GtmStrategyResponse> RecordExperimentRunAsync(string userId, string experimentKey, RecordExperimentRunRequest request)
        {
            var journey = await _journeys.GetOrCreateComposedAsync(userId, request.IdeaId);
            var strategy = journey.Phase4Data?.GtmStrategy;
            if (strategy == null)
            {
                throw new KeyNotFoundException("GTM Strategy has not been generated yet.");
            }

            var experiment = strategy.Experiments.FirstOrDefault(e => e.Key == experimentKey);
            if (experiment == null)
            {
                throw new KeyNotFoundException($"Experiment with key '{experimentKey}' not found.");
            }

            // Refinement 6: Append immutable historical run
            var run = new ExperimentRun
            {
                RunId = Guid.NewGuid().ToString("N"),
                StartedAt = DateTime.UtcNow.AddDays(-7),
                CompletedAt = DateTime.UtcNow,
                ActualSpend = request.ActualSpend,
                ActualEffort = request.ActualEffort,
                Observations = request.Observations,
                MetricsObserved = request.MetricsObserved ?? new List<MetricObservation>(),
                Outcome = request.Outcome,
                RecordedAt = DateTime.UtcNow,
                RecordedBy = "Founder"
            };

            experiment.Runs.Add(run);

            if (!string.IsNullOrWhiteSpace(request.StatusUpdate))
            {
                experiment.Status = request.StatusUpdate;
            }
            experiment.Result = $"Completed run on {DateTime.UtcNow:yyyy-MM-dd}: Outcome={run.Outcome}, Spend=€{run.ActualSpend:N0}. {run.Observations}";

            strategy.UpdatedAt = DateTime.UtcNow;

            var updatedJourney = await _journeys.SetPhase4GtmStrategyAsync(userId, strategy, request.IdeaId);

            return new GtmStrategyResponse
            {
                Strategy = strategy,
                UpdateAvailable = false,
                ChangedSources = new List<string>(),
                IdeaVersion = updatedJourney?.IdeaVersion ?? journey.IdeaVersion
            };
        }

        public async Task<GtmStrategyResponse> UpdateGtmStrategyAsync(string userId, UpdateGtmStrategyRequest request)
        {
            var journey = await _journeys.GetOrCreateComposedAsync(userId, request.IdeaId);

            if (request.ExpectedVersion.HasValue && journey.IdeaVersion != request.ExpectedVersion.Value)
            {
                throw new CreatorJourneyException(
                    409,
                    $"Concurrency conflict: expected ideaVersion {request.ExpectedVersion.Value} but found {journey.IdeaVersion}.");
            }

            var strategy = journey.Phase4Data?.GtmStrategy;
            if (strategy == null)
            {
                throw new KeyNotFoundException("GTM Strategy has not been generated yet.");
            }

            strategy.FounderOverrides ??= new Dictionary<string, string>();

            // 1. Edit outreach message override
            if (request.CustomOutreachMessage != null)
            {
                strategy.FounderOverrides["CustomOutreachMessage"] = request.CustomOutreachMessage;
                if (!string.IsNullOrWhiteSpace(request.CustomOutreachMessage))
                {
                    strategy.PositioningStrategy.PrimaryPromise = request.CustomOutreachMessage;
                }
            }

            // 2. Adjust customer group override
            if (request.CustomCustomerGroup != null)
            {
                strategy.FounderOverrides["CustomCustomerGroup"] = request.CustomCustomerGroup;
                if (!string.IsNullOrWhiteSpace(request.CustomCustomerGroup))
                {
                    strategy.PrimaryLaunchSegment = request.CustomCustomerGroup;
                    if (strategy.SegmentStrategies.Count > 0)
                    {
                        strategy.SegmentStrategies[0].SegmentName = request.CustomCustomerGroup;
                    }
                }
            }

            // 3. Set time and marketing budget override
            if (request.WeeklyHoursAvailable.HasValue)
            {
                strategy.FounderOverrides["WeeklyHoursAvailable"] = request.WeeklyHoursAvailable.Value.ToString();
                var capacityProfile = _capacityResolver.ResolveCapacityProfile($"{request.WeeklyHoursAvailable.Value} hours/week", strategy.ChannelStrategy);
                strategy.FounderExecutionPlan = capacityProfile;
                strategy.CapacityWarningActive = capacityProfile.IsOverloaded;
            }

            if (request.SpendableBudget.HasValue)
            {
                strategy.FounderOverrides["SpendableBudget"] = request.SpendableBudget.Value.ToString(System.Globalization.CultureInfo.InvariantCulture);
                strategy.BudgetPlan ??= new GtmBudgetPlan();
                strategy.BudgetPlan.TotalAvailableBudget = request.SpendableBudget.Value;
                strategy.BudgetPlan.BudgetSource = GtmBudgetSourceType.FounderDeclared;
                strategy.BudgetPlan.SpendableStatus = SpendableStatus.ConfirmedAvailable;
                strategy.BudgetPlan.ValidationStatus = GtmBudgetStatus.Confirmed;
            }

            // 4. Set tracking targets override
            strategy.MetricsFramework ??= new List<GtmMetricDefinition>();

            if (request.TargetContacted.HasValue)
            {
                strategy.FounderOverrides["Target_Contacted"] = request.TargetContacted.Value.ToString();
                var m = strategy.MetricsFramework.FirstOrDefault(x => x.Key == "outreach_volume" || x.Name.Contains("Outreach", StringComparison.OrdinalIgnoreCase) || x.Name.Contains("Contacted", StringComparison.OrdinalIgnoreCase));
                if (m != null)
                {
                    m.Target = request.TargetContacted.Value;
                    m.TargetStatus = ExperimentThresholdStatus.FounderDefined;
                }
                else
                {
                    strategy.MetricsFramework.Add(new GtmMetricDefinition
                    {
                        Key = "outreach_volume",
                        Name = "Target Contacts",
                        Target = request.TargetContacted.Value,
                        TargetStatus = ExperimentThresholdStatus.FounderDefined
                    });
                }
            }

            if (request.TargetReplies.HasValue)
            {
                strategy.FounderOverrides["Target_Replies"] = request.TargetReplies.Value.ToString();
                var m = strategy.MetricsFramework.FirstOrDefault(x => x.Key == "reply_rate" || x.Name.Contains("Reply", StringComparison.OrdinalIgnoreCase) || x.Name.Contains("Replies", StringComparison.OrdinalIgnoreCase));
                if (m != null)
                {
                    m.Target = request.TargetReplies.Value;
                    m.TargetStatus = ExperimentThresholdStatus.FounderDefined;
                }
                else
                {
                    strategy.MetricsFramework.Add(new GtmMetricDefinition
                    {
                        Key = "reply_rate",
                        Name = "Target Replies",
                        Target = request.TargetReplies.Value,
                        TargetStatus = ExperimentThresholdStatus.FounderDefined
                    });
                }
            }

            if (request.TargetDemos.HasValue)
            {
                strategy.FounderOverrides["Target_Demos"] = request.TargetDemos.Value.ToString();
                var m = strategy.MetricsFramework.FirstOrDefault(x => x.Key == "discovery_calls" || x.Name.Contains("Demo", StringComparison.OrdinalIgnoreCase) || x.Name.Contains("Discovery", StringComparison.OrdinalIgnoreCase) || x.Name.Contains("Call", StringComparison.OrdinalIgnoreCase));
                if (m != null)
                {
                    m.Target = request.TargetDemos.Value;
                    m.TargetStatus = ExperimentThresholdStatus.FounderDefined;
                }
                else
                {
                    strategy.MetricsFramework.Add(new GtmMetricDefinition
                    {
                        Key = "discovery_calls",
                        Name = "Target Demos / Discovery",
                        Target = request.TargetDemos.Value,
                        TargetStatus = ExperimentThresholdStatus.FounderDefined
                    });
                }
            }

            if (request.TargetPurchases.HasValue)
            {
                strategy.FounderOverrides["Target_Purchases"] = request.TargetPurchases.Value.ToString();
                var m = strategy.MetricsFramework.FirstOrDefault(x => x.Key == "closed_deals" || x.Name.Contains("Purchase", StringComparison.OrdinalIgnoreCase) || x.Name.Contains("Deal", StringComparison.OrdinalIgnoreCase) || x.Name.Contains("Customer", StringComparison.OrdinalIgnoreCase));
                if (m != null)
                {
                    m.Target = request.TargetPurchases.Value;
                    m.TargetStatus = ExperimentThresholdStatus.FounderDefined;
                }
                else
                {
                    strategy.MetricsFramework.Add(new GtmMetricDefinition
                    {
                        Key = "closed_deals",
                        Name = "Target Purchases",
                        Target = request.TargetPurchases.Value,
                        TargetStatus = ExperimentThresholdStatus.FounderDefined
                    });
                }
            }

            // 5. Activation Lifecycle
            if (!string.IsNullOrWhiteSpace(request.Status))
            {
                var validStatuses = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
                {
                    "Draft", "Review", "Active", "Archived", "Completed"
                };

                if (!validStatuses.Contains(request.Status))
                {
                    throw new CreatorJourneyException(400, $"Invalid GTM strategy status '{request.Status}'. Valid statuses are: Draft, Review, Active, Archived, Completed.");
                }

                // Validate state transitions
                var currentStatus = string.IsNullOrWhiteSpace(strategy.Status) ? "Draft" : strategy.Status;
                var targetStatus = request.Status;

                if (currentStatus.Equals("Completed", StringComparison.OrdinalIgnoreCase) &&
                    !targetStatus.Equals("Completed", StringComparison.OrdinalIgnoreCase) &&
                    !targetStatus.Equals("Archived", StringComparison.OrdinalIgnoreCase))
                {
                    throw new CreatorJourneyException(400, $"Cannot transition completed GTM strategy back to '{targetStatus}'.");
                }

                if (currentStatus.Equals("Archived", StringComparison.OrdinalIgnoreCase) &&
                    targetStatus.Equals("Active", StringComparison.OrdinalIgnoreCase))
                {
                    throw new CreatorJourneyException(400, "Cannot activate an archived GTM strategy directly. Unarchive to Draft first.");
                }

                strategy.Status = targetStatus;
                if (targetStatus.Equals("Active", StringComparison.OrdinalIgnoreCase))
                {
                    strategy.FounderOverrides["PlanActivated"] = "true";
                    if (!strategy.FounderOverrides.ContainsKey("ActivatedAt") || string.IsNullOrWhiteSpace(strategy.FounderOverrides["ActivatedAt"]))
                    {
                        strategy.FounderOverrides["ActivatedAt"] = DateTime.UtcNow.ToString("o");
                    }
                }
            }

            strategy.UpdatedAt = DateTime.UtcNow;

            var updatedJourney = await _journeys.SetPhase4GtmStrategyAsync(userId, strategy, request.IdeaId);

            return new GtmStrategyResponse
            {
                Strategy = strategy,
                UpdateAvailable = false,
                ChangedSources = new List<string>(),
                IdeaVersion = updatedJourney?.IdeaVersion ?? journey.IdeaVersion
            };
        }

        // =========================================================================
        // DERIVATION ORCHESTRATION & RECONCILIATION
        // =========================================================================

        private GtmStrategy ExecuteDerivation(GtmContext context, GtmStrategy? existing)
        {
            // 1. Prioritize segments
            var (primarySegmentName, segmentStrategies) = _policyEngine.PrioritizeSegments(context);
            var primarySegment = segmentStrategies.FirstOrDefault(s => s.SegmentName == primarySegmentName) ?? segmentStrategies.First();

            // 2. Adapt positioning
            var positioning = _policyEngine.AdaptPositioning(context, primarySegment);

            // 3. Determine sales motion (multi-signal)
            var (salesMotion, motionContext) = _policyEngine.DetermineSalesMotion(context, primarySegment);
            primarySegment.SalesMotion = salesMotion;

            // 4. Resolve founder capacity
            var capacityProfile = _capacityResolver.ResolveCapacityProfile(context.WeeklyAvailability);

            // 5. Evaluate channels
            var channels = _policyEngine.EvaluateChannels(context, primarySegment, salesMotion, capacityProfile);

            // 6. Formulate budget plan
            var budgetPlan = _policyEngine.FormulateBudgetPlan(context, channels);

            // 7. Design validation experiments
            var experiments = _policyEngine.DesignExperiments(context, primarySegment, channels, budgetPlan);

            // 8. Synthesize metrics contract
            var metrics = _policyEngine.SynthesizeMetrics(context, salesMotion);

            // 9. Build launch plan
            var launchPlan = _policyEngine.BuildLaunchPlan(context, primarySegment, channels, experiments);

            // 10. Assess risks and assumptions
            var (risks, assumptions) = _policyEngine.AssessRisksAndAssumptions(context, channels, capacityProfile, budgetPlan);

            // 11. Stable-Key Reconciliation with Existing Strategy
            var founderOverrides = new Dictionary<string, string>();
            string resolvedStatus = "Valid";

            if (existing != null)
            {
                // Preserve founder channel overrides
                foreach (var existingCh in existing.ChannelStrategy.Where(c => c.FounderEdited))
                {
                    var matching = channels.FirstOrDefault(c => c.Key == existingCh.Key);
                    if (matching != null)
                    {
                        matching.Priority = existingCh.Priority;
                        matching.ExecutionMode = existingCh.ExecutionMode;
                        matching.Owner = existingCh.Owner;
                        matching.BudgetAmount = existingCh.BudgetAmount;
                        matching.TimeRequirement = existingCh.TimeRequirement;
                        matching.FounderNotes = existingCh.FounderNotes;
                        matching.FounderEdited = true;
                    }
                    else
                    {
                        // Keep customized channel even if newly generated list shifted
                        channels.Add(existingCh);
                    }
                }

                // Preserve immutable historical experiment runs (Refinement 6)
                foreach (var existingExp in existing.Experiments)
                {
                    var matchingExp = experiments.FirstOrDefault(e => e.Key == existingExp.Key);
                    if (matchingExp != null)
                    {
                        // Copy all historical runs
                        matchingExp.Runs = existingExp.Runs ?? new List<ExperimentRun>();
                        if (!string.IsNullOrEmpty(existingExp.Result))
                        {
                            matchingExp.Result = existingExp.Result;
                        }
                        if (existingExp.Status == "Completed" || existingExp.Status == "Active")
                        {
                            matchingExp.Status = existingExp.Status;
                        }
                    }
                    else if (existingExp.Runs.Count > 0)
                    {
                        // If an experiment had completed runs, never delete it
                        experiments.Add(existingExp);
                    }
                }

                // Preserve launch action notes/status
                foreach (var action in launchPlan.PreLaunch.Concat(launchPlan.SoftLaunch).Concat(launchPlan.Launch).Concat(launchPlan.PostLaunch))
                {
                    var existingAction = existing.LaunchPlan.PreLaunch
                        .Concat(existing.LaunchPlan.SoftLaunch)
                        .Concat(existing.LaunchPlan.Launch)
                        .Concat(existing.LaunchPlan.PostLaunch)
                        .FirstOrDefault(a => a.Key == action.Key);

                    if (existingAction != null && existingAction.FounderEdited)
                    {
                        action.FounderStatus = existingAction.FounderStatus;
                        action.FounderNotes = existingAction.FounderNotes;
                        action.FounderEdited = true;
                    }
                }

                founderOverrides = new Dictionary<string, string>(existing.FounderOverrides);

                // Reapply Customer Group override
                if (founderOverrides.TryGetValue("CustomCustomerGroup", out var customGroup) && !string.IsNullOrWhiteSpace(customGroup))
                {
                    primarySegment.SegmentName = customGroup;
                    primarySegmentName = customGroup;
                }

                // Reapply Outreach Message override
                if (founderOverrides.TryGetValue("CustomOutreachMessage", out var customMessage) && !string.IsNullOrWhiteSpace(customMessage))
                {
                    positioning.PrimaryPromise = customMessage;
                }

                // Reapply Spendable Budget override
                if (founderOverrides.TryGetValue("SpendableBudget", out var budgetStr) && decimal.TryParse(budgetStr, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var customBudget))
                {
                    budgetPlan.TotalAvailableBudget = customBudget;
                    budgetPlan.BudgetSource = GtmBudgetSourceType.FounderDeclared;
                    budgetPlan.SpendableStatus = SpendableStatus.ConfirmedAvailable;
                    budgetPlan.ValidationStatus = GtmBudgetStatus.Confirmed;
                }

                // Reapply Target Overrides
                if (metrics != null)
                {
                    if (founderOverrides.TryGetValue("Target_Contacted", out var contStr) && decimal.TryParse(contStr, out var contVal))
                    {
                        var m = metrics.FirstOrDefault(x => x.Key == "outreach_volume" || x.Name.Contains("Outreach", StringComparison.OrdinalIgnoreCase) || x.Name.Contains("Contacted", StringComparison.OrdinalIgnoreCase));
                        if (m != null) { m.Target = contVal; m.TargetStatus = ExperimentThresholdStatus.FounderDefined; }
                    }
                    if (founderOverrides.TryGetValue("Target_Replies", out var repStr) && decimal.TryParse(repStr, out var repVal))
                    {
                        var m = metrics.FirstOrDefault(x => x.Key == "reply_rate" || x.Name.Contains("Reply", StringComparison.OrdinalIgnoreCase) || x.Name.Contains("Replies", StringComparison.OrdinalIgnoreCase));
                        if (m != null) { m.Target = repVal; m.TargetStatus = ExperimentThresholdStatus.FounderDefined; }
                    }
                    if (founderOverrides.TryGetValue("Target_Demos", out var demStr) && decimal.TryParse(demStr, out var demVal))
                    {
                        var m = metrics.FirstOrDefault(x => x.Key == "discovery_calls" || x.Name.Contains("Demo", StringComparison.OrdinalIgnoreCase) || x.Name.Contains("Discovery", StringComparison.OrdinalIgnoreCase) || x.Name.Contains("Call", StringComparison.OrdinalIgnoreCase));
                        if (m != null) { m.Target = demVal; m.TargetStatus = ExperimentThresholdStatus.FounderDefined; }
                    }
                    if (founderOverrides.TryGetValue("Target_Purchases", out var purStr) && decimal.TryParse(purStr, out var purVal))
                    {
                        var m = metrics.FirstOrDefault(x => x.Key == "closed_deals" || x.Name.Contains("Purchase", StringComparison.OrdinalIgnoreCase) || x.Name.Contains("Deal", StringComparison.OrdinalIgnoreCase) || x.Name.Contains("Customer", StringComparison.OrdinalIgnoreCase));
                        if (m != null) { m.Target = purVal; m.TargetStatus = ExperimentThresholdStatus.FounderDefined; }
                    }
                }

                // Reapply weekly hours availability override if present
                if (founderOverrides.TryGetValue("WeeklyHoursAvailable", out var hoursStr) && !string.IsNullOrWhiteSpace(hoursStr))
                {
                    capacityProfile = _capacityResolver.ResolveCapacityProfile($"{hoursStr} hours/week", channels);
                }

                // Preserve plan status if active
                if (existing.Status == "Active" || founderOverrides.ContainsKey("PlanActivated"))
                {
                    resolvedStatus = "Active";
                }
            }

            // Recalculate capacity load after reconciliation
            var reconciledCapacity = _capacityResolver.ResolveCapacityProfile(
                founderOverrides.TryGetValue("WeeklyHoursAvailable", out var explicitHours) && !string.IsNullOrWhiteSpace(explicitHours)
                    ? $"{explicitHours} hours/week"
                    : context.WeeklyAvailability,
                channels);

            bool pricingNeedsValidation = context.PricingValidationStatus == PricingConfidence.NeedsValidation;
            string pricingNotice = pricingNeedsValidation
                ? "Your current offer price has not yet been empirically validated. Initial GTM experiments will validate willingness-to-pay and offer response before scaling acquisition."
                : string.Empty;

            var strategy = new GtmStrategy
            {
                Id = existing?.Id,
                Status = resolvedStatus,
                GeneratedAt = existing?.GeneratedAt ?? DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                ExecutiveSummary = $"A sequenced customer acquisition plan for {context.Project.Name}, leading with {primarySegment.SegmentName} through {channels.FirstOrDefault(c => c.Priority == ChannelPriority.Now)?.ChannelName ?? "Founder-Led Sales"}.",
                PrimaryLaunchSegment = primarySegment.SegmentName,
                SegmentStrategies = segmentStrategies,
                PositioningStrategy = positioning,
                ChannelStrategy = channels,
                FounderExecutionPlan = reconciledCapacity,
                DelegationPlan = context.DelegatedCapabilities,
                FunnelStrategy = new List<string> { "Awareness", "Interest (Discovery)", "Consideration (Pilot)", "Conversion (Paid Contract)", "Activation & Delivery" },
                LaunchPlan = launchPlan,
                Experiments = experiments,
                MetricsFramework = metrics,
                BudgetPlan = budgetPlan,
                Risks = risks,
                Assumptions = assumptions,
                SourceVersions = context.CurrentSourceVersions,
                FounderOverrides = founderOverrides,
                PricingValidationRequired = pricingNeedsValidation,
                PricingValidationNotice = pricingNotice,
                CapacityWarningActive = reconciledCapacity.IsOverloaded
            };

            return strategy;
        }

        // =========================================================================
        // CONTEXT CONSTRUCTION
        // =========================================================================

        private async Task<GtmContext> BuildContextAsync(string userId, CreatorJourney journey, string? ideaId)
        {
            var ctx = new GtmContext
            {
                UserId = userId,
                IdeaId = ideaId,
                Project = journey.Project ?? new CreatorJourneyProject()
            };

            var p3 = journey.Phase3Data ?? new CreatorPhase3Data();
            var p4 = journey.Phase4Data ?? new CreatorPhase4Data();

            var consumedKeys = new List<string>();

            // 1. Phase 3.1 Market Study
            if (_marketStudies != null && !string.IsNullOrEmpty(p3.MarketStudySessionId))
            {
                var ms = await _marketStudies.GetOwnedAsync(p3.MarketStudySessionId, userId);
                if (ms != null)
                {
                    ctx.CurrentSourceVersions.MarketStudyVersion = ms.CurrentVersion;
                    consumedKeys.Add("MarketStudy");

                    var activeVer = ms.Versions.FirstOrDefault(v => v.Version == ms.CurrentVersion);
                    var doc = activeVer?.Content ?? activeVer?.GeneratedContent;
                    if (doc != null)
                    {
                        if (doc.Contains("segments") && doc["segments"].IsBsonArray)
                        {
                            foreach (var s in doc["segments"].AsBsonArray)
                            {
                                if (s.IsBsonDocument)
                                {
                                    var sd = s.AsBsonDocument;
                                    ctx.TargetSegments.Add(new GtmSegmentItem
                                    {
                                        Name = sd.Contains("name") ? sd["name"].AsString : "Target Segment",
                                        Details = sd.Contains("description") ? sd["description"].AsString : "",
                                        PainPoints = sd.Contains("painPoints") ? sd["painPoints"].AsString : "",
                                        WillingnessToPay = sd.Contains("willingnessToPay") ? sd["willingnessToPay"].AsString : "",
                                        Accessibility = sd.Contains("accessibility") ? sd["accessibility"].AsString : ""
                                    });
                                }
                            }
                        }

                        if (doc.Contains("competitors") && doc["competitors"].IsBsonArray)
                        {
                            foreach (var c in doc["competitors"].AsBsonArray)
                            {
                                if (c.IsBsonDocument)
                                {
                                    var cd = c.AsBsonDocument;
                                    if (cd.Contains("name")) ctx.CompetitorNames.Add(cd["name"].AsString);
                                    if (cd.Contains("vulnerability")) ctx.CompetitorWeaknesses.Add(cd["vulnerability"].AsString);
                                }
                            }
                        }
                    }
                }
            }

            // 2. Phase 3.2 Business Model & Positioning
            if (_businessModels != null && !string.IsNullOrEmpty(p3.BusinessModelSessionId))
            {
                var bm = await _businessModels.GetOwnedAsync(p3.BusinessModelSessionId, userId);
                if (bm != null)
                {
                    ctx.CurrentSourceVersions.BusinessModelVersion = bm.CurrentVersion;
                    consumedKeys.Add("BusinessModel");

                    var activeVer = bm.Versions.FirstOrDefault(v => v.Version == bm.CurrentVersion);
                    var doc = activeVer?.Content ?? activeVer?.GeneratedContent;
                    if (doc != null && doc.Contains("canvas") && doc["canvas"].IsBsonDocument)
                    {
                        var canvas = doc["canvas"].AsBsonDocument;
                        if (canvas.Contains("valuePropositions") && canvas["valuePropositions"].IsBsonArray)
                        {
                            foreach (var vp in canvas["valuePropositions"].AsBsonArray)
                            {
                                if (vp.IsBsonDocument && vp.AsBsonDocument.Contains("headline"))
                                {
                                    ctx.ValuePropositions.Add(vp.AsBsonDocument["headline"].AsString);
                                }
                            }
                        }
                    }
                }
            }

            // 3. Phase 3.4 Financial Forecast
            if (_forecasts != null && !string.IsNullOrEmpty(p3.ForecastSessionId))
            {
                var fc = await _forecasts.GetOwnedAsync(p3.ForecastSessionId, userId);
                if (fc != null)
                {
                    ctx.Forecast.SessionId = fc.Id;
                    ctx.Forecast.Version = fc.CurrentVersion;
                    ctx.Forecast.UpdatedAt = fc.UpdatedAt;
                    ctx.Forecast.HasForecast = fc.CurrentVersion > 0;

                    ctx.CurrentSourceVersions.ForecastVersion = fc.CurrentVersion;

                    if (fc.Inputs != null)
                    {
                        if (fc.Inputs.Arpu.HasValue) ctx.Forecast.Arpu = (decimal)fc.Inputs.Arpu.Value;
                        if (fc.Inputs.Opex.HasValue) ctx.Forecast.MonthlyOpex = (decimal)fc.Inputs.Opex.Value;
                    }

                    var activeVer = fc.Versions.FirstOrDefault(v => v.Version == fc.CurrentVersion);
                    var doc = activeVer?.Content ?? activeVer?.GeneratedContent;
                    if (doc != null)
                    {
                        // Check for forecast marketing budget
                        if (doc.Contains("costForecast") && doc["costForecast"].IsBsonDocument)
                        {
                            var cf = doc["costForecast"].AsBsonDocument;
                            if (cf.Contains("marketingBudget") && cf["marketingBudget"].IsNumeric)
                            {
                                ctx.Forecast.MarketingBudget = (decimal)cf["marketingBudget"].ToDouble();
                            }
                        }

                        // Check for forecast CAC
                        if (doc.Contains("unitEconomics") && doc["unitEconomics"].IsBsonDocument)
                        {
                            var ue = doc["unitEconomics"].AsBsonDocument;
                            if (ue.Contains("cac") && ue["cac"].IsNumeric)
                            {
                                ctx.Forecast.ForecastCac = (decimal)ue["cac"].ToDouble();
                            }
                        }
                    }

                    // Record consumed forecast values for fingerprinting (Refinement 7)
                    ctx.CurrentSourceVersions.ConsumedForecastMarketingBudget = ctx.Forecast.MarketingBudget;
                    ctx.CurrentSourceVersions.ConsumedForecastArpu = ctx.Forecast.Arpu;
                    ctx.CurrentSourceVersions.ConsumedForecastCac = ctx.Forecast.ForecastCac;
                    consumedKeys.Add("ForecastBudget");
                }
            }

            // 4. Phase 4.6 Pricing Strategy (Mandatory dependency)
            if (p4.PricingStrategy != null)
            {
                var ps = p4.PricingStrategy;
                ctx.PrimaryRevenueModel = ps.PrimaryRevenueModel.ToString();
                ctx.RevenueModels = ps.RevenueModels ?? new List<string>();
                ctx.PricingValidationStatus = ps.LaunchRecommendation?.Confidence ?? PricingConfidence.NeedsValidation;
                ctx.PricingExperiments = ps.PricingExperiments ?? new List<PricingExperiment>();

                foreach (var off in ps.Offers)
                {
                    ctx.Offers.Add(new GtmOfferItem
                    {
                        Key = off.Key,
                        Name = off.Name,
                        RevenueModel = off.PricingModel.ToString(),
                        RecommendedPrice = off.RecommendedPrice,
                        FounderSelectedPrice = off.FounderPrice,
                        EffectivePrice = off.Price,
                        IsFounderPrice = off.FounderPrice.HasValue,
                        Currency = off.Currency,
                        BillingPeriod = off.BillingFrequency.ToString(),
                        Features = off.IncludedFeatures ?? new List<string>(),
                        TargetSegment = off.CustomerSegment
                    });
                }

                ctx.CurrentSourceVersions.PricingStrategyUpdatedAt = ps.UpdatedAt;
                ctx.CurrentSourceVersions.PricingOffersFingerprint = string.Join(";", ctx.Offers.Select(o => $"{o.Key}:{o.EffectivePrice}:{o.RevenueModel}"));
                consumedKeys.Add("PricingStrategy");
            }

            // 5. Phase 4.4 Skills & Training Plan
            if (p4.SkillsPlan != null)
            {
                var sp = p4.SkillsPlan;
                foreach (var res in sp.Resolutions)
                {
                    if (res.ResolutionMode == ResolutionModes.Learn || res.ResolutionMode == ResolutionModes.Covered)
                    {
                        ctx.FounderCapabilities.Add(res.Capability);
                    }
                    else if (res.ResolutionMode == ResolutionModes.Delegate)
                    {
                        ctx.DelegatedCapabilities.Add(res.Capability);
                    }
                }
                ctx.CurrentSourceVersions.SkillsPlanUpdatedAt = sp.GeneratedAt;
                consumedKeys.Add("SkillsPlan");
            }

            // 6. Phase 4.2 Roadmap
            if (p4.Roadmap != null)
            {
                ctx.RoadmapTasks = p4.Roadmap.Tasks ?? new List<RoadmapTask>();
                ctx.CurrentSourceVersions.RoadmapUpdatedAt = p4.Roadmap.GeneratedAt;
                consumedKeys.Add("Roadmap");
            }

            // 7. Phase 4.5 Support Plan (Optional)
            if (p4.SupportPlan != null)
            {
                ctx.SupportPlanAvailable = true;
                ctx.CurrentSourceVersions.SupportPlanConsumed = true;
                ctx.CurrentSourceVersions.SupportPlanUpdatedAt = p4.SupportPlan.GeneratedAt;
                consumedKeys.Add("SupportPlan");

                // Check for awarded grants vs potential
                foreach (var match in p4.SupportPlan.Matches)
                {
                    if (match.EligibilityStatus == EligibilityStatus.Awarded ||
                        match.FounderApplicationState == FounderApplicationState.Awarded)
                    {
                        ctx.ConfirmedGrantBudget = (ctx.ConfirmedGrantBudget ?? 0) + (match.EstimatedSupportValue ?? 0);
                    }
                    else
                    {
                        ctx.PotentialGrantBudget = (ctx.PotentialGrantBudget ?? 0) + (match.EstimatedSupportValue ?? 0);
                    }
                }
            }

            // 8. HumainX Profile & Weekly Availability
            if (_professionalStore != null)
            {
                var profile = await _professionalStore.GetByUserIdAsync(userId);
                if (profile?.VentureContext != null)
                {
                    ctx.WeeklyAvailability = !string.IsNullOrWhiteSpace(profile.VentureContext.WeeklyAvailability)
                        ? profile.VentureContext.WeeklyAvailability
                        : "10–20 hours/week";
                    ctx.CurrentSituation = profile.VentureContext.CurrentSituation ?? string.Empty;
                }
                ctx.CurrentSourceVersions.ConsumedWeeklyAvailability = ctx.WeeklyAvailability;
                ctx.CurrentSourceVersions.ProfessionalProfileUpdatedAt = profile?.UpdatedAt;
                consumedKeys.Add("FounderAvailability");
            }

            ctx.CurrentSourceVersions.ConsumedKeys = consumedKeys;
            ctx.CurrentSourceVersions.ProjectUpdatedAt = journey.UpdatedAt;

            return ctx;
        }

        // =========================================================================
        // GATES & STALENESS
        // =========================================================================

        private async Task<PrerequisiteGateDto> CheckGateAsync(string userId, string? ideaId)
        {
            var reasons = new List<string>();

            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var phaseStatus = await _journeys.ComputePhaseStatusAsync(journey, phase1Complete: true);

            if (phaseStatus?.Phase3?.Status != "completed")
            {
                reasons.Add("Phase 3 (Market Study, Business Model, Financial Forecast) must be completed before building launch strategy.");
            }

            if (_professionalStore != null && _completenessResolver != null)
            {
                var profile = await _professionalStore.GetByUserIdAsync(userId);
                var readiness = _completenessResolver.Resolve(profile);
                if (readiness != null && !readiness.Phase4Ready)
                {
                    reasons.Add("HumainX profile must be completed before accessing Phase 4 tools.");
                }
            }

            var snapRes = await _snapshotService.GetSnapshotAsync(userId, ideaId);
            if (snapRes.Snapshot == null)
            {
                reasons.Add("SNAPSHOT_MISSING: Construction Snapshot must be generated first.");
            }
            else if (snapRes.UpdateAvailable)
            {
                reasons.Add("SNAPSHOT_REFRESH_REQUIRED: Construction Snapshot is stale and must be refreshed.");
            }

            var roadRes = await _roadmapService.GetRoadmapAsync(userId, ideaId);
            if (roadRes.Roadmap == null)
            {
                reasons.Add("ROADMAP_MISSING: Operational Roadmap must be completed first.");
            }
            else if (roadRes.UpdateAvailable)
            {
                reasons.Add("ROADMAP_REFRESH_REQUIRED: Operational Roadmap is stale and must be refreshed.");
            }

            var needsRes = await _needsService.GetNeedsAnalysisAsync(userId, ideaId);
            if (needsRes.NeedsAnalysis == null)
            {
                reasons.Add("NEEDS_MISSING: Needs Analysis must be completed first.");
            }
            else if (needsRes.UpdateAvailable)
            {
                reasons.Add("NEEDS_REFRESH_REQUIRED: Needs Analysis is stale and must be refreshed.");
            }

            var skillsRes = await _skillsService.GetSkillsPlanAsync(userId, ideaId);
            if (skillsRes.SkillsPlan == null)
            {
                reasons.Add("SKILLS_MISSING: Skills & Training Plan must be completed first.");
            }
            else if (skillsRes.UpdateAvailable)
            {
                reasons.Add("SKILLS_REFRESH_REQUIRED: Skills & Training Plan is stale and must be refreshed.");
            }

            // Gate check for PricingStrategy (Phase 4.6)
            var pricingRes = await _pricingService.GetPricingStrategyAsync(userId, ideaId);
            if (pricingRes.Strategy == null)
            {
                reasons.Add("PRICING_MISSING: Pricing & Revenue Model must be generated before building launch strategy.");
            }
            else if (pricingRes.UpdateAvailable)
            {
                reasons.Add("PRICING_REFRESH_REQUIRED: Pricing & Revenue Model is stale and must be refreshed first.");
            }

            // SupportPlan is intentionally NOT checked here (SupportPlan missing does not block GTM)

            return new PrerequisiteGateDto
            {
                CanAccess = reasons.Count == 0,
                BlockingReasons = reasons
            };
        }

        // Refinement 7: Consumed-source-based staleness detection
        private (bool IsStale, List<string> ChangedSources) DetectStaleness(
            GtmConsumedSources? saved,
            GtmConsumedSources current)
        {
            if (saved == null) return (false, new List<string>());

            var changed = new List<string>();

            // PricingStrategy changes: Stale!
            if (saved.PricingStrategyUpdatedAt.HasValue && current.PricingStrategyUpdatedAt.HasValue &&
                current.PricingStrategyUpdatedAt.Value > saved.PricingStrategyUpdatedAt.Value.AddSeconds(5))
            {
                changed.Add("Pricing & Revenue Model (Phase 4.6)");
            }
            else if (!string.IsNullOrEmpty(saved.PricingOffersFingerprint) &&
                     saved.PricingOffersFingerprint != current.PricingOffersFingerprint)
            {
                changed.Add("Pricing Offers & Structure (Phase 4.6)");
            }

            // Founder availability changes: Stale!
            if (!string.Equals(saved.ConsumedWeeklyAvailability, current.ConsumedWeeklyAvailability, StringComparison.OrdinalIgnoreCase))
            {
                changed.Add("Founder Weekly Availability");
            }

            // Phase 3.1 Market Study version: Stale!
            if (current.MarketStudyVersion > 0 && saved.MarketStudyVersion != current.MarketStudyVersion)
            {
                changed.Add("Market Study (Phase 3.1)");
            }

            // Phase 3.2 Business Model version: Stale!
            if (current.BusinessModelVersion > 0 && saved.BusinessModelVersion != current.BusinessModelVersion)
            {
                changed.Add("Business Model Canvas (Phase 3.2)");
            }

            // Forecast: Refinement 7 - ONLY stale if CONSUMED marketing budget or ARPU or CAC changed!
            // If only tax rate or unrelated opex changed, GTM is NOT stale.
            if (saved.ConsumedForecastMarketingBudget != current.ConsumedForecastMarketingBudget)
            {
                changed.Add("Forecast Marketing Budget (Phase 3.4)");
            }
            else if (saved.ConsumedForecastCac != current.ConsumedForecastCac)
            {
                changed.Add("Forecast CAC Assumption (Phase 3.4)");
            }

            // Conditional SupportPlan: only if consumed
            if (saved.SupportPlanConsumed && current.SupportPlanConsumed &&
                saved.SupportPlanUpdatedAt.HasValue && current.SupportPlanUpdatedAt.HasValue &&
                current.SupportPlanUpdatedAt.Value > saved.SupportPlanUpdatedAt.Value.AddSeconds(5))
            {
                changed.Add("Aids & Public Support (Phase 4.5)");
            }

            return (changed.Count > 0, changed);
        }
    }
}
