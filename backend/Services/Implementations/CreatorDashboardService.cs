using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Models.DatabaseModels.Phase4;
using WebApp.Services.Interface;
using WebApp.Services.Repository;

namespace WebApp.Services.Implementations
{
    public class CreatorDashboardService : ICreatorDashboardService
    {
        private readonly ICreatorJourneyService _journeys;
        private readonly ICreatorIdeaStore _ideas;
        private readonly IBrandKitStore _brandKits;
        private readonly IProfessionalProfileStore _profiles;
        private readonly UserManager<ApplicationUser> _userManager;

        public CreatorDashboardService(
            ICreatorJourneyService journeys,
            ICreatorIdeaStore ideas,
            IBrandKitStore brandKits,
            IProfessionalProfileStore profiles,
            UserManager<ApplicationUser> userManager)
        {
            _journeys = journeys;
            _ideas = ideas;
            _brandKits = brandKits;
            _profiles = profiles;
            _userManager = userManager;
        }

        public async Task<CreatorDashboardSummaryDto> GetSummaryAsync(string userId, string? ideaId = null, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new UnauthorizedAccessException("User is not authenticated.");

            if (!string.IsNullOrEmpty(ideaId))
            {
                var explicitIdea = await _ideas.GetOwnedAsync(ideaId, userId);
                if (explicitIdea == null)
                    throw new UnauthorizedAccessException("Idea not found or access denied.");
            }

            // 1. Get composed journey and active idea (owner-scoped)
            var journey = await _journeys.GetOrCreateComposedAsync(userId, ideaId);
            if (journey == null)
                throw new UnauthorizedAccessException("Journey not found.");

            var activeIdeaId = journey.BusinessIdeaId ?? journey.ActiveIdeaId ?? ideaId;
            CreatorIdea? idea = null;
            if (!string.IsNullOrEmpty(activeIdeaId))
            {
                idea = await _ideas.GetOwnedAsync(activeIdeaId, userId);
            }

            // 2. Phase 1 universal status
            var user = await _userManager.FindByIdAsync(userId);
            bool phase1Complete = (user?.Onboarding?.Phase ?? 0) >= 1;

            // 3. Compute canonical phase status (derivation engine)
            var computedStatus = await _journeys.ComputePhaseStatusAsync(journey, phase1Complete);

            // 4. Resolve BrandKit (canonical brand authority)
            BrandKit? brandKit = null;
            if (!string.IsNullOrEmpty(activeIdeaId))
            {
                brandKit = await _brandKits.GetByIdeaIdAsync(activeIdeaId, userId);
            }

            // 5. Resolve ProfessionalProfile
            var profile = await _profiles.GetByUserIdAsync(userId, ct);

            // 6. Resolve Phase 4 Evaluation
            var p4 = journey.Phase4Data ?? new CreatorPhase4Data();
            var p4Eval = Phase4CompletionResolver.Resolve(p4);

            // Build DTO
            var summary = new CreatorDashboardSummaryDto
            {
                UpdatedAt = journey.UpdatedAt,
                Project = BuildProjectSummary(idea, journey, brandKit),
                Journey = BuildJourneyOverview(computedStatus, journey, p4Eval),
                NextAction = ResolveNextAction(computedStatus, journey, p4, p4Eval, idea?.Id),
                AttentionItems = ResolveAttentionItems(journey, p4, profile, idea?.Id),
                Results = BuildResultsList(journey, brandKit, p4),
                Phase5 = BuildPhase5Summary(computedStatus, journey, p4Eval, idea?.Id)
            };

            return summary;
        }

        private static DashboardProjectSummaryDto BuildProjectSummary(CreatorIdea? idea, CreatorJourney journey, BrandKit? brandKit)
        {
            var project = idea?.Project ?? journey.Project ?? new CreatorJourneyProject();
            var branding = project.Branding ?? new CreatorBranding();

            string? logoAsset = null;
            if (brandKit?.Logo?.Variations != null && brandKit.Logo.Variations.TryGetValue(BrandLogoVariationKeys.Primary, out var primVar))
            {
                logoAsset = primVar.SvgUri ?? primVar.PngUri;
            }
            else if (brandKit?.Logo?.Concepts != null && !string.IsNullOrEmpty(brandKit.Logo.SelectedConceptKey))
            {
                var selConcept = brandKit.Logo.Concepts.FirstOrDefault(c => c.Key == brandKit.Logo.SelectedConceptKey);
                logoAsset = selConcept?.LockupAssetUri ?? selConcept?.MarkAssetUri;
            }
            if (string.IsNullOrEmpty(logoAsset))
            {
                logoAsset = branding.LogoAsset;
            }

            List<string> colorPalette = brandKit?.Colors?.Roles != null && brandKit.Colors.Roles.Any()
                ? brandKit.Colors.Roles.Select(r => r.Hex).Where(h => !string.IsNullOrEmpty(h)).ToList()
                : (branding.ColorPalette ?? new List<string>());

            string typographyPairing = brandKit?.Typography?.Families != null 
                && (!string.IsNullOrEmpty(brandKit.Typography.Families.DisplayFamily?.Name) || !string.IsNullOrEmpty(brandKit.Typography.Families.TextFamily?.Name))
                ? $"{brandKit.Typography.Families.DisplayFamily?.Name} / {brandKit.Typography.Families.TextFamily?.Name}".Trim(' ', '/')
                : (branding.TypographyPairing ?? string.Empty);

            var brandDto = new DashboardBrandSummaryDto
            {
                HasBrandKit = brandKit != null,
                BrandKitId = brandKit?.Id ?? branding.BrandKitId,
                Status = brandKit != null 
                    ? (string.Equals(brandKit.Status, "complete", StringComparison.OrdinalIgnoreCase) ? "complete" : "in_progress")
                    : (string.IsNullOrEmpty(branding.BrandingMethod) ? "not_started" : branding.BrandingMethod.ToLowerInvariant()),
                LogoAsset = logoAsset,
                ColorPalette = colorPalette,
                TypographyPairing = typographyPairing
            };

            return new DashboardProjectSummaryDto
            {
                Id = idea?.Id ?? journey.BusinessIdeaId ?? string.Empty,
                Name = !string.IsNullOrWhiteSpace(project.Name) ? project.Name : "Untitled Venture",
                Tagline = project.Tagline,
                Concept = project.Concept,
                Category = project.Category,
                Sector = project.Sector,
                ClarityScore = project.ClarityScore,
                Brand = brandDto
            };
        }

