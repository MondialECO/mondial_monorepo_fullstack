using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using System.Threading.Tasks;
using System.Linq;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Interface;
using Microsoft.IdentityModel.Tokens;
using WebApp.Models;
using WebApp.DbContext;
using MongoDB.Driver;

namespace WebApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public class AdminController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<ApplicationRole> _roleManager;
        private readonly MongoDbContext _context;
        private readonly WebApp.Services.IPhaseNotificationService _phaseNotificationService;
        private readonly WebApp.Services.IInvestorService _investorService;
        private readonly WebApp.Services.Audit.IAuditLogger? _audit;

        public AdminController(
            UserManager<ApplicationUser> userManager,
            RoleManager<ApplicationRole> roleManager,
            MongoDbContext context,
            WebApp.Services.IPhaseNotificationService phaseNotificationService,
            WebApp.Services.IInvestorService investorService,
            WebApp.Services.Audit.IAuditLogger? audit = null)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _context = context;
            _phaseNotificationService = phaseNotificationService;
            _investorService = investorService;
            _audit = audit;
        }

        // GET: api/admin/users
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers([FromQuery] WebApp.Models.Dtos.AdminUserListQuery query)
        {
            var page = query.Page <= 0 ? 1 : query.Page;
            var pageSize = query.PageSize <= 0 ? 25 : Math.Min(query.PageSize, 100);

            var builder = Builders<ApplicationUser>.Filter;
            var filter = builder.Empty;

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var s = query.Search.Trim();
                var searchFilter = builder.Or(
                    builder.Regex(u => u.Name, new MongoDB.Bson.BsonRegularExpression(s, "i")),
                    builder.Regex(u => u.Email, new MongoDB.Bson.BsonRegularExpression(s, "i")),
                    builder.Regex(u => u.UserName, new MongoDB.Bson.BsonRegularExpression(s, "i"))
                );

                if (Guid.TryParse(s, out var searchGuid))
                {
                    searchFilter = builder.Or(searchFilter, builder.Eq(u => u.Id, searchGuid));
                }

                filter = builder.And(filter, searchFilter);
            }

            if (!string.IsNullOrWhiteSpace(query.KycStatus))
            {
                if (Enum.TryParse<VerificationStatus>(query.KycStatus, true, out var kycEnum))
                {
                    filter = builder.And(filter, builder.Eq(u => u.Kyc.Status, kycEnum));
                }
            }

            if (!string.IsNullOrWhiteSpace(query.Country))
            {
                filter = builder.And(filter, builder.Regex(u => u.Address.Country, new MongoDB.Bson.BsonRegularExpression($"^{query.Country.Trim()}$", "i")));
            }

            if (!string.IsNullOrWhiteSpace(query.LoginStatus))
            {
                var status = query.LoginStatus.Trim().ToLowerInvariant();
                var now = DateTimeOffset.UtcNow;
                if (status == "locked")
                {
                    filter = builder.And(filter, builder.Gt(u => u.LockoutEnd, now));
                }
                else if (status == "active")
                {
                    filter = builder.And(filter, builder.Or(
                        builder.Eq(u => u.LockoutEnd, null),
                        builder.Lte(u => u.LockoutEnd, now)
                    ));
                }
            }

            var totalCount = await _context.ApplicationUsers.CountDocumentsAsync(filter);
            var users = await _context.ApplicationUsers
                .Find(filter)
                .SortByDescending(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Limit(pageSize)
                .ToListAsync();

            var userIds = users.Select(u => u.Id.ToString()).ToList();
            var profiles = await _context.ProfessionalProfiles
                .Find(Builders<ProfessionalProfileRecord>.Filter.In(p => p.UserId, userIds))
                .ToListAsync();
            var profileMap = profiles.ToDictionary(p => p.UserId, p => p.PublicSlug);

            var items = new List<WebApp.Models.Dtos.AdminUserListItemDto>();
            foreach (var user in users)
            {
                var roles = (await _userManager.GetRolesAsync(user)).ToList();

                // If Role filter is provided and does not match, skip
                if (!string.IsNullOrWhiteSpace(query.Role) && !roles.Any(r => string.Equals(r, query.Role, StringComparison.OrdinalIgnoreCase)))
                {
                    continue;
                }

                profileMap.TryGetValue(user.Id.ToString(), out var slug);
                var isLocked = user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTimeOffset.UtcNow;

                items.Add(new WebApp.Models.Dtos.AdminUserListItemDto
                {
                    UserId = user.Id.ToString(),
                    DisplayName = !string.IsNullOrWhiteSpace(user.Name) ? user.Name : (user.UserName ?? "User"),
                    PublicSlug = slug,
                    Email = user.Email ?? string.Empty,
                    PhoneNumber = user.PhoneNumber,
                    Country = user.Address?.Country,
                    Roles = roles,
                    JoinedAt = user.CreatedAt != default ? user.CreatedAt : user.CreatedOn,
                    LastLogin = user.LastLogin != default ? user.LastLogin : null,
                    KycStatus = user.Kyc?.Status.ToString() ?? "NotStarted",
                    IsLocked = isLocked,
                    LockoutEnd = user.LockoutEnd,
                    OnboardingPhase = user.Onboarding?.Phase ?? 0
                });
            }

            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            return Ok(new WebApp.Models.Dtos.AdminPagedResult<WebApp.Models.Dtos.AdminUserListItemDto>
            {
                Items = items,
                Page = page,
                PageSize = pageSize,
                TotalItems = totalCount,
                TotalPages = totalPages
            });
        }

        // GET: api/admin/user/{id}
        [HttpGet("user/{id}")]
        public async Task<IActionResult> GetUserById(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return NotFound(new { message = "User not found" });

            var roles = (await _userManager.GetRolesAsync(user)).ToList();
            var isLocked = user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTimeOffset.UtcNow;

            var profile = await _context.ProfessionalProfiles
                .Find(p => p.UserId == id)
                .FirstOrDefaultAsync();

            var ideasCount = (int)await _context.BusinessIdeas.CountDocumentsAsync(b => b.CreatorId == id);
            var companiesCount = (int)await _context.Companies.CountDocumentsAsync(c => c.OwnerId == id);
            var servicesCount = (int)await _context.ServiceListings.CountDocumentsAsync(s => s.ProviderId == id);
            var workroomsCount = (int)await _context.WorkroomEngagements.CountDocumentsAsync(w => w.ProviderId == id || w.ClientId == id);

            var investorId = user.InvestorProfile?.InvestorId;
            var investorMatches = !string.IsNullOrEmpty(investorId)
                ? (int)await _context.InvestorMatches.CountDocumentsAsync(m => m.InvestorId == investorId)
                : 0;
            var investments = (int)await _context.Investments.CountDocumentsAsync(i => i.InvestorId == user.Id);

            var detail = new WebApp.Models.Dtos.AdminUserDetailDto
            {
                UserId = user.Id.ToString(),
                DisplayName = !string.IsNullOrWhiteSpace(user.Name) ? user.Name : (user.UserName ?? "User"),
                UserName = user.UserName ?? string.Empty,
                Email = user.Email ?? string.Empty,
                PhoneNumber = user.PhoneNumber,
                EmailConfirmed = user.EmailConfirmed,
                PhoneNumberConfirmed = user.PhoneNumberConfirmed,
                Address = user.Address?.address,
                City = user.Address?.City,
                Country = user.Address?.Country,
                ImagePath = user.ImagePath,
                Bio = user.Bio,
                Title = user.Title,
                Roles = roles,
                JoinedAt = user.CreatedAt != default ? user.CreatedAt : user.CreatedOn,
                LastLogin = user.LastLogin != default ? user.LastLogin : null,
                IsLocked = isLocked,
                LockoutEnd = user.LockoutEnd,
                OnboardingPhase = user.Onboarding?.Phase ?? 0,

                KycStatus = user.Kyc?.Status.ToString() ?? "NotStarted",
                KycIdentityVerified = user.Kyc?.Identity?.Status == VerificationStatus.Verified,
                KycFaceVerified = user.Kyc?.Face?.Status == VerificationStatus.Verified,
                KycVerifiedAt = user.Kyc?.VerifiedAt,
                KycRejectionReason = user.Kyc?.Identity?.RejectionReason,

                SpVerified = user.ServiceProviderProfile?.VerificationStatus == ServiceProviderVerificationStatus.Verified,
                SpVerificationStatus = user.ServiceProviderProfile?.VerificationStatus.ToString(),
                SpTrustScore = user.ServiceProviderProfile?.TrustScore,

                InvestorFinanceVerified = user.InvestorProfile?.FinanceVerified,

                RoleActivity = new WebApp.Models.Dtos.AdminRoleActivitySummary
                {
                    CreatorIdeasCount = ideasCount,
                    EntrepreneurCompaniesCount = companiesCount,
                    InvestorMatchesCount = investorMatches,
                    InvestorInvestmentsCount = investments,
                    ServiceProviderListingsCount = servicesCount,
                    ServiceProviderWorkroomsCount = workroomsCount
                }
            };

            if (profile != null)
            {
                detail.UniversalProfile = new WebApp.Models.Dtos.AdminUniversalProfileSummary
                {
                    PublicSlug = profile.PublicSlug,
                    Headline = profile.Headline,
                    Bio = profile.Bio,
                    ProfessionalOverview = profile.ProfessionalOverview?.PlainText,
                    Skills = profile.Skills ?? new List<string>(),
                    ExpertiseDomains = profile.Industries ?? new List<string>(),
                    Languages = profile.Languages ?? new List<string>(),
                    ExperienceCount = profile.Experiences?.Count ?? 0,
                    EducationCount = profile.Education?.Count ?? 0,
                    PortfolioItemCount = user.ServiceProviderProfile?.PortfolioItems?.Count ?? 0
                };
            }

            return Ok(detail);
        }

        // POST: api/admin/users/{userId}/roles/add
        [HttpPost("users/{userId}/roles/add")]
        public async Task<IActionResult> AddRoleToUser(string userId, [FromBody] WebApp.Models.Dtos.AddUserRoleRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Role))
                return BadRequest(new { error = "Role is required." });

            var role = request.Role.Trim();
            var isActorSuperAdmin = User.IsInRole("SuperAdmin");
            var currentAdminId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            // Privileged role assignment checks: Only SuperAdmin can assign Admin or SuperAdmin
            if (string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(role, "SuperAdmin", StringComparison.OrdinalIgnoreCase))
            {
                if (!isActorSuperAdmin)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { error = "Only SuperAdmin can assign Admin or SuperAdmin roles." });
                }
            }

            var allowedRoles = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "Creator", "Entrepreneur", "Investor", "ServiceProvider", "Admin", "SuperAdmin"
            };

            if (!allowedRoles.Contains(role))
                return BadRequest(new { error = $"Invalid role '{role}'." });

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound(new { error = "User not found." });

            if (!await _roleManager.RoleExistsAsync(role))
                return BadRequest(new { error = $"Role '{role}' is not configured in the system." });

            var existingRoles = await _userManager.GetRolesAsync(user);
            if (existingRoles.Any(r => string.Equals(r, role, StringComparison.OrdinalIgnoreCase)))
            {
                return Ok(new
                {
                    message = $"User already has role '{role}'.",
                    roles = existingRoles
                });
            }

            var result = await _userManager.AddToRoleAsync(user, role);
            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                return BadRequest(new { error = $"Failed to add role: {errors}" });
            }

            // Sync legacy primary User field if unset
            if (string.IsNullOrWhiteSpace(user.User))
            {
                user.User = role;
                await _userManager.UpdateAsync(user);
            }

            var updatedRoles = await _userManager.GetRolesAsync(user);

            // Audit recording for role additions
            if (string.Equals(role, "SuperAdmin", StringComparison.OrdinalIgnoreCase))
            {
                _audit?.Record("superadmin_role_assigned", currentAdminId ?? "system", true, new { targetUserId = userId, role });
            }
            else if (string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
            {
                _audit?.Record("superadmin_admin_role_assigned", currentAdminId ?? "system", true, new { targetUserId = userId, role });
            }
            else
            {
                _audit?.Record("admin_role_assigned", currentAdminId ?? "system", true, new { targetUserId = userId, role });
            }

            return Ok(new
            {
                message = $"Role '{role}' added successfully.",
                roles = updatedRoles
            });
        }

        // POST: api/admin/users/{userId}/roles/remove
        [HttpPost("users/{userId}/roles/remove")]
        public async Task<IActionResult> RemoveRoleFromUser(string userId, [FromBody] WebApp.Models.Dtos.RemoveUserRoleRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Role))
                return BadRequest(new { error = "Role is required." });

            var role = request.Role.Trim();
            if (!Guid.TryParse(userId, out _))
                return NotFound(new { error = "User not found." });

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound(new { error = "User not found." });

            var isActorSuperAdmin = User.IsInRole("SuperAdmin");
            var currentAdminId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            // Privileged role removal checks: Only SuperAdmin can remove Admin or SuperAdmin
            if (string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(role, "SuperAdmin", StringComparison.OrdinalIgnoreCase))
            {
                if (!isActorSuperAdmin)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { error = "Only SuperAdmin can remove Admin or SuperAdmin roles." });
                }
            }

            // Last SuperAdmin protection
            if (string.Equals(role, "SuperAdmin", StringComparison.OrdinalIgnoreCase))
            {
                var allSuperAdmins = await _userManager.GetUsersInRoleAsync("SuperAdmin");
                if (allSuperAdmins.Count <= 1)
                {
                    return StatusCode(StatusCodes.Status409Conflict, new { error = "At least one SuperAdmin must remain active." });
                }
            }

            // Normal Admin self-protection
            if (string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase) &&
                string.Equals(userId, currentAdminId, StringComparison.OrdinalIgnoreCase) &&
                !isActorSuperAdmin)
            {
                return BadRequest(new { error = "Self-protection: Cannot remove your own Admin role." });
            }

            var existingRoles = (await _userManager.GetRolesAsync(user)).ToList();
            if (!existingRoles.Any(r => string.Equals(r, role, StringComparison.OrdinalIgnoreCase)))
            {
                return BadRequest(new { error = $"User does not have role '{role}'." });
            }

            if (existingRoles.Count <= 1)
            {
                return BadRequest(new { error = "Cannot remove the user's only role. Account must retain at least one role." });
            }

            var matchingRole = existingRoles.First(r => string.Equals(r, role, StringComparison.OrdinalIgnoreCase));
            var result = await _userManager.RemoveFromRoleAsync(user, matchingRole);
            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                return BadRequest(new { error = $"Failed to remove role: {errors}" });
            }

            var updatedRoles = (await _userManager.GetRolesAsync(user)).ToList();
            if (string.Equals(user.User, matchingRole, StringComparison.OrdinalIgnoreCase))
            {
                user.User = updatedRoles.FirstOrDefault() ?? string.Empty;
                await _userManager.UpdateAsync(user);
            }

            // Audit recording for role removal
            if (string.Equals(matchingRole, "SuperAdmin", StringComparison.OrdinalIgnoreCase))
            {
                _audit?.Record("superadmin_role_removed", currentAdminId ?? "system", true, new { targetUserId = userId, role = matchingRole });
            }
            else if (string.Equals(matchingRole, "Admin", StringComparison.OrdinalIgnoreCase))
            {
                _audit?.Record("superadmin_admin_role_removed", currentAdminId ?? "system", true, new { targetUserId = userId, role = matchingRole });
            }
            else
            {
                _audit?.Record("admin_role_removed", currentAdminId ?? "system", true, new { targetUserId = userId, role = matchingRole });
            }

            return Ok(new
            {
                message = $"Role '{matchingRole}' removed successfully. Historical data preserved.",
                roles = updatedRoles
            });
        }

        // [LEGACY / UNSAFE — NOT USED BY NEW ADMIN UI]
        // POST: api/admin/assign-role
        [HttpPost("assign-role")]
        public async Task<IActionResult> AssignRoleToUser(string userId, string roleName)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound(new { Message = "User not found" });

            if (!await _roleManager.RoleExistsAsync(roleName))
                return NotFound(new { Message = "Role not found" });

            var isActorSuperAdmin = User.IsInRole("SuperAdmin");
            if ((string.Equals(roleName, "Admin", StringComparison.OrdinalIgnoreCase) ||
                 string.Equals(roleName, "SuperAdmin", StringComparison.OrdinalIgnoreCase)) && !isActorSuperAdmin)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { error = "Only SuperAdmin can assign Admin or SuperAdmin roles." });
            }

            var existingRoles = await _userManager.GetRolesAsync(user);

            // --- Remove old roles ---
            if (existingRoles.Any())
            {
                var remove = await _userManager.RemoveFromRolesAsync(user, existingRoles);
                if (!remove.Succeeded)
                    return BadRequest(remove.Errors);
            }

            // --- Assign new role ---
            var result = await _userManager.AddToRoleAsync(user, roleName);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            // --- Update custom field (optional) ---
            user.User = roleName;
            await _userManager.UpdateAsync(user);

            return Ok(new { Message = "Role assigned successfully" });
        }

        // [LEGACY / UNSAFE — NOT USED BY NEW ADMIN UI]
        // DELETE: api/admin/delete-user/{id}
        [HttpDelete("delete-user/{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return NotFound(new { Message = "User not found" });

            var isActorSuperAdmin = User.IsInRole("SuperAdmin");
            var isTargetSuperAdmin = await _userManager.IsInRoleAsync(user, "SuperAdmin");
            if (isTargetSuperAdmin && !isActorSuperAdmin)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { error = "Admin cannot delete a SuperAdmin account." });
            }

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return Ok(new { Message = "User deleted successfully" });
        }

        // POST: api/admin/disable-login
        [HttpPost("disable-login")]
        public async Task<IActionResult> DisableLogin([FromBody] WebApp.Models.Dtos.UserLockoutRequest request)
        {
            var targetUserId = request?.UserId?.Trim();
            if (string.IsNullOrEmpty(targetUserId))
                return BadRequest(new { error = "User ID is required." });

            var currentAdminId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.Equals(targetUserId, currentAdminId, StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { error = "Self-protection: Cannot suspend your own admin account." });
            }

            if (!Guid.TryParse(targetUserId, out _))
                return NotFound(new { error = "User not found." });

            var user = await _userManager.FindByIdAsync(targetUserId);
            if (user == null)
            {
                return NotFound(new { error = "User not found." });
            }

            var isActorSuperAdmin = User.IsInRole("SuperAdmin");
            var isTargetSuperAdmin = await _userManager.IsInRoleAsync(user, "SuperAdmin");
            var isTargetAdmin = await _userManager.IsInRoleAsync(user, "Admin");

            if (isTargetSuperAdmin)
            {
                if (!isActorSuperAdmin)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { error = "Admin cannot suspend a SuperAdmin account." });
                }

                // Check last active SuperAdmin protection
                var allSuperAdmins = await _userManager.GetUsersInRoleAsync("SuperAdmin");
                var activeSuperAdmins = allSuperAdmins.Count(u => u.LockoutEnd == null || u.LockoutEnd <= DateTimeOffset.UtcNow);
                if (activeSuperAdmins <= 1 && (user.LockoutEnd == null || user.LockoutEnd <= DateTimeOffset.UtcNow))
                {
                    return StatusCode(StatusCodes.Status409Conflict, new { error = "At least one active SuperAdmin must remain." });
                }
            }

            user.LockoutEnd = DateTimeOffset.MaxValue;
            var result = await _userManager.UpdateAsync(user);

            if (result.Succeeded)
            {
                var auditAction = (isTargetAdmin || isTargetSuperAdmin)
                    ? "superadmin_admin_suspended"
                    : "admin_user_suspended";

                _audit?.Record(auditAction, currentAdminId ?? "system", true, new { targetUserId = targetUserId, reason = request?.Reason });

                return Ok(new
                {
                    success = true,
                    message = $"User '{user.UserName ?? user.Email}' login has been disabled.",
                    isLocked = true,
                    lockoutEnd = user.LockoutEnd,
                    reason = request?.Reason
                });
            }

            return BadRequest(new { error = $"Failed to disable login for user '{user.UserName}'." });
        }

        // POST: api/admin/enable-login
        [HttpPost("enable-login")]
        public async Task<IActionResult> EnableLogin([FromBody] WebApp.Models.Dtos.UserLockoutRequest request)
        {
            var targetUserId = request?.UserId?.Trim();
            if (string.IsNullOrEmpty(targetUserId))
                return BadRequest(new { error = "User ID is required." });

            if (!Guid.TryParse(targetUserId, out _))
                return NotFound(new { error = "User not found." });

            var user = await _userManager.FindByIdAsync(targetUserId);
            if (user == null)
            {
                return NotFound(new { error = "User not found." });
            }

            var isActorSuperAdmin = User.IsInRole("SuperAdmin");
            var isTargetSuperAdmin = await _userManager.IsInRoleAsync(user, "SuperAdmin");
            var currentAdminId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (isTargetSuperAdmin && !isActorSuperAdmin)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { error = "Admin cannot manage a SuperAdmin account." });
            }

            user.LockoutEnd = null;
            var result = await _userManager.UpdateAsync(user);

            if (result.Succeeded)
            {
                var auditAction = isTargetSuperAdmin ? "superadmin_admin_unsuspended" : "admin_user_unsuspended";
                _audit?.Record(auditAction, currentAdminId ?? "system", true, new { targetUserId = targetUserId });

                return Ok(new
                {
                    success = true,
                    message = $"User '{user.UserName ?? user.Email}' login has been enabled.",
                    isLocked = false,
                    lockoutEnd = (DateTimeOffset?)null
                });
            }

            return BadRequest(new { error = $"Failed to enable login for user '{user.UserName}'." });
        }

        // ============ UNIFIED VERIFICATION HUB SUMMARY ============

        [HttpGet("verifications/summary")]
        public async Task<IActionResult> GetVerificationSummary()
        {
            var uBuilder = Builders<ApplicationUser>.Filter;

            var pendingKyc = (int)await _context.ApplicationUsers.CountDocumentsAsync(
                uBuilder.Ne(u => u.Kyc, null) & uBuilder.Eq(u => u.Kyc.Status, VerificationStatus.Pending));
            var verifiedKyc = (int)await _context.ApplicationUsers.CountDocumentsAsync(
                uBuilder.Ne(u => u.Kyc, null) & uBuilder.Eq(u => u.Kyc.Status, VerificationStatus.Verified));
            var rejectedKyc = (int)await _context.ApplicationUsers.CountDocumentsAsync(
                uBuilder.Ne(u => u.Kyc, null) & uBuilder.Eq(u => u.Kyc.Status, VerificationStatus.Rejected));

            var pendingSp = (int)await _context.ApplicationUsers.CountDocumentsAsync(
                uBuilder.Ne(u => u.ServiceProviderProfile, null) & uBuilder.Eq(u => u.ServiceProviderProfile.VerificationStatus, ServiceProviderVerificationStatus.UnderReview));
            var verifiedSp = (int)await _context.ApplicationUsers.CountDocumentsAsync(
                uBuilder.Ne(u => u.ServiceProviderProfile, null) & uBuilder.Eq(u => u.ServiceProviderProfile.VerificationStatus, ServiceProviderVerificationStatus.Verified));
            var rejectedSp = (int)await _context.ApplicationUsers.CountDocumentsAsync(
                uBuilder.Ne(u => u.ServiceProviderProfile, null) & uBuilder.Eq(u => u.ServiceProviderProfile.VerificationStatus, ServiceProviderVerificationStatus.Rejected));

            var pendingInv = (int)await _context.InvestorFinanceVerifications.CountDocumentsAsync(v => v.Status == "pending");
            var verifiedInv = (int)await _context.InvestorFinanceVerifications.CountDocumentsAsync(v => v.Status == "verified");
            var rejectedInv = (int)await _context.InvestorFinanceVerifications.CountDocumentsAsync(v => v.Status == "rejected" || v.Status == "needs_update");

            return Ok(new WebApp.Models.Dtos.AdminVerificationSummaryDto
            {
                PendingKycCount = pendingKyc,
                PendingSpCount = pendingSp,
                PendingInvestorFinanceCount = pendingInv,
                VerifiedKycCount = verifiedKyc,
                VerifiedSpCount = verifiedSp,
                VerifiedInvestorFinanceCount = verifiedInv,
                RejectedKycCount = rejectedKyc,
                RejectedSpCount = rejectedSp,
                RejectedInvestorFinanceCount = rejectedInv
            });
        }

        // ============ INVESTOR FINANCE VERIFICATION REVIEW ============

        [HttpGet("investor-finance-verifications")]
        public async Task<IActionResult> GetInvestorFinanceVerifications()
        {
            var list = await _context.InvestorFinanceVerifications
                .Find(_ => true)
                .SortByDescending(v => v.UpdatedAt)
                .ToListAsync();

            var userIds = list.Select(v => v.UserId).Distinct().ToList();
            var users = await _context.ApplicationUsers
                .Find(Builders<ApplicationUser>.Filter.In(u => u.Id, userIds.Select(System.Guid.Parse)))
                .ToListAsync();
            var userMap = users.ToDictionary(u => u.Id.ToString());

            var items = list.Select(v =>
            {
                userMap.TryGetValue(v.UserId, out var u);
                return new WebApp.Models.Dtos.AdminFinanceVerificationListItem
                {
                    Id = v.Id,
                    UserId = v.UserId,
                    InvestorId = v.InvestorId,
                    InvestorName = u?.Name ?? "Investor",
                    InvestorEmail = u?.Email ?? string.Empty,
                    InvestorType = v.InvestorType,
                    DeclaredAvailableCapital = v.DeclaredAvailableCapital,
                    MinTicket = v.MinTicket,
                    MaxTicket = v.MaxTicket,
                    Currency = v.Currency,
                    Status = v.Status,
                    DocumentCount = v.Documents?.Count ?? 0,
                    SubmittedAt = v.SubmittedAt,
                    ReviewedAt = v.ReviewedAt,
                    ReviewedByUserId = v.ReviewedByUserId,
                    DecisionReason = v.DecisionReason
                };
            }).ToList();

            return Ok(items);
        }

        [HttpGet("investor-finance-verifications/{id}")]
        public async Task<IActionResult> GetInvestorFinanceVerificationById(string id)
        {
            var record = await _context.InvestorFinanceVerifications
                .Find(v => v.Id == id)
                .FirstOrDefaultAsync();

            if (record == null)
                return NotFound(new { error = "Finance verification submission not found." });

            return Ok(record);
        }

        [HttpPost("investor-finance-verifications/{id}/decision")]
        public async Task<IActionResult> DecideInvestorFinanceVerification(
            string id, [FromBody] WebApp.Models.Dtos.AdminFinanceDecisionRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Action))
                return BadRequest(new { error = "Action ('verify', 'needs_update', 'reject') is required." });

            var record = await _context.InvestorFinanceVerifications
                .Find(v => v.Id == id)
                .FirstOrDefaultAsync();

            if (record == null)
                return NotFound(new { error = "Finance verification submission not found." });

            var adminUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "admin";
            var action = request.Action.Trim().ToLowerInvariant();

            var user = await _userManager.FindByIdAsync(record.UserId);

            if (action == "verify")
            {
                record.Status = "verified";
                record.ReviewedAt = System.DateTime.UtcNow;
                record.ReviewedByUserId = adminUserId;
                record.DecisionReason = request.DecisionReason;
                record.UpdatedAt = System.DateTime.UtcNow;

                if (user != null)
                {
                    user.InvestorProfile ??= new InvestorProfile();
                    user.InvestorProfile.FinanceVerified = true;
                    await _userManager.UpdateAsync(user);
                }

                await _phaseNotificationService.NotifyFinanceVerificationApprovedAsync(record.UserId, record.InvestorId);
            }
            else if (action == "needs_update")
            {
                if (string.IsNullOrWhiteSpace(request.DecisionReason))
                    return BadRequest(new { error = "Decision reason is required when requesting an update." });

                record.Status = "needs_update";
                record.ReviewedAt = System.DateTime.UtcNow;
                record.ReviewedByUserId = adminUserId;
                record.DecisionReason = request.DecisionReason;
                record.UpdatedAt = System.DateTime.UtcNow;

                if (user != null)
                {
                    user.InvestorProfile ??= new InvestorProfile();
                    user.InvestorProfile.FinanceVerified = false;
                    await _userManager.UpdateAsync(user);
                }

                await _phaseNotificationService.NotifyFinanceVerificationNeedsUpdateAsync(record.UserId, record.InvestorId, request.DecisionReason);
            }
            else if (action == "reject")
            {
                if (string.IsNullOrWhiteSpace(request.DecisionReason))
                    return BadRequest(new { error = "Decision reason is required when rejecting verification." });

                record.Status = "rejected";
                record.ReviewedAt = System.DateTime.UtcNow;
                record.ReviewedByUserId = adminUserId;
                record.DecisionReason = request.DecisionReason;
                record.UpdatedAt = System.DateTime.UtcNow;

                if (user != null)
                {
                    user.InvestorProfile ??= new InvestorProfile();
                    user.InvestorProfile.FinanceVerified = false;
                    await _userManager.UpdateAsync(user);
                }

                await _phaseNotificationService.NotifyFinanceVerificationRejectedAsync(record.UserId, record.InvestorId, request.DecisionReason);
            }
            else
            {
                return BadRequest(new { error = "Invalid action. Allowed values: 'verify', 'needs_update', 'reject'." });
            }

            await _context.InvestorFinanceVerifications.ReplaceOneAsync(v => v.Id == record.Id, record);

            return Ok(new
            {
                success = true,
                id = record.Id,
                status = record.Status,
                decisionReason = record.DecisionReason,
                reviewedAt = record.ReviewedAt
            });
        }
    }

}