using System.Collections.Generic;
using WebApp.Models.DatabaseModels.Phase4;
using WebApp.Models.Phase4;

namespace WebApp.Services.Interface
{
    public interface IFounderCapacityResolver
    {
        CapacityTier ResolveCapacityTier(string? weeklyAvailability);
        FounderCapacityProfile ResolveCapacityProfile(string? weeklyAvailability, List<GtmChannelStrategy>? activeChannels = null);
        (ChannelEffortLevel Effort, int LoadPoints) GetChannelEffortWeight(GtmChannelType channel, ChannelExecutionMode mode);
    }
}
