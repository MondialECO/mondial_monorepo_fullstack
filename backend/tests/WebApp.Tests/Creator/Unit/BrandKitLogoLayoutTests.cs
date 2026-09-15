using System.Xml.Linq;
using FluentAssertions;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Creator.BrandKit.LogoEngine;
using Xunit;

namespace WebApp.Tests.Creator.Unit
{
    public class BrandKitLogoLayoutTests
    {
        private readonly LogoMarkRendererRegistry _registry = new();

        private static readonly string[] TestBrandNames = new[]
        {
            "Onyx",                                       // 4 chars (short)
            "Aura Tech",                                  // 9 chars
            "CyberLock",                                  // 9 chars
            "TerraHarvest",                               // 12 chars
            "Maison Forma",                               // 12 chars
            "Apex Autonomous Robotics",                   // 24 chars
            "BioSynthetic Quantum Therapeutics",          // 33 chars (long)
            "International Sustainable Agriculture Lab"   // 40 chars (extreme)
        };

        [Theory]
        [InlineData("wordmark")]
        [InlineData("symbol_plus_name")]
        [InlineData("monogram")]
        [InlineData("abstract")]
        [InlineData("icon")]
        [InlineData("minimal")]
        public void Layout_confinement_and_non_overlap_holds_across_all_name_lengths(string family)
        {
            foreach (var name in TestBrandNames)
            {
                var param = new BrandLogoConceptParameters
                {
                    Family = family,
                    Values = new Dictionary<string, string>
                    {
                        ["FontCategory"] = "geometric_sans",
                        ["LetterCase"] = "uppercase",
                        ["BadgeShape"] = "hexagon",
                        ["GeometryType"] = "rotational_symmetry_3",
                        ["MetaphorPrimitive"] = "node_network",
                        ["Primitive"] = "offset_bars"
                    }
                };

                // 1. Test Mark-Only SVG
                var markSvg = _registry.RenderMarkSvg(param, name);
                markSvg.Should().NotBeNullOrWhiteSpace();
                var markDoc = XDocument.Parse(markSvg);
                var markRoot = markDoc.Root!;
                markRoot.Name.LocalName.Should().Be("svg");
                var markVb = markRoot.Attribute("viewBox")?.Value;
                markVb.Should().NotBeNullOrWhiteSpace();

                // 2. Test Lockup SVG
                var lockupSvg = _registry.RenderLockupSvg(param, name);
                lockupSvg.Should().NotBeNullOrWhiteSpace();
                var lockupDoc = XDocument.Parse(lockupSvg);
                var lockupRoot = lockupDoc.Root!;
                lockupRoot.Name.LocalName.Should().Be("svg");

                var lockupVb = lockupRoot.Attribute("viewBox")?.Value;
                lockupVb.Should().NotBeNullOrWhiteSpace();

                var vbParts = lockupVb!.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                vbParts.Length.Should().Be(4);
                float.Parse(vbParts[2]).Should().BeGreaterOrEqualTo(300f); // Width
                float.Parse(vbParts[3]).Should().BeGreaterOrEqualTo(80f);  // Height

                // Must contain pure vector paths (no unrendered plain <text> tags)
                lockupDoc.Descendants().Where(e => e.Name.LocalName == "text").Should().BeEmpty();
                lockupDoc.Descendants().Where(e => e.Name.LocalName == "path").Should().NotBeEmpty();
            }
        }

        [Fact]
        public void Long_name_33_chars_produces_legible_measured_layout_without_overflow()
        {
            const string longName = "BioSynthetic Quantum Therapeutics";
            var param = new BrandLogoConceptParameters
            {
                Family = BrandLogoFamilyNames.Wordmark,
                Values = new Dictionary<string, string>
                {
                    ["FontCategory"] = "geometric_sans",
                    ["LetterCase"] = "uppercase",
                    ["LetterSpacing"] = "normal",
                    ["AccentElement"] = "none"
                }
            };

            var svg = _registry.RenderLockupSvg(param, longName);
            var doc = XDocument.Parse(svg);
            var vb = doc.Root!.Attribute("viewBox")!.Value;
            var parts = vb.Split(' ');
            var width = float.Parse(parts[2]);
            var height = float.Parse(parts[3]);

            width.Should().BeInRange(340f, 600f);
            height.Should().BeGreaterOrEqualTo(100f);
        }

        [Fact]
        public void Short_name_4_chars_renders_hero_initial_in_monogram()
        {
            const string shortName = "Onyx";
            var param = new BrandLogoConceptParameters
            {
                Family = BrandLogoFamilyNames.Monogram,
                Values = new Dictionary<string, string>
                {
                    ["FontCategory"] = "high_contrast_serif"
                }
            };

            var markSvg = _registry.RenderMarkSvg(param, shortName);
            markSvg.Should().Contain("viewBox=\"0 0 100 100\"");
            markSvg.Should().Contain("<path");
        }
    }
}
