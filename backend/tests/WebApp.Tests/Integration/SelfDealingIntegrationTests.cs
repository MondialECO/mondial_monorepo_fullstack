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
/// A user must never be both provider and client on one engagement. Nothing enforced this,
/// and the payoff compounded: a provider could buy their own package, drive the engagement
/// to Completed alone (every role check passes when both roles are one person), then leave
/// themselves a five-star Review that lands Verified by model default and feeds
/// RefreshTrust unfiltered.
///
/// These need a real database because the guarded methods are Mongo-backed services with
/// a dozen dependencies each; the pure rule is covered by SelfDealingGuardTests.
///
/// NOTE: requires Docker + a replica set. Skips when unavailable — see SkipReason.
/// </summary>
public class SelfDealingIntegrationTests : IClassFixture<ReplicaSetAppFixture>
{
    private readonly ReplicaSetAppFixture _fx;
    public SelfDealingIntegrationTests(ReplicaSetAppFixture fx) => _fx = fx;

    private IServiceProvider Sp => _fx.Factory!.Services;
    private MongoDbContext Db => Sp.GetRequiredService<MongoDbContext>();

    private async Task<string> SeedProviderAsync()
    {
        var users = Sp.GetRequiredService<UserManager<ApplicationUser>>();
        var user = new ApplicationUser
        {
            UserName = $"sp{Guid.NewGuid():N}@test.com",
            Email = $"sp{Guid.NewGuid():N}@test.com",
            Name = "Self Dealer",
            Tier_level = 1,
            ServiceProviderProfile = new ServiceProviderProfile
            {
                ProviderId = Guid.NewGuid().ToString(),
                VerificationStatus = ServiceProviderVerificationStatus.Verified,
                NewOrderAvailability = true,
                MaximumConcurrentOrders = 10,
                CurrentActiveOrders = 0,
            },
        };
        user.Onboarding.Phase = 1;
        (await users.CreateAsync(user, "Passw0rd!Passw0rd!")).Succeeded.Should().BeTrue();
        return user.Id.ToString();
    }

    private async Task<(string listingId, string packageId)> SeedPublishedPackageAsync(string providerId)
    {
        var listing = new ServiceListing
        {
            ProviderId = providerId,
            Title = "Self-dealing bait",
            Description = "<p>x</p>",
            Category = ServiceCategory.Development,
            ServiceType = "",
            Status = CatalogStatus.Published,
        };
        await Db.ServiceListings.InsertOneAsync(listing);

        var pkg = new ServicePackage
        {
            ServiceId = listing.Id,
            PackageName = "Basic",
            PackageType = PackageType.Basic,
            PackageTitle = "Basic",
            Price = 1000m,
            Currency = "EUR",
            DeliveryTimeValue = 5,
            IncludedRevisionCount = 1,
            RevisionRequestWindowDays = 3,
            InstantOrderEnabled = true,
            ManualApprovalRequired = false,
            Status = CatalogStatus.Published,
        };
        await Db.ServicePackages.InsertOneAsync(pkg);
        return (listing.Id, pkg.Id);
    }

    /// <summary>
    /// Every confirmation flag is set, so if the guard were missing this request would take
    /// the auto-accept path all the way to a converted engagement.
    /// </summary>
    private static PackagePurchaseRequest FullyConfirmed(string packageId) => new()
    {
        PackageId = packageId,
        SelectedAddOnNames = new(),
        Requirements = new(),
        ExplicitlyConfirmed = true,
        PaymentMethodVerified = true,
        EscrowAuthorized = true,
        ComplianceHold = false,
        FinalSummaryShown = true,
    };

    [SkippableFact]
    public async Task A_provider_cannot_buy_their_own_package()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedProviderAsync();
        var (_, packageId) = await SeedPublishedPackageAsync(providerId);
        var leads = Sp.GetRequiredService<ILeadsService>();

        var result = await leads.PurchasePackageAsync(providerId, FullyConfirmed(packageId));

        // Refused outright — not routed to the manual "provider approval" path, which the
        // same person would simply approve for themselves.
        // Conflict, not an unhandled exception mapping to 500, and not a silent success.
        result.Outcome.Should().Be(ServiceProviderOutcome.Conflict);
        result.Message.Should().Be(SelfDealingGuardMessage);

