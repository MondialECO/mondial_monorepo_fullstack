using WebApp.Services.Email;

namespace WebApp.Services.Implementations;

public class PhaseNotificationService : IPhaseNotificationService
{
    private readonly EmailService _emailService;
    private readonly ICompanyService _companyService;
    private readonly ILogger<PhaseNotificationService> _logger;

    public PhaseNotificationService(
        EmailService emailService,
        ICompanyService companyService,
        ILogger<PhaseNotificationService> logger)
    {
        _emailService = emailService;
        _companyService = companyService;
        _logger = logger;
    }

    public async Task NotifyPhaseCompletedAsync(string companyId, string companyName, int phase)
    {
        try
        {
            var company = await _companyService.GetCompanyAsync(companyId);
            var user = await GetUserAsync(company.OwnerId);

            var phaseNames = new Dictionary<int, string>
            {
                { 1, "Identity & Onboarding" },
                { 2, "Company Verification" },
                { 3, "Financial & KPI" },
                { 4, "Equity Structure" },
                { 5, "Funding Analysis" },
                { 6, "Data Room" },
                { 7, "AI Expert Review" },
                { 8, "Investor Matching" },
                { 9, "Deal Execution" }
            };

            var phaseName = phaseNames.ContainsKey(phase) ? phaseNames[phase] : $"Phase {phase}";

            var subject = $"✅ Phase {phase} Completed: {phaseName}";
            var body = $@"
Great progress, {user?.FirstName ?? "Founder"}!

You've successfully completed Phase {phase}: {phaseName} for {companyName}.

Next steps:
- Review your progress dashboard
- Continue to the next phase
- Track investor matches and interactions

Keep building! 🚀
";

            await _emailService.SendEmailAsync(user?.Email ?? "", subject, body);
            _logger.LogInformation($"Phase completion notification sent for company {companyId}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending phase completion notification for company {companyId}");
        }
    }

    public async Task NotifyDocumentApprovedAsync(string companyId, string documentName)
    {
        try
        {
            var company = await _companyService.GetCompanyAsync(companyId);
            var user = await GetUserAsync(company.OwnerId);

            var subject = $"✅ Document Approved: {documentName}";
            var body = $@"
Your document ""{documentName}"" has been approved.

Your company verification is progressing smoothly. Keep uploading any remaining documents.
";

            await _emailService.SendEmailAsync(user?.Email ?? "", subject, body);
            _logger.LogInformation($"Document approval notification sent for company {companyId}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending document approval notification for company {companyId}");
        }
    }

    public async Task NotifyDocumentRejectedAsync(string companyId, string documentName, string reason)
    {
        try
        {
            var company = await _companyService.GetCompanyAsync(companyId);
            var user = await GetUserAsync(company.OwnerId);

            var subject = $"❌ Document Needs Revision: {documentName}";
            var body = $@"
Your document ""{documentName}"" requires revision.

Reason: {reason}

Please resubmit the corrected document. Questions? Contact support.
";

            await _emailService.SendEmailAsync(user?.Email ?? "", subject, body);
            _logger.LogInformation($"Document rejection notification sent for company {companyId}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending document rejection notification for company {companyId}");
        }
    }

    public async Task NotifyAiReviewCompleteAsync(string companyId, string companyName, int overallScore)
    {
        try
        {
            var company = await _companyService.GetCompanyAsync(companyId);
            var user = await GetUserAsync(company.OwnerId);

            var badgeStatus = overallScore >= 70 ? "🏆 You've earned the Investor-Ready Badge!" : "Keep improving to earn the Investor-Ready Badge";

            var subject = $"🤖 AI Review Complete for {companyName}";
            var body = $@"
Your AI review has been completed!

Overall Score: {overallScore}/100
{badgeStatus}

Key recommendations:
- Review the detailed feedback in your dashboard
- Address any critical gaps to improve your investor attractiveness
- Your investor matches are based on this profile

Let's get you investment-ready! 💼
";

            await _emailService.SendEmailAsync(user?.Email ?? "", subject, body);
            _logger.LogInformation($"AI review notification sent for company {companyId}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending AI review notification for company {companyId}");
        }
    }

    public async Task NotifyInvestorMatchAsync(string companyId, string companyName, int matchCount)
    {
        try
        {
            var company = await _companyService.GetCompanyAsync(companyId);
            var user = await GetUserAsync(company.OwnerId);

            var subject = matchCount > 0
                ? $"🎯 {matchCount} New Investor Matches for {companyName}!"
                : $"No Matches Yet for {companyName}";

            var body = matchCount > 0
                ? $@"
Exciting news! {matchCount} investors match your company profile.

The investors are interested in:
- Your industry and market fit
- Your funding stage and requirements
- Your growth trajectory

Next steps:
- Review investor profiles in your dashboard
- Reach out to the best matches
- Schedule meetings and pitches

Let's close deals! 📈
"
                : $@"
Your company is being reviewed by our AI matching system.

While no matches have been found yet, keep improving your profile:
- Upload more documents to the data room
- Clarify your use of funds
- Update financial metrics

Matches will appear as investors align with your profile.
";

            await _emailService.SendEmailAsync(user?.Email ?? "", subject, body);
            _logger.LogInformation($"Investor match notification sent for company {companyId}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending investor match notification for company {companyId}");
        }
    }

    public async Task NotifyDealStatusChangeAsync(string dealId, string companyName, string newStatus)
    {
        try
        {
            var statusMessages = new Dictionary<string, string>
            {
                { "negotiation", "Deal negotiation has started" },
                { "term_sheet", "Term sheet is under review" },
                { "due_diligence", "Due diligence phase has begun" },
                { "closing", "We're approaching the finish line!" },
                { "closed", "🎉 Deal is closed - Congratulations!" }
            };

            var message = statusMessages.ContainsKey(newStatus) ? statusMessages[newStatus] : $"Deal status changed to {newStatus}";

            var subject = $"📋 Deal Status Update: {message}";
            var body = $@"
Your deal for {companyName} has progressed.

Current Status: {newStatus}
{message}

Review the full details and next steps in your dashboard.

Let's complete this deal! 🤝
";

            // In a real implementation, fetch user email from deal/company
            // For now, this is a placeholder
            _logger.LogInformation($"Deal status change notification prepared for deal {dealId}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error preparing deal status notification for deal {dealId}");
        }
    }

    private async Task<dynamic> GetUserAsync(string userId)
    {
        // Placeholder: In a real implementation, this would fetch from ApplicationUser collection
        // For now, return null and handle gracefully in calling code
        return await Task.FromResult<dynamic>(null);
    }
}
