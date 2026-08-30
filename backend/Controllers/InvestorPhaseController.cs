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
    private readonly SaveFile _saveFile;

    public InvestorPhaseController(
        MongoDbContext dbContext,
        ILogger<InvestorPhaseController> logger,
        UserManager<ApplicationUser> userManager,
        IInvestmentsService investmentsService,
        IInvestorService investorService,
        ICompanyService companyService,
        IPhaseNotificationService phaseNotificationService,
        SaveFile saveFile)
    {
        _dbContext = dbContext;
        _logger = logger;
        _userManager = userManager;
        _investmentsService = investmentsService;
        _investorService = investorService;
        _companyService = companyService;
        _phaseNotificationService = phaseNotificationService;
        _saveFile = saveFile;
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

            var (companyHoldings, legacyInvestments, legacyProjected) = await BuildPortfolioFullAsync(userId);

            var totalInvested = companyHoldings.Sum(h => h.InvestmentAmount) + legacyInvestments.Sum(i => (double)i.Amount);
            var companiesInvested = companyHoldings.Select(h => h.CompanyId).Distinct().Count();
            var numberOfInvestments = companyHoldings.Count + legacyInvestments.Count;
            var activeInvestments = companyHoldings.Count(h => h.Status.Equals("active", StringComparison.OrdinalIgnoreCase))
                + legacyInvestments.Count(IsActiveInvestment);

            var instrumentBreakdown = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
            {
                ["equity"] = companyHoldings.Count(h => string.Equals(h.InstrumentType, "equity", StringComparison.OrdinalIgnoreCase)),
                ["safe"] = companyHoldings.Count(h => string.Equals(h.InstrumentType, "safe", StringComparison.OrdinalIgnoreCase)),
                ["convertible_note"] = companyHoldings.Count(h => string.Equals(h.InstrumentType, "convertible_note", StringComparison.OrdinalIgnoreCase)),
                ["debt"] = companyHoldings.Count(h => string.Equals(h.InstrumentType, "debt", StringComparison.OrdinalIgnoreCase))
            };

            return Ok(new InvestorStatsResponse
            {
                TotalInvested = totalInvested,
                PortfolioValue = totalInvested,
                CompaniesInvested = companiesInvested,
                NumberOfInvestments = numberOfInvestments,
                ActiveInvestments = activeInvestments,
                AverageROI = 0.0,
                InstrumentBreakdown = instrumentBreakdown,
                Investments = legacyProjected,
                CompanyHoldings = companyHoldings
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

            var (companyHoldings, legacyInvestments, legacyProjected) = await BuildPortfolioFullAsync(userId);

            var totalInvested = companyHoldings.Sum(h => h.InvestmentAmount) + legacyInvestments.Sum(i => (double)i.Amount);
            var companiesCount = companyHoldings.Select(h => h.CompanyId).Distinct().Count();

            return Ok(new InvestorPortfolioResponse
            {
                CompanyHoldings = companyHoldings,
                IdeaInvestments = legacyProjected,
                TotalInvested = totalInvested,
                CompaniesCount = companiesCount,
                TotalHoldingsCount = companyHoldings.Count + legacyInvestments.Count
            });
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

    [HttpGet("portfolio/{holdingId}")]
    public async Task<IActionResult> GetPortfolioHolding(string holdingId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);

            var user = await _userManager.FindByIdAsync(userId)
                ?? throw new UnauthorizedAccessException("User not found");
            var investorId = user.InvestorProfile?.InvestorId ?? string.Empty;

            var holding = await _dbContext.CompanyPortfolioHoldings
                .Find(h => h.Id == holdingId)
                .FirstOrDefaultAsync();

            if (holding == null)
                return NotFound(new { error = "Portfolio holding not found" });

            // Security check: authenticated investor must own this holding
            var isOwner = (!string.IsNullOrWhiteSpace(investorId) && string.Equals(holding.InvestorId, investorId, StringComparison.OrdinalIgnoreCase))
                || string.Equals(holding.InvestorUserId, userId, StringComparison.OrdinalIgnoreCase);

            if (!isOwner)
                return StatusCode(403, new { error = "You do not have permission to view this holding." });

            var company = await _dbContext.Companies.Find(c => c.Id == holding.CompanyId).FirstOrDefaultAsync();

            var dto = new CompanyPortfolioHoldingDto
            {
                HoldingId = holding.Id,
                CompanyId = holding.CompanyId,
                CompanyName = company?.CompanyName ?? holding.CompanyName,
                Industry = company?.Industry ?? "Technology",
                LogoUrl = null,
                InvestmentAmount = holding.InvestmentAmount,
                Currency = holding.Currency ?? "EUR",
                InstrumentType = holding.InstrumentType ?? "equity",
                EquityPercentage = string.Equals(holding.InstrumentType, "equity", StringComparison.OrdinalIgnoreCase) ? holding.EquityPercentage : null,
                EntryValuation = holding.EntryValuation,
                ValuationCap = holding.ValuationCap,
                DiscountRate = holding.DiscountRate,
                InterestRate = holding.InterestRate,
                MaturityDate = holding.MaturityDate,
                DealExecutionId = holding.DealExecutionId,
                MatchId = holding.MatchId,
                InvestmentDate = holding.InvestmentDate.ToString("yyyy-MM-dd"),
                ClosedAt = holding.ClosedAt,
                DealStatus = "completed",
                Status = holding.Status ?? "active"
            };

            return Ok(dto);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching portfolio holding {HoldingId}", holdingId);
            return StatusCode(500, new { error = "Failed to fetch portfolio holding" });
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

    private async Task<(List<CompanyPortfolioHoldingDto> companyHoldings, List<Investments> legacyRaw, List<object> legacyProjected)> BuildPortfolioFullAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        var investorId = user?.InvestorProfile?.InvestorId ?? string.Empty;

        // Auto-reconcile any previously completed deals for this investor
        try
        {
            await _companyService.ReconcileClosedDealPortfolioHoldingsAsync(investorId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to auto-reconcile deals for investor {InvestorId}", investorId);
        }

        // 1. Fetch Company Portfolio Holdings
        var holdingFilter = Builders<CompanyPortfolioHolding>.Filter.Or(
            Builders<CompanyPortfolioHolding>.Filter.Eq(h => h.InvestorUserId, userId),
            !string.IsNullOrWhiteSpace(investorId)
                ? Builders<CompanyPortfolioHolding>.Filter.Eq(h => h.InvestorId, investorId)
                : Builders<CompanyPortfolioHolding>.Filter.Eq(h => h.InvestorUserId, userId)
        );

        var rawHoldings = await _dbContext.CompanyPortfolioHoldings
            .Find(holdingFilter)
            .SortByDescending(h => h.InvestmentDate)
            .ToListAsync();

        var companyIds = rawHoldings.Select(h => h.CompanyId).Where(id => !string.IsNullOrEmpty(id)).Distinct().ToList();
        var companies = companyIds.Count > 0
            ? await _dbContext.Companies.Find(Builders<Companies>.Filter.In(c => c.Id, companyIds)).ToListAsync()
            : new List<Companies>();
        var companyById = companies.ToDictionary(c => c.Id);

        var companyHoldingDtos = rawHoldings.Select(h =>
        {
            companyById.TryGetValue(h.CompanyId, out var comp);
            return new CompanyPortfolioHoldingDto
            {
                HoldingId = h.Id,
                CompanyId = h.CompanyId,
                CompanyName = comp?.CompanyName ?? h.CompanyName,
                Industry = comp?.Industry ?? "Technology",
                LogoUrl = null,
                InvestmentAmount = h.InvestmentAmount,
                Currency = h.Currency ?? "EUR",
                InstrumentType = h.InstrumentType ?? "equity",
                EquityPercentage = string.Equals(h.InstrumentType, "equity", StringComparison.OrdinalIgnoreCase) ? h.EquityPercentage : null,
                EntryValuation = h.EntryValuation,
                ValuationCap = h.ValuationCap,
                DiscountRate = h.DiscountRate,
                InterestRate = h.InterestRate,
                MaturityDate = h.MaturityDate,
                DealExecutionId = h.DealExecutionId,
                MatchId = h.MatchId,
                InvestmentDate = h.InvestmentDate.ToString("yyyy-MM-dd"),
                ClosedAt = h.ClosedAt,
                DealStatus = "completed",
                Status = h.Status ?? "active"
            };
        }).ToList();

        // 2. Fetch Legacy Creator Idea Investments (if any)
        var legacyInvestments = new List<Investments>();
        var legacyProjected = new List<object>();

        if (Guid.TryParse(userId, out var investorGuid))
        {
            try
            {
                legacyInvestments = (await _investmentsService.GetByInvestorAsync(investorGuid)).ToList();

                if (legacyInvestments.Count > 0)
                {
                    var ideaIds = legacyInvestments.Select(i => i.IdeaId).Where(id => !string.IsNullOrEmpty(id)).Distinct().ToList();
                    var ideas = ideaIds.Count > 0
                        ? await _dbContext.BusinessIdeas.Find(Builders<BusinessIdeas>.Filter.In(i => i.Id, ideaIds)).ToListAsync()
                        : new List<BusinessIdeas>();
                    var ideaById = ideas.ToDictionary(i => i.Id);

                    var creatorIds = ideas.Select(i => i.CreatorId).Where(id => !string.IsNullOrEmpty(id)).Distinct().ToList();
                    var creators = creatorIds.Count > 0
                        ? await _dbContext.ApplicationUsers.Find(Builders<ApplicationUser>.Filter.In(u => u.Id, creatorIds.Select(Guid.Parse))).ToListAsync()
                        : new List<ApplicationUser>();
                    var creatorById = creators.ToDictionary(u => u.Id.ToString());

                    legacyProjected = legacyInvestments
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
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load legacy idea investments for user {UserId}", userId);
            }
        }

        return (companyHoldingDtos, legacyInvestments, legacyProjected);
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
    [Obsolete("Use canonical GET /api/companies/opportunities instead")]
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

            var ownerIds = companies
                .Select(c => c.OwnerId)
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Distinct()
                .ToList();

            var owners = ownerIds.Count > 0
                ? await _dbContext.ApplicationUsers.Find(u => ownerIds.Contains(u.Id.ToString())).ToListAsync()
                : new List<ApplicationUser>();

            var ownerMap = owners.ToDictionary(u => u.Id.ToString(), u => u.Name ?? "Entrepreneur");

            var result = companies.Select(c => new DealDiscoveryResponse
            {
                CompanyId = c.Id,
                CompanyName = c.CompanyName,
                Stage = c.FundingRoundType ?? "Seed",
                FundingAsk = c.FundingAskAmount ?? 0,
                Sector = c.Industry,
                FounderName = !string.IsNullOrWhiteSpace(c.OwnerId) && ownerMap.TryGetValue(c.OwnerId, out var name) ? name : "Entrepreneur",
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
    [Obsolete("Deprecated. Use canonical POST /api/companies/{companyId}/dataroom/nda/accept instead")]
    public async Task<ActionResult> CreateNda([FromBody] CreateNdaRequest request)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);

            if (string.IsNullOrWhiteSpace(request?.CompanyId))
                return BadRequest(new { error = "CompanyId is required" });

            return BadRequest(new
            {
                error = "This endpoint is deprecated. Use canonical POST /api/companies/{companyId}/dataroom/nda/accept to accept NDAs."
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

            if (user?.InvestorProfile?.FinanceVerified != true)
                return StatusCode(403, new { error = "Complete Finance Verification before submitting an investment offer." });

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

    // ============ INVESTOR INCOMING MATCHES (PHASE 8 DOUBLE OPT-IN) ============

    [HttpGet("incoming-matches")]
    public async Task<ActionResult<List<InvestorIncomingMatchResponse>>> GetIncomingMatches()
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);

            var user = await _userManager.FindByIdAsync(userId);
            var investorId = user?.InvestorProfile?.InvestorId;
            if (string.IsNullOrWhiteSpace(investorId))
                return Ok(new List<InvestorIncomingMatchResponse>());

            var matches = await _dbContext.InvestorMatches
                .Find(m => m.InvestorId == investorId)
                .SortByDescending(m => m.MatchScore)
                .ToListAsync();

            if (matches.Count == 0)
                return Ok(new List<InvestorIncomingMatchResponse>());

            var companyIds = matches.Select(m => m.CompanyId).Distinct().ToList();
            var companies = await _dbContext.Companies
                .Find(Builders<Companies>.Filter.In(c => c.Id, companyIds))
                .ToListAsync();
            var companyMap = companies.ToDictionary(c => c.Id);

            var responses = new List<InvestorIncomingMatchResponse>();
            foreach (var m in matches)
            {
                companyMap.TryGetValue(m.CompanyId, out var comp);
                responses.Add(new InvestorIncomingMatchResponse
                {
                    MatchId = m.Id,
                    CompanyId = m.CompanyId,
                    CompanyName = comp?.CompanyName ?? "Company " + m.CompanyId,
                    Industry = comp?.Industry ?? "Technology",
                    FundingRoundType = comp?.FundingRoundType ?? "Seed",
                    FundingAskAmount = comp?.FundingAskAmount ?? 0,
                    Country = comp?.Country ?? "European Union",
                    Tagline = comp?.Tagline ?? string.Empty,
                    ElevatorPitch = comp?.Tagline ?? string.Empty,
                    MatchScore = m.MatchScore,
                    MatchRationale = m.MatchRationale,
                    EntrepreneurInterest = m.EntrepreneurInterest ?? "new",
                    InvestorInterest = m.InvestorInterest ?? "new",
                    Status = m.Status,
                    HandshakeConfirmedAt = m.HandshakeConfirmedAt,
                    ScheduledMeeting = m.ScheduledMeeting,
                    Phase7IntelligenceSnapshot = m.Phase7IntelligenceSnapshot,
                    ScoreComponents = m.ScoreComponents,
                    MatchedAt = m.MatchedAt
                });
            }

            return Ok(responses);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting investor incoming matches");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("matches/{matchId}/respond")]
    public async Task<ActionResult<InvestorIncomingMatchResponse>> RespondToMatch(
        string matchId, [FromBody] RespondToMatchRequest request)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);

            if (request == null || string.IsNullOrWhiteSpace(request.Action))
                return BadRequest(new { error = "Action ('interested' or 'passed') is required." });

            var user = await _userManager.FindByIdAsync(userId);
            var investorId = user?.InvestorProfile?.InvestorId;
            if (string.IsNullOrWhiteSpace(investorId))
                return StatusCode(403, new { error = "User has no linked investor profile." });

            var match = await _dbContext.InvestorMatches
                .Find(m => m.Id == matchId)
                .FirstOrDefaultAsync();

            if (match == null)
                return NotFound(new { error = $"Match {matchId} not found." });

            if (match.InvestorId != investorId)
                return StatusCode(403, new { error = "You are not authorized to respond to this investor match." });

            var action = request.Action.Trim().ToLowerInvariant();
            var wasHandshakeConfirmed = match.HandshakeConfirmedAt.HasValue;

            if (action == "interested")
            {
                match.InvestorInterest = "interested";
                if (string.Equals(match.EntrepreneurInterest, "interested", StringComparison.OrdinalIgnoreCase))
                {
                    match.Status = "accepted";
                    match.AcceptedAt ??= DateTime.UtcNow;
                    match.HandshakeConfirmedAt ??= DateTime.UtcNow;

                    if (!wasHandshakeConfirmed)
                    {
                        await _phaseNotificationService.NotifyMutualHandshakeAsync(match.CompanyId, match.InvestorId);
                    }
                }
                else
                {
                    await _phaseNotificationService.NotifyInvestorInterestAsync(match.CompanyId, match.InvestorId);
                }
            }
            else if (action == "passed")
            {
                match.InvestorInterest = "passed";
                if (match.Status != "accepted")
                    match.Status = "passed";
            }
            else
            {
                return BadRequest(new { error = "Invalid action. Supported actions: 'interested', 'passed'." });
            }

            match.UpdatedAt = DateTime.UtcNow;
            await _dbContext.InvestorMatches.ReplaceOneAsync(m => m.Id == match.Id, match);

            var company = await _dbContext.Companies.Find(c => c.Id == match.CompanyId).FirstOrDefaultAsync();

            return Ok(new InvestorIncomingMatchResponse
            {
                MatchId = match.Id,
                CompanyId = match.CompanyId,
                CompanyName = company?.CompanyName ?? "Company " + match.CompanyId,
                Industry = company?.Industry ?? "Technology",
                FundingRoundType = company?.FundingRoundType ?? "Seed",
                FundingAskAmount = company?.FundingAskAmount ?? 0,
                Country = company?.Country ?? "European Union",
                Tagline = company?.Tagline ?? string.Empty,
                ElevatorPitch = company?.Tagline ?? string.Empty,
                MatchScore = match.MatchScore,
                MatchRationale = match.MatchRationale,
                EntrepreneurInterest = match.EntrepreneurInterest ?? "new",
                InvestorInterest = match.InvestorInterest ?? "new",
                Status = match.Status,
                HandshakeConfirmedAt = match.HandshakeConfirmedAt,
                ScheduledMeeting = match.ScheduledMeeting,
                Phase7IntelligenceSnapshot = match.Phase7IntelligenceSnapshot,
                ScoreComponents = match.ScoreComponents,
                MatchedAt = match.MatchedAt
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error responding to investor match {MatchId}", matchId);
            return BadRequest(new { error = ex.Message });
        }
    }

    // ============ INVESTOR PHASE 2: FINANCE VERIFICATION ============

    [HttpGet("finance-verification")]
    public async Task<ActionResult<InvestorFinanceVerificationResponse>> GetFinanceVerification()
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            var user = await _userManager.FindByIdAsync(userId) ?? throw new UnauthorizedAccessException("User not found");
            var investorId = user.InvestorProfile?.InvestorId ?? string.Empty;

            var record = await _dbContext.InvestorFinanceVerifications
                .Find(v => v.UserId == userId)
                .FirstOrDefaultAsync();

            if (record == null)
            {
                // Legacy compatibility: if user has FinanceVerified = true, return synthetic verified response
                if (user.InvestorProfile?.FinanceVerified == true)
                {
                    Investor? inv = null;
                    if (!string.IsNullOrWhiteSpace(investorId))
                    {
                        try { inv = await _investorService.GetInvestorAsync(investorId); } catch { }
                    }
                    return Ok(new InvestorFinanceVerificationResponse
                    {
                        UserId = userId,
                        InvestorId = investorId,
                        Status = "verified",
                        FinanceVerified = true,
                        InvestorType = inv?.Type ?? "angel",
                        DeclaredAvailableCapital = (inv?.MaxCheckSize ?? 100000) * 5,
                        MinTicket = inv?.MinCheckSize ?? 10000,
                        MaxTicket = inv?.MaxCheckSize ?? 100000,
                        Currency = "EUR",
                        DeploymentPeriodMonths = 12,
                        SourceOfFunds = new List<string> { "Investment Proceeds" },
                        SubmittedAt = user.InvestorProfile.FinanceVerificationSubmittedAt ?? DateTime.UtcNow.AddDays(-30),
                        ReviewedAt = user.InvestorProfile.FinanceVerificationSubmittedAt ?? DateTime.UtcNow.AddDays(-30),
                        CreatedAt = DateTime.UtcNow.AddDays(-30),
                        UpdatedAt = DateTime.UtcNow.AddDays(-30),
                    });
                }

                // Return not_started draft
                return Ok(new InvestorFinanceVerificationResponse
                {
                    UserId = userId,
                    InvestorId = investorId,
                    Status = "not_started",
                    FinanceVerified = false,
                    Currency = "EUR",
                    DeploymentPeriodMonths = 12
                });
            }

            return Ok(MapFinanceVerificationToResponse(record, user.InvestorProfile?.FinanceVerified == true));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting finance verification");
            return StatusCode(500, new { error = "Failed to load finance verification" });
        }
    }

    [HttpPut("finance-verification/draft")]
    public async Task<ActionResult<InvestorFinanceVerificationResponse>> SaveFinanceDraft([FromBody] SaveFinanceDraftRequest request)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            var user = await _userManager.FindByIdAsync(userId) ?? throw new UnauthorizedAccessException("User not found");
            var investorId = user.InvestorProfile?.InvestorId ?? string.Empty;

            var record = await _dbContext.InvestorFinanceVerifications
                .Find(v => v.UserId == userId)
                .FirstOrDefaultAsync();

            if (record == null)
            {
                record = new InvestorFinanceVerification
                {
                    UserId = userId,
                    InvestorId = investorId,
                    Status = "draft",
                    CreatedAt = DateTime.UtcNow
                };
            }

            if (request != null)
            {
                if (request.InvestorType != null) record.InvestorType = request.InvestorType;
                if (request.DeclaredAvailableCapital.HasValue) record.DeclaredAvailableCapital = request.DeclaredAvailableCapital.Value;
                if (request.MinTicket.HasValue) record.MinTicket = request.MinTicket.Value;
                if (request.MaxTicket.HasValue) record.MaxTicket = request.MaxTicket.Value;
                if (!string.IsNullOrWhiteSpace(request.Currency)) record.Currency = request.Currency;
                if (request.DeploymentPeriodMonths.HasValue) record.DeploymentPeriodMonths = request.DeploymentPeriodMonths.Value;
                if (request.SourceOfFunds != null) record.SourceOfFunds = request.SourceOfFunds;
                if (request.SourceOfFundsExplanation != null) record.SourceOfFundsExplanation = request.SourceOfFundsExplanation;
            }

            if (record.Status == "not_started" || record.Status == "needs_update")
            {
                record.Status = "draft";
            }

            record.UpdatedAt = DateTime.UtcNow;
            await _dbContext.InvestorFinanceVerifications.ReplaceOneAsync(
                v => v.UserId == userId, record, new ReplaceOptions { IsUpsert = true });

            return Ok(MapFinanceVerificationToResponse(record, user.InvestorProfile?.FinanceVerified == true));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving finance draft");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("finance-verification/documents")]
    public async Task<ActionResult<InvestorFinanceDocumentDto>> UploadFinanceDocument(
        IFormFile file, [FromForm] string? documentType)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            var user = await _userManager.FindByIdAsync(userId) ?? throw new UnauthorizedAccessException("User not found");
            var investorId = user.InvestorProfile?.InvestorId ?? string.Empty;

            if (file == null || file.Length == 0)
                return BadRequest(new { error = "File is required." });

            if (file.Length > 20 * 1024 * 1024)
                return BadRequest(new { error = "File size must not exceed 20MB." });

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            var allowed = new[] { ".pdf", ".jpg", ".jpeg", ".png" };
            if (!allowed.Contains(ext))
                return BadRequest(new { error = "Only PDF, JPG, JPEG, and PNG files are allowed." });

            var storageKey = await _saveFile.SaveFileAsync(file, "investor/finance");

            var doc = new InvestorFinanceDocument
            {
                DocumentId = Guid.NewGuid().ToString("N"),
                InvestorId = investorId,
                UserId = userId,
                DocumentType = string.IsNullOrWhiteSpace(documentType) ? "supporting_evidence" : documentType,
                OriginalFilename = Path.GetFileName(file.FileName),
                StorageKey = storageKey,
                MimeType = file.ContentType ?? "application/octet-stream",
                FileSize = file.Length,
                UploadedAt = DateTime.UtcNow,
                VerificationStatus = "pending"
            };

            var record = await _dbContext.InvestorFinanceVerifications
                .Find(v => v.UserId == userId)
                .FirstOrDefaultAsync();

            if (record == null)
            {
                record = new InvestorFinanceVerification
                {
                    UserId = userId,
                    InvestorId = investorId,
                    Status = "draft",
                    CreatedAt = DateTime.UtcNow
                };
            }

            record.Documents.Add(doc);
            record.UpdatedAt = DateTime.UtcNow;

            await _dbContext.InvestorFinanceVerifications.ReplaceOneAsync(
                v => v.UserId == userId, record, new ReplaceOptions { IsUpsert = true });

            return Ok(new InvestorFinanceDocumentDto
            {
                DocumentId = doc.DocumentId,
                DocumentType = doc.DocumentType,
                OriginalFilename = doc.OriginalFilename,
                MimeType = doc.MimeType,
                FileSize = doc.FileSize,
                UploadedAt = doc.UploadedAt,
                VerificationStatus = doc.VerificationStatus,
                ReviewNote = doc.ReviewNote
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading finance document");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("finance-verification/documents/{documentId}")]
    public async Task<IActionResult> DeleteFinanceDocument(string documentId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);

            var record = await _dbContext.InvestorFinanceVerifications
                .Find(v => v.UserId == userId)
                .FirstOrDefaultAsync();

            if (record == null) return NotFound(new { error = "Verification record not found." });

            var removed = record.Documents.RemoveAll(d => d.DocumentId == documentId);
            if (removed == 0) return NotFound(new { error = "Document not found." });

            record.UpdatedAt = DateTime.UtcNow;
            await _dbContext.InvestorFinanceVerifications.ReplaceOneAsync(v => v.UserId == userId, record);

            return Ok(new { success = true, message = "Document removed." });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting finance document {DocumentId}", documentId);
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("finance-verification/documents/{documentId}")]
    public async Task<IActionResult> DownloadFinanceDocument(string documentId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            var isAdmin = User.IsInRole("Admin");

            var filter = isAdmin
                ? Builders<InvestorFinanceVerification>.Filter.ElemMatch(v => v.Documents, d => d.DocumentId == documentId)
                : Builders<InvestorFinanceVerification>.Filter.And(
                    Builders<InvestorFinanceVerification>.Filter.Eq(v => v.UserId, userId),
                    Builders<InvestorFinanceVerification>.Filter.ElemMatch(v => v.Documents, d => d.DocumentId == documentId));

            var record = await _dbContext.InvestorFinanceVerifications.Find(filter).FirstOrDefaultAsync();
            if (record == null) return NotFound(new { error = "Document not found or access denied." });

            var doc = record.Documents.FirstOrDefault(d => d.DocumentId == documentId);
            if (doc == null) return NotFound(new { error = "Document not found." });

            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", doc.StorageKey.TrimStart('/'));
            if (!System.IO.File.Exists(filePath))
            {
                filePath = Path.Combine(Directory.GetCurrentDirectory(), doc.StorageKey.TrimStart('/'));
            }

            if (!System.IO.File.Exists(filePath))
                return NotFound(new { error = "Document file not found on server." });

            var bytes = await System.IO.File.ReadAllBytesAsync(filePath);
            return File(bytes, doc.MimeType, doc.OriginalFilename);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading finance document {DocumentId}", documentId);
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("finance-verification/submit")]
    public async Task<ActionResult<InvestorFinanceVerificationResponse>> SubmitFinanceVerification([FromBody] SubmitFinanceVerificationRequest request)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            var user = await _userManager.FindByIdAsync(userId) ?? throw new UnauthorizedAccessException("User not found");
            var investorId = user.InvestorProfile?.InvestorId ?? string.Empty;

            if (request == null)
                return BadRequest(new { error = "Request body required." });

            if (string.IsNullOrWhiteSpace(request.InvestorType))
                return BadRequest(new { error = "Investor type is required." });

            if (request.DeclaredAvailableCapital <= 0)
                return BadRequest(new { error = "Available investment capital must be greater than 0." });

            if (request.MinTicket <= 0)
                return BadRequest(new { error = "Minimum ticket size must be greater than 0." });

            if (request.MaxTicket < request.MinTicket)
                return BadRequest(new { error = "Maximum ticket size cannot be less than minimum ticket size." });

            if (request.SourceOfFunds == null || request.SourceOfFunds.Count == 0)
                return BadRequest(new { error = "At least one source of funds must be selected." });

            if (!request.DeclarationConfirmed)
                return BadRequest(new { error = "You must confirm the accuracy declaration before submitting." });

            var record = await _dbContext.InvestorFinanceVerifications
                .Find(v => v.UserId == userId)
                .FirstOrDefaultAsync();

            if (record == null)
            {
                record = new InvestorFinanceVerification
                {
                    UserId = userId,
                    InvestorId = investorId,
                    CreatedAt = DateTime.UtcNow
                };
            }

            if (record.Documents.Count == 0)
                return BadRequest(new { error = "At least one supporting document must be uploaded before submitting." });

            record.InvestorType = request.InvestorType;
            record.DeclaredAvailableCapital = request.DeclaredAvailableCapital;
            record.MinTicket = request.MinTicket;
            record.MaxTicket = request.MaxTicket;
            record.Currency = string.IsNullOrWhiteSpace(request.Currency) ? "EUR" : request.Currency;
            record.DeploymentPeriodMonths = request.DeploymentPeriodMonths > 0 ? request.DeploymentPeriodMonths : 12;
            record.SourceOfFunds = request.SourceOfFunds;
            record.SourceOfFundsExplanation = request.SourceOfFundsExplanation ?? string.Empty;
            record.Status = "under_review";
            record.SubmittedAt = DateTime.UtcNow;
            record.ReviewStartedAt = DateTime.UtcNow;
            record.UpdatedAt = DateTime.UtcNow;

            // Update ApplicationUser
            user.InvestorProfile ??= new InvestorProfile();
            user.InvestorProfile.FinanceVerified = false;
            user.InvestorProfile.FinanceVerificationSubmittedAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            await _dbContext.InvestorFinanceVerifications.ReplaceOneAsync(
                v => v.UserId == userId, record, new ReplaceOptions { IsUpsert = true });

            await _phaseNotificationService.NotifyFinanceVerificationSubmittedAsync(userId, investorId);

            return Ok(MapFinanceVerificationToResponse(record, false));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting finance verification");
            return BadRequest(new { error = ex.Message });
        }
    }

    private static InvestorFinanceVerificationResponse MapFinanceVerificationToResponse(InvestorFinanceVerification record, bool userVerifiedFlag)
    {
        return new InvestorFinanceVerificationResponse
        {
            Id = record.Id,
            UserId = record.UserId,
            InvestorId = record.InvestorId,
            Status = record.Status,
            FinanceVerified = userVerifiedFlag || record.Status == "verified",
            InvestorType = record.InvestorType,
            DeclaredAvailableCapital = record.DeclaredAvailableCapital,
            MinTicket = record.MinTicket,
            MaxTicket = record.MaxTicket,
            Currency = record.Currency ?? "EUR",
            DeploymentPeriodMonths = record.DeploymentPeriodMonths > 0 ? record.DeploymentPeriodMonths : 12,
            SourceOfFunds = record.SourceOfFunds ?? new List<string>(),
            SourceOfFundsExplanation = record.SourceOfFundsExplanation ?? string.Empty,
            Documents = (record.Documents ?? new List<InvestorFinanceDocument>()).Select(d => new InvestorFinanceDocumentDto
            {
                DocumentId = d.DocumentId,
                DocumentType = d.DocumentType,
                OriginalFilename = d.OriginalFilename,
                MimeType = d.MimeType,
                FileSize = d.FileSize,
                UploadedAt = d.UploadedAt,
                VerificationStatus = d.VerificationStatus,
                ReviewNote = d.ReviewNote
            }).ToList(),
            SubmittedAt = record.SubmittedAt,
            ReviewedAt = record.ReviewedAt,
            DecisionReason = record.DecisionReason,
            CreatedAt = record.CreatedAt,
            UpdatedAt = record.UpdatedAt
        };
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
