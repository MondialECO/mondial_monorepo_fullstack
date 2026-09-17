using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Security.Claims;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Moq;
using WebApp.Configuration.AiOptions;
using WebApp.Controllers;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Models.DatabaseModels.Ai;
using WebApp.Services.Ai;
using WebApp.Services.Ai.Jobs;
using WebApp.Services.Ai.Providers;
using WebApp.Services.Creator.BrandKit.ColorEngine;
using WebApp.Services.Creator.BrandKit.DirectionEngine;
using WebApp.Services.Creator.BrandKit.LogoEngine;
using WebApp.Services.Creator.BrandKit.TypographyEngine;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;
using Xunit;
using Xunit.Abstractions;

namespace WebApp.Tests
{
    public class BrandStudioOptionAFailureVerificationTests : IAsyncLifetime
    {
        private readonly ITestOutputHelper _output;
        private MongoClient? _mongoClient;
        private string? _dbName;
        private IMongoDatabase _db = null!;

        private BrandKitRepository _brandKitRepo = null!;
        private CreatorIdeaRepository _ideaRepo = null!;
        private CreatorJourneyService _journeyService = null!;
        private AiCreditLedgerRepository _creditLedgerRepo = null!;
        private AiCreditService _creditService = null!;
        private AiSettings _aiSettings = null!;

        public BrandStudioOptionAFailureVerificationTests(ITestOutputHelper output)
        {
            _output = output;
        }

        public async Task InitializeAsync()
        {
            var connStr = Environment.GetEnvironmentVariable("MONGO_TEST_CONNECTION_STRING")
                ?? "mongodb+srv://mongoDB:hr11100010@cluster0.nsfffx4.mongodb.net/";
            _mongoClient = new MongoClient(connStr);
            _dbName = $"verify_opt_a_{Guid.NewGuid():N}"[..24];
            _db = _mongoClient.GetDatabase(_dbName);

            _brandKitRepo = new BrandKitRepository(_db);
            _ideaRepo = new CreatorIdeaRepository(_db);
            _creditLedgerRepo = new AiCreditLedgerRepository(_db);
            var mongoContext = new MongoDbContext(_db);

            _aiSettings = new AiSettings
            {
                CreditCosts = new Dictionary<string, int>
                {
                    ["DirectionGeneration"] = 7,
                    ["LogoParameterSelection"] = 4,
                    ["ColorGeneration"] = 2,
                    ["TypographyGeneration"] = 2,
                    ["LogoConceptRegenerate"] = 0
                },
                ModelRouting = new ModelRoutingSettings
                {
                    Models = new Dictionary<string, string>
                    {
                        ["DirectionGeneration"] = "mock-model",
                        ["LogoParameterSelection"] = "mock-model",
                        ["ColorGeneration"] = "mock-model",
                        ["TypographyGeneration"] = "mock-model"
                    }
                },
                OutputTokenLimits = new Dictionary<string, int>
                {
                    ["DirectionGeneration"] = 4500,
                    ["LogoParameterSelection"] = 3000,
                    ["ColorGeneration"] = 4500,
                    ["TypographyGeneration"] = 2000
                }
            };

            _creditService = new AiCreditService(_creditLedgerRepo, Options.Create(_aiSettings));

            _journeyService = new CreatorJourneyService(
                mongoContext,
                Mock.Of<IBusinessPlanSessionStore>(),
                Mock.Of<IForecastSessionStore>(),
                _ideaRepo,
                Mock.Of<IClarifierSessionStore>());

            await Task.CompletedTask;
        }

        public async Task DisposeAsync()
        {
            if (_mongoClient != null && !string.IsNullOrEmpty(_dbName))
            {
                try { await _mongoClient.DropDatabaseAsync(_dbName); } catch { }
            }
        }

        private CreatorBrandKitController CreateController(
            string userId,
            IDirectionGenerationService? dirGen = null,
            ILogoGenerationService? logoGen = null,
            IColorGenerationService? colorGen = null,
            ITypographyGenerationService? typoGen = null)
        {
            var controller = new CreatorBrandKitController(
                _journeyService,
                _brandKitRepo,
                _ideaRepo,
                logoGenerationService: logoGen,
                mongoClient: _mongoClient,
                config: null,
                logger: NullLogger<CreatorBrandKitController>.Instance,
                logoVariationService: null,
                directionGenerationService: dirGen,
                colorGenerationService: colorGen,
                typographyGenerationService: typoGen,
                aiCreditService: _creditService)
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

            return controller;
        }

