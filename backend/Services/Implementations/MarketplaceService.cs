using MongoDB.Bson;
using MongoDB.Driver;
using Microsoft.AspNetCore.Identity;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Interface;
using System.Text.RegularExpressions;

namespace WebApp.Services.Implementations
{
    public class MarketplaceService : IMarketplaceService
    {
        private readonly MongoDbContext _db;
        private readonly ILogger<MarketplaceService> _logger;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IProfessionalProfileStore _professionalStore;
        private readonly IResponseRateService _responseRates;

        public MarketplaceService(
            MongoDbContext db,
            ILogger<MarketplaceService> logger,
            UserManager<ApplicationUser> userManager,
            IProfessionalProfileStore professionalStore,
            IResponseRateService responseRates)
        {
            _db = db;
            _logger = logger;
            _userManager = userManager;
            _professionalStore = professionalStore;
            _responseRates = responseRates;
        }

        public async Task<ServiceProviderResult<MarketplaceListingsResponse>> GetPublishedListingsAsync(
            MarketplaceListingsQuery query,
            CancellationToken ct)
        {
            try
            {
                var filter = Builders<ServiceListing>.Filter.And(
                    Builders<ServiceListing>.Filter.Eq(x => x.Status, CatalogStatus.Published),
                    Builders<ServiceListing>.Filter.Ne(x => x.IsModerationHidden, true)
                );

                if (!string.IsNullOrWhiteSpace(query.Search))
                {
                    var searchPattern = Regex.Escape(query.Search);
                    var titleFilter = Builders<ServiceListing>.Filter.Regex(
                        x => x.Title,
                        new BsonRegularExpression(searchPattern, "i"));
                    filter &= titleFilter;
                }

                if (!string.IsNullOrWhiteSpace(query.Category))
                {
                    if (Enum.TryParse<ServiceCategory>(query.Category, out var categoryEnum))
                    {
                        filter &= Builders<ServiceListing>.Filter.Eq(x => x.Category, categoryEnum);
                    }
                }

                if (!string.IsNullOrWhiteSpace(query.SubCategory))
                {
                    filter &= Builders<ServiceListing>.Filter.Eq(x => x.ServiceType, query.SubCategory);
                }

                var allListings = await _db.ServiceListings
                    .Find(filter)
                    .ToListAsync(ct);

                var filteredListings = allListings.AsEnumerable();

                if (query.PriceMin.HasValue || query.PriceMax.HasValue)
                {
                    var allPackages = await _db.ServicePackages.Find(_ => true).ToListAsync(ct);
                    var basicByService = allPackages
                        .Where(p => p.PackageType == PackageType.Basic)
                        .GroupBy(p => p.ServiceId)
                        .ToDictionary(g => g.Key, g => g.First());

                    filteredListings = filteredListings.Where(listing =>
                    {
                        if (!basicByService.TryGetValue(listing.Id, out var pkg)) return false;
                        if (query.PriceMin.HasValue && pkg.Price < query.PriceMin.Value) return false;
                        if (query.PriceMax.HasValue && pkg.Price > query.PriceMax.Value) return false;
                        return true;
                    });
                }

                if (query.DeliveryTimeMaxDays.HasValue)
                {
                    var allPackages = await _db.ServicePackages.Find(_ => true).ToListAsync(ct);
                    var basicByService = allPackages
                        .Where(p => p.PackageType == PackageType.Basic)
                        .GroupBy(p => p.ServiceId)
                        .ToDictionary(g => g.Key, g => g.First());

                    filteredListings = filteredListings.Where(listing =>
                    {
                        if (!basicByService.TryGetValue(listing.Id, out var pkg)) return false;
                        var days = ConvertDeliveryTimeToDays(pkg.DeliveryTimeValue, pkg.DeliveryTimeUnit);
                        return days <= query.DeliveryTimeMaxDays.Value;
                    });
                }

                var listingsToSort = filteredListings.ToList();

                if (string.IsNullOrWhiteSpace(query.Sort) || query.Sort == "recent")
                {
                    listingsToSort = listingsToSort.OrderByDescending(x => x.UpdatedAt).ToList();
                }
                else if (query.Sort == "price_asc" || query.Sort == "price_desc")
                {
                    var allPackages = await _db.ServicePackages.Find(_ => true).ToListAsync(ct);
                    var basicByService = allPackages
                        .Where(p => p.PackageType == PackageType.Basic)
                        .GroupBy(p => p.ServiceId)
                        .ToDictionary(g => g.Key, g => g.First());

                    listingsToSort = (query.Sort == "price_asc"
                        ? listingsToSort.OrderBy(x =>
                            basicByService.TryGetValue(x.Id, out var p) ? p.Price : decimal.MaxValue)
                        : listingsToSort.OrderByDescending(x =>
                            basicByService.TryGetValue(x.Id, out var p) ? p.Price : 0))
                        .ToList();
                }

                var total = listingsToSort.Count;
                var page = Math.Max(1, query.Page);
                var pageSize = Math.Max(1, Math.Min(query.PageSize, 100));

                var pagedListings = listingsToSort
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();

                var providerIds = pagedListings.Select(x => x.ProviderId).Distinct().ToList();

                // Fetch users and their professional profiles in parallel
                var providerLookups = providerIds.Select(async id => new {
                    Id = id,
                    User = await _userManager.FindByIdAsync(id),
                    Professional = await _professionalStore.GetByUserIdAsync(id)
                });
                var providerResults = await Task.WhenAll(providerLookups);
                var providerMap = providerResults
                    .Where(x => x.User != null)
                    .ToDictionary(x => x.Id, x => (x.User, x.Professional));
                var professionalMap = providerResults
                    .Where(x => x.Professional != null)
                    .ToDictionary(x => x.Id, x => x.Professional);

                var packages = await _db.ServicePackages
                    .Find(p => pagedListings.Select(l => l.Id).Contains(p.ServiceId) &&
                               p.PackageType == PackageType.Basic)
                    .ToListAsync(ct);
                var packageMap = packages.GroupBy(p => p.ServiceId).ToDictionary(g => g.Key, g => g.First());

                // One query for the whole page, not one per card.
                var ratings = await ProviderRatingsAsync(providerIds, ct);

                var cards = new List<MarketplaceListingCard>();
                foreach (var listing in pagedListings)
                {
                    providerMap.TryGetValue(listing.ProviderId, out var providerTuple);
                    packageMap.TryGetValue(listing.Id, out var basicPkg);
                    professionalMap.TryGetValue(listing.ProviderId, out var professional);
                    var rating = ratings.TryGetValue(listing.ProviderId, out var r)
                        ? r
                        : ((decimal, int)?)null;
                    cards.Add(ToMarketplaceListingCard(listing, providerTuple.Item1, basicPkg, professional, rating));
                }

                return ServiceProviderResult<MarketplaceListingsResponse>.Ok(
                    new MarketplaceListingsResponse
                    {
                        Items = cards,
                        Total = total,
                        Page = page,
                        PageSize = pageSize
                    });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching marketplace listings");
                return ServiceProviderResult<MarketplaceListingsResponse>.Conflict("Failed to fetch marketplace listings.");
            }
        }

