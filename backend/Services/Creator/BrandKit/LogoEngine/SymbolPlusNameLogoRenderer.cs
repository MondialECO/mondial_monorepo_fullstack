using System.Text;
using System.Web;
using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Creator.BrandKit.LogoEngine
{
    public class SymbolPlusNameLogoRenderer : ILogoMarkRenderer
    {
        public string FamilyName => BrandLogoFamilyNames.SymbolPlusName;

        public string RenderSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null)
        {
            var color = colorHex ?? "currentColor";
            var vals = parameters?.Values ?? new Dictionary<string, string>();

            var badgeShape = vals.TryGetValue("BadgeShape", out var bs) ? bs : "hexagon";
            var badgeStyle = vals.TryGetValue("BadgeStyle", out var bst) ? bst : "outline_stroke";
            var glyph = vals.TryGetValue("InternalGlyph", out var ig) ? ig : "initial_letter";
            var arrangement = vals.TryGetValue("Arrangement", out var arr) ? arr : "side_by_side_left";

            var name = string.IsNullOrWhiteSpace(brandName) ? "BRAND" : brandName.Trim().ToUpperInvariant();
            var initial = name.Length > 0 ? name[0].ToString() : "B";

            var sb = new StringBuilder();
            var isStacked = arrangement.StartsWith("stacked", StringComparison.OrdinalIgnoreCase);

            if (isStacked)
            {
                sb.AppendLine("<svg viewBox=\"0 0 120 120\" width=\"100%\" height=\"100%\" xmlns=\"http://www.w3.org/2000/svg\">");
                RenderSymbol(sb, 60, 42, 28, badgeShape, badgeStyle, glyph, initial, color);
                sb.AppendLine($"  <text x=\"60\" y=\"98\" text-anchor=\"middle\" fill=\"{color}\" font-family=\"'Inter', sans-serif\" font-size=\"14\" font-weight=\"800\" letter-spacing=\"0.08em\">{HttpUtility.HtmlEncode(name)}</text>");
            }
            else
            {
                sb.AppendLine("<svg viewBox=\"0 0 200 60\" width=\"100%\" height=\"100%\" xmlns=\"http://www.w3.org/2000/svg\">");
                if (arrangement == "side_by_side_right")
                {
                    sb.AppendLine($"  <text x=\"80\" y=\"37\" text-anchor=\"middle\" fill=\"{color}\" font-family=\"'Inter', sans-serif\" font-size=\"18\" font-weight=\"800\" letter-spacing=\"0.06em\">{HttpUtility.HtmlEncode(name)}</text>");
                    RenderSymbol(sb, 165, 30, 22, badgeShape, badgeStyle, glyph, initial, color);
                }
                else
                {
                    RenderSymbol(sb, 35, 30, 22, badgeShape, badgeStyle, glyph, initial, color);
                    sb.AppendLine($"  <text x=\"118\" y=\"37\" text-anchor=\"middle\" fill=\"{color}\" font-family=\"'Inter', sans-serif\" font-size=\"18\" font-weight=\"800\" letter-spacing=\"0.06em\">{HttpUtility.HtmlEncode(name)}</text>");
                }
            }

            sb.AppendLine("</svg>");
            return sb.ToString().Trim();
        }

        private static void RenderSymbol(
            StringBuilder sb, double cx, double cy, double r,
            string shape, string style, string glyph, string initial, string color)
        {
            var isSolid = style == "solid_fill";
            var isDouble = style == "double_stroke";
            var strokeWidth = 5.0;
            var fill = isSolid ? color : "none";
            var stroke = isSolid ? "none" : color;
            var innerColor = isSolid ? "#ffffff" : color;

            // Render Badge Shape
            switch (shape)
            {
                case "square":
                    sb.AppendLine($"  <rect x=\"{cx - r}\" y=\"{cy - r}\" width=\"{r * 2}\" height=\"{r * 2}\" fill=\"{fill}\" stroke=\"{stroke}\" stroke-width=\"{strokeWidth}\" />");
                    if (isDouble) sb.AppendLine($"  <rect x=\"{cx - r + 4}\" y=\"{cy - r + 4}\" width=\"{(r - 4) * 2}\" height=\"{(r - 4) * 2}\" fill=\"none\" stroke=\"{color}\" stroke-width=\"2\" />");
                    break;
                case "rounded_rect":
                    sb.AppendLine($"  <rect x=\"{cx - r}\" y=\"{cy - r}\" width=\"{r * 2}\" height=\"{r * 2}\" rx=\"8\" fill=\"{fill}\" stroke=\"{stroke}\" stroke-width=\"{strokeWidth}\" />");
                    if (isDouble) sb.AppendLine($"  <rect x=\"{cx - r + 4}\" y=\"{cy - r + 4}\" width=\"{(r - 4) * 2}\" height=\"{(r - 4) * 2}\" rx=\"5\" fill=\"none\" stroke=\"{color}\" stroke-width=\"2\" />");
                    break;
                case "shield":
                    var dShield = $"M {cx} {cy - r} L {cx + r} {cy - r * 0.4} L {cx + r * 0.8} {cy + r * 0.4} L {cx} {cy + r} L {cx - r * 0.8} {cy + r * 0.4} L {cx - r} {cy - r * 0.4} Z";
                    sb.AppendLine($"  <path d=\"{dShield}\" fill=\"{fill}\" stroke=\"{stroke}\" stroke-width=\"{strokeWidth}\" stroke-linejoin=\"round\" />");
                    break;
                case "diamond":
                    var dDiamond = $"M {cx} {cy - r} L {cx + r} {cy} L {cx} {cy + r} L {cx - r} {cy} Z";
                    sb.AppendLine($"  <path d=\"{dDiamond}\" fill=\"{fill}\" stroke=\"{stroke}\" stroke-width=\"{strokeWidth}\" stroke-linejoin=\"round\" />");
                    break;
                case "hexagon":
                    var hx = r * 0.866;
                    var hy = r * 0.5;
                    var dHex = $"M {cx} {cy - r} L {cx + hx} {cy - hy} L {cx + hx} {cy + hy} L {cx} {cy + r} L {cx - hx} {cy + hy} L {cx - hx} {cy - hy} Z";
                    sb.AppendLine($"  <path d=\"{dHex}\" fill=\"{fill}\" stroke=\"{stroke}\" stroke-width=\"{strokeWidth}\" stroke-linejoin=\"round\" />");
                    break;
                case "cut_corner_rect":
                    var c = 6.0;
                    var dCut = $"M {cx - r + c} {cy - r} L {cx + r - c} {cy - r} L {cx + r} {cy - r + c} L {cx + r} {cy + r - c} L {cx + r - c} {cy + r} L {cx - r + c} {cy + r} L {cx - r} {cy + r - c} L {cx - r} {cy - r + c} Z";
                    sb.AppendLine($"  <path d=\"{dCut}\" fill=\"{fill}\" stroke=\"{stroke}\" stroke-width=\"{strokeWidth}\" stroke-linejoin=\"round\" />");
                    break;
                default: // circle
                    sb.AppendLine($"  <circle cx=\"{cx}\" cy=\"{cy}\" r=\"{r}\" fill=\"{fill}\" stroke=\"{stroke}\" stroke-width=\"{strokeWidth}\" />");
                    if (isDouble) sb.AppendLine($"  <circle cx=\"{cx}\" cy=\"{cy}\" r=\"{r - 4}\" fill=\"none\" stroke=\"{color}\" stroke-width=\"2\" />");
                    break;
            }

            // Render Glyph
            switch (glyph)
            {
                case "geometric_cut":
                    sb.AppendLine($"  <line x1=\"{cx - r * 0.5}\" y1=\"{cy - r * 0.5}\" x2=\"{cx + r * 0.5}\" y2=\"{cy + r * 0.5}\" stroke=\"{innerColor}\" stroke-width=\"4\" stroke-linecap=\"round\" />");
                    break;
                case "diagonal_cross":
                    sb.AppendLine($"  <line x1=\"{cx - r * 0.45}\" y1=\"{cy - r * 0.45}\" x2=\"{cx + r * 0.45}\" y2=\"{cy + r * 0.45}\" stroke=\"{innerColor}\" stroke-width=\"4\" stroke-linecap=\"round\" />");
                    sb.AppendLine($"  <line x1=\"{cx + r * 0.45}\" y1=\"{cy - r * 0.45}\" x2=\"{cx - r * 0.45}\" y2=\"{cy + r * 0.45}\" stroke=\"{innerColor}\" stroke-width=\"4\" stroke-linecap=\"round\" />");
                    break;
                case "concentric_ring":
                    sb.AppendLine($"  <circle cx=\"{cx}\" cy=\"{cy}\" r=\"{r * 0.45}\" fill=\"none\" stroke=\"{innerColor}\" stroke-width=\"4\" />");
                    break;
                case "horizontal_bars":
                    sb.AppendLine($"  <line x1=\"{cx - r * 0.45}\" y1=\"{cy - 4}\" x2=\"{cx + r * 0.45}\" y2=\"{cy - 4}\" stroke=\"{innerColor}\" stroke-width=\"3.5\" stroke-linecap=\"round\" />");
                    sb.AppendLine($"  <line x1=\"{cx - r * 0.45}\" y1=\"{cy + 4}\" x2=\"{cx + r * 0.45}\" y2=\"{cy + 4}\" stroke=\"{innerColor}\" stroke-width=\"3.5\" stroke-linecap=\"round\" />");
                    break;
                default: // initial_letter
                    var fontSize = r * 1.1;
                    var dy = fontSize * 0.36;
                    sb.AppendLine($"  <text x=\"{cx}\" y=\"{cy + dy}\" text-anchor=\"middle\" fill=\"{innerColor}\" font-family=\"'Inter', sans-serif\" font-size=\"{fontSize:F0}\" font-weight=\"900\">{HttpUtility.HtmlEncode(initial)}</text>");
                    break;
            }
        }
    }
}