        private async Task<(CreatorIdea Idea, BrandKit Kit)> SeedUserAndKitAsync(string userId, string ideaId)
        {
            // Seed Starter Credits
            await _creditLedgerRepo.TryGrantInitialAsync(userId, 200);

            var idea = new CreatorIdea
            {
                Id = ideaId,
                UserId = userId,
                Project = new CreatorJourneyProject
                {
                    Name = "NexusPay",
                    Category = "Fintech",
                    Solution = "Instant cross-border settlement for remote freelancers",
                    TargetUser = "Global freelancers",
                    MarketGap = "High bank transfer fees and multi-day delays",
                    CreatorEdge = "Built on instantaneous decentralized payment rails",
                    Tags = new List<string> { "Fast", "Reliable", "Global" }
                },
                UpdatedAt = DateTime.UtcNow
            };
            await _ideaRepo.AddAsync(idea);

            var kit = new BrandKit
            {
                IdeaId = ideaId,
                UserId = userId,
                Status = "draft",
                CurrentStep = 1,
                Version = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Strategy = new BrandStrategy
                {
                    BusinessName = "NexusPay",
                    NameDisplayForm = "NexusPay",
                    Industry = new BrandProvenancedText { Value = "Fintech", Provenance = "stated" },
                    Positioning = new BrandProvenancedText { Value = "Instant global settlements", Provenance = "stated" },
                    TargetAudience = new BrandProvenancedText { Value = "Global freelancers", Provenance = "stated" },
                    PersonalityTraits = new List<string> { "Precise", "Fast", "Secure" },
                    AvoidList = new List<string> { "Playful", "Cartoonish" },
                    ConfirmedAt = DateTime.UtcNow
                },
                Direction = new BrandDirection
                {
                    RegenerateCount = 0,
                    Candidates = new List<BrandDirectionCandidate>()
                },
                Logo = new BrandLogo
                {
                    RegenerateCount = 0,
                    LogoType = "wordmark",
                    Concepts = new List<BrandLogoConcept>()
                },
                Colors = new BrandColors
                {
                    RegenerateCount = 0,
                    Roles = new List<BrandColorRole>
                    {
                        new() { RoleName = BrandColorRoleNames.Primary, Hex = "#0052FF", Provenance = "stated" },
                        new() { RoleName = BrandColorRoleNames.Secondary, Hex = "#0F172A", Provenance = "stated" },
                        new() { RoleName = BrandColorRoleNames.Accent, Hex = "#38BDF8", Provenance = "stated" },
                        new() { RoleName = BrandColorRoleNames.Background, Hex = "#FFFFFF", Provenance = "stated" },
                        new() { RoleName = BrandColorRoleNames.Text, Hex = "#0F172A", Provenance = "stated" }
                    }
                },
                Typography = new BrandTypography
                {
                    RegenerateCount = 0,
                    Roles = new List<BrandTypographyRole>
                    {
                        new() { RoleName = BrandTypographyRoleNames.LogoType, Family = "Plus Jakarta Sans", IsLocked = true, Provenance = "stated" },
                        new() { RoleName = BrandTypographyRoleNames.Heading, Family = "Space Grotesk", IsLocked = false, Provenance = "stated" },
                        new() { RoleName = BrandTypographyRoleNames.Body, Family = "Plus Jakarta Sans", IsLocked = false, Provenance = "stated" },
                        new() { RoleName = BrandTypographyRoleNames.ButtonAndLabel, Family = "Plus Jakarta Sans", IsLocked = false, Provenance = "stated" }
                    }
                }
            };
            await _brandKitRepo.AddAsync(kit);

            return (idea, kit);
        }

