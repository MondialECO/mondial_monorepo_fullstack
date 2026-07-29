using Hangfire;
using Microsoft.AspNetCore.Identity;
using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.Configuration;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Interface;

namespace WebApp.Services.Implementations;

/// <summary>Module 4 backend-authoritative workroom and financial lifecycle.</summary>
public sealed class WorkroomService : IWorkroomService
{
    private static readonly TimeSpan ClientReviewWindow = TimeSpan.FromHours(48);
    private static readonly TimeSpan AutoReleaseWindow = TimeSpan.FromDays(7);
    private static readonly TimeSpan DisputeReviewWindow = TimeSpan.FromDays(5);
    private readonly MongoDbContext _db;
    private readonly IMongoClient _mongo;
    private readonly IPaymentGatewayService _gateway;
    private readonly IFileSecurityScanner _scanner;
    private readonly SaveFile _files;
    private readonly UserManager<ApplicationUser> _users;
    private readonly IServiceProviderService _providers;
    private readonly IClientRelationshipCalculator _relationships;
    private readonly INotificationService _notifications;
    private readonly ILogger<WorkroomService> _logger;

    private readonly IServiceProviderProfileStore _spStore;
    private readonly WebApp.Services.Migrations.IServiceProviderProfileSplitMigration _migrator;

    public WorkroomService(MongoDbContext db, IMongoClient mongo, IPaymentGatewayService gateway,
        IFileSecurityScanner scanner, SaveFile files, UserManager<ApplicationUser> users,
        IServiceProviderService providers, IClientRelationshipCalculator relationships,
        IServiceProviderProfileStore spStore,
        WebApp.Services.Migrations.IServiceProviderProfileSplitMigration migrator,
        INotificationService notifications, ILogger<WorkroomService> logger)
    {
        _db = db; _mongo = mongo; _gateway = gateway; _scanner = scanner; _files = files;
        _users = users; _providers = providers; _relationships = relationships;
        _spStore = spStore; _migrator = migrator;
        _notifications = notifications; _logger = logger;
    }

    [AutomaticRetry(Attempts = 5)]
    public async Task ConvertProposalAsync(string proposalId)
    {
        var existing = await _db.WorkroomEngagements.Find(x => x.ProposalId == proposalId).FirstOrDefaultAsync();
        if (existing is not null) return;
        var proposal = await _db.Proposals.Find(x => x.Id == proposalId && x.Status == ProposalStatus.Accepted && x.ConversionStatus == ProposalConversionStatus.AwaitingModule4).FirstOrDefaultAsync();
        if (proposal is null) return;

        var plans = proposal.MilestonePlan.OrderBy(x => x.DisplayOrder).ToList();
        if (plans.Count > 0 && plans.Sum(x => x.Amount) != proposal.ProposedPrice)
            throw new InvalidOperationException("Proposal milestone amounts must equal the accepted proposal price.");
        if (plans.Count == 0)
        {
            plans.Add(new ProposalMilestonePlanItem
            {
                Title = proposal.Title,
                Description = "Full accepted scope",
                Amount = proposal.ProposedPrice,
                DeliveryTimeValue = proposal.DeliveryTimeValue,
                DeliveryTimeUnit = proposal.DeliveryTimeUnit,
                DisplayOrder = 0,
            });
        }

        var now = DateTime.UtcNow;
        var engagementId = ObjectId.GenerateNewId().ToString();
        var contractId = ObjectId.GenerateNewId().ToString();
        var milestones = plans.Select((p, index) => new WorkroomMilestone
        {
            Id = ObjectId.GenerateNewId().ToString(), EngagementId = engagementId, Title = p.Title,
            Description = p.Description, Amount = p.Amount, Currency = proposal.Currency,
            DisplayOrder = p.DisplayOrder == 0 && index > 0 ? index : p.DisplayOrder,
            CompletionCriteria = string.IsNullOrWhiteSpace(p.Description) ? "Deliver the accepted milestone scope." : p.Description,
            IncludedRevisionCount = proposal.IncludedRevisionCount, UnlimitedRevisions = proposal.UnlimitedRevisions,
            MilestoneStatus = WorkroomMilestoneStatus.FundingRequired, EscrowStatus = WorkroomEscrowStatus.NotFunded,
            CreatedAt = now, UpdatedAt = now,
        }).ToList();
        var contract = new Contract
        {
            Id = contractId, EngagementId = engagementId, ProviderId = proposal.ProviderId, ClientId = proposal.ClientId,
            Terms = new ContractTerms
            {
                Price = proposal.ProposedPrice, Currency = proposal.Currency, PricingType = proposal.PricingType,
                DeliveryTimeValue = proposal.DeliveryTimeValue, DeliveryTimeUnit = proposal.DeliveryTimeUnit,
                DeliveryDayType = proposal.DeliveryDayType, DeliveryStartRule = proposal.DeliveryStartRule,
                IncludedRevisionCount = proposal.IncludedRevisionCount, UnlimitedRevisions = proposal.UnlimitedRevisions,
                RevisionRequestWindowDays = proposal.RevisionRequestWindowDays, Deliverables = new(proposal.Deliverables),
                AllowsParallelMilestones = false,
                HourlyRate = proposal.PricingType == PricingModel.Hourly ? proposal.ProposedPrice : null,
                WeeklyHourLimit = proposal.PricingType == PricingModel.Hourly ? proposal.WeeklyHourLimit : null,
            }, CreatedAt = now,
        };
        var engagement = new WorkroomEngagement
        {
            Id = engagementId, ProposalId = proposal.Id, ProviderId = proposal.ProviderId, ClientId = proposal.ClientId,
            ContractId = contractId, Title = proposal.Title, Description = proposal.CoverMessage,
            ContractValue = proposal.ProposedPrice, Currency = proposal.Currency, CurrentMilestoneId = milestones[0].Id,
            EngagementStatus = EngagementStatus.ContractPending, EscrowStatus = WorkroomEscrowStatus.NotFunded,
            CreatedAt = now, UpdatedAt = now,
        };

        using var session = await _mongo.StartSessionAsync();
        session.StartTransaction();
        try
        {
            await _db.Contracts.InsertOneAsync(session, contract);
            await _db.WorkroomEngagements.InsertOneAsync(session, engagement);
            await _db.WorkroomMilestones.InsertManyAsync(session, milestones);
            var update = Builders<Proposal>.Update.Set(x => x.Status, ProposalStatus.ConvertedToProject)
                .Set(x => x.ConversionStatus, ProposalConversionStatus.Converted).Set(x => x.UpdatedAt, now);
            var changed = await _db.Proposals.UpdateOneAsync(session,
                x => x.Id == proposal.Id && x.Status == ProposalStatus.Accepted && x.ConversionStatus == ProposalConversionStatus.AwaitingModule4, update);
            if (changed.ModifiedCount != 1) throw new InvalidOperationException("Proposal conversion lost its atomic ownership check.");
            await _db.WorkroomAuditEvents.InsertOneAsync(session, Audit("system", "System", "Proposal.Converted", "WorkroomEngagement", engagementId, null, EngagementStatus.ContractPending.ToString()));
            await session.CommitTransactionAsync();
        }
        catch
        {
            await session.AbortTransactionAsync();
            throw;
        }
        await Notify(engagement.ProviderId, "Workroom created", $"{engagement.Title} is ready for contract confirmation.");
        await Notify(engagement.ClientId, "Contract ready", $"Confirm the contract for {engagement.Title}.");
    }

    [AutomaticRetry(Attempts = 3)]
    public async Task SweepConversionsAsync()
    {
        var ids = await _db.Proposals.Find(x => x.Status == ProposalStatus.Accepted && x.ConversionStatus == ProposalConversionStatus.AwaitingModule4)
            .Project(x => x.Id).Limit(200).ToListAsync();
        foreach (var id in ids) await ConvertProposalAsync(id);
    }

    [AutomaticRetry(Attempts = 3)]
    public async Task SweepTimedRulesAsync()
    {
        var now = DateTime.UtcNow;
        var releaseIds = await _db.WorkroomMilestones.Find(x =>
            (x.MilestoneStatus == WorkroomMilestoneStatus.ClientReviewing || x.MilestoneStatus == WorkroomMilestoneStatus.Resubmitted) &&
            x.AutoReleaseAt <= now && x.DisputeOpenedAt == null).Project(x => x.Id).Limit(200).ToListAsync();
        foreach (var id in releaseIds) await ReleaseMilestoneAsync("system", id, true);

        var dueSoon = await _db.WorkroomMilestones.Find(x => x.MilestoneStatus == WorkroomMilestoneStatus.Active &&
            x.DueDate > now && x.DueDate < now.AddHours(48)).Limit(200).ToListAsync();
        foreach (var milestone in dueSoon)
        {
            var e = await _db.WorkroomEngagements.Find(x => x.Id == milestone.EngagementId).FirstOrDefaultAsync();
            if (e is not null) await Notify(e.ProviderId, "Deadline approaching", $"{milestone.Title} is due soon.");
        }

        var reviewExpired = await _db.WorkroomMilestones.Find(x => x.MilestoneStatus == WorkroomMilestoneStatus.Disputed &&
            x.DisputeReviewEndsAt <= now && x.DisputeOutcome == DisputeOutcome.Open).Limit(200).ToListAsync();
        foreach (var milestone in reviewExpired)
            await _db.WorkroomAuditEvents.InsertOneAsync(Audit("system", "System", "Dispute.ReviewWindowElapsed", "WorkroomMilestone", milestone.Id, null, "AdminReviewRequired"));

        // Reconciliation/outbox retry: gateway calls are idempotent, while every
        // Mongo finalization below still requires a real transaction.
        var reconcile=await _db.PaymentOperations.Find(x=>x.Status==PaymentOperationStatus.ReconciliationRequired).Limit(100).ToListAsync();
        foreach(var op in reconcile)
        {
            if(op.Type==PaymentOperationType.AuthorizeEscrow&&op.MilestoneId is not null)
            {
                var(_,engagement,_)=await MilestoneContext(op.MilestoneId);if(engagement is not null)await FundMilestoneAsync(engagement.ClientId,op.MilestoneId);
            }
            else if(op.Type==PaymentOperationType.ReleaseEscrow&&op.MilestoneId is not null)await ReleaseMilestoneAsync("system",op.MilestoneId,true);
            else if(op.Type==PaymentOperationType.CreatePayout&&op.PayoutRequestId is not null)await ReconcilePayoutAsync(op);
        }
    }

