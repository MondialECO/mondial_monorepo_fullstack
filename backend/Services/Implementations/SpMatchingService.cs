using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations
{
    /// <summary>
    /// Implements the P1.6 SP match formula in one place (see <see cref="ISpMatchingService"/>).
    /// SPs are ApplicationUsers with an embedded ServiceProviderProfile.
    /// </summary>
    public class SpMatchingService : ISpMatchingService
    {
        private readonly MongoDbContext _context;
        public SpMatchingService(MongoDbContext context) => _context = context;

        public async Task<List<SpMatch>> MatchAsync(ServiceCategory specialty, string projectSector, int take)
        {
            // Tier filter in the query; specialty + verification refined in memory.
            var candidates = await _context.ApplicationUsers
                .Find(u => u.Tier_level >= 2 && u.ServiceProviderProfile != null)
                .Limit(200)
                .ToListAsync();

            return candidates
                .Where(u =>
                    u.ServiceProviderProfile.VerificationStatus == ServiceProviderVerificationStatus.Verified &&
                    u.ServiceProviderProfile.ServiceCategories.Contains(specialty))
                .Select(u => new SpMatch { User = u, ScoreValue = Score(u, projectSector) })
                .OrderByDescending(m => m.ScoreValue)
                .Take(take)
                .ToList();
        }

        // score = sectorOverlap×0.35 + rating×0.25 + responseRate×0.20 + tierNorm×0.20
        public double Score(ApplicationUser u, string projectSector)
        {
            var sp = u.ServiceProviderProfile;

            double tierNorm = u.Tier_level >= 3 ? 1.0 : u.Tier_level == 2 ? 0.7 : 0.4;

            // rating: TrustScore reputation seed, normalized defensively (0–5 → /5, else /100).
            double rawTrust = sp.TrustScore > 0 ? sp.TrustScore : u.Trust_score;
            double ratingNorm = rawTrust <= 0 ? 0.6 : rawTrust <= 5 ? rawTrust / 5.0 : Math.Min(rawTrust / 100.0, 1.0);

            // responseRate: no SP-analytics field yet — placeholder constant.
            // TODO: swap to a real SP response-rate metric when tracked.
            double responseRate = 0.85;

            double sectorOverlap;
            if (string.IsNullOrWhiteSpace(projectSector)) sectorOverlap = 0.7;
            else if (sp.Industries != null && sp.Industries.Any(s =>
                         s.Contains(projectSector, StringComparison.OrdinalIgnoreCase) ||
                         projectSector.Contains(s, StringComparison.OrdinalIgnoreCase)))
                sectorOverlap = 1.0;
            else sectorOverlap = 0.4;

            return sectorOverlap * 0.35 + ratingNorm * 0.25 + responseRate * 0.20 + tierNorm * 0.20;
        }
    }
}
