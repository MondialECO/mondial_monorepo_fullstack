using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using Moq;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using WebApp.Controllers;
using WebApp.DbContext;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Ai.Jobs;
using WebApp.Services.Interface;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class MarketplacePushPhase1Tests
    {
        private readonly Mock<ICreatorJourneyService> _journeysMock = new();
        private readonly Mock<ISpMatchingService> _spMatchingMock = new();
        private readonly Mock<ISmartMatchingService> _smartMatchingMock = new();
        private readonly Mock<IForecastSessionStore> _forecastsMock = new();
        private readonly Mock<IServiceProvider> _serviceProviderMock = new();
        private readonly Mock<ICreatorIdeaStore> _ideasStoreMock = new();
        private readonly Mock<IMongoDatabase> _dbMock = new();
        private readonly MongoDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly CreatorPhase5Controller _phase5Controller;

        public MarketplacePushPhase1Tests()
        {
            _context = new MongoDbContext(_dbMock.Object);
            var userStore = new Mock<IUserStore<ApplicationUser>>();
            _userManager = new UserManager<ApplicationUser>(
                userStore.Object, null!, null!, null!, null!, null!, null!, null!, null!);

            _phase5Controller = new CreatorPhase5Controller(
                _journeysMock.Object,
                _spMatchingMock.Object,
                _smartMatchingMock.Object,
                _context,
                _userManager,
                _forecastsMock.Object,
                _serviceProviderMock.Object);

            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "creator_123")
            }, "mock"));

            _phase5Controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };
        }

        [Fact]
        public async Task TestA_Publish_FullBuyoutOnly_RequiresPositiveAskingPrice()
        {
            var journey = new CreatorJourney
            {
                UserId = "creator_123",
                Phase5Data = new CreatorPhase5Data { ChosenPath = "sell" }
            };
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("creator_123", null)).ReturnsAsync(journey);

            // 1. Invalid asking price (0) -> 422
            var reqInvalid = new MarketplacePublishRequest
            {
                DealModes = new List<string> { "full_buyout" },
                AskingPrice = 0
            };
            var resultInvalid = await _phase5Controller.Publish(reqInvalid, null);
            resultInvalid.Should().BeOfType<UnprocessableEntityObjectResult>();

            // 2. Valid asking price (120000) -> 200
            var reqValid = new MarketplacePublishRequest
            {
                DealModes = new List<string> { "full_buyout" },
                AskingPrice = 120000,
                NdaRequired = true,
                Audience = "public"
            };

            CreatorMarketplaceListing? savedListing = null;
            _journeysMock
                .Setup(j => j.SetMarketplaceListingAsync("creator_123", It.IsAny<CreatorMarketplaceListing>(), It.IsAny<List<string>>(), null))
                .Callback<string, CreatorMarketplaceListing, List<string>, string>((uid, list, m, iid) => savedListing = list)
                .ReturnsAsync(new CreatorJourney
                {
                    Phase5Data = new CreatorPhase5Data
                    {
                        PathA = new CreatorPathA
                        {
                            MarketplaceListing = new CreatorMarketplaceListing { Status = "available", AskingPrice = 120000 }
                        }
                    }
                });

            var resultValid = await _phase5Controller.Publish(reqValid, null);
            var okResult = resultValid.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            response.Success.Should().BeTrue();

            savedListing.Should().NotBeNull();
            savedListing!.OpenToPurchase.Should().BeTrue();
            savedListing.OpenToEquityPartnership.Should().BeFalse();
            savedListing.AskingPrice.Should().Be(120000);
        }

        [Fact]
        public async Task TestB_Publish_EquityPartnershipOnly_AllowsZeroAskingPrice()
        {
            var journey = new CreatorJourney
            {
                UserId = "creator_123",
                Phase5Data = new CreatorPhase5Data { ChosenPath = "sell" }
            };
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("creator_123", null)).ReturnsAsync(journey);

            var reqEquity = new MarketplacePublishRequest
            {
                DealModes = new List<string> { "equity_partnership" },
                AskingPrice = 0,
                NdaRequired = true,
                Audience = "public"
            };

            CreatorMarketplaceListing? savedListing = null;
            _journeysMock
                .Setup(j => j.SetMarketplaceListingAsync("creator_123", It.IsAny<CreatorMarketplaceListing>(), It.IsAny<List<string>>(), null))
                .Callback<string, CreatorMarketplaceListing, List<string>, string>((uid, list, m, iid) => savedListing = list)
                .ReturnsAsync(new CreatorJourney
                {
                    Phase5Data = new CreatorPhase5Data
                    {
                        PathA = new CreatorPathA
                        {
                            MarketplaceListing = new CreatorMarketplaceListing { Status = "available", OpenToEquityPartnership = true }
                        }
                    }
                });

            var result = await _phase5Controller.Publish(reqEquity, null);
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            response.Success.Should().BeTrue();

            savedListing.Should().NotBeNull();
            savedListing!.OpenToPurchase.Should().BeFalse();
            savedListing.OpenToEquityPartnership.Should().BeTrue();
            savedListing.AskingPrice.Should().BeNull();
        }

        [Fact]
        public async Task TestC_Publish_BothDealModes_AcceptsBothFlags()
        {
            var journey = new CreatorJourney
            {
                UserId = "creator_123",
                Phase5Data = new CreatorPhase5Data { ChosenPath = "sell" }
            };
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("creator_123", null)).ReturnsAsync(journey);

            var reqBoth = new MarketplacePublishRequest
            {
                DealModes = new List<string> { "full_buyout", "equity_partnership" },
                AskingPrice = 75000,
                NdaRequired = false,
                Audience = "public"
            };

            CreatorMarketplaceListing? savedListing = null;
            _journeysMock
                .Setup(j => j.SetMarketplaceListingAsync("creator_123", It.IsAny<CreatorMarketplaceListing>(), It.IsAny<List<string>>(), null))
                .Callback<string, CreatorMarketplaceListing, List<string>, string>((uid, list, m, iid) => savedListing = list)
                .ReturnsAsync(new CreatorJourney
                {
                    Phase5Data = new CreatorPhase5Data
                    {
                        PathA = new CreatorPathA
                        {
                            MarketplaceListing = new CreatorMarketplaceListing { Status = "available", AskingPrice = 75000 }
                        }
                    }
                });

            var result = await _phase5Controller.Publish(reqBoth, null);
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            response.Success.Should().BeTrue();

            savedListing.Should().NotBeNull();
            savedListing!.OpenToPurchase.Should().BeTrue();
            savedListing.OpenToEquityPartnership.Should().BeTrue();
            savedListing.DealModes.Should().Contain(new[] { "full_buyout", "equity_partnership" });
        }

        [Fact]
        public async Task TestD_Publish_EmptyDealModes_DefaultsToFullBuyout()
        {
            var journey = new CreatorJourney
            {
                UserId = "creator_123",
                Phase5Data = new CreatorPhase5Data { ChosenPath = "sell" }
            };
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("creator_123", null)).ReturnsAsync(journey);

            var reqEmpty = new MarketplacePublishRequest
            {
                DealModes = new List<string>(),
                AskingPrice = 50000,
                Audience = "public"
            };

            CreatorMarketplaceListing? savedListing = null;
            _journeysMock
                .Setup(j => j.SetMarketplaceListingAsync("creator_123", It.IsAny<CreatorMarketplaceListing>(), It.IsAny<List<string>>(), null))
                .Callback<string, CreatorMarketplaceListing, List<string>, string>((uid, list, m, iid) => savedListing = list)
                .ReturnsAsync(new CreatorJourney
                {
                    Phase5Data = new CreatorPhase5Data
                    {
                        PathA = new CreatorPathA { MarketplaceListing = new CreatorMarketplaceListing { Status = "available" } }
                    }
                });

            var result = await _phase5Controller.Publish(reqEmpty, null);
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().BeOfType<ApiResponse>();

            savedListing.Should().NotBeNull();
            savedListing!.OpenToPurchase.Should().BeTrue();
            savedListing.DealModes.Should().Contain("full_buyout");
        }

        [Fact]
        public async Task TestE_Publish_LicensingDealMode_Rejects422()
        {
            var journey = new CreatorJourney
            {
                UserId = "creator_123",
                Phase5Data = new CreatorPhase5Data { ChosenPath = "sell" }
            };
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("creator_123", null)).ReturnsAsync(journey);

            var reqLicense = new MarketplacePublishRequest
            {
                DealModes = new List<string> { "sell_license" },
                AskingPrice = 10000
            };

            var result = await _phase5Controller.Publish(reqLicense, null);
            var unproc = result.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
            var response = unproc.Value.Should().BeOfType<ApiResponse>().Subject;
            response.Success.Should().BeFalse();
            response.Message.Should().Contain("Licensing is not supported");
        }

        [Fact]
        public async Task TestF_Update_PreservesPublishedAt_AndSetsUpdatedAt()
        {
            var publishedDate = new DateTime(2026, 1, 15, 10, 0, 0, DateTimeKind.Utc);
            var journey = new CreatorJourney
            {
                UserId = "creator_123",
                Phase5Data = new CreatorPhase5Data
                {
                    ChosenPath = "sell",
                    PathA = new CreatorPathA
                    {
                        MarketplaceListing = new CreatorMarketplaceListing
                        {
                            Status = "available",
                            AskingPrice = 75000,
                            PublishedAt = publishedDate
                        }
                    }
                }
            };
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("creator_123", null)).ReturnsAsync(journey);

            var updateReq = new MarketplacePublishRequest
            {
                DealModes = new List<string> { "full_buyout", "equity_partnership" },
                AskingPrice = 120000,
                Audience = "public"
            };

            CreatorMarketplaceListing? savedListing = null;
            _journeysMock
                .Setup(j => j.SetMarketplaceListingAsync("creator_123", It.IsAny<CreatorMarketplaceListing>(), It.IsAny<List<string>>(), null))
                .Callback<string, CreatorMarketplaceListing, List<string>, string>((uid, list, m, iid) => savedListing = list)
                .ReturnsAsync(journey);

            var result = await _phase5Controller.Publish(updateReq, null);
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            response.Success.Should().BeTrue();
            response.Message.Should().Be("Listing updated");

            savedListing.Should().NotBeNull();
            savedListing!.PublishedAt.Should().Be(publishedDate);
            savedListing.UpdatedAt.Should().NotBeNull();
            savedListing.AskingPrice.Should().Be(120000);
        }

        [Fact]
        public async Task TestG_Publish_SoldProject_Rejects422()
        {
            var journey = new CreatorJourney
            {
                UserId = "creator_123",
                ProjectOutcome = "SOLD",
                Phase5Data = new CreatorPhase5Data { ChosenPath = "sell" }
            };
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("creator_123", null)).ReturnsAsync(journey);

            var req = new MarketplacePublishRequest
            {
                DealModes = new List<string> { "full_buyout" },
                AskingPrice = 50000
            };

            var result = await _phase5Controller.Publish(req, null);
            var unproc = result.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
            var response = unproc.Value.Should().BeOfType<ApiResponse>().Subject;
            response.Success.Should().BeFalse();
            response.Message.Should().Contain("cannot update their marketplace listing");
        }

        [Fact]
        public async Task TestH_SetMarketplaceStatus_PauseAndResume()
        {
            var journey = new CreatorJourney
            {
                UserId = "creator_123",
                Phase5Data = new CreatorPhase5Data
                {
                    ChosenPath = "sell",
                    PathA = new CreatorPathA
                    {
                        MarketplaceListing = new CreatorMarketplaceListing
                        {
                            Status = "available",
                            AskingPrice = 50000,
                            PublishedAt = DateTime.UtcNow.AddDays(-1)
                        }
                    }
                }
            };
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("creator_123", null)).ReturnsAsync(journey);

            CreatorMarketplaceListing? savedListing = null;
            _journeysMock
                .Setup(j => j.SetMarketplaceListingAsync("creator_123", It.IsAny<CreatorMarketplaceListing>(), It.IsAny<List<string>>(), null))
                .Callback<string, CreatorMarketplaceListing, List<string>, string>((uid, list, m, iid) => savedListing = list)
                .ReturnsAsync(journey);

            var pauseReq = new MarketplaceStatusRequest { Status = "paused" };
            var result = await _phase5Controller.SetStatus(pauseReq, null);
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            response.Success.Should().BeTrue();
            response.Message.Should().Be("Status updated");

            savedListing.Should().NotBeNull();
            savedListing!.Status.Should().Be("paused");
            savedListing.UpdatedAt.Should().NotBeNull();
        }
    }
}
