using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services;
using WebApp.Services.Audit;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;

namespace WebApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class VarificationController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly MongoDbContext _context;
        private readonly IKycStorageService _kycStorage;
        private readonly IIdentityVerificationService? _identityService;
        private readonly IAuditLogger? _audit;

        public VarificationController(
            UserManager<ApplicationUser> userManager,
            MongoDbContext context,
            IKycStorageService? kycStorage = null,
            IIdentityVerificationService? identityService = null,
            IAuditLogger? audit = null)
        {
            _userManager = userManager;
            _context = context;
            _kycStorage = kycStorage ?? new KycStorageService();
            _identityService = identityService;
            _audit = audit;
        }

        #region Helper Methods

        private IActionResult Success(string message, object? data = null)
        {
            return Ok(new
            {
                success = true,
                message,
                data
            });
        }

        private IActionResult Fail(string message)
        {
            return BadRequest(new
            {
                success = false,
                message
            });
        }

        private IActionResult NotFoundResponse(string message)
        {
            return NotFound(new
            {
                success = false,
                message
            });
        }

        #endregion

        [Authorize(Roles = "Admin,SuperAdmin")]
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingUsers([FromQuery] PendingKycListQuery query)
        {
            var page = Math.Max(1, query?.Page ?? 1);
            var pageSize = Math.Clamp(query?.PageSize ?? 25, 1, 100);

            // Genuine pending predicate: Status == Pending (0) AND user has uploaded front document
            var filterBuilder = Builders<ApplicationUser>.Filter;
            var filter = filterBuilder.And(
                filterBuilder.Ne(x => x.Kyc, null),
                filterBuilder.Eq(x => x.Kyc.Status, VerificationStatus.Pending),
                filterBuilder.Or(
                    filterBuilder.And(
                        filterBuilder.Ne(x => x.Kyc.Identity.FrontImage, null),
                        filterBuilder.Ne(x => x.Kyc.Identity.FrontImage, "")
                    ),
                    filterBuilder.And(
                        filterBuilder.Ne(x => x.Onboarding.IdentityFrontImagePath, null),
                        filterBuilder.Ne(x => x.Onboarding.IdentityFrontImagePath, "")
                    )
                )
            );

            if (!string.IsNullOrWhiteSpace(query?.Search))
            {
                var s = query.Search.Trim();
                var searchFilter = filterBuilder.Or(
                    filterBuilder.Regex(u => u.Name, new MongoDB.Bson.BsonRegularExpression(s, "i")),
                    filterBuilder.Regex(u => u.Email, new MongoDB.Bson.BsonRegularExpression(s, "i")),
                    filterBuilder.Regex(u => u.UserName, new MongoDB.Bson.BsonRegularExpression(s, "i"))
                );

                if (Guid.TryParse(s, out var searchGuid))
                {
                    searchFilter = filterBuilder.Or(searchFilter, filterBuilder.Eq(u => u.Id, searchGuid));
                }

                filter = filterBuilder.And(filter, searchFilter);
            }

            var totalItems = await _context.ApplicationUsers.CountDocumentsAsync(filter);
            var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);

            var users = await _context.ApplicationUsers
                .Find(filter)
                .SortBy(x => x.Kyc.Identity.SubmittedAt)
                .ThenBy(x => x.Onboarding.IdentityDocumentUploadedAt)
                .ThenBy(x => x.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Limit(pageSize)
                .ToListAsync();

            var dtos = users.Select(u =>
            {
                var kyc = u.Kyc;
                var ident = kyc?.Identity;
                var addr = u.Address;

                var userRoles = u.Roles?.Select(r => r.ToString()).ToList() ?? new List<string>();
                if (userRoles.Count == 0 && !string.IsNullOrWhiteSpace(u.User))
                {
                    userRoles.Add(u.User);
                }

                var front = ident?.FrontImage ?? u.Onboarding?.IdentityFrontImagePath;
                var docType = ident?.DocumentType ?? u.Onboarding?.IdentityDocumentType;
                var submittedAt = ident?.SubmittedAt ?? u.Onboarding?.IdentityDocumentUploadedAt;
                var docUploaded = !string.IsNullOrWhiteSpace(front);

                return new PendingKycUserDto
                {
                    Id = u.Id.ToString(),
                    Name = u.Name ?? u.UserName ?? u.Email,
                    Email = u.Email,
                    UserName = u.UserName,
                    User = u.User ?? (userRoles.Count > 0 ? userRoles[0] : null),
                    Roles = userRoles,
                    PhoneNumber = u.PhoneNumber ?? u.Phone,
                    EmailConfirmed = u.EmailConfirmed,
                    PhoneNumberConfirmed = u.PhoneNumberConfirmed,
                    Address = addr != null ? new PendingKycAddressDto
                    {
                        Address = addr.address,
                        City = addr.City,
                        Country = addr.Country
                    } : null,
                    Kyc = kyc != null ? new PendingKycDetailDto
                    {
                        Status = (int)kyc.Status,
                        SubmittedAt = submittedAt,
                        DocumentType = docType,
                        DocumentUploaded = docUploaded,
                        Identity = ident != null ? new PendingKycIdentityDto
                        {
                            DocumentType = docType,
                            DocumentUploaded = docUploaded,
                            Status = (int)ident.Status,
                            RejectionReason = ident.RejectionReason
                        } : null
                    } : null
                };
            }).ToList();

            var result = new AdminPagedResult<PendingKycUserDto>
            {
                Items = dtos,
                Page = page,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = totalPages
            };

            return Success("Pending users fetched successfully", result);
        }

        [Authorize(Roles = "Admin,SuperAdmin")]
        [HttpGet("{userId}")]
        public async Task<IActionResult> GetUserKycDetail(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
            {
                return NotFoundResponse("User not found");
            }

            var kyc = user.Kyc;
            var ident = kyc?.Identity;
            var addr = user.Address;

            var userRoles = user.Roles?.Select(r => r.ToString()).ToList() ?? new List<string>();
            if (userRoles.Count == 0 && !string.IsNullOrWhiteSpace(user.User))
            {
                userRoles.Add(user.User);
            }

            var front = ident?.FrontImage ?? user.Onboarding?.IdentityFrontImagePath;
            var back = ident?.BackImage ?? user.Onboarding?.IdentityBackImagePath;
            var docType = ident?.DocumentType ?? user.Onboarding?.IdentityDocumentType;
            var docNum = ident?.DocumentNumber;
            var submittedAt = ident?.SubmittedAt ?? user.Onboarding?.IdentityDocumentUploadedAt;

            // Generate protected evidence endpoints instead of exposing physical/storage paths
            var frontProtectedUrl = !string.IsNullOrWhiteSpace(front) ? $"/api/varification/{user.Id}/evidence/front" : null;
            var backProtectedUrl = !string.IsNullOrWhiteSpace(back) ? $"/api/varification/{user.Id}/evidence/back" : null;

            var dto = new AdminKycReviewDto
            {
                Id = user.Id.ToString(),
                Name = user.Name ?? user.UserName ?? user.Email,
                Email = user.Email,
                UserName = user.UserName,
                User = user.User ?? (userRoles.Count > 0 ? userRoles[0] : null),
                Roles = userRoles,
                PhoneNumber = user.PhoneNumber ?? user.Phone,
                EmailConfirmed = user.EmailConfirmed,
                PhoneNumberConfirmed = user.PhoneNumberConfirmed,
                Address = addr != null ? new PendingKycAddressDto
                {
                    Address = addr.address,
                    City = addr.City,
                    Country = addr.Country
                } : null,
                CreatedAt = user.CreatedAt != default ? user.CreatedAt : user.CreatedOn,
                Kyc = kyc != null ? new AdminKycReviewDetailDto
                {
                    Status = (int)kyc.Status,
                    SubmittedAt = submittedAt,
                    VerifiedAt = kyc.VerifiedAt,
                    Identity = ident != null ? new AdminKycReviewIdentityDto
                    {
                        DocumentType = docType,
                        DocumentNumber = docNum,
                        FrontImagePath = frontProtectedUrl,
                        BackImagePath = backProtectedUrl,
                        Status = (int)ident.Status,
                        RejectionReason = ident.RejectionReason,
                        SubmittedAt = ident.SubmittedAt ?? user.Onboarding?.IdentityDocumentUploadedAt,
                        VerifiedAt = ident.VerifiedAt
                    } : null
                } : null
            };

            return Success("KYC review details fetched successfully", dto);
        }

        [Authorize]
        [HttpGet("{userId}/evidence/{type}")]
        public async Task<IActionResult> GetKycEvidence(Guid userId, string type)
        {
            // IDOR & RBAC Protection: only Admin or the authenticated Owner may access
            var callerId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            var isAdmin = User.IsInRole("Admin");
            var isOwner = string.Equals(callerId, userId.ToString(), StringComparison.OrdinalIgnoreCase);

            if (!isAdmin && !isOwner)
            {
                _audit?.Record("kyc_evidence_access_denied", User.FindFirstValue(ClaimTypes.Email) ?? callerId ?? "unknown", false,
                    new { targetUserId = userId, evidenceType = type, reason = "Forbidden - neither Admin nor Owner" });
                return StatusCode(StatusCodes.Status403Forbidden, new { success = false, message = "Forbidden: access restricted to Admin or account owner" });
            }

            var normalizedType = type?.Trim().ToLowerInvariant();
            if (normalizedType is not ("front" or "back"))
            {
                return BadRequest(new { success = false, message = "Invalid evidence type. Allowed types: front, back" });
            }

            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
            {
                return NotFoundResponse("User not found");
            }

            string? storedPath = normalizedType switch
            {
                "front" => user.Kyc?.Identity?.FrontImage ?? user.Onboarding?.IdentityFrontImagePath,
                "back" => user.Kyc?.Identity?.BackImage ?? user.Onboarding?.IdentityBackImagePath,
                _ => null
            };

            if (string.IsNullOrWhiteSpace(storedPath))
            {
                return NotFoundResponse($"No {normalizedType} evidence registered for user");
            }

            var physicalPath = _kycStorage.ResolveKycEvidencePath(storedPath);
            if (physicalPath == null || !System.IO.File.Exists(physicalPath))
            {
                return NotFoundResponse("Evidence file not found in storage");
            }

            var contentType = _kycStorage.GetContentType(physicalPath);

            // Restrictive caching and security headers
            Response.Headers["Cache-Control"] = "no-store, no-cache, private, must-revalidate";
            Response.Headers["Pragma"] = "no-cache";
            Response.Headers["X-Content-Type-Options"] = "nosniff";

            _audit?.Record("kyc_evidence_access", User.FindFirstValue(ClaimTypes.Email) ?? callerId ?? "unknown", true,
                new { targetUserId = userId, evidenceType = normalizedType, resolvedFileName = Path.GetFileName(physicalPath), fileExists = true });

            return PhysicalFile(physicalPath, contentType, enableRangeProcessing: true);
        }

        [Authorize(Roles = "Admin,SuperAdmin")]
        [HttpPost("approve/{userId}")]
        public async Task<IActionResult> ApproveKyc(Guid userId)
        {
            var callerId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(ClaimTypes.Email) ?? "admin";

            if (_identityService != null)
            {
                var success = await _identityService.RecordAdminDecisionAsync(userId.ToString(), callerId, true);
                if (!success)
                    return NotFoundResponse("User not found");
                return Success("KYC Approved");
            }

            // Fallback: update user state without ever setting FaceVerified
            var filter = Builders<ApplicationUser>.Filter.Eq(u => u.Id, userId);
            var update = Builders<ApplicationUser>.Update
                .Set(u => u.Kyc.Status, VerificationStatus.Verified)
                .Set(u => u.Kyc.Identity.Status, VerificationStatus.Verified)
                .Set(u => u.Kyc.VerifiedAt, DateTime.UtcNow)
                .Set(u => u.Onboarding.IdentityDocumentVerified, true);

            var updatedUser = await _context.ApplicationUsers.FindOneAndUpdateAsync(
                filter,
                update,
                new FindOneAndUpdateOptions<ApplicationUser> { ReturnDocument = ReturnDocument.After }
            );

            if (updatedUser == null)
            {
                var existingUser = await _userManager.FindByIdAsync(userId.ToString());
                if (existingUser != null && (existingUser.Kyc?.Status == VerificationStatus.Verified || existingUser.Kyc?.Status == VerificationStatus.Rejected))
                {
                    return StatusCode(StatusCodes.Status409Conflict, new { success = false, message = "User KYC has already been processed" });
                }
                return NotFoundResponse("User not found");
            }

            await OnboardingGate.PromoteIfCompleteAsync(updatedUser, _userManager, _audit);
            return Success("KYC Approved");
        }

        public class RejectKycDto
        {
            public string Reason { get; set; } = string.Empty;
        }

        [Authorize(Roles = "Admin,SuperAdmin")]
        [HttpPost("reject/{userId}")]
        public async Task<IActionResult> RejectKyc(Guid userId, [FromBody] RejectKycDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto?.Reason))
                return Fail("Rejection reason is required");

            var callerId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(ClaimTypes.Email) ?? "admin";

            if (_identityService != null)
            {
                var success = await _identityService.RecordAdminDecisionAsync(userId.ToString(), callerId, false, dto.Reason);
                if (!success)
                    return NotFoundResponse("User not found");
                return Success("KYC Rejected");
            }

            var filter = Builders<ApplicationUser>.Filter.Eq(u => u.Id, userId);
            var update = Builders<ApplicationUser>.Update
                .Set(u => u.Kyc.Status, VerificationStatus.Rejected)
                .Set(u => u.Kyc.Identity.Status, VerificationStatus.Rejected)
                .Set(u => u.Kyc.Identity.RejectionReason, dto.Reason)
                .Set(u => u.Onboarding.IdentityDocumentVerified, false);

            var updatedUser = await _context.ApplicationUsers.FindOneAndUpdateAsync(
                filter,
                update,
                new FindOneAndUpdateOptions<ApplicationUser> { ReturnDocument = ReturnDocument.After }
            );

            if (updatedUser == null)
            {
                var existingUser = await _userManager.FindByIdAsync(userId.ToString());
                if (existingUser != null && (existingUser.Kyc?.Status == VerificationStatus.Verified || existingUser.Kyc?.Status == VerificationStatus.Rejected))
                {
                    return StatusCode(StatusCodes.Status409Conflict, new { success = false, message = "User KYC has already been processed" });
                }
                return NotFoundResponse("User not found");
            }

            return Success("KYC Rejected");
        }
    }
}