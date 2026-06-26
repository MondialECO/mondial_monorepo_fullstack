using Microsoft.AspNetCore.SignalR;

namespace WebApp.Services.Ai.Jobs
{
    /// <summary>Realtime event names for the AI-job domain.</summary>
    public static class AiEventNames
    {
        /// <summary>Status transition: { jobId, status }.</summary>
        public const string AiJobUpdate = "AiJobUpdate";

        /// <summary>Successful completion: { jobId, jobType, status, resultSummary }.</summary>
        public const string AiJobCompleted = "AiJobCompleted";
    }

    public interface IAiEventPublisher
    {
        /// <summary>Deliver an event to a SINGLE user's per-user group (owner only).</summary>
        Task PublishToOwnerAsync(string ownerUserId, string eventName, object payload);
    }

    /// <summary>
    /// Emits AI-job realtime events to the owner's per-user group on the existing
    /// <see cref="NotificationHub"/> — the same per-user group mechanism the
    /// notifications/deal domains use (group name = user id). Mirrors
    /// <c>DealEventPublisher</c>. No new hub. Owner-scoped: events go only to the
    /// job owner's group, never broadcast.
    /// </summary>
    public sealed class AiEventPublisher : IAiEventPublisher
    {
        private readonly IHubContext<NotificationHub> _hub;

        public AiEventPublisher(IHubContext<NotificationHub> hub) => _hub = hub;

        public Task PublishToOwnerAsync(string ownerUserId, string eventName, object payload)
        {
            if (string.IsNullOrWhiteSpace(ownerUserId))
                return Task.CompletedTask;

            return _hub.Clients.Group(ownerUserId).SendAsync(eventName, payload);
        }
    }
}
