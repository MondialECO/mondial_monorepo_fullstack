using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Phase4;
using WebApp.Services.Interface;
using WebApp.Services.Repository;

namespace WebApp.Services.Implementations
{
    public class LaunchAssetsService : ILaunchAssetsService
    {
        private readonly ICreatorJourneyService _journeys;
        private readonly IPricingStrategyService _pricingService;
        private readonly IGtmStrategyService _gtmService;
        private readonly IBrandKitStore _brandKits;
        private readonly ILogger<LaunchAssetsService> _logger;

        public LaunchAssetsService(
            ICreatorJourneyService journeys,
            IPricingStrategyService pricingService,
            IGtmStrategyService gtmService,
            IBrandKitStore brandKits,
            ILogger<LaunchAssetsService> logger)
        {
            _journeys = journeys;
            _pricingService = pricingService;
            _gtmService = gtmService;
            _brandKits = brandKits;
            _logger = logger;
        }

        public async Task<LaunchAssetsResponse> GetLaunchAssetsAsync(string userId, string? ideaId = null)
        {
            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var existing = journey.Phase4Data?.LaunchAssets;

            if (existing == null)
            {
                return new LaunchAssetsResponse
                {
                    IdeaId = ideaId ?? string.Empty,
                    IdeaVersion = journey.IdeaVersion,
                    Assets = null,
                    UpdateAvailable = false,
                    ChangedSources = new List<string>()
                };
            }

            // If BrandStudio summary wasn't populated yet, attempt to enrich it on the fly
            if (string.IsNullOrWhiteSpace(existing.BrandStudio?.BrandName) && !string.IsNullOrWhiteSpace(ideaId))
            {
                var kit = await _brandKits.GetByIdeaIdAsync(ideaId, userId);
                if (kit != null)
                {
                    EnrichBrandStudioFromKit(existing, kit);
                }
            }

            return new LaunchAssetsResponse
            {
                IdeaId = ideaId ?? string.Empty,
                IdeaVersion = journey.IdeaVersion,
                Assets = existing,
                UpdateAvailable = false,
                ChangedSources = new List<string>()
            };
        }

