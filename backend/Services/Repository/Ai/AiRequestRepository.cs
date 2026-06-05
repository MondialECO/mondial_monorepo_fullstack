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
    }
}
