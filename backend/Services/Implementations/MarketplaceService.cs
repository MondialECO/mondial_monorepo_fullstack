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

        public MarketplaceService(
            MongoDbContext db,
            ILogger<MarketplaceService> logger,
            UserManager<ApplicationUser> userManager,
            IProfessionalProfileStore professionalStore)
        {
            _db = db;
            _logger = logger;
            _userManager = userManager;
            _professionalStore = professionalStore;
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

                var cards = new List<MarketplaceListingCard>();
                foreach (var listing in pagedListings)
                {
                    providerMap.TryGetValue(listing.ProviderId, out var providerTuple);
                    packageMap.TryGetValue(listing.Id, out var basicPkg);
                    professionalMap.TryGetValue(listing.ProviderId, out var professional);
                    cards.Add(ToMarketplaceListingCard(listing, providerTuple.Item1, basicPkg, professional));
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

                var provider = await _userManager.FindByIdAsync(listing.ProviderId);
                if (provider == null)
                {
                    return ServiceProviderResult<MarketplaceListingDetailResponse>.NotFound("Provider not found.");
                }

                var professional = await _professionalStore.GetByUserIdAsync(listing.ProviderId);

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
                        Provider = ToMarketplaceProviderHeader(provider, professional),
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
            ProfessionalProfileRecord? professional)
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
                    Verified = provider?.ServiceProviderProfile?.VerificationStatus == ServiceProviderVerificationStatus.Verified
                },
                StartingPrice = basicPackage?.Price ?? 0,
                Currency = basicPackage?.Currency ?? "EUR",
                DeliveryTimeValue = basicPackage?.DeliveryTimeValue ?? 0,
                DeliveryTimeUnit = basicPackage?.DeliveryTimeUnit.ToString() ?? "days",
                Rating = null,
                ReviewCount = null
            };
        }

        private MarketplaceProviderHeader ToMarketplaceProviderHeader(ApplicationUser provider, ProfessionalProfileRecord? professional)
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
