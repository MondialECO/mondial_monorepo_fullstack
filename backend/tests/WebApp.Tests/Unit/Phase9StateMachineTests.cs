using FluentAssertions;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// Phase 9 deal state machine: enforce the 12-state deal axis, the 6-state
/// term sheet axis, the 5-state participant axis, and the corresponding
/// transition graphs. Illegal transitions surface as HTTP 400 in the
/// service layer; here we assert the pure rule logic so the contract is
/// stable independent of mocking.
/// </summary>
public class Phase9StateMachineTests
{
    [Fact]
    public void DealStatusWhitelist_contains_all_12_required_states()
    {
        Phase9Requirements.DealStatusWhitelist.Should().BeEquivalentTo(new[]
        {
            "initiated", "contacted", "interested", "meeting_scheduled",
            "due_diligence", "negotiating", "term_sheet", "agreement_sent",
            "signed", "completed", "rejected", "withdrawn",
        });
    }

    [Theory]
    [InlineData("initiated", "contacted")]
    [InlineData("contacted", "interested")]
    [InlineData("interested", "meeting_scheduled")]
    [InlineData("meeting_scheduled", "due_diligence")]
    [InlineData("due_diligence", "negotiating")]
    [InlineData("negotiating", "term_sheet")]
    [InlineData("term_sheet", "agreement_sent")]
    [InlineData("agreement_sent", "signed")]
    [InlineData("signed", "completed")]
    public void Deal_happy_path_transitions_are_legal(string from, string to)
    {
        Phase9Requirements.IsValidDealTransition(from, to).Should().BeTrue();
    }

    [Theory]
    [InlineData("initiated", "signed")]
    [InlineData("contacted", "completed")]
    [InlineData("interested", "agreement_sent")]
    [InlineData("negotiating", "completed")]
    [InlineData("term_sheet", "signed")]
    [InlineData("agreement_sent", "completed")]
    public void Deal_skip_transitions_are_illegal(string from, string to)
    {
        Phase9Requirements.IsValidDealTransition(from, to).Should().BeFalse();
    }

    [Theory]
    [InlineData("completed")]
    [InlineData("rejected")]
    [InlineData("withdrawn")]
    public void Deal_terminal_states_have_no_outbound_transitions(string terminal)
    {
        Phase9Requirements.IsTerminalDealStatus(terminal).Should().BeTrue();
        foreach (var candidate in Phase9Requirements.DealStatusWhitelist)
        {
            Phase9Requirements.IsValidDealTransition(terminal, candidate)
                .Should().BeFalse($"terminal state '{terminal}' must not transition to '{candidate}'");
        }
    }

    [Theory]
    [InlineData("initiated")]
    [InlineData("contacted")]
    [InlineData("interested")]
    [InlineData("meeting_scheduled")]
    [InlineData("due_diligence")]
    [InlineData("negotiating")]
    [InlineData("term_sheet")]
    [InlineData("agreement_sent")]
    public void Deal_non_terminal_pre_signed_states_can_be_withdrawn(string from)
    {
        Phase9Requirements.IsValidDealTransition(from, "withdrawn").Should().BeTrue();
    }

    [Fact]
    public void Deal_signed_cannot_be_rejected_or_withdrawn()
    {
        Phase9Requirements.IsValidDealTransition("signed", "rejected").Should().BeFalse();
        Phase9Requirements.IsValidDealTransition("signed", "withdrawn").Should().BeFalse();
    }

    [Theory]
    [InlineData("draft", "proposed")]
    [InlineData("proposed", "negotiating")]
    [InlineData("proposed", "agreed")]
    [InlineData("negotiating", "agreed")]
    [InlineData("agreed", "signed")]
    public void TermSheet_happy_path_transitions_are_legal(string from, string to)
    {
        Phase9Requirements.IsValidTermSheetTransition(from, to).Should().BeTrue();
    }

    [Theory]
    [InlineData("draft", "signed")]
    [InlineData("draft", "agreed")]
    [InlineData("proposed", "signed")]
    [InlineData("negotiating", "signed")]
    public void TermSheet_cannot_skip_to_signed(string from, string to)
    {
        Phase9Requirements.IsValidTermSheetTransition(from, to).Should().BeFalse();
    }

    [Fact]
    public void TermSheet_signed_is_terminal()
    {
        foreach (var to in Phase9Requirements.TermSheetStatusWhitelist)
            Phase9Requirements.IsValidTermSheetTransition("signed", to).Should().BeFalse();
    }

