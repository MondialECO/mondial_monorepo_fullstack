using FluentAssertions;
using Microsoft.AspNetCore.Http;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Driver;
using Moq;
using WebApp.DbContext;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Implementations;
using WebApp.Services.Interface;
using WebApp.Services.Repository;
using WebApp.Services.Repository.Ai;
using Xunit;

namespace WebApp.Tests.Creator.Unit
{
    public class BrandKitStorageTests
    {
        private const string OwnerUserId = "user-creator-111";
        private const string ForeignUserId = "user-stranger-999";
        private const string IdeaAId = "60f1b2b3c4d5e6f7a8b9c0d1";
        private const string IdeaBId = "60f1b2b3c4d5e6f7a8b9c0d2";

        private static BrandKit CreatePopulatedKit(string ideaId, string userId)
        {
            return new BrandKit
            {
                Id = ObjectId.GenerateNewId().ToString(),
                IdeaId = ideaId,
                UserId = userId,
                Status = "draft",
                CurrentStep = 1,
                Version = 1,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
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
                    FirstAppearance = "Mobile pitch page",
                    DerivedConstraints = new BrandDerivedConstraints
                    {
                        CharacterLength = 11,
                        WordCount = 2,
                        Script = "Latin",
                        MonogramInitials = "AS",
                        IsIconOnlyViable = true
                    }
                },
                Direction = new BrandDirection
                {
                    Candidates = new List<BrandDirectionCandidate>
                    {
                        new() { Key = "dir-1", Name = "Minimalist", FeelLine = "Clean and sharp", Rationale = "High clarity", ColorPalette = new() { "#000000", "#111111", "#222222", "#333333" }, DisplayTypeface = "Syne", TextTypeface = "DM Sans", MotifKey = "geometric" },
                        new() { Key = "dir-2", Name = "Organic", FeelLine = "Warm and natural", Rationale = "Approachable", ColorPalette = new() { "#444444", "#555555", "#666666", "#777777" }, DisplayTypeface = "Fraunces", TextTypeface = "Inter", MotifKey = "curved" },
                        new() { Key = "dir-3", Name = "Technical", FeelLine = "Engineered precision", Rationale = "Data-driven", ColorPalette = new() { "#888888", "#999999", "#aaaaaa", "#bbbbbb" }, DisplayTypeface = "Space Grotesk", TextTypeface = "Space Mono", MotifKey = "grid" },
                        new() { Key = "dir-4", Name = "Vibrant", FeelLine = "Dynamic energy", Rationale = "Consumer pop", ColorPalette = new() { "#cccccc", "#dddddd", "#eeeeee", "#ffffff" }, DisplayTypeface = "Clash Display", TextTypeface = "Satoshi", MotifKey = "gradient" }
                    },
                    SelectedDirectionKey = "dir-1",
                    AdjustmentSettings = new BrandDirectionAdjustments { PaletteVariant = "high_contrast", ContrastPosition = "dark_mode", TypeWeight = "medium" },
                    RegenerateCount = 0
                },
                Logo = new BrandLogo
                {
                    LogoType = "ai",
                    Concepts = new List<BrandLogoConcept>
                    {
                        new() { Key = "concept-1", DescriptorLine = "Monogram A mark", AssetUri = "/uploads/branding/c1.svg", RegenerateCount = 0 },
                        new() { Key = "concept-2", DescriptorLine = "Abstract apex", AssetUri = "/uploads/branding/c2.svg", RegenerateCount = 0 },
                        new() { Key = "concept-3", DescriptorLine = "Minimal crest", AssetUri = "/uploads/branding/c3.svg", RegenerateCount = 0 },
                        new() { Key = "concept-4", DescriptorLine = "Linear wordmark", AssetUri = "/uploads/branding/c4.svg", RegenerateCount = 0 },
                        new() { Key = "concept-5", DescriptorLine = "Geometric arrow", AssetUri = "/uploads/branding/c5.svg", RegenerateCount = 0 },
                        new() { Key = "concept-6", DescriptorLine = "Negative space S", AssetUri = "/uploads/branding/c6.svg", RegenerateCount = 0 }
                    },
                    SelectedConceptKey = "concept-1",
                    Variations = new Dictionary<string, BrandLogoVariation>
                    {
                        { BrandLogoVariationKeys.Primary, new() { SvgUri = "/uploads/branding/v_primary.svg", PngUri = "/uploads/branding/v_primary.png", UsageNote = "Main identity" } },
                        { BrandLogoVariationKeys.Horizontal, new() { SvgUri = "/uploads/branding/v_horiz.svg", PngUri = "/uploads/branding/v_horiz.png", UsageNote = "Header lockup" } },
                        { BrandLogoVariationKeys.Stacked, new() { SvgUri = "/uploads/branding/v_stacked.svg", PngUri = "/uploads/branding/v_stacked.png", UsageNote = "Square containers" } },
                        { BrandLogoVariationKeys.IconOnly, new() { SvgUri = "/uploads/branding/v_icon.svg", PngUri = "/uploads/branding/v_icon.png", UsageNote = "Favicon & avatar" } },
                        { BrandLogoVariationKeys.Black, new() { SvgUri = "/uploads/branding/v_black.svg", UsageNote = "Single color print" } },
                        { BrandLogoVariationKeys.White, new() { SvgUri = "/uploads/branding/v_white.svg", UsageNote = "Dark background knockout" } },
                        { BrandLogoVariationKeys.Transparent, new() { SvgUri = "/uploads/branding/v_trans.svg", UsageNote = "Overlay watermark" } }
                    },
                    RefinementSettings = new BrandLogoRefinementSettings { SymbolSize = "medium", Spacing = "normal", Arrangement = "side_by_side" }
                },
                Colors = new BrandColors
                {
                    Roles = new List<BrandColorRole>
                    {
                        new() { RoleName = BrandColorRoleNames.Primary, Hex = "#1A1A24", Rgb = "26,26,36", UsageNote = "Primary brand color", ContrastRatio = 12.4, ContrastVerdict = "AAA", IsLocked = false, Provenance = "derived" },
                        new() { RoleName = BrandColorRoleNames.Secondary, Hex = "#3C61DD", Rgb = "60,97,221", UsageNote = "Secondary accent", ContrastRatio = 4.8, ContrastVerdict = "AA", IsLocked = false, Provenance = "derived" },
                        new() { RoleName = BrandColorRoleNames.Accent, Hex = "#00D084", Rgb = "0,208,132", UsageNote = "Interactive CTA", ContrastRatio = 3.5, ContrastVerdict = "AA_Large", IsLocked = false, Provenance = "derived" },
                        new() { RoleName = BrandColorRoleNames.Background, Hex = "#FFFFFF", Rgb = "255,255,255", UsageNote = "Ground canvas", ContrastRatio = null, ContrastVerdict = null, IsLocked = true, Provenance = "stated" },
                        new() { RoleName = BrandColorRoleNames.Text, Hex = "#0F172A", Rgb = "15,23,42", UsageNote = "Body text copy", ContrastRatio = 14.2, ContrastVerdict = "AAA", IsLocked = false, Provenance = "derived" }
                    },
                    RegenerateCount = 0
                },
                Typography = new BrandTypography
                {
                    Roles = new List<BrandTypographyRole>
                    {
                        new() { RoleName = BrandTypographyRoleNames.LogoType, Family = "Syne", Weight = "800", Size = "32px", LineHeight = "1.1", SpecimenText = "Apex Studio", IsLocked = true, Provenance = "stated" },
                        new() { RoleName = BrandTypographyRoleNames.Heading, Family = "Syne", Weight = "700", Size = "24px", LineHeight = "1.2", SpecimenText = "Build The Future", IsLocked = false, Provenance = "derived" },
                        new() { RoleName = BrandTypographyRoleNames.Body, Family = "DM Sans", Weight = "400", Size = "16px", LineHeight = "1.5", SpecimenText = "The quick brown fox jumps over the lazy dog.", IsLocked = false, Provenance = "derived" },
                        new() { RoleName = BrandTypographyRoleNames.ButtonAndLabel, Family = "DM Sans", Weight = "600", Size = "14px", LineHeight = "1.0", SpecimenText = "Get Started", IsLocked = false, Provenance = "derived" }
                    },
                    Families = new BrandTypographyFamilies
                    {
                        DisplayFamily = new() { Name = "Syne", License = "OFL", AvailableWeights = new() { "700", "800" }, WebWeightKb = 42.5 },
                        TextFamily = new() { Name = "DM Sans", License = "OFL", AvailableWeights = new() { "400", "600" }, WebWeightKb = 38.2 }
                    },
                    RegenerateCount = 0
                }
            };
        }

