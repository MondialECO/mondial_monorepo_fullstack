using MongoDB.Bson;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Interface;
using WebApp.Services.Repository;

namespace WebApp.Services
{
    public class ChatService : IChatService
    {
        private readonly MessagesRepository _messages;
        private readonly ConversationRepository _conversation;
        public ChatService(MessagesRepository messages, ConversationRepository conversation)
        {
            _messages = messages;
            _conversation = conversation;
        }

        public async Task<ChatMessage> AddMessage(ChatMessage message)
        {
            await _messages.AddMessage(message);
            await _conversation.UpdateConversationLastMessage(message);
            return message;
        }

        public async Task<List<ChatMessage>> GetMessages(ObjectId conversationId, int skip, int limit)
        {
           return await _messages.GetMessages(conversationId, skip, limit);
        }

        public async Task<(Conversation Conversation, bool Created)> GetOrCreateConversation(Guid user1, Guid user2)
        {
            return await _conversation.GetOrCreateConversation(user1, user2);
        }

        public Task<List<Guid>> GetParticipantsAsync(ObjectId conversationId)
            => _conversation.GetParticipantsAsync(conversationId);

        public async Task<List<Conversation>> GetUserConversations(Guid userId)
        {
            return await _conversation.GetUserConversations(userId);
        }

        public async Task MarkAsRead(ObjectId conversationId, Guid userId)
        {
           await _messages.MarkAsRead(conversationId, userId);
        }

        public Task<bool> IsParticipantAsync(ObjectId conversationId, Guid userId)
            => _conversation.IsParticipantAsync(conversationId, userId);

        public Task<Dictionary<string, long>> CountUnreadByConversationAsync(
            List<ObjectId> conversationIds, Guid userId)
            => _messages.CountUnreadByConversationAsync(conversationIds, userId);

    }
}
