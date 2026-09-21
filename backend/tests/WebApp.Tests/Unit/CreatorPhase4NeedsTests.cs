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
using WebApp.Models.Phase4;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class CreatorPhase4NeedsTests
    {
        private readonly Mock<ICreatorJourneyService> _journeysMock = new();
        private readonly Mock<IConstructionSnapshotService> _snapshotServiceMock = new();
        private readonly Mock<IOperationalRoadmapService> _roadmapServiceMock = new();
        private readonly ICapabilityMatcher _capabilityMatcher = new CapabilityMatcher();
        private readonly Mock<IProfessionalProfileStore> _profStoreMock = new();
        private readonly Mock<IProfileCompletenessResolver> _completenessResolverMock = new();
        private readonly Mock<IMarketStudySessionStore> _marketStudiesMock = new();
        private readonly Mock<IBusinessModelSessionStore> _businessModelsMock = new();
        private readonly Mock<IForecastSessionStore> _forecastsMock = new();
        private readonly Mock<IBusinessPlanSessionStore> _businessPlansMock = new();

        private NeedsAnalysisService CreateService()
        {
            return new NeedsAnalysisService(
                _journeysMock.Object,
                _snapshotServiceMock.Object,
                _roadmapServiceMock.Object,
                _capabilityMatcher,
                _profStoreMock.Object,
                _completenessResolverMock.Object,
                _marketStudiesMock.Object,
                _businessModelsMock.Object,
                _forecastsMock.Object,
                _businessPlansMock.Object
            );
        }

        private static CreatorJourney BuildCompleteJourney(string userId = "user-1", string ideaId = "idea-1")
        {
            return new CreatorJourney
            {
                UserId = userId,
                ActiveIdeaId = ideaId,
                Project = new CreatorJourneyProject
                {
                    Name = "SaaS Metrics Pro",
                    Concept = "Analytics platform",
                    Sector = "Software",
                    Category = "SaaS",
                    CurrentVersion = 1
                },
                Phase3Data = new CreatorPhase3Data
                {
                    ForecastSessionId = "f1",
                    BusinessModelSessionId = "bm1",
                    BusinessPlanSessionId = "bp1",
                    LegalAssessment = new CreatorLegalAssessment
                    {
                        EvaluatedAt = DateTime.UtcNow,
                        Items = new List<CreatorLegalChecklistItem>
                        {
                            new() { Id = "FR-CORP-001", Title = "Dépôt capital social", Status = "pending", Priority = "critical" },
                            new() { Id = "FR-IP-001", Title = "Dépôt marque INPI", Status = "pending", Priority = "medium" }
                        }
                    },
                    FormationGenerator = new CreatorFormationGenerator
                    {
                        SelectedType = "SAS",
                        YouHave = new List<string> { "Product Design" },
                        YouNeed = new List<CreatorSkillGap>
                        {
                            new() { Label = "Web / Software Development", SpSpecialty = "development" }
                        }
                    }
                },
                Phase4Data = new CreatorPhase4Data
                {
                    ConstructionSnapshot = new ConstructionSnapshot
                    {
                        Status = "Completed",
                        GeneratedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        CriticalItems = new List<ConstructionSnapshotItem>
                        {
                            new()
                            {
                                Key = "skills.software-development",
                                Category = ConstructionCategories.Skills,
                                Title = "Web / Software Development",
                                Status = ConstructionItemStatus.Critical,
                                Priority = ConstructionItemPriority.Critical,
                                Blocking = true,
                                Reason = "No software engineer declared."
                            }
                        }
                    },
                    Roadmap = new OperationalRoadmap
                    {
                        Status = "Active",
                        GeneratedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        Tasks = new List<RoadmapTask>
                        {
                            new()
                            {
                                Key = "tech.build-core-engine",
                                Title = "Build Core Engine",
                                Category = RoadmapCategories.Technology,
                                Stage = RoadmapStages.Now,
                                Priority = RoadmapTaskPriority.Critical,
                                Blocking = true,
                                RequiresExternalAction = true
                            }
                        }
                    }
                }
            };
        }

        private void SetupValidPrerequisites(CreatorJourney journey)
        {
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(journey.UserId, journey.ActiveIdeaId))
                .ReturnsAsync(journey);

            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, true))
                .ReturnsAsync(new ComputedJourneyStatus
                {
                    Phase3 = new ComputedPhaseStatus { Status = "completed" }
                });

            _completenessResolverMock.Setup(r => r.Resolve(It.IsAny<ProfessionalProfileRecord>()))
                .Returns(new ProfileCompletenessResult(100, true, new List<string>()));

            _snapshotServiceMock.Setup(s => s.GetSnapshotAsync(journey.UserId, journey.ActiveIdeaId))
                .ReturnsAsync(new ConstructionSnapshotResponse
                {
                    Snapshot = journey.Phase4Data!.ConstructionSnapshot!,
                    UpdateAvailable = false
                });

            _roadmapServiceMock.Setup(r => r.GetRoadmapAsync(journey.UserId, journey.ActiveIdeaId))
                .ReturnsAsync(new OperationalRoadmapResponse
                {
                    Roadmap = journey.Phase4Data!.Roadmap!,
                    UpdateAvailable = false
                });

            _journeysMock.Setup(j => j.SetPhase4NeedsAnalysisAsync(journey.UserId, It.IsAny<NeedsAnalysis>(), journey.ActiveIdeaId))
                .ReturnsAsync((string u, NeedsAnalysis n, string i) =>
                {
                    journey.Phase4Data!.NeedsAnalysis = n;
                    return journey;
                });
        }

        [Fact]
        public async Task Gate_Blocks_If_Snapshot_Missing()
        {
            var journey = BuildCompleteJourney();
            SetupValidPrerequisites(journey);
            _snapshotServiceMock.Setup(s => s.GetSnapshotAsync(journey.UserId, journey.ActiveIdeaId))
                .ReturnsAsync(new ConstructionSnapshotResponse { Snapshot = null!, UpdateAvailable = false });

            var svc = CreateService();
            var act = () => svc.GenerateNeedsAnalysisAsync(journey.UserId, journey.ActiveIdeaId);

            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*SNAPSHOT_MISSING*");
        }

        [Fact]
        public async Task Gate_Blocks_If_Roadmap_Missing()
        {
            var journey = BuildCompleteJourney();
            SetupValidPrerequisites(journey);
            _roadmapServiceMock.Setup(r => r.GetRoadmapAsync(journey.UserId, journey.ActiveIdeaId))
                .ReturnsAsync(new OperationalRoadmapResponse { Roadmap = null, UpdateAvailable = false });

            var svc = CreateService();
            var act = () => svc.GenerateNeedsAnalysisAsync(journey.UserId, journey.ActiveIdeaId);

            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*ROADMAP_MISSING*");
        }

        [Fact]
        public async Task Gate_Blocks_If_Snapshot_Stale()
        {
            var journey = BuildCompleteJourney();
            SetupValidPrerequisites(journey);
            _snapshotServiceMock.Setup(s => s.GetSnapshotAsync(journey.UserId, journey.ActiveIdeaId))
                .ReturnsAsync(new ConstructionSnapshotResponse
                {
                    Snapshot = journey.Phase4Data!.ConstructionSnapshot!,
                    UpdateAvailable = true,
                    ChangedSources = new List<string> { "Business Model" }
                });

            var svc = CreateService();
            var act = () => svc.GenerateNeedsAnalysisAsync(journey.UserId, journey.ActiveIdeaId);

            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*SNAPSHOT_REFRESH_REQUIRED*");
        }

        [Fact]
        public async Task Gate_Blocks_If_Roadmap_Stale()
        {
            var journey = BuildCompleteJourney();
            SetupValidPrerequisites(journey);
            _roadmapServiceMock.Setup(r => r.GetRoadmapAsync(journey.UserId, journey.ActiveIdeaId))
                .ReturnsAsync(new OperationalRoadmapResponse
                {
                    Roadmap = journey.Phase4Data!.Roadmap!,
                    UpdateAvailable = true,
                    ChangedSources = new List<string> { "Construction Snapshot" }
                });

            var svc = CreateService();
            var act = () => svc.GenerateNeedsAnalysisAsync(journey.UserId, journey.ActiveIdeaId);

            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*ROADMAP_REFRESH_REQUIRED*");
        }

        [Fact]
        public async Task Needs_Generate_When_Prerequisites_Exist()
        {
            var journey = BuildCompleteJourney();
            SetupValidPrerequisites(journey);

            var svc = CreateService();
            var result = await svc.GenerateNeedsAnalysisAsync(journey.UserId, journey.ActiveIdeaId);

            result.Should().NotBeNull();
            result.NeedsAnalysis.Should().NotBeNull();
            result.NeedsAnalysis!.Status.Should().Be("Completed");
            result.TotalActiveNeeds.Should().BeGreaterThan(0);
        }

        [Fact]
        public async Task Snapshot_Critical_Item_Creates_Corresponding_Need()
        {
            var journey = BuildCompleteJourney();
            SetupValidPrerequisites(journey);

            var svc = CreateService();
            var result = await svc.GenerateNeedsAnalysisAsync(journey.UserId, journey.ActiveIdeaId);

            var techNeed = result.NeedsAnalysis!.ActiveNeeds
                .FirstOrDefault(n => n.Key.Contains("skills-software-development") || n.Key.Contains("team.skills-software-development"));

            techNeed.Should().NotBeNull();
            techNeed!.Priority.Should().Be(NeedPriority.Critical);
            techNeed.RequirementType.Should().Be(RequirementTypes.Capability);
            techNeed.Source.Should().Contain("Construction Snapshot");
        }

        [Fact]
        public async Task Roadmap_Requirement_Contributes_Timing()
        {
            var journey = BuildCompleteJourney();
            journey.Phase4Data!.Roadmap!.Tasks.Add(new RoadmapTask
            {
                Key = "marketing.launch-prep",
                Title = "Prepare Launch Marketing",
                Category = RoadmapCategories.GoToMarket,
                Stage = RoadmapStages.Next30Days,
                Priority = RoadmapTaskPriority.High,
                RequiresExternalAction = true
            });
            SetupValidPrerequisites(journey);

            var svc = CreateService();
            var result = await svc.GenerateNeedsAnalysisAsync(journey.UserId, journey.ActiveIdeaId);

            var mktNeed = result.NeedsAnalysis!.ActiveNeeds.FirstOrDefault(n => n.Key == "roadmap.marketing-launch-prep");
            mktNeed.Should().NotBeNull();
            mktNeed!.Timing.Should().Be(NeedTiming.Next30Days);
            mktNeed.Category.Should().Be(NeedCategories.Marketing);
        }

        [Fact]
        public async Task Critical_False_Positive_Prevention_When_Founder_Has_Skill()
        {
            var journey = BuildCompleteJourney();
            SetupValidPrerequisites(journey);

            // Founder declared React at Comfortable level
            _profStoreMock.Setup(p => p.GetByUserIdAsync(journey.UserId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ProfessionalProfileRecord
                {
                    UserId = journey.UserId,
                    Skills = new List<ProfileSkill>
                    {
                        new() { Name = "React", Level = "Comfortable", Source = "SelfDeclared" }
                    }
                });

            var svc = CreateService();
            var result = await svc.GenerateNeedsAnalysisAsync(journey.UserId, journey.ActiveIdeaId);

            // Development capability must NOT be in active missing needs
            var activeDevNeed = result.NeedsAnalysis!.ActiveNeeds
                .FirstOrDefault(n => n.Key.Contains("skills-software-development"));
            activeDevNeed.Should().BeNull();

            // Instead, it must be in CoveredRequirements as Satisfied
            var coveredDevNeed = result.NeedsAnalysis.CoveredRequirements
                .FirstOrDefault(n => n.Key.Contains("skills-software-development"));
            coveredDevNeed.Should().NotBeNull();
            coveredDevNeed!.SystemStatus.Should().Be(NeedSystemStatus.Satisfied);
        }

        [Fact]
        public async Task Team_Coverage_Prevents_False_Positive_Need()
        {
            var journey = BuildCompleteJourney();
            // Founder has no technical skill, but formation YouHave has technical co-founder
            journey.Phase3Data!.FormationGenerator!.YouHave = new List<string> { "Technical Co-founder" };
            SetupValidPrerequisites(journey);

            var svc = CreateService();
            var result = await svc.GenerateNeedsAnalysisAsync(journey.UserId, journey.ActiveIdeaId);

            // Software development should be marked covered / in CoveredRequirements
            var activeDevNeed = result.NeedsAnalysis!.ActiveNeeds
                .FirstOrDefault(n => n.Key.Contains("skills-software-development"));
            activeDevNeed.Should().BeNull();

            var coveredDevNeed = result.NeedsAnalysis.CoveredRequirements
                .FirstOrDefault(n => n.Key.Contains("skills-software-development"));
            coveredDevNeed.Should().NotBeNull();
            coveredDevNeed!.SystemStatus.Should().Be(NeedSystemStatus.Satisfied);
        }

        [Fact]
        public async Task Finance_Need_Uses_Forecast_Values_Without_Inventing_Budget()
        {
            var journey = BuildCompleteJourney();
            SetupValidPrerequisites(journey);

            _forecastsMock.Setup(f => f.GetOwnedAsync("f1", journey.UserId))
                .ReturnsAsync(new ForecastSession
                {
                    Id = "f1",
                    CurrentVersion = 2,
                    Inputs = new ForecastInputs { Opex = 3750 } // 3750 * 12 = 45000
                });

            var svc = CreateService();
            var result = await svc.GenerateNeedsAnalysisAsync(journey.UserId, journey.ActiveIdeaId);

            var finNeed = result.NeedsAnalysis!.ActiveNeeds.FirstOrDefault(n => n.Key == "finance.launch-capital");
            finNeed.Should().NotBeNull();
            finNeed!.EstimatedBudget.Should().Be(45000m);
            finNeed.BudgetConfidence.Should().Be(BudgetConfidence.DerivedFromForecast);
        }

        [Fact]
        public async Task No_Premature_Training_Category_For_Generic_Missing_Skill()
        {
            var journey = BuildCompleteJourney();
            SetupValidPrerequisites(journey);

            var svc = CreateService();
            var result = await svc.GenerateNeedsAnalysisAsync(journey.UserId, journey.ActiveIdeaId);

            // The missing software capability should stay under Team, RequirementType = Capability (NOT TrainingCandidate)
            var devNeed = result.NeedsAnalysis!.ActiveNeeds
                .FirstOrDefault(n => n.Key.Contains("skills-software-development"));

            devNeed.Should().NotBeNull();
            devNeed!.Category.Should().Be(NeedCategories.Team);
            devNeed.RequirementType.Should().Be(RequirementTypes.Capability);
        }

        [Fact]
        public async Task Refresh_Preserves_Founder_State()
        {
            var journey = BuildCompleteJourney();
            SetupValidPrerequisites(journey);

            var svc = CreateService();
            // 1. Initial generation
            var initRes = await svc.GenerateNeedsAnalysisAsync(journey.UserId, journey.ActiveIdeaId);

            // 2. Founder edits accounting need
            await svc.UpdateNeedStateAsync(journey.UserId, "service.accounting-support", new UpdateNeedStateRequest
            {
                IdeaId = journey.ActiveIdeaId,
                FounderState = NeedFounderState.Confirmed,
                Notes = "Meeting accountant on Friday",
                CustomBudget = 500m,
                CustomTiming = "Immediate"
            });

            // 3. Explicit refresh
            var refreshRes = await svc.RefreshNeedsAnalysisAsync(journey.UserId, journey.ActiveIdeaId);

            var acctNeed = refreshRes.NeedsAnalysis!.ActiveNeeds
                .FirstOrDefault(n => n.Key == "service.accounting-support");

            acctNeed.Should().NotBeNull();
            acctNeed!.FounderState.Should().Be(NeedFounderState.Confirmed);
            acctNeed.Notes.Should().Be("Meeting accountant on Friday");
            acctNeed.CustomBudget.Should().Be(500m);
            acctNeed.CustomTiming.Should().Be("Immediate");
            acctNeed.FounderEdited.Should().BeTrue();
        }

        [Fact]
        public async Task Single_Source_Of_Truth_No_Dual_Write()
        {
            var journey = BuildCompleteJourney();
            SetupValidPrerequisites(journey);

            var svc = CreateService();
            await svc.GenerateNeedsAnalysisAsync(journey.UserId, journey.ActiveIdeaId);

            // SetPhase4NeedsAnalysisAsync should be called on ICreatorJourneyService (persisting to CreatorJourney only)
            _journeysMock.Verify(j => j.SetPhase4NeedsAnalysisAsync(journey.UserId, It.IsAny<NeedsAnalysis>(), journey.ActiveIdeaId), Times.Once);
        }

        [Fact]
        public async Task Zero_Mutation_Check_Upstream_Sources_Unmodified()
        {
            var journey = BuildCompleteJourney();
            var origPhase3 = journey.Phase3Data!;
            var origSnapshot = journey.Phase4Data!.ConstructionSnapshot!;
            var origRoadmap = journey.Phase4Data!.Roadmap!;
            SetupValidPrerequisites(journey);

            var svc = CreateService();
            await svc.GenerateNeedsAnalysisAsync(journey.UserId, journey.ActiveIdeaId);

            // Upstream references remain identical
            journey.Phase3Data.Should().BeSameAs(origPhase3);
            journey.Phase4Data!.ConstructionSnapshot.Should().BeSameAs(origSnapshot);
            journey.Phase4Data!.Roadmap.Should().BeSameAs(origRoadmap);
        }
    }
}
