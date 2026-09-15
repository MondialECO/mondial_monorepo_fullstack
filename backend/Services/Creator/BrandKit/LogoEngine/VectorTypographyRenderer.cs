using SkiaSharp;

namespace WebApp.Services.Creator.BrandKit.LogoEngine
{
    public class VectorTextResult
    {
        public string SvgPathData { get; set; } = string.Empty;
        public float Width { get; set; }
        public float Height { get; set; }
        public float Left { get; set; }
        public float Top { get; set; }
        public bool IsStacked { get; set; }
        public float EffectiveFontSize { get; set; }
    }

    public static class VectorTypographyRenderer
    {
        private static readonly Dictionary<string, string[]> FontFallbacks = new(StringComparer.OrdinalIgnoreCase)
        {
            ["high_contrast_serif"] = new[] { "Playfair Display", "Cinzel", "Didot", "Georgia", "Times New Roman" },
            ["geometric_sans"] = new[] { "Space Grotesk", "Outfit", "Inter", "Arial", "Century Gothic" },
            ["humanist_sans"] = new[] { "Plus Jakarta Sans", "Inter", "Segoe UI", "Trebuchet MS", "Helvetica" },
            ["slab_serif"] = new[] { "Syne", "Rockwell", "Arial Black", "Impact" },
            ["mono"] = new[] { "JetBrains Mono", "Space Mono", "Consolas", "Courier New", "monospace" }
        };

        public static SKTypeface ResolveTypeface(string fontCategory, bool isBold = true)
        {
            var weight = isBold ? SKFontStyleWeight.Bold : SKFontStyleWeight.Normal;
            if (FontFallbacks.TryGetValue(fontCategory, out var candidates))
            {
                foreach (var name in candidates)
                {
                    var tf = SKTypeface.FromFamilyName(name, weight, SKFontStyleWidth.Normal, SKFontStyleSlant.Upright);
                    if (tf != null && !string.Equals(tf.FamilyName, "Default", StringComparison.OrdinalIgnoreCase))
                    {
                        return tf;
                    }
                }
            }

            return SKTypeface.FromFamilyName("Arial", weight, SKFontStyleWidth.Normal, SKFontStyleSlant.Upright)
                   ?? SKTypeface.Default;
        }

        public static VectorTextResult RenderTextToVectorPath(
            string text,
            string fontCategory,
            float initialFontSize = 24f,
            string letterSpacing = "normal",
            float horizontalBudget = 260f,
            bool allowTwoLineStacking = true,
            string letterCase = "uppercase")
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return new VectorTextResult();
            }

            var processedText = letterCase.ToLowerInvariant() switch
            {
                "uppercase" => text.ToUpperInvariant(),
                "lowercase" => text.ToLowerInvariant(),
                "titlecase" => char.ToUpperInvariant(text[0]) + text.Substring(1).ToLowerInvariant(),
                _ => text
            };

            var trackingEm = letterSpacing.ToLowerInvariant() switch
            {
                "tight" => -0.02f,
                "normal" => 0.04f,
                "wide" => 0.15f,
                "ultra_wide" => 0.25f,
                _ => 0.05f
            };

            var typeface = ResolveTypeface(fontCategory, isBold: true);

            // 1. Check if single line fits within budget
            var singleLineResult = MeasureAndBuildPath(processedText, typeface, initialFontSize, trackingEm);
            if (singleLineResult.Width <= horizontalBudget)
            {
                return singleLineResult;
            }

            // 2. If text has multiple words and exceeds budget, try 2-line stacking
            var words = processedText.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (allowTwoLineStacking && words.Length > 1)
            {
                var mid = (words.Length + 1) / 2;
                var line1 = string.Join(" ", words.Take(mid));
                var line2 = string.Join(" ", words.Skip(mid));

                var stackedFontSize = Math.Max(18f, initialFontSize * 0.9f);
                var stackedResult = BuildTwoLineStackedPath(line1, line2, typeface, stackedFontSize, trackingEm);
                if (stackedResult.Width <= horizontalBudget || stackedFontSize <= 18f)
                {
                    return stackedResult;
                }
            }