        public async Task<LaunchAssetsResponse> GenerateLaunchAssetsAsync(string userId, string? ideaId = null)
        {
            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var existing = journey.Phase4Data?.LaunchAssets;
            if (existing != null)
            {
                // Ensure BrandStudio is enriched if it was previously empty
                if (string.IsNullOrWhiteSpace(existing.BrandStudio?.BrandName) && !string.IsNullOrWhiteSpace(ideaId))
                {
                    var kit = await _brandKits.GetByIdeaIdAsync(ideaId, userId);
                    if (kit != null)
                    {
                        EnrichBrandStudioFromKit(existing, kit);
                        await _journeys.SetPhase4LaunchAssetsAsync(userId, existing, ideaId);
                    }
                }

                return new LaunchAssetsResponse
                {
                    IdeaId = ideaId ?? string.Empty,
                    IdeaVersion = journey.IdeaVersion,
                    Assets = existing,
                    UpdateAvailable = false,
                    ChangedSources = new List<string>()
                };
            }

            // Retrieve BrandKit if ideaId is available
            BrandKit? brandKit = null;
            if (!string.IsNullOrWhiteSpace(ideaId))
            {
                try
                {
                    brandKit = await _brandKits.GetByIdeaIdAsync(ideaId, userId);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to load BrandKit for idea {IdeaId}", ideaId);
                }
            }

            var brandName = !string.IsNullOrWhiteSpace(brandKit?.Strategy?.BusinessName)
                ? brandKit.Strategy.BusinessName.Trim()
                : (!string.IsNullOrWhiteSpace(journey.Project?.Name) ? journey.Project.Name.Trim() : "Your Project");

            var concept = !string.IsNullOrWhiteSpace(brandKit?.Strategy?.Concept?.Value)
                ? brandKit.Strategy.Concept.Value.Trim()
                : (!string.IsNullOrWhiteSpace(journey.Project?.Concept)
                    ? journey.Project.Concept.Trim()
                    : (!string.IsNullOrWhiteSpace(journey.Project?.Tagline) ? journey.Project.Tagline.Trim() : string.Empty));

            var brandAudience = !string.IsNullOrWhiteSpace(brandKit?.Strategy?.TargetAudience?.Value)
                ? brandKit.Strategy.TargetAudience.Value.Trim()
                : (!string.IsNullOrWhiteSpace(journey.Project?.TargetUser) ? journey.Project.TargetUser.Trim() : string.Empty);

            var brandPositioning = !string.IsNullOrWhiteSpace(brandKit?.Strategy?.Positioning?.Value)
                ? brandKit.Strategy.Positioning.Value.Trim()
                : string.Empty;

            var industry = !string.IsNullOrWhiteSpace(brandKit?.Strategy?.Industry?.Value)
                ? brandKit.Strategy.Industry.Value.Trim()
                : (!string.IsNullOrWhiteSpace(journey.Project?.TargetMarket) ? journey.Project.TargetMarket.Trim() : string.Empty);

            var traits = brandKit?.Strategy?.PersonalityTraits ?? new List<string>();
            var tonePosition = brandKit?.Strategy?.TonePosition ?? string.Empty;

            var gtm = journey.Phase4Data?.GtmStrategy;

            // 1. Launch Customer Group: Priority is founder override > primary launch segment > brand audience
            string launchCustomerGroup = string.Empty;
            if (gtm != null)
            {
                if (gtm.FounderOverrides.TryGetValue("CustomCustomerGroup", out var customGroup) && !string.IsNullOrWhiteSpace(customGroup))
                {
                    launchCustomerGroup = customGroup.Trim();
                }
                else if (!string.IsNullOrWhiteSpace(gtm.PrimaryLaunchSegment))
                {
                    launchCustomerGroup = gtm.PrimaryLaunchSegment.Trim();
                }
            }

            var targetAudience = !string.IsNullOrWhiteSpace(launchCustomerGroup)
                ? launchCustomerGroup
                : brandAudience;

            // 2. Brand Positioning: Priority is BrandKit positioning > GTM strategic PrimaryPromise / Differentiator (distinct from outreach copy)
            var positioning = !string.IsNullOrWhiteSpace(brandPositioning)
                ? brandPositioning
                : (!string.IsNullOrWhiteSpace(gtm?.PositioningStrategy?.PrimaryPromise)
                    ? gtm.PositioningStrategy.PrimaryPromise.Trim()
                    : (!string.IsNullOrWhiteSpace(gtm?.PositioningStrategy?.Differentiator)
                        ? gtm.PositioningStrategy.Differentiator.Trim()
                        : string.Empty));

            var primaryColor = brandKit?.Colors?.Roles?.FirstOrDefault(r => string.Equals(r.RoleName, "Primary", StringComparison.OrdinalIgnoreCase))?.Hex ?? "#3B82F6";
            var secondaryColor = brandKit?.Colors?.Roles?.FirstOrDefault(r => string.Equals(r.RoleName, "Secondary", StringComparison.OrdinalIgnoreCase))?.Hex ?? "#10B981";
            var accentColor = brandKit?.Colors?.Roles?.FirstOrDefault(r => string.Equals(r.RoleName, "Accent", StringComparison.OrdinalIgnoreCase))?.Hex ?? "#F59E0B";
            var backgroundColor = brandKit?.Colors?.Roles?.FirstOrDefault(r => string.Equals(r.RoleName, "Background", StringComparison.OrdinalIgnoreCase))?.Hex ?? "#090A0C";
            var textColor = brandKit?.Colors?.Roles?.FirstOrDefault(r => string.Equals(r.RoleName, "Text", StringComparison.OrdinalIgnoreCase))?.Hex ?? "#F3F4F6";

            var displayFont = brandKit?.Typography?.Families?.DisplayFamily?.Name ?? "Inter";
            var textFont = brandKit?.Typography?.Families?.TextFamily?.Name ?? "DM Sans";
            var headingWeight = brandKit?.Typography?.Roles?.FirstOrDefault(r => string.Equals(r.RoleName, "Heading", StringComparison.OrdinalIgnoreCase))?.Weight ?? "700";
            var bodyWeight = brandKit?.Typography?.Roles?.FirstOrDefault(r => string.Equals(r.RoleName, "Body", StringComparison.OrdinalIgnoreCase))?.Weight ?? "400";

            string? primaryVar = null;
            string? horizVar = null;
            string? iconVar = null;
            if (brandKit?.Logo?.Variations != null)
            {
                if (brandKit.Logo.Variations.TryGetValue("primary", out var pv)) primaryVar = pv.SvgUri;
                if (brandKit.Logo.Variations.TryGetValue("horizontal", out var hv)) horizVar = hv.SvgUri;
                if (brandKit.Logo.Variations.TryGetValue("icon_only", out var iv)) iconVar = iv.SvgUri;
            }

            var selectedConcept = brandKit?.Logo?.Concepts?.FirstOrDefault(c => c.Key == brandKit.Logo.SelectedConceptKey) ?? brandKit?.Logo?.Concepts?.FirstOrDefault();
            var logoMarkUri = !string.IsNullOrWhiteSpace(iconVar) ? iconVar : (selectedConcept?.MarkAssetUri ?? string.Empty);
            var logoLockupUri = !string.IsNullOrWhiteSpace(primaryVar) ? primaryVar : (!string.IsNullOrWhiteSpace(horizVar) ? horizVar : (selectedConcept?.LockupAssetUri ?? string.Empty));
            var logoDescriptor = selectedConcept?.DescriptorLine ?? string.Empty;

            var pricing = journey.Phase4Data?.PricingStrategy;
            var pricingExclusion = ResolvePricingExclusion(pricing, ideaId);

            var brandStudioSummary = new LaunchBrandStudioSummary
            {
                BrandName = brandName,
                Concept = concept,
                TargetAudience = targetAudience,
                Industry = industry,
                Positioning = positioning,
                PersonalityTraits = traits,
                TonePosition = tonePosition,
                LogoMarkUri = logoMarkUri,
                LogoLockupUri = logoLockupUri,
                LogoDescriptorLine = logoDescriptor,
                PrimaryColorHex = primaryColor,
                SecondaryColorHex = secondaryColor,
                AccentColorHex = accentColor,
                BackgroundColorHex = backgroundColor,
                TextColorHex = textColor,
                DisplayFontFamily = displayFont,
                TextFontFamily = textFont,
                HeadingWeight = headingWeight,
                BodyWeight = bodyWeight
            };

            // Synthesize contextual headline & descriptions based on actual Project and Brand Studio information
            var projectProblem = !string.IsNullOrWhiteSpace(journey.Project?.Problem) ? journey.Project.Problem.Trim() : string.Empty;
            var projectSolution = !string.IsNullOrWhiteSpace(journey.Project?.Solution) ? journey.Project.Solution.Trim() : string.Empty;

            var headline = !string.IsNullOrWhiteSpace(positioning)
                ? positioning
                : (!string.IsNullOrWhiteSpace(concept)
                    ? concept
                    : (!string.IsNullOrWhiteSpace(journey.Project?.Tagline)
                        ? journey.Project.Tagline.Trim()
                        : $"A clearer way to organize your {(!string.IsNullOrWhiteSpace(industry) ? industry.ToLowerInvariant() : "key")} workflows."));

            var heroDescription = !string.IsNullOrWhiteSpace(concept) && !string.IsNullOrWhiteSpace(targetAudience)
                ? $"{brandName} is being built for {targetAudience.TrimEnd('.')}. {concept}"
                : (!string.IsNullOrWhiteSpace(concept)
                    ? $"{brandName} is being built to provide {concept.TrimEnd('.')}."
                    : (!string.IsNullOrWhiteSpace(targetAudience)
                        ? $"{brandName} is being built to help {targetAudience.ToLowerInvariant().TrimEnd('.')} streamline operations and keep next steps in focus."
                        : $"{brandName} is being built to help teams organize workflows and maintain clear operational momentum."));

            var problemStatement = !string.IsNullOrWhiteSpace(projectProblem)
                ? (!string.IsNullOrWhiteSpace(targetAudience) && !projectProblem.Contains(targetAudience, StringComparison.OrdinalIgnoreCase)
                    ? $"For {targetAudience.ToLowerInvariant().TrimEnd('.')}, {projectProblem.TrimEnd('.')}"
                    : projectProblem)
                : (!string.IsNullOrWhiteSpace(targetAudience)
                    ? $"When critical workflows and client interactions are fragmented, {targetAudience.ToLowerInvariant().TrimEnd('.')} lose operational clarity and valuable momentum."
                    : "When key workflows and customer communication are fragmented, it can be harder to see what needs immediate attention.");

            var momentumStatement = !string.IsNullOrWhiteSpace(positioning)
                ? $"{brandName} delivers {positioning.ToLowerInvariant().TrimEnd('.')}, keeping every key milestone in clear focus."
                : (!string.IsNullOrWhiteSpace(projectSolution)
                    ? $"{brandName} focuses on {projectSolution.ToLowerInvariant().TrimEnd('.')}."
                    : $"{brandName} focuses squarely on maintaining operational momentum and clarity for modern teams.");

            List<LaunchSolutionCard> plannedSolutions;
            if (!string.IsNullOrWhiteSpace(projectSolution))
            {
                plannedSolutions = new List<LaunchSolutionCard>
                {
                    new() { Title = "Unified Workflow", Description = projectSolution, Icon = "layers" },
                    new() { Title = "Clear Visibility", Description = "A single place to track status, priorities, and next steps.", Icon = "file-text" },
                    new() { Title = "Timely Follow-through", Description = "Proactive reminders ensure nothing slips through the cracks.", Icon = "bell" }
                };
            }
            else
            {
                plannedSolutions = new List<LaunchSolutionCard>
                {
                    new() { Title = "Unified Intake", Description = "A clearer place to organise incoming customer requests and requirements.", Icon = "inbox" },
                    new() { Title = "Milestones in View", Description = "A way to keep track of proposals, commitments, and their next steps.", Icon = "file-text" },
                    new() { Title = "Follow-ups to Remember", Description = "A way to see which conversations and tasks need attention.", Icon = "bell" }
                };
            }

            var newAssets = new LaunchAssetsPlan
            {
                AssetType = "ONE-PAGE WEBSITE",
                Version = 1,
                Status = "Draft",
                ReleaseTag = "v1.0-rc",
                PublishedStatus = "Available to view in MBC. Not published.",
                LastGeneratedAt = DateTime.UtcNow,
                ActiveSectionKey = "hero",
                BrandStudio = brandStudioSummary,

                // Section A: Hero
                BrandName = brandName,
                ConceptBadge = "PREVIEWING CONCEPT",
                Headline = headline,
                Description = heroDescription,
                ButtonLabel = "Express interest",
                ButtonDestinationType = "NotSet",
                ButtonDestinationValue = string.Empty,
                ButtonDestinationConfigured = false,
                HeroHelpText = "Help shape the project by sharing how you work today.",

                PlannedWorkflowTitle = "PLANNED WORKFLOW",
                PlannedWorkflowSubtitle = "High-level interface structure",
                WorkflowSteps = new List<LaunchWorkflowStep>
                {
                    new()
                    {
                        StepNumber = 1,
                        Title = "1. Intake",
                        Description = "Capture requirements and client context in a dedicated workspace.",
                        Tag = "Unified intake"
                    },
                    new()
                    {
                        StepNumber = 2,
                        Title = "2. Structure",
                        Description = "Draft estimates and milestone plans with full continuity.",
                        Tag = "Context continuity"
                    },
                    new()
                    {
                        StepNumber = 3,
                        Title = "3. Follow-through",
                        Description = "Clear stage prompts so no client or task is delayed.",
                        Tag = "Next step clarity"
                    }
                },

                // Section B: Problem
                ProblemEyebrow = "KEEP TRACK OF THE NEXT STEP",
                ProblemStatement = problemStatement,
                OperationalMomentumStatement = momentumStatement,

                // Section C: Planned Solution
                SolutionHeader = "What’s being planned",
                SolutionSubheader = "Straightforward tools designed strictly around routine project administration.",
                PlannedSolutions = plannedSolutions,

                // Section D: How It Works
                HowItWorksHeader = "A simpler flow for your work",
                HowItWorksSubheader = "This describes the planned workflow.",
                WorkflowDetails = new List<LaunchWorkflowDetailedItem>
                {
                    new()
                    {
                        StepNumber = 1,
                        Title = "Capture the initial context",
                        Description = "Collect briefs, deadlines, and key requirements without sorting through scattered inbox threads."
                    },
                    new()
                    {
                        StepNumber = 2,
                        Title = "Structure and track the next step",
                        Description = "Generate clean, professional estimates and milestone schedules linked directly to original requests."
                    },
                    new()
                    {
                        StepNumber = 3,
                        Title = "Follow up with complete confidence",
                        Description = "Receive clear notifications when responses are due, making timely follow-through second nature."
                    }
                },

                // Section E: FAQ
                FaqHeader = "Frequently Asked Questions",
                FaqSubheader = "Honest answers about development status and availability.",
                Faqs = new List<LaunchFaqItem>
                {
                    new()
                    {
                        Question = $"Can I use {brandName} today?",
                        Answer = "The product is currently in preparation."
                    },
                    new()
                    {
                        Question = "Who is it being designed for?",
                        Answer = !string.IsNullOrWhiteSpace(targetAudience) ? targetAudience : "Teams and independent businesses looking for streamlined project operations."
                    },
                    new()
                    {
                        Question = "When will it launch?",
                        Answer = "A launch date has not been confirmed."
                    }
                },

                // Section F: Final CTA
                FinalCtaHeader = "Share how you work today",
                FinalCtaSubheader = !string.IsNullOrWhiteSpace(targetAudience)
                    ? $"Your experience as {targetAudience.ToLowerInvariant().TrimEnd('.')} can directly shape what {brandName} focuses on."
                    : $"Your experience can help shape what {brandName} focuses on.",

                // Section G: Footer
                FooterNotice = "Project in preparation",

                // Sections List
                Sections = new List<LaunchAssetSection>
                {
                    new() { Key = "hero", Title = "Hero", StatusBadge = "Included · Required", IsIncluded = true, IsRequired = true },
                    new() { Key = "problem", Title = "Problem", StatusBadge = "Included", IsIncluded = true, IsRequired = false },
                    new() { Key = "solution", Title = "Planned solution", StatusBadge = "Included", IsIncluded = true, IsRequired = false },
                    new() { Key = "how-it-works", Title = "How it works", StatusBadge = "Included", IsIncluded = true, IsRequired = false },
                    new() { Key = "faq", Title = "FAQ", StatusBadge = "Included", IsIncluded = true, IsRequired = false },
                    new() { Key = "final-cta", Title = "Final call to action", StatusBadge = "Included", IsIncluded = true, IsRequired = false },
                    new() { Key = "footer", Title = "Footer", StatusBadge = "Included · Required", IsIncluded = true, IsRequired = true }
                },

                PricingExclusion = pricingExclusion,

                ProofExclusion = new LaunchProofExclusion
                {
                    Excluded = true,
                    ProofNeeded = true,
                    Reason = "No supporting evidence has been added, so this section is not included.",
                    ActionLabel = "Review proof →",
                    ActionRoute = $"/dashboard/creator/phase-3/evidence{(string.IsNullOrWhiteSpace(ideaId) ? "" : $"?ideaId={ideaId}")}"
                },

                SourceVersions = new Phase4SourceVersions(),
                SelectedVersion = 1,
                VersionHistory = new List<LaunchAssetsPlanSnapshot>()
            };

            newAssets.VersionHistory.Add(CreateSnapshot(newAssets));

            var updatedJourney = await _journeys.SetPhase4LaunchAssetsAsync(userId, newAssets, ideaId);

            return new LaunchAssetsResponse
            {
                IdeaId = ideaId ?? string.Empty,
                IdeaVersion = updatedJourney?.IdeaVersion ?? journey.IdeaVersion,
                Assets = newAssets,
                UpdateAvailable = false,
                ChangedSources = new List<string>()
            };
        }