        private static DashboardNextActionDto ResolveNextAction(
            ComputedJourneyStatus computed,
            CreatorJourney journey,
            CreatorPhase4Data p4,
            Phase4CompletionResult p4Eval,
            string? ideaId)
        {
            // Helper to append idea context query param
            string Route(string path) =>
                string.IsNullOrEmpty(ideaId) ? path : $"{path}?ideaId={ideaId}";

            // 0. Phase 1 Check: Profile Onboarding & Verification
            if (computed.Phase1.Status != "completed")
            {
                return new DashboardNextActionDto
                {
                    Type = "phase_1_verification",
                    Phase = 1,
                    Stage = "1.1",
                    Title = "Complete Your Verification",
                    Description = "Verify your identity and complete profile onboarding to unlock your creator journey.",
                    Reason = "Identity verification is required before initiating project discovery.",
                    Href = "/dashboard/creator/phase-1",
                    Priority = "critical",
                    ButtonLabel = "Complete Your Verification"
                };
            }

            // 1. Phase 2
            if (computed.Phase2.Status != "completed")
            {
                var step = computed.Phase2.CurrentStep;
                if (step <= 6)
                {
                    return new DashboardNextActionDto
                    {
                        Type = "phase_2_clarifier",
                        Phase = 2,
                        Stage = "2.1",
                        Title = string.IsNullOrEmpty(ideaId) ? "Start Concept Clarifier" : "Clarify Your Concept",
                        Description = "Define your core problem, solution, target audience, and differentiation with the AI Clarifier.",
                        Reason = "A sharp, validated problem statement is required before branding and financial modelling.",
                        Href = Route("/dashboard/creator/phase-2/clarifier"),
                        Priority = "high",
                        ButtonLabel = string.IsNullOrEmpty(ideaId) ? "Start Clarifier" : "Continue Clarifier"
                    };
                }
                if (step == 7)
                {
                    return new DashboardNextActionDto
                    {
                        Type = "phase_2_summary",
                        Phase = 2,
                        Stage = "2.2",
                        Title = "Review Concept Summary",
                        Description = "Lock your finalized venture concept definition.",
                        Reason = "Review the synthesized pitch statement before generating public concept names.",
                        Href = Route("/dashboard/creator/phase-2/idea-summary"),
                        Priority = "normal",
                        ButtonLabel = "Review Concept"
                    };
                }
                if (step == 8)
                {
                    return new DashboardNextActionDto
                    {
                        Type = "phase_2_naming",
                        Phase = 2,
                        Stage = "2.3",
                        Title = "Choose Project Name",
                        Description = "Select or generate a compelling public brand name for your venture.",
                        Reason = "Your venture requires an official project name before establishing brand assets.",
                        Href = Route("/dashboard/creator/phase-2/concept-name"),
                        Priority = "normal",
                        ButtonLabel = "Select Project Name"
                    };
                }
                if (step == 9)
                {
                    return new DashboardNextActionDto
                    {
                        Type = "phase_2_branding_choice",
                        Phase = 2,
                        Stage = "2.4",
                        Title = "Select Branding Path",
                        Description = "Choose whether to build an identity with AI Brand Studio, hire an M50 designer, or skip.",
                        Reason = "Establishing visual identity tokens unlocks personalized asset compilation.",
                        Href = Route("/dashboard/creator/phase-2/branding"),
                        Priority = "normal",
                        ButtonLabel = "Choose Branding Path"
                    };
                }
                if (step == 10)
                {
                    return new DashboardNextActionDto
                    {
                        Type = "phase_2_hire_designer",
                        Phase = 2,
                        Stage = "2.5",
                        Title = "Browse Brand Designers",
                        Description = "Hire an expert M50 service provider to craft custom visual identity assets.",
                        Reason = "You selected the professional designer route for branding.",
                        Href = Route("/dashboard/creator/phase-2/hire-designer"),
                        Priority = "normal",
                        ButtonLabel = "Browse Designers"
                    };
                }
                if (step == 11)
                {
                    return new DashboardNextActionDto
                    {
                        Type = "phase_2_brand_studio",
                        Phase = 2,
                        Stage = "2.6",
                        Title = "Build in Brand Studio",
                        Description = "Generate and commit color palettes, typography pairings, and SVG brand logo.",
                        Reason = "Committed BrandKit tokens feed directly into your Executive Business Plan and launch materials.",
                        Href = Route("/dashboard/creator/phase-2/brand-studio"),
                        Priority = "high",
                        ButtonLabel = "Open Brand Studio"
                    };
                }

                return new DashboardNextActionDto
                {
                    Type = "phase_2_complete",
                    Phase = 2,
                    Stage = "2.7",
                    Title = "Finalize Project Identity",
                    Description = "Confirm your identity assets to complete Phase 2 and unlock Business Intelligence.",
                    Reason = "Lock in Phase 2 outputs to begin market and financial modeling.",
                    Href = Route("/dashboard/creator/phase-2/complete"),
                    Priority = "normal",
                    ButtonLabel = "Finalize Phase 2"
                };
            }

            // 2. Phase 3
            if (computed.Phase3.Status != "completed")
            {
                var p3 = journey.Phase3Data;
                if (string.IsNullOrEmpty(p3?.MarketStudySessionId))
                {
                    return new DashboardNextActionDto
                    {
                        Type = "phase_3_market_study",
                        Phase = 3,
                        Stage = "3.1",
                        Title = "Conduct Market Study",
                        Description = "Evaluate TAM/SAM/SOM market sizing and analyze direct and indirect competitors.",
                        Reason = "Institutional investors and financial models require quantitative market validation.",
                        Href = Route("/dashboard/creator/phase-3/market-study"),
                        Priority = "high",
                        ButtonLabel = "Start Market Study"
                    };
                }
                if (string.IsNullOrEmpty(p3?.BusinessModelSessionId))
                {
                    return new DashboardNextActionDto
                    {
                        Type = "phase_3_business_model",
                        Phase = 3,
                        Stage = "3.2",
                        Title = "Design Business Model Canvas",
                        Description = "Structure your 9-block canvas, value propositions, and revenue streams.",
                        Reason = "Defines your pricing mechanics and cost structure foundations.",
                        Href = Route("/dashboard/creator/phase-3/business-model"),
                        Priority = "high",
                        ButtonLabel = "Build Business Model"
                    };
                }
                if (string.IsNullOrEmpty(p3?.ForecastSessionId))
                {
                    return new DashboardNextActionDto
                    {
                        Type = "phase_3_forecast",
                        Phase = 3,
                        Stage = "3.3",
                        Title = "Model Financial Forecast",
                        Description = "Compute 36-month deterministic revenue, break-even month, and cash runway.",
                        Reason = "Provides the algebraic cost floors and ARPU baseline for construction pricing.",
                        Href = Route("/dashboard/creator/phase-3/forecast"),
                        Priority = "high",
                        ButtonLabel = "Run Financial Forecast"
                    };
                }
                if (p3?.LegalAssessment == null)
                {
                    return new DashboardNextActionDto
                    {
                        Type = "phase_3_legal",
                        Phase = 3,
                        Stage = "3.4",
                        Title = "Review Legal & Compliance",
                        Description = "Analyze statutory French regulatory requirements, licensing, and tax mode.",
                        Reason = "Identifies required legal actions, permits, and VAT exemptions before incorporation.",
                        Href = Route("/dashboard/creator/phase-3/compliance"),
                        Priority = "high",
                        ButtonLabel = "Review Legal Roadmap"
                    };
                }
                if (p3?.FormationGenerator == null)
                {
                    return new DashboardNextActionDto
                    {
                        Type = "phase_3_formation",
                        Phase = 3,
                        Stage = "3.5",
                        Title = "Structure Company & Team",
                        Description = "Select corporate entity form (SAS/SARL) and build the incorporation checklist.",
                        Reason = "Entity structure dictates public grant eligibility and co-founder equity terms.",
                        Href = Route("/dashboard/creator/phase-3/formation"),
                        Priority = "normal",
                        ButtonLabel = "Structure Company"
                    };
                }
                if (string.IsNullOrEmpty(p3?.BusinessPlanSessionId))
                {
                    return new DashboardNextActionDto
                    {
                        Type = "phase_3_business_plan",
                        Phase = 3,
                        Stage = "3.6",
                        Title = "Synthesize Business Plan",
                        Description = "Compile your 12-section institutional executive business plan.",
                        Reason = "Produces the exportable executive document summarizing all upstream intelligence.",
                        Href = Route("/dashboard/creator/phase-3/business-plan"),
                        Priority = "high",
                        ButtonLabel = "Open Business Plan"
                    };
                }

                return new DashboardNextActionDto
                {
                    Type = "phase_3_complete",
                    Phase = 3,
                    Stage = "3.7",
                    Title = "Audit Investor Readiness",
                    Description = "Run the 5-dimension institutional readiness assessment to unlock Phase 4.",
                    Reason = "Grades market, model, financial, legal, and team rigor before entering construction.",
                    Href = Route("/dashboard/creator/phase-3/complete"),
                    Priority = "high",
                    ButtonLabel = "Audit Readiness"
                };
            }

            // 3. Phase 4
            if (computed.Phase4.Status != "completed")
            {
                if (p4.ConstructionSnapshot == null || p4.ConstructionSnapshot.Status != "Completed")
                {
                    return new DashboardNextActionDto
                    {
                        Type = "phase_4_snapshot",
                        Phase = 4,
                        Stage = "4.1",
                        Title = "Generate Construction Snapshot",
                        Description = "Synthesize readiness signals across brand, market, forecast, and legal foundations.",
                        Reason = "Identifies critical gaps and resource prerequisites before launching operational workflows.",
                        Href = Route("/dashboard/creator/phase-4/construction-snapshot"),
                        Priority = "high",
                        ButtonLabel = "Generate Snapshot"
                    };
                }

                // If Roadmap has a designated NextBestAction, prioritize it
                if (p4.Roadmap?.NextBestAction != null && !string.IsNullOrWhiteSpace(p4.Roadmap.NextBestAction.Title))
                {
                    return new DashboardNextActionDto
                    {
                        Type = "phase_4_roadmap_task",
                        Phase = 4,
                        Stage = "4.2",
                        Title = p4.Roadmap.NextBestAction.Title,
                        Description = !string.IsNullOrWhiteSpace(p4.Roadmap.NextBestAction.WhyNow)
                            ? p4.Roadmap.NextBestAction.WhyNow
                            : "Prioritized milestone from your operational roadmap.",
                        Reason = "Deterministic next best operational task scheduled within your weekly availability.",
                        Href = Route("/dashboard/creator/phase-4/roadmap"),
                        Priority = "high",
                        ButtonLabel = "Continue Roadmap Task"
                    };
                }

                if (!p4Eval.RoadmapResolved)
                {
                    return new DashboardNextActionDto
                    {
                        Type = "phase_4_roadmap",
                        Phase = 4,
                        Stage = "4.2",
                        Title = "Build Operational Roadmap",
                        Description = "Sequence milestones across 6 horizons, constrained by your weekly availability.",
                        Reason = "Prevents founder burnout by enforcing realistic capacity-bounded deadlines.",
                        Href = Route("/dashboard/creator/phase-4/roadmap"),
                        Priority = "normal",
                        ButtonLabel = "Build Roadmap"
                    };
                }
                if (!p4Eval.NeedsResolved)
                {
                    return new DashboardNextActionDto
                    {
                        Type = "phase_4_needs",
                        Phase = 4,
                        Stage = "4.3",
                        Title = "Analyze Venture Needs",
                        Description = "Map tools, equipment, legal services, and human resources required for launch.",
                        Reason = "Distinguishes active needs from covered needs and highlights training candidates.",
                        Href = Route("/dashboard/creator/phase-4/needs"),
                        Priority = "normal",
                        ButtonLabel = "Analyze Needs"
                    };
                }
                if (!p4Eval.SkillsResolved)
                {
                    return new DashboardNextActionDto
                    {
                        Type = "phase_4_skills",
                        Phase = 4,
                        Stage = "4.4",
                        Title = "Resolve Capability Gaps",
                        Description = "Designate Learn, Delegate, or Verify pathways for critical execution competencies.",
                        Reason = "Ensures statutory certifications are verified and skill deficits are mitigated.",
                        Href = Route("/dashboard/creator/phase-4/skills"),
                        Priority = "normal",
                        ButtonLabel = "Resolve Skills"
                    };
                }
                if (!p4Eval.SupportResolved)
                {
                    return new DashboardNextActionDto
                    {
                        Type = "phase_4_support",
                        Phase = 4,
                        Stage = "4.5",
                        Title = "Match Public Support & Grants",
                        Description = "Identify eligible French regional and national subsidies and public aids.",
                        Reason = "Catalogs non-dilutive financing opportunities without inflating operating cash.",
                        Href = Route("/dashboard/creator/phase-4/support"),
                        Priority = "normal",
                        ButtonLabel = "Find Public Support"
                    };
                }
                if (!p4Eval.PricingResolved)
                {
                    return new DashboardNextActionDto
                    {
                        Type = "phase_4_pricing",
                        Phase = 4,
                        Stage = "4.6",
                        Title = "Establish Pricing Strategy",
                        Description = "Set founder pricing against unit cost floors, tax modes, and market references.",
                        Reason = "Validates that customer pricing covers direct costs and respects statutory VAT rules.",
                        Href = Route("/dashboard/creator/phase-4/pricing"),
                        Priority = "high",
                        ButtonLabel = "Set Pricing Policy"
                    };
                }
                if (!p4Eval.GtmResolved)
                {
                    return new DashboardNextActionDto
                    {
                        Type = "phase_4_gtm",
                        Phase = 4,
                        Stage = "4.7",
                        Title = "Formulate GTM Launch Strategy",
                        Description = "Define primary launch segment, channel portfolio, and validation experiments.",
                        Reason = "Establishes disciplined stop/scale conditions and channel effort limits.",
                        Href = Route("/dashboard/creator/phase-4/gtm"),
                        Priority = "high",
                        ButtonLabel = "Build GTM Strategy"
                    };
                }
            }

            // 4. Phase 5
            if (computed.Phase5.Status != "completed")
            {
                return new DashboardNextActionDto
                {
                    Type = "phase_5_crossroads",
                    Phase = 5,
                    Stage = "5.1",
                    Title = "Choose Your Crossroads Path",
                    Description = "All Phase 4 construction preparation is resolved. Choose whether to Sell or Build your venture.",
                    Reason = "Select between Full Buyout offer push or Equity Partnership company building.",
                    Href = Route("/dashboard/creator/crossroads"),
                    Priority = "high",
                    ButtonLabel = "Open Crossroads Decision"
                };
            }

            // 5. Phase 6 / Completed
            return new DashboardNextActionDto
            {
                Type = "phase_6_matching",
                Phase = 6,
                Stage = "6.1",
                Title = "Enter Smart Matchmaking",
                Description = "Your venture is prepared and packaged. Engage with interested buyers and partners.",
                Reason = "Review deal progress and active investor conversations.",
                Href = Route("/dashboard/creator/investors"),
                Priority = "normal",
                ButtonLabel = "View Opportunities"
            };
        }

