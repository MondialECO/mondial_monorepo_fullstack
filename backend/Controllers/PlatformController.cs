using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApp.Models;
using WebApp.Services.Interface;

namespace WebApp.Controllers
{
    [ApiController]
    [Route("api/platform")]
    [AllowAnonymous]
    public class PlatformController : ControllerBase
    {
        private readonly IPlatformSettingsService _settingsService;

        public PlatformController(IPlatformSettingsService settingsService)
        {
            _settingsService = settingsService;
        }

        /// <summary>
        /// Public read-only endpoint returning safe platform feature flags and maintenance banner.
        /// </summary>
        [HttpGet("settings")]
        public async Task<IActionResult> GetPublicSettings()
        {
            var settings = await _settingsService.GetPublicSettingsDtoAsync();
            return Ok(ApiResponse.Ok("Platform settings retrieved.", settings));
        }
    }
}
