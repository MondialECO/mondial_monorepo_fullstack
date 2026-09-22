using System;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Interface;

namespace WebApp.Controllers
{
    [Route("api/creator/dashboard")]
    [ApiController]
    [Authorize]
    public class CreatorDashboardController : ControllerBase
    {
        private readonly ICreatorDashboardService _dashboardService;
        private readonly UserManager<ApplicationUser> _userManager;

        public CreatorDashboardController(
            ICreatorDashboardService dashboardService,
            UserManager<ApplicationUser> userManager)
        {
            _dashboardService = dashboardService ?? throw new ArgumentNullException(nameof(dashboardService));
            _userManager = userManager ?? throw new ArgumentNullException(nameof(userManager));
        }

        private string GetUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? throw new UnauthorizedAccessException("User not authenticated");
        }

        /// <summary>
        /// GET /api/creator/dashboard/summary
        /// Canonical aggregated dashboard command center summary.
        /// Authenticated, owner-scoped, reads canonical backend authorities.
        /// </summary>
        [HttpGet("summary")]
        public async Task<ActionResult<CreatorDashboardSummaryDto>> GetSummary([FromQuery] string? ideaId = null, CancellationToken ct = default)
        {
            var userId = GetUserId();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return Unauthorized(new { message = "User not found." });
            }

            var roles = await _userManager.GetRolesAsync(user);
            bool isCreator = roles.Contains("Creator", StringComparer.OrdinalIgnoreCase)
                          || User.IsInRole("Creator");

            bool isAdmin = User.IsInRole("Admin") || User.IsInRole("SuperAdmin");
            if (!isCreator && !isAdmin)
            {
                return Forbid();
            }

            var summary = await _dashboardService.GetSummaryAsync(userId, ideaId, ct);
            return Ok(summary);
        }
    }
}
