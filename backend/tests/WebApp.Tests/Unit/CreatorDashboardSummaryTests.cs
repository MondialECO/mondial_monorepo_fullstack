using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using WebApp.Controllers;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Legal;
using WebApp.Models.DatabaseModels.Phase4;
using WebApp.Models.Dtos;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Repository;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.Repository.Ai;
using MongoDB.Bson;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class CreatorDashboardSummaryTests
    {
        private readonly Mock<ICreatorJourneyService> _journeysMock = new();
        private readonly Mock<ICreatorIdeaStore> _ideasMock = new();
        private readonly Mock<IBrandKitStore> _brandKitsMock = new();
        private readonly Mock<IProfessionalProfileStore> _profilesMock = new();
        private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
        private readonly CreatorDashboardService _service;

        private const string TestUserId = "user-creator-123";
        private const string OtherUserId = "user-creator-999";
        private const string TestIdeaId = "idea-abc-123";

        public CreatorDashboardSummaryTests()
        {
            var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
            _userManagerMock = new Mock<UserManager<ApplicationUser>>(userStoreMock.Object, null, null, null, null, null, null, null, null);
            _userManagerMock.Setup(u => u.FindByIdAsync(It.IsAny<string>()))
                .ReturnsAsync(new ApplicationUser { Onboarding = new OnboardingState { Phase = 1 } });

            _service = new CreatorDashboardService(
                _journeysMock.Object,
                _ideasMock.Object,
                _brandKitsMock.Object,
                _profilesMock.Object,
                _userManagerMock.Object
            );
        }

        private CreatorJourney CreateBaseJourney(string userId = TestUserId, string ideaId = TestIdeaId)
        {
            return new CreatorJourney
            {
                Id = "journey-1",
                UserId = userId,
                ActiveIdeaId = ideaId,
                BusinessIdeaId = ideaId,
                Project = new CreatorJourneyProject
                {
                    Name = "EcoPackaging",
                    Tagline = "Sustainable boxes",
                    Concept = "Biodegradable industrial packaging",
                    Sector = "Manufacturing",
                    Category = "Eco-Tech"
                },
                Phase2Data = new CreatorPhase2Data(),
                Phase3Data = new CreatorPhase3Data(),
                Phase4Data = new CreatorPhase4Data(),
                Phase5Data = new CreatorPhase5Data(),
                UpdatedAt = DateTime.UtcNow
            };
        }

        [Fact]
        public async Task NewCreator_ShowsPhase2NextAction()
        {
            // Arrange
            var journey = CreateBaseJourney();
            var idea = new CreatorIdea { Id = TestIdeaId, UserId = TestUserId, Project = journey.Project };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(TestUserId, TestIdeaId))
                .ReturnsAsync(journey);
            _ideasMock.Setup(i => i.GetOwnedAsync(TestIdeaId, TestUserId))
                .ReturnsAsync(idea);

            var computed = new ComputedJourneyStatus
            {
                Phase1 = new ComputedPhaseStatus { Status = "completed" },
                Phase2 = new ComputedPhaseStatus { Status = "in_progress", CurrentStep = 1 }
            };
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, It.IsAny<bool>()))
                .ReturnsAsync(computed);

            // Act
            var summary = await _service.GetSummaryAsync(TestUserId, TestIdeaId);

            // Assert
            summary.Should().NotBeNull();
            summary.Project.Name.Should().Be("EcoPackaging");
            summary.NextAction.Should().NotBeNull();
            summary.NextAction.Phase.Should().Be(2);
            summary.NextAction.Href.Should().Contain("/phase-2");
            summary.Journey.CurrentPhase.Should().Be(2);

            // No fake premature Phase 4/5 outputs
            summary.Results.Should().NotContain(r => r.Phase >= 4);
        }

        [Fact]
        public async Task Phase2BrandComplete_ShowsBrandResult()
        {
            // Arrange
            var journey = CreateBaseJourney();
            var idea = new CreatorIdea { Id = TestIdeaId, UserId = TestUserId, Project = journey.Project };

            var brandKit = new BrandKit
            {
                Id = "brandkit-1",
                IdeaId = TestIdeaId,
                UserId = TestUserId,
                Status = "complete",
                Logo = new BrandLogo
                {
                    Variations = new Dictionary<string, BrandLogoVariation>
                    {
                        { BrandLogoVariationKeys.Primary, new BrandLogoVariation { SvgUri = "/uploads/logo.svg" } }
                    }
                },
                Colors = new BrandColors
                {
                    Roles = new List<BrandColorRole>
                    {
                        new() { RoleName = "Primary", Hex = "#10B981" }
                    }
                }
            };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(TestUserId, TestIdeaId))
                .ReturnsAsync(journey);
            _ideasMock.Setup(i => i.GetOwnedAsync(TestIdeaId, TestUserId))
                .ReturnsAsync(idea);
            _brandKitsMock.Setup(b => b.GetByIdeaIdAsync(TestIdeaId, TestUserId))
                .ReturnsAsync(brandKit);

            var computed = new ComputedJourneyStatus
            {
                Phase2 = new ComputedPhaseStatus { Status = "completed", CurrentStep = 4 },
                Phase3 = new ComputedPhaseStatus { Status = "in_progress", CurrentStep = 1 }
            };
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, It.IsAny<bool>()))
                .ReturnsAsync(computed);

            // Act
            var summary = await _service.GetSummaryAsync(TestUserId, TestIdeaId);

            // Assert
            summary.Project.Brand.HasBrandKit.Should().BeTrue();
            summary.Project.Brand.Status.Should().Be("complete");
            summary.Project.Brand.LogoAsset.Should().Be("/uploads/logo.svg");
            summary.Results.Should().ContainSingle(r => r.Key == "brand_identity" && r.Status == "Ready");
        }

        [Fact]
        public async Task MidPhase3_ShowsCorrectNextStage()
        {
            // Arrange
            var journey = CreateBaseJourney();
            journey.Phase3Data.MarketStudySessionId = "session-market-1";
            var idea = new CreatorIdea { Id = TestIdeaId, UserId = TestUserId, Project = journey.Project };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(TestUserId, TestIdeaId))
                .ReturnsAsync(journey);
            _ideasMock.Setup(i => i.GetOwnedAsync(TestIdeaId, TestUserId))
                .ReturnsAsync(idea);

            var computed = new ComputedJourneyStatus
            {
                Phase1 = new ComputedPhaseStatus { Status = "completed" },
                Phase2 = new ComputedPhaseStatus { Status = "completed", CurrentStep = 4 },
                Phase3 = new ComputedPhaseStatus { Status = "in_progress", CurrentStep = 2 }
            };
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, It.IsAny<bool>()))
                .ReturnsAsync(computed);

            // Act
            var summary = await _service.GetSummaryAsync(TestUserId, TestIdeaId);

            // Assert
            summary.NextAction.Should().NotBeNull();
            summary.NextAction.Phase.Should().Be(3);
            summary.NextAction.Stage.Should().Be("3.2");
            summary.NextAction.Href.Should().Contain("/phase-3/business-model");
            summary.Results.Should().ContainSingle(r => r.Key == "market_intelligence");
        }

        [Fact]
        public async Task LegalNeedsReview_ShowsAttention()
        {
            // Arrange
            var journey = CreateBaseJourney();
            journey.Phase3Data.LegalAssessment = new CreatorLegalAssessment
            {
                IsPotentiallyOutdated = true
            };
            var idea = new CreatorIdea { Id = TestIdeaId, UserId = TestUserId, Project = journey.Project };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(TestUserId, TestIdeaId))
                .ReturnsAsync(journey);
            _ideasMock.Setup(i => i.GetOwnedAsync(TestIdeaId, TestUserId))
                .ReturnsAsync(idea);

            var computed = new ComputedJourneyStatus
            {
                Phase2 = new ComputedPhaseStatus { Status = "completed", CurrentStep = 4 },
                Phase3 = new ComputedPhaseStatus { Status = "in_progress", CurrentStep = 4 }
            };
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, It.IsAny<bool>()))
                .ReturnsAsync(computed);

            // Act
            var summary = await _service.GetSummaryAsync(TestUserId, TestIdeaId);

            // Assert
            summary.AttentionItems.Should().Contain(a => a.Type == "LEGAL_UPDATE" && a.Href.Contains("/phase-3/compliance"));
        }

        [Fact]
        public async Task Phase3Complete_ShowsStartConstruction()
        {
            // Arrange
            var journey = CreateBaseJourney();
            var idea = new CreatorIdea { Id = TestIdeaId, UserId = TestUserId, Project = journey.Project };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(TestUserId, TestIdeaId))
                .ReturnsAsync(journey);
            _ideasMock.Setup(i => i.GetOwnedAsync(TestIdeaId, TestUserId))
                .ReturnsAsync(idea);

            var computed = new ComputedJourneyStatus
            {
                Phase1 = new ComputedPhaseStatus { Status = "completed" },
                Phase2 = new ComputedPhaseStatus { Status = "completed", CurrentStep = 4 },
                Phase3 = new ComputedPhaseStatus { Status = "completed", CurrentStep = 7 },
                Phase4 = new ComputedPhaseStatus { Status = "available", CurrentStep = 1 }
            };
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, It.IsAny<bool>()))
                .ReturnsAsync(computed);

            // Act
            var summary = await _service.GetSummaryAsync(TestUserId, TestIdeaId);

            // Assert
            summary.NextAction.Should().NotBeNull();
            summary.NextAction.Phase.Should().Be(4);
            summary.NextAction.Stage.Should().Be("4.1");
            summary.NextAction.Title.Should().Contain("Construction Snapshot");
            summary.NextAction.Href.Should().Be($"/dashboard/creator/phase-4?ideaId={TestIdeaId}");
            summary.NextAction.Href.Should().NotContain("construction-snapshot");
        }

        [Fact]
        public async Task MidPhase4_UsesRoadmapNextBestAction()
        {
            // Arrange
            var journey = CreateBaseJourney();
            journey.Phase4Data.ConstructionSnapshot = new ConstructionSnapshot { Status = "Completed" };
            journey.Phase4Data.Roadmap = new OperationalRoadmap
            {
                Status = "Active",
                NextBestAction = new NextBestAction
                {
                    TaskKey = "mkt.pilot-interview",
                    Title = "Conduct 5 Customer Discovery Calls",
                    WhyNow = "Validates the primary value proposition before finalizing pricing tiers."
                }
            };
            var idea = new CreatorIdea { Id = TestIdeaId, UserId = TestUserId, Project = journey.Project };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(TestUserId, TestIdeaId))
                .ReturnsAsync(journey);
            _ideasMock.Setup(i => i.GetOwnedAsync(TestIdeaId, TestUserId))
                .ReturnsAsync(idea);

            var computed = new ComputedJourneyStatus
            {
                Phase1 = new ComputedPhaseStatus { Status = "completed" },
                Phase2 = new ComputedPhaseStatus { Status = "completed", CurrentStep = 4 },
                Phase3 = new ComputedPhaseStatus { Status = "completed", CurrentStep = 7 },
                Phase4 = new ComputedPhaseStatus { Status = "in_progress", CurrentStep = 3 }
            };
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, It.IsAny<bool>()))
                .ReturnsAsync(computed);

            // Act
            var summary = await _service.GetSummaryAsync(TestUserId, TestIdeaId);

            // Assert
            summary.NextAction.Should().NotBeNull();
            summary.NextAction.Phase.Should().Be(4);
            summary.NextAction.Stage.Should().Be("4.2");
            summary.NextAction.Title.Should().Be("Conduct 5 Customer Discovery Calls");
            summary.NextAction.Description.Should().Be("Validates the primary value proposition before finalizing pricing tiers.");
        }

        [Fact]
        public async Task Phase4Stale_ShowsAttention()
        {
            // Arrange
            var journey = CreateBaseJourney();
            journey.Phase4Data.PricingStrategy = new PricingStrategy
            {
                Status = PricingStatus.Stale
            };
            var idea = new CreatorIdea { Id = TestIdeaId, UserId = TestUserId, Project = journey.Project };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(TestUserId, TestIdeaId))
                .ReturnsAsync(journey);
            _ideasMock.Setup(i => i.GetOwnedAsync(TestIdeaId, TestUserId))
                .ReturnsAsync(idea);

            var computed = new ComputedJourneyStatus
            {
                Phase4 = new ComputedPhaseStatus { Status = "in_progress", CurrentStep = 6 }
            };
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, It.IsAny<bool>()))
                .ReturnsAsync(computed);

            // Act
            var summary = await _service.GetSummaryAsync(TestUserId, TestIdeaId);

            // Assert
            summary.AttentionItems.Should().Contain(a => a.Type == "STALE_BLOCKING_DEPENDENCY" && a.Href.Contains("/phase-4/pricing"));
        }

        [Fact]
        public async Task Phase4Incomplete_DoesNotEnablePhase5()
        {
            // Arrange
            var journey = CreateBaseJourney();
            var idea = new CreatorIdea { Id = TestIdeaId, UserId = TestUserId, Project = journey.Project };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(TestUserId, TestIdeaId))
                .ReturnsAsync(journey);
            _ideasMock.Setup(i => i.GetOwnedAsync(TestIdeaId, TestUserId))
                .ReturnsAsync(idea);

            var computed = new ComputedJourneyStatus
            {
                Phase4 = new ComputedPhaseStatus { Status = "in_progress", CurrentStep = 4 },
                Phase5 = new ComputedPhaseStatus { Status = "locked", CurrentStep = 1 }
            };
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, It.IsAny<bool>()))
                .ReturnsAsync(computed);

            // Act
            var summary = await _service.GetSummaryAsync(TestUserId, TestIdeaId);

            // Assert
            summary.Phase5.IsUnlocked.Should().BeFalse();
            summary.Phase5.Status.Should().Be("locked");
        }

        [Fact]
        public async Task Phase4Complete_EnablesPhase5()
        {
            // Arrange
            var journey = CreateBaseJourney();
            journey.Phase4Data.ConstructionSnapshot = new ConstructionSnapshot
            {
                Status = "Completed",
                GeneratedAt = DateTime.UtcNow,
                Categories = new List<string> { "tech" }
            };
            journey.Phase4Data.Roadmap = new OperationalRoadmap
            {
                Status = "Active",
                GeneratedAt = DateTime.UtcNow,
                Stages = new List<RoadmapStageGroup>()
            };
            journey.Phase4Data.NeedsAnalysis = new NeedsAnalysis
            {
                Status = "Completed",
                GeneratedAt = DateTime.UtcNow,
                CountsByCategory = new Dictionary<string, int>()
            };
            journey.Phase4Data.SkillsPlan = new SkillsPlan
            {
                Status = "Completed",
                GeneratedAt = DateTime.UtcNow,
                Resolutions = new List<CapabilityResolution>(),
                CoveredCapabilities = new List<CoveredCapability>()
            };
            journey.Phase4Data.SupportPlan = new SupportPlan
            {
                Status = "Confirmed",
                GeneratedAt = DateTime.UtcNow,
                Summary = new SupportPlanSummary()
            };
            journey.Phase4Data.PricingStrategy = new PricingStrategy
            {
                Status = PricingStatus.Generated,
                GeneratedAt = DateTime.UtcNow,
                Offers = new List<PricingOffer>()
            };
            journey.Phase4Data.GtmStrategy = new GtmStrategy
            {
                Status = "Valid",
                GeneratedAt = DateTime.UtcNow,
                SegmentStrategies = new List<GtmSegmentStrategy>(),
                LaunchPlan = new GtmLaunchPlan()
            };
            journey.Phase4Data.LaunchAssets = new LaunchAssetsPlan
            {
                Version = 1,
                Status = "Draft",
                LastGeneratedAt = DateTime.UtcNow
            };
            journey.Phase4Data.ConstructionReadiness = new ConstructionReadinessReview
            {
                Status = "Ready for construction",
                ReviewedAt = DateTime.UtcNow
            };

            var idea = new CreatorIdea { Id = TestIdeaId, UserId = TestUserId, Project = journey.Project };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(TestUserId, TestIdeaId))
                .ReturnsAsync(journey);
            _ideasMock.Setup(i => i.GetOwnedAsync(TestIdeaId, TestUserId))
                .ReturnsAsync(idea);

            var computed = new ComputedJourneyStatus
            {
                Phase1 = new ComputedPhaseStatus { Status = "completed" },
                Phase2 = new ComputedPhaseStatus { Status = "completed", CurrentStep = 4 },
                Phase3 = new ComputedPhaseStatus { Status = "completed", CurrentStep = 7 },
                Phase4 = new ComputedPhaseStatus { Status = "completed", CurrentStep = 10 },
                Phase5 = new ComputedPhaseStatus { Status = "available", CurrentStep = 1 }
            };
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, It.IsAny<bool>()))
                .ReturnsAsync(computed);

            // Act
            var summary = await _service.GetSummaryAsync(TestUserId, TestIdeaId);

            // Assert
            summary.Phase5.IsUnlocked.Should().BeTrue();
            summary.Phase5.Href.Should().Contain("/dashboard/creator/crossroads");
            // Creator MVP: When Phase 4 is complete, next action promotes review of launch preparation
            summary.NextAction.Phase.Should().Be(4);
            summary.NextAction.Title.Should().Be("Review your launch preparation");
            summary.NextAction.Href.Should().Be($"/dashboard/creator/phase-4?ideaId={TestIdeaId}");
        }

        [Fact]
        public async Task Dashboard_DisplaysAllNineStepsInPhase4()
        {
            // Arrange
            var journey = CreateBaseJourney();
            var idea = new CreatorIdea { Id = TestIdeaId, UserId = TestUserId, Project = journey.Project };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(TestUserId, TestIdeaId))
                .ReturnsAsync(journey);
            _ideasMock.Setup(i => i.GetOwnedAsync(TestIdeaId, TestUserId))
                .ReturnsAsync(idea);

            var computed = new ComputedJourneyStatus
            {
                Phase4 = new ComputedPhaseStatus { Status = "in_progress", CurrentStep = 2 }
            };
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, It.IsAny<bool>()))
                .ReturnsAsync(computed);

            // Act
            var summary = await _service.GetSummaryAsync(TestUserId, TestIdeaId);

            // Assert
            var p4Milestone = summary.Journey.Phases.Find(p => p.PhaseNumber == 4);
            p4Milestone.Should().NotBeNull();
            p4Milestone.TotalSteps.Should().Be(9);
            p4Milestone.SubstageProgress.Should().Contain(s => s.Key == "4.8");
            p4Milestone.SubstageProgress.Should().Contain(s => s.Key == "4.9");
        }

        [Fact]
        public async Task Ownership_RejectsOtherUsersProject()
        {
            // Arrange: Idea owned by OtherUserId, called by TestUserId
            _ideasMock.Setup(i => i.GetOwnedAsync(TestIdeaId, TestUserId))
                .ReturnsAsync((CreatorIdea?)null);

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _service.GetSummaryAsync(TestUserId, TestIdeaId));
        }

        [Fact]
        public async Task Controller_RejectsNonCreator()
        {
            // Arrange
            var controller = new CreatorDashboardController(_service, _userManagerMock.Object);
            var user = new ApplicationUser { Id = Guid.NewGuid(), UserName = "investor@mondial.eco" };

            var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, user.Id.ToString()) };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };

            _userManagerMock.Setup(u => u.FindByIdAsync(user.Id.ToString()))
                .ReturnsAsync(user);
            _userManagerMock.Setup(u => u.GetRolesAsync(user))
                .ReturnsAsync(new List<string> { "Investor" });

            // Act
            var result = await controller.GetSummary();

            // Assert
            result.Result.Should().BeOfType<ForbidResult>();
        }

        [Fact]
        public async Task Controller_ReturnsSummaryForCreator()
        {
            // Arrange
            var controller = new CreatorDashboardController(_service, _userManagerMock.Object);
            var user = new ApplicationUser { Id = Guid.NewGuid(), UserName = "creator@mondial.eco" };

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new(ClaimTypes.Role, "Creator")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };

            _userManagerMock.Setup(u => u.FindByIdAsync(user.Id.ToString()))
                .ReturnsAsync(user);
            _userManagerMock.Setup(u => u.GetRolesAsync(user))
                .ReturnsAsync(new List<string> { "Creator" });

            var journey = CreateBaseJourney(user.Id.ToString());
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(user.Id.ToString(), null))
                .ReturnsAsync(journey);
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, It.IsAny<bool>()))
                .ReturnsAsync(new ComputedJourneyStatus());

            // Act
            var result = await controller.GetSummary();

            // Assert
            var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
            var summary = okResult.Value.Should().BeOfType<CreatorDashboardSummaryDto>().Subject;
            summary.Should().NotBeNull();
        }

        [Fact]
        public async Task Controller_RejectsAnonymous()
        {
            // Arrange
            var controller = new CreatorDashboardController(_service, _userManagerMock.Object);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity()) }
            };

            // Act
            var result = await controller.GetSummary();

            // Assert
            result.Result.Should().BeOfType<UnauthorizedObjectResult>();
        }

        [Fact]
        public async Task Controller_RejectsOtherUsersIdea()
        {
            // Arrange
            var controller = new CreatorDashboardController(_service, _userManagerMock.Object);
            var user = new ApplicationUser { Id = Guid.NewGuid(), UserName = "creator@mondial.eco" };

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new(ClaimTypes.Role, "Creator")
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);

            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };

            _userManagerMock.Setup(u => u.FindByIdAsync(user.Id.ToString()))
                .ReturnsAsync(user);
            _userManagerMock.Setup(u => u.GetRolesAsync(user))
                .ReturnsAsync(new List<string> { "Creator" });

            // Idea owned by someone else
            _ideasMock.Setup(i => i.GetOwnedAsync("unowned-idea", user.Id.ToString()))
                .ReturnsAsync((CreatorIdea?)null);

            // Act
            var result = await controller.GetSummary("unowned-idea");

            // Assert
            result.Result.Should().BeOfType<ForbidResult>();
        }

        [Fact]
        public async Task Roadmap_Active_IsVisible()
        {
            // Arrange
            var journey = CreateBaseJourney();
            var idea = new CreatorIdea { Id = TestIdeaId, UserId = TestUserId, Project = journey.Project };
            journey.Phase4Data.Roadmap = new OperationalRoadmap
            {
                Status = "Active",
                GeneratedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Stages = new List<RoadmapStageGroup>()
            };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(TestUserId, TestIdeaId))
                .ReturnsAsync(journey);
            _ideasMock.Setup(i => i.GetOwnedAsync(TestIdeaId, TestUserId))
                .ReturnsAsync(idea);
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, It.IsAny<bool>()))
                .ReturnsAsync(new ComputedJourneyStatus());

            // Act
            var summary = await _service.GetSummaryAsync(TestUserId, TestIdeaId);

            // Assert
            summary.Results.Should().ContainSingle(r => r.Key == "operational_roadmap" && r.Status == "Ready");
        }

        [Fact]
        public async Task Skills_ZeroGaps_IsVisibleAsResolved()
        {
            // Arrange
            var journey = CreateBaseJourney();
            var idea = new CreatorIdea { Id = TestIdeaId, UserId = TestUserId, Project = journey.Project };
            journey.Phase4Data.SkillsPlan = new SkillsPlan
            {
                Status = "Completed",
                GeneratedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Resolutions = new List<CapabilityResolution>(),
                CoveredCapabilities = new List<CoveredCapability> { new() { Capability = "Leadership" } }
            };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(TestUserId, TestIdeaId))
                .ReturnsAsync(journey);
            _ideasMock.Setup(i => i.GetOwnedAsync(TestIdeaId, TestUserId))
                .ReturnsAsync(idea);
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, It.IsAny<bool>()))
                .ReturnsAsync(new ComputedJourneyStatus());

            // Act
            var summary = await _service.GetSummaryAsync(TestUserId, TestIdeaId);

            // Assert
            summary.Results.Should().ContainSingle(r => r.Key == "skills_plan" && r.Status == "Ready");
        }

        [Fact]
        public async Task Support_ZeroMatches_IsVisibleAsResolved()
        {
            // Arrange
            var journey = CreateBaseJourney();
            var idea = new CreatorIdea { Id = TestIdeaId, UserId = TestUserId, Project = journey.Project };
            journey.Phase4Data.SupportPlan = new SupportPlan
            {
                Status = "Generated",
                GeneratedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Matches = new List<SupportMatch>(),
                Summary = new SupportPlanSummary { TotalEvaluatedCount = 10, EligibleCount = 0 }
            };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(TestUserId, TestIdeaId))
                .ReturnsAsync(journey);
            _ideasMock.Setup(i => i.GetOwnedAsync(TestIdeaId, TestUserId))
                .ReturnsAsync(idea);
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, It.IsAny<bool>()))
                .ReturnsAsync(new ComputedJourneyStatus());

            // Act
            var summary = await _service.GetSummaryAsync(TestUserId, TestIdeaId);

            // Assert
            summary.Results.Should().ContainSingle(r => r.Key == "support_plan" && r.Status == "Ready");
        }

        [Fact]
        public async Task Pricing_NeedsValidation_IsVisibleButNotReady()
        {
            // Arrange
            var journey = CreateBaseJourney();
            var idea = new CreatorIdea { Id = TestIdeaId, UserId = TestUserId, Project = journey.Project };
            journey.Phase4Data.PricingStrategy = new PricingStrategy
            {
                Status = PricingStatus.NeedsValidation,
                GeneratedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Offers = new List<PricingOffer> { new() { Key = "offer-1", Name = "Pro Plan" } }
            };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(TestUserId, TestIdeaId))
                .ReturnsAsync(journey);
            _ideasMock.Setup(i => i.GetOwnedAsync(TestIdeaId, TestUserId))
                .ReturnsAsync(idea);
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, It.IsAny<bool>()))
                .ReturnsAsync(new ComputedJourneyStatus());

            // Act
            var summary = await _service.GetSummaryAsync(TestUserId, TestIdeaId);

            // Assert
            var result = summary.Results.Should().ContainSingle(r => r.Key == "pricing_strategy").Subject;
            result.Status.Should().Be("Needs Validation");
            result.Status.Should().NotBe("Ready");
        }

        [Fact]
        public async Task Gtm_NonDraft_IsVisibleWithCanonicalStatus()
        {
            // Arrange
            var journey = CreateBaseJourney();
            var idea = new CreatorIdea { Id = TestIdeaId, UserId = TestUserId, Project = journey.Project };
            journey.Phase4Data.GtmStrategy = new GtmStrategy
            {
                Status = "Valid",
                GeneratedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                SegmentStrategies = new List<GtmSegmentStrategy>(),
                LaunchPlan = new GtmLaunchPlan()
            };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(TestUserId, TestIdeaId))
                .ReturnsAsync(journey);
            _ideasMock.Setup(i => i.GetOwnedAsync(TestIdeaId, TestUserId))
                .ReturnsAsync(idea);
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, It.IsAny<bool>()))
                .ReturnsAsync(new ComputedJourneyStatus());

            // Act
            var summary = await _service.GetSummaryAsync(TestUserId, TestIdeaId);

            // Assert
            summary.Results.Should().ContainSingle(r => r.Key == "gtm_strategy" && r.Status == "Ready");
        }

        [Fact]
        public async Task StalePhase4Result_ShowsUpdateAvailable()
        {
            // Arrange
            var journey = CreateBaseJourney();
            var idea = new CreatorIdea { Id = TestIdeaId, UserId = TestUserId, Project = journey.Project };
            journey.Phase4Data.ConstructionSnapshot = new ConstructionSnapshot
            {
                Status = "Stale",
                GeneratedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Categories = new List<string> { "Finance" }
            };
            journey.Phase4Data.Roadmap = new OperationalRoadmap
            {
                Status = "Stale",
                GeneratedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Stages = new List<RoadmapStageGroup>()
            };
            journey.Phase4Data.PricingStrategy = new PricingStrategy
            {
                Status = PricingStatus.Stale,
                GeneratedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Offers = new List<PricingOffer>()
            };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(TestUserId, TestIdeaId))
                .ReturnsAsync(journey);
            _ideasMock.Setup(i => i.GetOwnedAsync(TestIdeaId, TestUserId))
                .ReturnsAsync(idea);
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, It.IsAny<bool>()))
                .ReturnsAsync(new ComputedJourneyStatus());

            // Act
            var summary = await _service.GetSummaryAsync(TestUserId, TestIdeaId);

            // Assert
            var snapshotRes = summary.Results.Should().ContainSingle(r => r.Key == "construction_snapshot").Subject;
            snapshotRes.Status.Should().Be("Update Available");
            snapshotRes.IsStale.Should().BeTrue();

            var roadmapRes = summary.Results.Should().ContainSingle(r => r.Key == "operational_roadmap").Subject;
            roadmapRes.Status.Should().Be("Update Available");
            roadmapRes.IsStale.Should().BeTrue();

            var pricingRes = summary.Results.Should().ContainSingle(r => r.Key == "pricing_strategy").Subject;
            pricingRes.Status.Should().Be("Update Available");
            pricingRes.IsStale.Should().BeTrue();
        }

        [Fact]
        public async Task Phase4Incomplete_CanStillShowExistingResults()
        {
            // Arrange
            var journey = CreateBaseJourney();
            var idea = new CreatorIdea { Id = TestIdeaId, UserId = TestUserId, Project = journey.Project };
            // Snapshot & Roadmap completed, but other 5 stages unresolved
            journey.Phase4Data.ConstructionSnapshot = new ConstructionSnapshot
            {
                Status = "Completed",
                GeneratedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Categories = new List<string> { "Business" }
            };
            journey.Phase4Data.Roadmap = new OperationalRoadmap
            {
                Status = "Active",
                GeneratedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Stages = new List<RoadmapStageGroup>()
            };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(TestUserId, TestIdeaId))
                .ReturnsAsync(journey);
            _ideasMock.Setup(i => i.GetOwnedAsync(TestIdeaId, TestUserId))
                .ReturnsAsync(idea);
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, It.IsAny<bool>()))
                .ReturnsAsync(new ComputedJourneyStatus());

            // Act
            var summary = await _service.GetSummaryAsync(TestUserId, TestIdeaId);

            // Assert
            // Existing stage results are visible
            summary.Results.Should().Contain(r => r.Key == "construction_snapshot" && r.Status == "Ready");
            summary.Results.Should().Contain(r => r.Key == "operational_roadmap" && r.Status == "Ready");
            // Phase 5 is locked because overall Phase 4 is incomplete
            summary.Phase5.IsUnlocked.Should().BeFalse();
        }

        [Fact]
        public async Task Phase4JourneyOverview_ContainsAllNineCanonicalSubstages_WithTotalStepsNine()
        {
            // Arrange
            var journey = CreateBaseJourney();
            var idea = new CreatorIdea { Id = TestIdeaId, UserId = TestUserId, Project = journey.Project };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(TestUserId, TestIdeaId))
                .ReturnsAsync(journey);
            _ideasMock.Setup(i => i.GetOwnedAsync(TestIdeaId, TestUserId))
                .ReturnsAsync(idea);
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, It.IsAny<bool>()))
                .ReturnsAsync(new ComputedJourneyStatus
                {
                    Phase1 = new ComputedPhaseStatus { Status = "completed" },
                    Phase2 = new ComputedPhaseStatus { Status = "completed" },
                    Phase3 = new ComputedPhaseStatus { Status = "completed" },
                    Phase4 = new ComputedPhaseStatus { Status = "in_progress", CurrentStep = 1 }
                });

            // Act
            var summary = await _service.GetSummaryAsync(TestUserId, TestIdeaId);

            // Assert
            var p4Phase = summary.Journey.Phases.Should().ContainSingle(p => p.PhaseNumber == 4).Subject;
            p4Phase.TotalSteps.Should().Be(9);
            p4Phase.SubstageProgress.Should().HaveCount(9);
            p4Phase.SubstageProgress.Select(s => s.Key).Should().Equal(new[]
            {
                "4.1", "4.2", "4.3", "4.4", "4.5", "4.6", "4.7", "4.8", "4.9"
            });
            p4Phase.SubstageProgress.Select(s => s.Label).Should().Equal(new[]
            {
                "Snapshot", "Roadmap", "Needs", "Skills", "Support", "Pricing", "GTM", "Launch Assets", "Readiness"
            });
            // Verify Snapshot substage uses canonical /phase-4 href with idea context
            p4Phase.SubstageProgress.First(s => s.Key == "4.1").Href.Should().Be($"/dashboard/creator/phase-4?ideaId={TestIdeaId}");
            p4Phase.SubstageProgress.First(s => s.Key == "4.8").Href.Should().Be($"/dashboard/creator/phase-4/launch-assets?ideaId={TestIdeaId}");
            p4Phase.SubstageProgress.First(s => s.Key == "4.9").Href.Should().Be($"/dashboard/creator/phase-4/readiness?ideaId={TestIdeaId}");
        }

        [Fact]
        public async Task GtmComplete_WithLaunchAssetsAndReadinessUnfinished_GuidesToLaunchAssets()
        {
            // Arrange
            var journey = CreateBaseJourney();
            var idea = new CreatorIdea { Id = TestIdeaId, UserId = TestUserId, Project = journey.Project };
            // Stages 1 through 7 resolved, 8 and 9 unresolved
            journey.Phase4Data.ConstructionSnapshot = new ConstructionSnapshot { Status = "Completed", GeneratedAt = DateTime.UtcNow, Categories = new List<string> { "all" } };
            journey.Phase4Data.Roadmap = new OperationalRoadmap { Status = "Active", GeneratedAt = DateTime.UtcNow, Stages = new List<RoadmapStageGroup>() };
            journey.Phase4Data.NeedsAnalysis = new NeedsAnalysis { Status = "Completed", GeneratedAt = DateTime.UtcNow, CountsByCategory = new Dictionary<string, int> { { "ops", 1 } } };
            journey.Phase4Data.SkillsPlan = new SkillsPlan { Status = "Completed", GeneratedAt = DateTime.UtcNow, Resolutions = new List<CapabilityResolution>(), CoveredCapabilities = new List<CoveredCapability>() };
            journey.Phase4Data.SupportPlan = new SupportPlan { Status = "Generated", GeneratedAt = DateTime.UtcNow, Summary = new SupportPlanSummary() };
            journey.Phase4Data.PricingStrategy = new PricingStrategy { Status = PricingStatus.Generated, GeneratedAt = DateTime.UtcNow, Offers = new List<PricingOffer> { new() } };
            journey.Phase4Data.GtmStrategy = new GtmStrategy { Status = "Valid", GeneratedAt = DateTime.UtcNow, SegmentStrategies = new List<GtmSegmentStrategy>(), LaunchPlan = new GtmLaunchPlan() };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(TestUserId, TestIdeaId))
                .ReturnsAsync(journey);
            _ideasMock.Setup(i => i.GetOwnedAsync(TestIdeaId, TestUserId))
                .ReturnsAsync(idea);
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, It.IsAny<bool>()))
                .ReturnsAsync(new ComputedJourneyStatus
                {
                    Phase1 = new ComputedPhaseStatus { Status = "completed" },
                    Phase2 = new ComputedPhaseStatus { Status = "completed" },
                    Phase3 = new ComputedPhaseStatus { Status = "completed" },
                    Phase4 = new ComputedPhaseStatus { Status = "in_progress", CurrentStep = 8 }
                });

            // Act
            var summary = await _service.GetSummaryAsync(TestUserId, TestIdeaId);

            // Assert
            summary.NextAction.Should().NotBeNull();
            summary.NextAction.Phase.Should().Be(4);
            summary.NextAction.Stage.Should().Be("4.8");
            summary.NextAction.Type.Should().Be("phase_4_launch_assets");
            summary.NextAction.Href.Should().Be($"/dashboard/creator/phase-4/launch-assets?ideaId={TestIdeaId}");
            summary.Phase5.IsUnlocked.Should().BeFalse();
        }

        [Fact]
        public async Task LaunchAssetsComplete_WithReadinessUnfinished_GuidesToReadiness()
        {
            // Arrange
            var journey = CreateBaseJourney();
            var idea = new CreatorIdea { Id = TestIdeaId, UserId = TestUserId, Project = journey.Project };
            // Stages 1 through 8 resolved, 9 unresolved
            journey.Phase4Data.ConstructionSnapshot = new ConstructionSnapshot { Status = "Completed", GeneratedAt = DateTime.UtcNow, Categories = new List<string> { "all" } };
            journey.Phase4Data.Roadmap = new OperationalRoadmap { Status = "Active", GeneratedAt = DateTime.UtcNow, Stages = new List<RoadmapStageGroup>() };
            journey.Phase4Data.NeedsAnalysis = new NeedsAnalysis { Status = "Completed", GeneratedAt = DateTime.UtcNow, CountsByCategory = new Dictionary<string, int> { { "ops", 1 } } };
            journey.Phase4Data.SkillsPlan = new SkillsPlan { Status = "Completed", GeneratedAt = DateTime.UtcNow, Resolutions = new List<CapabilityResolution>(), CoveredCapabilities = new List<CoveredCapability>() };
            journey.Phase4Data.SupportPlan = new SupportPlan { Status = "Generated", GeneratedAt = DateTime.UtcNow, Summary = new SupportPlanSummary() };
            journey.Phase4Data.PricingStrategy = new PricingStrategy { Status = PricingStatus.Generated, GeneratedAt = DateTime.UtcNow, Offers = new List<PricingOffer> { new() } };
            journey.Phase4Data.GtmStrategy = new GtmStrategy { Status = "Valid", GeneratedAt = DateTime.UtcNow, SegmentStrategies = new List<GtmSegmentStrategy>(), LaunchPlan = new GtmLaunchPlan() };
            journey.Phase4Data.LaunchAssets = new LaunchAssetsPlan { Version = 1, Status = "Draft", LastGeneratedAt = DateTime.UtcNow };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(TestUserId, TestIdeaId))
                .ReturnsAsync(journey);
            _ideasMock.Setup(i => i.GetOwnedAsync(TestIdeaId, TestUserId))
                .ReturnsAsync(idea);
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, It.IsAny<bool>()))
                .ReturnsAsync(new ComputedJourneyStatus
                {
                    Phase1 = new ComputedPhaseStatus { Status = "completed" },
                    Phase2 = new ComputedPhaseStatus { Status = "completed" },
                    Phase3 = new ComputedPhaseStatus { Status = "completed" },
                    Phase4 = new ComputedPhaseStatus { Status = "in_progress", CurrentStep = 9 }
                });

            // Act
            var summary = await _service.GetSummaryAsync(TestUserId, TestIdeaId);

            // Assert
            summary.NextAction.Should().NotBeNull();
            summary.NextAction.Phase.Should().Be(4);
            summary.NextAction.Stage.Should().Be("4.9");
            summary.NextAction.Type.Should().Be("phase_4_readiness");
            summary.NextAction.Href.Should().Be($"/dashboard/creator/phase-4/readiness?ideaId={TestIdeaId}");
            summary.Phase5.IsUnlocked.Should().BeFalse();
        }

        [Fact]
        public async Task SavedReadinessReview_DoesNotCompleteOpenTasksOrDraftStages()
        {
            // Arrange
            var journey = CreateBaseJourney();
            var idea = new CreatorIdea { Id = TestIdeaId, UserId = TestUserId, Project = journey.Project };
            // Readiness review is saved, but Pricing is in Draft
            journey.Phase4Data.ConstructionSnapshot = new ConstructionSnapshot { Status = "Completed", GeneratedAt = DateTime.UtcNow, Categories = new List<string> { "all" } };
            journey.Phase4Data.Roadmap = new OperationalRoadmap
            {
                Status = "Active",
                GeneratedAt = DateTime.UtcNow,
                Stages = new List<RoadmapStageGroup>(),
                Tasks = new List<RoadmapTask>
                {
                    new() { Key = "task-blocked", Title = "Obtain Manufacturer License", Status = "Blocked", FounderNotes = "Pending supplier callback" }
                }
            };
            journey.Phase4Data.NeedsAnalysis = new NeedsAnalysis { Status = "Completed", GeneratedAt = DateTime.UtcNow, CountsByCategory = new Dictionary<string, int> { { "ops", 1 } } };
            journey.Phase4Data.SkillsPlan = new SkillsPlan { Status = "Completed", GeneratedAt = DateTime.UtcNow, Resolutions = new List<CapabilityResolution>(), CoveredCapabilities = new List<CoveredCapability>() };
            journey.Phase4Data.SupportPlan = new SupportPlan { Status = "Generated", GeneratedAt = DateTime.UtcNow, Summary = new SupportPlanSummary() };
            journey.Phase4Data.PricingStrategy = new PricingStrategy { Status = PricingStatus.Draft }; // Incomplete!
            journey.Phase4Data.GtmStrategy = new GtmStrategy { Status = "Valid", GeneratedAt = DateTime.UtcNow, SegmentStrategies = new List<GtmSegmentStrategy>(), LaunchPlan = new GtmLaunchPlan() };
            journey.Phase4Data.LaunchAssets = new LaunchAssetsPlan { Version = 1, Status = "Draft", LastGeneratedAt = DateTime.UtcNow };
            journey.Phase4Data.ConstructionReadiness = new ConstructionReadinessReview { Status = "Ready for construction", ReviewedAt = DateTime.UtcNow };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(TestUserId, TestIdeaId))
                .ReturnsAsync(journey);
            _ideasMock.Setup(i => i.GetOwnedAsync(TestIdeaId, TestUserId))
                .ReturnsAsync(idea);
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, It.IsAny<bool>()))
                .ReturnsAsync(new ComputedJourneyStatus
                {
                    Phase1 = new ComputedPhaseStatus { Status = "completed" },
                    Phase2 = new ComputedPhaseStatus { Status = "completed" },
                    Phase3 = new ComputedPhaseStatus { Status = "completed" },
                    Phase4 = new ComputedPhaseStatus { Status = "in_progress", CurrentStep = 6 }
                });

            // Act
            var summary = await _service.GetSummaryAsync(TestUserId, TestIdeaId);

            // Assert
            // 1. Saved readiness review does NOT unlock Phase 5 when pricing is draft
            summary.Phase5.IsUnlocked.Should().BeFalse();
            // 2. NextAction still points to the incomplete Pricing stage
            summary.NextAction.Stage.Should().Be("4.6");
            // 3. Blocked task from roadmap appears in attention items
            summary.AttentionItems.Should().Contain(a => a.Type == "BLOCKED" && a.Title.Contains("Obtain Manufacturer License"));
        }

        [Fact]
        public async Task SavedResults_IncludesLaunchWebsiteAndReadiness_OnlyWhenGenerated()
        {
            // Arrange
            var journey = CreateBaseJourney();
            var idea = new CreatorIdea { Id = TestIdeaId, UserId = TestUserId, Project = journey.Project };
            // Launch assets generated and readiness review saved
            journey.Phase4Data.LaunchAssets = new LaunchAssetsPlan
            {
                Version = 2,
                Status = "Customized",
                LastGeneratedAt = DateTime.UtcNow
            };
            journey.Phase4Data.ConstructionReadiness = new ConstructionReadinessReview
            {
                Status = "Ready for construction",
                ReviewedAt = DateTime.UtcNow
            };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(TestUserId, TestIdeaId))
                .ReturnsAsync(journey);
            _ideasMock.Setup(i => i.GetOwnedAsync(TestIdeaId, TestUserId))
                .ReturnsAsync(idea);
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, It.IsAny<bool>()))
                .ReturnsAsync(new ComputedJourneyStatus());

            // Act
            var summary = await _service.GetSummaryAsync(TestUserId, TestIdeaId);

            // Assert
            var websiteResult = summary.Results.Should().ContainSingle(r => r.Key == "launch_assets").Subject;
            websiteResult.Title.Should().Be("One-Page Launch Website");
            websiteResult.Status.Should().Be("Ready");
            websiteResult.Href.Should().Be($"/dashboard/creator/phase-4/launch-assets?ideaId={TestIdeaId}");

            var readinessResult = summary.Results.Should().ContainSingle(r => r.Key == "construction_readiness").Subject;
            readinessResult.Title.Should().Be("Construction Readiness Review");
            readinessResult.Status.Should().Be("Ready");
            readinessResult.Href.Should().Be($"/dashboard/creator/phase-4/readiness?ideaId={TestIdeaId}");
        }

        [Fact]
        public async Task ProjectContext_PreservesIdeaIdAcrossAllSubstagesAndResults_WhenSwitchingIdeas()
        {
            // Arrange: Idea B
            const string switchedIdeaId = "idea-xyz-789";
            var journey = CreateBaseJourney(TestUserId, switchedIdeaId);
            var idea = new CreatorIdea { Id = switchedIdeaId, UserId = TestUserId, Project = new CreatorJourneyProject { Name = "Switched Venture" } };

            journey.Phase3Data.MarketStudySessionId = "session-1";
            journey.Phase4Data.ConstructionSnapshot = new ConstructionSnapshot { Status = "Completed", GeneratedAt = DateTime.UtcNow, Categories = new List<string> { "legal" } };
            journey.Phase4Data.LaunchAssets = new LaunchAssetsPlan { Version = 1, Status = "Draft", LastGeneratedAt = DateTime.UtcNow };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(TestUserId, switchedIdeaId))
                .ReturnsAsync(journey);
            _ideasMock.Setup(i => i.GetOwnedAsync(switchedIdeaId, TestUserId))
                .ReturnsAsync(idea);
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, It.IsAny<bool>()))
                .ReturnsAsync(new ComputedJourneyStatus());

            // Act
            var summary = await _service.GetSummaryAsync(TestUserId, switchedIdeaId);

            // Assert
            summary.Project.Id.Should().Be(switchedIdeaId);
            summary.Project.Name.Should().Be("Switched Venture");

            // All substages in journey overview preserve switchedIdeaId
            var p3Phase = summary.Journey.Phases.First(p => p.PhaseNumber == 3);
            p3Phase.SubstageProgress.Should().OnlyContain(s => s.Href.Contains($"ideaId={switchedIdeaId}"));

            var p4Phase = summary.Journey.Phases.First(p => p.PhaseNumber == 4);
            p4Phase.SubstageProgress.Should().OnlyContain(s => s.Href.Contains($"ideaId={switchedIdeaId}"));

            // All results preserve switchedIdeaId
            summary.Results.Should().OnlyContain(r => r.Href.Contains($"ideaId={switchedIdeaId}"));
            summary.Results.Should().NotContain(r => r.Href.Contains(TestIdeaId));
        }

        [Fact]
        public async Task Phase4_CurrentStep10_TreatedAsCompletionSentinel_NeverConstructsStep10Link()
        {
            // Arrange
            var journey = CreateBaseJourney();
            var idea = new CreatorIdea { Id = TestIdeaId, UserId = TestUserId, Project = journey.Project };

            // Set all 9 Phase 4 steps to completed
            journey.Phase4Data.ConstructionSnapshot = new ConstructionSnapshot { Status = "Completed", GeneratedAt = DateTime.UtcNow, Categories = new List<string> { "all" } };
            journey.Phase4Data.Roadmap = new OperationalRoadmap { Status = "Active", GeneratedAt = DateTime.UtcNow, Stages = new List<RoadmapStageGroup>() };
            journey.Phase4Data.NeedsAnalysis = new NeedsAnalysis { Status = "Completed", GeneratedAt = DateTime.UtcNow, CountsByCategory = new Dictionary<string, int>() };
            journey.Phase4Data.SkillsPlan = new SkillsPlan { Status = "Completed", GeneratedAt = DateTime.UtcNow, Resolutions = new List<CapabilityResolution>(), CoveredCapabilities = new List<CoveredCapability>() };
            journey.Phase4Data.SupportPlan = new SupportPlan { Status = "Confirmed", GeneratedAt = DateTime.UtcNow, Summary = new SupportPlanSummary() };
            journey.Phase4Data.PricingStrategy = new PricingStrategy { Status = PricingStatus.Generated, GeneratedAt = DateTime.UtcNow, Offers = new List<PricingOffer>() };
            journey.Phase4Data.GtmStrategy = new GtmStrategy { Status = "Valid", GeneratedAt = DateTime.UtcNow, SegmentStrategies = new List<GtmSegmentStrategy>(), LaunchPlan = new GtmLaunchPlan() };
            journey.Phase4Data.LaunchAssets = new LaunchAssetsPlan { Version = 1, Status = "Draft", LastGeneratedAt = DateTime.UtcNow };
            journey.Phase4Data.ConstructionReadiness = new ConstructionReadinessReview { Status = "Ready for construction", ReviewedAt = DateTime.UtcNow };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(TestUserId, TestIdeaId))
                .ReturnsAsync(journey);
            _ideasMock.Setup(i => i.GetOwnedAsync(TestIdeaId, TestUserId))
                .ReturnsAsync(idea);

            var computed = new ComputedJourneyStatus
            {
                Phase1 = new ComputedPhaseStatus { Status = "completed" },
                Phase2 = new ComputedPhaseStatus { Status = "completed", CurrentStep = 4 },
                Phase3 = new ComputedPhaseStatus { Status = "completed", CurrentStep = 7 },
                Phase4 = new ComputedPhaseStatus { Status = "completed", CurrentStep = 10 }, // Sentinel step 10
                Phase5 = new ComputedPhaseStatus { Status = "available", CurrentStep = 1 }
            };
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, It.IsAny<bool>()))
                .ReturnsAsync(computed);

            // Act
            var summary = await _service.GetSummaryAsync(TestUserId, TestIdeaId);

            // Assert
            // 1. Next action returns the MVP launch preparation review action
            summary.NextAction.Phase.Should().Be(4);
            summary.NextAction.Title.Should().Be("Review your launch preparation");
            summary.NextAction.Href.Should().Be($"/dashboard/creator/phase-4?ideaId={TestIdeaId}");
            summary.NextAction.Stage.Should().Be("4.9");

            // 2. Substage list has exactly 9 steps, none with 4.10 or step-10
            var p4 = summary.Journey.Phases.Find(p => p.PhaseNumber == 4);
            p4.Should().NotBeNull();
            p4!.TotalSteps.Should().Be(9);
            p4.SubstageProgress.Should().HaveCount(9);
            p4.SubstageProgress.Should().NotContain(s => s.Key == "4.10" || s.Href.Contains("4.10") || s.Href.Contains("step-10"));

            // 3. Phase 5 is properly unlocked
            summary.Phase5.IsUnlocked.Should().BeTrue();
            summary.Phase5.Href.Should().Be($"/dashboard/creator/crossroads?ideaId={TestIdeaId}");
        }

        [Fact]
        public async Task LaunchAssetsDraft_RemainsDistinguishableFromCustomizedSelectedWebsite()
        {
            // Arrange
            var journey = CreateBaseJourney();
            var idea = new CreatorIdea { Id = TestIdeaId, UserId = TestUserId, Project = journey.Project };

            // 1. Initially Draft
            journey.Phase4Data.LaunchAssets = new LaunchAssetsPlan
            {
                Version = 1,
                Status = "Draft",
                LastGeneratedAt = DateTime.UtcNow
            };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(TestUserId, TestIdeaId))
                .ReturnsAsync(journey);
            _ideasMock.Setup(i => i.GetOwnedAsync(TestIdeaId, TestUserId))
                .ReturnsAsync(idea);
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, It.IsAny<bool>()))
                .ReturnsAsync(new ComputedJourneyStatus());

            // Act
            var draftSummary = await _service.GetSummaryAsync(TestUserId, TestIdeaId);

            // Assert Draft output
            var draftResult = draftSummary.Results.Should().ContainSingle(r => r.Key == "launch_assets").Subject;
            draftResult.Title.Should().Be("One-Page Launch Website");
            draftResult.Status.Should().Be("Draft");
            draftResult.Downloadable.Should().BeFalse();
            draftResult.ExportType.Should().Be("view");

            // 2. Customized / Selected
            journey.Phase4Data.LaunchAssets = new LaunchAssetsPlan
            {
                Version = 2,
                Status = "Customized",
                LastGeneratedAt = DateTime.UtcNow
            };

            var customizedSummary = await _service.GetSummaryAsync(TestUserId, TestIdeaId);
            var customizedResult = customizedSummary.Results.Should().ContainSingle(r => r.Key == "launch_assets").Subject;
            customizedResult.Title.Should().Be("One-Page Launch Website");
            customizedResult.Status.Should().Be("Ready");
        }

        private static ForecastSession CreateTestForecastSession(
            string ideaId,
            string userId,
            decimal[] monthlyAmounts,
            int? breakEvenMonth = 14,
            string currency = "EUR",
            bool isValid = true)
        {
            var revMonthly = new BsonArray();
            if (isValid)
            {
                for (int i = 0; i < monthlyAmounts.Length; i++)
                {
                    revMonthly.Add(new BsonDocument
                    {
                        ["month"] = i + 1,
                        ["amount"] = (double)monthlyAmounts[i],
                        ["notes"] = $"Month {i + 1}"
                    });
                }
            }

            var costMonthly = new BsonArray();
            if (isValid)
            {
                costMonthly.Add(new BsonDocument { ["month"] = 1, ["fixedCosts"] = 1000, ["variableCosts"] = 200 });
            }

            var content = new BsonDocument
            {
                ["revenueForecast"] = new BsonDocument
                {
                    ["currency"] = currency,
                    ["summary"] = "Projection summary",
                    ["monthly"] = revMonthly
                },
                ["costForecast"] = new BsonDocument
                {
                    ["currency"] = currency,
                    ["summary"] = "Cost summary",
                    ["monthly"] = costMonthly
                },
                ["breakEvenAnalysis"] = new BsonDocument
                {
                    ["breakEvenMonth"] = breakEvenMonth.HasValue ? (BsonValue)breakEvenMonth.Value : BsonNull.Value,
                    ["isAchievedWithinHorizon"] = breakEvenMonth.HasValue,
                    ["summary"] = "Break-even summary"
                }
            };

            return new ForecastSession
            {
                Id = "session-fc-1",
                OwnerUserId = userId,
                BusinessIdeaId = ideaId,
                Status = isValid ? "Completed" : "Failed",
                Versions = new List<ForecastVersion>
                {
                    new ForecastVersion
                    {
                        Version = 1,
                        Content = content,
                        GeneratedContent = content,
                        CreatedAt = DateTime.UtcNow
                    }
                }
            };
        }

        [Fact]
        public async Task ForecastRevenue_WhenValidForecastExists_ReturnsDeterministicRevenueProjection()
        {
            // Arrange
            var journey = CreateBaseJourney();
            var idea = new CreatorIdea { Id = TestIdeaId, UserId = TestUserId, Project = journey.Project };
            var forecastStoreMock = new Mock<IForecastSessionStore>();

            var amounts = new decimal[] { 10000m, 20000m, 30000m };
            var session = CreateTestForecastSession(TestIdeaId, TestUserId, amounts, breakEvenMonth: 14, currency: "EUR");
            forecastStoreMock.Setup(f => f.GetByIdeaAsync(TestIdeaId, TestUserId)).ReturnsAsync(session);

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(TestUserId, TestIdeaId)).ReturnsAsync(journey);
            _ideasMock.Setup(i => i.GetOwnedAsync(TestIdeaId, TestUserId)).ReturnsAsync(idea);
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, It.IsAny<bool>())).ReturnsAsync(new ComputedJourneyStatus());

            var service = new CreatorDashboardService(
                _journeysMock.Object,
                _ideasMock.Object,
                _brandKitsMock.Object,
                _profilesMock.Object,
                _userManagerMock.Object,
                forecastStoreMock.Object
            );

            // Act
            var summary = await service.GetSummaryAsync(TestUserId, TestIdeaId);

            // Assert
            summary.Forecast.Should().NotBeNull();
            summary.Forecast.HasForecast.Should().BeTrue();
            summary.Forecast.RevenueProjection.Should().Be(60000m);
            summary.Forecast.Currency.Should().Be("EUR");
        }

        [Fact]
        public async Task ForecastBreakEven_WhenValidForecastExists_ReturnsBreakEvenMonth()
        {
            // Arrange
            var journey = CreateBaseJourney();
            var idea = new CreatorIdea { Id = TestIdeaId, UserId = TestUserId, Project = journey.Project };
            var forecastStoreMock = new Mock<IForecastSessionStore>();

            var amounts = new decimal[] { 5000m, 10000m };
            var session = CreateTestForecastSession(TestIdeaId, TestUserId, amounts, breakEvenMonth: 14);
            forecastStoreMock.Setup(f => f.GetByIdeaAsync(TestIdeaId, TestUserId)).ReturnsAsync(session);

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(TestUserId, TestIdeaId)).ReturnsAsync(journey);
            _ideasMock.Setup(i => i.GetOwnedAsync(TestIdeaId, TestUserId)).ReturnsAsync(idea);
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, It.IsAny<bool>())).ReturnsAsync(new ComputedJourneyStatus());

            var service = new CreatorDashboardService(
                _journeysMock.Object,
                _ideasMock.Object,
                _brandKitsMock.Object,
                _profilesMock.Object,
                _userManagerMock.Object,
                forecastStoreMock.Object
            );

            // Act
            var summary = await service.GetSummaryAsync(TestUserId, TestIdeaId);

            // Assert
            summary.Forecast.BreakEvenMonth.Should().Be(14);
        }

        [Fact]
        public async Task Forecast_WhenFailedOrInvalidForecast_ReturnsNullFields()
        {
            // Arrange
            var journey = CreateBaseJourney();
            var idea = new CreatorIdea { Id = TestIdeaId, UserId = TestUserId, Project = journey.Project };
            var forecastStoreMock = new Mock<IForecastSessionStore>();

            var invalidSession = CreateTestForecastSession(TestIdeaId, TestUserId, Array.Empty<decimal>(), breakEvenMonth: null, isValid: false);
            forecastStoreMock.Setup(f => f.GetByIdeaAsync(TestIdeaId, TestUserId)).ReturnsAsync(invalidSession);

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(TestUserId, TestIdeaId)).ReturnsAsync(journey);
            _ideasMock.Setup(i => i.GetOwnedAsync(TestIdeaId, TestUserId)).ReturnsAsync(idea);
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, It.IsAny<bool>())).ReturnsAsync(new ComputedJourneyStatus());

            var service = new CreatorDashboardService(
                _journeysMock.Object,
                _ideasMock.Object,
                _brandKitsMock.Object,
                _profilesMock.Object,
                _userManagerMock.Object,
                forecastStoreMock.Object
            );

            // Act
            var summary = await service.GetSummaryAsync(TestUserId, TestIdeaId);

            // Assert
            summary.Forecast.HasForecast.Should().BeFalse();
            summary.Forecast.RevenueProjection.Should().BeNull();
            summary.Forecast.BreakEvenMonth.Should().BeNull();
        }

        [Fact]
        public async Task Forecast_WhenCrossProjectForecast_DoesNotExposeForecastData()
        {
            // Arrange
            var journey = CreateBaseJourney();
            var idea = new CreatorIdea { Id = TestIdeaId, UserId = TestUserId, Project = journey.Project };
            var forecastStoreMock = new Mock<IForecastSessionStore>();

            // Session belongs to another idea
            var crossProjectSession = CreateTestForecastSession("other-idea-999", TestUserId, new decimal[] { 50000m }, breakEvenMonth: 12);
            forecastStoreMock.Setup(f => f.GetByIdeaAsync(TestIdeaId, TestUserId)).ReturnsAsync(crossProjectSession);

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(TestUserId, TestIdeaId)).ReturnsAsync(journey);
            _ideasMock.Setup(i => i.GetOwnedAsync(TestIdeaId, TestUserId)).ReturnsAsync(idea);
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, It.IsAny<bool>())).ReturnsAsync(new ComputedJourneyStatus());

            var service = new CreatorDashboardService(
                _journeysMock.Object,
                _ideasMock.Object,
                _brandKitsMock.Object,
                _profilesMock.Object,
                _userManagerMock.Object,
                forecastStoreMock.Object
            );

            // Act
            var summary = await service.GetSummaryAsync(TestUserId, TestIdeaId);

            // Assert
            summary.Forecast.HasForecast.Should().BeFalse();
            summary.Forecast.RevenueProjection.Should().BeNull();
            summary.Forecast.BreakEvenMonth.Should().BeNull();
        }

        [Fact]
        public async Task Forecast_WhenNoForecastExists_ReturnsNullFields()
        {
            // Arrange
            var journey = CreateBaseJourney();
            var idea = new CreatorIdea { Id = TestIdeaId, UserId = TestUserId, Project = journey.Project };
            var forecastStoreMock = new Mock<IForecastSessionStore>();

            forecastStoreMock.Setup(f => f.GetByIdeaAsync(TestIdeaId, TestUserId)).ReturnsAsync((ForecastSession?)null);

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(TestUserId, TestIdeaId)).ReturnsAsync(journey);
            _ideasMock.Setup(i => i.GetOwnedAsync(TestIdeaId, TestUserId)).ReturnsAsync(idea);
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, It.IsAny<bool>())).ReturnsAsync(new ComputedJourneyStatus());

            var service = new CreatorDashboardService(
                _journeysMock.Object,
                _ideasMock.Object,
                _brandKitsMock.Object,
                _profilesMock.Object,
                _userManagerMock.Object,
                forecastStoreMock.Object
            );

            // Act
            var summary = await service.GetSummaryAsync(TestUserId, TestIdeaId);

            // Assert
            summary.Forecast.HasForecast.Should().BeFalse();
            summary.Forecast.RevenueProjection.Should().BeNull();
            summary.Forecast.BreakEvenMonth.Should().BeNull();
        }

        [Fact]
        public async Task LegalReadiness_WhenAssessmentExists_ReturnsPlanningReadinessPct()
        {
            // Arrange
            var journey = CreateBaseJourney();
            journey.Phase3Data.LegalAssessment = new CreatorLegalAssessment
            {
                PlanningReadinessPct = 85.0
            };
            var idea = new CreatorIdea { Id = TestIdeaId, UserId = TestUserId, Project = journey.Project };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(TestUserId, TestIdeaId)).ReturnsAsync(journey);
            _ideasMock.Setup(i => i.GetOwnedAsync(TestIdeaId, TestUserId)).ReturnsAsync(idea);
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, It.IsAny<bool>())).ReturnsAsync(new ComputedJourneyStatus());

            // Act
            var summary = await _service.GetSummaryAsync(TestUserId, TestIdeaId);

            // Assert
            summary.Project.LegalReadinessPct.Should().Be(85.0);
        }

        [Fact]
        public async Task LegalReadiness_WhenNoAssessmentExists_ReturnsNullAndNoInventedScore()
        {
            // Arrange
            var journey = CreateBaseJourney();
            journey.Phase3Data.LegalAssessment = null;
            var idea = new CreatorIdea { Id = TestIdeaId, UserId = TestUserId, Project = journey.Project };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(TestUserId, TestIdeaId)).ReturnsAsync(journey);
            _ideasMock.Setup(i => i.GetOwnedAsync(TestIdeaId, TestUserId)).ReturnsAsync(idea);
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, It.IsAny<bool>())).ReturnsAsync(new ComputedJourneyStatus());

            // Act
            var summary = await _service.GetSummaryAsync(TestUserId, TestIdeaId);

            // Assert
            summary.Project.LegalReadinessPct.Should().BeNull();
        }
    }
}
