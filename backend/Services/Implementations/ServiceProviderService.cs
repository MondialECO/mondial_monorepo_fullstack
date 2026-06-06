using Microsoft.AspNetCore.Identity;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
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
    private readonly ILogger<ServiceProviderService> _logger;

    public ServiceProviderService(
        UserManager<ApplicationUser> userManager,
        ILogger<ServiceProviderService> logger)
    {
        _userManager = userManager;
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
        profile.Skills = NormalizeSkills(request.Skills);
        profile.ServiceCategories = NormalizeCategories(request.ServiceCategories);
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

        // Duplicate-submission guard: only a Pending profile can be submitted.
        if (profile.VerificationStatus != ServiceProviderVerificationStatus.Pending)
            return ServiceProviderResult<ServiceProviderVerificationResponse>.Conflict(
                "Verification has already been submitted.");

        // Profile-completeness gate (enforced against the persisted profile, which
        // a stateless request validator cannot see).
        if (!HasAtLeastOneSkill(profile) || profile.ServiceCategories.Count == 0 || profile.PortfolioItems.Count == 0)
            return ServiceProviderResult<ServiceProviderVerificationResponse>.Conflict(
                "Add at least one skill, one category, and one portfolio item before submitting for verification.");

        profile.VerificationStatus = ServiceProviderVerificationStatus.UnderReview;
        profile.VerificationSubmittedAt = DateTime.UtcNow;
        Touch(profile);

        await _userManager.UpdateAsync(user);
        return ServiceProviderResult<ServiceProviderVerificationResponse>.Ok(
            profile.ToVerificationResponse(), "Submitted for verification.");
    }

    // ---------------- pure helpers ----------------

    private static ServiceProviderProfile EnsureProfile(ApplicationUser user) =>
        user.ServiceProviderProfile ??= new ServiceProviderProfile();

    private static void Touch(ServiceProviderProfile profile) => profile.UpdatedAt = DateTime.UtcNow;

    private static string? NullIfBlank(string? s) => string.IsNullOrWhiteSpace(s) ? null : s.Trim();

    private static bool HasAtLeastOneSkill(ServiceProviderProfile p) =>
        p.Skills.Any(s => !string.IsNullOrWhiteSpace(s));

    /// <summary>Trim, drop blanks, and de-duplicate case-insensitively (first wins).</summary>
    internal static List<string> NormalizeSkills(IEnumerable<string>? skills)
    {
        var result = new List<string>();
        if (skills is null) return result;

        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var raw in skills)
        {
            var trimmed = raw?.Trim();
            if (string.IsNullOrEmpty(trimmed)) continue;
            if (seen.Add(trimmed)) result.Add(trimmed);
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
