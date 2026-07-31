namespace WebApp.Models.Dtos;

public class AnalyticsQuery
{
    public string Range { get; set; } = "Last30Days";
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
    public string Currency { get; set; } = "EUR";
}

public sealed record AnalyticsPeriodResponse(
    string Range, DateTime From, DateTime To, DateTime ComparisonFrom,
    DateTime ComparisonTo, DateTime ComputedAt);

public class AnalyticsMetricResponse
{
    public string State { get; set; } = "available";
    public decimal? Value { get; set; }
    public decimal? PreviousValue { get; set; }
    public decimal? ChangePercentage { get; set; }
    public string Unit { get; set; } = "count";
    public string? Reason { get; set; }

    public static AnalyticsMetricResponse Available(decimal value, decimal? previous, string unit) => new()
    {
        Value = value,
        PreviousValue = previous,
        ChangePercentage = AnalyticsMath.Change(value, previous),
        Unit = unit,
    };

    public static AnalyticsMetricResponse NotTracked(string reason, string unit = "count") => new()
    {
        State = "notTracked",
        Unit = unit,
        Reason = reason,
    };
}

public class AnalyticsOverviewResponse
{
    public AnalyticsMetricResponse GrossRevenue { get; set; } = new();
    public AnalyticsMetricResponse NetRevenue { get; set; } = new();
    public AnalyticsMetricResponse CompletedWork { get; set; } = new();
    public AnalyticsMetricResponse SubmittedProposals { get; set; } = new();
    public AnalyticsMetricResponse AcceptedProposals { get; set; } = new();
    public AnalyticsMetricResponse Clients { get; set; } = new();
    public AnalyticsMetricResponse AverageDeliveryDays { get; set; } = new();
    public AnalyticsMetricResponse OnTimeRate { get; set; } = new();
}

public class ServiceAnalyticsItemResponse
{
    public string? ServiceId { get; set; }
    public string Title { get; set; } = "";
    public string Category { get; set; } = "";
    public bool CustomUnattributed { get; set; }
    public string Status { get; set; } = "Historical";
    public AnalyticsMetricResponse Impressions { get; set; } = new();
    public AnalyticsMetricResponse ServiceViews { get; set; } = new();
    public AnalyticsMetricResponse ClickThroughRate { get; set; } = new();
    public AnalyticsMetricResponse Enquiries { get; set; } = new();
    public AnalyticsMetricResponse Orders { get; set; } = new();
    public AnalyticsMetricResponse ConversionRate { get; set; } = new();
    public AnalyticsMetricResponse EnquiryConversion { get; set; } = new();
    public AnalyticsMetricResponse AverageSellingPrice { get; set; } = new();
    public AnalyticsMetricResponse AverageDeliveryDays { get; set; } = new();
    public AnalyticsMetricResponse OrderCompletionRate { get; set; } = new();
    public AnalyticsMetricResponse OnTimeDeliveryRate { get; set; } = new();
    public AnalyticsMetricResponse CancellationRate { get; set; } = new();
    public AnalyticsMetricResponse RepeatOrders { get; set; } = new();
    public AnalyticsMetricResponse GrossRevenue { get; set; } = new();
    public AnalyticsMetricResponse NetRevenue { get; set; } = new();
}

public class ProposalAnalyticsResponse
{
    public AnalyticsMetricResponse Drafts { get; set; } = new();
    public AnalyticsMetricResponse Submitted { get; set; } = new();
    public AnalyticsMetricResponse Viewed { get; set; } = new();
    public AnalyticsMetricResponse ChangesRequested { get; set; } = new();
    public AnalyticsMetricResponse Revised { get; set; } = new();
    public AnalyticsMetricResponse ClientReviewing { get; set; } = new();
    public AnalyticsMetricResponse Accepted { get; set; } = new();
    public AnalyticsMetricResponse AcceptanceRate { get; set; } = new();
    public AnalyticsMetricResponse AverageProposalValue { get; set; } = new();
    public AnalyticsMetricResponse Declined { get; set; } = new();
    public AnalyticsMetricResponse Withdrawn { get; set; } = new();
    public AnalyticsMetricResponse Expired { get; set; } = new();
    public AnalyticsMetricResponse ConvertedToProject { get; set; } = new();
    public AnalyticsMetricResponse ProposalViewRate { get; set; } = new();
    public AnalyticsMetricResponse ClientResponseRate { get; set; } = new();
}

