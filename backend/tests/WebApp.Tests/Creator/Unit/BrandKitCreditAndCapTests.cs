using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Driver;
using Moq;
using WebApp.Controllers;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Ai;
using WebApp.Services.Ai.Jobs;
using WebApp.Services.Creator.BrandKit.ColorEngine;
using WebApp.Services.Creator.BrandKit.DirectionEngine;
using WebApp.Services.Creator.BrandKit.LogoEngine;
using WebApp.Services.Creator.BrandKit.TypographyEngine;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Repository;
using Xunit;
using BrandKitModel = WebApp.Models.DatabaseModels.BrandKit;

namespace WebApp.Tests.Creator.Unit
{
    public class BrandKitCreditAndCapTests
    {
        private const string TestUserId = "user-creator-777";
        private const string TestIdeaId = "60f1b2b3c4d5e6f7a8b9c0d1";

        private static BrandKitModel CreateSeededKit()
        {
            return new BrandKitModel
            {
                Id = ObjectId.GenerateNewId().ToString(),
                IdeaId = TestIdeaId,
                UserId = TestUserId,
                CurrentStep = 1,
                Status = "draft",
                Strategy = new BrandStrategy
                {
                    BusinessName = "CyberLock",
                    ConfirmedAt = DateTime.UtcNow
                },
                Direction = new BrandDirection
                {
                    SelectedDirectionKey = "dir_modern",
                    RegenerateCount = 0,
                    Candidates = new List<BrandDirectionCandidate>
                    {
                        new() { Key = "dir_modern", Name = "Modern Direction", ColorPalette = new() { "#1A1A24", "#3C61DD", "#00D084", "#FFFFFF" } }
                    }
                },
                Logo = new BrandLogo
                {
                    SelectedConceptKey = "concept_1",
                    RegenerateCount = 0,
                    ApprovedAt = DateTime.UtcNow,
                    Concepts = new List<BrandLogoConcept>
                    {
                        new() { Key = "concept_1", DescriptorLine = "Geometric Shield", RegenerateCount = 0, Parameters = new() { Family = "Syne" } },
                        new() { Key = "concept_2", DescriptorLine = "Minimal Monogram", RegenerateCount = 0, Parameters = new() { Family = "DM Sans" } }
                    }
                },
                Colors = new BrandColors
                {
                    RegenerateCount = 0,
                    Roles = new List<BrandColorRole>
                    {
                        new() { RoleName = BrandColorRoleNames.Primary, Hex = "#1A1A24", Rgb = "26,26,36", ContrastRatio = 12.4, ContrastVerdict = "AAA" },
                        new() { RoleName = BrandColorRoleNames.Secondary, Hex = "#3C61DD", Rgb = "60,97,221", ContrastRatio = 4.8, ContrastVerdict = "AA" },
                        new() { RoleName = BrandColorRoleNames.Accent, Hex = "#00D084", Rgb = "0,208,132", ContrastRatio = 3.5, ContrastVerdict = "AA_Large" },
                        new() { RoleName = BrandColorRoleNames.Background, Hex = "#FFFFFF", Rgb = "255,255,255", ContrastRatio = null, ContrastVerdict = null },
                        new() { RoleName = BrandColorRoleNames.Text, Hex = "#0F172A", Rgb = "15,23,42", ContrastRatio = 14.2, ContrastVerdict = "AAA" }
                    }
                },
                Typography = new BrandTypography
                {
                    RegenerateCount = 0,
                    Roles = new List<BrandTypographyRole>
                    {
                        new() { RoleName = BrandTypographyRoleNames.LogoType, Family = "Syne", Weight = "800", IsLocked = true },
                        new() { RoleName = BrandTypographyRoleNames.Heading, Family = "Syne", Weight = "700", IsLocked = false },
                        new() { RoleName = BrandTypographyRoleNames.Body, Family = "DM Sans", Weight = "400", IsLocked = false },
                        new() { RoleName = BrandTypographyRoleNames.ButtonAndLabel, Family = "DM Sans", Weight = "600", IsLocked = false }
                    }
                }
            };
        }