        private static List<DashboardAttentionItemDto> ResolveAttentionItems(
            CreatorJourney journey,
            CreatorPhase4Data p4,
            ProfessionalProfileRecord? profile,
            string? ideaId)
        {
            string Route(string path) =>
                string.IsNullOrEmpty(ideaId) ? path : $"{path}?ideaId={ideaId}";

            var items = new List<DashboardAttentionItemDto>();

            // 1. BLOCKED Roadmap Tasks
            if (p4.Roadmap?.Tasks != null)
            {
                var blockedTasks = p4.Roadmap.Tasks
                    .Where(t => string.Equals(t.Status, "Blocked", StringComparison.OrdinalIgnoreCase))
                    .ToList();

                foreach (var bt in blockedTasks)
                {
                    items.Add(new DashboardAttentionItemDto
                    {
                        Id = $"blocked-task-{bt.Key}",
                        Type = "BLOCKED",
                        Phase = 4,
                        Title = $"Blocked Milestone: {bt.Title}",
                        Description = !string.IsNullOrWhiteSpace(bt.FounderNotes) ? bt.FounderNotes : "This roadmap task is currently marked as blocked.",
                        Href = Route("/dashboard/creator/phase-4/roadmap"),
                        Severity = "critical"
                    });
                }
            }

            // 2. LEGAL_UPDATE
            if (journey.Phase3Data?.LegalAssessment?.IsPotentiallyOutdated == true)
            {
                items.Add(new DashboardAttentionItemDto
                {
                    Id = "legal-catalog-update",
                    Type = "LEGAL_UPDATE",
                    Phase = 3,
                    Title = "France Legal Catalog Updated",
                    Description = "Statutory French legal regulations have evolved. Reconcile your legal compliance assessment.",
                    Href = Route("/dashboard/creator/phase-3/compliance"),
                    Severity = "warning"
                });
            }

            // 3. STALE_BLOCKING_DEPENDENCY
            if (p4.PricingStrategy?.Status == PricingStatus.Stale)
            {
                items.Add(new DashboardAttentionItemDto
                {
                    Id = "pricing-assumptions-stale",
                    Type = "STALE_BLOCKING_DEPENDENCY",
                    Phase = 4,
                    Title = "Pricing Assumptions Changed",
                    Description = "Upstream financial forecast or cost structure updated. Review your pricing strategy.",
                    Href = Route("/dashboard/creator/phase-4/pricing"),
                    Severity = "warning"
                });
            }
            if (string.Equals(p4.GtmStrategy?.Status, "Stale", StringComparison.OrdinalIgnoreCase))
            {
                items.Add(new DashboardAttentionItemDto
                {
                    Id = "gtm-strategy-stale",
                    Type = "STALE_BLOCKING_DEPENDENCY",
                    Phase = 4,
                    Title = "GTM Strategy Update Available",
                    Description = "Target customer segments or pricing tiers have been updated upstream.",
                    Href = Route("/dashboard/creator/phase-4/gtm"),
                    Severity = "warning"
                });
            }
            if (string.Equals(p4.Roadmap?.Status, "Stale", StringComparison.OrdinalIgnoreCase))
            {
                items.Add(new DashboardAttentionItemDto
                {
                    Id = "roadmap-allocation-stale",
                    Type = "STALE_BLOCKING_DEPENDENCY",
                    Phase = 4,
                    Title = "Roadmap Schedule Needs Review",
                    Description = "Founder availability or upstream compliance deadlines have changed.",
                    Href = Route("/dashboard/creator/phase-4/roadmap"),
                    Severity = "warning"
                });
            }
            if (string.Equals(p4.ConstructionSnapshot?.Status, "Stale", StringComparison.OrdinalIgnoreCase))
            {
                items.Add(new DashboardAttentionItemDto
                {
                    Id = "snapshot-stale",
                    Type = "STALE_BLOCKING_DEPENDENCY",
                    Phase = 4,
                    Title = "Snapshot Update Available",
                    Description = "New venture outputs generated since your last construction assessment.",
                    Href = Route("/dashboard/creator/phase-4/construction-snapshot"),
                    Severity = "info"
                });
            }

            // 4. NEEDS_REVIEW
            if (p4.ConstructionSnapshot?.CriticalItems != null && p4.ConstructionSnapshot.CriticalItems.Any())
            {
                items.Add(new DashboardAttentionItemDto
                {
                    Id = "snapshot-critical-items",
                    Type = "NEEDS_REVIEW",
                    Phase = 4,
                    Title = $"{p4.ConstructionSnapshot.CriticalItems.Count} Critical Gaps in Construction",
                    Description = "Key statutory, financial, or technical prerequisites are missing.",
                    Href = Route("/dashboard/creator/phase-4/construction-snapshot"),
                    Severity = "warning"
                });
            }

            // 5. VALIDATION_REQUIRED
            if (p4.PricingStrategy?.Status == PricingStatus.NeedsValidation || p4.PricingStrategy?.LaunchRecommendation?.ValidationRequired == true)
            {
                items.Add(new DashboardAttentionItemDto
                {
                    Id = "pricing-needs-validation",
                    Type = "VALIDATION_REQUIRED",
                    Phase = 4,
                    Title = "Pricing Strategy Needs Validation",
                    Description = "Selected pricing requires review against calculated unit cost floors.",
                    Href = Route("/dashboard/creator/phase-4/pricing"),
                    Severity = "info"
                });
            }
            if (profile?.VentureContext == null || string.IsNullOrWhiteSpace(profile.VentureContext.WeeklyAvailability))
            {
                items.Add(new DashboardAttentionItemDto
                {
                    Id = "profile-availability-missing",
                    Type = "VALIDATION_REQUIRED",
                    Phase = 4,
                    Title = "Founder Weekly Availability Unset",
                    Description = "Specify your weekly available hours so the Roadmap engine can bound your task schedule.",
                    Href = Route("/dashboard/creator/profile"),
                    Severity = "info"
                });
            }

            // Sort by priority order: BLOCKED -> LEGAL_UPDATE -> STALE -> NEEDS_REVIEW -> VALIDATION -> INFO
            int PriorityRank(string type) => type switch
            {
                "BLOCKED" => 1,
                "LEGAL_UPDATE" => 2,
                "STALE_BLOCKING_DEPENDENCY" => 3,
                "NEEDS_REVIEW" => 4,
                "VALIDATION_REQUIRED" => 5,
                _ => 6
            };

            return items
                .OrderBy(i => PriorityRank(i.Type))
                .Take(5)
                .ToList();
        }

