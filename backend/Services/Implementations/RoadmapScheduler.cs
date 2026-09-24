using System;
using System.Collections.Generic;
using System.Linq;
using WebApp.Models.DatabaseModels.Phase4;
using WebApp.Models.Phase4;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations
{
    public class RoadmapScheduler : IRoadmapScheduler
    {
        private readonly IFounderCapacityResolver _capacityResolver;

        public RoadmapScheduler(IFounderCapacityResolver? capacityResolver = null)
        {
            _capacityResolver = capacityResolver ?? new FounderCapacityResolver();
        }

        public CapacityTier ResolveCapacityTier(string? weeklyAvailability)
        {
            return _capacityResolver.ResolveCapacityTier(weeklyAvailability);
        }

        public bool ValidateAndDetectCycles(List<RoadmapTask> tasks, out List<string> cycleTaskKeys)
        {
            cycleTaskKeys = new List<string>();
            var taskByKey = tasks.Where(t => !string.IsNullOrEmpty(t.Key)).ToDictionary(t => t.Key, t => t);
            
            // DFS Cycle Detection
            var visited = new Dictionary<string, int>(); // 0: unvisited, 1: visiting, 2: visited

            foreach (var key in taskByKey.Keys)
            {
                if (!visited.ContainsKey(key))
                {
                    if (HasCycleDfs(key, taskByKey, visited, cycleTaskKeys))
                    {
                        return false;
                    }
                }
            }

            return true;
        }

        private bool HasCycleDfs(
            string currentKey,
            Dictionary<string, RoadmapTask> taskMap,
            Dictionary<string, int> visited,
            List<string> cycleKeys)
        {
            visited[currentKey] = 1; // Visiting

            if (taskMap.TryGetValue(currentKey, out var task) && task.Dependencies != null)
            {
                foreach (var depKey in task.Dependencies)
                {
                    if (!taskMap.ContainsKey(depKey)) continue;

                    if (visited.TryGetValue(depKey, out var state))
                    {
                        if (state == 1) // Cycle found!
                        {
                            cycleKeys.Add(currentKey);
                            cycleKeys.Add(depKey);
                            return true;
                        }
                    }
                    else
                    {
                        if (HasCycleDfs(depKey, taskMap, visited, cycleKeys))
                        {
                            cycleKeys.Add(currentKey);
                            return true;
                        }
                    }
                }
            }

            visited[currentKey] = 2; // Fully visited
            return false;
        }

        public List<RoadmapTask> ScheduleTasks(
            List<RoadmapTask> taskCandidates,
            CapacityTier capacity,
            RoadmapContext context)
        {
            // 1. Cycle detection & safety
            if (!ValidateAndDetectCycles(taskCandidates, out var cycleKeys))
            {
                // Break cycle safely by converting cyclic dependency to NeedsReview without circular blocker
                foreach (var task in taskCandidates.Where(t => cycleKeys.Contains(t.Key)))
                {
                    task.Status = RoadmapTaskStatus.NeedsReview;
                    task.Why += " [Dependency cycle detected in candidate ordering; manual review required.]";
                    task.Dependencies.Clear(); // Break cycle
                }
            }

            // 2. Capacity Stage Quotas (Max number of tasks allowed in stage NOW)
            int nowStageCapacity = capacity switch
            {
                CapacityTier.VeryLight => 2,
                CapacityTier.Light => 3,
                CapacityTier.Standard => 5,
                CapacityTier.Accelerated => 7,
                CapacityTier.Intensive => 9,
                _ => 3 // Conservative
            };

            // Order candidates deterministically:
            // 1) Critical & Blocking first
            // 2) Critical non-blocking
            // 3) High priority
            // 4) Medium / Low / Optional
            var sortedCandidates = taskCandidates
                .OrderByDescending(t => t.Blocking)
                .ThenBy(t => GetPriorityRank(t.Priority))
                .ToList();

            var scheduled = new List<RoadmapTask>();
            int currentNowCount = 0;
            var stageLookup = new Dictionary<string, string>(); // Key -> Assigned Stage

            foreach (var task in sortedCandidates)
            {
                // Determine earliest allowable stage based on dependencies
                string earliestStage = RoadmapStages.Now;
                if (task.Dependencies != null && task.Dependencies.Count > 0)
                {
                    foreach (var dep in task.Dependencies)
                    {
                        if (stageLookup.TryGetValue(dep, out var depStage))
                        {
                            earliestStage = MaxStage(earliestStage, depStage);
                        }
                    }
                }

                // Respect inherent temporal constraints (e.g. Legal before_launch or post_launch)
                if (!string.IsNullOrEmpty(task.EarliestStart))
                {
                    earliestStage = MaxStage(earliestStage, task.EarliestStart);
                }

                // Apply Capacity Constraints to NOW stage
                string assignedStage = earliestStage;
                if (assignedStage == RoadmapStages.Now)
                {
                    if (currentNowCount >= nowStageCapacity && !task.Blocking)
                    {
                        // Shift to NEXT_30_DAYS to prevent founder cognitive overload
                        assignedStage = RoadmapStages.Next30Days;
                    }
                    else
                    {
                        currentNowCount++;
                    }
                }

                task.Stage = assignedStage;
                stageLookup[task.Key] = assignedStage;
                scheduled.Add(task);
            }

            // Final sort inside each stage
            return scheduled
                .OrderBy(t => GetStageRank(t.Stage))
                .ThenByDescending(t => t.Blocking)
                .ThenBy(t => GetPriorityRank(t.Priority))
                .ToList();
        }

        public NextBestAction? SelectNextBestAction(List<RoadmapTask> tasks)
        {
            if (tasks == null || tasks.Count == 0) return null;

            var activeTasks = tasks
                .Where(t => t.Status != RoadmapTaskStatus.Done && t.Status != RoadmapTaskStatus.Skipped)
                .ToList();

            if (activeTasks.Count == 0) return null;

            // Check dependency availability: task is unblocked if all its dependencies are Done (or have no dependencies)
            var doneKeys = tasks
                .Where(t => t.Status == RoadmapTaskStatus.Done)
                .Select(t => t.Key)
                .ToHashSet();

            bool IsDependencyUnblocked(RoadmapTask t)
            {
                if (t.Dependencies == null || t.Dependencies.Count == 0) return true;
                return t.Dependencies.All(depKey => doneKeys.Contains(depKey));
            }

            // Deterministic Selection Order:
            // 1. Unresolved Critical + Blocking task (dependency-unblocked preferred)
            var candidate = activeTasks
                .Where(t => t.Priority == RoadmapTaskPriority.Critical && t.Blocking && IsDependencyUnblocked(t))
                .OrderBy(t => GetStageRank(t.Stage))
                .FirstOrDefault();

            if (candidate == null)
            {
                // 2. Unresolved Critical task (dependency unblocked)
                candidate = activeTasks
                    .Where(t => t.Priority == RoadmapTaskPriority.Critical && IsDependencyUnblocked(t))
                    .OrderBy(t => GetStageRank(t.Stage))
                    .FirstOrDefault();
            }

            if (candidate == null)
            {
                // 3. High priority dependency-unblocked task in earliest stage
                candidate = activeTasks
                    .Where(t => t.Priority == RoadmapTaskPriority.High && IsDependencyUnblocked(t))
                    .OrderBy(t => GetStageRank(t.Stage))
                    .FirstOrDefault();
            }

            if (candidate == null)
            {
                // 4. Earliest-stage unresolved unblocked task
                candidate = activeTasks
                    .Where(IsDependencyUnblocked)
                    .OrderBy(t => GetStageRank(t.Stage))
                    .ThenBy(t => GetPriorityRank(t.Priority))
                    .FirstOrDefault();
            }

            if (candidate == null)
            {
                // 5. Fallback: Any active task (e.g. NeedsReview or first in queue)
                candidate = activeTasks.OrderBy(t => GetStageRank(t.Stage)).FirstOrDefault();
            }

            if (candidate == null) return null;

            return new NextBestAction
            {
                TaskId = candidate.Id,
                TaskKey = candidate.Key,
                Title = candidate.Title,
                WhyNow = GenerateWhyNow(candidate),
                Priority = candidate.Priority,
                Blocking = candidate.Blocking,
                Source = candidate.Source
            };
        }

        private static string GenerateWhyNow(RoadmapTask task)
        {
            if (task.Blocking)
            {
                return $"This action is currently blocking your progress towards build and launch. Resolving '{task.Title}' clears dependencies for downstream execution.";
            }

            if (task.Priority == RoadmapTaskPriority.Critical)
            {
                return $"Critical foundation item required in stage {RoadmapStages.GetUserFacingLabel(task.Stage)} to secure business viability.";
            }

            if (task.Stage == RoadmapStages.Now)
            {
                return $"Immediate priority scheduled for your current work window with your available capacity.";
            }

            return $"Scheduled in {RoadmapStages.GetUserFacingLabel(task.Stage)} to prepare your next operational phase.";
        }

        private static int GetPriorityRank(string priority) => priority switch
        {
            RoadmapTaskPriority.Critical => 1,
            RoadmapTaskPriority.High => 2,
            RoadmapTaskPriority.Medium => 3,
            RoadmapTaskPriority.Low => 4,
            _ => 5
        };

        private static int GetStageRank(string stage) => stage switch
        {
            RoadmapStages.Now => 1,
            RoadmapStages.Next30Days => 2,
            RoadmapStages.Days30To60 => 3,
            RoadmapStages.Days60To90 => 4,
            RoadmapStages.BeforeLaunch => 5,
            RoadmapStages.PostLaunch => 6,
            _ => 99
        };

        private static string GetNextStage(string stage) => stage switch
        {
            RoadmapStages.Now => RoadmapStages.Next30Days,
            RoadmapStages.Next30Days => RoadmapStages.Days30To60,
            RoadmapStages.Days30To60 => RoadmapStages.Days60To90,
            RoadmapStages.Days60To90 => RoadmapStages.BeforeLaunch,
            RoadmapStages.BeforeLaunch => RoadmapStages.PostLaunch,
            _ => RoadmapStages.PostLaunch
        };

        private static string MaxStage(string stageA, string stageB)
        {
            return GetStageRank(stageA) >= GetStageRank(stageB) ? stageA : stageB;
        }
    }
}