    [Theory]
    [InlineData("interested", "negotiating")]
    [InlineData("negotiating", "committed")]
    [InlineData("committed", "funded")]
    public void Participant_happy_path_transitions_are_legal(string from, string to)
    {
        Phase9Requirements.IsValidParticipantTransition(from, to).Should().BeTrue();
    }

    [Theory]
    [InlineData("interested", "committed")]
    [InlineData("interested", "funded")]
    [InlineData("committed", "interested")]
    public void Participant_illegal_transitions_blocked(string from, string to)
    {
        Phase9Requirements.IsValidParticipantTransition(from, to).Should().BeFalse();
    }

    [Fact]
    public void Unknown_statuses_are_rejected_in_all_axes()
    {
        Phase9Requirements.IsValidDealStatus("negotiation").Should().BeFalse(); // pre-Phase-9 legacy string
        Phase9Requirements.IsValidDealStatus("closed").Should().BeFalse(); // legacy
        Phase9Requirements.IsValidTermSheetStatus("closed").Should().BeFalse();
        Phase9Requirements.IsValidParticipantStatus("active").Should().BeFalse();
        Phase9Requirements.IsValidDealTransition("contacted", "bogus").Should().BeFalse();
        Phase9Requirements.IsValidDealTransition("bogus", "contacted").Should().BeFalse();
    }

    [Fact]
    public void RequiredTerminalStatesForCompletion_excludes_rejected_and_withdrawn()
    {
        Phase9Requirements.RequiredTerminalStatesForCompletion
            .Should().BeEquivalentTo(new[] { "signed", "completed" });
        Phase9Requirements.RequiredTerminalStatesForCompletion
            .Should().NotContain("rejected");
        Phase9Requirements.RequiredTerminalStatesForCompletion
            .Should().NotContain("withdrawn");
    }

    [Theory]
    [InlineData("term_sheet")]
    [InlineData("signed_agreement")]
    [InlineData("due_diligence")]
    [InlineData("other")]
    public void DealDocumentKindWhitelist_accepts_expected_kinds(string kind)
    {
        Phase9Requirements.IsValidDealDocumentKind(kind).Should().BeTrue();
    }

    [Fact]
    public void DealDocumentKind_rejects_unknown()
    {
        Phase9Requirements.IsValidDealDocumentKind("contract").Should().BeFalse();
        Phase9Requirements.IsValidDealDocumentKind(string.Empty).Should().BeFalse();
    }

    [Fact]
    public void Activity_event_type_whitelist_is_enforced()
    {
        Phase9Requirements.IsValidActivityEventType("deal_status_changed").Should().BeTrue();
        Phase9Requirements.IsValidActivityEventType("term_sheet_signed").Should().BeTrue();
        Phase9Requirements.IsValidActivityEventType("deal_document_uploaded").Should().BeTrue();
        Phase9Requirements.IsValidActivityEventType("user_login").Should().BeFalse();
    }

    /// <summary>
    /// Spec-mandated illegal transitions that must always fail. These exact
    /// cases were called out in the Phase 9 P0 verification list.
    /// </summary>
    [Theory]
    [InlineData("initiated", "signed")]      // can't skip the whole pipeline
    [InlineData("rejected", "negotiating")]  // terminal -> reopen forbidden
    [InlineData("completed", "due_diligence")] // terminal -> reopen forbidden
    [InlineData("signed", "draft")]          // cross-axis bleed: draft isn't even a deal status
    public void Spec_mandated_illegal_transitions_are_blocked(string from, string to)
    {
        Phase9Requirements.IsValidDealTransition(from, to).Should().BeFalse(
            $"transition '{from}' -> '{to}' must always be rejected");
    }

    [Fact]
    public void Close_requires_signed_first()
    {
        // The dedicated CloseDealAsync path drives signed -> completed.
        // Any other origin must be rejected by the transition graph.
        Phase9Requirements.IsValidDealTransition("signed", "completed").Should().BeTrue();
        Phase9Requirements.IsValidDealTransition("initiated", "completed").Should().BeFalse();
        Phase9Requirements.IsValidDealTransition("negotiating", "completed").Should().BeFalse();
        Phase9Requirements.IsValidDealTransition("agreement_sent", "completed").Should().BeFalse();
        Phase9Requirements.IsValidDealTransition("term_sheet", "completed").Should().BeFalse();
    }

    [Fact]
    public void Case_insensitive_status_lookups_still_resolve()
    {
        // Service layer lower-cases before storage; verify the helpers also
        // treat mixed case as the canonical form so legacy rows don't
        // accidentally fail validation.
        Phase9Requirements.IsValidDealStatus("Signed").Should().BeTrue();
        Phase9Requirements.IsValidDealTransition("Signed", "Completed").Should().BeTrue();
    }
}
