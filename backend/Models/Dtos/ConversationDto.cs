namespace WebApp.Models.Dtos
{
    // Wire shape for a conversation, enriched with participant identity
    // (resolved from ApplicationUser.Name / ImagePath) and the caller's
    // unread count (derived from ChatMessage.IsRead / SenderId). Replaces the
    // raw Conversation document so the frontend no longer sees bare GUIDs.
    public class ConversationDto
    {
        public string Id { get; set; } = "";
        public List<ConversationParticipantDto> Participants { get; set; } = new();
        public string Type { get; set; } = "Direct";
        public string? ContextType { get; set; }
        public string? LastMessage { get; set; }
        public DateTime? LastMessageAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public long UnreadCount { get; set; }
    }

    public class ConversationParticipantDto
    {
        public string Id { get; set; } = "";
        public string? Name { get; set; }
        public string? ImagePath { get; set; }
    }
}
