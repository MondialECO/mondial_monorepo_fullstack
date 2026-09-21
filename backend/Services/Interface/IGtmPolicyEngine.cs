using System.Collections.Generic;
using WebApp.Models.DatabaseModels.Phase4;
using WebApp.Models.Phase4;

namespace WebApp.Services.Interface
{
    public interface IGtmPolicyEngine
    {
        (string PrimarySegment, List<GtmSegmentStrategy> SegmentStrategies) PrioritizeSegments(GtmContext context);

        GtmPositioningStrategy AdaptPositioning(GtmContext context, GtmSegmentStrategy primarySegment);

        (SalesMotion Motion, SalesMotionContext MotionContext) DetermineSalesMotion(GtmContext context, GtmSegmentStrategy primarySegment);

        List<GtmChannelStrategy> EvaluateChannels(
            GtmContext context,
            GtmSegmentStrategy primarySegment,
            SalesMotion salesMotion,
            FounderCapacityProfile capacity);

        GtmBudgetPlan FormulateBudgetPlan(GtmContext context, List<GtmChannelStrategy> channels);

        List<GtmExperiment> DesignExperiments(
            GtmContext context,
            GtmSegmentStrategy primarySegment,
            List<GtmChannelStrategy> channels,
            GtmBudgetPlan budget);

        List<GtmMetricDefinition> SynthesizeMetrics(GtmContext context, SalesMotion salesMotion);

        GtmLaunchPlan BuildLaunchPlan(
            GtmContext context,
            GtmSegmentStrategy primarySegment,
            List<GtmChannelStrategy> channels,
            List<GtmExperiment> experiments);

        (List<GtmRisk> Risks, List<GtmAssumption> Assumptions) AssessRisksAndAssumptions(
            GtmContext context,
            List<GtmChannelStrategy> channels,
            FounderCapacityProfile capacity,
            GtmBudgetPlan budget);
    }
}
