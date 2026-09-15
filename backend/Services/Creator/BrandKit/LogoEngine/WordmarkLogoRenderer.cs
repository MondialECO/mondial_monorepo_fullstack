using System.Globalization;
using System.Text;
using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Creator.BrandKit.LogoEngine
{
    public class WordmarkLogoRenderer : ILogoMarkRenderer
    {
        public string FamilyName => BrandLogoFamilyNames.Wordmark;

        public string RenderMarkSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null)
        {
            var fill = colorHex ?? "#0F172A";
            var fontCategory = parameters?.Values?.GetValueOrDefault("FontCategory") ?? "geometric_sans";
            var letterCase = parameters?.Values?.GetValueOrDefault("LetterCase") ?? "uppercase";
            var accent = parameters?.Values?.GetValueOrDefault("AccentElement") ?? "none";

            var initial = !string.IsNullOrWhiteSpace(brandName) ? brandName.Trim()[0].ToString() : "B";
            var textResult = VectorTypographyRenderer.RenderTextToVectorPath(
                initial,
                fontCategory,
                initialFontSize: 52f,
                letterSpacing: "normal",
                horizontalBudget: 80f,
                allowTwoLineStacking: false,
                letterCase: letterCase);

            var sb = new StringBuilder();
            sb.AppendLine("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" width=\"100%\" height=\"100%\">");

            var offsetX = 50f - (textResult.Left + textResult.Width * 0.5f);
            var offsetY = 50f - (textResult.Top + textResult.Height * 0.5f);

            sb.AppendLine($"  <g transform=\"translate({offsetX.ToString("F1", CultureInfo.InvariantCulture)}, {offsetY.ToString("F1", CultureInfo.InvariantCulture)})\">");
            sb.AppendLine($"    <path d=\"{textResult.SvgPathData}\" fill=\"{fill}\" />");

            if (accent == "terminal_dot" || accent == "split_dot")
            {
                var dotX = textResult.Left + textResult.Width + 5f;
                var dotY = textResult.Top + textResult.Height - 4f;
                sb.AppendLine($"    <circle cx=\"{dotX.ToString("F1", CultureInfo.InvariantCulture)}\" cy=\"{dotY.ToString("F1", CultureInfo.InvariantCulture)}\" r=\"3.5\" fill=\"{fill}\" />");
            }

            sb.AppendLine("  </g>");
            sb.AppendLine("</svg>");
            return sb.ToString();
        }

        public string RenderLockupSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null)
        {
            var fill = colorHex ?? "#0F172A";
            var fontCategory = parameters?.Values?.GetValueOrDefault("FontCategory") ?? "geometric_sans";
            var letterCase = parameters?.Values?.GetValueOrDefault("LetterCase") ?? "uppercase";
            var letterSpacing = parameters?.Values?.GetValueOrDefault("LetterSpacing") ?? "wide";
            var accent = parameters?.Values?.GetValueOrDefault("AccentElement") ?? "none";

            var textResult = VectorTypographyRenderer.RenderTextToVectorPath(
                brandName,
                fontCategory,
                initialFontSize: 30f,
                letterSpacing: letterSpacing,
                horizontalBudget: 340f,
                allowTwoLineStacking: true,
                letterCase: letterCase);

            var padding = 30f;
            var totalW = Math.Max(380f, textResult.Width + padding * 2f + (accent == "terminal_dot" ? 20f : 0f));
            var totalH = textResult.IsStacked ? 140f : 100f;

            var offsetX = (totalW - textResult.Width) * 0.5f - textResult.Left;
            var offsetY = totalH * 0.5f - (textResult.Top + textResult.Height * 0.5f);

            var sb = new StringBuilder();
            sb.AppendLine($"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 {totalW.ToString("F0", CultureInfo.InvariantCulture)} {totalH.ToString("F0", CultureInfo.InvariantCulture)}\" width=\"100%\" height=\"100%\">");
            sb.AppendLine($"  <g transform=\"translate({offsetX.ToString("F1", CultureInfo.InvariantCulture)}, {offsetY.ToString("F1", CultureInfo.InvariantCulture)})\">");
            sb.AppendLine($"    <path d=\"{textResult.SvgPathData}\" fill=\"{fill}\" />");

            if (accent == "terminal_dot" || accent == "split_dot")
            {
                var dotX = textResult.Left + textResult.Width + 8f;
                var dotY = textResult.Top + textResult.Height - 5f;
                sb.AppendLine($"    <circle cx=\"{dotX.ToString("F1", CultureInfo.InvariantCulture)}\" cy=\"{dotY.ToString("F1", CultureInfo.InvariantCulture)}\" r=\"4\" fill=\"{fill}\" />");
            }
            else if (accent == "baseline_underline")
            {
                var lineY = textResult.Top + textResult.Height + 8f;
                sb.AppendLine($"    <rect x=\"{textResult.Left.ToString("F1", CultureInfo.InvariantCulture)}\" y=\"{lineY.ToString("F1", CultureInfo.InvariantCulture)}\" width=\"{textResult.Width.ToString("F1", CultureInfo.InvariantCulture)}\" height=\"3\" fill=\"{fill}\" rx=\"1.5\" />");
            }
            else if (accent == "overscore")
            {
                var lineY = textResult.Top - 8f;
                sb.AppendLine($"    <rect x=\"{textResult.Left.ToString("F1", CultureInfo.InvariantCulture)}\" y=\"{lineY.ToString("F1", CultureInfo.InvariantCulture)}\" width=\"{textResult.Width.ToString("F1", CultureInfo.InvariantCulture)}\" height=\"3\" fill=\"{fill}\" rx=\"1.5\" />");
            }

            sb.AppendLine("  </g>");
            sb.AppendLine("</svg>");
            return sb.ToString();
        }

        public string RenderSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null)
        {
            return RenderLockupSvg(parameters, brandName, colorHex);
        }
    }
}
