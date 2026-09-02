using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Audit;

namespace WebApp.Controllers
{
    [ApiController]
    [Route("api/admin/security")]
    [Authorize(Roles = "SuperAdmin")]
    public class AdminSecurityController : ControllerBase
    {
        private readonly MongoDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IAuditLogger? _audit;

        public AdminSecurityController(
            MongoDbContext context,
            UserManager<ApplicationUser> userManager,
            IAuditLogger? audit = null)
        {
            _context = context;
            _userManager = userManager;
            _audit = audit;
        }

        // GET /api/admin/security/summary
        [HttpGet("summary")]
        public async Task<IActionResult> GetSecuritySummary()
        {
            var today = DateTime.UtcNow.Date;

            // Real stats from MongoDB
            var totalUsers = await _context.ApplicationUsers.CountDocumentsAsync(_ => true);
            var lockedUsers = await _context.ApplicationUsers.CountDocumentsAsync(u => u.LockoutEnd > DateTimeOffset.UtcNow);

            // Audit-based metrics for today
            var securityEventsToday = await _context.AdminAuditLogs.CountDocumentsAsync(l => l.Timestamp >= today);
            var failedLoginsToday = await _context.AdminAuditLogs.CountDocumentsAsync(l => l.Timestamp >= today && l.Success == false && (l.Action == "login" || l.Action == "login_failed"));

            // Privacy and Compliance queues
            var openPrivacyRequests = await _context.PrivacyRequests.CountDocumentsAsync(r => r.Status == PrivacyRequestStatus.Open || r.Status == PrivacyRequestStatus.UnderReview);
            var openComplianceCases = await _context.ComplianceCases.CountDocumentsAsync(c => c.Status == ComplianceCaseStatus.Open || c.Status == ComplianceCaseStatus.UnderReview);

            // High risk accounts (accounts locked or with failed count > 3 or open compliance cases)
            var highRiskUsers = await _context.ApplicationUsers.CountDocumentsAsync(u => u.AccessFailedCount >= 3 || u.LockoutEnd > DateTimeOffset.UtcNow);

            // Privileged changes (roles / permissions updated recently)
            var privilegedChanges = await _context.AdminAuditLogs.CountDocumentsAsync(l =>
                l.Timestamp >= today.AddDays(-7) &&
                (l.Action.Contains("role") || l.Action.Contains("privileged") || l.Action.Contains("admin_system") || l.Action.Contains("superadmin")));

            // Recent 10 security events
            var recentLogs = await _context.AdminAuditLogs
                .Find(_ => true)
                .SortByDescending(l => l.Timestamp)
                .Limit(10)
                .ToListAsync();

            var recentDtos = recentLogs.Select(MapAuditLogToDto).ToList();

            return Ok(ApiResponse.Ok("Security summary retrieved", new AdminSecuritySummaryDto
            {
                FailedLoginsTodayCount = (int)failedLoginsToday,
                LockedAccountsCount = (int)lockedUsers,
                SuspendedAccountsCount = (int)lockedUsers,
                SecurityEventsTodayCount = (int)securityEventsToday,
                OpenPrivacyRequestsCount = (int)openPrivacyRequests,
                OpenComplianceCasesCount = (int)openComplianceCases,
                HighRiskAccountsCount = (int)highRiskUsers + (int)openComplianceCases,
                RecentPrivilegedChangesCount = (int)privilegedChanges,
                RecentSecurityEvents = recentDtos
            }));
        }

        // GET /api/admin/security/events
        [HttpGet("events")]
        public async Task<IActionResult> GetSecurityEvents(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? eventType = null,
            [FromQuery] string? actor = null,
            [FromQuery] string? user = null,
            [FromQuery] bool? success = null,
            [FromQuery] string? search = null)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var builder = Builders<AdminAuditLog>.Filter;
            var filter = builder.Empty;

            if (!string.IsNullOrWhiteSpace(eventType))
            {
                var escaped = Regex.Escape(eventType.Trim());
                filter &= builder.Regex(x => x.Action, new BsonRegularExpression(escaped, "i"));
            }

