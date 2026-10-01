using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApp.Models.Dtos.Ai;
using WebApp.Services.Ai;

namespace WebApp.Controllers
{
    [ApiController]
    [Route("api/ai/credits")]
    public class AiCreditPurchaseController : ControllerBase
    {
        private readonly IAiCreditPurchaseService _purchaseService;
        private readonly ILogger<AiCreditPurchaseController> _logger;

        public AiCreditPurchaseController(
            IAiCreditPurchaseService purchaseService,
            ILogger<AiCreditPurchaseController> logger)
        {
            _purchaseService = purchaseService;
            _logger = logger;
        }

        /// <summary>
        /// Returns all configured, purchasable credit packs.
        /// Unconfigured/unpriced packages are excluded automatically.
        /// </summary>
        [Authorize(Roles = "Creator,Entrepreneur")]
        [HttpGet("packages")]
        public IActionResult GetPackages()
        {
            var packages = _purchaseService.GetAvailablePackages();
            return Ok(packages);
        }

        /// <summary>
        /// Creates a Stripe Hosted Checkout Session for the requested package.
        /// Server resolves credit quantity, price, and currency authoritatively.
        /// </summary>
        [Authorize(Roles = "Creator,Entrepreneur")]
        [HttpPost("checkout")]
        public async Task<IActionResult> CreateCheckout([FromBody] CreateCheckoutRequestDto request, CancellationToken ct)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized(new { message = "User is not authenticated." });

            if (request == null || string.IsNullOrWhiteSpace(request.PackageId))
                return BadRequest(new { message = "packageId is required." });

            var baseUrl = $"{Request.Scheme}://{Request.Host}";

            try
            {
                var result = await _purchaseService.CreateCheckoutAsync(userId, request.PackageId, baseUrl, ct);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error creating checkout session for user {UserId}.", userId);
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Failed to initialize checkout session." });
            }
        }

        /// <summary>
        /// Returns simple purchase history for the authenticated user, newest first.
        /// </summary>
        [Authorize(Roles = "Creator,Entrepreneur")]
        [HttpGet("purchases")]
        public async Task<IActionResult> GetPurchases(CancellationToken ct)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized(new { message = "User is not authenticated." });

            var purchases = await _purchaseService.GetPurchasesForUserAsync(userId, ct);
            return Ok(purchases);
        }

        /// <summary>
        /// Unauthenticated Stripe webhook endpoint. Validates Stripe-Signature header
        /// against the raw stream body and idempotently fulfills verified purchases.
        /// </summary>
        [AllowAnonymous]
        [HttpPost("webhook/stripe")]
        public async Task<IActionResult> StripeWebhook(CancellationToken ct)
        {
            string rawBody;
            using (var reader = new StreamReader(Request.Body))
            {
                rawBody = await reader.ReadToEndAsync(ct);
            }

            if (!Request.Headers.TryGetValue("Stripe-Signature", out var signatureValues) ||
                string.IsNullOrWhiteSpace(signatureValues.ToString()))
            {
                _logger.LogWarning("Stripe webhook request missing Stripe-Signature header.");
                return BadRequest(new { message = "Missing Stripe-Signature header." });
            }

            var signatureHeader = signatureValues.ToString();

            try
            {
                var success = await _purchaseService.ProcessWebhookAsync(rawBody, signatureHeader, ct);
                if (!success)
                {
                    return BadRequest(new { message = "Webhook signature verification or processing failed." });
                }

                return Ok(new { received = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing Stripe webhook.");
                // Return 500 so Stripe retries transient errors
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Webhook processing error." });
            }
        }
    }
}
