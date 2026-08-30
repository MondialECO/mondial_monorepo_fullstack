using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using Moq;
using WebApp.Controllers;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services;
using WebApp.Services.Interface;
using Xunit;

namespace WebApp.Tests.Unit;

public class InvestorFinanceVerificationTests
{
    private readonly Mock<MongoDbContext> _dbContextMock;
    private readonly Mock<IMongoDatabase> _mongoDbMock = new();
    private readonly Mock<IMongoCollection<InvestorFinanceVerification>> _verificationColMock = new();
    private readonly Mock<IMongoCollection<ApplicationUser>> _userColMock = new();
    private readonly Mock<ILogger<InvestorPhaseController>> _loggerMock = new();
    private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
    private readonly Mock<IInvestmentsService> _investmentsMock = new();
    private readonly Mock<IInvestorService> _investorMock = new();
    private readonly Mock<ICompanyService> _companyMock = new();
    private readonly Mock<IPhaseNotificationService> _notificationMock = new();
    private readonly Mock<SaveFile> _saveFileMock = new();

    public InvestorFinanceVerificationTests()
    {
        var store = new Mock<IUserStore<ApplicationUser>>();
        _userManagerMock = new Mock<UserManager<ApplicationUser>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        _dbContextMock = new Mock<MongoDbContext>(_mongoDbMock.Object);
        _dbContextMock.Setup(d => d.InvestorFinanceVerifications).Returns(_verificationColMock.Object);
        _dbContextMock.Setup(d => d.ApplicationUsers).Returns(_userColMock.Object);
    }

