using WebApp.Models.Dtos;

namespace WebApp.Services.Interface;

/// <summary>Outcome of a service-provider operation, mapped to HTTP status by the controller.</summary>
public enum ServiceProviderOutcome
{
    Ok,
    NotFound,
    Conflict,
}

/// <summary>
/// Result envelope so the service owns all decision logic (what is a 404 vs 409)
/// and the controller stays a thin status-code mapper. Mirrors the typed-result
/// approach over throwing for expected conditions (missing user, bad index,
/// duplicate submission).
/// </summary>
public sealed class ServiceProviderResult<T>
{
    public ServiceProviderOutcome Outcome { get; private init; }
    public T? Value { get; private init; }
    public string Message { get; private init; } = "";

    public static ServiceProviderResult<T> Ok(T value, string message = "OK") =>
        new() { Outcome = ServiceProviderOutcome.Ok, Value = value, Message = message };

    public static ServiceProviderResult<T> NotFound(string message) =>
        new() { Outcome = ServiceProviderOutcome.NotFound, Message = message };

    public static ServiceProviderResult<T> Conflict(string message) =>
        new() { Outcome = ServiceProviderOutcome.Conflict, Message = message };
}

/// <summary>
/// D-1 Stage 1 (Verification &amp; Onboarding) owner-side operations over the
/// embedded ServiceProviderProfile on ApplicationUser. No marketplace, matching,
/// proposal, workroom, milestone, escrow, review, reputation, or admin-approval
/// concerns. All methods are owner-scoped by the caller-supplied authenticated id.
/// </summary>
public interface IServiceProviderService
{
    Task<ServiceProviderResult<ServiceProviderProfileResponse>> GetProfileAsync(string userId);

    Task<ServiceProviderResult<ServiceProviderProfileResponse>> UpsertProfileAsync(
        string userId, CreateOrUpdateServiceProviderProfileRequest request);

    Task<ServiceProviderResult<ServiceProviderProfileResponse>> AddPortfolioItemAsync(
        string userId, AddPortfolioItemRequest request);

    Task<ServiceProviderResult<ServiceProviderProfileResponse>> UpdatePortfolioItemAsync(
        string userId, UpdatePortfolioItemRequest request);

    Task<ServiceProviderResult<ServiceProviderProfileResponse>> DeletePortfolioItemAsync(
        string userId, int index);

    Task<ServiceProviderResult<ServiceProviderVerificationResponse>> SubmitVerificationAsync(
        string userId, SubmitVerificationRequest request);

    // ---- Admin (Phase 5): list / approve / reject submissions awaiting review ----

    /// <summary>All providers whose profile is awaiting review (UnderReview),
    /// oldest submission first, projected for the admin moderation queue.</summary>
    Task<ServiceProviderResult<List<PendingProviderResponse>>> GetPendingVerificationsAsync();

    Task<ServiceProviderResult<ServiceProviderVerificationResponse>> ApproveVerificationAsync(
        string providerUserId, string adminUserId);

    Task<ServiceProviderResult<ServiceProviderVerificationResponse>> RejectVerificationAsync(
        string providerUserId, string adminUserId, string reason);

    // ---- Module 1: Profile & Trust (reputation layer) ----

    /// <summary>The provider's derived TrustScore + per-signal breakdown (owner-scoped).</summary>
    Task<ServiceProviderResult<TrustBreakdownResponse>> GetTrustAsync(string userId);

    /// <summary>Per-category skills-test status (last attempt, cooldown, eligibility).</summary>
    Task<ServiceProviderResult<SkillsTestStatusResponse>> GetSkillsTestStatusAsync(string userId);

    /// <summary>A fresh attempt's questions (correct answers stripped) for one owned category.</summary>
    Task<ServiceProviderResult<SkillsTestQuestionsResponse>> GetSkillsTestQuestionsAsync(
        string userId, string category);

    /// <summary>Grade a submitted attempt, record it (with cooldown), and recompute TrustScore.</summary>
    Task<ServiceProviderResult<SkillsTestResultResponse>> SubmitSkillsTestAsync(
        string userId, SubmitSkillsTestRequest request);

    /// <summary>Module 3's narrow hook into the existing sole trust recalculation path.</summary>
    Task UpdateResponseRateSignalAsync(string userId, double? responseRate);
}
