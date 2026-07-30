using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApp.Models;
using WebApp.Models.Dtos;
using WebApp.Services.Interface;

namespace WebApp.Controllers;

/// <summary>
/// Module 2 — Service Catalog (canon §6). Owner-scoped: every action targets the
/// authenticated user's own listings/packages/FAQs/capacity; the owner id comes from the
/// principal, never the body. Thin mapper over <see cref="IServiceCatalogService"/> onto the
/// shared <see cref="ApiResponse"/> envelope. No purchase/checkout/Proposal here (Module 3).
/// </summary>
[ApiController]
[Route("api/service-provider/catalog")]
[Authorize]
public class ServiceCatalogController : ControllerBase
{
    private readonly IServiceCatalogService _service;

    public ServiceCatalogController(IServiceCatalogService service)
    {
        _service = service;
    }

    private string CurrentUserId =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? throw new UnauthorizedAccessException();

    // ---- Listings ----

    [HttpGet("listings")]
    public async Task<IActionResult> GetListings() =>
        Map(await _service.GetListingsAsync(CurrentUserId));

    [HttpGet("listings/{id}")]
    public async Task<IActionResult> GetListing(string id) =>
        Map(await _service.GetListingAsync(CurrentUserId, id));

    [HttpPost("listings")]
    public async Task<IActionResult> CreateListing([FromBody] UpsertServiceListingRequest request) =>
        Map(await _service.CreateListingAsync(CurrentUserId, request));

    [HttpPut("listings/{id}")]
    public async Task<IActionResult> UpdateListing(string id, [FromBody] UpsertServiceListingRequest request) =>
        Map(await _service.UpdateListingAsync(CurrentUserId, id, request));

    [HttpPost("listings/{id}/publish")]
    public async Task<IActionResult> PublishListing(string id) =>
        Map(await _service.PublishListingAsync(CurrentUserId, id));

    [HttpPost("listings/{id}/unpublish")]
    public async Task<IActionResult> UnpublishListing(string id) =>
        Map(await _service.UnpublishListingAsync(CurrentUserId, id));

    // ---- Packages ----

    [HttpPost("listings/{listingId}/packages")]
    public async Task<IActionResult> AddPackage(string listingId, [FromBody] UpsertServicePackageRequest request) =>
        Map(await _service.AddPackageAsync(CurrentUserId, listingId, request));

    [HttpPut("packages/{id}")]
    public async Task<IActionResult> UpdatePackage(string id, [FromBody] UpsertServicePackageRequest request) =>
        Map(await _service.UpdatePackageAsync(CurrentUserId, id, request));

    [HttpPost("packages/{id}/publish")]
    public async Task<IActionResult> PublishPackage(string id, [FromBody] PublishPackageRequest request) =>
        Map(await _service.PublishPackageAsync(CurrentUserId, id, request ?? new PublishPackageRequest()));

    [HttpPost("packages/{id}/unpublish")]
    public async Task<IActionResult> UnpublishPackage(string id) =>
        Map(await _service.UnpublishPackageAsync(CurrentUserId, id));

    // ---- FAQs ----

    [HttpPost("listings/{listingId}/faqs")]
    public async Task<IActionResult> AddFaq(string listingId, [FromBody] UpsertServiceFaqRequest request) =>
        Map(await _service.AddFaqAsync(CurrentUserId, listingId, request));

    [HttpPut("faqs/{id}")]
    public async Task<IActionResult> UpdateFaq(string id, [FromBody] UpsertServiceFaqRequest request) =>
        Map(await _service.UpdateFaqAsync(CurrentUserId, id, request));

    [HttpPost("faqs/{id}/duplicate")]
    public async Task<IActionResult> DuplicateFaq(string id) =>
        Map(await _service.DuplicateFaqAsync(CurrentUserId, id));

    [HttpPost("faqs/{id}/publish")]
    public async Task<IActionResult> PublishFaq(string id) =>
        Map(await _service.PublishFaqAsync(CurrentUserId, id));

    [HttpPost("faqs/{id}/unpublish")]
    public async Task<IActionResult> UnpublishFaq(string id) =>
        Map(await _service.UnpublishFaqAsync(CurrentUserId, id));

    [HttpDelete("faqs/{id}")]
    public async Task<IActionResult> DeleteFaq(string id) =>
        Map(await _service.DeleteFaqAsync(CurrentUserId, id));

    [HttpPut("listings/{listingId}/faqs/reorder")]
    public async Task<IActionResult> ReorderFaqs(string listingId, [FromBody] ReorderFaqsRequest request) =>
        Map(await _service.ReorderFaqsAsync(CurrentUserId, listingId, request));

    // ---- Gallery & Video (Service Listing media) ----

    [HttpPost("listings/{listingId}/gallery-images")]
    public async Task<IActionResult> UploadGalleryImage(string listingId, IFormFile file) =>
        Map(await _service.UploadGalleryImageAsync(CurrentUserId, listingId, file));

    [HttpDelete("listings/{listingId}/gallery-images/{imageId}")]
    public async Task<IActionResult> DeleteGalleryImage(string listingId, string imageId) =>
        Map(await _service.DeleteGalleryImageAsync(CurrentUserId, listingId, imageId));

    [HttpPost("listings/{listingId}/preview-video")]
    public async Task<IActionResult> UploadPreviewVideo(string listingId, IFormFile file) =>
        Map(await _service.UploadPreviewVideoAsync(CurrentUserId, listingId, file));

    [HttpDelete("listings/{listingId}/preview-video")]
    public async Task<IActionResult> DeletePreviewVideo(string listingId) =>
        Map(await _service.DeletePreviewVideoAsync(CurrentUserId, listingId));

    // ---- Provider capacity ----

    [HttpGet("capacity")]
    public async Task<IActionResult> GetCapacity() =>
        Map(await _service.GetCapacityAsync(CurrentUserId));

    [HttpPut("capacity")]
    public async Task<IActionResult> UpdateCapacity([FromBody] UpdateProviderCapacityRequest request) =>
        Map(await _service.UpdateCapacityAsync(CurrentUserId, request));

    // ---- Pricing guidance (deterministic, no AI) ----

    [HttpGet("pricing-guidance")]
    public IActionResult GetPricingGuidance([FromQuery] string category, [FromQuery] string pricingModel) =>
        Map(_service.GetPricingGuidance(category, pricingModel));

    // ---- Service Type / Sub-Category lookup (cascading dropdown) ----

    [HttpGet("service-types")]
    [AllowAnonymous]
    public IActionResult GetServiceTypes()
    {
        // Return all approved Service Types (Sub-Categories) per Category as a flat structure
        // for frontend cascading dropdown. "Other" has no fixed list (free text allowed).
        var all = ServiceCategoryHelper.AllCategories().ToDictionary(
            cat => cat.ToString(),
            cat => ServiceTypeLookup.GetSubCategories(cat)
        );
        return Ok(ApiResponse.Ok(data: all));
    }

    /// <summary>Map a service result onto the shared ApiResponse envelope and HTTP status.</summary>
    private IActionResult Map<T>(ServiceProviderResult<T> result) => result.Outcome switch
    {
        ServiceProviderOutcome.Ok => Ok(ApiResponse.Ok(result.Message, result.Value)),
        ServiceProviderOutcome.NotFound => NotFound(ApiResponse.Error(result.Message, HttpContext.TraceIdentifier)),
        ServiceProviderOutcome.Conflict => Conflict(ApiResponse.Error(result.Message, HttpContext.TraceIdentifier)),
        _ => StatusCode(500, ApiResponse.Error("Unexpected error.", HttpContext.TraceIdentifier)),
    };
}
