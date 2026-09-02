using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.Configuration;
using WebApp.DbContext;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Audit;
using WebApp.Services.Interface;

namespace WebApp.Controllers
{
    [Route("api/admin")]
    [ApiController]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public class AdminCommerceController : ControllerBase
    {
        private readonly MongoDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IWorkroomService _workroomService;
        private readonly IAuditLogger? _audit;

        public AdminCommerceController(
            MongoDbContext context,
            UserManager<ApplicationUser> userManager,
            IWorkroomService workroomService,
            IAuditLogger? audit = null)
        {
            _context = context;
            _userManager = userManager;
            _workroomService = workroomService;
            _audit = audit;
        }

        private string CurrentAdminId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "admin";
        private string CurrentAdminEmail => User.FindFirstValue(ClaimTypes.Email) ?? CurrentAdminId;

        // GET: api/admin/commerce/metrics
        [HttpGet("commerce/metrics")]
        public async Task<IActionResult> GetCommerceMetrics()
        {
            var summary = await CalculateCommerceSummaryAsync();
            return Ok(ApiResponse.Ok("Commerce metrics loaded successfully", summary));
        }

        // GET: api/admin/commerce/summary
        [HttpGet("commerce/summary")]
        public async Task<IActionResult> GetCommerceSummary()
        {
            var summary = await CalculateCommerceSummaryAsync();
            return Ok(ApiResponse.Ok("Commerce summary loaded successfully", summary));
        }

        private async Task<AdminCommerceSummaryDto> CalculateCommerceSummaryAsync()
        {
            var activeStatuses = new[]
            {
                EngagementStatus.Active,
                EngagementStatus.ReadyToStart,
                EngagementStatus.MilestoneReview,
                EngagementStatus.RevisionInProgress,
                EngagementStatus.ClientInputRequired,
                EngagementStatus.FinalDelivery
            };

            var totalEngagementsTask = _context.WorkroomEngagements.CountDocumentsAsync(new BsonDocument());
            var activeEngagementsTask = _context.WorkroomEngagements.CountDocumentsAsync(x => activeStatuses.Contains(x.EngagementStatus));
            var completedEngagementsTask = _context.WorkroomEngagements.CountDocumentsAsync(x => x.EngagementStatus == EngagementStatus.Completed);

            var openDisputesTask = _context.WorkroomMilestones.CountDocumentsAsync(x =>
                x.MilestoneStatus == WorkroomMilestoneStatus.Disputed || x.DisputeOutcome == DisputeOutcome.Open);

            var disputedMilestones = await _context.WorkroomMilestones
                .Find(x => x.MilestoneStatus == WorkroomMilestoneStatus.Disputed || x.DisputeOutcome == DisputeOutcome.Open)
                .ToListAsync();
            var disputedAmountTotal = disputedMilestones.Sum(m => m.Amount);

            var pendingPayoutStatuses = new[] { PayoutStatus.Requested, PayoutStatus.UnderReview, PayoutStatus.Processing };
            var pendingPayouts = await _context.PayoutRequests.Find(x => pendingPayoutStatuses.Contains(x.Status)).ToListAsync();
            var processedPayouts = await _context.PayoutRequests.Find(x => x.Status == PayoutStatus.Completed).ToListAsync();

            var fundedMilestones = await _context.WorkroomMilestones
                .Find(x => x.EscrowStatus == WorkroomEscrowStatus.Funded && x.MilestoneStatus != WorkroomMilestoneStatus.Paid)
                .ToListAsync();
            var totalEscrowHeld = fundedMilestones.Sum(m => m.Amount);

            var allTransactions = await _context.FinancialTransactions
                .Find(x => x.PaymentStatus == PaymentStatus.Completed || x.PaymentStatus == PaymentStatus.Refunded)
                .ToListAsync();

            var grossVolume = allTransactions.Where(t => t.TransactionType == FinancialTransactionType.EscrowFunded || t.TransactionType == FinancialTransactionType.PaymentReleased || t.TransactionType == FinancialTransactionType.MilestoneApproved).Sum(t => t.GrossAmount);
            var commissionVolume = allTransactions.Sum(t => t.CommissionAmount);
            var refundedVolume = allTransactions.Where(t => t.TransactionType == FinancialTransactionType.Refund || t.PaymentStatus == PaymentStatus.Refunded).Sum(t => t.GrossAmount);

            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
            var recentTransactions = allTransactions.Where(x => x.CreatedAt >= thirtyDaysAgo && x.PaymentStatus == PaymentStatus.Completed).ToList();

            return new AdminCommerceSummaryDto
            {
                TotalEngagements = (int)await totalEngagementsTask,
                ActiveEngagements = (int)await activeEngagementsTask,
                CompletedEngagements = (int)await completedEngagementsTask,
                OpenDisputes = (int)await openDisputesTask,
                OpenDisputesCount = (int)await openDisputesTask,
                DisputedAmountTotal = disputedAmountTotal,
                PendingPayoutRequests = pendingPayouts.Count,
                PendingPayoutsCount = pendingPayouts.Count,
                PendingPayoutVolume = pendingPayouts.Sum(p => p.Amount),
                PendingPayoutsAmount = pendingPayouts.Sum(p => p.Amount),
                ProcessedPayouts = processedPayouts.Count,
                ProcessedPayoutVolume = processedPayouts.Sum(p => p.Amount),
                GrossTransactionVolume = grossVolume,
                TotalPlatformRevenue = commissionVolume,
                PlatformCommission = commissionVolume,
                RefundedAmount = refundedVolume,
                TotalEscrowHeld = totalEscrowHeld,
                ActiveEscrowContractsCount = fundedMilestones.Select(m => m.EngagementId).Distinct().Count(),
                AllTimeGMV = grossVolume,
                RecentTransactionVolume30Days = recentTransactions.Sum(t => t.GrossAmount),
                Currency = "EUR"
            };
        }

        // GET: api/admin/engagements
        [HttpGet("engagements")]
        public async Task<IActionResult> GetEngagements([FromQuery] AdminEngagementListQuery query)
        {
            var page = query.Page <= 0 ? 1 : query.Page;
            var pageSize = query.PageSize <= 0 ? 25 : Math.Min(query.PageSize, 100);

            var builder = Builders<WorkroomEngagement>.Filter;
            var filter = builder.Empty;

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var s = query.Search.Trim();
                var searchFilter = builder.Or(
                    builder.Regex(x => x.Title, new MongoDB.Bson.BsonRegularExpression(s, "i")),
                    builder.Regex(x => x.Description, new MongoDB.Bson.BsonRegularExpression(s, "i")),
                    builder.Eq(x => x.Id, s)
                );
                filter = builder.And(filter, searchFilter);
            }

            if (!string.IsNullOrWhiteSpace(query.ClientId))
                filter = builder.And(filter, builder.Eq(x => x.ClientId, query.ClientId.Trim()));

            if (!string.IsNullOrWhiteSpace(query.ProviderId))
                filter = builder.And(filter, builder.Eq(x => x.ProviderId, query.ProviderId.Trim()));

            if (!string.IsNullOrWhiteSpace(query.Status) && Enum.TryParse<EngagementStatus>(query.Status, true, out var statusEnum))
                filter = builder.And(filter, builder.Eq(x => x.EngagementStatus, statusEnum));

            if (query.StartDate.HasValue)
                filter = builder.And(filter, builder.Gte(x => x.CreatedAt, query.StartDate.Value));

            if (query.EndDate.HasValue)
                filter = builder.And(filter, builder.Lte(x => x.CreatedAt, query.EndDate.Value));

            var totalCount = await _context.WorkroomEngagements.CountDocumentsAsync(filter);
            var engagements = await _context.WorkroomEngagements
                .Find(filter)
                .SortByDescending(x => x.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Limit(pageSize)
                .ToListAsync();

            var engagementIds = engagements.Select(e => e.Id).ToList();
            var userIds = engagements.Select(e => e.ClientId).Concat(engagements.Select(e => e.ProviderId)).Distinct().ToList();

            var milestones = await _context.WorkroomMilestones.Find(m => engagementIds.Contains(m.EngagementId)).ToListAsync();
            var users = await _context.ApplicationUsers.Find(u => userIds.Contains(u.Id.ToString())).ToListAsync();
            var userMap = users.ToDictionary(u => u.Id.ToString(), u => u);

            var items = new List<AdminEngagementListItemDto>();
            foreach (var e in engagements)
            {
                var client = userMap.GetValueOrDefault(e.ClientId);
                var provider = userMap.GetValueOrDefault(e.ProviderId);
                var engMilestones = milestones.Where(m => m.EngagementId == e.Id).ToList();
                var hasDispute = engMilestones.Any(m => m.MilestoneStatus == WorkroomMilestoneStatus.Disputed || m.DisputeOutcome == DisputeOutcome.Open || m.DisputeOpenedAt != null);

                if (query.HasDispute.HasValue && query.HasDispute.Value != hasDispute)
                    continue;

                items.Add(new AdminEngagementListItemDto
                {
                    Id = e.Id,
                    Title = e.Title,
                    Description = e.Description,
                    ClientId = e.ClientId,
                    ClientName = client?.Name ?? client?.UserName ?? e.ClientId,
                    ClientEmail = client?.Email ?? "",
                    ProviderId = e.ProviderId,
                    ProviderName = provider?.Name ?? provider?.UserName ?? e.ProviderId,
                    ProviderEmail = provider?.Email ?? "",
                    ContractValue = e.ContractValue,
                    Currency = e.Currency,
                    Status = e.EngagementStatus.ToString(),
                    EscrowStatus = e.EscrowStatus.ToString(),
                    MilestonesCount = engMilestones.Count,
                    CompletionPercentage = e.CompletionPercentage,
                    CreatedAt = e.CreatedAt,
                    ExpectedEndDate = e.ExpectedEndDate,
                    ActualEndDate = e.ActualEndDate,
                    HasDispute = hasDispute
                });
            }

            return Ok(new
            {
                success = true,
                message = "Engagements fetched successfully",
                data = new
                {
                    items,
                    totalCount,
                    page,
                    pageSize,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                }
            });
        }

        // GET: api/admin/engagements/{id}
        [HttpGet("engagements/{id}")]
        public async Task<IActionResult> GetEngagementDetail(string id)
        {
            var e = await _context.WorkroomEngagements.Find(x => x.Id == id).FirstOrDefaultAsync();
            if (e is null)
                return NotFound(ApiResponse.Error("Engagement not found.", HttpContext.TraceIdentifier));

            var clientUser = await _userManager.FindByIdAsync(e.ClientId);
            var providerUser = await _userManager.FindByIdAsync(e.ProviderId);

            var clientRoles = clientUser != null ? (await _userManager.GetRolesAsync(clientUser)).ToList() : new List<string>();
            var providerRoles = providerUser != null ? (await _userManager.GetRolesAsync(providerUser)).ToList() : new List<string>();

            var contract = await _context.Contracts.Find(c => c.Id == e.ContractId || c.EngagementId == e.Id).FirstOrDefaultAsync();
            var milestones = await _context.WorkroomMilestones.Find(m => m.EngagementId == e.Id).SortBy(m => m.DisplayOrder).ToListAsync();
            var milestoneIds = milestones.Select(m => m.Id).ToList();

            var deliverables = await _context.Deliverables.Find(d => milestoneIds.Contains(d.MilestoneId)).ToListAsync();
            var transactions = await _context.FinancialTransactions.Find(t => t.EngagementId == e.Id).SortByDescending(t => t.CreatedAt).ToListAsync();
            var files = await _context.WorkroomFiles.Find(f => f.EngagementId == e.Id).ToListAsync();

            var detail = new AdminEngagementDetailDto
            {
                Id = e.Id,
                ProposalId = e.ProposalId,
                ContractId = e.ContractId,
                Title = e.Title,
                Description = e.Description,
                ContractValue = e.ContractValue,
                Currency = e.Currency,
                Status = e.EngagementStatus.ToString(),
                EscrowStatus = e.EscrowStatus.ToString(),
                CompletionPercentage = e.CompletionPercentage,
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt,
                StartDate = e.StartDate,
                ExpectedEndDate = e.ExpectedEndDate,
                ActualEndDate = e.ActualEndDate,
                Client = new AdminPartyDto
                {
                    Id = e.ClientId,
                    Name = clientUser?.Name ?? clientUser?.UserName ?? e.ClientId,
                    Email = clientUser?.Email ?? "",
                    UserName = clientUser?.UserName ?? "",
                    Roles = clientRoles,
                    PhoneNumber = clientUser?.PhoneNumber,
                    EmailConfirmed = clientUser?.EmailConfirmed ?? false,
                    KycStatus = clientUser?.Kyc?.Status.ToString() ?? "None"
                },
                Provider = new AdminPartyDto
                {
                    Id = e.ProviderId,
                    Name = providerUser?.Name ?? providerUser?.UserName ?? e.ProviderId,
                    Email = providerUser?.Email ?? "",
                    UserName = providerUser?.UserName ?? "",
                    Roles = providerRoles,
                    PhoneNumber = providerUser?.PhoneNumber,
                    EmailConfirmed = providerUser?.EmailConfirmed ?? false,
                    KycStatus = providerUser?.Kyc?.Status.ToString() ?? "None"
                },
                Contract = contract == null ? null : new AdminContractSummaryDto
                {
                    Id = contract.Id,
                    Status = contract.Status.ToString(),
                    ProviderSignedAt = contract.ProviderSignedAt,
                    ClientSignedAt = contract.ClientSignedAt,
                    Price = contract.Terms.Price,
                    Currency = contract.Terms.Currency,
                    PricingType = contract.Terms.PricingType.ToString(),
                    DeliveryTimeValue = contract.Terms.DeliveryTimeValue,
                    DeliveryTimeUnit = contract.Terms.DeliveryTimeUnit.ToString(),
                    IncludedRevisionCount = contract.Terms.IncludedRevisionCount,
                    UnlimitedRevisions = contract.Terms.UnlimitedRevisions,
                    Deliverables = contract.Terms.Deliverables,
                    HourlyRate = contract.Terms.HourlyRate,
                    WeeklyHourLimit = contract.Terms.WeeklyHourLimit
                },
                Milestones = milestones.Select(m => new AdminMilestoneDto
                {
                    Id = m.Id,
                    EngagementId = m.EngagementId,
                    Title = m.Title,
                    Description = m.Description,
                    Amount = m.Amount,
                    Currency = m.Currency,
                    DisplayOrder = m.DisplayOrder,
                    Status = m.MilestoneStatus.ToString(),
                    EscrowStatus = m.EscrowStatus.ToString(),
                    DueDate = m.DueDate,
                    SubmittedAt = m.SubmittedAt,
                    ApprovedAt = m.ApprovedAt,
                    RefundedAt = m.RefundedAt,
                    DisputeOpenedAt = m.DisputeOpenedAt,
                    DisputeResolvedAt = m.DisputeResolvedAt,
                    DisputeOutcome = m.DisputeOutcome?.ToString(),
                    IncludedRevisionCount = m.IncludedRevisionCount,
                    UsedRevisionCount = m.UsedRevisionCount,
                    UnlimitedRevisions = m.UnlimitedRevisions,
                    CompletionCriteria = m.CompletionCriteria
                }).ToList(),
                Deliverables = deliverables.Select(d => new AdminDeliverableDto
                {
                    Id = d.Id,
                    MilestoneId = d.MilestoneId,
                    Title = d.Title,
                    Description = d.Description,
                    Version = d.Version,
                    Status = d.DeliverableStatus.ToString(),
                    SubmittedAt = d.SubmittedAt,
                    FilesCount = d.FileIds?.Count ?? 0,
                    LinksCount = d.ExternalLinks?.Count ?? 0
                }).ToList(),
                Transactions = transactions.Select(t => new AdminFinancialTransactionDto
                {
                    Id = t.Id,
                    CreatedAt = t.CreatedAt,
                    ReleasedAt = t.ReleasedAt,
                    TransactionType = t.TransactionType.ToString(),
                    PaymentStatus = t.PaymentStatus.ToString(),
                    GrossAmount = t.GrossAmount,
                    CommissionAmount = t.CommissionAmount,
                    NetAmount = t.NetAmount,
                    Currency = t.Currency,
                    ClientId = t.ClientId,
                    ClientName = clientUser?.Name ?? t.ClientId,
                    ProviderId = t.ProviderId,
                    ProviderName = providerUser?.Name ?? t.ProviderId,
                    EngagementId = t.EngagementId,
                    EngagementTitle = e.Title,
                    MilestoneId = t.MilestoneId,
                    IdempotencyKey = t.IdempotencyKey
                }).ToList(),
                Files = files.Select(f => new AdminFileMetaDto
                {
                    Id = f.Id,
                    MilestoneId = f.MilestoneId ?? "",
                    OriginalName = f.OriginalName,
                    ContentType = f.ContentType,
                    SizeBytes = f.SizeBytes,
                    Status = f.Status.ToString(),
                    CreatedAt = f.CreatedAt
                }).ToList()
            };

            return Ok(ApiResponse.Ok("Engagement detail loaded", detail));
        }

        // GET: api/admin/disputes
        [HttpGet("disputes")]
        public async Task<IActionResult> GetDisputes()
        {
            try
            {
                var filter = Builders<WorkroomMilestone>.Filter.Or(
                    Builders<WorkroomMilestone>.Filter.Eq(m => m.MilestoneStatus, WorkroomMilestoneStatus.Disputed),
                    Builders<WorkroomMilestone>.Filter.Ne(m => m.DisputeOutcome, null),
                    Builders<WorkroomMilestone>.Filter.Ne(m => m.DisputeOpenedAt, null)
                );

                var disputedMilestones = await _context.WorkroomMilestones
                    .Find(filter)
                    .SortByDescending(m => m.UpdatedAt)
                    .ToListAsync();

                disputedMilestones = disputedMilestones
                    .OrderByDescending(m => m.DisputeOpenedAt ?? m.UpdatedAt)
                    .ToList();

                if (disputedMilestones.Count == 0)
                {
                    return Ok(ApiResponse.Ok("Disputes queue fetched", new List<AdminDisputeListItemDto>()));
                }

                var engagementIds = disputedMilestones.Select(m => m.EngagementId).Where(id => !string.IsNullOrEmpty(id)).Distinct().ToList();
                var engagements = engagementIds.Count > 0
                    ? await _context.WorkroomEngagements.Find(e => engagementIds.Contains(e.Id)).ToListAsync()
                    : new List<WorkroomEngagement>();
                var engMap = engagements.ToDictionary(e => e.Id, e => e);

                var userIds = engagements
                    .Select(e => e.ClientId)
                    .Concat(engagements.Select(e => e.ProviderId))
                    .Where(id => !string.IsNullOrEmpty(id))
                    .Distinct()
                    .ToList();

                var users = userIds.Count > 0
                    ? await _context.ApplicationUsers.Find(u => userIds.Contains(u.Id.ToString())).ToListAsync()
                    : new List<ApplicationUser>();
                var userMap = users.ToDictionary(u => u.Id.ToString(), u => u);

                var milestoneIds = disputedMilestones.Select(m => m.Id).ToList();
                var revisions = milestoneIds.Count > 0
                    ? await _context.RevisionRequests.Find(r => milestoneIds.Contains(r.MilestoneId)).ToListAsync()
                    : new List<RevisionRequest>();

                var items = disputedMilestones.Select(m =>
                {
                    var eng = !string.IsNullOrEmpty(m.EngagementId) ? engMap.GetValueOrDefault(m.EngagementId) : null;
                    var client = eng != null && !string.IsNullOrEmpty(eng.ClientId) ? userMap.GetValueOrDefault(eng.ClientId) : null;
                    var provider = eng != null && !string.IsNullOrEmpty(eng.ProviderId) ? userMap.GetValueOrDefault(eng.ProviderId) : null;
                    var revCount = revisions.Count(r => r.MilestoneId == m.Id);

                    return new AdminDisputeListItemDto
                    {
                        MilestoneId = m.Id,
                        MilestoneTitle = m.Title ?? "Untitled Milestone",
                        EngagementId = m.EngagementId ?? "",
                        EngagementTitle = eng?.Title ?? m.EngagementId ?? "",
                        ClientId = eng?.ClientId ?? "",
                        ClientName = client?.Name ?? client?.UserName ?? eng?.ClientId ?? "Client",
                        ProviderId = eng?.ProviderId ?? "",
                        ProviderName = provider?.Name ?? provider?.UserName ?? eng?.ProviderId ?? "Provider",
                        Amount = m.Amount,
                        Currency = m.Currency ?? "EUR",
                        DisputeOpenedAt = m.DisputeOpenedAt,
                        DisputeResolvedAt = m.DisputeResolvedAt,
                        Status = m.MilestoneStatus.ToString(),
                        Outcome = m.DisputeOutcome?.ToString(),
                        RevisionCount = revCount
                    };
                }).ToList();

                return Ok(ApiResponse.Ok("Disputes queue fetched", items));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Error($"Failed to fetch disputes: {ex.Message}", HttpContext.TraceIdentifier));
            }
        }

