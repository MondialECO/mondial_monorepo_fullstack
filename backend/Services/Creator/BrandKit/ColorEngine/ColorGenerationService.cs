using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using WebApp.Configuration.AiOptions;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Ai;
using WebApp.Services.Ai.Providers;
using BrandKitModel = WebApp.Models.DatabaseModels.BrandKit;

namespace WebApp.Services.Creator.BrandKit.ColorEngine
{
    public class ColorGenerationService : IColorGenerationService
    {
        public const int DefaultMaxOutputTokens = 4500;

        private readonly IAiProvider? _aiProvider;
        private readonly IModelRouter? _modelRouter;
        private readonly AiSettings _settings;
        private readonly ILogger<ColorGenerationService> _logger;

        public ColorGenerationService(
            IAiProvider? aiProvider = null,
            IModelRouter? modelRouter = null,
            ILogger<ColorGenerationService>? logger = null,
            IOptions<AiSettings>? aiSettings = null)
        {
            _aiProvider = aiProvider;
            _modelRouter = modelRouter;
            _settings = aiSettings?.Value ?? new AiSettings();
            _logger = logger ?? NullLogger<ColorGenerationService>.Instance;
        }

        public BrandColors DeriveInitialColors(BrandKitModel kit, CreatorIdea idea)
        {
            var selectedCand = kit.Direction?.Candidates?.FirstOrDefault(c => c.Key == kit.Direction?.SelectedDirectionKey)
                               ?? kit.Direction?.Candidates?.FirstOrDefault();

            var logoConcept = kit.Logo?.Concepts?.FirstOrDefault(c => c.Key == kit.Logo?.SelectedConceptKey)
                              ?? kit.Logo?.Concepts?.FirstOrDefault();

            var palette = selectedCand?.ColorPalette ?? new List<string>();

            string primaryHex = palette.Count > 0 ? palette[0] : "#1A1A24";
            string secondaryHex = palette.Count > 1 ? palette[1] : "#3C61DD";
            string accentHex = palette.Count > 2 ? palette[2] : "#00D084";
            string backgroundHex = "#FFFFFF";
            string textHex = "#0F172A";

            // If direction provided a 4th neutral light color, check if it makes a good background
            if (palette.Count > 3)
            {
                var (bgR, bgG, bgB) = WcagContrastCalculator.HexToRgb(palette[3]);
                double bgLum = WcagContrastCalculator.CalculateLuminance(bgR, bgG, bgB);
                if (bgLum >= 0.85) // Crisp light surface
                {
                    backgroundHex = palette[3];
                }
            }

            return BuildAndVerifyBrandColors(
                primaryHex,
                secondaryHex,
                accentHex,
                backgroundHex,
                textHex,
                regenerateCount: 0,
                provenance: "derived");
        }

        public async Task<BrandColors> RegenerateColorsAsync(
            BrandKitModel kit,
            CreatorIdea idea,
            CancellationToken cancellationToken = default)
        {
            var brandName = !string.IsNullOrWhiteSpace(kit?.Strategy?.NameDisplayForm)
                ? kit.Strategy.NameDisplayForm
                : (!string.IsNullOrWhiteSpace(kit?.Strategy?.BusinessName)
                    ? kit.Strategy.BusinessName
                    : (idea?.Project?.Name ?? "Brand"));

            var strategy = kit?.Strategy ?? new BrandStrategy();
            var currentColors = kit?.Colors?.Roles ?? new List<BrandColorRole>();
            var currentPrimary = currentColors.FirstOrDefault(r => r.RoleName == BrandColorRoleNames.Primary)?.Hex ?? "#1A1A24";

            string? rawAiJson = null;
            if (_aiProvider != null && _modelRouter != null)
            {
                try
                {
                    rawAiJson = await QueryAiForColorPaletteAsync(brandName, strategy, kit?.Direction, currentColors, cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "AI Color regeneration failed for {BrandName}. Falling back to harmonic synthesis.", brandName);
                }
            }

            string primaryHex = "#1A1A24";
            string secondaryHex = "#3C61DD";
            string accentHex = "#00D084";
            string backgroundHex = "#FFFFFF";
            string textHex = "#0F172A";
            string provenance = "ai";

            if (!string.IsNullOrWhiteSpace(rawAiJson) && TryParsePalette(rawAiJson, out var parsed))
            {
                primaryHex = parsed.Primary;
                secondaryHex = parsed.Secondary;
                accentHex = parsed.Accent;
                backgroundHex = parsed.Background;
                textHex = parsed.Text;
            }
            else
            {
                // Fallback deterministic harmonic rotation
                provenance = "fallback";
                var harmonic = SynthesizeHarmonicPalette(currentPrimary, kit?.Direction);
                primaryHex = harmonic.Primary;
                secondaryHex = harmonic.Secondary;
                accentHex = harmonic.Accent;
                backgroundHex = harmonic.Background;
                textHex = harmonic.Text;
            }

            int nextRegenCount = (kit?.Colors?.RegenerateCount ?? 0) + 1;
            return BuildAndVerifyBrandColors(
                primaryHex,
                secondaryHex,
                accentHex,
                backgroundHex,
                textHex,
                regenerateCount: nextRegenCount,
                provenance: provenance);
        }

