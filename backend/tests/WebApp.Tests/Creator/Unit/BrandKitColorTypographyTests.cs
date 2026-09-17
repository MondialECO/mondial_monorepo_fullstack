using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Ai;
using WebApp.Services.Ai.Providers;
using WebApp.Services.Creator.BrandKit.ColorEngine;
using WebApp.Services.Creator.BrandKit.TypographyEngine;
using Xunit;
using BrandKitModel = WebApp.Models.DatabaseModels.BrandKit;

namespace WebApp.Tests.Creator.Unit
{
    public class BrandKitColorTypographyTests
    {
        // -------------------------------------------------------------------------
        // 1. DETERMINISTIC WCAG CONTRAST & ADJUSTMENT TESTS
        // -------------------------------------------------------------------------

        [Theory]
        [InlineData("#000000", "#FFFFFF", 21.0, "AAA")]
        [InlineData("#FFFFFF", "#FFFFFF", 1.0, "FAIL")]
        [InlineData("#1A1A24", "#FFFFFF", 16.5, "AAA")]
        [InlineData("#3C61DD", "#FFFFFF", 5.2, "AA")]
        [InlineData("#00D084", "#FFFFFF", 1.5, "FAIL")]
        public void WcagContrastCalculator_ComputesCorrectRatiosAndVerdicts(
            string fg, string bg, double expectedMinRatio, string expectedVerdict)
        {
            double ratio = WcagContrastCalculator.CalculateContrastRatio(fg, bg);
            string verdict = WcagContrastCalculator.GetContrastVerdict(ratio);

            if (expectedVerdict == "FAIL")
            {
                verdict.Should().Be("FAIL");
            }
            else
            {
                ratio.Should().BeGreaterThanOrEqualTo(expectedMinRatio - 0.5);
                verdict.Should().Be(expectedVerdict);
            }
        }

        [Fact]
        public void WcagContrastCalculator_LightnessSteppingAdjustsLowContrastInputUntilPasses()
        {
            // #E0E0E0 on #FFFFFF has ~1.3:1 contrast (failing)
            string lowContrastFg = "#E0E0E0";
            string bg = "#FFFFFF";

            double initialRatio = WcagContrastCalculator.CalculateContrastRatio(lowContrastFg, bg);
            initialRatio.Should().BeLessThan(3.0);
            WcagContrastCalculator.GetContrastVerdict(initialRatio).Should().Be("FAIL");

            var mockLogger = new Mock<ILogger>();
            var (adjustedHex, newRatio, newVerdict, wasAdjusted) = WcagContrastCalculator.AdjustLightnessForContrast(
                lowContrastFg, bg, minTargetRatio: 4.5, isLargeOrAccent: false, logger: mockLogger.Object, roleName: "TestRole");

            wasAdjusted.Should().BeTrue("Adjustment must trigger for failing contrast");
            newRatio.Should().BeGreaterThanOrEqualTo(4.5, "New ratio must meet or exceed WCAG AA minimum 4.5:1");
            newVerdict.Should().BeOneOf("AA", "AAA");

            // Re-verify independently with calculation
            double independentCheck = WcagContrastCalculator.CalculateContrastRatio(adjustedHex, bg);
            independentCheck.Should().Be(newRatio);
        }

        // -------------------------------------------------------------------------
        // 2. 5-ROLE PALETTE GENERATION & INVARIANTS
        // -------------------------------------------------------------------------

