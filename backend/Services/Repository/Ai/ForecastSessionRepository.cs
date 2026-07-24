using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.Models.DatabaseModels.Ai;

namespace WebApp.Services.Repository.Ai
{
    /// <summary>
    /// Lifecycle seam over the <c>ForecastSessions</c> collection. Lets the Forecast
    /// handler (and the C-4 API) be unit-tested without a live Mongo connection;
    /// implemented by <see cref="ForecastSessionRepository"/>.
    /// </summary>
    public interface IForecastSessionStore
    {
        Task AddAsync(ForecastSession session);
        Task<ForecastSession?> GetOwnedAsync(string id, string ownerUserId);
        Task<ForecastSession?> GetByRequestAsync(string requestId, string ownerUserId);
        Task<List<ForecastSession>> ListByOwnerAsync(string ownerUserId, int skip, int limit);
        Task<List<ForecastSession>> ListByBusinessPlanAsync(string businessPlanSessionId, string ownerUserId, int skip, int limit);
        Task SetRequestIdAsync(string id, string requestId);
        Task SetProcessingAsync(string id);

        /// <summary>Terminal success: append an immutable generated version and make it current.</summary>
        Task AppendGeneratedVersionAsync(string id, BsonDocument content, string requestId);

        /// <summary>Edit the current version's editable content in place (no AI run).</summary>
        Task EditCurrentVersionAsync(string id, int versionNumber, BsonDocument content);

        Task SetNeedsReviewAsync(string id, string error);
        Task SetFailedAsync(string id, string error);
    }

    /// <summary>
    /// Repository for the <c>ForecastSessions</c> collection — the C-4 source of
    /// truth. Owner-scoped reads and lifecycle transitions mirror
    /// <see cref="BusinessPlanSessionRepository"/>: generation is append-only —
    /// <see cref="AppendGeneratedVersionAsync"/> never overwrites prior versions, and
    /// <see cref="EditCurrentVersionAsync"/> mutates only the current version's
    /// editable copy. The engine's request/response documents stay infrastructure-only.
    /// </summary>
    public class ForecastSessionRepository : MongoRepository<ForecastSession>, IForecastSessionStore
    {
        public ForecastSessionRepository(IMongoDatabase database) : base(database, "ForecastSessions")
        {
            CreateIndexesAsync().GetAwaiter().GetResult();
        }

        private async Task CreateIndexesAsync()
        {
            await _collection.Indexes.CreateManyAsync(new[]
            {
                // Owner session history (newest first).
                new CreateIndexModel<ForecastSession>(
                    Builders<ForecastSession>.IndexKeys
                        .Ascending(x => x.OwnerUserId)
                        .Descending(x => x.CreatedAt),
                    new CreateIndexOptions { Name = "Owner_CreatedAt" }),

                // Forecasts derived from a given business-plan session (authoritative parent).
                new CreateIndexModel<ForecastSession>(
                    Builders<ForecastSession>.IndexKeys.Ascending(x => x.BusinessPlanSessionId),
                    new CreateIndexOptions { Name = "BusinessPlanSessionId" }),

                // Correlate back from the engine request.
                new CreateIndexModel<ForecastSession>(
                    Builders<ForecastSession>.IndexKeys.Ascending(x => x.RequestId),
                    new CreateIndexOptions { Name = "RequestId" }),
            });
        }

        /// <summary>A session by id, owner-scoped (null if not owned).</summary>
        public async Task<ForecastSession?> GetOwnedAsync(string id, string ownerUserId)
            => await _collection.Find(x => x.Id == id && x.OwnerUserId == ownerUserId).FirstOrDefaultAsync();

        /// <summary>The session driving an engine request (used by the handler), owner-scoped.</summary>
        public async Task<ForecastSession?> GetByRequestAsync(string requestId, string ownerUserId)
            => await _collection.Find(x => x.RequestId == requestId && x.OwnerUserId == ownerUserId).FirstOrDefaultAsync();

        /// <summary>Owner's sessions, newest first, paged.</summary>
        public async Task<List<ForecastSession>> ListByOwnerAsync(string ownerUserId, int skip, int limit)
            => await _collection.Find(x => x.OwnerUserId == ownerUserId)
                .SortByDescending(x => x.CreatedAt)
                .Skip(skip)
                .Limit(limit)
                .ToListAsync();

        /// <summary>Owner's forecasts derived from one business-plan session, newest first.</summary>
        public async Task<List<ForecastSession>> ListByBusinessPlanAsync(string businessPlanSessionId, string ownerUserId, int skip, int limit)
            => await _collection.Find(x => x.BusinessPlanSessionId == businessPlanSessionId && x.OwnerUserId == ownerUserId)
                .SortByDescending(x => x.CreatedAt)
                .Skip(skip)
                .Limit(limit)
                .ToListAsync();

