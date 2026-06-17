using System.Linq;
using FluentAssertions;
using WebApp.Models.DatabaseModels;
using WebApp.Services;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// Phase D-3 deal write authorization: role permission matrix, turn rules,
/// signature slots, and invalid-transition guards.
/// </summary>
public class DealActionPolicyTests
{
    // ---- Role permission matrix --------------------------------------------

    [Theory]
    [InlineData(DealAction.EditTerms)]
    [InlineData(DealAction.ProgressChecklist)]
    [InlineData(DealAction.UpdateStatus)]
    [InlineData(DealAction.MutateDueDiligence)]
    [InlineData(DealAction.CloseDeal)]
    public void Founder_only_actions_are_denied_to_investor(DealAction action)
    {
        DealActionPolicy.CanPerform(DealRoles.Founder, action).Should().BeTrue();
        DealActionPolicy.CanPerform(DealRoles.Investor, action).Should().BeFalse();
    }

    [Theory]
    [InlineData(DealAction.UploadDocument)]
    [InlineData(DealAction.DownloadDocument)]
    [InlineData(DealAction.SignTermSheet)]
    public void Shared_actions_are_allowed_to_both_roles(DealAction action)
    {
        DealActionPolicy.CanPerform(DealRoles.Founder, action).Should().BeTrue();
        DealActionPolicy.CanPerform(DealRoles.Investor, action).Should().BeTrue();
    }

    [Fact]
    public void Founder_and_investor_do_not_have_identical_permissions()
    {
        var allActions = (DealAction[])System.Enum.GetValues(typeof(DealAction));
        var differs = allActions.Any(a =>
            DealActionPolicy.CanPerform(DealRoles.Founder, a) !=
            DealActionPolicy.CanPerform(DealRoles.Investor, a));
        differs.Should().BeTrue();
    }

    [Fact]
    public void Unknown_role_is_denied_every_action()
    {
        foreach (DealAction a in System.Enum.GetValues(typeof(DealAction)))
            DealActionPolicy.CanPerform("stranger", a).Should().BeFalse();
    }

    [Fact]
    public void AssertCanPerform_throws_for_denied_action()
    {
        var act = () => DealActionPolicy.AssertCanPerform(DealRoles.Investor, DealAction.EditTerms);
        act.Should().Throw<UnauthorizedAccessException>();
    }

    // ---- Turn rules ---------------------------------------------------------

    [Fact]
    public void Investor_cannot_accept_or_respond_to_its_own_offer()
    {
        DealActionPolicy.CanRespondToOffer(DealRoles.Investor, proposerRole: DealRoles.Investor)
            .Should().BeFalse();
    }

    [Fact]
    public void Founder_cannot_respond_to_its_own_offer()
    {
        DealActionPolicy.CanRespondToOffer(DealRoles.Founder, proposerRole: DealRoles.Founder)
            .Should().BeFalse();
    }

    [Fact]
    public void Counterparty_may_respond_to_the_other_partys_offer()
    {
        DealActionPolicy.CanRespondToOffer(DealRoles.Founder, DealRoles.Investor).Should().BeTrue();
        DealActionPolicy.CanRespondToOffer(DealRoles.Investor, DealRoles.Founder).Should().BeTrue();
    }

    // ---- Signature slots ----------------------------------------------------

    [Fact]
    public void Signature_slot_is_fixed_by_role_so_cross_slot_signing_is_impossible()
    {
        DealActionPolicy.SignatureSlotForRole(DealRoles.Founder).Should().Be(DealRoles.Founder);
        DealActionPolicy.SignatureSlotForRole(DealRoles.Investor).Should().Be(DealRoles.Investor);
    }

    [Fact]
    public void Deal_is_fully_signed_only_when_both_slots_present()
    {
        var sig = new DealSignatures();
        sig.BothSigned.Should().BeFalse();

        sig.FounderSignedAt = System.DateTime.UtcNow;
        sig.BothSigned.Should().BeFalse(); // founder only

        sig.InvestorSignedAt = System.DateTime.UtcNow;
        sig.BothSigned.Should().BeTrue(); // both
    }

    // ---- Invalid transitions ------------------------------------------------

    [Fact]
    public void Term_sheet_cannot_jump_from_draft_to_signed()
    {
        Phase9Requirements.IsValidTermSheetTransition(
            Phase9Requirements.TermSheetStatusDraft,
            Phase9Requirements.TermSheetStatusSigned).Should().BeFalse();
    }

    [Fact]
    public void Term_sheet_may_move_from_agreed_to_signed()
    {
        Phase9Requirements.IsValidTermSheetTransition(
            Phase9Requirements.TermSheetStatusAgreed,
            Phase9Requirements.TermSheetStatusSigned).Should().BeTrue();
    }

    [Fact]
    public void Deal_cannot_jump_from_initiated_to_completed()
    {
        Phase9Requirements.IsValidDealTransition(
            Phase9Requirements.DealStatusInitiated,
            Phase9Requirements.DealStatusCompleted).Should().BeFalse();
    }

    [Fact]
    public void Deal_may_move_from_signed_to_completed()
    {
        Phase9Requirements.IsValidDealTransition(
            Phase9Requirements.DealStatusSigned,
            Phase9Requirements.DealStatusCompleted).Should().BeTrue();
    }
}
