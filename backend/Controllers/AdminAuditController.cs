using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;

namespace WebApp.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public class AdminAuditController : ControllerBase
    {
        private readonly MongoDbContext _context;

        public AdminAuditController(MongoDbContext context)
        {
            _context = context;
        }

        // GET: api/admin/audit
        [HttpGet("audit")]
        public async Task<IActionResult> GetAuditLogs(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25,
            [FromQuery] string? action = null,
            [FromQuery] string? actor = null,
            [FromQuery] string? targetType = null,
            [FromQuery] bool? success = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] string? search = null)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var builder = Builders<AdminAuditLog>.Filter;
            var filter = builder.Empty;

            if (!string.IsNullOrWhiteSpace(action))
            {
                var escaped = Regex.Escape(action);
                filter &= builder.Regex(x => x.Action, new BsonRegularExpression(escaped, "i"));
            }

            if (!string.IsNullOrWhiteSpace(actor))
            {
                var escaped = Regex.Escape(actor);
                filter &= builder.Regex(x => x.Actor, new BsonRegularExpression(escaped, "i"));
            }

            if (!string.IsNullOrWhiteSpace(targetType))
            {
                filter &= builder.Eq(x => x.TargetType, targetType);
            }

            if (success.HasValue)
            {
                filter &= builder.Eq(x => x.Success, success.Value);
            }

            if (startDate.HasValue)
            {
                filter &= builder.Gte(x => x.Timestamp, startDate.Value.ToUniversalTime());
            }

            if (endDate.HasValue)
            {
                filter &= builder.Lte(x => x.Timestamp, endDate.Value.ToUniversalTime());
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var escaped = Regex.Escape(search);
                var reg = new BsonRegularExpression(escaped, "i");
                var searchFilter = builder.Or(
                    builder.Regex(x => x.Action, reg),
                    builder.Regex(x => x.Actor, reg),
                    builder.Regex(x => x.TargetId, reg),
                    builder.Regex(x => x.TargetType, reg)
                );
                filter &= searchFilter;
            }

            var totalCount = await _context.AdminAuditLogs.CountDocumentsAsync(filter);
            var skip = (page - 1) * pageSize;

            var logs = await _context.AdminAuditLogs
                .Find(filter)
                .SortByDescending(x => x.Timestamp)
                .Skip(skip)
                .Limit(pageSize)
                .ToListAsync();

            var items = logs.Select(l =>
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
            }).ToList();

            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            return Ok(ApiResponse.Ok("Audit log fetched", new PagedResult<AdminAuditLogItemDto>
            {
                Items = items,
                TotalCount = (int)totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = totalPages
            }));
        }

        // GET: api/admin/governance/summary
        [HttpGet("governance/summary")]
        public async Task<IActionResult> GetGovernanceSummary()
        {
            var openReportsTask = _context.ContentReports.CountDocumentsAsync(x => x.Status == ReportStatus.Open);
            var underReviewTask = _context.ContentReports.CountDocumentsAsync(x => x.Status == ReportStatus.UnderReview);
            var resolvedReportsTask = _context.ContentReports.CountDocumentsAsync(x => x.Status == ReportStatus.Resolved);
            var dismissedReportsTask = _context.ContentReports.CountDocumentsAsync(x => x.Status == ReportStatus.Dismissed);
            var totalReportsTask = _context.ContentReports.CountDocumentsAsync(Builders<ContentReport>.Filter.Empty);

            var hiddenServicesTask = _context.ServiceListings.CountDocumentsAsync(x => x.IsModerationHidden == true);
            var hiddenCreatorOffersTask = _context.CreatorIdeas.CountDocumentsAsync(Builders<CreatorIdea>.Filter.Eq("Phase5Data.PathA.MarketplaceListing.IsModerationHidden", true));
            var hiddenReviewsTask = _context.Reviews.CountDocumentsAsync(x => x.IsModerationHidden == true);
            var suspendedUsersTask = _context.ApplicationUsers.CountDocumentsAsync(x => x.LockoutEnd > DateTimeOffset.UtcNow);

            var openDisputesTask = _context.WorkroomMilestones.CountDocumentsAsync(x => x.MilestoneStatus == WorkroomMilestoneStatus.Disputed);
            var pendingVerificationsTask = _context.ApplicationUsers.CountDocumentsAsync(x =>
                x.Kyc.Status == VerificationStatus.Pending &&
                !string.IsNullOrEmpty(x.Kyc.Identity.FrontImage) &&
                x.Kyc.Identity.SubmittedAt != null);

            var totalAuditEventsTask = _context.AdminAuditLogs.CountDocumentsAsync(Builders<AdminAuditLog>.Filter.Empty);
            var recentAuditLogsTask = _context.AdminAuditLogs
                .Find(Builders<AdminAuditLog>.Filter.Empty)
                .SortByDescending(x => x.Timestamp)
                .Limit(5)
                .ToListAsync();

            await Task.WhenAll(
                openReportsTask,
                underReviewTask,
                resolvedReportsTask,
                dismissedReportsTask,
                totalReportsTask,
                hiddenServicesTask,
                hiddenCreatorOffersTask,
                hiddenReviewsTask,
                suspendedUsersTask,
                openDisputesTask,
                pendingVerificationsTask,
                totalAuditEventsTask,
                recentAuditLogsTask
            );

            var recentAuditItems = (await recentAuditLogsTask).Select(l => new AdminAuditLogItemDto
            {
                Id = l.Id,
                Action = l.Action,
                Actor = l.Actor,
                Success = l.Success,
                TargetType = l.TargetType,
                TargetId = l.TargetId,
                IpAddress = l.IpAddress,
                CorrelationId = l.CorrelationId,
                Timestamp = l.Timestamp
            }).ToList();

            var summary = new AdminGovernanceSummaryDto
            {
                OpenReportsCount = (int)await openReportsTask,
                UnderReviewReportsCount = (int)await underReviewTask,
                ResolvedReportsCount = (int)await resolvedReportsTask,
                DismissedReportsCount = (int)await dismissedReportsTask,
                TotalReportsCount = (int)await totalReportsTask,

                HiddenServicesCount = (int)await hiddenServicesTask,
                HiddenCreatorOffersCount = (int)await hiddenCreatorOffersTask,
                HiddenReviewsCount = (int)await hiddenReviewsTask,
                SuspendedUsersCount = (int)await suspendedUsersTask,

                OpenDisputesCount = (int)await openDisputesTask,
                PendingVerificationsCount = (int)await pendingVerificationsTask,
                TotalAuditEventsCount = (int)await totalAuditEventsTask,
                RecentAuditEvents = recentAuditItems
            };

            return Ok(ApiResponse.Ok("Governance summary retrieved", summary));
        }
    }
}
