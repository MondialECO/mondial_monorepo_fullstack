using Microsoft.AspNetCore.Identity;
using Hangfire;
using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations;

/// <summary>Module 3 — deterministic, actor-scoped client acquisition workflows.</summary>
public class LeadsService : ILeadsService
{
    private static readonly TimeSpan DefaultBriefLifetime = TimeSpan.FromHours(72);
    private static readonly TimeSpan MaximumBriefLifetime = TimeSpan.FromDays(30);
    private readonly MongoDbContext _db;
    private readonly UserManager<ApplicationUser> _users;
    private readonly ISpMatchingService _matching;
    private readonly IResponseRateService _responseRates;
    private readonly INotificationService _notifications;
    private readonly ILogger<LeadsService> _logger;
    private readonly IBackgroundJobClient _jobs;

    public LeadsService(MongoDbContext db, UserManager<ApplicationUser> users, ISpMatchingService matching,
        IResponseRateService responseRates, INotificationService notifications, ILogger<LeadsService> logger,
        IBackgroundJobClient jobs)
    {
        _db = db; _users = users; _matching = matching; _responseRates = responseRates;
        _notifications = notifications; _logger = logger; _jobs = jobs;
    }

    public async Task<ServiceProviderResult<ClientBriefResponse>> CreateBriefAsync(string clientId, CreateClientBriefRequest r)
    {
        if (!TryEnum<ServiceCategory>(r.ServiceCategory, out var category) || !TryEnum<PricingModel>(r.PricingType, out var pricing) ||
            !TryEnum<ClientBriefVisibility>(r.Visibility, out var visibility) || !TryEnum<ClientBriefSource>(r.Source, out var source))
            return ServiceProviderResult<ClientBriefResponse>.Conflict("One or more brief options are invalid.");
        if (string.IsNullOrWhiteSpace(r.Title) || string.IsNullOrWhiteSpace(r.Description))
            return ServiceProviderResult<ClientBriefResponse>.Conflict("A title and description are required.");
        if (r.BudgetMinimum < 0 || r.BudgetMaximum <= 0 || r.BudgetMaximum < r.BudgetMinimum)
            return ServiceProviderResult<ClientBriefResponse>.Conflict("Enter a valid budget range.");

        var b = new ClientBrief
        {
            ClientId = clientId, Title = r.Title.Trim(), Description = r.Description.Trim(), ServiceCategory = category,
            RequiredSkills = Normalize(r.RequiredSkills), Industries = Normalize(r.Industries), BudgetMinimum = r.BudgetMinimum,
            BudgetMaximum = r.BudgetMaximum, Currency = Currency(r.Currency), PricingType = pricing,
            ExpectedDuration = r.ExpectedDuration?.Trim() ?? "", Location = r.Location?.Trim() ?? "", RemoteAllowed = r.RemoteAllowed,
            Visibility = visibility, Source = source, InvitedProviderIds = Normalize(r.InvitedProviderIds),
            ExclusiveInvitation = r.ExclusiveInvitation, ExpiresAt = r.ExpiresAt,
        };
        await _db.ClientBriefs.InsertOneAsync(b);
        return ServiceProviderResult<ClientBriefResponse>.Ok(b.ToResponse(), "Brief draft created.");
    }

    public async Task<ServiceProviderResult<ClientBriefResponse>> PublishBriefAsync(string clientId, string briefId)
    {
        var b = await OwnedBrief(clientId, briefId);
        if (b is null) return ServiceProviderResult<ClientBriefResponse>.NotFound("Brief not found.");
        if (b.Status is not (ClientBriefStatus.Draft or ClientBriefStatus.Published))
            return ServiceProviderResult<ClientBriefResponse>.Conflict("Only a draft brief can be published.");
        var now = DateTime.UtcNow;
        b.PublishedAt = now; b.ExpiresAt = BoundBriefExpiry(b.ExpiresAt, now); b.Status = ClientBriefStatus.Open; b.UpdatedAt = now;
        await _db.ClientBriefs.ReplaceOneAsync(x => x.Id == b.Id && x.ClientId == clientId, b);
        await NotifyInvitedAsync(b);
        return ServiceProviderResult<ClientBriefResponse>.Ok(b.ToResponse(), "Brief published.");
    }

    public async Task<ServiceProviderResult<ClientBriefResponse>> CloseBriefAsync(string clientId, string briefId)
    {
        var b = await OwnedBrief(clientId, briefId);
        if (b is null) return ServiceProviderResult<ClientBriefResponse>.NotFound("Brief not found.");
        if (b.Status != ClientBriefStatus.Open) return ServiceProviderResult<ClientBriefResponse>.Conflict("Only an open brief can be closed.");
        b.Status = ClientBriefStatus.Closed; b.UpdatedAt = DateTime.UtcNow;
        await _db.ClientBriefs.ReplaceOneAsync(x => x.Id == b.Id && x.ClientId == clientId, b);
        return ServiceProviderResult<ClientBriefResponse>.Ok(b.ToResponse(), "Brief closed; existing proposals are read-only.");
    }

