using System;
using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels
{
    public enum PrivacyRequestType
    {
        DataAccess,
        DataExport,
        Correction,
        AccountDeletion,
        OtherPrivacyRequest
    }

    public enum PrivacyRequestStatus
    {
        Open,
        UnderReview,
        Approved,
        Completed,
        Rejected
    }

    public class DeletionDependencyCheck
    {
        public bool HasActiveEngagements { get; set; }
        public int ActiveEngagementsCount { get; set; }

        public bool HasOpenDisputes { get; set; }
        public int OpenDisputesCount { get; set; }

        public bool HasPendingPayouts { get; set; }
        public int PendingPayoutsCount { get; set; }

        public bool HasFinancialLedgerHistory { get; set; }
        public int CompletedTransactionsCount { get; set; }

        public bool HasKycRecords { get; set; }
        public string? KycStatus { get; set; }

        public bool CanSafelyDeleteOrAnonymize => !HasActiveEngagements && !HasOpenDisputes && !HasPendingPayouts;
        public string Summary { get; set; } = string.Empty;
        public DateTime CheckedAt { get; set; } = DateTime.UtcNow;
    }

    public class PrivacyRequest
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        [BsonRepresentation(BsonType.String)]
        public string UserId { get; set; } = string.Empty;

        public string UserEmail { get; set; } = string.Empty;
        public string UserDisplayName { get; set; } = string.Empty;

        [BsonRepresentation(BsonType.String)]
        public PrivacyRequestType RequestType { get; set; } = PrivacyRequestType.DataAccess;

        [BsonRepresentation(BsonType.String)]
        public PrivacyRequestStatus Status { get; set; } = PrivacyRequestStatus.Open;

        public string Details { get; set; } = string.Empty;
        public string AdminNotes { get; set; } = string.Empty;
        public string? RejectionReason { get; set; }

        public string? AssignedAdminId { get; set; }
        public string? ReviewedBy { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }

        // Data Export fields
        public string? ExportDownloadToken { get; set; }
        public DateTime? ExportExpiresAt { get; set; }
        public string? ExportDataJson { get; set; }

        // Deletion dependency assessment
        public DeletionDependencyCheck? DependencyCheck { get; set; }

        // Concurrency token for optimistic locking
        public int Version { get; set; } = 1;
    }
}