        private static LaunchPricingExclusion ResolvePricingExclusion(PricingStrategy? pricing, string? ideaId)
        {
            var pricingRoute = $"/dashboard/creator/phase-4/pricing{(string.IsNullOrWhiteSpace(ideaId) ? "" : $"?ideaId={ideaId}")}";

            if (pricing == null || pricing.Offers == null || pricing.Offers.Count == 0)
            {
                return new LaunchPricingExclusion
                {
                    Excluded = true,
                    ChosenPrice = null,
                    PriceStatus = "Unconfirmed",
                    Reason = "Pricing has not been confirmed for this project yet. Review and confirm offer details before adding pricing to the website.",
                    ActionLabel = "Set pricing details →",
                    ActionRoute = pricingRoute
                };
            }

            // 1. Authoritative founder selection takes absolute precedence over system recommendations
            var founderCustomizedOffers = pricing.Offers.Where(o => o.FounderEdited || o.FounderPrice.HasValue).ToList();
            PricingOffer? selectedOffer = null;
            bool isFounderConfirmed = false;

            if (founderCustomizedOffers.Count == 1)
            {
                selectedOffer = founderCustomizedOffers[0];
                isFounderConfirmed = true;
            }
            else if (founderCustomizedOffers.Count > 1)
            {
                // Multiple candidates exist without a single authoritative founder selection: expose needs-review state
                return new LaunchPricingExclusion
                {
                    Excluded = true,
                    ChosenPrice = null,
                    PriceStatus = "Unconfirmed",
                    Reason = "Multiple offers have been customized. Confirm a single primary offer before adding pricing to the website.",
                    ActionLabel = "Review pricing details →",
                    ActionRoute = pricingRoute
                };
            }
            else
            {
                // 2. Fallback to system recommendation when no founder customization exists
                if (pricing.LaunchRecommendation?.RecommendedOffers != null && pricing.LaunchRecommendation.RecommendedOffers.Count > 0)
                {
                    var targetKey = pricing.LaunchRecommendation.RecommendedOffers.FirstOrDefault();
                    if (!string.IsNullOrWhiteSpace(targetKey))
                    {
                        selectedOffer = pricing.Offers.FirstOrDefault(o => o.Id == targetKey || o.Key == targetKey || string.Equals(o.Name, targetKey, StringComparison.OrdinalIgnoreCase));
                    }
                }

                // If multiple candidate offers exist without an authoritative selection or recommendation, expose needs-review state
                if (selectedOffer == null && pricing.Offers.Count > 1)
                {
                    return new LaunchPricingExclusion
                    {
                        Excluded = true,
                        ChosenPrice = null,
                        PriceStatus = "Unconfirmed",
                        Reason = "Multiple candidate offers exist. Review and confirm your primary offer before adding pricing to the website.",
                        ActionLabel = "Review pricing details →",
                        ActionRoute = pricingRoute
                    };
                }

                selectedOffer ??= pricing.Offers.FirstOrDefault();
                isFounderConfirmed = false; // Fallback recommendation is distinguishable from confirmed founder choice
            }

            if (selectedOffer == null)
            {
                return new LaunchPricingExclusion
                {
                    Excluded = true,
                    ChosenPrice = null,
                    PriceStatus = "Unconfirmed",
                    Reason = "Pricing has not been confirmed for this project yet. Review and confirm offer details before adding pricing to the website.",
                    ActionLabel = "Set pricing details →",
                    ActionRoute = pricingRoute
                };
            }

            var period = selectedOffer.BillingFrequency.ToString().ToLowerInvariant();
            var unit = !string.IsNullOrWhiteSpace(selectedOffer.Name) ? selectedOffer.Name.ToLowerInvariant() : "customer";
            var currency = selectedOffer.Currency == "USD" ? "$" : (selectedOffer.Currency == "GBP" ? "£" : "€");

            if (!isFounderConfirmed)
            {
                // Fallback recommendation: Expose unconfirmed needs-review state, keeping recommendation distinguishable
                return new LaunchPricingExclusion
                {
                    Excluded = true,
                    ChosenPrice = null,
                    PriceStatus = "Unconfirmed",
                    SelectedOfferId = selectedOffer.Id,
                    SelectedOfferName = selectedOffer.Name,
                    BillingPeriod = period,
                    Unit = unit,
                    Currency = currency,
                    Reason = $"Recommended offer '{selectedOffer.Name}' has not been confirmed by the founder yet. Review and confirm offer details before adding pricing to the website.",
                    ActionLabel = "Review pricing details →",
                    ActionRoute = pricingRoute
                };
            }

            // Evaluate price status for confirmed founder choice
            decimal? effectivePrice = selectedOffer.FounderPrice ?? (selectedOffer.Price >= 0 ? selectedOffer.Price : (decimal?)null);

            bool isExplicitZero = (selectedOffer.FounderPrice.HasValue && selectedOffer.FounderPrice.Value == 0)
                               || (selectedOffer.PricingModel == RevenueModelType.Freemium)
                               || (selectedOffer.FounderEdited && selectedOffer.Price == 0);

            if (effectivePrice.HasValue && effectivePrice.Value < 0)
            {
                return new LaunchPricingExclusion
                {
                    Excluded = true,
                    ChosenPrice = effectivePrice.Value,
                    PriceStatus = "InvalidNegative",
                    SelectedOfferId = selectedOffer.Id,
                    SelectedOfferName = selectedOffer.Name,
                    BillingPeriod = period,
                    Unit = unit,
                    Currency = currency,
                    Reason = "The configured price is invalid (cannot be negative). Please review and correct the offer pricing.",
                    ActionLabel = "Fix pricing details →",
                    ActionRoute = pricingRoute
                };
            }

            if (isExplicitZero || (effectivePrice.HasValue && effectivePrice.Value == 0))
            {
                return new LaunchPricingExclusion
                {
                    Excluded = true,
                    ChosenPrice = 0m,
                    PriceStatus = "ConfirmedZero",
                    SelectedOfferId = selectedOffer.Id,
                    SelectedOfferName = selectedOffer.Name,
                    BillingPeriod = period,
                    Unit = unit,
                    Currency = currency,
                    Reason = $"Your chosen plan ({selectedOffer.Name}) is explicitly free. Review and confirm offer details before adding pricing to the website.",
                    ActionLabel = "Review pricing details →",
                    ActionRoute = pricingRoute
                };
            }

            if (effectivePrice.HasValue && effectivePrice.Value > 0)
            {
                return new LaunchPricingExclusion
                {
                    Excluded = true,
                    ChosenPrice = effectivePrice.Value,
                    PriceStatus = "ConfirmedPositive",
                    SelectedOfferId = selectedOffer.Id,
                    SelectedOfferName = selectedOffer.Name,
                    BillingPeriod = period,
                    Unit = unit,
                    Currency = currency,
                    Reason = $"Your chosen price is {currency}{effectivePrice.Value:0.##} per {unit} / {period}. Confirm the offer details before adding pricing to the website.",
                    ActionLabel = "Review pricing details →",
                    ActionRoute = pricingRoute
                };
            }

            return new LaunchPricingExclusion
            {
                Excluded = true,
                ChosenPrice = null,
                PriceStatus = "Unconfirmed",
                SelectedOfferId = selectedOffer.Id,
                SelectedOfferName = selectedOffer.Name,
                BillingPeriod = period,
                Unit = unit,
                Currency = currency,
                Reason = "Pricing has not been confirmed for this project yet. Review and confirm offer details before adding pricing to the website.",
                ActionLabel = "Set pricing details →",
                ActionRoute = pricingRoute
            };
        }

