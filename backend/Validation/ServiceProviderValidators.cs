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
    public const int MaxImageCaptionLength = 300;

    /// <summary>
    /// Portfolio items are embedded in the provider document, so an unbounded
    /// list would grow the document towards the 16 MB BSON ceiling.
    /// </summary>
    public const int MaxPortfolioItems = 20;
    public const int MaxNoteLength = 1000;

    // ---- Stage 2: Provider Profile (D-2 Phase 3) ----
    public const int MaxHeadlineLength = 150;
    public const int MaxBioLength = 3000;
    public const int MaxIndustries = 20;
    public const int MaxIndustryLength = 100;
    public const int MaxLanguages = 20;
    public const int MaxLanguageLength = 50;

    // ---- Profile Editor (four-step wizard) ----
    // The editor enforces a tighter 70-character headline than the legacy upsert
    // path above. MaxHeadlineLength stays at 150 deliberately: lowering it would
    // retroactively invalidate stored headlines and break existing API consumers.
    public const int MaxEditorHeadlineLength = 70;
    public const int MaxEditorSkills = 15;
    public const int MaxExperiences = 20;
    public const int MaxEducationRecords = 10;
    public const int MaxJobTitleLength = 150;
    public const int MaxCompanyNameLength = 150;
    public const int MaxExperienceDescriptionLength = 1000;
    public const int MaxInstitutionLength = 150;
    public const int MaxDegreeLength = 150;
    public const int MaxFieldOfStudyLength = 150;
    public const int MaxCredentials = 20;
    public const int MaxCredentialTitleLength = 150;
    public const int MaxIssuerLength = 150;
    public const int MaxCredentialNumberLength = 100;
    public const int MinEducationYear = 1900;

    public static readonly HashSet<string> AllowedProficiencies =
        new(Enum.GetNames<LanguageProficiency>(), StringComparer.OrdinalIgnoreCase);

    public static bool IsAllowedProficiency(string? v) =>
        !string.IsNullOrWhiteSpace(v) && AllowedProficiencies.Contains(v.Trim());

    public static readonly HashSet<string> AllowedCredentialKinds =
        new(Enum.GetNames<CredentialKind>(), StringComparer.OrdinalIgnoreCase);

    public static bool IsAllowedCredentialKind(string? v) =>
        !string.IsNullOrWhiteSpace(v) && AllowedCredentialKinds.Contains(v.Trim());

    /// <summary>Parses the editor's ISO "YYYY-MM" month format. Day precision is rejected.</summary>
    public static bool TryParseMonth(string? value, out DateTime month)
    {
        month = default;
        return !string.IsNullOrWhiteSpace(value)
            && DateTime.TryParseExact(
                value.Trim(),
                "yyyy-MM",
                System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.AssumeUniversal | System.Globalization.DateTimeStyles.AdjustToUniversal,
                out month);
    }

    public static bool BeValidMonth(string? value) => TryParseMonth(value, out _);

    // Authoritative category names (Doc 05 / ServiceCategory enum). Matched
    // case-insensitively but membership-checked so numeric strings are rejected.
    public static readonly HashSet<string> AllowedCategories =
        new(Enum.GetNames<ServiceCategory>(), StringComparer.OrdinalIgnoreCase);

    public static readonly int MaxCategories = AllowedCategories.Count;

    public static bool IsAllowedCategory(string? v) =>
        !string.IsNullOrWhiteSpace(v) && AllowedCategories.Contains(v.Trim());

    // Authoritative pricing-model names (locked PricingModel enum). Same
    // membership-check approach as categories, so numeric/unknown strings fail.
    public static readonly HashSet<string> AllowedPricingModels =
        new(Enum.GetNames<PricingModel>(), StringComparer.OrdinalIgnoreCase);

    public static readonly int MaxPricingModels = AllowedPricingModels.Count;

    public static bool IsAllowedPricingModel(string? v) =>
        !string.IsNullOrWhiteSpace(v) && AllowedPricingModels.Contains(v.Trim());

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

        // ---- Stage 2: Provider Profile (D-2 Phase 3) ----
        // All Stage-2 fields are optional: rules apply only when supplied, so a
        // Stage-1 request (Skills + Categories only) still validates unchanged.

        RuleFor(x => x.Headline)
            .MaximumLength(ServiceProviderLimits.MaxHeadlineLength)
                .WithMessage($"Headline must be {ServiceProviderLimits.MaxHeadlineLength} characters or fewer.")
            .When(x => !string.IsNullOrWhiteSpace(x.Headline));

        RuleFor(x => x.Bio)
            .MaximumLength(ServiceProviderLimits.MaxBioLength)
                .WithMessage($"Bio must be {ServiceProviderLimits.MaxBioLength} characters or fewer.")
            .When(x => !string.IsNullOrWhiteSpace(x.Bio));

        When(x => x.Industries is { Count: > 0 }, () =>
        {
            RuleFor(x => x.Industries)
                .Must(i => i.Count <= ServiceProviderLimits.MaxIndustries)
                    .WithMessage($"You can list at most {ServiceProviderLimits.MaxIndustries} industries.")
                .Must(ServiceProviderLimits.NoBlankEntries)
                    .WithMessage("Industries cannot be blank.")
                .Must(ServiceProviderLimits.NoDuplicatesIgnoreCase)
                    .WithMessage("Duplicate industries are not allowed.");

            RuleForEach(x => x.Industries)
                .MaximumLength(ServiceProviderLimits.MaxIndustryLength)
                    .WithMessage($"Each industry must be {ServiceProviderLimits.MaxIndustryLength} characters or fewer.");
        });

        When(x => x.Languages is { Count: > 0 }, () =>
        {
            RuleFor(x => x.Languages)
                .Must(l => l.Count <= ServiceProviderLimits.MaxLanguages)
                    .WithMessage($"You can list at most {ServiceProviderLimits.MaxLanguages} languages.")
                .Must(ServiceProviderLimits.NoBlankEntries)
                    .WithMessage("Languages cannot be blank.")
                .Must(ServiceProviderLimits.NoDuplicatesIgnoreCase)
                    .WithMessage("Duplicate languages are not allowed.");

            RuleForEach(x => x.Languages)
                .MaximumLength(ServiceProviderLimits.MaxLanguageLength)
                    .WithMessage($"Each language must be {ServiceProviderLimits.MaxLanguageLength} characters or fewer.");
        });

        When(x => x.PricingModels is { Count: > 0 }, () =>
        {
            RuleFor(x => x.PricingModels)
                .Must(p => p.Count <= ServiceProviderLimits.MaxPricingModels)
                    .WithMessage($"You can select at most {ServiceProviderLimits.MaxPricingModels} pricing models.")
                .Must(ServiceProviderLimits.NoDuplicatesIgnoreCase)
                    .WithMessage("Duplicate pricing models are not allowed.");

            RuleForEach(x => x.PricingModels)
                .Must(ServiceProviderLimits.IsAllowedPricingModel)
                    .WithMessage("'{PropertyValue}' is not a recognised pricing model.");
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

        RuleFor(x => x.ImageCaption)
            .MaximumLength(ServiceProviderLimits.MaxImageCaptionLength)
                .WithMessage($"Image description must be {ServiceProviderLimits.MaxImageCaptionLength} characters or fewer.");
    }
}

