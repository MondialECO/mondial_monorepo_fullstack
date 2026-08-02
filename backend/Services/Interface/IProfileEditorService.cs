using WebApp.Models.Dtos;

namespace WebApp.Services.Interface;

/// <summary>
/// The four-step Service Provider profile editor. Kept separate from
/// IServiceProviderService so the draft lifecycle (open → save per step → submit)
/// does not entangle the Stage-1 publish path, which stays the contract used by
/// existing callers and the admin moderation queue.
///
/// Every method is owner-scoped: userId is the authenticated principal and is
/// never taken from a request body. No method on this interface can set
/// VerificationStatus, TrustScore, Tier, ratings or any other derived value —
/// those remain server-assigned by the verification and ranking paths.
/// </summary>
public interface IProfileEditorService
{
    /// <summary>
    /// Load the provider's working draft. When none exists the draft is seeded from
    /// the published profile and returned WITHOUT being persisted, so merely opening
    /// the editor never writes.
    /// </summary>
    Task<ServiceProviderResult<ProfileDraftResponse>> GetDraftAsync(
        string userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Persist the working draft as the provider moves between steps. Never touches
    /// the published profile, so what visitors see is unchanged until submit.
    /// </summary>
    Task<ServiceProviderResult<ProfileDraftResponse>> SaveDraftAsync(
        string userId,
        ProfileDraftRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>Discard the working draft and fall back to the published profile.</summary>
    Task<ServiceProviderResult<ProfileDraftResponse>> DiscardDraftAsync(
        string userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Validate and apply all four steps atomically, then clear the draft. Returns a
    /// conflict when BasedOnVersion is behind the stored ProfileVersion, so a
    /// concurrent edit in another tab is never silently overwritten.
    /// </summary>
    Task<ServiceProviderResult<ProfileEditorSubmitResponse>> SubmitAsync(
        string userId,
        SubmitProfileEditorRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>Create or update one credential's metadata. Status stays server-controlled.</summary>
    Task<ServiceProviderResult<ProviderCredentialResponse>> UpsertCredentialAsync(
        string userId,
        ProviderCredentialRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Attach or replace a credential document. The previous file is deleted only
    /// after the new reference is durably persisted, so a failed replacement leaves
    /// the prior document intact.
    /// </summary>
    Task<ServiceProviderResult<ProviderCredentialResponse>> UploadCredentialDocumentAsync(
        string userId,
        string credentialId,
        IFormFile file,
        CancellationToken cancellationToken = default);

    /// <summary>Remove one credential and its owned document.</summary>
    Task<ServiceProviderResult<bool>> DeleteCredentialAsync(
        string userId,
        string credentialId,
        CancellationToken cancellationToken = default);
}
