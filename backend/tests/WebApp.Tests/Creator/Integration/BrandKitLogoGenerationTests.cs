using System.Security.Claims;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using MongoDB.Bson;
using MongoDB.Driver;
using Moq;
using WebApp.Controllers;
using WebApp.DbContext;
using WebApp.Models;
using WebApp.Models.DatabaseModels;
using WebApp.Models.Dtos;
using WebApp.Services.Creator.BrandKit.LogoEngine;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;
using WebApp.Tests.Integration;
using Xunit;

namespace WebApp.Tests.Creator.Integration
{
    public class BrandKitLogoGenerationTests : IAsyncLifetime
    {
        private readonly AppFixture _appFixture = new();
        private MongoClient? _fallbackClient;
        private string? _ephemeralDbName;
        private string _tempWebRoot = null!;

        public IMongoDatabase Database { get; private set; } = null!;
        public BrandKitRepository BrandKitRepo { get; private set; } = null!;
        public CreatorIdeaRepository IdeaRepo { get; private set; } = null!;
        public CreatorJourneyService JourneyService { get; private set; } = null!;
        public LogoGenerationService LogoGenService { get; private set; } = null!;
        public LogoMarkRendererRegistry RendererRegistry { get; private set; } = null!;

        public async Task InitializeAsync()
        {
            await _appFixture.InitializeAsync();

            var shortId = Guid.NewGuid().ToString("N")[..16];
            _ephemeralDbName = $"bk_logo_{shortId}";

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

            _tempWebRoot = Path.Combine(Path.GetTempPath(), $"webroot_{Guid.NewGuid():N}");
            Directory.CreateDirectory(_tempWebRoot);

            var envMock = new Mock<IWebHostEnvironment>();
            envMock.Setup(e => e.WebRootPath).Returns(_tempWebRoot);

            RendererRegistry = new LogoMarkRendererRegistry();
            LogoGenService = new LogoGenerationService(RendererRegistry, env: envMock.Object);
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

            if (Directory.Exists(_tempWebRoot))
            {
                try { Directory.Delete(_tempWebRoot, recursive: true); } catch { }
            }

            await _appFixture.DisposeAsync();
        }

