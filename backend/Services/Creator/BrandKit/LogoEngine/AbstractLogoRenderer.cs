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
            var color = colorHex ?? "#0F172A";
            var geomType = parameters?.Values?.GetValueOrDefault("GeometryType") ?? "rotational_symmetry_3";
            var weight = parameters?.Values?.GetValueOrDefault("StrokeWeight") ?? "heavy_bold";
            var escapedName = SecurityElement.Escape(brandName ?? "Brand");
            var strokeWidth = weight switch
            {
                "thin_precision" => 6.0f,
                "medium" => 8.0f,
                _ => 11.0f
            };

            var sb = new StringBuilder();
            sb.AppendLine($"<svg viewBox=\"0 0 100 100\" width=\"100%\" height=\"100%\" xmlns=\"http://www.w3.org/2000/svg\" role=\"img\" aria-label=\"{escapedName} Logo\">");
            sb.AppendLine($"  <title>{escapedName} Logo</title>");
            RenderAbstractGeometry(sb, geomType, strokeWidth, 15f, 15f, 70f, color);
            sb.AppendLine("</svg>");
            return sb.ToString();
        }

        public string RenderLockupSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null)
        {
            var color = colorHex ?? "#0F172A";
            var geomType = parameters?.Values?.GetValueOrDefault("GeometryType") ?? "rotational_symmetry_3";
            var fontCategory = parameters?.Values?.GetValueOrDefault("FontCategory") ?? "geometric_sans";
            var arrangement = parameters?.Values?.GetValueOrDefault("Arrangement") ?? "side_by_side";
            var weight = parameters?.Values?.GetValueOrDefault("StrokeWeight") ?? "heavy_bold";
            var escapedName = SecurityElement.Escape(brandName ?? "Brand");
            var strokeWidth = weight switch
            {
                "thin_precision" => 6.0f,
                "medium" => 8.0f,
                _ => 11.0f
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
                RenderAbstractGeometry(sb, geomType, strokeWidth, markX, markY, markSize, color);

                sb.AppendLine($"  <g transform=\"translate({textX.ToString("F1", CultureInfo.InvariantCulture)}, {textY.ToString("F1", CultureInfo.InvariantCulture)})\">");
                sb.AppendLine($"    <path d=\"{textResult.SvgPathData}\" fill=\"{color}\" />");
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
                RenderAbstractGeometry(sb, geomType, strokeWidth, markX, markOffsetY, markSize, color);

                var textTranslationX = textX - textResult.Left;
                sb.AppendLine($"  <g transform=\"translate({textTranslationX.ToString("F1", CultureInfo.InvariantCulture)}, {textOffsetY.ToString("F1", CultureInfo.InvariantCulture)})\">");
                sb.AppendLine($"    <path d=\"{textResult.SvgPathData}\" fill=\"{color}\" />");
                sb.AppendLine("  </g>");
                sb.AppendLine("</svg>");
            }

            return sb.ToString();
        }

        public string RenderSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null)
        {
            return RenderLockupSvg(parameters, brandName, colorHex);
        }

        private static void RenderAbstractGeometry(StringBuilder sb, string type, float strokeWidth, float x, float y, float size, string color)
        {
            var half = size * 0.5f;
            var cx = x + half;
            var cy = y + half;
            var r = half - strokeWidth;

            switch (type.ToLowerInvariant())
            {
                case "rotational_symmetry_3":
                    var rArc = half * 0.75f;
                    sb.AppendLine($"  <g transform=\"translate({cx.ToString("F1", CultureInfo.InvariantCulture)}, {cy.ToString("F1", CultureInfo.InvariantCulture)})\">");
                    for (int i = 0; i < 3; i++)
                    {
                        var angle = i * 120f;
                        sb.AppendLine($"    <path d=\"M 0,{(-rArc).ToString("F1", CultureInfo.InvariantCulture)} A {rArc.ToString("F1", CultureInfo.InvariantCulture)} {rArc.ToString("F1", CultureInfo.InvariantCulture)} 0 0 1 {(rArc * 0.866f).ToString("F1", CultureInfo.InvariantCulture)} {(-rArc * 0.5f).ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"none\" stroke=\"{color}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" stroke-linecap=\"round\" transform=\"rotate({angle.ToString("F0", CultureInfo.InvariantCulture)})\" />");
                    }
                    sb.AppendLine("  </g>");
                    break;

                case "rotational_symmetry_4":
                    var rArc4 = half * 0.75f;
                    sb.AppendLine($"  <g transform=\"translate({cx.ToString("F1", CultureInfo.InvariantCulture)}, {cy.ToString("F1", CultureInfo.InvariantCulture)})\">");
                    for (int i = 0; i < 4; i++)
                    {
                        var angle = i * 90f;
                        sb.AppendLine($"    <path d=\"M 0,{(-rArc4).ToString("F1", CultureInfo.InvariantCulture)} A {rArc4.ToString("F1", CultureInfo.InvariantCulture)} {rArc4.ToString("F1", CultureInfo.InvariantCulture)} 0 0 1 {rArc4.ToString("F1", CultureInfo.InvariantCulture)} 0\" fill=\"none\" stroke=\"{color}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" stroke-linecap=\"round\" transform=\"rotate({angle.ToString("F0", CultureInfo.InvariantCulture)})\" />");
                    }
                    sb.AppendLine("  </g>");
                    break;

                case "isometric_cube":
                    var s = size * 0.42f;
                    var dy = s * 0.577f;
                    sb.AppendLine($"  <polygon points=\"{cx.ToString("F1", CultureInfo.InvariantCulture)},{(cy - s).ToString("F1", CultureInfo.InvariantCulture)} {(cx + s * 0.866f).ToString("F1", CultureInfo.InvariantCulture)},{(cy - dy * 0.5f).ToString("F1", CultureInfo.InvariantCulture)} {cx.ToString("F1", CultureInfo.InvariantCulture)},{cy.ToString("F1", CultureInfo.InvariantCulture)} {(cx - s * 0.866f).ToString("F1", CultureInfo.InvariantCulture)},{(cy - dy * 0.5f).ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"{color}\" opacity=\"0.9\" />");
                    sb.AppendLine($"  <polygon points=\"{cx.ToString("F1", CultureInfo.InvariantCulture)},{cy.ToString("F1", CultureInfo.InvariantCulture)} {(cx + s * 0.866f).ToString("F1", CultureInfo.InvariantCulture)},{(cy - dy * 0.5f).ToString("F1", CultureInfo.InvariantCulture)} {(cx + s * 0.866f).ToString("F1", CultureInfo.InvariantCulture)},{(cy + dy * 0.5f).ToString("F1", CultureInfo.InvariantCulture)} {cx.ToString("F1", CultureInfo.InvariantCulture)},{(cy + s).ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"{color}\" opacity=\"0.7\" />");
                    sb.AppendLine($"  <polygon points=\"{cx.ToString("F1", CultureInfo.InvariantCulture)},{cy.ToString("F1", CultureInfo.InvariantCulture)} {(cx - s * 0.866f).ToString("F1", CultureInfo.InvariantCulture)},{(cy - dy * 0.5f).ToString("F1", CultureInfo.InvariantCulture)} {(cx - s * 0.866f).ToString("F1", CultureInfo.InvariantCulture)},{(cy + dy * 0.5f).ToString("F1", CultureInfo.InvariantCulture)} {cx.ToString("F1", CultureInfo.InvariantCulture)},{(cy + s).ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"{color}\" opacity=\"1.0\" />");
                    break;

                case "faceted_diamond":
                    var dw = size * 0.38f;
                    var dh = size * 0.48f;
                    sb.AppendLine($"  <polygon points=\"{cx.ToString("F1", CultureInfo.InvariantCulture)},{(cy - dh).ToString("F1", CultureInfo.InvariantCulture)} {(cx + dw).ToString("F1", CultureInfo.InvariantCulture)},{cy.ToString("F1", CultureInfo.InvariantCulture)} {cx.ToString("F1", CultureInfo.InvariantCulture)},{(cy + dh).ToString("F1", CultureInfo.InvariantCulture)} {(cx - dw).ToString("F1", CultureInfo.InvariantCulture)},{cy.ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"{color}\" />");
                    sb.AppendLine($"  <polygon points=\"{cx.ToString("F1", CultureInfo.InvariantCulture)},{(cy - dh * 0.55f).ToString("F1", CultureInfo.InvariantCulture)} {(cx + dw * 0.55f).ToString("F1", CultureInfo.InvariantCulture)},{cy.ToString("F1", CultureInfo.InvariantCulture)} {cx.ToString("F1", CultureInfo.InvariantCulture)},{(cy + dh * 0.55f).ToString("F1", CultureInfo.InvariantCulture)} {(cx - dw * 0.55f).ToString("F1", CultureInfo.InvariantCulture)},{cy.ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"#FFFFFF\" />");
                    break;

                default: // nested_polygons
                    sb.AppendLine($"  <rect x=\"{(cx - r * 0.8f).ToString("F1", CultureInfo.InvariantCulture)}\" y=\"{(cy - r * 0.8f).ToString("F1", CultureInfo.InvariantCulture)}\" width=\"{(r * 1.6f).ToString("F1", CultureInfo.InvariantCulture)}\" height=\"{(r * 1.6f).ToString("F1", CultureInfo.InvariantCulture)}\" rx=\"10\" fill=\"none\" stroke=\"{color}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" />");
                    sb.AppendLine($"  <rect x=\"{(cx - r * 0.4f).ToString("F1", CultureInfo.InvariantCulture)}\" y=\"{(cy - r * 0.4f).ToString("F1", CultureInfo.InvariantCulture)}\" width=\"{(r * 0.8f).ToString("F1", CultureInfo.InvariantCulture)}\" height=\"{(r * 0.8f).ToString("F1", CultureInfo.InvariantCulture)}\" rx=\"4\" fill=\"{color}\" />");
                    break;
            }
        }
    }
}
