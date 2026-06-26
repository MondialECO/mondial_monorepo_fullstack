using Microsoft.AspNetCore.SignalR;

namespace WebApp.Services;

// Realtime event names for the deal/offer domain (Phase D-4.5). Emitted to each
// participant's per-user group on the shared notifications hub.
public static class DealEventNames
{
    public const string OfferReceived = "OfferReceived";
    public const string OfferViewed = "OfferViewed";
    public const string OfferCountered = "OfferCountered";
    public const string OfferAccepted = "OfferAccepted";
    public const string OfferRejected = "OfferRejected";
    public const string DealUpdated = "DealUpdated";
}

// A resolved deal participant: their ApplicationUser id (for realtime group +
// audit) and email/name (for notifications).
public class DealRecipient
{
    public string Role { get; init; } = "";
    public string UserId { get; init; } = "";
    public string Email { get; init; }
    public string Name { get; init; }
}

public interface IDealEventPublisher
{
    Task PublishAsync(IReadOnlyCollection<string> userIds, string eventName, object payload);
}

/// <summary>
/// Emits deal/offer realtime events to each recipient's per-user group on the
/// existing NotificationHub (which already adds every connection to a group
/// named by the user id on connect — the same per-user mechanism Messaging
/// uses). Best-effort: a transport failure must not break the deal operation.
/// </summary>
public class DealEventPublisher : IDealEventPublisher
{
    private readonly IHubContext<NotificationHub> _hub;

    public DealEventPublisher(IHubContext<NotificationHub> hub) => _hub = hub;

    public async Task PublishAsync(IReadOnlyCollection<string> userIds, string eventName, object payload)
    {
        foreach (var uid in userIds)
        {
            if (string.IsNullOrWhiteSpace(uid)) continue;
            await _hub.Clients.Group(uid).SendAsync(eventName, payload);
        }
    }
}