        /// <summary>Link the (latest) enqueued engine request to this session.</summary>
        public Task SetRequestIdAsync(string id, string requestId)
            => _collection.UpdateOneAsync(
                x => x.Id == id,
                Builders<ForecastSession>.Update
                    .Set(x => x.RequestId, requestId)
                    .Set(x => x.UpdatedAt, DateTime.UtcNow));

        public Task SetProcessingAsync(string id)
            => _collection.UpdateOneAsync(
                x => x.Id == id,
                Builders<ForecastSession>.Update
                    .Set(x => x.Status, "Processing")
                    .Set(x => x.UpdatedAt, DateTime.UtcNow));

        /// <summary>
        /// Terminal success: append an immutable generated version (history is never
        /// overwritten) and point <c>CurrentVersion</c> at it. The new version number
        /// is one past the highest existing version.
        /// </summary>
        public async Task AppendGeneratedVersionAsync(string id, BsonDocument content, string requestId)
        {
            var session = await _collection.Find(x => x.Id == id).FirstOrDefaultAsync();
            if (session is null)
                return;

            var nextVersion = session.Versions.Count == 0 ? 1 : session.Versions.Max(v => v.Version) + 1;
            var now = DateTime.UtcNow;

            var version = new ForecastVersion
            {
                Version = nextVersion,
                GeneratedContent = content,
                Content = (BsonDocument)content.DeepClone(), // editable copy starts == generated
                RequestId = requestId,
                IsEdited = false,
                CreatedAt = now,
                UpdatedAt = now,
            };

            await _collection.UpdateOneAsync(
                x => x.Id == id,
                Builders<ForecastSession>.Update
                    .Push(x => x.Versions, version)
                    .Set(x => x.CurrentVersion, nextVersion)
                    .Set(x => x.Status, "Completed")
                    .Set(x => x.Error, null)
                    .Set(x => x.UpdatedAt, now));
        }

        /// <summary>
        /// Edit the current version's editable content in place (no AI run). Only the
        /// matching version's <c>Content</c> is touched via a positional array filter;
        /// its immutable generated snapshot and all other versions are untouched.
        /// </summary>
        public Task EditCurrentVersionAsync(string id, int versionNumber, BsonDocument content)
        {
            var now = DateTime.UtcNow;
            var update = Builders<ForecastSession>.Update
                .Set("Versions.$[v].Content", content)
                .Set("Versions.$[v].IsEdited", true)
                .Set("Versions.$[v].UpdatedAt", now)
                .Set(x => x.UpdatedAt, now);

            var options = new UpdateOptions
            {
                ArrayFilters = new[]
                {
                    new BsonDocumentArrayFilterDefinition<BsonDocument>(
                        new BsonDocument("v.Version", versionNumber)),
                },
            };

            return _collection.UpdateOneAsync(
                Builders<ForecastSession>.Filter.Eq(x => x.Id, id), update, options);
        }

        /// <summary>Model replied but the output could not be parsed/validated; raw kept on the response.</summary>
        public async Task SetNeedsReviewAsync(string id, string error)
        {
            if (await TryRestoreCompletedAsync(id, error)) return;
            await _collection.UpdateOneAsync(
                x => x.Id == id,
                Builders<ForecastSession>.Update
                    .Set(x => x.Status, "NeedsReview")
                    .Set(x => x.Error, error)
                    .Set(x => x.UpdatedAt, DateTime.UtcNow));
        }

        public async Task SetFailedAsync(string id, string error)
        {
            if (await TryRestoreCompletedAsync(id, error)) return;
            await _collection.UpdateOneAsync(
                x => x.Id == id,
                Builders<ForecastSession>.Update
                    .Set(x => x.Status, "Failed")
                    .Set(x => x.Error, error)
                    .Set(x => x.UpdatedAt, DateTime.UtcNow));
        }

        /// <summary>
        /// REPOSITORY-LEVEL GUARD — mirrors BusinessPlanSessionRepository: a forecast
        /// that has ever completed (CurrentVersion &gt; 0) is never downgraded by a
        /// failed regenerate; restore Completed + record the error. Initial
        /// generations keep terminal Failed/NeedsReview semantics.
        /// </summary>
        private async Task<bool> TryRestoreCompletedAsync(string id, string error)
        {
            var res = await _collection.UpdateOneAsync(
                x => x.Id == id && x.CurrentVersion > 0,
                Builders<ForecastSession>.Update
                    .Set(x => x.Status, "Completed")
                    .Set(x => x.Error, error)
                    .Set(x => x.UpdatedAt, DateTime.UtcNow));
            return res.MatchedCount > 0;
        }
    }
}
