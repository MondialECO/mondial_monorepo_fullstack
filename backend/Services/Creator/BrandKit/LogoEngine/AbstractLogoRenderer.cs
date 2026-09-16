using System.Globalization;
using System.Text;
using System.Security;
using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Creator.BrandKit.LogoEngine
{
    public class AbstractLogoRenderer : ILogoMarkRenderer
    {
        public string FamilyName => BrandLogoFamilyNames.Abstract;

        public string RenderMarkSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null)
        {
            var primaryColor = colorHex ?? parameters?.Values?.GetValueOrDefault("PrimaryColor") ?? "#0F172A";
            var accentColor = parameters?.Values?.GetValueOrDefault("AccentColor") ?? primaryColor;
            var geomType = parameters?.Values?.GetValueOrDefault("GeometryType") ?? "rotational_symmetry_3";
            var weight = parameters?.Values?.GetValueOrDefault("StrokeWeight") ?? "heavy_bold";
            var escapedName = SecurityElement.Escape(brandName ?? "Brand");
            var strokeWidth = weight switch
            {
                "thin_precision" => 4.5f,
                "medium" => 6.5f,
                _ => 9.0f
            };

            var sb = new StringBuilder();
            sb.AppendLine($"<svg viewBox=\"0 0 100 100\" width=\"100%\" height=\"100%\" xmlns=\"http://www.w3.org/2000/svg\" role=\"img\" aria-label=\"{escapedName} Logo\">");
            sb.AppendLine($"  <title>{escapedName} Logo</title>");
            RenderAbstractGeometry(sb, geomType, strokeWidth, 15f, 15f, 70f, primaryColor, accentColor);
            sb.AppendLine("</svg>");
            return sb.ToString();
        }

        public string RenderLockupSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null)
        {
            var primaryColor = colorHex ?? parameters?.Values?.GetValueOrDefault("PrimaryColor") ?? "#0F172A";
            var accentColor = parameters?.Values?.GetValueOrDefault("AccentColor") ?? primaryColor;
            var geomType = parameters?.Values?.GetValueOrDefault("GeometryType") ?? "rotational_symmetry_3";
            var fontCategory = parameters?.Values?.GetValueOrDefault("FontCategory") ?? "geometric_sans";
            var arrangement = parameters?.Values?.GetValueOrDefault("Arrangement") ?? "side_by_side";
            var weight = parameters?.Values?.GetValueOrDefault("StrokeWeight") ?? "heavy_bold";
            var escapedName = SecurityElement.Escape(brandName ?? "Brand");
            var strokeWidth = weight switch
            {
                "thin_precision" => 4.5f,
                "medium" => 6.5f,
                _ => 9.0f
            };

            var isStacked = string.Equals(arrangement, "stacked", StringComparison.OrdinalIgnoreCase);

            var textResult = VectorTypographyRenderer.RenderTextToVectorPath(
                brandName,
                fontCategory,
                initialFontSize: isStacked ? 22f : 24f,
                letterSpacing: "wide",
                horizontalBudget: isStacked ? 300f : 260f,
                allowTwoLineStacking: true,
                letterCase: "uppercase");

            var sb = new StringBuilder();

            if (isStacked)
            {
                var markSize = 64f;
                var totalW = Math.Max(320f, textResult.Width + 48f);
                var totalH = 160f;

                var markX = (totalW - markSize) * 0.5f;
                var markY = 18f;

                var textX = (totalW - textResult.Width) * 0.5f - textResult.Left;
                var textY = 120f - (textResult.Top + textResult.Height * 0.5f);

                sb.AppendLine($"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 {totalW.ToString("F0", CultureInfo.InvariantCulture)} {totalH.ToString("F0", CultureInfo.InvariantCulture)}\" width=\"100%\" height=\"100%\" role=\"img\" aria-label=\"{escapedName} Logo\">");
                sb.AppendLine($"  <title>{escapedName} Logo</title>");
                RenderAbstractGeometry(sb, geomType, strokeWidth, markX, markY, markSize, primaryColor, accentColor);

                sb.AppendLine($"  <g transform=\"translate({textX.ToString("F1", CultureInfo.InvariantCulture)}, {textY.ToString("F1", CultureInfo.InvariantCulture)})\">");
                sb.AppendLine($"    <path d=\"{textResult.SvgPathData}\" fill=\"{primaryColor}\" />");
                sb.AppendLine("  </g>");
                sb.AppendLine("</svg>");
            }
            else
            {
                var markSize = 60f;
                var paddingLeft = 24f;
                var gap = 20f;
                var markX = paddingLeft;
                var textX = markX + markSize + gap;

                var paddingRight = 24f;
                var totalW = Math.Max(380f, textX + textResult.Width + paddingRight);
                var totalH = textResult.IsStacked ? 120f : 100f;

                var textOffsetY = totalH * 0.5f - (textResult.Top + textResult.Height * 0.5f);
                var markOffsetY = totalH * 0.5f - (markSize * 0.5f);

                sb.AppendLine($"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 {totalW.ToString("F0", CultureInfo.InvariantCulture)} {totalH.ToString("F0", CultureInfo.InvariantCulture)}\" width=\"100%\" height=\"100%\" role=\"img\" aria-label=\"{escapedName} Logo\">");
                sb.AppendLine($"  <title>{escapedName} Logo</title>");
                RenderAbstractGeometry(sb, geomType, strokeWidth, markX, markOffsetY, markSize, primaryColor, accentColor);

                var textTranslationX = textX - textResult.Left;
                sb.AppendLine($"  <g transform=\"translate({textTranslationX.ToString("F1", CultureInfo.InvariantCulture)}, {textOffsetY.ToString("F1", CultureInfo.InvariantCulture)})\">");
                sb.AppendLine($"    <path d=\"{textResult.SvgPathData}\" fill=\"{primaryColor}\" />");
                sb.AppendLine("  </g>");
                sb.AppendLine("</svg>");
            }

            return sb.ToString();
        }

        public string RenderSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null)
        {
            return RenderLockupSvg(parameters, brandName, colorHex);
        }

        private static void RenderAbstractGeometry(
            StringBuilder sb,
            string type,
            float strokeWidth,
            float x,
            float y,
            float size,
            string primaryColor,
            string accentColor)
        {
            var half = size * 0.5f;
            var cx = x + half;
            var cy = y + half;
            var isDuoTone = !string.Equals(primaryColor, accentColor, StringComparison.OrdinalIgnoreCase);
            var secColor = isDuoTone ? accentColor : primaryColor;

            switch (type.ToLowerInvariant())
            {
                case "faceted_diamond":
                    // 3D Faceted Diamond with multi-tone depth
                    var topY = y + size * 0.05f;
                    var botY = y + size * 0.95f;
                    var midY = y + size * 0.38f;
                    var leftX = x + size * 0.05f;
                    var rightX = x + size * 0.95f;
                    var innerLX = x + size * 0.32f;
                    var innerRX = x + size * 0.68f;

                    // Top center table
                    sb.AppendLine($"  <polygon points=\"{innerLX.ToString("F1", CultureInfo.InvariantCulture)},{topY.ToString("F1", CultureInfo.InvariantCulture)} {innerRX.ToString("F1", CultureInfo.InvariantCulture)},{topY.ToString("F1", CultureInfo.InvariantCulture)} {cx.ToString("F1", CultureInfo.InvariantCulture)},{midY.ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"{primaryColor}\" fill-opacity=\"0.35\" />");
                    // Top left facet
                    sb.AppendLine($"  <polygon points=\"{leftX.ToString("F1", CultureInfo.InvariantCulture)},{midY.ToString("F1", CultureInfo.InvariantCulture)} {innerLX.ToString("F1", CultureInfo.InvariantCulture)},{topY.ToString("F1", CultureInfo.InvariantCulture)} {cx.ToString("F1", CultureInfo.InvariantCulture)},{midY.ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"{secColor}\" fill-opacity=\"0.65\" />");
                    // Top right facet
                    sb.AppendLine($"  <polygon points=\"{rightX.ToString("F1", CultureInfo.InvariantCulture)},{midY.ToString("F1", CultureInfo.InvariantCulture)} {innerRX.ToString("F1", CultureInfo.InvariantCulture)},{topY.ToString("F1", CultureInfo.InvariantCulture)} {cx.ToString("F1", CultureInfo.InvariantCulture)},{midY.ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"{primaryColor}\" fill-opacity=\"0.85\" />");
                    // Bottom left pavilion
                    sb.AppendLine($"  <polygon points=\"{leftX.ToString("F1", CultureInfo.InvariantCulture)},{midY.ToString("F1", CultureInfo.InvariantCulture)} {cx.ToString("F1", CultureInfo.InvariantCulture)},{midY.ToString("F1", CultureInfo.InvariantCulture)} {cx.ToString("F1", CultureInfo.InvariantCulture)},{botY.ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"{primaryColor}\" />");
                    // Bottom right pavilion
                    sb.AppendLine($"  <polygon points=\"{rightX.ToString("F1", CultureInfo.InvariantCulture)},{midY.ToString("F1", CultureInfo.InvariantCulture)} {cx.ToString("F1", CultureInfo.InvariantCulture)},{midY.ToString("F1", CultureInfo.InvariantCulture)} {cx.ToString("F1", CultureInfo.InvariantCulture)},{botY.ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"{secColor}\" fill-opacity=\"0.9\" />");
                    break;

                case "isometric_cube":
                    // 3D Isometric Cube with contrasting faces
                    var cTopY = cy - size * 0.45f;
                    var cMidY = cy;
                    var cBotY = cy + size * 0.45f;
                    var cLeftX = cx - size * 0.40f;
                    var cRightX = cx + size * 0.40f;
                    var cMidUpperY = cy - size * 0.22f;
                    var cMidLowerY = cy + size * 0.22f;

                    // Top face
                    sb.AppendLine($"  <polygon points=\"{cx.ToString("F1", CultureInfo.InvariantCulture)},{cTopY.ToString("F1", CultureInfo.InvariantCulture)} {cRightX.ToString("F1", CultureInfo.InvariantCulture)},{cMidUpperY.ToString("F1", CultureInfo.InvariantCulture)} {cx.ToString("F1", CultureInfo.InvariantCulture)},{cMidY.ToString("F1", CultureInfo.InvariantCulture)} {cLeftX.ToString("F1", CultureInfo.InvariantCulture)},{cMidUpperY.ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"{primaryColor}\" fill-opacity=\"0.4\" />");
                    // Left face
                    sb.AppendLine($"  <polygon points=\"{cLeftX.ToString("F1", CultureInfo.InvariantCulture)},{cMidUpperY.ToString("F1", CultureInfo.InvariantCulture)} {cx.ToString("F1", CultureInfo.InvariantCulture)},{cMidY.ToString("F1", CultureInfo.InvariantCulture)} {cx.ToString("F1", CultureInfo.InvariantCulture)},{cBotY.ToString("F1", CultureInfo.InvariantCulture)} {cLeftX.ToString("F1", CultureInfo.InvariantCulture)},{cMidLowerY.ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"{primaryColor}\" />");
                    // Right face
                    sb.AppendLine($"  <polygon points=\"{cx.ToString("F1", CultureInfo.InvariantCulture)},{cMidY.ToString("F1", CultureInfo.InvariantCulture)} {cRightX.ToString("F1", CultureInfo.InvariantCulture)},{cMidUpperY.ToString("F1", CultureInfo.InvariantCulture)} {cRightX.ToString("F1", CultureInfo.InvariantCulture)},{cMidLowerY.ToString("F1", CultureInfo.InvariantCulture)} {cx.ToString("F1", CultureInfo.InvariantCulture)},{cBotY.ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"{secColor}\" fill-opacity=\"0.85\" />");
                    break;

                case "rotational_symmetry_3":
                    var rArc = half * 0.78f;
                    sb.AppendLine($"  <g transform=\"translate({cx.ToString("F1", CultureInfo.InvariantCulture)}, {cy.ToString("F1", CultureInfo.InvariantCulture)})\">");
                    for (int i = 0; i < 3; i++)
                    {
                        var angle = i * 120f;
                        var bladeColor = i == 0 ? primaryColor : (i == 1 ? secColor : primaryColor);
                        var bladeOpacity = i == 2 ? "0.65" : "1.0";
                        sb.AppendLine($"    <path d=\"M 0,{(-rArc).ToString("F1", CultureInfo.InvariantCulture)} C {(rArc * 0.5f).ToString("F1", CultureInfo.InvariantCulture)},{(-rArc).ToString("F1", CultureInfo.InvariantCulture)} {(rArc * 0.866f).ToString("F1", CultureInfo.InvariantCulture)},{(-rArc * 0.5f).ToString("F1", CultureInfo.InvariantCulture)} {(rArc * 0.866f).ToString("F1", CultureInfo.InvariantCulture)},{(-rArc * 0.2f).ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"none\" stroke=\"{bladeColor}\" stroke-opacity=\"{bladeOpacity}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" stroke-linecap=\"round\" transform=\"rotate({angle.ToString("F0", CultureInfo.InvariantCulture)})\" />");
                    }
                    sb.AppendLine("  </g>");
                    break;

                case "rotational_symmetry_4":
                    var rArc4 = half * 0.75f;
                    sb.AppendLine($"  <g transform=\"translate({cx.ToString("F1", CultureInfo.InvariantCulture)}, {cy.ToString("F1", CultureInfo.InvariantCulture)})\">");
                    for (int i = 0; i < 4; i++)
                    {
                        var angle4 = i * 90f;
                        var col4 = i % 2 == 0 ? primaryColor : secColor;
                        sb.AppendLine($"    <path d=\"M 0,{(-rArc4).ToString("F1", CultureInfo.InvariantCulture)} A {rArc4.ToString("F1", CultureInfo.InvariantCulture)} {rArc4.ToString("F1", CultureInfo.InvariantCulture)} 0 0 1 {rArc4.ToString("F1", CultureInfo.InvariantCulture)} 0\" fill=\"none\" stroke=\"{col4}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" stroke-linecap=\"round\" transform=\"rotate({angle4.ToString("F0", CultureInfo.InvariantCulture)})\" />");
                    }
                    sb.AppendLine("  </g>");
                    break;

                case "mobius_fold":
                case "wave_frequencies":
                    var mR = half * 0.75f;
                    sb.AppendLine($"  <g transform=\"translate({cx.ToString("F1", CultureInfo.InvariantCulture)}, {cy.ToString("F1", CultureInfo.InvariantCulture)})\">");
                    sb.AppendLine($"    <path d=\"M {(-mR * 0.7f).ToString("F1", CultureInfo.InvariantCulture)},{(-mR * 0.5f).ToString("F1", CultureInfo.InvariantCulture)} C {(-mR * 0.2f).ToString("F1", CultureInfo.InvariantCulture)},{(-mR * 1.1f).ToString("F1", CultureInfo.InvariantCulture)} {(mR * 0.2f).ToString("F1", CultureInfo.InvariantCulture)},{(mR * 1.1f).ToString("F1", CultureInfo.InvariantCulture)} {(mR * 0.7f).ToString("F1", CultureInfo.InvariantCulture)},{(mR * 0.5f).ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"none\" stroke=\"{primaryColor}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" stroke-linecap=\"round\" />");
                    sb.AppendLine($"    <path d=\"M {(mR * 0.7f).ToString("F1", CultureInfo.InvariantCulture)},{(-mR * 0.5f).ToString("F1", CultureInfo.InvariantCulture)} C {(mR * 0.2f).ToString("F1", CultureInfo.InvariantCulture)},{(-mR * 1.1f).ToString("F1", CultureInfo.InvariantCulture)} {(-mR * 0.2f).ToString("F1", CultureInfo.InvariantCulture)},{(mR * 1.1f).ToString("F1", CultureInfo.InvariantCulture)} {(-mR * 0.7f).ToString("F1", CultureInfo.InvariantCulture)},{(mR * 0.5f).ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"none\" stroke=\"{secColor}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" stroke-linecap=\"round\" />");
                    sb.AppendLine("  </g>");
                    break;

                default: // intersecting_rings
                    var ringR = half * 0.52f;
                    var offset = ringR * 0.45f;
                    sb.AppendLine($"  <circle cx=\"{(cx - offset).ToString("F1", CultureInfo.InvariantCulture)}\" cy=\"{(cy - offset * 0.6f).ToString("F1", CultureInfo.InvariantCulture)}\" r=\"{ringR.ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"none\" stroke=\"{primaryColor}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" />");
                    sb.AppendLine($"  <circle cx=\"{(cx + offset).ToString("F1", CultureInfo.InvariantCulture)}\" cy=\"{(cy - offset * 0.6f).ToString("F1", CultureInfo.InvariantCulture)}\" r=\"{ringR.ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"none\" stroke=\"{secColor}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" />");
                    sb.AppendLine($"  <circle cx=\"{cx.ToString("F1", CultureInfo.InvariantCulture)}\" cy=\"{(cy + offset).ToString("F1", CultureInfo.InvariantCulture)}\" r=\"{ringR.ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"none\" stroke=\"{primaryColor}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" stroke-opacity=\"0.75\" />");
                    break;
            }
        }
    }
}