    public async Task<ServiceProviderResult<List<ClientBriefResponse>>> GetInboxAsync(string providerId, LeadQueryRequest q)
    {
        var user = await _users.FindByIdAsync(providerId);
        var profile = user?.ServiceProviderProfile;
        if (profile is null || profile.VerificationStatus != ServiceProviderVerificationStatus.Verified)
            return ServiceProviderResult<List<ClientBriefResponse>>.Conflict("A verified provider profile is required.");
        if (!IsAvailable(profile)) return ServiceProviderResult<List<ClientBriefResponse>>.Ok(new());

        var briefs = await _db.ClientBriefs.Find(x => x.Status == ClientBriefStatus.Open).Limit(500).ToListAsync();
        var candidates = briefs.Where(b => profile.ServiceCategories.Contains(b.ServiceCategory))
            .Where(b => b.Visibility == ClientBriefVisibility.Public || b.InvitedProviderIds.Contains(providerId))
            .Where(b => string.IsNullOrWhiteSpace(q.Category) || b.ServiceCategory.ToString().Equals(q.Category, StringComparison.OrdinalIgnoreCase))
            .Where(b => string.IsNullOrWhiteSpace(q.Skill) || b.RequiredSkills.Any(s => s.Contains(q.Skill, StringComparison.OrdinalIgnoreCase)))
            .Where(b => !q.BudgetMinimum.HasValue || b.BudgetMaximum >= q.BudgetMinimum)
            .Where(b => !q.BudgetMaximum.HasValue || b.BudgetMinimum <= q.BudgetMaximum)
            .Where(b => string.IsNullOrWhiteSpace(q.Duration) || b.ExpectedDuration.Contains(q.Duration, StringComparison.OrdinalIgnoreCase))
            .Where(b => string.IsNullOrWhiteSpace(q.Location) || b.Location.Contains(q.Location, StringComparison.OrdinalIgnoreCase))
            .Where(b => !q.RemoteAllowed.HasValue || b.RemoteAllowed == q.RemoteAllowed)
            .Where(b => string.IsNullOrWhiteSpace(q.Source) || b.Source.ToString().Equals(q.Source, StringComparison.OrdinalIgnoreCase))
            .Where(b => !q.PostedAfter.HasValue || b.PublishedAt >= q.PostedAfter)
            .Where(b => !q.DeadlineBefore.HasValue || b.ExpiresAt <= q.DeadlineBefore).ToList();

        // Lazy persistence: CreatedAt still records when the opportunity became available,
        // rather than when this query happened to create the interaction row.
        foreach (var b in candidates) await EnsureInteractionAsync(providerId, b);
        var ids = candidates.Select(x => x.Id).ToList();
        var interactions = await _db.ClientBriefInteractions.Find(x => x.ProviderId == providerId && ids.Contains(x.ClientBriefId)).ToListAsync();
        var proposals = await _db.Proposals.Find(x => x.ProviderId == providerId && x.ClientBriefId != null && ids.Contains(x.ClientBriefId)).ToListAsync();
        var interactionMap = interactions.ToDictionary(x => x.ClientBriefId);

        var result = candidates.Select(b => b.ToResponse(interactionMap.GetValueOrDefault(b.Id),
            proposals.Any(p => p.ClientBriefId == b.Id), MatchScore(user!, b))).Where(x => !x.Dismissed)
            .Where(x => !q.SavedOnly || x.Saved).ToList();
        result = q.Sort.ToLowerInvariant() switch
        {
            "highestbudget" => result.OrderByDescending(x => x.BudgetMaximum).ToList(),
            "closestdeadline" => result.OrderBy(x => x.ExpiresAt).ToList(),
            "bestmatch" => result.OrderByDescending(x => x.MatchScore).ToList(),
            "previouslyviewed" => result.OrderByDescending(x => x.ViewedAt).ToList(),
            _ => result.OrderByDescending(x => x.PublishedAt).ToList(),
        };
        return ServiceProviderResult<List<ClientBriefResponse>>.Ok(result);
    }

    public async Task<ServiceProviderResult<ClientBriefResponse>> GetBriefAsync(string providerId, string briefId)
    {
        var b = await _db.ClientBriefs.Find(x => x.Id == briefId).FirstOrDefaultAsync();
        if (b is null) return ServiceProviderResult<ClientBriefResponse>.NotFound("Brief not found.");
        var user = await _users.FindByIdAsync(providerId);
        if (user?.ServiceProviderProfile is null || !CanSurface(user.ServiceProviderProfile, providerId, b))
            return ServiceProviderResult<ClientBriefResponse>.NotFound("Brief not found.");
        var i = await EnsureInteractionAsync(providerId, b);
        if (!i.Viewed)
        {
            i.Viewed = true; i.ViewedAt = i.UpdatedAt = DateTime.UtcNow;
            await _db.ClientBriefInteractions.ReplaceOneAsync(x => x.Id == i.Id, i);
        }
        var submitted = await _db.Proposals.Find(x => x.ProviderId == providerId && x.ClientBriefId == briefId).AnyAsync();
        return ServiceProviderResult<ClientBriefResponse>.Ok(b.ToResponse(i, submitted, MatchScore(user, b)));
    }

