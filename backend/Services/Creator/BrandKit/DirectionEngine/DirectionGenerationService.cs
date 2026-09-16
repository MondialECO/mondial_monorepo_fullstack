using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Ai;
using WebApp.Services.Ai.Providers;
using BrandKitModel = WebApp.Models.DatabaseModels.BrandKit;

namespace WebApp.Services.Creator.BrandKit.DirectionEngine
{
    public class DirectionGenerationService : IDirectionGenerationService
    {
        private readonly IAiProvider? _aiProvider;
        private readonly IModelRouter? _modelRouter;
        private readonly ILogger<DirectionGenerationService> _logger;

        public DirectionGenerationService(
            IAiProvider? aiProvider = null,
            IModelRouter? modelRouter = null,
            ILogger<DirectionGenerationService>? logger = null)
        {
            _aiProvider = aiProvider;
            _modelRouter = modelRouter;
            _logger = logger ?? NullLogger<DirectionGenerationService>.Instance;
        }

        public static readonly IReadOnlyList<string> ValidBundledFonts = new[]
        {
            "Cinzel",
            "Space Grotesk",
            "Plus Jakarta Sans",
            "Syne",
            "JetBrains Mono"
        };

        public static readonly IReadOnlyList<string> ValidMotifKeys = new[]
        {
            "geometric_structure",
            "organic_growth",
            "minimal_monogram",
            "technical_lattice",
            "editorial_classic",
            "bold_abstract"
        };

        public async Task<List<BrandDirectionCandidate>> GenerateCandidatesAsync(
            CreatorIdea idea,
            BrandKitModel kit,
            CancellationToken cancellationToken = default)
        {
            var brandName = !string.IsNullOrWhiteSpace(kit?.Strategy?.NameDisplayForm)
                ? kit.Strategy.NameDisplayForm
                : (!string.IsNullOrWhiteSpace(kit?.Strategy?.BusinessName)
                    ? kit.Strategy.BusinessName
                    : (idea?.Project?.Name ?? "Brand"));

            var strategy = kit?.Strategy ?? new BrandStrategy();
            var avoidList = strategy.AvoidList ?? new List<string>();

            List<BrandDirectionCandidate>? aiCandidates = null;
            string? fallbackReason = null;

            if (_aiProvider != null && _modelRouter != null)
            {
                try
                {
                    aiCandidates = await QueryAiForDirectionsAsync(brandName, strategy, avoidList, cancellationToken);
                }
                catch (Exception ex)
                {
                    fallbackReason = $"AI generation failed: {ex.Message}";
                    _logger.LogWarning(ex, "Visual direction AI generation failed for {BrandName}. Reason: {Reason}", brandName, fallbackReason);
                }
            }
            else
            {
                fallbackReason = _aiProvider == null
                    ? "No AI provider configured in service container"
                    : "No ModelRouter configured in service container";
            }

            string? validationErr = null;
            if (aiCandidates != null && aiCandidates.Count == 4 && ValidateDistinctness(aiCandidates, out validationErr))
            {
                // Enforce avoid-list on AI candidates
                var processed = EnforceAvoidList(aiCandidates, avoidList, isFallback: false);
                return processed;
            }

            if (fallbackReason == null && aiCandidates != null)
            {
                fallbackReason = $"AI output failed distinctness validation: {validationErr}";
            }

            // Fallback to deterministic synthesis
            _logger.LogWarning("Visual direction fallback activated for {BrandName}. Reason: {Reason}. Synthesizing deterministic archetype candidates.", brandName, fallbackReason);
            var fallbackCandidates = GenerateDeterministicCandidates(brandName, strategy, avoidList, kit?.Direction?.RegenerateCount ?? 0);
            return fallbackCandidates;
        }