public class TrustSignalAnalyticsResponse
{
    public string Key { get; set; } = "";
    public string Label { get; set; } = "";
    public decimal Weight { get; set; }
    public bool HasData { get; set; }
    public decimal? Value { get; set; }
}

public class ProfileAnalyticsResponse
{
    public AnalyticsMetricResponse TrustScore { get; set; } = new();
    public List<TrustSignalAnalyticsResponse> TrustSignals { get; set; } = new();
    public AnalyticsMetricResponse DisputePenalty { get; set; } = new();
    public AnalyticsMetricResponse ProfileCompleteness { get; set; } = new();
    public string VerificationStatus { get; set; } = "Pending";
    public int TierLevel { get; set; } = 1;
    public string TierMeaning { get; set; } = "Tier affects ranking and matching only.";
    public AnalyticsMetricResponse SkillsTestsTaken { get; set; } = new();
    public AnalyticsMetricResponse SkillsTestsPassed { get; set; } = new();
    public AnalyticsMetricResponse LatestSkillsTestScore { get; set; } = new();
    public AnalyticsMetricResponse PortfolioItems { get; set; } = new();
    public AnalyticsMetricResponse PublishedServices { get; set; } = new();
    public AnalyticsMetricResponse ProfileViews { get; set; } = new();
    public AnalyticsMetricResponse SearchAppearances { get; set; } = new();
    public AnalyticsMetricResponse PortfolioViews { get; set; } = new();
    public AnalyticsMetricResponse ProfileSaves { get; set; } = new();
    public AnalyticsMetricResponse ContactRate { get; set; } = new();
    public AnalyticsMetricResponse PortfolioEngagement { get; set; } = new();
}

public class AnalyticsBreakdownResponse
{
    public string Key { get; set; } = "";
    public string Label { get; set; } = "";
    public decimal Gross { get; set; }
    public decimal Commission { get; set; }
    public decimal Net { get; set; }
    public int Count { get; set; }
}

public class RevenueAnalyticsResponse
{
    public AnalyticsMetricResponse Gross { get; set; } = new();
    public AnalyticsMetricResponse Net { get; set; } = new();
    public AnalyticsMetricResponse Commission { get; set; } = new();
    public AnalyticsMetricResponse AvailableBalance { get; set; } = new();
    public AnalyticsMetricResponse PendingBalance { get; set; } = new();
    public AnalyticsMetricResponse ProtectedEscrow { get; set; } = new();
    public AnalyticsMetricResponse Withdrawn { get; set; } = new();
    public AnalyticsMetricResponse AverageProjectValue { get; set; } = new();
    public AnalyticsMetricResponse HighestProjectValue { get; set; } = new();
    public List<AnalyticsBreakdownResponse> ByService { get; set; } = new();
    public List<AnalyticsBreakdownResponse> ByClient { get; set; } = new();
    public List<AnalyticsBreakdownResponse> ByMonth { get; set; } = new();
    public List<AnalyticsBreakdownResponse> ByCategory { get; set; } = new();
}

public class ActiveClientAnalyticsResponse
{
    public string ClientId { get; set; } = "";
    public int CompletedProjects { get; set; }
    public decimal NetRevenue { get; set; }
}

