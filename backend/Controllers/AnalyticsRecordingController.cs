using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApp.Models.Dtos;
using WebApp.Services.Interface;

namespace WebApp.Controllers
{
    [ApiController]
    [AllowAnonymous]
    [Route("api/service-provider/analytics")]
    public class AnalyticsRecordingController(
        IAnalyticsRecordingService recording,
        IConfiguration config,
        ILogger<AnalyticsRecordingController> logger) : ControllerBase
    {
        [HttpPost("impression")]
        [AllowAnonymous]
        public async Task<IActionResult> RecordImpression([FromBody] ImpressionRequest request, CancellationToken ct)
        {
            // Validation
            if (string.IsNullOrWhiteSpace(request?.ListingId))
                return BadRequest();

            var sessionKey = ComputeSessionKey(Request);
            var viewerProviderId = TryGetViewerProviderId();

            await recording.RecordImpressionAsync(request.ListingId, sessionKey, viewerProviderId, ct);
            return NoContent();
        }

        [HttpPost("click")]
        [AllowAnonymous]
        public async Task<IActionResult> RecordClick([FromBody] ClickRequest request, CancellationToken ct)
        {
            // Validation
            if (string.IsNullOrWhiteSpace(request?.ListingId))
                return BadRequest();

            var sessionKey = ComputeSessionKey(Request);
            var viewerProviderId = TryGetViewerProviderId();

            await recording.RecordClickAsync(request.ListingId, sessionKey, request.Target, viewerProviderId, ct);
            return NoContent();
        }

        private string ComputeSessionKey(HttpRequest req)
        {
            var salt = config["Analytics:SessionHashSalt"] ?? "dev-fallback-salt";
            var ip = req.Headers["X-Forwarded-For"].FirstOrDefault()
                ?? req.HttpContext.Connection.RemoteIpAddress?.ToString()
                ?? "unknown";
            var ua = req.Headers["User-Agent"].FirstOrDefault() ?? "unknown";
            var raw = $"{salt}|{ip}|{ua}";

            using var sha = SHA256.Create();
            var hash = sha.ComputeHash(Encoding.UTF8.GetBytes(raw));
            return Convert.ToHexString(hash);
        }

        private string? TryGetViewerProviderId()
        {
            // Return the ProviderId claim if the user is authenticated, else null.
            // Public visitors (unauthenticated) will have null and won't be dropped.
            if (User?.Identity?.IsAuthenticated == true)
                return User.FindFirst("providerId")?.Value
                    ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return null;
        }
    }
}
