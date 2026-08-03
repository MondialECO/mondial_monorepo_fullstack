using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;

namespace WebApp.Services.Implementations;

public sealed record AnalyticsPeriod(
    string Range, DateTime From, DateTime To, DateTime ComparisonFrom,
    DateTime ComparisonTo, DateTime ComputedAt);

public static class AnalyticsPeriodResolver
{
    public static AnalyticsPeriod Resolve(AnalyticsQuery query, DateTime now)
    {
        now = NormalizeUtc(now);
        var key = string.IsNullOrWhiteSpace(query.Range) ? "Last30Days" : query.Range.Trim();
        DateTime from;
        DateTime to = now;
        DateTime comparisonFrom;
        DateTime comparisonTo;

        switch (key.ToLowerInvariant())
        {
            case "thismonth":
                key = "ThisMonth";
                from = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
                comparisonFrom = from.AddMonths(-1);
                comparisonTo = comparisonFrom + (to - from);
                if (comparisonTo > from) comparisonTo = from;
                break;
            case "last7days":
                key = "Last7Days";
                from = now.AddDays(-7);
                comparisonTo = from;
                comparisonFrom = from.AddDays(-7);
                break;
            case "last30days":
                key = "Last30Days";
                from = now.AddDays(-30);
                comparisonTo = from;
                comparisonFrom = from.AddDays(-30);
                break;
            case "last90days":
                key = "Last90Days";
                from = now.AddDays(-90);
                comparisonTo = from;
                comparisonFrom = from.AddDays(-90);
                break;
            case "thisyear":
                key = "ThisYear";
                from = new DateTime(now.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
                comparisonFrom = from.AddYears(-1);
                comparisonTo = now.AddYears(-1);
                break;
            case "previousyear":
                key = "PreviousYear";
                from = new DateTime(now.Year - 1, 1, 1, 0, 0, 0, DateTimeKind.Utc);
                to = from.AddYears(1);
                comparisonFrom = from.AddYears(-1);
                comparisonTo = from;
                break;
            case "custom":
                if (query.From is null || query.To is null)
                    throw new ArgumentException("Custom range requires From and To.");
                key = "Custom";
                from = NormalizeUtc(query.From.Value);
                to = NormalizeUtc(query.To.Value);
                if (from >= to) throw new ArgumentException("From must be earlier than To.");
                comparisonTo = from;
                comparisonFrom = from - (to - from);
                break;
            default:
                throw new ArgumentException("Range must be ThisMonth, Last7Days, Last30Days, Last90Days, ThisYear, PreviousYear, or Custom.");
        }

        return new AnalyticsPeriod(key, from, to, comparisonFrom, comparisonTo, now);
    }

    private static DateTime NormalizeUtc(DateTime value) => value.Kind switch
    {
        DateTimeKind.Utc => value,
        DateTimeKind.Local => value.ToUniversalTime(),
        _ => DateTime.SpecifyKind(value, DateTimeKind.Utc),
    };
}

/// <summary>
/// Aligns an analytics period to the day-granular AnalyticsDailyBuckets collection.
///
/// Buckets are one row per listing per UTC day, so a window that starts or ends mid-day
/// cannot be answered exactly — the smallest unit available is a whole day. Rounding
/// OUTWARD (down to the start day, up past the end day) is the honest direction: it never
/// hides traffic that occurred, and the widening is disclosed on the metric rather than
/// silently applied.
///
/// Contrary to the assumption that only Custom needs this, almost every range does.
/// AnalyticsPeriodResolver sets <c>to = now</c> for ThisMonth, Last7Days, Last30Days,
/// Last90Days and ThisYear, and Last*Days also derive <c>from</c> from <c>now</c>, so both
/// ends carry a wall-clock time. PreviousYear is the only range already whole-day on both
/// ends. Rounding is therefore applied uniformly and disclosure is driven by whether it
/// actually changed anything, not by which range was requested.
/// </summary>
public static class AnalyticsBucketWindow
{
    /// <summary>
    /// Widens a half-open [from, to) window to whole UTC days, preserving the half-open
    /// convention: the returned To is an exclusive midnight boundary.
    /// </summary>
    public static (DateTime From, DateTime To) ToWholeDays(DateTime from, DateTime to)
    {
        var start = from.Date;
        // Already an exclusive midnight boundary — advancing would swallow an extra day.
        var end = to == to.Date ? to.Date : to.Date.AddDays(1);
        return (DateTime.SpecifyKind(start, DateTimeKind.Utc), DateTimeKind.Utc == end.Kind ? end : DateTime.SpecifyKind(end, DateTimeKind.Utc));
    }

