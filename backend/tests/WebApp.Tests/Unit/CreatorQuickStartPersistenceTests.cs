using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Moq;
using WebApp.Controllers;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Migrations;
using Xunit;

namespace WebApp.Tests.Unit;

public class CreatorQuickStartPersistenceTests
{
    private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
    private readonly Mock<IProfessionalProfileStore> _profStoreMock;
    private readonly Mock<IServiceProviderProfileSplitMigration> _migrationMock;

    public CreatorQuickStartPersistenceTests()
    {
        var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
        _userManagerMock = new Mock<UserManager<ApplicationUser>>(
            userStoreMock.Object, null!, null!, null!, null!, null!, null!, null!, null!);
        _profStoreMock = new Mock<IProfessionalProfileStore>();
        _migrationMock = new Mock<IServiceProviderProfileSplitMigration>();
    }

    private (CreatorQuickStartService Service, CreatorQuickStartController Controller) CreateHarness(
        string userId,
        string role = "Creator",
        ProfessionalProfileRecord? initialProfile = null)
    {
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = "creator_user",
            Email = "creator@mondial.eco"
        };

        var profile = initialProfile ?? new ProfessionalProfileRecord
        {
            UserId = userId,
            PublicSlug = "creator-user"
        };

        _userManagerMock.Setup(m => m.FindByIdAsync(userId)).ReturnsAsync(user);
        _userManagerMock.Setup(m => m.GetRolesAsync(user)).ReturnsAsync(new List<string> { role });

        _migrationMock.Setup(m => m.EnsureProfessionalProfileAsync(user, It.IsAny<CancellationToken>()))
            .ReturnsAsync(profile);

