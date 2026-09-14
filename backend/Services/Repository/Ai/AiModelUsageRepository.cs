using MongoDB.Driver;
using WebApp.Models.DatabaseModels.Ai;

namespace WebApp.Services.Repository.Ai
{
    /// <summary>Repository for the <c>ModelUsage</c> collection.</summary>
    public class AiModelUsageRepository : MongoRepository<AiModelUsage>
    {
        public AiModelUsageRepository(IMongoDatabase database) : base(database, "ModelUsage")
        {
            try { CreateIndexesAsync().GetAwaiter().GetResult(); } catch { /* non-fatal if index exists or connection is deferred */ }
        }

        private async Task CreateIndexesAsync()
        {
            await _collection.Indexes.CreateManyAsync(new[]
            {
                // Per-user usage aggregation (newest first).
                new CreateIndexModel<AiModelUsage>(
                    Builders<AiModelUsage>.IndexKeys
                        .Ascending(x => x.OwnerUserId)
                        .Descending(x => x.CreatedAt),
                    new CreateIndexOptions { Name = "Owner_CreatedAt" }),

                // Per-model cost rollups.
                new CreateIndexModel<AiModelUsage>(
                    Builders<AiModelUsage>.IndexKeys
                        .Ascending(x => x.Model)
                        .Descending(x => x.CreatedAt),
                    new CreateIndexOptions { Name = "Model_CreatedAt" }),
            });
        }

        /// <summary>All usage entries for a user (for usage aggregation).</summary>
        public virtual async Task<List<AiModelUsage>> GetByOwnerAsync(string ownerUserId)
            => await _collection.Find(x => x.OwnerUserId == ownerUserId).ToListAsync();
    }
}
