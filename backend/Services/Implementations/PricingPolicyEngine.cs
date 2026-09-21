using System;
using System.Collections.Generic;
using System.Linq;
using WebApp.Models.DatabaseModels.Phase4;
using WebApp.Models.Phase4;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations
{
    public class PricingPolicyEngine : IPricingPolicyEngine
    {
        public (RevenueModelType PrimaryModel, List<string> UnderlyingModels) ResolveRevenueModels(PricingContext context)
        {
            var sector = context.Project.Sector.ToLowerInvariant();
            var problem = context.Project.Problem.ToLowerInvariant();
            var solution = context.Project.Solution.ToLowerInvariant();
            var streams = context.RevenueStreams.Select(s => s.Stream.ToLowerInvariant()).ToList();

            var underlying = new List<string>();

            // 1. Check explicit canvas revenue streams
            bool hasSubscriptionStream = streams.Any(s => s.Contains("subscription") || s.Contains("saas") || s.Contains("recurring") || s.Contains("membership"));
            bool hasCommissionStream = streams.Any(s => s.Contains("commission") || s.Contains("marketplace") || s.Contains("take rate") || s.Contains("transaction fee"));
            bool hasProjectStream = streams.Any(s => s.Contains("project") || s.Contains("consulting") || s.Contains("service") || s.Contains("agency") || s.Contains("audit"));
            bool hasOneTimeStream = streams.Any(s => s.Contains("one-time") || s.Contains("unit sale") || s.Contains("product") || s.Contains("licensing") || s.Contains("hardware"));
            bool hasUsageStream = streams.Any(s => s.Contains("usage") || s.Contains("metered") || s.Contains("api call") || s.Contains("volume"));

            RevenueModelType primaryModel;

            if (hasCommissionStream || sector.Contains("marketplace") || solution.Contains("marketplace") || solution.Contains("platform connecting"))
            {
                primaryModel = RevenueModelType.Commission;
                underlying.Add("Commission");
                if (hasSubscriptionStream) underlying.Add("Subscription");
                if (hasUsageStream) underlying.Add("TransactionFee");
            }
            else if (hasProjectStream || sector.Contains("consulting") || sector.Contains("legal") || sector.Contains("agency") || sector.Contains("service"))
            {
                primaryModel = RevenueModelType.ProjectBased;
                underlying.Add("ProjectFee");
                if (streams.Any(s => s.Contains("retainer"))) underlying.Add("Retainer");
                else underlying.Add("HourlyOrDaily");
            }
            else if (hasSubscriptionStream || sector.Contains("software") || sector.Contains("saas") || sector.Contains("digital") || solution.Contains("platform"))
            {
                primaryModel = RevenueModelType.Subscription;
                underlying.Add("Subscription");
                if (streams.Any(s => s.Contains("setup") || s.Contains("onboarding"))) underlying.Add("SetupFee");
                if (hasUsageStream) underlying.Add("UsageBased");
            }
            else if (hasOneTimeStream || sector.Contains("retail") || sector.Contains("manufacturing") || sector.Contains("e-commerce"))
            {
                primaryModel = RevenueModelType.OneTime;
                underlying.Add("DirectSale");
                if (hasSubscriptionStream) underlying.Add("Subscription");
            }
            else
            {
                // Sector fallback
                primaryModel = RevenueModelType.Subscription;
                underlying.Add("Subscription");
            }

            if (underlying.Count == 0)
            {
                underlying.Add(primaryModel.ToString());
            }

            return (primaryModel, underlying);
        }

        public List<PricingOffer> StructureOffers(PricingContext context, RevenueModelType primaryModel, List<string> underlyingModels)
        {
            var offers = new List<PricingOffer>();
            var segments = context.CustomerSegments.Count > 0
                ? context.CustomerSegments
                : new List<PricingCustomerSegmentItem> { new() { Segment = "Target Customers", Details = "Initial launch segment" } };

            var assumptions = context.ExistingPricingAssumptions;

            // Invariant: Determine tax mode based on customer profile (no invented taxes)
            var inferredTaxMode = DetermineTaxMode(context);
            var currency = "EUR";

            // Determine Variable Cost per unit/delivery
            decimal variableCost = context.CostStructure.EstimatedVariableCostPerUnit;
            if (variableCost <= 0 && context.Forecast.MonthlyVariableCosts.Count > 0)
            {
                var avgMonthlyVar = context.Forecast.MonthlyVariableCosts.Average();
                // If forecast ARPU exists, estimate unit variable cost proportionally
                if (context.Forecast.Arpu.HasValue && context.Forecast.Arpu.Value > 0)
                {
                    variableCost = Math.Round(context.Forecast.Arpu.Value * 0.25m, 2);
                }
            }

            // Case 1: Existing founder/forecast assumptions exist in Phase 3 Business Model
            if (assumptions.Count > 0)
            {
                foreach (var assumption in assumptions)
                {
                    decimal price = 0m;
                    var confidence = PricingConfidence.NeedsValidation;
                    var evidenceType = PriceEvidenceType.NeedsReview;
                    string evidenceRef = "Phase 3 Business Model assumption";

                    // Parse price from assumption if numeric
                    if (assumption.ParsedPrice.HasValue && assumption.ParsedPrice.Value > 0)
                    {
                        price = assumption.ParsedPrice.Value;
                        confidence = PricingConfidence.Supported;
                        evidenceType = PriceEvidenceType.FounderAssumption;
                        evidenceRef = $"Derived from Phase 3 Business Model tier '{assumption.TierName}' ({assumption.Pricing})";
                    }
                    else if (decimal.TryParse(System.Text.RegularExpressions.Regex.Match(assumption.Pricing, @"\d+([.,]\d+)?").Value.Replace(",", "."), out var parsedP) && parsedP > 0)
                    {
                        price = parsedP;
                        confidence = PricingConfidence.Supported;
                        evidenceType = PriceEvidenceType.FounderAssumption;
                        evidenceRef = $"Parsed from Phase 3 tier '{assumption.TierName}' ({assumption.Pricing})";
                    }
                    else if (context.Forecast.Arpu.HasValue && context.Forecast.Arpu.Value > 0)
                    {
                        price = context.Forecast.Arpu.Value;
                        confidence = PricingConfidence.Supported;
                        evidenceType = PriceEvidenceType.ForecastAssumption;
                        evidenceRef = $"Aligned with Phase 3 Financial Forecast ARPU (€{context.Forecast.Arpu.Value:N0}/mo)";
                    }

                    var freq = DetermineFrequency(assumption.Pricing, primaryModel);
                    var segment = !string.IsNullOrWhiteSpace(assumption.TargetSegment) ? assumption.TargetSegment : segments[0].Segment;

                    var cleanKey = SanitizeKey($"pricing.tier.{assumption.TierName.ToLowerInvariant()}");
                    var offer = CreateOffer(
                        cleanKey,
                        assumption.TierName,
                        segment,
                        $"Tailored for {segment} with essential features",
                        assumption.Features.Count > 0 ? assumption.Features : new List<string> { "Core functionality", "Standard support" },
                        primaryModel,
                        freq,
                        price,
                        currency,
                        inferredTaxMode,
                        confidence,
                        evidenceType,
                        evidenceRef,
                        variableCost,
                        context
                    );

                    offers.Add(offer);
                }
            }
            else
            {
                // Case 2: Construct standard segment-aware offers from CustomerSegments & Forecast
                int index = 1;
                foreach (var seg in segments)
                {
                    decimal price = 0m;
                    var confidence = PricingConfidence.NeedsValidation;
                    var evidenceType = PriceEvidenceType.NeedsReview;
                    string evidenceRef = "No prior pricing assumption recorded in Phase 3";

                    if (context.Forecast.Arpu.HasValue && context.Forecast.Arpu.Value > 0)
                    {
                        // Multi-tier differentiation based on segment position
                        var multiplier = index == 1 ? 0.75m : (index == 2 ? 1.25m : 2.5m);
                        price = Math.Round(context.Forecast.Arpu.Value * multiplier, 0);
                        confidence = PricingConfidence.Supported;
                        evidenceType = PriceEvidenceType.ForecastAssumption;
                        evidenceRef = $"Modelled from Phase 3 Forecast ARPU baseline (€{context.Forecast.Arpu.Value:N0}) for segment '{seg.Segment}'";
                    }
                    else if (variableCost > 0)
                    {
                        // Cost-plus fallback floor
                        price = CalculateFloorPrice(variableCost, context.CostStructure.MarginTargetType, context.CostStructure.DefaultRequiredMarginRate, context.CostStructure.DefaultRequiredMarginAmount);
                        confidence = PricingConfidence.Provisional;
                        evidenceType = PriceEvidenceType.CostBased;
                        evidenceRef = $"Cost-based minimum price floor (€{variableCost:N2} variable cost + target contribution margin)";
                    }

                    var tierName = index switch
                    {
                        1 => primaryModel == RevenueModelType.ProjectBased ? "Standard Delivery" : "Starter",
                        2 => primaryModel == RevenueModelType.ProjectBased ? "Comprehensive Delivery" : "Professional",
                        _ => primaryModel == RevenueModelType.ProjectBased ? "Enterprise Retainer" : "Business"
                    };

                    var freq = primaryModel switch
                    {
                        RevenueModelType.ProjectBased => BillingFrequency.Milestone,
                        RevenueModelType.OneTime => BillingFrequency.OneOff,
                        RevenueModelType.Commission => BillingFrequency.PerUse,
                        _ => BillingFrequency.Monthly
                    };

                    var features = new List<string>
                    {
                        $"Full access to core solution for {seg.Segment}",
                        "Standard service level agreement",
                        "Continuous data and reporting updates"
                    };

                    if (index > 1) features.Add("Priority onboarding & dedicated communication channel");
                    if (index > 2) features.Add("Custom integrations & advanced performance analytics");

                    var cleanKey = SanitizeKey($"pricing.segment.{seg.Segment.ToLowerInvariant()}.{tierName.ToLowerInvariant()}");
                    var offer = CreateOffer(
                        cleanKey,
                        tierName,
                        seg.Segment,
                        $"Structured package delivering validated value for {seg.Segment}",
                        features,
                        primaryModel,
                        freq,
                        price,
                        currency,
                        inferredTaxMode,
                        confidence,
                        evidenceType,
                        evidenceRef,
                        variableCost,
                        context
                    );

                    offers.Add(offer);
                    index++;
                    if (index > 3) break; // Maximum 3 differentiated launch tiers
                }
            }

            // Invariant: Verify market price evidence (never conflate market reference with validated market price!)
            foreach (var offer in offers)
            {
                // 1. Check strong empirical validation first (HistoricalSale, PaidPilot, PreOrder, QuoteAccepted)
                var empirical = context.MarketEvidence.FirstOrDefault(e =>
                    e.EvidenceType == MarketPriceEvidenceType.HistoricalSale ||
                    e.EvidenceType == MarketPriceEvidenceType.PaidPilot ||
                    e.EvidenceType == MarketPriceEvidenceType.PreOrder ||
                    e.EvidenceType == MarketPriceEvidenceType.QuoteAccepted);

                if (empirical != null && empirical.Price > 0)
                {
                    offer.ValidatedMarketPrice = empirical.Price;
                    offer.MarketPriceEvidenceType = empirical.EvidenceType;
                    offer.MarketPriceValidationLevel = MarketPriceValidationLevel.EmpiricallyValidated;
                    offer.Confidence = PricingConfidence.Validated;
                }
                else
                {
                    // No empirical evidence -> ValidatedMarketPrice remains null!
                    offer.ValidatedMarketPrice = null;

                    // 2. Check for Market Reference Price (CompetitorObserved, MarketStudyEstimate, ModelEstimate)
                    var matchedComp = context.CompetitorEvidence.FirstOrDefault(c => !string.IsNullOrWhiteSpace(c.EstimatedPrice));
                    if (matchedComp != null && decimal.TryParse(System.Text.RegularExpressions.Regex.Match(matchedComp.EstimatedPrice, @"\d+([.,]\d+)?").Value.Replace(",", "."), out var compP))
                    {
                        offer.MarketReferencePrice = compP;
                        offer.MarketPriceEvidenceType = MarketPriceEvidenceType.CompetitorObserved;
                        offer.MarketPriceValidationLevel = MarketPriceValidationLevel.Supported;
                        // Competitor observation does NOT promote confidence to Validated
                        if (offer.Confidence == PricingConfidence.Validated)
                        {
                            offer.Confidence = PricingConfidence.Supported;
                        }
                    }
                    else
                    {
                        var nonEmpiricalEvidence = context.MarketEvidence.FirstOrDefault(e =>
                            e.EvidenceType == MarketPriceEvidenceType.CompetitorObserved ||
                            e.EvidenceType == MarketPriceEvidenceType.MarketStudyEstimate ||
                            e.EvidenceType == MarketPriceEvidenceType.ModelEstimate ||
                            e.EvidenceType == MarketPriceEvidenceType.CustomerInterview ||
                            e.EvidenceType == MarketPriceEvidenceType.CustomerSurvey);

                        if (nonEmpiricalEvidence != null && nonEmpiricalEvidence.Price > 0)
                        {
                            offer.MarketReferencePrice = nonEmpiricalEvidence.Price;
                            offer.MarketPriceEvidenceType = nonEmpiricalEvidence.EvidenceType;
                            offer.MarketPriceValidationLevel = nonEmpiricalEvidence.EvidenceType == MarketPriceEvidenceType.CompetitorObserved
                                ? MarketPriceValidationLevel.Supported
                                : MarketPriceValidationLevel.Indicative;

                            if (offer.Confidence == PricingConfidence.Validated)
                            {
                                offer.Confidence = nonEmpiricalEvidence.EvidenceType == MarketPriceEvidenceType.CompetitorObserved
                                    ? PricingConfidence.Supported
                                    : PricingConfidence.Provisional;
                            }
                        }
                        else
                        {
                            offer.MarketReferencePrice = null;
                            offer.MarketPriceEvidenceType = MarketPriceEvidenceType.Unknown;
                            offer.MarketPriceValidationLevel = MarketPriceValidationLevel.Unvalidated;
                        }
                    }
                }
            }

            return offers;
        }

        public UnitEconomics CalculateUnitEconomics(
            decimal price,
            decimal variableCost,
            decimal? directCost,
            PricingContext context,
            MarginTargetType marginTargetType,
            decimal targetMargin)
        {
            var ue = new UnitEconomics
            {
                PricePerUnit = price,
                VariableCostPerUnit = variableCost,
                MarginTargetType = marginTargetType
            };

            // Calculate floor
            ue.MinimumPriceFloor = CalculateFloorPrice(variableCost, marginTargetType, targetMargin, targetMargin);

            // Contribution Margin = SellingPrice - VariableCost
            ue.ContributionMargin = price - variableCost;

            // Contribution Margin Rate = ContributionMargin / SellingPrice
            ue.ContributionMarginRate = price > 0 ? Math.Round(ue.ContributionMargin / price, 4) : 0m;

            // Gross Margin if direct delivery cost available
            if (directCost.HasValue && directCost.Value > 0)
            {
                ue.GrossMargin = price - directCost.Value;
                ue.GrossMarginRate = price > 0 ? Math.Round(ue.GrossMargin.Value / price, 4) : null;
            }

            // Break-Even Volume
            if (ue.ContributionMargin > 0 && context.CostStructure.EstimatedMonthlyFixedCosts > 0)
            {
                ue.BreakEvenVolume = (int)Math.Ceiling(context.CostStructure.EstimatedMonthlyFixedCosts / ue.ContributionMargin);
            }

            // Reference LTV and CAC only if authoritative forecast data exists
            if (context.Forecast.Arpu.HasValue && context.Forecast.MonthlyChurnPct.HasValue && context.Forecast.MonthlyChurnPct.Value > 0)
            {
                // LTV = ARPU / (ChurnRate / 100)
                var churnRate = context.Forecast.MonthlyChurnPct.Value / 100m;
                var arpu = price > 0 ? price : context.Forecast.Arpu.Value;
                ue.LTVReference = Math.Round(arpu / churnRate, 2);
            }

            if (context.Forecast.MonthlyOpex.HasValue && context.Forecast.MonthlyGrowthPct.HasValue && context.Forecast.MonthlyGrowthPct.Value > 0)
            {
                // Indicative CAC reference only if modelled
                ue.CACReference = Math.Round(context.Forecast.MonthlyOpex.Value * 0.3m, 2);
                if (ue.LTVReference.HasValue && ue.CACReference.Value > 0)
                {
                    ue.LtvCacRatio = Math.Round((double)(ue.LTVReference.Value / ue.CACReference.Value), 2);
                }
            }

            ue.ValidationStatus = ue.ContributionMargin < 0 ? "BelowCostWarning" : "Supported";

            return ue;
        }

        public ForecastAlignmentDto EvaluateForecastAlignment(PricingOffer offer, PricingContext context)
        {
            var policy = context.MaterialityPolicy ?? new PricingMaterialityPolicy();
            var alignment = new ForecastAlignmentDto
            {
                ForecastArpu = context.Forecast.Arpu,
                MaterialityPolicyApplied = policy
            };

            if (!context.Forecast.HasForecast || !context.Forecast.Arpu.HasValue || context.Forecast.Arpu.Value <= 0)
            {
                alignment.Status = ForecastAlignmentStatus.NeedsReview;
                alignment.Basis = ForecastAlignmentBasis.NeedsReview;
                alignment.Explanation = "No authoritative Phase 3 Financial Forecast ARPU available for alignment.";
                alignment.Recommendation = "Generate Phase 3 Forecast to validate launch pricing against financial projections.";
                return alignment;
            }

            var forecastArpu = context.Forecast.Arpu.Value;

            // Correction #3: Normalize pricing and forecast to the same economic basis + period
            switch (offer.BillingFrequency)
            {
                case BillingFrequency.Monthly:
                    alignment.Basis = ForecastAlignmentBasis.MonthlyRevenuePerCustomer;
                    alignment.ProposedEquivalentValue = offer.Price;
                    break;

                case BillingFrequency.Annual:
                    alignment.Basis = ForecastAlignmentBasis.MonthlyRevenuePerCustomer;
                    alignment.ProposedEquivalentValue = Math.Round(offer.Price / 12m, 2);
                    break;

                case BillingFrequency.Milestone:
                case BillingFrequency.OneOff:
                    // If offer is a project or one-off fee, do NOT blindly compare to monthly ARPU
                    if (offer.PricingModel == RevenueModelType.ProjectBased || offer.PricingModel == RevenueModelType.OneTime)
                    {
                        alignment.Basis = ForecastAlignmentBasis.RevenuePerProject;
                        alignment.ProposedEquivalentValue = offer.Price;
                        // If forecast only has monthly ARPU, flag NeedsReview rather than false variance
                        alignment.Status = ForecastAlignmentStatus.NeedsReview;
                        alignment.VariancePercentage = 0m;
                        alignment.Explanation = $"Offer is packaged as a one-time project fee (€{offer.Price:N0}) while the forecast models monthly recurring ARPU (€{forecastArpu:N0}/mo). Normalized project duration assumptions are required for direct mathematical variance.";
                        alignment.Recommendation = "Ensure projected customer volume and delivery frequency in Phase 4.2 Roadmap support this project-based fee.";
                        return alignment;
                    }
                    else
                    {
                        alignment.Basis = ForecastAlignmentBasis.AverageOrderValue;
                        alignment.ProposedEquivalentValue = offer.Price;
                    }
                    break;

                case BillingFrequency.PerUse:
                    alignment.Basis = ForecastAlignmentBasis.RevenuePerTransaction;
                    alignment.ProposedEquivalentValue = offer.Price;
                    break;

                default:
                    alignment.Basis = ForecastAlignmentBasis.MonthlyRevenuePerCustomer;
                    alignment.ProposedEquivalentValue = offer.Price;
                    break;
            }

            // Variance Calculation
            decimal variancePct = 0m;
            if (forecastArpu > 0)
            {
                variancePct = Math.Round(Math.Abs(alignment.ProposedEquivalentValue - forecastArpu) / forecastArpu, 4);
            }
            alignment.VariancePercentage = variancePct;

            // Correction #4: Use Configurable Materiality Policy (no hardcoded 20%)
            var relativeThreshold = policy.RelativeVarianceThreshold > 0 ? policy.RelativeVarianceThreshold : 0.20m;

            if (variancePct <= 0.05m)
            {
                alignment.Status = ForecastAlignmentStatus.Aligned;
                alignment.Explanation = $"Proposed launch price (€{alignment.ProposedEquivalentValue:N0}/mo equivalent) aligns closely with Financial Forecast ARPU (€{forecastArpu:N0}/mo).";
                alignment.Recommendation = "Pricing is financially coherent with current forecast assumptions.";
            }
            else if (variancePct <= relativeThreshold)
            {
                alignment.Status = ForecastAlignmentStatus.MinorVariance;
                alignment.Explanation = $"Minor variance of {variancePct * 100:N1}% between proposed price (€{alignment.ProposedEquivalentValue:N0}) and Forecast ARPU (€{forecastArpu:N0}).";
                alignment.Recommendation = "Acceptable variance for launch tiering. Monitor initial customer conversion rates.";
            }
            else
            {
                alignment.Status = ForecastAlignmentStatus.MaterialVariance;
                alignment.Explanation = $"Material variance of {variancePct * 100:N1}% exceeds materiality policy threshold ({relativeThreshold * 100:N0}%). Proposed price is €{alignment.ProposedEquivalentValue:N0} vs Forecast ARPU €{forecastArpu:N0}.";
                alignment.Recommendation = "Review difference: you may keep this launch price, adjust pricing to match forecast, or update forecast assumptions in Phase 3.";
            }

            return alignment;
        }

        public List<PricingRisk> DetectPricingRisks(List<PricingOffer> offers, ForecastAlignmentDto? forecastAlignment, PricingContext context)
        {
            var risks = new List<PricingRisk>();

            foreach (var offer in offers)
            {
                // Risk 1: BelowCost (Negative contribution margin)
                if (offer.UnitEconomics.ContributionMargin < 0)
                {
                    risks.Add(new PricingRisk
                    {
                        Key = $"risk.below_cost.{offer.Key}",
                        Type = PricingRiskType.BelowCost,
                        Severity = PricingRiskSeverity.Critical,
                        Description = $"Offer '{offer.Name}' selling price (€{offer.Price:N2}) is below estimated variable cost (€{offer.UnitEconomics.VariableCostPerUnit:N2}), resulting in a negative contribution margin (€{offer.UnitEconomics.ContributionMargin:N2}).",
                        Evidence = $"Variable cost per unit: €{offer.UnitEconomics.VariableCostPerUnit:N2}, Selling price: €{offer.Price:N2}.",
                        Recommendation = "Increase the offer price above the variable cost floor or optimize direct delivery expenses to achieve a sustainable unit margin.",
                        NeedsValidation = false
                    });
                }
                // Risk 2: MarginTooThin
                else if (offer.Price > 0 && offer.UnitEconomics.ContributionMarginRate < 0.15m)
                {
                    risks.Add(new PricingRisk
                    {
                        Key = $"risk.margin_thin.{offer.Key}",
                        Type = PricingRiskType.MarginTooThin,
                        Severity = PricingRiskSeverity.Medium,
                        Description = $"Offer '{offer.Name}' has a slim contribution margin of {offer.UnitEconomics.ContributionMarginRate * 100:N1}%, leaving limited cushion for overhead and customer acquisition.",
                        Evidence = $"Contribution margin rate is below the recommended 15% minimum buffer.",
                        Recommendation = "Consider tightening included feature scope or testing a modest price increase.",
                        NeedsValidation = true
                    });
                }

                // Risk 3: NoPriceEvidence / UnvalidatedWillingnessToPay
                if (offer.Confidence == PricingConfidence.NeedsValidation)
                {
                    risks.Add(new PricingRisk
                    {
                        Key = $"risk.no_evidence.{offer.Key}",
                        Type = PricingRiskType.NoPriceEvidence,
                        Severity = PricingRiskSeverity.Low,
                        Description = $"Offer '{offer.Name}' price currently lacks direct customer willingness-to-pay validation.",
                        Evidence = offer.PriceEvidence.SourceReference,
                        Recommendation = "Validate this price point through customer discovery interviews or pre-order discovery before scaling acquisition spend.",
                        NeedsValidation = true
                    });
                }
            }

            // Risk 4: Forecast Mismatch
            if (forecastAlignment != null && forecastAlignment.Status == ForecastAlignmentStatus.MaterialVariance)
            {
                risks.Add(new PricingRisk
                {
                    Key = "risk.forecast_mismatch",
                    Type = PricingRiskType.ForecastMismatch,
                    Severity = PricingRiskSeverity.High,
                    Description = forecastAlignment.Explanation,
                    Evidence = $"Forecast ARPU: €{forecastAlignment.ForecastArpu:N0}, Proposed equivalent: €{forecastAlignment.ProposedEquivalentValue:N0}, Variance: {forecastAlignment.VariancePercentage * 100:N1}%.",
                    Recommendation = "Decide whether to keep this pricing for launch or adjust the Phase 3 Forecast model to align cash flow projections.",
                    NeedsValidation = true
                });
            }

            return risks;
        }

        public List<PricingExperiment> GeneratePricingExperiments(PricingContext context, List<PricingOffer> offers)
        {
            var experiments = new List<PricingExperiment>();

            if (offers.Count > 0)
            {
                var primaryOffer = offers[0];
                var testPriceA = primaryOffer.Price;
                var testPriceB = Math.Round(testPriceA * 1.25m, 0);

                experiments.Add(new PricingExperiment
                {
                    Hypothesis = $"Prospects in '{primaryOffer.CustomerSegment}' will convert at €{testPriceB:N0} with minimal conversion loss compared to €{testPriceA:N0}.",
                    Segment = primaryOffer.CustomerSegment,
                    VariantA = $"Standard Offer: €{testPriceA:N0} / {primaryOffer.BillingFrequency}",
                    VariantB = $"Premium Value Framing: €{testPriceB:N0} / {primaryOffer.BillingFrequency}",
                    Metric = "Pre-order or consultation booking rate",
                    DurationGuidance = "3–4 weeks during Phase 4.7 early access campaign",
                    SampleRequirement = "Minimum 25 customer conversations or 100 landing page signups",
                    Status = "Recommended"
                });
            }

            experiments.Add(new PricingExperiment
            {
                Hypothesis = "Offering annual billing with a 2-month discount (17%) improves upfront cash flow without harming total contract value.",
                Segment = "All Segments",
                VariantA = "Monthly billing only",
                VariantB = "Monthly vs Annual with 2 months free",
                Metric = "Annual plan selection rate (target > 20%)",
                DurationGuidance = "First 60 days of commercial launch",
                SampleRequirement = "50 customer checkout attempts",
                Status = "Planned"
            });

            return experiments;
        }

        public LaunchPricingRecommendation SynthesizeRecommendation(
            RevenueModelType primaryModel,
            List<string> underlyingModels,
            List<PricingOffer> offers,
            List<PricingRisk> risks,
            PricingContext context)
        {
            var rec = new LaunchPricingRecommendation
            {
                RecommendedModel = primaryModel,
                UnderlyingRevenueModels = underlyingModels,
                RecommendedOffers = offers.Select(o => $"{o.Name}: €{o.Price:N0} ({o.BillingFrequency})").ToList(),
                Confidence = offers.All(o => o.Confidence == PricingConfidence.Supported || o.Confidence == PricingConfidence.Validated)
                    ? PricingConfidence.Supported
                    : PricingConfidence.NeedsValidation,
                ValidationRequired = offers.Any(o => o.Confidence == PricingConfidence.NeedsValidation)
            };

            rec.Reasoning = $"Based on {context.Project.Sector} market standards, target customer segments, and Phase 3 financial assumptions, a {primaryModel} revenue model with {offers.Count} segment-specific offer(s) provides the highest launch viability and unit margin stability.";

            var criticalRisks = risks.Where(r => r.Severity == PricingRiskSeverity.Critical || r.Severity == PricingRiskSeverity.High).ToList();
            if (criticalRisks.Count > 0)
            {
                rec.FinancialWarnings = criticalRisks.Select(r => r.Description).ToList();
            }

            rec.NextValidationStep = rec.ValidationRequired
                ? "Conduct 5–10 structured customer pricing interviews to confirm willingness-to-pay before scaling GTM campaigns."
                : "Launch early-access pilot pricing with first cohort of early adopters.";

            return rec;
        }

        public void RecalculateOfferEconomics(PricingOffer offer, PricingContext context)
        {
            // Invariant: FounderPrice takes precedence when set
            offer.Price = offer.FounderPrice ?? offer.RecommendedPrice;

            // Recalculate UnitEconomics
            offer.UnitEconomics = CalculateUnitEconomics(
                offer.Price,
                offer.UnitEconomics.VariableCostPerUnit,
                null,
                context,
                offer.UnitEconomics.MarginTargetType,
                offer.UnitEconomics.ContributionMarginRate
            );

            // Recalculate Forecast Alignment with normalized economic basis
            offer.ForecastAlignment = EvaluateForecastAlignment(offer, context);

            // Update presentation
            offer.Presentation.DisplayPrice = FormatDisplayPrice(offer.Price, offer.BillingFrequency, offer.Presentation.TaxMode);
        }

        // =========================================================================
        // PRIVATE HELPERS
        // =========================================================================

        private static decimal CalculateFloorPrice(decimal variableCost, MarginTargetType marginType, decimal targetMarginRate, decimal targetMarginAmount)
        {
            if (marginType == MarginTargetType.Percentage)
            {
                // MinimumPrice = VariableCost / (1 - m)
                var m = targetMarginRate;
                if (m >= 0.95m) m = 0.90m; // Safety cap
                if (m <= 0m) m = 0.20m;
                return Math.Round(variableCost / (1.0m - m), 2);
            }
            else
            {
                // MinimumPrice = VariableCost + RequiredContributionAmount
                return Math.Round(variableCost + targetMarginAmount, 2);
            }
        }

        private static TaxMode DetermineTaxMode(PricingContext context)
        {
            // Canonical Rule: Customer type != Tax status.
            // B2B does NOT automatically mean HT; B2C does NOT automatically mean TTC.
            // Tax presentation requires explicit configured/evidenced tax context.
            // When tax context is unconfigured or ambiguous, return NotApplicableOrUnknown.

            // Priority 1: Direct explicit tax mode override on pricing context
            if (context.ExplicitTaxMode.HasValue && context.ExplicitTaxMode.Value != TaxMode.NotApplicableOrUnknown)
            {
                return context.ExplicitTaxMode.Value;
            }

            // Priority 2: Configured tax mode in legal/tax context
            if (context.Legal.ConfiguredTaxMode != TaxMode.NotApplicableOrUnknown)
            {
                return context.Legal.ConfiguredTaxMode;
            }

            // Priority 3: Explicit founder-selected or system tax display mode string
            if (!string.IsNullOrWhiteSpace(context.Legal.ExplicitTaxDisplayMode))
            {
                var mode = context.Legal.ExplicitTaxDisplayMode.Trim().ToUpperInvariant();
                if (mode == "HT" || mode == "TAXEXCLUSIVE") return TaxMode.TaxExclusive;
                if (mode == "TTC" || mode == "TAXINCLUSIVE") return TaxMode.TaxInclusive;
                if (mode == "EXEMPT" || mode == "EXONÉRÉ" || mode == "EXONERE" || mode == "NET") return TaxMode.Exempt;
            }

            // Priority 4: Verified VAT exemption status
            if (context.Legal.IsVatExempt == true)
            {
                return TaxMode.Exempt;
            }

            // Priority 5: Explicitly evidenced InferredTaxMode if set non-default
            if (context.Legal.InferredTaxMode != TaxMode.NotApplicableOrUnknown)
            {
                return context.Legal.InferredTaxMode;
            }

            // Default: Insufficient context -> NotApplicableOrUnknown. Never guess from customer type or segment.
            return TaxMode.NotApplicableOrUnknown;
        }

        private static BillingFrequency DetermineFrequency(string rawPricing, RevenueModelType model)
        {
            var lower = rawPricing.ToLowerInvariant();
            if (lower.Contains("/mo") || lower.Contains("/month") || lower.Contains("mensuel")) return BillingFrequency.Monthly;
            if (lower.Contains("/yr") || lower.Contains("/year") || lower.Contains("annuel")) return BillingFrequency.Annual;
            if (lower.Contains("/hour") || lower.Contains("/hr")) return BillingFrequency.Hourly;
            if (lower.Contains("/project") || lower.Contains("/mission")) return BillingFrequency.Milestone;

            return model switch
            {
                RevenueModelType.ProjectBased => BillingFrequency.Milestone,
                RevenueModelType.OneTime => BillingFrequency.OneOff,
                RevenueModelType.UsageBased => BillingFrequency.PerUse,
                _ => BillingFrequency.Monthly
            };
        }

        private PricingOffer CreateOffer(
            string key,
            string name,
            string customerSegment,
            string valueDelivered,
            List<string> features,
            RevenueModelType model,
            BillingFrequency frequency,
            decimal price,
            string currency,
            TaxMode taxMode,
            PricingConfidence confidence,
            PriceEvidenceType evidenceType,
            string evidenceRef,
            decimal variableCost,
            PricingContext context)
        {
            var offer = new PricingOffer
            {
                Key = key,
                Name = name,
                CustomerSegment = customerSegment,
                ValueDelivered = valueDelivered,
                IncludedFeatures = features,
                PricingModel = model,
                BillingFrequency = frequency,
                Price = price,
                Currency = currency,
                RecommendedPrice = price,
                FounderPrice = null,
                MarketReferencePrice = null,
                ValidatedMarketPrice = null,
                MarketPriceEvidenceType = MarketPriceEvidenceType.Unknown,
                MarketPriceValidationLevel = MarketPriceValidationLevel.Unvalidated,
                FounderEdited = false,
                Confidence = confidence,
                PriceEvidence = new PriceEvidence
                {
                    Type = evidenceType,
                    Value = price > 0 ? price : null,
                    Confidence = confidence,
                    SourceReference = evidenceRef,
                    UpdatedAt = DateTime.UtcNow
                },
                Presentation = new PricePresentation
                {
                    Currency = currency,
                    TaxMode = taxMode,
                    TaxRateReference = taxMode switch
                    {
                        TaxMode.TaxExclusive => "TVA 20% applicable en sus",
                        TaxMode.TaxInclusive => "TVA 20% incluse",
                        TaxMode.Exempt => "Exonéré de TVA",
                        _ => null
                    },
                    DisplayPrice = FormatDisplayPrice(price, frequency, taxMode)
                }
            };

            offer.UnitEconomics = CalculateUnitEconomics(
                price,
                variableCost,
                null,
                context,
                context.CostStructure.MarginTargetType,
                context.CostStructure.DefaultRequiredMarginRate
            );

            offer.ForecastAlignment = EvaluateForecastAlignment(offer, context);

            return offer;
        }

        private static string FormatDisplayPrice(decimal price, BillingFrequency freq, TaxMode taxMode)
        {
            if (price <= 0) return "Needs Validation";
            var freqStr = freq switch
            {
                BillingFrequency.Monthly => "/ month",
                BillingFrequency.Annual => "/ year",
                BillingFrequency.Hourly => "/ hour",
                BillingFrequency.Milestone => "per project",
                BillingFrequency.OneOff => "one-time",
                BillingFrequency.PerUse => "per transaction",
                _ => ""
            };

            var taxStr = taxMode switch
            {
                TaxMode.TaxExclusive => "HT",
                TaxMode.TaxInclusive => "TTC",
                TaxMode.Exempt => "Exempt",
                _ => ""
            };

            return $"€{price:N0} {freqStr} {taxStr}".Trim();
        }

        private static string SanitizeKey(string key)
        {
            return System.Text.RegularExpressions.Regex.Replace(key.Replace(" ", "-").ToLowerInvariant(), @"[^a-z0-9\.\-]", "");
        }
    }
}
