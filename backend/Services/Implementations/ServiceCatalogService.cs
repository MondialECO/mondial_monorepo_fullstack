using Microsoft.AspNetCore.Identity;
using MongoDB.Bson;
using MongoDB.Driver;
using TagLib;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations;

/// <summary>
/// Module 2 — Service Catalog (canon §6). Owner-scoped CRUD over ServiceListings /
/// ServicePackages / ServiceFAQs (top-level collections via MongoDbContext) + provider
/// capacity on the ServiceProviderProfiles split record (dual-read fallback to the
/// embedded profile for unmigrated users). Publishes packages;
/// never creates a Proposal or runs checkout (Module 3). Deterministic throughout.
/// </summary>
public class ServiceCatalogService : IServiceCatalogService
{
    private readonly MongoDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<ServiceCatalogService> _logger;
    private readonly SaveFile _saveFile;
    private readonly Hangfire.IBackgroundJobClient _jobClient;

    private readonly IServiceProviderProfileStore _spStore;
    private readonly WebApp.Services.Migrations.IServiceProviderProfileSplitMigration _migrator;

    public ServiceCatalogService(
        MongoDbContext db,
        UserManager<ApplicationUser> userManager,
        IServiceProviderProfileStore spStore,
        WebApp.Services.Migrations.IServiceProviderProfileSplitMigration migrator,
        SaveFile saveFile,
        Hangfire.IBackgroundJobClient jobClient,
        ILogger<ServiceCatalogService> logger)
    {
        _db = db;
        _userManager = userManager;
        _spStore = spStore;
        _migrator = migrator;
        _saveFile = saveFile;
        _jobClient = jobClient;
        _logger = logger;
    }

    // ---------------- Listings ----------------

    public async Task<ServiceProviderResult<List<ServiceListingResponse>>> GetListingsAsync(string userId)
    {
        var listings = await _db.ServiceListings
            .Find(l => l.ProviderId == userId)
            .SortByDescending(l => l.UpdatedAt)
            .ToListAsync();
        return ServiceProviderResult<List<ServiceListingResponse>>.Ok(listings.Select(l => l.ToResponse()).ToList());
    }

    public async Task<ServiceProviderResult<ServiceListingDetailResponse>> GetListingAsync(string userId, string listingId)
    {
        var listing = await FindOwnedListingAsync(userId, listingId);
        if (listing is null)
            return ServiceProviderResult<ServiceListingDetailResponse>.NotFound("Service listing not found.");

        var packages = await _db.ServicePackages.Find(p => p.ServiceId == listingId).ToListAsync();
        var faqs = await _db.ServiceFAQs.Find(f => f.ServiceId == listingId).SortBy(f => f.DisplayOrder).ToListAsync();

        var detail = new ServiceListingDetailResponse
        {
            Listing = listing.ToResponse(),
            Packages = packages.Select(p => p.ToResponse()).ToList(),
            Faqs = faqs.Select(f => f.ToResponse(DetectFaqConflict(f, packages))).ToList(),
        };
        return ServiceProviderResult<ServiceListingDetailResponse>.Ok(detail);
    }

    public async Task<ServiceProviderResult<ServiceListingResponse>> CreateListingAsync(string userId, UpsertServiceListingRequest request)
    {
        if (!TryEnum<ServiceCategory>(request.Category, out var category))
            return ServiceProviderResult<ServiceListingResponse>.Conflict("Unknown service category.");
        if (string.IsNullOrWhiteSpace(request.Title))
            return ServiceProviderResult<ServiceListingResponse>.Conflict("A service title is required.");

        var listing = new ServiceListing
        {
            ProviderId = userId,
            ServiceType = request.ServiceType?.Trim() ?? "",
            Title = request.Title.Trim(),
            Description = request.Description?.Trim() ?? "",
            Category = category,
            IndustryFocus = Normalize(request.IndustryFocus),
            GeographicCoverage = Normalize(request.GeographicCoverage),
            Status = CatalogStatus.Draft,
        };
        await _db.ServiceListings.InsertOneAsync(listing);
        return ServiceProviderResult<ServiceListingResponse>.Ok(listing.ToResponse(), "Service created.");
    }

    public async Task<ServiceProviderResult<ServiceListingResponse>> UpdateListingAsync(string userId, string listingId, UpsertServiceListingRequest request)
    {
        var listing = await FindOwnedListingAsync(userId, listingId);
        if (listing is null)
            return ServiceProviderResult<ServiceListingResponse>.NotFound("Service listing not found.");
        if (!TryEnum<ServiceCategory>(request.Category, out var category))
            return ServiceProviderResult<ServiceListingResponse>.Conflict("Unknown service category.");
        if (string.IsNullOrWhiteSpace(request.Title))
            return ServiceProviderResult<ServiceListingResponse>.Conflict("A service title is required.");

        listing.ServiceType = request.ServiceType?.Trim() ?? "";
        listing.Title = request.Title.Trim();
        listing.Description = request.Description?.Trim() ?? "";
        listing.Category = category;
        listing.IndustryFocus = Normalize(request.IndustryFocus);
        listing.GeographicCoverage = Normalize(request.GeographicCoverage);
        listing.UpdatedAt = DateTime.UtcNow;

        await _db.ServiceListings.ReplaceOneAsync(l => l.Id == listing.Id, listing);
        return ServiceProviderResult<ServiceListingResponse>.Ok(listing.ToResponse(), "Service updated.");
    }