        private async Task<List<BrandDirectionCandidate>?> QueryAiForDirectionsAsync(
            string brandName,
            BrandStrategy strategy,
            List<string> avoidList,
            CancellationToken cancellationToken)
        {
            if (_modelRouter == null)
                throw new InvalidOperationException("IModelRouter is required for visual direction model resolution.");

            var modelId = _modelRouter.Resolve("DirectionGeneration");
            var prompt = BuildPrompt(brandName, strategy, avoidList);

            var request = new AiCompletionRequest
            {
                Model = modelId,
                Messages = new[]
                {
                    new AiMessage("system", "You are a world-class brand identity director. Generate exactly four distinct, strategy-grounded visual direction proposals in strict JSON format."),
                    new AiMessage("user", prompt)
                },
                ResponseFormat = "json_object",
                MaxTokens = 1600,
                Temperature = 0.5
            };

            var response = await _aiProvider!.CompleteAsync(request, cancellationToken);
            if (string.IsNullOrWhiteSpace(response?.Text)) return null;

            // Log token accounting
            _logger.LogInformation(
                "Brand direction generated for {BrandName} via model {Model}. OperationType={OperationType}, PromptTokens={PromptTokens}, CompletionTokens={CompletionTokens}, TotalTokens={TotalTokens}, EstimatedCost={EstimatedCost}",
                brandName,
                response.Model,
                "BrandDirectionGeneration",
                response.Usage.PromptTokens,
                response.Usage.CompletionTokens,
                response.Usage.TotalTokens,
                response.EstimatedCost);

            using var doc = JsonDocument.Parse(response.Text);
            if (!doc.RootElement.TryGetProperty("candidates", out var cArray) || cArray.ValueKind != JsonValueKind.Array)
                return null;

            var candidates = new List<BrandDirectionCandidate>();
            int idx = 1;
            foreach (var item in cArray.EnumerateArray())
            {
                if (idx > 4) break;

                var name = item.TryGetProperty("name", out var nEl) ? nEl.GetString() : null;
                var feelLine = item.TryGetProperty("feel_line", out var fEl) ? fEl.GetString() : null;
                var rationale = item.TryGetProperty("rationale", out var rEl) ? rEl.GetString() : null;
                var displayTypeface = item.TryGetProperty("display_typeface", out var dtEl) ? dtEl.GetString() : null;
                var textTypeface = item.TryGetProperty("text_typeface", out var ttEl) ? ttEl.GetString() : null;
                var motifKey = item.TryGetProperty("motif_key", out var mEl) ? mEl.GetString() : null;

                var palette = new List<string>();
                if (item.TryGetProperty("color_palette", out var pEl) && pEl.ValueKind == JsonValueKind.Array)
                {
                    foreach (var c in pEl.EnumerateArray())
                    {
                        var hex = c.GetString()?.Trim();
                        if (!string.IsNullOrEmpty(hex) && Regex.IsMatch(hex, "^#[0-9A-Fa-f]{6}$"))
                        {
                            palette.Add(hex.ToUpperInvariant());
                        }
                    }
                }

                // Clean and normalize typefaces to bundled set
                displayTypeface = NormalizeTypeface(displayTypeface, defaultChoice: "Space Grotesk");
                textTypeface = NormalizeTypeface(textTypeface, defaultChoice: "Plus Jakarta Sans");

                // Clean and normalize motif key
                if (string.IsNullOrEmpty(motifKey) || !ValidMotifKeys.Contains(motifKey, StringComparer.OrdinalIgnoreCase))
                {
                    motifKey = ValidMotifKeys[(idx - 1) % ValidMotifKeys.Count];
                }

                if (palette.Count < 4)
                {
                    var defaults = GetDefaultPaletteForArchetype(idx);
                    while (palette.Count < 4)
                    {
                        palette.Add(defaults[palette.Count]);
                    }
                }
                else if (palette.Count > 4)
                {
                    palette = palette.Take(4).ToList();
                }

                candidates.Add(new BrandDirectionCandidate
                {
                    Key = $"candidate_{idx}",
                    Name = name ?? $"Direction {idx}",
                    FeelLine = feelLine ?? "Distinct visual posture",
                    Rationale = rationale ?? $"Grounded in {strategy.Positioning?.Value ?? brandName} strategy",
                    ColorPalette = palette,
                    DisplayTypeface = displayTypeface,
                    TextTypeface = textTypeface,
                    MotifKey = motifKey,
                    Provenance = "ai",
                    AvoidListSubstituted = false
                });

                idx++;
            }

            return candidates.Count == 4 ? candidates : null;
        }

