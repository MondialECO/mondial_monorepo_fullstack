using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels
{
    /// <summary>
    /// Durable verification decision history.
    /// Long-lived audit log for compliance and auditability.
    /// Does NOT store document images, scans, or biometric payloads.
    /// </summary>
    [BsonIgnoreExtraElements]
    public class IdentityDecisionAuditLog
    {
        [BsonId]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        public string VerificationId { get; set; } = string.Empty;

        public string UserId { get; set; } = string.Empty;

        public IdentityVerificationState PreviousState { get; set; }

        public IdentityVerificationState NewState { get; set; }

        /// <summary>
        /// Decision source: "provider_webhook" | "manual_admin" | "user_upload" | "system_retry"
        /// </summary>
        public string Source { get; set; } = "provider_webhook";

        /// <summary>
        /// Identifier of the decision maker (e.g. "sumsub", admin user ID / email).
        /// </summary>
        public string ReviewerOrProvider { get; set; } = string.Empty;

        /// <summary>
        /// Normalized reason code (e.g. "APPROVED", "DOCUMENT_EXPIRED", "DOCUMENT_BLURRY", "ADMIN_APPROVED", etc.).
        /// </summary>
        public string DecisionReason { get; set; } = string.Empty;

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Optional internal note from compliance reviewer (NO PII).
        /// </summary>
        public string? InternalNote { get; set; }
    }
}
