using System.Globalization;
using System.Text;
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
            var initials = ResolveInitials(brandName);

            var sb = new StringBuilder();
            sb.AppendLine("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" width=\"100%\" height=\"100%\">");
            RenderMonogramBadge(sb, initials, fontCategory, 15f, 15f, 70f, fill);
            sb.AppendLine("</svg>");
            return sb.ToString();
        }

        public string RenderLockupSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null)
        {
            var fill = colorHex ?? "#0F172A";
            var fontCategory = parameters?.Values?.GetValueOrDefault("FontCategory") ?? "high_contrast_serif";
            var initials = ResolveInitials(brandName);

            var textResult = VectorTypographyRenderer.RenderTextToVectorPath(
                brandName,
                fontCategory,
                initialFontSize: 24f,
                letterSpacing: "wide",
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

            RenderMonogramBadge(sb, initials, fontCategory, badgeX, badgeOffsetY, badgeSize, fill);

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

        private static void RenderMonogramBadge(StringBuilder sb, string initials, string fontCategory, float x, float y, float size, string fill)
        {
            var strokeWidth = Math.Max(4f, size * 0.08f);
            var cx = x + size * 0.5f;
            var cy = y + size * 0.5f;

            // Frame container (outer badge)
            sb.AppendLine($"  <rect x=\"{(x + strokeWidth * 0.5f).ToString("F1", CultureInfo.InvariantCulture)}\" y=\"{(y + strokeWidth * 0.5f).ToString("F1", CultureInfo.InvariantCulture)}\" width=\"{(size - strokeWidth).ToString("F1", CultureInfo.InvariantCulture)}\" height=\"{(size - strokeWidth).ToString("F1", CultureInfo.InvariantCulture)}\" rx=\"8\" fill=\"none\" stroke=\"{fill}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" />");

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