        [Fact]
        public void ColorGenerationService_InitialDerive_ProducesAllFiveRoles_WithNullBackgroundContrast()
        {
            var service = new ColorGenerationService(aiProvider: null, modelRouter: null, logger: NullLogger<ColorGenerationService>.Instance);

            var kit = CreateTestBrandKit("CyberShield", "Cinzel", new List<string> { "#0B192C", "#1E3E62", "#FF6500", "#F8FAFC" });
            var idea = new CreatorIdea { Id = "idea-1", Project = new CreatorJourneyProject { Name = "CyberShield" } };

            var colors = service.DeriveInitialColors(kit, idea);

            colors.Should().NotBeNull();
            colors.Roles.Should().HaveCount(5);

            var roleNames = colors.Roles.Select(r => r.RoleName).ToList();
            roleNames.Should().Equal(
                BrandColorRoleNames.Primary,
                BrandColorRoleNames.Secondary,
                BrandColorRoleNames.Accent,
                BrandColorRoleNames.Background,
                BrandColorRoleNames.Text);

            var bgRole = colors.Roles.First(r => r.RoleName == BrandColorRoleNames.Background);
            bgRole.ContrastRatio.Should().BeNull("Background contrast ratio must legitimately be null");
            bgRole.ContrastVerdict.Should().BeNull("Background contrast verdict must legitimately be null");
            bgRole.IsLocked.Should().BeTrue();

            var fgRoles = colors.Roles.Where(r => r.RoleName != BrandColorRoleNames.Background).ToList();
            fgRoles.Should().HaveCount(4);
            foreach (var role in fgRoles)
            {
                role.ContrastRatio.Should().NotBeNull($"Role {role.RoleName} must have a computed contrast ratio");
                role.ContrastRatio!.Value.Should().BeGreaterThanOrEqualTo(3.0, $"Role {role.RoleName} must pass minimum contrast");
                role.ContrastVerdict.Should().BeOneOf("AA", "AAA", "AA_Large");
                role.Hex.Should().MatchRegex("^#[0-9A-F]{6}$");
                role.Rgb.Should().MatchRegex("^[0-9]+,[0-9]+,[0-9]+$");
            }
        }

        [Fact]
        public async Task ColorGenerationService_Regenerate_CallsModelAndAdjustsContrast()
        {
            var mockAi = new Mock<IAiProvider>();
            var mockRouter = new Mock<IModelRouter>();

            mockRouter.Setup(r => r.Resolve("ColorGeneration")).Returns("google/gemini-3.8-flash");

            // Mock AI response returning a low-contrast accent that must be adjusted deterministically
            string aiResponseJson = @"{
                ""primary"": ""#112233"",
                ""secondary"": ""#225588"",
                ""accent"": ""#DDEEFF"",
                ""background"": ""#FFFFFF"",
                ""text"": ""#050510"",
                ""rationale"": ""Deep ocean security palette with crisp contrast""
            }";

            mockAi.Setup(a => a.CompleteAsync(It.IsAny<AiCompletionRequest>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new AiCompletion
                {
                    Text = aiResponseJson,
                    Model = "google/gemini-3.8-flash",
                    Usage = new AiTokenUsage(250, 90, 340),
                    EstimatedCost = 0.0003m
                });

            var service = new ColorGenerationService(mockAi.Object, mockRouter.Object, NullLogger<ColorGenerationService>.Instance);
            var kit = CreateTestBrandKit("Aegis Security", "Space Grotesk", new List<string> { "#101010", "#202020", "#303030", "#FFFFFF" });
            var idea = new CreatorIdea { Id = "idea-2", Project = new CreatorJourneyProject { Name = "Aegis Security" } };

            var regenerated = await service.RegenerateColorsAsync(kit, idea, CancellationToken.None);

            regenerated.Should().NotBeNull();
            regenerated.RegenerateCount.Should().Be(1);
            regenerated.Roles.Should().HaveCount(5);

            var accentRole = regenerated.Roles.First(r => r.RoleName == BrandColorRoleNames.Accent);
            // #DDEEFF on #FFFFFF has ~1.1:1 contrast, so it must have been stepped to pass >= 3.0
            accentRole.ContrastRatio.Should().BeGreaterThanOrEqualTo(3.0);
            accentRole.ContrastVerdict.Should().BeOneOf("AA", "AAA", "AA_Large");

            mockAi.Verify(a => a.CompleteAsync(It.Is<AiCompletionRequest>(r => r.Model == "google/gemini-3.8-flash"), It.IsAny<CancellationToken>()), Times.Once);
        }

        // -------------------------------------------------------------------------
        // 3. TYPOGRAPHY INVARIANTS: LOCKED LOGO TYPE & BUNDLED FONT METADATA
        // -------------------------------------------------------------------------

