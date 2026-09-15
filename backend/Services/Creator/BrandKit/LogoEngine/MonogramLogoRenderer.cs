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
            var fill = colorHex ?? "#0F172A";
            var fontCategory = parameters?.Values?.GetValueOrDefault("FontCategory") ?? "high_contrast_serif";
            var frameStyle = parameters?.Values?.GetValueOrDefault("FrameStyle") ?? "square_box";
            var initials = ResolveInitials(brandName);
            var escapedName = SecurityElement.Escape(brandName ?? "Brand");

            var sb = new StringBuilder();
            sb.AppendLine($"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" width=\"100%\" height=\"100%\" role=\"img\" aria-label=\"{escapedName} Logo\">");
            sb.AppendLine($"  <title>{escapedName} Logo</title>");
            RenderMonogramBadge(sb, initials, fontCategory, frameStyle, 15f, 15f, 70f, fill);
            sb.AppendLine("</svg>");
            return sb.ToString();
        }

        public string RenderLockupSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null)
        {
            var fill = colorHex ?? "#0F172A";
            var fontCategory = parameters?.Values?.GetValueOrDefault("FontCategory") ?? "high_contrast_serif";
            var frameStyle = parameters?.Values?.GetValueOrDefault("FrameStyle") ?? "square_box";
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
                RenderMonogramBadge(sb, initials, fontCategory, frameStyle, badgeX, badgeY, badgeSize, fill);

                sb.AppendLine($"  <g transform=\"translate({textX.ToString("F1", CultureInfo.InvariantCulture)}, {textY.ToString("F1", CultureInfo.InvariantCulture)})\">");
                sb.AppendLine($"    <path d=\"{textResult.SvgPathData}\" fill=\"{fill}\" />");
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

                RenderMonogramBadge(sb, initials, fontCategory, frameStyle, badgeX, badgeOffsetY, badgeSize, fill);

                var textTranslationX = textX - textResult.Left;
                sb.AppendLine($"  <g transform=\"translate({textTranslationX.ToString("F1", CultureInfo.InvariantCulture)}, {textOffsetY.ToString("F1", CultureInfo.InvariantCulture)})\">");
                sb.AppendLine($"    <path d=\"{textResult.SvgPathData}\" fill=\"{fill}\" />");
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

            // Short name (<= 4 chars, e.g. Onyx) -> hero single initial
            if (trimmed.Length <= 4 && !trimmed.Contains(' '))
            {
                return trimmed[0].ToString().ToUpperInvariant();
            }

            var parts = trimmed.Split(new[] { ' ', '-', '_' }, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length >= 2)
            {
                return $"{parts[0][0]}{parts[1][0]}".ToUpperInvariant();
            }

            // CamelCase split e.g. CyberLock -> C L
            var uppers = trimmed.Where(char.IsUpper).ToList();
            if (uppers.Count >= 2)
            {
                return $"{uppers[0]}{uppers[1]}";
            }

            return trimmed.Length >= 2 ? trimmed.Substring(0, 2).ToUpperInvariant() : trimmed[0].ToString().ToUpperInvariant();
        }

        private static void RenderMonogramBadge(StringBuilder sb, string initials, string fontCategory, string frameStyle, float x, float y, float size, string fill)
        {
            var strokeWidth = Math.Max(4f, size * 0.08f);
            var cx = x + size * 0.5f;
            var cy = y + size * 0.5f;

            switch (frameStyle.ToLowerInvariant())
            {
                case "circle_ring":
                    sb.AppendLine($"  <circle cx=\"{cx.ToString("F1", CultureInfo.InvariantCulture)}\" cy=\"{cy.ToString("F1", CultureInfo.InvariantCulture)}\" r=\"{(size * 0.5f - strokeWidth * 0.5f).ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"none\" stroke=\"{fill}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" />");
                    break;
                case "bracket_corners":
                    var arm = size * 0.28f;
                    var bx = x + strokeWidth * 0.5f;
                    var by = y + strokeWidth * 0.5f;
                    var bw = size - strokeWidth;
                    var bh = size - strokeWidth;
                    // Top-Left
                    sb.AppendLine($"  <path d=\"M {bx.ToString("F1", CultureInfo.InvariantCulture)},{(by + arm).ToString("F1", CultureInfo.InvariantCulture)} L {bx.ToString("F1", CultureInfo.InvariantCulture)},{by.ToString("F1", CultureInfo.InvariantCulture)} L {(bx + arm).ToString("F1", CultureInfo.InvariantCulture)},{by.ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"none\" stroke=\"{fill}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" />");
                    // Top-Right
                    sb.AppendLine($"  <path d=\"M {(bx + bw - arm).ToString("F1", CultureInfo.InvariantCulture)},{by.ToString("F1", CultureInfo.InvariantCulture)} L {(bx + bw).ToString("F1", CultureInfo.InvariantCulture)},{by.ToString("F1", CultureInfo.InvariantCulture)} L {(bx + bw).ToString("F1", CultureInfo.InvariantCulture)},{(by + arm).ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"none\" stroke=\"{fill}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" />");
                    // Bottom-Right
                    sb.AppendLine($"  <path d=\"M {(bx + bw).ToString("F1", CultureInfo.InvariantCulture)},{(by + bh - arm).ToString("F1", CultureInfo.InvariantCulture)} L {(bx + bw).ToString("F1", CultureInfo.InvariantCulture)},{(by + bh).ToString("F1", CultureInfo.InvariantCulture)} L {(bx + bw - arm).ToString("F1", CultureInfo.InvariantCulture)},{(by + bh).ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"none\" stroke=\"{fill}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" />");
                    // Bottom-Left
                    sb.AppendLine($"  <path d=\"M {(bx + arm).ToString("F1", CultureInfo.InvariantCulture)},{(by + bh).ToString("F1", CultureInfo.InvariantCulture)} L {bx.ToString("F1", CultureInfo.InvariantCulture)},{(by + bh).ToString("F1", CultureInfo.InvariantCulture)} L {bx.ToString("F1", CultureInfo.InvariantCulture)},{(by + bh - arm).ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"none\" stroke=\"{fill}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" />");
                    break;
                default: // square_box
                    sb.AppendLine($"  <rect x=\"{(x + strokeWidth * 0.5f).ToString("F1", CultureInfo.InvariantCulture)}\" y=\"{(y + strokeWidth * 0.5f).ToString("F1", CultureInfo.InvariantCulture)}\" width=\"{(size - strokeWidth).ToString("F1", CultureInfo.InvariantCulture)}\" height=\"{(size - strokeWidth).ToString("F1", CultureInfo.InvariantCulture)}\" rx=\"8\" fill=\"none\" stroke=\"{fill}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" />");
                    break;
            }

            // Initials text path
            var fontSize = initials.Length > 1 ? size * 0.42f : size * 0.55f;
            var textRes = VectorTypographyRenderer.RenderTextToVectorPath(
                initials,
                fontCategory,
                initialFontSize: fontSize,
                letterSpacing: "tight",
                horizontalBudget: size * 0.7f,
                allowTwoLineStacking: false,
                letterCase: "uppercase");

            var initX = cx - (textRes.Left + textRes.Width * 0.5f);
            var initY = cy - (textRes.Top + textRes.Height * 0.5f);

            sb.AppendLine($"  <g transform=\"translate({initX.ToString("F1", CultureInfo.InvariantCulture)}, {initY.ToString("F1", CultureInfo.InvariantCulture)})\">");
            sb.AppendLine($"    <path d=\"{textRes.SvgPathData}\" fill=\"{fill}\" />");
            sb.AppendLine("  </g>");
        }
    }
}
