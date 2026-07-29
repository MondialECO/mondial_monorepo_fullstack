using Hangfire;
using Microsoft.Extensions.Logging;

namespace WebApp.Services.Implementations;

/// <summary>
/// Deletion of provider media files from disk. Shared by the media service
/// (replace / remove image) and the profile service (delete portfolio item), so
/// removing an item cleans up its image instead of orphaning the file: once the
/// item is gone its id is gone too, and nothing can reference that file again.
///
/// Strategy: attempt immediate synchronous deletion; if that fails, enqueue a
/// durable Hangfire retry job. The database mutation must succeed first, so the
/// item id is already gone and the orphaned file cannot be re-referenced.
/// </summary>
internal static class ProviderMediaFiles
{
    /// <summary>
    /// Delete the file behind a public media URL. Attempts immediate deletion;
    /// on failure, enqueues a durable Hangfire job for retry with backoff.
    /// Paths outside the upload root are ignored (no deletion attempted).
    /// Never throws — a failed cleanup must not fail the mutation that already
    /// succeeded. The database item is gone; orphaned files will be cleaned up
    /// by the background job.
    /// </summary>
    public static void DeleteBestEffort(string? publicUrl, ILogger logger, IBackgroundJobClient? jobClient = null)
    {
        if (string.IsNullOrWhiteSpace(publicUrl)) return;

        try
        {
            var relativePath = publicUrl.TrimStart('/');
            var fullPath = Path.GetFullPath(Path.Combine("wwwroot", relativePath));
            var uploadRoot = Path.GetFullPath(Path.Combine("wwwroot", "uploads"));

            // Path restriction: stored values from the upload pipeline always pass
            // this check; external URLs are silently ignored.
            if (!fullPath.StartsWith(uploadRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
                return;

            if (File.Exists(fullPath))
                File.Delete(fullPath);

            logger.LogInformation("Portfolio media deleted immediately: {Path}", publicUrl);
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Immediate deletion failed for {Path}; enqueueing durable retry", publicUrl);

            // Enqueue a durable background job to retry deletion with backoff.
            // If jobClient is null (not injected), log and continue — best-effort
            // only; the file may be cleaned up manually or by other means.
            if (jobClient != null)
            {
                try
                {
                    jobClient.Enqueue<BackgroundJobProcessor>(p =>
                        p.DeletePortfolioMediaAsync(publicUrl));
                    logger.LogInformation("Durable cleanup job enqueued for {Path}", publicUrl);
                }
                catch (Exception enqueueFail)
                {
                    logger.LogWarning(enqueueFail, "Could not enqueue durable cleanup for {Path}", publicUrl);
                }
            }
        }
    }
}