        [Theory]
        [InlineData("Cinzel")]
        [InlineData("Space Grotesk")]
        [InlineData("Plus Jakarta Sans")]
        [InlineData("Syne")]
        [InlineData("JetBrains Mono")]
        public void TypographyService_LogoType_StrictlyMatchesApprovedLogoConceptFamily(string logoFont)
        {
            var service = new TypographyGenerationService(aiProvider: null, modelRouter: null, logger: NullLogger<TypographyGenerationService>.Instance);

            var kit = CreateTestBrandKit("Test Brand", logoFont, new List<string> { "#000000", "#222222", "#444444", "#FFFFFF" });
            var idea = new CreatorIdea { Id = "idea-3", Project = new CreatorJourneyProject { Name = "Test Brand" } };

            var typography = service.DeriveInitialTypography(kit, idea);

            var logoTypeRole = typography.Roles.First(r => r.RoleName == BrandTypographyRoleNames.LogoType);
            logoTypeRole.Family.Should().Be(logoFont, "Logo type role must strictly match the approved logo concept's font");
            logoTypeRole.IsLocked.Should().BeTrue("Logo type role must always be locked");
        }

        [Fact]
        public async Task TypographyService_Regenerate_SuggestsNewPairing_WhileLogoTypeRemainsLocked()
        {
            var mockAi = new Mock<IAiProvider>();
            var mockRouter = new Mock<IModelRouter>();

            mockRouter.Setup(r => r.Resolve("TypographyGeneration")).Returns("google/gemini-3.8-flash");

            string aiResponseJson = @"{
                ""heading_font"": ""Syne"",
                ""body_font"": ""JetBrains Mono"",
                ""rationale"": ""High-impact display paired with technical monospace precision""
            }";

            mockAi.Setup(a => a.CompleteAsync(It.IsAny<AiCompletionRequest>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new AiCompletion
                {
                    Text = aiResponseJson,
                    Model = "google/gemini-3.8-flash",
                    Usage = new AiTokenUsage(200, 60, 260),
                    EstimatedCost = 0.0002m
                });

            var service = new TypographyGenerationService(mockAi.Object, mockRouter.Object, NullLogger<TypographyGenerationService>.Instance);

            // Approved concept has Cinzel
            var kit = CreateTestBrandKit("CyberShield", "Cinzel", new List<string> { "#000000", "#111111", "#222222", "#FFFFFF" });
            var idea = new CreatorIdea { Id = "idea-4", Project = new CreatorJourneyProject { Name = "CyberShield" } };

            var regenerated = await service.RegenerateTypographyAsync(kit, idea, CancellationToken.None);

            regenerated.Should().NotBeNull();
            regenerated.RegenerateCount.Should().Be(1);

            var logoRole = regenerated.Roles.First(r => r.RoleName == BrandTypographyRoleNames.LogoType);
            logoRole.Family.Should().Be("Cinzel", "Logo type role MUST NEVER be modified or overridden by typography regenerate");
            logoRole.IsLocked.Should().BeTrue();

            var headingRole = regenerated.Roles.First(r => r.RoleName == BrandTypographyRoleNames.Heading);
            headingRole.Family.Should().Be("Syne");

            var bodyRole = regenerated.Roles.First(r => r.RoleName == BrandTypographyRoleNames.Body);
            bodyRole.Family.Should().Be("JetBrains Mono");

            // Verify real WebWeightKb and License metadata
            regenerated.Families.DisplayFamily.Name.Should().Be("Syne");
            regenerated.Families.DisplayFamily.WebWeightKb.Should().Be(143.5);
            regenerated.Families.DisplayFamily.License.Should().Be("SIL Open Font License 1.1");

            regenerated.Families.TextFamily.Name.Should().Be("JetBrains Mono");
            regenerated.Families.TextFamily.WebWeightKb.Should().Be(182.8);
            regenerated.Families.TextFamily.License.Should().Be("Apache License 2.0 / OFL");
        }

