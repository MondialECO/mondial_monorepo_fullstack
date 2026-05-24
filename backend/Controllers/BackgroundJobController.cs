using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using WebApp.Models.DatabaseModels;
using WebApp.Services;

namespace WebApp.Controllers;

[ApiController]
[Route("api/jobs")]
[Authorize]
public class BackgroundJobController : ControllerBase
{
    private readonly IBackgroundJobService _backgroundJobService;
    private readonly ICompanyService _companyService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<BackgroundJobController> _logger;

    public BackgroundJobController(
        IBackgroundJobService backgroundJobService,
        ICompanyService companyService,
        UserManager<ApplicationUser> userManager,
        ILogger<BackgroundJobController> logger)
    {
        _backgroundJobService = backgroundJobService;
        _companyService = companyService;
        _userManager = userManager;
        _logger = logger;
    }

    private string GetUserId()
        => User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("User not authenticated");

    private async Task EnsureUniversalPhase1CompleteAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null || (user.Onboarding?.Phase ?? 0) < 1)
            throw new UnauthorizedAccessException("User must complete Universal Phase 1 onboarding before enqueuing jobs.");
    }

    private async Task EnsureCompanyOwnershipAsync(string companyId)
    {
        var userId = GetUserId();
        var company = await _companyService.GetCompanyAsync(companyId);
        if (!string.Equals(company.OwnerId, userId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException("You are not allowed to enqueue jobs for this company.");
    }

    [HttpPost("{companyId}/ai-review")]
    public async Task<ActionResult<object>> EnqueueAiReview(string companyId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var jobId = _backgroundJobService.EnqueueAiReview(companyId);
            _logger.LogInformation($"AI review job {jobId} enqueued for company {companyId}");
            return Accepted(new { jobId, status = "queued" });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error enqueueing AI review job");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{companyId}/investor-matching")]
    public async Task<ActionResult<object>> EnqueueInvestorMatching(string companyId)
    {
        try
        {
            var userId = GetUserId();
            await EnsureUniversalPhase1CompleteAsync(userId);
            await EnsureCompanyOwnershipAsync(companyId);
            var jobId = _backgroundJobService.EnqueueInvestorMatching(companyId);
            _logger.LogInformation($"Investor matching job {jobId} enqueued for company {companyId}");
            return Accepted(new { jobId, status = "queued" });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Authorization failed: {Message}", ex.Message);
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error enqueueing investor matching job");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{companyId}/data-room-analysis")]
    public async Task<ActionResult<object>> EnqueueDataRoomAnalysis(string companyId)
    {
        try
        {
            var jobId = _backgroundJobService.EnqueueDataRoomAnalysis(companyId);
            _logger.LogInformation($"Data room analysis job {jobId} enqueued for company {companyId}");
            return Accepted(new { jobId, status = "queued" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error enqueueing data room analysis job");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{companyId}/financial-projections")]
    public async Task<ActionResult<object>> EnqueueFinancialProjections(string companyId)
    {
        try
        {
            var jobId = _backgroundJobService.EnqueueFinancialProjections(companyId);
            _logger.LogInformation($"Financial projections job {jobId} enqueued for company {companyId}");
            return Accepted(new { jobId, status = "queued" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error enqueueing financial projections job");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{jobId}")]
    public async Task<ActionResult<JobStatus>> GetJobStatus(string jobId)
    {
        try
        {
            var status = await _backgroundJobService.GetJobStatusAsync(jobId);
            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting job status");
            return BadRequest(new { error = ex.Message });
        }
    }
}
