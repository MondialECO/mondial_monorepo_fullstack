using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.Interface;

namespace WebApp.Services.Ai.Jobs
{
    /// <summary>
    /// Handles post-execution side effects when an AI job reaches a terminal state.
    /// In-app user notifications, push notifications, and SignalR realtime events (AiJobUpdate/AiJobCompleted)
    /// for AI job completions/failures are disabled as per product specifications.
    /// </summary>
    public interface IAiJobCompletionHandler
    {
        Task OnCompletedAsync(AiRequest request, AiResponse response);
        Task OnFailedAsync(AiRequest request, string error);
    }

    public sealed class AiJobCompletionHandler : IAiJobCompletionHandler
    {
        private readonly ILogger<AiJobCompletionHandler>? _logger;

        public AiJobCompletionHandler(ILogger<AiJobCompletionHandler>? logger = null)
        {
            _logger = logger;
        }

        public AiJobCompletionHandler(
            INotificationService notifications,
            IAiEventPublisher events,
            ILogger<AiJobCompletionHandler> logger)
        {
            _logger = logger;
        }

        public Task OnCompletedAsync(AiRequest request, AiResponse response)
        {
            // AI job completion notifications and SignalR realtime events are deliberately disabled.
            return Task.CompletedTask;
        }

        public Task OnFailedAsync(AiRequest request, string error)
        {
            // AI job failure notifications and SignalR realtime events are deliberately disabled.
            return Task.CompletedTask;
        }
    }
}