        private static (CreatorBrandKitController Controller,
            Mock<IBrandKitStore> MockKitStore,
            Mock<ICreatorJourneyService> MockJourney,
            Mock<IAiCreditService> MockCredits,
            Mock<IDirectionGenerationService> MockDirectionGen,
            Mock<ILogoGenerationService> MockLogoGen,
            Mock<IColorGenerationService> MockColorGen,
            Mock<ITypographyGenerationService> MockTypoGen)
            SetupController(BrandKitModel kit)
        {
            var mockKitStore = new Mock<IBrandKitStore>();
            var mockJourney = new Mock<ICreatorJourneyService>();
            var mockCredits = new Mock<IAiCreditService>();
            var mockDirectionGen = new Mock<IDirectionGenerationService>();
            var mockLogoGen = new Mock<ILogoGenerationService>();
            var mockColorGen = new Mock<IColorGenerationService>();
            var mockTypoGen = new Mock<ITypographyGenerationService>();

            var idea = new CreatorIdea
            {
                Id = TestIdeaId,
                UserId = TestUserId,
                Project = new CreatorJourneyProject { Name = "CyberLock" }
            };

            mockJourney.Setup(j => j.ResolveIdeaAsync(TestUserId, TestIdeaId))
                .ReturnsAsync(idea);
            mockJourney.Setup(j => j.ResolveIdeaAsync(TestUserId, null))
                .ReturnsAsync(idea);

            mockKitStore.Setup(s => s.GetByIdeaIdAsync(TestIdeaId, TestUserId))
                .ReturnsAsync(kit);

            mockKitStore.Setup(s => s.UpdateAsync(TestIdeaId, TestUserId, It.IsAny<UpdateDefinition<BrandKitModel>>(), It.IsAny<long?>(), It.IsAny<IClientSessionHandle?>(), It.IsAny<UpdateOptions?>()))
                .ReturnsAsync(true);

            var controller = new CreatorBrandKitController(
                mockJourney.Object,
                mockKitStore.Object,
                creatorIdeas: null,
                mockLogoGen.Object,
                mongoClient: null,
                config: null,
                logger: NullLogger<CreatorBrandKitController>.Instance,
                logoVariationService: null,
                mockDirectionGen.Object,
                mockColorGen.Object,
                mockTypoGen.Object,
                mockCredits.Object)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext
                    {
                        User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                        {
                            new Claim(ClaimTypes.NameIdentifier, TestUserId)
                        }, "TestAuth"))
                    }
                }
            };

            return (controller, mockKitStore, mockJourney, mockCredits, mockDirectionGen, mockLogoGen, mockColorGen, mockTypoGen);
        }

        // =========================================================================
        // 1. EXACT CREDIT DEBITING FOR ALL 5 GENERATIVE OPERATIONS
        // =========================================================================

        [Fact]
        public async Task GenerateDirections_Debits_DirectionGeneration_JobType()
        {
            var kit = CreateSeededKit();
            kit.Direction.Candidates.Clear();
            var (controller, _, _, mockCredits, mockDirectionGen, _, _, _) = SetupController(kit);

            mockDirectionGen.Setup(d => d.GenerateCandidatesAsync(It.IsAny<CreatorIdea>(), It.IsAny<BrandKitModel>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<BrandDirectionCandidate> { new() { Key = "dir1", Name = "Candidate 1" } });

            var result = await controller.GenerateDirections(TestIdeaId);

            result.Should().BeOfType<OkObjectResult>();
            mockCredits.Verify(c => c.DebitForJobAsync(TestUserId, AiJobType.DirectionGeneration, It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task GenerateLogoConcepts_Debits_LogoParameterSelection_JobType()
        {
            var kit = CreateSeededKit();
            var (controller, _, _, mockCredits, _, mockLogoGen, _, _) = SetupController(kit);

            mockLogoGen.Setup(l => l.GenerateConceptsAsync(It.IsAny<CreatorIdea>(), It.IsAny<BrandKitModel>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<BrandLogoConcept> { new() { Key = "c1", DescriptorLine = "Concept 1" } });

            var result = await controller.GenerateLogoConcepts(TestIdeaId);

            result.Should().BeOfType<OkObjectResult>();
            mockCredits.Verify(c => c.DebitForJobAsync(TestUserId, AiJobType.LogoParameterSelection, It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task RegenerateSingleLogoConcept_Debits_LogoConceptRegenerate_JobType()
        {
            var kit = CreateSeededKit();
            var (controller, _, _, mockCredits, _, mockLogoGen, _, _) = SetupController(kit);

            mockLogoGen.Setup(l => l.RegenerateSingleConceptAsync(It.IsAny<CreatorIdea>(), It.IsAny<BrandKitModel>(), "concept_1", It.IsAny<CancellationToken>()))
                .ReturnsAsync(new BrandLogoConcept { Key = "concept_1", DescriptorLine = "Regenerated Concept", RegenerateCount = 1 });

            var result = await controller.RegenerateSingleLogoConcept("concept_1", TestIdeaId);

            result.Should().BeOfType<OkObjectResult>();
            mockCredits.Verify(c => c.DebitForJobAsync(TestUserId, AiJobType.LogoConceptRegenerate, It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task RegenerateColors_Debits_ColorGeneration_JobType()
        {
            var kit = CreateSeededKit();
            var (controller, _, _, mockCredits, _, _, mockColorGen, _) = SetupController(kit);

            mockColorGen.Setup(c => c.RegenerateColorsAsync(It.IsAny<BrandKitModel>(), It.IsAny<CreatorIdea>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new BrandColors { RegenerateCount = 1, Roles = kit.Colors.Roles });

            var result = await controller.RegenerateColors(TestIdeaId);

            result.Should().BeOfType<OkObjectResult>();
            mockCredits.Verify(c => c.DebitForJobAsync(TestUserId, AiJobType.ColorGeneration, It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task RegenerateTypography_Debits_TypographyGeneration_JobType()
        {
            var kit = CreateSeededKit();
            var (controller, _, _, mockCredits, _, _, _, mockTypoGen) = SetupController(kit);

            mockTypoGen.Setup(t => t.RegenerateTypographyAsync(It.IsAny<BrandKitModel>(), It.IsAny<CreatorIdea>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new BrandTypography { RegenerateCount = 1, Roles = kit.Typography.Roles });

            var result = await controller.RegenerateTypography(TestIdeaId);

            result.Should().BeOfType<OkObjectResult>();
            mockCredits.Verify(c => c.DebitForJobAsync(TestUserId, AiJobType.TypographyGeneration, It.IsAny<string>()), Times.Once);
        }

        // =========================================================================
        // 2. FREE OPERATIONS NEVER DEBIT CREDITS (0 COST)
        // =========================================================================

        [Fact]
        public async Task Initial_Color_Derivation_Is_Free_Zero_Debits()
        {
            var kit = CreateSeededKit();
            var (controller, _, _, mockCredits, _, _, mockColorGen, _) = SetupController(kit);

            mockColorGen.Setup(c => c.DeriveInitialColors(It.IsAny<BrandKitModel>(), It.IsAny<CreatorIdea>()))
                .Returns(new BrandColors { Roles = kit.Colors.Roles });

            var result = await controller.GenerateColors(TestIdeaId);

            result.Should().BeOfType<OkObjectResult>();
            mockCredits.Verify(c => c.DebitForJobAsync(It.IsAny<string>(), It.IsAny<AiJobType>(), It.IsAny<string?>()), Times.Never);
        }

        [Fact]
        public async Task Initial_Typography_Derivation_Is_Free_Zero_Debits()
        {
            var kit = CreateSeededKit();
            var (controller, _, _, mockCredits, _, _, _, mockTypoGen) = SetupController(kit);

            mockTypoGen.Setup(t => t.DeriveInitialTypography(It.IsAny<BrandKitModel>(), It.IsAny<CreatorIdea>()))
                .Returns(new BrandTypography { Roles = kit.Typography.Roles });

            var result = await controller.GenerateTypography(TestIdeaId);

            result.Should().BeOfType<OkObjectResult>();
            mockCredits.Verify(c => c.DebitForJobAsync(It.IsAny<string>(), It.IsAny<AiJobType>(), It.IsAny<string?>()), Times.Never);
        }

        [Fact]
        public async Task OpenStudio_Reset_Is_Free_Zero_Debits()
        {
            var kit = CreateSeededKit();
            var (controller, _, _, mockCredits, _, _, _, _) = SetupController(kit);

            var result = await controller.OpenStudio(TestIdeaId);

            result.Should().BeOfType<OkObjectResult>();
            mockCredits.Verify(c => c.DebitForJobAsync(It.IsAny<string>(), It.IsAny<AiJobType>(), It.IsAny<string?>()), Times.Never);
        }

        [Fact]
        public async Task OpenStudio_When_No_Kit_Exists_AutoProvisions_BrandKit_And_Returns_200()
        {
            var (controller, mockKitStore, _, _, _, _, _, _) = SetupController(null);

            BrandKitModel? addedKit = null;
            mockKitStore.Setup(s => s.AddAsync(It.IsAny<BrandKitModel>(), null))
                .Callback<BrandKitModel, IClientSessionHandle?>((k, _) => addedKit = k)
                .Returns(Task.CompletedTask);

            var result = await controller.OpenStudio(TestIdeaId);

            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value as ApiResponse;
            response.Should().NotBeNull();
            response!.Success.Should().BeTrue();
            mockKitStore.Verify(s => s.AddAsync(It.IsAny<BrandKitModel>(), null), Times.Once);
            addedKit.Should().NotBeNull();
            addedKit!.IdeaId.Should().Be(TestIdeaId);
            addedKit.Status.Should().Be("draft");
            addedKit.CurrentStep.Should().Be(1);
        }

        [Fact]
        public async Task CreateKit_Multiple_Calls_Are_Idempotent()
        {
            var kit = CreateSeededKit();
            var (controller, mockKitStore, _, _, _, _, _, _) = SetupController(kit);

            var result = await controller.CreateKit(TestIdeaId);

            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            mockKitStore.Verify(s => s.AddAsync(It.IsAny<BrandKitModel>(), null), Times.Never);
        }

        [Fact]
        public async Task Section_Patches_Are_Free_Zero_Debits()
        {
            var kit = CreateSeededKit();
            var (controller, _, _, mockCredits, _, _, _, _) = SetupController(kit);

            var patchDto = new BrandColorsPatchDto
            {
                Roles = new List<BrandColorRolePatchDto>
                {
                    new() { RoleName = BrandColorRoleNames.Primary, Hex = "#111111" }
                }
            };

            var result = await controller.PatchColors(patchDto, TestIdeaId);

            result.Should().BeOfType<OkObjectResult>();
            mockCredits.Verify(c => c.DebitForJobAsync(It.IsAny<string>(), It.IsAny<AiJobType>(), It.IsAny<string?>()), Times.Never);
        }

        // =========================================================================
        // 3. REGENERATE CAP ENFORCEMENT (MAX 3 PER ELEMENT -> 4TH ATTEMPT REJECTED)
        // =========================================================================

        [Fact]
        public async Task Direction_Regeneration_Rejects_4th_Attempt_With_400_And_Zero_Debits()
        {
            var kit = CreateSeededKit();
            kit.Direction.RegenerateCount = 3; // Already at maximum
            var (controller, _, _, mockCredits, mockDirectionGen, _, _, _) = SetupController(kit);

            var result = await controller.GenerateDirections(TestIdeaId);

            var badReq = result.Should().BeOfType<BadRequestObjectResult>().Subject;
            var response = badReq.Value.Should().BeOfType<ApiResponse>().Subject;
            response.Success.Should().BeFalse();
            response.Message.Should().Contain("maximum regeneration limit (3/3)");

            // Verification: 0 credits debited, service never called
            mockCredits.Verify(c => c.DebitForJobAsync(It.IsAny<string>(), It.IsAny<AiJobType>(), It.IsAny<string?>()), Times.Never);
            mockDirectionGen.Verify(d => d.GenerateCandidatesAsync(It.IsAny<CreatorIdea>(), It.IsAny<BrandKitModel>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        [Fact]
        public async Task Logo_Concept_Regeneration_Rejects_4th_Attempt_With_400_And_Zero_Debits()
        {
            var kit = CreateSeededKit();
            kit.Logo.Concepts[0].RegenerateCount = 3; // Concept 1 at max cap
            var (controller, _, _, mockCredits, _, mockLogoGen, _, _) = SetupController(kit);

            var result = await controller.RegenerateSingleLogoConcept("concept_1", TestIdeaId);

            var badReq = result.Should().BeOfType<BadRequestObjectResult>().Subject;
            var response = badReq.Value.Should().BeOfType<ApiResponse>().Subject;
            response.Success.Should().BeFalse();
            response.Message.Should().Contain("maximum regeneration limit (3/3)");

            // Verification: 0 credits debited, service never called
            mockCredits.Verify(c => c.DebitForJobAsync(It.IsAny<string>(), It.IsAny<AiJobType>(), It.IsAny<string?>()), Times.Never);
            mockLogoGen.Verify(l => l.RegenerateSingleConceptAsync(It.IsAny<CreatorIdea>(), It.IsAny<BrandKitModel>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        [Fact]
        public async Task Colors_Regeneration_Rejects_4th_Attempt_With_400_And_Zero_Debits()
        {
            var kit = CreateSeededKit();
            kit.Colors.RegenerateCount = 3; // Palette at max cap
            var (controller, _, _, mockCredits, _, _, mockColorGen, _) = SetupController(kit);

            var result = await controller.RegenerateColors(TestIdeaId);

            var badReq = result.Should().BeOfType<BadRequestObjectResult>().Subject;
            var response = badReq.Value.Should().BeOfType<ApiResponse>().Subject;
            response.Success.Should().BeFalse();
            response.Message.Should().Contain("maximum regeneration limit (3/3)");

            // Verification: 0 credits debited, service never called
            mockCredits.Verify(c => c.DebitForJobAsync(It.IsAny<string>(), It.IsAny<AiJobType>(), It.IsAny<string?>()), Times.Never);
            mockColorGen.Verify(c => c.RegenerateColorsAsync(It.IsAny<BrandKitModel>(), It.IsAny<CreatorIdea>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        [Fact]
        public async Task Typography_Regeneration_Rejects_4th_Attempt_With_400_And_Zero_Debits()
        {
            var kit = CreateSeededKit();
            kit.Typography.RegenerateCount = 3; // Typography at max cap
            var (controller, _, _, mockCredits, _, _, _, mockTypoGen) = SetupController(kit);

            var result = await controller.RegenerateTypography(TestIdeaId);

            var badReq = result.Should().BeOfType<BadRequestObjectResult>().Subject;
            var response = badReq.Value.Should().BeOfType<ApiResponse>().Subject;
            response.Success.Should().BeFalse();
            response.Message.Should().Contain("maximum regeneration limit (3/3)");

            // Verification: 0 credits debited, service never called
            mockCredits.Verify(c => c.DebitForJobAsync(It.IsAny<string>(), It.IsAny<AiJobType>(), It.IsAny<string?>()), Times.Never);
            mockTypoGen.Verify(t => t.RegenerateTypographyAsync(It.IsAny<BrandKitModel>(), It.IsAny<CreatorIdea>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        // =========================================================================
        // 4. HUB RE-EDIT RESET (OPEN-STUDIO RESETS CAPS TO 0, PATCH DOES NOT)
        // =========================================================================

        [Fact]
        public async Task OpenStudio_Resets_All_Regenerate_Counters_Across_Kit()
        {
            var kit = CreateSeededKit();
            kit.Direction.RegenerateCount = 3;
            kit.Logo.RegenerateCount = 2;
            kit.Logo.Concepts[0].RegenerateCount = 3;
            kit.Logo.Concepts[1].RegenerateCount = 1;
            kit.Colors.RegenerateCount = 3;
            kit.Typography.RegenerateCount = 3;

            var (controller, mockKitStore, _, _, _, _, _, _) = SetupController(kit);

            UpdateDefinition<BrandKitModel>? capturedUpdate = null;
            mockKitStore.Setup(s => s.UpdateAsync(TestIdeaId, TestUserId, It.IsAny<UpdateDefinition<BrandKitModel>>(), It.IsAny<long?>(), It.IsAny<IClientSessionHandle?>(), It.IsAny<UpdateOptions?>()))
                .Callback<string, string, UpdateDefinition<BrandKitModel>, long?, IClientSessionHandle?, UpdateOptions?>(
                    (_, _, update, _, _, _) => capturedUpdate = update)
                .ReturnsAsync(true);

            var result = await controller.OpenStudio(TestIdeaId);

            result.Should().BeOfType<OkObjectResult>();
            capturedUpdate.Should().NotBeNull();

            // Render update definition to BsonDocument to verify reset fields
            var renderedDoc = capturedUpdate!.Render(
                BsonSerializer.SerializerRegistry.GetSerializer<BrandKitModel>(),
                BsonSerializer.SerializerRegistry).AsBsonDocument;

            renderedDoc.Contains("$set").Should().BeTrue();
            var setDoc = renderedDoc["$set"].AsBsonDocument;

            setDoc["Direction.RegenerateCount"].AsInt32.Should().Be(0);
            setDoc["Logo.RegenerateCount"].AsInt32.Should().Be(0);
            setDoc["Colors.RegenerateCount"].AsInt32.Should().Be(0);
            setDoc["Typography.RegenerateCount"].AsInt32.Should().Be(0);
            setDoc["Logo.Concepts.0.RegenerateCount"].AsInt32.Should().Be(0);
            setDoc["Logo.Concepts.1.RegenerateCount"].AsInt32.Should().Be(0);
        }

        // =========================================================================
        // 5. TRANSACTIONALITY & COMPENSATING REFUNDS ON GENERATION FAILURE
        // =========================================================================

        [Fact]
        public async Task Generation_Failure_Executes_Compensating_Refund_With_Matching_OperationId()
        {
            var kit = CreateSeededKit();
            var (controller, _, _, mockCredits, _, _, mockColorGen, _) = SetupController(kit);

            string? capturedOpId = null;
            mockCredits.Setup(c => c.DebitForJobAsync(TestUserId, AiJobType.ColorGeneration, It.IsAny<string?>()))
                .Callback<string, AiJobType, string?>((_, _, opId) => capturedOpId = opId)
                .Returns(Task.CompletedTask);

            mockColorGen.Setup(c => c.RegenerateColorsAsync(It.IsAny<BrandKitModel>(), It.IsAny<CreatorIdea>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(new InvalidOperationException("Model upstream failure simulation"));

            var result = await controller.RegenerateColors(TestIdeaId);

            var errorResult = result.Should().BeOfType<ObjectResult>().Subject;
            errorResult.StatusCode.Should().Be(StatusCodes.Status500InternalServerError);

            // Verify debit was executed first
            mockCredits.Verify(c => c.DebitForJobAsync(TestUserId, AiJobType.ColorGeneration, It.IsAny<string?>()), Times.Once);

            // Verify compensating refund was immediately triggered with matching operationId
            capturedOpId.Should().NotBeNullOrEmpty();
            mockCredits.Verify(c => c.RefundForJobAsync(
                TestUserId,
                AiJobType.ColorGeneration,
                capturedOpId!,
                It.Is<string>(r => r.Contains("Color regeneration failed"))), Times.Once);
        }

        [Fact]
        public async Task InsufficientCredits_Rejects_With_402_Before_Model_Invocation()
        {
            var kit = CreateSeededKit();
            var (controller, _, _, mockCredits, _, _, mockColorGen, _) = SetupController(kit);

            mockCredits.Setup(c => c.DebitForJobAsync(TestUserId, AiJobType.ColorGeneration, It.IsAny<string?>()))
                .ThrowsAsync(new InsufficientCreditsException("User credit balance is zero."));

            var result = await controller.RegenerateColors(TestIdeaId);

            var statusResult = result.Should().BeOfType<ObjectResult>().Subject;
            statusResult.StatusCode.Should().Be(StatusCodes.Status402PaymentRequired);

            // Verification: Model generation was never invoked
            mockColorGen.Verify(c => c.RegenerateColorsAsync(It.IsAny<BrandKitModel>(), It.IsAny<CreatorIdea>(), It.IsAny<CancellationToken>()), Times.Never);
            // Verification: No refund triggered because debit did not succeed
            mockCredits.Verify(c => c.RefundForJobAsync(It.IsAny<string>(), It.IsAny<AiJobType>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        }
    }
}
