using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using Moq;
using WebApp.Configuration;
using WebApp.Controllers;
using WebApp.DbContext;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Audit;
using WebApp.Services.Interface;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class AdminEscrowCommissionTests
    {
        private readonly Mock<IMongoDatabase> _mockDb;
        private readonly MongoDbContext _context;
        private readonly Mock<UserManager<ApplicationUser>> _mockUserManager;
        private readonly Mock<IWorkroomService> _mockWorkroomService;
        private readonly Mock<IAuditLogger> _mockAuditLogger;
        private readonly Mock<IMongoCollection<WorkroomMilestone>> _mockMilestoneCollection;
        private readonly Mock<IMongoCollection<WorkroomEngagement>> _mockEngagementCollection;
        private readonly Mock<IMongoCollection<ApplicationUser>> _mockUserCollection;
        private readonly Mock<IMongoCollection<Deliverable>> _mockDeliverableCollection;
        private readonly AdminCommerceController _controller;

        public AdminEscrowCommissionTests()
        {
            _mockDb = new Mock<IMongoDatabase>();
            _mockMilestoneCollection = new Mock<IMongoCollection<WorkroomMilestone>>();
            _mockEngagementCollection = new Mock<IMongoCollection<WorkroomEngagement>>();
            _mockUserCollection = new Mock<IMongoCollection<ApplicationUser>>();
            _mockDeliverableCollection = new Mock<IMongoCollection<Deliverable>>();

            _mockDb.Setup(d => d.GetCollection<WorkroomMilestone>("WorkroomMilestones", null))
                .Returns(_mockMilestoneCollection.Object);
            _mockDb.Setup(d => d.GetCollection<WorkroomEngagement>("WorkroomEngagements", null))
                .Returns(_mockEngagementCollection.Object);
            _mockDb.Setup(d => d.GetCollection<ApplicationUser>("applicationUsers", null))
                .Returns(_mockUserCollection.Object);
            _mockDb.Setup(d => d.GetCollection<Deliverable>("Deliverables", null))
                .Returns(_mockDeliverableCollection.Object);

            _context = new MongoDbContext(_mockDb.Object);

            var store = new Mock<IUserStore<ApplicationUser>>();
            _mockUserManager = new Mock<UserManager<ApplicationUser>>(
                store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

            _mockWorkroomService = new Mock<IWorkroomService>();
            _mockAuditLogger = new Mock<IAuditLogger>();

            _controller = new AdminCommerceController(_context, _mockUserManager.Object, _mockWorkroomService.Object, _mockAuditLogger.Object);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, "admin-user-id"),
                new Claim(ClaimTypes.Email, "admin@mondial.com"),
                new Claim(ClaimTypes.Role, "Admin")
            };
            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var claimsPrincipal = new ClaimsPrincipal(identity);

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimsPrincipal }
            };
        }

        [Fact]
        public void GetCommissionConfig_Returns_Locked_Flat_12_Percent_And_Tiers()
        {
            // Act
            var result = _controller.GetCommissionConfig();

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeAssignableTo<ApiResponse>().Subject;
            response.Success.Should().BeTrue();

            var config = response.Data.Should().BeOfType<AdminCommissionConfigDto>().Subject;
            config.DefaultCommissionPercentage.Should().Be(12.0m);
            config.DefaultCommissionPercentage.Should().Be(PlatformCommerceConstants.CommissionRate * 100m);
            config.MinimumFeeAmount.Should().Be(0m);
            config.Currency.Should().Be("EUR");
            config.IsLocked.Should().BeTrue();
            config.CategoryOverrides.Should().BeEmpty();
            config.Tiers.Should().HaveCount(4);
            config.Tiers.Should().OnlyContain(t => t.CommissionPercentage == 12.0m);
        }

        [Fact]
        public void UpdateCommissionConfig_Returns_BadRequest_Because_Policy_Is_Locked()
        {
            // Act
            var result = _controller.UpdateCommissionConfig(new AdminCommissionConfigDto
            {
                DefaultCommissionPercentage = 15.0m
            });

            // Assert
            var badResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
            var response = badResult.Value.Should().BeAssignableTo<ApiResponse>().Subject;
            response.Success.Should().BeFalse();
            response.Message.Should().Contain("12%");
        }
    }
}
