using System.Globalization;
using System.Text;
using System.Security;
using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Creator.BrandKit.LogoEngine
{
    public class MonogramLogoRenderer : ILogoMarkRenderer
    {
        public string FamilyName => BrandLogoFamilyNames.Monogram;

        public string RenderMarkSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null)
        {
            var primaryColor = colorHex ?? parameters?.Values?.GetValueOrDefault("PrimaryColor") ?? "#0F172A";
            var accentColor = parameters?.Values?.GetValueOrDefault("AccentColor") ?? primaryColor;
            var fontCategory = parameters?.Values?.GetValueOrDefault("FontCategory") ?? "high_contrast_serif";
            var frameStyle = parameters?.Values?.GetValueOrDefault("FrameStyle") ?? "square_box";
            var strokeStyle = parameters?.Values?.GetValueOrDefault("StrokeStyle") ?? "heavy_block";
            var initials = ResolveInitials(brandName);
            var escapedName = SecurityElement.Escape(brandName ?? "Brand");

            var sb = new StringBuilder();
            sb.AppendLine($"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" width=\"100%\" height=\"100%\" role=\"img\" aria-label=\"{escapedName} Logo\">");
            sb.AppendLine($"  <title>{escapedName} Logo</title>");
            RenderMonogramBadge(sb, initials, fontCategory, frameStyle, strokeStyle, 15f, 15f, 70f, primaryColor, accentColor);
            sb.AppendLine("</svg>");
            return sb.ToString();
        }

        public string RenderLockupSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null)
        {
            var primaryColor = colorHex ?? parameters?.Values?.GetValueOrDefault("PrimaryColor") ?? "#0F172A";
            var accentColor = parameters?.Values?.GetValueOrDefault("AccentColor") ?? primaryColor;
            var fontCategory = parameters?.Values?.GetValueOrDefault("FontCategory") ?? "high_contrast_serif";
            var frameStyle = parameters?.Values?.GetValueOrDefault("FrameStyle") ?? "square_box";
            var strokeStyle = parameters?.Values?.GetValueOrDefault("StrokeStyle") ?? "heavy_block";
            var arrangement = parameters?.Values?.GetValueOrDefault("Arrangement") ?? "side_by_side";
            var initials = ResolveInitials(brandName);
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
                var badgeSize = 64f;
                var totalW = Math.Max(320f, textResult.Width + 48f);
                var totalH = 160f;

                var badgeX = (totalW - badgeSize) * 0.5f;
                var badgeY = 18f;

                var textX = (totalW - textResult.Width) * 0.5f - textResult.Left;
                var textY = 120f - (textResult.Top + textResult.Height * 0.5f);

                sb.AppendLine($"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 {totalW.ToString("F0", CultureInfo.InvariantCulture)} {totalH.ToString("F0", CultureInfo.InvariantCulture)}\" width=\"100%\" height=\"100%\" role=\"img\" aria-label=\"{escapedName} Logo\">");
                sb.AppendLine($"  <title>{escapedName} Logo</title>");
                RenderMonogramBadge(sb, initials, fontCategory, frameStyle, strokeStyle, badgeX, badgeY, badgeSize, primaryColor, accentColor);

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

                RenderMonogramBadge(sb, initials, fontCategory, frameStyle, strokeStyle, badgeX, badgeOffsetY, badgeSize, primaryColor, accentColor);

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

        private static string ResolveInitials(string brandName)
        {
            if (string.IsNullOrWhiteSpace(brandName)) return "B";
            var trimmed = brandName.Trim();

            // Check multi-word split e.g. "Auto Invoice" -> "AI", "Aura Botanica" -> "AB"
            var parts = trimmed.Split(new[] { ' ', '-', '_' }, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length >= 2)
            {
                return $"{parts[0][0]}{parts[1][0]}".ToUpperInvariant();
            }

            // CamelCase split e.g. "AutoInvoice" -> "AI", "CyberLock" -> "CL"
            var uppers = trimmed.Where(char.IsUpper).ToList();
            if (uppers.Count >= 2)
            {
                return $"{uppers[0]}{uppers[1]}";
            }

            return trimmed.Length >= 2 ? trimmed.Substring(0, 2).ToUpperInvariant() : trimmed[0].ToString().ToUpperInvariant();
        }

        private static void RenderMonogramBadge(
            StringBuilder sb,
            string initials,
            string fontCategory,
            string frameStyle,
            string strokeStyle,
            float x,
            float y,
            float size,
            string primaryColor,
            string accentColor)
        {
            var strokeWidth = Math.Max(3f, size * 0.07f);
            var cx = x + size * 0.5f;
            var cy = y + size * 0.5f;
            var isDuoTone = !string.Equals(primaryColor, accentColor, StringComparison.OrdinalIgnoreCase);
            var frameColor = isDuoTone ? accentColor : primaryColor;

            // 1. Render Architectural Monogram Frame
            switch (frameStyle.ToLowerInvariant())
            {
                case "circle_ring":
                    var cR = size * 0.5f - strokeWidth * 0.5f;
                    sb.AppendLine($"  <circle cx=\"{cx.ToString("F1", CultureInfo.InvariantCulture)}\" cy=\"{cy.ToString("F1", CultureInfo.InvariantCulture)}\" r=\"{cR.ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"none\" stroke=\"{frameColor}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" />");
                    break;

                case "square_box":
                    var sq = size - strokeWidth;
                    sb.AppendLine($"  <rect x=\"{(x + strokeWidth * 0.5f).ToString("F1", CultureInfo.InvariantCulture)}\" y=\"{(y + strokeWidth * 0.5f).ToString("F1", CultureInfo.InvariantCulture)}\" width=\"{sq.ToString("F1", CultureInfo.InvariantCulture)}\" height=\"{sq.ToString("F1", CultureInfo.InvariantCulture)}\" rx=\"4\" fill=\"none\" stroke=\"{frameColor}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" />");
                    break;

                case "bracket_corners":
                    var bl = size * 0.28f;
                    var bsw = strokeWidth * 1.15f;
                    // Top-Left
                    sb.AppendLine($"  <path d=\"M {x.ToString("F1", CultureInfo.InvariantCulture)},{(y + bl).ToString("F1", CultureInfo.InvariantCulture)} L {x.ToString("F1", CultureInfo.InvariantCulture)},{y.ToString("F1", CultureInfo.InvariantCulture)} L {(x + bl).ToString("F1", CultureInfo.InvariantCulture)},{y.ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"none\" stroke=\"{frameColor}\" stroke-width=\"{bsw.ToString("F1", CultureInfo.InvariantCulture)}\" stroke-linecap=\"square\" />");
                    // Top-Right
                    sb.AppendLine($"  <path d=\"M {(x + size - bl).ToString("F1", CultureInfo.InvariantCulture)},{y.ToString("F1", CultureInfo.InvariantCulture)} L {(x + size).ToString("F1", CultureInfo.InvariantCulture)},{y.ToString("F1", CultureInfo.InvariantCulture)} L {(x + size).ToString("F1", CultureInfo.InvariantCulture)},{(y + bl).ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"none\" stroke=\"{frameColor}\" stroke-width=\"{bsw.ToString("F1", CultureInfo.InvariantCulture)}\" stroke-linecap=\"square\" />");
                    // Bottom-Right
                    sb.AppendLine($"  <path d=\"M {(x + size).ToString("F1", CultureInfo.InvariantCulture)},{(y + size - bl).ToString("F1", CultureInfo.InvariantCulture)} L {(x + size).ToString("F1", CultureInfo.InvariantCulture)},{(y + size).ToString("F1", CultureInfo.InvariantCulture)} L {(x + size - bl).ToString("F1", CultureInfo.InvariantCulture)},{(y + size).ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"none\" stroke=\"{frameColor}\" stroke-width=\"{bsw.ToString("F1", CultureInfo.InvariantCulture)}\" stroke-linecap=\"square\" />");
                    // Bottom-Left
                    sb.AppendLine($"  <path d=\"M {(x + bl).ToString("F1", CultureInfo.InvariantCulture)},{(y + size).ToString("F1", CultureInfo.InvariantCulture)} L {x.ToString("F1", CultureInfo.InvariantCulture)},{(y + size).ToString("F1", CultureInfo.InvariantCulture)} L {x.ToString("F1", CultureInfo.InvariantCulture)},{(y + size - bl).ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"none\" stroke=\"{frameColor}\" stroke-width=\"{bsw.ToString("F1", CultureInfo.InvariantCulture)}\" stroke-linecap=\"square\" />");
                    break;

                case "solid_disc":
                    var sR = size * 0.5f - 1f;
                    sb.AppendLine($"  <circle cx=\"{cx.ToString("F1", CultureInfo.InvariantCulture)}\" cy=\"{cy.ToString("F1", CultureInfo.InvariantCulture)}\" r=\"{sR.ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"{primaryColor}\" />");
                    break;

                case "chamfer_box":
                    var ch = size * 0.18f;
                    var bx2 = x + size;
                    var by2 = y + size;
                    sb.AppendLine($"  <polygon points=\"{(x + ch).ToString("F1", CultureInfo.InvariantCulture)},{y.ToString("F1", CultureInfo.InvariantCulture)} {(bx2 - ch).ToString("F1", CultureInfo.InvariantCulture)},{y.ToString("F1", CultureInfo.InvariantCulture)} {bx2.ToString("F1", CultureInfo.InvariantCulture)},{(y + ch).ToString("F1", CultureInfo.InvariantCulture)} {bx2.ToString("F1", CultureInfo.InvariantCulture)},{(by2 - ch).ToString("F1", CultureInfo.InvariantCulture)} {(bx2 - ch).ToString("F1", CultureInfo.InvariantCulture)},{by2.ToString("F1", CultureInfo.InvariantCulture)} {(x + ch).ToString("F1", CultureInfo.InvariantCulture)},{by2.ToString("F1", CultureInfo.InvariantCulture)} {x.ToString("F1", CultureInfo.InvariantCulture)},{(by2 - ch).ToString("F1", CultureInfo.InvariantCulture)} {x.ToString("F1", CultureInfo.InvariantCulture)},{(y + ch).ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"none\" stroke=\"{frameColor}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" />");
                    break;

                default: // none
                    break;
            }

            // 2. Render Balanced Monogram Letterform
            var isDisc = frameStyle == "solid_disc";
            var letterColor = isDisc ? "#FFFFFF" : primaryColor;
            var isDual = initials.Length >= 2;
            var fontSize = isDual ? size * 0.40f : size * 0.52f;
            var letterBudget = size * (isDual ? 0.74f : 0.60f);

            var textRes = VectorTypographyRenderer.RenderTextToVectorPath(
                initials,
                fontCategory,
                initialFontSize: fontSize,
                letterSpacing: isDual ? "tight" : "normal",
                horizontalBudget: letterBudget,
                allowTwoLineStacking: false,
                letterCase: "uppercase");

            var tx = cx - (textRes.Left + textRes.Width * 0.5f);
            var ty = cy - (textRes.Top + textRes.Height * 0.5f);

            sb.AppendLine($"  <g transform=\"translate({tx.ToString("F1", CultureInfo.InvariantCulture)}, {ty.ToString("F1", CultureInfo.InvariantCulture)})\">");
            sb.AppendLine($"    <path d=\"{textRes.SvgPathData}\" fill=\"{letterColor}\" />");
            sb.AppendLine("  </g>");
        }
    }
}
