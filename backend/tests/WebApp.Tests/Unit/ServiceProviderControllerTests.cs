using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using WebApp.Controllers;
using WebApp.Models;
using WebApp.Models.Dtos;
using WebApp.Services.Interface;
using Xunit;

namespace WebApp.Tests.Unit;

/// <summary>
/// D-1 Phase 4 — Controller mapping: owner id is read from the authenticated
/// principal (never the body), and service outcomes map to the right HTTP status
/// inside the shared ApiResponse envelope.
/// </summary>
public class ServiceProviderControllerTests
{
    private const string UserId = "11111111-1111-1111-1111-111111111111";

    private readonly Mock<IServiceProviderService> _service = new();
    private readonly Mock<IServiceProviderMediaService> _media = new();
    private readonly Mock<IProfileEditorService> _editor = new();
    private readonly ServiceProviderController _controller;

    public ServiceProviderControllerTests()
    {
        _controller = new ServiceProviderController(_service.Object, _media.Object, _editor.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(
                        new[] { new Claim(ClaimTypes.NameIdentifier, UserId) }, "test")),
                },
            },
        };
    }

    [Fact]
    public async Task GetProfile_uses_authenticated_id_and_returns_200()
    {
        _service.Setup(s => s.GetProfileAsync(UserId))
            .ReturnsAsync(ServiceProviderResult<ServiceProviderProfileResponse>.Ok(new ServiceProviderProfileResponse()));

        var result = await _controller.GetProfile() as OkObjectResult;

        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(200);
        ((ApiResponse)result.Value!).Success.Should().BeTrue();
        _service.Verify(s => s.GetProfileAsync(UserId), Times.Once);
    }

    [Fact]
    public async Task NotFound_outcome_maps_to_404()
    {
        _service.Setup(s => s.GetProfileAsync(UserId))
            .ReturnsAsync(ServiceProviderResult<ServiceProviderProfileResponse>.NotFound("nope"));

        var result = await _controller.GetProfile() as NotFoundObjectResult;

        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(404);
        ((ApiResponse)result.Value!).Success.Should().BeFalse();
    }

    [Fact]
    public async Task Conflict_outcome_maps_to_409()
    {
        _service.Setup(s => s.SubmitVerificationAsync(UserId, It.IsAny<SubmitVerificationRequest>()))
            .ReturnsAsync(ServiceProviderResult<ServiceProviderVerificationResponse>.Conflict("dup"));

        var result = await _controller.SubmitVerification(new SubmitVerificationRequest { ConfirmAccuracy = true })
            as ConflictObjectResult;

        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(409);
    }

    [Fact]
    public async Task DeletePortfolio_forwards_portfolio_id_and_authenticated_id()
    {
        _service.Setup(s => s.DeletePortfolioItemAsync(UserId, "item-abc"))
            .ReturnsAsync(ServiceProviderResult<ServiceProviderProfileResponse>.Ok(new ServiceProviderProfileResponse()));

        var result = await _controller.DeletePortfolioItem("item-abc") as OkObjectResult;

        result!.StatusCode.Should().Be(200);
        _service.Verify(s => s.DeletePortfolioItemAsync(UserId, "item-abc"), Times.Once);
    }

    [Fact]
    public async Task UpsertProfile_passes_authenticated_id_not_body()
    {
        _service.Setup(s => s.UpsertProfileAsync(UserId, It.IsAny<CreateOrUpdateServiceProviderProfileRequest>()))
            .ReturnsAsync(ServiceProviderResult<ServiceProviderProfileResponse>.Ok(new ServiceProviderProfileResponse()));

        await _controller.UpsertProfile(new CreateOrUpdateServiceProviderProfileRequest());

        _service.Verify(s => s.UpsertProfileAsync(UserId, It.IsAny<CreateOrUpdateServiceProviderProfileRequest>()), Times.Once);
    }
}
