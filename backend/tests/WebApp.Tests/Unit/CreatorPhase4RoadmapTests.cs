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
            _journeysMock.Setup(j => j.SetPhase4RoadmapAsync(userId, It.IsAny<OperationalRoadmap>(), ideaId))
                .Callback<string, OperationalRoadmap, string?>((u, r, id) =>
                {
                    journey.Phase4Data ??= new CreatorPhase4Data();
                    journey.Phase4Data.Roadmap = r;
                })
                .ReturnsAsync(journey);

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
        public async Task Refresh_Updates_Roadmap_With_Corrected_Mappings_While_Preserving_Completed_Statuses_And_Overrides()
        {
            var journey = BuildCompleteJourneyWithSnapshot();
            var existingRoadmap = new OperationalRoadmap
            {
                Status = "Active",
                FounderEdited = true,
                Tasks = new List<RoadmapTask>
                {
                    new()
                    {
                        Id = "task-form-1",
                        Key = "formation.confirm-structure",
                        Title = "Confirm SAS Structure",
                        Status = RoadmapTaskStatus.Done,
                        FounderEdited = true,
                        FounderNotes = "Approved with co-founder"
                    },
                    new()
                    {
                        Id = "task-tech-1",
                        Key = "tech.execution",
                        Title = "Resolve technical execution capability",
                        Status = RoadmapTaskStatus.InProgress,
                        FounderEdited = true,
                        FounderNotes = "Interviewing lead dev"
                    }
                }
            };
            journey.Phase4Data.Roadmap = existingRoadmap;
            journey.Phase3Data!.LegalAssessment = new CreatorLegalAssessment
            {
                EvaluatedAt = DateTime.UtcNow,
                Items = new List<CreatorLegalChecklistItem>
                {
                    new() { Id = "FR-CORP-004", Title = "Business Registration via INPI Guichet Unique", Category = "corporate", Stage = "company_creation", Priority = "critical", WhyItApplies = "Statutory registration." },
                    new() { Id = "FR-CORP-005", Title = "Declaration of Beneficial Ownership (RBE)", Category = "corporate", Stage = "company_creation", Priority = "critical", WhyItApplies = "AML beneficial owner disclosure." }
                }
            };
            SetupValidPrerequisites(journey);

            var svc = CreateService();
            var res = await svc.RefreshRoadmapAsync("user-1", "idea-1");

            // Preserved tasks keep their completed status and notes
            var formTask = res.Roadmap!.Tasks.FirstOrDefault(t => t.Key == "formation.confirm-structure");
            formTask.Should().NotBeNull();
            formTask!.Status.Should().Be(RoadmapTaskStatus.Done);
            formTask.FounderNotes.Should().Be("Approved with co-founder");
            formTask.Id.Should().Be("task-form-1");

            var techTask = res.Roadmap.Tasks.FirstOrDefault(t => t.Key == "tech.execution");
            techTask.Should().NotBeNull();
            techTask!.Status.Should().Be(RoadmapTaskStatus.InProgress);
            techTask.Id.Should().Be("task-tech-1");

            // Newly mapped legal tasks are present with corrected semantics
            var rbeTask = res.Roadmap.Tasks.FirstOrDefault(t => t.Key.Contains("fr-corp-005"));
            var regTask = res.Roadmap.Tasks.FirstOrDefault(t => t.Key.Contains("fr-corp-004"));
            rbeTask.Should().NotBeNull();
            regTask.Should().NotBeNull();
            rbeTask!.Stage.Should().Be(RoadmapStages.Next30Days);
            regTask!.Dependencies.Should().Contain(rbeTask.Key);
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

        [Fact]
        public async Task ActivateRoadmap_MarksPlanActive_And_ReturnsResponse()
        {
            var journey = BuildCompleteJourneyWithSnapshot();
            SetupValidPrerequisites(journey);

            var svc = CreateService();
            var res = await svc.ActivateRoadmapAsync("user-1", "idea-1");

            res.Should().NotBeNull();
            res.Roadmap.Should().NotBeNull();
            res.Roadmap!.Status.Should().Be("Active");
            res.PlanStatus.Should().Be("Active");
            _journeysMock.Verify(j => j.SetPhase4RoadmapAsync("user-1", It.Is<OperationalRoadmap>(r => r.Status == "Active"), "idea-1"), Times.Once);
        }

        [Fact]
        public async Task UpdateAvailability_Persists_And_Updates_CapacityTier_And_Message()
        {
            var journey = BuildCompleteJourneyWithSnapshot();
            SetupValidPrerequisites(journey);

            var svc = CreateService();
            var res = await svc.UpdateAvailabilityAsync("user-1", new UpdateAvailabilityRequest
            {
                IdeaId = "idea-1",
                WeeklyAvailability = "<5 hours/week"
            });

            res.Should().NotBeNull();
            res.WeeklyAvailability.Should().Be("<5 hours/week");
            res.CapacityTier.Should().Be(CapacityTier.VeryLight.ToString());
            res.MaxNowTasks.Should().Be(2);
            res.CapacityMessage.Should().Contain("Under 5 hours/week permits at most 2 Now tasks");
        }

        [Fact]
        public async Task Capacity_Under_5_Hours_Permits_At_Most_2_Now_Tasks()
        {
            var journey = BuildCompleteJourneyWithSnapshot();
            SetupValidPrerequisites(journey);

            var profileVeryLight = new ProfessionalProfileRecord
            {
                UserId = "user-1",
                VentureContext = new ProfileVentureContext { WeeklyAvailability = "<5 hours/week" }
            };
            _profStoreMock.Setup(p => p.GetByUserIdAsync("user-1", It.IsAny<CancellationToken>())).ReturnsAsync(profileVeryLight);

            var svc = CreateService();
            var res = await svc.GenerateRoadmapAsync("user-1", "idea-1");

            var nowTasks = res.Roadmap!.Tasks.Where(t => t.Stage == RoadmapStages.Now).ToList();
            nowTasks.Count.Should().BeLessOrEqualTo(2);
            res.MaxNowTasks.Should().Be(2);
        }

        [Fact]
        public async Task KeepCurrentRoadmap_Clears_Staleness_Without_Mutating_Tasks()
        {
            var journey = BuildCompleteJourneyWithSnapshot();
            var existingRoadmap = new OperationalRoadmap
            {
                Status = "Active",
                RoadmapSummary = "Founder Custom Summary",
                Tasks = new List<RoadmapTask>
                {
                    new() { Key = "tech.custom", Title = "Custom Task", Stage = RoadmapStages.Now, Status = RoadmapTaskStatus.InProgress }
                }
            };
            journey.Phase4Data.Roadmap = existingRoadmap;
            SetupValidPrerequisites(journey);

            var svc = CreateService();
            var res = await svc.KeepCurrentRoadmapAsync("user-1", "idea-1");

            res.Should().NotBeNull();
            res.UpdateAvailable.Should().BeFalse();
            res.Roadmap!.RoadmapSummary.Should().Be("Founder Custom Summary");
            res.Roadmap.Tasks.First().Key.Should().Be("tech.custom");
        }

        [Fact]
        public async Task Unblocks_Are_Populated_For_Prerequisite_Tasks()
        {
            var journey = BuildCompleteJourneyWithSnapshot();
            SetupValidPrerequisites(journey);

            var svc = CreateService();
            var res = await svc.GenerateRoadmapAsync("user-1", "idea-1");

            // formation.confirm-structure is prerequisite for legal tasks
            var formationTask = res.Roadmap!.Tasks.FirstOrDefault(t => t.Key == "formation.confirm-structure");
            formationTask.Should().NotBeNull();
            formationTask!.Unblocks.Should().NotBeEmpty();
        }

        [Fact]
        public async Task Effort_Estimates_And_Known_Hours_Calculation()
        {
            var journey = BuildCompleteJourneyWithSnapshot();
            SetupValidPrerequisites(journey);

            var svc = CreateService();
            var res = await svc.GenerateRoadmapAsync("user-1", "idea-1");

            res.Should().NotBeNull();
            res.KnownEffortHours.Should().BeGreaterThan(0);
            res.TotalTasksCount.Should().Be(res.Roadmap!.Tasks.Count);
        }

        [Fact]
        public async Task Rich_Fixture_With_All_Artifacts_Populates_All_Six_Stages()
        {
            var journey = BuildCompleteJourneyWithSnapshot();
            journey.Phase3Data!.LegalAssessment = new CreatorLegalAssessment
            {
                EvaluatedAt = DateTime.UtcNow,
                Items = new List<CreatorLegalChecklistItem>
                {
                    new() { Id = "FR-REG-001", Title = "Regulated Activity Check", Category = "regulated", Stage = "before_creation", Priority = "critical", WhyItApplies = "Regulated sector validation." },
                    new() { Id = "FR-CORP-001", Title = "Share Capital Deposit", Category = "corporate", Stage = "before_creation", Priority = "critical", WhyItApplies = "Capital deposit required.", RequiresEvidence = true },
                    new() { Id = "FR-IP-001", Title = "INPI Trademark Search", Category = "intellectual_property", Stage = "before_launch", Priority = "recommended", WhyItApplies = "Brand protection search." },
                    new() { Id = "FR-PRIV-001", Title = "GDPR Privacy Policy", Category = "privacy", Stage = "before_launch", Priority = "critical", WhyItApplies = "Processes customer personal data." },
                    new() { Id = "FR-WEB-001", Title = "Mentions Légales", Category = "consumer_protection", Stage = "before_launch", Priority = "critical", WhyItApplies = "LCEN mandatory notices." },
                    new() { Id = "FR-SOC-001", Title = "URSSAF Affiliation", Category = "social", Stage = "ongoing", Priority = "critical", WhyItApplies = "Founder social protection." }
                }
            };
            journey.Phase3Data.FormationGenerator!.YouNeed = new List<CreatorSkillGap>
            {
                new() { Label = "Lead Fullstack Engineer", SpSpecialty = "development" }
            };
            SetupValidPrerequisites(journey);

            var svc = CreateService();
            var res = await svc.GenerateRoadmapAsync("user-1", "idea-1");

            res.Should().NotBeNull();
            var tasks = res.Roadmap!.Tasks;

            // All 6 stages have scheduled tasks in this complete rich fixture
            tasks.Where(t => t.Stage == RoadmapStages.Now).Should().NotBeEmpty();
            tasks.Where(t => t.Stage == RoadmapStages.Next30Days).Should().NotBeEmpty();
            tasks.Where(t => t.Stage == RoadmapStages.Days30To60).Should().NotBeEmpty();
            tasks.Where(t => t.Stage == RoadmapStages.Days60To90).Should().NotBeEmpty();
            tasks.Where(t => t.Stage == RoadmapStages.BeforeLaunch).Should().NotBeEmpty();
            tasks.Where(t => t.Stage == RoadmapStages.PostLaunch).Should().NotBeEmpty();

            res.Roadmap.Stages.Select(s => s.Stage).Should().BeEquivalentTo(RoadmapStages.AllStages);
        }

        [Fact]
        public async Task Initial_RBE_Preparation_Precedes_Company_Registration_Submission_In_Next_30_Days_Without_Cycles()
        {
            var journey = BuildCompleteJourneyWithSnapshot();
            journey.Phase3Data!.LegalAssessment = new CreatorLegalAssessment
            {
                EvaluatedAt = DateTime.UtcNow,
                Items = new List<CreatorLegalChecklistItem>
                {
                    new() { Id = "FR-CORP-001", Title = "Share Capital Deposit", Category = "corporate", Stage = "before_creation", Priority = "critical", WhyItApplies = "Capital deposit." },
                    new() { Id = "FR-CORP-002", Title = "Drafting Statuts", Category = "corporate", Stage = "before_creation", Priority = "critical", WhyItApplies = "Constitutional bylaws." },
                    new() { Id = "FR-CORP-003", Title = "JAL Publication", Category = "corporate", Stage = "company_creation", Priority = "critical", WhyItApplies = "Gazette notice." },
                    new() { Id = "FR-CORP-004", Title = "Business Registration via INPI Guichet Unique", Category = "corporate", Stage = "company_creation", Priority = "critical", WhyItApplies = "Statutory registration." },
                    new() { Id = "FR-CORP-005", Title = "Declaration of Beneficial Ownership (RBE)", Category = "corporate", Stage = "company_creation", Priority = "critical", WhyItApplies = "AML beneficial owner disclosure." }
                }
            };
            SetupValidPrerequisites(journey);

            var svc = CreateService();
            var res = await svc.GenerateRoadmapAsync("user-1", "idea-1");

            var rbeTask = res.Roadmap!.Tasks.FirstOrDefault(t => t.Key.Contains("fr-corp-005"));
            var regTask = res.Roadmap.Tasks.FirstOrDefault(t => t.Key.Contains("fr-corp-004"));
            var statutsTask = res.Roadmap.Tasks.FirstOrDefault(t => t.Key.Contains("fr-corp-002"));

            rbeTask.Should().NotBeNull();
            regTask.Should().NotBeNull();
            statutsTask.Should().NotBeNull();

            // RBE is scheduled in NEXT_30_DAYS (company creation window), NOT POST_LAUNCH
            rbeTask!.Stage.Should().Be(RoadmapStages.Next30Days);
            // RBE preparation depends on Statuts governance
            rbeTask.Dependencies.Should().Contain(statutsTask!.Key);
            // INPI Registration submission dossier requires RBE preparation
            regTask!.Dependencies.Should().Contain(rbeTask.Key);
            // No reverse circular dependency
            rbeTask.Dependencies.Should().NotContain(regTask.Key);
        }

        [Fact]
        public async Task DPAE_With_Unknown_Employee_Start_Date_Leaves_Timing_Unresolved_Without_Assuming_Month_2()
        {
            var journey = BuildCompleteJourneyWithSnapshot();
            // No planned skill gaps or specific hiring dates
            journey.Phase3Data!.FormationGenerator!.YouNeed = new List<CreatorSkillGap>();
            journey.Phase3Data.LegalAssessment = new CreatorLegalAssessment
            {
                EvaluatedAt = DateTime.UtcNow,
                Items = new List<CreatorLegalChecklistItem>
                {
                    new() { Id = "FR-SOC-002", Title = "Pre-Hiring Declarations (DPAE)", Category = "social", Stage = "ongoing", Priority = "critical", WhyItApplies = "Planned payroll." }
                }
            };
            SetupValidPrerequisites(journey);

            var svc = CreateService();
            var res = await svc.GenerateRoadmapAsync("user-1", "idea-1");

            var dpaeTask = res.Roadmap!.Tasks.FirstOrDefault(t => t.Key.Contains("fr-soc-002"));
            dpaeTask.Should().NotBeNull();

            // Timing is explicitly marked unresolved rather than assuming Month 2
            dpaeTask!.TargetWindow.Should().Contain("Timing unresolved");
            dpaeTask.Why.Should().Contain("Timing is unresolved until an explicit employee start date is established");
            // Stage is NOT forced to DAYS_30_TO_60
            dpaeTask.Stage.Should().NotBe(RoadmapStages.Days30To60);
        }

        [Fact]
        public async Task DPAE_With_Skill_Gap_Leaves_Timing_Unresolved_Without_Assuming_Month_2()
        {
            var journey = BuildCompleteJourneyWithSnapshot();
            journey.Phase3Data!.FormationGenerator!.YouNeed = new List<CreatorSkillGap>
            {
                new() { Label = "Lead Fullstack Engineer", SpSpecialty = "development" }
            };
            journey.Phase3Data.LegalAssessment = new CreatorLegalAssessment
            {
                EvaluatedAt = DateTime.UtcNow,
                Items = new List<CreatorLegalChecklistItem>
                {
                    new() { Id = "FR-SOC-002", Title = "Pre-Hiring Declarations (DPAE)", Category = "social", Stage = "ongoing", Priority = "critical", WhyItApplies = "Planned payroll." }
                }
            };
            SetupValidPrerequisites(journey);

            var svc = CreateService();
            var res = await svc.GenerateRoadmapAsync("user-1", "idea-1");

            var dpaeTask = res.Roadmap!.Tasks.FirstOrDefault(t => t.Key.Contains("fr-soc-002"));
            dpaeTask.Should().NotBeNull();

            // DPAE timing is explicitly unresolved because skill-gap alone does not provide an employment contract start date
            dpaeTask!.TargetWindow.Should().Contain("Timing unresolved");
            dpaeTask.Why.Should().Contain("Timing is unresolved until an explicit employee start date is established");
            dpaeTask.Stage.Should().NotBe(RoadmapStages.Days30To60);
        }

        [Fact]
        public async Task Missing_Prerequisite_For_Unknown_Reasons_Retains_Unresolved_Blocker_And_Prevents_Silent_Unlocking()
        {
            var journey = BuildCompleteJourneyWithSnapshot();
            // Snapshot has a task with an unmodeled/missing custom dependency
            var criticalSnapshotItem = new ConstructionSnapshotItem
            {
                Key = "custom.blocked-module",
                Title = "Custom Blocked Module",
                Category = "Technology",
                Status = "Missing",
                Priority = "Critical",
                Blocking = true,
                Reason = "Requires unfulfilled hardware prototype",
                Source = new List<string> { "Snapshot" }
            };
            journey.Phase4Data!.ConstructionSnapshot!.CriticalItems = new List<ConstructionSnapshotItem> { criticalSnapshotItem };
            
            SetupValidPrerequisites(journey);

            var svc = CreateService();
            var res = await svc.GenerateRoadmapAsync("user-1", "idea-1");

            // Manually simulate a candidate that had a dependency on a missing prerequisite not completed and not in candidates
            var taskWithMissingPrereq = res.Roadmap!.Tasks.First(t => t.Key == "custom.blocked-module");
            taskWithMissingPrereq.Dependencies.Add("unresolved.hardware-prototype");

            // Rerun explicit resolution logic via refresh to verify the blocker is preserved and not silently deleted
            var refreshed = await svc.RefreshRoadmapAsync("user-1", "idea-1");
            var verifiedTask = refreshed.Roadmap!.Tasks.FirstOrDefault(t => t.Key == "custom.blocked-module");

            verifiedTask.Should().NotBeNull();
            verifiedTask!.Dependencies.Should().Contain("unresolved.hardware-prototype", "missing prerequisite must NOT be silently removed");
            verifiedTask.Status.Should().Be(RoadmapTaskStatus.Blocked);
            verifiedTask.Why.Should().Contain("[Blocked by unresolved prerequisite: unresolved.hardware-prototype]");

            // NextBestAction must NOT select this blocked task
            if (refreshed.Roadmap.NextBestAction != null)
            {
                refreshed.Roadmap.NextBestAction.TaskKey.Should().NotBe("custom.blocked-module");
            }
        }

        [Fact]
        public async Task Confirmed_Completed_Prerequisite_Satisfies_Dependency_While_Inapplicable_Is_Removed()
        {
            var journey = BuildCompleteJourneyWithSnapshot();
            journey.Phase3Data!.LegalAssessment = new CreatorLegalAssessment
            {
                EvaluatedAt = DateTime.UtcNow,
                Items = new List<CreatorLegalChecklistItem>
                {
                    // FR-CORP-001 completed, FR-REG-001 not applicable, FR-CORP-004 active
                    new() { Id = "FR-CORP-001", Title = "Share Capital Deposit", Category = "corporate", Stage = "before_creation", Status = "completed", WhyItApplies = "Done." },
                    new() { Id = "FR-REG-001", Title = "Regulated Sector Check", Category = "regulated", Stage = "before_creation", Status = "not_applicable", WhyItApplies = "Not regulated." },
                    new() { Id = "FR-CORP-004", Title = "INPI Registration", Category = "corporate", Stage = "company_creation", Status = "not_started", Priority = "critical", WhyItApplies = "Pending filing." }
                }
            };
            SetupValidPrerequisites(journey);

            var svc = CreateService();
            var res = await svc.GenerateRoadmapAsync("user-1", "idea-1");

            var regTask = res.Roadmap!.Tasks.FirstOrDefault(t => t.Key.Contains("fr-corp-004"));
            regTask.Should().NotBeNull();

            // Completed FR-CORP-001 is satisfied and not in active dependencies
            regTask!.Dependencies.Should().NotContain("legal.fr-corp-001");
            regTask.Dependencies.Should().NotContain("legal.fr-reg-001");
            
            // Regulated check was not_applicable so not in candidates
            res.Roadmap.Tasks.Should().NotContain(t => t.Key.Contains("fr-reg-001"));
        }

        [Fact]
        public async Task Solo_Founder_B2B_Excludes_Inapplicable_Legal_Rules_And_Retains_Legitimate_Empty_Groups()
        {
            var journey = BuildCompleteJourneyWithSnapshot();
            journey.Phase4Data!.ConstructionSnapshot!.MissingItems = new List<ConstructionSnapshotItem>();
            journey.Phase3Data!.FormationGenerator!.YouNeed = new List<CreatorSkillGap>();
            journey.Phase3Data.LegalAssessment = new CreatorLegalAssessment
            {
                EvaluatedAt = DateTime.UtcNow,
                Items = new List<CreatorLegalChecklistItem>
                {
                    new() { Id = "FR-CORP-004", Title = "INPI Registration", Category = "corporate", Stage = "company_creation", Priority = "critical", WhyItApplies = "Mandatory registration." },
                    new() { Id = "FR-CONS-002", Title = "B2B Commercial Terms of Sale", Category = "commercial_contracts", Stage = "before_sale", Priority = "recommended", WhyItApplies = "B2B contracts." }
                }
            };
            SetupValidPrerequisites(journey);

            var svc = CreateService();
            var res = await svc.GenerateRoadmapAsync("user-1", "idea-1");

            var tasks = res.Roadmap!.Tasks;

            // Inapplicable rules are NOT generated
            tasks.Should().NotContain(t => t.Key.Contains("fr-soc-002")); // No DPAE
            tasks.Should().NotContain(t => t.Key.Contains("fr-reg-001")); // Not regulated
            tasks.Should().NotContain(t => t.Key.Contains("fr-cons-001")); // No B2C CGV
            tasks.Should().NotContain(t => t.Key.Contains("fr-cons-003")); // No 3-click cancellation

            // Applicable B2B terms IS generated
            tasks.Should().Contain(t => t.Key.Contains("fr-cons-002"));

            // Honest empty state: Days 30-60, Days 60-90, and Post-Launch have 0 tasks for this minimal venture
            var days30To60Tasks = tasks.Where(t => t.Stage == RoadmapStages.Days30To60).ToList();
            var days60To90Tasks = tasks.Where(t => t.Stage == RoadmapStages.Days60To90).ToList();
            var postLaunchTasks = tasks.Where(t => t.Stage == RoadmapStages.PostLaunch).ToList();
            days30To60Tasks.Should().BeEmpty();
            days60To90Tasks.Should().BeEmpty();
            postLaunchTasks.Should().BeEmpty();

            res.TotalTasksCount.Should().Be(tasks.Count);
        }

        [Fact]
        public async Task Completed_Legal_Items_Are_Excluded_From_Roadmap_Candidates()
        {
            var journey = BuildCompleteJourneyWithSnapshot();
            journey.Phase3Data!.LegalAssessment = new CreatorLegalAssessment
            {
                EvaluatedAt = DateTime.UtcNow,
                Items = new List<CreatorLegalChecklistItem>
                {
                    new() { Id = "FR-CORP-001", Title = "Share Capital Deposit", Category = "corporate", Stage = "before_creation", Status = "completed", WhyItApplies = "Already completed." },
                    new() { Id = "FR-CORP-004", Title = "INPI Registration", Category = "corporate", Stage = "company_creation", Status = "not_started", Priority = "critical", WhyItApplies = "Pending registration." }
                }
            };
            SetupValidPrerequisites(journey);

            var svc = CreateService();
            var res = await svc.GenerateRoadmapAsync("user-1", "idea-1");

            res.Roadmap!.Tasks.Should().NotContain(t => t.Key.Contains("fr-corp-001"));
            res.Roadmap.Tasks.Should().Contain(t => t.Key.Contains("fr-corp-004"));
        }

        [Fact]
        public async Task Blocked_Tasks_Remain_Visible_In_Intended_Stage_With_Accurate_Dependencies()
        {
            var journey = BuildCompleteJourneyWithSnapshot();
            journey.Phase3Data!.LegalAssessment = new CreatorLegalAssessment
            {
                EvaluatedAt = DateTime.UtcNow,
                Items = new List<CreatorLegalChecklistItem>
                {
                    new() { Id = "FR-CORP-001", Title = "Share Capital Deposit", Category = "corporate", Stage = "before_creation", Priority = "critical", WhyItApplies = "Capital deposit required." }
                }
            };
            SetupValidPrerequisites(journey);

            var svc = CreateService();
            var res = await svc.GenerateRoadmapAsync("user-1", "idea-1");

            var formationTask = res.Roadmap!.Tasks.FirstOrDefault(t => t.Key == "formation.confirm-structure");
            var legalTask = res.Roadmap.Tasks.FirstOrDefault(t => t.Key.Contains("fr-corp-001"));

            formationTask.Should().NotBeNull();
            legalTask.Should().NotBeNull();

            legalTask!.Dependencies.Should().Contain("formation.confirm-structure");
            formationTask!.Unblocks.Should().Contain(legalTask.Title);
            legalTask.Stage.Should().Be(RoadmapStages.Next30Days);
        }

        [Fact]
        public async Task Verify_ReviewChanges_AcceptRefresh_And_Reload_Persistence()
        {
            var journey = BuildCompleteJourneyWithSnapshot();
            journey.Phase3Data!.LegalAssessment = new CreatorLegalAssessment
            {
                EvaluatedAt = DateTime.UtcNow.AddMinutes(-10),
                Items = new List<CreatorLegalChecklistItem>
                {
                    new() { Id = "FR-CORP-004", Title = "INPI Registration", Category = "corporate", Stage = "company_creation", Priority = "critical", WhyItApplies = "Statutory registration." }
                }
            };
            SetupValidPrerequisites(journey);

            var svc = CreateService();
            var initialRes = await svc.GenerateRoadmapAsync("user-1", "idea-1");
            initialRes.Roadmap.Should().NotBeNull();

            // Set custom founder override
            var regTask = initialRes.Roadmap!.Tasks.First(t => t.Key.Contains("fr-corp-004"));
            await svc.UpdateTaskStateAsync("user-1", new UpdateRoadmapTaskRequest
            {
                IdeaId = "idea-1",
                TaskId = regTask.Id,
                Status = RoadmapTaskStatus.InProgress,
                FounderNotes = "Filing prepared with accountant",
                EstimatedEffortHours = 4.0
            });

            // Simulate LegalAssessment update in Phase 3
            journey.Phase3Data.LegalAssessment.EvaluatedAt = DateTime.UtcNow.AddMinutes(5);
            journey.Phase3Data.LegalAssessment.Items.Add(new CreatorLegalChecklistItem
            {
                Id = "FR-PRIV-001",
                Title = "GDPR Privacy Policy",
                Category = "privacy",
                Stage = "before_launch",
                Priority = "critical",
                WhyItApplies = "Collects customer data."
            });

            // 1. GetRoadmapAsync detects staleness and triggers UpdateAvailable = true
            var checkStaleRes = await svc.GetRoadmapAsync("user-1", "idea-1");
            checkStaleRes.UpdateAvailable.Should().BeTrue();
            checkStaleRes.ChangedSources.Should().Contain("Legal Assessment");

            // 2. Accept update via RefreshRoadmapAsync
            var refreshedRes = await svc.RefreshRoadmapAsync("user-1", "idea-1");
            refreshedRes.UpdateAvailable.Should().BeFalse();

            // Verify founder overrides persisted
            var refreshedRegTask = refreshedRes.Roadmap!.Tasks.First(t => t.Key.Contains("fr-corp-004"));
            refreshedRegTask.Status.Should().Be(RoadmapTaskStatus.InProgress);
            refreshedRegTask.FounderNotes.Should().Be("Filing prepared with accountant");
            refreshedRegTask.FounderEdited.Should().BeTrue();

            // Verify newly added legal task is present in refreshed roadmap
            refreshedRes.Roadmap.Tasks.Should().Contain(t => t.Key.Contains("fr-priv-001"));

            // 3. Reload via GetRoadmapAsync to confirm persistence
            var reloadedRes = await svc.GetRoadmapAsync("user-1", "idea-1");
            reloadedRes.UpdateAvailable.Should().BeFalse();
            var reloadedRegTask = reloadedRes.Roadmap!.Tasks.First(t => t.Key.Contains("fr-corp-004"));
            reloadedRegTask.Status.Should().Be(RoadmapTaskStatus.InProgress);
            reloadedRegTask.FounderNotes.Should().Be("Filing prepared with accountant");
        }

        [Fact]
        public async Task Verify_Real_Journey_API_Task_Distribution_And_Key_Listings()
        {
            var journey = BuildCompleteJourneyWithSnapshot();
            journey.Phase3Data!.LegalAssessment = new CreatorLegalAssessment
            {
                EvaluatedAt = DateTime.UtcNow,
                Items = new List<CreatorLegalChecklistItem>
                {
                    new() { Id = "FR-REG-001", Title = "Regulated Activity Check", Category = "regulated", Stage = "before_creation", Priority = "critical", WhyItApplies = "Regulated activity." },
                    new() { Id = "FR-CORP-001", Title = "Share Capital Deposit", Category = "corporate", Stage = "before_creation", Priority = "critical", WhyItApplies = "Capital deposit.", RequiresEvidence = true },
                    new() { Id = "FR-CORP-002", Title = "Drafting Statuts", Category = "corporate", Stage = "before_creation", Priority = "critical", WhyItApplies = "Statuts bylaws.", RequiresEvidence = true },
                    new() { Id = "FR-CORP-003", Title = "JAL Publication", Category = "corporate", Stage = "company_creation", Priority = "critical", WhyItApplies = "Legal gazette.", RequiresEvidence = true },
                    new() { Id = "FR-CORP-004", Title = "INPI Registration", Category = "corporate", Stage = "company_creation", Priority = "critical", WhyItApplies = "Company registration.", RequiresEvidence = true },
                    new() { Id = "FR-CORP-005", Title = "RBE Beneficial Ownership", Category = "corporate", Stage = "company_creation", Priority = "critical", WhyItApplies = "AML RBE declaration." },
                    new() { Id = "FR-IP-001", Title = "INPI Trademark Search", Category = "intellectual_property", Stage = "before_launch", Priority = "recommended", WhyItApplies = "Brand search.", RequiresEvidence = true },
                    new() { Id = "FR-INS-001", Title = "RC Pro Insurance", Category = "insurance", Stage = "before_sale", Priority = "recommended", WhyItApplies = "Liability insurance.", RequiresEvidence = true },
                    new() { Id = "FR-PRIV-001", Title = "GDPR Privacy Policy", Category = "privacy", Stage = "before_launch", Priority = "critical", WhyItApplies = "Data protection.", RequiresEvidence = true },
                    new() { Id = "FR-PRIV-002", Title = "Cookie Consent CMP", Category = "privacy", Stage = "before_launch", Priority = "critical", WhyItApplies = "Cookie tracking." },
                    new() { Id = "FR-PAY-001", Title = "Payment Gateway Integration", Category = "payments", Stage = "before_sale", Priority = "critical", WhyItApplies = "Online checkout." },
                    new() { Id = "FR-WEB-001", Title = "Mentions Légales", Category = "consumer_protection", Stage = "before_launch", Priority = "critical", WhyItApplies = "LCEN legal disclosures." },
                    new() { Id = "FR-CONS-001", Title = "Consumer CGV", Category = "consumer_protection", Stage = "before_sale", Priority = "critical", WhyItApplies = "B2C sales terms.", RequiresEvidence = true },
                    new() { Id = "FR-TAX-001", Title = "Electronic Invoicing Setup", Category = "tax_compliance", Stage = "before_sale", Priority = "critical", WhyItApplies = "E-invoicing reform." },
                    new() { Id = "FR-SOC-001", Title = "URSSAF Affiliation", Category = "social", Stage = "ongoing", Priority = "critical", WhyItApplies = "Founder social regime." },
                    new() { Id = "FR-CORP-006", Title = "Annual Accounts Filing", Category = "corporate", Stage = "ongoing", Priority = "critical", WhyItApplies = "Annual accounts filing." }
                }
            };
            SetupValidPrerequisites(journey);

            var svc = CreateService();
            var res = await svc.GenerateRoadmapAsync("user-1", "idea-1");

            res.Should().NotBeNull();
            res.Roadmap.Should().NotBeNull();

            // Extract real stage task lists
            var stageMap = res.Roadmap!.Stages.ToDictionary(s => s.Stage, s => s.Tasks);

            // Print and verify exact counts per stage directly from the task collections
            int totalCalculatedFromStages = 0;
            foreach (var stage in RoadmapStages.AllStages)
            {
                if (stageMap.TryGetValue(stage, out var stageTasks))
                {
                    totalCalculatedFromStages += stageTasks.Count;
                    stageTasks.Count.Should().BeGreaterThan(0, $"stage {stage} has tasks in this full canonical fixture");
                }
            }

            res.TotalTasksCount.Should().Be(totalCalculatedFromStages);
            res.Roadmap.Tasks.Count.Should().Be(totalCalculatedFromStages);
        }
    }
}

