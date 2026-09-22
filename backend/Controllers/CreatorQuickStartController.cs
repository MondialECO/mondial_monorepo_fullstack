using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApp.Models;
using WebApp.Models.Dtos;
using WebApp.Services.Interface;

namespace WebApp.Controllers;

[ApiController]
[Route("api/creator/quick-start")]
[Authorize]
public class CreatorQuickStartController : ControllerBase
{
    private readonly ICreatorQuickStartService _quickStartService;

    public CreatorQuickStartController(ICreatorQuickStartService quickStartService)
    {
        _quickStartService = quickStartService;
    }

    private string? CurrentUserId => User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    [HttpGet("status")]
    [HttpGet]
    public async Task<IActionResult> GetStatus(CancellationToken ct)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(ApiResponse.Error("User is not authenticated.", HttpContext.TraceIdentifier));

        try
        {
            var status = await _quickStartService.GetStatusAsync(userId, ct);
            return Ok(ApiResponse.Ok("HumainX Quick Start status retrieved.", status));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
        }
    }

    [HttpPost("step1")]
    [HttpPost("step-1")]
    public async Task<IActionResult> ConfirmStep1([FromBody] QuickStartStep1RequestDto dto, CancellationToken ct)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(ApiResponse.Error("User is not authenticated.", HttpContext.TraceIdentifier));

        try
        {
            var status = await _quickStartService.ConfirmStep1Async(userId, dto, ct);
            return Ok(ApiResponse.Ok("Step 1 confirmed successfully.", status));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
        }
    }

    [HttpPost("step2")]
    [HttpPost("step-2")]
    public async Task<IActionResult> ConfirmStep2([FromBody] QuickStartStep2RequestDto dto, CancellationToken ct)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(ApiResponse.Error("User is not authenticated.", HttpContext.TraceIdentifier));

        try
        {
            var status = await _quickStartService.ConfirmStep2Async(userId, dto, ct);
            return Ok(ApiResponse.Ok("Step 2 confirmed successfully.", status));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
        }
    }

    [HttpPost("complete")]
    [HttpPost("step3")]
    [HttpPost("step-3")]
    public async Task<IActionResult> Complete([FromBody] QuickStartStep3RequestDto dto, CancellationToken ct)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(ApiResponse.Error("User is not authenticated.", HttpContext.TraceIdentifier));

        try
        {
            var status = await _quickStartService.CompleteAsync(userId, dto, ct);
            return Ok(ApiResponse.Ok("HumainX Quick Start completed successfully.", status));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.Error(ex.Message, HttpContext.TraceIdentifier));
        }
    }
}
