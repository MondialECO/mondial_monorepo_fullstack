using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using WebApp.Controllers;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Models.DatabaseModels.Legal;
using WebApp.Models.Dtos.Ai;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Legal;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Unit;

public class CreatorPhase3RemediationTests
{
    private const string UserId = "user-audit-1";
    private const string IdeaAId = "idea-audit-a";
    private const string IdeaBId = "idea-audit-b";

    private static ControllerContext CreateContext(string userId)
    {
        return new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    new[] { new Claim(ClaimTypes.NameIdentifier, userId) }, "test")),
            },
        };
    }

    [Fact]
    public async Task Section12_UserOwnsIdeaAAndIdeaB_RequestIdeaB_ReturnsIdeaBDataOnly()
    {
        // P3-AUDIT-001: Requesting Section 12 for Idea B must return Idea B's data only
        var mockJourney = new Mock<ICreatorJourneyService>();
        var mockIdeas = new Mock<ICreatorIdeaStore>();

        var ideaB = new CreatorIdea
        {
            Id = IdeaBId,
            UserId = UserId,
            Phase3Data = new CreatorPhase3Data
            {
                LegalAssessment = new CreatorLegalAssessment
                {
                    Jurisdiction = "FR",
                    PlanningReadinessPct = 85.0,
                    Items = new List<CreatorLegalChecklistItem>
                    {
                        new()
                        {
                            Id = "FR-CORP-001",
                            Title = "Statuts Idea B",
                            Category = "corporate",
                            Stage = LegalStages.CompanyCreation,
                            Status = LegalItemStatuses.Completed,
                            EvaluationStatus = ApplicabilityEvaluationStatuses.Applicable
                        }
                    }
                }
            }
        };

        mockIdeas.Setup(x => x.GetOwnedAsync(IdeaBId, UserId)).ReturnsAsync(ideaB);

        var controller = new CreatorPhase3Controller(
            mockJourney.Object,
            Mock.Of<ISpMatchingService>(),
            Mock.Of<IChatService>(),
            Mock.Of<IForecastSessionStore>(),
            Mock.Of<IBusinessPlanSessionStore>(),
            ideas: mockIdeas.Object)
        {
            ControllerContext = CreateContext(UserId),
        };

        var result = await controller.GetBusinessPlanSection12(IdeaBId);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
        var framework = response.Data.Should().BeOfType<LegalRegulatoryFrameworkDto>().Subject;

        framework.Jurisdiction.Should().Be("France");
        framework.PlanningReadinessPercentage.Should().Be(85);
        framework.Subsections.Should().NotBeEmpty();
    }

    [Fact]
    public async Task Section12_UnknownIdeaId_Returns404NotFound_NeverSilentlySubstitutesIdeaA()
    {
        // P3-AUDIT-001: Unknown ideaId must return 404, never fallback to active idea
        var mockJourney = new Mock<ICreatorJourneyService>();
        var mockIdeas = new Mock<ICreatorIdeaStore>();

        mockIdeas.Setup(x => x.GetOwnedAsync("unknown-idea", UserId)).ReturnsAsync((CreatorIdea?)null);

        var controller = new CreatorPhase3Controller(
            mockJourney.Object,
            Mock.Of<ISpMatchingService>(),
            Mock.Of<IChatService>(),
            Mock.Of<IForecastSessionStore>(),
            Mock.Of<IBusinessPlanSessionStore>(),
            ideas: mockIdeas.Object)
        {
            ControllerContext = CreateContext(UserId),
        };

        var result = await controller.GetBusinessPlanSection12("unknown-idea");

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task Section12_UnownedIdeaId_Returns404NotFound()
    {
        // P3-AUDIT-001: Other user's ideaId must return 404
        var mockJourney = new Mock<ICreatorJourneyService>();
        var mockIdeas = new Mock<ICreatorIdeaStore>();

        mockIdeas.Setup(x => x.GetOwnedAsync(IdeaAId, "attacker-user")).ReturnsAsync((CreatorIdea?)null);

        var controller = new CreatorPhase3Controller(
            mockJourney.Object,
            Mock.Of<ISpMatchingService>(),
            Mock.Of<IChatService>(),
            Mock.Of<IForecastSessionStore>(),
            Mock.Of<IBusinessPlanSessionStore>(),
            ideas: mockIdeas.Object)
        {
            ControllerContext = CreateContext("attacker-user"),
        };

        var result = await controller.GetBusinessPlanSection12(IdeaAId);

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task Formation_SoloFounder_Phase4And5Null_RecommendsSasuCleanly()
    {
        // P3-AUDIT-002: Formation recommendation derives from available Phase <= 3 signals
        // Future Phase 4 & 5 are explicitly null
        var journey = new CreatorJourney
        {
            UserId = UserId,
            Project = new CreatorJourneyProject
            {
                Name = "Solo AI Project",
                CreatorEdge = "Experienced solo technical architect",
            },
            Phase3Data = new CreatorPhase3Data
            {
                FormationGenerator = new CreatorFormationGenerator
                {
                    CofounderDraft = null,
                    YouNeed = new List<CreatorSkillGap>()
                }
            },
            Phase4Data = null, // Future phase is NULL
            Phase5Data = null  // Future phase is NULL
        };

        var mockJourney = new Mock<ICreatorJourneyService>();
        mockJourney.Setup(x => x.GetOrCreateComposedAsync(UserId, IdeaAId)).ReturnsAsync(journey);
        mockJourney.Setup(x => x.SetFormationAsync(UserId, It.IsAny<CreatorFormationGenerator>(), IdeaAId))
            .ReturnsAsync((string u, CreatorFormationGenerator f, string id) =>
            {
                journey.Phase3Data.FormationGenerator = f;
                return journey;
            });

        var controller = new CreatorPhase3Controller(
            mockJourney.Object,
            Mock.Of<ISpMatchingService>(),
            Mock.Of<IChatService>(),
            Mock.Of<IForecastSessionStore>(),
            Mock.Of<IBusinessPlanSessionStore>())
        {
            ControllerContext = CreateContext(UserId),
        };

        var result = await controller.GenerateFormation(IdeaAId);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
        var formation = response.Data.Should().BeOfType<CreatorFormationGenerator>().Subject;

        formation.RecommendedType.Should().Be("SAS-U");
        formation.Options.Should().Contain(o => o.Code == "SAS-U");
    }

    [Fact]
    public async Task Formation_MultiFounder_Phase4And5Null_RecommendsSas_NotForcedToSasu()
    {
        // P3-AUDIT-002: Multi-founder signals in Step 3.5 recommend SAS even when Phase 4 and 5 are null
        var journey = new CreatorJourney
        {
            UserId = UserId,
            Project = new CreatorJourneyProject
            {
                Name = "Multi Founder Venture",
                CreatorEdge = "Founding team with commercial and engineering leads",
            },
            Phase3Data = new CreatorPhase3Data
            {
                FormationGenerator = new CreatorFormationGenerator
                {
                    CofounderDraft = new CreatorCofounderDraft
                    {
                        RoleNeeded = "Chief Technology Officer"
                    },
                    YouNeed = new List<CreatorSkillGap>
                    {
                        new() { Label = "Co-founder / Commercial Lead" }
                    }
                }
            },
            Phase4Data = null, // Future phase NULL
            Phase5Data = null  // Future phase NULL
        };

        var mockJourney = new Mock<ICreatorJourneyService>();
        mockJourney.Setup(x => x.GetOrCreateComposedAsync(UserId, IdeaAId)).ReturnsAsync(journey);
        mockJourney.Setup(x => x.SetFormationAsync(UserId, It.IsAny<CreatorFormationGenerator>(), IdeaAId))
            .ReturnsAsync((string u, CreatorFormationGenerator f, string id) =>
            {
                journey.Phase3Data.FormationGenerator = f;
                return journey;
            });

        var controller = new CreatorPhase3Controller(
            mockJourney.Object,
            Mock.Of<ISpMatchingService>(),
            Mock.Of<IChatService>(),
            Mock.Of<IForecastSessionStore>(),
            Mock.Of<IBusinessPlanSessionStore>())
        {
            ControllerContext = CreateContext(UserId),
        };

        var result = await controller.GenerateFormation(IdeaAId);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse>().Subject;
        var formation = response.Data.Should().BeOfType<CreatorFormationGenerator>().Subject;

        // Must recommend multi-founder SAS, NOT SAS-U
        formation.RecommendedType.Should().Be("SAS");
        formation.Options.Should().Contain(o => o.Code == "SAS");
    }
}
