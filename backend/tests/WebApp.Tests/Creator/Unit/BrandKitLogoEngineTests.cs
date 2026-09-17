using System.Xml.Linq;
using FluentAssertions;
using Moq;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Ai.Providers;
using WebApp.Services.Creator.BrandKit.LogoEngine;
using Xunit;

namespace WebApp.Tests.Creator.Unit
{
    public class BrandKitLogoEngineTests
    {
        private readonly LogoMarkRendererRegistry _registry = new();

        [Theory]
        [InlineData(BrandLogoFamilyNames.Wordmark)]
        [InlineData(BrandLogoFamilyNames.SymbolPlusName)]
        [InlineData(BrandLogoFamilyNames.Monogram)]
        [InlineData(BrandLogoFamilyNames.Abstract)]
        [InlineData(BrandLogoFamilyNames.Icon)]
        [InlineData(BrandLogoFamilyNames.Minimal)]
        public void Every_family_renders_valid_flat_vector_svg_with_accessibility(string familyName)
        {
            var p = new BrandLogoConceptParameters { Family = familyName };
            var svg = _registry.RenderSvg(p, "MONDIAL").Trim();
            var markSvg = _registry.RenderMarkSvg(p, "MONDIAL").Trim();
            var lockupSvg = _registry.RenderLockupSvg(p, "MONDIAL").Trim();

            svg.Should().NotBeNullOrWhiteSpace();
            svg.Should().StartWith("<svg");
            svg.Should().EndWith("</svg>");

            markSvg.Should().NotBeNullOrWhiteSpace();
            markSvg.Should().StartWith("<svg");
            markSvg.Should().EndWith("</svg>");

            lockupSvg.Should().NotBeNullOrWhiteSpace();
            lockupSvg.Should().StartWith("<svg");
            lockupSvg.Should().EndWith("</svg>");

            // Accessibility attributes & elements
            svg.Should().Contain("role=\"img\"");
            svg.Should().Contain("aria-label=\"MONDIAL Logo\"");
            svg.Should().Contain("<title>MONDIAL Logo</title>");

            markSvg.Should().Contain("role=\"img\"");
            markSvg.Should().Contain("aria-label=\"MONDIAL Logo\"");
            markSvg.Should().Contain("<title>MONDIAL Logo</title>");

            lockupSvg.Should().Contain("role=\"img\"");
            lockupSvg.Should().Contain("aria-label=\"MONDIAL Logo\"");
            lockupSvg.Should().Contain("<title>MONDIAL Logo</title>");

            // Zero font dependency tags
            svg.Should().NotContain("<text");
            svg.Should().NotContain("<tspan");

            // Non-negotiable flat vector properties: no gradients, no filters, no shadows
            svg.Should().NotContain("<linearGradient");
            svg.Should().NotContain("<radialGradient");
            svg.Should().NotContain("<filter");
            svg.Should().NotContain("feDropShadow");
            svg.Should().NotContain("box-shadow");

            // Must be valid XML
            var xmlDoc = XDocument.Parse(svg);
            xmlDoc.Root.Should().NotBeNull();
            xmlDoc.Root!.Name.LocalName.Should().Be("svg");
            xmlDoc.Root.Attribute("viewBox").Should().NotBeNull();
        }

        [Fact]
        public void Bundled_fonts_load_from_embedded_or_file_streams_without_os_registry()
        {
            VectorTypographyRenderer.EnsureInitialized();

            var categories = new[] { "high_contrast_serif", "geometric_sans", "humanist_sans", "slab_serif", "mono" };
            foreach (var cat in categories)
            {
                var tf = VectorTypographyRenderer.ResolveTypeface(cat);
                tf.Should().NotBeNull();
                tf.FamilyName.Should().NotBeNullOrWhiteSpace();
            }
        }

        [Fact]
        public void Multi_word_long_name_triggers_stacked_two_line_layout()
        {
            var p = new BrandLogoConceptParameters
            {
                Family = BrandLogoFamilyNames.SymbolPlusName,
                Values = new()
                {
                    ["BadgeShape"] = "hexagon",
                    ["FontCategory"] = "geometric_sans"
                }
            };

            var res = VectorTypographyRenderer.RenderTextToVectorPath(
                "BioSynthetic Quantum Therapeutics",
                "geometric_sans",
                initialFontSize: 24f,
                letterSpacing: "normal",
                horizontalBudget: 260f,
                allowTwoLineStacking: true,
                letterCase: "uppercase");

            res.IsStacked.Should().BeTrue();
            res.Width.Should().BeLessThanOrEqualTo(260f);
        }

