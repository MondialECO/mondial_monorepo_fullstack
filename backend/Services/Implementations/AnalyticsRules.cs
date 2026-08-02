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
