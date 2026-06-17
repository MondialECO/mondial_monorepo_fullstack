using Microsoft.AspNetCore.Identity;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Audit;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations;

/// <summary>
/// D-1 Phase 4 — Service Provider Stage-1 service. Reads/writes the embedded
/// ServiceProviderProfile via UserManager (no separate collection, no repository).
/// Owner-scoped: the userId is the authenticated principal, never a request field.
/// Holds all Stage-1 decision logic (normalization, portfolio indexing,
/// completeness gate, Pending→UnderReview transition); TrustScore scoring and
/// admin approve/reject are intentionally out of scope (Phase 5).
/// </summary>
public class ServiceProviderService : IServiceProviderService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IAuditLogger _audit;
    private readonly INotificationService _notifications;
    private readonly ILogger<ServiceProviderService> _logger;

    /// <summary>Neutral 0–100 baseline seeded on approval (D-1 locked decision).
    /// Reputation-driven recomputation is deferred to Stage 9.</summary>
    public const double TrustScoreBaseline = 50.0;

    public ServiceProviderService(
        UserManager<ApplicationUser> userManager,
        IAuditLogger audit,
        INotificationService notifications,
        ILogger<ServiceProviderService> logger)
    {
        _userManager = userManager;
        _audit = audit;
        _notifications = notifications;
        _logger = logger;
    }

    public async Task<ServiceProviderResult<ServiceProviderProfileResponse>> GetProfileAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return ServiceProviderResult<ServiceProviderProfileResponse>.NotFound("Service provider profile not found.");

        var profile = EnsureProfile(user);
        return ServiceProviderResult<ServiceProviderProfileResponse>.Ok(profile.ToResponse());
    }

    public async Task<ServiceProviderResult<ServiceProviderProfileResponse>> UpsertProfileAsync(
        string userId, CreateOrUpdateServiceProviderProfileRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return ServiceProviderResult<ServiceProviderProfileResponse>.NotFound("Service provider profile not found.");

        var profile = EnsureProfile(user);
        profile.ProviderId ??= user.Id.ToString();
        profile.Skills = NormalizeStrings(request.Skills);
        profile.ServiceCategories = NormalizeCategories(request.ServiceCategories);

        // ---- Stage 2: Provider Profile (D-2 Phase 4) ----
        profile.Headline = NullIfBlank(request.Headline);
        profile.Bio = NullIfBlank(request.Bio);
        profile.Industries = NormalizeStrings(request.Industries);
        profile.Languages = NormalizeStrings(request.Languages);
        profile.PricingModels = NormalizePricingModels(request.PricingModels);

        MaybeAdvancePhase(profile);
        Touch(profile);

        await _userManager.UpdateAsync(user);
        return ServiceProviderResult<ServiceProviderProfileResponse>.Ok(profile.ToResponse(), "Profile saved.");
    }

    public async Task<ServiceProviderResult<ServiceProviderProfileResponse>> AddPortfolioItemAsync(
        string userId, AddPortfolioItemRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return ServiceProviderResult<ServiceProviderProfileResponse>.NotFound("Service provider profile not found.");

        var profile = EnsureProfile(user);
        profile.PortfolioItems.Add(new PortfolioItem
        {
            Title = request.Title?.Trim() ?? "",
            Description = request.Description?.Trim(),
            Url = NullIfBlank(request.Url),
            ImagePath = NullIfBlank(request.ImagePath),
            AddedAt = DateTime.UtcNow,
        });
        Touch(profile);

        await _userManager.UpdateAsync(user);
        return ServiceProviderResult<ServiceProviderProfileResponse>.Ok(profile.ToResponse(), "Portfolio item added.");
    }

    public async Task<ServiceProviderResult<ServiceProviderProfileResponse>> UpdatePortfolioItemAsync(
        string userId, UpdatePortfolioItemRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return ServiceProviderResult<ServiceProviderProfileResponse>.NotFound("Service provider profile not found.");

        var profile = EnsureProfile(user);
        if (request.Index < 0 || request.Index >= profile.PortfolioItems.Count)
            return ServiceProviderResult<ServiceProviderProfileResponse>.NotFound("Portfolio item not found.");

        // Mutate in place so AddedAt is preserved across the update.
        var item = profile.PortfolioItems[request.Index];
        item.Title = request.Title?.Trim() ?? "";
        item.Description = request.Description?.Trim();
        item.Url = NullIfBlank(request.Url);
        item.ImagePath = NullIfBlank(request.ImagePath);
        Touch(profile);

        await _userManager.UpdateAsync(user);
        return ServiceProviderResult<ServiceProviderProfileResponse>.Ok(profile.ToResponse(), "Portfolio item updated.");
    }

    public async Task<ServiceProviderResult<ServiceProviderProfileResponse>> DeletePortfolioItemAsync(
        string userId, int index)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return ServiceProviderResult<ServiceProviderProfileResponse>.NotFound("Service provider profile not found.");

        var profile = EnsureProfile(user);
        if (index < 0 || index >= profile.PortfolioItems.Count)
            return ServiceProviderResult<ServiceProviderProfileResponse>.NotFound("Portfolio item not found.");

        profile.PortfolioItems.RemoveAt(index);
        Touch(profile);

        await _userManager.UpdateAsync(user);
        return ServiceProviderResult<ServiceProviderProfileResponse>.Ok(profile.ToResponse(), "Portfolio item deleted.");
    }

    public async Task<ServiceProviderResult<ServiceProviderVerificationResponse>> SubmitVerificationAsync(
        string userId, SubmitVerificationRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return ServiceProviderResult<ServiceProviderVerificationResponse>.NotFound("Service provider profile not found.");

        var profile = EnsureProfile(user);

        // Duplicate-submission guard: only a Pending or previously-Rejected
        // profile can be (re)submitted (Rejected→UnderReview resubmission is
        // allowed per the D-1 locked decision). UnderReview/Verified cannot.
        if (profile.VerificationStatus is not (ServiceProviderVerificationStatus.Pending
            or ServiceProviderVerificationStatus.Rejected))
            return ServiceProviderResult<ServiceProviderVerificationResponse>.Conflict(
                "Verification has already been submitted.");

        // Profile-completeness gate (enforced against the persisted profile, which
        // a stateless request validator cannot see).
        if (!HasAtLeastOneSkill(profile) || profile.ServiceCategories.Count == 0 || profile.PortfolioItems.Count == 0)
            return ServiceProviderResult<ServiceProviderVerificationResponse>.Conflict(
                "Add at least one skill, one category, and one portfolio item before submitting for verification.");

        profile.VerificationStatus = ServiceProviderVerificationStatus.UnderReview;
        profile.VerificationSubmittedAt = DateTime.UtcNow;
        profile.RejectionReason = null; // clear any prior rejection on resubmission
        Touch(profile);

        await _userManager.UpdateAsync(user);

        _audit.Record("ServiceProviderVerification.Submit", userId, success: true, new
        {
            skills = profile.Skills.Count,
            categories = profile.ServiceCategories.Count,
            portfolioCount = profile.PortfolioItems.Count,
        });

        return ServiceProviderResult<ServiceProviderVerificationResponse>.Ok(
            profile.ToVerificationResponse(), "Submitted for verification.");
    }

    public Task<ServiceProviderResult<List<PendingProviderResponse>>> GetPendingVerificationsAsync()
    {
        // The profile is embedded on ApplicationUser, so we materialize and filter
        // in memory: robust against LINQ-to-Mongo translation of the nested enum,
        // and adequate at the current user scale. A server-side filtered index is
        // a later optimization, not needed for this surface.
        var pending = _userManager.Users.ToList()
            .Where(u => u.ServiceProviderProfile is
            {
                VerificationStatus: ServiceProviderVerificationStatus.UnderReview
            })
            .OrderBy(u => u.ServiceProviderProfile!.VerificationSubmittedAt)
            .Select(u => new PendingProviderResponse
            {
                UserId = u.Id.ToString(),
                Name = u.Name,
                Email = u.Email,
                Profile = u.ServiceProviderProfile!.ToResponse(),
            })
            .ToList();

        return Task.FromResult(
            ServiceProviderResult<List<PendingProviderResponse>>.Ok(pending, "OK"));
    }

    public async Task<ServiceProviderResult<ServiceProviderVerificationResponse>> ApproveVerificationAsync(
        string providerUserId, string adminUserId)
    {
        var user = await _userManager.FindByIdAsync(providerUserId);
        if (user is null)
            return ServiceProviderResult<ServiceProviderVerificationResponse>.NotFound("Service provider profile not found.");

        var profile = EnsureProfile(user);
        if (profile.VerificationStatus != ServiceProviderVerificationStatus.UnderReview)
            return ServiceProviderResult<ServiceProviderVerificationResponse>.Conflict(
                "Verification is not awaiting review.");

        profile.VerificationStatus = ServiceProviderVerificationStatus.Verified;
        profile.VerifiedAt = DateTime.UtcNow;
        profile.RejectionReason = null;
        profile.TrustScore = TrustScoreBaseline;
        Touch(profile);

        await _userManager.UpdateAsync(user);

        _audit.Record("ServiceProviderVerification.Approve", adminUserId, success: true, new
        {
            providerUserId,
            trustScore = profile.TrustScore,
        });

        await NotifyAsync(user.Id,
            "Provider verification approved",
            "Your service provider profile has been verified. Your Verified Provider Badge is now active.");

        return ServiceProviderResult<ServiceProviderVerificationResponse>.Ok(
            profile.ToVerificationResponse(), "Provider verified.");
    }

    public async Task<ServiceProviderResult<ServiceProviderVerificationResponse>> RejectVerificationAsync(
        string providerUserId, string adminUserId, string reason)
    {
        var user = await _userManager.FindByIdAsync(providerUserId);
        if (user is null)
            return ServiceProviderResult<ServiceProviderVerificationResponse>.NotFound("Service provider profile not found.");

        var profile = EnsureProfile(user);
        if (profile.VerificationStatus != ServiceProviderVerificationStatus.UnderReview)
            return ServiceProviderResult<ServiceProviderVerificationResponse>.Conflict(
                "Verification is not awaiting review.");

        profile.VerificationStatus = ServiceProviderVerificationStatus.Rejected;
        profile.RejectionReason = reason;
        profile.VerifiedAt = null;
        Touch(profile);

        await _userManager.UpdateAsync(user);

        _audit.Record("ServiceProviderVerification.Reject", adminUserId, success: true, new
        {
            providerUserId,
            reason,
        });

        await NotifyAsync(user.Id,
            "Provider verification needs changes",
            $"Your service provider verification was not approved. Reason: {reason}");

        return ServiceProviderResult<ServiceProviderVerificationResponse>.Ok(
            profile.ToVerificationResponse(), "Provider verification rejected.");
    }

    // ---------------- pure helpers ----------------

    private static ServiceProviderProfile EnsureProfile(ApplicationUser user) =>
        user.ServiceProviderProfile ??= new ServiceProviderProfile();

    private static void Touch(ServiceProviderProfile profile) => profile.UpdatedAt = DateTime.UtcNow;

    /// <summary>Best-effort in-app + realtime/web-push notification; never fails the operation.</summary>
    private async Task NotifyAsync(Guid userId, string title, string body)
    {
        try
        {
            await _notifications.NotifyUser(userId, title, body);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Provider verification notification failed for {UserId} (non-fatal).", userId);
        }
    }

    private static string? NullIfBlank(string? s) => string.IsNullOrWhiteSpace(s) ? null : s.Trim();

    private static bool HasAtLeastOneSkill(ServiceProviderProfile p) =>
        p.Skills.Any(s => !string.IsNullOrWhiteSpace(s));

    /// <summary>
    /// Stage-2 completeness gate (D-2 Phase 4): the profile is complete only when
    /// every field below is present. Headline/Bio count when non-blank. Drives the
    /// one-way CurrentPhase 1→2 advancement; it never downgrades the phase.
    /// </summary>
    internal static bool IsProfileComplete(ServiceProviderProfile p) =>
        !string.IsNullOrWhiteSpace(p.Headline) &&
        !string.IsNullOrWhiteSpace(p.Bio) &&
        HasAtLeastOneSkill(p) &&
        p.ServiceCategories.Count > 0 &&
        p.Industries.Count > 0 &&
        p.Languages.Count > 0 &&
        p.PricingModels.Count > 0 &&
        p.PortfolioItems.Count > 0;

    /// <summary>Advance to Phase 2 once the Stage-2 profile is complete. One-way only.</summary>
    private static void MaybeAdvancePhase(ServiceProviderProfile p)
    {
        if (p.CurrentPhase < 2 && IsProfileComplete(p))
            p.CurrentPhase = 2;
    }

    /// <summary>Trim, drop blanks, and de-duplicate case-insensitively (first wins).</summary>
    internal static List<string> NormalizeStrings(IEnumerable<string>? values)
    {
        var result = new List<string>();
        if (values is null) return result;

        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var raw in values)
        {
            var trimmed = raw?.Trim();
            if (string.IsNullOrEmpty(trimmed)) continue;
            if (seen.Add(trimmed)) result.Add(trimmed);
        }
        return result;
    }

    /// <summary>
    /// Parse pricing-model names to the locked enum (case-insensitive). Unknown
    /// values are ignored, duplicates collapsed, first-occurrence order preserved.
    /// </summary>
    internal static List<PricingModel> NormalizePricingModels(IEnumerable<string>? models)
    {
        var result = new List<PricingModel>();
        if (models is null) return result;

        var seen = new HashSet<PricingModel>();
        foreach (var raw in models)
        {
            var trimmed = raw?.Trim();
            if (string.IsNullOrEmpty(trimmed)) continue;
            if (Enum.TryParse<PricingModel>(trimmed, ignoreCase: true, out var model) && seen.Add(model))
                result.Add(model);
        }
        return result;
    }

    /// <summary>Parse to the authoritative enum (case-insensitive), de-duplicate, preserve order.</summary>
    internal static List<ServiceCategory> NormalizeCategories(IEnumerable<string>? categories)
    {
        var result = new List<ServiceCategory>();
        if (categories is null) return result;

        var seen = new HashSet<ServiceCategory>();
        foreach (var raw in categories)
        {
            var trimmed = raw?.Trim();
            if (string.IsNullOrEmpty(trimmed)) continue;
            if (Enum.TryParse<ServiceCategory>(trimmed, ignoreCase: true, out var cat) && seen.Add(cat))
                result.Add(cat);
        }
        return result;
    }
}