        private static DashboardJourneyOverviewDto BuildJourneyOverview(
            ComputedJourneyStatus computed,
            CreatorJourney journey,
            Phase4CompletionResult p4Eval)
        {
            var p3 = journey.Phase3Data;
            var p4 = journey.Phase4Data ?? new CreatorPhase4Data();

            // Determine completed phases count among 2, 3, 4, 5
            int completedCount = 0;
            if (computed.Phase2.Status == "completed") completedCount++;
            if (computed.Phase3.Status == "completed") completedCount++;
            if (computed.Phase4.Status == "completed") completedCount++;
            if (computed.Phase5.Status == "completed") completedCount++;

            int currentPhaseNumber = 2;
            if (computed.Phase2.Status != "completed") currentPhaseNumber = 2;
            else if (computed.Phase3.Status != "completed") currentPhaseNumber = 3;
            else if (computed.Phase4.Status != "completed") currentPhaseNumber = 4;
            else currentPhaseNumber = 5;

            var phases = new List<DashboardPhaseMilestoneDto>();

            // Phase 2
            phases.Add(new DashboardPhaseMilestoneDto
            {
                PhaseNumber = 2,
                Title = "Project Identity & Branding",
                ShortName = "Identity & Brand",
                Status = computed.Phase2.Status,
                CurrentStep = computed.Phase2.CurrentStep,
                TotalSteps = 7,
                Href = "/dashboard/creator/phase-2"
            });

            // Phase 3 with 7 substages
            var p3Substages = new List<DashboardSubstageDto>
            {
                new() { Key = "3.1", Label = "Market Study", Status = !string.IsNullOrEmpty(p3?.MarketStudySessionId) ? "complete" : "in_progress", Href = "/dashboard/creator/phase-3/market-study" },
                new() { Key = "3.2", Label = "Business Model", Status = !string.IsNullOrEmpty(p3?.BusinessModelSessionId) ? "complete" : (!string.IsNullOrEmpty(p3?.MarketStudySessionId) ? "in_progress" : "locked"), Href = "/dashboard/creator/phase-3/business-model" },
                new() { Key = "3.3", Label = "Financial Forecast", Status = !string.IsNullOrEmpty(p3?.ForecastSessionId) ? "complete" : (!string.IsNullOrEmpty(p3?.BusinessModelSessionId) ? "in_progress" : "locked"), Href = "/dashboard/creator/phase-3/forecast" },
                new() { Key = "3.4", Label = "Legal & Compliance", Status = p3?.LegalAssessment != null ? (p3.LegalAssessment.IsPotentiallyOutdated ? "needs_review" : "complete") : (!string.IsNullOrEmpty(p3?.ForecastSessionId) ? "in_progress" : "locked"), Href = "/dashboard/creator/phase-3/compliance" },
                new() { Key = "3.5", Label = "Formation & Team", Status = p3?.FormationGenerator != null ? "complete" : (p3?.LegalAssessment != null ? "in_progress" : "locked"), Href = "/dashboard/creator/phase-3/formation" },
                new() { Key = "3.6", Label = "Business Plan", Status = !string.IsNullOrEmpty(p3?.BusinessPlanSessionId) ? "complete" : (p3?.FormationGenerator != null ? "in_progress" : "locked"), Href = "/dashboard/creator/phase-3/business-plan" },
                new() { Key = "3.7", Label = "Investor Readiness", Status = p3?.InvestorReadinessScore != null ? "complete" : (!string.IsNullOrEmpty(p3?.BusinessPlanSessionId) ? "in_progress" : "locked"), Href = "/dashboard/creator/phase-3/complete" },
            };

            phases.Add(new DashboardPhaseMilestoneDto
            {
                PhaseNumber = 3,
                Title = "Business Intelligence",
                ShortName = "Business Intel",
                Status = computed.Phase3.Status,
                CurrentStep = computed.Phase3.CurrentStep,
                TotalSteps = 7,
                Href = "/dashboard/creator/phase-3",
                SubstageProgress = p3Substages
            });

            // Phase 4 with 7 substages
            var p4Substages = new List<DashboardSubstageDto>
            {
                new() { Key = "4.1", Label = "Snapshot", Status = p4Eval.SnapshotResolved ? "complete" : (computed.Phase3.Status == "completed" ? "in_progress" : "locked"), Href = "/dashboard/creator/phase-4/construction-snapshot" },
                new() { Key = "4.2", Label = "Roadmap", Status = p4Eval.RoadmapResolved ? "complete" : (p4Eval.SnapshotResolved ? "in_progress" : "locked"), Href = "/dashboard/creator/phase-4/roadmap" },
                new() { Key = "4.3", Label = "Needs", Status = p4Eval.NeedsResolved ? "complete" : (p4Eval.SnapshotResolved ? "in_progress" : "locked"), Href = "/dashboard/creator/phase-4/needs" },
                new() { Key = "4.4", Label = "Skills", Status = p4Eval.SkillsResolved ? "complete" : (p4Eval.NeedsResolved ? "in_progress" : "locked"), Href = "/dashboard/creator/phase-4/skills" },
                new() { Key = "4.5", Label = "Support", Status = p4Eval.SupportResolved ? "complete" : (p4Eval.SkillsResolved ? "in_progress" : "locked"), Href = "/dashboard/creator/phase-4/support" },
                new() { Key = "4.6", Label = "Pricing", Status = p4Eval.PricingResolved ? "complete" : (p4Eval.SupportResolved ? "in_progress" : "locked"), Href = "/dashboard/creator/phase-4/pricing" },
                new() { Key = "4.7", Label = "GTM", Status = p4Eval.GtmResolved ? "complete" : (p4Eval.PricingResolved ? "in_progress" : "locked"), Href = "/dashboard/creator/phase-4/gtm" },
            };

            phases.Add(new DashboardPhaseMilestoneDto
            {
                PhaseNumber = 4,
                Title = "Construction & Launch Preparation",
                ShortName = "Construction",
                Status = computed.Phase4.Status,
                CurrentStep = computed.Phase4.CurrentStep,
                TotalSteps = 7,
                Href = "/dashboard/creator/phase-4",
                SubstageProgress = p4Substages
            });

            // Phase 5
            phases.Add(new DashboardPhaseMilestoneDto
            {
                PhaseNumber = 5,
                Title = "The Crossroads",
                ShortName = "Crossroads",
                Status = computed.Phase5.Status,
                CurrentStep = 1,
                TotalSteps = 1,
                Href = "/dashboard/creator/crossroads"
            });

            return new DashboardJourneyOverviewDto
            {
                CurrentPhase = currentPhaseNumber,
                CompletedPhasesCount = completedCount,
                TotalPhasesCount = 4,
                Phases = phases
            };
        }

