namespace WebApp.Services;

public interface IBackgroundJobService
{
    string EnqueueAiReview(string companyId);
    string EnqueueInvestorMatching(string companyId);
    string EnqueueDataRoomAnalysis(string companyId);
    string EnqueueFinancialProjections(string companyId);
    Task<JobStatus> GetJobStatusAsync(string jobId);
}

public class JobStatus
{
    public string JobId { get; set; }
    public string Status { get; set; } // queued | processing | completed | failed
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string Result { get; set; }
    public string ErrorMessage { get; set; }
}
