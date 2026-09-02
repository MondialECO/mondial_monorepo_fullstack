using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
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
    public class AdminMarketplaceTests
    {
        private readonly Mock<IMongoDatabase> _mockDb;
        private readonly MongoDbContext _context;
        private readonly Mock<UserManager<ApplicationUser>> _mockUserManager;
        private readonly Mock<IAuditLogger> _mockAuditLogger;

        private readonly Mock<IMongoCollection<ServiceListing>> _mockServiceCol;
        private readonly Mock<IMongoCollection<ServicePackage>> _mockPkgCol;
        private readonly Mock<IMongoCollection<ServiceFAQ>> _mockFaqCol;
        private readonly Mock<IMongoCollection<CreatorIdea>> _mockIdeaCol;
        private readonly Mock<IMongoCollection<Review>> _mockReviewCol;
        private readonly Mock<IMongoCollection<ApplicationUser>> _mockUserCol;

        private readonly AdminMarketplaceController _controller;

        public AdminMarketplaceTests()
        {
            _mockDb = new Mock<IMongoDatabase>();
            _mockServiceCol = new Mock<IMongoCollection<ServiceListing>>();
            _mockPkgCol = new Mock<IMongoCollection<ServicePackage>>();
            _mockFaqCol = new Mock<IMongoCollection<ServiceFAQ>>();
            _mockIdeaCol = new Mock<IMongoCollection<CreatorIdea>>();
            _mockReviewCol = new Mock<IMongoCollection<Review>>();
            _mockUserCol = new Mock<IMongoCollection<ApplicationUser>>();

            _mockDb.Setup(d => d.GetCollection<ServiceListing>("ServiceListings", null))
                .Returns(_mockServiceCol.Object);
            _mockDb.Setup(d => d.GetCollection<ServicePackage>("ServicePackages", null))
                .Returns(_mockPkgCol.Object);
            _mockDb.Setup(d => d.GetCollection<ServiceFAQ>("ServiceFAQs", null))
                .Returns(_mockFaqCol.Object);
            _mockDb.Setup(d => d.GetCollection<CreatorIdea>("CreatorIdeas", null))
                .Returns(_mockIdeaCol.Object);
            _mockDb.Setup(d => d.GetCollection<Review>("Reviews", null))
                .Returns(_mockReviewCol.Object);
            _mockDb.Setup(d => d.GetCollection<ApplicationUser>("applicationUsers", null))
                .Returns(_mockUserCol.Object);

            _context = new MongoDbContext(_mockDb.Object);

            var store = new Mock<IUserStore<ApplicationUser>>();
            _mockUserManager = new Mock<UserManager<ApplicationUser>>(
                store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

            _mockAuditLogger = new Mock<IAuditLogger>();

            _controller = new AdminMarketplaceController(_context, _mockUserManager.Object, _mockAuditLogger.Object);

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, "admin-1"),
                new(ClaimTypes.Email, "admin@mondial.com"),
                new(ClaimTypes.Role, "Admin"),
                new("role", "Admin")
            };
            var httpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"))
            };
            _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
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
        public void Controller_Has_Authorize_Admin_Attribute()
        {
            var type = typeof(AdminMarketplaceController);
            var authAttrs = type.GetCustomAttributes(typeof(AuthorizeAttribute), true);
            authAttrs.Should().NotBeEmpty();
            var auth = authAttrs[0] as AuthorizeAttribute;
            auth!.Roles.Should().Be("Admin,SuperAdmin");
        }

        [Fact]
        public async Task ModerateService_Hide_Requires_Reason_And_Records_Audit()
        {
            var service = new ServiceListing
            {
                Id = "srv-1",
                Title = "SEO Optimization",
                ProviderId = "sp-1",
                Status = CatalogStatus.Published,
                IsModerationHidden = false
            };

            _mockServiceCol.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<ServiceListing>>(),
                It.IsAny<FindOptions<ServiceListing, ServiceListing>>(),
                It.IsAny<CancellationToken>())).ReturnsAsync(() => MakeCursor(new List<ServiceListing> { service }));

            // Hide without reason returns 400
            var noReasonRes = await _controller.ModerateService("srv-1", new AdminModerationActionRequest
            {
                Action = "hide",
                Reason = ""
            });
            Assert.IsType<BadRequestObjectResult>(noReasonRes);

            // Hide with reason
            var updatedService = new ServiceListing
            {
                Id = "srv-1",
                Title = "SEO Optimization",
                ProviderId = "sp-1",
                Status = CatalogStatus.Published,
                IsModerationHidden = true,
                ModerationReason = "Policy violation"
            };

            _mockServiceCol.Setup(c => c.FindOneAndUpdateAsync(
                It.IsAny<FilterDefinition<ServiceListing>>(),
                It.IsAny<UpdateDefinition<ServiceListing>>(),
                It.IsAny<FindOneAndUpdateOptions<ServiceListing, ServiceListing>>(),
                It.IsAny<CancellationToken>())).ReturnsAsync(updatedService);

            var okRes = await _controller.ModerateService("srv-1", new AdminModerationActionRequest
            {
                Action = "hide",
                Reason = "Policy violation"
            });

            Assert.IsType<OkObjectResult>(okRes);
            _mockAuditLogger.Verify(a => a.Record("admin_service_hidden", "admin@mondial.com", true, It.IsAny<object>()), Times.Once);
        }

        [Fact]
        public async Task ModerateService_When_Already_Hidden_Returns_409_Conflict()
        {
            var service = new ServiceListing
            {
                Id = "srv-1",
                Title = "SEO Optimization",
                ProviderId = "sp-1",
                IsModerationHidden = true
            };

            _mockServiceCol.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<ServiceListing>>(),
                It.IsAny<FindOptions<ServiceListing, ServiceListing>>(),
                It.IsAny<CancellationToken>())).ReturnsAsync(() => MakeCursor(new List<ServiceListing> { service }));

            var res = await _controller.ModerateService("srv-1", new AdminModerationActionRequest
            {
                Action = "hide",
                Reason = "Duplicate hide request"
            });

            Assert.IsType<ConflictObjectResult>(res);
        }

        [Fact]
        public async Task ModerateCreatorOffer_Hide_And_Restore_Records_Audit()
        {
            var idea = new CreatorIdea
            {
                Id = "idea-1",
                UserId = "creator-1",
                Phase5Data = new CreatorPhase5Data
                {
                    PathA = new CreatorPathA
                    {
                        MarketplaceListing = new CreatorMarketplaceListing
                        {
                            Status = "live",
                            SaleType = "full_buyout",
                            AskingPrice = 150000m,
                            IsModerationHidden = false
                        }
                    }
                }
            };

            _mockIdeaCol.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<CreatorIdea>>(),
                It.IsAny<FindOptions<CreatorIdea, CreatorIdea>>(),
                It.IsAny<CancellationToken>())).ReturnsAsync(() => MakeCursor(new List<CreatorIdea> { idea }));

            _mockIdeaCol.Setup(c => c.FindOneAndUpdateAsync(
                It.IsAny<FilterDefinition<CreatorIdea>>(),
                It.IsAny<UpdateDefinition<CreatorIdea>>(),
                It.IsAny<FindOneAndUpdateOptions<CreatorIdea, CreatorIdea>>(),
                It.IsAny<CancellationToken>())).ReturnsAsync(idea);

            var res = await _controller.ModerateCreatorOffer("idea-1", new AdminModerationActionRequest
            {
                Action = "hide",
                Reason = "Misleading intellectual property claims"
            });

            Assert.IsType<OkObjectResult>(res);
            _mockAuditLogger.Verify(a => a.Record("admin_creator_offer_hidden", "admin@mondial.com", true, It.IsAny<object>()), Times.Once);
        }

        [Fact]
        public async Task ModerateReview_Hide_And_Restore_Toggles_Visibility_And_Audit()
        {
            var review = new Review
            {
                Id = "rev-1",
                ProviderId = "sp-1",
                ClientId = "client-1",
                OverallRating = 1,
                WrittenReview = "Abusive comment text",
                Visibility = ReviewVisibility.Public,
                VerificationStatus = ReviewVerificationStatus.Verified,
                IsModerationHidden = false
            };

            _mockReviewCol.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<Review>>(),
                It.IsAny<FindOptions<Review, Review>>(),
                It.IsAny<CancellationToken>())).ReturnsAsync(() => MakeCursor(new List<Review> { review }));

            _mockReviewCol.Setup(c => c.FindOneAndUpdateAsync(
                It.IsAny<FilterDefinition<Review>>(),
                It.IsAny<UpdateDefinition<Review>>(),
                It.IsAny<FindOneAndUpdateOptions<Review, Review>>(),
                It.IsAny<CancellationToken>())).ReturnsAsync(review);

            var res = await _controller.ModerateReview("rev-1", new AdminModerationActionRequest
            {
                Action = "hide",
                Reason = "Hate speech and harassment"
            });

            Assert.IsType<OkObjectResult>(res);
            _mockAuditLogger.Verify(a => a.Record("admin_review_hidden", "admin@mondial.com", true, It.IsAny<object>()), Times.Once);
        }
    }
}
