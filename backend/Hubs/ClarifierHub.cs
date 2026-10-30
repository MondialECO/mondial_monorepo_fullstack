using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;

namespace WebApp.Hubs
{
    /// <summary>
    /// Real-time transport for the Phase-2 clarifier chat. Runs the same turn as
    /// POST /api/creator/journey/phase2/chat-message, then plays the AI reply back
    /// word-by-word. The AI verdict is a JSON completion, so nothing streams before
    /// it finishes — the chunks are presentation only.
    /// </summary>
    [Authorize]
    public class ClarifierHub : Hub
    {
        private static readonly TimeSpan ChunkDelay = TimeSpan.FromMilliseconds(20);

        private readonly ICreatorJourneyService _journeys;
        private readonly IClarifierChatTurnRunner _chatTurns;
        private readonly ILogger<ClarifierHub> _logger;

        public ClarifierHub(ICreatorJourneyService journeys, IClarifierChatTurnRunner chatTurns, ILogger<ClarifierHub> logger)
        {
            _journeys = journeys;
            _chatTurns = chatTurns;
            _logger = logger;
        }

        public async Task SendMessage(string message, string language, string ideaId, long expectedVersion)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? throw new HubException("User not authenticated");
            var ct = Context.ConnectionAborted;

            ClarifierChatTurnResponse result;
            try
            {
                _journeys.UseExplicitWriteVersion(ideaId, expectedVersion);
                result = await _chatTurns.RunAsync(userId, message, language, ideaId, ct);
            }
            catch (CreatorJourneyException ex)
            {
                throw new HubException(ex.Message);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "[Clarifier] Turn failed for idea {IdeaId}", ideaId);
                throw new HubException("Something went wrong. Please try again.");
            }

            foreach (var word in result.AiText.Split(' '))
            {
                await Clients.Caller.SendAsync("ReceiveChunk", word + " ", ct);
                await Task.Delay(ChunkDelay, ct);
            }

            await Clients.Caller.SendAsync("MessageComplete", new
            {
                turn = result,
                ideaVersion = _journeys.ExplicitWriteVersion,
            }, ct);
        }
    }
}
