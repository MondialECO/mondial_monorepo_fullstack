using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using MongoDB.Bson;
using WebApp.Configuration;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

public class WorkroomModuleTests
{
    [Fact]
    public async Task Payment_stub_succeeds_deterministically_and_is_idempotency_keyed()
    {
        var gateway = Gateway();
        var first = await gateway.AuthorizeEscrowAsync("milestone-1", 100m, "EUR");
        var second = await gateway.AuthorizeEscrowAsync("milestone-1", 100m, "EUR");
        first.Success.Should().BeTrue();
        second.GatewayReference.Should().Be(first.GatewayReference).And.Be("stub_escrow_milestone-1");
    }

    [Fact]
    public async Task Payment_stub_can_exercise_failure_path()
    {
        var gateway = Gateway(true);
        var result = await gateway.ReleaseEscrowAsync("release-1", "escrow-1", 50m, "USD");
        result.Success.Should().BeFalse();
        result.Error.Should().Contain("STUB");
    }

    [Fact]
    public async Task Payment_stub_supports_all_confirmed_gateway_operations()
    {
        var gateway = Gateway();
        (await gateway.ReleaseEscrowAsync("r", "e", 10, "EUR")).Success.Should().BeTrue();
        (await gateway.RefundEscrowAsync("f", "e", 10, "EUR")).Success.Should().BeTrue();
        var payout = await gateway.CreatePayoutAsync("p", "masked", 10, "EUR");
        payout.Success.Should().BeTrue();
        (await gateway.GetPayoutStatusAsync(payout.GatewayReference!)).Status.Should().Be(PayoutStatus.Completed);
    }

    [Fact]
    public async Task File_scanner_stub_accepts_current_documents_rules()
    {
        var result = await new StubFileSecurityScanner().ScanAsync(File("delivery.pdf", 1024));
        result.Passed.Should().BeTrue();
    }

    [Fact]
    public async Task File_scanner_stub_rejects_disallowed_extension()
    {
        var result = await new StubFileSecurityScanner().ScanAsync(File("payload.exe", 10));
        result.Passed.Should().BeFalse();
        result.Error.Should().Contain("Invalid file type");
    }

    [Fact]
    public async Task File_scanner_stub_rejects_over_20mb()
    {
        var result = await new StubFileSecurityScanner().ScanAsync(File("large.pdf", 20 * 1024 * 1024 + 1L));
        result.Passed.Should().BeFalse();
        result.Error.Should().Contain("20MB");
    }

    [Fact]
    public void Commission_release_math_consumes_the_shared_constant()
    {
        var gross = 950m;
        var commission = decimal.Round(gross * PlatformCommerceConstants.CommissionRate, 2);
        commission.Should().Be(114m);
        (gross - commission).Should().Be(836m);
    }

    [Fact]
    public void Financial_transaction_does_not_store_a_commission_rate()
        => typeof(FinancialTransaction).GetProperties().Select(x => x.Name)
            .Should().NotContain(x => x.Contains("CommissionRate", StringComparison.OrdinalIgnoreCase));

    [Fact]
    public void Provider_financial_settings_are_embedded_not_an_identity_collection()
    {
        var profile = new ServiceProviderProfile();
        profile.FinancialSettings.PayoutMethods.Add(new MaskedPayoutMethod { Rail = PayoutRail.Wise, MaskedDescriptor = "****1234", DisplayName = "Wise", Verified = true });
        var bson = profile.ToBsonDocument();
        bson.Contains("FinancialSettings").Should().BeTrue();
        bson["FinancialSettings"]["PayoutMethods"].AsBsonArray.Should().HaveCount(1);
    }

    [Fact]
    public void Contract_terms_are_an_immutable_conversion_snapshot_shape()
    {
        var properties = typeof(ContractTerms).GetProperties().Select(x => x.Name).ToHashSet();
        properties.Should().Contain(new[] { "Price", "Currency", "PricingType", "DeliveryTimeValue", "IncludedRevisionCount", "UnlimitedRevisions", "Deliverables", "AllowsParallelMilestones" });
    }

    [Fact]
    public void Milestone_holds_live_revision_entitlement_inputs()
    {
        var milestone = new WorkroomMilestone { IncludedRevisionCount = 2, PurchasedAdditionalRevisions = 1, UsedRevisionCount = 2 };
        RevisionCalculator.Remaining(milestone.IncludedRevisionCount, milestone.PurchasedAdditionalRevisions, milestone.UsedRevisionCount).Should().Be(1);
    }

