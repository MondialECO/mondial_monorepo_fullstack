using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services;

namespace WebApp.Controllers;

[ApiController]
[Route("api/companies")]
[Authorize]
public class CompanyController : ControllerBase
{
    private readonly ICompanyService _companyService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<CompanyController> _logger;

    public CompanyController(
        ICompanyService companyService,
        UserManager<ApplicationUser> userManager,
        ILogger<CompanyController> logger)
    {
        _companyService = companyService;
        _userManager = userManager;
        _logger = logger;
    }

    private string GetUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("User not authenticated");
    }

    private async Task EnsureCompanyOwnershipAsync(string companyId)
    {
        var userId = GetUserId();
        var company = await _companyService.GetCompanyAsync(companyId);
        if (!string.Equals(company.OwnerId, userId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException("You are not allowed to access this company.");
    }

    private async Task EnsureDealOwnershipAsync(string dealId)
    {
        var companyId = await _companyService.GetDealCompanyIdAsync(dealId);
        if (string.IsNullOrWhiteSpace(companyId))
            throw new KeyNotFoundException($"Deal {dealId} not found");

        await EnsureCompanyOwnershipAsync(companyId);
    }

    private async Task EnsureUniversalPhase1CompleteAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null || (user.Onboarding?.Phase ?? 0) < 1)
            throw new UnauthorizedAccessException("User must complete Universal Phase 1 onboarding before accessing company endpoints.");
    }

    // ============ PHASE FLOW ============

    [HttpGet("current-phase")]
    public async Task<ActionResult<CompanyProgressResponse>> GetCurrentPhase()
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            var result = await _companyService.GetCurrentPhaseAsync(userId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current phase");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{companyId}/phase/{phaseNumber}")]
    public async Task<ActionResult<CompanyProgressResponse>> AdvancePhase(string companyId, int phaseNumber, [FromBody] object phaseData)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var result = await _companyService.AdvancePhaseAsync(companyId, phaseNumber, phaseData);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error advancing phase");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{companyId}/progress")]
    public async Task<ActionResult<CompanyProgressResponse>> GetPhaseProgress(string companyId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var result = await _companyService.GetPhaseProgressAsync(companyId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting phase progress");
            return BadRequest(new { error = ex.Message });
        }
    }

    // ============ PHASE 1: IDENTITY & ONBOARDING ============

    [HttpPost]
    public async Task<ActionResult> CreateCompany([FromBody] CreateCompanyDto dto)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            var company = await _companyService.CreateCompanyAsync(userId, dto);

            // Avoid route-generation failures from CreatedAtAction when the route
            // value cannot be resolved at runtime.
            if (string.IsNullOrWhiteSpace(company.Id))
                return Ok(company);

            return Created($"/api/companies/{company.Id}", company);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating company");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{companyId}")]
    public async Task<ActionResult> GetCompany(string companyId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var company = await _companyService.GetCompanyAsync(companyId);
            return Ok(company);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting company");
            return NotFound(new { error = ex.Message });
        }
    }

    // ============ PHASE 2: LEGAL INFO & DOCUMENTS ============

    [HttpPost("{companyId}/legal")]
    public async Task<ActionResult> UpdateLegalInfo(string companyId, [FromBody] UpdateLegalInfoRequest request)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var company = await _companyService.UpdateLegalInfoAsync(companyId, request);
            return Ok(company);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating legal info");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{companyId}/documents")]
    public async Task<ActionResult<DocumentStatusResponse>> UploadDocument(string companyId, [FromForm] DocumentUploadRequest request)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var doc = await _companyService.UploadDocumentAsync(companyId, request);
            return Ok(doc);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading document");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{companyId}/documents")]
    public async Task<ActionResult<List<DocumentStatusResponse>>> GetDocuments(string companyId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var docs = await _companyService.GetDocumentStatusAsync(companyId);
            return Ok(docs);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting documents");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{companyId}/beneficial-owners")]
    public async Task<ActionResult> UpdateBeneficialOwners(string companyId, [FromBody] UpdateBeneficialOwnersRequest request)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var company = await _companyService.UpdateBeneficialOwnersAsync(companyId, request);
            return Ok(company);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating beneficial owners");
            return BadRequest(new { error = ex.Message });
        }
    }

    // ============ PHASE 3: FINANCIAL & KPI ============

    [HttpPost("{companyId}/revenue")]
    public async Task<ActionResult> SaveRevenue(string companyId, [FromBody] SaveRevenueDataRequest request)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var company = await _companyService.SaveRevenueDataAsync(companyId, request);
            return Ok(company);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving revenue");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{companyId}/valuation")]
    public async Task<ActionResult<FinancialSummaryResponse>> CalculateValuation(string companyId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var result = await _companyService.CalculateValuationAsync(companyId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating valuation");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{companyId}/equity-structure")]
    public async Task<ActionResult> SaveEquityStructure(string companyId, [FromBody] SaveEquityStructureRequest request)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var company = await _companyService.SaveEquityStructureAsync(companyId, request);
            return Ok(company);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving equity structure");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{companyId}/funding-ask")]
    public async Task<ActionResult> SaveFundingAsk(string companyId, [FromBody] SaveFundingAskRequest request)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var company = await _companyService.SaveFundingAskAsync(companyId, request);
            return Ok(company);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving funding ask");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{companyId}/pitch-deck")]
    public async Task<ActionResult<PitchDeckResponse>> UploadPitchDeck(string companyId, [FromForm] PitchDeckUploadRequest request)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var result = await _companyService.UploadPitchDeckAsync(companyId, request);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading pitch deck");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{companyId}/pitch-deck")]
    public async Task<ActionResult<PitchDeckResponse?>> GetPitchDeck(string companyId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var result = await _companyService.GetPitchDeckAsync(companyId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading pitch deck");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{companyId}/funding-narrative")]
    public async Task<ActionResult> SaveFundingNarrative(string companyId, [FromBody] SaveFundingNarrativeRequest request)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var company = await _companyService.SaveFundingNarrativeAsync(companyId, request?.Narrative ?? string.Empty);
            return Ok(new { narrative = company.FundingNarrative });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving funding narrative");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{companyId}/funding-narrative")]
    public async Task<ActionResult<FundingNarrativeResponse>> GetFundingNarrative(string companyId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var result = await _companyService.GetFundingNarrativeAsync(companyId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading funding narrative");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{companyId}/outreach-campaign")]
    public async Task<ActionResult> SaveOutreachCampaign(string companyId, [FromBody] SaveOutreachCampaignRequest request)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            await _companyService.SaveOutreachCampaignAsync(
                companyId,
                request?.InvestorIds ?? new List<string>(),
                request?.Template ?? string.Empty);
            return Ok();
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving outreach campaign");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{companyId}/funding-profile")]
    public async Task<ActionResult<FundingProfileResponse>> GetFundingProfile(string companyId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var result = await _companyService.GetFundingProfileAsync(companyId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading funding profile");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{companyId}/financial-summary")]
    public async Task<ActionResult<FinancialSummaryResponse>> GetFinancialSummary(string companyId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var result = await _companyService.GetFinancialSummaryAsync(companyId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting financial summary");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{companyId}/cash-position")]
    public async Task<ActionResult> SaveCashPosition(string companyId, [FromBody] SaveCashPositionRequest request)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var company = await _companyService.SaveCashPositionAsync(companyId, request);
            return Ok(new { currentFunds = company.CurrentFunds, monthlyBurn = company.MonthlyBurn });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving cash position");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{companyId}/monthly-revenue")]
    public async Task<ActionResult<List<MonthlyRevenueResponse>>> SaveMonthlyRevenue(
        string companyId, [FromBody] SaveMonthlyRevenueRequest request)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var result = await _companyService.SaveMonthlyRevenueAsync(companyId, request);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving monthly revenue");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{companyId}/monthly-revenue")]
    public async Task<ActionResult<List<MonthlyRevenueResponse>>> GetMonthlyRevenue(string companyId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var result = await _companyService.GetMonthlyRevenueAsync(companyId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading monthly revenue");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{companyId}/kpis")]
    public async Task<ActionResult<KpiBaselineResponse>> SaveKpiBaseline(
        string companyId, [FromBody] SaveKpiBaselineRequest request)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var result = await _companyService.SaveKpiBaselineAsync(companyId, request);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving KPI baseline");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{companyId}/kpis")]
    public async Task<ActionResult<KpiBaselineResponse?>> GetKpiBaseline(string companyId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var result = await _companyService.GetKpiBaselineAsync(companyId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading KPI baseline");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{companyId}/financial-reports")]
    public async Task<ActionResult<FinancialReportResponse>> UploadFinancialReport(
        string companyId, [FromForm] FinancialReportUploadRequest request)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var result = await _companyService.UploadFinancialReportAsync(companyId, request);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading financial report");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{companyId}/financial-reports")]
    public async Task<ActionResult<List<FinancialReportResponse>>> GetFinancialReports(string companyId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var result = await _companyService.GetFinancialReportsAsync(companyId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading financial reports");
            return BadRequest(new { error = ex.Message });
        }
    }

    // ============ PHASE 4: EQUITY & DILUTION ============

    [HttpGet("{companyId}/cap-table")]
    public async Task<ActionResult> GetCapTable(string companyId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var result = await _companyService.GetCapTableAsync(companyId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cap table");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{companyId}/dilution-simulation")]
    public async Task<ActionResult<DilutionSimulationResponse>> SimulateDilution(string companyId, [FromBody] SimulateDilutionRequest request)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var result = await _companyService.SimulateDilutionAsync(companyId, request);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error simulating dilution");
            return BadRequest(new { error = ex.Message });
        }
    }

    // ============ PHASE 4: CAP TABLE SUBMISSION / VESTING / OWNERSHIP HISTORY / ISSUANCE ============

    [HttpPost("{companyId}/cap-table")]
    public async Task<ActionResult<CapTableSnapshotResponse>> SubmitCapTable(
        string companyId, [FromBody] SubmitCapTableRequest request)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var result = await _companyService.SubmitCapTableAsync(companyId, request);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting cap table");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{companyId}/cap-table/snapshot")]
    public async Task<ActionResult<CapTableSnapshotResponse?>> GetLatestCapTableSnapshot(string companyId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var result = await _companyService.GetLatestCapTableSnapshotAsync(companyId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading cap table snapshot");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{companyId}/vesting")]
    public async Task<ActionResult<List<VestingScheduleResponse>>> SaveVesting(
        string companyId, [FromBody] SaveVestingScheduleRequest request)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var result = await _companyService.SaveVestingSchedulesAsync(companyId, request);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving vesting schedules");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{companyId}/vesting")]
    public async Task<ActionResult<List<VestingScheduleResponse>>> GetVesting(string companyId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var result = await _companyService.GetVestingSchedulesAsync(companyId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading vesting schedules");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{companyId}/ownership-history")]
    public async Task<ActionResult<List<OwnershipHistoryResponse>>> SaveOwnershipHistory(
        string companyId, [FromBody] SaveOwnershipHistoryRequest request)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var result = await _companyService.SaveOwnershipHistoryAsync(companyId, request);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving ownership history");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{companyId}/ownership-history")]
    public async Task<ActionResult<List<OwnershipHistoryResponse>>> GetOwnershipHistory(string companyId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var result = await _companyService.GetOwnershipHistoryAsync(companyId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading ownership history");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{companyId}/share-issuance")]
    public async Task<ActionResult<ShareIssuanceResponse>> RecordShareIssuance(
        string companyId, [FromBody] RecordShareIssuanceRequest request)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var result = await _companyService.RecordShareIssuanceAsync(companyId, request);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording share issuance");
            return BadRequest(new { error = ex.Message });
        }
    }

    // ============ PHASE 6: DATA ROOM ============

    [HttpPost("{companyId}/dataroom/documents")]
    public async Task<ActionResult<DataRoomDocumentResponse>> UploadDataRoomDocument(string companyId, [FromForm] UploadDataRoomDocumentRequest request)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var doc = await _companyService.UploadDataRoomDocumentAsync(companyId, request, userId);
            return Ok(doc);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading data room document");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{companyId}/dataroom")]
    public async Task<ActionResult<DataRoomStatusResponse>> GetDataRoom(string companyId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var result = await _companyService.GetDataRoomStatusAsync(companyId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting data room");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{companyId}/dataroom/access")]
    public async Task<ActionResult<DataRoomStatusResponse>> GrantDataRoomAccess(string companyId, [FromBody] DataRoomAccessRequest request)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var result = await _companyService.GrantDataRoomAccessAsync(companyId, request);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error granting data room access");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{companyId}/dataroom/access/{investorId}")]
    public async Task<ActionResult> RevokeDataRoomAccess(string companyId, string investorId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            await _companyService.RevokeDataRoomAccessAsync(companyId, investorId);
            return Ok();
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error revoking data room access");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{companyId}/dataroom/nda")]
    public async Task<ActionResult> UpdateNdaRequirement(string companyId, [FromBody] bool required)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            await _companyService.UpdateNdaRequirementAsync(companyId, required);
            return Ok();
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating NDA requirement");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{companyId}/dataroom/publish")]
    public async Task<ActionResult<DataRoomStatusResponse>> PublishDataRoom(string companyId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var result = await _companyService.PublishDataRoomAsync(companyId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error publishing data room");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{companyId}/dataroom/documents/{documentId}")]
    public async Task<IActionResult> DownloadDataRoomDocument(string companyId, string documentId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);

            // Determine if the caller is the company owner; if not, the service
            // performs the grant + NDA check internally (no IDOR — caller's own
            // user id is what's checked against the grant list).
            var company = await _companyService.GetCompanyAsync(companyId);
            var callerIsOwner = string.Equals(company.OwnerId, userId, StringComparison.Ordinal);

            var (bytes, doc) = await _companyService.DownloadDataRoomDocumentAsync(
                companyId, documentId, userId, callerIsOwner);

            return File(bytes, doc.MimeType ?? "application/octet-stream", doc.FileName);
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
            _logger.LogError(ex, "Error downloading data room document");
            return BadRequest(new { error = ex.Message });
        }
    }

    private static string HashIp(HttpContext ctx)
    {
        var ip = ctx.Connection.RemoteIpAddress?.ToString() ?? string.Empty;
        var bytes = System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(ip));
        return Convert.ToHexString(bytes);
    }

    [HttpPost("{companyId}/dataroom/track-view")]
    public async Task<ActionResult<Phase6AccessLogResponse>> TrackDataRoomView(
        string companyId, [FromBody] TrackDataRoomEventRequest request)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            // Investor's own id is bound from the auth token; owners can also track
            // their own previews. No IDOR — investorId is NEVER taken from the body.
            // Same authorization policy as a real document access.
            var company = await _companyService.GetCompanyAsync(companyId);
            var callerIsOwner = string.Equals(company.OwnerId, userId, StringComparison.Ordinal);
            var result = await _companyService.TrackDataRoomEventAsync(
                companyId, request?.DocumentId, userId, callerIsOwner, "view", HashIp(HttpContext));
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error tracking data room view");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{companyId}/dataroom/track-download")]
    public async Task<ActionResult<Phase6AccessLogResponse>> TrackDataRoomDownload(
        string companyId, [FromBody] TrackDataRoomEventRequest request)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            var company = await _companyService.GetCompanyAsync(companyId);
            var callerIsOwner = string.Equals(company.OwnerId, userId, StringComparison.Ordinal);
            var result = await _companyService.TrackDataRoomEventAsync(
                companyId, request?.DocumentId, userId, callerIsOwner, "download", HashIp(HttpContext));
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error tracking data room download");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{companyId}/dataroom/analytics")]
    public async Task<ActionResult<DataRoomAnalyticsResponse>> GetDataRoomAnalytics(string companyId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var result = await _companyService.GetDataRoomAnalyticsAsync(companyId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading data room analytics");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{companyId}/dataroom/activity-timeline")]
    public async Task<ActionResult<List<Phase6AccessLogResponse>>> GetDataRoomActivityTimeline(string companyId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var result = await _companyService.GetDataRoomActivityTimelineAsync(companyId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading data room activity timeline");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{companyId}/dataroom/investor-engagement")]
    public async Task<ActionResult<List<InvestorEngagementResponse>>> GetInvestorEngagement(string companyId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var analytics = await _companyService.GetDataRoomAnalyticsAsync(companyId);
            return Ok(analytics.InvestorEngagement);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading investor engagement");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{companyId}/dataroom/nda/accept")]
    public async Task<ActionResult> AcceptDataRoomNda(string companyId, [FromBody] AcceptNdaRequest request)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            // Note: NDA acceptance is INVESTOR-side; do NOT enforce ownership.
            await _companyService.AcceptDataRoomNdaAsync(
                companyId, userId, request?.NdaText ?? string.Empty, HashIp(HttpContext));
            return Ok();
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording NDA acceptance");
            return BadRequest(new { error = ex.Message });
        }
    }

    // ============ PHASE 7: AI REVIEW ============

    [HttpPost("{companyId}/ai-review")]
    public async Task<ActionResult<AiReviewResponse>> RunAiReview(string companyId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var result = await _companyService.RunAiReviewAsync(companyId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error running AI review");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{companyId}/ai-review")]
    public async Task<ActionResult<AiReviewResponse>> GetAiReview(string companyId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var result = await _companyService.GetAiReviewScoreAsync(companyId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting AI review");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{companyId}/recommendations")]
    public async Task<ActionResult<List<RecommendationDto>>> GetRecommendations(string companyId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var result = await _companyService.GetRecommendationsAsync(companyId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recommendations");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{companyId}/investor-ready")]
    public async Task<ActionResult> AwardInvestorReadyBadge(string companyId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            await _companyService.AwardInvestorReadyBadgeAsync(companyId);
            return Ok();
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error awarding investor ready badge");
            return BadRequest(new { error = ex.Message });
        }
    }

    // ============ PHASE 8: INVESTOR MATCHING ============

    [HttpGet("{companyId}/investor-matches")]
    public async Task<ActionResult<List<InvestorMatchResponse>>> GetInvestorMatches(string companyId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var result = await _companyService.GetMatchedInvestorsAsync(companyId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting investor matches");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{companyId}/investor-interaction")]
    public async Task<ActionResult> RecordInvestorInteraction(string companyId, [FromBody] RecordInteractionRequest request)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            await _companyService.RecordInvestorInteractionAsync(companyId, request);
            return Ok();
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording investor interaction");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{companyId}/matching-insights")]
    public async Task<ActionResult> GetMatchingInsights(string companyId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var result = await _companyService.GetMatchingInsightsAsync(companyId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting matching insights");
            return BadRequest(new { error = ex.Message });
        }
    }

    // ============ PHASE 9: DEAL EXECUTION ============

    [HttpPost("{companyId}/deals")]
    public async Task<ActionResult<DealStatusResponse>> CreateDeal(string companyId, [FromBody] CreateDealRequest request)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            request.InvestorId ??= string.Empty; // Ensure it's set
            var result = await _companyService.CreateDealAsync(companyId, request);
            return CreatedAtAction(nameof(GetDeal), new { dealId = result.DealId }, result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating deal");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("deals/{dealId}")]
    public async Task<ActionResult<DealStatusResponse>> GetDeal(string dealId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureDealOwnershipAsync(dealId);
            var result = await _companyService.GetDealAsync(dealId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting deal");
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpGet("{companyId}/deals")]
    public async Task<ActionResult<List<DealStatusResponse>>> GetCompanyDeals(string companyId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var result = await _companyService.GetCompanyDealsAsync(companyId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting company deals");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("deals/{dealId}/term-sheet")]
    public async Task<ActionResult<DealStatusResponse>> UpdateTermSheet(string dealId, [FromBody] TermSheetRequest request)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureDealOwnershipAsync(dealId);
            var result = await _companyService.UpdateTermSheetAsync(dealId, request);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating term sheet");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("deals/{dealId}/checklist")]
    public async Task<ActionResult<DealStatusResponse>> ProgressChecklist(string dealId, [FromBody] ChecklistItemDto item)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureDealOwnershipAsync(dealId);
            var result = await _companyService.ProgressChecklistAsync(dealId, item);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error progressing checklist");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("deals/{dealId}/close")]
    public async Task<ActionResult<DealStatusResponse>> CloseDeal(string dealId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureDealOwnershipAsync(dealId);
            var result = await _companyService.CloseDealAsync(dealId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error closing deal");
            return BadRequest(new { error = ex.Message });
        }
    }
}
