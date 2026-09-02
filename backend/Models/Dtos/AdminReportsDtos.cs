using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using WebApp.Models.DatabaseModels;

namespace WebApp.Models.Dtos
{
    public class PagedResult<T>
    {
        public List<T> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    public class CreateReportRequest
    {
        [Required]
        public string TargetType { get; set; } = string.Empty;

        [Required]
        public string TargetId { get; set; } = string.Empty;

        [Required]
        public string Category { get; set; } = string.Empty;

        [Required]
        [MaxLength(2000)]
        public string Description { get; set; } = string.Empty;
    }

    public class AdminReportListItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string TargetType { get; set; } = string.Empty;
        public string TargetId { get; set; } = string.Empty;
        public string TargetSummary { get; set; } = string.Empty;
        public string ReporterId { get; set; } = string.Empty;
        public string ReporterName { get; set; } = string.Empty;
        public string ReporterEmail { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string? ReviewedByAdminId { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public string? Resolution { get; set; }
    }

    public class AdminReportDetailDto
    {
        public string Id { get; set; } = string.Empty;
        public string TargetType { get; set; } = string.Empty;
        public string TargetId { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public string ReporterId { get; set; } = string.Empty;
        public string ReporterName { get; set; } = string.Empty;
        public string ReporterEmail { get; set; } = string.Empty;

        public string? ReviewedByAdminId { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public string? Resolution { get; set; }
        public string? AdminNotes { get; set; }

        public object? TargetData { get; set; }
        public bool IsTargetCurrentlyHidden { get; set; }
        public int PreviousReportsCountOnTarget { get; set; }
    }

    public class ResolveReportRequest
    {
        [Required]
        public string ResolutionAction { get; set; } = "none"; // "none" (no action) | "hide" (moderate & hide) | "dismiss"

        [MaxLength(1000)]
        public string? Notes { get; set; }
    }

    public class DismissReportRequest
    {
        [MaxLength(1000)]
        public string? Notes { get; set; }
    }

    public class AdminAuditLogItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string Actor { get; set; } = string.Empty;
        public bool Success { get; set; }
        public string? TargetType { get; set; }
        public string? TargetId { get; set; }
        public string? IpAddress { get; set; }
        public string? CorrelationId { get; set; }
        public DateTime Timestamp { get; set; }
        public Dictionary<string, object?>? Details { get; set; }
    }

    public class AdminGovernanceSummaryDto
    {
        public int OpenReportsCount { get; set; }
        public int UnderReviewReportsCount { get; set; }
        public int ResolvedReportsCount { get; set; }
        public int DismissedReportsCount { get; set; }
        public int TotalReportsCount { get; set; }

        public int HiddenServicesCount { get; set; }
        public int HiddenCreatorOffersCount { get; set; }
        public int HiddenReviewsCount { get; set; }
        public int SuspendedUsersCount { get; set; }

        public int OpenDisputesCount { get; set; }
        public int PendingVerificationsCount { get; set; }
        public int TotalAuditEventsCount { get; set; }
        public List<AdminAuditLogItemDto> RecentAuditEvents { get; set; } = new();
    }
}
