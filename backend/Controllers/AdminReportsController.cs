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
    [Route("api/admin/reports")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public class AdminReportsController : ControllerBase
    {
        private readonly MongoDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IAuditLogger? _audit;

        public AdminReportsController(
            MongoDbContext context,
            UserManager<ApplicationUser> userManager,
            IAuditLogger? audit = null)
        {
            _context = context;
            _userManager = userManager;
            _audit = audit;
        }

        private string CurrentAdminId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
        private string CurrentAdminEmail => User.FindFirstValue(ClaimTypes.Email) ?? "admin@mondial.com";

        // GET: api/admin/reports
        [HttpGet]
        public async Task<IActionResult> GetReports(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25,
            [FromQuery] string? search = null,
            [FromQuery] string? status = null,
            [FromQuery] string? category = null,
            [FromQuery] string? targetType = null)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var builder = Builders<ContentReport>.Filter;
            var filter = builder.Empty;

            if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<ReportStatus>(status, true, out var stEnum))
            {
                filter &= builder.Eq(x => x.Status, stEnum);
            }

            if (!string.IsNullOrWhiteSpace(category) && Enum.TryParse<ReportCategory>(category, true, out var catEnum))
            {
                filter &= builder.Eq(x => x.Category, catEnum);
            }

            if (!string.IsNullOrWhiteSpace(targetType) && Enum.TryParse<ReportTargetType>(targetType, true, out var ttEnum))
            {
                filter &= builder.Eq(x => x.TargetType, ttEnum);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var escaped = Regex.Escape(search);
                var reg = new BsonRegularExpression(escaped, "i");
                var searchFilter = builder.Or(
                    builder.Regex(x => x.Description, reg),
                    builder.Regex(x => x.TargetId, reg),
                    builder.Regex(x => x.ReporterEmail, reg),
                    builder.Regex(x => x.ReporterName, reg)
                );
                filter &= searchFilter;
            }

            var totalCount = await _context.ContentReports.CountDocumentsAsync(filter);
            var skip = (page - 1) * pageSize;

            var reports = await _context.ContentReports
                .Find(filter)
                .SortByDescending(x => x.CreatedAt)
                .Skip(skip)
                .Limit(pageSize)
                .ToListAsync();

            // Populate target summaries in bulk
            var serviceIds = reports.Where(r => r.TargetType == ReportTargetType.ServiceListing).Select(r => r.TargetId).Distinct().ToList();
            var ideaIds = reports.Where(r => r.TargetType == ReportTargetType.CreatorOffer).Select(r => r.TargetId).Distinct().ToList();
            var reviewIds = reports.Where(r => r.TargetType == ReportTargetType.Review).Select(r => r.TargetId).Distinct().ToList();
            var userIds = reports.Where(r => r.TargetType == ReportTargetType.UserProfile).Select(r => r.TargetId).Distinct().ToList();

            var services = serviceIds.Count > 0
                ? (await _context.ServiceListings.Find(x => serviceIds.Contains(x.Id)).ToListAsync()).ToDictionary(x => x.Id, x => x.Title)
                : new Dictionary<string, string>();

            var ideas = ideaIds.Count > 0
                ? (await _context.CreatorIdeas.Find(x => ideaIds.Contains(x.Id)).ToListAsync()).ToDictionary(x => x.Id, x => x.Project?.Name ?? "Creator Offer")
                : new Dictionary<string, string>();

            var reviews = reviewIds.Count > 0
                ? (await _context.Reviews.Find(x => reviewIds.Contains(x.Id)).ToListAsync()).ToDictionary(x => x.Id, x => x.WrittenReview?.Length > 60 ? x.WrittenReview[..60] + "..." : (x.WrittenReview ?? "Review"))
                : new Dictionary<string, string>();

            var users = userIds.Count > 0
                ? (await _context.ApplicationUsers.Find(x => userIds.Contains(x.Id.ToString())).ToListAsync()).ToDictionary(x => x.Id.ToString(), x => x.Name ?? x.UserName ?? x.Email ?? x.Id.ToString())
                : new Dictionary<string, string>();

            var items = reports.Select(r =>
            {
                string targetSummary = r.TargetId;
                if (r.TargetType == ReportTargetType.ServiceListing && services.TryGetValue(r.TargetId, out var sTitle))
                    targetSummary = sTitle;
                else if (r.TargetType == ReportTargetType.CreatorOffer && ideas.TryGetValue(r.TargetId, out var iConcept))
                    targetSummary = iConcept;
                else if (r.TargetType == ReportTargetType.Review && reviews.TryGetValue(r.TargetId, out var rText))
                    targetSummary = rText;
                else if (r.TargetType == ReportTargetType.UserProfile && users.TryGetValue(r.TargetId, out var uName))
                    targetSummary = uName;

                return new AdminReportListItemDto
                {
                    Id = r.Id,
                    TargetType = r.TargetType.ToString(),
                    TargetId = r.TargetId,
                    TargetSummary = targetSummary,
                    ReporterId = r.ReporterUserId,
                    ReporterName = r.ReporterName,
                    ReporterEmail = r.ReporterEmail,
                    Category = r.Category.ToString(),
                    Description = r.Description,
                    Status = r.Status.ToString(),
                    CreatedAt = r.CreatedAt,
                    UpdatedAt = r.UpdatedAt,
                    ReviewedByAdminId = r.ReviewedByAdminId,
                    ReviewedAt = r.ReviewedAt,
                    Resolution = r.Resolution
                };
            }).ToList();

            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            return Ok(ApiResponse.Ok("Reports retrieved", new PagedResult<AdminReportListItemDto>
            {
                Items = items,
                TotalCount = (int)totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = totalPages
            }));
        }

        // GET: api/admin/reports/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetReportDetail(string id)
        {
            if (!MongoDB.Bson.ObjectId.TryParse(id, out _))
                return NotFound(ApiResponse.Error("Report not found.", HttpContext.TraceIdentifier));

            var report = await _context.ContentReports.Find(x => x.Id == id).FirstOrDefaultAsync();
            if (report == null)
                return NotFound(ApiResponse.Error("Report not found.", HttpContext.TraceIdentifier));

            object? targetData = null;
            bool isHidden = false;

            switch (report.TargetType)
            {
                case ReportTargetType.ServiceListing:
                    var s = await _context.ServiceListings.Find(x => x.Id == report.TargetId).FirstOrDefaultAsync();
                    if (s != null)
                    {
                        isHidden = s.IsModerationHidden;
                        targetData = new
                        {
                            id = s.Id,
                            title = s.Title,
                            description = s.Description,
                            category = s.Category.ToString(),
                            status = s.Status.ToString(),
                            providerId = s.ProviderId,
                            isModerationHidden = s.IsModerationHidden,
                            moderationReason = s.ModerationReason
                        };
                    }
                    break;

                case ReportTargetType.CreatorOffer:
                    var idea = await _context.CreatorIdeas.Find(x => x.Id == report.TargetId).FirstOrDefaultAsync();
                    if (idea != null)
                    {
                        var mkt = idea.Phase5Data?.PathA?.MarketplaceListing;
                        isHidden = mkt?.IsModerationHidden ?? false;
                        targetData = new
                        {
                            ideaId = idea.Id,
                            concept = idea.Project?.Name ?? "Creator Offer",
                            creatorId = idea.UserId,
                            status = mkt?.Status ?? "draft",
                            saleType = mkt?.SaleType ?? "full_buyout",
                            askingPrice = mkt?.AskingPrice ?? 0m,
                            isModerationHidden = isHidden,
                            moderationReason = mkt?.ModerationReason
                        };
                    }
                    break;

                case ReportTargetType.Review:
                    var rev = await _context.Reviews.Find(x => x.Id == report.TargetId).FirstOrDefaultAsync();
                    if (rev != null)
                    {
                        isHidden = rev.IsModerationHidden;
                        targetData = new
                        {
                            id = rev.Id,
                            engagementId = rev.EngagementId,
                            clientId = rev.ClientId,
                            providerId = rev.ProviderId,
                            rating = rev.OverallRating,
                            writtenReview = rev.WrittenReview,
                            isModerationHidden = rev.IsModerationHidden,
                            moderationReason = rev.ModerationReason
                        };
                    }
                    break;

                case ReportTargetType.UserProfile:
                    var u = await _userManager.FindByIdAsync(report.TargetId);
                    if (u != null)
                    {
                        isHidden = u.LockoutEnd.HasValue && u.LockoutEnd > DateTimeOffset.UtcNow;
                        targetData = new
                        {
                            userId = u.Id.ToString(),
                            name = u.Name,
                            email = u.Email,
                            roles = u.Roles,
                            isSuspended = isHidden
                        };
                    }
                    break;
            }

            var previousReportsCount = (int)await _context.ContentReports.CountDocumentsAsync(x =>
                x.TargetType == report.TargetType &&
                x.TargetId == report.TargetId &&
                x.Id != report.Id
            );

            var detail = new AdminReportDetailDto
            {
                Id = report.Id,
                TargetType = report.TargetType.ToString(),
                TargetId = report.TargetId,
                Category = report.Category.ToString(),
                Description = report.Description,
                Status = report.Status.ToString(),
                CreatedAt = report.CreatedAt,
                UpdatedAt = report.UpdatedAt,
                ReporterId = report.ReporterUserId,
                ReporterName = report.ReporterName,
                ReporterEmail = report.ReporterEmail,
                ReviewedByAdminId = report.ReviewedByAdminId,
                ReviewedAt = report.ReviewedAt,
                Resolution = report.Resolution,
                AdminNotes = report.AdminNotes,
                TargetData = targetData,
                IsTargetCurrentlyHidden = isHidden,
                PreviousReportsCountOnTarget = previousReportsCount
            };

            return Ok(ApiResponse.Ok("Report detail loaded", detail));
        }

        // POST: api/admin/reports/{id}/under-review
        [HttpPost("{id}/under-review")]
        public async Task<IActionResult> MarkUnderReview(string id)
        {
            if (!MongoDB.Bson.ObjectId.TryParse(id, out _))
                return NotFound(ApiResponse.Error("Report not found.", HttpContext.TraceIdentifier));

            var adminId = CurrentAdminId;
            var now = DateTime.UtcNow;

            var filter = Builders<ContentReport>.Filter.And(
                Builders<ContentReport>.Filter.Eq(x => x.Id, id),
                Builders<ContentReport>.Filter.Eq(x => x.Status, ReportStatus.Open)
            );

            var update = Builders<ContentReport>.Update
                .Set(x => x.Status, ReportStatus.UnderReview)
                .Set(x => x.ReviewedByAdminId, adminId)
                .Set(x => x.ReviewedAt, now)
                .Set(x => x.UpdatedAt, now);

            var result = await _context.ContentReports.FindOneAndUpdateAsync(filter, update, new FindOneAndUpdateOptions<ContentReport>
            {
                ReturnDocument = ReturnDocument.After
            });

            if (result == null)
            {
                return Conflict(ApiResponse.Error("Report is not in Open status or has already been modified.", HttpContext.TraceIdentifier));
            }

            _audit?.Record("admin_report_under_review", CurrentAdminEmail, true, new
            {
                reportId = result.Id,
                targetType = result.TargetType.ToString(),
                targetId = result.TargetId
            });

            return Ok(ApiResponse.Ok("Report moved to Under Review status", new
            {
                id = result.Id,
                status = result.Status.ToString(),
                reviewedByAdminId = result.ReviewedByAdminId,
                reviewedAt = result.ReviewedAt
            }));
        }

        // POST: api/admin/reports/{id}/dismiss
        [HttpPost("{id}/dismiss")]
        public async Task<IActionResult> DismissReport(string id, [FromBody] DismissReportRequest request)
        {
            if (!MongoDB.Bson.ObjectId.TryParse(id, out _))
                return NotFound(ApiResponse.Error("Report not found.", HttpContext.TraceIdentifier));

            var adminId = CurrentAdminId;
            var now = DateTime.UtcNow;

            var filter = Builders<ContentReport>.Filter.And(
                Builders<ContentReport>.Filter.Eq(x => x.Id, id),
                Builders<ContentReport>.Filter.In(x => x.Status, new[] { ReportStatus.Open, ReportStatus.UnderReview })
            );

            var update = Builders<ContentReport>.Update
                .Set(x => x.Status, ReportStatus.Dismissed)
                .Set(x => x.ReviewedByAdminId, adminId)
                .Set(x => x.ReviewedAt, now)
                .Set(x => x.Resolution, "Dismissed")
                .Set(x => x.AdminNotes, request.Notes?.Trim())
                .Set(x => x.UpdatedAt, now);

            var result = await _context.ContentReports.FindOneAndUpdateAsync(filter, update, new FindOneAndUpdateOptions<ContentReport>
            {
                ReturnDocument = ReturnDocument.After
            });

            if (result == null)
            {
                return Conflict(ApiResponse.Error("Report has already been resolved or dismissed.", HttpContext.TraceIdentifier));
            }

            _audit?.Record("admin_report_dismissed", CurrentAdminEmail, true, new
            {
                reportId = result.Id,
                targetType = result.TargetType.ToString(),
                targetId = result.TargetId,
                notes = request.Notes
            });

            return Ok(ApiResponse.Ok("Report dismissed successfully", new
            {
                id = result.Id,
                status = result.Status.ToString(),
                resolution = result.Resolution
            }));
        }

        // POST: api/admin/reports/{id}/resolve
        [HttpPost("{id}/resolve")]
        public async Task<IActionResult> ResolveReport(string id, [FromBody] ResolveReportRequest request)
        {
            if (!MongoDB.Bson.ObjectId.TryParse(id, out _))
                return NotFound(ApiResponse.Error("Report not found.", HttpContext.TraceIdentifier));

            var adminId = CurrentAdminId;
            var now = DateTime.UtcNow;
            var action = request.ResolutionAction?.ToLowerInvariant().Trim() ?? "none";

            var report = await _context.ContentReports.Find(x => x.Id == id).FirstOrDefaultAsync();
            if (report == null)
                return NotFound(ApiResponse.Error("Report not found.", HttpContext.TraceIdentifier));

            if (report.Status == ReportStatus.Resolved || report.Status == ReportStatus.Dismissed)
                return Conflict(ApiResponse.Error($"Report is already {report.Status}.", HttpContext.TraceIdentifier));

            string resolutionSummary = "Resolved: No Action Taken";

            // If action is "hide", execute Phase 4 moderation at the service/database layer
            if (action == "hide")
            {
                resolutionSummary = "Resolved: Content Hidden via Moderation";
                var modReason = $"Moderated via report #{report.Id} ({report.Category}): {request.Notes ?? report.Description}";

                switch (report.TargetType)
                {
                    case ReportTargetType.ServiceListing:
                        var serviceUpdate = Builders<ServiceListing>.Update
                            .Set(x => x.IsModerationHidden, true)
                            .Set(x => x.ModerationReason, modReason)
                            .Set(x => x.ModeratedByAdminId, adminId)
                            .Set(x => x.ModeratedAt, now);
                        await _context.ServiceListings.UpdateOneAsync(x => x.Id == report.TargetId, serviceUpdate);
                        _audit?.Record("admin_service_hidden", CurrentAdminEmail, true, new { serviceId = report.TargetId, reason = modReason });
                        break;

                    case ReportTargetType.CreatorOffer:
                        var offerUpdate = Builders<CreatorIdea>.Update
                            .Set("Phase5Data.PathA.MarketplaceListing.IsModerationHidden", true)
                            .Set("Phase5Data.PathA.MarketplaceListing.ModerationReason", modReason)
                            .Set("Phase5Data.PathA.MarketplaceListing.ModeratedByAdminId", adminId)
                            .Set("Phase5Data.PathA.MarketplaceListing.ModeratedAt", now);
                        await _context.CreatorIdeas.UpdateOneAsync(x => x.Id == report.TargetId, offerUpdate);
                        _audit?.Record("admin_creator_offer_hidden", CurrentAdminEmail, true, new { ideaId = report.TargetId, reason = modReason });
                        break;

                    case ReportTargetType.Review:
                        var reviewUpdate = Builders<Review>.Update
                            .Set(x => x.IsModerationHidden, true)
                            .Set(x => x.ModerationReason, modReason)
                            .Set(x => x.ModeratedByAdminId, adminId)
                            .Set(x => x.ModeratedAt, now);
                        await _context.Reviews.UpdateOneAsync(x => x.Id == report.TargetId, reviewUpdate);
                        _audit?.Record("admin_review_hidden", CurrentAdminEmail, true, new { reviewId = report.TargetId, reason = modReason });
                        break;
                }
            }

            var filter = Builders<ContentReport>.Filter.And(
                Builders<ContentReport>.Filter.Eq(x => x.Id, id),
                Builders<ContentReport>.Filter.In(x => x.Status, new[] { ReportStatus.Open, ReportStatus.UnderReview })
            );

            var update = Builders<ContentReport>.Update
                .Set(x => x.Status, ReportStatus.Resolved)
                .Set(x => x.ReviewedByAdminId, adminId)
                .Set(x => x.ReviewedAt, now)
                .Set(x => x.Resolution, resolutionSummary)
                .Set(x => x.AdminNotes, request.Notes?.Trim())
                .Set(x => x.UpdatedAt, now);

            var result = await _context.ContentReports.FindOneAndUpdateAsync(filter, update, new FindOneAndUpdateOptions<ContentReport>
            {
                ReturnDocument = ReturnDocument.After
            });

            if (result == null)
            {
                return Conflict(ApiResponse.Error("Report resolution race condition: report was already resolved.", HttpContext.TraceIdentifier));
            }

            _audit?.Record(action == "hide" ? "admin_report_resolved_with_moderation" : "admin_report_resolved", CurrentAdminEmail, true, new
            {
                reportId = result.Id,
                targetType = result.TargetType.ToString(),
                targetId = result.TargetId,
                resolution = resolutionSummary,
                action
            });

            return Ok(ApiResponse.Ok("Report resolved successfully", new
            {
                id = result.Id,
                status = result.Status.ToString(),
                resolution = result.Resolution,
                reviewedAt = result.ReviewedAt
            }));
        }
    }
}