public class ClientAnalyticsResponse
{
    public AnalyticsMetricResponse TotalClients { get; set; } = new();
    public AnalyticsMetricResponse NewClients { get; set; } = new();
    public AnalyticsMetricResponse ReturningClients { get; set; } = new();
    public AnalyticsMetricResponse RepeatClientRate { get; set; } = new();
    public AnalyticsMetricResponse RepeatClients { get; set; } = new();
    public AnalyticsMetricResponse CompletedEngagements { get; set; } = new();
    public AnalyticsMetricResponse OnTimeDeliveryRate { get; set; } = new();
    public AnalyticsMetricResponse RepeatClientRevenue { get; set; } = new();
    public AnalyticsMetricResponse AverageProjectsPerClient { get; set; } = new();
    public AnalyticsMetricResponse AverageClientLifetimeValue { get; set; } = new();
    public AnalyticsMetricResponse AverageClientRating { get; set; } = new();
    public AnalyticsMetricResponse ReviewCount { get; set; } = new();
    public AnalyticsMetricResponse AverageQualityRating { get; set; } = new();
    public AnalyticsMetricResponse AverageCommunicationRating { get; set; } = new();
    public AnalyticsMetricResponse AverageDeliveryRating { get; set; } = new();
    public AnalyticsMetricResponse DisputesOpened { get; set; } = new();
    public AnalyticsMetricResponse DisputesResolved { get; set; } = new();
    public AnalyticsMetricResponse AdverseDisputes { get; set; } = new();
    public List<ActiveClientAnalyticsResponse> MostActiveClients { get; set; } = new();
}

public class GrowthObservationResponse
{
    public string RuleId { get; set; } = "";
    public string Title { get; set; } = "";
    public string Message { get; set; } = "";
    public string Tone { get; set; } = "neutral";
    public List<string> SuggestedActions { get; set; } = new();
}

public class AnalyticsEmptyStatesResponse
{
    public bool NotEnoughActivityYet { get; set; }
    public bool NoPublishedServices { get; set; }
    public bool NoRevenueActivity { get; set; }
}

public class AnalyticsDashboardResponse
{
    public AnalyticsPeriodResponse Period { get; set; } = default!;
    public string Currency { get; set; } = "EUR";
    public List<string> AvailableCurrencies { get; set; } = new();
    public DateTime? HistoryStartedAt { get; set; }
    public bool HasMinimumHistory { get; set; }
    public bool IncludesRecordsWithoutTestProvenance { get; set; } = true;
    public string DataLimitation { get; set; } = "No upstream test-record provenance exists; analytics therefore cannot exclude test records.";
    public AnalyticsOverviewResponse Overview { get; set; } = new();
    public List<ServiceAnalyticsItemResponse> Services { get; set; } = new();
    public ProposalAnalyticsResponse Proposals { get; set; } = new();
    public ProfileAnalyticsResponse Profile { get; set; } = new();
    public RevenueAnalyticsResponse Revenue { get; set; } = new();
    public ClientAnalyticsResponse Clients { get; set; } = new();
    public List<GrowthObservationResponse> Observations { get; set; } = new();
    public List<string> UnavailableObservationRuleIds { get; set; } = new();
    public AnalyticsEmptyStatesResponse EmptyStates { get; set; } = new();
}