    public async Task<ServiceProviderResult<ClientBriefResponse>> UpdateInteractionAsync(string providerId, string briefId, UpdateBriefInteractionRequest r)
    {
        var b = await _db.ClientBriefs.Find(x => x.Id == briefId).FirstOrDefaultAsync();
        if (b is null) return ServiceProviderResult<ClientBriefResponse>.NotFound("Brief not found.");
        var user = await _users.FindByIdAsync(providerId);
        if (user?.ServiceProviderProfile is null || !CanSurface(user.ServiceProviderProfile, providerId, b))
            return ServiceProviderResult<ClientBriefResponse>.NotFound("Brief not found.");
        var i = await EnsureInteractionAsync(providerId, b);
        if (r.Saved.HasValue) i.Saved = r.Saved.Value;
        if (r.Dismissed.HasValue) i.Dismissed = r.Dismissed.Value;
        if (i.Saved) i.Dismissed = false;
        i.UpdatedAt = DateTime.UtcNow;
        await _db.ClientBriefInteractions.ReplaceOneAsync(x => x.Id == i.Id, i);
        return ServiceProviderResult<ClientBriefResponse>.Ok(b.ToResponse(i), "Opportunity updated.");
    }

    public async Task<ServiceProviderResult<List<ProposalResponse>>> GetProviderProposalsAsync(string providerId)
    {
        var rows = await _db.Proposals.Find(x => x.ProviderId == providerId).SortByDescending(x => x.UpdatedAt).ToListAsync();
        return ServiceProviderResult<List<ProposalResponse>>.Ok(rows.Select(x => x.ToResponse()).ToList());
    }

    public async Task<ServiceProviderResult<ProposalResponse>> GetProposalAsync(string actorId, string proposalId)
    {
        var p = await _db.Proposals.Find(x => x.Id == proposalId && (x.ProviderId == actorId || x.ClientId == actorId)).FirstOrDefaultAsync();
        return p is null ? ServiceProviderResult<ProposalResponse>.NotFound("Proposal not found.") : ServiceProviderResult<ProposalResponse>.Ok(p.ToResponse());
    }

    public async Task<ServiceProviderResult<ProposalResponse>> CreateDraftAsync(string providerId, UpsertProposalRequest r)
    {
        ClientBrief? b = null;
        if (!string.IsNullOrWhiteSpace(r.ClientBriefId))
        {
            b = await _db.ClientBriefs.Find(x => x.Id == r.ClientBriefId).FirstOrDefaultAsync();
            if (b is null) return ServiceProviderResult<ProposalResponse>.NotFound("Brief not found.");
        }
        var p = new Proposal { ProviderId = providerId, ClientBriefId = b?.Id, ClientId = b?.ClientId ?? r.ClientId ?? "" };
        var applied = ApplyProposalRequest(p, r);
        if (applied is not null) return ServiceProviderResult<ProposalResponse>.Conflict(applied);
        await _db.Proposals.InsertOneAsync(p);
        return ServiceProviderResult<ProposalResponse>.Ok(p.ToResponse(PriceWarnings(p, b)), "Proposal draft saved.");
    }

    public async Task<ServiceProviderResult<ProposalResponse>> UpdateDraftAsync(string providerId, string proposalId, UpsertProposalRequest r)
    {
        var p = await ProviderProposal(providerId, proposalId);
        if (p is null) return ServiceProviderResult<ProposalResponse>.NotFound("Proposal not found.");
        if (p.Status != ProposalStatus.Draft) return ServiceProviderResult<ProposalResponse>.Conflict("Only a draft proposal can be edited.");
        var linkedBrief = await Brief(p.ClientBriefId);
        if (linkedBrief is not null && linkedBrief.Status != ClientBriefStatus.Open)
            return ServiceProviderResult<ProposalResponse>.Conflict("This opportunity is closed; its proposals are read-only.");
        var error = ApplyProposalRequest(p, r); if (error is not null) return ServiceProviderResult<ProposalResponse>.Conflict(error);
        p.UpdatedAt = DateTime.UtcNow; await _db.Proposals.ReplaceOneAsync(x => x.Id == p.Id && x.ProviderId == providerId, p);
        var b = await Brief(p.ClientBriefId);
        return ServiceProviderResult<ProposalResponse>.Ok(p.ToResponse(PriceWarnings(p, b)), "Proposal draft saved.");
    }

    public async Task<ServiceProviderResult<ProposalResponse>> SubmitAsync(string providerId, string proposalId)
    {
        var p = await ProviderProposal(providerId, proposalId);
        if (p is null) return ServiceProviderResult<ProposalResponse>.NotFound("Proposal not found.");
        if (!ProposalStateMachine.CanTransition(p.Status, ProposalStatus.Submitted)) return TransitionConflict<ProposalResponse>(p.Status, ProposalStatus.Submitted);
        var b = await Brief(p.ClientBriefId);
        var validation = await ValidateSubmission(providerId, p, b);
        if (validation is not null) return ServiceProviderResult<ProposalResponse>.Conflict(validation);
        p.Status = ProposalStatus.Submitted; p.SubmittedAt = p.UpdatedAt = DateTime.UtcNow;
        await _db.Proposals.ReplaceOneAsync(x => x.Id == p.Id && x.ProviderId == providerId, p);
        await _responseRates.RefreshTrustSignalAsync(providerId);
        return ServiceProviderResult<ProposalResponse>.Ok(p.ToResponse(PriceWarnings(p, b)), "Proposal submitted.");
    }

    public async Task<ServiceProviderResult<ProposalResponse>> WithdrawAsync(string providerId, string proposalId)
    {
        var p = await ProviderProposal(providerId, proposalId);
        if (p is null) return ServiceProviderResult<ProposalResponse>.NotFound("Proposal not found.");
        return await ProviderTransition(p, ProposalStatus.Withdrawn, "Proposal withdrawn.");
    }

