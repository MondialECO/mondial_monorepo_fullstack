using System.Text;
using System.Web;
using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Creator.BrandKit.LogoEngine
{
    public class MonogramLogoRenderer : ILogoMarkRenderer
    {
        public string FamilyName => BrandLogoFamilyNames.Monogram;

        public string RenderSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null)
        {
            var color = colorHex ?? "currentColor";
            var vals = parameters?.Values ?? new Dictionary<string, string>();

            var type = vals.TryGetValue("MonogramType", out var t) ? t : "two_letter_interlock";
            var frame = vals.TryGetValue("FrameStyle", out var f) ? f : "square_box";
            var stroke = vals.TryGetValue("StrokeStyle", out var st) ? st : "heavy_block";

            var name = string.IsNullOrWhiteSpace(brandName) ? "BRAND" : brandName.Trim().ToUpperInvariant();
            var words = name.Split(new[] { ' ', '-', '_' }, StringSplitOptions.RemoveEmptyEntries);

            string initials;
            if (words.Length >= 2)
            {
                initials = $"{words[0][0]}{words[1][0]}";
            }
            else if (name.Length >= 2)
            {
                initials = name[..2];
            }
            else
            {
                initials = name.Length > 0 ? name : "B";
            }

            var sb = new StringBuilder();
            sb.AppendLine("<svg viewBox=\"0 0 100 100\" width=\"100%\" height=\"100%\" xmlns=\"http://www.w3.org/2000/svg\">");

            // Render Frame
            var isSolidDisc = frame == "solid_disc";
            var frameFill = isSolidDisc ? color : "none";
            var frameStroke = isSolidDisc ? "none" : color;
            var textFill = isSolidDisc ? "#ffffff" : color;
            var frameWidth = 6.0;

            switch (frame)
            {
                case "circle_ring":
                case "solid_disc":
                    sb.AppendLine($"  <circle cx=\"50\" cy=\"50\" r=\"42\" fill=\"{frameFill}\" stroke=\"{frameStroke}\" stroke-width=\"{frameWidth}\" />");
                    break;
                case "square_box":
                    sb.AppendLine($"  <rect x=\"10\" y=\"10\" width=\"80\" height=\"80\" rx=\"6\" fill=\"none\" stroke=\"{color}\" stroke-width=\"{frameWidth}\" />");
                    break;
                case "bracket_corners":
                    sb.AppendLine($"  <path d=\"M 10 24 L 10 10 L 24 10\" fill=\"none\" stroke=\"{color}\" stroke-width=\"{frameWidth}\" stroke-linecap=\"square\" />");
                    sb.AppendLine($"  <path d=\"M 90 24 L 90 10 L 76 10\" fill=\"none\" stroke=\"{color}\" stroke-width=\"{frameWidth}\" stroke-linecap=\"square\" />");
                    sb.AppendLine($"  <path d=\"M 10 76 L 10 90 L 24 90\" fill=\"none\" stroke=\"{color}\" stroke-width=\"{frameWidth}\" stroke-linecap=\"square\" />");
                    sb.AppendLine($"  <path d=\"M 90 76 L 90 90 L 76 90\" fill=\"none\" stroke=\"{color}\" stroke-width=\"{frameWidth}\" stroke-linecap=\"square\" />");
                    break;
            }

            // Render Monogram Typography
            var fontWeight = stroke switch
            {
                "monoline" => "600",
                "duoline" => "700",
                _ => "900"
            };

            var firstChar = initials.Length > 0 ? initials[0].ToString() : "A";
            var secondChar = initials.Length > 1 ? initials[1].ToString() : "B";

            if (type == "single_letter" || initials.Length == 1)
            {
                sb.AppendLine($"  <text x=\"50\" y=\"64\" text-anchor=\"middle\" fill=\"{textFill}\" font-family=\"'Inter', 'Georgia', sans-serif\" font-size=\"46\" font-weight=\"{fontWeight}\">{HttpUtility.HtmlEncode(firstChar)}</text>");
            }
            else if (type == "two_letter_adjacent")
            {
                sb.AppendLine($"  <text x=\"34\" y=\"62\" text-anchor=\"middle\" fill=\"{textFill}\" font-family=\"'Inter', sans-serif\" font-size=\"36\" font-weight=\"{fontWeight}\">{HttpUtility.HtmlEncode(firstChar)}</text>");
                sb.AppendLine($"  <text x=\"66\" y=\"62\" text-anchor=\"middle\" fill=\"{textFill}\" font-family=\"'Inter', sans-serif\" font-size=\"36\" font-weight=\"{fontWeight}\">{HttpUtility.HtmlEncode(secondChar)}</text>");
            }
            else // two_letter_interlock or default
            {
                sb.AppendLine($"  <text x=\"40\" y=\"54\" text-anchor=\"middle\" fill=\"{textFill}\" font-family=\"'Inter', sans-serif\" font-size=\"38\" font-weight=\"{fontWeight}\">{HttpUtility.HtmlEncode(firstChar)}</text>");
                // Add optical cut for second letter if needed
                sb.AppendLine($"  <text x=\"60\" y=\"72\" text-anchor=\"middle\" fill=\"{textFill}\" font-family=\"'Inter', sans-serif\" font-size=\"38\" font-weight=\"{fontWeight}\">{HttpUtility.HtmlEncode(secondChar)}</text>");
            }

            if (stroke == "stencil_split")
            {
                sb.AppendLine($"  <line x1=\"15\" y1=\"50\" x2=\"85\" y2=\"50\" stroke=\"{(isSolidDisc ? color : "#ffffff")}\" stroke-width=\"4\" />");
            }

            sb.AppendLine("</svg>");
            return sb.ToString().Trim();
        }
    }
}