    public Task<ServiceProviderResult<ServiceListingResponse>> PublishListingAsync(string userId, string listingId)
        => SetListingStatusAsync(userId, listingId, CatalogStatus.Published, "Service published.");

    public Task<ServiceProviderResult<ServiceListingResponse>> UnpublishListingAsync(string userId, string listingId)
        => SetListingStatusAsync(userId, listingId, CatalogStatus.Unpublished, "Service unpublished.");

    private async Task<ServiceProviderResult<ServiceListingResponse>> SetListingStatusAsync(string userId, string listingId, CatalogStatus status, string message)
    {
        var listing = await FindOwnedListingAsync(userId, listingId);
        if (listing is null)
            return ServiceProviderResult<ServiceListingResponse>.NotFound("Service listing not found.");
        listing.Status = status;
        listing.UpdatedAt = DateTime.UtcNow;
        await _db.ServiceListings.ReplaceOneAsync(l => l.Id == listing.Id, listing);
        return ServiceProviderResult<ServiceListingResponse>.Ok(listing.ToResponse(), message);
    }

    // ---------------- Packages ----------------

    public async Task<ServiceProviderResult<ServicePackageResponse>> AddPackageAsync(string userId, string listingId, UpsertServicePackageRequest request)
    {
        var listing = await FindOwnedListingAsync(userId, listingId);
        if (listing is null)
            return ServiceProviderResult<ServicePackageResponse>.NotFound("Service listing not found.");

        var pkg = new ServicePackage { ServiceId = listingId, Status = CatalogStatus.Draft };
        var applied = ApplyPackageRequest(pkg, request);
        if (applied.Outcome != ServiceProviderOutcome.Ok)
            return ServiceProviderResult<ServicePackageResponse>.Conflict(applied.Message);

        // One public package per tier (Basic/Standard/Premium); Custom may repeat.
        if (TierRank(pkg.PackageType) > 0)
        {
            var dup = await _db.ServicePackages
                .Find(p => p.ServiceId == listingId && p.PackageType == pkg.PackageType)
                .AnyAsync();
            if (dup)
                return ServiceProviderResult<ServicePackageResponse>.Conflict($"A {pkg.PackageType} package already exists for this service.");
        }

        await _db.ServicePackages.InsertOneAsync(pkg);
        return ServiceProviderResult<ServicePackageResponse>.Ok(pkg.ToResponse(), "Package added.");
    }

    public async Task<ServiceProviderResult<ServicePackageResponse>> UpdatePackageAsync(string userId, string packageId, UpsertServicePackageRequest request)
    {
        var pkg = await FindOwnedPackageAsync(userId, packageId);
        if (pkg is null)
            return ServiceProviderResult<ServicePackageResponse>.NotFound("Package not found.");

        var previousType = pkg.PackageType;
        var applied = ApplyPackageRequest(pkg, request);
        if (applied.Outcome != ServiceProviderOutcome.Ok)
            return ServiceProviderResult<ServicePackageResponse>.Conflict(applied.Message);

        // If the tier changed to a public tier already used by a different package, block.
        if (TierRank(pkg.PackageType) > 0 && pkg.PackageType != previousType)
        {
            var dup = await _db.ServicePackages
                .Find(p => p.ServiceId == pkg.ServiceId && p.PackageType == pkg.PackageType && p.Id != pkg.Id)
                .AnyAsync();
            if (dup)
                return ServiceProviderResult<ServicePackageResponse>.Conflict($"A {pkg.PackageType} package already exists for this service.");
        }

        pkg.UpdatedAt = DateTime.UtcNow;
        await _db.ServicePackages.ReplaceOneAsync(p => p.Id == pkg.Id, pkg);
        return ServiceProviderResult<ServicePackageResponse>.Ok(pkg.ToResponse(), "Package updated.");
    }

