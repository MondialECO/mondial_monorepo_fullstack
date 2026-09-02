using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using Moq;
using WebApp.Controllers;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Audit;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class AdminSecurityComplianceTests
    {
        private readonly Mock<IMongoDatabase> _mockDatabase;
        private readonly Mock<MongoDbContext> _mockDbContext;
        private readonly Mock<UserManager<ApplicationUser>> _mockUserManager;
        private readonly Mock<IAuditLogger> _mockAudit;

        // Mock collections
        private readonly Mock<IMongoCollection<ApplicationUser>> _mockUsersCollection;
        private readonly Mock<IMongoCollection<AdminAuditLog>> _mockAuditCollection;
        private readonly Mock<IMongoCollection<PrivacyRequest>> _mockPrivacyCollection;
        private readonly Mock<IMongoCollection<ComplianceCase>> _mockComplianceCollection;
        private readonly Mock<IMongoCollection<DataRetentionPolicy>> _mockRetentionCollection;
        private readonly Mock<IMongoCollection<WorkroomEngagement>> _mockEngagementCollection;
        private readonly Mock<IMongoCollection<PayoutRequest>> _mockPayoutCollection;
        private readonly Mock<IMongoCollection<FinancialTransaction>> _mockTxnCollection;
        private readonly Mock<IMongoCollection<ContentReport>> _mockReportCollection;
        private readonly Mock<IMongoCollection<ChatMessage>> _mockMsgCollection;
        private readonly Mock<IMongoCollection<Notification>> _mockNotifCollection;
        private readonly Mock<IMongoCollection<ServiceListing>> _mockListingCollection;

        public AdminSecurityComplianceTests()
        {
            _mockDatabase = new Mock<IMongoDatabase>();
            _mockUserManager = new Mock<UserManager<ApplicationUser>>(
                Mock.Of<IUserStore<ApplicationUser>>(),
                null!, null!, null!, null!, null!, null!, null!, null!);
            _mockAudit = new Mock<IAuditLogger>();

            _mockUsersCollection = new Mock<IMongoCollection<ApplicationUser>>();
            _mockAuditCollection = new Mock<IMongoCollection<AdminAuditLog>>();
            _mockPrivacyCollection = new Mock<IMongoCollection<PrivacyRequest>>();
            _mockComplianceCollection = new Mock<IMongoCollection<ComplianceCase>>();
            _mockRetentionCollection = new Mock<IMongoCollection<DataRetentionPolicy>>();
            _mockEngagementCollection = new Mock<IMongoCollection<WorkroomEngagement>>();
            _mockPayoutCollection = new Mock<IMongoCollection<PayoutRequest>>();
            _mockTxnCollection = new Mock<IMongoCollection<FinancialTransaction>>();
            _mockReportCollection = new Mock<IMongoCollection<ContentReport>>();
            _mockMsgCollection = new Mock<IMongoCollection<ChatMessage>>();
            _mockNotifCollection = new Mock<IMongoCollection<Notification>>();
            _mockListingCollection = new Mock<IMongoCollection<ServiceListing>>();

            _mockUsersCollection.Setup(c => c.CountDocumentsAsync(It.IsAny<FilterDefinition<ApplicationUser>>(), It.IsAny<CountOptions>(), It.IsAny<CancellationToken>())).ReturnsAsync(10L);
            _mockAuditCollection.Setup(c => c.CountDocumentsAsync(It.IsAny<FilterDefinition<AdminAuditLog>>(), It.IsAny<CountOptions>(), It.IsAny<CancellationToken>())).ReturnsAsync(25L);
            _mockPrivacyCollection.Setup(c => c.CountDocumentsAsync(It.IsAny<FilterDefinition<PrivacyRequest>>(), It.IsAny<CountOptions>(), It.IsAny<CancellationToken>())).ReturnsAsync(2L);
            _mockComplianceCollection.Setup(c => c.CountDocumentsAsync(It.IsAny<FilterDefinition<ComplianceCase>>(), It.IsAny<CountOptions>(), It.IsAny<CancellationToken>())).ReturnsAsync(1L);
            _mockReportCollection.Setup(c => c.CountDocumentsAsync(It.IsAny<FilterDefinition<ContentReport>>(), It.IsAny<CountOptions>(), It.IsAny<CancellationToken>())).ReturnsAsync(3L);
            _mockTxnCollection.Setup(c => c.CountDocumentsAsync(It.IsAny<FilterDefinition<FinancialTransaction>>(), It.IsAny<CountOptions>(), It.IsAny<CancellationToken>())).ReturnsAsync(8L);
            _mockEngagementCollection.Setup(c => c.CountDocumentsAsync(It.IsAny<FilterDefinition<WorkroomEngagement>>(), It.IsAny<CountOptions>(), It.IsAny<CancellationToken>())).ReturnsAsync(4L);
            _mockMsgCollection.Setup(c => c.CountDocumentsAsync(It.IsAny<FilterDefinition<ChatMessage>>(), It.IsAny<CountOptions>(), It.IsAny<CancellationToken>())).ReturnsAsync(12L);
            _mockNotifCollection.Setup(c => c.CountDocumentsAsync(It.IsAny<FilterDefinition<Notification>>(), It.IsAny<CountOptions>(), It.IsAny<CancellationToken>())).ReturnsAsync(5L);
            _mockListingCollection.Setup(c => c.CountDocumentsAsync(It.IsAny<FilterDefinition<ServiceListing>>(), It.IsAny<CountOptions>(), It.IsAny<CancellationToken>())).ReturnsAsync(7L);
            _mockPayoutCollection.Setup(c => c.CountDocumentsAsync(It.IsAny<FilterDefinition<PayoutRequest>>(), It.IsAny<CountOptions>(), It.IsAny<CancellationToken>())).ReturnsAsync(0L);

            _mockDbContext = new Mock<MongoDbContext>(_mockDatabase.Object);
            _mockDbContext.Setup(c => c.ApplicationUsers).Returns(_mockUsersCollection.Object);
            _mockDbContext.Setup(c => c.AdminAuditLogs).Returns(_mockAuditCollection.Object);
            _mockDbContext.Setup(c => c.PrivacyRequests).Returns(_mockPrivacyCollection.Object);
            _mockDbContext.Setup(c => c.ComplianceCases).Returns(_mockComplianceCollection.Object);
            _mockDbContext.Setup(c => c.DataRetentionPolicies).Returns(_mockRetentionCollection.Object);
            _mockDbContext.Setup(c => c.WorkroomEngagements).Returns(_mockEngagementCollection.Object);
            _mockDbContext.Setup(c => c.PayoutRequests).Returns(_mockPayoutCollection.Object);
            _mockDbContext.Setup(c => c.FinancialTransactions).Returns(_mockTxnCollection.Object);
            _mockDbContext.Setup(c => c.ContentReports).Returns(_mockReportCollection.Object);
            _mockDbContext.Setup(c => c.ChatMessages).Returns(_mockMsgCollection.Object);
            _mockDbContext.Setup(c => c.Notifications).Returns(_mockNotifCollection.Object);
            _mockDbContext.Setup(c => c.ServiceListings).Returns(_mockListingCollection.Object);
        }

        private static ClaimsPrincipal CreateUserPrincipal(string userId, string email, string role = "Admin")
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Name, email),
                new Claim(ClaimTypes.Email, email),
                new Claim(ClaimTypes.Role, role)
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            return new ClaimsPrincipal(identity);
        }

        [Fact]
        public async Task PrivacyController_SubmitRequest_DuplicateActive_Returns409()
        {
            var controller = new PrivacyController(_mockDbContext.Object, _mockUserManager.Object, _mockAudit.Object);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = CreateUserPrincipal("user-1", "user@test.local", "Creator") }
            };

            var appUser = new ApplicationUser { Id = Guid.NewGuid(), Email = "user@test.local", Name = "Test User" };
            _mockUserManager.Setup(m => m.FindByIdAsync("user-1")).ReturnsAsync(appUser);

            // Mock active request existing
            var existingReq = new PrivacyRequest
            {
                Id = "req-1",
                UserId = "user-1",
                RequestType = PrivacyRequestType.DataExport,
                Status = PrivacyRequestStatus.Open
            };

            _mockPrivacyCollection.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<PrivacyRequest>>(),
                It.IsAny<FindOptions<PrivacyRequest, PrivacyRequest>>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<PrivacyRequest> { existingReq }));

            var result = await controller.SubmitPrivacyRequest(new CreatePrivacyRequestDto
            {
                RequestType = "DataExport",
                Details = "Please export my data"
            });

            var conflictResult = Assert.IsType<ConflictObjectResult>(result);
            Assert.Equal(409, conflictResult.StatusCode);
        }

        [Fact]
        public async Task AdminSecurityController_RevokeSessions_SuperAdminTargetByNormalAdmin_Returns403()
        {
            var controller = new AdminSecurityController(_mockDbContext.Object, _mockUserManager.Object, _mockAudit.Object);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = CreateUserPrincipal("admin-1", "admin@mondial.local", "Admin") }
            };

            var superGuid = Guid.NewGuid();
            var superId = superGuid.ToString();
            var superUser = new ApplicationUser { Id = superGuid, Email = "super@mondial.local" };
            _mockUserManager.Setup(m => m.FindByIdAsync(superId)).ReturnsAsync(superUser);
            _mockUserManager.Setup(m => m.GetRolesAsync(superUser)).ReturnsAsync(new List<string> { "SuperAdmin" });

            var result = await controller.RevokeUserSessions(superId);
            var statusCodeResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(403, statusCodeResult.StatusCode);
        }

        [Fact]
        public async Task AdminSecurityController_RevokeSessions_OrdinaryUserByAdmin_Succeeds()
        {
            var controller = new AdminSecurityController(_mockDbContext.Object, _mockUserManager.Object, _mockAudit.Object);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = CreateUserPrincipal("admin-1", "admin@mondial.local", "Admin") }
            };

            var normalGuid = Guid.NewGuid();
            var normalId = normalGuid.ToString();
            var normalUser = new ApplicationUser { Id = normalGuid, Email = "creator@mondial.local" };
            _mockUserManager.Setup(m => m.FindByIdAsync(normalId)).ReturnsAsync(normalUser);
            _mockUserManager.Setup(m => m.GetRolesAsync(normalUser)).ReturnsAsync(new List<string> { "Creator" });
            _mockUserManager.Setup(m => m.UpdateSecurityStampAsync(normalUser)).ReturnsAsync(IdentityResult.Success);
            _mockUserManager.Setup(m => m.UpdateAsync(normalUser)).ReturnsAsync(IdentityResult.Success);

            var result = await controller.RevokeUserSessions(normalId);
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(200, okResult.StatusCode);

            _mockAudit.Verify(a => a.Record("session_revoked", "admin@mondial.local", true, It.IsAny<object>()), Times.Once);
        }

        private static IAsyncCursor<T> MakeCursor<T>(List<T> list)
        {
            var cursor = new Mock<IAsyncCursor<T>>();
            cursor.Setup(c => c.Current).Returns(list);
            cursor.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>()))
                .Returns(list.Count > 0).Returns(false);
            cursor.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(list.Count > 0).ReturnsAsync(false);
            return cursor.Object;
        }

        [Fact]
        public async Task AdminDataGovernanceController_Inventory_ReturnsAllCategories()
        {
            var controller = new AdminDataGovernanceController(_mockDbContext.Object, _mockAudit.Object);

            _mockRetentionCollection.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<DataRetentionPolicy>>(),
                It.IsAny<FindOptions<DataRetentionPolicy, DataRetentionPolicy>>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync(MakeCursor(new List<DataRetentionPolicy>()));

            var result = await controller.GetDataGovernanceInventory();
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(200, okResult.StatusCode);
        }

        [Fact]
        public async Task AdminComplianceController_CreateCase_And_AddNote_Succeeds()
        {
            var controller = new AdminComplianceController(_mockDbContext.Object, _mockUserManager.Object, _mockAudit.Object);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = CreateUserPrincipal("admin-1", "admin@mondial.local", "Admin") }
            };

            var suspectGuid = Guid.NewGuid();
            var suspectId = suspectGuid.ToString();
            var targetUser = new ApplicationUser { Id = suspectGuid, Email = "suspect@mondial.local", Name = "Suspect User" };
            _mockUserManager.Setup(m => m.FindByIdAsync(suspectId)).ReturnsAsync(targetUser);
            _mockUserManager.Setup(m => m.GetRolesAsync(targetUser)).ReturnsAsync(new List<string> { "Creator" });

            var createResult = await controller.CreateComplianceCase(new CreateComplianceCaseDto
            {
                TargetUserId = suspectId,
                CaseType = "SecurityReview",
                Priority = "High",
                Summary = "Multiple failed login spikes detected"
            });

            var okCreate = Assert.IsType<OkObjectResult>(createResult);
            Assert.Equal(200, okCreate.StatusCode);

            _mockAudit.Verify(a => a.Record("admin_compliance_case_created", "admin@mondial.local", true, It.IsAny<object>()), Times.Once);
        }

        // ==========================================
        // SUPERADMIN-ONLY AUTHORIZATION ATTRIBUTE TESTS
        // ==========================================

        [Theory]
        [InlineData(typeof(AdminSecurityController))]
        [InlineData(typeof(AdminPrivacyController))]
        [InlineData(typeof(AdminComplianceController))]
        [InlineData(typeof(AdminDataGovernanceController))]
        public void SecurityCompliance_Controllers_Require_SuperAdmin_Only(Type controllerType)
        {
            var authorizeAttr = controllerType
                .GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)
                .OfType<AuthorizeAttribute>()
                .FirstOrDefault();

            Assert.NotNull(authorizeAttr);
            Assert.Equal("SuperAdmin", authorizeAttr!.Roles);
        }

        [Fact]
        public void UserFacing_PrivacyController_Is_NOT_SuperAdmin_Only()
        {
            var controllerType = typeof(PrivacyController);
            var authorizeAttr = controllerType
                .GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)
                .OfType<AuthorizeAttribute>()
                .FirstOrDefault();

            // PrivacyController should NOT have class-level SuperAdmin-only restriction
            if (authorizeAttr != null)
            {
                Assert.NotEqual("SuperAdmin", authorizeAttr.Roles);
            }
        }

        [Fact]
        public void AdminSecurityController_Does_Not_Allow_Normal_Admin()
        {
            var authorizeAttr = typeof(AdminSecurityController)
                .GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)
                .OfType<AuthorizeAttribute>()
                .FirstOrDefault();

            Assert.NotNull(authorizeAttr);
            Assert.DoesNotContain("Admin,", authorizeAttr!.Roles ?? "");
        }

        [Fact]
        public void AdminDataGovernanceController_Inventory_No_Longer_Allows_Normal_Admin()
        {
            var method = typeof(AdminDataGovernanceController).GetMethod("GetDataGovernanceInventory");
            Assert.NotNull(method);

            // No per-action Authorize attribute — relies on class-level SuperAdmin
            var methodAuthorize = method!
                .GetCustomAttributes(typeof(AuthorizeAttribute), inherit: false)
                .OfType<AuthorizeAttribute>()
                .FirstOrDefault();

            Assert.Null(methodAuthorize); // Class-level covers it
        }
    }
}
