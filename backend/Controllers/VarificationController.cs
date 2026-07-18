using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Services;

namespace WebApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class VarificationController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly MongoDbContext _context;

        public VarificationController(
            UserManager<ApplicationUser> userManager,
            MongoDbContext context)
        {
            _userManager = userManager;
            _context = context;
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


        [Authorize(Roles = "Admin")]
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingUsers()
        {
            var users = await _context.ApplicationUsers
                .Find(x => x.Kyc.Status == VerificationStatus.Pending)
                .ToListAsync();

            return Success("Pending users fetched successfully", users);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("approve/{userId}")]
        public async Task<IActionResult> ApproveKyc(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());

            if (user == null)
                return NotFoundResponse("User not found");

            user.Kyc.Identity.Status = VerificationStatus.Verified;
            user.Kyc.Face.Status = VerificationStatus.Verified;
            user.Kyc.Status = VerificationStatus.Verified;
            user.Kyc.VerifiedAt = DateTime.UtcNow;

            // Bridge to the universal Phase-1 gate. Admin approval of identity + face
            // is the concierge KYC path for the closed alpha (SUMSUB is not wired), so
            // it must flip the Onboarding flags the derived Phase-1 gate reads —
            // otherwise Onboarding.Phase never reaches 1 and the Creator journey stays
            // locked. Promotion itself stays derived: we only set the item flags and
            // let the shared gate decide (it still requires email + phone OTP too).
            user.Onboarding.IdentityDocumentVerified = true;
            user.Onboarding.FaceVerified = true;

            await _userManager.UpdateAsync(user);

            await OnboardingGate.PromoteIfCompleteAsync(user, _userManager);

            return Success("KYC Approved");
        }

        public class RejectKycDto
        {
            public string Reason { get; set; }
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("reject/{userId}")]
        public async Task<IActionResult> RejectKyc(Guid userId, [FromBody] RejectKycDto dto)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());

            if (user == null)
                return NotFoundResponse("User not found");

            user.Kyc.Status = VerificationStatus.Rejected;
            user.Kyc.Identity.Status = VerificationStatus.Rejected;
            user.Kyc.Identity.RejectionReason = dto.Reason;

            await _userManager.UpdateAsync(user);

            return Success("KYC Rejected");
        }
    }
}