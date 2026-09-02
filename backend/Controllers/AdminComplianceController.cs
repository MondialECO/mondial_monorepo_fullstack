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
    [Route("api/admin/compliance")]
    [Authorize(Roles = "SuperAdmin")]
    public class AdminComplianceController : ControllerBase
    {
        private readonly MongoDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IAuditLogger? _audit;

        public AdminComplianceController(
            MongoDbContext context,
            UserManager<ApplicationUser> userManager,
            IAuditLogger? audit = null)
        {
            _context = context;
            _userManager = userManager;
            _audit = audit;
        }

        // GET /api/admin/compliance/cases
        [HttpGet("cases")]
        public async Task<IActionResult> GetComplianceCases(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? status = null,
            [FromQuery] string? priority = null,
            [FromQuery] string? caseType = null,
            [FromQuery] string? search = null)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var builder = Builders<ComplianceCase>.Filter;
            var filter = builder.Empty;

            if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<ComplianceCaseStatus>(status.Trim(), true, out var parsedStatus))
            {
                filter &= builder.Eq(x => x.Status, parsedStatus);
            }

            if (!string.IsNullOrWhiteSpace(priority) && Enum.TryParse<ComplianceCasePriority>(priority.Trim(), true, out var parsedPriority))
            {
                filter &= builder.Eq(x => x.Priority, parsedPriority);
            }

            if (!string.IsNullOrWhiteSpace(caseType))
            {
                var escaped = Regex.Escape(caseType.Trim());
                filter &= builder.Regex(x => x.CaseType, new BsonRegularExpression(escaped, "i"));
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var escaped = Regex.Escape(search.Trim());
                var regex = new BsonRegularExpression(escaped, "i");
                filter &= (builder.Regex(x => x.TargetUserEmail, regex) |
                           builder.Regex(x => x.TargetUserDisplayName, regex) |
                           builder.Regex(x => x.Summary, regex) |
                           builder.Regex(x => x.TargetUserId, regex));
            }

            var totalCount = await _context.ComplianceCases.CountDocumentsAsync(filter);
            var cases = await _context.ComplianceCases
                .Find(filter)
                .SortByDescending(x => x.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Limit(pageSize)
                .ToListAsync();

            var dtos = cases.Select(MapToDto).ToList();
            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            return Ok(ApiResponse.Ok("Compliance cases retrieved", new PagedResult<ComplianceCaseDto>
            {
                Items = dtos,
                TotalCount = (int)totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = totalPages
            }));
        }

        // GET /api/admin/compliance/cases/{id}
        [HttpGet("cases/{id}")]
        public async Task<IActionResult> GetComplianceCaseById(string id)
        {
            var c = await _context.ComplianceCases
                .Find(x => x.Id == id)
                .FirstOrDefaultAsync();

            if (c == null)
            {
                return NotFound(ApiResponse.Error("Compliance case not found."));
            }

            return Ok(ApiResponse.Ok("Compliance case retrieved", MapToDto(c)));
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

        // POST /api/admin/compliance/cases
        [HttpPost("cases")]
        public async Task<IActionResult> CreateComplianceCase([FromBody] CreateComplianceCaseDto dto)
        {
            var targetUser = await FindUserByIdOrEmailAsync(dto.TargetUserId);
            if (targetUser == null)
            {
                return NotFound(ApiResponse.Error("Target user not found."));
            }

            var targetRoles = await _userManager.GetRolesAsync(targetUser);
            if (targetRoles.Contains("SuperAdmin", StringComparer.OrdinalIgnoreCase) && !User.IsInRole("SuperAdmin"))
            {
                return StatusCode(403, ApiResponse.Error("Unauthorized: Normal Admin cannot open compliance cases targeting SuperAdmin accounts."));
            }

            Enum.TryParse<ComplianceCasePriority>(dto.Priority, true, out var priority);

            var adminEmail = User.Identity?.Name ?? "admin";
            var signals = new List<string>();
            if (targetUser.LockoutEnd.HasValue && targetUser.LockoutEnd.Value > DateTimeOffset.UtcNow)
                signals.Add("Target account is currently locked / suspended.");

            var newCase = new ComplianceCase
            {
                CaseType = dto.CaseType ?? "AccountReview",
                TargetUserId = dto.TargetUserId,
                TargetUserEmail = targetUser.Email ?? string.Empty,
                TargetUserDisplayName = targetUser.Name ?? targetUser.UserName ?? string.Empty,
                SourceType = dto.SourceType ?? "ManualReview",
                SourceId = dto.SourceId,
                Status = ComplianceCaseStatus.Open,
                Priority = priority,
                AssignedAdminEmail = adminEmail,
                Summary = dto.Summary,
                FactualSignals = signals,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Timeline = new List<ComplianceCaseTimelineEvent>
                {
                    new ComplianceCaseTimelineEvent
                    {
                        EventType = "CaseCreated",
                        Description = $"Compliance case opened: {dto.Summary}",
                        Actor = adminEmail,
                        Timestamp = DateTime.UtcNow
                    }
                }
            };

            await _context.ComplianceCases.InsertOneAsync(newCase);

            _audit?.Record("admin_compliance_case_created", adminEmail, true, new
            {
                caseId = newCase.Id,
                caseType = newCase.CaseType,
                targetUserId = newCase.TargetUserId,
                priority = newCase.Priority.ToString()
            });

            return Ok(ApiResponse.Ok("Compliance case created successfully", MapToDto(newCase)));
        }

        // POST /api/admin/compliance/cases/{id}/notes
        [HttpPost("cases/{id}/notes")]
        public async Task<IActionResult> AddComplianceNote(string id, [FromBody] AddComplianceCaseNoteDto dto)
        {
            var c = await _context.ComplianceCases
                .Find(x => x.Id == id)
                .FirstOrDefaultAsync();

            if (c == null)
            {
                return NotFound(ApiResponse.Error("Compliance case not found."));
            }

            var adminEmail = User.Identity?.Name ?? "admin";
            var adminId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "admin";

            var note = new ComplianceCaseNote
            {
                AuthorId = adminId,
                AuthorEmail = adminEmail,
                Content = dto.Content,
                CreatedAt = DateTime.UtcNow
            };

            c.Notes.Add(note);
            c.Timeline.Add(new ComplianceCaseTimelineEvent
            {
                EventType = "NoteAdded",
                Description = "Internal admin note added to case.",
                Actor = adminEmail,
                Timestamp = DateTime.UtcNow
            });
            c.UpdatedAt = DateTime.UtcNow;

            await _context.ComplianceCases.ReplaceOneAsync(x => x.Id == id, c);

            return Ok(ApiResponse.Ok("Note added to compliance case", MapToDto(c)));
        }

        // POST /api/admin/compliance/cases/{id}/status
        [HttpPost("cases/{id}/status")]
        public async Task<IActionResult> UpdateCaseStatus(string id, [FromBody] UpdateComplianceCaseStatusDto dto)
        {
            var c = await _context.ComplianceCases
                .Find(x => x.Id == id)
                .FirstOrDefaultAsync();

            if (c == null)
            {
                return NotFound(ApiResponse.Error("Compliance case not found."));
            }

            // Optimistic concurrency check: 409 Conflict
            if (dto.Version > 0 && c.Version != dto.Version)
            {
                return Conflict(ApiResponse.Error("This compliance case was modified by another administrator. Please refresh."));
            }

            if (!Enum.TryParse<ComplianceCaseStatus>(dto.Status, true, out var newStatus))
            {
                return BadRequest(ApiResponse.Error("Invalid compliance status. Allowed: Open, UnderReview, ActionTaken, Resolved, Dismissed"));
            }

            var adminEmail = User.Identity?.Name ?? "admin";
            c.Status = newStatus;
            c.Resolution = dto.Resolution ?? c.Resolution;
            c.AssignedAdminEmail = dto.AssignedAdminEmail ?? c.AssignedAdminEmail;
            c.UpdatedAt = DateTime.UtcNow;
            c.Version++;

            if (newStatus == ComplianceCaseStatus.Resolved || newStatus == ComplianceCaseStatus.Dismissed)
            {
                c.ResolvedAt = DateTime.UtcNow;
                c.ResolvedBy = adminEmail;
            }

            c.Timeline.Add(new ComplianceCaseTimelineEvent
            {
                EventType = $"StatusChanged:{newStatus}",
                Description = $"Case status updated to {newStatus}. Resolution: {dto.Resolution ?? "N/A"}",
                Actor = adminEmail,
                Timestamp = DateTime.UtcNow
            });

            await _context.ComplianceCases.ReplaceOneAsync(x => x.Id == id, c);

            _audit?.Record("admin_compliance_case_resolved", adminEmail, true, new
            {
                caseId = c.Id,
                status = newStatus.ToString(),
                targetUserId = c.TargetUserId,
                resolution = c.Resolution
            });

            return Ok(ApiResponse.Ok("Compliance case status updated", MapToDto(c)));
        }

        private static ComplianceCaseDto MapToDto(ComplianceCase c)
        {
            return new ComplianceCaseDto
            {
                Id = c.Id,
                CaseType = c.CaseType,
                TargetUserId = c.TargetUserId,
                TargetUserEmail = c.TargetUserEmail,
                TargetUserDisplayName = c.TargetUserDisplayName,
                SourceType = c.SourceType,
                SourceId = c.SourceId,
                Status = c.Status.ToString(),
                Priority = c.Priority.ToString(),
                AssignedAdminId = c.AssignedAdminId,
                AssignedAdminEmail = c.AssignedAdminEmail,
                Summary = c.Summary,
                Resolution = c.Resolution,
                ResolvedBy = c.ResolvedBy,
                Notes = c.Notes,
                Timeline = c.Timeline,
                FactualSignals = c.FactualSignals,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt,
                ResolvedAt = c.ResolvedAt,
                Version = c.Version
            };
        }
    }
}