    public async Task<ServiceProviderResult<ProposalResponse>> DuplicateExpiredAsync(string providerId, string proposalId)
    {
        var old = await ProviderProposal(providerId, proposalId);
        if (old is null) return ServiceProviderResult<ProposalResponse>.NotFound("Proposal not found.");
        if (old.Status != ProposalStatus.Expired && old.ExpiresAt > DateTime.UtcNow)
            return ServiceProviderResult<ProposalResponse>.Conflict("Only an expired proposal can be duplicated.");
        var p = CloneAsDraft(old); await _db.Proposals.InsertOneAsync(p);
        return ServiceProviderResult<ProposalResponse>.Ok(p.ToResponse(), "Expired proposal duplicated.");
    }

    public async Task<ServiceProviderResult<ProposalResponse>> ReviseAsync(string providerId, string proposalId, UpsertProposalRequest r)
    {
        var p = await ProviderProposal(providerId, proposalId);
        if (p is null) return ServiceProviderResult<ProposalResponse>.NotFound("Proposal not found.");
        if (!ProposalStateMachine.CanTransition(p.Status, ProposalStatus.Revised)) return TransitionConflict<ProposalResponse>(p.Status, ProposalStatus.Revised);
        var linkedBrief = await Brief(p.ClientBriefId);
        if (linkedBrief is not null && linkedBrief.Status != ClientBriefStatus.Open)
            return ServiceProviderResult<ProposalResponse>.Conflict("This opportunity is closed; its proposals are read-only.");
        p.PreviousVersions.Add(Snapshot(p));
        var error = ApplyProposalRequest(p, r); if (error is not null) return ServiceProviderResult<ProposalResponse>.Conflict(error);
        p.Version++; p.Status = ProposalStatus.Revised; p.UpdatedAt = DateTime.UtcNow;
        await _db.Proposals.ReplaceOneAsync(x => x.Id == p.Id && x.ProviderId == providerId, p);
        return ServiceProviderResult<ProposalResponse>.Ok(p.ToResponse(), "Revised proposal submitted.");
    }

    public Task<ServiceProviderResult<ProposalResponse>> MarkViewedAsync(string clientId, string proposalId) => ClientTransition(clientId, proposalId, ProposalStatus.Viewed, "Proposal viewed.");
    public Task<ServiceProviderResult<ProposalResponse>> RequestChangesAsync(string clientId, string proposalId) => ClientTransition(clientId, proposalId, ProposalStatus.ChangesRequested, "Changes requested.");
    public Task<ServiceProviderResult<ProposalResponse>> StartReviewAsync(string clientId, string proposalId) => ClientTransition(clientId, proposalId, ProposalStatus.ClientReviewing, "Proposal is under review.");
    public Task<ServiceProviderResult<ProposalResponse>> DeclineAsync(string clientId, string proposalId) => ClientTransition(clientId, proposalId, ProposalStatus.Declined, "Proposal declined.");

    public async Task<ServiceProviderResult<ProposalResponse>> AcceptAsync(string clientId, string proposalId, AcceptProposalRequest r)
    {
        var p = await ClientProposal(clientId, proposalId);
        if (p is null) return ServiceProviderResult<ProposalResponse>.NotFound("Proposal not found.");
        if (!ProposalStateMachine.CanTransition(p.Status, ProposalStatus.Accepted)) return TransitionConflict<ProposalResponse>(p.Status, ProposalStatus.Accepted);
        if (p.ExpiresAt <= DateTime.UtcNow) return ServiceProviderResult<ProposalResponse>.Conflict("An expired proposal cannot be accepted.");
        if (!r.ExplicitlyConfirmed || !r.EscrowAuthorized) return ServiceProviderResult<ProposalResponse>.Conflict("Client confirmation and escrow authorization are required.");
        p.Status = ProposalStatus.Accepted; p.AcceptedAt = p.UpdatedAt = DateTime.UtcNow; p.AcceptedBy = clientId;
        p.AcceptanceTrigger = "ClientConfirmed"; p.EscrowStatus = ProposalEscrowStatus.Authorized;
        p.ConversionStatus = ProposalConversionStatus.AwaitingModule4; // Module 4 consumes this boundary.
        await _db.Proposals.ReplaceOneAsync(x => x.Id == p.Id && x.ClientId == clientId, p);
        _jobs.Enqueue<WorkroomConversionJob>(job => job.ConvertAsync(p.Id));
        await NotifyAsync(p.ProviderId, "Proposal accepted", "Your proposal was accepted by the client.");
        return ServiceProviderResult<ProposalResponse>.Ok(p.ToResponse(), "Proposal accepted; awaiting Module 4 conversion.");
    }

