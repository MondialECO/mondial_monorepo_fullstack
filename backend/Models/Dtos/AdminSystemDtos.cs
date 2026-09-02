using System;
using System.Collections.Generic;

namespace WebApp.Models.Dtos
{
    // ---- Health DTOs ----
    public class SystemHealthDto
    {
        public string OverallStatus { get; set; } = "Healthy"; // "Healthy", "Degraded", "Unhealthy"
        public ComponentHealthDto Api { get; set; } = new();
        public ComponentHealthDto Database { get; set; } = new();
        public ComponentHealthDto Hangfire { get; set; } = new();
        public ComponentHealthDto Notifications { get; set; } = new();
        public ComponentHealthDto Storage { get; set; } = new();
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string Version { get; set; } = "1.0.0";
    }

    public class ComponentHealthDto
    {
        public string Status { get; set; } = "Healthy"; // "Healthy", "Degraded", "Unhealthy", "Not Monitored"
        public string Message { get; set; } = string.Empty;
        public long ResponseTimeMs { get; set; }
        public Dictionary<string, object>? Details { get; set; }
    }

    // ---- Overview DTO ----
    public class SystemOverviewDto
    {
        public string OverallStatus { get; set; } = "Healthy";
        public SystemHealthDto Health { get; set; } = new();
        public HangfireStatsDto JobStats { get; set; } = new();
        public OperationalQueuesSummaryDto Queues { get; set; } = new();
        public NotificationStatsDto NotificationStats { get; set; } = new();
        public EnvironmentInfoDto Environment { get; set; } = new();
        public AdminPlatformSettingsDto PlatformSettings { get; set; } = new();
    }

    // ---- Hangfire / Jobs DTOs ----
    public class HangfireStatsDto
    {
        public long Enqueued { get; set; }
        public long Processing { get; set; }
        public long Scheduled { get; set; }
        public long Succeeded { get; set; }
        public long Failed { get; set; }
        public long ServersCount { get; set; }
        public long RecurringJobsCount { get; set; }
        public List<string> Queues { get; set; } = new();
    }

    public class FailedJobItemDto
    {
        public string JobId { get; set; } = string.Empty;
        public string JobType { get; set; } = string.Empty;
        public string Method { get; set; } = string.Empty;
        public string Queue { get; set; } = "default";
        public DateTime? FailedAt { get; set; }
        public string ExceptionType { get; set; } = string.Empty;
        public string ExceptionMessage { get; set; } = string.Empty;
        public int RetryCount { get; set; }
        public bool CanRetry { get; set; } = true;
        public string? HighRiskReason { get; set; }
    }

    public class RecurringJobItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string Cron { get; set; } = string.Empty;
        public string Queue { get; set; } = "default";
        public string JobType { get; set; } = string.Empty;
        public string Method { get; set; } = string.Empty;
        public DateTime? LastExecution { get; set; }
        public DateTime? NextExecution { get; set; }
        public string? LastJobState { get; set; }
        public string TimeZone { get; set; } = "UTC";
    }

    public class JobActionResponseDto
    {
        public string JobId { get; set; } = string.Empty;
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    // ---- Notification Operations DTOs ----
    public class NotificationStatsDto
    {
        public long TotalInApp { get; set; }
        public long UnreadInApp { get; set; }
        public long ReadInApp { get; set; }
        public long CreatedToday { get; set; }
        public List<ChannelStatusDto> Channels { get; set; } = new();
    }

    public class ChannelStatusDto
    {
        public string Channel { get; set; } = string.Empty; // "In-App", "SignalR Hub", "Email Worker", "WebPush"
        public string Status { get; set; } = "Active";
        public string Description { get; set; } = string.Empty;
    }

    public class AdminNotificationLogItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public string? Link { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class PagedNotificationLogsDto
    {
        public List<AdminNotificationLogItemDto> Items { get; set; } = new();
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public long TotalCount { get; set; }
        public int TotalPages { get; set; } = 1;
    }

    // ---- Operational Queues Aggregation DTO ----
    public class OperationalQueuesSummaryDto
    {
        public long PendingKycCount { get; set; }
        public long PendingInvestorVerificationsCount { get; set; }
        public long PendingServiceProviderVerificationsCount { get; set; }
        public long OpenReportsCount { get; set; }
        public long OpenDisputesCount { get; set; }
        public long PendingPayoutsCount { get; set; }
        public long FailedJobsCount { get; set; }
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    }

    // ---- Environment Info DTO ----
    public class EnvironmentInfoDto
    {
        public string EnvironmentName { get; set; } = "Development";
        public string FrameworkVersion { get; set; } = ".NET 8.0";
        public string ApplicationVersion { get; set; } = "1.0.0";
        public string CommitHash { get; set; } = "local";
        public DateTime ServerTimeUtc { get; set; } = DateTime.UtcNow;
        public string TimeZone { get; set; } = "UTC";
        public TimeSpan Uptime { get; set; }
        public string HostName { get; set; } = Environment.MachineName;
    }
}
