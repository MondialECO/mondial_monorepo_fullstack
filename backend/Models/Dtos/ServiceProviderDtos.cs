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

    public List<string> Skills { get; set; } = new();
    public List<string> ServiceCategories { get; set; } = new();
    public List<PortfolioItemResponse> PortfolioItems { get; set; } = new();

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

    public static ServiceProviderProfileResponse ToResponse(this ServiceProviderProfile profile) => new()
    {
        ProviderId = profile.ProviderId,
        CurrentPhase = profile.CurrentPhase,
        VerificationStatus = profile.VerificationStatus.ToString(),
        VerificationSubmittedAt = profile.VerificationSubmittedAt,
        VerifiedAt = profile.VerifiedAt,
        RejectionReason = profile.RejectionReason,
        TrustScore = profile.TrustScore,
        Skills = new List<string>(profile.Skills),
        ServiceCategories = profile.ServiceCategories.Select(c => c.ToString()).ToList(),
        PortfolioItems = profile.PortfolioItems.Select((p, i) => p.ToResponse(i)).ToList(),
        CreatedAt = profile.CreatedAt,
        UpdatedAt = profile.UpdatedAt,
    };

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
}