        [Fact]
        public void Rendering_is_strictly_deterministic()
        {
            var p = new BrandLogoConceptParameters
            {
                Family = BrandLogoFamilyNames.Abstract,
                Values = new()
                {
                    ["GeometryType"] = "rotational_symmetry_4",
                    ["StrokeWeight"] = "heavy_bold"
                }
            };

            var svg1 = _registry.RenderSvg(p, "Apex Dynamics");
            var svg2 = _registry.RenderSvg(p, "Apex Dynamics");

            svg1.Should().Be(svg2);
        }

        [Fact]
        public void Single_color_and_pure_black_white_rendering_works()
        {
            var p = new BrandLogoConceptParameters
            {
                Family = BrandLogoFamilyNames.Minimal,
                Values = new()
                {
                    ["Primitive"] = "sliced_circle",
                    ["Orientation"] = "90_deg"
                }
            };

            var svgBlack = _registry.RenderSvg(p, "Apex", "#000000");
            var svgWhite = _registry.RenderSvg(p, "Apex", "#FFFFFF");
            var svgHex = _registry.RenderSvg(p, "Apex", "#3B82F6");

            svgBlack.Should().Contain("#000000");
            svgWhite.Should().Contain("#FFFFFF");
            svgHex.Should().Contain("#3B82F6");
        }

        [Fact]
        public void Validation_accepts_valid_parameters_and_rejects_invalid_values()
        {
            var valid = new BrandLogoConceptParameters
            {
                Family = BrandLogoFamilyNames.Icon,
                Values = new()
                {
                    ["MetaphorPrimitive"] = "node_network",
                    ["Construction"] = "silhouette_solid"
                }
            };

            var isValid = _registry.ValidateParameters(valid, out var error);
            isValid.Should().BeTrue();
            error.Should().BeNull();

            var invalid = new BrandLogoConceptParameters
            {
                Family = BrandLogoFamilyNames.Icon,
                Values = new()
                {
                    ["MetaphorPrimitive"] = "nonexistent_rocket_ship"
                }
            };

            var isInvalid = _registry.ValidateParameters(invalid, out var invalidError);
            isInvalid.Should().BeFalse();
            invalidError.Should().Contain("Invalid value");
        }