        // GET: api/admin/disputes/{milestoneId}
        [HttpGet("disputes/{milestoneId}")]
        public async Task<IActionResult> GetDisputeDetail(string milestoneId)
        {
            var m = await _context.WorkroomMilestones.Find(x => x.Id == milestoneId).FirstOrDefaultAsync();
            if (m is null)
                return NotFound(ApiResponse.Error("Disputed milestone not found.", HttpContext.TraceIdentifier));

            var e = await _context.WorkroomEngagements.Find(x => x.Id == m.EngagementId).FirstOrDefaultAsync();
            if (e is null)
                return NotFound(ApiResponse.Error("Associated engagement not found.", HttpContext.TraceIdentifier));

            var clientUser = await _userManager.FindByIdAsync(e.ClientId);
            var providerUser = await _userManager.FindByIdAsync(e.ProviderId);

            var contract = await _context.Contracts.Find(c => c.Id == e.ContractId || c.EngagementId == e.Id).FirstOrDefaultAsync();
            var deliverables = await _context.Deliverables.Find(d => d.MilestoneId == m.Id).ToListAsync();
            var revisions = await _context.RevisionRequests.Find(r => r.MilestoneId == m.Id).SortByDescending(r => r.CreatedAt).ToListAsync();
            var transactions = await _context.FinancialTransactions.Find(t => t.MilestoneId == m.Id).ToListAsync();

            var detail = new AdminDisputeDetailDto
            {
                Milestone = new AdminMilestoneDto
                {
                    Id = m.Id,
                    EngagementId = m.EngagementId,
                    Title = m.Title,
                    Description = m.Description,
                    Amount = m.Amount,
                    Currency = m.Currency,
                    DisplayOrder = m.DisplayOrder,
                    Status = m.MilestoneStatus.ToString(),
                    EscrowStatus = m.EscrowStatus.ToString(),
                    DueDate = m.DueDate,
                    SubmittedAt = m.SubmittedAt,
                    ApprovedAt = m.ApprovedAt,
                    RefundedAt = m.RefundedAt,
                    DisputeOpenedAt = m.DisputeOpenedAt,
                    DisputeResolvedAt = m.DisputeResolvedAt,
                    DisputeOutcome = m.DisputeOutcome?.ToString(),
                    IncludedRevisionCount = m.IncludedRevisionCount,
                    UsedRevisionCount = m.UsedRevisionCount,
                    UnlimitedRevisions = m.UnlimitedRevisions,
                    CompletionCriteria = m.CompletionCriteria
                },
                Engagement = new AdminEngagementListItemDto
                {
                    Id = e.Id,
                    Title = e.Title,
                    Description = e.Description,
                    ClientId = e.ClientId,
                    ClientName = clientUser?.Name ?? e.ClientId,
                    ClientEmail = clientUser?.Email ?? "",
                    ProviderId = e.ProviderId,
                    ProviderName = providerUser?.Name ?? e.ProviderId,
                    ProviderEmail = providerUser?.Email ?? "",
                    ContractValue = e.ContractValue,
                    Currency = e.Currency,
                    Status = e.EngagementStatus.ToString(),
                    EscrowStatus = e.EscrowStatus.ToString(),
                    CreatedAt = e.CreatedAt,
                    HasDispute = true
                },
                Contract = contract == null ? null : new AdminContractSummaryDto
                {
                    Id = contract.Id,
                    Status = contract.Status.ToString(),
                    ProviderSignedAt = contract.ProviderSignedAt,
                    ClientSignedAt = contract.ClientSignedAt,
                    Price = contract.Terms?.Price ?? 0m,
                    Currency = contract.Terms?.Currency ?? "EUR",
                    PricingType = contract.Terms?.PricingType.ToString() ?? "Fixed",
                    DeliveryTimeValue = contract.Terms?.DeliveryTimeValue ?? 0,
                    DeliveryTimeUnit = contract.Terms?.DeliveryTimeUnit.ToString() ?? "Days",
                    IncludedRevisionCount = contract.Terms?.IncludedRevisionCount ?? 0,
                    UnlimitedRevisions = contract.Terms?.UnlimitedRevisions ?? false,
                    Deliverables = contract.Terms?.Deliverables ?? new List<string>()
                },
                Deliverables = deliverables.Select(d => new AdminDeliverableDto
                {
                    Id = d.Id,
                    MilestoneId = d.MilestoneId,
                    Title = d.Title,
                    Description = d.Description,
                    Version = d.Version,
                    Status = d.DeliverableStatus.ToString(),
                    SubmittedAt = d.SubmittedAt,
                    FilesCount = d.FileIds?.Count ?? 0,
                    LinksCount = d.ExternalLinks?.Count ?? 0
                }).ToList(),
                RevisionHistory = revisions.Select(r => new AdminRevisionRequestDto
                {
                    Id = r.Id,
                    MilestoneId = r.MilestoneId,
                    RequestedBy = r.RequestedBy,
                    Description = r.Description,
                    RequestedChanges = r.RequestedChanges ?? new(),
                    Status = r.RevisionRequestStatus.ToString(),
                    ScopeClassification = r.ScopeClassification.ToString(),
                    CreatedAt = r.CreatedAt
                }).ToList(),
                RelatedTransactions = transactions.Select(t => new AdminFinancialTransactionDto
                {
                    Id = t.Id,
                    CreatedAt = t.CreatedAt,
                    ReleasedAt = t.ReleasedAt,
                    TransactionType = t.TransactionType.ToString(),
                    PaymentStatus = t.PaymentStatus.ToString(),
                    GrossAmount = t.GrossAmount,
                    CommissionAmount = t.CommissionAmount,
                    NetAmount = t.NetAmount,
                    Currency = t.Currency,
                    ClientId = t.ClientId,
                    ProviderId = t.ProviderId,
                    EngagementId = t.EngagementId,
                    MilestoneId = t.MilestoneId
                }).ToList(),
                CurrentDisputeOutcome = m.DisputeOutcome?.ToString(),
                DisputeOpenedAt = m.DisputeOpenedAt,
                DisputeResolvedAt = m.DisputeResolvedAt
            };

            return Ok(ApiResponse.Ok("Dispute detail loaded", detail));
        }

