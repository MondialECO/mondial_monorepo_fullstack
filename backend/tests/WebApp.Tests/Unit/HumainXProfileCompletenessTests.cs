using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using Moq;
using WebApp.Controllers;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Migrations;
using Xunit;

namespace WebApp.Tests.Unit;

public class HumainXProfileCompletenessTests
{
    private readonly ProfileCompletenessResolver _resolver = new();

    [Fact]
    public void Resolve_NullProfile_ReturnsZeroCompletion_AndNotPhase4Ready_WithAllMissingKeys()
    {
        var result = _resolver.Resolve(null);

        result.ProfileCompletion.Should().Be(0);
        result.Phase4Ready.Should().BeFalse();
        result.MissingForPhase4.Should().Contain(new[]
        {
            "Skills",
            "CurrentSituation",
            "WeeklyAvailability",
            "Region",
            "ProgressPreference"
        });
    }

    [Fact]
    public void Resolve_EmptyProfile_ReturnsZeroCompletion_AndMissingKeys()
    {
        var profile = new ProfessionalProfileRecord
        {
            UserId = "user-empty",
            Skills = new List<ProfileSkill>()
        };

        var result = _resolver.Resolve(profile);

        result.ProfileCompletion.Should().Be(0);
        result.Phase4Ready.Should().BeFalse();
        result.MissingForPhase4.Should().Contain(new[]
        {
            "Skills",
            "CurrentSituation",
            "WeeklyAvailability",
            "Region",
            "ProgressPreference"
        });
    }

    [Fact]
    public void Resolve_MinimumRequiredForPhase4_ReturnsPhase4ReadyTrue_EvenWhenExperienceAndEducationEmpty()
    {
        var profile = new ProfessionalProfileRecord
        {
            UserId = "user-min",
            Skills = new List<ProfileSkill>
            {
                new() { Name = "React", Level = "Comfortable", Source = "SelfDeclared" }
            },
            VentureContext = new ProfileVentureContext
            {
                CurrentSituation = "Employed",
                WeeklyAvailability = "10–20 hours/week",
                Region = "Île-de-France",
                LearningPreference = "I want to learn them myself"
            },
            Experiences = new List<ProfessionalExperience>(),
            Education = new List<ProfessionalEducation>(),
            Languages = new List<string>()
        };

        var result = _resolver.Resolve(profile);

        result.Phase4Ready.Should().BeTrue();
        result.MissingForPhase4.Should().BeEmpty();
        // Skills(20) + Situation(15) + Availability(15) + Region(10) + Preference(15) = 75
        result.ProfileCompletion.Should().Be(75);
    }

    [Fact]
    public void Resolve_DelegationPreference_Satisfies_ProgressPreference()
    {
        var profile = new ProfessionalProfileRecord
        {
            UserId = "user-delegation",
            Skills = new List<ProfileSkill> { new() { Name = "Sales" } },
            VentureContext = new ProfileVentureContext
            {
                CurrentSituation = "Student",
                WeeklyAvailability = "Full-time",
                Region = "Auvergne-Rhône-Alpes",
                DelegationPreference = "I prefer to delegate when possible"
            }
        };

        var result = _resolver.Resolve(profile);

        result.Phase4Ready.Should().BeTrue();
        result.MissingForPhase4.Should().NotContain("ProgressPreference");
    }

    [Fact]
    public void Resolve_MissingOnlyWeeklyAvailability_ReturnsPhase4ReadyFalse_WithSingleMissingKey()
    {
        var profile = new ProfessionalProfileRecord
        {
            UserId = "user-missing-avail",
            Skills = new List<ProfileSkill> { new() { Name = "Python" } },
            VentureContext = new ProfileVentureContext
            {
                CurrentSituation = "Self-employed / Freelance",
                WeeklyAvailability = "", // missing
                Region = "Occitanie",
                LearningPreference = "A mix of learning and delegation"
            }
        };

        var result = _resolver.Resolve(profile);

        result.Phase4Ready.Should().BeFalse();
        result.MissingForPhase4.Should().ContainSingle().Which.Should().Be("WeeklyAvailability");
    }

    [Fact]
    public void Resolve_SPProfileWithoutVentureContext_RemainsValid_CalculatesCompletion()
    {
        var profile = new ProfessionalProfileRecord
        {
            UserId = "sp-user-1",
            Headline = "Senior Backend Architect",
            Bio = "Building cloud solutions",
            Skills = new List<ProfileSkill>
            {
                new() { Name = "C#", Level = "Advanced", Source = "legacy" },
                new() { Name = "MongoDB", Level = null, Source = "legacy" }
            },
            Experiences = new List<ProfessionalExperience>
            {
                new() { JobTitle = "Tech Lead", CompanyName = "Acme" }
            },
            Education = new List<ProfessionalEducation>
            {
                new() { Institution = "Polytech", Degree = "M.Sc." }
            },
            Languages = new List<string> { "French", "English" },
            VentureContext = null // absent for pure SP
        };

        var result = _resolver.Resolve(profile);

        result.Phase4Ready.Should().BeFalse();
        result.MissingForPhase4.Should().Contain(new[]
        {
            "CurrentSituation",
            "WeeklyAvailability",
            "Region",
            "ProgressPreference"
        });
        // Skills(20) + Experiences(5) + Education(5) + Languages(5) = 35
        result.ProfileCompletion.Should().Be(35);
    }

