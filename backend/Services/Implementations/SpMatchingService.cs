using Microsoft.AspNetCore.Identity;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations
{
    /// <summary>
    /// Implements the P1.6 SP match formula in one place (see <see cref="ISpMatchingService"/>).
    ///
    /// After the SP data split, eligibility and ranking read the split records:
    /// ServiceProviderProfiles supplies verification, ProviderTier, categories,
    /// availability, capacity and trust; ProfessionalProfiles supplies Industries
    /// for sector overlap. ProviderTier (Tier2+) replaces the legacy
    /// ApplicationUser.Tier_level filter, which no writer could ever satisfy —
    /// verification approval now grants Tier2, so the candidate pool is real.
    /// Tier affects match priority only, never pricing or the fixed 12% commission.
    /// </summary>
    public class SpMatchingService : ISpMatchingService
    {
        private readonly IServiceProviderProfileStore _spStore;
        private readonly IProfessionalProfileStore _professionalStore;
        private readonly UserManager<ApplicationUser> _users;

        public SpMatchingService(
            IServiceProviderProfileStore spStore,
            IProfessionalProfileStore professionalStore,
            UserManager<ApplicationUser> users)
        {
            _spStore = spStore;
            _professionalStore = professionalStore;
            _users = users;
        }

        public async Task<List<SpMatch>> MatchAsync(ServiceCategory specialty, string projectSector, int take)
        {
            // Indexed pool: Verified, Tier2+, available, offering the specialty.
            var candidates = await _spStore.GetMatchCandidatesAsync(specialty, 200);

            // Capacity re-checked in memory (unlimited when max <= 0).
            candidates = candidates
                .Where(c => c.MaximumConcurrentOrders <= 0 || c.CurrentActiveOrders < c.MaximumConcurrentOrders)
                .ToList();
            if (candidates.Count == 0) return new List<SpMatch>();

            var professionals = await _professionalStore.GetByUserIdsAsync(candidates.Select(c => c.UserId));

            var matches = new List<SpMatch>();
            foreach (var record in candidates)
            {
                var user = await _users.FindByIdAsync(record.UserId);
                if (user is null) continue;
                professionals.TryGetValue(record.UserId, out var professional);
                matches.Add(new SpMatch
                {
                    User = user,
                    ScoreValue = ScoreRecord(record, professional, projectSector),
                });
            }

            return matches
                .OrderByDescending(m => m.ScoreValue)
                .Take(take)
                .ToList();
        }

        // score = sectorOverlap * 0.35 + rating * 0.25 + responseRate * 0.20 + tierNorm * 0.20
        internal static double ScoreRecord(
            ServiceProviderProfileRecord record,
            ProfessionalProfileRecord? professional,
            string projectSector)
        {
            double tierNorm = record.ProviderTier >= ProviderTier.Tier3 ? 1.0
                : record.ProviderTier == ProviderTier.Tier2 ? 0.7
                : 0.4;

            // rating: SP TrustScore is the sole trust source (never Trust_score).
            double rawTrust = record.TrustScore;
            double ratingNorm = rawTrust <= 0 ? 0.6 : rawTrust <= 5 ? rawTrust / 5.0 : Math.Min(rawTrust / 100.0, 1.0);

            var responseSignal = record.TrustBreakdown.ResponseRate;
            double responseRate = responseSignal.HasData
                ? Math.Clamp(responseSignal.Value / 100.0, 0, 1)
                : 0;

            var industries = professional?.Industries;
            double sectorOverlap;
            if (string.IsNullOrWhiteSpace(projectSector)) sectorOverlap = 0.7;
            else if (industries != null && industries.Any(s =>
                         s.Contains(projectSector, StringComparison.OrdinalIgnoreCase) ||
                         projectSector.Contains(s, StringComparison.OrdinalIgnoreCase)))
                sectorOverlap = 1.0;
            else sectorOverlap = 0.4;

            return sectorOverlap * 0.35 + ratingNorm * 0.25 + responseRate * 0.20 + tierNorm * 0.20;
        }

        /// <summary>
        /// Legacy embedded-shape scoring, kept for existing callers that hold an
        /// ApplicationUser (Creator designer cards). No longer used by MatchAsync.
        /// </summary>
        public double Score(ApplicationUser u, string projectSector)
        {
            var sp = u.ServiceProviderProfile ?? new ServiceProviderProfile();

            double tierNorm = u.Tier_level >= 3 ? 1.0 : u.Tier_level == 2 ? 0.7 : 0.4;
            double rawTrust = sp.TrustScore;
            double ratingNorm = rawTrust <= 0 ? 0.6 : rawTrust <= 5 ? rawTrust / 5.0 : Math.Min(rawTrust / 100.0, 1.0);

            var responseSignal = sp.TrustBreakdown.ResponseRate;
            double responseRate = responseSignal.HasData
                ? Math.Clamp(responseSignal.Value / 100.0, 0, 1)
                : 0;

            double sectorOverlap;
            if (string.IsNullOrWhiteSpace(projectSector)) sectorOverlap = 0.7;
            else if (sp.Industries != null && sp.Industries.Any(s =>
                         s.Contains(projectSector, StringComparison.OrdinalIgnoreCase) ||
                         projectSector.Contains(s, StringComparison.OrdinalIgnoreCase)))
                sectorOverlap = 1.0;
            else sectorOverlap = 0.4;

            return sectorOverlap * 0.35 + ratingNorm * 0.25 + responseRate * 0.20 + tierNorm * 0.20;
        }

        /// <summary>Split-record eligibility (matching source of truth after cutover).</summary>
        public static bool IsEligibleCandidate(ServiceProviderProfileRecord record, ServiceCategory specialty) =>
            record.VerificationStatus == ServiceProviderVerificationStatus.Verified &&
            record.ProviderTier >= ProviderTier.Tier2 &&
            record.ServiceCategories.Contains(specialty) && record.NewOrderAvailability &&
            (record.MaximumConcurrentOrders <= 0 || record.CurrentActiveOrders < record.MaximumConcurrentOrders);

        /// <summary>Legacy embedded-shape eligibility, kept for existing tests/views.</summary>
        public static bool IsEligibleCandidate(ApplicationUser u, ServiceCategory specialty)
        {
            var p = u.ServiceProviderProfile;
            return p is not null && p.VerificationStatus == ServiceProviderVerificationStatus.Verified &&
                p.ServiceCategories.Contains(specialty) && p.NewOrderAvailability &&
                (p.MaximumConcurrentOrders <= 0 || p.CurrentActiveOrders < p.MaximumConcurrentOrders);
        }
    }
}
