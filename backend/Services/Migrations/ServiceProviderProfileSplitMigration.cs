using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;

namespace WebApp.Services.Migrations
{
    /// <summary>Summary of one migration sweep.</summary>
    public sealed record SpSplitMigrationSummary(
        int UsersWithEmbeddedProfile,
        int ProfessionalProfilesUpserted,
        int ServiceProviderProfilesUpserted,
        int CredentialsUpserted,
        int Skipped);

    /// <summary>One user whose old and new read paths disagree.</summary>
    public sealed record SpSplitChecksumMismatch(string UserId, string Reason);

    /// <summary>Field-level verification of a completed sweep.</summary>
    public sealed record SpSplitVerificationReport(
        int UsersWithEmbeddedProfile,
        int ProfessionalProfileCount,
        int ServiceProviderProfileCount,
        int EmbeddedCredentialCount,
        int UserCredentialCount,
        int ChecksumMatches,
        List<SpSplitChecksumMismatch> Mismatches)
    {
        public bool Passed => Mismatches.Count == 0
            && UsersWithEmbeddedProfile <= ProfessionalProfileCount
            && UsersWithEmbeddedProfile <= ServiceProviderProfileCount
            && EmbeddedCredentialCount <= UserCredentialCount;
    }

    /// <summary>
    /// Idempotent, Service Provider-only split migration. Upserts are keyed by the
    /// unique UserId (records) and stable credential id, so any number of re-runs
    /// converges: no duplicates, ids preserved, review status preserved, draft and
    /// ProfileVersion preserved, identical checksums.
    ///
    /// Creator, Entrepreneur and Investor data is never touched. Physical files are
    /// never moved — only document references are copied.
    /// </summary>
    public interface IServiceProviderProfileSplitMigration
    {
        /// <summary>
        /// Migrate-on-write seam: returns the split records for one user, creating
        /// them from the embedded profile when absent. Never overwrites existing
        /// records (they are already the source of truth after cutover).
        /// </summary>
        Task<(ProfessionalProfileRecord Professional, ServiceProviderProfileRecord Sp)> EnsureMigratedAsync(
            ApplicationUser user, CancellationToken cancellationToken = default);

        /// <summary>
        /// Ensures a ProfessionalProfileRecord exists for any authenticated user, regardless of roles.
        /// </summary>
        Task<ProfessionalProfileRecord> EnsureProfessionalProfileAsync(
            ApplicationUser user, CancellationToken cancellationToken = default);

        /// <summary>Sweep every user carrying an embedded SP profile.</summary>
        Task<SpSplitMigrationSummary> MigrateAllAsync(CancellationToken cancellationToken = default);

        /// <summary>Counts + canonical-JSON checksum comparison of old vs new read paths.</summary>
        Task<SpSplitVerificationReport> VerifyAsync(CancellationToken cancellationToken = default);
    }