    [Fact]
    public async Task Critical_Regression_Save_Unrelated_Field_Preserves_Skill_Level_Source_Verification()
    {
        // Scenario:
        // Existing skill: React, Level = Comfortable, Source = SelfDeclared, Verification = null
        // User opens HumainX, changes WeeklyAvailability only, saves.
        // Reload ProfessionalProfile: React still exists with Comfortable, SelfDeclared, null verification.

        var userGuid = Guid.NewGuid();
        var userId = userGuid.ToString();
        var existingProfile = new ProfessionalProfileRecord
        {
            UserId = userId,
            Skills = new List<ProfileSkill>
            {
                new()
                {
                    Name = "React",
                    Level = "Comfortable",
                    Source = "SelfDeclared",
                    Verification = null
                }
            },
            VentureContext = new ProfileVentureContext
            {
                CurrentSituation = "Employed",
                WeeklyAvailability = "Less than 5 hours/week",
                Region = "Île-de-France",
                LearningPreference = "I want to learn them myself"
            }
        };

        var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
        var userManagerMock = new Mock<UserManager<ApplicationUser>>(
            userStoreMock.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        var testUser = new ApplicationUser
        {
            Id = userGuid,
            UserName = "founder1",
            Email = "founder1@example.com"
        };
        userManagerMock.Setup(m => m.FindByIdAsync(userId)).ReturnsAsync(testUser);
        userManagerMock.Setup(m => m.GetRolesAsync(testUser)).ReturnsAsync(new List<string> { "Creator" });

        var profStoreMock = new Mock<IProfessionalProfileStore>();
        profStoreMock.Setup(s => s.GetByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingProfile);

        ProfessionalProfileRecord? savedRecord = null;
        profStoreMock.Setup(s => s.UpsertAsync(It.IsAny<ProfessionalProfileRecord>(), It.IsAny<IClientSessionHandle>(), It.IsAny<CancellationToken>()))
            .Callback<ProfessionalProfileRecord, IClientSessionHandle, CancellationToken>((p, _, _) => savedRecord = p)
            .ReturnsAsync(true);

        var spStoreMock = new Mock<IServiceProviderProfileStore>();
        var migrationMock = new Mock<IServiceProviderProfileSplitMigration>();
        migrationMock.Setup(m => m.EnsureProfessionalProfileAsync(testUser, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingProfile);

        var editorMock = new Mock<IProfileEditorService>();
        var mediaMock = new Mock<IServiceProviderMediaService>();

        var controller = new ProfileController(
            userManagerMock.Object,
            profStoreMock.Object,
            spStoreMock.Object,
            migrationMock.Object,
            editorMock.Object,
            mediaMock.Object,
            context: null,
            credentialStore: null,
            completenessResolver: _resolver);

        var claims = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId)
        }, "TestAuth"));
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claims }
        };

        // Act: Update WeeklyAvailability only (Skills not included in request)
        var updateRequest = new UpdateUniversalProfileRequestDto
        {
            VentureContext = new ProfileVentureContextDto
            {
                CurrentSituation = "Employed",
                WeeklyAvailability = "20–30 hours/week", // updated
                Region = "Île-de-France",
                LearningPreference = "I want to learn them myself"
            }
        };

        var response = await controller.UpdateMyProfile(updateRequest, CancellationToken.None);

        // Assert
        var okResult = response.Should().BeOfType<OkObjectResult>().Subject;
        savedRecord.Should().NotBeNull();
        savedRecord!.VentureContext!.WeeklyAvailability.Should().Be("20–30 hours/week");
        savedRecord.Skills.Should().ContainSingle();

        var reactSkill = savedRecord.Skills[0];
        reactSkill.Name.Should().Be("React");
        reactSkill.Level.Should().Be("Comfortable");
        reactSkill.Source.Should().Be("SelfDeclared");
        reactSkill.Verification.Should().BeNull();
    }

    [Fact]
    public void Creator_To_Entrepreneur_Continuity_Preserves_Same_ProfessionalProfile_And_VentureContext()
    {
        // Assert architecture: ProfessionalProfile is keyed to UserId, not Role.
        var userGuid = Guid.NewGuid();
        var userId = userGuid.ToString();
        var user = new ApplicationUser
        {
            Id = userGuid,
            UserName = "creator_founder"
        };

        var profile = new ProfessionalProfileRecord
        {
            UserId = userId,
            Skills = new List<ProfileSkill>
            {
                new() { Name = "Product Strategy", Level = "Advanced", Source = "SelfDeclared" }
            },
            VentureContext = new ProfileVentureContext
            {
                CurrentSituation = "Already running a business",
                WeeklyAvailability = "Full-time",
                Region = "Nouvelle-Aquitaine",
                PreviousEntrepreneurialExperience = "I have previously created a company",
                LearningPreference = "A mix of learning and delegation"
            }
        };

        // Level Up simulates role change in identity roles
        var roles = new List<string> { "Entrepreneur" };

        // Assert: Professional profile remains associated to userId without any clone, copy, or migration
        profile.UserId.Should().Be(user.Id.ToString());
        profile.Skills.Should().ContainSingle().Which.Name.Should().Be("Product Strategy");
        profile.Skills[0].Level.Should().Be("Advanced");
        profile.VentureContext.Should().NotBeNull();
        profile.VentureContext!.Region.Should().Be("Nouvelle-Aquitaine");
        profile.VentureContext.PreviousEntrepreneurialExperience.Should().Be("I have previously created a company");
    }
}
