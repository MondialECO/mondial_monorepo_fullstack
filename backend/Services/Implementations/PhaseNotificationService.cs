using Microsoft.AspNetCore.Identity;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Email;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations;

public class PhaseNotificationService : IPhaseNotificationService
{
    private readonly EmailService _emailService;
    private readonly ICompanyService _companyService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly INotificationService _notificationService;
    private readonly ILogger<PhaseNotificationService> _logger;

    public PhaseNotificationService(
        EmailService emailService,
        ICompanyService companyService,
        UserManager<ApplicationUser> userManager,
        INotificationService notificationService,
        ILogger<PhaseNotificationService> logger)
    {
        _emailService = emailService;
        _companyService = companyService;
        _userManager = userManager;
        _notificationService = notificationService;
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

    public async Task NotifyEntrepreneurInterestAsync(string companyId, string investorId)
    {
        try
        {
            var company = await _companyService.GetCompanyAsync(companyId);
            var investorUser = await FindInvestorUserAsync(investorId);

            var subject = $"💼 New Investor Match Interest from {company?.CompanyName}";
            var body = $@"
{company?.CompanyName} expressed interest in connecting with you on Mondial Eco.

Company: {company?.CompanyName}
Industry: {company?.Industry}
Funding Ask: EUR {company?.FundingAskAmount ?? 0:N0}

Review this opportunity in your discovery feed:
/dashboard/investor/discovery
";
            if (investorUser != null)
                await SendToUserAsync(investorUser, companyId, subject, body);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending entrepreneur interest notification for company {CompanyId}", companyId);
        }
    }

    public async Task NotifyInvestorInterestAsync(string companyId, string investorId)
    {
        try
        {
            var company = await _companyService.GetCompanyAsync(companyId);
            var user = await GetUserAsync(company?.OwnerId);
            var investorUser = await FindInvestorUserAsync(investorId);
            var investorName = investorUser?.Name ?? "Investor";

            var subject = $"⭐ {investorName} is interested in your company!";
            var body = $@"
Great news! {investorName} has expressed interest in {company?.CompanyName}.

Open your Phase 8 dashboard to express mutual interest and confirm the handshake:
/dashboard/entrepreneur/phase-8
";
            await SendToUserAsync(user, companyId, subject, body);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending investor interest notification for company {CompanyId}", companyId);
        }
    }

    public async Task NotifyMutualHandshakeAsync(string companyId, string investorId)
    {
        try
        {
            var company = await _companyService.GetCompanyAsync(companyId);
            var founder = await GetUserAsync(company?.OwnerId);
            var investorUser = await FindInvestorUserAsync(investorId);
            var investorName = investorUser?.Name ?? "Investor";

            var subject = $"🤝 It's a Match! Handshake Confirmed with {company?.CompanyName} & {investorName}";
            var body = $@"
Congratulations! Both sides have expressed mutual interest.

Company: {company?.CompanyName}
Investor: {investorName}

You can now message each other or schedule an investor pitch meeting directly from your dashboard.
";
            await SendToUserAsync(founder, companyId, subject, body);
            if (investorUser != null)
                await SendToUserAsync(investorUser, companyId, subject, body);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending mutual handshake notification for company {CompanyId}", companyId);
        }
    }

    public async Task NotifyMeetingScheduledAsync(string companyId, string investorId, Models.DatabaseModels.InvestorMeetingRecord meeting, string initiatedBy)
    {
        try
        {
            var company = await _companyService.GetCompanyAsync(companyId);
            var founder = await GetUserAsync(company?.OwnerId);
            var investorUser = await FindInvestorUserAsync(investorId);
            var investorName = investorUser?.Name ?? "Investor";

            var subject = $"📅 Investor Meeting Confirmed: {company?.CompanyName} & {investorName}";
            var body = $@"
A meeting has been scheduled:
Date & Time: {meeting.StartsAt:yyyy-MM-dd HH:mm} {meeting.Timezone}
Duration: {meeting.DurationMinutes} minutes
Format: {meeting.MeetingType}
Note/Agenda: {(string.IsNullOrWhiteSpace(meeting.Note) ? "None specified" : meeting.Note)}

Please check your dashboard for details.
";
            if (string.Equals(initiatedBy, "entrepreneur", StringComparison.OrdinalIgnoreCase))
            {
                if (investorUser != null)
                    await SendToUserAsync(investorUser, companyId, subject, body);
            }
            else
            {
                await SendToUserAsync(founder, companyId, subject, body);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending meeting scheduled notification for company {CompanyId}", companyId);
        }
    }

    public async Task NotifyMeetingStatusChangedAsync(string companyId, string investorId, Models.DatabaseModels.InvestorMeetingRecord meeting, string newStatus, string initiatedBy)
    {
        try
        {
            var company = await _companyService.GetCompanyAsync(companyId);
            var founder = await GetUserAsync(company?.OwnerId);
            var investorUser = await FindInvestorUserAsync(investorId);
            var investorName = investorUser?.Name ?? "Investor";

            var isCancelled = string.Equals(newStatus, "cancelled", StringComparison.OrdinalIgnoreCase);
            var subject = isCancelled
                ? $"❌ Meeting Cancelled: {company?.CompanyName} & {investorName}"
                : $"🔄 Meeting Updated: {company?.CompanyName} & {investorName}";
            var body = $@"
The meeting status has been updated to: {newStatus}.

Date & Time: {meeting.StartsAt:yyyy-MM-dd HH:mm} {meeting.Timezone}
Format: {meeting.MeetingType}

Review your dashboard for next steps.
";
            if (string.Equals(initiatedBy, "entrepreneur", StringComparison.OrdinalIgnoreCase))
            {
                if (investorUser != null)
                    await SendToUserAsync(investorUser, companyId, subject, body);
            }
            else
            {
                await SendToUserAsync(founder, companyId, subject, body);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending meeting status change notification for company {CompanyId}", companyId);
        }
    }

    public async Task NotifyFinanceVerificationSubmittedAsync(string userId, string investorId)
    {
        try
        {
            var user = await GetUserAsync(userId) ?? await FindInvestorUserAsync(investorId);
            if (user == null) return;

            var subject = "📋 Finance Verification Submitted — Mondial";
            var body = $@"Hello {user.Name ?? "Investor"},

Your Finance Verification has been submitted for compliance review. You will receive an update once reviewed.

View your submission status:
/dashboard/investor/phase-2

Best regards,
Mondial Team";
            await SendToUserAsync(user, investorId, subject, body);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending finance verification submitted notification for investor {InvestorId}", investorId);
        }
    }

    public async Task NotifyFinanceVerificationApprovedAsync(string userId, string investorId)
    {
        try
        {
            var user = await GetUserAsync(userId) ?? await FindInvestorUserAsync(investorId);
            if (user == null) return;

            var subject = "✅ Finance Verification Approved — Finance Verified Badge Awarded";
            var body = $@"Hello {user.Name ?? "Investor"},

Congratulations! Your investment capacity has been verified. You have been awarded the Finance Verified Badge and can now submit investment offers on Mondial.

View your verified status:
/dashboard/investor/phase-2

Best regards,
Mondial Team";
            await SendToUserAsync(user, investorId, subject, body);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending finance verification approved notification for investor {InvestorId}", investorId);
        }
    }

    public async Task NotifyFinanceVerificationNeedsUpdateAsync(string userId, string investorId, string reason)
    {
        try
        {
            var user = await GetUserAsync(userId) ?? await FindInvestorUserAsync(investorId);
            if (user == null) return;

            var subject = "⚠️ Action Required: Finance Verification Update Needed — Mondial";
            var body = $@"Hello {user.Name ?? "Investor"},

Our verification team requested an update to your Finance Verification:
""{reason}""

Please visit your Finance Verification page to upload updated documents and resubmit:
/dashboard/investor/phase-2

Best regards,
Mondial Team";
            await SendToUserAsync(user, investorId, subject, body);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending finance verification update requested notification for investor {InvestorId}", investorId);
        }
    }

    public async Task NotifyFinanceVerificationRejectedAsync(string userId, string investorId, string reason)
    {
        try
        {
            var user = await GetUserAsync(userId) ?? await FindInvestorUserAsync(investorId);
            if (user == null) return;

            var subject = "Finance Verification Decision — Mondial";
            var body = $@"Hello {user.Name ?? "Investor"},

Your Finance Verification could not be verified at this time:
""{reason}""

View your verification details:
/dashboard/investor/phase-2

Best regards,
Mondial Team";
            await SendToUserAsync(user, investorId, subject, body);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending finance verification rejected notification for investor {InvestorId}", investorId);
        }
    }

    public async Task NotifyInvestmentAddedToPortfolioAsync(string userId, string investorId, string companyName, double amount, string currency)
    {
        try
        {
            var user = await GetUserAsync(userId) ?? await FindInvestorUserAsync(investorId);
            if (user == null) return;

            var subject = $"Investment Added to Portfolio: {companyName} — Mondial";
            var body = $@"Hello {user.Name ?? "Investor"},

Congratulations! Your investment of {currency} {amount:N0} in {companyName} has successfully closed and is now active in your portfolio.

View your portfolio:
/dashboard/investor/portfolio

Best regards,
Mondial Team";
            await SendToUserAsync(user, investorId, subject, body);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending portfolio investment added notification for investor {InvestorId} in company {CompanyName}", investorId, companyName);
        }
    }

    public async Task NotifyDiligenceQuestionAskedAsync(string companyId, string investorName, string documentTitle, string question)
    {
        try
        {
            var company = await _companyService.GetCompanyAsync(companyId);
            if (company == null) return;

            var user = await GetUserAsync(company.OwnerId);
            var subject = $"❓ Due Diligence Question: {investorName} asked about {documentTitle}";
            var body = $"{investorName} has asked a question during Due Diligence for {company.CompanyName} on document '{documentTitle}':\n\"{question}\"";
            var link = "/dashboard/entrepreneur/phase-6";

            await SendToUserAsync(user, companyId, subject, body, link, "diligence_question");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending diligence question notification for company {CompanyId}", companyId);
        }
    }

    public Task NotifyDiligenceQuestionAnsweredAsync(string investorId, string companyName, string documentTitle, string response)
        => NotifyDiligenceQuestionAnsweredAsync(investorId, companyName, documentTitle, response, null);

    public async Task NotifyDiligenceQuestionAnsweredAsync(string investorId, string companyName, string documentTitle, string response, string? companyId)
    {
        try
        {
            var user = await FindInvestorUserAsync(investorId);
            var subject = $"💬 Founder Responded: Due Diligence question for {companyName}";
            var body = $"The founder of {companyName} has responded to your question regarding {documentTitle}:\n\"{response}\"";
            var link = !string.IsNullOrWhiteSpace(companyId)
                ? $"/dashboard/investor/discovery/{companyId}/dataroom"
                : "/dashboard/investor/discovery";

            await SendToUserAsync(user, investorId, subject, body, link, "diligence_answer");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending diligence question answered notification for investor {InvestorId}", investorId);
        }
    }

    public async Task NotifyDataRoomAccessRequestedAsync(string companyId, string investorId, string requestId, string investorName)
    {
        try
        {
            var company = await _companyService.GetCompanyAsync(companyId);
            if (company == null) return;

            var user = await GetUserAsync(company.OwnerId);
            var subject = $"📥 New Data Room Access Request for {company.CompanyName}";
            var body = $"{investorName} has signed the NDA and requested access to {company.CompanyName}'s Data Room.";
            var link = "/dashboard/entrepreneur/phase-6?view=requests";

            await SendToUserAsync(user, companyId, subject, body, link, "data_room_access_request");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending data room access requested notification for company {CompanyId}", companyId);
        }
    }

    public async Task NotifyDataRoomAccessApprovedAsync(string investorUserId, string companyId, string companyName)
    {
        try
        {
            var user = await GetUserAsync(investorUserId);
            var subject = $"✅ Data Room Access Approved: {companyName}";
            var body = $"Your access request for {companyName} has been approved by the founder. You can now view the data room.";
            var link = $"/dashboard/investor/discovery/{companyId}/dataroom";

            await SendToUserAsync(user, companyId, subject, body, link, "data_room_access_approved");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending data room access approved notification to user {UserId}", investorUserId);
        }
    }

    public async Task NotifyDataRoomAccessDeclinedAsync(string investorUserId, string companyId, string companyName, string? note)
    {
        try
        {
            var user = await GetUserAsync(investorUserId);
            var subject = $"📋 Data Room Access Request Update: {companyName}";
            var body = $"Your access request for {companyName} was not approved at this time.";
            if (!string.IsNullOrWhiteSpace(note))
            {
                body += $"\nNote: {note}";
            }
            var link = $"/dashboard/investor/discovery/{companyId}/dataroom";

            await SendToUserAsync(user, companyId, subject, body, link, "data_room_access_declined");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending data room access declined notification to user {UserId}", investorUserId);
        }
    }

    public async Task NotifyDataRoomAccessRevokedAsync(string investorUserId, string companyId, string companyName)
    {
        try
        {
            var user = await GetUserAsync(investorUserId);
            var subject = $"⚠️ Data Room Access Revoked: {companyName}";
            var body = $"Your Data Room access for {companyName} has been revoked by the company.";
            var link = $"/dashboard/investor/discovery/{companyId}/dataroom";

            await SendToUserAsync(user, companyId, subject, body, link, "data_room_access_revoked");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending data room access revoked notification to user {UserId}", investorUserId);
        }
    }

    private async Task<ApplicationUser?> FindInvestorUserAsync(string investorId)
    {
        if (string.IsNullOrWhiteSpace(investorId)) return null;
        var users = await _userManager.GetUsersInRoleAsync("Investor");
        return users.FirstOrDefault(u => u.InvestorProfile?.InvestorId == investorId);
    }

    private async Task<ApplicationUser?> GetUserAsync(string? userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
            return null;

        return await _userManager.FindByIdAsync(userId);
    }

    private async Task SendToUserAsync(
        ApplicationUser? user,
        string contextId,
        string subject,
        string body,
        string? link = null,
        string? type = null,
        MongoDB.Bson.ObjectId? referenceId = null)
    {
        if (user is null)
        {
            _logger.LogWarning(
                "Notification not sent — unresolved recipient for {ContextId} (subject: {Subject})",
                contextId, subject);
            return;
        }

        // 1. In-app notification & SignalR
        try
        {
            await _notificationService.CreateNotification(user.Id, subject, body, link, type, referenceId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to persist in-app notification for user {UserId}", user.Id);
        }


        // 2. Email notification
        if (!string.IsNullOrWhiteSpace(user.Email))
        {
            try
            {
                await _emailService.SendEmailAsync(user.Email, subject, body);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Email delivery failed for user {Email}", user.Email);
            }
        }
    }
}

