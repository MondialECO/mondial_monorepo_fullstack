using MongoDB.Driver;
using WebApp.Models.DatabaseModels.Ai;

namespace WebApp.Services.Repository.Ai
{
    /// <summary>Repository for the <c>AIRequests</c> collection.</summary>
    public class AiRequestRepository : MongoRepository<AiRequest>
    {
        public AiRequestRepository(IMongoDatabase database) : base(database, "AIRequests")
        {
            CreateIndexesAsync().GetAwaiter().GetResult();
        }

        private async Task CreateIndexesAsync()
        {
            await _collection.Indexes.CreateManyAsync(new[]
            {
                // Owner job list (newest first).
                new CreateIndexModel<AiRequest>(
                    Builders<AiRequest>.IndexKeys
                        .Ascending(x => x.OwnerUserId)
                        .Descending(x => x.CreatedAt),
                    new CreateIndexOptions { Name = "Owner_CreatedAt" }),

                // Status scans (reaper / dashboards).
                new CreateIndexModel<AiRequest>(
                    Builders<AiRequest>.IndexKeys.Ascending(x => x.Status),
                    new CreateIndexOptions { Name = "Status" }),

                // Hangfire correlation.
                new CreateIndexModel<AiRequest>(
                    Builders<AiRequest>.IndexKeys.Ascending(x => x.HangfireJobId),
                    new CreateIndexOptions { Name = "HangfireJobId" }),
            });
        }

        public Task SetHangfireJobIdAsync(string id, string hangfireJobId)
            => _collection.UpdateOneAsync(
                x => x.Id == id,
                Builders<AiRequest>.Update
                    .Set(x => x.HangfireJobId, hangfireJobId)
                    .Set(x => x.UpdatedAt, DateTime.UtcNow));

        public Task SetProcessingAsync(string id)
            => _collection.UpdateOneAsync(
                x => x.Id == id,
                Builders<AiRequest>.Update
                    .Set(x => x.Status, "Processing")
                    .Set(x => x.UpdatedAt, DateTime.UtcNow));

        public Task SetCompletedAsync(string id, string promptKey, int promptVersion)
            => _collection.UpdateOneAsync(
                x => x.Id == id,
                Builders<AiRequest>.Update
                    .Set(x => x.Status, "Completed")
                    .Set(x => x.PromptKey, promptKey)
                    .Set(x => x.PromptVersion, promptVersion)
                    .Set(x => x.Error, null)
                    .Set(x => x.UpdatedAt, DateTime.UtcNow));

        public Task SetFailedAsync(string id, string error)
            => _collection.UpdateOneAsync(
                x => x.Id == id,
                Builders<AiRequest>.Update
                    .Set(x => x.Status, "Failed")
                    .Set(x => x.Error, error)
                    .Set(x => x.UpdatedAt, DateTime.UtcNow));

        /// <summary>Ownership-scoped fetch (returns null if not owned).</summary>
        public async Task<AiRequest?> GetOwnedAsync(string id, string ownerUserId)
            => await _collection.Find(x => x.Id == id && x.OwnerUserId == ownerUserId).FirstOrDefaultAsync();
    }
}
