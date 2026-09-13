using System;
using System.IO;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using WebApp.Services.Interface;

namespace WebApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class IdentityController : ControllerBase
    {
        private readonly IIdentityVerificationService _identityService;
        private readonly ILogger<IdentityController> _logger;

        public IdentityController(
            IIdentityVerificationService identityService,
            ILogger<IdentityController> logger)
        {
            _identityService = identityService;
            _logger = logger;
        }

        private string? CurrentUserId()
        {
            return User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }

        /// <summary>
        /// Returns available identity documents for a given country (France-first MVP).
        /// </summary>
        [HttpGet("config")]
        [AllowAnonymous]
        public IActionResult GetConfig([FromQuery] string country = "FR")
        {
            var config = _identityService.GetIdentityConfig(country);
            return Ok(new { success = true, data = config });
        }

        /// <summary>
        /// Starts or resumes a secure identity verification session with Sumsub WebSDK.
        /// Authenticated user only.
        /// </summary>
        [HttpPost("session")]
        [Authorize]
        public async Task<IActionResult> StartSession([FromBody] StartSessionRequest request)
        {
            var userId = CurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { success = false, message = "User not authenticated" });

            if (request == null || string.IsNullOrWhiteSpace(request.DocumentType))
                return BadRequest(new { success = false, message = "Document type is required" });

            try
            {
                var session = await _identityService.CreateOrGetSessionAsync(
                    userId,
                    request.CountryCode ?? "FR",
                    request.DocumentType,
                    request.IssuingCountry,
                    request.Nationality);

                return Ok(new { success = true, data = session });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to start identity verification session for user {UserId}", userId);
                return StatusCode(500, new { success = false, message = "Failed to initialize identity verification session" });
            }
        }

        /// <summary>
        /// Gets current identity verification status, reason codes, and metadata.
        /// </summary>
        [HttpGet("status")]
        [Authorize]
        public async Task<IActionResult> GetStatus()
        {
            var userId = CurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { success = false, message = "User not authenticated" });

            var status = await _identityService.GetCurrentStatusAsync(userId);
            return Ok(new { success = true, data = status });
        }

        /// <summary>
        /// Initiates a retry attempt after rejection, archiving previous attempts.
        /// </summary>
        [HttpPost("retry")]
        [Authorize]
        public async Task<IActionResult> Retry()
        {
            var userId = CurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { success = false, message = "User not authenticated" });

            var result = await _identityService.RetryVerificationAsync(userId);
            return Ok(new { success = result, message = "Identity verification reset for retry" });
        }

        /// <summary>
        /// Authoritative webhook ingress from Sumsub for identity document verification results.
        /// Validates HMAC-SHA256 signature against exact raw incoming request body.
        /// </summary>
        [HttpPost("webhook/sumsub")]
        [AllowAnonymous]
        public async Task<IActionResult> HandleSumsubWebhook()
        {
            try
            {
                Request.EnableBuffering();
                using var reader = new StreamReader(Request.Body, Encoding.UTF8, detectEncodingFromByteOrderMarks: false, leaveOpen: true);
                var rawBody = await reader.ReadToEndAsync();
                Request.Body.Position = 0;

                if (string.IsNullOrWhiteSpace(rawBody))
                    return BadRequest(new { error = "Empty body" });

                // Sumsub header convention: X-Payload-Digest (or X-Sumsub-Signature)
                var signature = Request.Headers["X-Payload-Digest"].ToString();
                if (string.IsNullOrEmpty(signature))
                {
                    signature = Request.Headers["X-Sumsub-Signature"].ToString();
                }

                if (string.IsNullOrWhiteSpace(signature))
                {
                    _logger.LogWarning("Webhook received with missing signature header");
                    return Unauthorized(new { error = "Missing signature header" });
                }

                var eventId = Request.Headers["X-Sumsub-Event-Id"].ToString();

                var processed = await _identityService.ProcessProviderWebhookAsync(rawBody, signature, eventId);
                if (!processed)
                {
                    _logger.LogWarning("Webhook signature validation failed or unprocessable payload");
                    return Unauthorized(new { error = "Invalid signature or unprocessable payload" });
                }

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing identity webhook");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }
    }
}
