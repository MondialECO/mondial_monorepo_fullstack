using System;
using System.Collections.Generic;
using System.Linq;
using WebApp.Models.DatabaseModels.Phase4;
using WebApp.Models.Phase4;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations
{
    public class GtmPolicyEngine : IGtmPolicyEngine
    {
        private readonly IFounderCapacityResolver _capacityResolver;

        public GtmPolicyEngine(IFounderCapacityResolver? capacityResolver = null)
        {
            _capacityResolver = capacityResolver ?? new FounderCapacityResolver();
        }

        // =========================================================================
        // 1. SEGMENT PRIORITIZATION (Multi-Sided & ICP/Persona)
        // =========================================================================

        public (string PrimarySegment, List<GtmSegmentStrategy> SegmentStrategies) PrioritizeSegments(GtmContext context)
        {
            var strategies = new List<GtmSegmentStrategy>();
            var rawSegments = context.TargetSegments.Count > 0
                ? context.TargetSegments
                : new List<GtmSegmentItem>
                {
                    new()
                    {
                        Name = !string.IsNullOrWhiteSpace(context.Project.TargetUser)
                            ? context.Project.TargetUser
                            : "Early Adopter Segment",
                        Details = "Core initial target audience",
                        Accessibility = "Direct outreach & community channels",
                        WillingnessToPay = "Indicative willingness based on problem pain"
                    }
                };

            // Detect Multi-Sided Marketplace / Platform
            var sector = context.Project.Sector.ToLowerInvariant();
            var solution = context.Project.Solution.ToLowerInvariant();
            var problem = context.Project.Problem.ToLowerInvariant();
            bool isMarketplace = sector.Contains("marketplace") ||
                                solution.Contains("marketplace") ||
                                solution.Contains("platform connecting") ||
                                rawSegments.Any(s => s.IsSupplySide || s.IsDemandSide) ||
                                (rawSegments.Any(s => s.Name.ToLowerInvariant().Contains("provider") || s.Name.ToLowerInvariant().Contains("freelancer") || s.Name.ToLowerInvariant().Contains("host") || s.Name.ToLowerInvariant().Contains("supply")) &&
                                 rawSegments.Any(s => s.Name.ToLowerInvariant().Contains("client") || s.Name.ToLowerInvariant().Contains("customer") || s.Name.ToLowerInvariant().Contains("buyer") || s.Name.ToLowerInvariant().Contains("demand")));

            // Match offers from Phase 4.6
            var defaultOffer = context.Offers.FirstOrDefault();

            if (isMarketplace)
            {
                // Multi-sided launch strategy: Side A (Supply) & Side B (Demand)
                var supplySegment = rawSegments.FirstOrDefault(s => s.IsSupplySide ||
                                                                    s.Name.ToLowerInvariant().Contains("provider") ||
                                                                    s.Name.ToLowerInvariant().Contains("freelancer") ||
                                                                    s.Name.ToLowerInvariant().Contains("host") ||
                                                                    s.Name.ToLowerInvariant().Contains("supply"))
                                    ?? rawSegments.First();

                var demandSegment = rawSegments.FirstOrDefault(s => (s.IsDemandSide ||
                                                                     s.Name.ToLowerInvariant().Contains("client") ||
                                                                     s.Name.ToLowerInvariant().Contains("customer") ||
                                                                     s.Name.ToLowerInvariant().Contains("buyer") ||
                                                                     s.Name.ToLowerInvariant().Contains("demand")) &&
                                                                    s != supplySegment)
                                    ?? (rawSegments.Count > 1 ? rawSegments[1] : new GtmSegmentItem { Name = "Demand Side Customers", Details = "Buyers/Consumers" });

                // Supply side strategy (Usually recruited first for marketplace liquidity)
                var supplyStrategy = BuildSegmentStrategy(
                    supplySegment,
                    SegmentPriority.Primary,
                    "SupplySide",
                    "Supply liquidity must be established before demand acquisition to prevent empty-search churn.",
                    context,
                    defaultOffer);
                strategies.Add(supplyStrategy);

                // Demand side strategy
                var demandStrategy = BuildSegmentStrategy(
                    demandSegment,
                    SegmentPriority.Secondary,
                    "DemandSide",
                    "Demand activation follows initial supply density to ensure high conversion and retention.",
                    context,
                    defaultOffer);
                strategies.Add(demandStrategy);

                // Any remaining segments
                foreach (var extra in rawSegments.Where(s => s != supplySegment && s != demandSegment))
                {
                    strategies.Add(BuildSegmentStrategy(extra, SegmentPriority.Later, "Expansion", "Expansion audience planned post-liquidity.", context, defaultOffer));
                }

                return (supplyStrategy.SegmentName, strategies);
            }
            else
            {
                // Single primary launch segment
                for (int i = 0; i < rawSegments.Count; i++)
                {
                    var seg = rawSegments[i];
                    var priority = i == 0 ? SegmentPriority.Primary : (i == 1 ? SegmentPriority.Secondary : SegmentPriority.Later);
                    var whyNow = i == 0
                        ? "Highest initial accessibility, concentrated problem intensity, and shortest feedback loop."
                        : "Secondary expansion tier after validating initial offer and unit economics with the primary segment.";

                    strategies.Add(BuildSegmentStrategy(seg, priority, "SingleAudience", whyNow, context, defaultOffer));
                }

                var primaryName = strategies.First().SegmentName;
                return (primaryName, strategies);
            }
        }

        private GtmSegmentStrategy BuildSegmentStrategy(
            GtmSegmentItem seg,
            SegmentPriority priority,
            string sideRole,
            string whyNow,
            GtmContext context,
            GtmOfferItem? defaultOffer)
        {
            // Offer selection: match by target segment or use default
            var matchedOffer = context.Offers.FirstOrDefault(o =>
                !string.IsNullOrEmpty(o.TargetSegment) &&
                o.TargetSegment.ToLowerInvariant().Contains(seg.Name.ToLowerInvariant()))
                ?? defaultOffer;

            decimal price = 0;
            bool isFounderPrice = false;
            string offerKey = "standard-offer";

            if (matchedOffer != null)
            {
                offerKey = matchedOffer.Key;
                if (matchedOffer.FounderSelectedPrice.HasValue && matchedOffer.FounderSelectedPrice.Value > 0)
                {
                    price = matchedOffer.FounderSelectedPrice.Value;
                    isFounderPrice = true;
                }
                else
                {
                    price = matchedOffer.RecommendedPrice;
                    isFounderPrice = false;
                }
            }

            var problem = !string.IsNullOrWhiteSpace(seg.PainPoints)
                ? seg.PainPoints
                : (!string.IsNullOrWhiteSpace(context.Project.Problem) ? context.Project.Problem : "Core operational bottleneck");

            var valueProp = context.ValuePropositions.Count > 0
                ? context.ValuePropositions.First()
                : (!string.IsNullOrWhiteSpace(context.Project.Solution) ? context.Project.Solution : "Practical automated workflow solution");

            var strategy = new GtmSegmentStrategy
            {
                SegmentKey = $"gtm.segment.{Slugify(seg.Name)}",
                SegmentName = seg.Name,
                Priority = priority,
                SideRole = sideRole,
                WhyNow = whyNow,
                Problem = problem,
                DesiredOutcome = "Rapid operational efficiency and predictable outcome delivery",
                ValueProposition = valueProp,
                OfferKey = offerKey,
                SelectedPrice = price,
                IsFounderPrice = isFounderPrice,
                PrimaryMessage = $"Solve {problem} with focused, verified delivery.",
                KeyObjections = new List<string>
                {
                    "Time investment required for transition or onboarding",
                    "Certainty of measurable business return before commitment",
                    "Trust and credibility in early-stage solution delivery"
                },
                ReachabilityEvidence = new List<string>
                {
                    !string.IsNullOrWhiteSpace(seg.Accessibility) ? seg.Accessibility : "Direct founder network, sector communities, and outbound engagement"
                },
                ValidationStatus = context.PricingValidationStatus == PricingConfidence.NeedsValidation
                    ? GtmConfidence.NeedsValidation
                    : GtmConfidence.Supported,
                SourceReferences = new List<string> { "Phase 3.1 Market Study", "Phase 3.2 Business Model", "Phase 4.6 Pricing Strategy" }
            };

            // ICP vs Persona distinction
            bool isB2B = context.Project.Sector.ToLowerInvariant().Contains("b2b") ||
                         context.Project.Category.ToLowerInvariant().Contains("b2b") ||
                         seg.Name.ToLowerInvariant().Contains("sme") ||
                         seg.Name.ToLowerInvariant().Contains("business") ||
                         seg.Name.ToLowerInvariant().Contains("enterprise") ||
                         seg.Name.ToLowerInvariant().Contains("company");

            if (isB2B)
            {
                strategy.CompanyIcpDescription = $"{seg.Name} with 10–250 employees facing {problem} in {context.Project.Geography}.";
                strategy.PersonaBuyer = !string.IsNullOrWhiteSpace(seg.BuyerPersona) ? seg.BuyerPersona : "Managing Director / Business Owner";
                strategy.PersonaDecisionMaker = !string.IsNullOrWhiteSpace(seg.DecisionMakerPersona) ? seg.DecisionMakerPersona : "Chief Operating Officer / Finance Director";
                strategy.PersonaUser = !string.IsNullOrWhiteSpace(seg.UserPersona) ? seg.UserPersona : "Operations Manager / Team Lead";
                strategy.PersonaInfluencer = "External Advisor / Sector Peer";
            }
            else
            {
                strategy.CompanyIcpDescription = "Direct Individual Customer / Professional";
                strategy.PersonaBuyer = "Individual Decision Maker";
                strategy.PersonaDecisionMaker = "Self";
                strategy.PersonaUser = "End User";
                strategy.PersonaInfluencer = "Social Community / Sector Recommender";
            }

            return strategy;
        }

        // =========================================================================
        // 2. POSITIONING & MESSAGING HIERARCHY
        // =========================================================================

        public GtmPositioningStrategy AdaptPositioning(GtmContext context, GtmSegmentStrategy primarySegment)
        {
            var target = !string.IsNullOrWhiteSpace(primarySegment.SegmentName) ? primarySegment.SegmentName : context.Project.TargetUser;
            var coreProblem = !string.IsNullOrWhiteSpace(primarySegment.Problem) ? primarySegment.Problem : context.Project.Problem;
            var category = !string.IsNullOrWhiteSpace(context.PositioningCategory) ? context.PositioningCategory : context.Project.Category;
            var promise = !string.IsNullOrWhiteSpace(context.PrimaryPromise)
                ? context.PrimaryPromise
                : (!string.IsNullOrWhiteSpace(context.Project.Solution) ? context.Project.Solution : "Guaranteed business workflow execution");
            var diff = !string.IsNullOrWhiteSpace(context.Differentiator)
                ? context.Differentiator
                : (!string.IsNullOrWhiteSpace(context.Project.CreatorEdge) ? context.Project.CreatorEdge : "Tailored, hands-on architecture with transparent pricing");

            return new GtmPositioningStrategy
            {
                TargetCustomer = target,
                CoreProblem = coreProblem,
                Category = category,
                PrimaryPromise = promise,
                Differentiator = diff,
                Evidence = !string.IsNullOrWhiteSpace(context.EvidencePoints) ? context.EvidencePoints : "Validated Phase 3 Market Study & benchmark alignment",
                CallToActionIntent = "Book an exploratory pilot discovery conversation",
                PositioningMismatch = false,
                SupportingMessages = new List<string>
                {
                    $"Engineered specifically for {target} dealing with {coreProblem}.",
                    $"Eliminates hidden overhead through {diff}.",
                    "Structured for rapid onboarding with zero long-term lock-in risk."
                },
                ProofPoints = new List<string>
                {
                    "Transparent unit economics derived in Phase 4.6 commercial pricing model.",
                    "Direct founder-led milestone reviews and verified delivery SLA."
                },
                Objections = new List<string>
                {
                    "Is the solution proven for businesses of our size?",
                    "What happens if our operational volume fluctuates?",
                    "How quickly can we see positive cash/operational return?"
                },
                ResponseAngles = new List<string>
                {
                    "Structured low-commitment pilot tier specifically tailored for initial evaluation.",
                    "Flexible scaling parameters grounded in clear unit economics.",
                    "Immediate benchmarked efficiency gains within the first 30 days."
                }
            };
        }

        // =========================================================================
        // 3. MULTI-SIGNAL SALES MOTION (Refinement 5)
        // =========================================================================

        public (SalesMotion Motion, SalesMotionContext MotionContext) DetermineSalesMotion(GtmContext context, GtmSegmentStrategy primarySegment)
        {
            var sector = context.Project.Sector.ToLowerInvariant();
            var category = context.Project.Category.ToLowerInvariant();
            var segName = primarySegment.SegmentName.ToLowerInvariant();

            bool isB2B = sector.Contains("b2b") || category.Contains("b2b") ||
                         segName.Contains("sme") || segName.Contains("enterprise") || segName.Contains("business");

            bool isMarketplace = sector.Contains("marketplace") || context.Project.Solution.ToLowerInvariant().Contains("marketplace") ||
                                primarySegment.SideRole == "SupplySide" || primarySegment.SideRole == "DemandSide";

            decimal price = primarySegment.SelectedPrice;

            // Multi-signal context construction
            var motionContext = new SalesMotionContext
            {
                CustomerType = isMarketplace ? "Marketplace" : (isB2B ? "B2B" : "B2C"),
                ReferencePrice = price,
                BuyingComplexity = isB2B ? (price > 1000 ? "High" : "Medium") : "Low",
                DecisionMakerCount = isB2B ? (price > 2500 ? 3 : 2) : 1,
                OfferComplexity = isB2B ? "Configurable" : "Standardized",
                ImplementationEffort = isB2B ? (price > 1000 ? "Assisted" : "SelfServe") : "Instant",
                ContractValueBasis = price > 5000 ? "HighTicket" : (price > 500 ? "Mid" : "Low"),
                SalesCycleEvidence = isB2B ? "Estimated 2–4 weeks based on discovery calls" : "Immediate / self-serve checkout",
                SelfServeFeasibility = !isB2B || (price < 150 && !sector.Contains("consulting")),
                TrustRequirement = isB2B ? "High" : "Standard"
            };

            SalesMotion motion;

            if (isMarketplace)
            {
                motion = SalesMotion.Marketplace;
            }
            else if (!isB2B && motionContext.SelfServeFeasibility)
            {
                motion = SalesMotion.SelfServe;
            }
            else if (isB2B)
            {
                // Never decide on price alone! Check buying complexity, decision makers, trust requirement
                if (motionContext.BuyingComplexity == "High" && motionContext.DecisionMakerCount >= 3)
                {
                    motion = SalesMotion.EnterpriseSales;
                }
                else if (motionContext.TrustRequirement == "High" || motionContext.ImplementationEffort == "Assisted")
                {
                    motion = SalesMotion.FounderLedSales;
                }
                else if (motionContext.SelfServeFeasibility)
                {
                    motion = SalesMotion.ProductLed;
                }
                else
                {
                    motion = SalesMotion.ConsultativeSales;
                }
            }
            else
            {
                motion = SalesMotion.SelfServe;
            }

            return (motion, motionContext);
        }

        // =========================================================================
        // 4. CHANNEL EVALUATION & PORTFOLIO (Refinements 1 & 2)
        // =========================================================================

        public List<GtmChannelStrategy> EvaluateChannels(
            GtmContext context,
            GtmSegmentStrategy primarySegment,
            SalesMotion salesMotion,
            FounderCapacityProfile capacity)
        {
            var results = new List<GtmChannelStrategy>();

            bool isB2B = context.Project.Sector.ToLowerInvariant().Contains("b2b") ||
                         context.Project.Category.ToLowerInvariant().Contains("b2b") ||
                         primarySegment.SegmentName.ToLowerInvariant().Contains("sme") ||
                         primarySegment.SegmentName.ToLowerInvariant().Contains("business");

            bool hasBudget = context.Forecast.MarketingBudget.HasValue && context.Forecast.MarketingBudget.Value > 0;
            bool pricingNeedsValidation = context.PricingValidationStatus == PricingConfidence.NeedsValidation;
            bool founderHasSalesSkill = context.FounderCapabilities.Any(c => c.ToLowerInvariant().Contains("sales") || c.ToLowerInvariant().Contains("commercial") || c.ToLowerInvariant().Contains("business"));
            bool adsDelegated = context.DelegatedCapabilities.Any(d => d.ToLowerInvariant().Contains("ads") || d.ToLowerInvariant().Contains("marketing"));

            // Capacity constraints from Refinement 1
            bool isLowCapacity = capacity.Tier == CapacityTier.VeryLight; // <5h/w

            // 1. Founder-Led Sales / Direct Outreach (Top B2B recommendation)
            if (isB2B || salesMotion == SalesMotion.FounderLedSales || salesMotion == SalesMotion.ConsultativeSales)
            {
                var reasons = new List<GtmRecommendationReason>
                {
                    GtmRecommendationReason.SEGMENT_REACHABLE,
                    GtmRecommendationReason.SALES_MOTION_MATCH,
                    GtmRecommendationReason.PRICE_MODEL_MATCH
                };

                if (founderHasSalesSkill) reasons.Add(GtmRecommendationReason.FOUNDER_CAPABILITY_MATCH);
                if (pricingNeedsValidation) reasons.Add(GtmRecommendationReason.PRICE_NOT_VALIDATED);
                if (!hasBudget) reasons.Add(GtmRecommendationReason.BUDGET_NOT_CONFIRMED);

                var (effort, load) = _capacityResolver.GetChannelEffortWeight(GtmChannelType.FounderLedSales, ChannelExecutionMode.FounderLed);

                results.Add(new GtmChannelStrategy
                {
                    Key = "gtm.channel.founder-led-sales",
                    Channel = GtmChannelType.FounderLedSales,
                    ChannelName = "Founder-Led Direct Sales",
                    TargetSegment = primarySegment.SegmentName,
                    Objective = pricingNeedsValidation
                        ? "Conduct 10 qualitative discovery conversations to validate willingness-to-pay and offer response."
                        : "Secure first 3 paid pilot contracts through structured consultative discovery.",
                    WhyThisChannel = "Direct founder conversations provide immediate qualitative feedback on value proposition and price floor acceptance.",
                    WhyNow = "Early-stage commercial validation requires zero intermediary friction and direct objection discovery.",
                    WhyNotOther = "Automated channels cannot explain nuanced early-stage value propositions or gather unprompted buyer objections.",
                    ReasonCodes = reasons,
                    Stage = LaunchStage.PreLaunch,
                    Priority = ChannelPriority.Now,
                    Owner = "Founder",
                    ExecutionMode = ChannelExecutionMode.FounderLed,
                    EffortLevel = effort,
                    LoadPoints = load,
                    TimeRequirement = isLowCapacity ? "3–4h/week (strictly 3 target accounts)" : "6–8h/week (10 target accounts)",
                    Preconditions = new List<string> { "One-page executive briefing memo", "Defined qualification scorecard" },
                    KeyActions = new List<string>
                    {
                        "Identify 15 target accounts matching ICP profile",
                        "Send personalized conversational invitation via LinkedIn / Direct Network",
                        "Conduct structured 25-minute exploratory discovery session"
                    },
                    Metrics = new List<string> { "Discovery Calls Completed", "Pilot Expressions of Interest", "Offer Objections Logged" },
                    StopConditions = new List<string> { "0 discovery calls booked after 25 personalized invitations", "Persistent core problem rejection across 5 consecutive calls" },
                    ScaleConditions = new List<string> { "3 paid commitments secured", "Repeatable qualification criteria confirmed" },
                    Evidence = new List<string> { "Phase 3.1 Market Study Pain Severity", "Phase 4.6 Price Floor Model" },
                    Confidence = GtmConfidence.Supported
                });
            }

            // 2. LinkedIn / Content Marketing (Secondary Supporting Channel)
            {
                var reasons = new List<GtmRecommendationReason>
                {
                    GtmRecommendationReason.SEGMENT_REACHABLE,
                    GtmRecommendationReason.SEARCH_INTENT_SUPPORTED
                };
                if (isLowCapacity) reasons.Add(GtmRecommendationReason.LOW_FOUNDER_CAPACITY);

                var (effort, load) = _capacityResolver.GetChannelEffortWeight(GtmChannelType.ContentMarketing, ChannelExecutionMode.FounderLed);

                results.Add(new GtmChannelStrategy
                {
                    Key = "gtm.channel.organic-content",
                    Channel = isB2B ? GtmChannelType.OrganicSocial : GtmChannelType.ContentMarketing,
                    ChannelName = isB2B ? "LinkedIn Thought Leadership & Case Breakdowns" : "Educational Content Marketing",
                    TargetSegment = primarySegment.SegmentName,
                    Objective = "Build institutional authority and nurture outbound warm familiarity.",
                    WhyThisChannel = "Decision makers evaluate founder domain expertise before responding to commercial overtures.",
                    WhyNow = "Establishes a public point of reference while initial outbound conversations are underway.",
                    WhyNotOther = "Paid media burns budget prematurely before message resonance is empirically proven.",
                    ReasonCodes = reasons,
                    Stage = LaunchStage.PreLaunch,
                    Priority = isLowCapacity ? ChannelPriority.Next : ChannelPriority.Next,
                    Owner = "Founder",
                    ExecutionMode = ChannelExecutionMode.FounderLed,
                    EffortLevel = effort,
                    LoadPoints = load,
                    TimeRequirement = isLowCapacity ? "1h/week (1 weekly insight post)" : "3h/week (2 weekly insight posts)",
                    Preconditions = new List<string> { "3 defined content pillars reflecting Phase 3 pain points" },
                    KeyActions = new List<string> { "Publish 1 weekly breakdown of sector operational bottlenecks", "Engage with 5 target peer posts daily" },
                    Metrics = new List<string> { "Profile Inbound Views", "Target Persona Engagements", "Unsolicited DMs" },
                    StopConditions = new List<string> { "Negative feedback from peer community", "Time spend exceeds weekly capacity cap" },
                    ScaleConditions = new List<string> { "5+ qualified inbound inquiries generated over 30 days" },
                    Evidence = new List<string> { "Phase 3.3 Competitive Positioning Differentiation" },
                    Confidence = GtmConfidence.Supported
                });
            }

            // 3. Strategic Partnerships / Communities (Experimental Validation Channel)
            {
                var reasons = new List<GtmRecommendationReason>
                {
                    GtmRecommendationReason.PARTNERSHIP_FIT,
                    GtmRecommendationReason.SEGMENT_REACHABLE
                };

                var (effort, load) = _capacityResolver.GetChannelEffortWeight(GtmChannelType.Partnerships, ChannelExecutionMode.FounderLed);

                results.Add(new GtmChannelStrategy
                {
                    Key = "gtm.channel.partnerships",
                    Channel = GtmChannelType.Partnerships,
                    ChannelName = "Ecosystem Peer & Guild Partnerships",
                    TargetSegment = primarySegment.SegmentName,
                    Objective = "Validate warm referral multiplier via non-competing complementary service providers.",
                    WhyThisChannel = "Complementary advisors already hold trusted access to the target customer base.",
                    WhyNow = "Leverages established trust without requiring upfront customer acquisition ad spend.",
                    WhyNotOther = "More capital-efficient than cold outbound for complex high-trust offerings.",
                    ReasonCodes = reasons,
                    Stage = LaunchStage.SoftLaunch,
                    Priority = ChannelPriority.Experimental,
                    Owner = "Founder",
                    ExecutionMode = ChannelExecutionMode.FounderLed,
                    EffortLevel = effort,
                    LoadPoints = load,
                    TimeRequirement = "2h/week",
                    Preconditions = new List<string> { "Clear partner reciprocity / co-marketing model" },
                    KeyActions = new List<string> { "Map 5 non-competing providers serving the same ICP", "Propose joint knowledge-sharing webinar or co-authored guide" },
                    Metrics = new List<string> { "Partner Discussions Held", "Referral Introductions Received" },
                    StopConditions = new List<string> { "Partners demand prohibitive revenue share or exclusive tie-in" },
                    ScaleConditions = new List<string> { "2+ active co-marketing referrals generated" },
                    Evidence = new List<string> { "Phase 4.5 Ecosystem & Guild Support" },
                    Confidence = GtmConfidence.Provisional
                });
            }

            // 4. Paid Search / Paid Social (Carefully restricted if pricing is unvalidated or budget missing)
            {
                var reasons = new List<GtmRecommendationReason>();
                ChannelPriority paidPriority;
                string whyThis;
                string whyNot;

                if (pricingNeedsValidation)
                {
                    reasons.Add(GtmRecommendationReason.PRICE_NOT_VALIDATED);
                    reasons.Add(GtmRecommendationReason.OFFER_NOT_VALIDATED);
                    paidPriority = ChannelPriority.Later;
                    whyThis = "Paid acquisition is deferred until willingness-to-pay is empirically confirmed.";
                    whyNot = "Scaling paid media with unvalidated pricing burns cash on negative contribution margins.";
                }
                else if (!hasBudget)
                {
                    reasons.Add(GtmRecommendationReason.BUDGET_NOT_CONFIRMED);
                    paidPriority = ChannelPriority.Later;
                    whyThis = "Paid advertising requires confirmed spendable marketing capital.";
                    whyNot = "No spendable marketing budget has been verified yet in Phase 3.4 Forecast.";
                }
                else
                {
                    reasons.Add(GtmRecommendationReason.BUDGET_COMPATIBLE);
                    paidPriority = ChannelPriority.Later; // scale stage
                    whyThis = "Paid acquisition to be tested as a scale channel post-soft launch.";
                    whyNot = "Must validate baseline organic conversion rates first.";
                }

                var execMode = adsDelegated ? ChannelExecutionMode.Delegated : ChannelExecutionMode.Hybrid;
                var (effort, load) = _capacityResolver.GetChannelEffortWeight(GtmChannelType.PaidSearch, execMode);

                results.Add(new GtmChannelStrategy
                {
                    Key = "gtm.channel.paid-acquisition",
                    Channel = GtmChannelType.PaidSearch,
                    ChannelName = "Targeted Intent Paid Search",
                    TargetSegment = primarySegment.SegmentName,
                    Objective = "Capture high-intent search queries once unit economics and landing pages are validated in Phase 4.8.",
                    WhyThisChannel = whyThis,
                    WhyNow = "Deferred to Scale stage post initial validation.",
                    WhyNotOther = whyNot,
                    ReasonCodes = reasons,
                    Stage = LaunchStage.Scale,
                    Priority = paidPriority,
                    Owner = adsDelegated ? "Delegated Specialist" : "Founder / Hybrid",
                    ExecutionMode = execMode,
                    EffortLevel = effort,
                    LoadPoints = load,
                    TimeRequirement = "Deferred",
                    Preconditions = new List<string> { "Validated commercial pricing in Phase 4.6", "Conversion landing page built in Phase 4.8" },
                    KeyActions = new List<string> { "Define negative keyword lists", "Set strictly capped €15/day experimental budget" },
                    Metrics = new List<string> { "Observed CAC", "Cost per Qualified Lead" },
                    StopConditions = new List<string> { "CAC exceeds 40% of first-year LTV", "Cost cap reached without qualified leads" },
                    ScaleConditions = new List<string> { "Observed CAC < Forecast CAC assumption", "Conversion rate exceeds baseline" },
                    Evidence = new List<string> { "Phase 3.4 Financial Forecast Budget Assumption" },
                    Confidence = GtmConfidence.NeedsValidation
                });
            }

            // Calculate total active load
            var profile = _capacityResolver.ResolveCapacityProfile(context.WeeklyAvailability, results);
            foreach (var ch in results)
            {
                if (profile.IsOverloaded && ch.Priority == ChannelPriority.Next)
                {
                    // If founder is severely overloaded, demote lower-priority supporting channel
                    ch.ReasonCodes.Add(GtmRecommendationReason.LOW_FOUNDER_CAPACITY);
                }
            }

            return results;
        }

        // =========================================================================
        // 5. BUDGET PLAN (Refinement 4)
        // =========================================================================

        public GtmBudgetPlan FormulateBudgetPlan(GtmContext context, List<GtmChannelStrategy> channels)
        {
            var plan = new GtmBudgetPlan
            {
                Currency = "EUR",
                ForecastCacAssumption = context.Forecast.ForecastCac,
                ObservedCac = null,
                ValidatedCac = null
            };

            // Check confirmed budget sources
            if (context.ConfirmedGrantBudget.HasValue && context.ConfirmedGrantBudget.Value > 0)
            {
                plan.TotalAvailableBudget = context.ConfirmedGrantBudget.Value;
                plan.BudgetSource = GtmBudgetSourceType.AwardedSupport;
                plan.SpendableStatus = SpendableStatus.ConfirmedAvailable;
                plan.ValidationStatus = GtmBudgetStatus.Confirmed;
                plan.ProvenanceExplanation = $"Confirmed available via verified grant/award of €{context.ConfirmedGrantBudget.Value:N0}.";
            }
            else if (context.Forecast.MarketingBudget.HasValue && context.Forecast.MarketingBudget.Value > 0)
            {
                // Refinement 4: Forecast assumption is PLANNED, NOT confirmed available cash!
                plan.TotalAvailableBudget = context.Forecast.MarketingBudget.Value;
                plan.BudgetSource = GtmBudgetSourceType.ForecastAssumption;
                plan.SpendableStatus = SpendableStatus.Planned;
                plan.ValidationStatus = GtmBudgetStatus.Supported;
                plan.ProvenanceExplanation = $"Forecast assumption from Phase 3.4 Financial Forecast (€{context.Forecast.MarketingBudget.Value:N0} planned). Not confirmed available cash in hand.";
            }
            else
            {
                // Unknown budget: No invented numbers!
                plan.TotalAvailableBudget = null;
                plan.BudgetSource = GtmBudgetSourceType.Unknown;
                plan.SpendableStatus = SpendableStatus.Unknown;
                plan.ValidationStatus = GtmBudgetStatus.NeedsValidation;
                plan.ProvenanceExplanation = "No spendable launch marketing budget confirmed yet. Early GTM focuses strictly on low-cost founder-led validation.";
            }

            // Informational note on potential grants
            if (context.PotentialGrantBudget.HasValue && context.PotentialGrantBudget.Value > 0 && plan.BudgetSource != GtmBudgetSourceType.AwardedSupport)
            {
                plan.ProvenanceExplanation += $" Note: Phase 4.5 shows €{context.PotentialGrantBudget.Value:N0} in potentially eligible support, which is conditional and excluded from spendable GTM budget.";
            }

            // Allocations
            if (plan.TotalAvailableBudget.HasValue && plan.TotalAvailableBudget.Value > 0)
            {
                decimal total = plan.TotalAvailableBudget.Value;
                plan.ExperimentReserve = Math.Round(total * 0.30m, 2);
                plan.Contingency = Math.Round(total * 0.10m, 2);

                decimal channelPool = total - (plan.ExperimentReserve ?? 0) - (plan.Contingency ?? 0);

                plan.ChannelAllocations.Add(new GtmChannelAllocation
                {
                    Channel = GtmChannelType.FounderLedSales,
                    ChannelName = "Founder-Led Sales & Collateral",
                    Amount = Math.Round(channelPool * 0.40m, 2),
                    Percentage = 40,
                    Purpose = "Preparation of discovery briefs, demo environment, and qualification tools"
                });

                plan.ChannelAllocations.Add(new GtmChannelAllocation
                {
                    Channel = GtmChannelType.ContentMarketing,
                    ChannelName = "Authority Content & Case Studies",
                    Amount = Math.Round(channelPool * 0.35m, 2),
                    Percentage = 35,
                    Purpose = "Creation of structured industry insights, benchmarks, and thought leadership"
                });

                plan.ChannelAllocations.Add(new GtmChannelAllocation
                {
                    Channel = GtmChannelType.Partnerships,
                    ChannelName = "Ecosystem Partnerships",
                    Amount = Math.Round(channelPool * 0.25m, 2),
                    Percentage = 25,
                    Purpose = "Co-marketing collateral, joint webinar hosting, and guild sponsorship"
                });
            }

            return plan;
        }

        // =========================================================================
        // 6. VALIDATION EXPERIMENTS (Refinements 3 & 6)
        // =========================================================================

        public List<GtmExperiment> DesignExperiments(
            GtmContext context,
            GtmSegmentStrategy primarySegment,
            List<GtmChannelStrategy> channels,
            GtmBudgetPlan budget)
        {
            var experiments = new List<GtmExperiment>();
            bool pricingNeedsValidation = context.PricingValidationStatus == PricingConfidence.NeedsValidation;

            // Experiment 1: Willingness-To-Pay & Offer Response (Refinement 3)
            var exp1Hypothesis = pricingNeedsValidation
                ? $"Target {primarySegment.SegmentName} will demonstrate willingness-to-pay by committing to an exploratory pilot at €{primarySegment.SelectedPrice} when presented with our core solution to {primarySegment.Problem}."
                : $"Target {primarySegment.SegmentName} will commit to an exploratory pilot at €{primarySegment.SelectedPrice} when presented with our core solution to {primarySegment.Problem}.";

            experiments.Add(new GtmExperiment
            {
                Key = "gtm.experiment.willingness-to-pay-validation",
                Hypothesis = exp1Hypothesis,
                Segment = primarySegment.SegmentName,
                Channel = GtmChannelType.FounderLedSales,
                Offer = primarySegment.OfferKey,
                MessageAngle = primarySegment.PrimaryMessage,
                BudgetCap = 150m,
                Timebox = "3 weeks",
                PrimaryMetric = "Qualified Pilot Commitments",
                TargetValue = null, // No fake percentage! (Refinement 3)
                TargetStatus = ExperimentThresholdStatus.NeedsBaseline,
                SuccessCondition = "Secure 3 paid pilot letters of intent or verbal commitments at the proposed price floor.",
                StopCondition = "5 consecutive target prospects state that the problem does not justify the price floor.",
                EvidenceRequired = "Documented objection log and qualification responses from 10 discovery calls.",
                Status = "Draft"
            });

            // Experiment 2: Value Proposition Resonance Test
            experiments.Add(new GtmExperiment
            {
                Key = "gtm.experiment.value-prop-resonance",
                Hypothesis = $"Framing the solution around operational bottleneck elimination yields a 2x higher engagement rate than generic tool feature messaging.",
                Segment = primarySegment.SegmentName,
                Channel = GtmChannelType.OrganicSocial,
                Offer = primarySegment.OfferKey,
                MessageAngle = "Operational Bottleneck Elimination vs Incremental Feature Utility",
                BudgetCap = 0m,
                Timebox = "2 weeks",
                PrimaryMetric = "Qualitative Inbound Replies / DMs",
                TargetValue = null,
                TargetStatus = ExperimentThresholdStatus.NeedsBaseline,
                SuccessCondition = "At least 3 unsolicited inbound comments or DMs inquiring about specific implementation details.",
                StopCondition = "Zero profile interactions or comments across 4 consecutive structured posts.",
                EvidenceRequired = "Screenshot log of conversations and question topics.",
                Status = "Draft"
            });

            // Experiment 3: Ecosystem Partner Co-Marketing Test
            experiments.Add(new GtmExperiment
            {
                Key = "gtm.experiment.partner-referral-feasibility",
                Hypothesis = "Non-competing advisory peers will introduce 2 target client prospects when offered collaborative co-marketing exposure.",
                Segment = primarySegment.SegmentName,
                Channel = GtmChannelType.Partnerships,
                Offer = primarySegment.OfferKey,
                MessageAngle = "Collaborative Guild Client Advisory",
                BudgetCap = 50m,
                Timebox = "4 weeks",
                PrimaryMetric = "Partner Warm Introductions",
                TargetValue = null,
                TargetStatus = ExperimentThresholdStatus.NeedsBaseline,
                SuccessCondition = "2 completed discovery meetings originating from partner warm introductions.",
                StopCondition = "3 contacted peer advisors decline collaboration due to conflict or lack of mutual value.",
                EvidenceRequired = "Confirmed meeting notes with introduced prospect.",
                Status = "Draft"
            });

            return experiments;
        }

        // =========================================================================
        // 7. MEASUREMENT CONTRACT (Measurement Contract)
        // =========================================================================

        public List<GtmMetricDefinition> SynthesizeMetrics(GtmContext context, SalesMotion salesMotion)
        {
            return new List<GtmMetricDefinition>
            {
                new()
                {
                    Key = "metric.awareness.reach",
                    Name = "Qualified ICP Reach",
                    FunnelStage = "Awareness",
                    Definition = "Total verified unique decision makers exposed to our primary positioning message.",
                    Numerator = "Target Accounts Contacted / Profile Impressions",
                    Denominator = "Total ICP Pool",
                    DataSource = "LinkedIn Analytics / Outreach Tracker",
                    TargetStatus = ExperimentThresholdStatus.NeedsBaseline,
                    MeasurementFrequency = "Weekly"
                },
                new()
                {
                    Key = "metric.interest.discovery-calls",
                    Name = "Discovery Calls Completed",
                    FunnelStage = "Interest",
                    Definition = "Exploratory consultative conversations held with verified decision makers.",
                    Numerator = "Completed Calls",
                    Denominator = "Total Outbound Invitations",
                    DataSource = "Calendar / CRM",
                    TargetStatus = ExperimentThresholdStatus.NeedsBaseline,
                    MeasurementFrequency = "Weekly"
                },
                new()
                {
                    Key = "metric.consideration.pilot-proposals",
                    Name = "Pilot Proposals Requested",
                    FunnelStage = "Consideration",
                    Definition = "Prospects requesting structured commercial terms after discovery.",
                    Numerator = "Proposals Sent",
                    Denominator = "Discovery Calls Completed",
                    DataSource = "Deal Tracker",
                    TargetStatus = ExperimentThresholdStatus.NeedsBaseline,
                    MeasurementFrequency = "Bi-weekly"
                },
                new()
                {
                    Key = "metric.conversion.paid-contracts",
                    Name = "Paid Customer Contracts",
                    FunnelStage = "Conversion",
                    Definition = "Customers signing agreement and paying the commercial price floor.",
                    Numerator = "Signed & Paid Contracts",
                    Denominator = "Proposals Sent",
                    DataSource = "Billing & Contract Archive",
                    TargetStatus = ExperimentThresholdStatus.NeedsBaseline,
                    MeasurementFrequency = "Monthly"
                },
                new()
                {
                    Key = "metric.economics.observed-cac",
                    Name = "Observed CAC",
                    FunnelStage = "Economics",
                    Definition = "True empirically observed acquisition cost per customer.",
                    Numerator = "Total Acquisition Spend (Ads + Software + Direct Sales)",
                    Denominator = "Acquired Customers",
                    DataSource = "Accounting & Sales Tracker",
                    TargetStatus = ExperimentThresholdStatus.NeedsBaseline,
                    MeasurementFrequency = "Monthly"
                }
            };
        }

        // =========================================================================
        // 8. LAUNCH PLAN (Roadmap Linkage)
        // =========================================================================

        public GtmLaunchPlan BuildLaunchPlan(
            GtmContext context,
            GtmSegmentStrategy primarySegment,
            List<GtmChannelStrategy> channels,
            List<GtmExperiment> experiments)
        {
            var plan = new GtmLaunchPlan();

            // Link to existing Phase 4.2 Roadmap task keys if present
            var roadmapKeys = context.RoadmapTasks.Select(t => t.Key).ToList();
            var preLaunchRoadmapKey = roadmapKeys.FirstOrDefault(k => k.Contains("4.2") || k.Contains("now")) ?? "task-phase4-prep";

            // Pre-Launch Actions
            plan.PreLaunch.Add(new GtmLaunchAction
            {
                Key = "gtm.launch.prelaunch.briefing-collateral",
                Stage = LaunchStage.PreLaunch,
                Title = "Synthesize 1-Page Commercial Briefing Memo",
                Objective = "Prepare concise briefing document summarizing target problem, differentiator, and pilot terms.",
                TargetSegment = primarySegment.SegmentName,
                Channel = GtmChannelType.FounderLedSales,
                Owner = "Founder",
                Timing = "Week 1–2",
                RelatedRoadmapTaskKeys = new List<string> { preLaunchRoadmapKey },
                TimeRequirement = "4 hours",
                CompletionCriteria = new List<string> { "Reviewed with 1 trusted external peer", "Pricing floor clearly stated" }
            });

            plan.PreLaunch.Add(new GtmLaunchAction
            {
                Key = "gtm.launch.prelaunch.account-mapping",
                Stage = LaunchStage.PreLaunch,
                Title = "Build Curated 25 Target ICP Account List",
                Objective = "Identify 25 named companies and specific decision-maker profiles matching ICP.",
                TargetSegment = primarySegment.SegmentName,
                Channel = GtmChannelType.FounderLedSales,
                Owner = "Founder",
                Timing = "Week 2",
                RelatedRoadmapTaskKeys = new List<string> { preLaunchRoadmapKey },
                TimeRequirement = "5 hours",
                CompletionCriteria = new List<string> { "Verified decision-maker identity", "Public context notes logged" }
            });

            // Soft-Launch Actions
            plan.SoftLaunch.Add(new GtmLaunchAction
            {
                Key = "gtm.launch.softlaunch.pilot-cohort",
                Stage = LaunchStage.SoftLaunch,
                Title = "Initiate Consultative Pilot Conversations",
                Objective = "Conduct 10 exploratory conversations with target decision makers.",
                TargetSegment = primarySegment.SegmentName,
                Channel = GtmChannelType.FounderLedSales,
                Owner = "Founder",
                Timing = "Week 3–5",
                RelatedRoadmapTaskKeys = new List<string> { preLaunchRoadmapKey },
                TimeRequirement = "6h/week",
                CompletionCriteria = new List<string> { "Objections categorized", "At least 2 pilot commitments secured" }
            });

            // Launch Actions
            plan.Launch.Add(new GtmLaunchAction
            {
                Key = "gtm.launch.launch.pilot-delivery",
                Stage = LaunchStage.Launch,
                Title = "Deliver First Cohort Paid Pilots",
                Objective = "Execute contractual onboarding and monitor initial milestone achievement.",
                TargetSegment = primarySegment.SegmentName,
                Channel = GtmChannelType.FounderLedSales,
                Owner = "Founder",
                Timing = "Week 6–8",
                RelatedRoadmapTaskKeys = new List<string> { preLaunchRoadmapKey },
                TimeRequirement = "10h/week",
                CompletionCriteria = new List<string> { "First recurring or milestone invoice paid", "Documented customer testimonial / proof point" }
            });

            // Post-Launch Actions
            plan.PostLaunch.Add(new GtmLaunchAction
            {
                Key = "gtm.launch.postlaunch.case-study-synthesis",
                Stage = LaunchStage.PostLaunch,
                Title = "Synthesize Case Study & Proof Assets",
                Objective = "Turn initial pilot success into verifiable case study for Phase 4.8 launch assets.",
                TargetSegment = primarySegment.SegmentName,
                Channel = GtmChannelType.ContentMarketing,
                Owner = "Founder",
                Timing = "Week 9–10",
                RelatedRoadmapTaskKeys = new List<string> { preLaunchRoadmapKey },
                TimeRequirement = "4 hours",
                CompletionCriteria = new List<string> { "Verified quantified result", "Client approval for quote/case study" }
            });

            // Scale & Stop criteria
            plan.ScaleCriteria.Add("At least 3 paying customers actively operating with positive contribution margin.");
            plan.ScaleCriteria.Add("Repeatable customer acquisition motion verified with clear unit economics.");
            plan.ScaleCriteria.Add("Weekly founder capacity adequate to support new client onboarding without service degradation.");

            plan.StopConditions.Add("0 pilot commitments after 20 qualified discovery meetings.");
            plan.StopConditions.Add("Acquisition effort continuously exceeds founder weekly availability ceiling.");
            plan.StopConditions.Add("Unresolved core objection regarding pricing or delivery risk.");

            return plan;
        }

        // =========================================================================
        // 9. RISKS & ASSUMPTIONS
        // =========================================================================

        public (List<GtmRisk> Risks, List<GtmAssumption> Assumptions) AssessRisksAndAssumptions(
            GtmContext context,
            List<GtmChannelStrategy> channels,
            FounderCapacityProfile capacity,
            GtmBudgetPlan budget)
        {
            var risks = new List<GtmRisk>();
            var assumptions = new List<GtmAssumption>();

            // Pricing validation risk
            if (context.PricingValidationStatus == PricingConfidence.NeedsValidation)
            {
                risks.Add(new GtmRisk
                {
                    Key = "risk.pricing-not-validated",
                    Type = GtmRiskType.PriceNotValidated,
                    Severity = "High",
                    Description = "Offer price floor has not yet been validated against real customer willingness-to-pay.",
                    Evidence = "Phase 4.6 PricingConfidence is NeedsValidation.",
                    Mitigation = "Run willingness-to-pay validation experiment in Pre-Launch before investing in paid channels.",
                    ValidationRequired = true
                });
            }

            // Budget risk
            if (budget.ValidationStatus == GtmBudgetStatus.NeedsValidation)
            {
                risks.Add(new GtmRisk
                {
                    Key = "risk.budget-unconfirmed",
                    Type = GtmRiskType.BudgetTooLow,
                    Severity = "Medium",
                    Description = "No confirmed spendable marketing capital is currently available.",
                    Evidence = "Phase 3.4 Forecast marketing budget unconfirmed or absent.",
                    Mitigation = "Execute strictly organic and founder-led zero-budget acquisition motions.",
                    ValidationRequired = true
                });
            }

            // Capacity risk
            if (capacity.IsOverloaded)
            {
                risks.Add(new GtmRisk
                {
                    Key = "risk.founder-capacity-overload",
                    Type = GtmRiskType.FounderCapacityRisk,
                    Severity = "High",
                    Description = capacity.CapacityWarning,
                    Evidence = $"Weekly availability is {capacity.RawWeeklyAvailability} ({capacity.EstimatedWeeklyHours}h/w), but selected channels demand {capacity.CurrentLoadPoints} load points.",
                    Mitigation = "Reduce active channels to 1 primary motion or delegate channel execution.",
                    ValidationRequired = false
                });
            }

            // Proof risk
            risks.Add(new GtmRisk
            {
                Key = "risk.no-proof-early-stage",
                Type = GtmRiskType.NoProof,
                Severity = "Medium",
                Description = "New venture lacks historical testimonials or public client case studies.",
                Evidence = "Early stage venture in Phase 4 construction.",
                Mitigation = "Offer structured pilot terms with founder hands-on guarantee in exchange for public case study rights.",
                ValidationRequired = true
            });

            // Core assumptions
            assumptions.Add(new GtmAssumption
            {
                Key = "assumption.problem-intensity",
                Statement = "Target segment views the identified operational bottleneck as urgent enough to allocate budget.",
                Evidence = "Phase 3.1 Market Study problem ranking.",
                Confidence = GtmConfidence.Supported,
                ValidationMethod = "10 Consultative discovery calls.",
                Status = "InTesting"
            });

            assumptions.Add(new GtmAssumption
            {
                Key = "assumption.founder-reachability",
                Statement = "Founder can directly reach decision makers through LinkedIn and professional network without paid list brokerage.",
                Evidence = "Profile network depth & sector accessibility.",
                Confidence = GtmConfidence.Supported,
                ValidationMethod = "25 Outbound personalized invitations.",
                Status = "InTesting"
            });

            assumptions.Add(new GtmAssumption
            {
                Key = "assumption.forecast-cac-validity",
                Statement = $"Forecast CAC of €{context.Forecast.ForecastCac ?? 50:N0} is achievable under scaled market conditions.",
                Evidence = "Phase 3.4 Financial Forecast model assumption.",
                Confidence = GtmConfidence.NeedsValidation,
                ValidationMethod = "Empirical tracking of first 5 closed accounts.",
                Status = "Unvalidated"
            });

            return (risks, assumptions);
        }

        private static string Slugify(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return "default";
            return text.ToLowerInvariant().Replace(" ", "-").Replace("/", "-").Replace("&", "and");
        }
    }
}
