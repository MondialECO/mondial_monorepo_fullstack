using System.Globalization;
using System.Text;
using System.Security;
using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Creator.BrandKit.LogoEngine
{
    public class SymbolPlusNameLogoRenderer : ILogoMarkRenderer
    {
        public string FamilyName => BrandLogoFamilyNames.SymbolPlusName;

        public string RenderMarkSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null)
        {
            var primaryColor = colorHex ?? parameters?.Values?.GetValueOrDefault("PrimaryColor") ?? "#0F172A";
            var accentColor = parameters?.Values?.GetValueOrDefault("AccentColor") ?? primaryColor;
            var badgeShape = parameters?.Values?.GetValueOrDefault("BadgeShape") ?? "hexagon";
            var badgeStyle = parameters?.Values?.GetValueOrDefault("BadgeStyle") ?? "outline_stroke";
            var glyphMode = parameters?.Values?.GetValueOrDefault("InternalGlyph") ?? "initial_letter";
            var fontCategory = parameters?.Values?.GetValueOrDefault("FontCategory") ?? "geometric_sans";

            var initials = ResolveInitials(brandName, glyphMode == "dual_initial");
            var escapedName = SecurityElement.Escape(brandName ?? "Brand");

            var sb = new StringBuilder();
            sb.AppendLine($"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" width=\"100%\" height=\"100%\" role=\"img\" aria-label=\"{escapedName} Logo\">");
            sb.AppendLine($"  <title>{escapedName} Logo</title>");
            RenderBadgeSymbol(sb, badgeShape, badgeStyle, initials, fontCategory, 15f, 15f, 70f, primaryColor, accentColor);
            sb.AppendLine("</svg>");
            return sb.ToString();
        }

        public string RenderLockupSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null)
        {
            var primaryColor = colorHex ?? parameters?.Values?.GetValueOrDefault("PrimaryColor") ?? "#0F172A";
            var accentColor = parameters?.Values?.GetValueOrDefault("AccentColor") ?? primaryColor;
            var badgeShape = parameters?.Values?.GetValueOrDefault("BadgeShape") ?? "hexagon";
            var badgeStyle = parameters?.Values?.GetValueOrDefault("BadgeStyle") ?? "outline_stroke";
            var glyphMode = parameters?.Values?.GetValueOrDefault("InternalGlyph") ?? "initial_letter";
            var fontCategory = parameters?.Values?.GetValueOrDefault("FontCategory") ?? "geometric_sans";
            var arrangement = parameters?.Values?.GetValueOrDefault("Arrangement") ?? "side_by_side";

            var initials = ResolveInitials(brandName, glyphMode == "dual_initial");
            var escapedName = SecurityElement.Escape(brandName ?? "Brand");

            var isStacked = string.Equals(arrangement, "stacked", StringComparison.OrdinalIgnoreCase);

            var textResult = VectorTypographyRenderer.RenderTextToVectorPath(
                brandName,
                fontCategory,
                initialFontSize: isStacked ? 22f : 24f,
                letterSpacing: "normal",
                horizontalBudget: isStacked ? 300f : 260f,
                allowTwoLineStacking: true,
                letterCase: "uppercase");

            var sb = new StringBuilder();

            if (isStacked)
            {
                var badgeSize = 64f;
                var totalW = Math.Max(320f, textResult.Width + 48f);
                var totalH = 160f;

                var badgeX = (totalW - badgeSize) * 0.5f;
                var badgeY = 18f;

                var textX = (totalW - textResult.Width) * 0.5f - textResult.Left;
                var textY = 120f - (textResult.Top + textResult.Height * 0.5f);

                sb.AppendLine($"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 {totalW.ToString("F0", CultureInfo.InvariantCulture)} {totalH.ToString("F0", CultureInfo.InvariantCulture)}\" width=\"100%\" height=\"100%\" role=\"img\" aria-label=\"{escapedName} Logo\">");
                sb.AppendLine($"  <title>{escapedName} Logo</title>");
                RenderBadgeSymbol(sb, badgeShape, badgeStyle, initials, fontCategory, badgeX, badgeY, badgeSize, primaryColor, accentColor);

                sb.AppendLine($"  <g transform=\"translate({textX.ToString("F1", CultureInfo.InvariantCulture)}, {textY.ToString("F1", CultureInfo.InvariantCulture)})\">");
                sb.AppendLine($"    <path d=\"{textResult.SvgPathData}\" fill=\"{primaryColor}\" />");
                sb.AppendLine("  </g>");
                sb.AppendLine("</svg>");
            }
            else
            {
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

                sb.AppendLine($"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 {totalW.ToString("F0", CultureInfo.InvariantCulture)} {totalH.ToString("F0", CultureInfo.InvariantCulture)}\" width=\"100%\" height=\"100%\" role=\"img\" aria-label=\"{escapedName} Logo\">");
                sb.AppendLine($"  <title>{escapedName} Logo</title>");
                RenderBadgeSymbol(sb, badgeShape, badgeStyle, initials, fontCategory, badgeX, badgeOffsetY, badgeSize, primaryColor, accentColor);

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

        private static string ResolveInitials(string brandName, bool preferDual)
        {
            if (string.IsNullOrWhiteSpace(brandName)) return "B";
            var trimmed = brandName.Trim();

            if (!preferDual)
            {
                return trimmed[0].ToString().ToUpperInvariant();
            }

            var parts = trimmed.Split(new[] { ' ', '-', '_' }, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length >= 2)
            {
                return $"{parts[0][0]}{parts[1][0]}".ToUpperInvariant();
            }

            var uppers = trimmed.Where(char.IsUpper).ToList();
            if (uppers.Count >= 2)
            {
                return $"{uppers[0]}{uppers[1]}";
            }

            return trimmed.Length >= 2 ? trimmed.Substring(0, 2).ToUpperInvariant() : trimmed[0].ToString().ToUpperInvariant();
        }

        private static void RenderBadgeSymbol(
            StringBuilder sb,
            string shape,
            string style,
            string initials,
            string fontCategory,
            float x,
            float y,
            float size,
            string primaryColor,
            string accentColor)
        {
            var half = size * 0.5f;
            var cx = x + half;
            var cy = y + half;
            var strokeWidth = Math.Max(3.5f, size * 0.075f);
            var isDuoTone = style == "duo_tone" || !string.Equals(primaryColor, accentColor, StringComparison.OrdinalIgnoreCase);

            var outerColor = isDuoTone ? accentColor : primaryColor;
            var innerColor = primaryColor;

            // 1. Render Outer Badge Geometry
            switch (shape.ToLowerInvariant())
            {
                case "circle":
                    var cR = half - strokeWidth * 0.5f;
                    if (style == "solid_fill")
                    {
                        sb.AppendLine($"  <circle cx=\"{cx.ToString("F1", CultureInfo.InvariantCulture)}\" cy=\"{cy.ToString("F1", CultureInfo.InvariantCulture)}\" r=\"{cR.ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"{outerColor}\" fill-opacity=\"0.12\" stroke=\"{outerColor}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" />");
                    }
                    else if (style == "double_stroke")
                    {
                        sb.AppendLine($"  <circle cx=\"{cx.ToString("F1", CultureInfo.InvariantCulture)}\" cy=\"{cy.ToString("F1", CultureInfo.InvariantCulture)}\" r=\"{cR.ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"none\" stroke=\"{outerColor}\" stroke-width=\"{(strokeWidth * 0.6f).ToString("F1", CultureInfo.InvariantCulture)}\" />");
                        sb.AppendLine($"  <circle cx=\"{cx.ToString("F1", CultureInfo.InvariantCulture)}\" cy=\"{cy.ToString("F1", CultureInfo.InvariantCulture)}\" r=\"{(cR - 5f).ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"none\" stroke=\"{outerColor}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" />");
                    }
                    else
                    {
                        sb.AppendLine($"  <circle cx=\"{cx.ToString("F1", CultureInfo.InvariantCulture)}\" cy=\"{cy.ToString("F1", CultureInfo.InvariantCulture)}\" r=\"{cR.ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"none\" stroke=\"{outerColor}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" />");
                    }
                    break;

                case "square":
                    var sqSize = size - strokeWidth;
                    sb.AppendLine($"  <rect x=\"{(x + strokeWidth * 0.5f).ToString("F1", CultureInfo.InvariantCulture)}\" y=\"{(y + strokeWidth * 0.5f).ToString("F1", CultureInfo.InvariantCulture)}\" width=\"{sqSize.ToString("F1", CultureInfo.InvariantCulture)}\" height=\"{sqSize.ToString("F1", CultureInfo.InvariantCulture)}\" rx=\"6\" fill=\"none\" stroke=\"{outerColor}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" />");
                    break;

                case "rounded_rect":
                case "cut_corner_rect":
                    var rrSize = size - strokeWidth;
                    var rx = shape == "cut_corner_rect" ? 14 : 12;
                    sb.AppendLine($"  <rect x=\"{(x + strokeWidth * 0.5f).ToString("F1", CultureInfo.InvariantCulture)}\" y=\"{(y + strokeWidth * 0.5f).ToString("F1", CultureInfo.InvariantCulture)}\" width=\"{rrSize.ToString("F1", CultureInfo.InvariantCulture)}\" height=\"{rrSize.ToString("F1", CultureInfo.InvariantCulture)}\" rx=\"{rx}\" fill=\"none\" stroke=\"{outerColor}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" />");
                    break;

                case "shield":
                    var sR = half - strokeWidth * 0.5f;
                    sb.AppendLine($"  <path d=\"M {cx.ToString("F1", CultureInfo.InvariantCulture)},{(cy - sR).ToString("F1", CultureInfo.InvariantCulture)} L {(cx + sR).ToString("F1", CultureInfo.InvariantCulture)},{(cy - sR * 0.35f).ToString("F1", CultureInfo.InvariantCulture)} L {(cx + sR * 0.75f).ToString("F1", CultureInfo.InvariantCulture)},{(cy + sR * 0.65f).ToString("F1", CultureInfo.InvariantCulture)} L {cx.ToString("F1", CultureInfo.InvariantCulture)},{(cy + sR).ToString("F1", CultureInfo.InvariantCulture)} L {(cx - sR * 0.75f).ToString("F1", CultureInfo.InvariantCulture)},{(cy + sR * 0.65f).ToString("F1", CultureInfo.InvariantCulture)} L {(cx - sR).ToString("F1", CultureInfo.InvariantCulture)},{(cy - sR * 0.35f).ToString("F1", CultureInfo.InvariantCulture)} Z\" fill=\"none\" stroke=\"{outerColor}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" stroke-linejoin=\"round\" />");
                    break;

                case "diamond":
                    sb.AppendLine($"  <polygon points=\"{cx.ToString("F1", CultureInfo.InvariantCulture)},{(y + strokeWidth).ToString("F1", CultureInfo.InvariantCulture)} {(x + size - strokeWidth).ToString("F1", CultureInfo.InvariantCulture)},{cy.ToString("F1", CultureInfo.InvariantCulture)} {cx.ToString("F1", CultureInfo.InvariantCulture)},{(y + size - strokeWidth).ToString("F1", CultureInfo.InvariantCulture)} {(x + strokeWidth).ToString("F1", CultureInfo.InvariantCulture)},{cy.ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"none\" stroke=\"{outerColor}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" stroke-linejoin=\"round\" />");
                    break;

                default: // Hexagon
                    var hR = half - strokeWidth * 0.5f;
                    var p1x = cx + hR * 0.866f; var p1y = cy - hR * 0.5f;
                    var p2x = cx + hR * 0.866f; var p2y = cy + hR * 0.5f;
                    var p3x = cx; var p3y = cy + hR;
                    var p4x = cx - hR * 0.866f; var p4y = cy + hR * 0.5f;
                    var p5x = cx - hR * 0.866f; var p5y = cy - hR * 0.5f;
                    var p6x = cx; var p6y = cy - hR;
                    sb.AppendLine($"  <polygon points=\"{p6x.ToString("F1", CultureInfo.InvariantCulture)},{p6y.ToString("F1", CultureInfo.InvariantCulture)} {p1x.ToString("F1", CultureInfo.InvariantCulture)},{p1y.ToString("F1", CultureInfo.InvariantCulture)} {p2x.ToString("F1", CultureInfo.InvariantCulture)},{p2y.ToString("F1", CultureInfo.InvariantCulture)} {p3x.ToString("F1", CultureInfo.InvariantCulture)},{p3y.ToString("F1", CultureInfo.InvariantCulture)} {p4x.ToString("F1", CultureInfo.InvariantCulture)},{p4y.ToString("F1", CultureInfo.InvariantCulture)} {p5x.ToString("F1", CultureInfo.InvariantCulture)},{p5y.ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"none\" stroke=\"{outerColor}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" stroke-linejoin=\"round\" />");
                    break;
            }

            // 2. Render High-Contrast Initial Letter / Ligature
            var isDual = initials.Length >= 2;
            var fontSize = isDual ? size * 0.38f : size * 0.48f;
            var letterBudget = size * (isDual ? 0.72f : 0.6f);

            var initialRes = VectorTypographyRenderer.RenderTextToVectorPath(
                initials,
                fontCategory,
                initialFontSize: fontSize,
                letterSpacing: isDual ? "tight" : "normal",
                horizontalBudget: letterBudget,
                allowTwoLineStacking: false,
                letterCase: "uppercase");

            var initX = cx - (initialRes.Left + initialRes.Width * 0.5f);
            var initY = cy - (initialRes.Top + initialRes.Height * 0.5f);

            sb.AppendLine($"  <g transform=\"translate({initX.ToString("F1", CultureInfo.InvariantCulture)}, {initY.ToString("F1", CultureInfo.InvariantCulture)})\">");
            sb.AppendLine($"    <path d=\"{initialRes.SvgPathData}\" fill=\"{innerColor}\" />");
            sb.AppendLine("  </g>");
        }
    }
}
