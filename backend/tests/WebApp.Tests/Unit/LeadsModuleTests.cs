using FluentAssertions;
using WebApp.Configuration;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

public class LeadsModuleTests
{
    [Theory]
    [InlineData(ProposalStatus.Draft, ProposalStatus.Submitted)]
    [InlineData(ProposalStatus.Submitted, ProposalStatus.Viewed)]
    [InlineData(ProposalStatus.Viewed, ProposalStatus.ChangesRequested)]
    [InlineData(ProposalStatus.ChangesRequested, ProposalStatus.Revised)]
    [InlineData(ProposalStatus.Revised, ProposalStatus.ClientReviewing)]
    [InlineData(ProposalStatus.ClientReviewing, ProposalStatus.Accepted)]
    public void Canonical_transitions_are_allowed(ProposalStatus from, ProposalStatus to) =>
        ProposalStateMachine.CanTransition(from, to).Should().BeTrue();

    [Theory]
    [InlineData(ProposalStatus.Viewed, ProposalStatus.Accepted)]
    [InlineData(ProposalStatus.Accepted, ProposalStatus.Withdrawn)]
    [InlineData(ProposalStatus.Accepted, ProposalStatus.ConvertedToProject)]
    [InlineData(ProposalStatus.Declined, ProposalStatus.Submitted)]
    public void Forbidden_transitions_are_rejected(ProposalStatus from, ProposalStatus to) =>
        ProposalStateMachine.CanTransition(from, to).Should().BeFalse();

    [Fact]
    public void Saved_and_message_sent_are_not_proposal_statuses()
    {
        Enum.TryParse<ProposalStatus>("Saved", out _).Should().BeFalse();
        Enum.TryParse<ProposalStatus>("MessageSent", out _).Should().BeFalse();
    }

    [Fact]
    public void Commission_preview_uses_the_single_platform_constant()
    {
        PlatformCommerceConstants.CommissionRate.Should().Be(0.12m);
        var preview = CommissionPreviewResponse.From(2150m, "USD");
        preview.Commission.Should().Be(258m);
        preview.Net.Should().Be(1892m);
    }

    [Fact]
    public void Previous_versions_are_embedded_and_purchase_snapshot_stores_no_commission_rate()
    {
        var p = new Proposal { PreviousVersions = new() { new() { Version = 1, ProposedPrice = 100 } } };
        p.PreviousVersions.Should().ContainSingle(x => x.Version == 1);
        typeof(PurchaseSnapshot).GetProperties().Select(x => x.Name)
            .Should().NotContain(new[] { "CommissionRate", "CommissionAmount" });
    }

    [Fact]
    public void Availability_is_a_hard_candidate_filter()
    {
        var u = new ApplicationUser
        {
            Tier_level = 2,
            ServiceProviderProfile = new()
            {
                VerificationStatus = ServiceProviderVerificationStatus.Verified,
                ServiceCategories = new() { ServiceCategory.Design },
                NewOrderAvailability = false,
            },
        };
        SpMatchingService.IsEligibleCandidate(u, ServiceCategory.Design).Should().BeFalse();
        u.ServiceProviderProfile.NewOrderAvailability = true;
        u.ServiceProviderProfile.MaximumConcurrentOrders = 2;
        u.ServiceProviderProfile.CurrentActiveOrders = 2;
        SpMatchingService.IsEligibleCandidate(u, ServiceCategory.Design).Should().BeFalse();
        u.ServiceProviderProfile.CurrentActiveOrders = 1;
        SpMatchingService.IsEligibleCandidate(u, ServiceCategory.Design).Should().BeTrue();
    }

    [Fact]
    public void Match_score_reads_real_response_signal_not_the_old_stub()
    {
        var u = new ApplicationUser
        {
            Tier_level = 2,
            ServiceProviderProfile = new()
            {
                VerificationStatus = ServiceProviderVerificationStatus.Verified,
                ServiceCategories = new() { ServiceCategory.Design },
                Industries = new() { "Fintech" },
                TrustBreakdown = new() { ResponseRate = new() { HasData = true, Value = 50 } },
            },
        };
        var score = new SpMatchingService(null!).Score(u, "Fintech");
        score.Should().BeApproximately(0.74, 0.0001); // 0.35 + 0.15 + 0.10 + 0.14
    }

    [Fact]
    public void Response_window_is_exactly_48_hours() =>
        ResponseRateService.ResponseWindow.Should().Be(TimeSpan.FromHours(48));

    [Fact]
    public void Normally_published_brief_clock_uses_published_at_not_lazy_row_creation_time()
    {
        var publishedAt = DateTime.UtcNow.AddDays(-2);
        var brief = new ClientBrief { CreatedAt = publishedAt.AddHours(-1), PublishedAt = publishedAt };

        LeadsService.ResolveAvailabilityTimestamp(brief, "provider-1").Should().Be(publishedAt);
    }

    [Fact]
    public void Direct_invitation_clock_uses_the_provider_delivery_receipt()
    {
        var publishedAt = DateTime.UtcNow.AddHours(-8);
        var deliveredAt = publishedAt.AddMinutes(3);
        var brief = new ClientBrief
        {
            PublishedAt = publishedAt,
            InvitedProviderIds = new() { "provider-1" },
            InvitationDeliveries = new() { new() { ProviderId = "provider-1", DeliveredAt = deliveredAt } },
        };

        LeadsService.ResolveAvailabilityTimestamp(brief, "provider-1").Should().Be(deliveredAt);
    }

    [Fact]
    public void Legacy_invitation_without_delivery_receipt_falls_back_to_published_at()
    {
        var publishedAt = DateTime.UtcNow.AddHours(-8);
        var brief = new ClientBrief { PublishedAt = publishedAt, InvitedProviderIds = new() { "provider-1" } };

        LeadsService.ResolveAvailabilityTimestamp(brief, "provider-1").Should().Be(publishedAt);
    }
}
