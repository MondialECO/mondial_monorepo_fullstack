using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Repository;

namespace WebApp.Services.Migrations
{
    /// <summary>
    /// STEP 3.5 follow-up backfill (additive, one-time, idempotent). The step-1 backfill
    /// created the idea documents BEFORE OutputSnapshots moved per-idea, and its
    /// ActiveIdeaId guard has already fired for those journeys — so this separate pass
    /// copies each journey's version history wholesale onto its active idea. The
    /// journey's copy stays in place (nothing removed until cutover proves out).
    ///
    /// Guard: only copies when the journey HAS snapshots and the idea has NONE — safe on
    /// every boot, never double-copies, and never overwrites an idea that already
    /// accrued its own history post-cutover.
    /// </summary>
    public interface ICreatorIdeaSnapshotsBackfill
    {
        /// <summary>Runs the copy. Returns the number of ideas that received snapshots.</summary>
        Task<int> RunAsync();
    }

    public class CreatorIdeaSnapshotsBackfillMigration : ICreatorIdeaSnapshotsBackfill
    {
        private readonly MongoDbContext _context;
        private readonly ICreatorIdeaStore _ideas;
        private readonly ILogger<CreatorIdeaSnapshotsBackfillMigration> _logger;

        public CreatorIdeaSnapshotsBackfillMigration(
            MongoDbContext context,
            ICreatorIdeaStore ideas,
            ILogger<CreatorIdeaSnapshotsBackfillMigration> logger)
        {
            _context = context;
            _ideas = ideas;
            _logger = logger;
        }

        public async Task<int> RunAsync()
        {
            var journeys = await _context.CreatorJourneys.Find(_ => true).ToListAsync();
            var copied = 0;

            foreach (var j in journeys)
            {
                // Nothing to copy → no-op.
                if (!HasAny(j.OutputSnapshots))
                    continue;

                // Shouldn't exist after step 1, but never fail the run on it.
                if (string.IsNullOrEmpty(j.ActiveIdeaId))
                {
                    _logger.LogWarning("Snapshots backfill: journey {JourneyId} has snapshots but no ActiveIdeaId — skipped.", j.Id);
                    continue;
                }

                var idea = await _ideas.GetOwnedAsync(j.ActiveIdeaId, j.UserId);
                if (idea == null)
                {
                    _logger.LogWarning("Snapshots backfill: journey {JourneyId} ActiveIdeaId {IdeaId} did not resolve — skipped.", j.Id, j.ActiveIdeaId);
                    continue;
                }

                // Idempotency guard — the idea already has history (this run before, a
                // step-3.5-aware mint, or its own post-cutover appends). Never overwrite.
                if (HasAny(idea.OutputSnapshots))
                    continue;

                await _ideas.SetOutputSnapshotsAsync(idea.Id, j.UserId, j.OutputSnapshots);
                copied++;
                _logger.LogInformation("Snapshots backfill: journey {JourneyId} -> idea {IdeaId}.", j.Id, idea.Id);
            }

            return copied;
        }

        /// <summary>True when any of the nine version arrays has at least one entry.</summary>
        private static bool HasAny(CreatorOutputSnapshots s) =>
            s != null &&
            ((s.ForecastVersions?.Count ?? 0) > 0 ||
             (s.BusinessPlanVersions?.Count ?? 0) > 0 ||
             (s.IpValuationVersions?.Count ?? 0) > 0 ||
             (s.LegalChecklistVersions?.Count ?? 0) > 0 ||
             (s.FormationVersions?.Count ?? 0) > 0 ||
             (s.PricingVersions?.Count ?? 0) > 0 ||
             (s.ResourcePlanVersions?.Count ?? 0) > 0 ||
             (s.GtmPlanVersions?.Count ?? 0) > 0 ||
             (s.MatchingRuns?.Count ?? 0) > 0);
    }
}
