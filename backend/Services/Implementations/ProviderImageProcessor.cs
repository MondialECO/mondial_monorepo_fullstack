using System.Security.Cryptography;
using SkiaSharp;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations;

/// <summary>
/// Decodes and re-encodes supported raster images. Re-encoding strips ancillary
/// metadata and proves the payload is an actual image rather than trusting a name.
/// This is basic validation, not malware scanning.
/// </summary>
public sealed class ProviderImageProcessor : IProviderImageProcessor
{
    private const int MaximumPixelDimension = 12_000;
    private const long MaximumPixels = 40_000_000;
    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/webp",
    };

    public async Task<ProcessedProviderImage> ProcessAsync(
        IFormFile file,
        long maximumBytes,
        CancellationToken cancellationToken = default)
    {
        if (file is null || file.Length <= 0) throw new ArgumentException("Choose a non-empty image.");
        if (file.Length > maximumBytes) throw new ArgumentException($"Image must be {maximumBytes / 1024 / 1024} MB or smaller.");
        if (!AllowedContentTypes.Contains(file.ContentType)) throw new ArgumentException("Use a JPEG, PNG or WebP image.");

        await using var input = file.OpenReadStream();
        using var memory = new MemoryStream();
        await input.CopyToAsync(memory, cancellationToken);
        var sourceBytes = memory.ToArray();
        var detected = DetectContentType(sourceBytes);
        if (detected is null || !string.Equals(detected, file.ContentType, StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("The image content does not match its declared type.");

        using var sourceData = SKData.CreateCopy(sourceBytes);
        using var codec = SKCodec.Create(sourceData) ?? throw new ArgumentException("The image could not be decoded.");
        if (codec.FrameCount > 1) throw new ArgumentException("Animated images are not supported.");
        var info = codec.Info;
        if (info.Width <= 0 || info.Height <= 0 || info.Width > MaximumPixelDimension || info.Height > MaximumPixelDimension ||
            (long)info.Width * info.Height > MaximumPixels)
            throw new ArgumentException("The image dimensions are not supported.");

        using var bitmap = SKBitmap.Decode(codec) ?? throw new ArgumentException("The image could not be decoded.");
        using var image = SKImage.FromBitmap(bitmap);
        var format = detected switch
        {
            "image/png" => SKEncodedImageFormat.Png,
            "image/webp" => SKEncodedImageFormat.Webp,
            _ => SKEncodedImageFormat.Jpeg,
        };
        using var encoded = image.Encode(format, format == SKEncodedImageFormat.Png ? 100 : 90)
            ?? throw new ArgumentException("The image could not be safely processed.");
        var output = encoded.ToArray();
        var extension = format switch
        {
            SKEncodedImageFormat.Png => ".png",
            SKEncodedImageFormat.Webp => ".webp",
            _ => ".jpg",
        };
        return new ProcessedProviderImage(
            output,
            detected,
            extension,
            bitmap.Width,
            bitmap.Height,
            Convert.ToHexString(SHA256.HashData(output)).ToLowerInvariant());
    }

    private static string? DetectContentType(ReadOnlySpan<byte> data)
    {
        if (data.Length >= 3 && data[0] == 0xFF && data[1] == 0xD8 && data[2] == 0xFF) return "image/jpeg";
        if (data.Length >= 8 && data[..8].SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A })) return "image/png";
        if (data.Length >= 12 && data[..4].SequenceEqual("RIFF"u8) && data.Slice(8, 4).SequenceEqual("WEBP"u8)) return "image/webp";
        return null;
    }
}
