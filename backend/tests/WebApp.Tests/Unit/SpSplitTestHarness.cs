using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging.Abstractions;
using MongoDB.Driver;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Interface;
using WebApp.Services.Migrations;

namespace WebApp.Tests.Unit;

// In-memory implementations of the three SP split stores, plus a real migrator
// wired over them. Unit tests exercise the real service + real migrator logic
// against these fakes; Mongo-specific behaviour (sessions, $inc, indexes) is
// covered separately by the replica-set integration fixture.

public sealed class InMemoryProfessionalProfileStore : IProfessionalProfileStore
{
    public readonly Dictionary<string, ProfessionalProfileRecord> Records = new(StringComparer.Ordinal);
    public bool FailNextWrite { get; set; }

    public Task<ProfessionalProfileRecord?> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default) =>
        Task.FromResult(Records.TryGetValue(userId, out var record) ? record : null);

    public Task<ProfessionalProfileRecord?> GetByPublicSlugAsync(string slug, CancellationToken cancellationToken = default) =>
        Task.FromResult(Records.Values.FirstOrDefault(r => string.Equals(r.PublicSlug, slug, StringComparison.OrdinalIgnoreCase)));

    public Task<Dictionary<string, ProfessionalProfileRecord>> GetByUserIdsAsync(
        IEnumerable<string> userIds, CancellationToken cancellationToken = default) =>
        Task.FromResult(userIds.Distinct().Where(Records.ContainsKey).ToDictionary(id => id, id => Records[id]));

    public Task<bool> UpsertAsync(ProfessionalProfileRecord record, IClientSessionHandle? session = null, CancellationToken cancellationToken = default)
    {
        if (FailNextWrite) { FailNextWrite = false; return Task.FromResult(false); }
        Records[record.UserId] = record;
        return Task.FromResult(true);
    }

    public Task<bool> SetEditorDraftAsync(string userId, ProfessionalProfileDraft? draft, CancellationToken cancellationToken = default)
    {
        if (FailNextWrite) { FailNextWrite = false; return Task.FromResult(false); }
        if (!Records.TryGetValue(userId, out var record)) return Task.FromResult(false);
        record.EditorDraft = draft;
        return Task.FromResult(true);
    }

    public Task<bool> ReplacePublishedIfVersionAsync(ProfessionalProfileRecord record, int expectedVersion, IClientSessionHandle? session = null, CancellationToken cancellationToken = default)
    {
        if (FailNextWrite) { FailNextWrite = false; return Task.FromResult(false); }
        if (!Records.TryGetValue(record.UserId, out var current) || current.ProfileVersion != expectedVersion)
            return Task.FromResult(false);
        Records[record.UserId] = record;
        return Task.FromResult(true);
    }
}

public sealed class InMemoryServiceProviderProfileStore : IServiceProviderProfileStore
{
    public readonly Dictionary<string, ServiceProviderProfileRecord> Records = new(StringComparer.Ordinal);
    public bool FailNextWrite { get; set; }

    public Task<ServiceProviderProfileRecord?> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default) =>
        Task.FromResult(Records.TryGetValue(userId, out var record) ? record : null);

    public Task<bool> UpsertAsync(ServiceProviderProfileRecord record, IClientSessionHandle? session = null, CancellationToken cancellationToken = default)
    {
        if (FailNextWrite) { FailNextWrite = false; return Task.FromResult(false); }
        Records[record.UserId] = record;
        return Task.FromResult(true);
    }

    public Task<List<ServiceProviderProfileRecord>> GetPendingVerificationsAsync(CancellationToken cancellationToken = default) =>
        Task.FromResult(Records.Values
            .Where(r => r.VerificationStatus == ServiceProviderVerificationStatus.UnderReview)
            .OrderBy(r => r.VerificationSubmittedAt)
            .ToList());

    public Task<List<ServiceProviderProfileRecord>> GetMatchCandidatesAsync(
        ServiceCategory specialty, int limit, CancellationToken cancellationToken = default) =>
        Task.FromResult(Records.Values
            .Where(r => r.VerificationStatus == ServiceProviderVerificationStatus.Verified
                        && r.ProviderTier >= ProviderTier.Tier2
                        && r.NewOrderAvailability
                        && r.ServiceCategories.Contains(specialty))
            .Take(limit)
            .ToList());

    public Task<bool> IncrementActiveOrdersAsync(string userId, int delta, CancellationToken cancellationToken = default)
    {
        if (!Records.TryGetValue(userId, out var record)) return Task.FromResult(false);
        if (delta < 0 && record.CurrentActiveOrders <= 0) return Task.FromResult(false);
        record.CurrentActiveOrders += delta;
        record.UpdatedAt = DateTime.UtcNow;
        return Task.FromResult(true);
    }
}

public sealed class InMemoryUserCredentialStore : IUserCredentialStore
{
    public readonly Dictionary<string, UserCredentialRecord> Records = new(StringComparer.Ordinal);
    public bool FailNextWrite { get; set; }

    public Task<List<UserCredentialRecord>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default) =>
        Task.FromResult(Records.Values.Where(c => c.UserId == userId).OrderBy(c => c.CreatedAt).ToList());

    public Task<UserCredentialRecord?> GetOwnedAsync(string userId, string credentialId, CancellationToken cancellationToken = default) =>
        Task.FromResult(Records.Values.FirstOrDefault(c => c.UserId == userId && c.Id == credentialId));

    public Task<int> CountByUserIdAsync(string userId, CancellationToken cancellationToken = default) =>
        Task.FromResult(Records.Values.Count(c => c.UserId == userId));

    public Task<bool> UpsertAsync(UserCredentialRecord record, IClientSessionHandle? session = null, CancellationToken cancellationToken = default)
    {
        if (FailNextWrite) { FailNextWrite = false; return Task.FromResult(false); }
        Records[record.Id] = record;
        return Task.FromResult(true);
    }

    public Task<bool> DeleteOwnedAsync(string userId, string credentialId, CancellationToken cancellationToken = default)
    {
        var found = Records.Values.FirstOrDefault(c => c.UserId == userId && c.Id == credentialId);
        if (found is null) return Task.FromResult(false);
        Records.Remove(found.Id);
        return Task.FromResult(true);
    }
}

public sealed class SpSplitTestHarness
{
    public InMemoryProfessionalProfileStore Professional { get; } = new();
    public InMemoryServiceProviderProfileStore Sp { get; } = new();
    public InMemoryUserCredentialStore Credentials { get; } = new();

    public IServiceProviderProfileSplitMigration CreateMigrator(UserManager<ApplicationUser> userManager) =>
        new ServiceProviderProfileSplitMigration(
            userManager,
            Professional,
            Sp,
            Credentials,
            NullLogger<ServiceProviderProfileSplitMigration>.Instance);
}