public class UpdatePortfolioItemRequestValidator : AbstractValidator<UpdatePortfolioItemRequest>
{
    public UpdatePortfolioItemRequestValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Portfolio item id is required.");

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

        RuleFor(x => x.ImageCaption)
            .MaximumLength(ServiceProviderLimits.MaxImageCaptionLength)
                .WithMessage($"Image description must be {ServiceProviderLimits.MaxImageCaptionLength} characters or fewer.");
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

// ---------------- Profile Editor (four-step wizard) ----------------

public class ProviderExperienceRequestValidator : AbstractValidator<ProviderExperienceRequest>
{
    public ProviderExperienceRequestValidator()
    {
        RuleFor(x => x.JobTitle)
            .NotEmpty().WithMessage("Job title is required.")
            .MaximumLength(ServiceProviderLimits.MaxJobTitleLength)
                .WithMessage($"Job title must be {ServiceProviderLimits.MaxJobTitleLength} characters or fewer.");

        RuleFor(x => x.CompanyName)
            .NotEmpty().WithMessage("Company name is required.")
            .MaximumLength(ServiceProviderLimits.MaxCompanyNameLength)
                .WithMessage($"Company name must be {ServiceProviderLimits.MaxCompanyNameLength} characters or fewer.");

        RuleFor(x => x.StartDate)
            .NotEmpty().WithMessage("Start date is required.")
            .Must(ServiceProviderLimits.BeValidMonth)
                .WithMessage("Start date must be a valid month in YYYY-MM format.");

        // A current role must not carry an end date; a past role must.
        When(x => x.IsCurrent, () =>
        {
            RuleFor(x => x.EndDate)
                .Must(string.IsNullOrWhiteSpace)
                    .WithMessage("A current role cannot have an end date.");
        });

        When(x => !x.IsCurrent, () =>
        {
            RuleFor(x => x.EndDate)
                .NotEmpty().WithMessage("End date is required unless this is your current role.")
                .Must(ServiceProviderLimits.BeValidMonth)
                    .WithMessage("End date must be a valid month in YYYY-MM format.");
        });

        RuleFor(x => x)
            .Must(BeChronological)
                .WithMessage("End date cannot be before the start date.")
                .WithName(nameof(ProviderExperienceRequest.EndDate));

        RuleFor(x => x.Description)
            .MaximumLength(ServiceProviderLimits.MaxExperienceDescriptionLength)
                .WithMessage($"Description must be {ServiceProviderLimits.MaxExperienceDescriptionLength} characters or fewer.");
    }

