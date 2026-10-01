using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels.Ai
{
    public enum CreditPurchaseStatus
    {
        Pending = 0,
        Succeeded = 1,
        Failed = 2,
        Expired = 3
    }

    [BsonIgnoreExtraElements]
    public class CreditPurchase
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("UserId")]
        public string UserId { get; set; } = string.Empty;

        [BsonElement("PackageId")]
        public string PackageId { get; set; } = string.Empty;

        [BsonElement("Credits")]
        public int Credits { get; set; }

        [BsonElement("AmountInCents")]
        public int AmountInCents { get; set; }

        [BsonElement("Currency")]
        public string Currency { get; set; } = "eur";

        [BsonElement("Provider")]
        public string Provider { get; set; } = "stripe";

        [BsonElement("ProviderSessionId")]
        [BsonIgnoreIfNull]
        public string? ProviderSessionId { get; set; }

        [BsonElement("ProviderPaymentIntentId")]
        [BsonIgnoreIfNull]
        public string? ProviderPaymentIntentId { get; set; }

        [BsonElement("ProviderEventId")]
        [BsonIgnoreIfNull]
        public string? ProviderEventId { get; set; }

        [BsonElement("Status")]
        public CreditPurchaseStatus Status { get; set; } = CreditPurchaseStatus.Pending;

        [BsonElement("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("CompletedAt")]
        [BsonIgnoreIfNull]
        public DateTime? CompletedAt { get; set; }

        [BsonElement("FailedAt")]
        [BsonIgnoreIfNull]
        public DateTime? FailedAt { get; set; }

        [BsonElement("FailureReason")]
        [BsonIgnoreIfNull]
        public string? FailureReason { get; set; }
    }
}
