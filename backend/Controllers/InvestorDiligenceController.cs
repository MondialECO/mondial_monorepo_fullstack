using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services;

namespace WebApp.Controllers;

[ApiController]
[Route("api/investor/companies/{companyId}/diligence")]
[Authorize]
public class InvestorDiligenceController : ControllerBase
{
    private readonly IDiligenceService _diligenceService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<InvestorDiligenceController> _logger;

    public InvestorDiligenceController(
        IDiligenceService diligenceService,
        UserManager<ApplicationUser> userManager,
        ILogger<InvestorDiligenceController> logger)
    {
        _diligenceService = diligenceService;
        _userManager = userManager;
        _logger = logger;
    }

    private string GetUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("User not authenticated");
    }

    private async Task<string> ResolveInvestorIdAsync()
    {
        var userId = GetUserId();
        var user = await _userManager.FindByIdAsync(userId);
        var investorId = user?.InvestorProfile?.InvestorId;
        if (string.IsNullOrWhiteSpace(investorId))
        {
            // Fallback to userId if investor profile ID is not separately set
            investorId = userId;
        }
        return investorId;
    }

    [HttpGet]
    public async Task<ActionResult<DiligenceSummaryResponse>> GetSummary(string companyId)
    {
        try
        {
            var userId = GetUserId();
            var investorId = await ResolveInvestorIdAsync();
            var result = await _diligenceService.GetDiligenceSummaryAsync(investorId, companyId, userId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting diligence summary for company {CompanyId}", companyId);
            return StatusCode(500, new { message = "An error occurred fetching diligence summary" });
        }
    }

    [HttpPut("documents/{documentId}/review")]
    public async Task<ActionResult<DiligenceReviewDto>> UpdateReviewStatus(
        string companyId,
        string documentId,
        [FromBody] UpdateDocumentReviewRequest request)
    {
        try
        {
            var userId = GetUserId();
            var investorId = await ResolveInvestorIdAsync();
            var result = await _diligenceService.UpdateDocumentReviewStatusAsync(
                investorId, companyId, documentId, request.Status, userId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating document review for doc {DocumentId}", documentId);
            return StatusCode(500, new { message = "An error occurred updating review status" });
        }
    }

    [HttpGet("notes")]
    public async Task<ActionResult<List<DiligenceNoteDto>>> GetNotes(string companyId, [FromQuery] string? documentId = null)
    {
        try
        {
            var userId = GetUserId();
            var investorId = await ResolveInvestorIdAsync();
            var result = await _diligenceService.GetPrivateNotesAsync(investorId, companyId, documentId, userId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting diligence notes for company {CompanyId}", companyId);
            return StatusCode(500, new { message = "An error occurred fetching notes" });
        }
    }

    [HttpPost("notes")]
    public async Task<ActionResult<DiligenceNoteDto>> CreateNote(
        string companyId,
        [FromBody] CreateDiligenceNoteRequest request)
    {
        try
        {
            var userId = GetUserId();
            var investorId = await ResolveInvestorIdAsync();
            var result = await _diligenceService.AddPrivateNoteAsync(
                investorId, companyId, request.DocumentId, request.Content, userId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating diligence note for company {CompanyId}", companyId);
            return StatusCode(500, new { message = "An error occurred creating note" });
        }
    }

    [HttpDelete("notes/{noteId}")]
    public async Task<ActionResult> DeleteNote(string companyId, string noteId)
    {
        try
        {
            var userId = GetUserId();
            var investorId = await ResolveInvestorIdAsync();
            var success = await _diligenceService.DeletePrivateNoteAsync(investorId, companyId, noteId, userId);
            if (!success) return NotFound(new { message = "Note not found" });
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting diligence note {NoteId}", noteId);
            return StatusCode(500, new { message = "An error occurred deleting note" });
        }
    }

    [HttpGet("questions")]
    public async Task<ActionResult<List<DiligenceQuestionDto>>> GetQuestions(
        string companyId,
        [FromQuery] string? documentId = null)
    {
        try
        {
            var investorId = await ResolveInvestorIdAsync();
            var result = await _diligenceService.GetDiligenceQuestionsAsync(investorId, companyId, isFounder: false, documentId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting diligence questions for company {CompanyId}", companyId);
            return StatusCode(500, new { message = "An error occurred fetching questions" });
        }
    }

    [HttpPost("questions")]
    public async Task<ActionResult<DiligenceQuestionDto>> AskQuestion(
        string companyId,
        [FromBody] AskDiligenceQuestionRequest request)
    {
        try
        {
            var userId = GetUserId();
            var investorId = await ResolveInvestorIdAsync();
            var result = await _diligenceService.AskFounderQuestionAsync(
                investorId, companyId, request.DocumentId, request.DocumentTitle, request.Question, userId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error asking diligence question for company {CompanyId}", companyId);
            return StatusCode(500, new { message = "An error occurred asking question" });
        }
    }

    [HttpPost("complete")]
    public async Task<ActionResult<DiligenceSummaryResponse>> CompleteDiligence(string companyId)
    {
        try
        {
            var userId = GetUserId();
            var investorId = await ResolveInvestorIdAsync();
            var result = await _diligenceService.CompleteDiligenceAsync(investorId, companyId, userId);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing diligence for company {CompanyId}", companyId);
            return StatusCode(500, new { message = "An error occurred completing diligence" });
        }
    }

    [HttpPost("reopen")]
    public async Task<ActionResult<DiligenceSummaryResponse>> ReopenDiligence(string companyId)
    {
        try
        {
            var userId = GetUserId();
            var investorId = await ResolveInvestorIdAsync();
            var result = await _diligenceService.ReopenDiligenceAsync(investorId, companyId, userId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reopening diligence for company {CompanyId}", companyId);
            return StatusCode(500, new { message = "An error occurred reopening diligence" });
        }
    }

    [HttpPut("checklist/{categoryKey}")]
    public async Task<ActionResult<DiligenceSummaryResponse>> UpdateChecklistOverride(
        string companyId,
        string categoryKey,
        [FromBody] UpdateChecklistOverrideRequest request)
    {
        try
        {
            var userId = GetUserId();
            var investorId = await ResolveInvestorIdAsync();
            var result = await _diligenceService.UpdateChecklistOverrideAsync(
                investorId, companyId, categoryKey, request.Status, userId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating checklist override for category {CategoryKey}", categoryKey);
            return StatusCode(500, new { message = "An error occurred updating checklist" });
        }
    }
}
