using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using MongoDB.Bson;
using MongoDB.Bson.IO;
using WebApp.Models.DatabaseModels;

namespace WebApp.Models.Dtos;

// ============ SERVICE PROVIDER — STAGE 1 (Verification & Onboarding) ============
// DTO contracts only (D-1 Phase 2). These align 1:1 with the embedded
// ServiceProviderProfile / PortfolioItem entities from Phase 1. Server-controlled
// fields (VerificationStatus, TrustScore, timestamps) are NOT accepted on
// requests; they are surfaced on responses only. Enums cross the wire as strings
// for forward compatibility (see ServiceProviderMapping). Nothing here references
// marketplace, matching, proposal, workroom, milestone, escrow, or review concerns.

// ---------------- Requests ----------------

/// <summary>
/// Upsert the provider's Stage-1 professional information. ProviderId is taken
/// from the authenticated principal, never the body. Categories are validated
/// (FluentValidation) in a later phase against the authoritative ServiceCategory set.
/// </summary>
public class CreateOrUpdateServiceProviderProfileRequest
{
    /// <summary>Free-form skill tags (e.g. "contracts", "fundraising").</summary>
    public List<string> Skills { get; set; } = new();

    /// <summary>Authoritative service-category names (see ServiceCategory enum).</summary>
    public List<string> ServiceCategories { get; set; } = new();

    // ---- Stage 2: Provider Profile (D-2) ----

    /// <summary>Short public headline (Stage 2). Null when not yet set.</summary>
    public string? Headline { get; set; }

    /// <summary>Longer public bio (Stage 2). Null when not yet set.</summary>
    public string? Bio { get; set; }

    /// <summary>Sanitized Tiptap JSON. Bio remains the separate short summary.</summary>
    public ProfessionalOverviewRequest? ProfessionalOverview { get; set; }

    /// <summary>Free-form industry tags (e.g. "Fintech", "SaaS"), normalized like Skills.</summary>
    public List<string> Industries { get; set; } = new();

    /// <summary>Free-form spoken languages (e.g. "English"), normalized like Skills.</summary>
    public List<string> Languages { get; set; } = new();

    /// <summary>Pricing-model names the provider works under (see PricingModel enum).</summary>
    public List<string> PricingModels { get; set; } = new();
}

// ---------------- Profile Editor (four-step wizard) ----------------

/// <summary>One employment record as submitted by the editor. A blank or absent Id
/// means "create"; a known Id means "update that record".</summary>
public class ProviderExperienceRequest
{
    public string? Id { get; set; }
    public string JobTitle { get; set; } = "";
    public string CompanyName { get; set; } = "";

    /// <summary>Start month, ISO "YYYY-MM". Day precision is not accepted.</summary>
    public string StartDate { get; set; } = "";

    /// <summary>End month, ISO "YYYY-MM". Must be null when <see cref="IsCurrent"/>.</summary>
    public string? EndDate { get; set; }

    public bool IsCurrent { get; set; }
    public string? Description { get; set; }
}

public class ProviderExperienceResponse
{
    public string Id { get; set; } = "";
    public string JobTitle { get; set; } = "";
    public string CompanyName { get; set; } = "";
    public string StartDate { get; set; } = "";
    public string? EndDate { get; set; }
    public bool IsCurrent { get; set; }
    public string? Description { get; set; }
}

public class ProviderEducationRequest
{
    public string? Id { get; set; }
    public string Institution { get; set; } = "";
    public string Degree { get; set; } = "";
    public string? FieldOfStudy { get; set; }
    public int StartYear { get; set; }
    public int? EndYear { get; set; }
    public string? Description { get; set; }
}

public class ProviderEducationResponse
{
    public string Id { get; set; } = "";
    public string Institution { get; set; } = "";
    public string Degree { get; set; } = "";
    public string? FieldOfStudy { get; set; }
    public int StartYear { get; set; }
    public int? EndYear { get; set; }
    public string? Description { get; set; }
}

