using System.Linq;
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
/// guard, immediate first-submission verification, and moderation transitions.
/// UserManager is mocked; no DB.
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

    // ---------------- Admin pending queue (Phase 5) ----------------

    [Fact]
    public async Task GetPendingVerifications_returns_only_UnderReview_oldest_first()
    {
        var newer = new ApplicationUser
        {
            Name = "Newer",
            ServiceProviderProfile = new()
            {
                VerificationStatus = ServiceProviderVerificationStatus.UnderReview,
                VerificationSubmittedAt = new DateTime(2026, 2, 1, 0, 0, 0, DateTimeKind.Utc),
                Skills = new() { "contracts" },
            },
        };
        var older = new ApplicationUser
        {
            Name = "Older",
            Email = "older@example.com",
            ServiceProviderProfile = new()
            {
                VerificationStatus = ServiceProviderVerificationStatus.UnderReview,
                VerificationSubmittedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            },
        };
        var pending = new ApplicationUser
        {
            ServiceProviderProfile = new() { VerificationStatus = ServiceProviderVerificationStatus.Pending },
        };
        var noProfile = new ApplicationUser();

        _userManager
            .Setup(m => m.Users)
            .Returns(new[] { newer, pending, older, noProfile }.AsQueryable());

        var result = await _service.GetPendingVerificationsAsync();

        result.Outcome.Should().Be(ServiceProviderOutcome.Ok);
        result.Value!.Select(p => p.Name).Should().Equal("Older", "Newer"); // oldest first
        result.Value[0].Email.Should().Be("older@example.com");
        result.Value[0].Profile.VerificationStatus.Should().Be("UnderReview");
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

    // ---------------- Stage 2 upsert (D-2 Phase 4) ----------------

    [Fact]
    public async Task Upsert_persists_all_stage2_fields()
    {
        var user = GivenUser(new ApplicationUser());

        var result = await _service.UpsertProfileAsync(user.Id.ToString(), new CreateOrUpdateServiceProviderProfileRequest
        {
            Skills = new() { "contracts" },
            ServiceCategories = new() { "Legal" },
            Headline = "Fractional CFO",
            Bio = "15 years in finance.",
            Industries = new() { "Fintech", "SaaS" },
            Languages = new() { "English", "French" },
            PricingModels = new() { "MonthlyRetainer", "EquityCompensation" },
        });

        result.Outcome.Should().Be(ServiceProviderOutcome.Ok);
        result.Value!.Headline.Should().Be("Fractional CFO");
        result.Value.Bio.Should().Be("15 years in finance.");
        result.Value.Industries.Should().Equal("Fintech", "SaaS");
        result.Value.Languages.Should().Equal("English", "French");
        result.Value.PricingModels.Should().Equal("MonthlyRetainer", "EquityCompensation");
    }

    [Fact]
    public async Task Upsert_trims_and_dedupes_industries_and_languages()
    {
        var user = GivenUser(new ApplicationUser());

        var result = await _service.UpsertProfileAsync(user.Id.ToString(), new CreateOrUpdateServiceProviderProfileRequest
        {
            Skills = new() { "contracts" },
            ServiceCategories = new() { "Legal" },
            Industries = new() { "  Fintech ", "fintech", "FINTECH", "SaaS", "   " },
            Languages = new() { " English ", "english", "French" },
        });

        result.Value!.Industries.Should().Equal("Fintech", "SaaS"); // trimmed, first-wins, deduped
        result.Value.Languages.Should().Equal("English", "French");
    }

    [Fact]
    public async Task Upsert_blank_headline_and_bio_become_null()
    {
        var user = GivenUser(new ApplicationUser());

        var result = await _service.UpsertProfileAsync(user.Id.ToString(), new CreateOrUpdateServiceProviderProfileRequest
        {
            Skills = new() { "contracts" },
            ServiceCategories = new() { "Legal" },
            Headline = "   ",
            Bio = "",
        });

        result.Value!.Headline.Should().BeNull();
        result.Value.Bio.Should().BeNull();
    }

    [Fact]
    public async Task Upsert_parses_pricing_models_ignoring_invalid_and_dedup_preserving_order()
    {
        var user = GivenUser(new ApplicationUser());

        var result = await _service.UpsertProfileAsync(user.Id.ToString(), new CreateOrUpdateServiceProviderProfileRequest
        {
            Skills = new() { "contracts" },
            ServiceCategories = new() { "Legal" },
            PricingModels = new() { "hourly", "Hourly", "BarterDeal", "FixedPrice", "  " },
        });

        // invalid "BarterDeal" dropped; "hourly"/"Hourly" collapsed; order preserved.
        result.Value!.PricingModels.Should().Equal("Hourly", "FixedPrice");
    }

    [Fact]
    public async Task Upsert_advances_to_phase_2_when_profile_complete()
    {
        var user = GivenUser(new ApplicationUser
        {
            ServiceProviderProfile = new ServiceProviderProfile
            {
                PortfolioItems = new() { new PortfolioItem { Title = "a" } },
            },
        });

        var result = await _service.UpsertProfileAsync(user.Id.ToString(), new CreateOrUpdateServiceProviderProfileRequest
        {
            Skills = new() { "contracts" },
            ServiceCategories = new() { "Legal" },
            Headline = "Fractional CFO",
            Bio = "bio",
            Industries = new() { "Fintech" },
            Languages = new() { "English" },
            PricingModels = new() { "FixedPrice" },
        });

        result.Value!.CurrentPhase.Should().Be(2);
        result.Value.ProfileComplete.Should().BeTrue();
        user.ServiceProviderProfile.CurrentPhase.Should().Be(2);
    }

    [Fact]
    public async Task Upsert_incomplete_profile_stays_phase_1()
    {
        var user = GivenUser(new ApplicationUser());

        // No Bio, no Industries/Languages/PricingModels, no portfolio → incomplete.
        var result = await _service.UpsertProfileAsync(user.Id.ToString(), new CreateOrUpdateServiceProviderProfileRequest
        {
            Skills = new() { "contracts" },
            ServiceCategories = new() { "Legal" },
            Headline = "Fractional CFO",
        });

        result.Value!.CurrentPhase.Should().Be(1);
        result.Value.ProfileComplete.Should().BeFalse();
    }

    [Fact]
    public async Task Upsert_does_not_downgrade_phase_when_incomplete()
    {
        // Already at Phase 2; a later incomplete save must not drop back to Phase 1.
        var user = GivenUser(new ApplicationUser
        {
            ServiceProviderProfile = new ServiceProviderProfile { CurrentPhase = 2 },
        });

        var result = await _service.UpsertProfileAsync(user.Id.ToString(), new CreateOrUpdateServiceProviderProfileRequest
        {
            Skills = new() { "contracts" },
            ServiceCategories = new() { "Legal" },
        });

        result.Value!.CurrentPhase.Should().Be(2);
    }

    [Fact]
    public async Task Upsert_stage1_only_request_is_backward_compatible()
    {
        // A pre-D-2 client sends only Skills + Categories: Stage-2 fields default
        // to empty/null, profile stays Phase 1, no error.
        var user = GivenUser(new ApplicationUser());

        var result = await _service.UpsertProfileAsync(user.Id.ToString(), new CreateOrUpdateServiceProviderProfileRequest
        {
            Skills = new() { "contracts" },
            ServiceCategories = new() { "Legal" },
        });

        result.Outcome.Should().Be(ServiceProviderOutcome.Ok);
        result.Value!.CurrentPhase.Should().Be(1);
        result.Value.Headline.Should().BeNull();
        result.Value.Industries.Should().BeEmpty();
        result.Value.Languages.Should().BeEmpty();
        result.Value.PricingModels.Should().BeEmpty();
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
            Headline = "Commercial contracts specialist",
            Bio = "I help early-stage teams prepare and negotiate commercial agreements.",
            Skills = new() { "contracts" },
            ServiceCategories = new() { ServiceCategory.Legal },
            Industries = new() { "SaaS" },
            Languages = new() { "English" },
            PricingModels = new() { PricingModel.FixedPrice },
            PortfolioItems = new() { new PortfolioItem { Title = "a", Description = "b" } },
        },
    };

    [Fact]
    public async Task Submit_auto_verifies_complete_pending_profile_and_stamps_one_time()
    {
        var user = GivenUser(CompleteProviderUser());

        var result = await _service.SubmitVerificationAsync(user.Id.ToString(),
            new SubmitVerificationRequest { ConfirmAccuracy = true });

        result.Outcome.Should().Be(ServiceProviderOutcome.Ok);
        result.Value!.VerificationStatus.Should().Be("Verified");
        result.Value.VerificationSubmittedAt.Should().NotBeNull();
        result.Value.VerifiedAt.Should().Be(result.Value.VerificationSubmittedAt);
        result.Value.IsVerified.Should().BeTrue();
        result.Value.TrustScore.Should().Be(0);
        user.ServiceProviderProfile.VerificationStatus.Should().Be(ServiceProviderVerificationStatus.Verified);
        user.ServiceProviderProfile.HasEnoughTrustData.Should().BeFalse();
    }

    [Fact]
    public async Task Submit_rejects_incomplete_profile_with_conflict()
    {
        var user = GivenUser(new ApplicationUser
        {
            ServiceProviderProfile = new ServiceProviderProfile
            {
                Headline = "Commercial contracts specialist",
                Bio = "I help early-stage teams prepare and negotiate commercial agreements.",
                Skills = new() { "contracts" },
                ServiceCategories = new() { ServiceCategory.Legal },
                Industries = new() { "SaaS" },
                // Languages is deliberately missing: the old three-field minimum
                // would have accepted this otherwise-complete profile.
                PricingModels = new() { PricingModel.FixedPrice },
                PortfolioItems = new() { new PortfolioItem { Title = "a", Description = "b" } },
            },
        });

        var result = await _service.SubmitVerificationAsync(user.Id.ToString(),
            new SubmitVerificationRequest { ConfirmAccuracy = true });

        result.Outcome.Should().Be(ServiceProviderOutcome.Conflict);
    }

    [Theory]
    [InlineData(ServiceProviderVerificationStatus.UnderReview)]
    [InlineData(ServiceProviderVerificationStatus.Verified)]
    public async Task Submit_prevents_duplicate_submission(ServiceProviderVerificationStatus status)
    {
        var user = CompleteProviderUser();
        user.ServiceProviderProfile.VerificationStatus = status;
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
    public async Task Submit_routes_rejected_resubmission_to_moderation_and_clears_reason()
    {
        var user = CompleteProviderUser();
        user.ServiceProviderProfile.VerificationStatus = ServiceProviderVerificationStatus.Rejected;
        user.ServiceProviderProfile.RejectionReason = "incomplete";
        GivenUser(user);

        var result = await _service.SubmitVerificationAsync(user.Id.ToString(),
            new SubmitVerificationRequest { ConfirmAccuracy = true });

        result.Outcome.Should().Be(ServiceProviderOutcome.Ok);
        result.Value!.VerificationStatus.Should().Be("UnderReview");
        result.Value.VerificationSubmittedAt.Should().NotBeNull();
        result.Value.VerifiedAt.Should().BeNull();
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
    public async Task Approve_verifies_starts_trust_neutral_and_notifies()
    {
        var user = GivenUser(UnderReviewUser());

        var result = await _service.ApproveVerificationAsync(user.Id.ToString(), "admin-1");

        result.Outcome.Should().Be(ServiceProviderOutcome.Ok);
        result.Value!.VerificationStatus.Should().Be("Verified");
        result.Value.IsVerified.Should().BeTrue();
        result.Value.VerifiedAt.Should().NotBeNull();
        // TrustScore is DERIVED: a freshly-verified provider has no signals yet, so the
        // score is the neutral "not enough data" state (0), never a hand-set baseline.
        result.Value.TrustScore.Should().Be(0);
        user.ServiceProviderProfile.TrustScore.Should().Be(0);
        user.ServiceProviderProfile.HasEnoughTrustData.Should().BeFalse();

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
    public async Task Reject_suspends_an_already_verified_provider()
    {
        var user = CompleteProviderUser();
        user.ServiceProviderProfile.VerificationStatus = ServiceProviderVerificationStatus.Verified;
        user.ServiceProviderProfile.VerifiedAt = DateTime.UtcNow.AddDays(-10);
        GivenUser(user);

        var result = await _service.RejectVerificationAsync(
            user.Id.ToString(), "admin-1", "moderation concern");

        result.Outcome.Should().Be(ServiceProviderOutcome.Ok);
        result.Value!.VerificationStatus.Should().Be("Rejected");
        result.Value.VerifiedAt.Should().BeNull();
        result.Value.RejectionReason.Should().Be("moderation concern");
    }

    [Fact]
    public async Task Reject_conflicts_when_pending()
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
