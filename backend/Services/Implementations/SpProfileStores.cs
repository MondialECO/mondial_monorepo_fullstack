using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations;

/// <summary>Mongo-backed store for ProfessionalProfiles (SP-only initially).</summary>
public sealed class ProfessionalProfileStore(MongoDbContext context) : IProfessionalProfileStore
{
    public Task<ProfessionalProfileRecord?> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default) =>
        context.ProfessionalProfiles.Find(x => x.UserId == userId).FirstOrDefaultAsync(cancellationToken)!;

    public Task<ProfessionalProfileRecord?> GetByPublicSlugAsync(string slug, CancellationToken cancellationToken = default) =>
        context.ProfessionalProfiles.Find(x => x.PublicSlug == slug).FirstOrDefaultAsync(cancellationToken)!;

    public async Task<Dictionary<string, ProfessionalProfileRecord>> GetByUserIdsAsync(
        IEnumerable<string> userIds, CancellationToken cancellationToken = default)
    {
        var ids = userIds.Distinct().ToList();
        if (ids.Count == 0) return new();
        var records = await context.ProfessionalProfiles
            .Find(Builders<ProfessionalProfileRecord>.Filter.In(x => x.UserId, ids))
            .ToListAsync(cancellationToken);
        return records.ToDictionary(x => x.UserId);
    }

    public async Task<bool> UpsertAsync(
        ProfessionalProfileRecord record,
        IClientSessionHandle? session = null,
        CancellationToken cancellationToken = default)
    {
        var filter = Builders<ProfessionalProfileRecord>.Filter.Eq(x => x.UserId, record.UserId);
        var options = new ReplaceOptions { IsUpsert = true };
        var result = session is null
            ? await context.ProfessionalProfiles.ReplaceOneAsync(filter, record, options, cancellationToken)
            : await context.ProfessionalProfiles.ReplaceOneAsync(session, filter, record, options, cancellationToken);
        return result.IsAcknowledged;
    }

    public async Task<bool> SetEditorDraftAsync(
        string userId,
        ProfessionalProfileDraft? draft,
        CancellationToken cancellationToken = default)
    {
        var filter = Builders<ProfessionalProfileRecord>.Filter.Eq(x => x.UserId, userId);
        var update = draft is null
            ? Builders<ProfessionalProfileRecord>.Update.Unset(x => x.EditorDraft)
            : Builders<ProfessionalProfileRecord>.Update.Set(x => x.EditorDraft, draft);
        var result = await context.ProfessionalProfiles.UpdateOneAsync(filter, update, cancellationToken: cancellationToken);
        return result.IsAcknowledged && result.MatchedCount > 0;
    }

    public async Task<bool> ReplacePublishedIfVersionAsync(
        ProfessionalProfileRecord record,
        int expectedVersion,
        IClientSessionHandle? session = null,
        CancellationToken cancellationToken = default)
    {
        // The version predicate IS the concurrency check: zero matches means a
        // newer publish landed since the caller loaded the record.
        var filter = Builders<ProfessionalProfileRecord>.Filter.And(
            Builders<ProfessionalProfileRecord>.Filter.Eq(x => x.UserId, record.UserId),
            Builders<ProfessionalProfileRecord>.Filter.Eq(x => x.ProfileVersion, expectedVersion));
        var result = session is null
            ? await context.ProfessionalProfiles.ReplaceOneAsync(filter, record, cancellationToken: cancellationToken)
            : await context.ProfessionalProfiles.ReplaceOneAsync(session, filter, record, cancellationToken: cancellationToken);
        return result.IsAcknowledged && result.MatchedCount > 0;
    }
}