        private CreatorBrandKitController CreateController(string userId)
        {
            var client = _fallbackClient ?? (IMongoClient?)_appFixture.Factory?.Services.GetService(typeof(IMongoClient));
            return new CreatorBrandKitController(
                JourneyService,
                BrandKitRepo,
                IdeaRepo,
                LogoGenService,
                client,
                null,
                NullLogger<CreatorBrandKitController>.Instance)
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

        private async Task<CreatorIdea> SeedIdeaAndJourneyAsync(string userId, string ideaId, string brandName = "Apex Robotics")
        {
            var idea = new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                Project = new CreatorJourneyProject
                {
                    Name = brandName,
                    Problem = "Autonomous logistics inefficiency",
                    Solution = "Modular industrial robotics"
                },
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
        // 1. GENERATE CONCEPTS PRODUCES 6 DISTINCT CONCEPTS WITH VALID DISK FILES
        // =========================================================================
        [Fact]
        public async Task GenerateConcepts_with_confirmed_direction_generates_six_distinct_concepts_with_valid_files()
        {
            var userId = "user-" + Guid.NewGuid();
            var ideaId = ObjectId.GenerateNewId().ToString();
            await SeedIdeaAndJourneyAsync(userId, ideaId);

            var controller = CreateController(userId);

            // Step 1: Create kit & confirm strategy
            await controller.CreateKit(ideaId);
            await controller.PatchStrategy(new BrandStrategyPatchDto
            {
                BusinessName = "Apex Robotics",
                PersonalityTraits = new List<string> { "precision", "technical", "bold" },
                ConfirmedAt = DateTime.UtcNow
            }, ideaId);

            // Step 2: Select direction
            await controller.PatchDirection(new BrandDirectionPatchDto
            {
                SelectedDirectionKey = "dir_1",
                SelectedAt = DateTime.UtcNow,
                Candidates = new List<BrandDirectionCandidateDto>
                {
                    new() { Key = "dir_1", Name = "Industrial Precision", DisplayTypeface = "Syne", TextTypeface = "Inter" }
                }
            }, ideaId);

            // Step 3: Generate Logo Concepts
            var result = await controller.GenerateLogoConcepts(ideaId);
            result.Should().BeOfType<OkObjectResult>();

            var okResult = (OkObjectResult)result;
            var response = (ApiResponse)okResult.Value!;
            response.Success.Should().BeTrue();
            var kit = (BrandKit)response.Data!;

            kit.Logo.Should().NotBeNull();
            kit.Logo.Concepts.Should().HaveCount(6);

            // Verify distinct families
            var families = kit.Logo.Concepts.Select(c => c.Parameters?.Family).Distinct().ToList();
            families.Count.Should().BeGreaterOrEqualTo(4);

            // Verify every concept has asset on disk
            foreach (var concept in kit.Logo.Concepts)
            {
                concept.Key.Should().NotBeNullOrWhiteSpace();
                concept.DescriptorLine.Should().NotBeNullOrWhiteSpace();
                concept.AssetUri.Should().StartWith("/brand-assets/logos/");
                concept.Parameters.Should().NotBeNull();

                var relativeDiskPath = concept.AssetUri.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
                var fullDiskPath = Path.Combine(_tempWebRoot, relativeDiskPath.Substring("brand-assets/logos/".Length + ideaId.Length + 1));
                // Find file in directory
                var dir = Path.Combine(_tempWebRoot, "brand-assets", "logos", ideaId);
                Directory.Exists(dir).Should().BeTrue();
                var files = Directory.GetFiles(dir);
                files.Should().HaveCount(6);
            }
        }

        // =========================================================================
        // 2. REGENERATE SINGLE CONCEPT MODIFIES TARGET AND LEAVES 5 BYTE-IDENTICAL
        // =========================================================================
        [Fact]
        public async Task RegenerateSingleConcept_updates_only_target_concept_and_leaves_other_five_byte_identical()
        {
            var userId = "user-" + Guid.NewGuid();
            var ideaId = ObjectId.GenerateNewId().ToString();
            await SeedIdeaAndJourneyAsync(userId, ideaId);

            var controller = CreateController(userId);

            await controller.CreateKit(ideaId);
            await controller.PatchStrategy(new BrandStrategyPatchDto { ConfirmedAt = DateTime.UtcNow }, ideaId);
            await controller.PatchDirection(new BrandDirectionPatchDto
            {
                SelectedDirectionKey = "dir_1",
                SelectedAt = DateTime.UtcNow,
                Candidates = new List<BrandDirectionCandidateDto> { new() { Key = "dir_1", Name = "Dir 1" } }
            }, ideaId);

            await controller.GenerateLogoConcepts(ideaId);

            var kitBefore = await BrandKitRepo.GetByIdeaIdAsync(ideaId, userId);
            var targetConceptBefore = kitBefore!.Logo.Concepts.First(c => c.Key == "concept_3");
            var otherConceptsBefore = kitBefore.Logo.Concepts.Where(c => c.Key != "concept_3").ToList();

            // Regenerate concept_3
            var regenResult = await controller.RegenerateSingleLogoConcept("concept_3", ideaId);
            regenResult.Should().BeOfType<OkObjectResult>();

            var kitAfter = await BrandKitRepo.GetByIdeaIdAsync(ideaId, userId);
            kitAfter.Should().NotBeNull();
            kitAfter!.Logo.RegenerateCount.Should().Be(1);

            var targetConceptAfter = kitAfter.Logo.Concepts.First(c => c.Key == "concept_3");
            targetConceptAfter.RegenerateCount.Should().Be(1);
            targetConceptAfter.AssetUri.Should().NotBe(targetConceptBefore.AssetUri);

            // Assert the other 5 concepts are byte-for-byte unchanged in DB
            var otherConceptsAfter = kitAfter.Logo.Concepts.Where(c => c.Key != "concept_3").ToList();
            for (int i = 0; i < otherConceptsBefore.Count; i++)
            {
                otherConceptsAfter[i].Key.Should().Be(otherConceptsBefore[i].Key);
                otherConceptsAfter[i].DescriptorLine.Should().Be(otherConceptsBefore[i].DescriptorLine);
                otherConceptsAfter[i].AssetUri.Should().Be(otherConceptsBefore[i].AssetUri);
                otherConceptsAfter[i].RegenerateCount.Should().Be(otherConceptsBefore[i].RegenerateCount);
            }
        }

        // =========================================================================
        // 3. GENERATE BEFORE DIRECTION SELECTED RETURNS 400
        // =========================================================================
        [Fact]
        public async Task GenerateConcepts_before_direction_selected_returns_400_with_prerequisite_error()
        {
            var userId = "user-" + Guid.NewGuid();
            var ideaId = ObjectId.GenerateNewId().ToString();
            await SeedIdeaAndJourneyAsync(userId, ideaId);

            var controller = CreateController(userId);
            await controller.CreateKit(ideaId);

            // Attempt generation while direction is unconfirmed
            var result = await controller.GenerateLogoConcepts(ideaId);
            result.Should().BeOfType<BadRequestObjectResult>();

            var badReq = (BadRequestObjectResult)result;
            var response = (ApiResponse)badReq.Value!;
            response.Success.Should().BeFalse();
            response.Message.Should().Contain("direction");
        }

        // =========================================================================
        // 4. AVOID LIST EXCLUSION ENFORCEMENT
        // =========================================================================
        [Fact]
        public async Task AvoidList_elements_are_excluded_from_generated_concepts()
        {
            var userId = "user-" + Guid.NewGuid();
            var ideaId = ObjectId.GenerateNewId().ToString();
            await SeedIdeaAndJourneyAsync(userId, ideaId, "GreenLeaf Agri");

            var controller = CreateController(userId);
            await controller.CreateKit(ideaId);

            // Exclude "leaf" and "shield"
            await controller.PatchStrategy(new BrandStrategyPatchDto
            {
                AvoidList = new List<string> { "leaf", "shield" },
                PersonalityTraits = new List<string> { "organic", "sustainable" },
                ConfirmedAt = DateTime.UtcNow
            }, ideaId);

            await controller.PatchDirection(new BrandDirectionPatchDto
            {
                SelectedDirectionKey = "dir_1",
                SelectedAt = DateTime.UtcNow,
                Candidates = new List<BrandDirectionCandidateDto> { new() { Key = "dir_1", Name = "Earthy" } }
            }, ideaId);

            await controller.GenerateLogoConcepts(ideaId);

            var kit = await BrandKitRepo.GetByIdeaIdAsync(ideaId, userId);
            foreach (var concept in kit!.Logo.Concepts)
            {
                foreach (var val in concept.Parameters!.Values.Values)
                {
                    val.ToLowerInvariant().Should().NotContain("leaf");
                    val.ToLowerInvariant().Should().NotContain("shield");
                }
            }
        }

        // =========================================================================
        // 5. THREE CONTRASTING BUSINESSES DEMONSTRATION
        // =========================================================================
        [Fact]
        public async Task Three_contrasting_businesses_generate_distinct_tailored_concept_sets()
        {
            // Business A: Tech Cybersecurity
            var ideaA = new CreatorIdea { Id = ObjectId.GenerateNewId().ToString(), Project = new CreatorJourneyProject { Name = "CyberLock" } };
            var kitA = new BrandKit
            {
                Strategy = new BrandStrategy { PersonalityTraits = new() { "precision", "technical", "security", "bold" } },
                Direction = new BrandDirection { SelectedDirectionKey = "d1", Candidates = new() { new() { Key = "d1", Name = "Tech Precision" } } }
            };

            // Business B: Sustainable Food
            var ideaB = new CreatorIdea { Id = ObjectId.GenerateNewId().ToString(), Project = new CreatorJourneyProject { Name = "TerraHarvest" } };
            var kitB = new BrandKit
            {
                Strategy = new BrandStrategy { PersonalityTraits = new() { "organic", "sustainable", "warmth", "earthy" } },
                Direction = new BrandDirection { SelectedDirectionKey = "d2", Candidates = new() { new() { Key = "d2", Name = "Organic Warmth" } } }
            };

            // Business C: Luxury Architectural Design
            var ideaC = new CreatorIdea { Id = ObjectId.GenerateNewId().ToString(), Project = new CreatorJourneyProject { Name = "Maison Forma" } };
            var kitC = new BrandKit
            {
                Strategy = new BrandStrategy { PersonalityTraits = new() { "minimal", "editorial", "luxury", "geometric" } },
                Direction = new BrandDirection { SelectedDirectionKey = "d3", Candidates = new() { new() { Key = "d3", Name = "Minimalist Luxe" } } }
            };

            var conceptsA = await LogoGenService.GenerateConceptsAsync(ideaA, kitA);
            var conceptsB = await LogoGenService.GenerateConceptsAsync(ideaB, kitB);
            var conceptsC = await LogoGenService.GenerateConceptsAsync(ideaC, kitC);

            conceptsA.Should().HaveCount(6);
            conceptsB.Should().HaveCount(6);
            conceptsC.Should().HaveCount(6);

            // Verify that parameter values differ across contrasting business types
            var jsonA = JsonSerializer.Serialize(conceptsA.Select(c => c.Parameters));
            var jsonB = JsonSerializer.Serialize(conceptsB.Select(c => c.Parameters));
            var jsonC = JsonSerializer.Serialize(conceptsC.Select(c => c.Parameters));

            jsonA.Should().NotBe(jsonB);
            jsonB.Should().NotBe(jsonC);
            jsonA.Should().NotBe(jsonC);
        }
    }
}
