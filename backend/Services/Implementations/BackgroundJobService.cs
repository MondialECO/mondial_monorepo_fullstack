namespace WebApp.Services.Implementations;

public class BackgroundJobService : IBackgroundJobService
{
    private readonly ICompanyService _companyService;
    private readonly IPhaseNotificationService _notificationService;
    private readonly ILogger<BackgroundJobService> _logger;
    private readonly Dictionary<string, JobStatus> _jobCache;

    public BackgroundJobService(
        ICompanyService companyService,
        IPhaseNotificationService notificationService,
        ILogger<BackgroundJobService> logger)
    {
        _companyService = companyService;
        _notificationService = notificationService;
        _logger = logger;
        _jobCache = new Dictionary<string, JobStatus>();
    }

    public string EnqueueAiReview(string companyId)
    {
        var jobId = Guid.NewGuid().ToString();
        var jobStatus = new JobStatus
        {
            JobId = jobId,
            Status = "queued",
            CreatedAt = DateTime.UtcNow
        };

        _jobCache[jobId] = jobStatus;

        // Fire and forget - in production, use Hangfire
        _ = Task.Run(async () => await ProcessAiReviewAsync(companyId, jobId));

        _logger.LogInformation($"AI review job {jobId} queued for company {companyId}");
        return jobId;
    }

    public string EnqueueInvestorMatching(string companyId)
    {
        var jobId = Guid.NewGuid().ToString();
        var jobStatus = new JobStatus
        {
            JobId = jobId,
            Status = "queued",
            CreatedAt = DateTime.UtcNow
        };

        _jobCache[jobId] = jobStatus;

        _ = Task.Run(async () => await ProcessInvestorMatchingAsync(companyId, jobId));

        _logger.LogInformation($"Investor matching job {jobId} queued for company {companyId}");
        return jobId;
    }

    public string EnqueueDataRoomAnalysis(string companyId)
    {
        var jobId = Guid.NewGuid().ToString();
        var jobStatus = new JobStatus
        {
            JobId = jobId,
            Status = "queued",
            CreatedAt = DateTime.UtcNow
        };

        _jobCache[jobId] = jobStatus;

        _ = Task.Run(async () => await ProcessDataRoomAnalysisAsync(companyId, jobId));

        _logger.LogInformation($"Data room analysis job {jobId} queued for company {companyId}");
        return jobId;
    }

    public string EnqueueFinancialProjections(string companyId)
    {
        var jobId = Guid.NewGuid().ToString();
        var jobStatus = new JobStatus
        {
            JobId = jobId,
            Status = "queued",
            CreatedAt = DateTime.UtcNow
        };

        _jobCache[jobId] = jobStatus;

        _ = Task.Run(async () => await ProcessFinancialProjectionsAsync(companyId, jobId));

        _logger.LogInformation($"Financial projections job {jobId} queued for company {companyId}");
        return jobId;
    }

    public async Task<JobStatus> GetJobStatusAsync(string jobId)
    {
        return await Task.Run(() =>
        {
            if (_jobCache.TryGetValue(jobId, out var status))
                return status;

            return new JobStatus
            {
                JobId = jobId,
                Status = "not_found",
                ErrorMessage = "Job not found"
            };
        });
    }

    private async Task ProcessAiReviewAsync(string companyId, string jobId)
    {
        try
        {
            _jobCache[jobId].Status = "processing";

            var company = await _companyService.GetCompanyAsync(companyId);
            var review = await _companyService.RunAiReviewAsync(companyId);

            _jobCache[jobId].Status = "completed";
            _jobCache[jobId].CompletedAt = DateTime.UtcNow;
            _jobCache[jobId].Result = $"Score: {review.OverallScore}";

            // Send notification
            await _notificationService.NotifyAiReviewCompleteAsync(
                companyId,
                company.CompanyName,
                review.OverallScore
            );

            _logger.LogInformation($"AI review job {jobId} completed for company {companyId}");
        }
        catch (Exception ex)
        {
            _jobCache[jobId].Status = "failed";
            _jobCache[jobId].CompletedAt = DateTime.UtcNow;
            _jobCache[jobId].ErrorMessage = ex.Message;
            _logger.LogError(ex, $"AI review job {jobId} failed for company {companyId}");
        }
    }

    private async Task ProcessInvestorMatchingAsync(string companyId, string jobId)
    {
        try
        {
            _jobCache[jobId].Status = "processing";

            var company = await _companyService.GetCompanyAsync(companyId);

            // In a real implementation, fetch actual investor pool from database
            var investorPoolIds = new List<string>();

            var matches = await _companyService.GetMatchedInvestorsAsync(companyId);

            _jobCache[jobId].Status = "completed";
            _jobCache[jobId].CompletedAt = DateTime.UtcNow;
            _jobCache[jobId].Result = $"{matches.Count} matches found";

            // Send notification
            await _notificationService.NotifyInvestorMatchAsync(
                companyId,
                company.CompanyName,
                matches.Count
            );

            _logger.LogInformation($"Investor matching job {jobId} completed for company {companyId}");
        }
        catch (Exception ex)
        {
            _jobCache[jobId].Status = "failed";
            _jobCache[jobId].CompletedAt = DateTime.UtcNow;
            _jobCache[jobId].ErrorMessage = ex.Message;
            _logger.LogError(ex, $"Investor matching job {jobId} failed for company {companyId}");
        }
    }

    private async Task ProcessDataRoomAnalysisAsync(string companyId, string jobId)
    {
        try
        {
            _jobCache[jobId].Status = "processing";

            var dataRoom = await _companyService.GetDataRoomStatusAsync(companyId);

            // Placeholder for more advanced analysis
            var completeness = dataRoom.Documents?.Count ?? 0;

            _jobCache[jobId].Status = "completed";
            _jobCache[jobId].CompletedAt = DateTime.UtcNow;
            _jobCache[jobId].Result = $"Data room analysis: {completeness} documents";

            _logger.LogInformation($"Data room analysis job {jobId} completed for company {companyId}");
        }
        catch (Exception ex)
        {
            _jobCache[jobId].Status = "failed";
            _jobCache[jobId].CompletedAt = DateTime.UtcNow;
            _jobCache[jobId].ErrorMessage = ex.Message;
            _logger.LogError(ex, $"Data room analysis job {jobId} failed for company {companyId}");
        }
    }

    private async Task ProcessFinancialProjectionsAsync(string companyId, string jobId)
    {
        try
        {
            _jobCache[jobId].Status = "processing";

            var financials = await _companyService.GetFinancialSummaryAsync(companyId);

            // Placeholder for more advanced projections
            var projectionYear1 = financials.AnnualRecurringRevenue * 1.5; // Assume 50% growth

            _jobCache[jobId].Status = "completed";
            _jobCache[jobId].CompletedAt = DateTime.UtcNow;
            _jobCache[jobId].Result = $"Year 1 projection: {projectionYear1:C}";

            _logger.LogInformation($"Financial projections job {jobId} completed for company {companyId}");
        }
        catch (Exception ex)
        {
            _jobCache[jobId].Status = "failed";
            _jobCache[jobId].CompletedAt = DateTime.UtcNow;
            _jobCache[jobId].ErrorMessage = ex.Message;
            _logger.LogError(ex, $"Financial projections job {jobId} failed for company {companyId}");
        }
    }
}
