using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Audit;

namespace WebApp.Controllers
{
    [Authorize(Roles = "Admin,SuperAdmin")]
    [ApiController]
    [Route("api/admin/marketplace")]
    public class AdminMarketplaceController : ControllerBase
    {
        private readonly MongoDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IAuditLogger? _audit;

        public AdminMarketplaceController(
            MongoDbContext context,
            UserManager<ApplicationUser> userManager,
            IAuditLogger? audit = null)
        {
            _context = context;
            _userManager = userManager;
            _audit = audit;
        }

        private string CurrentAdminId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "admin";
        private string CurrentAdminEmail => User.FindFirstValue(ClaimTypes.Email) ?? "admin@mondial.com";

        // GET: api/admin/marketplace/summary
        [HttpGet("summary")]
        public async Task<IActionResult> GetMarketplaceSummary()
        {
            // Services metrics
            var totalServices = (int)await _context.ServiceListings.CountDocumentsAsync(_ => true);
            var publishedServices = (int)await _context.ServiceListings.CountDocumentsAsync(x => x.Status == CatalogStatus.Published && !x.IsModerationHidden);
            var hiddenServices = (int)await _context.ServiceListings.CountDocumentsAsync(x => x.IsModerationHidden);
            var draftServices = (int)await _context.ServiceListings.CountDocumentsAsync(x => x.Status == CatalogStatus.Draft);

            // Creator Offers metrics
            var allIdeas = await _context.CreatorIdeas.Find(x => x.Phase5Data != null && x.Phase5Data.PathA != null && x.Phase5Data.PathA.MarketplaceListing != null).ToListAsync();
            var totalCreatorOffers = allIdeas.Count;
            var publishedCreatorOffers = allIdeas.Count(x => (x.Phase5Data!.PathA!.MarketplaceListing.Status == "live" || x.Phase5Data!.PathA!.MarketplaceListing.Status == "available") && !x.Phase5Data!.PathA!.MarketplaceListing.IsModerationHidden);
            var hiddenCreatorOffers = allIdeas.Count(x => x.Phase5Data!.PathA!.MarketplaceListing.IsModerationHidden);
            var buyoutOffersCount = allIdeas.Count(x => x.Phase5Data!.PathA!.MarketplaceListing.DealModes != null && x.Phase5Data!.PathA!.MarketplaceListing.DealModes.Contains("full_buyout"));
            var equityOffersCount = allIdeas.Count(x => x.Phase5Data!.PathA!.MarketplaceListing.DealModes != null && (x.Phase5Data!.PathA!.MarketplaceListing.DealModes.Contains("equity_partnership") || x.Phase5Data!.PathA!.MarketplaceListing.DealModes.Contains("co_founder")));

            // Reviews metrics
            var totalReviews = (int)await _context.Reviews.CountDocumentsAsync(_ => true);
            var publicReviews = (int)await _context.Reviews.CountDocumentsAsync(x => x.Visibility == ReviewVisibility.Public && !x.IsModerationHidden);
            var hiddenReviews = (int)await _context.Reviews.CountDocumentsAsync(x => x.Visibility == ReviewVisibility.Private || x.IsModerationHidden);

            var allReviewsList = await _context.Reviews.Find(_ => true).ToListAsync();
            var avgRating = allReviewsList.Count > 0 ? (decimal)Math.Round(allReviewsList.Average(r => r.OverallRating), 1) : 0.0m;

            var summary = new AdminMarketplaceSummaryDto
            {
                TotalServices = totalServices,
                PublishedServices = publishedServices,
                HiddenServices = hiddenServices,
                DraftServices = draftServices,
                TotalCreatorOffers = totalCreatorOffers,
                PublishedCreatorOffers = publishedCreatorOffers,
                HiddenCreatorOffers = hiddenCreatorOffers,
                BuyoutOffersCount = buyoutOffersCount,
                EquityOffersCount = equityOffersCount,
                TotalReviews = totalReviews,
                PublicReviews = publicReviews,
                HiddenReviews = hiddenReviews,
                AverageRating = avgRating,
                OpenReportsCount = 0,
                ReportsSystemActive = false
            };

            return Ok(ApiResponse.Ok("Marketplace summary fetched.", summary));
        }