        private static LaunchAssetsPlanSnapshot CreateSnapshot(LaunchAssetsPlan plan)
        {
            return new LaunchAssetsPlanSnapshot
            {
                Version = plan.Version,
                ReleaseTag = plan.ReleaseTag,
                Status = plan.Status,
                SavedAt = DateTime.UtcNow,
                Headline = plan.Headline,
                Description = plan.Description,
                ButtonLabel = plan.ButtonLabel,
                ButtonDestinationType = plan.ButtonDestinationType,
                ButtonDestinationValue = plan.ButtonDestinationValue,
                ProblemEyebrow = plan.ProblemEyebrow,
                ProblemStatement = plan.ProblemStatement,
                OperationalMomentumStatement = plan.OperationalMomentumStatement,
                SolutionHeader = plan.SolutionHeader,
                SolutionSubheader = plan.SolutionSubheader,
                PlannedSolutions = plan.PlannedSolutions.Select(s => new LaunchSolutionCard
                {
                    Title = s.Title,
                    Description = s.Description,
                    Icon = s.Icon
                }).ToList(),
                HowItWorksHeader = plan.HowItWorksHeader,
                HowItWorksSubheader = plan.HowItWorksSubheader,
                WorkflowDetails = plan.WorkflowDetails.Select(w => new LaunchWorkflowDetailedItem
                {
                    StepNumber = w.StepNumber,
                    Title = w.Title,
                    Description = w.Description
                }).ToList(),
                FaqHeader = plan.FaqHeader,
                FaqSubheader = plan.FaqSubheader,
                Faqs = plan.Faqs.Select(f => new LaunchFaqItem
                {
                    Question = f.Question,
                    Answer = f.Answer
                }).ToList(),
                FinalCtaHeader = plan.FinalCtaHeader,
                FinalCtaSubheader = plan.FinalCtaSubheader,
                BrandName = plan.BrandName,
                FooterNotice = plan.FooterNotice,
                Sections = plan.Sections.Select(s => new LaunchAssetSection
                {
                    Key = s.Key,
                    Title = s.Title,
                    StatusBadge = s.StatusBadge,
                    IsIncluded = s.IsIncluded,
                    IsRequired = s.IsRequired,
                    Headline = s.Headline,
                    Description = s.Description,
                    ButtonLabel = s.ButtonLabel,
                    ButtonDestinationType = s.ButtonDestinationType,
                    ButtonDestinationValue = s.ButtonDestinationValue,
                    ExclusionReason = s.ExclusionReason,
                    ActionLabel = s.ActionLabel,
                    ActionRoute = s.ActionRoute
                }).ToList()
            };
        }

