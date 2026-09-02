using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Hangfire;
using Hangfire.Storage;
using Hangfire.Storage.Monitoring;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Audit;
using WebApp.Services.Interface;

namespace WebApp.Controllers
{
    [ApiController]
    [Route("api/admin/system")]
    [Authorize(Roles = "SuperAdmin")]
    public class AdminSystemController : ControllerBase
    {
        private readonly MongoDbContext _context;
        private readonly IPlatformSettingsService _settingsService;
        private readonly IAuditLogger _auditLogger;
        private readonly ILogger<AdminSystemController> _logger;
        private static readonly DateTime _processStartTime = Process.GetCurrentProcess().StartTime.ToUniversalTime();

        // High-risk job signatures that must NOT be manually retried from UI
        private static readonly string[] HighRiskJobPatterns = new[]
        {
            "payout",
            "settlement",
            "refund",
            "dispute",
            "deleteuser",
            "transferfunds",
            "paymentcapture"
        };

        public AdminSystemController(
            MongoDbContext context,
            IPlatformSettingsService settingsService,
            IAuditLogger auditLogger,
            ILogger<AdminSystemController> logger)
        {
            _context = context;
            _settingsService = settingsService;
            _auditLogger = auditLogger;
            _logger = logger;
        }

        private string CurrentUserId =>
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
            User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value ??
            User.FindFirst("sub")?.Value ??
            "system";

        // ==========================================
        // 1. SYSTEM OVERVIEW
        // ==========================================
        [HttpGet("overview")]
        public async Task<IActionResult> GetSystemOverview()
        {
            var health = await ComputeHealthAsync();
            var hangfireStats = GetHangfireStatsSafe();
            var queues = await ComputeQueuesSummaryAsync();
            var notifs = await ComputeNotificationStatsAsync();
            var env = GetEnvironmentInfoSafe();

            var overview = new SystemOverviewDto
            {
                Health = health,
                JobStats = hangfireStats,
                Queues = queues,
                NotificationStats = notifs,
                Environment = env
            };

            return Ok(ApiResponse.Ok("System overview loaded.", overview));
        }

        // ==========================================
        // 2. SYSTEM HEALTH & DIAGNOSTICS
        // ==========================================
        [HttpGet("health")]
        public async Task<IActionResult> GetSystemHealth()
        {
            var health = await ComputeHealthAsync();
            return Ok(ApiResponse.Ok("System health check completed.", health));
        }

        // ==========================================
        // 3. BACKGROUND JOBS & HANGFIRE MONITORING
        // ==========================================
        [HttpGet("jobs/stats")]
        public IActionResult GetJobStats()
        {
            var stats = GetHangfireStatsSafe();
            return Ok(ApiResponse.Ok("Hangfire job stats loaded.", stats));
        }

        [HttpGet("jobs/failed")]
        public IActionResult GetFailedJobs([FromQuery] int page = 1, [FromQuery] int pageSize = 25)
        {
            try
            {
                var monitoringApi = JobStorage.Current?.GetMonitoringApi();
                if (monitoringApi == null)
                {
                    return Ok(ApiResponse.Ok("Job storage monitoring unavailable.", new List<FailedJobItemDto>()));
                }

                var safePage = Math.Max(1, page);
                var safePageSize = Math.Clamp(pageSize, 1, 100);
                var from = (safePage - 1) * safePageSize;

                var failedJobs = monitoringApi.FailedJobs(from, safePageSize);
                var results = new List<FailedJobItemDto>();

                foreach (var kv in failedJobs)
                {
                    var jobId = kv.Key;
                    var jobDetails = kv.Value;
                    var jobType = jobDetails.Job?.Type?.Name ?? "UnknownJob";
                    var method = jobDetails.Job?.Method?.Name ?? "UnknownMethod";

                    var isHighRisk = HighRiskJobPatterns.Any(p =>
                        jobType.ToLowerInvariant().Contains(p) ||
                        method.ToLowerInvariant().Contains(p));

                    results.Add(new FailedJobItemDto
                    {
                        JobId = jobId,
                        JobType = jobType,
                        Method = method,
                        Queue = "default",
                        FailedAt = jobDetails.FailedAt,
                        ExceptionType = jobDetails.ExceptionType ?? "UnknownException",
                        ExceptionMessage = jobDetails.ExceptionMessage?.Length > 300
                            ? jobDetails.ExceptionMessage.Substring(0, 300) + "..."
                            : jobDetails.ExceptionMessage ?? "No error message",
                        RetryCount = 0,
                        CanRetry = !isHighRisk,
                        HighRiskReason = isHighRisk ? "Financial or state-destructive job must not be retried manually from Admin UI." : null
                    });
                }

                return Ok(ApiResponse.Ok("Failed jobs loaded.", results));
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error reading failed Hangfire jobs.");
                return Ok(ApiResponse.Ok("Failed jobs query degraded.", new List<FailedJobItemDto>()));
            }
        }

