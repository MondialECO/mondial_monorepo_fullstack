using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels.Ai
{
    /// <summary>
    /// User feedback on a persisted AI response (collection <c>AIFeedback</c>).
    /// </summary>
    public class AiFeedback
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = "";

        [BsonElement("OwnerUserId")]
        public string OwnerUserId { get; set; } = "";

        [BsonElement("ResponseId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string ResponseId { get; set; } = "";

        /// <summary>Rating (1–5, or -1/1 for down/up).</summary>
        [BsonElement("Rating")]
        public int Rating { get; set; }

        [BsonElement("Comment")]
        public string? Comment { get; set; }

        [BsonElement("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
