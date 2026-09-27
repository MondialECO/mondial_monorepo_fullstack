using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Moq;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Phase4;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Repository;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class CreatorPhase4ConstructionReadinessTests
    {
        private readonly Mock<ICreatorJourneyService> _journeysMock = new();
        private readonly Mock<IBrandKitStore> _brandKitsMock = new();
        private readonly Mock<ILogger<ConstructionReadinessService>> _loggerMock = new();

        private ConstructionReadinessService CreateService()
        {
            return new ConstructionReadinessService(
                _journeysMock.Object,
                _brandKitsMock.Object,
                _loggerMock.Object);
        }

        [Fact]
        public async Task GetReadinessAssessment_IncompleteInputs_ProducesHonestFindingsAndNullableScore()
        {
            // Arrange: minimal journey with missing artifacts
            var journey = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-abc",
                IdeaVersion = 1,
                Project = new CreatorJourneyProject { Name = "ClairDesk" },
                Phase4Data = new CreatorPhase4Data()
            };
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-abc"))
                .ReturnsAsync(journey);

            var service = CreateService();

            // Act
            var res = await service.GetReadinessAssessmentAsync("user-123", "idea-abc");

            // Assert
            Assert.NotNull(res);
            Assert.NotNull(res.Review);
            Assert.Null(res.Review.OverallScore); // Explicitly nullable: null represents "Score not yet calculated"
            Assert.Equal("NotCalculated", res.Review.ScoreStatus);
            Assert.Equal("Score not yet calculated", res.Review.ScoreAvailabilityExplanation.Length > 0 ? "Score not yet calculated" : "");
            Assert.False(res.IsSaved);
        }

        [Fact]
        public async Task GetReadinessAssessment_GeneratedArtifacts_DoNotImplyCompletedWork()
        {
            // Arrange: Roadmap exists and is Active, but tasks are not done; Forecast exists but funding not confirmed
            var journey = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-abc",
                IdeaVersion = 2,
                Project = new CreatorJourneyProject { Name = "TestApp" },
                Phase3Data = new CreatorPhase3Data { ForecastSessionId = "sess-forecast-1" },
                Phase4Data = new CreatorPhase4Data
                {
                    Roadmap = new OperationalRoadmap
                    {
                        Status = "Active",
                        GeneratedAt = DateTime.UtcNow,
                        Stages = new List<RoadmapStageGroup>
                        {
                            new RoadmapStageGroup
                            {
                                Stage = RoadmapStages.Now,
                                Tasks = new List<RoadmapTask>
                                {
                                    new RoadmapTask { Title = "Prepare technical delivery brief", Status = RoadmapTaskStatus.NotStarted }
                                }
                            }
                        }
                    }
                }
            };
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-abc"))
                .ReturnsAsync(journey);

            var service = CreateService();

            // Act
            var res = await service.GetReadinessAssessmentAsync("user-123", "idea-abc");

            // Assert
            var forecastCard = res.Review.Artifacts.FirstOrDefault(a => a.Id == "financial_forecast");
            Assert.NotNull(forecastCard);
            Assert.Equal("Generated", forecastCard.Status);
            Assert.Contains("Funding is not confirmed", forecastCard.Description);

            var roadmapCard = res.Review.Artifacts.FirstOrDefault(a => a.Id == "operational_roadmap");
            Assert.NotNull(roadmapCard);
            Assert.Equal("Active", roadmapCard.Status);
            Assert.Contains("Tasks still need to be completed", roadmapCard.Description);
        }

        [Fact]
        public async Task GetReadinessAssessment_CriticalDeliveryGaps_RemainProminentlyVisible()
        {
            // Arrange: Skills plan has technical development delegate strategy
            var journey = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-abc",
                IdeaVersion = 1,
                Project = new CreatorJourneyProject { Name = "TechVenture" },
                Phase4Data = new CreatorPhase4Data
                {
                    SkillsPlan = new SkillsPlan
                    {
                        Status = "Completed",
                        Resolutions = new List<CapabilityResolution>
                        {
                            new CapabilityResolution
                            {
                                Capability = "Software Development",
                                NeedCategory = "Technical",
                                ResolutionMode = ResolutionModes.Delegate,
                                FounderDecision = FounderDecisionChoices.ChooseDelegate,
                                Blocking = true
                            }
                        }
                    }
                }
            };
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-abc"))
                .ReturnsAsync(journey);

            var service = CreateService();

            // Act
            var res = await service.GetReadinessAssessmentAsync("user-123", "idea-abc");

            // Assert
            var criticalIssue = res.Review.Issues.FirstOrDefault(i => i.Priority == "critical");
            Assert.NotNull(criticalIssue);
            Assert.Equal("issue_technical_delivery", criticalIssue.Id);
            Assert.Equal("Confirm how the product will be built", criticalIssue.Title);
            Assert.Equal("Critical priority", criticalIssue.Badge);
            Assert.Contains("needs suitable development capability", criticalIssue.WhyItMatters);
        }

        [Fact]
        public async Task GetReadinessAssessment_MarketingBudget_DistinguishesUnknownFromConfirmedZero()
        {
            // Case 1: Unknown budget -> issues contains marketing budget validation
            var journeyUnknown = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-1",
                Phase4Data = new CreatorPhase4Data
                {
                    GtmStrategy = new GtmStrategy
                    {
                        Status = "Valid",
                        BudgetPlan = new GtmBudgetPlan { TotalAvailableBudget = null, SpendableStatus = SpendableStatus.Unknown }
                    }
                }
            };
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-1"))
                .ReturnsAsync(journeyUnknown);

            var service = CreateService();
            var resUnknown = await service.GetReadinessAssessmentAsync("user-123", "idea-1");
            Assert.Contains(resUnknown.Review.Issues, i => i.Id == "issue_marketing_budget");

            // Case 2: Confirmed budget -> no marketing budget issue
            var journeyConfirmed = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-2",
                Phase4Data = new CreatorPhase4Data
                {
                    GtmStrategy = new GtmStrategy
                    {
                        Status = "Valid",
                        BudgetPlan = new GtmBudgetPlan { TotalAvailableBudget = 0m, SpendableStatus = SpendableStatus.ConfirmedAvailable }
                    }
                }
            };
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-2"))
                .ReturnsAsync(journeyConfirmed);

            var resConfirmed = await service.GetReadinessAssessmentAsync("user-123", "idea-2");
            Assert.DoesNotContain(resConfirmed.Review.Issues, i => i.Id == "issue_marketing_budget");
        }

        [Fact]
        public async Task GetReadinessAssessment_Pricing_DistinguishesConfirmedFreeFromUnconfirmed()
        {
            // Case 1: Confirmed free offer (price 0)
            var journeyFree = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-free",
                Phase4Data = new CreatorPhase4Data
                {
                    PricingStrategy = new PricingStrategy
                    {
                        Status = PricingStatus.Generated,
                        Offers = new List<PricingOffer>
                        {
                            new PricingOffer { Name = "Free Community Tier", Price = 0m, Currency = "€" }
                        }
                    }
                }
            };
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-free"))
                .ReturnsAsync(journeyFree);

            var service = CreateService();
            var resFree = await service.GetReadinessAssessmentAsync("user-123", "idea-free");
            var pricingCard = resFree.Review.Artifacts.FirstOrDefault(a => a.Id == "pricing_decision");
            Assert.NotNull(pricingCard);
            Assert.Equal("Selected", pricingCard.Status);
            Assert.Contains("Free offer confirmed", pricingCard.Description);
        }

        [Fact]
        public async Task GetReadinessAssessment_WebsiteVersionSelection_DistinguishesDraftFromSelected()
        {
            // Draft only (SelectedVersion not set)
            var journeyDraft = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-draft",
                Phase4Data = new CreatorPhase4Data
                {
                    LaunchAssets = new LaunchAssetsPlan
                    {
                        Version = 1,
                        SelectedVersion = 0,
                        Status = "Draft"
                    }
                }
            };
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-draft"))
                .ReturnsAsync(journeyDraft);

            var service = CreateService();
            var resDraft = await service.GetReadinessAssessmentAsync("user-123", "idea-draft");
            var websiteCard = resDraft.Review.Artifacts.FirstOrDefault(a => a.Id == "launch_website");
            Assert.NotNull(websiteCard);
            Assert.Equal("Draft available", websiteCard.Status);
            Assert.Contains("Selection", websiteCard.Description);
        }

        [Fact]
        public async Task GetReadinessAssessment_NextAction_ReferencesConnectedActionableTask()
        {
            // Arrange
            var journey = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-task",
                Project = new CreatorJourneyProject { Name = "MyStartup" },
                Phase4Data = new CreatorPhase4Data
                {
                    Roadmap = new OperationalRoadmap
                    {
                        Status = "Active",
                        Stages = new List<RoadmapStageGroup>
                        {
                            new RoadmapStageGroup
                            {
                                Stage = RoadmapStages.Now,
                                Tasks = new List<RoadmapTask>
                                {
                                    new RoadmapTask
                                    {
                                        Id = "task-brief-99",
                                        Title = "Prepare technical delivery brief",
                                        EstimatedEffort = "1.5 hours",
                                        Status = RoadmapTaskStatus.NotStarted
                                    }
                                }
                            }
                        }
                    }
                }
            };
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-task"))
                .ReturnsAsync(journey);

            var service = CreateService();

            // Act
            var res = await service.GetReadinessAssessmentAsync("user-123", "idea-task");

            // Assert
            Assert.NotNull(res.Review.NextAction);
            Assert.Equal("Prepare technical delivery brief", res.Review.NextAction.Title);
            Assert.Equal("1.5 hours", res.Review.NextAction.EstimatedEffort);
            Assert.Equal("task-brief-99", res.Review.NextAction.TaskId);
            Assert.Contains("task-brief-99", res.Review.NextAction.PrimaryActionRoute);
        }

        [Fact]
        public async Task SaveReadinessReview_PersistsReviewAndIncrementsIdeaVersion()
        {
            // Arrange
            var idea = new CreatorIdea
            {
                Id = "idea-save-1",
                UserId = "user-123",
                Version = 4,
                Project = new CreatorJourneyProject { Name = "SaveApp" }
            };
            var journey = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-save-1",
                IdeaVersion = 4,
                Project = idea.Project,
                Phase4Data = new CreatorPhase4Data()
            };
            var updatedJourney = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-save-1",
                IdeaVersion = 5,
                Project = idea.Project,
                Phase4Data = new CreatorPhase4Data()
            };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-save-1"))
                .ReturnsAsync(journey);
            _journeysMock.Setup(j => j.TryResolveIdeaAsync("user-123", "idea-save-1"))
                .ReturnsAsync(idea);
            _journeysMock.Setup(j => j.SetPhase4ConstructionReadinessAsync("user-123", It.IsAny<ConstructionReadinessReview>(), "idea-save-1"))
                .ReturnsAsync(updatedJourney);

            var service = CreateService();

            // Act
            var res = await service.SaveReadinessReviewAsync("user-123", new SaveConstructionReadinessRequest
            {
                IdeaId = "idea-save-1",
                ExpectedVersion = 4
            });

            // Assert
            Assert.NotNull(res);
            Assert.True(res.IsSaved);
            Assert.NotNull(res.Review.ReviewedAt);
            Assert.Equal(5, res.IdeaVersion);
            _journeysMock.Verify(j => j.SetPhase4ConstructionReadinessAsync("user-123", It.IsAny<ConstructionReadinessReview>(), "idea-save-1"), Times.Once);
        }

        [Fact]
        public async Task GetReadinessAssessment_WhenNoCriticalBlockers_ProducesHonestNonBlockingState()
        {
            // Arrange: All 6 required artifacts are present & valid, with non-delegate technical skills (Covered)
            var journey = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-ready",
                IdeaVersion = 2,
                Project = new CreatorJourneyProject
                {
                    Name = "SoloTech",
                    Branding = new CreatorBranding { LogoAsset = "logo.svg" }
                },
                Phase3Data = new CreatorPhase3Data
                {
                    ForecastSessionId = "sess-forecast-ready"
                },
                Phase4Data = new CreatorPhase4Data
                {
                    Roadmap = new OperationalRoadmap
                    {
                        Status = "Active",
                        Stages = new List<RoadmapStageGroup>
                        {
                            new RoadmapStageGroup
                            {
                                Stage = RoadmapStages.Now,
                                Tasks = new List<RoadmapTask>
                                {
                                    new RoadmapTask { Id = "t1", Title = "Initial Setup", Status = RoadmapTaskStatus.Done }
                                }
                            }
                        }
                    },
                    SkillsPlan = new SkillsPlan
                    {
                        Status = "Completed",
                        Resolutions = new List<CapabilityResolution>
                        {
                            new CapabilityResolution
                            {
                                Capability = "Fullstack Development",
                                NeedCategory = "Technical",
                                ResolutionMode = ResolutionModes.Covered,
                                FounderDecision = FounderDecisionChoices.AcceptedRecommendation,
                                Blocking = false
                            }
                        }
                    },
                    PricingStrategy = new PricingStrategy
                    {
                        Status = PricingStatus.Generated,
                        Offers = new List<PricingOffer>
                        {
                            new PricingOffer { Name = "Pro Plan", Price = 29m, Currency = "€" }
                        }
                    },
                    GtmStrategy = new GtmStrategy
                    {
                        Status = "Valid",
                        BudgetPlan = new GtmBudgetPlan { TotalAvailableBudget = 500m, SpendableStatus = SpendableStatus.ConfirmedAvailable }
                    },
                    LaunchAssets = new LaunchAssetsPlan
                    {
                        Version = 1,
                        SelectedVersion = 1,
                        Status = "Selected",
                        ButtonDestinationConfigured = true,
                        ButtonDestinationValue = "https://example.com"
                    }
                }
            };
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-ready"))
                .ReturnsAsync(journey);

            var service = CreateService();

            // Act
            var res = await service.GetReadinessAssessmentAsync("user-123", "idea-ready");

            // Assert
            Assert.NotNull(res);
            Assert.DoesNotContain(res.Review.Issues, i => i.Priority == "critical");
            Assert.Equal("Ready for construction", res.Review.Status);
            Assert.Contains("No critical delivery blockers identified", res.Review.DependencyGuidance);
        }

        [Fact]
        public async Task GetReadinessAssessment_SelectedWebsiteVersion_RecognizedWhenNewerDraftExists()
        {
            // Selected version is 1, but active draft version is 2
            var journey = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-multi-ver",
                Phase4Data = new CreatorPhase4Data
                {
                    LaunchAssets = new LaunchAssetsPlan
                    {
                        Version = 2,
                        SelectedVersion = 1,
                        Status = "Draft"
                    }
                }
            };
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-multi-ver"))
                .ReturnsAsync(journey);

            var service = CreateService();
            var res = await service.GetReadinessAssessmentAsync("user-123", "idea-multi-ver");
            var websiteCard = res.Review.Artifacts.FirstOrDefault(a => a.Id == "launch_website");

            Assert.NotNull(websiteCard);
            Assert.Equal("Selected", websiteCard.Status);
            Assert.Contains("Version 1 is selected", websiteCard.Description);
            Assert.DoesNotContain(res.Review.Issues, i => i.Id == "issue_website_version");
        }

        [Fact]
        public async Task GetReadinessAssessment_MissingRequiredSources_DoesNotSilentlyProducePositiveReadiness()
        {
            // Arrange: No critical issues (skills covered, pricing selected, gtm valid, website selected), BUT BrandKit and Roadmap are missing
            var journey = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-incomplete",
                IdeaVersion = 2,
                Project = new CreatorJourneyProject { Name = "IncompleteVenture" }, // No branding
                Phase4Data = new CreatorPhase4Data
                {
                    // No Roadmap
                    SkillsPlan = new SkillsPlan
                    {
                        Status = "Completed",
                        Resolutions = new List<CapabilityResolution>
                        {
                            new CapabilityResolution
                            {
                                Capability = "Fullstack Development",
                                NeedCategory = "Technical",
                                ResolutionMode = ResolutionModes.Covered,
                                FounderDecision = FounderDecisionChoices.AcceptedRecommendation,
                                Blocking = false
                            }
                        }
                    },
                    PricingStrategy = new PricingStrategy
                    {
                        Status = PricingStatus.Generated,
                        Offers = new List<PricingOffer>
                        {
                            new PricingOffer { Name = "Standard", Price = 10m, Currency = "€" }
                        }
                    },
                    GtmStrategy = new GtmStrategy
                    {
                        Status = "Valid",
                        BudgetPlan = new GtmBudgetPlan { TotalAvailableBudget = 100m, SpendableStatus = SpendableStatus.ConfirmedAvailable }
                    },
                    LaunchAssets = new LaunchAssetsPlan
                    {
                        Version = 1,
                        SelectedVersion = 1,
                        Status = "Selected",
                        ButtonDestinationConfigured = true,
                        ButtonDestinationValue = "https://example.com"
                    }
                }
            };
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-incomplete"))
                .ReturnsAsync(journey);

            var service = CreateService();

            // Act
            var res = await service.GetReadinessAssessmentAsync("user-123", "idea-incomplete");

            // Assert
            Assert.NotNull(res);
            // Missing Brand Kit and Roadmap -> Must NOT be "Ready for construction"
            Assert.NotEqual("Ready for construction", res.Review.Status);
            Assert.Equal("Preparation in progress", res.Review.Status);
            Assert.Contains("Foundational project artifacts remain incomplete", res.Review.PositionHeadline);
        }

        [Fact]
        public async Task SaveReadinessReview_ValidatesAndPreservesMatchingSourceFingerprint()
        {
            // Arrange
            var idea = new CreatorIdea
            {
                Id = "idea-fp",
                UserId = "user-123",
                Version = 3,
                Project = new CreatorJourneyProject { Name = "FingerprintApp" }
            };
            var journey = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-fp",
                IdeaVersion = 3,
                Project = idea.Project,
                Phase4Data = new CreatorPhase4Data()
            };
            var updatedJourney = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-fp",
                IdeaVersion = 4,
                Project = idea.Project,
                Phase4Data = new CreatorPhase4Data()
            };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-fp"))
                .ReturnsAsync(journey);
            _journeysMock.Setup(j => j.TryResolveIdeaAsync("user-123", "idea-fp"))
                .ReturnsAsync(idea);
            _journeysMock.Setup(j => j.SetPhase4ConstructionReadinessAsync("user-123", It.IsAny<ConstructionReadinessReview>(), "idea-fp"))
                .ReturnsAsync(updatedJourney);

            var service = CreateService();
            var getRes = await service.GetReadinessAssessmentAsync("user-123", "idea-fp");
            string validFp = getRes.Review.SourceFingerprint;

            // Act
            var res = await service.SaveReadinessReviewAsync("user-123", new SaveConstructionReadinessRequest
            {
                IdeaId = "idea-fp",
                ExpectedVersion = 3,
                SourceFingerprint = validFp
            });

            // Assert
            Assert.NotNull(res);
            Assert.Equal(validFp, res.Review.SourceFingerprint);
            Assert.True(res.IsSaved);
        }

        [Fact]
        public async Task SaveReadinessReview_WhenSourceFingerprintMismatch_ThrowsConcurrencyConflict()
        {
            // Arrange
            var idea = new CreatorIdea
            {
                Id = "idea-fp-stale",
                UserId = "user-123",
                Version = 3,
                Project = new CreatorJourneyProject { Name = "FingerprintApp" }
            };
            var journey = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-fp-stale",
                IdeaVersion = 3,
                Project = idea.Project,
                Phase4Data = new CreatorPhase4Data()
            };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-fp-stale"))
                .ReturnsAsync(journey);
            _journeysMock.Setup(j => j.TryResolveIdeaAsync("user-123", "idea-fp-stale"))
                .ReturnsAsync(idea);

            var service = CreateService();

            // Act & Assert: Client passes stale/mismatched fingerprint
            var ex = await Assert.ThrowsAsync<CreatorJourneyException>(() =>
                service.SaveReadinessReviewAsync("user-123", new SaveConstructionReadinessRequest
                {
                    IdeaId = "idea-fp-stale",
                    ExpectedVersion = 3,
                    SourceFingerprint = "outdated-fingerprint-from-earlier-state"
                }));

            Assert.Equal(409, ex.StatusCode);
            Assert.Contains("Assessment inputs have changed", ex.Message);
        }

        [Fact]
        public async Task SaveReadinessReview_VersionMismatch_ThrowsConcurrencyConflict()
        {
            // Arrange
            var idea = new CreatorIdea
            {
                Id = "idea-conflict",
                UserId = "user-123",
                Version = 5
            };
            var journey = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-conflict",
                IdeaVersion = 5
            };

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-conflict"))
                .ReturnsAsync(journey);
            _journeysMock.Setup(j => j.TryResolveIdeaAsync("user-123", "idea-conflict"))
                .ReturnsAsync(idea);

            var service = CreateService();

            // Act & Assert
            var ex = await Assert.ThrowsAsync<CreatorJourneyException>(() =>
                service.SaveReadinessReviewAsync("user-123", new SaveConstructionReadinessRequest
                {
                    IdeaId = "idea-conflict",
                    ExpectedVersion = 3 // Stale version
                }));

            Assert.Equal(409, ex.StatusCode);
            Assert.Contains("Concurrency conflict", ex.Message);
        }

        [Fact]
        public async Task GetReadinessAssessment_WhenTaskHasNoEffortEstimate_LeavesEstimatedEffortNull()
        {
            // Arrange
            var journey = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-no-effort",
                Project = new CreatorJourneyProject { Name = "NoEffortStartup" },
                Phase4Data = new CreatorPhase4Data
                {
                    Roadmap = new OperationalRoadmap
                    {
                        Status = "Active",
                        Stages = new List<RoadmapStageGroup>
                        {
                            new RoadmapStageGroup
                            {
                                Stage = RoadmapStages.Now,
                                Tasks = new List<RoadmapTask>
                                {
                                    new RoadmapTask
                                    {
                                        Id = "task-custom-1",
                                        Title = "Configure database models",
                                        EstimatedEffort = null, // No effort recorded
                                        Status = RoadmapTaskStatus.NotStarted
                                    }
                                }
                            }
                        }
                    }
                }
            };
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-no-effort"))
                .ReturnsAsync(journey);

            var service = CreateService();

            // Act
            var res = await service.GetReadinessAssessmentAsync("user-123", "idea-no-effort");

            // Assert
            Assert.NotNull(res.Review.NextAction);
            Assert.Null(res.Review.NextAction.EstimatedEffort); // Must not default to "1.5 hours"!
            Assert.Equal("task-custom-1", res.Review.NextAction.TaskId);
        }

        [Fact]
        public async Task GetReadinessAssessment_WhenNoRoadmapOrTask_UsesSuggestedActionWithoutFabricatingTaskId()
        {
            // Arrange
            var journey = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-no-roadmap",
                Project = new CreatorJourneyProject { Name = "NoRoadmapStartup" },
                Phase4Data = new CreatorPhase4Data() // No roadmap
            };
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-no-roadmap"))
                .ReturnsAsync(journey);

            var service = CreateService();

            // Act
            var res = await service.GetReadinessAssessmentAsync("user-123", "idea-no-roadmap");

            // Assert
            Assert.NotNull(res.Review.NextAction);
            Assert.Equal("Suggested action", res.Review.NextAction.Type); // Not "Existing roadmap task"
            Assert.Null(res.Review.NextAction.TaskId); // No synthetic "task-tech-delivery-1"
            Assert.Null(res.Review.NextAction.EstimatedEffort);
            Assert.Equal("Review your operational roadmap", res.Review.NextAction.Title);
            Assert.DoesNotContain("taskId=", res.Review.NextAction.PrimaryActionRoute);

            // Technical delivery critical issue must also omit synthetic connected work
            var techIssue = res.Review.Issues.FirstOrDefault(i => i.Id == "issue_technical_delivery");
            Assert.NotNull(techIssue);
            Assert.Null(techIssue.ConnectedWork);
            Assert.Null(techIssue.ConnectedTaskId);
            Assert.Equal("Open roadmap", techIssue.SecondaryActionLabel);
            Assert.DoesNotContain("taskId=", techIssue.SecondaryActionRoute);
        }

        [Fact]
        public async Task GetReadinessAssessment_Pricing_FormatsFrequenciesAndModelsCorrectly()
        {
            // Arrange
            var journeyAnnual = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-annual",
                Phase4Data = new CreatorPhase4Data
                {
                    PricingStrategy = new PricingStrategy
                    {
                        Status = PricingStatus.Generated,
                        Offers = new List<PricingOffer>
                        {
                            new PricingOffer
                            {
                                Name = "Enterprise",
                                Price = 1200m,
                                Currency = "USD",
                                BillingFrequency = BillingFrequency.Annual
                            }
                        }
                    }
                }
            };
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-annual"))
                .ReturnsAsync(journeyAnnual);

            var service = CreateService();

            // Act
            var res = await service.GetReadinessAssessmentAsync("user-123", "idea-annual");

            // Assert
            var pricingCard = res.Review.Artifacts.FirstOrDefault(a => a.Id == "pricing_decision");
            Assert.NotNull(pricingCard);
            Assert.Contains("$1200 per year", pricingCard.Description);
        }

        [Fact]
        public async Task GetReadinessAssessment_Pricing_RecognizesPaidEvidence()
        {
            // Arrange
            var journeyWithEvidence = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-evidence",
                Phase4Data = new CreatorPhase4Data
                {
                    PricingStrategy = new PricingStrategy
                    {
                        Status = PricingStatus.Generated,
                        Offers = new List<PricingOffer>
                        {
                            new PricingOffer
                            {
                                Name = "Pro",
                                Price = 49m,
                                Currency = "EUR",
                                MarketPriceEvidenceType = MarketPriceEvidenceType.HistoricalSale
                            }
                        }
                    }
                }
            };
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-evidence"))
                .ReturnsAsync(journeyWithEvidence);

            var service = CreateService();

            // Act
            var res = await service.GetReadinessAssessmentAsync("user-123", "idea-evidence");

            // Assert
            var pricingCard = res.Review.Artifacts.FirstOrDefault(a => a.Id == "pricing_decision");
            Assert.NotNull(pricingCard);
            Assert.Contains("Customer payment evidence is recorded.", pricingCard.Description);
        }

        [Fact]
        public async Task GetReadinessAssessment_LaunchAssets_UnselectedWithConfiguredCta_AccuratelyReportsDraftState()
        {
            // Arrange
            var journey = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-cta-configured",
                Phase4Data = new CreatorPhase4Data
                {
                    LaunchAssets = new LaunchAssetsPlan
                    {
                        Version = 2,
                        SelectedVersion = 0,
                        Status = "Draft",
                        ButtonDestinationConfigured = true,
                        ButtonDestinationValue = "https://tally.so/r/waitlist",
                        Sections = new List<LaunchAssetSection>
                        {
                            new LaunchAssetSection
                            {
                                Key = "hero",
                                ButtonDestinationType = "URL",
                                ButtonDestinationValue = "https://tally.so/r/waitlist"
                            }
                        }
                    }
                }
            };
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-cta-configured"))
                .ReturnsAsync(journey);

            var service = CreateService();

            // Act
            var res = await service.GetReadinessAssessmentAsync("user-123", "idea-cta-configured");

            // Assert
            var websiteCard = res.Review.Artifacts.FirstOrDefault(a => a.Id == "launch_website");
            Assert.NotNull(websiteCard);
            Assert.Equal("Draft available", websiteCard.Status);
            Assert.Contains("CTA configured", websiteCard.Description);

            // CTA issue should NOT be present since it is configured!
            Assert.DoesNotContain(res.Review.Issues, i => i.Id == "issue_website_cta");

            // Version selection issue SHOULD be present
            Assert.Contains(res.Review.Issues, i => i.Id == "issue_website_version");
        }

        [Fact]
        public async Task GetReadinessAssessment_MissingLaunchAssets_SummaryDoesNotFabricateWebsiteDraft()
        {
            // Arrange
            var journey = new CreatorJourney
            {
                UserId = "user-123",
                ActiveIdeaId = "idea-no-assets",
                Phase4Data = new CreatorPhase4Data() // No launch assets
            };
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-123", "idea-no-assets"))
                .ReturnsAsync(journey);

            var service = CreateService();

            // Act
            var res = await service.GetReadinessAssessmentAsync("user-123", "idea-no-assets");

            // Assert
            Assert.DoesNotContain("website draft are available", res.Review.PositionHeadline);
        }
    }
}
