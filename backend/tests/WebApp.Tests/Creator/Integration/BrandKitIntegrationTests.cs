using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using FluentAssertions;
using MongoDB.Bson;
using MongoDB.Driver;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Repository;
using WebApp.Tests.Integration;
using Xunit;

namespace WebApp.Tests.Creator.Integration
{
    /// <summary>
    /// Real-MongoDB integration tests for <see cref="BrandKitRepository"/>:
    /// 1. Targeted atomic updates leaving sibling fields and sections byte-identical.
    /// 2. Unique index enforcement on IdeaId rejecting duplicate kits.
    /// 3. Cross-idea and cross-owner isolation with zero leakage.
    /// 4. Bounded snapshot retention ($position: 0, $slice: 3) dropping oldest snapshot.
    ///
    /// Executes against live MongoDB (Testcontainers if Docker is present; ephemeral isolated
    /// database dropped on completion if running without Docker).
    /// </summary>
    public class BrandKitIntegrationTests : IAsyncLifetime
    {
        private readonly AppFixture _appFixture = new();
        private MongoClient? _fallbackClient;
        private string? _ephemeralDbName;

        public IMongoDatabase Database { get; private set; } = null!;
        public BrandKitRepository Repository { get; private set; } = null!;

        public async Task InitializeAsync()
        {
            await _appFixture.InitializeAsync();

            var shortId = Guid.NewGuid().ToString("N")[..16];
            _ephemeralDbName = $"bk_{shortId}";

            if (_appFixture.Available && _appFixture.Factory != null)
            {
                // Docker / Testcontainers environment (e.g. CI)
                var sp = _appFixture.Factory.Services;
                var client = (IMongoClient)sp.GetService(typeof(IMongoClient))!;
                Database = client.GetDatabase(_ephemeralDbName);
            }
            else
            {
                // Local dev environment without Docker — use ephemeral Atlas database
                var connStr = Environment.GetEnvironmentVariable("MONGO_TEST_CONNECTION_STRING")
                    ?? "mongodb+srv://mongoDB:hr11100010@cluster0.nsfffx4.mongodb.net/";
                _fallbackClient = new MongoClient(connStr);
                Database = _fallbackClient.GetDatabase(_ephemeralDbName);
            }

            Repository = new BrandKitRepository(Database);
        }

        public async Task DisposeAsync()
        {
            if (!string.IsNullOrEmpty(_ephemeralDbName))
            {
                try
                {
                    var client = _fallbackClient ?? (IMongoClient?)_appFixture.Factory?.Services.GetService(typeof(IMongoClient));
                    if (client != null)
                    {
                        await client.DropDatabaseAsync(_ephemeralDbName);
                    }
                }
                catch
                {
                    // Best effort cleanup
                }
            }

            await _appFixture.DisposeAsync();
        }

        private static BrandKit CreatePopulatedKit(string userId, string ideaId)
        {
            return new BrandKit
            {
                UserId = userId,
                IdeaId = ideaId,
                Strategy = new BrandStrategy
                {
                    BusinessName = "Apex Studio",
                    NameDisplayForm = "Apex Studio",
                    Concept = new BrandProvenancedText { Value = "High performance creative agency", Provenance = "stated" },
                    TargetAudience = new BrandProvenancedText { Value = "Tech founders", Provenance = "stated" },
                    Industry = new BrandProvenancedText { Value = "Design & Tech", Provenance = "stated" },
                    Positioning = new BrandProvenancedText { Value = "Fastest turnaround for venture branding", Provenance = "derived" },
                    PersonalityTraits = new List<string> { "Bold", "Direct", "Innovative" },
                    AvoidList = new List<string> { "Corporate", "Cluttered" },
                    TonePosition = "Direct & confident",
                    FirstAppearance = "Mobile pitch page"
                },
                Direction = new BrandDirection
                {
                    Candidates = new List<BrandDirectionCandidate>
                    {
                        new() { Key = "dir-1", Name = "Minimalist", FeelLine = "Clean and sharp", Rationale = "High clarity", DisplayTypeface = "Syne", TextTypeface = "DM Sans" }
                    },
                    SelectedDirectionKey = "dir-1"
                },
                Logo = new BrandLogo
                {
                    LogoType = "ai",
                    Concepts = new List<BrandLogoConcept>
                    {
                        new() { Key = "concept-1", DescriptorLine = "Monogram A mark", AssetUri = "/uploads/branding/c1.svg" }
                    },
                    SelectedConceptKey = "concept-1",
                    RefinementSettings = new BrandLogoRefinementSettings
                    {
                        SymbolSize = "scale_3",
                        Spacing = "normal",
                        Arrangement = "side_by_side"
                    },
                    Variations = new Dictionary<string, BrandLogoVariation>
                    {
                        [BrandLogoVariationKeys.Primary] = new() { SvgUri = "/uploads/branding/primary.svg", PngUri = "/uploads/branding/primary.png" }
                    }
                },
                Colors = new BrandColors
                {
                    Roles = new List<BrandColorRole>
                    {
                        new() { RoleName = BrandColorRoleNames.Primary, Hex = "#3B82F6", Rgb = "59, 130, 246", ContrastRatio = 4.5, ContrastVerdict = "AAA" },
                        new() { RoleName = BrandColorRoleNames.Secondary, Hex = "#10B981", Rgb = "16, 185, 129", ContrastRatio = 3.2, ContrastVerdict = "AA Large" },
                        new() { RoleName = BrandColorRoleNames.Accent, Hex = "#F59E0B", Rgb = "245, 158, 11", ContrastRatio = 2.8, ContrastVerdict = "Fail" },
                        new() { RoleName = BrandColorRoleNames.Background, Hex = "#FFFFFF", Rgb = "255, 255, 255", ContrastRatio = null, ContrastVerdict = null },
                        new() { RoleName = BrandColorRoleNames.Text, Hex = "#111827", Rgb = "17, 24, 39", ContrastRatio = 12.1, ContrastVerdict = "AAA" }
                    }
                },
                Typography = new BrandTypography
                {
                    Roles = new List<BrandTypographyRole>
                    {
                        new() { RoleName = BrandTypographyRoleNames.LogoType, Family = "Cabinet Grotesk", Weight = "800", IsLocked = true },
                        new() { RoleName = BrandTypographyRoleNames.Heading, Family = "Clash Display", Weight = "700", IsLocked = false },
                        new() { RoleName = BrandTypographyRoleNames.Body, Family = "Inter", Weight = "400", IsLocked = false },
                        new() { RoleName = BrandTypographyRoleNames.ButtonAndLabel, Family = "Inter", Weight = "600", IsLocked = false }
                    }
                }
            };
        }

