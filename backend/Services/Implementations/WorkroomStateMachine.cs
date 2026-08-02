using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Implementations;

/// <summary>Pure Module 4 transition policy; business prerequisites are checked by WorkroomService.</summary>
public static class WorkroomStateMachine
{
    private static readonly IReadOnlyDictionary<EngagementStatus, EngagementStatus[]> EngagementTransitions =
        new Dictionary<EngagementStatus, EngagementStatus[]>
        {
            [EngagementStatus.ContractPending] = [EngagementStatus.EscrowPending, EngagementStatus.Cancelled],
            [EngagementStatus.EscrowPending] = [EngagementStatus.ReadyToStart, EngagementStatus.Cancelled, EngagementStatus.Disputed],
            [EngagementStatus.ReadyToStart] = [EngagementStatus.Active, EngagementStatus.Paused, EngagementStatus.Cancelled, EngagementStatus.Disputed],
            [EngagementStatus.Active] = [EngagementStatus.Paused, EngagementStatus.ClientInputRequired, EngagementStatus.MilestoneReview, EngagementStatus.RevisionInProgress, EngagementStatus.FinalDelivery, EngagementStatus.Disputed, EngagementStatus.Cancelled],
            [EngagementStatus.Paused] = [EngagementStatus.Active, EngagementStatus.Cancelled, EngagementStatus.Disputed],
            [EngagementStatus.ClientInputRequired] = [EngagementStatus.Active, EngagementStatus.Paused, EngagementStatus.Disputed],
            [EngagementStatus.MilestoneReview] = [EngagementStatus.RevisionInProgress, EngagementStatus.ReadyToStart, EngagementStatus.FinalDelivery, EngagementStatus.Disputed],
            [EngagementStatus.RevisionInProgress] = [EngagementStatus.MilestoneReview, EngagementStatus.Paused, EngagementStatus.Disputed],
            [EngagementStatus.FinalDelivery] = [EngagementStatus.Completed, EngagementStatus.Disputed],
            [EngagementStatus.Completed] = [EngagementStatus.Archived],
            [EngagementStatus.Disputed] = [EngagementStatus.Active, EngagementStatus.MilestoneReview, EngagementStatus.Cancelled],
            [EngagementStatus.Cancelled] = [EngagementStatus.Archived],
        };

    private static readonly IReadOnlyDictionary<WorkroomMilestoneStatus, WorkroomMilestoneStatus[]> MilestoneTransitions =
        new Dictionary<WorkroomMilestoneStatus, WorkroomMilestoneStatus[]>
        {
            [WorkroomMilestoneStatus.Draft] = [WorkroomMilestoneStatus.FundingRequired, WorkroomMilestoneStatus.Cancelled],
            [WorkroomMilestoneStatus.FundingRequired] = [WorkroomMilestoneStatus.Funded, WorkroomMilestoneStatus.Cancelled],
            [WorkroomMilestoneStatus.Funded] = [WorkroomMilestoneStatus.Active, WorkroomMilestoneStatus.Cancelled],
            [WorkroomMilestoneStatus.Active] = [WorkroomMilestoneStatus.SubmissionDraft, WorkroomMilestoneStatus.Submitted, WorkroomMilestoneStatus.ClientReviewing, WorkroomMilestoneStatus.Cancelled],
            [WorkroomMilestoneStatus.SubmissionDraft] = [WorkroomMilestoneStatus.Submitted, WorkroomMilestoneStatus.ClientReviewing],
            [WorkroomMilestoneStatus.Submitted] = [WorkroomMilestoneStatus.ClientReviewing, WorkroomMilestoneStatus.Disputed],
            [WorkroomMilestoneStatus.ClientReviewing] = [WorkroomMilestoneStatus.RevisionRequested, WorkroomMilestoneStatus.Approved, WorkroomMilestoneStatus.PaymentProcessing, WorkroomMilestoneStatus.Paid, WorkroomMilestoneStatus.Disputed],
            [WorkroomMilestoneStatus.RevisionRequested] = [WorkroomMilestoneStatus.RevisionInProgress, WorkroomMilestoneStatus.Disputed],
            [WorkroomMilestoneStatus.RevisionInProgress] = [WorkroomMilestoneStatus.Resubmitted],
            [WorkroomMilestoneStatus.Resubmitted] = [WorkroomMilestoneStatus.ClientReviewing, WorkroomMilestoneStatus.RevisionRequested, WorkroomMilestoneStatus.Approved, WorkroomMilestoneStatus.PaymentProcessing, WorkroomMilestoneStatus.Paid, WorkroomMilestoneStatus.Disputed],
            [WorkroomMilestoneStatus.Approved] = [WorkroomMilestoneStatus.PaymentProcessing],
            [WorkroomMilestoneStatus.PaymentProcessing] = [WorkroomMilestoneStatus.Paid, WorkroomMilestoneStatus.Disputed],
            // ProviderFavored resolution returns to ClientReviewing; ClientFavored settles
            // to Paid with RefundedAt set. Cancelled is retained as a legal edge but has no
            // writer — it is unreachable from every completion guard, so routing a resolved
            // dispute there stranded the engagement permanently (BUG-2).
            [WorkroomMilestoneStatus.Disputed] = [WorkroomMilestoneStatus.ClientReviewing, WorkroomMilestoneStatus.Paid, WorkroomMilestoneStatus.Cancelled],
        };

    public static bool CanTransition(EngagementStatus from, EngagementStatus to) => from == to ||
        (EngagementTransitions.TryGetValue(from, out var allowed) && allowed.Contains(to));
    public static bool CanTransition(WorkroomMilestoneStatus from, WorkroomMilestoneStatus to) => from == to ||
        (MilestoneTransitions.TryGetValue(from, out var allowed) && allowed.Contains(to));
}