    public async Task<ServiceProviderResult<PublishPackageResponse>> PublishPackageAsync(string userId, string packageId, PublishPackageRequest request)
    {
        var pkg = await FindOwnedPackageAsync(userId, packageId);
        if (pkg is null)
            return ServiceProviderResult<PublishPackageResponse>.NotFound("Package not found.");

        // Required-before-publish (hard blocks, §6.2).
        var missing = new List<string>();
        if (string.IsNullOrWhiteSpace(pkg.PackageTitle)) missing.Add("title");
        if (string.IsNullOrWhiteSpace(pkg.PackageDescription)) missing.Add("description");
        if (pkg.Price <= 0) missing.Add("price > 0");
        if (string.IsNullOrWhiteSpace(pkg.Currency)) missing.Add("currency");
        if (pkg.DeliveryTimeValue <= 0) missing.Add("delivery time");
        if (pkg.Deliverables.Count == 0) missing.Add("at least one deliverable");
        if (!pkg.UnlimitedRevisions && pkg.RevisionRequestWindowDays <= 0) missing.Add("a revision policy (request window)");
        if (missing.Count > 0)
            return ServiceProviderResult<PublishPackageResponse>.Conflict($"Complete these before publishing: {string.Join(", ", missing)}.");

        var siblings = await _db.ServicePackages
            .Find(p => p.ServiceId == pkg.ServiceId && p.Id != pkg.Id)
            .ToListAsync();

        // Hard blocks: shared currency + unique title within the service.
        if (siblings.Any(s => !string.Equals(s.Currency, pkg.Currency, StringComparison.OrdinalIgnoreCase)))
            return ServiceProviderResult<PublishPackageResponse>.Conflict("All packages in a service must share the same currency.");
        if (siblings.Any(s => string.Equals(s.PackageTitle, pkg.PackageTitle, StringComparison.OrdinalIgnoreCase)))
            return ServiceProviderResult<PublishPackageResponse>.Conflict("Another package in this service already uses that title.");

        // Confirmation gate: a higher tier delivering faster than a lower tier (§6.2).
        var lowerTiers = siblings.Where(s => TierRank(s.PackageType) > 0 && TierRank(s.PackageType) < TierRank(pkg.PackageType)).ToList();
        if (TierRank(pkg.PackageType) > 0 && lowerTiers.Any(s => DeliveryDays(pkg) < DeliveryDays(s)) && !request.ConfirmShorterDelivery)
            return ServiceProviderResult<PublishPackageResponse>.Conflict("This higher-tier package has a shorter delivery time than a lower tier. Re-submit with confirmation to publish anyway.");

        // Non-blocking warnings (§6.2).
        var warnings = new List<string>();
        var directLower = siblings
            .Where(s => TierRank(s.PackageType) > 0 && TierRank(s.PackageType) < TierRank(pkg.PackageType))
            .OrderByDescending(s => TierRank(s.PackageType)).FirstOrDefault();
        if (TierRank(pkg.PackageType) > 0 && directLower is not null)
        {
            if (pkg.IncludedFeatures.Count < directLower.IncludedFeatures.Count)
                warnings.Add($"{pkg.PackageType} has fewer features than {directLower.PackageType}.");
            if (pkg.Price < directLower.Price)
                warnings.Add($"{pkg.PackageType} is priced lower than {directLower.PackageType}.");
        }

        pkg.Status = CatalogStatus.Published;
        pkg.UpdatedAt = DateTime.UtcNow;
        await _db.ServicePackages.ReplaceOneAsync(p => p.Id == pkg.Id, pkg);

        return ServiceProviderResult<PublishPackageResponse>.Ok(
            new PublishPackageResponse { Package = pkg.ToResponse(), Warnings = warnings },
            warnings.Count > 0 ? "Published with warnings." : "Package published.");
    }

    public async Task<ServiceProviderResult<ServicePackageResponse>> UnpublishPackageAsync(string userId, string packageId)
    {
        var pkg = await FindOwnedPackageAsync(userId, packageId);
        if (pkg is null)
            return ServiceProviderResult<ServicePackageResponse>.NotFound("Package not found.");
        pkg.Status = CatalogStatus.Unpublished;
        pkg.UpdatedAt = DateTime.UtcNow;
        await _db.ServicePackages.ReplaceOneAsync(p => p.Id == pkg.Id, pkg);
        return ServiceProviderResult<ServicePackageResponse>.Ok(pkg.ToResponse(), "Package unpublished.");
    }

    // Parse enums + copy request fields onto the package. Returns Conflict on a bad enum.
    private static ServiceProviderResult<bool> ApplyPackageRequest(ServicePackage pkg, UpsertServicePackageRequest r)
    {
        if (!TryEnum<PackageType>(r.PackageType, out var type))
            return ServiceProviderResult<bool>.Conflict("Unknown package type.");
        if (!TryEnum<DeliveryTimeUnit>(r.DeliveryTimeUnit, out var unit))
            return ServiceProviderResult<bool>.Conflict("Unknown delivery-time unit.");
        if (!TryEnum<DeliveryDayType>(r.DeliveryDayType, out var dayType))
            return ServiceProviderResult<bool>.Conflict("Unknown delivery day type.");
        if (!TryEnum<DeliveryStartRule>(r.DeliveryStartRule, out var startRule))
            return ServiceProviderResult<bool>.Conflict("Unknown delivery start rule.");
        if (!TryEnum<CancellationPolicyType>(r.CancellationPolicy, out var cancellation))
            return ServiceProviderResult<bool>.Conflict("Unknown cancellation policy.");

        PricingModel? pricingModel = null;
        if (!string.IsNullOrWhiteSpace(r.PricingModel))
        {
            if (!TryEnum<PricingModel>(r.PricingModel, out var pm))
                return ServiceProviderResult<bool>.Conflict("Unknown pricing model.");
            pricingModel = pm;
        }

        var reqFields = new List<RequirementsField>();
        foreach (var f in r.RequirementsTemplate ?? new())
        {
            if (!TryEnum<RequirementsFieldType>(f.FieldType, out var ft))
                return ServiceProviderResult<bool>.Conflict($"Unknown requirements field type '{f.FieldType}'.");
            reqFields.Add(new RequirementsField
            {
                FieldId = string.IsNullOrWhiteSpace(f.FieldId) ? Guid.NewGuid().ToString("n") : f.FieldId,
                Label = f.Label?.Trim() ?? "",
                FieldType = ft,
                Required = f.Required,
            });
        }

        pkg.PackageType = type;
        pkg.PackageName = r.PackageName?.Trim() ?? "";
        pkg.PackageTitle = r.PackageTitle?.Trim() ?? "";
        pkg.PackageDescription = r.PackageDescription?.Trim() ?? "";
        pkg.Price = r.Price;
        pkg.Currency = string.IsNullOrWhiteSpace(r.Currency) ? "EUR" : r.Currency.Trim().ToUpperInvariant();
        pkg.PricingModel = pricingModel;
        pkg.DeliveryTimeValue = r.DeliveryTimeValue;
        pkg.DeliveryTimeUnit = unit;
        pkg.DeliveryDayType = dayType;
        pkg.DeliveryStartRule = startRule;
        pkg.DeliveryTimezone = string.IsNullOrWhiteSpace(r.DeliveryTimezone) ? "UTC" : r.DeliveryTimezone.Trim();
        pkg.DailyCutoffTime = string.IsNullOrWhiteSpace(r.DailyCutoffTime) ? "17:00" : r.DailyCutoffTime.Trim();
        pkg.IncludedRevisionCount = Math.Max(0, r.IncludedRevisionCount);
        pkg.UnlimitedRevisions = r.UnlimitedRevisions;
        pkg.RevisionRequestWindowDays = Math.Max(0, r.RevisionRequestWindowDays);
        pkg.AdditionalRevisionAvailable = r.AdditionalRevisionAvailable;
        pkg.AdditionalRevisionPrice = r.AdditionalRevisionPrice;
        pkg.AdditionalRevisionDeliveryTime = r.AdditionalRevisionDeliveryTime;
        pkg.RevisionScopeDescription = r.RevisionScopeDescription?.Trim() ?? "";
        pkg.Deliverables = Normalize(r.Deliverables);
        pkg.IncludedFeatures = Normalize(r.IncludedFeatures);
        pkg.ExcludedFeatures = Normalize(r.ExcludedFeatures);
        pkg.AddOns = (r.AddOns ?? new()).Where(a => !string.IsNullOrWhiteSpace(a.Name)).Select(a => new ServiceAddOn
        {
            Name = a.Name.Trim(), Price = a.Price, DeliveryTimeAdjustmentDays = a.DeliveryTimeAdjustmentDays, Enabled = a.Enabled,
        }).ToList();
        pkg.RequirementsTemplate = reqFields;
        pkg.CancellationPolicy = cancellation;
        pkg.InstantOrderEnabled = r.InstantOrderEnabled;
        pkg.ManualApprovalRequired = r.ManualApprovalRequired;
        pkg.MaximumActiveOrders = Math.Max(0, r.MaximumActiveOrders);
        return ServiceProviderResult<bool>.Ok(true);
    }

