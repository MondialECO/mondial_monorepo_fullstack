using System.Text;
using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Creator.BrandKit.LogoEngine
{
    public class MinimalLogoRenderer : ILogoMarkRenderer
    {
        public string FamilyName => BrandLogoFamilyNames.Minimal;

        public string RenderSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null)
        {
            var color = colorHex ?? "currentColor";
            var vals = parameters?.Values ?? new Dictionary<string, string>();

            var primitive = vals.TryGetValue("Primitive", out var p) ? p : "sliced_circle";
            var orientation = vals.TryGetValue("Orientation", out var o) ? o : "0_deg";
            var balance = vals.TryGetValue("WeightBalance", out var b) ? b : "monolithic_solid";

            var rotAngle = orientation switch
            {
                "45_deg" => 45,
                "90_deg" => 90,
                "180_deg" => 180,
                "270_deg" => 270,
                _ => 0
            };

            var sb = new StringBuilder();
            sb.AppendLine("<svg viewBox=\"0 0 100 100\" width=\"100%\" height=\"100%\" xmlns=\"http://www.w3.org/2000/svg\">");

            sb.AppendLine($"  <g transform=\"rotate({rotAngle} 50 50)\">");

            switch (primitive)
            {
                case "quadrant_arc":
                    sb.AppendLine($"    <path d=\"M 20 80 A 60 60 0 0 1 80 20 L 80 80 Z\" fill=\"{color}\" />");
                    if (balance == "contrast_duo")
                    {
                        sb.AppendLine($"    <circle cx=\"42\" cy=\"42\" r=\"10\" fill=\"#ffffff\" />");
                    }
                    break;

                case "offset_bars":
                    sb.AppendLine($"    <rect x=\"22\" y=\"20\" width=\"16\" height=\"60\" rx=\"8\" fill=\"{color}\" />");
                    sb.AppendLine($"    <rect x=\"44\" y=\"32\" width=\"16\" height=\"48\" rx=\"8\" fill=\"{color}\" />");
                    sb.AppendLine($"    <rect x=\"66\" y=\"44\" width=\"16\" height=\"36\" rx=\"8\" fill=\"{color}\" />");
                    break;

                case "chevron_fold":
                    sb.AppendLine($"    <path d=\"M 20 28 L 50 58 L 80 28 L 80 46 L 50 76 L 20 46 Z\" fill=\"{color}\" />");
                    break;

                case "diagonal_slash":
                    sb.AppendLine($"    <rect x=\"42\" y=\"10\" width=\"16\" height=\"80\" rx=\"8\" transform=\"rotate(35 50 50)\" fill=\"{color}\" />");
                    if (balance == "contrast_duo")
                    {
                        sb.AppendLine($"    <circle cx=\"24\" cy=\"50\" r=\"8\" fill=\"{color}\" />");
                        sb.AppendLine($"    <circle cx=\"76\" cy=\"50\" r=\"8\" fill=\"{color}\" />");
                    }
                    break;

                case "concentric_arc":
                    sb.AppendLine($"    <path d=\"M 20 50 A 30 30 0 1 1 80 50\" fill=\"none\" stroke=\"{color}\" stroke-width=\"12\" stroke-linecap=\"round\" />");
                    sb.AppendLine($"    <path d=\"M 34 50 A 16 16 0 1 1 66 50\" fill=\"none\" stroke=\"{color}\" stroke-width=\"8\" stroke-linecap=\"round\" />");
                    break;

                default: // sliced_circle
                    sb.AppendLine($"    <path d=\"M 50 16 A 34 34 0 0 1 84 50 L 16 50 A 34 34 0 0 1 50 16 Z\" fill=\"{color}\" />");
                    sb.AppendLine($"    <path d=\"M 16 58 L 84 58 A 34 34 0 0 1 50 92 A 34 34 0 0 1 16 58 Z\" fill=\"{color}\" />");
                    break;
            }

            sb.AppendLine("  </g>");
            sb.AppendLine("</svg>");
            return sb.ToString().Trim();
        }
    }
}
