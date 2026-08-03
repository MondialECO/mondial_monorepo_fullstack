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
/// Wiring for the money floors. The rules themselves are unit-tested in
/// MoneyPositivityRulesTests; these prove each one is actually reached from the workflow
/// that can be exploited.
///
/// NOTE: requires Docker + a replica set. Skips when unavailable — see SkipReason.
/// </summary>
public class MoneyPositivityIntegrationTests : IClassFixture<ReplicaSetAppFixture>
{
    private readonly ReplicaSetAppFixture _fx;
    public MoneyPositivityIntegrationTests(ReplicaSetAppFixture fx) => _fx = fx;

    private IServiceProvider Sp => _fx.Factory!.Services;
    private MongoDbContext Db => Sp.GetRequiredService<MongoDbContext>();

    private async Task<string> SeedUserAsync()
    {
        var users = Sp.GetRequiredService<UserManager<ApplicationUser>>();
        var user = new ApplicationUser
        {
            UserName = $"u{Guid.NewGuid():N}@test.com",
            Email = $"u{Guid.NewGuid():N}@test.com",
            Name = "Money Test",
            Tier_level = 1,
            ServiceProviderProfile = new ServiceProviderProfile
            {
                ProviderId = Guid.NewGuid().ToString(),
                VerificationStatus = ServiceProviderVerificationStatus.Verified,
                NewOrderAvailability = true,
                MaximumConcurrentOrders = 10,
            },
        };
        user.Onboarding.Phase = 1;
        (await users.CreateAsync(user, "Passw0rd!Passw0rd!")).Succeeded.Should().BeTrue();
        return user.Id.ToString();
    }

    private async Task<ServicePackage> SeedPackageAsync(
        string providerId,
        CatalogStatus status = CatalogStatus.Published,
        List<ServiceAddOn>? addOns = null,
        decimal price = 1000m)
    {
        var listing = new ServiceListing
        {
            ProviderId = providerId,
            Title = "Listing",
            Description = "<p>x</p>",
            Category = ServiceCategory.Development,
            Status = status,
        };
        await Db.ServiceListings.InsertOneAsync(listing);

        var pkg = new ServicePackage
        {
            ServiceId = listing.Id,
            PackageName = "Basic",
            PackageType = PackageType.Basic,
            PackageTitle = "Basic",
            Price = price,
            Currency = "EUR",
            DeliveryTimeValue = 5,
            IncludedRevisionCount = 1,
            RevisionRequestWindowDays = 3,
            InstantOrderEnabled = true,
            ManualApprovalRequired = false,
            AddOns = addOns ?? new(),
            Status = status,
        };
        await Db.ServicePackages.InsertOneAsync(pkg);
        return pkg;
    }

    private static PackagePurchaseRequest Order(string packageId, params string[] addOns) => new()
    {
        PackageId = packageId,
        SelectedAddOnNames = addOns.ToList(),
        Requirements = new(),
        ExplicitlyConfirmed = true,
        PaymentMethodVerified = true,
        EscrowAuthorized = true,
        ComplianceHold = false,
        FinalSummaryShown = true,
    };

    [SkippableFact]
    public async Task Publishing_is_blocked_by_a_negative_enabled_add_on()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedUserAsync();
        var pkg = await SeedPackageAsync(providerId, CatalogStatus.Draft,
            addOns: new() { new ServiceAddOn { Name = "Discount", Price = -900m, Enabled = true } });
        var catalog = Sp.GetRequiredService<IServiceCatalogService>();

        var result = await catalog.PublishPackageAsync(providerId, pkg.Id, new PublishPackageRequest());

