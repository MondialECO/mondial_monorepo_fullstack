using Microsoft.AspNetCore.Identity;
using MongoDB.Driver;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Audit;
using WebApp.Services.Interface;
using WebApp.Services.Migrations;
using WebApp.Validation;

namespace WebApp.Services.Implementations;

/// <summary>
/// Four-step profile editor on the split collections. Owner-scoped throughout.
///
/// Draft saves write ONLY ProfessionalProfiles.EditorDraft (targeted $set), so
/// nothing a visitor sees changes before submit. The final submit spans the three
/// split collections inside one MongoDB transaction (gated fallback: ordered
/// writes with the version increment last). This service cannot assign
/// VerificationStatus, TrustScore, ProviderTier or ratings; the only status it
/// may produce on a credential is Draft or PendingReview, and only for the
/// authenticated owner.
/// </summary>
public sealed class ProfileEditorService(
    UserManager<ApplicationUser> userManager,
    IProfessionalProfileStore professionalStore,
    IServiceProviderProfileStore spStore,
    IUserCredentialStore credentialStore,
    IServiceProviderProfileSplitMigration migrator,
    IMongoClient mongoClient,
    IConfiguration configuration,
    SaveFile saveFile,
    IFileSecurityScanner scanner,
    IAuditLogger audit,
    ILogger<ProfileEditorService> logger) : IProfileEditorService
{
    private const string CredentialFolder = "service-provider/credentials";
    private const long CredentialMaximumBytes = 10 * 1024 * 1024;

    private bool TransactionsEnabled => configuration.GetValue("Mongo:TransactionsEnabled", true);

    private async Task<bool> IsServiceProviderAsync(ApplicationUser user)
    {
        if (await userManager.IsInRoleAsync(user, "ServiceProvider"))
            return true;
        if (!string.IsNullOrEmpty(user.ServiceProviderProfile?.ProviderId))
            return true;
        return false;
    }

    public async Task<ServiceProviderResult<ProfileDraftResponse>> GetDraftAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return NotFoundDraft();

        var isSp = await IsServiceProviderAsync(user);
        var professional = await professionalStore.GetByUserIdAsync(userId, cancellationToken)
            ?? SpProfileSplitMapper.ToProfessionalRecord(user);
        
        ServiceProviderProfileRecord sp;
        if (isSp)
        {
            sp = await spStore.GetByUserIdAsync(userId, cancellationToken)
                ?? SpProfileSplitMapper.ToServiceProviderRecord(user);
        }
        else
        {
            sp = new ServiceProviderProfileRecord { UserId = userId };
        }

        if (professional.EditorDraft is null)
        {
            var seeded = SeedDraftFrom(professional, sp);
            var response = seeded.ToDraftResponse(professional.ProfileVersion);
            response.HasDraft = false;
            response.IsStale = false;
            return ServiceProviderResult<ProfileDraftResponse>.Ok(response);
        }

        return ServiceProviderResult<ProfileDraftResponse>.Ok(
            professional.EditorDraft.ToDraftResponse(professional.ProfileVersion));
    }

    public async Task<ServiceProviderResult<ProfileDraftResponse>> SaveDraftAsync(
        string userId,
        ProfileDraftRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return NotFoundDraft();

        var isSp = await IsServiceProviderAsync(user);
        ProfessionalProfileRecord professional;
        if (isSp)
        {
            var (prof, _) = await migrator.EnsureMigratedAsync(user, cancellationToken);
            professional = prof;
        }
        else
        {
            professional = await migrator.EnsureProfessionalProfileAsync(user, cancellationToken);
        }

        var draft = BuildDraft(request, professional.EditorDraft);
        if (draft.Error is not null)
            return ServiceProviderResult<ProfileDraftResponse>.Invalid(draft.Error);

        // Targeted $set of EditorDraft only — published fields are untouched.
        var saved = await professionalStore.SetEditorDraftAsync(userId, draft.Value, cancellationToken);
        if (!saved)
            return ServiceProviderResult<ProfileDraftResponse>.Conflict("Your changes could not be saved. Try again.");

        return ServiceProviderResult<ProfileDraftResponse>.Ok(
            draft.Value!.ToDraftResponse(professional.ProfileVersion),
            "Draft saved.");
    }

    public async Task<ServiceProviderResult<ProfileDraftResponse>> DiscardDraftAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return NotFoundDraft();

        var isSp = await IsServiceProviderAsync(user);
        var professional = await professionalStore.GetByUserIdAsync(userId, cancellationToken);
        ServiceProviderProfileRecord sp;
        if (isSp)
        {
            sp = await spStore.GetByUserIdAsync(userId, cancellationToken)
                ?? SpProfileSplitMapper.ToServiceProviderRecord(user);
        }
        else
        {
            sp = new ServiceProviderProfileRecord { UserId = userId };
        }

        if (professional?.EditorDraft is null)
        {
            var view = professional ?? SpProfileSplitMapper.ToProfessionalRecord(user);
            var empty = SeedDraftFrom(view, sp).ToDraftResponse(view.ProfileVersion);
            empty.HasDraft = false;
            return ServiceProviderResult<ProfileDraftResponse>.Ok(empty, "No draft to discard.");
        }

        var cleared = await professionalStore.SetEditorDraftAsync(userId, null, cancellationToken);
        if (!cleared)
            return ServiceProviderResult<ProfileDraftResponse>.Conflict("The draft could not be discarded.");

        audit.Record("ProfileEditor.DiscardDraft", userId, true, new { });
        var seeded = SeedDraftFrom(professional, sp).ToDraftResponse(professional.ProfileVersion);
        seeded.HasDraft = false;
        return ServiceProviderResult<ProfileDraftResponse>.Ok(seeded, "Draft discarded.");
    }

    public async Task<ServiceProviderResult<ProfileEditorSubmitResponse>> SubmitAsync(
        string userId,
        SubmitProfileEditorRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null)
            return ServiceProviderResult<ProfileEditorSubmitResponse>.NotFound("User profile not found.");

        var isSp = await IsServiceProviderAsync(user);
        ProfessionalProfileRecord professional;
        ServiceProviderProfileRecord? sp = null;

        if (isSp)
        {
            var (prof, spRec) = await migrator.EnsureMigratedAsync(user, cancellationToken);
            professional = prof;
            sp = spRec;
        }
        else
        {
            professional = await migrator.EnsureProfessionalProfileAsync(user, cancellationToken);
        }

        // Fast-path concurrency check; the authoritative check is the
        // version-conditional replace inside the write itself.
        if (request.BasedOnVersion != professional.ProfileVersion)
            return StaleConflict();

        var built = BuildDraft(request.Draft, professional.EditorDraft);
        if (built.Error is not null)
            return ServiceProviderResult<ProfileEditorSubmitResponse>.Invalid(built.Error);
        var draft = built.Value!;

        if (isSp && (draft.ServiceCategories == null || draft.ServiceCategories.Count == 0))
            return ServiceProviderResult<ProfileEditorSubmitResponse>.Invalid("Select your primary expertise category.");

        var now = DateTime.UtcNow;

        // Build the post-publish records without mutating the loaded ones, so a
        // failed write leaves nothing half-applied in memory or storage.
        var newProfessional = BuildPublishedProfessional(professional, draft, now);
        var newSp = isSp && sp is not null ? BuildPublishedSp(sp, draft, now) : null;

        // Credentials eligible for review: Draft or ResubmissionRequired WITH a
        // document. Verified credentials are never touched by a profile submit.
        var ownedCredentials = isSp ? await credentialStore.GetByUserIdAsync(userId, cancellationToken) : new List<UserCredentialRecord>();
        var promoted = ownedCredentials
            .Where(c => c.Status is CredentialStatus.Draft or CredentialStatus.ResubmissionRequired
                        && c.Document is not null)
            .Select(c => PromoteForReview(c, now))
            .ToList();

        bool published;
        if (TransactionsEnabled)
        {
            using var session = await mongoClient.StartSessionAsync(cancellationToken: cancellationToken);
            session.StartTransaction();
            try
            {
                if (isSp)
                {
                    foreach (var credential in promoted)
                        if (!await credentialStore.UpsertAsync(credential, session, cancellationToken))
                            throw new MongoException("Credential write was not acknowledged.");

                    if (newSp is not null && !await spStore.UpsertAsync(newSp, session, cancellationToken))
                        throw new MongoException("Service provider profile write was not acknowledged.");
                }

                published = await professionalStore.ReplacePublishedIfVersionAsync(
                    newProfessional, request.BasedOnVersion, session, cancellationToken);

                if (!published)
                {
                    // Stale version: abort so no collection keeps any change.
                    await session.AbortTransactionAsync(cancellationToken);
                    return StaleConflict();
                }

                await session.CommitTransactionAsync(cancellationToken);
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                try { await session.AbortTransactionAsync(CancellationToken.None); } catch { /* already aborted */ }
                logger.LogWarning(exception, "Profile editor submit transaction aborted.");
                return ServiceProviderResult<ProfileEditorSubmitResponse>.Conflict(
                    "Your profile could not be saved. Your draft has been kept — try again.");
            }
        }
        else
        {
            // Gated fallback (standalone MongoDB): ordered writes, version
            // increment LAST as the commit point. A retry converges — credential
            // promotions and the SP upsert are idempotent, and nothing reads the
            // new state until the version-conditional publish lands.
            if (isSp)
            {
                foreach (var credential in promoted)
                    if (!await credentialStore.UpsertAsync(credential, cancellationToken: cancellationToken))
                        return ServiceProviderResult<ProfileEditorSubmitResponse>.Conflict(
                            "Your profile could not be saved. Your draft has been kept — try again.");

                if (newSp is not null && !await spStore.UpsertAsync(newSp, cancellationToken: cancellationToken))
                    return ServiceProviderResult<ProfileEditorSubmitResponse>.Conflict(
                        "Your profile could not be saved. Your draft has been kept — try again.");
            }

            published = await professionalStore.ReplacePublishedIfVersionAsync(
                newProfessional, request.BasedOnVersion, cancellationToken: cancellationToken);
            if (!published) return StaleConflict();
        }

        audit.Record("ProfileEditor.Submit", userId, true, new
        {
            version = newProfessional.ProfileVersion,
            credentialsPendingReview = promoted.Count,
        });

        var userRoles = await userManager.GetRolesAsync(user);

        if (isSp && newSp is not null)
        {
            var view = SpProfileSplitMapper.ToCompositeView(
                newProfessional, newSp, await credentialStore.GetByUserIdAsync(userId, cancellationToken));

            return ServiceProviderResult<ProfileEditorSubmitResponse>.Ok(new ProfileEditorSubmitResponse
            {
                Outcome = DetermineOutcome(newSp, promoted.Count),
                Profile = view.ToResponse(),
                CredentialsPendingReview = promoted.Count,
            }, "Profile submitted.");
        }
        else
        {
            var nonSp = new ServiceProviderProfileRecord { UserId = userId };
            var view = SpProfileSplitMapper.ToCompositeView(
                newProfessional, nonSp, new List<UserCredentialRecord>());

            return ServiceProviderResult<ProfileEditorSubmitResponse>.Ok(new ProfileEditorSubmitResponse
            {
                Outcome = "Published",
                Profile = view.ToResponse(),
                CredentialsPendingReview = 0,
            }, "Profile submitted.");
        }
    }

    // ---------------- Publish builders ----------------

    private static ProfessionalProfileRecord BuildPublishedProfessional(
        ProfessionalProfileRecord current,
        ProfessionalProfileDraft draft,
        DateTime now) => new()
    {
        Id = current.Id,
        UserId = current.UserId,
        Headline = draft.Headline ?? "",
        Bio = draft.Bio ?? "",
        ProfessionalOverview = draft.ProfessionalOverview,
        ProfileImage = current.ProfileImage,
        CoverImage = current.CoverImage,
        Experiences = draft.Experiences,
        Education = draft.Education,
        Skills = new List<string>(draft.Skills),
        LanguageProficiencies = draft.LanguageProficiencies,
        // Legacy mirror stays in step for existing readers until Phase 6.
        Languages = draft.LanguageProficiencies.Select(l => l.Language).ToList(),
        Industries = new List<string>(draft.Industries),
        SocialLinks = (draft.SocialLinks ?? new()).Count > 0 ? draft.SocialLinks : current.SocialLinks,
        AvailabilityDisplay = current.AvailabilityDisplay,
        ProfileVersion = current.ProfileVersion + 1,
        EditorDraft = null,
        CreatedAt = current.CreatedAt,
        UpdatedAt = now,
    };

    private static ServiceProviderProfileRecord BuildPublishedSp(
        ServiceProviderProfileRecord current,
        ProfessionalProfileDraft draft,
        DateTime now)
    {
        var next = SpProfileSplitMapper.ToServiceProviderRecord(new ApplicationUser());
        next.Id = current.Id;
        next.UserId = current.UserId;
        next.ProviderId = current.ProviderId;
        next.CurrentPhase = current.CurrentPhase;
        next.VerificationStatus = current.VerificationStatus;
        next.VerificationSubmittedAt = current.VerificationSubmittedAt;
        next.VerifiedAt = current.VerifiedAt;
        next.RejectionReason = current.RejectionReason;
        next.ProviderTier = current.ProviderTier; // server-controlled; submit never changes it
        next.ServiceCategories = new List<ServiceCategory>(draft.ServiceCategories);
        next.PricingModels = new List<PricingModel>(draft.PricingModels);
        next.PortfolioItems = current.PortfolioItems;
        next.TrustScore = current.TrustScore;
        next.TrustBreakdown = current.TrustBreakdown;
        next.HasEnoughTrustData = current.HasEnoughTrustData;
        next.SkillsTestAttempts = current.SkillsTestAttempts;
        next.MaximumConcurrentOrders = current.MaximumConcurrentOrders;
        next.CurrentActiveOrders = current.CurrentActiveOrders;
        next.NewOrderAvailability = current.NewOrderAvailability;
        next.ManualApprovalWhenCapacityLow = current.ManualApprovalWhenCapacityLow;
        next.FinancialSettings = current.FinancialSettings;
        next.CreatedAt = current.CreatedAt;
        next.UpdatedAt = now;
        return next;
    }

    private static UserCredentialRecord PromoteForReview(UserCredentialRecord credential, DateTime now)
    {
        credential.Status = CredentialStatus.PendingReview;
        credential.SubmittedAt = now;
        credential.ReviewNote = null;
        credential.UpdatedAt = now;
        return credential;
    }

    /// <summary>
    /// The result screen never claims more than the server state supports: pending
    /// credentials report as pending; only an already-Verified provider with
    /// nothing awaiting review sees a completed verification.
    /// </summary>
    private static string DetermineOutcome(ServiceProviderProfileRecord sp, int pending)
    {
        if (pending > 0) return "ProfileSubmittedPendingReview";
        return sp.VerificationStatus == ServiceProviderVerificationStatus.Verified
            ? "VerificationComplete"
            : "ProfileUpdated";
    }

    private static ServiceProviderResult<ProfileEditorSubmitResponse> StaleConflict() =>
        ServiceProviderResult<ProfileEditorSubmitResponse>.Conflict(
            "Your profile was updated somewhere else. Reload to see the latest version before submitting.");

    // ---------------- Credentials (UserCredentials root collection) ----------------

    public async Task<ServiceProviderResult<ProviderCredentialResponse>> UpsertCredentialAsync(
        string userId,
        ProviderCredentialRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return NotFoundCredential();

        if (!Enum.TryParse<CredentialKind>(request.Kind, ignoreCase: true, out var kind))
            return ServiceProviderResult<ProviderCredentialResponse>.Invalid("Select a valid credential type.");

        await migrator.EnsureMigratedAsync(user, cancellationToken);

        UserCredentialRecord credential;
        var isNew = string.IsNullOrWhiteSpace(request.Id);
        if (isNew)
        {
            if (await credentialStore.CountByUserIdAsync(userId, cancellationToken) >= ServiceProviderLimits.MaxCredentials)
                return ServiceProviderResult<ProviderCredentialResponse>.Invalid(
                    $"You can add at most {ServiceProviderLimits.MaxCredentials} credentials.");

            credential = new UserCredentialRecord { UserId = userId, Status = CredentialStatus.Draft };
        }
        else
        {
            // Ownership enforced by the owner-scoped lookup; a foreign id is a 404.
            var found = await credentialStore.GetOwnedAsync(userId, request.Id!.Trim(), cancellationToken);
            if (found is null) return NotFoundCredential();
            credential = found;
        }

        credential.Kind = kind;
        credential.Title = (request.Title ?? "").Trim();
        credential.IssuingOrganization = NullIfBlank(request.IssuingOrganization);
        credential.IssuedAt = request.IssuedAt;
        credential.ExpiresAt = request.ExpiresAt;
        credential.CredentialNumber = NullIfBlank(request.CredentialNumber);
        credential.UpdatedAt = DateTime.UtcNow;

        // Editing a rejected credential returns it to Draft for resubmission; a
        // Verified credential keeps its status — metadata edits never re-grant or
        // silently revoke verification.
        if (credential.Status == CredentialStatus.Rejected)
            credential.Status = CredentialStatus.Draft;

        if (!await credentialStore.UpsertAsync(credential, cancellationToken: cancellationToken))
            return ServiceProviderResult<ProviderCredentialResponse>.Conflict("The credential could not be saved.");

        audit.Record("ProfileEditor.Credential.Upsert", userId, true, new { credentialId = credential.Id, isNew });
        return ServiceProviderResult<ProviderCredentialResponse>.Ok(
            SpProfileSplitMapper.ToEmbeddedCredential(credential).ToResponse(), "Credential saved.");
    }

    public async Task<ServiceProviderResult<ProviderCredentialResponse>> UploadCredentialDocumentAsync(
        string userId,
        string credentialId,
        IFormFile file,
        CancellationToken cancellationToken = default)
    {
        var credential = await credentialStore.GetOwnedAsync(userId, credentialId, cancellationToken);
        if (credential is null) return NotFoundCredential();

        if (file is null || file.Length == 0)
            return ServiceProviderResult<ProviderCredentialResponse>.Invalid("Choose a file to upload.");
        if (file.Length > CredentialMaximumBytes)
            return ServiceProviderResult<ProviderCredentialResponse>.Invalid(
                $"The document must be {CredentialMaximumBytes / (1024 * 1024)} MB or smaller.");

        var scan = await scanner.ScanAsync(file, cancellationToken);
        if (!scan.Passed)
            return ServiceProviderResult<ProviderCredentialResponse>.Invalid(
                scan.Error ?? "The document failed basic file validation.");

        // 1. Save the new file first (SaveFile owns the stored name and policy).
        string publicUrl;
        try { publicUrl = await saveFile.SaveFileAsync(file, CredentialFolder); }
        catch (ArgumentException exception)
        { return ServiceProviderResult<ProviderCredentialResponse>.Invalid(exception.Message); }

        var previousDocument = credential.Document;
        var previousFileName = credential.DocumentFileName;
        var previousStatus = credential.Status;

        // 2. Point the credential at the new file.
        credential.Document = new ProviderMediaAsset
        {
            StorageKey = publicUrl,
            PublicUrl = publicUrl,
            ContentType = file.ContentType ?? "application/octet-stream",
            Bytes = file.Length,
            UploadedAt = DateTime.UtcNow,
        };
        credential.DocumentFileName = SafeDisplayFileName(file.FileName);
        // A replaced document must be reviewed again; an upload can never reach
        // Verified on its own.
        if (credential.Status is CredentialStatus.Verified or CredentialStatus.Rejected)
            credential.Status = CredentialStatus.Draft;
        credential.ReviewNote = null;
        credential.UpdatedAt = DateTime.UtcNow;

        // 3. Persist; only then is the old file safe to delete.
        if (!await credentialStore.UpsertAsync(credential, cancellationToken: cancellationToken))
        {
            credential.Document = previousDocument;
            credential.DocumentFileName = previousFileName;
            credential.Status = previousStatus;
            await DeleteBestEffort(publicUrl);
            return ServiceProviderResult<ProviderCredentialResponse>.Conflict(
                "The document could not be saved. Your previous document is unchanged.");
        }

        // 4. Remove the superseded file.
        if (previousDocument is not null) await DeleteBestEffort(previousDocument.PublicUrl);

        audit.Record("ProfileEditor.Credential.Upload", userId, true, new { credentialId });
        return ServiceProviderResult<ProviderCredentialResponse>.Ok(
            SpProfileSplitMapper.ToEmbeddedCredential(credential).ToResponse(), "Document uploaded.");
    }

    public async Task<ServiceProviderResult<bool>> DeleteCredentialAsync(
        string userId,
        string credentialId,
        CancellationToken cancellationToken = default)
    {
        var credential = await credentialStore.GetOwnedAsync(userId, credentialId, cancellationToken);
        if (credential is null) return ServiceProviderResult<bool>.NotFound("Credential not found.");

        if (!await credentialStore.DeleteOwnedAsync(userId, credentialId, cancellationToken))
            return ServiceProviderResult<bool>.Conflict("The credential could not be removed.");

        if (credential.Document is not null) await DeleteBestEffort(credential.Document.PublicUrl);

        audit.Record("ProfileEditor.Credential.Delete", userId, true, new { credentialId });
        return ServiceProviderResult<bool>.Ok(true, "Credential removed.");
    }

    // ---------------- Draft construction ----------------

    /// <summary>
    /// Normalizes a draft request into a storable draft, preserving stable ids the
    /// client echoed back and minting ids for new records. Categories and pricing
    /// ride inside the draft as submission-coordination fields — they publish to
    /// ServiceProviderProfiles only at final submit, never on a step save.
    /// </summary>
    private static (ProfessionalProfileDraft? Value, string? Error) BuildDraft(
        ProfileDraftRequest request,
        ProfessionalProfileDraft? existing)
    {
        var draft = new ProfessionalProfileDraft
        {
            BasedOnVersion = request.BasedOnVersion,
            LastStep = Math.Clamp(request.LastStep, 1, 4),
            Headline = NullIfBlank(request.Headline),
            Bio = NullIfBlank(request.Bio),
            Skills = ServiceProviderService.NormalizeStrings(request.Skills),
            ServiceCategories = ServiceProviderService.NormalizeCategories(request.ServiceCategories),
            Industries = ServiceProviderService.NormalizeStrings(request.Industries),
            PricingModels = ServiceProviderService.NormalizePricingModels(request.PricingModels),
            SocialLinks = (request.SocialLinks ?? new()).Where(s => !string.IsNullOrWhiteSpace(s.Url)).Select(s => new ProfessionalSocialLink
            {
                Id = StableId(s.Id),
                Platform = (s.Platform ?? "").Trim(),
                Url = (s.Url ?? "").Trim()
            }).ToList(),
            CreatedAt = existing?.CreatedAt ?? DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        if (request.ProfessionalOverview is not null)
        {
            if (!ProfessionalOverviewSanitizer.TrySanitize(
                    request.ProfessionalOverview.Document, out var sanitized, out var overviewError))
                return (null, overviewError);

            draft.ProfessionalOverview = new ProfessionalOverviewContent
            {
                SchemaVersion = ProfessionalOverviewSanitizer.SchemaVersion,
                Document = MongoDB.Bson.BsonDocument.Parse(sanitized!.Value.GetRawText()),
                PlainText = ServiceProviderService.ExtractPlainText(sanitized!.Value),
            };
        }
        else
        {
            draft.ProfessionalOverview = existing?.ProfessionalOverview ?? new ProfessionalOverviewContent();
        }

        foreach (var item in request.Experiences)
        {
            if (!ServiceProviderLimits.TryParseMonth(item.StartDate, out var start))
                return (null, "Start date must be a valid month in YYYY-MM format.");

            DateTime? end = null;
            if (!item.IsCurrent)
            {
                if (!ServiceProviderLimits.TryParseMonth(item.EndDate, out var parsedEnd))
                    return (null, "End date must be a valid month in YYYY-MM format.");
                if (parsedEnd < start)
                    return (null, "End date cannot be before the start date.");
                end = parsedEnd;
            }

            draft.Experiences.Add(new ProfessionalExperience
            {
                Id = StableId(item.Id),
                JobTitle = (item.JobTitle ?? "").Trim(),
                CompanyName = (item.CompanyName ?? "").Trim(),
                StartDate = start,
                EndDate = end,
                IsCurrent = item.IsCurrent,
                Description = NullIfBlank(item.Description),
                UpdatedAt = DateTime.UtcNow,
            });
        }

        foreach (var item in request.Education)
        {
            if (item.EndYear.HasValue && item.EndYear.Value < item.StartYear)
                return (null, "End year cannot be before the start year.");

            draft.Education.Add(new ProfessionalEducation
            {
                Id = StableId(item.Id),
                Institution = (item.Institution ?? "").Trim(),
                Degree = (item.Degree ?? "").Trim(),
                FieldOfStudy = NullIfBlank(item.FieldOfStudy),
                StartYear = item.StartYear,
                EndYear = item.EndYear,
                Description = NullIfBlank(item.Description),
                UpdatedAt = DateTime.UtcNow,
            });
        }

        var seenLanguages = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var item in request.LanguageProficiencies)
        {
            var name = (item.Language ?? "").Trim();
            if (name.Length == 0) continue;
            if (!seenLanguages.Add(name))
                return (null, "Duplicate languages are not allowed.");
            if (!Enum.TryParse<LanguageProficiency>(item.Proficiency, ignoreCase: true, out var proficiency))
                return (null, "Select a valid proficiency level.");

            draft.LanguageProficiencies.Add(new ProfessionalLanguage
            {
                Id = StableId(item.Id),
                Language = name,
                Proficiency = proficiency,
            });
        }

        return (draft, null);
    }

    /// <summary>Seeds an unsaved draft from the published records so the editor opens pre-filled.</summary>
    private static ProfessionalProfileDraft SeedDraftFrom(
        ProfessionalProfileRecord professional,
        ServiceProviderProfileRecord sp)
    {
        var draft = new ProfessionalProfileDraft
        {
            BasedOnVersion = professional.ProfileVersion,
            LastStep = 1,
            Headline = NullIfBlank(professional.Headline),
            Bio = NullIfBlank(professional.Bio),
            ProfessionalOverview = professional.ProfessionalOverview,
            Skills = new List<string>(professional.Skills),
            ServiceCategories = new List<ServiceCategory>(sp.ServiceCategories),
            Industries = new List<string>(professional.Industries),
            PricingModels = new List<PricingModel>(sp.PricingModels),
            Experiences = new List<ProfessionalExperience>(professional.Experiences),
            Education = new List<ProfessionalEducation>(professional.Education),
            SocialLinks = new List<ProfessionalSocialLink>(professional.SocialLinks ?? new()),
        };

        // Prefer structured languages; fall back to the legacy name-only mirror.
        draft.LanguageProficiencies = professional.LanguageProficiencies.Count > 0
            ? new List<ProfessionalLanguage>(professional.LanguageProficiencies)
            : professional.Languages
                .Where(l => !string.IsNullOrWhiteSpace(l))
                .Select(l => new ProfessionalLanguage
                {
                    Language = l.Trim(),
                    Proficiency = LanguageProficiency.Conversational,
                })
                .ToList();

        return draft;
    }

    // ---------------- Shared helpers ----------------

    /// <summary>Display-only: strips any path component from an uploaded name. The
    /// stored filename is always generated by SaveFile, never this value.</summary>
    private static string? SafeDisplayFileName(string? fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName)) return null;
        var name = Path.GetFileName(fileName.Trim());
        if (string.IsNullOrWhiteSpace(name)) return null;
        return name.Length > 200 ? name[^200..] : name;
    }

    /// <summary>Deletes an owned upload, refusing any path outside the uploads root.</summary>
    private async Task DeleteBestEffort(string? publicUrl)
    {
        if (string.IsNullOrWhiteSpace(publicUrl)) return;
        try
        {
            var fullPath = Path.GetFullPath(Path.Combine("wwwroot", publicUrl.TrimStart('/')));
            var uploadRoot = Path.GetFullPath(Path.Combine("wwwroot", "uploads"));
            if (!fullPath.StartsWith(uploadRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
                return;
            if (File.Exists(fullPath)) File.Delete(fullPath);
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Could not delete superseded credential document.");
        }
        await Task.CompletedTask;
    }

    private static string StableId(string? candidate) =>
        string.IsNullOrWhiteSpace(candidate) ? Guid.NewGuid().ToString("N") : candidate.Trim();

    private static string? NullIfBlank(string? s) => string.IsNullOrWhiteSpace(s) ? null : s.Trim();

    private static ServiceProviderResult<ProfileDraftResponse> NotFoundDraft() =>
        ServiceProviderResult<ProfileDraftResponse>.NotFound("Service provider profile not found.");

    private static ServiceProviderResult<ProviderCredentialResponse> NotFoundCredential() =>
        ServiceProviderResult<ProviderCredentialResponse>.NotFound("Credential not found.");
}
