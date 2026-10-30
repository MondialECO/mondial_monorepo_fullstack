using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using MongoDB.Driver;
using Moq;
using WebApp.Controllers;
using WebApp.DbContext;
using WebApp.Models;
using WebApp.Services;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class CompanySearchServiceTests
    {
        private class TestHttpMessageHandler : HttpMessageHandler
        {
            private readonly Func<HttpRequestMessage, HttpResponseMessage> _handler;
            public int CallCount { get; private set; }
            public HttpRequestMessage? LastRequest { get; private set; }

            public TestHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> handler)
            {
                _handler = handler;
            }

            protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            {
                CallCount++;
                LastRequest = request;
                return Task.FromResult(_handler(request));
            }
        }

        private static IMemoryCache CreateMemoryCache()
        {
            return new MemoryCache(new MemoryCacheOptions());
        }

        [Fact]
        public async Task SearchCompaniesAsync_WithValidResults_MapsAllFieldsCorrectly()
        {
            // Given: Upstream returns active and closed companies with full metadata
            var jsonResponse = @"{
                ""results"": [
                    {
                        ""siren"": ""818750556"",
                        ""nom_complet"": ""MONDIAL (HOTEL MONDIAL)"",
                        ""etat_administratif"": ""A"",
                        ""activite_principale"": ""55.10Z"",
                        ""siege"": {
                            ""code_postal"": ""37000"",
                            ""libelle_commune"": ""TOURS"",
                            ""departement"": ""37"",
                            ""etat_administratif"": ""A""
                        }
                    },
                    {
                        ""siren"": ""104470844"",
                        ""nom_complet"": ""MONDIAL SAS"",
                        ""etat_administratif"": ""F"",
                        ""activite_principale"": ""70.22Z"",
                        ""siege"": {
                            ""code_postal"": ""94300"",
                            ""libelle_commune"": ""VINCENNES"",
                            ""departement"": ""94"",
                            ""etat_administratif"": ""F""
                        }
                    }
                ],
                ""total_results"": 2
            }";

            var handler = new TestHttpMessageHandler(req => new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(jsonResponse, Encoding.UTF8, "application/json")
            });

            var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://recherche-entreprises.api.gouv.fr/") };
            var service = new CompanySearchService(httpClient, CreateMemoryCache(), NullLogger<CompanySearchService>.Instance);

            // When
            var result = await service.SearchCompaniesAsync("Mondial", 5);

            // Then
            result.Should().NotBeNull();
            result.Query.Should().Be("Mondial");
            result.TotalResults.Should().Be(2);
            result.Matches.Should().HaveCount(2);

            var first = result.Matches[0];
            first.Siren.Should().Be("818750556");
            first.Name.Should().Be("MONDIAL (HOTEL MONDIAL)");
            first.PostalCode.Should().Be("37000");
            first.City.Should().Be("TOURS");
            first.Department.Should().Be("37");
            first.ActivityCode.Should().Be("55.10Z");
            first.Status.Should().Be("active");

            var second = result.Matches[1];
            second.Siren.Should().Be("104470844");
            second.Name.Should().Be("MONDIAL SAS");
            second.City.Should().Be("VINCENNES");
            second.Status.Should().Be("closed");

            handler.CallCount.Should().Be(1);
            handler.LastRequest!.RequestUri!.ToString().Should().Contain("q=Mondial");
        }

        [Fact]
        public async Task SearchCompaniesAsync_WithMissingFields_DoesNotThrowAndHandlesGracefully()
        {
            // Given: Company without siege, without NAF, and unknown status
            var jsonResponse = @"{
                ""results"": [
                    {
                        ""siren"": ""999888777"",
                        ""nom_complet"": ""BARE COMPANY""
                    }
                ],
                ""total_results"": 1
            }";

            var handler = new TestHttpMessageHandler(req => new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(jsonResponse, Encoding.UTF8, "application/json")
            });

            var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://recherche-entreprises.api.gouv.fr/") };
            var service = new CompanySearchService(httpClient, CreateMemoryCache(), NullLogger<CompanySearchService>.Instance);

            // When
            var result = await service.SearchCompaniesAsync("Bare", 5);

            // Then
            result.Matches.Should().HaveCount(1);
            var match = result.Matches[0];
            match.Siren.Should().Be("999888777");
            match.Name.Should().Be("BARE COMPANY");
            match.PostalCode.Should().BeNull();
            match.City.Should().BeNull();
            match.ActivityCode.Should().BeNull();
            match.Status.Should().Be("unknown");
        }

        [Fact]
        public async Task SearchCompaniesAsync_WithShortOrEmptyQuery_ReturnsEmptyWithoutHttpCall()
        {
            var handler = new TestHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK));
            var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://recherche-entreprises.api.gouv.fr/") };
            var service = new CompanySearchService(httpClient, CreateMemoryCache(), NullLogger<CompanySearchService>.Instance);

            var empty = await service.SearchCompaniesAsync("   ");
            empty.Matches.Should().BeEmpty();
            empty.TotalResults.Should().Be(0);

            var oneChar = await service.SearchCompaniesAsync("A");
            oneChar.Matches.Should().BeEmpty();
            oneChar.TotalResults.Should().Be(0);

            handler.CallCount.Should().Be(0);
        }

        [Fact]
        public async Task SearchCompaniesAsync_CachesSubsequentCalls()
        {
            var jsonResponse = @"{ ""results"": [{ ""siren"": ""123"", ""nom_complet"": ""CACHED CO"" }], ""total_results"": 1 }";
            var handler = new TestHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(jsonResponse, Encoding.UTF8, "application/json")
            });

            var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://recherche-entreprises.api.gouv.fr/") };
            var memoryCache = CreateMemoryCache();
            var service = new CompanySearchService(httpClient, memoryCache, NullLogger<CompanySearchService>.Instance);

            var firstCall = await service.SearchCompaniesAsync("Cached", 5);
            var secondCall = await service.SearchCompaniesAsync("cached", 5); // Case-insensitive cache hit

            firstCall.Matches.Should().HaveCount(1);
            secondCall.Matches.Should().HaveCount(1);
            handler.CallCount.Should().Be(1); // Only called once
        }

        [Fact]
        public async Task SearchCompaniesAsync_WhenUpstreamReturnsError_ThrowsHttpRequestException()
        {
            var handler = new TestHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.InternalServerError));
            var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://recherche-entreprises.api.gouv.fr/") };
            var service = new CompanySearchService(httpClient, CreateMemoryCache(), NullLogger<CompanySearchService>.Instance);

            var act = () => service.SearchCompaniesAsync("FailingCompany", 5);

            await act.Should().ThrowAsync<HttpRequestException>();
        }

        [Fact]
        public async Task SearchCompaniesAsync_WhenUpstreamRateLimited_ThrowsWith429StatusCode()
        {
            var handler = new TestHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.TooManyRequests));
            var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://recherche-entreprises.api.gouv.fr/") };
            var service = new CompanySearchService(httpClient, CreateMemoryCache(), NullLogger<CompanySearchService>.Instance);

            var act = () => service.SearchCompaniesAsync("RateLimited", 5);

            var ex = await act.Should().ThrowAsync<HttpRequestException>();
            ex.Which.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
        }

        [Fact]
        public async Task CreatorPhase2Controller_CompanySearch_ReturnsOkWithResults()
        {
            var searchServiceMock = new Mock<ICompanySearchService>();
            searchServiceMock
                .Setup(s => s.SearchCompaniesAsync("CampusFlow", 5, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new CompanySearchResponseDto
                {
                    Query = "CampusFlow",
                    TotalResults = 1,
                    Matches = new List<CompanySearchMatchDto>
                    {
                        new() { Siren = "987654321", Name = "CAMPUSFLOW SAS", Status = "active", City = "PARIS" }
                    }
                });

            var controller = new CreatorPhase2Controller(
                Mock.Of<ICreatorJourneyService>(),
                Mock.Of<IClarifierSessionStore>(),
                Mock.Of<SaveFile>(),
                new MongoDbContext(Mock.Of<IMongoDatabase>()),
                Mock.Of<IChatService>(),
                Mock.Of<ISpMatchingService>(),
                Mock.Of<WebApp.Services.Ai.IClarifierTurnService>(),
                Mock.Of<WebApp.Services.Implementations.IClarifierChatTurnRunner>(),
                Mock.Of<IServiceProvider>(),
                searchServiceMock.Object);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new System.Security.Claims.ClaimsPrincipal(new System.Security.Claims.ClaimsIdentity(new[]
                    {
                        new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, "user-test-1")
                    }, "mock"))
                }
            };

            var actionResult = await controller.CompanySearch("CampusFlow", CancellationToken.None);

            var okResult = actionResult.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
            response.Success.Should().BeTrue();
            var data = response.Data.Should().BeOfType<CompanySearchResponseDto>().Subject;
            data.Matches.Should().HaveCount(1);
            data.Matches[0].Name.Should().Be("CAMPUSFLOW SAS");
        }

        [Fact]
        public async Task SearchCompaniesAsync_QueryExceeding80Characters_ThrowsArgumentException()
        {
            var handler = new TestHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK));
            var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://recherche-entreprises.api.gouv.fr/") };
            var service = new CompanySearchService(httpClient, CreateMemoryCache(), NullLogger<CompanySearchService>.Instance);

            var longQuery = new string('A', 81);
            var act = () => service.SearchCompaniesAsync(longQuery, 5);

            var ex = await act.Should().ThrowAsync<ArgumentException>();
            ex.Which.Message.Should().Contain("maximum allowed length of 80 characters");
        }

        [Fact]
        public async Task CreatorPhase2Controller_CompanySearch_WhenQueryExceeds80Characters_ReturnsBadRequest()
        {
            var controller = new CreatorPhase2Controller(
                Mock.Of<ICreatorJourneyService>(),
                Mock.Of<IClarifierSessionStore>(),
                Mock.Of<SaveFile>(),
                new MongoDbContext(Mock.Of<IMongoDatabase>()),
                Mock.Of<IChatService>(),
                Mock.Of<ISpMatchingService>(),
                Mock.Of<WebApp.Services.Ai.IClarifierTurnService>(),
                Mock.Of<WebApp.Services.Implementations.IClarifierChatTurnRunner>(),
                Mock.Of<IServiceProvider>(),
                Mock.Of<ICompanySearchService>());

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new System.Security.Claims.ClaimsPrincipal(new System.Security.Claims.ClaimsIdentity(new[]
                    {
                        new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, "user-test-1")
                    }, "mock"))
                }
            };

            var longQuery = new string('B', 85);
            var actionResult = await controller.CompanySearch(longQuery, CancellationToken.None);

            var badReq = actionResult.Should().BeOfType<BadRequestObjectResult>().Subject;
            var response = badReq.Value.Should().BeOfType<ApiResponse>().Subject;
            response.Success.Should().BeFalse();
            response.Message.Should().Contain("80 characters");
        }

        [Fact]
        public async Task SearchCompaniesAsync_WithUndocumentedEtatAdministratif_MapsToUnknown()
        {
            var jsonResponse = @"{
                ""results"": [
                    {
                        ""siren"": ""555444333"",
                        ""nom_complet"": ""UNKNOWN ETAT CORP"",
                        ""etat_administratif"": ""X""
                    }
                ],
                ""total_results"": 1
            }";

            var handler = new TestHttpMessageHandler(req => new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(jsonResponse, Encoding.UTF8, "application/json")
            });

            var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://recherche-entreprises.api.gouv.fr/") };
            var service = new CompanySearchService(httpClient, CreateMemoryCache(), NullLogger<CompanySearchService>.Instance);

            var result = await service.SearchCompaniesAsync("UnknownEtat", 5);

            result.Matches.Should().HaveCount(1);
            result.Matches[0].Status.Should().Be("unknown");
        }
    }
}