        private static string BuildPrompt(string brandName, BrandStrategy strategy, List<string> avoidList)
        {
            var traits = strategy.PersonalityTraits != null && strategy.PersonalityTraits.Count > 0
                ? string.Join(", ", strategy.PersonalityTraits)
                : "Innovative, Professional, Reliable";

            var avoidStr = avoidList.Count > 0 ? string.Join(", ", avoidList) : "None specified";

            return $$"""
You are creating four distinct Visual Direction candidates for:
Brand Name: {{brandName}}
Industry: {{strategy.Industry?.Value ?? "Technology"}}
Positioning: {{strategy.Positioning?.Value ?? "Modern market leadership"}}
Target Audience: {{strategy.TargetAudience?.Value ?? "Global professionals"}}
Personality Traits: {{traits}}
Tone Position: {{strategy.TonePosition ?? "Balanced"}}
Avoid List: {{avoidStr}}

Requirements:
1. Return exactly 4 contrasting candidates under the "candidates" JSON key.
2. The 4 candidates must represent 4 DISTINCT archetypal postures (e.g. Modern Precision, Editorial Elegance, Organic Modernism, Bold Impact).
3. "color_palette": Exactly 4 hex colors [Hex1, Hex2, Hex3, Hex4] per candidate. Do NOT label with roles.
4. "display_typeface": Must be selected strictly from: "Cinzel", "Space Grotesk", "Plus Jakarta Sans", "Syne", "JetBrains Mono".
5. "text_typeface": Must be selected strictly from: "Cinzel", "Space Grotesk", "Plus Jakarta Sans", "Syne", "JetBrains Mono".
6. "motif_key": Must be selected strictly from: "geometric_structure", "organic_growth", "minimal_monogram", "technical_lattice", "editorial_classic", "bold_abstract".
7. All 4 candidates must have different motif_keys, different display_typefaces, and divergent color palettes.
8. "rationale": Provide 1-2 sentences explaining specifically why this direction fits this business and its positioning.
9. Avoid list: Never include colors, words, or motifs that conflict with the avoid list.

Return strict JSON:
{
  "candidates": [
    {
      "name": "Direction Name",
      "feel_line": "Evocative summary line",
      "rationale": "Business-specific rationale",
      "color_palette": ["#0052FF", "#0F172A", "#38BDF8", "#F8FAFC"],
      "display_typeface": "Space Grotesk",
      "text_typeface": "Plus Jakarta Sans",
      "motif_key": "geometric_structure"
    }
  ]
}
""";
        }

        public static bool ValidateDistinctness(List<BrandDirectionCandidate> candidates, out string? error)
        {
            if (candidates == null || candidates.Count != 4)
            {
                error = "Candidate count is not exactly 4";
                return false;
            }

            // 1. Motif key uniqueness
            var motifKeys = candidates.Select(c => c.MotifKey).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
            if (motifKeys.Count < 4)
            {
                error = $"Motif keys not unique across 4 candidates ({motifKeys.Count} unique)";
                return false;
            }

            // 2. Display typeface diversity (at least 3 distinct)
            var displayFonts = candidates.Select(c => c.DisplayTypeface).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
            if (displayFonts.Count < 3)
            {
                error = $"Display typefaces lack diversity ({displayFonts.Count} unique)";
                return false;
            }

            // 3. Palette primary hue separation
            var hues = new List<double>();
            foreach (var c in candidates)
            {
                if (c.ColorPalette == null || c.ColorPalette.Count < 1)
                {
                    error = "Missing primary palette color";
                    return false;
                }
                hues.Add(GetHueFromHex(c.ColorPalette[0]));
            }

            for (int i = 0; i < hues.Count; i++)
            {
                for (int j = i + 1; j < hues.Count; j++)
                {
                    var diff = Math.Abs(hues[i] - hues[j]);
                    if (diff > 180) diff = 360 - diff;
                    if (diff < 20) // Very close hue
                    {
                        error = $"Primary hues for candidate {i + 1} and {j + 1} are too close ({diff:F1}°)";
                        return false;
                    }
                }
            }

            error = null;
            return true;
        }