    // ---------------- FAQs ----------------

    public async Task<ServiceProviderResult<ServiceFaqResponse>> AddFaqAsync(string userId, string listingId, UpsertServiceFaqRequest request)
    {
        var listing = await FindOwnedListingAsync(userId, listingId);
        if (listing is null)
            return ServiceProviderResult<ServiceFaqResponse>.NotFound("Service listing not found.");

        var validation = await ValidateFaqAsync(listingId, request, selfFaqId: null);
        if (validation is not null)
            return ServiceProviderResult<ServiceFaqResponse>.Conflict(validation);
        if (!TryEnum<FaqVisibility>(request.Visibility, out var visibility))
            return ServiceProviderResult<ServiceFaqResponse>.Conflict("Unknown FAQ visibility.");

        var faq = new ServiceFAQ
        {
            ServiceId = listingId,
            PackageId = string.IsNullOrWhiteSpace(request.PackageId) ? null : request.PackageId,
            Question = request.Question.Trim(),
            Answer = request.Answer.Trim(),
            Visibility = visibility,
            DisplayOrder = request.DisplayOrder,
            Status = CatalogStatus.Draft,
        };
        await _db.ServiceFAQs.InsertOneAsync(faq);
        var packages = await _db.ServicePackages.Find(p => p.ServiceId == listingId).ToListAsync();
        return ServiceProviderResult<ServiceFaqResponse>.Ok(faq.ToResponse(DetectFaqConflict(faq, packages)), "FAQ added.");
    }

    public async Task<ServiceProviderResult<ServiceFaqResponse>> UpdateFaqAsync(string userId, string faqId, UpsertServiceFaqRequest request)
    {
        var faq = await FindOwnedFaqAsync(userId, faqId);
        if (faq is null)
            return ServiceProviderResult<ServiceFaqResponse>.NotFound("FAQ not found.");

        var validation = await ValidateFaqAsync(faq.ServiceId, request, selfFaqId: faq.Id);
        if (validation is not null)
            return ServiceProviderResult<ServiceFaqResponse>.Conflict(validation);
        if (!TryEnum<FaqVisibility>(request.Visibility, out var visibility))
            return ServiceProviderResult<ServiceFaqResponse>.Conflict("Unknown FAQ visibility.");

        faq.PackageId = string.IsNullOrWhiteSpace(request.PackageId) ? null : request.PackageId;
        faq.Question = request.Question.Trim();
        faq.Answer = request.Answer.Trim();
        faq.Visibility = visibility;
        faq.DisplayOrder = request.DisplayOrder;
        faq.UpdatedAt = DateTime.UtcNow;
        await _db.ServiceFAQs.ReplaceOneAsync(f => f.Id == faq.Id, faq);
        var packages = await _db.ServicePackages.Find(p => p.ServiceId == faq.ServiceId).ToListAsync();
        return ServiceProviderResult<ServiceFaqResponse>.Ok(faq.ToResponse(DetectFaqConflict(faq, packages)), "FAQ updated.");
    }