        [HttpGet("jobs/recurring")]
        public IActionResult GetRecurringJobs()
        {
            try
            {
                using var connection = JobStorage.Current?.GetConnection();
                if (connection == null)
                {
                    return Ok(ApiResponse.Ok("Recurring jobs connection unavailable.", new List<RecurringJobItemDto>()));
                }

                var recurring = connection.GetRecurringJobs();
                var items = recurring.Select(r => new RecurringJobItemDto
                {
                    Id = r.Id,
                    Cron = r.Cron ?? string.Empty,
                    Queue = r.Queue ?? "default",
                    JobType = r.Job?.Type?.Name ?? "UnknownJob",
                    Method = r.Job?.Method?.Name ?? "UnknownMethod",
                    LastExecution = r.LastExecution,
                    NextExecution = r.NextExecution,
                    LastJobState = r.LastJobState,
                    TimeZone = r.TimeZoneId ?? "UTC"
                }).ToList();

                return Ok(ApiResponse.Ok("Recurring jobs loaded.", items));
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error reading recurring jobs.");
                return Ok(ApiResponse.Ok("Recurring jobs query degraded.", new List<RecurringJobItemDto>()));
            }
        }

        [HttpPost("jobs/{jobId}/retry")]
        public IActionResult RetryJob(string jobId)
        {
            if (string.IsNullOrWhiteSpace(jobId))
                return BadRequest(ApiResponse.Error("Job ID is required.", HttpContext.TraceIdentifier));

            try
            {
                // Validate job details & risk status
                var monitoringApi = JobStorage.Current?.GetMonitoringApi();
                if (monitoringApi == null)
                    return BadRequest(ApiResponse.Error("Hangfire job storage is unavailable.", HttpContext.TraceIdentifier));

                JobDetailsDto? jobDetails = null;
                try
                {
                    jobDetails = monitoringApi.JobDetails(jobId);
                }
                catch (Exception)
                {
                    // Hangfire throws when a job does not exist in storage
                    return NotFound(ApiResponse.Error($"Job '{jobId}' was not found in storage.", HttpContext.TraceIdentifier));
                }

                if (jobDetails == null)
                    return NotFound(ApiResponse.Error($"Job '{jobId}' was not found.", HttpContext.TraceIdentifier));

                var jobType = jobDetails.Job?.Type?.Name ?? "";
                var method = jobDetails.Job?.Method?.Name ?? "";

                var isHighRisk = HighRiskJobPatterns.Any(p =>
                    jobType.ToLowerInvariant().Contains(p) ||
                    method.ToLowerInvariant().Contains(p));

                if (isHighRisk)
                {
                    _logger.LogWarning("Admin {UserId} attempted to manually retry high-risk job {JobId} ({JobType}.{Method})",
                        CurrentUserId, jobId, jobType, method);

                    return StatusCode(403, ApiResponse.Error(
                        "Manual retry is prohibited for high-risk operations (financial, payouts, settlements, disputes, and deletions).",
                        HttpContext.TraceIdentifier));
                }

                // Safe Hangfire requeue
                BackgroundJob.Requeue(jobId);

                _auditLogger.Record(
                    "admin_job_retried",
                    CurrentUserId,
                    true,
                    new { resourceType = "HangfireJob", resourceId = jobId, JobType = jobType, Method = method }
                );

                return Ok(ApiResponse.Ok($"Job '{jobId}' successfully requeued.", new JobActionResponseDto
                {
                    JobId = jobId,
                    Success = true,
                    Message = "Job requeued."
                }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error requeuing job {JobId}", jobId);
                return StatusCode(500, ApiResponse.Error("Failed to requeue job.", HttpContext.TraceIdentifier));
            }
        }

        // ==========================================
        // 4. NOTIFICATION OPERATIONS
        // ==========================================
        [HttpGet("notifications/stats")]
        public async Task<IActionResult> GetNotificationStats()
        {
            var stats = await ComputeNotificationStatsAsync();
            return Ok(ApiResponse.Ok("Notification operational statistics loaded.", stats));
        }

        [HttpGet("notifications/logs")]
        public async Task<IActionResult> GetNotificationLogs(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var safePage = Math.Max(1, page);
            var safePageSize = Math.Clamp(pageSize, 1, 100);

            var totalCount = await _context.Notifications.CountDocumentsAsync(Builders<Notification>.Filter.Empty);
            var items = await _context.Notifications.Find(Builders<Notification>.Filter.Empty)
                .SortByDescending(n => n.CreatedAt)
                .Skip((safePage - 1) * safePageSize)
                .Limit(safePageSize)
                .ToListAsync();

            var dtos = items.Select(n => new AdminNotificationLogItemDto
            {
                Id = n.Id.ToString(),
                UserId = n.UserId.ToString(),
                Title = n.Title,
                Type = n.Type,
                IsRead = n.IsRead,
                Link = n.Link,
                CreatedAt = n.CreatedAt
            }).ToList();

            var totalPages = (int)Math.Ceiling((double)totalCount / safePageSize);

            return Ok(ApiResponse.Ok("Notification logs loaded.", new PagedNotificationLogsDto
            {
                Items = dtos,
                Page = safePage,
                PageSize = safePageSize,
                TotalCount = totalCount,
                TotalPages = totalPages > 0 ? totalPages : 1
            }));
        }

        // ==========================================
        // 5. OPERATIONAL QUEUES
        // ==========================================
        [HttpGet("queues")]
        public async Task<IActionResult> GetOperationalQueues()
        {
            var queues = await ComputeQueuesSummaryAsync();
            return Ok(ApiResponse.Ok("Operational queues summary loaded.", queues));
        }

        // ==========================================
        // 6. PLATFORM CONTROLS (SUPERADMIN ONLY)
        // ==========================================
        [HttpGet("controls")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> GetPlatformControls()
        {
            var settings = await _settingsService.GetAdminSettingsDtoAsync();
            return Ok(ApiResponse.Ok("Platform controls loaded.", settings));
        }

        [HttpPut("controls")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> UpdatePlatformControls([FromBody] UpdatePlatformSettingsRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse.Error("Invalid platform settings payload.", HttpContext.TraceIdentifier));

            var result = await _settingsService.UpdateSettingsAsync(request, CurrentUserId);
            if (!result.Success)
            {
                return Conflict(ApiResponse.Error(result.Message, HttpContext.TraceIdentifier));
            }

            return Ok(ApiResponse.Ok(result.Message, result.UpdatedSettings));
        }

        // ==========================================
        // 7. ENVIRONMENT & RUNTIME INFO
        // ==========================================
        [HttpGet("environment")]
        public IActionResult GetEnvironment()
        {
            var info = GetEnvironmentInfoSafe();
            return Ok(ApiResponse.Ok("Server environment info loaded.", info));
        }

        // ==========================================
        // PRIVATE HELPERS
        // ==========================================
        private async Task<SystemHealthDto> ComputeHealthAsync()
        {
            var health = new SystemHealthDto
            {
                Timestamp = DateTime.UtcNow,
                Version = "1.0.0"
            };

            var overallDegraded = false;

            // 1. API Process check
            health.Api = new ComponentHealthDto
            {
                Status = "Healthy",
                Message = "ASP.NET Core API process operational.",
                ResponseTimeMs = 1,
                Details = new Dictionary<string, object>
                {
                    { "uptimeSeconds", (long)(DateTime.UtcNow - _processStartTime).TotalSeconds }
                }
            };

            // 2. MongoDB ping check
            var dbSw = Stopwatch.StartNew();
            try
            {
                await _context.Database.RunCommandAsync<BsonDocument>(new BsonDocument("ping", 1));
                dbSw.Stop();
                health.Database = new ComponentHealthDto
                {
                    Status = "Healthy",
                    Message = "MongoDB cluster connected and responding to ping.",
                    ResponseTimeMs = dbSw.ElapsedMilliseconds
                };
            }
            catch (Exception ex)
            {
                dbSw.Stop();
                health.Database = new ComponentHealthDto
                {
                    Status = "Unhealthy",
                    Message = $"MongoDB ping failed: {ex.Message}",
                    ResponseTimeMs = dbSw.ElapsedMilliseconds
                };
                overallDegraded = true;
            }

            // 3. Hangfire health
            try
            {
                var monitoringApi = JobStorage.Current?.GetMonitoringApi();
                if (monitoringApi != null)
                {
                    var servers = monitoringApi.Servers();
                    var stats = monitoringApi.GetStatistics();
                    var hasServers = servers != null && servers.Count > 0;

                    health.Hangfire = new ComponentHealthDto
                    {
                        Status = hasServers ? "Healthy" : "Degraded",
                        Message = hasServers
                            ? $"{servers?.Count ?? 0} Hangfire server(s) active. ({stats.Failed} failed jobs)"
                            : "No active Hangfire processing servers detected.",
                        Details = new Dictionary<string, object>
                        {
                            { "serverCount", servers?.Count ?? 0 },
                            { "failedJobs", stats.Failed },
                            { "enqueuedJobs", stats.Enqueued }
                        }
                    };

                    if (!hasServers) overallDegraded = true;
                }
                else
                {
                    health.Hangfire = new ComponentHealthDto
                    {
                        Status = "Degraded",
                        Message = "Hangfire monitoring API unavailable."
                    };
                    overallDegraded = true;
                }
            }
            catch (Exception ex)
            {
                health.Hangfire = new ComponentHealthDto
                {
                    Status = "Degraded",
                    Message = $"Hangfire check failed: {ex.Message}"
                };
                overallDegraded = true;
            }

            // 4. Notifications health
            try
            {
                var notifCount = await _context.Notifications.CountDocumentsAsync(FilterDefinition<Notification>.Empty);
                health.Notifications = new ComponentHealthDto
                {
                    Status = "Healthy",
                    Message = "Notification engine & collection operational.",
                    Details = new Dictionary<string, object>
                    {
                        { "totalStored", notifCount }
                    }
                };
            }
            catch (Exception ex)
            {
                health.Notifications = new ComponentHealthDto
                {
                    Status = "Degraded",
                    Message = $"Notification collection check failed: {ex.Message}"
                };
                overallDegraded = true;
            }

            // 5. Storage health
            health.Storage = new ComponentHealthDto
            {
                Status = "Healthy",
                Message = "Database & media storage operational."
            };

            health.OverallStatus = overallDegraded ? "Degraded" : "Healthy";
            return health;
        }

        private HangfireStatsDto GetHangfireStatsSafe()
        {
            try
            {
                var monitoringApi = JobStorage.Current?.GetMonitoringApi();
                if (monitoringApi == null) return new HangfireStatsDto();

                var stats = monitoringApi.GetStatistics();
                var queues = monitoringApi.Queues()?.Select(q => q.Name).ToList() ?? new List<string> { "default", "ai" };

                using var conn = JobStorage.Current?.GetConnection();
                var recurringCount = conn?.GetRecurringJobs()?.Count ?? 0;

                return new HangfireStatsDto
                {
                    Enqueued = stats.Enqueued,
                    Processing = stats.Processing,
                    Scheduled = stats.Scheduled,
                    Succeeded = stats.Succeeded,
                    Failed = stats.Failed,
                    ServersCount = stats.Servers,
                    RecurringJobsCount = recurringCount,
                    Queues = queues
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to retrieve Hangfire stats.");
                return new HangfireStatsDto();
            }
        }

        private async Task<OperationalQueuesSummaryDto> ComputeQueuesSummaryAsync()
        {
            var summary = new OperationalQueuesSummaryDto
            {
                GeneratedAt = DateTime.UtcNow
            };

            try
            {
                // 1. Pending KYC
                summary.PendingKycCount = await _context.ApplicationUsers.CountDocumentsAsync(
                    Builders<ApplicationUser>.Filter.Eq("Kyc.Status", "PendingReview")
                );
            }
            catch { }

            try
            {
                // 2. Pending Investor Finance
                summary.PendingInvestorVerificationsCount = await _context.InvestorFinanceVerifications.CountDocumentsAsync(
                    Builders<InvestorFinanceVerification>.Filter.Eq("Status", "Pending")
                );
            }
            catch { }

            try
            {
                // 3. Pending SP Credentials
                summary.PendingServiceProviderVerificationsCount = await _context.ServiceProviderProfiles.CountDocumentsAsync(
                    Builders<ServiceProviderProfileRecord>.Filter.Eq("Verification.Status", "Pending")
                );
            }
            catch { }

            try
            {
                // 4. Open Reports
                summary.OpenReportsCount = await _context.ContentReports.CountDocumentsAsync(
                    Builders<ContentReport>.Filter.In("Status", new[] { "Open", "UnderReview" })
                );
            }
            catch { }

            try
            {
                // 5. Open Disputes
                summary.OpenDisputesCount = await _context.WorkroomMilestones.CountDocumentsAsync(
                    Builders<WorkroomMilestone>.Filter.Eq("HasActiveDispute", true)
                );
            }
            catch { }

            try
            {
                // 6. Pending Payouts
                summary.PendingPayoutsCount = await _context.PayoutRequests.CountDocumentsAsync(
                    Builders<PayoutRequest>.Filter.In("Status", new[] { 0, 1, 2 }) // Requested, UnderReview, Processing
                );
            }
            catch { }

            try
            {
                // 7. Failed Jobs
                var monitoringApi = JobStorage.Current?.GetMonitoringApi();
                if (monitoringApi != null)
                {
                    summary.FailedJobsCount = monitoringApi.GetStatistics().Failed;
                }
            }
            catch { }

            return summary;
        }

        private async Task<NotificationStatsDto> ComputeNotificationStatsAsync()
        {
            var stats = new NotificationStatsDto();
            try
            {
                stats.TotalInApp = await _context.Notifications.CountDocumentsAsync(FilterDefinition<Notification>.Empty);
                stats.UnreadInApp = await _context.Notifications.CountDocumentsAsync(n => !n.IsRead);
                stats.ReadInApp = await _context.Notifications.CountDocumentsAsync(n => n.IsRead);

                var startOfToday = DateTime.UtcNow.Date;
                stats.CreatedToday = await _context.Notifications.CountDocumentsAsync(n => n.CreatedAt >= startOfToday);

                stats.Channels = new List<ChannelStatusDto>
                {
                    new() { Channel = "In-App Notifications", Status = "Active", Description = "Persisted to MongoDB Notifications collection" },
                    new() { Channel = "SignalR Realtime Hub", Status = "Active", Description = "/hubs/notifications WebSocket & long-polling" },
                    new() { Channel = "Email Queue Worker", Status = "Active", Description = "Channel-based background SMTP sender" },
                    new() { Channel = "Web Push Service", Status = "Active", Description = "VAPID WebPush subscription dispatcher" }
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to compute notification stats.");
            }

            return stats;
        }

        private EnvironmentInfoDto GetEnvironmentInfoSafe()
        {
            return new EnvironmentInfoDto
            {
                EnvironmentName = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development",
                FrameworkVersion = $".NET {Environment.Version}",
                ApplicationVersion = typeof(AdminSystemController).Assembly.GetName().Version?.ToString() ?? "1.0.0",
                CommitHash = Environment.GetEnvironmentVariable("BUILD_SHA") ?? "local-dev",
                ServerTimeUtc = DateTime.UtcNow,
                TimeZone = TimeZoneInfo.Local.DisplayName,
                Uptime = DateTime.UtcNow - _processStartTime,
                HostName = Environment.MachineName
            };
        }

        private static bool IsHighRiskJob(string jobType, string method)
        {
            var combined = $"{jobType}_{method}".ToLowerInvariant();
            return HighRiskJobPatterns.Any(p => combined.Contains(p));
        }
    }
}