        private static List<DashboardResultItemDto> BuildResultsList(
            CreatorJourney journey,
            BrandKit? brandKit,
            CreatorPhase4Data p4)
        {
            var results = new List<DashboardResultItemDto>();
            var p3 = journey.Phase3Data;

            // BrandKit
            if (brandKit != null)
            {
                bool isCommitted = string.Equals(brandKit.Status, "Committed", StringComparison.OrdinalIgnoreCase)
                                || string.Equals(brandKit.Status, "complete", StringComparison.OrdinalIgnoreCase);
                results.Add(new DashboardResultItemDto
                {
                    Key = "brand_identity",
                    Title = "Brand Identity Package",
                    Phase = 2,
                    Status = isCommitted ? "Ready" : "Draft",
                    UpdatedAt = brandKit.UpdatedAt,
                    IsStale = false,
                    Href = "/dashboard/creator/phase-2/brand-studio",
                    Downloadable = isCommitted,
                    ExportType = "svg"
                });
            }

            // Market Study
            if (!string.IsNullOrEmpty(p3?.MarketStudySessionId))
            {
                results.Add(new DashboardResultItemDto
                {
                    Key = "market_intelligence",
                    Title = "Market Intelligence Report",
                    Phase = 3,
                    Status = "Ready",
                    UpdatedAt = journey.UpdatedAt,
                    IsStale = false,
                    Href = "/dashboard/creator/phase-3/market-study",
                    Downloadable = true,
                    ExportType = "view"
                });
            }

            // Business Model
            if (!string.IsNullOrEmpty(p3?.BusinessModelSessionId))
            {
                results.Add(new DashboardResultItemDto
                {
                    Key = "business_model",
                    Title = "Business Model Canvas",
                    Phase = 3,
                    Status = "Ready",
                    UpdatedAt = journey.UpdatedAt,
                    IsStale = false,
                    Href = "/dashboard/creator/phase-3/business-model",
                    Downloadable = true,
                    ExportType = "view"
                });
            }

            // Forecast
            if (!string.IsNullOrEmpty(p3?.ForecastSessionId))
            {
                results.Add(new DashboardResultItemDto
                {
                    Key = "financial_forecast",
                    Title = "36-Month Financial Forecast",
                    Phase = 3,
                    Status = "Ready",
                    UpdatedAt = journey.UpdatedAt,
                    IsStale = false,
                    Href = "/dashboard/creator/phase-3/forecast",
                    Downloadable = true,
                    ExportType = "pdf"
                });
            }

            // Legal Assessment
            if (p3?.LegalAssessment != null)
            {
                bool isStale = p3.LegalAssessment.StaleMetadata?.IsStale == true;
                results.Add(new DashboardResultItemDto
                {
                    Key = "legal_assessment",
                    Title = "Legal & Regulatory Assessment",
                    Phase = 3,
                    Status = isStale ? "Update Available" : "Ready",
                    UpdatedAt = p3.LegalAssessment.EvaluatedAt,
                    IsStale = isStale,
                    Href = "/dashboard/creator/phase-3/compliance",
                    Downloadable = true,
                    ExportType = "view"
                });
            }

            // Executive Business Plan
            if (!string.IsNullOrEmpty(p3?.BusinessPlanSessionId))
            {
                results.Add(new DashboardResultItemDto
                {
                    Key = "business_plan",
                    Title = "Executive Business Plan",
                    Phase = 3,
                    Status = "Ready",
                    UpdatedAt = journey.UpdatedAt,
                    IsStale = false,
                    Href = "/dashboard/creator/phase-3/business-plan",
                    Downloadable = true,
                    ExportType = "pdf"
                });
            }

            // Phase 4.1 Construction Snapshot (Stage-native: "Completed", "Stale")
            if (p4.ConstructionSnapshot != null 
                && p4.ConstructionSnapshot.GeneratedAt != default 
                && !string.Equals(p4.ConstructionSnapshot.Status, "Draft", StringComparison.OrdinalIgnoreCase))
            {
                bool isStale = string.Equals(p4.ConstructionSnapshot.Status, "Stale", StringComparison.OrdinalIgnoreCase);
                bool hasCritical = p4.ConstructionSnapshot.CriticalItems != null && p4.ConstructionSnapshot.CriticalItems.Any();
                string status = isStale ? "Update Available" : (hasCritical ? "Needs Review" : "Ready");

                results.Add(new DashboardResultItemDto
                {
                    Key = "construction_snapshot",
                    Title = "Construction Snapshot",
                    Phase = 4,
                    Status = status,
                    UpdatedAt = p4.ConstructionSnapshot.UpdatedAt,
                    IsStale = isStale,
                    Href = "/dashboard/creator/phase-4/construction-snapshot",
                    Downloadable = false,
                    ExportType = "view"
                });
            }

            // Phase 4.2 Operational Roadmap (Stage-native: "Active", "Completed", "Stale")
            if (p4.Roadmap != null 
                && p4.Roadmap.GeneratedAt != default 
                && !string.Equals(p4.Roadmap.Status, "Draft", StringComparison.OrdinalIgnoreCase))
            {
                bool isStale = string.Equals(p4.Roadmap.Status, "Stale", StringComparison.OrdinalIgnoreCase);
                bool hasBlocked = p4.Roadmap.Tasks != null && p4.Roadmap.Tasks.Any(t => string.Equals(t.Status, "Blocked", StringComparison.OrdinalIgnoreCase));
                string status = isStale ? "Update Available" : (hasBlocked ? "Needs Review" : "Ready");

                results.Add(new DashboardResultItemDto
                {
                    Key = "operational_roadmap",
                    Title = "Operational Roadmap",
                    Phase = 4,
                    Status = status,
                    UpdatedAt = p4.Roadmap.UpdatedAt,
                    IsStale = isStale,
                    Href = "/dashboard/creator/phase-4/roadmap",
                    Downloadable = false,
                    ExportType = "view"
                });
            }

            // Phase 4.3 Needs Analysis (Stage-native: "Completed", "Stale")
            if (p4.NeedsAnalysis != null 
                && p4.NeedsAnalysis.GeneratedAt != default 
                && !string.Equals(p4.NeedsAnalysis.Status, "Draft", StringComparison.OrdinalIgnoreCase))
            {
                bool isStale = string.Equals(p4.NeedsAnalysis.Status, "Stale", StringComparison.OrdinalIgnoreCase);
                string status = isStale ? "Update Available" : "Ready";

                results.Add(new DashboardResultItemDto
                {
                    Key = "needs_analysis",
                    Title = "Needs & Requirements Matrix",
                    Phase = 4,
                    Status = status,
                    UpdatedAt = p4.NeedsAnalysis.UpdatedAt,
                    IsStale = isStale,
                    Href = "/dashboard/creator/phase-4/needs",
                    Downloadable = false,
                    ExportType = "view"
                });
            }

            // Phase 4.4 Skills Plan (Stage-native: "Completed", "Stale"; 0 skill gaps is valid resolved)
            if (p4.SkillsPlan != null 
                && p4.SkillsPlan.GeneratedAt != default 
                && !string.Equals(p4.SkillsPlan.Status, "Draft", StringComparison.OrdinalIgnoreCase))
            {
                bool isStale = string.Equals(p4.SkillsPlan.Status, "Stale", StringComparison.OrdinalIgnoreCase);
                string status = isStale ? "Update Available" : (p4.SkillsPlan.NeedsReviewCount > 0 ? "Needs Review" : "Ready");

                results.Add(new DashboardResultItemDto
                {
                    Key = "skills_plan",
                    Title = "Skills & Capability Plan",
                    Phase = 4,
                    Status = status,
                    UpdatedAt = p4.SkillsPlan.UpdatedAt,
                    IsStale = isStale,
                    Href = "/dashboard/creator/phase-4/skills",
                    Downloadable = false,
                    ExportType = "view"
                });
            }

            // Phase 4.5 Support Plan (Stage-native: "Generated", "Refreshed", "Stale"; 0 matches is valid resolved)
            if (p4.SupportPlan != null 
                && p4.SupportPlan.GeneratedAt != default 
                && !string.IsNullOrWhiteSpace(p4.SupportPlan.Status) 
                && !string.Equals(p4.SupportPlan.Status, "Draft", StringComparison.OrdinalIgnoreCase))
            {
                bool isStale = string.Equals(p4.SupportPlan.Status, "Stale", StringComparison.OrdinalIgnoreCase);
                string status = isStale ? "Update Available" : "Ready";

                results.Add(new DashboardResultItemDto
                {
                    Key = "support_plan",
                    Title = "Public Support & Grants Portfolio",
                    Phase = 4,
                    Status = status,
                    UpdatedAt = p4.SupportPlan.UpdatedAt,
                    IsStale = isStale,
                    Href = "/dashboard/creator/phase-4/support",
                    Downloadable = false,
                    ExportType = "view"
                });
            }

            // Phase 4.6 Pricing Strategy (Stage-native enum: Generated, Refreshed, NeedsValidation, Stale)
            if (p4.PricingStrategy != null 
                && p4.PricingStrategy.GeneratedAt != default 
                && p4.PricingStrategy.Status != PricingStatus.Draft)
            {
                bool isStale = p4.PricingStrategy.Status == PricingStatus.Stale;
                string status = isStale 
                    ? "Update Available" 
                    : (p4.PricingStrategy.Status == PricingStatus.NeedsValidation ? "Needs Validation" : "Ready");

                results.Add(new DashboardResultItemDto
                {
                    Key = "pricing_strategy",
                    Title = "Pricing & Revenue Strategy",
                    Phase = 4,
                    Status = status,
                    UpdatedAt = p4.PricingStrategy.UpdatedAt,
                    IsStale = isStale,
                    Href = "/dashboard/creator/phase-4/pricing",
                    Downloadable = false,
                    ExportType = "view"
                });
            }

            // Phase 4.7 GTM Strategy (Stage-native: "Valid", "Generated", "Stale"; validation-first: "Needs Validation")
            if (p4.GtmStrategy != null 
                && p4.GtmStrategy.GeneratedAt != default 
                && !string.IsNullOrWhiteSpace(p4.GtmStrategy.Status) 
                && !string.Equals(p4.GtmStrategy.Status, "Draft", StringComparison.OrdinalIgnoreCase))
            {
                bool isStale = string.Equals(p4.GtmStrategy.Status, "Stale", StringComparison.OrdinalIgnoreCase);
                bool needsValidation = p4.GtmStrategy.PricingValidationRequired || p4.GtmStrategy.CapacityWarningActive;
                string status = isStale 
                    ? "Update Available" 
                    : (needsValidation ? "Needs Validation" : "Ready");

                results.Add(new DashboardResultItemDto
                {
                    Key = "gtm_strategy",
                    Title = "GTM & Launch Strategy",
                    Phase = 4,
                    Status = status,
                    UpdatedAt = p4.GtmStrategy.UpdatedAt,
                    IsStale = isStale,
                    Href = "/dashboard/creator/phase-4/gtm",
                    Downloadable = false,
                    ExportType = "view"
                });
            }

            return results;
        }

        private static DashboardPhase5SummaryDto BuildPhase5Summary(
            ComputedJourneyStatus computed,
            CreatorJourney journey,
            Phase4CompletionResult p4Eval,
            string? ideaId = null)
        {
            bool isUnlocked = p4Eval.IsComplete;
            string href = string.IsNullOrEmpty(ideaId) 
                ? "/dashboard/creator/crossroads" 
                : $"/dashboard/creator/crossroads?ideaId={ideaId}";

            return new DashboardPhase5SummaryDto
            {
                IsUnlocked = isUnlocked,
                ChosenPath = journey.Phase5Data?.ChosenPath,
                Status = computed.Phase5.Status,
                Href = href,
                GuidanceText = isUnlocked 
                    ? "Construction stages complete. Proceed to Crossroads to select your venture launch path."
                    : "Complete all 7 Construction stages to unlock Phase 5 Crossroads."
            };
        }
    }
}