public class ProviderLanguageRequest
{
    public string? Id { get; set; }
    public string Language { get; set; } = "";

    /// <summary>LanguageProficiency name (Basic … NativeOrBilingual).</summary>
    public string Proficiency { get; set; } = "";
}

public class ProviderLanguageResponse
{
    public string Id { get; set; } = "";
    public string Language { get; set; } = "";
    public string Proficiency { get; set; } = "";
}

/// <summary>
/// Credential metadata as submitted by the provider. Status is deliberately absent —
/// it is server-controlled and can never be set from a request body.
/// </summary>
public class ProviderCredentialRequest
{
    public string? Id { get; set; }

    /// <summary>CredentialKind name (Certification | License | Degree | Award | Other).</summary>
    public string Kind { get; set; } = "";
    public string Title { get; set; } = "";
    public string? IssuingOrganization { get; set; }
    public DateTime? IssuedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string? CredentialNumber { get; set; }
}

/// <summary>
/// One credential as returned to its owning provider. Carries no StorageKey and no
/// internal reviewer notes — only the provider-facing remediation reason.
/// </summary>
public class ProviderCredentialResponse
{
    public string Id { get; set; } = "";
    public string Kind { get; set; } = "";
    public string Title { get; set; } = "";
    public string? IssuingOrganization { get; set; }
    public DateTime? IssuedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string? CredentialNumber { get; set; }

    /// <summary>Public URL of the uploaded document, owner-only. Null when none uploaded.</summary>
    public string? DocumentUrl { get; set; }
    public string? DocumentFileName { get; set; }
    public long? DocumentBytes { get; set; }

    /// <summary>Draft | PendingReview | Verified | Rejected | ResubmissionRequired | Expired.</summary>
    public string Status { get; set; } = "";
    public string? ReviewNote { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
}

/// <summary>
/// The editor's working copy. Persisted separately from the published profile, so
/// saving a step never changes what visitors see.
/// </summary>
public class ProfileDraftRequest
{
    /// <summary>Published version this draft was opened from (optimistic concurrency).</summary>
    public int BasedOnVersion { get; set; }

    /// <summary>Step the provider has reached (1–4), for lossless resume.</summary>
    public int LastStep { get; set; } = 1;

    public string? Headline { get; set; }
    public string? Bio { get; set; }
    public ProfessionalOverviewRequest? ProfessionalOverview { get; set; }
    public List<string> Skills { get; set; } = new();
    public List<string> ServiceCategories { get; set; } = new();
    public List<string> Industries { get; set; } = new();
    public List<string> PricingModels { get; set; } = new();
    public List<ProviderExperienceRequest> Experiences { get; set; } = new();
    public List<ProviderEducationRequest> Education { get; set; } = new();
    public List<ProviderLanguageRequest> LanguageProficiencies { get; set; } = new();
    public List<ProfessionalSocialLinkDto> SocialLinks { get; set; } = new();
}

public class ProfileDraftResponse
{
    /// <summary>False when the provider has no saved draft; the client then seeds one from the published profile.</summary>
    public bool HasDraft { get; set; }

    public int BasedOnVersion { get; set; }
    public int LastStep { get; set; } = 1;

    /// <summary>True when the published profile moved on since this draft was opened.</summary>
    public bool IsStale { get; set; }

    public string? Headline { get; set; }
    public string? Bio { get; set; }
    public ProfessionalOverviewResponse ProfessionalOverview { get; set; } = new();
    public List<string> Skills { get; set; } = new();
    public List<string> ServiceCategories { get; set; } = new();
    public List<string> Industries { get; set; } = new();
    public List<string> PricingModels { get; set; } = new();
    public List<ProviderExperienceResponse> Experiences { get; set; } = new();
    public List<ProviderEducationResponse> Education { get; set; } = new();
    public List<ProviderLanguageResponse> LanguageProficiencies { get; set; } = new();
    public List<ProfessionalSocialLinkDto> SocialLinks { get; set; } = new();
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Final submit of the four-step editor. Carries the whole draft so the server
/// validates and applies every step atomically rather than trusting per-step writes.
/// </summary>
public class SubmitProfileEditorRequest
{
    /// <summary>Published version the editor was opened from. A mismatch is a conflict.</summary>
    public int BasedOnVersion { get; set; }

