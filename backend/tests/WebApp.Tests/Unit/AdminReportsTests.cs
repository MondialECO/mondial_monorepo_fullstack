using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using Moq;
using WebApp.Controllers;
using WebApp.DbContext;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Audit;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class AdminReportsTests
    {
        private readonly Mock<IMongoDatabase> _mockDb;
        private readonly MongoDbContext _context;
        private readonly Mock<UserManager<ApplicationUser>> _mockUserManager;
        private readonly Mock<IAuditLogger> _mockAuditLogger;

        private readonly Mock<IMongoCollection<ContentReport>> _mockReportCollection;
        private readonly Mock<IMongoCollection<ServiceListing>> _mockServiceCollection;
        private readonly Mock<IMongoCollection<CreatorIdea>> _mockIdeaCollection;
        private readonly Mock<IMongoCollection<Review>> _mockReviewCollection;
        private readonly Mock<IMongoCollection<ApplicationUser>> _mockUserCollection;

        private readonly ReportsController _reportsController;
        private readonly AdminReportsController _adminReportsController;

        public AdminReportsTests()
        {
            _mockDb = new Mock<IMongoDatabase>();
            _mockReportCollection = new Mock<IMongoCollection<ContentReport>>();
            _mockServiceCollection = new Mock<IMongoCollection<ServiceListing>>();
            _mockIdeaCollection = new Mock<IMongoCollection<CreatorIdea>>();
            _mockReviewCollection = new Mock<IMongoCollection<Review>>();
            _mockUserCollection = new Mock<IMongoCollection<ApplicationUser>>();

            _mockDb.Setup(d => d.GetCollection<ContentReport>("ContentReports", null))
                .Returns(_mockReportCollection.Object);
            _mockDb.Setup(d => d.GetCollection<ServiceListing>("ServiceListings", null))
                .Returns(_mockServiceCollection.Object);
            _mockDb.Setup(d => d.GetCollection<CreatorIdea>("CreatorIdeas", null))
                .Returns(_mockIdeaCollection.Object);
            _mockDb.Setup(d => d.GetCollection<Review>("Reviews", null))
                .Returns(_mockReviewCollection.Object);
            _mockDb.Setup(d => d.GetCollection<ApplicationUser>("applicationUsers", null))
                .Returns(_mockUserCollection.Object);

            _context = new MongoDbContext(_mockDb.Object);

            var store = new Mock<IUserStore<ApplicationUser>>();
            _mockUserManager = new Mock<UserManager<ApplicationUser>>(
                store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

            _mockAuditLogger = new Mock<IAuditLogger>();

            _reportsController = new ReportsController(_context, _mockUserManager.Object, _mockAuditLogger.Object);
            _adminReportsController = new AdminReportsController(_context, _mockUserManager.Object, _mockAuditLogger.Object);

            // User context for regular reports
            var userClaims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, "user-reporter-1"),
                new Claim(ClaimTypes.Email, "reporter@mondial.com"),
                new Claim(ClaimTypes.Role, "Creator")
            };
            _reportsController.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity(userClaims, "TestAuth")) }
            };

            // Admin context for admin moderation
            var adminClaims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, "admin-1"),
                new Claim(ClaimTypes.Email, "admin@mondial.com"),
                new Claim(ClaimTypes.Role, "Admin")
            };
            _adminReportsController.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity(adminClaims, "TestAuth")) }
            };
        }

        private static IAsyncCursor<T> MakeCursor<T>(List<T> items)
        {
            var mockCursor = new Mock<IAsyncCursor<T>>();
            mockCursor.SetupSequence(x => x.MoveNext(It.IsAny<CancellationToken>())).Returns(true).Returns(false);
            mockCursor.SetupSequence(x => x.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true).ReturnsAsync(false);
            mockCursor.Setup(x => x.Current).Returns(items);
            return mockCursor.Object;
        }

        [Fact]
        public async Task User_CreateReport_ValidService_Returns200()
        {
            var serviceId = ObjectId.GenerateNewId().ToString();
            var user = new ApplicationUser { Id = Guid.NewGuid(), Email = "reporter@mondial.com", Name = "Alice" };
            _mockUserManager.Setup(u => u.FindByIdAsync("user-reporter-1")).ReturnsAsync(user);

            // Service exists
            _mockServiceCollection
                .Setup(c => c.FindAsync(
                    It.IsAny<FilterDefinition<ServiceListing>>(),
                    It.IsAny<FindOptions<ServiceListing, ServiceListing>>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<ServiceListing> { new ServiceListing { Id = serviceId } }));

            // No active duplicates
            _mockReportCollection
                .Setup(c => c.FindAsync(
                    It.IsAny<FilterDefinition<ContentReport>>(),
                    It.IsAny<FindOptions<ContentReport, ContentReport>>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<ContentReport>()));

            var res = await _reportsController.CreateReport(new CreateReportRequest
            {
                TargetType = "ServiceListing",
                TargetId = serviceId,
                Category = "Spam",
                Description = "Unsolicited spam links in description"
            });

            var okResult = Assert.IsType<OkObjectResult>(res);
            var envelope = okResult.Value as ApiResponse;
            Assert.NotNull(envelope);
            Assert.True(envelope!.Success);
            _mockReportCollection.Verify(c => c.InsertOneAsync(It.IsAny<ContentReport>(), null, default), Times.Once);
            _mockAuditLogger.Verify(a => a.Record("report_submitted", "reporter@mondial.com", true, It.IsAny<object>()), Times.Once);
        }

        [Fact]
        public async Task User_CreateReport_MissingTarget_Returns404()
        {
            var missingServiceId = ObjectId.GenerateNewId().ToString();
            var user = new ApplicationUser { Id = Guid.NewGuid(), Email = "reporter@mondial.com" };
            _mockUserManager.Setup(u => u.FindByIdAsync("user-reporter-1")).ReturnsAsync(user);

            // Service does not exist
            _mockServiceCollection
                .Setup(c => c.FindAsync(
                    It.IsAny<FilterDefinition<ServiceListing>>(),
                    It.IsAny<FindOptions<ServiceListing, ServiceListing>>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<ServiceListing>()));

            var res = await _reportsController.CreateReport(new CreateReportRequest
            {
                TargetType = "ServiceListing",
                TargetId = missingServiceId,
                Category = "FraudOrScamConcern",
                Description = "Fake listing"
            });

            var notFoundResult = Assert.IsType<NotFoundObjectResult>(res);
            var envelope = notFoundResult.Value as ApiResponse;
            Assert.NotNull(envelope);
            Assert.False(envelope!.Success);
        }

        [Fact]
        public async Task User_CreateReport_DuplicateActiveReport_Returns409()
        {
            var serviceId = ObjectId.GenerateNewId().ToString();
            var user = new ApplicationUser { Id = Guid.NewGuid(), Email = "reporter@mondial.com" };
            _mockUserManager.Setup(u => u.FindByIdAsync("user-reporter-1")).ReturnsAsync(user);

            // Service exists
            _mockServiceCollection
                .Setup(c => c.FindAsync(
                    It.IsAny<FilterDefinition<ServiceListing>>(),
                    It.IsAny<FindOptions<ServiceListing, ServiceListing>>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<ServiceListing> { new ServiceListing { Id = serviceId } }));

            // Active duplicate exists
            _mockReportCollection
                .Setup(c => c.FindAsync(
                    It.IsAny<FilterDefinition<ContentReport>>(),
                    It.IsAny<FindOptions<ContentReport, ContentReport>>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<ContentReport>
                {
                    new ContentReport { Id = ObjectId.GenerateNewId().ToString(), ReporterUserId = "user-reporter-1", TargetId = serviceId, Status = ReportStatus.Open }
                }));

            var res = await _reportsController.CreateReport(new CreateReportRequest
            {
                TargetType = "ServiceListing",
                TargetId = serviceId,
                Category = "Spam",
                Description = "Duplicate submission"
            });

            var conflictResult = Assert.IsType<ConflictObjectResult>(res);
            var envelope = conflictResult.Value as ApiResponse;
            Assert.NotNull(envelope);
            Assert.False(envelope!.Success);
        }

        [Fact]
        public async Task Admin_MarkUnderReview_FromOpen_Returns200()
        {
            var reportId = ObjectId.GenerateNewId().ToString();
            var updatedReport = new ContentReport
            {
                Id = reportId,
                Status = ReportStatus.UnderReview,
                ReviewedByAdminId = "admin-1",
                ReviewedAt = DateTime.UtcNow
            };

            _mockReportCollection
                .Setup(c => c.FindOneAndUpdateAsync(
                    It.IsAny<FilterDefinition<ContentReport>>(),
                    It.IsAny<UpdateDefinition<ContentReport>>(),
                    It.IsAny<FindOneAndUpdateOptions<ContentReport, ContentReport>>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(updatedReport);

            var res = await _adminReportsController.MarkUnderReview(reportId);

            var okResult = Assert.IsType<OkObjectResult>(res);
            var envelope = okResult.Value as ApiResponse;
            Assert.NotNull(envelope);
            Assert.True(envelope!.Success);
            _mockAuditLogger.Verify(a => a.Record("admin_report_under_review", "admin@mondial.com", true, It.IsAny<object>()), Times.Once);
        }

        [Fact]
        public async Task Admin_ResolveReport_WithHide_ExecutesModeration_AndReturns200()
        {
            var reportId = ObjectId.GenerateNewId().ToString();
            var serviceId = ObjectId.GenerateNewId().ToString();

            var existingReport = new ContentReport
            {
                Id = reportId,
                TargetType = ReportTargetType.ServiceListing,
                TargetId = serviceId,
                Status = ReportStatus.UnderReview,
                Description = "Illegal terms"
            };

            _mockReportCollection
                .Setup(c => c.FindAsync(
                    It.IsAny<FilterDefinition<ContentReport>>(),
                    It.IsAny<FindOptions<ContentReport, ContentReport>>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<ContentReport> { existingReport }));

            var resolvedReport = new ContentReport
            {
                Id = reportId,
                TargetType = ReportTargetType.ServiceListing,
                TargetId = serviceId,
                Status = ReportStatus.Resolved,
                Resolution = "Resolved: Content Hidden via Moderation",
                ReviewedByAdminId = "admin-1",
                ReviewedAt = DateTime.UtcNow
            };

            _mockReportCollection
                .Setup(c => c.FindOneAndUpdateAsync(
                    It.IsAny<FilterDefinition<ContentReport>>(),
                    It.IsAny<UpdateDefinition<ContentReport>>(),
                    It.IsAny<FindOneAndUpdateOptions<ContentReport, ContentReport>>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(resolvedReport);

            var res = await _adminReportsController.ResolveReport(reportId, new ResolveReportRequest
            {
                ResolutionAction = "hide",
                Notes = "Violation verified"
            });

            var okResult = Assert.IsType<OkObjectResult>(res);
            var envelope = okResult.Value as ApiResponse;
            Assert.NotNull(envelope);
            Assert.True(envelope!.Success);

            // Verified moderation update on ServiceListing
            _mockServiceCollection.Verify(c => c.UpdateOneAsync(
                It.IsAny<FilterDefinition<ServiceListing>>(),
                It.IsAny<UpdateDefinition<ServiceListing>>(),
                null,
                default), Times.Once);

            _mockAuditLogger.Verify(a => a.Record("admin_service_hidden", "admin@mondial.com", true, It.IsAny<object>()), Times.Once);
            _mockAuditLogger.Verify(a => a.Record("admin_report_resolved_with_moderation", "admin@mondial.com", true, It.IsAny<object>()), Times.Once);
        }
    }
}
