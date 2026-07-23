using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.Repository;

namespace WebApp.Services.Migrations
{
    /// <summary>
    /// STEP 1 (additive, one-time, idempotent) multi-idea backfill. For each existing
    /// <see cref="CreatorJourney"/> that hasn't been migrated yet, mints an idea anchor,
    /// creates one mirrored <see cref="CreatorIdea"/> (Project + Phase2-5 +
    /// Phase6 SmartMatchmaking), stamps that anchor onto the journey's linked AI sessions'
    /// <c>BusinessIdeaId</c>, and records <c>ActiveIdeaId</c> (and <c>LeveledUpIdeaId</c>)
    /// back on the journey.
    ///
    /// Nothing reads the new collection yet, so the running app is unaffected. Safe to
    /// run on every boot: a journey with a non-null <c>ActiveIdeaId</c> is skipped.
    /// </summary>
    public interface ICreatorIdeaBackfill
    {
        /// <summary>Runs the backfill. Returns the number of journeys migrated this run.</summary>
        Task<int> RunAsync();
    }

    public class CreatorIdeaBackfillMigration : ICreatorIdeaBackfill
    {
        private readonly MongoDbContext _context;
        private readonly ICreatorIdeaStore _ideas;
        private readonly IMongoDatabase _database;
        private readonly ILogger<CreatorIdeaBackfillMigration> _logger;

        public CreatorIdeaBackfillMigration(
            MongoDbContext context,
            ICreatorIdeaStore ideas,
            IMongoDatabase database,
            ILogger<CreatorIdeaBackfillMigration> logger)
        {
            _context = context;
            _ideas = ideas;
            _database = database;
            _logger = logger;
        }

        public async Task<int> RunAsync()
        {
            var journeys = await _context.CreatorJourneys.Find(_ => true).ToListAsync();
            var migrated = 0;

            foreach (var j in journeys)
            {
                // Idempotency guard — already migrated.
                if (!string.IsNullOrEmpty(j.ActiveIdeaId))
                    continue;

                var ideaId = ObjectId.GenerateNewId().ToString();

                var idea = new CreatorIdea
                {
                    Id = ideaId,
                    UserId = j.UserId,
                    Status = "active",
                    Project = j.Project ?? new CreatorJourneyProject(),
                    Phase2Data = j.Phase2Data ?? new CreatorPhase2Data(),
                    Phase3Data = j.Phase3Data ?? new CreatorPhase3Data(),
                    Phase4Data = j.Phase4Data ?? new CreatorPhase4Data(),
                    Phase5Data = j.Phase5Data ?? new CreatorPhase5Data(),
                    SmartMatchmaking = j.Phase6Data?.SmartMatchmaking ?? new CreatorSmartMatchmaking(),
                    // STEP 3.5: any journey backfilled from now on carries its version
                    // history too. (The 9 already-migrated journeys are handled by the
                    // separate snapshots follow-up — this guard never re-fires for them.)
                    OutputSnapshots = j.OutputSnapshots ?? new CreatorOutputSnapshots(),
                    CreatedAt = j.CreatedAt,
                    UpdatedAt = j.UpdatedAt,
                    LastActiveAt = j.UpdatedAt,
                };
                await _ideas.AddAsync(idea);

                // Stamp the anchor onto the journey's linked sessions (exact ids only).
                await StampAsync<ClarifierSession>("ClarifierSessions", j.Phase2Data?.ClarifierSessionId, j.UserId, ideaId);
                await StampAsync<BusinessPlanSession>("BusinessPlanSessions", j.Phase3Data?.BusinessPlanSessionId, j.UserId, ideaId);
                await StampAsync<ForecastSession>("ForecastSessions", j.Phase3Data?.ForecastSessionId, j.UserId, ideaId);

                // Record the pointer(s) on the journey. Level-Up marker stays user-level.
                var update = Builders<CreatorJourney>.Update.Set(x => x.ActiveIdeaId, ideaId);
                if (j.Phase6Data?.LevelUpTriggered == true)
                    update = update.Set(x => x.LeveledUpIdeaId, ideaId);

                await _context.CreatorJourneys.UpdateOneAsync(x => x.Id == j.Id, update);
                migrated++;
                _logger.LogInformation("CreatorIdea backfill: journey {JourneyId} -> idea {IdeaId}", j.Id, ideaId);
            }

            return migrated;
        }

        /// <summary>
        /// Set <c>BusinessIdeaId = ideaId</c> on one owned session by id. A session id
        /// that no longer resolves is skipped + logged — never fails the whole run.
        /// </summary>
        private async Task StampAsync<T>(string collectionName, string? sessionId, string ownerUserId, string ideaId)
        {
            if (string.IsNullOrEmpty(sessionId))
                return;

            if (!ObjectId.TryParse(sessionId, out var sessionOid))
            {
                _logger.LogWarning("CreatorIdea backfill: {Collection} id '{SessionId}' is not a valid ObjectId — skipped.",
                    collectionName, sessionId);
                return;
            }

            var col = _database.GetCollection<T>(collectionName);
            var filter = Builders<T>.Filter.And(
                Builders<T>.Filter.Eq("_id", sessionOid),
                Builders<T>.Filter.Eq("OwnerUserId", ownerUserId));
            var update = Builders<T>.Update.Set("BusinessIdeaId", new ObjectId(ideaId));

            var res = await col.UpdateOneAsync(filter, update);
            if (res.MatchedCount == 0)
                _logger.LogWarning("CreatorIdea backfill: {Collection} session {SessionId} did not resolve for user {UserId} — skipped.",
                    collectionName, sessionId, ownerUserId);
        }
    }
}
