using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.Interface;

namespace WebApp.Services.Ai.Jobs
{
    /// <summary>
    /// Fires the user-facing side effects when an AI job reaches a terminal
    /// state: a persisted notification (reusing <see cref="INotificationService"/>
    /// — persist + SignalR-if-online + Web-Push-if-offline) plus realtime hub
    /// events to the owner's group. Best-effort: notification/transport failures
    /// are logged, never thrown, so they cannot fail or mask the AI job itself.
    /// </summary>
    public interface IAiJobCompletionHandler
    {
        Task OnCompletedAsync(AiRequest request, AiResponse response);
        Task OnFailedAsync(AiRequest request, string error);
    }

    public sealed class AiJobCompletionHandler : IAiJobCompletionHandler
    {
        private const int SummaryMaxChars = 160;

        private readonly INotificationService _notifications;
        private readonly IAiEventPublisher _events;
        private readonly ILogger<AiJobCompletionHandler> _logger;

        public AiJobCompletionHandler(
            INotificationService notifications,
            IAiEventPublisher events,
            ILogger<AiJobCompletionHandler> logger)
        {
            _notifications = notifications;
            _events = events;
            _logger = logger;
        }

        public async Task OnCompletedAsync(AiRequest request, AiResponse response)
        {
            try
            {
                await _events.PublishToOwnerAsync(request.OwnerUserId, AiEventNames.AiJobUpdate,
                    new { jobId = request.Id, status = "Completed" });

                await _events.PublishToOwnerAsync(request.OwnerUserId, AiEventNames.AiJobCompleted,
                    new { jobId = request.Id, jobType = request.JobType, status = "Completed", resultSummary = Summarize(response) });

                if (Guid.TryParse(request.OwnerUserId, out var userId))
                    await _notifications.NotifyUser(userId, "AI job complete", $"{request.JobType} finished");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "AI completion notification failed for {RequestId} (non-fatal).", request.Id);
            }
        }

        public async Task OnFailedAsync(AiRequest request, string error)
        {
            try
            {
                await _events.PublishToOwnerAsync(request.OwnerUserId, AiEventNames.AiJobUpdate,
                    new { jobId = request.Id, status = "Failed" });

                if (Guid.TryParse(request.OwnerUserId, out var userId))
                    await _notifications.NotifyUser(userId, "AI job failed", $"{request.JobType} failed");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "AI failure notification failed for {RequestId} (non-fatal).", request.Id);
            }
        }

        private static string Summarize(AiResponse response)
        {
            var text = response.RawText ?? string.Empty;
            text = text.Trim();
            return text.Length <= SummaryMaxChars ? text : text[..SummaryMaxChars] + "…";
        }
    }
}