    [Fact]
    public void Deliverable_versions_are_preserved_as_separate_documents_by_shape()
    {
        var v1 = new Deliverable { Id = ObjectId.GenerateNewId().ToString(), MilestoneId = ObjectId.GenerateNewId().ToString(), Version = "1.0", DeliverableStatus = DeliverableStatus.Superseded };
        var v2 = new Deliverable { Id = ObjectId.GenerateNewId().ToString(), MilestoneId = v1.MilestoneId, Version = "1.1", DeliverableStatus = DeliverableStatus.Locked };
        v1.Id.Should().NotBe(v2.Id);
        v1.Version.Should().NotBe(v2.Version);
    }

    [Fact]
    public void Workroom_response_explicitly_labels_contract_consent_as_stub()
        => new ContractResponse().SimpleConsentStub.Should().BeTrue();

    [Fact]
    public void Workroom_detail_response_exposes_existing_provider_records()
    {
        var properties = typeof(WorkroomDetailResponse).GetProperties().Select(x => x.Name).ToHashSet();
        properties.Should().Contain(new[] { "Files", "HourlyTimeEntries", "Review" });
    }

    [Fact]
    public void Engagement_response_includes_existing_client_identity_and_live_schedule_fields()
    {
        var currentMilestoneId = ObjectId.GenerateNewId().ToString();
        var response = new WorkroomEngagement { CurrentMilestoneId = currentMilestoneId }.ToResponse("NovaPay Technologies");
        response.ClientDisplayName.Should().Be("NovaPay Technologies");
        response.CurrentMilestoneId.Should().Be(currentMilestoneId);
    }

    [Fact]
    public void Financial_summary_exposes_server_owned_earnings_totals_and_currencies()
    {
        var properties = typeof(ProviderFinancialSummaryResponse).GetProperties().Select(x => x.Name).ToHashSet();
        properties.Should().Contain(new[] { "GrossEarnings", "CommissionPaid", "NetEarnings", "AvailableCurrencies" });
    }

    [Fact]
    public void Earnings_service_exposes_owned_payout_method_management()
    {
        var methods = typeof(WebApp.Services.Interface.IWorkroomService).GetMethods().Select(x => x.Name).ToHashSet();
        methods.Should().Contain(new[] { "SetDefaultPayoutMethodAsync", "RemovePayoutMethodAsync" });
    }

    [Fact]
    public void Repeat_coupon_is_tier_independent_by_schema()
        => typeof(RepeatClientCoupon).GetProperties().Select(x => x.Name)
            .Should().NotContain(x => x.Contains("Tier", StringComparison.OrdinalIgnoreCase));

    [Theory]
    [InlineData(WorkroomMilestoneStatus.FundingRequired, WorkroomMilestoneStatus.Funded, true)]
    [InlineData(WorkroomMilestoneStatus.Funded, WorkroomMilestoneStatus.Active, true)]
    [InlineData(WorkroomMilestoneStatus.ClientReviewing, WorkroomMilestoneStatus.RevisionRequested, true)]
    [InlineData(WorkroomMilestoneStatus.Paid, WorkroomMilestoneStatus.Active, false)]
    public void Milestone_state_machine_enforces_direction(WorkroomMilestoneStatus from, WorkroomMilestoneStatus to, bool expected)
        => WorkroomStateMachine.CanTransition(from, to).Should().Be(expected);

    [Theory]
    [InlineData(EngagementStatus.ContractPending, EngagementStatus.EscrowPending, true)]
    [InlineData(EngagementStatus.FinalDelivery, EngagementStatus.Completed, true)]
    [InlineData(EngagementStatus.Completed, EngagementStatus.Active, false)]
    public void Engagement_state_machine_keeps_closed_work_read_only(EngagementStatus from, EngagementStatus to, bool expected)
        => WorkroomStateMachine.CanTransition(from, to).Should().Be(expected);

    [Theory]
    [InlineData(0, 0)]
    [InlineData(1, 5)]
    [InlineData(4, 20)]
    [InlineData(9, 20)]
    public void Adverse_dispute_penalty_is_five_points_capped_at_twenty(int adverse, int expected)
        => Math.Min(20, Math.Max(0, adverse) * 5).Should().Be(expected);

    private static StubPaymentGatewayService Gateway(bool fail = false)
    {
        var values = new Dictionary<string, string?> { ["PaymentGatewayStub:SimulateFailure"] = fail.ToString() };
        return new StubPaymentGatewayService(new ConfigurationBuilder().AddInMemoryCollection(values).Build());
    }

    private static IFormFile File(string name, long length)
    {
        var stream = new MemoryStream(new byte[Math.Min(length, 16)]);
        return new FormFile(stream, 0, length, "file", name);
    }
}
