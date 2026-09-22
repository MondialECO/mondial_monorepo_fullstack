using System;
using System.Collections.Generic;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Phase4;

namespace WebApp.Services.Implementations
{
    public class Phase4CompletionResult
    {
        public bool IsComplete { get; set; }
        public bool SnapshotResolved { get; set; }
        public bool RoadmapResolved { get; set; }
        public bool NeedsResolved { get; set; }
        public bool SkillsResolved { get; set; }
        public bool SupportResolved { get; set; }
        public bool PricingResolved { get; set; }
        public bool GtmResolved { get; set; }
        public List<string> UnresolvedStages { get; set; } = new();

        public int ResolvedCount =>
            (SnapshotResolved ? 1 : 0) +
            (RoadmapResolved ? 1 : 0) +
            (NeedsResolved ? 1 : 0) +
            (SkillsResolved ? 1 : 0) +
            (SupportResolved ? 1 : 0) +
            (PricingResolved ? 1 : 0) +
            (GtmResolved ? 1 : 0);
    }

    /// <summary>
    /// Deterministic, single authority on Phase 4 completion.
    /// Evaluates stage-native resolution semantics across all 7 construction preparation stages.
    /// Note: A stage does not need to contain positive findings (e.g. 0 public grants or 0 skill gaps)
    /// in order to be considered evaluated and resolved.
    /// </summary>
    public static class Phase4CompletionResolver
    {
        public static Phase4CompletionResult Resolve(CreatorPhase4Data? p4)
        {
            var res = new Phase4CompletionResult();
            if (p4 == null)
            {
                res.UnresolvedStages.AddRange(new[]
                {
                    "4.1 Snapshot",
                    "4.2 Roadmap",
                    "4.3 Needs",
                    "4.4 Skills",
                    "4.5 Support",
                    "4.6 Pricing",
                    "4.7 GTM"
                });
                return res;
            }

            // 4.1 Construction Snapshot (Stage-native status: "Completed")
            res.SnapshotResolved = p4.ConstructionSnapshot != null
                && string.Equals(p4.ConstructionSnapshot.Status, "Completed", StringComparison.OrdinalIgnoreCase)
                && p4.ConstructionSnapshot.GeneratedAt != default
                && (p4.ConstructionSnapshot.Categories?.Count > 0 
                    || p4.ConstructionSnapshot.ReadyItems?.Count > 0 
                    || p4.ConstructionSnapshot.MissingItems?.Count > 0
                    || p4.ConstructionSnapshot.PartialItems?.Count > 0
                    || p4.ConstructionSnapshot.CriticalItems?.Count > 0);
            if (!res.SnapshotResolved) res.UnresolvedStages.Add("4.1 Snapshot");

            // 4.2 Operational Roadmap (Stage-native status: "Active")
            res.RoadmapResolved = p4.Roadmap != null
                && string.Equals(p4.Roadmap.Status, "Active", StringComparison.OrdinalIgnoreCase)
                && p4.Roadmap.GeneratedAt != default
                && p4.Roadmap.Stages != null;
            if (!res.RoadmapResolved) res.UnresolvedStages.Add("4.2 Roadmap");

            // 4.3 Needs & Requirements (Stage-native status: "Completed")
            res.NeedsResolved = p4.NeedsAnalysis != null
                && string.Equals(p4.NeedsAnalysis.Status, "Completed", StringComparison.OrdinalIgnoreCase)
                && p4.NeedsAnalysis.GeneratedAt != default
                && p4.NeedsAnalysis.CountsByCategory != null;
            if (!res.NeedsResolved) res.UnresolvedStages.Add("4.3 Needs");

            // 4.4 Skills & Training (Stage-native status: "Completed", 0 gaps is valid resolved)
            res.SkillsResolved = p4.SkillsPlan != null
                && string.Equals(p4.SkillsPlan.Status, "Completed", StringComparison.OrdinalIgnoreCase)
                && p4.SkillsPlan.GeneratedAt != default
                && p4.SkillsPlan.Resolutions != null
                && p4.SkillsPlan.CoveredCapabilities != null;
            if (!res.SkillsResolved) res.UnresolvedStages.Add("4.4 Skills");

            // 4.5 Aids, Grants & Support (Stage-native status: "Generated", "Refreshed", or "Stale"; 0 matches is valid resolved)
            res.SupportResolved = p4.SupportPlan != null
                && p4.SupportPlan.GeneratedAt != default
                && !string.IsNullOrWhiteSpace(p4.SupportPlan.Status)
                && !string.Equals(p4.SupportPlan.Status, "Draft", StringComparison.OrdinalIgnoreCase)
                && p4.SupportPlan.Summary != null;
            if (!res.SupportResolved) res.UnresolvedStages.Add("4.5 Support");

            // 4.6 Pricing Strategy (Stage-native enum: Generated, Refreshed, NeedsValidation)
            res.PricingResolved = p4.PricingStrategy != null
                && p4.PricingStrategy.GeneratedAt != default
                && p4.PricingStrategy.Status != PricingStatus.Draft
                && p4.PricingStrategy.Offers != null;
            if (!res.PricingResolved) res.UnresolvedStages.Add("4.6 Pricing");

            // 4.7 GTM Strategy (Stage-native status: "Valid", "Generated", or "Stale", not "Draft")
            res.GtmResolved = p4.GtmStrategy != null
                && p4.GtmStrategy.GeneratedAt != default
                && !string.IsNullOrWhiteSpace(p4.GtmStrategy.Status)
                && !string.Equals(p4.GtmStrategy.Status, "Draft", StringComparison.OrdinalIgnoreCase)
                && p4.GtmStrategy.SegmentStrategies != null
                && p4.GtmStrategy.LaunchPlan != null;
            if (!res.GtmResolved) res.UnresolvedStages.Add("4.7 GTM");

            res.IsComplete = res.SnapshotResolved
                && res.RoadmapResolved
                && res.NeedsResolved
                && res.SkillsResolved
                && res.SupportResolved
                && res.PricingResolved
                && res.GtmResolved;

            return res;
        }
    }
}
