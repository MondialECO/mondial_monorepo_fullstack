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

        await Clients.Group(request.ConversationId)
            .SendAsync("ReceiveMessage", savedMessage);
    }
}
