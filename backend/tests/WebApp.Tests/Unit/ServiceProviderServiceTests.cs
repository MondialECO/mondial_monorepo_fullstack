using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Audit;
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
    private readonly Mock<IAuditLogger> _audit = new();
    private readonly Mock<INotificationService> _notifications = new();
    private readonly ServiceProviderService _service;

    public ServiceProviderServiceTests()
    {
        _userManager
            .Setup(m => m.UpdateAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync(IdentityResult.Success);
        _service = new ServiceProviderService(
            _userManager.Object, _audit.Object, _notifications.Object, NullLogger<ServiceProviderService>.Instance);
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

    [Fact]
    public async Task Submit_records_audit_entry()
    {
        var user = GivenUser(CompleteProviderUser());

        await _service.SubmitVerificationAsync(user.Id.ToString(),
            new SubmitVerificationRequest { ConfirmAccuracy = true });

        _audit.Verify(a => a.Record("ServiceProviderVerification.Submit",
            user.Id.ToString(), true, It.IsAny<object>()), Times.Once);
    }

    [Fact]
    public async Task Submit_allows_resubmission_from_rejected_and_clears_reason()
    {
        var user = CompleteProviderUser();
        user.ServiceProviderProfile.VerificationStatus = ServiceProviderVerificationStatus.Rejected;
        user.ServiceProviderProfile.RejectionReason = "incomplete";
        GivenUser(user);

        var result = await _service.SubmitVerificationAsync(user.Id.ToString(),
            new SubmitVerificationRequest { ConfirmAccuracy = true });

        result.Outcome.Should().Be(ServiceProviderOutcome.Ok);
        result.Value!.VerificationStatus.Should().Be("UnderReview");
        user.ServiceProviderProfile.RejectionReason.Should().BeNull();
    }

    // ---------------- Admin approve ----------------

    private static ApplicationUser UnderReviewUser()
    {
        var u = CompleteProviderUser();
        u.ServiceProviderProfile.VerificationStatus = ServiceProviderVerificationStatus.UnderReview;
        return u;
    }

    [Fact]
    public async Task Approve_verifies_seeds_trustscore_and_notifies()
    {
        var user = GivenUser(UnderReviewUser());

        var result = await _service.ApproveVerificationAsync(user.Id.ToString(), "admin-1");

        result.Outcome.Should().Be(ServiceProviderOutcome.Ok);
        result.Value!.VerificationStatus.Should().Be("Verified");
        result.Value.IsVerified.Should().BeTrue();
        result.Value.VerifiedAt.Should().NotBeNull();
        result.Value.TrustScore.Should().Be(ServiceProviderService.TrustScoreBaseline);
        user.ServiceProviderProfile.TrustScore.Should().Be(50.0);

        _audit.Verify(a => a.Record("ServiceProviderVerification.Approve", "admin-1", true, It.IsAny<object>()), Times.Once);
        _notifications.Verify(n => n.NotifyUser(user.Id, "Provider verification approved", It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task Approve_conflicts_when_not_under_review()
    {
        var user = GivenUser(CompleteProviderUser()); // status Pending

        var result = await _service.ApproveVerificationAsync(user.Id.ToString(), "admin-1");

        result.Outcome.Should().Be(ServiceProviderOutcome.Conflict);
        _notifications.Verify(n => n.NotifyUser(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task Approve_returns_NotFound_for_missing_user()
    {
        _userManager.Setup(m => m.FindByIdAsync("ghost")).ReturnsAsync((ApplicationUser?)null);
        var result = await _service.ApproveVerificationAsync("ghost", "admin-1");
        result.Outcome.Should().Be(ServiceProviderOutcome.NotFound);
    }

    [Fact]
    public async Task Approve_succeeds_even_when_notification_throws()
    {
        var user = GivenUser(UnderReviewUser());
        _notifications
            .Setup(n => n.NotifyUser(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>()))
            .ThrowsAsync(new Exception("push down"));

        var result = await _service.ApproveVerificationAsync(user.Id.ToString(), "admin-1");

        result.Outcome.Should().Be(ServiceProviderOutcome.Ok);
        user.ServiceProviderProfile.VerificationStatus.Should().Be(ServiceProviderVerificationStatus.Verified);
    }

    // ---------------- Admin reject ----------------

    [Fact]
    public async Task Reject_sets_status_reason_and_notifies()
    {
        var user = GivenUser(UnderReviewUser());

        var result = await _service.RejectVerificationAsync(user.Id.ToString(), "admin-1", "blurry portfolio");

        result.Outcome.Should().Be(ServiceProviderOutcome.Ok);
        result.Value!.VerificationStatus.Should().Be("Rejected");
        result.Value.RejectionReason.Should().Be("blurry portfolio");
        result.Value.VerifiedAt.Should().BeNull();
        user.ServiceProviderProfile.TrustScore.Should().Be(0); // not seeded on reject

        _audit.Verify(a => a.Record("ServiceProviderVerification.Reject", "admin-1", true, It.IsAny<object>()), Times.Once);
        _notifications.Verify(n => n.NotifyUser(user.Id, "Provider verification needs changes", It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task Reject_conflicts_when_not_under_review()
    {
        var user = GivenUser(CompleteProviderUser()); // Pending
        var result = await _service.RejectVerificationAsync(user.Id.ToString(), "admin-1", "reason");
        result.Outcome.Should().Be(ServiceProviderOutcome.Conflict);
    }

    [Fact]
    public async Task Reject_returns_NotFound_for_missing_user()
    {
        _userManager.Setup(m => m.FindByIdAsync("ghost")).ReturnsAsync((ApplicationUser?)null);
        var result = await _service.RejectVerificationAsync("ghost", "admin-1", "reason");
        result.Outcome.Should().Be(ServiceProviderOutcome.NotFound);
    }
}
