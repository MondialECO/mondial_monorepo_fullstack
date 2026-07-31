using MongoDB.Bson;
using MongoDB.Driver;
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

        public MarketplaceService(MongoDbContext db, ILogger<MarketplaceService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<ServiceProviderResult<MarketplaceListingsResponse>> GetPublishedListingsAsync(
            MarketplaceListingsQuery query,
            CancellationToken ct)
        {
            try
            {
                var filter = Builders<ServiceListing>.Filter.Eq(x => x.Status, CatalogStatus.Published);

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
                var providerGuids = providerIds
                    .Where(id => Guid.TryParse(id, out _))
                    .Select(id => Guid.Parse(id))
                    .ToList();
                var providers = await _db.ApplicationUsers
                    .Find(u => providerGuids.Contains(u.Id))
                    .ToListAsync(ct);
                var providerMap = providers.ToDictionary(p => p.Id.ToString());
                _logger.LogInformation(
                    "[MarketplaceService] Fetched {Fetched} providers for {Requested} unique provider ids",
                    providerMap.Count, providerIds.Count);

                var packages = await _db.ServicePackages
                    .Find(p => pagedListings.Select(l => l.Id).Contains(p.ServiceId) &&
                               p.PackageType == PackageType.Basic)
                    .ToListAsync(ct);
                var packageMap = packages.GroupBy(p => p.ServiceId).ToDictionary(g => g.Key, g => g.First());

                var cards = new List<MarketplaceListingCard>();
                foreach (var listing in pagedListings)
                {
                    var provider = providerMap.TryGetValue(listing.ProviderId, out var p) ? p : null;
                    var basicPkg = packageMap.TryGetValue(listing.Id, out var pkg) ? pkg : null;
                    cards.Add(ToMarketplaceListingCard(listing, provider, basicPkg));
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

                if (listing == null || listing.Status != CatalogStatus.Published)
                {
                    return ServiceProviderResult<MarketplaceListingDetailResponse>.NotFound("Listing not found.");
                }

                if (!Guid.TryParse(listing.ProviderId, out var providerGuid))
                {
                    return ServiceProviderResult<MarketplaceListingDetailResponse>.NotFound("Provider not found.");
                }

                var provider = await _db.ApplicationUsers
                    .Find(u => u.Id == providerGuid)
                    .FirstOrDefaultAsync(ct);
                if (provider == null)
                {
                    return ServiceProviderResult<MarketplaceListingDetailResponse>.NotFound("Provider not found.");
                }

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
                        Provider = ToMarketplaceProviderHeader(provider),
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
            ServicePackage? basicPackage)
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
                    ProfileImageUrl = ResolveMediaUrl(provider?.ServiceProviderProfile?.ProfileImage?.PublicUrl),
                    Verified = provider?.ServiceProviderProfile?.VerificationStatus == ServiceProviderVerificationStatus.Verified
                },
                StartingPrice = basicPackage?.Price ?? 0,
                Currency = basicPackage?.Currency ?? "USD",
                DeliveryTimeValue = basicPackage?.DeliveryTimeValue ?? 0,
                DeliveryTimeUnit = basicPackage?.DeliveryTimeUnit.ToString() ?? "days",
                Rating = null,
                ReviewCount = null
            };
        }

        private MarketplaceProviderHeader ToMarketplaceProviderHeader(ApplicationUser provider)
        {
            var profile = provider.ServiceProviderProfile;

            return new MarketplaceProviderHeader
            {
                ProviderId = provider.Id.ToString(),
                DisplayName = provider.Name ?? "Unknown",
                Headline = profile?.Headline,
                ProfileImageUrl = ResolveMediaUrl(profile?.ProfileImage?.PublicUrl),
                Verified = profile?.VerificationStatus == ServiceProviderVerificationStatus.Verified,
                TrustScore = profile?.TrustScore > 0 ? (decimal)profile.TrustScore : null,
                CompletedOrders = null,
                MedianResponseTime = null
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
                Currency = pkg.Currency ?? "USD",
                DeliveryTimeValue = pkg.DeliveryTimeValue,
                DeliveryTimeUnit = pkg.DeliveryTimeUnit.ToString(),
                IncludedRevisionCount = pkg.IncludedRevisionCount,
                UnlimitedRevisions = pkg.UnlimitedRevisions,
                ScreensIncluded = pkg.ScreensIncluded,
                IncludedFeatures = pkg.IncludedFeatures ?? new(),
                ExcludedFeatures = pkg.ExcludedFeatures ?? new(),
                AddOns = pkg.AddOns?.Select(ao => new MarketplaceAddOn
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
                    : null
            };
        }

        private string? ResolveMediaUrl(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return null;
            if (value.StartsWith("http://") || value.StartsWith("https://")) return value;
            return $"/api/files/{value.TrimStart('/')}";
        }
    }
}
