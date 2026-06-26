using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Repository
{
    public class MessagesRepository : MongoRepository<ChatMessage>
    {
        public MessagesRepository(IMongoDatabase database) : base(database, "ChatMessages")
        {
            // You can create indexes here if needed
            CreateIndexesAsync().GetAwaiter().GetResult();
        }
        private async Task CreateIndexesAsync()
        {

            var index = Builders<ChatMessage>.IndexKeys
                .Ascending(m => m.ConversationId)
                .Descending(m => m.CreatedAt);

            await _collection.Indexes.CreateOneAsync(
                new CreateIndexModel<ChatMessage>(index));
        }

        public async Task<List<ChatMessage>> GetMessages(
           ObjectId conversationId, int skip, int limit)
        {
            return await _collection
                .Find(m => m.ConversationId == conversationId)
                .SortByDescending(m => m.CreatedAt)
                .Skip(skip)
                .Limit(limit)
                .ToListAsync();
        }

        public async Task AddMessage(ChatMessage message)
        {
            await _collection.InsertOneAsync(message);
        }

        public async Task MarkAsRead(ObjectId conversationId, Guid userId)
        {
            var update = Builders<ChatMessage>.Update.Set(m => m.IsRead, true);

            await _collection.UpdateManyAsync(
                m => m.ConversationId == conversationId &&
                     m.SenderId != userId &&
                     !m.IsRead,
                update
            );
        }

        // Unread counts per conversation for a given user, in a single
        // aggregation: messages addressed to the user (not their own) that
        // remain unread. Conversations with zero unread are simply absent.
        public async Task<Dictionary<string, long>> CountUnreadByConversationAsync(
            List<ObjectId> conversationIds, Guid userId)
        {
            if (conversationIds.Count == 0)
                return new Dictionary<string, long>();

            var grouped = await _collection
                .Aggregate()
                .Match(m =>
                    conversationIds.Contains(m.ConversationId) &&
                    m.SenderId != userId &&
                    !m.IsRead)
                .Group(m => m.ConversationId, g => new { Id = g.Key, Count = (long)g.Count() })
                .ToListAsync();

            return grouped.ToDictionary(x => x.Id.ToString(), x => x.Count);
        }
    }
}
