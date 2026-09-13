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
    public async Task CaseA_Gate_Fails_When_All_False()
    {
        // Arrange: Email=F, Phone=F, Identity=F
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            User = "Creator",
            Onboarding = new OnboardingState
            {
                Phase = 0,
                EmailOtpVerified = false,
                PhoneVerified = false,
                IdentityDocumentVerified = false,
            }
        };

        // Act
        await OnboardingGate.PromoteIfCompleteAsync(user, _userManagerMock.Object);

        // Assert: Must remain Phase 0
        Assert.Equal(0, user.Onboarding.Phase);
        Assert.Null(user.Onboarding.CompletedAt);
    }

    [Fact]
    public async Task CaseB_Gate_Fails_When_Email_Only()
    {
        // Arrange: Email=T, Phone=F, Identity=F
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            User = "Creator",
            Onboarding = new OnboardingState
            {
                Phase = 0,
                EmailOtpVerified = true,
                PhoneVerified = false,
                IdentityDocumentVerified = false,
            }
        };

        // Act
        await OnboardingGate.PromoteIfCompleteAsync(user, _userManagerMock.Object);

        // Assert: Must remain Phase 0
        Assert.Equal(0, user.Onboarding.Phase);
        Assert.Null(user.Onboarding.CompletedAt);
    }

    [Fact]
    public async Task CaseC_Gate_Fails_When_Phone_Only()
    {
        // Arrange: Email=F, Phone=T, Identity=F
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            User = "Creator",
            Onboarding = new OnboardingState
            {
                Phase = 0,
                EmailOtpVerified = false,
                PhoneVerified = true,
                IdentityDocumentVerified = false,
            }
        };

        // Act
        await OnboardingGate.PromoteIfCompleteAsync(user, _userManagerMock.Object);

        // Assert: Must remain Phase 0
        Assert.Equal(0, user.Onboarding.Phase);
        Assert.Null(user.Onboarding.CompletedAt);
    }

    [Fact]
    public async Task CaseD_Gate_Passes_When_Email_And_Phone_True_With_Identity_Deferred()
    {
        // Arrange: Email=T, Phone=T, Identity=F (MVP default: identity deferred)
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
                IdentityDocumentVerified = false,
            }
        };

        // Act
        await OnboardingGate.PromoteIfCompleteAsync(user, _userManagerMock.Object);

        // Assert: User promoted to Phase 1, but KycStatus is NOT verified because identity document is not verified
        Assert.Equal(1, user.Onboarding.Phase);
        Assert.NotNull(user.Onboarding.CompletedAt);
        Assert.NotEqual("VERIFIED", user.KycStatus);
    }

    [Fact]
    public async Task CaseE_Gate_Passes_And_Sets_KycVerified_When_Identity_Is_Also_Verified()
    {
        // Arrange: Email=T, Phone=T, Identity=T
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
            }
        };

        // Act
        await OnboardingGate.PromoteIfCompleteAsync(user, _userManagerMock.Object);

        // Assert: User promoted to Phase 1 and KycStatus IS set to VERIFIED
        Assert.Equal(1, user.Onboarding.Phase);
        Assert.NotNull(user.Onboarding.CompletedAt);
        Assert.Equal("VERIFIED", user.KycStatus);
        Assert.NotNull(user.Kyc);
        Assert.Equal(VerificationStatus.Verified, user.Kyc.Status);
    }

    [Fact]
    public async Task FeatureFlag_When_Enabled_Requires_Identity_For_Phase1()
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["FeatureFlags:RequireIdentityVerificationInUniversalOnboarding"] = "true"
        }).Build();

        var userWithoutIdentity = new ApplicationUser
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
            }
        };

        var userWithIdentity = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = "test2@example.com",
            User = "Entrepreneur",
            Onboarding = new OnboardingState
            {
                Phase = 0,
                EmailOtpVerified = true,
                PhoneVerified = true,
                IdentityDocumentVerified = true,
            }
        };

        // Act: Evaluate user without identity with flag=true
        await OnboardingGate.PromoteIfCompleteAsync(userWithoutIdentity, _userManagerMock.Object, config);
        // Assert: Must remain Phase 0 when flag is true and identity is missing
        Assert.Equal(0, userWithoutIdentity.Onboarding.Phase);
        Assert.Null(userWithoutIdentity.Onboarding.CompletedAt);

        // Act: Evaluate user with identity with flag=true
        await OnboardingGate.PromoteIfCompleteAsync(userWithIdentity, _userManagerMock.Object, config);
        // Assert: Must promote to Phase 1
        Assert.Equal(1, userWithIdentity.Onboarding.Phase);
        Assert.NotNull(userWithIdentity.Onboarding.CompletedAt);
    }

    [Theory]
    [InlineData("Creator")]
    [InlineData("Entrepreneur")]
    [InlineData("Investor")]
    [InlineData("ServiceProvider")]
    public async Task Role_Parity_All_Roles_Reach_Phase1_Without_Identity_Under_Default_MVP(string role)
    {
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = $"{role.ToLower()}@example.com",
            User = role,
            Onboarding = new OnboardingState
            {
                Phase = 0,
                EmailOtpVerified = true,
                PhoneVerified = true,
                IdentityDocumentVerified = false,
            }
        };

        await OnboardingGate.PromoteIfCompleteAsync(user, _userManagerMock.Object);

        Assert.Equal(1, user.Onboarding.Phase);
        Assert.NotNull(user.Onboarding.CompletedAt);
    }

    [Theory]
    [InlineData("Creator")]
    [InlineData("Entrepreneur")]
    [InlineData("Investor")]
    [InlineData("ServiceProvider")]
    public void RequiredItemsFor_Returns_Two_Items_By_Default_And_Three_When_Flag_Enabled(string role)
    {
        // Default (Identity deferred): 2 items
        var defaultItems = OnboardingGate.RequiredItemsFor(role);
        Assert.Equal(2, defaultItems.Count);
        Assert.Contains("phone", defaultItems);
        Assert.Contains("email", defaultItems);
        Assert.DoesNotContain("identity", defaultItems);

        // Flag enabled (Identity required): 3 items
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["FeatureFlags:RequireIdentityVerificationInUniversalOnboarding"] = "true"
        }).Build();

        var flagItems = OnboardingGate.RequiredItemsFor(role, config);
        Assert.Equal(3, flagItems.Count);
        Assert.Contains("identity", flagItems);
        Assert.Contains("phone", flagItems);
        Assert.Contains("email", flagItems);
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
            ["FeatureFlags:RequireIdentityVerificationInUniversalOnboarding"] = "false",
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
    public async Task CompleteOnboarding_Passes_With_Email_And_Phone_When_Identity_Deferred()
    {
        // Arrange: Email=true, Phone=true, Identity=false
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
                IdentityDocumentVerified = false
            }
        };

        var controller = CreateController(user, environment: "Production");

        // Act
        var result = await controller.CompleteOnboarding();

        // Assert: Successfully completes onboarding and promotes to Phase 1 without identity document requirement
        Assert.IsType<OkObjectResult>(result);
        Assert.Equal(1, user.Onboarding.Phase);
        Assert.False(user.Onboarding.IdentityDocumentVerified, "IdentityDocumentVerified remains false as deferred");
    }

    [Fact]
    public async Task StatusEndpoint_Naturally_Promotes_Existing_Phase0_User_With_Email_And_Phone()
    {
        // Arrange: Existing user with Email=true, Phone=true, Phase=0, Identity=false
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = "phase0-user@example.com",
            User = "Entrepreneur",
            Onboarding = new OnboardingState
            {
                Phase = 0,
                EmailOtpVerified = true,
                PhoneVerified = true,
                IdentityDocumentVerified = false
            }
        };

        var controller = CreateController(user, environment: "Production");

        // Act
        var result = await controller.Status();

        // Assert: Naturally promoted to Phase 1 upon status check
        Assert.IsType<OkObjectResult>(result);
        Assert.Equal(1, user.Onboarding.Phase);
    }
}

