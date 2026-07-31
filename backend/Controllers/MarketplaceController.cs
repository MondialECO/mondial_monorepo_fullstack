using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApp.Models;
using WebApp.Models.Dtos;
using WebApp.Services.Interface;

namespace WebApp.Controllers
{
    [ApiController]
    [Route("api/marketplace/services")]
    [Authorize]
    public class MarketplaceController : ControllerBase
    {
        private readonly IMarketplaceService _service;

        public MarketplaceController(IMarketplaceService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetListings(
            [FromQuery] MarketplaceListingsQuery query,
            CancellationToken ct)
        {
            var result = await _service.GetPublishedListingsAsync(query, ct);
            return Map(result);
        }

        [HttpGet("{listingId}")]
        public async Task<IActionResult> GetListingDetail(
            [FromRoute] string listingId,
            CancellationToken ct)
        {
            var result = await _service.GetListingDetailAsync(listingId, ct);
            return Map(result);
        }

        private IActionResult Map<T>(ServiceProviderResult<T> result) => result.Outcome switch
        {
            ServiceProviderOutcome.Ok => Ok(ApiResponse.Ok(result.Message, result.Value)),
            ServiceProviderOutcome.NotFound => NotFound(ApiResponse.Error(result.Message, HttpContext.TraceIdentifier)),
            ServiceProviderOutcome.Conflict => Conflict(ApiResponse.Error(result.Message, HttpContext.TraceIdentifier)),
            _ => StatusCode(500, ApiResponse.Error("Unexpected error.", HttpContext.TraceIdentifier)),
        };
    }
}