    public async Task<ServiceProviderResult<ServiceFaqResponse>> DuplicateFaqAsync(string userId, string faqId)
    {
        var faq = await FindOwnedFaqAsync(userId, faqId);
        if (faq is null)
            return ServiceProviderResult<ServiceFaqResponse>.NotFound("FAQ not found.");
        // Append " (copy)" so the copy keeps the unique-question rule; always a Draft.
        var copy = new ServiceFAQ
        {
            ServiceId = faq.ServiceId,
            PackageId = faq.PackageId,
            Question = $"{faq.Question} (copy)",
            Answer = faq.Answer,
            Visibility = faq.Visibility,
            DisplayOrder = faq.DisplayOrder + 1,
            Status = CatalogStatus.Draft,
        };
        await _db.ServiceFAQs.InsertOneAsync(copy);
        return ServiceProviderResult<ServiceFaqResponse>.Ok(copy.ToResponse(), "FAQ duplicated.");
    }

    public Task<ServiceProviderResult<ServiceFaqResponse>> PublishFaqAsync(string userId, string faqId)
        => SetFaqStatusAsync(userId, faqId, CatalogStatus.Published, "FAQ published.");

    public Task<ServiceProviderResult<ServiceFaqResponse>> UnpublishFaqAsync(string userId, string faqId)
        => SetFaqStatusAsync(userId, faqId, CatalogStatus.Unpublished, "FAQ unpublished.");

    private async Task<ServiceProviderResult<ServiceFaqResponse>> SetFaqStatusAsync(string userId, string faqId, CatalogStatus status, string message)
    {
        var faq = await FindOwnedFaqAsync(userId, faqId);
        if (faq is null)
            return ServiceProviderResult<ServiceFaqResponse>.NotFound("FAQ not found.");
        faq.Status = status;
        faq.UpdatedAt = DateTime.UtcNow;
        await _db.ServiceFAQs.ReplaceOneAsync(f => f.Id == faq.Id, faq);
        return ServiceProviderResult<ServiceFaqResponse>.Ok(faq.ToResponse(), message);
    }

    public async Task<ServiceProviderResult<bool>> DeleteFaqAsync(string userId, string faqId)
    {
        var faq = await FindOwnedFaqAsync(userId, faqId);
        if (faq is null)
            return ServiceProviderResult<bool>.NotFound("FAQ not found.");
        await _db.ServiceFAQs.DeleteOneAsync(f => f.Id == faq.Id);
        return ServiceProviderResult<bool>.Ok(true, "FAQ deleted.");
    }

    public async Task<ServiceProviderResult<List<ServiceFaqResponse>>> ReorderFaqsAsync(string userId, string listingId, ReorderFaqsRequest request)
    {
        var listing = await FindOwnedListingAsync(userId, listingId);
        if (listing is null)
            return ServiceProviderResult<List<ServiceFaqResponse>>.NotFound("Service listing not found.");

        var faqs = await _db.ServiceFAQs.Find(f => f.ServiceId == listingId).ToListAsync();
        var byId = faqs.ToDictionary(f => f.Id);
        foreach (var item in request.Items ?? new())
        {
            if (byId.TryGetValue(item.FaqId, out var faq))
            {
                faq.DisplayOrder = item.DisplayOrder;
                faq.UpdatedAt = DateTime.UtcNow;
                await _db.ServiceFAQs.ReplaceOneAsync(f => f.Id == faq.Id, faq);
            }
        }
        var reordered = faqs.OrderBy(f => f.DisplayOrder).Select(f => f.ToResponse()).ToList();
        return ServiceProviderResult<List<ServiceFaqResponse>>.Ok(reordered, "FAQs reordered.");
    }

    // Returns an error message, or null when valid. Question + answer required; question
    // unique within the service; any referenced package must belong to this service.
    private async Task<string?> ValidateFaqAsync(string listingId, UpsertServiceFaqRequest request, string? selfFaqId)
    {
        if (string.IsNullOrWhiteSpace(request.Question)) return "A question is required.";
        if (string.IsNullOrWhiteSpace(request.Answer)) return "An answer is required.";

        if (!string.IsNullOrWhiteSpace(request.PackageId))
        {
            var belongs = await _db.ServicePackages.Find(p => p.Id == request.PackageId && p.ServiceId == listingId).AnyAsync();
            if (!belongs) return "The selected package does not belong to this service.";
        }

        var q = request.Question.Trim();
        var existing = await _db.ServiceFAQs.Find(f => f.ServiceId == listingId).ToListAsync();
        if (existing.Any(f => f.Id != selfFaqId && string.Equals(f.Question, q, StringComparison.OrdinalIgnoreCase)))
            return "Another FAQ in this service already asks that question.";
        return null;
    }

    // ---------------- Provider capacity ----------------