        // POST: api/admin/disputes/{milestoneId}/resolve
        [HttpPost("disputes/{milestoneId}/resolve")]
        public async Task<IActionResult> ResolveDispute(string milestoneId, [FromBody] ResolveDisputeRequest request)
        {
            var outcome = request.Outcome?.Trim() ?? "";
            var normalizedOutcome = outcome.ToLowerInvariant() switch
            {
                "refund_buyer" or "refundtoclient" or "clientfavored" => "ClientFavored",
                "release_provider" or "releasetoprovider" or "providerfavored" => "ProviderFavored",
                "split" => "Split",
                _ => outcome
            };

            var result = await _workroomService.ResolveDisputeAsync(CurrentAdminId, milestoneId, normalizedOutcome, request.Reason);
            if (result.Outcome == ServiceProviderOutcome.Ok)
            {
                _audit?.Record("admin_dispute_resolved", CurrentAdminEmail, true, new { milestoneId, outcome = normalizedOutcome, request.Reason });
                return Ok(ApiResponse.Ok("Dispute resolved successfully", result.Value));
            }

            _audit?.Record("admin_dispute_resolved", CurrentAdminEmail, false, new { milestoneId, outcome = normalizedOutcome, error = result.Message });
            return result.Outcome switch
            {
                ServiceProviderOutcome.NotFound => NotFound(ApiResponse.Error(result.Message, HttpContext.TraceIdentifier)),
                ServiceProviderOutcome.Conflict => Conflict(ApiResponse.Error(result.Message, HttpContext.TraceIdentifier)),
                ServiceProviderOutcome.Invalid => BadRequest(ApiResponse.Error(result.Message, HttpContext.TraceIdentifier)),
                _ => StatusCode(500, ApiResponse.Error(result.Message, HttpContext.TraceIdentifier))
            };
        }