        [Theory]
        [InlineData(BrandLogoFamilyNames.SymbolPlusName)]
        [InlineData(BrandLogoFamilyNames.Wordmark)]
        [InlineData(BrandLogoFamilyNames.Monogram)]
        [InlineData(BrandLogoFamilyNames.Abstract)]
        [InlineData(BrandLogoFamilyNames.Icon)]
        [InlineData(BrandLogoFamilyNames.Minimal)]
        public async Task LogoGenerationService_generates_six_concepts_exclusively_within_selected_logo_type(string selectedFamily)
        {
            var tempDir = Path.Combine(Path.GetTempPath(), $"logo_test_{Guid.NewGuid():N}");
            Directory.CreateDirectory(tempDir);
            try
            {
                var envMock = new Moq.Mock<Microsoft.AspNetCore.Hosting.IWebHostEnvironment>();
                envMock.Setup(e => e.WebRootPath).Returns(tempDir);

                var mockAi = new Mock<IAiProvider>();
                var mockRouter = new Mock<IModelRouter>();
                mockRouter.Setup(r => r.Resolve(It.IsAny<string>())).Returns("google/gemini-3.8-flash");

                mockAi.Setup(a => a.CompleteAsync(It.IsAny<WebApp.Services.Ai.Providers.AiCompletionRequest>(), It.IsAny<CancellationToken>()))
                    .ReturnsAsync((WebApp.Services.Ai.Providers.AiCompletionRequest req, CancellationToken ct) =>
                    {
                        var concepts = new List<object>();
                        for (int i = 0; i < 6; i++)
                        {
                            var p = new Dictionary<string, string>();
                            switch (selectedFamily)
                            {
                                case BrandLogoFamilyNames.Wordmark:
                                    p["Layout"] = i % 2 == 0 ? "single_line" : "stacked_two_line";
                                    p["LetterCase"] = i switch { 0 => "uppercase", 1 => "lowercase", 2 => "titlecase", 3 => "uppercase", 4 => "lowercase", _ => "titlecase" };
                                    p["AccentElement"] = i == 0 ? "terminal_dot" : (i == 1 ? "baseline_underline" : "none");
                                    p["FontCategory"] = "geometric_sans";
                                    p["LetterSpacing"] = i == 0 ? "wide" : "normal";
                                    break;
                                case BrandLogoFamilyNames.SymbolPlusName:
                                    p["BadgeShape"] = i switch { 0 => "circle", 1 => "square", 2 => "rounded_rect", 3 => "hexagon", 4 => "diamond", _ => "shield" };
                                    p["BadgeStyle"] = i % 2 == 0 ? "solid_fill" : "outline_stroke";
                                    p["InternalGlyph"] = "initial_letter";
                                    break;
                                case BrandLogoFamilyNames.Monogram:
                                    p["MonogramType"] = i switch { 0 => "single_letter", 1 => "two_letter_interlock", 2 => "two_letter_adjacent", 3 => "three_letter_pyramid", 4 => "single_letter", _ => "two_letter_interlock" };
                                    p["FrameStyle"] = i switch { 0 => "circle_ring", 1 => "square_box", 2 => "bracket_corners", 3 => "solid_disc", 4 => "none", _ => "circle_ring" };
                                    p["StrokeStyle"] = i % 2 == 0 ? "heavy_block" : "monoline";
                                    p["FontCategory"] = "geometric_sans";
                                    break;
                                case BrandLogoFamilyNames.Abstract:
                                    p["GeometryType"] = i switch { 0 => "intersecting_rings", 1 => "nested_polygons", 2 => "rotational_symmetry_3", 3 => "rotational_symmetry_4", 4 => "mobius_fold", _ => "isometric_cube" };
                                    p["StrokeWeight"] = i % 2 == 0 ? "medium" : "heavy_bold";
                                    p["FontCategory"] = "geometric_sans";
                                    break;
                                case BrandLogoFamilyNames.Icon:
                                    p["MetaphorPrimitive"] = i switch { 0 => "shield_security", 1 => "node_network", 2 => "cube_infrastructure", 3 => "prism_focus", 4 => "arch_gateway", _ => "spark_intelligence" };
                                    p["Construction"] = i % 2 == 0 ? "monoline_stroke" : "silhouette_solid";
                                    p["FontCategory"] = "geometric_sans";
                                    break;
                                case BrandLogoFamilyNames.Minimal:
                                default:
                                    p["Primitive"] = i switch { 0 => "sliced_circle", 1 => "quadrant_arc", 2 => "offset_bars", 3 => "chevron_fold", 4 => "diagonal_slash", _ => "hairline_cross" };
                                    p["Orientation"] = i switch { 0 => "0_deg", 1 => "45_deg", 2 => "90_deg", 3 => "180_deg", 4 => "270_deg", _ => "0_deg" };
                                    p["WeightBalance"] = i % 2 == 0 ? "monolithic_solid" : "contrast_duo";
                                    p["FontCategory"] = "geometric_sans";
                                    break;
                            }
                            concepts.Add(new { family = selectedFamily, descriptor = $"Concept {i + 1}", parameters = p });
                        }
                        var json = System.Text.Json.JsonSerializer.Serialize(new { concepts });
                        return new WebApp.Services.Ai.Providers.AiCompletion
                        {
                            Text = json,
                            Model = "google/gemini-3.8-flash",
                            Usage = new WebApp.Services.Ai.Providers.AiTokenUsage(100, 200, 300)
                        };
                    });

                var service = new LogoGenerationService(_registry, mockAi.Object, mockRouter.Object, env: envMock.Object);

                var idea = new CreatorIdea
                {
                    Id = "idea-123",
                    Project = new CreatorJourneyProject
                    {
                        Name = "CyberLock Sentinel",
                        Problem = "Security breaches",
                        Solution = "Autonomous network defense"
                    }
                };

                var kit = new BrandKit
                {
                    Strategy = new BrandStrategy
                    {
                        BusinessName = "CyberLock Sentinel",
                        PersonalityTraits = new List<string> { "precision", "cyber", "technical" }
                    },
                    Direction = new BrandDirection
                    {
                        SelectedDirectionKey = "dir_1",
                        Candidates = new List<BrandDirectionCandidate>
                        {
                            new() { Key = "dir_1", Name = "High-Assurance Security", DisplayTypeface = "Space Grotesk", TextTypeface = "Inter" }
                        }
                    },
                    Logo = new BrandLogo
                    {
                        LogoType = selectedFamily
                    }
                };

                var concepts = await service.GenerateConceptsAsync(idea, kit);

                concepts.Should().NotBeNull();
                concepts.Should().HaveCount(6);

                // All 6 concepts MUST match the chosen mark family
                foreach (var concept in concepts)
                {
                    concept.Parameters.Family.Should().Be(selectedFamily);
                    concept.MarkAssetUri.Should().NotBeNullOrWhiteSpace();
                    concept.LockupAssetUri.Should().NotBeNullOrWhiteSpace();
                    concept.DescriptorLine.Should().NotBeNullOrWhiteSpace();
                }

                // Verify that parameters across the 6 concepts are diverse (not 6 identical copies)
                var parameterValues = concepts.Select(c => string.Join("|", c.Parameters.Values.Select(kv => $"{kv.Key}={kv.Value}"))).ToList();
                parameterValues.Distinct().Count().Should().Be(6);
            }
            finally
            {
                if (Directory.Exists(tempDir))
                {
                    try { Directory.Delete(tempDir, recursive: true); } catch { }
                }
            }
        }

