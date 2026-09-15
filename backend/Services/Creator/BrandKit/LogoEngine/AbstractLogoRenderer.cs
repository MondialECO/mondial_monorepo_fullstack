using System.Text;
using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Creator.BrandKit.LogoEngine
{
    public class AbstractLogoRenderer : ILogoMarkRenderer
    {
        public string FamilyName => BrandLogoFamilyNames.Abstract;

        public string RenderSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null)
        {
            var color = colorHex ?? "currentColor";
            var vals = parameters?.Values ?? new Dictionary<string, string>();

            var geomType = vals.TryGetValue("GeometryType", out var gt) ? gt : "rotational_symmetry_3";
            var weight = vals.TryGetValue("StrokeWeight", out var sw) ? sw : "heavy_bold";
            var strokeWidth = weight switch
            {
                "thin_precision" => 6.0,
                "medium" => 8.0,
                _ => 11.0
            };

            var sb = new StringBuilder();
            sb.AppendLine("<svg viewBox=\"0 0 100 100\" width=\"100%\" height=\"100%\" xmlns=\"http://www.w3.org/2000/svg\">");

            switch (geomType)
            {
                case "intersecting_rings":
                    sb.AppendLine($"  <circle cx=\"40\" cy=\"50\" r=\"24\" fill=\"none\" stroke=\"{color}\" stroke-width=\"{strokeWidth}\" />");
                    sb.AppendLine($"  <circle cx=\"60\" cy=\"50\" r=\"24\" fill=\"none\" stroke=\"{color}\" stroke-width=\"{strokeWidth}\" />");
                    break;

                case "nested_polygons":
                    sb.AppendLine($"  <rect x=\"18\" y=\"18\" width=\"64\" height=\"64\" rx=\"8\" fill=\"none\" stroke=\"{color}\" stroke-width=\"{strokeWidth}\" />");
                    sb.AppendLine($"  <rect x=\"33\" y=\"33\" width=\"34\" height=\"34\" rx=\"4\" fill=\"none\" stroke=\"{color}\" stroke-width=\"{Math.Max(6, strokeWidth * 0.75)}\" />");
                    break;

                case "rotational_symmetry_4":
                    for (int i = 0; i < 4; i++)
                    {
                        var angle = i * 90;
                        sb.AppendLine($"  <g transform=\"rotate({angle} 50 50)\">");
                        sb.AppendLine($"    <path d=\"M 50 18 L 74 18 A 8 8 0 0 1 82 26 L 82 50\" fill=\"none\" stroke=\"{color}\" stroke-width=\"{strokeWidth}\" stroke-linecap=\"round\" stroke-linejoin=\"round\" />");
                        sb.AppendLine("  </g>");
                    }
                    break;

                case "isometric_cube":
                    // Three diamond faces of an isometric cube with clear gap
                    sb.AppendLine($"  <path d=\"M 50 14 L 80 32 L 50 50 L 20 32 Z\" fill=\"{color}\" />");
                    sb.AppendLine($"  <path d=\"M 18 36 L 48 54 L 48 88 L 18 70 Z\" fill=\"{color}\" opacity=\"0.85\" />");
                    sb.AppendLine($"  <path d=\"M 52 54 L 82 36 L 82 70 L 52 88 Z\" fill=\"{color}\" opacity=\"0.7\" />");
                    break;

                case "mobius_fold":
                    sb.AppendLine($"  <path d=\"M 26 50 C 26 28, 50 24, 74 50 C 50 76, 26 72, 26 50 Z\" fill=\"none\" stroke=\"{color}\" stroke-width=\"{strokeWidth}\" />");
                    sb.AppendLine($"  <circle cx=\"50\" cy=\"50\" r=\"8\" fill=\"{color}\" />");
                    break;

                case "wave_frequencies":
                    for (int y = 30; y <= 70; y += 14)
                    {
                        sb.AppendLine($"  <path d=\"M 18 {y} Q 34 {y - 10} 50 {y} T 82 {y}\" fill=\"none\" stroke=\"{color}\" stroke-width=\"6\" stroke-linecap=\"round\" />");
                    }
                    break;

                default: // rotational_symmetry_3
                    for (int i = 0; i < 3; i++)
                    {
                        var angle = i * 120;
                        sb.AppendLine($"  <g transform=\"rotate({angle} 50 50)\">");
                        sb.AppendLine($"    <path d=\"M 50 16 A 34 34 0 0 1 78 40 L 62 48 A 16 16 0 0 0 50 30 Z\" fill=\"{color}\" />");
                        sb.AppendLine("  </g>");
                    }
                    break;
            }

            sb.AppendLine("</svg>");
            return sb.ToString().Trim();
        }
    }
}
