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
using WebApp.Services.Interface;

namespace WebApp.Controllers
{
    /// <summary>
    /// Phase 1 universal onboarding. Hub-and-spoke flow per Figma design:
    /// 4 mandatory verification items (Identity, Face, Phone, Email).
    /// Supplementary documents can still be uploaded, but they do not block
    /// the universal Phase 1 gate.
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
        private readonly SumsubService? _sumsub;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<OnboardingController> _logger;
        private readonly SaveFile _fileService;
        private readonly WebApp.Services.Audit.IAuditLogger _audit;
        private readonly IIdentityVerificationService? _identityService;

        public OnboardingController(
            UserManager<ApplicationUser> userManager,
            TwilioService twilio,
            EmailService emailService,
            IConfiguration configuration,
            IWebHostEnvironment env,
            SumsubService sumsub,
            ILogger<OnboardingController> logger,
            SaveFile fileService,
            WebApp.Services.Audit.IAuditLogger audit,
            IIdentityVerificationService? identityService = null)
        {
            _userManager = userManager;
            _twilio = twilio;
            _emailService = emailService;
            _configuration = configuration;
            _env = env;
            _logger = logger;
            _fileService = fileService;
            _sumsub = sumsub;
            _audit = audit;
            _identityService = identityService;
        }

        // ----- Constants and helpers --------------------------------------

        /// <summary>Optional supplementary documents kept outside the universal Phase 1 gate.</summary>
        private static readonly string[] AllSupplementary =
            { "residence", "income", "tax", "license" };

        /// <summary>Required item set for universal Phase 1. Delegates to the shared gate.</summary>
        private static HashSet<string> RequiredItemsFor(string role)
            => OnboardingGate.RequiredItemsFor(role);

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
            => OnboardingGate.IsItemVerified(user, key);

        private Task PromotePhaseIfCompleteAsync(ApplicationUser user)
            => OnboardingGate.PromoteIfCompleteAsync(user, _userManager, _audit);

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

            var identityStatus = _identityService != null
                ? await _identityService.GetCurrentStatusAsync(user.Id.ToString())
                : null;

            var identityVerified = IsItemVerified(user, "identity");
            var identityDisplayStatus = identityStatus?.Status
                ?? (identityVerified ? "verified" : (string.IsNullOrEmpty(user.Onboarding?.IdentityFrontImagePath) ? "not_started" : "submitted"));

            object IdentityItemView() => new
            {
                key = "identity",
                verified = identityVerified,
                required = required.Contains("identity"),
                status = identityDisplayStatus,
                documentType = identityStatus?.DocumentType ?? user.Onboarding?.IdentityDocumentType,
                reviewReason = identityStatus?.ReviewReason ?? user.Kyc?.Identity?.RejectionReason
            };

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
                    identity  = IdentityItemView(),
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

