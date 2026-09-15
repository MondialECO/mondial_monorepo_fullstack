using System.Text;
using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Creator.BrandKit.LogoEngine
{
    public class IconLogoRenderer : ILogoMarkRenderer
    {
        public string FamilyName => BrandLogoFamilyNames.Icon;

        public string RenderSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null)
        {
            var color = colorHex ?? "currentColor";
            var vals = parameters?.Values ?? new Dictionary<string, string>();

            var primitive = vals.TryGetValue("MetaphorPrimitive", out var p) ? p : "spark_intelligence";
            var construction = vals.TryGetValue("Construction", out var c) ? c : "silhouette_solid";
            var isSolid = construction == "silhouette_solid";
            var isSplit = construction == "split_halves";
            var strokeWidth = 7.0;

            var sb = new StringBuilder();
            sb.AppendLine("<svg viewBox=\"0 0 100 100\" width=\"100%\" height=\"100%\" xmlns=\"http://www.w3.org/2000/svg\">");

            switch (primitive)
            {
                case "shield_security":
                    var dShield = "M 50 14 L 84 28 L 74 66 L 50 86 L 26 66 L 16 28 Z";
                    if (isSplit)
                    {
                        sb.AppendLine($"  <path d=\"M 50 14 L 84 28 L 74 66 L 50 86 Z\" fill=\"{color}\" />");
                        sb.AppendLine($"  <path d=\"M 50 14 L 16 28 L 26 66 L 50 86 Z\" fill=\"none\" stroke=\"{color}\" stroke-width=\"{strokeWidth}\" />");
                    }
                    else if (isSolid)
                    {
                        sb.AppendLine($"  <path d=\"{dShield}\" fill=\"{color}\" />");
                        sb.AppendLine($"  <path d=\"M 50 28 L 68 38 L 60 62 L 50 74 L 40 62 L 32 38 Z\" fill=\"#ffffff\" />");
                    }
                    else
                    {
                        sb.AppendLine($"  <path d=\"{dShield}\" fill=\"none\" stroke=\"{color}\" stroke-width=\"{strokeWidth}\" stroke-linejoin=\"round\" />");
                        sb.AppendLine($"  <circle cx=\"50\" cy=\"50\" r=\"8\" fill=\"{color}\" />");
                    }
                    break;

                case "leaf_growth":
                    var dLeaf1 = "M 50 86 C 50 86 20 66 20 42 C 20 18 50 14 50 14 C 50 14 50 86 50 86 Z";
                    var dLeaf2 = "M 50 86 C 50 86 80 66 80 42 C 80 18 50 14 50 14 C 50 14 50 86 50 86 Z";
                    if (isSplit || isSolid)
                    {
                        sb.AppendLine($"  <path d=\"{dLeaf1}\" fill=\"{color}\" />");
                        sb.AppendLine($"  <path d=\"{dLeaf2}\" fill=\"{color}\" opacity=\"0.75\" />");
                    }
                    else
                    {
                        sb.AppendLine($"  <path d=\"M 50 86 C 20 66 20 42 20 42 C 20 18 50 14 50 14 C 50 14 80 18 80 42 C 80 66 50 86 50 86 Z\" fill=\"none\" stroke=\"{color}\" stroke-width=\"{strokeWidth}\" />");
                        sb.AppendLine($"  <line x1=\"50\" y1=\"24\" x2=\"50\" y2=\"76\" stroke=\"{color}\" stroke-width=\"{strokeWidth}\" stroke-linecap=\"round\" />");
                    }
                    break;

                case "node_network":
                    sb.AppendLine($"  <line x1=\"50\" y1=\"24\" x2=\"24\" y2=\"72\" stroke=\"{color}\" stroke-width=\"{strokeWidth}\" stroke-linecap=\"round\" />");
                    sb.AppendLine($"  <line x1=\"50\" y1=\"24\" x2=\"76\" y2=\"72\" stroke=\"{color}\" stroke-width=\"{strokeWidth}\" stroke-linecap=\"round\" />");
                    sb.AppendLine($"  <line x1=\"24\" y1=\"72\" x2=\"76\" y2=\"72\" stroke=\"{color}\" stroke-width=\"{strokeWidth}\" stroke-linecap=\"round\" />");
                    sb.AppendLine($"  <circle cx=\"50\" cy=\"24\" r=\"10\" fill=\"{color}\" />");
                    sb.AppendLine($"  <circle cx=\"24\" cy=\"72\" r=\"10\" fill=\"{color}\" />");
                    sb.AppendLine($"  <circle cx=\"76\" cy=\"72\" r=\"10\" fill=\"{color}\" />");
                    break;

                case "cube_infrastructure":
                    sb.AppendLine($"  <path d=\"M 50 16 L 82 34 L 50 52 L 18 34 Z\" fill=\"{color}\" />");
                    sb.AppendLine($"  <path d=\"M 18 40 L 46 56 L 46 84 L 18 68 Z\" fill=\"{color}\" />");
                    sb.AppendLine($"  <path d=\"M 54 56 L 82 40 L 82 68 L 54 84 Z\" fill=\"{color}\" />");
                    break;

                case "arch_gateway":
                    sb.AppendLine($"  <path d=\"M 20 84 L 20 48 A 30 30 0 0 1 80 48 L 80 84\" fill=\"none\" stroke=\"{color}\" stroke-width=\"{strokeWidth * 1.6}\" stroke-linecap=\"square\" />");
                    sb.AppendLine($"  <circle cx=\"50\" cy=\"48\" r=\"9\" fill=\"{color}\" />");
                    break;

                case "globe_connected":
                    sb.AppendLine($"  <circle cx=\"50\" cy=\"50\" r=\"34\" fill=\"none\" stroke=\"{color}\" stroke-width=\"{strokeWidth}\" />");
                    sb.AppendLine($"  <ellipse cx=\"50\" cy=\"50\" rx=\"16\" ry=\"34\" fill=\"none\" stroke=\"{color}\" stroke-width=\"{strokeWidth}\" />");
                    sb.AppendLine($"  <line x1=\"16\" y1=\"50\" x2=\"84\" y2=\"50\" stroke=\"{color}\" stroke-width=\"{strokeWidth}\" />");
                    break;

                default: // spark_intelligence / pillar / wave
                    sb.AppendLine($"  <path d=\"M 50 12 Q 50 50 88 50 Q 50 50 50 88 Q 50 50 12 50 Q 50 50 50 12 Z\" fill=\"{color}\" />");
                    if (!isSolid)
                    {
                        sb.AppendLine($"  <circle cx=\"50\" cy=\"50\" r=\"7\" fill=\"#ffffff\" />");
                    }
                    break;
            }

            sb.AppendLine("</svg>");
            return sb.ToString().Trim();
        }
    }
}
