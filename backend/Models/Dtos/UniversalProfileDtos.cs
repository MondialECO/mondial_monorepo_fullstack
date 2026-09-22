using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;
using WebApp.Models.DatabaseModels;

namespace WebApp.Models.Dtos;

public class UniversalProfileResponseDto
{
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Headline { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;

    public ProfessionalOverviewContentDto? ProfessionalOverview { get; set; }

    public MediaAssetDto? ProfileImage { get; set; }
    public MediaAssetDto? CoverImage { get; set; }

    public List<ProfessionalExperienceDto> Experiences { get; set; } = new();
    public List<ProfessionalEducationDto> Education { get; set; } = new();
    public List<ProfileSkillDto> Skills { get; set; } = new();
    public ProfileVentureContextDto? VentureContext { get; set; }
    public List<ProfessionalLanguageDto> LanguageProficiencies { get; set; } = new();
    public List<string> Languages { get; set; } = new();
    public List<string> Industries { get; set; } = new();
    public List<ProfessionalSocialLinkDto> SocialLinks { get; set; } = new();

    public bool? AvailabilityDisplay { get; set; }
    public List<string> Roles { get; set; } = new();
    public int CompletionPercentage { get; set; }
    public ProfileCompletenessDto? Completeness { get; set; }
    public HumainXQuickStartStatusDto? QuickStart { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class ProfessionalOverviewContentDto
{
    public int SchemaVersion { get; set; } = 1;
    public JsonElement? Document { get; set; }
    public string PlainText { get; set; } = string.Empty;
}

public class UpdateUniversalProfileRequestDto
{
    public string? Slug { get; set; }
    public string? Headline { get; set; }
    public string? Bio { get; set; }
    public string? Country { get; set; }
    public string? City { get; set; }

    public JsonElement? ProfessionalOverview { get; set; }

    public MediaAssetDto? ProfileImage { get; set; }
    public MediaAssetDto? CoverImage { get; set; }

    public List<ProfessionalExperienceDto>? Experiences { get; set; }
    public List<ProfessionalEducationDto>? Education { get; set; }
    public List<ProfileSkillDto>? Skills { get; set; }
    public ProfileVentureContextDto? VentureContext { get; set; }
    public List<ProfessionalLanguageDto>? LanguageProficiencies { get; set; }
    public List<string>? Industries { get; set; }
    public List<ProfessionalSocialLinkDto>? SocialLinks { get; set; }
    public bool? AvailabilityDisplay { get; set; }
}

public class MediaAssetDto
{
    public string? PublicUrl { get; set; }
    public string? Url => PublicUrl;
    public string? StoragePath { get; set; }
    public string? FileType { get; set; }
    public long? FileSizeBytes { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }
}

public class ProfessionalExperienceDto
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string JobTitle { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string? StartDate { get; set; }
    public string? EndDate { get; set; }
    public bool IsCurrent { get; set; }
    public string? Description { get; set; }
    public string? ExperienceType { get; set; }
    public List<string> SkillsUsed { get; set; } = new();
}

public class ProfileCompletenessDto
{
    public int ProfileCompletion { get; set; }
    public bool Phase4Ready { get; set; }
    public List<string> MissingForPhase4 { get; set; } = new();
}

public class ProfessionalEducationDto
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Institution { get; set; } = string.Empty;
    public string Degree { get; set; } = string.Empty;
    public string? FieldOfStudy { get; set; }
    public int StartYear { get; set; }
    public int? EndYear { get; set; }
    public string? Description { get; set; }
}

[JsonConverter(typeof(ProfileSkillDtoJsonConverter))]
public class ProfileSkillDto
{
    public string Name { get; set; } = string.Empty;
    public string? Level { get; set; }
    public string? Source { get; set; }
    public object? Verification { get; set; }

    public static implicit operator ProfileSkillDto(string name) => new() { Name = name };
    public override string ToString() => Name;
}

public class ProfileSkillDtoJsonConverter : JsonConverter<ProfileSkillDto>
{
    public override ProfileSkillDto? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.String)
        {
            return new ProfileSkillDto { Name = reader.GetString() ?? string.Empty };
        }
        if (reader.TokenType == JsonTokenType.StartObject)
        {
            using var doc = JsonDocument.ParseValue(ref reader);
            var root = doc.RootElement;
            var req = new ProfileSkillDto();
            if (root.TryGetProperty("name", out var n) || root.TryGetProperty("Name", out n))
                req.Name = n.GetString() ?? string.Empty;
            if (root.TryGetProperty("level", out var l) || root.TryGetProperty("Level", out l))
                req.Level = l.ValueKind == JsonValueKind.Null ? null : l.GetString();
            if (root.TryGetProperty("source", out var s) || root.TryGetProperty("Source", out s))
                req.Source = s.ValueKind == JsonValueKind.Null ? null : s.GetString();
            if (root.TryGetProperty("verification", out var v) || root.TryGetProperty("Verification", out v))
                req.Verification = v.ValueKind == JsonValueKind.Null ? null : v.Clone();
            return req;
        }
        return null;
    }

