using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.Models.DatabaseModels.Ai;

namespace WebApp.Services.Repository.Ai
{
    /// <summary>
    /// Lifecycle seam over the <c>ClarifierSessions</c> collection. Lets the
    /// Idea-Clarifier handler (and the C-2 API) be unit-tested without a live
    /// Mongo connection; implemented by <see cref="ClarifierSessionRepository"/>.
    /// </summary>
    public interface IClarifierSessionStore
    {
        Task AddAsync(ClarifierSession session);
        Task<ClarifierSession?> GetOwnedAsync(string id, string ownerUserId);
        Task<ClarifierSession?> GetByRequestAsync(string requestId, string ownerUserId);
        Task<List<ClarifierSession>> ListByOwnerAsync(string ownerUserId, int skip, int limit);
        Task<List<ClarifierSession>> ListByIdeaAsync(string businessIdeaId, string ownerUserId, int skip, int limit);
        Task SetRequestIdAsync(string id, string requestId);
        Task SetProcessingAsync(string id);
        Task SetCompletedAsync(string id, BsonDocument output, int? clarityScore);
        Task SetNeedsReviewAsync(string id, string error);
        Task SetFailedAsync(string id, string error);

        /// <summary>Atomically attempts to create a session guarded by unique InFlightKey. Returns (false, existing) if in flight.</summary>
        Task<(bool Created, ClarifierSession Session)> TryCreateInFlightAsync(ClarifierSession session);

        /// <summary>Finds an active, non-stale in-flight session for an idea.</summary>
        Task<ClarifierSession?> FindInFlightByIdeaAsync(string ownerUserId, string businessIdeaId);

        /// <summary>Stamp the idea anchor (CreatorIdea id) onto this clarifier. Multi-idea STEP 2.</summary>
        Task SetBusinessIdeaIdAsync(string id, string businessIdeaId);
    }

    /// <summary>
    /// Repository for the <c>ClarifierSessions</c> collection — the C-2 source of
    /// truth. Owner-scoped reads and lifecycle transitions mirror
    /// <see cref="AiRequestRepository"/>; the engine's request/response documents
    /// stay infrastructure-only.
    /// </summary>
    public class ClarifierSessionRepository : MongoRepository<ClarifierSession>, IClarifierSessionStore
    {
        public ClarifierSessionRepository(IMongoDatabase database) : base(database, "ClarifierSessions")
        {
            CreateIndexesAsync().GetAwaiter().GetResult();
        }

        private async Task CreateIndexesAsync()
        {
            await _collection.Indexes.CreateManyAsync(new[]
            {
                // Owner session history (newest first).
                new CreateIndexModel<ClarifierSession>(
                    Builders<ClarifierSession>.IndexKeys
                        .Ascending(x => x.OwnerUserId)
                        .Descending(x => x.CreatedAt),
                    new CreateIndexOptions { Name = "Owner_CreatedAt" }),

                // Sessions for a given business idea.
                new CreateIndexModel<ClarifierSession>(
                    Builders<ClarifierSession>.IndexKeys.Ascending(x => x.BusinessIdeaId),
                    new CreateIndexOptions { Name = "BusinessIdeaId" }),

                // Correlate back from the engine request.
                new CreateIndexModel<ClarifierSession>(
                    Builders<ClarifierSession>.IndexKeys.Ascending(x => x.RequestId),
                    new CreateIndexOptions { Name = "RequestId" }),

                // Atomic in-flight deduplication guard (unique when string present).
                new CreateIndexModel<ClarifierSession>(
                    Builders<ClarifierSession>.IndexKeys.Ascending(x => x.InFlightKey),
                    new CreateIndexOptions<ClarifierSession>
                    {
                        Name = "InFlightKey_Unique",
                        Unique = true,
                        PartialFilterExpression = Builders<ClarifierSession>.Filter.Type(x => x.InFlightKey, BsonType.String)
                    }),
            });
        }

        /// <summary>A session by id, owner-scoped (null if not owned).</summary>
        public async Task<ClarifierSession?> GetOwnedAsync(string id, string ownerUserId)
            => await _collection.Find(x => x.Id == id && x.OwnerUserId == ownerUserId).FirstOrDefaultAsync();

        /// <summary>The session driving an engine request (used by the handler), owner-scoped.</summary>
        public async Task<ClarifierSession?> GetByRequestAsync(string requestId, string ownerUserId)
            => await _collection.Find(x => x.RequestId == requestId && x.OwnerUserId == ownerUserId).FirstOrDefaultAsync();

