using Hangfire;
using Microsoft.AspNetCore.Identity;
using MongoDB.Driver;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Audit;
using WebApp.Services.Interface;
using WebApp.Services.Migrations;

namespace WebApp.Services.Implementations;

/// <summary>Wraps processed image bytes as an IFormFile for SaveFile.SaveFileAsync compatibility.</summary>
internal sealed class ProcessedImageFormFile : IFormFile
{
    private readonly MemoryStream _stream;

    public ProcessedImageFormFile(ProcessedProviderImage image)
    {
        _stream = new MemoryStream(image.Content);
        Name = "file";
        FileName = $"upload{image.Extension}";
        ContentType = image.ContentType;
        ContentDisposition = $"form-data; name=\"{Name}\"; filename=\"{FileName}\"";
        Headers = new HeaderDictionary();
        Length = image.Content.Length;
    }

    public string ContentType { get; }
    public string ContentDisposition { get; }
    public IHeaderDictionary Headers { get; }
    public long Length { get; }
    public string Name { get; }
    public string FileName { get; }

    public Stream OpenReadStream() => _stream;

    public void CopyTo(Stream target) => _stream.CopyTo(target);
    public async Task CopyToAsync(Stream target, CancellationToken cancellationToken = default) =>
        await _stream.CopyToAsync(target, cancellationToken);

    public void Dispose() => _stream?.Dispose();
}

