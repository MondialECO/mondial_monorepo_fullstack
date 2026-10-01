using MongoDB.Driver;
using WebApp.Models.DatabaseModels.Ai;

namespace WebApp.Services.Repository.Ai
{
    public interface ICreditPurchaseRepository
    {
        IMongoCollection<CreditPurchase> Collection { get; }
        Task<CreditPurchase?> GetByIdAsync(string id, CancellationToken ct = default);
        Task<CreditPurchase?> GetByProviderSessionIdAsync(string sessionId, CancellationToken ct = default);
        Task<List<CreditPurchase>> GetByUserIdAsync(string userId, int limit = 50, CancellationToken ct = default);
        Task CreateAsync(CreditPurchase purchase, CancellationToken ct = default);
        Task<bool> UpdateSessionIdAsync(string id, string sessionId, CancellationToken ct = default);
        Task<bool> MarkFailedAsync(string id, string reason, CancellationToken ct = default);
        Task<bool> MarkExpiredAsync(string id, string reason, CancellationToken ct = default);
    }

    public class CreditPurchaseRepository : MongoRepository<CreditPurchase>, ICreditPurchaseRepository
    {
        public IMongoCollection<CreditPurchase> Collection => _collection;

        public CreditPurchaseRepository(IMongoDatabase database) : base(database, "CreditPurchases")
        {
            try { CreateIndexesAsync().GetAwaiter().GetResult(); } catch { /* non-fatal if index exists or connection is deferred */ }
        }

        private async Task CreateIndexesAsync()
        {
            // 1. User history index (UserId + CreatedAt descending)
            await _collection.Indexes.CreateOneAsync(
                new CreateIndexModel<CreditPurchase>(
                    Builders<CreditPurchase>.IndexKeys
                        .Ascending(x => x.UserId)
                        .Descending(x => x.CreatedAt),
                    new CreateIndexOptions { Name = "UserId_CreatedAt_Idx" }));

            // 2. ProviderSessionId unique sparse index
            await _collection.Indexes.CreateOneAsync(
                new CreateIndexModel<CreditPurchase>(
                    Builders<CreditPurchase>.IndexKeys.Ascending(x => x.ProviderSessionId),
                    new CreateIndexOptions { Name = "ProviderSessionId_Unique", Unique = true, Sparse = true }));

            // 3. ProviderPaymentIntentId unique sparse index
            await _collection.Indexes.CreateOneAsync(
                new CreateIndexModel<CreditPurchase>(
                    Builders<CreditPurchase>.IndexKeys.Ascending(x => x.ProviderPaymentIntentId),
                    new CreateIndexOptions { Name = "ProviderPaymentIntentId_Unique", Unique = true, Sparse = true }));

            // 4. ProviderEventId unique sparse index
            await _collection.Indexes.CreateOneAsync(
                new CreateIndexModel<CreditPurchase>(
                    Builders<CreditPurchase>.IndexKeys.Ascending(x => x.ProviderEventId),
                    new CreateIndexOptions { Name = "ProviderEventId_Unique", Unique = true, Sparse = true }));
        }

        public async Task<CreditPurchase?> GetByIdAsync(string id, CancellationToken ct = default)
            => await _collection.Find(x => x.Id == id).FirstOrDefaultAsync(ct);

        public async Task<CreditPurchase?> GetByProviderSessionIdAsync(string sessionId, CancellationToken ct = default)
            => await _collection.Find(x => x.ProviderSessionId == sessionId).FirstOrDefaultAsync(ct);

        public async Task<List<CreditPurchase>> GetByUserIdAsync(string userId, int limit = 50, CancellationToken ct = default)
            => await _collection.Find(x => x.UserId == userId)
                .SortByDescending(x => x.CreatedAt)
                .Limit(limit)
                .ToListAsync(ct);

        public async Task CreateAsync(CreditPurchase purchase, CancellationToken ct = default)
            => await _collection.InsertOneAsync(purchase, cancellationToken: ct);

        public async Task<bool> UpdateSessionIdAsync(string id, string sessionId, CancellationToken ct = default)
        {
            var filter = Builders<CreditPurchase>.Filter.Eq(x => x.Id, id);
            var update = Builders<CreditPurchase>.Update.Set(x => x.ProviderSessionId, sessionId);
            var result = await _collection.UpdateOneAsync(filter, update, cancellationToken: ct);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> MarkFailedAsync(string id, string reason, CancellationToken ct = default)
        {
            var filter = Builders<CreditPurchase>.Filter.And(
                Builders<CreditPurchase>.Filter.Eq(x => x.Id, id),
                Builders<CreditPurchase>.Filter.Eq(x => x.Status, CreditPurchaseStatus.Pending)
            );
            var update = Builders<CreditPurchase>.Update
                .Set(x => x.Status, CreditPurchaseStatus.Failed)
                .Set(x => x.FailedAt, DateTime.UtcNow)
                .Set(x => x.FailureReason, reason);

            var result = await _collection.UpdateOneAsync(filter, update, cancellationToken: ct);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> MarkExpiredAsync(string id, string reason, CancellationToken ct = default)
        {
            var filter = Builders<CreditPurchase>.Filter.And(
                Builders<CreditPurchase>.Filter.Eq(x => x.Id, id),
                Builders<CreditPurchase>.Filter.Eq(x => x.Status, CreditPurchaseStatus.Pending)
            );
            var update = Builders<CreditPurchase>.Update
                .Set(x => x.Status, CreditPurchaseStatus.Expired)
                .Set(x => x.FailedAt, DateTime.UtcNow)
                .Set(x => x.FailureReason, reason);

            var result = await _collection.UpdateOneAsync(filter, update, cancellationToken: ct);
            return result.ModifiedCount > 0;
        }
    }
}
