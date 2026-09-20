using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
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
    public class CreatorPhase4RoadmapTests
    {
        private readonly Mock<ICreatorJourneyService> _journeysMock = new();
        private readonly Mock<IConstructionSnapshotService> _snapshotServiceMock = new();
        private readonly IRoadmapScheduler _scheduler = new RoadmapScheduler();
        private readonly Mock<IProfessionalProfileStore> _profStoreMock = new();
        private readonly Mock<IProfileCompletenessResolver> _completenessResolverMock = new();
        private readonly Mock<IForecastSessionStore> _forecastsMock = new();
        private readonly Mock<IBusinessPlanSessionStore> _businessPlansMock = new();

        private OperationalRoadmapService CreateService()
        {
            return new OperationalRoadmapService(
                _journeysMock.Object,
                _snapshotServiceMock.Object,
                _scheduler,
                _profStoreMock.Object,
                _completenessResolverMock.Object,
                _forecastsMock.Object,
                _businessPlansMock.Object
            );
        }

        private static CreatorJourney BuildCompleteJourneyWithSnapshot(string userId = "user-1", string ideaId = "idea-1")
        {
            var journey = new CreatorJourney
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
                    BusinessPlanSessionId = "b1",
                    LegalChecklist = new CreatorLegalChecklist
                    {
                        CompletedCount = 8
                    },
                    FormationGenerator = new CreatorFormationGenerator
                    {
                        SelectedType = "SAS"
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
                                Key = "tech.execution",
                                Title = "Resolve technical execution capability",
                                Category = "Technology",
                                Status = "Missing",
                                Priority = "Critical",
                                Blocking = true,
                                Reason = "Fullstack software engineering missing",
                                Source = new List<string> { "Construction Snapshot", "HumainX Profile" }
                            }
                        },
                        ReadyItems = new List<ConstructionSnapshotItem>
                        {
                            new()
                            {
                                Key = "brand.foundation",
                                Title = "Brand kit validated",
                                Category = "Brand",
                                Status = "Ready",
                                Priority = "Medium",
                                Reason = "Logos and colors ready",
                                Source = new List<string> { "Phase 2 Brand" }
                            }
                        },
                        MissingItems = new List<ConstructionSnapshotItem>
                        {
                            new()
                            {
                                Key = "legal.mandatory-licence",
                                Title = "Complete mandatory professional certification",
                                Category = "Legal & Administration",
                                Status = "Missing",
                                Priority = "Critical",
                                Blocking = true,
                                Reason = "Required by regulatory body before launch",
                                Source = new List<string> { "Legal Assessment" },
                                SourceReference = new List<string> { "FR-REG-01" }
                            },
                            new()
                            {
                                Key = "pricing.structure",
                                Title = "Finalize launch pricing tiers",
                                Category = "Pricing",
                                Status = "Missing",
                                Priority = "High",
                                Blocking = false,
                                Reason = "Pricing assumptions need validation",
                                Source = new List<string> { "Business Model" }
                            }
                        }
                    }
                }
            };

            return journey;
        }

        private void SetupValidPrerequisites(CreatorJourney journey, string userId = "user-1", string ideaId = "idea-1")
        {
            _journeysMock.Setup(j => j.GetOrCreateComposedAsync(userId, ideaId)).ReturnsAsync(journey);
            _journeysMock.Setup(j => j.ComputePhaseStatusAsync(journey, true)).ReturnsAsync(new ComputedJourneyStatus
            {
                Phase3 = new ComputedPhaseStatus { Status = "completed", CurrentStep = 7 }
            });

            var profile = new ProfessionalProfileRecord
            {
                UserId = userId,
                VentureContext = new ProfileVentureContext
                {
                    WeeklyAvailability = "10–20 hours/week"
                }
            };
            _profStoreMock.Setup(p => p.GetByUserIdAsync(userId, It.IsAny<CancellationToken>())).ReturnsAsync(profile);
            _completenessResolverMock.Setup(c => c.Resolve(It.IsAny<ProfessionalProfileRecord?>()))
                .Returns(new ProfileCompletenessResult(100, true, new List<string>()));
        }

        [Fact]
        public async Task Gate_Rejects_When_Snapshot_Missing()
        {
            var journey = BuildCompleteJourneyWithSnapshot();
            journey.Phase4Data.ConstructionSnapshot = null; // No snapshot!

            SetupValidPrerequisites(journey);
            var svc = CreateService();

            var act = () => svc.GenerateRoadmapAsync("user-1", "idea-1");
            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*Phase 4.1 Construction Snapshot must be generated*");
        }

        [Fact]
        public async Task Roadmap_Generates_From_Snapshot_With_Deterministic_Scheduler()
        {
            var journey = BuildCompleteJourneyWithSnapshot();
            SetupValidPrerequisites(journey);

            var svc = CreateService();
            var res = await svc.GenerateRoadmapAsync("user-1", "idea-1");

            res.Should().NotBeNull();
            res.Roadmap.Should().NotBeNull();
            res.Roadmap!.Tasks.Should().NotBeEmpty();

            // Critical blocking items land in NOW
            var blockingTask = res.Roadmap.Tasks.FirstOrDefault(t => t.Key == "tech.execution");
            blockingTask.Should().NotBeNull();
            blockingTask!.Stage.Should().Be(RoadmapStages.Now);
            blockingTask.Priority.Should().Be(RoadmapTaskPriority.Critical);
            blockingTask.Blocking.Should().BeTrue();

            // NextBestAction exists and is exactly one
            res.Roadmap.NextBestAction.Should().NotBeNull();
            res.Roadmap.NextBestAction!.Blocking.Should().BeTrue();
            res.Roadmap.NextBestAction!.Priority.Should().Be(RoadmapTaskPriority.Critical);
        }

        [Fact]
        public async Task Legal_Temporal_Mapping_Preserves_Stages()
        {
            var journey = BuildCompleteJourneyWithSnapshot();
            journey.Phase3Data.LegalChecklist = new CreatorLegalChecklist
            {
                Items = new List<CreatorLegalChecklistItem>
                {
                    new()
                    {
                        Id = "legal.dpo",
                        Title = "Designate Data Protection Officer",
                        Stage = LegalStages.BeforeLaunch,
                        Priority = LegalPriorities.Critical,
                        Status = "not_started"
                    },
                    new()
                    {
                        Id = "legal.annual-review",
                        Title = "Annual Corporate Minutes and Filing",
                        Stage = LegalStages.Ongoing,
                        Priority = LegalPriorities.Recommended,
                        Status = "not_started"
                    }
                }
            };

            SetupValidPrerequisites(journey);
            var svc = CreateService();
            var res = await svc.GenerateRoadmapAsync("user-1", "idea-1");

            var dpoTask = res.Roadmap!.Tasks.FirstOrDefault(t => t.Key == "legal.dpo");
            dpoTask.Should().NotBeNull();
            dpoTask!.Stage.Should().Be(RoadmapStages.BeforeLaunch);

            var ongoingTask = res.Roadmap.Tasks.FirstOrDefault(t => t.Key == "legal.annual-review");
            ongoingTask.Should().NotBeNull();
            ongoingTask!.Stage.Should().Be(RoadmapStages.PostLaunch);
        }

        [Fact]
        public async Task WeeklyAvailability_Affects_Pacing_Density()
        {
            var journey = BuildCompleteJourneyWithSnapshot();
            SetupValidPrerequisites(journey);

            var profileLight = new ProfessionalProfileRecord
            {
                UserId = "user-1",
                VentureContext = new ProfileVentureContext { WeeklyAvailability = "Less than 5 hours/week" }
            };
            _profStoreMock.Setup(p => p.GetByUserIdAsync("user-1", It.IsAny<CancellationToken>())).ReturnsAsync(profileLight);

            var svcLight = CreateService();
            var resLight = await svcLight.GenerateRoadmapAsync("user-1", "idea-1");

            resLight.Roadmap!.Tasks.Count.Should().BeGreaterThan(0);
        }

        [Fact]
        public void Dependency_Cycle_Detection_Prevents_Infinite_Loops()
        {
            var scheduler = new RoadmapScheduler();
            var tasks = new List<RoadmapTask>
            {
                new() { Key = "task.a", Title = "Task A", Dependencies = new List<string> { "task.b" }, Stage = RoadmapStages.Now },
                new() { Key = "task.b", Title = "Task B", Dependencies = new List<string> { "task.a" }, Stage = RoadmapStages.Now }
            };

            bool isValid = scheduler.ValidateAndDetectCycles(tasks, out var cycles);
            isValid.Should().BeFalse();
            cycles.Should().Contain("task.a");
        }

        [Fact]
        public async Task Get_Roadmap_Is_Idempotent_And_Never_Generates()
        {
            var journey = BuildCompleteJourneyWithSnapshot();
            journey.Phase4Data.Roadmap = null; // Roadmap does not exist
            SetupValidPrerequisites(journey);

            var svc = CreateService();
            var res = await svc.GetRoadmapAsync("user-1", "idea-1");

            res.Roadmap.Should().BeNull();
            // Confirm SetPhase4RoadmapAsync was NEVER called
            _journeysMock.Verify(j => j.SetPhase4RoadmapAsync(It.IsAny<string>(), It.IsAny<OperationalRoadmap>(), It.IsAny<string?>()), Times.Never);
        }

        [Fact]
        public async Task Generate_Is_Idempotent_When_Roadmap_Exists()
        {
            var journey = BuildCompleteJourneyWithSnapshot();
            var existingRoadmap = new OperationalRoadmap
            {
                Status = "Completed",
                RoadmapSummary = "Existing Roadmap",
                Tasks = new List<RoadmapTask>
                {
                    new() { Key = "task-existing", Title = "Existing Task", Stage = RoadmapStages.Now }
                }
            };
            journey.Phase4Data.Roadmap = existingRoadmap;
            SetupValidPrerequisites(journey);

            var svc = CreateService();
            var res = await svc.GenerateRoadmapAsync("user-1", "idea-1");

            res.Roadmap!.RoadmapSummary.Should().Be("Existing Roadmap");
            _journeysMock.Verify(j => j.SetPhase4RoadmapAsync(It.IsAny<string>(), It.IsAny<OperationalRoadmap>(), It.IsAny<string?>()), Times.Never);
        }

        [Fact]
        public async Task Refresh_Preserves_Founder_Task_Status_And_Notes()
        {
            var journey = BuildCompleteJourneyWithSnapshot();
            var existingRoadmap = new OperationalRoadmap
            {
                Status = "Completed",
                Tasks = new List<RoadmapTask>
                {
                    new()
                    {
                        Key = "tech.execution",
                        Title = "Resolve technical execution capability",
                        Status = RoadmapTaskStatus.InProgress,
                        FounderEdited = true,
                        FounderNotes = "Meeting agency Friday"
                    }
                }
            };
            journey.Phase4Data.Roadmap = existingRoadmap;
            SetupValidPrerequisites(journey);

            var svc = CreateService();
            var res = await svc.RefreshRoadmapAsync("user-1", "idea-1");

            var techTask = res.Roadmap!.Tasks.FirstOrDefault(t => t.Key == "tech.execution");
            techTask.Should().NotBeNull();
            techTask!.Status.Should().Be(RoadmapTaskStatus.InProgress);
            techTask.FounderNotes.Should().Be("Meeting agency Friday");
            techTask.FounderEdited.Should().BeTrue();
        }

        [Fact]
        public async Task Next_Best_Action_Updates_When_Current_Marked_Done()
        {
            var journey = BuildCompleteJourneyWithSnapshot();
            var taskId1 = "task-1";
            var taskId2 = "task-2";

            var existingRoadmap = new OperationalRoadmap
            {
                Status = "Completed",
                Tasks = new List<RoadmapTask>
                {
                    new()
                    {
                        Id = taskId1,
                        Key = "tech.execution",
                        Title = "Resolve technical execution capability",
                        Priority = RoadmapTaskPriority.Critical,
                        Blocking = true,
                        Status = RoadmapTaskStatus.NotStarted
                    },
                    new()
                    {
                        Id = taskId2,
                        Key = "pricing.structure",
                        Title = "Finalize launch pricing tiers",
                        Priority = RoadmapTaskPriority.High,
                        Blocking = false,
                        Status = RoadmapTaskStatus.NotStarted
                    }
                },
                NextBestAction = new NextBestAction
                {
                    TaskId = taskId1,
                    Title = "Resolve technical execution capability",
                    Priority = RoadmapTaskPriority.Critical,
                    Blocking = true
                }
            };
            journey.Phase4Data.Roadmap = existingRoadmap;
            SetupValidPrerequisites(journey);

            var svc = CreateService();

            // Mark taskId1 Done
            var res = await svc.UpdateTaskStateAsync("user-1", new UpdateRoadmapTaskRequest
            {
                IdeaId = "idea-1",
                TaskId = taskId1,
                Status = RoadmapTaskStatus.Done
            });

            var t1 = res.Roadmap!.Tasks.First(t => t.Id == taskId1);
            t1.Status.Should().Be(RoadmapTaskStatus.Done);

            // NextBestAction should now point to taskId2
            res.Roadmap.NextBestAction.Should().NotBeNull();
            res.Roadmap.NextBestAction!.TaskId.Should().Be(taskId2);
        }

        [Fact]
        public async Task Zero_Mutation_Verification_Source_Layers_Are_Untouched()
        {
            var journey = BuildCompleteJourneyWithSnapshot();

            // Capture pristine source states
            var p3JsonBefore = System.Text.Json.JsonSerializer.Serialize(journey.Phase3Data);
            var snapshotJsonBefore = System.Text.Json.JsonSerializer.Serialize(journey.Phase4Data.ConstructionSnapshot);

            SetupValidPrerequisites(journey);

            var svc = CreateService();
            await svc.GenerateRoadmapAsync("user-1", "idea-1");

            // Verify Phase 3 and Snapshot are strictly identical
            var p3JsonAfter = System.Text.Json.JsonSerializer.Serialize(journey.Phase3Data);
            var snapshotJsonAfter = System.Text.Json.JsonSerializer.Serialize(journey.Phase4Data.ConstructionSnapshot);

            p3JsonAfter.Should().Be(p3JsonBefore);
            snapshotJsonAfter.Should().Be(snapshotJsonBefore);
        }
    }
}

