using System.Security.Claims;
using FluentAssertions;
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
using WebApp.Services.Ai.Jobs;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Unit;

public class CompanyFormationTests
{
    private readonly Mock<ICreatorJourneyService> _journeysMock = new();
    private readonly Mock<ISpMatchingService> _spMatchingMock = new();
    private readonly Mock<ISmartMatchingService> _smartMatchingMock = new();
    private readonly Mock<IForecastSessionStore> _forecastsMock = new();
    private readonly Mock<IServiceProvider> _serviceProviderMock = new();
    private readonly CreatorPhase5Controller _controller;

    public CompanyFormationTests()
    {
        var db = new Mock<IMongoDatabase>();
        var context = new MongoDbContext(db.Object);

        var userStore = new Mock<IUserStore<ApplicationUser>>();
        var userManager = new UserManager<ApplicationUser>(
            userStore.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        _controller = new CreatorPhase5Controller(
            _journeysMock.Object,
            _spMatchingMock.Object,
            _smartMatchingMock.Object,
            context,
            userManager,
            _forecastsMock.Object,
            _serviceProviderMock.Object);

        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "user_test_123")
        }, "mock"));

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };
    }

    [Fact]
    public async Task CaseA_FormationSpId_Omitted_Returns200_And_PersistsNull()
    {
        var request = new CompanyFormationRequest
        {
            SelectedType = "SAS",
            Ownership = new List<CreatorOwnershipEntry>
            {
                new() { Holder = "Founder", Percent = 85, IsFounder = true },
                new() { Holder = "ESOP Pool", Percent = 15, IsEsop = true }
            }
        };

        CreatorCompanyFormation? savedFormation = null;

        _journeysMock
            .Setup(j => j.SetCompanyFormationAsync("user_test_123", It.IsAny<CreatorCompanyFormation>(), It.IsAny<string>()))
            .Callback<string, CreatorCompanyFormation, string>((uid, form, iid) => savedFormation = form)
            .ReturnsAsync(new CreatorJourney
            {
                Phase5Data = new CreatorPhase5Data
                {
                    PathB = new CreatorPathB
                    {
                        CompanyFormation = new CreatorCompanyFormation
                        {
                            SelectedType = "SAS",
                            Ownership = request.Ownership,
                            FormationSpId = null,
                            Status = "drafted"
                        }
                    }
                }
            });

        var result = await _controller.CompanyFormation(request, null);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
        response.Success.Should().BeTrue();

        savedFormation.Should().NotBeNull();
        savedFormation!.SelectedType.Should().Be("SAS");
        savedFormation.FormationSpId.Should().BeNull();
    }

    [Fact]
    public async Task CaseB_FormationSpId_Null_Returns200_And_PersistsNull()
    {
        var request = new CompanyFormationRequest
        {
            SelectedType = "SAS",
            Ownership = new List<CreatorOwnershipEntry>
            {
                new() { Holder = "Founder", Percent = 85, IsFounder = true },
                new() { Holder = "ESOP Pool", Percent = 15, IsEsop = true }
            },
            FormationSpId = null
        };

        CreatorCompanyFormation? savedFormation = null;

        _journeysMock
            .Setup(j => j.SetCompanyFormationAsync("user_test_123", It.IsAny<CreatorCompanyFormation>(), It.IsAny<string>()))
            .Callback<string, CreatorCompanyFormation, string>((uid, form, iid) => savedFormation = form)
            .ReturnsAsync(new CreatorJourney
            {
                Phase5Data = new CreatorPhase5Data
                {
                    PathB = new CreatorPathB
                    {
                        CompanyFormation = new CreatorCompanyFormation
                        {
                            SelectedType = "SAS",
                            Ownership = request.Ownership,
                            FormationSpId = null,
                            Status = "drafted"
                        }
                    }
                }
            });

        var result = await _controller.CompanyFormation(request, null);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
        response.Success.Should().BeTrue();

        savedFormation.Should().NotBeNull();
        savedFormation!.FormationSpId.Should().BeNull();
    }

    [Fact]
    public async Task CaseC_FormationSpId_EmptyString_Returns200_And_PersistsNull()
    {
        var request = new CompanyFormationRequest
        {
            SelectedType = "SARL",
            Ownership = new List<CreatorOwnershipEntry>
            {
                new() { Holder = "Founder", Percent = 90, IsFounder = true },
                new() { Holder = "ESOP Pool", Percent = 10, IsEsop = true }
            },
            FormationSpId = ""
        };

        CreatorCompanyFormation? savedFormation = null;

        _journeysMock
            .Setup(j => j.SetCompanyFormationAsync("user_test_123", It.IsAny<CreatorCompanyFormation>(), It.IsAny<string>()))
            .Callback<string, CreatorCompanyFormation, string>((uid, form, iid) => savedFormation = form)
            .ReturnsAsync(new CreatorJourney
            {
                Phase5Data = new CreatorPhase5Data
                {
                    PathB = new CreatorPathB
                    {
                        CompanyFormation = new CreatorCompanyFormation
                        {
                            SelectedType = "SARL",
                            Ownership = request.Ownership,
                            FormationSpId = null,
                            Status = "drafted"
                        }
                    }
                }
            });

        var result = await _controller.CompanyFormation(request, null);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
        response.Success.Should().BeTrue();

        savedFormation.Should().NotBeNull();
        savedFormation!.FormationSpId.Should().BeNull();
    }

    [Fact]
    public async Task CaseD_FormationSpId_Whitespace_Returns200_And_PersistsNull()
    {
        var request = new CompanyFormationRequest
        {
            SelectedType = "SAS-U",
            Ownership = new List<CreatorOwnershipEntry>
            {
                new() { Holder = "Solo Founder", Percent = 100, IsFounder = true }
            },
            FormationSpId = "   "
        };

        CreatorCompanyFormation? savedFormation = null;

        _journeysMock
            .Setup(j => j.SetCompanyFormationAsync("user_test_123", It.IsAny<CreatorCompanyFormation>(), It.IsAny<string>()))
            .Callback<string, CreatorCompanyFormation, string>((uid, form, iid) => savedFormation = form)
            .ReturnsAsync(new CreatorJourney
            {
                Phase5Data = new CreatorPhase5Data
                {
                    PathB = new CreatorPathB
                    {
                        CompanyFormation = new CreatorCompanyFormation
                        {
                            SelectedType = "SAS-U",
                            Ownership = request.Ownership,
                            FormationSpId = null,
                            Status = "drafted"
                        }
                    }
                }
            });

        var result = await _controller.CompanyFormation(request, null);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
        response.Success.Should().BeTrue();

        savedFormation.Should().NotBeNull();
        savedFormation!.FormationSpId.Should().BeNull();
    }

    [Fact]
    public async Task CaseE_FormationSpId_ValidSupplied_Returns200_And_PreservesLinkage()
    {
        var request = new CompanyFormationRequest
        {
            SelectedType = "SAS",
            Ownership = new List<CreatorOwnershipEntry>
            {
                new() { Holder = "Founder", Percent = 85, IsFounder = true },
                new() { Holder = "ESOP Pool", Percent = 15, IsEsop = true }
            },
            FormationSpId = "  sp_valid_legal_789  "
        };

        CreatorCompanyFormation? savedFormation = null;

        _journeysMock
            .Setup(j => j.SetCompanyFormationAsync("user_test_123", It.IsAny<CreatorCompanyFormation>(), It.IsAny<string>()))
            .Callback<string, CreatorCompanyFormation, string>((uid, form, iid) => savedFormation = form)
            .ReturnsAsync(new CreatorJourney
            {
                Phase5Data = new CreatorPhase5Data
                {
                    PathB = new CreatorPathB
                    {
                        CompanyFormation = new CreatorCompanyFormation
                        {
                            SelectedType = "SAS",
                            Ownership = request.Ownership,
                            FormationSpId = "sp_valid_legal_789",
                            Status = "drafted"
                        }
                    }
                }
            });

        var result = await _controller.CompanyFormation(request, null);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
        response.Success.Should().BeTrue();

        savedFormation.Should().NotBeNull();
        savedFormation!.FormationSpId.Should().Be("sp_valid_legal_789");
    }

    [Fact]
    public async Task CaseF_InvalidSelectedType_ReturnsUnprocessableEntity()
    {
        var request = new CompanyFormationRequest
        {
            SelectedType = "INVALID_TYPE",
            Ownership = new List<CreatorOwnershipEntry>
            {
                new() { Holder = "Founder", Percent = 100, IsFounder = true }
            }
        };

        var result = await _controller.CompanyFormation(request, null);

        var unprocResult = result.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
        var response = unprocResult.Value.Should().BeOfType<ApiResponse>().Subject;
        response.Success.Should().BeFalse();
        response.Message.Should().Contain("selectedType must be SAS | SAS-U | SARL");
    }

    [Fact]
    public async Task CaseG_StaleVersion_PropagatesCreatorJourneyException409()
    {
        var request = new CompanyFormationRequest
        {
            SelectedType = "SAS",
            Ownership = new List<CreatorOwnershipEntry>
            {
                new() { Holder = "Founder", Percent = 85, IsFounder = true },
                new() { Holder = "ESOP Pool", Percent = 15, IsEsop = true }
            }
        };

        _journeysMock
            .Setup(j => j.SetCompanyFormationAsync("user_test_123", It.IsAny<CreatorCompanyFormation>(), "idea_stale"))
            .ThrowsAsync(new CreatorJourneyException(409, "Stale version: please reload."));

        var result = await _controller.CompanyFormation(request, "idea_stale");

        var statusResult = result.Should().BeOfType<ObjectResult>().Subject;
        statusResult.StatusCode.Should().Be(409);
        var response = statusResult.Value.Should().BeOfType<ApiResponse>().Subject;
        response.Success.Should().BeFalse();
        response.Message.Should().Contain("Stale version");
    }

    [Fact]
    public async Task CaseH_InvalidOwnership_SumNot100_ReturnsUnprocessableEntity()
    {
        var request = new CompanyFormationRequest
        {
            SelectedType = "SAS",
            Ownership = new List<CreatorOwnershipEntry>
            {
                new() { Holder = "Founder", Percent = 80, IsFounder = true },
                new() { Holder = "ESOP Pool", Percent = 10, IsEsop = true }
            }
        };

        var result = await _controller.CompanyFormation(request, null);

        var unprocResult = result.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
        var response = unprocResult.Value.Should().BeOfType<ApiResponse>().Subject;
        response.Success.Should().BeFalse();
        response.Message.Should().Contain("Ownership must sum to 100");
    }

    [Fact]
    public async Task CaseI_InvalidOwnership_FounderBelow51_ReturnsUnprocessableEntity()
    {
        var request = new CompanyFormationRequest
        {
            SelectedType = "SAS",
            Ownership = new List<CreatorOwnershipEntry>
            {
                new() { Holder = "Founder", Percent = 40, IsFounder = true },
                new() { Holder = "Co-founder", Percent = 45, IsFounder = false },
                new() { Holder = "ESOP Pool", Percent = 15, IsEsop = true }
            }
        };

        var result = await _controller.CompanyFormation(request, null);

        var unprocResult = result.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
        var response = unprocResult.Value.Should().BeOfType<ApiResponse>().Subject;
        response.Success.Should().BeFalse();
        response.Message.Should().Contain("Founder must retain at least 51%");
    }

    [Fact]
    public async Task CaseJ_InvalidOwnership_EmptyList_ReturnsUnprocessableEntity()
    {
        var request = new CompanyFormationRequest
        {
            SelectedType = "SAS",
            Ownership = new List<CreatorOwnershipEntry>()
        };

        var result = await _controller.CompanyFormation(request, null);

        var unprocResult = result.Should().BeOfType<UnprocessableEntityObjectResult>().Subject;
        var response = unprocResult.Value.Should().BeOfType<ApiResponse>().Subject;
        response.Success.Should().BeFalse();
        response.Message.Should().Contain("Add at least one ownership entry");
    }
}
