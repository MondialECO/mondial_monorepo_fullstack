using System.Text.Json.Serialization;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using WebApp.Serialization;

namespace WebApp.Models.DatabaseModels
{
    public class ChatMessage
    {
        // ChatMessage crosses the wire as the raw entity — GET /api/chat/messages/{id}
        // returns it directly, and both send paths broadcast it over SignalR
        // ("ReceiveMessage" in ChatHub.SendMessage and ChatController.SendMessage).
        // There is no DTO in between, so these converters are the wire contract: without
        // them System.Text.Json emits ObjectId's component fields as a JSON object rather
        // than a 24-char hex string, and every frontend consumer treats both as strings.
        // Same reason Notification.cs annotates its id fields; the converter is applied
        // per-property, not registered globally.
        [BsonId]
        [JsonConverter(typeof(ObjectIdJsonConverter))]
        public ObjectId Id { get; set; }

        [BsonElement("ConversationId")]
        [JsonConverter(typeof(ObjectIdJsonConverter))]
        public ObjectId ConversationId { get; set; }

        [BsonElement("SenderId")]
        public Guid SenderId { get; set; }

        [BsonElement("Message")]
        public string Message { get; set; } = "";

        [BsonElement("MessageType")]
        public string MessageType { get; set; } = "Text"; // Text | Image | File

        // Optional Module-3 attribution. Only messages explicitly linked to a brief
        // can count as a lead response; unrelated conversation traffic never does.
        [BsonElement("ClientBriefId")]
        public string? ClientBriefId { get; set; }

        [BsonElement("IsRead")]
        public bool IsRead { get; set; } = false;

        [BsonElement("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
