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

        public async Task<AiCreditLedger?> GetByOwnerAsync(string ownerUserId)
            => await _collection.Find(x => x.OwnerUserId == ownerUserId).FirstOrDefaultAsync();

        /// <summary>
        /// Atomically debits <paramref name="amount"/> credits iff the user has a
        /// ledger with a sufficient balance. The filter requires Balance >= amount
        /// so concurrent debits can never overspend. Returns false when there is
        /// no ledger or the balance is insufficient (no write performed).
        /// </summary>
        public async Task<bool> TryDebitAsync(string ownerUserId, int amount, AiCreditDebit debit)
        {
            var result = await _collection.UpdateOneAsync(
                x => x.OwnerUserId == ownerUserId && x.Balance >= amount,
                Builders<AiCreditLedger>.Update
                    .Inc(x => x.Balance, -amount)
                    .Inc(x => x.LifetimeSpent, amount)
                    .Push(x => x.Debits, debit)
                    .Set(x => x.UpdatedAt, DateTime.UtcNow));
            return result.ModifiedCount > 0;
        }

        /// <summary>
        /// Idempotently grants a starter ledger to a user who has none. Uses an
        /// upsert with $setOnInsert so an existing balance is NEVER touched and
        /// repeat runs are safe; the unique OwnerUserId index guards concurrency.
        /// Returns true only when a new ledger was created.
        /// </summary>
        public async Task<bool> TryGrantInitialAsync(string ownerUserId, int amount)
        {
            var update = Builders<AiCreditLedger>.Update
                .SetOnInsert(x => x.OwnerUserId, ownerUserId)
                .SetOnInsert(x => x.Balance, amount)
                .SetOnInsert(x => x.LifetimeGranted, amount)
                .SetOnInsert(x => x.LifetimeSpent, 0)
                .SetOnInsert(x => x.Debits, new List<AiCreditDebit>())
                .SetOnInsert(x => x.CreatedAt, DateTime.UtcNow)
                .SetOnInsert(x => x.UpdatedAt, DateTime.UtcNow);

            var result = await _collection.UpdateOneAsync(
                x => x.OwnerUserId == ownerUserId,
                update,
                new UpdateOptions { IsUpsert = true });

            return result.UpsertedId is not null;
        }
    }
}
