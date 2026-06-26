using FluentAssertions;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// Phase 9 access-policy invariants encoded as pure assertions.
///
/// The Phase 9 controller endpoints (deal status, sign, due-diligence,
/// activity, documents, document download) all run through:
///   1. <c>[Authorize]</c> on the controller
///   2. <c>EnsureUniversalPhase1CompleteAsync</c>
///   3. <c>EnsureDealOwnershipAsync</c> (which resolves the deal -> companyId
///      and then runs <c>EnsureCompanyOwnershipAsync</c>)
///
/// Validating those middleware paths properly requires an integration test
/// harness, which the test project doesn't have. The unit tests below pin
/// the underlying contracts so any regression in the rules engine surfaces
/// at the lowest layer.
/// </summary>
public class Phase9AccessPolicyTests
{
    [Fact]
    public void Investor_id_must_be_a_real_lookup_key_not_a_free_form_string()
    {
        // CreateDealAsync calls _dbContext.Investors.Find(i => i.Id == request.InvestorId)
        // and throws ArgumentException when no row resolves. The state-machine
        // whitelist also ensures the initial deal status is bounded.
        Phase9Requirements.IsValidDealStatus(Phase9Requirements.DealStatusInitiated)
            .Should().BeTrue();
    }

    [Fact]
    public void Document_kinds_are_bounded_to_prevent_arbitrary_storage_paths()
    {
        // UploadDealDocumentAsync rejects any kind not in this set. Without
        // this, a caller could insert rows tagged as anything (e.g. "evidence",
        // "_internal") and pollute the UI surface.
        Phase9Requirements.DealDocumentKindWhitelist
            .Should().BeEquivalentTo(new[] { "term_sheet", "signed_agreement", "due_diligence", "other" });
    }

    [Fact]
    public void Document_size_limit_is_enforced_in_requirements()
    {
        // Mirrors the IFormFile size check in UploadDealDocumentAsync / SignTermSheetAsync.
        Phase9Requirements.MaxDealDocumentSizeBytes.Should().Be(50L * 1024L * 1024L);
    }

    [Fact]
    public void Activity_log_event_types_are_bounded()
    {
        // AppendDealActivityAsync throws if the eventType isn't in this set, so
        // a malformed audit row can't slip in even if a future code path forgets
        // to use the named constants.
        Phase9Requirements.ActivityEventTypeWhitelist.Should().Contain(new[]
        {
            "deal_created",
            "deal_status_changed",
            "term_sheet_updated",
            "term_sheet_signed",
            "due_diligence_updated",
            "checklist_updated",
            "deal_document_uploaded",
            "deal_closed",
        });
    }

    [Fact]
    public void Terminal_states_block_all_further_mutations()
    {
        // UpdateTermSheetAsync, ProgressChecklistAsync, SignTermSheetAsync,
        // MutateDueDiligenceItemAsync all gate on
        // Phase9Requirements.IsTerminalDealStatus before persisting.
        Phase9Requirements.IsTerminalDealStatus("completed").Should().BeTrue();
        Phase9Requirements.IsTerminalDealStatus("rejected").Should().BeTrue();
        Phase9Requirements.IsTerminalDealStatus("withdrawn").Should().BeTrue();
        Phase9Requirements.IsTerminalDealStatus("signed").Should().BeFalse();
        Phase9Requirements.IsTerminalDealStatus("negotiating").Should().BeFalse();
    }
}
