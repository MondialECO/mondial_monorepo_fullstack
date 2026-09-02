using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using Moq;
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
    public class AdminCommerceTests
    {
        private readonly Mock<IMongoDatabase> _mockDb;
        private readonly MongoDbContext _context;
        private readonly Mock<UserManager<ApplicationUser>> _mockUserManager;
        private readonly Mock<IWorkroomService> _mockWorkroomService;
        private readonly Mock<IAuditLogger> _mockAuditLogger;
        private readonly Mock<IMongoCollection<PayoutRequest>> _mockPayoutCollection;
        private readonly Mock<IMongoCollection<FinancialTransaction>> _mockTxCollection;
        private readonly Mock<IMongoCollection<WorkroomAuditEvent>> _mockAuditCollection;
        private readonly Mock<IMongoCollection<WorkroomMilestone>> _mockMilestoneCollection;
        private readonly Mock<IMongoCollection<WorkroomEngagement>> _mockEngagementCollection;
        private readonly Mock<IMongoCollection<RevisionRequest>> _mockRevisionCollection;
        private readonly Mock<IMongoCollection<Contract>> _mockContractCollection;
        private readonly Mock<IMongoCollection<Deliverable>> _mockDeliverableCollection;
        private readonly Mock<IMongoCollection<ApplicationUser>> _mockUserCollection;
        private readonly AdminCommerceController _controller;

        public AdminCommerceTests()
        {
            _mockDb = new Mock<IMongoDatabase>();
            _mockPayoutCollection = new Mock<IMongoCollection<PayoutRequest>>();
            _mockTxCollection = new Mock<IMongoCollection<FinancialTransaction>>();
            _mockAuditCollection = new Mock<IMongoCollection<WorkroomAuditEvent>>();
            _mockMilestoneCollection = new Mock<IMongoCollection<WorkroomMilestone>>();
            _mockEngagementCollection = new Mock<IMongoCollection<WorkroomEngagement>>();
            _mockRevisionCollection = new Mock<IMongoCollection<RevisionRequest>>();
            _mockContractCollection = new Mock<IMongoCollection<Contract>>();
            _mockDeliverableCollection = new Mock<IMongoCollection<Deliverable>>();
            _mockUserCollection = new Mock<IMongoCollection<ApplicationUser>>();

            _mockDb.Setup(d => d.GetCollection<PayoutRequest>("PayoutRequests", null))
                .Returns(_mockPayoutCollection.Object);
            _mockDb.Setup(d => d.GetCollection<FinancialTransaction>("FinancialTransactions", null))
                .Returns(_mockTxCollection.Object);
            _mockDb.Setup(d => d.GetCollection<WorkroomAuditEvent>("WorkroomAuditEvents", null))
                .Returns(_mockAuditCollection.Object);
            _mockDb.Setup(d => d.GetCollection<WorkroomMilestone>("WorkroomMilestones", null))
                .Returns(_mockMilestoneCollection.Object);
            _mockDb.Setup(d => d.GetCollection<WorkroomEngagement>("WorkroomEngagements", null))
                .Returns(_mockEngagementCollection.Object);
            _mockDb.Setup(d => d.GetCollection<RevisionRequest>("RevisionRequests", null))
                .Returns(_mockRevisionCollection.Object);
            _mockDb.Setup(d => d.GetCollection<Contract>("Contracts", null))
                .Returns(_mockContractCollection.Object);
            _mockDb.Setup(d => d.GetCollection<Deliverable>("Deliverables", null))
                .Returns(_mockDeliverableCollection.Object);
            _mockDb.Setup(d => d.GetCollection<ApplicationUser>("applicationUsers", null))
                .Returns(_mockUserCollection.Object);

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
        public void Controller_Has_Authorize_Admin_Attribute()
        {
            var attributes = typeof(AdminCommerceController).GetCustomAttributes(typeof(Microsoft.AspNetCore.Authorization.AuthorizeAttribute), true);
            Assert.NotEmpty(attributes);
            var auth = (Microsoft.AspNetCore.Authorization.AuthorizeAttribute)attributes[0];
            Assert.Equal("Admin,SuperAdmin", auth.Roles);
        }

        [Fact]
        public void AdminPayoutActionRequest_Requires_Reason()
        {
            var req = new AdminPayoutActionRequest();
            var validationContext = new System.ComponentModel.DataAnnotations.ValidationContext(req);
            var results = new List<System.ComponentModel.DataAnnotations.ValidationResult>();
            var isValid = System.ComponentModel.DataAnnotations.Validator.TryValidateObject(req, validationContext, results, true);

            Assert.False(isValid);
            Assert.Contains(results, r => r.MemberNames.Contains("Reason") || r.ErrorMessage!.Contains("required", StringComparison.OrdinalIgnoreCase));
        }

        [Fact]
        public void Dto_Field_Completeness_And_Serialization()
        {
            var metrics = new AdminCommerceMetricsDto
            {
                TotalEngagements = 20,
                ActiveEngagements = 5,
                CompletedEngagements = 12,
                OpenDisputes = 2,
                PendingPayoutRequests = 3,
                PendingPayoutVolume = 1500.50m,
                RecentTransactionVolume30Days = 12400m,
                GrossTransactionVolume = 50000m,
                PlatformCommission = 5000m,
                RefundedAmount = 500m,
                Currency = "EUR"
            };

            var json = System.Text.Json.JsonSerializer.Serialize(metrics);
            Assert.Contains("ActiveEngagements", json);
            Assert.Contains("PendingPayoutVolume", json);
            Assert.Contains("GrossTransactionVolume", json);

            var deserialized = System.Text.Json.JsonSerializer.Deserialize<AdminCommerceMetricsDto>(json);
            Assert.NotNull(deserialized);
            Assert.Equal(5, deserialized!.ActiveEngagements);
            Assert.Equal(1500.50m, deserialized.PendingPayoutVolume);
            Assert.Equal(50000m, deserialized.GrossTransactionVolume);
        }

        [Fact]
        public void Payout_Masking_Protects_Sensitive_Bank_Data()
        {
            var provider = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                Name = "John Provider",
                ServiceProviderProfile = new ServiceProviderProfile
                {
                    FinancialSettings = new ProviderFinancialSettings
                    {
                        PayoutMethods = new List<MaskedPayoutMethod>
                        {
                            new MaskedPayoutMethod
                            {
                                Id = "pm-1",
                                DisplayName = "Primary Checking",
                                MaskedDescriptor = "SEPA **** 9876",
                                Rail = PayoutRail.BankTransfer,
                                Verified = true
                            }
                        }
                    }
                }
            };

            var item = new AdminPayoutListItemDto
            {
                Id = "payout-123",
                ProviderId = provider.Id.ToString(),
                ProviderName = provider.Name,
                Amount = 500m,
                Currency = "EUR",
                Status = "Requested",
                PayoutMethodId = "pm-1",
                PayoutMethodLabel = provider.ServiceProviderProfile.FinancialSettings.PayoutMethods[0].DisplayName,
                MaskedDestination = provider.ServiceProviderProfile.FinancialSettings.PayoutMethods[0].MaskedDescriptor
            };

            Assert.Equal("SEPA **** 9876", item.MaskedDestination);
            Assert.DoesNotContain("DE89", item.MaskedDestination);
        }

        [Fact]
        public async Task ResolveDispute_Calls_WorkroomService_And_Audit()
        {
            _mockWorkroomService
                .Setup(s => s.ResolveDisputeAsync("admin-user-id", "ms-1", "ClientFavored", "Refund requested by client"))
                .ReturnsAsync(ServiceProviderResult<WorkroomDetailResponse>.Ok(new WorkroomDetailResponse(), "Dispute resolved"));

            var res = await _controller.ResolveDispute("ms-1", new ResolveDisputeRequest
            {
                Outcome = "refund_buyer",
                Reason = "Refund requested by client"
            });

            var okResult = Assert.IsType<OkObjectResult>(res);
            _mockAuditLogger.Verify(a => a.Record("admin_dispute_resolved", "admin@mondial.com", true, It.IsAny<object>()), Times.Once);
        }

        [Fact]
        public async Task ResolveDispute_When_Already_Resolved_Returns_409_Conflict()
        {
            _mockWorkroomService
                .Setup(s => s.ResolveDisputeAsync("admin-user-id", "ms-1", "ClientFavored", "Duplicate resolve"))
                .ReturnsAsync(ServiceProviderResult<WorkroomDetailResponse>.Conflict("No open dispute exists."));

            var res = await _controller.ResolveDispute("ms-1", new ResolveDisputeRequest
            {
                Outcome = "ClientFavored",
                Reason = "Duplicate resolve"
            });

            var conflictResult = Assert.IsType<ConflictObjectResult>(res);
            _mockAuditLogger.Verify(a => a.Record("admin_dispute_resolved", "admin@mondial.com", false, It.IsAny<object>()), Times.Once);
        }

        [Fact]
        public async Task ApprovePayout_When_Status_Already_Changed_Returns_409_Conflict()
        {
            // Simulate FindOneAndUpdateAsync returning null because Status != Requested
            _mockPayoutCollection
                .Setup(c => c.FindOneAndUpdateAsync(
                    It.IsAny<FilterDefinition<PayoutRequest>>(),
                    It.IsAny<UpdateDefinition<PayoutRequest>>(),
                    It.IsAny<FindOneAndUpdateOptions<PayoutRequest, PayoutRequest>>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync((PayoutRequest)null!);

            var existingPayout = new PayoutRequest
            {
                Id = "payout-1",
                ProviderId = "p-1",
                Amount = 100m,
                Status = PayoutStatus.Completed
            };

            var mockCursor = new Mock<IAsyncCursor<PayoutRequest>>();
            mockCursor.SetupSequence(x => x.MoveNext(It.IsAny<CancellationToken>()))
                .Returns(true)
                .Returns(false);
            mockCursor.SetupSequence(x => x.MoveNextAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(true)
                .ReturnsAsync(false);
            mockCursor.Setup(x => x.Current).Returns(new List<PayoutRequest> { existingPayout });

            _mockPayoutCollection
                .Setup(c => c.FindAsync(
                    It.IsAny<FilterDefinition<PayoutRequest>>(),
                    It.IsAny<FindOptions<PayoutRequest, PayoutRequest>>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(mockCursor.Object);

            var res = await _controller.ApprovePayout("payout-1", new AdminPayoutActionRequest
            {
                Reason = "Approve payment"
            });

            var conflictResult = Assert.IsType<ConflictObjectResult>(res);
            _mockAuditLogger.Verify(a => a.Record("financial_action_denied", "admin@mondial.com", false, It.IsAny<object>()), Times.Once);
        }

        [Fact]
        public async Task RejectPayout_When_Status_Already_Completed_Returns_409_Conflict()
        {
            var existingPayout = new PayoutRequest
            {
                Id = "payout-1",
                ProviderId = "p-1",
                Amount = 100m,
                Status = PayoutStatus.Completed
            };

            var mockCursor = new Mock<IAsyncCursor<PayoutRequest>>();
            mockCursor.SetupSequence(x => x.MoveNext(It.IsAny<CancellationToken>()))
                .Returns(true)
                .Returns(false);
            mockCursor.SetupSequence(x => x.MoveNextAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(true)
                .ReturnsAsync(false);
            mockCursor.Setup(x => x.Current).Returns(new List<PayoutRequest> { existingPayout });

            _mockPayoutCollection
                .Setup(c => c.FindAsync(
                    It.IsAny<FilterDefinition<PayoutRequest>>(),
                    It.IsAny<FindOptions<PayoutRequest, PayoutRequest>>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(mockCursor.Object);

            _mockPayoutCollection
                .Setup(c => c.FindOneAndUpdateAsync(
                    It.IsAny<FilterDefinition<PayoutRequest>>(),
                    It.IsAny<UpdateDefinition<PayoutRequest>>(),
                    It.IsAny<FindOneAndUpdateOptions<PayoutRequest, PayoutRequest>>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync((PayoutRequest)null!);

            var res = await _controller.RejectPayout("payout-1", new AdminPayoutActionRequest
            {
                Reason = "Suspected fraud"
            });

            var conflictResult = Assert.IsType<ConflictObjectResult>(res);
            _mockAuditLogger.Verify(a => a.Record("financial_action_denied", "admin@mondial.com", false, It.IsAny<object>()), Times.Once);
        }

        [Fact]
        public async Task MarkPayoutProcessed_When_Status_Already_Completed_Returns_409_Conflict()
        {
            var existingPayout = new PayoutRequest
            {
                Id = "payout-1",
                ProviderId = "p-1",
                Amount = 100m,
                Status = PayoutStatus.Completed
            };

            var mockCursor = new Mock<IAsyncCursor<PayoutRequest>>();
            mockCursor.SetupSequence(x => x.MoveNext(It.IsAny<CancellationToken>()))
                .Returns(true)
                .Returns(false);
            mockCursor.SetupSequence(x => x.MoveNextAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(true)
                .ReturnsAsync(false);
            mockCursor.Setup(x => x.Current).Returns(new List<PayoutRequest> { existingPayout });

            _mockPayoutCollection
                .Setup(c => c.FindAsync(
                    It.IsAny<FilterDefinition<PayoutRequest>>(),
                    It.IsAny<FindOptions<PayoutRequest, PayoutRequest>>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(mockCursor.Object);

            var res = await _controller.MarkPayoutProcessed("payout-1", new AdminPayoutActionRequest
            {
                Reason = "Processed via SEPA",
                Reference = "SEPA-TX-999"
            });

            var conflictResult = Assert.IsType<ConflictObjectResult>(res);
            _mockAuditLogger.Verify(a => a.Record("financial_action_denied", "admin@mondial.com", false, It.IsAny<object>()), Times.Never);
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
        public async Task GetDisputes_Empty_Returns200_WithEmptyList()
        {
            _mockMilestoneCollection
                .Setup(c => c.FindAsync(
                    It.IsAny<FilterDefinition<WorkroomMilestone>>(),
                    It.IsAny<FindOptions<WorkroomMilestone, WorkroomMilestone>>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<WorkroomMilestone>()));

            var res = await _controller.GetDisputes();

            var okRes = Assert.IsType<OkObjectResult>(res);
            var envelope = okRes.Value as ApiResponse;
            Assert.NotNull(envelope);
            Assert.True(envelope!.Success);
            var items = envelope.Data as List<AdminDisputeListItemDto>;
            Assert.NotNull(items);
            Assert.Empty(items);
        }

        [Fact]
        public async Task GetDisputes_WithDisputes_And_NullLegacyRecords_Returns200()
        {
            var disputedMilestone = new WorkroomMilestone
            {
                Id = "ms-101",
                EngagementId = "eng-202",
                Title = null!, // Legacy record with null title
                MilestoneStatus = WorkroomMilestoneStatus.Disputed,
                DisputeOpenedAt = DateTime.UtcNow.AddDays(-2),
                Amount = 500m,
                Currency = null! // Legacy record with null currency
            };

            _mockMilestoneCollection
                .Setup(c => c.FindAsync(
                    It.IsAny<FilterDefinition<WorkroomMilestone>>(),
                    It.IsAny<FindOptions<WorkroomMilestone, WorkroomMilestone>>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<WorkroomMilestone> { disputedMilestone }));

            _mockEngagementCollection
                .Setup(c => c.FindAsync(
                    It.IsAny<FilterDefinition<WorkroomEngagement>>(),
                    It.IsAny<FindOptions<WorkroomEngagement, WorkroomEngagement>>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<WorkroomEngagement>()));

            _mockRevisionCollection
                .Setup(c => c.FindAsync(
                    It.IsAny<FilterDefinition<RevisionRequest>>(),
                    It.IsAny<FindOptions<RevisionRequest, RevisionRequest>>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<RevisionRequest>()));

            _mockUserCollection
                .Setup(c => c.FindAsync(
                    It.IsAny<FilterDefinition<ApplicationUser>>(),
                    It.IsAny<FindOptions<ApplicationUser, ApplicationUser>>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(() => MakeCursor(new List<ApplicationUser>()));

            var res = await _controller.GetDisputes();

            var okRes = Assert.IsType<OkObjectResult>(res);
            var envelope = okRes.Value as ApiResponse;
            Assert.NotNull(envelope);
            Assert.True(envelope!.Success);
            var items = envelope.Data as List<AdminDisputeListItemDto>;
            Assert.NotNull(items);
            Assert.Single(items);
            Assert.Equal("Untitled Milestone", items[0].MilestoneTitle);
            Assert.Equal("EUR", items[0].Currency);
        }
    }
}

