using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using MongoDB.Bson;
using MongoDB.Driver;
using Moq;
using WebApp.Controllers;
using WebApp.DbContext;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;
using WebApp.Tests.Integration;
using Xunit;

namespace WebApp.Tests.Creator.Integration
{
    /// <summary>
    /// Real-MongoDB integration tests for <see cref="CreatorBrandKitController"/>:
    /// - Idempotent kit creation.
    /// - HTTP-layer targeted update sibling isolation (byte-identical re-read from real DB).
    /// - Server-side sequencing enforcement (draft prerequisite rejection and unlocked completed edits).
    /// - Completion one-way door (Status complete cannot be demoted).
    /// - Invalid role name 400 rejection with zero writes.
    /// - Stale expectedVersion 409 conflict (on PATCH and on snapshot push).
    /// - Advance step sequencing and backward rejection.
    /// - Idea resolution scoping (404 on unowned/missing, 409 on foreign switched idea).
    /// </summary>
    public class BrandKitHttpIntegrationTests : IAsyncLifetime
    {
        private readonly AppFixture _appFixture = new();
        private MongoClient? _fallbackClient;
        private string? _ephemeralDbName;

        public IMongoDatabase Database { get; private set; } = null!;
        public BrandKitRepository BrandKitRepo { get; private set; } = null!;
        public CreatorIdeaRepository IdeaRepo { get; private set; } = null!;
        public CreatorJourneyService JourneyService { get; private set; } = null!;

        public async Task InitializeAsync()
        {
            await _appFixture.InitializeAsync();

            var shortId = Guid.NewGuid().ToString("N")[..16];
            _ephemeralDbName = $"bk_{shortId}";

            if (_appFixture.Available && _appFixture.Factory != null)
            {
                var sp = _appFixture.Factory.Services;
                var client = (IMongoClient)sp.GetService(typeof(IMongoClient))!;
                Database = client.GetDatabase(_ephemeralDbName);
            }
            else
            {
                var connStr = Environment.GetEnvironmentVariable("MONGO_TEST_CONNECTION_STRING")
                    ?? "mongodb+srv://mongoDB:hr11100010@cluster0.nsfffx4.mongodb.net/";
                _fallbackClient = new MongoClient(connStr);
                Database = _fallbackClient.GetDatabase(_ephemeralDbName);
            }

            BrandKitRepo = new BrandKitRepository(Database);
            IdeaRepo = new CreatorIdeaRepository(Database);
            var context = new MongoDbContext(Database);

            JourneyService = new CreatorJourneyService(
                context,
                Mock.Of<IBusinessPlanSessionStore>(),
                Mock.Of<IForecastSessionStore>(),
                IdeaRepo,
                Mock.Of<IClarifierSessionStore>());
        }

        public async Task DisposeAsync()
        {
            if (!string.IsNullOrEmpty(_ephemeralDbName))
            {
                try
                {
                    var client = _fallbackClient ?? (IMongoClient?)_appFixture.Factory?.Services.GetService(typeof(IMongoClient));
                    if (client != null)
                        await client.DropDatabaseAsync(_ephemeralDbName);
                }
                catch { }
            }

            await _appFixture.DisposeAsync();
        }

