using WebApp.Models.DatabaseModels;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations;

/// <summary>
/// Deterministic client-relationship calculator shared by Module 4 Trust signals and
/// Module 5 Analytics. Archived engagements are completed historical work, matching
/// Module 4's established behavior.
/// </summary>
public sealed class ClientRelationshipCalculator : IClientRelationshipCalculator
{
    public ClientRelationshipCalculation Calculate(IEnumerable<WorkroomEngagement> engagements)
    {
        var completed = engagements
            .Where(x => x.EngagementStatus is EngagementStatus.Completed or EngagementStatus.Archived)
            .ToList();
        var byClient = completed.GroupBy(x => x.ClientId).ToList();
        var repeatIds = byClient.Where(x => x.Count() >= 2).Select(x => x.Key).ToHashSet(StringComparer.Ordinal);
        var rate = byClient.Count == 0 ? (double?)null : 100d * repeatIds.Count / byClient.Count;

        return new(completed.Count, byClient.Count, repeatIds.Count, rate, repeatIds);
    }

    public double? CalculateOnTimeRate(IEnumerable<WorkroomMilestone> milestones)
    {
        var eligible = milestones.Where(x => x.SubmittedAt.HasValue && x.DueDate.HasValue).ToList();
        return eligible.Count == 0
            ? null
            : 100d * eligible.Count(x => x.SubmittedAt <= x.DueDate) / eligible.Count;
    }
}
