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
            summary.NextAction.Href.Should().Contain("/phase-4/construction-snapshot");
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
                Phase4 = new ComputedPhaseStatus { Status = "completed", CurrentStep = 7 },
                Phase5 = new ComputedPhaseStatus { Status = "available", CurrentStep = 1 }
            };
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, It.IsAny<bool>()))
                .ReturnsAsync(computed);

            // Act
            var summary = await _service.GetSummaryAsync(TestUserId, TestIdeaId);

            // Assert
            summary.Phase5.IsUnlocked.Should().BeTrue();
            summary.Phase5.Href.Should().Contain("/dashboard/creator/crossroads");
            summary.NextAction.Phase.Should().Be(5);
            summary.NextAction.Href.Should().Contain("/dashboard/creator/crossroads");
        }

        [Fact]
        public async Task Dashboard_DoesNotDisplayPhase48Or49()
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
            p4Milestone.TotalSteps.Should().Be(7);
            p4Milestone.SubstageProgress.Should().NotContain(s => s.Key == "4.8" || s.Key == "4.9");
            summary.Results.Should().NotContain(r => r.Key.Contains("4.8") || r.Key.Contains("4.9") || r.Title.Contains("Readiness %"));
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
    }
}
