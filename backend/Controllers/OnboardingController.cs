using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Hosting;
using System.IdentityModel.Tokens.Jwt;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Services;

namespace WebApp.Controllers
{
    /// <summary>
    /// Phase 1 universal onboarding. Every authenticated user (regardless of
    /// role) walks through these endpoints once: phone OTP → KYC → profile.
    /// The frontend's OnboardingGuard reads Onboarding.Phase from /auth/me
    /// and gates /dashboard/* until Phase == 1.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    // Rate limit applied per-action: send-otp is the only credential-cost
    // endpoint here. The rest are state queries / state advances and only
    // need the global per-IP cap.
    public class OnboardingController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly TwilioService _twilio;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<OnboardingController> _logger;
        private readonly SaveFile _fileService;
        private readonly WebApp.Services.Audit.IAuditLogger _audit;

        public OnboardingController(
            UserManager<ApplicationUser> userManager,
            TwilioService twilio,
            IConfiguration configuration,
            IWebHostEnvironment env,
            ILogger<OnboardingController> logger,
            SaveFile fileService,
            WebApp.Services.Audit.IAuditLogger audit)
        {
            _userManager = userManager;
            _twilio = twilio;
            _configuration = configuration;
            _env = env;
            _logger = logger;
            _fileService = fileService;
            _audit = audit;
        }

        // ------------- Helpers -------------

        private async Task<ApplicationUser> CurrentUserAsync()
        {
            var userId = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                      ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return string.IsNullOrEmpty(userId) ? null : await _userManager.FindByIdAsync(userId);
        }

        private IActionResult Ok(string message, object data = null)
            => base.Ok(new { success = true, message, data });

        private IActionResult Fail(string message, int status = 400)
            => StatusCode(status, new { success = false, message });

        /// <summary>HMAC-SHA256 of code + userId, hex. Salt is the JWT key.</summary>
        private string HashOtp(string code, string userId)
        {
            var key = Encoding.UTF8.GetBytes(_configuration["JwtSettings:Key"] ?? "fallback-key");
            using var hmac = new HMACSHA256(key);
            var bytes = hmac.ComputeHash(Encoding.UTF8.GetBytes($"{userId}:{code}"));
            return Convert.ToHexString(bytes);
        }

        private async Task PromotePhaseIfCompleteAsync(ApplicationUser user)
        {
            // Phase 1 is "complete" when phone is verified AND KYC is verified
            // AND the basic profile is filled. The frontend may complete these
            // in any order; only here do we flip the gate.
            var ready = user.Onboarding.PhoneVerified
                     && string.Equals(user.KycStatus, "VERIFIED", StringComparison.OrdinalIgnoreCase)
                     && user.Onboarding.ProfileComplete;

            if (ready && user.Onboarding.Phase < 1)
            {
                user.Onboarding.Phase = 1;
                user.Onboarding.CompletedAt = DateTime.UtcNow;
                if (user.Tier_level < 1) user.Tier_level = 1;
                await _userManager.UpdateAsync(user);
                _audit.Record("onboarding_complete", user.Email!, true);
            }
        }

        // ------------- Status -------------

        /// <summary>Lightweight read for the OnboardingProvider on every page mount.</summary>
        [HttpGet("status")]
        public async Task<IActionResult> Status()
        {
            var user = await CurrentUserAsync();
            if (user == null) return Fail("User not found", 404);

            return Ok("status", new
            {
                phase = user.Onboarding?.Phase ?? 0,
                phoneVerified = user.Onboarding?.PhoneVerified ?? false,
                kycStatus = user.KycStatus ?? "PENDING",
                kycTier = user.Tier_level,
                profileComplete = user.Onboarding?.ProfileComplete ?? false,
                phone = user.PhoneNumber,
                role = user.User
            });
        }

        // ------------- Phone OTP (step 1.2) -------------

        public class SendOtpRequest { public string Phone { get; set; } }

        [HttpPost("send-otp")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest body)
        {
            if (string.IsNullOrWhiteSpace(body?.Phone))
                return Fail("Phone number is required");

            var user = await CurrentUserAsync();
            if (user == null) return Fail("User not found", 404);

            // Naive E.164 sanity check; full validation lives client-side.
            var phone = body.Phone.Trim();
            if (!phone.StartsWith("+") || phone.Length < 8)
                return Fail("Phone must be in E.164 format (e.g. +33612345678)");

            var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
            user.PhoneNumber = phone;
            user.Onboarding.PhoneVerifyHash = HashOtp(code, user.Id.ToString());
            user.Onboarding.PhoneVerifyExpiresAt = DateTime.UtcNow.AddSeconds(60);
            user.Onboarding.PhoneVerified = false;
            await _userManager.UpdateAsync(user);

            var smsConfigured = !string.IsNullOrWhiteSpace(_configuration["Twilio:AccountSid"]);
            if (smsConfigured)
            {
                try
                {
                    await _twilio.SendSmsAsync(phone, $"Your Mondial verification code is {code}. Expires in 60s.");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send SMS via Twilio");
                    return Fail("Failed to send verification code. Please try again.", 500);
                }
            }
            else
            {
                // Dev fallback: log the code so we can complete the flow without
                // burning Twilio credits. NEVER return the code in the response.
                _logger.LogWarning("[DEV] Twilio not configured. OTP for {Phone}: {Code}", phone, code);
            }

            _audit.Record("otp_send", user.Email!, true, new { phone });
            return Ok("Verification code sent.");
        }