    private static bool BeChronological(ProviderExperienceRequest request)
    {
        if (request.IsCurrent) return true;
        if (!ServiceProviderLimits.TryParseMonth(request.StartDate, out var start)) return true;
        if (!ServiceProviderLimits.TryParseMonth(request.EndDate, out var end)) return true;
        return end >= start;
    }
}

public class ProviderEducationRequestValidator : AbstractValidator<ProviderEducationRequest>
{
    public ProviderEducationRequestValidator()
    {
        RuleFor(x => x.Institution)
            .NotEmpty().WithMessage("School or university is required.")
            .MaximumLength(ServiceProviderLimits.MaxInstitutionLength)
                .WithMessage($"School or university must be {ServiceProviderLimits.MaxInstitutionLength} characters or fewer.");

        RuleFor(x => x.Degree)
            .NotEmpty().WithMessage("Degree is required.")
            .MaximumLength(ServiceProviderLimits.MaxDegreeLength)
                .WithMessage($"Degree must be {ServiceProviderLimits.MaxDegreeLength} characters or fewer.");

        RuleFor(x => x.FieldOfStudy)
            .MaximumLength(ServiceProviderLimits.MaxFieldOfStudyLength)
                .WithMessage($"Field of study must be {ServiceProviderLimits.MaxFieldOfStudyLength} characters or fewer.");

        // Allow a modest future window so an expected graduation year is accepted.
        RuleFor(x => x.StartYear)
            .InclusiveBetween(ServiceProviderLimits.MinEducationYear, DateTime.UtcNow.Year + 10)
                .WithMessage($"Start year must be between {ServiceProviderLimits.MinEducationYear} and {DateTime.UtcNow.Year + 10}.");

        When(x => x.EndYear.HasValue, () =>
        {
            RuleFor(x => x.EndYear!.Value)
                .InclusiveBetween(ServiceProviderLimits.MinEducationYear, DateTime.UtcNow.Year + 10)
                    .WithMessage($"End year must be between {ServiceProviderLimits.MinEducationYear} and {DateTime.UtcNow.Year + 10}.");

            RuleFor(x => x)
                .Must(x => x.EndYear!.Value >= x.StartYear)
                    .WithMessage("End year cannot be before the start year.")
                    .WithName(nameof(ProviderEducationRequest.EndYear));
        });

        RuleFor(x => x.Description)
            .MaximumLength(ServiceProviderLimits.MaxExperienceDescriptionLength)
                .WithMessage($"Description must be {ServiceProviderLimits.MaxExperienceDescriptionLength} characters or fewer.");
    }
}

public class ProviderLanguageRequestValidator : AbstractValidator<ProviderLanguageRequest>
{
    public ProviderLanguageRequestValidator()
    {
        RuleFor(x => x.Language)
            .NotEmpty().WithMessage("Language is required.")
            .MaximumLength(ServiceProviderLimits.MaxLanguageLength)
                .WithMessage($"Each language must be {ServiceProviderLimits.MaxLanguageLength} characters or fewer.");

        RuleFor(x => x.Proficiency)
            .Must(ServiceProviderLimits.IsAllowedProficiency)
                .WithMessage("Select a valid proficiency level.");
    }
}

public class ProviderCredentialRequestValidator : AbstractValidator<ProviderCredentialRequest>
{
    public ProviderCredentialRequestValidator()
    {
        RuleFor(x => x.Kind)
            .Must(ServiceProviderLimits.IsAllowedCredentialKind)
                .WithMessage("Select a valid credential type.");

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Credential title is required.")
            .MaximumLength(ServiceProviderLimits.MaxCredentialTitleLength)
                .WithMessage($"Credential title must be {ServiceProviderLimits.MaxCredentialTitleLength} characters or fewer.");

        RuleFor(x => x.IssuingOrganization)
            .MaximumLength(ServiceProviderLimits.MaxIssuerLength)
                .WithMessage($"Issuing organisation must be {ServiceProviderLimits.MaxIssuerLength} characters or fewer.");

        RuleFor(x => x.CredentialNumber)
            .MaximumLength(ServiceProviderLimits.MaxCredentialNumberLength)
                .WithMessage($"Credential number must be {ServiceProviderLimits.MaxCredentialNumberLength} characters or fewer.");

        When(x => x.IssuedAt.HasValue && x.ExpiresAt.HasValue, () =>
        {
            RuleFor(x => x)
                .Must(x => x.ExpiresAt!.Value >= x.IssuedAt!.Value)
                    .WithMessage("Expiry date cannot be before the issue date.")
                    .WithName(nameof(ProviderCredentialRequest.ExpiresAt));
        });
    }
}

/// <summary>
/// Validates the whole four-step draft in one pass. Applied to both the per-step
/// draft save and the final submit, so a draft can never hold data that the submit
/// would then reject.
/// </summary>
public class ProfileDraftRequestValidator : AbstractValidator<ProfileDraftRequest>
{
    public ProfileDraftRequestValidator()
    {
        RuleFor(x => x.LastStep)
            .InclusiveBetween(1, 4).WithMessage("Step must be between 1 and 4.");

        RuleFor(x => x.BasedOnVersion)
            .GreaterThanOrEqualTo(0).WithMessage("Profile version is invalid.");

        // ---- Step 1 ----
        RuleFor(x => x.Headline)
            .MaximumLength(ServiceProviderLimits.MaxEditorHeadlineLength)
                .WithMessage($"Professional headline must be {ServiceProviderLimits.MaxEditorHeadlineLength} characters or fewer.");

        RuleFor(x => x.Bio)
            .MaximumLength(ServiceProviderLimits.MaxBioLength)
                .WithMessage($"Short bio must be {ServiceProviderLimits.MaxBioLength} characters or fewer.");

        When(x => x.ServiceCategories is { Count: > 0 }, () =>
        {
            RuleFor(x => x.ServiceCategories)
                .Must(c => c.Count <= ServiceProviderLimits.MaxCategories)
                    .WithMessage($"You can select at most {ServiceProviderLimits.MaxCategories} categories.")
                .Must(ServiceProviderLimits.NoDuplicatesIgnoreCase)
                    .WithMessage("Duplicate categories are not allowed.")
                .Must(c => c.All(ServiceProviderLimits.IsAllowedCategory))
                    .WithMessage("One or more service categories are not recognised.");
        });

        // ---- Step 3: skills ----
        When(x => x.Skills is { Count: > 0 }, () =>
        {
            RuleFor(x => x.Skills)
                .Must(s => s.Count <= ServiceProviderLimits.MaxEditorSkills)
                    .WithMessage($"You can list at most {ServiceProviderLimits.MaxEditorSkills} skills.")
                .Must(ServiceProviderLimits.NoBlankEntries)
                    .WithMessage("Skills cannot be blank.")
                .Must(ServiceProviderLimits.NoDuplicatesIgnoreCase)
                    .WithMessage("Duplicate skills are not allowed.");

            RuleForEach(x => x.Skills)
                .MaximumLength(ServiceProviderLimits.MaxSkillLength)
                    .WithMessage($"Each skill must be {ServiceProviderLimits.MaxSkillLength} characters or fewer.");
        });

        When(x => x.Industries is { Count: > 0 }, () =>
        {
            RuleFor(x => x.Industries)
                .Must(i => i.Count <= ServiceProviderLimits.MaxIndustries)
                    .WithMessage($"You can list at most {ServiceProviderLimits.MaxIndustries} industries.")
                .Must(ServiceProviderLimits.NoBlankEntries)
                    .WithMessage("Industries cannot be blank.")
                .Must(ServiceProviderLimits.NoDuplicatesIgnoreCase)
                    .WithMessage("Duplicate industries are not allowed.");

            RuleForEach(x => x.Industries)
                .MaximumLength(ServiceProviderLimits.MaxIndustryLength)
                    .WithMessage($"Each industry must be {ServiceProviderLimits.MaxIndustryLength} characters or fewer.");
        });

        When(x => x.PricingModels is { Count: > 0 }, () =>
        {
            RuleFor(x => x.PricingModels)
                .Must(p => p.Count <= ServiceProviderLimits.MaxPricingModels)
                    .WithMessage($"You can select at most {ServiceProviderLimits.MaxPricingModels} pricing models.")
                .Must(ServiceProviderLimits.NoDuplicatesIgnoreCase)
                    .WithMessage("Duplicate pricing models are not allowed.")
                .Must(p => p.All(ServiceProviderLimits.IsAllowedPricingModel))
                    .WithMessage("One or more pricing models are not recognised.");
        });

        // ---- Step 2 ----
        RuleFor(x => x.Experiences)
            .Must(e => e.Count <= ServiceProviderLimits.MaxExperiences)
                .WithMessage($"You can list at most {ServiceProviderLimits.MaxExperiences} experience records.");

        RuleForEach(x => x.Experiences).SetValidator(new ProviderExperienceRequestValidator());

        RuleFor(x => x.Education)
            .Must(e => e.Count <= ServiceProviderLimits.MaxEducationRecords)
                .WithMessage($"You can list at most {ServiceProviderLimits.MaxEducationRecords} education records.");

        RuleForEach(x => x.Education).SetValidator(new ProviderEducationRequestValidator());

        // ---- Step 3: languages ----
        RuleFor(x => x.LanguageProficiencies)
            .Must(l => l.Count <= ServiceProviderLimits.MaxLanguages)
                .WithMessage($"You can list at most {ServiceProviderLimits.MaxLanguages} languages.")
            .Must(l => ServiceProviderLimits.NoDuplicatesIgnoreCase(l.Select(v => v.Language ?? "")))
                .WithMessage("Duplicate languages are not allowed.");

        RuleForEach(x => x.LanguageProficiencies).SetValidator(new ProviderLanguageRequestValidator());
    }
}

public class SubmitProfileEditorRequestValidator : AbstractValidator<SubmitProfileEditorRequest>
{
    public SubmitProfileEditorRequestValidator()
    {
        RuleFor(x => x.BasedOnVersion)
            .GreaterThanOrEqualTo(0).WithMessage("Profile version is invalid.");

        RuleFor(x => x.Draft)
            .NotNull().WithMessage("Profile data is required.");

        // Final submit enforces the Step-1 and Step-3 minimums that a partial draft
        // is allowed to omit while the provider is still working through the wizard.
        When(x => x.Draft is not null, () =>
        {
            RuleFor(x => x.Draft).SetValidator(new ProfileDraftRequestValidator());

            RuleFor(x => x.Draft.Headline)
                .NotEmpty().WithMessage("Professional headline is required.");

            RuleFor(x => x.Draft.ServiceCategories)
                .NotEmpty().WithMessage("Select your primary expertise category.");

            RuleFor(x => x.Draft.Skills)
                .NotEmpty().WithMessage("Add at least one skill.");
        });
    }
}
