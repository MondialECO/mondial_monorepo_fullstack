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
/// The Clients tab's new sections end to end. The aggregation rules themselves are
/// unit-tested in AnalyticsClientInsightsTests / AnalyticsClientOriginationTests; these
/// cover what those cannot — the engagement -> proposal -> brief joins, the period window,
/// and that client identifiers stay masked on the way out.
///
/// NOTE: requires Docker + a replica set. Skips when unavailable — see SkipReason.
/// </summary>
public class AnalyticsClientInsightsIntegrationTests : IClassFixture<ReplicaSetAppFixture>
{
    private readonly ReplicaSetAppFixture _fx;
    public AnalyticsClientInsightsIntegrationTests(ReplicaSetAppFixture fx) => _fx = fx;

    private IServiceProvider Sp => _fx.Factory!.Services;
    private MongoDbContext Db => Sp.GetRequiredService<MongoDbContext>();

    private async Task<string> SeedProviderAsync()
    {
        var users = Sp.GetRequiredService<UserManager<ApplicationUser>>();
        var user = new ApplicationUser
        {
            UserName = $"i{Guid.NewGuid():N}@test.com",
            Email = $"i{Guid.NewGuid():N}@test.com",
            Name = "Insights Provider",
            Tier_level = 1,
            ServiceProviderProfile = new ServiceProviderProfile { ProviderId = Guid.NewGuid().ToString() },
        };
        user.Onboarding.Phase = 1;
        (await users.CreateAsync(user, "Passw0rd!Passw0rd!")).Succeeded.Should().BeTrue();
        return user.Id.ToString();
    }

    /// <summary>Seeds a completed engagement, optionally behind a brief with industries.</summary>
    private async Task<string> SeedCompletedAsync(
        string providerId, string clientId, ProposalSource source, DateTime endedAt,
        string[]? industries = null, decimal net = 100m)
    {
        string? briefId = null;
        if (industries is not null)
        {
            var brief = new ClientBrief { ClientId = clientId, Title = "Brief", Industries = industries.ToList() };
            await Db.ClientBriefs.InsertOneAsync(brief);
            briefId = brief.Id;
        }

        var proposal = new Proposal
        {
            ProviderId = providerId,
            ClientId = clientId,
            ClientBriefId = briefId,
            Title = "Proposal",
            ProposedPrice = net,
            Currency = "EUR",
            DeliveryTimeValue = 5,
            ProposalSource = source,
            SubmittedAt = endedAt,
            AcceptedAt = endedAt,
            Status = ProposalStatus.Accepted,
            ExpiresAt = DateTime.UtcNow.AddDays(30),
        };
        await Db.Proposals.InsertOneAsync(proposal);

        var engagement = new WorkroomEngagement
        {
            ProposalId = proposal.Id,
            ProviderId = providerId,
            ClientId = clientId,
            EngagementStatus = EngagementStatus.Completed,
            ActualEndDate = endedAt,
            CreatedAt = endedAt,
        };
        await Db.WorkroomEngagements.InsertOneAsync(engagement);

        await Db.FinancialTransactions.InsertOneAsync(new FinancialTransaction
        {
            ProviderId = providerId,
            ClientId = clientId,
            EngagementId = engagement.Id,
            GrossAmount = net,
            NetAmount = net,
            Currency = "EUR",
            TransactionType = FinancialTransactionType.PaymentReleased,
            PaymentStatus = PaymentStatus.Completed,
            IdempotencyKey = Guid.NewGuid().ToString(),
            CreatedAt = endedAt,
            ReleasedAt = endedAt,
        });

        return engagement.Id;
    }

    private async Task SeedReviewAsync(string providerId, string clientId, string engagementId, int rating, DateTime at)
        => await Db.Reviews.InsertOneAsync(new Review
        {
            EngagementId = engagementId,
            ProviderId = providerId,
            ClientId = clientId,
            OverallRating = rating,
            SubmittedAt = at,
            VerificationStatus = ReviewVerificationStatus.Verified,
        });

    private async Task<ClientAnalyticsResponse> ClientsAsync(string providerId, string range = "Last30Days")
    {
        var result = await Sp.GetRequiredService<IAnalyticsService>()
            .GetDashboardAsync(providerId, new AnalyticsQuery { Range = range });
        result.Outcome.Should().Be(ServiceProviderOutcome.Ok);
        return result.Value!.Clients;
    }

    [SkippableFact]
    public async Task Origination_counts_distinct_clients_through_the_proposal_join()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedProviderAsync();
        var at = DateTime.UtcNow.AddDays(-3);
        await SeedCompletedAsync(providerId, "client-a", ProposalSource.StandardProposal, at);
        await SeedCompletedAsync(providerId, "client-b", ProposalSource.CustomOffer, at);
        await SeedCompletedAsync(providerId, "client-c", ProposalSource.PublishedPackagePurchase, at);

        var origination = (await ClientsAsync(providerId)).Origination;