        public class VerifyOtpRequest { public string Code { get; set; } }

        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest body)
        {
            if (string.IsNullOrWhiteSpace(body?.Code) || body.Code.Length != 6)
                return Fail("6-digit code required");

            var user = await CurrentUserAsync();
            if (user == null) return Fail("User not found", 404);

            if (user.Onboarding.PhoneVerifyExpiresAt == null
                || user.Onboarding.PhoneVerifyExpiresAt < DateTime.UtcNow
                || string.IsNullOrEmpty(user.Onboarding.PhoneVerifyHash))
            {
                _audit.Record("otp_verify", user.Email!, false, new { reason = "expired" });
                return Fail("Code expired. Request a new one.");
            }

            var expected = HashOtp(body.Code, user.Id.ToString());
            if (!CryptographicOperations.FixedTimeEquals(
                    Encoding.UTF8.GetBytes(expected),
                    Encoding.UTF8.GetBytes(user.Onboarding.PhoneVerifyHash)))
            {
                _audit.Record("otp_verify", user.Email!, false, new { reason = "bad_code" });
                return Fail("Invalid code");
            }

            user.Onboarding.PhoneVerified = true;
            user.Onboarding.PhoneVerifyHash = null;
            user.Onboarding.PhoneVerifyExpiresAt = null;
            user.PhoneNumberConfirmed = true;
            await _userManager.UpdateAsync(user);

            await PromotePhaseIfCompleteAsync(user);

            _audit.Record("otp_verify", user.Email!, true);
            return Ok("Phone verified");
        }

        // ------------- KYC (step 1.3) -------------

        /// <summary>
        /// Development-only shortcut. Real SUMSUB widget integration is the
        /// next PR. Gated to IsDevelopment() so it cannot be invoked in prod.
        /// </summary>
        [HttpPost("kyc/dev-confirm")]
        public async Task<IActionResult> KycDevConfirm()
        {
            if (!_env.IsDevelopment())
                return Fail("Not available in this environment", 403);

            var user = await CurrentUserAsync();
            if (user == null) return Fail("User not found", 404);

            user.KycStatus = "VERIFIED";
            user.Kyc.Status = VerificationStatus.Verified;
            user.Kyc.VerifiedAt = DateTime.UtcNow;
            if (user.Tier_level < 1) user.Tier_level = 1;
            await _userManager.UpdateAsync(user);

            await PromotePhaseIfCompleteAsync(user);

            _logger.LogInformation("[DEV] KYC dev-confirmed for {Email}", user.Email);
            _audit.Record("kyc_dev_confirm", user.Email!, true);
            return Ok("KYC verified (development).");
        }

        // ------------- Profile (step 1.5) -------------

        [HttpPut("profile")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateProfile(
            [FromForm] string name,
            [FromForm] string title,
            [FromForm] string bio,
            [FromForm] string city,
            [FromForm] string country,
            [FromForm] IFormFile photo = null)
        {
            var user = await CurrentUserAsync();
            if (user == null) return Fail("User not found", 404);

            if (string.IsNullOrWhiteSpace(name))
                return Fail("Name is required");

            user.Name = name.Trim();
            user.Title = string.IsNullOrWhiteSpace(title) ? user.Title : title.Trim();
            user.Bio = string.IsNullOrWhiteSpace(bio) ? user.Bio : bio.Trim();

            user.Address ??= new Address();
            if (!string.IsNullOrWhiteSpace(city)) user.Address.City = city.Trim();
            if (!string.IsNullOrWhiteSpace(country)) user.Address.Country = country.Trim();

            if (photo != null && photo.Length > 0)
            {
                // Local filesystem storage today (Cloudinary migration pending,
                // see memory/mondial-tech-stack.md). SaveFile.cs writes under
                // wwwroot/uploads/ and returns the public path.
                var path = await _fileService.SaveFileAsync(photo, "profile");
                user.ImagePath = path;
            }

            user.Onboarding.ProfileComplete = true;
            await _userManager.UpdateAsync(user);

            await PromotePhaseIfCompleteAsync(user);

            _audit.Record("profile_update", user.Email!, true);
            return Ok("Profile saved", new { imagePath = user.ImagePath });
        }
    }
}
