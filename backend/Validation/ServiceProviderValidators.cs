using FluentValidation;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;

namespace WebApp.Validation;

// D-1 Phase 3 — Service Provider Stage-1 validators. Auto-discovered by
// AddValidatorsFromAssemblyContaining (Program.cs) and run by the global
// ValidationFilter, so failures return the shared ApiResponse shape. Stateless
// and dependency-free: rules cover only what the request DTO itself carries.
// Cross-entity preconditions that need the persisted profile (e.g. "must have a
// portfolio item before submitting verification") are enforced in the Phase-4
// service layer, not here.
internal static class ServiceProviderLimits
{
    public const int MaxSkills = 30;
    public const int MaxSkillLength = 50;
    public const int MaxTitleLength = 150;
    public const int MaxDescriptionLength = 2000;
    public const int MaxUrlLength = 500;
    public const int MaxImagePathLength = 500;
    public const int MaxNoteLength = 1000;

    // Authoritative category names (Doc 05 / ServiceCategory enum). Matched
    // case-insensitively but membership-checked so numeric strings are rejected.
    public static readonly HashSet<string> AllowedCategories =
        new(Enum.GetNames<ServiceCategory>(), StringComparer.OrdinalIgnoreCase);

    public static readonly int MaxCategories = AllowedCategories.Count;

    public static bool IsAllowedCategory(string? v) =>
        !string.IsNullOrWhiteSpace(v) && AllowedCategories.Contains(v.Trim());

    public static bool BeValidHttpUrl(string? url) =>
        Uri.TryCreate(url, UriKind.Absolute, out var u) &&
        (u.Scheme == Uri.UriSchemeHttp || u.Scheme == Uri.UriSchemeHttps);

    public static bool NoBlankEntries(IEnumerable<string> items) =>
        items.All(v => !string.IsNullOrWhiteSpace(v));

    public static bool NoDuplicatesIgnoreCase(IEnumerable<string> items)
    {
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        return items.All(v => seen.Add((v ?? "").Trim()));
    }
}

public class CreateOrUpdateServiceProviderProfileRequestValidator
    : AbstractValidator<CreateOrUpdateServiceProviderProfileRequest>
{
    public CreateOrUpdateServiceProviderProfileRequestValidator()
    {
        RuleFor(x => x.Skills)
            .NotEmpty().WithMessage("Add at least one skill.");

        When(x => x.Skills is { Count: > 0 }, () =>
        {
            RuleFor(x => x.Skills)
                .Must(s => s.Any(v => !string.IsNullOrWhiteSpace(v)))
                    .WithMessage("Add at least one skill.")
                .Must(ServiceProviderLimits.NoBlankEntries)
                    .WithMessage("Skills cannot be blank.")
                .Must(s => s.Count <= ServiceProviderLimits.MaxSkills)
                    .WithMessage($"You can list at most {ServiceProviderLimits.MaxSkills} skills.")
                .Must(ServiceProviderLimits.NoDuplicatesIgnoreCase)
                    .WithMessage("Duplicate skills are not allowed.");

            RuleForEach(x => x.Skills)
                .MaximumLength(ServiceProviderLimits.MaxSkillLength)
                    .WithMessage($"Each skill must be {ServiceProviderLimits.MaxSkillLength} characters or fewer.");
        });

        RuleFor(x => x.ServiceCategories)
            .NotEmpty().WithMessage("Select at least one service category.");

        When(x => x.ServiceCategories is { Count: > 0 }, () =>
        {
            RuleFor(x => x.ServiceCategories)
                .Must(c => c.Count <= ServiceProviderLimits.MaxCategories)
                    .WithMessage($"You can select at most {ServiceProviderLimits.MaxCategories} categories.")
                .Must(ServiceProviderLimits.NoDuplicatesIgnoreCase)
                    .WithMessage("Duplicate categories are not allowed.");

            RuleForEach(x => x.ServiceCategories)
                .Must(ServiceProviderLimits.IsAllowedCategory)
                    .WithMessage("'{PropertyValue}' is not a recognised service category.");
        });
    }
}

public class AddPortfolioItemRequestValidator : AbstractValidator<AddPortfolioItemRequest>
{
    public AddPortfolioItemRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Portfolio item title is required.")
            .MaximumLength(ServiceProviderLimits.MaxTitleLength)
                .WithMessage($"Title must be {ServiceProviderLimits.MaxTitleLength} characters or fewer.");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Portfolio item description is required.")
            .MaximumLength(ServiceProviderLimits.MaxDescriptionLength)
                .WithMessage($"Description must be {ServiceProviderLimits.MaxDescriptionLength} characters or fewer.");

        RuleFor(x => x.Url)
            .MaximumLength(ServiceProviderLimits.MaxUrlLength)
                .WithMessage($"URL must be {ServiceProviderLimits.MaxUrlLength} characters or fewer.")
            .Must(ServiceProviderLimits.BeValidHttpUrl)
                .When(x => !string.IsNullOrWhiteSpace(x.Url))
                .WithMessage("Please provide a valid http(s) URL.");

        RuleFor(x => x.ImagePath)
            .MaximumLength(ServiceProviderLimits.MaxImagePathLength)
                .WithMessage($"Image path must be {ServiceProviderLimits.MaxImagePathLength} characters or fewer.");
    }
}

public class UpdatePortfolioItemRequestValidator : AbstractValidator<UpdatePortfolioItemRequest>
{
    public UpdatePortfolioItemRequestValidator()
    {
        RuleFor(x => x.Index)
            .GreaterThanOrEqualTo(0).WithMessage("Portfolio item index must be zero or greater.");

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Portfolio item title is required.")
            .MaximumLength(ServiceProviderLimits.MaxTitleLength)
                .WithMessage($"Title must be {ServiceProviderLimits.MaxTitleLength} characters or fewer.");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Portfolio item description is required.")
            .MaximumLength(ServiceProviderLimits.MaxDescriptionLength)
                .WithMessage($"Description must be {ServiceProviderLimits.MaxDescriptionLength} characters or fewer.");

        RuleFor(x => x.Url)
            .MaximumLength(ServiceProviderLimits.MaxUrlLength)
                .WithMessage($"URL must be {ServiceProviderLimits.MaxUrlLength} characters or fewer.")
            .Must(ServiceProviderLimits.BeValidHttpUrl)
                .When(x => !string.IsNullOrWhiteSpace(x.Url))
                .WithMessage("Please provide a valid http(s) URL.");

        RuleFor(x => x.ImagePath)
            .MaximumLength(ServiceProviderLimits.MaxImagePathLength)
                .WithMessage($"Image path must be {ServiceProviderLimits.MaxImagePathLength} characters or fewer.");
    }
}

public class RejectProviderVerificationRequestValidator : AbstractValidator<RejectProviderVerificationRequest>
{
    public RejectProviderVerificationRequestValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("A rejection reason is required.")
            .MaximumLength(ServiceProviderLimits.MaxNoteLength)
                .WithMessage($"Reason must be {ServiceProviderLimits.MaxNoteLength} characters or fewer.");
    }
}

public class SubmitVerificationRequestValidator : AbstractValidator<SubmitVerificationRequest>
{
    public SubmitVerificationRequestValidator()
    {
        RuleFor(x => x.ConfirmAccuracy)
            .Equal(true)
            .WithMessage("You must confirm the information is accurate before submitting for verification.");

        RuleFor(x => x.Note)
            .MaximumLength(ServiceProviderLimits.MaxNoteLength)
                .WithMessage($"Note must be {ServiceProviderLimits.MaxNoteLength} characters or fewer.");
    }
}