    public async Task<ServiceProviderResult<PackagePurchaseResponse>> PurchasePackageAsync(string clientId, PackagePurchaseRequest r)
    {
        var pkg = await _db.ServicePackages.Find(x => x.Id == r.PackageId).FirstOrDefaultAsync();
        if (pkg is null) return ServiceProviderResult<PackagePurchaseResponse>.NotFound("Package not found.");
        var listing = await _db.ServiceListings.Find(x => x.Id == pkg.ServiceId).FirstOrDefaultAsync();
        if (listing is null) return ServiceProviderResult<PackagePurchaseResponse>.NotFound("Service not found.");
        var provider = await _users.FindByIdAsync(listing.ProviderId); var client = await _users.FindByIdAsync(clientId);
        if (provider?.ServiceProviderProfile is null || client is null) return ServiceProviderResult<PackagePurchaseResponse>.Conflict("Provider or client account is unavailable.");
        var selected = pkg.AddOns.Where(a => a.Enabled && r.SelectedAddOnNames.Contains(a.Name, StringComparer.OrdinalIgnoreCase))
            .Select(a => new SelectedAddOnSnapshot { Name = a.Name, Price = a.Price, DeliveryTimeAdjustmentDays = a.DeliveryTimeAdjustmentDays }).ToList();
        var answers = ToAnswers(r.Requirements); var requiredIds = pkg.RequirementsTemplate.Where(x => x.Required).Select(x => x.FieldId).ToHashSet();
        var complete = requiredIds.All(id => answers.Any(a => a.TemplateFieldId == id && (!string.IsNullOrWhiteSpace(a.Value) || a.Attachment is not null)));
        var failures = new List<string>(); var profile = provider.ServiceProviderProfile;
        if (listing.Status != CatalogStatus.Published) failures.Add("Service is not published");
        if (pkg.Status != CatalogStatus.Published) failures.Add("Package is not active");
        if (!pkg.InstantOrderEnabled || pkg.ManualApprovalRequired) failures.Add("Instant order is disabled");
        if (profile.VerificationStatus != ServiceProviderVerificationStatus.Verified || !IsAvailable(profile)) failures.Add("Provider is unavailable or at capacity");
        if (pkg.MaximumActiveOrders > 0)
        {
            var activeForPackage = await _db.Proposals.CountDocumentsAsync(x => x.PackageId == pkg.Id && x.Status == ProposalStatus.Accepted);
            if (activeForPackage >= pkg.MaximumActiveOrders) failures.Add("Package capacity is full");
        }
        if (client.Onboarding.Phase < 1) failures.Add("Client account is inactive");
        if (!complete) failures.Add("Requirements are incomplete");
        if (!r.PaymentMethodVerified) failures.Add("Payment method is not verified");
        if (!r.ExplicitlyConfirmed) failures.Add("Client confirmation is missing");
        if (!r.EscrowAuthorized) failures.Add("Escrow authorization failed");
        if (r.ComplianceHold) failures.Add("Compliance hold");
        if (!r.FinalSummaryShown) failures.Add("Final summary was not confirmed");
        var final = pkg.Price + selected.Sum(x => x.Price); var now = DateTime.UtcNow; var auto = failures.Count == 0;
        var faqs = await _db.ServiceFAQs.Find(x => x.ServiceId == listing.Id && x.Status == CatalogStatus.Published).ToListAsync();
        var p = new Proposal
        {
            ServiceId = listing.Id, PackageId = pkg.Id, ProviderId = listing.ProviderId, ClientId = clientId,
            ProposalSource = ProposalSource.PublishedPackagePurchase,
            AcceptanceMode = auto ? ProposalAcceptanceMode.RuleBasedInstantOrder : ProposalAcceptanceMode.ManualClientAcceptance,
            Title = pkg.PackageTitle, CoverMessage = "Published package purchase", ProposedPrice = final, Currency = pkg.Currency,
            PricingType = pkg.PricingModel ?? PricingModel.FixedPrice, DeliveryTimeValue = pkg.DeliveryTimeValue,
            DeliveryTimeUnit = pkg.DeliveryTimeUnit, DeliveryDayType = pkg.DeliveryDayType, DeliveryStartRule = pkg.DeliveryStartRule,
            IncludedRevisionCount = pkg.IncludedRevisionCount, UnlimitedRevisions = pkg.UnlimitedRevisions,
            RevisionRequestWindowDays = pkg.RevisionRequestWindowDays, Deliverables = new(pkg.Deliverables), SelectedAddOns = selected,
            RequirementsSubmission = answers, RequirementsStatus = complete ? ProposalRequirementsStatus.Complete : ProposalRequirementsStatus.Incomplete,
            Status = auto ? ProposalStatus.Accepted : ProposalStatus.Submitted, SubmittedAt = now, ExpiresAt = now.AddDays(7),
            AcceptedAt = auto ? now : null, AcceptedBy = auto ? clientId : null,
            AcceptanceTrigger = auto ? "PublishedPackageTermsConfirmed" : "ProviderApprovalRequired",
            EscrowStatus = auto ? ProposalEscrowStatus.Authorized : ProposalEscrowStatus.AuthorizationPending,
            ConversionStatus = auto ? ProposalConversionStatus.AwaitingModule4 : ProposalConversionStatus.NotApplicable,
        };
        p.PurchaseSnapshot = new PurchaseSnapshot
        {
            ServiceId = listing.Id, ServiceTitle = listing.Title, ServiceCategory = listing.Category, PackageId = pkg.Id,
            PackageTitle = pkg.PackageTitle, PackagePrice = pkg.Price, SelectedAddOns = selected, FinalPrice = final, Currency = pkg.Currency,
            DeliveryTimeValue = pkg.DeliveryTimeValue, DeliveryTimeUnit = pkg.DeliveryTimeUnit, DeliveryDayType = pkg.DeliveryDayType,
            IncludedRevisionCount = pkg.IncludedRevisionCount, UnlimitedRevisions = pkg.UnlimitedRevisions,
            RevisionRequestWindowDays = pkg.RevisionRequestWindowDays, Deliverables = new(pkg.Deliverables), Requirements = answers,
            FaqSnapshot = faqs.OrderBy(x => x.DisplayOrder).Select(x => $"{x.Question}\n{x.Answer}").ToList(),
            CancellationTerms = pkg.CancellationPolicy, AcceptedAt = auto ? now : default,
        };
        await _db.Proposals.InsertOneAsync(p);
        if (auto)
        {
            _jobs.Enqueue<WorkroomConversionJob>(job => job.ConvertAsync(p.Id));
            await NotifyAsync(p.ProviderId, "Package purchased", "A client purchased your published package.");
        }
        else await NotifyAsync(p.ProviderId, "Provider approval required", "A client sent a package order request.");
        return ServiceProviderResult<PackagePurchaseResponse>.Ok(new PackagePurchaseResponse
        {
            Proposal = p.ToResponse(), AutoAccepted = auto, UiStatus = auto ? "Accepted" : "Provider Approval Required", FailedConditions = failures,
        });
    }

