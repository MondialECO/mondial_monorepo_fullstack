using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System.Security.Claims;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services;
using WebApp.Services.Interface;

namespace WebApp.Controllers;

[ApiController]
[Route("api/investor")]
[Authorize]
public class InvestorPhaseController : ControllerBase
{
    private readonly MongoDbContext _dbContext;
    private readonly ILogger<InvestorPhaseController> _logger;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IInvestmentsService _investmentsService;
    private readonly IInvestorService _investorService;
    private readonly ICompanyService _companyService;
    private readonly IPhaseNotificationService _phaseNotificationService;

    public InvestorPhaseController(
        MongoDbContext dbContext,
        ILogger<InvestorPhaseController> logger,
        UserManager<ApplicationUser> userManager,
        IInvestmentsService investmentsService,
        IInvestorService investorService,
        ICompanyService companyService,
        IPhaseNotificationService phaseNotificationService)
    {
        _dbContext = dbContext;
        _logger = logger;
        _userManager = userManager;
        _investmentsService = investmentsService;
        _investorService = investorService;
        _companyService = companyService;
        _phaseNotificationService = phaseNotificationService;
    }

    private string GetUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("User not authenticated");
    }

    private async Task EnsureUniversalPhase1CompleteAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            throw new UnauthorizedAccessException("User not found");

        var phase = user.Onboarding?.Phase ?? 0;
        if (phase < 1)
            throw new UnauthorizedAccessException("Universal Phase 1 (identity verification) must be complete before accessing investor features");
    }

    // ============ INVESTOR DASHBOARD (P0-3) ============

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);

            var (investments, items) = await BuildPortfolioAsync(userId);

            var totalInvested = investments.Sum(i => (double)i.Amount);
            var numberOfInvestments = investments.Count;
            var activeInvestments = investments.Count(IsActiveInvestment);

            // MVP: no realized valuation/exit data yet. Surface invested
            // capital as portfolio value and 0% ROI so the dashboard renders
            // a coherent baseline instead of NaN/undefined.
            return Ok(new
            {
                totalInvested,
                portfolioValue = totalInvested,
                numberOfInvestments,
                averageROI = 0.0,
                activeInvestments,
                investments = items
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error building investor stats");
            return StatusCode(500, new { error = "Failed to build investor stats" });
        }
    }

    [HttpGet("portfolio")]
    public async Task<IActionResult> GetPortfolio()
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);

            var (_, items) = await BuildPortfolioAsync(userId);
            return Ok(items);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error building investor portfolio");
            return StatusCode(500, new { error = "Failed to build portfolio" });
        }
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);

            var user = await _userManager.FindByIdAsync(userId)
                ?? throw new UnauthorizedAccessException("User not found");

            Investor? catalog = null;
            var catalogId = user.InvestorProfile?.InvestorId;
            if (!string.IsNullOrWhiteSpace(catalogId))
            {
                try
                {
                    catalog = await _investorService.GetInvestorAsync(catalogId);
                }
                catch (KeyNotFoundException)
                {
                    // Stale link — surface bare user slice rather than 500.
                    _logger.LogWarning("InvestorProfile.InvestorId {Id} on user {UserId} no longer resolves", catalogId, userId);
                }
            }

            return Ok(BuildProfileResponse(catalog, user));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error building investor profile");
            return StatusCode(500, new { error = "Failed to build investor profile" });
        }
    }

    // Investor self-service write. Resolves the caller's OWN linked catalogue
    // Investor (never an id from the route/body), so an investor can only edit
    // their own profile — no admin privileges. The Admin-only full-document
    // PUT /api/investors/{id} stays separate.
    [HttpPut("profile")]
    [Authorize(Roles = "Investor")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateInvestorProfileRequest request)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);

            if (request == null)
                return BadRequest(new { error = "Request body required" });

            var user = await _userManager.FindByIdAsync(userId)
                ?? throw new UnauthorizedAccessException("User not found");

            var catalogId = user.InvestorProfile?.InvestorId;
            if (string.IsNullOrWhiteSpace(catalogId))
                return StatusCode(403, new { error = "No linked investor profile to update." });

            Investor catalog;
            try
            {
                catalog = await _investorService.GetInvestorAsync(catalogId);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { error = "Linked investor profile not found." });
            }

            // Validation consistent with existing patterns (BadRequest on bad input).
            var min = request.MinCheckSize ?? catalog.MinCheckSize;
            var max = request.MaxCheckSize ?? catalog.MaxCheckSize;
            if (min < 0 || max < 0)
                return BadRequest(new { error = "Check sizes must be non-negative." });
            if (max > 0 && min > max)
                return BadRequest(new { error = "minCheckSize cannot exceed maxCheckSize." });
            if (request.SuccessfulExits is < 0)
                return BadRequest(new { error = "successfulExits must be non-negative." });
            if (request.AverageCheckSize is < 0)
                return BadRequest(new { error = "averageCheckSize must be non-negative." });

            // Apply ONLY provided fields (partial update). Identity/system fields
            // (Id, LinkedUserId, CompletedDeals, ActiveInvestments, CreatedAt)
            // are deliberately left untouched.
            if (request.Name != null) catalog.Name = request.Name;
            if (request.Type != null) catalog.Type = request.Type;
            if (request.PrimaryContact != null) catalog.PrimaryContact = request.PrimaryContact;
            if (request.PrimaryPhone != null) catalog.PrimaryPhone = request.PrimaryPhone;

            if (request.PreferredSectors != null) catalog.PreferredSectors = request.PreferredSectors;
            if (request.PreferredStages != null) catalog.PreferredStages = request.PreferredStages;
            if (request.MinCheckSize.HasValue) catalog.MinCheckSize = request.MinCheckSize.Value;
            if (request.MaxCheckSize.HasValue) catalog.MaxCheckSize = request.MaxCheckSize.Value;
            if (request.PreferredGeographies != null) catalog.PreferredGeographies = request.PreferredGeographies;
            if (request.RequiresProRataRights.HasValue) catalog.RequiresProRataRights = request.RequiresProRataRights.Value;
            if (request.RequiresBoardSeat.HasValue) catalog.RequiresBoardSeat = request.RequiresBoardSeat.Value;
            if (request.PreferredEquityTypes != null) catalog.PreferredEquityTypes = request.PreferredEquityTypes;

            if (request.ThesisStatement != null) catalog.ThesisStatement = request.ThesisStatement;
            if (request.TargetReturnMultiple != null) catalog.TargetReturnMultiple = request.TargetReturnMultiple;
            if (request.FollowOnPolicy != null) catalog.FollowOnPolicy = request.FollowOnPolicy;
            if (request.PreferredRole != null) catalog.PreferredRole = request.PreferredRole;
            if (request.BoardParticipationLevel != null) catalog.BoardParticipationLevel = request.BoardParticipationLevel;

            if (request.Headline != null) catalog.Headline = request.Headline;
            if (request.Bio != null) catalog.Bio = request.Bio;
            if (request.Website != null) catalog.Website = request.Website;
            if (request.LogoUrl != null) catalog.LogoUrl = request.LogoUrl;
            if (request.CoverImageUrl != null) catalog.CoverImageUrl = request.CoverImageUrl;
            if (request.SocialLinks != null) catalog.SocialLinks = request.SocialLinks;
            if (request.IsPublic.HasValue) catalog.IsPublic = request.IsPublic.Value;

            if (request.SuccessfulExits.HasValue) catalog.SuccessfulExits = request.SuccessfulExits.Value;
            if (request.AverageCheckSize.HasValue) catalog.AverageCheckSize = request.AverageCheckSize.Value;

            catalog.LastActiveAt = DateTime.UtcNow;

            // UpdateInvestorAsync does a full replace + bumps UpdatedAt.
            var updated = await _investorService.UpdateInvestorAsync(catalogId, catalog);

            return Ok(BuildProfileResponse(updated, user));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating investor profile");
            return StatusCode(500, new { error = "Failed to update investor profile" });
        }
    }

    // Single Model -> Response mapping, reused by GET and PUT so the two never
    // drift. Preserves the original fallbacks to the ApplicationUser slice.
    private static InvestorProfileResponse BuildProfileResponse(Investor? catalog, ApplicationUser user) => new()
    {
        Id = catalog?.Id,
        UserId = user.Id.ToString(),
        Name = catalog?.Name ?? user.Name,
        Email = catalog?.PrimaryEmail ?? user.Email,
        Type = catalog?.Type,
        Headline = catalog?.Headline,
        Bio = catalog?.Bio ?? user.Bio,
        Website = catalog?.Website,
        LogoUrl = catalog?.LogoUrl ?? user.ImagePath,
        CoverImageUrl = catalog?.CoverImageUrl,
        SocialLinks = catalog?.SocialLinks ?? new Dictionary<string, string>(),
        IsPublic = catalog?.IsPublic ?? false,
        PreferredSectors = catalog?.PreferredSectors ?? new List<string>(),
        PreferredStages = catalog?.PreferredStages ?? new List<string>(),
        MinCheckSize = catalog?.MinCheckSize ?? 0,
        MaxCheckSize = catalog?.MaxCheckSize ?? 0,
        PreferredGeographies = catalog?.PreferredGeographies ?? new List<string>(),
        RequiresProRataRights = catalog?.RequiresProRataRights ?? false,
        RequiresBoardSeat = catalog?.RequiresBoardSeat ?? false,
        PreferredEquityTypes = catalog?.PreferredEquityTypes ?? new List<string>(),
        ThesisStatement = catalog?.ThesisStatement,
        TargetReturnMultiple = catalog?.TargetReturnMultiple,
        FollowOnPolicy = catalog?.FollowOnPolicy,
        PreferredRole = catalog?.PreferredRole,
        BoardParticipationLevel = catalog?.BoardParticipationLevel,
        SuccessfulExits = catalog?.SuccessfulExits ?? 0,
        AverageCheckSize = catalog?.AverageCheckSize ?? 0,
        CompletedDeals = catalog?.CompletedDeals ?? 0,
        ActiveInvestments = catalog?.ActiveInvestments ?? 0,
        PrimaryContact = catalog?.PrimaryContact ?? user.Name,
        PrimaryPhone = catalog?.PrimaryPhone ?? user.PhoneNumber,
        IsActive = catalog?.IsActive ?? true,
        Linked = catalog != null,
    };

    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings()
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);

            var user = await _userManager.FindByIdAsync(userId)
                ?? throw new UnauthorizedAccessException("User not found");

            // No NotificationSettings schema in MVP — surface MVP-safe defaults
            // alongside the existing ApplicationUser slice the UI binds to.
            return Ok(new
            {
                id = user.Id.ToString(),
                name = user.Name,
                email = user.Email,
                phone = user.PhoneNumber,
                geography = user.Geography,
                availableTime = user.AvailableTime,
                address = user.Address,
                notifications = new
                {
                    emailEnabled = true,
                    pushEnabled = false
                }
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error building investor settings");
            return StatusCode(500, new { error = "Failed to build investor settings" });
        }
    }

    // ---- Shared portfolio projection ----

    private async Task<(List<Investments> raw, List<object> projected)> BuildPortfolioAsync(string userId)
    {
        if (!Guid.TryParse(userId, out var investorGuid))
        {
            return (new List<Investments>(), new List<object>());
        }

        var investments = (await _investmentsService.GetByInvestorAsync(investorGuid)).ToList();

        if (investments.Count == 0)
        {
            return (investments, new List<object>());
        }

        var ideaIds = investments.Select(i => i.IdeaId).Where(id => !string.IsNullOrEmpty(id)).Distinct().ToList();

        var ideas = ideaIds.Count > 0
            ? await _dbContext.BusinessIdeas
                .Find(Builders<BusinessIdeas>.Filter.In(i => i.Id, ideaIds))
                .ToListAsync()
            : new List<BusinessIdeas>();

        var ideaById = ideas.ToDictionary(i => i.Id);

        var creatorIds = ideas.Select(i => i.CreatorId).Where(id => !string.IsNullOrEmpty(id)).Distinct().ToList();

        var creators = creatorIds.Count > 0
            ? await _dbContext.ApplicationUsers
                .Find(Builders<ApplicationUser>.Filter.In(u => u.Id, creatorIds.Select(Guid.Parse)))
                .ToListAsync()
            : new List<ApplicationUser>();

        var creatorById = creators.ToDictionary(u => u.Id.ToString());

        var projected = investments
            .OrderByDescending(inv => inv.CreatedAt)
            .Select(inv =>
            {
                ideaById.TryGetValue(inv.IdeaId ?? string.Empty, out var idea);
                ApplicationUser? creator = null;
                if (idea != null)
                {
                    creatorById.TryGetValue(idea.CreatorId ?? string.Empty, out creator);
                }

                return (object)new
                {
                    id = inv.Id,
                    ideaName = idea?.Name ?? inv.ideaName ?? "(unknown idea)",
                    creatorName = creator?.Name ?? "Unknown founder",
                    investedAmount = (double)inv.Amount,
                    equityOwned = inv.EquityPercentage,
                    status = NormalizeInvestmentStatus(inv.Status),
                    investmentDate = inv.CreatedAt.ToString("yyyy-MM-dd"),
                    fundingRound = inv.RoundName
                };
            })
            .ToList();

        return (investments, projected);
    }

    private static bool IsActiveInvestment(Investments inv)
    {
        if (string.IsNullOrWhiteSpace(inv.Status)) return true;
        var s = inv.Status.Trim();
        return s.Equals("Pending", StringComparison.OrdinalIgnoreCase)
            || s.Equals("Escrowed", StringComparison.OrdinalIgnoreCase)
            || s.Equals("Active", StringComparison.OrdinalIgnoreCase);
    }

    private static string NormalizeInvestmentStatus(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return "active";
        var s = raw.Trim().ToLowerInvariant();
        return s switch
        {
            "completed" => "completed",
            "refunded" => "withdrawn",
            "withdrawn" => "withdrawn",
            _ => "active"
        };
    }

    // ============ INVESTOR PHASE 5: DEAL DISCOVERY ============

    [HttpGet("deals")]
    [Authorize(Roles = "Investor,Admin")]
    public async Task<ActionResult<List<DealDiscoveryResponse>>> GetDealDiscovery([FromQuery] string? sector = null, [FromQuery] string? stage = null)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);

            // Build filter: companies in Phase 8+ (ready for investor matching)
            var filterBuilder = Builders<Companies>.Filter;
            var filter = filterBuilder.And(
                filterBuilder.Gte(c => c.CurrentPhase, 8),
                filterBuilder.Ne(c => c.OwnerId, userId) // Don't show own companies
            );

            if (!string.IsNullOrWhiteSpace(sector))
                filter = filterBuilder.And(filter, filterBuilder.Eq(c => c.Industry, sector));

            if (!string.IsNullOrWhiteSpace(stage))
                filter = filterBuilder.And(filter, filterBuilder.Eq(c => c.FundingRoundType, stage));

            var companies = await _dbContext.Companies
                .Find(filter)
                .Limit(20)
                .ToListAsync();

            var result = companies.Select(c => new DealDiscoveryResponse
            {
                CompanyId = c.Id,
                CompanyName = c.CompanyName,
                Stage = c.FundingRoundType ?? "Seed",
                FundingAsk = c.FundingAskAmount ?? 0,
                Sector = c.Industry,
                FounderName = "Founder", // TODO: P1 - Get from user profile
                CreatedAt = c.CreatedAt
            }).ToList();

            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting deal discovery");
            return BadRequest(new { error = ex.Message });
        }
    }

    // ============ INVESTOR PHASE 6: NDA & FOUNDER PROFILE ============

    [HttpPost("nda/create")]
    public async Task<ActionResult> CreateNda([FromBody] CreateNdaRequest request)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);

            if (string.IsNullOrWhiteSpace(request?.CompanyId))
                return BadRequest(new { error = "CompanyId is required" });

            // TODO: P1 - Integrate DocuSign
            // For now, just create placeholder NDA record

            return Ok(new
            {
                message = "NDA creation initiated",
                ndaId = Guid.NewGuid().ToString(),
                status = "pending_signature",
                docusignLink = "https://demo.docusign.net/..." // TODO: P1 - Real DocuSign URL
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating NDA");
            return BadRequest(new { error = ex.Message });
        }
    }

    // ============ INVESTOR PHASE 8: TERM SHEET ============

    // Investor-initiated initial offer. Persists a real DealExecution + first
    // term-sheet revision (Phase D-4), replacing the former placeholder.
    [HttpPost("term-sheet/{companyId}/create")]
    public async Task<ActionResult<DealStatusResponse>> CreateTermSheet(string companyId, [FromBody] OfferTermsRequest request)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);

            if (string.IsNullOrWhiteSpace(companyId) || request == null)
                return BadRequest(new { error = "Missing required fields" });

            var user = await _userManager.FindByIdAsync(userId);
            var investorId = user?.InvestorProfile?.InvestorId;
            if (string.IsNullOrWhiteSpace(investorId))
                return StatusCode(403, new { error = "User has no linked investor profile." });

            var result = await _companyService.CreateInvestorOfferAsync(
                companyId, investorId, request, userId, ipHash: "");

            // Best-effort: notify participants a new offer arrived (resolved
            // from the deal, so both founder and investor are reached).
            try
            {
                await _phaseNotificationService.NotifyDealStatusChangeAsync(result.DealId, "", "offer_sent");
            }
            catch (Exception nex)
            {
                _logger.LogWarning(nex, "Offer-sent notification failed for deal {DealId} (non-fatal)", result.DealId);
            }

            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating offer");
            return BadRequest(new { error = ex.Message });
        }
    }
}

// ============ DTOs ============

public class DealDiscoveryResponse
{
    public string CompanyId { get; set; }
    public string CompanyName { get; set; }
    public string Stage { get; set; }
    public double FundingAsk { get; set; }
    public string Sector { get; set; }
    public string FounderName { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateNdaRequest
{
    public string CompanyId { get; set; }
}

public class InvestorTermSheetRequest
{
    public double EquityPercent { get; set; }
    public double ValuationPostMoney { get; set; }
    public bool ProRataRights { get; set; }
    public string Notes { get; set; }
}
