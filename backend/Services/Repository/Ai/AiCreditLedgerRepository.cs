using MongoDB.Driver;
using WebApp.Models.DatabaseModels.Ai;

namespace WebApp.Services.Repository.Ai
{
    /// <summary>Repository for the <c>AICredits</c> collection (one doc per user).</summary>
    public class AiCreditLedgerRepository : MongoRepository<AiCreditLedger>
    {
        public AiCreditLedgerRepository(IMongoDatabase database) : base(database, "AICredits")
        {
            CreateIndexesAsync().GetAwaiter().GetResult();
        }

        private async Task CreateIndexesAsync()
        {
            // One credit document per user.
            await _collection.Indexes.CreateOneAsync(
                new CreateIndexModel<AiCreditLedger>(
                    Builders<AiCreditLedger>.IndexKeys.Ascending(x => x.OwnerUserId),
                    new CreateIndexOptions { Name = "OwnerUserId_Unique", Unique = true }));
        }
    }
}