        private async Task<string?> QueryAiForColorPaletteAsync(
            string brandName,
            BrandStrategy strategy,
            BrandDirection? direction,
            List<BrandColorRole> currentRoles,
            CancellationToken cancellationToken)
        {
            if (_modelRouter == null)
                throw new InvalidOperationException("IModelRouter is required for color generation model resolution.");

            var modelId = _modelRouter.Resolve("ColorGeneration");
            var prompt = BuildPrompt(brandName, strategy, direction, currentRoles);

            var maxTokens = _settings.OutputTokenLimits.TryGetValue("ColorGeneration", out var limit) && limit > 0
                ? limit
                : DefaultMaxOutputTokens;

            var request = new AiCompletionRequest
            {
                Model = modelId,
                Messages = new[]
                {
                    new AiMessage("system", "You are an expert brand identity and color systems designer. You produce accessible 5-role brand color systems in strict JSON format."),
                    new AiMessage("user", prompt)
                },
                ResponseFormat = "json_object",
                MaxTokens = maxTokens,
                Temperature = 0.7
            };

            var response = await _aiProvider!.CompleteAsync(request, cancellationToken);
            if (string.IsNullOrWhiteSpace(response?.Text)) return null;

            // Log token accounting
            _logger.LogInformation(
                "Brand colors regenerated for {BrandName} via model {Model}. OperationType={OperationType}, PromptTokens={PromptTokens}, CompletionTokens={CompletionTokens}, TotalTokens={TotalTokens}, EstimatedCost={EstimatedCost}",
                brandName,
                response.Model,
                "BrandColorRegeneration",
                response.Usage.PromptTokens,
                response.Usage.CompletionTokens,
                response.Usage.TotalTokens,
                response.EstimatedCost);

            return response.Text;
        }

