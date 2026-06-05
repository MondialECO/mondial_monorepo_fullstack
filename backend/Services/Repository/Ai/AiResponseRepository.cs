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
    }
}
