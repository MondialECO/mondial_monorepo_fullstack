using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Interface;
using Xunit;

namespace WebApp.Tests.Integration;

/// <summary>
/// Module 5's service rows reported Impressions, ServiceViews, ClickThroughRate and
/// ConversionRate as permanently notTracked long after Phase A-D started writing
/// AnalyticsDailyBuckets. These cover the wiring end to end; the windowing arithmetic and
/// rounding disclosure are unit-tested in AnalyticsBucketWindowTests.
///
/// NOTE: requires Docker + a replica set. Skips when unavailable — see SkipReason.
/// </summary>
public class AnalyticsServiceTrafficIntegrationTests : IClassFixture<ReplicaSetAppFixture>
{
    private readonly ReplicaSetAppFixture _fx;
    public AnalyticsServiceTrafficIntegrationTests(ReplicaSetAppFixture fx) => _fx = fx;

    private IServiceProvider Sp => _fx.Factory!.Services;
    private MongoDbContext Db => Sp.GetRequiredService<MongoDbContext>();

    private async Task<string> SeedProviderAsync()
    {
        var users = Sp.GetRequiredService<UserManager<ApplicationUser>>();
        var user = new ApplicationUser
        {
            UserName = $"a{Guid.NewGuid():N}@test.com",
            Email = $"a{Guid.NewGuid():N}@test.com",
            Name = "Analytics Provider",
            Tier_level = 1,
            ServiceProviderProfile = new ServiceProviderProfile
            {
                ProviderId = Guid.NewGuid().ToString(),
                VerificationStatus = ServiceProviderVerificationStatus.Verified,
            },
        };
        user.Onboarding.Phase = 1;
        (await users.CreateAsync(user, "Passw0rd!Passw0rd!")).Succeeded.Should().BeTrue();
        return user.Id.ToString();
    }

    private async Task<ServiceListing> SeedListingAsync(string providerId)
    {
        var listing = new ServiceListing
        {
            ProviderId = providerId,
            Title = "Tracked service",
            Description = "<p>x</p>",
            Category = ServiceCategory.Development,
            Status = CatalogStatus.Published,
        };
        await Db.ServiceListings.InsertOneAsync(listing);
        return listing;
    }

    private async Task SeedBucketAsync(string listingId, string providerId, DateTime day, int impressions, int clicks)
        => await Db.AnalyticsDailyBuckets.InsertOneAsync(new AnalyticsDailyBucket
        {
            ListingId = listingId,
            ProviderId = providerId,
            Date = day.Date,
            Impressions = impressions,
            Clicks = clicks,
            UpdatedAt = DateTime.UtcNow,
        });

    private async Task<AnalyticsDashboardResponse> DashboardAsync(string providerId, AnalyticsQuery query)
    {
        var result = await Sp.GetRequiredService<IAnalyticsService>().GetDashboardAsync(providerId, query);
        result.Outcome.Should().Be(ServiceProviderOutcome.Ok);
        return result.Value!;
    }

    [SkippableFact]
    public async Task A_listing_with_bucket_data_reports_real_traffic_instead_of_notTracked()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedProviderAsync();
        var listing = await SeedListingAsync(providerId);
        var today = DateTime.UtcNow.Date;
        await SeedBucketAsync(listing.Id, providerId, today.AddDays(-2), 100, 10);
        await SeedBucketAsync(listing.Id, providerId, today.AddDays(-1), 300, 20);

        var dashboard = await DashboardAsync(providerId, new AnalyticsQuery { Range = "Last30Days" });
        var row = dashboard.Services.Single(x => x.ServiceId == listing.Id);

        row.Impressions.State.Should().Be("available");
        row.Impressions.Value.Should().Be(400);

        // ServiceViews aliases CLICKS, not impressions — the column is labelled "Traffic"
        // and the bucket has no separate views counter.
        row.ServiceViews.State.Should().Be("available");
        row.ServiceViews.Value.Should().Be(30);

        // 30 clicks / 400 impressions.
        row.ClickThroughRate.State.Should().Be("available");
        row.ClickThroughRate.Value.Should().Be(7.5m);
    }

    /// <summary>
    /// Orders / impressions here, deliberately NOT the Phase A-D dashboard's
    /// inquiries / impressions. With no orders the rate is a real zero, not notTracked.
    /// </summary>
    [SkippableFact]
    public async Task Conversion_rate_is_orders_over_impressions()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedProviderAsync();
        var listing = await SeedListingAsync(providerId);
        await SeedBucketAsync(listing.Id, providerId, DateTime.UtcNow.Date.AddDays(-1), 200, 40);

        var row = (await DashboardAsync(providerId, new AnalyticsQuery { Range = "Last30Days" }))
            .Services.Single(x => x.ServiceId == listing.Id);

        row.ConversionRate.State.Should().Be("available");
        row.ConversionRate.Value.Should().Be(0m, "no orders were placed against 200 impressions");
    }

    /// <summary>
    /// A listing with no bucket rows at all is a real zero — it was surfaced, nobody
    /// looked. That is different from Custom/Unattributed, which cannot be measured.
    /// </summary>
    [SkippableFact]
    public async Task A_listing_with_no_buckets_reports_zero_not_notTracked()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedProviderAsync();
        var listing = await SeedListingAsync(providerId);

        var row = (await DashboardAsync(providerId, new AnalyticsQuery { Range = "Last30Days" }))
            .Services.Single(x => x.ServiceId == listing.Id);

        row.Impressions.State.Should().Be("available");
        row.Impressions.Value.Should().Be(0);
        // No impressions means the rates have no denominator — that is not a zero rate.
        row.ClickThroughRate.State.Should().Be("notEnoughActivity");
        row.ConversionRate.State.Should().Be("notEnoughActivity");
    }

    /// <summary>
    /// Enquiries and EnquiryConversion are untouched by this change: no enquiry entity
    /// exists upstream, which is a different and still-true reason.
    /// </summary>
    [SkippableFact]
    public async Task Enquiry_metrics_remain_notTracked()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedProviderAsync();
        var listing = await SeedListingAsync(providerId);
        await SeedBucketAsync(listing.Id, providerId, DateTime.UtcNow.Date.AddDays(-1), 50, 5);

        var row = (await DashboardAsync(providerId, new AnalyticsQuery { Range = "Last30Days" }))
            .Services.Single(x => x.ServiceId == listing.Id);

        row.Enquiries.State.Should().Be("notTracked");
        row.EnquiryConversion.State.Should().Be("notTracked");
    }

    [SkippableFact]
    public async Task The_overview_tab_reports_provider_wide_impressions_and_clicks()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedProviderAsync();
        var a = await SeedListingAsync(providerId);
        var b = await SeedListingAsync(providerId);
        await SeedBucketAsync(a.Id, providerId, DateTime.UtcNow.Date.AddDays(-1), 100, 10);
        await SeedBucketAsync(b.Id, providerId, DateTime.UtcNow.Date.AddDays(-1), 250, 25);

        var overview = await Sp.GetRequiredService<IAnalyticsService>()
            .GetProviderOverviewAsync(providerId, null);
        overview.Outcome.Should().Be(ServiceProviderOutcome.Ok);

        overview.Value!.ServiceViews.State.Should().Be("available");
        overview.Value.ServiceViews.Impressions.Should().Be(350);
        overview.Value.ServiceViews.Clicks.Should().Be(35);
    }
}
