using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApp.Services;

namespace WebApp.Controllers;

[ApiController]
[Route("api/jobs")]
[Authorize]
public class BackgroundJobController : ControllerBase
{
    private readonly IBackgroundJobService _backgroundJobService;
    private readonly ILogger<BackgroundJobController> _logger;

    public BackgroundJobController(
        IBackgroundJobService backgroundJobService,
        ILogger<BackgroundJobController> logger)
    {
        _backgroundJobService = backgroundJobService;
        _logger = logger;
    }

    [HttpPost("{companyId}/ai-review")]
    public async Task<ActionResult<object>> EnqueueAiReview(string companyId)
    {
        try
        {
            var jobId = _backgroundJobService.EnqueueAiReview(companyId);
            _logger.LogInformation($"AI review job {jobId} enqueued for company {companyId}");
            return Accepted(new { jobId, status = "queued" });
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
            var jobId = _backgroundJobService.EnqueueInvestorMatching(companyId);
            _logger.LogInformation($"Investor matching job {jobId} enqueued for company {companyId}");
            return Accepted(new { jobId, status = "queued" });
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
