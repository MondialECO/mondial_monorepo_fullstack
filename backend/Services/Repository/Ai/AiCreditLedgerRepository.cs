using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.Models.DatabaseModels.Ai;

namespace WebApp.Services.Repository.Ai
{
    /// <summary>Repository for the <c>AICredits</c> collection (one doc per user).</summary>
    public class AiCreditLedgerRepository : MongoRepository<AiCreditLedger>
    {
        public AiCreditLedgerRepository(IMongoDatabase database) : base(database, "AICredits")
        {
            try { CreateIndexesAsync().GetAwaiter().GetResult(); } catch { /* non-fatal if index exists or connection is deferred */ }
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
        /// ledger with a sufficient balance and the debit <paramref name="debit.OperationId"/> has not been applied yet.
        /// Returns CreditDebitResult.Applied if debited, CreditDebitResult.AlreadyDebited if idempotent duplicate,
        /// or CreditDebitResult.InsufficientCredits / LedgerNotFound.
        /// </summary>
        public async Task<CreditDebitResult> TryDebitAsync(string ownerUserId, int amount, AiCreditDebit debit)
        {
            if (string.IsNullOrWhiteSpace(ownerUserId) || amount <= 0)
                return CreditDebitResult.InsufficientCredits;

            if (string.IsNullOrWhiteSpace(debit.OperationId))
                debit.OperationId = ObjectId.GenerateNewId().ToString();

            // Filter: correct user, sufficient balance, and NO existing debit with this OperationId
            var filter = Builders<AiCreditLedger>.Filter.And(
                Builders<AiCreditLedger>.Filter.Eq(x => x.OwnerUserId, ownerUserId),
                Builders<AiCreditLedger>.Filter.Gte(x => x.Balance, amount),
                Builders<AiCreditLedger>.Filter.Not(
                    Builders<AiCreditLedger>.Filter.ElemMatch(x => x.Debits, d => d.OperationId == debit.OperationId)
                )
            );

            var update = Builders<AiCreditLedger>.Update
                .Inc(x => x.Balance, -amount)
                .Inc(x => x.LifetimeSpent, amount)
                .Push(x => x.Debits, debit)
                .Set(x => x.UpdatedAt, DateTime.UtcNow);

            var result = await _collection.UpdateOneAsync(filter, update);
            if (result.ModifiedCount > 0)
                return CreditDebitResult.Applied;

            // If not modified, classify whether already debited or insufficient balance
            var ledger = await GetByOwnerAsync(ownerUserId);
            if (ledger == null)
                return CreditDebitResult.LedgerNotFound;

            if (ledger.Debits.Any(d => d.OperationId == debit.OperationId))
                return CreditDebitResult.AlreadyDebited;

            return CreditDebitResult.InsufficientCredits;
        }

        /// <summary>
        /// Atomically refunds/compensates <paramref name="expectedAmount"/> credits for a specific
        /// debit <paramref name="operationId"/> iff it exists, belongs to the user, has not been
        /// refunded yet, and matches the expected amount. Exactly one concurrent refund will apply.
        /// </summary>
        public async Task<CreditRefundResult> TryRefundAsync(string ownerUserId, string operationId, int expectedAmount, string reason)
        {
            if (string.IsNullOrWhiteSpace(ownerUserId) || string.IsNullOrWhiteSpace(operationId) || expectedAmount <= 0)
                return CreditRefundResult.InvalidMismatch;

            // Atomic compare-and-set: match user and unrefunded debit with matching operationId and amount
            var filter = Builders<AiCreditLedger>.Filter.And(
                Builders<AiCreditLedger>.Filter.Eq(x => x.OwnerUserId, ownerUserId),
                Builders<AiCreditLedger>.Filter.ElemMatch(x => x.Debits, d => d.OperationId == operationId && !d.Refunded && d.Amount == expectedAmount)
            );

            var update = Builders<AiCreditLedger>.Update
                .Inc(x => x.Balance, expectedAmount)
                .Inc(x => x.LifetimeSpent, -expectedAmount)
                .Set("Debits.$.Refunded", true)
                .Set("Debits.$.RefundedAt", DateTime.UtcNow)
                .Set(x => x.UpdatedAt, DateTime.UtcNow);

            var result = await _collection.UpdateOneAsync(filter, update);
            if (result.ModifiedCount > 0)
                return CreditRefundResult.Applied;

            // If not modified, check why for diagnostic result
            var ledger = await GetByOwnerAsync(ownerUserId);
            if (ledger == null)
                return CreditRefundResult.DebitNotFound;

            var debit = ledger.Debits.FirstOrDefault(d => d.OperationId == operationId);
            if (debit == null)
                return CreditRefundResult.DebitNotFound;

            if (debit.Amount != expectedAmount)
                return CreditRefundResult.InvalidMismatch;

            if (debit.Refunded)
                return CreditRefundResult.AlreadyRefunded;

            return CreditRefundResult.InvalidMismatch;
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

        /// <summary>
        /// Idempotently normalizes a single legacy user's starter credits from <paramref name="legacyGranted"/> (100)
        /// to <paramref name="targetGranted"/> (200). Exactly-once atomic condition: LifetimeGranted == legacyGranted.
        /// Balance and LifetimeGranted are incremented by the difference; LifetimeSpent and debit history remain untouched.
        /// Returns true iff the ledger was modified.
        /// </summary>
        public async Task<bool> TryNormalizeLegacyStarterCreditsForUserAsync(string ownerUserId, int legacyGranted = 100, int targetGranted = 200)
        {
            if (string.IsNullOrWhiteSpace(ownerUserId) || targetGranted <= legacyGranted)
                return false;

            var diff = targetGranted - legacyGranted;
            var filter = Builders<AiCreditLedger>.Filter.And(
                Builders<AiCreditLedger>.Filter.Eq(x => x.OwnerUserId, ownerUserId),
                Builders<AiCreditLedger>.Filter.Eq(x => x.LifetimeGranted, legacyGranted)
            );

            var update = Builders<AiCreditLedger>.Update
                .Inc(x => x.Balance, diff)
                .Inc(x => x.LifetimeGranted, diff)
                .Set(x => x.UpdatedAt, DateTime.UtcNow);

            var result = await _collection.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        /// <summary>
        /// Idempotently normalizes all legacy starter credit ledgers from <paramref name="legacyGranted"/> (100)
        /// to <paramref name="targetGranted"/> (200). Uses atomic compare-and-set query (LifetimeGranted == legacyGranted).
        /// Returns an audit report of eligible, normalized, and current ledgers.
        /// </summary>
        public async Task<LegacyCreditNormalizationReport> NormalizeAllLegacyStarterCreditsAsync(int legacyGranted = 100, int targetGranted = 200)
        {
            var report = new LegacyCreditNormalizationReport();
            if (targetGranted <= legacyGranted)
                return report;

            var diff = targetGranted - legacyGranted;

            // Audit counts before update
            report.EligibleLedgersCount = (int)await _collection.CountDocumentsAsync(x => x.LifetimeGranted == legacyGranted);
            report.AlreadyCurrentLedgersCount = (int)await _collection.CountDocumentsAsync(x => x.LifetimeGranted == targetGranted);
            report.UnexpectedShapeCount = (int)await _collection.CountDocumentsAsync(x => x.LifetimeGranted != legacyGranted && x.LifetimeGranted != targetGranted);

            if (report.EligibleLedgersCount == 0)
                return report;

            // Atomic batch update
            var updateResult = await _collection.UpdateManyAsync(
                x => x.LifetimeGranted == legacyGranted,
                Builders<AiCreditLedger>.Update
                    .Inc(x => x.Balance, diff)
                    .Inc(x => x.LifetimeGranted, diff)
                    .Set(x => x.UpdatedAt, DateTime.UtcNow)
            );

            report.NormalizedLedgersCount = (int)updateResult.ModifiedCount;
            report.TotalCreditsGranted = report.NormalizedLedgersCount * diff;

            return report;
        }
    }
}
