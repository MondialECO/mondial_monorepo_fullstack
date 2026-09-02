using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Audit;

namespace WebApp.Controllers
{
    [ApiController]
    [Route("api/reports")]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly MongoDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IAuditLogger? _audit;
        private readonly WebApp.Services.Interface.IPlatformSettingsService? _settingsService;

        public ReportsController(
            MongoDbContext context,
            UserManager<ApplicationUser> userManager,
            IAuditLogger? audit = null,
            WebApp.Services.Interface.IPlatformSettingsService? settingsService = null)
        {
            _context = context;
            _userManager = userManager;
            _audit = audit;
            _settingsService = settingsService;
        }

        private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

        // POST: api/reports
        [HttpPost]
        public async Task<IActionResult> CreateReport([FromBody] CreateReportRequest request)
        {
            if (_settingsService != null && !await _settingsService.IsReportsEnabledAsync())
                return StatusCode(503, ApiResponse.Error("Report submission is temporarily disabled for system maintenance.", HttpContext.TraceIdentifier));

            if (!ModelState.IsValid)
                return BadRequest(ApiResponse.Error("Invalid report payload.", HttpContext.TraceIdentifier));

            var userId = CurrentUserId;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(ApiResponse.Error("Authentication required.", HttpContext.TraceIdentifier));

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return Unauthorized(ApiResponse.Error("User record not found.", HttpContext.TraceIdentifier));

            // Validate TargetType
            if (!Enum.TryParse<ReportTargetType>(request.TargetType, true, out var targetType))
                return BadRequest(ApiResponse.Error($"Invalid target type '{request.TargetType}'. Allowed: ServiceListing, CreatorOffer, Review, UserProfile.", HttpContext.TraceIdentifier));

            // Validate Category
            if (!Enum.TryParse<ReportCategory>(request.Category, true, out var category))
                return BadRequest(ApiResponse.Error($"Invalid report category '{request.Category}'.", HttpContext.TraceIdentifier));

            var targetId = request.TargetId?.Trim() ?? "";
            if (string.IsNullOrEmpty(targetId))
                return BadRequest(ApiResponse.Error("TargetId is required.", HttpContext.TraceIdentifier));

            // Validate Target actually exists in DB
            bool targetExists = false;
            switch (targetType)
            {
                case ReportTargetType.ServiceListing:
                    if (MongoDB.Bson.ObjectId.TryParse(targetId, out _))
                        targetExists = await _context.ServiceListings.Find(x => x.Id == targetId).FirstOrDefaultAsync() != null;
                    break;
                case ReportTargetType.CreatorOffer:
                    if (MongoDB.Bson.ObjectId.TryParse(targetId, out _))
                        targetExists = await _context.CreatorIdeas.Find(x => x.Id == targetId).FirstOrDefaultAsync() != null;
                    break;
                case ReportTargetType.Review:
                    if (MongoDB.Bson.ObjectId.TryParse(targetId, out _))
                        targetExists = await _context.Reviews.Find(x => x.Id == targetId).FirstOrDefaultAsync() != null;
                    break;
                case ReportTargetType.UserProfile:
                    var targetUser = await _userManager.FindByIdAsync(targetId);
                    targetExists = targetUser != null;
                    break;
            }

            if (!targetExists)
                return NotFound(ApiResponse.Error($"Reported target {targetType} with ID '{targetId}' was not found.", HttpContext.TraceIdentifier));

            // Duplicate Report Protection: same reporter + same target + active (Open or UnderReview)
            var activeDuplicate = await _context.ContentReports.Find(x =>
                x.ReporterUserId == userId &&
                x.TargetType == targetType &&
                x.TargetId == targetId &&
                (x.Status == ReportStatus.Open || x.Status == ReportStatus.UnderReview)
            ).FirstOrDefaultAsync();

            if (activeDuplicate != null)
            {
                return Conflict(ApiResponse.Error("You have already submitted an active report for this item. It is currently in review.", HttpContext.TraceIdentifier));
            }

            var report = new ContentReport
            {
                ReporterUserId = userId,
                ReporterEmail = user.Email ?? "",
                ReporterName = user.Name ?? user.UserName ?? "User",
                TargetType = targetType,
                TargetId = targetId,
                Category = category,
                Description = request.Description.Trim(),
                Status = ReportStatus.Open,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.ContentReports.InsertOneAsync(report);

            _audit?.Record("report_submitted", user.Email ?? userId, true, new
            {
                reportId = report.Id,
                targetType = targetType.ToString(),
                targetId,
                category = category.ToString()
            });

            return Ok(ApiResponse.Ok("Report submitted successfully. Thank you for helping keep the platform safe.", new
            {
                id = report.Id,
                status = report.Status.ToString(),
                createdAt = report.CreatedAt
            }));
        }
    }
}
