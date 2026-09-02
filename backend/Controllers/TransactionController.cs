using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Interface;

namespace WebApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TransactionController : ControllerBase
    {
        private readonly ITransactionsService _service;
        public TransactionController(ITransactionsService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<IActionResult> Create(Transactions transaction)
        {
            // Trust the JWT subject, not the request body. A caller cannot
            // fabricate a transaction under another user's id.
            var callerId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(callerId))
                return Unauthorized();
            transaction.UserId = callerId;

            var result = await _service.CreateTransactionAsync(transaction);
            return Ok(result);
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetByUser(string userId)
        {
            var callerId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.Equals(userId, callerId, StringComparison.Ordinal) && !User.IsInRole("Admin"))
                return Forbid();

            var transactions = await _service.GetByUserAsync(userId);
            return Ok(transactions);
        }

        [HttpGet("recent")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> GetRecent()
        {
            var transactions = await _service.GetRecentAsync();
            return Ok(transactions);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> Delete(string id)
        {
            await _service.DeleteTransactionAsync(id);
            return NoContent();
        }
    }
}
