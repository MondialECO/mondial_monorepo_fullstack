using FluentAssertions;
using MongoDB.Bson;
using Moq;
using WebApp.Hubs;
using WebApp.Models.DatabaseModels;
using WebApp.Services;
using WebApp.Services.Interface;
using WebApp.Services.Repository;
using Xunit;
using Microsoft.AspNetCore.SignalR;

namespace WebApp.Tests.Unit;

/// <summary>
/// Unit tests for NotificationService and ChatService covering:
/// - Real-time notification delivery (SignalR push or web push based on user online status)
/// - Notification management (create, retrieve, mark as read)
/// - Chat message management (send, retrieve)
/// - Conversation management (create, list, update last message)
/// - Mark as read functionality for both notifications and messages
/// </summary>
public class NotificationServiceTests
{
    private readonly Mock<NotificationRepository> _mockNotificationRepo;
    private readonly Mock<IHubContext<NotificationHub>> _mockHubContext;
    private readonly Mock<IPushSubscriptionEntity> _mockPushRepo;
    private readonly Mock<WebPushService> _mockWebPushService;
    private readonly Mock<IPresenceTracker> _mockPresenceTracker;
    private readonly NotificationService _service;

    public NotificationServiceTests()
    {
        _mockNotificationRepo = new Mock<NotificationRepository>();
        _mockHubContext = new Mock<IHubContext<NotificationHub>>();
        _mockPushRepo = new Mock<IPushSubscriptionEntity>();
        _mockWebPushService = new Mock<WebPushService>();
        _mockPresenceTracker = new Mock<IPresenceTracker>();

        _service = new NotificationService(
            _mockNotificationRepo.Object,
            _mockHubContext.Object,
            _mockPushRepo.Object,
            _mockWebPushService.Object,
            _mockPresenceTracker.Object
        );
    }

    #region Create Notification Tests

    [Fact]
    public async Task CreateNotification_WithValidData_CreatesAndReturnsNotification()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var title = "New Message";
        var body = "You have a new message from John";

        _mockNotificationRepo.Setup(x => x.AddNotification(It.IsAny<Notification>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.CreateNotification(userId, title, body);

        // Assert
        result.Should().NotBeNull();
        result.UserId.Should().Be(userId);
        result.Title.Should().Be(title);
        result.Body.Should().Be(body);
        result.IsRead.Should().BeFalse();
        result.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        _mockNotificationRepo.Verify(x => x.AddNotification(It.IsAny<Notification>()), Times.Once);
    }

    [Fact]
    public async Task CreateNotification_WithEmptyTitle_StillCreatesNotification()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var title = "";
        var body = "Body text";

        _mockNotificationRepo.Setup(x => x.AddNotification(It.IsAny<Notification>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.CreateNotification(userId, title, body);

        // Assert
        result.Title.Should().Be("");
        result.Body.Should().Be(body);
    }

    #endregion

    #region Notify User Tests

    [Fact]
    public async Task NotifyUser_WithOnlineUser_SendsViaSignalR()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var title = "Alert";
        var body = "Important update";

        var mockClients = new Mock<IHubClients>();
        var mockGroupClients = new Mock<IClientProxy>();

        _mockHubContext.Setup(x => x.Clients).Returns(mockClients.Object);
        mockClients.Setup(x => x.Group(userId.ToString())).Returns(mockGroupClients.Object);

        _mockPresenceTracker.Setup(x => x.IsOnlineAsync(userId.ToString()))
            .ReturnsAsync(true);

        _mockNotificationRepo.Setup(x => x.AddNotification(It.IsAny<Notification>()))
            .Returns(Task.CompletedTask);

        mockGroupClients.Setup(x => x.SendAsync("ReceiveNotification", It.IsAny<Notification>(), default))
            .Returns(Task.CompletedTask);

        // Act
        await _service.NotifyUser(userId, title, body);

        // Assert
        _mockPresenceTracker.Verify(x => x.IsOnlineAsync(userId.ToString()), Times.Once);
        mockGroupClients.Verify(x => x.SendAsync("ReceiveNotification", It.IsAny<Notification>(), default), Times.Once);
        _mockPushRepo.Verify(x => x.GetByUserId(It.IsAny<Guid>()), Times.Never);
    }

    [Fact]
    public async Task NotifyUser_WithOfflineUser_SendsWebPush()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var title = "Alert";
        var body = "Important update";

        var pushSubs = new List<PushSubscription>
        {
            new PushSubscription { Id = ObjectId.GenerateNewId() },
            new PushSubscription { Id = ObjectId.GenerateNewId() }
        };

        _mockPresenceTracker.Setup(x => x.IsOnlineAsync(userId.ToString()))
            .ReturnsAsync(false);

        _mockNotificationRepo.Setup(x => x.AddNotification(It.IsAny<Notification>()))
            .Returns(Task.CompletedTask);

        _mockPushRepo.Setup(x => x.GetByUserId(userId))
            .ReturnsAsync(pushSubs);

        _mockWebPushService.Setup(x => x.SendAsync(It.IsAny<PushSubscription>(), It.IsAny<Notification>()))
            .Returns(Task.CompletedTask);

        // Act
        await _service.NotifyUser(userId, title, body);

        // Assert
        _mockPresenceTracker.Verify(x => x.IsOnlineAsync(userId.ToString()), Times.Once);
        _mockPushRepo.Verify(x => x.GetByUserId(userId), Times.Once);
        _mockWebPushService.Verify(x => x.SendAsync(It.IsAny<PushSubscription>(), It.IsAny<Notification>()), Times.Exactly(2));
    }