    public class ServiceProviderProfileSplitMigration(
        UserManager<ApplicationUser> userManager,
        IProfessionalProfileStore professionalStore,
        IServiceProviderProfileStore spStore,
        IUserCredentialStore credentialStore,
        ILogger<ServiceProviderProfileSplitMigration> logger) : IServiceProviderProfileSplitMigration
    {
        public async Task<(ProfessionalProfileRecord Professional, ServiceProviderProfileRecord Sp)> EnsureMigratedAsync(
            ApplicationUser user, CancellationToken cancellationToken = default)
        {
            var userId = user.Id.ToString();
            var professional = await professionalStore.GetByUserIdAsync(userId, cancellationToken);
            var sp = await spStore.GetByUserIdAsync(userId, cancellationToken);

            if (professional is null)
            {
                professional = SpProfileSplitMapper.ToProfessionalRecord(user);
                await EnsureUniqueSlugAsync(professional, user, cancellationToken);
                await professionalStore.UpsertAsync(professional, cancellationToken: cancellationToken);
            }
            else if (string.IsNullOrWhiteSpace(professional.PublicSlug))
            {
                await EnsureUniqueSlugAsync(professional, user, cancellationToken);
                await professionalStore.UpsertAsync(professional, cancellationToken: cancellationToken);
            }

            if (sp is null)
            {
                sp = SpProfileSplitMapper.ToServiceProviderRecord(user);
                await spStore.UpsertAsync(sp, cancellationToken: cancellationToken);
            }

            // Credentials: insert only the ids that have not been migrated yet, so a
            // reviewed credential in the new collection is never regressed by the
            // frozen embedded copy.
            var embeddedCredentials = SpProfileSplitMapper.ToCredentialRecords(user);
            if (embeddedCredentials.Count > 0)
            {
                var existing = await credentialStore.GetByUserIdAsync(userId, cancellationToken);
                var existingIds = existing.Select(x => x.Id).ToHashSet(StringComparer.Ordinal);
                foreach (var credential in embeddedCredentials.Where(c => !existingIds.Contains(c.Id)))
                    await credentialStore.UpsertAsync(credential, cancellationToken: cancellationToken);
            }

            return (professional, sp);
        }

        public async Task<ProfessionalProfileRecord> EnsureProfessionalProfileAsync(
            ApplicationUser user, CancellationToken cancellationToken = default)
        {
            var userId = user.Id.ToString();
            var professional = await professionalStore.GetByUserIdAsync(userId, cancellationToken);
            if (professional is null)
            {
                professional = SpProfileSplitMapper.ToProfessionalRecord(user);
                await EnsureUniqueSlugAsync(professional, user, cancellationToken);
                await professionalStore.UpsertAsync(professional, cancellationToken: cancellationToken);
            }
            else if (string.IsNullOrWhiteSpace(professional.PublicSlug))
            {
                await EnsureUniqueSlugAsync(professional, user, cancellationToken);
                await professionalStore.UpsertAsync(professional, cancellationToken: cancellationToken);
            }
            return professional;
        }

        private async Task EnsureUniqueSlugAsync(
            ProfessionalProfileRecord professional,
            ApplicationUser user,
            CancellationToken cancellationToken)
        {
            var baseSlug = ProfileSlugGenerator.GenerateSlug(user.UserName ?? user.Name, user.Id.ToString());
            var candidate = baseSlug;
            var suffix = 2;
            while (true)
            {
                var existing = await professionalStore.GetByPublicSlugAsync(candidate, cancellationToken);
                if (existing is null || existing.UserId == professional.UserId)
                {
                    professional.PublicSlug = candidate;
                    break;
                }
                candidate = $"{baseSlug}-{suffix++}";
            }
        }

        public async Task<SpSplitMigrationSummary> MigrateAllAsync(CancellationToken cancellationToken = default)
        {
            var users = userManager.Users.ToList()
                .Where(HasEmbeddedProfile)
                .ToList();

            int prof = 0, sp = 0, creds = 0, skipped = 0;
            foreach (var user in users)
            {
                cancellationToken.ThrowIfCancellationRequested();
                var userId = user.Id.ToString();
                try
                {
                    var hadProfessional = await professionalStore.GetByUserIdAsync(userId, cancellationToken) is not null;
                    var hadSp = await spStore.GetByUserIdAsync(userId, cancellationToken) is not null;
                    var credentialCountBefore = await credentialStore.CountByUserIdAsync(userId, cancellationToken);

                    await EnsureMigratedAsync(user, cancellationToken);

                    if (!hadProfessional) prof++;
                    if (!hadSp) sp++;
                    creds += Math.Max(0, await credentialStore.CountByUserIdAsync(userId, cancellationToken) - credentialCountBefore);
                    if (hadProfessional && hadSp) skipped++;
                }
                catch (Exception exception)
                {
                    logger.LogWarning(exception, "SP split migration failed for one user; sweep continues.");
                }
            }

            var summary = new SpSplitMigrationSummary(users.Count, prof, sp, creds, skipped);
            logger.LogInformation(
                "SP split migration: {Users} embedded profiles, {Prof} professional + {Sp} SP records created, {Creds} credentials copied, {Skipped} already migrated.",
                summary.UsersWithEmbeddedProfile, prof, sp, creds, skipped);
            return summary;
        }

        public async Task<SpSplitVerificationReport> VerifyAsync(CancellationToken cancellationToken = default)
        {
            var users = userManager.Users.ToList()
                .Where(HasEmbeddedProfile)
                .ToList();

            int professionalCount = 0, spCount = 0, embeddedCredentials = 0, newCredentials = 0, matches = 0;
            var mismatches = new List<SpSplitChecksumMismatch>();

            foreach (var user in users)
            {
                cancellationToken.ThrowIfCancellationRequested();
                var userId = user.Id.ToString();
                var professional = await professionalStore.GetByUserIdAsync(userId, cancellationToken);
                var sp = await spStore.GetByUserIdAsync(userId, cancellationToken);
                var credentials = await credentialStore.GetByUserIdAsync(userId, cancellationToken);

                if (professional is not null) professionalCount++;
                if (sp is not null) spCount++;
                embeddedCredentials += user.ServiceProviderProfile!.Credentials.Count;
                newCredentials += credentials.Count;

                if (professional is null || sp is null)
                {
                    mismatches.Add(new SpSplitChecksumMismatch(userId, "Split records missing for migrated user."));
                    continue;
                }

                // Canonical checksum: both read paths projected through the SAME
                // existing DTO mapping, then hashed. Equal hashes prove the
                // frontend-visible contract is identical field-for-field.
                var legacy = Checksum(user.ServiceProviderProfile!.ToResponse());
                var composite = Checksum(SpProfileSplitMapper
                    .ToCompositeView(professional, sp, credentials)
                    .ToResponse());

                if (legacy == composite) matches++;
                else mismatches.Add(new SpSplitChecksumMismatch(userId, "Checksum mismatch between embedded and split projections."));
            }

            return new SpSplitVerificationReport(
                users.Count, professionalCount, spCount,
                embeddedCredentials, newCredentials, matches, mismatches);
        }

        private static bool HasEmbeddedProfile(ApplicationUser user) =>
            user.ServiceProviderProfile is { } p &&
            (!string.IsNullOrWhiteSpace(p.ProviderId)
             || p.Skills.Count > 0
             || p.ServiceCategories.Count > 0
             || p.PortfolioItems.Count > 0
             || p.Credentials.Count > 0
             || !string.IsNullOrWhiteSpace(p.Headline)
             || !string.IsNullOrWhiteSpace(p.Bio)
             || p.VerificationStatus != ServiceProviderVerificationStatus.Pending
             || p.VerificationSubmittedAt is not null);

        /// <summary>Canonical projection hash used by verification (and its tests).</summary>
        public static string Checksum(ServiceProviderProfileResponse response)
        {
            var json = JsonSerializer.Serialize(response);
            return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(json)));
        }
    }
}
