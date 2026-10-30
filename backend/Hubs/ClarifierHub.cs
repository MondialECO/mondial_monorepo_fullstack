using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using WebApp.Services.Clarifier;

namespace WebApp.Hubs
{
    [Authorize]
    public class ClarifierHub : Hub
    {
        private readonly IClarifierTopicService _topicService;
        private readonly IClarifierTurnService _turnService;
        private readonly ILogger<ClarifierHub> _logger;

        public ClarifierHub(
            IClarifierTopicService topicService,
            IClarifierTurnService turnService,
            ILogger<ClarifierHub> logger
        )
        {
            _topicService = topicService;
            _turnService = turnService;
            _logger = logger;
        }

        /// <summary>
        /// Real-time message handling with streaming
        /// </summary>
        public async Task SendMessage(
            string message,
            string language,
            string sessionId,
            string currentTopic
        )
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            try
            {
                _logger.LogInformation($"[Clarifier] Message from {userId}: sessionId={sessionId}, topic={currentTopic}");

                // Stream AI response as it generates
                var aiResponse = "";
                await foreach (var chunk in _turnService.StreamAiResponseAsync(
                    message,
                    language,
                    sessionId,
                    currentTopic
                ))
                {
                    aiResponse += chunk;

                    // Send each chunk to client in real-time (typing effect)
                    await Clients.Caller.SendAsync("ReceiveChunk", chunk);
                }

                // Get final topic status after AI completes
                var topicStatus = await _topicService.GetTopicStatusAsync(sessionId);
                var nextTopic = _topicService.SelectNextTopic(topicStatus);
                var clarityScore = _topicService.CalculateClarityScore(topicStatus);
                var allCleared = _topicService.AllTopicsCleared(topicStatus);

                // Send final state update
                await Clients.Caller.SendAsync("MessageComplete", new
                {
                    aiMessage = new
                    {
                        id = Guid.NewGuid().ToString(),
                        text = aiResponse,
                        topic = currentTopic,
                        timestamp = DateTime.UtcNow
                    },
                    topicStatus = topicStatus,
                    nextTopic = nextTopic,
                    clarityScore = clarityScore,
                    allTopicsCleared = allCleared
                });

                _logger.LogInformation($"[Clarifier] Message processing complete: nextTopic={nextTopic}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"[Clarifier] Error processing message for session {sessionId}");
                await Clients.Caller.SendAsync("Error", new
                {
                    message = "An error occurred while processing your message",
                    errorCode = "CLARIFIER_ERROR"
                });
            }
        }

        /// <summary>
        /// Get current session status
        /// </summary>
        public async Task<object> GetSessionStatus(string sessionId)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            try
            {
                var topicStatus = await _topicService.GetTopicStatusAsync(sessionId);
                var clarityScore = _topicService.CalculateClarityScore(topicStatus);
                var nextTopic = _topicService.SelectNextTopic(topicStatus);

                return new
                {
                    success = true,
                    topicStatus = topicStatus,
                    clarityScore = clarityScore,
                    nextTopic = nextTopic,
                    allCleared = _topicService.AllTopicsCleared(topicStatus)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"[Clarifier] Error getting session status: {sessionId}");
                return new
                {
                    success = false,
                    error = "Failed to get session status"
                };
            }
        }

        /// <summary>
        /// Connection lifecycle
        /// </summary>
        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation($"[Clarifier] Client connected: {Context.ConnectionId}, userId={userId}");
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation($"[Clarifier] Client disconnected: {Context.ConnectionId}, userId={userId}");

            if (exception != null)
            {
                _logger.LogError(exception, "[Clarifier] Connection error");
            }

            await base.OnDisconnectedAsync(exception);
        }
    }
}