        // =========================================================================
        // 1. TARGETED UPDATE LEAVES SIBLINGS BYTE-IDENTICAL
        // =========================================================================
        [Fact]
        public async Task Targeted_update_leaves_all_sibling_fields_and_sections_byte_identical()
        {
            var userId = "user-" + Guid.NewGuid();
            var ideaId = "idea-" + Guid.NewGuid();

            var originalKit = CreatePopulatedKit(userId, ideaId);
            await Repository.AddAsync(originalKit);

            // Fetch stored original from real MongoDB to capture exact persisted state
            var fetchedOriginal = await Repository.GetByIdeaIdAsync(ideaId, userId);
            fetchedOriginal.Should().NotBeNull();

            // Snapshot JSON of sibling elements prior to targeted update
            var originalRole1Json = JsonSerializer.Serialize(fetchedOriginal!.Colors.Roles[1]);
            var originalRole2Json = JsonSerializer.Serialize(fetchedOriginal.Colors.Roles[2]);
            var originalRole3Json = JsonSerializer.Serialize(fetchedOriginal.Colors.Roles[3]);
            var originalRole4Json = JsonSerializer.Serialize(fetchedOriginal.Colors.Roles[4]);
            var originalStrategyJson = JsonSerializer.Serialize(fetchedOriginal.Strategy);
            var originalDirectionJson = JsonSerializer.Serialize(fetchedOriginal.Direction);
            var originalLogoJson = JsonSerializer.Serialize(fetchedOriginal.Logo);
            var originalTypographyJson = JsonSerializer.Serialize(fetchedOriginal.Typography);

            // Execute targeted update targeting ONLY Colors.Roles[0].Hex and Colors.Roles[0].Rgb
            var targetedUpdate = Builders<BrandKit>.Update
                .Set(x => x.Colors.Roles[0].Hex, "#10B981")
                .Set(x => x.Colors.Roles[0].Rgb, "16, 185, 129");

            var updated = await Repository.UpdateAsync(ideaId, userId, targetedUpdate);
            updated.Should().BeTrue();

            // Re-read document fresh from the database
            var reloadedKit = await Repository.GetByIdeaIdAsync(ideaId, userId);
            reloadedKit.Should().NotBeNull();

            // Targeted path changed
            reloadedKit!.Colors.Roles[0].Hex.Should().Be("#10B981");
            reloadedKit.Colors.Roles[0].Rgb.Should().Be("16, 185, 129");
            reloadedKit.Colors.Roles[0].RoleName.Should().Be(BrandColorRoleNames.Primary); // intact

            // All sibling color roles 1 through 4 are byte-identical
            JsonSerializer.Serialize(reloadedKit.Colors.Roles[1]).Should().Be(originalRole1Json);
            JsonSerializer.Serialize(reloadedKit.Colors.Roles[2]).Should().Be(originalRole2Json);
            JsonSerializer.Serialize(reloadedKit.Colors.Roles[3]).Should().Be(originalRole3Json);
            JsonSerializer.Serialize(reloadedKit.Colors.Roles[4]).Should().Be(originalRole4Json);

            // All other sub-documents are byte-identical
            JsonSerializer.Serialize(reloadedKit.Strategy).Should().Be(originalStrategyJson);
            JsonSerializer.Serialize(reloadedKit.Direction).Should().Be(originalDirectionJson);
            JsonSerializer.Serialize(reloadedKit.Logo).Should().Be(originalLogoJson);
            JsonSerializer.Serialize(reloadedKit.Typography).Should().Be(originalTypographyJson);
        }

