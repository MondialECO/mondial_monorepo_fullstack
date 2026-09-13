using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using WebApp.Controllers;
using WebApp.Models.DatabaseModels;
using WebApp.Services;
using WebApp.Services.Audit;
using WebApp.Services.Email;
using Xunit;

namespace WebApp.Tests.Unit;

public class OnboardingGateTests
{
    private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;

    public OnboardingGateTests()
    {
        var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
        _userManagerMock = new Mock<UserManager<ApplicationUser>>(userStoreMock.Object, null, null, null, null, null, null, null, null);
        _userManagerMock.Setup(u => u.UpdateAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync(IdentityResult.Success);
    }

    [Fact]
    public async Task Gate_Passes_With_Core_Three_Requirements_When_Face_Is_Historical_False()
    {
        // Arrange: Email, Phone, Identity verified; FaceVerified remains historical FALSE
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            User = "Creator",
            Onboarding = new OnboardingState
            {
                Phase = 0,
                EmailOtpVerified = true,
                PhoneVerified = true,
                IdentityDocumentVerified = true,
                FaceVerified = false,
            }
        };

        // Act
        await OnboardingGate.PromoteIfCompleteAsync(user, _userManagerMock.Object, null);

        // Assert: User must be promoted to Phase 1 based strictly on the 3 core requirements
        Assert.Equal(1, user.Onboarding.Phase);
        Assert.NotNull(user.Onboarding.CompletedAt);
        Assert.Equal("VERIFIED", user.KycStatus);
        Assert.Equal(VerificationStatus.Verified, user.Kyc.Status);
        Assert.False(user.Onboarding.FaceVerified, "FaceVerified is untouched and remains historical false");
    }

    [Fact]
    public async Task Gate_Fails_When_Identity_Missing()
    {
        // Arrange: Email & Phone verified, Identity = false
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            User = "Entrepreneur",
            Onboarding = new OnboardingState
            {
                Phase = 0,
                EmailOtpVerified = true,
                PhoneVerified = true,
                IdentityDocumentVerified = false,
                FaceVerified = false,
            }
        };

        // Act
        await OnboardingGate.PromoteIfCompleteAsync(user, _userManagerMock.Object, null);

        // Assert: Must remain Phase 0
        Assert.Equal(0, user.Onboarding.Phase);
        Assert.Null(user.Onboarding.CompletedAt);
    }

    [Fact]
    public async Task Gate_Fails_When_Phone_Missing()
    {
        // Arrange: Email & Identity verified, Phone = false
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            User = "Investor",
            Onboarding = new OnboardingState
            {
                Phase = 0,
                EmailOtpVerified = true,
                PhoneVerified = false,
                IdentityDocumentVerified = true,
                FaceVerified = false,
            }
        };

        // Act
        await OnboardingGate.PromoteIfCompleteAsync(user, _userManagerMock.Object, null);

        // Assert: Must remain Phase 0
        Assert.Equal(0, user.Onboarding.Phase);
        Assert.Null(user.Onboarding.CompletedAt);
    }

    [Fact]
    public async Task Gate_Fails_When_Email_Missing()
    {
        // Arrange: Phone & Identity verified, Email = false
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            User = "ServiceProvider",
            Onboarding = new OnboardingState
            {
                Phase = 0,
                EmailOtpVerified = false,
                PhoneVerified = true,
                IdentityDocumentVerified = true,
                FaceVerified = false,
            }
        };

        // Act
        await OnboardingGate.PromoteIfCompleteAsync(user, _userManagerMock.Object, null);

        // Assert: Must remain Phase 0
        Assert.Equal(0, user.Onboarding.Phase);
        Assert.Null(user.Onboarding.CompletedAt);
    }

    [Theory]
    [InlineData("Creator")]
    [InlineData("Entrepreneur")]
    [InlineData("Investor")]
    [InlineData("ServiceProvider")]
    public void RequiredItemsFor_Returns_Only_Active_Three_Core_Items(string role)
    {
        // Act
        var items = OnboardingGate.RequiredItemsFor(role);

        // Assert: Only 3 core items exist (identity, phone, email). Face is eliminated.
        Assert.Equal(3, items.Count);
        Assert.Contains("identity", items);
        Assert.Contains("phone", items);
        Assert.Contains("email", items);
        Assert.DoesNotContain("face", items);
    }

    private OnboardingController CreateController(
        ApplicationUser user,
        string environment = "Production",
        Dictionary<string, string?>? configOverrides = null)
    {
        var configBuilder = new ConfigurationBuilder();
        var initialData = new Dictionary<string, string?>
        {
            ["FeatureFlags:EnableAlphaBypassEndpoints"] = "false",
            ["JwtSettings:Key"] = "SuperSecretKeyForTestingAtLeast32BytesLong!",
            ["Twilio:Enabled"] = "false",
        };
        if (configOverrides != null)
        {
            foreach (var kvp in configOverrides)
                initialData[kvp.Key] = kvp.Value;
        }
        var configuration = configBuilder.AddInMemoryCollection(initialData).Build();

        var envMock = new Mock<IWebHostEnvironment>();
        envMock.Setup(e => e.EnvironmentName).Returns(environment);

        var twilioLogger = new Mock<ILogger<TwilioService>>();
        var twilio = new TwilioService(configuration, twilioLogger.Object);

        var queueMock = new Mock<IEmailQueue>();
        var emailLogger = new Mock<ILogger<EmailService>>();
        var emailService = new EmailService(queueMock.Object, emailLogger.Object);

        var sumsubLogger = new Mock<ILogger<SumsubService>>();
        var sumsub = new SumsubService(new HttpClient(), configuration, sumsubLogger.Object);

        var controllerLogger = new Mock<ILogger<OnboardingController>>();
        var saveFile = new SaveFile();
        var auditMock = new Mock<IAuditLogger>();

        var controller = new OnboardingController(
            _userManagerMock.Object,
            twilio,
            emailService,
            configuration,
            envMock.Object,
            sumsub,
            controllerLogger.Object,
            saveFile,
            auditMock.Object
        );

        var httpContext = new DefaultHttpContext();
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email!)
        }, "TestAuth"));

        controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

        _userManagerMock.Setup(u => u.FindByIdAsync(user.Id.ToString()))
            .ReturnsAsync(user);

        return controller;
    }

    [Fact]
    public async Task CompleteOnboarding_Passes_Without_Face_Verification()
    {
        // Arrange: Production user with Email=true, Phone=true, Identity=true, Face=false
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = "complete-user@example.com",
            User = "Creator",
            Onboarding = new OnboardingState
            {
                Phase = 0,
                EmailOtpVerified = true,
                PhoneVerified = true,
                IdentityDocumentVerified = true,
                FaceVerified = false // Face is NOT verified
            }
        };

        var controller = CreateController(user, environment: "Production");

        // Act
        var result = await controller.CompleteOnboarding();

        // Assert: Successfully completes onboarding and promotes to Phase 1 without face requirement
        Assert.IsType<OkObjectResult>(result);
        Assert.Equal(1, user.Onboarding.Phase);
        Assert.False(user.Onboarding.FaceVerified, "FaceVerified remains historical false without active modification");
    }
}