        // GET: api/admin/transactions
        [HttpGet("transactions")]
        public async Task<IActionResult> GetTransactions([FromQuery] AdminTransactionListQuery query)
        {
            var page = query.Page <= 0 ? 1 : query.Page;
            var pageSize = query.PageSize <= 0 ? 25 : Math.Min(query.PageSize, 100);

            var builder = Builders<FinancialTransaction>.Filter;
            var filter = builder.Empty;

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var s = query.Search.Trim();
                var searchFilter = builder.Or(
                    builder.Eq(x => x.Id, s),
                    builder.Eq(x => x.IdempotencyKey, s),
                    builder.Eq(x => x.EngagementId, s)
                );
                filter = builder.And(filter, searchFilter);
            }

            if (!string.IsNullOrWhiteSpace(query.UserId))
            {
                var uid = query.UserId.Trim();
                filter = builder.And(filter, builder.Or(builder.Eq(x => x.ClientId, uid), builder.Eq(x => x.ProviderId, uid)));
            }

            if (!string.IsNullOrWhiteSpace(query.EngagementId))
                filter = builder.And(filter, builder.Eq(x => x.EngagementId, query.EngagementId.Trim()));

            if (!string.IsNullOrWhiteSpace(query.TransactionType) && Enum.TryParse<FinancialTransactionType>(query.TransactionType, true, out var txType))
                filter = builder.And(filter, builder.Eq(x => x.TransactionType, txType));