        // =========================================================================
        // 1. TARGETED-UPDATE ISOLATION TEST
        // =========================================================================
        [Fact]
        public void Targeted_update_definition_modifies_only_specified_path_leaving_siblings_untouched()
        {
            // Regenerate single color role 0 (Primary)
            const string newHex = "#0A0A1F";
            const string newRgb = "10,10,31";
            var updateDef = Builders<BrandKit>.Update
                .Set(x => x.Colors.Roles[0].Hex, newHex)
                .Set(x => x.Colors.Roles[0].Rgb, newRgb);

            // Render update definition to BsonDocument
            var serializerRegistry = BsonSerializer.SerializerRegistry;
            var documentSerializer = serializerRegistry.GetSerializer<BrandKit>();
            var rendered = updateDef.Render(new RenderArgs<BrandKit>(documentSerializer, serializerRegistry)).AsBsonDocument;

            // Verify rendered update contains ONLY the targeted nested fields under $set
            rendered.Contains("$set").Should().BeTrue();
            var setDoc = rendered["$set"].AsBsonDocument;

            setDoc.Names.Should().Contain("Colors.Roles.0.Hex");
            setDoc.Names.Should().Contain("Colors.Roles.0.Rgb");

            // Sibling roles and other sub-sections MUST NOT be present in the update definition
            setDoc.Names.Should().NotContain("Colors.Roles.0.RoleName");
            setDoc.Names.Should().NotContain("Colors.Roles.1");
            setDoc.Names.Should().NotContain("Colors.Roles.2");
            setDoc.Names.Should().NotContain("Colors.Roles.3");
            setDoc.Names.Should().NotContain("Colors.Roles.4");
            setDoc.Names.Should().NotContain("Strategy");
            setDoc.Names.Should().NotContain("Direction");
            setDoc.Names.Should().NotContain("Logo");
            setDoc.Names.Should().NotContain("Typography");

            // Simulate applying to document BSON representation
            var original = CreatePopulatedKit(IdeaAId, OwnerUserId);
            var originalBson = original.ToBsonDocument();

            // Clone to simulate DB document
            var mutatedBson = originalBson.DeepClone().AsBsonDocument;
            foreach (var element in setDoc)
            {
                // Colors.Roles.0.Hex
                var parts = element.Name.Split('.');
                BsonValue current = mutatedBson;
                for (int i = 0; i < parts.Length - 1; i++)
                {
                    if (int.TryParse(parts[i], out var index))
                        current = current.AsBsonArray[index];
                    else
                        current = current.AsBsonDocument[parts[i]];
                }
                current.AsBsonDocument[parts[^1]] = element.Value;
            }

            // Verify the targeted field changed
            mutatedBson["Colors"]["Roles"][0]["Hex"].AsString.Should().Be(newHex);
            mutatedBson["Colors"]["Roles"][0]["Rgb"].AsString.Should().Be(newRgb);

            // Verify sibling fields in role 0 are byte-identical
            mutatedBson["Colors"]["Roles"][0]["RoleName"].Should().Be(originalBson["Colors"]["Roles"][0]["RoleName"]);
            mutatedBson["Colors"]["Roles"][0]["UsageNote"].Should().Be(originalBson["Colors"]["Roles"][0]["UsageNote"]);
            mutatedBson["Colors"]["Roles"][0]["ContrastRatio"].Should().Be(originalBson["Colors"]["Roles"][0]["ContrastRatio"]);
            mutatedBson["Colors"]["Roles"][0]["IsLocked"].Should().Be(originalBson["Colors"]["Roles"][0]["IsLocked"]);

            // Verify sibling roles 1 to 4 are bitwise identical
            for (int r = 1; r < 5; r++)
            {
                mutatedBson["Colors"]["Roles"][r].Should().Be(originalBson["Colors"]["Roles"][r]);
            }

            // Verify entire Strategy, Direction, Logo, and Typography are bitwise identical
            mutatedBson["Strategy"].Should().Be(originalBson["Strategy"]);
            mutatedBson["Direction"].Should().Be(originalBson["Direction"]);
            mutatedBson["Logo"].Should().Be(originalBson["Logo"]);
            mutatedBson["Typography"].Should().Be(originalBson["Typography"]);
        }

