using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
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
    [Route("api/privacy")]
    public class PrivacyController : ControllerBase
    {
        private readonly MongoDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IAuditLogger? _audit;

        public PrivacyController(
            MongoDbContext context,
            UserManager<ApplicationUser> userManager,
            IAuditLogger? audit = null)
        {
            _context = context;
            _userManager = userManager;
            _audit = audit;
        }

        private string? GetCurrentUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value
                ?? User.FindFirst("id")?.Value;
        }

        // POST /api/privacy/requests (Authenticated user)
        [HttpPost("requests")]
        [Authorize]
        public async Task<IActionResult> SubmitPrivacyRequest([FromBody] CreatePrivacyRequestDto dto)
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse.Error("Unauthorized"));
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound(ApiResponse.Error("User not found"));
            }

            if (!Enum.TryParse<PrivacyRequestType>(dto.RequestType, true, out var requestType))
            {
                return BadRequest(ApiResponse.Error("Invalid privacy request type. Allowed: DataAccess, DataExport, Correction, AccountDeletion, OtherPrivacyRequest"));
            }

            // Concurrency / Duplicate active request check: 409 Conflict if active request exists
            var existingActive = await _context.PrivacyRequests
                .Find(r => r.UserId == userId &&
                           r.RequestType == requestType &&
                           (r.Status == PrivacyRequestStatus.Open || r.Status == PrivacyRequestStatus.UnderReview))
                .FirstOrDefaultAsync();

            if (existingActive != null)
            {
                return Conflict(ApiResponse.Error($"An active {requestType} request already exists for this account."));
            }

            // Perform automatic dependency check if Deletion request
            DeletionDependencyCheck? dependencyCheck = null;
            if (requestType == PrivacyRequestType.AccountDeletion)
            {
                dependencyCheck = await ScanUserDependenciesAsync(userId);
            }

            var request = new PrivacyRequest
            {
                UserId = userId,
                UserEmail = user.Email ?? string.Empty,
                UserDisplayName = user.Name ?? user.UserName ?? string.Empty,
                RequestType = requestType,
                Status = PrivacyRequestStatus.Open,
                Details = dto.Details ?? string.Empty,
                DependencyCheck = dependencyCheck,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.PrivacyRequests.InsertOneAsync(request);

            _audit?.Record("privacy_request_created", user.Email ?? userId, true, new
            {
                requestId = request.Id,
                requestType = requestType.ToString(),
                userId = userId
            });

            return Ok(ApiResponse.Ok("Privacy request submitted successfully", MapToDto(request)));
        }

        // GET /api/privacy/my-requests (Authenticated user)
        [HttpGet("my-requests")]
        [Authorize]
        public async Task<IActionResult> GetMyPrivacyRequests()
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse.Error("Unauthorized"));
            }

            var requests = await _context.PrivacyRequests
                .Find(r => r.UserId == userId)
                .SortByDescending(r => r.CreatedAt)
                .ToListAsync();

            var dtos = requests.Select(MapToDto).ToList();
            return Ok(ApiResponse.Ok("Privacy requests retrieved", dtos));
        }

        // GET /api/privacy/export/{requestId}/download (Protected delivery: owner or Admin)
        [HttpGet("export/{requestId}/download")]
        [Authorize]
        public async Task<IActionResult> DownloadDataExport(string requestId)
        {
            var userId = GetCurrentUserId();
            var isAdmin = User.IsInRole("Admin") || User.IsInRole("SuperAdmin");

            var request = await _context.PrivacyRequests
                .Find(r => r.Id == requestId)
                .FirstOrDefaultAsync();

            if (request == null || request.RequestType != PrivacyRequestType.DataExport)
            {
                return NotFound(ApiResponse.Error("Export request not found."));
            }

            // Only request owner or Admin can access
            if (!isAdmin && request.UserId != userId)
            {
                return Forbid();
            }

            // Expiration check: 410 Gone if expired
            if (request.ExportExpiresAt.HasValue && request.ExportExpiresAt.Value < DateTime.UtcNow)
            {
                return StatusCode(410, ApiResponse.Error("Data export archive has expired. Please submit a new export request."));
            }

            if (request.Status != PrivacyRequestStatus.Completed || string.IsNullOrEmpty(request.ExportDataJson))
            {
                return BadRequest(ApiResponse.Error("Export archive is not yet ready or completed."));
            }

            _audit?.Record("data_export_downloaded", User.Identity?.Name ?? userId ?? "unknown", true, new
            {
                requestId = request.Id,
                targetUserId = request.UserId
            });

            var bytes = System.Text.Encoding.UTF8.GetBytes(request.ExportDataJson);
            return File(bytes, "application/json", $"mondial_export_{request.UserId}_{DateTime.UtcNow:yyyyMMdd}.json");
        }

        private async Task<DeletionDependencyCheck> ScanUserDependenciesAsync(string userId)
        {
            var check = new DeletionDependencyCheck();

            try
            {
                // Active engagements
                var activeEngagements = await _context.WorkroomEngagements
                    .CountDocumentsAsync(e => (e.ClientId == userId || e.ProviderId == userId) &&
                                              e.EngagementStatus != EngagementStatus.Completed &&
                                              e.EngagementStatus != EngagementStatus.Cancelled);
                check.ActiveEngagementsCount = (int)activeEngagements;
                check.HasActiveEngagements = activeEngagements > 0;

                // Open disputes
                var openDisputes = await _context.WorkroomEngagements
                    .CountDocumentsAsync(e => (e.ClientId == userId || e.ProviderId == userId) &&
                                              e.EngagementStatus == EngagementStatus.Disputed);
                check.OpenDisputesCount = (int)openDisputes;
                check.HasOpenDisputes = openDisputes > 0;

                // Pending payouts
                var pendingPayouts = await _context.PayoutRequests
                    .CountDocumentsAsync(p => p.ProviderId == userId &&
                                              p.Status == PayoutStatus.Requested);
                check.PendingPayoutsCount = (int)pendingPayouts;
                check.HasPendingPayouts = pendingPayouts > 0;

                // Financial ledger history
                var transactions = await _context.FinancialTransactions
                    .CountDocumentsAsync(t => t.ClientId == userId || t.ProviderId == userId);
                check.CompletedTransactionsCount = (int)transactions;
                check.HasFinancialLedgerHistory = transactions > 0;

                // KYC status
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