        public async Task<ServiceProviderResult<MarketplaceListingDetailResponse>> GetListingDetailAsync(
            string listingId,
            CancellationToken ct)
        {
            try
            {
                var listing = await _db.ServiceListings
                    .Find(x => x.Id == listingId)
                    .FirstOrDefaultAsync(ct);

                if (listing == null || listing.Status != CatalogStatus.Published || listing.IsModerationHidden)
                {
                    return ServiceProviderResult<MarketplaceListingDetailResponse>.NotFound("Listing not found.");
                }

                var provider = await _userManager.FindByIdAsync(listing.ProviderId);
                if (provider == null)
                {
                    return ServiceProviderResult<MarketplaceListingDetailResponse>.NotFound("Provider not found.");
                }

                var professional = await _professionalStore.GetByUserIdAsync(listing.ProviderId);
                var completedOrders = await CountCompletedEngagementsAsync(listing.ProviderId, ct);
                var medianResponseTime = await _responseRates.CalculateMedianResponseTimeAsync(listing.ProviderId);

                var packages = await _db.ServicePackages
                    .Find(x => x.ServiceId == listingId)
                    .ToListAsync(ct);

                var faqs = await _db.ServiceFAQs
                    .Find(x => x.ServiceId == listingId)
                    .SortBy(x => x.DisplayOrder)
                    .ToListAsync(ct);

                return ServiceProviderResult<MarketplaceListingDetailResponse>.Ok(
                    new MarketplaceListingDetailResponse
                    {
                        Id = listing.Id,
                        Title = listing.Title,
                        Category = listing.Category.ToString(),
                        ServiceType = listing.ServiceType,
                        IndustryFocus = listing.IndustryFocus ?? new(),
                        GeographicCoverage = listing.GeographicCoverage ?? new(),
                        DescriptionHtml = listing.Description,
                        Provider = ToMarketplaceProviderHeader(provider, professional, completedOrders, medianResponseTime),
                        Packages = packages.Select(p => ToMarketplacePackage(p)).ToList(),
                        Gallery = (listing.GalleryImages ?? new())
                            .OrderBy(x => x.DisplayOrder)
                            .Select(img => new MarketplaceGalleryImage
                            {
                                Id = img.Id,
                                Url = ResolveMediaUrl(img.PublicUrl),
                                DisplayOrder = img.DisplayOrder
                            })
                            .ToList(),
                        PreviewVideo = listing.PreviewVideo != null
                            ? new MarketplacePreviewVideo
                            {
                                Url = ResolveMediaUrl(listing.PreviewVideo.PublicUrl),
                                DurationSeconds = listing.PreviewVideo.DurationSeconds
                            }
                            : null,
                        Faqs = faqs.Select(f => new MarketplaceFaq
                        {
                            Id = f.Id,
                            Question = f.Question,
                            AnswerHtml = f.Answer,
                            PackageId = f.PackageId,
                            DisplayOrder = f.DisplayOrder
                        }).ToList(),
                        MetadataTags = listing.MetadataTags ?? new(),
                        SearchTags = listing.SearchTags ?? new()
                    });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching listing detail");
                return ServiceProviderResult<MarketplaceListingDetailResponse>.Conflict("Failed to fetch listing detail.");
            }
        }

