using System.Collections.Generic;
using WebApp.Models.DatabaseModels.Phase4;
using WebApp.Models.Phase4;

namespace WebApp.Services.Interface
{
    public interface IPricingPolicyEngine
    {
        /// <summary>
        /// Infers primary revenue model and underlying revenue models from project concept and business model.
        /// </summary>
        (RevenueModelType PrimaryModel, List<string> UnderlyingModels) ResolveRevenueModels(PricingContext context);

        /// <summary>
        /// Structures segment-aware launch pricing offers.
        /// </summary>
        List<PricingOffer> StructureOffers(PricingContext context, RevenueModelType primaryModel, List<string> underlyingModels);

        /// <summary>
        /// Evaluates unit economics for a given offer and price, using rigorous margin floor formulas.
        /// </summary>
        UnitEconomics CalculateUnitEconomics(decimal price, decimal variableCost, decimal? directCost, PricingContext context, MarginTargetType marginTargetType, decimal targetMargin);

        /// <summary>
        /// Evaluates forecast alignment using normalized economic basis conversion and configurable materiality policy.
        /// </summary>
        ForecastAlignmentDto EvaluateForecastAlignment(PricingOffer offer, PricingContext context);

        /// <summary>
        /// Evaluates pricing risks across offers and unit economics.
        /// </summary>
        List<PricingRisk> DetectPricingRisks(List<PricingOffer> offers, ForecastAlignmentDto? forecastAlignment, PricingContext context);

        /// <summary>
        /// Generates MVP pricing validation experiments.
        /// </summary>
        List<PricingExperiment> GeneratePricingExperiments(PricingContext context, List<PricingOffer> offers);

        /// <summary>
        /// Synthesizes the final launch pricing recommendation.
        /// </summary>
        LaunchPricingRecommendation SynthesizeRecommendation(RevenueModelType primaryModel, List<string> underlyingModels, List<PricingOffer> offers, List<PricingRisk> risks, PricingContext context);

        /// <summary>
        /// Immediately recalculates economics, forecast alignment, and risks for an offer after founder price/details edit.
        /// </summary>
        void RecalculateOfferEconomics(PricingOffer offer, PricingContext context);
    }
}