    [Fact]
    public async Task NotifyUser_WithOfflineUserAndNoPushSubs_DoesNotSendPush()
    {
        // Arrange
        var userId = Guid.NewGuid();

        _mockPresenceTracker.Setup(x => x.IsOnlineAsync(userId.ToString()))
            .ReturnsAsync(false);

        _mockNotificationRepo.Setup(x => x.AddNotification(It.IsAny<Notification>()))
            .Returns(Task.CompletedTask);

        _mockPushRepo.Setup(x => x.GetByUserId(userId))
            .ReturnsAsync(new List<PushSubscription>());

        // Act
        await _service.NotifyUser(userId, "Title", "Body");

        // Assert
        _mockWebPushService.Verify(x => x.SendAsync(It.IsAny<PushSubscription>(), It.IsAny<Notification>()), Times.Never);
    }

    #endregion

    #region Get User Notifications Tests

    [Fact]
    public async Task GetUserNotifications_WithValidUser_ReturnsNotificationList()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var notifications = new List<Notification>
        {
            new Notification { UserId = userId, Title = "Notif 1", IsRead = false },
            new Notification { UserId = userId, Title = "Notif 2", IsRead = true }
        };

        _mockNotificationRepo.Setup(x => x.GetUserNotifications(userId, 0, 30))
            .ReturnsAsync(notifications);

        // Act
        var result = await _service.GetUserNotifications(userId, 0, 30);

        // Assert
        result.Should().HaveCount(2);
        result[0].Title.Should().Be("Notif 1");
        result[1].Title.Should().Be("Notif 2");
        _mockNotificationRepo.Verify(x => x.GetUserNotifications(userId, 0, 30), Times.Once);
    }

    [Fact]
    public async Task GetUserNotifications_WithPagination_ReturnsPagedResults()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var notifications = new List<Notification>
        {
            new Notification { UserId = userId, Title = "Notif 11" },
            new Notification { UserId = userId, Title = "Notif 12" }
        };

        _mockNotificationRepo.Setup(x => x.GetUserNotifications(userId, 10, 10))
            .ReturnsAsync(notifications);

        // Act
        var result = await _service.GetUserNotifications(userId, 10, 10);

        // Assert
        result.Should().HaveCount(2);
        _mockNotificationRepo.Verify(x => x.GetUserNotifications(userId, 10, 10), Times.Once);
    }

    [Fact]
    public async Task GetUserNotifications_WithNoNotifications_ReturnsEmptyList()
    {
        // Arrange
        var userId = Guid.NewGuid();

        _mockNotificationRepo.Setup(x => x.GetUserNotifications(userId, 0, 30))
            .ReturnsAsync(new List<Notification>());

        // Act
        var result = await _service.GetUserNotifications(userId, 0, 30);

        // Assert
        result.Should().BeEmpty();
    }

    #endregion

    #region Mark As Read Tests

    [Fact]
    public async Task MarkAsRead_WithValidNotificationId_MarksAsRead()
    {
        // Arrange
        var notificationId = ObjectId.GenerateNewId();

        _mockNotificationRepo.Setup(x => x.MarkAsRead(notificationId))
            .Returns(Task.CompletedTask);

        // Act
        await _service.MarkAsRead(notificationId);

        // Assert
        _mockNotificationRepo.Verify(x => x.MarkAsRead(notificationId), Times.Once);
    }

    #endregion
}

