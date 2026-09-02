using System;
using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels
{
    public enum ComplianceCaseStatus
    {
        Open,
        UnderReview,
        ActionTaken,
        Resolved,
        Dismissed
    }

    public enum ComplianceCasePriority
    {
        Low,
        Normal,
        High,
        Critical
    }

    public class ComplianceCaseNote
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public string AuthorId { get; set; } = string.Empty;
        public string AuthorEmail { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class ComplianceCaseTimelineEvent
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public string EventType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Actor { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    public class ComplianceCase
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        public string CaseType { get; set; } = "AccountReview"; // PrivacyEscalation, SecurityReview, ReportEscalation, FraudSuspicion, VerificationEscalation, AccountReview

        [BsonRepresentation(BsonType.String)]
        public string TargetUserId { get; set; } = string.Empty;

        public string TargetUserEmail { get; set; } = string.Empty;
        public string TargetUserDisplayName { get; set; } = string.Empty;

        public string SourceType { get; set; } = "ManualReview"; // PrivacyRequest, SecurityEvent, ContentReport, Verification, ManualReview
        public string? SourceId { get; set; }

        [BsonRepresentation(BsonType.String)]
        public ComplianceCaseStatus Status { get; set; } = ComplianceCaseStatus.Open;

        [BsonRepresentation(BsonType.String)]
        public ComplianceCasePriority Priority { get; set; } = ComplianceCasePriority.Normal;

        public string? AssignedAdminId { get; set; }
        public string? AssignedAdminEmail { get; set; }

        public string Summary { get; set; } = string.Empty;
        public string? Resolution { get; set; }
        public string? ResolvedBy { get; set; }

        public List<ComplianceCaseNote> Notes { get; set; } = new();
        public List<ComplianceCaseTimelineEvent> Timeline { get; set; } = new();

        // Factual risk signals
        public List<string> FactualSignals { get; set; } = new();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ResolvedAt { get; set; }

        // Concurrency token for optimistic locking
        public int Version { get; set; } = 1;
    }
}