        /// <summary>Owner's sessions, newest first, paged.</summary>
        public async Task<List<ClarifierSession>> ListByOwnerAsync(string ownerUserId, int skip, int limit)
            => await _collection.Find(x => x.OwnerUserId == ownerUserId)
                .SortByDescending(x => x.CreatedAt)
                .Skip(skip)
                .Limit(limit)
                .ToListAsync();

        /// <summary>Owner's sessions for one business idea, newest first.</summary>
        public async Task<List<ClarifierSession>> ListByIdeaAsync(string businessIdeaId, string ownerUserId, int skip, int limit)
            => await _collection.Find(x => x.BusinessIdeaId == businessIdeaId && x.OwnerUserId == ownerUserId)
                .SortByDescending(x => x.CreatedAt)
                .Skip(skip)
                .Limit(limit)
                .ToListAsync();

        /// <summary>Link the enqueued engine request to this session.</summary>
        public Task SetRequestIdAsync(string id, string requestId)
            => _collection.UpdateOneAsync(
                x => x.Id == id,
                Builders<ClarifierSession>.Update
                    .Set(x => x.RequestId, requestId)
                    .Set(x => x.UpdatedAt, DateTime.UtcNow));

        public Task SetProcessingAsync(string id)
            => _collection.UpdateOneAsync(
                x => x.Id == id,
                Builders<ClarifierSession>.Update
                    .Set(x => x.Status, "Processing")
                    .Set(x => x.UpdatedAt, DateTime.UtcNow));

        /// <summary>Terminal success: persist the parsed contract and denormalized score.</summary>
        public Task SetCompletedAsync(string id, BsonDocument output, int? clarityScore)
            => _collection.UpdateOneAsync(
                x => x.Id == id,
                Builders<ClarifierSession>.Update
                    .Set(x => x.Status, "Completed")
                    .Set(x => x.Output, output)
                    .Set(x => x.ClarityScore, clarityScore)
                    .Set(x => x.Error, null)
                    .Unset(x => x.InFlightKey)
                    .Set(x => x.UpdatedAt, DateTime.UtcNow));

        /// <summary>Model replied but the output could not be parsed/validated; raw kept on the response.</summary>
        public Task SetNeedsReviewAsync(string id, string error)
            => _collection.UpdateOneAsync(
                x => x.Id == id,
                Builders<ClarifierSession>.Update
                    .Set(x => x.Status, "NeedsReview")
                    .Set(x => x.Error, error)
                    .Unset(x => x.InFlightKey)
                    .Set(x => x.UpdatedAt, DateTime.UtcNow));

        public Task SetFailedAsync(string id, string error)
            => _collection.UpdateOneAsync(
                x => x.Id == id,
                Builders<ClarifierSession>.Update
                    .Set(x => x.Status, "Failed")
                    .Set(x => x.Error, error)
                    .Unset(x => x.InFlightKey)
                    .Set(x => x.UpdatedAt, DateTime.UtcNow));

        public async Task<ClarifierSession?> FindInFlightByIdeaAsync(string ownerUserId, string businessIdeaId)
        {
            var staleCutoff = DateTime.UtcNow.AddMinutes(-5);
            return await _collection.Find(x =>
                x.OwnerUserId == ownerUserId
                && x.BusinessIdeaId == businessIdeaId
                && (x.Status == "Pending" || x.Status == "Processing")
                && x.UpdatedAt > staleCutoff)
                .SortByDescending(x => x.CreatedAt)
                .FirstOrDefaultAsync();
        }

        public async Task<(bool Created, ClarifierSession Session)> TryCreateInFlightAsync(ClarifierSession session)
        {
            try
            {
                await _collection.InsertOneAsync(session);
                return (true, session);
            }
            catch (MongoWriteException ex) when (ex.WriteError?.Category == ServerErrorCategory.DuplicateKey)
            {
                var existing = await FindInFlightByIdeaAsync(session.OwnerUserId, session.BusinessIdeaId ?? "");
                if (existing != null)
                {
                    return (false, existing);
                }

                // If duplicate key was hit from an expired/stale record, retry with fresh ID without inFlightKey
                session.Id = ObjectId.GenerateNewId().ToString();
                session.InFlightKey = null;
                await _collection.InsertOneAsync(session);
                return (true, session);
            }
        }

        // Multi-idea STEP 2: BusinessIdeaId carries [BsonRepresentation(ObjectId)], so the
        // typed Set serializes the 24-hex string as an ObjectId (matches the backfill).
        public Task SetBusinessIdeaIdAsync(string id, string businessIdeaId)
            => _collection.UpdateOneAsync(
                x => x.Id == id,
                Builders<ClarifierSession>.Update
                    .Set(x => x.BusinessIdeaId, businessIdeaId)
                    .Set(x => x.UpdatedAt, DateTime.UtcNow));
    }
}
