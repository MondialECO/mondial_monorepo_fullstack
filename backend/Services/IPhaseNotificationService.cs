namespace WebApp.Services;

public interface IPhaseNotificationService
{
    Task NotifyPhaseCompletedAsync(string companyId, string companyName, int phase);
    Task NotifyDocumentApprovedAsync(string companyId, string documentName);
    Task NotifyDocumentRejectedAsync(string companyId, string documentName, string reason);
    Task NotifyAiReviewCompleteAsync(string companyId, string companyName, int overallScore);
    Task NotifyInvestorMatchAsync(string companyId, string companyName, int matchCount);
    Task NotifyDealStatusChangeAsync(string dealId, string companyName, string newStatus);

    /// <summary>
    /// Notify the company owner that an investor has signed the data-room NDA.
    /// Best-effort; failures are logged by the caller and never block the
    /// triggering request.
    /// </summary>
    Task NotifyNdaSignedAsync(string companyId, string investorId);
}