    public override void Write(Utf8JsonWriter writer, ProfileSkillDto value, JsonSerializerOptions options)
    {
        writer.WriteStartObject();
        writer.WriteString("name", value.Name);
        if (value.Level is not null) writer.WriteString("level", value.Level);
        else writer.WriteNull("level");
        if (value.Source is not null) writer.WriteString("source", value.Source);
        else writer.WriteNull("source");
        if (value.Verification is not null)
        {
            writer.WritePropertyName("verification");
            JsonSerializer.Serialize(writer, value.Verification, options);
        }
        else writer.WriteNull("verification");
        writer.WriteEndObject();
    }
}

public class ProfileVentureContextDto
{
    public string? CurrentSituation { get; set; }
    public string? WeeklyAvailability { get; set; }
    public string? Region { get; set; }
    public string? PreviousEntrepreneurialExperience { get; set; }
    public string? LearningPreference { get; set; }
    public string? DelegationPreference { get; set; }
}

public class ProfessionalLanguageDto
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Language { get; set; } = string.Empty;
    public string? Proficiency { get; set; }
}

public class ProfessionalSocialLinkDto
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Platform { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
}

public class PublicUserProfileResponseDto : UniversalProfileResponseDto
{
    public ServiceProviderPublicExtensionDto? ServiceProviderExtension { get; set; }
    public CreatorPublicExtensionDto? CreatorExtension { get; set; }
    public EntrepreneurPublicExtensionDto? EntrepreneurExtension { get; set; }
    public InvestorPublicExtensionDto? InvestorExtension { get; set; }
}

public class ServiceProviderPublicExtensionDto
{
    public string VerificationStatus { get; set; } = "Pending";
    public int ProviderTier { get; set; } = 1;
    public double TrustScore { get; set; }
    public bool HasEnoughTrustData { get; set; }
    public List<PublicServiceListingDto> PublishedServices { get; set; } = new();
    public List<PublicPortfolioItemDto> PortfolioItems { get; set; } = new();
    public List<PublicVerifiedCredentialDto> VerifiedCredentials { get; set; } = new();
    public PublicRatingSummaryDto RatingSummary { get; set; } = new();
}

public class PublicServiceListingDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? PricingModel { get; set; }
    public decimal StartingPrice { get; set; }
    public string Currency { get; set; } = "EUR";
    public string? PrimaryImageUrl { get; set; }
    public string Status { get; set; } = "Published";
}

public class PublicPortfolioItemDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Url { get; set; }
    public string? ImagePath { get; set; }
    public MediaAssetDto? PrimaryImage { get; set; }
    public string? ImageCaption { get; set; }
}

public class PublicVerifiedCredentialDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? IssuingOrganization { get; set; }
    public string Status { get; set; } = "Verified";
    public DateTime? IssuedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public class PublicRatingSummaryDto
{
    public double Rating { get; set; }
    public int ReviewCount { get; set; }
    public bool HasEnoughData { get; set; }
}

public class CreatorPublicExtensionDto
{
    public int PublishedProjectsCount { get; set; }
    public List<string> FocusCategories { get; set; } = new();
}

public class EntrepreneurPublicExtensionDto
{
    public List<PublicCompanyAssociationDto> Companies { get; set; } = new();
}

public class PublicCompanyAssociationDto
{
    public string CompanyId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Logo { get; set; } = string.Empty;
    public string Industry { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}

public class InvestorPublicExtensionDto
{
    public string InvestmentGeography { get; set; } = string.Empty;
    public List<string> TargetStages { get; set; } = new();
    public string Thesis { get; set; } = string.Empty;
}

public class HumainXQuickStartStatusDto
{
    public int Version { get; set; } = 1;
    public DateTime? Step1ConfirmedAt { get; set; }
    public DateTime? Step2ConfirmedAt { get; set; }
    public DateTime? Step3ConfirmedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public bool Completed { get; set; }
    public int? NextRequiredStep { get; set; }
}

public class QuickStartStep1RequestDto
{
    public string? Region { get; set; }
    public string? CurrentSituation { get; set; }
    public string? WeeklyAvailability { get; set; }
}

public class QuickStartStep2RequestDto
{
    public List<ProfileSkillDto>? Skills { get; set; }
}

public class QuickStartStep3RequestDto
{
    public string? PreviousEntrepreneurialExperience { get; set; }
    public string? LearningPreference { get; set; }
    public string? DelegationPreference { get; set; }
    public string? ProgressPreference { get; set; }
}