        // =========================================================================
        // 2. CROSS-IDEA ISOLATION TEST
        // =========================================================================
        [Fact]
        public async Task Two_ideas_of_the_same_user_have_independent_brand_kits_with_zero_leakage()
        {
            var store = new List<BrandKit>
            {
                CreatePopulatedKit(IdeaAId, OwnerUserId),
                CreatePopulatedKit(IdeaBId, OwnerUserId)
            };

            // Differentiate Kit A and Kit B
            store[0].Strategy.BusinessName = "Idea A Brand";
            store[1].Strategy.BusinessName = "Idea B Brand";

            var collectionMock = new Mock<IMongoCollection<BrandKit>>();

            // Setup Find for GetByIdeaIdAsync
            collectionMock.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<BrandKit>>(),
                It.IsAny<FindOptions<BrandKit, BrandKit>>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync((FilterDefinition<BrandKit> filter, FindOptions<BrandKit, BrandKit> opt, CancellationToken ct) =>
                {
                    var serializerRegistry = BsonSerializer.SerializerRegistry;
                    var documentSerializer = serializerRegistry.GetSerializer<BrandKit>();
                    var rendered = filter.Render(new RenderArgs<BrandKit>(documentSerializer, serializerRegistry));

                    var match = store.FirstOrDefault(k =>
                    {
                        var matchesIdea = !rendered.Contains("IdeaId") || k.IdeaId == rendered["IdeaId"].AsString;
                        var matchesUser = !rendered.Contains("UserId") || k.UserId == rendered["UserId"].AsString;
                        return matchesIdea && matchesUser;
                    });

                    var cursor = new Mock<IAsyncCursor<BrandKit>>();
                    cursor.SetupSequence(x => x.MoveNext(It.IsAny<CancellationToken>()))
                        .Returns(match != null)
                        .Returns(false);
                    cursor.SetupSequence(x => x.MoveNextAsync(It.IsAny<CancellationToken>()))
                        .ReturnsAsync(match != null)
                        .ReturnsAsync(false);
                    cursor.Setup(x => x.Current).Returns(match != null ? new List<BrandKit> { match } : new List<BrandKit>());
                    return cursor.Object;
                });

            var dbMock = new Mock<IMongoDatabase>();
            dbMock.Setup(d => d.GetCollection<BrandKit>("BrandKits", null)).Returns(collectionMock.Object);
            var indexManagerMock = new Mock<IMongoIndexManager<BrandKit>>();
            collectionMock.Setup(c => c.Indexes).Returns(indexManagerMock.Object);

            var repository = new BrandKitRepository(dbMock.Object);

            // 1. Reading Idea A returns Kit A with Idea A's content
            var kitA = await repository.GetByIdeaIdAsync(IdeaAId, OwnerUserId);
            kitA.Should().NotBeNull();
            kitA!.IdeaId.Should().Be(IdeaAId);
            kitA.Strategy.BusinessName.Should().Be("Idea A Brand");

            // 2. Reading Idea B returns Kit B with Idea B's content
            var kitB = await repository.GetByIdeaIdAsync(IdeaBId, OwnerUserId);
            kitB.Should().NotBeNull();
            kitB!.IdeaId.Should().Be(IdeaBId);
            kitB.Strategy.BusinessName.Should().Be("Idea B Brand");

            // 3. Cross-user reading: Foreign user querying Idea A gets null
            var foreignRead = await repository.GetByIdeaIdAsync(IdeaAId, ForeignUserId);
            foreignRead.Should().BeNull();
        }

