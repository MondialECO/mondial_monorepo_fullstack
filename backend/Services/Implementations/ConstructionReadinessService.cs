using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Phase4;
using WebApp.Services.Interface;
using WebApp.Services.Repository;

namespace WebApp.Services.Implementations
{
    public class ConstructionReadinessService : IConstructionReadinessService
    {
        private readonly ICreatorJourneyService _journeys;
        private readonly IBrandKitStore _brandKits;
        private readonly ILogger<ConstructionReadinessService> _logger;

        public ConstructionReadinessService(
            ICreatorJourneyService journeys,
            IBrandKitStore brandKits,
            ILogger<ConstructionReadinessService> logger)
        {
            _journeys = journeys;
            _brandKits = brandKits;
            _logger = logger;
        }

        public async Task<ConstructionReadinessResponse> GetReadinessAssessmentAsync(string userId, string? ideaId = null)
        {
            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var effectiveIdeaId = ideaId ?? journey.ActiveIdeaId ?? string.Empty;

            var currentEvaluation = await EvaluateAssessmentAsync(userId, effectiveIdeaId, journey);
            var savedReview = journey.Phase4Data?.ConstructionReadiness;

            bool isSaved = savedReview != null && savedReview.ReviewedAt.HasValue;
            bool updateAvailable = false;
            List<string> changedSources = new();

            if (isSaved && savedReview != null)
            {
                if (!string.Equals(currentEvaluation.SourceFingerprint, savedReview.SourceFingerprint, StringComparison.Ordinal))
                {
                    updateAvailable = true;
                    changedSources = DetectChangedSources(savedReview, currentEvaluation);
                }
            }

            currentEvaluation.UpdateAvailable = updateAvailable;
            currentEvaluation.ChangedSources = changedSources;
            currentEvaluation.IdeaVersion = journey.IdeaVersion;

            return new ConstructionReadinessResponse
            {
                Review = currentEvaluation,
                IsSaved = isSaved,
                UpdateAvailable = updateAvailable,
                ChangedSources = changedSources,
                IdeaVersion = journey.IdeaVersion
            };
        }