        origination.EcosystemClients.Should().Be(2);
        origination.MarketplaceClients.Should().Be(1);
    }

    /// <summary>
    /// A client with several engagements is one client, attributed to the channel that first
    /// brought them in — not counted once per engagement, and not counted in both channels.
    /// </summary>
    [SkippableFact]
    public async Task A_returning_client_counts_once_under_the_channel_that_originated_them()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedProviderAsync();
        await SeedCompletedAsync(providerId, "client-a", ProposalSource.StandardProposal, DateTime.UtcNow.AddDays(-20));
        await SeedCompletedAsync(providerId, "client-a", ProposalSource.PublishedPackagePurchase, DateTime.UtcNow.AddDays(-2));

        var origination = (await ClientsAsync(providerId)).Origination;

        origination.EcosystemClients.Should().Be(1, "the earliest engagement originated them");
        origination.MarketplaceClients.Should().Be(0);
        (origination.EcosystemMatch.Value + origination.MarketplaceSearch.Value).Should().Be(100m);
    }

    [SkippableFact]
    public async Task The_rating_histogram_reflects_reviews_submitted_in_the_period()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedProviderAsync();
        var at = DateTime.UtcNow.AddDays(-3);
        var first = await SeedCompletedAsync(providerId, "client-a", ProposalSource.StandardProposal, at);
        var second = await SeedCompletedAsync(providerId, "client-b", ProposalSource.StandardProposal, at);
        await SeedReviewAsync(providerId, "client-a", first, 5, at);
        await SeedReviewAsync(providerId, "client-b", second, 3, at);

        var clients = await ClientsAsync(providerId);

        clients.TotalReviews.Should().Be(2);
        clients.RatingDistribution.Should().HaveCount(5);
        clients.RatingDistribution.Single(x => x.Rating == 5).Count.Should().Be(1);
        clients.RatingDistribution.Single(x => x.Rating == 3).Count.Should().Be(1);
        clients.RatingDistribution.Single(x => x.Rating == 4).Count.Should().Be(0);
    }

    [SkippableFact]
    public async Task No_reviews_reports_zero_total_with_the_histogram_shape_intact()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var clients = await ClientsAsync(await SeedProviderAsync());

        clients.TotalReviews.Should().Be(0);
        clients.RatingDistribution.Should().HaveCount(5);
        clients.RatingDistribution.Should().OnlyContain(x => x.Count == 0);
    }

    [SkippableFact]
    public async Task Industries_resolve_through_the_originating_brief()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedProviderAsync();
        var at = DateTime.UtcNow.AddDays(-3);
        await SeedCompletedAsync(providerId, "client-a", ProposalSource.StandardProposal, at, new[] { "Fintech" });
        await SeedCompletedAsync(providerId, "client-b", ProposalSource.StandardProposal, at, new[] { "Fintech", "Healthcare" });

        var industries = (await ClientsAsync(providerId)).TopIndustries;

        industries.Single(x => x.Industry == "Fintech").Projects.Should().Be(2);
        industries.Single(x => x.Industry == "Healthcare").Projects.Should().Be(1, "the multi-industry brief counts in both");
    }

    /// <summary>A package purchase has no brief, so it has no industry source.</summary>
    [SkippableFact]
    public async Task Work_bought_as_a_published_package_falls_back_to_custom_unattributed()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedProviderAsync();
        await SeedCompletedAsync(providerId, "client-a", ProposalSource.PublishedPackagePurchase, DateTime.UtcNow.AddDays(-3));

        var industries = (await ClientsAsync(providerId)).TopIndustries;

        industries.Should().ContainSingle();
        industries[0].Industry.Should().Be("Custom/Unattributed");
    }

    [SkippableFact]
    public async Task Most_active_clients_carry_an_average_rating_per_masked_client()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedProviderAsync();
        var at = DateTime.UtcNow.AddDays(-3);
        var engagementId = await SeedCompletedAsync(providerId, "client-alpha-1234", ProposalSource.StandardProposal, at, net: 500m);
        await SeedReviewAsync(providerId, "client-alpha-1234", engagementId, 5, at);
        await SeedReviewAsync(providerId, "client-alpha-1234", engagementId, 4, at);

        var active = (await ClientsAsync(providerId)).MostActiveClients.Single();

        active.AverageRating.Should().Be(4.5m);
        active.CompletedProjects.Should().Be(1);
        active.NetRevenue.Should().Be(500m);
    }

    /// <summary>An unrated client has not rated you badly.</summary>
    [SkippableFact]
    public async Task An_unrated_active_client_reports_a_null_rating_rather_than_zero()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedProviderAsync();
        await SeedCompletedAsync(providerId, "client-beta-9876", ProposalSource.StandardProposal, DateTime.UtcNow.AddDays(-3));

        var active = (await ClientsAsync(providerId)).MostActiveClients.Single();

        active.AverageRating.Should().BeNull();
    }

    /// <summary>
    /// The privacy guarantee this surface depends on. The raw identifier must never leave
    /// the service, and the mask must be the MaskClient shape rather than the full id.
    /// </summary>
    [SkippableFact]
    public async Task The_raw_client_identifier_never_leaves_the_service()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        const string rawClientId = "client-gamma-should-never-appear";
        var providerId = await SeedProviderAsync();
        await SeedCompletedAsync(providerId, rawClientId, ProposalSource.StandardProposal, DateTime.UtcNow.AddDays(-3));

        var active = (await ClientsAsync(providerId)).MostActiveClients.Single();

        active.ClientId.Should().NotBe(rawClientId);
        active.ClientId.Should().Be("cli...ear", "MaskClient keeps the first and last three characters");
    }
}
