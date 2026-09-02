using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
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
    [Route("api/admin/privacy")]
    [Authorize(Roles = "SuperAdmin")]
    public class AdminPrivacyController : ControllerBase
    {
        private readonly MongoDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IAuditLogger? _audit;

        public AdminPrivacyController(
            MongoDbContext context,
            UserManager<ApplicationUser> userManager,
            IAuditLogger? audit = null)
        {
            _context = context;
            _userManager = userManager;
            _audit = audit;
        }

        // GET /api/admin/privacy/requests
        [HttpGet("requests")]
        public async Task<IActionResult> GetPrivacyRequests(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? status = null,
            [FromQuery] string? requestType = null,
            [FromQuery] string? search = null)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var builder = Builders<PrivacyRequest>.Filter;
            var filter = builder.Empty;

            if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<PrivacyRequestStatus>(status.Trim(), true, out var parsedStatus))
            {
                filter &= builder.Eq(x => x.Status, parsedStatus);
            }

            if (!string.IsNullOrWhiteSpace(requestType) && Enum.TryParse<PrivacyRequestType>(requestType.Trim(), true, out var parsedType))
            {
                filter &= builder.Eq(x => x.RequestType, parsedType);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var escaped = Regex.Escape(search.Trim());
                var regex = new BsonRegularExpression(escaped, "i");
                filter &= (builder.Regex(x => x.UserEmail, regex) |
                           builder.Regex(x => x.UserDisplayName, regex) |
                           builder.Regex(x => x.UserId, regex) |
                           builder.Regex(x => x.Details, regex));
            }

            var totalCount = await _context.PrivacyRequests.CountDocumentsAsync(filter);
            var items = await _context.PrivacyRequests
                .Find(filter)
                .SortByDescending(x => x.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Limit(pageSize)
                .ToListAsync();

            var dtos = items.Select(MapToDto).ToList();
            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            return Ok(ApiResponse.Ok("Privacy requests queue retrieved", new PagedResult<PrivacyRequestDto>
            {
                Items = dtos,
                TotalCount = (int)totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = totalPages
            }));
        }

        // GET /api/admin/privacy/requests/{id}
        [HttpGet("requests/{id}")]
        public async Task<IActionResult> GetPrivacyRequestById(string id)
        {
            var req = await _context.PrivacyRequests
                .Find(r => r.Id == id)
                .FirstOrDefaultAsync();

            if (req == null)
            {
                return NotFound(ApiResponse.Error("Privacy request not found."));
            }

            // Refresh dependency check if Deletion request
            if (req.RequestType == PrivacyRequestType.AccountDeletion)
            {
                req.DependencyCheck = await ScanUserDependenciesAsync(req.UserId);
                await _context.PrivacyRequests.ReplaceOneAsync(r => r.Id == id, req);
            }

            return Ok(ApiResponse.Ok("Privacy request retrieved", MapToDto(req)));
        }

        // POST /api/admin/privacy/requests/{id}/under-review
        [HttpPost("requests/{id}/under-review")]
        public async Task<IActionResult> MarkUnderReview(string id, [FromBody] UpdatePrivacyStatusDto dto)
        {
            var req = await _context.PrivacyRequests
                .Find(r => r.Id == id)
                .FirstOrDefaultAsync();

            if (req == null)
            {
                return NotFound(ApiResponse.Error("Privacy request not found."));
            }

            // Optimistic concurrency check: 409 Conflict if version mismatch
            if (dto.Version > 0 && req.Version != dto.Version)
            {
                return Conflict(ApiResponse.Error("This privacy request was updated by another administrator. Please refresh."));
            }

            if (req.Status != PrivacyRequestStatus.Open)
            {
                return BadRequest(ApiResponse.Error($"Cannot move request from {req.Status} to UnderReview."));
            }

            var adminEmail = User.Identity?.Name ?? "admin";
            req.Status = PrivacyRequestStatus.UnderReview;
            req.ReviewedBy = adminEmail;
            req.AdminNotes = !string.IsNullOrWhiteSpace(dto.AdminNotes) ? dto.AdminNotes : req.AdminNotes;
            req.UpdatedAt = DateTime.UtcNow;
            req.Version++;

            await _context.PrivacyRequests.ReplaceOneAsync(r => r.Id == id, req);

            _audit?.Record("admin_privacy_under_review", adminEmail, true, new
            {
                requestId = req.Id,
                requestType = req.RequestType.ToString(),
                targetUserId = req.UserId
            });

            return Ok(ApiResponse.Ok("Privacy request marked under review", MapToDto(req)));
        }

        // POST /api/admin/privacy/requests/{id}/complete
        [HttpPost("requests/{id}/complete")]
        public async Task<IActionResult> CompletePrivacyRequest(string id, [FromBody] UpdatePrivacyStatusDto dto)
        {
            var req = await _context.PrivacyRequests
                .Find(r => r.Id == id)
                .FirstOrDefaultAsync();

            if (req == null)
            {
                return NotFound(ApiResponse.Error("Privacy request not found."));
            }

            // Concurrency check
            if (dto.Version > 0 && req.Version != dto.Version)
            {
                return Conflict(ApiResponse.Error("This privacy request was updated by another administrator. Please refresh."));
            }

            if (req.Status == PrivacyRequestStatus.Completed || req.Status == PrivacyRequestStatus.Rejected)
            {
                return BadRequest(ApiResponse.Error($"Privacy request is already {req.Status}."));
            }

            var adminEmail = User.Identity?.Name ?? "admin";

            // If request is DataExport: generate sanitized export payload
            if (req.RequestType == PrivacyRequestType.DataExport)
            {
                var exportData = await GenerateUserExportArchiveAsync(req.UserId);
                req.ExportDataJson = JsonSerializer.Serialize(exportData, new JsonSerializerOptions { WriteIndented = true });
                req.ExportDownloadToken = Guid.NewGuid().ToString("N");
                req.ExportExpiresAt = DateTime.UtcNow.AddDays(7); // 7-day retention/expiry
            }
            // If request is AccountDeletion: verify dependencies
            else if (req.RequestType == PrivacyRequestType.AccountDeletion)
            {
                var depCheck = await ScanUserDependenciesAsync(req.UserId);
                req.DependencyCheck = depCheck;
                if (!depCheck.CanSafelyDeleteOrAnonymize)
                {
                    return BadRequest(ApiResponse.Error($"Cannot complete deletion: {depCheck.Summary}"));
                }

                // Apply anonymization to ApplicationUser record
                var targetUser = await _userManager.FindByIdAsync(req.UserId);
                if (targetUser != null)
                {
                    targetUser.LockoutEnd = DateTimeOffset.MaxValue;
                    targetUser.Bio = "[ANONYMIZED_UPON_USER_REQUEST]";
                    targetUser.Phone = "[REDACTED]";
                    targetUser.Address = new Address { City = "[REDACTED]", Country = "[REDACTED]" };
                    targetUser.ImagePath = null!;
                    await _userManager.UpdateAsync(targetUser);
                }
            }

            req.Status = PrivacyRequestStatus.Completed;
            req.ReviewedBy = adminEmail;
            req.AdminNotes = !string.IsNullOrWhiteSpace(dto.AdminNotes) ? dto.AdminNotes : req.AdminNotes;
            req.CompletedAt = DateTime.UtcNow;
            req.UpdatedAt = DateTime.UtcNow;
            req.Version++;

            await _context.PrivacyRequests.ReplaceOneAsync(r => r.Id == id, req);

            _audit?.Record("admin_privacy_completed", adminEmail, true, new
            {
                requestId = req.Id,
                requestType = req.RequestType.ToString(),
                targetUserId = req.UserId
            });

            return Ok(ApiResponse.Ok("Privacy request marked completed successfully", MapToDto(req)));
        }

        // POST /api/admin/privacy/requests/{id}/reject
        [HttpPost("requests/{id}/reject")]
        public async Task<IActionResult> RejectPrivacyRequest(string id, [FromBody] UpdatePrivacyStatusDto dto)
        {
            var req = await _context.PrivacyRequests
                .Find(r => r.Id == id)
                .FirstOrDefaultAsync();

            if (req == null)
            {
                return NotFound(ApiResponse.Error("Privacy request not found."));
            }

            if (dto.Version > 0 && req.Version != dto.Version)
            {
                return Conflict(ApiResponse.Error("This privacy request was updated by another administrator. Please refresh."));
            }

            if (req.Status == PrivacyRequestStatus.Completed || req.Status == PrivacyRequestStatus.Rejected)
            {
                return BadRequest(ApiResponse.Error($"Privacy request is already {req.Status}."));
            }

            var adminEmail = User.Identity?.Name ?? "admin";
            req.Status = PrivacyRequestStatus.Rejected;
            req.RejectionReason = dto.Reason ?? "Unable to fulfill privacy request at this time.";
            req.AdminNotes = !string.IsNullOrWhiteSpace(dto.AdminNotes) ? dto.AdminNotes : req.AdminNotes;
            req.ReviewedBy = adminEmail;
            req.UpdatedAt = DateTime.UtcNow;
            req.Version++;

            await _context.PrivacyRequests.ReplaceOneAsync(r => r.Id == id, req);

            _audit?.Record("admin_privacy_rejected", adminEmail, true, new
            {
                requestId = req.Id,
                requestType = req.RequestType.ToString(),
                targetUserId = req.UserId,
                reason = req.RejectionReason
            });

            return Ok(ApiResponse.Ok("Privacy request rejected", MapToDto(req)));
        }

        private async Task<Dictionary<string, object?>> GenerateUserExportArchiveAsync(string userId)
        {
            var export = new Dictionary<string, object?>();

            var user = await _userManager.FindByIdAsync(userId);
            if (user != null)
            {
                export["profile"] = new
                {
                    userId = user.Id.ToString(),
                    name = user.Name,
                    email = user.Email,
                    createdAt = user.CreatedAt,
                    lastLogin = user.LastLogin,
                    tier = user.Tier_level,
                    trustScore = user.Trust_score,
                    kycStatus = user.Kyc?.Status.ToString() ?? user.KycStatus
                };
            }

            // User engagements
            var engagements = await _context.WorkroomEngagements
                .Find(e => e.ClientId == userId || e.ProviderId == userId)
                .ToListAsync();
            export["engagements"] = engagements.Select(e => new
            {
                id = e.Id,
                title = e.Title,
                status = e.EngagementStatus.ToString(),
                createdAt = e.CreatedAt
            }).ToList();

            // Transactions
            var txns = await _context.FinancialTransactions
                .Find(t => t.ClientId == userId || t.ProviderId == userId)
                .ToListAsync();
            export["transactions"] = txns.Select(t => new
            {
                id = t.Id,
                grossAmount = t.GrossAmount,
                status = t.PaymentStatus.ToString(),
                createdAt = t.CreatedAt
            }).ToList();

            // Reviews
            var reviews = await _context.Reviews
                .Find(r => r.ClientId == userId || r.ProviderId == userId)
                .ToListAsync();
            export["reviews"] = reviews.Select(r => new
            {
                id = r.Id,
                overallRating = r.OverallRating,
                writtenReview = r.WrittenReview,
                submittedAt = r.SubmittedAt
            }).ToList();

            export["generatedAt"] = DateTime.UtcNow;
            export["notice"] = "This archive contains user-owned account data provided in compliance with data privacy regulations. Private credentials and internal fraud heuristics are excluded.";

            return export;
        }

        private async Task<DeletionDependencyCheck> ScanUserDependenciesAsync(string userId)
        {
            var check = new DeletionDependencyCheck();

            try
            {
                var activeEngagements = await _context.WorkroomEngagements
                    .CountDocumentsAsync(e => (e.ClientId == userId || e.ProviderId == userId) &&
                                              e.EngagementStatus != EngagementStatus.Completed &&
                                              e.EngagementStatus != EngagementStatus.Cancelled);
                check.ActiveEngagementsCount = (int)activeEngagements;
                check.HasActiveEngagements = activeEngagements > 0;

                var openDisputes = await _context.WorkroomEngagements
                    .CountDocumentsAsync(e => (e.ClientId == userId || e.ProviderId == userId) &&
                                              e.EngagementStatus == EngagementStatus.Disputed);
                check.OpenDisputesCount = (int)openDisputes;
                check.HasOpenDisputes = openDisputes > 0;

                var pendingPayouts = await _context.PayoutRequests
                    .CountDocumentsAsync(p => p.ProviderId == userId &&
                                              p.Status == PayoutStatus.Requested);
                check.PendingPayoutsCount = (int)pendingPayouts;
                check.HasPendingPayouts = pendingPayouts > 0;

                var transactions = await _context.FinancialTransactions
                    .CountDocumentsAsync(t => t.ClientId == userId || t.ProviderId == userId);
                check.CompletedTransactionsCount = (int)transactions;
                check.HasFinancialLedgerHistory = transactions > 0;

                var user = await _userManager.FindByIdAsync(userId);
                if (user != null)
                {
                    check.HasKycRecords = user.Kyc != null;
                    check.KycStatus = user.Kyc?.Status.ToString() ?? user.KycStatus ?? "None";
                }

                var blockers = new List<string>();
                if (check.HasActiveEngagements) blockers.Add($"{check.ActiveEngagementsCount} active engagement(s)");
                if (check.HasOpenDisputes) blockers.Add($"{check.OpenDisputesCount} open dispute(s)");
                if (check.HasPendingPayouts) blockers.Add($"{check.PendingPayoutsCount} pending payout(s)");

                if (blockers.Any())
                {
                    check.Summary = $"Deletion blocked by: {string.Join(", ", blockers)}.";
                }
                else
                {
                    check.Summary = "Account clear for anonymization/deletion review.";
                }
            }
            catch (Exception ex)
            {
                check.Summary = $"Dependency scan warning: {ex.Message}";
            }

            return check;
        }

        private static PrivacyRequestDto MapToDto(PrivacyRequest r)
        {
            return new PrivacyRequestDto
            {
                Id = r.Id,
                UserId = r.UserId,
                UserEmail = r.UserEmail,
                UserDisplayName = r.UserDisplayName,
                RequestType = r.RequestType.ToString(),
                Status = r.Status.ToString(),
                Details = r.Details,
                AdminNotes = r.AdminNotes,
                RejectionReason = r.RejectionReason,
                AssignedAdminId = r.AssignedAdminId,
                ReviewedBy = r.ReviewedBy,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt,
                CompletedAt = r.CompletedAt,
                ExportDownloadUrl = !string.IsNullOrEmpty(r.ExportDownloadToken) ? $"/api/privacy/export/{r.Id}/download" : null,
                ExportExpiresAt = r.ExportExpiresAt,
                DependencyCheck = r.DependencyCheck,
                Version = r.Version
            };
        }
    }
}