        public async Task<ConstructionReadinessResponse> SaveReadinessReviewAsync(string userId, SaveConstructionReadinessRequest request)
        {
            if (request == null)
            {
                throw new ArgumentException("Request payload cannot be null.");
            }

            var journey = await _journeys.GetOrCreateComposedAsync(userId, request.IdeaId);
            var effectiveIdeaId = request.IdeaId ?? journey.ActiveIdeaId ?? string.Empty;

            var idea = await _journeys.TryResolveIdeaAsync(userId, effectiveIdeaId);
            if (idea == null)
            {
                throw new KeyNotFoundException($"Idea '{effectiveIdeaId}' not found for user.");
            }

            if (string.Equals(idea.ProjectOutcome, "SOLD", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Project is sold and read-only. Cannot save readiness review.");
            }

            if (request.ExpectedVersion.HasValue && request.ExpectedVersion.Value != idea.Version)
            {
                throw new CreatorJourneyException(409, $"Concurrency conflict: expected idea version {request.ExpectedVersion.Value}, but current is {idea.Version}.");
            }

            var evaluation = await EvaluateAssessmentAsync(userId, effectiveIdeaId, journey);
            if (!string.IsNullOrEmpty(request.SourceFingerprint))
            {
                if (!string.Equals(request.SourceFingerprint, evaluation.SourceFingerprint, StringComparison.Ordinal))
                {
                    throw new CreatorJourneyException(409, "Assessment inputs have changed since you reviewed them. Please review the updated assessment before saving.");
                }
            }
            evaluation.ReviewedAt = DateTime.UtcNow;
            evaluation.IdeaVersion = idea.Version + 1;

            var updatedJourney = await _journeys.SetPhase4ConstructionReadinessAsync(userId, evaluation, effectiveIdeaId);

            return new ConstructionReadinessResponse
            {
                Review = evaluation,
                IsSaved = true,
                UpdateAvailable = false,
                ChangedSources = new List<string>(),
                IdeaVersion = updatedJourney.IdeaVersion
            };
        }

        private async Task<ConstructionReadinessReview> EvaluateAssessmentAsync(string userId, string ideaId, CreatorJourney journey)
        {
            var p = journey.Project ?? new CreatorJourneyProject();
            var projectName = !string.IsNullOrWhiteSpace(p.Name) ? p.Name : "Your Project";
            var p4 = journey.Phase4Data ?? new CreatorPhase4Data();

            // -------------------------------------------------------------
            // Section 2: Artifacts
            // -------------------------------------------------------------
            var artifacts = new List<ReadinessArtifactCard>();

            // 1. Brand Kit
            bool hasBranding = !string.IsNullOrWhiteSpace(p.Branding?.LogoAsset) ||
                              !string.IsNullOrWhiteSpace(p.Branding?.BrandKitId) ||
                              (p.Branding?.ColorPalette?.Count > 0);
            if (!hasBranding && !string.IsNullOrWhiteSpace(ideaId))
            {
                try
                {
                    var kit = await _brandKits.GetByIdeaIdAsync(ideaId, userId);
                    if (kit != null) hasBranding = true;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to inspect BrandKitStore for idea {IdeaId}", ideaId);
                }
            }

            artifacts.Add(new ReadinessArtifactCard
            {
                Id = "brand_kit",
                Title = "Brand Kit",
                Status = hasBranding ? "Available" : "Missing",
                StatusColor = hasBranding ? "emerald" : "gray",
                Description = hasBranding ? "Your project’s visual identity is available to use." : "Visual identity has not been created yet.",
                ActionLabel = "View Brand Kit",
                ActionRoute = $"/dashboard/creator/phase-2/brand-kit?ideaId={ideaId}"
            });

            // 2. Financial Forecast
            bool hasForecast = !string.IsNullOrWhiteSpace(journey.Phase3Data?.ForecastSessionId) ||
                               (journey.OutputSnapshots?.ForecastVersions?.Count > 0);
            artifacts.Add(new ReadinessArtifactCard
            {
                Id = "financial_forecast",
                Title = "Financial Forecast",
                Status = hasForecast ? "Generated" : "Missing",
                StatusColor = hasForecast ? "blue" : "gray",
                Description = hasForecast ? "A planning forecast is available. Funding is not confirmed." : "Planning forecast has not been generated yet.",
                ActionLabel = "View forecast",
                ActionRoute = $"/dashboard/creator/phase-3/forecast?ideaId={ideaId}"
            });

            // 3. Operational Roadmap
            bool hasRoadmap = p4.Roadmap != null && string.Equals(p4.Roadmap.Status, "Active", StringComparison.OrdinalIgnoreCase);
            artifacts.Add(new ReadinessArtifactCard
            {
                Id = "operational_roadmap",
                Title = "Operational Roadmap",
                Status = hasRoadmap ? "Active" : "Missing",
                StatusColor = hasRoadmap ? "emerald" : "gray",
                Description = hasRoadmap ? "Your work is organised. Tasks still need to be completed." : "Roadmap has not been generated yet.",
                ActionLabel = "View roadmap",
                ActionRoute = $"/dashboard/creator/phase-4/roadmap?ideaId={ideaId}"
            });            // 4. Pricing Decision
            var pricing = p4.PricingStrategy;
            var selectedOffer = pricing?.Offers?.FirstOrDefault();
            bool hasPricing = pricing != null && pricing.Status != PricingStatus.Draft && selectedOffer != null;
            string pricingDesc;
            if (hasPricing && selectedOffer != null)
            {
                string curr = FormatCurrencySymbol(selectedOffer.Currency);
                string unitPeriod = FormatPricingUnitAndPeriod(selectedOffer);
                bool hasPaidEvidence = (selectedOffer.RecordedEvidence != null && selectedOffer.RecordedEvidence.Count > 0) ||
                                       selectedOffer.MarketPriceEvidenceType == MarketPriceEvidenceType.HistoricalSale ||
                                       selectedOffer.MarketPriceEvidenceType == MarketPriceEvidenceType.PaidPilot ||
                                       selectedOffer.MarketPriceEvidenceType == MarketPriceEvidenceType.QuoteAccepted ||
                                       selectedOffer.PriceEvidence?.Type == PriceEvidenceType.HistoricalSales ||
                                       selectedOffer.PriceEvidence?.Confidence == PricingConfidence.Validated;

                string evidenceClause = hasPaidEvidence
                    ? "Customer payment evidence is recorded."
                    : "Customer payment evidence is not yet recorded.";

                if (selectedOffer.Price == 0)
                {
                    pricingDesc = $"Free offer confirmed. {evidenceClause}";
                }
                else
                {
                    pricingDesc = $"{curr}{selectedOffer.Price} {unitPeriod}. {evidenceClause}";
                }
            }
            else
            {
                pricingDesc = "Pricing decision has not been selected yet.";
            }

            artifacts.Add(new ReadinessArtifactCard
            {
                Id = "pricing_decision",
                Title = "Pricing Decision",
                Status = hasPricing ? "Selected" : "Missing",
                StatusColor = hasPricing ? "blue" : "gray",
                Description = pricingDesc,
                ActionLabel = "View pricing",
                ActionRoute = $"/dashboard/creator/phase-4/pricing?ideaId={ideaId}"
            });

            // 5. Launch Strategy
            var gtm = p4.GtmStrategy;
            bool hasGtm = gtm != null && !string.Equals(gtm.Status, "Draft", StringComparison.OrdinalIgnoreCase);
            artifacts.Add(new ReadinessArtifactCard
            {
                Id = "launch_strategy",
                Title = "Launch Strategy",
                Status = hasGtm ? "Saved" : "Missing",
                StatusColor = hasGtm ? "blue" : "gray",
                Description = hasGtm ? "Start with customer conversations. Activities have not been recorded as completed." : "Go-to-market launch strategy has not been saved yet.",
                ActionLabel = "View strategy",
                ActionRoute = $"/dashboard/creator/phase-4/gtm?ideaId={ideaId}"
            });

            // 6. Launch Website
            var launchAssets = p4.LaunchAssets;
            bool hasAssets = launchAssets != null;
            bool isAssetsSelected = hasAssets && (string.Equals(launchAssets!.Status, "Selected", StringComparison.OrdinalIgnoreCase) || launchAssets.SelectedVersion > 0 || launchAssets.SharedVersion.HasValue);
            
            var heroSec = launchAssets?.Sections?.FirstOrDefault(s => s.Key == "hero");
            bool ctaConfigured = launchAssets != null && (
                (!string.IsNullOrWhiteSpace(heroSec?.ButtonDestinationValue) && heroSec?.ButtonDestinationType != "none" && heroSec?.ButtonDestinationType != "NotSet") ||
                (launchAssets.ButtonDestinationConfigured && !string.IsNullOrWhiteSpace(launchAssets.ButtonDestinationValue))
            );

            string websiteStatus = !hasAssets ? "Missing" : (isAssetsSelected ? "Selected" : "Draft available");
            string websiteColor = !hasAssets ? "gray" : (isAssetsSelected ? "emerald" : "amber");
            
            string websiteDesc;
            if (!hasAssets)
            {
                websiteDesc = "Launch website has not been generated yet.";
            }
            else if (isAssetsSelected)
            {
                websiteDesc = ctaConfigured
                    ? $"Version {launchAssets!.SelectedVersion} is selected as your preferred launch asset."
                    : $"Version {launchAssets!.SelectedVersion} is selected as your preferred launch asset. CTA destination remains to be configured.";
            }
            else
            {
                websiteDesc = ctaConfigured
                    ? $"Version {launchAssets!.Version} draft is available with CTA configured. Version selection is still needed."
                    : $"Version {launchAssets!.Version} draft is available. Selection and a CTA destination are still needed.";
            }

            artifacts.Add(new ReadinessArtifactCard
            {
                Id = "launch_website",
                Title = "Launch Website",
                Status = websiteStatus,
                StatusColor = websiteColor,
                Description = websiteDesc,
                ActionLabel = isAssetsSelected ? "View website" : "View draft",
                ActionRoute = $"/dashboard/creator/phase-4/assets?ideaId={ideaId}"
            });

            int savedCount = artifacts.Count(a => a.Status != "Missing");

            // -------------------------------------------------------------
            // Section 3: Issues Needing Attention
            // -------------------------------------------------------------
            var issues = new List<ReadinessAttentionIssue>();

            // Technical Delivery (Critical)
            var skills = p4.SkillsPlan;
            var roadmap = p4.Roadmap;

            bool hasTechDelegate = false;
            if (skills == null || skills.Resolutions == null || skills.Resolutions.Count == 0)
            {
                hasTechDelegate = true;
            }
            else
            {
                hasTechDelegate = skills.Resolutions.Any(r =>
                    (r.NeedCategory?.Contains("Technical", StringComparison.OrdinalIgnoreCase) == true ||
                     r.Capability?.Contains("Development", StringComparison.OrdinalIgnoreCase) == true ||
                     r.Capability?.Contains("Technical", StringComparison.OrdinalIgnoreCase) == true ||
                     r.Capability?.Contains("Software", StringComparison.OrdinalIgnoreCase) == true ||
                     r.Capability?.Contains("Engineering", StringComparison.OrdinalIgnoreCase) == true) &&
                    (string.Equals(r.ResolutionMode, ResolutionModes.Delegate, StringComparison.OrdinalIgnoreCase) ||
                     string.Equals(r.FounderDecision, FounderDecisionChoices.ChooseDelegate, StringComparison.OrdinalIgnoreCase)));
            }

            var connectedTask = roadmap?.Stages?
                .SelectMany(s => s.Tasks ?? new List<RoadmapTask>())
                .FirstOrDefault(t => t.Title.Contains("Technical", StringComparison.OrdinalIgnoreCase) ||
                                     t.Title.Contains("brief", StringComparison.OrdinalIgnoreCase) ||
                                     t.Title.Contains("developer", StringComparison.OrdinalIgnoreCase) ||
                                     t.Title.Contains("Build", StringComparison.OrdinalIgnoreCase));

            if (connectedTask == null)
            {
                connectedTask = roadmap?.Stages?
                    .SelectMany(s => s.Tasks ?? new List<RoadmapTask>())
                    .FirstOrDefault(t => t.Status != RoadmapTaskStatus.Done);
            }

            string? taskId = connectedTask?.Id;
            string? taskTitle = connectedTask?.Title;
            string? taskEffort = !string.IsNullOrWhiteSpace(connectedTask?.EstimatedEffort) ? connectedTask.EstimatedEffort : null;

            if (hasTechDelegate)
            {
                var techIssue = new ReadinessAttentionIssue
                {
                    Id = "issue_technical_delivery",
                    Priority = "critical",
                    Title = "Confirm how the product will be built",
                    Subtitle = "Technical delivery support has not been confirmed.",
                    Badge = "Critical priority",
                    BadgeColor = "rose",
                    WhyItMatters = $"{projectName} needs suitable development capability before product construction can proceed as planned.",
                    WhatIsAlreadyDecided = "You selected Delegate for product development.",
                    WhatIsStillNeeded = "Confirm suitable capability, availability, and a delivery arrangement that matches the work.",
                    WhatThisAffects = new List<string>
                    {
                        "Building the initial product.",
                        "Producing a usable demo.",
                        "Scheduling later product-dependent launch activities."
                    },
                    SourcesText = "Sources: Needs & Requirements · Skills & Training · Operational Roadmap",
                    ActionLabel = "Review technical delivery need",
                    ActionRoute = $"/dashboard/creator/phase-4/needs?ideaId={ideaId}"
                };

                if (connectedTask != null && !string.IsNullOrWhiteSpace(taskId))
                {
                    techIssue.ConnectedWork = $"Connected work: {taskTitle}";
                    techIssue.ConnectedTaskId = taskId;
                    techIssue.SecondaryActionLabel = "Open connected roadmap task";
                    techIssue.SecondaryActionRoute = $"/dashboard/creator/phase-4/roadmap?ideaId={ideaId}&taskId={taskId}";
                }
                else
                {
                    techIssue.ConnectedWork = null;
                    techIssue.ConnectedTaskId = null;
                    techIssue.SecondaryActionLabel = "Open roadmap";
                    techIssue.SecondaryActionRoute = $"/dashboard/creator/phase-4/roadmap?ideaId={ideaId}";
                }

                issues.Add(techIssue);
            }

            // Website CTA destination issue: only if !ctaConfigured
            if (launchAssets != null && !ctaConfigured)
            {
                string btnLabel = !string.IsNullOrWhiteSpace(launchAssets.ButtonLabel) ? launchAssets.ButtonLabel : (!string.IsNullOrWhiteSpace(heroSec?.ButtonLabel) ? heroSec.ButtonLabel : "Express interest");
                issues.Add(new ReadinessAttentionIssue
                {
                    Id = "issue_website_cta",
                    Priority = "medium",
                    Title = "Connect your website’s main button",
                    Subtitle = $"‘{btnLabel}’ has no destination.",
                    Badge = "Asset action",
                    BadgeColor = "amber",
                    WhyItMatters = "Visitors cannot use this action until a confirmed email address or existing link is added.",
                    WhatIsAlreadyDecided = $"You included a call to action button labeled ‘{btnLabel}’.",
                    WhatIsStillNeeded = "Set a valid destination URL or mailto email link for the primary CTA.",
                    WhatThisAffects = new List<string> { "Lead collection and conversion on your launch page." },
                    ActionLabel = "Open Launch Assets",
                    ActionRoute = $"/dashboard/creator/phase-4/launch-assets?ideaId={ideaId}"
                });
            }

            // Website version selection issue: only if not selected
            if (launchAssets != null && !isAssetsSelected)
            {
                issues.Add(new ReadinessAttentionIssue
                {
                    Id = "issue_website_version",
                    Priority = "medium",
                    Title = "Choose the website version to keep",
                    Subtitle = $"Version {launchAssets.Version} is available as a draft.",
                    Badge = "Selection",
                    BadgeColor = "gray",
                    WhyItMatters = "Review it before selecting it as your preferred launch asset.",
                    WhatIsAlreadyDecided = $"Version {launchAssets.Version} is available as a draft.",
                    WhatIsStillNeeded = "Review it before selecting it as your preferred launch asset.",
                    WhatThisAffects = new List<string> { "Setting an authoritative version for public sharing and launch." },
                    ActionLabel = "Review website draft",
                    ActionRoute = $"/dashboard/creator/phase-4/launch-assets?ideaId={ideaId}"
                });
            }

            // Marketing Budget confirmation issue
            bool isBudgetConfirmedZero = gtm?.BudgetPlan?.TotalAvailableBudget == 0 || gtm?.BudgetPlan?.SpendableStatus == SpendableStatus.ConfirmedAvailable;
            bool isBudgetUnconfirmed = gtm == null || (gtm.BudgetPlan?.TotalAvailableBudget == null && !isBudgetConfirmedZero);
            if (isBudgetUnconfirmed)
            {
                issues.Add(new ReadinessAttentionIssue
                {
                    Id = "issue_marketing_budget",
                    Priority = "medium",
                    Title = "Confirm your marketing budget",
                    Subtitle = "No budget decision is recorded.",
                    Badge = "Needs validation",
                    BadgeColor = "amber",
                    WhyItMatters = "Paid activities need a confirmed budget before spending decisions are made.",
                    WhatIsAlreadyDecided = "Initial launch channels and activities have been organized.",
                    WhatIsStillNeeded = "Confirm whether you are pursuing a zero-budget organic launch or allocating capital for paid outreach.",
                    WhatThisAffects = new List<string> { "Executing paid outreach and channel promotions." },
                    ActionLabel = "Review launch budget",
                    ActionRoute = $"/dashboard/creator/phase-4/gtm?ideaId={ideaId}"
                });
            }

            // Offer details review issue
            bool offerDetailsNeedReview = pricing == null || pricing.Offers == null || pricing.Offers.Count == 0 ||
                pricing.Offers.Any(o => o.Price == 0 && string.IsNullOrWhiteSpace(o.Name));
            if (offerDetailsNeedReview)
            {
                issues.Add(new ReadinessAttentionIssue
                {
                    Id = "issue_commercial_detail",
                    Priority = "medium",
                    Title = "Review the details of your offer",
                    Subtitle = "Usage limits, included support, and tax basis remain unconfirmed.",
                    Badge = "Commercial detail",
                    BadgeColor = "gray",
                    WhyItMatters = "These details need review before publishing complete pricing information.",
                    WhatIsAlreadyDecided = selectedOffer != null ? "A base price level has been selected." : "Pricing options have been drafted.",
                    WhatIsStillNeeded = "Confirm usage limits, support inclusion, and VAT/tax parameters.",
                    WhatThisAffects = new List<string> { "Publishing complete pricing terms to prospective buyers." },
                    ExtraInfo = "Payment evidence: Not tested",
                    ActionLabel = "Review Pricing",
                    ActionRoute = $"/dashboard/creator/phase-4/pricing?ideaId={ideaId}"
                });
            }

            // -------------------------------------------------------------
            // Section 4: Your Next Action
            // -------------------------------------------------------------
            ReadinessNextAction nextAction;
            if (connectedTask != null && !string.IsNullOrWhiteSpace(taskId))
            {
                nextAction = new ReadinessNextAction
                {
                    Type = "Existing roadmap task",
                    EstimatedEffort = taskEffort,
                    Title = taskTitle ?? "Roadmap task",
                    Description = hasTechDelegate
                        ? "Describe the work and expected result so you can review suitable technical support. This task is actionable and relates to your critical delivery need."
                        : "Review your organized roadmap tasks to advance development and launch milestones.",
                    PrimaryActionLabel = "Open roadmap task",
                    PrimaryActionRoute = $"/dashboard/creator/phase-4/roadmap?ideaId={ideaId}&taskId={taskId}",
                    SecondaryActionLabel = "View roadmap",
                    SecondaryActionRoute = $"/dashboard/creator/phase-4/roadmap?ideaId={ideaId}",
                    TaskId = taskId
                };
            }
            else
            {
                nextAction = new ReadinessNextAction
                {
                    Type = "Suggested action",
                    EstimatedEffort = null,
                    Title = "Review your operational roadmap",
                    Description = hasTechDelegate
                        ? "Organise technical delivery and founder responsibilities in your roadmap before starting construction."
                        : "Review your organized roadmap tasks to advance development and launch milestones.",
                    PrimaryActionLabel = "Open roadmap",
                    PrimaryActionRoute = $"/dashboard/creator/phase-4/roadmap?ideaId={ideaId}",
                    SecondaryActionLabel = null,
                    SecondaryActionRoute = null,
                    TaskId = null
                };
            }

            // -------------------------------------------------------------
            // Section 1: Compact Assessment Summary
            // -------------------------------------------------------------
            bool hasCritical = issues.Any(i => i.Priority == "critical");
            bool hasMissingArtifacts = artifacts.Any(a => a.Status == "Missing");

            string status;
            string positionHeadline;
            string dependencyGuidance;

            if (hasCritical)
            {
                status = "Preparation in progress";
                if (!hasAssets)
                {
                    positionHeadline = "Your plans are in progress. Technical delivery still needs to be confirmed.";
                }
                else
                {
                    positionHeadline = "Your plans and website draft are available. Technical delivery still needs to be confirmed.";
                }
                dependencyGuidance = "Product construction depends on confirming suitable technical delivery support.";
            }
            else if (hasMissingArtifacts)
            {
                status = "Preparation in progress";
                positionHeadline = "Foundational project artifacts remain incomplete before construction can proceed.";
                dependencyGuidance = "Complete all required foundational artifacts across your journey before starting construction.";
            }
            else if (issues.Count > 0)
            {
                status = "Review in progress";
                positionHeadline = "Your core plans are available with secondary items remaining for review.";
                dependencyGuidance = "Review secondary items before commencing construction.";
            }
            else
            {
                status = "Ready for construction";
                positionHeadline = "Your foundational plans, assets, and technical readiness are confirmed.";
                dependencyGuidance = "No critical delivery blockers identified.";
            }

            string currentActionGuidance = "You can continue preparing customer conversations.";

            string fingerprint = ComputeSourceFingerprint(journey);

            return new ConstructionReadinessReview
            {
                Status = status,
                OverallScore = null, // Score not yet calculated (nullable per canon)
                ScoreStatus = "NotCalculated",
                ScoreAvailabilityExplanation = "Review the available work and unresolved items below.",
                PositionHeadline = positionHeadline,
                CurrentActionGuidance = currentActionGuidance,
                DependencyGuidance = dependencyGuidance,
                SavedArtifactsCount = savedCount,
                Artifacts = artifacts,
                Issues = issues,
                NextAction = nextAction,
                EvaluatedAt = DateTime.UtcNow,
                PolicyVersion = "2026.1-construction-readiness",
                SourceFingerprint = fingerprint
            };
        }

        private static string FormatCurrencySymbol(string? currency)
        {
            if (string.IsNullOrWhiteSpace(currency)) return "€";
            return currency.Trim().ToUpperInvariant() switch
            {
                "EUR" or "€" => "€",
                "USD" or "$" => "$",
                "GBP" or "£" => "£",
                _ => currency.Trim()
            };
        }

        private static string FormatPricingUnitAndPeriod(PricingOffer offer)
        {
            if (offer.PricingModel == RevenueModelType.ProjectBased)
                return "per project";
            if (offer.PricingModel == RevenueModelType.UsageBased)
                return "usage-based";
            if (offer.PricingModel == RevenueModelType.OneTime)
                return "one-off";

            return offer.BillingFrequency switch
            {
                BillingFrequency.Annual => "per year",
                BillingFrequency.OneOff => "one-off",
                BillingFrequency.Hourly => "per hour",
                BillingFrequency.PerUse => "per use",
                BillingFrequency.Retainer => "per month retainer",
                BillingFrequency.Milestone => "per milestone",
                _ => "per business / month"
            };
        }

        private static string ComputeSourceFingerprint(CreatorJourney journey)
        {
            var p4 = journey.Phase4Data;
            var sb = new StringBuilder();

            sb.Append(journey.Project?.Branding?.BrandKitId ?? "").Append('|');
            sb.Append(journey.Project?.Branding?.LogoAsset ?? "").Append('|');
            sb.Append(journey.Phase3Data?.ForecastSessionId ?? "").Append('|');

            if (p4?.Roadmap != null)
            {
                sb.Append(p4.Roadmap.Status).Append('|');
                sb.Append(p4.Roadmap.Stages?.Count ?? 0).Append('|');
                sb.Append(p4.Roadmap.Stages?.SelectMany(s => s.Tasks ?? new List<RoadmapTask>()).Count(t => t.Status == RoadmapTaskStatus.Done) ?? 0).Append('|');
            }

            if (p4?.NeedsAnalysis != null)
            {
                sb.Append(p4.NeedsAnalysis.Status).Append('|');
                sb.Append(p4.NeedsAnalysis.CountsByCategory?.Count ?? 0).Append('|');
            }

            if (p4?.SkillsPlan != null)
            {
                sb.Append(p4.SkillsPlan.Status).Append('|');
                sb.Append(p4.SkillsPlan.Resolutions?.Count ?? 0).Append('|');
            }

            if (p4?.SupportPlan != null)
            {
                sb.Append(p4.SupportPlan.Status).Append('|');
            }

            if (p4?.PricingStrategy != null)
            {
                sb.Append(p4.PricingStrategy.Status).Append('|');
                sb.Append(p4.PricingStrategy.Offers?.FirstOrDefault()?.Price ?? -1).Append('|');
            }

            if (p4?.GtmStrategy != null)
            {
                sb.Append(p4.GtmStrategy.Status).Append('|');
                sb.Append(p4.GtmStrategy.BudgetPlan?.TotalAvailableBudget ?? -1).Append('|');
            }

            if (p4?.LaunchAssets != null)
            {
                sb.Append(p4.LaunchAssets.Version).Append('|');
                sb.Append(p4.LaunchAssets.SelectedVersion).Append('|');
                sb.Append(p4.LaunchAssets.ShareToken ?? "").Append('|');
            }

            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(sb.ToString()));
            return Convert.ToBase64String(bytes);
        }

        private static List<string> DetectChangedSources(ConstructionReadinessReview previous, ConstructionReadinessReview current)
        {
            var changes = new List<string>();

            // Compare artifact states
            var prevMap = previous.Artifacts.ToDictionary(a => a.Id, a => a.Status);
            foreach (var card in current.Artifacts)
            {
                if (!prevMap.TryGetValue(card.Id, out var oldStatus) || oldStatus != card.Status)
                {
                    changes.Add(card.Title);
                }
            }

            if (previous.Issues.Count != current.Issues.Count)
            {
                changes.Add("Attention Issues");
            }

            return changes.Distinct().ToList();
        }
    }
}
