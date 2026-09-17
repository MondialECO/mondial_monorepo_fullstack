using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.Models.DatabaseModels.Ai;

namespace WebApp.Services.Repository.Ai
{
    /// <summary>
    /// Lifecycle seam over the <c>MarketStudySessions</c> collection.
    /// </summary>
    public interface IMarketStudySessionStore
    {
        Task AddAsync(MarketStudySession session);
        Task<MarketStudySession?> GetOwnedAsync(string id, string ownerUserId);
        Task<MarketStudySession?> GetByRequestAsync(string requestId, string ownerUserId);
        Task<List<MarketStudySession>> ListByOwnerAsync(string ownerUserId, int skip, int limit);
        Task<List<MarketStudySession>> ListByClarifierAsync(string clarifierSessionId, string ownerUserId, int skip, int limit);
        Task<List<MarketStudySession>> ListByIdeaAsync(string businessIdeaId, string ownerUserId, int skip, int limit);
        Task SetRequestIdAsync(string id, string requestId);
        Task SetProcessingAsync(string id);
        Task AppendGeneratedVersionAsync(string id, BsonDocument content, string requestId);
        Task EditCurrentVersionAsync(string id, int versionNumber, BsonDocument content);
        Task SetNeedsReviewAsync(string id, string error);
        Task SetFailedAsync(string id, string error);
        Task ReleaseLockAsync(string id, string status = "Completed");
        Task DeleteAsync(string id);
        Task<(bool Created, MarketStudySession Session)> TryCreateInFlightAsync(MarketStudySession session);
        Task<MarketStudySession?> FindInFlightByClarifierAsync(string ownerUserId, string clarifierSessionId);
        Task<(bool Acquired, MarketStudySession? Session)> TryAcquireRegenerateLockAsync(string id, string ownerUserId);
    }

    /// <summary>
    /// Repository for the <c>MarketStudySessions</c> collection.
    /// </summary>
    public class MarketStudySessionRepository : MongoRepository<MarketStudySession>, IMarketStudySessionStore
    {
        public MarketStudySessionRepository(IMongoDatabase database) : base(database, "MarketStudySessions")
        {
            CreateIndexesAsync().GetAwaiter().GetResult();
        }

        private async Task CreateIndexesAsync()
        {
            await _collection.Indexes.CreateManyAsync(new[]
            {
                new CreateIndexModel<MarketStudySession>(
                    Builders<MarketStudySession>.IndexKeys
                        .Ascending(x => x.OwnerUserId)
                        .Descending(x => x.CreatedAt),
                    new CreateIndexOptions { Name = "Owner_CreatedAt" }),

                new CreateIndexModel<MarketStudySession>(
                    Builders<MarketStudySession>.IndexKeys.Ascending(x => x.ClarifierSessionId),
                    new CreateIndexOptions { Name = "ClarifierSessionId" }),

                new CreateIndexModel<MarketStudySession>(
                    Builders<MarketStudySession>.IndexKeys.Ascending(x => x.BusinessIdeaId),
                    new CreateIndexOptions { Name = "BusinessIdeaId" }),

                new CreateIndexModel<MarketStudySession>(
                    Builders<MarketStudySession>.IndexKeys.Ascending(x => x.RequestId),
                    new CreateIndexOptions { Name = "RequestId" }),

                new CreateIndexModel<MarketStudySession>(
                    Builders<MarketStudySession>.IndexKeys.Ascending(x => x.InFlightKey),
                    new CreateIndexOptions<MarketStudySession>
                    {
                        Name = "InFlightKey_Unique",
                        Unique = true,
                        PartialFilterExpression = Builders<MarketStudySession>.Filter.Type(x => x.InFlightKey, BsonType.String)
                    }),
            });
        }

        public async Task<MarketStudySession?> GetOwnedAsync(string id, string ownerUserId) =>
            await _collection.Find(x => x.Id == id && x.OwnerUserId == ownerUserId).FirstOrDefaultAsync();

        public async Task<MarketStudySession?> GetByRequestAsync(string requestId, string ownerUserId) =>
            await _collection.Find(x => x.RequestId == requestId && x.OwnerUserId == ownerUserId).FirstOrDefaultAsync();

        public async Task<List<MarketStudySession>> ListByOwnerAsync(string ownerUserId, int skip, int limit) =>
            await _collection.Find(x => x.OwnerUserId == ownerUserId)
                .SortByDescending(x => x.CreatedAt)
                .Skip(skip)
                .Limit(limit)
                .ToListAsync();

        public async Task<List<MarketStudySession>> ListByClarifierAsync(string clarifierSessionId, string ownerUserId, int skip, int limit) =>
            await _collection.Find(x => x.ClarifierSessionId == clarifierSessionId && x.OwnerUserId == ownerUserId)
                .SortByDescending(x => x.CreatedAt)
                .Skip(skip)
                .Limit(limit)
                .ToListAsync();

        public async Task<List<MarketStudySession>> ListByIdeaAsync(string businessIdeaId, string ownerUserId, int skip, int limit) =>
            await _collection.Find(x => x.BusinessIdeaId == businessIdeaId && x.OwnerUserId == ownerUserId)
                .SortByDescending(x => x.CreatedAt)
                .Skip(skip)
                .Limit(limit)
                .ToListAsync();

        public async Task SetRequestIdAsync(string id, string requestId)
        {
            var update = Builders<MarketStudySession>.Update
                .Set(x => x.RequestId, requestId)
                .Set(x => x.UpdatedAt, DateTime.UtcNow);
            await _collection.UpdateOneAsync(x => x.Id == id, update);
        }

