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
/// The Profile tab's three-step funnel and top-services ranking.
///
/// NOTE: requires Docker + a replica set. Skips when unavailable — see SkipReason.
/// </summary>
public class AnalyticsProfileFunnelIntegrationTests : IClassFixture<ReplicaSetAppFixture>
{
    private readonly ReplicaSetAppFixture _fx;
    public AnalyticsProfileFunnelIntegrationTests(ReplicaSetAppFixture fx) => _fx = fx;

    private IServiceProvider Sp => _fx.Factory!.Services;
    private MongoDbContext Db => Sp.GetRequiredService<MongoDbContext>();

    private async Task<string> SeedProviderAsync()
    {
        var users = Sp.GetRequiredService<UserManager<ApplicationUser>>();
        var user = new ApplicationUser
        {
            UserName = $"f{Guid.NewGuid():N}@test.com",
            Email = $"f{Guid.NewGuid():N}@test.com",
            Name = "Funnel Provider",
            Tier_level = 1,
            ServiceProviderProfile = new ServiceProviderProfile { ProviderId = Guid.NewGuid().ToString() },
        };
        user.Onboarding.Phase = 1;
        (await users.CreateAsync(user, "Passw0rd!Passw0rd!")).Succeeded.Should().BeTrue();
        return user.Id.ToString();
    }

    private async Task SeedInteractionAsync(string providerId, DateTime availableAt)
        => await Db.ClientBriefInteractions.InsertOneAsync(new ClientBriefInteraction
        {
            ProviderId = providerId,
            ClientBriefId = MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
            CreatedAt = availableAt,
        });

    private async Task SeedProposalAsync(string providerId, DateTime? submittedAt, DateTime? acceptedAt = null)
        => await Db.Proposals.InsertOneAsync(new Proposal
        {
            ProviderId = providerId,
            ClientId = Guid.NewGuid().ToString(),
            Title = "Proposal",
            ProposedPrice = 100m,
            Currency = "EUR",
            DeliveryTimeValue = 5,
            SubmittedAt = submittedAt,
            AcceptedAt = acceptedAt,
            Status = acceptedAt is null ? ProposalStatus.Submitted : ProposalStatus.Accepted,
            ExpiresAt = DateTime.UtcNow.AddDays(30),
        });

    private async Task<ServiceListing> SeedListingAsync(string providerId, string title)
    {
        var listing = new ServiceListing
        {
            ProviderId = providerId,
            Title = title,
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

    private async Task<ProfileAnalyticsResponse> ProfileAsync(string providerId, string range = "Last30Days")
    {
        var result = await Sp.GetRequiredService<IAnalyticsService>()
            .GetDashboardAsync(providerId, new AnalyticsQuery { Range = range });
        result.Outcome.Should().Be(ServiceProviderOutcome.Ok);
        return result.Value!.Profile;
    }

    [SkippableFact]
    public async Task The_funnel_counts_each_step_and_both_conversion_rates()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedProviderAsync();
        var recent = DateTime.UtcNow.AddDays(-3);
        for (var i = 0; i < 10; i++) await SeedInteractionAsync(providerId, recent);
        for (var i = 0; i < 4; i++) await SeedProposalAsync(providerId, recent);
        await SeedProposalAsync(providerId, recent, recent);

        var funnel = (await ProfileAsync(providerId)).Funnel;

        funnel.BriefsShown.Value.Should().Be(10);
        funnel.ProposalsSent.Value.Should().Be(5, "the accepted proposal was also submitted");
        funnel.Hired.Value.Should().Be(1);
        funnel.ProposalRate.Value.Should().Be(50m);
        funnel.HireRate.Value.Should().Be(20m);
    }

    /// <summary>
    /// "No briefs were surfaced" and "0% of briefs converted" are different facts. Only
    /// the first is true when nothing entered the funnel.
    /// </summary>
    [SkippableFact]
    public async Task A_zero_denominator_reports_not_enough_activity_rather_than_zero_percent()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var funnel = (await ProfileAsync(await SeedProviderAsync())).Funnel;

        funnel.BriefsShown.Value.Should().Be(0, "a count of nothing is a real zero");
        funnel.ProposalRate.State.Should().Be("notEnoughActivity");
        funnel.HireRate.State.Should().Be("notEnoughActivity");
        funnel.ProposalRate.Value.Should().BeNull();
    }

    [SkippableFact]
    public async Task The_funnel_counts_only_the_selected_period_not_lifetime()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedProviderAsync();
        await SeedInteractionAsync(providerId, DateTime.UtcNow.AddDays(-2));
        await SeedInteractionAsync(providerId, DateTime.UtcNow.AddDays(-200));
        await SeedProposalAsync(providerId, DateTime.UtcNow.AddDays(-2));
        await SeedProposalAsync(providerId, DateTime.UtcNow.AddDays(-200), DateTime.UtcNow.AddDays(-200));

        var funnel = (await ProfileAsync(providerId)).Funnel;

        funnel.BriefsShown.Value.Should().Be(1, "the 200-day-old brief is outside Last30Days");
        funnel.ProposalsSent.Value.Should().Be(1);
        funnel.Hired.Value.Should().Be(0, "the old acceptance is outside the period");
    }

    [SkippableFact]
    public async Task Top_services_rank_by_clicks_and_carry_impressions_for_context()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedProviderAsync();
        var seen = await SeedListingAsync(providerId, "Seen a lot, rarely clicked");
        var clicked = await SeedListingAsync(providerId, "Seen less, clicked more");
        var day = DateTime.UtcNow.Date.AddDays(-2);
        await SeedBucketAsync(seen.Id, providerId, day, impressions: 1000, clicks: 2);
        await SeedBucketAsync(clicked.Id, providerId, day, impressions: 100, clicks: 20);

        var top = (await ProfileAsync(providerId)).TopServices;

        top.Should().HaveCount(2);
        top[0].Title.Should().Be("Seen less, clicked more", "ranking is by clicks, not exposure");
        top[0].Clicks.Should().Be(20);
        top[0].Impressions.Should().Be(100);
    }

    /// <summary>A list of zeroes is not a performance ranking.</summary>
    [SkippableFact]
    public async Task Listings_with_no_clicks_are_excluded_rather_than_ranked_at_zero()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedProviderAsync();
        var listing = await SeedListingAsync(providerId, "Seen, never clicked");
        await SeedBucketAsync(listing.Id, providerId, DateTime.UtcNow.Date.AddDays(-2), impressions: 500, clicks: 0);

        (await ProfileAsync(providerId)).TopServices.Should().BeEmpty();
    }

    [SkippableFact]
    public async Task A_provider_with_no_listings_gets_an_empty_ranking()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        (await ProfileAsync(await SeedProviderAsync())).TopServices.Should().BeEmpty();
    }

    [SkippableFact]
    public async Task Top_services_are_capped_at_five()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedProviderAsync();
        var day = DateTime.UtcNow.Date.AddDays(-2);
        for (var i = 0; i < 8; i++)
        {
            var listing = await SeedListingAsync(providerId, $"Service {i}");
            await SeedBucketAsync(listing.Id, providerId, day, impressions: 100, clicks: i + 1);
        }

        var top = (await ProfileAsync(providerId)).TopServices;

        top.Should().HaveCount(5);
        top[0].Clicks.Should().Be(8, "highest first");
    }
}
