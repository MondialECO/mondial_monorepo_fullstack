using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels
{
    public class AdminAuditLog
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        public string Action { get; set; } = string.Empty;
        public string Actor { get; set; } = string.Empty;
        public bool Success { get; set; }
        public string? TargetType { get; set; }
        public string? TargetId { get; set; }
        public string? IpAddress { get; set; }
        public string? CorrelationId { get; set; }

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [BsonExtraElements]
        public BsonDocument? Details { get; set; }
    }
}
