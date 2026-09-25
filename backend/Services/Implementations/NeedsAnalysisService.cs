using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Phase4;
using WebApp.Models.Phase4;
using WebApp.Services.Interface;
using WebApp.Services.Repository.Ai;

namespace WebApp.Services.Implementations
{
    public class NeedsAnalysisService : INeedsAnalysisService
    {
        private readonly ICreatorJourneyService _journeys;
        private readonly IConstructionSnapshotService _snapshotService;
        private readonly IOperationalRoadmapService _roadmapService;
        private readonly ICapabilityMatcher _capabilityMatcher;
        private readonly IProfessionalProfileStore? _professionalStore;
        private readonly IProfileCompletenessResolver? _completenessResolver;
        private readonly IMarketStudySessionStore? _marketStudies;
        private readonly IBusinessModelSessionStore? _businessModels;
        private readonly IForecastSessionStore? _forecasts;
        private readonly IBusinessPlanSessionStore? _businessPlans;

        public NeedsAnalysisService(
            ICreatorJourneyService journeys,
            IConstructionSnapshotService snapshotService,
            IOperationalRoadmapService roadmapService,
            ICapabilityMatcher capabilityMatcher,
            IProfessionalProfileStore? professionalStore = null,
            IProfileCompletenessResolver? completenessResolver = null,
            IMarketStudySessionStore? marketStudies = null,
            IBusinessModelSessionStore? businessModels = null,
            IForecastSessionStore? forecasts = null,
            IBusinessPlanSessionStore? businessPlans = null)
        {
            _journeys = journeys;
            _snapshotService = snapshotService;
            _roadmapService = roadmapService;
            _capabilityMatcher = capabilityMatcher;
            _professionalStore = professionalStore;
            _completenessResolver = completenessResolver;
            _marketStudies = marketStudies;
            _businessModels = businessModels;
            _forecasts = forecasts;
            _businessPlans = businessPlans;
        }

        public async Task<NeedsAnalysisResponse> GetNeedsAnalysisAsync(string userId, string? ideaId = null)
        {
            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var analysis = journey.Phase4Data?.NeedsAnalysis;

            if (analysis == null)
            {
                return new NeedsAnalysisResponse
                {
                    NeedsAnalysis = null,
                    UpdateAvailable = false,
                    ChangedSources = new List<string>(),
                    IdeaVersion = journey.IdeaVersion
                };
            }

            var context = await BuildContextAsync(userId, journey, ideaId);
            var (isStale, changedSources) = DetectStaleness(analysis.SourceVersions, context.CurrentSourceVersions);

            return BuildResponse(analysis, isStale, changedSources, journey.IdeaVersion);
        }

        public async Task<NeedsAnalysisResponse> GenerateNeedsAnalysisAsync(string userId, string? ideaId = null)
        {
            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var existing = journey.Phase4Data?.NeedsAnalysis;

            // Idempotency: Return existing analysis if already generated
            if (existing != null)
            {
                var ctx = await BuildContextAsync(userId, journey, ideaId);
                var (isStale, changed) = DetectStaleness(existing.SourceVersions, ctx.CurrentSourceVersions);
                return BuildResponse(existing, isStale, changed, journey.IdeaVersion);
            }

            // Enforce domain gates (must have completed Phase 3, HumainX, and non-stale snapshot & roadmap)
            await EnforceGateAsync(userId, ideaId);

            var context = await BuildContextAsync(userId, journey, ideaId);
            var newAnalysis = ExecuteDerivation(context, existingAnalysis: null);

            // Single source of truth: Persisted strictly on CreatorJourney
            var savedJourney = await _journeys.SetPhase4NeedsAnalysisAsync(userId, newAnalysis, ideaId);

            return BuildResponse(newAnalysis, updateAvailable: false, changedSources: new List<string>(), savedJourney?.IdeaVersion ?? journey.IdeaVersion);
        }

        public async Task<NeedsAnalysisResponse> RefreshNeedsAnalysisAsync(string userId, string? ideaId = null)
        {
            await EnforceGateAsync(userId, ideaId);

            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var existing = journey.Phase4Data?.NeedsAnalysis;

            var context = await BuildContextAsync(userId, journey, ideaId);
            var refreshedAnalysis = ExecuteDerivation(context, existing);

            // Single source of truth: Persisted strictly on CreatorJourney
            var savedJourney = await _journeys.SetPhase4NeedsAnalysisAsync(userId, refreshedAnalysis, ideaId);

            return BuildResponse(refreshedAnalysis, updateAvailable: false, changedSources: new List<string>(), savedJourney?.IdeaVersion ?? journey.IdeaVersion);
        }

