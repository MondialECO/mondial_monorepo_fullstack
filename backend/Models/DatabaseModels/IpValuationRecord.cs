using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels
{
    /// <summary>
    /// Append-only audit log of every computed IP valuation (collection
    /// <c>IpValuations</c>). The live value also lives inline on the journey
    /// (phase5Data.pathA.ipValuation); this is the historical record.
    /// </summary>
    public class IpValuationRecord
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        public string UserId { get; set; }
        public string BusinessIdeaId { get; set; }

        public decimal EstimatedMin { get; set; }
        public decimal EstimatedMax { get; set; }
        public string Confidence { get; set; }
        public CreatorIpValuationBreakdown Breakdown { get; set; } = new();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
