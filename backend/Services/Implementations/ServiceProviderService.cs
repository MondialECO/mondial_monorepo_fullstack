using System.Text;
using Hangfire;
using Microsoft.AspNetCore.Identity;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Audit;
using WebApp.Services.Interface;
using WebApp.Services.Migrations;
using WebApp.Validation;

namespace WebApp.Services.Implementations;

/// <summary>
/// Service Provider Stage-1 / Module-1 service on the split collections.
/// Owner-scoped: userId is the authenticated principal, never a request field.
///
/// After cutover this service never writes the embedded
/// ApplicationUser.ServiceProviderProfile — every write goes to the split
/// records through the stores (migrate-on-write seeds them from the frozen
/// embedded copy on first touch). Owner-facing reads also ensure migration so
/// stable ids stay stable; cross-module reads use the dual-read aggregate
/// reader instead.
/// </summary>
public class ServiceProviderService : IServiceProviderService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IProfessionalProfileStore _professionalStore;
    private readonly IServiceProviderProfileStore _spStore;
    private readonly IUserCredentialStore _credentialStore;
    private readonly IServiceProviderProfileSplitMigration _migrator;
    private readonly IAuditLogger _audit;
    private readonly INotificationService _notifications;
    private readonly IBackgroundJobClient _jobClient;
    private readonly ILogger<ServiceProviderService> _logger;

    public ServiceProviderService(
        UserManager<ApplicationUser> userManager,
        IProfessionalProfileStore professionalStore,
        IServiceProviderProfileStore spStore,
        IUserCredentialStore credentialStore,
        IServiceProviderProfileSplitMigration migrator,
        IAuditLogger audit,
        INotificationService notifications,
        IBackgroundJobClient jobClient,
        ILogger<ServiceProviderService> logger)
    {
        _userManager = userManager;
        _professionalStore = professionalStore;
        _spStore = spStore;
        _credentialStore = credentialStore;
        _migrator = migrator;
        _audit = audit;
        _notifications = notifications;
        _jobClient = jobClient;
        _logger = logger;
    }

    // ---------------- Profile ----------------

    public async Task<ServiceProviderResult<ServiceProviderProfileResponse>> GetProfileAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return ServiceProviderResult<ServiceProviderProfileResponse>.NotFound("Service provider profile not found.");

        // Owner-scoped read migrates on first touch so portfolio/credential ids
        // are minted once and stay stable for every later addressed operation.
        var (professional, sp) = await _migrator.EnsureMigratedAsync(user);

        if (EnsurePortfolioItemIds(sp.PortfolioItems))
        {
            sp.UpdatedAt = DateTime.UtcNow;
            await _spStore.UpsertAsync(sp);
        }

        return ServiceProviderResult<ServiceProviderProfileResponse>.Ok(await ComposeAsync(professional, sp, userId));
    }

    public async Task<ServiceProviderResult<ServiceProviderProfileResponse>> UpsertProfileAsync(
        string userId, CreateOrUpdateServiceProviderProfileRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return ServiceProviderResult<ServiceProviderProfileResponse>.NotFound("Service provider profile not found.");

        var (professional, sp) = await _migrator.EnsureMigratedAsync(user);
        var now = DateTime.UtcNow;

        professional.Headline = NullIfBlank(request.Headline) ?? "";
        professional.Bio = NullIfBlank(request.Bio) ?? "";
        professional.Skills = NormalizeStrings(request.Skills);
        professional.Industries = NormalizeStrings(request.Industries);

        if (request.ProfessionalOverview is not null)
        {
            if (request.ProfessionalOverview.SchemaVersion != ProfessionalOverviewSanitizer.SchemaVersion)
                return ServiceProviderResult<ServiceProviderProfileResponse>.Invalid("Professional Overview schema version is not supported.");
            if (!ProfessionalOverviewSanitizer.TrySanitize(
                    request.ProfessionalOverview.Document, out var sanitizedDoc, out var professionalOverviewError))
                return ServiceProviderResult<ServiceProviderProfileResponse>.Invalid(professionalOverviewError);
            professional.ProfessionalOverview = new ProfessionalOverviewContent
            {
                SchemaVersion = ProfessionalOverviewSanitizer.SchemaVersion,
                Document = MongoDB.Bson.BsonDocument.Parse(sanitizedDoc!.Value.GetRawText()),
                PlainText = ExtractPlainText(sanitizedDoc!.Value),
            };
        }

        // Legacy request carries language NAMES only. Preserve existing
        // proficiencies for names that survive; new names default Conversational.
        var names = NormalizeStrings(request.Languages);
        professional.LanguageProficiencies = names.Select(name =>
            professional.LanguageProficiencies.FirstOrDefault(
                l => string.Equals(l.Language, name, StringComparison.OrdinalIgnoreCase))
            ?? new ProfessionalLanguage { Language = name, Proficiency = LanguageProficiency.Conversational })
            .ToList();
        professional.Languages = names;

        sp.ProviderId = string.IsNullOrWhiteSpace(sp.ProviderId) ? userId : sp.ProviderId;
        sp.ServiceCategories = NormalizeCategories(request.ServiceCategories);
        sp.PricingModels = NormalizePricingModels(request.PricingModels);

        // Completion spans both records; phase advance stays on the SP record.
        var view = SpProfileSplitMapper.ToCompositeView(professional, sp, Array.Empty<UserCredentialRecord>());
        if (IsProfileComplete(view) && sp.CurrentPhase < 2) sp.CurrentPhase = 2;

        // Any published-profile write bumps the version exactly once, so an open
        // editor draft correctly conflicts instead of silently overwriting this.
        professional.ProfileVersion += 1;
        professional.UpdatedAt = now;
        sp.UpdatedAt = now;

        if (!await _spStore.UpsertAsync(sp) || !await _professionalStore.UpsertAsync(professional))
            return ServiceProviderResult<ServiceProviderProfileResponse>.Conflict("Your profile could not be saved. Try again.");

        return ServiceProviderResult<ServiceProviderProfileResponse>.Ok(
            await ComposeAsync(professional, sp, userId), "Profile saved.");
    }

    // ---------------- Portfolio ----------------

    public async Task<ServiceProviderResult<ServiceProviderProfileResponse>> AddPortfolioItemAsync(
        string userId, AddPortfolioItemRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return ServiceProviderResult<ServiceProviderProfileResponse>.NotFound("Service provider profile not found.");

        var (professional, sp) = await _migrator.EnsureMigratedAsync(user);
        EnsurePortfolioItemIds(sp.PortfolioItems);

        if (sp.PortfolioItems.Count >= ServiceProviderLimits.MaxPortfolioItems)
            return ServiceProviderResult<ServiceProviderProfileResponse>.Invalid(
                $"You can keep up to {ServiceProviderLimits.MaxPortfolioItems} portfolio items. Remove one before adding another.");

        // ImagePath is not taken from the request: the image location is set only
        // by the portfolio media endpoints, which validate and re-encode the file.
        sp.PortfolioItems.Add(new PortfolioItem
        {
            Title = request.Title?.Trim() ?? "",
            Description = request.Description?.Trim(),
            Url = NullIfBlank(request.Url),
            ImageCaption = NullIfBlank(request.ImageCaption),
            AddedAt = DateTime.UtcNow,
        });
        sp.UpdatedAt = DateTime.UtcNow;

        if (!await _spStore.UpsertAsync(sp))
            return ServiceProviderResult<ServiceProviderProfileResponse>.Conflict("The portfolio item could not be saved.");

        return ServiceProviderResult<ServiceProviderProfileResponse>.Ok(
            await ComposeAsync(professional, sp, userId), "Portfolio item added.");
    }

    public async Task<ServiceProviderResult<ServiceProviderProfileResponse>> UpdatePortfolioItemAsync(
        string userId, UpdatePortfolioItemRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return ServiceProviderResult<ServiceProviderProfileResponse>.NotFound("Service provider profile not found.");

        var (professional, sp) = await _migrator.EnsureMigratedAsync(user);
        EnsurePortfolioItemIds(sp.PortfolioItems);

        // Addressed by stable id, never by position: an index captured before a
        // concurrent delete would otherwise overwrite a different item.
        var item = sp.PortfolioItems.FirstOrDefault(value => value.Id == request.Id);
        if (item is null)
            return ServiceProviderResult<ServiceProviderProfileResponse>.NotFound("Portfolio item not found.");

        // Mutate in place so AddedAt, the stable Id and the image are preserved.
        item.Title = request.Title?.Trim() ?? "";
        item.Description = request.Description?.Trim();
        item.Url = NullIfBlank(request.Url);
        if (request.ImageCaption is not null) item.ImageCaption = NullIfBlank(request.ImageCaption);
        sp.UpdatedAt = DateTime.UtcNow;

        if (!await _spStore.UpsertAsync(sp))
            return ServiceProviderResult<ServiceProviderProfileResponse>.Conflict("The portfolio item could not be saved.");

        return ServiceProviderResult<ServiceProviderProfileResponse>.Ok(
            await ComposeAsync(professional, sp, userId), "Portfolio item updated.");
    }

    public async Task<ServiceProviderResult<ServiceProviderProfileResponse>> DeletePortfolioItemAsync(
        string userId, string portfolioItemId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return ServiceProviderResult<ServiceProviderProfileResponse>.NotFound("Service provider profile not found.");

        var (professional, sp) = await _migrator.EnsureMigratedAsync(user);
        EnsurePortfolioItemIds(sp.PortfolioItems);

        // Addressed by stable id, never by position: an index captured before a
        // concurrent delete would otherwise remove a different item.
        var item = sp.PortfolioItems.FirstOrDefault(value => value.Id == portfolioItemId);
        if (item is null)
            return ServiceProviderResult<ServiceProviderProfileResponse>.NotFound("Portfolio item not found.");

        sp.PortfolioItems.Remove(item);
        sp.UpdatedAt = DateTime.UtcNow;

        if (!await _spStore.UpsertAsync(sp))
            return ServiceProviderResult<ServiceProviderProfileResponse>.Conflict("The portfolio item could not be removed.");

        // Delete the image only after the item is durably gone. Nothing can
        // reference this file once the item's id no longer exists, so cleanup
        // has to happen here rather than via the media endpoints. Attempt immediate
        // deletion; on failure, enqueue a durable Hangfire job for retry.
        ProviderMediaFiles.DeleteBestEffort(item.PrimaryImage?.PublicUrl, _logger, _jobClient);
        ProviderMediaFiles.DeleteBestEffort(item.ImagePath, _logger, _jobClient);

        return ServiceProviderResult<ServiceProviderProfileResponse>.Ok(
            await ComposeAsync(professional, sp, userId), "Portfolio item deleted.");
    }

    // ---------------- Verification ----------------

    public async Task<ServiceProviderResult<ServiceProviderVerificationResponse>> SubmitVerificationAsync(
        string userId, SubmitVerificationRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return ServiceProviderResult<ServiceProviderVerificationResponse>.NotFound("Service provider profile not found.");

        var (professional, sp) = await _migrator.EnsureMigratedAsync(user);

        // A first submission auto-verifies. A previously-Rejected provider may
        // resubmit only into the moderation queue so an admin suspension cannot
        // be silently undone. UnderReview/Verified cannot submit again.
        if (sp.VerificationStatus is not (ServiceProviderVerificationStatus.Pending
            or ServiceProviderVerificationStatus.Rejected))
            return ServiceProviderResult<ServiceProviderVerificationResponse>.Conflict(
                "Verification has already been submitted.");

        var completenessView = SpProfileSplitMapper.ToCompositeView(professional, sp, Array.Empty<UserCredentialRecord>());
        if (!IsProfileComplete(completenessView))
            return ServiceProviderResult<ServiceProviderVerificationResponse>.Conflict(
                "Complete every required profile field before submitting for verification.");

        var now = DateTime.UtcNow;
        var isInitialSubmission = sp.VerificationStatus == ServiceProviderVerificationStatus.Pending;

        sp.VerificationSubmittedAt = now;
        sp.RejectionReason = null;

        if (isInitialSubmission)
        {
            sp.VerificationStatus = ServiceProviderVerificationStatus.Verified;
            sp.VerifiedAt = now;
            // Verification approval is the ONLY path that may grant Tier 2; it
            // never downgrades a higher, separately-earned tier.
            if (sp.ProviderTier < ProviderTier.Tier2) sp.ProviderTier = ProviderTier.Tier2;
            RecalculateTrustScore(sp);
        }
        else
        {
            // Rejected→UnderReview is intentionally the sole moderation path.
            sp.VerificationStatus = ServiceProviderVerificationStatus.UnderReview;
            sp.VerifiedAt = null;
        }

        sp.UpdatedAt = now;
        if (!await _spStore.UpsertAsync(sp))
            return ServiceProviderResult<ServiceProviderVerificationResponse>.Conflict(
                "Verification could not be submitted. Try again.");

        _audit.Record("ServiceProviderVerification.Submit", userId, success: true, new
        {
            skills = professional.Skills.Count,
            categories = sp.ServiceCategories.Count,
            portfolioCount = sp.PortfolioItems.Count,
            resultingStatus = sp.VerificationStatus.ToString(),
        });

        return ServiceProviderResult<ServiceProviderVerificationResponse>.Ok(
            ToVerification(professional, sp),
            isInitialSubmission ? "Provider profile verified." : "Resubmitted for admin review.");
    }

    public async Task<ServiceProviderResult<List<PendingProviderResponse>>> GetPendingVerificationsAsync()
    {
        // Indexed queue from the split collection, plus a legacy sweep for users
        // not yet migrated (dual-read is per user, never assumed global).
        var records = await _spStore.GetPendingVerificationsAsync();
        var byUserId = new Dictionary<string, PendingProviderResponse>(StringComparer.Ordinal);

        foreach (var record in records)
        {
            var user = await _userManager.FindByIdAsync(record.UserId);
            if (user is null) continue;
            var professional = await _professionalStore.GetByUserIdAsync(record.UserId)
                ?? SpProfileSplitMapper.ToProfessionalRecord(user);
            byUserId[record.UserId] = new PendingProviderResponse
            {
                UserId = record.UserId,
                Name = user.Name,
                Email = user.Email,
                Profile = await ComposeAsync(professional, record, record.UserId),
            };
        }

        foreach (var user in _userManager.Users.ToList()
            .Where(u => u.ServiceProviderProfile is { VerificationStatus: ServiceProviderVerificationStatus.UnderReview }))
        {
            var id = user.Id.ToString();
            if (byUserId.ContainsKey(id)) continue; // split record wins
            if (await _spStore.GetByUserIdAsync(id) is not null) continue; // migrated but no longer pending
            byUserId[id] = new PendingProviderResponse
            {
                UserId = id,
                Name = user.Name,
                Email = user.Email,
                Profile = user.ServiceProviderProfile!.ToResponse(),
            };
        }

        var pending = byUserId.Values
            .OrderBy(p => p.Profile.VerificationSubmittedAt)
            .ToList();

        return ServiceProviderResult<List<PendingProviderResponse>>.Ok(pending, "OK");
    }

    public async Task<ServiceProviderResult<ServiceProviderVerificationResponse>> ApproveVerificationAsync(
        string providerUserId, string adminUserId)
    {
        var user = await _userManager.FindByIdAsync(providerUserId);
        if (user is null)
            return ServiceProviderResult<ServiceProviderVerificationResponse>.NotFound("Service provider profile not found.");

        var (professional, sp) = await _migrator.EnsureMigratedAsync(user);
        if (sp.VerificationStatus != ServiceProviderVerificationStatus.UnderReview)
            return ServiceProviderResult<ServiceProviderVerificationResponse>.Conflict(
                "Verification is not awaiting review.");

        sp.VerificationStatus = ServiceProviderVerificationStatus.Verified;
        sp.VerifiedAt = DateTime.UtcNow;
        sp.RejectionReason = null;
        // Approval grants Tier 2 per the approved criteria; Tier 3/4 remain
        // separate, authorised server-side evaluations and are never set here.
        if (sp.ProviderTier < ProviderTier.Tier2) sp.ProviderTier = ProviderTier.Tier2;
        // TrustScore is DERIVED, never hand-set: recompute from the breakdown so a
        // freshly-verified provider reads "not enough data" until a signal lands.
        RecalculateTrustScore(sp);
        sp.UpdatedAt = DateTime.UtcNow;

        if (!await _spStore.UpsertAsync(sp))
            return ServiceProviderResult<ServiceProviderVerificationResponse>.Conflict(
                "Approval could not be saved. Try again.");

        _audit.Record("ServiceProviderVerification.Approve", adminUserId, success: true, new
        {
            providerUserId,
            trustScore = sp.TrustScore,
            hasEnoughTrustData = sp.HasEnoughTrustData,
            providerTier = sp.ProviderTier.ToString(),
        });

        await NotifyAsync(user.Id,
            "Provider verification approved",
            "Your service provider profile has been verified. Your Verified Provider Badge is now active.");

        return ServiceProviderResult<ServiceProviderVerificationResponse>.Ok(
            ToVerification(professional, sp), "Provider verified.");
    }

    public async Task<ServiceProviderResult<ServiceProviderVerificationResponse>> RejectVerificationAsync(
        string providerUserId, string adminUserId, string reason)
    {
        var user = await _userManager.FindByIdAsync(providerUserId);
        if (user is null)
            return ServiceProviderResult<ServiceProviderVerificationResponse>.NotFound("Service provider profile not found.");

        var (professional, sp) = await _migrator.EnsureMigratedAsync(user);
        if (sp.VerificationStatus is not (ServiceProviderVerificationStatus.UnderReview
            or ServiceProviderVerificationStatus.Verified))
            return ServiceProviderResult<ServiceProviderVerificationResponse>.Conflict(
                "Provider verification is not eligible for rejection.");

        sp.VerificationStatus = ServiceProviderVerificationStatus.Rejected;
        sp.RejectionReason = reason;
        sp.VerifiedAt = null;
        sp.UpdatedAt = DateTime.UtcNow;

        if (!await _spStore.UpsertAsync(sp))
            return ServiceProviderResult<ServiceProviderVerificationResponse>.Conflict(
                "Rejection could not be saved. Try again.");

        _audit.Record("ServiceProviderVerification.Reject", adminUserId, success: true, new { providerUserId, reason });

        await NotifyAsync(user.Id,
            "Provider verification needs changes",
            $"Your service provider verification was not approved. Reason: {reason}");

        return ServiceProviderResult<ServiceProviderVerificationResponse>.Ok(
            ToVerification(professional, sp), "Provider verification rejected.");
    }

    // ---------------- Module 1: Trust & Skills Test ----------------

    public async Task<ServiceProviderResult<TrustBreakdownResponse>> GetTrustAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return ServiceProviderResult<TrustBreakdownResponse>.NotFound("Service provider profile not found.");

        var (professional, sp) = await _migrator.EnsureMigratedAsync(user);
        // Recompute in-memory so the projection always reflects current signals.
        // Not persisted here — persistence happens at the mutation points.
        RecalculateTrustScore(sp);
        var response = SpProfileSplitMapper
            .ToCompositeView(professional, sp, Array.Empty<UserCredentialRecord>())
            .ToTrustBreakdownResponse();
        response.TierLevel = (int)sp.ProviderTier; // SP tier source of truth after cutover
        return ServiceProviderResult<TrustBreakdownResponse>.Ok(response);
    }

    public async Task<ServiceProviderResult<SkillsTestStatusResponse>> GetSkillsTestStatusAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return ServiceProviderResult<SkillsTestStatusResponse>.NotFound("Service provider profile not found.");

        var (_, sp) = await _migrator.EnsureMigratedAsync(user);
        var isVerified = sp.VerificationStatus == ServiceProviderVerificationStatus.Verified;

        var categories = sp.ServiceCategories.Select(cat =>
        {
            var latest = sp.SkillsTestAttempts
                .Where(a => a.Category == cat)
                .OrderByDescending(a => a.TakenAt)
                .FirstOrDefault();

            var canTakeNow = isVerified &&
                (latest is null || DateTime.UtcNow >= latest.NextEligibleRetestAt);

            return new SkillsTestCategoryStatus
            {
                Category = cat.ToString(),
                HasAttempt = latest is not null,
                LastScore = latest?.Score,
                LastPassed = latest?.Passed,
                LastTakenAt = latest?.TakenAt,
                NextEligibleRetestAt = latest?.NextEligibleRetestAt,
                CanTakeNow = canTakeNow,
            };
        }).ToList();

        return ServiceProviderResult<SkillsTestStatusResponse>.Ok(new SkillsTestStatusResponse
        {
            IsVerified = isVerified,
            PassThresholdPercent = SkillsTestQuestionBank.PassThresholdPercent,
            QuestionsPerAttempt = SkillsTestQuestionBank.QuestionsPerAttempt,
            CooldownDays = SkillsTestQuestionBank.RetestCooldownDays,
            Categories = categories,
        });
    }

    public async Task<ServiceProviderResult<SkillsTestQuestionsResponse>> GetSkillsTestQuestionsAsync(
        string userId, string category)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return ServiceProviderResult<SkillsTestQuestionsResponse>.NotFound("Service provider profile not found.");

        var (_, sp) = await _migrator.EnsureMigratedAsync(user);

        if (sp.VerificationStatus != ServiceProviderVerificationStatus.Verified)
            return ServiceProviderResult<SkillsTestQuestionsResponse>.Conflict(
                "The skills test is available once your provider profile is verified.");

        if (!Enum.TryParse<ServiceCategory>(category, ignoreCase: true, out var cat))
            return ServiceProviderResult<SkillsTestQuestionsResponse>.NotFound("Unknown service category.");

        if (!sp.ServiceCategories.Contains(cat))
            return ServiceProviderResult<SkillsTestQuestionsResponse>.Conflict(
                "You can only take the skills test for one of your own service categories.");

        // Cooldown gate.
        var latest = sp.SkillsTestAttempts
            .Where(a => a.Category == cat)
            .OrderByDescending(a => a.TakenAt)
            .FirstOrDefault();
        if (latest is not null && DateTime.UtcNow < latest.NextEligibleRetestAt)
            return ServiceProviderResult<SkillsTestQuestionsResponse>.Conflict(
                $"You can retake this category's skills test after {latest.NextEligibleRetestAt:yyyy-MM-dd}.");

        var bank = SkillsTestQuestionBank.ForCategory(cat);
        var take = Math.Min(SkillsTestQuestionBank.QuestionsPerAttempt, bank.Count);
        var selected = bank
            .OrderBy(_ => Random.Shared.Next())
            .Take(take)
            .Select(q => new SkillsTestQuestionResponse
            {
                Id = q.Id,
                Prompt = q.Prompt,
                Options = new List<string>(q.Options),
            })
            .ToList();

        return ServiceProviderResult<SkillsTestQuestionsResponse>.Ok(new SkillsTestQuestionsResponse
        {
            Category = cat.ToString(),
            QuestionCount = selected.Count,
            PassThresholdPercent = SkillsTestQuestionBank.PassThresholdPercent,
            Questions = selected,
        });
    }

    public async Task<ServiceProviderResult<SkillsTestResultResponse>> SubmitSkillsTestAsync(
        string userId, SubmitSkillsTestRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return ServiceProviderResult<SkillsTestResultResponse>.NotFound("Service provider profile not found.");

        var (professional, sp) = await _migrator.EnsureMigratedAsync(user);

        if (sp.VerificationStatus != ServiceProviderVerificationStatus.Verified)
            return ServiceProviderResult<SkillsTestResultResponse>.Conflict(
                "The skills test is available once your provider profile is verified.");

        if (!Enum.TryParse<ServiceCategory>(request.Category, ignoreCase: true, out var cat))
            return ServiceProviderResult<SkillsTestResultResponse>.NotFound("Unknown service category.");

        if (!sp.ServiceCategories.Contains(cat))
            return ServiceProviderResult<SkillsTestResultResponse>.Conflict(
                "You can only take the skills test for one of your own service categories.");

        // Cooldown gate (authoritative — re-checked at submit, not just at fetch).
        var latest = sp.SkillsTestAttempts
            .Where(a => a.Category == cat)
            .OrderByDescending(a => a.TakenAt)
            .FirstOrDefault();
        if (latest is not null && DateTime.UtcNow < latest.NextEligibleRetestAt)
            return ServiceProviderResult<SkillsTestResultResponse>.Conflict(
                $"You can retake this category's skills test after {latest.NextEligibleRetestAt:yyyy-MM-dd}.");

        var answers = request.Answers ?? new List<SkillsTestAnswer>();
        var expected = Math.Min(SkillsTestQuestionBank.QuestionsPerAttempt,
            SkillsTestQuestionBank.ForCategory(cat).Count);

        // Grade only valid, distinct questions belonging to this category (first
        // answer wins per question id; unknown ids are dropped). Correct answers
        // never leave the server.
        var graded = answers
            .GroupBy(a => a.QuestionId)
            .Select(g => g.First())
            .Select(a => new { Question = SkillsTestQuestionBank.ById(cat, a.QuestionId), a.SelectedIndex })
            .Where(x => x.Question is not null)
            .ToList();

        if (graded.Count != expected)
            return ServiceProviderResult<SkillsTestResultResponse>.Conflict(
                $"Answer all {expected} questions from this attempt before submitting.");

        var correct = graded.Count(x => x.SelectedIndex == x.Question!.CorrectIndex);
        var total = graded.Count;
        var scorePct = (int)Math.Round(100.0 * correct / total);
        var passed = scorePct >= SkillsTestQuestionBank.PassThresholdPercent;
        var now = DateTime.UtcNow;
        var nextEligible = now.AddDays(SkillsTestQuestionBank.RetestCooldownDays);

        sp.SkillsTestAttempts.Add(new SkillsTestAttempt
        {
            Category = cat,
            Score = scorePct,
            Passed = passed,
            TakenAt = now,
            NextEligibleRetestAt = nextEligible,
        });

        // Feed the skill-test signal → recompute the derived trust score → persist.
        RecalculateTrustScore(sp);
        sp.UpdatedAt = now;
        if (!await _spStore.UpsertAsync(sp))
            return ServiceProviderResult<SkillsTestResultResponse>.Conflict(
                "The attempt could not be saved. Try again.");

        _audit.Record("ServiceProviderSkillsTest.Submit", userId, success: true, new
        {
            category = cat.ToString(),
            score = scorePct,
            passed,
        });

        var trust = SpProfileSplitMapper
            .ToCompositeView(professional, sp, Array.Empty<UserCredentialRecord>())
            .ToTrustBreakdownResponse();
        trust.TierLevel = (int)sp.ProviderTier;

        var result = new SkillsTestResultResponse
        {
            Category = cat.ToString(),
            Score = scorePct,
            CorrectCount = correct,
            TotalCount = total,
            Passed = passed,
            TakenAt = now,
            NextEligibleRetestAt = nextEligible,
            Trust = trust,
        };

        return ServiceProviderResult<SkillsTestResultResponse>.Ok(result,
            passed ? "Skills test passed." : "Skills test recorded.");
    }

    public async Task UpdateResponseRateSignalAsync(string userId, double? responseRate)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return;
        var (_, sp) = await _migrator.EnsureMigratedAsync(user);
        sp.TrustBreakdown.ResponseRate.HasData = responseRate.HasValue;
        sp.TrustBreakdown.ResponseRate.Value = Math.Clamp(responseRate ?? 0, 0, 100);
        RecalculateTrustScore(sp);
        sp.UpdatedAt = DateTime.UtcNow;
        if (!await _spStore.UpsertAsync(sp))
            _logger.LogWarning("Response-rate trust signal write was not acknowledged for a provider.");
    }

    public async Task UpdateWorkroomTrustSignalsAsync(string userId, double? clientSatisfaction,
        double? onTimeDeliveryRate, double? repeatClientRate, int adverseDisputeCount)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return;
        var (_, sp) = await _migrator.EnsureMigratedAsync(user);
        SetSignal(sp.TrustBreakdown.ClientSatisfaction, clientSatisfaction);
        SetSignal(sp.TrustBreakdown.OnTimeDelivery, onTimeDeliveryRate);
        SetSignal(sp.TrustBreakdown.RepeatClientRate, repeatClientRate);
        sp.TrustBreakdown.HasDisputes = adverseDisputeCount > 0;
        sp.TrustBreakdown.DisputePenalty = Math.Min(20, Math.Max(0, adverseDisputeCount) * 5);
        RecalculateTrustScore(sp);
        sp.UpdatedAt = DateTime.UtcNow;
        if (!await _spStore.UpsertAsync(sp))
            _logger.LogWarning("Workroom trust signal write was not acknowledged for a provider.");
    }

    // ---------------- pure helpers ----------------

    /// <summary>Owner response: composite of both records plus owned credentials.</summary>
    private async Task<ServiceProviderProfileResponse> ComposeAsync(
        ProfessionalProfileRecord professional, ServiceProviderProfileRecord sp, string userId)
    {
        var credentials = await _credentialStore.GetByUserIdAsync(userId);
        return SpProfileSplitMapper.ToCompositeView(professional, sp, credentials).ToResponse();
    }

    private static ServiceProviderVerificationResponse ToVerification(
        ProfessionalProfileRecord professional, ServiceProviderProfileRecord sp) =>
        SpProfileSplitMapper
            .ToCompositeView(professional, sp, Array.Empty<UserCredentialRecord>())
            .ToVerificationResponse();

    internal static bool EnsurePortfolioItemIds(ServiceProviderProfile profile) =>
        EnsurePortfolioItemIds(profile.PortfolioItems);

    internal static bool EnsurePortfolioItemIds(List<PortfolioItem> items)
    {
        var changed = false;
        var used = new HashSet<string>(StringComparer.Ordinal);
        foreach (var item in items)
        {
            if (string.IsNullOrWhiteSpace(item.Id) || !used.Add(item.Id))
            {
                item.Id = Guid.NewGuid().ToString("N");
                used.Add(item.Id);
                changed = true;
            }
        }
        return changed;
    }

    private static void SetSignal(TrustSignal signal, double? value)
    {
        signal.HasData = value.HasValue;
        signal.Value = Math.Clamp(value ?? 0, 0, 100);
    }

    // Locked Module-1 weights (sum 100): Client Satisfaction 40, On-time 25,
    // Response 15, Repeat 10, Skill Test 10. Dispute penalty subtracts after.
    private const double WeightClientSatisfaction = 0.40;
    private const double WeightOnTimeDelivery = 0.25;
    private const double WeightResponseRate = 0.15;
    private const double WeightRepeatClientRate = 0.10;
    private const double WeightSkillTest = 0.10;

    /// <summary>
    /// Derives TrustScore from the breakdown (split record). Signals without data
    /// are renormalized out; the dispute penalty subtracts from the final score.
    /// Never client-set.
    /// </summary>
    internal static void RecalculateTrustScore(ServiceProviderProfileRecord sp)
    {
        RecomputeSkillTestSignal(sp);
        var b = sp.TrustBreakdown;

        var parts = new (TrustSignal Signal, double Weight)[]
        {
            (b.ClientSatisfaction, WeightClientSatisfaction),
            (b.OnTimeDelivery, WeightOnTimeDelivery),
            (b.ResponseRate, WeightResponseRate),
            (b.RepeatClientRate, WeightRepeatClientRate),
            (b.SkillTest, WeightSkillTest),
        };

        var withData = parts.Where(p => p.Signal.HasData).ToList();
        sp.HasEnoughTrustData = withData.Count > 0;

        if (!sp.HasEnoughTrustData)
        {
            sp.TrustScore = 0;
            b.LastRecalculatedAt = DateTime.UtcNow;
            return;
        }

        var totalWeight = withData.Sum(p => p.Weight);
        var weighted = withData.Sum(p => Math.Clamp(p.Signal.Value, 0, 100) * (p.Weight / totalWeight));
        if (b.HasDisputes) weighted -= Math.Clamp(b.DisputePenalty, 0, 100);

        sp.TrustScore = Math.Round(Math.Clamp(weighted, 0, 100), 1);
        b.LastRecalculatedAt = DateTime.UtcNow;
    }

    /// <summary>Latest attempt per category → averaged into the SkillTest signal.</summary>
    private static void RecomputeSkillTestSignal(ServiceProviderProfileRecord sp)
    {
        var latestPerCategory = sp.SkillsTestAttempts
            .GroupBy(a => a.Category)
            .Select(g => g.OrderByDescending(a => a.TakenAt).First())
            .ToList();

        if (latestPerCategory.Count == 0)
        {
            sp.TrustBreakdown.SkillTest.HasData = false;
            sp.TrustBreakdown.SkillTest.Value = 0;
            return;
        }

        sp.TrustBreakdown.SkillTest.HasData = true;
        sp.TrustBreakdown.SkillTest.Value = Math.Round(latestPerCategory.Average(a => (double)a.Score), 1);
    }

    private async Task NotifyAsync(Guid userId, string title, string body)
    {
        try
        {
            await _notifications.NotifyUser(userId, title, body);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Provider verification notification failed for {UserId} (non-fatal).", userId);
        }
    }

    private static string? NullIfBlank(string? s) => string.IsNullOrWhiteSpace(s) ? null : s.Trim();

    private static bool HasAtLeastOneSkill(ServiceProviderProfile p) =>
        p.Skills.Any(s => !string.IsNullOrWhiteSpace(s));

    /// <summary>Stage-2 completeness gate, evaluated over the composite view so it
    /// spans both split records without duplicating the formula.</summary>
    internal static bool IsProfileComplete(ServiceProviderProfile p) =>
        HasAtLeastOneSkill(p) &&
        p.ServiceCategories.Count > 0 &&
        !string.IsNullOrWhiteSpace(p.Headline) &&
        !string.IsNullOrWhiteSpace(p.Bio) &&
        p.Industries.Count > 0 &&
        p.Languages.Count > 0 &&
        p.PortfolioItems.Count > 0;

    internal static List<string> NormalizeStrings(IEnumerable<string>? values)
    {
        var result = new List<string>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var value in values ?? Enumerable.Empty<string>())
        {
            var trimmed = value?.Trim();
            if (string.IsNullOrWhiteSpace(trimmed)) continue;
            if (seen.Add(trimmed)) result.Add(trimmed);
        }
        return result;
    }

    internal static List<PricingModel> NormalizePricingModels(IEnumerable<string>? models)
    {
        var result = new List<PricingModel>();
        var seen = new HashSet<PricingModel>();
        foreach (var value in models ?? Enumerable.Empty<string>())
        {
            if (!Enum.TryParse<PricingModel>(value?.Trim(), ignoreCase: true, out var parsed)) continue;
            if (seen.Add(parsed)) result.Add(parsed);
        }
        return result;
    }

    internal static List<ServiceCategory> NormalizeCategories(IEnumerable<string>? categories)
    {
        var result = new List<ServiceCategory>();
        var seen = new HashSet<ServiceCategory>();
        foreach (var value in categories ?? Enumerable.Empty<string>())
        {
            if (!Enum.TryParse<ServiceCategory>(value?.Trim(), ignoreCase: true, out var parsed)) continue;
            if (seen.Add(parsed)) result.Add(parsed);
        }
        return result;
    }

    internal static string ExtractPlainText(System.Text.Json.JsonElement document)
    {
        var sb = new StringBuilder();
        ExtractTextFromNode(document, sb);
        return sb.ToString().Trim();
    }

    private static void ExtractTextFromNode(System.Text.Json.JsonElement node, StringBuilder sb)
    {
        if (node.ValueKind != System.Text.Json.JsonValueKind.Object) return;

        if (node.TryGetProperty("text", out var text) &&
            text.ValueKind == System.Text.Json.JsonValueKind.String)
        {
            sb.Append(text.GetString());
        }

        if (node.TryGetProperty("content", out var content) &&
            content.ValueKind == System.Text.Json.JsonValueKind.Array)
        {
            foreach (var child in content.EnumerateArray())
            {
                ExtractTextFromNode(child, sb);
                if (child.TryGetProperty("type", out var type) &&
                    type.ValueKind == System.Text.Json.JsonValueKind.String &&
                    type.GetString() is "paragraph" or "heading" or "listItem" or "blockquote")
                {
                    sb.Append(' ');
                }
            }
        }
    }
}
