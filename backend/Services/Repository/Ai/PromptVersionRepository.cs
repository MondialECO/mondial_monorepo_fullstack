using MongoDB.Driver;
using WebApp.Models.DatabaseModels.Ai;

namespace WebApp.Services.Repository.Ai
{
    /// <summary>Repository for the <c>PromptVersions</c> collection.</summary>
    public class PromptVersionRepository : MongoRepository<PromptVersion>
    {
        public PromptVersionRepository(IMongoDatabase database) : base(database, "PromptVersions")
        {
            CreateIndexesAsync().GetAwaiter().GetResult();
        }

        private async Task CreateIndexesAsync()
        {
            await _collection.Indexes.CreateManyAsync(new[]
            {
                // A given (key, version) is unique.
                new CreateIndexModel<PromptVersion>(
                    Builders<PromptVersion>.IndexKeys
                        .Ascending(x => x.Key)
                        .Ascending(x => x.Version),
                    new CreateIndexOptions { Name = "Key_Version_Unique", Unique = true }),

                // At most one ACTIVE version per key (partial unique on IsActive=true).
                new CreateIndexModel<PromptVersion>(
                    Builders<PromptVersion>.IndexKeys.Ascending(x => x.Key),
                    new CreateIndexOptions<PromptVersion>
                    {
                        Name = "Active_Per_Key_Unique",
                        Unique = true,
                        PartialFilterExpression =
                            Builders<PromptVersion>.Filter.Eq(x => x.IsActive, true),
                    }),
            });
        }
    }
}
