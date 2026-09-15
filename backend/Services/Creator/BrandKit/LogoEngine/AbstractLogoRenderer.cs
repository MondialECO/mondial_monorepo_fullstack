using System.Globalization;
using System.Text;
using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Creator.BrandKit.LogoEngine
{
    public class AbstractLogoRenderer : ILogoMarkRenderer
    {
        public string FamilyName => BrandLogoFamilyNames.Abstract;

        public string RenderMarkSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null)
        {
            var color = colorHex ?? "#0F172A";
            var geomType = parameters?.Values?.GetValueOrDefault("GeometryType") ?? "rotational_symmetry_3";
            var weight = parameters?.Values?.GetValueOrDefault("StrokeWeight") ?? "heavy_bold";
            var strokeWidth = weight switch
            {
                "thin_precision" => 6.0f,
                "medium" => 8.0f,
                _ => 11.0f
            };

            var sb = new StringBuilder();
            sb.AppendLine("<svg viewBox=\"0 0 100 100\" width=\"100%\" height=\"100%\" xmlns=\"http://www.w3.org/2000/svg\">");
            RenderAbstractGeometry(sb, geomType, strokeWidth, 15f, 15f, 70f, color);
            sb.AppendLine("</svg>");
            return sb.ToString();
        }

        public string RenderLockupSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null)
        {
            var color = colorHex ?? "#0F172A";
            var geomType = parameters?.Values?.GetValueOrDefault("GeometryType") ?? "rotational_symmetry_3";
            var fontCategory = parameters?.Values?.GetValueOrDefault("FontCategory") ?? "geometric_sans";
            var weight = parameters?.Values?.GetValueOrDefault("StrokeWeight") ?? "heavy_bold";
            var strokeWidth = weight switch
            {
                "thin_precision" => 6.0f,
                "medium" => 8.0f,
                _ => 11.0f
            };

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

            RenderAbstractGeometry(sb, geomType, strokeWidth, markX, markOffsetY, markSize, color);

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

        private static void RenderAbstractGeometry(StringBuilder sb, string geomType, float strokeWidth, float x, float y, float size, string color)
        {
            var cx = x + size * 0.5f;
            var cy = y + size * 0.5f;
            var half = size * 0.5f;

            sb.AppendLine($"  <g transform=\"translate({x.ToString("F1", CultureInfo.InvariantCulture)}, {y.ToString("F1", CultureInfo.InvariantCulture)})\">");

            switch (geomType.ToLowerInvariant())
            {
                case "intersecting_rings":
                    sb.AppendLine($"    <circle cx=\"{size * 0.4f:F1}\" cy=\"{half:F1}\" r=\"{size * 0.26f:F1}\" fill=\"none\" stroke=\"{color}\" stroke-width=\"{strokeWidth:F1}\" />");
                    sb.AppendLine($"    <circle cx=\"{size * 0.6f:F1}\" cy=\"{half:F1}\" r=\"{size * 0.26f:F1}\" fill=\"none\" stroke=\"{color}\" stroke-width=\"{strokeWidth:F1}\" />");
                    break;

                case "nested_polygons":
                    sb.AppendLine($"    <rect x=\"{strokeWidth * 0.5f:F1}\" y=\"{strokeWidth * 0.5f:F1}\" width=\"{size - strokeWidth:F1}\" height=\"{size - strokeWidth:F1}\" rx=\"8\" fill=\"none\" stroke=\"{color}\" stroke-width=\"{strokeWidth:F1}\" />");
                    sb.AppendLine($"    <rect x=\"{size * 0.28f:F1}\" y=\"{size * 0.28f:F1}\" width=\"{size * 0.44f:F1}\" height=\"{size * 0.44f:F1}\" rx=\"4\" fill=\"none\" stroke=\"{color}\" stroke-width=\"{Math.Max(4, strokeWidth * 0.7f):F1}\" />");
                    break;

                case "rotational_symmetry_4":
                    for (int i = 0; i < 4; i++)
                    {
                        var angle = i * 90;
                        sb.AppendLine($"    <g transform=\"rotate({angle} {half:F1} {half:F1})\">");
                        sb.AppendLine($"      <path d=\"M {half:F1} {size * 0.18f:F1} L {size * 0.74f:F1} {size * 0.18f:F1} A 8 8 0 0 1 {size * 0.82f:F1} {size * 0.26f:F1} L {size * 0.82f:F1} {half:F1}\" fill=\"none\" stroke=\"{color}\" stroke-width=\"{strokeWidth:F1}\" stroke-linecap=\"round\" stroke-linejoin=\"round\" />");
                        sb.AppendLine("    </g>");
                    }
                    break;

                case "isometric_cube":
                    sb.AppendLine($"    <path d=\"M {half:F1} {size * 0.14f:F1} L {size * 0.82f:F1} {size * 0.32f:F1} L {half:F1} {size * 0.5f:F1} L {size * 0.18f:F1} {size * 0.32f:F1} Z\" fill=\"{color}\" />");
                    sb.AppendLine($"    <path d=\"M {size * 0.16f:F1} {size * 0.36f:F1} L {half - 2f:F1} {size * 0.54f:F1} L {half - 2f:F1} {size * 0.88f:F1} L {size * 0.16f:F1} {size * 0.7f:F1} Z\" fill=\"{color}\" />");
                    sb.AppendLine($"    <path d=\"M {half + 2f:F1} {size * 0.54f:F1} L {size * 0.84f:F1} {size * 0.36f:F1} L {size * 0.84f:F1} {size * 0.7f:F1} L {half + 2f:F1} {size * 0.88f:F1} Z\" fill=\"{color}\" />");
                    break;

                case "mobius_fold":
                case "faceted_diamond":
                    sb.AppendLine($"    <polygon points=\"{half:F1},{size * 0.12f:F1} {size * 0.88f:F1},{half:F1} {half:F1},{size * 0.88f:F1} {size * 0.12f:F1},{half:F1}\" fill=\"none\" stroke=\"{color}\" stroke-width=\"{strokeWidth:F1}\" />");
                    sb.AppendLine($"    <circle cx=\"{half:F1}\" cy=\"{half:F1}\" r=\"{size * 0.16f:F1}\" fill=\"{color}\" />");
                    break;

                default: // rotational_symmetry_3
                    for (int i = 0; i < 3; i++)
                    {
                        var angle = i * 120;
                        sb.AppendLine($"    <g transform=\"rotate({angle} {half:F1} {half:F1})\">");
                        sb.AppendLine($"      <path d=\"M {half:F1} {size * 0.15f:F1} A {size * 0.35f:F1} {size * 0.35f:F1} 0 0 1 {size * 0.82f:F1} {size * 0.42f:F1} L {size * 0.72f:F1} {size * 0.54f:F1} A {size * 0.25f:F1} {size * 0.25f:F1} 0 0 0 {half:F1} {size * 0.28f:F1} Z\" fill=\"{color}\" />");
                        sb.AppendLine("    </g>");
                    }
                    break;
            }

            sb.AppendLine("  </g>");
        }
    }
}
