using System.Globalization;
using System.Text;
using System.Security;
using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Creator.BrandKit.LogoEngine
{
    public class MinimalLogoRenderer : ILogoMarkRenderer
    {
        public string FamilyName => BrandLogoFamilyNames.Minimal;

        public string RenderMarkSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null)
        {
            var color = colorHex ?? "#0F172A";
            var primitive = parameters?.Values?.GetValueOrDefault("Primitive") ?? "sliced_circle";
            var orientation = parameters?.Values?.GetValueOrDefault("Orientation") ?? "0_deg";
            var balance = parameters?.Values?.GetValueOrDefault("WeightBalance") ?? "monolithic_solid";
            var escapedName = SecurityElement.Escape(brandName ?? "Brand");

            var sb = new StringBuilder();
            sb.AppendLine($"<svg viewBox=\"0 0 100 100\" width=\"100%\" height=\"100%\" xmlns=\"http://www.w3.org/2000/svg\" role=\"img\" aria-label=\"{escapedName} Logo\">");
            sb.AppendLine($"  <title>{escapedName} Logo</title>");
            RenderMinimalPrimitive(sb, primitive, orientation, balance, 15f, 15f, 70f, color);
            sb.AppendLine("</svg>");
            return sb.ToString();
        }

        public string RenderLockupSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null)
        {
            var color = colorHex ?? "#0F172A";
            var primitive = parameters?.Values?.GetValueOrDefault("Primitive") ?? "sliced_circle";
            var orientation = parameters?.Values?.GetValueOrDefault("Orientation") ?? "0_deg";
            var balance = parameters?.Values?.GetValueOrDefault("WeightBalance") ?? "monolithic_solid";
            var fontCategory = parameters?.Values?.GetValueOrDefault("FontCategory") ?? "geometric_sans";
            var arrangement = parameters?.Values?.GetValueOrDefault("Arrangement") ?? "side_by_side";
            var escapedName = SecurityElement.Escape(brandName ?? "Brand");

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
                RenderMinimalPrimitive(sb, primitive, orientation, balance, markX, markY, markSize, color);

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

                RenderMinimalPrimitive(sb, primitive, orientation, balance, markX, markOffsetY, markSize, color);

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

        private static void RenderMinimalPrimitive(StringBuilder sb, string primitive, string orientation, string balance, float x, float y, float size, string color)
        {
            var half = size * 0.5f;
            var cx = x + half;
            var cy = y + half;
            var r = half * 0.9f;

            switch (primitive.ToLowerInvariant())
            {
                case "hairline_cross":
                    var barW = size * 0.18f;
                    var armL = size * 0.8f;
                    sb.AppendLine($"  <rect x=\"{(cx - barW * 0.5f).ToString("F1", CultureInfo.InvariantCulture)}\" y=\"{(cy - armL * 0.5f).ToString("F1", CultureInfo.InvariantCulture)}\" width=\"{barW.ToString("F1", CultureInfo.InvariantCulture)}\" height=\"{armL.ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"{color}\" rx=\"3\" />");
                    sb.AppendLine($"  <rect x=\"{(cx - armL * 0.5f).ToString("F1", CultureInfo.InvariantCulture)}\" y=\"{(cy - barW * 0.5f).ToString("F1", CultureInfo.InvariantCulture)}\" width=\"{armL.ToString("F1", CultureInfo.InvariantCulture)}\" height=\"{barW.ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"{color}\" rx=\"3\" />");
                    break;

                case "sliced_circle":
                    var dR = r * 0.9f;
                    sb.AppendLine($"  <path d=\"M {(cx - dR).ToString("F1", CultureInfo.InvariantCulture)},{(cy - 3f).ToString("F1", CultureInfo.InvariantCulture)} A {dR.ToString("F1", CultureInfo.InvariantCulture)} {dR.ToString("F1", CultureInfo.InvariantCulture)} 0 0 1 {(cx + dR).ToString("F1", CultureInfo.InvariantCulture)},{(cy - 3f).ToString("F1", CultureInfo.InvariantCulture)} Z\" fill=\"{color}\" />");
                    sb.AppendLine($"  <path d=\"M {(cx - dR).ToString("F1", CultureInfo.InvariantCulture)},{(cy + 3f).ToString("F1", CultureInfo.InvariantCulture)} A {dR.ToString("F1", CultureInfo.InvariantCulture)} {dR.ToString("F1", CultureInfo.InvariantCulture)} 0 0 0 {(cx + dR).ToString("F1", CultureInfo.InvariantCulture)},{(cy + 3f).ToString("F1", CultureInfo.InvariantCulture)} Z\" fill=\"{color}\" />");
                    break;

                case "offset_bars":
                    var bw = size * 0.18f;
                    var gap = size * 0.12f;
                    var b1X = cx - bw - gap;
                    var b2X = cx - bw * 0.5f;
                    var b3X = cx + gap;

                    sb.AppendLine($"  <rect x=\"{b1X.ToString("F1", CultureInfo.InvariantCulture)}\" y=\"{(cy - size * 0.1f).ToString("F1", CultureInfo.InvariantCulture)}\" width=\"{bw.ToString("F1", CultureInfo.InvariantCulture)}\" height=\"{(size * 0.45f).ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"{color}\" rx=\"4\" />");
                    sb.AppendLine($"  <rect x=\"{b2X.ToString("F1", CultureInfo.InvariantCulture)}\" y=\"{(cy - size * 0.35f).ToString("F1", CultureInfo.InvariantCulture)}\" width=\"{bw.ToString("F1", CultureInfo.InvariantCulture)}\" height=\"{(size * 0.7f).ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"{color}\" rx=\"4\" />");
                    sb.AppendLine($"  <rect x=\"{b3X.ToString("F1", CultureInfo.InvariantCulture)}\" y=\"{(cy - size * 0.22f).ToString("F1", CultureInfo.InvariantCulture)}\" width=\"{bw.ToString("F1", CultureInfo.InvariantCulture)}\" height=\"{(size * 0.57f).ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"{color}\" rx=\"4\" />");
                    break;

                case "diagonal_slash":
                    sb.AppendLine($"  <polygon points=\"{(cx - half * 0.8f).ToString("F1", CultureInfo.InvariantCulture)},{(cy + half * 0.8f).ToString("F1", CultureInfo.InvariantCulture)} {(cx - half * 0.3f).ToString("F1", CultureInfo.InvariantCulture)},{(cy + half * 0.8f).ToString("F1", CultureInfo.InvariantCulture)} {(cx + half * 0.8f).ToString("F1", CultureInfo.InvariantCulture)},{(cy - half * 0.8f).ToString("F1", CultureInfo.InvariantCulture)} {(cx + half * 0.3f).ToString("F1", CultureInfo.InvariantCulture)},{(cy - half * 0.8f).ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"{color}\" />");
                    break;

                default: // quadrant_arc
                    var qR = size * 0.7f;
                    sb.AppendLine($"  <path d=\"M {(cx - qR * 0.4f).ToString("F1", CultureInfo.InvariantCulture)},{(cy + qR * 0.4f).ToString("F1", CultureInfo.InvariantCulture)} L {(cx - qR * 0.4f).ToString("F1", CultureInfo.InvariantCulture)},{(cy - qR * 0.4f).ToString("F1", CultureInfo.InvariantCulture)} A {qR.ToString("F1", CultureInfo.InvariantCulture)} {qR.ToString("F1", CultureInfo.InvariantCulture)} 0 0 1 {(cx + qR * 0.4f).ToString("F1", CultureInfo.InvariantCulture)},{(cy + qR * 0.4f).ToString("F1", CultureInfo.InvariantCulture)} Z\" fill=\"{color}\" />");
                    break;
            }
        }
    }
}