/// <summary>Mongo-backed store for ServiceProviderProfiles.</summary>
public sealed class ServiceProviderProfileStore(MongoDbContext context) : IServiceProviderProfileStore
{
    public Task<ServiceProviderProfileRecord?> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default) =>
        context.ServiceProviderProfiles.Find(x => x.UserId == userId).FirstOrDefaultAsync(cancellationToken)!;

    public async Task<bool> UpsertAsync(
        ServiceProviderProfileRecord record,
        IClientSessionHandle? session = null,
        CancellationToken cancellationToken = default)
    {
        var filter = Builders<ServiceProviderProfileRecord>.Filter.Eq(x => x.UserId, record.UserId);
        var options = new ReplaceOptions { IsUpsert = true };
        var result = session is null
            ? await context.ServiceProviderProfiles.ReplaceOneAsync(filter, record, options, cancellationToken)
            : await context.ServiceProviderProfiles.ReplaceOneAsync(session, filter, record, options, cancellationToken);
        return result.IsAcknowledged;
    }

    public Task<List<ServiceProviderProfileRecord>> GetPendingVerificationsAsync(CancellationToken cancellationToken = default) =>
        context.ServiceProviderProfiles
            .Find(x => x.VerificationStatus == ServiceProviderVerificationStatus.UnderReview)
            .SortBy(x => x.VerificationSubmittedAt)
            .ToListAsync(cancellationToken);

    public Task<List<ServiceProviderProfileRecord>> GetMatchCandidatesAsync(
        ServiceCategory specialty, int limit, CancellationToken cancellationToken = default)
    {
        var filter = Builders<ServiceProviderProfileRecord>.Filter.And(
            Builders<ServiceProviderProfileRecord>.Filter.Eq(x => x.VerificationStatus, ServiceProviderVerificationStatus.Verified),
            Builders<ServiceProviderProfileRecord>.Filter.Gte(x => x.ProviderTier, ProviderTier.Tier2),
            Builders<ServiceProviderProfileRecord>.Filter.Eq(x => x.NewOrderAvailability, true),
            Builders<ServiceProviderProfileRecord>.Filter.AnyEq(x => x.ServiceCategories, specialty));
        return context.ServiceProviderProfiles.Find(filter).Limit(limit).ToListAsync(cancellationToken);
    }

    public async Task<bool> IncrementActiveOrdersAsync(string userId, int delta, CancellationToken cancellationToken = default)
    {
        if (delta == 0) return true;

        // Guard decrements so the counter never goes negative.
        var filter = delta > 0
            ? Builders<ServiceProviderProfileRecord>.Filter.Eq(x => x.UserId, userId)
            : Builders<ServiceProviderProfileRecord>.Filter.And(
                Builders<ServiceProviderProfileRecord>.Filter.Eq(x => x.UserId, userId),
                Builders<ServiceProviderProfileRecord>.Filter.Gt(x => x.CurrentActiveOrders, 0));

        var update = Builders<ServiceProviderProfileRecord>.Update
            .Inc(x => x.CurrentActiveOrders, delta)
            .Set(x => x.UpdatedAt, DateTime.UtcNow);

        var result = await context.ServiceProviderProfiles.UpdateOneAsync(filter, update, cancellationToken: cancellationToken);
        return result.IsAcknowledged && result.MatchedCount > 0;
    }
}

/// <summary>Mongo-backed store for UserCredentials. Every lookup is owner-scoped.</summary>
public sealed class UserCredentialStore(MongoDbContext context) : IUserCredentialStore
{
    public Task<List<UserCredentialRecord>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default) =>
        context.UserCredentials.Find(x => x.UserId == userId).SortBy(x => x.CreatedAt).ToListAsync(cancellationToken);

    public Task<UserCredentialRecord?> GetOwnedAsync(string userId, string credentialId, CancellationToken cancellationToken = default) =>
        context.UserCredentials.Find(x => x.UserId == userId && x.Id == credentialId).FirstOrDefaultAsync(cancellationToken)!;

    public async Task<int> CountByUserIdAsync(string userId, CancellationToken cancellationToken = default) =>
        (int)await context.UserCredentials.CountDocumentsAsync(x => x.UserId == userId, cancellationToken: cancellationToken);

    public async Task<bool> UpsertAsync(
        UserCredentialRecord record,
        IClientSessionHandle? session = null,
        CancellationToken cancellationToken = default)
    {
        // Owner scoping in the filter: a mismatched UserId can never overwrite
        // another provider's credential even if ids collide.
        var filter = Builders<UserCredentialRecord>.Filter.And(
            Builders<UserCredentialRecord>.Filter.Eq(x => x.Id, record.Id),
            Builders<UserCredentialRecord>.Filter.Eq(x => x.UserId, record.UserId));
        var options = new ReplaceOptions { IsUpsert = true };
        var result = session is null
            ? await context.UserCredentials.ReplaceOneAsync(filter, record, options, cancellationToken)
            : await context.UserCredentials.ReplaceOneAsync(session, filter, record, options, cancellationToken);
        return result.IsAcknowledged;
    }

    public async Task<bool> DeleteOwnedAsync(string userId, string credentialId, CancellationToken cancellationToken = default)
    {
        var result = await context.UserCredentials.DeleteOneAsync(
            x => x.UserId == userId && x.Id == credentialId, cancellationToken);
        return result.IsAcknowledged && result.DeletedCount > 0;
    }
}