        public async Task SetProcessingAsync(string id)
        {
            var update = Builders<MarketStudySession>.Update
                .Set(x => x.Status, "Processing")
                .Set(x => x.UpdatedAt, DateTime.UtcNow);
            await _collection.UpdateOneAsync(x => x.Id == id, update);
        }

        public async Task AppendGeneratedVersionAsync(string id, BsonDocument content, string requestId)
        {
            var session = await _collection.Find(x => x.Id == id).FirstOrDefaultAsync()
                ?? throw new KeyNotFoundException($"MarketStudySession {id} not found.");

            var newVersionNumber = session.CurrentVersion + 1;
            var now = DateTime.UtcNow;

            var version = new MarketStudyVersion
            {
                Version = newVersionNumber,
                GeneratedContent = content,
                Content = (BsonDocument)content.DeepClone(),
                RequestId = requestId,
                IsEdited = false,
                CreatedAt = now,
                UpdatedAt = now,
            };

            var update = Builders<MarketStudySession>.Update
                .Push(x => x.Versions, version)
                .Set(x => x.CurrentVersion, newVersionNumber)
                .Set(x => x.Status, "Completed")
                .Set(x => x.Error, null)
                .Set(x => x.InFlightKey, null)
                .Set(x => x.UpdatedAt, now);

            await _collection.UpdateOneAsync(x => x.Id == id, update);
        }

        public async Task EditCurrentVersionAsync(string id, int versionNumber, BsonDocument content)
        {
            var session = await _collection.Find(x => x.Id == id).FirstOrDefaultAsync()
                ?? throw new KeyNotFoundException($"MarketStudySession {id} not found.");

            var index = session.Versions.FindIndex(v => v.Version == versionNumber);
            if (index < 0)
                throw new KeyNotFoundException($"Version {versionNumber} not found on MarketStudySession {id}.");

            var now = DateTime.UtcNow;
            var update = Builders<MarketStudySession>.Update
                .Set($"Versions.{index}.Content", content)
                .Set($"Versions.{index}.IsEdited", true)
                .Set($"Versions.{index}.UpdatedAt", now)
                .Set(x => x.UpdatedAt, now);

            await _collection.UpdateOneAsync(x => x.Id == id, update);
        }

        public async Task SetNeedsReviewAsync(string id, string error)
        {
            var update = Builders<MarketStudySession>.Update
                .Set(x => x.Status, "NeedsReview")
                .Set(x => x.Error, error)
                .Set(x => x.InFlightKey, null)
                .Set(x => x.UpdatedAt, DateTime.UtcNow);
            await _collection.UpdateOneAsync(x => x.Id == id, update);
        }

        public async Task SetFailedAsync(string id, string error)
        {
            var update = Builders<MarketStudySession>.Update
                .Set(x => x.Status, "Failed")
                .Set(x => x.Error, error)
                .Set(x => x.InFlightKey, null)
                .Set(x => x.UpdatedAt, DateTime.UtcNow);
            await _collection.UpdateOneAsync(x => x.Id == id, update);
        }

        public async Task ReleaseLockAsync(string id, string status = "Completed")
        {
            var update = Builders<MarketStudySession>.Update
                .Set(x => x.Status, status)
                .Set(x => x.InFlightKey, null)
                .Set(x => x.UpdatedAt, DateTime.UtcNow);
            await _collection.UpdateOneAsync(x => x.Id == id, update);
        }

        public new async Task DeleteAsync(string id) =>
            await _collection.DeleteOneAsync(x => x.Id == id);

        public async Task<(bool Created, MarketStudySession Session)> TryCreateInFlightAsync(MarketStudySession session)
        {
            try
            {
                await _collection.InsertOneAsync(session);
                return (true, session);
            }
            catch (MongoWriteException ex) when (ex.WriteError?.Category == ServerErrorCategory.DuplicateKey)
            {
                var existing = await _collection
                    .Find(x => x.InFlightKey == session.InFlightKey)
                    .FirstOrDefaultAsync();

                if (existing != null) return (false, existing);
                throw;
            }
        }

        public async Task<MarketStudySession?> FindInFlightByClarifierAsync(string ownerUserId, string clarifierSessionId)
        {
            var staleThreshold = DateTime.UtcNow.AddMinutes(-5);
            return await _collection
                .Find(x => x.OwnerUserId == ownerUserId
                        && x.ClarifierSessionId == clarifierSessionId
                        && (x.Status == "Pending" || x.Status == "Processing")
                        && x.CreatedAt >= staleThreshold)
                .SortByDescending(x => x.CreatedAt)
                .FirstOrDefaultAsync();
        }

        public async Task<(bool Acquired, MarketStudySession? Session)> TryAcquireRegenerateLockAsync(string id, string ownerUserId)
        {
            var inFlightKey = $"MarketStudy:Regen:{id}";
            var filter = Builders<MarketStudySession>.Filter.And(
                Builders<MarketStudySession>.Filter.Eq(x => x.Id, id),
                Builders<MarketStudySession>.Filter.Eq(x => x.OwnerUserId, ownerUserId),
                Builders<MarketStudySession>.Filter.In(x => x.Status, new[] { "Completed", "Failed", "NeedsReview" }),
                Builders<MarketStudySession>.Filter.Eq(x => x.InFlightKey, null)
            );

            var update = Builders<MarketStudySession>.Update
                .Set(x => x.Status, "Processing")
                .Set(x => x.InFlightKey, inFlightKey)
                .Set(x => x.UpdatedAt, DateTime.UtcNow);

            var updated = await _collection.FindOneAndUpdateAsync(
                filter, update,
                new FindOneAndUpdateOptions<MarketStudySession> { ReturnDocument = ReturnDocument.After });

            return (updated != null, updated);
        }
    }
}
