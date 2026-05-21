using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WebApp.Models.Dtos;
using WebApp.Services;

namespace WebApp.Controllers;

[ApiController]
[Route("api/companies")]
[Authorize]
public class CompanyController : ControllerBase
{
    private readonly ICompanyService _companyService;
    private readonly ILogger<CompanyController> _logger;

    public CompanyController(ICompanyService companyService, ILogger<CompanyController> logger)
    {
        _companyService = companyService;
        _logger = logger;
    }

    private string GetUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("User not authenticated");
    }

    // ============ PHASE FLOW ============

    [HttpGet("current-phase")]
    public async Task<ActionResult<CompanyProgressResponse>> GetCurrentPhase()
    {
        try
        {
            var userId = GetUserId();
            var result = await _companyService.GetCurrentPhaseAsync(userId);
            return Ok(result);
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
            var result = await _companyService.AdvancePhaseAsync(userId, phaseNumber, phaseData);
            return Ok(result);
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
            var result = await _companyService.GetPhaseProgressAsync(userId);
            return Ok(result);
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
            var company = await _companyService.CreateCompanyAsync(userId, dto);
            return CreatedAtAction(nameof(GetCompany), new { companyId = company.Id }, company);
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
            var company = await _companyService.GetCompanyAsync(companyId);
            return Ok(company);
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
            var company = await _companyService.UpdateLegalInfoAsync(companyId, request);
            return Ok(company);
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
            var doc = await _companyService.UploadDocumentAsync(companyId, request);
            return Ok(doc);
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
            var docs = await _companyService.GetDocumentStatusAsync(companyId);
            return Ok(docs);
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
            var company = await _companyService.UpdateBeneficialOwnersAsync(companyId, request);
            return Ok(company);
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
            var company = await _companyService.SaveRevenueDataAsync(companyId, request);
            return Ok(company);
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
            var result = await _companyService.CalculateValuationAsync(companyId);
            return Ok(result);
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
            var company = await _companyService.SaveEquityStructureAsync(companyId, request);
            return Ok(company);
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
            var company = await _companyService.SaveFundingAskAsync(companyId, request);
            return Ok(company);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving funding ask");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{companyId}/financial-summary")]
    public async Task<ActionResult<FinancialSummaryResponse>> GetFinancialSummary(string companyId)
    {
        try
        {
            var result = await _companyService.GetFinancialSummaryAsync(companyId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting financial summary");
            return BadRequest(new { error = ex.Message });
        }
    }

    // ============ PHASE 4: EQUITY & DILUTION ============

    [HttpGet("{companyId}/cap-table")]
    public async Task<ActionResult> GetCapTable(string companyId)
    {
        try
        {
            var result = await _companyService.GetCapTableAsync(companyId);
            return Ok(result);
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
            var result = await _companyService.SimulateDilutionAsync(companyId, request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error simulating dilution");
            return BadRequest(new { error = ex.Message });
        }
    }

    // ============ PHASE 6: DATA ROOM ============

    [HttpPost("{companyId}/dataroom/documents")]
    public async Task<ActionResult<DataRoomDocumentResponse>> UploadDataRoomDocument(string companyId, [FromForm] UploadDataRoomDocumentRequest request)
    {
        try
        {
            var doc = await _companyService.UploadDataRoomDocumentAsync(companyId, request);
            return Ok(doc);
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
            var result = await _companyService.GetDataRoomStatusAsync(companyId);
            return Ok(result);
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
            var result = await _companyService.GrantDataRoomAccessAsync(companyId, request);
            return Ok(result);
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
            await _companyService.RevokeDataRoomAccessAsync(companyId, investorId);
            return Ok();
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
            await _companyService.UpdateNdaRequirementAsync(companyId, required);
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating NDA requirement");
            return BadRequest(new { error = ex.Message });
        }
    }

    // ============ PHASE 7: AI REVIEW ============

    [HttpPost("{companyId}/ai-review")]
    public async Task<ActionResult<AiReviewResponse>> RunAiReview(string companyId)
    {
        try
        {
            var result = await _companyService.RunAiReviewAsync(companyId);
            return Ok(result);
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
            var result = await _companyService.GetAiReviewScoreAsync(companyId);
            return Ok(result);
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
            var result = await _companyService.GetRecommendationsAsync(companyId);
            return Ok(result);
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
            await _companyService.AwardInvestorReadyBadgeAsync(companyId);
            return Ok();
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
            var result = await _companyService.GetMatchedInvestorsAsync(companyId);
            return Ok(result);
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
            await _companyService.RecordInvestorInteractionAsync(companyId, request);
            return Ok();
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
            var result = await _companyService.GetMatchingInsightsAsync(companyId);
            return Ok(result);
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
            request.InvestorId ??= string.Empty; // Ensure it's set
            var result = await _companyService.CreateDealAsync(companyId, request);
            return CreatedAtAction(nameof(GetDeal), new { dealId = result.DealId }, result);
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
            var result = await _companyService.GetDealAsync(dealId);
            return Ok(result);
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
            var result = await _companyService.GetCompanyDealsAsync(companyId);
            return Ok(result);
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
            var result = await _companyService.UpdateTermSheetAsync(dealId, request);
            return Ok(result);
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
            var result = await _companyService.ProgressChecklistAsync(dealId, item);
            return Ok(result);
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
            var result = await _companyService.CloseDealAsync(dealId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error closing deal");
            return BadRequest(new { error = ex.Message });
        }
    }
}