            if (!string.IsNullOrWhiteSpace(query.PaymentStatus) && Enum.TryParse<PaymentStatus>(query.PaymentStatus, true, out var payStatus))
                filter = builder.And(filter, builder.Eq(x => x.PaymentStatus, payStatus));

            if (query.From.HasValue)
                filter = builder.And(filter, builder.Gte(x => x.CreatedAt, query.From.Value));

            if (query.To.HasValue)
                filter = builder.And(filter, builder.Lte(x => x.CreatedAt, query.To.Value));

            var totalCount = await _context.FinancialTransactions.CountDocumentsAsync(filter);
            var transactions = await _context.FinancialTransactions
                .Find(filter)
                .SortByDescending(x => x.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Limit(pageSize)
                .ToListAsync();

            var userIds = transactions.Select(t => t.ClientId).Concat(transactions.Select(t => t.ProviderId)).Where(u => !string.IsNullOrEmpty(u)).Distinct().ToList();
            var users = await _context.ApplicationUsers.Find(u => userIds.Contains(u.Id.ToString())).ToListAsync();
            var userMap = users.ToDictionary(u => u.Id.ToString(), u => u);

            var engIds = transactions.Select(t => t.EngagementId).Where(e => !string.IsNullOrEmpty(e)).Distinct().ToList();
            var engagements = await _context.WorkroomEngagements.Find(e => engIds.Contains(e.Id)).ToListAsync();
            var engMap = engagements.ToDictionary(e => e.Id, e => e);

            var items = transactions.Select(t =>
            {
                var client = userMap.GetValueOrDefault(t.ClientId);
                var provider = userMap.GetValueOrDefault(t.ProviderId);
                var eng = t.EngagementId != null ? engMap.GetValueOrDefault(t.EngagementId) : null;

                return new AdminFinancialTransactionDto
                {
                    Id = t.Id,
                    CreatedAt = t.CreatedAt,
                    ReleasedAt = t.ReleasedAt,
                    TransactionType = t.TransactionType.ToString(),
                    PaymentStatus = t.PaymentStatus.ToString(),
                    GrossAmount = t.GrossAmount,
                    CommissionAmount = t.CommissionAmount,
                    NetAmount = t.NetAmount,
                    Currency = t.Currency,
                    ClientId = t.ClientId,
                    ClientName = client?.Name ?? client?.UserName ?? t.ClientId,
                    ProviderId = t.ProviderId,
                    ProviderName = provider?.Name ?? provider?.UserName ?? t.ProviderId,
                    EngagementId = t.EngagementId,
                    EngagementTitle = eng?.Title ?? t.EngagementId,
                    MilestoneId = t.MilestoneId,
                    IdempotencyKey = t.IdempotencyKey
                };
            }).ToList();

            return Ok(new
            {
                success = true,
                message = "Transactions fetched successfully",
                data = new
                {
                    items,
                    totalCount,
                    page,
                    pageSize,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                }
            });
        }