        // =========================================================================
        // 3. BOUNDED HISTORY RETENTION TEST
        // =========================================================================
        [Fact]
        public void PushSnapshot_uses_position_0_and_slice_3_for_atomic_write_time_retention()
        {
            var snapshot = new BrandKitSnapshot
            {
                Description = "Snapshot 4 (newest)",
                Timestamp = DateTime.UtcNow
            };

            var pushUpdate = Builders<BrandKit>.Update.PushEach(
                x => x.Snapshots,
                new[] { snapshot },
                position: 0,
                slice: 3);

            var serializerRegistry = BsonSerializer.SerializerRegistry;
            var documentSerializer = serializerRegistry.GetSerializer<BrandKit>();
            var rendered = pushUpdate.Render(new RenderArgs<BrandKit>(documentSerializer, serializerRegistry)).AsBsonDocument;

            rendered.Contains("$push").Should().BeTrue();
            var pushDoc = rendered["$push"].AsBsonDocument;
            pushDoc.Contains("Snapshots").Should().BeTrue();

            var snapshotsPush = pushDoc["Snapshots"].AsBsonDocument;
            snapshotsPush["$position"].AsInt32.Should().Be(0);
            snapshotsPush["$slice"].AsInt32.Should().Be(3);
            snapshotsPush["$each"].AsBsonArray.Count.Should().Be(1);

            // Simulate on an array that already has 3 snapshots
            var initialSnapshots = new BsonArray
            {
                new BsonDocument { { "Description", "Snapshot 3" }, { "Timestamp", DateTime.UtcNow.AddMinutes(-30) } },
                new BsonDocument { { "Description", "Snapshot 2" }, { "Timestamp", DateTime.UtcNow.AddMinutes(-60) } },
                new BsonDocument { { "Description", "Snapshot 1" }, { "Timestamp", DateTime.UtcNow.AddMinutes(-90) } },
            };

            // MongoDB $position: 0 inserts at beginning:
            var newSnapshotDoc = snapshot.ToBsonDocument();
            initialSnapshots.Insert(0, newSnapshotDoc);

            // MongoDB $slice: 3 keeps first 3:
            while (initialSnapshots.Count > 3)
            {
                initialSnapshots.RemoveAt(initialSnapshots.Count - 1);
            }

            initialSnapshots.Count.Should().Be(3);
            initialSnapshots[0]["Description"].AsString.Should().Be("Snapshot 4 (newest)");
            initialSnapshots[1]["Description"].AsString.Should().Be("Snapshot 3");
            initialSnapshots[2]["Description"].AsString.Should().Be("Snapshot 2");

            // Oldest ("Snapshot 1") was dropped
            initialSnapshots.Any(s => s["Description"].AsString == "Snapshot 1").Should().BeFalse();
        }

