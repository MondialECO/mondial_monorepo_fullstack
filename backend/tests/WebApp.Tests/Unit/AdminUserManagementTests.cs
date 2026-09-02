using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Security.Claims;
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
using WebApp.Services;
using Xunit;

namespace WebApp.Tests.Unit;

public class AdminUserManagementTests
{
    private const string CurrentAdminId = "00000000-0000-0000-0000-000000000001";
    private const string TargetUserId = "00000000-0000-0000-0000-000000000002";

    private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
    private readonly Mock<RoleManager<ApplicationRole>> _roleManagerMock;
    private readonly Mock<IPhaseNotificationService> _phaseNotificationServiceMock = new();
    private readonly Mock<IInvestorService> _investorServiceMock = new();
    private readonly Mock<IMongoDatabase> _mongoDbMock = new();
    private readonly MongoDbContext _dbContext;

    private readonly List<ApplicationUser> _users = new();
    private readonly Dictionary<string, List<string>> _userRoles = new();

    private readonly AdminController _controller;

    public AdminUserManagementTests()
    {
        var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
        _userManagerMock = new Mock<UserManager<ApplicationUser>>(userStoreMock.Object, null, null, null, null, null, null, null, null);

        var roleStoreMock = new Mock<IRoleStore<ApplicationRole>>();
        _roleManagerMock = new Mock<RoleManager<ApplicationRole>>(roleStoreMock.Object, null, null, null, null);

        // Setup user find
        _userManagerMock.Setup(u => u.FindByIdAsync(It.IsAny<string>()))
            .ReturnsAsync((string id) => _users.FirstOrDefault(u => u.Id.ToString() == id));

        _userManagerMock.Setup(u => u.GetRolesAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync((ApplicationUser user) => _userRoles.TryGetValue(user.Id.ToString(), out var roles) ? roles : new List<string>());

        _userManagerMock.Setup(u => u.AddToRoleAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .ReturnsAsync((ApplicationUser user, string role) =>
            {
                if (!_userRoles.ContainsKey(user.Id.ToString()))
                    _userRoles[user.Id.ToString()] = new List<string>();
                if (!_userRoles[user.Id.ToString()].Contains(role))
                    _userRoles[user.Id.ToString()].Add(role);
                return IdentityResult.Success;
            });

        _userManagerMock.Setup(u => u.RemoveFromRoleAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .ReturnsAsync((ApplicationUser user, string role) =>
            {
                if (_userRoles.TryGetValue(user.Id.ToString(), out var roles))
                    roles.RemoveAll(r => string.Equals(r, role, StringComparison.OrdinalIgnoreCase));
                return IdentityResult.Success;
            });

        _userManagerMock.Setup(u => u.GetUsersInRoleAsync(It.IsAny<string>()))
            .ReturnsAsync((string role) =>
            {
                var matchingUserIds = _userRoles
                    .Where(kv => kv.Value.Any(r => string.Equals(r, role, StringComparison.OrdinalIgnoreCase)))
                    .Select(kv => kv.Key)
                    .ToHashSet();
                return _users.Where(u => matchingUserIds.Contains(u.Id.ToString())).ToList();
            });

        _userManagerMock.Setup(u => u.IsInRoleAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .ReturnsAsync((ApplicationUser user, string role) =>
                _userRoles.TryGetValue(user.Id.ToString(), out var roles) &&
                roles.Any(r => string.Equals(r, role, StringComparison.OrdinalIgnoreCase)));

        _userManagerMock.Setup(u => u.UpdateAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync(IdentityResult.Success);

        _roleManagerMock.Setup(r => r.RoleExistsAsync(It.IsAny<string>()))
            .ReturnsAsync((string role) => new[] { "SuperAdmin", "Admin", "Creator", "Entrepreneur", "Investor", "ServiceProvider" }.Contains(role));

        // Mock MongoDB collections
        var appUsersCollectionMock = new Mock<IMongoCollection<ApplicationUser>>();
        var profCollectionMock = new Mock<IMongoCollection<ProfessionalProfileRecord>>();
        var ideasCollectionMock = new Mock<IMongoCollection<BusinessIdeas>>();
        var companiesCollectionMock = new Mock<IMongoCollection<Companies>>();
        var servicesCollectionMock = new Mock<IMongoCollection<ServiceListing>>();
        var workroomsCollectionMock = new Mock<IMongoCollection<WorkroomEngagement>>();
        var investorMatchesMock = new Mock<IMongoCollection<InvestorMatch>>();
        var investmentsMock = new Mock<IMongoCollection<Investments>>();
        var investorFinanceMock = new Mock<IMongoCollection<InvestorFinanceVerification>>();

        _mongoDbMock.Setup(db => db.GetCollection<ApplicationUser>("applicationUsers", null))
            .Returns(appUsersCollectionMock.Object);
        _mongoDbMock.Setup(db => db.GetCollection<ProfessionalProfileRecord>("ProfessionalProfiles", null))
            .Returns(profCollectionMock.Object);
        _mongoDbMock.Setup(db => db.GetCollection<BusinessIdeas>("BusinessIdeas", null))
            .Returns(ideasCollectionMock.Object);
        _mongoDbMock.Setup(db => db.GetCollection<Companies>("Companies", null))
            .Returns(companiesCollectionMock.Object);
        _mongoDbMock.Setup(db => db.GetCollection<ServiceListing>("ServiceListings", null))
            .Returns(servicesCollectionMock.Object);
        _mongoDbMock.Setup(db => db.GetCollection<WorkroomEngagement>("WorkroomEngagements", null))
            .Returns(workroomsCollectionMock.Object);
        _mongoDbMock.Setup(db => db.GetCollection<InvestorMatch>("InvestorMatches", null))
            .Returns(investorMatchesMock.Object);
        _mongoDbMock.Setup(db => db.GetCollection<Investments>("Investments", null))
            .Returns(investmentsMock.Object);
        _mongoDbMock.Setup(db => db.GetCollection<InvestorFinanceVerification>("InvestorFinanceVerifications", null))
            .Returns(investorFinanceMock.Object);

        _dbContext = new MongoDbContext(_mongoDbMock.Object);

        _controller = new AdminController(
            _userManagerMock.Object,
            _roleManagerMock.Object,
            _dbContext,
            _phaseNotificationServiceMock.Object,
            _investorServiceMock.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(
                        new[]
                        {
                            new Claim(ClaimTypes.NameIdentifier, CurrentAdminId),
                            new Claim(ClaimTypes.Role, "Admin"),
                        }, "test")),
                },
            },
        };

        // Seed default target user
        var targetUser = new ApplicationUser
        {
            Id = Guid.Parse(TargetUserId),
            Name = "Test User",
            Email = "test@mondial.local",
            UserName = "test@mondial.local",
            CreatedAt = DateTime.UtcNow.AddDays(-10)
        };
        _users.Add(targetUser);
        _userRoles[TargetUserId] = new List<string> { "Creator", "ServiceProvider" };
    }

    [Fact]
    public void AdminController_Has_Authorize_Admin_Attribute()
    {
        var attr = typeof(AdminController).GetCustomAttribute<AuthorizeAttribute>();
        attr.Should().NotBeNull();
        attr!.Roles.Should().Be("Admin,SuperAdmin");
    }

    [Fact]
    public async Task AddRole_AddsRole_And_Preserves_ExistingRoles()
    {
        var result = await _controller.AddRoleToUser(TargetUserId, new AddUserRoleRequest { Role = "Entrepreneur" });

        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        _userRoles[TargetUserId].Should().Contain("Creator");
        _userRoles[TargetUserId].Should().Contain("ServiceProvider");
        _userRoles[TargetUserId].Should().Contain("Entrepreneur");
    }

    [Fact]
    public async Task AddRole_AdminCannotAssign_AdminOrSuperAdmin_Returns403()
    {
        // Normal Admin attempts to assign Admin role
        var resultAdmin = await _controller.AddRoleToUser(TargetUserId, new AddUserRoleRequest { Role = "Admin" });
        var statusResultAdmin = resultAdmin as ObjectResult;
        statusResultAdmin.Should().NotBeNull();
        statusResultAdmin!.StatusCode.Should().Be(403);

        // Normal Admin attempts to assign SuperAdmin role
        var resultSuper = await _controller.AddRoleToUser(TargetUserId, new AddUserRoleRequest { Role = "SuperAdmin" });
        var statusResultSuper = resultSuper as ObjectResult;
        statusResultSuper.Should().NotBeNull();
        statusResultSuper!.StatusCode.Should().Be(403);
    }

    [Fact]
    public async Task AddRole_Rejects_InvalidRole()
    {
        var result = await _controller.AddRoleToUser(TargetUserId, new AddUserRoleRequest { Role = "SuperHacker" });

        var badRequest = result as BadRequestObjectResult;
        badRequest.Should().NotBeNull();
        _userRoles[TargetUserId].Should().NotContain("SuperHacker");
    }

    [Fact]
    public async Task RemoveRole_RemovesOneRole_And_Preserves_RemainingRoles()
    {
        var result = await _controller.RemoveRoleFromUser(TargetUserId, new RemoveUserRoleRequest { Role = "ServiceProvider" });

        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        _userRoles[TargetUserId].Should().NotContain("ServiceProvider");
        _userRoles[TargetUserId].Should().Contain("Creator");
    }

    [Fact]
    public async Task RemoveRole_AdminCannotRemove_AdminOrSuperAdmin_Returns403()
    {
        _userRoles[TargetUserId].Add("Admin");
        var result = await _controller.RemoveRoleFromUser(TargetUserId, new RemoveUserRoleRequest { Role = "Admin" });
        var statusResult = result as ObjectResult;
        statusResult.Should().NotBeNull();
        statusResult!.StatusCode.Should().Be(403);
    }

    [Fact]
    public async Task RemoveRole_Blocks_Removing_Last_Remaining_Role()
    {
        // Target currently has Creator and ServiceProvider. Remove ServiceProvider first:
        await _controller.RemoveRoleFromUser(TargetUserId, new RemoveUserRoleRequest { Role = "ServiceProvider" });
        _userRoles[TargetUserId].Should().HaveCount(1);

        // Attempting to remove the last role (Creator) must be blocked:
        var result = await _controller.RemoveRoleFromUser(TargetUserId, new RemoveUserRoleRequest { Role = "Creator" });

        var badRequest = result as BadRequestObjectResult;
        badRequest.Should().NotBeNull();
        _userRoles[TargetUserId].Should().Contain("Creator");
    }

    [Fact]
    public async Task RemoveRole_SuperAdmin_LastSuperAdminProtection_Returns409()
    {
        // Setup SuperAdmin caller
        var superAdminId = Guid.NewGuid().ToString();
        var superAdminUser = new ApplicationUser
        {
            Id = Guid.Parse(superAdminId),
            Name = "Only SuperAdmin",
            Email = "superadmin@mondial.local"
        };
        _users.Add(superAdminUser);
        _userRoles[superAdminId] = new List<string> { "SuperAdmin", "Admin" };

        var superAdminController = new AdminController(
            _userManagerMock.Object,
            _roleManagerMock.Object,
            _dbContext,
            _phaseNotificationServiceMock.Object,
            _investorServiceMock.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(
                        new[]
                        {
                            new Claim(ClaimTypes.NameIdentifier, superAdminId),
                            new Claim(ClaimTypes.Role, "SuperAdmin"),
                        }, "test")),
                },
            },
        };