        private static readonly string[] UniversalSafeHexPool = new[]
        {
            "#0052FF", // Electric Tech Blue
            "#2D6A4F", // Forest Green
            "#B38E5D", // Warm Ochre / Gold
            "#4F46E5", // Deep Indigo
            "#0EA5E9", // Sky Cyan
            "#D97706", // Amber
            "#64748B", // Slate
            "#059669"  // Emerald
        };

        public static List<BrandDirectionCandidate> EnforceAvoidList(
            List<BrandDirectionCandidate> candidates,
            List<string> avoidList,
            bool isFallback)
        {
            var result = new List<BrandDirectionCandidate>();
            var avoidKeywords = avoidList.Select(a => a.Trim().ToLowerInvariant()).Where(a => !string.IsNullOrEmpty(a)).ToList();

            foreach (var c in candidates)
            {
                bool substituted = false;
                var cleanPalette = new List<string>();

                foreach (var hex in c.ColorPalette)
                {
                    if (IsColorViolatingAvoidList(hex, avoidKeywords))
                    {
                        var safeHex = GetSafeAlternativeHex(hex, c.Key, avoidKeywords);
                        cleanPalette.Add(safeHex);
                        substituted = true;
                    }
                    else
                    {
                        cleanPalette.Add(hex);
                    }
                }

                var motifKey = c.MotifKey;
                if (IsMotifViolatingAvoidList(motifKey, avoidKeywords))
                {
                    motifKey = GetSafeAlternativeMotif(motifKey, result.Select(r => r.MotifKey).ToList(), avoidKeywords);
                    substituted = true;
                }

                result.Add(new BrandDirectionCandidate
                {
                    Key = c.Key,
                    Name = c.Name,
                    FeelLine = c.FeelLine,
                    Rationale = c.Rationale,
                    ColorPalette = cleanPalette,
                    DisplayTypeface = c.DisplayTypeface,
                    TextTypeface = c.TextTypeface,
                    MotifKey = motifKey,
                    Provenance = isFallback ? "fallback" : c.Provenance,
                    AvoidListSubstituted = substituted || c.AvoidListSubstituted
                });
            }

            return result;
        }

        private static string GetSafeAlternativeHex(string hex, string candidateKey, List<string> avoidKeywords)
        {
            string preferred = candidateKey switch
            {
                "candidate_1" => "#0052FF",
                "candidate_2" => "#2D6A4F",
                "candidate_3" => "#B38E5D",
                _ => "#4F46E5"
            };

            if (!IsColorViolatingAvoidList(preferred, avoidKeywords))
                return preferred;

            foreach (var safe in UniversalSafeHexPool)
            {
                if (!IsColorViolatingAvoidList(safe, avoidKeywords))
                    return safe;
            }

            return "#334155";
        }

        private static bool IsMotifViolatingAvoidList(string motifKey, List<string> avoidKeywords)
        {
            foreach (var k in avoidKeywords)
            {
                if (k.Contains("shield") || k.Contains("lattice") || k.Contains("circuit"))
                {
                    if (motifKey == "technical_lattice") return true;
                }
                if (k.Contains("leaf") || k.Contains("plant") || k.Contains("nature"))
                {
                    if (motifKey == "organic_growth") return true;
                }
                if (k.Contains("monogram") || k.Contains("lettermark"))
                {
                    if (motifKey == "minimal_monogram") return true;
                }
                if (k.Contains("geometric") || k.Contains("box") || k.Contains("polygon"))
                {
                    if (motifKey == "geometric_structure") return true;
                }
            }
            return false;
        }

        private static string GetSafeAlternativeMotif(string currentMotif, List<string> existingMotifs, List<string> avoidKeywords)
        {
            foreach (var m in ValidMotifKeys)
            {
                if (!string.Equals(m, currentMotif, StringComparison.OrdinalIgnoreCase)
                    && !existingMotifs.Contains(m, StringComparer.OrdinalIgnoreCase)
                    && !IsMotifViolatingAvoidList(m, avoidKeywords))
                {
                    return m;
                }
            }

            foreach (var m in ValidMotifKeys)
            {
                if (!IsMotifViolatingAvoidList(m, avoidKeywords))
                    return m;
            }

            return "bold_abstract";
        }