        [Fact]
        public async Task OptionA_LiveVerification_AllFourServices_FailHonest_RefundCredits_PreserveRegenCap()
        {
            _output.WriteLine("==========================================================================");
            _output.WriteLine("OPTION A LIVE BACKEND VERIFICATION: 4 BRAND STUDIO SERVICES");
            _output.WriteLine("==========================================================================");

            // -------------------------------------------------------------------------
            // SERVICE 1: DirectionGeneration
            // -------------------------------------------------------------------------
            {
                var userId = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
                var ideaId = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
                var (idea, kit) = await SeedUserAndKitAsync(userId, ideaId);

                var initialBal = await _creditService.GetBalanceAsync(userId);
                initialBal.Balance.Should().Be(200);

                // Setup Mock AI Provider that throws to simulate model/network outage or JSON truncation failure
                var mockAi = new Mock<IAiProvider>();
                mockAi.Setup(a => a.CompleteAsync(It.IsAny<AiCompletionRequest>(), It.IsAny<System.Threading.CancellationToken>()))
                    .ThrowsAsync(new HttpRequestException("AI upstream model gateway timeout (HTTP 504)"));

                var mockRouter = new Mock<IModelRouter>();
                mockRouter.Setup(r => r.Resolve(It.IsAny<string>())).Returns("google/gemini-3.8-flash");

                var dirService = new DirectionGenerationService(mockAi.Object, mockRouter.Object, NullLogger<DirectionGenerationService>.Instance, Options.Create(_aiSettings));
                var controller = CreateController(userId, dirGen: dirService);

                // Act: Invoke controller endpoint
                var actionResult = await controller.GenerateDirections(ideaId, expectedVersion: kit.Version);

                // Assert: User receives honest 500 error status
                var objResult = actionResult.Should().BeOfType<ObjectResult>().Subject;
                objResult.StatusCode.Should().Be(500);

                // Assert: Balance is debited 7 and refunded 7 (net unchanged at 200)
                var finalBal = await _creditService.GetBalanceAsync(userId);
                finalBal.Balance.Should().Be(200);

                // Verify ledger entries
                var ledger = await _creditLedgerRepo.GetByOwnerAsync(userId);
                ledger.Should().NotBeNull();
                ledger!.Debits.Should().HaveCount(1);
                var debit = ledger.Debits[0];
                debit.Amount.Should().Be(7);
                debit.Refunded.Should().BeTrue();
                debit.RefundedAt.Should().NotBeNull();

                // Assert: Regenerate count is untouched (0)
                var reloadedKit = await _brandKitRepo.GetByIdeaIdAsync(ideaId, userId);
                reloadedKit!.Direction.RegenerateCount.Should().Be(0);
                reloadedKit.Direction.Candidates.Should().BeEmpty();

                _output.WriteLine("\n[1/4] SERVICE: DirectionGeneration (Cost: 7 credits)");
                _output.WriteLine($"  - HTTP Response Status    : {objResult.StatusCode} (Honest Error)");
                _output.WriteLine($"  - Starting Balance        : {initialBal.Balance} credits");
                _output.WriteLine($"  - Debited Amount          : {debit.Amount} credits (Op: {debit.OperationId})");
                _output.WriteLine($"  - Refunded Status         : {debit.Refunded} at {debit.RefundedAt:u}");
                _output.WriteLine($"  - Final Balance           : {finalBal.Balance} credits (Net Change: 0)");
                _output.WriteLine($"  - Direction Regenerate Cap: {reloadedKit.Direction.RegenerateCount} / 3 (Untouched)");
                _output.WriteLine($"  - Deterministic Fallback  : NOT called (Candidates count: 0)");
            }

            // -------------------------------------------------------------------------
            // SERVICE 2: Logo Parameter Selection (Batch Redraw)
            // -------------------------------------------------------------------------
            {
                var userId = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
                var ideaId = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
                var (idea, kit) = await SeedUserAndKitAsync(userId, ideaId);

                // Set Direction so prerequisite check passes
                var updateDir = Builders<BrandKit>.Update
                    .Set(x => x.Direction.Candidates, new List<BrandDirectionCandidate>
                    {
                        new() { Key = "candidate_1", Name = "Fintech Modern", ColorPalette = new() { "#0052FF", "#0F172A", "#38BDF8", "#FFFFFF" }, DisplayTypeface = "Space Grotesk", TextTypeface = "Plus Jakarta Sans", MotifKey = "geometric_structure", Provenance = "ai" }
                    })
                    .Set(x => x.Direction.SelectedDirectionKey, "candidate_1")
                    .Set(x => x.Direction.SelectedAt, DateTime.UtcNow);
                await _brandKitRepo.UpdateAsync(ideaId, userId, updateDir);
                kit = await _brandKitRepo.GetByIdeaIdAsync(ideaId, userId);

                var initialBal = await _creditService.GetBalanceAsync(userId);
                initialBal.Balance.Should().Be(200);

                var mockAi = new Mock<IAiProvider>();
                mockAi.Setup(a => a.CompleteAsync(It.IsAny<AiCompletionRequest>(), It.IsAny<System.Threading.CancellationToken>()))
                    .ThrowsAsync(new InvalidOperationException("Model context window overflow or parse error"));

                var mockRouter = new Mock<IModelRouter>();
                mockRouter.Setup(r => r.Resolve(It.IsAny<string>())).Returns("google/gemini-3.8-flash");

                var logoService = new LogoGenerationService(
                    new LogoMarkRendererRegistry(),
                    mockAi.Object,
                    mockRouter.Object,
                    env: null,
                    logger: NullLogger<LogoGenerationService>.Instance,
                    aiSettings: Options.Create(_aiSettings));

                var controller = CreateController(userId, logoGen: logoService);

                // Act: Invoke controller endpoint
                var actionResult = await controller.GenerateLogoConcepts(ideaId, expectedVersion: kit!.Version);

                // Assert: User receives honest 500 error status
                var objResult = actionResult.Should().BeOfType<ObjectResult>().Subject;
                objResult.StatusCode.Should().Be(500);

                // Assert: Balance is debited 4 and refunded 4 (net unchanged at 200)
                var finalBal = await _creditService.GetBalanceAsync(userId);
                finalBal.Balance.Should().Be(200);

                var ledger = await _creditLedgerRepo.GetByOwnerAsync(userId);
                ledger.Should().NotBeNull();
                ledger!.Debits.Should().HaveCount(1);
                var debit = ledger.Debits[0];
                debit.Amount.Should().Be(4);
                debit.Refunded.Should().BeTrue();
                debit.RefundedAt.Should().NotBeNull();

                // Assert: Regenerate count is untouched (0)
                var reloadedKit = await _brandKitRepo.GetByIdeaIdAsync(ideaId, userId);
                reloadedKit!.Logo.RegenerateCount.Should().Be(0);
                reloadedKit.Logo.Concepts.Should().BeEmpty();

                _output.WriteLine("\n[2/4] SERVICE: LogoParameterSelection (Cost: 4 credits)");
                _output.WriteLine($"  - HTTP Response Status    : {objResult.StatusCode} (Honest Error)");
                _output.WriteLine($"  - Starting Balance        : {initialBal.Balance} credits");
                _output.WriteLine($"  - Debited Amount          : {debit.Amount} credits (Op: {debit.OperationId})");
                _output.WriteLine($"  - Refunded Status         : {debit.Refunded} at {debit.RefundedAt:u}");
                _output.WriteLine($"  - Final Balance           : {finalBal.Balance} credits (Net Change: 0)");
                _output.WriteLine($"  - Logo Regenerate Cap     : {reloadedKit.Logo.RegenerateCount} / 3 (Untouched)");
                _output.WriteLine($"  - Deterministic Fallback  : NOT called (Concepts count: 0)");
            }

            // -------------------------------------------------------------------------
            // SERVICE 3: ColorGeneration (Regenerate Palette)
            // -------------------------------------------------------------------------
            {
                var userId = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
                var ideaId = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
                var (idea, kit) = await SeedUserAndKitAsync(userId, ideaId);

                // Set Direction and Logo prerequisites
                var updatePrereq = Builders<BrandKit>.Update
                    .Set(x => x.Direction.Candidates, new List<BrandDirectionCandidate>
                    {
                        new() { Key = "candidate_1", Name = "Fintech Modern", ColorPalette = new() { "#0052FF", "#0F172A", "#38BDF8", "#FFFFFF" }, DisplayTypeface = "Space Grotesk", TextTypeface = "Plus Jakarta Sans", MotifKey = "geometric_structure", Provenance = "ai" }
                    })
                    .Set(x => x.Direction.SelectedDirectionKey, "candidate_1")
                    .Set(x => x.Direction.SelectedAt, DateTime.UtcNow)
                    .Set(x => x.Logo.Concepts, new List<BrandLogoConcept> { new() { Key = "concept_1", DescriptorLine = "Monogram", MarkAssetUri = "/assets/1.svg", LockupAssetUri = "/assets/1l.svg" } })
                    .Set(x => x.Logo.SelectedConceptKey, "concept_1")
                    .Set(x => x.Logo.ApprovedAt, DateTime.UtcNow);
                await _brandKitRepo.UpdateAsync(ideaId, userId, updatePrereq);
                kit = await _brandKitRepo.GetByIdeaIdAsync(ideaId, userId);

                var initialBal = await _creditService.GetBalanceAsync(userId);
                initialBal.Balance.Should().Be(200);

                var mockAi = new Mock<IAiProvider>();
                mockAi.Setup(a => a.CompleteAsync(It.IsAny<AiCompletionRequest>(), It.IsAny<System.Threading.CancellationToken>()))
                    .ThrowsAsync(new HttpRequestException("AI provider internal server error (HTTP 500)"));

                var mockRouter = new Mock<IModelRouter>();
                mockRouter.Setup(r => r.Resolve(It.IsAny<string>())).Returns("google/gemini-3.8-flash");

                var colorService = new ColorGenerationService(mockAi.Object, mockRouter.Object, NullLogger<ColorGenerationService>.Instance, Options.Create(_aiSettings));
                var controller = CreateController(userId, colorGen: colorService);

                // Act: Invoke controller endpoint
                var actionResult = await controller.RegenerateColors(ideaId, expectedVersion: kit!.Version);

                // Assert: User receives honest 500 error status
                var objResult = actionResult.Should().BeOfType<ObjectResult>().Subject;
                objResult.StatusCode.Should().Be(500);

                // Assert: Balance is debited 2 and refunded 2 (net unchanged at 200)
                var finalBal = await _creditService.GetBalanceAsync(userId);
                finalBal.Balance.Should().Be(200);

                var ledger = await _creditLedgerRepo.GetByOwnerAsync(userId);
                ledger.Should().NotBeNull();
                ledger!.Debits.Should().HaveCount(1);
                var debit = ledger.Debits[0];
                debit.Amount.Should().Be(2);
                debit.Refunded.Should().BeTrue();
                debit.RefundedAt.Should().NotBeNull();

                // Assert: Colors regenerate count is untouched (0)
                var reloadedKit = await _brandKitRepo.GetByIdeaIdAsync(ideaId, userId);
                reloadedKit!.Colors.RegenerateCount.Should().Be(0);

                _output.WriteLine("\n[3/4] SERVICE: ColorGeneration (Cost: 2 credits)");
                _output.WriteLine($"  - HTTP Response Status    : {objResult.StatusCode} (Honest Error)");
                _output.WriteLine($"  - Starting Balance        : {initialBal.Balance} credits");
                _output.WriteLine($"  - Debited Amount          : {debit.Amount} credits (Op: {debit.OperationId})");
                _output.WriteLine($"  - Refunded Status         : {debit.Refunded} at {debit.RefundedAt:u}");
                _output.WriteLine($"  - Final Balance           : {finalBal.Balance} credits (Net Change: 0)");
                _output.WriteLine($"  - Colors Regenerate Cap   : {reloadedKit.Colors.RegenerateCount} / 3 (Untouched)");
                _output.WriteLine($"  - Harmonic Fallback       : NOT called (Colors untouched)");
            }

            // -------------------------------------------------------------------------
            // SERVICE 4: TypographyGeneration (Regenerate Pairing)
            // -------------------------------------------------------------------------
            {
                var userId = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
                var ideaId = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
                var (idea, kit) = await SeedUserAndKitAsync(userId, ideaId);

                // Set Direction, Logo, and Colors prerequisites
                var updatePrereq = Builders<BrandKit>.Update
                    .Set(x => x.Direction.Candidates, new List<BrandDirectionCandidate>
                    {
                        new() { Key = "candidate_1", Name = "Fintech Modern", ColorPalette = new() { "#0052FF", "#0F172A", "#38BDF8", "#FFFFFF" }, DisplayTypeface = "Space Grotesk", TextTypeface = "Plus Jakarta Sans", MotifKey = "geometric_structure", Provenance = "ai" }
                    })
                    .Set(x => x.Direction.SelectedDirectionKey, "candidate_1")
                    .Set(x => x.Direction.SelectedAt, DateTime.UtcNow)
                    .Set(x => x.Logo.Concepts, new List<BrandLogoConcept> { new() { Key = "concept_1", DescriptorLine = "Monogram", MarkAssetUri = "/assets/1.svg", LockupAssetUri = "/assets/1l.svg" } })
                    .Set(x => x.Logo.SelectedConceptKey, "concept_1")
                    .Set(x => x.Logo.ApprovedAt, DateTime.UtcNow)
                    .Set(x => x.Colors.ConfirmedAt, DateTime.UtcNow);
                await _brandKitRepo.UpdateAsync(ideaId, userId, updatePrereq);
                kit = await _brandKitRepo.GetByIdeaIdAsync(ideaId, userId);

                var initialBal = await _creditService.GetBalanceAsync(userId);
                initialBal.Balance.Should().Be(200);

                var mockAi = new Mock<IAiProvider>();
                mockAi.Setup(a => a.CompleteAsync(It.IsAny<AiCompletionRequest>(), It.IsAny<System.Threading.CancellationToken>()))
                    .ThrowsAsync(new TimeoutException("AI model inference timed out"));

                var mockRouter = new Mock<IModelRouter>();
                mockRouter.Setup(r => r.Resolve(It.IsAny<string>())).Returns("google/gemini-3.8-flash");

                var typoService = new TypographyGenerationService(mockAi.Object, mockRouter.Object, NullLogger<TypographyGenerationService>.Instance, Options.Create(_aiSettings));
                var controller = CreateController(userId, typoGen: typoService);

                // Act: Invoke controller endpoint
                var actionResult = await controller.RegenerateTypography(ideaId, expectedVersion: kit!.Version);

                // Assert: User receives honest 500 error status
                var objResult = actionResult.Should().BeOfType<ObjectResult>().Subject;
                objResult.StatusCode.Should().Be(500);

                // Assert: Balance is debited 2 and refunded 2 (net unchanged at 200)
                var finalBal = await _creditService.GetBalanceAsync(userId);
                finalBal.Balance.Should().Be(200);

                var ledger = await _creditLedgerRepo.GetByOwnerAsync(userId);
                ledger.Should().NotBeNull();
                ledger!.Debits.Should().HaveCount(1);
                var debit = ledger.Debits[0];
                debit.Amount.Should().Be(2);
                debit.Refunded.Should().BeTrue();
                debit.RefundedAt.Should().NotBeNull();

                // Assert: Typography regenerate count is untouched (0)
                var reloadedKit = await _brandKitRepo.GetByIdeaIdAsync(ideaId, userId);
                reloadedKit!.Typography.RegenerateCount.Should().Be(0);

                _output.WriteLine("\n[4/4] SERVICE: TypographyGeneration (Cost: 2 credits)");
                _output.WriteLine($"  - HTTP Response Status    : {objResult.StatusCode} (Honest Error)");
                _output.WriteLine($"  - Starting Balance        : {initialBal.Balance} credits");
                _output.WriteLine($"  - Debited Amount          : {debit.Amount} credits (Op: {debit.OperationId})");
                _output.WriteLine($"  - Refunded Status         : {debit.Refunded} at {debit.RefundedAt:u}");
                _output.WriteLine($"  - Final Balance           : {finalBal.Balance} credits (Net Change: 0)");
                _output.WriteLine($"  - Typography Regen Cap    : {reloadedKit.Typography.RegenerateCount} / 3 (Untouched)");
                _output.WriteLine($"  - Alternative Font Fallback: NOT called (Typography untouched)");
            }

            _output.WriteLine("\n==========================================================================");
            _output.WriteLine("OPTION A VERIFICATION COMPLETE: ALL 4 SERVICES PROVED AGAINST REAL BACKEND");
            _output.WriteLine("==========================================================================");
        }
    }
}