        public async Task<NeedsAnalysisResponse> KeepCurrentNeedsAsync(string userId, string? ideaId = null)
        {
            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var analysis = journey.Phase4Data?.NeedsAnalysis;

            if (analysis == null)
            {
                throw new InvalidOperationException("Needs analysis has not been generated yet.");
            }

            var context = await BuildContextAsync(userId, journey, ideaId);
            analysis.SourceVersions = context.CurrentSourceVersions;
            analysis.UpdatedAt = DateTime.UtcNow;

            var savedJourney = await _journeys.SetPhase4NeedsAnalysisAsync(userId, analysis, ideaId);

            return BuildResponse(analysis, updateAvailable: false, changedSources: new List<string>(), savedJourney?.IdeaVersion ?? journey.IdeaVersion);
        }


        public async Task<NeedsAnalysisResponse> UpdateNeedStateAsync(string userId, string needKey, UpdateNeedStateRequest request)
        {
            if (string.IsNullOrWhiteSpace(needKey))
            {
                throw new ArgumentException("needKey is required.");
            }

            var journey = await _journeys.GetOrCreateComposedAsync(userId, request?.IdeaId);
            var analysis = journey.Phase4Data?.NeedsAnalysis;

            if (analysis == null)
            {
                throw new KeyNotFoundException("Needs analysis has not been generated yet.");
            }

            // Search in ActiveNeeds or CoveredRequirements
            var targetNeed = analysis.ActiveNeeds.FirstOrDefault(n => string.Equals(n.Key, needKey, StringComparison.OrdinalIgnoreCase))
                ?? analysis.CoveredRequirements.FirstOrDefault(n => string.Equals(n.Key, needKey, StringComparison.OrdinalIgnoreCase));

            if (targetNeed == null)
            {
                throw new KeyNotFoundException($"Need with key '{needKey}' not found.");
            }

            // Founder progress updates (separate from SystemStatus)
            if (!string.IsNullOrWhiteSpace(request?.FounderState))
            {
                targetNeed.FounderState = request.FounderState;
            }
            if (request?.Notes != null)
            {
                targetNeed.Notes = request.Notes;
            }
            if (request?.CustomBudget.HasValue == true)
            {
                targetNeed.CustomBudget = request.CustomBudget.Value;
            }
            if (request?.CustomTiming != null)
            {
                targetNeed.CustomTiming = request.CustomTiming;
            }
            if (!string.IsNullOrWhiteSpace(request?.FounderInformation))
            {
                targetNeed.FounderInformation = request.FounderInformation.Trim();
            }

            targetNeed.FounderEdited = true;
            targetNeed.UpdatedAt = DateTime.UtcNow;
            analysis.FounderEdited = true;
            analysis.UpdatedAt = DateTime.UtcNow;

            // Rebalance between Active and Covered if FounderState changed to/from ClaimedSatisfied
            RebalanceActiveAndCovered(analysis);
            UpdateMetricsAndSummary(analysis);

            var savedJourney = await _journeys.SetPhase4NeedsAnalysisAsync(userId, analysis, request?.IdeaId);

            var context = await BuildContextAsync(userId, journey, request?.IdeaId);
            var (isStale, changed) = DetectStaleness(analysis.SourceVersions, context.CurrentSourceVersions);

            return BuildResponse(analysis, isStale, changed, savedJourney?.IdeaVersion ?? journey.IdeaVersion);
        }

        private async Task EnforceGateAsync(string userId, string? ideaId)
        {
            var current = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var phaseStatus = await _journeys.ComputePhaseStatusAsync(current, phase1Complete: true);

            if (phaseStatus.Phase3.Status != "completed")
            {
                throw new InvalidOperationException("Phase 3 must be completed before entering Phase 4.");
            }

            if (_professionalStore != null && _completenessResolver != null)
            {
                var profile = await _professionalStore.GetByUserIdAsync(userId);
                var readiness = _completenessResolver.Resolve(profile);
                if (!readiness.Phase4Ready)
                {
                    throw new InvalidOperationException("HumainX profile must be completed before accessing Phase 4 tools.");
                }
            }

            // Prerequisite: Construction Snapshot must exist
            var snapshotRes = await _snapshotService.GetSnapshotAsync(userId, ideaId);
            if (snapshotRes.Snapshot == null)
            {
                throw new InvalidOperationException("SNAPSHOT_MISSING: Construction Snapshot must be generated first.");
            }

            // Prerequisite: Construction Snapshot must be current (not stale)
            if (snapshotRes.UpdateAvailable)
            {
                throw new InvalidOperationException("SNAPSHOT_REFRESH_REQUIRED: Construction Snapshot is stale and must be refreshed before analyzing needs.");
            }

            // Prerequisite: Operational Roadmap must exist
            var roadmapRes = await _roadmapService.GetRoadmapAsync(userId, ideaId);
            if (roadmapRes.Roadmap == null)
            {
                throw new InvalidOperationException("ROADMAP_MISSING: Operational Roadmap must be generated first.");
            }

            // Prerequisite: Operational Roadmap must be current (not stale)
            if (roadmapRes.UpdateAvailable)
            {
                throw new InvalidOperationException("ROADMAP_REFRESH_REQUIRED: Operational Roadmap is stale and must be refreshed before analyzing needs.");
            }
        }

