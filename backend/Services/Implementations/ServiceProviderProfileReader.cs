using Microsoft.AspNetCore.Identity;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations;

/// <summary>
/// Dual-read aggregate reader (Phase 2 of the approved SP split). Split records
/// win when present; otherwise the embedded legacy profile is projected as-is.
/// Purely read-only: it never writes to any collection and never triggers
/// migration — write paths do that through the migrator's migrate-on-write seam.
/// </summary>
public sealed class ServiceProviderProfileReader(
    UserManager<ApplicationUser> userManager,
    IProfessionalProfileStore professionalStore,
    IServiceProviderProfileStore spStore,
    IUserCredentialStore credentialStore) : IServiceProviderProfileReader
{
    public async Task<SpCompositeProfile?> GetCompositeAsync(string userId, CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return null;
        return await GetCompositeForUserAsync(user, cancellationToken);
    }

    public async Task<SpCompositeProfile> GetCompositeForUserAsync(ApplicationUser user, CancellationToken cancellationToken = default)
    {
        var userId = user.Id.ToString();
        var professional = await professionalStore.GetByUserIdAsync(userId, cancellationToken);
        var sp = await spStore.GetByUserIdAsync(userId, cancellationToken);

        // Legacy fallback: the user has not been migrated yet — read the embedded
        // profile exactly as before the split. TierLevel keeps the legacy clamp
        // the analytics surface always applied.
        if (professional is null && sp is null)
        {
            return new SpCompositeProfile
            {
                View = user.ServiceProviderProfile ?? new ServiceProviderProfile(),
                TierLevel = Math.Max(1, user.Tier_level),
                FromNewCollections = false,
            };
        }

        // Partially migrated states cannot arise from the migrator (it writes both
        // records), but tolerate them by projecting the missing half from the
        // embedded copy in memory — without writing anything.
        professional ??= SpProfileSplitMapper.ToProfessionalRecord(user);
        sp ??= SpProfileSplitMapper.ToServiceProviderRecord(user);

        var credentials = await credentialStore.GetByUserIdAsync(userId, cancellationToken);

        return new SpCompositeProfile
        {
            View = SpProfileSplitMapper.ToCompositeView(professional, sp, credentials),
            TierLevel = (int)sp.ProviderTier,
            FromNewCollections = true,
            Professional = professional,
            Record = sp,
            Credentials = credentials,
        };
    }
}
