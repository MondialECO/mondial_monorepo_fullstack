using MongoDB.Bson;
using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Interface
{
    public interface INotificationService
    {
        Task<Notification> CreateNotification(Guid userId, string title, string body);
        Task NotifyUser(Guid userId, string title, string body); // offline push
        Task<List<Notification>> GetUserNotifications(Guid userId, int skip = 0, int limit = 30);

        // SEC-10 Phase 2: marks the notification read only when it belongs
        // to the caller. Returns true if a matching document was updated,
        // false if the (id, userId) pair did not match a row.
        Task<bool> MarkAsRead(ObjectId notificationId, Guid userId);
    }
}
