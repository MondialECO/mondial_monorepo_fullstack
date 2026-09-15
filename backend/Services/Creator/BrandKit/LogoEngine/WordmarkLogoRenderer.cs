using System.Text;
using System.Web;
using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Creator.BrandKit.LogoEngine
{
    public class WordmarkLogoRenderer : ILogoMarkRenderer
    {
        public string FamilyName => BrandLogoFamilyNames.Wordmark;

        public string RenderSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null)
        {
            var color = colorHex ?? "currentColor";
            var vals = parameters?.Values ?? new Dictionary<string, string>();

            var layout = vals.TryGetValue("Layout", out var l) ? l : "single_line";
            var letterCase = vals.TryGetValue("LetterCase", out var lc) ? lc : "uppercase";
            var accent = vals.TryGetValue("AccentElement", out var a) ? a : "none";
            var fontCat = vals.TryGetValue("FontCategory", out var fc) ? fc : "geometric_sans";
            var letterSpacing = vals.TryGetValue("LetterSpacing", out var ls) ? ls : "normal";

            var name = string.IsNullOrWhiteSpace(brandName) ? "BRAND" : brandName.Trim();
            var displayText = letterCase switch
            {
                "lowercase" => name.ToLowerInvariant(),
                "titlecase" => char.ToUpperInvariant(name[0]) + (name.Length > 1 ? name[1..].ToLowerInvariant() : ""),
                _ => name.ToUpperInvariant()
            };

            var fontFamily = fontCat switch
            {
                "humanist_sans" => "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
                "high_contrast_serif" => "Georgia, 'Times New Roman', serif",
                "slab_serif" => "'Courier New', Courier, monospace, serif",
                "mono" => "'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
                _ => "'Inter', 'Helvetica Neue', Arial, sans-serif"
            };

            var fontWeight = (layout == "tight_bold" || fontCat == "slab_serif") ? "800" : "700";
            var spacingValue = letterSpacing switch
            {
                "tight" => "-0.05em",
                "wide" => "0.18em",
                "ultra_wide" => "0.35em",
                _ => "0.04em"
            };

            var sb = new StringBuilder();
            sb.AppendLine("<svg viewBox=\"0 0 200 60\" width=\"100%\" height=\"100%\" xmlns=\"http://www.w3.org/2000/svg\">");

            var encodedText = HttpUtility.HtmlEncode(displayText);

            if (layout == "stacked_two_line" && displayText.Contains(' '))
            {
                var parts = displayText.Split(' ', 2);
                sb.AppendLine($"  <text x=\"100\" y=\"26\" text-anchor=\"middle\" fill=\"{color}\" font-family=\"{fontFamily}\" font-size=\"20\" font-weight=\"{fontWeight}\" letter-spacing=\"{spacingValue}\">{HttpUtility.HtmlEncode(parts[0])}</text>");
                sb.AppendLine($"  <text x=\"100\" y=\"48\" text-anchor=\"middle\" fill=\"{color}\" font-family=\"{fontFamily}\" font-size=\"20\" font-weight=\"{fontWeight}\" letter-spacing=\"{spacingValue}\">{HttpUtility.HtmlEncode(parts[1])}</text>");
            }
            else
            {
                sb.AppendLine($"  <text x=\"100\" y=\"37\" text-anchor=\"middle\" fill=\"{color}\" font-family=\"{fontFamily}\" font-size=\"24\" font-weight=\"{fontWeight}\" letter-spacing=\"{spacingValue}\">{encodedText}</text>");
            }

            // Accents
            switch (accent)
            {
                case "terminal_dot":
                    sb.AppendLine($"  <circle cx=\"185\" cy=\"35\" r=\"4\" fill=\"{color}\" />");
                    break;
                case "baseline_underline":
                    sb.AppendLine($"  <rect x=\"30\" y=\"46\" width=\"140\" height=\"4\" rx=\"2\" fill=\"{color}\" />");
                    break;
                case "overscore":
                    sb.AppendLine($"  <rect x=\"30\" y=\"12\" width=\"140\" height=\"4\" rx=\"2\" fill=\"{color}\" />");
                    break;
                case "split_dot":
                    sb.AppendLine($"  <circle cx=\"20\" cy=\"33\" r=\"3.5\" fill=\"{color}\" />");
                    sb.AppendLine($"  <circle cx=\"180\" cy=\"33\" r=\"3.5\" fill=\"{color}\" />");
                    break;
            }

            sb.AppendLine("</svg>");
            return sb.ToString().Trim();
        }
    }
}
