using System.Xml.Linq;
using FluentAssertions;
using WebApp.Models.DatabaseModels;
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
        public void Every_family_renders_valid_flat_vector_svg(string familyName)
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
    }
}
