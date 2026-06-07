using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using System.Security.Claims;
using WebApp.Services.Interface;

namespace WebApp.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _service;

        public NotificationController(INotificationService service)
        {
            _service = service;
        }

        // ASP.NET Core 8 JwtBearer remaps inbound "sub" → ClaimTypes.NameIdentifier
        // by default. Looking up the short name returns null.
        private Guid CurrentUserId =>
            Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? throw new UnauthorizedAccessException());

        [HttpGet]
        public async Task<IActionResult> GetNotifications(int skip = 0, int limit = 30)
        {
            var data = await _service.GetUserNotifications(CurrentUserId, skip, limit);
            return Ok(data);
        }


        [HttpPost("read/{id}")]
        public async Task<IActionResult> MarkAsRead(string id)
        {
            // Defensive parse: a malformed id is treated as "not found" (no
            // enumeration signal) rather than surfacing a 500. Previously
            // ObjectId.Parse threw a FormatException on any non-24-hex id.
            if (!ObjectId.TryParse(id, out var objectId))
                return NotFound();

            // Ownership is enforced atomically in the repository — the Mongo
            // update filter requires both Id AND UserId to match. A foreign
            // notification id results in zero matches, returning 404 (no
            // enumeration signal).
            var updated = await _service.MarkAsRead(objectId, CurrentUserId);
            if (!updated) return NotFound();
            return Ok();
        }
    }
}
