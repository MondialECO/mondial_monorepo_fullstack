using FluentAssertions;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// Module 5 has no other time series, so the granularity rule is the whole of the new
/// capability. It adapts to the span because a fixed weekly bucket fails the range set at
/// both ends: Last7Days would give one or two points, ThisYear about 52.
/// </summary>
public class AnalyticsTrendBucketTests
{
    private static DateTime Utc(int y, int m, int d) => new(y, m, d, 0, 0, 0, DateTimeKind.Utc);

    [Theory]
    [InlineData(7, AnalyticsTrendBuckets.Daily)]
    [InlineData(14, AnalyticsTrendBuckets.Daily)]
    [InlineData(15, AnalyticsTrendBuckets.Weekly)]
    [InlineData(30, AnalyticsTrendBuckets.Weekly)]
    [InlineData(90, AnalyticsTrendBuckets.Weekly)]
    [InlineData(112, AnalyticsTrendBuckets.Weekly)]
    [InlineData(113, AnalyticsTrendBuckets.Monthly)]
    [InlineData(365, AnalyticsTrendBuckets.Monthly)]
    public void Granularity_adapts_to_the_span(int days, string expected)
        => AnalyticsTrendBuckets.GranularityFor(Utc(2026, 1, 1), Utc(2026, 1, 1).AddDays(days))
            .Should().Be(expected);

    /// <summary>Every range must land in a readable 5-20 point band.</summary>
    [Theory]
    [InlineData(7)]
    [InlineData(30)]
    [InlineData(90)]
    [InlineData(365)]
    public void Every_supported_span_produces_a_readable_number_of_points(int days)
    {
        var from = Utc(2026, 1, 1);
        var to = from.AddDays(days);

        var points = AnalyticsTrendBuckets.Buckets(from, to, AnalyticsTrendBuckets.GranularityFor(from, to));

        points.Should().HaveCountGreaterThanOrEqualTo(4).And.HaveCountLessThanOrEqualTo(20);
    }

    [Fact]
    public void Weekly_buckets_are_monday_anchored_and_contiguous()
    {
        // 2026-01-01 is a Thursday; the first bucket must back up to Monday the 29th.
        var buckets = AnalyticsTrendBuckets.Buckets(Utc(2026, 1, 1), Utc(2026, 1, 29), AnalyticsTrendBuckets.Weekly);

        buckets[0].Start.DayOfWeek.Should().Be(DayOfWeek.Monday);
        buckets[0].Start.Should().Be(Utc(2025, 12, 29));
        for (var i = 1; i < buckets.Count; i++)
            buckets[i].Start.Should().Be(buckets[i - 1].End, "buckets must not gap or overlap");
    }

    [Fact]
    public void Monthly_buckets_start_on_the_first_and_follow_real_month_lengths()
    {
        var buckets = AnalyticsTrendBuckets.Buckets(Utc(2026, 1, 15), Utc(2026, 4, 2), AnalyticsTrendBuckets.Monthly);

        buckets[0].Start.Should().Be(Utc(2026, 1, 1));
        buckets[1].Start.Should().Be(Utc(2026, 2, 1));
        // February is short — a fixed 30-day step would drift.
        buckets[1].End.Should().Be(Utc(2026, 3, 1));
    }

    [Fact]
    public void An_empty_or_inverted_window_produces_no_points()
    {
        AnalyticsTrendBuckets.Buckets(Utc(2026, 1, 1), Utc(2026, 1, 1), AnalyticsTrendBuckets.Daily).Should().BeEmpty();
        AnalyticsTrendBuckets.Buckets(Utc(2026, 2, 1), Utc(2026, 1, 1), AnalyticsTrendBuckets.Weekly).Should().BeEmpty();
    }

    [Fact]
    public void Buckets_cover_the_whole_window()
    {
        var from = Utc(2026, 3, 4);
        var to = Utc(2026, 5, 20);

        var buckets = AnalyticsTrendBuckets.Buckets(from, to, AnalyticsTrendBuckets.Weekly);

        buckets.First().Start.Should().BeOnOrBefore(from);
        buckets.Last().End.Should().BeOnOrAfter(to);
    }
}