    /// <summary>True when the window already sits on whole-day boundaries.</summary>
    public static bool IsWholeDays(DateTime from, DateTime to) => from == from.Date && to == to.Date;

    /// <summary>
    /// Totals the buckets falling inside a half-open [from, to) window.
    ///
    /// Half-open deliberately, matching every other window predicate in Module 5
    /// (>= From && &lt; To). The Phase A-D summary endpoint uses an INCLUSIVE end instead;
    /// reusing that convention here would have counted the final day twice or not at all
    /// depending on direction, and a second convention inside one module is what let this
    /// gap survive unnoticed in the first place.
    /// </summary>
    public static (decimal Impressions, decimal Clicks) Sum(
        IEnumerable<AnalyticsDailyBucket> rows, DateTime from, DateTime to)
    {
        decimal impressions = 0, clicks = 0;
        foreach (var row in rows)
        {
            if (row.Date < from || row.Date >= to) continue;
            impressions += row.Impressions;
            clicks += row.Clicks;
        }
        return (impressions, clicks);
    }

    /// <summary>
    /// The disclosure shown alongside bucket-sourced metrics, or null when the requested
    /// window already aligned and nothing was widened. Never claim rounding that did not
    /// happen — that is as misleading as hiding rounding that did.
    /// </summary>
    public static string? RoundingNote(DateTime from, DateTime to)
    {
        if (IsWholeDays(from, to)) return null;
        var (start, end) = ToWholeDays(from, to);
        return "Traffic counts are recorded per whole UTC day, so this figure covers "
            + $"{start:yyyy-MM-dd} through {end.AddDays(-1):yyyy-MM-dd} inclusive, "
            + "which is slightly wider than the selected range.";
    }
}

public static class GrowthObservationRules
{
    public const string ServiceConversionRule = "service-visibility-conversion";
    public const string ProfileContactRule = "profile-traffic-contact";
    public const string ProposalVisibilityRule = "proposal-visibility";
    public const string RepeatClientRule = "repeat-client-strength";

    public static (List<GrowthObservationResponse> Observations, List<string> UnavailableRules) Evaluate(
        decimal? serviceViews, decimal? serviceConversionRate, decimal? profileViews,
        decimal? contactRate, decimal? proposalViewRate, decimal? repeatClientRate)
    {
        var observations = new List<GrowthObservationResponse>();
        var unavailable = new List<string>();

        if (serviceViews is null || serviceConversionRate is null) unavailable.Add(ServiceConversionRule);
        else if (serviceViews > 500 && serviceConversionRate < 10)
            observations.Add(new GrowthObservationResponse
            {
                RuleId = ServiceConversionRule,
                Title = "Turn service visibility into orders",
                Message = "Your service visibility is strong, but fewer than 10% of views become orders.",
                SuggestedActions = new() { "Review the service title and first paragraph", "Clarify package outcomes and pricing", "Add recent work samples" },
            });

        if (profileViews is null || contactRate is null) unavailable.Add(ProfileContactRule);
        else if (profileViews > 1000 && contactRate < 5)
            observations.Add(new GrowthObservationResponse
            {
                RuleId = ProfileContactRule,
                Title = "Convert more profile traffic",
                Message = "Your profile receives substantial traffic, but fewer than 5% of views lead to contact.",
                SuggestedActions = new() { "Tighten your positioning statement", "Show clearer proof of outcomes", "Make your next-step invitation specific" },
            });

        if (proposalViewRate is null) unavailable.Add(ProposalVisibilityRule);
        else if (proposalViewRate < 40)
            observations.Add(new GrowthObservationResponse
            {
                RuleId = ProposalVisibilityRule,
                Title = "Improve proposal visibility",
                Message = "Fewer than 40% of submitted proposals are being viewed.",
                SuggestedActions = new() { "Respond earlier", "Keep the opening concise", "Prioritize briefs with a strong fit" },
            });

        if (repeatClientRate is not null && repeatClientRate > 30)
            observations.Add(new GrowthObservationResponse
            {
                RuleId = RepeatClientRule,
                Title = "Repeat client relationships are a strength",
                Message = "More than 30% of your clients have completed multiple projects with you.",
                Tone = "positive",
                SuggestedActions = new() { "Offer a logical next engagement", "Keep successful clients updated on availability", "Ask for referrals after delivery" },
            });

        return (observations, unavailable);
    }
}
