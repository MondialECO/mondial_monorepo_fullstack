using FluentAssertions;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Implementations;
using Xunit;

/// <summary>
/// AnalyticsDailyBuckets stores one row per listing per UTC day, so any analytics window
/// that starts or ends mid-day has to be rounded before it can be answered. Rounding
/// outward never hides traffic that occurred, and the widening is disclosed rather than
/// applied silently.
/// </summary>
namespace WebApp.Tests.Unit;

public class AnalyticsBucketWindowTests
{
    private static DateTime Utc(int y, int m, int d, int h = 0, int min = 0) =>
        new(y, m, d, h, min, 0, DateTimeKind.Utc);

    [Fact]
    public void A_partial_window_widens_to_cover_both_end_days()
    {
        var (from, to) = AnalyticsBucketWindow.ToWholeDays(Utc(2026, 7, 5, 14, 32), Utc(2026, 8, 4, 9, 15));

        from.Should().Be(Utc(2026, 7, 5), "the start day's earlier traffic must not be dropped");
        to.Should().Be(Utc(2026, 8, 5), "exclusive upper bound, so 8-4's bucket is included");
    }

    /// <summary>
    /// The boundary that matters: To is exclusive, so a To already sitting on midnight is
    /// a whole-day bound already. Advancing it would silently add a day of traffic.
    /// </summary>
    [Fact]
    public void A_window_already_on_day_boundaries_is_left_alone()
    {
        var (from, to) = AnalyticsBucketWindow.ToWholeDays(Utc(2026, 7, 1), Utc(2026, 8, 1));

        from.Should().Be(Utc(2026, 7, 1));
        to.Should().Be(Utc(2026, 8, 1));
    }

    [Fact]
    public void Whole_day_windows_are_recognised()
    {
        AnalyticsBucketWindow.IsWholeDays(Utc(2026, 7, 1), Utc(2026, 8, 1)).Should().BeTrue();
        AnalyticsBucketWindow.IsWholeDays(Utc(2026, 7, 1, 0, 1), Utc(2026, 8, 1)).Should().BeFalse();
        AnalyticsBucketWindow.IsWholeDays(Utc(2026, 7, 1), Utc(2026, 8, 1, 12)).Should().BeFalse();
    }

    [Fact]
    public void Rounding_is_disclosed_only_when_it_actually_happened()
    {
        AnalyticsBucketWindow.RoundingNote(Utc(2026, 7, 1), Utc(2026, 8, 1))
            .Should().BeNull("claiming rounding that did not occur is its own inaccuracy");

        AnalyticsBucketWindow.RoundingNote(Utc(2026, 7, 5, 14, 32), Utc(2026, 8, 4, 9, 15))
            .Should().Contain("2026-07-05").And.Contain("2026-08-04")
            .And.Contain("whole UTC day");
    }

    /// <summary>
    /// The brief for this work assumed only Custom Range needed rounding. It does not
    /// hold: AnalyticsPeriodResolver sets to = now for ThisMonth/Last*Days/ThisYear, and
    /// Last*Days derives from from now as well, so both ends carry a wall-clock time.
    /// PreviousYear is the only range already whole-day. This test pins that, because the
    /// disclosure logic is driven by measured alignment rather than by range name.
    /// </summary>
    [Theory]
    [InlineData("ThisMonth", false)]
    [InlineData("Last7Days", false)]
    [InlineData("Last30Days", false)]
    [InlineData("Last90Days", false)]
    [InlineData("ThisYear", false)]
    [InlineData("PreviousYear", true)]
    public void Only_previous_year_is_already_day_aligned(string range, bool expectedAligned)
    {
        var now = Utc(2026, 8, 4, 14, 32);

        var period = AnalyticsPeriodResolver.Resolve(new AnalyticsQuery { Range = range }, now);

        AnalyticsBucketWindow.IsWholeDays(period.From, period.To).Should().Be(expectedAligned);
        (AnalyticsBucketWindow.RoundingNote(period.From, period.To) is null).Should().Be(expectedAligned);
    }

    [Fact]
    public void A_custom_range_on_midnight_boundaries_needs_no_disclosure()
    {
        var period = AnalyticsPeriodResolver.Resolve(
            new AnalyticsQuery { Range = "Custom", From = Utc(2026, 7, 1), To = Utc(2026, 8, 1) },
            Utc(2026, 8, 4, 14, 32));

        AnalyticsBucketWindow.RoundingNote(period.From, period.To).Should().BeNull();
    }

    [Fact]
    public void A_custom_range_mid_day_is_disclosed()
    {
        var period = AnalyticsPeriodResolver.Resolve(
            new AnalyticsQuery { Range = "Custom", From = Utc(2026, 7, 1, 9), To = Utc(2026, 8, 1, 17) },
            Utc(2026, 8, 4, 14, 32));

        AnalyticsBucketWindow.RoundingNote(period.From, period.To)
            .Should().NotBeNull().And.Subject.Should().Contain("wider than the selected range");
    }

    private static AnalyticsDailyBucket Bucket(int day, int impressions, int clicks) => new()
    {
        ListingId = "listing-1",
        ProviderId = "provider-1",
        Date = Utc(2026, 7, day),
        Impressions = impressions,
        Clicks = clicks,
    };

    /// <summary>
    /// The off-by-one this whole exercise turns on. The window is half-open, so the From
    /// day counts and the To day does not — reusing Phase A-D's inclusive-end convention
    /// here would have silently included one extra day.
    /// </summary>
    [Fact]
    public void Sum_includes_the_from_day_and_excludes_the_to_day()
    {
        var rows = new[] { Bucket(1, 10, 1), Bucket(2, 20, 2), Bucket(3, 40, 4) };

        var total = AnalyticsBucketWindow.Sum(rows, Utc(2026, 7, 1), Utc(2026, 7, 3));

        total.Impressions.Should().Be(30, "days 1 and 2 only");
        total.Clicks.Should().Be(3);
    }

    [Fact]
    public void Sum_of_an_empty_or_non_overlapping_window_is_zero()
    {
        var rows = new[] { Bucket(1, 10, 1) };

        AnalyticsBucketWindow.Sum(rows, Utc(2026, 7, 5), Utc(2026, 7, 9)).Should().Be((0m, 0m));
        AnalyticsBucketWindow.Sum(Array.Empty<AnalyticsDailyBucket>(), Utc(2026, 7, 1), Utc(2026, 7, 9))
            .Should().Be((0m, 0m));
    }

    /// <summary>
    /// A single-day window must still capture that day — the degenerate case where an
    /// inclusive/exclusive mix-up returns nothing at all.
    /// </summary>
    [Fact]
    public void Sum_over_a_single_day_captures_that_day()
    {
        var rows = new[] { Bucket(1, 10, 1), Bucket(2, 20, 2) };

        AnalyticsBucketWindow.Sum(rows, Utc(2026, 7, 2), Utc(2026, 7, 3))
            .Should().Be((20m, 2m));
    }
}
