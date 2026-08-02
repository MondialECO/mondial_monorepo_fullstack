using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Implementations;

/// <summary>Single authoritative transition table for negotiated proposals.</summary>
public static class ProposalStateMachine
{
    private static readonly HashSet<(ProposalStatus From, ProposalStatus To)> Allowed = new()
    {
        (ProposalStatus.Draft, ProposalStatus.Submitted),
        (ProposalStatus.Submitted, ProposalStatus.Viewed),
        (ProposalStatus.Submitted, ProposalStatus.Withdrawn),
        (ProposalStatus.Submitted, ProposalStatus.Expired),
        (ProposalStatus.Viewed, ProposalStatus.ChangesRequested),
        (ProposalStatus.Viewed, ProposalStatus.ClientReviewing),
        (ProposalStatus.ChangesRequested, ProposalStatus.Revised),
        (ProposalStatus.Revised, ProposalStatus.ClientReviewing),
        (ProposalStatus.ClientReviewing, ProposalStatus.Accepted),
        (ProposalStatus.ClientReviewing, ProposalStatus.Declined),
        // Module 4 owns Accepted -> ConvertedToProject; intentionally absent here.
    };

    public static bool CanTransition(ProposalStatus from, ProposalStatus to) => Allowed.Contains((from, to));

    public static void Ensure(ProposalStatus from, ProposalStatus to)
    {
        if (!CanTransition(from, to))
            throw new InvalidOperationException($"Proposal transition {from} -> {to} is not allowed.");
    }
}