    private InvestorPhaseController CreateController(string userId, bool isAdmin = false)
    {
        var controller = new InvestorPhaseController(
            _dbContextMock.Object,
            _loggerMock.Object,
            _userManagerMock.Object,
            _investmentsMock.Object,
            _investorMock.Object,
            _companyMock.Object,
            _notificationMock.Object,
            _saveFileMock.Object
        );

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Name, "Test Investor")
        };
        if (isAdmin) claims.Add(new Claim(ClaimTypes.Role, "Admin"));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"))
            }
        };

        return controller;
    }

    [Fact]
    public async Task CreateTermSheet_WhenInvestorNotFinanceVerified_Returns403Forbidden()
    {
        var userId = Guid.NewGuid().ToString();
        var companyId = "comp-123";
        var user = new ApplicationUser
        {
            Id = Guid.Parse(userId),
            Email = "investor@mondial.test",
            Onboarding = new OnboardingState { Phase = 1 },
            InvestorProfile = new InvestorProfile
            {
                InvestorId = "inv-456",
                FinanceVerified = false // NOT verified!
            }
        };

        _userManagerMock.Setup(u => u.FindByIdAsync(userId)).ReturnsAsync(user);

        var controller = CreateController(userId);
        var request = new OfferTermsRequest
        {
            TotalRaiseAmount = 50000,
            PreMoneyValuation = 1000000,
            PostMoneyValuation = 1050000,
            InvestorEquityPercent = 5.0
        };

        var result = await controller.CreateTermSheet(companyId, request);

        result.Result.Should().BeOfType<ObjectResult>();
        var obj = result.Result as ObjectResult;
        obj!.StatusCode.Should().Be(403);
    }

    [Fact]
    public async Task CreateTermSheet_WhenInvestorFinanceVerified_CallsCompanyService()
    {
        var userId = Guid.NewGuid().ToString();
        var companyId = "comp-123";
        var user = new ApplicationUser
        {
            Id = Guid.Parse(userId),
            Email = "investor@mondial.test",
            Onboarding = new OnboardingState { Phase = 1 },
            InvestorProfile = new InvestorProfile
            {
                InvestorId = "inv-456",
                FinanceVerified = true // Verified!
            }
        };

        _userManagerMock.Setup(u => u.FindByIdAsync(userId)).ReturnsAsync(user);
        _companyMock.Setup(c => c.CreateInvestorOfferAsync(
            companyId, "inv-456", It.IsAny<OfferTermsRequest>(), userId, ""))
            .ReturnsAsync(new DealStatusResponse { DealId = "deal-789", Status = "offer_sent" });

        var controller = CreateController(userId);
        var request = new OfferTermsRequest
        {
            TotalRaiseAmount = 50000,
            PreMoneyValuation = 1000000,
            PostMoneyValuation = 1050000,
            InvestorEquityPercent = 5.0
        };

        var result = await controller.CreateTermSheet(companyId, request);

        result.Result.Should().BeOfType<OkObjectResult>();
        _companyMock.Verify(c => c.CreateInvestorOfferAsync(
            companyId, "inv-456", It.IsAny<OfferTermsRequest>(), userId, ""), Times.Once);
    }

    [Fact]
    public async Task AdminDecision_WhenVerify_UpdatesStatusAndEmitsApprovedNotification()
    {
        var userId = Guid.NewGuid().ToString();
        var verificationId = "ver-101";
        var verification = new InvestorFinanceVerification
        {
            Id = verificationId,
            UserId = userId,
            InvestorId = "inv-500",
            Status = "under_review",
            DeclaredAvailableCapital = 500000,
            MinTicket = 25000,
            MaxTicket = 100000
        };

        var user = new ApplicationUser
        {
            Id = Guid.Parse(userId),
            InvestorProfile = new InvestorProfile { InvestorId = "inv-500", FinanceVerified = false }
        };

        var cursorMock = new Mock<IAsyncCursor<InvestorFinanceVerification>>();
        cursorMock.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(true).Returns(false);
        cursorMock.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true).ReturnsAsync(false);
        cursorMock.Setup(c => c.Current).Returns(new List<InvestorFinanceVerification> { verification });

        _verificationColMock.Setup(c => c.FindAsync(
            It.IsAny<FilterDefinition<InvestorFinanceVerification>>(),
            It.IsAny<FindOptions<InvestorFinanceVerification, InvestorFinanceVerification>>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(cursorMock.Object);

        _userManagerMock.Setup(u => u.FindByIdAsync(userId)).ReturnsAsync(user);

        var roleStore = new Mock<IRoleStore<ApplicationRole>>();
        var roleManagerMock = new Mock<RoleManager<ApplicationRole>>(
            roleStore.Object, null!, null!, null!, null!);

        var adminController = new AdminController(
            _userManagerMock.Object,
            roleManagerMock.Object,
            _dbContextMock.Object,
            _notificationMock.Object,
            _investorMock.Object
        );

        var adminClaims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "admin-1"),
            new Claim(ClaimTypes.Role, "Admin")
        };
        adminController.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(adminClaims, "AdminAuth"))
            }
        };

        var decisionRequest = new AdminFinanceDecisionRequest
        {
            Action = "verify",
            DecisionReason = "All bank statements verified."
        };

        var actionResult = await adminController.DecideInvestorFinanceVerification(verificationId, decisionRequest);

        actionResult.Should().BeOfType<OkObjectResult>();
        user.InvestorProfile.FinanceVerified.Should().BeTrue();
        verification.Status.Should().Be("verified");

        _notificationMock.Verify(n => n.NotifyFinanceVerificationApprovedAsync(userId, "inv-500"), Times.Once);
        _userManagerMock.Verify(u => u.UpdateAsync(user), Times.Once);
    }

    [Fact]
    public async Task AdminDecision_WhenNeedsUpdate_UpdatesStatusAndEmitsNeedsUpdateNotification()
    {
        var userId = Guid.NewGuid().ToString();
        var verificationId = "ver-102";
        var verification = new InvestorFinanceVerification
        {
            Id = verificationId,
            UserId = userId,
            InvestorId = "inv-500",
            Status = "under_review"
        };

        var user = new ApplicationUser
        {
            Id = Guid.Parse(userId),
            InvestorProfile = new InvestorProfile { InvestorId = "inv-500", FinanceVerified = false }
        };

        var cursorMock = new Mock<IAsyncCursor<InvestorFinanceVerification>>();
        cursorMock.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(true).Returns(false);
        cursorMock.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true).ReturnsAsync(false);
        cursorMock.Setup(c => c.Current).Returns(new List<InvestorFinanceVerification> { verification });

        _verificationColMock.Setup(c => c.FindAsync(
            It.IsAny<FilterDefinition<InvestorFinanceVerification>>(),
            It.IsAny<FindOptions<InvestorFinanceVerification, InvestorFinanceVerification>>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(cursorMock.Object);

        _userManagerMock.Setup(u => u.FindByIdAsync(userId)).ReturnsAsync(user);

        var roleStore = new Mock<IRoleStore<ApplicationRole>>();
        var roleManagerMock = new Mock<RoleManager<ApplicationRole>>(
            roleStore.Object, null!, null!, null!, null!);

        var adminController = new AdminController(
            _userManagerMock.Object,
            roleManagerMock.Object,
            _dbContextMock.Object,
            _notificationMock.Object,
            _investorMock.Object
        );

        var adminClaims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "admin-1"),
            new Claim(ClaimTypes.Role, "Admin")
        };
        adminController.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(adminClaims, "AdminAuth"))
            }
        };

        var decisionRequest = new AdminFinanceDecisionRequest
        {
            Action = "needs_update",
            DecisionReason = "Please provide statement from the last 3 months."
        };

        var actionResult = await adminController.DecideInvestorFinanceVerification(verificationId, decisionRequest);

        actionResult.Should().BeOfType<OkObjectResult>();
        verification.Status.Should().Be("needs_update");
        user.InvestorProfile.FinanceVerified.Should().BeFalse();

        _notificationMock.Verify(n => n.NotifyFinanceVerificationNeedsUpdateAsync(
            userId, "inv-500", "Please provide statement from the last 3 months."), Times.Once);
    }

    [Fact]
    public async Task GetFinanceVerification_WhenNotStarted_ReturnsNotStartedStatus()
    {
        var userId = Guid.NewGuid().ToString();
        var user = new ApplicationUser
        {
            Id = Guid.Parse(userId),
            Email = "investor@mondial.test",
            Onboarding = new OnboardingState { Phase = 1 },
            InvestorProfile = new InvestorProfile { InvestorId = "inv-500", FinanceVerified = false }
        };

        var cursorMock = new Mock<IAsyncCursor<InvestorFinanceVerification>>();
        cursorMock.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(false);
        cursorMock.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(false);
        cursorMock.Setup(c => c.Current).Returns(new List<InvestorFinanceVerification>());

        _verificationColMock.Setup(c => c.FindAsync(
            It.IsAny<FilterDefinition<InvestorFinanceVerification>>(),
            It.IsAny<FindOptions<InvestorFinanceVerification, InvestorFinanceVerification>>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(cursorMock.Object);

        _userManagerMock.Setup(u => u.FindByIdAsync(userId)).ReturnsAsync(user);

        var controller = CreateController(userId);
        var actionResult = await controller.GetFinanceVerification();

        actionResult.Result.Should().BeOfType<OkObjectResult>();
        var ok = actionResult.Result as OkObjectResult;
        var data = ok!.Value as InvestorFinanceVerificationResponse;
        data.Should().NotBeNull();
        data!.Status.Should().Be("not_started");
        data.FinanceVerified.Should().BeFalse();
    }

    [Fact]
    public async Task GetFinanceVerification_WhenLegacyVerified_ReturnsVerifiedStatus()
    {
        var userId = Guid.NewGuid().ToString();
        var user = new ApplicationUser
        {
            Id = Guid.Parse(userId),
            Email = "investor@mondial.test",
            Onboarding = new OnboardingState { Phase = 1 },
            InvestorProfile = new InvestorProfile { InvestorId = "inv-500", FinanceVerified = true }
        };

        var cursorMock = new Mock<IAsyncCursor<InvestorFinanceVerification>>();
        cursorMock.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(false);
        cursorMock.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(false);
        cursorMock.Setup(c => c.Current).Returns(new List<InvestorFinanceVerification>());

        _verificationColMock.Setup(c => c.FindAsync(
            It.IsAny<FilterDefinition<InvestorFinanceVerification>>(),
            It.IsAny<FindOptions<InvestorFinanceVerification, InvestorFinanceVerification>>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(cursorMock.Object);

        _userManagerMock.Setup(u => u.FindByIdAsync(userId)).ReturnsAsync(user);

        var controller = CreateController(userId);
        var actionResult = await controller.GetFinanceVerification();

        actionResult.Result.Should().BeOfType<OkObjectResult>();
        var ok = actionResult.Result as OkObjectResult;
        var data = ok!.Value as InvestorFinanceVerificationResponse;
        data.Should().NotBeNull();
        data!.Status.Should().Be("verified");
        data.FinanceVerified.Should().BeTrue();
    }

    [Fact]
    public async Task SubmitFinanceVerification_WhenNoDocumentsUploaded_ReturnsBadRequest()
    {
        var userId = Guid.NewGuid().ToString();
        var user = new ApplicationUser
        {
            Id = Guid.Parse(userId),
            Email = "investor@mondial.test",
            Onboarding = new OnboardingState { Phase = 1 },
            InvestorProfile = new InvestorProfile { InvestorId = "inv-500", FinanceVerified = false }
        };

        var cursorMock = new Mock<IAsyncCursor<InvestorFinanceVerification>>();
        cursorMock.SetupSequence(c => c.MoveNext(It.IsAny<CancellationToken>())).Returns(false);
        cursorMock.SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(false);
        cursorMock.Setup(c => c.Current).Returns(new List<InvestorFinanceVerification>());

        _verificationColMock.Setup(c => c.FindAsync(
            It.IsAny<FilterDefinition<InvestorFinanceVerification>>(),
            It.IsAny<FindOptions<InvestorFinanceVerification, InvestorFinanceVerification>>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(cursorMock.Object);

        _userManagerMock.Setup(u => u.FindByIdAsync(userId)).ReturnsAsync(user);

        var controller = CreateController(userId);
        var submitRequest = new SubmitFinanceVerificationRequest
        {
            InvestorType = "angel",
            DeclaredAvailableCapital = 250000,
            MinTicket = 10000,
            MaxTicket = 50000,
            Currency = "EUR",
            DeploymentPeriodMonths = 12,
            SourceOfFunds = new List<string> { "Personal Savings" },
            DeclarationConfirmed = true
        };

        var actionResult = await controller.SubmitFinanceVerification(submitRequest);

        actionResult.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task SubmitFinanceVerification_WhenMaxTicketLessThanMinTicket_ReturnsBadRequest()
    {
        var userId = Guid.NewGuid().ToString();
        var user = new ApplicationUser
        {
            Id = Guid.Parse(userId),
            Email = "investor@mondial.test",
            Onboarding = new OnboardingState { Phase = 1 },
            InvestorProfile = new InvestorProfile { InvestorId = "inv-500", FinanceVerified = false }
        };

        _userManagerMock.Setup(u => u.FindByIdAsync(userId)).ReturnsAsync(user);

        var controller = CreateController(userId);
        var submitRequest = new SubmitFinanceVerificationRequest
        {
            InvestorType = "angel",
            DeclaredAvailableCapital = 250000,
            MinTicket = 50000,
            MaxTicket = 10000, // Invalid! Max < Min
            Currency = "EUR",
            DeploymentPeriodMonths = 12,
            SourceOfFunds = new List<string> { "Personal Savings" },
            DeclarationConfirmed = true
        };

        var actionResult = await controller.SubmitFinanceVerification(submitRequest);

        actionResult.Result.Should().BeOfType<BadRequestObjectResult>();
    }
}