        // GET: api/admin/payouts
        [HttpGet("payouts")]
        public async Task<IActionResult> GetPayouts([FromQuery] AdminPayoutListQuery query)
        {
            var page = query.Page <= 0 ? 1 : query.Page;
            var pageSize = query.PageSize <= 0 ? 25 : Math.Min(query.PageSize, 100);

            var builder = Builders<PayoutRequest>.Filter;
            var filter = builder.Empty;

            if (!string.IsNullOrWhiteSpace(query.Status) && Enum.TryParse<PayoutStatus>(query.Status, true, out var statusEnum))
                filter = builder.And(filter, builder.Eq(x => x.Status, statusEnum));

            if (!string.IsNullOrWhiteSpace(query.ProviderId))
                filter = builder.And(filter, builder.Eq(x => x.ProviderId, query.ProviderId.Trim()));

            var totalCount = await _context.PayoutRequests.CountDocumentsAsync(filter);
            var payouts = await _context.PayoutRequests
                .Find(filter)
                .SortByDescending(x => x.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Limit(pageSize)
                .ToListAsync();

            var providerIds = payouts.Select(p => p.ProviderId).Distinct().ToList();
            var providers = await _context.ApplicationUsers.Find(u => providerIds.Contains(u.Id.ToString())).ToListAsync();
            var providerMap = providers.ToDictionary(u => u.Id.ToString(), u => u);

            var items = payouts.Select(p =>
            {
                var provider = providerMap.GetValueOrDefault(p.ProviderId);
                var (methodLabel, maskedDest) = ExtractMaskedPayoutDestination(provider, p.PayoutMethodId);

                return new AdminPayoutListItemDto
                {
                    Id = p.Id,
                    ProviderId = p.ProviderId,
                    ProviderName = provider?.Name ?? provider?.UserName ?? p.ProviderId,
                    ProviderEmail = provider?.Email ?? "",
                    Amount = p.Amount,
                    Currency = p.Currency,
                    Status = p.Status.ToString(),
                    PayoutMethodId = p.PayoutMethodId,
                    PayoutMethodLabel = methodLabel,
                    MaskedDestination = maskedDest,
                    GatewayReference = p.GatewayReference,
                    CreatedAt = p.CreatedAt,
                    CompletedAt = p.CompletedAt
                };
            }).ToList();

            return Ok(new
            {
                success = true,
                message = "Payout requests fetched successfully",
                data = new
                {
                    items,
                    totalCount,
                    page,
                    pageSize,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                }
            });
        }

        // GET: api/admin/payouts/{id}
        [HttpGet("payouts/{id}")]
        public async Task<IActionResult> GetPayoutDetail(string id)
        {
            var p = await _context.PayoutRequests.Find(x => x.Id == id).FirstOrDefaultAsync();
            if (p is null)
                return NotFound(ApiResponse.Error("Payout request not found.", HttpContext.TraceIdentifier));

            var provider = await _userManager.FindByIdAsync(p.ProviderId);
            var roles = provider != null ? (await _userManager.GetRolesAsync(provider)).ToList() : new List<string>();

            var summaryResult = await _workroomService.GetFinancialSummaryAsync(p.ProviderId, p.Currency);
            var availableBalance = summaryResult.Value?.Available ?? 0m;
            var withdrawnTotal = summaryResult.Value?.Withdrawn ?? 0m;

            var previousPayouts = await _context.PayoutRequests
                .Find(x => x.ProviderId == p.ProviderId && x.Id != p.Id)
                .SortByDescending(x => x.CreatedAt)
                .Limit(10)
                .ToListAsync();

            var (methodLabel, maskedDest) = ExtractMaskedPayoutDestination(provider, p.PayoutMethodId);

            var detail = new AdminPayoutDetailDto
            {
                Payout = new AdminPayoutListItemDto
                {
                    Id = p.Id,
                    ProviderId = p.ProviderId,
                    ProviderName = provider?.Name ?? provider?.UserName ?? p.ProviderId,
                    ProviderEmail = provider?.Email ?? "",
                    Amount = p.Amount,
                    Currency = p.Currency,
                    Status = p.Status.ToString(),
                    PayoutMethodId = p.PayoutMethodId,
                    PayoutMethodLabel = methodLabel,
                    MaskedDestination = maskedDest,
                    GatewayReference = p.GatewayReference,
                    CreatedAt = p.CreatedAt,
                    CompletedAt = p.CompletedAt
                },
                Provider = new AdminPartyDto
                {
                    Id = p.ProviderId,
                    Name = provider?.Name ?? provider?.UserName ?? p.ProviderId,
                    Email = provider?.Email ?? "",
                    UserName = provider?.UserName ?? "",
                    Roles = roles,
                    PhoneNumber = provider?.PhoneNumber,
                    EmailConfirmed = provider?.EmailConfirmed ?? false,
                    KycStatus = provider?.Kyc?.Status.ToString() ?? "None"
                },
                AvailableBalance = availableBalance,
                WithdrawnTotal = withdrawnTotal,
                PendingPayoutsTotal = summaryResult.Value?.Payouts?.Where(x => x.Status is PayoutStatus.Requested or PayoutStatus.UnderReview or PayoutStatus.Processing).Sum(x => x.Amount) ?? 0m,
                PreviousPayouts = previousPayouts.Select(prev =>
                {
                    var (prevLabel, prevMasked) = ExtractMaskedPayoutDestination(provider, prev.PayoutMethodId);
                    return new AdminPayoutListItemDto
                    {
                        Id = prev.Id,
                        ProviderId = prev.ProviderId,
                        ProviderName = provider?.Name ?? prev.ProviderId,
                        Amount = prev.Amount,
                        Currency = prev.Currency,
                        Status = prev.Status.ToString(),
                        PayoutMethodId = prev.PayoutMethodId,
                        PayoutMethodLabel = prevLabel,
                        MaskedDestination = prevMasked,
                        GatewayReference = prev.GatewayReference,
                        CreatedAt = prev.CreatedAt,
                        CompletedAt = prev.CompletedAt
                    };
                }).ToList()
            };

            return Ok(ApiResponse.Ok("Payout detail loaded", detail));
        }

        // POST: api/admin/payouts/{id}/approve
        [HttpPost("payouts/{id}/approve")]
        public async Task<IActionResult> ApprovePayout(string id, [FromBody] AdminPayoutActionRequest request)
        {
            var filter = Builders<PayoutRequest>.Filter.And(
                Builders<PayoutRequest>.Filter.Eq(x => x.Id, id),
                Builders<PayoutRequest>.Filter.Eq(x => x.Status, PayoutStatus.Requested)
            );

            var now = DateTime.UtcNow;
            var update = Builders<PayoutRequest>.Update
                .Set(x => x.Status, PayoutStatus.UnderReview)
                .Set(x => x.UpdatedAt, now);

            var p = await _context.PayoutRequests.FindOneAndUpdateAsync(
                filter,
                update,
                new FindOneAndUpdateOptions<PayoutRequest> { ReturnDocument = ReturnDocument.After });

            if (p is null)
            {
                var existing = await _context.PayoutRequests.Find(x => x.Id == id).FirstOrDefaultAsync();
                if (existing is null)
                    return NotFound(ApiResponse.Error("Payout request not found.", HttpContext.TraceIdentifier));

                _audit?.Record("financial_action_denied", CurrentAdminEmail, false, new { action = "payout_approve", payoutId = id, currentStatus = existing.Status.ToString() });
                return Conflict(ApiResponse.Error($"Payout cannot be approved from current status '{existing.Status}'.", HttpContext.TraceIdentifier));
            }

            await _context.WorkroomAuditEvents.InsertOneAsync(new WorkroomAuditEvent
            {
                ActorId = CurrentAdminId,
                ActorRole = "Admin",
                Action = "Payout.Approved",
                EntityType = "PayoutRequest",
                EntityId = p.Id,
                PreviousState = PayoutStatus.Requested.ToString(),
                NewState = PayoutStatus.UnderReview.ToString(),
                Reason = request.Reason
            });

            _audit?.Record("admin_payout_approved", CurrentAdminEmail, true, new { payoutId = p.Id, p.ProviderId, p.Amount, p.Currency });

            return Ok(ApiResponse.Ok("Payout request approved for processing.", p));
        }

        // POST: api/admin/payouts/{id}/reject
        [HttpPost("payouts/{id}/reject")]
        public async Task<IActionResult> RejectPayout(string id, [FromBody] AdminPayoutActionRequest request)
        {
            var existing = await _context.PayoutRequests.Find(x => x.Id == id).FirstOrDefaultAsync();
            if (existing is null)
                return NotFound(ApiResponse.Error("Payout request not found.", HttpContext.TraceIdentifier));

            var previousState = existing.Status.ToString();
            var now = DateTime.UtcNow;
            var update = Builders<PayoutRequest>.Update
                .Set(x => x.Status, PayoutStatus.Cancelled)
                .Set(x => x.UpdatedAt, now);

            var filter = Builders<PayoutRequest>.Filter.And(
                Builders<PayoutRequest>.Filter.Eq(x => x.Id, id),
                Builders<PayoutRequest>.Filter.Or(
                    Builders<PayoutRequest>.Filter.Eq(x => x.Status, PayoutStatus.Requested),
                    Builders<PayoutRequest>.Filter.Eq(x => x.Status, PayoutStatus.UnderReview)
                )
            );

            var p = await _context.PayoutRequests.FindOneAndUpdateAsync(
                filter,
                update,
                new FindOneAndUpdateOptions<PayoutRequest> { ReturnDocument = ReturnDocument.After });

            if (p is null)
            {
                _audit?.Record("financial_action_denied", CurrentAdminEmail, false, new { action = "payout_reject", payoutId = id, currentStatus = existing.Status.ToString() });
                return Conflict(ApiResponse.Error($"Payout cannot be rejected from status '{existing.Status}'.", HttpContext.TraceIdentifier));
            }

            await _context.WorkroomAuditEvents.InsertOneAsync(new WorkroomAuditEvent
            {
                ActorId = CurrentAdminId,
                ActorRole = "Admin",
                Action = "Payout.Rejected",
                EntityType = "PayoutRequest",
                EntityId = p.Id,
                PreviousState = previousState,
                NewState = PayoutStatus.Cancelled.ToString(),
                Reason = request.Reason
            });

            _audit?.Record("admin_payout_rejected", CurrentAdminEmail, true, new { payoutId = p.Id, p.ProviderId, reason = request.Reason });

            return Ok(ApiResponse.Ok("Payout request rejected.", p));
        }

        // POST: api/admin/payouts/{id}/process
        [HttpPost("payouts/{id}/process")]
        public async Task<IActionResult> MarkPayoutProcessed(string id, [FromBody] AdminPayoutActionRequest request)
        {
            var existing = await _context.PayoutRequests.Find(x => x.Id == id).FirstOrDefaultAsync();
            if (existing is null)
                return NotFound(ApiResponse.Error("Payout request not found.", HttpContext.TraceIdentifier));

            if (existing.Status == PayoutStatus.Completed)
                return Conflict(ApiResponse.Error("Payout request has already been processed.", HttpContext.TraceIdentifier));

            var previousState = existing.Status.ToString();
            var now = DateTime.UtcNow;
            var reference = string.IsNullOrWhiteSpace(request.Reference) ? $"ADMIN_SETTLE_{Guid.NewGuid():N}" : request.Reference.Trim();

            var update = Builders<PayoutRequest>.Update
                .Set(x => x.Status, PayoutStatus.Completed)
                .Set(x => x.CompletedAt, now)
                .Set(x => x.UpdatedAt, now)
                .Set(x => x.GatewayReference, reference);

            var filter = Builders<PayoutRequest>.Filter.And(
                Builders<PayoutRequest>.Filter.Eq(x => x.Id, id),
                Builders<PayoutRequest>.Filter.Or(
                    Builders<PayoutRequest>.Filter.Eq(x => x.Status, PayoutStatus.Requested),
                    Builders<PayoutRequest>.Filter.Eq(x => x.Status, PayoutStatus.UnderReview),
                    Builders<PayoutRequest>.Filter.Eq(x => x.Status, PayoutStatus.Processing)
                )
            );

            var p = await _context.PayoutRequests.FindOneAndUpdateAsync(
                filter,
                update,
                new FindOneAndUpdateOptions<PayoutRequest> { ReturnDocument = ReturnDocument.After });

            if (p is null)
            {
                _audit?.Record("financial_action_denied", CurrentAdminEmail, false, new { action = "payout_process", payoutId = id, currentStatus = existing.Status.ToString() });
                return Conflict(ApiResponse.Error($"Payout cannot be marked processed from status '{existing.Status}'.", HttpContext.TraceIdentifier));
            }

            var key = $"admin-payout:{p.Id}";
            var existingTx = await _context.FinancialTransactions.Find(x => x.IdempotencyKey == key).FirstOrDefaultAsync();
            if (existingTx is null)
            {
                var payoutTx = new FinancialTransaction
                {
                    ProviderId = p.ProviderId,
                    GrossAmount = p.Amount,
                    Currency = p.Currency,
                    TransactionType = FinancialTransactionType.PayoutCompleted,
                    PaymentStatus = PaymentStatus.Completed,
                    IdempotencyKey = key,
                    CreatedAt = p.UpdatedAt,
                    ReleasedAt = p.CompletedAt
                };
                await _context.FinancialTransactions.InsertOneAsync(payoutTx);
            }

            await _context.WorkroomAuditEvents.InsertOneAsync(new WorkroomAuditEvent
            {
                ActorId = CurrentAdminId,
                ActorRole = "Admin",
                Action = "Payout.Processed",
                EntityType = "PayoutRequest",
                EntityId = p.Id,
                PreviousState = previousState,
                NewState = PayoutStatus.Completed.ToString(),
                Reason = $"{request.Reason} (Ref: {p.GatewayReference})"
            });

            _audit?.Record("admin_payout_processed", CurrentAdminEmail, true, new { payoutId = p.Id, p.ProviderId, p.Amount, reference = p.GatewayReference });

            return Ok(ApiResponse.Ok("Payout marked as completed and ledger updated.", p));
        }

        // GET: api/admin/escrows
        [HttpGet("escrows")]
        public async Task<IActionResult> GetEscrows([FromQuery] AdminEscrowListQuery query)
        {
            var page = query.Page <= 0 ? 1 : query.Page;
            var pageSize = query.PageSize <= 0 ? 15 : Math.Min(query.PageSize, 100);

            var builder = Builders<WorkroomMilestone>.Filter;
            var filter = builder.Empty;

            if (!string.IsNullOrWhiteSpace(query.Status) && query.Status != "all")
            {
                if (Enum.TryParse<WorkroomEscrowStatus>(query.Status, true, out var escrowStatusEnum))
                {
                    filter = builder.And(filter, builder.Eq(x => x.EscrowStatus, escrowStatusEnum));
                }
                else if (Enum.TryParse<WorkroomMilestoneStatus>(query.Status, true, out var milestoneStatusEnum))
                {
                    filter = builder.And(filter, builder.Eq(x => x.MilestoneStatus, milestoneStatusEnum));
                }
            }

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var s = query.Search.Trim();
                var searchFilter = builder.Or(
                    builder.Regex(x => x.Title, new MongoDB.Bson.BsonRegularExpression(s, "i")),
                    builder.Eq(x => x.Id, s),
                    builder.Eq(x => x.EngagementId, s)
                );
                filter = builder.And(filter, searchFilter);
            }

            var totalCount = await _context.WorkroomMilestones.CountDocumentsAsync(filter);
            var milestones = await _context.WorkroomMilestones
                .Find(filter)
                .SortByDescending(x => x.UpdatedAt)
                .Skip((page - 1) * pageSize)
                .Limit(pageSize)
                .ToListAsync();

            var engagementIds = milestones.Select(m => m.EngagementId).Where(id => !string.IsNullOrEmpty(id)).Distinct().ToList();
            var engagements = engagementIds.Count > 0
                ? await _context.WorkroomEngagements.Find(e => engagementIds.Contains(e.Id)).ToListAsync()
                : new List<WorkroomEngagement>();
            var engMap = engagements.ToDictionary(e => e.Id, e => e);

            var userIds = engagements.Select(e => e.ClientId).Concat(engagements.Select(e => e.ProviderId)).Where(u => !string.IsNullOrEmpty(u)).Distinct().ToList();
            var users = userIds.Count > 0
                ? await _context.ApplicationUsers.Find(u => userIds.Contains(u.Id.ToString())).ToListAsync()
                : new List<ApplicationUser>();
            var userMap = users.ToDictionary(u => u.Id.ToString(), u => u);

            var milestoneIds = milestones.Select(m => m.Id).ToList();
            var deliverables = milestoneIds.Count > 0
                ? await _context.Deliverables.Find(d => milestoneIds.Contains(d.MilestoneId)).ToListAsync()
                : new List<Deliverable>();

            var items = milestones.Select(m =>
            {
                var eng = !string.IsNullOrEmpty(m.EngagementId) ? engMap.GetValueOrDefault(m.EngagementId) : null;
                var client = eng != null && !string.IsNullOrEmpty(eng.ClientId) ? userMap.GetValueOrDefault(eng.ClientId) : null;
                var provider = eng != null && !string.IsNullOrEmpty(eng.ProviderId) ? userMap.GetValueOrDefault(eng.ProviderId) : null;
                var delivCount = deliverables.Count(d => d.MilestoneId == m.Id);

                var hasDispute = m.MilestoneStatus == WorkroomMilestoneStatus.Disputed || m.DisputeOutcome == DisputeOutcome.Open || m.DisputeOpenedAt != null;
                var canRelease = m.EscrowStatus == WorkroomEscrowStatus.Funded && m.MilestoneStatus != WorkroomMilestoneStatus.Paid && m.DisputeOutcome != DisputeOutcome.Open;

                return new AdminEscrowMilestoneItemDto
                {
                    MilestoneId = m.Id,
                    EngagementId = m.EngagementId ?? "",
                    EngagementTitle = eng?.Title ?? m.EngagementId ?? "",
                    Title = m.Title ?? "Untitled Milestone",
                    ClientName = client?.Name ?? client?.UserName ?? eng?.ClientId ?? "Client",
                    ProviderName = provider?.Name ?? provider?.UserName ?? eng?.ProviderId ?? "Provider",
                    Amount = m.Amount,
                    Currency = m.Currency ?? "EUR",
                    Status = m.EscrowStatus.ToString(),
                    FundedAt = m.EscrowStatus == WorkroomEscrowStatus.Funded ? m.UpdatedAt : null,
                    DueDate = m.DueDate,
                    DeliverablesCount = delivCount,
                    CanRelease = canRelease,
                    HasDispute = hasDispute
                };
            }).ToList();

            return Ok(ApiResponse.Ok("Escrows fetched successfully", new
            {
                items,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            }));
        }

