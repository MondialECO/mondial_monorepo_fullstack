using FluentValidation.TestHelper;
using WebApp.Models.Dtos;
using WebApp.Validation;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// D-1 Phase 3 — Stage-1 Service Provider validator coverage: positive, negative,
/// duplicate, and length-limit cases. Stateless request validation only.
/// </summary>
public class ServiceProviderValidatorTests
{
    private readonly CreateOrUpdateServiceProviderProfileRequestValidator _profile = new();
    private readonly AddPortfolioItemRequestValidator _add = new();
    private readonly UpdatePortfolioItemRequestValidator _update = new();
    private readonly SubmitVerificationRequestValidator _submit = new();
    private readonly RejectProviderVerificationRequestValidator _reject = new();

    // ---------------- Profile ----------------

    [Fact]
    public void Profile_passes_with_one_skill_and_one_category()
    {
        var result = _profile.TestValidate(new CreateOrUpdateServiceProviderProfileRequest
        {
            Skills = new() { "contracts" },
            ServiceCategories = new() { "Legal" },
        });
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Profile_requires_at_least_one_skill_and_category()
    {
        var result = _profile.TestValidate(new CreateOrUpdateServiceProviderProfileRequest());
        result.ShouldHaveValidationErrorFor(x => x.Skills);
        result.ShouldHaveValidationErrorFor(x => x.ServiceCategories);
    }

    [Fact]
    public void Profile_rejects_all_whitespace_skill_as_missing()
    {
        var result = _profile.TestValidate(new CreateOrUpdateServiceProviderProfileRequest
        {
            Skills = new() { "   " },
            ServiceCategories = new() { "Legal" },
        });
        result.ShouldHaveValidationErrorFor(x => x.Skills);
    }

    [Fact]
    public void Profile_rejects_duplicate_skills_case_insensitively()
    {
        var result = _profile.TestValidate(new CreateOrUpdateServiceProviderProfileRequest
        {
            Skills = new() { "Legal", "legal" },
            ServiceCategories = new() { "Legal" },
        });
        result.ShouldHaveValidationErrorFor(x => x.Skills);
    }

    [Fact]
    public void Profile_rejects_duplicate_categories()
    {
        var result = _profile.TestValidate(new CreateOrUpdateServiceProviderProfileRequest
        {
            Skills = new() { "contracts" },
            ServiceCategories = new() { "Finance", "finance" },
        });
        result.ShouldHaveValidationErrorFor(x => x.ServiceCategories);
    }

    [Fact]
    public void Profile_rejects_unknown_category()
    {
        var result = _profile.TestValidate(new CreateOrUpdateServiceProviderProfileRequest
        {
            Skills = new() { "contracts" },
            ServiceCategories = new() { "Astrology" },
        });
        result.ShouldHaveValidationErrorFor("ServiceCategories[0]");
    }

    [Fact]
    public void Profile_rejects_numeric_category_string()
    {
        var result = _profile.TestValidate(new CreateOrUpdateServiceProviderProfileRequest
        {
            Skills = new() { "contracts" },
            ServiceCategories = new() { "3" },
        });
        result.ShouldHaveValidationErrorFor("ServiceCategories[0]");
    }

    [Fact]
    public void Profile_accepts_all_authoritative_categories()
    {
        var all = new List<string>
        {
            "Development", "Design", "Marketing", "Legal", "Finance", "Accounting",
            "Operations", "Strategy", "DueDiligence", "FundraisingSupport",
            "AiAutomation", "HrRecruitment", "Other",
        };
        var result = _profile.TestValidate(new CreateOrUpdateServiceProviderProfileRequest
        {
            Skills = new() { "contracts" },
            ServiceCategories = all,
        });
        result.ShouldNotHaveValidationErrorFor(x => x.ServiceCategories);
    }

    [Fact]
    public void Profile_rejects_too_many_skills()
    {
        var result = _profile.TestValidate(new CreateOrUpdateServiceProviderProfileRequest
        {
            Skills = Enumerable.Range(0, 31).Select(i => $"skill{i}").ToList(),
            ServiceCategories = new() { "Legal" },
        });
        result.ShouldHaveValidationErrorFor(x => x.Skills);
    }

    [Fact]
    public void Profile_rejects_overlong_skill()
    {
        var result = _profile.TestValidate(new CreateOrUpdateServiceProviderProfileRequest
        {
            Skills = new() { new string('x', 51) },
            ServiceCategories = new() { "Legal" },
        });
        result.ShouldHaveValidationErrorFor("Skills[0]");
    }

    // ---------------- Add portfolio ----------------

    [Fact]
    public void AddPortfolio_passes_with_title_and_description()
    {
        var result = _add.TestValidate(new AddPortfolioItemRequest
        {
            Title = "Series A docs",
            Description = "Led the round",
        });
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void AddPortfolio_requires_title_and_description()
    {
        var result = _add.TestValidate(new AddPortfolioItemRequest());
        result.ShouldHaveValidationErrorFor(x => x.Title);
        result.ShouldHaveValidationErrorFor(x => x.Description);
    }

    [Fact]
    public void AddPortfolio_accepts_valid_url_and_rejects_invalid()
    {
        _add.TestValidate(new AddPortfolioItemRequest { Title = "t", Description = "d", Url = "https://x.com" })
            .ShouldNotHaveValidationErrorFor(x => x.Url);

        _add.TestValidate(new AddPortfolioItemRequest { Title = "t", Description = "d", Url = "not a url" })
            .ShouldHaveValidationErrorFor(x => x.Url);

        // ftp scheme is rejected — only http(s) allowed.
        _add.TestValidate(new AddPortfolioItemRequest { Title = "t", Description = "d", Url = "ftp://x.com" })
            .ShouldHaveValidationErrorFor(x => x.Url);
    }

    [Fact]
    public void AddPortfolio_rejects_overlong_title()
    {
        var result = _add.TestValidate(new AddPortfolioItemRequest
        {
            Title = new string('x', 151),
            Description = "d",
        });
        result.ShouldHaveValidationErrorFor(x => x.Title);
    }

    // ---------------- Update portfolio ----------------

    [Fact]
    public void UpdatePortfolio_passes_with_valid_index_and_fields()
    {
        var result = _update.TestValidate(new UpdatePortfolioItemRequest
        {
            Index = 0,
            Title = "t",
            Description = "d",
        });
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void UpdatePortfolio_rejects_negative_index()
    {
        var result = _update.TestValidate(new UpdatePortfolioItemRequest
        {
            Index = -1,
            Title = "t",
            Description = "d",
        });
        result.ShouldHaveValidationErrorFor(x => x.Index);
    }

    // ---------------- Submit verification ----------------

    [Fact]
    public void Submit_requires_confirm_accuracy_true()
    {
        _submit.TestValidate(new SubmitVerificationRequest { ConfirmAccuracy = false })
            .ShouldHaveValidationErrorFor(x => x.ConfirmAccuracy);

        _submit.TestValidate(new SubmitVerificationRequest { ConfirmAccuracy = true })
            .ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Submit_rejects_overlong_note()
    {
        var result = _submit.TestValidate(new SubmitVerificationRequest
        {
            ConfirmAccuracy = true,
            Note = new string('x', 1001),
        });
        result.ShouldHaveValidationErrorFor(x => x.Note);
    }

    // ---------------- Reject verification (admin) ----------------

    [Fact]
    public void Reject_requires_reason()
    {
        _reject.TestValidate(new RejectProviderVerificationRequest { Reason = "" })
            .ShouldHaveValidationErrorFor(x => x.Reason);

        _reject.TestValidate(new RejectProviderVerificationRequest { Reason = "incomplete portfolio" })
            .ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Reject_rejects_overlong_reason()
    {
        _reject.TestValidate(new RejectProviderVerificationRequest { Reason = new string('x', 1001) })
            .ShouldHaveValidationErrorFor(x => x.Reason);
    }
}
