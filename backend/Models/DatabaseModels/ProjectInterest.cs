using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels
{
    public class ProjectInterest
    {
        [BsonId]
        public ObjectId Id { get; set; }

        [BsonElement("IdeaId")]
        public string IdeaId { get; set; } = string.Empty;

        [BsonElement("ListingId")]
        public string? ListingId { get; set; }

        [BsonElement("CreatorId")]
        public string CreatorId { get; set; } = string.Empty;

        [BsonElement("EntrepreneurId")]
        public string EntrepreneurId { get; set; } = string.Empty;

        [BsonElement("EntrepreneurName")]
        public string EntrepreneurName { get; set; } = string.Empty;

        [BsonElement("EntrepreneurEmail")]
        public string? EntrepreneurEmail { get; set; }

        [BsonElement("Note")]
        public string? Note { get; set; }

        /// <summary>Status: "pending" | "accepted" | "declined".</summary>
        [BsonElement("Status")]
        public string Status { get; set; } = "pending";

        [BsonElement("DealModes")]
        public List<string> DealModes { get; set; } = new();

        [BsonElement("DealMode")]
        public string? DealMode { get; set; }

        [BsonElement("ConversationId")]
        public string? ConversationId { get; set; }

        [BsonElement("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("UpdatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