        // =========================================================================
        // 4. UNIQUE INDEX ON IDEAID TEST
        // =========================================================================
        [Fact]
        public void Repository_constructor_creates_unique_index_on_IdeaId()
        {
            var collectionMock = new Mock<IMongoCollection<BrandKit>>();
            var indexManagerMock = new Mock<IMongoIndexManager<BrandKit>>();
            collectionMock.Setup(c => c.Indexes).Returns(indexManagerMock.Object);

            CreateIndexModel<BrandKit>? capturedModel = null;
            indexManagerMock.Setup(m => m.CreateOneAsync(It.IsAny<CreateIndexModel<BrandKit>>(), null, default))
                .Callback<CreateIndexModel<BrandKit>, CreateOneIndexOptions, CancellationToken>((model, opt, ct) => capturedModel = model)
                .ReturnsAsync("Unique_IdeaId");

            var dbMock = new Mock<IMongoDatabase>();
            dbMock.Setup(d => d.GetCollection<BrandKit>("BrandKits", null)).Returns(collectionMock.Object);

            // Instantiating repository triggers CreateIndexesAsync in constructor
            _ = new BrandKitRepository(dbMock.Object);

            capturedModel.Should().NotBeNull();
            capturedModel!.Options.Unique.Should().BeTrue();
            capturedModel.Options.Name.Should().Be("Unique_IdeaId");
        }

