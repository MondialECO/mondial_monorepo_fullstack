namespace WebApp.Services;

public interface IBackgroundJobService
{
    string EnqueueAiReview(string companyId, string ownerUserId);
    string EnqueueInvestorMatching(string companyId, string ownerUserId);
    string EnqueueDataRoomAnalysis(string companyId, string ownerUserId);
    string EnqueueFinancialProjections(string companyId, string ownerUserId);
    Task<JobStatus> GetJobStatusAsync(string jobId);
}

public class JobStatus
{
    public string JobId { get; set; }
    public string CompanyId { get; set; }
    public string OwnerUserId { get; set; }
    public string Status { get; set; } // queued | processing | completed | failed
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string Result { get; set; }
    public string ErrorMessage { get; set; }
}
