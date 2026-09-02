using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using Moq;
using WebApp.Controllers;
using WebApp.DbContext;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class AdminAuditTests
    {
        private readonly Mock<IMongoDatabase> _mockDb;
        private readonly MongoDbContext _context;
        private readonly Mock<IMongoCollection<AdminAuditLog>> _mockAuditCollection;
        private readonly Mock<IMongoCollection<ContentReport>> _mockReportCollection;
        private readonly Mock<IMongoCollection<ServiceListing>> _mockServiceCollection;
        private readonly Mock<IMongoCollection<CreatorIdea>> _mockIdeaCollection;
        private readonly Mock<IMongoCollection<Review>> _mockReviewCollection;
        private readonly Mock<IMongoCollection<ApplicationUser>> _mockUserCollection;
        private readonly Mock<IMongoCollection<WorkroomMilestone>> _mockMilestoneCollection;

        private readonly AdminAuditController _controller;

        public AdminAuditTests()
        {
            _mockDb = new Mock<IMongoDatabase>();
            _mockAuditCollection = new Mock<IMongoCollection<AdminAuditLog>>();
            _mockReportCollection = new Mock<IMongoCollection<ContentReport>>();
            _mockServiceCollection = new Mock<IMongoCollection<ServiceListing>>();
            _mockIdeaCollection = new Mock<IMongoCollection<CreatorIdea>>();
            _mockReviewCollection = new Mock<IMongoCollection<Review>>();
            _mockUserCollection = new Mock<IMongoCollection<ApplicationUser>>();
            _mockMilestoneCollection = new Mock<IMongoCollection<WorkroomMilestone>>();

            _mockDb.Setup(d => d.GetCollection<AdminAuditLog>("AdminAuditLogs", null))
                .Returns(_mockAuditCollection.Object);
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
            _mockDb.Setup(d => d.GetCollection<WorkroomMilestone>("WorkroomMilestones", null))
                .Returns(_mockMilestoneCollection.Object);

            _context = new MongoDbContext(_mockDb.Object);
            _controller = new AdminAuditController(_context);
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
        public async Task GetAuditLogs_ReturnsPagedList()
        {
            var logs = new List<AdminAuditLog>
            {
                new AdminAuditLog
                {
                    Id = "log-1",
                    Action = "admin_service_hidden",
                    Actor = "admin@mondial.com",
                    Success = true,
                    TargetType = "ServiceListing",
                    TargetId = "srv-101",
                    Timestamp = DateTime.UtcNow,
                    Details = new BsonDocument { ["serviceId"] = "srv-101", ["reason"] = "Misleading" }
                }
            };

            _mockAuditCollection
                .Setup(c => c.CountDocumentsAsync(
                    It.IsAny<FilterDefinition<AdminAuditLog>>(),
                    It.IsAny<CountOptions>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(1);

            _mockAuditCollection
                .Setup(c => c.FindAsync(
                    It.IsAny<FilterDefinition<AdminAuditLog>>(),
                    It.IsAny<FindOptions<AdminAuditLog, AdminAuditLog>>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(logs));

            var res = await _controller.GetAuditLogs(1, 10, null, null, null, null, null, null, null);

            var okResult = Assert.IsType<OkObjectResult>(res);
            var envelope = okResult.Value as ApiResponse;
            Assert.NotNull(envelope);
            Assert.True(envelope!.Success);
            var data = envelope.Data as PagedResult<AdminAuditLogItemDto>;
            Assert.NotNull(data);
            Assert.Single(data!.Items);
            Assert.Equal("admin_service_hidden", data.Items[0].Action);
        }

        [Fact]
        public async Task GetGovernanceSummary_ReturnsRealKPIs()
        {
            _mockReportCollection.Setup(c => c.CountDocumentsAsync(It.IsAny<FilterDefinition<ContentReport>>(), It.IsAny<CountOptions>(), default)).ReturnsAsync(3);
            _mockServiceCollection.Setup(c => c.CountDocumentsAsync(It.IsAny<FilterDefinition<ServiceListing>>(), It.IsAny<CountOptions>(), default)).ReturnsAsync(2);
            _mockIdeaCollection.Setup(c => c.CountDocumentsAsync(It.IsAny<FilterDefinition<CreatorIdea>>(), It.IsAny<CountOptions>(), default)).ReturnsAsync(1);
            _mockReviewCollection.Setup(c => c.CountDocumentsAsync(It.IsAny<FilterDefinition<Review>>(), It.IsAny<CountOptions>(), default)).ReturnsAsync(0);
            _mockUserCollection.Setup(c => c.CountDocumentsAsync(It.IsAny<FilterDefinition<ApplicationUser>>(), It.IsAny<CountOptions>(), default)).ReturnsAsync(4);
            _mockMilestoneCollection.Setup(c => c.CountDocumentsAsync(It.IsAny<FilterDefinition<WorkroomMilestone>>(), It.IsAny<CountOptions>(), default)).ReturnsAsync(0);
            _mockAuditCollection.Setup(c => c.CountDocumentsAsync(It.IsAny<FilterDefinition<AdminAuditLog>>(), It.IsAny<CountOptions>(), default)).ReturnsAsync(15);
            _mockAuditCollection.Setup(c => c.FindAsync(It.IsAny<FilterDefinition<AdminAuditLog>>(), It.IsAny<FindOptions<AdminAuditLog, AdminAuditLog>>(), default))
                .ReturnsAsync(() => MakeCursor(new List<AdminAuditLog>()));

            var res = await _controller.GetGovernanceSummary();

            var okResult = Assert.IsType<OkObjectResult>(res);
            var envelope = okResult.Value as ApiResponse;
            Assert.NotNull(envelope);
            Assert.True(envelope!.Success);
            var summary = envelope.Data as AdminGovernanceSummaryDto;
            Assert.NotNull(summary);
            Assert.Equal(3, summary!.TotalReportsCount);
            Assert.Equal(15, summary.TotalAuditEventsCount);
        }
    }
}
