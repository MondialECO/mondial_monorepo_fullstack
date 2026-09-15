using System.Globalization;
using System.Text;
using System.Security;
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
            var escapedName = SecurityElement.Escape(brandName ?? "Brand");

            var sb = new StringBuilder();
            sb.AppendLine($"<svg viewBox=\"0 0 100 100\" width=\"100%\" height=\"100%\" xmlns=\"http://www.w3.org/2000/svg\" role=\"img\" aria-label=\"{escapedName} Logo\">");
            sb.AppendLine($"  <title>{escapedName} Logo</title>");
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
            var arrangement = parameters?.Values?.GetValueOrDefault("Arrangement") ?? "side_by_side";
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
                var markSize = 64f;
                var totalW = Math.Max(320f, textResult.Width + 48f);
                var totalH = 160f;

                var markX = (totalW - markSize) * 0.5f;
                var markY = 18f;

                var textX = (totalW - textResult.Width) * 0.5f - textResult.Left;
                var textY = 120f - (textResult.Top + textResult.Height * 0.5f);

                sb.AppendLine($"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 {totalW.ToString("F0", CultureInfo.InvariantCulture)} {totalH.ToString("F0", CultureInfo.InvariantCulture)}\" width=\"100%\" height=\"100%\" role=\"img\" aria-label=\"{escapedName} Logo\">");
                sb.AppendLine($"  <title>{escapedName} Logo</title>");
                RenderIconMetaphor(sb, primitive, construction, markX, markY, markSize, color);

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

                RenderIconMetaphor(sb, primitive, construction, markX, markOffsetY, markSize, color);

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

        private static void RenderIconMetaphor(StringBuilder sb, string primitive, string construction, float x, float y, float size, string color)
        {
            var half = size * 0.5f;
            var cx = x + half;
            var cy = y + half;
            var strokeWidth = Math.Max(5f, size * 0.09f);

            switch (primitive.ToLowerInvariant())
            {
                case "leaf_growth":
                    sb.AppendLine($"  <path d=\"M {(cx - half * 0.6f).ToString("F1", CultureInfo.InvariantCulture)},{(cy + half * 0.6f).ToString("F1", CultureInfo.InvariantCulture)} C {(cx - half * 0.6f).ToString("F1", CultureInfo.InvariantCulture)},{(cy - half * 0.5f).ToString("F1", CultureInfo.InvariantCulture)} {(cx).ToString("F1", CultureInfo.InvariantCulture)},{(cy - half * 0.8f).ToString("F1", CultureInfo.InvariantCulture)} {(cx + half * 0.7f).ToString("F1", CultureInfo.InvariantCulture)},{(cy - half * 0.8f).ToString("F1", CultureInfo.InvariantCulture)} C {(cx + half * 0.7f).ToString("F1", CultureInfo.InvariantCulture)},{(cy + half * 0.3f).ToString("F1", CultureInfo.InvariantCulture)} {(cx + half * 0.2f).ToString("F1", CultureInfo.InvariantCulture)},{(cy + half * 0.6f).ToString("F1", CultureInfo.InvariantCulture)} {(cx - half * 0.6f).ToString("F1", CultureInfo.InvariantCulture)},{(cy + half * 0.6f).ToString("F1", CultureInfo.InvariantCulture)} Z\" fill=\"{color}\" />");
                    break;

                case "node_network":
                    var r1 = half * 0.65f;
                    var nR = size * 0.12f;
                    var p1 = (cx, cy - r1);
                    var p2 = (cx + r1 * 0.866f, cy + r1 * 0.5f);
                    var p3 = (cx - r1 * 0.866f, cy + r1 * 0.5f);

                    sb.AppendLine($"  <line x1=\"{p1.Item1.ToString("F1", CultureInfo.InvariantCulture)}\" y1=\"{p1.Item2.ToString("F1", CultureInfo.InvariantCulture)}\" x2=\"{p2.Item1.ToString("F1", CultureInfo.InvariantCulture)}\" y2=\"{p2.Item2.ToString("F1", CultureInfo.InvariantCulture)}\" stroke=\"{color}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" />");
                    sb.AppendLine($"  <line x1=\"{p2.Item1.ToString("F1", CultureInfo.InvariantCulture)}\" y1=\"{p2.Item2.ToString("F1", CultureInfo.InvariantCulture)}\" x2=\"{p3.Item1.ToString("F1", CultureInfo.InvariantCulture)}\" y2=\"{p3.Item2.ToString("F1", CultureInfo.InvariantCulture)}\" stroke=\"{color}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" />");
                    sb.AppendLine($"  <line x1=\"{p3.Item1.ToString("F1", CultureInfo.InvariantCulture)}\" y1=\"{p3.Item2.ToString("F1", CultureInfo.InvariantCulture)}\" x2=\"{p1.Item1.ToString("F1", CultureInfo.InvariantCulture)}\" y2=\"{p1.Item2.ToString("F1", CultureInfo.InvariantCulture)}\" stroke=\"{color}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" />");

                    sb.AppendLine($"  <circle cx=\"{p1.Item1.ToString("F1", CultureInfo.InvariantCulture)}\" cy=\"{p1.Item2.ToString("F1", CultureInfo.InvariantCulture)}\" r=\"{nR.ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"{color}\" />");
                    sb.AppendLine($"  <circle cx=\"{p2.Item1.ToString("F1", CultureInfo.InvariantCulture)}\" cy=\"{p2.Item2.ToString("F1", CultureInfo.InvariantCulture)}\" r=\"{nR.ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"{color}\" />");
                    sb.AppendLine($"  <circle cx=\"{p3.Item1.ToString("F1", CultureInfo.InvariantCulture)}\" cy=\"{p3.Item2.ToString("F1", CultureInfo.InvariantCulture)}\" r=\"{nR.ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"{color}\" />");
                    break;

                case "spark_intelligence":
                    var sw = size * 0.45f;
                    var sh = size * 0.45f;
                    sb.AppendLine($"  <path d=\"M {cx.ToString("F1", CultureInfo.InvariantCulture)},{(cy - sh).ToString("F1", CultureInfo.InvariantCulture)} Q {cx.ToString("F1", CultureInfo.InvariantCulture)},{cy.ToString("F1", CultureInfo.InvariantCulture)} {(cx + sw).ToString("F1", CultureInfo.InvariantCulture)},{cy.ToString("F1", CultureInfo.InvariantCulture)} Q {cx.ToString("F1", CultureInfo.InvariantCulture)},{cy.ToString("F1", CultureInfo.InvariantCulture)} {cx.ToString("F1", CultureInfo.InvariantCulture)},{(cy + sh).ToString("F1", CultureInfo.InvariantCulture)} Q {cx.ToString("F1", CultureInfo.InvariantCulture)},{cy.ToString("F1", CultureInfo.InvariantCulture)} {(cx - sw).ToString("F1", CultureInfo.InvariantCulture)},{cy.ToString("F1", CultureInfo.InvariantCulture)} Q {cx.ToString("F1", CultureInfo.InvariantCulture)},{cy.ToString("F1", CultureInfo.InvariantCulture)} {cx.ToString("F1", CultureInfo.InvariantCulture)},{(cy - sh).ToString("F1", CultureInfo.InvariantCulture)} Z\" fill=\"{color}\" />");
                    break;

                case "pillar_foundation":
                    var pw = size * 0.65f;
                    var px = cx - pw * 0.5f;
                    sb.AppendLine($"  <rect x=\"{px.ToString("F1", CultureInfo.InvariantCulture)}\" y=\"{(cy - half * 0.7f).ToString("F1", CultureInfo.InvariantCulture)}\" width=\"{pw.ToString("F1", CultureInfo.InvariantCulture)}\" height=\"7\" fill=\"{color}\" rx=\"2\" />");
                    sb.AppendLine($"  <rect x=\"{(px + 4).ToString("F1", CultureInfo.InvariantCulture)}\" y=\"{(cy - half * 0.45f).ToString("F1", CultureInfo.InvariantCulture)}\" width=\"7\" height=\"{(size * 0.5f).ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"{color}\" rx=\"2\" />");
                    sb.AppendLine($"  <rect x=\"{(cx - 3.5f).ToString("F1", CultureInfo.InvariantCulture)}\" y=\"{(cy - half * 0.45f).ToString("F1", CultureInfo.InvariantCulture)}\" width=\"7\" height=\"{(size * 0.5f).ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"{color}\" rx=\"2\" />");
                    sb.AppendLine($"  <rect x=\"{(px + pw - 11).ToString("F1", CultureInfo.InvariantCulture)}\" y=\"{(cy - half * 0.45f).ToString("F1", CultureInfo.InvariantCulture)}\" width=\"7\" height=\"{(size * 0.5f).ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"{color}\" rx=\"2\" />");
                    sb.AppendLine($"  <rect x=\"{px.ToString("F1", CultureInfo.InvariantCulture)}\" y=\"{(cy + half * 0.55f).ToString("F1", CultureInfo.InvariantCulture)}\" width=\"{pw.ToString("F1", CultureInfo.InvariantCulture)}\" height=\"7\" fill=\"{color}\" rx=\"2\" />");
                    break;

                default: // prism_focus
                    sb.AppendLine($"  <polygon points=\"{cx.ToString("F1", CultureInfo.InvariantCulture)},{(cy - half * 0.75f).ToString("F1", CultureInfo.InvariantCulture)} {(cx + half * 0.75f).ToString("F1", CultureInfo.InvariantCulture)},{(cy + half * 0.65f).ToString("F1", CultureInfo.InvariantCulture)} {(cx - half * 0.75f).ToString("F1", CultureInfo.InvariantCulture)},{(cy + half * 0.65f).ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"none\" stroke=\"{color}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" />");
                    sb.AppendLine($"  <circle cx=\"{cx.ToString("F1", CultureInfo.InvariantCulture)}\" cy=\"{(cy + half * 0.1f).ToString("F1", CultureInfo.InvariantCulture)}\" r=\"4\" fill=\"{color}\" />");
                    break;
            }
        }
    }
}
