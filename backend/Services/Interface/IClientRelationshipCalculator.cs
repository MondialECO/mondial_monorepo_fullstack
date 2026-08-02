using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Interface;

/// <summary>
/// Shared Module 4/5 source of truth for completed-client and delivery performance
/// calculations. Keeping these formulas here prevents Trust and Analytics drift.
/// </summary>
public interface IClientRelationshipCalculator
{
    ClientRelationshipCalculation Calculate(IEnumerable<WorkroomEngagement> engagements);
    double? CalculateOnTimeRate(IEnumerable<WorkroomMilestone> milestones);
}

public sealed record ClientRelationshipCalculation(
    int CompletedProjectCount,
    int TotalClientCount,
    int RepeatClientCount,
    double? RepeatClientRate,
    IReadOnlySet<string> RepeatClientIds);