        private static void EnrichBrandStudioFromKit(LaunchAssetsPlan assets, BrandKit kit)
        {
            var brandName = !string.IsNullOrWhiteSpace(kit.Strategy?.BusinessName)
                ? kit.Strategy.BusinessName.Trim()
                : assets.BrandName;

            var concept = kit.Strategy?.Concept?.Value?.Trim() ?? string.Empty;
            var targetAudience = kit.Strategy?.TargetAudience?.Value?.Trim() ?? string.Empty;
            var positioning = kit.Strategy?.Positioning?.Value?.Trim() ?? string.Empty;
            var industry = kit.Strategy?.Industry?.Value?.Trim() ?? string.Empty;
            var traits = kit.Strategy?.PersonalityTraits ?? new List<string>();
            var tonePosition = kit.Strategy?.TonePosition ?? string.Empty;

            var primaryColor = kit.Colors?.Roles?.FirstOrDefault(r => string.Equals(r.RoleName, "Primary", StringComparison.OrdinalIgnoreCase))?.Hex ?? "#3B82F6";
            var secondaryColor = kit.Colors?.Roles?.FirstOrDefault(r => string.Equals(r.RoleName, "Secondary", StringComparison.OrdinalIgnoreCase))?.Hex ?? "#10B981";
            var accentColor = kit.Colors?.Roles?.FirstOrDefault(r => string.Equals(r.RoleName, "Accent", StringComparison.OrdinalIgnoreCase))?.Hex ?? "#F59E0B";
            var backgroundColor = kit.Colors?.Roles?.FirstOrDefault(r => string.Equals(r.RoleName, "Background", StringComparison.OrdinalIgnoreCase))?.Hex ?? "#090A0C";
            var textColor = kit.Colors?.Roles?.FirstOrDefault(r => string.Equals(r.RoleName, "Text", StringComparison.OrdinalIgnoreCase))?.Hex ?? "#F3F4F6";

            var displayFont = kit.Typography?.Families?.DisplayFamily?.Name ?? "Inter";
            var textFont = kit.Typography?.Families?.TextFamily?.Name ?? "DM Sans";
            var headingWeight = kit.Typography?.Roles?.FirstOrDefault(r => string.Equals(r.RoleName, "Heading", StringComparison.OrdinalIgnoreCase))?.Weight ?? "700";
            var bodyWeight = kit.Typography?.Roles?.FirstOrDefault(r => string.Equals(r.RoleName, "Body", StringComparison.OrdinalIgnoreCase))?.Weight ?? "400";

            string? primaryVar = null;
            string? horizVar = null;
            string? iconVar = null;
            if (kit.Logo?.Variations != null)
            {
                if (kit.Logo.Variations.TryGetValue("primary", out var pv)) primaryVar = pv.SvgUri;
                if (kit.Logo.Variations.TryGetValue("horizontal", out var hv)) horizVar = hv.SvgUri;
                if (kit.Logo.Variations.TryGetValue("icon_only", out var iv)) iconVar = iv.SvgUri;
            }

            var selectedConcept = kit.Logo?.Concepts?.FirstOrDefault(c => c.Key == kit.Logo.SelectedConceptKey) ?? kit.Logo?.Concepts?.FirstOrDefault();
            var logoMarkUri = !string.IsNullOrWhiteSpace(iconVar) ? iconVar : (selectedConcept?.MarkAssetUri ?? string.Empty);
            var logoLockupUri = !string.IsNullOrWhiteSpace(primaryVar) ? primaryVar : (!string.IsNullOrWhiteSpace(horizVar) ? horizVar : (selectedConcept?.LockupAssetUri ?? string.Empty));
            var logoDescriptor = selectedConcept?.DescriptorLine ?? string.Empty;

            assets.BrandStudio = new LaunchBrandStudioSummary
            {
                BrandName = brandName,
                Concept = concept,
                TargetAudience = targetAudience,
                Industry = industry,
                Positioning = positioning,
                PersonalityTraits = traits,
                TonePosition = tonePosition,
                LogoMarkUri = logoMarkUri,
                LogoLockupUri = logoLockupUri,
                LogoDescriptorLine = logoDescriptor,
                PrimaryColorHex = primaryColor,
                SecondaryColorHex = secondaryColor,
                AccentColorHex = accentColor,
                BackgroundColorHex = backgroundColor,
                TextColorHex = textColor,
                DisplayFontFamily = displayFont,
                TextFontFamily = textFont,
                HeadingWeight = headingWeight,
                BodyWeight = bodyWeight
            };
        }

        public async Task<LaunchAssetsResponse> RefreshLaunchAssetsAsync(string userId, string? ideaId = null)
        {
            return await GenerateLaunchAssetsAsync(userId, ideaId);
        }