/// <summary>
/// Provider media on the split collections: profile/cover images live on
/// ProfessionalProfiles; portfolio images live with their items on
/// ServiceProviderProfiles. File bytes stay on disk via the existing SaveFile —
/// only references and metadata are stored, never binary or Base64. The exact SP
/// media policies are unchanged (profile 5 MB, cover 8 MB, portfolio 8 MB;
/// JPEG/PNG/WebP only).
/// </summary>
public sealed class ServiceProviderMediaService(
    UserManager<ApplicationUser> userManager,
    IProfessionalProfileStore professionalStore,
    IServiceProviderProfileStore spStore,
    IUserCredentialStore credentialStore,
    IServiceProviderProfileSplitMigration migrator,
    IProviderImageProcessor imageProcessor,
    SaveFile saveFile,
    IFileSecurityScanner scanner,
    IAuditLogger audit,
    IBackgroundJobClient jobClient,
    IMongoDatabase mongoDb,
    ILogger<ServiceProviderMediaService> logger) : IServiceProviderMediaService
{
    private const long ProfileMaximumBytes = 5 * 1024 * 1024;
    private const long CoverMaximumBytes = 8 * 1024 * 1024;
    private const long PortfolioMaximumBytes = 8 * 1024 * 1024;

    public Task<ServiceProviderResult<ServiceProviderProfileResponse>> UploadProfileMediaAsync(
        string userId,
        ProviderProfileMediaKind kind,
        IFormFile file,
        CancellationToken cancellationToken = default) =>
        ReplaceProfileMediaAsync(userId, kind, file, cancellationToken);

    public async Task<ServiceProviderResult<ServiceProviderProfileResponse>> RemoveProfileMediaAsync(
        string userId,
        ProviderProfileMediaKind kind,
        CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return NotFound();

        var isSp = await userManager.IsInRoleAsync(user, "ServiceProvider");
        ProfessionalProfileRecord professional;
        ServiceProviderProfileRecord? sp = null;
        if (isSp)
        {
            var (prof, serviceProvider) = await migrator.EnsureMigratedAsync(user, cancellationToken);
            professional = prof;
            sp = serviceProvider;
        }
        else
        {
            professional = await migrator.EnsureProfessionalProfileAsync(user, cancellationToken);
        }

        var previous = kind == ProviderProfileMediaKind.ProfileImage ? professional.ProfileImage : professional.CoverImage;
        if (previous is null)
            return Ok(await ComposeAsync(professional, sp, userId, cancellationToken), "No image was set.");

        if (kind == ProviderProfileMediaKind.ProfileImage) professional.ProfileImage = null;
        else professional.CoverImage = null;
        professional.UpdatedAt = DateTime.UtcNow;

        if (!await professionalStore.UpsertAsync(professional, cancellationToken: cancellationToken))
        {
            if (kind == ProviderProfileMediaKind.ProfileImage) professional.ProfileImage = previous;
            else professional.CoverImage = previous;
            return ServiceProviderResult<ServiceProviderProfileResponse>.Conflict("The image could not be removed.");
        }

        await DeleteBestEffort(previous.PublicUrl ?? "", cancellationToken);
        audit.Record("ServiceProviderMedia.Remove", userId, true, new { kind = kind.ToString(), assetId = previous.Id });
        return Ok(await ComposeAsync(professional, sp, userId, cancellationToken), "Image removed.");
    }

    public async Task<ServiceProviderResult<ServiceProviderProfileResponse>> UploadPortfolioImageAsync(
        string userId,
        string portfolioItemId,
        IFormFile file,
        string? caption,
        CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return NotFound();
        var (professional, sp) = await migrator.EnsureMigratedAsync(user, cancellationToken);

        ServiceProviderService.EnsurePortfolioItemIds(sp.PortfolioItems);
        var item = sp.PortfolioItems.FirstOrDefault(value => value.Id == portfolioItemId);
        if (item is null) return ServiceProviderResult<ServiceProviderProfileResponse>.NotFound("Portfolio item not found.");

        string? normalizedCaption;
        try { normalizedCaption = NormalizeCaption(caption); }
        catch (ArgumentException exception) { return ServiceProviderResult<ServiceProviderProfileResponse>.Invalid(exception.Message); }

        var processed = await Process(file, PortfolioMaximumBytes, cancellationToken);
        if (processed.Error is not null) return ServiceProviderResult<ServiceProviderProfileResponse>.Invalid(processed.Error);

        string? publicUrl = null;
        try
        {
            var formFile = new ProcessedImageFormFile(processed.Image!);
            publicUrl = await saveFile.SaveFileAsync(formFile, "service-provider/portfolio");
        }
        catch (ArgumentException ex)
        {
            return ServiceProviderResult<ServiceProviderProfileResponse>.Invalid(ex.Message);
        }

        var next = Asset(processed.Image!, publicUrl);
        var previous = item.PrimaryImage;
        var previousLegacyPath = item.ImagePath;
        item.PrimaryImage = next;
        item.ImagePath = null;
        item.ImageCaption = normalizedCaption;
        sp.UpdatedAt = DateTime.UtcNow;

        if (!await spStore.UpsertAsync(sp, cancellationToken: cancellationToken))
        {
            item.PrimaryImage = previous;
            item.ImagePath = previousLegacyPath;
            await DeleteBestEffort(publicUrl ?? "", cancellationToken);
            return ServiceProviderResult<ServiceProviderProfileResponse>.Conflict("The portfolio image could not be saved.");
        }

        if (previous is not null) await DeleteBestEffort(previous.PublicUrl ?? "", cancellationToken);
        audit.Record("ServiceProviderMedia.Portfolio.Replace", userId, true, new { portfolioItemId, assetId = next.Id });
        return Ok(await ComposeAsync(professional, sp, userId, cancellationToken), "Portfolio image saved.");
    }

    public async Task<ServiceProviderResult<ServiceProviderProfileResponse>> RemovePortfolioImageAsync(
        string userId,
        string portfolioItemId,
        CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return NotFound();
        var (professional, sp) = await migrator.EnsureMigratedAsync(user, cancellationToken);

        ServiceProviderService.EnsurePortfolioItemIds(sp.PortfolioItems);
        var item = sp.PortfolioItems.FirstOrDefault(value => value.Id == portfolioItemId);
        if (item is null) return ServiceProviderResult<ServiceProviderProfileResponse>.NotFound("Portfolio item not found.");

        var previous = item.PrimaryImage;
        var previousLegacyPath = item.ImagePath;
        if (previous is null && string.IsNullOrWhiteSpace(previousLegacyPath))
            return Ok(await ComposeAsync(professional, sp, userId, cancellationToken), "No portfolio image was set.");

        item.PrimaryImage = null;
        item.ImagePath = null;
        sp.UpdatedAt = DateTime.UtcNow;

        if (!await spStore.UpsertAsync(sp, cancellationToken: cancellationToken))
        {
            item.PrimaryImage = previous;
            item.ImagePath = previousLegacyPath;
            return ServiceProviderResult<ServiceProviderProfileResponse>.Conflict("The portfolio image could not be removed.");
        }

        if (previous is not null) await DeleteBestEffort(previous.PublicUrl ?? "", cancellationToken);
        audit.Record("ServiceProviderMedia.Portfolio.Remove", userId, true, new { portfolioItemId, assetId = previous?.Id });
        return Ok(await ComposeAsync(professional, sp, userId, cancellationToken), "Portfolio image removed.");
    }

    private async Task<ServiceProviderResult<ServiceProviderProfileResponse>> ReplaceProfileMediaAsync(
        string userId,
        ProviderProfileMediaKind kind,
        IFormFile file,
        CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return NotFound();

        var isSp = await userManager.IsInRoleAsync(user, "ServiceProvider");
        ProfessionalProfileRecord professional;
        ServiceProviderProfileRecord? sp = null;
        if (isSp)
        {
            var (prof, serviceProvider) = await migrator.EnsureMigratedAsync(user, cancellationToken);
            professional = prof;
            sp = serviceProvider;
        }
        else
        {
            professional = await migrator.EnsureProfessionalProfileAsync(user, cancellationToken);
        }

        var maximum = kind == ProviderProfileMediaKind.ProfileImage ? ProfileMaximumBytes : CoverMaximumBytes;
        var processed = await Process(file, maximum, cancellationToken);
        if (processed.Error is not null) return ServiceProviderResult<ServiceProviderProfileResponse>.Invalid(processed.Error);

        var folder = kind == ProviderProfileMediaKind.ProfileImage ? "service-provider/profile" : "service-provider/cover";
        string? publicUrl = null;
        try
        {
            var formFile = new ProcessedImageFormFile(processed.Image!);
            publicUrl = await saveFile.SaveFileAsync(formFile, folder);
        }
        catch (ArgumentException ex)
        {
            return ServiceProviderResult<ServiceProviderProfileResponse>.Invalid(ex.Message);
        }

        var next = Asset(processed.Image!, publicUrl);
        var previous = kind == ProviderProfileMediaKind.ProfileImage ? professional.ProfileImage : professional.CoverImage;
        if (kind == ProviderProfileMediaKind.ProfileImage) professional.ProfileImage = next;
        else professional.CoverImage = next;
        professional.UpdatedAt = DateTime.UtcNow;

        if (!await professionalStore.UpsertAsync(professional, cancellationToken: cancellationToken))
        {
            if (kind == ProviderProfileMediaKind.ProfileImage) professional.ProfileImage = previous;
            else professional.CoverImage = previous;
            await DeleteBestEffort(publicUrl ?? "", cancellationToken);
            return ServiceProviderResult<ServiceProviderProfileResponse>.Conflict("The image could not be saved.");
        }

        if (previous is not null) await DeleteBestEffort(previous.PublicUrl ?? "", cancellationToken);
        audit.Record("ServiceProviderMedia.Replace", userId, true, new { kind = kind.ToString(), assetId = next.Id });
        return Ok(await ComposeAsync(professional, sp, userId, cancellationToken), "Image saved.");
    }

    private async Task<(ProcessedProviderImage? Image, string? Error)> Process(
        IFormFile file,
        long maximumBytes,
        CancellationToken cancellationToken)
    {
        try
        {
            var scan = await scanner.ScanAsync(file, cancellationToken);
            if (!scan.Passed) return (null, scan.Error ?? "The image failed basic file validation.");
            return (await imageProcessor.ProcessAsync(file, maximumBytes, cancellationToken), null);
        }
        catch (ArgumentException exception)
        {
            return (null, exception.Message);
        }
    }

    private static ProviderMediaAsset Asset(ProcessedProviderImage image, string publicUrl) => new()
    {
        StorageKey = publicUrl,
        PublicUrl = publicUrl,
        ContentType = image.ContentType,
        Width = image.Width,
        Height = image.Height,
        Bytes = image.Content.LongLength,
        Sha256 = image.Sha256,
        UploadedAt = DateTime.UtcNow,
    };

    private static string? NormalizeCaption(string? caption)
    {
        var value = string.IsNullOrWhiteSpace(caption) ? null : caption.Trim();
        if (value?.Length > 300) throw new ArgumentException("Image description must be 300 characters or fewer.");
        return value;
    }

    private async Task<ServiceProviderProfileResponse> ComposeAsync(
        ProfessionalProfileRecord professional,
        ServiceProviderProfileRecord? sp,
        string userId,
        CancellationToken cancellationToken)
    {
        if (sp is null)
        {
            var appUser = await userManager.FindByIdAsync(userId);
            var memorySp = appUser is not null
                ? SpProfileSplitMapper.ToServiceProviderRecord(appUser)
                : new ServiceProviderProfileRecord { UserId = userId, ProviderId = userId };
            return SpProfileSplitMapper.ToCompositeView(professional, memorySp, []).ToResponse();
        }
        var credentials = await credentialStore.GetByUserIdAsync(userId, cancellationToken);
        return SpProfileSplitMapper.ToCompositeView(professional, sp, credentials).ToResponse();
    }

    private static ServiceProviderResult<ServiceProviderProfileResponse> NotFound() =>
        ServiceProviderResult<ServiceProviderProfileResponse>.NotFound("Service provider profile not found.");

    private static ServiceProviderResult<ServiceProviderProfileResponse> Ok(
        ServiceProviderProfileResponse response, string message) =>
        ServiceProviderResult<ServiceProviderProfileResponse>.Ok(response, message);

    private Task DeleteBestEffort(string publicUrl, CancellationToken cancellationToken)
    {
        ProviderMediaFiles.DeleteBestEffort(publicUrl, logger, jobClient);
        return Task.CompletedTask;
    }

    // ---- Service Listing Gallery Images & Preview Video (mirrors profile-media pattern) ----
    private const long GalleryImageMaximumBytes = 8 * 1024 * 1024; // 8 MB
    private const long PreviewVideoMaximumBytes = 50 * 1024 * 1024; // 50 MB
    private const int PreviewVideoMaximumSeconds = 60;
    private const int GalleryImageCapLimit = 20;

    public async Task<ServiceProviderResult<GalleryImageResponse>> UploadListingGalleryImageAsync(
        string userId,
        string listingId,
        IFormFile file,
        CancellationToken cancellationToken)
    {
        var listing = await mongoDb.GetCollection<ServiceListing>("ServiceListings")
            .Find(l => l.Id == listingId && l.ProviderId == userId)
            .FirstOrDefaultAsync(cancellationToken);
        if (listing is null)
            return ServiceProviderResult<GalleryImageResponse>.NotFound("Service listing not found.");

        if (file.Length > GalleryImageMaximumBytes)
            return ServiceProviderResult<GalleryImageResponse>.Invalid($"Image must be smaller than 8 MB. Your file is {(file.Length / 1024 / 1024.0):F1} MB.");

        if (listing.GalleryImages.Count >= GalleryImageCapLimit)
            return ServiceProviderResult<GalleryImageResponse>.Conflict("Gallery is limited to 20 images.");

        string publicUrl;
        try
        {
            publicUrl = await saveFile.SaveFileAsync(file, "service-provider/gallery");
        }
        catch (ArgumentException ex)
        {
            return ServiceProviderResult<GalleryImageResponse>.Invalid(ex.Message);
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

        var result = await mongoDb.GetCollection<ServiceListing>("ServiceListings").FindOneAndUpdateAsync(
            Builders<ServiceListing>.Filter.And(
                Builders<ServiceListing>.Filter.Eq(l => l.Id, listingId),
                Builders<ServiceListing>.Filter.Eq(l => l.ProviderId, userId),
                Builders<ServiceListing>.Filter.Or(
                    Builders<ServiceListing>.Filter.Exists(l => l.GalleryImages, false),
                    Builders<ServiceListing>.Filter.SizeLt(l => l.GalleryImages, GalleryImageCapLimit)
                )
            ),
            Builders<ServiceListing>.Update
                .Push(l => l.GalleryImages, galleryImage)
                .Set(l => l.UpdatedAt, DateTime.UtcNow),
            new FindOneAndUpdateOptions<ServiceListing> { ReturnDocument = ReturnDocument.After },
            cancellationToken);

        if (result is null)
            return ServiceProviderResult<GalleryImageResponse>.Conflict("Gallery is limited to 20 images. The limit may have been reached while uploading.");

        logger.LogInformation("Gallery image uploaded for listing {ListingId} by user {UserId}", listingId, userId);
        return ServiceProviderResult<GalleryImageResponse>.Ok(galleryImage.ToResponse(), "Image added to gallery.");
    }

    public async Task<ServiceProviderResult<ServiceListingResponse>> DeleteListingGalleryImageAsync(
        string userId,
        string listingId,
        string imageId,
        CancellationToken cancellationToken)
    {
        var listing = await mongoDb.GetCollection<ServiceListing>("ServiceListings")
            .Find(l => l.Id == listingId && l.ProviderId == userId)
            .FirstOrDefaultAsync(cancellationToken);
        if (listing is null)
            return ServiceProviderResult<ServiceListingResponse>.NotFound("Service listing not found.");

        var image = listing.GalleryImages.FirstOrDefault(i => i.Id == imageId);
        if (image is null)
            return ServiceProviderResult<ServiceListingResponse>.NotFound("Gallery image not found.");

        var result = await mongoDb.GetCollection<ServiceListing>("ServiceListings").FindOneAndUpdateAsync(
            Builders<ServiceListing>.Filter.And(
                Builders<ServiceListing>.Filter.Eq(l => l.Id, listingId),
                Builders<ServiceListing>.Filter.Eq(l => l.ProviderId, userId)
            ),
            Builders<ServiceListing>.Update
                .PullFilter(l => l.GalleryImages, Builders<GalleryImage>.Filter.Eq(i => i.Id, imageId))
                .Set(l => l.UpdatedAt, DateTime.UtcNow),
            new FindOneAndUpdateOptions<ServiceListing> { ReturnDocument = ReturnDocument.After },
            cancellationToken);

        if (result is null)
            return ServiceProviderResult<ServiceListingResponse>.Conflict("Could not remove image.");

        ProviderMediaFiles.DeleteBestEffort(image.PublicUrl, logger, jobClient);
        return ServiceProviderResult<ServiceListingResponse>.Ok(result.ToResponse(), "Image removed from gallery.");
    }

    public async Task<ServiceProviderResult<PreviewVideoResponse>> UploadListingPreviewVideoAsync(
        string userId,
        string listingId,
        IFormFile file,
        CancellationToken cancellationToken)
    {
        var listing = await mongoDb.GetCollection<ServiceListing>("ServiceListings")
            .Find(l => l.Id == listingId && l.ProviderId == userId)
            .FirstOrDefaultAsync(cancellationToken);
        if (listing is null)
            return ServiceProviderResult<PreviewVideoResponse>.NotFound("Service listing not found.");

        if (file.Length > PreviewVideoMaximumBytes)
            return ServiceProviderResult<PreviewVideoResponse>.Invalid($"Video must be smaller than 50 MB. Your file is {(file.Length / 1024 / 1024.0):F1} MB.");

        if (!file.ContentType.StartsWith("video/"))
            return ServiceProviderResult<PreviewVideoResponse>.Invalid("Only video files are accepted.");

        int videoDurationSeconds;
        try
        {
            var tempPath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString() + Path.GetExtension(file.FileName));
            try
            {
                using (var stream = file.OpenReadStream())
                using (var tempFile = System.IO.File.Create(tempPath))
                {
                    await stream.CopyToAsync(tempFile, cancellationToken);
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
            return ServiceProviderResult<PreviewVideoResponse>.Invalid("Unsupported video format. Please upload an MP4, WebM, or other common video format.");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to inspect video duration for {FileName}", file.FileName);
            return ServiceProviderResult<PreviewVideoResponse>.Invalid("Unable to verify video format. Please ensure the file is a valid video.");
        }

        if (videoDurationSeconds > PreviewVideoMaximumSeconds)
            return ServiceProviderResult<PreviewVideoResponse>.Invalid($"Video must be shorter than 60 seconds. Your video is {videoDurationSeconds} seconds.");

        string publicUrl;
        try
        {
            publicUrl = await saveFile.SaveFileAsync(file, "service-provider/preview-video");
        }
        catch (ArgumentException ex)
        {
            return ServiceProviderResult<PreviewVideoResponse>.Invalid(ex.Message);
        }

        var previewVideo = new PreviewVideo
        {
            StorageKey = publicUrl,
            PublicUrl = publicUrl,
            ContentType = file.ContentType,
            Bytes = file.Length,
            DurationSeconds = videoDurationSeconds,
            Sha256 = "",
            UploadedAt = DateTime.UtcNow,
        };

        var result = await mongoDb.GetCollection<ServiceListing>("ServiceListings").FindOneAndUpdateAsync(
            Builders<ServiceListing>.Filter.And(
                Builders<ServiceListing>.Filter.Eq(l => l.Id, listingId),
                Builders<ServiceListing>.Filter.Eq(l => l.ProviderId, userId)
            ),
            Builders<ServiceListing>.Update
                .Set(l => l.PreviewVideo, previewVideo)
                .Set(l => l.UpdatedAt, DateTime.UtcNow),
            new FindOneAndUpdateOptions<ServiceListing> { ReturnDocument = ReturnDocument.After },
            cancellationToken);

        if (result is null)
            return ServiceProviderResult<PreviewVideoResponse>.Conflict("Could not save preview video.");

        logger.LogInformation("Preview video uploaded for listing {ListingId} by user {UserId}", listingId, userId);
        return ServiceProviderResult<PreviewVideoResponse>.Ok(previewVideo.ToResponse(), "Preview video saved.");
    }

    public async Task<ServiceProviderResult<ServiceListingResponse>> DeleteListingPreviewVideoAsync(
        string userId,
        string listingId,
        CancellationToken cancellationToken)
    {
        var listing = await mongoDb.GetCollection<ServiceListing>("ServiceListings")
            .Find(l => l.Id == listingId && l.ProviderId == userId)
            .FirstOrDefaultAsync(cancellationToken);
        if (listing is null)
            return ServiceProviderResult<ServiceListingResponse>.NotFound("Service listing not found.");

        if (listing.PreviewVideo is null)
            return ServiceProviderResult<ServiceListingResponse>.Ok(listing.ToResponse(), "No preview video was set.");

        var result = await mongoDb.GetCollection<ServiceListing>("ServiceListings").FindOneAndUpdateAsync(
            Builders<ServiceListing>.Filter.And(
                Builders<ServiceListing>.Filter.Eq(l => l.Id, listingId),
                Builders<ServiceListing>.Filter.Eq(l => l.ProviderId, userId)
            ),
            Builders<ServiceListing>.Update
                .Unset(l => l.PreviewVideo)
                .Set(l => l.UpdatedAt, DateTime.UtcNow),
            new FindOneAndUpdateOptions<ServiceListing> { ReturnDocument = ReturnDocument.After },
            cancellationToken);

        if (result is null)
            return ServiceProviderResult<ServiceListingResponse>.Conflict("Could not remove preview video.");

        if (listing.PreviewVideo?.PublicUrl is not null)
            ProviderMediaFiles.DeleteBestEffort(listing.PreviewVideo.PublicUrl, logger, jobClient);
        return ServiceProviderResult<ServiceListingResponse>.Ok(result.ToResponse(), "Preview video removed.");
    }
}
