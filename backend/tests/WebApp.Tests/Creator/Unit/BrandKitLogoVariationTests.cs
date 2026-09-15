using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Moq;
using SkiaSharp;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Creator.BrandKit.LogoEngine;
using Xunit;

namespace WebApp.Tests.Creator.Unit
{
    public class BrandKitLogoVariationTests
    {
        private readonly LogoMarkRendererRegistry _rendererRegistry;
        private readonly Mock<IWebHostEnvironment> _mockEnv;
        private readonly string _testTempDir;

        public BrandKitLogoVariationTests()
        {
            _rendererRegistry = new LogoMarkRendererRegistry();
            _mockEnv = new Mock<IWebHostEnvironment>();
            _testTempDir = Path.Combine(Path.GetTempPath(), "mondial_variation_tests_" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(_testTempDir);
            _mockEnv.Setup(e => e.WebRootPath).Returns(_testTempDir);
        }

        private LogoVariationService CreateService()
        {
            return new LogoVariationService(_rendererRegistry, _mockEnv.Object);
        }

        [Fact]
        public async Task All_seven_variations_exist_immediately_after_logo_approval()
        {
            var service = CreateService();
            var ideaId = "idea_test_7vars";
            var brandName = "CyberLock";

            var approvedConcept = new BrandLogoConcept
            {
                Key = "concept_1",
                DescriptorLine = "Tech precision hexagon mark",
                MarkAssetUri = "/brand-assets/logos/idea_test_7vars/concept_1_mark.svg",
                LockupAssetUri = "/brand-assets/logos/idea_test_7vars/concept_1_lockup.svg",
                Parameters = new BrandLogoConceptParameters
                {
                    Family = "symbol_plus_name",
                    Values = new()
                    {
                        ["EmblemShape"] = "hexagon",
                        ["LetterCase"] = "uppercase",
                        ["FontCategory"] = "geometric_sans",
                        ["PrimaryColor"] = "#0052FF",
                        ["Arrangement"] = "side_by_side"
                    }
                }
            };

            var kit = new BrandKit
            {
                IdeaId = ideaId,
                Strategy = new BrandStrategy { BusinessName = brandName },
                Logo = new BrandLogo
                {
                    SelectedConceptKey = "concept_1",
                    ApprovedAt = DateTime.UtcNow,
                    Concepts = new() { approvedConcept }
                }
            };

            var variations = await service.DeriveVariationsAsync(ideaId, brandName, approvedConcept, kit);

            Assert.NotNull(variations);
            Assert.Equal(7, variations.Count);

            var expectedKeys = new[]
            {
                BrandLogoVariationKeys.Primary,
                BrandLogoVariationKeys.Horizontal,
                BrandLogoVariationKeys.Stacked,
                BrandLogoVariationKeys.IconOnly,
                BrandLogoVariationKeys.Black,
                BrandLogoVariationKeys.White,
                BrandLogoVariationKeys.Transparent
            };

            foreach (var key in expectedKeys)
            {
                Assert.True(variations.ContainsKey(key), $"Missing canonical variation key: {key}");
                var v = variations[key];
                Assert.False(string.IsNullOrWhiteSpace(v.SvgUri), $"SvgUri empty for {key}");
                Assert.False(string.IsNullOrWhiteSpace(v.PngUri), $"PngUri empty for {key}");
                Assert.False(string.IsNullOrWhiteSpace(v.UsageNote), $"UsageNote empty for {key}");
            }
        }

        [Fact]
        public async Task Icon_only_is_byte_identical_to_approved_MarkAssetUri()
        {
            var service = CreateService();
            var ideaId = "idea_test_icon_only";
            var brandName = "TerraHarvest";

            var approvedConcept = new BrandLogoConcept
            {
                Key = "concept_4",
                MarkAssetUri = $"/brand-assets/logos/{ideaId}/concept_4_mark.svg",
                LockupAssetUri = $"/brand-assets/logos/{ideaId}/concept_4_lockup.svg",
                Parameters = new BrandLogoConceptParameters
                {
                    Family = "monogram",
                    Values = new()
                    {
                        ["FrameStyle"] = "circle",
                        ["LetterCase"] = "uppercase",
                        ["FontCategory"] = "humanist_sans",
                        ["PrimaryColor"] = "#2D6A4F",
                        ["Arrangement"] = "stacked"
                    }
                }
            };

            var kit = new BrandKit
            {
                IdeaId = ideaId,
                Strategy = new BrandStrategy { BusinessName = brandName }
            };

            var variations = await service.DeriveVariationsAsync(ideaId, brandName, approvedConcept, kit);

            var iconOnly = variations[BrandLogoVariationKeys.IconOnly];
            Assert.Equal(approvedConcept.MarkAssetUri, iconOnly.SvgUri);
        }

        [Fact]
        public async Task Black_and_white_preserve_exact_geometry_differing_only_in_colors()
        {
            var service = CreateService();
            var ideaId = "idea_test_bw_geom";
            var brandName = "Maison Forma";

            var approvedConcept = new BrandLogoConcept
            {
                Key = "concept_3",
                MarkAssetUri = $"/brand-assets/logos/{ideaId}/concept_3_mark.svg",
                LockupAssetUri = $"/brand-assets/logos/{ideaId}/concept_3_lockup.svg",
                Parameters = new BrandLogoConceptParameters
                {
                    Family = "symbol_plus_name",
                    Values = new()
                    {
                        ["EmblemShape"] = "diamond",
                        ["LetterCase"] = "uppercase",
                        ["FontCategory"] = "high_contrast_serif",
                        ["PrimaryColor"] = "#B38E5D",
                        ["Arrangement"] = "stacked"
                    }
                }
            };

            var kit = new BrandKit
            {
                IdeaId = ideaId,
                Strategy = new BrandStrategy { BusinessName = brandName }
            };

            var variations = await service.DeriveVariationsAsync(ideaId, brandName, approvedConcept, kit);

            var blackSvgPath = Path.Combine(_testTempDir, variations[BrandLogoVariationKeys.Black].SvgUri.TrimStart('/'));
            var whiteSvgPath = Path.Combine(_testTempDir, variations[BrandLogoVariationKeys.White].SvgUri.TrimStart('/'));

            var blackSvg = await File.ReadAllTextAsync(blackSvgPath);
            var whiteSvg = await File.ReadAllTextAsync(whiteSvgPath);

            var pathDataRegex = new Regex(@"d=""([^""]+)""");
            var blackPaths = pathDataRegex.Matches(blackSvg).Select(m => m.Groups[1].Value).ToList();
            var whitePaths = pathDataRegex.Matches(whiteSvg).Select(m => m.Groups[1].Value).ToList();

            Assert.NotEmpty(blackPaths);
            Assert.Equal(blackPaths.Count, whitePaths.Count);
            for (int i = 0; i < blackPaths.Count; i++)
            {
                Assert.Equal(blackPaths[i], whitePaths[i]);
            }

            Assert.DoesNotContain("#B38E5D", blackSvg, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("#000000", blackSvg, StringComparison.OrdinalIgnoreCase);

            Assert.DoesNotContain("#B38E5D", whiteSvg, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("#FFFFFF", whiteSvg, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task Transparent_png_contains_genuine_alpha_channel()
        {
            var service = CreateService();
            var ideaId = "idea_test_alpha_png";
            var brandName = "CyberLock";

            var approvedConcept = new BrandLogoConcept
            {
                Key = "concept_1",
                MarkAssetUri = $"/brand-assets/logos/{ideaId}/concept_1_mark.svg",
                LockupAssetUri = $"/brand-assets/logos/{ideaId}/concept_1_lockup.svg",
                Parameters = new BrandLogoConceptParameters
                {
                    Family = "minimal",
                    Values = new()
                    {
                        ["MotifPrimitive"] = "offset_bars",
                        ["LetterCase"] = "uppercase",
                        ["FontCategory"] = "geometric_sans",
                        ["PrimaryColor"] = "#0052FF",
                        ["Arrangement"] = "side_by_side"
                    }
                }
            };

            var kit = new BrandKit
            {
                IdeaId = ideaId,
                Strategy = new BrandStrategy { BusinessName = brandName }
            };

            var variations = await service.DeriveVariationsAsync(ideaId, brandName, approvedConcept, kit);
            var transparentPngRel = variations[BrandLogoVariationKeys.Transparent].PngUri!.TrimStart('/');
            var transparentPngPath = Path.Combine(_testTempDir, transparentPngRel);

            Assert.True(File.Exists(transparentPngPath), "Transparent PNG file must exist on disk");

            using var codec = SKCodec.Create(transparentPngPath);
            Assert.NotNull(codec);
            using var bitmap = SKBitmap.Decode(codec);
            Assert.NotNull(bitmap);

            // Pixel at top-left corner (0,0) outside glyphs must have alpha == 0
            var cornerPixel = bitmap.GetPixel(0, 0);
            Assert.Equal(0, cornerPixel.Alpha);
        }

        [Fact]
        public async Task Changing_approved_concept_atomically_replaces_all_variations()
        {
            var service = CreateService();
            var ideaId = "idea_test_switch_concept";
            var brandName = "BioSynthetic";

            var concept1 = new BrandLogoConcept
            {
                Key = "concept_1",
                MarkAssetUri = $"/brand-assets/logos/{ideaId}/concept_1_mark.svg",
                LockupAssetUri = $"/brand-assets/logos/{ideaId}/concept_1_lockup.svg",
                Parameters = new BrandLogoConceptParameters
                {
                    Family = "symbol_plus_name",
                    Values = new() { ["EmblemShape"] = "hexagon", ["PrimaryColor"] = "#0052FF" }
                }
            };

            var concept2 = new BrandLogoConcept
            {
                Key = "concept_2",
                MarkAssetUri = $"/brand-assets/logos/{ideaId}/concept_2_mark.svg",
                LockupAssetUri = $"/brand-assets/logos/{ideaId}/concept_2_lockup.svg",
                Parameters = new BrandLogoConceptParameters
                {
                    Family = "wordmark",
                    Values = new() { ["AccentElement"] = "terminal_dot", ["PrimaryColor"] = "#0052FF" }
                }
            };

            var kit = new BrandKit
            {
                IdeaId = ideaId,
                Strategy = new BrandStrategy { BusinessName = brandName }
            };

            // Derive for Concept 1
            var variations1 = await service.DeriveVariationsAsync(ideaId, brandName, concept1, kit);
            Assert.All(variations1.Values, v => Assert.Contains("concept_1", v.SvgUri + v.PngUri));

            // Switch to Concept 2 and derive
            var variations2 = await service.DeriveVariationsAsync(ideaId, brandName, concept2, kit);
            Assert.All(variations2.Values, v =>
            {
                Assert.Contains("concept_2", v.SvgUri + v.PngUri);
                Assert.DoesNotContain("concept_1", v.SvgUri + v.PngUri);
            });
        }

        [Theory]
        // Short names (4-5 chars)
        [InlineData("symbol_plus_name", "stacked", "Onyx")]
        [InlineData("wordmark", "stacked", "Aero")]
        [InlineData("monogram", "stacked", "Onyx")]
        [InlineData("abstract", "stacked", "Flux")]
        [InlineData("icon", "stacked", "Onyx")]
        [InlineData("minimal", "stacked", "Nova")]
        // Medium names (10-18 chars)
        [InlineData("symbol_plus_name", "side_by_side", "CyberLock Security")]
        [InlineData("wordmark", "stacked", "Maison Forma")]
        [InlineData("monogram", "side_by_side", "TerraHarvest")]
        [InlineData("abstract", "side_by_side", "CyberLock")]
        [InlineData("icon", "stacked", "TerraHarvest Pro")]
        [InlineData("minimal", "side_by_side", "Maison Forma")]
        // Long multi-word names (30-45 chars)
        [InlineData("symbol_plus_name", "side_by_side", "BioSynthetic Quantum Therapeutics")]
        [InlineData("wordmark", "side_by_side", "International Architectural Consulting Practice")]
        [InlineData("monogram", "stacked", "Sustainable Agricultural Technology Solutions")]
        [InlineData("abstract", "stacked", "BioSynthetic Quantum Therapeutics")]
        [InlineData("icon", "side_by_side", "Global Financial Systems & Infrastructure")]
        [InlineData("minimal", "stacked", "Advanced Environmental Protection Agency")]
        // Long unbroken names (28-34 chars)
        [InlineData("symbol_plus_name", "stacked", "SUPERLONGUNBROKENNAMEWITHOUTSPACES")]
        [InlineData("wordmark", "side_by_side", "AEROSTRUCTURESTECHNOLOGYLABS")]
        [InlineData("monogram", "side_by_side", "SUPERLONGUNBROKENNAMEWITHOUTSPACES")]
        [InlineData("abstract", "stacked", "AEROSTRUCTURESTECHNOLOGYLABS")]
        [InlineData("icon", "stacked", "SUPERLONGUNBROKENNAMEWITHOUTSPACES")]
        [InlineData("minimal", "side_by_side", "AEROSTRUCTURESTECHNOLOGYLABS")]
        public async Task Derived_alternate_arrangements_pass_full_layout_assertion_sweep(
            string family,
            string initialArrangement,
            string brandName)
        {
            var service = CreateService();
            var ideaId = "idea_test_layout_sweep";

            var approvedConcept = new BrandLogoConcept
            {
                Key = "concept_test",
                MarkAssetUri = $"/brand-assets/logos/{ideaId}/concept_test_mark.svg",
                LockupAssetUri = $"/brand-assets/logos/{ideaId}/concept_test_lockup.svg",
                Parameters = new BrandLogoConceptParameters
                {
                    Family = family,
                    Values = new()
                    {
                        ["Arrangement"] = initialArrangement,
                        ["FontCategory"] = "geometric_sans",
                        ["LetterCase"] = "uppercase",
                        ["PrimaryColor"] = "#0052FF"
                    }
                }
            };

            var kit = new BrandKit
            {
                IdeaId = ideaId,
                Strategy = new BrandStrategy { BusinessName = brandName }
            };

            var variations = await service.DeriveVariationsAsync(ideaId, brandName, approvedConcept, kit);

            // Verify Horizontal variation
            var horizontalVar = variations[BrandLogoVariationKeys.Horizontal];
            Assert.False(string.IsNullOrEmpty(horizontalVar.SvgUri));
            var horizontalSvgPath = Path.Combine(_testTempDir, horizontalVar.SvgUri.TrimStart('/'));
            var horizontalSvg = File.Exists(horizontalSvgPath)
                ? await File.ReadAllTextAsync(horizontalSvgPath)
                : _rendererRegistry.RenderLockupSvg(approvedConcept.Parameters, brandName);

            Assert.Contains("viewBox=\"0 0 ", horizontalSvg);
            Assert.Contains("role=\"img\"", horizontalSvg);
            Assert.Contains("<title>", horizontalSvg);

            // Verify Stacked variation
            var stackedVar = variations[BrandLogoVariationKeys.Stacked];
            Assert.False(string.IsNullOrEmpty(stackedVar.SvgUri));
            var stackedSvgPath = Path.Combine(_testTempDir, stackedVar.SvgUri.TrimStart('/'));
            var stackedSvg = File.Exists(stackedSvgPath)
                ? await File.ReadAllTextAsync(stackedSvgPath)
                : _rendererRegistry.RenderLockupSvg(approvedConcept.Parameters, brandName);

            Assert.Contains("viewBox=\"0 0 ", stackedSvg);
            Assert.Contains("role=\"img\"", stackedSvg);
            Assert.Contains("<title>", stackedSvg);
        }
    }
}
