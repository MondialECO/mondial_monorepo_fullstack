namespace WebApp.Services.Interface;

public record FileSecurityScanResult(bool Passed, string? Error = null);

public interface IFileSecurityScanner
{
    Task<FileSecurityScanResult> ScanAsync(IFormFile file, CancellationToken cancellationToken = default);
}
