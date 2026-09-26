using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Phase4;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations
{
    public class LaunchAssetsService : ILaunchAssetsService
    {
        private readonly ICreatorJourneyService _journeys;
        private readonly IPricingStrategyService _pricingService;
        private readonly IGtmStrategyService _gtmService;
        private readonly ILogger<LaunchAssetsService> _logger;

        public LaunchAssetsService(
            ICreatorJourneyService journeys,
            IPricingStrategyService pricingService,
            IGtmStrategyService gtmService,
            ILogger<LaunchAssetsService> logger)
        {
            _journeys = journeys;
            _pricingService = pricingService;
            _gtmService = gtmService;
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
                return new LaunchAssetsResponse
                {
                    IdeaId = ideaId ?? string.Empty,
                    IdeaVersion = journey.IdeaVersion,
                    Assets = existing,
                    UpdateAvailable = false,
                    ChangedSources = new List<string>()
                };
            }

            var brandName = !string.IsNullOrWhiteSpace(journey.Project?.Name) ? journey.Project.Name : "ClairDesk";
            var pricing = journey.Phase4Data?.PricingStrategy;
            var gtm = journey.Phase4Data?.GtmStrategy;

            decimal price = 15;
            string period = "month";
            string unit = "business";

            if (pricing != null)
            {
                var primaryOffer = pricing.Offers?.FirstOrDefault();
                if (primaryOffer != null)
                {
                    price = primaryOffer.Price > 0 ? primaryOffer.Price : (primaryOffer.RecommendedPrice > 0 ? primaryOffer.RecommendedPrice : 15);
                    period = primaryOffer.BillingFrequency.ToString().ToLowerInvariant();
                    unit = !string.IsNullOrWhiteSpace(primaryOffer.Name) ? primaryOffer.Name.ToLowerInvariant() : "business";
                }
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

                // Section A: Hero
                BrandName = brandName,
                ConceptBadge = "PREVIEWING CONCEPT",
                Headline = "A clearer way to manage enquiries and quotations.",
                Description = $"{brandName} is being built to help independent service businesses keep enquiries, quotations, and follow-ups together.",
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
                        Title = "1. Enquiry",
                        Description = "Capture context, channels, and client requirements in one dedicated intake card.",
                        Tag = "Unified intake"
                    },
                    new()
                    {
                        StepNumber = 2,
                        Title = "2. Quotation",
                        Description = "Draft estimated scopes, convert directly into clear client proposals without duplicate entry.",
                        Tag = "Context continuity"
                    },
                    new()
                    {
                        StepNumber = 3,
                        Title = "3. Follow-up",
                        Description = "Clear reminders and stage updates so no client is left waiting or dropped.",
                        Tag = "Next step clarity"
                    }
                },

                // Section B: Problem
                ProblemEyebrow = "KEEP TRACK OF THE NEXT STEP",
                ProblemStatement = "When enquiries and quotations are spread across different places, it can be harder to see what needs a reply or follow-up.",
                OperationalMomentumStatement = $"{brandName} focuses squarely on maintaining single-view operational momentum for solo consultants and niche service providers.",

                // Section C: Planned Solution
                SolutionHeader = "What’s being planned",
                SolutionSubheader = "Straightforward tools designed strictly around routine project administration.",
                PlannedSolutions = new List<LaunchSolutionCard>
                {
                    new()
                    {
                        Title = "Enquiries together",
                        Description = "A clearer place to organise incoming customer requests.",
                        Icon = "inbox"
                    },
                    new()
                    {
                        Title = "Quotations in view",
                        Description = "A way to keep track of quotations and their next steps.",
                        Icon = "file-text"
                    },
                    new()
                    {
                        Title = "Follow-ups to remember",
                        Description = "A way to see which conversations need attention.",
                        Icon = "bell"
                    }
                },

                // Section D: How It Works
                HowItWorksHeader = "A simpler flow for your work",
                HowItWorksSubheader = "This describes the planned workflow.",
                WorkflowDetails = new List<LaunchWorkflowDetailedItem>
                {
                    new()
                    {
                        StepNumber = 1,
                        Title = "Organise the enquiry",
                        Description = "Collect client briefs, deadlines, and key requirements without sorting through scattered inbox threads."
                    },
                    new()
                    {
                        StepNumber = 2,
                        Title = "Prepare and track the quotation",
                        Description = "Generate clean, professional estimates linked directly to the original client request."
                    },
                    new()
                    {
                        StepNumber = 3,
                        Title = "Follow up on the next action",
                        Description = "Receive clear prompts when responses are due, making timely follow-through second nature."
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
                        Answer = "Independent service businesses that manage customer enquiries and quotations."
                    },
                    new()
                    {
                        Question = "When will it launch?",
                        Answer = "A launch date has not been confirmed."
                    }
                },

                // Section F: Final CTA
                FinalCtaHeader = "Share how you work today",
                FinalCtaSubheader = $"Your experience can help shape what {brandName} focuses on.",

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

                PricingExclusion = new LaunchPricingExclusion
                {
                    Excluded = true,
                    ChosenPrice = price,
                    BillingPeriod = period,
                    Unit = unit,
                    Currency = "€",
                    Reason = $"Your chosen price is €{price} per {unit} / {period}. Confirm the offer details before adding pricing to the website.",
                    ActionLabel = "Review pricing details →",
                    ActionRoute = "/dashboard/creator/phase-4/pricing"
                },

                ProofExclusion = new LaunchProofExclusion
                {
                    Excluded = true,
                    ProofNeeded = true,
                    Reason = "No supporting evidence has been added, so this section is not included.",
                    ActionLabel = "Review proof →",
                    ActionRoute = "/dashboard/creator/phase-3/evidence"
                },

                SourceVersions = new Phase4SourceVersions()
            };

            var updatedJourney = await _journeys.SetPhase4LaunchAssetsAsync(userId, newAssets, ideaId);

            return new LaunchAssetsResponse
            {
                IdeaId = ideaId ?? string.Empty,
                IdeaVersion = updatedJourney.IdeaVersion,
                Assets = newAssets,
                UpdateAvailable = false,
                ChangedSources = new List<string>()
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
            }

            existing.LastGeneratedAt = DateTime.UtcNow;

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

            existing.Version += 1;
            existing.ReleaseTag = $"v1.{existing.Version}-rc";
            existing.LastGeneratedAt = DateTime.UtcNow;

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

        public async Task<string> GetSourceCodeBundleAsync(string userId, string? ideaId = null)
        {
            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            var assets = journey.Phase4Data?.LaunchAssets;
            if (assets == null)
            {
                throw new InvalidOperationException("Launch assets have not been generated yet.");
            }

            var html = $@"<!DOCTYPE html>
<html lang=""en"">
<head>
  <meta charset=""UTF-8"" />
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
  <title>{assets.BrandName} · In Preparation</title>
  <link rel=""preconnect"" href=""https://fonts.googleapis.com"">
  <link rel=""preconnect"" href=""https://fonts.gstatic.com"" crossorigin>
  <link href=""https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Inter:wght@100..900&display=swap"" rel=""stylesheet"">
  <style>
    :root {{
      --bg: #090A0C;
      --card: #121316;
      --border: #22242A;
      --text: #F3F4F6;
      --muted: #9CA3AF;
      --primary: #3B82F6;
      --primary-hover: #2563EB;
      --font-sans: 'DM Sans', sans-serif;
      --font-heading: 'Inter', sans-serif;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ background: var(--bg); color: var(--text); font-family: var(--font-sans); line-height: 1.6; padding: 0 1.5rem; }}
    .container {{ max-width: 1040px; margin: 0 auto; }}
    header {{ display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 0; border-bottom: 1px solid var(--border); }}
    .badge {{ background: rgba(59, 130, 246, 0.1); color: var(--primary); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 9999px; padding: 0.25rem 0.75rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }}
    .hero {{ padding: 5rem 0 3rem; text-align: center; max-width: 760px; margin: 0 auto; }}
    .eyebrow {{ color: var(--primary); font-size: 0.8125rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 1rem; }}
    h1 {{ font-family: var(--font-heading); font-size: 2.75rem; line-height: 1.15; font-weight: 700; margin-bottom: 1.25rem; color: #FFFFFF; }}
    p.lead {{ font-size: 1.125rem; color: var(--muted); margin-bottom: 2rem; }}
    .cta-btn {{ display: inline-flex; align-items: center; gap: 0.5rem; background: var(--primary); color: #fff; text-decoration: none; padding: 0.875rem 2rem; border-radius: 0.5rem; font-weight: 600; transition: background 0.15s ease; }}
    .cta-btn:hover {{ background: var(--primary-hover); }}
    .card-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem; margin-top: 3rem; }}
    .card {{ background: var(--card); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1.5rem; }}
    .card-num {{ width: 28px; height: 28px; border-radius: 50%; background: rgba(59, 130, 246, 0.15); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: bold; margin-bottom: 1rem; }}
    h2 {{ font-family: var(--font-heading); font-size: 1.75rem; margin-bottom: 1rem; color: #FFF; }}
    h3 {{ font-family: var(--font-heading); font-size: 1.125rem; margin-bottom: 0.5rem; color: #FFF; }}
    .section-wrap {{ padding: 4rem 0; border-top: 1px solid var(--border); }}
    footer {{ border-top: 1px solid var(--border); padding: 2rem 0; display: flex; justify-content: space-between; color: var(--muted); font-size: 0.875rem; }}
  </style>
</head>
<body>
  <div class=""container"">
    <header>
      <div style=""font-weight: 700; font-size: 1.25rem;"">{assets.BrandName}</div>
      <div class=""badge"">{assets.FooterNotice}</div>
    </header>

    <main>
      <section class=""hero"">
        <div class=""eyebrow"">{assets.ConceptBadge}</div>
        <h1>{assets.Headline}</h1>
        <p class=""lead"">{assets.Description}</p>
        <div>
          <a href=""{(!string.IsNullOrWhiteSpace(assets.ButtonDestinationValue) ? (assets.ButtonDestinationType == "Email" ? "mailto:" + assets.ButtonDestinationValue : assets.ButtonDestinationValue) : "#")}"" class=""cta-btn"">{assets.ButtonLabel} &rarr;</a>
        </div>
        <p style=""font-size: 0.8125rem; color: var(--muted); margin-top: 0.75rem;"">{assets.HeroHelpText}</p>
      </section>

      <section class=""section-wrap"">
        <div class=""eyebrow"">{assets.PlannedWorkflowTitle}</div>
        <p style=""color: var(--muted); margin-bottom: 1.5rem;"">{assets.PlannedWorkflowSubtitle}</p>
        <div class=""card-grid"">
          {string.Join("", assets.WorkflowSteps.Select(s => $@"<div class=""card""><div class=""card-num"">{s.StepNumber}</div><h3>{s.Title}</h3><p style=""color: var(--muted); font-size: 0.9375rem;"">{s.Description}</p></div>"))}
        </div>
      </section>

      <section class=""section-wrap"">
        <div class=""eyebrow"">{assets.ProblemEyebrow}</div>
        <h2>{assets.ProblemStatement}</h2>
        <p style=""color: var(--muted); max-width: 680px;"">{assets.OperationalMomentumStatement}</p>
      </section>

      <section class=""section-wrap"">
        <h2>{assets.SolutionHeader}</h2>
        <p style=""color: var(--muted); margin-bottom: 2rem;"">{assets.SolutionSubheader}</p>
        <div class=""card-grid"">
          {string.Join("", assets.PlannedSolutions.Select(sol => $@"<div class=""card""><h3>{sol.Title}</h3><p style=""color: var(--muted); font-size: 0.9375rem;"">{sol.Description}</p></div>"))}
        </div>
      </section>

      <section class=""section-wrap"">
        <h2>{assets.HowItWorksHeader}</h2>
        <p style=""color: var(--muted); margin-bottom: 2rem;"">{assets.HowItWorksSubheader}</p>
        <div style=""display: flex; flex-direction: column; gap: 1rem;"">
          {string.Join("", assets.WorkflowDetails.Select(wf => $@"<div class=""card"" style=""display: flex; gap: 1.25rem; align-items: flex-start;""><div class=""card-num"">{wf.StepNumber}</div><div><h3>{wf.Title}</h3><p style=""color: var(--muted); font-size: 0.9375rem;"">{wf.Description}</p></div></div>"))}
        </div>
      </section>

      <section class=""section-wrap"">
        <h2>{assets.FaqHeader}</h2>
        <p style=""color: var(--muted); margin-bottom: 2rem;"">{assets.FaqSubheader}</p>
        <div style=""display: flex; flex-direction: column; gap: 1rem;"">
          {string.Join("", assets.Faqs.Select(faq => $@"<div class=""card""><h3>{faq.Question}</h3><p style=""color: var(--muted); font-size: 0.9375rem;"">{faq.Answer}</p></div>"))}
        </div>
      </section>

      <section class=""section-wrap"" style=""text-align: center;"">
        <h2>{assets.FinalCtaHeader}</h2>
        <p style=""color: var(--muted); margin-bottom: 1.5rem;"">{assets.FinalCtaSubheader}</p>
        <a href=""{(!string.IsNullOrWhiteSpace(assets.ButtonDestinationValue) ? (assets.ButtonDestinationType == "Email" ? "mailto:" + assets.ButtonDestinationValue : assets.ButtonDestinationValue) : "#")}"" class=""cta-btn"">{assets.ButtonLabel} &rarr;</a>
      </section>
    </main>

    <footer>
      <div>{assets.BrandName}</div>
      <div>{assets.FooterNotice}</div>
    </footer>
  </div>
</body>
</html>";
            return html;
        }
    }
}
