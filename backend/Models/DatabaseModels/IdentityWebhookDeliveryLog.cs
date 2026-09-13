using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels
{
    /// <summary>
    /// Operational webhook delivery log.
    /// Short-retention record of incoming provider webhook requests.
    /// Does NOT store raw PII or full payload bodies.
    /// </summary>
    [BsonIgnoreExtraElements]
    public class IdentityWebhookDeliveryLog
    {
        [BsonId]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        /// <summary>
        /// Provider event identifier (e.g. from X-Sumsub-Event-Id header or payload).
        /// </summary>
        public string? EventId { get; set; }

        public string Provider { get; set; } = "sumsub";

        public string? VerificationId { get; set; }

        public string? ExternalUserId { get; set; }

        public string? ApplicantId { get; set; }

        /// <summary>
        /// SHA-256 hex digest of the raw incoming request payload for verification tracking without storing PII.
        /// </summary>
        public string? PayloadDigest { get; set; }

        public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Processing outcome: "success" | "duplicate" | "invalid_signature" | "malformed_payload" | "unknown_user" | "failed" | "out_of_order_ignored"
        /// </summary>
        public string ProcessingResult { get; set; } = "success";

        public string? ErrorMessage { get; set; }
    }
}