        var result = await superAdminController.RemoveRoleFromUser(superAdminId, new RemoveUserRoleRequest { Role = "SuperAdmin" });
        var conflictResult = result as ObjectResult;
        conflictResult.Should().NotBeNull();
        conflictResult!.StatusCode.Should().Be(409);
    }

    [Fact]
    public async Task RemoveRole_Blocks_Self_Admin_Removal()
    {
        var adminUser = new ApplicationUser
        {
            Id = Guid.Parse(CurrentAdminId),
            Name = "Admin User",
            Email = "admin@mondial.local"
        };
        _users.Add(adminUser);
        _userRoles[CurrentAdminId] = new List<string> { "Admin", "Creator" };

        var result = await _controller.RemoveRoleFromUser(CurrentAdminId, new RemoveUserRoleRequest { Role = "Admin" });

        // Normal admin trying to remove Admin role gets 403 Forbidden
        var forbiddenResult = result as ObjectResult;
        forbiddenResult.Should().NotBeNull();
        forbiddenResult!.StatusCode.Should().Be(403);
    }

    [Fact]
    public async Task DisableLogin_SuspendsUser_And_Prevents_SelfLockout()
    {
        // 1. Suspend target user
        var res = await _controller.DisableLogin(new UserLockoutRequest { UserId = TargetUserId, Reason = "Investigation" });
        var ok = res as OkObjectResult;
        ok.Should().NotBeNull();
        _users.First(u => u.Id.ToString() == TargetUserId).LockoutEnd.Should().Be(DateTimeOffset.MaxValue);

        // 2. Prevent self-suspension
        var selfRes = await _controller.DisableLogin(new UserLockoutRequest { UserId = CurrentAdminId });
        var badRequest = selfRes as BadRequestObjectResult;
        badRequest.Should().NotBeNull();
    }

    [Fact]
    public async Task DisableLogin_AdminCannotSuspend_SuperAdmin_Returns403()
    {
        var superAdminId = Guid.NewGuid().ToString();
        var superAdminUser = new ApplicationUser
        {
            Id = Guid.Parse(superAdminId),
            Name = "Target SuperAdmin",
            Email = "target.super@mondial.local"
        };
        _users.Add(superAdminUser);
        _userRoles[superAdminId] = new List<string> { "SuperAdmin" };

        var result = await _controller.DisableLogin(new UserLockoutRequest { UserId = superAdminId });
        var statusResult = result as ObjectResult;
        statusResult.Should().NotBeNull();
        statusResult!.StatusCode.Should().Be(403);
    }

    [Fact]
    public async Task EnableLogin_RestoresUserLogin()
    {
        _users.First(u => u.Id.ToString() == TargetUserId).LockoutEnd = DateTimeOffset.MaxValue;

        var res = await _controller.EnableLogin(new UserLockoutRequest { UserId = TargetUserId });
        var ok = res as OkObjectResult;
        ok.Should().NotBeNull();
        _users.First(u => u.Id.ToString() == TargetUserId).LockoutEnd.Should().BeNull();
    }
}