    public ProfileDraftRequest Draft { get; set; } = new();
}

/// <summary>
/// Outcome of a successful submit. The tier, verification status and credential
/// review states here are all server-assigned; the client never proposes them.
/// </summary>
public class ProfileEditorSubmitResponse
{
    /// <summary>ProfileUpdated | ProfileSubmittedPendingReview | VerificationComplete.</summary>
    public string Outcome { get; set; } = "";

    public ServiceProviderProfileResponse Profile { get; set; } = new();

    /// <summary>Count of credentials moved to PendingReview by this submit.</summary>
    public int CredentialsPendingReview { get; set; }
}

/// <summary>
/// Append one portfolio item (Stage 1 "Portfolio Submission"). ImagePath is
/// deliberately absent: the image location is server-owned and is only ever set
/// by the portfolio media endpoints, which validate and re-encode the file.
/// </summary>
public class AddPortfolioItemRequest
{
    [Required]
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public string? Url { get; set; }
    public string? ImageCaption { get; set; }
}

/// <summary>
/// Replace one existing portfolio item, addressed by its stable server-owned id.
/// Positional addressing is not accepted: indexes shift when a concurrent delete
/// lands, which would edit the wrong item.
/// </summary>
public class UpdatePortfolioItemRequest
{
    /// <summary>Stable id of the item to replace (PortfolioItemResponse.Id).</summary>
    [Required]
    public string Id { get; set; } = "";

    [Required]
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public string? Url { get; set; }
    public string? ImageCaption { get; set; }
}

public class ProfessionalOverviewRequest
{
    public int SchemaVersion { get; set; } = 1;
    public JsonElement Document { get; set; } = JsonSerializer.Deserialize<JsonElement>("{\"type\":\"doc\",\"content\":[]}");
}

public class ProfessionalOverviewResponse
{
    public int SchemaVersion { get; set; } = 1;
    public JsonElement Document { get; set; } = JsonSerializer.Deserialize<JsonElement>("{\"type\":\"doc\",\"content\":[]}");
    public string PlainText { get; set; } = "";
}

public class ProviderMediaResponse
{
    public string Id { get; set; } = "";
    public string Url { get; set; } = "";
    public string ContentType { get; set; } = "";
    public int Width { get; set; }
    public int Height { get; set; }
    public long Bytes { get; set; }
    public DateTime UploadedAt { get; set; }
}

/// <summary>
/// Submit a complete provider profile. A Pending profile becomes Verified
/// immediately; a previously-Rejected profile enters UnderReview for controlled
/// moderation. Carries the provider's accuracy attestation.
/// </summary>
public class SubmitVerificationRequest
{
    /// <summary>Provider attests the submitted profile/portfolio is accurate.</summary>
    public bool ConfirmAccuracy { get; set; }

    /// <summary>Optional submission note.</summary>
    public string? Note { get; set; }
}

// ---------------- Responses ----------------

/// <summary>
/// Admin rejection of a provider's verification submission. Carries the reason
/// shown to the provider. Admin identity comes from the principal, never the body.
/// </summary>
public class RejectProviderVerificationRequest
{
    [Required]
    public string Reason { get; set; } = "";
}

/// <summary>One portfolio item as returned to clients.</summary>
public class PortfolioItemResponse
{
    public string Id { get; set; } = "";
    /// <summary>Zero-based position within the provider's portfolio.</summary>
    public int Index { get; set; }
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public string? Url { get; set; }
    public string? ImagePath { get; set; }
    public ProviderMediaResponse? PrimaryImage { get; set; }
    public string? ImageCaption { get; set; }
    public DateTime AddedAt { get; set; }
}

/// <summary>Full Stage-1 provider profile view.</summary>
public class ServiceProviderProfileResponse
{
    public string? ProviderId { get; set; }
    public int CurrentPhase { get; set; }

