using FluentAssertions;
using WebApp.Services.Implementations;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// Median first-response latency backs the "Responds in X" line on marketplace listings.
/// Both halves are pure functions, so they are tested directly rather than through the
/// Mongo-backed service — the join they sit on top of is shared with the response rate
/// and already exercised by that path.
/// </summary>
public class ResponseRateMedianTests
{
    private static TimeSpan H(double hours) => TimeSpan.FromHours(hours);

    [Fact]
    public void Median_of_an_empty_sample_is_null()
        => ResponseRateService.Median(Array.Empty<TimeSpan>()).Should().BeNull();

    [Fact]
    public void Median_of_one_value_is_that_value()
        => ResponseRateService.Median(new[] { H(5) }).Should().Be(H(5));

    [Fact]
    public void Median_of_an_odd_sample_is_the_middle_value_after_sorting()
        => ResponseRateService.Median(new[] { H(50), H(1), H(9) }).Should().Be(H(9));

    [Fact]
    public void Median_of_an_even_sample_is_the_midpoint_of_the_two_central_values()
        => ResponseRateService.Median(new[] { H(2), H(4), H(6), H(8) }).Should().Be(H(5));

    /// <summary>
    /// The reason this is a median and not a mean: one brief left unanswered for a month
    /// must not move the figure a buyer reads as typical.
    /// </summary>
    [Fact]
    public void A_single_extreme_outlier_does_not_move_the_median()
    {
        var withoutOutlier = ResponseRateService.Median(new[] { H(1), H(2), H(3) });
        var withOutlier = ResponseRateService.Median(new[] { H(1), H(2), H(3), H(2), H(720) });

        withoutOutlier.Should().Be(H(2));
        withOutlier.Should().Be(H(2));
    }

    [Theory]
    [InlineData(0, "under an hour")]
    [InlineData(0.9, "under an hour")]
    [InlineData(1, "a couple of hours")]
    [InlineData(2.9, "a couple of hours")]
    [InlineData(3, "a few hours")]
    [InlineData(11.9, "a few hours")]
    [InlineData(12, "under a day")]
    [InlineData(23.9, "under a day")]
    [InlineData(24, "1-2 days")]
    [InlineData(47.9, "1-2 days")]
    [InlineData(48, "2+ days")]
    [InlineData(1000, "2+ days")]
    public void Latency_buckets_are_closed_at_their_lower_bound(double hours, string expected)
        => ResponseRateService.FormatResponseLatency(H(hours)).Should().Be(expected);

    /// <summary>
    /// Both marketplace call sites render this as "Responds in {value}" / "Typically
    /// responds in {value}". A label phrased as a standalone sentence fragment — the
    /// "Within 2 hours" shape — would render as "Responds in Within 2 hours". Guards the
    /// grammatical contract that the string is a bare duration phrase.
    /// </summary>
    [Theory]
    [InlineData(0.5)]
    [InlineData(2)]
    [InlineData(6)]
    [InlineData(18)]
    [InlineData(36)]
    [InlineData(100)]
    public void Every_bucket_reads_as_a_bare_duration_phrase(double hours)
    {
        var label = ResponseRateService.FormatResponseLatency(H(hours));

        label.Should().NotBeNullOrWhiteSpace();
        label.Should().Be(label.ToLowerInvariant(), "the label continues a sentence, so it is not capitalised");
        label.Should().NotStartWith("within", "'Responds in within 2 hours' does not parse");
        label.Should().NotEndWith(".");
    }

    /// <summary>The 48h response-rate window stays the boundary the slowest bucket opens at.</summary>
    [Fact]
    public void The_slowest_bucket_begins_at_the_response_rate_window()
        => ResponseRateService.FormatResponseLatency(ResponseRateService.ResponseWindow)
            .Should().Be("2+ days");
}
