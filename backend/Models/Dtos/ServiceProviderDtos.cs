using System.ComponentModel.DataAnnotations;
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

    /// <summary>Free-form industry tags (e.g. "Fintech", "SaaS"), normalized like Skills.</summary>
    public List<string> Industries { get; set; } = new();

    /// <summary>Free-form spoken languages (e.g. "English"), normalized like Skills.</summary>
    public List<string> Languages { get; set; } = new();

    /// <summary>Pricing-model names the provider works under (see PricingModel enum).</summary>
    public List<string> PricingModels { get; set; } = new();
}

/// <summary>Append one portfolio item (Stage 1 "Portfolio Submission").</summary>
public class AddPortfolioItemRequest
{
    [Required]
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public string? Url { get; set; }
    public string? ImagePath { get; set; }
}

/// <summary>
/// Replace one existing portfolio item, addressed by its position in the
/// provider's PortfolioItems list (items carry no stable id in Stage 1).
/// </summary>
public class UpdatePortfolioItemRequest
{
    /// <summary>Zero-based index of the item to replace.</summary>
    [Range(0, int.MaxValue)]
    public int Index { get; set; }

    [Required]
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public string? Url { get; set; }
    public string? ImagePath { get; set; }
}

/// <summary>
/// Submit the provider for verification, moving VerificationStatus
/// Pending → UnderReview. Carries the provider's accuracy attestation; the
/// review decision and TrustScore are produced server-side in a later phase.
/// </summary>
public class SubmitVerificationRequest
{
    /// <summary>Provider attests the submitted profile/portfolio is accurate.</summary>
    public bool ConfirmAccuracy { get; set; }

    /// <summary>Optional note to reviewers.</summary>
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
    /// <summary>Zero-based position within the provider's portfolio.</summary>
    public int Index { get; set; }
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public string? Url { get; set; }
    public string? ImagePath { get; set; }
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
    public List<string> Industries { get; set; } = new();
    public List<string> Languages { get; set; } = new();

    /// <summary>Pricing-model names (PricingModel enum), emitted as stable strings.</summary>
    public List<string> PricingModels { get; set; } = new();

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
/// One entry in the admin "pending verification" queue: a provider whose profile
/// is awaiting review (UnderReview). Carries the user's identity plus the full
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
        Index = index,
        Title = item.Title,
        Description = item.Description,
        Url = item.Url,
        ImagePath = item.ImagePath,
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
            Industries = new List<string>(profile.Industries),
            Languages = new List<string>(profile.Languages),
            PricingModels = profile.PricingModels.Select(p => p.ToString()).ToList(),
            CompletionPercent = completion,
            ProfileComplete = completion == 100,
            CreatedAt = profile.CreatedAt,
            UpdatedAt = profile.UpdatedAt,
        };
    }

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
