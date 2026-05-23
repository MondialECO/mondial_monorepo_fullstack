using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System.Security.Claims;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;

namespace WebApp.Controllers;

[ApiController]
[Route("api/investor")]
[Authorize]
public class InvestorPhaseController : ControllerBase
{
    private readonly MongoDbContext _dbContext;
    private readonly ILogger<InvestorPhaseController> _logger;
    private readonly UserManager<ApplicationUser> _userManager;

    public InvestorPhaseController(MongoDbContext dbContext, ILogger<InvestorPhaseController> logger, UserManager<ApplicationUser> userManager)
    {
        _dbContext = dbContext;
        _logger = logger;
        _userManager = userManager;
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

    // ============ INVESTOR PHASE 5: DEAL DISCOVERY ============

    [HttpGet("deals")]
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

    [HttpPost("term-sheet/{companyId}/create")]
    public async Task<ActionResult> CreateTermSheet(string companyId, [FromBody] InvestorTermSheetRequest request)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);

            if (string.IsNullOrWhiteSpace(companyId) || request == null)
                return BadRequest(new { error = "Missing required fields" });

            // TODO: P1 - Create Deal or TermSheet record
            return Ok(new
            {
                message = "Term sheet created",
                termSheetId = Guid.NewGuid().ToString(),
                status = "draft"
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating term sheet");
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