            if (!string.IsNullOrWhiteSpace(actor))
            {
                var escaped = Regex.Escape(actor.Trim());
                filter &= builder.Regex(x => x.Actor, new BsonRegularExpression(escaped, "i"));
            }

            if (!string.IsNullOrWhiteSpace(user))
            {
                var escaped = Regex.Escape(user.Trim());
                filter &= (builder.Regex(x => x.Actor, new BsonRegularExpression(escaped, "i")) |
                           builder.Regex(x => x.TargetId, new BsonRegularExpression(escaped, "i")));
            }

            if (success.HasValue)
            {
                filter &= builder.Eq(x => x.Success, success.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var escaped = Regex.Escape(search.Trim());
                var regex = new BsonRegularExpression(escaped, "i");
                filter &= (builder.Regex(x => x.Action, regex) |
                           builder.Regex(x => x.Actor, regex) |
                           builder.Regex(x => x.TargetId, regex) |
                           builder.Regex(x => x.TargetType, regex));
            }

            var totalCount = await _context.AdminAuditLogs.CountDocumentsAsync(filter);
            var logs = await _context.AdminAuditLogs
                .Find(filter)
                .SortByDescending(x => x.Timestamp)
                .Skip((page - 1) * pageSize)
                .Limit(pageSize)
                .ToListAsync();

            var dtos = logs.Select(MapAuditLogToDto).ToList();
            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            return Ok(ApiResponse.Ok("Security events retrieved", new PagedResult<AdminAuditLogItemDto>
            {
                Items = dtos,
                TotalCount = (int)totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = totalPages
            }));
        }

        private async Task<ApplicationUser?> FindUserByIdOrEmailAsync(string identifier)
        {
            if (string.IsNullOrWhiteSpace(identifier)) return null;
            if (Guid.TryParse(identifier.Trim(), out _))
            {
                var byId = await _userManager.FindByIdAsync(identifier.Trim());
                if (byId != null) return byId;
            }
            return await _userManager.FindByEmailAsync(identifier.Trim()) ?? await _userManager.FindByNameAsync(identifier.Trim());
        }

        // GET /api/admin/security/users/{userId}/review
        [HttpGet("users/{userId}/review")]
        public async Task<IActionResult> GetUserSecurityReview(string userId)
        {
            var user = await FindUserByIdOrEmailAsync(userId);
            if (user == null)
            {
                return NotFound(ApiResponse.Error("User not found"));
            }

            var roles = await _userManager.GetRolesAsync(user);

            // Audit history for this user
            var builder = Builders<AdminAuditLog>.Filter;
            var filter = builder.Eq(x => x.Actor, user.Email) | builder.Eq(x => x.TargetId, userId);
            var auditLogs = await _context.AdminAuditLogs
                .Find(filter)
                .SortByDescending(x => x.Timestamp)
                .Limit(15)
                .ToListAsync();

            // Dependency check
            var activeEngagements = await _context.WorkroomEngagements
                .CountDocumentsAsync(e => (e.ClientId == user.Id.ToString() || e.ProviderId == user.Id.ToString()) &&
                                          e.EngagementStatus != EngagementStatus.Completed &&
                                          e.EngagementStatus != EngagementStatus.Cancelled);
            var openDisputes = await _context.WorkroomEngagements
                .CountDocumentsAsync(e => (e.ClientId == user.Id.ToString() || e.ProviderId == user.Id.ToString()) &&
                                          e.EngagementStatus == EngagementStatus.Disputed);
            var pendingPayouts = await _context.PayoutRequests
                .CountDocumentsAsync(p => p.ProviderId == user.Id.ToString() && p.Status == PayoutStatus.Requested);

            var signals = new List<string>();
            if (user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTimeOffset.UtcNow)
                signals.Add($"Account is locked until {user.LockoutEnd.Value:u}");
            if (user.AccessFailedCount > 3)
                signals.Add($"Elevated failed access attempts count: {user.AccessFailedCount}");
            if (openDisputes > 0)
                signals.Add($"User is involved in {openDisputes} open dispute(s).");
            if (activeEngagements > 0)
                signals.Add($"User has {activeEngagements} active ongoing engagement(s).");

            var dto = new UserSecurityReviewDto
            {
                UserId = user.Id.ToString(),
                Email = user.Email ?? string.Empty,
                DisplayName = user.Name ?? user.UserName ?? string.Empty,
                Roles = roles.ToList(),
                IsLocked = user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTimeOffset.UtcNow,
                LockoutEnd = user.LockoutEnd,
                AccessFailedCount = user.AccessFailedCount,
                KycStatus = user.Kyc?.Status.ToString() ?? user.KycStatus ?? "None",
                JoinedAt = user.CreatedAt,
                LastLogin = user.LastLogin,
                FactualSignals = signals,
                DependencyCheck = new DeletionDependencyCheck
                {
                    ActiveEngagementsCount = (int)activeEngagements,
                    HasActiveEngagements = activeEngagements > 0,
                    OpenDisputesCount = (int)openDisputes,
                    HasOpenDisputes = openDisputes > 0,
                    PendingPayoutsCount = (int)pendingPayouts,
                    HasPendingPayouts = pendingPayouts > 0,
                    HasKycRecords = user.Kyc != null,
                    KycStatus = user.Kyc?.Status.ToString() ?? user.KycStatus ?? "None",
                    Summary = signals.Any() ? string.Join("; ", signals) : "Clean security profile."
                },
                RecentAuditHistory = auditLogs.Select(MapAuditLogToDto).ToList()
            };

            return Ok(ApiResponse.Ok("User security review retrieved", dto));
        }

