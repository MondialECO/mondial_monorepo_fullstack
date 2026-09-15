using System.Globalization;
using System.Text;
using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Creator.BrandKit.LogoEngine
{
    public class SymbolPlusNameLogoRenderer : ILogoMarkRenderer
    {
        public string FamilyName => BrandLogoFamilyNames.SymbolPlusName;

        public string RenderMarkSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null)
        {
            var fill = colorHex ?? "#0F172A";
            var badgeShape = parameters?.Values?.GetValueOrDefault("BadgeShape") ?? "hexagon";
            var initial = !string.IsNullOrWhiteSpace(brandName) ? brandName.Trim()[0].ToString().ToUpperInvariant() : "B";

            var sb = new StringBuilder();
            sb.AppendLine("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" width=\"100%\" height=\"100%\">");
            RenderBadgeSymbol(sb, badgeShape, initial, 15f, 15f, 70f, fill);
            sb.AppendLine("</svg>");
            return sb.ToString();
        }

        public string RenderLockupSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null)
        {
            var fill = colorHex ?? "#0F172A";
            var badgeShape = parameters?.Values?.GetValueOrDefault("BadgeShape") ?? "hexagon";
            var fontCategory = parameters?.Values?.GetValueOrDefault("FontCategory") ?? "geometric_sans";
            var initial = !string.IsNullOrWhiteSpace(brandName) ? brandName.Trim()[0].ToString().ToUpperInvariant() : "B";

            var textResult = VectorTypographyRenderer.RenderTextToVectorPath(
                brandName,
                fontCategory,
                initialFontSize: 24f,
                letterSpacing: "normal",
                horizontalBudget: 260f,
                allowTwoLineStacking: true,
                letterCase: "uppercase");

            var badgeSize = 60f;
            var paddingLeft = 24f;
            var gap = 20f;
            var badgeX = paddingLeft;
            var textX = badgeX + badgeSize + gap;

            var paddingRight = 24f;
            var totalW = Math.Max(380f, textX + textResult.Width + paddingRight);
            var totalH = textResult.IsStacked ? 120f : 100f;

            var textOffsetY = totalH * 0.5f - (textResult.Top + textResult.Height * 0.5f);
            var badgeOffsetY = totalH * 0.5f - (badgeSize * 0.5f);

            var sb = new StringBuilder();
            sb.AppendLine($"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 {totalW.ToString("F0", CultureInfo.InvariantCulture)} {totalH.ToString("F0", CultureInfo.InvariantCulture)}\" width=\"100%\" height=\"100%\">");

            // Render Symbol
            RenderBadgeSymbol(sb, badgeShape, initial, badgeX, badgeOffsetY, badgeSize, fill);

            // Render Text
            var textTranslationX = textX - textResult.Left;
            sb.AppendLine($"  <g transform=\"translate({textTranslationX.ToString("F1", CultureInfo.InvariantCulture)}, {textOffsetY.ToString("F1", CultureInfo.InvariantCulture)})\">");
            sb.AppendLine($"    <path d=\"{textResult.SvgPathData}\" fill=\"{fill}\" />");
            sb.AppendLine("  </g>");
            sb.AppendLine("</svg>");
            return sb.ToString();
        }

        public string RenderSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null)
        {
            return RenderLockupSvg(parameters, brandName, colorHex);
        }

        private static void RenderBadgeSymbol(StringBuilder sb, string shape, string initial, float x, float y, float size, string fill)
        {
            var half = size * 0.5f;
            var cx = x + half;
            var cy = y + half;
            var strokeWidth = Math.Max(4f, size * 0.08f);

            switch (shape.ToLowerInvariant())
            {
                case "circle":
                    sb.AppendLine($"  <circle cx=\"{cx.ToString("F1", CultureInfo.InvariantCulture)}\" cy=\"{cy.ToString("F1", CultureInfo.InvariantCulture)}\" r=\"{(half - strokeWidth * 0.5f).ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"none\" stroke=\"{fill}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" />");
                    break;
                case "square":
                    sb.AppendLine($"  <rect x=\"{(x + strokeWidth * 0.5f).ToString("F1", CultureInfo.InvariantCulture)}\" y=\"{(y + strokeWidth * 0.5f).ToString("F1", CultureInfo.InvariantCulture)}\" width=\"{(size - strokeWidth).ToString("F1", CultureInfo.InvariantCulture)}\" height=\"{(size - strokeWidth).ToString("F1", CultureInfo.InvariantCulture)}\" rx=\"4\" fill=\"none\" stroke=\"{fill}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" />");
                    break;
                case "rounded_rect":
                    sb.AppendLine($"  <rect x=\"{(x + strokeWidth * 0.5f).ToString("F1", CultureInfo.InvariantCulture)}\" y=\"{(y + strokeWidth * 0.5f).ToString("F1", CultureInfo.InvariantCulture)}\" width=\"{(size - strokeWidth).ToString("F1", CultureInfo.InvariantCulture)}\" height=\"{(size - strokeWidth).ToString("F1", CultureInfo.InvariantCulture)}\" rx=\"12\" fill=\"none\" stroke=\"{fill}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" />");
                    break;
                case "shield":
                    var r = half - strokeWidth * 0.5f;
                    sb.AppendLine($"  <path d=\"M {cx.ToString("F1", CultureInfo.InvariantCulture)},{(cy - r).ToString("F1", CultureInfo.InvariantCulture)} L {(cx + r).ToString("F1", CultureInfo.InvariantCulture)},{(cy - r * 0.4f).ToString("F1", CultureInfo.InvariantCulture)} L {(cx + r * 0.7f).ToString("F1", CultureInfo.InvariantCulture)},{(cy + r * 0.6f).ToString("F1", CultureInfo.InvariantCulture)} L {cx.ToString("F1", CultureInfo.InvariantCulture)},{(cy + r).ToString("F1", CultureInfo.InvariantCulture)} L {(cx - r * 0.7f).ToString("F1", CultureInfo.InvariantCulture)},{(cy + r * 0.6f).ToString("F1", CultureInfo.InvariantCulture)} L {(cx - r * 0.7f).ToString("F1", CultureInfo.InvariantCulture)},{(cy - r * 0.4f).ToString("F1", CultureInfo.InvariantCulture)} Z\" fill=\"none\" stroke=\"{fill}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" />");
                    break;
                case "diamond":
                    sb.AppendLine($"  <polygon points=\"{cx.ToString("F1", CultureInfo.InvariantCulture)},{(y + strokeWidth).ToString("F1", CultureInfo.InvariantCulture)} {(x + size - strokeWidth).ToString("F1", CultureInfo.InvariantCulture)},{cy.ToString("F1", CultureInfo.InvariantCulture)} {cx.ToString("F1", CultureInfo.InvariantCulture)},{(y + size - strokeWidth).ToString("F1", CultureInfo.InvariantCulture)} {(x + strokeWidth).ToString("F1", CultureInfo.InvariantCulture)},{cy.ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"none\" stroke=\"{fill}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" />");
                    break;
                default: // Hexagon
                    var hR = half - strokeWidth * 0.5f;
                    var p1x = cx + hR * 0.866f; var p1y = cy - hR * 0.5f;
                    var p2x = cx + hR * 0.866f; var p2y = cy + hR * 0.5f;
                    var p3x = cx; var p3y = cy + hR;
                    var p4x = cx - hR * 0.866f; var p4y = cy + hR * 0.5f;
                    var p5x = cx - hR * 0.866f; var p5y = cy - hR * 0.5f;
                    var p6x = cx; var p6y = cy - hR;
                    sb.AppendLine($"  <polygon points=\"{p6x.ToString("F1", CultureInfo.InvariantCulture)},{p6y.ToString("F1", CultureInfo.InvariantCulture)} {p1x.ToString("F1", CultureInfo.InvariantCulture)},{p1y.ToString("F1", CultureInfo.InvariantCulture)} {p2x.ToString("F1", CultureInfo.InvariantCulture)},{p2y.ToString("F1", CultureInfo.InvariantCulture)} {p3x.ToString("F1", CultureInfo.InvariantCulture)},{p3y.ToString("F1", CultureInfo.InvariantCulture)} {p4x.ToString("F1", CultureInfo.InvariantCulture)},{p4y.ToString("F1", CultureInfo.InvariantCulture)} {p5x.ToString("F1", CultureInfo.InvariantCulture)},{p5y.ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"none\" stroke=\"{fill}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" />");
                    break;
            }

            var initialRes = VectorTypographyRenderer.RenderTextToVectorPath(
                initial,
                "geometric_sans",
                initialFontSize: size * 0.45f,
                letterSpacing: "normal",
                horizontalBudget: size * 0.6f,
                allowTwoLineStacking: false,
                letterCase: "uppercase");

            var initX = cx - (initialRes.Left + initialRes.Width * 0.5f);
            var initY = cy - (initialRes.Top + initialRes.Height * 0.5f);

            sb.AppendLine($"  <g transform=\"translate({initX.ToString("F1", CultureInfo.InvariantCulture)}, {initY.ToString("F1", CultureInfo.InvariantCulture)})\">");
            sb.AppendLine($"    <path d=\"{initialRes.SvgPathData}\" fill=\"{fill}\" />");
            sb.AppendLine("  </g>");
        }
    }
}
