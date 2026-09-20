using System.Collections.Generic;
using WebApp.Models.DatabaseModels.Phase4;
using WebApp.Models.Phase4;

namespace WebApp.Services.Interface
{
    public interface IRoadmapScheduler
    {
        CapacityTier ResolveCapacityTier(string? weeklyAvailability);
        
        List<RoadmapTask> ScheduleTasks(
            List<RoadmapTask> taskCandidates,
            CapacityTier capacity,
            RoadmapContext context);

        bool ValidateAndDetectCycles(
            List<RoadmapTask> tasks,
            out List<string> cycleTaskKeys);

        NextBestAction? SelectNextBestAction(List<RoadmapTask> tasks);
    }
}