        private static List<BrandDirectionCandidate> GenerateDeterministicCandidates(
            string brandName,
            BrandStrategy strategy,
            List<string> avoidList,
            int regenCount = 0)
        {
            var archetypes = new[]
            {
                (
                    Name: "Precision & Modern Structure",
                    Feel: "Clean geometric certainty with technical authority",
                    Rationale: $"Emphasizes precision and modern trust tailored for {strategy.Industry?.Value ?? "market leadership"}.",
                    Palette: new List<string> { "#0052FF", "#0F172A", "#38BDF8", "#F1F5F9" },
                    DisplayFont: "Space Grotesk",
                    TextFont: "Plus Jakarta Sans",
                    Motif: "geometric_structure"
                ),
                (
                    Name: "Organic Harmony & Approachability",
                    Feel: "Warm, grounded vitality with sustainable resonance",
                    Rationale: $"Connects with {strategy.TargetAudience?.Value ?? "customers"} through approachable warmth and natural balance.",
                    Palette: new List<string> { "#2D6A4F", "#1B4332", "#74C69D", "#F4F1DE" },
                    DisplayFont: "Plus Jakarta Sans",
                    TextFont: "Plus Jakarta Sans",
                    Motif: "organic_growth"
                ),
                (
                    Name: "Refined Luxury & Editorial Luxe",
                    Feel: "Sophisticated bespoke craft with timeless poise",
                    Rationale: $"Elevates {brandName} with an architectural, premium aesthetic built for discerning clients.",
                    Palette: new List<string> { "#B38E5D", "#1C1917", "#D4AF37", "#FAFAF9" },
                    DisplayFont: "Cinzel",
                    TextFont: "Plus Jakarta Sans",
                    Motif: "editorial_classic"
                ),
                (
                    Name: "Bold Technical Power & Momentum",
                    Feel: "Dynamic industrial strength and high-impact momentum",
                    Rationale: $"Projects bold technological capability and decisive execution.",
                    Palette: new List<string> { "#4F46E5", "#18181B", "#818CF8", "#F8FAFC" },
                    DisplayFont: "Syne",
                    TextFont: "JetBrains Mono",
                    Motif: "bold_abstract"
                ),
                (
                    Name: "Minimalist Modern & Monogram Focus",
                    Feel: "Clarity and modern reductionism with focused typography",
                    Rationale: $"Emphasizes pure typographic clarity and brand signature for {brandName}.",
                    Palette: new List<string> { "#0F172A", "#334155", "#0EA5E9", "#F8FAFC" },
                    DisplayFont: "Space Grotesk",
                    TextFont: "JetBrains Mono",
                    Motif: "minimal_monogram"
                ),
                (
                    Name: "Dynamic Innovation & Digital Velocity",
                    Feel: "Vibrant high-contrast creative energy and modern velocity",
                    Rationale: $"Captures energetic digital leadership and progressive innovation.",
                    Palette: new List<string> { "#7C3AED", "#2E1065", "#A78BFA", "#FAF5FF" },
                    DisplayFont: "Syne",
                    TextFont: "Plus Jakarta Sans",
                    Motif: "bold_abstract"
                ),
                (
                    Name: "Technical Architecture & Grid Lattice",
                    Feel: "Engineered structural rigor with data-first precision",
                    Rationale: $"Communicates deep technical infrastructure and architectural robustness.",
                    Palette: new List<string> { "#0284C7", "#082F49", "#38BDF8", "#F0F9FF" },
                    DisplayFont: "JetBrains Mono",
                    TextFont: "Space Grotesk",
                    Motif: "technical_lattice"
                ),
                (
                    Name: "Warm Editorial & Bespoke Craft",
                    Feel: "Warm artisanal heritage paired with contemporary elegance",
                    Rationale: $"Blends timeless editorial elegance with memorable warmth.",
                    Palette: new List<string> { "#C2410C", "#431407", "#FDBA74", "#FFF7ED" },
                    DisplayFont: "Cinzel",
                    TextFont: "Syne",
                    Motif: "editorial_classic"
                )
            };

            int offset = (regenCount * 2) % archetypes.Length;
            var rawList = new List<BrandDirectionCandidate>();
            for (int i = 0; i < 4; i++)
            {
                var archetypeIndex = (offset + i) % archetypes.Length;
                var a = archetypes[archetypeIndex];
                rawList.Add(new BrandDirectionCandidate
                {
                    Key = $"candidate_{i + 1}",
                    Name = a.Name,
                    FeelLine = a.Feel,
                    Rationale = a.Rationale,
                    ColorPalette = new List<string>(a.Palette),
                    DisplayTypeface = a.DisplayFont,
                    TextTypeface = a.TextFont,
                    MotifKey = a.Motif,
                    Provenance = "fallback",
                    AvoidListSubstituted = false
                });
            }

            return EnforceAvoidList(rawList, avoidList, isFallback: true);
        }

