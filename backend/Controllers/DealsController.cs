using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using WebApp.DbContext;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services;
using WebApp.Services.Interface;
using WebApp.Services.Repository;
using WebApp.Services.Implementations;

namespace WebApp.Controllers
{
    [Authorize]
    [Route("api/deals")]
    [ApiController]
    public class DealsController : ControllerBase
    {
        private readonly ICompanyService _companyService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly MongoDbContext _context;
        private readonly INotificationService? _notifications;
        private readonly ILogger<DealsController> _logger;

        public DealsController(
            ICompanyService companyService,
            UserManager<ApplicationUser> userManager,
            MongoDbContext context,
            ILogger<DealsController> logger,
            INotificationService? notifications = null)
        {
            _companyService = companyService;
            _userManager = userManager;
            _context = context;
            _logger = logger;
            _notifications = notifications;
        }

        private string GetUserId() =>
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? throw new UnauthorizedAccessException();

        private static string ComputeSha256(string raw)
        {
            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(raw));
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }

        private string GetClientIpHash()
        {
            var ip = HttpContext?.Connection?.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            return ComputeSha256(ip);
        }

        // GET /api/deals (Investor / Company deals)
        [HttpGet]
        public async Task<ActionResult<List<DealStatusResponse>>> GetMyDeals()
        {
            try
            {
                var userId = GetUserId();
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null || (user.Onboarding?.Phase ?? 0) < 1)
                    return StatusCode(403, new { error = "Universal Phase 1 must be complete." });

                var investorId = user.InvestorProfile?.InvestorId;
                var result = await _companyService.GetDealsForParticipantAsync(userId, investorId);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error listing participant deals");
                return BadRequest(new { error = ex.Message });
            }
        }

        // GET /api/deals/{dealId}
        [HttpGet("{dealId}")]
        public async Task<IActionResult> GetDeal(string dealId)
        {
            try
            {
                var userId = GetUserId();
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null)
                    return NotFound(ApiResponse.Error("Deal not found.", HttpContext.TraceIdentifier));

                bool isCreator = deal.CreatorId == userId;
                bool isEntrepreneur = deal.EntrepreneurId == userId;
                bool isAuthorized = isCreator || isEntrepreneur || User.IsInRole("Admin");

                if (!isAuthorized)
                    return StatusCode(403, ApiResponse.Error("Unauthorized to access this deal."));

                // Check and update expired status on latest revision
                if (deal.DealStage == "OFFER_NEGOTIATION" && deal.Revisions?.Count > 0)
                {
                    var latest = deal.Revisions[^1];
                    if (latest.ExpiresAt.HasValue && latest.ExpiresAt.Value < DateTime.UtcNow && latest.Status == "pending")
                    {
                        latest.Status = "expired";
                        await _context.DealExecutions.ReplaceOneAsync(d => d.Id == deal.Id, deal);
                    }
                }

                var dto = await MapEquityDealDtoAsync(deal);
                return Ok(ApiResponse.Ok("OK", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // GET /api/deals/{dealId}/revisions
        [HttpGet("{dealId}/revisions")]
        public async Task<IActionResult> GetDealRevisions(string dealId)
        {
            try
            {
                var userId = GetUserId();
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null)
                    return NotFound(ApiResponse.Error("Deal not found.", HttpContext.TraceIdentifier));

                bool isCreator = deal.CreatorId == userId;
                bool isEntrepreneur = deal.EntrepreneurId == userId;
                if (!isCreator && !isEntrepreneur && !User.IsInRole("Admin"))
                    return StatusCode(403, ApiResponse.Error("Unauthorized to access this deal."));

                var revisions = (deal.Revisions ?? new List<TermSheetRevision>())
                    .Select(MapRevisionDto)
                    .ToList();

                return Ok(ApiResponse.Ok("OK", revisions));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // POST /api/deals/{dealId}/counter
        [HttpPost("{dealId}/counter")]
        public async Task<IActionResult> CounterOffer(string dealId, [FromBody] CounterEquityOfferRequest request)
        {
            try
            {
                var userId = GetUserId();
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null)
                    return NotFound(ApiResponse.Error("Deal not found.", HttpContext.TraceIdentifier));

                bool isCreator = deal.CreatorId == userId;
                bool isEntrepreneur = deal.EntrepreneurId == userId;
                if (!isCreator && !isEntrepreneur)
                    return StatusCode(403, ApiResponse.Error("Unauthorized to counter this deal."));

                if (deal.DealStage != "OFFER_NEGOTIATION")
                    return UnprocessableEntity(ApiResponse.Error($"Cannot counter an offer when deal stage is '{deal.DealStage}'."));

                // Validate turn ownership
                string callerRole = isCreator ? "creator" : "entrepreneur";
                if (!string.Equals(deal.CurrentTurn, callerRole, StringComparison.OrdinalIgnoreCase))
                {
                    string waitingOn = deal.CurrentTurn == "creator" ? "creator" : "entrepreneur";
                    return UnprocessableEntity(ApiResponse.Error($"It is currently the {waitingOn}'s turn to respond."));
                }

                // Validate latest revision expiry
                var latestRev = deal.Revisions?.Count > 0 ? deal.Revisions[^1] : null;
                if (latestRev != null && latestRev.ExpiresAt.HasValue && latestRev.ExpiresAt.Value < DateTime.UtcNow)
                {
                    latestRev.Status = "expired";
                    await _context.DealExecutions.ReplaceOneAsync(d => d.Id == deal.Id, deal);
                    return UnprocessableEntity(ApiResponse.Error("The current offer revision has expired and cannot be countered."));
                }

                if (deal.DealType == "FULL_BUYOUT")
                {
                    decimal purchasePrice = request.BuyoutTerms?.PurchasePrice ?? request.PurchasePrice ?? 0;
                    if (purchasePrice <= 0)
                        return UnprocessableEntity(ApiResponse.Error("Purchase price must be greater than zero."));

                    int handoverWeeks = request.BuyoutTerms?.HandoverPeriodWeeks ?? request.HandoverPeriodWeeks ?? 2;
                    int transitionWeeks = request.BuyoutTerms?.TransitionSupportWeeks ?? request.TransitionSupportWeeks ?? 4;
                    var includedAssets = request.BuyoutTerms?.IncludedAssets ?? request.IncludedAssets ?? new List<string>();
                    var expiresAt = request.ExpiresAt ?? request.BuyoutTerms?.ExpiresAt ?? DateTime.UtcNow.AddDays(14);
                    var notes = request.Notes ?? request.BuyoutTerms?.Notes;

                    var buyoutTerms = new BuyoutTerms
                    {
                        PurchasePrice = purchasePrice,
                        HandoverPeriodWeeks = handoverWeeks,
                        TransitionSupportWeeks = transitionWeeks,
                        IncludedAssets = includedAssets.Where(a => !string.IsNullOrWhiteSpace(a)).Select(a => a.Trim()).ToList(),
                        ExpiresAt = expiresAt,
                        Notes = notes?.Trim()
                    };

                    if (latestRev != null)
                    {
                        latestRev.Status = "countered";
                        latestRev.RespondedAt = DateTime.UtcNow;
                    }

                    var newRev = new TermSheetRevision
                    {
                        RevisionNumber = (deal.Revisions?.Count ?? 0) + 1,
                        ProposedByRole = callerRole,
                        ProposedByPrincipalId = userId,
                        OfferedByRole = callerRole,
                        OfferedByUserId = userId,
                        Status = "pending",
                        BuyoutTerms = buyoutTerms,
                        Note = notes?.Trim(),
                        CreatedAt = DateTime.UtcNow,
                        ExpiresAt = buyoutTerms.ExpiresAt
                    };

                    deal.Revisions ??= new List<TermSheetRevision>();
                    deal.Revisions.Add(newRev);

                    string nextTurn = callerRole == "creator" ? "entrepreneur" : "creator";
                    deal.CurrentTurn = nextTurn;
                    deal.BuyoutTerms = buyoutTerms;
                    deal.UpdatedAt = DateTime.UtcNow;
                    var oldVersion = deal.Version;
                    deal.Version += 1;

                    var replaceResult = await _context.DealExecutions.ReplaceOneAsync(
                        d => d.Id == deal.Id && d.Version == oldVersion,
                        deal
                    );

                    if (replaceResult.ModifiedCount == 0)
                    {
                        return Conflict(ApiResponse.Error("A concurrent change was made to this deal. Please refresh and try again."));
                    }

                    await PostMessengerEventAsync(deal.ConversationId, userId,
                        $"{callerRole.ToUpperInvariant()} countered with a €{buyoutTerms.PurchasePrice:N0} Buyout Offer (Revision V{newRev.RevisionNumber}).");

                    string targetUserId = callerRole == "creator" ? deal.EntrepreneurId! : deal.CreatorId!;
                    if (Guid.TryParse(targetUserId, out var targetGuid) && _notifications != null)
                    {
                        try
                        {
                            await _notifications.NotifyUser(
                                targetGuid,
                                "Buyout Counter Offer Received",
                                $"A counter-offer of €{buyoutTerms.PurchasePrice:N0} was submitted for your project deal (V{newRev.RevisionNumber})."
                            );
                        }
                        catch { }
                    }

                    await LogAuditAsync(deal.IdeaId ?? "", deal.Id, newRev.RevisionNumber, userId, "buyout_offer_countered");

                    var dto = await MapEquityDealDtoAsync(deal);
                    return Ok(ApiResponse.Ok("Counter-offer submitted successfully.", dto));
                }

                // Validate terms (Equity Partnership)
                if (request.EquityPercentage <= 0 || request.EquityPercentage >= 100)
                    return UnprocessableEntity(ApiResponse.Error("Equity percentage must be between 0 and 100."));

                if (string.IsNullOrWhiteSpace(request.CreatorRole))
                    return UnprocessableEntity(ApiResponse.Error("Creator role is required."));

                if (request.CashComponent < 0)
                    return UnprocessableEntity(ApiResponse.Error("Cash component cannot be negative."));

                if (request.VestingEnabled)
                {
                    if (request.VestingMonths <= 0)
                        return UnprocessableEntity(ApiResponse.Error("Vesting months must be greater than 0."));
                    if (request.CliffMonths < 0 || request.CliffMonths > request.VestingMonths)
                        return UnprocessableEntity(ApiResponse.Error("Cliff months must be between 0 and total vesting months."));
                }

                var counterTerms = new EquityTerms
                {
                    EquityPercentage = request.EquityPercentage,
                    CreatorRole = request.CreatorRole.Trim(),
                    CashComponent = request.CashComponent,
                    VestingEnabled = request.VestingEnabled,
                    VestingMonths = request.VestingEnabled ? request.VestingMonths : 0,
                    CliffMonths = request.VestingEnabled ? request.CliffMonths : 0,
                    Responsibilities = request.Responsibilities?.Where(r => !string.IsNullOrWhiteSpace(r)).Select(r => r.Trim()).ToList() ?? new(),
                    TimeCommitment = request.TimeCommitment?.Trim() ?? "Part-time",
                    ExpiresAt = request.ExpiresAt ?? DateTime.UtcNow.AddDays(14),
                    Notes = request.Notes?.Trim()
                };

                // Mark current revision superseded / countered
                if (latestRev != null)
                {
                    latestRev.Status = "countered";
                    latestRev.RespondedAt = DateTime.UtcNow;
                }

                var newEquityRev = new TermSheetRevision
                {
                    RevisionNumber = (deal.Revisions?.Count ?? 0) + 1,
                    ProposedByRole = callerRole,
                    ProposedByPrincipalId = userId,
                    OfferedByRole = callerRole,
                    OfferedByUserId = userId,
                    Status = "pending",
                    EquityTerms = counterTerms,
                    Note = request.Notes?.Trim(),
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = counterTerms.ExpiresAt
                };

                deal.Revisions ??= new List<TermSheetRevision>();
                deal.Revisions.Add(newEquityRev);

                string nextEquityTurn = callerRole == "creator" ? "entrepreneur" : "creator";
                deal.CurrentTurn = nextEquityTurn;
                deal.EquityTerms = counterTerms;
                deal.UpdatedAt = DateTime.UtcNow;
                var oldEquityVersion = deal.Version;
                deal.Version += 1;

                // Optimistic concurrency replace
                var replaceEquityResult = await _context.DealExecutions.ReplaceOneAsync(
                    d => d.Id == deal.Id && d.Version == oldEquityVersion,
                    deal
                );

                if (replaceEquityResult.ModifiedCount == 0)
                {
                    return Conflict(ApiResponse.Error("A concurrent change was made to this deal. Please refresh and try again."));
                }

                // Messenger event
                await PostMessengerEventAsync(deal.ConversationId, userId,
                    $"{callerRole.ToUpperInvariant()} countered with a {counterTerms.EquityPercentage}% equity offer (Revision V{newEquityRev.RevisionNumber}).");

                // Notifications
                string targetEquityUserId = callerRole == "creator" ? deal.EntrepreneurId! : deal.CreatorId!;
                if (Guid.TryParse(targetEquityUserId, out var targetEquityGuid) && _notifications != null)
                {
                    try
                    {
                        await _notifications.NotifyUser(
                            targetEquityGuid,
                            "Counter Offer Received",
                            $"A counter-offer of {counterTerms.EquityPercentage}% was submitted for your project deal (V{newEquityRev.RevisionNumber})."
                        );
                    }
                    catch { }
                }

                // Audit log
                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, newEquityRev.RevisionNumber, userId, "equity_offer_countered");

                var equityDto = await MapEquityDealDtoAsync(deal);
                return Ok(ApiResponse.Ok("Counter-offer submitted successfully.", equityDto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // POST /api/deals/{dealId}/accept
        [HttpPost("{dealId}/accept")]
        public async Task<IActionResult> AcceptOffer(string dealId)
        {
            try
            {
                var userId = GetUserId();
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null)
                    return NotFound(ApiResponse.Error("Deal not found.", HttpContext.TraceIdentifier));

                bool isCreator = deal.CreatorId == userId;
                bool isEntrepreneur = deal.EntrepreneurId == userId;
                if (!isCreator && !isEntrepreneur)
                    return StatusCode(403, ApiResponse.Error("Unauthorized to accept this deal."));

                var latestRev = deal.Revisions?.Count > 0 ? deal.Revisions[^1] : null;
                if (latestRev == null)
                    return UnprocessableEntity(ApiResponse.Error("No offer revisions found to accept."));

                // Idempotency: if already accepted
                if (deal.DealType == "FULL_BUYOUT" && deal.DealStage == "BUYOUT_TERMS_ACCEPTED" && latestRev.Status == "accepted")
                {
                    return Ok(ApiResponse.Ok("Buyout terms already accepted.", await MapEquityDealDtoAsync(deal)));
                }

                if (deal.DealStage != "OFFER_NEGOTIATION")
                    return UnprocessableEntity(ApiResponse.Error($"Cannot accept an offer when deal stage is '{deal.DealStage}'."));

                string callerRole = isCreator ? "creator" : "entrepreneur";
                if (!string.Equals(deal.CurrentTurn, callerRole, StringComparison.OrdinalIgnoreCase))
                {
                    return UnprocessableEntity(ApiResponse.Error($"It is currently the other party's turn to respond."));
                }

                if (latestRev.ExpiresAt.HasValue && latestRev.ExpiresAt.Value < DateTime.UtcNow)
                {
                    latestRev.Status = "expired";
                    await _context.DealExecutions.ReplaceOneAsync(d => d.Id == deal.Id, deal);
                    return UnprocessableEntity(ApiResponse.Error("The offer has expired and cannot be accepted."));
                }

                latestRev.Status = "accepted";
                latestRev.RespondedAt = DateTime.UtcNow;

                if (deal.DealType == "FULL_BUYOUT")
                {
                    deal.DealStage = "BUYOUT_TERMS_ACCEPTED";
                    deal.CurrentTurn = "";
                    deal.AcceptedRevisionNumber = latestRev.RevisionNumber;
                    deal.AcceptedRevisionId = latestRev.RevisionNumber.ToString();
                    deal.AcceptedAt = DateTime.UtcNow;
                    deal.UpdatedAt = DateTime.UtcNow;
                    var oldVersion = deal.Version;
                    deal.Version += 1;

                    var replaceResult = await _context.DealExecutions.ReplaceOneAsync(
                        d => d.Id == deal.Id && d.Version == oldVersion,
                        deal
                    );

                    if (replaceResult.ModifiedCount == 0)
                    {
                        return Conflict(ApiResponse.Error("A concurrent update occurred. Please refresh and try again."));
                    }

                    string callerName = isCreator ? "Creator" : "Entrepreneur";
                    await PostMessengerEventAsync(deal.ConversationId, userId,
                        $"{callerName} accepted Buyout Offer V{latestRev.RevisionNumber}. Full Buyout commercial terms agreed.");

                    string targetUserId = isCreator ? deal.EntrepreneurId! : deal.CreatorId!;
                    if (Guid.TryParse(targetUserId, out var targetGuid) && _notifications != null)
                    {
                        try
                        {
                            await _notifications.NotifyUser(
                                targetGuid,
                                "Buyout Offer Accepted",
                                $"Buyout Offer V{latestRev.RevisionNumber} was accepted! Full Buyout commercial terms agreed."
                            );
                        }
                        catch { }
                    }

                    await LogAuditAsync(deal.IdeaId ?? "", deal.Id, latestRev.RevisionNumber, userId, "buyout_offer_accepted");

                    var dto = await MapEquityDealDtoAsync(deal);
                    return Ok(ApiResponse.Ok("Buyout offer accepted successfully. Commercial terms agreed.", dto));
                }

                deal.DealStage = "ROLES_PENDING";
                deal.CurrentTurn = "";
                deal.AcceptedRevisionNumber = latestRev.RevisionNumber;
                deal.AcceptedRevisionId = latestRev.RevisionNumber.ToString();
                deal.AcceptedAt = DateTime.UtcNow;
                deal.UpdatedAt = DateTime.UtcNow;
                var oldEquityVersion = deal.Version;
                deal.Version += 1;

                var replaceEquityResult = await _context.DealExecutions.ReplaceOneAsync(
                    d => d.Id == deal.Id && d.Version == oldEquityVersion,
                    deal
                );

                if (replaceEquityResult.ModifiedCount == 0)
                {
                    return Conflict(ApiResponse.Error("A concurrent update occurred. Please refresh and try again."));
                }

                // Messenger event
                await PostMessengerEventAsync(deal.ConversationId, userId,
                    $"Offer V{latestRev.RevisionNumber} accepted. Next step: Define roles and responsibilities.");

                // Notifications
                string targetEquityAcceptUserId = isCreator ? deal.EntrepreneurId! : deal.CreatorId!;
                if (Guid.TryParse(targetEquityAcceptUserId, out var targetEquityAcceptGuid) && _notifications != null)
                {
                    try
                    {
                        await _notifications.NotifyUser(
                            targetEquityAcceptGuid,
                            "Offer Accepted",
                            $"Equity Offer V{latestRev.RevisionNumber} was accepted! Next step: Define roles and responsibilities."
                        );
                    }
                    catch { }
                }

                // Audit log
                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, latestRev.RevisionNumber, userId, "equity_offer_accepted");

                var equityAcceptDto = await MapEquityDealDtoAsync(deal);
                return Ok(ApiResponse.Ok("Offer accepted successfully. Next stage: Roles & Responsibilities.", equityAcceptDto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // POST /api/deals/{dealId}/reject
        [HttpPost("{dealId}/reject")]
        public async Task<IActionResult> RejectOffer(string dealId)
        {
            try
            {
                var userId = GetUserId();
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null)
                    return NotFound(ApiResponse.Error("Deal not found.", HttpContext.TraceIdentifier));

                bool isCreator = deal.CreatorId == userId;
                bool isEntrepreneur = deal.EntrepreneurId == userId;
                if (!isCreator && !isEntrepreneur)
                    return StatusCode(403, ApiResponse.Error("Unauthorized to reject this deal."));

                var latestRev = deal.Revisions?.Count > 0 ? deal.Revisions[^1] : null;

                // Idempotency
                if (deal.DealStage == "REJECTED" && latestRev?.Status == "rejected")
                {
                    return Ok(ApiResponse.Ok("Offer already rejected.", await MapEquityDealDtoAsync(deal)));
                }

                if (deal.DealStage != "OFFER_NEGOTIATION")
                    return UnprocessableEntity(ApiResponse.Error($"Cannot reject an offer when deal stage is '{deal.DealStage}'."));

                string callerRole = isCreator ? "creator" : "entrepreneur";
                if (!string.Equals(deal.CurrentTurn, callerRole, StringComparison.OrdinalIgnoreCase))
                {
                    return UnprocessableEntity(ApiResponse.Error($"It is currently the other party's turn to respond."));
                }

                if (latestRev != null)
                {
                    latestRev.Status = "rejected";
                    latestRev.RespondedAt = DateTime.UtcNow;
                }

                deal.DealStage = "REJECTED";
                deal.Status = "rejected";
                deal.CurrentTurn = "";
                deal.UpdatedAt = DateTime.UtcNow;
                var oldVersion = deal.Version;
                deal.Version += 1;

                var replaceResult = await _context.DealExecutions.ReplaceOneAsync(
                    d => d.Id == deal.Id && d.Version == oldVersion,
                    deal
                );

                if (replaceResult.ModifiedCount == 0)
                {
                    return Conflict(ApiResponse.Error("A concurrent update occurred. Please refresh and try again."));
                }

                string callerName = isCreator ? "Creator" : "Entrepreneur";
                string dealTypeLabel = deal.DealType == "FULL_BUYOUT" ? "Buyout" : "Equity";
                await PostMessengerEventAsync(deal.ConversationId, userId,
                    $"{callerName} rejected {dealTypeLabel} Offer V{latestRev?.RevisionNumber ?? 1}.");

                string targetUserId = isCreator ? deal.EntrepreneurId! : deal.CreatorId!;
                if (Guid.TryParse(targetUserId, out var targetGuid) && _notifications != null)
                {
                    try
                    {
                        await _notifications.NotifyUser(
                            targetGuid,
                            "Offer Rejected",
                            $"{callerName} has declined the {dealTypeLabel.ToLowerInvariant()} offer."
                        );
                    }
                    catch { }
                }

                string auditAction = deal.DealType == "FULL_BUYOUT" ? "buyout_offer_rejected" : "equity_offer_rejected";
                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, latestRev?.RevisionNumber ?? 1, userId, auditAction);

                var dto = await MapEquityDealDtoAsync(deal);
                return Ok(ApiResponse.Ok("Offer rejected.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // ==========================================
        // PHASE 4: ROLE & RESPONSIBILITY ENDPOINTS
        // ==========================================

        /// <summary>
        /// GET /api/deals/{dealId}/roles
        /// Fetches the bilateral Role & Responsibility agreement for the deal. Auto-seeds if missing.
        /// </summary>
        [HttpGet("{dealId}/roles")]
        public async Task<IActionResult> GetRoleAgreement(string dealId)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var userId = GetUserId();
                var isCreator = deal.CreatorId == userId;
                var isEntrepreneur = deal.EntrepreneurId == userId;
                var isAdmin = User.IsInRole("Admin");

                if (!isCreator && !isEntrepreneur && !isAdmin)
                    return StatusCode(403, ApiResponse.Error("You are not a participant in this deal."));

                if (deal.DealType != "EQUITY_PARTNERSHIP")
                    return UnprocessableEntity(ApiResponse.Error("Role agreements are only applicable to equity partnerships."));

                if (deal.DealStage == "OFFER_NEGOTIATION" || deal.DealStage == "REJECTED" || deal.DealStage == "WITHDRAWN")
                    return UnprocessableEntity(ApiResponse.Error("Deal has not reached the role agreement stage."));

                if (deal.RoleAgreement == null)
                {
                    EnsureSeededRoleAgreement(deal);
                    await _context.DealExecutions.ReplaceOneAsync(d => d.Id == deal.Id, deal);
                }

                var dto = await MapRoleAgreementDtoAsync(deal);
                return Ok(ApiResponse.Ok("Role and responsibility agreement loaded.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// PUT /api/deals/{dealId}/roles
        /// Updates roles, responsibilities, or time commitments. Increments version and invalidates confirmations.
        /// </summary>
        [HttpPut("{dealId}/roles")]
        public async Task<IActionResult> UpdateRoleAgreement(string dealId, [FromBody] UpdateRoleAgreementRequest request)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var userId = GetUserId();
                var isCreator = deal.CreatorId == userId;
                var isEntrepreneur = deal.EntrepreneurId == userId;

                if (!isCreator && !isEntrepreneur)
                    return StatusCode(403, ApiResponse.Error("You are not authorized to edit roles for this deal."));

                if (deal.DealStage != "ROLES_PENDING")
                    return UnprocessableEntity(ApiResponse.Error($"Roles cannot be updated when deal is in {deal.DealStage} stage."));

                if (deal.RoleAgreement == null)
                {
                    EnsureSeededRoleAgreement(deal);
                }

                var agreement = deal.RoleAgreement!;

                // Apply role updates
                if (request.CreatorRole != null && !string.IsNullOrWhiteSpace(request.CreatorRole))
                    agreement.CreatorRole = request.CreatorRole.Trim();

                if (request.EntrepreneurRole != null && !string.IsNullOrWhiteSpace(request.EntrepreneurRole))
                    agreement.EntrepreneurRole = request.EntrepreneurRole.Trim();

                if (request.CreatorResponsibilities != null)
                {
                    agreement.CreatorResponsibilities = request.CreatorResponsibilities
                        .Where(r => !string.IsNullOrWhiteSpace(r))
                        .Select(r => r.Trim().Length > 200 ? r.Trim().Substring(0, 200) : r.Trim())
                        .Distinct()
                        .Take(20)
                        .ToList();
                }

                if (request.EntrepreneurResponsibilities != null)
                {
                    agreement.EntrepreneurResponsibilities = request.EntrepreneurResponsibilities
                        .Where(r => !string.IsNullOrWhiteSpace(r))
                        .Select(r => r.Trim().Length > 200 ? r.Trim().Substring(0, 200) : r.Trim())
                        .Distinct()
                        .Take(20)
                        .ToList();
                }

                if (request.CreatorTimeCommitment != null)
                    agreement.CreatorTimeCommitment = request.CreatorTimeCommitment.Trim();

                if (request.EntrepreneurTimeCommitment != null)
                    agreement.EntrepreneurTimeCommitment = request.EntrepreneurTimeCommitment.Trim();

                if (request.CreatorCommitmentType != null)
                    agreement.CreatorCommitmentType = request.CreatorCommitmentType.Trim();

                if (request.CreatorCommitmentValue.HasValue)
                    agreement.CreatorCommitmentValue = request.CreatorCommitmentValue.Value;

                if (request.EntrepreneurCommitmentType != null)
                    agreement.EntrepreneurCommitmentType = request.EntrepreneurCommitmentType.Trim();

                if (request.EntrepreneurCommitmentValue.HasValue)
                    agreement.EntrepreneurCommitmentValue = request.EntrepreneurCommitmentValue.Value;

                if (request.Notes != null)
                    agreement.Notes = request.Notes.Trim();

                // Material edit increments version and resets confirmations
                agreement.Version++;
                agreement.CreatorConfirmedVersion = 0;
                agreement.EntrepreneurConfirmedVersion = 0;
                agreement.CreatorConfirmedAt = null;
                agreement.EntrepreneurConfirmedAt = null;
                agreement.Status = "AWAITING_CONFIRMATION";
                agreement.LastEditedByRole = isCreator ? "creator" : "entrepreneur";
                agreement.LastEditedByUserId = userId;
                agreement.UpdatedAt = DateTime.UtcNow;

                var oldVersion = deal.Version;
                deal.Version++;
                deal.UpdatedAt = DateTime.UtcNow;

                var replaceResult = await _context.DealExecutions.ReplaceOneAsync(
                    d => d.Id == deal.Id && d.Version == oldVersion,
                    deal
                );

                if (replaceResult.ModifiedCount == 0)
                {
                    return StatusCode(409, ApiResponse.Error("Conflict: Deal was updated concurrently. Please refresh and retry."));
                }

                // Post messenger event
                var editorLabel = isCreator ? "Creator" : "Entrepreneur";
                await PostMessengerEventAsync(
                    deal.ConversationId,
                    userId,
                    $"{editorLabel} updated the roles and responsibilities agreement (Version {agreement.Version}). Both parties must confirm."
                );

                // Send notification to counterparty
                var recipientId = isCreator ? deal.EntrepreneurId : deal.CreatorId;
                if (!string.IsNullOrEmpty(recipientId) && Guid.TryParse(recipientId, out var recipientGuid) && _notifications != null)
                {
                    try
                    {
                        await _notifications.NotifyUser(
                            recipientGuid,
                            "Role Agreement Updated",
                            $"{editorLabel} proposed updates to the roles and responsibilities agreement."
                        );
                    }
                    catch { }
                }

                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, agreement.Version, userId, "roles_updated");

                var dto = await MapRoleAgreementDtoAsync(deal);
                return Ok(ApiResponse.Ok("Role agreement updated.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// POST /api/deals/{dealId}/roles/confirm
        /// Confirms the current version of the role & responsibility agreement for the caller.
        /// </summary>
        [HttpPost("{dealId}/roles/confirm")]
        public async Task<IActionResult> ConfirmRoleAgreement(string dealId)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var userId = GetUserId();
                var isCreator = deal.CreatorId == userId;
                var isEntrepreneur = deal.EntrepreneurId == userId;

                if (!isCreator && !isEntrepreneur)
                    return StatusCode(403, ApiResponse.Error("You are not authorized to confirm roles for this deal."));

                if (deal.DealStage != "ROLES_PENDING")
                    return UnprocessableEntity(ApiResponse.Error($"Roles cannot be confirmed when deal is in {deal.DealStage} stage."));

                if (deal.RoleAgreement == null)
                {
                    EnsureSeededRoleAgreement(deal);
                }

                var agreement = deal.RoleAgreement!;

                // Idempotency: If already confirmed for current version, return immediately
                if (isCreator && agreement.CreatorConfirmedVersion == agreement.Version)
                {
                    var existingDto = await MapRoleAgreementDtoAsync(deal);
                    return Ok(ApiResponse.Ok("Role agreement already confirmed.", existingDto));
                }
                if (!isCreator && agreement.EntrepreneurConfirmedVersion == agreement.Version)
                {
                    var existingDto = await MapRoleAgreementDtoAsync(deal);
                    return Ok(ApiResponse.Ok("Role agreement already confirmed.", existingDto));
                }

                // Record confirmation
                if (isCreator)
                {
                    agreement.CreatorConfirmedVersion = agreement.Version;
                    agreement.CreatorConfirmedAt = DateTime.UtcNow;
                }
                else
                {
                    agreement.EntrepreneurConfirmedVersion = agreement.Version;
                    agreement.EntrepreneurConfirmedAt = DateTime.UtcNow;
                }

                agreement.UpdatedAt = DateTime.UtcNow;

                bool isFullyConfirmed = agreement.CreatorConfirmedVersion == agreement.Version &&
                                       agreement.EntrepreneurConfirmedVersion == agreement.Version;

                if (isFullyConfirmed)
                {
                    agreement.Status = "CONFIRMED";
                    deal.DealStage = "CAP_TABLE_PENDING";
                }
                else
                {
                    agreement.Status = isCreator ? "CREATOR_CONFIRMED" : "ENTREPRENEUR_CONFIRMED";
                }

                var oldVersion = deal.Version;
                deal.Version++;
                deal.UpdatedAt = DateTime.UtcNow;

                var replaceResult = await _context.DealExecutions.ReplaceOneAsync(
                    d => d.Id == deal.Id && d.Version == oldVersion,
                    deal
                );

                if (replaceResult.ModifiedCount == 0)
                {
                    return StatusCode(409, ApiResponse.Error("Conflict: Deal was updated concurrently. Please refresh and retry."));
                }

                var partyLabel = isCreator ? "Creator" : "Entrepreneur";

                if (isFullyConfirmed)
                {
                    await PostMessengerEventAsync(
                        deal.ConversationId,
                        userId,
                        "Roles and responsibilities confirmed by both parties. Next step: Review equity & ownership structure."
                    );

                    // Notify both
                    if (Guid.TryParse(deal.CreatorId, out var cGuid) && _notifications != null)
                    {
                        try { await _notifications.NotifyUser(cGuid, "Roles Confirmed", "Roles and responsibilities fully confirmed. Next step: Equity structure."); } catch { }
                    }
                    if (Guid.TryParse(deal.EntrepreneurId, out var eGuid) && _notifications != null)
                    {
                        try { await _notifications.NotifyUser(eGuid, "Roles Confirmed", "Roles and responsibilities fully confirmed. Next step: Equity structure."); } catch { }
                    }

                    await LogAuditAsync(deal.IdeaId ?? "", deal.Id, agreement.Version, userId, "roles_fully_confirmed");
                }
                else
                {
                    await PostMessengerEventAsync(
                        deal.ConversationId,
                        userId,
                        $"{partyLabel} confirmed the roles and responsibilities agreement (Version {agreement.Version})."
                    );

                    var recipientId = isCreator ? deal.EntrepreneurId : deal.CreatorId;
                    if (!string.IsNullOrEmpty(recipientId) && Guid.TryParse(recipientId, out var recipientGuid) && _notifications != null)
                    {
                        try
                        {
                            await _notifications.NotifyUser(
                                recipientGuid,
                                "Role Confirmation Received",
                                $"{partyLabel} confirmed their responsibilities for Version {agreement.Version}. Your confirmation is required."
                            );
                        }
                        catch { }
                    }

                    await LogAuditAsync(deal.IdeaId ?? "", deal.Id, agreement.Version, userId, isCreator ? "creator_roles_confirmed" : "entrepreneur_roles_confirmed");
                }

                var dto = await MapRoleAgreementDtoAsync(deal);
                return Ok(ApiResponse.Ok(isFullyConfirmed ? "Role agreement fully confirmed." : "Role agreement confirmed.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// POST /api/deals/{dealId}/roles/request-changes
        /// Requests changes on the agreement, incrementing version and invalidating prior confirmations.
        /// </summary>
        [HttpPost("{dealId}/roles/request-changes")]
        public async Task<IActionResult> RequestRoleChanges(string dealId, [FromBody] RequestRoleChangesRequest request)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var userId = GetUserId();
                var isCreator = deal.CreatorId == userId;
                var isEntrepreneur = deal.EntrepreneurId == userId;

                if (!isCreator && !isEntrepreneur)
                    return StatusCode(403, ApiResponse.Error("You are not authorized to request changes for this deal."));

                if (deal.DealStage != "ROLES_PENDING")
                    return UnprocessableEntity(ApiResponse.Error($"Changes cannot be requested when deal is in {deal.DealStage} stage."));

                if (deal.RoleAgreement == null)
                {
                    EnsureSeededRoleAgreement(deal);
                }

                var agreement = deal.RoleAgreement!;

                agreement.Version++;
                agreement.CreatorConfirmedVersion = 0;
                agreement.EntrepreneurConfirmedVersion = 0;
                agreement.CreatorConfirmedAt = null;
                agreement.EntrepreneurConfirmedAt = null;
                agreement.Status = "CHANGES_REQUESTED";
                agreement.Notes = request?.Feedback?.Trim();
                agreement.LastEditedByRole = isCreator ? "creator" : "entrepreneur";
                agreement.LastEditedByUserId = userId;
                agreement.UpdatedAt = DateTime.UtcNow;

                var oldVersion = deal.Version;
                deal.Version++;
                deal.UpdatedAt = DateTime.UtcNow;

                var replaceResult = await _context.DealExecutions.ReplaceOneAsync(
                    d => d.Id == deal.Id && d.Version == oldVersion,
                    deal
                );

                if (replaceResult.ModifiedCount == 0)
                {
                    return StatusCode(409, ApiResponse.Error("Conflict: Deal was updated concurrently. Please refresh and retry."));
                }

                var requesterLabel = isCreator ? "Creator" : "Entrepreneur";
                var feedbackMsg = !string.IsNullOrWhiteSpace(request?.Feedback)
                    ? $"{requesterLabel} requested changes on roles: \"{request.Feedback.Trim()}\""
                    : $"{requesterLabel} requested changes on roles and responsibilities.";

                await PostMessengerEventAsync(deal.ConversationId, userId, feedbackMsg);

                var recipientId = isCreator ? deal.EntrepreneurId : deal.CreatorId;
                if (!string.IsNullOrEmpty(recipientId) && Guid.TryParse(recipientId, out var recipientGuid) && _notifications != null)
                {
                    try
                    {
                        await _notifications.NotifyUser(
                            recipientGuid,
                            "Role Changes Requested",
                            $"{requesterLabel} requested changes on roles and responsibilities."
                        );
                    }
                    catch { }
                }

                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, agreement.Version, userId, "roles_changes_requested");

                var dto = await MapRoleAgreementDtoAsync(deal);
                return Ok(ApiResponse.Ok("Change request registered.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // Helpers
        private async Task<EquityDealDto> MapEquityDealDtoAsync(DealExecution deal)
        {
            ApplicationUser? creatorUser = null;
            try
            {
                if (!string.IsNullOrEmpty(deal.CreatorId))
                    creatorUser = await _userManager.FindByIdAsync(deal.CreatorId);
            }
            catch { }

            ApplicationUser? entUser = null;
            try
            {
                if (!string.IsNullOrEmpty(deal.EntrepreneurId))
                    entUser = await _userManager.FindByIdAsync(deal.EntrepreneurId);
            }
            catch { }

            var idea = !string.IsNullOrEmpty(deal.IdeaId)
                ? await _context.CreatorIdeas.Find(x => x.Id == deal.IdeaId).FirstOrDefaultAsync()
                : null;

            var activeTerms = deal.EquityTerms ?? deal.Revisions?.LastOrDefault()?.EquityTerms ?? new EquityTerms();

            return new EquityDealDto
            {
                Id = deal.Id,
                IdeaId = deal.IdeaId ?? "",
                ProjectName = idea?.Project?.Name ?? deal.CompanyNameSnapshot ?? "Project",
                DealType = deal.DealType,
                DealStage = deal.DealStage,
                Status = deal.Status,
                CreatorId = deal.CreatorId ?? "",
                CreatorName = !string.IsNullOrWhiteSpace(creatorUser?.Name) ? creatorUser.Name : (!string.IsNullOrWhiteSpace(creatorUser?.UserName) ? creatorUser.UserName : "Creator"),
                EntrepreneurId = deal.EntrepreneurId ?? "",
                EntrepreneurName = !string.IsNullOrWhiteSpace(entUser?.Name) ? entUser.Name : (!string.IsNullOrWhiteSpace(entUser?.UserName) ? entUser.UserName : "Entrepreneur"),
                ConversationId = deal.ConversationId ?? "",
                CurrentTurn = deal.CurrentTurn,
                CurrentRevisionNumber = deal.Revisions?.Count ?? 1,
                AcceptedRevisionNumber = deal.AcceptedRevisionNumber,
                AcceptedAt = deal.AcceptedAt,
                ActiveTerms = MapTermsDto(activeTerms),
                BuyoutTerms = deal.BuyoutTerms != null 
                    ? MapBuyoutTermsDto(deal.BuyoutTerms) 
                    : (deal.Revisions?.FirstOrDefault(r => r.RevisionNumber == deal.AcceptedRevisionNumber)?.BuyoutTerms != null 
                        ? MapBuyoutTermsDto(deal.Revisions.FirstOrDefault(r => r.RevisionNumber == deal.AcceptedRevisionNumber)!.BuyoutTerms!) 
                        : (deal.Revisions?.LastOrDefault()?.BuyoutTerms != null 
                            ? MapBuyoutTermsDto(deal.Revisions.LastOrDefault()!.BuyoutTerms!) 
                            : null)),
                Revisions = (deal.Revisions ?? new List<TermSheetRevision>()).Select(MapRevisionDto).ToList(),
                RoleAgreement = deal.RoleAgreement != null ? await MapRoleAgreementDtoAsync(deal) : null,
                CapTableDraft = deal.CapTableDraft != null ? await MapCapTableDraftDtoAsync(deal) : null,
                LegalPackage = deal.LegalPackage != null ? await MapLegalPackageDtoAsync(deal) : null,
                BuyoutLegalPackage = deal.BuyoutLegalPackage != null ? await MapBuyoutLegalPackageDtoAsync(deal) : null,
                BuyoutAssetManifest = deal.BuyoutAssetManifest != null ? MapBuyoutAssetManifestDto(deal.BuyoutAssetManifest) : null,
                BuyoutSigningPackage = deal.BuyoutSigningPackage != null ? await MapBuyoutSigningPackageDtoAsync(deal) : null,
                BuyoutClosing = deal.BuyoutClosing != null ? await MapBuyoutClosingDtoAsync(deal) : null,
                BuyoutHandover = deal.BuyoutHandover != null ? await MapBuyoutHandoverDtoAsync(deal) : null,
                BuyoutSaleRecord = deal.BuyoutSaleRecord != null ? await MapBuyoutSaleRecordDtoAsync(deal) : null,
                SigningPackage = deal.SigningPackage != null ? await MapSigningPackageDtoAsync(deal) : null,
                Activation = deal.Activation != null ? await MapPartnershipActivationDtoAsync(deal) : null,
                CreatedAt = deal.CreatedAt,
                UpdatedAt = deal.UpdatedAt
            };
        }

        private static EquityTermsDto MapTermsDto(EquityTerms t) => new()
        {
            EquityPercentage = t.EquityPercentage,
            CreatorRole = t.CreatorRole,
            CashComponent = t.CashComponent,
            VestingEnabled = t.VestingEnabled,
            VestingMonths = t.VestingMonths,
            CliffMonths = t.CliffMonths,
            Responsibilities = t.Responsibilities ?? new(),
            TimeCommitment = t.TimeCommitment,
            ExpiresAt = t.ExpiresAt,
            Notes = t.Notes
        };

        private void EnsureSeededRoleAgreement(DealExecution deal)
        {
            if (deal.RoleAgreement != null) return;

            var acceptedTerms = deal.EquityTerms ?? deal.Revisions?.LastOrDefault()?.EquityTerms ?? new EquityTerms();

            var creatorResp = acceptedTerms.Responsibilities?.Where(r => !string.IsNullOrWhiteSpace(r)).ToList() ?? new List<string>();
            if (creatorResp.Count == 0)
            {
                creatorResp.Add("Product vision & technical architecture handover");
                creatorResp.Add("Core domain knowledge transfer");
            }

            var creatorRole = !string.IsNullOrWhiteSpace(acceptedTerms.CreatorRole)
                ? acceptedTerms.CreatorRole
                : "Co-founder";

            var creatorCommitment = !string.IsNullOrWhiteSpace(acceptedTerms.TimeCommitment)
                ? acceptedTerms.TimeCommitment
                : "10 hours / week";

            deal.RoleAgreement = new RoleResponsibilityAgreement
            {
                Id = Guid.NewGuid().ToString("N"),
                DealId = deal.Id,
                IdeaId = deal.IdeaId ?? "",
                CreatorRole = creatorRole,
                EntrepreneurRole = "CEO",
                CreatorResponsibilities = creatorResp,
                EntrepreneurResponsibilities = new List<string>
                {
                    "Full business execution & operations",
                    "Capital raising & investor relations",
                    "Team building & key hiring",
                    "Go-to-market & customer acquisition"
                },
                CreatorTimeCommitment = creatorCommitment,
                EntrepreneurTimeCommitment = "Full-time (40 hours / week)",
                CreatorCommitmentType = "HOURS_PER_WEEK",
                EntrepreneurCommitmentType = "FULL_TIME",
                Status = "AWAITING_CONFIRMATION",
                Version = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }

        private async Task<RoleResponsibilityAgreementDto> MapRoleAgreementDtoAsync(DealExecution deal)
        {
            ApplicationUser? creatorUser = null;
            try
            {
                if (!string.IsNullOrEmpty(deal.CreatorId))
                    creatorUser = await _userManager.FindByIdAsync(deal.CreatorId);
            }
            catch { }

            ApplicationUser? entUser = null;
            try
            {
                if (!string.IsNullOrEmpty(deal.EntrepreneurId))
                    entUser = await _userManager.FindByIdAsync(deal.EntrepreneurId);
            }
            catch { }

            var idea = !string.IsNullOrEmpty(deal.IdeaId)
                ? await _context.CreatorIdeas.Find(x => x.Id == deal.IdeaId).FirstOrDefaultAsync()
                : null;

            var acceptedTerms = deal.EquityTerms ?? deal.Revisions?.LastOrDefault()?.EquityTerms ?? new EquityTerms();
            var agreement = deal.RoleAgreement ?? new RoleResponsibilityAgreement();

            return new RoleResponsibilityAgreementDto
            {
                Id = agreement.Id,
                DealId = deal.Id,
                IdeaId = deal.IdeaId ?? "",
                ProjectName = idea?.Project?.Name ?? deal.CompanyNameSnapshot ?? "Project",
                CreatorId = deal.CreatorId ?? "",
                CreatorName = creatorUser?.Name ?? creatorUser?.UserName ?? "Creator",
                EntrepreneurId = deal.EntrepreneurId ?? "",
                EntrepreneurName = entUser?.Name ?? entUser?.UserName ?? "Entrepreneur",
                CreatorRole = agreement.CreatorRole,
                EntrepreneurRole = agreement.EntrepreneurRole,
                CreatorResponsibilities = agreement.CreatorResponsibilities ?? new(),
                EntrepreneurResponsibilities = agreement.EntrepreneurResponsibilities ?? new(),
                CreatorTimeCommitment = agreement.CreatorTimeCommitment,
                EntrepreneurTimeCommitment = agreement.EntrepreneurTimeCommitment,
                CreatorCommitmentType = agreement.CreatorCommitmentType,
                CreatorCommitmentValue = agreement.CreatorCommitmentValue,
                EntrepreneurCommitmentType = agreement.EntrepreneurCommitmentType,
                EntrepreneurCommitmentValue = agreement.EntrepreneurCommitmentValue,
                CreatorConfirmedAt = agreement.CreatorConfirmedAt,
                EntrepreneurConfirmedAt = agreement.EntrepreneurConfirmedAt,
                CreatorConfirmedVersion = agreement.CreatorConfirmedVersion,
                EntrepreneurConfirmedVersion = agreement.EntrepreneurConfirmedVersion,
                Status = agreement.Status,
                Version = agreement.Version,
                LastEditedByRole = agreement.LastEditedByRole,
                Notes = agreement.Notes,
                CommercialTerms = new DealCommercialSummaryDto
                {
                    EquityPercentage = acceptedTerms.EquityPercentage,
                    CreatorRole = acceptedTerms.CreatorRole,
                    CashComponent = acceptedTerms.CashComponent,
                    VestingEnabled = acceptedTerms.VestingEnabled,
                    VestingMonths = acceptedTerms.VestingMonths,
                    CliffMonths = acceptedTerms.CliffMonths,
                    AcceptedRevisionNumber = deal.AcceptedRevisionNumber ?? 1
                },
                CreatedAt = agreement.CreatedAt,
                UpdatedAt = agreement.UpdatedAt
            };
        }

        private static EquityOfferRevisionDto MapRevisionDto(TermSheetRevision r) => new()
        {
            RevisionNumber = r.RevisionNumber,
            OfferedByRole = r.OfferedByRole,
            OfferedByUserId = r.OfferedByUserId,
            Status = r.Status,
            Terms = MapTermsDto(r.EquityTerms ?? new EquityTerms()),
            BuyoutTerms = r.BuyoutTerms != null ? MapBuyoutTermsDto(r.BuyoutTerms) : null,
            Note = r.Note,
            CreatedAt = r.CreatedAt,
            RespondedAt = r.RespondedAt,
            ExpiresAt = r.ExpiresAt
        };

        private static BuyoutTermsDto MapBuyoutTermsDto(BuyoutTerms b) => new()
        {
            PurchasePrice = b.PurchasePrice,
            Currency = "EUR",
            HandoverPeriodWeeks = b.HandoverPeriodWeeks,
            TransitionSupportWeeks = b.TransitionSupportWeeks,
            IncludedAssets = b.IncludedAssets ?? new(),
            ExpiresAt = b.ExpiresAt,
            Notes = b.Notes
        };

        private async Task PostMessengerEventAsync(string? conversationId, string senderId, string message)
        {
            if (string.IsNullOrEmpty(conversationId) || !Guid.TryParse(senderId, out var senderGuid))
                return;

            try
            {
                var msgRepo = HttpContext?.RequestServices?.GetService(typeof(MessagesRepository)) as MessagesRepository;
                if (msgRepo != null && MongoDB.Bson.ObjectId.TryParse(conversationId, out var convoOid))
                {
                    var msg = new ChatMessage
                    {
                        ConversationId = convoOid,
                        SenderId = senderGuid,
                        Message = message,
                        MessageType = "System",
                        CreatedAt = DateTime.UtcNow
                    };
                    await msgRepo.AddAsync(msg);
                }
            }
            catch { }
        }

        private async Task LogAuditAsync(string ideaId, string dealId, int revisionNumber, string userId, string eventType)
        {
            try
            {
                await _context.MarketplaceProjectAccessLogs.InsertOneAsync(new MarketplaceProjectAccessLog
                {
                    IdeaId = ideaId,
                    ProjectInterestId = dealId,
                    UserId = userId,
                    EventType = eventType,
                    Timestamp = DateTime.UtcNow,
                    IpHash = GetClientIpHash(),
                    NdaVersion = $"rev_{revisionNumber}"
                });
            }
            catch { }
        }

        // =========================================================================
        // PHASE 5: SCREEN 03 — EQUITY & OWNERSHIP / CAP TABLE DRAFT ENDPOINTS
        // =========================================================================

        /// <summary>
        /// GET /api/deals/{dealId}/cap-table
        /// Retrieves or initializes the deal-scoped cap table draft.
        /// </summary>
        [HttpGet("{dealId}/cap-table")]
        public async Task<IActionResult> GetCapTableDraft(string dealId)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var userId = GetUserId();
                if (deal.CreatorId != userId && deal.EntrepreneurId != userId)
                    return StatusCode(403, ApiResponse.Error("You are not authorized to view the cap table for this deal."));

                if (deal.DealStage != "CAP_TABLE_PENDING" && deal.DealStage != "LEGAL_REVIEW_PENDING" && deal.DealStage != "ACTIVE")
                    return UnprocessableEntity(ApiResponse.Error($"Cap table cannot be accessed when deal is in {deal.DealStage} stage. Role agreement must be confirmed first."));

                if (deal.RoleAgreement == null || deal.RoleAgreement.Status != "CONFIRMED")
                    return UnprocessableEntity(ApiResponse.Error("Role & Responsibility Agreement must be fully confirmed before entering Cap Table setup."));

                if (deal.CapTableDraft == null)
                {
                    await EnsureSeededCapTableDraftAsync(deal);
                    await _context.DealExecutions.ReplaceOneAsync(d => d.Id == deal.Id, deal);
                }

                var dto = await MapCapTableDraftDtoAsync(deal);
                return Ok(ApiResponse.Ok("Cap table draft retrieved.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// PUT /api/deals/{dealId}/cap-table
        /// Updates the deal cap table draft allocation (subject to locked creator terms and total 100%).
        /// </summary>
        [HttpPut("{dealId}/cap-table")]
        public async Task<IActionResult> UpdateCapTableDraft(string dealId, [FromBody] UpdateCapTableDraftRequest request)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var userId = GetUserId();
                var isCreator = deal.CreatorId == userId;
                var isEntrepreneur = deal.EntrepreneurId == userId;

                if (!isCreator && !isEntrepreneur)
                    return StatusCode(403, ApiResponse.Error("You are not authorized to edit the cap table for this deal."));

                if (deal.DealStage != "CAP_TABLE_PENDING")
                    return UnprocessableEntity(ApiResponse.Error($"Cap table cannot be edited when deal is in {deal.DealStage} stage."));

                if (deal.RoleAgreement == null || deal.RoleAgreement.Status != "CONFIRMED")
                    return UnprocessableEntity(ApiResponse.Error("Role & Responsibility Agreement must be confirmed first."));

                if (deal.CapTableDraft == null)
                {
                    await EnsureSeededCapTableDraftAsync(deal);
                }

                var acceptedTerms = deal.EquityTerms ?? deal.Revisions?.LastOrDefault()?.EquityTerms ?? new EquityTerms();
                var draft = deal.CapTableDraft!;

                // Validate Creator Equity Lock
                var creatorEntry = request.Entries?.FirstOrDefault(e => e.IsCreator || e.StakeholderType == "creator" || e.UserId == deal.CreatorId);
                if (creatorEntry == null)
                {
                    return UnprocessableEntity(ApiResponse.Error("Creator equity allocation entry is required."));
                }

                if (Math.Abs(creatorEntry.EquityPercent - acceptedTerms.EquityPercentage) > 0.001)
                {
                    return UnprocessableEntity(ApiResponse.Error($"Creator equity is locked at {acceptedTerms.EquityPercentage}% from the accepted commercial offer and cannot be modified here."));
                }

                if (creatorEntry.VestingMonths != acceptedTerms.VestingMonths || creatorEntry.CliffMonths != acceptedTerms.CliffMonths)
                {
                    return UnprocessableEntity(ApiResponse.Error("Creator vesting and cliff schedules are locked to the accepted offer."));
                }

                // Validate Total Ownership Sum = 100%
                var totalPercent = (request.Entries ?? new()).Sum(e => e.EquityPercent);
                if (Math.Abs(totalPercent - 100.0) > 0.01)
                {
                    return UnprocessableEntity(ApiResponse.Error($"Total ownership allocation must equal 100% (currently {totalPercent:F1}%)."));
                }

                // Update Draft
                draft.TotalShares = request.TotalShares > 0 ? request.TotalShares : 10_000_000;
                draft.EsopPoolPercent = request.EsopPoolPercent;
                draft.InvestorReservePercent = request.InvestorReservePercent;
                draft.EsopVestingMonths = request.EsopVestingMonths > 0 ? request.EsopVestingMonths : 48;
                draft.Notes = request.Notes;

                draft.Entries = (request.Entries ?? new()).Select(e => new DealCapTableEntry
                {
                    Id = string.IsNullOrEmpty(e.Id) ? Guid.NewGuid().ToString("N") : e.Id,
                    UserId = e.UserId,
                    DisplayName = e.DisplayName,
                    RoleTitle = e.RoleTitle,
                    StakeholderType = e.StakeholderType,
                    ShareClass = string.IsNullOrEmpty(e.ShareClass) ? "common" : e.ShareClass,
                    HasVotingRights = e.HasVotingRights,
                    EquityPercent = e.EquityPercent,
                    SharesGranted = (int)Math.Round(draft.TotalShares * (e.EquityPercent / 100.0)),
                    VestingMonths = e.VestingMonths,
                    CliffMonths = e.CliffMonths,
                    IsCreator = e.IsCreator || e.StakeholderType == "creator" || e.UserId == deal.CreatorId,
                    IsFounder = e.IsFounder || e.StakeholderType == "founder" || e.UserId == deal.EntrepreneurId,
                    IsEsop = e.IsEsop || e.StakeholderType == "esop",
                    IsInvestorReserve = e.IsInvestorReserve || e.StakeholderType == "investor_reserve",
                    IsLocked = e.IsCreator || e.StakeholderType == "creator" || e.UserId == deal.CreatorId
                }).ToList();

                // Increment draft version and invalidate stale confirmations
                draft.Version++;
                draft.CreatorConfirmedVersion = 0;
                draft.EntrepreneurConfirmedVersion = 0;
                draft.CreatorConfirmedAt = null;
                draft.EntrepreneurConfirmedAt = null;
                draft.Status = "AWAITING_CONFIRMATION";
                draft.LastEditedByRole = isCreator ? "creator" : "entrepreneur";
                draft.LastEditedByUserId = userId;
                draft.UpdatedAt = DateTime.UtcNow;

                var oldVersion = deal.Version;
                deal.Version++;
                deal.UpdatedAt = DateTime.UtcNow;

                var replaceResult = await _context.DealExecutions.ReplaceOneAsync(
                    d => d.Id == deal.Id && d.Version == oldVersion,
                    deal
                );

                if (replaceResult.ModifiedCount == 0)
                {
                    return StatusCode(409, ApiResponse.Error("Conflict: Cap table was updated concurrently. Please refresh and retry."));
                }

                var partyLabel = isCreator ? "Creator" : "Entrepreneur";
                await PostMessengerEventAsync(
                    deal.ConversationId,
                    userId,
                    $"{partyLabel} updated the proposed ownership structure (Version {draft.Version}). Review and bilateral approval required."
                );

                var recipientId = isCreator ? deal.EntrepreneurId : deal.CreatorId;
                if (!string.IsNullOrEmpty(recipientId) && Guid.TryParse(recipientId, out var recipientGuid) && _notifications != null)
                {
                    try
                    {
                        await _notifications.NotifyUser(
                            recipientGuid,
                            "Ownership Structure Updated",
                            $"{partyLabel} updated the cap table to Version {draft.Version}. Please review and approve."
                        );
                    }
                    catch { }
                }

                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, draft.Version, userId, "cap_table_updated");

                var dto = await MapCapTableDraftDtoAsync(deal);
                return Ok(ApiResponse.Ok($"Cap table updated to Version {draft.Version}.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// POST /api/deals/{dealId}/cap-table/approve
        /// Approves the current cap table version. Advancing to LEGAL_REVIEW_PENDING when both parties approve the same version.
        /// </summary>
        [HttpPost("{dealId}/cap-table/approve")]
        public async Task<IActionResult> ApproveCapTableDraft(string dealId)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var userId = GetUserId();
                var isCreator = deal.CreatorId == userId;
                var isEntrepreneur = deal.EntrepreneurId == userId;

                if (!isCreator && !isEntrepreneur)
                    return StatusCode(403, ApiResponse.Error("You are not authorized to approve the cap table for this deal."));

                if (deal.DealStage != "CAP_TABLE_PENDING")
                    return UnprocessableEntity(ApiResponse.Error($"Cap table cannot be approved when deal is in {deal.DealStage} stage."));

                if (deal.RoleAgreement == null || deal.RoleAgreement.Status != "CONFIRMED")
                    return UnprocessableEntity(ApiResponse.Error("Role & Responsibility Agreement must be confirmed first."));

                if (deal.CapTableDraft == null)
                {
                    await EnsureSeededCapTableDraftAsync(deal);
                }

                var draft = deal.CapTableDraft!;

                // Validate Total Ownership Sum = 100%
                var totalPercent = draft.Entries.Sum(e => e.EquityPercent);
                if (Math.Abs(totalPercent - 100.0) > 0.01)
                {
                    return UnprocessableEntity(ApiResponse.Error($"Cannot approve cap table: Total ownership allocation must equal 100% (currently {totalPercent:F1}%)."));
                }

                // Idempotency: If already approved for current version, return immediately
                if (isCreator && draft.CreatorConfirmedVersion == draft.Version)
                {
                    var existingDto = await MapCapTableDraftDtoAsync(deal);
                    return Ok(ApiResponse.Ok("Cap table already approved.", existingDto));
                }
                if (!isCreator && draft.EntrepreneurConfirmedVersion == draft.Version)
                {
                    var existingDto = await MapCapTableDraftDtoAsync(deal);
                    return Ok(ApiResponse.Ok("Cap table already approved.", existingDto));
                }

                // Record approval
                if (isCreator)
                {
                    draft.CreatorConfirmedVersion = draft.Version;
                    draft.CreatorConfirmedAt = DateTime.UtcNow;
                }
                else
                {
                    draft.EntrepreneurConfirmedVersion = draft.Version;
                    draft.EntrepreneurConfirmedAt = DateTime.UtcNow;
                }

                draft.UpdatedAt = DateTime.UtcNow;

                bool isFullyApproved = draft.CreatorConfirmedVersion == draft.Version &&
                                       draft.EntrepreneurConfirmedVersion == draft.Version;

                if (isFullyApproved)
                {
                    draft.Status = "APPROVED";
                    deal.DealStage = "LEGAL_REVIEW_PENDING";
                }
                else
                {
                    draft.Status = isCreator ? "CREATOR_APPROVED" : "ENTREPRENEUR_APPROVED";
                }

                var oldVersion = deal.Version;
                deal.Version++;
                deal.UpdatedAt = DateTime.UtcNow;

                var replaceResult = await _context.DealExecutions.ReplaceOneAsync(
                    d => d.Id == deal.Id && d.Version == oldVersion,
                    deal
                );

                if (replaceResult.ModifiedCount == 0)
                {
                    return StatusCode(409, ApiResponse.Error("Conflict: Deal was updated concurrently. Please refresh and retry."));
                }

                var partyLabel = isCreator ? "Creator" : "Entrepreneur";

                if (isFullyApproved)
                {
                    await PostMessengerEventAsync(
                        deal.ConversationId,
                        userId,
                        "Ownership structure approved by both parties. Next step: Legal Review."
                    );

                    // Notify both
                    if (Guid.TryParse(deal.CreatorId, out var cGuid) && _notifications != null)
                    {
                        try { await _notifications.NotifyUser(cGuid, "Ownership Structure Approved", "Both parties have approved the cap table. Next step: Legal Review."); } catch { }
                    }
                    if (Guid.TryParse(deal.EntrepreneurId, out var eGuid) && _notifications != null)
                    {
                        try { await _notifications.NotifyUser(eGuid, "Ownership Structure Approved", "Both parties have approved the cap table. Next step: Legal Review."); } catch { }
                    }

                    await LogAuditAsync(deal.IdeaId ?? "", deal.Id, draft.Version, userId, "cap_table_fully_approved");
                }
                else
                {
                    await PostMessengerEventAsync(
                        deal.ConversationId,
                        userId,
                        $"{partyLabel} approved the proposed ownership structure (Version {draft.Version})."
                    );

                    var recipientId = isCreator ? deal.EntrepreneurId : deal.CreatorId;
                    if (!string.IsNullOrEmpty(recipientId) && Guid.TryParse(recipientId, out var recipientGuid) && _notifications != null)
                    {
                        try
                        {
                            await _notifications.NotifyUser(
                                recipientGuid,
                                "Cap Table Approval Received",
                                $"{partyLabel} approved the ownership structure for Version {draft.Version}. Your approval is required."
                            );
                        }
                        catch { }
                    }

                    await LogAuditAsync(deal.IdeaId ?? "", deal.Id, draft.Version, userId, isCreator ? "creator_cap_table_approved" : "entrepreneur_cap_table_approved");
                }

                var dto = await MapCapTableDraftDtoAsync(deal);
                return Ok(ApiResponse.Ok(isFullyApproved ? "Ownership structure fully approved." : "Ownership structure approved.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// POST /api/deals/{dealId}/cap-table/request-changes
        /// Requests changes on the ownership structure, incrementing version and invalidating prior approvals.
        /// </summary>
        [HttpPost("{dealId}/cap-table/request-changes")]
        public async Task<IActionResult> RequestCapTableChanges(string dealId, [FromBody] RequestCapTableChangesRequest request)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var userId = GetUserId();
                var isCreator = deal.CreatorId == userId;
                var isEntrepreneur = deal.EntrepreneurId == userId;

                if (!isCreator && !isEntrepreneur)
                    return StatusCode(403, ApiResponse.Error("You are not authorized to request changes for this deal."));

                if (deal.DealStage != "CAP_TABLE_PENDING")
                    return UnprocessableEntity(ApiResponse.Error($"Changes cannot be requested when deal is in {deal.DealStage} stage."));

                if (deal.CapTableDraft == null)
                {
                    await EnsureSeededCapTableDraftAsync(deal);
                }

                var draft = deal.CapTableDraft!;
                draft.Version++;
                draft.CreatorConfirmedVersion = 0;
                draft.EntrepreneurConfirmedVersion = 0;
                draft.CreatorConfirmedAt = null;
                draft.EntrepreneurConfirmedAt = null;
                draft.Status = "CHANGES_REQUESTED";
                draft.LastEditedByRole = isCreator ? "creator" : "entrepreneur";
                draft.LastEditedByUserId = userId;
                draft.Notes = request.Feedback;
                draft.UpdatedAt = DateTime.UtcNow;

                var oldVersion = deal.Version;
                deal.Version++;
                deal.UpdatedAt = DateTime.UtcNow;

                var replaceResult = await _context.DealExecutions.ReplaceOneAsync(
                    d => d.Id == deal.Id && d.Version == oldVersion,
                    deal
                );

                if (replaceResult.ModifiedCount == 0)
                {
                    return StatusCode(409, ApiResponse.Error("Conflict: Deal was updated concurrently. Please refresh and retry."));
                }

                var partyLabel = isCreator ? "Creator" : "Entrepreneur";
                await PostMessengerEventAsync(
                    deal.ConversationId,
                    userId,
                    $"{partyLabel} requested changes to the ownership structure: \"{request.Feedback}\""
                );

                var recipientId = isCreator ? deal.EntrepreneurId : deal.CreatorId;
                if (!string.IsNullOrEmpty(recipientId) && Guid.TryParse(recipientId, out var recipientGuid) && _notifications != null)
                {
                    try
                    {
                        await _notifications.NotifyUser(
                            recipientGuid,
                            "Cap Table Changes Requested",
                            $"{partyLabel} requested changes to the ownership structure: {request.Feedback}"
                        );
                    }
                    catch { }
                }

                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, draft.Version, userId, "cap_table_changes_requested");

                var dto = await MapCapTableDraftDtoAsync(deal);
                return Ok(ApiResponse.Ok("Change request submitted.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        private async Task EnsureSeededCapTableDraftAsync(DealExecution deal)
        {
            if (deal.CapTableDraft != null) return;

            var acceptedTerms = deal.EquityTerms ?? deal.Revisions?.LastOrDefault()?.EquityTerms ?? new EquityTerms();
            var roleAgreement = deal.RoleAgreement ?? new RoleResponsibilityAgreement();

            ApplicationUser? creatorUser = null;
            try
            {
                if (!string.IsNullOrEmpty(deal.CreatorId))
                    creatorUser = await _userManager.FindByIdAsync(deal.CreatorId);
            }
            catch { }

            ApplicationUser? entUser = null;
            try
            {
                if (!string.IsNullOrEmpty(deal.EntrepreneurId))
                    entUser = await _userManager.FindByIdAsync(deal.EntrepreneurId);
            }
            catch { }

            int totalShares = 10_000_000;
            double creatorPct = acceptedTerms.EquityPercentage;
            double remainingPct = Math.Max(0, 100.0 - creatorPct);

            // Sensible initial allocation:
            // Creator gets accepted equity %
            // If remaining >= 15, allocate 5% ESOP and 5% Investor Reserve, rest to Entrepreneur
            double esopPct = remainingPct >= 15.0 ? 5.0 : 0.0;
            double reservePct = remainingPct >= 20.0 ? 5.0 : 0.0;
            double entPct = remainingPct - esopPct - reservePct;

            var entries = new List<DealCapTableEntry>
            {
                new DealCapTableEntry
                {
                    UserId = deal.CreatorId,
                    DisplayName = creatorUser?.Name ?? creatorUser?.UserName ?? "Creator Co-founder",
                    RoleTitle = string.IsNullOrEmpty(roleAgreement.CreatorRole) ? "Co-founder" : roleAgreement.CreatorRole,
                    StakeholderType = "creator",
                    ShareClass = "common",
                    HasVotingRights = true,
                    EquityPercent = creatorPct,
                    SharesGranted = (int)Math.Round(totalShares * (creatorPct / 100.0)),
                    VestingMonths = acceptedTerms.VestingMonths,
                    CliffMonths = acceptedTerms.CliffMonths,
                    IsCreator = true,
                    IsFounder = false,
                    IsLocked = true
                },
                new DealCapTableEntry
                {
                    UserId = deal.EntrepreneurId,
                    DisplayName = entUser?.Name ?? entUser?.UserName ?? "Lead Entrepreneur",
                    RoleTitle = string.IsNullOrEmpty(roleAgreement.EntrepreneurRole) ? "CEO & Co-founder" : roleAgreement.EntrepreneurRole,
                    StakeholderType = "founder",
                    ShareClass = "common",
                    HasVotingRights = true,
                    EquityPercent = entPct,
                    SharesGranted = (int)Math.Round(totalShares * (entPct / 100.0)),
                    VestingMonths = 48,
                    CliffMonths = 12,
                    IsCreator = false,
                    IsFounder = true,
                    IsLocked = false
                }
            };

            if (esopPct > 0)
            {
                entries.Add(new DealCapTableEntry
                {
                    DisplayName = "Employee Option Pool (ESOP)",
                    RoleTitle = "Unallocated Options",
                    StakeholderType = "esop",
                    ShareClass = "common",
                    HasVotingRights = false,
                    EquityPercent = esopPct,
                    SharesGranted = (int)Math.Round(totalShares * (esopPct / 100.0)),
                    VestingMonths = 48,
                    CliffMonths = 12,
                    IsEsop = true,
                    IsLocked = false
                });
            }

            if (reservePct > 0)
            {
                entries.Add(new DealCapTableEntry
                {
                    DisplayName = "Future Investor Reserve",
                    RoleTitle = "Pre-allocated Round Reserve",
                    StakeholderType = "investor_reserve",
                    ShareClass = "preferred",
                    HasVotingRights = true,
                    EquityPercent = reservePct,
                    SharesGranted = (int)Math.Round(totalShares * (reservePct / 100.0)),
                    VestingMonths = 0,
                    CliffMonths = 0,
                    IsInvestorReserve = true,
                    IsLocked = false
                });
            }

            deal.CapTableDraft = new DealCapTableDraft
            {
                DealId = deal.Id,
                IdeaId = deal.IdeaId ?? string.Empty,
                TotalShares = totalShares,
                Entries = entries,
                EsopPoolPercent = esopPct,
                InvestorReservePercent = reservePct,
                EsopVestingMonths = 48,
                Status = "AWAITING_CONFIRMATION",
                Version = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }

        private async Task<DealCapTableDraftDto> MapCapTableDraftDtoAsync(DealExecution deal)
        {
            ApplicationUser? creatorUser = null;
            try
            {
                if (!string.IsNullOrEmpty(deal.CreatorId))
                    creatorUser = await _userManager.FindByIdAsync(deal.CreatorId);
            }
            catch { }

            ApplicationUser? entUser = null;
            try
            {
                if (!string.IsNullOrEmpty(deal.EntrepreneurId))
                    entUser = await _userManager.FindByIdAsync(deal.EntrepreneurId);
            }
            catch { }

            var idea = !string.IsNullOrEmpty(deal.IdeaId)
                ? await _context.CreatorIdeas.Find(x => x.Id == deal.IdeaId).FirstOrDefaultAsync()
                : null;

            // Check if Entrepreneur has an existing Company
            Companies? existingCompany = null;
            try
            {
                if (!string.IsNullOrEmpty(deal.EntrepreneurId))
                {
                    existingCompany = await _context.Companies
                        .Find(c => c.OwnerId == deal.EntrepreneurId)
                        .FirstOrDefaultAsync();
                }
            }
            catch { }

            var acceptedTerms = deal.EquityTerms ?? deal.Revisions?.LastOrDefault()?.EquityTerms ?? new EquityTerms();
            var draft = deal.CapTableDraft ?? new DealCapTableDraft();

            var totalAllocated = draft.Entries.Sum(e => e.EquityPercent);

            return new DealCapTableDraftDto
            {
                Id = draft.Id,
                DealId = deal.Id,
                IdeaId = deal.IdeaId ?? "",
                ProjectName = idea?.Project?.Name ?? deal.CompanyNameSnapshot ?? "Project",
                CreatorId = deal.CreatorId ?? "",
                CreatorName = creatorUser?.Name ?? creatorUser?.UserName ?? "Creator",
                EntrepreneurId = deal.EntrepreneurId ?? "",
                EntrepreneurName = entUser?.Name ?? entUser?.UserName ?? "Entrepreneur",
                TotalShares = draft.TotalShares,
                Entries = draft.Entries.Select(e => new DealCapTableEntryDto
                {
                    Id = e.Id,
                    UserId = e.UserId,
                    DisplayName = e.DisplayName,
                    RoleTitle = e.RoleTitle,
                    StakeholderType = e.StakeholderType,
                    ShareClass = e.ShareClass,
                    HasVotingRights = e.HasVotingRights,
                    EquityPercent = e.EquityPercent,
                    SharesGranted = e.SharesGranted,
                    VestingMonths = e.VestingMonths,
                    CliffMonths = e.CliffMonths,
                    IsCreator = e.IsCreator,
                    IsFounder = e.IsFounder,
                    IsEsop = e.IsEsop,
                    IsInvestorReserve = e.IsInvestorReserve,
                    IsLocked = e.IsLocked
                }).ToList(),
                EsopPoolPercent = draft.EsopPoolPercent,
                InvestorReservePercent = draft.InvestorReservePercent,
                EsopVestingMonths = draft.EsopVestingMonths,
                TotalAllocatedPercent = Math.Round(totalAllocated, 2),
                IsFullyAllocated = Math.Abs(totalAllocated - 100.0) <= 0.01,
                CreatorConfirmedAt = draft.CreatorConfirmedAt,
                EntrepreneurConfirmedAt = draft.EntrepreneurConfirmedAt,
                CreatorConfirmedVersion = draft.CreatorConfirmedVersion,
                EntrepreneurConfirmedVersion = draft.EntrepreneurConfirmedVersion,
                Status = draft.Status,
                Version = draft.Version,
                LastEditedByRole = draft.LastEditedByRole,
                Notes = draft.Notes,
                CommercialTerms = new DealCommercialSummaryDto
                {
                    EquityPercentage = acceptedTerms.EquityPercentage,
                    CreatorRole = acceptedTerms.CreatorRole,
                    CashComponent = acceptedTerms.CashComponent,
                    VestingEnabled = acceptedTerms.VestingEnabled,
                    VestingMonths = acceptedTerms.VestingMonths,
                    CliffMonths = acceptedTerms.CliffMonths,
                    AcceptedRevisionNumber = deal.AcceptedRevisionNumber ?? 1
                },
                CompanyContext = new CapTableCompanyContextDto
                {
                    HasExistingCompany = existingCompany != null,
                    CompanyId = existingCompany?.Id,
                    CompanyName = existingCompany?.CompanyName ?? existingCompany?.LegalName,
                    IncorporationStatus = existingCompany != null ? "INCORPORATED" : "NOT_INCORPORATED"
                },
                CreatedAt = draft.CreatedAt,
                UpdatedAt = draft.UpdatedAt
            };
        }

        // =========================================================================
        // PHASE 6: SCREEN 04 — LEGAL & SHAREHOLDER REVIEW
        // =========================================================================

        /// <summary>
        /// GET /api/deals/{dealId}/legal
        /// Retrieves or auto-seeds the Legal Review Package for the approved equity deal.
        /// Gate: DealType == EQUITY_PARTNERSHIP, DealStage in (LEGAL_REVIEW_PENDING, SIGNATURE_PENDING),
        /// RoleAgreement == CONFIRMED, CapTableDraft == APPROVED (both agreed on same version).
        /// Actor: Creator, Entrepreneur, or Assigned Legal Provider.
        /// </summary>
        [HttpGet("{dealId}/legal")]
        public async Task<IActionResult> GetLegalPackage(string dealId)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var gateResult = ValidateLegalReviewEntryGate(deal);
                if (gateResult != null) return gateResult;

                var currentUserId = GetUserId();
                if (!IsAuthorizedLegalActor(deal, currentUserId))
                {
                    return StatusCode(403, ApiResponse.Error("Forbidden. Only Creator, Entrepreneur, or Assigned Legal Service Provider can access Legal Review."));
                }

                var mutated = await EnsureSeededLegalPackageAsync(deal);
                if (mutated)
                {
                    var replaceRes = await _context.DealExecutions.ReplaceOneAsync(d => d.Id == deal.Id, deal);
                    if (replaceRes.MatchedCount == 0)
                    {
                        return StatusCode(409, ApiResponse.Error("Concurrent modification detected. Please retry."));
                    }
                }

                var dto = await MapLegalPackageDtoAsync(deal);
                return Ok(ApiResponse.Ok("Legal review package retrieved.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// POST /api/deals/{dealId}/legal/provider/invite
        /// Invites a verified Legal Service Provider to review the legal package.
        /// Actor: Creator or Entrepreneur only.
        /// </summary>
        [HttpPost("{dealId}/legal/provider/invite")]
        public async Task<IActionResult> InviteLegalProvider(string dealId, [FromBody] InviteLegalProviderRequest req)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var gateResult = ValidateLegalReviewEntryGate(deal);
                if (gateResult != null) return gateResult;

                var currentUserId = GetUserId();
                if (deal.CreatorId != currentUserId && deal.EntrepreneurId != currentUserId)
                {
                    return StatusCode(403, ApiResponse.Error("Forbidden. Only Creator or Entrepreneur can invite a Legal Service Provider."));
                }

                if (string.IsNullOrWhiteSpace(req.ProviderId))
                {
                    return UnprocessableEntity(ApiResponse.Error("ProviderId is required."));
                }

                // Validate Provider Eligibility
                var providerUser = await _userManager.FindByIdAsync(req.ProviderId);
                var providerProfile = await _context.ServiceProviderProfiles
                    .Find(p => p.UserId == req.ProviderId || p.ProviderId == req.ProviderId)
                    .FirstOrDefaultAsync();

                bool isVerifiedLegal = false;
                string providerDisplayName = "Verified Legal Provider";
                if (providerUser != null)
                {
                    providerDisplayName = !string.IsNullOrWhiteSpace(providerUser.Name) ? providerUser.Name : (providerUser.UserName ?? "Verified Legal Provider");
                }

                if (providerProfile != null)
                {
                    var hasLegalCategory = providerProfile.ServiceCategories != null &&
                        providerProfile.ServiceCategories.Contains(ServiceCategory.Legal);

                    var isVerified = providerProfile.VerificationStatus == ServiceProviderVerificationStatus.Verified ||
                                     providerProfile.ProviderTier != ProviderTier.Tier1;

                    if (hasLegalCategory || isVerified)
                    {
                        isVerifiedLegal = true;
                    }
                }
                else if (providerUser != null)
                {
                    var roles = await _userManager.GetRolesAsync(providerUser);
                    if (roles.Contains("LegalProvider") || roles.Contains("ServiceProvider") || roles.Contains("Admin"))
                    {
                        isVerifiedLegal = true;
                    }
                }

                if (!isVerifiedLegal)
                {
                    return UnprocessableEntity(ApiResponse.Error("Selected Service Provider is not a verified Legal Service Provider."));
                }

                await EnsureSeededLegalPackageAsync(deal);

                deal.LegalPackage!.AssignedLegalProviderId = providerUser?.Id.ToString() ?? req.ProviderId;
                deal.LegalPackage.AssignedLegalProviderName = providerDisplayName;
                deal.LegalPackage.ProviderReviewStatus = "ASSIGNED";
                deal.LegalPackage.ProviderReviewedVersion = 0;
                deal.LegalPackage.ProviderReviewedAt = null;
                deal.LegalPackage.ProviderReviewNotes = null;
                // Reset party approvals on this package version so that provider review precedes party approval
                deal.LegalPackage.CreatorApprovedVersion = 0;
                deal.LegalPackage.EntrepreneurApprovedVersion = 0;
                deal.LegalPackage.CreatorApprovedAt = null;
                deal.LegalPackage.EntrepreneurApprovedAt = null;
                deal.LegalPackage.Status = "IN_REVIEW";
                deal.LegalPackage.UpdatedAt = DateTime.UtcNow;

                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, deal.LegalPackage.Version, currentUserId, "legal_provider_invited");
                await PostMessengerEventAsync(deal.ConversationId, currentUserId, $"Legal review requested from {providerDisplayName}.");

                var replaceRes = await _context.DealExecutions.ReplaceOneAsync(d => d.Id == deal.Id, deal);
                if (replaceRes.MatchedCount == 0)
                {
                    return StatusCode(409, ApiResponse.Error("Concurrent update conflict. Please retry."));
                }

                var dto = await MapLegalPackageDtoAsync(deal);
                return Ok(ApiResponse.Ok("Legal Service Provider invited successfully.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// GET /api/deals/{dealId}/legal/documents/{documentId}
        /// Retrieves a specific legal document by ID.
        /// </summary>
        [HttpGet("{dealId}/legal/documents/{documentId}")]
        public async Task<IActionResult> GetLegalDocument(string dealId, string documentId)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var gateResult = ValidateLegalReviewEntryGate(deal);
                if (gateResult != null) return gateResult;

                var currentUserId = GetUserId();
                if (!IsAuthorizedLegalActor(deal, currentUserId))
                {
                    return StatusCode(403, ApiResponse.Error("Forbidden."));
                }

                await EnsureSeededLegalPackageAsync(deal);

                var doc = deal.LegalPackage!.Documents.FirstOrDefault(d => d.Id == documentId);
                if (doc == null) return NotFound(ApiResponse.Error("Legal document not found."));

                var dto = new LegalDocumentDto
                {
                    Id = doc.Id,
                    DocumentType = doc.DocumentType,
                    Title = doc.Title,
                    RequirementType = doc.RequirementType,
                    ContentMarkdown = doc.ContentMarkdown,
                    ContentHash = doc.ContentHash,
                    Version = doc.Version,
                    Status = doc.Status,
                    LastUpdated = doc.LastUpdated
                };

                return Ok(ApiResponse.Ok("Legal document retrieved.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// POST /api/deals/{dealId}/legal/documents/{documentId}/explain
        /// AI-powered plain language explanation of legal clauses grounded in the document text.
        /// Informational only; labeled as not legal advice.
        /// </summary>
        [HttpPost("{dealId}/legal/documents/{documentId}/explain")]
        public async Task<IActionResult> ExplainLegalDocument(string dealId, string documentId)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var gateResult = ValidateLegalReviewEntryGate(deal);
                if (gateResult != null) return gateResult;

                var currentUserId = GetUserId();
                if (!IsAuthorizedLegalActor(deal, currentUserId))
                {
                    return StatusCode(403, ApiResponse.Error("Forbidden."));
                }

                await EnsureSeededLegalPackageAsync(deal);

                var doc = deal.LegalPackage!.Documents.FirstOrDefault(d => d.Id == documentId);
                if (doc == null) return NotFound(ApiResponse.Error("Legal document not found."));

                var terms = deal.EquityTerms ?? new EquityTerms();
                var roleAg = deal.RoleAgreement;
                var capTable = deal.CapTableDraft;

                var explanation = new StringBuilder();
                var takeaways = new List<string>();

                switch (doc.DocumentType)
                {
                    case "COFOUNDER_AGREEMENT":
                        explanation.AppendLine("### Plain Language Overview: Co-founder Agreement");
                        explanation.AppendLine($"- **Equity & Role**: Creator ({roleAg?.CreatorRole ?? terms.CreatorRole}) receives **{terms.EquityPercentage}%** equity in the venture.");
                        explanation.AppendLine($"- **Vesting Schedule**: Equity vests over **{terms.VestingMonths} months** with a **{terms.CliffMonths}-month cliff**.");
                        if (terms.CashComponent.HasValue && terms.CashComponent.Value > 0)
                            explanation.AppendLine($"- **Cash Component**: Includes an agreed cash stipend of **${terms.CashComponent.Value:N0}**.");
                        explanation.AppendLine($"- **Commitment**: Assigned key responsibilities include: {string.Join(", ", roleAg?.CreatorResponsibilities ?? new List<string>())}.");
                        takeaways.Add($"You are allocated {terms.EquityPercentage}% equity vesting over {terms.VestingMonths} months.");
                        takeaways.Add($"Your assigned role is {roleAg?.CreatorRole ?? terms.CreatorRole}.");
                        takeaways.Add("Both parties agree on mutual non-compete and IP assignment terms.");
                        break;

                    case "IP_CONTRIBUTION_AGREEMENT":
                        explanation.AppendLine("### Plain Language Overview: IP Contribution Agreement");
                        explanation.AppendLine("- **Intellectual Property Transfer**: All project code, models, designs, and patentable concepts developed for this project are formally assigned to the joint venture entity.");
                        explanation.AppendLine("- **Representations**: You represent that the contributed IP is original and free of third-party encumbrances.");
                        takeaways.Add("All venture-related intellectual property is owned by the joint company.");
                        takeaways.Add("You retain no individual proprietary claim over assigned project IP.");
                        break;

                    case "VESTING_AGREEMENT":
                        explanation.AppendLine("### Plain Language Overview: Restricted Stock Vesting Agreement");
                        explanation.AppendLine($"- **Vesting Terms**: Total vesting duration is **{terms.VestingMonths} months**.");
                        explanation.AppendLine($"- **Cliff Period**: **{terms.CliffMonths} months** must elapse before the first tranche of shares unlocks.");
                        explanation.AppendLine("- **Acceleration**: Standard single/double-trigger acceleration applies in the event of an acquisition or involuntary termination without cause.");
                        takeaways.Add($"No equity unlocks before the {terms.CliffMonths}-month cliff.");
                        takeaways.Add("Unvested shares may be repurchased at nominal value if departing prematurely.");
                        break;

                    case "SHAREHOLDER_AGREEMENT":
                        explanation.AppendLine("### Plain Language Overview: Shareholder Agreement");
                        explanation.AppendLine($"- **Cap Table Structure**: Total ownership is distributed per approved V{capTable?.Version ?? 1} cap table.");
                        explanation.AppendLine("- **Voting Rights**: Common shares carry standard voting rights on major corporate actions.");
                        explanation.AppendLine("- **Transfer Restrictions**: Standard right of first refusal (ROFR) and tag-along / drag-along provisions protect minority and majority owners.");
                        takeaways.Add("Minority protections include tag-along rights on third-party buyout offers.");
                        takeaways.Add("Share transfers require company board pre-approval.");
                        break;

                    default:
                        explanation.AppendLine($"### Plain Language Overview: {doc.Title}");
                        explanation.AppendLine("- This document formalizes the corporate governance and operational terms agreed upon in commercial and cap table stages.");
                        takeaways.Add("Complies with canonical approved deal parameters.");
                        break;
                }

                var resp = new ExplainLegalDocumentResponse
                {
                    DocumentId = doc.Id,
                    DocumentTitle = doc.Title,
                    ExplanationMarkdown = explanation.ToString(),
                    KeyTakeaways = takeaways,
                    Disclaimer = "AI-generated explanation — not legal advice. A verified human Legal Service Provider review is required."
                };

                return Ok(ApiResponse.Ok("Document explanation generated.", resp));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// POST /api/deals/{dealId}/legal/request-changes
        /// Requests changes on the legal package, incrementing version and invalidating stale approvals.
        /// </summary>
        [HttpPost("{dealId}/legal/request-changes")]
        public async Task<IActionResult> RequestLegalChanges(string dealId, [FromBody] RequestLegalChangesRequest req)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var gateResult = ValidateLegalReviewEntryGate(deal);
                if (gateResult != null) return gateResult;

                var currentUserId = GetUserId();
                if (!IsAuthorizedLegalActor(deal, currentUserId))
                {
                    return StatusCode(403, ApiResponse.Error("Forbidden."));
                }

                if (string.IsNullOrWhiteSpace(req.Feedback))
                {
                    return UnprocessableEntity(ApiResponse.Error("Feedback is required when requesting legal changes."));
                }

                await EnsureSeededLegalPackageAsync(deal);

                var pkg = deal.LegalPackage!;
                pkg.Version += 1;
                pkg.CreatorApprovedVersion = 0;
                pkg.EntrepreneurApprovedVersion = 0;
                pkg.CreatorApprovedAt = null;
                pkg.EntrepreneurApprovedAt = null;
                pkg.Status = "CHANGES_REQUESTED";
                pkg.ProviderReviewedVersion = 0;
                pkg.Notes = req.Feedback;

                bool isProvider = currentUserId == pkg.AssignedLegalProviderId;
                if (isProvider)
                {
                    pkg.ProviderReviewStatus = "CHANGES_REQUESTED";
                    pkg.ProviderReviewNotes = req.Feedback;
                }
                else
                {
                    // If user requested changes after review was complete, provider must review new version if assigned
                    pkg.ProviderReviewStatus = !string.IsNullOrEmpty(pkg.AssignedLegalProviderId) ? "IN_REVIEW" : "NOT_ASSIGNED";
                }

                // Regenerate documents with incremented version & new hashes
                pkg.Documents = GenerateLegalDocuments(deal, pkg.Version, pkg.Jurisdiction, pkg.CompanyContext, pkg.CompanyName);
                pkg.UpdatedAt = DateTime.UtcNow;

                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, pkg.Version, currentUserId, "legal_changes_requested");
                await PostMessengerEventAsync(deal.ConversationId, currentUserId, $"Legal document changes requested: {req.Feedback} (Package V{pkg.Version}).");

                var replaceRes = await _context.DealExecutions.ReplaceOneAsync(d => d.Id == deal.Id, deal);
                if (replaceRes.MatchedCount == 0)
                {
                    return StatusCode(409, ApiResponse.Error("Concurrent modification conflict. Please retry."));
                }

                var dto = await MapLegalPackageDtoAsync(deal);
                return Ok(ApiResponse.Ok("Legal document changes requested. New version created.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// POST /api/deals/{dealId}/legal/provider/review
        /// Action endpoint for the assigned Legal Service Provider to update review state.
        /// Actor: ONLY Assigned Legal Provider.
        /// </summary>
        [HttpPost("{dealId}/legal/provider/review")]
        public async Task<IActionResult> ProviderLegalReview(string dealId, [FromBody] ProviderLegalReviewRequest req)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var gateResult = ValidateLegalReviewEntryGate(deal);
                if (gateResult != null) return gateResult;

                await EnsureSeededLegalPackageAsync(deal);
                var pkg = deal.LegalPackage!;

                var currentUserId = GetUserId();
                if (string.IsNullOrEmpty(pkg.AssignedLegalProviderId) || pkg.AssignedLegalProviderId != currentUserId)
                {
                    return StatusCode(403, ApiResponse.Error("Forbidden. Only the assigned Legal Service Provider can perform legal reviews."));
                }

                var status = (req.ReviewStatus ?? "REVIEW_COMPLETE").ToUpperInvariant();
                if (status == "CHANGES_REQUESTED")
                {
                    pkg.Version += 1;
                    pkg.CreatorApprovedVersion = 0;
                    pkg.EntrepreneurApprovedVersion = 0;
                    pkg.CreatorApprovedAt = null;
                    pkg.EntrepreneurApprovedAt = null;
                    pkg.Status = "CHANGES_REQUESTED";
                    pkg.ProviderReviewStatus = "CHANGES_REQUESTED";
                    pkg.ProviderReviewNotes = req.Notes ?? req.RequestedChangesFeedback;
                    pkg.Documents = GenerateLegalDocuments(deal, pkg.Version, pkg.Jurisdiction, pkg.CompanyContext, pkg.CompanyName);
                    pkg.UpdatedAt = DateTime.UtcNow;

                    await LogAuditAsync(deal.IdeaId ?? "", deal.Id, pkg.Version, currentUserId, "legal_changes_requested");
                    await PostMessengerEventAsync(deal.ConversationId, currentUserId, $"{pkg.AssignedLegalProviderName} requested changes to the legal package (V{pkg.Version}).");
                }
                else if (status == "IN_REVIEW")
                {
                    pkg.ProviderReviewStatus = "IN_REVIEW";
                    pkg.Status = "IN_REVIEW";
                    pkg.UpdatedAt = DateTime.UtcNow;

                    await LogAuditAsync(deal.IdeaId ?? "", deal.Id, pkg.Version, currentUserId, "legal_review_started");
                    await PostMessengerEventAsync(deal.ConversationId, currentUserId, $"Legal review started by {pkg.AssignedLegalProviderName}.");
                }
                else if (status == "REVIEW_COMPLETE")
                {
                    pkg.ProviderReviewStatus = "REVIEW_COMPLETE";
                    pkg.ProviderReviewedVersion = pkg.Version;
                    pkg.ProviderReviewedAt = DateTime.UtcNow;
                    pkg.ProviderReviewNotes = req.Notes ?? "Legal review completed with no material defects found.";
                    pkg.UpdatedAt = DateTime.UtcNow;

                    // Update document statuses to REVIEWED
                    foreach (var doc in pkg.Documents)
                    {
                        doc.Status = "REVIEWED";
                    }

                    await LogAuditAsync(deal.IdeaId ?? "", deal.Id, pkg.Version, currentUserId, "legal_review_completed");
                    await PostMessengerEventAsync(deal.ConversationId, currentUserId, $"Legal review completed by {pkg.AssignedLegalProviderName}. Legal terms ready for both parties.");
                }

                var replaceRes = await _context.DealExecutions.ReplaceOneAsync(d => d.Id == deal.Id, deal);
                if (replaceRes.MatchedCount == 0)
                {
                    return StatusCode(409, ApiResponse.Error("Concurrent modification conflict. Please retry."));
                }

                var dto = await MapLegalPackageDtoAsync(deal);
                return Ok(ApiResponse.Ok("Provider review updated.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// POST /api/deals/{dealId}/legal/approve
        /// Approves the current version of the Legal Review Package.
        /// Requirements:
        /// - Jurisdiction must be set (non-empty).
        /// - ProviderReviewStatus must be REVIEW_COMPLETE.
        /// - Creator and Entrepreneur must approve the identical package Version.
        /// When both approve, advances DealStage from LEGAL_REVIEW_PENDING to SIGNATURE_PENDING.
        /// Zero Company mutation or signing takes place here.
        /// </summary>
        [HttpPost("{dealId}/legal/approve")]
        public async Task<IActionResult> ApproveLegalPackage(string dealId)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var gateResult = ValidateLegalReviewEntryGate(deal);
                if (gateResult != null) return gateResult;

                var currentUserId = GetUserId();
                if (deal.CreatorId != currentUserId && deal.EntrepreneurId != currentUserId)
                {
                    return StatusCode(403, ApiResponse.Error("Forbidden. Only Creator or Entrepreneur can approve legal terms."));
                }

                await EnsureSeededLegalPackageAsync(deal);
                var pkg = deal.LegalPackage!;

                if (string.IsNullOrWhiteSpace(pkg.Jurisdiction))
                {
                    return UnprocessableEntity(ApiResponse.Error("Jurisdiction Required. Please specify jurisdiction before legal approval."));
                }

                bool hasAssignedProvider = !string.IsNullOrWhiteSpace(pkg.AssignedLegalProviderId);
                if (hasAssignedProvider)
                {
                    if (pkg.ProviderReviewStatus != "REVIEW_COMPLETE" || (pkg.ProviderReviewedVersion > 0 && pkg.ProviderReviewedVersion != pkg.Version))
                    {
                        return UnprocessableEntity(ApiResponse.Error("A verified Legal Service Provider has been assigned. Provider review must be marked REVIEW_COMPLETE before final approval."));
                    }
                }

                bool isCreator = deal.CreatorId == currentUserId;
                if (isCreator)
                {
                    pkg.CreatorApprovedVersion = pkg.Version;
                    pkg.CreatorApprovedAt = DateTime.UtcNow;
                }
                else
                {
                    pkg.EntrepreneurApprovedVersion = pkg.Version;
                    pkg.EntrepreneurApprovedAt = DateTime.UtcNow;
                }

                bool bothApproved = pkg.CreatorApprovedVersion == pkg.Version && pkg.EntrepreneurApprovedVersion == pkg.Version;
                bool providerSatisfied = !hasAssignedProvider || (pkg.ProviderReviewStatus == "REVIEW_COMPLETE" && (pkg.ProviderReviewedVersion == 0 || pkg.ProviderReviewedVersion == pkg.Version));

                if (bothApproved && providerSatisfied)
                {
                    pkg.Status = "APPROVED";
                    deal.DealStage = "SIGNATURE_PENDING";
                    pkg.UpdatedAt = DateTime.UtcNow;

                    await LogAuditAsync(deal.IdeaId ?? "", deal.Id, pkg.Version, currentUserId, "legal_package_fully_approved");
                    await PostMessengerEventAsync(deal.ConversationId, currentUserId, $"Legal package V{pkg.Version} fully approved by both parties. Moving to document signing.");
                }
                else
                {
                    if (isCreator)
                    {
                        pkg.Status = "CREATOR_APPROVED";
                        await LogAuditAsync(deal.IdeaId ?? "", deal.Id, pkg.Version, currentUserId, "creator_legal_approved");
                        await PostMessengerEventAsync(deal.ConversationId, currentUserId, $"Creator approved Legal Package V{pkg.Version}. Awaiting Entrepreneur approval.");
                    }
                    else
                    {
                        pkg.Status = "ENTREPRENEUR_APPROVED";
                        await LogAuditAsync(deal.IdeaId ?? "", deal.Id, pkg.Version, currentUserId, "entrepreneur_legal_approved");
                        await PostMessengerEventAsync(deal.ConversationId, currentUserId, $"Entrepreneur approved Legal Package V{pkg.Version}. Awaiting Creator approval.");
                    }
                }

                var replaceRes = await _context.DealExecutions.ReplaceOneAsync(d => d.Id == deal.Id, deal);
                if (replaceRes.MatchedCount == 0)
                {
                    return StatusCode(409, ApiResponse.Error("Concurrent modification conflict. Please retry."));
                }

                var dto = await MapLegalPackageDtoAsync(deal);
                return Ok(ApiResponse.Ok("Legal package approved.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// PUT /api/deals/{dealId}/legal/jurisdiction
        /// Sets or updates the governing jurisdiction for the legal review package.
        /// </summary>
        [HttpPut("{dealId}/legal/jurisdiction")]
        public async Task<IActionResult> SetLegalJurisdiction(string dealId, [FromBody] SetJurisdictionRequest req)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var gateResult = ValidateLegalReviewEntryGate(deal);
                if (gateResult != null) return gateResult;

                var currentUserId = GetUserId();
                if (deal.CreatorId != currentUserId && deal.EntrepreneurId != currentUserId)
                {
                    return StatusCode(403, ApiResponse.Error("Forbidden."));
                }

                if (string.IsNullOrWhiteSpace(req.Jurisdiction))
                {
                    return UnprocessableEntity(ApiResponse.Error("Jurisdiction cannot be empty."));
                }

                await EnsureSeededLegalPackageAsync(deal);
                deal.LegalPackage!.Jurisdiction = req.Jurisdiction.Trim();
                deal.LegalPackage.Documents = GenerateLegalDocuments(deal, deal.LegalPackage.Version, deal.LegalPackage.Jurisdiction, deal.LegalPackage.CompanyContext, deal.LegalPackage.CompanyName);
                deal.LegalPackage.UpdatedAt = DateTime.UtcNow;

                var replaceRes = await _context.DealExecutions.ReplaceOneAsync(d => d.Id == deal.Id, deal);
                if (replaceRes.MatchedCount == 0)
                {
                    return StatusCode(409, ApiResponse.Error("Concurrent modification conflict. Please retry."));
                }

                var dto = await MapLegalPackageDtoAsync(deal);
                return Ok(ApiResponse.Ok("Jurisdiction updated successfully.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // =========================================================================
        // PHASE 6 HELPER METHODS
        // =========================================================================

        private IActionResult? ValidateLegalReviewEntryGate(DealExecution deal)
        {
            if (deal.DealType != "EQUITY_PARTNERSHIP")
            {
                return UnprocessableEntity(ApiResponse.Error("Legal review is available only for EQUITY_PARTNERSHIP deals."));
            }

            if (deal.DealStage != "LEGAL_REVIEW_PENDING" && deal.DealStage != "SIGNATURE_PENDING")
            {
                return UnprocessableEntity(ApiResponse.Error($"Legal review cannot be accessed in deal stage '{deal.DealStage}'. Must be LEGAL_REVIEW_PENDING."));
            }

            if (deal.RoleAgreement == null || deal.RoleAgreement.Status != "CONFIRMED")
            {
                return UnprocessableEntity(ApiResponse.Error("Role & Responsibility Agreement must be CONFIRMED before entering Legal Review."));
            }

            if (deal.CapTableDraft == null || deal.CapTableDraft.Status != "APPROVED" ||
                deal.CapTableDraft.CreatorConfirmedVersion != deal.CapTableDraft.Version ||
                deal.CapTableDraft.EntrepreneurConfirmedVersion != deal.CapTableDraft.Version)
            {
                return UnprocessableEntity(ApiResponse.Error("Cap Table Ownership Structure must be fully APPROVED by both parties before entering Legal Review."));
            }

            return null;
        }

        private bool IsAuthorizedLegalActor(DealExecution deal, string currentUserId)
        {
            if (string.IsNullOrEmpty(currentUserId)) return false;
            if (deal.CreatorId == currentUserId || deal.EntrepreneurId == currentUserId) return true;
            if (deal.LegalPackage != null && deal.LegalPackage.AssignedLegalProviderId == currentUserId) return true;
            return false;
        }

        private async Task<bool> EnsureSeededLegalPackageAsync(DealExecution deal)
        {
            if (deal.LegalPackage != null && deal.LegalPackage.Documents.Count > 0)
            {
                return false;
            }

            // Check if Entrepreneur has an existing incorporated company
            var existingCompany = await _context.Companies
                .Find(c => c.OwnerId == deal.EntrepreneurId)
                .FirstOrDefaultAsync();

            string companyContext = existingCompany != null ? "CASE_B_EXISTING_COMPANY" : "CASE_A_PRE_INCORPORATION";
            string? companyName = existingCompany?.CompanyName ?? existingCompany?.LegalName;
            string? jurisdiction = existingCompany?.Country;

            var pkg = new LegalReviewPackage
            {
                DealId = deal.Id,
                IdeaId = deal.IdeaId ?? string.Empty,
                Jurisdiction = jurisdiction,
                CompanyContext = companyContext,
                CompanyId = existingCompany?.Id,
                CompanyName = companyName,
                Version = 1,
                Status = "AWAITING_REVIEW",
                ProviderReviewStatus = "NOT_ASSIGNED",
                AcceptedOfferRevisionNumber = deal.AcceptedRevisionNumber ?? 1,
                RoleAgreementVersion = deal.RoleAgreement?.Version ?? 1,
                CapTableVersion = deal.CapTableDraft?.Version ?? 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            pkg.Documents = GenerateLegalDocuments(deal, pkg.Version, pkg.Jurisdiction, pkg.CompanyContext, pkg.CompanyName);
            deal.LegalPackage = pkg;
            return true;
        }

        private List<LegalDocument> GenerateLegalDocuments(
            DealExecution deal,
            int version,
            string? jurisdiction,
            string companyContext,
            string? companyName)
        {
            var docs = new List<LegalDocument>();
            var terms = deal.EquityTerms ?? new EquityTerms();
            var roleAg = deal.RoleAgreement;
            var capTable = deal.CapTableDraft;
            string jurDisplay = string.IsNullOrWhiteSpace(jurisdiction) ? "[Jurisdiction To Be Specified]" : jurisdiction;
            string compDisplay = string.IsNullOrWhiteSpace(companyName) ? "The Venture Entity (To Be Formed)" : companyName;

            // 1. Co-founder Agreement (REQUIRED)
            var cofounderContent = new StringBuilder();
            cofounderContent.AppendLine($"# CO-FOUNDER PARTNERSHIP AGREEMENT (V{version})");
            cofounderContent.AppendLine($"**Governing Jurisdiction**: {jurDisplay}");
            cofounderContent.AppendLine($"**Company Reference**: {compDisplay}");
            cofounderContent.AppendLine();
            cofounderContent.AppendLine("## 1. PARTIES & ROLES");
            cofounderContent.AppendLine($"- **Creator**: {deal.CreatorId} as **{roleAg?.CreatorRole ?? terms.CreatorRole}**");
            cofounderContent.AppendLine($"- **Entrepreneur**: {deal.EntrepreneurId} as **{roleAg?.EntrepreneurRole ?? "CEO"}**");
            cofounderContent.AppendLine();
            cofounderContent.AppendLine("## 2. COMMERCIAL & EQUITY TERMS");
            cofounderContent.AppendLine($"- **Creator Equity Share**: {terms.EquityPercentage}%");
            cofounderContent.AppendLine($"- **Vesting Duration**: {terms.VestingMonths} months");
            cofounderContent.AppendLine($"- **Cliff Duration**: {terms.CliffMonths} months");
            if (terms.CashComponent.HasValue && terms.CashComponent.Value > 0)
                cofounderContent.AppendLine($"- **Cash Stipend**: ${terms.CashComponent.Value:N0}");
            cofounderContent.AppendLine();
            cofounderContent.AppendLine("## 3. RESPONSIBILITIES & TIME COMMITMENT");
            cofounderContent.AppendLine($"- Creator Responsibilities: {string.Join("; ", roleAg?.CreatorResponsibilities ?? new List<string>())}");
            cofounderContent.AppendLine($"- Entrepreneur Responsibilities: {string.Join("; ", roleAg?.EntrepreneurResponsibilities ?? new List<string>())}");

            docs.Add(new LegalDocument
            {
                Id = $"doc_cofounder_v{version}",
                DocumentType = "COFOUNDER_AGREEMENT",
                Title = "Co-founder Partnership Agreement",
                RequirementType = "REQUIRED",
                ContentMarkdown = cofounderContent.ToString(),
                ContentHash = ComputeSha256Hash(cofounderContent.ToString()),
                Version = version,
                Status = "DRAFT",
                LastUpdated = DateTime.UtcNow
            });

            // 2. IP Contribution Agreement (REQUIRED)
            var ipContent = new StringBuilder();
            ipContent.AppendLine($"# INTELLECTUAL PROPERTY CONTRIBUTION AGREEMENT (V{version})");
            ipContent.AppendLine($"**Governing Jurisdiction**: {jurDisplay}");
            ipContent.AppendLine();
            ipContent.AppendLine("## 1. ASSIGNMENT OF PROJECT INTELLECTUAL PROPERTY");
            ipContent.AppendLine($"Creator irrevocably transfers, assigns, and sets over to {compDisplay} all right, title, and interest in and to the project concept, designs, software architectures, trade secrets, and patentable subject matter originated under Idea ID '{deal.IdeaId}'.");
            ipContent.AppendLine();
            ipContent.AppendLine("## 2. REPRESENTATIONS & WARRANTIES");
            ipContent.AppendLine("Creator represents that the intellectual property is original and does not infringe upon any third-party patent, copyright, or trade secret.");

            docs.Add(new LegalDocument
            {
                Id = $"doc_ip_v{version}",
                DocumentType = "IP_CONTRIBUTION_AGREEMENT",
                Title = "IP Contribution & Assignment Agreement",
                RequirementType = "REQUIRED",
                ContentMarkdown = ipContent.ToString(),
                ContentHash = ComputeSha256Hash(ipContent.ToString()),
                Version = version,
                Status = "DRAFT",
                LastUpdated = DateTime.UtcNow
            });

            // 3. Vesting Agreement (REQUIRED)
            var vestingContent = new StringBuilder();
            vestingContent.AppendLine($"# RESTRICTED STOCK PURCHASE & VESTING AGREEMENT (V{version})");
            vestingContent.AppendLine($"**Governing Jurisdiction**: {jurDisplay}");
            vestingContent.AppendLine();
            vestingContent.AppendLine("## 1. VESTING SCHEDULE");
            vestingContent.AppendLine($"- Total Vesting Period: **{terms.VestingMonths} months**");
            vestingContent.AppendLine($"- Initial Cliff: **{terms.CliffMonths} months** (0% vests before cliff; proportional tranche unlocks on cliff date).");
            vestingContent.AppendLine("- Monthly Vesting: Remaining shares vest in equal monthly increments thereafter.");
            vestingContent.AppendLine();
            vestingContent.AppendLine("## 2. REPURCHASE RIGHTS");
            vestingContent.AppendLine("Upon termination of co-founder engagement, the venture maintains the right to repurchase unvested shares at original issue price.");

            docs.Add(new LegalDocument
            {
                Id = $"doc_vesting_v{version}",
                DocumentType = "VESTING_AGREEMENT",
                Title = "Restricted Stock Vesting Agreement",
                RequirementType = "REQUIRED",
                ContentMarkdown = vestingContent.ToString(),
                ContentHash = ComputeSha256Hash(vestingContent.ToString()),
                Version = version,
                Status = "DRAFT",
                LastUpdated = DateTime.UtcNow
            });

            // 4. Shareholder Agreement (REQUIRED for CASE_B, CONDITIONAL for CASE_A)
            var shContent = new StringBuilder();
            shContent.AppendLine($"# SHAREHOLDER AGREEMENT (V{version})");
            shContent.AppendLine($"**Governing Jurisdiction**: {jurDisplay}");
            shContent.AppendLine($"**Company**: {compDisplay}");
            shContent.AppendLine();
            shContent.AppendLine("## 1. CAPITALIZATION & SHARE OWNERSHIP");
            if (capTable != null)
            {
                foreach (var entry in capTable.Entries)
                {
                    shContent.AppendLine($"- **{entry.DisplayName}** ({entry.RoleTitle}): {entry.EquityPercent}% ({entry.SharesGranted:N0} {entry.ShareClass} shares)");
                }
            }
            shContent.AppendLine();
            shContent.AppendLine("## 2. CORPORATE GOVERNANCE & TRANSFER RESTRICTIONS");
            shContent.AppendLine("- Standard Right of First Refusal (ROFR) on share transfers.");
            shContent.AppendLine("- Drag-Along and Tag-Along protections on majority liquidity events.");

            docs.Add(new LegalDocument
            {
                Id = $"doc_shareholder_v{version}",
                DocumentType = "SHAREHOLDER_AGREEMENT",
                Title = "Shareholder Agreement",
                RequirementType = companyContext == "CASE_B_EXISTING_COMPANY" ? "REQUIRED" : "CONDITIONAL",
                ContentMarkdown = shContent.ToString(),
                ContentHash = ComputeSha256Hash(shContent.ToString()),
                Version = version,
                Status = "DRAFT",
                LastUpdated = DateTime.UtcNow
            });

            // 5. Articles Amendment (CONDITIONAL for CASE_B, NOT_APPLICABLE for CASE_A)
            if (companyContext == "CASE_B_EXISTING_COMPANY")
            {
                var articlesContent = new StringBuilder();
                articlesContent.AppendLine($"# ARTICLES OF INCORPORATION AMENDMENT (V{version})");
                articlesContent.AppendLine($"**Entity**: {compDisplay}");
                articlesContent.AppendLine($"**Jurisdiction**: {jurDisplay}");
                articlesContent.AppendLine();
                articlesContent.AppendLine("## 1. AUTHORIZED CAPITAL & SHARE RECLASSIFICATION");
                articlesContent.AppendLine($"Resolved that the authorized capital of {compDisplay} is amended to authorize the issuance of shares to accommodate post-closing cap table allocations.");

                docs.Add(new LegalDocument
                {
                    Id = $"doc_articles_v{version}",
                    DocumentType = "ARTICLES_AMENDMENT",
                    Title = "Articles of Incorporation Amendment",
                    RequirementType = "CONDITIONAL",
                    ContentMarkdown = articlesContent.ToString(),
                    ContentHash = ComputeSha256Hash(articlesContent.ToString()),
                    Version = version,
                    Status = "DRAFT",
                    LastUpdated = DateTime.UtcNow
                });
            }

            // 6. NDA Reference (REQUIRED)
            var ndaContent = new StringBuilder();
            ndaContent.AppendLine($"# EXECUTED MUTUAL NON-DISCLOSURE AGREEMENT REFERENCE (V{version})");
            ndaContent.AppendLine("Confidentiality obligations executed during Phase 2 discovery remain in full force and effect across all partnership operations.");

            docs.Add(new LegalDocument
            {
                Id = $"doc_nda_v{version}",
                DocumentType = "NDA_REFERENCE",
                Title = "Mutual NDA Executed Reference",
                RequirementType = "REQUIRED",
                ContentMarkdown = ndaContent.ToString(),
                ContentHash = ComputeSha256Hash(ndaContent.ToString()),
                Version = version,
                Status = "DRAFT",
                LastUpdated = DateTime.UtcNow
            });

            return docs;
        }

        private static string ComputeSha256Hash(string rawContent)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawContent ?? string.Empty));
            return BitConverter.ToString(bytes).Replace("-", "").ToLowerInvariant();
        }

        private async Task<LegalReviewPackageDto> MapLegalPackageDtoAsync(DealExecution deal)
        {
            var pkg = deal.LegalPackage!;
            var acceptedTerms = deal.EquityTerms ?? new EquityTerms();

            var creatorUser = !string.IsNullOrEmpty(deal.CreatorId) ? await _userManager.FindByIdAsync(deal.CreatorId) : null;
            var entUser = !string.IsNullOrEmpty(deal.EntrepreneurId) ? await _userManager.FindByIdAsync(deal.EntrepreneurId) : null;

            var creatorName = creatorUser != null && !string.IsNullOrWhiteSpace(creatorUser.Name) ? creatorUser.Name : (creatorUser?.UserName ?? "Creator");
            var entName = entUser != null && !string.IsNullOrWhiteSpace(entUser.Name) ? entUser.Name : (entUser?.UserName ?? "Entrepreneur");

            var idea = !string.IsNullOrEmpty(deal.IdeaId)
                ? await _context.CreatorIdeas.Find(i => i.Id == deal.IdeaId).FirstOrDefaultAsync()
                : null;

            return new LegalReviewPackageDto
            {
                Id = pkg.Id,
                DealId = pkg.DealId,
                IdeaId = pkg.IdeaId,
                ProjectName = idea?.Project?.Name ?? "Marketplace Project",
                CreatorId = deal.CreatorId ?? string.Empty,
                CreatorName = creatorName,
                EntrepreneurId = deal.EntrepreneurId ?? string.Empty,
                EntrepreneurName = entName,
                Jurisdiction = pkg.Jurisdiction,
                CompanyContext = pkg.CompanyContext,
                CompanyId = pkg.CompanyId,
                CompanyName = pkg.CompanyName,
                Documents = pkg.Documents.Select(d => new LegalDocumentDto
                {
                    Id = d.Id,
                    DocumentType = d.DocumentType,
                    Title = d.Title,
                    RequirementType = d.RequirementType,
                    ContentMarkdown = d.ContentMarkdown,
                    ContentHash = d.ContentHash,
                    Version = d.Version,
                    Status = d.Status,
                    LastUpdated = d.LastUpdated
                }).ToList(),
                AssignedLegalProviderId = pkg.AssignedLegalProviderId,
                AssignedLegalProviderName = pkg.AssignedLegalProviderName,
                ProviderReviewStatus = pkg.ProviderReviewStatus,
                ProviderReviewedVersion = pkg.ProviderReviewedVersion,
                ProviderReviewedAt = pkg.ProviderReviewedAt,
                ProviderReviewNotes = pkg.ProviderReviewNotes,
                CreatorApprovedVersion = pkg.CreatorApprovedVersion,
                EntrepreneurApprovedVersion = pkg.EntrepreneurApprovedVersion,
                CreatorApprovedAt = pkg.CreatorApprovedAt,
                EntrepreneurApprovedAt = pkg.EntrepreneurApprovedAt,
                AcceptedOfferRevisionNumber = pkg.AcceptedOfferRevisionNumber,
                RoleAgreementVersion = pkg.RoleAgreementVersion,
                CapTableVersion = pkg.CapTableVersion,
                Status = pkg.Status,
                Version = pkg.Version,
                LastEditedByRole = pkg.LastEditedByRole,
                Notes = pkg.Notes,
                CommercialTerms = new DealCommercialSummaryDto
                {
                    EquityPercentage = acceptedTerms.EquityPercentage,
                    CreatorRole = acceptedTerms.CreatorRole,
                    CashComponent = acceptedTerms.CashComponent,
                    VestingEnabled = acceptedTerms.VestingEnabled,
                    VestingMonths = acceptedTerms.VestingMonths,
                    CliffMonths = acceptedTerms.CliffMonths,
                    AcceptedRevisionNumber = deal.AcceptedRevisionNumber ?? 1
                },
                CreatedAt = pkg.CreatedAt,
                UpdatedAt = pkg.UpdatedAt
            };
        }

        // =========================================================================
        // FULL BUYOUT PHASE 3: LEGAL & ASSET TRANSFER REVIEW ENDPOINTS & HELPERS
        // =========================================================================

        /// <summary>
        /// GET /api/deals/{dealId}/buyout/legal
        /// Retrieves the Buyout Legal Review package, seeding documents and asset manifest if valid.
        /// </summary>
        [HttpGet("{dealId}/buyout/legal")]
        public async Task<IActionResult> GetBuyoutLegalPackage(string dealId)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var gateResult = ValidateBuyoutLegalReviewEntryGate(deal);
                if (gateResult != null) return gateResult;

                var currentUserId = GetUserId();
                if (!IsAuthorizedBuyoutLegalActor(deal, currentUserId))
                {
                    return StatusCode(403, ApiResponse.Error("Forbidden. Only Creator, Entrepreneur, or Assigned Legal Service Provider can access Buyout Legal Review."));
                }

                var mutated = await EnsureSeededBuyoutLegalPackageAsync(deal, currentUserId);
                if (mutated)
                {
                    var replaceRes = await _context.DealExecutions.ReplaceOneAsync(d => d.Id == deal.Id, deal);
                    if (replaceRes.MatchedCount == 0)
                    {
                        return StatusCode(409, ApiResponse.Error("Concurrent modification detected. Please retry."));
                    }
                }

                var dto = await MapBuyoutLegalPackageDtoAsync(deal);
                return Ok(ApiResponse.Ok("Buyout legal review package retrieved.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// POST /api/deals/{dealId}/buyout/legal/provider/invite
        /// Invites a verified Legal Service Provider to review the Buyout Legal Package.
        /// </summary>
        [HttpPost("{dealId}/buyout/legal/provider/invite")]
        public async Task<IActionResult> InviteBuyoutLegalProvider(string dealId, [FromBody] InviteBuyoutLegalProviderRequest req)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var gateResult = ValidateBuyoutLegalReviewEntryGate(deal);
                if (gateResult != null) return gateResult;

                if (deal.DealStage != "BUYOUT_TERMS_ACCEPTED" && deal.DealStage != "BUYOUT_LEGAL_REVIEW_PENDING")
                {
                    return UnprocessableEntity(ApiResponse.Error($"Cannot assign a legal provider once Legal & Transfer stage has completed (current stage: '{deal.DealStage}')."));
                }

                var currentUserId = GetUserId();
                if (deal.CreatorId != currentUserId && deal.EntrepreneurId != currentUserId)
                {
                    return StatusCode(403, ApiResponse.Error("Forbidden. Only the Creator or Entrepreneur can invite a legal provider."));
                }

                if (string.IsNullOrWhiteSpace(req.ProviderId))
                {
                    return UnprocessableEntity(ApiResponse.Error("ProviderId is required."));
                }

                // Validate Provider Eligibility
                var providerUser = await _userManager.FindByIdAsync(req.ProviderId);
                var providerProfile = await _context.ServiceProviderProfiles
                    .Find(p => p.UserId == req.ProviderId || p.ProviderId == req.ProviderId)
                    .FirstOrDefaultAsync();

                bool isVerifiedLegal = false;
                string providerDisplayName = "Verified Legal Provider";
                if (providerUser != null)
                {
                    providerDisplayName = !string.IsNullOrWhiteSpace(providerUser.Name) ? providerUser.Name : (providerUser.UserName ?? "Verified Legal Provider");
                }

                if (providerProfile != null)
                {
                    var hasLegalCategory = providerProfile.ServiceCategories != null &&
                        providerProfile.ServiceCategories.Contains(ServiceCategory.Legal);

                    var isVerified = providerProfile.VerificationStatus == ServiceProviderVerificationStatus.Verified ||
                                     providerProfile.ProviderTier != ProviderTier.Tier1;

                    if (hasLegalCategory || isVerified)
                    {
                        isVerifiedLegal = true;
                    }
                }
                else if (providerUser != null)
                {
                    var roles = await _userManager.GetRolesAsync(providerUser);
                    if (roles.Contains("LegalProvider") || roles.Contains("ServiceProvider") || roles.Contains("Admin"))
                    {
                        isVerifiedLegal = true;
                    }
                }

                if (!isVerifiedLegal)
                {
                    return UnprocessableEntity(ApiResponse.Error("Selected Service Provider is not a verified Legal Service Provider."));
                }

                await EnsureSeededBuyoutLegalPackageAsync(deal, currentUserId);

                deal.BuyoutLegalPackage!.AssignedLegalProviderId = providerUser?.Id.ToString() ?? req.ProviderId;
                deal.BuyoutLegalPackage.AssignedLegalProviderName = providerDisplayName;
                deal.BuyoutLegalPackage.ProviderReviewStatus = "ASSIGNED";
                deal.BuyoutLegalPackage.ProviderReviewedVersion = 0;
                deal.BuyoutLegalPackage.ProviderReviewedAt = null;
                deal.BuyoutLegalPackage.UpdatedAt = DateTime.UtcNow;

                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, deal.BuyoutLegalPackage.Version, currentUserId, "buyout_legal_provider_invited");
                await PostMessengerEventAsync(deal.ConversationId, currentUserId, $"Legal review requested from {providerDisplayName}.");

                if (!string.IsNullOrEmpty(deal.BuyoutLegalPackage.AssignedLegalProviderId) && _notifications != null && Guid.TryParse(deal.BuyoutLegalPackage.AssignedLegalProviderId, out var provGuid))
                {
                    await _notifications.CreateNotification(provGuid, "Full Buyout Legal Review", "You were invited to review a Full Buyout transfer package.");
                }

                var replaceRes = await _context.DealExecutions.ReplaceOneAsync(d => d.Id == deal.Id, deal);
                if (replaceRes.MatchedCount == 0)
                {
                    return StatusCode(409, ApiResponse.Error("Concurrent modification conflict. Please retry."));
                }

                var dto = await MapBuyoutLegalPackageDtoAsync(deal);
                return Ok(ApiResponse.Ok("Legal Service Provider assigned successfully.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// POST /api/deals/{dealId}/buyout/legal/provider/review
        /// Updates the Provider Review status on the Buyout Legal Package.
        /// </summary>
        [HttpPost("{dealId}/buyout/legal/provider/review")]
        public async Task<IActionResult> ReviewBuyoutLegalPackage(string dealId, [FromBody] ReviewBuyoutLegalPackageRequest req)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var gateResult = ValidateBuyoutLegalReviewEntryGate(deal);
                if (gateResult != null) return gateResult;

                var currentUserId = GetUserId();
                await EnsureSeededBuyoutLegalPackageAsync(deal, currentUserId);
                var pkg = deal.BuyoutLegalPackage!;

                if (string.IsNullOrEmpty(pkg.AssignedLegalProviderId) || pkg.AssignedLegalProviderId != currentUserId)
                {
                    return StatusCode(403, ApiResponse.Error("Forbidden. Only the assigned Legal Service Provider can complete this review."));
                }

                string newStatus = (req.Status ?? "REVIEW_COMPLETE").ToUpperInvariant();
                if (newStatus != "REVIEW_COMPLETE" && newStatus != "CHANGES_REQUESTED")
                {
                    return UnprocessableEntity(ApiResponse.Error("Status must be 'REVIEW_COMPLETE' or 'CHANGES_REQUESTED'."));
                }

                pkg.ProviderReviewStatus = newStatus;
                pkg.ProviderReviewedAt = DateTime.UtcNow;
                pkg.ProviderReviewNotes = req.Notes?.Trim();
                pkg.UpdatedAt = DateTime.UtcNow;

                if (newStatus == "CHANGES_REQUESTED")
                {
                    pkg.Status = "CHANGES_REQUESTED";
                    pkg.ProviderReviewedVersion = 0;
                    await LogAuditAsync(deal.IdeaId ?? "", deal.Id, pkg.Version, currentUserId, "buyout_legal_changes_requested");
                    await PostMessengerEventAsync(deal.ConversationId, currentUserId, "Legal provider requested changes to the Full Buyout package.");

                    if (!string.IsNullOrEmpty(deal.CreatorId) && _notifications != null && Guid.TryParse(deal.CreatorId, out var crGuid))
                    {
                        await _notifications.CreateNotification(crGuid, "Legal Changes Requested", "Legal provider requested changes to the Full Buyout package.");
                    }
                    if (!string.IsNullOrEmpty(deal.EntrepreneurId) && _notifications != null && Guid.TryParse(deal.EntrepreneurId, out var enGuid))
                    {
                        await _notifications.CreateNotification(enGuid, "Legal Changes Requested", "Legal provider requested changes to the Full Buyout package.");
                    }
                }
                else
                {
                    pkg.ProviderReviewedVersion = pkg.Version;
                    await LogAuditAsync(deal.IdeaId ?? "", deal.Id, pkg.Version, currentUserId, "buyout_legal_review_completed");
                    await PostMessengerEventAsync(deal.ConversationId, currentUserId, "Legal provider review completed. Transfer documents ready for party approval.");

                    await TryCompleteBuyoutLegalStageAsync(deal, currentUserId);
                }

                deal.Version++;
                var replaceRes = await _context.DealExecutions.ReplaceOneAsync(d => d.Id == deal.Id, deal);
                if (replaceRes.MatchedCount == 0)
                {
                    return StatusCode(409, ApiResponse.Error("Concurrent modification conflict. Please retry."));
                }

                var dto = await MapBuyoutLegalPackageDtoAsync(deal);
                return Ok(ApiResponse.Ok("Provider review updated successfully.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// POST /api/deals/{dealId}/buyout/legal/request-changes
        /// Requests changes to legal wording, incrementing legal package version without altering commercial scope.
        /// </summary>
        [HttpPost("{dealId}/buyout/legal/request-changes")]
        public async Task<IActionResult> RequestBuyoutLegalChanges(string dealId, [FromBody] RequestBuyoutLegalChangesRequest req)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var gateResult = ValidateBuyoutLegalReviewEntryGate(deal);
                if (gateResult != null) return gateResult;

                var currentUserId = GetUserId();
                if (deal.CreatorId != currentUserId && deal.EntrepreneurId != currentUserId)
                {
                    return StatusCode(403, ApiResponse.Error("Forbidden. Only the Creator or Entrepreneur can request legal wording changes."));
                }

                if (string.IsNullOrWhiteSpace(req.Comment))
                {
                    return UnprocessableEntity(ApiResponse.Error("A comment explaining the requested legal changes is required."));
                }

                var lowerComment = req.Comment.ToLowerInvariant();
                if (lowerComment.Contains("€") || lowerComment.Contains("purchase price") || lowerComment.Contains("renegotiate price") ||
                    lowerComment.Contains("remove asset") || lowerComment.Contains("reduce price") || lowerComment.Contains("discount") ||
                    lowerComment.Contains("change price") || lowerComment.Contains("lower price"))
                {
                    return UnprocessableEntity(ApiResponse.Error("This change affects accepted Buyout commercial terms and requires commercial renegotiation."));
                }

                await EnsureSeededBuyoutLegalPackageAsync(deal, currentUserId);
                var pkg = deal.BuyoutLegalPackage!;

                pkg.Version++;
                pkg.Status = "CHANGES_REQUESTED";
                pkg.CreatorApprovedVersion = 0;
                pkg.EntrepreneurApprovedVersion = 0;
                pkg.CreatorApprovedAt = null;
                pkg.EntrepreneurApprovedAt = null;
                if (!string.IsNullOrEmpty(pkg.AssignedLegalProviderId))
                {
                    pkg.ProviderReviewStatus = "ASSIGNED";
                    pkg.ProviderReviewedVersion = 0;
                    pkg.ProviderReviewedAt = null;
                }
                pkg.LastEditedByRole = deal.CreatorId == currentUserId ? "creator" : "entrepreneur";
                pkg.LastEditedByUserId = currentUserId;
                pkg.Notes = req.Comment.Trim();
                pkg.UpdatedAt = DateTime.UtcNow;

                pkg.Documents = GenerateBuyoutLegalDocuments(deal, pkg.Version, pkg.Jurisdiction, deal.BuyoutAssetManifest!);

                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, pkg.Version, currentUserId, "buyout_legal_changes_requested");
                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, pkg.Version, currentUserId, "buyout_legal_package_revised");
                await PostMessengerEventAsync(deal.ConversationId, currentUserId, $"Asset transfer package V{pkg.Version} is ready.");

                deal.Version++;
                var replaceRes = await _context.DealExecutions.ReplaceOneAsync(d => d.Id == deal.Id, deal);
                if (replaceRes.MatchedCount == 0)
                {
                    return StatusCode(409, ApiResponse.Error("Concurrent modification conflict. Please retry."));
                }

                var dto = await MapBuyoutLegalPackageDtoAsync(deal);
                return Ok(ApiResponse.Ok($"Legal package revised to V{pkg.Version}.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// POST /api/deals/{dealId}/buyout/legal/documents/{documentId}/revise
        /// Allows assigned legal provider to revise the wording of a specific document.
        /// </summary>
        [HttpPost("{dealId}/buyout/legal/documents/{documentId}/revise")]
        public async Task<IActionResult> ReviseBuyoutDocument(string dealId, string documentId, [FromBody] ReviseBuyoutDocumentRequest req)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var gateResult = ValidateBuyoutLegalReviewEntryGate(deal);
                if (gateResult != null) return gateResult;

                var currentUserId = GetUserId();
                await EnsureSeededBuyoutLegalPackageAsync(deal, currentUserId);
                var pkg = deal.BuyoutLegalPackage!;

                if (string.IsNullOrEmpty(pkg.AssignedLegalProviderId) || pkg.AssignedLegalProviderId != currentUserId)
                {
                    return StatusCode(403, ApiResponse.Error("Forbidden. Only the assigned Legal Service Provider can revise legal document wording."));
                }

                var doc = pkg.Documents.FirstOrDefault(d => d.Id == documentId);
                if (doc == null) return NotFound(ApiResponse.Error("Document not found in legal package."));

                if (string.IsNullOrWhiteSpace(req.ContentMarkdown))
                {
                    return UnprocessableEntity(ApiResponse.Error("ContentMarkdown cannot be empty."));
                }

                doc.ContentMarkdown = req.ContentMarkdown;
                doc.ContentHash = ComputeSha256Hash(doc.ContentMarkdown);
                doc.Version++;
                doc.Status = "REVIEWED";
                doc.LastUpdated = DateTime.UtcNow;
                pkg.UpdatedAt = DateTime.UtcNow;

                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, pkg.Version, currentUserId, "buyout_document_revised");

                var replaceRes = await _context.DealExecutions.ReplaceOneAsync(d => d.Id == deal.Id, deal);
                if (replaceRes.MatchedCount == 0)
                {
                    return StatusCode(409, ApiResponse.Error("Concurrent modification conflict. Please retry."));
                }

                var dto = await MapBuyoutLegalPackageDtoAsync(deal);
                return Ok(ApiResponse.Ok("Document revised successfully.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// POST /api/deals/{dealId}/buyout/legal/approve
        /// Approves the current Buyout Legal Package version. Transitions to BUYOUT_SIGNATURE_PENDING once both parties approve.
        /// </summary>
        [HttpPost("{dealId}/buyout/legal/approve")]
        public async Task<IActionResult> ApproveBuyoutLegalPackage(string dealId, [FromBody] ApproveBuyoutLegalPackageRequest? req = null)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var gateResult = ValidateBuyoutLegalReviewEntryGate(deal);
                if (gateResult != null) return gateResult;

                var currentUserId = GetUserId();
                if (deal.CreatorId != currentUserId && deal.EntrepreneurId != currentUserId)
                {
                    return StatusCode(403, ApiResponse.Error("Forbidden. Only the Creator or Entrepreneur can approve the buyout legal package."));
                }

                await EnsureSeededBuyoutLegalPackageAsync(deal, currentUserId);
                var pkg = deal.BuyoutLegalPackage!;

                if (req != null && req.LegalPackageVersion > 0 && req.LegalPackageVersion != pkg.Version)
                {
                    return StatusCode(409, ApiResponse.Error($"Version conflict: provided V{req.LegalPackageVersion} but active legal package is V{pkg.Version}."));
                }

                var missingAssets = deal.BuyoutAssetManifest?.Assets?.Where(a => a.AvailabilityStatus == "MISSING").ToList() ?? new List<BuyoutAssetEntry>();
                if (missingAssets.Count > 0)
                {
                    var firstMissing = missingAssets.First();
                    return UnprocessableEntity(ApiResponse.Error($"Accepted asset '{firstMissing.DisplayName}' requires verification or upload before final legal approval."));
                }

                bool isCreator = deal.CreatorId == currentUserId;
                bool isEntrepreneur = deal.EntrepreneurId == currentUserId;

                if (isCreator)
                {
                    if (pkg.CreatorApprovedVersion != pkg.Version)
                    {
                        pkg.CreatorApprovedVersion = pkg.Version;
                        pkg.CreatorApprovedAt = DateTime.UtcNow;
                        await LogAuditAsync(deal.IdeaId ?? "", deal.Id, pkg.Version, currentUserId, "creator_buyout_legal_approved");
                        await PostMessengerEventAsync(deal.ConversationId, currentUserId, $"Creator approved Buyout Legal Package V{pkg.Version}.");
                    }
                }
                else if (isEntrepreneur)
                {
                    if (pkg.EntrepreneurApprovedVersion != pkg.Version)
                    {
                        pkg.EntrepreneurApprovedVersion = pkg.Version;
                        pkg.EntrepreneurApprovedAt = DateTime.UtcNow;
                        await LogAuditAsync(deal.IdeaId ?? "", deal.Id, pkg.Version, currentUserId, "entrepreneur_buyout_legal_approved");
                        await PostMessengerEventAsync(deal.ConversationId, currentUserId, $"Entrepreneur approved Buyout Legal Package V{pkg.Version}.");
                    }
                }

                bool isCompleted = await TryCompleteBuyoutLegalStageAsync(deal, currentUserId);
                if (!isCompleted)
                {
                    string counterpartId = isCreator ? (deal.EntrepreneurId ?? "") : (deal.CreatorId ?? "");
                    string counterpartRole = isCreator ? "Creator" : "Entrepreneur";
                    if (!string.IsNullOrEmpty(counterpartId) && _notifications != null && Guid.TryParse(counterpartId, out var cpGuid))
                    {
                        await _notifications.CreateNotification(cpGuid, "Buyout Legal Approval Required", $"{counterpartRole} approved the transfer package. Your approval is required.");
                    }
                }

                deal.Version++;
                var replaceRes = await _context.DealExecutions.ReplaceOneAsync(d => d.Id == deal.Id, deal);
                if (replaceRes.MatchedCount == 0)
                {
                    return StatusCode(409, ApiResponse.Error("Concurrent modification conflict. Please retry."));
                }

                var dto = await MapBuyoutLegalPackageDtoAsync(deal);
                return Ok(ApiResponse.Ok("Buyout legal transfer terms approved successfully.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// GET /api/deals/{dealId}/buyout/legal/documents/{documentId}
        /// Retrieves an individual buyout legal document with content hash.
        /// </summary>
        [HttpGet("{dealId}/buyout/legal/documents/{documentId}")]
        public async Task<IActionResult> GetBuyoutLegalDocument(string dealId, string documentId)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var gateResult = ValidateBuyoutLegalReviewEntryGate(deal);
                if (gateResult != null) return gateResult;

                var currentUserId = GetUserId();
                if (!IsAuthorizedBuyoutLegalActor(deal, currentUserId))
                {
                    return StatusCode(403, ApiResponse.Error("Forbidden."));
                }

                await EnsureSeededBuyoutLegalPackageAsync(deal, currentUserId);
                var doc = deal.BuyoutLegalPackage?.Documents.FirstOrDefault(d => d.Id == documentId);
                if (doc == null) return NotFound(ApiResponse.Error("Document not found."));

                var dto = new BuyoutLegalDocumentDto
                {
                    Id = doc.Id,
                    DocumentType = doc.DocumentType,
                    Title = doc.Title,
                    RequirementType = doc.RequirementType,
                    ContentMarkdown = doc.ContentMarkdown,
                    ContentHash = doc.ContentHash,
                    Version = doc.Version,
                    Status = doc.Status,
                    LastUpdated = doc.LastUpdated
                };

                return Ok(ApiResponse.Ok("Buyout legal document retrieved.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// POST /api/deals/{dealId}/buyout/legal/documents/{documentId}/explain
        /// Returns an AI plain-language explanation of a buyout legal document with legal disclaimer.
        /// </summary>
        [HttpPost("{dealId}/buyout/legal/documents/{documentId}/explain")]
        public async Task<IActionResult> ExplainBuyoutLegalDocument(string dealId, string documentId)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var currentUserId = GetUserId();
                if (!IsAuthorizedBuyoutLegalActor(deal, currentUserId))
                {
                    return StatusCode(403, ApiResponse.Error("Forbidden."));
                }

                await EnsureSeededBuyoutLegalPackageAsync(deal, currentUserId);
                var doc = deal.BuyoutLegalPackage?.Documents.FirstOrDefault(d => d.Id == documentId);
                if (doc == null) return NotFound(ApiResponse.Error("Document not found."));

                var terms = deal.BuyoutTerms ?? new BuyoutTerms();
                string explanation;

                switch (doc.DocumentType)
                {
                    case "ASSET_PURCHASE_AGREEMENT":
                        explanation = $"This agreement establishes the core sale of the project assets to the buyer for the agreed purchase price of €{terms.PurchasePrice:N0}. It specifies closing terms, handover timeline ({terms.HandoverPeriodWeeks} weeks), and representations.";
                        break;
                    case "IP_ASSIGNMENT_AGREEMENT":
                        explanation = "This agreement transfers all worldwide intellectual property rights, copyright, and patent ownership associated with the project from the Creator to the Buyer.";
                        break;
                    case "ASSET_TRANSFER_SCHEDULE":
                        explanation = "This schedule lists every specific asset included in this buyout transaction, indicating whether the asset is transferred via the platform or requires external transfer.";
                        break;
                    case "HANDOVER_TRANSITION_SCHEDULE":
                        explanation = $"This schedule details the operational handover ({terms.HandoverPeriodWeeks} weeks) and the transition support period ({terms.TransitionSupportWeeks} weeks) provided by the Creator.";
                        break;
                    case "TRANSITION_SUPPORT_AGREEMENT":
                        explanation = $"This agreement binds the Creator to provide {terms.TransitionSupportWeeks} weeks of technical and advisory transition assistance to ensure seamless onboarding.";
                        break;
                    case "BRAND_TRANSFER_SCHEDULE":
                        explanation = "This schedule covers the handover of brand assets, logo files, visual design guidelines, and associated marketing materials.";
                        break;
                    case "DOMAIN_TRANSFER_SCHEDULE":
                        explanation = "This schedule outlines the external registrar transfer and DNS authority handover for the project's domain names.";
                        break;
                    case "SOURCE_CODE_TRANSFER_SCHEDULE":
                        explanation = "This schedule defines the repository transfer, commit history handover, and codebase access credentials.";
                        break;
                    default:
                        explanation = "This document forms part of the agreed Full Buyout legal transfer package.";
                        break;
                }

                var resp = new ExplainBuyoutLegalDocumentResponse
                {
                    DocumentId = doc.Id,
                    DocumentType = doc.DocumentType,
                    Explanation = explanation,
                    Disclaimer = "AI-generated explanation — not legal advice."
                };

                return Ok(ApiResponse.Ok("Document explanation generated.", resp));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // =========================================================================
        // FULL BUYOUT PHASE 3 HELPER METHODS
        // =========================================================================

        private IActionResult? ValidateBuyoutLegalReviewEntryGate(DealExecution deal)
        {
            if (deal.DealType != "FULL_BUYOUT")
            {
                return UnprocessableEntity(ApiResponse.Error("Legal review is available only for FULL_BUYOUT deals."));
            }

            if (deal.DealStage != "BUYOUT_TERMS_ACCEPTED" && deal.DealStage != "BUYOUT_SIGNATURE_PENDING")
            {
                return UnprocessableEntity(ApiResponse.Error($"Legal review cannot be accessed in deal stage '{deal.DealStage}'. Must be BUYOUT_TERMS_ACCEPTED."));
            }

            if (deal.AcceptedRevisionNumber == null || deal.AcceptedRevisionNumber <= 0)
            {
                return UnprocessableEntity(ApiResponse.Error("Accepted revision is required to enter Legal Review."));
            }

            return null;
        }

        private bool IsAuthorizedBuyoutLegalActor(DealExecution deal, string currentUserId)
        {
            if (string.IsNullOrEmpty(currentUserId)) return false;
            if (deal.CreatorId == currentUserId || deal.EntrepreneurId == currentUserId) return true;
            if (deal.BuyoutLegalPackage != null && deal.BuyoutLegalPackage.AssignedLegalProviderId == currentUserId) return true;
            return false;
        }

        private async Task<bool> EnsureSeededBuyoutLegalPackageAsync(DealExecution deal, string currentUserId)
        {
            if (deal.BuyoutLegalPackage != null && deal.BuyoutLegalPackage.Documents.Count > 0 && deal.BuyoutAssetManifest != null)
            {
                return false;
            }

            var acceptedTerms = deal.BuyoutTerms ??
                deal.Revisions?.FirstOrDefault(r => r.RevisionNumber == deal.AcceptedRevisionNumber)?.BuyoutTerms ??
                deal.Revisions?.LastOrDefault()?.BuyoutTerms ??
                new BuyoutTerms();

            var manifest = deal.BuyoutAssetManifest ?? BuildBuyoutAssetTransferManifest(deal, acceptedTerms);
            var pkg = deal.BuyoutLegalPackage ?? new BuyoutLegalReviewPackage
            {
                DealId = deal.Id,
                IdeaId = deal.IdeaId ?? string.Empty,
                Jurisdiction = "European Union (Standard Commercial)",
                Version = 1,
                Status = "AWAITING_REVIEW",
                ProviderReviewStatus = "NOT_ASSIGNED",
                AcceptedBuyoutRevisionNumber = deal.AcceptedRevisionNumber ?? 1,
                AssetManifestVersion = manifest.Version,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            if (pkg.Documents.Count == 0)
            {
                pkg.Documents = GenerateBuyoutLegalDocuments(deal, pkg.Version, pkg.Jurisdiction, manifest);
            }

            deal.BuyoutAssetManifest = manifest;
            deal.BuyoutLegalPackage = pkg;

            await LogAuditAsync(deal.IdeaId ?? "", deal.Id, pkg.Version, currentUserId, "buyout_legal_review_started");
            await LogAuditAsync(deal.IdeaId ?? "", deal.Id, manifest.Version, currentUserId, "buyout_asset_manifest_created");

            return true;
        }

        private BuyoutAssetTransferManifest BuildBuyoutAssetTransferManifest(DealExecution deal, BuyoutTerms terms)
        {
            var assets = new List<BuyoutAssetEntry>();
            var includedList = terms.IncludedAssets != null && terms.IncludedAssets.Count > 0
                ? terms.IncludedAssets
                : new List<string> { "Full Intellectual Property & Concept Ownership", "Complete Business Plan & Financial Model" };

            foreach (var assetName in includedList)
            {
                if (string.IsNullOrWhiteSpace(assetName)) continue;
                string lower = assetName.ToLowerInvariant();

                if (lower.Contains("source code") || lower.Contains("repository") || lower.Contains("git"))
                {
                    assets.Add(new BuyoutAssetEntry
                    {
                        AssetType = "SOURCE_CODE",
                        DisplayName = assetName,
                        TransferRequired = true,
                        AvailabilityStatus = "MISSING",
                        Notes = "Accepted asset 'Source Code' requires verification or upload."
                    });
                }
                else if (lower.Contains("domain"))
                {
                    assets.Add(new BuyoutAssetEntry
                    {
                        AssetType = "DOMAIN",
                        DisplayName = assetName,
                        TransferRequired = true,
                        AvailabilityStatus = "EXTERNAL_TRANSFER_REQUIRED",
                        ExternalTransferRequired = true,
                        Notes = "Requires DNS and registrar authorization code transfer."
                    });
                }
                else if (lower.Contains("brand") || lower.Contains("logo") || lower.Contains("design"))
                {
                    assets.Add(new BuyoutAssetEntry
                    {
                        AssetType = "BRAND_ASSETS",
                        DisplayName = assetName,
                        TransferRequired = true,
                        AvailabilityStatus = "AVAILABLE_IN_PLATFORM",
                        Notes = "Available in platform media vault."
                    });
                }
                else if (lower.Contains("forecast") || lower.Contains("financial"))
                {
                    assets.Add(new BuyoutAssetEntry
                    {
                        AssetType = "FINANCIAL_FORECAST",
                        DisplayName = assetName,
                        TransferRequired = true,
                        AvailabilityStatus = "AVAILABLE_IN_PLATFORM",
                        Notes = "Available in platform financial projection records."
                    });
                }
                else if (lower.Contains("gtm") || lower.Contains("market") || lower.Contains("strategy"))
                {
                    assets.Add(new BuyoutAssetEntry
                    {
                        AssetType = "GTM_STRATEGY",
                        DisplayName = assetName,
                        TransferRequired = true,
                        AvailabilityStatus = "AVAILABLE_IN_PLATFORM",
                        Notes = "Available in platform project blueprint."
                    });
                }
                else if (lower.Contains("ip") || lower.Contains("intellectual property") || lower.Contains("concept"))
                {
                    assets.Add(new BuyoutAssetEntry
                    {
                        AssetType = "IP_RIGHTS",
                        DisplayName = assetName,
                        TransferRequired = true,
                        AvailabilityStatus = "AVAILABLE_IN_PLATFORM",
                        Notes = "Full project concept and documentation IP."
                    });
                }
                else
                {
                    assets.Add(new BuyoutAssetEntry
                    {
                        AssetType = "BUSINESS_DOCUMENT",
                        DisplayName = assetName,
                        TransferRequired = true,
                        AvailabilityStatus = "AVAILABLE_IN_PLATFORM",
                        Notes = "Available in platform project documentation."
                    });
                }
            }

            var manifest = new BuyoutAssetTransferManifest
            {
                DealId = deal.Id,
                IdeaId = deal.IdeaId ?? string.Empty,
                AcceptedRevisionNumber = deal.AcceptedRevisionNumber ?? 1,
                PurchasePrice = terms.PurchasePrice,
                Currency = "EUR",
                HandoverPeriodWeeks = terms.HandoverPeriodWeeks,
                TransitionSupportWeeks = terms.TransitionSupportWeeks,
                Assets = assets,
                Version = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var rawConcat = $"{deal.Id}:{terms.PurchasePrice}:{terms.HandoverPeriodWeeks}:{terms.TransitionSupportWeeks}:{string.Join(",", assets.Select(a => $"{a.AssetType}:{a.DisplayName}:{a.AvailabilityStatus}"))}";
            manifest.ManifestHash = ComputeSha256Hash(rawConcat);

            return manifest;
        }

        private List<BuyoutLegalDocument> GenerateBuyoutLegalDocuments(
            DealExecution deal,
            int version,
            string? jurisdiction,
            BuyoutAssetTransferManifest manifest)
        {
            var docs = new List<BuyoutLegalDocument>();
            var terms = deal.BuyoutTerms ?? new BuyoutTerms { PurchasePrice = manifest.PurchasePrice, HandoverPeriodWeeks = manifest.HandoverPeriodWeeks, TransitionSupportWeeks = manifest.TransitionSupportWeeks };
            string jurDisplay = string.IsNullOrWhiteSpace(jurisdiction) ? "European Union (Standard Commercial)" : jurisdiction;

            // 1. Asset Purchase Agreement (REQUIRED)
            var apaContent = new StringBuilder();
            apaContent.AppendLine($"# FULL BUYOUT ASSET PURCHASE AGREEMENT (V{version})");
            apaContent.AppendLine($"**Governing Jurisdiction**: {jurDisplay}");
            apaContent.AppendLine($"**Purchase Price**: €{terms.PurchasePrice:N0}");
            apaContent.AppendLine($"**Handover Period**: {terms.HandoverPeriodWeeks} weeks");
            apaContent.AppendLine($"**Transition Support**: {terms.TransitionSupportWeeks} weeks");
            apaContent.AppendLine();
            apaContent.AppendLine("## 1. PARTIES");
            apaContent.AppendLine($"- **Seller (Creator)**: User ID `{deal.CreatorId}`");
            apaContent.AppendLine($"- **Buyer (Entrepreneur)**: User ID `{deal.EntrepreneurId}`");
            apaContent.AppendLine();
            apaContent.AppendLine("## 2. SALE AND PURCHASE OF ASSETS");
            apaContent.AppendLine($"Upon closing and receipt of total consideration of **€{terms.PurchasePrice:N0}**, Seller agrees to sell, convey, assign, transfer, and deliver to Buyer, and Buyer agrees to purchase from Seller, all right, title, and interest in and to the Acquired Assets set forth in the Asset Transfer Schedule.");
            apaContent.AppendLine();
            apaContent.AppendLine("## 3. HANDOVER & TRANSITION SUPPORT");
            apaContent.AppendLine($"- Operational handover shall be completed within **{terms.HandoverPeriodWeeks} weeks**.");
            if (terms.TransitionSupportWeeks > 0)
                apaContent.AppendLine($"- Transition support shall continue for **{terms.TransitionSupportWeeks} weeks** following closing.");
            apaContent.AppendLine();
            apaContent.AppendLine("## 4. REPRESENTATIONS & WARRANTIES");
            apaContent.AppendLine("Seller represents and warrants that Seller is the sole author and legal owner of all transferred project materials and has full authority to enter into this transaction.");

            docs.Add(new BuyoutLegalDocument
            {
                Id = $"doc_buyout_apa_v{version}",
                DocumentType = "ASSET_PURCHASE_AGREEMENT",
                Title = "Full Buyout Asset Purchase Agreement",
                RequirementType = "REQUIRED",
                ContentMarkdown = apaContent.ToString(),
                ContentHash = ComputeSha256Hash(apaContent.ToString()),
                Version = version,
                Status = "DRAFT",
                LastUpdated = DateTime.UtcNow
            });

            // 2. Asset Transfer Schedule (REQUIRED)
            var scheduleContent = new StringBuilder();
            scheduleContent.AppendLine($"# ASSET TRANSFER SCHEDULE (V{version})");
            scheduleContent.AppendLine($"**Purchase Price Reference**: €{terms.PurchasePrice:N0}");
            scheduleContent.AppendLine();
            scheduleContent.AppendLine("## Included Acquired Assets");
            foreach (var asset in manifest.Assets)
            {
                scheduleContent.AppendLine($"- **{asset.DisplayName}** (`{asset.AssetType}`) — Status: {asset.AvailabilityStatus}");
            }

            docs.Add(new BuyoutLegalDocument
            {
                Id = $"doc_buyout_transfer_sched_v{version}",
                DocumentType = "ASSET_TRANSFER_SCHEDULE",
                Title = "Asset Transfer Schedule",
                RequirementType = "REQUIRED",
                ContentMarkdown = scheduleContent.ToString(),
                ContentHash = ComputeSha256Hash(scheduleContent.ToString()),
                Version = version,
                Status = "DRAFT",
                LastUpdated = DateTime.UtcNow
            });

            // 3. Handover & Transition Schedule (REQUIRED)
            var handoverContent = new StringBuilder();
            handoverContent.AppendLine($"# HANDOVER & TRANSITION SCHEDULE (V{version})");
            handoverContent.AppendLine($"## 1. Handover Timeline ({terms.HandoverPeriodWeeks} Weeks)");
            handoverContent.AppendLine("During the handover period, Seller shall deliver all platform assets and external transfer authorization codes to Buyer.");
            handoverContent.AppendLine();
            handoverContent.AppendLine($"## 2. Transition Support ({terms.TransitionSupportWeeks} Weeks)");
            handoverContent.AppendLine($"Seller agrees to provide advisory support for {terms.TransitionSupportWeeks} weeks following handover completion.");

            docs.Add(new BuyoutLegalDocument
            {
                Id = $"doc_buyout_handover_v{version}",
                DocumentType = "HANDOVER_TRANSITION_SCHEDULE",
                Title = "Handover & Transition Schedule",
                RequirementType = "REQUIRED",
                ContentMarkdown = handoverContent.ToString(),
                ContentHash = ComputeSha256Hash(handoverContent.ToString()),
                Version = version,
                Status = "DRAFT",
                LastUpdated = DateTime.UtcNow
            });

            // 4. IP Assignment Agreement (CONDITIONAL - if IP included)
            bool hasIp = manifest.Assets.Any(a => a.AssetType == "IP_RIGHTS");
            if (hasIp)
            {
                var ipContent = new StringBuilder();
                ipContent.AppendLine($"# INTELLECTUAL PROPERTY ASSIGNMENT AGREEMENT (V{version})");
                ipContent.AppendLine($"Assignor (Seller) hereby irrevocably assigns, transfers, and conveys to Assignee (Buyer) all worldwide copyright, patents, trademark rights, and trade secrets in the project concept, architecture, and specifications.");

                docs.Add(new BuyoutLegalDocument
                {
                    Id = $"doc_buyout_ip_assign_v{version}",
                    DocumentType = "IP_ASSIGNMENT_AGREEMENT",
                    Title = "Intellectual Property Assignment Agreement",
                    RequirementType = "CONDITIONAL",
                    ContentMarkdown = ipContent.ToString(),
                    ContentHash = ComputeSha256Hash(ipContent.ToString()),
                    Version = version,
                    Status = "DRAFT",
                    LastUpdated = DateTime.UtcNow
                });
            }

            // 5. Brand Transfer Schedule (CONDITIONAL - if brand included)
            bool hasBrand = manifest.Assets.Any(a => a.AssetType == "BRAND_ASSETS");
            if (hasBrand)
            {
                var brandContent = new StringBuilder();
                brandContent.AppendLine($"# BRAND & DESIGN ASSET TRANSFER SCHEDULE (V{version})");
                brandContent.AppendLine("Covers full handover of logo vector files, typography guidelines, brand identity kits, and graphic mockups.");

                docs.Add(new BuyoutLegalDocument
                {
                    Id = $"doc_buyout_brand_v{version}",
                    DocumentType = "BRAND_TRANSFER_SCHEDULE",
                    Title = "Brand & Design Asset Transfer Schedule",
                    RequirementType = "CONDITIONAL",
                    ContentMarkdown = brandContent.ToString(),
                    ContentHash = ComputeSha256Hash(brandContent.ToString()),
                    Version = version,
                    Status = "DRAFT",
                    LastUpdated = DateTime.UtcNow
                });
            }

            // 6. Domain Transfer Schedule (CONDITIONAL - if domain included)
            bool hasDomain = manifest.Assets.Any(a => a.AssetType == "DOMAIN");
            if (hasDomain)
            {
                var domainContent = new StringBuilder();
                domainContent.AppendLine($"# DOMAIN NAME & DNS TRANSFER SCHEDULE (V{version})");
                domainContent.AppendLine("Seller shall unlock the registrar domain and supply the Authorization / EPP Transfer Code to Buyer within 5 business days of closing.");

                docs.Add(new BuyoutLegalDocument
                {
                    Id = $"doc_buyout_domain_v{version}",
                    DocumentType = "DOMAIN_TRANSFER_SCHEDULE",
                    Title = "Domain Name & DNS Transfer Schedule",
                    RequirementType = "CONDITIONAL",
                    ContentMarkdown = domainContent.ToString(),
                    ContentHash = ComputeSha256Hash(domainContent.ToString()),
                    Version = version,
                    Status = "DRAFT",
                    LastUpdated = DateTime.UtcNow
                });
            }

            // 7. Source Code Transfer Schedule (CONDITIONAL - if code included)
            bool hasCode = manifest.Assets.Any(a => a.AssetType == "SOURCE_CODE");
            if (hasCode)
            {
                var codeContent = new StringBuilder();
                codeContent.AppendLine($"# SOURCE CODE & REPOSITORY TRANSFER SCHEDULE (V{version})");
                codeContent.AppendLine("Seller shall transfer GitHub / Git repository administrative ownership and deliver all codebase tags, branches, and commit histories.");

                docs.Add(new BuyoutLegalDocument
                {
                    Id = $"doc_buyout_code_v{version}",
                    DocumentType = "SOURCE_CODE_TRANSFER_SCHEDULE",
                    Title = "Source Code & Repository Transfer Schedule",
                    RequirementType = "CONDITIONAL",
                    ContentMarkdown = codeContent.ToString(),
                    ContentHash = ComputeSha256Hash(codeContent.ToString()),
                    Version = version,
                    Status = "DRAFT",
                    LastUpdated = DateTime.UtcNow
                });
            }

            // 8. Business Documentation Transfer Schedule (CONDITIONAL - if biz docs included)
            bool hasBizDoc = manifest.Assets.Any(a => a.AssetType == "BUSINESS_DOCUMENT" || a.AssetType == "FINANCIAL_FORECAST" || a.AssetType == "GTM_STRATEGY");
            if (hasBizDoc)
            {
                var bizContent = new StringBuilder();
                bizContent.AppendLine($"# BUSINESS DOCUMENTATION TRANSFER SCHEDULE (V{version})");
                bizContent.AppendLine("Covers transfer of comprehensive Business Plan, Financial Forecast model, Unit Economics, and Go-To-Market roadmap.");

                docs.Add(new BuyoutLegalDocument
                {
                    Id = $"doc_buyout_bizdoc_v{version}",
                    DocumentType = "BUSINESS_DOCUMENT_TRANSFER_SCHEDULE",
                    Title = "Business Documentation Transfer Schedule",
                    RequirementType = "CONDITIONAL",
                    ContentMarkdown = bizContent.ToString(),
                    ContentHash = ComputeSha256Hash(bizContent.ToString()),
                    Version = version,
                    Status = "DRAFT",
                    LastUpdated = DateTime.UtcNow
                });
            }

            // 9. Transition Support Agreement (CONDITIONAL - if TransitionSupportWeeks > 0)
            if (terms.TransitionSupportWeeks > 0)
            {
                var transContent = new StringBuilder();
                transContent.AppendLine($"# TRANSITION SUPPORT AGREEMENT (V{version})");
                transContent.AppendLine($"Seller agrees to provide {terms.TransitionSupportWeeks} weeks of technical orientation, Q&A sessions, and vendor introduction support to Buyer.");

                docs.Add(new BuyoutLegalDocument
                {
                    Id = $"doc_buyout_trans_supp_v{version}",
                    DocumentType = "TRANSITION_SUPPORT_AGREEMENT",
                    Title = "Transition Support Agreement",
                    RequirementType = "CONDITIONAL",
                    ContentMarkdown = transContent.ToString(),
                    ContentHash = ComputeSha256Hash(transContent.ToString()),
                    Version = version,
                    Status = "DRAFT",
                    LastUpdated = DateTime.UtcNow
                });
            }

            return docs;
        }

        private async Task<bool> TryCompleteBuyoutLegalStageAsync(DealExecution deal, string currentUserId)
        {
            var pkg = deal.BuyoutLegalPackage;
            if (pkg == null) return false;

            bool hasAssignedProvider = !string.IsNullOrEmpty(pkg.AssignedLegalProviderId);
            bool isProviderRequirementSatisfied = !hasAssignedProvider 
                || (pkg.ProviderReviewStatus == "REVIEW_COMPLETE" && pkg.ProviderReviewedVersion == pkg.Version);

            var manifest = deal.BuyoutAssetManifest ?? BuildBuyoutAssetTransferManifest(deal, deal.BuyoutTerms ?? new BuyoutTerms());
            bool isManifestComplete = !manifest.Assets.Any(a => a.AvailabilityStatus == "MISSING");

            bool isBilateralApproved = pkg.CreatorApprovedVersion == pkg.Version 
                && pkg.EntrepreneurApprovedVersion == pkg.Version;

            if (isProviderRequirementSatisfied && isManifestComplete && isBilateralApproved)
            {
                if (deal.DealStage != "BUYOUT_SIGNATURE_PENDING" && deal.DealStage != "BUYOUT_CLOSING_PENDING" && deal.DealStage != "BUYOUT_HANDOVER_PENDING" && deal.DealStage != "SOLD" && deal.DealStage != "BUYOUT_COMPLETED")
                {
                    pkg.Status = "APPROVED";
                    deal.DealStage = "BUYOUT_SIGNATURE_PENDING";
                    deal.UpdatedAt = DateTime.UtcNow;

                    await LogAuditAsync(deal.IdeaId ?? "", deal.Id, pkg.Version, currentUserId, "buyout_legal_package_approved");
                    await PostMessengerEventAsync(deal.ConversationId, currentUserId, "Legal transfer package fully approved. Signatures required.");

                    if (!string.IsNullOrEmpty(deal.CreatorId) && _notifications != null && Guid.TryParse(deal.CreatorId, out var crGuid))
                    {
                        await _notifications.CreateNotification(crGuid, "Buyout Legal Package Approved", "Transfer documents are ready for signature.");
                    }
                    if (!string.IsNullOrEmpty(deal.EntrepreneurId) && _notifications != null && Guid.TryParse(deal.EntrepreneurId, out var enGuid))
                    {
                        await _notifications.CreateNotification(enGuid, "Buyout Legal Package Approved", "Transfer documents are ready for signature.");
                    }
                }
                return true;
            }
            else
            {
                if (pkg.CreatorApprovedVersion == pkg.Version && pkg.EntrepreneurApprovedVersion != pkg.Version)
                {
                    pkg.Status = "CREATOR_APPROVED";
                }
                else if (pkg.EntrepreneurApprovedVersion == pkg.Version && pkg.CreatorApprovedVersion != pkg.Version)
                {
                    pkg.Status = "ENTREPRENEUR_APPROVED";
                }
                else if (hasAssignedProvider && pkg.ProviderReviewStatus == "CHANGES_REQUESTED")
                {
                    pkg.Status = "CHANGES_REQUESTED";
                }
                else if (hasAssignedProvider && pkg.ProviderReviewStatus == "IN_REVIEW")
                {
                    pkg.Status = "IN_REVIEW";
                }
                else
                {
                    pkg.Status = "AWAITING_REVIEW";
                }
                pkg.UpdatedAt = DateTime.UtcNow;
                return false;
            }
        }

        private async Task<BuyoutLegalPackageDto> MapBuyoutLegalPackageDtoAsync(DealExecution deal)
        {
            var pkg = deal.BuyoutLegalPackage!;
            var manifest = deal.BuyoutAssetManifest ?? BuildBuyoutAssetTransferManifest(deal, deal.BuyoutTerms ?? new BuyoutTerms());

            var creatorUser = !string.IsNullOrEmpty(deal.CreatorId) ? await _userManager.FindByIdAsync(deal.CreatorId) : null;
            var entUser = !string.IsNullOrEmpty(deal.EntrepreneurId) ? await _userManager.FindByIdAsync(deal.EntrepreneurId) : null;

            var creatorName = creatorUser != null && !string.IsNullOrWhiteSpace(creatorUser.Name) ? creatorUser.Name : (creatorUser?.UserName ?? "Creator");
            var entName = entUser != null && !string.IsNullOrWhiteSpace(entUser.Name) ? entUser.Name : (entUser?.UserName ?? "Entrepreneur");

            var idea = !string.IsNullOrEmpty(deal.IdeaId)
                ? await _context.CreatorIdeas.Find(i => i.Id == deal.IdeaId).FirstOrDefaultAsync()
                : null;

            var blockers = new List<string>();
            foreach (var asset in manifest.Assets)
            {
                if (asset.AvailabilityStatus == "MISSING")
                {
                    blockers.Add($"Accepted asset '{asset.DisplayName}' requires verification or upload.");
                }
            }

            return new BuyoutLegalPackageDto
            {
                Id = pkg.Id,
                DealId = pkg.DealId,
                IdeaId = pkg.IdeaId,
                ProjectName = idea?.Project?.Name ?? "Marketplace Project",
                CreatorId = deal.CreatorId ?? string.Empty,
                CreatorName = creatorName,
                EntrepreneurId = deal.EntrepreneurId ?? string.Empty,
                EntrepreneurName = entName,
                PurchasePrice = manifest.PurchasePrice,
                Currency = manifest.Currency,
                HandoverPeriodWeeks = manifest.HandoverPeriodWeeks,
                TransitionSupportWeeks = manifest.TransitionSupportWeeks,
                IncludedAssets = manifest.Assets.Select(a => a.DisplayName).ToList(),
                Jurisdiction = pkg.Jurisdiction,
                Documents = pkg.Documents.Select(d => new BuyoutLegalDocumentDto
                {
                    Id = d.Id,
                    DocumentType = d.DocumentType,
                    Title = d.Title,
                    RequirementType = d.RequirementType,
                    ContentMarkdown = d.ContentMarkdown,
                    ContentHash = d.ContentHash,
                    Version = d.Version,
                    Status = d.Status,
                    LastUpdated = d.LastUpdated
                }).ToList(),
                AssetManifest = MapBuyoutAssetManifestDto(manifest),
                AssignedLegalProviderId = pkg.AssignedLegalProviderId,
                AssignedLegalProviderName = pkg.AssignedLegalProviderName,
                ProviderReviewStatus = pkg.ProviderReviewStatus,
                ProviderReviewedAt = pkg.ProviderReviewedAt,
                ProviderReviewNotes = pkg.ProviderReviewNotes,
                ProviderReviewedVersion = pkg.ProviderReviewedVersion,
                CreatorApprovedVersion = pkg.CreatorApprovedVersion,
                EntrepreneurApprovedVersion = pkg.EntrepreneurApprovedVersion,
                CreatorApprovedAt = pkg.CreatorApprovedAt,
                EntrepreneurApprovedAt = pkg.EntrepreneurApprovedAt,
                AcceptedBuyoutRevisionNumber = pkg.AcceptedBuyoutRevisionNumber,
                AssetManifestVersion = pkg.AssetManifestVersion,
                Status = pkg.Status,
                Version = pkg.Version,
                Notes = pkg.Notes,
                Blockers = blockers,
                CreatedAt = pkg.CreatedAt,
                UpdatedAt = pkg.UpdatedAt
            };
        }

        private static BuyoutAssetTransferManifestDto MapBuyoutAssetManifestDto(BuyoutAssetTransferManifest manifest)
        {
            var blockers = new List<string>();
            foreach (var asset in manifest.Assets)
            {
                if (asset.AvailabilityStatus == "MISSING")
                {
                    blockers.Add($"Accepted asset '{asset.DisplayName}' requires verification or upload.");
                }
            }

            return new BuyoutAssetTransferManifestDto
            {
                Id = manifest.Id,
                DealId = manifest.DealId,
                IdeaId = manifest.IdeaId,
                AcceptedRevisionNumber = manifest.AcceptedRevisionNumber,
                PurchasePrice = manifest.PurchasePrice,
                Currency = manifest.Currency,
                HandoverPeriodWeeks = manifest.HandoverPeriodWeeks,
                TransitionSupportWeeks = manifest.TransitionSupportWeeks,
                Assets = manifest.Assets.Select(a => new BuyoutAssetEntryDto
                {
                    AssetType = a.AssetType,
                    DisplayName = a.DisplayName,
                    TransferRequired = a.TransferRequired,
                    AvailabilityStatus = a.AvailabilityStatus,
                    SourceReference = a.SourceReference,
                    DocumentId = a.DocumentId,
                    FileReference = a.FileReference,
                    ExternalTransferRequired = a.ExternalTransferRequired,
                    Notes = a.Notes
                }).ToList(),
                Version = manifest.Version,
                ManifestHash = manifest.ManifestHash,
                Blockers = blockers,
                CreatedAt = manifest.CreatedAt,
                UpdatedAt = manifest.UpdatedAt
            };
        }

        // =========================================================================
        // FULL BUYOUT PHASE 4: FINAL TRANSFER AGREEMENT SIGNING ENDPOINTS
        // =========================================================================

        /// <summary>
        /// GET /api/deals/{dealId}/buyout/signing
        /// Retrieves the Buyout Agreement Signing Package, seeding from approved legal package if needed.
        /// </summary>
        [HttpGet("{dealId}/buyout/signing")]
        public async Task<IActionResult> GetBuyoutSigningPackage(string dealId)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var gateError = ValidateBuyoutSigningEntryGate(deal);
                if (gateError != null) return UnprocessableEntity(ApiResponse.Error(gateError));

                var currentUserId = GetUserId();
                if (!IsAuthorizedBuyoutLegalActor(deal, currentUserId))
                {
                    return StatusCode(403, ApiResponse.Error("Forbidden. Only Creator, Entrepreneur, or Assigned Legal Provider can access Buyout Signing."));
                }

                var mutated = await EnsureSeededBuyoutSigningPackageAsync(deal, currentUserId);
                if (mutated)
                {
                    var replaceRes = await _context.DealExecutions.ReplaceOneAsync(d => d.Id == deal.Id, deal);
                    if (replaceRes.MatchedCount == 0)
                    {
                        return StatusCode(409, ApiResponse.Error("Concurrent modification detected. Please retry."));
                    }
                }

                var dto = await MapBuyoutSigningPackageDtoAsync(deal);
                return Ok(ApiResponse.Ok("Buyout agreement signing package retrieved.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// POST /api/deals/{dealId}/buyout/signing/prepare
        /// Explicitly prepares or refreshes the Buyout Signing Package from the approved legal package.
        /// </summary>
        [HttpPost("{dealId}/buyout/signing/prepare")]
        public async Task<IActionResult> PrepareBuyoutSigningPackage(string dealId)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var gateError = ValidateBuyoutSigningEntryGate(deal);
                if (gateError != null) return UnprocessableEntity(ApiResponse.Error(gateError));

                var currentUserId = GetUserId();
                if (deal.CreatorId != currentUserId && deal.EntrepreneurId != currentUserId)
                {
                    return StatusCode(403, ApiResponse.Error("Forbidden. Only the Creator or Entrepreneur can prepare signing package."));
                }

                var mutated = await EnsureSeededBuyoutSigningPackageAsync(deal, currentUserId);
                if (mutated)
                {
                    deal.Version++;
                    deal.UpdatedAt = DateTime.UtcNow;
                    await _context.DealExecutions.ReplaceOneAsync(d => d.Id == deal.Id, deal);
                }

                var dto = await MapBuyoutSigningPackageDtoAsync(deal);
                return Ok(ApiResponse.Ok("Buyout signing package prepared successfully.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// POST /api/deals/{dealId}/buyout/signing/sign
        /// Signs the Buyout Agreement Package electronically.
        /// </summary>
        [HttpPost("{dealId}/buyout/signing/sign")]
        public async Task<IActionResult> SignBuyoutAgreement(string dealId, [FromBody] SignBuyoutAgreementRequest request)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var gateError = ValidateBuyoutSigningEntryGate(deal);
                if (gateError != null) return UnprocessableEntity(ApiResponse.Error(gateError));

                var currentUserId = GetUserId();
                var isCreator = deal.CreatorId == currentUserId;
                var isEntrepreneur = deal.EntrepreneurId == currentUserId;

                if (!isCreator && !isEntrepreneur)
                {
                    return StatusCode(403, ApiResponse.Error("Forbidden. You are not authorized to sign this buyout agreement."));
                }

                await EnsureSeededBuyoutSigningPackageAsync(deal, currentUserId);
                var pkg = deal.BuyoutSigningPackage;
                if (pkg == null)
                {
                    return UnprocessableEntity(ApiResponse.Error("Signing package could not be prepared."));
                }

                // Check stale package / hash mismatch
                if (pkg.BuyoutLegalPackageVersion != request.ExpectedLegalPackageVersion)
                {
                    return StatusCode(409, ApiResponse.Error($"Signing package version conflict. Expected V{request.ExpectedLegalPackageVersion}, but package is V{pkg.BuyoutLegalPackageVersion}. Please refresh."));
                }

                if (!string.Equals(pkg.ManifestHash, request.ManifestHash, StringComparison.OrdinalIgnoreCase))
                {
                    return StatusCode(409, ApiResponse.Error("Manifest hash mismatch. The documents or terms have changed. Please refresh and review."));
                }

                // Idempotency check: Already signed same manifest?
                var existingSig = isCreator ? pkg.CreatorSignature : pkg.EntrepreneurSignature;
                if (existingSig != null && existingSig.ManifestHash == pkg.ManifestHash)
                {
                    var cachedDto = await MapBuyoutSigningPackageDtoAsync(deal);
                    return Ok(ApiResponse.Ok("Already signed this buyout package.", cachedDto));
                }

                var user = await _userManager.FindByIdAsync(currentUserId);
                var signerName = user != null && !string.IsNullOrWhiteSpace(user.Name) ? user.Name : (user?.UserName ?? (isCreator ? "Creator" : "Entrepreneur"));
                var signerRole = isCreator ? "Creator" : "Entrepreneur";

                var remoteIp = HttpContext.Connection?.RemoteIpAddress?.ToString() ?? "127.0.0.1";
                var userAgent = Request.Headers.UserAgent.ToString() ?? "browser";

                var now = DateTime.UtcNow;
                var sigHash = ComputeSha256Hash($"{currentUserId}:{signerRole}:{pkg.ManifestHash}:{pkg.BuyoutLegalPackageVersion}:{now:O}");

                var signature = new PartySignature
                {
                    SignerUserId = currentUserId,
                    SignerName = signerName,
                    SignerRole = signerRole,
                    ManifestHash = pkg.ManifestHash,
                    LegalPackageVersion = pkg.BuyoutLegalPackageVersion,
                    SignedAt = now,
                    SignatureHash = sigHash,
                    IpHash = ComputeSha256Hash(remoteIp),
                    UserAgentHash = ComputeSha256Hash(userAgent),
                    ConsentStatement = !string.IsNullOrWhiteSpace(request.ConsentStatement)
                        ? request.ConsentStatement.Trim()
                        : "I confirm that I reviewed and agree to the Full Buyout agreements, asset transfer schedule, purchase price and handover terms listed above."
                };

                if (isCreator)
                {
                    pkg.CreatorSignature = signature;
                }
                else
                {
                    pkg.EntrepreneurSignature = signature;
                }

                pkg.UpdatedAt = now;

                bool bothSigned = pkg.CreatorSignature != null &&
                                  pkg.EntrepreneurSignature != null &&
                                  pkg.CreatorSignature.ManifestHash == pkg.ManifestHash &&
                                  pkg.EntrepreneurSignature.ManifestHash == pkg.ManifestHash;

                if (bothSigned)
                {
                    pkg.Status = "AGREEMENT_SIGNED";
                    pkg.FinalizedAt = now;
                    deal.DealStage = "BUYOUT_CLOSING_PENDING";
                }
                else
                {
                    pkg.Status = isCreator ? "CREATOR_SIGNED" : "BUYER_SIGNED";
                }

                var oldVersion = deal.Version;
                deal.Version++;
                deal.UpdatedAt = now;

                var replaceResult = await _context.DealExecutions.ReplaceOneAsync(
                    d => d.Id == deal.Id && d.Version == oldVersion,
                    deal
                );

                if (replaceResult.ModifiedCount == 0)
                {
                    return StatusCode(409, ApiResponse.Error("A concurrent change was made to this deal. Please refresh and retry."));
                }

                if (bothSigned)
                {
                    await PostMessengerEventAsync(
                        deal.ConversationId,
                        currentUserId,
                        "Full Buyout Agreement fully signed by both parties. Next step: Closing."
                    );

                    if (Guid.TryParse(deal.CreatorId, out var cGuid) && _notifications != null)
                    {
                        try { await _notifications.NotifyUser(cGuid, "Full Buyout Agreement Fully Signed", "Both parties have executed all agreements. Next step: Closing."); } catch { }
                    }
                    if (Guid.TryParse(deal.EntrepreneurId, out var eGuid) && _notifications != null)
                    {
                        try { await _notifications.NotifyUser(eGuid, "Full Buyout Agreement Fully Signed", "Both parties have executed all agreements. Next step: Closing."); } catch { }
                    }

                    await LogAuditAsync(deal.IdeaId ?? "", deal.Id, pkg.BuyoutLegalPackageVersion, currentUserId, "buyout_agreement_fully_signed");
                }
                else
                {
                    await PostMessengerEventAsync(
                        deal.ConversationId,
                        currentUserId,
                        $"{signerRole} signed the Full Buyout Agreement."
                    );

                    var otherUserId = isCreator ? deal.EntrepreneurId : deal.CreatorId;
                    if (!string.IsNullOrEmpty(otherUserId) && Guid.TryParse(otherUserId, out var otherGuid) && _notifications != null)
                    {
                        try
                        {
                            await _notifications.NotifyUser(
                                otherGuid,
                                "Buyout Agreement Signed by Counterparty",
                                $"{signerRole} has signed the Full Buyout Agreement. Your signature is required."
                            );
                        }
                        catch { }
                    }

                    await LogAuditAsync(deal.IdeaId ?? "", deal.Id, pkg.BuyoutLegalPackageVersion, currentUserId, isCreator ? "creator_buyout_signed" : "buyer_buyout_signed");
                }

                var dto = await MapBuyoutSigningPackageDtoAsync(deal);
                return Ok(ApiResponse.Ok(bothSigned ? "Buyout agreement fully signed by both parties." : "Buyout agreement signed successfully.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// POST /api/deals/{dealId}/buyout/signing/request-legal-change
        /// Requests legal wording changes from the signing screen, invalidating signing package and returning to legal review.
        /// </summary>
        [HttpPost("{dealId}/buyout/signing/request-legal-change")]
        public async Task<IActionResult> RequestBuyoutSigningLegalChange(string dealId, [FromBody] RequestBuyoutSigningLegalChangeRequest request)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var currentUserId = GetUserId();
                var isCreator = deal.CreatorId == currentUserId;
                var isEntrepreneur = deal.EntrepreneurId == currentUserId;

                if (!isCreator && !isEntrepreneur)
                {
                    return StatusCode(403, ApiResponse.Error("Forbidden. Only Creator or Entrepreneur can request legal changes."));
                }

                if (deal.DealStage != "BUYOUT_SIGNATURE_PENDING")
                {
                    return UnprocessableEntity(ApiResponse.Error($"Legal changes can only be requested during signature pending stage. Current stage: {deal.DealStage}."));
                }

                if (request.RequestedChangeType == "COMMERCIAL_TERMS")
                {
                    return UnprocessableEntity(ApiResponse.Error("Commercial terms (purchase price, included assets, handover duration) are locked and require commercial renegotiation."));
                }

                // Invalidate signing package
                if (deal.BuyoutSigningPackage != null)
                {
                    deal.BuyoutSigningPackage.Status = "INVALIDATED";
                    deal.BuyoutSigningPackage.UpdatedAt = DateTime.UtcNow;
                }

                // Return to BUYOUT_TERMS_ACCEPTED and reset legal approvals for V(n+1)
                deal.DealStage = "BUYOUT_TERMS_ACCEPTED";
                if (deal.BuyoutLegalPackage != null)
                {
                    deal.BuyoutLegalPackage.Version++;
                    deal.BuyoutLegalPackage.Status = "CHANGES_REQUESTED";
                    deal.BuyoutLegalPackage.CreatorApprovedVersion = 0;
                    deal.BuyoutLegalPackage.EntrepreneurApprovedVersion = 0;
                    deal.BuyoutLegalPackage.CreatorApprovedAt = null;
                    deal.BuyoutLegalPackage.EntrepreneurApprovedAt = null;
                    deal.BuyoutLegalPackage.ProviderReviewStatus = "CHANGES_REQUESTED";
                    deal.BuyoutLegalPackage.ProviderReviewNotes = request.Feedback;
                    deal.BuyoutLegalPackage.LastEditedByRole = isCreator ? "creator" : "entrepreneur";
                    deal.BuyoutLegalPackage.LastEditedByUserId = currentUserId;
                    deal.BuyoutLegalPackage.Notes = request.Feedback;
                    deal.BuyoutLegalPackage.Documents = GenerateBuyoutLegalDocuments(
                        deal,
                        deal.BuyoutLegalPackage.Version,
                        deal.BuyoutLegalPackage.Jurisdiction ?? "European Union (Standard Commercial)",
                        deal.BuyoutAssetManifest ?? BuildBuyoutAssetTransferManifest(deal, deal.BuyoutTerms ?? new BuyoutTerms())
                    );
                    deal.BuyoutLegalPackage.UpdatedAt = DateTime.UtcNow;
                }

                deal.Version++;
                deal.UpdatedAt = DateTime.UtcNow;

                await _context.DealExecutions.ReplaceOneAsync(d => d.Id == deal.Id, deal);

                var signerRole = isCreator ? "Creator" : "Buyer";
                await PostMessengerEventAsync(
                    deal.ConversationId,
                    currentUserId,
                    $"{signerRole} requested legal changes during signing. Returning deal to Legal Review (Package V{deal.BuyoutLegalPackage?.Version})."
                );

                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, deal.BuyoutLegalPackage?.Version ?? 1, currentUserId, "buyout_legal_change_requested_from_signing");
                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, deal.BuyoutSigningPackage?.Version ?? 1, currentUserId, "buyout_signing_package_invalidated");

                var dto = await MapEquityDealDtoAsync(deal);
                return Ok(ApiResponse.Ok("Legal change requested. Deal returned to Legal Review.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// GET /api/deals/{dealId}/buyout/signing/documents/{documentId}
        /// Retrieves document content for a document in the signing package.
        /// </summary>
        [HttpGet("{dealId}/buyout/signing/documents/{documentId}")]
        public async Task<IActionResult> GetBuyoutSigningDocument(string dealId, string documentId)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var currentUserId = GetUserId();
                if (!IsAuthorizedBuyoutLegalActor(deal, currentUserId))
                {
                    return StatusCode(403, ApiResponse.Error("Forbidden. You do not have permission to view this signing document."));
                }

                var doc = deal.BuyoutSigningPackage?.Documents.FirstOrDefault(d => d.DocumentId == documentId);
                if (doc == null && deal.BuyoutLegalPackage != null)
                {
                    var legDoc = deal.BuyoutLegalPackage.Documents.FirstOrDefault(d => d.Id == documentId);
                    if (legDoc != null)
                    {
                        doc = new SigningDocumentRef
                        {
                            DocumentId = legDoc.Id,
                            DocumentType = legDoc.DocumentType,
                            Title = legDoc.Title,
                            RequirementType = legDoc.RequirementType,
                            DocumentVersion = legDoc.Version,
                            DocumentHash = legDoc.ContentHash,
                            ContentMarkdown = legDoc.ContentMarkdown
                        };
                    }
                }

                if (doc == null)
                {
                    return NotFound(ApiResponse.Error("Document not found in signing package."));
                }

                return Ok(ApiResponse.Ok("Document retrieved.", doc));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// GET /api/deals/{dealId}/buyout/signing/final-package
        /// Retrieves the finalized and signed Buyout Agreement Package.
        /// </summary>
        [HttpGet("{dealId}/buyout/signing/final-package")]
        public async Task<IActionResult> GetFinalBuyoutSignedPackage(string dealId)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var currentUserId = GetUserId();
                if (!IsAuthorizedBuyoutLegalActor(deal, currentUserId))
                {
                    return StatusCode(403, ApiResponse.Error("Forbidden. You do not have permission to view the final agreement package."));
                }

                var pkg = deal.BuyoutSigningPackage;
                if (pkg == null || pkg.Status != "AGREEMENT_SIGNED" || !pkg.FinalizedAt.HasValue)
                {
                    return UnprocessableEntity(ApiResponse.Error("Final agreement package is not yet fully executed."));
                }

                var idea = !string.IsNullOrEmpty(deal.IdeaId)
                    ? await _context.CreatorIdeas.Find(i => i.Id == deal.IdeaId).FirstOrDefaultAsync()
                    : null;

                var creatorUser = !string.IsNullOrEmpty(deal.CreatorId) ? await _userManager.FindByIdAsync(deal.CreatorId) : null;
                var entUser = !string.IsNullOrEmpty(deal.EntrepreneurId) ? await _userManager.FindByIdAsync(deal.EntrepreneurId) : null;

                var creatorName = creatorUser != null && !string.IsNullOrWhiteSpace(creatorUser.Name) ? creatorUser.Name : (creatorUser?.UserName ?? "Creator");
                var entName = entUser != null && !string.IsNullOrWhiteSpace(entUser.Name) ? entUser.Name : (entUser?.UserName ?? "Entrepreneur");

                var dto = new FinalBuyoutSignedPackageDto
                {
                    DealId = deal.Id,
                    IdeaId = deal.IdeaId ?? "",
                    ProjectName = idea?.Project?.Name ?? "Project",
                    AcceptedBuyoutRevisionNumber = pkg.AcceptedBuyoutRevisionNumber,
                    PurchasePrice = pkg.PurchasePrice,
                    Currency = pkg.Currency,
                    HandoverPeriodWeeks = pkg.HandoverPeriodWeeks,
                    TransitionSupportWeeks = pkg.TransitionSupportWeeks,
                    AssetManifestVersion = pkg.AssetManifestVersion,
                    AssetManifestHash = pkg.AssetManifestHash,
                    LegalPackageVersion = pkg.BuyoutLegalPackageVersion,
                    ManifestHash = pkg.ManifestHash,
                    Documents = pkg.Documents.Select(d => new SigningDocumentRefDto
                    {
                        DocumentId = d.DocumentId,
                        DocumentType = d.DocumentType,
                        Title = d.Title,
                        RequirementType = d.RequirementType,
                        DocumentVersion = d.DocumentVersion,
                        DocumentHash = d.DocumentHash,
                        ContentMarkdown = d.ContentMarkdown
                    }).ToList(),
                    CreatorSignature = pkg.CreatorSignature != null ? new PartySignatureDto
                    {
                        SignerUserId = pkg.CreatorSignature.SignerUserId,
                        SignerName = pkg.CreatorSignature.SignerName,
                        SignerRole = pkg.CreatorSignature.SignerRole,
                        ManifestHash = pkg.CreatorSignature.ManifestHash,
                        LegalPackageVersion = pkg.CreatorSignature.LegalPackageVersion,
                        SignedAt = pkg.CreatorSignature.SignedAt,
                        SignatureHash = pkg.CreatorSignature.SignatureHash,
                        ConsentStatement = pkg.CreatorSignature.ConsentStatement
                    } : null,
                    EntrepreneurSignature = pkg.EntrepreneurSignature != null ? new PartySignatureDto
                    {
                        SignerUserId = pkg.EntrepreneurSignature.SignerUserId,
                        SignerName = pkg.EntrepreneurSignature.SignerName,
                        SignerRole = pkg.EntrepreneurSignature.SignerRole,
                        ManifestHash = pkg.EntrepreneurSignature.ManifestHash,
                        LegalPackageVersion = pkg.EntrepreneurSignature.LegalPackageVersion,
                        SignedAt = pkg.EntrepreneurSignature.SignedAt,
                        SignatureHash = pkg.EntrepreneurSignature.SignatureHash,
                        ConsentStatement = pkg.EntrepreneurSignature.ConsentStatement
                    } : null,
                    FinalizedAt = pkg.FinalizedAt.Value,
                    AuditReference = $"buyout_deal_{deal.Id}_signed_v{pkg.BuyoutLegalPackageVersion}_{pkg.ManifestHash.Substring(0, Math.Min(12, pkg.ManifestHash.Length))}",
                    Status = "AGREEMENT_SIGNED"
                };

                return Ok(ApiResponse.Ok("Final buyout agreement package retrieved.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // =========================================================================
        // FULL BUYOUT PHASE 4 HELPER METHODS
        // =========================================================================

        private static string? ValidateBuyoutSigningEntryGate(DealExecution deal)
        {
            if (deal.DealType != "FULL_BUYOUT")
                return "Signing is only available for FULL_BUYOUT deals.";

            if (deal.DealStage != "BUYOUT_SIGNATURE_PENDING" &&
                deal.DealStage != "BUYOUT_CLOSING_PENDING" &&
                deal.DealStage != "BUYOUT_HANDOVER_PENDING" &&
                deal.DealStage != "SOLD" &&
                deal.DealStage != "BUYOUT_COMPLETED")
                return $"Agreement Signing is not available in stage '{deal.DealStage}'.";

            if (deal.BuyoutLegalPackage == null || deal.BuyoutLegalPackage.Status != "APPROVED")
                return "Buyout legal review package must be APPROVED before proceeding to signature.";

            bool hasAssignedProvider = !string.IsNullOrEmpty(deal.BuyoutLegalPackage.AssignedLegalProviderId);
            if (hasAssignedProvider && (deal.BuyoutLegalPackage.ProviderReviewStatus != "REVIEW_COMPLETE" || deal.BuyoutLegalPackage.ProviderReviewedVersion != deal.BuyoutLegalPackage.Version))
                return "A verified Legal Service Provider review must be marked REVIEW_COMPLETE for the active legal package version before signing.";

            if (deal.BuyoutLegalPackage.CreatorApprovedVersion != deal.BuyoutLegalPackage.Version ||
                deal.BuyoutLegalPackage.EntrepreneurApprovedVersion != deal.BuyoutLegalPackage.Version)
                return "Both Creator and Entrepreneur must approve the current version of the Buyout Legal Package before signing.";

            if (!deal.AcceptedRevisionNumber.HasValue)
                return "Accepted revision number is missing.";

            if (deal.BuyoutAssetManifest == null)
                return "Asset transfer manifest is missing.";

            if (deal.BuyoutAssetManifest.Assets.Any(a => a.AvailabilityStatus == "MISSING"))
                return "One or more accepted assets are MISSING and require verification before signing.";

            return null;
        }

        private async Task<bool> EnsureSeededBuyoutSigningPackageAsync(DealExecution deal, string currentUserId)
        {
            var legal = deal.BuyoutLegalPackage;
            if (legal == null) return false;

            var manifest = deal.BuyoutAssetManifest ?? BuildBuyoutAssetTransferManifest(deal, deal.BuyoutTerms ?? new BuyoutTerms());

            if (deal.BuyoutSigningPackage == null || (deal.BuyoutSigningPackage.Status != "AGREEMENT_SIGNED" && deal.BuyoutSigningPackage.BuyoutLegalPackageVersion != legal.Version))
            {
                var pkg = new BuyoutSigningPackage
                {
                    DealId = deal.Id,
                    IdeaId = deal.IdeaId ?? "",
                    DealType = "FULL_BUYOUT",
                    BuyoutLegalPackageId = legal.Id,
                    BuyoutLegalPackageVersion = legal.Version,
                    AcceptedBuyoutRevisionNumber = legal.AcceptedBuyoutRevisionNumber > 0 ? legal.AcceptedBuyoutRevisionNumber : (deal.AcceptedRevisionNumber ?? 1),
                    AssetManifestVersion = manifest.Version,
                    AssetManifestHash = manifest.ManifestHash,
                    PurchasePrice = manifest.PurchasePrice,
                    Currency = manifest.Currency,
                    HandoverPeriodWeeks = manifest.HandoverPeriodWeeks,
                    TransitionSupportWeeks = manifest.TransitionSupportWeeks,
                    Documents = legal.Documents.Select(d => new SigningDocumentRef
                    {
                        DocumentId = d.Id,
                        DocumentType = d.DocumentType,
                        Title = d.Title,
                        RequirementType = d.RequirementType,
                        DocumentVersion = d.Version,
                        DocumentHash = d.ContentHash,
                        ContentMarkdown = d.ContentMarkdown
                    }).ToList(),
                    Status = "PENDING_SIGNATURES",
                    Version = 1,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                pkg.ManifestHash = ComputeBuyoutManifestHash(pkg, deal);
                deal.BuyoutSigningPackage = pkg;
                return true;
            }

            return false;
        }

        private static string ComputeBuyoutManifestHash(BuyoutSigningPackage pkg, DealExecution deal)
        {
            var manifestObj = new
            {
                dealId = pkg.DealId,
                ideaId = pkg.IdeaId,
                dealType = "FULL_BUYOUT",
                acceptedRevisionNumber = pkg.AcceptedBuyoutRevisionNumber,
                purchasePrice = pkg.PurchasePrice,
                currency = pkg.Currency,
                handoverPeriodWeeks = pkg.HandoverPeriodWeeks,
                transitionSupportWeeks = pkg.TransitionSupportWeeks,
                assetManifestVersion = pkg.AssetManifestVersion,
                assetManifestHash = pkg.AssetManifestHash,
                legalPackageVersion = pkg.BuyoutLegalPackageVersion,
                documents = pkg.Documents.OrderBy(d => d.DocumentId).Select(d => new
                {
                    documentId = d.DocumentId,
                    version = d.DocumentVersion,
                    sha256 = d.DocumentHash
                }).ToList()
            };

            var json = System.Text.Json.JsonSerializer.Serialize(manifestObj);
            return ComputeSha256Hash(json);
        }

        private async Task<BuyoutSigningPackageDto> MapBuyoutSigningPackageDtoAsync(DealExecution deal)
        {
            var pkg = deal.BuyoutSigningPackage;
            if (pkg == null)
            {
                await EnsureSeededBuyoutSigningPackageAsync(deal, "");
                pkg = deal.BuyoutSigningPackage!;
            }

            var creatorUser = !string.IsNullOrEmpty(deal.CreatorId) ? await _userManager.FindByIdAsync(deal.CreatorId) : null;
            var entUser = !string.IsNullOrEmpty(deal.EntrepreneurId) ? await _userManager.FindByIdAsync(deal.EntrepreneurId) : null;

            var creatorName = creatorUser != null && !string.IsNullOrWhiteSpace(creatorUser.Name) ? creatorUser.Name : (creatorUser?.UserName ?? "Creator");
            var entName = entUser != null && !string.IsNullOrWhiteSpace(entUser.Name) ? entUser.Name : (entUser?.UserName ?? "Entrepreneur");

            var idea = !string.IsNullOrEmpty(deal.IdeaId)
                ? await _context.CreatorIdeas.Find(i => i.Id == deal.IdeaId).FirstOrDefaultAsync()
                : null;

            var includedAssets = deal.BuyoutAssetManifest?.Assets.Select(a => a.DisplayName).ToList()
                ?? deal.BuyoutTerms?.IncludedAssets
                ?? new List<string>();

            return new BuyoutSigningPackageDto
            {
                Id = pkg.Id,
                DealId = pkg.DealId,
                IdeaId = pkg.IdeaId,
                ProjectName = idea?.Project?.Name ?? "Project",
                DealType = "FULL_BUYOUT",
                CreatorId = deal.CreatorId ?? "",
                CreatorName = creatorName,
                EntrepreneurId = deal.EntrepreneurId ?? "",
                EntrepreneurName = entName,
                AcceptedBuyoutRevisionNumber = pkg.AcceptedBuyoutRevisionNumber,
                BuyoutLegalPackageId = pkg.BuyoutLegalPackageId,
                BuyoutLegalPackageVersion = pkg.BuyoutLegalPackageVersion,
                AssetManifestVersion = pkg.AssetManifestVersion,
                AssetManifestHash = pkg.AssetManifestHash,
                PurchasePrice = pkg.PurchasePrice,
                Currency = pkg.Currency,
                HandoverPeriodWeeks = pkg.HandoverPeriodWeeks,
                TransitionSupportWeeks = pkg.TransitionSupportWeeks,
                IncludedAssets = includedAssets,
                Documents = pkg.Documents.Select(d => new SigningDocumentRefDto
                {
                    DocumentId = d.DocumentId,
                    DocumentType = d.DocumentType,
                    Title = d.Title,
                    RequirementType = d.RequirementType,
                    DocumentVersion = d.DocumentVersion,
                    DocumentHash = d.DocumentHash,
                    ContentMarkdown = d.ContentMarkdown
                }).ToList(),
                AssetManifest = deal.BuyoutAssetManifest != null ? MapBuyoutAssetManifestDto(deal.BuyoutAssetManifest) : null,
                ManifestHash = pkg.ManifestHash,
                CreatorSignature = pkg.CreatorSignature != null ? new PartySignatureDto
                {
                    SignerUserId = pkg.CreatorSignature.SignerUserId,
                    SignerName = pkg.CreatorSignature.SignerName,
                    SignerRole = pkg.CreatorSignature.SignerRole,
                    ManifestHash = pkg.CreatorSignature.ManifestHash,
                    LegalPackageVersion = pkg.CreatorSignature.LegalPackageVersion,
                    SignedAt = pkg.CreatorSignature.SignedAt,
                    SignatureHash = pkg.CreatorSignature.SignatureHash,
                    ConsentStatement = pkg.CreatorSignature.ConsentStatement
                } : null,
                EntrepreneurSignature = pkg.EntrepreneurSignature != null ? new PartySignatureDto
                {
                    SignerUserId = pkg.EntrepreneurSignature.SignerUserId,
                    SignerName = pkg.EntrepreneurSignature.SignerName,
                    SignerRole = pkg.EntrepreneurSignature.SignerRole,
                    ManifestHash = pkg.EntrepreneurSignature.ManifestHash,
                    LegalPackageVersion = pkg.EntrepreneurSignature.LegalPackageVersion,
                    SignedAt = pkg.EntrepreneurSignature.SignedAt,
                    SignatureHash = pkg.EntrepreneurSignature.SignatureHash,
                    ConsentStatement = pkg.EntrepreneurSignature.ConsentStatement
                } : null,
                AssignedLegalProviderName = deal.BuyoutLegalPackage?.AssignedLegalProviderName,
                Status = pkg.Status,
                Version = pkg.Version,
                CreatedAt = pkg.CreatedAt,
                FinalizedAt = pkg.FinalizedAt,
                UpdatedAt = pkg.UpdatedAt,
                AuditReference = pkg.Status == "AGREEMENT_SIGNED" && pkg.FinalizedAt.HasValue
                    ? $"buyout_deal_{deal.Id}_signed_v{pkg.BuyoutLegalPackageVersion}_{pkg.ManifestHash.Substring(0, Math.Min(12, pkg.ManifestHash.Length))}"
                    : null
            };
        }

        // =========================================================================
        // FULL BUYOUT PHASE 5: CLOSING & PAYMENT CONFIRMATION ENDPOINTS & HELPERS
        // =========================================================================

        /// <summary>
        /// GET /api/deals/{dealId}/buyout/closing
        /// Retrieves the current Full Buyout closing and payment state, seeding if needed.
        /// </summary>
        [HttpGet("{dealId}/buyout/closing")]
        public async Task<IActionResult> GetBuyoutClosing(string dealId)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var currentUserId = GetUserId();
                if (!IsAuthorizedBuyoutClosingActor(deal, currentUserId))
                {
                    return StatusCode(403, ApiResponse.Error("Forbidden. Only Creator, Buyer, or Assigned Legal Provider can access Buyout Closing."));
                }

                var gateError = ValidateBuyoutClosingEntryGate(deal);
                if (gateError != null)
                {
                    return UnprocessableEntity(ApiResponse.Error(gateError));
                }

                bool seeded = EnsureSeededBuyoutClosing(deal);
                if (seeded)
                {
                    var oldVersion = deal.Version;
                    deal.Version++;
                    deal.UpdatedAt = DateTime.UtcNow;
                    var replaceResult = await _context.DealExecutions.ReplaceOneAsync(
                        d => d.Id == deal.Id && d.Version == oldVersion,
                        deal
                    );
                    if (replaceResult.MatchedCount == 0)
                    {
                        return Conflict(ApiResponse.Error("A concurrent update occurred. Please refresh and try again."));
                    }
                }

                var dto = await MapBuyoutClosingDtoAsync(deal);
                return Ok(ApiResponse.Ok("Buyout closing details retrieved.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// POST /api/deals/{dealId}/buyout/closing/start
        /// Explicitly starts the closing process for a signed deal.
        /// </summary>
        [HttpPost("{dealId}/buyout/closing/start")]
        public async Task<IActionResult> StartBuyoutClosing(string dealId)
        {
            return await GetBuyoutClosing(dealId);
        }

        /// <summary>
        /// POST /api/deals/{dealId}/buyout/closing/payment
        /// Buyer submits payment details / confirmation reference.
        /// </summary>
        [HttpPost("{dealId}/buyout/closing/payment")]
        public async Task<IActionResult> SubmitBuyoutPayment(string dealId, [FromBody] SubmitBuyoutPaymentRequest req)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var currentUserId = GetUserId();
                if (deal.EntrepreneurId != currentUserId)
                {
                    return StatusCode(403, ApiResponse.Error("Only the Buyer / Entrepreneur can submit payment details."));
                }

                var gateError = ValidateBuyoutClosingEntryGate(deal);
                if (gateError != null)
                {
                    return UnprocessableEntity(ApiResponse.Error(gateError));
                }

                EnsureSeededBuyoutClosing(deal);
                var closing = deal.BuyoutClosing!;

                // Re-validate signed source binding integrity
                var signingPkg = deal.BuyoutSigningPackage!;
                if (signingPkg.Status != "AGREEMENT_SIGNED" ||
                    signingPkg.ManifestHash != closing.ManifestHash ||
                    signingPkg.AcceptedBuyoutRevisionNumber != closing.AcceptedRevisionNumber)
                {
                    return StatusCode(409, ApiResponse.Error("Signed agreement package integrity mismatch. Please refresh and review."));
                }

                // Purchase price & currency immutable check
                if (req.PaymentAmount.HasValue && req.PaymentAmount.Value != closing.PurchasePrice)
                {
                    return UnprocessableEntity(ApiResponse.Error($"Payment amount (€{req.PaymentAmount.Value:N0}) does not match the agreed locked purchase price (€{closing.PurchasePrice:N0}). Changing purchase price requires commercial renegotiation."));
                }

                if (!string.IsNullOrEmpty(req.PaymentCurrency) && !string.Equals(req.PaymentCurrency, closing.Currency, StringComparison.OrdinalIgnoreCase))
                {
                    return UnprocessableEntity(ApiResponse.Error($"Payment currency ({req.PaymentCurrency}) does not match the agreed currency ({closing.Currency})."));
                }

                if (string.IsNullOrWhiteSpace(req.PaymentReference))
                {
                    return UnprocessableEntity(ApiResponse.Error("Payment reference (transaction reference or bank confirmation ID) is required."));
                }

                // Optimistic concurrency check
                if (req.ExpectedVersion > 0 && req.ExpectedVersion != closing.Version)
                {
                    return StatusCode(409, ApiResponse.Error("Version conflict: Closing state has been updated. Please refresh and try again."));
                }

                // Idempotency: if already submitted with identical reference
                if (closing.PaymentStatus == "PAYMENT_SUBMITTED" && closing.PaymentReference == req.PaymentReference.Trim())
                {
                    return Ok(ApiResponse.Ok("Payment information already submitted.", await MapBuyoutClosingDtoAsync(deal)));
                }

                if (closing.PaymentStatus == "PAYMENT_CONFIRMED")
                {
                    return Ok(ApiResponse.Ok("Payment already confirmed by Creator.", await MapBuyoutClosingDtoAsync(deal)));
                }

                // Record evidence
                var evidence = new BuyoutPaymentEvidenceEntry
                {
                    DocumentReference = !string.IsNullOrWhiteSpace(req.DocumentReference) ? req.DocumentReference.Trim() : req.PaymentReference.Trim(),
                    DocumentName = !string.IsNullOrWhiteSpace(req.DocumentName) ? req.DocumentName.Trim() : "Payment Transfer Confirmation",
                    UploadedByUserId = currentUserId,
                    UploadedByRole = "Buyer",
                    UploadedAt = DateTime.UtcNow,
                    ContentHash = ComputeSha256Hash($"{req.PaymentReference}:{req.PaymentAmount ?? closing.PurchasePrice}:{DateTime.UtcNow:O}"),
                    StatedAmount = req.PaymentAmount ?? closing.PurchasePrice,
                    StatedCurrency = req.PaymentCurrency ?? closing.Currency,
                    Notes = req.Notes?.Trim()
                };

                closing.Evidence.Add(evidence);
                closing.PaymentMethod = !string.IsNullOrWhiteSpace(req.PaymentMethod) ? req.PaymentMethod.Trim().ToUpperInvariant() : "BANK_TRANSFER";
                closing.PaymentReference = req.PaymentReference.Trim();
                closing.PaymentAmount = req.PaymentAmount ?? closing.PurchasePrice;
                closing.PaymentCurrency = req.PaymentCurrency ?? closing.Currency;
                closing.PaidAt = req.PaidAt ?? DateTime.UtcNow;
                closing.BuyerConfirmedAt = DateTime.UtcNow;
                closing.PaymentStatus = "PAYMENT_SUBMITTED";
                closing.ClosingStatus = "PAYMENT_VERIFICATION";
                closing.UpdatedAt = DateTime.UtcNow;
                closing.Version++;

                CalculateClosingBlockers(closing, deal);

                var oldVersion = deal.Version;
                deal.Version++;
                deal.UpdatedAt = DateTime.UtcNow;

                var replaceResult = await _context.DealExecutions.ReplaceOneAsync(
                    d => d.Id == deal.Id && d.Version == oldVersion,
                    deal
                );

                if (replaceResult.MatchedCount == 0)
                {
                    return Conflict(ApiResponse.Error("A concurrent update occurred. Please refresh and try again."));
                }

                // Messenger & notifications
                if (!string.IsNullOrEmpty(deal.ConversationId))
                {
                    await PostMessengerEventAsync(deal.ConversationId, currentUserId,
                        $"Buyer submitted payment confirmation (Ref: {closing.PaymentReference}, Method: {closing.PaymentMethod}). Payment verification is pending.");
                }

                if (!string.IsNullOrEmpty(deal.CreatorId) && Guid.TryParse(deal.CreatorId, out var creatorGuid) && _notifications != null)
                {
                    try
                    {
                        await _notifications.NotifyUser(
                            creatorGuid,
                            "Payment Confirmation Submitted",
                            $"Buyer has submitted payment reference ({closing.PaymentReference}) for your project buyout. Please verify and confirm receipt."
                        );
                    }
                    catch { }
                }

                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, closing.Version, currentUserId, "buyout_payment_submitted");

                var dto = await MapBuyoutClosingDtoAsync(deal);
                return Ok(ApiResponse.Ok("Payment information submitted successfully. Waiting for Creator payment confirmation.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// POST /api/deals/{dealId}/buyout/closing/payment/confirm
        /// Creator confirms receipt of payment funds. Advances DealStage to BUYOUT_HANDOVER_PENDING.
        /// </summary>
        [HttpPost("{dealId}/buyout/closing/payment/confirm")]
        public async Task<IActionResult> ConfirmBuyoutPaymentReceipt(string dealId, [FromBody] ConfirmBuyoutPaymentRequest req)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var currentUserId = GetUserId();
                if (deal.CreatorId != currentUserId)
                {
                    return StatusCode(403, ApiResponse.Error("Only the Creator / Seller can confirm receipt of payment funds."));
                }

                var gateError = ValidateBuyoutClosingEntryGate(deal);
                if (gateError != null)
                {
                    return UnprocessableEntity(ApiResponse.Error(gateError));
                }

                EnsureSeededBuyoutClosing(deal);
                var closing = deal.BuyoutClosing!;

                // Re-validate signed package integrity
                var signingPkg = deal.BuyoutSigningPackage!;
                if (signingPkg.Status != "AGREEMENT_SIGNED" ||
                    signingPkg.ManifestHash != closing.ManifestHash ||
                    signingPkg.AcceptedBuyoutRevisionNumber != closing.AcceptedRevisionNumber)
                {
                    return StatusCode(409, ApiResponse.Error("Signed agreement package integrity mismatch. Please refresh and review."));
                }

                // Idempotency: if already confirmed
                if (closing.PaymentStatus == "PAYMENT_CONFIRMED" && deal.DealStage == "BUYOUT_HANDOVER_PENDING")
                {
                    return Ok(ApiResponse.Ok("Payment receipt already confirmed.", await MapBuyoutClosingDtoAsync(deal)));
                }

                if (closing.PaymentStatus == "PAYMENT_DISPUTED")
                {
                    return UnprocessableEntity(ApiResponse.Error("Cannot confirm payment while in disputed state. Please resolve dispute before confirming."));
                }

                // Optimistic concurrency check
                if (req.ExpectedVersion > 0 && req.ExpectedVersion != closing.Version)
                {
                    return StatusCode(409, ApiResponse.Error("Version conflict: Closing state has been updated. Please refresh and try again."));
                }

                closing.CreatorConfirmedAt = DateTime.UtcNow;
                closing.PaymentStatus = "PAYMENT_CONFIRMED";
                closing.ClosingStatus = "READY_FOR_HANDOVER";
                closing.PaymentCompletedAt = DateTime.UtcNow;
                closing.ReadyForHandoverAt = DateTime.UtcNow;
                closing.CanProceedToHandover = true;
                closing.Blockers.Clear();
                closing.UpdatedAt = DateTime.UtcNow;
                closing.Version++;

                // Successful Phase 5 Transition: BUYOUT_CLOSING_PENDING -> BUYOUT_HANDOVER_PENDING
                deal.DealStage = "BUYOUT_HANDOVER_PENDING";
                deal.UpdatedAt = DateTime.UtcNow;

                var oldVersion = deal.Version;
                deal.Version++;

                var replaceResult = await _context.DealExecutions.ReplaceOneAsync(
                    d => d.Id == deal.Id && d.Version == oldVersion,
                    deal
                );

                if (replaceResult.MatchedCount == 0)
                {
                    return Conflict(ApiResponse.Error("A concurrent update occurred. Please refresh and try again."));
                }

                // Messenger & notifications
                if (!string.IsNullOrEmpty(deal.ConversationId))
                {
                    await PostMessengerEventAsync(deal.ConversationId, currentUserId,
                        "Payment confirmed by Creator. Closing complete. Asset handover can begin.");
                }

                if (!string.IsNullOrEmpty(deal.EntrepreneurId) && Guid.TryParse(deal.EntrepreneurId, out var entGuid) && _notifications != null)
                {
                    try
                    {
                        await _notifications.NotifyUser(
                            entGuid,
                            "Payment Confirmed!",
                            "Creator has verified and confirmed payment receipt. The deal is now ready for asset handover."
                        );
                    }
                    catch { }
                }

                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, closing.Version, currentUserId, "buyout_payment_confirmed");
                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, closing.Version, currentUserId, "buyout_closing_ready_for_handover");

                var dto = await MapBuyoutClosingDtoAsync(deal);
                return Ok(ApiResponse.Ok("Payment receipt confirmed! Deal transitioned to Handover stage.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// POST /api/deals/{dealId}/buyout/closing/dispute
        /// Records a payment dispute, blocking transition to Handover until resolved.
        /// </summary>
        [HttpPost("{dealId}/buyout/closing/dispute")]
        public async Task<IActionResult> DisputeBuyoutPayment(string dealId, [FromBody] DisputeBuyoutPaymentRequest req)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var currentUserId = GetUserId();
                var isCreator = deal.CreatorId == currentUserId;
                var isBuyer = deal.EntrepreneurId == currentUserId;

                if (!isCreator && !isBuyer)
                {
                    return StatusCode(403, ApiResponse.Error("Only the Creator or Buyer can report a payment dispute on this deal."));
                }

                if (string.IsNullOrWhiteSpace(req.DisputeReason))
                {
                    return UnprocessableEntity(ApiResponse.Error("Dispute reason is required."));
                }

                EnsureSeededBuyoutClosing(deal);
                var closing = deal.BuyoutClosing!;

                if (req.ExpectedVersion > 0 && req.ExpectedVersion != closing.Version)
                {
                    return StatusCode(409, ApiResponse.Error("Version conflict: Closing state has been updated. Please refresh and try again."));
                }

                closing.PaymentStatus = "PAYMENT_DISPUTED";
                closing.ClosingStatus = "DISPUTED";
                closing.CanProceedToHandover = false;
                closing.DisputeReason = req.DisputeReason.Trim();
                closing.DisputedAt = DateTime.UtcNow;
                closing.DisputedByUserId = currentUserId;
                closing.UpdatedAt = DateTime.UtcNow;
                closing.Version++;

                CalculateClosingBlockers(closing, deal);

                var oldVersion = deal.Version;
                deal.Version++;
                deal.UpdatedAt = DateTime.UtcNow;

                var replaceResult = await _context.DealExecutions.ReplaceOneAsync(
                    d => d.Id == deal.Id && d.Version == oldVersion,
                    deal
                );

                if (replaceResult.MatchedCount == 0)
                {
                    return Conflict(ApiResponse.Error("A concurrent update occurred. Please refresh and try again."));
                }

                var actorRole = isCreator ? "Creator" : "Buyer";
                if (!string.IsNullOrEmpty(deal.ConversationId))
                {
                    await PostMessengerEventAsync(deal.ConversationId, currentUserId,
                        $"{actorRole} reported a payment issue: {closing.DisputeReason}. Handover is paused.");
                }

                var otherUserId = isCreator ? deal.EntrepreneurId : deal.CreatorId;
                if (!string.IsNullOrEmpty(otherUserId) && Guid.TryParse(otherUserId, out var otherGuid) && _notifications != null)
                {
                    try
                    {
                        await _notifications.NotifyUser(
                            otherGuid,
                            "Payment Issue Reported",
                            $"{actorRole} reported an issue regarding payment: {closing.DisputeReason}"
                        );
                    }
                    catch { }
                }

                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, closing.Version, currentUserId, "buyout_payment_disputed");

                var dto = await MapBuyoutClosingDtoAsync(deal);
                return Ok(ApiResponse.Ok("Payment issue recorded. Handover is paused.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // =========================================================================
        // FULL BUYOUT PHASE 5 HELPER METHODS
        // =========================================================================

        private static string? ValidateBuyoutClosingEntryGate(DealExecution deal)
        {
            if (deal.DealType != "FULL_BUYOUT")
                return "Closing is only available for FULL_BUYOUT deals.";

            if (deal.DealStage != "BUYOUT_CLOSING_PENDING" && deal.DealStage != "BUYOUT_HANDOVER_PENDING")
                return $"Closing is not available in stage '{deal.DealStage}'. Must be BUYOUT_CLOSING_PENDING.";

            if (deal.BuyoutSigningPackage == null || deal.BuyoutSigningPackage.Status != "AGREEMENT_SIGNED")
                return "Buyout agreement signing package must be in AGREEMENT_SIGNED status.";

            if (deal.BuyoutSigningPackage.CreatorSignature == null || deal.BuyoutSigningPackage.EntrepreneurSignature == null)
                return "Bilateral signatures from both Creator and Buyer are required.";

            if (deal.BuyoutSigningPackage.CreatorSignature.ManifestHash != deal.BuyoutSigningPackage.EntrepreneurSignature.ManifestHash)
                return "Creator and Buyer signatures must reference the exact same ManifestHash.";

            if (deal.BuyoutSigningPackage.CreatorSignature.LegalPackageVersion != deal.BuyoutSigningPackage.EntrepreneurSignature.LegalPackageVersion)
                return "Creator and Buyer signatures must reference the exact same legal package version.";

            if (!deal.AcceptedRevisionNumber.HasValue)
                return "Accepted revision number is missing.";

            return null;
        }

        private static bool IsAuthorizedBuyoutClosingActor(DealExecution deal, string currentUserId)
        {
            if (string.IsNullOrEmpty(currentUserId)) return false;
            if (deal.CreatorId == currentUserId || deal.EntrepreneurId == currentUserId) return true;
            if (deal.BuyoutLegalPackage != null && deal.BuyoutLegalPackage.AssignedLegalProviderId == currentUserId) return true;
            return false;
        }

        private static bool EnsureSeededBuyoutClosing(DealExecution deal)
        {
            var signingPkg = deal.BuyoutSigningPackage!;
            if (deal.BuyoutClosing == null)
            {
                deal.BuyoutClosing = new BuyoutClosing
                {
                    DealId = deal.Id,
                    IdeaId = deal.IdeaId ?? string.Empty,
                    DealType = "FULL_BUYOUT",
                    AcceptedRevisionNumber = signingPkg.AcceptedBuyoutRevisionNumber,
                    SigningPackageId = signingPkg.Id,
                    ManifestHash = signingPkg.ManifestHash,
                    PurchasePrice = signingPkg.PurchasePrice,
                    Currency = signingPkg.Currency,
                    PaymentMethod = "BANK_TRANSFER",
                    PaymentStatus = "NOT_STARTED",
                    ClosingStatus = "PENDING",
                    Version = 1,
                    StartedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                CalculateClosingBlockers(deal.BuyoutClosing, deal);
                return true;
            }

            CalculateClosingBlockers(deal.BuyoutClosing, deal);
            return false;
        }

        private static void CalculateClosingBlockers(BuyoutClosing closing, DealExecution deal)
        {
            var blockers = new List<string>();

            if (closing.PaymentStatus is "NOT_STARTED" or "PAYMENT_PENDING")
            {
                blockers.Add("Buyer has not yet submitted payment confirmation / reference.");
            }
            else if (closing.PaymentStatus is "PAYMENT_SUBMITTED" or "PAYMENT_VERIFICATION_PENDING")
            {
                blockers.Add("Payment verification / Creator confirmation is pending.");
            }
            else if (closing.PaymentStatus == "PAYMENT_DISPUTED")
            {
                blockers.Add($"Payment is disputed: {closing.DisputeReason ?? "Issue under review"}.");
            }
            else if (closing.PaymentStatus == "PAYMENT_FAILED")
            {
                blockers.Add("Payment transaction failed. Please resubmit valid payment evidence.");
            }

            if (deal.BuyoutSigningPackage?.ManifestHash != closing.ManifestHash)
            {
                blockers.Add("Signed agreement manifest hash mismatch.");
            }

            closing.Blockers = blockers;
            closing.CanProceedToHandover = closing.PaymentStatus == "PAYMENT_CONFIRMED" && blockers.Count == 0;
        }

        private async Task<BuyoutClosingDto> MapBuyoutClosingDtoAsync(DealExecution deal)
        {
            var closing = deal.BuyoutClosing!;
            CalculateClosingBlockers(closing, deal);

            var creatorUser = !string.IsNullOrEmpty(deal.CreatorId) ? await _userManager.FindByIdAsync(deal.CreatorId) : null;
            var entUser = !string.IsNullOrEmpty(deal.EntrepreneurId) ? await _userManager.FindByIdAsync(deal.EntrepreneurId) : null;

            var creatorName = creatorUser != null && !string.IsNullOrWhiteSpace(creatorUser.Name) ? creatorUser.Name : (creatorUser?.UserName ?? "Creator");
            var entName = entUser != null && !string.IsNullOrWhiteSpace(entUser.Name) ? entUser.Name : (entUser?.UserName ?? "Entrepreneur");

            var idea = !string.IsNullOrEmpty(deal.IdeaId)
                ? await _context.CreatorIdeas.Find(i => i.Id == deal.IdeaId).FirstOrDefaultAsync()
                : null;

            return new BuyoutClosingDto
            {
                Id = closing.Id,
                DealId = closing.DealId,
                IdeaId = closing.IdeaId,
                ProjectName = idea?.Project?.Name ?? "Project",
                DealType = "FULL_BUYOUT",
                CreatorId = deal.CreatorId ?? "",
                CreatorName = creatorName,
                EntrepreneurId = deal.EntrepreneurId ?? "",
                EntrepreneurName = entName,
                AcceptedRevisionNumber = closing.AcceptedRevisionNumber,
                SigningPackageId = closing.SigningPackageId,
                ManifestHash = closing.ManifestHash,
                PurchasePrice = closing.PurchasePrice,
                Currency = closing.Currency,
                PaymentMethod = closing.PaymentMethod,
                PaymentStatus = closing.PaymentStatus,
                PaymentReference = closing.PaymentReference,
                PaymentAmount = closing.PaymentAmount,
                PaymentCurrency = closing.PaymentCurrency,
                PaidAt = closing.PaidAt,
                BuyerConfirmedAt = closing.BuyerConfirmedAt,
                CreatorConfirmedAt = closing.CreatorConfirmedAt,
                ProviderConfirmedAt = closing.ProviderConfirmedAt,
                Evidence = closing.Evidence.Select(e => new BuyoutPaymentEvidenceEntryDto
                {
                    Id = e.Id,
                    DocumentReference = e.DocumentReference,
                    DocumentName = e.DocumentName,
                    UploadedByUserId = e.UploadedByUserId,
                    UploadedByRole = e.UploadedByRole,
                    UploadedAt = e.UploadedAt,
                    ContentHash = e.ContentHash,
                    StatedAmount = e.StatedAmount,
                    StatedCurrency = e.StatedCurrency,
                    Notes = e.Notes
                }).ToList(),
                ClosingStatus = closing.ClosingStatus,
                CanProceedToHandover = closing.CanProceedToHandover,
                Blockers = closing.Blockers,
                DisputeReason = closing.DisputeReason,
                DisputedAt = closing.DisputedAt,
                DisputedByUserId = closing.DisputedByUserId,
                Version = closing.Version,
                StartedAt = closing.StartedAt,
                UpdatedAt = closing.UpdatedAt,
                PaymentCompletedAt = closing.PaymentCompletedAt,
                ReadyForHandoverAt = closing.ReadyForHandoverAt
            };
        }

        // ==========================================
        // FULL BUYOUT PHASE 6: ASSET HANDOVER & FINAL SALE ENDPOINTS
        // ==========================================

        private static string? ValidateBuyoutHandoverEntryGate(DealExecution deal)
        {
            if (deal.DealType != "FULL_BUYOUT")
                return "Asset Handover is only available for FULL_BUYOUT deals.";

            if (deal.DealStage != "BUYOUT_HANDOVER_PENDING" && deal.DealStage != "SOLD" && deal.DealStage != "BUYOUT_COMPLETED")
                return $"Handover is not available in stage '{deal.DealStage}'. Must be BUYOUT_HANDOVER_PENDING.";

            if (deal.BuyoutSigningPackage == null || deal.BuyoutSigningPackage.Status != "AGREEMENT_SIGNED")
                return "Buyout agreement signing package must be in AGREEMENT_SIGNED status.";

            if (deal.BuyoutSigningPackage.CreatorSignature == null || deal.BuyoutSigningPackage.EntrepreneurSignature == null)
                return "Bilateral signatures from both Creator and Buyer are required.";

            if (deal.BuyoutSigningPackage.CreatorSignature.ManifestHash != deal.BuyoutSigningPackage.EntrepreneurSignature.ManifestHash)
                return "Creator and Buyer signatures must reference the exact same ManifestHash.";

            if (deal.BuyoutClosing == null)
                return "Buyout closing record is missing.";

            if (deal.BuyoutClosing.PaymentStatus != "PAYMENT_CONFIRMED")
                return "Payment receipt must be confirmed before asset handover can begin.";

            if (deal.BuyoutClosing.ManifestHash != deal.BuyoutSigningPackage.ManifestHash)
                return "Closing manifest hash does not match signed agreement package.";

            if (deal.BuyoutAssetManifest == null)
                return "Asset Transfer Manifest is missing.";

            if (!deal.AcceptedRevisionNumber.HasValue)
                return "Accepted revision number is missing.";

            return null;
        }

        private static bool EnsureSeededBuyoutHandover(DealExecution deal)
        {
            var signingPkg = deal.BuyoutSigningPackage!;
            var closing = deal.BuyoutClosing!;
            var manifest = deal.BuyoutAssetManifest!;

            if (deal.BuyoutHandover == null)
            {
                var handover = new BuyoutHandover
                {
                    DealId = deal.Id,
                    IdeaId = deal.IdeaId ?? string.Empty,
                    DealType = "FULL_BUYOUT",
                    AcceptedRevisionNumber = signingPkg.AcceptedBuyoutRevisionNumber,
                    AssetManifestVersion = manifest.Version,
                    AssetManifestHash = manifest.ManifestHash,
                    SigningPackageId = signingPkg.Id,
                    ManifestHash = signingPkg.ManifestHash,
                    ClosingId = closing.Id,
                    Status = "IN_PROGRESS",
                    StartedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    Version = 1
                };

                // Seed assets directly from the canonical BuyoutAssetManifest
                foreach (var manifestAsset in manifest.Assets)
                {
                    handover.Assets.Add(new BuyoutHandoverAsset
                    {
                        AssetId = $"asset_{manifestAsset.AssetType.ToLowerInvariant().Replace(" ", "_")}",
                        AssetType = manifestAsset.AssetType,
                        DisplayName = manifestAsset.DisplayName,
                        DeliveryType = manifestAsset.AvailabilityStatus,
                        IsRequired = manifestAsset.TransferRequired,
                        Status = "PENDING",
                        SourceReference = manifestAsset.SourceReference ?? manifestAsset.DocumentId ?? manifestAsset.FileReference,
                        DeliveryInstructions = manifestAsset.Notes,
                        Version = 1
                    });
                }

                deal.BuyoutHandover = handover;
                return true;
            }
            return false;
        }

        private static void CalculateHandoverBlockers(BuyoutHandover handover, DealExecution deal)
        {
            var blockers = new List<string>();

            if (deal.BuyoutClosing?.PaymentStatus != "PAYMENT_CONFIRMED")
            {
                blockers.Add("Payment receipt is not confirmed.");
            }

            if (deal.BuyoutSigningPackage?.Status != "AGREEMENT_SIGNED" || deal.BuyoutSigningPackage?.ManifestHash != handover.ManifestHash)
            {
                blockers.Add("Signed agreement package integrity mismatch.");
            }

            foreach (var asset in handover.Assets)
            {
                if (asset.Status == "ISSUE_REPORTED")
                {
                    blockers.Add($"Issue reported on asset '{asset.DisplayName}': {asset.IssueReason ?? "Under review"}.");
                }
                else if (asset.IsRequired && asset.Status != "VERIFIED")
                {
                    blockers.Add($"Required asset '{asset.DisplayName}' is not yet verified by Buyer (Current: {asset.Status}).");
                }
            }

            if (handover.SellerConfirmedAt == null)
            {
                blockers.Add("Creator / Seller final handover sign-off is pending.");
            }

            if (handover.BuyerConfirmedAt == null)
            {
                blockers.Add("Buyer final receipt confirmation is pending.");
            }

            handover.Blockers = blockers;
            handover.CanCompleteSale = blockers.Count == 0;
        }

        /// <summary>
        /// GET /api/deals/{dealId}/buyout/handover
        /// Retrieves the Full Buyout Phase 6 Handover state.
        /// </summary>
        [HttpGet("{dealId}/buyout/handover")]
        public async Task<IActionResult> GetBuyoutHandover(string dealId)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var currentUserId = GetUserId();
                if (!IsAuthorizedLegalActor(deal, currentUserId))
                {
                    return StatusCode(403, ApiResponse.Error("You are not authorized to access handover for this deal."));
                }

                var gateError = ValidateBuyoutHandoverEntryGate(deal);
                if (gateError != null)
                {
                    return UnprocessableEntity(ApiResponse.Error(gateError));
                }

                bool seeded = EnsureSeededBuyoutHandover(deal);
                if (seeded)
                {
                    var oldVersion = deal.Version;
                    deal.Version++;
                    deal.UpdatedAt = DateTime.UtcNow;
                    await _context.DealExecutions.ReplaceOneAsync(d => d.Id == deal.Id && d.Version == oldVersion, deal);
                }

                var dto = await MapBuyoutHandoverDtoAsync(deal);
                return Ok(ApiResponse.Ok("Buyout handover retrieved successfully.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// POST /api/deals/{dealId}/buyout/handover/start
        /// Explicitly initializes the handover workspace for Phase 6.
        /// </summary>
        [HttpPost("{dealId}/buyout/handover/start")]
        public async Task<IActionResult> StartBuyoutHandover(string dealId)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var currentUserId = GetUserId();
                if (!IsAuthorizedLegalActor(deal, currentUserId))
                {
                    return StatusCode(403, ApiResponse.Error("You are not authorized to start handover for this deal."));
                }

                var gateError = ValidateBuyoutHandoverEntryGate(deal);
                if (gateError != null)
                {
                    return UnprocessableEntity(ApiResponse.Error(gateError));
                }

                EnsureSeededBuyoutHandover(deal);
                var handover = deal.BuyoutHandover!;
                handover.UpdatedAt = DateTime.UtcNow;

                var oldVersion = deal.Version;
                deal.Version++;
                deal.UpdatedAt = DateTime.UtcNow;

                await _context.DealExecutions.ReplaceOneAsync(d => d.Id == deal.Id && d.Version == oldVersion, deal);
                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, handover.Version, currentUserId, "buyout_handover_started");

                var dto = await MapBuyoutHandoverDtoAsync(deal);
                return Ok(ApiResponse.Ok("Buyout handover started.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// POST /api/deals/{dealId}/buyout/handover/assets/{assetId}/deliver
        /// Seller delivers an asset or provides delivery credentials/reference.
        /// </summary>
        [HttpPost("{dealId}/buyout/handover/assets/{assetId}/deliver")]
        public async Task<IActionResult> DeliverBuyoutAsset(string dealId, string assetId, [FromBody] DeliverBuyoutAssetRequest req)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var currentUserId = GetUserId();
                if (deal.CreatorId != currentUserId)
                {
                    return StatusCode(403, ApiResponse.Error("Only the Creator / Seller can mark assets as delivered."));
                }

                var gateError = ValidateBuyoutHandoverEntryGate(deal);
                if (gateError != null)
                {
                    return UnprocessableEntity(ApiResponse.Error(gateError));
                }

                EnsureSeededBuyoutHandover(deal);
                var handover = deal.BuyoutHandover!;

                if (req.ExpectedVersion > 0 && req.ExpectedVersion != handover.Version)
                {
                    return Conflict(ApiResponse.Error("Version conflict: Handover state has been updated. Please refresh and try again."));
                }

                var asset = handover.Assets.FirstOrDefault(a => a.AssetId == assetId || a.Id == assetId);
                if (asset == null)
                {
                    return NotFound(ApiResponse.Error($"Asset '{assetId}' not found in transfer manifest."));
                }

                // Update asset delivery state
                asset.Status = "DELIVERED";
                asset.SellerDeliveredAt = DateTime.UtcNow;
                asset.SellerDeliveredByUserId = currentUserId;
                asset.DeliveryReference = req.DeliveryReference ?? asset.DeliveryReference;
                asset.SellerNotes = req.Notes ?? asset.SellerNotes;
                asset.IssueReason = null;
                asset.IssueReportedAt = null;
                asset.Version++;

                if (!string.IsNullOrEmpty(req.DocumentReference))
                {
                    asset.Evidence.Add(new BuyoutPaymentEvidenceEntry
                    {
                        DocumentReference = req.DocumentReference,
                        DocumentName = req.DocumentName ?? "Asset Delivery Record",
                        UploadedByUserId = currentUserId,
                        UploadedByRole = "Creator",
                        UploadedAt = DateTime.UtcNow,
                        Notes = req.Notes
                    });
                }

                handover.Status = "AWAITING_BUYER_CONFIRMATION";
                handover.UpdatedAt = DateTime.UtcNow;
                handover.Version++;

                var oldVersion = deal.Version;
                deal.Version++;
                deal.UpdatedAt = DateTime.UtcNow;

                var replaceResult = await _context.DealExecutions.ReplaceOneAsync(
                    d => d.Id == deal.Id && d.Version == oldVersion,
                    deal
                );

                if (replaceResult.MatchedCount == 0)
                {
                    return Conflict(ApiResponse.Error("A concurrent update occurred. Please refresh and try again."));
                }

                if (!string.IsNullOrEmpty(deal.ConversationId))
                {
                    await PostMessengerEventAsync(deal.ConversationId, currentUserId,
                        $"Creator marked asset '{asset.DisplayName}' as DELIVERED. Buyer verification pending.");
                }

                if (!string.IsNullOrEmpty(deal.EntrepreneurId) && Guid.TryParse(deal.EntrepreneurId, out var entGuid) && _notifications != null)
                {
                    try
                    {
                        await _notifications.NotifyUser(
                            entGuid,
                            "Asset Delivered!",
                            $"Creator has delivered '{asset.DisplayName}'. Please inspect and verify receipt."
                        );
                    }
                    catch { }
                }

                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, handover.Version, currentUserId, "buyout_asset_delivered");

                var dto = await MapBuyoutHandoverDtoAsync(deal);
                return Ok(ApiResponse.Ok($"Asset '{asset.DisplayName}' marked as DELIVERED.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// POST /api/deals/{dealId}/buyout/handover/assets/{assetId}/verify
        /// Buyer verifies and confirms receipt of a delivered asset.
        /// </summary>
        [HttpPost("{dealId}/buyout/handover/assets/{assetId}/verify")]
        public async Task<IActionResult> VerifyBuyoutAsset(string dealId, string assetId, [FromBody] VerifyBuyoutAssetRequest req)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var currentUserId = GetUserId();
                if (deal.EntrepreneurId != currentUserId)
                {
                    return StatusCode(403, ApiResponse.Error("Only the Buyer / Entrepreneur can verify receipt of assets."));
                }

                var gateError = ValidateBuyoutHandoverEntryGate(deal);
                if (gateError != null)
                {
                    return UnprocessableEntity(ApiResponse.Error(gateError));
                }

                EnsureSeededBuyoutHandover(deal);
                var handover = deal.BuyoutHandover!;

                if (req.ExpectedVersion > 0 && req.ExpectedVersion != handover.Version)
                {
                    return Conflict(ApiResponse.Error("Version conflict: Handover state has been updated. Please refresh and try again."));
                }

                var asset = handover.Assets.FirstOrDefault(a => a.AssetId == assetId || a.Id == assetId);
                if (asset == null)
                {
                    return NotFound(ApiResponse.Error($"Asset '{assetId}' not found in transfer manifest."));
                }

                if (asset.Status != "DELIVERED" && asset.Status != "VERIFICATION_PENDING" && asset.Status != "VERIFIED")
                {
                    return UnprocessableEntity(ApiResponse.Error($"Cannot verify asset '{asset.DisplayName}' because it is in '{asset.Status}' status. Seller must deliver the asset first."));
                }

                // Idempotency: if already verified
                if (asset.Status == "VERIFIED")
                {
                    return Ok(ApiResponse.Ok($"Asset '{asset.DisplayName}' already verified.", await MapBuyoutHandoverDtoAsync(deal)));
                }

                asset.Status = "VERIFIED";
                asset.BuyerVerifiedAt = DateTime.UtcNow;
                asset.BuyerVerifiedByUserId = currentUserId;
                asset.BuyerNotes = req.Notes ?? asset.BuyerNotes;
                asset.IssueReason = null;
                asset.IssueReportedAt = null;
                asset.Version++;

                handover.UpdatedAt = DateTime.UtcNow;
                handover.Version++;

                var oldVersion = deal.Version;
                deal.Version++;
                deal.UpdatedAt = DateTime.UtcNow;

                var replaceResult = await _context.DealExecutions.ReplaceOneAsync(
                    d => d.Id == deal.Id && d.Version == oldVersion,
                    deal
                );

                if (replaceResult.MatchedCount == 0)
                {
                    return Conflict(ApiResponse.Error("A concurrent update occurred. Please refresh and try again."));
                }

                if (!string.IsNullOrEmpty(deal.ConversationId))
                {
                    await PostMessengerEventAsync(deal.ConversationId, currentUserId,
                        $"Buyer verified and accepted asset '{asset.DisplayName}'.");
                }

                if (!string.IsNullOrEmpty(deal.CreatorId) && Guid.TryParse(deal.CreatorId, out var creatorGuid) && _notifications != null)
                {
                    try
                    {
                        await _notifications.NotifyUser(
                            creatorGuid,
                            "Asset Verified!",
                            $"Buyer has verified and accepted '{asset.DisplayName}'."
                        );
                    }
                    catch { }
                }

                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, handover.Version, currentUserId, "buyout_asset_verified");

                var dto = await MapBuyoutHandoverDtoAsync(deal);
                return Ok(ApiResponse.Ok($"Asset '{asset.DisplayName}' verified successfully.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// POST /api/deals/{dealId}/buyout/handover/assets/{assetId}/issue
        /// Buyer reports an issue with a delivered asset, pausing completion.
        /// </summary>
        [HttpPost("{dealId}/buyout/handover/assets/{assetId}/issue")]
        public async Task<IActionResult> ReportBuyoutAssetIssue(string dealId, string assetId, [FromBody] ReportBuyoutAssetIssueRequest req)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var currentUserId = GetUserId();
                if (deal.EntrepreneurId != currentUserId)
                {
                    return StatusCode(403, ApiResponse.Error("Only the Buyer / Entrepreneur can report asset delivery issues."));
                }

                if (string.IsNullOrWhiteSpace(req.IssueReason))
                {
                    return BadRequest(ApiResponse.Error("Issue reason is required."));
                }

                EnsureSeededBuyoutHandover(deal);
                var handover = deal.BuyoutHandover!;

                if (req.ExpectedVersion > 0 && req.ExpectedVersion != handover.Version)
                {
                    return Conflict(ApiResponse.Error("Version conflict: Handover state has been updated. Please refresh and try again."));
                }

                var asset = handover.Assets.FirstOrDefault(a => a.AssetId == assetId || a.Id == assetId);
                if (asset == null)
                {
                    return NotFound(ApiResponse.Error($"Asset '{assetId}' not found in transfer manifest."));
                }

                asset.Status = "ISSUE_REPORTED";
                asset.IssueReason = req.IssueReason;
                asset.IssueReportedAt = DateTime.UtcNow;
                asset.Version++;

                handover.Status = "CHANGES_REQUESTED";
                handover.UpdatedAt = DateTime.UtcNow;
                handover.Version++;

                var oldVersion = deal.Version;
                deal.Version++;
                deal.UpdatedAt = DateTime.UtcNow;

                var replaceResult = await _context.DealExecutions.ReplaceOneAsync(
                    d => d.Id == deal.Id && d.Version == oldVersion,
                    deal
                );

                if (replaceResult.MatchedCount == 0)
                {
                    return Conflict(ApiResponse.Error("A concurrent update occurred. Please refresh and try again."));
                }

                if (!string.IsNullOrEmpty(deal.ConversationId))
                {
                    await PostMessengerEventAsync(deal.ConversationId, currentUserId,
                        $"Issue reported on asset '{asset.DisplayName}': {req.IssueReason}");
                }

                if (!string.IsNullOrEmpty(deal.CreatorId) && Guid.TryParse(deal.CreatorId, out var creatorGuid) && _notifications != null)
                {
                    try
                    {
                        await _notifications.NotifyUser(
                            creatorGuid,
                            "Asset Handover Issue Reported",
                            $"Buyer reported an issue with '{asset.DisplayName}': {req.IssueReason}"
                        );
                    }
                    catch { }
                }

                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, handover.Version, currentUserId, "buyout_asset_issue_reported");

                var dto = await MapBuyoutHandoverDtoAsync(deal);
                return Ok(ApiResponse.Ok($"Issue reported for asset '{asset.DisplayName}'.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// POST /api/deals/{dealId}/buyout/handover/confirm
        /// Confirms final handover sign-off (by Creator or Buyer).
        /// </summary>
        [HttpPost("{dealId}/buyout/handover/confirm")]
        public async Task<IActionResult> ConfirmBuyoutHandover(string dealId, [FromBody] ConfirmBuyoutHandoverRequest req)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var currentUserId = GetUserId();
                if (deal.CreatorId != currentUserId && deal.EntrepreneurId != currentUserId)
                {
                    return StatusCode(403, ApiResponse.Error("You are not authorized to confirm handover for this deal."));
                }

                var gateError = ValidateBuyoutHandoverEntryGate(deal);
                if (gateError != null)
                {
                    return UnprocessableEntity(ApiResponse.Error(gateError));
                }

                EnsureSeededBuyoutHandover(deal);
                var handover = deal.BuyoutHandover!;

                if (req.ExpectedVersion > 0 && req.ExpectedVersion != handover.Version)
                {
                    return Conflict(ApiResponse.Error("Version conflict: Handover state has been updated. Please refresh and try again."));
                }

                if (currentUserId == deal.CreatorId)
                {
                    handover.SellerConfirmedAt = DateTime.UtcNow;
                }
                else if (currentUserId == deal.EntrepreneurId)
                {
                    handover.BuyerConfirmedAt = DateTime.UtcNow;
                }

                handover.UpdatedAt = DateTime.UtcNow;
                handover.Version++;

                var oldVersion = deal.Version;
                deal.Version++;
                deal.UpdatedAt = DateTime.UtcNow;

                var replaceResult = await _context.DealExecutions.ReplaceOneAsync(
                    d => d.Id == deal.Id && d.Version == oldVersion,
                    deal
                );

                if (replaceResult.MatchedCount == 0)
                {
                    return Conflict(ApiResponse.Error("A concurrent update occurred. Please refresh and try again."));
                }

                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, handover.Version, currentUserId, "buyout_handover_confirmed");

                var dto = await MapBuyoutHandoverDtoAsync(deal);
                return Ok(ApiResponse.Ok("Handover sign-off recorded successfully.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// POST /api/deals/{dealId}/buyout/handover/complete-sale
        /// Atomically completes the Full Buyout transaction and marks the project as SOLD.
        /// </summary>
        [HttpPost("{dealId}/buyout/handover/complete-sale")]
        public async Task<IActionResult> CompleteBuyoutSale(string dealId, [FromBody] CompleteBuyoutSaleRequest req)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var currentUserId = GetUserId();
                if (deal.CreatorId != currentUserId && deal.EntrepreneurId != currentUserId)
                {
                    return StatusCode(403, ApiResponse.Error("You are not authorized to complete this buyout transaction."));
                }

                // Idempotency: if already completed and SOLD
                if (deal.DealStage == "SOLD" && deal.Status == "completed" && deal.BuyoutHandover?.Status == "COMPLETED")
                {
                    return Ok(ApiResponse.Ok("Transaction is already finalized and project is marked as SOLD.", await MapEquityDealDtoAsync(deal)));
                }

                var gateError = ValidateBuyoutHandoverEntryGate(deal);
                if (gateError != null)
                {
                    return UnprocessableEntity(ApiResponse.Error(gateError));
                }

                EnsureSeededBuyoutHandover(deal);
                var handover = deal.BuyoutHandover!;
                CalculateHandoverBlockers(handover, deal);

                if (!handover.CanCompleteSale)
                {
                    return UnprocessableEntity(ApiResponse.Error("Cannot complete sale: Prerequisites or asset verifications are pending.", HttpContext.TraceIdentifier, new { blockers = handover.Blockers }));
                }

                if (req.ExpectedVersion > 0 && req.ExpectedVersion != handover.Version)
                {
                    return Conflict(ApiResponse.Error("Version conflict: Handover state has been updated. Please refresh and try again."));
                }

                // Cross-Mode Race & Competing Deal Protection
                CreatorIdea? idea = null;
                if (!string.IsNullOrEmpty(deal.IdeaId))
                {
                    idea = await _context.CreatorIdeas.Find(i => i.Id == deal.IdeaId).FirstOrDefaultAsync();
                    if (idea != null)
                    {
                        if (string.Equals(idea.ProjectOutcome, "SOLD", StringComparison.OrdinalIgnoreCase) && idea.ActiveBuyoutDealId != deal.Id)
                        {
                            return Conflict(ApiResponse.Error("This project has already been sold in another completed buyout transaction."));
                        }

                        if (string.Equals(idea.ProjectOutcome, "CO_FOUNDED", StringComparison.OrdinalIgnoreCase))
                        {
                            return Conflict(ApiResponse.Error("This project has already been activated under an equity co-founder partnership."));
                        }
                    }
                }

                // Map actor names for records
                var creatorUser = !string.IsNullOrEmpty(deal.CreatorId) ? await _userManager.FindByIdAsync(deal.CreatorId) : null;
                var entUser = !string.IsNullOrEmpty(deal.EntrepreneurId) ? await _userManager.FindByIdAsync(deal.EntrepreneurId) : null;
                var creatorName = creatorUser != null && !string.IsNullOrWhiteSpace(creatorUser.Name) ? creatorUser.Name : (creatorUser?.UserName ?? "Creator");
                var entName = entUser != null && !string.IsNullOrWhiteSpace(entUser.Name) ? entUser.Name : (entUser?.UserName ?? "Entrepreneur");

                // Atomically update Handover & Closing
                handover.Status = "COMPLETED";
                handover.CompletedAt = DateTime.UtcNow;
                handover.UpdatedAt = DateTime.UtcNow;
                handover.Version++;

                deal.BuyoutClosing!.ClosingStatus = "COMPLETED";
                deal.BuyoutClosing.UpdatedAt = DateTime.UtcNow;

                // Deal Stage transition to SOLD
                deal.DealStage = "SOLD";
                deal.Status = "completed";
                deal.ClosedAt = DateTime.UtcNow;
                deal.UpdatedAt = DateTime.UtcNow;

                // Create canonical BuyoutSaleRecord
                var saleRecord = new BuyoutSaleRecord
                {
                    DealId = deal.Id,
                    IdeaId = deal.IdeaId ?? string.Empty,
                    ProjectName = idea?.Project?.Name ?? deal.CompanyNameSnapshot ?? "Project",
                    SellerUserId = deal.CreatorId ?? string.Empty,
                    SellerName = creatorName,
                    BuyerUserId = deal.EntrepreneurId ?? string.Empty,
                    BuyerName = entName,
                    PurchasePrice = deal.BuyoutClosing.PurchasePrice,
                    Currency = deal.BuyoutClosing.Currency,
                    AcceptedRevisionNumber = handover.AcceptedRevisionNumber,
                    SigningPackageId = handover.SigningPackageId,
                    ManifestHash = handover.ManifestHash,
                    AssetManifestVersion = handover.AssetManifestVersion,
                    ClosingId = handover.ClosingId,
                    HandoverId = handover.Id,
                    SoldAt = DateTime.UtcNow,
                    TransferredAssets = handover.Assets.Select(a => a.DisplayName).ToList(),
                    Status = "SOLD",
                    AuditReference = $"SALE-REF-{deal.Id.Substring(0, Math.Min(8, deal.Id.Length))}-{DateTime.UtcNow:yyyyMMddHHmmss}"
                };
                deal.BuyoutSaleRecord = saleRecord;

                var oldVersion = deal.Version;
                deal.Version++;

                var replaceResult = await _context.DealExecutions.ReplaceOneAsync(
                    d => d.Id == deal.Id && d.Version == oldVersion,
                    deal
                );

                if (replaceResult.MatchedCount == 0)
                {
                    return Conflict(ApiResponse.Error("A concurrent update occurred. Please refresh and try again."));
                }

                // Atomically update CreatorIdea to SOLD
                if (idea != null)
                {
                    idea.ProjectOutcome = "SOLD";
                    idea.ActiveBuyoutDealId = deal.Id;
                    idea.AcquiredByUserId = deal.EntrepreneurId;
                    idea.SoldAt = DateTime.UtcNow;
                    idea.SalePrice = deal.BuyoutClosing.PurchasePrice;
                    idea.UpdatedAt = DateTime.UtcNow;
                    idea.Version++;
                    await _context.CreatorIdeas.ReplaceOneAsync(i => i.Id == idea.Id, idea);
                }

                // Close all other competing project interests/deals for this idea
                if (!string.IsNullOrEmpty(deal.IdeaId))
                {
                    var competingInterests = await _context.ProjectInterests.Find(pi => pi.IdeaId == deal.IdeaId).ToListAsync();
                    foreach (var ci in competingInterests)
                    {
                        if (ci.Id.ToString() != deal.ProjectInterestId && ci.Status != "declined" && ci.Status != "closed")
                        {
                            ci.Status = "closed";
                            await _context.ProjectInterests.ReplaceOneAsync(pi => pi.Id == ci.Id, ci);
                            await LogAuditAsync(deal.IdeaId, deal.Id, handover.Version, currentUserId, "competing_deal_closed_after_sale");
                        }
                    }
                }

                // System notifications & Messenger
                if (!string.IsNullOrEmpty(deal.ConversationId))
                {
                    await PostMessengerEventAsync(deal.ConversationId, currentUserId,
                        "Full Buyout sale finalized! Asset handover complete and project marked as SOLD.");
                }

                if (_notifications != null)
                {
                    if (!string.IsNullOrEmpty(deal.CreatorId) && Guid.TryParse(deal.CreatorId, out var creatorGuid))
                    {
                        try
                        {
                            await _notifications.NotifyUser(
                                creatorGuid,
                                "Project Successfully Sold!",
                                $"Congratulations! The Full Buyout for '{saleRecord.ProjectName}' is complete. Purchase price: €{saleRecord.PurchasePrice:N0}."
                            );
                        }
                        catch { }
                    }

                    if (!string.IsNullOrEmpty(deal.EntrepreneurId) && Guid.TryParse(deal.EntrepreneurId, out var entGuid))
                    {
                        try
                        {
                            await _notifications.NotifyUser(
                                entGuid,
                                "Acquisition Complete!",
                                $"You have successfully acquired '{saleRecord.ProjectName}'. All agreed assets have been transferred."
                            );
                        }
                        catch { }
                    }
                }

                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, handover.Version, currentUserId, "buyout_handover_completed");
                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, handover.Version, currentUserId, "buyout_sale_completed");
                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, handover.Version, currentUserId, "creator_project_marked_sold");
                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, handover.Version, currentUserId, "marketplace_listing_closed_after_sale");

                var dealDto = await MapEquityDealDtoAsync(deal);
                return Ok(ApiResponse.Ok("Full Buyout transaction finalized! Project successfully sold.", dealDto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// GET /api/deals/buyout/my-active
        /// Retrieves all active (non-terminal/non-completed) buyout deals for the current user as the SELLER (Creator / Idea owner).
        /// </summary>
        [HttpGet("buyout/my-active")]
        [HttpGet("buyout/active")]
        public async Task<IActionResult> GetMyActiveBuyoutDeals()
        {
            try
            {
                var currentUserId = GetUserId();
                if (string.IsNullOrEmpty(currentUserId)) return Unauthorized(ApiResponse.Error("Authentication required."));

                var filter = Builders<DealExecution>.Filter.And(
                    Builders<DealExecution>.Filter.Eq(d => d.DealType, "FULL_BUYOUT"),
                    Builders<DealExecution>.Filter.Eq(d => d.CreatorId, currentUserId),
                    Builders<DealExecution>.Filter.Ne(d => d.DealStage, "SOLD"),
                    Builders<DealExecution>.Filter.Ne(d => d.DealStage, "BUYOUT_COMPLETED"),
                    Builders<DealExecution>.Filter.Ne(d => d.DealStage, "CANCELLED"),
                    Builders<DealExecution>.Filter.Ne(d => d.DealStage, "REJECTED"),
                    Builders<DealExecution>.Filter.Ne(d => d.Status, "CANCELLED"),
                    Builders<DealExecution>.Filter.Ne(d => d.Status, "REJECTED"),
                    Builders<DealExecution>.Filter.Ne(d => d.Status, "UNAVAILABLE")
                );

                var deals = await _context.DealExecutions.Find(filter).SortByDescending(d => d.UpdatedAt).ToListAsync();
                var results = new List<EquityDealDto>();
                foreach (var deal in deals)
                {
                    results.Add(await MapEquityDealDtoAsync(deal));
                }

                return Ok(ApiResponse.Ok("Active buyout deals retrieved.", results));
            }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// GET /api/deals/buyout/my-sales
        /// Retrieves all completed buyout sale records for the current user as the SELLER (Creator / Idea owner).
        /// </summary>
        [HttpGet("buyout/my-sales")]
        public async Task<IActionResult> GetMyBuyoutSales()
        {
            try
            {
                var currentUserId = GetUserId();
                if (string.IsNullOrEmpty(currentUserId)) return Unauthorized(ApiResponse.Error("Authentication required."));

                var filter = Builders<DealExecution>.Filter.And(
                    Builders<DealExecution>.Filter.Eq(d => d.CreatorId, currentUserId),
                    Builders<DealExecution>.Filter.Or(
                        Builders<DealExecution>.Filter.Eq(d => d.DealStage, "SOLD"),
                        Builders<DealExecution>.Filter.Eq(d => d.DealStage, "BUYOUT_COMPLETED")
                    )
                );

                var deals = await _context.DealExecutions.Find(filter).ToListAsync();
                var results = new List<BuyoutSaleRecordDto>();
                foreach (var deal in deals)
                {
                    results.Add(await MapBuyoutSaleRecordDtoAsync(deal));
                }

                return Ok(ApiResponse.Ok("Completed sales retrieved.", results));
            }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// GET /api/deals/buyout/my-acquisitions
        /// Retrieves all completed buyout acquisition records for the current user as the BUYER (Entrepreneur).
        /// </summary>
        [HttpGet("buyout/my-acquisitions")]
        public async Task<IActionResult> GetMyAcquisitions()
        {
            try
            {
                var currentUserId = GetUserId();
                if (string.IsNullOrEmpty(currentUserId)) return Unauthorized(ApiResponse.Error("Authentication required."));

                var filter = Builders<DealExecution>.Filter.And(
                    Builders<DealExecution>.Filter.Eq(d => d.EntrepreneurId, currentUserId),
                    Builders<DealExecution>.Filter.Or(
                        Builders<DealExecution>.Filter.Eq(d => d.DealStage, "SOLD"),
                        Builders<DealExecution>.Filter.Eq(d => d.DealStage, "BUYOUT_COMPLETED")
                    )
                );

                var deals = await _context.DealExecutions.Find(filter).ToListAsync();
                var results = new List<BuyoutSaleRecordDto>();
                foreach (var deal in deals)
                {
                    results.Add(await MapBuyoutSaleRecordDtoAsync(deal));
                }

                return Ok(ApiResponse.Ok("Completed acquisitions retrieved.", results));
            }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// GET /api/deals/buyout/my-active-acquisitions
        /// Retrieves all active (non-terminal/non-completed) buyout deals for the current user as the BUYER (Entrepreneur).
        /// </summary>
        [HttpGet("buyout/my-active-acquisitions")]
        [HttpGet("buyout/active-acquisitions")]
        public async Task<IActionResult> GetMyActiveAcquisitions()
        {
            try
            {
                var currentUserId = GetUserId();
                if (string.IsNullOrEmpty(currentUserId)) return Unauthorized(ApiResponse.Error("Authentication required."));

                var filter = Builders<DealExecution>.Filter.And(
                    Builders<DealExecution>.Filter.Eq(d => d.DealType, "FULL_BUYOUT"),
                    Builders<DealExecution>.Filter.Eq(d => d.EntrepreneurId, currentUserId),
                    Builders<DealExecution>.Filter.Ne(d => d.DealStage, "SOLD"),
                    Builders<DealExecution>.Filter.Ne(d => d.DealStage, "BUYOUT_COMPLETED"),
                    Builders<DealExecution>.Filter.Ne(d => d.DealStage, "CANCELLED"),
                    Builders<DealExecution>.Filter.Ne(d => d.DealStage, "REJECTED"),
                    Builders<DealExecution>.Filter.Ne(d => d.Status, "CANCELLED"),
                    Builders<DealExecution>.Filter.Ne(d => d.Status, "REJECTED"),
                    Builders<DealExecution>.Filter.Ne(d => d.Status, "UNAVAILABLE")
                );

                var deals = await _context.DealExecutions.Find(filter).SortByDescending(d => d.UpdatedAt).ToListAsync();
                var results = new List<EquityDealDto>();
                foreach (var deal in deals)
                {
                    results.Add(await MapEquityDealDtoAsync(deal));
                }

                return Ok(ApiResponse.Ok("Active buyout acquisitions retrieved.", results));
            }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// GET /api/deals/{dealId}/buyout/sale-record
        /// Retrieves the read-only canonical sale record.
        /// </summary>
        [HttpGet("{dealId}/buyout/sale-record")]
        public async Task<IActionResult> GetBuyoutSaleRecord(string dealId)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var currentUserId = GetUserId();
                if (!IsAuthorizedLegalActor(deal, currentUserId))
                {
                    return StatusCode(403, ApiResponse.Error("You are not authorized to view the sale record for this deal."));
                }

                if (deal.DealStage != "SOLD" && deal.DealStage != "BUYOUT_COMPLETED" && deal.BuyoutSaleRecord == null)
                {
                    return UnprocessableEntity(ApiResponse.Error("Sale record is only available after final sale completion."));
                }

                var dto = await MapBuyoutSaleRecordDtoAsync(deal);
                return Ok(ApiResponse.Ok("Sale record retrieved.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        private async Task<BuyoutHandoverDto> MapBuyoutHandoverDtoAsync(DealExecution deal)
        {
            var handover = deal.BuyoutHandover!;
            CalculateHandoverBlockers(handover, deal);

            var creatorUser = !string.IsNullOrEmpty(deal.CreatorId) ? await _userManager.FindByIdAsync(deal.CreatorId) : null;
            var entUser = !string.IsNullOrEmpty(deal.EntrepreneurId) ? await _userManager.FindByIdAsync(deal.EntrepreneurId) : null;

            var creatorName = creatorUser != null && !string.IsNullOrWhiteSpace(creatorUser.Name) ? creatorUser.Name : (creatorUser?.UserName ?? "Creator");
            var entName = entUser != null && !string.IsNullOrWhiteSpace(entUser.Name) ? entUser.Name : (entUser?.UserName ?? "Entrepreneur");

            var idea = !string.IsNullOrEmpty(deal.IdeaId)
                ? await _context.CreatorIdeas.Find(i => i.Id == deal.IdeaId).FirstOrDefaultAsync()
                : null;

            return new BuyoutHandoverDto
            {
                Id = handover.Id,
                DealId = handover.DealId,
                IdeaId = handover.IdeaId,
                ProjectName = idea?.Project?.Name ?? deal.CompanyNameSnapshot ?? "Project",
                DealType = "FULL_BUYOUT",
                CreatorId = deal.CreatorId ?? "",
                CreatorName = creatorName,
                EntrepreneurId = deal.EntrepreneurId ?? "",
                EntrepreneurName = entName,
                AcceptedRevisionNumber = handover.AcceptedRevisionNumber,
                AssetManifestVersion = handover.AssetManifestVersion,
                AssetManifestHash = handover.AssetManifestHash,
                SigningPackageId = handover.SigningPackageId,
                ManifestHash = handover.ManifestHash,
                ClosingId = handover.ClosingId,
                PurchasePrice = deal.BuyoutClosing?.PurchasePrice ?? 0,
                Currency = deal.BuyoutClosing?.Currency ?? "EUR",
                HandoverPeriodWeeks = deal.BuyoutTerms?.HandoverPeriodWeeks ?? 2,
                TransitionSupportWeeks = deal.BuyoutTerms?.TransitionSupportWeeks ?? 4,
                Assets = handover.Assets.Select(a => new BuyoutHandoverAssetDto
                {
                    Id = a.Id,
                    AssetId = a.AssetId,
                    AssetType = a.AssetType,
                    DisplayName = a.DisplayName,
                    DeliveryType = a.DeliveryType,
                    IsRequired = a.IsRequired,
                    Status = a.Status,
                    SourceReference = a.SourceReference,
                    DeliveryReference = a.DeliveryReference,
                    DeliveryInstructions = a.DeliveryInstructions,
                    SellerDeliveredAt = a.SellerDeliveredAt,
                    SellerDeliveredByUserId = a.SellerDeliveredByUserId,
                    BuyerVerifiedAt = a.BuyerVerifiedAt,
                    BuyerVerifiedByUserId = a.BuyerVerifiedByUserId,
                    SellerNotes = a.SellerNotes,
                    BuyerNotes = a.BuyerNotes,
                    IssueReason = a.IssueReason,
                    IssueReportedAt = a.IssueReportedAt,
                    Evidence = a.Evidence.Select(e => new BuyoutPaymentEvidenceEntryDto
                    {
                        Id = e.Id,
                        DocumentReference = e.DocumentReference,
                        DocumentName = e.DocumentName,
                        UploadedByUserId = e.UploadedByUserId,
                        UploadedByRole = e.UploadedByRole,
                        UploadedAt = e.UploadedAt,
                        Notes = e.Notes
                    }).ToList(),
                    Version = a.Version
                }).ToList(),
                Status = handover.Status,
                CanCompleteSale = handover.CanCompleteSale,
                Blockers = handover.Blockers,
                SellerConfirmedAt = handover.SellerConfirmedAt,
                BuyerConfirmedAt = handover.BuyerConfirmedAt,
                Version = handover.Version,
                StartedAt = handover.StartedAt,
                UpdatedAt = handover.UpdatedAt,
                CompletedAt = handover.CompletedAt
            };
        }

        private async Task<BuyoutSaleRecordDto> MapBuyoutSaleRecordDtoAsync(DealExecution deal)
        {
            var record = deal.BuyoutSaleRecord;
            var creatorUser = !string.IsNullOrEmpty(deal.CreatorId) ? await _userManager.FindByIdAsync(deal.CreatorId) : null;
            var entUser = !string.IsNullOrEmpty(deal.EntrepreneurId) ? await _userManager.FindByIdAsync(deal.EntrepreneurId) : null;

            var creatorName = creatorUser != null && !string.IsNullOrWhiteSpace(creatorUser.Name) ? creatorUser.Name : (creatorUser?.UserName ?? "Creator");
            var entName = entUser != null && !string.IsNullOrWhiteSpace(entUser.Name) ? entUser.Name : (entUser?.UserName ?? "Entrepreneur");

            var idea = !string.IsNullOrEmpty(deal.IdeaId)
                ? await _context.CreatorIdeas.Find(i => i.Id == deal.IdeaId).FirstOrDefaultAsync()
                : null;

            if (record == null)
            {
                return new BuyoutSaleRecordDto
                {
                    Id = Guid.NewGuid().ToString("N"),
                    DealId = deal.Id,
                    IdeaId = deal.IdeaId ?? "",
                    ProjectName = idea?.Project?.Name ?? deal.CompanyNameSnapshot ?? "Project",
                    SellerUserId = deal.CreatorId ?? "",
                    SellerName = creatorName,
                    BuyerUserId = deal.EntrepreneurId ?? "",
                    BuyerName = entName,
                    PurchasePrice = deal.BuyoutClosing?.PurchasePrice ?? 0,
                    Currency = deal.BuyoutClosing?.Currency ?? "EUR",
                    AcceptedRevisionNumber = deal.AcceptedRevisionNumber ?? 1,
                    SigningPackageId = deal.BuyoutSigningPackage?.Id ?? "",
                    ManifestHash = deal.BuyoutSigningPackage?.ManifestHash ?? "",
                    AssetManifestVersion = deal.BuyoutAssetManifest?.Version ?? 1,
                    ClosingId = deal.BuyoutClosing?.Id ?? "",
                    HandoverId = deal.BuyoutHandover?.Id ?? "",
                    SoldAt = deal.ClosedAt ?? DateTime.UtcNow,
                    TransferredAssets = deal.BuyoutHandover?.Assets.Select(a => a.DisplayName).ToList() ?? new List<string>(),
                    Status = "SOLD",
                    AuditReference = $"SALE-REF-{deal.Id.Substring(0, Math.Min(8, deal.Id.Length))}"
                };
            }

            return new BuyoutSaleRecordDto
            {
                Id = record.Id,
                DealId = record.DealId,
                IdeaId = record.IdeaId,
                ProjectName = record.ProjectName,
                SellerUserId = record.SellerUserId,
                SellerName = record.SellerName,
                BuyerUserId = record.BuyerUserId,
                BuyerName = record.BuyerName,
                PurchasePrice = record.PurchasePrice,
                Currency = record.Currency,
                AcceptedRevisionNumber = record.AcceptedRevisionNumber,
                SigningPackageId = record.SigningPackageId,
                ManifestHash = record.ManifestHash,
                AssetManifestVersion = record.AssetManifestVersion,
                ClosingId = record.ClosingId,
                HandoverId = record.HandoverId,
                SoldAt = record.SoldAt,
                TransferredAssets = record.TransferredAssets,
                Status = record.Status,
                AuditReference = record.AuditReference
            };
        }

        // ==========================================
        // PHASE 7: AGREEMENT SIGNING ENDPOINTS
        // ==========================================

        /// <summary>
        /// GET /api/deals/{dealId}/signing
        /// Retrieves the signing package for Screen 05, seeding or refreshing if valid.
        /// </summary>
        [HttpGet("{dealId}/signing")]
        public async Task<IActionResult> GetSigningPackage(string dealId)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var userId = GetUserId();
                if (!IsAuthorizedLegalActor(deal, userId))
                    return StatusCode(403, ApiResponse.Error("You are not authorized to view the signing package for this deal."));

                var gateError = ValidateSigningEntryGate(deal);
                if (gateError != null)
                    return UnprocessableEntity(ApiResponse.Error(gateError));

                bool updated = await EnsureSeededSigningPackageAsync(deal);
                if (updated)
                {
                    var oldVersion = deal.Version;
                    deal.Version++;
                    deal.UpdatedAt = DateTime.UtcNow;
                    await _context.DealExecutions.ReplaceOneAsync(d => d.Id == deal.Id && d.Version == oldVersion, deal);
                }

                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, deal.SigningPackage!.LegalPackageVersion, userId, "signing_package_viewed");

                var dto = await MapSigningPackageDtoAsync(deal);
                return Ok(ApiResponse.Ok("Signing package loaded successfully.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// POST /api/deals/{dealId}/signing/prepare
        /// Explicitly prepares and freezes the signing package from approved legal documents.
        /// </summary>
        [HttpPost("{dealId}/signing/prepare")]
        public async Task<IActionResult> PrepareSigningPackage(string dealId)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var userId = GetUserId();
                var isCreator = deal.CreatorId == userId;
                var isEntrepreneur = deal.EntrepreneurId == userId;
                if (!isCreator && !isEntrepreneur)
                    return StatusCode(403, ApiResponse.Error("Only deal principals may prepare the signing package."));

                var gateError = ValidateSigningEntryGate(deal);
                if (gateError != null)
                    return UnprocessableEntity(ApiResponse.Error(gateError));

                await EnsureSeededSigningPackageAsync(deal);
                var oldVersion = deal.Version;
                deal.Version++;
                deal.UpdatedAt = DateTime.UtcNow;
                await _context.DealExecutions.ReplaceOneAsync(d => d.Id == deal.Id && d.Version == oldVersion, deal);

                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, deal.SigningPackage!.LegalPackageVersion, userId, "signing_package_created");

                var dto = await MapSigningPackageDtoAsync(deal);
                return Ok(ApiResponse.Ok("Signing package prepared successfully.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// POST /api/deals/{dealId}/signing/sign
        /// Records electronic signature by Creator or Entrepreneur. Both must sign the same ManifestHash.
        /// When both sign, advances DealStage to ACTIVATION_PENDING.
        /// </summary>
        [HttpPost("{dealId}/signing/sign")]
        public async Task<IActionResult> SignAgreement(string dealId, [FromBody] SignAgreementRequest request)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var userId = GetUserId();
                var isCreator = deal.CreatorId == userId;
                var isEntrepreneur = deal.EntrepreneurId == userId;

                if (!isCreator && !isEntrepreneur)
                    return StatusCode(403, ApiResponse.Error("Only Creator or Entrepreneur principals may sign agreements. Legal service providers and third parties cannot sign."));

                var gateError = ValidateSigningEntryGate(deal);
                if (gateError != null)
                    return UnprocessableEntity(ApiResponse.Error(gateError));

                await EnsureSeededSigningPackageAsync(deal);
                var pkg = deal.SigningPackage!;

                // Stale package / manifest hash check
                if (!string.IsNullOrEmpty(request.ManifestHash) && request.ManifestHash != pkg.ManifestHash)
                {
                    return StatusCode(409, ApiResponse.Error("Signing package manifest mismatch or stale document state. Please refresh and review current agreements before signing."));
                }
                if (request.LegalPackageVersion > 0 && request.LegalPackageVersion != pkg.LegalPackageVersion)
                {
                    return StatusCode(409, ApiResponse.Error($"Version mismatch: received V{request.LegalPackageVersion} but active legal package is V{pkg.LegalPackageVersion}."));
                }

                // Idempotency: check if already signed by this actor for this exact manifest
                if (isCreator && pkg.CreatorSignature != null && pkg.CreatorSignature.ManifestHash == pkg.ManifestHash)
                {
                    var existingDto = await MapSigningPackageDtoAsync(deal);
                    return Ok(ApiResponse.Ok("Agreement already signed by Creator.", existingDto));
                }
                if (isEntrepreneur && pkg.EntrepreneurSignature != null && pkg.EntrepreneurSignature.ManifestHash == pkg.ManifestHash)
                {
                    var existingDto = await MapSigningPackageDtoAsync(deal);
                    return Ok(ApiResponse.Ok("Agreement already signed by Entrepreneur.", existingDto));
                }

                var user = await _userManager.FindByIdAsync(userId);
                var signerName = user != null && !string.IsNullOrWhiteSpace(user.Name) ? user.Name : (user?.UserName ?? (isCreator ? "Creator" : "Entrepreneur"));
                var signerRole = isCreator ? "Creator" : "Entrepreneur";

                var remoteIp = HttpContext.Connection?.RemoteIpAddress?.ToString() ?? "127.0.0.1";
                var userAgent = Request.Headers.UserAgent.ToString() ?? "browser";

                var now = DateTime.UtcNow;
                var sigHash = ComputeSha256Hash($"{userId}:{signerRole}:{pkg.ManifestHash}:{pkg.LegalPackageVersion}:{now:O}");

                var signature = new PartySignature
                {
                    SignerUserId = userId,
                    SignerName = signerName,
                    SignerRole = signerRole,
                    ManifestHash = pkg.ManifestHash,
                    LegalPackageVersion = pkg.LegalPackageVersion,
                    SignedAt = now,
                    SignatureHash = sigHash,
                    IpHash = ComputeSha256Hash(remoteIp),
                    UserAgentHash = ComputeSha256Hash(userAgent),
                    ConsentStatement = !string.IsNullOrWhiteSpace(request.ConsentStatement)
                        ? request.ConsentStatement.Trim()
                        : "I confirm that I have reviewed and agree to the documents listed in this signing package."
                };

                if (isCreator)
                {
                    pkg.CreatorSignature = signature;
                }
                else
                {
                    pkg.EntrepreneurSignature = signature;
                }

                pkg.UpdatedAt = now;

                bool bothSigned = pkg.CreatorSignature != null &&
                                  pkg.EntrepreneurSignature != null &&
                                  pkg.CreatorSignature.ManifestHash == pkg.ManifestHash &&
                                  pkg.EntrepreneurSignature.ManifestHash == pkg.ManifestHash;

                if (bothSigned)
                {
                    pkg.Status = "AGREEMENT_SIGNED";
                    pkg.FinalizedAt = now;
                    deal.DealStage = "ACTIVATION_PENDING";
                }
                else
                {
                    pkg.Status = isCreator ? "CREATOR_SIGNED" : "ENTREPRENEUR_SIGNED";
                }

                var oldVersion = deal.Version;
                deal.Version++;
                deal.UpdatedAt = now;

                var replaceResult = await _context.DealExecutions.ReplaceOneAsync(
                    d => d.Id == deal.Id && d.Version == oldVersion,
                    deal
                );

                if (replaceResult.ModifiedCount == 0)
                {
                    return StatusCode(409, ApiResponse.Error("A concurrent change was made to this deal. Please refresh and retry."));
                }

                if (bothSigned)
                {
                    await PostMessengerEventAsync(
                        deal.ConversationId,
                        userId,
                        "Both parties signed the agreement. Next step: Company / Project Activation."
                    );

                    // Notifications
                    if (Guid.TryParse(deal.CreatorId, out var cGuid) && _notifications != null)
                    {
                        try { await _notifications.NotifyUser(cGuid, "Agreement Fully Signed", "Both parties have executed all agreements. Next step: Company / Project Activation."); } catch { }
                    }
                    if (Guid.TryParse(deal.EntrepreneurId, out var eGuid) && _notifications != null)
                    {
                        try { await _notifications.NotifyUser(eGuid, "Agreement Fully Signed", "Both parties have executed all agreements. Next step: Company / Project Activation."); } catch { }
                    }

                    await LogAuditAsync(deal.IdeaId ?? "", deal.Id, pkg.LegalPackageVersion, userId, "agreement_fully_signed");
                }
                else
                {
                    await PostMessengerEventAsync(
                        deal.ConversationId,
                        userId,
                        $"{signerRole} signed Legal Package V{pkg.LegalPackageVersion}."
                    );

                    var otherUserId = isCreator ? deal.EntrepreneurId : deal.CreatorId;
                    if (!string.IsNullOrEmpty(otherUserId) && Guid.TryParse(otherUserId, out var otherGuid) && _notifications != null)
                    {
                        try
                        {
                            await _notifications.NotifyUser(
                                otherGuid,
                                "Agreement Signed by Partner",
                                $"{signerRole} has signed the legal agreement package (V{pkg.LegalPackageVersion}). Your signature is required."
                            );
                        }
                        catch { }
                    }

                    await LogAuditAsync(deal.IdeaId ?? "", deal.Id, pkg.LegalPackageVersion, userId, isCreator ? "creator_signed" : "entrepreneur_signed");
                }

                var dto = await MapSigningPackageDtoAsync(deal);
                return Ok(ApiResponse.Ok(bothSigned ? "Agreement fully signed by both parties." : "Agreement signed successfully.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// POST /api/deals/{dealId}/signing/request-legal-change
        /// Invalidates current signing package, returns deal to LEGAL_REVIEW_PENDING, and creates a revision request.
        /// </summary>
        [HttpPost("{dealId}/signing/request-legal-change")]
        public async Task<IActionResult> RequestSigningLegalChange(string dealId, [FromBody] RequestSigningLegalChangeRequest request)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var userId = GetUserId();
                var isCreator = deal.CreatorId == userId;
                var isEntrepreneur = deal.EntrepreneurId == userId;

                if (!isCreator && !isEntrepreneur)
                    return StatusCode(403, ApiResponse.Error("You are not authorized to request legal changes for this deal."));

                if (deal.DealStage != "SIGNATURE_PENDING")
                    return UnprocessableEntity(ApiResponse.Error($"Legal changes can only be requested during signature pending stage. Current stage: {deal.DealStage}."));

                // Invalidate signing package
                if (deal.SigningPackage != null)
                {
                    deal.SigningPackage.Status = "INVALIDATED";
                    deal.SigningPackage.UpdatedAt = DateTime.UtcNow;
                }

                // Return to LEGAL_REVIEW_PENDING and bump legal package
                deal.DealStage = "LEGAL_REVIEW_PENDING";
                if (deal.LegalPackage != null)
                {
                    deal.LegalPackage.Version++;
                    deal.LegalPackage.Status = "CHANGES_REQUESTED";
                    deal.LegalPackage.CreatorApprovedVersion = 0;
                    deal.LegalPackage.EntrepreneurApprovedVersion = 0;
                    deal.LegalPackage.CreatorApprovedAt = null;
                    deal.LegalPackage.EntrepreneurApprovedAt = null;
                    deal.LegalPackage.ProviderReviewedVersion = 0;
                    deal.LegalPackage.ProviderReviewStatus = !string.IsNullOrEmpty(deal.LegalPackage.AssignedLegalProviderId) ? "CHANGES_REQUESTED" : "NOT_ASSIGNED";
                    deal.LegalPackage.ProviderReviewNotes = request.Feedback;
                    deal.LegalPackage.LastEditedByRole = isCreator ? "creator" : "entrepreneur";
                    deal.LegalPackage.LastEditedByUserId = userId;
                    deal.LegalPackage.Notes = request.Feedback;
                    deal.LegalPackage.Documents = GenerateLegalDocuments(
                        deal,
                        deal.LegalPackage.Version,
                        deal.LegalPackage.Jurisdiction ?? "Delaware, USA",
                        deal.LegalPackage.CompanyContext,
                        deal.LegalPackage.CompanyName
                    );
                    deal.LegalPackage.UpdatedAt = DateTime.UtcNow;
                }

                var oldVersion = deal.Version;
                deal.Version++;
                deal.UpdatedAt = DateTime.UtcNow;

                var replaceResult = await _context.DealExecutions.ReplaceOneAsync(
                    d => d.Id == deal.Id && d.Version == oldVersion,
                    deal
                );

                if (replaceResult.ModifiedCount == 0)
                {
                    return StatusCode(409, ApiResponse.Error("Conflict: Deal was updated concurrently. Please refresh and retry."));
                }

                var requesterLabel = isCreator ? "Creator" : "Entrepreneur";
                await PostMessengerEventAsync(
                    deal.ConversationId,
                    userId,
                    $"{requesterLabel} requested legal modifications from the signing screen: \"{request.Feedback}\""
                );

                var recipientId = isCreator ? deal.EntrepreneurId : deal.CreatorId;
                if (!string.IsNullOrEmpty(recipientId) && Guid.TryParse(recipientId, out var recipientGuid) && _notifications != null)
                {
                    try
                    {
                        await _notifications.NotifyUser(
                            recipientGuid,
                            "Legal Modification Requested",
                            $"{requesterLabel} requested changes to legal agreements. Deal returned to Legal Review."
                        );
                    }
                    catch { }
                }

                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, deal.LegalPackage?.Version ?? 1, userId, "signing_package_invalidated");
                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, deal.LegalPackage?.Version ?? 1, userId, "legal_change_requested_from_signing");

                var dto = await MapSigningPackageDtoAsync(deal);
                return Ok(ApiResponse.Ok("Legal change requested. Deal returned to Legal Review.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// GET /api/deals/{dealId}/signing/documents/{documentId}
        /// Retrieves document text within the signing package.
        /// </summary>
        [HttpGet("{dealId}/signing/documents/{documentId}")]
        public async Task<IActionResult> GetSigningDocument(string dealId, string documentId)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var userId = GetUserId();
                if (!IsAuthorizedLegalActor(deal, userId))
                    return StatusCode(403, ApiResponse.Error("You are not authorized to view documents for this deal."));

                var doc = deal.SigningPackage?.Documents?.FirstOrDefault(d => d.DocumentId == documentId);
                if (doc == null)
                {
                    var legalDoc = deal.LegalPackage?.Documents?.FirstOrDefault(d => d.Id == documentId);
                    if (legalDoc == null)
                        return NotFound(ApiResponse.Error("Document not found in signing package."));

                    doc = new SigningDocumentRef
                    {
                        DocumentId = legalDoc.Id,
                        DocumentType = legalDoc.DocumentType,
                        Title = legalDoc.Title,
                        RequirementType = legalDoc.RequirementType,
                        DocumentVersion = legalDoc.Version,
                        DocumentHash = legalDoc.ContentHash,
                        ContentMarkdown = legalDoc.ContentMarkdown
                    };
                }

                var dto = new SigningDocumentRefDto
                {
                    DocumentId = doc.DocumentId,
                    DocumentType = doc.DocumentType,
                    Title = doc.Title,
                    RequirementType = doc.RequirementType,
                    DocumentVersion = doc.DocumentVersion,
                    DocumentHash = doc.DocumentHash,
                    ContentMarkdown = doc.ContentMarkdown
                };

                return Ok(ApiResponse.Ok("Document loaded.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// GET /api/deals/{dealId}/signing/final-package
        /// Exposes the immutable final signed agreement package once both parties have signed.
        /// </summary>
        [HttpGet("{dealId}/signing/final-package")]
        public async Task<IActionResult> GetFinalSignedPackage(string dealId)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var userId = GetUserId();
                if (!IsAuthorizedLegalActor(deal, userId))
                    return StatusCode(403, ApiResponse.Error("You are not authorized to view the final agreement package for this deal."));

                var pkg = deal.SigningPackage;
                if (pkg == null || pkg.Status != "AGREEMENT_SIGNED" || !pkg.FinalizedAt.HasValue)
                {
                    return UnprocessableEntity(ApiResponse.Error("Agreement is not yet fully signed by both parties."));
                }

                var idea = !string.IsNullOrEmpty(deal.IdeaId)
                    ? await _context.CreatorIdeas.Find(i => i.Id == deal.IdeaId).FirstOrDefaultAsync()
                    : null;

                var dto = new FinalAgreementPackageDto
                {
                    DealId = deal.Id,
                    IdeaId = deal.IdeaId ?? "",
                    ProjectName = idea?.Project?.Name ?? "Marketplace Project",
                    ManifestHash = pkg.ManifestHash,
                    LegalPackageVersion = pkg.LegalPackageVersion,
                    Documents = pkg.Documents.Select(d => new SigningDocumentRefDto
                    {
                        DocumentId = d.DocumentId,
                        DocumentType = d.DocumentType,
                        Title = d.Title,
                        RequirementType = d.RequirementType,
                        DocumentVersion = d.DocumentVersion,
                        DocumentHash = d.DocumentHash,
                        ContentMarkdown = d.ContentMarkdown
                    }).ToList(),
                    CreatorSignature = pkg.CreatorSignature != null ? new PartySignatureDto
                    {
                        SignerUserId = pkg.CreatorSignature.SignerUserId,
                        SignerName = pkg.CreatorSignature.SignerName,
                        SignerRole = pkg.CreatorSignature.SignerRole,
                        ManifestHash = pkg.CreatorSignature.ManifestHash,
                        LegalPackageVersion = pkg.CreatorSignature.LegalPackageVersion,
                        SignedAt = pkg.CreatorSignature.SignedAt,
                        SignatureHash = pkg.CreatorSignature.SignatureHash,
                        ConsentStatement = pkg.CreatorSignature.ConsentStatement
                    } : null,
                    EntrepreneurSignature = pkg.EntrepreneurSignature != null ? new PartySignatureDto
                    {
                        SignerUserId = pkg.EntrepreneurSignature.SignerUserId,
                        SignerName = pkg.EntrepreneurSignature.SignerName,
                        SignerRole = pkg.EntrepreneurSignature.SignerRole,
                        ManifestHash = pkg.EntrepreneurSignature.ManifestHash,
                        LegalPackageVersion = pkg.EntrepreneurSignature.LegalPackageVersion,
                        SignedAt = pkg.EntrepreneurSignature.SignedAt,
                        SignatureHash = pkg.EntrepreneurSignature.SignatureHash,
                        ConsentStatement = pkg.EntrepreneurSignature.ConsentStatement
                    } : null,
                    FinalizedAt = pkg.FinalizedAt.Value,
                    AuditReference = $"deal_{deal.Id}_signed_v{pkg.LegalPackageVersion}_{pkg.ManifestHash.Substring(0, Math.Min(12, pkg.ManifestHash.Length))}",
                    Status = "AGREEMENT_SIGNED"
                };

                return Ok(ApiResponse.Ok("Final agreement package loaded.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // ==========================================
        // PHASE 7: SIGNING HELPER METHODS
        // ==========================================

        private static string? ValidateSigningEntryGate(DealExecution deal)
        {
            if (deal.DealType != "EQUITY_PARTNERSHIP")
                return "Signing is only available for EQUITY_PARTNERSHIP deals.";

            if (deal.DealStage != "SIGNATURE_PENDING" && deal.DealStage != "ACTIVATION_PENDING")
                return $"Signing is not available in stage '{deal.DealStage}'.";

            if (deal.LegalPackage == null || deal.LegalPackage.Status != "APPROVED")
                return "Legal review package must be APPROVED by both parties before proceeding to signature.";

            bool hasAssignedProvider = !string.IsNullOrWhiteSpace(deal.LegalPackage.AssignedLegalProviderId);
            if (hasAssignedProvider && (deal.LegalPackage.ProviderReviewStatus != "REVIEW_COMPLETE" || (deal.LegalPackage.ProviderReviewedVersion > 0 && deal.LegalPackage.ProviderReviewedVersion != deal.LegalPackage.Version)))
                return "A verified human Legal Service Provider review must be marked REVIEW_COMPLETE before signing.";

            if (deal.LegalPackage.CreatorApprovedVersion != deal.LegalPackage.Version ||
                deal.LegalPackage.EntrepreneurApprovedVersion != deal.LegalPackage.Version)
                return "Both Creator and Entrepreneur must approve the current version of the legal package before signing.";

            return null;
        }

        private async Task<bool> EnsureSeededSigningPackageAsync(DealExecution deal)
        {
            var legal = deal.LegalPackage;
            if (legal == null) return false;

            if (deal.SigningPackage == null || (deal.SigningPackage.Status != "AGREEMENT_SIGNED" && deal.SigningPackage.LegalPackageVersion != legal.Version))
            {
                var pkg = new AgreementSigningPackage
                {
                    DealId = deal.Id,
                    IdeaId = deal.IdeaId ?? "",
                    LegalPackageId = legal.Id,
                    LegalPackageVersion = legal.Version,
                    AcceptedOfferRevisionNumber = legal.AcceptedOfferRevisionNumber,
                    RoleAgreementVersion = legal.RoleAgreementVersion,
                    CapTableVersion = legal.CapTableVersion,
                    Jurisdiction = legal.Jurisdiction,
                    CompanyContext = legal.CompanyContext,
                    CompanyId = legal.CompanyId,
                    CompanyName = legal.CompanyName,
                    Documents = legal.Documents.Select(d => new SigningDocumentRef
                    {
                        DocumentId = d.Id,
                        DocumentType = d.DocumentType,
                        Title = d.Title,
                        RequirementType = d.RequirementType,
                        DocumentVersion = d.Version,
                        DocumentHash = d.ContentHash,
                        ContentMarkdown = d.ContentMarkdown
                    }).ToList(),
                    Status = "PENDING_SIGNATURES",
                    Version = 1,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                pkg.ManifestHash = ComputeManifestHash(pkg);
                deal.SigningPackage = pkg;
                return true;
            }

            return false;
        }

        private static string ComputeManifestHash(AgreementSigningPackage pkg)
        {
            var manifestObj = new
            {
                dealId = pkg.DealId,
                legalPackageVersion = pkg.LegalPackageVersion,
                offerRevision = pkg.AcceptedOfferRevisionNumber,
                roleAgreementVersion = pkg.RoleAgreementVersion,
                capTableVersion = pkg.CapTableVersion,
                jurisdiction = pkg.Jurisdiction ?? "",
                documents = pkg.Documents.OrderBy(d => d.DocumentId).Select(d => new
                {
                    documentId = d.DocumentId,
                    version = d.DocumentVersion,
                    sha256 = d.DocumentHash
                }).ToList()
            };

            var json = System.Text.Json.JsonSerializer.Serialize(manifestObj);
            return ComputeSha256Hash(json);
        }

        private async Task<AgreementSigningPackageDto> MapSigningPackageDtoAsync(DealExecution deal)
        {
            var pkg = deal.SigningPackage;
            if (pkg == null)
            {
                await EnsureSeededSigningPackageAsync(deal);
                pkg = deal.SigningPackage!;
            }

            var acceptedTerms = deal.EquityTerms ?? new EquityTerms();
            var creatorUser = !string.IsNullOrEmpty(deal.CreatorId) ? await _userManager.FindByIdAsync(deal.CreatorId) : null;
            var entUser = !string.IsNullOrEmpty(deal.EntrepreneurId) ? await _userManager.FindByIdAsync(deal.EntrepreneurId) : null;

            var creatorName = creatorUser != null && !string.IsNullOrWhiteSpace(creatorUser.Name) ? creatorUser.Name : (creatorUser?.UserName ?? "Creator");
            var entName = entUser != null && !string.IsNullOrWhiteSpace(entUser.Name) ? entUser.Name : (entUser?.UserName ?? "Entrepreneur");

            var idea = !string.IsNullOrEmpty(deal.IdeaId)
                ? await _context.CreatorIdeas.Find(i => i.Id == deal.IdeaId).FirstOrDefaultAsync()
                : null;

            return new AgreementSigningPackageDto
            {
                Id = pkg.Id,
                DealId = pkg.DealId,
                IdeaId = pkg.IdeaId,
                ProjectName = idea?.Project?.Name ?? "Marketplace Project",
                CreatorId = deal.CreatorId ?? "",
                CreatorName = creatorName,
                EntrepreneurId = deal.EntrepreneurId ?? "",
                EntrepreneurName = entName,
                LegalPackageId = pkg.LegalPackageId,
                LegalPackageVersion = pkg.LegalPackageVersion,
                AcceptedOfferRevisionNumber = pkg.AcceptedOfferRevisionNumber,
                RoleAgreementVersion = pkg.RoleAgreementVersion,
                CapTableVersion = pkg.CapTableVersion,
                Jurisdiction = pkg.Jurisdiction,
                CompanyContext = pkg.CompanyContext,
                CompanyId = pkg.CompanyId,
                CompanyName = pkg.CompanyName,
                Documents = pkg.Documents.Select(d => new SigningDocumentRefDto
                {
                    DocumentId = d.DocumentId,
                    DocumentType = d.DocumentType,
                    Title = d.Title,
                    RequirementType = d.RequirementType,
                    DocumentVersion = d.DocumentVersion,
                    DocumentHash = d.DocumentHash,
                    ContentMarkdown = d.ContentMarkdown
                }).ToList(),
                ManifestHash = pkg.ManifestHash,
                CreatorSignature = pkg.CreatorSignature != null ? new PartySignatureDto
                {
                    SignerUserId = pkg.CreatorSignature.SignerUserId,
                    SignerName = pkg.CreatorSignature.SignerName,
                    SignerRole = pkg.CreatorSignature.SignerRole,
                    ManifestHash = pkg.CreatorSignature.ManifestHash,
                    LegalPackageVersion = pkg.CreatorSignature.LegalPackageVersion,
                    SignedAt = pkg.CreatorSignature.SignedAt,
                    SignatureHash = pkg.CreatorSignature.SignatureHash,
                    ConsentStatement = pkg.CreatorSignature.ConsentStatement
                } : null,
                EntrepreneurSignature = pkg.EntrepreneurSignature != null ? new PartySignatureDto
                {
                    SignerUserId = pkg.EntrepreneurSignature.SignerUserId,
                    SignerName = pkg.EntrepreneurSignature.SignerName,
                    SignerRole = pkg.EntrepreneurSignature.SignerRole,
                    ManifestHash = pkg.EntrepreneurSignature.ManifestHash,
                    LegalPackageVersion = pkg.EntrepreneurSignature.LegalPackageVersion,
                    SignedAt = pkg.EntrepreneurSignature.SignedAt,
                    SignatureHash = pkg.EntrepreneurSignature.SignatureHash,
                    ConsentStatement = pkg.EntrepreneurSignature.ConsentStatement
                } : null,
                Status = pkg.Status,
                Version = pkg.Version,
                CommercialTerms = new DealCommercialSummaryDto
                {
                    EquityPercentage = acceptedTerms.EquityPercentage,
                    CreatorRole = acceptedTerms.CreatorRole,
                    CashComponent = acceptedTerms.CashComponent,
                    VestingEnabled = acceptedTerms.VestingEnabled,
                    VestingMonths = acceptedTerms.VestingMonths,
                    CliffMonths = acceptedTerms.CliffMonths,
                    AcceptedRevisionNumber = deal.AcceptedRevisionNumber ?? 1
                },
                AssignedLegalProviderName = deal.LegalPackage?.AssignedLegalProviderName,
                CreatedAt = pkg.CreatedAt,
                FinalizedAt = pkg.FinalizedAt,
                UpdatedAt = pkg.UpdatedAt
            };
        }

        // =========================================================================
        // PHASE 8: COMPANY & PROJECT ACTIVATION ENDPOINTS
        // =========================================================================

        /// <summary>
        /// GET /api/deals/{dealId}/activation
        /// Retrieves the partnership activation workspace, company status, ownership comparison, and blockers.
        /// </summary>
        [HttpGet("{dealId}/activation")]
        public async Task<IActionResult> GetDealActivation(string dealId)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var userId = GetUserId();
                if (!IsAuthorizedLegalActor(deal, userId))
                    return StatusCode(403, ApiResponse.Error("You are not authorized to view activation details for this deal."));

                var gateError = ValidateActivationEntryGate(deal);
                if (gateError != null)
                    return UnprocessableEntity(ApiResponse.Error(gateError));

                bool updated = await EnsureSeededActivationAsync(deal);
                if (updated)
                {
                    await _context.DealExecutions.ReplaceOneAsync(d => d.Id == deal.Id, deal);
                }

                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, deal.Activation?.Version ?? 1, userId, "activation_viewed");

                var dto = await MapPartnershipActivationDtoAsync(deal);
                return Ok(ApiResponse.Ok("Activation details loaded successfully.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// POST /api/deals/{dealId}/activation/start
        /// Prepares the Company setup (Case A formation or Case B link), applies signed cap table, and links documents.
        /// </summary>
        [HttpPost("{dealId}/activation/start")]
        public async Task<IActionResult> StartDealActivation(string dealId, [FromBody] StartActivationRequest? request)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var userId = GetUserId();
                if (userId != deal.CreatorId && userId != deal.EntrepreneurId)
                    return StatusCode(403, ApiResponse.Error("Only Creator or Entrepreneur principals may start company activation."));

                var gateError = ValidateActivationEntryGate(deal);
                if (gateError != null)
                    return UnprocessableEntity(ApiResponse.Error(gateError));

                // Check competing active deal race condition
                if (!string.IsNullOrEmpty(deal.IdeaId))
                {
                    var ideaDeals = await _context.DealExecutions.Find(d => d.IdeaId == deal.IdeaId).ToListAsync();
                    var competingActive = ideaDeals.FirstOrDefault(d => d.Id != deal.Id && d.DealStage == "PARTNERSHIP_ACTIVE");

                    if (competingActive != null)
                        return StatusCode(409, ApiResponse.Error("Another equity partnership for this project is already active. This deal cannot be activated."));
                }

                await EnsureSeededActivationAsync(deal);
                var act = deal.Activation!;

                var idea = !string.IsNullOrEmpty(deal.IdeaId)
                    ? await _context.CreatorIdeas.Find(i => i.Id == deal.IdeaId).FirstOrDefaultAsync()
                    : null;

                Companies? targetCompany = null;

                if (act.CompanyCase == "CASE_A_PRE_INCORPORATION")
                {
                    // Case A: Create or reuse deal company
                    if (!string.IsNullOrEmpty(act.CompanyId))
                    {
                        targetCompany = await _context.Companies.Find(c => c.Id == act.CompanyId).FirstOrDefaultAsync();
                    }

                    if (targetCompany == null && !string.IsNullOrEmpty(deal.Id))
                    {
                        targetCompany = await _context.Companies.Find(c => c.SourceDealId == deal.Id).FirstOrDefaultAsync();
                    }

                    if (targetCompany == null)
                    {
                        var companyName = !string.IsNullOrWhiteSpace(request?.CompanyName)
                            ? request.CompanyName.Trim()
                            : (!string.IsNullOrWhiteSpace(deal.LegalPackage?.CompanyName)
                                ? deal.LegalPackage.CompanyName
                                : (idea?.Project?.Name ?? "Venture Entity"));

                        targetCompany = new Companies
                        {
                            Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
                            OwnerId = deal.EntrepreneurId ?? userId,
                            SourceBusinessIdeaId = deal.IdeaId ?? "",
                            SourceDealId = deal.Id,
                            CompanyName = companyName,
                            Industry = idea?.Project?.Category ?? "Technology",
                            Tagline = idea?.Project?.Tagline ?? "",
                            CurrentPhase = 2,
                            LegalName = companyName,
                            Country = deal.LegalPackage?.Jurisdiction?.Contains("Delaware") == true ? "United States" : "France",
                            LegalStructure = deal.LegalPackage?.Jurisdiction?.Contains("Delaware") == true ? "C-Corp" : "SAS",
                            VerificationStatus = "pending",
                            TotalShares = deal.CapTableDraft?.TotalShares ?? 10_000_000,
                            EsopPoolPercent = deal.CapTableDraft?.EsopPoolPercent ?? 0,
                            EsopVestingMonths = deal.CapTableDraft?.EsopVestingMonths ?? 48,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };

                        // Populate equity structure
                        ApplyCapTableToCompany(deal, targetCompany);

                        // Populate documents
                        LinkDocumentsToCompany(deal, targetCompany);

                        await _context.Companies.InsertOneAsync(targetCompany);
                        await LogAuditAsync(deal.IdeaId ?? "", deal.Id, act.Version, userId, "company_created_for_deal");
                    }
                    else
                    {
                        // Existing company reused
                        ApplyCapTableToCompany(deal, targetCompany);
                        LinkDocumentsToCompany(deal, targetCompany);
                        targetCompany.UpdatedAt = DateTime.UtcNow;
                        await _context.Companies.ReplaceOneAsync(c => c.Id == targetCompany.Id, targetCompany);
                    }

                    act.CompanyId = targetCompany.Id;
                    act.CompanyName = targetCompany.CompanyName;
                    deal.CompanyId = targetCompany.Id;
                }
                else
                {
                    // Case B: Existing company
                    var targetCompanyId = act.CompanyId ?? deal.LegalPackage?.CompanyId ?? deal.CompanyId;
                    if (string.IsNullOrEmpty(targetCompanyId))
                        return UnprocessableEntity(ApiResponse.Error("Case B requires an existing Company ID from the legal package."));

                    targetCompany = await _context.Companies.Find(c => c.Id == targetCompanyId).FirstOrDefaultAsync();
                    if (targetCompany == null)
                        return NotFound(ApiResponse.Error("Existing company specified in the deal could not be found."));

                    if (targetCompany.OwnerId != deal.EntrepreneurId)
                        return StatusCode(403, ApiResponse.Error("The specified company is not owned by the entrepreneur in this deal."));

                    targetCompany.SourceBusinessIdeaId = deal.IdeaId ?? targetCompany.SourceBusinessIdeaId;
                    targetCompany.SourceDealId = deal.Id;

                    ApplyCapTableToCompany(deal, targetCompany);
                    LinkDocumentsToCompany(deal, targetCompany);
                    targetCompany.UpdatedAt = DateTime.UtcNow;

                    await _context.Companies.ReplaceOneAsync(c => c.Id == targetCompany.Id, targetCompany);
                    await LogAuditAsync(deal.IdeaId ?? "", deal.Id, act.Version, userId, "existing_company_linked");

                    act.CompanyId = targetCompany.Id;
                    act.CompanyName = targetCompany.CompanyName;
                    deal.CompanyId = targetCompany.Id;
                }

                // Update activation state
                act.AppliedCapTableEntries = deal.CapTableDraft?.Entries ?? new List<DealCapTableEntry>();
                act.CreatorShareholderId = deal.CreatorId;
                act.EntrepreneurShareholderId = deal.EntrepreneurId;
                act.LinkedDocuments = (deal.SigningPackage?.Documents ?? new List<SigningDocumentRef>()).Select(d => new ActivatedDocumentRef
                {
                    DocumentId = d.DocumentId,
                    DocumentType = d.DocumentType,
                    Title = d.Title,
                    Version = d.DocumentVersion,
                    DocumentHash = d.DocumentHash,
                    LinkedAt = DateTime.UtcNow
                }).ToList();

                act.StartedAt ??= DateTime.UtcNow;
                act.Status = "READY_TO_ACTIVATE";
                act.UpdatedAt = DateTime.UtcNow;
                deal.UpdatedAt = DateTime.UtcNow;

                await _context.DealExecutions.ReplaceOneAsync(d => d.Id == deal.Id, deal);

                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, act.Version, userId, "activation_started");
                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, act.Version, userId, "cap_table_applied");
                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, act.Version, userId, "creator_shareholder_recorded");
                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, act.Version, userId, "company_documents_linked");

                if (!string.IsNullOrEmpty(deal.ConversationId))
                {
                    await PostMessengerEventAsync(deal.ConversationId, userId, "Company activation initialized. Ownership structure and legal documents linked to company record.");
                }

                var dto = await MapPartnershipActivationDtoAsync(deal);
                return Ok(ApiResponse.Ok("Company setup and ownership recorded successfully.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        /// <summary>
        /// POST /api/deals/{dealId}/activation/complete
        /// Atomically completes partnership activation, updates deal stage to PARTNERSHIP_ACTIVE, marks project CO_FOUNDED, and closes marketplace listing.
        /// </summary>
        [HttpPost("{dealId}/activation/complete")]
        public async Task<IActionResult> CompleteDealActivation(string dealId, [FromBody] CompleteActivationRequest? request)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var userId = GetUserId();
                if (userId != deal.CreatorId && userId != deal.EntrepreneurId)
                    return StatusCode(403, ApiResponse.Error("Only Creator or Entrepreneur principals may complete partnership activation."));

                // Idempotent return if already activated
                if (deal.DealStage == "PARTNERSHIP_ACTIVE" && deal.Activation?.Status == "PARTNERSHIP_ACTIVE")
                {
                    var existingDto = await MapPartnershipActivationDtoAsync(deal);
                    return Ok(ApiResponse.Ok("Partnership is already active.", existingDto));
                }

                var gateError = ValidateActivationEntryGate(deal);
                if (gateError != null)
                    return UnprocessableEntity(ApiResponse.Error(gateError));

                // Competing deal race protection
                if (!string.IsNullOrEmpty(deal.IdeaId))
                {
                    var ideaDeals = await _context.DealExecutions.Find(d => d.IdeaId == deal.IdeaId).ToListAsync();
                    var competingActive = ideaDeals.FirstOrDefault(d => d.Id != deal.Id && d.DealStage == "PARTNERSHIP_ACTIVE");

                    if (competingActive != null)
                        return StatusCode(409, ApiResponse.Error("Another equity partnership for this project has already been activated."));
                }

                await EnsureSeededActivationAsync(deal);
                var act = deal.Activation!;

                var company = !string.IsNullOrEmpty(act.CompanyId)
                    ? await _context.Companies.Find(c => c.Id == act.CompanyId).FirstOrDefaultAsync()
                    : null;

                var (canActivate, blockers) = ComputeActivationReadiness(deal, act, company, false);
                if (!canActivate)
                {
                    return UnprocessableEntity(ApiResponse.Error($"Cannot activate partnership: {string.Join("; ", blockers)}"));
                }

                // Execute atomic activation
                deal.DealStage = "PARTNERSHIP_ACTIVE";
                deal.Status = "completed";
                act.Status = "PARTNERSHIP_ACTIVE";
                act.CompletedAt = DateTime.UtcNow;
                deal.ClosedAt = DateTime.UtcNow;
                deal.UpdatedAt = DateTime.UtcNow;

                await _context.DealExecutions.ReplaceOneAsync(d => d.Id == deal.Id, deal);

                // Update CreatorIdea & close marketplace listing
                if (!string.IsNullOrEmpty(deal.IdeaId))
                {
                    var idea = await _context.CreatorIdeas.Find(i => i.Id == deal.IdeaId).FirstOrDefaultAsync();
                    if (idea != null)
                    {
                        idea.ProjectOutcome = "CO_FOUNDED";
                        idea.ActivePartnershipDealId = deal.Id;
                        idea.CompanyId = act.CompanyId;

                        if (idea.Phase5Data?.PathA?.MarketplaceListing != null)
                        {
                            idea.Phase5Data.PathA.MarketplaceListing.Status = "closed";
                            idea.Phase5Data.PathA.MarketplaceListing.OpenToPurchase = false;
                            idea.Phase5Data.PathA.MarketplaceListing.OpenToEquityPartnership = false;
                        }

                        idea.UpdatedAt = DateTime.UtcNow;
                        await _context.CreatorIdeas.ReplaceOneAsync(i => i.Id == idea.Id, idea);
                    }

                    // Close any other open/competing deals for this idea
                    var otherDeals = (await _context.DealExecutions.Find(d => d.IdeaId == deal.IdeaId).ToListAsync())
                        .Where(d =>
                            d.Id != deal.Id &&
                            d.DealStage != "PARTNERSHIP_ACTIVE" &&
                            d.DealStage != "CLOSED" &&
                            d.DealStage != "REJECTED" &&
                            d.DealStage != "WITHDRAWN"
                        ).ToList();

                    foreach (var od in otherDeals)
                    {
                        od.DealStage = "CLOSED";
                        od.Status = "project_unavailable";
                        od.ClosedAt = DateTime.UtcNow;
                        od.UpdatedAt = DateTime.UtcNow;
                        await _context.DealExecutions.ReplaceOneAsync(d => d.Id == od.Id, od);
                    }

                    // Close any competing pending ProjectInterests
                    var competingInterests = await _context.ProjectInterests.Find(pi => pi.IdeaId == deal.IdeaId).ToListAsync();
                    foreach (var ci in competingInterests)
                    {
                        if (ci.Id.ToString() != deal.ProjectInterestId && ci.Status != "declined" && ci.Status != "closed")
                        {
                            ci.Status = "closed";
                            await _context.ProjectInterests.ReplaceOneAsync(pi => pi.Id == ci.Id, ci);
                            await LogAuditAsync(deal.IdeaId, deal.Id, act.Version, userId, "competing_interest_closed_after_cofounded");
                        }
                    }
                }

                // Messenger & Notifications
                if (!string.IsNullOrEmpty(deal.ConversationId))
                {
                    await PostMessengerEventAsync(deal.ConversationId, userId, "Partnership activated! The project is now co-founded and the venture workspace is active.");
                }

                if (!string.IsNullOrEmpty(deal.CreatorId) && _notifications != null && Guid.TryParse(deal.CreatorId, out var creatorGuid))
                {
                    await _notifications.CreateNotification(
                        creatorGuid,
                        "Partnership Activated!",
                        $"Partnership is now active for {deal.LegalPackage?.CompanyName ?? "your project"}. Co-founder ownership structure recorded."
                    );
                }

                if (!string.IsNullOrEmpty(deal.EntrepreneurId) && _notifications != null && Guid.TryParse(deal.EntrepreneurId, out var entGuid))
                {
                    await _notifications.CreateNotification(
                        entGuid,
                        "Partnership Activated!",
                        $"Partnership is now active for {deal.LegalPackage?.CompanyName ?? "your venture"}. Co-founder ownership structure recorded."
                    );
                }

                // Audit logs
                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, act.Version, userId, "activation_completed");
                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, act.Version, userId, "project_cofounded");
                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, act.Version, userId, "marketplace_listing_closed");

                var dto = await MapPartnershipActivationDtoAsync(deal);
                return Ok(ApiResponse.Ok("Partnership successfully activated! The project is now CO_FOUNDED.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext?.TraceIdentifier)); }
        }

        /// <summary>
        /// POST /api/deals/{dealId}/activation/filing-status
        /// Allows assigned Legal Provider or Entrepreneur to update corporate filing status.
        /// </summary>
        [HttpPost("{dealId}/activation/filing-status")]
        public async Task<IActionResult> UpdateCorporateFilingStatus(string dealId, [FromBody] UpdateCorporateFilingRequest request)
        {
            try
            {
                var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
                if (deal == null) return NotFound(ApiResponse.Error("Deal not found."));

                var userId = GetUserId();
                var isLegalProvider = deal.LegalPackage?.AssignedLegalProviderId == userId;
                var isEntrepreneur = deal.EntrepreneurId == userId;

                if (!isLegalProvider && !isEntrepreneur)
                    return StatusCode(403, ApiResponse.Error("Only the assigned Legal Provider or Entrepreneur may update corporate filing status."));

                await EnsureSeededActivationAsync(deal);
                deal.Activation!.CorporateFilingStatus = request.FilingStatus;
                deal.Activation.CorporateFilingNotes = request.Notes;
                deal.Activation.UpdatedAt = DateTime.UtcNow;
                deal.UpdatedAt = DateTime.UtcNow;

                await _context.DealExecutions.ReplaceOneAsync(d => d.Id == deal.Id, deal);
                await LogAuditAsync(deal.IdeaId ?? "", deal.Id, deal.Activation.Version, userId, "corporate_filing_status_updated");

                var dto = await MapPartnershipActivationDtoAsync(deal);
                return Ok(ApiResponse.Ok("Corporate filing status updated.", dto));
            }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, ApiResponse.Error(ex.Message)); }
            catch (Exception ex) { return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier)); }
        }

        // ==========================================
        // PHASE 8: ACTIVATION HELPER METHODS
        // ==========================================

        private static string? ValidateActivationEntryGate(DealExecution deal)
        {
            if (deal.DealType != "EQUITY_PARTNERSHIP")
                return "Activation is only available for EQUITY_PARTNERSHIP deals.";

            if (deal.DealStage != "ACTIVATION_PENDING" && deal.DealStage != "PARTNERSHIP_ACTIVE")
                return $"Activation is not available in stage '{deal.DealStage}'. DealStage must be 'ACTIVATION_PENDING'.";

            if (deal.SigningPackage == null || (deal.SigningPackage.Status != "AGREEMENT_SIGNED" && deal.DealStage != "PARTNERSHIP_ACTIVE"))
                return "SigningPackage status must be AGREEMENT_SIGNED before activation.";

            if (deal.SigningPackage.CreatorSignature == null || deal.SigningPackage.EntrepreneurSignature == null)
                return "Both Creator and Entrepreneur electronic signatures are required.";

            if (deal.SigningPackage.CreatorSignature.ManifestHash != deal.SigningPackage.EntrepreneurSignature.ManifestHash)
                return "Signatures reference different manifest hashes. Both parties must sign the exact same manifest.";

            if (deal.SigningPackage.CreatorSignature.LegalPackageVersion != deal.SigningPackage.EntrepreneurSignature.LegalPackageVersion)
                return "Signatures reference different legal package versions.";

            if (deal.RoleAgreement == null || deal.RoleAgreement.Status != "CONFIRMED")
                return "Role & Responsibility Agreement must be CONFIRMED.";

            if (deal.CapTableDraft == null || deal.CapTableDraft.Status != "APPROVED")
                return "Cap Table Draft must be APPROVED.";

            return null;
        }

        private async Task<bool> EnsureSeededActivationAsync(DealExecution deal)
        {
            var companyCase = deal.LegalPackage?.CompanyContext ?? "CASE_A_PRE_INCORPORATION";

            if (deal.Activation == null)
            {
                var act = new PartnershipActivation
                {
                    DealId = deal.Id,
                    IdeaId = deal.IdeaId ?? "",
                    CompanyCase = companyCase,
                    CompanyId = deal.LegalPackage?.CompanyId ?? deal.CompanyId,
                    CompanyName = deal.LegalPackage?.CompanyName ?? "Venture Entity",
                    SignedManifestHash = deal.SigningPackage?.ManifestHash ?? "",
                    AppliedLegalPackageVersion = deal.SigningPackage?.LegalPackageVersion ?? 1,
                    AppliedOfferRevisionNumber = deal.AcceptedRevisionNumber ?? 1,
                    AppliedRoleAgreementVersion = deal.RoleAgreement?.Version ?? 1,
                    AppliedCapTableVersion = deal.CapTableDraft?.Version ?? 1,
                    Status = "ACTIVATION_PENDING",
                    CorporateFilingStatus = "NOT_REQUIRED",
                    Version = 1,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                deal.Activation = act;
                return true;
            }

            return false;
        }

        private static (bool canActivate, List<string> blockers) ComputeActivationReadiness(
            DealExecution deal,
            PartnershipActivation activation,
            Companies? company,
            bool hasCompetingActiveDeal)
        {
            var blockers = new List<string>();

            if (hasCompetingActiveDeal)
            {
                blockers.Add("Another equity partnership for this project is already active.");
            }

            if (deal.SigningPackage == null || (deal.SigningPackage.Status != "AGREEMENT_SIGNED" && deal.DealStage != "PARTNERSHIP_ACTIVE"))
            {
                blockers.Add("Agreement signing package is not fully executed.");
            }

            if (deal.SigningPackage?.CreatorSignature == null || deal.SigningPackage?.EntrepreneurSignature == null)
            {
                blockers.Add("Missing principal electronic signatures.");
            }

            if (company == null && activation.Status != "READY_TO_ACTIVATE" && activation.Status != "PARTNERSHIP_ACTIVE")
            {
                blockers.Add("Company workspace setup has not been initialized.");
            }

            if (activation.CorporateFilingStatus == "EXTERNAL_FILING_PENDING")
            {
                blockers.Add("External corporate filing is pending verification.");
            }

            return (blockers.Count == 0, blockers);
        }

        private static void ApplyCapTableToCompany(DealExecution deal, Companies company)
        {
            var capTable = deal.CapTableDraft;
            if (capTable == null) return;

            company.TotalShares = capTable.TotalShares;
            company.EsopPoolPercent = capTable.EsopPoolPercent;
            company.EsopVestingMonths = capTable.EsopVestingMonths;

            var entries = new List<EquityEntryDto>();

            foreach (var entry in capTable.Entries)
            {
                entries.Add(new EquityEntryDto
                {
                    StakeholderName = entry.DisplayName,
                    Type = entry.IsCreator || entry.IsFounder ? "founder" : "investor",
                    SharesOwned = entry.SharesGranted,
                    VestingMonths = entry.IsCreator ? (deal.EquityTerms?.VestingMonths ?? 48) : null,
                    InvestmentAmount = null
                });
            }

            if (capTable.EsopPoolPercent > 0)
            {
                entries.Add(new EquityEntryDto
                {
                    StakeholderName = "ESOP Pool",
                    Type = "esop",
                    SharesOwned = (int)Math.Round(capTable.TotalShares * (capTable.EsopPoolPercent / 100.0)),
                    VestingMonths = capTable.EsopVestingMonths
                });
            }

            if (capTable.InvestorReservePercent > 0)
            {
                entries.Add(new EquityEntryDto
                {
                    StakeholderName = "Investor Reserve",
                    Type = "investor",
                    SharesOwned = (int)Math.Round(capTable.TotalShares * (capTable.InvestorReservePercent / 100.0))
                });
            }

            company.EquityStructure = entries;
        }

        private static void LinkDocumentsToCompany(DealExecution deal, Companies company)
        {
            var signingDocs = deal.SigningPackage?.Documents ?? new List<SigningDocumentRef>();
            company.Documents ??= new List<CompanyDocument>();

            foreach (var doc in signingDocs)
            {
                if (!company.Documents.Any(d => d.DocType == doc.DocumentType && d.ReviewNote == doc.DocumentHash))
                {
                    company.Documents.Add(new CompanyDocument
                    {
                        DocType = doc.DocumentType,
                        FileName = $"{doc.DocumentType.ToLower()}_v{doc.DocumentVersion}.md",
                        Status = "approved",
                        UploadedAt = DateTime.UtcNow,
                        ReviewedAt = DateTime.UtcNow,
                        ReviewNote = doc.DocumentHash
                    });
                }
            }
        }

        private async Task<PartnershipActivationDto> MapPartnershipActivationDtoAsync(DealExecution deal)
        {
            var act = deal.Activation;
            if (act == null)
            {
                await EnsureSeededActivationAsync(deal);
                act = deal.Activation!;
            }

            var creatorUser = !string.IsNullOrEmpty(deal.CreatorId) ? await _userManager.FindByIdAsync(deal.CreatorId) : null;
            var entUser = !string.IsNullOrEmpty(deal.EntrepreneurId) ? await _userManager.FindByIdAsync(deal.EntrepreneurId) : null;

            var creatorName = creatorUser != null && !string.IsNullOrWhiteSpace(creatorUser.Name) ? creatorUser.Name : (creatorUser?.UserName ?? "Creator");
            var entName = entUser != null && !string.IsNullOrWhiteSpace(entUser.Name) ? entUser.Name : (entUser?.UserName ?? "Entrepreneur");

            var idea = !string.IsNullOrEmpty(deal.IdeaId)
                ? await _context.CreatorIdeas.Find(i => i.Id == deal.IdeaId).FirstOrDefaultAsync()
                : null;

            Companies? company = null;
            if (!string.IsNullOrEmpty(act.CompanyId))
            {
                company = await _context.Companies.Find(c => c.Id == act.CompanyId).FirstOrDefaultAsync();
            }

            bool hasCompetingActive = false;
            if (!string.IsNullOrEmpty(deal.IdeaId))
            {
                var ideaDeals = await _context.DealExecutions.Find(d => d.IdeaId == deal.IdeaId).ToListAsync();
                hasCompetingActive = ideaDeals.Any(d => d.Id != deal.Id && d.DealStage == "PARTNERSHIP_ACTIVE");
            }

            var (canActivate, blockers) = ComputeActivationReadiness(deal, act, company, hasCompetingActive);

            var acceptedTerms = deal.EquityTerms ?? new EquityTerms();

            var ownershipComp = BuildOwnershipComparisonDto(deal, company, creatorName, entName);

            return new PartnershipActivationDto
            {
                Id = act.Id,
                DealId = act.DealId,
                IdeaId = act.IdeaId,
                ProjectName = idea?.Project?.Name ?? "Marketplace Project",
                CreatorId = deal.CreatorId ?? "",
                CreatorName = creatorName,
                EntrepreneurId = deal.EntrepreneurId ?? "",
                EntrepreneurName = entName,
                CompanyId = act.CompanyId,
                CompanyName = act.CompanyName ?? company?.CompanyName ?? deal.LegalPackage?.CompanyName ?? "Venture Entity",
                CompanyCase = act.CompanyCase,
                Status = act.Status,
                SignedManifestHash = act.SignedManifestHash,
                AppliedLegalPackageVersion = act.AppliedLegalPackageVersion,
                AppliedOfferRevisionNumber = act.AppliedOfferRevisionNumber,
                AppliedRoleAgreementVersion = act.AppliedRoleAgreementVersion,
                AppliedCapTableVersion = act.AppliedCapTableVersion,
                CreatorShareholderId = act.CreatorShareholderId,
                EntrepreneurShareholderId = act.EntrepreneurShareholderId,
                CorporateFilingStatus = act.CorporateFilingStatus,
                CorporateFilingNotes = act.CorporateFilingNotes,
                CanActivate = canActivate,
                Blockers = blockers,
                LinkedDocuments = act.LinkedDocuments.Select(d => new ActivatedDocumentRefDto
                {
                    DocumentId = d.DocumentId,
                    DocumentType = d.DocumentType,
                    Title = d.Title,
                    Version = d.Version,
                    DocumentHash = d.DocumentHash,
                    LinkedAt = d.LinkedAt
                }).ToList(),
                OwnershipComparison = ownershipComp,
                CommercialTerms = new DealCommercialSummaryDto
                {
                    EquityPercentage = acceptedTerms.EquityPercentage,
                    CreatorRole = acceptedTerms.CreatorRole,
                    CashComponent = acceptedTerms.CashComponent,
                    VestingEnabled = acceptedTerms.VestingEnabled,
                    VestingMonths = acceptedTerms.VestingMonths,
                    CliffMonths = acceptedTerms.CliffMonths,
                    AcceptedRevisionNumber = deal.AcceptedRevisionNumber ?? 1
                },
                StartedAt = act.StartedAt,
                CompletedAt = act.CompletedAt,
                Version = act.Version,
                CreatedAt = act.CreatedAt,
                UpdatedAt = act.UpdatedAt
            };
        }

        private static OwnershipComparisonDto BuildOwnershipComparisonDto(
            DealExecution deal,
            Companies? company,
            string creatorName,
            string entName)
        {
            var capTable = deal.CapTableDraft;
            var totalShares = capTable?.TotalShares ?? 10_000_000;
            var entries = new List<OwnershipEntryComparisonDto>();

            var creatorSignedEntry = capTable?.Entries.FirstOrDefault(e => e.IsCreator);
            var entSignedEntry = capTable?.Entries.FirstOrDefault(e => e.IsFounder);

            double prevEntPercent = company != null && company.EquityStructure.Count > 0
                ? (company.EquityStructure.FirstOrDefault(e => e.Type == "founder")?.SharesOwned ?? totalShares) / (double)totalShares * 100.0
                : 100.0;

            // Entrepreneur entry
            entries.Add(new OwnershipEntryComparisonDto
            {
                UserId = deal.EntrepreneurId ?? "",
                DisplayName = entName,
                RoleTitle = "Founder & CEO",
                Type = "founder",
                PreviousEquityPercent = Math.Round(prevEntPercent, 2),
                SignedEquityPercent = entSignedEntry?.EquityPercent ?? (100 - (deal.EquityTerms?.EquityPercentage ?? 15)),
                PreviousShares = (int)Math.Round(totalShares * (prevEntPercent / 100.0)),
                SignedShares = entSignedEntry?.SharesGranted ?? (int)Math.Round(totalShares * ((100 - (deal.EquityTerms?.EquityPercentage ?? 15)) / 100.0)),
                VestingMonths = 0,
                CliffMonths = 0,
                IsCreator = false,
                IsFounder = true
            });

            // Creator entry
            entries.Add(new OwnershipEntryComparisonDto
            {
                UserId = deal.CreatorId ?? "",
                DisplayName = creatorName,
                RoleTitle = deal.EquityTerms?.CreatorRole ?? "Co-founder",
                Type = "founder",
                PreviousEquityPercent = 0.0,
                SignedEquityPercent = creatorSignedEntry?.EquityPercent ?? (deal.EquityTerms?.EquityPercentage ?? 15),
                PreviousShares = 0,
                SignedShares = creatorSignedEntry?.SharesGranted ?? (int)Math.Round(totalShares * ((deal.EquityTerms?.EquityPercentage ?? 15) / 100.0)),
                VestingMonths = deal.EquityTerms?.VestingMonths ?? 48,
                CliffMonths = deal.EquityTerms?.CliffMonths ?? 12,
                IsCreator = true,
                IsFounder = false
            });

            return new OwnershipComparisonDto
            {
                Entries = entries,
                EsopPoolPercent = capTable?.EsopPoolPercent ?? 0,
                InvestorReservePercent = capTable?.InvestorReservePercent ?? 0,
                TotalShares = totalShares,
                Notice = "Platform ownership record"
            };
        }

        // =========================================================================
        // PHASE 9: SCREEN 07 — PARTNERSHIP ACTIVE & MY EQUITY ENDPOINTS
        // =========================================================================

        /// <summary>
        /// GET /api/partnerships
        /// Lists all active partnerships for the authenticated user (Creator or Entrepreneur).
        /// </summary>
        [HttpGet("/api/partnerships")]
        [HttpGet("/api/creator/partnerships")]
        [HttpGet("partnerships")]
        public async Task<IActionResult> GetMyPartnerships()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new ApiResponse { Success = false, Message = "Authentication required." });

            var allDeals = await _context.DealExecutions.Find(d => d.CreatorId == userId || d.EntrepreneurId == userId).ToListAsync();
            var activeDeals = allDeals.Where(d => d.DealType == "EQUITY_PARTNERSHIP" && d.DealStage == "PARTNERSHIP_ACTIVE").ToList();

            var list = new List<PartnershipSummaryDto>();
            foreach (var deal in activeDeals)
            {
                var summary = await BuildPartnershipSummaryDto(deal);
                list.Add(summary);
            }

            return Ok(new ApiResponse
            {
                Success = true,
                Message = "Partnerships retrieved successfully.",
                Data = list
            });
        }

        /// <summary>
        /// GET /api/partnerships/{dealId}
        /// Retrieves full active partnership details for Screen 07.
        /// </summary>
        [HttpGet("/api/partnerships/{dealId}")]
        [HttpGet("{dealId}/partnership")]
        public async Task<IActionResult> GetPartnershipActiveDetails(string dealId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new ApiResponse { Success = false, Message = "Authentication required." });

            var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
            if (deal == null)
                return NotFound(new ApiResponse { Success = false, Message = "Deal not found." });

            var isCreator = deal.CreatorId == userId;
            var isEntrepreneur = deal.EntrepreneurId == userId;
            var isAdmin = User.IsInRole("Admin");

            if (!isCreator && !isEntrepreneur && !isAdmin)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new ApiResponse
                {
                    Success = false,
                    Message = "Access forbidden. You are not a party to this partnership."
                });
            }

            if (deal.DealType != "EQUITY_PARTNERSHIP")
            {
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = "Partnership screen is only available for Equity Partnerships."
                });
            }

            if (deal.DealStage != "PARTNERSHIP_ACTIVE")
            {
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = "Partnership is not active yet. Current stage: " + deal.DealStage
                });
            }

            var details = await BuildPartnershipActiveDetailsDto(deal, userId);
            return Ok(new ApiResponse
            {
                Success = true,
                Message = "Partnership active details retrieved successfully.",
                Data = details
            });
        }

        /// <summary>
        /// GET /api/partnerships/{dealId}/equity
        /// Retrieves dedicated 'My Equity' details for Screen 07.
        /// </summary>
        [HttpGet("/api/partnerships/{dealId}/equity")]
        [HttpGet("{dealId}/partnership/equity")]
        public async Task<IActionResult> GetPartnershipEquityDetails(string dealId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new ApiResponse { Success = false, Message = "Authentication required." });

            var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
            if (deal == null)
                return NotFound(new ApiResponse { Success = false, Message = "Deal not found." });

            var isCreator = deal.CreatorId == userId;
            var isEntrepreneur = deal.EntrepreneurId == userId;
            var isAdmin = User.IsInRole("Admin");

            if (!isCreator && !isEntrepreneur && !isAdmin)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new ApiResponse
                {
                    Success = false,
                    Message = "Access forbidden. You are not a party to this partnership."
                });
            }

            if (deal.DealType != "EQUITY_PARTNERSHIP" || deal.DealStage != "PARTNERSHIP_ACTIVE")
            {
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = "Deal is not in an active equity partnership state."
                });
            }

            var equity = await BuildPartnershipEquityDetailsDto(deal, userId);
            return Ok(new ApiResponse
            {
                Success = true,
                Message = "Equity details retrieved successfully.",
                Data = equity
            });
        }

        /// <summary>
        /// GET /api/partnerships/{dealId}/documents
        /// Retrieves linked documents for the active partnership.
        /// </summary>
        [HttpGet("/api/partnerships/{dealId}/documents")]
        [HttpGet("{dealId}/partnership/documents")]
        public async Task<IActionResult> GetPartnershipDocuments(string dealId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new ApiResponse { Success = false, Message = "Authentication required." });

            var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
            if (deal == null)
                return NotFound(new ApiResponse { Success = false, Message = "Deal not found." });

            var isCreator = deal.CreatorId == userId;
            var isEntrepreneur = deal.EntrepreneurId == userId;
            var isAdmin = User.IsInRole("Admin");

            if (!isCreator && !isEntrepreneur && !isAdmin)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new ApiResponse
                {
                    Success = false,
                    Message = "Access forbidden."
                });
            }

            var docs = deal.Activation?.LinkedDocuments.Select(d => new ActivatedDocumentRefDto
            {
                DocumentId = d.DocumentId,
                DocumentType = d.DocumentType,
                Title = d.Title,
                Version = d.Version,
                DocumentHash = d.DocumentHash,
                LinkedAt = d.LinkedAt
            }).ToList() ?? new List<ActivatedDocumentRefDto>();

            return Ok(new ApiResponse
            {
                Success = true,
                Message = "Partnership documents retrieved successfully.",
                Data = docs
            });
        }

        /// <summary>
        /// GET /api/partnerships/{dealId}/milestones
        /// Retrieves milestones for the active partnership.
        /// </summary>
        [HttpGet("/api/partnerships/{dealId}/milestones")]
        [HttpGet("{dealId}/partnership/milestones")]
        public async Task<IActionResult> GetPartnershipMilestones(string dealId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new ApiResponse { Success = false, Message = "Authentication required." });

            var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
            if (deal == null)
                return NotFound(new ApiResponse { Success = false, Message = "Deal not found." });

            var isCreator = deal.CreatorId == userId;
            var isEntrepreneur = deal.EntrepreneurId == userId;
            var isAdmin = User.IsInRole("Admin");

            if (!isCreator && !isEntrepreneur && !isAdmin)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new ApiResponse
                {
                    Success = false,
                    Message = "Access forbidden."
                });
            }

            var milestones = (deal.Activation?.Milestones ?? new List<PartnershipMilestone>())
                .Select(m => MapMilestoneToDto(m))
                .ToList();

            return Ok(new ApiResponse
            {
                Success = true,
                Message = "Milestones retrieved successfully.",
                Data = milestones
            });
        }

        /// <summary>
        /// POST /api/partnerships/{dealId}/milestones
        /// Creates a milestone in the active partnership.
        /// </summary>
        [HttpPost("/api/partnerships/{dealId}/milestones")]
        [HttpPost("{dealId}/partnership/milestones")]
        public async Task<IActionResult> CreatePartnershipMilestone(string dealId, [FromBody] CreatePartnershipMilestoneRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new ApiResponse { Success = false, Message = "Authentication required." });

            var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
            if (deal == null)
                return NotFound(new ApiResponse { Success = false, Message = "Deal not found." });

            var isCreator = deal.CreatorId == userId;
            var isEntrepreneur = deal.EntrepreneurId == userId;
            var isAdmin = User.IsInRole("Admin");

            if (!isCreator && !isEntrepreneur && !isAdmin)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new ApiResponse
                {
                    Success = false,
                    Message = "Access forbidden."
                });
            }

            if (deal.DealType != "EQUITY_PARTNERSHIP" || deal.DealStage != "PARTNERSHIP_ACTIVE")
            {
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = "Milestones can only be added to active partnerships."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Title))
            {
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = "Milestone title is required."
                });
            }

            deal.Activation ??= new PartnershipActivation { DealId = deal.Id, IdeaId = deal.IdeaId ?? "" };

            var userName = isCreator ? "Creator" : (isEntrepreneur ? "Entrepreneur" : "Admin");
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user != null) userName = user.Name ?? user.UserName ?? userName;
            }
            catch { }

            var milestone = new PartnershipMilestone
            {
                Id = Guid.NewGuid().ToString("N"),
                DealId = deal.Id,
                IdeaId = deal.IdeaId ?? "",
                CompanyId = deal.Activation.CompanyId,
                Title = request.Title.Trim(),
                Description = request.Description?.Trim() ?? "",
                DueDate = request.DueDate,
                Status = "NOT_STARTED",
                CreatedByUserId = userId,
                CreatedByName = userName,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            deal.Activation.Milestones.Add(milestone);
            deal.UpdatedAt = DateTime.UtcNow;

            await _context.DealExecutions.ReplaceOneAsync(d => d.Id == deal.Id, deal);

            // Notify partner
            var partnerId = isCreator ? deal.EntrepreneurId : deal.CreatorId;
            if (_notifications != null && !string.IsNullOrEmpty(partnerId) && Guid.TryParse(partnerId, out var partnerGuid))
            {
                try
                {
                    await _notifications.CreateNotification(
                        partnerGuid,
                        "New Partnership Milestone",
                        $"{userName} created a new milestone: '{milestone.Title}'."
                    );
                }
                catch { }
            }

            return Ok(new ApiResponse
            {
                Success = true,
                Message = "Milestone created successfully.",
                Data = MapMilestoneToDto(milestone)
            });
        }

        /// <summary>
        /// PUT /api/partnerships/{dealId}/milestones/{milestoneId}
        /// Updates a milestone in the active partnership.
        /// </summary>
        [HttpPut("/api/partnerships/{dealId}/milestones/{milestoneId}")]
        [HttpPut("{dealId}/partnership/milestones/{milestoneId}")]
        public async Task<IActionResult> UpdatePartnershipMilestone(
            string dealId,
            string milestoneId,
            [FromBody] UpdatePartnershipMilestoneRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new ApiResponse { Success = false, Message = "Authentication required." });

            var deal = await _context.DealExecutions.Find(d => d.Id == dealId).FirstOrDefaultAsync();
            if (deal == null)
                return NotFound(new ApiResponse { Success = false, Message = "Deal not found." });

            var isCreator = deal.CreatorId == userId;
            var isEntrepreneur = deal.EntrepreneurId == userId;
            var isAdmin = User.IsInRole("Admin");

            if (!isCreator && !isEntrepreneur && !isAdmin)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new ApiResponse
                {
                    Success = false,
                    Message = "Access forbidden."
                });
            }

            var milestone = deal.Activation?.Milestones.FirstOrDefault(m => m.Id == milestoneId);
            if (milestone == null)
            {
                return NotFound(new ApiResponse
                {
                    Success = false,
                    Message = "Milestone not found."
                });
            }

            if (!string.IsNullOrWhiteSpace(request.Title))
                milestone.Title = request.Title.Trim();

            if (request.Description != null)
                milestone.Description = request.Description.Trim();

            if (request.DueDate.HasValue)
                milestone.DueDate = request.DueDate;

            if (!string.IsNullOrWhiteSpace(request.Status))
            {
                var newStatus = request.Status.Trim().ToUpperInvariant();
                if (newStatus is "NOT_STARTED" or "IN_PROGRESS" or "COMPLETED")
                {
                    milestone.Status = newStatus;
                    if (newStatus == "COMPLETED" && milestone.CompletedAt == null)
                        milestone.CompletedAt = DateTime.UtcNow;
                }
            }

            milestone.UpdatedAt = DateTime.UtcNow;
            deal.UpdatedAt = DateTime.UtcNow;

            await _context.DealExecutions.ReplaceOneAsync(d => d.Id == deal.Id, deal);

            // Notify partner
            var partnerId = isCreator ? deal.EntrepreneurId : deal.CreatorId;
            if (_notifications != null && !string.IsNullOrEmpty(partnerId) && Guid.TryParse(partnerId, out var partnerGuid))
            {
                try
                {
                    await _notifications.CreateNotification(
                        partnerGuid,
                        "Partnership Milestone Updated",
                        $"Milestone '{milestone.Title}' updated to status '{milestone.Status}'."
                    );
                }
                catch { }
            }

            return Ok(new ApiResponse
            {
                Success = true,
                Message = "Milestone updated successfully.",
                Data = MapMilestoneToDto(milestone)
            });
        }

        // =========================================================================
        // PHASE 9 HELPER METHODS
        // =========================================================================

        private async Task<PartnershipSummaryDto> BuildPartnershipSummaryDto(DealExecution deal)
        {
            ApplicationUser? creatorUser = null;
            ApplicationUser? entUser = null;

            try
            {
                if (!string.IsNullOrEmpty(deal.CreatorId))
                    creatorUser = await _userManager.FindByIdAsync(deal.CreatorId);
                if (!string.IsNullOrEmpty(deal.EntrepreneurId))
                    entUser = await _userManager.FindByIdAsync(deal.EntrepreneurId);
            }
            catch { }

            var idea = !string.IsNullOrEmpty(deal.IdeaId)
                ? await _context.CreatorIdeas.Find(x => x.Id == deal.IdeaId).FirstOrDefaultAsync()
                : null;

            var projectName = idea?.Project?.Name ?? deal.CompanyNameSnapshot ?? "Project";
            var companyName = deal.Activation?.CompanyName ?? projectName;
            var capTable = deal.CapTableDraft;
            var totalShares = capTable?.TotalShares ?? 10_000_000;

            var creatorEntry = capTable?.Entries.FirstOrDefault(e => e.IsCreator);
            var entEntry = capTable?.Entries.FirstOrDefault(e => e.IsFounder);

            var creatorEquity = creatorEntry?.EquityPercent ?? (deal.EquityTerms?.EquityPercentage ?? 15.0);
            var creatorShares = creatorEntry?.SharesGranted ?? (int)Math.Round(totalShares * (creatorEquity / 100.0));

            var entEquity = entEntry?.EquityPercent ?? (100.0 - creatorEquity);
            var entShares = entEntry?.SharesGranted ?? (int)Math.Round(totalShares * (entEquity / 100.0));

            return new PartnershipSummaryDto
            {
                DealId = deal.Id,
                IdeaId = deal.IdeaId ?? "",
                ProjectName = projectName,
                CompanyId = deal.Activation?.CompanyId,
                CompanyName = companyName,
                CreatorId = deal.CreatorId ?? "",
                CreatorName = creatorUser?.Name ?? creatorUser?.UserName ?? "Creator",
                CreatorRole = deal.RoleAgreement?.CreatorRole ?? deal.EquityTerms?.CreatorRole ?? "Co-founder",
                CreatorEquityPercent = creatorEquity,
                CreatorShares = creatorShares,
                EntrepreneurId = deal.EntrepreneurId ?? "",
                EntrepreneurName = entUser?.Name ?? entUser?.UserName ?? "Entrepreneur",
                EntrepreneurRole = deal.RoleAgreement?.EntrepreneurRole ?? "Founder & CEO",
                EntrepreneurEquityPercent = entEquity,
                EntrepreneurShares = entShares,
                TotalShares = totalShares,
                DealStage = deal.DealStage,
                OutcomeBadge = "CO-FOUNDED",
                ActivatedAt = deal.Activation?.CompletedAt ?? deal.ClosedAt,
                Status = "active"
            };
        }

        private async Task<PartnershipActiveDetailsDto> BuildPartnershipActiveDetailsDto(DealExecution deal, string currentUserId)
        {
            ApplicationUser? creatorUser = null;
            ApplicationUser? entUser = null;

            try
            {
                if (!string.IsNullOrEmpty(deal.CreatorId))
                    creatorUser = await _userManager.FindByIdAsync(deal.CreatorId);
                if (!string.IsNullOrEmpty(deal.EntrepreneurId))
                    entUser = await _userManager.FindByIdAsync(deal.EntrepreneurId);
            }
            catch { }

            var idea = !string.IsNullOrEmpty(deal.IdeaId)
                ? await _context.CreatorIdeas.Find(x => x.Id == deal.IdeaId).FirstOrDefaultAsync()
                : null;

            var projectName = idea?.Project?.Name ?? deal.CompanyNameSnapshot ?? "Project";
            var companyId = deal.Activation?.CompanyId ?? idea?.CompanyId;

            Companies? company = null;
            if (!string.IsNullOrEmpty(companyId))
            {
                company = await _context.Companies.Find(c => c.Id == companyId).FirstOrDefaultAsync();
            }

            var equityDetails = await BuildPartnershipEquityDetailsDto(deal, currentUserId);
            var capTable = deal.CapTableDraft;
            var totalShares = capTable?.TotalShares ?? 10_000_000;

            var creatorEntry = capTable?.Entries.FirstOrDefault(e => e.IsCreator);
            var entEntry = capTable?.Entries.FirstOrDefault(e => e.IsFounder);

            var creatorEquity = creatorEntry?.EquityPercent ?? (deal.EquityTerms?.EquityPercentage ?? 15.0);
            var creatorShares = creatorEntry?.SharesGranted ?? (int)Math.Round(totalShares * (creatorEquity / 100.0));

            var entEquity = entEntry?.EquityPercent ?? (100.0 - creatorEquity);
            var entShares = entEntry?.SharesGranted ?? (int)Math.Round(totalShares * (entEquity / 100.0));

            var companyName = company?.CompanyName ?? deal.Activation?.CompanyName ?? projectName;
            var legalForm = company?.LegalStructure ?? "Corporation";
            var country = company?.Country ?? "United States";
            var jurisdiction = company?.Country ?? "Delaware";

            var docs = deal.Activation?.LinkedDocuments.Select(d => new ActivatedDocumentRefDto
            {
                DocumentId = d.DocumentId,
                DocumentType = d.DocumentType,
                Title = d.Title,
                Version = d.Version,
                DocumentHash = d.DocumentHash,
                LinkedAt = d.LinkedAt
            }).ToList() ?? new List<ActivatedDocumentRefDto>();

            var milestones = (deal.Activation?.Milestones ?? new List<PartnershipMilestone>())
                .Select(m => MapMilestoneToDto(m))
                .ToList();

            var workspaceUrl = !string.IsNullOrEmpty(companyId)
                ? $"/dashboard/entrepreneur/companies/{companyId}"
                : $"/dashboard/creator/partnerships/{deal.Id}";

            return new PartnershipActiveDetailsDto
            {
                DealId = deal.Id,
                IdeaId = deal.IdeaId ?? "",
                ProjectName = projectName,
                OutcomeBadge = "CO-FOUNDED",
                Status = "PARTNERSHIP_ACTIVE",
                ActivatedAt = deal.Activation?.CompletedAt ?? deal.ClosedAt,
                Creator = new PartnerSummaryDto
                {
                    UserId = deal.CreatorId ?? "",
                    DisplayName = creatorUser?.Name ?? creatorUser?.UserName ?? "Creator",
                    RoleTitle = deal.RoleAgreement?.CreatorRole ?? deal.EquityTerms?.CreatorRole ?? "Co-founder",
                    EquityPercent = creatorEquity,
                    Shares = creatorShares,
                    IsCreator = true
                },
                Entrepreneur = new PartnerSummaryDto
                {
                    UserId = deal.EntrepreneurId ?? "",
                    DisplayName = entUser?.Name ?? entUser?.UserName ?? "Entrepreneur",
                    RoleTitle = deal.RoleAgreement?.EntrepreneurRole ?? "Founder & CEO",
                    EquityPercent = entEquity,
                    Shares = entShares,
                    IsCreator = false
                },
                Company = new PartnershipCompanySummaryDto
                {
                    CompanyId = companyId,
                    CompanyName = companyName,
                    LegalStructure = legalForm,
                    Country = country,
                    Jurisdiction = jurisdiction,
                    CompanyStatus = company?.VerificationStatus ?? "Active",
                    CorporateFilingStatus = deal.Activation?.CorporateFilingStatus ?? "NOT_REQUIRED",
                    RegistrationNumber = company?.RegistrationNumber,
                    TotalShares = totalShares,
                    EsopPoolPercent = capTable?.EsopPoolPercent ?? 0,
                    InvestorReservePercent = capTable?.InvestorReservePercent ?? 0
                },
                Equity = equityDetails,
                CreatorRoleDetails = new PartnershipRoleSummaryDto
                {
                    RoleTitle = deal.RoleAgreement?.CreatorRole ?? deal.EquityTerms?.CreatorRole ?? "Co-founder",
                    Responsibilities = deal.RoleAgreement?.CreatorResponsibilities ?? deal.EquityTerms?.Responsibilities ?? new List<string> { "Product Vision", "Technical Strategy" },
                    TimeCommitment = deal.RoleAgreement?.CreatorTimeCommitment ?? deal.EquityTerms?.TimeCommitment ?? "Part-time (5-10 hrs/week)"
                },
                EntrepreneurRoleDetails = new PartnershipRoleSummaryDto
                {
                    RoleTitle = deal.RoleAgreement?.EntrepreneurRole ?? "Founder & CEO",
                    Responsibilities = deal.RoleAgreement?.EntrepreneurResponsibilities ?? new List<string> { "Operations", "Fundraising", "Business Development" },
                    TimeCommitment = deal.RoleAgreement?.EntrepreneurTimeCommitment ?? "Full-time"
                },
                Documents = docs,
                Milestones = milestones,
                ConversationId = deal.ConversationId ?? "",
                WorkspaceUrl = workspaceUrl,
                CapTableIntegrityStatus = equityDetails.CapTableIntegrityStatus
            };
        }

        private async Task<PartnershipEquityDetailsDto> BuildPartnershipEquityDetailsDto(DealExecution deal, string currentUserId)
        {
            var isCreator = deal.CreatorId == currentUserId;
            var idea = !string.IsNullOrEmpty(deal.IdeaId)
                ? await _context.CreatorIdeas.Find(x => x.Id == deal.IdeaId).FirstOrDefaultAsync()
                : null;

            var companyId = deal.Activation?.CompanyId ?? idea?.CompanyId;
            Companies? company = null;
            if (!string.IsNullOrEmpty(companyId))
            {
                company = await _context.Companies.Find(c => c.Id == companyId).FirstOrDefaultAsync();
            }

            var capTable = deal.CapTableDraft;
            var totalShares = capTable?.TotalShares ?? 10_000_000;
            var creatorEntry = capTable?.Entries.FirstOrDefault(e => e.IsCreator);
            var entEntry = capTable?.Entries.FirstOrDefault(e => e.IsFounder);

            var entry = isCreator ? creatorEntry : entEntry;
            var ownershipPercent = entry?.EquityPercent ?? (isCreator ? (deal.EquityTerms?.EquityPercentage ?? 15.0) : (100.0 - (deal.EquityTerms?.EquityPercentage ?? 15.0)));
            var sharesOwned = entry?.SharesGranted ?? (int)Math.Round(totalShares * (ownershipPercent / 100.0));

            // Verify Cap Table Integrity against real Company entity
            var integrityStatus = "VALID";
            if (company != null && company.EquityStructure != null && company.EquityStructure.Count > 0)
            {
                var matchingEntry = company.EquityStructure.FirstOrDefault(e => e.SharesOwned == sharesOwned);
                if (matchingEntry == null)
                {
                    integrityStatus = "OWNERSHIP_RECONCILIATION_REQUIRED";
                }
            }

            var vestingEnabled = isCreator ? (deal.EquityTerms?.VestingEnabled ?? true) : false;
            var vestingMonths = isCreator ? (deal.EquityTerms?.VestingMonths ?? 48) : 0;
            var cliffMonths = isCreator ? (deal.EquityTerms?.CliffMonths ?? 12) : 0;

            // Reusing canonical Phase4Requirements vesting calculation
            DateTime? vestingStartDate = deal.Activation?.CompletedAt;
            double vestedPercent = 0.0;
            int vestedShares = 0;
            double unvestedPercent = ownershipPercent;
            int unvestedShares = sharesOwned;
            string vestingNotice = "";

            if (vestingEnabled && vestingMonths > 0)
            {
                if (vestingStartDate.HasValue)
                {
                    var monthsSinceGrant = Phase4Requirements.MonthsBetween(vestingStartDate.Value, DateTime.UtcNow);
                    var vestedFractionPercent = Phase4Requirements.ComputeVestedPercent(monthsSinceGrant, cliffMonths, vestingMonths);
                    vestedPercent = Math.Round(ownershipPercent * (vestedFractionPercent / 100.0), 2);
                    vestedShares = (int)Math.Floor(sharesOwned * (vestedFractionPercent / 100.0));
                    unvestedPercent = Math.Max(0, Math.Round(ownershipPercent - vestedPercent, 2));
                    unvestedShares = Math.Max(0, sharesOwned - vestedShares);
                    vestingNotice = $"Vesting active ({monthsSinceGrant} mo. elapsed).";
                }
                else
                {
                    // Fallback notice when start date is not canonically available
                    vestingNotice = "Vesting schedule recorded — start date pending.";
                    vestedPercent = 0.0;
                    vestedShares = 0;
                    unvestedPercent = ownershipPercent;
                    unvestedShares = sharesOwned;
                }
            }
            else
            {
                vestedPercent = ownershipPercent;
                vestedShares = sharesOwned;
                unvestedPercent = 0.0;
                unvestedShares = 0;
                vestingNotice = "Fully vested at issuance (no vesting restriction).";
            }

            var docs = deal.Activation?.LinkedDocuments.Select(d => new ActivatedDocumentRefDto
            {
                DocumentId = d.DocumentId,
                DocumentType = d.DocumentType,
                Title = d.Title,
                Version = d.Version,
                DocumentHash = d.DocumentHash,
                LinkedAt = d.LinkedAt
            }).ToList() ?? new List<ActivatedDocumentRefDto>();

            return new PartnershipEquityDetailsDto
            {
                DealId = deal.Id,
                IdeaId = deal.IdeaId ?? "",
                ProjectName = idea?.Project?.Name ?? deal.CompanyNameSnapshot ?? "Project",
                CompanyId = companyId,
                CompanyName = company?.CompanyName ?? deal.Activation?.CompanyName ?? "Company Workspace",
                LegalStructure = company?.LegalStructure ?? "Corporation",
                Jurisdiction = company?.Country ?? "Delaware",
                TotalShares = totalShares,
                CurrentOwnershipPercent = ownershipPercent,
                SharesOwned = sharesOwned,
                ShareClass = entry?.ShareClass ?? "Common",
                VotingRights = entry?.HasVotingRights == true ? "Standard 1 vote per share" : "Non-voting",
                VestingEnabled = vestingEnabled,
                VestingMonths = vestingMonths,
                CliffMonths = cliffMonths,
                VestingStartDate = vestingStartDate,
                VestedPercent = vestedPercent,
                VestedShares = vestedShares,
                UnvestedPercent = unvestedPercent,
                UnvestedShares = unvestedShares,
                VestingStatusNotice = vestingNotice,
                ShareholderStatus = "Active Shareholder",
                CapTableIntegrityStatus = integrityStatus,
                CompanyDocuments = docs
            };
        }

        private static PartnershipMilestoneDto MapMilestoneToDto(PartnershipMilestone m)
        {
            return new PartnershipMilestoneDto
            {
                Id = m.Id,
                DealId = m.DealId,
                IdeaId = m.IdeaId,
                CompanyId = m.CompanyId,
                Title = m.Title,
                Description = m.Description,
                DueDate = m.DueDate,
                Status = m.Status,
                CreatedByUserId = m.CreatedByUserId,
                CreatedByName = m.CreatedByName,
                CreatedAt = m.CreatedAt,
                UpdatedAt = m.UpdatedAt,
                CompletedAt = m.CompletedAt
            };
        }
    }
}
