using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// D-1 Phase 4 — Service-layer behaviour for the embedded ServiceProviderProfile:
/// normalization, portfolio index handling, completeness gate, duplicate-submission
/// guard, and the Pending→UnderReview transition. UserManager is mocked; no DB.
/// </summary>
public class ServiceProviderServiceTests
{
    private readonly Mock<UserManager<ApplicationUser>> _userManager = MockUserManager();
    private readonly ServiceProviderService _service;

    public ServiceProviderServiceTests()
    {
        _userManager
            .Setup(m => m.UpdateAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync(IdentityResult.Success);
        _service = new ServiceProviderService(_userManager.Object, NullLogger<ServiceProviderService>.Instance);
    }

    private static Mock<UserManager<ApplicationUser>> MockUserManager() =>
        new(Mock.Of<IUserStore<ApplicationUser>>(), null!, null!, null!, null!, null!, null!, null!, null!);

    private ApplicationUser GivenUser(ApplicationUser user)
    {
        _userManager.Setup(m => m.FindByIdAsync(user.Id.ToString())).ReturnsAsync(user);
        return user;
    }

    // ---------------- Not found ----------------

    [Fact]
    public async Task GetProfile_returns_NotFound_when_user_missing()
    {
        _userManager.Setup(m => m.FindByIdAsync("ghost")).ReturnsAsync((ApplicationUser?)null);
        var result = await _service.GetProfileAsync("ghost");
        result.Outcome.Should().Be(ServiceProviderOutcome.NotFound);
    }

    // ---------------- Upsert / normalization ----------------

    [Fact]
    public async Task Upsert_trims_dedupes_skills_and_parses_categories()
    {
        var user = GivenUser(new ApplicationUser());

        var result = await _service.UpsertProfileAsync(user.Id.ToString(), new CreateOrUpdateServiceProviderProfileRequest
        {
            Skills = new() { "  contracts ", "contracts", "Contracts", "fundraising", "   " },
            ServiceCategories = new() { "legal", "Legal", "finance" },
        });

        result.Outcome.Should().Be(ServiceProviderOutcome.Ok);
        result.Value!.Skills.Should().Equal("contracts", "fundraising");
        result.Value.ServiceCategories.Should().Equal("Legal", "Finance");
        result.Value.ProviderId.Should().Be(user.Id.ToString());
        _userManager.Verify(m => m.UpdateAsync(user), Times.Once);
    }

    // ---------------- Portfolio ----------------

    [Fact]
    public async Task AddPortfolio_appends_item_with_added_timestamp()
    {
        var user = GivenUser(new ApplicationUser());

        var result = await _service.AddPortfolioItemAsync(user.Id.ToString(), new AddPortfolioItemRequest
        {
            Title = "  Series A docs ",
            Description = " led the round ",
            Url = "  ",
        });

        result.Outcome.Should().Be(ServiceProviderOutcome.Ok);
        result.Value!.PortfolioItems.Should().ContainSingle();
        var item = result.Value.PortfolioItems[0];
        item.Title.Should().Be("Series A docs");      // trimmed
        item.Description.Should().Be("led the round"); // trimmed
        item.Url.Should().BeNull();                    // blank -> null
        item.Index.Should().Be(0);
        item.AddedAt.Should().NotBe(default);
    }

    [Fact]
    public async Task UpdatePortfolio_preserves_AddedAt_and_replaces_fields()
    {
        var addedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var user = GivenUser(new ApplicationUser
        {
            ServiceProviderProfile = new ServiceProviderProfile
            {
                PortfolioItems = new() { new PortfolioItem { Title = "old", AddedAt = addedAt } },
            },
        });

        var result = await _service.UpdatePortfolioItemAsync(user.Id.ToString(), new UpdatePortfolioItemRequest
        {
            Index = 0,
            Title = "new",
            Description = "updated",
        });

        result.Outcome.Should().Be(ServiceProviderOutcome.Ok);
        result.Value!.PortfolioItems[0].Title.Should().Be("new");
        result.Value.PortfolioItems[0].AddedAt.Should().Be(addedAt); // preserved
    }

    [Fact]
    public async Task UpdatePortfolio_returns_NotFound_for_bad_index()
    {
        var user = GivenUser(new ApplicationUser());
        var result = await _service.UpdatePortfolioItemAsync(user.Id.ToString(), new UpdatePortfolioItemRequest
        {
            Index = 5,
            Title = "x",
            Description = "y",
        });
        result.Outcome.Should().Be(ServiceProviderOutcome.NotFound);
    }

    [Fact]
    public async Task DeletePortfolio_removes_item_then_404_on_reuse()
    {
        var user = GivenUser(new ApplicationUser
        {
            ServiceProviderProfile = new ServiceProviderProfile
            {
                PortfolioItems = new() { new PortfolioItem { Title = "a" } },
            },
        });

        var first = await _service.DeletePortfolioItemAsync(user.Id.ToString(), 0);
        first.Outcome.Should().Be(ServiceProviderOutcome.Ok);
        first.Value!.PortfolioItems.Should().BeEmpty();

        var second = await _service.DeletePortfolioItemAsync(user.Id.ToString(), 0);
        second.Outcome.Should().Be(ServiceProviderOutcome.NotFound);
    }

    // ---------------- Verification submission ----------------

    private static ApplicationUser CompleteProviderUser() => new()
    {
        ServiceProviderProfile = new ServiceProviderProfile
        {
            Skills = new() { "contracts" },
            ServiceCategories = new() { ServiceCategory.Legal },
            PortfolioItems = new() { new PortfolioItem { Title = "a", Description = "b" } },
        },
    };

    [Fact]
    public async Task Submit_transitions_pending_to_under_review_and_stamps_time()
    {
        var user = GivenUser(CompleteProviderUser());

        var result = await _service.SubmitVerificationAsync(user.Id.ToString(),
            new SubmitVerificationRequest { ConfirmAccuracy = true });

        result.Outcome.Should().Be(ServiceProviderOutcome.Ok);
        result.Value!.VerificationStatus.Should().Be("UnderReview");
        result.Value.VerificationSubmittedAt.Should().NotBeNull();
        result.Value.IsVerified.Should().BeFalse();
        user.ServiceProviderProfile.VerificationStatus.Should().Be(ServiceProviderVerificationStatus.UnderReview);
    }

    [Fact]
    public async Task Submit_rejects_incomplete_profile_with_conflict()
    {
        var user = GivenUser(new ApplicationUser
        {
            ServiceProviderProfile = new ServiceProviderProfile
            {
                Skills = new() { "contracts" },
                ServiceCategories = new() { ServiceCategory.Legal },
                // no portfolio items
            },
        });

        var result = await _service.SubmitVerificationAsync(user.Id.ToString(),
            new SubmitVerificationRequest { ConfirmAccuracy = true });

        result.Outcome.Should().Be(ServiceProviderOutcome.Conflict);
    }

    [Fact]
    public async Task Submit_prevents_duplicate_submission()
    {
        var user = CompleteProviderUser();
        user.ServiceProviderProfile.VerificationStatus = ServiceProviderVerificationStatus.UnderReview;
        GivenUser(user);

        var result = await _service.SubmitVerificationAsync(user.Id.ToString(),
            new SubmitVerificationRequest { ConfirmAccuracy = true });

        result.Outcome.Should().Be(ServiceProviderOutcome.Conflict);
        result.Message.Should().Contain("already");
    }
}
