using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using Moq;
using WebApp.Controllers;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Interface;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class NotificationSystemTests
    {
        private readonly Mock<INotificationService> _serviceMock = new();
        private readonly Guid _userA = Guid.NewGuid();
        private readonly Guid _userB = Guid.NewGuid();

        private NotificationController CreateController(Guid userId)
        {
            var controller = new NotificationController(_serviceMock.Object);
            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, userId.ToString()),
                new(ClaimTypes.Role, "Creator")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
            };
            return controller;
        }

        [Fact]
        public async Task Test_1_GetNotifications_EnforcesAuthenticatedUserId()
        {
            var notifsA = new List<Notification>
            {
                new() { Id = ObjectId.GenerateNewId(), UserId = _userA, Title = "Deal Updated", Body = "Your deal has progressed.", CreatedAt = DateTime.UtcNow }
            };

            _serviceMock.Setup(s => s.GetUserNotifications(_userA, 0, 10))
                .ReturnsAsync(notifsA);

            var controller = CreateController(_userA);
            var result = await controller.GetNotifications(0, 10);

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var data = ok.Value.Should().BeAssignableTo<List<Notification>>().Subject;
            data.Should().HaveCount(1);
            data[0].UserId.Should().Be(_userA);

            // User B service method was never invoked
            _serviceMock.Verify(s => s.GetUserNotifications(_userB, It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        }

        [Fact]
        public async Task Test_2_GetUnreadCount_ReturnsCanonicalCountForAuthenticatedUser()
        {
            _serviceMock.Setup(s => s.GetUnreadCount(_userA))
                .ReturnsAsync(27);

            var controller = CreateController(_userA);
            var result = await controller.GetUnreadCount();

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            ok.Value.Should().BeEquivalentTo(new { unreadCount = 27 });

            _serviceMock.Verify(s => s.GetUnreadCount(_userA), Times.Once);
            _serviceMock.Verify(s => s.GetUnreadCount(_userB), Times.Never);
        }

        [Fact]
        public async Task Test_3_MarkAsRead_UserIsolation_ForeignNotificationReturnsNotFound()
        {
            var notifId = ObjectId.GenerateNewId();

            // When User A attempts to mark, service returns true (owned)
            _serviceMock.Setup(s => s.MarkAsRead(notifId, _userA))
                .ReturnsAsync(true);

            // When User B attempts to mark User A's notification, service returns false (unowned)
            _serviceMock.Setup(s => s.MarkAsRead(notifId, _userB))
                .ReturnsAsync(false);

            var controllerA = CreateController(_userA);
            var resultA = await controllerA.MarkAsRead(notifId.ToString());
            resultA.Should().BeOfType<OkResult>();

            var controllerB = CreateController(_userB);
            var resultB = await controllerB.MarkAsRead(notifId.ToString());
            resultB.Should().BeOfType<NotFoundResult>();
        }

        [Fact]
        public async Task Test_4_MarkAllAsRead_EnforcesAuthenticatedUserId()
        {
            _serviceMock.Setup(s => s.MarkAllAsRead(_userA))
                .ReturnsAsync(5);

            var controller = CreateController(_userA);
            var result = await controller.MarkAllAsRead();

            result.Should().BeOfType<OkResult>();
            _serviceMock.Verify(s => s.MarkAllAsRead(_userA), Times.Once);
            _serviceMock.Verify(s => s.MarkAllAsRead(_userB), Times.Never);
        }

        [Fact]
        public async Task Test_5_InvalidNotificationId_ReturnsNotFoundDefensively()
        {
            var controller = CreateController(_userA);
            var result = await controller.MarkAsRead("invalid-non-hex-id");

            result.Should().BeOfType<NotFoundResult>();
            _serviceMock.Verify(s => s.MarkAsRead(It.IsAny<ObjectId>(), It.IsAny<Guid>()), Times.Never);
        }

        [Fact]
        public async Task Test_6_NotificationService_PreservesAndReturnsActionLink()
        {
            var testLink = "/dashboard/creator/sales/64a1b2c3d4e5f60718293a4b";
            var notifWithLink = new List<Notification>
            {
                new()
                {
                    Id = ObjectId.GenerateNewId(),
                    UserId = _userA,
                    Title = "Buyout Offer Accepted",
                    Body = "Buyout terms agreed.",
                    Link = testLink,
                    Type = "BuyoutTerms",
                    CreatedAt = DateTime.UtcNow
                }
            };

            _serviceMock.Setup(s => s.GetUserNotifications(_userA, 0, 10))
                .ReturnsAsync(notifWithLink);

            var controller = CreateController(_userA);
            var result = await controller.GetNotifications(0, 10);

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var data = ok.Value.Should().BeAssignableTo<List<Notification>>().Subject;
            data.Should().HaveCount(1);
            data[0].Link.Should().Be(testLink);
            data[0].Type.Should().Be("BuyoutTerms");
        }
    }
}
