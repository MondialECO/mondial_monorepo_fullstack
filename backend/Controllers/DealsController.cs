using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services;

namespace WebApp.Controllers
{
    // Bilateral deal router (Phase D). For now exposes only the participant-
    // scoped list read; write actions land in Phase D-3.
    [Authorize]
    [Route("api/deals")]
    [ApiController]
    public class DealsController : ControllerBase
    {
        private readonly ICompanyService _companyService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<DealsController> _logger;

        public DealsController(
            ICompanyService companyService,
            UserManager<ApplicationUser> userManager,
            ILogger<DealsController> logger)
        {
            _companyService = companyService;
            _userManager = userManager;
            _logger = logger;
        }

        private string GetUserId() =>
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? throw new UnauthorizedAccessException();

        // Deals the caller participates in, by either role: founder (via their
        // owned company) or investor (via their catalogue InvestorId). Returns
        // only the caller's own deals — never another participant's.
        [HttpGet]
        public async Task<ActionResult<List<DealStatusResponse>>> GetMyDeals()
        {
            try
            {
                var userId = GetUserId();
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null || (user.Onboarding?.Phase ?? 0) < 1)
                    return StatusCode(403, new { error = "Universal Phase 1 must be complete." });

                var company = await _companyService.GetCompanyByUserIdAsync(userId);
                var investorId = user.InvestorProfile?.InvestorId;

                var result = await _companyService.GetDealsForParticipantAsync(company?.Id, investorId);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error listing participant deals");
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}
