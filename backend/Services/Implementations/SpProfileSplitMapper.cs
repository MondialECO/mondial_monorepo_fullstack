using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Implementations;

/// <summary>
/// Pure projections between the legacy embedded ServiceProviderProfile and the
/// three split collections. This is the ONLY place the two shapes convert, so the
/// migration, the migrate-on-write path and the dual-read fallback can never
/// drift apart.
///
/// Tier rule (locked by the approved migration plan): a Verified provider maps to
/// Tier2 — the same tier verification approval assigns — and everyone else maps
/// to Tier1. ApplicationUser.Tier_level is never copied, and Tier3/Tier4 are
/// never fabricated.
/// </summary>
public static class SpProfileSplitMapper
{
    public static ProfessionalProfileRecord ToProfessionalRecord(ApplicationUser user)
    {
        var p = user.ServiceProviderProfile ?? new ServiceProviderProfile();
        return new ProfessionalProfileRecord
        {
            UserId = user.Id.ToString(),
            Headline = p.Headline ?? "",
            Bio = p.Bio ?? "",
            ProfessionalOverview = p.ProfessionalOverview ?? new ProfessionalOverviewContent(),
            ProfileImage = p.ProfileImage,
            CoverImage = p.CoverImage,
            Experiences = p.Experiences.Select(CloneExperience).ToList(),
            Education = p.Education.Select(CloneEducation).ToList(),
            Skills = new List<string>(p.Skills),
            LanguageProficiencies = p.LanguageProficiencies.Select(CloneLanguage).ToList(),
            Languages = new List<string>(p.Languages),
            Industries = new List<string>(p.Industries),
            SocialLinks = new List<ProfessionalSocialLink>(),
            AvailabilityDisplay = p.NewOrderAvailability,
            ProfileVersion = p.ProfileVersion,
            EditorDraft = p.EditorDraft,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt,
        };
    }

    public static ServiceProviderProfileRecord ToServiceProviderRecord(ApplicationUser user)
    {
        var p = user.ServiceProviderProfile ?? new ServiceProviderProfile();
        return new ServiceProviderProfileRecord
        {
            UserId = user.Id.ToString(),
            ProviderId = string.IsNullOrWhiteSpace(p.ProviderId) ? user.Id.ToString() : p.ProviderId,
            CurrentPhase = p.CurrentPhase,
            VerificationStatus = p.VerificationStatus,
            VerificationSubmittedAt = p.VerificationSubmittedAt,
            VerifiedAt = p.VerifiedAt,
            RejectionReason = p.RejectionReason,
            ProviderTier = DeriveTier(p.VerificationStatus),
            ServiceCategories = new List<ServiceCategory>(p.ServiceCategories),
            PricingModels = new List<PricingModel>(p.PricingModels),
            PortfolioItems = p.PortfolioItems.Select(ClonePortfolioItem).ToList(),
            TrustScore = p.TrustScore,
            TrustBreakdown = p.TrustBreakdown ?? new TrustScoreBreakdown(),
            HasEnoughTrustData = p.HasEnoughTrustData,
            SkillsTestAttempts = new List<SkillsTestAttempt>(p.SkillsTestAttempts),
            MaximumConcurrentOrders = p.MaximumConcurrentOrders,
            CurrentActiveOrders = p.CurrentActiveOrders,
            NewOrderAvailability = p.NewOrderAvailability,
            ManualApprovalWhenCapacityLow = p.ManualApprovalWhenCapacityLow,
            FinancialSettings = p.FinancialSettings ?? new ProviderFinancialSettings(),
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt,
        };
    }

    /// <summary>Verified providers hold the tier verification approval grants (Tier2);
    /// everyone else starts at the Tier1 default. Never reads Tier_level.</summary>
    public static ProviderTier DeriveTier(ServiceProviderVerificationStatus status) =>
        status == ServiceProviderVerificationStatus.Verified ? ProviderTier.Tier2 : ProviderTier.Tier1;

    public static List<UserCredentialRecord> ToCredentialRecords(ApplicationUser user)
    {
        var p = user.ServiceProviderProfile ?? new ServiceProviderProfile();
        return p.Credentials.Select(c => new UserCredentialRecord
        {
            Id = c.Id,
            UserId = user.Id.ToString(),
            Kind = c.Kind,
            Title = c.Title,
            IssuingOrganization = c.IssuingOrganization,
            IssuedAt = c.IssuedAt,
            ExpiresAt = c.ExpiresAt,
            CredentialNumber = c.CredentialNumber,
            Document = c.Document,
            DocumentFileName = c.DocumentFileName,
            Status = c.Status,
            ReviewNote = c.ReviewNote,
            ApplicableRoles = new List<CredentialApplicableRole> { CredentialApplicableRole.ServiceProvider },
            SubmittedAt = c.SubmittedAt,
            ReviewedAt = c.ReviewedAt,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt,
        }).ToList();
    }

