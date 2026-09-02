using System.Reflection;
using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
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
/// D-1 Phase 5 — admin controller: Admin-only guard, admin id sourced from the
/// principal (not the body), reject reason forwarded, and outcome→status mapping.
/// </summary>
public class ServiceProviderAdminControllerTests
{
    private const string AdminId = "99999999-9999-9999-9999-999999999999";
    private const string ProviderId = "11111111-1111-1111-1111-111111111111";

    private readonly Mock<IServiceProviderService> _service = new();
    private readonly ServiceProviderAdminController _controller;

    public ServiceProviderAdminControllerTests()
    {
        _controller = new ServiceProviderAdminController(_service.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(
                        new[]
                        {
                            new Claim(ClaimTypes.NameIdentifier, AdminId),
                            new Claim(ClaimTypes.Role, "Admin"),
                        }, "test")),
                },
            },
        };
    }

    [Fact]
    public void Controller_is_restricted_to_Admin_role()
    {
        var attr = typeof(ServiceProviderAdminController).GetCustomAttribute<AuthorizeAttribute>();
        attr.Should().NotBeNull();
        attr!.Roles.Should().Be("Admin,SuperAdmin");
    }

    [Fact]
    public async Task Approve_forwards_provider_and_admin_ids_and_returns_200()
    {
        _service.Setup(s => s.ApproveVerificationAsync(ProviderId, AdminId))
            .ReturnsAsync(ServiceProviderResult<ServiceProviderVerificationResponse>.Ok(new ServiceProviderVerificationResponse()));

        var result = await _controller.Approve(ProviderId) as OkObjectResult;

        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(200);
        _service.Verify(s => s.ApproveVerificationAsync(ProviderId, AdminId), Times.Once);
    }

    [Fact]
    public async Task Reject_forwards_reason_and_admin_id()
    {
        _service.Setup(s => s.RejectVerificationAsync(ProviderId, AdminId, "bad docs"))
            .ReturnsAsync(ServiceProviderResult<ServiceProviderVerificationResponse>.Ok(new ServiceProviderVerificationResponse()));

        var result = await _controller.Reject(ProviderId, new RejectProviderVerificationRequest { Reason = "bad docs" })
            as OkObjectResult;

        result!.StatusCode.Should().Be(200);
        _service.Verify(s => s.RejectVerificationAsync(ProviderId, AdminId, "bad docs"), Times.Once);
    }

    [Fact]
    public async Task Conflict_outcome_maps_to_409()
    {
        _service.Setup(s => s.ApproveVerificationAsync(ProviderId, AdminId))
            .ReturnsAsync(ServiceProviderResult<ServiceProviderVerificationResponse>.Conflict("not under review"));

        var result = await _controller.Approve(ProviderId) as ConflictObjectResult;

        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(409);
        ((ApiResponse)result.Value!).Success.Should().BeFalse();
    }

    [Fact]
    public async Task NotFound_outcome_maps_to_404()
    {
        _service.Setup(s => s.ApproveVerificationAsync(ProviderId, AdminId))
            .ReturnsAsync(ServiceProviderResult<ServiceProviderVerificationResponse>.NotFound("nope"));

        var result = await _controller.Approve(ProviderId) as NotFoundObjectResult;

        result!.StatusCode.Should().Be(404);
    }
}
