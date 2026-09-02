using FluentAssertions;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Migrations;
using Xunit;

namespace WebApp.Tests.Unit;

public sealed class DealLifecycleReconciliationTests
{
    [Fact]
    public void Signed_term_sheet_with_both_persisted_signatures_is_eligible()
    {
        DealLifecycleReconciliation.IneligibilityReason(EligibleDeal()).Should().BeNull();
    }

    [Theory]
    [InlineData("completed")]
    [InlineData("rejected")]
    [InlineData("withdrawn")]
    public void Terminal_deals_are_never_eligible(string status)
    {
        var deal = EligibleDeal();
        deal.Status = status;

        DealLifecycleReconciliation.IneligibilityReason(deal)
            .Should().Contain("Terminal deal");
    }

    [Fact]
    public void Missing_signature_is_not_eligible()
    {
        var deal = EligibleDeal();
        deal.Signatures.InvestorSignedAt = null;

        DealLifecycleReconciliation.IneligibilityReason(deal)
            .Should().Contain("Both persisted signature");
    }

    [Fact]
    public void Frontend_or_term_sheet_claim_without_accepted_revision_is_not_eligible()
    {
        var deal = EligibleDeal();
        deal.Revisions[0].Status = "sent";

        DealLifecycleReconciliation.IneligibilityReason(deal)
            .Should().Contain("accepted persisted revision");
    }

    private static DealExecution EligibleDeal() => new()
    {
        Id = "6a975543c10741ad5b587b57",
        CompanyId = "6a975543c10741ad5b587b58",
        Status = "initiated",
        TermSheet = new TermSheet { Status = "signed" },
        Signatures = new DealSignatures
        {
            FounderSignedAt = DateTime.UtcNow,
            InvestorSignedAt = DateTime.UtcNow,
        },
        Revisions = new List<TermSheetRevision>
        {
            new() { RevisionNumber = 1, Status = "accepted" }
        }
    };
}
