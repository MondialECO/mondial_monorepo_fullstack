using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations
{
    public class SmartMatchingService : ISmartMatchingService
    {
        private readonly MongoDbContext _context;
        public SmartMatchingService(MongoDbContext context) => _context = context;

        public async Task<List<SmartMatch>> MatchAsync(CreatorJourney journey, string creatorCountry, int phaseContext)
        {
            // phaseContext 6 → investor pool. phaseContext 5 → buyer pool, which does
            // not exist yet → honest empty list (NOT a stub, NOT mock candidates).
            if (phaseContext != 6) return new List<SmartMatch>();

            // Demo/catalogue entries have no linked platform user and must not be
            // represented to creators as live investor matches.
            var investors = await _context.Investors.Find(i => i.IsActive && i.LinkedUserId != null).Limit(200).ToListAsync();
            if (investors.Count == 0) return new List<SmartMatch>();

            var p = journey.Project ?? new CreatorJourneyProject();
            var p3 = journey.Phase3Data ?? new CreatorPhase3Data();
            decimal totalAsk = journey.Phase5Data?.PathB?.SeedFunding?.TotalAsk ?? 0;

            // Completeness bonus (max +6), independent of candidate.
            double bonus =
                (!string.IsNullOrEmpty(p3.BusinessPlanSessionId) ? 2 : 0) +
                ((p3.LegalChecklist?.CompletedCount ?? 0) > 4 ? 2 : 0) +
                (!string.IsNullOrEmpty(p.Branding?.BrandingMethod) && p.Branding.BrandingMethod != "pending" ? 2 : 0);

            var matches = investors.Select(inv =>
            {
                double sector = Overlap(inv.PreferredSectors, p.Sector);
                double stage = Overlap(inv.PreferredStages, "seed"); // creators raise a seed round
                double geo = Overlap(inv.PreferredGeographies, creatorCountry);
                double ticket = TicketScore((double)totalAsk, inv.MinCheckSize, inv.MaxCheckSize);
                double overall = sector * 0.40 + stage * 0.30 + geo * 0.20 + ticket * 0.10;
                double final = Math.Min(100, Math.Round(overall + bonus, 1));

                return new SmartMatch
                {
                    CandidateId = inv.Id,
                    LinkedUserId = inv.LinkedUserId, // null for demo/admin catalog investors
                    Name = inv.Name,
                    Type = inv.Type,
                    FinalScore = final,
                    Breakdown = new SmartMatchBreakdown { SectorMatch = sector, StageMatch = stage, GeographyMatch = geo, TicketMatch = ticket },
                };
            })
            .OrderByDescending(m => m.FinalScore)
            .ToList();

            if (matches.Count > 0) matches[0].IsFeatured = true;
            return matches;
        }

        // overlap(preferences, value) → 100 match · 50 when prefs unset · 0 no match.
        private static double Overlap(List<string> prefs, string value)
        {
            if (prefs == null || prefs.Count == 0) return 50;
            if (string.IsNullOrWhiteSpace(value)) return 0;
            return prefs.Any(s => s.Contains(value, StringComparison.OrdinalIgnoreCase) ||
                                  value.Contains(s, StringComparison.OrdinalIgnoreCase)) ? 100 : 0;
        }

        // 100 within range · 70 within 20% · 40 within 50% · else 0.
        private static double TicketScore(double ask, double min, double max)
        {
            if (ask <= 0 || max <= 0) return 0;
            if (ask >= min && ask <= max) return 100;
            double nearest = ask < min ? min : max;
            double drift = Math.Abs(ask - nearest) / nearest;
            if (drift <= 0.20) return 70;
            if (drift <= 0.50) return 40;
            return 0;
        }
    }
}