        private async Task<NeedsContext> BuildContextAsync(string userId, CreatorJourney journey, string? ideaId)
        {
            var ctx = new NeedsContext();

            ctx.ConstructionSnapshot = journey.Phase4Data?.ConstructionSnapshot;
            ctx.OperationalRoadmap = journey.Phase4Data?.Roadmap;

            var p3 = journey.Phase3Data ?? new CreatorPhase3Data();

            // Load Phase 3 structured sources
            if (_businessModels != null && !string.IsNullOrEmpty(p3.BusinessModelSessionId))
            {
                var bm = await _businessModels.GetOwnedAsync(p3.BusinessModelSessionId, userId);
                if (bm != null)
                {
                    ctx.BusinessModel.SessionId = bm.Id;
                    ctx.BusinessModel.Version = bm.CurrentVersion;
                    ctx.BusinessModel.UpdatedAt = bm.UpdatedAt;
                    ctx.BusinessModel.HasBusinessModel = bm.CurrentVersion > 0;
                }
            }

            if (_forecasts != null && !string.IsNullOrEmpty(p3.ForecastSessionId))
            {
                var fc = await _forecasts.GetOwnedAsync(p3.ForecastSessionId, userId);
                if (fc != null)
                {
                    ctx.Forecast.SessionId = fc.Id;
                    ctx.Forecast.Version = fc.CurrentVersion;
                    ctx.Forecast.UpdatedAt = fc.UpdatedAt;
                    ctx.Forecast.HasForecast = fc.CurrentVersion > 0;
                    if (fc.Inputs?.Opex.HasValue == true && fc.Inputs.Opex.Value > 0)
                    {
                        ctx.Forecast.TotalLaunchBudget = (decimal)(fc.Inputs.Opex.Value * 12);
                        ctx.Forecast.FundingNeed = ctx.Forecast.TotalLaunchBudget;
                    }
                }
            }

            if (p3.LegalAssessment != null)
            {
                var la = p3.LegalAssessment;
                ctx.Legal.HasLegalAssessment = true;
                ctx.Legal.UpdatedAt = la.EvaluatedAt;
                ctx.Legal.ChecklistCompletedCount = la.Items?.Count(i => i.Status == "completed") ?? 0;
                ctx.Legal.ChecklistTotalCount = la.Items?.Count ?? 0;
            }

            if (p3.FormationGenerator != null)
            {
                var fg = p3.FormationGenerator;
                ctx.Formation.Version = 1;
                ctx.Formation.UpdatedAt = p3.LegalAssessment?.EvaluatedAt ?? journey.CreatedAt;
                ctx.Formation.RecommendedType = fg.RecommendedType ?? string.Empty;

                ctx.Formation.SelectedType = fg.SelectedType ?? string.Empty;
                ctx.Formation.YouHave = fg.YouHave ?? new();
                ctx.Formation.YouNeed = fg.YouNeed ?? new();
                ctx.Formation.CofounderNeeded = fg.CofounderDraft != null;
            }

            if (_professionalStore != null)
            {
                var profile = await _professionalStore.GetByUserIdAsync(userId);
                var vc = profile?.VentureContext;
                if (profile != null)
                {
                    ctx.FounderProfile.Skills = profile.Skills ?? new();
                    ctx.FounderProfile.Experiences = profile.Experiences ?? new();
                    ctx.FounderProfile.Education = profile.Education ?? new();
                    ctx.FounderProfile.Languages = profile.LanguageProficiencies ?? new();
                    ctx.FounderProfile.WeeklyAvailability = vc?.WeeklyAvailability ?? string.Empty;
                    ctx.FounderProfile.UpdatedAt = profile.UpdatedAt;
                    ctx.VentureContext = vc;
                }
            }

            // Fingerprint versions
            ctx.CurrentSourceVersions = new NeedsSourceVersions
            {
                ConstructionSnapshotUpdatedAt = ctx.ConstructionSnapshot?.UpdatedAt,
                OperationalRoadmapUpdatedAt = ctx.OperationalRoadmap?.UpdatedAt,
                BusinessModelVersion = ctx.BusinessModel.Version,
                BusinessModelUpdatedAt = ctx.BusinessModel.UpdatedAt,
                ForecastVersion = ctx.Forecast.Version,
                ForecastUpdatedAt = ctx.Forecast.UpdatedAt,
                LegalAssessmentUpdatedAt = ctx.Legal.UpdatedAt,
                LegalChecklistCompletedCount = ctx.Legal.ChecklistCompletedCount,
                FormationVersion = ctx.Formation.Version,
                FormationUpdatedAt = ctx.Formation.UpdatedAt,
                ProfessionalProfileUpdatedAt = ctx.FounderProfile.UpdatedAt
            };

            return ctx;
        }

