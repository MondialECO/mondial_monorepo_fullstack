using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using MongoDB.Bson;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Interface;

namespace WebApp.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ChatController : ControllerBase
    {
        private readonly IChatService _chatService;
        private readonly IHubContext<ChatHub> _hub;

        public ChatController(
            IChatService chatRepo,
            IHubContext<ChatHub> hub)
        {
            _chatService = chatRepo;
            _hub = hub;
        }

        // Get current user ID from JWT token. ASP.NET Core 8 JwtBearer
        // remaps inbound "sub" → ClaimTypes.NameIdentifier by default
        // (JwtSecurityTokenHandler.DefaultMapInboundClaims = true), so we
        // must look up the mapped name here. Looking up "sub" directly
        // returns null (pre-SEC-10-Phase-2 bug).
        private Guid CurrentUserId =>
            Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? throw new UnauthorizedAccessException());

        // Conversation list
        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations()
        {
            var data = await _chatService.GetUserConversations(CurrentUserId);
            return Ok(data);
        }

        // Message history
        [HttpGet("messages/{conversationId}")]
        public async Task<IActionResult> GetMessages(
            string conversationId,
            int skip = 0,
            int limit = 30)
        {
            var conversationObjectId = ObjectId.Parse(conversationId);
            if (!await _chatService.IsParticipantAsync(conversationObjectId, CurrentUserId))
                return Forbid();

            var messages = await _chatService.GetMessages(
                conversationObjectId, skip, limit);

            return Ok(messages);
        }

        // 3️⃣ Send message (REST fallback)
        [HttpPost("send")]
        public async Task<IActionResult> SendMessage(SendMessageRequest request)
        {
            var conversationObjectId = ObjectId.Parse(request.ConversationId);
            if (!await _chatService.IsParticipantAsync(conversationObjectId, CurrentUserId))
                return Forbid();

            var message = new ChatMessage
            {
                ConversationId = conversationObjectId,
                SenderId = CurrentUserId,
                Message = request.Message
            };

           var data = await _chatService.AddMessage(message);

            // Try realtime delivery
            await _hub.Clients.Group(request.ConversationId)
                .SendAsync("ReceiveMessage", data);

            return Ok(data);
        }

        // Mark as read
        [HttpPost("read/{conversationId}")]
        public async Task<IActionResult> MarkRead(string conversationId)
        {
            var conversationObjectId = ObjectId.Parse(conversationId);
            if (!await _chatService.IsParticipantAsync(conversationObjectId, CurrentUserId))
                return Forbid();

            await _chatService.MarkAsRead(
                conversationObjectId,
                CurrentUserId
            );

            return Ok();
        }



    }
}