        private int ConvertDeliveryTimeToDays(int value, DeliveryTimeUnit unit) =>
            unit switch
            {
                DeliveryTimeUnit.Hours => value / 24,
                DeliveryTimeUnit.Weeks => value * 7,
                _ => value // Days
            };

        private MarketplaceListingCard ToMarketplaceListingCard(
            ServiceListing listing,
            ApplicationUser? provider,
            ServicePackage? basicPackage,
            ProfessionalProfileRecord? professional,
            (decimal Rating, int Count)? rating)
        {
            var coverUrl = (listing.GalleryImages?.FirstOrDefault()?.PublicUrl)
                ?? provider?.ServiceProviderProfile?.CoverImage?.PublicUrl;

            return new MarketplaceListingCard
            {
                Id = listing.Id,
                Title = listing.Title,
                Category = listing.Category.ToString(),
                CoverImageUrl = ResolveMediaUrl(coverUrl),
                Provider = new MarketplaceProviderMini
                {
                    ProviderId = listing.ProviderId,
                    DisplayName = provider?.Name ?? "Unknown",
                    ProfileImageUrl = ResolveMediaUrl(professional?.ProfileImage?.PublicUrl),
                    Verified = provider?.ServiceProviderProfile?.VerificationStatus == ServiceProviderVerificationStatus.Verified,
                    PublicSlug = professional?.PublicSlug ?? (provider != null ? ProfileSlugGenerator.GenerateSlug(provider.Name ?? provider.UserName, listing.ProviderId) : null)
                },
                StartingPrice = basicPackage?.Price ?? 0,
                Currency = basicPackage?.Currency ?? "EUR",
                DeliveryTimeValue = basicPackage?.DeliveryTimeValue ?? 0,
                DeliveryTimeUnit = basicPackage?.DeliveryTimeUnit.ToString() ?? "days",
                // Both stay null for a provider with no qualifying reviews: the card gates
                // its whole star row on non-null, which is what keeps an unrated listing
                // from rendering an empty or zero-star rating it hasn't earned.
                Rating = rating?.Rating,
                ReviewCount = rating?.Count
            };
        }

        /// <summary>
        /// Public rating aggregate per provider, keyed by ProviderId.
        ///
        /// Scoped to the PROVIDER, not the listing. Review carries only EngagementId and
        /// ProviderId — no ServiceId — so a listing-scoped average would need a
        /// Review → WorkroomEngagement → Proposal → ServiceId join on every grid page.
        /// That cost buys little here: a provider is capped at 4 listings (canon §6.1b),
        /// so the same number repeats on at most four cards, and splitting an early-stage
        /// review count four ways produces per-listing samples too small to mean anything.
        /// Revisit if listing-level reputation is ever required.
        ///
        /// Excludes Private reviews (the buyer withheld them from public display) and
        /// non-Verified ones, matching how RefreshTrust and AnalyticsService already
        /// qualify a review — a Rejected review must never reach a public average.
        /// </summary>
        private async Task<Dictionary<string, (decimal Rating, int Count)>> ProviderRatingsAsync(
            List<string> providerIds,
            CancellationToken ct)
        {
            if (providerIds.Count == 0) return new();

            var reviews = await _db.Reviews
                .Find(x => providerIds.Contains(x.ProviderId)
                           && x.Visibility == ReviewVisibility.Public
                           && x.VerificationStatus == ReviewVerificationStatus.Verified
                           && !x.IsModerationHidden)
                .ToListAsync(ct);

            return reviews
                .GroupBy(x => x.ProviderId)
                .ToDictionary(
                    g => g.Key,
                    g => (Math.Round((decimal)g.Average(r => r.OverallRating), 1, MidpointRounding.AwayFromZero),
                          g.Count()));
        }

