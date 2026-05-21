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
    /// Phase 1 universal onboarding. Hub-and-spoke flow per Figma design:
    /// 4 mandatory verification items (Identity, Face, Phone, Email) plus
    /// role-conditional supplementary documents (Income/Tax for Investor;
    /// License for ServiceProvider; Residence for all as optional).
    ///
    /// The frontend's OnboardingGuard reads Onboarding.Phase from /status
    /// and gates /dashboard/* until Phase == 1.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OnboardingController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly TwilioService _twilio;
        private readonly EmailService _emailService;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<OnboardingController> _logger;
        private readonly SaveFile _fileService;
        private readonly WebApp.Services.Audit.IAuditLogger _audit;

        public OnboardingController(
            UserManager<ApplicationUser> userManager,
            TwilioService twilio,
            EmailService emailService,
            IConfiguration configuration,
            IWebHostEnvironment env,
            ILogger<OnboardingController> logger,
            SaveFile fileService,
            WebApp.Services.Audit.IAuditLogger audit)
        {
            _userManager = userManager;
            _twilio = twilio;
            _emailService = emailService;
            _configuration = configuration;
            _env = env;
            _logger = logger;
            _fileService = fileService;
            _audit = audit;
        }

        // ----- Constants and helpers --------------------------------------

        /// <summary>The base 4 mandatory items every role must verify.</summary>
        private static readonly string[] CoreRequired =
            { "identity", "face", "phone", "email" };

        /// <summary>Optional + role-conditional supplementary documents.</summary>
        private static readonly string[] AllSupplementary =
            { "residence", "income", "tax", "license" };

        /// <summary>Required item set per role. Creator/Entrepreneur take only the core 4.</summary>
        private static HashSet<string> RequiredItemsFor(string role)
        {
            var set = new HashSet<string>(CoreRequired, StringComparer.OrdinalIgnoreCase);
            if (string.Equals(role, "Investor", StringComparison.OrdinalIgnoreCase))
            {
                set.Add("income");
                set.Add("tax");
            }
            else if (string.Equals(role, "ServiceProvider", StringComparison.OrdinalIgnoreCase))
            {
                set.Add("license");
            }
            return set;
        }

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

        private static bool IsItemVerified(ApplicationUser user, string key)
        {
            var ob = user.Onboarding;
            return key.ToLowerInvariant() switch
            {
                "identity"  => ob.IdentityDocumentVerified,
                "face"      => ob.FaceVerified,
                "phone"     => ob.PhoneVerified,
                "email"     => ob.EmailOtpVerified,
                "residence" => ob.Residence?.Uploaded ?? false,
                "income"    => ob.Income?.Uploaded ?? false,
                "tax"       => ob.Tax?.Uploaded ?? false,
                "license"   => ob.License?.Uploaded ?? false,
                _ => false,
            };
        }

        private async Task PromotePhaseIfCompleteAsync(ApplicationUser user)
        {
            var required = RequiredItemsFor(user.User ?? "");
            var allRequiredDone = required.All(key => IsItemVerified(user, key));

            if (allRequiredDone && user.Onboarding.Phase < 1)
            {
                user.Onboarding.Phase = 1;
                user.Onboarding.CompletedAt = DateTime.UtcNow;
                // Mirror the legacy KycStatus so older code keeps working.
                user.KycStatus = "VERIFIED";
                user.Kyc.Status = VerificationStatus.Verified;
                user.Kyc.VerifiedAt = DateTime.UtcNow;
                if (user.Tier_level < 1) user.Tier_level = 1;
                await _userManager.UpdateAsync(user);
                _audit.Record("onboarding_complete", user.Email!, true, new { role = user.User });
            }
        }

        // ----- Status -----------------------------------------------------

        /// <summary>
        /// Hub-and-spoke status read. Returns one item object per verification,
        /// with required-vs-optional based on the user's role.
        /// </summary>
        [HttpGet("status")]
        public async Task<IActionResult> Status()
        {
            var user = await CurrentUserAsync();
            if (user == null) return Fail("User not found", 404);

            var required = RequiredItemsFor(user.User ?? "");

            object ItemView(string key) => new
            {
                key,
                verified = IsItemVerified(user, key),
                required = required.Contains(key),
            };

            return Ok("status", new
            {
                phase = user.Onboarding?.Phase ?? 0,
                role = user.User,
                phone = user.PhoneNumber,
                email = user.Email,
                items = new
                {
                    identity  = ItemView("identity"),
                    face      = ItemView("face"),
                    phone     = ItemView("phone"),
                    email     = ItemView("email"),
                    residence = ItemView("residence"),
                    income    = ItemView("income"),
                    tax       = ItemView("tax"),
                    license   = ItemView("license"),
                },
            });
        }

        // ----- Phone OTP --------------------------------------------------

        public class SendPhoneOtpRequest { public string Phone { get; set; } }

        [HttpPost("send-otp")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> SendPhoneOtp([FromBody] SendPhoneOtpRequest body)
        {
            if (string.IsNullOrWhiteSpace(body?.Phone))
                return Fail("Phone number is required");

            var user = await CurrentUserAsync();
            if (user == null) return Fail("User not found", 404);

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
                try { await _twilio.SendSmsAsync(phone, $"Your Mondial verification code is {code}. Expires in 60s."); }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send SMS via Twilio");
                    return Fail("Failed to send verification code. Please try again.", 500);
                }
            }
            else
            {
                _logger.LogWarning("[DEV] Twilio not configured. OTP for {Phone}: {Code}", phone, code);
            }

            _audit.Record("otp_send", user.Email!, true, new { phone });
            return Ok("Verification code sent.");
        }

        public class VerifyCodeRequest { public string Code { get; set; } }

        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyPhoneOtp([FromBody] VerifyCodeRequest body)
            => await VerifyOtpCore(body, isEmail: false);

        // ----- Email OTP --------------------------------------------------

        [HttpPost("send-email-otp")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> SendEmailOtp()
        {
            var user = await CurrentUserAsync();
            if (user == null) return Fail("User not found", 404);
            if (string.IsNullOrWhiteSpace(user.Email)) return Fail("Email is missing on account");

            var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
            user.Onboarding.EmailOtpHash = HashOtp(code, user.Id.ToString());
            user.Onboarding.EmailOtpExpiresAt = DateTime.UtcNow.AddMinutes(10);
            user.Onboarding.EmailOtpVerified = false;
            await _userManager.UpdateAsync(user);

            var smtpConfigured = !string.IsNullOrWhiteSpace(_configuration["EmailSettings:Email"]);
            var body = $"<p>Your Mondial verification code is <b>{code}</b>.</p><p>It expires in 10 minutes.</p>";
            var queued = smtpConfigured && await _emailService.SendEmailAsync(user.Email, "Verify your email", body);

            // In Development always log the code regardless of SMTP success
            // so smoke tests + manual QA can complete the flow without
            // depending on an inbox round-trip.
            if (_env.IsDevelopment() || !queued)
            {
                _logger.LogWarning("[DEV] Email OTP for {Email}: {Code}", user.Email, code);
            }

            _audit.Record("email_otp_send", user.Email!, true);
            return Ok("Verification code sent to your email.");
        }

        [HttpPost("verify-email-otp")]
        public async Task<IActionResult> VerifyEmailOtp([FromBody] VerifyCodeRequest body)
            => await VerifyOtpCore(body, isEmail: true);

        private async Task<IActionResult> VerifyOtpCore(VerifyCodeRequest body, bool isEmail)
        {
            if (string.IsNullOrWhiteSpace(body?.Code) || body.Code.Length != 6)
                return Fail("6-digit code required");

            var user = await CurrentUserAsync();
            if (user == null) return Fail("User not found", 404);

            var expiresAt = isEmail ? user.Onboarding.EmailOtpExpiresAt : user.Onboarding.PhoneVerifyExpiresAt;
            var storedHash = isEmail ? user.Onboarding.EmailOtpHash : user.Onboarding.PhoneVerifyHash;
            var auditEvent = isEmail ? "email_otp_verify" : "otp_verify";

            if (expiresAt == null || expiresAt < DateTime.UtcNow || string.IsNullOrEmpty(storedHash))
            {
                _audit.Record(auditEvent, user.Email!, false, new { reason = "expired" });
                return Fail("Code expired. Request a new one.");
            }

            var expected = HashOtp(body.Code, user.Id.ToString());
            if (!CryptographicOperations.FixedTimeEquals(
                    Encoding.UTF8.GetBytes(expected),
                    Encoding.UTF8.GetBytes(storedHash)))
            {
                _audit.Record(auditEvent, user.Email!, false, new { reason = "bad_code" });
                return Fail("Invalid code");
            }

            if (isEmail)
            {
                user.Onboarding.EmailOtpVerified = true;
                user.Onboarding.EmailOtpHash = null;
                user.Onboarding.EmailOtpExpiresAt = null;
                user.EmailConfirmed = true;
            }
            else
            {
                user.Onboarding.PhoneVerified = true;
                user.Onboarding.PhoneVerifyHash = null;
                user.Onboarding.PhoneVerifyExpiresAt = null;
                user.PhoneNumberConfirmed = true;
            }

            await _userManager.UpdateAsync(user);
            await PromotePhaseIfCompleteAsync(user);

            _audit.Record(auditEvent, user.Email!, true);
            return Ok(isEmail ? "Email verified" : "Phone verified");
        }

        // ----- Identity + Face (one SUMSUB session, two cards) ------------

        /// <summary>
        /// Development-only shortcut. Real SUMSUB widget integration is the
        /// next PR. Per product: one shared SUMSUB session verifies BOTH the
        /// identity document and the face match — completing one card flips
        /// both flags so the hub shows both ticks green.
        /// </summary>
        [HttpPost("identity/dev-confirm")]
        public async Task<IActionResult> IdentityDevConfirm()
        {
            if (!_env.IsDevelopment())
                return Fail("Not available in this environment", 403);

            var user = await CurrentUserAsync();
            if (user == null) return Fail("User not found", 404);

            user.Onboarding.IdentityDocumentVerified = true;
            user.Onboarding.FaceVerified = true;
            user.Kyc.Status = VerificationStatus.Verified;
            user.Kyc.VerifiedAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            await PromotePhaseIfCompleteAsync(user);

            _logger.LogInformation("[DEV] Identity+Face dev-confirmed for {Email}", user.Email);
            _audit.Record("identity_dev_confirm", user.Email!, true);
            return Ok("Identity verified (development).");
        }

        // ----- Supplementary documents ------------------------------------

        /// <summary>
        /// Upload a supplementary document. Required vs optional is computed
        /// per role at /status; this endpoint accepts any of the four types
        /// and lets the role-gate decide whether it counts toward Phase 1.
        /// </summary>
        [HttpPost("documents/{type}")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadDocument(string type, [FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0)
                return Fail("File is required");

            var key = (type ?? "").ToLowerInvariant();
            if (!AllSupplementary.Contains(key))
                return Fail($"Unknown document type '{type}'. Expected one of: {string.Join(", ", AllSupplementary)}");

            var user = await CurrentUserAsync();
            if (user == null) return Fail("User not found", 404);

            string path;
            try
            {
                path = await _fileService.SaveFileAsync(file, "documents");
            }
            catch (ArgumentException ex)
            {
                return Fail(ex.Message);
            }

            var record = new DocumentRecord
            {
                Uploaded = true,
                FilePath = path,
                UploadedAt = DateTime.UtcNow,
            };

            switch (key)
            {
                case "residence": user.Onboarding.Residence = record; break;
                case "income":    user.Onboarding.Income    = record; break;
                case "tax":       user.Onboarding.Tax       = record; break;
                case "license":   user.Onboarding.License   = record; break;
            }

            await _userManager.UpdateAsync(user);
            await PromotePhaseIfCompleteAsync(user);

            _audit.Record($"document_upload_{key}", user.Email!, true);
            return Ok("Document uploaded", new { type = key, filePath = path });
        }
    }
}