        // =========================================================================
        // 5. DOMAIN INVARIANTS TEST
        // =========================================================================
        [Fact]
        public void Domain_invariants_hold_for_color_roles_typography_and_refinements()
        {
            // 1. Color roles: exactly 5, Background has null contrast
            BrandColorRoleNames.All.Should().HaveCount(5);
            BrandColorRoleNames.All.Should().Contain(new[] { "Primary", "Secondary", "Accent", "Background", "Text" });

            var kit = CreatePopulatedKit(IdeaAId, OwnerUserId);
            var bgRole = kit.Colors.Roles.First(r => r.RoleName == BrandColorRoleNames.Background);
            bgRole.ContrastRatio.Should().BeNull();
            bgRole.ContrastVerdict.Should().BeNull();

            // 2. Typography roles: exactly 4, Logo type is permanently locked
            BrandTypographyRoleNames.All.Should().HaveCount(4);
            BrandTypographyRoleNames.All.Should().Contain(new[] { "Logo type", "Heading", "Body", "Button & label" });

            var logoTypeRole = kit.Typography.Roles.First(r => r.RoleName == BrandTypographyRoleNames.LogoType);
            logoTypeRole.IsLocked.Should().BeTrue();

            // 3. Refinement settings: exact three nullable properties
            var refinement = new BrandLogoRefinementSettings
            {
                SymbolSize = "scale_4",
                Spacing = "tight",
                Arrangement = "stacked"
            };
            refinement.SymbolSize.Should().Be("scale_4");
            refinement.Spacing.Should().Be("tight");
            refinement.Arrangement.Should().Be("stacked");

            // 4. Logo variations: exactly 7 canonical keys
            BrandLogoVariationKeys.All.Should().HaveCount(7);
            BrandLogoVariationKeys.All.Should().Contain(new[] { "primary", "horizontal", "stacked", "icon_only", "black", "white", "transparent" });
        }

        // =========================================================================
        // 6. RESOLVE IDEA SCOPING REUSE TEST
        // =========================================================================
        [Fact]
        public async Task ResolveIdeaAsync_reuses_existing_resolution_semantics()
        {
            var ideasStoreMock = new Mock<ICreatorIdeaStore>();
            var expectedIdea = new CreatorIdea { Id = IdeaAId, UserId = OwnerUserId };

            ideasStoreMock.Setup(s => s.GetOwnedAsync(IdeaAId, OwnerUserId)).ReturnsAsync(expectedIdea);
            ideasStoreMock.Setup(s => s.GetOwnedAsync("unowned-idea", OwnerUserId)).ReturnsAsync((CreatorIdea?)null);

            var dbMock = new Mock<IMongoDatabase>();
            var journeysColMock = new Mock<IMongoCollection<CreatorJourney>>();
            var existingJourney = new CreatorJourney { UserId = OwnerUserId, ActiveIdeaId = IdeaAId };

            // Find for GetOrCreateAsync
            journeysColMock.Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<CreatorJourney>>(),
                It.IsAny<FindOptions<CreatorJourney, CreatorJourney>>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync(() =>
                {
                    var cursor = new Mock<IAsyncCursor<CreatorJourney>>();
                    cursor.SetupSequence(x => x.MoveNext(It.IsAny<CancellationToken>())).Returns(true).Returns(false);
                    cursor.SetupSequence(x => x.MoveNextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true).ReturnsAsync(false);
                    cursor.Setup(x => x.Current).Returns(new List<CreatorJourney> { existingJourney });
                    return cursor.Object;
                });

            dbMock.Setup(d => d.GetCollection<CreatorJourney>("CreatorJourneys", null)).Returns(journeysColMock.Object);
            var context = new MongoDbContext(dbMock.Object);

            var journeyService = new CreatorJourneyService(
                context,
                Mock.Of<IBusinessPlanSessionStore>(),
                Mock.Of<IForecastSessionStore>(),
                ideasStoreMock.Object,
                Mock.Of<IClarifierSessionStore>());

            // 1. Explicit idea resolves correctly
            var resolved = await journeyService.ResolveIdeaAsync(OwnerUserId, IdeaAId);
            resolved.Should().BeSameAs(expectedIdea);

            // 2. Missing idea falls back to active idea
            var activeFallback = await journeyService.ResolveIdeaAsync(OwnerUserId, null);
            activeFallback.Should().BeSameAs(expectedIdea);

            // 3. Unowned idea throws 404
            var act = () => journeyService.ResolveIdeaAsync(OwnerUserId, "unowned-idea");
            var ex = await act.Should().ThrowAsync<CreatorJourneyException>();
            ex.Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        }
    }
}