    public async Task<ServiceProviderResult<ProposalResponse>> ProviderReviewOrderRequestAsync(string providerId, string proposalId, bool accept)
    {
        var p = await ProviderProposal(providerId, proposalId);
        if (p is null) return ServiceProviderResult<ProposalResponse>.NotFound("Proposal not found.");
        if (p.ProposalSource != ProposalSource.PublishedPackagePurchase || p.AcceptanceTrigger != "ProviderApprovalRequired" || p.Status != ProposalStatus.Submitted)
            return ServiceProviderResult<ProposalResponse>.Conflict("This proposal is not awaiting provider approval.");
        p.Status = accept ? ProposalStatus.ClientReviewing : ProposalStatus.Declined;
        p.AcceptanceTrigger = accept ? "ProviderApprovedClientConfirmationRequired" : "ProviderDeclined"; p.UpdatedAt = DateTime.UtcNow;
        await _db.Proposals.ReplaceOneAsync(x => x.Id == p.Id && x.ProviderId == providerId, p);
        await NotifyAsync(p.ClientId, accept ? "Order request approved" : "Order request declined",
            accept ? "Confirm the final terms and escrow to continue." : "The provider declined your order request.");
        return ServiceProviderResult<ProposalResponse>.Ok(p.ToResponse(), accept ? "Client confirmation required." : "Order request declined.");
    }

    private async Task<ServiceProviderResult<ProposalResponse>> ClientTransition(string clientId, string proposalId, ProposalStatus next, string message)
    {
        var p = await ClientProposal(clientId, proposalId);
        if (p is null) return ServiceProviderResult<ProposalResponse>.NotFound("Proposal not found.");
        if (!ProposalStateMachine.CanTransition(p.Status, next)) return TransitionConflict<ProposalResponse>(p.Status, next);
        p.Status = next; p.UpdatedAt = DateTime.UtcNow; await _db.Proposals.ReplaceOneAsync(x => x.Id == p.Id && x.ClientId == clientId, p);
        if (next is ProposalStatus.Viewed or ProposalStatus.ChangesRequested or ProposalStatus.Declined)
            await NotifyAsync(p.ProviderId, next == ProposalStatus.Viewed ? "Proposal viewed" : next == ProposalStatus.ChangesRequested ? "Changes requested" : "Proposal declined", message);
        return ServiceProviderResult<ProposalResponse>.Ok(p.ToResponse(), message);
    }

    private async Task<ServiceProviderResult<ProposalResponse>> ProviderTransition(Proposal p, ProposalStatus next, string message)
    {
        if (!ProposalStateMachine.CanTransition(p.Status, next)) return TransitionConflict<ProposalResponse>(p.Status, next);
        p.Status = next; p.UpdatedAt = DateTime.UtcNow; await _db.Proposals.ReplaceOneAsync(x => x.Id == p.Id && x.ProviderId == p.ProviderId, p);
        return ServiceProviderResult<ProposalResponse>.Ok(p.ToResponse(), message);
    }

    private async Task<string?> ValidateSubmission(string providerId, Proposal p, ClientBrief? brief)
    {
        if (brief is null || brief.Status != ClientBriefStatus.Open) return "This opportunity is no longer accepting proposals.";
        if (p.ExpiresAt is null || p.ExpiresAt <= DateTime.UtcNow) return "Select a future proposal expiration date.";
        if (string.IsNullOrWhiteSpace(p.Title) || string.IsNullOrWhiteSpace(p.CoverMessage) || p.ProposedPrice <= 0 ||
            p.DeliveryTimeValue <= 0 || p.Deliverables.Count == 0 || p.IncludedRevisionCount < 0)
            return "Complete the title, cover message, price, delivery duration, deliverables, and revision policy.";
        if (!p.Currency.Equals(brief.Currency, StringComparison.OrdinalIgnoreCase)) return "Proposal currency must match the brief currency.";
        var user = await _users.FindByIdAsync(providerId); var profile = user?.ServiceProviderProfile;
        if (profile is null || profile.VerificationStatus != ServiceProviderVerificationStatus.Verified || !IsAvailable(profile))
            return "The provider account is not eligible for paid work or is currently at capacity.";
        return null;
    }