        private static string BuildPrompt(
            string brandName,
            BrandStrategy strategy,
            BrandDirection? direction,
            List<BrandColorRole> currentRoles)
        {
            var selectedCand = direction?.Candidates?.FirstOrDefault(c => c.Key == direction.SelectedDirectionKey);
            var currentPrimary = currentRoles.FirstOrDefault(r => r.RoleName == BrandColorRoleNames.Primary)?.Hex ?? "None";
            var currentSecondary = currentRoles.FirstOrDefault(r => r.RoleName == BrandColorRoleNames.Secondary)?.Hex ?? "None";

            var traits = strategy.PersonalityTraits != null && strategy.PersonalityTraits.Count > 0
                ? string.Join(", ", strategy.PersonalityTraits)
                : "Professional, Distinctive";

            var avoids = strategy.AvoidList != null && strategy.AvoidList.Count > 0
                ? string.Join(", ", strategy.AvoidList)
                : "None";

            return $@"Generate a fresh 5-role brand color palette for '{brandName}'.

Brand Strategy:
- Industry: {strategy.Industry?.Value ?? "Technology"}
- Positioning: {strategy.Positioning?.Value ?? "Premium innovation"}
- Personality: {traits}
- Visual Direction: {selectedCand?.Name ?? "Modern Contemporary"} ({selectedCand?.FeelLine ?? ""})
- Colors / Aesthetic to avoid: {avoids}

Current Palette (You MUST generate a fresh, distinctive color harmony that differs from this):
- Current Primary: {currentPrimary}
- Current Secondary: {currentSecondary}

Requirements:
1. Provide valid 6-character hex colors for all 5 canonical roles:
   - 'primary': Core dominant brand color (rich, distinctive).
   - 'secondary': Harmonious supporting color for secondary accents.
   - 'accent': Energetic accent hue for CTA buttons, tags, and highlights.
   - 'background': Clean neutral surface background (typically #FFFFFF, #F8FAFC, or very light tint).
   - 'text': High-contrast deep dark neutral for body text (#0F172A, #111827, or similar).
2. Primary, Secondary, Accent, and Text must be legible against Background.

Output MUST be strict JSON with keys:
{{
  ""primary"": ""#HEX"",
  ""secondary"": ""#HEX"",
  ""accent"": ""#HEX"",
  ""background"": ""#HEX"",
  ""text"": ""#HEX"",
  ""rationale"": ""Brief explanation of the color palette harmony""
}}";
        }

        private static bool TryParsePalette(
            string json,
            out (string Primary, string Secondary, string Accent, string Background, string Text) palette)
        {
            palette = (string.Empty, string.Empty, string.Empty, string.Empty, string.Empty);
            try
            {
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                string? primary = GetHexProp(root, "primary");
                string? secondary = GetHexProp(root, "secondary");
                string? accent = GetHexProp(root, "accent");
                string? bg = GetHexProp(root, "background") ?? "#FFFFFF";
                string? text = GetHexProp(root, "text") ?? "#0F172A";

                if (primary != null && secondary != null && accent != null)
                {
                    palette = (primary, secondary, accent, bg, text);
                    return true;
                }
            }
            catch
            {
                // Parse failed
            }

            return false;
        }

        private static string? GetHexProp(JsonElement el, string propName)
        {
            if (el.TryGetProperty(propName, out var prop) && prop.ValueKind == JsonValueKind.String)
            {
                var val = prop.GetString()?.Trim();
                if (!string.IsNullOrEmpty(val) && Regex.IsMatch(val, "^#[0-9A-Fa-f]{6}$"))
                {
                    return val.ToUpperInvariant();
                }
            }
            return null;
        }

        private static (string Primary, string Secondary, string Accent, string Background, string Text) SynthesizeHarmonicPalette(
            string currentPrimary,
            BrandDirection? direction)
        {
            var (r, g, b) = WcagContrastCalculator.HexToRgb(currentPrimary);
            WcagContrastCalculator.RgbToHsl(r, g, b, out double h, out double s, out double l);

            // Rotate hue by 60 degrees for a distinct triadic harmony
            double newH = (h + 60.0) % 360.0;
            double secH = (newH + 150.0) % 360.0;
            double accH = (newH + 210.0) % 360.0;

            WcagContrastCalculator.HslToRgb(newH, Math.Clamp(s, 0.4, 0.9), Math.Clamp(l, 0.2, 0.45), out int pR, out int pG, out int pB);
            WcagContrastCalculator.HslToRgb(secH, Math.Clamp(s, 0.35, 0.75), Math.Clamp(l, 0.35, 0.55), out int sR, out int sG, out int sB);
            WcagContrastCalculator.HslToRgb(accH, Math.Clamp(s, 0.6, 0.95), Math.Clamp(l, 0.45, 0.65), out int aR, out int aG, out int aB);

            return (
                WcagContrastCalculator.RgbToHex(pR, pG, pB),
                WcagContrastCalculator.RgbToHex(sR, sG, sB),
                WcagContrastCalculator.RgbToHex(aR, aG, aB),
                "#FFFFFF",
                "#0F172A"
            );
        }

        private BrandColors BuildAndVerifyBrandColors(
            string primaryHex,
            string secondaryHex,
            string accentHex,
            string backgroundHex,
            string textHex,
            int regenerateCount,
            string provenance)
        {
            // Normalize background
            backgroundHex = backgroundHex.ToUpperInvariant();
            var (bgR, bgG, bgB) = WcagContrastCalculator.HexToRgb(backgroundHex);
            string bgRgb = $"{bgR},{bgG},{bgB}";

            // Deterministic contrast evaluation & lightness adjustment
            var (adjPrimary, primRatio, primVerdict, _) = WcagContrastCalculator.AdjustLightnessForContrast(
                primaryHex, backgroundHex, minTargetRatio: 4.5, isLargeOrAccent: false, _logger, BrandColorRoleNames.Primary);

            var (adjSecondary, secRatio, secVerdict, _) = WcagContrastCalculator.AdjustLightnessForContrast(
                secondaryHex, backgroundHex, minTargetRatio: 4.5, isLargeOrAccent: false, _logger, BrandColorRoleNames.Secondary);

            var (adjAccent, accRatio, accVerdict, _) = WcagContrastCalculator.AdjustLightnessForContrast(
                accentHex, backgroundHex, minTargetRatio: 3.0, isLargeOrAccent: true, _logger, BrandColorRoleNames.Accent);

            var (adjText, txtRatio, txtVerdict, _) = WcagContrastCalculator.AdjustLightnessForContrast(
                textHex, backgroundHex, minTargetRatio: 7.0, isLargeOrAccent: false, _logger, BrandColorRoleNames.Text);

            var (pR, pG, pB) = WcagContrastCalculator.HexToRgb(adjPrimary);
            var (sR, sG, sB) = WcagContrastCalculator.HexToRgb(adjSecondary);
            var (aR, aG, aB) = WcagContrastCalculator.HexToRgb(adjAccent);
            var (tR, tG, tB) = WcagContrastCalculator.HexToRgb(adjText);

            var roles = new List<BrandColorRole>
            {
                new()
                {
                    RoleName = BrandColorRoleNames.Primary,
                    Hex = adjPrimary,
                    Rgb = $"{pR},{pG},{pB}",
                    ContrastRatio = primRatio,
                    ContrastVerdict = primVerdict,
                    UsageNote = "Primary brand color for primary actions, headers, and core identity markers.",
                    IsLocked = false,
                    Provenance = provenance
                },
                new()
                {
                    RoleName = BrandColorRoleNames.Secondary,
                    Hex = adjSecondary,
                    Rgb = $"{sR},{sG},{sB}",
                    ContrastRatio = secRatio,
                    ContrastVerdict = secVerdict,
                    UsageNote = "Secondary brand color for secondary buttons, card borders, and supportive accents.",
                    IsLocked = false,
                    Provenance = provenance
                },
                new()
                {
                    RoleName = BrandColorRoleNames.Accent,
                    Hex = adjAccent,
                    Rgb = $"{aR},{aG},{aB}",
                    ContrastRatio = accRatio,
                    ContrastVerdict = accVerdict,
                    UsageNote = "Accent color for high-visibility highlights, badges, and alerts.",
                    IsLocked = false,
                    Provenance = provenance
                },
                new()
                {
                    RoleName = BrandColorRoleNames.Background,
                    Hex = backgroundHex,
                    Rgb = bgRgb,
                    ContrastRatio = null,
                    ContrastVerdict = null,
                    UsageNote = "Main background surface color across pages and cards.",
                    IsLocked = true,
                    Provenance = provenance
                },
                new()
                {
                    RoleName = BrandColorRoleNames.Text,
                    Hex = adjText,
                    Rgb = $"{tR},{tG},{tB}",
                    ContrastRatio = txtRatio,
                    ContrastVerdict = txtVerdict,
                    UsageNote = "Primary text and heading content color.",
                    IsLocked = false,
                    Provenance = provenance
                }
            };

            return new BrandColors
            {
                Roles = roles,
                RegenerateCount = regenerateCount,
                ConfirmedAt = null
            };
        }
    }
}
