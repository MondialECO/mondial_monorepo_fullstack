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
    public class PricingStrategyService : IPricingStrategyService
    {
        private readonly ICreatorJourneyService _journeys;
        private readonly IConstructionSnapshotService _snapshotService;
        private readonly IOperationalRoadmapService _roadmapService;
        private readonly INeedsAnalysisService _needsService;
        private readonly ISkillsResolutionService _skillsService;
        private readonly ISupportPlanService _supportService;
        private readonly IPricingPolicyEngine _policyEngine;
        private readonly IMarketStudySessionStore? _marketStudies;
        private readonly IBusinessModelSessionStore? _businessModels;
        private readonly IForecastSessionStore? _forecasts;
        private readonly IBusinessPlanSessionStore? _businessPlans;
        private readonly IProfessionalProfileStore? _professionalStore;
        private readonly IProfileCompletenessResolver? _completenessResolver;
        private readonly ILogger<PricingStrategyService> _logger;

        public PricingStrategyService(
            ICreatorJourneyService journeys,
            IConstructionSnapshotService snapshotService,
            IOperationalRoadmapService roadmapService,
            INeedsAnalysisService needsService,
            ISkillsResolutionService skillsService,
            ISupportPlanService supportService,
            IPricingPolicyEngine policyEngine,
            ILogger<PricingStrategyService> logger,
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
            _policyEngine = policyEngine;
            _logger = logger;
            _marketStudies = marketStudies;
            _businessModels = businessModels;
            _forecasts = forecasts;
            _businessPlans = businessPlans;
            _professionalStore = professionalStore;
            _completenessResolver = completenessResolver;
        }

        public async Task<PricingStrategyResponse> GetPricingStrategyAsync(string userId, string? ideaId = null)
        {
            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var existing = journey.Phase4Data?.PricingStrategy;

            var gateResult = await CheckGateAsync(userId, ideaId);

            if (existing == null)
            {
                return new PricingStrategyResponse
                {
                    Strategy = null,
                    UpdateAvailable = false,
                    ChangedSources = new List<string>(),
                    PrerequisiteGate = gateResult
                };
            }

            var context = await BuildContextAsync(userId, journey, ideaId);
            var (isStale, changed) = DetectStaleness(existing.SourceVersions, context.CurrentSourceVersions);

            return new PricingStrategyResponse
            {
                Strategy = existing,
                UpdateAvailable = isStale,
                ChangedSources = changed,
                PrerequisiteGate = gateResult
            };
        }

        public async Task<PricingStrategyResponse> GeneratePricingStrategyAsync(string userId, string? ideaId = null)
        {
            var gateResult = await CheckGateAsync(userId, ideaId);
            if (!gateResult.CanAccess)
            {
                throw new InvalidOperationException($"PREREQUISITE_GATE_FAILED: {string.Join(" ", gateResult.BlockingReasons)}");
            }

            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var existing = journey.Phase4Data?.PricingStrategy;
            if (existing != null)
            {
                return new PricingStrategyResponse
                {
                    Strategy = existing,
                    UpdateAvailable = false,
                    ChangedSources = new List<string>(),
                    PrerequisiteGate = gateResult
                };
            }

            var context = await BuildContextAsync(userId, journey, ideaId);

            var strategy = ExecuteDerivation(context, existing: null);

            // Persist strictly on CreatorJourney
            await _journeys.SetPhase4PricingStrategyAsync(userId, strategy, ideaId);

            return new PricingStrategyResponse
            {
                Strategy = strategy,
                UpdateAvailable = false,
                ChangedSources = new List<string>(),
                PrerequisiteGate = gateResult
            };
        }

        public async Task<PricingStrategyResponse> RefreshPricingStrategyAsync(string userId, string? ideaId = null)
        {
            var gateResult = await CheckGateAsync(userId, ideaId);
            if (!gateResult.CanAccess)
            {
                throw new InvalidOperationException($"PREREQUISITE_GATE_FAILED: {string.Join(" ", gateResult.BlockingReasons)}");
            }

            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var existing = journey.Phase4Data?.PricingStrategy;
            var context = await BuildContextAsync(userId, journey, ideaId);

            var strategy = ExecuteDerivation(context, existing);

            await _journeys.SetPhase4PricingStrategyAsync(userId, strategy, ideaId);

            return new PricingStrategyResponse
            {
                Strategy = strategy,
                UpdateAvailable = false,
                ChangedSources = new List<string>(),
                PrerequisiteGate = gateResult
            };
        }

        public async Task<PricingStrategyResponse> UpdatePricingOfferAsync(string userId, string offerKey, UpdatePricingOfferRequest request)
        {
            if (string.IsNullOrWhiteSpace(offerKey))
            {
                throw new ArgumentException("offerKey is required.");
            }

            var journey = await _journeys.GetOrCreateComposedAsync(userId, request?.IdeaId);
            var strategy = journey.Phase4Data?.PricingStrategy;

            if (strategy == null)
            {
                throw new KeyNotFoundException("Pricing strategy has not been generated yet.");
            }

            var targetOffer = strategy.Offers.FirstOrDefault(o => string.Equals(o.Key, offerKey, StringComparison.OrdinalIgnoreCase));
            if (targetOffer == null)
            {
                throw new KeyNotFoundException($"Offer with key '{offerKey}' not found.");
            }

            var context = await BuildContextAsync(userId, journey, request?.IdeaId);

            // Apply founder overrides
            if (request?.ResetToRecommendation == true)
            {
                targetOffer.FounderPrice = null;
                targetOffer.FounderEdited = false;
            }
            else
            {
                if (request?.FounderPrice.HasValue == true)
                {
                    targetOffer.FounderPrice = request.FounderPrice.Value;
                    targetOffer.FounderEdited = true;
                }
                if (!string.IsNullOrWhiteSpace(request?.Name))
                {
                    targetOffer.Name = request.Name;
                    targetOffer.FounderEdited = true;
                }
                if (!string.IsNullOrWhiteSpace(request?.BillingFrequency) && Enum.TryParse<BillingFrequency>(request.BillingFrequency, true, out var bf))
                {
                    targetOffer.BillingFrequency = bf;
                    targetOffer.FounderEdited = true;
                }
                if (request?.IncludedFeatures != null)
                {
                    targetOffer.IncludedFeatures = request.IncludedFeatures;
                    targetOffer.FounderEdited = true;
                }
                if (request?.SetupFee.HasValue == true)
                {
                    targetOffer.SetupFee = request.SetupFee.Value;
                    targetOffer.FounderEdited = true;
                }
                if (request?.Notes != null)
                {
                    targetOffer.Notes = request.Notes;
                    targetOffer.FounderEdited = true;
                }
            }

            // Correction #6: Recalculate economics, forecast alignment, and risks immediately!
            _policyEngine.RecalculateOfferEconomics(targetOffer, context);

            // Re-evaluate strategy-wide risks and economics
            strategy.PricingRisks = _policyEngine.DetectPricingRisks(strategy.Offers, targetOffer.ForecastAlignment, context);
            strategy.LaunchRecommendation = _policyEngine.SynthesizeRecommendation(
                strategy.PrimaryRevenueModel,
                strategy.RevenueModels,
                strategy.Offers,
                strategy.PricingRisks,
                context
            );

            strategy.FounderEdited = strategy.Offers.Any(o => o.FounderEdited);
            strategy.UpdatedAt = DateTime.UtcNow;

            await _journeys.SetPhase4PricingStrategyAsync(userId, strategy, request?.IdeaId);

            var (isStale, changed) = DetectStaleness(strategy.SourceVersions, context.CurrentSourceVersions);

            var gateResult = await CheckGateAsync(userId, request?.IdeaId);

            return new PricingStrategyResponse
            {
                Strategy = strategy,
                UpdateAvailable = isStale,
                ChangedSources = changed,
                PrerequisiteGate = gateResult
            };
        }

        // =========================================================================
        // PIPELINE EXECUTION & RECONCILIATION
        // =========================================================================

        private PricingStrategy ExecuteDerivation(PricingContext context, PricingStrategy? existing)
        {
            // 1. Resolve Revenue Models
            var (primaryModel, underlyingModels) = _policyEngine.ResolveRevenueModels(context);

            // 2. Structure Offers
            var offers = _policyEngine.StructureOffers(context, primaryModel, underlyingModels);

            // 3. Reconcile with existing founder edits if available (Correction #6 & #7)
            if (existing != null)
            {
                foreach (var offer in offers)
                {
                    var prior = existing.Offers.FirstOrDefault(o => string.Equals(o.Key, offer.Key, StringComparison.OrdinalIgnoreCase));
                    if (prior != null && prior.FounderEdited)
                    {
                        offer.FounderPrice = prior.FounderPrice;
                        offer.FounderEdited = true;
                        offer.Notes = prior.Notes;
                        if (prior.IncludedFeatures.Count > 0)
                        {
                            offer.IncludedFeatures = prior.IncludedFeatures;
                        }
                        // Recalculate based on preserved founder price
                        _policyEngine.RecalculateOfferEconomics(offer, context);
                    }
                }
            }

            // 4. Primary Offer Alignment
            var primaryOffer = offers.FirstOrDefault();
            var forecastAlignment = primaryOffer != null ? _policyEngine.EvaluateForecastAlignment(primaryOffer, context) : null;

            // 5. Pricing Risks
            var risks = _policyEngine.DetectPricingRisks(offers, forecastAlignment, context);

            // 6. Experiments
            var experiments = _policyEngine.GeneratePricingExperiments(context, offers);

            // 7. Recommendation
            var recommendation = _policyEngine.SynthesizeRecommendation(primaryModel, underlyingModels, offers, risks, context);

            // 8. Free Entry Strategy
            var freeEntry = new FreeEntryStrategy
            {
                Exists = underlyingModels.Contains("Freemium") || offers.Any(o => o.Price == 0),
                Purpose = "Accelerate top-of-funnel discovery and lower trial friction for launch cohort",
                FreeLimit = "Limited to single project workspace or 14-day evaluation window",
                ConversionTrigger = "Reaching usage capacity or requiring export capabilities",
                PaidUpgradePath = $"Direct upgrade to {offers.FirstOrDefault(o => o.Price > 0)?.Name ?? "Starter"}",
                EconomicsWarning = "Ensure free tiers do not incur significant unrecovered variable infrastructure costs."
            };

            // 9. Discount Policy
            var discountPolicy = new DiscountPolicy
            {
                LaunchDiscount = "15% off for first 100 pioneer customers (capped at 3 billing cycles)",
                AnnualBillingDiscount = "2 months free (16.7% discount) on annual upfront commitments",
                VolumeDiscount = "Negotiable on enterprise commitments exceeding 10 seats",
                PromotionalLimit = "Maximum aggregate launch discount quota: €5,000 equivalent",
                MarginImpact = "Annual discount maintains positive contribution margin across all tiers"
            };

            // 10. Summary
            var summary = $"Launch pricing strategy structured around a {primaryModel} model with {offers.Count} segment-specific offer(s). Total {offers.Count(o => o.Confidence == PricingConfidence.Supported)} price point(s) supported by Phase 3 assumptions.";

            return new PricingStrategy
            {
                Status = PricingStatus.Generated,
                GeneratedAt = existing?.GeneratedAt ?? DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Summary = summary,
                PrimaryRevenueModel = primaryModel,
                RevenueModels = underlyingModels,
                CustomerSegments = context.CustomerSegments.Select(c => c.Segment).ToList(),
                Offers = offers,
                FreeEntryStrategy = freeEntry,
                DiscountPolicy = discountPolicy,
                UnitEconomicsSummary = primaryOffer?.UnitEconomics ?? new UnitEconomics(),
                ForecastAlignment = forecastAlignment,
                PricingRisks = risks,
                PricingExperiments = experiments,
                LaunchRecommendation = recommendation,
                SourceVersions = context.CurrentSourceVersions,
                FounderEdited = offers.Any(o => o.FounderEdited)
            };
        }

        // =========================================================================
        // CONTEXT BUILDER
        // =========================================================================

        private async Task<PricingContext> BuildContextAsync(string userId, CreatorJourney journey, string? ideaId)
        {
            var ctx = new PricingContext();

            // 1. Project Context
            var p = journey.Project ?? new CreatorJourneyProject();
            ctx.Project = new PricingProjectContext
            {
                IdeaId = ideaId ?? journey.ActiveIdeaId ?? string.Empty,
                Title = p.Name ?? "Venture",
                Sector = p.Sector ?? string.Empty,
                Problem = p.Problem ?? string.Empty,
                Solution = p.Solution ?? string.Empty,
                TargetUser = p.TargetUser ?? string.Empty,
                Positioning = p.CreatorEdge ?? string.Empty,
                Stage = "pre_launch"
            };

            var p3 = journey.Phase3Data ?? new CreatorPhase3Data();
            var consumedSources = new List<string> { "Project", "BusinessModel", "Forecast", "MarketStudy" };

            // 2. Business Model
            if (_businessModels != null && !string.IsNullOrEmpty(p3.BusinessModelSessionId))
            {
                var bm = await _businessModels.GetOwnedAsync(p3.BusinessModelSessionId, userId);
                if (bm != null)
                {
                    ctx.CurrentSourceVersions.BusinessModelVersion = bm.CurrentVersion;
                    ctx.CurrentSourceVersions.BusinessModelUpdatedAt = bm.UpdatedAt;

                    var activeVer = bm.Versions.FirstOrDefault(v => v.Version == bm.CurrentVersion);
                    var doc = activeVer?.Content ?? activeVer?.GeneratedContent;
                    if (doc != null)
                    {
                        // Customer Segments
                        if (doc.Contains("canvas") && doc["canvas"].IsBsonDocument && doc["canvas"].AsBsonDocument.Contains("customerSegments"))
                        {
                            var segArr = doc["canvas"]["customerSegments"].AsBsonArray;
                            foreach (var s in segArr)
                            {
                                if (s.IsBsonDocument)
                                {
                                    var sd = s.AsBsonDocument;
                                    ctx.CustomerSegments.Add(new PricingCustomerSegmentItem
                                    {
                                        Segment = sd.Contains("segment") ? sd["segment"].AsString : "General Segment",
                                        SourceFootnote = sd.Contains("marketStudyFootnote") ? sd["marketStudyFootnote"].AsString : ""
                                    });
                                }
                            }
                        }

                        // Value Propositions
                        if (doc.Contains("canvas") && doc["canvas"].IsBsonDocument && doc["canvas"].AsBsonDocument.Contains("valuePropositions"))
                        {
                            var vpArr = doc["canvas"]["valuePropositions"].AsBsonArray;
                            foreach (var v in vpArr)
                            {
                                if (v.IsBsonDocument)
                                {
                                    var vd = v.AsBsonDocument;
                                    ctx.ValuePropositions.Add(new PricingValuePropItem
                                    {
                                        Headline = vd.Contains("headline") ? vd["headline"].AsString : "",
                                        Details = vd.Contains("details") ? vd["details"].AsString : "",
                                        SourceFootnote = vd.Contains("marketStudyFootnote") ? vd["marketStudyFootnote"].AsString : ""
                                    });
                                }
                            }
                        }

                        // Revenue Streams
                        if (doc.Contains("canvas") && doc["canvas"].IsBsonDocument && doc["canvas"].AsBsonDocument.Contains("revenueStreams"))
                        {
                            var rsArr = doc["canvas"]["revenueStreams"].AsBsonArray;
                            foreach (var r in rsArr)
                            {
                                if (r.IsBsonDocument)
                                {
                                    var rd = r.AsBsonDocument;
                                    ctx.RevenueStreams.Add(new PricingRevenueStreamItem
                                    {
                                        Stream = rd.Contains("stream") ? rd["stream"].AsString : "",
                                        SourceFootnote = rd.Contains("marketStudyFootnote") ? rd["marketStudyFootnote"].AsString : ""
                                    });
                                }
                            }
                        }

                        // Existing Revenue Tiers
                        if (doc.Contains("revenueTiers") && doc["revenueTiers"].IsBsonArray)
                        {
                            foreach (var t in doc["revenueTiers"].AsBsonArray)
                            {
                                if (t.IsBsonDocument)
                                {
                                    var td = t.AsBsonDocument;
                                    var tier = new PricingExistingAssumptionItem
                                    {
                                        TierName = td.Contains("tierName") ? td["tierName"].AsString : "Plan",
                                        Pricing = td.Contains("pricing") ? td["pricing"].AsString : "",
                                        TargetSegment = td.Contains("targetSegment") ? td["targetSegment"].AsString : ""
                                    };
                                    if (td.Contains("features") && td["features"].IsBsonArray)
                                    {
                                        tier.Features = td["features"].AsBsonArray.Select(f => f.ToString()).ToList();
                                    }
                                    if (td.Contains("projectedContributionPct") && td["projectedContributionPct"].IsNumeric)
                                    {
                                        tier.ProjectedContributionPct = (decimal)td["projectedContributionPct"].ToDouble();
                                    }
                                    ctx.ExistingPricingAssumptions.Add(tier);
                                }
                            }
                        }
                    }
                }
            }

            // 3. Forecast
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
                    ctx.CurrentSourceVersions.ForecastUpdatedAt = fc.UpdatedAt;

                    if (fc.Inputs != null)
                    {
                        if (fc.Inputs.Arpu.HasValue) ctx.Forecast.Arpu = (decimal)fc.Inputs.Arpu.Value;
                        if (fc.Inputs.Opex.HasValue) ctx.Forecast.MonthlyOpex = (decimal)fc.Inputs.Opex.Value;
                        if (fc.Inputs.MonthlyGrowthPct.HasValue) ctx.Forecast.MonthlyGrowthPct = (decimal)fc.Inputs.MonthlyGrowthPct.Value;
                        if (fc.Inputs.MonthlyChurnPct.HasValue) ctx.Forecast.MonthlyChurnPct = (decimal)fc.Inputs.MonthlyChurnPct.Value;
                        if (fc.Inputs.Tam.HasValue) ctx.Forecast.Tam = (decimal)fc.Inputs.Tam.Value;
                    }

                    var activeVer = fc.Versions.FirstOrDefault(v => v.Version == fc.CurrentVersion);
                    var doc = activeVer?.Content ?? activeVer?.GeneratedContent;
                    if (doc != null)
                    {
                        // Cost Forecast
                        if (doc.Contains("costForecast") && doc["costForecast"].IsBsonDocument && doc["costForecast"].AsBsonDocument.Contains("monthly"))
                        {
                            var mArr = doc["costForecast"]["monthly"].AsBsonArray;
                            foreach (var m in mArr)
                            {
                                if (m.IsBsonDocument)
                                {
                                    var md = m.AsBsonDocument;
                                    var fix = md.Contains("fixedCosts") && md["fixedCosts"].IsNumeric ? (decimal)md["fixedCosts"].ToDouble() : 0m;
                                    var vari = md.Contains("variableCosts") && md["variableCosts"].IsNumeric ? (decimal)md["variableCosts"].ToDouble() : 0m;
                                    ctx.Forecast.MonthlyFixedCosts.Add(fix);
                                    ctx.Forecast.MonthlyVariableCosts.Add(vari);
                                }
                            }
                        }

                        // Break Even Analysis
                        if (doc.Contains("breakEvenAnalysis") && doc["breakEvenAnalysis"].IsBsonDocument)
                        {
                            var be = doc["breakEvenAnalysis"].AsBsonDocument;
                            if (be.Contains("breakEvenMonth") && be["breakEvenMonth"].IsNumeric)
                            {
                                ctx.Forecast.BreakEvenMonth = be["breakEvenMonth"].ToInt32();
                            }
                            if (be.Contains("isAchievedWithinHorizon") && be["isAchievedWithinHorizon"].IsBoolean)
                            {
                                ctx.Forecast.BreakEvenAchieved = be["isAchievedWithinHorizon"].AsBoolean;
                            }
                            if (be.Contains("summary") && be["summary"].IsString)
                            {
                                ctx.Forecast.BreakEvenSummary = be["summary"].AsString;
                            }
                        }
                    }
                }
            }

            // 4. Market Study (Competitor Evidence)
            if (_marketStudies != null && !string.IsNullOrEmpty(p3.MarketStudySessionId))
            {
                var ms = await _marketStudies.GetOwnedAsync(p3.MarketStudySessionId, userId);
                if (ms != null)
                {
                    ctx.CurrentSourceVersions.MarketStudyVersion = ms.CurrentVersion;
                    ctx.CurrentSourceVersions.MarketStudyUpdatedAt = ms.UpdatedAt;

                    var activeVer = ms.Versions.FirstOrDefault(v => v.Version == ms.CurrentVersion);
                    var doc = activeVer?.Content ?? activeVer?.GeneratedContent;
                    if (doc != null && doc.Contains("competitorLandscape") && doc["competitorLandscape"].IsBsonDocument)
                    {
                        var cl = doc["competitorLandscape"].AsBsonDocument;
                        if (cl.Contains("directCompetitors") && cl["directCompetitors"].IsBsonArray)
                        {
                            foreach (var c in cl["directCompetitors"].AsBsonArray)
                            {
                                if (c.IsBsonDocument)
                                {
                                    var cd = c.AsBsonDocument;
                                    ctx.CompetitorEvidence.Add(new PricingCompetitorItem
                                    {
                                        Name = cd.Contains("name") ? cd["name"].AsString : "Competitor",
                                        PricingModel = cd.Contains("pricingModel") ? cd["pricingModel"].AsString : "Standard",
                                        ThreatLevel = cd.Contains("threatLevel") ? cd["threatLevel"].AsString : "Medium",
                                        ExploitableGap = cd.Contains("exploitableGap") ? cd["exploitableGap"].AsString : "",
                                        SourceAttribution = cd.Contains("sourceAttribution") ? cd["sourceAttribution"].AsString : "Market Study"
                                    });
                                }
                            }
                        }
                    }
                }
            }

            // 5. Cost Structure Context
            ctx.CostStructure.EstimatedMonthlyFixedCosts = ctx.Forecast.MonthlyFixedCosts.Count > 0
                ? Math.Round(ctx.Forecast.MonthlyFixedCosts.Average(), 2)
                : (ctx.Forecast.MonthlyOpex ?? 2000m);

            ctx.CostStructure.EstimatedVariableCostPerUnit = ctx.Forecast.Arpu.HasValue && ctx.Forecast.Arpu.Value > 0
                ? Math.Round(ctx.Forecast.Arpu.Value * 0.25m, 2)
                : 15.0m;

            // 6. Needs Context (Optional / Conditional)
            var needs = journey.Phase4Data?.NeedsAnalysis;
            if (needs != null)
            {
                ctx.Needs.ActiveNeedsCount = needs.ActiveNeeds?.Count ?? 0;
                ctx.Needs.TotalEstimatedBudget = needs.ActiveNeeds?.Sum(n => n.EstimatedBudget ?? 0m) ?? 0m;
                ctx.Needs.UpdatedAt = needs.UpdatedAt;
                ctx.CurrentSourceVersions.NeedsAnalysisUpdatedAt = needs.UpdatedAt;
            }

            // 7. Support Plan Context (Optional / Conditional)
            var support = journey.Phase4Data?.SupportPlan;
            if (support != null)
            {
                ctx.Support.EligibleMatchesCount = support.Summary?.EligibleCount ?? 0;
                ctx.Support.TotalEstimatedSubsidies = support.Matches?.Where(m => m.EligibilityStatus == "Eligible").Sum(m => m.EstimatedSupportValue ?? 0m) ?? 0m;
                ctx.Support.UpdatedAt = support.UpdatedAt;
                ctx.CurrentSourceVersions.SupportPlanUpdatedAt = support.UpdatedAt;

                if (ctx.Support.ConsumedInPricing)
                {
                    consumedSources.Add("SupportPlan");
                    ctx.CurrentSourceVersions.SupportPlanConsumed = true;
                }
            }

            ctx.CurrentSourceVersions.ConsumedSources = consumedSources;
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
                reasons.Add("Phase 3 (Market Study, Business Model, Financial Forecast) must be completed before building launch pricing.");
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

            return new PrerequisiteGateDto
            {
                CanAccess = reasons.Count == 0,
                BlockingReasons = reasons
            };
        }

        // Correction #7: Conditional Staleness Dependency
        private (bool IsStale, List<string> ChangedSources) DetectStaleness(
            PricingSourceVersions? saved,
            PricingSourceVersions current)
        {
            if (saved == null) return (false, new List<string>());

            var changed = new List<string>();

            // Critical Sources (Always trigger staleness if current version is positive and differs)
            if (current.MarketStudyVersion > 0 && saved.MarketStudyVersion != current.MarketStudyVersion)
                changed.Add("Market Study (Phase 3.1)");
            if (current.BusinessModelVersion > 0 && saved.BusinessModelVersion != current.BusinessModelVersion)
                changed.Add("Business Model Canvas (Phase 3.2)");
            if (current.ForecastVersion > 0 && saved.ForecastVersion != current.ForecastVersion)
                changed.Add("Financial Forecast (Phase 3.4)");
            if (saved.ProjectUpdatedAt.HasValue && current.ProjectUpdatedAt.HasValue &&
                current.ProjectUpdatedAt.Value > saved.ProjectUpdatedAt.Value.AddSeconds(5))
                changed.Add("Project Core Details");

            // Conditional Sources: Only trigger if the strategy actually consumed them
            if (saved.ConsumedSources.Contains("NeedsAnalysis") &&
                saved.NeedsAnalysisUpdatedAt.HasValue && current.NeedsAnalysisUpdatedAt.HasValue &&
                current.NeedsAnalysisUpdatedAt.Value > saved.NeedsAnalysisUpdatedAt.Value.AddSeconds(5))
            {
                changed.Add("Needs & Requirements (Phase 4.3)");
            }

            if ((saved.ConsumedSources.Contains("SupportPlan") || saved.SupportPlanConsumed) &&
                saved.SupportPlanUpdatedAt.HasValue && current.SupportPlanUpdatedAt.HasValue &&
                current.SupportPlanUpdatedAt.Value > saved.SupportPlanUpdatedAt.Value.AddSeconds(5))
            {
                changed.Add("Aids & Public Support (Phase 4.5)");
            }

            return (changed.Count > 0, changed);
        }
    }
}