        [Fact]
        public void TypographyService_LogoType_FollowsApprovedConcept_SpecificallyAfterLogoConceptChange()
        {
            var service = new TypographyGenerationService(aiProvider: null, modelRouter: null, logger: NullLogger<TypographyGenerationService>.Instance);

            var kit = new BrandKitModel
            {
                Id = "test-kit-concept-change",
                Logo = new BrandLogo
                {
                    SelectedConceptKey = "concept-1",
                    ApprovedAt = DateTime.UtcNow,
                    Concepts = new List<BrandLogoConcept>
                    {
                        new() { Key = "concept-1", Parameters = new BrandLogoConceptParameters { Family = "Cinzel" } },
                        new() { Key = "concept-2", Parameters = new BrandLogoConceptParameters { Family = "JetBrains Mono" } }
                    }
                }
            };
            var idea = new CreatorIdea { Id = "idea-5", Project = new CreatorJourneyProject { Name = "Evolving Brand" } };

            // Initial derive with concept-1 approved
            var initialTypo = service.DeriveInitialTypography(kit, idea);
            initialTypo.Roles.First(r => r.RoleName == BrandTypographyRoleNames.LogoType).Family.Should().Be("Cinzel");

            // User switches approved concept to concept-2 (JetBrains Mono)
            kit.Logo.SelectedConceptKey = "concept-2";

            var updatedTypo = service.DeriveInitialTypography(kit, idea);
            var updatedLogoRole = updatedTypo.Roles.First(r => r.RoleName == BrandTypographyRoleNames.LogoType);
            updatedLogoRole.Family.Should().Be("JetBrains Mono", "Logo type role must follow the newly approved concept font after concept change");
            updatedLogoRole.IsLocked.Should().BeTrue();
        }

        [Fact]
        public async Task TypographyService_Regenerate_ExplicitlyEnforcesPairingDiffersInAtLeastOneFamilyFromCurrent()
        {
            var mockAi = new Mock<IAiProvider>();
            var mockRouter = new Mock<IModelRouter>();
            mockRouter.Setup(r => r.Resolve("TypographyGeneration")).Returns("google/gemini-3.8-flash");

            string distinctAiJson = @"{
                ""heading_font"": ""Syne"",
                ""body_font"": ""JetBrains Mono"",
                ""rationale"": ""High contrast modern pairing""
            }";

            mockAi.Setup(a => a.CompleteAsync(It.IsAny<AiCompletionRequest>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new AiCompletion
                {
                    Text = distinctAiJson,
                    Model = "google/gemini-3.8-flash",
                    Usage = new AiTokenUsage(150, 40, 190),
                    EstimatedCost = 0.0001m
                });

            var service = new TypographyGenerationService(mockAi.Object, mockRouter.Object, logger: NullLogger<TypographyGenerationService>.Instance);

            string currentHeading = "Space Grotesk";
            string currentBody = "Plus Jakarta Sans";

            var kit = CreateTestBrandKit("CyberShield", "Cinzel", new List<string> { "#000000", "#111111", "#222222", "#FFFFFF" });
            kit.Typography = new BrandTypography
            {
                Roles = new List<BrandTypographyRole>
                {
                    new() { RoleName = BrandTypographyRoleNames.LogoType, Family = "Cinzel", IsLocked = true },
                    new() { RoleName = BrandTypographyRoleNames.Heading, Family = currentHeading, IsLocked = false },
                    new() { RoleName = BrandTypographyRoleNames.Body, Family = currentBody, IsLocked = false }
                }
            };
            var idea = new CreatorIdea { Id = "idea-diff", Project = new CreatorJourneyProject { Name = "CyberShield" } };

            var regenerated = await service.RegenerateTypographyAsync(kit, idea, CancellationToken.None);

            var newHeading = regenerated.Roles.First(r => r.RoleName == BrandTypographyRoleNames.Heading).Family;
            var newBody = regenerated.Roles.First(r => r.RoleName == BrandTypographyRoleNames.Body).Family;

            // Explicit assertion: pairing MUST differ in at least one family from current pairing
            bool differs = !string.Equals(newHeading, currentHeading, StringComparison.OrdinalIgnoreCase) ||
                           !string.Equals(newBody, currentBody, StringComparison.OrdinalIgnoreCase);

            differs.Should().BeTrue($"Regenerated pairing ({newHeading} + {newBody}) must differ from current pairing ({currentHeading} + {currentBody}) in at least one family");
        }

        [Fact]
        public async Task TypographyService_Regenerate_WhenAiReturnsUnbundledFont_Throws()
        {
            var mockAi = new Mock<IAiProvider>();
            var mockRouter = new Mock<IModelRouter>();

            mockRouter.Setup(r => r.Resolve("TypographyGeneration")).Returns("google/gemini-3.8-flash");

            string invalidAiJson = @"{
                ""heading_font"": ""NonExistentFont"",
                ""body_font"": ""Plus Jakarta Sans"",
                ""rationale"": ""Invalid unbundled font""
            }";