    public async Task<ServiceProviderResult<List<WorkroomEngagementResponse>>> GetEngagementsAsync(string actorId)
    {
        var rows = await _db.WorkroomEngagements.Find(x => x.ProviderId == actorId || x.ClientId == actorId).SortByDescending(x => x.UpdatedAt).ToListAsync();
        var clientNames = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var clientId in rows.Select(x => x.ClientId).Distinct(StringComparer.OrdinalIgnoreCase))
        {
            var client = await _users.FindByIdAsync(clientId);
            clientNames[clientId] = string.IsNullOrWhiteSpace(client?.Name) ? "Client" : client.Name;
        }
        return ServiceProviderResult<List<WorkroomEngagementResponse>>.Ok(rows
            .Select(x => x.ToResponse(clientNames.GetValueOrDefault(x.ClientId, "Client"))).ToList());
    }

    public async Task<ServiceProviderResult<WorkroomDetailResponse>> GetEngagementAsync(string actorId, string engagementId)
    {
        var e = await Participant(actorId, engagementId);
        return e is null ? ServiceProviderResult<WorkroomDetailResponse>.NotFound("Workroom not found.")
            : ServiceProviderResult<WorkroomDetailResponse>.Ok(await Detail(e, actorId));
    }

    public async Task<ServiceProviderResult<ContractResponse>> SignContractAsync(string actorId, string engagementId, bool explicitlyConfirmed)
    {
        if (!explicitlyConfirmed) return ServiceProviderResult<ContractResponse>.Conflict("Explicit contract confirmation is required.");
        var e = await Participant(actorId, engagementId);
        if (e is null) return ServiceProviderResult<ContractResponse>.NotFound("Workroom not found.");
        var c = await _db.Contracts.Find(x => x.Id == e.ContractId).FirstOrDefaultAsync();
        if (c is null || c.Status == ContractStatus.Voided) return ServiceProviderResult<ContractResponse>.Conflict("Contract cannot be signed.");
        var now = DateTime.UtcNow;
        if (actorId == c.ProviderId) c.ProviderSignedAt ??= now;
        if (actorId == c.ClientId) c.ClientSignedAt ??= now;
        if (c.ProviderSignedAt.HasValue && c.ClientSignedAt.HasValue) c.Status = ContractStatus.Signed;
        await _db.Contracts.ReplaceOneAsync(x => x.Id == c.Id, c);
        if (c.Status == ContractStatus.Signed)
        {
            e.EngagementStatus = e.EscrowStatus == WorkroomEscrowStatus.Funded ? EngagementStatus.ReadyToStart : EngagementStatus.EscrowPending;
            e.UpdatedAt = now; await _db.WorkroomEngagements.ReplaceOneAsync(x => x.Id == e.Id, e);
        }
        await AuditAsync(actorId, actorId == c.ProviderId ? "ServiceProvider" : "Client", "Contract.Signed", "Contract", c.Id, null, c.Status.ToString());
        return ServiceProviderResult<ContractResponse>.Ok(ToContract(c), c.Status == ContractStatus.Signed ? "Contract signed by both parties." : "Your consent was recorded.");
    }

    public async Task<ServiceProviderResult<WorkroomMilestoneResponse>> FundMilestoneAsync(string clientId, string milestoneId)
    {
        var (m, e, c) = await MilestoneContext(milestoneId);
        if (m is null || e is null || e.ClientId != clientId) return ServiceProviderResult<WorkroomMilestoneResponse>.NotFound("Milestone not found.");
        if (c?.Status != ContractStatus.Signed) return ServiceProviderResult<WorkroomMilestoneResponse>.Conflict("The contract must be signed before escrow funding.");
        if (m.EscrowStatus == WorkroomEscrowStatus.Funded) return ServiceProviderResult<WorkroomMilestoneResponse>.Ok(ToMilestone(m, e));
        if (m.MilestoneStatus != WorkroomMilestoneStatus.FundingRequired) return ServiceProviderResult<WorkroomMilestoneResponse>.Conflict("This milestone is not awaiting funding.");

        var key = $"escrow:{m.Id}";
        var operation = await BeginOperation(key, PaymentOperationType.AuthorizeEscrow, e.Id, m.Id, null, m.Amount, m.Currency);
        var gateway = await _gateway.AuthorizeEscrowAsync(key, m.Amount, m.Currency);
        if (!gateway.Success)
        {
            await FailOperation(operation, gateway.Error); m.EscrowStatus = WorkroomEscrowStatus.Failed;
            await _db.WorkroomMilestones.ReplaceOneAsync(x => x.Id == m.Id, m);
            return ServiceProviderResult<WorkroomMilestoneResponse>.Conflict("Escrow authorization failed.");
        }
        await GatewaySucceeded(operation, gateway.GatewayReference);
        var now = DateTime.UtcNow;
        using var session = await _mongo.StartSessionAsync(); session.StartTransaction();
        try
        {
            m.EscrowStatus = WorkroomEscrowStatus.Funded; m.MilestoneStatus = WorkroomMilestoneStatus.Funded; m.UpdatedAt = now;
            e.EscrowStatus = WorkroomEscrowStatus.Funded; e.EngagementStatus = EngagementStatus.ReadyToStart; e.UpdatedAt = now;
            var tx = new FinancialTransaction { EngagementId=e.Id, MilestoneId=m.Id, ProviderId=e.ProviderId, ClientId=e.ClientId,
                GrossAmount=m.Amount, Currency=m.Currency, TransactionType=FinancialTransactionType.EscrowFunded,
                PaymentStatus=PaymentStatus.Completed, IdempotencyKey=key, CreatedAt=now };
            operation.Status = PaymentOperationStatus.Completed; operation.UpdatedAt = now;
            await _db.WorkroomMilestones.ReplaceOneAsync(session, x => x.Id == m.Id, m);
            await _db.WorkroomEngagements.ReplaceOneAsync(session, x => x.Id == e.Id, e);
            await _db.FinancialTransactions.InsertOneAsync(session, tx);
            await _db.PaymentOperations.ReplaceOneAsync(session, x => x.Id == operation.Id, operation);
            await _db.WorkroomAuditEvents.InsertOneAsync(session, Audit(clientId, "Client", "Escrow.Funded", "WorkroomMilestone", m.Id, null, m.Amount.ToString("0.00")));
            await session.CommitTransactionAsync();
        }
        catch { await session.AbortTransactionAsync(); await MarkReconciliation(operation); throw; }
        await Notify(e.ProviderId, "Milestone funded", $"{m.Title} is funded and ready to activate.");
        return ServiceProviderResult<WorkroomMilestoneResponse>.Ok(ToMilestone(m, e), "Milestone escrow funded.");
    }

    public async Task<ServiceProviderResult<WorkroomMilestoneResponse>> ActivateMilestoneAsync(string providerId, string milestoneId)
    {
        var (m, e, c) = await MilestoneContext(milestoneId);
        if (m is null || e is null || e.ProviderId != providerId) return ServiceProviderResult<WorkroomMilestoneResponse>.NotFound("Milestone not found.");
        if (c?.Status != ContractStatus.Signed || m.EscrowStatus != WorkroomEscrowStatus.Funded)
            return ServiceProviderResult<WorkroomMilestoneResponse>.Conflict("The milestone cannot begin until contract and escrow are ready.");
        if (!WorkroomStateMachine.CanTransition(m.MilestoneStatus, WorkroomMilestoneStatus.Active))
            return ServiceProviderResult<WorkroomMilestoneResponse>.Conflict("The milestone cannot become active from its current state.");
        if (e.EngagementStatus is EngagementStatus.Paused or EngagementStatus.Disputed)
            return ServiceProviderResult<WorkroomMilestoneResponse>.Conflict("The workroom is paused or disputed.");
        var previousIncomplete = await _db.WorkroomMilestones.Find(x => x.EngagementId == e.Id && x.DisplayOrder < m.DisplayOrder &&
            x.MilestoneStatus != WorkroomMilestoneStatus.Approved && x.MilestoneStatus != WorkroomMilestoneStatus.Paid).AnyAsync();
        if (previousIncomplete && !c.Terms.AllowsParallelMilestones)
            return ServiceProviderResult<WorkroomMilestoneResponse>.Conflict("The previous milestone must be approved first.");
        var now = DateTime.UtcNow; m.StartDate ??= now;
        m.DueDate ??= DeliveryScheduleCalculator.ComputeDueDate(now, c.Terms.DeliveryTimeValue, c.Terms.DeliveryTimeUnit, c.Terms.DeliveryDayType);
        m.OriginalDueDate ??= m.DueDate; m.MilestoneStatus = WorkroomMilestoneStatus.Active; m.UpdatedAt = now;
        var firstActivation = e.StartDate is null; e.StartDate ??= now; e.ExpectedEndDate = m.DueDate;
        e.EngagementStatus = EngagementStatus.Active; e.CurrentMilestoneId = m.Id; e.UpdatedAt = now;
        await _db.WorkroomMilestones.ReplaceOneAsync(x => x.Id == m.Id, m); await _db.WorkroomEngagements.ReplaceOneAsync(x => x.Id == e.Id, e);
        if (firstActivation) await ChangeActiveOrderCount(providerId, 1);
        await AuditAsync(providerId, "ServiceProvider", "Milestone.Activated", "WorkroomMilestone", m.Id, null, m.DueDate?.ToString("O"));
        return ServiceProviderResult<WorkroomMilestoneResponse>.Ok(ToMilestone(m, e), "Milestone activated.");
    }

    public async Task<ServiceProviderResult<WorkroomDetailResponse>> SubmitDeliverableAsync(string providerId, string milestoneId, SubmitDeliverableRequest r)
    {
        var (m, e, _) = await MilestoneContext(milestoneId);
        if (m is null || e is null || e.ProviderId != providerId) return ServiceProviderResult<WorkroomDetailResponse>.NotFound("Milestone not found.");
        if (m.MilestoneStatus is not (WorkroomMilestoneStatus.Active or WorkroomMilestoneStatus.SubmissionDraft or WorkroomMilestoneStatus.RevisionInProgress))
            return ServiceProviderResult<WorkroomDetailResponse>.Conflict("This milestone is not ready for a submission.");
        if (string.IsNullOrWhiteSpace(r.Title) || string.IsNullOrWhiteSpace(r.Description) || string.IsNullOrWhiteSpace(r.ClientInstructions) ||
            (r.FileIds.Count == 0 && r.ExternalLinks.Count == 0))
            return ServiceProviderResult<WorkroomDetailResponse>.Conflict("Title, description, client instructions, and at least one ready file or link are required.");
        if (!r.AllDeliverablesIncluded || !r.FilesReviewed || !r.NoUnrelatedPrivateInfo || !r.ReadyForReview)
            return ServiceProviderResult<WorkroomDetailResponse>.Conflict("All delivery confirmations are required.");
        if (r.FileIds.Count > 0)
        {
            var ready = await _db.WorkroomFiles.Find(x => r.FileIds.Contains(x.Id) && x.EngagementId == e.Id && x.Status == WorkroomFileStatus.Ready).ToListAsync();
            if (ready.Count != r.FileIds.Distinct().Count()) return ServiceProviderResult<WorkroomDetailResponse>.Conflict("Every submitted file must be scanned and ready.");
        }
        var previous = await _db.Deliverables.Find(x => x.MilestoneId == m.Id).SortByDescending(x => x.SubmittedAt).FirstOrDefaultAsync();
        var version = NextVersion(previous?.Version, r.MajorScopeVersion);
        if (previous is not null)
        {
            previous.DeliverableStatus = DeliverableStatus.Superseded;
            await _db.Deliverables.ReplaceOneAsync(x => x.Id == previous.Id, previous);
        }
        var now = DateTime.UtcNow;
        var targetStatus=previous is null?WorkroomMilestoneStatus.ClientReviewing:WorkroomMilestoneStatus.Resubmitted;
        if(!WorkroomStateMachine.CanTransition(m.MilestoneStatus,targetStatus))return ServiceProviderResult<WorkroomDetailResponse>.Conflict("The delivery transition is not allowed.");
        var d = new Deliverable { MilestoneId=m.Id, ProviderId=providerId, Title=r.Title.Trim(), Description=r.Description.Trim(),
            Version=version, FileIds=r.FileIds.Distinct().ToList(), ExternalLinks=r.ExternalLinks.Where(x => !string.IsNullOrWhiteSpace(x)).Distinct().ToList(),
            SubmissionMessage=r.SubmissionMessage.Trim(), ClientInstructions=r.ClientInstructions.Trim(), CompletionConfirmed=true,
            SubmittedAt=now, DeliverableStatus=DeliverableStatus.Locked };
        await _db.Deliverables.InsertOneAsync(d);
        if(r.FileIds.Count>0)await _db.WorkroomFiles.UpdateManyAsync(x=>r.FileIds.Contains(x.Id)&&x.EngagementId==e.Id,
            Builders<WorkroomFile>.Update.Set(x=>x.Immutable,true));
        if (previous is not null)
        {
            var activeRevision=await _db.RevisionRequests.Find(x=>x.MilestoneId==m.Id&&
                (x.RevisionRequestStatus==RevisionRequestStatus.Submitted||x.RevisionRequestStatus==RevisionRequestStatus.InProgress))
                .SortByDescending(x=>x.CreatedAt).FirstOrDefaultAsync();
            if(activeRevision is not null){activeRevision.RevisionRequestStatus=RevisionRequestStatus.Resolved;await _db.RevisionRequests.ReplaceOneAsync(x=>x.Id==activeRevision.Id,activeRevision);}
        }
        m.SubmittedAt = now; m.ReviewWindowEndsAt = now.Add(ClientReviewWindow); m.AutoReleaseAt = now.Add(AutoReleaseWindow);
        m.MilestoneStatus = targetStatus; m.UpdatedAt = now;
        e.EngagementStatus = EngagementStatus.MilestoneReview; e.UpdatedAt = now;
        await _db.WorkroomMilestones.ReplaceOneAsync(x => x.Id == m.Id, m); await _db.WorkroomEngagements.ReplaceOneAsync(x => x.Id == e.Id, e);
        await AuditAsync(providerId, "ServiceProvider", "Deliverable.Submitted", "Deliverable", d.Id, previous?.Version, version);
        await Notify(e.ClientId, "Deliverable submitted", $"{m.Title} version {version} is ready for review.");
        return ServiceProviderResult<WorkroomDetailResponse>.Ok(await Detail(e, providerId), "Deliverable submitted.");
    }

    public async Task<ServiceProviderResult<WorkroomDetailResponse>> RequestRevisionAsync(string clientId, string milestoneId, CreateRevisionRequest r)
    {
        var (m, e, _) = await MilestoneContext(milestoneId);
        if (m is null || e is null || e.ClientId != clientId) return ServiceProviderResult<WorkroomDetailResponse>.NotFound("Milestone not found.");
        if (m.MilestoneStatus is not (WorkroomMilestoneStatus.ClientReviewing or WorkroomMilestoneStatus.Resubmitted))
            return ServiceProviderResult<WorkroomDetailResponse>.Conflict("The milestone is not in client review.");
        if(!WorkroomStateMachine.CanTransition(m.MilestoneStatus,WorkroomMilestoneStatus.RevisionRequested))
            return ServiceProviderResult<WorkroomDetailResponse>.Conflict("A revision cannot be requested from the current state.");
        if (!r.ConsolidatedFeedbackConfirmed || r.RequestedChanges.Count == 0)
            return ServiceProviderResult<WorkroomDetailResponse>.Conflict("Submit one consolidated feedback round with at least one requested change.");
        if (!Enum.TryParse<RevisionScopeClassification>(r.ScopeClassification, true, out var scope))
            return ServiceProviderResult<WorkroomDetailResponse>.Conflict("Select a valid manual scope classification.");
        var d = await _db.Deliverables.Find(x => x.MilestoneId == m.Id).SortByDescending(x => x.SubmittedAt).FirstOrDefaultAsync();
        if (d is null) return ServiceProviderResult<WorkroomDetailResponse>.Conflict("No submitted deliverable exists.");
        if (scope == RevisionScopeClassification.WithinScope)
        {
            if (!RevisionCalculator.HasRemaining(m.UnlimitedRevisions, m.IncludedRevisionCount, m.PurchasedAdditionalRevisions, m.UsedRevisionCount))
                return ServiceProviderResult<WorkroomDetailResponse>.Conflict("The included revision allowance is exhausted; use an explicit paid change request.");
            m.UsedRevisionCount++;
        }
        var rr = new RevisionRequest { MilestoneId=m.Id, DeliverableId=d.Id, RequestedBy=clientId,
            Description=r.Description.Trim(), RequestedChanges=r.RequestedChanges.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).ToList(),
            DueDate=r.DueDate, ScopeClassification=scope, FeedbackCollectionStatus=FeedbackCollectionStatus.Locked,
            RevisionRequestStatus=RevisionRequestStatus.Submitted };
        await _db.RevisionRequests.InsertOneAsync(rr);
        m.MilestoneStatus = WorkroomMilestoneStatus.RevisionRequested; m.UpdatedAt = DateTime.UtcNow;
        e.EngagementStatus = EngagementStatus.RevisionInProgress; e.UpdatedAt = m.UpdatedAt;
        await _db.WorkroomMilestones.ReplaceOneAsync(x => x.Id == m.Id, m); await _db.WorkroomEngagements.ReplaceOneAsync(x => x.Id == e.Id, e);
        await AuditAsync(clientId, "Client", "Revision.Requested", "RevisionRequest", rr.Id, null, scope.ToString());
        await Notify(e.ProviderId, "Revision requested", $"Consolidated feedback is ready for {m.Title}.");
        return ServiceProviderResult<WorkroomDetailResponse>.Ok(await Detail(e, clientId), "Revision requested.");
    }

    public Task<ServiceProviderResult<WorkroomDetailResponse>> ApproveMilestoneAsync(string clientId, string milestoneId) => ReleaseMilestoneAsync(clientId, milestoneId, false);

    public async Task<ServiceProviderResult<WorkroomDetailResponse>> OpenDisputeAsync(string actorId, string milestoneId, string reason)
    {
        var (m, e, _) = await MilestoneContext(milestoneId);
        if (m is null || e is null || (e.ClientId != actorId && e.ProviderId != actorId)) return ServiceProviderResult<WorkroomDetailResponse>.NotFound("Milestone not found.");
        if (m.MilestoneStatus is not (WorkroomMilestoneStatus.Submitted or WorkroomMilestoneStatus.ClientReviewing or WorkroomMilestoneStatus.Resubmitted or WorkroomMilestoneStatus.RevisionRequested))
            return ServiceProviderResult<WorkroomDetailResponse>.Conflict("A dispute cannot be opened in the current state.");
        if(!WorkroomStateMachine.CanTransition(m.MilestoneStatus,WorkroomMilestoneStatus.Disputed))return ServiceProviderResult<WorkroomDetailResponse>.Conflict("A dispute cannot be opened in the current state.");
        var now = DateTime.UtcNow; m.MilestoneStatus = WorkroomMilestoneStatus.Disputed; m.EscrowStatus = WorkroomEscrowStatus.OnHold;
        m.DisputeOpenedAt = now; m.DisputeReviewEndsAt = now.Add(DisputeReviewWindow); m.DisputeOutcome = DisputeOutcome.Open; m.UpdatedAt = now;
        e.EngagementStatus = EngagementStatus.Disputed; e.EscrowStatus = WorkroomEscrowStatus.OnHold; e.UpdatedAt = now;
        await _db.WorkroomMilestones.ReplaceOneAsync(x => x.Id == m.Id, m); await _db.WorkroomEngagements.ReplaceOneAsync(x => x.Id == e.Id, e);
        await _db.FinancialTransactions.InsertOneAsync(new FinancialTransaction { EngagementId=e.Id, MilestoneId=m.Id, ProviderId=e.ProviderId, ClientId=e.ClientId,
            GrossAmount=m.Amount, Currency=m.Currency, TransactionType=FinancialTransactionType.DisputeHold, PaymentStatus=PaymentStatus.OnHold,
            IdempotencyKey=$"dispute:{m.Id}", CreatedAt=now });
        await AuditAsync(actorId, actorId == e.ProviderId ? "ServiceProvider" : "Client", "Dispute.Opened", "WorkroomMilestone", m.Id, null, reason);
        return ServiceProviderResult<WorkroomDetailResponse>.Ok(await Detail(e, actorId), "Dispute opened for five-day support review.");
    }

    public async Task<ServiceProviderResult<WorkroomEngagementResponse>> PauseEngagementAsync(string actorId, string engagementId, string reason)
    {
        var e=await Participant(actorId,engagementId); if(e is null)return ServiceProviderResult<WorkroomEngagementResponse>.NotFound("Workroom not found.");
        if(e.EngagementStatus is EngagementStatus.Completed or EngagementStatus.Archived or EngagementStatus.Cancelled)
            return ServiceProviderResult<WorkroomEngagementResponse>.Conflict("A closed workroom cannot be paused.");
        if(e.EngagementStatus==EngagementStatus.Paused)return ServiceProviderResult<WorkroomEngagementResponse>.Ok(e.ToResponse());
        var before=e.EngagementStatus.ToString(); e.EngagementStatus=EngagementStatus.Paused;e.PausedAt=DateTime.UtcNow;e.UpdatedAt=e.PausedAt.Value;
        await _db.WorkroomEngagements.ReplaceOneAsync(x=>x.Id==e.Id,e);await AuditAsync(actorId,actorId==e.ProviderId?"ServiceProvider":"Client","Engagement.Paused","WorkroomEngagement",e.Id,before,reason);
        return ServiceProviderResult<WorkroomEngagementResponse>.Ok(e.ToResponse(),"Workroom paused; deadline clocks are frozen.");
    }

    public async Task<ServiceProviderResult<WorkroomEngagementResponse>> ResumeEngagementAsync(string actorId, string engagementId)
    {
        var e=await Participant(actorId,engagementId);if(e is null)return ServiceProviderResult<WorkroomEngagementResponse>.NotFound("Workroom not found.");
        if(e.EngagementStatus!=EngagementStatus.Paused||!e.PausedAt.HasValue)return ServiceProviderResult<WorkroomEngagementResponse>.Conflict("The workroom is not paused.");
        var now=DateTime.UtcNow;var frozen=now-e.PausedAt.Value;var milestones=await _db.WorkroomMilestones.Find(x=>x.EngagementId==e.Id&&x.DueDate!=null&&
            x.MilestoneStatus!=WorkroomMilestoneStatus.Paid&&x.MilestoneStatus!=WorkroomMilestoneStatus.Cancelled).ToListAsync();
        foreach(var m in milestones){m.DueDate=m.DueDate!.Value.Add(frozen);m.UpdatedAt=now;}
        e.AccumulatedPausedMinutes+=(int)Math.Ceiling(frozen.TotalMinutes);e.PausedAt=null;e.EngagementStatus=EngagementStatus.Active;e.UpdatedAt=now;
        using var session=await _mongo.StartSessionAsync();session.StartTransaction();try{foreach(var m in milestones)await _db.WorkroomMilestones.ReplaceOneAsync(session,x=>x.Id==m.Id,m);await _db.WorkroomEngagements.ReplaceOneAsync(session,x=>x.Id==e.Id,e);await _db.WorkroomAuditEvents.InsertOneAsync(session,Audit(actorId,actorId==e.ProviderId?"ServiceProvider":"Client","Engagement.Resumed","WorkroomEngagement",e.Id,"Paused",$"Deadlines shifted {frozen}"));await session.CommitTransactionAsync();}catch{await session.AbortTransactionAsync();throw;}
        return ServiceProviderResult<WorkroomEngagementResponse>.Ok(e.ToResponse(),"Workroom resumed and active deadlines shifted by the frozen duration.");
    }

    public async Task<ServiceProviderResult<WorkroomMilestoneResponse>> RequestExtensionAsync(string providerId,string milestoneId,int days,string reason)
    {
        var(m,e,_)=await MilestoneContext(milestoneId);if(m is null||e is null||e.ProviderId!=providerId)return ServiceProviderResult<WorkroomMilestoneResponse>.NotFound("Milestone not found.");
        if(m.MilestoneStatus!=WorkroomMilestoneStatus.Active||days<1)return ServiceProviderResult<WorkroomMilestoneResponse>.Conflict("Only an active milestone can request a positive extension.");
        m.ExtensionRequestedAt=DateTime.UtcNow;m.UpdatedAt=m.ExtensionRequestedAt.Value;await _db.WorkroomMilestones.ReplaceOneAsync(x=>x.Id==m.Id,m);
        await AuditAsync(providerId,"ServiceProvider","Extension.Requested","WorkroomMilestone",m.Id,null,$"{days} days: {reason}");await Notify(e.ClientId,"Deadline extension requested",$"{m.Title}: {days} day(s). No deadline changed yet.");
        return ServiceProviderResult<WorkroomMilestoneResponse>.Ok(ToMilestone(m,e),"Extension requested; the due date is unchanged until client approval.");
    }

    public async Task<ServiceProviderResult<WorkroomMilestoneResponse>> DecideExtensionAsync(string clientId,string milestoneId,bool approve,int days,string reason)
    {
        var(m,e,c)=await MilestoneContext(milestoneId);if(m is null||e is null||e.ClientId!=clientId)return ServiceProviderResult<WorkroomMilestoneResponse>.NotFound("Milestone not found.");
        if(!m.ExtensionRequestedAt.HasValue||m.DueDate is null)return ServiceProviderResult<WorkroomMilestoneResponse>.Conflict("No extension is awaiting a decision.");
        if(approve){if(days<1)return ServiceProviderResult<WorkroomMilestoneResponse>.Conflict("Approved extension days must be positive.");m.DueDate=DeliveryScheduleCalculator.ComputeDueDate(m.DueDate.Value,0,DeliveryTimeUnit.Days,c?.Terms.DeliveryDayType??DeliveryDayType.CalendarDays,extensionDays:days);m.ApprovedExtensionDays+=days;}
        m.ExtensionRequestedAt=null;m.UpdatedAt=DateTime.UtcNow;await _db.WorkroomMilestones.ReplaceOneAsync(x=>x.Id==m.Id,m);
        await AuditAsync(clientId,"Client",approve?"Extension.Approved":"Extension.Declined","WorkroomMilestone",m.Id,null,reason);await Notify(e.ProviderId,approve?"Extension approved":"Extension declined",approve?$"New due date: {m.DueDate:yyyy-MM-dd}":"The original due date remains in effect.");
        return ServiceProviderResult<WorkroomMilestoneResponse>.Ok(ToMilestone(m,e),approve?"Extension approved.":"Extension declined; due date preserved.");
    }

    public async Task<ServiceProviderResult<WorkroomDetailResponse>> StartRevisionAsync(string providerId,string revisionId)
    {
        var rr=await _db.RevisionRequests.Find(x=>x.Id==revisionId).FirstOrDefaultAsync();if(rr is null)return ServiceProviderResult<WorkroomDetailResponse>.NotFound("Revision request not found.");
        var(m,e,_)=await MilestoneContext(rr.MilestoneId);if(m is null||e is null||e.ProviderId!=providerId)return ServiceProviderResult<WorkroomDetailResponse>.NotFound("Revision request not found.");
        if(rr.RevisionRequestStatus!=RevisionRequestStatus.Submitted)return ServiceProviderResult<WorkroomDetailResponse>.Conflict("Revision work cannot start in the current state.");
        rr.RevisionRequestStatus=RevisionRequestStatus.InProgress;m.MilestoneStatus=WorkroomMilestoneStatus.RevisionInProgress;m.UpdatedAt=DateTime.UtcNow;
        await _db.RevisionRequests.ReplaceOneAsync(x=>x.Id==rr.Id,rr);await _db.WorkroomMilestones.ReplaceOneAsync(x=>x.Id==m.Id,m);return ServiceProviderResult<WorkroomDetailResponse>.Ok(await Detail(e,providerId),"Revision work started.");
    }

    public async Task<ServiceProviderResult<WorkroomDetailResponse>> ResolveDisputeAsync(string adminId,string milestoneId,string outcome,string reason)
    {
        if(!Enum.TryParse<DisputeOutcome>(outcome,true,out var resolved)||resolved==DisputeOutcome.Open)return ServiceProviderResult<WorkroomDetailResponse>.Conflict("Select ProviderFavored, ClientFavored, or Split.");
        var(m,e,_)=await MilestoneContext(milestoneId);if(m is null||e is null)return ServiceProviderResult<WorkroomDetailResponse>.NotFound("Milestone not found.");
        if(m.MilestoneStatus!=WorkroomMilestoneStatus.Disputed||m.DisputeOutcome!=DisputeOutcome.Open)return ServiceProviderResult<WorkroomDetailResponse>.Conflict("No open dispute exists.");
        if(resolved==DisputeOutcome.Split)return ServiceProviderResult<WorkroomDetailResponse>.Conflict("Split settlements require an explicit contract amendment and are not auto-priced.");
        m.DisputeOutcome=resolved;m.UpdatedAt=DateTime.UtcNow;
        if(resolved==DisputeOutcome.ProviderFavored){m.MilestoneStatus=WorkroomMilestoneStatus.ClientReviewing;m.EscrowStatus=WorkroomEscrowStatus.Funded;e.EngagementStatus=EngagementStatus.MilestoneReview;e.EscrowStatus=WorkroomEscrowStatus.Funded;}
        else
        {
            var key=$"refund:{m.Id}";var op=await BeginOperation(key,PaymentOperationType.RefundEscrow,e.Id,m.Id,null,m.Amount,m.Currency);var gateway=await _gateway.RefundEscrowAsync(key,$"stub_escrow_escrow:{m.Id}",m.Amount,m.Currency);
            if(!gateway.Success){await FailOperation(op,gateway.Error);return ServiceProviderResult<WorkroomDetailResponse>.Conflict("Refund failed; dispute remains on hold.");}
            await GatewaySucceeded(op,gateway.GatewayReference);m.MilestoneStatus=WorkroomMilestoneStatus.Cancelled;m.EscrowStatus=WorkroomEscrowStatus.Refunded;e.EngagementStatus=EngagementStatus.Active;e.EscrowStatus=WorkroomEscrowStatus.Refunded;
            await _db.FinancialTransactions.InsertOneAsync(new FinancialTransaction{EngagementId=e.Id,MilestoneId=m.Id,ProviderId=e.ProviderId,ClientId=e.ClientId,GrossAmount=m.Amount,Currency=m.Currency,TransactionType=FinancialTransactionType.Refund,PaymentStatus=PaymentStatus.Refunded,IdempotencyKey=key,CreatedAt=DateTime.UtcNow});op.Status=PaymentOperationStatus.Completed;op.UpdatedAt=DateTime.UtcNow;await _db.PaymentOperations.ReplaceOneAsync(x=>x.Id==op.Id,op);
        }
        e.UpdatedAt=m.UpdatedAt;await _db.WorkroomMilestones.ReplaceOneAsync(x=>x.Id==m.Id,m);await _db.WorkroomEngagements.ReplaceOneAsync(x=>x.Id==e.Id,e);await AuditAsync(adminId,"Admin","Dispute.Resolved","WorkroomMilestone",m.Id,"Open",$"{resolved}: {reason}");await RefreshTrust(e.ProviderId);
        return ServiceProviderResult<WorkroomDetailResponse>.Ok(await Detail(e,adminId),"Dispute resolved and trust signals recalculated.");
    }

    public async Task<ServiceProviderResult<WorkroomEngagementResponse>> CompleteEngagementAsync(string actorId, string engagementId)
    {
        var e = await Participant(actorId, engagementId);
        if (e is null) return ServiceProviderResult<WorkroomEngagementResponse>.NotFound("Workroom not found.");
        var milestones = await _db.WorkroomMilestones.Find(x => x.EngagementId == e.Id).ToListAsync();
        if (milestones.Count == 0 || milestones.Any(x => x.MilestoneStatus != WorkroomMilestoneStatus.Paid) ||
            milestones.Any(x => x.DisputeOutcome == DisputeOutcome.Open))
            return ServiceProviderResult<WorkroomEngagementResponse>.Conflict("All milestones and payment releases must be resolved before completion.");
        if(!WorkroomStateMachine.CanTransition(e.EngagementStatus,EngagementStatus.Completed))return ServiceProviderResult<WorkroomEngagementResponse>.Conflict("The workroom cannot complete from its current state.");
        var openRevisions = await _db.RevisionRequests.Find(x => milestones.Select(m => m.Id).Contains(x.MilestoneId) &&
            x.RevisionRequestStatus != RevisionRequestStatus.Resolved && x.RevisionRequestStatus != RevisionRequestStatus.Cancelled).AnyAsync();
        if (openRevisions) return ServiceProviderResult<WorkroomEngagementResponse>.Conflict("The project cannot be completed while a revision is open.");
        e.EngagementStatus=EngagementStatus.Completed; e.CompletionPercentage=100; e.ActualEndDate=e.UpdatedAt=DateTime.UtcNow;
        await _db.WorkroomEngagements.ReplaceOneAsync(x => x.Id == e.Id, e); await ChangeActiveOrderCount(e.ProviderId, -1);
        await AuditAsync(actorId, actorId == e.ProviderId ? "ServiceProvider" : "Client", "Engagement.Completed", "WorkroomEngagement", e.Id, null, "Completed");
        await CreateRepeatCouponIfEligible(e.ProviderId, e.ClientId);
        await RefreshTrust(e.ProviderId);
        await Notify(e.ClientId, "Project completed", $"Review {e.Title} and share your experience.");
        return ServiceProviderResult<WorkroomEngagementResponse>.Ok(e.ToResponse(), "Project completed.");
    }

    public async Task<ServiceProviderResult<Review>> SubmitReviewAsync(string clientId, string engagementId, CreateReviewRequest r)
    {
        var e = await _db.WorkroomEngagements.Find(x => x.Id == engagementId && x.ClientId == clientId).FirstOrDefaultAsync();
        if (e is null) return ServiceProviderResult<Review>.NotFound("Completed workroom not found.");
        if (e.EngagementStatus != EngagementStatus.Completed && e.EngagementStatus != EngagementStatus.Archived)
            return ServiceProviderResult<Review>.Conflict("A review is available after project completion.");
        if (await _db.Reviews.Find(x => x.EngagementId == e.Id).AnyAsync()) return ServiceProviderResult<Review>.Conflict("A review already exists.");
        var review = new Review { EngagementId=e.Id, ClientId=clientId, ProviderId=e.ProviderId, OverallRating=r.OverallRating,
            QualityRating=r.QualityRating, CommunicationRating=r.CommunicationRating, DeliveryRating=r.DeliveryRating,
            ProfessionalismRating=r.ProfessionalismRating, ValueRating=r.ValueRating, WrittenReview=r.WrittenReview.Trim() };
        await _db.Reviews.InsertOneAsync(review); await AuditAsync(clientId, "Client", "Review.Submitted", "Review", review.Id, null, review.OverallRating.ToString());
        await RefreshTrust(e.ProviderId); await Notify(e.ProviderId, "New verified review", $"A client reviewed {e.Title}.");
        return ServiceProviderResult<Review>.Ok(review, "Review submitted.");
    }

    public async Task<ServiceProviderResult<Review>> RespondToReviewAsync(string providerId, string reviewId, string response)
    {
        var review = await _db.Reviews.Find(x => x.Id == reviewId && x.ProviderId == providerId).FirstOrDefaultAsync();
        if (review is null) return ServiceProviderResult<Review>.NotFound("Review not found.");
        if (!string.IsNullOrWhiteSpace(review.ProviderResponse)) return ServiceProviderResult<Review>.Conflict("A provider response is already recorded.");
        review.ProviderResponse=response.Trim(); await _db.Reviews.ReplaceOneAsync(x => x.Id == review.Id, review);
        return ServiceProviderResult<Review>.Ok(review, "Response published.");
    }

    public async Task<ServiceProviderResult<WorkroomFile>> UploadFileAsync(string actorId, string engagementId, string? milestoneId, IFormFile file, bool providerPrivate)
    {
        var e = await Participant(actorId, engagementId);
        if (e is null) return ServiceProviderResult<WorkroomFile>.NotFound("Workroom not found.");
        if (providerPrivate && actorId != e.ProviderId) return ServiceProviderResult<WorkroomFile>.Conflict("Only the provider can create private files.");
        var record = new WorkroomFile { EngagementId=e.Id, MilestoneId=milestoneId, UploadedBy=actorId, OriginalName=Path.GetFileName(file.FileName),
            ContentType=file.ContentType, SizeBytes=file.Length, Status=WorkroomFileStatus.Scanning, ProviderPrivate=providerPrivate };
        await _db.WorkroomFiles.InsertOneAsync(record);
        var scan = await _scanner.ScanAsync(file);
        if (!scan.Passed)
        {
            record.Status=WorkroomFileStatus.Restricted; await _db.WorkroomFiles.ReplaceOneAsync(x => x.Id == record.Id, record);
            return ServiceProviderResult<WorkroomFile>.Conflict(scan.Error ?? "File security check failed.");
        }
        record.StoragePath=await _files.SaveFileAsync(file, "documents"); record.Status=WorkroomFileStatus.Ready;
        await _db.WorkroomFiles.ReplaceOneAsync(x => x.Id == record.Id, record);
        return ServiceProviderResult<WorkroomFile>.Ok(record, "File scanned and ready.");
    }

    public async Task<ServiceProviderResult<WorkroomTask>> CreateTaskAsync(string actorId, string engagementId, CreateTaskRequest r)
    {
        var e = await Participant(actorId, engagementId); if (e is null) return ServiceProviderResult<WorkroomTask>.NotFound("Workroom not found.");
        if (!Enum.TryParse<WorkroomTaskVisibility>(r.Visibility, true, out var visibility)) return ServiceProviderResult<WorkroomTask>.Conflict("Invalid task visibility.");
        if (visibility == WorkroomTaskVisibility.ProviderPrivate && actorId != e.ProviderId) return ServiceProviderResult<WorkroomTask>.Conflict("Only providers can create private tasks.");
        var task = new WorkroomTask { EngagementId=e.Id, MilestoneId=r.MilestoneId, Title=r.Title.Trim(), Description=r.Description.Trim(),
            AssigneeId=string.IsNullOrWhiteSpace(r.AssigneeId) ? actorId : r.AssigneeId, DueDate=r.DueDate, Visibility=visibility };
        await _db.WorkroomTasks.InsertOneAsync(task); return ServiceProviderResult<WorkroomTask>.Ok(task, "Task created.");
    }

    public async Task<ServiceProviderResult<ClientInputRequest>> RequestClientInputAsync(string providerId, string engagementId, CreateClientInputRequest r)
    {
        var e = await _db.WorkroomEngagements.Find(x => x.Id == engagementId && x.ProviderId == providerId).FirstOrDefaultAsync();
        if (e is null) return ServiceProviderResult<ClientInputRequest>.NotFound("Workroom not found.");
        if (!Enum.TryParse<ClientInputType>(r.Type, true, out var type)) return ServiceProviderResult<ClientInputRequest>.Conflict("Invalid input type.");
        var item = new ClientInputRequest { EngagementId=e.Id, MilestoneId=r.MilestoneId, Type=type, Description=r.Description.Trim(), DueDate=r.DueDate, DeliveryImpact=r.DeliveryImpact.Trim() };
        await _db.ClientInputRequests.InsertOneAsync(item); e.EngagementStatus=EngagementStatus.ClientInputRequired; e.UpdatedAt=DateTime.UtcNow;
        await _db.WorkroomEngagements.ReplaceOneAsync(x => x.Id == e.Id, e); await Notify(e.ClientId, "Client input required", item.Description);
        return ServiceProviderResult<ClientInputRequest>.Ok(item, "Client input requested; deadlines were not changed.");
    }

    public async Task<ServiceProviderResult<HourlyTimeEntry>> AddTimeEntryAsync(string providerId, string engagementId, CreateTimeEntryRequest r)
    {
        var e = await _db.WorkroomEngagements.Find(x => x.Id == engagementId && x.ProviderId == providerId).FirstOrDefaultAsync();
        if (e is null) return ServiceProviderResult<HourlyTimeEntry>.NotFound("Workroom not found.");
        var c = await _db.Contracts.Find(x => x.Id == e.ContractId).FirstOrDefaultAsync();
        if (c?.Terms.PricingType != PricingModel.Hourly) return ServiceProviderResult<HourlyTimeEntry>.Conflict("Time entries are only available for hourly contracts.");
        if (r.EndedAt <= r.StartedAt || r.EndedAt > DateTime.UtcNow.AddMinutes(1)) return ServiceProviderResult<HourlyTimeEntry>.Conflict("Enter a valid completed time range.");
        var entry = new HourlyTimeEntry { EngagementId=e.Id, ProviderId=providerId, StartedAt=r.StartedAt, EndedAt=r.EndedAt, Description=r.Description.Trim() };
        await _db.HourlyTimeEntries.InsertOneAsync(entry); return ServiceProviderResult<HourlyTimeEntry>.Ok(entry, "Time entry recorded for invoice review.");
    }

    public async Task<ServiceProviderResult<ProviderFinancialSummaryResponse>> GetFinancialSummaryAsync(string providerId, string? currency)
    {
        var selected = NormalizeCurrency(currency);
        var tx = await _db.FinancialTransactions.Find(x => x.ProviderId == providerId && x.Currency == selected).SortByDescending(x => x.CreatedAt).ToListAsync();
        var payouts = await _db.PayoutRequests.Find(x => x.ProviderId == providerId && x.Currency == selected).SortByDescending(x => x.CreatedAt).ToListAsync();
        var invoices = await _db.Invoices.Find(x => x.ProviderId == providerId && x.Currency == selected).SortByDescending(x => x.CreatedAt).ToListAsync();
        var transactionCurrencies = await _db.FinancialTransactions.Find(x => x.ProviderId == providerId).Project(x => x.Currency).ToListAsync();
        var payoutCurrencies = await _db.PayoutRequests.Find(x => x.ProviderId == providerId).Project(x => x.Currency).ToListAsync();
        var invoiceCurrencies = await _db.Invoices.Find(x => x.ProviderId == providerId).Project(x => x.Currency).ToListAsync();
        var milestones = await _db.WorkroomMilestones.Find(x => x.Currency == selected).ToListAsync();
        var providerEngagements = await _db.WorkroomEngagements.Find(x => x.ProviderId == providerId).ToListAsync();
        var engagementIds = providerEngagements.Select(x => x.Id).ToHashSet();
        milestones = milestones.Where(x => engagementIds.Contains(x.EngagementId)).ToList();
        var released = tx.Where(x => x.TransactionType == FinancialTransactionType.PaymentReleased && x.PaymentStatus == PaymentStatus.Completed).Sum(x => x.NetAmount);
        var releasedTransactions = tx.Where(x => x.TransactionType == FinancialTransactionType.PaymentReleased && x.PaymentStatus == PaymentStatus.Completed).ToList();
        var completedPayout = payouts.Where(x => x.Status == PayoutStatus.Completed).Sum(x => x.Amount);
        var activePayout = payouts.Where(x => x.Status is PayoutStatus.Requested or PayoutStatus.UnderReview or PayoutStatus.Processing or PayoutStatus.OnHold).Sum(x => x.Amount);
        var adjustments = tx.Where(x => x.TransactionType == FinancialTransactionType.Adjustment && x.PaymentStatus == PaymentStatus.Completed).Sum(x => x.NetAmount);
        var user = await _users.FindByIdAsync(providerId);
        var availableCurrencies = providerEngagements.Select(x => x.Currency)
            .Concat(transactionCurrencies).Concat(payoutCurrencies).Concat(invoiceCurrencies)
            .Append(selected).Where(x => !string.IsNullOrWhiteSpace(x)).Select(NormalizeCurrency)
            .Distinct(StringComparer.OrdinalIgnoreCase).OrderBy(x => x).ToList();
        return ServiceProviderResult<ProviderFinancialSummaryResponse>.Ok(new ProviderFinancialSummaryResponse
        {
            Currency=selected,
            WorkInProgress=milestones.Where(x => x.EscrowStatus == WorkroomEscrowStatus.Funded && x.MilestoneStatus is WorkroomMilestoneStatus.Funded or WorkroomMilestoneStatus.Active or WorkroomMilestoneStatus.SubmissionDraft).Sum(x => x.Amount),
            InReview=milestones.Where(x => x.MilestoneStatus is WorkroomMilestoneStatus.Submitted or WorkroomMilestoneStatus.ClientReviewing or WorkroomMilestoneStatus.Resubmitted).Sum(x => x.Amount),
            Pending=milestones.Where(x => x.MilestoneStatus is WorkroomMilestoneStatus.Approved or WorkroomMilestoneStatus.PaymentProcessing).Sum(x => x.Amount),
            Available=Math.Max(0, released-completedPayout-activePayout+adjustments), Withdrawn=completedPayout,
            OnHold=milestones.Where(x => x.EscrowStatus == WorkroomEscrowStatus.OnHold).Sum(x => x.Amount),
            ProtectedEscrow=milestones.Where(x => x.EscrowStatus == WorkroomEscrowStatus.Funded && x.MilestoneStatus != WorkroomMilestoneStatus.Approved && x.MilestoneStatus != WorkroomMilestoneStatus.Paid).Sum(x => x.Amount),
            GrossEarnings=releasedTransactions.Sum(x => x.GrossAmount), CommissionPaid=releasedTransactions.Sum(x => x.CommissionAmount),
            NetEarnings=releasedTransactions.Sum(x => x.NetAmount), AvailableCurrencies=availableCurrencies,
            Transactions=tx, Payouts=payouts, Invoices=invoices, Settings=await GetFinancialSettingsAsync(providerId, user),
        });
    }

    public async Task<ServiceProviderResult<StatementResponse>> GetStatementAsync(string providerId, DateTime from, DateTime to, string? currency)
    {
        if (to <= from) return ServiceProviderResult<StatementResponse>.Conflict("Statement end must be after start.");
        var selected=NormalizeCurrency(currency);
        var before = await _db.FinancialTransactions.Find(x => x.ProviderId == providerId && x.Currency == selected && x.CreatedAt < from).ToListAsync();
        var rows = await _db.FinancialTransactions.Find(x => x.ProviderId == providerId && x.Currency == selected && x.CreatedAt >= from && x.CreatedAt < to).SortBy(x => x.CreatedAt).ToListAsync();
        decimal NetMovement(IEnumerable<FinancialTransaction> list) => list.Sum(x => x.TransactionType switch
        { FinancialTransactionType.PaymentReleased => x.NetAmount, FinancialTransactionType.PayoutCompleted => -x.GrossAmount, FinancialTransactionType.Adjustment => x.NetAmount, _ => 0 });
        var opening=NetMovement(before); var closing=opening+NetMovement(rows);
        return ServiceProviderResult<StatementResponse>.Ok(new StatementResponse { From=from, To=to, OpeningBalance=opening,
            Gross=rows.Where(x => x.TransactionType == FinancialTransactionType.PaymentReleased).Sum(x => x.GrossAmount),
            Commission=rows.Where(x => x.TransactionType == FinancialTransactionType.PaymentReleased).Sum(x => x.CommissionAmount),
            Adjustments=rows.Where(x => x.TransactionType == FinancialTransactionType.Adjustment).Sum(x => x.NetAmount),
            Payouts=rows.Where(x => x.TransactionType == FinancialTransactionType.PayoutCompleted).Sum(x => x.GrossAmount), ClosingBalance=closing, Transactions=rows });
    }

    public async Task<ServiceProviderResult<ProviderFinancialSettings>> AddPayoutMethodAsync(string providerId, AddPayoutMethodRequest r)
    {
        var user=await _users.FindByIdAsync(providerId); if (user is null) return ServiceProviderResult<ProviderFinancialSettings>.NotFound("Provider not found.");
        if (!Enum.TryParse<PayoutRail>(r.Rail, true, out var rail)) return ServiceProviderResult<ProviderFinancialSettings>.Conflict("Invalid payout rail.");
        var (_, record)=await _migrator.EnsureMigratedAsync(user);
        var settings=record.FinancialSettings ??= new();
        var method=new MaskedPayoutMethod { Rail=rail, DisplayName=r.DisplayName.Trim(), MaskedDescriptor=Mask(r.MaskedDescriptor), Verified=true };
        settings.PayoutMethods.Add(method); settings.DefaultPayoutMethodId ??= method.Id;
        record.UpdatedAt=DateTime.UtcNow;
        if (!await _spStore.UpsertAsync(record)) return ServiceProviderResult<ProviderFinancialSettings>.Conflict("The payout method could not be saved.");
        return ServiceProviderResult<ProviderFinancialSettings>.Ok(settings, "STUB payout method verified and saved.");
    }

    public async Task<ServiceProviderResult<ProviderFinancialSettings>> SetDefaultPayoutMethodAsync(string providerId, string payoutMethodId)
    {
        var user=await _users.FindByIdAsync(providerId); if (user is null) return ServiceProviderResult<ProviderFinancialSettings>.NotFound("Provider not found.");
        var (_, record)=await _migrator.EnsureMigratedAsync(user);
        var settings=record.FinancialSettings ??= new();
        if (!settings.PayoutMethods.Any(x => x.Id == payoutMethodId && x.Verified)) return ServiceProviderResult<ProviderFinancialSettings>.NotFound("Verified payout method not found.");
        settings.DefaultPayoutMethodId=payoutMethodId;
        record.UpdatedAt=DateTime.UtcNow;
        if (!await _spStore.UpsertAsync(record)) return ServiceProviderResult<ProviderFinancialSettings>.Conflict("The default payout method could not be saved.");
        return ServiceProviderResult<ProviderFinancialSettings>.Ok(settings, "Default payout method updated for the payment sandbox.");
    }

    public async Task<ServiceProviderResult<ProviderFinancialSettings>> RemovePayoutMethodAsync(string providerId, string payoutMethodId)
    {
        var user=await _users.FindByIdAsync(providerId); if (user is null) return ServiceProviderResult<ProviderFinancialSettings>.NotFound("Provider not found.");
        var (_, record)=await _migrator.EnsureMigratedAsync(user);
        var settings=record.FinancialSettings ??= new();
        var method=settings.PayoutMethods.FirstOrDefault(x => x.Id == payoutMethodId);
        if (method is null) return ServiceProviderResult<ProviderFinancialSettings>.NotFound("Payout method not found.");
        var activePayout=await _db.PayoutRequests.Find(x => x.ProviderId == providerId && x.PayoutMethodId == payoutMethodId &&
            (x.Status == PayoutStatus.Requested || x.Status == PayoutStatus.UnderReview || x.Status == PayoutStatus.Processing || x.Status == PayoutStatus.OnHold)).AnyAsync();
        if (activePayout) return ServiceProviderResult<ProviderFinancialSettings>.Conflict("This payout method is attached to an active payout and cannot be removed.");
        settings.PayoutMethods.Remove(method);
        if (settings.DefaultPayoutMethodId == payoutMethodId) settings.DefaultPayoutMethodId=settings.PayoutMethods.FirstOrDefault(x => x.Verified)?.Id;
        record.UpdatedAt=DateTime.UtcNow;
        if (!await _spStore.UpsertAsync(record)) return ServiceProviderResult<ProviderFinancialSettings>.Conflict("The payout method could not be removed.");
        return ServiceProviderResult<ProviderFinancialSettings>.Ok(settings, "Payout method removed.");
    }

    public async Task<ServiceProviderResult<ProviderFinancialSettings>> UpdateTaxSettingsAsync(string providerId, UpdateTaxSettingsRequest r)
    {
        var user=await _users.FindByIdAsync(providerId); if (user is null) return ServiceProviderResult<ProviderFinancialSettings>.NotFound("Provider not found.");
        var (_, record)=await _migrator.EnsureMigratedAsync(user);
        var settings=record.FinancialSettings ??= new(); settings.Tax=new ProviderTaxSettings
        { LegalName=r.LegalName.Trim(), CountryCode=r.CountryCode.Trim().ToUpperInvariant(), TaxIdentifierMasked=MaskNullable(r.TaxIdentifierMasked), VatRegistered=r.VatRegistered, VatNumberMasked=MaskNullable(r.VatNumberMasked) };
        record.UpdatedAt=DateTime.UtcNow;
        if (!await _spStore.UpsertAsync(record)) return ServiceProviderResult<ProviderFinancialSettings>.Conflict("Tax settings could not be saved.");
        return ServiceProviderResult<ProviderFinancialSettings>.Ok(settings, "Tax and VAT invoice settings updated.");
    }

    /// <summary>Dual-read financial settings: split record first, embedded fallback.</summary>
    private async Task<ProviderFinancialSettings> GetFinancialSettingsAsync(string providerId, ApplicationUser? user)
    {
        var record=await _spStore.GetByUserIdAsync(providerId);
        if (record is not null) return record.FinancialSettings ?? new();
        return user?.ServiceProviderProfile?.FinancialSettings ?? new();
    }

    public async Task<ServiceProviderResult<PayoutRequest>> RequestPayoutAsync(string providerId, CreatePayoutRequest r)
    {
        var summary=await GetFinancialSummaryAsync(providerId, r.Currency); if (summary.Value is null) return ServiceProviderResult<PayoutRequest>.Conflict(summary.Message);
        var user=await _users.FindByIdAsync(providerId);
        var settings=user is null ? null : await GetFinancialSettingsAsync(providerId, user);
        if (settings is null || settings.AccountOnHold) return ServiceProviderResult<PayoutRequest>.Conflict("Account review in progress.");
        var methodId=r.PayoutMethodId ?? settings.DefaultPayoutMethodId; var method=settings.PayoutMethods.FirstOrDefault(x => x.Id == methodId && x.Verified);
        if (method is null) return ServiceProviderResult<PayoutRequest>.Conflict("Payment account not verified.");
        if (r.Amount < settings.MinimumPayoutAmount) return ServiceProviderResult<PayoutRequest>.Conflict("Balance below minimum.");
        if (r.Amount > summary.Value.Available) return ServiceProviderResult<PayoutRequest>.Conflict("The payout amount exceeds your available balance.");
        if (summary.Value.Payouts.Any(x => x.Status is PayoutStatus.Requested or PayoutStatus.UnderReview or PayoutStatus.Processing))
            return ServiceProviderResult<PayoutRequest>.Conflict("Existing payout processing.");
        var payout=new PayoutRequest { ProviderId=providerId, PayoutMethodId=method.Id, Amount=r.Amount, Currency=NormalizeCurrency(r.Currency), Status=PayoutStatus.Processing };
        await _db.PayoutRequests.InsertOneAsync(payout); var key=$"payout:{payout.Id}";
        var op=await BeginOperation(key, PaymentOperationType.CreatePayout, null, null, payout.Id, payout.Amount, payout.Currency);
        var result=await _gateway.CreatePayoutAsync(key, method.Id, payout.Amount, payout.Currency);
        if (!result.Success)
        {
            payout.Status=PayoutStatus.Failed; payout.UpdatedAt=DateTime.UtcNow; await _db.PayoutRequests.ReplaceOneAsync(x => x.Id == payout.Id, payout); await FailOperation(op, result.Error);
            return ServiceProviderResult<PayoutRequest>.Conflict("Payout failed; funds remain available.");
        }
        payout.Status=PayoutStatus.Completed; payout.GatewayReference=result.GatewayReference; payout.CompletedAt=payout.UpdatedAt=DateTime.UtcNow;
        op.Status=PaymentOperationStatus.Completed; op.GatewayReference=result.GatewayReference; op.UpdatedAt=DateTime.UtcNow;
        var payoutTx=new FinancialTransaction { ProviderId=providerId, GrossAmount=payout.Amount, Currency=payout.Currency,
            TransactionType=FinancialTransactionType.PayoutCompleted, PaymentStatus=PaymentStatus.Completed, IdempotencyKey=key, CreatedAt=payout.UpdatedAt, ReleasedAt=payout.CompletedAt };
        using(var session=await _mongo.StartSessionAsync())
        {
            session.StartTransaction();try{await _db.PayoutRequests.ReplaceOneAsync(session,x=>x.Id==payout.Id,payout);await _db.PaymentOperations.ReplaceOneAsync(session,x=>x.Id==op.Id,op);await _db.FinancialTransactions.InsertOneAsync(session,payoutTx);await _db.WorkroomAuditEvents.InsertOneAsync(session,Audit(providerId,"ServiceProvider","Payout.Completed","PayoutRequest",payout.Id,null,payout.Amount.ToString("0.00")));await session.CommitTransactionAsync();}catch{await session.AbortTransactionAsync();await MarkReconciliation(op);throw;}
        }
        return ServiceProviderResult<PayoutRequest>.Ok(payout, "Payout completed by the STUB gateway.");
    }

    private async Task<ServiceProviderResult<WorkroomDetailResponse>> ReleaseMilestoneAsync(string actorId, string milestoneId, bool autoRelease)
    {
        var (m,e,_) = await MilestoneContext(milestoneId);
        if (m is null || e is null || (!autoRelease && e.ClientId != actorId)) return ServiceProviderResult<WorkroomDetailResponse>.NotFound("Milestone not found.");
        if (m.MilestoneStatus == WorkroomMilestoneStatus.Paid) return ServiceProviderResult<WorkroomDetailResponse>.Ok(await Detail(e, actorId));
        if (m.MilestoneStatus is not (WorkroomMilestoneStatus.ClientReviewing or WorkroomMilestoneStatus.Resubmitted))
            return ServiceProviderResult<WorkroomDetailResponse>.Conflict("This milestone is not ready for approval.");
        if(!WorkroomStateMachine.CanTransition(m.MilestoneStatus,WorkroomMilestoneStatus.Paid))return ServiceProviderResult<WorkroomDetailResponse>.Conflict("Payment release is not allowed from the current milestone state.");
        if (m.DisputeOpenedAt.HasValue) return ServiceProviderResult<WorkroomDetailResponse>.Conflict("Payment release is blocked by an active dispute.");
        var key=$"release:{m.Id}"; var op=await BeginOperation(key, PaymentOperationType.ReleaseEscrow, e.Id, m.Id, null, m.Amount, m.Currency);
        var gateway=await _gateway.ReleaseEscrowAsync(key, $"stub_escrow_escrow:{m.Id}", m.Amount, m.Currency);
        if (!gateway.Success) { await FailOperation(op, gateway.Error); return ServiceProviderResult<WorkroomDetailResponse>.Conflict("Payment release failed and no financial state changed."); }
        await GatewaySucceeded(op, gateway.GatewayReference);
        var now=DateTime.UtcNow; var commission=decimal.Round(m.Amount*PlatformCommerceConstants.CommissionRate,2,MidpointRounding.AwayFromZero); var net=m.Amount-commission;
        var transaction=new FinancialTransaction { EngagementId=e.Id, MilestoneId=m.Id, ProviderId=e.ProviderId, ClientId=e.ClientId, GrossAmount=m.Amount,
            Currency=m.Currency, CommissionAmount=commission, NetAmount=net, TransactionType=FinancialTransactionType.PaymentReleased,
            PaymentStatus=PaymentStatus.Completed, IdempotencyKey=key, CreatedAt=now, ReleasedAt=now };
        var provider=await _users.FindByIdAsync(e.ProviderId);
        var invoice=new Invoice { InvoiceNumber=$"MDL-{now:yyyyMMdd}-{m.Id[^6..].ToUpperInvariant()}", ProviderId=e.ProviderId, ClientId=e.ClientId,
            EngagementId=e.Id, MilestoneId=m.Id, GrossAmount=m.Amount, CommissionAmount=commission, NetAmount=net, Currency=m.Currency,
            ApprovalDate=now, ReleaseDate=now, TaxSnapshot=provider?.ServiceProviderProfile?.FinancialSettings?.Tax ?? new(), Status=InvoiceStatus.Issued, CreatedAt=now };
        using var session=await _mongo.StartSessionAsync(); session.StartTransaction();
        try
        {
            m.MilestoneStatus=WorkroomMilestoneStatus.Paid; m.EscrowStatus=WorkroomEscrowStatus.Released; m.ApprovedAt=now; m.UpdatedAt=now;
            var all=await _db.WorkroomMilestones.Find(session,x=>x.EngagementId==e.Id).ToListAsync();
            var paidCount=all.Count(x=>x.Id==m.Id || x.MilestoneStatus==WorkroomMilestoneStatus.Paid); e.CompletionPercentage=Math.Round(100d*paidCount/all.Count,1);
            e.EscrowStatus=WorkroomEscrowStatus.Released; e.EngagementStatus=paidCount==all.Count?EngagementStatus.FinalDelivery:EngagementStatus.ReadyToStart; e.UpdatedAt=now;
            op.Status=PaymentOperationStatus.Completed; op.UpdatedAt=now;
            await _db.WorkroomMilestones.ReplaceOneAsync(session,x=>x.Id==m.Id,m); await _db.WorkroomEngagements.ReplaceOneAsync(session,x=>x.Id==e.Id,e);
            await _db.FinancialTransactions.InsertOneAsync(session,transaction); await _db.Invoices.InsertOneAsync(session,invoice);
            await _db.PaymentOperations.ReplaceOneAsync(session,x=>x.Id==op.Id,op);
            await _db.WorkroomAuditEvents.InsertOneAsync(session,Audit(actorId,autoRelease?"System":"Client",autoRelease?"Milestone.AutoReleased":"Milestone.Approved","WorkroomMilestone",m.Id,null,"Paid"));
            await session.CommitTransactionAsync();
        }
        catch { await session.AbortTransactionAsync(); await MarkReconciliation(op); throw; }
        await RefreshTrust(e.ProviderId); await Notify(e.ProviderId,"Payment released",$"{net:0.00} {m.Currency} is now available after 12% commission.");
        return ServiceProviderResult<WorkroomDetailResponse>.Ok(await Detail(e,actorId),autoRelease?"Milestone auto-released after seven days.":"Milestone approved and payment released.");
    }

    private async Task RefreshTrust(string providerId)
    {
        var completed=await _db.WorkroomEngagements.Find(x=>x.ProviderId==providerId&&
            (x.EngagementStatus==EngagementStatus.Completed||x.EngagementStatus==EngagementStatus.Archived)).ToListAsync();
        var reviews=await _db.Reviews.Find(x=>x.ProviderId==providerId&&x.VerificationStatus==ReviewVerificationStatus.Verified).ToListAsync();
        var satisfaction=reviews.Count==0?(double?)null:reviews.Average(x=>x.OverallRating)*20d;
        var ids=completed.Select(x=>x.Id).ToList(); var milestones=ids.Count==0?new List<WorkroomMilestone>():await _db.WorkroomMilestones.Find(x=>ids.Contains(x.EngagementId)&&x.SubmittedAt!=null&&x.DueDate!=null).ToListAsync();
        var onTime=_relationships.CalculateOnTimeRate(milestones);
        var repeat=_relationships.Calculate(completed).RepeatClientRate;
        var allProviderIds=(await _db.WorkroomEngagements.Find(x=>x.ProviderId==providerId).Project(x=>x.Id).ToListAsync());
        var adverse=allProviderIds.Count==0?0:(int)await _db.WorkroomMilestones.CountDocumentsAsync(x=>allProviderIds.Contains(x.EngagementId)&&
            (x.DisputeOutcome==DisputeOutcome.ClientFavored||x.DisputeOutcome==DisputeOutcome.Split));
        await _providers.UpdateWorkroomTrustSignalsAsync(providerId,satisfaction,onTime,repeat,adverse);
    }

    private async Task ReconcilePayoutAsync(PaymentOperation op)
    {
        var payout=await _db.PayoutRequests.Find(x=>x.Id==op.PayoutRequestId).FirstOrDefaultAsync();if(payout is null||string.IsNullOrWhiteSpace(op.GatewayReference))return;
        var status=await _gateway.GetPayoutStatusAsync(op.GatewayReference);if(status.Status!=PayoutStatus.Completed)return;
        payout.Status=PayoutStatus.Completed;payout.GatewayReference=status.GatewayReference??op.GatewayReference;payout.CompletedAt=payout.UpdatedAt=DateTime.UtcNow;
        op.Status=PaymentOperationStatus.Completed;op.UpdatedAt=payout.UpdatedAt;
        var tx=new FinancialTransaction{ProviderId=payout.ProviderId,GrossAmount=payout.Amount,Currency=payout.Currency,TransactionType=FinancialTransactionType.PayoutCompleted,PaymentStatus=PaymentStatus.Completed,IdempotencyKey=op.IdempotencyKey,CreatedAt=payout.UpdatedAt,ReleasedAt=payout.CompletedAt};
        using var session=await _mongo.StartSessionAsync();session.StartTransaction();try{await _db.PayoutRequests.ReplaceOneAsync(session,x=>x.Id==payout.Id,payout);await _db.PaymentOperations.ReplaceOneAsync(session,x=>x.Id==op.Id,op);if(!await _db.FinancialTransactions.Find(session,x=>x.IdempotencyKey==op.IdempotencyKey).AnyAsync())await _db.FinancialTransactions.InsertOneAsync(session,tx);await session.CommitTransactionAsync();}catch{await session.AbortTransactionAsync();await MarkReconciliation(op);throw;}
    }

    private async Task CreateRepeatCouponIfEligible(string providerId,string clientId)
    {
        var count=await _db.WorkroomEngagements.CountDocumentsAsync(x=>x.ProviderId==providerId&&x.ClientId==clientId&&x.EngagementStatus==EngagementStatus.Completed);
        if(count<2||await _db.RepeatClientCoupons.Find(x=>x.ProviderId==providerId&&x.ClientId==clientId&&x.Status==CouponStatus.Active).AnyAsync())return;
        await _db.RepeatClientCoupons.InsertOneAsync(new RepeatClientCoupon{ProviderId=providerId,ClientId=clientId,Code=$"RETURN-{Guid.NewGuid():N}"[..15].ToUpperInvariant(),DiscountPercent=5,ExpiresAt=DateTime.UtcNow.AddDays(90)});
    }

    private async Task<WorkroomDetailResponse> Detail(WorkroomEngagement e,string actorId)
    {
        var c=await _db.Contracts.Find(x=>x.Id==e.ContractId).FirstOrDefaultAsync(); var ms=await _db.WorkroomMilestones.Find(x=>x.EngagementId==e.Id).SortBy(x=>x.DisplayOrder).ToListAsync();
        var ids=ms.Select(x=>x.Id).ToList(); var ds=await _db.Deliverables.Find(x=>ids.Contains(x.MilestoneId)).SortBy(x=>x.SubmittedAt).ToListAsync();
        var rs=await _db.RevisionRequests.Find(x=>ids.Contains(x.MilestoneId)).SortBy(x=>x.CreatedAt).ToListAsync();
        var tasks=await _db.WorkroomTasks.Find(x=>x.EngagementId==e.Id).ToListAsync(); if(actorId==e.ClientId)tasks=tasks.Where(x=>x.Visibility!=WorkroomTaskVisibility.ProviderPrivate).ToList();
        var inputs=await _db.ClientInputRequests.Find(x=>x.EngagementId==e.Id).ToListAsync();
        var files=await _db.WorkroomFiles.Find(x=>x.EngagementId==e.Id).SortByDescending(x=>x.CreatedAt).ToListAsync();if(actorId==e.ClientId)files=files.Where(x=>!x.ProviderPrivate).ToList();
        var timeEntries=await _db.HourlyTimeEntries.Find(x=>x.EngagementId==e.Id).SortByDescending(x=>x.StartedAt).ToListAsync();
        var review=await _db.Reviews.Find(x=>x.EngagementId==e.Id).FirstOrDefaultAsync();
        var client=await _users.FindByIdAsync(e.ClientId);var clientName=string.IsNullOrWhiteSpace(client?.Name)?"Client":client.Name;
        return new WorkroomDetailResponse{Engagement=e.ToResponse(clientName),Contract=c is null?new():ToContract(c),Milestones=ms.Select(x=>ToMilestone(x,e)).ToList(),Deliverables=ds,RevisionRequests=rs,Tasks=tasks,ClientInputRequests=inputs,Files=files,HourlyTimeEntries=timeEntries,Review=review};
    }
    private async Task<WorkroomEngagement?> Participant(string actorId,string id)=>await _db.WorkroomEngagements.Find(x=>x.Id==id&&(x.ProviderId==actorId||x.ClientId==actorId)).FirstOrDefaultAsync();
    private async Task<(WorkroomMilestone? m,WorkroomEngagement? e,Contract? c)> MilestoneContext(string id){var m=await _db.WorkroomMilestones.Find(x=>x.Id==id).FirstOrDefaultAsync();if(m is null)return(null,null,null);var e=await _db.WorkroomEngagements.Find(x=>x.Id==m.EngagementId).FirstOrDefaultAsync();var c=e is null?null:await _db.Contracts.Find(x=>x.Id==e.ContractId).FirstOrDefaultAsync();return(m,e,c);}
    private static ContractResponse ToContract(Contract c)=>new(){Id=c.Id,Terms=c.Terms,ProviderSignedAt=c.ProviderSignedAt,ClientSignedAt=c.ClientSignedAt,Status=c.Status.ToString(),SimpleConsentStub=true};
    private static WorkroomMilestoneResponse ToMilestone(WorkroomMilestone m,WorkroomEngagement e)=>new(){Id=m.Id,Title=m.Title,Description=m.Description,Amount=m.Amount,Currency=m.Currency,DisplayOrder=m.DisplayOrder,StartDate=m.StartDate,DueDate=m.DueDate,CompletionCriteria=m.CompletionCriteria,RemainingRevisions=m.UnlimitedRevisions?int.MaxValue:RevisionCalculator.Remaining(m.IncludedRevisionCount,m.PurchasedAdditionalRevisions,m.UsedRevisionCount),UnlimitedRevisions=m.UnlimitedRevisions,Status=m.MilestoneStatus.ToString(),EscrowStatus=m.EscrowStatus.ToString(),DeliveryClockState=ClockState(m,e),ExtensionRequested=m.ExtensionRequestedAt.HasValue,ApprovedExtensionDays=m.ApprovedExtensionDays,ReviewWindowEndsAt=m.ReviewWindowEndsAt,AutoReleaseAt=m.AutoReleaseAt,DisputeOpenedAt=m.DisputeOpenedAt,DisputeReviewEndsAt=m.DisputeReviewEndsAt,DisputeOutcome=m.DisputeOutcome?.ToString()};
    private static string ClockState(WorkroomMilestone m,WorkroomEngagement e){if(e.EngagementStatus==EngagementStatus.Paused)return"Paused";if(e.EngagementStatus==EngagementStatus.ClientInputRequired)return"WaitingForRequirements";if(m.EscrowStatus!=WorkroomEscrowStatus.Funded&&m.EscrowStatus!=WorkroomEscrowStatus.Released)return"WaitingForEscrow";if(m.ExtensionRequestedAt.HasValue&&m.ApprovedExtensionDays==0)return"ExtensionRequested";if(m.ApprovedExtensionDays>0)return"ExtensionApproved";if(m.DueDate is null)return"ReadyToStart";return DeliveryScheduleCalculator.ComputeState(DateTime.UtcNow,m.DueDate.Value,m.StartDate.HasValue,m.SubmittedAt.HasValue).ToString();}
    private static string NextVersion(string? previous,bool major){if(previous is null)return"1.0";var parts=previous.Split('.');var majorN=int.TryParse(parts[0],out var a)?a:1;var minor=int.TryParse(parts.ElementAtOrDefault(1),out var b)?b:0;return major?$"{majorN+1}.0":$"{majorN}.{minor+1}";}
    private async Task<PaymentOperation> BeginOperation(string key,PaymentOperationType type,string? engagementId,string? milestoneId,string? payoutId,decimal amount,string currency){var existing=await _db.PaymentOperations.Find(x=>x.IdempotencyKey==key).FirstOrDefaultAsync();if(existing is not null)return existing;var op=new PaymentOperation{IdempotencyKey=key,Type=type,EngagementId=engagementId,MilestoneId=milestoneId,PayoutRequestId=payoutId,Amount=amount,Currency=currency,AttemptCount=1};await _db.PaymentOperations.InsertOneAsync(op);return op;}
    private async Task GatewaySucceeded(PaymentOperation op,string? reference){op.Status=PaymentOperationStatus.GatewaySucceeded;op.GatewayReference=reference;op.UpdatedAt=DateTime.UtcNow;await _db.PaymentOperations.ReplaceOneAsync(x=>x.Id==op.Id,op);}
    private async Task FailOperation(PaymentOperation op,string? error){op.Status=PaymentOperationStatus.Failed;op.Error=error;op.UpdatedAt=DateTime.UtcNow;await _db.PaymentOperations.ReplaceOneAsync(x=>x.Id==op.Id,op);}
    private async Task MarkReconciliation(PaymentOperation op){op.Status=PaymentOperationStatus.ReconciliationRequired;op.UpdatedAt=DateTime.UtcNow;await _db.PaymentOperations.ReplaceOneAsync(x=>x.Id==op.Id,op);}
    private static WorkroomAuditEvent Audit(string actor,string role,string action,string type,string id,string? before,string? after)=>new(){ActorId=actor,ActorRole=role,Action=action,EntityType=type,EntityId=id,PreviousState=before,NewState=after};
    private Task AuditAsync(string actor,string role,string action,string type,string id,string? before,string? after)=>_db.WorkroomAuditEvents.InsertOneAsync(Audit(actor,role,action,type,id,before,after));
    private async Task Notify(string userId,string title,string body){if(!Guid.TryParse(userId,out var id))return;try{await _notifications.NotifyUser(id,title,body);}catch(Exception ex){_logger.LogWarning(ex,"Module 4 notification failed for {UserId}.",userId);}}
    // Targeted $inc on the split record (never a whole-user replace), so the
    // engagement counter can no longer race profile edits or trust recomputes.
    private async Task ChangeActiveOrderCount(string providerId,int delta)
    {
        var user=await _users.FindByIdAsync(providerId); if(user is null) return;
        await _migrator.EnsureMigratedAsync(user);
        if(!await _spStore.IncrementActiveOrdersAsync(providerId,delta))
            _logger.LogWarning("Active-order counter update was not applied for a provider (delta {Delta}).",delta);
    }
    private static string NormalizeCurrency(string? currency)=>string.IsNullOrWhiteSpace(currency)?"EUR":currency.Trim().ToUpperInvariant();
    private static string Mask(string value){var clean=value.Trim();if(clean.Contains('*'))return clean;return clean.Length<=4?new string('*',clean.Length):new string('*',clean.Length-4)+clean[^4..];}
    private static string? MaskNullable(string? value)=>string.IsNullOrWhiteSpace(value)?null:Mask(value);
}
