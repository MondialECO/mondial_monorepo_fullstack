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
            var primaryColor = colorHex ?? parameters?.Values?.GetValueOrDefault("PrimaryColor") ?? "#0F172A";
            var accentColor = parameters?.Values?.GetValueOrDefault("AccentColor") ?? primaryColor;
            var primitive = parameters?.Values?.GetValueOrDefault("MetaphorPrimitive") ?? "spark_intelligence";
            var construction = parameters?.Values?.GetValueOrDefault("Construction") ?? "silhouette_solid";
            var escapedName = SecurityElement.Escape(brandName ?? "Brand");

            var sb = new StringBuilder();
            sb.AppendLine($"<svg viewBox=\"0 0 100 100\" width=\"100%\" height=\"100%\" xmlns=\"http://www.w3.org/2000/svg\" role=\"img\" aria-label=\"{escapedName} Logo\">");
            sb.AppendLine($"  <title>{escapedName} Logo</title>");
            RenderIconMetaphor(sb, primitive, construction, 15f, 15f, 70f, primaryColor, accentColor);
            sb.AppendLine("</svg>");
            return sb.ToString();
        }

        public string RenderLockupSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null)
        {
            var primaryColor = colorHex ?? parameters?.Values?.GetValueOrDefault("PrimaryColor") ?? "#0F172A";
            var accentColor = parameters?.Values?.GetValueOrDefault("AccentColor") ?? primaryColor;
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
                RenderIconMetaphor(sb, primitive, construction, markX, markY, markSize, primaryColor, accentColor);

                sb.AppendLine($"  <g transform=\"translate({textX.ToString("F1", CultureInfo.InvariantCulture)}, {textY.ToString("F1", CultureInfo.InvariantCulture)})\">");
                sb.AppendLine($"    <path d=\"{textResult.SvgPathData}\" fill=\"{primaryColor}\" />");
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

                RenderIconMetaphor(sb, primitive, construction, markX, markOffsetY, markSize, primaryColor, accentColor);

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

        private static void RenderIconMetaphor(
            StringBuilder sb,
            string primitive,
            string construction,
            float x,
            float y,
            float size,
            string primaryColor,
            string accentColor)
        {
            var half = size * 0.5f;
            var cx = x + half;
            var cy = y + half;
            var strokeWidth = Math.Max(3.5f, size * 0.08f);
            var isDuo = !string.Equals(primaryColor, accentColor, StringComparison.OrdinalIgnoreCase);
            var secColor = isDuo ? accentColor : primaryColor;

            switch (primitive.ToLowerInvariant())
            {
                case "shield_security":
                    var sW = size * 0.72f;
                    var sH = size * 0.88f;
                    var sTop = y + (size - sH) * 0.5f;
                    var sMid = sTop + sH * 0.45f;
                    var sBot = sTop + sH;
                    var sL = cx - sW * 0.5f;
                    var sR = cx + sW * 0.5f;

                    // Outer shield boundary
                    sb.AppendLine($"  <path d=\"M {cx.ToString("F1", CultureInfo.InvariantCulture)},{sTop.ToString("F1", CultureInfo.InvariantCulture)} L {sR.ToString("F1", CultureInfo.InvariantCulture)},{(sTop + sH * 0.15f).ToString("F1", CultureInfo.InvariantCulture)} L {sR.ToString("F1", CultureInfo.InvariantCulture)},{sMid.ToString("F1", CultureInfo.InvariantCulture)} C {sR.ToString("F1", CultureInfo.InvariantCulture)},{(sMid + sH * 0.35f).ToString("F1", CultureInfo.InvariantCulture)} {cx.ToString("F1", CultureInfo.InvariantCulture)},{sBot.ToString("F1", CultureInfo.InvariantCulture)} {cx.ToString("F1", CultureInfo.InvariantCulture)},{sBot.ToString("F1", CultureInfo.InvariantCulture)} C {cx.ToString("F1", CultureInfo.InvariantCulture)},{sBot.ToString("F1", CultureInfo.InvariantCulture)} {sL.ToString("F1", CultureInfo.InvariantCulture)},{(sMid + sH * 0.35f).ToString("F1", CultureInfo.InvariantCulture)} {sL.ToString("F1", CultureInfo.InvariantCulture)},{sMid.ToString("F1", CultureInfo.InvariantCulture)} L {sL.ToString("F1", CultureInfo.InvariantCulture)},{(sTop + sH * 0.15f).ToString("F1", CultureInfo.InvariantCulture)} Z\" fill=\"{primaryColor}\" />");
                    // Internal checkmark / security notch in accent
                    var chkW = size * 0.35f;
                    sb.AppendLine($"  <path d=\"M {(cx - chkW * 0.5f).ToString("F1", CultureInfo.InvariantCulture)},{(cy - 2f).ToString("F1", CultureInfo.InvariantCulture)} L {(cx - 2f).ToString("F1", CultureInfo.InvariantCulture)},{(cy + chkW * 0.45f).ToString("F1", CultureInfo.InvariantCulture)} L {(cx + chkW * 0.6f).ToString("F1", CultureInfo.InvariantCulture)},{(cy - chkW * 0.45f).ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"none\" stroke=\"{(isDuo ? secColor : "#FFFFFF")}\" stroke-width=\"{(strokeWidth * 1.1f).ToString("F1", CultureInfo.InvariantCulture)}\" stroke-linecap=\"round\" stroke-linejoin=\"round\" />");
                    break;

                case "leaf_growth":
                    // Biomorphic Duo-tone Leaf
                    sb.AppendLine($"  <path d=\"M {(cx - size * 0.38f).ToString("F1", CultureInfo.InvariantCulture)},{(cy + size * 0.38f).ToString("F1", CultureInfo.InvariantCulture)} C {(cx - size * 0.38f).ToString("F1", CultureInfo.InvariantCulture)},{(cy - size * 0.25f).ToString("F1", CultureInfo.InvariantCulture)} {(cx - size * 0.15f).ToString("F1", CultureInfo.InvariantCulture)},{(cy - size * 0.42f).ToString("F1", CultureInfo.InvariantCulture)} {cx.ToString("F1", CultureInfo.InvariantCulture)},{(cy - size * 0.42f).ToString("F1", CultureInfo.InvariantCulture)} C {(cx - size * 0.05f).ToString("F1", CultureInfo.InvariantCulture)},{(cy - size * 0.1f).ToString("F1", CultureInfo.InvariantCulture)} {(cx - size * 0.15f).ToString("F1", CultureInfo.InvariantCulture)},{(cy + size * 0.2f).ToString("F1", CultureInfo.InvariantCulture)} {(cx - size * 0.38f).ToString("F1", CultureInfo.InvariantCulture)},{(cy + size * 0.38f).ToString("F1", CultureInfo.InvariantCulture)} Z\" fill=\"{primaryColor}\" />");
                    sb.AppendLine($"  <path d=\"M {(cx + size * 0.38f).ToString("F1", CultureInfo.InvariantCulture)},{(cy - size * 0.38f).ToString("F1", CultureInfo.InvariantCulture)} C {(cx + size * 0.38f).ToString("F1", CultureInfo.InvariantCulture)},{(cy + size * 0.25f).ToString("F1", CultureInfo.InvariantCulture)} {(cx + size * 0.15f).ToString("F1", CultureInfo.InvariantCulture)},{(cy + size * 0.42f).ToString("F1", CultureInfo.InvariantCulture)} {cx.ToString("F1", CultureInfo.InvariantCulture)},{(cy + size * 0.42f).ToString("F1", CultureInfo.InvariantCulture)} C {(cx + size * 0.05f).ToString("F1", CultureInfo.InvariantCulture)},{(cy + size * 0.1f).ToString("F1", CultureInfo.InvariantCulture)} {(cx + size * 0.15f).ToString("F1", CultureInfo.InvariantCulture)},{(cy - size * 0.2f).ToString("F1", CultureInfo.InvariantCulture)} {(cx + size * 0.38f).ToString("F1", CultureInfo.InvariantCulture)},{(cy - size * 0.38f).ToString("F1", CultureInfo.InvariantCulture)} Z\" fill=\"{secColor}\" />");
                    break;

                case "node_network":
                    // Connected Data Network Node
                    var nR = size * 0.13f;
                    var n1X = cx - size * 0.28f; var n1Y = cy - size * 0.22f;
                    var n2X = cx + size * 0.28f; var n2Y = cy - size * 0.22f;
                    var n3X = cx;               var n3Y = cy + size * 0.30f;

                    sb.AppendLine($"  <line x1=\"{n1X.ToString("F1", CultureInfo.InvariantCulture)}\" y1=\"{n1Y.ToString("F1", CultureInfo.InvariantCulture)}\" x2=\"{n2X.ToString("F1", CultureInfo.InvariantCulture)}\" y2=\"{n2Y.ToString("F1", CultureInfo.InvariantCulture)}\" stroke=\"{primaryColor}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" />");
                    sb.AppendLine($"  <line x1=\"{n2X.ToString("F1", CultureInfo.InvariantCulture)}\" y1=\"{n2Y.ToString("F1", CultureInfo.InvariantCulture)}\" x2=\"{n3X.ToString("F1", CultureInfo.InvariantCulture)}\" y2=\"{n3Y.ToString("F1", CultureInfo.InvariantCulture)}\" stroke=\"{primaryColor}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" />");
                    sb.AppendLine($"  <line x1=\"{n3X.ToString("F1", CultureInfo.InvariantCulture)}\" y1=\"{n3Y.ToString("F1", CultureInfo.InvariantCulture)}\" x2=\"{n1X.ToString("F1", CultureInfo.InvariantCulture)}\" y2=\"{n1Y.ToString("F1", CultureInfo.InvariantCulture)}\" stroke=\"{primaryColor}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" />");

                    sb.AppendLine($"  <circle cx=\"{n1X.ToString("F1", CultureInfo.InvariantCulture)}\" cy=\"{n1Y.ToString("F1", CultureInfo.InvariantCulture)}\" r=\"{nR.ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"{primaryColor}\" />");
                    sb.AppendLine($"  <circle cx=\"{n2X.ToString("F1", CultureInfo.InvariantCulture)}\" cy=\"{n2Y.ToString("F1", CultureInfo.InvariantCulture)}\" r=\"{nR.ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"{secColor}\" />");
                    sb.AppendLine($"  <circle cx=\"{n3X.ToString("F1", CultureInfo.InvariantCulture)}\" cy=\"{n3Y.ToString("F1", CultureInfo.InvariantCulture)}\" r=\"{nR.ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"{primaryColor}\" />");
                    break;

                case "energy_bolt":
                    // Dynamic High-Impact Lightning Energy Bolt
                    sb.AppendLine($"  <polygon points=\"{(cx + size * 0.12f).ToString("F1", CultureInfo.InvariantCulture)},{(cy - size * 0.45f).ToString("F1", CultureInfo.InvariantCulture)} {(cx - size * 0.32f).ToString("F1", CultureInfo.InvariantCulture)},{(cy + size * 0.02f).ToString("F1", CultureInfo.InvariantCulture)} {(cx - size * 0.02f).ToString("F1", CultureInfo.InvariantCulture)},{(cy + size * 0.02f).ToString("F1", CultureInfo.InvariantCulture)} {(cx - size * 0.12f).ToString("F1", CultureInfo.InvariantCulture)},{(cy + size * 0.45f).ToString("F1", CultureInfo.InvariantCulture)} {(cx + size * 0.32f).ToString("F1", CultureInfo.InvariantCulture)},{(cy - size * 0.02f).ToString("F1", CultureInfo.InvariantCulture)} {(cx + size * 0.02f).ToString("F1", CultureInfo.InvariantCulture)},{(cy - size * 0.02f).ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"{primaryColor}\" />");
                    break;

                case "prism_focus":
                    // Optical Focus Triangle Prism
                    var pR = half * 0.85f;
                    sb.AppendLine($"  <polygon points=\"{cx.ToString("F1", CultureInfo.InvariantCulture)},{(cy - pR).ToString("F1", CultureInfo.InvariantCulture)} {(cx + pR * 0.866f).ToString("F1", CultureInfo.InvariantCulture)},{(cy + pR * 0.5f).ToString("F1", CultureInfo.InvariantCulture)} {(cx - pR * 0.866f).ToString("F1", CultureInfo.InvariantCulture)},{(cy + pR * 0.5f).ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"none\" stroke=\"{primaryColor}\" stroke-width=\"{strokeWidth.ToString("F1", CultureInfo.InvariantCulture)}\" stroke-linejoin=\"round\" />");
                    sb.AppendLine($"  <polygon points=\"{cx.ToString("F1", CultureInfo.InvariantCulture)},{(cy - pR * 0.35f).ToString("F1", CultureInfo.InvariantCulture)} {(cx + pR * 0.45f).ToString("F1", CultureInfo.InvariantCulture)},{(cy + pR * 0.35f).ToString("F1", CultureInfo.InvariantCulture)} {(cx - pR * 0.45f).ToString("F1", CultureInfo.InvariantCulture)},{(cy + pR * 0.35f).ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"{secColor}\" />");
                    break;

                case "pillar_foundation":
                    // Architectural Structural Columns
                    var colW = size * 0.16f;
                    var colH = size * 0.55f;
                    var pY = cy - size * 0.18f;
                    // Lintel
                    sb.AppendLine($"  <rect x=\"{(cx - size * 0.42f).ToString("F1", CultureInfo.InvariantCulture)}\" y=\"{(cy - size * 0.38f).ToString("F1", CultureInfo.InvariantCulture)}\" width=\"{(size * 0.84f).ToString("F1", CultureInfo.InvariantCulture)}\" height=\"{(size * 0.12f).ToString("F1", CultureInfo.InvariantCulture)}\" rx=\"3\" fill=\"{primaryColor}\" />");
                    // 3 Columns
                    sb.AppendLine($"  <rect x=\"{(cx - size * 0.36f).ToString("F1", CultureInfo.InvariantCulture)}\" y=\"{pY.ToString("F1", CultureInfo.InvariantCulture)}\" width=\"{colW.ToString("F1", CultureInfo.InvariantCulture)}\" height=\"{colH.ToString("F1", CultureInfo.InvariantCulture)}\" rx=\"2\" fill=\"{primaryColor}\" />");
                    sb.AppendLine($"  <rect x=\"{(cx - colW * 0.5f).ToString("F1", CultureInfo.InvariantCulture)}\" y=\"{pY.ToString("F1", CultureInfo.InvariantCulture)}\" width=\"{colW.ToString("F1", CultureInfo.InvariantCulture)}\" height=\"{colH.ToString("F1", CultureInfo.InvariantCulture)}\" rx=\"2\" fill=\"{secColor}\" />");
                    sb.AppendLine($"  <rect x=\"{(cx + size * 0.36f - colW).ToString("F1", CultureInfo.InvariantCulture)}\" y=\"{pY.ToString("F1", CultureInfo.InvariantCulture)}\" width=\"{colW.ToString("F1", CultureInfo.InvariantCulture)}\" height=\"{colH.ToString("F1", CultureInfo.InvariantCulture)}\" rx=\"2\" fill=\"{primaryColor}\" />");
                    // Base
                    sb.AppendLine($"  <rect x=\"{(cx - size * 0.45f).ToString("F1", CultureInfo.InvariantCulture)}\" y=\"{(cy + size * 0.38f).ToString("F1", CultureInfo.InvariantCulture)}\" width=\"{(size * 0.90f).ToString("F1", CultureInfo.InvariantCulture)}\" height=\"{(size * 0.10f).ToString("F1", CultureInfo.InvariantCulture)}\" rx=\"2\" fill=\"{primaryColor}\" />");
                    break;

                default: // spark_intelligence
                    // 4-Point Precision Intelligence Star
                    sb.AppendLine($"  <path d=\"M {cx.ToString("F1", CultureInfo.InvariantCulture)},{(cy - half * 0.9f).ToString("F1", CultureInfo.InvariantCulture)} Q {cx.ToString("F1", CultureInfo.InvariantCulture)},{cy.ToString("F1", CultureInfo.InvariantCulture)} {(cx + half * 0.9f).ToString("F1", CultureInfo.InvariantCulture)},{cy.ToString("F1", CultureInfo.InvariantCulture)} Q {cx.ToString("F1", CultureInfo.InvariantCulture)},{cy.ToString("F1", CultureInfo.InvariantCulture)} {cx.ToString("F1", CultureInfo.InvariantCulture)},{(cy + half * 0.9f).ToString("F1", CultureInfo.InvariantCulture)} Q {cx.ToString("F1", CultureInfo.InvariantCulture)},{cy.ToString("F1", CultureInfo.InvariantCulture)} {(cx - half * 0.9f).ToString("F1", CultureInfo.InvariantCulture)},{cy.ToString("F1", CultureInfo.InvariantCulture)} Q {cx.ToString("F1", CultureInfo.InvariantCulture)},{cy.ToString("F1", CultureInfo.InvariantCulture)} {cx.ToString("F1", CultureInfo.InvariantCulture)},{(cy - half * 0.9f).ToString("F1", CultureInfo.InvariantCulture)} Z\" fill=\"{primaryColor}\" />");
                    // Satellite accent dot
                    sb.AppendLine($"  <circle cx=\"{(cx + half * 0.65f).ToString("F1", CultureInfo.InvariantCulture)}\" cy=\"{(cy - half * 0.65f).ToString("F1", CultureInfo.InvariantCulture)}\" r=\"{(size * 0.08f).ToString("F1", CultureInfo.InvariantCulture)}\" fill=\"{secColor}\" />");
                    break;
            }
        }
    }
}
