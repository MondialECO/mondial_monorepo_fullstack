using Microsoft.AspNetCore.Identity;
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
        var (professional, sp) = await migrator.EnsureMigratedAsync(user, cancellationToken);

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
        var (professional, sp) = await migrator.EnsureMigratedAsync(user, cancellationToken);

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
        ServiceProviderProfileRecord sp,
        string userId,
        CancellationToken cancellationToken)
    {
        var credentials = await credentialStore.GetByUserIdAsync(userId, cancellationToken);
        return SpProfileSplitMapper.ToCompositeView(professional, sp, credentials).ToResponse();
    }

    private static ServiceProviderResult<ServiceProviderProfileResponse> NotFound() =>
        ServiceProviderResult<ServiceProviderProfileResponse>.NotFound("Service provider profile not found.");

    private static ServiceProviderResult<ServiceProviderProfileResponse> Ok(
        ServiceProviderProfileResponse response, string message) =>
        ServiceProviderResult<ServiceProviderProfileResponse>.Ok(response, message);

    private async Task DeleteBestEffort(string publicUrl, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(publicUrl)) return;
        try
        {
            var relativePath = publicUrl.TrimStart('/');
            var fullPath = Path.GetFullPath(Path.Combine("wwwroot", relativePath));
            var uploadRoot = Path.GetFullPath(Path.Combine("wwwroot", "uploads"));
            if (!fullPath.StartsWith(uploadRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
                return;
            if (File.Exists(fullPath)) File.Delete(fullPath);
        }
        catch (Exception exception) { logger.LogWarning(exception, "Could not delete superseded provider media asset."); }
    }
}
