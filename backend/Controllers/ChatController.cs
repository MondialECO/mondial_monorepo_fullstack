using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using MongoDB.Bson;
using MongoDB.Driver;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services;
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
        private readonly MongoDbContext _context;
        private readonly ICompanyService _companyService;
        private readonly IResponseRateService _responseRates;
        private readonly INotificationService _notifications;

        public ChatController(
            IChatService chatRepo,
            IHubContext<ChatHub> hub,
            MongoDbContext context,
            ICompanyService companyService,
            IResponseRateService responseRates,
            INotificationService notifications)
        {
            _chatService = chatRepo;
            _hub = hub;
            _context = context;
            _companyService = companyService;
            _responseRates = responseRates;
            _notifications = notifications;
        }

        // Get current user ID from JWT token. ASP.NET Core 8 JwtBearer
        // remaps inbound "sub" → ClaimTypes.NameIdentifier by default
        // (JwtSecurityTokenHandler.DefaultMapInboundClaims = true), so we
        // must look up the mapped name here. Looking up "sub" directly
        // returns null (pre-SEC-10-Phase-2 bug).
        private Guid CurrentUserId =>
            Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? throw new UnauthorizedAccessException());

        // Conversation list — enriched with participant identity + unread count.
        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations()
        {
            var data = await _chatService.GetUserConversations(CurrentUserId);
            return Ok(await ToDtosAsync(data));
        }

        // Create (or fetch the existing) direct conversation with another user.
        // Reuses GetOrCreateConversation, so repeat calls are idempotent and
        // never create duplicate Direct conversations between the same pair.
        // The caller is always taken from the JWT; only the counterpart comes
        // from the request body.
        [HttpPost("conversations")]
        public async Task<IActionResult> CreateConversation(CreateConversationRequest request)
        {
            if (!Guid.TryParse(request?.TargetUserId, out var targetUserId))
                return BadRequest(new { error = "A valid targetUserId is required." });

            if (targetUserId == CurrentUserId)
                return BadRequest(new { error = "Cannot create a conversation with yourself." });

            var (conversation, created) = await _chatService.GetOrCreateConversation(CurrentUserId, targetUserId);
            var dto = (await ToDtosAsync(new List<Conversation> { conversation }))[0];
            if (created) await BroadcastConversationCreatedAsync(conversation, dto);
            return Ok(dto);
        }

        // Create/get a conversation with a company's owner (founder) by company
        // id — the contextual "Message Founder" entry point. The owner is
        // resolved server-side, so callers never need the founder's user id.
        [HttpPost("conversations/by-company/{companyId}")]
        public async Task<IActionResult> CreateConversationByCompany(string companyId)
        {
            var company = await _companyService.GetCompanyAsync(companyId);
            if (company is null || string.IsNullOrEmpty(company.OwnerId)
                || !Guid.TryParse(company.OwnerId, out var ownerId))
                return NotFound(new { error = "Company or its owner could not be found." });

            if (ownerId == CurrentUserId)
                return BadRequest(new { error = "Cannot start a conversation with yourself." });

            var (conversation, created) = await _chatService.GetOrCreateConversation(CurrentUserId, ownerId);
            var dto = (await ToDtosAsync(new List<Conversation> { conversation }))[0];
            if (created) await BroadcastConversationCreatedAsync(conversation, dto);
            return Ok(dto);
        }

        // Push a freshly-created conversation to both participants' per-user
        // groups so their lists update live. unreadCount is 0 for a brand-new
        // conversation, so the same DTO is valid for every recipient.
        private async Task BroadcastConversationCreatedAsync(Conversation conversation, ConversationDto dto)
        {
            foreach (var participantId in conversation.Participants)
            {
                await _hub.Clients.Group(participantId.ToString())
                    .SendAsync("ConversationCreated", dto);
            }
        }

        // Map conversations to enriched DTOs: resolve participant names/avatars
        // from ApplicationUser and the caller's per-conversation unread counts.
        private async Task<List<ConversationDto>> ToDtosAsync(List<Conversation> conversations)
        {
            if (conversations.Count == 0) return new List<ConversationDto>();

            var participantIds = conversations
                .SelectMany(c => c.Participants)
                .Distinct()
                .ToList();

            var users = participantIds.Count > 0
                ? await _context.ApplicationUsers
                    .Find(u => participantIds.Contains(u.Id))
                    .ToListAsync()
                : new List<ApplicationUser>();
            var userMap = users.ToDictionary(u => u.Id);

            var unreadMap = await _chatService.CountUnreadByConversationAsync(
                conversations.Select(c => c.Id).ToList(), CurrentUserId);

            return conversations.Select(c => new ConversationDto
            {
                Id = c.Id.ToString(),
                Type = c.Type,
                LastMessage = c.LastMessage,
                LastMessageAt = c.LastMessageAt,
                CreatedAt = c.CreatedAt,
                UnreadCount = unreadMap.TryGetValue(c.Id.ToString(), out var n) ? n : 0,
                Participants = c.Participants.Select(pid =>
                {
                    userMap.TryGetValue(pid, out var u);
                    return new ConversationParticipantDto
                    {
                        Id = pid.ToString(),
                        Name = u?.Name,
                        ImagePath = u?.ImagePath
                    };
                }).ToList()
            }).ToList();
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
                Message = request.Message,
                ClientBriefId = request.ClientBriefId,
            };

           var data = await _chatService.AddMessage(message);

            // Fan out to every participant's per-user group so recipients
            // receive it regardless of which thread (if any) they have open.
            var participants = await _chatService.GetParticipantsAsync(conversationObjectId);
            foreach (var participantId in participants)
            {
                await _hub.Clients.Group(participantId.ToString())
                    .SendAsync("ReceiveMessage", data);
            }

            if (!string.IsNullOrWhiteSpace(message.ClientBriefId))
            {
                var brief = await _context.ClientBriefs.Find(x => x.Id == message.ClientBriefId).FirstOrDefaultAsync();
                if (brief?.ClientId == CurrentUserId.ToString())
                {
                    foreach (var participantId in participants.Where(x => x != CurrentUserId))
                        await _notifications.NotifyUser(participantId, "Client sent a new message", message.Message);
                }
                else
                {
                    await _responseRates.RefreshTrustSignalAsync(CurrentUserId.ToString());
                }
            }

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
