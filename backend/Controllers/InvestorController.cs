using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services;

namespace WebApp.Controllers;

[ApiController]
[Route("api/investors")]
[Authorize]
public class InvestorController : ControllerBase
{
    private readonly IInvestorService _investorService;
    private readonly MongoDbContext _dbContext;
    private readonly ILogger<InvestorController> _logger;

    public InvestorController(
        IInvestorService investorService,
        MongoDbContext dbContext,
        ILogger<InvestorController> logger)
    {
        _investorService = investorService;
        _dbContext = dbContext;
        _logger = logger;
    }

    [HttpPost]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<AdminInvestorDto>> CreateInvestor([FromBody] Investor investor)
    {
        try
        {
            var result = await _investorService.CreateInvestorAsync(investor);
            var dto = AdminInvestorDto.FromInvestor(result);
            return CreatedAtAction(nameof(GetInvestor), new { investorId = result.Id }, dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating investor");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{investorId}")]
    public async Task<ActionResult<PublicInvestorProfileDto>> GetInvestor(string investorId)
    {
        try
        {
            var investor = await _investorService.GetInvestorAsync(investorId);
            bool isVerified = false;
            if (!string.IsNullOrWhiteSpace(investor.LinkedUserId))
            {
                var user = await _dbContext.ApplicationUsers
                    .Find(u => u.Id.ToString() == investor.LinkedUserId)
                    .FirstOrDefaultAsync();
                isVerified = user?.InvestorProfile?.FinanceVerified == true;
            }
            return Ok(PublicInvestorProfileDto.FromInvestor(investor, isVerified));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting investor");
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpGet("admin/{investorId}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<AdminInvestorDto>> GetAdminInvestor(string investorId)
    {
        try
        {
            var investor = await _investorService.GetInvestorAsync(investorId);
            bool isVerified = false;
            if (!string.IsNullOrWhiteSpace(investor.LinkedUserId))
            {
                var user = await _dbContext.ApplicationUsers
                    .Find(u => u.Id.ToString() == investor.LinkedUserId)
                    .FirstOrDefaultAsync();
                isVerified = user?.InvestorProfile?.FinanceVerified == true;
            }
            return Ok(AdminInvestorDto.FromInvestor(investor, isVerified));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting admin investor");
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpGet]
    public async Task<ActionResult<List<PublicInvestorProfileDto>>> GetAllInvestors()
    {
        try
        {
            var investors = await _investorService.GetAllActiveInvestorsAsync();
            return Ok(investors.Select(i => PublicInvestorProfileDto.FromInvestor(i)).ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting investors");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("search")]
    public async Task<ActionResult<List<PublicInvestorProfileDto>>> FindInvestors(
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

            return Ok(investors.Select(i => PublicInvestorProfileDto.FromInvestor(i)).ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching investors");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{investorId}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<AdminInvestorDto>> UpdateInvestor(string investorId, [FromBody] Investor investor)
    {
        try
        {
            investor.Id = investorId;
            var result = await _investorService.UpdateInvestorAsync(investorId, investor);
            return Ok(AdminInvestorDto.FromInvestor(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating investor");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{investorId}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
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
    [Authorize(Roles = "Admin,SuperAdmin")]
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
