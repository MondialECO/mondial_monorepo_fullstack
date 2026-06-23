using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Interface
{
    /// <summary>
    /// One shared smart-matching formula used by Phase 5 (buyers, phaseContext=5)
    /// and Phase 6 (investors, phaseContext=6). Back-fills the P1.10 stubs.
    ///   overall = sector×0.40 + stage×0.30 + geography×0.20 + ticket×0.10
    ///   + completeness bonus (max +6); finalScore = min(100, overall + bonus).
    /// Empty pool → empty list (honest empty state), never mock candidates.
    /// </summary>
    public interface ISmartMatchingService
    {
        Task<List<SmartMatch>> MatchAsync(CreatorJourney journey, string creatorCountry, int phaseContext);
    }

    public sealed class SmartMatch
    {
        public string CandidateId { get; set; }
        // The chat-addressable ApplicationUser behind this investor (Investor.LinkedUserId).
        // Populated for investors created from a real Investor-role signup; null for
        // admin-curated/demo catalog entries → the UI marks those "not reachable yet".
        public string LinkedUserId { get; set; }
        public string Name { get; set; }
        public string Type { get; set; }
        public double FinalScore { get; set; }
        public bool IsFeatured { get; set; }
        public SmartMatchBreakdown Breakdown { get; set; } = new();
    }

    public sealed class SmartMatchBreakdown
    {
        public double SectorMatch { get; set; }
        public double StageMatch { get; set; }
        public double GeographyMatch { get; set; }
        public double TicketMatch { get; set; }
    }
}
