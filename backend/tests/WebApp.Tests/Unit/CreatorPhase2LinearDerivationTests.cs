using FluentAssertions;
using MongoDB.Driver;
using Moq;
using System.Collections.Generic;
using System.Threading.Tasks;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Implementations;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Unit
{
    public class CreatorPhase2LinearDerivationTests
    {
        private readonly CreatorJourneyService _service;

        public CreatorPhase2LinearDerivationTests()
        {
            var dbMock = new Mock<IMongoDatabase>();
            var context = new MongoDbContext(dbMock.Object);
            _service = new CreatorJourneyService(
                context,
                Mock.Of<IBusinessPlanSessionStore>(),
                Mock.Of<IForecastSessionStore>(),
                Mock.Of<ICreatorIdeaStore>(),
                Mock.Of<IClarifierSessionStore>());
        }

        [Fact]
        public async Task FreshUser_WithPhase1Complete_DerivesStep6_Clarifier()
        {
            var journey = new CreatorJourney
            {
                UserId = "user-1",
                Project = new CreatorJourneyProject(),
                Phase2Data = new CreatorPhase2Data()
            };

            var status = await _service.ComputePhaseStatusAsync(journey, phase1Complete: true);

            status.Phase2.Status.Should().Be("available");
            status.Phase2.CurrentStep.Should().Be(6); // Step 6 = Clarifier
            status.Phase3.Status.Should().Be("locked");
        }

        [Fact]
        public async Task UserWithActiveClarifierChat_DerivesInProgress_Step6()
        {
            var journey = new CreatorJourney
            {
                UserId = "user-1",
                Project = new CreatorJourneyProject(),
                Phase2Data = new CreatorPhase2Data
                {
                    ChatMessages = new List<CreatorChatMessage>
                    {
                        new() { Sender = "user", Text = "My problem is fragmented logistics." }
                    }
                }
            };

            var status = await _service.ComputePhaseStatusAsync(journey, phase1Complete: true);

            status.Phase2.Status.Should().Be("in_progress");
            status.Phase2.CurrentStep.Should().Be(6);
        }

        [Fact]
        public async Task ClarifiedUser_MissingName_DerivesStep8_ConceptName()
        {
            var journey = new CreatorJourney
            {
                UserId = "user-1",
                Project = new CreatorJourneyProject
                {
                    Problem = "High delivery costs",
                    Solution = "Aggregated routing",
                    ClarityScore = 85.0
                },
                Phase2Data = new CreatorPhase2Data
                {
                    ClarifierSessionId = "session-123"
                }
            };

            var status = await _service.ComputePhaseStatusAsync(journey, phase1Complete: true);

            status.Phase2.Status.Should().Be("in_progress");
            status.Phase2.CurrentStep.Should().Be(8); // Step 8 = Concept Name
        }

        [Fact]
        public async Task ClarifiedAndNamedUser_MissingBranding_DerivesStep9_Branding()
        {
            var journey = new CreatorJourney
            {
                UserId = "user-1",
                Project = new CreatorJourneyProject
                {
                    Name = "ShipFast",
                    Problem = "High delivery costs",
                    Solution = "Aggregated routing",
                    ClarityScore = 85.0
                },
                Phase2Data = new CreatorPhase2Data
                {
                    ClarifierSessionId = "session-123"
                }
            };

            var status = await _service.ComputePhaseStatusAsync(journey, phase1Complete: true);

            status.Phase2.Status.Should().Be("in_progress");
            status.Phase2.CurrentStep.Should().Be(9); // Step 9 = Branding
        }

        [Fact]
        public async Task FullyResolvedPhase2_DerivesStep12_Completed_AndUnlocksPhase3()
        {
            var journey = new CreatorJourney
            {
                UserId = "user-1",
                Project = new CreatorJourneyProject
                {
                    Name = "ShipFast",
                    Problem = "High delivery costs",
                    Solution = "Aggregated routing",
                    ClarityScore = 85.0,
                    Branding = new CreatorBranding
                    {
                        BrandingMethod = "ai"
                    }
                },
                Phase2Data = new CreatorPhase2Data
                {
                    ClarifierSessionId = "session-123"
                }
            };

            var status = await _service.ComputePhaseStatusAsync(journey, phase1Complete: true);

            status.Phase2.Status.Should().Be("completed");
            status.Phase2.CurrentStep.Should().Be(12); // Step 12 = Complete
            status.Phase3.Status.Should().Be("available");
        }

        [Fact]
        public async Task HistoricalPathAUser_WithExistingProblemSolutionScore_ResumesCleanlyWithoutStranding()
        {
            // Historical user who completed discovery prior to removal has Problem, Solution, Score, Name,
            // but no ClarifierSessionId.
            var journey = new CreatorJourney
            {
                UserId = "historical-user",
                Project = new CreatorJourneyProject
                {
                    Name = "EcoCourier",
                    Problem = "Urban carbon emissions from vans",
                    Solution = "Cargo bike micro-depots",
                    ClarityScore = 90.0,
                    Branding = null // branding not yet done
                },
                Phase2Data = new CreatorPhase2Data
                {
                    ClarifierSessionId = null,
                    // Historical fields preserved on document but not required for progression
                    DiscoveryInputs = new CreatorDiscoveryInputs { ObservedProblem = "Emissions" },
                    SelectedConceptId = "concept-99"
                }
            };

            var status = await _service.ComputePhaseStatusAsync(journey, phase1Complete: true);

            // Must NOT strand user back at Step 6 (Clarifier)
            status.Phase2.CurrentStep.Should().Be(9); // Correctly recognizes clarified + named, advances to Branding (Step 9)
            status.Phase2.Status.Should().Be("in_progress");
        }

        [Fact]
        public async Task DeletedDiscoveryFields_AreNeverRequired_ForPhase2Completion()
        {
            // Fully completed project with zero discovery data
            var journey = new CreatorJourney
            {
                UserId = "user-fresh",
                Project = new CreatorJourneyProject
                {
                    Name = "CleanTech",
                    Problem = "Plastic pollution",
                    Solution = "Seaweed packaging",
                    ClarityScore = 80.0,
                    Branding = new CreatorBranding { BrandingMethod = "skip" }
                },
                Phase2Data = new CreatorPhase2Data
                {
                    ClarifierSessionId = "session-fresh",
                    DiscoveryInputs = null,
                    GeneratedConcepts = null,
                    SelectedConceptId = null
                }
            };

            var status = await _service.ComputePhaseStatusAsync(journey, phase1Complete: true);

            status.Phase2.Status.Should().Be("completed");
            status.Phase2.CurrentStep.Should().Be(12);
            status.Phase3.Status.Should().Be("available");
        }
    }
}
