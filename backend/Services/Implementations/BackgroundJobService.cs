using Hangfire;
using WebApp.Models.DatabaseModels.Jobs;
using WebApp.Services.Repository;

namespace WebApp.Services.Implementations;

/// <summary>
/// Hangfire-backed adapter for the legacy background-job API. The
/// <see cref="IBackgroundJobService"/> interface and the <c>BackgroundJobController</c>
/// contract are preserved byte-for-byte; only the backing changed: the old
/// in-memory <c>Dictionary</c> + <c>Task.Run</c> (lost on restart, no retries,
/// no monitoring) is replaced by a durable Hangfire enqueue plus a persisted
/// <see cref="BackgroundJobRecord"/> in the dedicated <c>BackgroundJobs</c>
/// collection. Existing callers (AI Review / Investor Matching / Data Room /
/// Financial Projections) keep working unchanged but gain durability, retries
/// and dashboard visibility.
/// </summary>
public class BackgroundJobService : IBackgroundJobService
{
    private readonly IBackgroundJobClient _jobClient;
    private readonly IBackgroundJobRepository _jobs;
    private readonly ILogger<BackgroundJobService> _logger;

    public BackgroundJobService(
        IBackgroundJobClient jobClient,
        IBackgroundJobRepository jobs,
        ILogger<BackgroundJobService> logger)
    {
        _jobClient = jobClient;
        _jobs = jobs;
        _logger = logger;
    }

    public string EnqueueAiReview(string companyId, string ownerUserId)
        => Enqueue("ai-review", companyId, ownerUserId,
            (jobId, cid) => _jobClient.Enqueue<BackgroundJobProcessor>(p => p.ProcessAiReviewAsync(jobId, cid)));

    public string EnqueueInvestorMatching(string companyId, string ownerUserId)
        => Enqueue("investor-matching", companyId, ownerUserId,
            (jobId, cid) => _jobClient.Enqueue<BackgroundJobProcessor>(p => p.ProcessInvestorMatchingAsync(jobId, cid)));

    public string EnqueueDataRoomAnalysis(string companyId, string ownerUserId)
        => Enqueue("data-room-analysis", companyId, ownerUserId,
            (jobId, cid) => _jobClient.Enqueue<BackgroundJobProcessor>(p => p.ProcessDataRoomAnalysisAsync(jobId, cid)));

    public string EnqueueFinancialProjections(string companyId, string ownerUserId)
        => Enqueue("financial-projections", companyId, ownerUserId,
            (jobId, cid) => _jobClient.Enqueue<BackgroundJobProcessor>(p => p.ProcessFinancialProjectionsAsync(jobId, cid)));

    /// <summary>
    /// Persist the durable record FIRST (so the processor never races ahead of
    /// a missing document), then enqueue the Hangfire job and back-fill its id.
    /// </summary>
    private string Enqueue(string jobType, string companyId, string ownerUserId, Func<string, string, string> enqueue)
    {
        var jobId = Guid.NewGuid().ToString();

        _jobs.InsertAsync(new BackgroundJobRecord
        {
            JobId = jobId,
            JobType = jobType,
            CompanyId = companyId,
            OwnerUserId = ownerUserId,
            Status = "queued",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        }).GetAwaiter().GetResult();

        var hangfireJobId = enqueue(jobId, companyId);
        _jobs.SetHangfireJobIdAsync(jobId, hangfireJobId).GetAwaiter().GetResult();

        _logger.LogInformation("{JobType} job {JobId} (hangfire {HangfireJobId}) queued for company {CompanyId}",
            jobType, jobId, hangfireJobId, companyId);
        return jobId;
    }

    public async Task<JobStatus> GetJobStatusAsync(string jobId)
    {
        var record = await _jobs.GetAsync(jobId);
        if (record == null)
        {
            return new JobStatus
            {
                JobId = jobId,
                Status = "not_found",
                ErrorMessage = "Job not found",
            };
        }

        return new JobStatus
        {
            JobId = record.JobId,
            CompanyId = record.CompanyId!,
            OwnerUserId = record.OwnerUserId,
            Status = record.Status,
            CreatedAt = record.CreatedAt,
            CompletedAt = record.CompletedAt,
            Result = record.Result!,
            ErrorMessage = record.ErrorMessage!,
        };
    }
}
