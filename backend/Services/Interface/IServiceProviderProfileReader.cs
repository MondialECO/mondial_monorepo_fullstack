using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Interface;

/// <summary>
/// One provider's profile assembled from the split collections (or the legacy
/// embedded fallback), exposed in the embedded shape so every existing DTO
/// projection keeps working unchanged during migration.
/// </summary>
public sealed class SpCompositeProfile
{
    /// <summary>Embedded-shaped READ-ONLY view. Never persist it.</summary>
    public required ServiceProviderProfile View { get; init; }

    /// <summary>SP tier as an int for analytics/badges. From ProviderTier when the
    /// user is migrated; from the legacy clamp otherwise.</summary>
    public required int TierLevel { get; init; }

    /// <summary>False when this user still reads from the embedded legacy profile.</summary>
    public required bool FromNewCollections { get; init; }

    public ProfessionalProfileRecord? Professional { get; init; }
    public ServiceProviderProfileRecord? Record { get; init; }
    public IReadOnlyList<UserCredentialRecord> Credentials { get; init; } = Array.Empty<UserCredentialRecord>();
}

/// <summary>
/// Aggregate compatibility reader for the Service Provider data split. Loads
/// ProfessionalProfiles + ServiceProviderProfiles + UserCredentials by UserId and
/// projects them into the existing embedded shape; when no split records exist
/// for a user it falls back — PER USER — to the embedded
/// ApplicationUser.ServiceProviderProfile, so migration never has to be globally
/// complete for reads to stay correct.
/// </summary>
public interface IServiceProviderProfileReader
{
    /// <summary>Load by user id. Null only when the user does not exist.</summary>
    Task<SpCompositeProfile?> GetCompositeAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>Same, for callers that already hold the user (avoids a re-fetch).</summary>
    Task<SpCompositeProfile> GetCompositeForUserAsync(ApplicationUser user, CancellationToken cancellationToken = default);
}
