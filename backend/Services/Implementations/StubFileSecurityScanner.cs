using WebApp.Services.Interface;

namespace WebApp.Services.Implementations;

/// <summary>
/// STUB: deterministic file-security boundary. It applies the same document/image
/// extension and 20 MB checks as SaveFile's current documents path, then passes.
/// It is not malware detection and must be replaced before untrusted production upload.
/// </summary>
public sealed class StubFileSecurityScanner : IFileSecurityScanner
{
    private static readonly HashSet<string> Allowed = new(StringComparer.OrdinalIgnoreCase)
    { ".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf", ".doc", ".docx", ".ppt", ".pptx" };
    private const long MaximumBytes = 20 * 1024 * 1024;

    public Task<FileSecurityScanResult> ScanAsync(IFormFile file, CancellationToken cancellationToken = default)
    {
        if (file is null || file.Length == 0) return Task.FromResult(new FileSecurityScanResult(false, "File is empty."));
        if (file.Length > MaximumBytes) return Task.FromResult(new FileSecurityScanResult(false, "File too large. Max allowed: 20MB."));
        var extension = Path.GetExtension(file.FileName);
        if (!Allowed.Contains(extension)) return Task.FromResult(new FileSecurityScanResult(false, $"Invalid file type: {extension.ToLowerInvariant()}"));
        return Task.FromResult(new FileSecurityScanResult(true));
    }
}