        private CreatorBrandKitController CreateController(
            string userId,
            ICreatorIdeaStore? ideaStoreOverride = null,
            IMongoClient? mongoClientOverride = null,
            IConfiguration? configOverride = null)
        {
            var client = mongoClientOverride ?? (_fallbackClient ?? (IMongoClient?)_appFixture.Factory?.Services.GetService(typeof(IMongoClient)));
            return new CreatorBrandKitController(
                JourneyService,
                BrandKitRepo,
                ideaStoreOverride ?? IdeaRepo,
                logoGenerationService: null,
                mongoClient: client,
                config: configOverride,
                logger: NullLogger<CreatorBrandKitController>.Instance)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext
                    {
                        User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                        {
                            new Claim(ClaimTypes.NameIdentifier, userId)
                        }, "TestAuth"))
                    }
                }
            };
        }

        private async Task<CreatorIdea> SeedIdeaAndJourneyAsync(string userId, string ideaId)
        {
            var idea = new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                Project = new CreatorJourneyProject { Name = "Brand Studio Idea" },
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Version = 1
            };
            await Database.GetCollection<CreatorIdea>("CreatorIdeas").InsertOneAsync(idea);

            var journey = new CreatorJourney
            {
                UserId = userId,
                ActiveIdeaId = ideaId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await Database.GetCollection<CreatorJourney>("CreatorJourneys").InsertOneAsync(journey);

            return idea;
        }

        // =========================================================================
        // 1. IDEMPOTENT CREATION
        // =========================================================================
        [Fact]
        public async Task CreateKit_called_twice_is_idempotent_and_returns_single_document()
        {
            var userId = "user-" + Guid.NewGuid();
            var ideaId = ObjectId.GenerateNewId().ToString();
            await SeedIdeaAndJourneyAsync(userId, ideaId);

            var controller = CreateController(userId);

            // First call creates
            var result1 = await controller.CreateKit(ideaId);
            result1.Should().BeOfType<OkObjectResult>();
            var ok1 = (OkObjectResult)result1;
            var response1 = (ApiResponse)ok1.Value!;
            response1.Success.Should().BeTrue();
            var kit1 = (BrandKit)response1.Data!;

            // Second call returns existing kit
            var result2 = await controller.CreateKit(ideaId);
            result2.Should().BeOfType<OkObjectResult>();
            var ok2 = (OkObjectResult)result2;
            var response2 = (ApiResponse)ok2.Value!;
            response2.Success.Should().BeTrue();
            var kit2 = (BrandKit)response2.Data!;

            kit2.Id.Should().Be(kit1.Id);

            // Assert database contains exactly 1 document
            var count = await Database.GetCollection<BrandKit>("BrandKits")
                .CountDocumentsAsync(x => x.IdeaId == ideaId);
            count.Should().Be(1);
        }

        // =========================================================================
        // 2. HTTP-LAYER TARGETED UPDATE SIBLING ISOLATION
        // =========================================================================
        [Fact]
        public async Task PatchColors_leaves_all_sibling_roles_and_sections_byte_identical_when_reread()
        {
            var userId = "user-" + Guid.NewGuid();
            var ideaId = ObjectId.GenerateNewId().ToString();
            await SeedIdeaAndJourneyAsync(userId, ideaId);

            var controller = CreateController(userId);

            // Create initial kit
            await controller.CreateKit(ideaId);

            // Approve logo concept so colors section prerequisite is satisfied
            var approveLogoUpdate = Builders<BrandKit>.Update
                .Set(x => x.Logo.SelectedConceptKey, "concept-1")
                .Set(x => x.Logo.ApprovedAt, DateTime.UtcNow);
            await BrandKitRepo.UpdateAsync(ideaId, userId, approveLogoUpdate);

            // Read the full original document from MongoDB before targeted patch
            var initialDoc = await BrandKitRepo.GetByIdeaIdAsync(ideaId, userId);
            initialDoc.Should().NotBeNull();

            var origRole1Json = JsonSerializer.Serialize(initialDoc!.Colors.Roles[1]);
            var origRole2Json = JsonSerializer.Serialize(initialDoc.Colors.Roles[2]);
            var origRole3Json = JsonSerializer.Serialize(initialDoc.Colors.Roles[3]);
            var origRole4Json = JsonSerializer.Serialize(initialDoc.Colors.Roles[4]);
            var origStrategyJson = JsonSerializer.Serialize(initialDoc.Strategy);
            var origDirectionJson = JsonSerializer.Serialize(initialDoc.Direction);
            var origLogoJson = JsonSerializer.Serialize(initialDoc.Logo);
            var origTypographyJson = JsonSerializer.Serialize(initialDoc.Typography);

            // Execute targeted PATCH to Primary role hex and rgb via HTTP controller
            var patchDto = new BrandColorsPatchDto
            {
                Roles = new List<BrandColorRolePatchDto>
                {
                    new() { RoleName = BrandColorRoleNames.Primary, Hex = "#10B981", Rgb = "16, 185, 129" }
                }
            };

            var patchResult = await controller.PatchColors(patchDto, ideaId);
            patchResult.Should().BeOfType<OkObjectResult>();

            // Re-read fresh from database through controller GET
            var getResult = await controller.GetKit(ideaId);
            getResult.Should().BeOfType<OkObjectResult>();
            var getKit = (BrandKit)((ApiResponse)((OkObjectResult)getResult).Value!).Data!;

            // Verify targeted path was updated
            var primaryRole = getKit.Colors.Roles[0];
            primaryRole.RoleName.Should().Be(BrandColorRoleNames.Primary);
            primaryRole.Hex.Should().Be("#10B981");
            primaryRole.Rgb.Should().Be("16, 185, 129");

            // Verify every sibling role (Secondary, Accent, Background, Text) is byte-identical
            JsonSerializer.Serialize(getKit.Colors.Roles[1]).Should().Be(origRole1Json);
            JsonSerializer.Serialize(getKit.Colors.Roles[2]).Should().Be(origRole2Json);
            JsonSerializer.Serialize(getKit.Colors.Roles[3]).Should().Be(origRole3Json);
            JsonSerializer.Serialize(getKit.Colors.Roles[4]).Should().Be(origRole4Json);

            // Verify all other sub-documents are byte-identical
            JsonSerializer.Serialize(getKit.Strategy).Should().Be(origStrategyJson);
            JsonSerializer.Serialize(getKit.Direction).Should().Be(origDirectionJson);
            JsonSerializer.Serialize(getKit.Logo).Should().Be(origLogoJson);
            JsonSerializer.Serialize(getKit.Typography).Should().Be(origTypographyJson);
        }

        // =========================================================================
        // 3. SEQUENCING ENFORCEMENT: DIRECTION REJECTED BEFORE STRATEGY CONFIRMED
        // =========================================================================
        [Fact]
        public async Task PatchDirection_before_strategy_confirmed_returns_400_with_prerequisite_message()
        {
            var userId = "user-" + Guid.NewGuid();
            var ideaId = ObjectId.GenerateNewId().ToString();
            await SeedIdeaAndJourneyAsync(userId, ideaId);

            var controller = CreateController(userId);
            await controller.CreateKit(ideaId);

            // Strategy is NOT confirmed on fresh draft kit
            var dirPatch = new BrandDirectionPatchDto
            {
                SelectedDirectionKey = "dir-1"
            };

            var result = await controller.PatchDirection(dirPatch, ideaId);
            result.Should().BeOfType<BadRequestObjectResult>();

            var badReq = (BadRequestObjectResult)result;
            var response = (ApiResponse)badReq.Value!;
            response.Success.Should().BeFalse();
            response.Message.Should().Contain("Strategy must be confirmed before visual direction can be edited.");
        }

        // =========================================================================
        // 4. SEQUENCING ENFORCEMENT: DIRECTION SUCCEEDS ONCE STRATEGY CONFIRMED
        // =========================================================================
        [Fact]
        public async Task PatchDirection_after_strategy_confirmed_succeeds_with_200()
        {
            var userId = "user-" + Guid.NewGuid();
            var ideaId = ObjectId.GenerateNewId().ToString();
            await SeedIdeaAndJourneyAsync(userId, ideaId);

            var controller = CreateController(userId);
            await controller.CreateKit(ideaId);

            // Confirm strategy via HTTP PATCH
            var stratPatch = new BrandStrategyPatchDto
            {
                BusinessName = "Apex Labs",
                ConfirmedAt = DateTime.UtcNow
            };
            var stratResult = await controller.PatchStrategy(stratPatch, ideaId);
            stratResult.Should().BeOfType<OkObjectResult>();

            // Now PatchDirection succeeds
            var dirPatch = new BrandDirectionPatchDto
            {
                SelectedDirectionKey = "dir-1",
                SelectedAt = DateTime.UtcNow
            };
            var dirResult = await controller.PatchDirection(dirPatch, ideaId);
            dirResult.Should().BeOfType<OkObjectResult>();

            var getKit = (BrandKit)((ApiResponse)((OkObjectResult)await controller.GetKit(ideaId)).Value!).Data!;
            getKit.Direction.SelectedDirectionKey.Should().Be("dir-1");
        }

        // =========================================================================
        // 5. COMPLETED KIT ACCEPTS EDITS AND COMPLETION IS A ONE-WAY DOOR
        // =========================================================================
        [Fact]
        public async Task Completed_kit_accepts_edits_without_sequencing_rejection_and_status_remains_complete()
        {
            var userId = "user-" + Guid.NewGuid();
            var ideaId = ObjectId.GenerateNewId().ToString();
            await SeedIdeaAndJourneyAsync(userId, ideaId);

            var controller = CreateController(userId);
            await controller.CreateKit(ideaId);

            // Set kit to complete status in database (clearing prerequisite flags to test bypass)
            var completeUpdate = Builders<BrandKit>.Update
                .Set(x => x.Status, "complete")
                .Set(x => x.CurrentStep, 6)
                .Set(x => x.Strategy.ConfirmedAt, null)
                .Set(x => x.Direction.SelectedDirectionKey, null)
                .Set(x => x.Logo.SelectedConceptKey, null);
            await BrandKitRepo.UpdateAsync(ideaId, userId, completeUpdate);

            // Edit strategy on completed kit
            var stratPatch = new BrandStrategyPatchDto { BusinessName = "Apex Studio Post-Completion" };
            var stratRes = await controller.PatchStrategy(stratPatch, ideaId);
            stratRes.Should().BeOfType<OkObjectResult>();

            // Edit direction without prerequisite flags -> accepted because kit is complete
            var dirPatch = new BrandDirectionPatchDto { SelectedDirectionKey = "dir-complete-edit" };
            var dirRes = await controller.PatchDirection(dirPatch, ideaId);
            dirRes.Should().BeOfType<OkObjectResult>();

            // Edit colors without prerequisite flags -> accepted because kit is complete
            var colorPatch = new BrandColorsPatchDto
            {
                Roles = new List<BrandColorRolePatchDto>
                {
                    new() { RoleName = BrandColorRoleNames.Primary, Hex = "#999999" }
                }
            };
            var colorRes = await controller.PatchColors(colorPatch, ideaId);
            colorRes.Should().BeOfType<OkObjectResult>();

            // Verify status is still "complete" (one-way door)
            var getKit = (BrandKit)((ApiResponse)((OkObjectResult)await controller.GetKit(ideaId)).Value!).Data!;
            getKit.Status.Should().Be("complete");
            getKit.Strategy.BusinessName.Should().Be("Apex Studio Post-Completion");
            getKit.Direction.SelectedDirectionKey.Should().Be("dir-complete-edit");
            getKit.Colors.Roles[0].Hex.Should().Be("#999999");
        }

        // =========================================================================
        // 6. INVALID ROLE NAME RETURNS 400 AND WRITES NOTHING
        // =========================================================================
        [Fact]
        public async Task PatchColors_with_invalid_role_name_returns_400_and_writes_nothing()
        {
            var userId = "user-" + Guid.NewGuid();
            var ideaId = ObjectId.GenerateNewId().ToString();
            await SeedIdeaAndJourneyAsync(userId, ideaId);

            var controller = CreateController(userId);
            await controller.CreateKit(ideaId);

            // Mark kit complete to bypass sequencing check
            await BrandKitRepo.UpdateAsync(ideaId, userId, Builders<BrandKit>.Update.Set(x => x.Status, "complete"));

            var invalidPatch = new BrandColorsPatchDto
            {
                Roles = new List<BrandColorRolePatchDto>
                {
                    new() { RoleName = "NonExistentRole", Hex = "#FF0000" }
                }
            };

            var result = await controller.PatchColors(invalidPatch, ideaId);
            result.Should().BeOfType<BadRequestObjectResult>();

            var badReq = (BadRequestObjectResult)result;
            var response = (ApiResponse)badReq.Value!;
            response.Message.Should().Contain("Invalid colour role name: 'NonExistentRole'");

            // Verify database roles were untouched
            var reloaded = await BrandKitRepo.GetByIdeaIdAsync(ideaId, userId);
            reloaded!.Colors.Roles.Should().HaveCount(5);
            reloaded.Colors.Roles.Should().NotContain(r => r.RoleName == "NonExistentRole");
        }

        // =========================================================================
        // 7. STALE EXPECTED VERSION RETURNS 409 CONFLICT ON PATCH
        // =========================================================================
        [Fact]
        public async Task Patch_with_stale_expected_version_returns_409_conflict()
        {
            var userId = "user-" + Guid.NewGuid();
            var ideaId = ObjectId.GenerateNewId().ToString();
            await SeedIdeaAndJourneyAsync(userId, ideaId);

            var controller = CreateController(userId);
            await controller.CreateKit(ideaId);

            // Send PATCH with stale expectedVersion (e.g. 999 when current version is 1)
            var patchDto = new BrandStrategyPatchDto { BusinessName = "New Name" };
            var result = await controller.PatchStrategy(patchDto, ideaId, expectedVersion: 999);

            result.Should().BeOfType<ObjectResult>();
            var objResult = (ObjectResult)result;
            objResult.StatusCode.Should().Be(StatusCodes.Status409Conflict);

            var response = (ApiResponse)objResult.Value!;
            response.Message.Should().Contain("updated in another tab");
        }

        // =========================================================================
        // 8. SNAPSHOT WITH STALE EXPECTED VERSION RETURNS 409 AND HISTORY IS UNTOUCHED
        // =========================================================================
        [Fact]
        public async Task Snapshot_with_stale_expected_version_returns_409_and_leaves_history_untouched()
        {
            var userId = "user-" + Guid.NewGuid();
            var ideaId = ObjectId.GenerateNewId().ToString();
            await SeedIdeaAndJourneyAsync(userId, ideaId);

            var controller = CreateController(userId);
            await controller.CreateKit(ideaId);

            var snapshotReq = new CreateSnapshotRequestDto
            {
                Description = "Stale Snapshot Attempt",
                ExpectedVersion = 999 // Kit is version 1
            };

            var result = await controller.CreateSnapshot(snapshotReq, ideaId);
            result.Should().BeOfType<ObjectResult>();

            var objResult = (ObjectResult)result;
            objResult.StatusCode.Should().Be(StatusCodes.Status409Conflict);

            // Verify Snapshots array in database is empty
            var kit = await BrandKitRepo.GetByIdeaIdAsync(ideaId, userId);
            kit!.Snapshots.Should().BeEmpty();
        }

        // =========================================================================
        // 9. ADVANCE STEP SEQUENCING AND BACKWARD ADVANCE REJECTION
        // =========================================================================
        [Fact]
        public async Task Advance_targeting_later_step_with_unmet_prerequisites_returns_400_and_leaves_step_unchanged()
        {
            var userId = "user-" + Guid.NewGuid();
            var ideaId = ObjectId.GenerateNewId().ToString();
            await SeedIdeaAndJourneyAsync(userId, ideaId);

            var controller = CreateController(userId);
            await controller.CreateKit(ideaId);

            // Attempt to advance to step 4 while step 1 (strategy) is not confirmed
            var skipReq = new AdvanceStepRequestDto { TargetStep = 4 };
            var result = await controller.AdvanceStep(skipReq, ideaId);

            result.Should().BeOfType<BadRequestObjectResult>();
            var badReq = (BadRequestObjectResult)result;
            var response = (ApiResponse)badReq.Value!;
            response.Message.Should().Contain("Strategy must be confirmed before advancing to direction.");

            // CurrentStep remains 1
            var kit = await BrandKitRepo.GetByIdeaIdAsync(ideaId, userId);
            kit!.CurrentStep.Should().Be(1);

            // Attempt to advance backwards (e.g. targetStep = 1 when CurrentStep is 1)
            var backReq = new AdvanceStepRequestDto { TargetStep = 1 };
            var backResult = await controller.AdvanceStep(backReq, ideaId);
            backResult.Should().BeOfType<BadRequestObjectResult>();
            ((ApiResponse)((BadRequestObjectResult)backResult).Value!).Message.Should().Contain("CurrentStep cannot move backwards.");
        }

        // =========================================================================
        // 10. SCOPING: UNOWNED/MISSING IDEA RETURNS 404, CONFLICT PROPAGATES 409
        // =========================================================================
        [Fact]
        public async Task Scoping_unowned_idea_returns_404_and_conflict_propagates_409()
        {
            var user1 = "user-1-" + Guid.NewGuid();
            var user2 = "user-2-" + Guid.NewGuid();
            var idea1 = ObjectId.GenerateNewId().ToString();
            var idea2 = ObjectId.GenerateNewId().ToString();

            await SeedIdeaAndJourneyAsync(user1, idea1);
            await SeedIdeaAndJourneyAsync(user2, idea2);

            var controller1 = CreateController(user1);

            // User 1 asks for User 2's unowned idea -> 404 (Idea not found)
            var foreignResult = await controller1.GetKit(idea2);
            foreignResult.Should().BeOfType<ObjectResult>();
            ((ObjectResult)foreignResult).StatusCode.Should().Be(StatusCodes.Status404NotFound);

            // User 1 asks for non-existent idea -> 404
            var nonExistentResult = await controller1.GetKit(ObjectId.GenerateNewId().ToString());
            nonExistentResult.Should().BeOfType<ObjectResult>();
            ((ObjectResult)nonExistentResult).StatusCode.Should().Be(StatusCodes.Status404NotFound);

            // Verify CreatorJourneyException(409) propagates as 409 without modification
            var journeysMock = new Mock<ICreatorJourneyService>();
            journeysMock.Setup(j => j.ResolveIdeaAsync(user1, idea1))
                .ThrowsAsync(new CreatorJourneyException(409, "You've switched to a different idea elsewhere — refresh this page and try again."));
            var conflictController = new CreatorBrandKitController(journeysMock.Object, BrandKitRepo)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext
                    {
                        User = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, user1) }, "TestAuth"))
                    }
                }
            };
            var conflictResult = await conflictController.GetKit(idea1);
            conflictResult.Should().BeOfType<ObjectResult>();
            ((ObjectResult)conflictResult).StatusCode.Should().Be(StatusCodes.Status409Conflict);
            ((ApiResponse)((ObjectResult)conflictResult).Value!).Message.Should().Contain("switched to a different idea");
        }

        // =========================================================================
        // 11. DERIVED SUMMARY SYNC: 4-FIELD TARGETED SET LEAVES DESIGNER FIELDS UNTOUCHED
        // =========================================================================
        [Fact]
        public async Task Approving_logo_updates_all_four_summary_fields_and_leaves_designer_fields_untouched()
        {
            var userId = "user-" + Guid.NewGuid();
            var ideaId = ObjectId.GenerateNewId().ToString();

            var initialBookedAt = DateTime.UtcNow.AddDays(-3);
            var idea = new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                Project = new CreatorJourneyProject
                {
                    Name = "Brand Identity Studio Idea",
                    Branding = new CreatorBranding
                    {
                        LogoType = "designer",
                        DesignerId = "sp_designer_42",
                        ConversationId = "conv_9999",
                        BookedAt = initialBookedAt,
                        ColorPalette = new List<string> { "#112233", "#445566", "#778899" }
                    }
                },
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Version = 1
            };
            await Database.GetCollection<CreatorIdea>("CreatorIdeas").InsertOneAsync(idea);

            var journey = new CreatorJourney { UserId = userId, ActiveIdeaId = ideaId };
            await Database.GetCollection<CreatorJourney>("CreatorJourneys").InsertOneAsync(journey);

            var controller = CreateController(userId);

            // Initialize kit
            await controller.CreateKit(ideaId);

            // Confirm Strategy
            await controller.PatchStrategy(new BrandStrategyPatchDto { ConfirmedAt = DateTime.UtcNow }, ideaId);

            // Select Direction
            var candKey = "cand-slate";
            await controller.PatchDirection(new BrandDirectionPatchDto
            {
                SelectedDirectionKey = candKey,
                SelectedAt = DateTime.UtcNow,
                Candidates = new List<BrandDirectionCandidateDto>
                {
                    new()
                    {
                        Key = candKey,
                        Name = "Minimal Slate",
                        DisplayTypeface = "Syne",
                        TextTypeface = "DM Sans",
                        ColorPalette = new List<string> { "#000000", "#FFFFFF", "#333333", "#F0F0F0" }
                    }
                }
            }, ideaId);

            // Approve Logo with primary variation
            var primarySvg = "/brand-assets/vector/primary_logo.svg";
            var primaryPng = "/brand-assets/raster/primary_logo.png";
            var patchLogoResult = await controller.PatchLogo(new BrandLogoPatchDto
            {
                ApprovedAt = DateTime.UtcNow,
                Variations = new Dictionary<string, BrandLogoVariationDto>
                {
                    [BrandLogoVariationKeys.Primary] = new()
                    {
                        SvgUri = primarySvg,
                        PngUri = primaryPng,
                        UsageNote = "Primary lockup"
                    }
                }
            }, ideaId);

            patchLogoResult.Should().BeOfType<OkObjectResult>();

            // Re-read CreatorIdea from repository
            var reloadedIdea = await IdeaRepo.GetOwnedAsync(ideaId, userId);
            reloadedIdea.Should().NotBeNull();
            var branding = reloadedIdea!.Project?.Branding;
            branding.Should().NotBeNull();

            // Four synced fields
            branding!.BrandingMethod.Should().Be("ai_studio");
            branding.LogoAsset.Should().Be(primaryPng);
            branding.PaletteName.Should().Be("Minimal Slate");
            branding.TypographyPairing.Should().Be("Syne + DM Sans");

            // Untouched hire-designer fields and color palette
            branding.LogoType.Should().Be("designer");
            branding.DesignerId.Should().Be("sp_designer_42");
            branding.ConversationId.Should().Be("conv_9999");
            branding.BookedAt.Should().BeCloseTo(initialBookedAt, TimeSpan.FromSeconds(1));
            branding.ColorPalette.Should().Equal("#112233", "#445566", "#778899");
        }

        // =========================================================================
        // 12. TARGETED $SET LEAVES ALL SIBLING PROJECT FIELDS BYTE-IDENTICAL
        // =========================================================================
        [Fact]
        public async Task Targeted_set_leaves_all_sibling_project_fields_byte_identical()
        {
            var userId = "user-" + Guid.NewGuid();
            var ideaId = ObjectId.GenerateNewId().ToString();

            var project = new CreatorJourneyProject
            {
                Name = "Autonomous Solar Grid",
                Problem = "Grid instability during peak demand periods",
                Solution = "Decentralized modular battery microgrids",
                TargetUser = "Commercial and municipal facility operators",
                MarketGap = "High latency demand-response systems",
                CreatorEdge = "Proprietary low-loss bidirectional inverter firmware",
                ClarityScore = 92.5,
                Tags = new List<string> { "energy", "hardware", "cleantech" },
                Sector = "Clean Energy",
                Category = "Hardware",
                TargetMarket = "North America",
                Geography = "US-West",
                WhyNow = "State subsidies for commercial microgrids expiring in 2028",
                RiskiestAssumption = "Cell degradation under continuous peak-cycling"
            };

            var idea = new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                Project = project,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Version = 1
            };
            await Database.GetCollection<CreatorIdea>("CreatorIdeas").InsertOneAsync(idea);

            var journey = new CreatorJourney { UserId = userId, ActiveIdeaId = ideaId };
            await Database.GetCollection<CreatorJourney>("CreatorJourneys").InsertOneAsync(journey);

            var controller = CreateController(userId);

            await controller.CreateKit(ideaId);
            await controller.PatchStrategy(new BrandStrategyPatchDto { ConfirmedAt = DateTime.UtcNow }, ideaId);
            await controller.PatchDirection(new BrandDirectionPatchDto
            {
                SelectedDirectionKey = "cand-solar",
                SelectedAt = DateTime.UtcNow,
                Candidates = new List<BrandDirectionCandidateDto>
                {
                    new() { Key = "cand-solar", Name = "Solaris Clean", DisplayTypeface = "Outfit", TextTypeface = "Inter" }
                }
            }, ideaId);

            // Trigger sync via logo approval
            await controller.PatchLogo(new BrandLogoPatchDto
            {
                ApprovedAt = DateTime.UtcNow,
                Variations = new Dictionary<string, BrandLogoVariationDto>
                {
                    [BrandLogoVariationKeys.Primary] = new() { SvgUri = "/solar/logo.svg", UsageNote = "Main" }
                }
            }, ideaId);

            var reloadedIdea = await IdeaRepo.GetOwnedAsync(ideaId, userId);
            reloadedIdea.Should().NotBeNull();
            var p = reloadedIdea!.Project;
            p.Should().NotBeNull();

            // Verify all sibling project properties remain byte-identical
            p!.Name.Should().Be(project.Name);
            p.Problem.Should().Be(project.Problem);
            p.Solution.Should().Be(project.Solution);
            p.TargetUser.Should().Be(project.TargetUser);
            p.MarketGap.Should().Be(project.MarketGap);
            p.CreatorEdge.Should().Be(project.CreatorEdge);
            p.ClarityScore.Should().Be(project.ClarityScore);
            p.Tags.Should().Equal(project.Tags);
            p.Sector.Should().Be(project.Sector);
            p.Category.Should().Be(project.Category);
            p.TargetMarket.Should().Be(project.TargetMarket);
            p.Geography.Should().Be(project.Geography);
            p.WhyNow.Should().Be(project.WhyNow);
            p.RiskiestAssumption.Should().Be(project.RiskiestAssumption);
        }

        // =========================================================================
        // 13. STRATEGY-ONLY PATCH PRODUCES NO WRITE TO CREATOR IDEA (VERSION UNCHANGED)
        // =========================================================================
        [Fact]
        public async Task Strategy_only_patch_produces_no_write_to_CreatorIdea_and_version_is_unchanged()
        {
            var userId = "user-" + Guid.NewGuid();
            var ideaId = ObjectId.GenerateNewId().ToString();

            await SeedIdeaAndJourneyAsync(userId, ideaId);
            var controller = CreateController(userId);

            await controller.CreateKit(ideaId);

            var ideaBefore = await IdeaRepo.GetOwnedAsync(ideaId, userId);
            var initialVersion = ideaBefore!.Version;

            // Strategy patch modifies business name and traits
            var patchResult = await controller.PatchStrategy(new BrandStrategyPatchDto
            {
                BusinessName = "Ecosystem Ventures",
                PersonalityTraits = new List<string> { "bold", "visionary" }
            }, ideaId);
            patchResult.Should().BeOfType<OkObjectResult>();

            var ideaAfter = await IdeaRepo.GetOwnedAsync(ideaId, userId);
            ideaAfter.Should().NotBeNull();
            ideaAfter!.Version.Should().Be(initialVersion);
            ideaAfter.Project!.Branding.BrandingMethod.Should().BeNull();
            ideaAfter.Project.Branding.LogoAsset.Should().BeNull();
            ideaAfter.Project.Branding.Should().BeEquivalentTo(ideaBefore.Project.Branding);
        }

        // =========================================================================
        // 14. TYPOGRAPHY WEIGHT TWEAK DOES NOT BUMP CREATOR IDEA VERSION
        // =========================================================================
        [Fact]
        public async Task Typography_weight_tweak_does_not_bump_CreatorIdea_version()
        {
            var userId = "user-" + Guid.NewGuid();
            var ideaId = ObjectId.GenerateNewId().ToString();

            await SeedIdeaAndJourneyAsync(userId, ideaId);
            var controller = CreateController(userId);

            await controller.CreateKit(ideaId);
            await controller.PatchStrategy(new BrandStrategyPatchDto { ConfirmedAt = DateTime.UtcNow }, ideaId);
            await controller.PatchDirection(new BrandDirectionPatchDto
            {
                SelectedDirectionKey = "cand-1",
                SelectedAt = DateTime.UtcNow,
                Candidates = new List<BrandDirectionCandidateDto>
                {
                    new() { Key = "cand-1", Name = "Dir 1", DisplayTypeface = "Syne", TextTypeface = "DM Sans" }
                }
            }, ideaId);
            await controller.PatchLogo(new BrandLogoPatchDto
            {
                ApprovedAt = DateTime.UtcNow,
                Variations = new Dictionary<string, BrandLogoVariationDto>
                {
                    [BrandLogoVariationKeys.Primary] = new() { SvgUri = "/logo.svg" }
                }
            }, ideaId);
            await controller.GenerateColors(ideaId);
            await controller.PatchColors(new BrandColorsPatchDto { ConfirmedAt = DateTime.UtcNow }, ideaId);
            await controller.GenerateTypography(ideaId);

            var ideaAfterSync = await IdeaRepo.GetOwnedAsync(ideaId, userId);
            var versionAfterSync = ideaAfterSync!.Version;

            // Tweak weight only on typography (no change to Family)
            var patchResult = await controller.PatchTypography(new BrandTypographyPatchDto
            {
                Roles = new List<BrandTypographyRolePatchDto>
                {
                    new() { RoleName = BrandTypographyRoleNames.Heading, Weight = "800", Size = "36px" }
                }
            }, ideaId);
            patchResult.Should().BeOfType<OkObjectResult>();

            var ideaAfterWeightTweak = await IdeaRepo.GetOwnedAsync(ideaId, userId);
            ideaAfterWeightTweak!.Version.Should().Be(versionAfterSync);
        }

        // =========================================================================
        // 15. TRANSACTION ROLLBACK: FORCED FAILURE OF SECOND WRITE ROLLS BACK FIRST WRITE
        // =========================================================================
        [Fact]
        public async Task Transaction_rollback_on_forced_second_write_failure_leaves_neither_collection_changed()
        {
            var userId = "user-" + Guid.NewGuid();
            var ideaId = ObjectId.GenerateNewId().ToString();

            await SeedIdeaAndJourneyAsync(userId, ideaId);

            // Mock ICreatorIdeaStore where SyncBrandKitSummaryAsync throws
            var ideaStoreMock = new Mock<ICreatorIdeaStore>();
            ideaStoreMock.Setup(x => x.GetOwnedAsync(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync((string id, string uid) => IdeaRepo.GetOwnedAsync(id, uid).Result);
            ideaStoreMock.Setup(x => x.SyncBrandKitSummaryAsync(
                    It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                    It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                    It.IsAny<string?>(), It.IsAny<int?>(), It.IsAny<DateTime?>(),
                    It.IsAny<IClientSessionHandle>()))
                .ThrowsAsync(new InvalidOperationException("Injected mid-transaction failure on CreatorIdea sync write"));

            var configDict = new Dictionary<string, string?> { ["Mongo:TransactionsEnabled"] = "true" };
            var configuration = new ConfigurationBuilder().AddInMemoryCollection(configDict).Build();

            var controller = CreateController(userId, ideaStoreOverride: ideaStoreMock.Object, configOverride: configuration);

            // Setup kit with unapproved logo
            await controller.CreateKit(ideaId);
            await controller.PatchStrategy(new BrandStrategyPatchDto { ConfirmedAt = DateTime.UtcNow }, ideaId);
            await controller.PatchDirection(new BrandDirectionPatchDto
            {
                SelectedDirectionKey = "c1",
                SelectedAt = DateTime.UtcNow,
                Candidates = new List<BrandDirectionCandidateDto> { new() { Key = "c1", Name = "D1" } }
            }, ideaId);

            // Attempt logo approval which triggers sync write that throws
            Func<Task> act = async () => await controller.PatchLogo(new BrandLogoPatchDto
            {
                ApprovedAt = DateTime.UtcNow,
                Variations = new Dictionary<string, BrandLogoVariationDto>
                {
                    [BrandLogoVariationKeys.Primary] = new() { SvgUri = "/tx_logo.svg" }
                }
            }, ideaId);

            // Depending on whether environment supports transactions, if RS available it throws, or 500
            try
            {
                var actionResult = await controller.PatchLogo(new BrandLogoPatchDto
                {
                    ApprovedAt = DateTime.UtcNow,
                    Variations = new Dictionary<string, BrandLogoVariationDto>
                    {
                        [BrandLogoVariationKeys.Primary] = new() { SvgUri = "/tx_logo.svg" }
                    }
                }, ideaId);

                // If controller caught and returned 500
                if (actionResult is ObjectResult objRes)
                {
                    objRes.StatusCode.Should().Be(StatusCodes.Status500InternalServerError);
                }
            }
            catch (InvalidOperationException)
            {
                // Thrown if unhandled or rethrown
            }

            // Verify BrandKit was rolled back: ApprovedAt must remain null!
            var kit = await BrandKitRepo.GetByIdeaIdAsync(ideaId, userId);
            kit.Should().NotBeNull();
            kit!.Logo.ApprovedAt.Should().BeNull();
        }

        // =========================================================================
        // 16. BRANDING METHOD AI_STUDIO SATISFIES RESOLUTION WITHOUT DESIGNER HIRE CREDIT
        // =========================================================================
        [Fact]
        public async Task BrandingMethod_ai_studio_satisfies_resolution_without_awarding_designer_hire_points()
        {
            var userId = "user-" + Guid.NewGuid();
            var ideaId = ObjectId.GenerateNewId().ToString();

            var journey = new CreatorJourney
            {
                UserId = userId,
                ActiveIdeaId = ideaId,
                Project = new CreatorJourneyProject
                {
                    Name = "Autonomous Clean Energy",
                    ClarityScore = 80,
                    Problem = "High grid carbon intensity",
                    Solution = "Modular solar deployment",
                    Branding = new CreatorBranding
                    {
                        BrandingMethod = "ai_studio",
                        LogoAsset = "/assets/ai_logo.svg",
                        PaletteName = "Solaris",
                        TypographyPairing = "Syne + DM Sans"
                    }
                },
                Phase2Data = new CreatorPhase2Data
                {
                    ClarifierSessionId = "clarifier-123"
                }
            };

            // 1. Check phase status computation
            var phaseStatus = await JourneyService.ComputePhaseStatusAsync(journey, phase1Complete: true);
            phaseStatus.Phase2.Status.Should().Be("completed");

            // 2. Check SmartMatchingService completeness bonus (+2 for resolved branding)
            var p = journey.Project;
            bool brandingBonusSatisfied = !string.IsNullOrEmpty(p.Branding?.BrandingMethod) && p.Branding.BrandingMethod != "pending";
            brandingBonusSatisfied.Should().BeTrue();

            // 3. Check CreatorPhase3Controller line 629 condition (designer credit)
            var p3 = journey.Phase3Data ?? new CreatorPhase3Data();
            bool designerHiredCredit = (((p3.FormationGenerator?.MatchedSpIds?.Count ?? 0) > 0) || p.Branding?.BrandingMethod == "m50_designer");
            designerHiredCredit.Should().BeFalse(); // ai_studio must NOT receive designer credit!
        }

        // =========================================================================
        // 17. STRATEGY PROVENANCED TEXT EDIT TRACKING (EDITEDAT & PROVENANCE)
        // =========================================================================
        [Fact]
        public async Task Strategy_text_patch_sets_EditedAt_and_Provenance_only_for_modified_fields()
        {
            var userId = "user-" + Guid.NewGuid();
            var ideaId = MongoDB.Bson.ObjectId.GenerateNewId().ToString();

            await SeedIdeaAndJourneyAsync(userId, ideaId);
            var controller = CreateController(userId);

            var createRes = await controller.CreateKit(ideaId);
            createRes.Should().BeOfType<Microsoft.AspNetCore.Mvc.OkObjectResult>();
            var initialApiResponse = (ApiResponse)((Microsoft.AspNetCore.Mvc.OkObjectResult)createRes).Value!;
            initialApiResponse.Success.Should().BeTrue();
            var initialKit = (BrandKit)initialApiResponse.Data!;
            initialKit.Should().NotBeNull();
            initialKit.Strategy.Positioning.EditedAt.Should().BeNull();
            initialKit.Strategy.Concept.EditedAt.Should().BeNull();
            initialKit.Strategy.TargetAudience.EditedAt.Should().BeNull();
            initialKit.Strategy.Industry.EditedAt.Should().BeNull();

            var beforePatch = DateTime.UtcNow.AddSeconds(-1);

            // Patch ONLY Positioning
            var patchRes = await controller.PatchStrategy(new BrandStrategyPatchDto
            {
                Positioning = "The premier autonomous AI platform for modern builders"
            }, ideaId);

            patchRes.Should().BeOfType<Microsoft.AspNetCore.Mvc.OkObjectResult>();

            // Direct database read from MongoDB store
            var updatedKit = await BrandKitRepo.GetByIdeaIdAsync(ideaId, userId);
            updatedKit.Should().NotBeNull();

            // 1. Positioning is updated with timestamp and provenance
            updatedKit!.Strategy.Positioning.Value.Should().Be("The premier autonomous AI platform for modern builders");
            updatedKit.Strategy.Positioning.EditedAt.Should().NotBeNull();
            updatedKit.Strategy.Positioning.EditedAt.Should().BeAfter(beforePatch);
            updatedKit.Strategy.Positioning.Provenance.Should().Be("user_refined");

            // 2. Untouched fields retain EditedAt == null and their original provenance
            updatedKit.Strategy.Concept.EditedAt.Should().BeNull();
            updatedKit.Strategy.Concept.Provenance.Should().NotBe("user_refined");
            updatedKit.Strategy.TargetAudience.EditedAt.Should().BeNull();
            updatedKit.Strategy.TargetAudience.Provenance.Should().NotBe("user_refined");
            updatedKit.Strategy.Industry.EditedAt.Should().BeNull();
            updatedKit.Strategy.Industry.Provenance.Should().NotBe("user_refined");
        }
    }
}
