using Hangfire;
using WebApp.Services.Repository;

namespace WebApp.Services.Implementations;

/// <summary>
/// Hangfire execution entrypoint for the legacy background jobs. The adapter
/// (<see cref="BackgroundJobService"/>) enqueues one of these public methods;
/// Hangfire invokes it on its server with a fresh DI scope, with durability,
/// retries and dashboard visibility. The actual work is unchanged from the old
/// in-memory implementation — only the status sink moved from a Dictionary to
/// <see cref="IBackgroundJobRepository"/>.
/// </summary>
public class BackgroundJobProcessor
{
    private readonly ICompanyService _companyService;
    private readonly IPhaseNotificationService _notificationService;
    private readonly IInvestorMatcher _investorMatcher;
    private readonly IBackgroundJobRepository _jobs;
    private readonly ILogger<BackgroundJobProcessor> _logger;

    public BackgroundJobProcessor(
        ICompanyService companyService,
        IPhaseNotificationService notificationService,
        IInvestorMatcher investorMatcher,
        IBackgroundJobRepository jobs,
        ILogger<BackgroundJobProcessor> logger)
    {
        _companyService = companyService;
        _notificationService = notificationService;
        _investorMatcher = investorMatcher;
        _jobs = jobs;
        _logger = logger;
    }

    // Keep Hangfire retries low — these jobs may perform notifications/side
    // effects; one retry covers transient infra blips without amplifying work.
    [AutomaticRetry(Attempts = 1)]
    public async Task ProcessAiReviewAsync(string jobId, string companyId)
    {
        try
        {
            await _jobs.SetProcessingAsync(jobId);

            var company = await _companyService.GetCompanyAsync(companyId);
            var review = await _companyService.RunAiReviewAsync(companyId);

            await _jobs.SetCompletedAsync(jobId, $"Score: {review.OverallScore}");

            await _notificationService.NotifyAiReviewCompleteAsync(
                companyId, company.CompanyName, review.OverallScore);

            _logger.LogInformation("AI review job {JobId} completed for company {CompanyId}", jobId, companyId);
        }
        catch (Exception ex)
        {
            await _jobs.SetFailedAsync(jobId, ex.Message);
            _logger.LogError(ex, "AI review job {JobId} failed for company {CompanyId}", jobId, companyId);
            throw; // let Hangfire record the failure (and any retry)
        }
    }

    [AutomaticRetry(Attempts = 1)]
    public async Task ProcessInvestorMatchingAsync(string jobId, string companyId)
    {
        try
        {
            await _jobs.SetProcessingAsync(jobId);

            var company = await _companyService.GetCompanyAsync(companyId);
            var matches = await _investorMatcher.FindMatchesAsync(company, investorPoolIds: null);

            await _jobs.SetCompletedAsync(jobId, $"{matches.Count} matches found");

            await _notificationService.NotifyInvestorMatchAsync(
                companyId, company.CompanyName, matches.Count);

            _logger.LogInformation("Investor matching job {JobId} completed for company {CompanyId}", jobId, companyId);
        }
        catch (Exception ex)
        {
            await _jobs.SetFailedAsync(jobId, ex.Message);
            _logger.LogError(ex, "Investor matching job {JobId} failed for company {CompanyId}", jobId, companyId);
            throw;
        }
    }

    [AutomaticRetry(Attempts = 1)]
    public async Task ProcessDataRoomAnalysisAsync(string jobId, string companyId)
    {
        try
        {
            await _jobs.SetProcessingAsync(jobId);

            var dataRoom = await _companyService.GetDataRoomStatusAsync(companyId);
            var completeness = dataRoom.Documents?.Count ?? 0;

            await _jobs.SetCompletedAsync(jobId, $"Data room analysis: {completeness} documents");

            _logger.LogInformation("Data room analysis job {JobId} completed for company {CompanyId}", jobId, companyId);
        }
        catch (Exception ex)
        {
            await _jobs.SetFailedAsync(jobId, ex.Message);
            _logger.LogError(ex, "Data room analysis job {JobId} failed for company {CompanyId}", jobId, companyId);
            throw;
        }
    }

    [AutomaticRetry(Attempts = 1)]
    public async Task ProcessFinancialProjectionsAsync(string jobId, string companyId)
    {
        try
        {
            await _jobs.SetProcessingAsync(jobId);

            var financials = await _companyService.GetFinancialSummaryAsync(companyId);
            var projectionYear1 = financials.AnnualRecurringRevenue * 1.5; // Assume 50% growth

            await _jobs.SetCompletedAsync(jobId, $"Year 1 projection: {projectionYear1:C}");

            _logger.LogInformation("Financial projections job {JobId} completed for company {CompanyId}", jobId, companyId);
        }
        catch (Exception ex)
        {
            await _jobs.SetFailedAsync(jobId, ex.Message);
            _logger.LogError(ex, "Financial projections job {JobId} failed for company {CompanyId}", jobId, companyId);
            throw;
        }
    }

    /// <summary>
    /// Durable cleanup of orphaned provider media files. Invoked when immediate
    /// deletion fails (e.g. locked file, disk full). Retries with exponential backoff.
    /// Path validation ensures only upload-root files can be deleted.
    /// Idempotent: missing files are treated as success.
    /// </summary>
    [AutomaticRetry(Attempts = 2)]
    public Task DeletePortfolioMediaAsync(string publicUrl)
    {
        if (string.IsNullOrWhiteSpace(publicUrl))
            return Task.CompletedTask;

        try
        {
            var relativePath = publicUrl.TrimStart('/');
            var fullPath = Path.GetFullPath(Path.Combine("wwwroot", relativePath));
            var uploadRoot = Path.GetFullPath(Path.Combine("wwwroot", "uploads"));

            // Path restriction: only files inside the upload root can be deleted.
            // Stored values from the upload pipeline always pass this check;
            // any external value is silently rejected.
            if (!fullPath.StartsWith(uploadRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("Rejecting media deletion for path outside upload root: {Path}", publicUrl);
                return Task.CompletedTask;
            }

            // Idempotent: the file may have already been deleted by a prior job run,
            // concurrent manual cleanup, or the immediate-deletion attempt in the
            // service layer. Missing files are not an error.
            if (File.Exists(fullPath))
                File.Delete(fullPath);

            _logger.LogInformation("Portfolio media deleted: {Path}", publicUrl);
            return Task.CompletedTask;
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Portfolio media cleanup failed for {Path}; Hangfire will retry", publicUrl);
            throw; // Let Hangfire record and retry
        }
    }
}