            var smsEnabled = _configuration.GetValue("Twilio:Enabled", false);
            var smsConfigured =
                !string.IsNullOrWhiteSpace(_configuration["Twilio:AccountSid"]) &&
                !string.IsNullOrWhiteSpace(_configuration["Twilio:AuthToken"]) &&
                !string.IsNullOrWhiteSpace(_configuration["Twilio:FromNumber"]);
            if (smsEnabled && smsConfigured)
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
                _logger.LogWarning("[DEV] Twilio SMS disabled/unconfigured. OTP for {Phone}: {Code}", phone, code);
            }

            _audit.Record("otp_send", user.Email!, true, new { phone });
            return Ok("Verification code sent.");
        }

        public class VerifyCodeRequest { public string Code { get; set; } }

        [HttpPost("verify-otp")]
        [EnableRateLimiting("auth")]
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
        [EnableRateLimiting("auth")]
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
            // Don't promote here; promotion happens via the /complete endpoint

            _audit.Record(auditEvent, user.Email!, true);
            return Ok(isEmail ? "Email verified" : "Phone verified");
        }

        // ----- Identity + Face -------------------------------------------
        // Production KYC must be completed by a real provider callback. There
        // is intentionally no local endpoint that marks these items verified.

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
            // Don't promote here; promotion happens via the /complete endpoint

            _audit.Record($"document_upload_{key}", user.Email!, true);
            return Ok("Document uploaded", new { type = key, filePath = path });
        }

        // ----- Skip verification (mark as verified) -----

        [HttpPost("phone/skip")]
        public async Task<IActionResult> SkipPhoneVerification()
        {
            var isProduction = _env.IsProduction();
            var allowAlphaBypass = _configuration.GetValue<bool>("FeatureFlags:EnableAlphaBypassEndpoints", false);
            if (isProduction && !allowAlphaBypass)
            {
                var caller = (await CurrentUserAsync())?.Email ?? "unknown";
                _audit.Record("phone_skip_rejected_production", caller, false);
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    success = false,
                    message = "Phone verification skip endpoint is disabled in production environments."
                });
            }

            var user = await CurrentUserAsync();
            if (user == null) return Fail("User not found", 404);

            user.Onboarding.PhoneVerified = true;
            user.PhoneNumberConfirmed = true;
            await _userManager.UpdateAsync(user);
            // Don't promote here; promotion happens via the /complete endpoint

            _audit.Record("phone_skipped", user.Email!, true);
            return Ok("Phone verification skipped");
        }

        [HttpPost("complete")]
        public async Task<IActionResult> CompleteOnboarding()
        {
            var user = await CurrentUserAsync();
            if (user == null) return Fail("User not found", 404);

            try
            {
                // Validate all core items are verified before promoting
                var onboarding = user.Onboarding;
                if (onboarding == null ||
                    !onboarding.IdentityDocumentVerified ||
                    !onboarding.PhoneVerified ||
                    !onboarding.EmailOtpVerified)
                {
                    _audit.Record("onboarding_manual_complete", user.Email!, false, new { reason = "incomplete" });
                    return Fail("Not all verification steps are complete. Please complete all required steps before finalizing.");
                }

                await PromotePhaseIfCompleteAsync(user);

                _audit.Record("onboarding_manual_complete", user.Email!, true);
                return Ok("Onboarding completed");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to complete onboarding");
                _audit.Record("onboarding_manual_complete", user.Email!, false, new { reason = "error", error = ex.Message });
                return Fail("Failed to complete verification. Please try again.", 500);
            }
        }

        /// <summary>
        /// Legacy direct file upload fallback. Only active when FeatureFlags:AllowLegacyIdentityUpload = true.
        /// Upload does NOT verify identity. Verification requires provider webhook or manual admin approval.
        /// </summary>
        [HttpPost("identity/upload")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadIdentityDocuments([FromForm] string documentType, [FromForm] IFormFile frontPhoto, [FromForm] IFormFile? backPhoto = null)
        {
            var allowLegacy = _configuration.GetValue<bool>("FeatureFlags:AllowLegacyIdentityUpload", false);
            if (!allowLegacy)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    success = false,
                    message = "Direct document upload is disabled. Please use the secure identity verification flow."
                });
            }

            if (string.IsNullOrWhiteSpace(documentType))
                return Fail("Document type is required (passport, national_id, residence_permit)");
            if (frontPhoto == null || frontPhoto.Length == 0)
                return Fail("Front photo is required");
            
            var docType = documentType.ToLowerInvariant();
            var validTypes = new[] { "passport", "national_id", "residence_permit" };
            if (!validTypes.Contains(docType))
                return Fail($"Invalid document type. Expected one of: {string.Join(", ", validTypes)}");
            
            if (docType != "passport" && (backPhoto == null || backPhoto.Length == 0))
                return Fail("Back photo is required for " + docType);
            
            var user = await CurrentUserAsync();
            if (user == null) return Fail("User not found", 404);
            
            try
            {
                var frontPath = await _fileService.SaveFileAsync(frontPhoto, "identity/documents");
                var backPath = backPhoto != null && backPhoto.Length > 0
                    ? await _fileService.SaveFileAsync(backPhoto, "identity/documents")
                    : null;

                // Save document paths as submitted (UPLOADING DOES NOT VERIFY)
                user.Onboarding.IdentityDocumentType = docType;
                user.Onboarding.IdentityFrontImagePath = frontPath;
                user.Onboarding.IdentityBackImagePath = backPath;
                user.Onboarding.IdentityDocumentUploadedAt = DateTime.UtcNow;
                user.Onboarding.IdentityDocumentVerified = false;

                user.Kyc ??= new KycVerification();
                user.Kyc.Identity ??= new IdentityVerification();
                user.Kyc.Identity.DocumentType = docType;
                user.Kyc.Identity.FrontImage = frontPath;
                user.Kyc.Identity.BackImage = backPath;
                user.Kyc.Identity.SubmittedAt = DateTime.UtcNow;
                user.Kyc.Identity.Status = VerificationStatus.Pending;

                await _userManager.UpdateAsync(user);

                if (_identityService != null)
                {
                    await _identityService.RecordManualUploadAsync(user.Id.ToString(), docType, frontPath, backPath);
                }

                _audit.Record("identity_document_upload_submitted", user.Email!, true, new { documentType = docType });
                return Ok("Identity documents submitted for verification", new { documentType = docType, status = "submitted", frontPath, backPath });
            }
            catch (ArgumentException ex)
            {
                return Fail(ex.Message);
            }
        }

        /// <summary>
        /// DEPRECATED: Legacy Sumsub webhook endpoint.
        /// All new webhook processing routes through POST /api/identity/webhook/sumsub.
        /// This endpoint delegates to the canonical IdentityVerificationService for backward compatibility.
        /// </summary>
        [HttpPost("sumsub/webhook")]
        [AllowAnonymous]
        [Obsolete("Use POST /api/identity/webhook/sumsub as the canonical webhook endpoint.")]
        public async Task<IActionResult> HandleSumsubWebhook()
        {
            _logger.LogWarning("Deprecated webhook endpoint /api/onboarding/sumsub/webhook invoked. Configure provider to use /api/identity/webhook/sumsub instead.");

            try
            {
                Request.EnableBuffering();
                var requestBody = await new StreamReader(Request.Body, Encoding.UTF8, detectEncodingFromByteOrderMarks: false, leaveOpen: true).ReadToEndAsync();
                Request.Body.Position = 0;

                if (string.IsNullOrEmpty(requestBody))
                    return BadRequest("Empty body");

                var signature = Request.Headers["X-Payload-Digest"].ToString();
                if (string.IsNullOrEmpty(signature))
                    signature = Request.Headers["X-Sumsub-Signature"].ToString();

                if (string.IsNullOrWhiteSpace(signature))
                    return Unauthorized("Missing signature header");

                if (_identityService != null)
                {
                    var eventId = Request.Headers["X-Sumsub-Event-Id"].ToString();
                    var processed = await _identityService.ProcessProviderWebhookAsync(requestBody, signature, eventId);
                    if (!processed)
                        return Unauthorized("Invalid webhook signature or unprocessable payload");
                    return Ok();
                }

                // If identity service is unavailable, reject — no legacy standalone fallback in production
                _logger.LogError("Identity service not available for legacy webhook processing");
                return StatusCode(503, "Identity verification service unavailable");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing legacy Sumsub webhook");
                return StatusCode(500);
            }
        }
    }
}