        public async Task<LaunchAssetsResponse> UpdateLaunchAssetsAsync(string userId, UpdateLaunchAssetsRequest request)
        {
            var journey = await _journeys.GetOrCreateComposedAsync(userId, request.IdeaId);
            var existing = journey.Phase4Data?.LaunchAssets ?? new LaunchAssetsPlan();

            if (!string.IsNullOrWhiteSpace(request.ActiveSectionKey)) existing.ActiveSectionKey = request.ActiveSectionKey;

            // Section A: Hero
            if (request.Headline != null) existing.Headline = request.Headline;
            if (request.Description != null) existing.Description = request.Description;
            if (request.ButtonLabel != null) existing.ButtonLabel = request.ButtonLabel;
            if (!string.IsNullOrWhiteSpace(request.ButtonDestinationType))
            {
                existing.ButtonDestinationType = request.ButtonDestinationType;
                existing.ButtonDestinationConfigured = request.ButtonDestinationType != "NotSet" && !string.IsNullOrWhiteSpace(request.ButtonDestinationValue ?? existing.ButtonDestinationValue);
            }
            if (request.ButtonDestinationValue != null)
            {
                existing.ButtonDestinationValue = request.ButtonDestinationValue;
                existing.ButtonDestinationConfigured = existing.ButtonDestinationType != "NotSet" && !string.IsNullOrWhiteSpace(request.ButtonDestinationValue);
            }

            // Section B: Problem
            if (request.ProblemEyebrow != null) existing.ProblemEyebrow = request.ProblemEyebrow;
            if (request.ProblemStatement != null) existing.ProblemStatement = request.ProblemStatement;
            if (request.OperationalMomentumStatement != null) existing.OperationalMomentumStatement = request.OperationalMomentumStatement;

            // Section C: Planned Solution
            if (request.SolutionHeader != null) existing.SolutionHeader = request.SolutionHeader;
            if (request.SolutionSubheader != null) existing.SolutionSubheader = request.SolutionSubheader;
            if (request.PlannedSolutions != null && request.PlannedSolutions.Count > 0) existing.PlannedSolutions = request.PlannedSolutions;

            // Section D: How It Works
            if (request.HowItWorksHeader != null) existing.HowItWorksHeader = request.HowItWorksHeader;
            if (request.HowItWorksSubheader != null) existing.HowItWorksSubheader = request.HowItWorksSubheader;
            if (request.WorkflowDetails != null && request.WorkflowDetails.Count > 0) existing.WorkflowDetails = request.WorkflowDetails;

            // Section E: FAQ
            if (request.FaqHeader != null) existing.FaqHeader = request.FaqHeader;
            if (request.FaqSubheader != null) existing.FaqSubheader = request.FaqSubheader;
            if (request.Faqs != null && request.Faqs.Count > 0) existing.Faqs = request.Faqs;

            // Section F: Final CTA
            if (request.FinalCtaHeader != null) existing.FinalCtaHeader = request.FinalCtaHeader;
            if (request.FinalCtaSubheader != null) existing.FinalCtaSubheader = request.FinalCtaSubheader;

            // Section G: Footer
            if (request.BrandName != null) existing.BrandName = request.BrandName;
            if (request.FooterNotice != null) existing.FooterNotice = request.FooterNotice;

            // Sections list (including/excluding sections)
            if (request.Sections != null && request.Sections.Count > 0)
            {
                existing.Sections = request.Sections;
                var pricingSec = existing.Sections.FirstOrDefault(s => s.Key == "pricing");
                if (pricingSec != null && existing.PricingExclusion != null)
                {
                    existing.PricingExclusion.Excluded = !pricingSec.IsIncluded;
                }
            }

            existing.LastGeneratedAt = DateTime.UtcNow;

            // Upsert snapshot into VersionHistory
            existing.VersionHistory ??= new List<LaunchAssetsPlanSnapshot>();
            var existingSnapshotIdx = existing.VersionHistory.FindIndex(s => s.Version == existing.Version);
            var snapshot = CreateSnapshot(existing);
            if (existingSnapshotIdx >= 0)
            {
                existing.VersionHistory[existingSnapshotIdx] = snapshot;
            }
            else
            {
                existing.VersionHistory.Add(snapshot);
            }

            var updatedJourney = await _journeys.SetPhase4LaunchAssetsAsync(userId, existing, request.IdeaId);

            return new LaunchAssetsResponse
            {
                IdeaId = request.IdeaId ?? string.Empty,
                IdeaVersion = updatedJourney.IdeaVersion,
                Assets = existing,
                UpdateAvailable = false,
                ChangedSources = new List<string>()
            };
        }

        public async Task<LaunchAssetsResponse> CreateNewVersionAsync(string userId, string? ideaId = null)
        {
            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var existing = journey.Phase4Data?.LaunchAssets ?? new LaunchAssetsPlan();

            // Ensure current working version has its snapshot recorded in VersionHistory
            existing.VersionHistory ??= new List<LaunchAssetsPlanSnapshot>();
            var currentSnapshotIdx = existing.VersionHistory.FindIndex(s => s.Version == existing.Version);
            var currentSnapshot = CreateSnapshot(existing);
            if (currentSnapshotIdx >= 0)
            {
                existing.VersionHistory[currentSnapshotIdx] = currentSnapshot;
            }
            else
            {
                existing.VersionHistory.Add(currentSnapshot);
            }

            // Increment version for new working draft
            existing.Version += 1;
            existing.ReleaseTag = $"v1.{existing.Version}-rc";
            existing.Status = (existing.Version == existing.SelectedVersion) ? "Selected" : "Draft";
            existing.LastGeneratedAt = DateTime.UtcNow;

            // Snapshot new draft
            existing.VersionHistory.Add(CreateSnapshot(existing));

            var updatedJourney = await _journeys.SetPhase4LaunchAssetsAsync(userId, existing, ideaId);

            return new LaunchAssetsResponse
            {
                IdeaId = ideaId ?? string.Empty,
                IdeaVersion = updatedJourney.IdeaVersion,
                Assets = existing,
                UpdateAvailable = false,
                ChangedSources = new List<string>()
            };
        }

        public async Task<LaunchAssetsResponse> SelectVersionAsync(string userId, string? ideaId = null, int? versionNumber = null)
        {
            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var existing = journey.Phase4Data?.LaunchAssets;
            if (existing == null)
            {
                throw new InvalidOperationException("Launch assets have not been generated yet.");
            }

            existing.VersionHistory ??= new List<LaunchAssetsPlanSnapshot>();

            int targetVersion = (versionNumber.HasValue && versionNumber.Value > 0) ? versionNumber.Value : existing.Version;
            existing.SelectedVersion = targetVersion;
            existing.Status = (existing.Version == targetVersion) ? "Selected" : "Draft";
            existing.LastGeneratedAt = DateTime.UtcNow;

            // Update all snapshots in VersionHistory to reflect the selected version
            foreach (var s in existing.VersionHistory)
            {
                s.Status = (s.Version == targetVersion) ? "Selected" : "Draft";
            }

            var updatedJourney = await _journeys.SetPhase4LaunchAssetsAsync(userId, existing, ideaId);

            return new LaunchAssetsResponse
            {
                IdeaId = ideaId ?? string.Empty,
                IdeaVersion = updatedJourney.IdeaVersion,
                Assets = existing,
                UpdateAvailable = false,
                ChangedSources = new List<string>()
            };
        }

