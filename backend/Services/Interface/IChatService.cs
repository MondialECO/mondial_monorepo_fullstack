using MongoDB.Bson;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;

namespace WebApp.Services.Interface
{
    public interface IChatService
    {
        //Task SendMessage(SendMessageDto dto, string senderId);



        Task<List<Conversation>> GetUserConversations(Guid userId);
        Task<Conversation> GetOrCreateConversation(Guid user1, Guid user2);
        Task<List<ChatMessage>> GetMessages(ObjectId conversationId, int skip, int limit);
        Task<ChatMessage> AddMessage(ChatMessage message);
        Task MarkAsRead(ObjectId conversationId, Guid userId);

        // True only when the user is a participant of the conversation.
        // Authorization gate for Chat read/write paths (SEC-10 Phase 2).
        Task<bool> IsParticipantAsync(ObjectId conversationId, Guid userId);
    }
}
