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
/// Provider eligibility beyond the role claim (audit item 5).
///
/// A role claim proves a JWT belongs to someone in the ServiceProvider bucket. It does not
/// prove they passed verification, and a suspended provider keeps the claim — so the
/// controller attributes and these service-layer checks cover different things and both
/// are needed.
///
/// NOTE: requires Docker + a replica set. Skips when unavailable — see SkipReason.
/// </summary>
public class ProviderEligibilityIntegrationTests : IClassFixture<ReplicaSetAppFixture>
{
    private readonly ReplicaSetAppFixture _fx;
    public ProviderEligibilityIntegrationTests(ReplicaSetAppFixture fx) => _fx = fx;

    private IServiceProvider Sp => _fx.Factory!.Services;
    private MongoDbContext Db => Sp.GetRequiredService<MongoDbContext>();

    private async Task<string> SeedUserAsync(ServiceProviderVerificationStatus status)
    {
        var users = Sp.GetRequiredService<UserManager<ApplicationUser>>();
        var user = new ApplicationUser
        {
            UserName = $"u{Guid.NewGuid():N}@test.com",
            Email = $"u{Guid.NewGuid():N}@test.com",
            Name = "Eligibility Test",
            Tier_level = 1,
            ServiceProviderProfile = new ServiceProviderProfile
            {
                ProviderId = Guid.NewGuid().ToString(),
                VerificationStatus = status,
                NewOrderAvailability = true,
                MaximumConcurrentOrders = 10,
            },
        };
        user.Onboarding.Phase = 1;
        (await users.CreateAsync(user, "Passw0rd!Passw0rd!")).Succeeded.Should().BeTrue();
        return user.Id.ToString();
    }

    private static UpsertServiceListingRequest Listing() => new()
    {
        Title = "A service",
        Description = "<p>x</p>",
        Category = nameof(ServiceCategory.Development),
        ServiceType = "",
    };

    [SkippableFact]
    public async Task An_unverified_provider_cannot_create_a_listing()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var userId = await SeedUserAsync(ServiceProviderVerificationStatus.Pending);
        var catalog = Sp.GetRequiredService<IServiceCatalogService>();

        var result = await catalog.CreateListingAsync(userId, Listing());

        result.Outcome.Should().Be(ServiceProviderOutcome.Conflict);
        result.Message.Should().Contain("verified");
    }

    /// <summary>A suspended provider keeps their role claim, so only this check stops them.</summary>
    [SkippableFact]
    public async Task A_rejected_provider_cannot_create_a_listing()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var userId = await SeedUserAsync(ServiceProviderVerificationStatus.Rejected);
        var catalog = Sp.GetRequiredService<IServiceCatalogService>();

        (await catalog.CreateListingAsync(userId, Listing())).Outcome
            .Should().Be(ServiceProviderOutcome.Conflict);
    }

    [SkippableFact]
    public async Task A_verified_provider_can_still_create_a_listing()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var userId = await SeedUserAsync(ServiceProviderVerificationStatus.Verified);
        var catalog = Sp.GetRequiredService<IServiceCatalogService>();

        (await catalog.CreateListingAsync(userId, Listing())).Outcome
            .Should().Be(ServiceProviderOutcome.Ok);
    }

    /// <summary>
    /// The manual order-request path was the one way an unverified provider could still
    /// take paid work: the purchase fails the "Provider is unavailable" gate, which routes
    /// to manual approval rather than rejecting, and approving pushed it on to client
    /// acceptance with no eligibility check anywhere.
    /// </summary>
    [SkippableFact]
    public async Task An_unverified_provider_cannot_approve_a_manual_order_request()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedUserAsync(ServiceProviderVerificationStatus.Pending);
        var clientId = await SeedUserAsync(ServiceProviderVerificationStatus.Verified);
        var proposal = new Proposal
        {
            ProviderId = providerId,
            ClientId = clientId,
            Title = "Order request",
            ProposedPrice = 1000m,
            Currency = "EUR",
            DeliveryTimeValue = 5,
            ProposalSource = ProposalSource.PublishedPackagePurchase,
            AcceptanceTrigger = "ProviderApprovalRequired",
            Status = ProposalStatus.Submitted,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
        };
        await Db.Proposals.InsertOneAsync(proposal);
        var leads = Sp.GetRequiredService<ILeadsService>();

        var result = await leads.ProviderReviewOrderRequestAsync(providerId, proposal.Id, accept: true);

        result.Outcome.Should().Be(ServiceProviderOutcome.Conflict);
        var after = await Db.Proposals.Find(x => x.Id == proposal.Id).FirstAsync();
        after.Status.Should().Be(ProposalStatus.Submitted, "the request must not advance");
    }
}