            mockAi.Setup(a => a.CompleteAsync(It.IsAny<AiCompletionRequest>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new AiCompletion
                {
                    Text = invalidAiJson,
                    Model = "google/gemini-3.8-flash",
                    Usage = new AiTokenUsage(150, 40, 190),
                    EstimatedCost = 0.0001m
                });

            var service = new TypographyGenerationService(mockAi.Object, mockRouter.Object, NullLogger<TypographyGenerationService>.Instance);

            var kit = CreateTestBrandKit("CyberShield", "Cinzel", new List<string> { "#000000", "#111111", "#222222", "#FFFFFF" });
            kit.Typography = new BrandTypography
            {
                Roles = new List<BrandTypographyRole>
                {
                    new() { RoleName = BrandTypographyRoleNames.LogoType, Family = "Cinzel", IsLocked = true },
                    new() { RoleName = BrandTypographyRoleNames.Heading, Family = "Syne", IsLocked = false },
                    new() { RoleName = BrandTypographyRoleNames.Body, Family = "Plus Jakarta Sans", IsLocked = false }
                }
            };
            var idea = new CreatorIdea { Id = "idea-echo", Project = new CreatorJourneyProject { Name = "CyberShield" } };

            var act = () => service.RegenerateTypographyAsync(kit, idea, CancellationToken.None);
            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*Typography pairing AI generation did not return valid bundled fonts*");
        }

        [Fact]
        public async Task ColorGenerationService_Regenerate_Throws_When_AiProvider_Not_Configured()
        {
            var service = new ColorGenerationService(aiProvider: null, modelRouter: null, logger: NullLogger<ColorGenerationService>.Instance);

            var currentPrimary = "#1A1A24";
            var currentSecondary = "#3C61DD";

            var kit = CreateTestBrandKit("CyberShield", "Cinzel", new List<string> { currentPrimary, currentSecondary, "#00D084", "#FFFFFF" });
            kit.Colors = new BrandColors
            {
                Roles = new List<BrandColorRole>
                {
                    new() { RoleName = BrandColorRoleNames.Primary, Hex = currentPrimary },
                    new() { RoleName = BrandColorRoleNames.Secondary, Hex = currentSecondary }
                }
            };
            var idea = new CreatorIdea { Id = "idea-diff-color", Project = new CreatorJourneyProject { Name = "CyberShield" } };

            var act = () => service.RegenerateColorsAsync(kit, idea, CancellationToken.None);
            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*No AI provider configured*");
        }

        // -------------------------------------------------------------------------
        // 4. STRATEGY SPECIMEN TEXT GENERATION ACROSS 3 CONTRASTING BUSINESSES
        // -------------------------------------------------------------------------