        private static string NormalizeTypeface(string? input, string defaultChoice)
        {
            if (string.IsNullOrWhiteSpace(input)) return defaultChoice;

            var match = ValidBundledFonts.FirstOrDefault(f => string.Equals(f, input.Trim(), StringComparison.OrdinalIgnoreCase));
            if (match != null) return match;

            var lower = input.ToLowerInvariant();
            if (lower.Contains("cinzel") || lower.Contains("serif")) return "Cinzel";
            if (lower.Contains("grotesk") || lower.Contains("space")) return "Space Grotesk";
            if (lower.Contains("jakarta") || lower.Contains("sans")) return "Plus Jakarta Sans";
            if (lower.Contains("syne") || lower.Contains("slab")) return "Syne";
            if (lower.Contains("mono") || lower.Contains("jetbrains")) return "JetBrains Mono";

            return defaultChoice;
        }

        private static List<string> GetDefaultPaletteForArchetype(int index)
        {
            return index switch
            {
                1 => new() { "#0052FF", "#0F172A", "#38BDF8", "#F1F5F9" },
                2 => new() { "#2D6A4F", "#1B4332", "#74C69D", "#F4F1DE" },
                3 => new() { "#B38E5D", "#1C1917", "#D4AF37", "#FAFAF9" },
                _ => new() { "#4F46E5", "#18181B", "#818CF8", "#F8FAFC" }
            };
        }

        private static double GetHueFromHex(string hex)
        {
            if (string.IsNullOrEmpty(hex) || !hex.StartsWith("#") || hex.Length != 7) return 0;
            if (!int.TryParse(hex.Substring(1, 2), NumberStyles.HexNumber, CultureInfo.InvariantCulture, out int r)) return 0;
            if (!int.TryParse(hex.Substring(3, 2), NumberStyles.HexNumber, CultureInfo.InvariantCulture, out int g)) return 0;
            if (!int.TryParse(hex.Substring(5, 2), NumberStyles.HexNumber, CultureInfo.InvariantCulture, out int b)) return 0;

            float rf = r / 255f, gf = g / 255f, bf = b / 255f;
            float max = Math.Max(rf, Math.Max(gf, bf));
            float min = Math.Min(rf, Math.Min(gf, bf));
            float delta = max - min;

            if (delta == 0) return 0;

            float hue;
            if (max == rf) hue = ((gf - bf) / delta) % 6;
            else if (max == gf) hue = ((bf - rf) / delta) + 2;
            else hue = ((rf - gf) / delta) + 4;

            hue *= 60f;
            if (hue < 0) hue += 360f;
            return hue;
        }

        private static bool IsColorViolatingAvoidList(string hex, List<string> avoidKeywords)
        {
            var hue = GetHueFromHex(hex);

            foreach (var k in avoidKeywords)
            {
                if ((k.Contains("red") || k.Contains("crimson")) && (hue <= 25 || hue >= 335)) return true;
                if ((k.Contains("green") || k.Contains("emerald") || k.Contains("lime")) && (hue >= 75 && hue <= 165)) return true;
                if ((k.Contains("blue") || k.Contains("navy") || k.Contains("cyan")) && (hue >= 180 && hue <= 255)) return true;
                if ((k.Contains("yellow") || k.Contains("gold")) && (hue >= 40 && hue <= 70)) return true;
                if ((k.Contains("purple") || k.Contains("violet")) && (hue >= 260 && hue <= 315)) return true;
                if (k.Contains("orange") && (hue >= 25 && hue <= 45)) return true;
                if (k.Contains("pink") && (hue >= 315 && hue <= 345)) return true;
            }

            return false;
        }
    }
}
