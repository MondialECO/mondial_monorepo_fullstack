using FluentAssertions;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// The Clients tab's aggregations, unit-tested without a database for the reason
/// AnalyticsBucketWindowTests exists: a histogram that drops empty buckets, an industry
/// join that swallows multi-industry briefs, or an average that reports 0 for "unrated" are
/// all silently wrong rather than loudly broken, and none of them need Mongo. The wiring is
/// covered by AnalyticsClientInsightsIntegrationTests, which requires Docker.
/// </summary>
public class AnalyticsClientInsightsTests
{
    private const string Unattributed = "Custom/Unattributed";

    private static Review Review(string clientId, int rating) =>
        new() { ClientId = clientId, OverallRating = rating, EngagementId = "e", ProviderId = "p" };

    private static WorkroomEngagement Engagement(string proposalId, string clientId = "c") =>
        new() { ProposalId = proposalId, ClientId = clientId, ProviderId = "p" };

    private static (Dictionary<string, Proposal>, Dictionary<string, ClientBrief>) Lookups(
        params (string ProposalId, string? BriefId, string[]? Industries)[] rows)
    {
        var proposals = new Dictionary<string, Proposal>();
        var briefs = new Dictionary<string, ClientBrief>();
        foreach (var (proposalId, briefId, industries) in rows)
        {
            proposals[proposalId] = new Proposal { ClientBriefId = briefId, Title = "t", ProviderId = "p", ClientId = "c" };
            if (briefId is not null && industries is not null)
                briefs[briefId] = new ClientBrief { Id = briefId, Industries = industries.ToList() };
        }
        return (proposals, briefs);
    }

    // ---- rating distribution ----

    [Fact]
    public void The_histogram_counts_reviews_at_each_star_value()
    {
        var distribution = AnalyticsClientInsights.BuildRatingDistribution(new[]
        {
            Review("a", 5), Review("b", 5), Review("c", 4), Review("d", 1),
        });

        distribution.Should().HaveCount(5);
        distribution.Single(x => x.Rating == 5).Count.Should().Be(2);
        distribution.Single(x => x.Rating == 4).Count.Should().Be(1);
        distribution.Single(x => x.Rating == 1).Count.Should().Be(1);
    }

    /// <summary>
    /// A missing bar reads as "no such bar exists" rather than "nobody gave that rating".
    /// The shape has to survive the gaps.
    /// </summary>
    [Fact]
    public void Empty_buckets_are_kept_so_the_histogram_holds_its_shape()
    {
        var distribution = AnalyticsClientInsights.BuildRatingDistribution(new[] { Review("a", 5) });

        distribution.Should().HaveCount(5);
        distribution.Select(x => x.Rating).Should().Equal(1, 2, 3, 4, 5);
        distribution.Single(x => x.Rating == 3).Count.Should().Be(0);
    }

    [Fact]
    public void No_reviews_still_returns_five_empty_buckets_rather_than_an_empty_list()
    {
        var distribution = AnalyticsClientInsights.BuildRatingDistribution(Array.Empty<Review>());

        distribution.Should().HaveCount(5);
        distribution.Should().OnlyContain(x => x.Count == 0);
    }

    /// <summary>An out-of-range rating is ignored, not clamped into a rating nobody gave.</summary>
    [Fact]
    public void A_rating_outside_one_to_five_is_ignored_rather_than_clamped()
    {
        var distribution = AnalyticsClientInsights.BuildRatingDistribution(new[] { Review("a", 0), Review("b", 9) });

        distribution.Sum(x => x.Count).Should().Be(0);
    }

    // ---- per-client average rating ----

    [Fact]
    public void A_clients_average_rating_covers_only_that_clients_reviews()
    {
        var reviews = new[] { Review("a", 5), Review("a", 4), Review("b", 1) };

        AnalyticsClientInsights.AverageRatingFor("a", reviews).Should().Be(4.5m);
        AnalyticsClientInsights.AverageRatingFor("b", reviews).Should().Be(1m);
    }

    /// <summary>An unrated client has not rated you badly.</summary>
    [Fact]
    public void A_client_with_no_reviews_reports_null_rather_than_zero()
        => AnalyticsClientInsights.AverageRatingFor("nobody", new[] { Review("a", 5) }).Should().BeNull();

    // ---- top industries ----