    public async Task<ServiceProviderResult<ProviderCapacityResponse>> GetCapacityAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return ServiceProviderResult<ProviderCapacityResponse>.NotFound("Service provider profile not found.");
        // Dual-read: split record when present, embedded projection otherwise.
        var record = await _spStore.GetByUserIdAsync(userId)
            ?? SpProfileSplitMapper.ToServiceProviderRecord(user);
        return ServiceProviderResult<ProviderCapacityResponse>.Ok(ToCapacityResponse(record));
    }

    public async Task<ServiceProviderResult<ProviderCapacityResponse>> UpdateCapacityAsync(string userId, UpdateProviderCapacityRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return ServiceProviderResult<ProviderCapacityResponse>.NotFound("Service provider profile not found.");
        var (_, record) = await _migrator.EnsureMigratedAsync(user);

        // CurrentActiveOrders is NOT client-settable — only Module 4 writes it.
        record.MaximumConcurrentOrders = Math.Max(0, request.MaximumConcurrentOrders);
        record.NewOrderAvailability = request.NewOrderAvailability;
        record.ManualApprovalWhenCapacityLow = request.ManualApprovalWhenCapacityLow;
        record.UpdatedAt = DateTime.UtcNow;

        // The audited legacy path ignored the write result; the store reports it.
        if (!await _spStore.UpsertAsync(record))
            return ServiceProviderResult<ProviderCapacityResponse>.Conflict("Capacity could not be saved. Try again.");
        return ServiceProviderResult<ProviderCapacityResponse>.Ok(ToCapacityResponse(record), "Capacity updated.");
    }

    // ---------------- Pricing guidance (deterministic, no AI) ----------------

    public ServiceProviderResult<PricingGuidanceResponse> GetPricingGuidance(string category, string? pricingModel)
    {
        if (!TryEnum<ServiceCategory>(category, out var cat))
            return ServiceProviderResult<PricingGuidanceResponse>.Conflict("Unknown service category.");

        PricingModel? model = null;
        if (!string.IsNullOrWhiteSpace(pricingModel))
        {
            if (!TryEnum<PricingModel>(pricingModel, out var pm))
                return ServiceProviderResult<PricingGuidanceResponse>.Conflict("Unknown pricing model.");
            model = pm;
        }

        var range = PricingGuidance.Suggest(cat, model);
        return ServiceProviderResult<PricingGuidanceResponse>.Ok(new PricingGuidanceResponse
        {
            Category = cat.ToString(),
            PricingModel = model?.ToString(),
            Min = range.Min,
            Max = range.Max,
            Currency = range.Currency,
        });
    }

    // ---------------- Analytics counters (call sites are Module 3) ----------------

    public async Task<ServiceProviderResult<bool>> RecordImpressionAsync(string listingId)
    {
        var res = await _db.ServiceListings.UpdateOneAsync(
            l => l.Id == listingId,
            Builders<ServiceListing>.Update.Inc(l => l.Impressions, 1));
        return res.MatchedCount == 0
            ? ServiceProviderResult<bool>.NotFound("Service listing not found.")
            : ServiceProviderResult<bool>.Ok(true);
    }

    public async Task<ServiceProviderResult<bool>> RecordClickAsync(string listingId)
    {
        var res = await _db.ServiceListings.UpdateOneAsync(
            l => l.Id == listingId,
            Builders<ServiceListing>.Update.Inc(l => l.Clicks, 1));
        return res.MatchedCount == 0
            ? ServiceProviderResult<bool>.NotFound("Service listing not found.")
            : ServiceProviderResult<bool>.Ok(true);
    }

    // ---------------- Helpers ----------------

    private static ProviderCapacityResponse ToCapacityResponse(ServiceProviderProfileRecord p)
    {
        var max = p.MaximumConcurrentOrders;
        var cur = p.CurrentActiveOrders;
        var instant = p.NewOrderAvailability && (max <= 0 || cur < max);
        string status;
        if (!p.NewOrderAvailability) status = "Unavailable";
        else if (max <= 0) status = "Available";
        else if (cur >= max) status = "FullyBooked";
        else if (cur * 5 >= max * 4) status = "Limited"; // >= 80% of capacity
        else status = "Available";

        return new ProviderCapacityResponse
        {
            MaximumConcurrentOrders = max,
            CurrentActiveOrders = cur,
            NewOrderAvailability = p.NewOrderAvailability,
            ManualApprovalWhenCapacityLow = p.ManualApprovalWhenCapacityLow,
            CapacityStatus = status,
            InstantOrderAvailable = instant,
        };
    }

    private async Task<ServiceListing?> FindOwnedListingAsync(string userId, string listingId) =>
        await _db.ServiceListings.Find(l => l.Id == listingId && l.ProviderId == userId).FirstOrDefaultAsync();

    private async Task<ServicePackage?> FindOwnedPackageAsync(string userId, string packageId)
    {
        var pkg = await _db.ServicePackages.Find(p => p.Id == packageId).FirstOrDefaultAsync();
        if (pkg is null) return null;
        var owned = await _db.ServiceListings.Find(l => l.Id == pkg.ServiceId && l.ProviderId == userId).AnyAsync();
        return owned ? pkg : null;
    }

    private async Task<ServiceFAQ?> FindOwnedFaqAsync(string userId, string faqId)
    {
        var faq = await _db.ServiceFAQs.Find(f => f.Id == faqId).FirstOrDefaultAsync();
        if (faq is null) return null;
        var owned = await _db.ServiceListings.Find(l => l.Id == faq.ServiceId && l.ProviderId == userId).AnyAsync();
        return owned ? faq : null;
    }

    private static bool TryEnum<T>(string value, out T parsed) where T : struct, Enum =>
        Enum.TryParse(value?.Trim(), ignoreCase: true, out parsed) && Enum.IsDefined(parsed);

    private static List<string> Normalize(IEnumerable<string> values)
    {
        var result = new List<string>();
        if (values is null) return result;
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var raw in values)
        {
            var t = raw?.Trim();
            if (string.IsNullOrEmpty(t)) continue;
            if (seen.Add(t)) result.Add(t);
        }
        return result;
    }

    private static int TierRank(PackageType t) => t switch
    {
        PackageType.Basic => 1,
        PackageType.Standard => 2,
        PackageType.Premium => 3,
        _ => 0, // Custom — not part of the public tier ladder
    };

    // Normalize a package's delivery time to comparable days (unit only; day-type ignored).
    private static double DeliveryDays(ServicePackage p) => p.DeliveryTimeUnit switch
    {
        DeliveryTimeUnit.Hours => p.DeliveryTimeValue / 24.0,
        DeliveryTimeUnit.Weeks => p.DeliveryTimeValue * 7.0,
        _ => p.DeliveryTimeValue,
    };

    // Deterministic FAQ-vs-package conflict heuristic (§6.5): if the answer states a
    // revision count that disagrees with the scoped package, flag it. Package terms are
    // the source of truth; the system never auto-edits the FAQ. No AI.
    private static string? DetectFaqConflict(ServiceFAQ faq, List<ServicePackage> packages)
    {
        if (string.IsNullOrEmpty(faq.PackageId)) return null;
        var pkg = packages.FirstOrDefault(p => p.Id == faq.PackageId);
        if (pkg is null || pkg.UnlimitedRevisions) return null;

        var m = System.Text.RegularExpressions.Regex.Match(faq.Answer ?? "", @"(\d+)\s+revision", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        if (m.Success && int.TryParse(m.Groups[1].Value, out var stated) && stated != pkg.IncludedRevisionCount)
            return "This FAQ does not match the selected package settings.";
        return null;
    }

    // -------- Gallery & Video (Service Listing media, atomic writes) --------

    public async Task<ServiceProviderResult<ServiceListingResponse>> UploadGalleryImageAsync(string userId, string listingId, IFormFile file)
    {
        const long maxBytes = 8 * 1024 * 1024; // 8 MB

        var listing = await FindOwnedListingAsync(userId, listingId);
        if (listing is null)
            return ServiceProviderResult<ServiceListingResponse>.NotFound("Service listing not found.");

        if (file.Length > maxBytes)
            return ServiceProviderResult<ServiceListingResponse>.Invalid($"Image must be smaller than 8 MB. Your file is {(file.Length / 1024 / 1024.0):F1} MB.");

        string publicUrl;
        try
        {
            publicUrl = await _saveFile.SaveFileAsync(file, "service-catalog/gallery");
        }
        catch (ArgumentException ex)
        {
            return ServiceProviderResult<ServiceListingResponse>.Invalid(ex.Message);
        }

        var galleryImage = new GalleryImage
        {
            Id = Guid.NewGuid().ToString(),
            StorageKey = publicUrl,
            PublicUrl = publicUrl,
            ContentType = file.ContentType,
            Bytes = file.Length,
            DisplayOrder = listing.GalleryImages.Count,
            UploadedAt = DateTime.UtcNow,
        };

        // Atomic append with cap check: only succeed if array size < 20 before push
        var update = Builders<ServiceListing>.Update
            .Push(l => l.GalleryImages, galleryImage)
            .Set(l => l.UpdatedAt, DateTime.UtcNow);

        var result = await _db.ServiceListings.FindOneAndUpdateAsync(
            Builders<ServiceListing>.Filter.And(
                Builders<ServiceListing>.Filter.Eq(l => l.Id, listingId),
                Builders<ServiceListing>.Filter.Eq(l => l.ProviderId, userId),
                Builders<ServiceListing>.Filter.Size(l => l.GalleryImages, listing.GalleryImages.Count) // Verify array size hasn't changed since read
            ),
            update,
            new FindOneAndUpdateOptions<ServiceListing> { ReturnDocument = ReturnDocument.After }
        );

        if (result is null)
            return ServiceProviderResult<ServiceListingResponse>.Conflict("Gallery is limited to 20 images. The limit may have been reached while uploading.");

        _logger.LogInformation("Gallery image uploaded for listing {ListingId} by user {UserId}", listingId, userId);
        return ServiceProviderResult<ServiceListingResponse>.Ok(result.ToResponse(), "Image added to gallery.");
    }

    public async Task<ServiceProviderResult<ServiceListingResponse>> DeleteGalleryImageAsync(string userId, string listingId, string imageId)
    {
        var listing = await FindOwnedListingAsync(userId, listingId);
        if (listing is null)
            return ServiceProviderResult<ServiceListingResponse>.NotFound("Service listing not found.");

        var image = listing.GalleryImages.FirstOrDefault(i => i.Id == imageId);
        if (image is null)
            return ServiceProviderResult<ServiceListingResponse>.NotFound("Gallery image not found.");

        var update = Builders<ServiceListing>.Update
            .PullFilter(l => l.GalleryImages, Builders<GalleryImage>.Filter.Eq(i => i.Id, imageId))
            .Set(l => l.UpdatedAt, DateTime.UtcNow);

        var result = await _db.ServiceListings.FindOneAndUpdateAsync(
            Builders<ServiceListing>.Filter.And(
                Builders<ServiceListing>.Filter.Eq(l => l.Id, listingId),
                Builders<ServiceListing>.Filter.Eq(l => l.ProviderId, userId)
            ),
            update,
            new FindOneAndUpdateOptions<ServiceListing> { ReturnDocument = ReturnDocument.After }
        );

        if (result is null)
            return ServiceProviderResult<ServiceListingResponse>.Conflict("Could not remove image.");

        // Best-effort file deletion using shared cleanup helper
        ProviderMediaFiles.DeleteBestEffort(image.PublicUrl, _logger, _jobClient);

        return ServiceProviderResult<ServiceListingResponse>.Ok(result.ToResponse(), "Image removed from gallery.");
    }

    public async Task<ServiceProviderResult<ServiceListingResponse>> UploadPreviewVideoAsync(string userId, string listingId, IFormFile file)
    {
        const long maxBytes = 50 * 1024 * 1024; // 50 MB
        const int maxSeconds = 60;

        var listing = await FindOwnedListingAsync(userId, listingId);
        if (listing is null)
            return ServiceProviderResult<ServiceListingResponse>.NotFound("Service listing not found.");

        if (file.Length > maxBytes)
            return ServiceProviderResult<ServiceListingResponse>.Invalid($"Video must be smaller than 50 MB. Your file is {(file.Length / 1024 / 1024.0):F1} MB.");

        if (!file.ContentType.StartsWith("video/"))
            return ServiceProviderResult<ServiceListingResponse>.Invalid("Only video files are accepted.");

        // Server-side video duration validation using TagLib
        int videoDurationSeconds;
        try
        {
            var tempPath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString() + Path.GetExtension(file.FileName));
            try
            {
                using (var stream = file.OpenReadStream())
                using (var tempFile = System.IO.File.Create(tempPath))
                {
                    await stream.CopyToAsync(tempFile);
                }

                var tagFile = TagLib.File.Create(tempPath);
                videoDurationSeconds = (int)tagFile.Properties.Duration.TotalSeconds;
            }
            finally
            {
                if (System.IO.File.Exists(tempPath))
                    try { System.IO.File.Delete(tempPath); } catch { }
            }
        }
        catch (TagLib.UnsupportedFormatException)
        {
            return ServiceProviderResult<ServiceListingResponse>.Invalid("Unsupported video format. Please upload an MP4, WebM, or other common video format.");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to inspect video duration for {FileName}", file.FileName);
            return ServiceProviderResult<ServiceListingResponse>.Invalid("Unable to verify video format. Please ensure the file is a valid video.");
        }

        if (videoDurationSeconds > maxSeconds)
            return ServiceProviderResult<ServiceListingResponse>.Invalid($"Video must be shorter than 60 seconds. Your video is {videoDurationSeconds} seconds.");

        string publicUrl;
        try
        {
            publicUrl = await _saveFile.SaveFileAsync(file, "service-catalog/preview-video");
        }
        catch (ArgumentException ex)
        {
            return ServiceProviderResult<ServiceListingResponse>.Invalid(ex.Message);
        }

        var previewVideo = new PreviewVideo
        {
            StorageKey = publicUrl,
            PublicUrl = publicUrl,
            ContentType = file.ContentType,
            Bytes = file.Length,
            DurationSeconds = videoDurationSeconds,
            Sha256 = "", // Would be computed from file
            UploadedAt = DateTime.UtcNow,
        };

        var update = Builders<ServiceListing>.Update
            .Set(l => l.PreviewVideo, previewVideo)
            .Set(l => l.UpdatedAt, DateTime.UtcNow);

        var result = await _db.ServiceListings.FindOneAndUpdateAsync(
            Builders<ServiceListing>.Filter.And(
                Builders<ServiceListing>.Filter.Eq(l => l.Id, listingId),
                Builders<ServiceListing>.Filter.Eq(l => l.ProviderId, userId)
            ),
            update,
            new FindOneAndUpdateOptions<ServiceListing> { ReturnDocument = ReturnDocument.After }
        );

        if (result is null)
            return ServiceProviderResult<ServiceListingResponse>.Conflict("Could not save preview video.");

        _logger.LogInformation("Preview video uploaded for listing {ListingId} by user {UserId}", listingId, userId);
        return ServiceProviderResult<ServiceListingResponse>.Ok(result.ToResponse(), "Preview video saved.");
    }

    public async Task<ServiceProviderResult<ServiceListingResponse>> DeletePreviewVideoAsync(string userId, string listingId)
    {
        var listing = await FindOwnedListingAsync(userId, listingId);
        if (listing is null)
            return ServiceProviderResult<ServiceListingResponse>.NotFound("Service listing not found.");

        if (listing.PreviewVideo is null)
            return ServiceProviderResult<ServiceListingResponse>.Ok(listing.ToResponse(), "No preview video was set.");

        var previousVideo = listing.PreviewVideo;

        var update = Builders<ServiceListing>.Update
            .Set(l => l.PreviewVideo, (PreviewVideo?)null)
            .Set(l => l.UpdatedAt, DateTime.UtcNow);

        var result = await _db.ServiceListings.FindOneAndUpdateAsync(
            Builders<ServiceListing>.Filter.And(
                Builders<ServiceListing>.Filter.Eq(l => l.Id, listingId),
                Builders<ServiceListing>.Filter.Eq(l => l.ProviderId, userId)
            ),
            update,
            new FindOneAndUpdateOptions<ServiceListing> { ReturnDocument = ReturnDocument.After }
        );

        if (result is null)
            return ServiceProviderResult<ServiceListingResponse>.Conflict("Could not remove preview video.");

        // Best-effort file deletion using shared cleanup helper
        ProviderMediaFiles.DeleteBestEffort(previousVideo.PublicUrl, _logger, _jobClient);

        return ServiceProviderResult<ServiceListingResponse>.Ok(result.ToResponse(), "Preview video removed.");
    }
}
