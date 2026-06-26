using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApp.Models.DatabaseModels;
using WebApp.Services;

namespace WebApp.Controllers;

[ApiController]
[Route("api/investors")]
[Authorize]
public class InvestorController : ControllerBase
{
    private readonly IInvestorService _investorService;
    private readonly ILogger<InvestorController> _logger;

    public InvestorController(IInvestorService investorService, ILogger<InvestorController> logger)
    {
        _investorService = investorService;
        _logger = logger;
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Investor>> CreateInvestor([FromBody] Investor investor)
    {
        try
        {
            var result = await _investorService.CreateInvestorAsync(investor);
            return CreatedAtAction(nameof(GetInvestor), new { investorId = result.Id }, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating investor");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{investorId}")]
    public async Task<ActionResult<Investor>> GetInvestor(string investorId)
    {
        try
        {
            var investor = await _investorService.GetInvestorAsync(investorId);
            return Ok(investor);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting investor");
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpGet]
    public async Task<ActionResult<List<Investor>>> GetAllInvestors()
    {
        try
        {
            var investors = await _investorService.GetAllActiveInvestorsAsync();
            return Ok(investors);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting investors");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("search")]
    public async Task<ActionResult<List<Investor>>> FindInvestors(
        [FromQuery] string sectors,
        [FromQuery] string stages,
        [FromQuery] double minCheckSize = 0,
        [FromQuery] double maxCheckSize = double.MaxValue,
        [FromQuery] string geography = "")
    {
        try
        {
            var sectorList = string.IsNullOrEmpty(sectors) ? new List<string>() : sectors.Split(",").ToList();
            var stageList = string.IsNullOrEmpty(stages) ? new List<string>() : stages.Split(",").ToList();

            var investors = await _investorService.FindInvestorsByPreferencesAsync(
                sectorList,
                stageList,
                minCheckSize,
                maxCheckSize,
                geography
            );

            return Ok(investors);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching investors");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{investorId}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Investor>> UpdateInvestor(string investorId, [FromBody] Investor investor)
    {
        try
        {
            investor.Id = investorId;
            var result = await _investorService.UpdateInvestorAsync(investorId, investor);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating investor");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{investorId}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeleteInvestor(string investorId)
    {
        try
        {
            await _investorService.DeleteInvestorAsync(investorId);
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting investor");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{investorId}/match-count")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<object>> GetInvestorMatchCount(string investorId)
    {
        try
        {
            var count = await _investorService.GetInvestorMatchCountAsync(investorId);
            return Ok(new { investorId, matchCount = count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting investor match count");
            return BadRequest(new { error = ex.Message });
        }
    }
}