        // GET: api/admin/marketplace/services
        [HttpGet("services")]
        public async Task<IActionResult> GetServices(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 15,
            [FromQuery] string? search = null,
            [FromQuery] string? category = null,
            [FromQuery] string? status = null,
            [FromQuery] string? moderationStatus = null)
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 15;

            var filter = Builders<ServiceListing>.Filter.Empty;

            if (!string.IsNullOrWhiteSpace(search))
            {
                var pattern = new BsonRegularExpression(search.Trim(), "i");
                filter &= Builders<ServiceListing>.Filter.Or(
                    Builders<ServiceListing>.Filter.Regex(x => x.Title, pattern),
                    Builders<ServiceListing>.Filter.Regex(x => x.Description, pattern),
                    Builders<ServiceListing>.Filter.Regex(x => x.ProviderId, pattern)
                );
            }

            if (!string.IsNullOrWhiteSpace(category) && Enum.TryParse<ServiceCategory>(category, true, out var catEnum))
            {
                filter &= Builders<ServiceListing>.Filter.Eq(x => x.Category, catEnum);
            }

            if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<CatalogStatus>(status, true, out var statEnum))
            {
                filter &= Builders<ServiceListing>.Filter.Eq(x => x.Status, statEnum);
            }

            if (!string.IsNullOrWhiteSpace(moderationStatus))
            {
                if (moderationStatus.Equals("hidden", StringComparison.OrdinalIgnoreCase))
                {
                    filter &= Builders<ServiceListing>.Filter.Eq(x => x.IsModerationHidden, true);
                }
                else if (moderationStatus.Equals("visible", StringComparison.OrdinalIgnoreCase))
                {
                    filter &= Builders<ServiceListing>.Filter.Ne(x => x.IsModerationHidden, true);
                }
            }

            var totalCount = (int)await _context.ServiceListings.CountDocumentsAsync(filter);
            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            var listings = await _context.ServiceListings
                .Find(filter)
                .SortByDescending(x => x.UpdatedAt)
                .Skip((page - 1) * pageSize)
                .Limit(pageSize)
                .ToListAsync();

            var serviceIds = listings.Select(x => x.Id).ToList();
            var packages = await _context.ServicePackages.Find(x => serviceIds.Contains(x.ServiceId)).ToListAsync();
            var packagesByService = packages.GroupBy(p => p.ServiceId).ToDictionary(g => g.Key, g => g.ToList());

            var providerIds = listings.Select(x => x.ProviderId).Distinct().ToList();
            var users = await _context.ApplicationUsers.Find(u => providerIds.Contains(u.Id.ToString())).ToListAsync();
            var userMap = users.ToDictionary(u => u.Id.ToString());

            var items = listings.Select(l =>
            {
                userMap.TryGetValue(l.ProviderId, out var u);
                packagesByService.TryGetValue(l.Id, out var pkgs);
                pkgs ??= new List<ServicePackage>();
                var startPrice = pkgs.Count > 0 ? pkgs.Min(p => p.Price) : 0m;
                var currency = pkgs.FirstOrDefault()?.Currency ?? "EUR";

                return new AdminServiceModerationListItemDto
                {
                    Id = l.Id,
                    ProviderId = l.ProviderId,
                    ProviderName = u?.Name ?? "Service Provider",
                    ProviderEmail = u?.Email ?? string.Empty,
                    Title = l.Title,
                    Description = l.Description,
                    Category = l.Category.ToString(),
                    ServiceType = l.ServiceType,
                    Status = l.Status.ToString(),
                    IsModerationHidden = l.IsModerationHidden,
                    ModerationReason = l.ModerationReason,
                    ModeratedBy = l.ModeratedByAdminId,
                    ModeratedAt = l.ModeratedAt,
                    PackagesCount = pkgs.Count,
                    StartingPrice = startPrice,
                    Currency = currency,
                    CreatedAt = l.CreatedAt,
                    UpdatedAt = l.UpdatedAt
                };
            }).ToList();

            var result = new
            {
                items,
                totalCount,
                page,
                pageSize,
                totalPages
            };

