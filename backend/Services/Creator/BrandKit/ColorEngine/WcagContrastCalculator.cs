using System.Globalization;
using Microsoft.Extensions.Logging;

namespace WebApp.Services.Creator.BrandKit.ColorEngine
{
    /// <summary>
    /// Deterministic WCAG 2.1 relative luminance and contrast ratio calculator.
    /// Never generated; strictly calculated in code with mathematical precision.
    /// </summary>
    public static class WcagContrastCalculator
    {
        /// <summary>
        /// Parses a 3-digit or 6-digit hex color string into (R, G, B) in [0, 255].
        /// </summary>
        public static (int R, int G, int B) HexToRgb(string hex)
        {
            if (string.IsNullOrWhiteSpace(hex))
                return (0, 0, 0);

            var clean = hex.Trim().TrimStart('#');
            if (clean.Length == 3)
            {
                clean = $"{clean[0]}{clean[0]}{clean[1]}{clean[1]}{clean[2]}{clean[2]}";
            }

            if (clean.Length != 6)
                return (0, 0, 0);

            if (int.TryParse(clean[..2], NumberStyles.HexNumber, CultureInfo.InvariantCulture, out int r) &&
                int.TryParse(clean[2..4], NumberStyles.HexNumber, CultureInfo.InvariantCulture, out int g) &&
                int.TryParse(clean[4..6], NumberStyles.HexNumber, CultureInfo.InvariantCulture, out int b))
            {
                return (r, g, b);
            }

            return (0, 0, 0);
        }

        public static string RgbToHex(int r, int g, int b)
        {
            r = Math.Clamp(r, 0, 255);
            g = Math.Clamp(g, 0, 255);
            b = Math.Clamp(b, 0, 255);
            return $"#{r:X2}{g:X2}{b:X2}";
        }

        /// <summary>
        /// Computes WCAG 2.1 relative luminance L for an sRGB color.
        /// </summary>
        public static double CalculateLuminance(int r, int g, int b)
        {
            double rLin = Linearize(r / 255.0);
            double gLin = Linearize(g / 255.0);
            double bLin = Linearize(b / 255.0);

            return (0.2126 * rLin) + (0.7152 * gLin) + (0.0722 * bLin);
        }

        private static double Linearize(double val)
        {
            return val <= 0.03928
                ? val / 12.92
                : Math.Pow((val + 0.055) / 1.055, 2.4);
        }

        /// <summary>
        /// Computes WCAG 2.1 contrast ratio: (L1 + 0.05) / (L2 + 0.05).
        /// Returns value in [1.0, 21.0] rounded to 1 decimal place.
        /// </summary>
        public static double CalculateContrastRatio(string foregroundHex, string backgroundHex)
        {
            var (fgR, fgG, fgB) = HexToRgb(foregroundHex);
            var (bgR, bgG, bgB) = HexToRgb(backgroundHex);

            double fgLum = CalculateLuminance(fgR, fgG, fgB);
            double bgLum = CalculateLuminance(bgR, bgG, bgB);

            double lighter = Math.Max(fgLum, bgLum);
            double darker = Math.Min(fgLum, bgLum);

            double ratio = (lighter + 0.05) / (darker + 0.05);
            return Math.Round(ratio, 1);
        }

        /// <summary>
        /// Determines WCAG verdict ("AAA", "AA", "AA_Large", "FAIL").
        /// </summary>
        public static string GetContrastVerdict(double ratio, bool isLargeTextOrAccent = false)
        {
            if (ratio >= 7.0) return "AAA";
            if (ratio >= 4.5) return "AA";
            if (ratio >= 3.0) return isLargeTextOrAccent ? "AA_Large" : "FAIL";
            return "FAIL";
        }

