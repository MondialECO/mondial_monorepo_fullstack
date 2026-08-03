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
/// The Earnings tab's client-source split. Weighted by net revenue rather than deal count
/// — see ClientSourceAnalyticsResponse for why — so these assert money, and the
/// count-vs-revenue distinction is pinned explicitly by
/// Many_small_marketplace_sales_do_not_outweigh_larger_matched_revenue.
///
/// NOTE: requires Docker + a replica set. Skips when unavailable — see SkipReason.
/// </summary>
public class AnalyticsClientSourceIntegrationTests : IClassFixture<ReplicaSetAppFixture>
{
    private readonly ReplicaSetAppFixture _fx;
    public AnalyticsClientSourceIntegrationTests(ReplicaSetAppFixture fx) => _fx = fx;

    private IServiceProvider Sp => _fx.Factory!.Services;
    private MongoDbContext Db => Sp.GetRequiredService<MongoDbContext>();

    private async Task<string> SeedProviderAsync()
    {
        var users = Sp.GetRequiredService<UserManager<ApplicationUser>>();
        var user = new ApplicationUser
        {
            UserName = $"c{Guid.NewGuid():N}@test.com",
            Email = $"c{Guid.NewGuid():N}@test.com",
            Name = "Source Provider",
            Tier_level = 1,
            ServiceProviderProfile = new ServiceProviderProfile { ProviderId = Guid.NewGuid().ToString() },
        };
        user.Onboarding.Phase = 1;
        (await users.CreateAsync(user, "Passw0rd!Passw0rd!")).Succeeded.Should().BeTrue();
        return user.Id.ToString();
    }

    /// <summary>Seeds a released payment traceable to a proposal of the given source.</summary>
    private async Task SeedAttributedReleaseAsync(string providerId, ProposalSource source, decimal net, DateTime at)
    {
        var proposal = new Proposal
        {
            ProviderId = providerId,
            ClientId = Guid.NewGuid().ToString(),
            Title = "Proposal",
            ProposedPrice = net,
            Currency = "EUR",
            DeliveryTimeValue = 5,
            ProposalSource = source,
            SubmittedAt = at,
            AcceptedAt = at,
            Status = ProposalStatus.Accepted,
            ExpiresAt = DateTime.UtcNow.AddDays(30),
        };
        await Db.Proposals.InsertOneAsync(proposal);

        var engagement = new WorkroomEngagement
        {
            ProposalId = proposal.Id,
            ProviderId = providerId,
            ClientId = proposal.ClientId,
        };
        await Db.WorkroomEngagements.InsertOneAsync(engagement);

        await Db.FinancialTransactions.InsertOneAsync(new FinancialTransaction
        {
            ProviderId = providerId,
            ClientId = proposal.ClientId,
            EngagementId = engagement.Id,
            GrossAmount = net,
            NetAmount = net,
            Currency = "EUR",
            TransactionType = FinancialTransactionType.PaymentReleased,
            PaymentStatus = PaymentStatus.Completed,
            IdempotencyKey = Guid.NewGuid().ToString(),
            CreatedAt = at,
            ReleasedAt = at,
        });
    }

    /// <summary>A release with no engagement at all — untraceable to any proposal.</summary>
    private async Task SeedUnattributedReleaseAsync(string providerId, decimal net, DateTime at)
        => await Db.FinancialTransactions.InsertOneAsync(new FinancialTransaction
        {
            ProviderId = providerId,
            ClientId = Guid.NewGuid().ToString(),
            EngagementId = null,
            GrossAmount = net,
            NetAmount = net,
            Currency = "EUR",
            TransactionType = FinancialTransactionType.PaymentReleased,
            PaymentStatus = PaymentStatus.Completed,
            IdempotencyKey = Guid.NewGuid().ToString(),
            CreatedAt = at,
            ReleasedAt = at,
        });

    private async Task<ClientSourceAnalyticsResponse> SourceAsync(string providerId, string range = "Last30Days")
    {
        var result = await Sp.GetRequiredService<IAnalyticsService>()
            .GetDashboardAsync(providerId, new AnalyticsQuery { Range = range });
        result.Outcome.Should().Be(ServiceProviderOutcome.Ok);
        return result.Value!.Revenue.ClientSource;
    }

    [SkippableFact]
    public async Task A_mix_of_both_channels_splits_by_net_revenue()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedProviderAsync();
        var at = DateTime.UtcNow.AddDays(-3);
        await SeedAttributedReleaseAsync(providerId, ProposalSource.StandardProposal, 600m, at);
        await SeedAttributedReleaseAsync(providerId, ProposalSource.PublishedPackagePurchase, 400m, at);

        var source = await SourceAsync(providerId);

