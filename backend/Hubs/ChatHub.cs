using Amazon.Runtime.Internal;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using MongoDB.Bson;
using Org.BouncyCastle.Asn1.Ocsp;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Interface;

[Authorize]
public class ChatHub : Hub
{
    private readonly IChatService _chatService;

    public ChatHub(IChatService chatService)
    {
        _chatService = chatService;
    }

    // Inbound JWT "sub" is remapped to ClaimTypes.NameIdentifier by the
    // default JwtSecurityTokenHandler. The short name is null on the
    // principal.
    private Guid CurrentUserId()
    {
        var value = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(value) || !Guid.TryParse(value, out var id))
            throw new HubException("Not authenticated");
        return id;
    }

    // Every connection joins its own per-user group so the server can reach a
    // user across ALL their conversations (not just the open thread). The
    // group name is the user id, matching the controller's fan-out target.
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId))
            await Groups.AddToGroupAsync(Context.ConnectionId, userId);
        await base.OnConnectedAsync();
    }

    // Retained for backward compatibility. Per-user groups now drive delivery,
    // so joining a conversation group is no longer required to receive messages.
    public async Task JoinConversation(string conversationId)
    {
        if (!ObjectId.TryParse(conversationId, out var conversationObjectId))
            throw new HubException("Invalid conversation id");

        var userId = CurrentUserId();
        if (!await _chatService.IsParticipantAsync(conversationObjectId, userId))
            throw new HubException("Not a participant of this conversation");

        await Groups.AddToGroupAsync(Context.ConnectionId, conversationId);
    }

    public async Task SendMessage(SendMessageRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
            throw new HubException("Message empty");

        var senderId = CurrentUserId();
        var conversationObjectId = ObjectId.Parse(request.ConversationId);

        if (!await _chatService.IsParticipantAsync(conversationObjectId, senderId))
            throw new HubException("Not a participant of this conversation");

        var message = new ChatMessage
        {
            ConversationId = conversationObjectId,
            SenderId = senderId,
            Message = request.Message
        };
        var savedMessage = await _chatService.AddMessage(message);

        // Fan out to every participant's per-user group so recipients receive
        // the message regardless of which thread (if any) they have open.
        var participants = await _chatService.GetParticipantsAsync(conversationObjectId);
        foreach (var participantId in participants)
        {
            await Clients.Group(participantId.ToString())
                .SendAsync("ReceiveMessage", savedMessage);
        }
    }
}