    /// <summary>
    /// Rebuilds the embedded-shaped view from the split records so every existing
    /// DTO projection (ToResponse, CompletionPercent, eligibility gates) keeps
    /// working unchanged. This is a READ-ONLY view — persisting it anywhere would
    /// resurrect the embedded write path, which is frozen after cutover.
    /// </summary>
    public static ServiceProviderProfile ToCompositeView(
        ProfessionalProfileRecord professional,
        ServiceProviderProfileRecord sp,
        IReadOnlyList<UserCredentialRecord> credentials)
    {
        return new ServiceProviderProfile
        {
            ProviderId = sp.ProviderId,
            CurrentPhase = sp.CurrentPhase,
            VerificationStatus = sp.VerificationStatus,
            VerificationSubmittedAt = sp.VerificationSubmittedAt,
            VerifiedAt = sp.VerifiedAt,
            RejectionReason = sp.RejectionReason,
            TrustScore = sp.TrustScore,
            Skills = new List<string>(professional.Skills),
            ServiceCategories = new List<ServiceCategory>(sp.ServiceCategories),
            PortfolioItems = sp.PortfolioItems.Select(ClonePortfolioItem).ToList(),
            Headline = NullIfBlank(professional.Headline),
            Bio = NullIfBlank(professional.Bio),
            ProfileImage = professional.ProfileImage,
            CoverImage = professional.CoverImage,
            ProfessionalOverview = professional.ProfessionalOverview,
            Industries = new List<string>(professional.Industries),
            Languages = new List<string>(professional.Languages),
            PricingModels = new List<PricingModel>(sp.PricingModels),
            Experiences = professional.Experiences.Select(CloneExperience).ToList(),
            Education = professional.Education.Select(CloneEducation).ToList(),
            LanguageProficiencies = professional.LanguageProficiencies.Select(CloneLanguage).ToList(),
            Credentials = credentials.Select(ToEmbeddedCredential).ToList(),
            ProfileVersion = professional.ProfileVersion,
            EditorDraft = professional.EditorDraft,
            TrustBreakdown = sp.TrustBreakdown,
            HasEnoughTrustData = sp.HasEnoughTrustData,
            SkillsTestAttempts = new List<SkillsTestAttempt>(sp.SkillsTestAttempts),
            MaximumConcurrentOrders = sp.MaximumConcurrentOrders,
            CurrentActiveOrders = sp.CurrentActiveOrders,
            NewOrderAvailability = sp.NewOrderAvailability,
            ManualApprovalWhenCapacityLow = sp.ManualApprovalWhenCapacityLow,
            FinancialSettings = sp.FinancialSettings,
            CreatedAt = sp.CreatedAt,
            UpdatedAt = MaxUtc(sp.UpdatedAt, professional.UpdatedAt),
        };
    }

    public static ProviderCredential ToEmbeddedCredential(UserCredentialRecord c) => new()
    {
        Id = c.Id,
        Kind = c.Kind,
        Title = c.Title,
        IssuingOrganization = c.IssuingOrganization,
        IssuedAt = c.IssuedAt,
        ExpiresAt = c.ExpiresAt,
        CredentialNumber = c.CredentialNumber,
        Document = c.Document,
        DocumentFileName = c.DocumentFileName,
        Status = c.Status,
        ReviewNote = c.ReviewNote,
        SubmittedAt = c.SubmittedAt,
        ReviewedAt = c.ReviewedAt,
        CreatedAt = c.CreatedAt,
        UpdatedAt = c.UpdatedAt,
    };

    private static PortfolioItem ClonePortfolioItem(PortfolioItem item) => new()
    {
        Id = item.Id,
        Title = item.Title,
        Description = item.Description,
        Url = item.Url,
        ImagePath = item.ImagePath,
        PrimaryImage = item.PrimaryImage,
        ImageCaption = item.ImageCaption,
        AddedAt = item.AddedAt,
    };

    private static ProfessionalExperience CloneExperience(ProfessionalExperience e) => new()
    {
        Id = e.Id,
        JobTitle = e.JobTitle,
        CompanyName = e.CompanyName,
        StartDate = e.StartDate,
        EndDate = e.EndDate,
        IsCurrent = e.IsCurrent,
        Description = e.Description,
        CreatedAt = e.CreatedAt,
        UpdatedAt = e.UpdatedAt,
    };

    private static ProfessionalEducation CloneEducation(ProfessionalEducation e) => new()
    {
        Id = e.Id,
        Institution = e.Institution,
        Degree = e.Degree,
        FieldOfStudy = e.FieldOfStudy,
        StartYear = e.StartYear,
        EndYear = e.EndYear,
        Description = e.Description,
        CreatedAt = e.CreatedAt,
        UpdatedAt = e.UpdatedAt,
    };

    private static ProfessionalLanguage CloneLanguage(ProfessionalLanguage l) => new()
    {
        Id = l.Id,
        Language = l.Language,
        Proficiency = l.Proficiency,
    };

    private static string? NullIfBlank(string? value) => string.IsNullOrWhiteSpace(value) ? null : value;

    private static DateTime MaxUtc(DateTime a, DateTime b) => a >= b ? a : b;
}