        [Fact]
        public void TypographyService_GeneratesRealStrategySpecimens_NoLoremIpsum()
        {
            var service = new TypographyGenerationService(aiProvider: null, modelRouter: null, logger: NullLogger<TypographyGenerationService>.Instance);

            // Business 1: Cybersecurity
            var kit1 = new BrandKitModel
            {
                Strategy = new BrandStrategy
                {
                    BusinessName = "CyberShield Labs",
                    Positioning = new BrandProvenancedText { Value = "Zero-trust autonomous defense for cloud infrastructure" },
                    Concept = new BrandProvenancedText { Value = "Real-time threat telemetry and automated incident containment" },
                    TargetAudience = new BrandProvenancedText { Value = "Enterprise Security Operations Centers" }
                },
                Logo = new BrandLogo
                {
                    SelectedConceptKey = "c1",
                    ApprovedAt = DateTime.UtcNow,
                    Concepts = new List<BrandLogoConcept>
                    {
                        new() { Key = "c1", Parameters = new BrandLogoConceptParameters { Family = "Space Grotesk" } }
                    }
                }
            };
            var idea1 = new CreatorIdea { Id = "idea-cyber", Project = new CreatorJourneyProject { Name = "CyberShield Labs" } };
            var typo1 = service.DeriveInitialTypography(kit1, idea1);

            // Business 2: Sustainable Agriculture
            var kit2 = new BrandKitModel
            {
                Strategy = new BrandStrategy
                {
                    BusinessName = "TerraHarvest Organics",
                    Positioning = new BrandProvenancedText { Value = "Regenerative soil intelligence for circular farming" },
                    Concept = new BrandProvenancedText { Value = "Precision micro-climate sensors combined with organic bio-stimulants" },
                    TargetAudience = new BrandProvenancedText { Value = "Commercial organic growers and vineyard managers" }
                },
                Logo = new BrandLogo
                {
                    SelectedConceptKey = "c2",
                    ApprovedAt = DateTime.UtcNow,
                    Concepts = new List<BrandLogoConcept>
                    {
                        new() { Key = "c2", Parameters = new BrandLogoConceptParameters { Family = "Plus Jakarta Sans" } }
                    }
                }
            };
            var idea2 = new CreatorIdea { Id = "idea-agri", Project = new CreatorJourneyProject { Name = "TerraHarvest Organics" } };
            var typo2 = service.DeriveInitialTypography(kit2, idea2);

            // Business 3: Luxury Architecture
            var kit3 = new BrandKitModel
            {
                Strategy = new BrandStrategy
                {
                    BusinessName = "Maison Forma",
                    Positioning = new BrandProvenancedText { Value = "Timeless sculptural residences grounded in brutalist minimalism" },
                    Concept = new BrandProvenancedText { Value = "Bespoke architectural masterworks crafted with reclaimed stone and monolithic glass" },
                    TargetAudience = new BrandProvenancedText { Value = "Ultra-high-net-worth private collectors and patrons" }
                },
                Logo = new BrandLogo
                {
                    SelectedConceptKey = "c3",
                    ApprovedAt = DateTime.UtcNow,
                    Concepts = new List<BrandLogoConcept>
                    {
                        new() { Key = "c3", Parameters = new BrandLogoConceptParameters { Family = "Cinzel" } }
                    }
                }
            };
            var idea3 = new CreatorIdea { Id = "idea-lux", Project = new CreatorJourneyProject { Name = "Maison Forma" } };
            var typo3 = service.DeriveInitialTypography(kit3, idea3);

            var allTypos = new[] { typo1, typo2, typo3 };
            foreach (var typo in allTypos)
            {
                foreach (var role in typo.Roles)
                {
                    role.SpecimenText.Should().NotBeNullOrWhiteSpace();
                    role.SpecimenText.ToLowerInvariant().Should().NotContain("lorem");
                    role.SpecimenText.ToLowerInvariant().Should().NotContain("ipsum");
                    role.SpecimenText.ToLowerInvariant().Should().NotContain("dolor sit");
                }
            }

            typo1.Roles.First(r => r.RoleName == BrandTypographyRoleNames.Heading).SpecimenText.Should().Be("Zero-trust autonomous defense for cloud infrastructure");
            typo2.Roles.First(r => r.RoleName == BrandTypographyRoleNames.Heading).SpecimenText.Should().Be("Regenerative soil intelligence for circular farming");
            typo3.Roles.First(r => r.RoleName == BrandTypographyRoleNames.Heading).SpecimenText.Should().Be("Timeless sculptural residences grounded in brutalist minimalism");
        }

        // -------------------------------------------------------------------------
        // HELPERS
        // -------------------------------------------------------------------------

        private static BrandKitModel CreateTestBrandKit(string brandName, string logoFont, List<string> directionPalette)
        {
            return new BrandKitModel
            {
                Id = "test-kit-id",
                Strategy = new BrandStrategy
                {
                    BusinessName = brandName,
                    Positioning = new BrandProvenancedText { Value = "Next-generation engineering" },
                    Concept = new BrandProvenancedText { Value = "AI-powered solutions" },
                    TargetAudience = new BrandProvenancedText { Value = "Enterprises" },
                    ConfirmedAt = DateTime.UtcNow
                },
                Direction = new BrandDirection
                {
                    SelectedDirectionKey = "dir-1",
                    Candidates = new List<BrandDirectionCandidate>
                    {
                        new()
                        {
                            Key = "dir-1",
                            Name = "Modern Technical",
                            ColorPalette = directionPalette,
                            DisplayTypeface = "Space Grotesk",
                            TextTypeface = "Plus Jakarta Sans"
                        }
                    }
                },
                Logo = new BrandLogo
                {
                    SelectedConceptKey = "concept-1",
                    ApprovedAt = DateTime.UtcNow,
                    Concepts = new List<BrandLogoConcept>
                    {
                        new()
                        {
                            Key = "concept-1",
                            DescriptorLine = "Technical glyph",
                            Parameters = new BrandLogoConceptParameters
                            {
                                Family = logoFont
                            }
                        }
                    }
                }
            };
        }
    }
}