/// <summary>
/// Unit tests for ChatService covering:
/// - Add message to conversation (updates last message timestamp)
/// - Get messages with pagination
/// - Create or get existing conversation between two users
/// - List user's conversations
/// - Mark messages as read
/// </summary>
public class ChatServiceTests
{
    private readonly Mock<MessagesRepository> _mockMessagesRepo;
    private readonly Mock<ConversationRepository> _mockConversationRepo;
    private readonly ChatService _service;

    public ChatServiceTests()
    {
        _mockMessagesRepo = new Mock<MessagesRepository>();
        _mockConversationRepo = new Mock<ConversationRepository>();

        _service = new ChatService(_mockMessagesRepo.Object, _mockConversationRepo.Object);
    }

    #region Add Message Tests

    [Fact]
    public async Task AddMessage_WithValidMessage_AddsAndUpdatesConversation()
    {
        // Arrange
        var conversationId = ObjectId.GenerateNewId();
        var senderId = Guid.NewGuid();
        var message = new ChatMessage
        {
            ConversationId = conversationId,
            SenderId = senderId,
            Content = "Hello there!",
            CreatedAt = DateTime.UtcNow
        };

        _mockMessagesRepo.Setup(x => x.AddMessage(It.IsAny<ChatMessage>()))
            .Returns(Task.CompletedTask);

        _mockConversationRepo.Setup(x => x.UpdateConversionLastMessage(It.IsAny<ChatMessage>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.AddMessage(message);

        // Assert
        result.Should().Be(message);
        result.Content.Should().Be("Hello there!");
        _mockMessagesRepo.Verify(x => x.AddMessage(It.IsAny<ChatMessage>()), Times.Once);
        _mockConversationRepo.Verify(x => x.UpdateConversionLastMessage(It.IsAny<ChatMessage>()), Times.Once);
    }

    [Fact]
    public async Task AddMessage_WithEmptyContent_StillAddsMessage()
    {
        // Arrange
        var message = new ChatMessage
        {
            ConversationId = ObjectId.GenerateNewId(),
            SenderId = Guid.NewGuid(),
            Content = ""
        };

        _mockMessagesRepo.Setup(x => x.AddMessage(It.IsAny<ChatMessage>()))
            .Returns(Task.CompletedTask);

        _mockConversationRepo.Setup(x => x.UpdateConversionLastMessage(It.IsAny<ChatMessage>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.AddMessage(message);

        // Assert
        result.Content.Should().Be("");
    }

    #endregion

    #region Get Messages Tests

    [Fact]
    public async Task GetMessages_WithValidConversationId_ReturnsMessages()
    {
        // Arrange
        var conversationId = ObjectId.GenerateNewId();
        var messages = new List<ChatMessage>
        {
            new ChatMessage { ConversationId = conversationId, Content = "Message 1" },
            new ChatMessage { ConversationId = conversationId, Content = "Message 2" },
            new ChatMessage { ConversationId = conversationId, Content = "Message 3" }
        };

        _mockMessagesRepo.Setup(x => x.GetMessages(conversationId, 0, 20))
            .ReturnsAsync(messages);

        // Act
        var result = await _service.GetMessages(conversationId, 0, 20);

        // Assert
        result.Should().HaveCount(3);
        result[0].Content.Should().Be("Message 1");
        _mockMessagesRepo.Verify(x => x.GetMessages(conversationId, 0, 20), Times.Once);
    }

    [Fact]
    public async Task GetMessages_WithPagination_ReturnsPagedResults()
    {
        // Arrange
        var conversationId = ObjectId.GenerateNewId();
        var messages = new List<ChatMessage>
        {
            new ChatMessage { ConversationId = conversationId, Content = "Message 21" },
            new ChatMessage { ConversationId = conversationId, Content = "Message 22" }
        };

        _mockMessagesRepo.Setup(x => x.GetMessages(conversationId, 20, 20))
            .ReturnsAsync(messages);

        // Act
        var result = await _service.GetMessages(conversationId, 20, 20);

        // Assert
        result.Should().HaveCount(2);
        _mockMessagesRepo.Verify(x => x.GetMessages(conversationId, 20, 20), Times.Once);
    }

    [Fact]
    public async Task GetMessages_WithNoMessages_ReturnsEmptyList()
    {
        // Arrange
        var conversationId = ObjectId.GenerateNewId();

        _mockMessagesRepo.Setup(x => x.GetMessages(conversationId, 0, 20))
            .ReturnsAsync(new List<ChatMessage>());

        // Act
        var result = await _service.GetMessages(conversationId, 0, 20);

        // Assert
        result.Should().BeEmpty();
    }

    #endregion

    #region Get Or Create Conversation Tests

    [Fact]
    public async Task GetOrCreateConversation_WithNewUsers_CreatesAndReturnsConversation()
    {
        // Arrange
        var user1 = Guid.NewGuid();
        var user2 = Guid.NewGuid();
        var conversation = new Conversation
        {
            User1Id = user1,
            User2Id = user2,
            CreatedAt = DateTime.UtcNow
        };

        _mockConversationRepo.Setup(x => x.GetOrCreateConversation(user1, user2))
            .ReturnsAsync(conversation);

        // Act
        var result = await _service.GetOrCreateConversation(user1, user2);

        // Assert
        result.Should().NotBeNull();
        result.User1Id.Should().Be(user1);
        result.User2Id.Should().Be(user2);
        _mockConversationRepo.Verify(x => x.GetOrCreateConversation(user1, user2), Times.Once);
    }

    [Fact]
    public async Task GetOrCreateConversation_WithExistingConversation_ReturnsExisting()
    {
        // Arrange
        var user1 = Guid.NewGuid();
        var user2 = Guid.NewGuid();
        var existingConversation = new Conversation
        {
            Id = ObjectId.GenerateNewId(),
            User1Id = user1,
            User2Id = user2,
            LastMessageAt = DateTime.UtcNow.AddHours(-1)
        };

        _mockConversationRepo.Setup(x => x.GetOrCreateConversation(user1, user2))
            .ReturnsAsync(existingConversation);

        // Act
        var result = await _service.GetOrCreateConversation(user1, user2);

        // Assert
        result.Id.Should().Be(existingConversation.Id);
        result.LastMessageAt.Should().BeCloseTo(existingConversation.LastMessageAt, TimeSpan.FromSeconds(1));
    }

    #endregion

    #region Get User Conversations Tests

    [Fact]
    public async Task GetUserConversations_WithValidUser_ReturnsConversationList()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var conversations = new List<Conversation>
        {
            new Conversation { User1Id = userId, User2Id = Guid.NewGuid() },
            new Conversation { User1Id = Guid.NewGuid(), User2Id = userId }
        };

        _mockConversationRepo.Setup(x => x.GetUserConversations(userId))
            .ReturnsAsync(conversations);

        // Act
        var result = await _service.GetUserConversations(userId);

        // Assert
        result.Should().HaveCount(2);
        _mockConversationRepo.Verify(x => x.GetUserConversations(userId), Times.Once);
    }

    [Fact]
    public async Task GetUserConversations_WithNoConversations_ReturnsEmptyList()
    {
        // Arrange
        var userId = Guid.NewGuid();

        _mockConversationRepo.Setup(x => x.GetUserConversations(userId))
            .ReturnsAsync(new List<Conversation>());

        // Act
        var result = await _service.GetUserConversations(userId);

        // Assert
        result.Should().BeEmpty();
    }

    #endregion

    #region Mark As Read Tests

    [Fact]
    public async Task MarkAsRead_WithValidIds_MarksConversationAsRead()
    {
        // Arrange
        var conversationId = ObjectId.GenerateNewId();
        var userId = Guid.NewGuid();

        _mockMessagesRepo.Setup(x => x.MarkAsRead(conversationId, userId))
            .Returns(Task.CompletedTask);

        // Act
        await _service.MarkAsRead(conversationId, userId);

        // Assert
        _mockMessagesRepo.Verify(x => x.MarkAsRead(conversationId, userId), Times.Once);
    }

    #endregion
}