        result.Outcome.Should().Be(ServiceProviderOutcome.Conflict);
        result.Message.Should().Contain("add-on");
    }

    [SkippableFact]
    public async Task Publishing_is_blocked_by_a_negative_additional_revision_price()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedUserAsync();
        var pkg = await SeedPackageAsync(providerId, CatalogStatus.Draft);
        await Db.ServicePackages.UpdateOneAsync(x => x.Id == pkg.Id,
            Builders<ServicePackage>.Update
                .Set(x => x.AdditionalRevisionAvailable, true)
                .Set(x => x.AdditionalRevisionPrice, -75m));
        var catalog = Sp.GetRequiredService<IServiceCatalogService>();

        var result = await catalog.PublishPackageAsync(providerId, pkg.Id, new PublishPackageRequest());

        result.Outcome.Should().Be(ServiceProviderOutcome.Conflict);
        result.Message.Should().Contain("additional-revision");
    }

    /// <summary>
    /// The case the publish gate cannot cover. An unpublished package does not reject at
    /// purchase — "Package is not active" is a `failures` entry, which routes to the manual
    /// path and can still become a real proposal — so a draft carrying a negative add-on
    /// reaches the price computation without ever passing publish validation.
    /// </summary>
    [SkippableFact]
    public async Task A_negative_add_on_is_refused_at_purchase_even_on_an_unpublished_package()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedUserAsync();
        var buyerId = await SeedUserAsync();
        var pkg = await SeedPackageAsync(providerId, CatalogStatus.Draft,
            addOns: new() { new ServiceAddOn { Name = "Discount", Price = -900m, Enabled = true } });
        var leads = Sp.GetRequiredService<ILeadsService>();

        var result = await leads.PurchasePackageAsync(buyerId, Order(pkg.Id, "Discount"));

        // Refused outright, not routed to manual approval where it could still proceed.
        result.Outcome.Should().Be(ServiceProviderOutcome.Conflict);
        result.Message.Should().Contain("add-on price");
        (await Db.Proposals.CountDocumentsAsync(x => x.ClientId == buyerId)).Should().Be(0);
    }

    /// <summary>
    /// A negative add-on that leaves the total positive still cuts the 12% commission base,
    /// which a `final &lt;= 0` check alone would miss — hence two conditions, not one.
    /// </summary>
    [SkippableFact]
    public async Task A_discount_add_on_that_keeps_the_total_positive_is_still_refused()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedUserAsync();
        var buyerId = await SeedUserAsync();
        var pkg = await SeedPackageAsync(providerId, CatalogStatus.Published, price: 1000m,
            addOns: new() { new ServiceAddOn { Name = "Discount", Price = -900m, Enabled = true } });
        var leads = Sp.GetRequiredService<ILeadsService>();

        // 1000 + (-900) = 100, comfortably positive, commission base cut from 120 to 12.
        var result = await leads.PurchasePackageAsync(buyerId, Order(pkg.Id, "Discount"));

        result.Outcome.Should().Be(ServiceProviderOutcome.Conflict);
    }

    [SkippableFact]
    public async Task A_clean_purchase_is_unaffected()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var providerId = await SeedUserAsync();
        var buyerId = await SeedUserAsync();
        var pkg = await SeedPackageAsync(providerId, CatalogStatus.Published,
            addOns: new() { new ServiceAddOn { Name = "Rush", Price = 250m, Enabled = true } });
        var leads = Sp.GetRequiredService<ILeadsService>();

        var result = await leads.PurchasePackageAsync(buyerId, Order(pkg.Id, "Rush"));

        result.Outcome.Should().Be(ServiceProviderOutcome.Ok);
        result.Value!.Proposal.ProposedPrice.Should().Be(1250m);
    }

    private async Task<Proposal> SeedAcceptedProposalAsync(
        string providerId, string clientId, decimal price, List<ProposalMilestonePlanItem> plan)
    {
        var proposal = new Proposal
        {
            ProviderId = providerId,
            ClientId = clientId,
            Title = "Engagement",
            ProposedPrice = price,
            Currency = "EUR",
            DeliveryTimeValue = 5,
            MilestonePlan = plan,
            Status = ProposalStatus.Accepted,
            ConversionStatus = ProposalConversionStatus.AwaitingModule4,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
        };
        await Db.Proposals.InsertOneAsync(proposal);
        return proposal;
    }

    [SkippableFact]
    public async Task Conversion_refuses_a_plan_with_a_negative_amount_that_sums_correctly()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var proposal = await SeedAcceptedProposalAsync(
            await SeedUserAsync(), await SeedUserAsync(), 1000m,
            new()
            {
                new ProposalMilestonePlanItem { Title = "A", Amount = -500m, DisplayOrder = 0 },
                new ProposalMilestonePlanItem { Title = "B", Amount = 1500m, DisplayOrder = 1 },
            });
        var workroom = Sp.GetRequiredService<IWorkroomService>();

        var act = async () => await workroom.ConvertProposalAsync(proposal.Id);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*greater than zero*");
        (await Db.WorkroomEngagements.CountDocumentsAsync(x => x.ProposalId == proposal.Id)).Should().Be(0);
    }

    [SkippableFact]
    public async Task Conversion_still_accepts_a_valid_plan()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var proposal = await SeedAcceptedProposalAsync(
            await SeedUserAsync(), await SeedUserAsync(), 1000m,
            new()
            {
                new ProposalMilestonePlanItem { Title = "A", Amount = 400m, DisplayOrder = 0 },
                new ProposalMilestonePlanItem { Title = "B", Amount = 600m, DisplayOrder = 1 },
            });
        var workroom = Sp.GetRequiredService<IWorkroomService>();

        await workroom.ConvertProposalAsync(proposal.Id);

        (await Db.WorkroomEngagements.CountDocumentsAsync(x => x.ProposalId == proposal.Id)).Should().Be(1);
        (await Db.WorkroomMilestones.CountDocumentsAsync(x => x.Amount <= 0)).Should().Be(0);
    }

    /// <summary>
    /// A refused proposal must not take the batch down with it. Before the sweep isolated
    /// each conversion, one such row aborted the whole run and every legitimate proposal
    /// behind it stayed unconverted — permanently, since the same row failed each sweep.
    /// </summary>
    [SkippableFact]
    public async Task One_refused_proposal_does_not_block_the_rest_of_the_sweep()
    {
        Skip.IfNot(_fx.Available, _fx.SkipReason);

        var poisoned = await SeedAcceptedProposalAsync(
            await SeedUserAsync(), await SeedUserAsync(), 1000m,
            new()
            {
                new ProposalMilestonePlanItem { Title = "A", Amount = -500m, DisplayOrder = 0 },
                new ProposalMilestonePlanItem { Title = "B", Amount = 1500m, DisplayOrder = 1 },
            });
        var healthy = await SeedAcceptedProposalAsync(
            await SeedUserAsync(), await SeedUserAsync(), 800m, new());
        var workroom = Sp.GetRequiredService<IWorkroomService>();

        var act = async () => await workroom.SweepConversionsAsync();
        await act.Should().NotThrowAsync();

        (await Db.WorkroomEngagements.CountDocumentsAsync(x => x.ProposalId == poisoned.Id)).Should().Be(0);
        (await Db.WorkroomEngagements.CountDocumentsAsync(x => x.ProposalId == healthy.Id))
            .Should().Be(1, "the healthy proposal must convert despite the poisoned one");
    }
}
