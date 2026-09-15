using System.Globalization;
using System.Text;
using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Creator.BrandKit.LogoEngine
{
    public class IconLogoRenderer : ILogoMarkRenderer
    {
        public string FamilyName => BrandLogoFamilyNames.Icon;

        public string RenderMarkSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null)
        {
            var color = colorHex ?? "#0F172A";
            var primitive = parameters?.Values?.GetValueOrDefault("MetaphorPrimitive") ?? "spark_intelligence";
            var construction = parameters?.Values?.GetValueOrDefault("Construction") ?? "silhouette_solid";

            var sb = new StringBuilder();
            sb.AppendLine("<svg viewBox=\"0 0 100 100\" width=\"100%\" height=\"100%\" xmlns=\"http://www.w3.org/2000/svg\">");
            RenderIconMetaphor(sb, primitive, construction, 15f, 15f, 70f, color);
            sb.AppendLine("</svg>");
            return sb.ToString();
        }

        public string RenderLockupSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null)
        {
            var color = colorHex ?? "#0F172A";
            var primitive = parameters?.Values?.GetValueOrDefault("MetaphorPrimitive") ?? "spark_intelligence";
            var construction = parameters?.Values?.GetValueOrDefault("Construction") ?? "silhouette_solid";
            var fontCategory = parameters?.Values?.GetValueOrDefault("FontCategory") ?? "geometric_sans";

            var textResult = VectorTypographyRenderer.RenderTextToVectorPath(
                brandName,
                fontCategory,
                initialFontSize: 24f,
                letterSpacing: "normal",
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

            RenderIconMetaphor(sb, primitive, construction, markX, markOffsetY, markSize, color);

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

        private static void RenderIconMetaphor(StringBuilder sb, string primitive, string construction, float x, float y, float size, string color)
        {
            var half = size * 0.5f;
            var strokeWidth = Math.Max(5f, size * 0.09f);
            var isSolid = construction == "silhouette_solid";
            var isSplit = construction == "split_halves";

            sb.AppendLine($"  <g transform=\"translate({x.ToString("F1", CultureInfo.InvariantCulture)}, {y.ToString("F1", CultureInfo.InvariantCulture)})\">");

            switch (primitive.ToLowerInvariant())
            {
                case "shield_security":
                    var dShield = $"M {half:F1} {size * 0.14f:F1} L {size * 0.84f:F1} {size * 0.28f:F1} L {size * 0.74f:F1} {size * 0.66f:F1} L {half:F1} {size * 0.86f:F1} L {size * 0.26f:F1} {size * 0.66f:F1} L {size * 0.16f:F1} {size * 0.28f:F1} Z";
                    if (isSplit)
                    {
                        sb.AppendLine($"    <path d=\"M {half:F1} {size * 0.14f:F1} L {size * 0.84f:F1} {size * 0.28f:F1} L {size * 0.74f:F1} {size * 0.66f:F1} L {half:F1} {size * 0.86f:F1} Z\" fill=\"{color}\" />");
                        sb.AppendLine($"    <path d=\"M {half:F1} {size * 0.14f:F1} L {size * 0.16f:F1} {size * 0.28f:F1} L {size * 0.26f:F1} {size * 0.66f:F1} L {half:F1} {size * 0.86f:F1} Z\" fill=\"none\" stroke=\"{color}\" stroke-width=\"{strokeWidth:F1}\" />");
                    }
                    else
                    {
                        sb.AppendLine($"    <path d=\"{dShield}\" fill=\"none\" stroke=\"{color}\" stroke-width=\"{strokeWidth:F1}\" stroke-linejoin=\"round\" />");
                        sb.AppendLine($"    <circle cx=\"{half:F1}\" cy=\"{half:F1}\" r=\"{size * 0.12f:F1}\" fill=\"{color}\" />");
                    }
                    break;

                case "leaf_growth":
                    var dLeaf1 = $"M {half:F1} {size * 0.86f:F1} C {half:F1} {size * 0.86f:F1} {size * 0.2f:F1} {size * 0.66f:F1} {size * 0.2f:F1} {size * 0.42f:F1} C {size * 0.2f:F1} {size * 0.18f:F1} {half:F1} {size * 0.14f:F1} {half:F1} {size * 0.14f:F1} Z";
                    var dLeaf2 = $"M {half:F1} {size * 0.86f:F1} C {half:F1} {size * 0.86f:F1} {size * 0.8f:F1} {size * 0.66f:F1} {size * 0.8f:F1} {size * 0.42f:F1} C {size * 0.8f:F1} {size * 0.18f:F1} {half:F1} {size * 0.14f:F1} {half:F1} {size * 0.14f:F1} Z";
                    sb.AppendLine($"    <path d=\"{dLeaf1}\" fill=\"{color}\" />");
                    sb.AppendLine($"    <path d=\"{dLeaf2}\" fill=\"{color}\" opacity=\"0.65\" />");
                    break;

                case "node_network":
                    var c1x = half; var c1y = size * 0.2f;
                    var c2x = size * 0.22f; var c2y = size * 0.78f;
                    var c3x = size * 0.78f; var c3y = size * 0.78f;
                    var rNode = size * 0.12f;
                    sb.AppendLine($"    <line x1=\"{c1x:F1}\" y1=\"{c1y:F1}\" x2=\"{c2x:F1}\" y2=\"{c2y:F1}\" stroke=\"{color}\" stroke-width=\"{strokeWidth:F1}\" />");
                    sb.AppendLine($"    <line x1=\"{c2x:F1}\" y1=\"{c2y:F1}\" x2=\"{c3x:F1}\" y2=\"{c3y:F1}\" stroke=\"{color}\" stroke-width=\"{strokeWidth:F1}\" />");
                    sb.AppendLine($"    <line x1=\"{c3x:F1}\" y1=\"{c3y:F1}\" x2=\"{c1x:F1}\" y2=\"{c1y:F1}\" stroke=\"{color}\" stroke-width=\"{strokeWidth:F1}\" />");
                    sb.AppendLine($"    <circle cx=\"{c1x:F1}\" cy=\"{c1y:F1}\" r=\"{rNode:F1}\" fill=\"{color}\" />");
                    sb.AppendLine($"    <circle cx=\"{c2x:F1}\" cy=\"{c2y:F1}\" r=\"{rNode:F1}\" fill=\"{color}\" />");
                    sb.AppendLine($"    <circle cx=\"{c3x:F1}\" cy=\"{c3y:F1}\" r=\"{rNode:F1}\" fill=\"{color}\" />");
                    break;

                case "spark_intelligence":
                case "prism_focus":
                    var dSpark = $"M {half:F1} {size * 0.12f:F1} Q {half:F1} {half:F1} {size * 0.88f:F1} {half:F1} Q {half:F1} {half:F1} {half:F1} {size * 0.88f:F1} Q {half:F1} {half:F1} {size * 0.12f:F1} {half:F1} Q {half:F1} {half:F1} {half:F1} {size * 0.12f:F1} Z";
                    sb.AppendLine($"    <path d=\"{dSpark}\" fill=\"{color}\" />");
                    break;

                default: // pillar_foundation
                    sb.AppendLine($"    <rect x=\"{size * 0.16f:F1}\" y=\"{size * 0.18f:F1}\" width=\"{size * 0.68f:F1}\" height=\"{strokeWidth * 1.2f:F1}\" rx=\"2\" fill=\"{color}\" />");
                    sb.AppendLine($"    <rect x=\"{size * 0.24f:F1}\" y=\"{size * 0.28f:F1}\" width=\"{size * 0.14f:F1}\" height=\"{size * 0.46f:F1}\" rx=\"2\" fill=\"{color}\" />");
                    sb.AppendLine($"    <rect x=\"{size * 0.43f:F1}\" y=\"{size * 0.28f:F1}\" width=\"{size * 0.14f:F1}\" height=\"{size * 0.46f:F1}\" rx=\"2\" fill=\"{color}\" />");
                    sb.AppendLine($"    <rect x=\"{size * 0.62f:F1}\" y=\"{size * 0.28f:F1}\" width=\"{size * 0.14f:F1}\" height=\"{size * 0.46f:F1}\" rx=\"2\" fill=\"{color}\" />");
                    sb.AppendLine($"    <rect x=\"{size * 0.16f:F1}\" y=\"{size * 0.76f:F1}\" width=\"{size * 0.68f:F1}\" height=\"{strokeWidth * 1.2f:F1}\" rx=\"2\" fill=\"{color}\" />");
                    break;
            }

            sb.AppendLine("  </g>");
        }
    }
}
