using System.Globalization;
using System.Text;
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

            var sb = new StringBuilder();
            sb.AppendLine("<svg viewBox=\"0 0 100 100\" width=\"100%\" height=\"100%\" xmlns=\"http://www.w3.org/2000/svg\">");
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

            var textResult = VectorTypographyRenderer.RenderTextToVectorPath(
                brandName,
                fontCategory,
                initialFontSize: 24f,
                letterSpacing: "wide",
                horizontalBudget: 260f,
                allowTwoLineStacking: true,
                letterCase: "uppercase");

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

            var sb = new StringBuilder();
            sb.AppendLine($"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 {totalW.ToString("F0", CultureInfo.InvariantCulture)} {totalH.ToString("F0", CultureInfo.InvariantCulture)}\" width=\"100%\" height=\"100%\">");

            RenderMinimalPrimitive(sb, primitive, orientation, balance, markX, markOffsetY, markSize, color);

            var textTranslationX = textX - textResult.Left;
            sb.AppendLine($"  <g transform=\"translate({textTranslationX.ToString("F1", CultureInfo.InvariantCulture)}, {textOffsetY.ToString("F1", CultureInfo.InvariantCulture)})\">");
            sb.AppendLine($"    <path d=\"{textResult.SvgPathData}\" fill=\"{color}\" />");
            sb.AppendLine("  </g>");
            sb.AppendLine("</svg>");
            return sb.ToString();
        }

        public string RenderSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null)
        {
            return RenderLockupSvg(parameters, brandName, colorHex);
        }

        private static void RenderMinimalPrimitive(StringBuilder sb, string primitive, string orientation, string balance, float x, float y, float size, string color)
        {
            var half = size * 0.5f;
            var rotAngle = orientation switch
            {
                "45_deg" => 45,
                "90_deg" => 90,
                "180_deg" => 180,
                "270_deg" => 270,
                _ => 0
            };

            sb.AppendLine($"  <g transform=\"translate({x.ToString("F1", CultureInfo.InvariantCulture)}, {y.ToString("F1", CultureInfo.InvariantCulture)})\">");
            sb.AppendLine($"    <g transform=\"rotate({rotAngle} {half:F1} {half:F1})\">");

            switch (primitive.ToLowerInvariant())
            {
                case "quadrant_arc":
                    sb.AppendLine($"      <path d=\"M {size * 0.16f:F1} {size * 0.84f:F1} A {size * 0.68f:F1} {size * 0.68f:F1} 0 0 1 {size * 0.84f:F1} {size * 0.16f:F1} L {size * 0.84f:F1} {size * 0.84f:F1} Z\" fill=\"{color}\" />");
                    break;

                case "offset_bars":
                    sb.AppendLine($"      <rect x=\"{size * 0.18f:F1}\" y=\"{size * 0.16f:F1}\" width=\"{size * 0.18f:F1}\" height=\"{size * 0.68f:F1}\" rx=\"6\" fill=\"{color}\" />");
                    sb.AppendLine($"      <rect x=\"{size * 0.42f:F1}\" y=\"{size * 0.32f:F1}\" width=\"{size * 0.18f:F1}\" height=\"{size * 0.52f:F1}\" rx=\"6\" fill=\"{color}\" />");
                    sb.AppendLine($"      <rect x=\"{size * 0.66f:F1}\" y=\"{size * 0.48f:F1}\" width=\"{size * 0.18f:F1}\" height=\"{size * 0.36f:F1}\" rx=\"6\" fill=\"{color}\" />");
                    break;

                case "chevron_fold":
                    sb.AppendLine($"      <path d=\"M {size * 0.16f:F1} {size * 0.28f:F1} L {half:F1} {size * 0.58f:F1} L {size * 0.84f:F1} {size * 0.28f:F1} L {size * 0.84f:F1} {size * 0.46f:F1} L {half:F1} {size * 0.76f:F1} L {size * 0.16f:F1} {size * 0.46f:F1} Z\" fill=\"{color}\" />");
                    break;

                case "diagonal_slash":
                case "hairline_cross":
                    sb.AppendLine($"      <rect x=\"{half - size * 0.08f:F1}\" y=\"{size * 0.12f:F1}\" width=\"{size * 0.16f:F1}\" height=\"{size * 0.76f:F1}\" rx=\"6\" fill=\"{color}\" />");
                    sb.AppendLine($"      <rect x=\"{size * 0.12f:F1}\" y=\"{half - size * 0.08f:F1}\" width=\"{size * 0.76f:F1}\" height=\"{size * 0.16f:F1}\" rx=\"6\" fill=\"{color}\" />");
                    break;

                default: // sliced_circle
                    sb.AppendLine($"      <path d=\"M {size * 0.16f:F1} {half - 4f:F1} A {size * 0.38f:F1} {size * 0.38f:F1} 0 0 1 {size * 0.84f:F1} {half - 4f:F1} Z\" fill=\"{color}\" />");
                    sb.AppendLine($"      <path d=\"M {size * 0.16f:F1} {half + 4f:F1} A {size * 0.38f:F1} {size * 0.38f:F1} 0 0 0 {size * 0.84f:F1} {half + 4f:F1} Z\" fill=\"{color}\" />");
                    break;
            }

            sb.AppendLine("    </g>");
            sb.AppendLine("  </g>");
        }
    }
}