            // 3. Single unbroken word or multi-word scaling down toward font floor
            var fontSize = initialFontSize;
            const float fontFloor = 16f;

            while (fontSize > fontFloor)
            {
                fontSize -= 2f;
                var res = MeasureAndBuildPath(processedText, typeface, fontSize, trackingEm);
                if (res.Width <= horizontalBudget)
                {
                    return res;
                }
            }

            // At floor: return path at floor size with measured width
            return MeasureAndBuildPath(processedText, typeface, fontFloor, trackingEm);
        }

        private static VectorTextResult MeasureAndBuildPath(
            string text,
            SKTypeface typeface,
            float fontSize,
            float trackingEm)
        {
            using var font = new SKFont(typeface, fontSize);
            using var combinedPath = new SKPath();
            float currentX = 0f;
            var trackingOffset = trackingEm * fontSize;

            var glyphs = font.GetGlyphs(text);
            var widths = font.GetGlyphWidths(glyphs);

            for (int i = 0; i < glyphs.Length; i++)
            {
                var glyph = glyphs[i];
                var charWidth = widths[i];

                if (text[i] != ' ')
                {
                    using var charPath = font.GetGlyphPath(glyph);
                    if (charPath != null && !charPath.IsEmpty)
                    {
                        using var offsetPath = new SKPath(charPath);
                        offsetPath.Offset(currentX, 0);
                        combinedPath.AddPath(offsetPath);
                    }
                }

                currentX += charWidth + trackingOffset;
            }

            var bounds = combinedPath.TightBounds;
            var totalWidth = currentX > 0 ? currentX - trackingOffset : 0;

            return new VectorTextResult
            {
                SvgPathData = combinedPath.ToSvgPathData(),
                Width = Math.Max(totalWidth, bounds.Width),
                Height = bounds.Height > 0 ? bounds.Height : fontSize,
                Left = bounds.Left,
                Top = bounds.Top,
                IsStacked = false,
                EffectiveFontSize = fontSize
            };
        }

        private static VectorTextResult BuildTwoLineStackedPath(
            string line1,
            string line2,
            SKTypeface typeface,
            float fontSize,
            float trackingEm)
        {
            using var font = new SKFont(typeface, fontSize);
            var lineSpacing = fontSize * 1.2f;
            using var combinedPath = new SKPath();
            var trackingOffset = trackingEm * fontSize;

            // Line 1
            float x1 = 0f;
            var g1 = font.GetGlyphs(line1);
            var w1 = font.GetGlyphWidths(g1);
            for (int i = 0; i < g1.Length; i++)
            {
                if (line1[i] != ' ')
                {
                    using var cp = font.GetGlyphPath(g1[i]);
                    if (cp != null && !cp.IsEmpty)
                    {
                        using var op = new SKPath(cp);
                        op.Offset(x1, -lineSpacing * 0.5f);
                        combinedPath.AddPath(op);
                    }
                }
                x1 += w1[i] + trackingOffset;
            }

            // Line 2
            float x2 = 0f;
            var g2 = font.GetGlyphs(line2);
            var w2 = font.GetGlyphWidths(g2);
            for (int i = 0; i < g2.Length; i++)
            {
                if (line2[i] != ' ')
                {
                    using var cp = font.GetGlyphPath(g2[i]);
                    if (cp != null && !cp.IsEmpty)
                    {
                        using var op = new SKPath(cp);
                        op.Offset(x2, lineSpacing * 0.5f);
                        combinedPath.AddPath(op);
                    }
                }
                x2 += w2[i] + trackingOffset;
            }

            var bounds = combinedPath.TightBounds;
            var maxWidth = Math.Max(x1 - trackingOffset, x2 - trackingOffset);

            return new VectorTextResult
            {
                SvgPathData = combinedPath.ToSvgPathData(),
                Width = Math.Max(maxWidth, bounds.Width),
                Height = bounds.Height,
                Left = bounds.Left,
                Top = bounds.Top,
                IsStacked = true,
                EffectiveFontSize = fontSize
            };
        }
    }
}