            return Ok(ApiResponse.Ok("Services fetched.", result));
        }

        // GET: api/admin/marketplace/services/{id}
        [HttpGet("services/{id}")]
        public async Task<IActionResult> GetServiceDetail(string id)
        {
            var listing = await _context.ServiceListings.Find(x => x.Id == id).FirstOrDefaultAsync();
            if (listing == null)
                return NotFound(ApiResponse.Error("Service listing not found.", HttpContext.TraceIdentifier));

            var user = await _userManager.FindByIdAsync(listing.ProviderId);
            var packages = await _context.ServicePackages.Find(x => x.ServiceId == id).ToListAsync();
            var faqs = await _context.ServiceFAQs.Find(x => x.ServiceId == id).SortBy(x => x.DisplayOrder).ToListAsync();
            var reviews = await _context.Reviews.Find(x => x.ProviderId == listing.ProviderId).ToListAsync();

            var startPrice = packages.Count > 0 ? packages.Min(p => p.Price) : 0m;
            var currency = packages.FirstOrDefault()?.Currency ?? "EUR";
            var avgRating = reviews.Count > 0 ? (decimal)Math.Round(reviews.Average(r => r.OverallRating), 1) : 0.0m;

            var detail = new AdminServiceDetailDto
            {
                Id = listing.Id,
                ProviderId = listing.ProviderId,
                ProviderName = user?.Name ?? "Service Provider",
                ProviderEmail = user?.Email ?? string.Empty,
                Title = listing.Title,
                Description = listing.Description,
                Category = listing.Category.ToString(),
                ServiceType = listing.ServiceType,
                Status = listing.Status.ToString(),
                IsModerationHidden = listing.IsModerationHidden,
                ModerationReason = listing.ModerationReason,
                ModeratedBy = listing.ModeratedByAdminId,
                ModeratedAt = listing.ModeratedAt,
                PackagesCount = packages.Count,
                StartingPrice = startPrice,
                Currency = currency,
                CreatedAt = listing.CreatedAt,
                UpdatedAt = listing.UpdatedAt,
                Packages = packages,
                Faqs = faqs,
                GalleryImages = listing.GalleryImages ?? new List<GalleryImage>(),
                PreviewVideo = listing.PreviewVideo,
                ReviewsCount = reviews.Count,
                AverageRating = avgRating
            };

            return Ok(ApiResponse.Ok("Service detail fetched.", detail));
        }

        // POST: api/admin/marketplace/services/{id}/moderate
        [HttpPost("services/{id}/moderate")]
        public async Task<IActionResult> ModerateService(string id, [FromBody] AdminModerationActionRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Action))
                return BadRequest(ApiResponse.Error("Action ('hide' or 'restore') is required.", HttpContext.TraceIdentifier));

            var action = request.Action.Trim().ToLowerInvariant();
            var listing = await _context.ServiceListings.Find(x => x.Id == id).FirstOrDefaultAsync();
            if (listing == null)
                return NotFound(ApiResponse.Error("Service listing not found.", HttpContext.TraceIdentifier));

            if (action == "hide")
            {
                if (listing.IsModerationHidden)
                    return Conflict(ApiResponse.Error("Service listing is already hidden by moderation.", HttpContext.TraceIdentifier));

                if (string.IsNullOrWhiteSpace(request.Reason))
                    return BadRequest(ApiResponse.Error("A reason is mandatory when hiding a service.", HttpContext.TraceIdentifier));

                var filter = Builders<ServiceListing>.Filter.And(
                    Builders<ServiceListing>.Filter.Eq(x => x.Id, id),
                    Builders<ServiceListing>.Filter.Ne(x => x.IsModerationHidden, true)
                );

                var now = DateTime.UtcNow;
                var update = Builders<ServiceListing>.Update
                    .Set(x => x.IsModerationHidden, true)
                    .Set(x => x.ModerationReason, request.Reason.Trim())
                    .Set(x => x.ModeratedByAdminId, CurrentAdminEmail)
                    .Set(x => x.ModeratedAt, now)
                    .Set(x => x.UpdatedAt, now);

                var updated = await _context.ServiceListings.FindOneAndUpdateAsync(
                    filter,
                    update,
                    new FindOneAndUpdateOptions<ServiceListing> { ReturnDocument = ReturnDocument.After }
                );

                if (updated == null)
                    return Conflict(ApiResponse.Error("Service listing moderation state conflict. Please refresh.", HttpContext.TraceIdentifier));

                _audit?.Record("admin_service_hidden", CurrentAdminEmail, true, new { serviceId = id, listing.ProviderId, reason = request.Reason });

                return Ok(ApiResponse.Ok("Service has been hidden from public marketplace.", updated));
            }
            else if (action == "restore")
            {
                if (!listing.IsModerationHidden)
                    return Conflict(ApiResponse.Error("Service listing is already visible.", HttpContext.TraceIdentifier));

                var filter = Builders<ServiceListing>.Filter.And(
                    Builders<ServiceListing>.Filter.Eq(x => x.Id, id),
                    Builders<ServiceListing>.Filter.Eq(x => x.IsModerationHidden, true)
                );

                var now = DateTime.UtcNow;
                var update = Builders<ServiceListing>.Update
                    .Set(x => x.IsModerationHidden, false)
                    .Set(x => x.ModerationReason, null)
                    .Set(x => x.ModeratedByAdminId, CurrentAdminEmail)
                    .Set(x => x.ModeratedAt, now)
                    .Set(x => x.UpdatedAt, now);

                var updated = await _context.ServiceListings.FindOneAndUpdateAsync(
                    filter,
                    update,
                    new FindOneAndUpdateOptions<ServiceListing> { ReturnDocument = ReturnDocument.After }
                );

                if (updated == null)
                    return Conflict(ApiResponse.Error("Service listing moderation state conflict. Please refresh.", HttpContext.TraceIdentifier));

                _audit?.Record("admin_service_restored", CurrentAdminEmail, true, new { serviceId = id, listing.ProviderId });

                return Ok(ApiResponse.Ok("Service listing has been restored to public marketplace.", updated));
            }
            else
            {
                return BadRequest(ApiResponse.Error("Invalid action. Supported: 'hide', 'restore'.", HttpContext.TraceIdentifier));
            }
        }

        // GET: api/admin/marketplace/creator-offers
        [HttpGet("creator-offers")]
        public async Task<IActionResult> GetCreatorOffers(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 15,
            [FromQuery] string? search = null,
            [FromQuery] string? dealMode = null,
            [FromQuery] string? moderationStatus = null)
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 15;

            var filter = Builders<CreatorIdea>.Filter.And(
                Builders<CreatorIdea>.Filter.Ne(x => x.Phase5Data, null),
                Builders<CreatorIdea>.Filter.Ne("Phase5Data.PathA.MarketplaceListing", BsonNull.Value)
            );

            if (!string.IsNullOrWhiteSpace(search))
            {
                var pattern = new BsonRegularExpression(search.Trim(), "i");
                filter &= Builders<CreatorIdea>.Filter.Or(
                    Builders<CreatorIdea>.Filter.Regex("Project.Name", pattern),
                    Builders<CreatorIdea>.Filter.Regex("Project.Tagline", pattern),
                    Builders<CreatorIdea>.Filter.Regex("Project.Sector", pattern),
                    Builders<CreatorIdea>.Filter.Regex("UserId", pattern)
                );
            }

            if (!string.IsNullOrWhiteSpace(dealMode))
            {
                filter &= Builders<CreatorIdea>.Filter.AnyEq("Phase5Data.PathA.MarketplaceListing.DealModes", dealMode);
            }

            if (!string.IsNullOrWhiteSpace(moderationStatus))
            {
                if (moderationStatus.Equals("hidden", StringComparison.OrdinalIgnoreCase))
                {
                    filter &= Builders<CreatorIdea>.Filter.Eq("Phase5Data.PathA.MarketplaceListing.IsModerationHidden", true);
                }
                else if (moderationStatus.Equals("visible", StringComparison.OrdinalIgnoreCase))
                {
                    filter &= Builders<CreatorIdea>.Filter.Ne("Phase5Data.PathA.MarketplaceListing.IsModerationHidden", true);
                }
            }

            var totalCount = (int)await _context.CreatorIdeas.CountDocumentsAsync(filter);
            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            var ideas = await _context.CreatorIdeas
                .Find(filter)
                .SortByDescending(x => x.UpdatedAt)
                .Skip((page - 1) * pageSize)
                .Limit(pageSize)
                .ToListAsync();

            var userIds = ideas.Select(x => x.UserId).Distinct().ToList();
            var users = await _context.ApplicationUsers.Find(u => userIds.Contains(u.Id.ToString())).ToListAsync();
            var userMap = users.ToDictionary(u => u.Id.ToString());

            var items = ideas.Select(idea =>
            {
                userMap.TryGetValue(idea.UserId, out var u);
                var listing = idea.Phase5Data?.PathA?.MarketplaceListing ?? new CreatorMarketplaceListing();
                var project = idea.Project ?? new CreatorJourneyProject();

                return new AdminCreatorOfferListItemDto
                {
                    IdeaId = idea.Id,
                    Title = project.Name ?? "Untitled Project",
                    Description = project.Tagline ?? project.Problem ?? string.Empty,
                    CreatorId = idea.UserId,
                    CreatorName = u?.Name ?? "Creator",
                    CreatorEmail = u?.Email ?? string.Empty,
                    Sector = project.Sector ?? "General",
                    Status = listing.Status ?? "draft",
                    SaleType = listing.SaleType ?? "full_buyout",
                    DealModes = listing.DealModes ?? new List<string>(),
                    AskingPrice = listing.AskingPrice,
                    Audience = listing.Audience ?? "public",
                    NdaRequired = listing.NdaRequired,
                    IsModerationHidden = listing.IsModerationHidden,
                    ModerationReason = listing.ModerationReason,
                    ModeratedBy = listing.ModeratedByAdminId,
                    ModeratedAt = listing.ModeratedAt,
                    PublishedAt = listing.PublishedAt,
                    UpdatedAt = listing.UpdatedAt ?? idea.UpdatedAt
                };
            }).ToList();

            var result = new
            {
                items,
                totalCount,
                page,
                pageSize,
                totalPages
            };

            return Ok(ApiResponse.Ok("Creator offers fetched.", result));
        }

        // GET: api/admin/marketplace/creator-offers/{ideaId}
        [HttpGet("creator-offers/{ideaId}")]
        public async Task<IActionResult> GetCreatorOfferDetail(string ideaId)
        {
            var idea = await _context.CreatorIdeas.Find(x => x.Id == ideaId).FirstOrDefaultAsync();
            if (idea == null)
                return NotFound(ApiResponse.Error("Creator project offer not found.", HttpContext.TraceIdentifier));

            var user = await _userManager.FindByIdAsync(idea.UserId);
            var listing = idea.Phase5Data?.PathA?.MarketplaceListing ?? new CreatorMarketplaceListing();
            var project = idea.Project ?? new CreatorJourneyProject();

            var detail = new AdminCreatorOfferDetailDto
            {
                IdeaId = idea.Id,
                Title = project.Name ?? "Untitled Project",
                Description = project.Tagline ?? project.Problem ?? string.Empty,
                CreatorId = idea.UserId,
                CreatorName = user?.Name ?? "Creator",
                CreatorEmail = user?.Email ?? string.Empty,
                Sector = project.Sector ?? "General",
                Status = listing.Status ?? "draft",
                SaleType = listing.SaleType ?? "full_buyout",
                DealModes = listing.DealModes ?? new List<string>(),
                AskingPrice = listing.AskingPrice,
                Audience = listing.Audience ?? "public",
                NdaRequired = listing.NdaRequired,
                IsModerationHidden = listing.IsModerationHidden,
                ModerationReason = listing.ModerationReason,
                ModeratedBy = listing.ModeratedByAdminId,
                ModeratedAt = listing.ModeratedAt,
                PublishedAt = listing.PublishedAt,
                ValuationEstimate = 0,
                Stage = project.Category ?? "Idea",
                Tags = project.Tags ?? new List<string>()
            };

            return Ok(ApiResponse.Ok("Creator offer detail fetched.", detail));
        }

        // POST: api/admin/marketplace/creator-offers/{ideaId}/moderate
        [HttpPost("creator-offers/{ideaId}/moderate")]
        public async Task<IActionResult> ModerateCreatorOffer(string ideaId, [FromBody] AdminModerationActionRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Action))
                return BadRequest(ApiResponse.Error("Action ('hide' or 'restore') is required.", HttpContext.TraceIdentifier));

            var action = request.Action.Trim().ToLowerInvariant();
            var idea = await _context.CreatorIdeas.Find(x => x.Id == ideaId).FirstOrDefaultAsync();
            if (idea == null)
                return NotFound(ApiResponse.Error("Creator project not found.", HttpContext.TraceIdentifier));

            var listing = idea.Phase5Data?.PathA?.MarketplaceListing;
            if (listing == null)
                return BadRequest(ApiResponse.Error("Project does not have an active marketplace listing.", HttpContext.TraceIdentifier));

            var now = DateTime.UtcNow;

            if (action == "hide")
            {
                if (listing.IsModerationHidden)
                    return Conflict(ApiResponse.Error("Creator offer is already hidden by moderation.", HttpContext.TraceIdentifier));

                if (string.IsNullOrWhiteSpace(request.Reason))
                    return BadRequest(ApiResponse.Error("A reason is mandatory when hiding a creator offer.", HttpContext.TraceIdentifier));

                var filter = Builders<CreatorIdea>.Filter.And(
                    Builders<CreatorIdea>.Filter.Eq(x => x.Id, ideaId),
                    Builders<CreatorIdea>.Filter.Ne("Phase5Data.PathA.MarketplaceListing.IsModerationHidden", true)
                );

                var update = Builders<CreatorIdea>.Update
                    .Set("Phase5Data.PathA.MarketplaceListing.IsModerationHidden", true)
                    .Set("Phase5Data.PathA.MarketplaceListing.ModerationReason", request.Reason.Trim())
                    .Set("Phase5Data.PathA.MarketplaceListing.ModeratedByAdminId", CurrentAdminEmail)
                    .Set("Phase5Data.PathA.MarketplaceListing.ModeratedAt", now)
                    .Set("Phase5Data.PathA.MarketplaceListing.UpdatedAt", now)
                    .Set(x => x.UpdatedAt, now);

                var updated = await _context.CreatorIdeas.FindOneAndUpdateAsync(
                    filter,
                    update,
                    new FindOneAndUpdateOptions<CreatorIdea> { ReturnDocument = ReturnDocument.After }
                );

                if (updated == null)
                    return Conflict(ApiResponse.Error("Creator offer moderation conflict. Please refresh.", HttpContext.TraceIdentifier));

                _audit?.Record("admin_creator_offer_hidden", CurrentAdminEmail, true, new { ideaId, creatorId = idea.UserId, reason = request.Reason });

                return Ok(ApiResponse.Ok("Creator offer hidden from public marketplace.", updated));
            }
            else if (action == "restore")
            {
                if (!listing.IsModerationHidden)
                    return Conflict(ApiResponse.Error("Creator offer is already visible.", HttpContext.TraceIdentifier));

                var filter = Builders<CreatorIdea>.Filter.And(
                    Builders<CreatorIdea>.Filter.Eq(x => x.Id, ideaId),
                    Builders<CreatorIdea>.Filter.Eq("Phase5Data.PathA.MarketplaceListing.IsModerationHidden", true)
                );

                var update = Builders<CreatorIdea>.Update
                    .Set("Phase5Data.PathA.MarketplaceListing.IsModerationHidden", false)
                    .Set("Phase5Data.PathA.MarketplaceListing.ModerationReason", (string?)null)
                    .Set("Phase5Data.PathA.MarketplaceListing.ModeratedByAdminId", CurrentAdminEmail)
                    .Set("Phase5Data.PathA.MarketplaceListing.ModeratedAt", now)
                    .Set("Phase5Data.PathA.MarketplaceListing.UpdatedAt", now)
                    .Set(x => x.UpdatedAt, now);

                var updated = await _context.CreatorIdeas.FindOneAndUpdateAsync(
                    filter,
                    update,
                    new FindOneAndUpdateOptions<CreatorIdea> { ReturnDocument = ReturnDocument.After }
                );

                if (updated == null)
                    return Conflict(ApiResponse.Error("Creator offer moderation conflict. Please refresh.", HttpContext.TraceIdentifier));

                _audit?.Record("admin_creator_offer_restored", CurrentAdminEmail, true, new { ideaId, creatorId = idea.UserId });

                return Ok(ApiResponse.Ok("Creator offer restored to public marketplace.", updated));
            }
            else
            {
                return BadRequest(ApiResponse.Error("Invalid action. Supported: 'hide', 'restore'.", HttpContext.TraceIdentifier));
            }
        }

        // GET: api/admin/marketplace/reviews
        [HttpGet("reviews")]
        public async Task<IActionResult> GetReviews(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 15,
            [FromQuery] string? search = null,
            [FromQuery] int? rating = null,
            [FromQuery] string? moderationStatus = null)
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 15;

            var filter = Builders<Review>.Filter.Empty;

            if (!string.IsNullOrWhiteSpace(search))
            {
                var pattern = new BsonRegularExpression(search.Trim(), "i");
                filter &= Builders<Review>.Filter.Or(
                    Builders<Review>.Filter.Regex(x => x.WrittenReview, pattern),
                    Builders<Review>.Filter.Regex(x => x.ClientId, pattern),
                    Builders<Review>.Filter.Regex(x => x.ProviderId, pattern)
                );
            }

            if (rating.HasValue && rating.Value >= 1 && rating.Value <= 5)
            {
                filter &= Builders<Review>.Filter.Eq(x => x.OverallRating, rating.Value);
            }

            if (!string.IsNullOrWhiteSpace(moderationStatus))
            {
                if (moderationStatus.Equals("hidden", StringComparison.OrdinalIgnoreCase))
                {
                    filter &= Builders<Review>.Filter.Or(
                        Builders<Review>.Filter.Eq(x => x.IsModerationHidden, true),
                        Builders<Review>.Filter.Eq(x => x.Visibility, ReviewVisibility.Private)
                    );
                }
                else if (moderationStatus.Equals("visible", StringComparison.OrdinalIgnoreCase))
                {
                    filter &= Builders<Review>.Filter.And(
                        Builders<Review>.Filter.Ne(x => x.IsModerationHidden, true),
                        Builders<Review>.Filter.Eq(x => x.Visibility, ReviewVisibility.Public)
                    );
                }
            }

            var totalCount = (int)await _context.Reviews.CountDocumentsAsync(filter);
            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            var reviews = await _context.Reviews
                .Find(filter)
                .SortByDescending(x => x.SubmittedAt)
                .Skip((page - 1) * pageSize)
                .Limit(pageSize)
                .ToListAsync();

            var userIds = reviews.Select(r => r.ClientId).Concat(reviews.Select(r => r.ProviderId)).Distinct().ToList();
            var users = await _context.ApplicationUsers.Find(u => userIds.Contains(u.Id.ToString())).ToListAsync();
            var userMap = users.ToDictionary(u => u.Id.ToString());

            var items = reviews.Select(r =>
            {
                userMap.TryGetValue(r.ClientId, out var client);
                userMap.TryGetValue(r.ProviderId, out var provider);

                return new AdminReviewListItemDto
                {
                    Id = r.Id,
                    EngagementId = r.EngagementId,
                    ClientId = r.ClientId,
                    ClientName = client?.Name ?? "Client",
                    ClientEmail = client?.Email ?? string.Empty,
                    ProviderId = r.ProviderId,
                    ProviderName = provider?.Name ?? "Service Provider",
                    ProviderEmail = provider?.Email ?? string.Empty,
                    OverallRating = r.OverallRating,
                    QualityRating = r.QualityRating,
                    CommunicationRating = r.CommunicationRating,
                    DeliveryRating = r.DeliveryRating,
                    WrittenReview = r.WrittenReview,
                    ProviderResponse = r.ProviderResponse,
                    Visibility = r.Visibility.ToString(),
                    VerificationStatus = r.VerificationStatus.ToString(),
                    IsModerationHidden = r.IsModerationHidden || r.Visibility == ReviewVisibility.Private,
                    ModerationReason = r.ModerationReason,
                    ModeratedBy = r.ModeratedByAdminId,
                    ModeratedAt = r.ModeratedAt,
                    SubmittedAt = r.SubmittedAt
                };
            }).ToList();

            var result = new
            {
                items,
                totalCount,
                page,
                pageSize,
                totalPages
            };

            return Ok(ApiResponse.Ok("Reviews fetched.", result));
        }

        // POST: api/admin/marketplace/reviews/{id}/moderate
        [HttpPost("reviews/{id}/moderate")]
        public async Task<IActionResult> ModerateReview(string id, [FromBody] AdminModerationActionRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Action))
                return BadRequest(ApiResponse.Error("Action ('hide' or 'restore') is required.", HttpContext.TraceIdentifier));

            var action = request.Action.Trim().ToLowerInvariant();
            var review = await _context.Reviews.Find(x => x.Id == id).FirstOrDefaultAsync();
            if (review == null)
                return NotFound(ApiResponse.Error("Review not found.", HttpContext.TraceIdentifier));

            var now = DateTime.UtcNow;

            if (action == "hide")
            {
                if (review.IsModerationHidden || review.Visibility == ReviewVisibility.Private)
                    return Conflict(ApiResponse.Error("Review is already hidden by moderation.", HttpContext.TraceIdentifier));

                if (string.IsNullOrWhiteSpace(request.Reason))
                    return BadRequest(ApiResponse.Error("A reason is mandatory when hiding a review.", HttpContext.TraceIdentifier));

                var filter = Builders<Review>.Filter.And(
                    Builders<Review>.Filter.Eq(x => x.Id, id),
                    Builders<Review>.Filter.Ne(x => x.IsModerationHidden, true)
                );

                var update = Builders<Review>.Update
                    .Set(x => x.IsModerationHidden, true)
                    .Set(x => x.Visibility, ReviewVisibility.Private)
                    .Set(x => x.VerificationStatus, ReviewVerificationStatus.Rejected)
                    .Set(x => x.ModerationReason, request.Reason.Trim())
                    .Set(x => x.ModeratedByAdminId, CurrentAdminEmail)
                    .Set(x => x.ModeratedAt, now);

                var updated = await _context.Reviews.FindOneAndUpdateAsync(
                    filter,
                    update,
                    new FindOneAndUpdateOptions<Review> { ReturnDocument = ReturnDocument.After }
                );

                if (updated == null)
                    return Conflict(ApiResponse.Error("Review moderation conflict. Please refresh.", HttpContext.TraceIdentifier));

                _audit?.Record("admin_review_hidden", CurrentAdminEmail, true, new { reviewId = id, review.ProviderId, review.ClientId, reason = request.Reason });

                return Ok(ApiResponse.Ok("Review has been hidden from public display.", updated));
            }
            else if (action == "restore")
            {
                if (!review.IsModerationHidden && review.Visibility == ReviewVisibility.Public)
                    return Conflict(ApiResponse.Error("Review is already publicly visible.", HttpContext.TraceIdentifier));

                var filter = Builders<Review>.Filter.And(
                    Builders<Review>.Filter.Eq(x => x.Id, id),
                    Builders<Review>.Filter.Or(
                        Builders<Review>.Filter.Eq(x => x.IsModerationHidden, true),
                        Builders<Review>.Filter.Eq(x => x.Visibility, ReviewVisibility.Private)
                    )
                );

                var update = Builders<Review>.Update
                    .Set(x => x.IsModerationHidden, false)
                    .Set(x => x.Visibility, ReviewVisibility.Public)
                    .Set(x => x.VerificationStatus, ReviewVerificationStatus.Verified)
                    .Set(x => x.ModerationReason, (string?)null)
                    .Set(x => x.ModeratedByAdminId, CurrentAdminEmail)
                    .Set(x => x.ModeratedAt, now);

                var updated = await _context.Reviews.FindOneAndUpdateAsync(
                    filter,
                    update,
                    new FindOneAndUpdateOptions<Review> { ReturnDocument = ReturnDocument.After }
                );

                if (updated == null)
                    return Conflict(ApiResponse.Error("Review moderation conflict. Please refresh.", HttpContext.TraceIdentifier));

                _audit?.Record("admin_review_restored", CurrentAdminEmail, true, new { reviewId = id, review.ProviderId, review.ClientId });

                return Ok(ApiResponse.Ok("Review has been restored to public display.", updated));
            }
            else
            {
                return BadRequest(ApiResponse.Error("Invalid action. Supported: 'hide', 'restore'.", HttpContext.TraceIdentifier));
            }
        }
    }
}