        // POST /api/admin/security/users/{userId}/revoke-sessions
        [HttpPost("users/{userId}/revoke-sessions")]
        public async Task<IActionResult> RevokeUserSessions(string userId)
        {
            var user = await FindUserByIdOrEmailAsync(userId);
            if (user == null)
            {
                return NotFound(ApiResponse.Error("User not found"));
            }

            var roles = await _userManager.GetRolesAsync(user);
            var isTargetSuperAdmin = roles.Contains("SuperAdmin", StringComparer.OrdinalIgnoreCase);
            var currentIsSuperAdmin = User.IsInRole("SuperAdmin");

            // SuperAdmin protection: normal Admin cannot revoke SuperAdmin session
            if (isTargetSuperAdmin && !currentIsSuperAdmin)
            {
                return StatusCode(403, ApiResponse.Error("Unauthorized to revoke SuperAdmin sessions."));
            }

            // Real session / token revocation:
            // 1. Update SecurityStamp in ASP.NET Core Identity (invalidates current cookies/claims)
            await _userManager.UpdateSecurityStampAsync(user);

            // 2. Clear stored RefreshToken
            user.RefreshToken = new RefreshToken
            {
                Token = string.Empty,
                ExpiresAt = DateTime.UtcNow.AddDays(-1),
                IsRevoked = true
            };
            await _userManager.UpdateAsync(user);

            var adminActor = User.Identity?.Name ?? "admin";
            _audit?.Record("session_revoked", adminActor, true, new
            {
                targetUserId = userId,
                targetEmail = user.Email,
                revokedBy = adminActor
            });

            return Ok(ApiResponse.Ok("User sessions and refresh tokens have been revoked. The user will be required to re-authenticate."));
        }

        private static AdminAuditLogItemDto MapAuditLogToDto(AdminAuditLog l)
        {
            Dictionary<string, object?>? detailsMap = null;
            if (l.Details != null)
            {
                try
                {
                    detailsMap = BsonTypeMapper.MapToDotNetValue(l.Details) as Dictionary<string, object?>;
                }
                catch
                {
                    detailsMap = new Dictionary<string, object?> { ["raw"] = l.Details.ToString() };
                }
            }

            return new AdminAuditLogItemDto
            {
                Id = l.Id,
                Action = l.Action,
                Actor = l.Actor,
                Success = l.Success,
                TargetType = l.TargetType,
                TargetId = l.TargetId,
                IpAddress = l.IpAddress,
                CorrelationId = l.CorrelationId,
                Timestamp = l.Timestamp,
                Details = detailsMap
            };
        }
    }
}