        private (bool isStale, List<string> changedSources) DetectStaleness(NeedsSourceVersions saved, NeedsSourceVersions current)
        {
            var changed = new List<string>();

            if (saved == null)
            {
                return (true, new List<string> { "Initial Setup" });
            }

            if (saved.ConstructionSnapshotUpdatedAt != current.ConstructionSnapshotUpdatedAt)
                changed.Add("Construction Snapshot");

            if (saved.OperationalRoadmapUpdatedAt != current.OperationalRoadmapUpdatedAt)
                changed.Add("Operational Roadmap");

            if (saved.BusinessModelVersion != current.BusinessModelVersion || saved.BusinessModelUpdatedAt != current.BusinessModelUpdatedAt)
                changed.Add("Business Model");

            if (saved.ForecastVersion != current.ForecastVersion || saved.ForecastUpdatedAt != current.ForecastUpdatedAt)
                changed.Add("Financial Forecast");

            if (saved.LegalAssessmentUpdatedAt != current.LegalAssessmentUpdatedAt || saved.LegalChecklistCompletedCount != current.LegalChecklistCompletedCount)
                changed.Add("Legal Assessment");

            if (saved.FormationVersion != current.FormationVersion || saved.FormationUpdatedAt != current.FormationUpdatedAt)
                changed.Add("Company Formation");

            if (saved.ProfessionalProfileUpdatedAt != current.ProfessionalProfileUpdatedAt)
                changed.Add("Professional Profile");

            return (changed.Count > 0, changed);
        }