        /// <summary>
        /// Engagements this provider has carried to completion. Counted with the same
        /// predicate <see cref="WorkroomService.CreateRepeatCouponIfEligible"/> uses, so
        /// "completed" means one thing platform-wide: EngagementStatus.Completed only.
        /// Archived is deliberately excluded — it has no writer today (canon §10.7), and
        /// including a state nothing can reach would be a silent no-op that later starts
        /// counting when an archive path ships.
        /// </summary>
        private async Task<int> CountCompletedEngagementsAsync(string providerId, CancellationToken ct) =>
            (int)await _db.WorkroomEngagements.CountDocumentsAsync(
                x => x.ProviderId == providerId && x.EngagementStatus == EngagementStatus.Completed,
                cancellationToken: ct);

        private MarketplaceProviderHeader ToMarketplaceProviderHeader(
            ApplicationUser provider,
            ProfessionalProfileRecord? professional,
            int completedOrders,
            string? medianResponseTime)
        {
            var profile = provider.ServiceProviderProfile;

            return new MarketplaceProviderHeader
            {
                ProviderId = provider.Id.ToString(),
                DisplayName = provider.Name ?? "Unknown",
                Headline = profile?.Headline,
                ProfileImageUrl = ResolveMediaUrl(professional?.ProfileImage?.PublicUrl),
                Verified = profile?.VerificationStatus == ServiceProviderVerificationStatus.Verified,
                TrustScore = profile?.TrustScore > 0 ? (decimal)profile.TrustScore : null,
                // Zero completions is a real, meaningful answer for a new provider, but the
                // UI reads null as "unknown" and hides the row entirely — so a brand-new
                // provider shows nothing rather than an unflattering "0 completed".
                CompletedOrders = completedOrders > 0 ? completedOrders : null,
                MedianResponseTime = medianResponseTime,
                PublicSlug = professional?.PublicSlug ?? ProfileSlugGenerator.GenerateSlug(provider.Name ?? provider.UserName, provider.Id.ToString())
            };
        }

        private MarketplacePackage ToMarketplacePackage(ServicePackage pkg)
        {
            return new MarketplacePackage
            {
                Id = pkg.Id,
                Tier = pkg.PackageType.ToString(),
                Title = pkg.PackageTitle,
                Price = pkg.Price,
                Currency = pkg.Currency ?? "EUR",
                DeliveryTimeValue = pkg.DeliveryTimeValue,
                DeliveryTimeUnit = pkg.DeliveryTimeUnit.ToString(),
                IncludedRevisionCount = pkg.IncludedRevisionCount,
                UnlimitedRevisions = pkg.UnlimitedRevisions,
                ScreensIncluded = pkg.ScreensIncluded,
                IncludedFeatures = pkg.IncludedFeatures ?? new(),
                ExcludedFeatures = pkg.ExcludedFeatures ?? new(),
                // Disabled add-ons are ignored by LeadsService.PurchasePackageAsync, so
                // surfacing them here would let the client total a price the server won't charge.
                AddOns = pkg.AddOns?.Where(ao => ao.Enabled).Select(ao => new MarketplaceAddOn
                {
                    Name = ao.Name,
                    Price = ao.Price,
                    DeliveryTimeAdjustmentDays = ao.DeliveryTimeAdjustmentDays
                }).ToList() ?? new(),
                AdditionalRevision = pkg.AdditionalRevisionAvailable
                    ? new MarketplaceAdditionalRevision
                    {
                        Price = pkg.AdditionalRevisionPrice,
                        DeliveryTimeDays = pkg.AdditionalRevisionDeliveryTime
                    }
                    : null,
                RequirementsTemplate = (pkg.RequirementsTemplate ?? new()).Select(r => new RequirementsFieldResponse
                {
                    FieldId = r.FieldId,
                    Label = r.Label,
                    FieldType = r.FieldType.ToString(),
                    Required = r.Required,
                }).ToList(),
            };
        }

        private string? ResolveMediaUrl(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return null;
            if (value.StartsWith("http://") || value.StartsWith("https://")) return value;
            // Files are static files in wwwroot/, served at /uploads/...
            return $"/{value.TrimStart('/')}";
        }
    }
}