        // And nothing was persisted: no proposal to accept later, no engagement.
        (await Db.Proposals.CountDocumentsAsync(x => x.ClientId == providerId)).Should().Be(0);
        (await Db.WorkroomEngagements.CountDocumentsAsync(x => x.ClientId == providerId)).Should().Be(0);
    }

    [SkippableFact]
    public async Task A_legitimate_buyer_is_still_allowed_through()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedProviderAsync();
        var buyerId = await SeedProviderAsync(); // any other account
        var (_, packageId) = await SeedPublishedPackageAsync(providerId);
        var leads = Sp.GetRequiredService<ILeadsService>();

        var result = await leads.PurchasePackageAsync(buyerId, FullyConfirmed(packageId));

        // The guard must not have become a blanket refusal.
        result.Outcome.Should().Be(ServiceProviderOutcome.Ok);
        result.Value!.AutoAccepted.Should().BeTrue();
    }

    [SkippableFact]
    public async Task A_self_dealing_proposal_cannot_be_accepted()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var userId = await SeedProviderAsync();
        var proposal = new Proposal
        {
            ProviderId = userId,
            ClientId = userId,
            Title = "Self proposal",
            CoverMessage = "x",
            ProposedPrice = 1000m,
            Currency = "EUR",
            DeliveryTimeValue = 5,
            Deliverables = new() { "thing" },
            Status = ProposalStatus.ClientReviewing,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
        };
        await Db.Proposals.InsertOneAsync(proposal);
        var leads = Sp.GetRequiredService<ILeadsService>();

        var result = await leads.AcceptAsync(userId, proposal.Id,
            new AcceptProposalRequest { ExplicitlyConfirmed = true, EscrowAuthorized = true });

        result.Outcome.Should().Be(ServiceProviderOutcome.Conflict);
        result.Message.Should().Be(SelfDealingGuardMessage);

        var after = await Db.Proposals.Find(x => x.Id == proposal.Id).FirstAsync();
        after.Status.Should().Be(ProposalStatus.ClientReviewing, "the proposal must not advance");
    }

    /// <summary>
    /// The structural backstop. ConvertProposalAsync holds the only `new WorkroomEngagement`
    /// in the codebase, so this is what guarantees the invariant for pre-existing rows and
    /// for any acceptance path added later that forgets its own check.
    /// </summary>
    [SkippableFact]
    public async Task Conversion_refuses_a_self_dealing_proposal_without_derailing_the_sweep()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var userId = await SeedProviderAsync();
        var poisoned = new Proposal
        {
            ProviderId = userId,
            ClientId = userId,
            Title = "Pre-existing self-dealing row",
            ProposedPrice = 1000m,
            Currency = "EUR",
            DeliveryTimeValue = 5,
            Status = ProposalStatus.Accepted,
            ConversionStatus = ProposalConversionStatus.AwaitingModule4,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
        };
        await Db.Proposals.InsertOneAsync(poisoned);
        var workroom = Sp.GetRequiredService<IWorkroomService>();

        // Must not throw: SweepConversionsAsync iterates with no try/catch, so an exception
        // here would abort the batch and block every legitimate proposal behind it.
        var act = async () => await workroom.ConvertProposalAsync(poisoned.Id);
        await act.Should().NotThrowAsync();

        (await Db.WorkroomEngagements.CountDocumentsAsync(x => x.ProposalId == poisoned.Id))
            .Should().Be(0, "no engagement may be created with one user on both sides");
    }

    /// <summary>
    /// Regression cover for the audit item that was already correct: role-specific
    /// comparisons, not merely "is a participant". These must keep working — the
    /// self-dealing guard is what makes them meaningful, since both checks pass trivially
    /// when one person holds both roles.
    /// </summary>
    [SkippableFact]
    public async Task Role_specific_checks_still_reject_the_wrong_party()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedProviderAsync();
        var clientId = await SeedProviderAsync();
        var engagement = new WorkroomEngagement
        {
            ProposalId = MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
            ProviderId = providerId,
            ClientId = clientId,
            Title = "Engagement",
            ContractValue = 1000m,
            Currency = "EUR",
        };
        await Db.WorkroomEngagements.InsertOneAsync(engagement);
        var milestone = new WorkroomMilestone
        {
            EngagementId = engagement.Id,
            Title = "M1",
            Amount = 1000m,
            Currency = "EUR",
            MilestoneStatus = WorkroomMilestoneStatus.FundingRequired,
        };
        await Db.WorkroomMilestones.InsertOneAsync(milestone);
        var workroom = Sp.GetRequiredService<IWorkroomService>();

        // Provider-only action attempted by the client.
        (await workroom.ActivateMilestoneAsync(clientId, milestone.Id)).Outcome.Should().NotBe(ServiceProviderOutcome.Ok);

        // Client-only action attempted by the provider.
        (await workroom.FundMilestoneAsync(providerId, milestone.Id)).Outcome.Should().NotBe(ServiceProviderOutcome.Ok);

        // A complete stranger gets nothing either.
        var strangerId = await SeedProviderAsync();
        (await workroom.ActivateMilestoneAsync(strangerId, milestone.Id)).Outcome.Should().NotBe(ServiceProviderOutcome.Ok);
    }

    private static string SelfDealingGuardMessage =>
        WebApp.Services.Implementations.SelfDealingGuard.Message;
}
