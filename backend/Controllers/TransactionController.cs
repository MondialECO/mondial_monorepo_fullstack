using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Interface;

namespace WebApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
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
            var result = await _service.CreateTransactionAsync(transaction);
            return Ok(result);
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetByUser(string userId)
        {
            var transactions = await _service.GetByUserAsync(userId);
            return Ok(transactions);
        }

        [HttpGet("recent")]
        public async Task<IActionResult> GetRecent()
        {
            var transactions = await _service.GetRecentAsync();
            return Ok(transactions);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(string id)
        {
            await _service.DeleteTransactionAsync(id);
            return NoContent();
        }
    }
}
