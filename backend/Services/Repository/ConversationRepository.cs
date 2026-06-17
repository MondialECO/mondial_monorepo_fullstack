using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Repository
{
    public class ConversationRepository : MongoRepository<Conversation>
    {
        public ConversationRepository(IMongoDatabase database) : base(database, "Conversations")
        {
            // You can create indexes here if needed
            CreateIndexesAsync().GetAwaiter().GetResult();
        }
        private async Task CreateIndexesAsync()
        {
            var index = Builders<Conversation>.IndexKeys.Ascending(c => c.Participants);
            await _collection.Indexes.CreateOneAsync(
                new CreateIndexModel<Conversation>(index));
        }

        public async Task<List<Conversation>> GetUserConversations(Guid userId)
        {
            return await _collection
                .Find(c => c.Participants.Contains(userId))
                .SortByDescending(c => c.LastMessageAt)
                .ToListAsync();
        }

        // Returns the existing Direct conversation between the pair, or creates
        // one. `Created` is true only when a new conversation was inserted, so
        // callers can fire a one-time "conversation created" realtime event.
        public async Task<(Conversation Conversation, bool Created)> GetOrCreateConversation(Guid user1, Guid user2)
        {
            var convo = await _collection.Find(c =>
                c.Participants.Contains(user1) &&
                c.Participants.Contains(user2) &&
                c.Type == "Direct"
            ).FirstOrDefaultAsync();

            if (convo != null) return (convo, false);

            var newConvo = new Conversation
            {
                Participants = new List<Guid> { user1, user2 }
            };

            await _collection.InsertOneAsync(newConvo);
            return (newConvo, true);
        }

        // Participant ids for a conversation — used to fan realtime events out
        // to each participant's per-user hub group.
        public async Task<List<Guid>> GetParticipantsAsync(ObjectId conversationId)
        {
            var convo = await _collection
                .Find(c => c.Id == conversationId)
                .FirstOrDefaultAsync();
            return convo?.Participants ?? new List<Guid>();
        }

        // Membership check used by Chat authorization (SEC-10 Phase 2).
        // Returns true iff a conversation with the given id exists AND
        // includes the user in its Participants list.
        public async Task<bool> IsParticipantAsync(ObjectId conversationId, Guid userId)
        {
            return await _collection
                .Find(c => c.Id == conversationId && c.Participants.Contains(userId))
                .AnyAsync();
        }

        public async Task UpdateConversationLastMessage(ChatMessage update)
        {
            var filter = Builders<Conversation>.Filter.Eq(c => c.Id, update.ConversationId);
            var updateDef = Builders<Conversation>.Update
                .Set(c => c.LastMessage, update.Message)
                .Set(c => c.LastMessageAt, update.CreatedAt);
            await _collection.UpdateOneAsync(filter, updateDef);
            //await _collection.UpdateOneAsync(c => c.Id == update.ConversationId, updateDef);
        }
       

    }
}