        private NeedsAnalysis ExecuteDerivation(NeedsContext context, NeedsAnalysis? existingAnalysis)
        {
            var rawCandidates = new List<CreatorNeed>();
            var founderSkills = context.FounderProfile?.Skills ?? new List<ProfileSkill>();
            var teamCovered = context.Formation?.YouHave ?? new List<string>();

            // 1. DERIVE FROM SNAPSHOT (Phase 4.1)
            if (context.ConstructionSnapshot != null)
            {
                var snapshot = context.ConstructionSnapshot;
                var unreadyItems = snapshot.CriticalItems
                    .Concat(snapshot.MissingItems)
                    .Concat(snapshot.PartialItems);

                foreach (var item in unreadyItems)
                {
                    // Capability / Skill gaps
                    if (string.Equals(item.Category, ConstructionCategories.Skills, StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(item.Category, ConstructionCategories.Team, StringComparison.OrdinalIgnoreCase))
                    {
                        var reqKey = $"team.{SanitizeKey(item.Key)}";
                        var reqTitle = item.Title.Replace("Missing", "").Replace("Review", "").Trim();
                        if (string.IsNullOrWhiteSpace(reqTitle)) reqTitle = item.Title;

                        // Check coverage against founder skills
                        var matchResult = _capabilityMatcher.MatchCapability(reqTitle, founderSkills);
                        var isTeamCovered = teamCovered.Any(t => t.Contains("Developer", StringComparison.OrdinalIgnoreCase) ||
                                                                t.Contains("Technical", StringComparison.OrdinalIgnoreCase) ||
                                                                t.Contains("CTO", StringComparison.OrdinalIgnoreCase) ||
                                                                t.Contains(reqTitle, StringComparison.OrdinalIgnoreCase));

                        var isCovered = (matchResult.IsMatched && matchResult.Status == ConstructionItemStatus.Ready) || isTeamCovered;

                        var candidate = new CreatorNeed
                        {
                            Key = reqKey,
                            Category = NeedCategories.Team,
                            Title = $"{reqTitle} Capability",
                            Description = item.Reason,
                            WhyNeeded = isCovered
                                ? $"Covered by your declared profile capability or founding team."
                                : $"Your construction snapshot identified that {reqTitle} capability is not fully covered by the founding team.",
                            Priority = item.Priority == ConstructionItemPriority.Critical ? NeedPriority.Critical : NeedPriority.High,
                            Timing = NeedTiming.Now,
                            RequirementType = RequirementTypes.Capability,
                            SystemStatus = isCovered ? NeedSystemStatus.Satisfied : (matchResult.Status == ConstructionItemStatus.NeedsReview ? NeedSystemStatus.NeedsReview : NeedSystemStatus.Identified),
                            FounderState = isCovered ? NeedFounderState.ClaimedSatisfied : NeedFounderState.Unreviewed,
                            Blocking = item.Blocking && !isCovered,
                            CapabilityRequired = reqTitle,
                            RelatedSnapshotItemKeys = new List<string> { item.Key },
                            Source = new List<string> { "Construction Snapshot", "HumainX Profile" },
                            SourceReference = item.SourceReference ?? new List<string>(),

                            WhatIsNeeded = item.Reason,
                            WhyThisApplies = isCovered
                                ? $"Covered by your declared profile capability or founding team."
                                : $"Your construction snapshot identified that {reqTitle} capability is not fully covered by the founding team.",
                            WhatYouAlreadyHave = isCovered
                                ? (isTeamCovered ? "Team member assigned with relevant background." : $"Matched capability '{reqTitle}' in your founder profile.")
                                : "No confirmed founding team member or verified profile capability for this discipline.",
                            WhatIsStillMissing = isCovered
                                ? "None identified; ready for execution."
                                : $"Dedicated {reqTitle} talent, advisor, or service partner.",
                            WhatWouldSatisfy = $"Documented qualification, verified founder experience, or engaged specialist covering {reqTitle}."
                        };
                        rawCandidates.Add(candidate);
                    }
                }
            }

            // 2. DERIVE FROM OPERATIONAL ROADMAP (Phase 4.2)
            if (context.OperationalRoadmap != null)
            {
                foreach (var task in context.OperationalRoadmap.Tasks)
                {
                    // Map task timing
                    var taskTiming = NeedTiming.FromRoadmapStage(task.Stage);

                    // If task requires external action or is blocking legal/financial
                    if (task.RequiresExternalAction || task.Blocking || task.Category == RoadmapCategories.LegalAndAdministration)
                    {
                        string needCategory = task.Category switch
                        {
                            RoadmapCategories.LegalAndAdministration => NeedCategories.LegalAndAdministration,
                            RoadmapCategories.Finance => NeedCategories.Finance,
                            RoadmapCategories.Services => NeedCategories.Services,
                            RoadmapCategories.Technology => NeedCategories.Technology,
                            RoadmapCategories.GoToMarket => NeedCategories.Marketing,
                            RoadmapCategories.Operations => NeedCategories.Operations,
                            _ => NeedCategories.Services
                        };

                        string reqType = needCategory switch
                        {
                            NeedCategories.LegalAndAdministration => RequirementTypes.LegalAdministrative,
                            NeedCategories.Finance => RequirementTypes.FinancialResource,
                            NeedCategories.Technology => RequirementTypes.Technology,
                            NeedCategories.Services => RequirementTypes.ProfessionalService,
                            _ => RequirementTypes.OperationalResource
                        };

                        var candidate = new CreatorNeed
                        {
                            Key = $"roadmap.{SanitizeKey(task.Key)}",
                            Category = needCategory,
                            Title = task.Title,
                            Description = task.Description,
                            WhyNeeded = !string.IsNullOrWhiteSpace(task.Why) ? task.Why : $"Required by operational roadmap task in stage {task.Stage}.",
                            Priority = task.Priority == RoadmapTaskPriority.Critical ? NeedPriority.Critical : (task.Priority == RoadmapTaskPriority.High ? NeedPriority.High : NeedPriority.Medium),
                            Timing = taskTiming,
                            RequirementType = reqType,
                            SystemStatus = task.Status == RoadmapTaskStatus.Done ? NeedSystemStatus.Satisfied : NeedSystemStatus.Identified,
                            FounderState = task.Status == RoadmapTaskStatus.Done ? NeedFounderState.ClaimedSatisfied : NeedFounderState.Unreviewed,
                            Blocking = task.Blocking && task.Status != RoadmapTaskStatus.Done,
                            RelatedRoadmapTaskKeys = new List<string> { task.Key },
                            Source = new List<string> { "Operational Roadmap" },

                            WhatIsNeeded = task.Description,
                            WhyThisApplies = !string.IsNullOrWhiteSpace(task.Why) ? task.Why : $"Required by operational roadmap task in stage {task.Stage}.",
                            WhatYouAlreadyHave = task.Status == RoadmapTaskStatus.Done
                                ? "Task completed on operational roadmap."
                                : $"Scheduled in roadmap stage: {task.Stage}.",
                            WhatIsStillMissing = task.Status == RoadmapTaskStatus.Done
                                ? "None; prerequisite deliverable completed."
                                : $"Completion and verification of task '{task.Title}'.",
                            WhatWouldSatisfy = $"Execution of '{task.Title}' with required deliverable recorded."
                        };
                        rawCandidates.Add(candidate);
                    }
                }
            }

            // 3. DERIVE FROM STATUTORY LEGAL ASSESSMENT (Phase 3)
            // Accounting Support
            var acctMatch = _capabilityMatcher.MatchCapability("Finance & Accounting", founderSkills);
            var isAcctCovered = acctMatch.IsMatched && acctMatch.Status == ConstructionItemStatus.Ready;
            rawCandidates.Add(new CreatorNeed
            {
                Key = "service.accounting-support",
                Category = NeedCategories.Services,
                Title = "Chartered Accounting & Financial Supervision",
                Description = "Engage a certified accountant (expert-comptable) for fiscal registration, corporate books, and statutory tax declaration.",
                WhyNeeded = isAcctCovered
                    ? "Covered by your declared finance and accounting background."
                    : "French corporate law and fiscal administration require chartered accounting oversight for annual statutory filings.",
                Priority = NeedPriority.High,
                Timing = NeedTiming.Next30Days,
                RequirementType = RequirementTypes.ProfessionalService,
                SystemStatus = isAcctCovered ? NeedSystemStatus.Satisfied : NeedSystemStatus.Identified,
                FounderState = isAcctCovered ? NeedFounderState.ClaimedSatisfied : NeedFounderState.Unreviewed,
                Blocking = false,
                Source = new List<string> { "Legal Assessment", "Formation & Team" },

                WhatIsNeeded = "Statutory accounting oversight, corporate tax declaration, and financial compliance structure.",
                WhyThisApplies = "French corporate law requires chartered accounting supervision for statutory financial statements and tax declarations.",
                WhatYouAlreadyHave = isAcctCovered
                    ? "Declared finance and accounting competency in founder profile."
                    : "No certified accountant currently designated for corporate books.",
                WhatIsStillMissing = isAcctCovered
                    ? "Formal engagement letter or mandate."
                    : "Engagement of an accredited expert-comptable or authorized corporate accountant.",
                WhatWouldSatisfy = "Signed engagement letter with an accredited chartered accountant or authorized accounting firm."
            });

            // Corporate Share Capital Deposit (FR-CORP-001)
            rawCandidates.Add(new CreatorNeed
            {
                Key = "legal.capital-deposit",
                Category = NeedCategories.LegalAndAdministration,
                Title = "Statutory Share Capital Deposit",
                Description = "Deposit minimum share capital (capital social) in an escrow deposit account to obtain the bank deposit certificate.",
                WhyNeeded = "Mandatory statutory prerequisite under French Commercial Code to complete corporate registration on the RNE.",
                Priority = NeedPriority.Critical,
                Timing = NeedTiming.Now,
                RequirementType = RequirementTypes.LegalAdministrative,
                SystemStatus = NeedSystemStatus.Identified,
                FounderState = NeedFounderState.Unreviewed,
                Blocking = true,
                Source = new List<string> { "Legal Assessment (FR-2026.1)" },

                WhatIsNeeded = "Escrow deposit of share capital (capital social) and official certificate of deposit.",
                WhyThisApplies = "Mandatory statutory prerequisite under French Commercial Code to complete corporate registration on the RNE.",
                WhatYouAlreadyHave = "Entity formation structure and capital distribution defined in Company Formation.",
                WhatIsStillMissing = "Escrow account opening and official bank issuance of the capital deposit certificate.",
                WhatWouldSatisfy = "Attestation de dépôt des fonds issued by an authorized bank, notary, or Caisse des Dépôts."
            });

            // INPI Trademark Filing (FR-IP-001)
            rawCandidates.Add(new CreatorNeed
            {
                Key = "legal.trademark-filing",
                Category = NeedCategories.LegalAndAdministration,
                Title = "INPI Trademark Brand Protection",
                Description = "File commercial brand and mark registration on the Institut National de la Propriété Industrielle (INPI).",
                WhyNeeded = "Secures statutory exclusive IP protection for the venture name and brand lockups across France and the EU.",
                Priority = NeedPriority.Medium,
                Timing = NeedTiming.Days30To60,
                RequirementType = RequirementTypes.LegalAdministrative,
                SystemStatus = NeedSystemStatus.Identified,
                FounderState = NeedFounderState.Unreviewed,
                Blocking = false,
                Source = new List<string> { "Legal Assessment (FR-IP-001)" },

                WhatIsNeeded = "National or EU trademark filing covering venture brand identity and distinctive classes.",
                WhyThisApplies = "Secures statutory exclusive IP protection for the venture name and brand lockups across France and the EU.",
                WhatYouAlreadyHave = "Brand identity guidelines and commercial trade name defined in venture materials.",
                WhatIsStillMissing = "Prior art clearance search and official filing submission to INPI.",
                WhatWouldSatisfy = "Official filing receipt (numéro de dépôt) and publication in the BOPI from INPI."
            });

            // 4. DERIVE FROM FINANCIAL FORECAST (Phase 3)
            // Launch Capital & Operating Reserve (Never invent numbers)
            decimal? launchBudget = context.Forecast?.FundingNeed ?? context.Forecast?.TotalLaunchBudget;
            string budgetConfidence = launchBudget.HasValue && launchBudget.Value > 0
                ? BudgetConfidence.DerivedFromForecast
                : BudgetConfidence.Unknown;

            rawCandidates.Add(new CreatorNeed
            {
                Key = "finance.launch-capital",
                Category = NeedCategories.Finance,
                Title = "Launch Capital & Operating Reserve",
                Description = "Secure initial launch financing to cover pre-launch operations and initial working capital.",
                WhyNeeded = "Your financial forecast projects capital requirements needed before operational break-even.",
                Priority = NeedPriority.Critical,
                Timing = NeedTiming.Now,
                RequirementType = RequirementTypes.FinancialResource,
                EstimatedBudget = launchBudget,
                BudgetConfidence = budgetConfidence,
                SystemStatus = NeedSystemStatus.Identified,
                FounderState = NeedFounderState.Unreviewed,
                Blocking = true,
                Source = new List<string> { "Financial Forecast" },

                WhatIsNeeded = launchBudget.HasValue && launchBudget.Value > 0
                    ? $"Initial launch capital of approximately {launchBudget.Value:C0} to fund runway and operational setup."
                    : "Initial launch capital to fund operational runway before self-sufficiency.",
                WhyThisApplies = "Your financial forecast projects capital requirements needed before operational break-even.",
                WhatYouAlreadyHave = launchBudget.HasValue
                    ? "Detailed financial forecast model with operational expense breakdown."
                    : "Preliminary financial model.",
                WhatIsStillMissing = "Secured bank account balances, confirmed grant/loan agreements, or committed equity investment.",
                WhatWouldSatisfy = "Evidence of committed capital, verified bank deposit, or signed funding agreement meeting the forecast reserve."
            });

            // 5. DERIVE FROM BUSINESS MODEL (Technology / Infrastructure)
            if (context.BusinessModel != null && context.BusinessModel.RevenueStreams.Any())
            {
                rawCandidates.Add(new CreatorNeed
                {
                    Key = "technology.payment-processing",
                    Category = NeedCategories.Technology,
                    Title = "Payment Gateway & Merchant Account",
                    Description = "Integrate a regulated Payment Service Provider (PSP) for customer transactions and billing automation.",
                    WhyNeeded = "Your business model specifies online revenue streams requiring secure, compliant payment processing.",
                    Priority = NeedPriority.High,
                    Timing = NeedTiming.Next30Days,
                    RequirementType = RequirementTypes.Technology,
                    SystemStatus = NeedSystemStatus.Identified,
                    FounderState = NeedFounderState.Unreviewed,
                    Blocking = false,
                    Source = new List<string> { "Business Model" },

                    WhatIsNeeded = "Compliant Payment Service Provider (PSP) integration with merchant account and webhook automation.",
                    WhyThisApplies = "Your business model specifies online revenue streams requiring secure, compliant payment processing.",
                    WhatYouAlreadyHave = "Revenue model and pricing tiers defined in business model.",
                    WhatIsStillMissing = "Merchant account registration, KYC verification, and payment gateway technical integration.",
                    WhatWouldSatisfy = "Active verified merchant account successfully processing test or live transactions."
                });
            }

            // 6. DEDUPLICATE BY STABLE KEY
            var deduplicated = DeduplicateCandidates(rawCandidates);

            // 7. RECONCILE WITH FOUNDER-CONTROLLED STATE ON REFRESH
            if (existingAnalysis != null)
            {
                var existingAll = existingAnalysis.ActiveNeeds
                    .Concat(existingAnalysis.CoveredRequirements)
                    .ToList();

                foreach (var need in deduplicated)
                {
                    var existingNeed = existingAll.FirstOrDefault(e => string.Equals(e.Key, need.Key, StringComparison.OrdinalIgnoreCase));
                    if (existingNeed != null)
                    {
                        // Preserve founder modifications
                        need.FounderState = existingNeed.FounderState;
                        need.Notes = existingNeed.Notes;
                        need.CustomBudget = existingNeed.CustomBudget;
                        need.CustomTiming = existingNeed.CustomTiming;
                        need.FounderEdited = existingNeed.FounderEdited;
                        need.FounderInformation = existingNeed.FounderInformation;

                        // Authoritative check: do not reopen satisfied if founder confirmed it or system says satisfied
                        if (existingNeed.SystemStatus == NeedSystemStatus.Satisfied && need.SystemStatus != NeedSystemStatus.Satisfied)
                        {
                            // If source didn't materially break it, preserve
                            need.SystemStatus = NeedSystemStatus.Satisfied;
                        }
                    }
                }
            }

            // 8. ASSEMBLE ANALYSIS ROOT
            var result = new NeedsAnalysis
            {
                Status = "Completed",
                GeneratedAt = existingAnalysis?.GeneratedAt ?? DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                SourceVersions = context.CurrentSourceVersions,
                FounderEdited = existingAnalysis?.FounderEdited ?? false
            };

            // Partition into ActiveNeeds and CoveredRequirements
            foreach (var need in deduplicated)
            {
                if (need.SystemStatus == NeedSystemStatus.Satisfied ||
                    need.SystemStatus == NeedSystemStatus.NotRequired ||
                    need.FounderState == NeedFounderState.ClaimedSatisfied)
                {
                    result.CoveredRequirements.Add(need);
                }
                else
                {
                    result.ActiveNeeds.Add(need);
                }
            }

            RebalanceActiveAndCovered(result);
            UpdateMetricsAndSummary(result);

            return result;
        }

        private static List<CreatorNeed> DeduplicateCandidates(List<CreatorNeed> candidates)
        {
            var map = new Dictionary<string, CreatorNeed>(StringComparer.OrdinalIgnoreCase);

            foreach (var item in candidates)
            {
                if (map.TryGetValue(item.Key, out var existing))
                {
                    // Merge sources & references
                    foreach (var s in item.Source)
                        if (!existing.Source.Contains(s)) existing.Source.Add(s);

                    foreach (var sr in item.SourceReference)
                        if (!existing.SourceReference.Contains(sr)) existing.SourceReference.Add(sr);

                    foreach (var rk in item.RelatedRoadmapTaskKeys)
                        if (!existing.RelatedRoadmapTaskKeys.Contains(rk)) existing.RelatedRoadmapTaskKeys.Add(rk);

                    foreach (var sk in item.RelatedSnapshotItemKeys)
                        if (!existing.RelatedSnapshotItemKeys.Contains(sk)) existing.RelatedSnapshotItemKeys.Add(sk);

                    // Escalate priority if higher
                    if (item.Priority == NeedPriority.Critical) existing.Priority = NeedPriority.Critical;
                    else if (item.Priority == NeedPriority.High && existing.Priority != NeedPriority.Critical) existing.Priority = NeedPriority.High;

                    existing.Blocking = existing.Blocking || item.Blocking;
                }
                else
                {
                    map[item.Key] = item;
                }
            }

            return map.Values.ToList();
        }

        private static void RebalanceActiveAndCovered(NeedsAnalysis analysis)
        {
            var all = analysis.ActiveNeeds.Concat(analysis.CoveredRequirements).ToList();
            analysis.ActiveNeeds.Clear();
            analysis.CoveredRequirements.Clear();

            foreach (var need in all)
            {
                if (need.SystemStatus == NeedSystemStatus.Satisfied ||
                    need.SystemStatus == NeedSystemStatus.NotRequired ||
                    need.FounderState == NeedFounderState.ClaimedSatisfied)
                {
                    analysis.CoveredRequirements.Add(need);
                }
                else
                {
                    analysis.ActiveNeeds.Add(need);
                }
            }
        }

        private static void UpdateMetricsAndSummary(NeedsAnalysis analysis)
        {
            analysis.TotalActiveNeeds = analysis.ActiveNeeds.Count;
            analysis.CriticalNeedCount = analysis.ActiveNeeds.Count(n => n.Priority == NeedPriority.Critical);
            analysis.HighPriorityCount = analysis.ActiveNeeds.Count(n => n.Priority == NeedPriority.High);
            analysis.SatisfiedCount = analysis.CoveredRequirements.Count;

            analysis.CountsByCategory = analysis.ActiveNeeds
                .GroupBy(n => n.Category)
                .ToDictionary(g => g.Key, g => g.Count());

            var topCritical = analysis.ActiveNeeds
                .Where(n => n.Priority == NeedPriority.Critical)
                .Take(2)
                .Select(n => n.Title)
                .ToList();

            var criticalSnippet = topCritical.Any()
                ? $", with critical focus on {string.Join(" and ", topCritical)}"
                : "";

            analysis.Summary = $"Your venture has {analysis.TotalActiveNeeds} active requirements identified across {analysis.CountsByCategory.Count} operational categories{criticalSnippet}. {analysis.SatisfiedCount} foundational capabilities are already covered.";
        }

        private static NeedsAnalysisResponse BuildResponse(NeedsAnalysis analysis, bool updateAvailable, List<string> changedSources, long ideaVersion = 0)
        {
            return new NeedsAnalysisResponse
            {
                NeedsAnalysis = analysis,
                UpdateAvailable = updateAvailable,
                ChangedSources = changedSources,
                CriticalNeedCount = analysis.CriticalNeedCount,
                HighPriorityCount = analysis.HighPriorityCount,
                TotalActiveNeeds = analysis.TotalActiveNeeds,
                SatisfiedCount = analysis.SatisfiedCount,
                IdeaVersion = ideaVersion
            };
        }

        private static string SanitizeKey(string input)
        {
            if (string.IsNullOrWhiteSpace(input)) return Guid.NewGuid().ToString("N").Substring(0, 8);
            var clean = System.Text.RegularExpressions.Regex.Replace(input.ToLowerInvariant().Trim(), @"[^a-z0-9\-]", "-");
            return clean.Trim('-');
        }
    }
}
