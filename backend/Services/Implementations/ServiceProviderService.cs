using Microsoft.AspNetCore.Identity;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Audit;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations;

/// <summary>
/// D-1 Phase 4 — Service Provider Stage-1 service. Reads/writes the embedded
/// ServiceProviderProfile via UserManager (no separate collection, no repository).
/// Owner-scoped: the userId is the authenticated principal, never a request field.
/// Holds all Stage-1 decision logic (normalization, portfolio indexing,
/// completeness gate and verification state transitions. A complete first
/// submission is verified immediately; UnderReview is reserved for moderation
/// after an admin rejection.
/// </summary>
public class ServiceProviderService : IServiceProviderService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IAuditLogger _audit;
    private readonly INotificationService _notifications;
    private readonly ILogger<ServiceProviderService> _logger;

    public ServiceProviderService(
        UserManager<ApplicationUser> userManager,
        IAuditLogger audit,
        INotificationService notifications,
        ILogger<ServiceProviderService> logger)
    {
        _userManager = userManager;
        _audit = audit;
        _notifications = notifications;
        _logger = logger;
    }

    public async Task<ServiceProviderResult<ServiceProviderProfileResponse>> GetProfileAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return ServiceProviderResult<ServiceProviderProfileResponse>.NotFound("Service provider profile not found.");

        var profile = EnsureProfile(user);
        return ServiceProviderResult<ServiceProviderProfileResponse>.Ok(profile.ToResponse());
    }

    public async Task<ServiceProviderResult<ServiceProviderProfileResponse>> UpsertProfileAsync(
        string userId, CreateOrUpdateServiceProviderProfileRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return ServiceProviderResult<ServiceProviderProfileResponse>.NotFound("Service provider profile not found.");

        var profile = EnsureProfile(user);
        profile.ProviderId ??= user.Id.ToString();
        profile.Skills = NormalizeStrings(request.Skills);
        profile.ServiceCategories = NormalizeCategories(request.ServiceCategories);

        // ---- Stage 2: Provider Profile (D-2 Phase 4) ----
        profile.Headline = NullIfBlank(request.Headline);
        profile.Bio = NullIfBlank(request.Bio);
        profile.Industries = NormalizeStrings(request.Industries);
        profile.Languages = NormalizeStrings(request.Languages);
        profile.PricingModels = NormalizePricingModels(request.PricingModels);

        MaybeAdvancePhase(profile);
        Touch(profile);

        await _userManager.UpdateAsync(user);
        return ServiceProviderResult<ServiceProviderProfileResponse>.Ok(profile.ToResponse(), "Profile saved.");
    }

    public async Task<ServiceProviderResult<ServiceProviderProfileResponse>> AddPortfolioItemAsync(
        string userId, AddPortfolioItemRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return ServiceProviderResult<ServiceProviderProfileResponse>.NotFound("Service provider profile not found.");

        var profile = EnsureProfile(user);
        profile.PortfolioItems.Add(new PortfolioItem
        {
            Title = request.Title?.Trim() ?? "",
            Description = request.Description?.Trim(),
            Url = NullIfBlank(request.Url),
            ImagePath = NullIfBlank(request.ImagePath),
            AddedAt = DateTime.UtcNow,
        });
        Touch(profile);

        await _userManager.UpdateAsync(user);
        return ServiceProviderResult<ServiceProviderProfileResponse>.Ok(profile.ToResponse(), "Portfolio item added.");
    }

    public async Task<ServiceProviderResult<ServiceProviderProfileResponse>> UpdatePortfolioItemAsync(
        string userId, UpdatePortfolioItemRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return ServiceProviderResult<ServiceProviderProfileResponse>.NotFound("Service provider profile not found.");

        var profile = EnsureProfile(user);
        if (request.Index < 0 || request.Index >= profile.PortfolioItems.Count)
            return ServiceProviderResult<ServiceProviderProfileResponse>.NotFound("Portfolio item not found.");

        // Mutate in place so AddedAt is preserved across the update.
        var item = profile.PortfolioItems[request.Index];
        item.Title = request.Title?.Trim() ?? "";
        item.Description = request.Description?.Trim();
        item.Url = NullIfBlank(request.Url);
        item.ImagePath = NullIfBlank(request.ImagePath);
        Touch(profile);

        await _userManager.UpdateAsync(user);
        return ServiceProviderResult<ServiceProviderProfileResponse>.Ok(profile.ToResponse(), "Portfolio item updated.");
    }

    public async Task<ServiceProviderResult<ServiceProviderProfileResponse>> DeletePortfolioItemAsync(
        string userId, int index)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return ServiceProviderResult<ServiceProviderProfileResponse>.NotFound("Service provider profile not found.");

        var profile = EnsureProfile(user);
        if (index < 0 || index >= profile.PortfolioItems.Count)
            return ServiceProviderResult<ServiceProviderProfileResponse>.NotFound("Portfolio item not found.");

        profile.PortfolioItems.RemoveAt(index);
        Touch(profile);

        await _userManager.UpdateAsync(user);
        return ServiceProviderResult<ServiceProviderProfileResponse>.Ok(profile.ToResponse(), "Portfolio item deleted.");
    }

    public async Task<ServiceProviderResult<ServiceProviderVerificationResponse>> SubmitVerificationAsync(
        string userId, SubmitVerificationRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return ServiceProviderResult<ServiceProviderVerificationResponse>.NotFound("Service provider profile not found.");

        var profile = EnsureProfile(user);

        // A first submission auto-verifies. A previously-Rejected provider may
        // resubmit only into the moderation queue so an admin suspension cannot
        // be silently undone. UnderReview/Verified cannot submit again.
        if (profile.VerificationStatus is not (ServiceProviderVerificationStatus.Pending
            or ServiceProviderVerificationStatus.Rejected))
            return ServiceProviderResult<ServiceProviderVerificationResponse>.Conflict(
                "Verification has already been submitted.");

        // Enforce the full Stage-2 completeness predicate against the persisted
        // profile; a stateless request validator cannot inspect these fields.
        if (!IsProfileComplete(profile))
            return ServiceProviderResult<ServiceProviderVerificationResponse>.Conflict(
                "Complete every required profile field before submitting for verification.");

        var now = DateTime.UtcNow;
        var isInitialSubmission = profile.VerificationStatus == ServiceProviderVerificationStatus.Pending;

        profile.VerificationSubmittedAt = now;
        profile.RejectionReason = null;

        if (isInitialSubmission)
        {
            profile.VerificationStatus = ServiceProviderVerificationStatus.Verified;
            profile.VerifiedAt = now;
            RecalculateTrustScore(profile);
        }
        else
        {
            // Rejected→UnderReview is intentionally the sole moderation path.
            profile.VerificationStatus = ServiceProviderVerificationStatus.UnderReview;
            profile.VerifiedAt = null;
        }

        Touch(profile);

        await _userManager.UpdateAsync(user);

        _audit.Record("ServiceProviderVerification.Submit", userId, success: true, new
        {
            skills = profile.Skills.Count,
            categories = profile.ServiceCategories.Count,
            portfolioCount = profile.PortfolioItems.Count,
            resultingStatus = profile.VerificationStatus.ToString(),
        });

        return ServiceProviderResult<ServiceProviderVerificationResponse>.Ok(
            profile.ToVerificationResponse(),
            isInitialSubmission ? "Provider profile verified." : "Resubmitted for admin review.");
    }

    public Task<ServiceProviderResult<List<PendingProviderResponse>>> GetPendingVerificationsAsync()
    {
        // The profile is embedded on ApplicationUser, so we materialize and filter
        // in memory: robust against LINQ-to-Mongo translation of the nested enum,
        // and adequate at the current user scale. A server-side filtered index is
        // a later optimization, not needed for this surface.
        var pending = _userManager.Users.ToList()
            .Where(u => u.ServiceProviderProfile is
            {
                VerificationStatus: ServiceProviderVerificationStatus.UnderReview
            })
            .OrderBy(u => u.ServiceProviderProfile!.VerificationSubmittedAt)
            .Select(u => new PendingProviderResponse
            {
                UserId = u.Id.ToString(),
                Name = u.Name,
                Email = u.Email,
                Profile = u.ServiceProviderProfile!.ToResponse(),
            })
            .ToList();

        return Task.FromResult(
            ServiceProviderResult<List<PendingProviderResponse>>.Ok(pending, "OK"));
    }

    public async Task<ServiceProviderResult<ServiceProviderVerificationResponse>> ApproveVerificationAsync(
        string providerUserId, string adminUserId)
    {
        var user = await _userManager.FindByIdAsync(providerUserId);
        if (user is null)
            return ServiceProviderResult<ServiceProviderVerificationResponse>.NotFound("Service provider profile not found.");

        var profile = EnsureProfile(user);
        if (profile.VerificationStatus != ServiceProviderVerificationStatus.UnderReview)
            return ServiceProviderResult<ServiceProviderVerificationResponse>.Conflict(
                "Verification is not awaiting review.");

        profile.VerificationStatus = ServiceProviderVerificationStatus.Verified;
        profile.VerifiedAt = DateTime.UtcNow;
        profile.RejectionReason = null;
        // TrustScore is DERIVED, never hand-set: recompute from the (currently empty)
        // breakdown so a freshly-verified provider correctly reads as "not enough data"
        // until a real signal (e.g. a skills test) lands. Module 1: Profile & Trust.
        RecalculateTrustScore(profile);
        Touch(profile);

        await _userManager.UpdateAsync(user);

        _audit.Record("ServiceProviderVerification.Approve", adminUserId, success: true, new
        {
            providerUserId,
            trustScore = profile.TrustScore,
            hasEnoughTrustData = profile.HasEnoughTrustData,
        });

        await NotifyAsync(user.Id,
            "Provider verification approved",
            "Your service provider profile has been verified. Your Verified Provider Badge is now active.");

        return ServiceProviderResult<ServiceProviderVerificationResponse>.Ok(
            profile.ToVerificationResponse(), "Provider verified.");
    }

    public async Task<ServiceProviderResult<ServiceProviderVerificationResponse>> RejectVerificationAsync(
        string providerUserId, string adminUserId, string reason)
    {
        var user = await _userManager.FindByIdAsync(providerUserId);
        if (user is null)
            return ServiceProviderResult<ServiceProviderVerificationResponse>.NotFound("Service provider profile not found.");

        var profile = EnsureProfile(user);
        if (profile.VerificationStatus is not (ServiceProviderVerificationStatus.UnderReview
            or ServiceProviderVerificationStatus.Verified))
            return ServiceProviderResult<ServiceProviderVerificationResponse>.Conflict(
                "Provider verification is not eligible for rejection.");

        profile.VerificationStatus = ServiceProviderVerificationStatus.Rejected;
        profile.RejectionReason = reason;
        profile.VerifiedAt = null;
        Touch(profile);

        await _userManager.UpdateAsync(user);

        _audit.Record("ServiceProviderVerification.Reject", adminUserId, success: true, new
        {
            providerUserId,
            reason,
        });

        await NotifyAsync(user.Id,
            "Provider verification needs changes",
            $"Your service provider verification was not approved. Reason: {reason}");

        return ServiceProviderResult<ServiceProviderVerificationResponse>.Ok(
            profile.ToVerificationResponse(), "Provider verification rejected.");
    }

    // ---------------- Module 1: Trust & Skills Test ----------------

    public async Task<ServiceProviderResult<TrustBreakdownResponse>> GetTrustAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return ServiceProviderResult<TrustBreakdownResponse>.NotFound("Service provider profile not found.");

        var profile = EnsureProfile(user);
        // Recompute in-memory so the projection always reflects current signals (also
        // normalizes any legacy hand-set score). Not persisted here — persistence happens
        // at the mutation points that actually change a signal (approval, skills-test submit).
        RecalculateTrustScore(profile);
        var response = profile.ToTrustBreakdownResponse();
        response.TierLevel = user.Tier_level; // ranking-only badge (see SpMatchingService)
        return ServiceProviderResult<TrustBreakdownResponse>.Ok(response);
    }

    public async Task<ServiceProviderResult<SkillsTestStatusResponse>> GetSkillsTestStatusAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return ServiceProviderResult<SkillsTestStatusResponse>.NotFound("Service provider profile not found.");

        var profile = EnsureProfile(user);
        var isVerified = profile.VerificationStatus == ServiceProviderVerificationStatus.Verified;

        var categories = profile.ServiceCategories.Select(cat =>
        {
            var latest = profile.SkillsTestAttempts
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

        var profile = EnsureProfile(user);

        if (profile.VerificationStatus != ServiceProviderVerificationStatus.Verified)
            return ServiceProviderResult<SkillsTestQuestionsResponse>.Conflict(
                "The skills test is available once your provider profile is verified.");

        if (!Enum.TryParse<ServiceCategory>(category, ignoreCase: true, out var cat))
            return ServiceProviderResult<SkillsTestQuestionsResponse>.NotFound("Unknown service category.");

        if (!profile.ServiceCategories.Contains(cat))
            return ServiceProviderResult<SkillsTestQuestionsResponse>.Conflict(
                "You can only take the skills test for one of your own service categories.");

        // Cooldown gate.
        var latest = profile.SkillsTestAttempts
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

        var profile = EnsureProfile(user);

        if (profile.VerificationStatus != ServiceProviderVerificationStatus.Verified)
            return ServiceProviderResult<SkillsTestResultResponse>.Conflict(
                "The skills test is available once your provider profile is verified.");

        if (!Enum.TryParse<ServiceCategory>(request.Category, ignoreCase: true, out var cat))
            return ServiceProviderResult<SkillsTestResultResponse>.NotFound("Unknown service category.");

        if (!profile.ServiceCategories.Contains(cat))
            return ServiceProviderResult<SkillsTestResultResponse>.Conflict(
                "You can only take the skills test for one of your own service categories.");

        // Cooldown gate (authoritative — re-checked at submit, not just at fetch).
        var latest = profile.SkillsTestAttempts
            .Where(a => a.Category == cat)
            .OrderByDescending(a => a.TakenAt)
            .FirstOrDefault();
        if (latest is not null && DateTime.UtcNow < latest.NextEligibleRetestAt)
            return ServiceProviderResult<SkillsTestResultResponse>.Conflict(
                $"You can retake this category's skills test after {latest.NextEligibleRetestAt:yyyy-MM-dd}.");

        var answers = request.Answers ?? new List<SkillsTestAnswer>();
        var expected = Math.Min(SkillsTestQuestionBank.QuestionsPerAttempt,
            SkillsTestQuestionBank.ForCategory(cat).Count);

        // Grade only valid, distinct questions belonging to this category (first answer wins
        // per question id; unknown ids are dropped). Correct answers never leave the server.
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

        profile.SkillsTestAttempts.Add(new SkillsTestAttempt
        {
            Category = cat,
            Score = scorePct,
            Passed = passed,
            TakenAt = now,
            NextEligibleRetestAt = nextEligible,
        });

        // Feed the skill-test signal → recompute the derived trust score, then persist.
        RecalculateTrustScore(profile);
        Touch(profile);
        await _userManager.UpdateAsync(user);

        _audit.Record("ServiceProviderSkillsTest.Submit", userId, success: true, new
        {
            category = cat.ToString(),
            score = scorePct,
            passed,
        });

        var trust = profile.ToTrustBreakdownResponse();
        trust.TierLevel = user.Tier_level; // ranking-only badge (see SpMatchingService)

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
        var profile = EnsureProfile(user);
        profile.TrustBreakdown.ResponseRate.HasData = responseRate.HasValue;
        profile.TrustBreakdown.ResponseRate.Value = Math.Clamp(responseRate ?? 0, 0, 100);
        RecalculateTrustScore(profile);
        Touch(profile);
        await _userManager.UpdateAsync(user);
    }

    public async Task UpdateWorkroomTrustSignalsAsync(string userId, double? clientSatisfaction,
        double? onTimeDeliveryRate, double? repeatClientRate, int adverseDisputeCount)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return;
        var profile = EnsureProfile(user);
        SetSignal(profile.TrustBreakdown.ClientSatisfaction, clientSatisfaction);
        SetSignal(profile.TrustBreakdown.OnTimeDelivery, onTimeDeliveryRate);
        SetSignal(profile.TrustBreakdown.RepeatClientRate, repeatClientRate);
        profile.TrustBreakdown.HasDisputes = adverseDisputeCount > 0;
        profile.TrustBreakdown.DisputePenalty = Math.Min(20, Math.Max(0, adverseDisputeCount) * 5);
        RecalculateTrustScore(profile);
        Touch(profile);
        await _userManager.UpdateAsync(user);
    }

    // ---------------- pure helpers ----------------

    private static ServiceProviderProfile EnsureProfile(ApplicationUser user) =>
        user.ServiceProviderProfile ??= new ServiceProviderProfile();

    private static void SetSignal(TrustSignal signal, double? value)
    {
        signal.HasData = value.HasValue;
        signal.Value = Math.Clamp(value ?? 0, 0, 100);
    }

    private static void Touch(ServiceProviderProfile profile) => profile.UpdatedAt = DateTime.UtcNow;

    // ---------------- Module 1: Trust scoring (derived) ----------------

    // Locked weights (sum to 100 across the 5 base components). Dispute penalty is NOT
    // part of this base — it only subtracts from the final score when disputes exist.
    private const double WeightClientSatisfaction = 0.40;
    private const double WeightOnTimeDelivery = 0.25;
    private const double WeightResponseRate = 0.15;
    private const double WeightRepeatClientRate = 0.10;
    private const double WeightSkillTest = 0.10;

    /// <summary>
    /// Recompute the derived TrustScore from the breakdown (the SOLE writer of TrustScore).
    /// Renormalizes the weighted average across ONLY the components that have data, so a
    /// provider with just a skills test scores on the full 0–100 range rather than being
    /// capped at the skill-test weight. Dispute penalty is subtracted afterward (never
    /// renormalized) and only when disputes exist. With no data, HasEnoughTrustData is false
    /// and the score is 0 (the UI shows a neutral "building your trust score" state).
    /// </summary>
    private static void RecalculateTrustScore(ServiceProviderProfile profile)
    {
        // Skill-test signal is derived from the recorded attempts before weighting.
        RecomputeSkillTestSignal(profile);

        var b = profile.TrustBreakdown;
        var components = new (TrustSignal Signal, double Weight)[]
        {
            (b.ClientSatisfaction, WeightClientSatisfaction),
            (b.OnTimeDelivery, WeightOnTimeDelivery),
            (b.ResponseRate, WeightResponseRate),
            (b.RepeatClientRate, WeightRepeatClientRate),
            (b.SkillTest, WeightSkillTest),
        };

        double weightedSum = 0, dataWeight = 0;
        foreach (var (signal, weight) in components)
        {
            if (!signal.HasData) continue;
            weightedSum += weight * signal.Value;
            dataWeight += weight;
        }

        b.LastRecalculatedAt = DateTime.UtcNow;

        if (dataWeight <= 0)
        {
            // No signal has data yet — neutral state, no derived score.
            profile.HasEnoughTrustData = false;
            profile.TrustScore = 0;
            return;
        }

        var score = weightedSum / dataWeight; // renormalized across data-bearing components
        if (b.HasDisputes) score -= b.DisputePenalty;

        profile.TrustScore = Math.Clamp(Math.Round(score, 1), 0, 100);
        profile.HasEnoughTrustData = true;
    }

    /// <summary>
    /// Derive the SkillTest trust signal (0–100) from recorded attempts: the mean of the
    /// most-recent attempt score per distinct category. HasData is false until the first
    /// attempt. Feeds <see cref="RecalculateTrustScore"/>.
    /// </summary>
    private static void RecomputeSkillTestSignal(ServiceProviderProfile profile)
    {
        var signal = profile.TrustBreakdown.SkillTest;
        var attempts = profile.SkillsTestAttempts;
        if (attempts.Count == 0)
        {
            signal.HasData = false;
            signal.Value = 0;
            return;
        }

        var latestPerCategory = attempts
            .GroupBy(a => a.Category)
            .Select(g => g.OrderByDescending(a => a.TakenAt).First().Score)
            .ToList();

        signal.HasData = true;
        signal.Value = latestPerCategory.Average();
    }

    /// <summary>Best-effort in-app + realtime/web-push notification; never fails the operation.</summary>
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

    /// <summary>
    /// Stage-2 completeness gate (D-2 Phase 4): the profile is complete only when
    /// every field below is present. Headline/Bio count when non-blank. Drives the
    /// one-way CurrentPhase 1→2 advancement; it never downgrades the phase.
    /// </summary>
    internal static bool IsProfileComplete(ServiceProviderProfile p) =>
        !string.IsNullOrWhiteSpace(p.Headline) &&
        !string.IsNullOrWhiteSpace(p.Bio) &&
        HasAtLeastOneSkill(p) &&
        p.ServiceCategories.Count > 0 &&
        p.Industries.Count > 0 &&
        p.Languages.Count > 0 &&
        p.PricingModels.Count > 0 &&
        p.PortfolioItems.Count > 0;

    /// <summary>Advance to Phase 2 once the Stage-2 profile is complete. One-way only.</summary>
    private static void MaybeAdvancePhase(ServiceProviderProfile p)
    {
        if (p.CurrentPhase < 2 && IsProfileComplete(p))
            p.CurrentPhase = 2;
    }

    /// <summary>Trim, drop blanks, and de-duplicate case-insensitively (first wins).</summary>
    internal static List<string> NormalizeStrings(IEnumerable<string>? values)
    {
        var result = new List<string>();
        if (values is null) return result;

        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var raw in values)
        {
            var trimmed = raw?.Trim();
            if (string.IsNullOrEmpty(trimmed)) continue;
            if (seen.Add(trimmed)) result.Add(trimmed);
        }
        return result;
    }

    /// <summary>
    /// Parse pricing-model names to the locked enum (case-insensitive). Unknown
    /// values are ignored, duplicates collapsed, first-occurrence order preserved.
    /// </summary>
    internal static List<PricingModel> NormalizePricingModels(IEnumerable<string>? models)
    {
        var result = new List<PricingModel>();
        if (models is null) return result;

        var seen = new HashSet<PricingModel>();
        foreach (var raw in models)
        {
            var trimmed = raw?.Trim();
            if (string.IsNullOrEmpty(trimmed)) continue;
            if (Enum.TryParse<PricingModel>(trimmed, ignoreCase: true, out var model) && seen.Add(model))
                result.Add(model);
        }
        return result;
    }

    /// <summary>Parse to the authoritative enum (case-insensitive), de-duplicate, preserve order.</summary>
    internal static List<ServiceCategory> NormalizeCategories(IEnumerable<string>? categories)
    {
        var result = new List<ServiceCategory>();
        if (categories is null) return result;

        var seen = new HashSet<ServiceCategory>();
        foreach (var raw in categories)
        {
            var trimmed = raw?.Trim();
            if (string.IsNullOrEmpty(trimmed)) continue;
            if (Enum.TryParse<ServiceCategory>(trimmed, ignoreCase: true, out var cat) && seen.Add(cat))
                result.Add(cat);
        }
        return result;
    }
}
