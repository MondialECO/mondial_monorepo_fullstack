using WebApp.Models.Dtos;

namespace WebApp.Services.Interface;

public enum ProviderProfileMediaKind
{
    ProfileImage,
    CoverImage,
}

public sealed record ProcessedProviderImage(
    byte[] Content,
    string ContentType,
    string Extension,
    int Width,
    int Height,
    string Sha256);

public interface IProviderImageProcessor
{
    Task<ProcessedProviderImage> ProcessAsync(
        IFormFile file,
        long maximumBytes,
        CancellationToken cancellationToken = default);
}

public interface IServiceProviderMediaService
{
    Task<ServiceProviderResult<ServiceProviderProfileResponse>> UploadProfileMediaAsync(
        string userId,
        ProviderProfileMediaKind kind,
        IFormFile file,
        CancellationToken cancellationToken = default);

    Task<ServiceProviderResult<ServiceProviderProfileResponse>> RemoveProfileMediaAsync(
        string userId,
        ProviderProfileMediaKind kind,
        CancellationToken cancellationToken = default);

    Task<ServiceProviderResult<ServiceProviderProfileResponse>> UploadPortfolioImageAsync(
        string userId,
        string portfolioItemId,
        IFormFile file,
        string? caption,
        CancellationToken cancellationToken = default);

    Task<ServiceProviderResult<ServiceProviderProfileResponse>> RemovePortfolioImageAsync(
        string userId,
        string portfolioItemId,
        CancellationToken cancellationToken = default);
}
