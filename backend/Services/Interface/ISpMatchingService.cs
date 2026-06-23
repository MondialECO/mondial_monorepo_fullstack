using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Interface
{
    /// <summary>
    /// Single source of truth for the M50 service-provider match formula (P1.6):
    ///   score = sectorOverlap×0.35 + rating×0.25 + responseRate×0.20 + tierNorm×0.20
    /// Reused by Phase 2 (Design specialty) and Phase 3 formation (legal / finance /
    /// development / branding specialties). Filters tier>=2 verified providers.
    /// </summary>
    public interface ISpMatchingService
    {
        /// <summary>Ranked verified SPs (tier>=2) offering <paramref name="specialty"/>, best first.</summary>
        Task<List<SpMatch>> MatchAsync(ServiceCategory specialty, string projectSector, int take);

        /// <summary>The match formula for a single SP against a project sector (0–1).</summary>
        double Score(ApplicationUser user, string projectSector);
    }

    public sealed class SpMatch
    {
        public ApplicationUser User { get; init; }
        public double ScoreValue { get; init; }
    }
}