        public async Task<string> GetSourceCodeBundleAsync(string userId, string? ideaId = null, int? versionNumber = null)
        {
            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var assets = journey.Phase4Data?.LaunchAssets;
            if (assets == null)
            {
                throw new InvalidOperationException("Launch assets have not been generated yet.");
            }

            // If a specific version was requested and exists in VersionHistory, use that snapshot's content
            LaunchAssetsPlanSnapshot? targetSnapshot = null;
            if (versionNumber.HasValue && assets.VersionHistory != null)
            {
                targetSnapshot = assets.VersionHistory.FirstOrDefault(s => s.Version == versionNumber.Value);
            }

            var brandStudio = assets.BrandStudio ?? new LaunchBrandStudioSummary();
            var primaryColor = !string.IsNullOrWhiteSpace(brandStudio.PrimaryColorHex) ? brandStudio.PrimaryColorHex : "#3B82F6";
            var secondaryColor = !string.IsNullOrWhiteSpace(brandStudio.SecondaryColorHex) ? brandStudio.SecondaryColorHex : "#10B981";
            var accentColor = !string.IsNullOrWhiteSpace(brandStudio.AccentColorHex) ? brandStudio.AccentColorHex : "#F59E0B";
            var bgColor = !string.IsNullOrWhiteSpace(brandStudio.BackgroundColorHex) ? brandStudio.BackgroundColorHex : "#090A0C";
            var textColor = !string.IsNullOrWhiteSpace(brandStudio.TextColorHex) ? brandStudio.TextColorHex : "#F3F4F6";
            var displayFont = !string.IsNullOrWhiteSpace(brandStudio.DisplayFontFamily) ? brandStudio.DisplayFontFamily : "Inter";
            var textFont = !string.IsNullOrWhiteSpace(brandStudio.TextFontFamily) ? brandStudio.TextFontFamily : "DM Sans";
            var logoUri = !string.IsNullOrWhiteSpace(brandStudio.LogoLockupUri) ? brandStudio.LogoLockupUri : brandStudio.LogoMarkUri;

            var brandName = WebUtility.HtmlEncode(targetSnapshot?.BrandName ?? assets.BrandName);
            var conceptBadge = WebUtility.HtmlEncode(assets.ConceptBadge);
            var headline = WebUtility.HtmlEncode(targetSnapshot?.Headline ?? assets.Headline);
            var description = WebUtility.HtmlEncode(targetSnapshot?.Description ?? assets.Description);
            var buttonLabel = WebUtility.HtmlEncode(targetSnapshot?.ButtonLabel ?? assets.ButtonLabel);
            var heroHelpText = WebUtility.HtmlEncode(assets.HeroHelpText);
            var footerNotice = WebUtility.HtmlEncode(targetSnapshot?.FooterNotice ?? assets.FooterNotice);

            var buttonDestValue = targetSnapshot?.ButtonDestinationValue ?? assets.ButtonDestinationValue;
            var buttonDestType = targetSnapshot?.ButtonDestinationType ?? assets.ButtonDestinationType;

            // Button URL construction & sanitization
            string destinationHref = "#";
            string onclickAttr = "";
            if (!string.IsNullOrWhiteSpace(buttonDestValue))
            {
                if (string.Equals(buttonDestType, "Email", StringComparison.OrdinalIgnoreCase))
                {
                    destinationHref = "mailto:" + WebUtility.HtmlEncode(buttonDestValue.Trim());
                }
                else
                {
                    var link = buttonDestValue.Trim();
                    if (!link.StartsWith("http://", StringComparison.OrdinalIgnoreCase) && !link.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                    {
                        link = "https://" + link;
                    }
                    destinationHref = WebUtility.HtmlEncode(link);
                }
            }
            else
            {
                onclickAttr = @" onclick=""return false;""";
            }

            var sections = targetSnapshot?.Sections ?? assets.Sections;
            bool includeProblem = sections?.FirstOrDefault(s => s.Key == "problem")?.IsIncluded ?? true;
            bool includeSolution = sections?.FirstOrDefault(s => s.Key == "solution")?.IsIncluded ?? true;
            bool includeHowItWorks = sections?.FirstOrDefault(s => s.Key == "how-it-works")?.IsIncluded ?? true;
            bool includeFaq = sections?.FirstOrDefault(s => s.Key == "faq")?.IsIncluded ?? true;
            bool includeFinalCta = sections?.FirstOrDefault(s => s.Key == "final-cta")?.IsIncluded ?? true;
            // Pricing section inclusion: Sections["pricing"].IsIncluded is canonical when present.
            // Consult legacy PricingExclusion.Excluded only when pricing section is absent from Sections list.
            var pricingSection = sections?.FirstOrDefault(s => s.Key == "pricing");
            bool pricingSectionExplicitlyIncluded = pricingSection != null
                ? pricingSection.IsIncluded
                : assets.PricingExclusion?.Excluded == false;

            bool pricingValidAndConfirmed = assets.PricingExclusion != null
                && (assets.PricingExclusion.PriceStatus == "ConfirmedPositive" || assets.PricingExclusion.PriceStatus == "ConfirmedZero")
                && assets.PricingExclusion.ChosenPrice.HasValue
                && assets.PricingExclusion.ChosenPrice.Value >= 0;

            bool includePricing = pricingSectionExplicitlyIncluded && pricingValidAndConfirmed;

            var plannedSolutions = targetSnapshot?.PlannedSolutions ?? assets.PlannedSolutions;
            var workflowDetails = targetSnapshot?.WorkflowDetails ?? assets.WorkflowDetails;
            var faqs = targetSnapshot?.Faqs ?? assets.Faqs;
            var problemEyebrow = targetSnapshot?.ProblemEyebrow ?? assets.ProblemEyebrow;
            var problemStatement = targetSnapshot?.ProblemStatement ?? assets.ProblemStatement;
            var momentumStatement = targetSnapshot?.OperationalMomentumStatement ?? assets.OperationalMomentumStatement;
            var solutionHeader = targetSnapshot?.SolutionHeader ?? assets.SolutionHeader;
            var solutionSubheader = targetSnapshot?.SolutionSubheader ?? assets.SolutionSubheader;
            var howItWorksHeader = targetSnapshot?.HowItWorksHeader ?? assets.HowItWorksHeader;
            var howItWorksSubheader = targetSnapshot?.HowItWorksSubheader ?? assets.HowItWorksSubheader;
            var faqHeader = targetSnapshot?.FaqHeader ?? assets.FaqHeader;
            var faqSubheader = targetSnapshot?.FaqSubheader ?? assets.FaqSubheader;
            var finalCtaHeader = targetSnapshot?.FinalCtaHeader ?? assets.FinalCtaHeader;
            var finalCtaSubheader = targetSnapshot?.FinalCtaSubheader ?? assets.FinalCtaSubheader;

            var html = $@"<!DOCTYPE html>
<html lang=""en"">
<head>
  <meta charset=""UTF-8"" />
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
  <title>{brandName} · In Preparation</title>
  <link rel=""preconnect"" href=""https://fonts.googleapis.com"">
  <link rel=""preconnect"" href=""https://fonts.gstatic.com"" crossorigin>
  <link href=""https://fonts.googleapis.com/css2?family={Uri.EscapeDataString(textFont).Replace("%20", "+")}:ital,wght@0,300..800;1,300..800&family={Uri.EscapeDataString(displayFont).Replace("%20", "+")}:wght@300..900&display=swap"" rel=""stylesheet"">
  <style>
    :root {{
      --bg: {bgColor};
      --card: #121316;
      --border: #22242A;
      --text: {textColor};
      --muted: #9CA3AF;
      --primary: {primaryColor};
      --secondary: {secondaryColor};
      --accent: {accentColor};
      --primary-hover: {primaryColor}DD;
      --font-sans: '{textFont}', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-heading: '{displayFont}', -apple-system, BlinkMacSystemFont, sans-serif;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ background: var(--bg); color: var(--text); font-family: var(--font-sans); line-height: 1.6; padding: 0 1.5rem; }}
    .container {{ max-width: 1040px; margin: 0 auto; }}
    header {{ display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 0; border-bottom: 1px solid var(--border); }}
    .brand-logo {{ display: flex; align-items: center; gap: 0.75rem; font-family: var(--font-heading); font-weight: 700; font-size: 1.25rem; color: #FFFFFF; }}
    .brand-logo img {{ height: 32px; width: auto; max-width: 160px; object-fit: contain; }}
    .badge {{ background: rgba(59, 130, 246, 0.1); color: var(--primary); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 9999px; padding: 0.25rem 0.75rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }}
    .hero {{ padding: 5rem 0 3rem; text-align: center; max-width: 760px; margin: 0 auto; }}
    .eyebrow {{ color: var(--primary); font-size: 0.8125rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 1rem; }}
    h1 {{ font-family: var(--font-heading); font-size: 2.75rem; line-height: 1.15; font-weight: 700; margin-bottom: 1.25rem; color: #FFFFFF; }}
    p.lead {{ font-size: 1.125rem; color: var(--muted); margin-bottom: 2rem; }}
    .cta-btn {{ display: inline-flex; align-items: center; gap: 0.5rem; background: var(--primary); color: #fff; text-decoration: none; padding: 0.875rem 2rem; border-radius: 0.5rem; font-weight: 600; transition: opacity 0.15s ease; }}
    .cta-btn:hover {{ opacity: 0.9; }}
    .card-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem; margin-top: 3rem; }}
    .card {{ background: var(--card); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1.5rem; }}
    .card-num {{ width: 28px; height: 28px; border-radius: 50%; background: rgba(59, 130, 246, 0.15); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: bold; margin-bottom: 1rem; }}
    h2 {{ font-family: var(--font-heading); font-size: 1.75rem; margin-bottom: 1rem; color: #FFF; }}
    h3 {{ font-family: var(--font-heading); font-size: 1.125rem; margin-bottom: 0.5rem; color: #FFF; }}
    .section-wrap {{ padding: 4rem 0; border-top: 1px solid var(--border); }}
    footer {{ border-top: 1px solid var(--border); padding: 2rem 0; display: flex; justify-content: space-between; align-items: center; color: var(--muted); font-size: 0.875rem; }}
  </style>
</head>
<body>
  <div class=""container"">
    <header>
      <div class=""brand-logo"">
        {(!string.IsNullOrWhiteSpace(logoUri) ? $@"<img src=""{WebUtility.HtmlEncode(logoUri)}"" alt=""{brandName}"" />" : "")}
        <span>{brandName}</span>
      </div>
      <div class=""badge"">{footerNotice}</div>
    </header>

    <main>
      <section class=""hero"">
        <div class=""eyebrow"">{conceptBadge}</div>
        <h1>{headline}</h1>
        <p class=""lead"">{description}</p>
        <div>
          <a href=""{destinationHref}""{onclickAttr} class=""cta-btn"">{buttonLabel} &rarr;</a>
        </div>
        <p style=""font-size: 0.8125rem; color: var(--muted); margin-top: 0.75rem;"">{heroHelpText}</p>
      </section>

      <section class=""section-wrap"">
        <div class=""eyebrow"">{WebUtility.HtmlEncode(assets.PlannedWorkflowTitle)}</div>
        <p style=""color: var(--muted); margin-bottom: 1.5rem;"">{WebUtility.HtmlEncode(assets.PlannedWorkflowSubtitle)}</p>
        <div class=""card-grid"">
          {string.Join("", assets.WorkflowSteps.Select(s => $@"<div class=""card""><div class=""card-num"">{s.StepNumber}</div><h3>{WebUtility.HtmlEncode(s.Title)}</h3><p style=""color: var(--muted); font-size: 0.9375rem;"">{WebUtility.HtmlEncode(s.Description)}</p></div>"))}
        </div>
      </section>

      {(includeProblem ? $@"
      <section class=""section-wrap"">
        <div class=""eyebrow"">{WebUtility.HtmlEncode(problemEyebrow)}</div>
        <h2>{WebUtility.HtmlEncode(problemStatement)}</h2>
        <p style=""color: var(--muted); max-width: 680px;"">{WebUtility.HtmlEncode(momentumStatement)}</p>
      </section>" : "")}

      {(includeSolution ? $@"
      <section class=""section-wrap"">
        <h2>{WebUtility.HtmlEncode(solutionHeader)}</h2>
        <p style=""color: var(--muted); margin-bottom: 2rem;"">{WebUtility.HtmlEncode(solutionSubheader)}</p>
        <div class=""card-grid"">
          {string.Join("", plannedSolutions.Select(sol => $@"<div class=""card""><h3>{WebUtility.HtmlEncode(sol.Title)}</h3><p style=""color: var(--muted); font-size: 0.9375rem;"">{WebUtility.HtmlEncode(sol.Description)}</p></div>"))}
        </div>
      </section>" : "")}

      {(includeHowItWorks ? $@"
      <section class=""section-wrap"">
        <h2>{WebUtility.HtmlEncode(howItWorksHeader)}</h2>
        <p style=""color: var(--muted); margin-bottom: 2rem;"">{WebUtility.HtmlEncode(howItWorksSubheader)}</p>
        <div style=""display: flex; flex-direction: column; gap: 1rem;"">
          {string.Join("", workflowDetails.Select(wf => $@"<div class=""card"" style=""display: flex; gap: 1.25rem; align-items: flex-start;""><div class=""card-num"">{wf.StepNumber}</div><div><h3>{WebUtility.HtmlEncode(wf.Title)}</h3><p style=""color: var(--muted); font-size: 0.9375rem;"">{WebUtility.HtmlEncode(wf.Description)}</p></div></div>"))}
        </div>
      </section>" : "")}

      {(includePricing && assets.PricingExclusion != null ? $@"
      <section class=""section-wrap"" id=""pricing-section"">
        <h2>Transparent Pricing</h2>
        <p style=""color: var(--muted); margin-bottom: 2rem;"">Clear, straightforward options designed for your workflows.</p>
        <div class=""card"" style=""max-width: 360px; margin: 0 auto; text-align: center;"">
          <h3>{WebUtility.HtmlEncode(assets.PricingExclusion.SelectedOfferName ?? "Standard Plan")}</h3>
          <div style=""font-size: 2.25rem; font-weight: 700; margin: 1rem 0; color: #FFF;"">
            {(assets.PricingExclusion.PriceStatus == "ConfirmedZero" ? "Free" : $"{assets.PricingExclusion.Currency}{assets.PricingExclusion.ChosenPrice ?? 0:0.##}")}
            {(assets.PricingExclusion.PriceStatus != "ConfirmedZero" ? $@"<span style=""font-size: 0.875rem; color: var(--muted); font-weight: 400;""> / {WebUtility.HtmlEncode(assets.PricingExclusion.BillingPeriod)}</span>" : "")}
          </div>
          <p style=""color: var(--muted); font-size: 0.875rem;"">{WebUtility.HtmlEncode(assets.PricingExclusion.Reason)}</p>
        </div>
      </section>" : "")}

      {(includeFaq ? $@"
      <section class=""section-wrap"">
        <h2>{WebUtility.HtmlEncode(faqHeader)}</h2>
        <p style=""color: var(--muted); margin-bottom: 2rem;"">{WebUtility.HtmlEncode(faqSubheader)}</p>
        <div style=""display: flex; flex-direction: column; gap: 1rem;"">
          {string.Join("", faqs.Select(faq => $@"<div class=""card""><h3>{WebUtility.HtmlEncode(faq.Question)}</h3><p style=""color: var(--muted); font-size: 0.9375rem;"">{WebUtility.HtmlEncode(faq.Answer)}</p></div>"))}
        </div>
      </section>" : "")}

      {(includeFinalCta ? $@"
      <section class=""section-wrap"" style=""text-align: center;"">
        <h2>{WebUtility.HtmlEncode(finalCtaHeader)}</h2>
        <p style=""color: var(--muted); margin-bottom: 1.5rem;"">{WebUtility.HtmlEncode(finalCtaSubheader)}</p>
        <a href=""{destinationHref}""{onclickAttr} class=""cta-btn"">{buttonLabel} &rarr;</a>
      </section>" : "")}
    </main>

    <footer>
      <div>{brandName}</div>
      <div>{footerNotice}</div>
    </footer>
  </div>
</body>
</html>";
            return html;
        }
    }
}
