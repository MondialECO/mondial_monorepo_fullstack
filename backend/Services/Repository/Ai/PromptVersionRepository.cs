using MongoDB.Driver;
using WebApp.Models.DatabaseModels.Ai;

namespace WebApp.Services.Repository.Ai
{
    /// <summary>Repository for the <c>PromptVersions</c> collection.</summary>
    public class PromptVersionRepository : MongoRepository<PromptVersion>
    {
        public PromptVersionRepository(IMongoDatabase database) : base(database, "PromptVersions")
        {
            try
            {
                CreateIndexesAsync().GetAwaiter().GetResult();
            }
            catch
            {
                // Non-fatal if index creation fails during startup/offline
            }
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

        /// <summary>The single active version for a key, or null.</summary>
        public async Task<PromptVersion?> GetActiveAsync(string key)
            => await _collection.Find(x => x.Key == key && x.IsActive).FirstOrDefaultAsync();

        /// <summary>True if a (key, version) document already exists.</summary>
        public async Task<bool> ExistsAsync(string key, int version)
            => await _collection.Find(x => x.Key == key && x.Version == version).AnyAsync();

        /// <summary>
        /// Clears the active flag on every version of a key. Run before
        /// inserting a new active version so the partial-unique index holds.
        /// </summary>
        public Task DeactivateAllForKeyAsync(string key)
            => _collection.UpdateManyAsync(
                x => x.Key == key && x.IsActive,
                Builders<PromptVersion>.Update.Set(x => x.IsActive, false));
    }
}
