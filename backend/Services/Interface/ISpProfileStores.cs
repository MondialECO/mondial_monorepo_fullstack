using MongoDB.Driver;
using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Interface;

// Thin, mockable persistence seams for the three Service Provider split
// collections. All writes report acknowledgement so callers never assume
// success (the audited whole-document-replace paths sometimes did). Session
// overloads exist so the editor's final submit can span all three collections
// in one MongoDB transaction; passing null keeps the write non-transactional.

public interface IProfessionalProfileStore
{
    Task<ProfessionalProfileRecord?> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default);

    Task<ProfessionalProfileRecord?> GetByPublicSlugAsync(string slug, CancellationToken cancellationToken = default);

    /// <summary>Bulk lookup for ranking flows (e.g. matching reads Industries).</summary>
    Task<Dictionary<string, ProfessionalProfileRecord>> GetByUserIdsAsync(
        IEnumerable<string> userIds, CancellationToken cancellationToken = default);

    /// <summary>Replace-by-UserId upsert. Returns false when unacknowledged.</summary>
    Task<bool> UpsertAsync(
        ProfessionalProfileRecord record,
        IClientSessionHandle? session = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Targeted draft write ($set / $unset of EditorDraft only). Step saves go
    /// through this so they can never race a concurrent published-field write.
    /// Returns false when no record matched or the write was unacknowledged.
    /// </summary>
    Task<bool> SetEditorDraftAsync(
        string userId,
        ProfessionalProfileDraft? draft,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Optimistic-concurrency publish: replaces the record only when the stored
    /// ProfileVersion still equals <paramref name="expectedVersion"/>. Returns
    /// false on a version conflict — the caller maps that to a conflict result
    /// (and aborts the surrounding transaction when one is active).
    /// </summary>
    Task<bool> ReplacePublishedIfVersionAsync(
        ProfessionalProfileRecord record,
        int expectedVersion,
        IClientSessionHandle? session = null,
        CancellationToken cancellationToken = default);
}

public interface IServiceProviderProfileStore
{
    Task<ServiceProviderProfileRecord?> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>Replace-by-UserId upsert. Returns false when unacknowledged.</summary>
    Task<bool> UpsertAsync(
        ServiceProviderProfileRecord record,
        IClientSessionHandle? session = null,
        CancellationToken cancellationToken = default);

    /// <summary>Indexed admin review queue (UnderReview, oldest submission first) —
    /// replaces the legacy scan over every user document.</summary>
    Task<List<ServiceProviderProfileRecord>> GetPendingVerificationsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Indexed matching pool: Verified, ProviderTier >= Tier2, available, offering
    /// the specialty. Capacity is re-checked in memory by the caller.
    /// </summary>
    Task<List<ServiceProviderProfileRecord>> GetMatchCandidatesAsync(
        ServiceCategory specialty, int limit, CancellationToken cancellationToken = default);

    /// <summary>
    /// Targeted engagement counter ($inc), immune to whole-document races. A
    /// negative delta is a no-op at zero. Returns false when nothing matched or
    /// the write was unacknowledged.
    /// </summary>
    Task<bool> IncrementActiveOrdersAsync(string userId, int delta, CancellationToken cancellationToken = default);
}

public interface IUserCredentialStore
{
    Task<List<UserCredentialRecord>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>Owner-scoped single lookup — a foreign credential id returns null.</summary>
    Task<UserCredentialRecord?> GetOwnedAsync(string userId, string credentialId, CancellationToken cancellationToken = default);

    Task<int> CountByUserIdAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>Replace-by-id upsert, owner-scoped. Returns false when unacknowledged.</summary>
    Task<bool> UpsertAsync(
        UserCredentialRecord record,
        IClientSessionHandle? session = null,
        CancellationToken cancellationToken = default);

    /// <summary>Owner-scoped delete. Returns false when nothing was removed.</summary>
    Task<bool> DeleteOwnedAsync(string userId, string credentialId, CancellationToken cancellationToken = default);
}
