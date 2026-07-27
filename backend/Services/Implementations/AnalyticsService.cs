using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations;

public class AnalyticsService(
    MongoDbContext db,
    IClientRelationshipCalculator relationships,
    IWorkroomService workroom) : IAnalyticsService
{
    public const string CustomServiceLabel = "Custom/Unattributed";
    private const string ServiceTrackingReason = "Date-stamped service view events are not tracked yet; lifetime counters cannot be filtered by this period.";
    private const string ProfileTrackingReason = "Profile, search, portfolio, and save events are not tracked by an upstream client browsing surface.";
    private const string ProposalTrackingReason = "Proposal view and client-response timestamps/history are not tracked reliably enough for a period rate.";
    private const string EnquiryTrackingReason = "No enquiry source-of-truth or writer exists yet.";
    private const string CancellationTrackingReason = "Engagement cancellation history is not tracked consistently enough for a period rate.";

    public async Task<ServiceProviderResult<AnalyticsDashboardResponse>> GetDashboardAsync(string providerId, AnalyticsQuery query)
    {
        AnalyticsPeriod period;
        try { period = AnalyticsPeriodResolver.Resolve(query, DateTime.UtcNow); }
        catch (ArgumentException ex) { return ServiceProviderResult<AnalyticsDashboardResponse>.Conflict(ex.Message); }

        var currency = NormalizeCurrency(query.Currency);
        if (currency is null)
            return ServiceProviderResult<AnalyticsDashboardResponse>.Conflict("Currency must be a three-letter code.");

        var proposals = await db.Proposals.Find(x => x.ProviderId == providerId).ToListAsync();
        var engagements = await db.WorkroomEngagements.Find(x => x.ProviderId == providerId).ToListAsync();
        var engagementIds = engagements.Select(x => x.Id).ToHashSet(StringComparer.Ordinal);
        var milestones = engagementIds.Count == 0
            ? new List<WorkroomMilestone>()
            : await db.WorkroomMilestones.Find(x => engagementIds.Contains(x.EngagementId)).ToListAsync();
        var transactions = await db.FinancialTransactions
            .Find(x => x.ProviderId == providerId && x.Currency == currency).ToListAsync();
        var reviews = await db.Reviews.Find(x => x.ProviderId == providerId).ToListAsync();
        var listings = await db.ServiceListings.Find(x => x.ProviderId == providerId).ToListAsync();
        var briefIds = proposals.Where(x => !string.IsNullOrWhiteSpace(x.ClientBriefId)).Select(x => x.ClientBriefId!).Distinct().ToList();
        var briefs = briefIds.Count == 0
            ? new List<ClientBrief>()
            : await db.ClientBriefs.Find(x => briefIds.Contains(x.Id)).ToListAsync();

        var proposalById = proposals.ToDictionary(x => x.Id, StringComparer.Ordinal);
        var engagementById = engagements.ToDictionary(x => x.Id, StringComparer.Ordinal);
        var listingById = listings.ToDictionary(x => x.Id, StringComparer.Ordinal);
        var briefById = briefs.ToDictionary(x => x.Id, StringComparer.Ordinal);
        var refundedMilestones = transactions
            .Where(x => x.TransactionType == FinancialTransactionType.Refund &&
                        x.PaymentStatus is PaymentStatus.Completed or PaymentStatus.Refunded &&
                        x.MilestoneId != null)
            .Select(x => x.MilestoneId!).ToHashSet(StringComparer.Ordinal);
        var earned = transactions.Where(x =>
            x.TransactionType == FinancialTransactionType.PaymentReleased &&
            x.PaymentStatus == PaymentStatus.Completed &&
            (x.MilestoneId == null || !refundedMilestones.Contains(x.MilestoneId))).ToList();

        bool Current(DateTime value) => value >= period.From && value < period.To;
        bool Previous(DateTime value) => value >= period.ComparisonFrom && value < period.ComparisonTo;
        static DateTime RevenueAt(FinancialTransaction value) => value.ReleasedAt ?? value.CreatedAt;

        var currentProposals = proposals.Where(x => x.SubmittedAt is { } at && Current(at)).ToList();
        var previousProposals = proposals.Where(x => x.SubmittedAt is { } at && Previous(at)).ToList();
        var currentCompleted = engagements.Where(x => IsCompleted(x) && x.ActualEndDate is { } at && Current(at)).ToList();
        var previousCompleted = engagements.Where(x => IsCompleted(x) && x.ActualEndDate is { } at && Previous(at)).ToList();
        var currentRevenue = earned.Where(x => Current(RevenueAt(x))).ToList();
        var previousRevenue = earned.Where(x => Previous(RevenueAt(x))).ToList();

        var currentMilestones = MilestonesFor(currentCompleted, milestones);
        var previousMilestones = MilestonesFor(previousCompleted, milestones);
        var currentOnTime = relationships.CalculateOnTimeRate(currentMilestones);
        var previousOnTime = relationships.CalculateOnTimeRate(previousMilestones);
        var currentDelivery = AverageDeliveryDays(currentCompleted);
        var previousDelivery = AverageDeliveryDays(previousCompleted);

        var currentSubmitted = currentProposals.Count;
        var previousSubmitted = previousProposals.Count;
        var currentAccepted = currentProposals.Count(x => x.AcceptedAt != null);
        var previousAccepted = previousProposals.Count(x => x.AcceptedAt != null);
        var currentClients = currentCompleted.Select(x => x.ClientId).Distinct().Count();
        var previousClients = previousCompleted.Select(x => x.ClientId).Distinct().Count();
        var currentGross = currentRevenue.Sum(x => x.GrossAmount);
        var previousGross = previousRevenue.Sum(x => x.GrossAmount);
        var currentNet = currentRevenue.Sum(x => x.NetAmount);
        var previousNet = previousRevenue.Sum(x => x.NetAmount);

        var financial = await workroom.GetFinancialSummaryAsync(providerId, currency);
        var financialValue = financial.Value;

        var response = new AnalyticsDashboardResponse
        {
            Period = new AnalyticsPeriodResponse(period.Range, period.From, period.To, period.ComparisonFrom, period.ComparisonTo, period.ComputedAt),
            Currency = currency,
            Overview = new AnalyticsOverviewResponse
            {
                GrossRevenue = Metric(currentGross, previousGross, currency),
                NetRevenue = Metric(currentNet, previousNet, currency),
                CompletedWork = Metric(currentCompleted.Count, previousCompleted.Count),
                SubmittedProposals = Metric(currentSubmitted, previousSubmitted),
                AcceptedProposals = Metric(currentAccepted, previousAccepted),
                Clients = Metric(currentClients, previousClients),
                AverageDeliveryDays = NullableMetric(currentDelivery, previousDelivery, "days"),
                OnTimeRate = NullableMetric(ToDecimal(currentOnTime), ToDecimal(previousOnTime), "percent"),
            },
            Proposals = BuildProposalAnalytics(currentProposals, previousProposals, currency),
            Profile = BuildProfileAnalytics(),
            Revenue = BuildRevenueAnalytics(
                currentRevenue, previousRevenue, financialValue, engagementById,
                proposalById, listingById, briefById, currency),
            Clients = BuildClientAnalytics(
                engagements, currentCompleted, previousCompleted, currentRevenue,
                previousRevenue, earned, reviews, period, relationships, currency),
        };

        response.Services = BuildServiceAnalytics(
            listings, proposals, engagements, milestones, earned, proposalById,
            listingById, briefById, period, relationships, currency);

        var repeatRate = response.Clients.RepeatClientRate.State == "available"
            ? response.Clients.RepeatClientRate.Value
            : null;
        var growth = GrowthObservationRules.Evaluate(null, null, null, null, null, repeatRate);
        response.Observations = growth.Observations;
        response.UnavailableObservationRuleIds = growth.UnavailableRules;
        response.EmptyStates = new AnalyticsEmptyStatesResponse
        {
            NotEnoughActivityYet = currentSubmitted == 0 && currentCompleted.Count == 0 && currentRevenue.Count == 0,
            NoPublishedServices = listings.All(x => x.Status != CatalogStatus.Published),
            NoRevenueActivity = currentRevenue.Count == 0,
        };

        return ServiceProviderResult<AnalyticsDashboardResponse>.Ok(response);
    }

    public async Task<ServiceProviderResult<List<GrowthTaskResponse>>> GetGrowthTasksAsync(string providerId)
    {
        await ExpireTasksAsync(providerId);
        var tasks = await db.GrowthTasks.Find(x => x.ProviderId == providerId)
            .SortByDescending(x => x.UpdatedAt).ToListAsync();
        return ServiceProviderResult<List<GrowthTaskResponse>>.Ok(tasks.Select(MapTask).ToList());
    }

    public async Task<ServiceProviderResult<GrowthTaskResponse>> CreateGrowthTaskAsync(string providerId, CreateGrowthTaskRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Description))
            return ServiceProviderResult<GrowthTaskResponse>.Conflict("Title and description are required.");
        if (request.ExpiresAt is { } expiry && expiry <= DateTime.UtcNow)
            return ServiceProviderResult<GrowthTaskResponse>.Conflict("ExpiresAt must be in the future.");

        var now = DateTime.UtcNow;
        var task = new GrowthTask
        {
            Id = ObjectId.GenerateNewId().ToString(),
            ProviderId = providerId,
            TaskType = string.IsNullOrWhiteSpace(request.TaskType) ? "General" : request.TaskType.Trim(),
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            RelatedEntityType = Clean(request.RelatedEntityType),
            RelatedEntityId = Clean(request.RelatedEntityId),
            // TriggerRuleId deliberately remains null: observations are read-time
            // banners and only the provider creates these tasks.
            CreatedAt = now,
            UpdatedAt = now,
            ExpiresAt = request.ExpiresAt?.ToUniversalTime(),
        };
        await db.GrowthTasks.InsertOneAsync(task);
        return ServiceProviderResult<GrowthTaskResponse>.Ok(MapTask(task), "Growth task created.");
    }

    public async Task<ServiceProviderResult<GrowthTaskResponse>> UpdateGrowthTaskStatusAsync(string providerId, string id, UpdateGrowthTaskStatusRequest request)
    {
        await ExpireTasksAsync(providerId);
        var task = await db.GrowthTasks.Find(x => x.Id == id && x.ProviderId == providerId).FirstOrDefaultAsync();
        if (task is null) return ServiceProviderResult<GrowthTaskResponse>.NotFound("Growth task not found.");
        if (!Enum.TryParse<GrowthTaskStatus>(request.Status, true, out var next) || next == GrowthTaskStatus.Expired)
            return ServiceProviderResult<GrowthTaskResponse>.Conflict("Status must be Open, InProgress, Completed, or Dismissed.");
        if (task.Status is GrowthTaskStatus.Completed or GrowthTaskStatus.Dismissed or GrowthTaskStatus.Expired)
            return ServiceProviderResult<GrowthTaskResponse>.Conflict("A completed, dismissed, or expired task cannot be reopened.");

        task.Status = next;
        task.UpdatedAt = DateTime.UtcNow;
        await db.GrowthTasks.ReplaceOneAsync(x => x.Id == task.Id && x.ProviderId == providerId, task);
        return ServiceProviderResult<GrowthTaskResponse>.Ok(MapTask(task), "Growth task status updated.");
    }

    private async Task ExpireTasksAsync(string providerId)
    {
        var now = DateTime.UtcNow;
        await db.GrowthTasks.UpdateManyAsync(
            x => x.ProviderId == providerId && x.ExpiresAt != null && x.ExpiresAt <= now &&
                 (x.Status == GrowthTaskStatus.Open || x.Status == GrowthTaskStatus.InProgress),
            Builders<GrowthTask>.Update.Set(x => x.Status, GrowthTaskStatus.Expired).Set(x => x.UpdatedAt, now));
    }

    private static ProposalAnalyticsResponse BuildProposalAnalytics(List<Proposal> current, List<Proposal> previous, string currency)
    {
        var currentAccepted = current.Count(x => x.AcceptedAt != null);
        var previousAccepted = previous.Count(x => x.AcceptedAt != null);
        var currentValues = current.Where(x => x.Currency.Equals(currency, StringComparison.OrdinalIgnoreCase)).Select(x => x.ProposedPrice).ToList();
        var previousValues = previous.Where(x => x.Currency.Equals(currency, StringComparison.OrdinalIgnoreCase)).Select(x => x.ProposedPrice).ToList();
        return new ProposalAnalyticsResponse
        {
            Submitted = Metric(current.Count, previous.Count),
            Accepted = Metric(currentAccepted, previousAccepted),
            AcceptanceRate = Metric(AnalyticsMath.Rate(currentAccepted, current.Count), AnalyticsMath.Rate(previousAccepted, previous.Count), "percent"),
            AverageProposalValue = Metric(Average(currentValues), Average(previousValues), currency),
            Declined = Metric(current.Count(x => x.Status == ProposalStatus.Declined), previous.Count(x => x.Status == ProposalStatus.Declined)),
            Withdrawn = Metric(current.Count(x => x.Status == ProposalStatus.Withdrawn), previous.Count(x => x.Status == ProposalStatus.Withdrawn)),
            Expired = Metric(current.Count(x => x.Status == ProposalStatus.Expired), previous.Count(x => x.Status == ProposalStatus.Expired)),
            ProposalViewRate = AnalyticsMetricResponse.NotTracked(ProposalTrackingReason, "percent"),
            ClientResponseRate = AnalyticsMetricResponse.NotTracked(ProposalTrackingReason, "percent"),
        };
    }

    private static ProfileAnalyticsResponse BuildProfileAnalytics() => new()
    {
        ProfileViews = AnalyticsMetricResponse.NotTracked(ProfileTrackingReason),
        SearchAppearances = AnalyticsMetricResponse.NotTracked(ProfileTrackingReason),
        PortfolioViews = AnalyticsMetricResponse.NotTracked(ProfileTrackingReason),
        ProfileSaves = AnalyticsMetricResponse.NotTracked(ProfileTrackingReason),
        ContactRate = AnalyticsMetricResponse.NotTracked(ProfileTrackingReason, "percent"),
        PortfolioEngagement = AnalyticsMetricResponse.NotTracked(ProfileTrackingReason, "percent"),
    };

    private static RevenueAnalyticsResponse BuildRevenueAnalytics(
        List<FinancialTransaction> current, List<FinancialTransaction> previous,
        ProviderFinancialSummaryResponse? summary,
        IReadOnlyDictionary<string, WorkroomEngagement> engagements,
        IReadOnlyDictionary<string, Proposal> proposals,
        IReadOnlyDictionary<string, ServiceListing> listings,
        IReadOnlyDictionary<string, ClientBrief> briefs,
        string currency)
    {
        var currentProjects = current.Where(x => x.EngagementId != null).GroupBy(x => x.EngagementId).Select(x => x.Sum(y => y.GrossAmount)).ToList();
        var previousProjects = previous.Where(x => x.EngagementId != null).GroupBy(x => x.EngagementId).Select(x => x.Sum(y => y.GrossAmount)).ToList();
        return new RevenueAnalyticsResponse
        {
            Gross = Metric(current.Sum(x => x.GrossAmount), previous.Sum(x => x.GrossAmount), currency),
            Net = Metric(current.Sum(x => x.NetAmount), previous.Sum(x => x.NetAmount), currency),
            Commission = Metric(current.Sum(x => x.CommissionAmount), previous.Sum(x => x.CommissionAmount), currency),
            AvailableBalance = Metric(summary?.Available ?? 0, null, currency),
            PendingBalance = Metric(summary?.Pending ?? 0, null, currency),
            ProtectedEscrow = Metric(summary?.ProtectedEscrow ?? 0, null, currency),
            AverageProjectValue = Metric(Average(currentProjects), Average(previousProjects), currency),
            HighestProjectValue = Metric(currentProjects.DefaultIfEmpty(0).Max(), previousProjects.DefaultIfEmpty(0).Max(), currency),
            ByService = Breakdown(current, x => ServiceIdentity(x, engagements, proposals, listings, briefs).Key, x => ServiceIdentity(x, engagements, proposals, listings, briefs).Label),
            ByCategory = Breakdown(current,
                x => ServiceIdentity(x, engagements, proposals, listings, briefs).Category,
                x => ServiceIdentity(x, engagements, proposals, listings, briefs).Category),
            ByClient = Breakdown(current, x => x.ClientId, x => MaskClient(x.ClientId)),
            ByMonth = Breakdown(current,
                x => (x.ReleasedAt ?? x.CreatedAt).ToString("yyyy-MM"),
                x => (x.ReleasedAt ?? x.CreatedAt).ToString("yyyy-MM")),
        };
    }

    private static ClientAnalyticsResponse BuildClientAnalytics(
        List<WorkroomEngagement> engagements,
        List<WorkroomEngagement> currentCompleted,
        List<WorkroomEngagement> previousCompleted,
        List<FinancialTransaction> currentRevenue,
        List<FinancialTransaction> previousRevenue,
        List<FinancialTransaction> allRevenue,
        List<Review> reviews,
        AnalyticsPeriod period,
        IClientRelationshipCalculator relationships,
        string currency)
    {
        var historyTo = engagements.Where(x => IsCompleted(x) && x.ActualEndDate < period.To).ToList();
        var historyBefore = engagements.Where(x => IsCompleted(x) && x.ActualEndDate < period.From).ToList();
        var previousHistoryTo = engagements.Where(x => IsCompleted(x) && x.ActualEndDate < period.ComparisonTo).ToList();
        var previousHistoryBefore = engagements.Where(x => IsCompleted(x) && x.ActualEndDate < period.ComparisonFrom).ToList();
        var relation = relationships.Calculate(historyTo);
        var previousRelation = relationships.Calculate(previousHistoryTo);
        var beforeIds = historyBefore.Select(x => x.ClientId).ToHashSet(StringComparer.Ordinal);
        var previousBeforeIds = previousHistoryBefore.Select(x => x.ClientId).ToHashSet(StringComparer.Ordinal);
        var currentIds = currentCompleted.Select(x => x.ClientId).Distinct().ToList();
        var previousIds = previousCompleted.Select(x => x.ClientId).Distinct().ToList();
        var newClients = currentIds.Count(x => !beforeIds.Contains(x));
        var previousNew = previousIds.Count(x => !previousBeforeIds.Contains(x));
        var returning = currentIds.Count - newClients;
        var previousReturning = previousIds.Count - previousNew;
        var currentRepeatRevenue = currentRevenue.Where(x => relation.RepeatClientIds.Contains(x.ClientId)).Sum(x => x.NetAmount);
        var previousRepeatRevenue = previousRevenue.Where(x => previousRelation.RepeatClientIds.Contains(x.ClientId)).Sum(x => x.NetAmount);
        var lifetimeRevenue = allRevenue.Where(x => (x.ReleasedAt ?? x.CreatedAt) < period.To).Sum(x => x.NetAmount);
        var previousLifetimeRevenue = allRevenue.Where(x => (x.ReleasedAt ?? x.CreatedAt) < period.ComparisonTo).Sum(x => x.NetAmount);
        var currentReviews = reviews.Where(x => x.VerificationStatus == ReviewVerificationStatus.Verified && x.SubmittedAt >= period.From && x.SubmittedAt < period.To).ToList();
        var previousReviews = reviews.Where(x => x.VerificationStatus == ReviewVerificationStatus.Verified && x.SubmittedAt >= period.ComparisonFrom && x.SubmittedAt < period.ComparisonTo).ToList();

        return new ClientAnalyticsResponse
        {
            TotalClients = Metric(currentIds.Count, previousIds.Count),
            NewClients = Metric(newClients, previousNew),
            ReturningClients = Metric(returning, previousReturning),
            RepeatClientRate = NullableMetric(ToDecimal(relation.RepeatClientRate), ToDecimal(previousRelation.RepeatClientRate), "percent"),
            RepeatClientRevenue = Metric(currentRepeatRevenue, previousRepeatRevenue, currency),
            AverageProjectsPerClient = Metric(relation.TotalClientCount == 0 ? 0 : Math.Round((decimal)relation.CompletedProjectCount / relation.TotalClientCount, 2), previousRelation.TotalClientCount == 0 ? 0 : Math.Round((decimal)previousRelation.CompletedProjectCount / previousRelation.TotalClientCount, 2), "projects"),
            AverageClientLifetimeValue = Metric(relation.TotalClientCount == 0 ? 0 : lifetimeRevenue / relation.TotalClientCount, previousRelation.TotalClientCount == 0 ? 0 : previousLifetimeRevenue / previousRelation.TotalClientCount, currency),
            AverageClientRating = Metric(Average(currentReviews.Select(x => (decimal)x.OverallRating)), Average(previousReviews.Select(x => (decimal)x.OverallRating)), "rating"),
            MostActiveClients = currentCompleted.GroupBy(x => x.ClientId)
                .Select(g => new ActiveClientAnalyticsResponse
                {
                    ClientId = MaskClient(g.Key),
                    CompletedProjects = g.Count(),
                    NetRevenue = currentRevenue.Where(x => x.ClientId == g.Key).Sum(x => x.NetAmount),
                }).OrderByDescending(x => x.CompletedProjects).ThenByDescending(x => x.NetRevenue).Take(5).ToList(),
        };
    }

    private static List<ServiceAnalyticsItemResponse> BuildServiceAnalytics(
        List<ServiceListing> listings,
        List<Proposal> proposals,
        List<WorkroomEngagement> engagements,
        List<WorkroomMilestone> milestones,
        List<FinancialTransaction> earned,
        IReadOnlyDictionary<string, Proposal> proposalById,
        IReadOnlyDictionary<string, ServiceListing> listingById,
        IReadOnlyDictionary<string, ClientBrief> briefById,
        AnalyticsPeriod period,
        IClientRelationshipCalculator relationships,
        string currency)
    {
        bool Current(DateTime value) => value >= period.From && value < period.To;
        bool Previous(DateTime value) => value >= period.ComparisonFrom && value < period.ComparisonTo;
        var keys = listings.Select(x => x.Id).ToHashSet(StringComparer.Ordinal);
        foreach (var proposalServiceId in proposals.Select(EffectiveServiceId).Where(x => x != null)) keys.Add(proposalServiceId!);
        if (proposals.Any(x => EffectiveServiceId(x) is null)) keys.Add(CustomServiceLabel);
        var results = new List<ServiceAnalyticsItemResponse>();

        foreach (var key in keys)
        {
            var custom = key == CustomServiceLabel;
            var listing = custom ? null : listingById.GetValueOrDefault(key);
            bool ProposalMatch(Proposal proposal) => custom ? EffectiveServiceId(proposal) is null : EffectiveServiceId(proposal) == key;
            var relatedProposalIds = proposals.Where(ProposalMatch).Select(x => x.Id).ToHashSet(StringComparer.Ordinal);
            var relatedEngagements = engagements.Where(x => relatedProposalIds.Contains(x.ProposalId)).ToList();
            var currentOrderProposalIds = proposals.Where(x => ProposalMatch(x) && x.AcceptedAt is { } at && Current(at)).Select(x => x.Id).ToHashSet(StringComparer.Ordinal);
            var previousOrderProposalIds = proposals.Where(x => ProposalMatch(x) && x.AcceptedAt is { } at && Previous(at)).Select(x => x.Id).ToHashSet(StringComparer.Ordinal);
            var currentOrders = currentOrderProposalIds.Count;
            var previousOrders = previousOrderProposalIds.Count;
            var currentOrderCompletions = relatedEngagements.Count(x => currentOrderProposalIds.Contains(x.ProposalId) && IsCompleted(x));
            var previousOrderCompletions = relatedEngagements.Count(x => previousOrderProposalIds.Contains(x.ProposalId) && IsCompleted(x));
            var currentCompleted = relatedEngagements.Where(x => IsCompleted(x) && x.ActualEndDate is { } at && Current(at)).ToList();
            var previousCompleted = relatedEngagements.Where(x => IsCompleted(x) && x.ActualEndDate is { } at && Previous(at)).ToList();
            var relatedIds = relatedEngagements.Select(x => x.Id).ToHashSet(StringComparer.Ordinal);
            var currentRevenue = earned.Where(x => x.EngagementId != null && relatedIds.Contains(x.EngagementId) && Current(x.ReleasedAt ?? x.CreatedAt)).ToList();
            var previousRevenue = earned.Where(x => x.EngagementId != null && relatedIds.Contains(x.EngagementId) && Previous(x.ReleasedAt ?? x.CreatedAt)).ToList();
            var repeatOrders = CountRepeatOrders(relatedEngagements, period.From, period.To);
            var previousRepeatOrders = CountRepeatOrders(relatedEngagements, period.ComparisonFrom, period.ComparisonTo);
            var currentServiceMilestones = MilestonesFor(currentCompleted, milestones);
            var previousServiceMilestones = MilestonesFor(previousCompleted, milestones);
            var title = custom ? CustomServiceLabel : listing?.Title ?? "Historical service";
            var category = custom
                ? proposals.Where(ProposalMatch).Select(x => ResolveCategory(x, listingById, briefById)).FirstOrDefault(x => x != "Unattributed") ?? "Unattributed"
                : listing?.Category.ToString() ?? "Unattributed";

            results.Add(new ServiceAnalyticsItemResponse
            {
                ServiceId = custom ? null : key,
                Title = title,
                Category = category,
                CustomUnattributed = custom,
                Impressions = AnalyticsMetricResponse.NotTracked(ServiceTrackingReason),
                ServiceViews = AnalyticsMetricResponse.NotTracked(ServiceTrackingReason),
                Enquiries = AnalyticsMetricResponse.NotTracked(EnquiryTrackingReason),
                Orders = Metric(currentOrders, previousOrders),
                ConversionRate = AnalyticsMetricResponse.NotTracked(ServiceTrackingReason, "percent"),
                EnquiryConversion = AnalyticsMetricResponse.NotTracked(EnquiryTrackingReason, "percent"),
                AverageSellingPrice = Metric(AverageProjectRevenue(currentRevenue), AverageProjectRevenue(previousRevenue), currency),
                AverageDeliveryDays = NullableMetric(AverageDeliveryDays(currentCompleted), AverageDeliveryDays(previousCompleted), "days"),
                OrderCompletionRate = Metric(AnalyticsMath.Rate(currentOrderCompletions, currentOrders), AnalyticsMath.Rate(previousOrderCompletions, previousOrders), "percent"),
                OnTimeDeliveryRate = NullableMetric(ToDecimal(relationships.CalculateOnTimeRate(currentServiceMilestones)), ToDecimal(relationships.CalculateOnTimeRate(previousServiceMilestones)), "percent"),
                CancellationRate = AnalyticsMetricResponse.NotTracked(CancellationTrackingReason, "percent"),
                RepeatOrders = Metric(repeatOrders, previousRepeatOrders),
            });
        }

        return results.OrderByDescending(x => x.Orders.Value).ThenBy(x => x.Title).ToList();
    }

    private static List<AnalyticsBreakdownResponse> Breakdown(
        IEnumerable<FinancialTransaction> source,
        Func<FinancialTransaction, string> key,
        Func<FinancialTransaction, string> label) => source.GroupBy(key)
        .Select(g => new AnalyticsBreakdownResponse
        {
            Key = g.Key,
            Label = label(g.First()),
            Gross = g.Sum(x => x.GrossAmount),
            Commission = g.Sum(x => x.CommissionAmount),
            Net = g.Sum(x => x.NetAmount),
            Count = g.Select(x => x.EngagementId).Where(x => x != null).Distinct().Count(),
        }).OrderByDescending(x => x.Net).ToList();

    private static (string Key, string Label, string Category) ServiceIdentity(
        FinancialTransaction transaction,
        IReadOnlyDictionary<string, WorkroomEngagement> engagements,
        IReadOnlyDictionary<string, Proposal> proposals,
        IReadOnlyDictionary<string, ServiceListing> listings,
        IReadOnlyDictionary<string, ClientBrief> briefs)
    {
        if (transaction.EngagementId is null || !engagements.TryGetValue(transaction.EngagementId, out var engagement) ||
            !proposals.TryGetValue(engagement.ProposalId, out var proposal))
            return (CustomServiceLabel, CustomServiceLabel, "Unattributed");
        var serviceId = EffectiveServiceId(proposal);
        if (serviceId is null)
            return (CustomServiceLabel, CustomServiceLabel, ResolveCategory(proposal, listings, briefs));
        var label = listings.GetValueOrDefault(serviceId)?.Title ?? proposal.PurchaseSnapshot?.ServiceTitle ?? "Historical service";
        return (serviceId, label, ResolveCategory(proposal, listings, briefs));
    }

    private static string ResolveCategory(
        Proposal proposal,
        IReadOnlyDictionary<string, ServiceListing> listings,
        IReadOnlyDictionary<string, ClientBrief> briefs)
    {
        var serviceId = EffectiveServiceId(proposal);
        if (serviceId is not null && listings.TryGetValue(serviceId, out var listing)) return listing.Category.ToString();
        if (proposal.PurchaseSnapshot is not null) return proposal.PurchaseSnapshot.ServiceCategory.ToString();
        if (proposal.ClientBriefId is not null && briefs.TryGetValue(proposal.ClientBriefId, out var brief)) return brief.ServiceCategory.ToString();
        return "Unattributed";
    }

    private static List<WorkroomMilestone> MilestonesFor(IEnumerable<WorkroomEngagement> engagements, IEnumerable<WorkroomMilestone> milestones)
    {
        var ids = engagements.Select(x => x.Id).ToHashSet(StringComparer.Ordinal);
        return milestones.Where(x => ids.Contains(x.EngagementId)).ToList();
    }

    private static bool IsCompleted(WorkroomEngagement engagement) =>
        engagement.EngagementStatus is EngagementStatus.Completed or EngagementStatus.Archived;

    private static decimal? AverageDeliveryDays(IEnumerable<WorkroomEngagement> source)
    {
        var values = source.Where(x => x.StartDate != null && x.ActualEndDate != null)
            .Select(x => (decimal)Math.Max(0, (x.ActualEndDate!.Value - x.StartDate!.Value).TotalDays)).ToList();
        return values.Count == 0 ? null : Math.Round(values.Average(), 2);
    }

    private static decimal Average(IEnumerable<decimal> source)
    {
        var values = source.ToList();
        return values.Count == 0 ? 0 : Math.Round(values.Average(), 2);
    }

    private static decimal AverageProjectRevenue(IEnumerable<FinancialTransaction> source)
    {
        var projects = source.Where(x => x.EngagementId != null).GroupBy(x => x.EngagementId)
            .Select(x => x.Sum(y => y.GrossAmount)).ToList();
        return Average(projects);
    }

    private static int CountRepeatOrders(IEnumerable<WorkroomEngagement> source, DateTime from, DateTime to)
    {
        var completed = source.Where(x => IsCompleted(x) && x.ActualEndDate != null).ToList();
        return completed.Count(current => current.ActualEndDate is { } at && at >= from && at < to &&
            completed.Any(previous => previous.ClientId == current.ClientId && previous.ActualEndDate < at));
    }

    private static string? EffectiveServiceId(Proposal proposal) =>
        !string.IsNullOrWhiteSpace(proposal.ServiceId) ? proposal.ServiceId :
        !string.IsNullOrWhiteSpace(proposal.PurchaseSnapshot?.ServiceId) ? proposal.PurchaseSnapshot.ServiceId : null;

    private static AnalyticsMetricResponse Metric(decimal current, decimal? previous, string unit = "count") =>
        AnalyticsMetricResponse.Available(current, previous, unit);

    private static AnalyticsMetricResponse NullableMetric(decimal? current, decimal? previous, string unit) =>
        current is null
            ? new AnalyticsMetricResponse { State = "notEnoughActivity", Unit = unit, Reason = "No qualifying activity exists in this period." }
            : AnalyticsMetricResponse.Available(current.Value, previous, unit);

    private static decimal? ToDecimal(double? value) => value is null ? null : Math.Round((decimal)value.Value, 2);

    private static string? NormalizeCurrency(string? currency)
    {
        var normalized = (currency ?? "EUR").Trim().ToUpperInvariant();
        return normalized.Length == 3 && normalized.All(char.IsLetter) ? normalized : null;
    }

    private static string MaskClient(string clientId) => clientId.Length <= 6 ? clientId : $"{clientId[..3]}...{clientId[^3..]}";
    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static GrowthTaskResponse MapTask(GrowthTask task) => new()
    {
        Id = task.Id,
        TaskType = task.TaskType,
        Title = task.Title,
        Description = task.Description,
        Status = task.Status.ToString(),
        TriggerRuleId = task.TriggerRuleId,
        RelatedEntityType = task.RelatedEntityType,
        RelatedEntityId = task.RelatedEntityId,
        CreatedAt = task.CreatedAt,
        UpdatedAt = task.UpdatedAt,
        ExpiresAt = task.ExpiresAt,
    };
}