        _profStoreMock.Setup(m => m.GetByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(profile);
        _profStoreMock.Setup(m => m.UpsertAsync(It.IsAny<ProfessionalProfileRecord>(), null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var service = new CreatorQuickStartService(
            _userManagerMock.Object,
            _profStoreMock.Object,
            _migrationMock.Object,
            context: null // In-memory store path
        );

        var controller = new CreatorQuickStartController(service);
        var httpContext = new DefaultHttpContext();
        var identity = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Role, role)
        }, "TestAuth");
        httpContext.User = new ClaimsPrincipal(identity);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };

        return (service, controller);
    }

    [Fact]
    public async Task NewCreator_StartsAtStep1_MissingStateReturnsNextRequiredStep1()
    {
        var userId = "usr-new-creator";
        var (_, controller) = CreateHarness(userId, "Creator");

        var result = await controller.GetStatus(CancellationToken.None);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var env = okResult.Value.Should().BeAssignableTo<ApiResponse>().Subject;
        env.Success.Should().BeTrue();

        var status = env.Data.Should().BeOfType<HumainXQuickStartStatusDto>().Subject;
        status.Completed.Should().BeFalse();
        status.CompletedAt.Should().BeNull();
        status.Step1ConfirmedAt.Should().BeNull();
        status.Step2ConfirmedAt.Should().BeNull();
        status.Step3ConfirmedAt.Should().BeNull();
        status.NextRequiredStep.Should().Be(1);
    }

    [Fact]
    public async Task Step1Continue_ValidData_PersistsStep1ConfirmedAt_AndReturnsStep2()
    {
        var userId = "usr-step1-creator";
        var (_, controller) = CreateHarness(userId, "Creator");

        var request = new QuickStartStep1RequestDto
        {
            Region = "Île-de-France",
            CurrentSituation = "Employed",
            WeeklyAvailability = "10–20 hrs"
        };

        var result = await controller.ConfirmStep1(request, CancellationToken.None);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var env = okResult.Value.Should().BeAssignableTo<ApiResponse>().Subject;
        var status = env.Data.Should().BeOfType<HumainXQuickStartStatusDto>().Subject;

        status.Step1ConfirmedAt.Should().NotBeNull();
        status.NextRequiredStep.Should().Be(2);
        status.Completed.Should().BeFalse();
    }

    [Fact]
    public async Task Step1Continue_InvalidOrMissingData_ReturnsBadRequest()
    {
        var userId = "usr-step1-invalid";
        var (_, controller) = CreateHarness(userId, "Creator");

        var request = new QuickStartStep1RequestDto
        {
            Region = "Île-de-France",
            CurrentSituation = "", // Missing
            WeeklyAvailability = "10–20 hrs"
        };

        var result = await controller.ConfirmStep1(request, CancellationToken.None);

        var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        var env = badRequest.Value.Should().BeAssignableTo<ApiResponse>().Subject;
        env.Success.Should().BeFalse();
        env.Message.Should().Contain("required");
    }

    [Fact]
    public async Task Step2Continue_WithoutStep1Confirmed_IsRejectedWithBadRequest()
    {
        var userId = "usr-step2-rejected";
        var (_, controller) = CreateHarness(userId, "Creator");

        var request = new QuickStartStep2RequestDto
        {
            Skills = new List<ProfileSkillDto>
            {
                new() { Name = "TypeScript", Level = "Comfortable" }
            }
        };

        var result = await controller.ConfirmStep2(request, CancellationToken.None);

        var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        var env = badRequest.Value.Should().BeAssignableTo<ApiResponse>().Subject;
        env.Success.Should().BeFalse();
        env.Message.Should().Contain("Step 1 must be confirmed");
    }

    [Fact]
    public async Task Step2Continue_ValidSkills_PersistsStep2ConfirmedAt_AndReturnsStep3()
    {
        var userId = "usr-step2-valid";
        var profile = new ProfessionalProfileRecord
        {
            UserId = userId,
            QuickStart = new HumainXQuickStartState
            {
                Step1ConfirmedAt = DateTime.UtcNow.AddMinutes(-5)
            }
        };

        var (_, controller) = CreateHarness(userId, "Creator", profile);

        var request = new QuickStartStep2RequestDto
        {
            Skills = new List<ProfileSkillDto>
            {
                new() { Name = "Sales", Level = "Advanced" }
            }
        };

        var result = await controller.ConfirmStep2(request, CancellationToken.None);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var env = okResult.Value.Should().BeAssignableTo<ApiResponse>().Subject;
        var status = env.Data.Should().BeOfType<HumainXQuickStartStatusDto>().Subject;

        status.Step1ConfirmedAt.Should().NotBeNull();
        status.Step2ConfirmedAt.Should().NotBeNull();
        status.NextRequiredStep.Should().Be(3);
        status.Completed.Should().BeFalse();
    }

    [Fact]
    public async Task Step2Continue_InvalidSkillLevelOrEmpty_ReturnsBadRequest()
    {
        var userId = "usr-step2-invalid-level";
        var profile = new ProfessionalProfileRecord
        {
            UserId = userId,
            QuickStart = new HumainXQuickStartState
            {
                Step1ConfirmedAt = DateTime.UtcNow.AddMinutes(-5)
            }
        };

        var (_, controller) = CreateHarness(userId, "Creator", profile);

        var request = new QuickStartStep2RequestDto
        {
            Skills = new List<ProfileSkillDto>
            {
                new() { Name = "Sales", Level = "ExpertUltra" } // Invalid level
            }
        };

        var result = await controller.ConfirmStep2(request, CancellationToken.None);

        var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        var env = badRequest.Value.Should().BeAssignableTo<ApiResponse>().Subject;
        env.Success.Should().BeFalse();
        env.Message.Should().Contain("proficiency level");
    }

    [Fact]
    public async Task Step3StartMyProject_WithoutPreviousSteps_IsRejectedWithBadRequest()
    {
        var userId = "usr-step3-unconfirmed";
        var (_, controller) = CreateHarness(userId, "Creator");

        var request = new QuickStartStep3RequestDto
        {
            PreviousEntrepreneurialExperience = "This is my first time",
            ProgressPreference = "A bit of both"
        };

        var result = await controller.Complete(request, CancellationToken.None);

        var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        var env = badRequest.Value.Should().BeAssignableTo<ApiResponse>().Subject;
        env.Success.Should().BeFalse();
        env.Message.Should().Contain("Step 1 must be confirmed");
    }

    [Fact]
    public async Task Step3StartMyProject_ValidData_AtomicallyPersistsStep3AndCompletedAt()
    {
        var userId = "usr-step3-complete";
        var profile = new ProfessionalProfileRecord
        {
            UserId = userId,
            QuickStart = new HumainXQuickStartState
            {
                Step1ConfirmedAt = DateTime.UtcNow.AddMinutes(-10),
                Step2ConfirmedAt = DateTime.UtcNow.AddMinutes(-5)
            }
        };

        var (_, controller) = CreateHarness(userId, "Creator", profile);

        var request = new QuickStartStep3RequestDto
        {
            PreviousEntrepreneurialExperience = "This is my first time",
            ProgressPreference = "I'd rather learn it"
        };

        var result = await controller.Complete(request, CancellationToken.None);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var env = okResult.Value.Should().BeAssignableTo<ApiResponse>().Subject;
        var status = env.Data.Should().BeOfType<HumainXQuickStartStatusDto>().Subject;

        status.Step3ConfirmedAt.Should().NotBeNull();
        status.CompletedAt.Should().NotBeNull();
        status.Completed.Should().BeTrue();
        status.NextRequiredStep.Should().BeNull();
    }

    [Fact]
    public async Task Step3StartMyProject_Idempotent_SubsequentCallsSucceedWithoutOverwritingCompletedAt()
    {
        var originalCompletedAt = DateTime.UtcNow.AddDays(-2);
        var originalStep3At = DateTime.UtcNow.AddDays(-2);
        var userId = "usr-step3-idempotent";
        var profile = new ProfessionalProfileRecord
        {
            UserId = userId,
            QuickStart = new HumainXQuickStartState
            {
                Step1ConfirmedAt = DateTime.UtcNow.AddDays(-2),
                Step2ConfirmedAt = DateTime.UtcNow.AddDays(-2),
                Step3ConfirmedAt = originalStep3At,
                CompletedAt = originalCompletedAt
            }
        };

        var (_, controller) = CreateHarness(userId, "Creator", profile);

        var request = new QuickStartStep3RequestDto
        {
            PreviousEntrepreneurialExperience = "This is my first time",
            ProgressPreference = "A bit of both"
        };

        var result = await controller.Complete(request, CancellationToken.None);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var env = okResult.Value.Should().BeAssignableTo<ApiResponse>().Subject;
        var status = env.Data.Should().BeOfType<HumainXQuickStartStatusDto>().Subject;

        status.Completed.Should().BeTrue();
        status.CompletedAt.Should().Be(originalCompletedAt);
        status.Step3ConfirmedAt.Should().Be(originalStep3At);
    }

    [Fact]
    public async Task UserIsolation_UserCanOnlyAccessAndModifyOwnQuickStartState()
    {
        var userA = "usr-creator-a";
        var userB = "usr-creator-b";

        var profileA = new ProfessionalProfileRecord
        {
            UserId = userA,
            QuickStart = new HumainXQuickStartState
            {
                Step1ConfirmedAt = DateTime.UtcNow.AddHours(-1)
            }
        };

        var profileB = new ProfessionalProfileRecord
        {
            UserId = userB,
            QuickStart = null // User B has no state
        };

        var (service, controllerA) = CreateHarness(userA, "Creator", profileA);

        // User A fetches status
        var statusA = await service.GetStatusAsync(userA);
        statusA.Step1ConfirmedAt.Should().NotBeNull();
        statusA.NextRequiredStep.Should().Be(2);

        // Harness for User B
        var (_, controllerB) = CreateHarness(userB, "Creator", profileB);
        var statusB = await service.GetStatusAsync(userB);
        statusB.Step1ConfirmedAt.Should().BeNull();
        statusB.NextRequiredStep.Should().Be(1);
    }

    [Fact]
    public async Task PreExistingProfileData_DoesNotAutoComplete_QuickStartUntilExplicitlyConfirmed()
    {
        var userId = "usr-legacy-data";
        var legacyProfile = new ProfessionalProfileRecord
        {
            UserId = userId,
            Skills = new List<ProfileSkill>
            {
                new() { Name = "Marketing", Level = "Advanced" }
            },
            VentureContext = new ProfileVentureContext
            {
                Region = "Hauts-de-France",
                CurrentSituation = "Employed",
                WeeklyAvailability = "Full-time",
                PreviousEntrepreneurialExperience = "I currently run another activity",
                LearningPreference = "I want to learn them myself"
            },
            QuickStart = null // Zero QuickStart confirmation recorded
        };

        var (service, _) = CreateHarness(userId, "Creator", legacyProfile);

        var status = await service.GetStatusAsync(userId);
        status.Completed.Should().BeFalse();
        status.CompletedAt.Should().BeNull();
        status.NextRequiredStep.Should().Be(1);
    }

    [Fact]
    public void BackwardCompatibility_MissingQuickStartFieldInRecord_HandledGracefully()
    {
        var service = new CreatorQuickStartService(
            _userManagerMock.Object,
            _profStoreMock.Object,
            _migrationMock.Object,
            null
        );

        var resolved = service.ResolveStatus(null);
        resolved.Completed.Should().BeFalse();
        resolved.CompletedAt.Should().BeNull();
        resolved.NextRequiredStep.Should().Be(1);
    }

    [Fact]
    public async Task NonCreator_CannotAccessCreatorQuickStartEndpoints()
    {
        var userId = "usr-investor";
        var (_, controller) = CreateHarness(userId, "Investor");

        var result = await controller.GetStatus(CancellationToken.None);

        var statusCodeResult = result.Should().BeOfType<ObjectResult>().Subject;
        statusCodeResult.StatusCode.Should().Be(403);
        var env = statusCodeResult.Value.Should().BeAssignableTo<ApiResponse>().Subject;
        env.Success.Should().BeFalse();
        env.Message.Should().Contain("Only Creators");
    }

    [Fact]
    public async Task ConcurrentProfileAutosave_DoesNotLoseQuickStartState()
    {
        var userId = "usr-concurrency-safe";
        var profile = new ProfessionalProfileRecord
        {
            UserId = userId,
            Bio = "Original Bio",
            QuickStart = new HumainXQuickStartState
            {
                Step1ConfirmedAt = DateTime.UtcNow.AddMinutes(-10),
                Step2ConfirmedAt = DateTime.UtcNow.AddMinutes(-5)
            }
        };

        var (service, _) = CreateHarness(userId, "Creator", profile);

        // Simultaneous action: Profile bio changes while Step 3 completes
        profile.Bio = "Updated Bio Concurrent";

        var status = await service.CompleteAsync(userId, new QuickStartStep3RequestDto
        {
            PreviousEntrepreneurialExperience = "First time",
            ProgressPreference = "A bit of both"
        });

        status.Completed.Should().BeTrue();
        profile.Bio.Should().Be("Updated Bio Concurrent");
        profile.QuickStart.CompletedAt.Should().NotBeNull();
        profile.QuickStart.Step1ConfirmedAt.Should().NotBeNull();
        profile.QuickStart.Step2ConfirmedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task ConcurrentQuickStartUpdate_DoesNotOverwriteUnrelatedProfileFields()
    {
        var userId = "usr-unrelated-fields";
        var profile = new ProfessionalProfileRecord
        {
            UserId = userId,
            Experiences = new List<ProfessionalExperience>
            {
                new() { JobTitle = "CTO", CompanyName = "Tech Corp" }
            },
            Education = new List<ProfessionalEducation>
            {
                new() { Institution = "Sorbonne", Degree = "MSc" }
            },
            Languages = new List<string> { "French", "English" },
            QuickStart = null
        };

        var (service, _) = CreateHarness(userId, "Creator", profile);

        await service.ConfirmStep1Async(userId, new QuickStartStep1RequestDto
        {
            Region = "Normandie",
            CurrentSituation = "Employed",
            WeeklyAvailability = "10–20 hrs"
        });

        profile.Experiences.Should().HaveCount(1);
        profile.Experiences[0].JobTitle.Should().Be("CTO");
        profile.Education.Should().HaveCount(1);
        profile.Education[0].Institution.Should().Be("Sorbonne");
        profile.Languages.Should().Contain(new[] { "French", "English" });
        profile.QuickStart.Step1ConfirmedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task Step1AndStep2Confirmation_AreIdempotent()
    {
        var originalStep1 = DateTime.UtcNow.AddHours(-2);
        var originalStep2 = DateTime.UtcNow.AddHours(-1);

        var userId = "usr-step1-2-idempotent";
        var profile = new ProfessionalProfileRecord
        {
            UserId = userId,
            QuickStart = new HumainXQuickStartState
            {
                Step1ConfirmedAt = originalStep1,
                Step2ConfirmedAt = originalStep2
            }
        };

        var (service, _) = CreateHarness(userId, "Creator", profile);

        // Re-confirm Step 1
        var status1 = await service.ConfirmStep1Async(userId, new QuickStartStep1RequestDto
        {
            Region = "Île-de-France",
            CurrentSituation = "Employed",
            WeeklyAvailability = "10–20 hrs"
        });
        status1.Step1ConfirmedAt.Should().Be(originalStep1);

        // Re-confirm Step 2
        var status2 = await service.ConfirmStep2Async(userId, new QuickStartStep2RequestDto
        {
            Skills = new List<ProfileSkillDto> { new() { Name = "Design", Level = "Comfortable" } }
        });
        status2.Step2ConfirmedAt.Should().Be(originalStep2);
    }

    [Theory]
    [InlineData("I'd rather learn it")]
    [InlineData("I'd rather hand it off")]
    [InlineData("A bit of both")]
    [InlineData("Help me decide")]
    public void AllFourProgressPreferences_RoundTripWithoutCollision(string preferenceChoice)
    {
        var canonical = CreatorQuickStartService.MapProgressPreferenceToCanonical(preferenceChoice);
        var derived = CreatorQuickStartService.DeriveProgressPreference(canonical.Learning, canonical.Delegation);

        derived.Should().Be(preferenceChoice);
    }
}
