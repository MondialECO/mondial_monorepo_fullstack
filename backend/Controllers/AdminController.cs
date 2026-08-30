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
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<ApplicationRole> _roleManager;
        private readonly MongoDbContext _context;
        private readonly WebApp.Services.IPhaseNotificationService _phaseNotificationService;
        private readonly WebApp.Services.IInvestorService _investorService;

        public AdminController(
            UserManager<ApplicationUser> userManager,
            RoleManager<ApplicationRole> roleManager,
            MongoDbContext context,
            WebApp.Services.IPhaseNotificationService phaseNotificationService,
            WebApp.Services.IInvestorService investorService)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _context = context;
            _phaseNotificationService = phaseNotificationService;
            _investorService = investorService;
        }

        // GET: api/admin/users
        [HttpGet("users")]
        public IActionResult GetUsers()
        {
            var users = _userManager.Users.Select(user => new
            {
                user.Id,
                user.Name,
                user.Email,
                user.PhoneNumber,
                user.User,
                user.LockoutEnd,
                user.CreatedOn,
                user.Address
            }).ToList();

            return Ok(users);
        }

        // GET: api/admin/user/{id}
        [HttpGet("user/{id}")]
        public async Task<IActionResult> GetUserById(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return NotFound(new { Message = "User not found" });

            return Ok(new
            {
                user.Id,
                user.Name,
                user.Email,
                user.PhoneNumber,
                user.UserName,
                user.Address.address,
                user.Address.City,
                user.Address.Country,
                user.LockoutEnd,
                user.CreatedOn
            });
        }

        // POST: api/admin/create-role
        //[HttpPost("create-role")]
        //public async Task<IActionResult> CreateRole(string roleName, string description)
        //{
        //    if (await _roleManager.RoleExistsAsync(roleName))
        //        return BadRequest(new { Message = "Role already exists" });

        //    var role = new ApplicationRole
        //    {
        //        Name = roleName,
        //        Description = description
        //    };

        //    var result = await _roleManager.CreateAsync(role);
        //    if (result.Succeeded)
        //        return Ok(new { Message = "Role created successfully" });

        //    return BadRequest(result.Errors);
        //}


        // POST: api/admin/assign-role
        [HttpPost("assign-role")]
        public async Task<IActionResult> AssignRoleToUser(string userId, string roleName)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound(new { Message = "User not found" });

            if (!await _roleManager.RoleExistsAsync(roleName))
                return NotFound(new { Message = "Role not found" });

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


        // DELETE: api/admin/delete-user/{id}
        [HttpDelete("delete-user/{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return NotFound(new { Message = "User not found" });

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return Ok(new { Message = "User deleted successfully" });
        }

        // POST: api/admin/disable-login
        [HttpPost("disable-login")]
        public async Task<IActionResult> DisableLogin([FromBody] string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { Message = "User not found." });
            }

            user.LockoutEnd = DateTimeOffset.MaxValue;
            var result = await _userManager.UpdateAsync(user);

            if (result.Succeeded)
            {
                return Ok(new { Message = $"User '{user.UserName}' login has been disabled." });
            }

            return BadRequest(new { Message = $"Failed to disable login for user '{user.UserName}'." });
        }

        // POST: api/admin/enable-login
        [HttpPost("enable-login")]
        public async Task<IActionResult> EnableLogin([FromBody] string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { Message = "User not found." });
            }

            user.LockoutEnd = null;
            var result = await _userManager.UpdateAsync(user);

            if (result.Succeeded)
            {
                return Ok(new { Message = $"User '{user.UserName}' login has been enabled." });
            }

            return BadRequest(new { Message = $"Failed to enable login for user '{user.UserName}'." });
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