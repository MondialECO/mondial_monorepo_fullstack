using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels
{
    public class AnalyticsSessionSeen
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string ListingId { get; set; } = string.Empty;

        // SHA-256 hex string of (salt + IP + user-agent)
        public string SessionKey { get; set; } = string.Empty;

        // "impression" or "click"
        public string EventType { get; set; } = string.Empty;

        // Optional — populated for click events
        public string? Target { get; set; }

        public DateTime LastSeenAt { get; set; }

        // TTL — MongoDB auto-deletes after this timestamp
        public DateTime ExpiresAt { get; set; }
    }
}
