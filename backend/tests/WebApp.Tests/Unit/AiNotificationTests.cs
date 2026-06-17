using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.Ai.Jobs;
using WebApp.Services.Interface;
using Xunit;

namespace WebApp.Tests.Unit;

public class AiNotificationTests
{
    private static AiRequest Request(string owner) => new() { Id = "req-1", OwnerUserId = owner, JobType = "Probe" };
    private static AiResponse Response() => new() { RawText = "pipeline ok" };

    private static AiJobCompletionHandler Handler(Mock<INotificationService> notif, Mock<IAiEventPublisher> events)
        => new(notif.Object, events.Object, NullLogger<AiJobCompletionHandler>.Instance);

    // ---- AiJobCompletionHandler ----

    [Fact]
    public async Task OnCompleted_emits_update_and_completed_events_plus_success_notification()
    {
        var owner = Guid.NewGuid().ToString();
        var events = new Mock<IAiEventPublisher>();
        var notif = new Mock<INotificationService>();

        await Handler(notif, events).OnCompletedAsync(Request(owner), Response());

        events.Verify(e => e.PublishToOwnerAsync(owner, AiEventNames.AiJobUpdate, It.IsAny<object>()), Times.Once);
        events.Verify(e => e.PublishToOwnerAsync(owner, AiEventNames.AiJobCompleted, It.IsAny<object>()), Times.Once);
        notif.Verify(n => n.NotifyUser(Guid.Parse(owner), "AI job complete", It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task OnFailed_emits_update_failed_and_failure_notification_no_completed_event()
    {
        var owner = Guid.NewGuid().ToString();
        var events = new Mock<IAiEventPublisher>();
        var notif = new Mock<INotificationService>();

        await Handler(notif, events).OnFailedAsync(Request(owner), "boom");

        events.Verify(e => e.PublishToOwnerAsync(owner, AiEventNames.AiJobUpdate, It.IsAny<object>()), Times.Once);
        events.Verify(e => e.PublishToOwnerAsync(owner, AiEventNames.AiJobCompleted, It.IsAny<object>()), Times.Never);
        notif.Verify(n => n.NotifyUser(Guid.Parse(owner), "AI job failed", It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task Notification_transport_failure_is_swallowed()
    {
        var owner = Guid.NewGuid().ToString();
        var events = new Mock<IAiEventPublisher>();
        events.Setup(e => e.PublishToOwnerAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<object>()))
              .ThrowsAsync(new Exception("hub down"));
        var notif = new Mock<INotificationService>();

        var act = () => Handler(notif, events).OnCompletedAsync(Request(owner), Response());
        await act.Should().NotThrowAsync(); // best-effort: must not fail the job
    }

    [Fact]
    public async Task Non_guid_owner_skips_notification_but_still_emits_events()
    {
        var events = new Mock<IAiEventPublisher>();
        var notif = new Mock<INotificationService>();

        await Handler(notif, events).OnCompletedAsync(Request("not-a-guid"), Response());

        notif.Verify(n => n.NotifyUser(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        events.Verify(e => e.PublishToOwnerAsync("not-a-guid", AiEventNames.AiJobUpdate, It.IsAny<object>()), Times.Once);
    }

    // ---- AiEventPublisher (realtime delivery) ----

    [Fact]
    public async Task EventPublisher_delivers_to_owner_group_only()
    {
        var proxy = new Mock<IClientProxy>();
        var clients = new Mock<IHubClients>();
        clients.Setup(c => c.Group("owner-1")).Returns(proxy.Object);
        var hub = new Mock<IHubContext<NotificationHub>>();
        hub.Setup(h => h.Clients).Returns(clients.Object);

        await new AiEventPublisher(hub.Object).PublishToOwnerAsync(
            "owner-1", AiEventNames.AiJobUpdate, new { jobId = "j1", status = "Completed" });

        clients.Verify(c => c.Group("owner-1"), Times.Once);
        proxy.Verify(p => p.SendCoreAsync(AiEventNames.AiJobUpdate, It.IsAny<object?[]>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task EventPublisher_ignores_blank_owner()
    {
        var hub = new Mock<IHubContext<NotificationHub>>(MockBehavior.Strict); // throws if hub touched

        var act = () => new AiEventPublisher(hub.Object).PublishToOwnerAsync("", AiEventNames.AiJobUpdate, new { });
        await act.Should().NotThrowAsync();
    }
}
