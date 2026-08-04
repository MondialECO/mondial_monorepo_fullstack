using FluentAssertions;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// The Earnings tab's client-source split, unit-tested without a database for the same
/// reason AnalyticsBucketWindowTests exists: the classification and the ratio arithmetic are
/// the parts that can silently be wrong, and they need no Mongo. The
/// transaction-to-proposal wiring is covered by AnalyticsClientSourceIntegrationTests,
/// which requires Docker and skips without it.
/// </summary>
public class AnalyticsClientSourceTests
{
    private static (ProposalSource? Source, decimal Net) Release(ProposalSource source, decimal net) => (source, net);
    private static (ProposalSource? Source, decimal Net) Untraceable(decimal net) => (null, net);

    [Theory]
    [InlineData(ProposalSource.StandardProposal)]
    [InlineData(ProposalSource.DirectInvitationProposal)]
    [InlineData(ProposalSource.CustomOffer)]
    public void Leads_flow_sources_are_ecosystem_matches(ProposalSource source)
        => AnalyticsClientSource.IsEcosystemMatch(source).Should().BeTrue();

    [Theory]
    [InlineData(ProposalSource.PublishedPackagePurchase)]
    [InlineData(ProposalSource.PackageAddOn)]
    [InlineData(ProposalSource.ChangeRequest)]
    public void Direct_purchase_sources_are_marketplace_searches(ProposalSource source)
        => AnalyticsClientSource.IsEcosystemMatch(source).Should().BeFalse();

    /// <summary>
    /// Guards the switch's default arm. A ProposalSource added later must be classified
    /// deliberately rather than defaulting into a channel and skewing the split.
    /// </summary>
    [Fact]
    public void An_unclassified_source_throws_rather_than_defaulting_into_a_channel()
    {
        var undefined = (ProposalSource)999;

        var act = () => AnalyticsClientSource.IsEcosystemMatch(undefined);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    /// <summary>Every declared member must be classified — none may be missed.</summary>
    [Fact]
    public void Every_declared_proposal_source_is_classified()
    {
        var act = () =>
        {
            foreach (var source in Enum.GetValues<ProposalSource>()) AnalyticsClientSource.IsEcosystemMatch(source);
        };

        act.Should().NotThrow();
    }

    [Fact]
    public void A_mix_of_both_channels_splits_by_net_revenue()
    {
        var split = AnalyticsClientSource.Split(new[]
        {
            Release(ProposalSource.StandardProposal, 600m),
            Release(ProposalSource.PublishedPackagePurchase, 400m),
        });

        split.EcosystemMatch.Value.Should().Be(60m);
        split.MarketplaceSearch.Value.Should().Be(40m);
        split.EcosystemNet.Should().Be(600m);
        split.MarketplaceNet.Should().Be(400m);
    }

    /// <summary>
    /// The case that decides count-vs-revenue. By deal count marketplace wins 4:1; by
    /// revenue ecosystem holds 80%. The Earnings tab reports the money.
    /// </summary>
    [Fact]
    public void Many_small_marketplace_sales_do_not_outweigh_larger_matched_revenue()
    {
        var releases = new List<(ProposalSource?, decimal)> { Release(ProposalSource.StandardProposal, 800m) };
        for (var i = 0; i < 4; i++) releases.Add(Release(ProposalSource.PublishedPackagePurchase, 50m));

        var split = AnalyticsClientSource.Split(releases);

        split.EcosystemMatch.Value.Should().Be(80m, "one large matched project outweighs four small purchases");
        split.MarketplaceSearch.Value.Should().Be(20m);
    }

    /// <summary>A split of nothing is not 50/50, and not 0%/0%.</summary>
    [Fact]
    public void No_revenue_reports_not_enough_activity_rather_than_a_fabricated_split()
    {
        var split = AnalyticsClientSource.Split(Array.Empty<(ProposalSource?, decimal)>());

        split.EcosystemMatch.State.Should().Be("notEnoughActivity");
        split.MarketplaceSearch.State.Should().Be("notEnoughActivity");
        split.EcosystemMatch.Value.Should().BeNull();
        split.MarketplaceSearch.Value.Should().BeNull();
        split.EcosystemMatch.Reason.Should().Contain("No revenue was released");
    }

    /// <summary>
    /// Entirely untraceable revenue is a different problem from no revenue at all, and the
    /// reason must say which one happened.
    /// </summary>
    [Fact]
    public void Entirely_untraceable_revenue_says_so_rather_than_reporting_no_activity()
    {
        var split = AnalyticsClientSource.Split(new[] { Untraceable(500m) });

        split.EcosystemMatch.State.Should().Be("notEnoughActivity");
        split.EcosystemMatch.Reason.Should().Contain("could not be traced");
        split.UnattributedNet.Should().Be(500m);
    }

    [Fact]
    public void Untraceable_revenue_is_excluded_from_the_ratio_not_assigned_to_a_channel()
    {
        var split = AnalyticsClientSource.Split(new[]
        {
            Release(ProposalSource.StandardProposal, 300m),
            Untraceable(700m),
        });

        split.EcosystemMatch.Value.Should().Be(100m, "the untraceable 700 is not part of the ratio");
        split.MarketplaceSearch.Value.Should().Be(0m);
        split.UnattributedNet.Should().Be(700m);
    }

    /// <summary>
    /// A third each would round to 33.3 twice and leave 66.6 against a bar drawn to full
    /// width. Taking marketplace as the remainder keeps the pair at exactly 100.
    /// </summary>
    [Fact]
    public void The_two_percentages_always_total_one_hundred_despite_rounding()
    {
        var split = AnalyticsClientSource.Split(new[]
        {
            Release(ProposalSource.StandardProposal, 100m),
            Release(ProposalSource.PublishedPackagePurchase, 200m),
        });

        split.EcosystemMatch.Value.Should().Be(33.3m);
        (split.EcosystemMatch.Value + split.MarketplaceSearch.Value).Should().Be(100m);
    }

    /// <summary>A channel that earned nothing is a real 0%, not an empty state.</summary>
    [Fact]
    public void A_channel_with_no_revenue_is_a_real_zero_when_the_other_earned()
    {
        var split = AnalyticsClientSource.Split(new[] { Release(ProposalSource.CustomOffer, 250m) });

        split.EcosystemMatch.Value.Should().Be(100m);
        split.MarketplaceSearch.State.Should().Be("available");
        split.MarketplaceSearch.Value.Should().Be(0m);
    }
}
