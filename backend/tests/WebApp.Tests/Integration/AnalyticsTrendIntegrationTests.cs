using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using Xunit;

namespace WebApp.Tests.Integration;

/// <summary>
/// The Overview trend series. Its inputs are the same collections the headline metrics
/// use, so the chart must agree with the numbers printed above it — in particular the
/// refunded-milestone exclusion that revenue.net already applies.
///
/// NOTE: requires Docker + a replica set. Skips when unavailable — see SkipReason.
/// </summary>
public class AnalyticsTrendIntegrationTests : IClassFixture<ReplicaSetAppFixture>
{
    private readonly ReplicaSetAppFixture _fx;
    public AnalyticsTrendIntegrationTests(ReplicaSetAppFixture fx) => _fx = fx;

    private IServiceProvider Sp => _fx.Factory!.Services;
    private MongoDbContext Db => Sp.GetRequiredService<MongoDbContext>();

    private async Task<string> SeedProviderAsync()
    {
        var users = Sp.GetRequiredService<UserManager<ApplicationUser>>();
        var user = new ApplicationUser
        {
            UserName = $"t{Guid.NewGuid():N}@test.com",
            Email = $"t{Guid.NewGuid():N}@test.com",
            Name = "Trend Provider",
            Tier_level = 1,
            ServiceProviderProfile = new ServiceProviderProfile { ProviderId = Guid.NewGuid().ToString() },
        };
        user.Onboarding.Phase = 1;
        (await users.CreateAsync(user, "Passw0rd!Passw0rd!")).Succeeded.Should().BeTrue();
        return user.Id.ToString();
    }

    private async Task SeedReleaseAsync(string providerId, DateTime at, decimal net, string? milestoneId = null)
        => await Db.FinancialTransactions.InsertOneAsync(new FinancialTransaction
        {
            ProviderId = providerId,
            MilestoneId = milestoneId,
            GrossAmount = net,
            NetAmount = net,
            Currency = "EUR",
            TransactionType = FinancialTransactionType.PaymentReleased,
            PaymentStatus = PaymentStatus.Completed,
            IdempotencyKey = Guid.NewGuid().ToString(),
            CreatedAt = at,
            ReleasedAt = at,
        });

    private async Task SeedReviewAsync(string providerId, DateTime at, int rating)
        => await Db.Reviews.InsertOneAsync(new Review
        {
            EngagementId = MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
            ProviderId = providerId,
            ClientId = Guid.NewGuid().ToString(),
            OverallRating = rating,
            SubmittedAt = at,
            VerificationStatus = ReviewVerificationStatus.Verified,
        });

    private async Task<AnalyticsDashboardResponse> DashboardAsync(string providerId, AnalyticsQuery query)
    {
        var result = await Sp.GetRequiredService<IAnalyticsService>().GetDashboardAsync(providerId, query);
        result.Outcome.Should().Be(ServiceProviderOutcome.Ok);
        return result.Value!;
    }

    [SkippableFact]
    public async Task Earnings_land_in_the_bucket_they_were_released_in()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedProviderAsync();
        var now = DateTime.UtcNow;
        await SeedReleaseAsync(providerId, now.AddDays(-40), 500m);
        await SeedReleaseAsync(providerId, now.AddDays(-5), 300m);

        var dashboard = await DashboardAsync(providerId, new AnalyticsQuery { Range = "Last90Days" });

        dashboard.TrendGranularity.Should().Be(AnalyticsTrendBuckets.Weekly);
        dashboard.Trend.Sum(x => x.NetEarnings).Should().Be(800m);
        dashboard.Trend.Where(x => x.NetEarnings > 0).Should().HaveCount(2, "two separate weeks");
    }

    /// <summary>
    /// The exclusion revenue.net already applies. A chart counting refunded money would
    /// contradict the net-earnings figure printed directly above it.
    /// </summary>
    [SkippableFact]
    public async Task Refunded_milestones_are_excluded_exactly_as_revenue_net_excludes_them()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedProviderAsync();
        var refunded = new WorkroomMilestone
        {
            EngagementId = MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
            Title = "Refunded",
            Amount = 400m,
            Currency = "EUR",
            MilestoneStatus = WorkroomMilestoneStatus.Paid,
            RefundedAt = DateTime.UtcNow.AddDays(-3),
        };
        await Db.WorkroomMilestones.InsertOneAsync(refunded);
        await Db.FinancialTransactions.InsertOneAsync(new FinancialTransaction
        {
            ProviderId = providerId,
            MilestoneId = refunded.Id,
            GrossAmount = 400m,
            NetAmount = 400m,
            Currency = "EUR",
            TransactionType = FinancialTransactionType.Refund,
            PaymentStatus = PaymentStatus.Refunded,
            IdempotencyKey = Guid.NewGuid().ToString(),
            CreatedAt = DateTime.UtcNow.AddDays(-3),
        });
        await SeedReleaseAsync(providerId, DateTime.UtcNow.AddDays(-3), 400m, refunded.Id);
        await SeedReleaseAsync(providerId, DateTime.UtcNow.AddDays(-3), 100m);

        var dashboard = await DashboardAsync(providerId, new AnalyticsQuery { Range = "Last30Days" });

        dashboard.Trend.Sum(x => x.NetEarnings).Should().Be(100m, "the refunded release must not count");
        dashboard.Trend.Sum(x => x.NetEarnings).Should().Be(dashboard.Revenue.Net.Value);
    }

    /// <summary>An average of nothing is not zero.</summary>
    [SkippableFact]
    public async Task A_bucket_with_no_reviews_reports_null_rating_not_zero()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedProviderAsync();
        await SeedReviewAsync(providerId, DateTime.UtcNow.AddDays(-3), 4);
        await SeedReviewAsync(providerId, DateTime.UtcNow.AddDays(-3), 5);

        var dashboard = await DashboardAsync(providerId, new AnalyticsQuery { Range = "Last30Days" });

        dashboard.Trend.Should().Contain(x => x.AverageRating == 4.5m);
        dashboard.Trend.Where(x => x.AverageRating is null).Should().NotBeEmpty("weeks without reviews are null");
        dashboard.Trend.Should().NotContain(x => x.AverageRating == 0m);
    }

    /// <summary>Earnings behave the opposite way: a week with no releases really is zero.</summary>
    [SkippableFact]
    public async Task A_bucket_with_no_earnings_reports_a_real_zero()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedProviderAsync();
        await SeedReleaseAsync(providerId, DateTime.UtcNow.AddDays(-2), 250m);

        var dashboard = await DashboardAsync(providerId, new AnalyticsQuery { Range = "Last30Days" });

        dashboard.Trend.Should().Contain(x => x.NetEarnings == 0m);
        dashboard.Trend.Should().OnlyContain(x => x.NetEarnings >= 0m);
    }

    [SkippableFact]
    public async Task A_long_range_falls_back_to_monthly_buckets()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var dashboard = await DashboardAsync(await SeedProviderAsync(), new AnalyticsQuery { Range = "PreviousYear" });

        dashboard.TrendGranularity.Should().Be(AnalyticsTrendBuckets.Monthly);
        dashboard.Trend.Should().HaveCount(12);
    }

    [SkippableFact]
    public async Task A_short_range_uses_daily_buckets_rather_than_one_or_two_weekly_points()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var dashboard = await DashboardAsync(await SeedProviderAsync(), new AnalyticsQuery { Range = "Last7Days" });

        dashboard.TrendGranularity.Should().Be(AnalyticsTrendBuckets.Daily);
        dashboard.Trend.Should().HaveCountGreaterThanOrEqualTo(7);
    }
}