    [Fact]
    public void Projects_are_counted_per_industry()
    {
        var (proposals, briefs) = Lookups(
            ("p1", "b1", new[] { "Fintech" }),
            ("p2", "b2", new[] { "Fintech" }),
            ("p3", "b3", new[] { "Healthcare" }));

        var industries = AnalyticsClientInsights.BuildTopIndustries(
            new[] { Engagement("p1"), Engagement("p2"), Engagement("p3") }, proposals, briefs, Unattributed);

        industries[0].Industry.Should().Be("Fintech");
        industries[0].Projects.Should().Be(2);
        industries.Single(x => x.Industry == "Healthcare").Projects.Should().Be(1);
    }

    /// <summary>
    /// The multi-industry decision: a brief listing two industries counts once in EACH
    /// rather than being attributed to whichever was listed first. Consequence, asserted so
    /// it stays deliberate — the counts total more than the project count.
    /// </summary>
    [Fact]
    public void A_multi_industry_brief_counts_once_in_every_industry_it_lists()
    {
        var (proposals, briefs) = Lookups(("p1", "b1", new[] { "Fintech", "Healthcare" }));

        var industries = AnalyticsClientInsights.BuildTopIndustries(
            new[] { Engagement("p1") }, proposals, briefs, Unattributed);

        industries.Should().HaveCount(2);
        industries.Should().OnlyContain(x => x.Projects == 1);
        industries.Sum(x => x.Projects).Should().Be(2, "one project, counted in both of its industries");
    }

    /// <summary>A brief repeating an industry must not count that project twice for it.</summary>
    [Fact]
    public void A_duplicated_industry_on_one_brief_counts_once()
    {
        var (proposals, briefs) = Lookups(("p1", "b1", new[] { "Fintech", "fintech", " Fintech " }));

        var industries = AnalyticsClientInsights.BuildTopIndustries(
            new[] { Engagement("p1") }, proposals, briefs, Unattributed);

        industries.Should().HaveCount(1);
        industries[0].Projects.Should().Be(1);
    }

    /// <summary>
    /// A published package bought directly has no ClientBrief, so it has no industry SOURCE
    /// — which is not the same as having no industry. Same label ServicesView uses.
    /// </summary>
    [Fact]
    public void Work_with_no_brief_behind_it_groups_under_custom_unattributed()
    {
        var (proposals, briefs) = Lookups(("p1", null, null), ("p2", "b2", new[] { "Fintech" }));

        var industries = AnalyticsClientInsights.BuildTopIndustries(
            new[] { Engagement("p1"), Engagement("p2") }, proposals, briefs, Unattributed);

        industries.Single(x => x.Industry == Unattributed).Projects.Should().Be(1);
    }

    /// <summary>A proposal whose brief has been deleted is unattributed, not dropped.</summary>
    [Fact]
    public void A_missing_brief_is_unattributed_rather_than_silently_skipped()
    {
        var (proposals, _) = Lookups(("p1", "gone", null));

        var industries = AnalyticsClientInsights.BuildTopIndustries(
            new[] { Engagement("p1") }, proposals, new Dictionary<string, ClientBrief>(), Unattributed);

        industries.Should().ContainSingle();
        industries[0].Industry.Should().Be(Unattributed);
    }

    [Fact]
    public void A_brief_with_an_empty_industry_list_is_unattributed()
    {
        var (proposals, briefs) = Lookups(("p1", "b1", Array.Empty<string>()));

        var industries = AnalyticsClientInsights.BuildTopIndustries(
            new[] { Engagement("p1") }, proposals, briefs, Unattributed);

        industries[0].Industry.Should().Be(Unattributed);
    }

    [Fact]
    public void The_ranking_is_capped_at_five_industries()
    {
        var rows = Enumerable.Range(1, 8).Select(i => ($"p{i}", (string?)$"b{i}", (string[]?)new[] { $"Industry {i}" })).ToArray();
        var (proposals, briefs) = Lookups(rows);

        var industries = AnalyticsClientInsights.BuildTopIndustries(
            rows.Select(r => Engagement(r.Item1)).ToList(), proposals, briefs, Unattributed);

        industries.Should().HaveCount(5);
    }

    [Fact]
    public void No_completed_work_returns_an_empty_ranking()
        => AnalyticsClientInsights.BuildTopIndustries(
            Array.Empty<WorkroomEngagement>(),
            new Dictionary<string, Proposal>(),
            new Dictionary<string, ClientBrief>(),
            Unattributed).Should().BeEmpty();
}
