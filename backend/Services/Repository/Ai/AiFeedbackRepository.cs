using MongoDB.Driver;
using WebApp.Models.DatabaseModels.Ai;

namespace WebApp.Services.Repository.Ai
{
    /// <summary>Repository for the <c>AIFeedback</c> collection.</summary>
    public class AiFeedbackRepository : MongoRepository<AiFeedback>
    {
        public AiFeedbackRepository(IMongoDatabase database) : base(database, "AIFeedback")
        {
            CreateIndexesAsync().GetAwaiter().GetResult();
        }

        private async Task CreateIndexesAsync()
        {
            await _collection.Indexes.CreateManyAsync(new[]
            {
                // Feedback for a given response.
                new CreateIndexModel<AiFeedback>(
                    Builders<AiFeedback>.IndexKeys.Ascending(x => x.ResponseId),
                    new CreateIndexOptions { Name = "ResponseId" }),

                // Owner feedback history (newest first).
                new CreateIndexModel<AiFeedback>(
                    Builders<AiFeedback>.IndexKeys
                        .Ascending(x => x.OwnerUserId)
                        .Descending(x => x.CreatedAt),
                    new CreateIndexOptions { Name = "Owner_CreatedAt" }),
            });
        }
    }
}