        /// <summary>
        /// Deterministically adjusts foreground color lightness via HSL stepping if contrast against background is insufficient.
        /// </summary>
        public static (string AdjustedHex, double NewRatio, string NewVerdict, bool WasAdjusted) AdjustLightnessForContrast(
            string foregroundHex,
            string backgroundHex,
            double minTargetRatio = 4.5,
            bool isLargeOrAccent = false,
            ILogger? logger = null,
            string roleName = "Unknown")
        {
            double initialRatio = CalculateContrastRatio(foregroundHex, backgroundHex);
            string initialVerdict = GetContrastVerdict(initialRatio, isLargeOrAccent);

            if (initialRatio >= minTargetRatio)
            {
                return (foregroundHex.ToUpperInvariant(), initialRatio, initialVerdict, false);
            }

            var (fgR, fgG, fgB) = HexToRgb(foregroundHex);
            var (bgR, bgG, bgB) = HexToRgb(backgroundHex);

            double bgLum = CalculateLuminance(bgR, bgG, bgB);
            // If background is light (lum >= 0.18), we darken the foreground; otherwise we lighten it.
            bool stepDarker = bgLum >= 0.18;

            RgbToHsl(fgR, fgG, fgB, out double h, out double s, out double l);

            double currentL = l;
            string bestHex = foregroundHex;
            double bestRatio = initialRatio;
            string bestVerdict = initialVerdict;

            const double stepSize = 0.02;
            const int maxSteps = 50;

            for (int step = 0; step < maxSteps; step++)
            {
                currentL = stepDarker ? currentL - stepSize : currentL + stepSize;
                currentL = Math.Clamp(currentL, 0.0, 1.0);

                HslToRgb(h, s, currentL, out int newR, out int newG, out int newB);
                string testHex = RgbToHex(newR, newG, newB);
                double testRatio = CalculateContrastRatio(testHex, backgroundHex);
                string testVerdict = GetContrastVerdict(testRatio, isLargeOrAccent);

                if (testRatio > bestRatio)
                {
                    bestHex = testHex;
                    bestRatio = testRatio;
                    bestVerdict = testVerdict;
                }

                if (testRatio >= minTargetRatio)
                {
                    bestHex = testHex;
                    bestRatio = testRatio;
                    bestVerdict = testVerdict;
                    break;
                }

                if (currentL <= 0.0 || currentL >= 1.0)
                    break;
            }

            if (logger != null && bestHex != foregroundHex)
            {
                logger.LogInformation(
                    "Deterministic contrast adjustment applied to role '{RoleName}': InitialHex={InitialHex} (Ratio={InitialRatio}, Verdict={InitialVerdict}) -> AdjustedHex={AdjustedHex} (Ratio={NewRatio}, Verdict={NewVerdict}) against Background={BgHex}",
                    roleName,
                    foregroundHex.ToUpperInvariant(),
                    initialRatio,
                    initialVerdict,
                    bestHex.ToUpperInvariant(),
                    bestRatio,
                    bestVerdict,
                    backgroundHex.ToUpperInvariant());
            }

            return (bestHex.ToUpperInvariant(), bestRatio, bestVerdict, true);
        }

        // --- HSL Helpers ---

        public static void RgbToHsl(int r, int g, int b, out double h, out double s, out double l)
        {
            double rNorm = r / 255.0;
            double gNorm = g / 255.0;
            double bNorm = b / 255.0;

            double max = Math.Max(rNorm, Math.Max(gNorm, bNorm));
            double min = Math.Min(rNorm, Math.Min(gNorm, bNorm));
            double delta = max - min;

            l = (max + min) / 2.0;

            if (delta == 0)
            {
                h = 0;
                s = 0;
            }
            else
            {
                s = l > 0.5 ? delta / (2.0 - max - min) : delta / (max + min);

                if (max == rNorm)
                    h = ((gNorm - bNorm) / delta) + (gNorm < bNorm ? 6.0 : 0.0);
                else if (max == gNorm)
                    h = ((bNorm - rNorm) / delta) + 2.0;
                else
                    h = ((rNorm - gNorm) / delta) + 4.0;

                h *= 60.0;
            }
        }

        public static void HslToRgb(double h, double s, double l, out int r, out int g, out int b)
        {
            if (s == 0)
            {
                int val = (int)Math.Round(l * 255.0);
                r = val;
                g = val;
                b = val;
                return;
            }

            double q = l < 0.5 ? l * (1.0 + s) : l + s - (l * s);
            double p = (2.0 * l) - q;
            double hNorm = h / 360.0;

            r = (int)Math.Round(HueToRgb(p, q, hNorm + (1.0 / 3.0)) * 255.0);
            g = (int)Math.Round(HueToRgb(p, q, hNorm) * 255.0);
            b = (int)Math.Round(HueToRgb(p, q, hNorm - (1.0 / 3.0)) * 255.0);
        }

        private static double HueToRgb(double p, double q, double t)
        {
            if (t < 0) t += 1.0;
            if (t > 1) t -= 1.0;
            if (t < 1.0 / 6.0) return p + ((q - p) * 6.0 * t);
            if (t < 1.0 / 2.0) return q;
            if (t < 2.0 / 3.0) return p + ((q - p) * ((2.0 / 3.0) - t) * 6.0);
            return p;
        }
    }
}