    private string? ApplyProposalRequest(Proposal p, UpsertProposalRequest r)
    {
        if (!TryEnum<ProposalSource>(r.ProposalSource, out var source) || !TryEnum<PricingModel>(r.PricingType, out var pricing) ||
            !TryEnum<DeliveryTimeUnit>(r.DeliveryTimeUnit, out var unit) || !TryEnum<DeliveryDayType>(r.DeliveryDayType, out var dayType) ||
            !TryEnum<DeliveryStartRule>(r.DeliveryStartRule, out var startRule)) return "One or more proposal options are invalid.";
        if (r.ProposedPrice < 0 || r.IncludedRevisionCount < 0 || r.RevisionRequestWindowDays < 0 || r.WeeklyHourLimit < 0) return "Price, hour limits, and revision values cannot be negative.";
        if (r.UnlimitedRevisions && !r.ConfirmUnlimitedRevisions) return "Unlimited revisions require explicit confirmation.";
        p.ServiceId = r.ServiceId ?? p.ServiceId; p.PackageId = r.PackageId ?? p.PackageId; p.ProposalSource = source;
        p.Title = r.Title?.Trim() ?? ""; p.CoverMessage = r.CoverMessage?.Trim() ?? ""; p.ProposedPrice = r.ProposedPrice;
        p.Currency = Currency(r.Currency); p.PricingType = pricing; p.WeeklyHourLimit = pricing == PricingModel.Hourly ? r.WeeklyHourLimit : null; p.DeliveryTimeValue = r.DeliveryTimeValue; p.DeliveryTimeUnit = unit;
        p.DeliveryDayType = dayType; p.DeliveryStartRule = startRule; p.IncludedRevisionCount = r.IncludedRevisionCount;
        p.UnlimitedRevisions = r.UnlimitedRevisions; p.RevisionRequestWindowDays = r.RevisionRequestWindowDays;
        p.Deliverables = Normalize(r.Deliverables); p.Attachments = Normalize(r.Attachments); p.ExpiresAt = r.ExpiresAt;
        p.MilestonePlan = r.MilestonePlan.Select(x => new ProposalMilestonePlanItem
        {
            Title = x.Title?.Trim() ?? "", Description = x.Description?.Trim() ?? "", Amount = x.Amount,
            DeliveryTimeValue = x.DeliveryTimeValue, DeliveryTimeUnit = TryEnum<DeliveryTimeUnit>(x.DeliveryTimeUnit, out var u) ? u : DeliveryTimeUnit.Days,
            DisplayOrder = x.DisplayOrder,
        }).ToList();
        return null;
    }

    private async Task<ClientBriefInteraction> EnsureInteractionAsync(string providerId, ClientBrief brief)
    {
        var now = DateTime.UtcNow;
        var availableAt = ResolveAvailabilityTimestamp(brief, providerId);
        var update = Builders<ClientBriefInteraction>.Update
            .SetOnInsert(x => x.ProviderId, providerId).SetOnInsert(x => x.ClientBriefId, brief.Id)
            .SetOnInsert(x => x.CreatedAt, availableAt).SetOnInsert(x => x.UpdatedAt, now);
        return await _db.ClientBriefInteractions.FindOneAndUpdateAsync<ClientBriefInteraction>(
            x => x.ProviderId == providerId && x.ClientBriefId == brief.Id, update,
            new FindOneAndUpdateOptions<ClientBriefInteraction> { IsUpsert = true, ReturnDocument = ReturnDocument.After });
    }

    public static DateTime ResolveAvailabilityTimestamp(ClientBrief brief, string providerId)
    {
        var invitation = brief.InvitationDeliveries.FirstOrDefault(x =>
            x.ProviderId.Equals(providerId, StringComparison.OrdinalIgnoreCase));
        return invitation?.DeliveredAt ?? brief.PublishedAt ?? brief.CreatedAt;
    }

