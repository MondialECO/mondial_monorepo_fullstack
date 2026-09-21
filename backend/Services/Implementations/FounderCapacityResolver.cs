using System;
using System.Collections.Generic;
using System.Linq;
using WebApp.Models.DatabaseModels.Phase4;
using WebApp.Models.Phase4;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations
{
    public class FounderCapacityResolver : IFounderCapacityResolver
    {
        public CapacityTier ResolveCapacityTier(string? weeklyAvailability)
        {
            if (string.IsNullOrWhiteSpace(weeklyAvailability)) return CapacityTier.Conservative;
            var wa = weeklyAvailability.Trim().ToLowerInvariant();

            if (wa.Contains("<5") || wa.Contains("less than 5") || wa.Contains("1-5")) return CapacityTier.VeryLight;
            if (wa.Contains("5–10") || wa.Contains("5-10") || wa.Contains("5to10")) return CapacityTier.Light;
            if (wa.Contains("10–20") || wa.Contains("10-20") || wa.Contains("10to20") || wa.Contains("15-25")) return CapacityTier.Standard;
            if (wa.Contains("20–30") || wa.Contains("20-30") || wa.Contains("20to30")) return CapacityTier.Accelerated;
            if (wa.Contains("30+") || wa.Contains("30 +") || wa.Contains("full-time") || wa.Contains("full time") || wa.Contains("fulltime")) return CapacityTier.Intensive;

            return CapacityTier.Conservative;
        }

        public (ChannelEffortLevel Effort, int LoadPoints) GetChannelEffortWeight(GtmChannelType channel, ChannelExecutionMode mode)
        {
            if (mode == ChannelExecutionMode.Delegated)
            {
                // Delegated channels carry low monitoring load (1 point)
                return (ChannelEffortLevel.Low, 1);
            }

            switch (channel)
            {
                case GtmChannelType.FounderLedSales:
                case GtmChannelType.DirectSales:
                case GtmChannelType.ColdCalling:
                case GtmChannelType.Events:
                    return (ChannelEffortLevel.High, 4);

                case GtmChannelType.OrganicSocial:
                case GtmChannelType.ContentMarketing:
                case GtmChannelType.EmailOutbound:
                case GtmChannelType.Webinars:
                case GtmChannelType.PaidSearch:
                case GtmChannelType.PaidSocial:
                case GtmChannelType.ProductLedGrowth:
                    return (ChannelEffortLevel.Medium, 2);

                case GtmChannelType.Referral:
                case GtmChannelType.Partnerships:
                case GtmChannelType.Communities:
                case GtmChannelType.PR:
                case GtmChannelType.Affiliate:
                case GtmChannelType.LocalOutreach:
                case GtmChannelType.OrganicSearch:
                default:
                    return (ChannelEffortLevel.Low, 1);
            }
        }

        public FounderCapacityProfile ResolveCapacityProfile(string? weeklyAvailability, List<GtmChannelStrategy>? activeChannels = null)
        {
            var tier = ResolveCapacityTier(weeklyAvailability);

            int estimatedHours;
            int maxActiveChannels;
            int maxLoadPoints;

            switch (tier)
            {
                case CapacityTier.VeryLight: // <5h/w
                    estimatedHours = 4;
                    maxActiveChannels = 1;
                    maxLoadPoints = 3;
                    break;
                case CapacityTier.Light: // 5-10h/w
                    estimatedHours = 8;
                    maxActiveChannels = 2;
                    maxLoadPoints = 5;
                    break;
                case CapacityTier.Standard: // 10-20h/w
                    estimatedHours = 15;
                    maxActiveChannels = 3;
                    maxLoadPoints = 8;
                    break;
                case CapacityTier.Accelerated: // 20-30h/w
                    estimatedHours = 25;
                    maxActiveChannels = 4;
                    maxLoadPoints = 12;
                    break;
                case CapacityTier.Intensive: // 30h+/w
                    estimatedHours = 40;
                    maxActiveChannels = 6;
                    maxLoadPoints = 20;
                    break;
                case CapacityTier.Conservative:
                default:
                    estimatedHours = 12;
                    maxActiveChannels = 2;
                    maxLoadPoints = 6;
                    break;
            }

            int currentLoad = 0;
            if (activeChannels != null && activeChannels.Count > 0)
            {
                foreach (var ch in activeChannels.Where(c => c.Priority == ChannelPriority.Now || c.Priority == ChannelPriority.Next))
                {
                    var (_, points) = GetChannelEffortWeight(ch.Channel, ch.ExecutionMode);
                    currentLoad += points;
                }
            }

            var profile = new FounderCapacityProfile
            {
                Tier = tier,
                RawWeeklyAvailability = weeklyAvailability ?? "Standard",
                EstimatedWeeklyHours = estimatedHours,
                MaxActiveFounderLedChannels = maxActiveChannels,
                MaxLoadPoints = maxLoadPoints,
                CurrentLoadPoints = currentLoad,
            };

            if (profile.IsOverloaded)
            {
                profile.CapacityWarning = $"Execution Capacity Warning: Your current active channels require {currentLoad} load points, exceeding your weekly capacity limit of {maxLoadPoints} points ({estimatedHours}h/week). Consider reducing channels or delegating execution.";
            }

            return profile;
        }
    }
}
