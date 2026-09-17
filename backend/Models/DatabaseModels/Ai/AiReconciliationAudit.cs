using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels.Ai
{
    /// <summary>
    /// Immutable audit log for AI reconciliation actions (dry-run detections and live corrections).
    /// Tracks what was found, which evidence signal justified the determination, which source
    /// initiated it, and whether it was executed in report-only (DryRun) mode.
    /// </summary>
    public class AiReconciliationAudit
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        [BsonElement("OwnerUserId")]
        public string OwnerUserId { get; set; } = string.Empty;

        [BsonElement("OperationId")]
        public string? OperationId { get; set; }

        [BsonElement("RequestId")]
        public string? RequestId { get; set; }

        [BsonElement("SessionId")]
        public string? SessionId { get; set; }

        [BsonElement("JobType")]
        public string? JobType { get; set; }

        [BsonElement("Amount")]
        public int? Amount { get; set; }

        [BsonElement("Action")]
        public string Action { get; set; } = string.Empty;

        [BsonElement("Source")]
        public string Source { get; set; } = string.Empty;

        [BsonElement("Evidence")]
        public string Evidence { get; set; } = string.Empty;

        [BsonElement("DryRun")]
        public bool DryRun { get; set; }

        [BsonElement("Reason")]
        public string Reason { get; set; } = string.Empty;

        [BsonElement("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
