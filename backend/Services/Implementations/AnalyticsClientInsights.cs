using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;

namespace WebApp.Services.Implementations;

/// <summary>
/// The Clients tab's per-client aggregations: rating histogram, industry attribution, and
/// per-client average rating.
///
/// Split out of AnalyticsService for the reason AnalyticsBucketWindow and
/// AnalyticsClientSource were: these are the parts that can silently be wrong — a histogram
/// that drops empty buckets, an industry join that swallows multi-industry briefs, an
/// average that reports 0 for "unrated" — and none of them need a database. The integration
/// tests cover the wiring; these rules are unit-tested directly so they stay verified on
/// machines without Docker.
/// </summary>
public static class AnalyticsClientInsights
{
    /// <summary>
    /// Always five buckets, including empty ones. A histogram missing its 2-star bar reads
    /// as "no 2-star bar exists" rather than "nobody gave 2 stars". Ratings outside 1-5 are
    /// ignored rather than clamped into an adjacent bucket, which would invent a rating
    /// nobody gave.
    /// </summary>
    public static List<RatingBucketResponse> BuildRatingDistribution(IReadOnlyList<Review> currentReviews)
        => Enumerable.Range(1, 5)
            .Select(rating => new RatingBucketResponse
            {
                Rating = rating,
                Count = currentReviews.Count(x => x.OverallRating == rating),
            }).ToList();

    /// <summary>
    /// Null, never 0, when this client left no verified review inside the period — an
    /// unrated client has not rated you badly.
    /// </summary>
    public static decimal? AverageRatingFor(string clientId, IReadOnlyList<Review> currentReviews)
    {
        var rated = currentReviews.Where(x => x.ClientId == clientId).ToList();
        return rated.Count == 0 ? null : Math.Round(rated.Average(x => (decimal)x.OverallRating), 2);
    }

    /// <summary>
    /// Which industries the period's completed work was for, resolved engagement -> proposal
    /// -> originating ClientBrief.
    ///
    /// A brief listing several industries counts once in EACH of them, so these counts do
    /// NOT sum to the project total. The alternative — attributing to the first-listed
    /// industry — partitions cleanly but invents a precision the data does not carry:
    /// Industries is an unordered multi-select on the brief form, so "first" is an artefact
    /// of the order boxes were ticked, and a Fintech + Healthcare brief is genuinely both.
    /// The frontend therefore scales these bars against the LARGEST row rather than a total,
    /// so no share-of-whole is ever claimed.
    ///
    /// Work with no brief behind it — a published package bought directly, or a proposal
    /// whose brief is gone — has no industry SOURCE, which differs from having no industry.
    /// It groups under Custom/Unattributed, the label ServicesView already uses for the
    /// analogous gap.
    /// </summary>
    public static List<IndustryAnalyticsResponse> BuildTopIndustries(
        IReadOnlyList<WorkroomEngagement> currentCompleted,
        IReadOnlyDictionary<string, Proposal> proposals,
        IReadOnlyDictionary<string, ClientBrief> briefs,
        string unattributedLabel)
    {
        var counts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        void Add(string industry) => counts[industry] = counts.GetValueOrDefault(industry) + 1;

        foreach (var engagement in currentCompleted)
        {
            var industries =
                proposals.TryGetValue(engagement.ProposalId, out var proposal) &&
                proposal.ClientBriefId is { } briefId &&
                briefs.TryGetValue(briefId, out var brief)
                    ? brief.Industries
                        .Select(x => x?.Trim())
                        .Where(x => !string.IsNullOrWhiteSpace(x))
                        .Select(x => x!)
                        // Distinct so a brief listing the same industry twice does not count
                        // that project twice for it.
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .ToList()
                    : new List<string>();

            if (industries.Count == 0) Add(unattributedLabel);
            else foreach (var industry in industries) Add(industry);
        }

        return counts
            .OrderByDescending(x => x.Value)
            // Alphabetical tiebreak so equal counts are stable rather than dictionary order.
            .ThenBy(x => x.Key, StringComparer.OrdinalIgnoreCase)
            .Take(5)
            .Select(x => new IndustryAnalyticsResponse { Industry = x.Key, Projects = x.Value })
            .ToList();
    }
}
