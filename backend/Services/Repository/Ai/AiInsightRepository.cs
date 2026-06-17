using MongoDB.Driver;
using WebApp.Models.DatabaseModels.Ai;

namespace WebApp.Services.Repository.Ai
{
    /// <summary>Repository for the <c>AIInsights</c> collection.</summary>
    public class AiInsightRepository : MongoRepository<AiInsight>
    {
        public AiInsightRepository(IMongoDatabase database) : base(database, "AIInsights")
        {
            CreateIndexesAsync().GetAwaiter().GetResult();
        }

        private async Task CreateIndexesAsync()
        {
            await _collection.Indexes.CreateOneAsync(
                new CreateIndexModel<AiInsight>(
                    Builders<AiInsight>.IndexKeys
                        .Ascending(x => x.OwnerUserId)
                        .Ascending(x => x.Type)
                        .Descending(x => x.CreatedAt),
                    new CreateIndexOptions { Name = "Owner_Type_CreatedAt" }));
        }

        /// <summary>Owner's insights, newest first, paged.</summary>
        public async Task<List<AiInsight>> GetByOwnerAsync(string ownerUserId, int skip, int limit)
            => await _collection.Find(x => x.OwnerUserId == ownerUserId)
                .SortByDescending(x => x.CreatedAt)
                .Skip(skip)
                .Limit(limit)
                .ToListAsync();
    }
}
