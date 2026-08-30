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

    // Phase 8 Lifecycle Notifications
    Task NotifyEntrepreneurInterestAsync(string companyId, string investorId);
    Task NotifyInvestorInterestAsync(string companyId, string investorId);
    Task NotifyMutualHandshakeAsync(string companyId, string investorId);
    Task NotifyMeetingScheduledAsync(string companyId, string investorId, Models.DatabaseModels.InvestorMeetingRecord meeting, string initiatedBy);
    Task NotifyMeetingStatusChangedAsync(string companyId, string investorId, Models.DatabaseModels.InvestorMeetingRecord meeting, string newStatus, string initiatedBy);

    // Investor Phase 2 Finance Verification Notifications
    Task NotifyFinanceVerificationSubmittedAsync(string userId, string investorId);
    Task NotifyFinanceVerificationApprovedAsync(string userId, string investorId);
    Task NotifyFinanceVerificationNeedsUpdateAsync(string userId, string investorId, string reason);
    Task NotifyFinanceVerificationRejectedAsync(string userId, string investorId, string reason);

    // Investor Phase 9 Portfolio Notifications
    Task NotifyInvestmentAddedToPortfolioAsync(string userId, string investorId, string companyName, double amount, string currency);

    // Investor Phase 7 Diligence Q&A Notifications
    Task NotifyDiligenceQuestionAskedAsync(string companyId, string investorName, string documentTitle, string question);
    Task NotifyDiligenceQuestionAnsweredAsync(string investorId, string companyName, string documentTitle, string response);
}
