using FluentAssertions;
using WebApp.Services;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// Offer lifecycle invariants (Phase D-4): per-revision state machine, turn
/// ownership, and accept/reject/counter flow. Pure assertions over the
/// transition graph + policy (the service paths are DB-bound and exercised by
/// integration tests).
/// </summary>
public class OfferStateMachineTests
{
    // ---- Offer state machine -----------------------------------------------

    [Fact]
    public void All_offer_states_are_whitelisted()
    {
        foreach (var s in new[]
        {
            Phase9Requirements.OfferStatusDraft,
            Phase9Requirements.OfferStatusSent,
            Phase9Requirements.OfferStatusViewed,
            Phase9Requirements.OfferStatusCountered,
            Phase9Requirements.OfferStatusAccepted,
            Phase9Requirements.OfferStatusRejected,
        })
        {
            Phase9Requirements.IsValidOfferStatus(s).Should().BeTrue();
        }
    }

    [Theory]
    [InlineData("draft", "sent")]
    [InlineData("sent", "viewed")]
    [InlineData("sent", "accepted")]
    [InlineData("sent", "rejected")]
    [InlineData("sent", "countered")]
    [InlineData("viewed", "accepted")]
    [InlineData("viewed", "rejected")]
    [InlineData("viewed", "countered")]
    public void Valid_offer_transitions_are_allowed(string from, string to)
    {
        Phase9Requirements.IsValidOfferTransition(from, to).Should().BeTrue();
    }

    [Theory]
    [InlineData("draft", "accepted")]   // must be sent first
    [InlineData("draft", "viewed")]
    [InlineData("countered", "sent")]   // countered is terminal for its revision
    [InlineData("accepted", "rejected")]// accepted is terminal
    [InlineData("rejected", "accepted")]// rejected is terminal
    [InlineData("accepted", "countered")]
    public void Invalid_offer_transitions_are_rejected(string from, string to)
    {
        Phase9Requirements.IsValidOfferTransition(from, to).Should().BeFalse();
    }

    [Fact]
    public void Accepted_countered_and_rejected_are_terminal_for_a_revision()
    {
        foreach (var terminal in new[]
        {
            Phase9Requirements.OfferStatusAccepted,
            Phase9Requirements.OfferStatusCountered,
            Phase9Requirements.OfferStatusRejected,
        })
        {
            foreach (var any in Phase9Requirements.OfferStatusWhitelist)
                Phase9Requirements.IsValidOfferTransition(terminal, any).Should().BeFalse();
        }
    }

    // ---- Turn ownership / accept-reject-counter flow -----------------------

    [Fact]
    public void Proposer_cannot_accept_reject_or_counter_its_own_offer()
    {
        // Investor proposed -> investor may not respond; founder may.
        DealActionPolicy.CanRespondToOffer(DealRoles.Investor, DealRoles.Investor).Should().BeFalse();
        DealActionPolicy.CanRespondToOffer(DealRoles.Founder, DealRoles.Investor).Should().BeTrue();

        // Founder proposed (counter) -> founder may not respond; investor may.
        DealActionPolicy.CanRespondToOffer(DealRoles.Founder, DealRoles.Founder).Should().BeFalse();
        DealActionPolicy.CanRespondToOffer(DealRoles.Investor, DealRoles.Founder).Should().BeTrue();
    }

    [Fact]
    public void Both_roles_are_permitted_offer_actions_in_the_matrix()
    {
        foreach (var action in new[] { DealAction.CreateOffer, DealAction.AcceptOffer, DealAction.RejectOffer, DealAction.CounterOffer })
        {
            DealActionPolicy.CanPerform(DealRoles.Founder, action).Should().BeTrue();
            DealActionPolicy.CanPerform(DealRoles.Investor, action).Should().BeTrue();
        }
    }

    [Fact]
    public void Full_negotiation_lifecycle_follows_the_graph()
    {
        // investor sends -> founder views -> founder counters (rev1 countered),
        // new rev2 sent -> investor accepts.
        Phase9Requirements.IsValidOfferTransition("sent", "viewed").Should().BeTrue();
        Phase9Requirements.IsValidOfferTransition("viewed", "countered").Should().BeTrue();
        // rev2 begins at 'sent'
        Phase9Requirements.IsValidOfferTransition("sent", "accepted").Should().BeTrue();
    }
}
