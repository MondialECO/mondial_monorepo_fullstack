using Microsoft.AspNetCore.SignalR;
using MongoDB.Bson;
using WebApp.Hubs;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Interface;
using WebApp.Services.Repository;

namespace WebApp.Services
{
    public class NotificationService : INotificationService
    {
        private readonly NotificationRepository _repo;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly IPushSubscriptionEntity _pushRepo;
        public readonly WebPushService _webPushService;
        private readonly IPresenceTracker _presence;


        public NotificationService(NotificationRepository repo,
            IHubContext<NotificationHub> hubContext,
            IPushSubscriptionEntity pushRepo,
            WebPushService webPushService,
            IPresenceTracker presence)
        {
            _repo = repo;
            _hubContext = hubContext;
            _pushRepo = pushRepo;
            _webPushService = webPushService;
            _presence = presence;
        }


        public Task<Notification> CreateNotification(Guid userId, string title, string body)
            => CreateNotification(userId, title, body, null, null, null);

        public async Task<Notification> CreateNotification(
            Guid userId, string title, string body, string? link, string? type = null, ObjectId? referenceId = null)
        {
            var notif = new Notification
            {
                UserId = userId,
                Title = title,
                Body = body,
                Link = link,
                Type = type ?? "System",
                ReferenceId = referenceId,
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            await _repo.AddNotification(notif);

            try
            {
                if (_hubContext != null)
                {
                    await _hubContext.Clients.Group(userId.ToString()).SendAsync("ReceiveNotification", notif);
                }
            }
            catch
            {
                // Realtime delivery failure must not block persistence
            }

            try
            {
                if (_pushRepo != null && _webPushService != null)
                {
                    var subs = await _pushRepo.GetByUserId(userId);
                    if (subs != null && subs.Count > 0)
                    {
                        foreach (var sub in subs)
                        {
                            await _webPushService.SendAsync(sub, notif);
                        }
                    }
                }
            }
            catch
            {
                // WebPush failure must not block persistence
            }

            return notif;
        }

        public Task NotifyUser(Guid userId, string title, string body)
            => NotifyUserWithReceipt(userId, title, body, null, null, null);

        public async Task NotifyUser(Guid userId, string title, string body, string? link)
            => _ = await NotifyUserWithReceipt(userId, title, body, link, null, null);

        public Task<Notification> NotifyUserWithReceipt(Guid userId, string title, string body)
            => NotifyUserWithReceipt(userId, title, body, null, null, null);

        public Task<Notification> NotifyUserWithReceipt(
            Guid userId, string title, string body, string? link, string? type = null, ObjectId? referenceId = null)
            => CreateNotification(userId, title, body, link, type, referenceId);





        public async Task<List<Notification>> GetUserNotifications(Guid userId, int skip = 0, int limit = 30)
        {
            return await _repo.GetUserNotifications(userId, skip, limit);
        }

        public Task<bool> MarkAsRead(ObjectId notificationId, Guid userId)
            => _repo.MarkAsRead(notificationId, userId);

        public Task<int> GetUnreadCount(Guid userId)
            => _repo.GetUnreadCount(userId);

        public Task<long> MarkAllAsRead(Guid userId)
            => _repo.MarkAllAsRead(userId);
    }
}
