using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using WebApp.Models.DatabaseModels;

namespace WebApp.Models.Dtos
{
    // ==========================================
    // 1. SECURITY & OVERVIEW DTOS
    // ==========================================
    public class AdminSecuritySummaryDto
    {
        public int FailedLoginsTodayCount { get; set; }
        public int LockedAccountsCount { get; set; }
        public int SuspendedAccountsCount { get; set; }
        public int SecurityEventsTodayCount { get; set; }
        public int OpenPrivacyRequestsCount { get; set; }
        public int OpenComplianceCasesCount { get; set; }
        public int HighRiskAccountsCount { get; set; }
        public int RecentPrivilegedChangesCount { get; set; }
        public List<AdminAuditLogItemDto> RecentSecurityEvents { get; set; } = new();
    }

    public class UserSecurityReviewDto
    {
        public string UserId { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public List<string> Roles { get; set; } = new();
        public bool IsLocked { get; set; }
        public DateTimeOffset? LockoutEnd { get; set; }
        public int AccessFailedCount { get; set; }
        public string KycStatus { get; set; } = "NotStarted";
        public DateTime? JoinedAt { get; set; }
        public DateTime? LastLogin { get; set; }
        public List<string> FactualSignals { get; set; } = new();
        public DeletionDependencyCheck? DependencyCheck { get; set; }
        public List<AdminAuditLogItemDto> RecentAuditHistory { get; set; } = new();
    }

    // ==========================================
    // 2. PRIVACY REQUEST DTOS
    // ==========================================
    public class CreatePrivacyRequestDto
    {
        [Required]
        public string RequestType { get; set; } = "DataAccess"; // DataAccess, DataExport, Correction, AccountDeletion, OtherPrivacyRequest

        [MaxLength(2000)]
        public string Details { get; set; } = string.Empty;
    }

    public class UpdatePrivacyStatusDto
    {
        [Required]
        public string Status { get; set; } = "UnderReview"; // UnderReview, Approved, Completed, Rejected

        public string? Reason { get; set; }
        public string? AdminNotes { get; set; }
        public int Version { get; set; }
    }

    public class PrivacyRequestDto
    {
        public string Id { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public string UserDisplayName { get; set; } = string.Empty;
        public string RequestType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
        public string AdminNotes { get; set; } = string.Empty;
        public string? RejectionReason { get; set; }
        public string? AssignedAdminId { get; set; }
        public string? ReviewedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public string? ExportDownloadUrl { get; set; }
        public DateTime? ExportExpiresAt { get; set; }
        public DeletionDependencyCheck? DependencyCheck { get; set; }
        public int Version { get; set; }
    }

    // ==========================================
    // 3. COMPLIANCE CASE DTOS
    // ==========================================
    public class CreateComplianceCaseDto
    {
        [Required]
        public string TargetUserId { get; set; } = string.Empty;

        [Required]
        public string CaseType { get; set; } = "AccountReview";

        public string SourceType { get; set; } = "ManualReview";
        public string? SourceId { get; set; }
        public string Priority { get; set; } = "Normal";

        [Required]
        [MaxLength(1000)]
        public string Summary { get; set; } = string.Empty;
    }

    public class AddComplianceCaseNoteDto
    {
        [Required]
        [MaxLength(2000)]
        public string Content { get; set; } = string.Empty;
    }

    public class UpdateComplianceCaseStatusDto
    {
        [Required]
        public string Status { get; set; } = "UnderReview"; // UnderReview, ActionTaken, Resolved, Dismissed

        public string? Resolution { get; set; }
        public string? AssignedAdminEmail { get; set; }
        public int Version { get; set; }
    }

    public class ComplianceCaseDto
    {
        public string Id { get; set; } = string.Empty;
        public string CaseType { get; set; } = string.Empty;
        public string TargetUserId { get; set; } = string.Empty;
        public string TargetUserEmail { get; set; } = string.Empty;
        public string TargetUserDisplayName { get; set; } = string.Empty;
        public string SourceType { get; set; } = string.Empty;
        public string? SourceId { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string? AssignedAdminId { get; set; }
        public string? AssignedAdminEmail { get; set; }
        public string Summary { get; set; } = string.Empty;
        public string? Resolution { get; set; }
        public string? ResolvedBy { get; set; }
        public List<ComplianceCaseNote> Notes { get; set; } = new();
        public List<ComplianceCaseTimelineEvent> Timeline { get; set; } = new();
        public List<string> FactualSignals { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public int Version { get; set; }
    }

    // ==========================================
    // 4. DATA GOVERNANCE & RETENTION DTOS
    // ==========================================
    public class DataRetentionPolicyDto
    {
        public string Id { get; set; } = string.Empty;
        public string DataCategory { get; set; } = string.Empty;
        public int? RetentionDays { get; set; }
        public string ActionAfterRetention { get; set; } = "ReviewOnly";
        public string StorageAuthority { get; set; } = "MongoDB";
        public string DataSensitivity { get; set; } = "Internal";
        public string AccessAuthority { get; set; } = "Admin";
        public bool Enabled { get; set; } = true;
        public string? UpdatedBy { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int Version { get; set; }
    }

    public class UpdateDataRetentionPolicyRequest
    {
        [Required]
        public List<DataRetentionPolicyDto> Policies { get; set; } = new();
    }

    public class DataGovernanceInventoryItemDto
    {
        public string DataCategory { get; set; } = string.Empty;
        public string StorageAuthority { get; set; } = string.Empty;
        public string DataSensitivity { get; set; } = string.Empty;
        public string RetentionPolicy { get; set; } = "Not Configured";
        public string DeletionStrategy { get; set; } = "ReviewOnly";
        public string AccessAuthority { get; set; } = "Admin";
        public long EstimatedRecordsCount { get; set; }
    }
}
