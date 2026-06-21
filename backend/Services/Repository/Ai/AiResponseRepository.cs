using MongoDB.Driver;
using WebApp.Models.DatabaseModels.Ai;

namespace WebApp.Services.Repository.Ai
{
    /// <summary>Repository for the <c>AIResponses</c> collection.</summary>
    public class AiResponseRepository : MongoRepository<AiResponse>
    {
        public AiResponseRepository(IMongoDatabase database) : base(database, "AIResponses")
        {
            CreateIndexesAsync().GetAwaiter().GetResult();
        }

        private async Task CreateIndexesAsync()
        {
            await _collection.Indexes.CreateManyAsync(new[]
            {
                // Hydrate a response by its request.
                new CreateIndexModel<AiResponse>(
                    Builders<AiResponse>.IndexKeys.Ascending(x => x.RequestId),
                    new CreateIndexOptions { Name = "RequestId" }),

                // Owner response history (newest first).
                new CreateIndexModel<AiResponse>(
                    Builders<AiResponse>.IndexKeys
                        .Ascending(x => x.OwnerUserId)
                        .Descending(x => x.CreatedAt),
                    new CreateIndexOptions { Name = "Owner_CreatedAt" }),
            });
        }

        /// <summary>The (latest) response for a request, owner-scoped.</summary>
        public async Task<AiResponse?> GetByRequestAsync(string requestId, string ownerUserId)
            => await _collection.Find(x => x.RequestId == requestId && x.OwnerUserId == ownerUserId)
                .SortByDescending(x => x.CreatedAt)
                .FirstOrDefaultAsync();

        /// <summary>A response by id, owner-scoped (null if not owned).</summary>
        public async Task<AiResponse?> GetOwnedAsync(string responseId, string ownerUserId)
            => await _collection.Find(x => x.Id == responseId && x.OwnerUserId == ownerUserId).FirstOrDefaultAsync();
    }
}