public class CreateGrowthTaskRequest
{
    public string TaskType { get; set; } = "General";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string? RelatedEntityType { get; set; }
    public string? RelatedEntityId { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public class UpdateGrowthTaskStatusRequest { public string Status { get; set; } = ""; }

public class GrowthTaskResponse
{
    public string Id { get; set; } = "";
    public string TaskType { get; set; } = "";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string Status { get; set; } = "";
    public string? TriggerRuleId { get; set; }
    public string? RelatedEntityType { get; set; }
    public string? RelatedEntityId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public static class AnalyticsMath
{
    public static decimal? Change(decimal current, decimal? previous)
    {
        if (previous is null) return null;
        if (previous == 0) return current == 0 ? 0 : null;
        return Math.Round((current - previous.Value) / Math.Abs(previous.Value) * 100m, 2);
    }

    public static decimal Rate(int numerator, int denominator) =>
        denominator == 0 ? 0 : Math.Round(100m * numerator / denominator, 2);
}

// Dashboard overview is a read-time projection over Modules 1-5. It owns no
// collection and never persists copied counters or financial values.
public class ProviderDashboardResponse
{
    public DateTime ComputedAt { get; set; }
    public string Currency { get; set; } = "EUR";
    public ProviderDashboardIdentityResponse Provider { get; set; } = new();
    public ProviderDashboardMetricsResponse Metrics { get; set; } = new();
    public ProviderDashboardTrustResponse Trust { get; set; } = new();
    public List<ProviderDashboardAttentionResponse> Attention { get; set; } = new();
    public ProviderDashboardLast30DaysResponse Last30Days { get; set; } = new();
    public ProviderDashboardServiceViewsResponse ServiceViews { get; set; } = new();
    public List<ProviderDashboardActivityResponse> RecentActivity { get; set; } = new();
    public ProviderDashboardProgressResponse ProfileStrength { get; set; } = new();
    public ProviderDashboardProgressResponse TierProgress { get; set; } = new()
    {
        State = "notTracked",
        Detail = "Tier progression rules are not implemented.",
    };
}

public class ProviderDashboardIdentityResponse
{
    public string Name { get; set; } = "Service Provider";
    public string Initials { get; set; } = "SP";
    public string? ImagePath { get; set; }
    public string VerificationStatus { get; set; } = "Pending";
    public int TierLevel { get; set; }
    public string TierLabel { get; set; } = "Tier 1";
    public bool AvailableNow { get; set; }
}

public class ProviderDashboardMetricsResponse
{
    public decimal AvailableBalance { get; set; }
    public decimal PendingEscrow { get; set; }
    public int ActiveEngagements { get; set; }
    public int DeliverablesDueThisWeek { get; set; }
    public int DeliverablesDueToday { get; set; }
    public int NewLeads { get; set; }
    public DateTime? NearestLeadExpiryAt { get; set; }
}

public class ProviderDashboardTrustResponse
{
    public bool HasEnoughData { get; set; }
    public double? Score { get; set; }
    public string Status { get; set; } = "Building your trust score";
}

public class ProviderDashboardAttentionResponse
{
    public string Type { get; set; } = "general";
    public string Title { get; set; } = "";
    public string Detail { get; set; } = "";
    public string Action { get; set; } = "Open";
    public string Href { get; set; } = "/dashboard/serviceprovider";
    public string Tone { get; set; } = "slate";
    public DateTime? DueAt { get; set; }
    public double? MatchPercentage { get; set; }
}

public class ProviderDashboardLast30DaysResponse
{
    public int BriefsReviewed { get; set; }
    public int ProposalsSent { get; set; }
    public int DeliverablesSubmitted { get; set; }
    public string AverageResponseState { get; set; } = "notEnoughActivity";
    public double? AverageResponseMinutes { get; set; }
    public string? AverageResponseReason { get; set; }
}

public class ProviderDashboardServiceViewsResponse
{
    public string State { get; set; } = "notTracked";
    public long? Impressions { get; set; }
    public long? Clicks { get; set; }
    public string Reason { get; set; } = "Date-stamped service-view events are not tracked yet.";
}

public class ProviderDashboardActivityResponse
{
    public string Type { get; set; } = "general";
    public string Text { get; set; } = "";
    public DateTime OccurredAt { get; set; }
    public string Href { get; set; } = "/dashboard/serviceprovider";
    public string Tone { get; set; } = "blue";
}

public class ProviderDashboardProgressResponse
{
    public string State { get; set; } = "available";
    public int? Value { get; set; }
    public string Detail { get; set; } = "";
}

public class AnalyticsSummaryResponse
{
    public int Impressions { get; set; }
    public decimal? ImpressionsDelta { get; set; }
    public int Clicks { get; set; }
    public decimal? ClicksDelta { get; set; }
    public int Inquiries { get; set; }
    public decimal? InquiriesDelta { get; set; }
    public decimal? ConversionRate { get; set; }
    public decimal? ConversionRateDelta { get; set; }
}

public class AnalyticsTimeseriesResponse
{
    public List<AnalyticsBucketPoint> Buckets { get; set; } = new();
}

public class AnalyticsBucketPoint
{
    public DateTime Date { get; set; }
    public int Impressions { get; set; }
    public int Clicks { get; set; }
}

public class AnalyticsListingsResponse
{
    public List<AnalyticsListingOption> Listings { get; set; } = new();
}

public class AnalyticsListingOption
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public int Impressions30d { get; set; }
}