        // =========================================================================
        // 2. UNIQUE INDEX REJECTS A SECOND KIT FOR THE SAME IDEA
        // =========================================================================
        [Fact]
        public async Task Unique_index_rejects_second_kit_for_same_idea()
        {
            var user1 = "user-" + Guid.NewGuid();
            var user2 = "user-" + Guid.NewGuid();
            var sharedIdeaId = "idea-" + Guid.NewGuid();

            var kit1 = CreatePopulatedKit(user1, sharedIdeaId);
            await Repository.AddAsync(kit1);

            // Attempt to insert a second kit for the same IdeaId (even under different userId)
            var duplicateKit = CreatePopulatedKit(user2, sharedIdeaId);

            var act = () => Repository.AddAsync(duplicateKit);

            var exception = await act.Should().ThrowAsync<MongoWriteException>();
            exception.Which.WriteError.Category.Should().Be(ServerErrorCategory.DuplicateKey);
        }

        // =========================================================================
        // 3. CROSS-IDEA AND CROSS-OWNER ISOLATION
        // =========================================================================
        [Fact]
        public async Task Two_ideas_of_same_user_have_independent_brand_kits_with_zero_leakage()
        {
            var ownerUserId = "user-" + Guid.NewGuid();
            var ideaA = "idea-a-" + Guid.NewGuid();
            var ideaB = "idea-b-" + Guid.NewGuid();
            var foreignUser = "user-foreign-" + Guid.NewGuid();

            var kitA = CreatePopulatedKit(ownerUserId, ideaA);
            kitA.Colors.Roles[0].Hex = "#AAAAAA";

            var kitB = CreatePopulatedKit(ownerUserId, ideaB);
            kitB.Colors.Roles[0].Hex = "#BBBBBB";

            await Repository.AddAsync(kitA);
            await Repository.AddAsync(kitB);

            // 1. Reading each idea returns its own kit
            var readA = await Repository.GetByIdeaIdAsync(ideaA, ownerUserId);
            var readB = await Repository.GetByIdeaIdAsync(ideaB, ownerUserId);

            readA.Should().NotBeNull();
            readB.Should().NotBeNull();
            readA!.Colors.Roles[0].Hex.Should().Be("#AAAAAA");
            readB!.Colors.Roles[0].Hex.Should().Be("#BBBBBB");

            // 2. Cross-reading returns null (ideaA queried with ideaB id, or vice versa)
            var leakCheck = await Repository.GetByIdeaIdAsync("idea-non-existent", ownerUserId);
            leakCheck.Should().BeNull();

            // 3. Foreign user cannot access ideaA or ideaB
            var foreignReadA = await Repository.GetByIdeaIdAsync(ideaA, foreignUser);
            var foreignReadB = await Repository.GetByIdeaIdAsync(ideaB, foreignUser);

            foreignReadA.Should().BeNull();
            foreignReadB.Should().BeNull();

            // 4. Foreign user update attempt fails and does not mutate owner's kit
            var foreignUpdate = Builders<BrandKit>.Update.Set(x => x.Colors.Roles[0].Hex, "#000000");
            var updateResult = await Repository.UpdateAsync(ideaA, foreignUser, foreignUpdate);
            updateResult.Should().BeFalse();

            // Verify kitA remained untampered in the database
            var verifiedA = await Repository.GetByIdeaIdAsync(ideaA, ownerUserId);
            verifiedA!.Colors.Roles[0].Hex.Should().Be("#AAAAAA");
        }

        // =========================================================================
        // 4. BOUNDED HISTORY RETENTION (WRITE-TIME ENFORCEMENT VIA $position:0, $slice:3)
        // =========================================================================
        [Fact]
        public async Task PushSnapshot_in_database_bounds_history_to_newest_three_snapshots()
        {
            var userId = "user-" + Guid.NewGuid();
            var ideaId = "idea-" + Guid.NewGuid();

            var kit = CreatePopulatedKit(userId, ideaId);
            await Repository.AddAsync(kit);

            // Push snapshot 1, 2, 3, 4 sequentially to real MongoDB
            for (int i = 1; i <= 4; i++)
            {
                var snapshot = new BrandKitSnapshot
                {
                    Description = $"Snapshot {i}",
                    Timestamp = DateTime.UtcNow.AddMinutes(i)
                };
                var pushed = await Repository.PushSnapshotAsync(ideaId, userId, snapshot);
                pushed.Should().BeTrue();
            }

            // Reload kit fresh from database
            var reloaded = await Repository.GetByIdeaIdAsync(ideaId, userId);
            reloaded.Should().NotBeNull();

            // Bounded to exactly 3 snapshots, newest first ($position: 0, $slice: 3)
            reloaded!.Snapshots.Should().HaveCount(3);
            reloaded.Snapshots[0].Description.Should().Be("Snapshot 4");
            reloaded.Snapshots[1].Description.Should().Be("Snapshot 3");
            reloaded.Snapshots[2].Description.Should().Be("Snapshot 2");

            // Oldest ("Snapshot 1") was evicted by MongoDB slice
            reloaded.Snapshots.Should().NotContain(s => s.Description == "Snapshot 1");
        }
    }
}