        source.EcosystemMatch.Value.Should().Be(60m);
        source.MarketplaceSearch.Value.Should().Be(40m);
        source.EcosystemNet.Should().Be(600m);
        source.MarketplaceNet.Should().Be(400m);
    }

    /// <summary>All six sources must land in exactly one channel — none may be dropped.</summary>
    [SkippableFact]
    public async Task Every_proposal_source_is_classified_into_one_of_the_two_channels()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedProviderAsync();
        var at = DateTime.UtcNow.AddDays(-3);
        foreach (var source in Enum.GetValues<ProposalSource>())
            await SeedAttributedReleaseAsync(providerId, source, 100m, at);

        var split = await SourceAsync(providerId);

        split.EcosystemNet.Should().Be(300m, "StandardProposal, DirectInvitationProposal, CustomOffer");
        split.MarketplaceNet.Should().Be(300m, "PublishedPackagePurchase, PackageAddOn, ChangeRequest");
        split.UnattributedNet.Should().Be(0m);
        (split.EcosystemMatch.Value + split.MarketplaceSearch.Value).Should().Be(100m);
    }

    /// <summary>
    /// The case that decides count-vs-revenue. By deal count marketplace wins 4:1; by
    /// revenue ecosystem holds the majority. The Earnings tab must report the money.
    /// </summary>
    [SkippableFact]
    public async Task Many_small_marketplace_sales_do_not_outweigh_larger_matched_revenue()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedProviderAsync();
        var at = DateTime.UtcNow.AddDays(-3);
        await SeedAttributedReleaseAsync(providerId, ProposalSource.StandardProposal, 800m, at);
        for (var i = 0; i < 4; i++)
            await SeedAttributedReleaseAsync(providerId, ProposalSource.PublishedPackagePurchase, 50m, at);

        var source = await SourceAsync(providerId);

        source.EcosystemMatch.Value.Should().Be(80m, "one large matched project outweighs four small purchases");
        source.MarketplaceSearch.Value.Should().Be(20m);
    }

    /// <summary>A split of nothing is not 50/50, and not 0%/0%.</summary>
    [SkippableFact]
    public async Task No_released_revenue_reports_not_enough_activity_rather_than_a_fabricated_split()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var source = await SourceAsync(await SeedProviderAsync());

        source.EcosystemMatch.State.Should().Be("notEnoughActivity");
        source.MarketplaceSearch.State.Should().Be("notEnoughActivity");
        source.EcosystemMatch.Value.Should().BeNull();
        source.MarketplaceSearch.Value.Should().BeNull();
        source.EcosystemMatch.Reason.Should().Contain("No revenue was released");
    }

    /// <summary>
    /// Untraceable revenue is excluded from the percentages rather than folded into a
    /// channel, and is reported separately so the remainder stays visible.
    /// </summary>
    [SkippableFact]
    public async Task Revenue_that_cannot_be_traced_to_a_proposal_is_excluded_not_assigned()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedProviderAsync();
        var at = DateTime.UtcNow.AddDays(-3);
        await SeedAttributedReleaseAsync(providerId, ProposalSource.StandardProposal, 300m, at);
        await SeedUnattributedReleaseAsync(providerId, 700m, at);

        var source = await SourceAsync(providerId);

        source.EcosystemMatch.Value.Should().Be(100m, "the untraceable 700 is not part of the ratio");
        source.MarketplaceSearch.Value.Should().Be(0m);
        source.UnattributedNet.Should().Be(700m);
    }

    /// <summary>Entirely untraceable revenue is a different problem, with a different reason.</summary>
    [SkippableFact]
    public async Task Entirely_untraceable_revenue_says_so_rather_than_reporting_no_activity()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedProviderAsync();
        await SeedUnattributedReleaseAsync(providerId, 500m, DateTime.UtcNow.AddDays(-3));

        var source = await SourceAsync(providerId);

        source.EcosystemMatch.State.Should().Be("notEnoughActivity");
        source.EcosystemMatch.Reason.Should().Contain("could not be traced");
        source.UnattributedNet.Should().Be(500m);
    }

    [SkippableFact]
    public async Task The_split_counts_only_releases_inside_the_selected_period()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedProviderAsync();
        await SeedAttributedReleaseAsync(providerId, ProposalSource.StandardProposal, 250m, DateTime.UtcNow.AddDays(-2));
        await SeedAttributedReleaseAsync(providerId, ProposalSource.PublishedPackagePurchase, 900m, DateTime.UtcNow.AddDays(-200));

        var source = await SourceAsync(providerId);

        source.EcosystemMatch.Value.Should().Be(100m, "the 200-day-old marketplace release is outside Last30Days");
        source.MarketplaceNet.Should().Be(0m);
    }
}