        [Fact]
        public async Task LogoGenerationService_Generates_multi_family_diversity_when_logo_type_not_selected()
        {
            var tempDir = Path.Combine(Path.GetTempPath(), $"logo_test_{Guid.NewGuid():N}");
            Directory.CreateDirectory(tempDir);
            try
            {
                var envMock = new Moq.Mock<Microsoft.AspNetCore.Hosting.IWebHostEnvironment>();
                envMock.Setup(e => e.WebRootPath).Returns(tempDir);

                var mockAi = new Mock<IAiProvider>();
                var mockRouter = new Mock<IModelRouter>();
                mockRouter.Setup(r => r.Resolve(It.IsAny<string>())).Returns("google/gemini-3.8-flash");

                var sampleJson = @"{
                    ""concepts"": [
                        { ""family"": ""wordmark"", ""descriptor"": ""Wordmark"", ""parameters"": { ""Layout"": ""single_line"", ""LetterCase"": ""uppercase"", ""AccentElement"": ""none"", ""FontCategory"": ""geometric_sans"", ""LetterSpacing"": ""normal"" } },
                        { ""family"": ""symbol_plus_name"", ""descriptor"": ""Badge"", ""parameters"": { ""BadgeShape"": ""circle"", ""BadgeStyle"": ""outline_stroke"", ""InternalGlyph"": ""initial_letter"" } },
                        { ""family"": ""monogram"", ""descriptor"": ""Monogram"", ""parameters"": { ""MonogramType"": ""single_letter"", ""FrameStyle"": ""circle_ring"", ""StrokeStyle"": ""heavy_block"", ""FontCategory"": ""geometric_sans"" } },
                        { ""family"": ""abstract"", ""descriptor"": ""Abstract"", ""parameters"": { ""GeometryType"": ""intersecting_rings"", ""StrokeWeight"": ""medium"", ""FontCategory"": ""geometric_sans"" } },
                        { ""family"": ""icon"", ""descriptor"": ""Icon"", ""parameters"": { ""MetaphorPrimitive"": ""node_network"", ""Construction"": ""monoline_stroke"", ""FontCategory"": ""geometric_sans"" } },
                        { ""family"": ""minimal"", ""descriptor"": ""Minimal"", ""parameters"": { ""Primitive"": ""quadrant_arc"", ""Orientation"": ""0_deg"", ""WeightBalance"": ""monolithic_solid"", ""FontCategory"": ""geometric_sans"" } }
                    ]
                }";
                mockAi.Setup(a => a.CompleteAsync(It.IsAny<WebApp.Services.Ai.Providers.AiCompletionRequest>(), It.IsAny<CancellationToken>()))
                    .ReturnsAsync(new WebApp.Services.Ai.Providers.AiCompletion
                    {
                        Text = sampleJson,
                        Model = "google/gemini-3.8-flash",
                        Usage = new WebApp.Services.Ai.Providers.AiTokenUsage(100, 200, 300)
                    });

                var service = new LogoGenerationService(_registry, mockAi.Object, mockRouter.Object, env: envMock.Object);

                var idea = new CreatorIdea
                {
                    Id = "idea-456",
                    Project = new CreatorJourneyProject { Name = "TerraHarvest Organic" }
                };

                var kit = new BrandKit
                {
                    Strategy = new BrandStrategy
                    {
                        BusinessName = "TerraHarvest Organic",
                        PersonalityTraits = new List<string> { "organic", "warm", "sustainable" }
                    },
                    Direction = new BrandDirection
                    {
                        SelectedDirectionKey = "dir_1",
                        Candidates = new List<BrandDirectionCandidate>
                        {
                            new() { Key = "dir_1", Name = "Earth & Craft", DisplayTypeface = "Cinzel", TextTypeface = "Plus Jakarta Sans" }
                        }
                    },
                    Logo = new BrandLogo
                    {
                        LogoType = null // No single type locked -> cross-family
                    }
                };

                var concepts = await service.GenerateConceptsAsync(idea, kit);

                concepts.Should().NotBeNull();
                concepts.Should().HaveCount(6);

                var distinctFamilies = concepts.Select(c => c.Parameters.Family).Distinct().Count();
                distinctFamilies.Should().BeGreaterOrEqualTo(4);
            }
            finally
            {
                if (Directory.Exists(tempDir))
                {
                    try { Directory.Delete(tempDir, recursive: true); } catch { }
                }
            }
        }

        [Fact]
        public async Task LogoGenerationService_GenerateConcepts_Throws_When_AiProvider_Not_Configured()
        {
            var service = new LogoGenerationService(_registry, aiProvider: null, modelRouter: null);
            var idea = new CreatorIdea { Id = "idea-no-ai", Project = new CreatorJourneyProject { Name = "NoAi Brand" } };
            var kit = new BrandKit();

            var act = () => service.GenerateConceptsAsync(idea, kit);
            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*No AI provider configured in service container.*");
        }
    }
}
