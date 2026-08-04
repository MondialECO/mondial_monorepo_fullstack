using FluentAssertions;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// The Clients tab's origination split — count-based, deliberately unlike the Earnings tab's
/// revenue-based one. Both go through the same IsEcosystemMatch classifier, and
/// <see cref="Both_splits_agree_about_which_channel_a_source_belongs_to"/> pins that they
/// cannot drift apart.
/// </summary>
public class AnalyticsClientOriginationTests
{
    private static ProposalSource? Eco => ProposalSource.StandardProposal;
    private static ProposalSource? Market => ProposalSource.PublishedPackagePurchase;

    [Fact]
    public void A_mix_of_both_channels_splits_by_client_count()
    {
        var split = AnalyticsClientSource.SplitCounts(new[] { Eco, Eco, Eco, Market });

        split.EcosystemMatch.Value.Should().Be(75m);
        split.MarketplaceSearch.Value.Should().Be(25m);
        split.EcosystemClients.Should().Be(3);
        split.MarketplaceClients.Should().Be(1);
    }

    /// <summary>
    /// The distinction from the Earnings tab. Four clients from marketplace and one from
    /// ecosystem is 80% marketplace here regardless of what any of them spent — this tab
    /// counts relationships, not money.
    /// </summary>
    [Fact]
    public void The_split_counts_heads_not_money()
    {
        var split = AnalyticsClientSource.SplitCounts(new[] { Eco, Market, Market, Market, Market });

        split.MarketplaceSearch.Value.Should().Be(80m);
        split.EcosystemMatch.Value.Should().Be(20m);
    }

    /// <summary>A split of nothing is not 50/50, and not 0%/0%.</summary>
    [Fact]
    public void No_clients_reports_not_enough_activity_rather_than_a_fabricated_split()
    {
        var split = AnalyticsClientSource.SplitCounts(Array.Empty<ProposalSource?>());

        split.EcosystemMatch.State.Should().Be("notEnoughActivity");
        split.MarketplaceSearch.State.Should().Be("notEnoughActivity");
        split.EcosystemMatch.Value.Should().BeNull();
        split.EcosystemMatch.Reason.Should().Contain("No client completed work");
    }

    [Fact]
    public void Clients_that_cannot_be_traced_are_excluded_from_the_ratio_and_reported()
    {
        var split = AnalyticsClientSource.SplitCounts(new[] { Eco, null, null });

        split.EcosystemMatch.Value.Should().Be(100m, "the two untraceable clients are not part of the ratio");
        split.UnattributedClients.Should().Be(2);
    }

    [Fact]
    public void Entirely_untraceable_clients_say_so_rather_than_reporting_no_activity()
    {
        var split = AnalyticsClientSource.SplitCounts(new ProposalSource?[] { null, null });

        split.EcosystemMatch.State.Should().Be("notEnoughActivity");
        split.EcosystemMatch.Reason.Should().Contain("could not be traced");
        split.UnattributedClients.Should().Be(2);
    }

    /// <summary>Rounding must not leave the bars short of a full row.</summary>
    [Fact]
    public void The_two_percentages_always_total_one_hundred_despite_rounding()
    {
        var split = AnalyticsClientSource.SplitCounts(new[] { Eco, Market, Market });

        split.EcosystemMatch.Value.Should().Be(33.3m);
        (split.EcosystemMatch.Value + split.MarketplaceSearch.Value).Should().Be(100m);
    }

    /// <summary>
    /// The reason both splits share one classifier. If either tab's mapping were restated
    /// separately, the same client could be Ecosystem on one tab and Marketplace on the
    /// other.
    /// </summary>
    [Fact]
    public void Both_splits_agree_about_which_channel_a_source_belongs_to()
    {
        foreach (var source in Enum.GetValues<ProposalSource>())
        {
            var byCount = AnalyticsClientSource.SplitCounts(new ProposalSource?[] { source });
            var byRevenue = AnalyticsClientSource.Split(new[] { ((ProposalSource?)source, 100m) });

            (byCount.EcosystemClients == 1).Should().Be(byRevenue.EcosystemNet == 100m,
                $"{source} must land in the same channel on both tabs");
        }
    }
}
