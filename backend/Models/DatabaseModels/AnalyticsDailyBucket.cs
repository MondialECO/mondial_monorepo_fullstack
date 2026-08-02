using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels
{
    public class AnalyticsDailyBucket
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string ListingId { get; set; } = string.Empty;

        // Plain string: ProviderId is an ApplicationUser GUID, not an ObjectId.
        public string ProviderId { get; set; } = string.Empty;

        // UTC date at 00:00:00, day granularity
        public DateTime Date { get; set; }

        public int Impressions { get; set; }
        public int Clicks { get; set; }
        public int Inquiries { get; set; }

        public DateTime UpdatedAt { get; set; }
    }
}