        // GET: api/admin/commission/config
        [HttpGet("commission/config")]
        public IActionResult GetCommissionConfig()
        {
            var rate = PlatformCommerceConstants.CommissionRate * 100m;
            var config = new AdminCommissionConfigDto
            {
                DefaultCommissionPercentage = rate,
                MinimumFeeAmount = 0m,
                Currency = "EUR",
                CategoryOverrides = new Dictionary<string, decimal>(),
                IsLocked = true,
                PolicyStatement = "Flat 12% platform commission across all marketplace engagements. Service provider tiers govern matching priority and profile ranking only.",
                Tiers = new List<AdminCommissionTierDto>
                {
                    new() { TierLevel = 1, TierName = "Tier 1 — Standard", CommissionPercentage = rate, Eligibility = "Default / Onboarding", MatchingPriority = "Standard Matching Queue" },
                    new() { TierLevel = 2, TierName = "Tier 2 — Verified", CommissionPercentage = rate, Eligibility = "Credential / Profile Verification Approved", MatchingPriority = "Elevated Matching & Search Rank" },
                    new() { TierLevel = 3, TierName = "Tier 3 — Pro", CommissionPercentage = rate, Eligibility = "Server-Side Performance & Volume Evaluation", MatchingPriority = "Priority Client Matching" },
                    new() { TierLevel = 4, TierName = "Tier 4 — Elite", CommissionPercentage = rate, Eligibility = "Top 1% Quality, Dispute-Free & High-Volume", MatchingPriority = "Dedicated Enterprise Matching" }
                }
            };

            return Ok(ApiResponse.Ok("Commission configuration loaded", config));
        }

        // PUT: api/admin/commission/config
        [HttpPut("commission/config")]
        public IActionResult UpdateCommissionConfig([FromBody] AdminCommissionConfigDto request)
        {
            return BadRequest(ApiResponse.Error("Platform commission rate is fixed at 12% by architectural policy and cannot be mutated dynamically.", HttpContext.TraceIdentifier));
        }

        private static (string MethodLabel, string MaskedDestination) ExtractMaskedPayoutDestination(ApplicationUser? provider, string payoutMethodId)
        {
            var settings = provider?.ServiceProviderProfile?.FinancialSettings;
            var method = settings?.PayoutMethods?.FirstOrDefault(m => m.Id == payoutMethodId);
            if (method != null)
            {
                return (method.DisplayName, method.MaskedDescriptor);
            }

            return ("Bank Transfer (Default)", "**** 4242");
        }
    }
}