    /// <summary>Pending | UnderReview | Verified | Rejected.</summary>
    public string VerificationStatus { get; set; } = "";
    public DateTime? VerificationSubmittedAt { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public string? RejectionReason { get; set; }

    public double TrustScore { get; set; }

    /// <summary>False until at least one trust signal has data — the UI shows a neutral
    /// "building your trust score" state and ignores <see cref="TrustScore"/>.</summary>
    public bool HasEnoughTrustData { get; set; }

    public List<string> Skills { get; set; } = new();
    public List<string> ServiceCategories { get; set; } = new();
    public List<PortfolioItemResponse> PortfolioItems { get; set; } = new();

    // ---- Stage 2: Provider Profile (D-2) ----
    public string? Headline { get; set; }
    public string? Bio { get; set; }
    public ProviderMediaResponse? ProfileImage { get; set; }
    public ProviderMediaResponse? CoverImage { get; set; }
    public ProfessionalOverviewResponse ProfessionalOverview { get; set; } = new();
    public List<string> Industries { get; set; } = new();
    public List<string> Languages { get; set; } = new();

    /// <summary>Pricing-model names (PricingModel enum), emitted as stable strings.</summary>
    public List<string> PricingModels { get; set; } = new();

    // ---- Profile Editor (four-step wizard) ----
    public List<ProviderExperienceResponse> Experiences { get; set; } = new();
    public List<ProviderEducationResponse> Education { get; set; } = new();

    /// <summary>Languages with proficiency. The legacy <see cref="Languages"/> list stays
    /// populated in parallel for existing readers.</summary>
    public List<ProviderLanguageResponse> LanguageProficiencies { get; set; } = new();

    /// <summary>Owner-scoped. Empty for public projections.</summary>
    public List<ProviderCredentialResponse> Credentials { get; set; } = new();

    /// <summary>Optimistic-concurrency token to echo back on the next submit.</summary>
    public int ProfileVersion { get; set; }

    /// <summary>
    /// Stage-2 profile completeness (0–100), computed as a DTO-level projection.
    /// Never persisted. See ServiceProviderMapping for the locked weighting.
    /// </summary>
    public int CompletionPercent { get; set; }

    /// <summary>True when CompletionPercent is 100.</summary>
    public bool ProfileComplete { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Verification-focused view (Stage 1 outputs: Verified Provider Badge + Trust
/// Score). A projection of the profile for status polling.
/// </summary>
public class ServiceProviderVerificationResponse
{
    public string? ProviderId { get; set; }

    /// <summary>Pending | UnderReview | Verified | Rejected.</summary>
    public string VerificationStatus { get; set; } = "";

    /// <summary>True once VerificationStatus is Verified (the provider badge).</summary>
    public bool IsVerified { get; set; }

    public DateTime? VerificationSubmittedAt { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public string? RejectionReason { get; set; }

    public double TrustScore { get; set; }
}

/// <summary>
/// One entry in the admin moderation queue: a provider whose remediated profile
/// is awaiting re-review (UnderReview). Carries the user's identity plus the full
/// profile projection so the admin queue and detail drawer render from a single
/// fetch (headline, categories, skills, portfolio, industries, languages,
/// pricing models, trust score, and submittedAt all live on <see cref="Profile"/>).
/// </summary>
public class PendingProviderResponse
{
    public string UserId { get; set; } = "";
    public string? Name { get; set; }
    public string? Email { get; set; }
    public ServiceProviderProfileResponse Profile { get; set; } = new();
}

// ---------------- Module 1: Profile & Trust ----------------

/// <summary>One trust signal, projected for the UI breakdown. Value is meaningful only
/// when <see cref="HasData"/> is true; otherwise the UI shows a neutral state.</summary>
public class TrustSignalResponse
{
    /// <summary>Stable key: clientSatisfaction | onTimeDelivery | responseRate | repeatClientRate | skillTest.</summary>
    public string Key { get; set; } = "";
    public string Label { get; set; } = "";

    /// <summary>Weight as a percentage of the base (e.g. 40 for Client Satisfaction).</summary>
    public double Weight { get; set; }
    public bool HasData { get; set; }

    /// <summary>Normalized 0–100 value (only meaningful when HasData).</summary>
    public double Value { get; set; }
}

/// <summary>Derived TrustScore + breakdown. When <see cref="HasEnoughData"/> is false the
/// UI shows "building your trust score" and ignores <see cref="TrustScore"/>.</summary>
public class TrustBreakdownResponse
{
    public double TrustScore { get; set; }
    public bool HasEnoughData { get; set; }
    public List<TrustSignalResponse> Signals { get; set; } = new();
    public bool HasDisputes { get; set; }
    public double DisputePenalty { get; set; }
    public DateTime? LastRecalculatedAt { get; set; }

    /// <summary>
    /// The provider's platform tier (ApplicationUser.Tier_level), surfaced as a
    /// ranking-only badge. It affects match ordering (see SpMatchingService) and is
    /// independent of TrustScore. Not a pricing, commission, or payout signal.
    /// </summary>
    public int TierLevel { get; set; }
}

/// <summary>Per-category skills-test status for the provider's own categories.</summary>
public class SkillsTestCategoryStatus
{
    public string Category { get; set; } = "";
    public bool HasAttempt { get; set; }
    public int? LastScore { get; set; }
    public bool? LastPassed { get; set; }
    public DateTime? LastTakenAt { get; set; }
    public DateTime? NextEligibleRetestAt { get; set; }

    /// <summary>True when verified and outside any retest cooldown.</summary>
    public bool CanTakeNow { get; set; }
}

/// <summary>Skills-test overview: policy constants + per-category status.</summary>
public class SkillsTestStatusResponse
{
    public bool IsVerified { get; set; }
    public double PassThresholdPercent { get; set; }
    public int QuestionsPerAttempt { get; set; }
    public int CooldownDays { get; set; }
    public List<SkillsTestCategoryStatus> Categories { get; set; } = new();
}

/// <summary>One question as sent to the client — WITHOUT the correct answer.</summary>
public class SkillsTestQuestionResponse
{
    public string Id { get; set; } = "";
    public string Prompt { get; set; } = "";
    public List<string> Options { get; set; } = new();
}

/// <summary>A fresh attempt's question set for one category.</summary>
public class SkillsTestQuestionsResponse
{
    public string Category { get; set; } = "";
    public int QuestionCount { get; set; }
    public double PassThresholdPercent { get; set; }
    public List<SkillsTestQuestionResponse> Questions { get; set; } = new();
}

/// <summary>One answer in a submitted attempt.</summary>
public class SkillsTestAnswer
{
    public string QuestionId { get; set; } = "";

    /// <summary>Zero-based index of the option the provider chose.</summary>
    public int SelectedIndex { get; set; }
}

/// <summary>Submit a graded attempt for one category. The category and question ids echo
/// what the questions endpoint returned; grading and pass/fail happen server-side.</summary>
public class SubmitSkillsTestRequest
{
    [Required]
    public string Category { get; set; } = "";
    public List<SkillsTestAnswer> Answers { get; set; } = new();
}

/// <summary>Result of a graded attempt, including the recomputed trust breakdown.</summary>
public class SkillsTestResultResponse
{
    public string Category { get; set; } = "";
    public int Score { get; set; }
    public int CorrectCount { get; set; }
    public int TotalCount { get; set; }
    public bool Passed { get; set; }
    public DateTime TakenAt { get; set; }
    public DateTime NextEligibleRetestAt { get; set; }

    /// <summary>The provider's trust breakdown after this attempt is folded in.</summary>
    public TrustBreakdownResponse Trust { get; set; } = new();
}

// ---------------- Mapping (pure, entity → response) ----------------

/// <summary>
/// Pure entity→DTO projections. Kept as a static helper (the project maps inline
/// elsewhere, but the service/controller layers are out of scope for this phase),
/// so the contracts are exercisable and unit-testable on their own. Enums are
/// emitted as their names for a stable wire format.
/// </summary>
public static class ServiceProviderMapping
{
    public static PortfolioItemResponse ToResponse(this PortfolioItem item, int index) => new()
    {
        Id = item.Id,
        Index = index,
        Title = item.Title,
        Description = item.Description,
        Url = item.Url,
        ImagePath = item.ImagePath,
        PrimaryImage = item.PrimaryImage?.ToResponse(),
        ImageCaption = item.ImageCaption,
        AddedAt = item.AddedAt,
    };

    public static ServiceProviderProfileResponse ToResponse(this ServiceProviderProfile profile)
    {
        var completion = CompletionPercent(profile);
        return new()
        {
            ProviderId = profile.ProviderId,
            CurrentPhase = profile.CurrentPhase,
            VerificationStatus = profile.VerificationStatus.ToString(),
            VerificationSubmittedAt = profile.VerificationSubmittedAt,
            VerifiedAt = profile.VerifiedAt,
            RejectionReason = profile.RejectionReason,
            TrustScore = profile.TrustScore,
            HasEnoughTrustData = profile.HasEnoughTrustData,
            Skills = new List<string>(profile.Skills),
            ServiceCategories = profile.ServiceCategories.Select(c => c.ToString()).ToList(),
            PortfolioItems = profile.PortfolioItems.Select((p, i) => p.ToResponse(i)).ToList(),
            Headline = profile.Headline,
            Bio = profile.Bio,
            ProfileImage = profile.ProfileImage?.ToResponse(),
            CoverImage = profile.CoverImage?.ToResponse(),
            ProfessionalOverview = profile.ProfessionalOverview.ToResponse(),
            Industries = new List<string>(profile.Industries),
            Languages = new List<string>(profile.Languages),
            PricingModels = profile.PricingModels.Select(p => p.ToString()).ToList(),
            Experiences = profile.Experiences.Select(e => e.ToResponse()).ToList(),
            Education = profile.Education.Select(e => e.ToResponse()).ToList(),
            LanguageProficiencies = profile.LanguageProficiencies.Select(l => l.ToResponse()).ToList(),
            Credentials = profile.Credentials.Select(c => c.ToResponse()).ToList(),
            ProfileVersion = profile.ProfileVersion,
            CompletionPercent = completion,
            ProfileComplete = completion == 100,
            CreatedAt = profile.CreatedAt,
            UpdatedAt = profile.UpdatedAt,
        };
    }

    /// <summary>
    /// Public/client projection: the same profile with everything private stripped.
    /// Credentials carry no document URL, number or review note — only the fact that a
    /// credential of that title exists and whether review confirmed it.
    /// </summary>
    public static ServiceProviderProfileResponse ToPublicResponse(this ServiceProviderProfile profile)
    {
        var response = profile.ToResponse();
        response.RejectionReason = null;
        response.Credentials = profile.Credentials
            .Where(c => c.Status == CredentialStatus.Verified)
            .Select(c => new ProviderCredentialResponse
            {
                Id = c.Id,
                Kind = c.Kind.ToString(),
                Title = c.Title,
                IssuingOrganization = c.IssuingOrganization,
                IssuedAt = c.IssuedAt,
                ExpiresAt = c.ExpiresAt,
                Status = c.Status.ToString(),
            })
            .ToList();
        return response;
    }

    public static ProviderExperienceResponse ToResponse(this ProfessionalExperience item) => new()
    {
        Id = item.Id,
        JobTitle = item.JobTitle,
        CompanyName = item.CompanyName,
        StartDate = item.StartDate.ToString("yyyy-MM"),
        EndDate = item.IsCurrent ? null : item.EndDate?.ToString("yyyy-MM"),
        IsCurrent = item.IsCurrent,
        Description = item.Description,
    };

    public static ProviderEducationResponse ToResponse(this ProfessionalEducation item) => new()
    {
        Id = item.Id,
        Institution = item.Institution,
        Degree = item.Degree,
        FieldOfStudy = item.FieldOfStudy,
        StartYear = item.StartYear,
        EndYear = item.EndYear,
        Description = item.Description,
    };

    public static ProviderLanguageResponse ToResponse(this ProfessionalLanguage item) => new()
    {
        Id = item.Id,
        Language = item.Language,
        Proficiency = item.Proficiency.ToString(),
    };

    /// <summary>
    /// Owner-scoped credential projection. Emits PublicUrl only; StorageKey never
    /// leaves the server. Expiry is derived here so a lapsed credential reads as
    /// Expired without a background job having to rewrite stored state.
    /// </summary>
    public static ProviderCredentialResponse ToResponse(this ProviderCredential item) => new()
    {
        Id = item.Id,
        Kind = item.Kind.ToString(),
        Title = item.Title,
        IssuingOrganization = item.IssuingOrganization,
        IssuedAt = item.IssuedAt,
        ExpiresAt = item.ExpiresAt,
        CredentialNumber = item.CredentialNumber,
        DocumentUrl = item.Document?.PublicUrl,
        DocumentFileName = item.DocumentFileName,
        DocumentBytes = item.Document?.Bytes,
        Status = EffectiveStatus(item).ToString(),
        ReviewNote = item.ReviewNote,
        SubmittedAt = item.SubmittedAt,
        ReviewedAt = item.ReviewedAt,
    };

    /// <summary>
    /// A Verified credential whose expiry has passed reads as Expired. Any other
    /// status is reported as stored — an unreviewed credential does not "expire"
    /// into a reviewed state.
    /// </summary>
    public static CredentialStatus EffectiveStatus(ProviderCredential item) =>
        item.Status == CredentialStatus.Verified
        && item.ExpiresAt is { } expiry
        && expiry < DateTime.UtcNow
            ? CredentialStatus.Expired
            : item.Status;

    public static ProfileDraftResponse ToDraftResponse(this ProfessionalProfileDraft draft, int publishedVersion) => new()
    {
        HasDraft = true,
        BasedOnVersion = draft.BasedOnVersion,
        LastStep = draft.LastStep,
        IsStale = draft.BasedOnVersion != publishedVersion,
        Headline = draft.Headline,
        Bio = draft.Bio,
        ProfessionalOverview = draft.ProfessionalOverview.ToResponse(),
        Skills = new List<string>(draft.Skills),
        ServiceCategories = draft.ServiceCategories.Select(c => c.ToString()).ToList(),
        Industries = new List<string>(draft.Industries),
        PricingModels = draft.PricingModels.Select(p => p.ToString()).ToList(),
        Experiences = draft.Experiences.Select(e => e.ToResponse()).ToList(),
        Education = draft.Education.Select(e => e.ToResponse()).ToList(),
        LanguageProficiencies = draft.LanguageProficiencies.Select(l => l.ToResponse()).ToList(),
        SocialLinks = (draft.SocialLinks ?? new()).Select(s => new ProfessionalSocialLinkDto
        {
            Id = s.Id,
            Platform = s.Platform,
            Url = s.Url
        }).ToList(),
        UpdatedAt = draft.UpdatedAt,
    };

    /// <summary>
    /// Stage-2 profile completeness as a pure projection over the entity. Locked
    /// D-2 weighting (sums to 100): Headline 15, Bio 15, ≥1 Skill 15,
    /// ≥1 ServiceCategory 15, ≥1 Industry 15, ≥1 Language 10, ≥1 PricingModel 5,
    /// ≥1 PortfolioItem 10. Headline/Bio count only when non-blank. Not persisted.
    /// </summary>
    public static int CompletionPercent(ServiceProviderProfile profile)
    {
        var pct = 0;
        if (!string.IsNullOrWhiteSpace(profile.Headline)) pct += 15;
        if (!string.IsNullOrWhiteSpace(profile.Bio)) pct += 15;
        if (profile.Skills.Count > 0) pct += 15;
        if (profile.ServiceCategories.Count > 0) pct += 15;
        if (profile.Industries.Count > 0) pct += 15;
        if (profile.Languages.Count > 0) pct += 10;
        if (profile.PricingModels.Count > 0) pct += 5;
        if (profile.PortfolioItems.Count > 0) pct += 10;
        return pct;
    }

    public static ServiceProviderVerificationResponse ToVerificationResponse(this ServiceProviderProfile profile) => new()
    {
        ProviderId = profile.ProviderId,
        VerificationStatus = profile.VerificationStatus.ToString(),
        IsVerified = profile.VerificationStatus == ServiceProviderVerificationStatus.Verified,
        VerificationSubmittedAt = profile.VerificationSubmittedAt,
        VerifiedAt = profile.VerifiedAt,
        RejectionReason = profile.RejectionReason,
        TrustScore = profile.TrustScore,
    };

    public static ProviderMediaResponse ToResponse(this ProviderMediaAsset asset) => new()
    {
        Id = asset.Id,
        Url = asset.PublicUrl,
        ContentType = asset.ContentType,
        Width = asset.Width,
        Height = asset.Height,
        Bytes = asset.Bytes,
        UploadedAt = asset.UploadedAt,
    };

    public static ProfessionalOverviewResponse ToResponse(this ProfessionalOverviewContent? content)
    {
        content ??= new ProfessionalOverviewContent();
        var json = content.Document.ToJson(new JsonWriterSettings { OutputMode = JsonOutputMode.RelaxedExtendedJson });
        using var parsed = JsonDocument.Parse(json);
        return new ProfessionalOverviewResponse
        {
            SchemaVersion = content.SchemaVersion,
            Document = parsed.RootElement.Clone(),
            PlainText = content.PlainText,
        };
    }

    /// <summary>
    /// Project the derived TrustScore + per-signal breakdown. Weights are the locked
    /// percentages (Client Satisfaction 40, On-time 25, Response 15, Repeat 10, Skill 10);
    /// dispute penalty is surfaced separately since it is subtracted, not weighted in.
    /// </summary>
    public static TrustBreakdownResponse ToTrustBreakdownResponse(this ServiceProviderProfile profile)
    {
        var b = profile.TrustBreakdown;
        return new TrustBreakdownResponse
        {
            TrustScore = profile.TrustScore,
            HasEnoughData = profile.HasEnoughTrustData,
            HasDisputes = b.HasDisputes,
            DisputePenalty = b.DisputePenalty,
            LastRecalculatedAt = b.LastRecalculatedAt,
            Signals = new List<TrustSignalResponse>
            {
                TrustSignalOf("clientSatisfaction", "Client Satisfaction", 40, b.ClientSatisfaction),
                TrustSignalOf("onTimeDelivery", "On-time Delivery", 25, b.OnTimeDelivery),
                TrustSignalOf("responseRate", "Response Rate", 15, b.ResponseRate),
                TrustSignalOf("repeatClientRate", "Repeat Clients", 10, b.RepeatClientRate),
                TrustSignalOf("skillTest", "Skills Test", 10, b.SkillTest),
            },
        };
    }

    private static TrustSignalResponse TrustSignalOf(string key, string label, double weight, TrustSignal s) => new()
    {
        Key = key,
        Label = label,
        Weight = weight,
        HasData = s.HasData,
        Value = s.Value,
    };
}
