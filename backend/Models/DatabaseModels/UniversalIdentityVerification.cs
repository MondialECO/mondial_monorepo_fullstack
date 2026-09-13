using System;
using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels
{
    /// <summary>
    /// Lifecycle states for an authoritative identity verification attempt.
    /// </summary>
    public enum IdentityVerificationState
    {
        NotStarted,
        Uploading,
        Submitted,
        Processing,
        ManualReview,
        Verified,
        Rejected,
        RetryRequired,
        Expired
    }

    /// <summary>
    /// Authoritative record for one identity verification attempt.
    /// Supports multiple historical attempts (IsCurrent = false) while guaranteeing
    /// at most one active attempt (IsCurrent = true) per user via partial unique index.
    /// </summary>
    [BsonIgnoreExtraElements]
    public class UniversalIdentityVerification
    {
        [BsonId]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        public string UserId { get; set; } = string.Empty;

        /// <summary>
        /// True if this is the active/current attempt. Only one current attempt per user.
        /// </summary>
        public bool IsCurrent { get; set; } = true;

        /// <summary>
        /// Identity provider identifier (e.g. "sumsub", "manual").
        /// </summary>
        public string Provider { get; set; } = "sumsub";

        public string? ProviderApplicantId { get; set; }
        public string? ProviderInspectionId { get; set; }

        public IdentityVerificationState Status { get; set; } = IdentityVerificationState.NotStarted;

        /// <summary>
        /// Document type: "national_id" | "passport" | "residence_permit".
        /// </summary>
        public string? DocumentType { get; set; }

        /// <summary>
        /// Document issuing country (ISO 3166-1 alpha-2, e.g. "FR", "BD").
        /// Kept separate from residence country and nationality.
        /// </summary>
        public string? IssuingCountry { get; set; }

        /// <summary>
        /// Country of residence (e.g. "FR").
        /// </summary>
        public string? ResidenceCountry { get; set; }

        /// <summary>
        /// User's declared or detected nationality (e.g. "FR", "BD").
        /// </summary>
        public string? Nationality { get; set; }

        public string? FrontImagePath { get; set; }
        public string? BackImagePath { get; set; }

        public DateTime? SubmittedAt { get; set; }
        public DateTime? VerifiedAt { get; set; }
        public DateTime? RejectedAt { get; set; }
        public DateTime? ExpiresAt { get; set; }

        /// <summary>
        /// Normalized rejection reason code (e.g. DOCUMENT_EXPIRED, DOCUMENT_BLURRY, etc.).
        /// </summary>
        public string? FailureReasonCode { get; set; }

        public string? FailureDetails { get; set; }

        /// <summary>
        /// Set of processed provider event IDs or reviewAnswer timestamps to guarantee webhook idempotency.
        /// </summary>
        public List<string> ProcessedEventIds { get; set; } = new();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