    private double MatchScore(ApplicationUser user, ClientBrief b) =>
        b.Industries.Count == 0 ? _matching.Score(user, "") : b.Industries.Max(industry => _matching.Score(user, industry));
    private async Task<ClientBrief?> OwnedBrief(string clientId, string id) => await _db.ClientBriefs.Find(x => x.Id == id && x.ClientId == clientId).FirstOrDefaultAsync();
    private async Task<ClientBrief?> Brief(string? id) => string.IsNullOrWhiteSpace(id) ? null : await _db.ClientBriefs.Find(x => x.Id == id).FirstOrDefaultAsync();
    private async Task<Proposal?> ProviderProposal(string id, string proposalId) => await _db.Proposals.Find(x => x.Id == proposalId && x.ProviderId == id).FirstOrDefaultAsync();
    private async Task<Proposal?> ClientProposal(string id, string proposalId) => await _db.Proposals.Find(x => x.Id == proposalId && x.ClientId == id).FirstOrDefaultAsync();
    private static bool IsAvailable(ServiceProviderProfile p) => p.NewOrderAvailability && (p.MaximumConcurrentOrders <= 0 || p.CurrentActiveOrders < p.MaximumConcurrentOrders);
    private static bool CanSurface(ServiceProviderProfile p, string providerId, ClientBrief b) =>
        p.VerificationStatus == ServiceProviderVerificationStatus.Verified && IsAvailable(p) &&
        p.ServiceCategories.Contains(b.ServiceCategory) &&
        (b.Visibility == ClientBriefVisibility.Public || b.InvitedProviderIds.Contains(providerId));
    private static DateTime BoundBriefExpiry(DateTime? requested, DateTime published) => requested is null || requested <= published ? published + DefaultBriefLifetime : requested > published + MaximumBriefLifetime ? published + MaximumBriefLifetime : requested.Value;
    private static string Currency(string? value) => string.IsNullOrWhiteSpace(value) ? "EUR" : value.Trim().ToUpperInvariant();
    private static List<string> Normalize(IEnumerable<string>? values) => (values ?? Array.Empty<string>()).Select(x => x?.Trim()).Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x!).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
    private static bool TryEnum<T>(string? value, out T parsed) where T : struct, Enum => Enum.TryParse(value?.Replace(" ", ""), true, out parsed);
    private static ServiceProviderResult<T> TransitionConflict<T>(ProposalStatus from, ProposalStatus to) => ServiceProviderResult<T>.Conflict($"Proposal transition {from} -> {to} is not allowed.");
    private static List<string> PriceWarnings(Proposal p, ClientBrief? b) => b is not null && (p.ProposedPrice < b.BudgetMinimum || p.ProposedPrice > b.BudgetMaximum) ? new() { "The proposed price is outside the client's budget range." } : new();
    private static List<ProposalRequirementAnswer> ToAnswers(IEnumerable<RequirementAnswerRequest> rows) => rows.Select(x => new ProposalRequirementAnswer { TemplateFieldId = x.TemplateFieldId, FieldType = TryEnum<RequirementsFieldType>(x.FieldType, out var ft) ? ft : RequirementsFieldType.Text, Value = x.Value ?? "", Attachment = x.Attachment }).ToList();
    private static ProposalVersionSnapshot Snapshot(Proposal p) => new() { Version = p.Version, Title = p.Title, CoverMessage = p.CoverMessage, ProposedPrice = p.ProposedPrice, Currency = p.Currency, PricingType = p.PricingType, WeeklyHourLimit = p.WeeklyHourLimit, DeliveryTimeValue = p.DeliveryTimeValue, DeliveryTimeUnit = p.DeliveryTimeUnit, DeliveryDayType = p.DeliveryDayType, DeliveryStartRule = p.DeliveryStartRule, IncludedRevisionCount = p.IncludedRevisionCount, UnlimitedRevisions = p.UnlimitedRevisions, RevisionRequestWindowDays = p.RevisionRequestWindowDays, Deliverables = new(p.Deliverables), MilestonePlan = p.MilestonePlan.Select(x => new ProposalMilestonePlanItem { Title = x.Title, Description = x.Description, Amount = x.Amount, DeliveryTimeValue = x.DeliveryTimeValue, DeliveryTimeUnit = x.DeliveryTimeUnit, DisplayOrder = x.DisplayOrder }).ToList(), Attachments = new(p.Attachments), ExpiresAt = p.ExpiresAt };
    private static Proposal CloneAsDraft(Proposal old) => new() { ClientBriefId = old.ClientBriefId, ServiceId = old.ServiceId, PackageId = old.PackageId, ProviderId = old.ProviderId, ClientId = old.ClientId, ProposalSource = old.ProposalSource, AcceptanceMode = old.AcceptanceMode, Title = old.Title, CoverMessage = old.CoverMessage, ProposedPrice = old.ProposedPrice, Currency = old.Currency, PricingType = old.PricingType, WeeklyHourLimit = old.WeeklyHourLimit, DeliveryTimeValue = old.DeliveryTimeValue, DeliveryTimeUnit = old.DeliveryTimeUnit, DeliveryDayType = old.DeliveryDayType, DeliveryStartRule = old.DeliveryStartRule, IncludedRevisionCount = old.IncludedRevisionCount, UnlimitedRevisions = old.UnlimitedRevisions, RevisionRequestWindowDays = old.RevisionRequestWindowDays, Deliverables = new(old.Deliverables), MilestonePlan = old.MilestonePlan.Select(x => new ProposalMilestonePlanItem { Title = x.Title, Description = x.Description, Amount = x.Amount, DeliveryTimeValue = x.DeliveryTimeValue, DeliveryTimeUnit = x.DeliveryTimeUnit, DisplayOrder = x.DisplayOrder }).ToList(), Attachments = new(old.Attachments), ExpiresAt = DateTime.UtcNow.AddDays(7) };

    private async Task NotifyInvitedAsync(ClientBrief b)
    {
        foreach (var id in b.InvitedProviderIds)
        {
            if (!Guid.TryParse(id, out var providerId)) continue;
            try
            {
                var receipt = await _notifications.NotifyUserWithReceipt(providerId, "Direct invitation received", $"You were invited to: {b.Title}");
                b.InvitationDeliveries.RemoveAll(x => x.ProviderId.Equals(id, StringComparison.OrdinalIgnoreCase));
                b.InvitationDeliveries.Add(new ClientBriefInvitationDelivery { ProviderId = id, DeliveredAt = receipt.CreatedAt });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Lead invitation notification failed for {UserId}", id);
            }
        }

        if (b.InvitationDeliveries.Count > 0)
            await _db.ClientBriefs.UpdateOneAsync(x => x.Id == b.Id,
                Builders<ClientBrief>.Update.Set(x => x.InvitationDeliveries, b.InvitationDeliveries));
    }
    private async Task NotifyAsync(string userId, string title, string body)
    {
        if (!Guid.TryParse(userId, out var id)) return;
        try { await _notifications.NotifyUser(id, title, body); }
        catch (Exception ex) { _logger.LogWarning(ex, "Lead notification failed for {UserId}", userId); }
    }
}
