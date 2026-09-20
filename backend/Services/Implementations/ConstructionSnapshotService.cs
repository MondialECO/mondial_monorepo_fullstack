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
    public class ConstructionSnapshotService : IConstructionSnapshotService
    {
        private readonly ICreatorJourneyService _journeys;
        private readonly IProfessionalProfileStore? _professionalStore;
        private readonly IProfileCompletenessResolver? _completenessResolver;
        private readonly IMarketStudySessionStore? _marketStudies;
        private readonly IBusinessModelSessionStore? _businessModels;
        private readonly IForecastSessionStore? _forecasts;
        private readonly IBusinessPlanSessionStore? _businessPlans;
        private readonly ICapabilityMatcher _capabilityMatcher;

        public ConstructionSnapshotService(
            ICreatorJourneyService journeys,
            ICapabilityMatcher capabilityMatcher,
            IProfessionalProfileStore? professionalStore = null,
            IProfileCompletenessResolver? completenessResolver = null,
            IMarketStudySessionStore? marketStudies = null,
            IBusinessModelSessionStore? businessModels = null,
            IForecastSessionStore? forecasts = null,
            IBusinessPlanSessionStore? businessPlans = null)
        {
            _journeys = journeys;
            _capabilityMatcher = capabilityMatcher;
            _professionalStore = professionalStore;
            _completenessResolver = completenessResolver;
            _marketStudies = marketStudies;
            _businessModels = businessModels;
            _forecasts = forecasts;
            _businessPlans = businessPlans;
        }

        public async Task<ConstructionSnapshotResponse> GetSnapshotAsync(string userId, string? ideaId)
        {
            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var snapshot = journey.Phase4Data?.ConstructionSnapshot;

            if (snapshot == null)
            {
                return new ConstructionSnapshotResponse
                {
                    Snapshot = null!,
                    UpdateAvailable = false,
                    ChangedSources = new List<string>()
                };
            }

            var context = await BuildContextAsync(userId, journey);
            var (isStale, changedSources) = DetectStaleness(snapshot.SourceReferences, context.CurrentSourceVersions);

            return BuildResponse(snapshot, isStale, changedSources);
        }

        public async Task<ConstructionSnapshotResponse> GenerateSnapshotAsync(string userId, string? ideaId)
        {
            await EnforceGateAsync(userId, ideaId);

            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var existing = journey.Phase4Data?.ConstructionSnapshot;

            // Idempotency: if snapshot already exists, do NOT regenerate on generate call
            if (existing != null)
            {
                var context = await BuildContextAsync(userId, journey);
                var (isStale, changedSources) = DetectStaleness(existing.SourceReferences, context.CurrentSourceVersions);
                return BuildResponse(existing, isStale, changedSources);
            }

            return await ExecuteGenerationAsync(userId, ideaId, journey);
        }

        public async Task<ConstructionSnapshotResponse> RefreshSnapshotAsync(string userId, string? ideaId)
        {
            await EnforceGateAsync(userId, ideaId);
            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            return await ExecuteGenerationAsync(userId, ideaId, journey);
        }

        private async Task EnforceGateAsync(string userId, string? ideaId)
        {
            var current = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var phaseStatus = await _journeys.ComputePhaseStatusAsync(current, phase1Complete: true);
            if (phaseStatus.Phase3.Status != "completed")
            {
                throw new InvalidOperationException("Phase 3 must be completed before entering Phase 4.");
            }

            if (_professionalStore != null)
            {
                var profile = await _professionalStore.GetByUserIdAsync(userId);
                var completeness = (_completenessResolver ?? new ProfileCompletenessResolver()).Resolve(profile);
                if (!completeness.Phase4Ready)
                {
                    throw new InvalidOperationException($"Professional profile is incomplete for Phase 4 personalization. Missing: {string.Join(", ", completeness.MissingForPhase4)}");
                }
            }
        }

        private async Task<ConstructionContext> BuildContextAsync(string userId, CreatorJourney journey)
        {
            var p = journey.Project ?? new CreatorJourneyProject();
            var b = p.Branding ?? new CreatorBranding();
            var p3 = journey.Phase3Data ?? new CreatorPhase3Data();

            var marketStudySession = !string.IsNullOrEmpty(p3.MarketStudySessionId) && _marketStudies != null
                ? await _marketStudies.GetOwnedAsync(p3.MarketStudySessionId, userId)
                : null;

            var businessModelSession = !string.IsNullOrEmpty(p3.BusinessModelSessionId) && _businessModels != null
                ? await _businessModels.GetOwnedAsync(p3.BusinessModelSessionId, userId)
                : null;

            var forecastSession = !string.IsNullOrEmpty(p3.ForecastSessionId) && _forecasts != null
                ? await _forecasts.GetOwnedAsync(p3.ForecastSessionId, userId)
                : null;

            var planSession = !string.IsNullOrEmpty(p3.BusinessPlanSessionId) && _businessPlans != null
                ? await _businessPlans.GetOwnedAsync(p3.BusinessPlanSessionId, userId)
                : null;

            var profile = _professionalStore != null ? await _professionalStore.GetByUserIdAsync(userId) : null;
            var vc = profile?.VentureContext;

            var context = new ConstructionContext
            {
                Project = new ProjectData
                {
                    Name = p.Name ?? string.Empty,
                    Concept = p.Concept ?? string.Empty,
                    Tagline = p.Tagline ?? string.Empty,
                    TargetUser = p.TargetUser ?? string.Empty,
                    Problem = p.Problem ?? string.Empty,
                    Solution = p.Solution ?? string.Empty,
                    MarketGap = p.MarketGap ?? string.Empty,
                    CreatorEdge = p.CreatorEdge ?? string.Empty,
                    Sector = p.Sector ?? string.Empty,
                    Category = p.Category ?? string.Empty,
                    Version = p.CurrentVersion,
                    UpdatedAt = journey.UpdatedAt
                },
                Brand = new BrandData
                {
                    BrandingMethod = b.BrandingMethod ?? string.Empty,
                    LogoType = b.LogoType ?? string.Empty,
                    LogoAsset = b.LogoAsset ?? string.Empty,
                    PaletteName = b.PaletteName ?? string.Empty,
                    TypographyPairing = b.TypographyPairing ?? string.Empty
                },
                Market = new MarketData
                {
                    SessionId = p3.MarketStudySessionId ?? string.Empty,
                    Version = marketStudySession?.CurrentVersion ?? 0,
                    Status = marketStudySession?.Status ?? string.Empty,
                    UpdatedAt = marketStudySession?.UpdatedAt,
                    HasMarketStudy = marketStudySession != null && marketStudySession.CurrentVersion > 0,
                    TargetCustomer = p.TargetUser ?? string.Empty,
                    ProblemNeed = p.Problem ?? string.Empty
                },
                BusinessModel = new BusinessModelData
                {
                    SessionId = p3.BusinessModelSessionId ?? string.Empty,
                    Version = businessModelSession?.CurrentVersion ?? 0,
                    Status = businessModelSession?.Status ?? string.Empty,
                    UpdatedAt = businessModelSession?.UpdatedAt,
                    HasBusinessModel = businessModelSession != null && businessModelSession.CurrentVersion > 0,
                    ValueProposition = p.Solution ?? string.Empty
                },
                Forecast = new ForecastData
                {
                    SessionId = p3.ForecastSessionId ?? string.Empty,
                    Version = forecastSession?.CurrentVersion ?? 0,
                    Status = forecastSession?.Status ?? string.Empty,
                    UpdatedAt = forecastSession?.UpdatedAt,
                    HasForecast = forecastSession != null && forecastSession.CurrentVersion > 0
                },
                Legal = new LegalData
                {
                    HasLegalAssessment = p3.LegalAssessment != null,
                    UpdatedAt = p3.LegalAssessment?.EvaluatedAt,
                    ChecklistCompletedCount = p3.LegalChecklist?.CompletedCount ?? 0,
                    ChecklistTotalCount = p3.LegalChecklist?.TotalCount ?? 0,
                    HighPriorityPendingCount = p3.LegalChecklist?.Items?
                        .Count(i => i.Priority == "critical" && i.Status != "completed") ?? 0
                },
                Formation = new FormationData
                {
                    Version = p3.FormationGenerator != null ? 1 : 0,
                    UpdatedAt = journey.UpdatedAt,
                    RecommendedType = p3.FormationGenerator?.RecommendedType ?? string.Empty,
                    SelectedType = p3.FormationGenerator?.SelectedType ?? string.Empty,
                    YouHave = p3.FormationGenerator?.YouHave ?? new List<string>(),
                    YouNeed = p3.FormationGenerator?.YouNeed ?? new List<CreatorSkillGap>(),
                    CofounderNeeded = p3.FormationGenerator?.CofounderDraft != null
                },
                BusinessPlan = new BusinessPlanData
                {
                    SessionId = p3.BusinessPlanSessionId ?? string.Empty,
                    Version = planSession?.CurrentVersion ?? 0,
                    Status = planSession?.Status ?? string.Empty,
                    UpdatedAt = planSession?.UpdatedAt,
                    HasPlan = planSession != null && planSession.CurrentVersion > 0,
                    ExecutiveSummaryPresent = planSession != null && planSession.CurrentVersion > 0
                },
                InvestorReadiness = new InvestorReadinessData
                {
                    Score = p3.InvestorReadinessScore?.Total ?? 0,
                    Stage = p3.InvestorReadinessScore?.Label ?? string.Empty
                },
                FounderProfile = new FounderProfileData
                {
                    Skills = profile?.Skills ?? new List<ProfileSkill>(),
                    Experiences = profile?.Experiences ?? new List<ProfessionalExperience>(),
                    Education = profile?.Education ?? new List<ProfessionalEducation>(),
                    Languages = profile?.LanguageProficiencies ?? new List<ProfessionalLanguage>(),
                    CurrentSituation = vc?.CurrentSituation ?? string.Empty,
                    WeeklyAvailability = vc?.WeeklyAvailability ?? string.Empty,
                    Region = vc?.Region ?? string.Empty,
                    PreviousEntrepreneurialExperience = vc?.PreviousEntrepreneurialExperience ?? string.Empty,
                    LearningPreference = vc?.LearningPreference ?? string.Empty,
                    DelegationPreference = vc?.DelegationPreference ?? string.Empty,
                    UpdatedAt = profile?.UpdatedAt
                },
                CurrentSourceVersions = new Phase4SourceVersions
                {
                    ProjectVersion = p.CurrentVersion,
                    ProjectUpdatedAt = journey.UpdatedAt,
                    MarketStudySessionId = p3.MarketStudySessionId,
                    MarketStudyVersion = marketStudySession?.CurrentVersion ?? 0,
                    MarketStudyUpdatedAt = marketStudySession?.UpdatedAt,
                    BusinessModelSessionId = p3.BusinessModelSessionId,
                    BusinessModelVersion = businessModelSession?.CurrentVersion ?? 0,
                    BusinessModelUpdatedAt = businessModelSession?.UpdatedAt,
                    ForecastSessionId = p3.ForecastSessionId,
                    ForecastVersion = forecastSession?.CurrentVersion ?? 0,
                    ForecastUpdatedAt = forecastSession?.UpdatedAt,
                    BusinessPlanSessionId = p3.BusinessPlanSessionId,
                    BusinessPlanVersion = planSession?.CurrentVersion ?? 0,
                    BusinessPlanUpdatedAt = planSession?.UpdatedAt,
                    LegalChecklistCompletedCount = p3.LegalChecklist?.CompletedCount ?? 0,
                    LegalAssessmentUpdatedAt = p3.LegalAssessment?.EvaluatedAt,
                    FormationVersion = p3.FormationGenerator != null ? 1 : 0,
                    FormationUpdatedAt = journey.UpdatedAt,
                    ProfessionalProfileUpdatedAt = profile?.UpdatedAt
                }
            };

            return context;
        }

        private async Task<ConstructionSnapshotResponse> ExecuteGenerationAsync(string userId, string? ideaId, CreatorJourney journey)
        {
            var context = await BuildContextAsync(userId, journey);
            var items = RunDeterministicRules(context, journey);

            var readyItems = items.Where(i => i.Status == ConstructionItemStatus.Ready).ToList();
            // Correction 2: NeedsReview must NOT disappear. Included in PartialItems collection and partialCount!
            var partialItems = items.Where(i => i.Status == ConstructionItemStatus.Partial || i.Status == ConstructionItemStatus.NeedsReview).ToList();
            var missingItems = items.Where(i => i.Status == ConstructionItemStatus.Missing).ToList();
            var criticalItems = items.Where(i => i.Status == ConstructionItemStatus.Critical).ToList();
            var optionalItems = items.Where(i => i.Status == ConstructionItemStatus.Optional).ToList();

            var summary = SynthesizeSummary(readyItems.Count, partialItems.Count, missingItems.Count, criticalItems.Count, criticalItems);

            var snapshot = new ConstructionSnapshot
            {
                Status = criticalItems.Count > 0 ? "NeedsAttention" : "Completed",
                GeneratedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                OverallSummary = summary,
                ReadyItems = readyItems,
                PartialItems = partialItems,
                MissingItems = missingItems,
                CriticalItems = criticalItems,
                OptionalItems = optionalItems,
                Categories = new List<string>
                {
                    ConstructionCategories.BusinessFoundation,
                    ConstructionCategories.Brand,
                    ConstructionCategories.Market,
                    ConstructionCategories.BusinessModel,
                    ConstructionCategories.Finance,
                    ConstructionCategories.LegalAndAdministration,
                    ConstructionCategories.Team,
                    ConstructionCategories.Skills,
                    ConstructionCategories.Services,
                    ConstructionCategories.Technology,
                    ConstructionCategories.Funding,
                    ConstructionCategories.Pricing,
                    ConstructionCategories.GoToMarket,
                    ConstructionCategories.LaunchAssets,
                    ConstructionCategories.Operations
                },
                SourceReferences = context.CurrentSourceVersions,
                ProfileVersion = context.FounderProfile.UpdatedAt?.ToString("o") ?? "1",
                FounderEdited = false
            };

            // Atomically persist snapshot and source references without touching Phase 3 or HumainX
            await _journeys.SetPhase4ConstructionSnapshotAsync(userId, snapshot, context.CurrentSourceVersions, ideaId);

            return BuildResponse(snapshot, updateAvailable: false, new List<string>());
        }

        private List<ConstructionSnapshotItem> RunDeterministicRules(ConstructionContext context, CreatorJourney journey)
        {
            var items = new List<ConstructionSnapshotItem>();

            // 1. Business Foundation
            bool hasConcept = !string.IsNullOrWhiteSpace(context.Project.Concept) && !string.IsNullOrWhiteSpace(context.Project.Name);
            bool hasBm = context.BusinessModel.HasBusinessModel;
            bool hasBp = context.BusinessPlan.HasPlan;

            if (hasConcept && hasBm && hasBp)
            {
                items.Add(new ConstructionSnapshotItem
                {
                    Key = "business_foundation",
                    Category = ConstructionCategories.BusinessFoundation,
                    Title = "Core Business Foundation",
                    Status = ConstructionItemStatus.Ready,
                    Priority = ConstructionItemPriority.High,
                    Reason = "Your project concept, business model, and executive business plan are fully articulated.",
                    Source = new List<string> { "Project", "Business Model", "Business Plan" },
                    SourceReference = new List<string> { context.BusinessModel.SessionId, context.BusinessPlan.SessionId },
                    RecommendedNextStep = "Maintain alignment between operational goals and executive plan.",
                    Blocking = false
                });
            }
            else
            {
                items.Add(new ConstructionSnapshotItem
                {
                    Key = "business_foundation",
                    Category = ConstructionCategories.BusinessFoundation,
                    Title = "Core Business Foundation",
                    Status = ConstructionItemStatus.Partial,
                    Priority = ConstructionItemPriority.High,
                    Reason = "Foundational business elements are partially articulated but require further strategic grounding.",
                    Source = new List<string> { "Project", "Business Plan" },
                    RecommendedNextStep = "Review core concept and executive summaries.",
                    Blocking = false
                });
            }

            // 2. Brand
            bool hasName = !string.IsNullOrWhiteSpace(context.Project.Name);
            bool hasLogo = !string.IsNullOrWhiteSpace(context.Brand.LogoAsset);
            bool brandSkipped = context.Brand.BrandingMethod == "m50_designer" || context.Brand.BrandingMethod == "pending";

            if (hasName && hasLogo)
            {
                items.Add(new ConstructionSnapshotItem
                {
                    Key = "brand_identity",
                    Category = ConstructionCategories.Brand,
                    Title = "Brand Identity & Visual Assets",
                    Status = ConstructionItemStatus.Ready,
                    Priority = ConstructionItemPriority.Medium,
                    Reason = "Project name, logo asset, and color palette are prepared.",
                    Source = new List<string> { "Phase 2 Brand" },
                    RecommendedNextStep = "Utilize visual assets consistently in launch collateral.",
                    Blocking = false
                });
            }
            else if (hasName)
            {
                items.Add(new ConstructionSnapshotItem
                {
                    Key = "brand_identity",
                    Category = ConstructionCategories.Brand,
                    Title = "Brand Identity & Visual Assets",
                    Status = ConstructionItemStatus.Optional,
                    Priority = ConstructionItemPriority.Optional,
                    Reason = "Project name is defined. Advanced branding assets or custom logos remain optional.",
                    Source = new List<string> { "Phase 2 Brand" },
                    RecommendedNextStep = "Generate an AI logo or continue with standard typography.",
                    Blocking = false
                });
            }

            // 3. Market
            if (context.Market.HasMarketStudy)
            {
                items.Add(new ConstructionSnapshotItem
                {
                    Key = "market_study",
                    Category = ConstructionCategories.Market,
                    Title = "Market Intelligence & Competitor Study",
                    Status = ConstructionItemStatus.Ready,
                    Priority = ConstructionItemPriority.High,
                    Reason = "Market study, target customer segmentation, and competitor landscape are documented.",
                    Source = new List<string> { "Market Study" },
                    SourceReference = new List<string> { context.Market.SessionId },
                    RecommendedNextStep = "Incorporate market findings into GTM channel selection.",
                    Blocking = false
                });
            }
            else
            {
                items.Add(new ConstructionSnapshotItem
                {
                    Key = "market_study",
                    Category = ConstructionCategories.Market,
                    Title = "Market Intelligence & Competitor Study",
                    Status = ConstructionItemStatus.NeedsReview,
                    Priority = ConstructionItemPriority.High,
                    Reason = "Market validation data needs review or regeneration.",
                    Source = new List<string> { "Market Study" },
                    RecommendedNextStep = "Inspect Phase 3 Market Study outputs.",
                    Blocking = false
                });
            }

            // 4. Business Model
            if (context.BusinessModel.HasBusinessModel)
            {
                items.Add(new ConstructionSnapshotItem
                {
                    Key = "business_model_canvas",
                    Category = ConstructionCategories.BusinessModel,
                    Title = "Business Model Canvas Structure",
                    Status = ConstructionItemStatus.Ready,
                    Priority = ConstructionItemPriority.High,
                    Reason = "Value proposition, revenue mechanics, channels, and cost structure are validated.",
                    Source = new List<string> { "Business Model" },
                    SourceReference = new List<string> { context.BusinessModel.SessionId },
                    RecommendedNextStep = "Align Phase 4 pricing tiers with identified value propositions.",
                    Blocking = false
                });
            }
            else
            {
                items.Add(new ConstructionSnapshotItem
                {
                    Key = "business_model_canvas",
                    Category = ConstructionCategories.BusinessModel,
                    Title = "Business Model Canvas Structure",
                    Status = ConstructionItemStatus.NeedsReview,
                    Priority = ConstructionItemPriority.High,
                    Reason = "Business model canvas needs review.",
                    Source = new List<string> { "Business Model" },
                    RecommendedNextStep = "Review Phase 3 Business Model outputs.",
                    Blocking = false
                });
            }

            // 5. Finance
            if (context.Forecast.HasForecast)
            {
                items.Add(new ConstructionSnapshotItem
                {
                    Key = "financial_forecast",
                    Category = ConstructionCategories.Finance,
                    Title = "3-Year Financial Forecast",
                    Status = ConstructionItemStatus.Ready,
                    Priority = ConstructionItemPriority.High,
                    Reason = "Three-year projections, cost assumptions, and revenue targets are computed.",
                    Source = new List<string> { "Financial Forecast" },
                    SourceReference = new List<string> { context.Forecast.SessionId },
                    RecommendedNextStep = "Compare commercial pricing tiers against forecast ARPU in Phase 4.6.",
                    Blocking = false
                });
            }
            else
            {
                items.Add(new ConstructionSnapshotItem
                {
                    Key = "financial_forecast",
                    Category = ConstructionCategories.Finance,
                    Title = "Financial Projections",
                    Status = ConstructionItemStatus.NeedsReview,
                    Priority = ConstructionItemPriority.High,
                    Reason = "Financial forecast outputs need review.",
                    Source = new List<string> { "Financial Forecast" },
                    RecommendedNextStep = "Verify financial projections in Phase 3.",
                    Blocking = false
                });
            }

            // 6. Legal & Administration
            if (context.Legal.HighPriorityPendingCount > 0)
            {
                items.Add(new ConstructionSnapshotItem
                {
                    Key = "legal_compliance",
                    Category = ConstructionCategories.LegalAndAdministration,
                    Title = "Regulatory & Legal Obligations",
                    Status = ConstructionItemStatus.Partial,
                    Priority = ConstructionItemPriority.High,
                    Reason = $"{context.Legal.HighPriorityPendingCount} high-priority compliance or licensing obligations require fulfillment prior to operational launch.",
                    Source = new List<string> { "Legal Assessment" },
                    RecommendedNextStep = "Review pending compliance requirements in Legal & Compliance.",
                    Blocking = false
                });
            }
            else
            {
                items.Add(new ConstructionSnapshotItem
                {
                    Key = "legal_compliance",
                    Category = ConstructionCategories.LegalAndAdministration,
                    Title = "Regulatory & Legal Obligations",
                    Status = ConstructionItemStatus.Ready,
                    Priority = ConstructionItemPriority.High,
                    Reason = "Core corporate structure, statutory rules, and initial compliance items are addressed.",
                    Source = new List<string> { "Legal Assessment" },
                    RecommendedNextStep = "Proceed with standard administrative registration schedule.",
                    Blocking = false
                });
            }

            // 7. Team
            if (context.Formation.CofounderNeeded)
            {
                items.Add(new ConstructionSnapshotItem
                {
                    Key = "team_structure",
                    Category = ConstructionCategories.Team,
                    Title = "Co-Founder & Key Team Structure",
                    Status = ConstructionItemStatus.Partial,
                    Priority = ConstructionItemPriority.Medium,
                    Reason = "A co-founder or strategic partner profile was identified as desirable during formation planning.",
                    Source = new List<string> { "Formation & Team" },
                    RecommendedNextStep = "Review co-founder criteria in Needs & Requirements (Phase 4.3).",
                    Blocking = false
                });
            }
            else if (!string.IsNullOrWhiteSpace(context.Formation.RecommendedType))
            {
                items.Add(new ConstructionSnapshotItem
                {
                    Key = "team_structure",
                    Category = ConstructionCategories.Team,
                    Title = "Team Structure & Legal Entity",
                    Status = ConstructionItemStatus.Ready,
                    Priority = ConstructionItemPriority.Medium,
                    Reason = $"Recommended legal vehicle ({context.Formation.RecommendedType}) and solo founder configuration are established.",
                    Source = new List<string> { "Formation & Team" },
                    RecommendedNextStep = "Prepare incorporation schedule.",
                    Blocking = false
                });
            }

            // 8. Technology & Technical Execution Capability (Corrections 5 & 10: Strict Critical Check)
            bool isSoftwareVenture = IsSoftwareOrTechVenture(context.Project);
            var techMatch = _capabilityMatcher.MatchCapability("Software Development", context.FounderProfile.Skills);
            bool hasTeamTech = context.Formation.YouHave.Any(s => _capabilityMatcher.BelongsToTaxonomy(s, "Web / Software Development"));

            if (isSoftwareVenture)
            {
                if (techMatch.Status == ConstructionItemStatus.Ready)
                {
                    items.Add(new ConstructionSnapshotItem
                    {
                        Key = "technical_execution",
                        Category = ConstructionCategories.Technology,
                        Title = "Technical Execution Capability",
                        Status = ConstructionItemStatus.Ready,
                        Priority = ConstructionItemPriority.High,
                        Reason = $"Technical development capability confirmed through declared founder expertise ({techMatch.MatchedSkill?.Name}).",
                        Source = new List<string> { "Professional Profile", "Business Model" },
                        RecommendedNextStep = "Structure technical architecture and development sprints.",
                        Blocking = false
                    });
                }
                else if (techMatch.Status == ConstructionItemStatus.Partial)
                {
                    items.Add(new ConstructionSnapshotItem
                    {
                        Key = "technical_execution",
                        Category = ConstructionCategories.Technology,
                        Title = "Technical Execution Capability",
                        Status = ConstructionItemStatus.Partial,
                        Priority = ConstructionItemPriority.High,
                        Reason = $"Foundational technical capability declared ({techMatch.MatchedSkill?.Name} - Beginner); senior architecture support or paired development recommended.",
                        Source = new List<string> { "Professional Profile", "Business Model" },
                        RecommendedNextStep = "Define paired programming or technical advisory support.",
                        Blocking = false
                    });
                }
                else if (techMatch.Status == ConstructionItemStatus.NeedsReview)
                {
                    items.Add(new ConstructionSnapshotItem
                    {
                        Key = "technical_execution",
                        Category = ConstructionCategories.Technology,
                        Title = "Technical Execution Capability",
                        Status = ConstructionItemStatus.NeedsReview,
                        Priority = ConstructionItemPriority.High,
                        Reason = techMatch.Reason,
                        Source = new List<string> { "Professional Profile" },
                        RecommendedNextStep = "Confirm proficiency level in your HumainX profile.",
                        Blocking = false
                    });
                }
                else if (hasTeamTech)
                {
                    items.Add(new ConstructionSnapshotItem
                    {
                        Key = "technical_execution",
                        Category = ConstructionCategories.Technology,
                        Title = "Technical Execution Capability",
                        Status = ConstructionItemStatus.Ready,
                        Priority = ConstructionItemPriority.High,
                        Reason = "Technical execution capability is satisfied by designated team members identified during formation planning.",
                        Source = new List<string> { "Formation & Team" },
                        RecommendedNextStep = "Confirm technical milestone deliverables.",
                        Blocking = false
                    });
                }
                else
                {
                    // Strict Critical: Venture is software product, no founder skill, no team tech, blocks MVP build!
                    items.Add(new ConstructionSnapshotItem
                    {
                        Key = "technical_execution",
                        Category = ConstructionCategories.Technology,
                        Title = "Technical Execution Capability",
                        Status = ConstructionItemStatus.Critical,
                        Priority = ConstructionItemPriority.Critical,
                        Reason = "The venture requires a software product or platform, but no technical execution capability is currently declared by the founder or team.",
                        Source = new List<string> { "Business Model", "Professional Profile" },
                        RecommendedNextStep = "Secure a technical co-founder, agency partner, or modular development service before build.",
                        Blocking = true
                    });
                }
            }
            else
            {
                items.Add(new ConstructionSnapshotItem
                {
                    Key = "technical_execution",
                    Category = ConstructionCategories.Technology,
                    Title = "Technical Execution Capability",
                    Status = ConstructionItemStatus.Optional,
                    Priority = ConstructionItemPriority.Optional,
                    Reason = "Custom software engineering is not a mandatory barrier for this business model.",
                    Source = new List<string> { "Business Model" },
                    RecommendedNextStep = "Utilize standard off-the-shelf tooling as needed.",
                    Blocking = false
                });
            }

            // 9. Skills & Human Capabilities (HumainX)
            if (context.Formation.YouNeed.Count > 0)
            {
                foreach (var need in context.Formation.YouNeed.Take(3))
                {
                    var match = _capabilityMatcher.MatchCapability(need.Label, context.FounderProfile.Skills);
                    items.Add(new ConstructionSnapshotItem
                    {
                        Key = $"skill_{_capabilityMatcher.NormalizeCapability(need.Label)}",
                        Category = ConstructionCategories.Skills,
                        Title = $"Capability: {need.Label}",
                        Status = match.Status,
                        Priority = match.Status == ConstructionItemStatus.Missing ? ConstructionItemPriority.High : ConstructionItemPriority.Medium,
                        Reason = match.Reason,
                        Source = new List<string> { "Formation & Team", "Professional Profile" },
                        RecommendedNextStep = match.Status == ConstructionItemStatus.Missing
                            ? "Review capability acquisition in Skills & Training (Phase 4.4)."
                            : "Deploy declared capability.",
                        Blocking = false
                    });
                }
            }
            else if (context.FounderProfile.Skills.Count > 0)
            {
                items.Add(new ConstructionSnapshotItem
                {
                    Key = "founder_skills",
                    Category = ConstructionCategories.Skills,
                    Title = "Founder Core Skills",
                    Status = ConstructionItemStatus.Ready,
                    Priority = ConstructionItemPriority.Medium,
                    Reason = $"{context.FounderProfile.Skills.Count} professional skills declared in HumainX profile.",
                    Source = new List<string> { "Professional Profile" },
                    RecommendedNextStep = "Align skills with execution roadmap.",
                    Blocking = false
                });
            }

            // 10. Services Assessment (Corrections 1 & 12)
            var financeMatch = _capabilityMatcher.MatchCapability("Finance & Accounting", context.FounderProfile.Skills);
            if (financeMatch.Status == ConstructionItemStatus.Ready)
            {
                items.Add(new ConstructionSnapshotItem
                {
                    Key = "accounting_service",
                    Category = ConstructionCategories.Services,
                    Title = "Accounting & Financial Support",
                    Status = ConstructionItemStatus.Ready,
                    Priority = ConstructionItemPriority.Medium,
                    Reason = "Founder possesses financial management capabilities for initial operational administration.",
                    Source = new List<string> { "Professional Profile" },
                    RecommendedNextStep = "Review tax and chartered accounting thresholds.",
                    Blocking = false
                });
            }
            else
            {
                items.Add(new ConstructionSnapshotItem
                {
                    Key = "accounting_service",
                    Category = ConstructionCategories.Services,
                    Title = "Accounting & Financial Support",
                    Status = ConstructionItemStatus.Missing,
                    Priority = ConstructionItemPriority.Medium,
                    Reason = "Your financial plan is structured, but no accounting support resource or chartered service is currently identified.",
                    Source = new List<string> { "Financial Forecast" },
                    RecommendedNextStep = "Review this requirement in Needs & Requirements (Phase 4.3).",
                    Blocking = false
                });
            }

            var legalMatch = _capabilityMatcher.MatchCapability("Legal & Compliance", context.FounderProfile.Skills);
            if (legalMatch.Status == ConstructionItemStatus.Ready)
            {
                items.Add(new ConstructionSnapshotItem
                {
                    Key = "legal_service",
                    Category = ConstructionCategories.Services,
                    Title = "Legal & Statutory Filing Service",
                    Status = ConstructionItemStatus.Ready,
                    Priority = ConstructionItemPriority.Low,
                    Reason = "Founder has legal literacy for initial operational agreements.",
                    Source = new List<string> { "Professional Profile" },
                    RecommendedNextStep = "Prepare statutory filings.",
                    Blocking = false
                });
            }
            else
            {
                items.Add(new ConstructionSnapshotItem
                {
                    Key = "legal_service",
                    Category = ConstructionCategories.Services,
                    Title = "Legal & Statutory Filing Service",
                    Status = ConstructionItemStatus.Missing,
                    Priority = ConstructionItemPriority.Medium,
                    Reason = "Company registration and legal compliance require chartered professional validation or service provider assistance.",
                    Source = new List<string> { "Legal Assessment" },
                    RecommendedNextStep = "Prepare legal documentation requirements for Phase 4.3.",
                    Blocking = false
                });
            }

            // 11. Funding
            if (context.Forecast.FundingNeed.HasValue && context.Forecast.FundingNeed > 0)
            {
                items.Add(new ConstructionSnapshotItem
                {
                    Key = "funding_preparation",
                    Category = ConstructionCategories.Funding,
                    Title = "Funding & Capital Requirements",
                    Status = ConstructionItemStatus.Partial,
                    Priority = ConstructionItemPriority.High,
                    Reason = $"External funding requirement of €{context.Forecast.FundingNeed:N0} identified; investor readiness preparation is active ({context.InvestorReadiness.Score:F0}/100).",
                    Source = new List<string> { "Financial Forecast", "Investor Readiness" },
                    RecommendedNextStep = "Review grant and aid matches in Phase 4.5.",
                    Blocking = false
                });
            }
            else
            {
                items.Add(new ConstructionSnapshotItem
                {
                    Key = "funding_preparation",
                    Category = ConstructionCategories.Funding,
                    Title = "Funding & Capital Requirements",
                    Status = ConstructionItemStatus.Ready,
                    Priority = ConstructionItemPriority.Medium,
                    Reason = "Project is modeled as self-sustaining / bootstrapped from early revenues.",
                    Source = new List<string> { "Financial Forecast" },
                    RecommendedNextStep = "Monitor cash flow milestones in roadmap.",
                    Blocking = false
                });
            }

            // 12. Pricing
            var p4 = journey.Phase4Data;
            bool hasCustomPricing = !string.IsNullOrEmpty(p4?.PricingModel) && (p4?.Tiers?.Count ?? 0) >= 3;

            if (hasCustomPricing)
            {
                items.Add(new ConstructionSnapshotItem
                {
                    Key = "pricing_strategy",
                    Category = ConstructionCategories.Pricing,
                    Title = "Commercial Pricing Packages",
                    Status = ConstructionItemStatus.Ready,
                    Priority = ConstructionItemPriority.Medium,
                    Reason = $"Commercial pricing structure established ({p4!.PricingModel}) with {p4.Tiers.Count} package tiers.",
                    Source = new List<string> { "Pricing Model" },
                    RecommendedNextStep = "Review pricing packaging periodically.",
                    Blocking = false
                });
            }
            else
            {
                items.Add(new ConstructionSnapshotItem
                {
                    Key = "pricing_strategy",
                    Category = ConstructionCategories.Pricing,
                    Title = "Commercial Pricing Packages",
                    Status = ConstructionItemStatus.Partial,
                    Priority = ConstructionItemPriority.Medium,
                    Reason = "Financial forecast revenue model exists, but commercial pricing tiers and package features require structured setup.",
                    Source = new List<string> { "Financial Forecast", "Business Model" },
                    RecommendedNextStep = "Configure commercial packages in Phase 4.6 Pricing.",
                    Blocking = false
                });
            }

            // 13. Go-to-Market
            items.Add(new ConstructionSnapshotItem
            {
                Key = "gtm_strategy",
                Category = ConstructionCategories.GoToMarket,
                Title = "Go-to-Market & Acquisition Strategy",
                Status = ConstructionItemStatus.Partial,
                Priority = ConstructionItemPriority.High,
                Reason = "Target customer segments and initial channels are identified in your business model, awaiting detailed launch campaign planning.",
                Source = new List<string> { "Business Model" },
                RecommendedNextStep = "Build launch acquisition timeline in Phase 4.7 GTM.",
                Blocking = false
            });

            // 14. Launch Assets
            if (hasLogo)
            {
                items.Add(new ConstructionSnapshotItem
                {
                    Key = "launch_assets",
                    Category = ConstructionCategories.LaunchAssets,
                    Title = "Showcase Website & Launch Assets",
                    Status = ConstructionItemStatus.Partial,
                    Priority = ConstructionItemPriority.Medium,
                    Reason = "Brand identity is established; showcase website and marketing collateral remain to be generated.",
                    Source = new List<string> { "Phase 2 Brand" },
                    RecommendedNextStep = "Configure launch website in Phase 4.8 Launch Assets.",
                    Blocking = false
                });
            }
            else
            {
                items.Add(new ConstructionSnapshotItem
                {
                    Key = "launch_assets",
                    Category = ConstructionCategories.LaunchAssets,
                    Title = "Showcase Website & Launch Assets",
                    Status = ConstructionItemStatus.Missing,
                    Priority = ConstructionItemPriority.Low,
                    Reason = "Digital showcase assets, landing page, and visual branding assets are not yet created.",
                    Source = new List<string> { "Phase 2 Brand" },
                    RecommendedNextStep = "Build launch website in Phase 4.8.",
                    Blocking = false
                });
            }

            // 15. Operations
            items.Add(new ConstructionSnapshotItem
            {
                Key = "operations_delivery",
                Category = ConstructionCategories.Operations,
                Title = "Operational Delivery Workflow",
                Status = ConstructionItemStatus.Ready,
                Priority = ConstructionItemPriority.Medium,
                Reason = "Core activities and delivery processes are grounded in your business model canvas.",
                Source = new List<string> { "Business Model" },
                RecommendedNextStep = "Monitor operational dependencies as milestones are scheduled.",
                Blocking = false
            });

            return items;
        }

        private static bool IsSoftwareOrTechVenture(ProjectData project)
        {
            var sector = project.Sector ?? string.Empty;
            var category = project.Category ?? string.Empty;
            var concept = (project.Concept + " " + project.Solution + " " + project.Name).ToLowerInvariant();

            if (sector.Equals("Technology", StringComparison.OrdinalIgnoreCase) ||
                sector.Equals("Software", StringComparison.OrdinalIgnoreCase) ||
                sector.Equals("FinTech", StringComparison.OrdinalIgnoreCase) ||
                sector.Equals("EdTech", StringComparison.OrdinalIgnoreCase) ||
                sector.Equals("HealthTech", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            if (category.Equals("SaaS", StringComparison.OrdinalIgnoreCase) ||
                category.Equals("Platform", StringComparison.OrdinalIgnoreCase) ||
                category.Equals("App", StringComparison.OrdinalIgnoreCase) ||
                category.Equals("Mobile App", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            string[] techKeywords = { "saas", "software", "web app", "mobile app", "platform", "algorithm", "api" };
            return techKeywords.Any(k => concept.Contains(k));
        }

        private static (bool IsStale, List<string> ChangedSources) DetectStaleness(Phase4SourceVersions stored, Phase4SourceVersions current)
        {
            if (stored == null || current == null) return (false, new List<string>());

            var changed = new List<string>();

            if (stored.MarketStudyVersion != current.MarketStudyVersion || stored.MarketStudySessionId != current.MarketStudySessionId)
                changed.Add("Market Study");

            if (stored.BusinessModelVersion != current.BusinessModelVersion || stored.BusinessModelSessionId != current.BusinessModelSessionId)
                changed.Add("Business Model");

            if (stored.ForecastVersion != current.ForecastVersion || stored.ForecastSessionId != current.ForecastSessionId)
                changed.Add("Financial Forecast");

            if (stored.BusinessPlanVersion != current.BusinessPlanVersion || stored.BusinessPlanSessionId != current.BusinessPlanSessionId)
                changed.Add("Business Plan");

            if (stored.LegalChecklistCompletedCount != current.LegalChecklistCompletedCount)
                changed.Add("Legal Assessment");

            if (stored.ProfessionalProfileUpdatedAt != current.ProfessionalProfileUpdatedAt)
                changed.Add("Professional Profile");

            if (stored.ProjectVersion != current.ProjectVersion)
                changed.Add("Project Foundation");

            return (changed.Count > 0, changed);
        }

        private static string SynthesizeSummary(int readyCount, int partialCount, int missingCount, int criticalCount, List<ConstructionSnapshotItem> criticalItems)
        {
            if (criticalCount > 0)
            {
                var criticalTitles = string.Join(", ", criticalItems.Select(c => c.Title));
                return $"Your business foundation is largely established, but {criticalCount} critical item ({criticalTitles}) requires immediate resolution before building.";
            }

            if (missingCount > 0 || partialCount > 0)
            {
                return "Your business foundation is strong. Most strategic planning is complete, while technical execution, pricing refinement and launch preparation need attention next.";
            }

            return "Your project intelligence and capabilities are thoroughly aligned. All foundational construction items are ready.";
        }

        private static ConstructionSnapshotResponse BuildResponse(ConstructionSnapshot snapshot, bool updateAvailable, List<string> changedSources)
        {
            return new ConstructionSnapshotResponse
            {
                Snapshot = snapshot,
                UpdateAvailable = updateAvailable,
                ChangedSources = changedSources,
                ReadyCount = snapshot.ReadyItems?.Count ?? 0,
                // Correction 2: PartialCount includes both Partial and NeedsReview items
                PartialCount = snapshot.PartialItems?.Count ?? 0,
                MissingCount = snapshot.MissingItems?.Count ?? 0,
                CriticalCount = snapshot.CriticalItems?.Count ?? 0,
                OptionalCount = snapshot.OptionalItems?.Count ?? 0
            };
        }
    }
}
