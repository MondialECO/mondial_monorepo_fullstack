using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using Moq;
using WebApp.Controllers;
using WebApp.DbContext;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Audit;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class AdminSystemTests
    {
        private readonly Mock<IMongoDatabase> _mockDb = new();
        private readonly Mock<IPlatformSettingsService> _mockSettingsService = new();
        private readonly Mock<IAuditLogger> _mockAuditLogger = new();
        private readonly Mock<ILogger<AdminSystemController>> _mockLogger = new();
        private readonly Mock<ILogger<PlatformSettingsService>> _mockSettingsLogger = new();
        private readonly MongoDbContext _context;

        public AdminSystemTests()
        {
            var mockUsers = new Mock<IMongoCollection<ApplicationUser>>();
            var mockInvVerifs = new Mock<IMongoCollection<InvestorFinanceVerification>>();
            var mockSpProfiles = new Mock<IMongoCollection<ServiceProviderProfileRecord>>();
            var mockReports = new Mock<IMongoCollection<ContentReport>>();
            var mockMilestones = new Mock<IMongoCollection<WorkroomMilestone>>();
            var mockPayouts = new Mock<IMongoCollection<PayoutRequest>>();
            var mockNotifs = new Mock<IMongoCollection<Notification>>();
            var mockSettings = new Mock<IMongoCollection<PlatformSettings>>();

            _mockDb.Setup(d => d.GetCollection<ApplicationUser>("applicationUsers", null)).Returns(mockUsers.Object);
            _mockDb.Setup(d => d.GetCollection<InvestorFinanceVerification>("InvestorFinanceVerifications", null)).Returns(mockInvVerifs.Object);
            _mockDb.Setup(d => d.GetCollection<ServiceProviderProfileRecord>("ServiceProviderProfiles", null)).Returns(mockSpProfiles.Object);
            _mockDb.Setup(d => d.GetCollection<ContentReport>("ContentReports", null)).Returns(mockReports.Object);
            _mockDb.Setup(d => d.GetCollection<WorkroomMilestone>("WorkroomMilestones", null)).Returns(mockMilestones.Object);
            _mockDb.Setup(d => d.GetCollection<PayoutRequest>("PayoutRequests", null)).Returns(mockPayouts.Object);
            _mockDb.Setup(d => d.GetCollection<Notification>("Notifications", null)).Returns(mockNotifs.Object);
            _mockDb.Setup(d => d.GetCollection<PlatformSettings>("PlatformSettings", null)).Returns(mockSettings.Object);

            _context = new MongoDbContext(_mockDb.Object);
        }

        private AdminSystemController CreateController(string role = "Admin")
        {
            var controller = new AdminSystemController(
                _context,
                _mockSettingsService.Object,
                _mockAuditLogger.Object,
                _mockLogger.Object
            );

            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "admin-user-001"),
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.Email, "admin@mondial.com")
            }, "TestAuth"));

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };

            return controller;
        }

        [Fact]
        public async Task GetSystemOverview_Returns200WithAllSections()
        {
            _mockSettingsService.Setup(s => s.GetAdminSettingsDtoAsync())
                .ReturnsAsync(new AdminPlatformSettingsDto());

            var controller = CreateController();
            var result = await controller.GetSystemOverview();

            var ok = result as OkObjectResult;
            ok.Should().NotBeNull();
            ok!.StatusCode.Should().Be(200);

            var apiResponse = ok.Value as ApiResponse;
            apiResponse.Should().NotBeNull();
            apiResponse!.Success.Should().BeTrue();

            var overview = apiResponse.Data as SystemOverviewDto;
            overview.Should().NotBeNull();
            overview!.Health.Should().NotBeNull();
            overview.JobStats.Should().NotBeNull();
            overview.Queues.Should().NotBeNull();
            overview.NotificationStats.Should().NotBeNull();
            overview.Environment.Should().NotBeNull();
        }

        [Fact]
        public async Task GetSystemHealth_Returns200WithSubsystemComponents()
        {
            var controller = CreateController();
            var result = await controller.GetSystemHealth();

            var ok = result as OkObjectResult;
            ok.Should().NotBeNull();
            ok!.StatusCode.Should().Be(200);

            var apiResponse = ok.Value as ApiResponse;
            var health = apiResponse!.Data as SystemHealthDto;
            health.Should().NotBeNull();
            health!.Api.Should().NotBeNull();
            health.Api.Status.Should().Be("Healthy");
            health.Database.Should().NotBeNull();
            health.Hangfire.Should().NotBeNull();
            health.Notifications.Should().NotBeNull();
            health.Storage.Should().NotBeNull();
        }

        [Fact]
        public async Task GetPlatformControls_ReturnsCurrentSettings()
        {
            var expected = new AdminPlatformSettingsDto
            {
                RegistrationEnabled = true,
                MarketplacePublishingEnabled = true,
                PayoutRequestsEnabled = true,
                ReportsEnabled = true,
                MaintenanceBannerEnabled = false,
                Version = 1
            };

            _mockSettingsService.Setup(s => s.GetAdminSettingsDtoAsync())
                .ReturnsAsync(expected);

            var controller = CreateController();
            var result = await controller.GetPlatformControls();

            var ok = result as OkObjectResult;
            ok.Should().NotBeNull();
            var apiResponse = ok!.Value as ApiResponse;
            var data = apiResponse!.Data as AdminPlatformSettingsDto;
            data.Should().BeEquivalentTo(expected);
        }

        [Fact]
        public async Task UpdatePlatformControls_WhenValid_ReturnsUpdatedSettingsAndRecordsAudit()
        {
            var request = new UpdatePlatformSettingsRequest
            {
                RegistrationEnabled = false,
                MarketplacePublishingEnabled = true,
                PayoutRequestsEnabled = true,
                ReportsEnabled = true,
                MaintenanceBannerEnabled = true,
                MaintenanceBannerTitle = "Maintenance Scheduled",
                MaintenanceBannerMessage = "System updating.",
                MaintenanceBannerSeverity = "warning",
                ExpectedVersion = 1
            };

            var updated = new AdminPlatformSettingsDto
            {
                RegistrationEnabled = false,
                MarketplacePublishingEnabled = true,
                PayoutRequestsEnabled = true,
                ReportsEnabled = true,
                MaintenanceBannerEnabled = true,
                MaintenanceBannerTitle = "Maintenance Scheduled",
                MaintenanceBannerMessage = "System updating.",
                MaintenanceBannerSeverity = "warning",
                Version = 2
            };

            _mockSettingsService.Setup(s => s.UpdateSettingsAsync(request, "admin-user-001"))
                .ReturnsAsync((true, "Platform settings updated successfully.", updated));

            var controller = CreateController();
            var result = await controller.UpdatePlatformControls(request);

            var ok = result as OkObjectResult;
            ok.Should().NotBeNull();
            ok!.StatusCode.Should().Be(200);

            _mockSettingsService.Verify(s => s.UpdateSettingsAsync(request, "admin-user-001"), Times.Once);
        }

        [Fact]
        public async Task UpdatePlatformControls_WhenVersionMismatch_Returns409Conflict()
        {
            var request = new UpdatePlatformSettingsRequest
            {
                RegistrationEnabled = false,
                ExpectedVersion = 1
            };

            _mockSettingsService.Setup(s => s.UpdateSettingsAsync(request, "admin-user-001"))
                .ReturnsAsync((false, "Settings were modified by another administrator.", null));

            var controller = CreateController();
            var result = await controller.UpdatePlatformControls(request);

            var conflict = result as ConflictObjectResult;
            conflict.Should().NotBeNull();
            conflict!.StatusCode.Should().Be(409);
        }

        [Fact]
        public void RetryJob_WhenJobIdEmpty_Returns400BadRequest()
        {
            var controller = CreateController();
            var result = controller.RetryJob("");

            var bad = result as BadRequestObjectResult;
            bad.Should().NotBeNull();
            bad!.StatusCode.Should().Be(400);
        }

        [Fact]
        public async Task PublicPlatformController_GetPublicSettings_Returns200WithSafeFlags()
        {
            _mockSettingsService.Setup(s => s.GetPublicSettingsDtoAsync())
                .ReturnsAsync(new PublicPlatformSettingsDto
                {
                    RegistrationEnabled = true,
                    MarketplacePublishingEnabled = true,
                    PayoutRequestsEnabled = true,
                    ReportsEnabled = true,
                    MaintenanceBannerEnabled = true,
                    MaintenanceBannerTitle = "Notice",
                    MaintenanceBannerMessage = "Upgrades ongoing.",
                    MaintenanceBannerSeverity = "info"
                });

            var controller = new PlatformController(_mockSettingsService.Object);
            var result = await controller.GetPublicSettings();

            var ok = result as OkObjectResult;
            ok.Should().NotBeNull();
            ok!.StatusCode.Should().Be(200);

            var apiResponse = ok.Value as ApiResponse;
            var settings = apiResponse!.Data as PublicPlatformSettingsDto;
            settings.Should().NotBeNull();
            settings!.MaintenanceBannerEnabled.Should().BeTrue();
            settings.MaintenanceBannerTitle.Should().Be("Notice");
        }

        [Fact]
        public async Task ReportsController_WhenReportsDisabled_Returns503()
        {
            var mockUserStore = new Mock<IUserStore<ApplicationUser>>();
            var mockUserManager = new Mock<UserManager<ApplicationUser>>(
                mockUserStore.Object, null!, null!, null!, null!, null!, null!, null!, null!);

            _mockSettingsService.Setup(s => s.IsReportsEnabledAsync())
                .ReturnsAsync(false);

            var controller = new ReportsController(
                _context,
                mockUserManager.Object,
                _mockAuditLogger.Object,
                _mockSettingsService.Object
            );

            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "user-001"),
                new Claim(ClaimTypes.Email, "user@test.com")
            }, "TestAuth"));

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };

            var request = new CreateReportRequest
            {
                TargetType = "ServiceListing",
                TargetId = "srv-101",
                Category = "Spam",
                Description = "Spam listing"
            };

            var result = await controller.CreateReport(request);

            var obj = result as ObjectResult;
            obj.Should().NotBeNull();
            obj!.StatusCode.Should().Be(503);
        }

        [Fact]
        public async Task EarningsController_WhenPayoutRequestsDisabled_Returns503()
        {
            var mockWorkroomService = new Mock<IWorkroomService>();
            _mockSettingsService.Setup(s => s.IsPayoutRequestsEnabledAsync())
                .ReturnsAsync(false);

            var controller = new EarningsController(
                mockWorkroomService.Object,
                _mockSettingsService.Object
            );

            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "sp-user-001"),
                new Claim(ClaimTypes.Role, "ServiceProvider")
            }, "TestAuth"));

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };

            var request = new CreatePayoutRequest
            {
                Amount = 500,
                PayoutMethodId = "pm-1"
            };

            var result = await controller.Payout(request);

            var obj = result as ObjectResult;
            obj.Should().NotBeNull();
            obj!.StatusCode.Should().Be(503);
        }

        [Fact]
        public void AdminSystemController_HasSuperAdminOnlyAuthorization()
        {
            var authAttrs = typeof(AdminSystemController)
                .GetCustomAttributes(typeof(Microsoft.AspNetCore.Authorization.AuthorizeAttribute), true)
                .Cast<Microsoft.AspNetCore.Authorization.AuthorizeAttribute>()
                .ToList();

            authAttrs.Should().NotBeEmpty();
            authAttrs.Should().ContainSingle(a => a.Roles == "SuperAdmin");
        }
    }
}
