using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Models.DatabaseModels.Legal;
using WebApp.Models.DatabaseModels.Phase4;
using WebApp.Models.Dtos;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class CreatorPhase4SnapshotTests
    {
        private readonly Mock<ICreatorJourneyService> _journeysMock = new();
        private readonly Mock<IProfessionalProfileStore> _profStoreMock = new();
        private readonly Mock<IProfileCompletenessResolver> _completenessResolverMock = new();
        private readonly Mock<IMarketStudySessionStore> _marketStudiesMock = new();
        private readonly Mock<IBusinessModelSessionStore> _businessModelsMock = new();
        private readonly Mock<IForecastSessionStore> _forecastsMock = new();
        private readonly Mock<IBusinessPlanSessionStore> _businessPlansMock = new();
        private readonly ICapabilityMatcher _capabilityMatcher = new CapabilityMatcher();

        private ConstructionSnapshotService CreateService()
        {
            return new ConstructionSnapshotService(
                _journeysMock.Object,
                _capabilityMatcher,
                _profStoreMock.Object,
                _completenessResolverMock.Object,
                _marketStudiesMock.Object,
                _businessModelsMock.Object,
                _forecastsMock.Object,
                _businessPlansMock.Object
            );
        }

        private static CreatorJourney BuildCompletePhase3Journey(string userId = "user-1", string ideaId = "idea-1")
        {
            return new CreatorJourney
            {
                UserId = userId,
                ActiveIdeaId = ideaId,
                Project = new CreatorJourneyProject
                {
                    Name = "SaaS Metrics Pro",
                    Concept = "Analytics and automated forecasting software platform for subscription businesses",
                    Sector = "Software",
                    Category = "SaaS",
                    TargetUser = "SaaS founders and finance leads",
                    Problem = "Tracking MRR and cohort churn manually is error-prone",
                    Solution = "Automated real-time metrics dashboard",
                    CurrentVersion = 1,
                    Branding = new CreatorBranding
                    {
                        BrandingMethod = "ai_logo",
                        LogoAsset = "https://assets.mondial.eco/logo.png"
                    }
                },
                Phase3Data = new CreatorPhase3Data
                {
                    MarketStudySessionId = "market-session-1",
                    BusinessModelSessionId = "bm-session-1",
                    ForecastSessionId = "forecast-session-1",
                    BusinessPlanSessionId = "plan-session-1",
                    LegalAssessment = new CreatorLegalAssessment
                    {
                        EvaluatedAt = DateTime.UtcNow.AddDays(-2),
                        AssessmentVersion = 1
                    },
                    LegalChecklist = new CreatorLegalChecklist
                    {
                        CompletedCount = 5,
                        TotalCount = 7,
                        Items = new List<CreatorLegalChecklistItem>
                        {
                            new() { Id = "leg-1", Priority = "critical", Status = "completed" },
                            new() { Id = "leg-2", Priority = "critical", Status = "completed" }
                        }
                    },
                    FormationGenerator = new CreatorFormationGenerator
                    {
                        RecommendedType = "SAS",
                        SelectedType = "SAS",
                        YouHave = new List<string> { "Product Strategy", "B2B Sales" },
                        YouNeed = new List<CreatorSkillGap>
                        {
                            new() { Label = "Web Development", SpSpecialty = "development" },
                            new() { Label = "UI Design", SpSpecialty = "branding" }
                        }
                    },
                    InvestorReadinessScore = new CreatorInvestorReadinessScore
                    {
                        Total = 82,
                        Label = "Strong",
                        EvaluatedAt = DateTime.UtcNow.AddDays(-1)
                    }
                },
                Phase4Data = new CreatorPhase4Data
                {
                    PricingModel = "subscription",
                    Tiers = new List<CreatorPricingTier>
                    {
                        new() { Id = "t1", Name = "Starter", Price = 29 },
                        new() { Id = "t2", Name = "Growth", Price = 79 },
                        new() { Id = "t3", Name = "Enterprise", Price = 199 }
                    }
                },
                UpdatedAt = DateTime.UtcNow.AddDays(-1)
            };
        }

        private static ProfessionalProfileRecord BuildReadyProfile(string userId = "user-1", List<ProfileSkill>? skills = null)
        {
            return new ProfessionalProfileRecord
            {
                UserId = userId,
                Skills = skills ?? new List<ProfileSkill>
                {
                    new() { Name = "React", Level = "Comfortable", Source = "SelfDeclared" },
                    new() { Name = "Next.js", Level = "Advanced", Source = "SelfDeclared" },
                    new() { Name = "B2B Sales", Level = "Comfortable", Source = "SelfDeclared" },
                    new() { Name = "Accounting", Level = "Comfortable", Source = "SelfDeclared" }
                },
                VentureContext = new ProfileVentureContext
                {
                    CurrentSituation = "Employed",
                    WeeklyAvailability = "10to20Hours",
                    Region = "Ile-de-France",
                    LearningPreference = "HandsOn"
                },
                UpdatedAt = DateTime.UtcNow.AddDays(-2)
            };
        }

        [Fact]
        public async Task Gate_Blocks_When_Phase3_IsIncomplete()
        {
            var service = CreateService();
            var journey = BuildCompletePhase3Journey();

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-1", "idea-1"))
                .ReturnsAsync(journey);
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, true))
                .ReturnsAsync(new ComputedJourneyStatus
                {
                    Phase3 = new ComputedPhaseStatus { Status = "in_progress", CurrentStep = 4 }
                });

            var act = async () => await service.GenerateSnapshotAsync("user-1", "idea-1");
            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*Phase 3 must be completed*");
        }

        [Fact]
        public async Task Gate_Blocks_When_HumainX_Profile_Is_Not_Phase4Ready()
        {
            var service = CreateService();
            var journey = BuildCompletePhase3Journey();

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-1", "idea-1"))
                .ReturnsAsync(journey);
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, true))
                .ReturnsAsync(new ComputedJourneyStatus
                {
                    Phase3 = new ComputedPhaseStatus { Status = "completed", CurrentStep = 7 }
                });

            _profStoreMock.Setup(p => p.GetByUserIdAsync("user-1", It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ProfessionalProfileRecord { UserId = "user-1", Skills = new() });
            _completenessResolverMock.Setup(r => r.Resolve(It.IsAny<ProfessionalProfileRecord>()))
                .Returns(new ProfileCompletenessResult(
                    ProfileCompletion: 40,
                    Phase4Ready: false,
                    MissingForPhase4: new List<string> { "Skills", "WeeklyAvailability" }
                ));

            var act = async () => await service.GenerateSnapshotAsync("user-1", "idea-1");
            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*incomplete for Phase 4 personalization*");
        }

        [Fact]
        public async Task GenerateSnapshot_When_Gates_Pass_Populates_All_Categories_And_Counts()
        {
            var service = CreateService();
            var journey = BuildCompletePhase3Journey();
            var profile = BuildReadyProfile();

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-1", "idea-1"))
                .ReturnsAsync(journey);
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, true))
                .ReturnsAsync(new ComputedJourneyStatus { Phase3 = new ComputedPhaseStatus { Status = "completed" } });
            _profStoreMock.Setup(p => p.GetByUserIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(profile);
            _completenessResolverMock.Setup(r => r.Resolve(It.IsAny<ProfessionalProfileRecord?>()))
                .Returns(new ProfileCompletenessResult(85, true, new List<string>()));

            _marketStudiesMock.Setup(m => m.GetOwnedAsync("market-session-1", "user-1"))
                .ReturnsAsync(new MarketStudySession { Id = "market-session-1", CurrentVersion = 1, Status = "Completed", UpdatedAt = DateTime.UtcNow });
            _businessModelsMock.Setup(b => b.GetOwnedAsync("bm-session-1", "user-1"))
                .ReturnsAsync(new BusinessModelSession { Id = "bm-session-1", CurrentVersion = 1, Status = "Completed", UpdatedAt = DateTime.UtcNow });
            _forecastsMock.Setup(f => f.GetOwnedAsync("forecast-session-1", "user-1"))
                .ReturnsAsync(new ForecastSession { Id = "forecast-session-1", CurrentVersion = 1, Status = "Completed", UpdatedAt = DateTime.UtcNow });
            _businessPlansMock.Setup(p => p.GetOwnedAsync("plan-session-1", "user-1"))
                .ReturnsAsync(new BusinessPlanSession { Id = "plan-session-1", CurrentVersion = 1, Status = "Completed", UpdatedAt = DateTime.UtcNow });

            _journeysMock.Setup(j => j.SetPhase4ConstructionSnapshotAsync("user-1", It.IsAny<ConstructionSnapshot>(), It.IsAny<Phase4SourceVersions>(), "idea-1"))
                .ReturnsAsync(journey);

            var res = await service.GenerateSnapshotAsync("user-1", "idea-1");

            res.Should().NotBeNull();
            res.Snapshot.Should().NotBeNull();
            res.UpdateAvailable.Should().BeFalse();
            res.ReadyCount.Should().BeGreaterThan(0);
            res.Snapshot.Categories.Should().Contain(ConstructionCategories.Services);
            res.Snapshot.Categories.Should().Contain(ConstructionCategories.BusinessFoundation);
            res.Snapshot.OverallSummary.Should().NotBeNullOrWhiteSpace();
        }

        [Fact]
        public void CapabilityMatcher_Comfortable_And_Advanced_Are_Classified_As_Ready()
        {
            var matcher = new CapabilityMatcher();
            var skills = new List<ProfileSkill>
            {
                new() { Name = "React", Level = "Comfortable", Source = "SelfDeclared" },
                new() { Name = "ASP.NET Core", Level = "Advanced", Source = "SelfDeclared" }
            };

            var reactMatch = matcher.MatchCapability("Web Development", skills);
            reactMatch.IsMatched.Should().BeTrue();
            reactMatch.Status.Should().Be(ConstructionItemStatus.Ready);

            var dotnetMatch = matcher.MatchCapability("Software Development", skills);
            dotnetMatch.IsMatched.Should().BeTrue();
            dotnetMatch.Status.Should().Be(ConstructionItemStatus.Ready);
        }

        [Fact]
        public void CapabilityMatcher_Beginner_Is_Classified_As_Partial()
        {
            var matcher = new CapabilityMatcher();
            var skills = new List<ProfileSkill>
            {
                new() { Name = "Figma", Level = "Beginner", Source = "SelfDeclared" }
            };

            var match = matcher.MatchCapability("UI Design", skills);
            match.IsMatched.Should().BeTrue();
            match.Status.Should().Be(ConstructionItemStatus.Partial);
            match.Reason.Should().Contain("Beginner");
        }

        [Fact]
        public void CapabilityMatcher_Null_Level_Returns_NeedsReview()
        {
            var matcher = new CapabilityMatcher();
            var skills = new List<ProfileSkill>
            {
                new() { Name = "Python", Level = null, Source = "LegacyMigration" }
            };

            var match = matcher.MatchCapability("Software Development", skills);
            match.IsMatched.Should().BeTrue();
            match.Status.Should().Be(ConstructionItemStatus.NeedsReview);
            match.Reason.Should().Contain("proficiency level has not been confirmed");
        }

        [Fact]
        public void CapabilityMatcher_Uncertain_Requirement_Returns_NeedsReview_Never_Falsely_Missing()
        {
            var matcher = new CapabilityMatcher();
            var skills = new List<ProfileSkill>
            {
                new() { Name = "CustomAlgorithmicLogic", Level = "Advanced", Source = "SelfDeclared" }
            };

            // Partial lexical similarity with no known taxonomy match
            var match = matcher.MatchCapability("Algorithmic", skills);
            match.Status.Should().Be(ConstructionItemStatus.NeedsReview);
        }

        [Fact]
        public async Task Strict_Critical_Classification_For_Software_MVP_Without_Capability()
        {
            var service = CreateService();
            var journey = BuildCompletePhase3Journey();
            journey.Project.Sector = "Software";
            journey.Project.Category = "SaaS";
            journey.Phase3Data.FormationGenerator.YouHave = new List<string> { "Sales" }; // no tech

            // Founder with NO tech skills at all
            var nonTechProfile = BuildReadyProfile("user-1", new List<ProfileSkill>
            {
                new() { Name = "B2B Sales", Level = "Advanced" },
                new() { Name = "Accounting", Level = "Comfortable" }
            });

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-1", "idea-1")).ReturnsAsync(journey);
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, true))
                .ReturnsAsync(new ComputedJourneyStatus { Phase3 = new ComputedPhaseStatus { Status = "completed" } });
            _profStoreMock.Setup(p => p.GetByUserIdAsync("user-1", It.IsAny<CancellationToken>())).ReturnsAsync(nonTechProfile);
            _completenessResolverMock.Setup(r => r.Resolve(nonTechProfile))
                .Returns(new ProfileCompletenessResult(85, true, new List<string>()));

            _journeysMock.Setup(j => j.SetPhase4ConstructionSnapshotAsync("user-1", It.IsAny<ConstructionSnapshot>(), It.IsAny<Phase4SourceVersions>(), "idea-1"))
                .ReturnsAsync(journey);

            var res = await service.GenerateSnapshotAsync("user-1", "idea-1");

            var criticalTech = res.Snapshot.CriticalItems.FirstOrDefault(i => i.Key == "technical_execution");
            criticalTech.Should().NotBeNull();
            criticalTech!.Status.Should().Be(ConstructionItemStatus.Critical);
            criticalTech.Priority.Should().Be(ConstructionItemPriority.Critical);
            criticalTech.Blocking.Should().BeTrue();
            res.CriticalCount.Should().BeGreaterThan(0);
        }

        [Fact]
        public async Task Not_Critical_When_Technical_Cofounder_Or_Team_Skill_Present()
        {
            var service = CreateService();
            var journey = BuildCompletePhase3Journey();
            // Team has software engineer / tech skill
            journey.Phase3Data.FormationGenerator.YouHave = new List<string> { "Software Engineer", "Full-Stack Development" };

            var nonTechProfile = BuildReadyProfile("user-1", new List<ProfileSkill>
            {
                new() { Name = "B2B Sales", Level = "Advanced" }
            });

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-1", "idea-1")).ReturnsAsync(journey);
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, true))
                .ReturnsAsync(new ComputedJourneyStatus { Phase3 = new ComputedPhaseStatus { Status = "completed" } });
            _profStoreMock.Setup(p => p.GetByUserIdAsync("user-1", It.IsAny<CancellationToken>())).ReturnsAsync(nonTechProfile);
            _completenessResolverMock.Setup(r => r.Resolve(nonTechProfile)).Returns(new ProfileCompletenessResult(85, true, new List<string>()));

            _journeysMock.Setup(j => j.SetPhase4ConstructionSnapshotAsync("user-1", It.IsAny<ConstructionSnapshot>(), It.IsAny<Phase4SourceVersions>(), "idea-1"))
                .ReturnsAsync(journey);

            var res = await service.GenerateSnapshotAsync("user-1", "idea-1");

            var criticalTech = res.Snapshot.CriticalItems.FirstOrDefault(i => i.Key == "technical_execution");
            criticalTech.Should().BeNull(); // Satisfied by team -> Not critical!
        }

        [Fact]
        public async Task Idempotency_GET_And_Generate_Do_Not_Regenerate_Existing_Snapshot()
        {
            var service = CreateService();
            var journey = BuildCompletePhase3Journey();
            var existingSnapshot = new ConstructionSnapshot
            {
                GeneratedAt = new DateTime(2026, 9, 21, 0, 0, 0, DateTimeKind.Utc),
                Status = "Completed",
                ReadyItems = new List<ConstructionSnapshotItem>
                {
                    new() { Key = "test_item", Title = "Existing Item", Status = ConstructionItemStatus.Ready }
                },
                SourceReferences = new Phase4SourceVersions
                {
                    MarketStudySessionId = "market-session-1",
                    MarketStudyVersion = 1,
                    ProjectVersion = 1
                }
            };
            journey.Phase4Data.ConstructionSnapshot = existingSnapshot;

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-1", "idea-1")).ReturnsAsync(journey);
            _profStoreMock.Setup(p => p.GetByUserIdAsync("user-1", It.IsAny<CancellationToken>())).ReturnsAsync(BuildReadyProfile());

            // GET
            var getRes = await service.GetSnapshotAsync("user-1", "idea-1");
            getRes.Snapshot.GeneratedAt.Should().Be(new DateTime(2026, 9, 21, 0, 0, 0, DateTimeKind.Utc));

            // Generate should return existing
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, true))
                .ReturnsAsync(new ComputedJourneyStatus { Phase3 = new ComputedPhaseStatus { Status = "completed" } });
            _completenessResolverMock.Setup(r => r.Resolve(It.IsAny<ProfessionalProfileRecord?>()))
                .Returns(new ProfileCompletenessResult(85, true, new List<string>()));

            var genRes = await service.GenerateSnapshotAsync("user-1", "idea-1");
            genRes.Snapshot.GeneratedAt.Should().Be(new DateTime(2026, 9, 21, 0, 0, 0, DateTimeKind.Utc));
            _journeysMock.Verify(j => j.SetPhase4ConstructionSnapshotAsync(It.IsAny<string>(), It.IsAny<ConstructionSnapshot>(), It.IsAny<Phase4SourceVersions>(), It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task Stale_Detection_Detects_When_Source_Versions_Change()
        {
            var service = CreateService();
            var journey = BuildCompletePhase3Journey();
            journey.Phase4Data.ConstructionSnapshot = new ConstructionSnapshot
            {
                SourceReferences = new Phase4SourceVersions
                {
                    ForecastVersion = 1,
                    ForecastSessionId = "forecast-session-1",
                    ProfessionalProfileUpdatedAt = new DateTime(2026, 9, 15, 0, 0, 0, DateTimeKind.Utc)
                }
            };

            // Forecast session is now version 2!
            _forecastsMock.Setup(f => f.GetOwnedAsync("forecast-session-1", "user-1"))
                .ReturnsAsync(new ForecastSession { Id = "forecast-session-1", CurrentVersion = 2, UpdatedAt = DateTime.UtcNow });

            // Profile was updated on Sept 20!
            _profStoreMock.Setup(p => p.GetByUserIdAsync("user-1", It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ProfessionalProfileRecord { UpdatedAt = new DateTime(2026, 9, 20, 0, 0, 0, DateTimeKind.Utc) });

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-1", "idea-1")).ReturnsAsync(journey);

            var res = await service.GetSnapshotAsync("user-1", "idea-1");
            res.UpdateAvailable.Should().BeTrue();
            res.ChangedSources.Should().Contain("Financial Forecast");
            res.ChangedSources.Should().Contain("Professional Profile");
        }

        [Fact]
        public async Task Refresh_Updates_Snapshot_And_Clears_UpdateAvailable()
        {
            var service = CreateService();
            var journey = BuildCompletePhase3Journey();
            var profile = BuildReadyProfile();

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-1", "idea-1")).ReturnsAsync(journey);
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, true))
                .ReturnsAsync(new ComputedJourneyStatus { Phase3 = new ComputedPhaseStatus { Status = "completed" } });
            _profStoreMock.Setup(p => p.GetByUserIdAsync("user-1", It.IsAny<CancellationToken>())).ReturnsAsync(profile);
            _completenessResolverMock.Setup(r => r.Resolve(profile)).Returns(new ProfileCompletenessResult(85, true, new List<string>()));

            _journeysMock.Setup(j => j.SetPhase4ConstructionSnapshotAsync("user-1", It.IsAny<ConstructionSnapshot>(), It.IsAny<Phase4SourceVersions>(), "idea-1"))
                .ReturnsAsync(journey);

            var res = await service.RefreshSnapshotAsync("user-1", "idea-1");
            res.UpdateAvailable.Should().BeFalse();
            res.ChangedSources.Should().BeEmpty();
            _journeysMock.Verify(j => j.SetPhase4ConstructionSnapshotAsync("user-1", It.IsAny<ConstructionSnapshot>(), It.IsAny<Phase4SourceVersions>(), "idea-1"), Times.Once);
        }

        [Fact]
        public async Task NeedsReview_Items_Survive_And_Are_Included_In_PartialCount()
        {
            var service = CreateService();
            var journey = BuildCompletePhase3Journey();
            // Legacy skill with level == null
            var profile = BuildReadyProfile("user-1", new List<ProfileSkill>
            {
                new() { Name = "React", Level = null, Source = "LegacyMigration" }
            });

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-1", "idea-1")).ReturnsAsync(journey);
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, true))
                .ReturnsAsync(new ComputedJourneyStatus { Phase3 = new ComputedPhaseStatus { Status = "completed" } });
            _profStoreMock.Setup(p => p.GetByUserIdAsync("user-1", It.IsAny<CancellationToken>())).ReturnsAsync(profile);
            _completenessResolverMock.Setup(r => r.Resolve(profile)).Returns(new ProfileCompletenessResult(85, true, new List<string>()));

            _journeysMock.Setup(j => j.SetPhase4ConstructionSnapshotAsync("user-1", It.IsAny<ConstructionSnapshot>(), It.IsAny<Phase4SourceVersions>(), "idea-1"))
                .ReturnsAsync(journey);

            var res = await service.GenerateSnapshotAsync("user-1", "idea-1");

            var needsReviewItem = res.Snapshot.PartialItems.FirstOrDefault(i => i.Status == ConstructionItemStatus.NeedsReview);
            needsReviewItem.Should().NotBeNull();
            needsReviewItem!.Status.Should().Be(ConstructionItemStatus.NeedsReview);
            res.PartialCount.Should().Be(res.Snapshot.PartialItems.Count);
        }

        [Fact]
        public async Task Zero_Mutation_Phase3_And_HumainX_Remain_Completely_Unchanged()
        {
            var service = CreateService();
            var journey = BuildCompletePhase3Journey();
            var profile = BuildReadyProfile();

            // Capture pre-state
            var preMarketId = journey.Phase3Data.MarketStudySessionId;
            var preBmId = journey.Phase3Data.BusinessModelSessionId;
            var preForecastId = journey.Phase3Data.ForecastSessionId;
            var prePlanId = journey.Phase3Data.BusinessPlanSessionId;
            var preLegalItemsCount = journey.Phase3Data.LegalChecklist.Items.Count;
            var preSkillCount = profile.Skills.Count;
            var preSituation = profile.VentureContext?.CurrentSituation;

            _journeysMock.Setup(j => j.GetOrCreateComposedAsync("user-1", "idea-1")).ReturnsAsync(journey);
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, true))
                .ReturnsAsync(new ComputedJourneyStatus { Phase3 = new ComputedPhaseStatus { Status = "completed" } });
            _profStoreMock.Setup(p => p.GetByUserIdAsync("user-1", It.IsAny<CancellationToken>())).ReturnsAsync(profile);
            _completenessResolverMock.Setup(r => r.Resolve(profile)).Returns(new ProfileCompletenessResult(85, true, new List<string>()));
            _journeysMock.Setup(j => j.SetPhase4ConstructionSnapshotAsync("user-1", It.IsAny<ConstructionSnapshot>(), It.IsAny<Phase4SourceVersions>(), "idea-1"))
                .ReturnsAsync(journey);

            await service.GenerateSnapshotAsync("user-1", "idea-1");

            // Assert exact equality post-generation
            journey.Phase3Data.MarketStudySessionId.Should().Be(preMarketId);
            journey.Phase3Data.BusinessModelSessionId.Should().Be(preBmId);
            journey.Phase3Data.ForecastSessionId.Should().Be(preForecastId);
            journey.Phase3Data.BusinessPlanSessionId.Should().Be(prePlanId);
            journey.Phase3Data.LegalChecklist.Items.Count.Should().Be(preLegalItemsCount);
            profile.Skills.Count.Should().Be(preSkillCount);
            profile.VentureContext?.CurrentSituation.Should().Be(preSituation);
        }
    }
}
