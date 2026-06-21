using Microsoft.AspNetCore.Identity;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Email;

namespace WebApp.Services.Implementations;

public class PhaseNotificationService : IPhaseNotificationService
{
    private readonly EmailService _emailService;
    private readonly ICompanyService _companyService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<PhaseNotificationService> _logger;

    public PhaseNotificationService(
        EmailService emailService,
        ICompanyService companyService,
        UserManager<ApplicationUser> userManager,
        ILogger<PhaseNotificationService> logger)
    {
        _emailService = emailService;
        _companyService = companyService;
        _userManager = userManager;
        _logger = logger;
    }

    public async Task NotifyPhaseCompletedAsync(string companyId, string companyName, int phase)
    {
        try
        {
            var company = await _companyService.GetCompanyAsync(companyId);
            var user = await GetUserAsync(company?.OwnerId);

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
Great progress, {user?.Name ?? "Founder"}!

You've successfully completed Phase {phase}: {phaseName} for {companyName}.

Next steps:
- Review your progress dashboard
- Continue to the next phase
- Track investor matches and interactions

Keep building! 🚀
";

            await SendToUserAsync(user, companyId, subject, body);
            _logger.LogInformation("Phase completion notification processed for company {CompanyId}", companyId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending phase completion notification for company {CompanyId}", companyId);
        }
    }

    public async Task NotifyDocumentApprovedAsync(string companyId, string documentName)
    {
        try
        {
            var company = await _companyService.GetCompanyAsync(companyId);
            var user = await GetUserAsync(company?.OwnerId);

            var subject = $"✅ Document Approved: {documentName}";
            var body = $@"
Your document ""{documentName}"" has been approved.

Your company verification is progressing smoothly. Keep uploading any remaining documents.
";

            await SendToUserAsync(user, companyId, subject, body);
            _logger.LogInformation("Document approval notification processed for company {CompanyId}", companyId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending document approval notification for company {CompanyId}", companyId);
        }
    }

    public async Task NotifyDocumentRejectedAsync(string companyId, string documentName, string reason)
    {
        try
        {
            var company = await _companyService.GetCompanyAsync(companyId);
            var user = await GetUserAsync(company?.OwnerId);

            var subject = $"❌ Document Needs Revision: {documentName}";
            var body = $@"
Your document ""{documentName}"" requires revision.

Reason: {reason}

Please resubmit the corrected document. Questions? Contact support.
";

            await SendToUserAsync(user, companyId, subject, body);
            _logger.LogInformation("Document rejection notification processed for company {CompanyId}", companyId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending document rejection notification for company {CompanyId}", companyId);
        }
    }

    public async Task NotifyAiReviewCompleteAsync(string companyId, string companyName, int overallScore)
    {
        try
        {
            var company = await _companyService.GetCompanyAsync(companyId);
            var user = await GetUserAsync(company?.OwnerId);

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

            await SendToUserAsync(user, companyId, subject, body);
            _logger.LogInformation("AI review notification processed for company {CompanyId}", companyId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending AI review notification for company {CompanyId}", companyId);
        }
    }

    public async Task NotifyInvestorMatchAsync(string companyId, string companyName, int matchCount)
    {
        try
        {
            var company = await _companyService.GetCompanyAsync(companyId);
            var user = await GetUserAsync(company?.OwnerId);

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

            await SendToUserAsync(user, companyId, subject, body);
            _logger.LogInformation("Investor match notification processed for company {CompanyId}", companyId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending investor match notification for company {CompanyId}", companyId);
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
                { "closed", "🎉 Deal is closed - Congratulations!" },
                { "offer_sent", "A new offer has been sent" },
                { "offer_viewed", "Your offer has been viewed" },
                { "offer_countered", "A counter-offer has been made" },
                { "offer_accepted", "🎉 An offer has been accepted" },
                { "offer_rejected", "An offer has been declined" },
            };

            var message = statusMessages.ContainsKey(newStatus) ? statusMessages[newStatus] : $"Deal status changed to {newStatus}";
            var subject = $"📋 Deal Status Update: {message}";

            // Resolve BOTH participants (founder + investor) from the deal so the
            // update reaches the whole table, not just the company owner.
            var recipients = await _companyService.GetDealRecipientsAsync(dealId);
            if (recipients.Count == 0)
            {
                _logger.LogWarning("Deal status notification skipped — no recipients for deal {DealId}", dealId);
                return;
            }

            foreach (var r in recipients)
            {
                if (string.IsNullOrWhiteSpace(r.Email))
                {
                    _logger.LogWarning("Deal notification skipped for {Role} on deal {DealId} — no email", r.Role, dealId);
                    continue;
                }

                var body = $@"
Hi {r.Name ?? "there"},

Your deal{(string.IsNullOrWhiteSpace(companyName) ? "" : $" for {companyName}")} has an update.

Current Status: {newStatus}
{message}

Review the full details and next steps in your dashboard.

Let's complete this deal! 🤝
";
                await _emailService.SendEmailAsync(r.Email, subject, body);
            }

            _logger.LogInformation("Deal status change notification processed for deal {DealId} ({Count} recipients)", dealId, recipients.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending deal status notification for deal {DealId}", dealId);
        }
    }

    public async Task NotifyNdaSignedAsync(string companyId, string investorId)
    {
        try
        {
            var company = await _companyService.GetCompanyAsync(companyId);
            var user = await GetUserAsync(company?.OwnerId);

            var subject = $"📝 NDA Signed for {company?.CompanyName}";
            var body = $@"
An investor has signed the data-room NDA for {company?.CompanyName}.

Investor ID: {investorId}
Signed at: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC

They now have NDA-gated access to your data room. Review their engagement in your dashboard.
";

            await SendToUserAsync(user, companyId, subject, body);
            _logger.LogInformation("NDA-signed notification processed for company {CompanyId}", companyId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending NDA-signed notification for company {CompanyId}", companyId);
        }
    }

    // Resolve a real ApplicationUser by id. Returns null only when the id is
    // missing or no matching user exists — callers must handle that explicitly
    // (see SendToUserAsync) rather than emailing an empty recipient.
    private async Task<ApplicationUser?> GetUserAsync(string? userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
            return null;

        return await _userManager.FindByIdAsync(userId);
    }

    // Single send path with explicit recipient guarding. If the owner/email
    // can't be resolved we log and skip — never dispatch to an empty address.
    private async Task SendToUserAsync(ApplicationUser? user, string contextId, string subject, string body)
    {
        if (user is null || string.IsNullOrWhiteSpace(user.Email))
        {
            _logger.LogWarning(
                "Notification not sent — unresolved recipient for {ContextId} (subject: {Subject})",
                contextId, subject);
            return;
        }

        await _emailService.SendEmailAsync(user.Email, subject, body);
    }
}
