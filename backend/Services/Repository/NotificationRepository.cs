using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Repository
{
    public class NotificationRepository : MongoRepository<Notification>
    {
        public NotificationRepository(IMongoDatabase database) : base(database, "Notifications")
        {
            CreateIndexesAsync().GetAwaiter().GetResult();
        }
        private async Task CreateIndexesAsync()
        {
            var index = Builders<Notification>.IndexKeys.Ascending(n => n.UserId);
            await _collection.Indexes.CreateOneAsync(new CreateIndexModel<Notification>(index));
        }

        public async Task AddNotification(Notification notification)
        {
            await _collection.InsertOneAsync(notification);
        }

        public async Task<List<Notification>> GetUserNotifications(Guid userId, int skip, int limit)
        {
            return await _collection
                .Find(n => n.UserId == userId)
                .SortByDescending(n => n.CreatedAt)
                .Skip(skip)
                .Limit(limit)
                .ToListAsync();
        }

        // SEC-10 Phase 2: atomic ownership-scoped update. The filter requires
        // both Id AND UserId to match, so a foreign caller's id never causes
        // a write. Returns true when a matching (owned) document exists, which
        // makes repeated mark-read idempotent: a second call on an
        // already-read notification still matches and reports success (200)
        // instead of 404. A foreign/unknown id matches nothing -> false -> 404.
        public async Task<bool> MarkAsRead(ObjectId id, Guid userId)
        {
            var result = await _collection.UpdateOneAsync(
                n => n.Id == id && n.UserId == userId,
                Builders<Notification>.Update.Set(n => n.IsRead, true)
            );
            return result.MatchedCount > 0;
        }

        public async Task<int> GetUnreadCount(Guid userId)
        {
            var count = await _collection.CountDocumentsAsync(n => n.UserId == userId && !n.IsRead);
            return (int)count;
        }

        public async Task<long> MarkAllAsRead(Guid userId)
        {
            var result = await _collection.UpdateManyAsync(
                n => n.UserId == userId && !n.IsRead,
                Builders<Notification>.Update.Set(n => n.IsRead, true)
            );
            return result.ModifiedCount;
        }
    }
}
