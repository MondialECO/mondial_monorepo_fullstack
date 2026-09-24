using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using WebApp.Configuration.AiOptions;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Ai;
using WebApp.Services.Ai.Providers;
using BrandKitModel = WebApp.Models.DatabaseModels.BrandKit;

namespace WebApp.Services.Creator.BrandKit.LogoEngine
{
    public class LogoGenerationService : ILogoGenerationService
    {
        public const int DefaultMaxOutputTokens = 3000;

        private readonly ILogoMarkRendererRegistry _rendererRegistry;
        private readonly IAiProvider? _aiProvider;
        private readonly IModelRouter? _modelRouter;
        private readonly IWebHostEnvironment? _env;
        private readonly AiSettings _settings;
        private readonly ILogger<LogoGenerationService> _logger;

        public LogoGenerationService(
            ILogoMarkRendererRegistry rendererRegistry,
            IAiProvider? aiProvider = null,
            IModelRouter? modelRouter = null,
            IWebHostEnvironment? env = null,
            ILogger<LogoGenerationService>? logger = null,
            IOptions<AiSettings>? aiSettings = null)
        {
            _rendererRegistry = rendererRegistry ?? throw new ArgumentNullException(nameof(rendererRegistry));
            _aiProvider = aiProvider;
            _modelRouter = modelRouter;
            _env = env;
            _settings = aiSettings?.Value ?? new AiSettings();
            _logger = logger ?? NullLogger<LogoGenerationService>.Instance;
        }

        public async Task<List<BrandLogoConcept>> GenerateConceptsAsync(
            CreatorIdea idea,
            BrandKitModel kit,
            CancellationToken cancellationToken = default)
        {
            var brandName = idea?.Project?.Name ?? "Brand";
            var strategy = kit?.Strategy ?? new BrandStrategy();
            var direction = kit?.Direction ?? new BrandDirection();
            var selectedCand = direction.Candidates?.FirstOrDefault(c => c.Key == direction.SelectedDirectionKey);
            var avoidList = strategy.AvoidList ?? new List<string>();
            var selectedLogoType = kit?.Logo?.LogoType;

            List<BrandLogoConceptParameters>? rawParamSets = null;

            if (_aiProvider == null)
            {
                throw new InvalidOperationException("No AI provider configured in service container.");
            }
            if (_modelRouter == null)
            {
                throw new InvalidOperationException("No ModelRouter configured in service container.");
            }

            try
            {
                rawParamSets = await QueryAiForParameterSetsAsync(brandName, strategy, direction, selectedCand, avoidList, selectedLogoType, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "AI parameter generation failed for brand '{BrandName}': {Message}. Falling back to deterministic parameter sets.", brandName, ex.Message);
            }

            if (rawParamSets == null || rawParamSets.Count < 6 || !ValidateSetDiversity(rawParamSets, avoidList, selectedLogoType))
            {
                _logger.LogInformation("AI generated insufficient or invalid parameter sets. Using deterministic fallback parameter sets for brand '{BrandName}' (Family: {Family}).", brandName, selectedLogoType ?? "all");
                rawParamSets = GenerateDeterministicParameterSets(brandName, strategy, direction, selectedCand, avoidList, selectedLogoType);
            }

            var palette = selectedCand?.ColorPalette ?? new List<string>();
            var primaryColor = palette.Count > 0 ? palette[0] : "#0F172A";
            var accentColor = palette.Count > 2 ? palette[2] : (palette.Count > 1 ? palette[1] : primaryColor);

            var regenCount = kit?.Logo?.RegenerateCount ?? 0;
            var concepts = new List<BrandLogoConcept>();
            for (int i = 0; i < 6; i++)
            {
                var conceptKey = $"concept_{i + 1}";
                var param = rawParamSets[i];
                var descriptor = param.Descriptor ?? $"Concept {i + 1}: {param.Family} visual direction";

                if (param.Values != null)
                {
                    param.Values["PrimaryColor"] = primaryColor;
                    param.Values["AccentColor"] = accentColor;
                }

                var markFileKey = regenCount > 0 ? $"{conceptKey}_mark_b{regenCount}" : $"{conceptKey}_mark";
                var markSvg = _rendererRegistry.RenderMarkSvg(param, brandName, primaryColor);
                var markAssetUri = await SaveSvgAssetAsync(idea.Id, markFileKey, markSvg);

                var lockupFileKey = regenCount > 0 ? $"{conceptKey}_lockup_b{regenCount}" : $"{conceptKey}_lockup";
                var lockupSvg = _rendererRegistry.RenderLockupSvg(param, brandName, primaryColor);
                var lockupAssetUri = await SaveSvgAssetAsync(idea.Id, lockupFileKey, lockupSvg);

                concepts.Add(new BrandLogoConcept
                {
                    Key = conceptKey,
                    DescriptorLine = descriptor,
                    MarkAssetUri = markAssetUri,
                    LockupAssetUri = lockupAssetUri,
                    RegenerateCount = 0,
                    Parameters = param
                });
            }

            return concepts;
        }

        public async Task<BrandLogoConcept> RegenerateSingleConceptAsync(
            CreatorIdea idea,
            BrandKitModel kit,
            string targetConceptKey,
            CancellationToken cancellationToken = default)
        {
            var brandName = idea?.Project?.Name ?? "Brand";
            var strategy = kit?.Strategy ?? new BrandStrategy();
            var direction = kit?.Direction ?? new BrandDirection();
            var selectedCand = direction.Candidates?.FirstOrDefault(c => c.Key == direction.SelectedDirectionKey);
            var avoidList = strategy.AvoidList ?? new List<string>();
            var selectedLogoType = kit?.Logo?.LogoType;

            var existingConcept = kit.Logo?.Concepts?.FirstOrDefault(c => c.Key == targetConceptKey);
            var existingRegenCount = existingConcept?.RegenerateCount ?? 0;

            string targetFamily;
            if (!string.IsNullOrWhiteSpace(selectedLogoType) && BrandLogoFamilyNames.All.Contains(selectedLogoType))
            {
                targetFamily = selectedLogoType;
            }
            else
            {
                var seedIndex = (existingRegenCount + 1) % BrandLogoFamilyNames.All.Count;
                targetFamily = BrandLogoFamilyNames.All[seedIndex];
            }

            int conceptIndex = 0;
            if (targetConceptKey.StartsWith("concept_") && int.TryParse(targetConceptKey.Substring("concept_".Length), out var parsedIdx))
            {
                conceptIndex = Math.Max(0, parsedIdx - 1);
            }

            var synthParams = GenerateDeterministicSingleParameterSet(brandName, strategy, direction, targetFamily, conceptIndex + existingRegenCount + 1, avoidList);
            var palette = selectedCand?.ColorPalette ?? new List<string>();
            var primaryColor = palette.Count > 0 ? palette[0] : "#0F172A";
            var accentColor = palette.Count > 2 ? palette[2] : (palette.Count > 1 ? palette[1] : primaryColor);

            if (synthParams.Values != null)
            {
                synthParams.Values["PrimaryColor"] = primaryColor;
                synthParams.Values["AccentColor"] = accentColor;
            }

            var descriptor = synthParams.Descriptor ?? $"Regenerated {targetFamily} direction #{existingRegenCount + 1} tailored to {selectedCand?.Name ?? "brand identity"}";
            synthParams.Descriptor = descriptor;

            var markSvg = _rendererRegistry.RenderMarkSvg(synthParams, brandName, primaryColor);
            var markAssetUri = await SaveSvgAssetAsync(idea.Id, $"{targetConceptKey}_mark_r{existingRegenCount + 1}", markSvg);

            var lockupSvg = _rendererRegistry.RenderLockupSvg(synthParams, brandName, primaryColor);
            var lockupAssetUri = await SaveSvgAssetAsync(idea.Id, $"{targetConceptKey}_lockup_r{existingRegenCount + 1}", lockupSvg);

            return new BrandLogoConcept
            {
                Key = targetConceptKey,
                DescriptorLine = descriptor,
                MarkAssetUri = markAssetUri,
                LockupAssetUri = lockupAssetUri,
                RegenerateCount = existingRegenCount + 1,
                Parameters = synthParams
            };
        }

        private async Task<List<BrandLogoConceptParameters>?> QueryAiForParameterSetsAsync(
            string brandName,
            BrandStrategy strategy,
            BrandDirection direction,
            BrandDirectionCandidate? candidate,
            List<string> avoidList,
            string? selectedLogoType,
            CancellationToken cancellationToken)
        {
            if (_modelRouter == null)
                throw new InvalidOperationException("IModelRouter is required for logo parameter selection model resolution.");

            var modelId = _modelRouter.Resolve("LogoParameterSelection");
            var prompt = BuildPrompt(brandName, strategy, direction, candidate, avoidList, selectedLogoType);

            var maxTokens = _settings.OutputTokenLimits.TryGetValue("LogoParameterSelection", out var limit) && limit > 0
                ? limit
                : DefaultMaxOutputTokens;

            var request = new AiCompletionRequest
            {
                Model = modelId,
                Messages = new[]
                {
                    new AiMessage("system", "You are a brand visual identity designer selecting logo parameters."),
                    new AiMessage("user", prompt)
                },
                ResponseFormat = "json_object",
                MaxTokens = maxTokens,
                Temperature = 0.4
            };

            var response = await _aiProvider!.CompleteAsync(request, cancellationToken);
            if (string.IsNullOrWhiteSpace(response?.Text)) return null;

            using var doc = JsonDocument.Parse(response.Text);
            if (!doc.RootElement.TryGetProperty("concepts", out var conceptsEl) || conceptsEl.ValueKind != JsonValueKind.Array)
                return null;

            var list = new List<BrandLogoConceptParameters>();
            foreach (var item in conceptsEl.EnumerateArray())
            {
                var family = item.TryGetProperty("family", out var fEl) ? fEl.GetString() : null;
                var desc = item.TryGetProperty("descriptor", out var dEl) ? dEl.GetString() : null;
                var param = new BrandLogoConceptParameters
                {
                    Family = family ?? BrandLogoFamilyNames.Minimal,
                    Descriptor = desc
                };

                if (item.TryGetProperty("parameters", out var pEl) && pEl.ValueKind == JsonValueKind.Object)
                {
                    foreach (var prop in pEl.EnumerateObject())
                    {
                        param.Values[prop.Name] = prop.Value.ValueKind == JsonValueKind.String
                            ? prop.Value.GetString() ?? string.Empty
                            : prop.Value.ToString();
                    }
                }

                if (_rendererRegistry.ValidateParameters(param, out _))
                {
                    list.Add(param);
                }
            }

            return list.Count > 0 ? list : null;
        }

        private static string BuildPrompt(
            string brandName,
            BrandStrategy strategy,
            BrandDirection direction,
            BrandDirectionCandidate? candidate,
            List<string> avoidList,
            string? selectedLogoType)
        {
            var traits = string.Join(", ", strategy.PersonalityTraits ?? new List<string>());
            var avoids = string.Join(", ", avoidList);

            if (!string.IsNullOrWhiteSpace(selectedLogoType) && BrandLogoFamilyNames.All.Contains(selectedLogoType))
            {
                var allowedParamsForFamily = selectedLogoType switch
                {
                    "wordmark" => "Layout in [single_line, stacked_two_line, tracked_wide, tight_bold], LetterCase in [uppercase, lowercase, titlecase], AccentElement in [none, terminal_dot, baseline_underline, overscore, split_dot], FontCategory in [geometric_sans, humanist_sans, high_contrast_serif, slab_serif, mono], LetterSpacing in [tight, normal, wide, ultra_wide]",
                    "symbol_plus_name" => "BadgeShape in [circle, square, rounded_rect, shield, diamond, hexagon, cut_corner_rect], BadgeStyle in [solid_fill, outline_stroke, double_stroke, split_negative, duo_tone], InternalGlyph in [initial_letter, dual_initial, geometric_cut, diagonal_cross, concentric_ring, horizontal_bars], Arrangement in [side_by_side, stacked], FontCategory in [geometric_sans, humanist_sans, high_contrast_serif, slab_serif, mono]",
                    "monogram" => "MonogramType in [single_letter, two_letter_interlock, two_letter_adjacent, three_letter_pyramid], FrameStyle in [none, circle_ring, square_box, bracket_corners, solid_disc, chamfer_box], StrokeStyle in [heavy_block, stencil_split, monoline, duoline], Arrangement in [side_by_side, stacked], FontCategory in [geometric_sans, humanist_sans, high_contrast_serif, slab_serif, mono]",
                    "abstract" => "GeometryType in [intersecting_rings, nested_polygons, rotational_symmetry_3, rotational_symmetry_4, mobius_fold, isometric_cube, faceted_diamond, wave_frequencies], StrokeWeight in [thin_precision, medium, heavy_bold], Arrangement in [side_by_side, stacked], FontCategory in [geometric_sans, humanist_sans, high_contrast_serif, slab_serif, mono]",
                    "icon" => "MetaphorPrimitive in [shield_security, leaf_growth, node_network, cube_infrastructure, prism_focus, arch_gateway, globe_connected, spark_intelligence, pillar_foundation, wave_flow, energy_bolt], Construction in [monoline_stroke, silhouette_solid, split_halves, segmented_arcs, duo_tone], Arrangement in [side_by_side, stacked], FontCategory in [geometric_sans, humanist_sans, high_contrast_serif, slab_serif, mono]",
                    _ => "Primitive in [sliced_circle, quadrant_arc, offset_bars, chevron_fold, diagonal_slash, hairline_cross, concentric_arc], Orientation in [0_deg, 45_deg, 90_deg, 180_deg, 270_deg], WeightBalance in [monolithic_solid, contrast_duo, negative_aperture], Arrangement in [side_by_side, stacked], FontCategory in [geometric_sans, humanist_sans, high_contrast_serif, slab_serif, mono]"
                };

                return $@"Select discrete parameters for 6 distinct logo concepts for the brand '{brandName}'.
Brand Personality Traits: {traits}
Selected Direction: {candidate?.Name} ({candidate?.DisplayTypeface} + {candidate?.TextTypeface})
Avoided Elements: {avoids}
Selected Mark Architecture: '{selectedLogoType}'

You MUST choose parameters for 6 distinct concepts EXCLUSIVELY within the '{selectedLogoType}' family.
Allowed parameters for '{selectedLogoType}':
{allowedParamsForFamily}

Format the output strictly as a JSON object:
{{
  ""concepts"": [
    {{
      ""family"": ""{selectedLogoType}"",
      ""descriptor"": ""Concise descriptive line for this concept"",
      ""parameters"": {{
         // Only include keys specified in Allowed parameters above
      }}
    }}
  ]
}}";
            }

            return $@"Select discrete parameters for 6 distinct logo concepts for the brand '{brandName}'.
Brand Personality Traits: {traits}
Selected Direction: {candidate?.Name} ({candidate?.DisplayTypeface} + {candidate?.TextTypeface})
Avoided Elements: {avoids}

You MUST choose parameters for 6 distinct concepts covering at least 4 of the following families:
1. 'wordmark': Layout in [single_line, stacked_two_line, tracked_wide, tight_bold], LetterCase in [uppercase, lowercase, titlecase], AccentElement in [none, terminal_dot, baseline_underline, overscore, split_dot], FontCategory in [geometric_sans, humanist_sans, high_contrast_serif, slab_serif, mono], LetterSpacing in [tight, normal, wide, ultra_wide]
2. 'symbol_plus_name': BadgeShape in [circle, square, rounded_rect, shield, diamond, hexagon, cut_corner_rect], BadgeStyle in [solid_fill, outline_stroke, double_stroke, split_negative], InternalGlyph in [initial_letter, geometric_cut, diagonal_cross, concentric_ring, horizontal_bars]
3. 'monogram': MonogramType in [single_letter, two_letter_interlock, two_letter_adjacent, three_letter_pyramid], FrameStyle in [none, circle_ring, square_box, bracket_corners, solid_disc], StrokeStyle in [heavy_block, stencil_split, monoline, duoline], FontCategory in [geometric_sans, humanist_sans, high_contrast_serif, slab_serif, mono]
4. 'abstract': GeometryType in [intersecting_rings, nested_polygons, rotational_symmetry_3, rotational_symmetry_4, mobius_fold, isometric_cube, faceted_diamond], StrokeWeight in [thin_precision, medium, heavy_bold], FontCategory in [geometric_sans, humanist_sans, high_contrast_serif, slab_serif, mono]
5. 'icon': MetaphorPrimitive in [shield_security, leaf_growth, node_network, cube_infrastructure, prism_focus, arch_gateway, spark_intelligence, pillar_foundation, wave_flow], Construction in [monoline_stroke, silhouette_solid, split_halves, segmented_arcs], FontCategory in [geometric_sans, humanist_sans, high_contrast_serif, slab_serif, mono]
6. 'minimal': Primitive in [sliced_circle, quadrant_arc, offset_bars, chevron_fold, diagonal_slash, hairline_cross], Orientation in [0_deg, 45_deg, 90_deg, 180_deg, 270_deg], WeightBalance in [monolithic_solid, contrast_duo, negative_aperture], FontCategory in [geometric_sans, humanist_sans, high_contrast_serif, slab_serif, mono]";
        }

        private static bool ValidateSetDiversity(List<BrandLogoConceptParameters> set, List<string> avoidList, string? selectedLogoType = null)
        {
            if (set == null || set.Count < 6) return false;

            if (!string.IsNullOrWhiteSpace(selectedLogoType) && BrandLogoFamilyNames.All.Contains(selectedLogoType))
            {
                if (set.Any(s => !string.Equals(s.Family, selectedLogoType, StringComparison.OrdinalIgnoreCase)))
                    return false;
            }
            else
            {
                var distinctFamilies = set.Select(s => s.Family).Distinct().Count();
                if (distinctFamilies < 4) return false;
            }

            foreach (var concept in set)
            {
                foreach (var avoid in avoidList)
                {
                    if (string.IsNullOrWhiteSpace(avoid)) continue;
                    var term = avoid.Trim().ToLowerInvariant();
                    foreach (var val in concept.Values.Values)
                    {
                        if (val.ToLowerInvariant().Contains(term))
                            return false;
                    }
                }
            }

            return true;
        }

        private static string ResolveArchetype(BrandStrategy strategy, BrandDirectionCandidate? candidate)
        {
            var traits = strategy.PersonalityTraits ?? new List<string>();
            var allText = $"{string.Join(" ", traits)} {candidate?.Name ?? string.Empty} {candidate?.Rationale ?? string.Empty} {candidate?.FeelLine ?? string.Empty}".ToLowerInvariant();

            if (allText.Contains("organ") || allText.Contains("sustain") || allText.Contains("earth") || allText.Contains("green") || allText.Contains("nature") || allText.Contains("wellness") || allText.Contains("food") || allText.Contains("warm"))
                return "organic";

            if (allText.Contains("luxur") || allText.Contains("luxe") || allText.Contains("editor") || allText.Contains("bespoke") || allText.Contains("architect") || allText.Contains("fashion") || allText.Contains("couture") || allText.Contains("elegance"))
                return "luxury";

            if (allText.Contains("tech") || allText.Contains("precision") || allText.Contains("cyber") || allText.Contains("secur") || allText.Contains("data") || allText.Contains("code") || allText.Contains("crypto") || allText.Contains("ai"))
                return "tech";

            if (allText.Contains("bold") || allText.Contains("industr") || allText.Contains("build") || allText.Contains("power") || allText.Contains("heavy") || allText.Contains("construct"))
                return "industrial";

            return "minimal";
        }

        private static List<BrandLogoConceptParameters> GenerateDeterministicParameterSets(
            string brandName,
            BrandStrategy strategy,
            BrandDirection direction,
            BrandDirectionCandidate? candidate,
            List<string> avoidList,
            string? selectedLogoType = null)
        {
            var archetype = ResolveArchetype(strategy, candidate);

            string minimalPrim;
            string wordmarkFont;
            string wordmarkSpacing;
            string symbolShape;
            string symbolFont;
            string monogramFont;
            string abstractGeom;
            string iconMetaphor;

            switch (archetype)
            {
                case "luxury":
                    minimalPrim = "hairline_cross";
                    wordmarkFont = "high_contrast_serif";
                    wordmarkSpacing = "ultra_wide";
                    symbolShape = "diamond";
                    symbolFont = "high_contrast_serif";
                    monogramFont = "high_contrast_serif";
                    abstractGeom = "faceted_diamond";
                    iconMetaphor = "spark_intelligence";
                    break;

                case "organic":
                    minimalPrim = "sliced_circle";
                    wordmarkFont = "humanist_sans";
                    wordmarkSpacing = "normal";
                    symbolShape = "circle";
                    symbolFont = "humanist_sans";
                    monogramFont = "humanist_sans";
                    abstractGeom = "rotational_symmetry_3";
                    iconMetaphor = "leaf_growth";
                    break;

                case "tech":
                    minimalPrim = "offset_bars";
                    wordmarkFont = "mono";
                    wordmarkSpacing = "wide";
                    symbolShape = "hexagon";
                    symbolFont = "geometric_sans";
                    monogramFont = "geometric_sans";
                    abstractGeom = "isometric_cube";
                    iconMetaphor = "node_network";
                    break;

                case "industrial":
                    minimalPrim = "diagonal_slash";
                    wordmarkFont = "slab_serif";
                    wordmarkSpacing = "tight";
                    symbolShape = "square";
                    symbolFont = "slab_serif";
                    monogramFont = "slab_serif";
                    abstractGeom = "rotational_symmetry_4";
                    iconMetaphor = "pillar_foundation";
                    break;

                default: // minimal
                    minimalPrim = "quadrant_arc";
                    wordmarkFont = "geometric_sans";
                    wordmarkSpacing = "wide";
                    symbolShape = "rounded_rect";
                    symbolFont = "geometric_sans";
                    monogramFont = "geometric_sans";
                    abstractGeom = "nested_polygons";
                    iconMetaphor = "prism_focus";
                    break;
            }

            // Apply avoid-list filters
            if (avoidList.Any(a => a.Contains("leaf", StringComparison.OrdinalIgnoreCase)) && iconMetaphor == "leaf_growth")
                iconMetaphor = "spark_intelligence";
            if (avoidList.Any(a => a.Contains("shield", StringComparison.OrdinalIgnoreCase)) && (symbolShape == "shield" || iconMetaphor == "shield_security"))
            {
                symbolShape = "hexagon";
                iconMetaphor = "node_network";
            }
            if (avoidList.Any(a => a.Contains("node", StringComparison.OrdinalIgnoreCase)) && iconMetaphor == "node_network")
                iconMetaphor = "prism_focus";

            // If a specific LogoType was chosen in Step 3, generate 6 diverse variations within that family
            if (!string.IsNullOrWhiteSpace(selectedLogoType) && BrandLogoFamilyNames.All.Contains(selectedLogoType))
            {
                return GenerateFamilySpecificDeterministicParameterSets(
                    brandName, strategy, direction, candidate, avoidList, selectedLogoType, archetype,
                    wordmarkFont, wordmarkSpacing, symbolShape, symbolFont, monogramFont, abstractGeom, iconMetaphor, minimalPrim);
            }

            // Determine layout and composition variety per archetype
            string wordmarkAccent;
            string wordmarkCase;
            string symbolArrangement;
            string monogramFrame;
            string monogramArrangement;
            string abstractArrangement;
            string iconArrangement;
            string minimalArrangement;

            switch (archetype)
            {
                case "luxury":
                    wordmarkAccent = "baseline_underline";
                    wordmarkCase = "uppercase";
                    symbolArrangement = "stacked";
                    monogramFrame = "bracket_corners";
                    monogramArrangement = "stacked";
                    abstractArrangement = "side_by_side";
                    iconArrangement = "stacked";
                    minimalArrangement = "side_by_side";
                    break;

                case "organic":
                    wordmarkAccent = "none";
                    wordmarkCase = "titlecase";
                    symbolArrangement = "side_by_side";
                    monogramFrame = "circle_ring";
                    monogramArrangement = "stacked";
                    abstractArrangement = "side_by_side";
                    iconArrangement = "side_by_side";
                    minimalArrangement = "stacked";
                    break;

                case "industrial":
                    wordmarkAccent = "overscore";
                    wordmarkCase = "uppercase";
                    symbolArrangement = "side_by_side";
                    monogramFrame = "square_box";
                    monogramArrangement = "side_by_side";
                    abstractArrangement = "stacked";
                    iconArrangement = "side_by_side";
                    minimalArrangement = "side_by_side";
                    break;

                case "tech":
                    wordmarkAccent = "terminal_dot";
                    wordmarkCase = "uppercase";
                    symbolArrangement = "side_by_side";
                    monogramFrame = "square_box";
                    monogramArrangement = "side_by_side";
                    abstractArrangement = "side_by_side";
                    iconArrangement = "side_by_side";
                    minimalArrangement = "side_by_side";
                    break;

                default: // minimal
                    wordmarkAccent = "none";
                    wordmarkCase = "uppercase";
                    symbolArrangement = "stacked";
                    monogramFrame = "bracket_corners";
                    monogramArrangement = "side_by_side";
                    abstractArrangement = "side_by_side";
                    iconArrangement = "side_by_side";
                    minimalArrangement = "side_by_side";
                    break;
            }

            return new List<BrandLogoConceptParameters>
            {
                // Concept 1: Minimal
                new()
                {
                    Family = BrandLogoFamilyNames.Minimal,
                    Descriptor = $"Minimal {minimalPrim.Replace('_', ' ')} conveying focus and structural momentum",
                    Values = new()
                    {
                        ["Primitive"] = minimalPrim,
                        ["Orientation"] = "0_deg",
                        ["WeightBalance"] = "monolithic_solid",
                        ["FontCategory"] = wordmarkFont,
                        ["Arrangement"] = minimalArrangement
                    }
                },
                // Concept 2: Wordmark
                new()
                {
                    Family = BrandLogoFamilyNames.Wordmark,
                    Descriptor = $"Refined typographic lockup in {wordmarkFont.Replace('_', ' ')} with balanced letter-spacing",
                    Values = new()
                    {
                        ["Layout"] = "tracked_wide",
                        ["LetterCase"] = wordmarkCase,
                        ["AccentElement"] = wordmarkAccent,
                        ["FontCategory"] = wordmarkFont,
                        ["LetterSpacing"] = wordmarkSpacing
                    }
                },
                // Concept 3: Symbol Plus Name
                new()
                {
                    Family = BrandLogoFamilyNames.SymbolPlusName,
                    Descriptor = $"Precision {symbolShape} emblem enclosing the brand initial with balanced text",
                    Values = new()
                    {
                        ["BadgeShape"] = symbolShape,
                        ["BadgeStyle"] = "outline_stroke",
                        ["InternalGlyph"] = "initial_letter",
                        ["FontCategory"] = symbolFont,
                        ["Arrangement"] = symbolArrangement
                    }
                },
                // Concept 4: Monogram
                new()
                {
                    Family = BrandLogoFamilyNames.Monogram,
                    Descriptor = $"Interlocking monogram badge rendered in {monogramFont.Replace('_', ' ')}",
                    Values = new()
                    {
                        ["MonogramType"] = "two_letter_interlock",
                        ["FrameStyle"] = monogramFrame,
                        ["StrokeStyle"] = "heavy_block",
                        ["FontCategory"] = monogramFont,
                        ["Arrangement"] = monogramArrangement
                    }
                },
                // Concept 5: Abstract
                new()
                {
                    Family = BrandLogoFamilyNames.Abstract,
                    Descriptor = $"Geometric {abstractGeom.Replace('_', ' ')} expressing dynamic continuity",
                    Values = new()
                    {
                        ["GeometryType"] = abstractGeom,
                        ["StrokeWeight"] = "heavy_bold",
                        ["FontCategory"] = wordmarkFont,
                        ["Arrangement"] = abstractArrangement
                    }
                },
                // Concept 6: Icon
                new()
                {
                    Family = BrandLogoFamilyNames.Icon,
                    Descriptor = $"Stylized {iconMetaphor.Replace('_', ' ')} constructed from clean geometric lines",
                    Values = new()
                    {
                        ["MetaphorPrimitive"] = iconMetaphor,
                        ["Construction"] = "silhouette_solid",
                        ["FontCategory"] = wordmarkFont,
                        ["Arrangement"] = iconArrangement
                    }
                }
            };
        }

        private static List<BrandLogoConceptParameters> GenerateFamilySpecificDeterministicParameterSets(
            string brandName,
            BrandStrategy strategy,
            BrandDirection direction,
            BrandDirectionCandidate? candidate,
            List<string> avoidList,
            string family,
            string archetype,
            string wordmarkFont,
            string wordmarkSpacing,
            string symbolShape,
            string symbolFont,
            string monogramFont,
            string abstractGeom,
            string iconMetaphor,
            string minimalPrim)
        {
            var initial = !string.IsNullOrWhiteSpace(brandName) ? brandName.Trim()[0].ToString().ToUpperInvariant() : "B";

            switch (family)
            {
                case BrandLogoFamilyNames.SymbolPlusName:
                    var badgeShapes = new[] { symbolShape, "shield", "circle", "diamond", "rounded_rect", "square" };
                    if (avoidList.Any(a => a.Contains("shield", StringComparison.OrdinalIgnoreCase)))
                        badgeShapes = new[] { symbolShape, "hexagon", "circle", "diamond", "rounded_rect", "square" };

                    return new List<BrandLogoConceptParameters>
                    {
                        new()
                        {
                            Family = BrandLogoFamilyNames.SymbolPlusName,
                            Descriptor = $"Hexagonal emblem framing '{initial}' with structured {wordmarkFont.Replace('_', ' ')} type",
                            Values = new() { ["BadgeShape"] = badgeShapes[0], ["BadgeStyle"] = "outline_stroke", ["InternalGlyph"] = "initial_letter", ["FontCategory"] = wordmarkFont, ["Arrangement"] = "side_by_side" }
                        },
                        new()
                        {
                            Family = BrandLogoFamilyNames.SymbolPlusName,
                            Descriptor = $"Shield crest badge enclosing brand initial with balanced lockup",
                            Values = new() { ["BadgeShape"] = badgeShapes[1], ["BadgeStyle"] = "outline_stroke", ["InternalGlyph"] = "initial_letter", ["FontCategory"] = "geometric_sans", ["Arrangement"] = "side_by_side" }
                        },
                        new()
                        {
                            Family = BrandLogoFamilyNames.SymbolPlusName,
                            Descriptor = $"Circular medallion emblem positioned above centered brand name",
                            Values = new() { ["BadgeShape"] = badgeShapes[2], ["BadgeStyle"] = "outline_stroke", ["InternalGlyph"] = "initial_letter", ["FontCategory"] = "humanist_sans", ["Arrangement"] = "stacked" }
                        },
                        new()
                        {
                            Family = BrandLogoFamilyNames.SymbolPlusName,
                            Descriptor = $"Diamond insignia with geometric cut accent in high-contrast serif",
                            Values = new() { ["BadgeShape"] = badgeShapes[3], ["BadgeStyle"] = "outline_stroke", ["InternalGlyph"] = "initial_letter", ["FontCategory"] = "high_contrast_serif", ["Arrangement"] = "side_by_side" }
                        },
                        new()
                        {
                            Family = BrandLogoFamilyNames.SymbolPlusName,
                            Descriptor = $"Rounded rectangular seal with modern technical typography",
                            Values = new() { ["BadgeShape"] = badgeShapes[4], ["BadgeStyle"] = "outline_stroke", ["InternalGlyph"] = "initial_letter", ["FontCategory"] = "mono", ["Arrangement"] = "side_by_side" }
                        },
                        new()
                        {
                            Family = BrandLogoFamilyNames.SymbolPlusName,
                            Descriptor = $"Architectural square mark set above stacked name typography",
                            Values = new() { ["BadgeShape"] = badgeShapes[5], ["BadgeStyle"] = "outline_stroke", ["InternalGlyph"] = "initial_letter", ["FontCategory"] = "slab_serif", ["Arrangement"] = "stacked" }
                        }
                    };

                case BrandLogoFamilyNames.Wordmark:
                    return new List<BrandLogoConceptParameters>
                    {
                        new()
                        {
                            Family = BrandLogoFamilyNames.Wordmark,
                            Descriptor = "Spaced geometric sans uppercase wordmark with wide tracking",
                            Values = new() { ["Layout"] = "tracked_wide", ["LetterCase"] = "uppercase", ["AccentElement"] = "none", ["FontCategory"] = "geometric_sans", ["LetterSpacing"] = "wide" }
                        },
                        new()
                        {
                            Family = BrandLogoFamilyNames.Wordmark,
                            Descriptor = "Bold uppercase lockup with precision terminal accent dot",
                            Values = new() { ["Layout"] = "tight_bold", ["LetterCase"] = "uppercase", ["AccentElement"] = "terminal_dot", ["FontCategory"] = "geometric_sans", ["LetterSpacing"] = "tight" }
                        },
                        new()
                        {
                            Family = BrandLogoFamilyNames.Wordmark,
                            Descriptor = "High-contrast serif wordmark with grounded baseline rule",
                            Values = new() { ["Layout"] = "tracked_wide", ["LetterCase"] = "uppercase", ["AccentElement"] = "baseline_underline", ["FontCategory"] = "high_contrast_serif", ["LetterSpacing"] = "ultra_wide" }
                        },
                        new()
                        {
                            Family = BrandLogoFamilyNames.Wordmark,
                            Descriptor = "Natural titlecase humanist sans typography with balanced spacing",
                            Values = new() { ["Layout"] = "single_line", ["LetterCase"] = "titlecase", ["AccentElement"] = "none", ["FontCategory"] = "humanist_sans", ["LetterSpacing"] = "normal" }
                        },
                        new()
                        {
                            Family = BrandLogoFamilyNames.Wordmark,
                            Descriptor = "Technical monospace wordmark with precision structural overscore",
                            Values = new() { ["Layout"] = "tracked_wide", ["LetterCase"] = "uppercase", ["AccentElement"] = "overscore", ["FontCategory"] = "mono", ["LetterSpacing"] = "wide" }
                        },
                        new()
                        {
                            Family = BrandLogoFamilyNames.Wordmark,
                            Descriptor = "Solid slab-serif lockup with modern split accent details",
                            Values = new() { ["Layout"] = "tight_bold", ["LetterCase"] = "uppercase", ["AccentElement"] = "split_dot", ["FontCategory"] = "slab_serif", ["LetterSpacing"] = "normal" }
                        }
                    };

                case BrandLogoFamilyNames.Monogram:
                    return new List<BrandLogoConceptParameters>
                    {
                        new()
                        {
                            Family = BrandLogoFamilyNames.Monogram,
                            Descriptor = "Interlocking monogram with bracket corner frame in geometric sans",
                            Values = new() { ["MonogramType"] = "two_letter_interlock", ["FrameStyle"] = "bracket_corners", ["StrokeStyle"] = "heavy_block", ["FontCategory"] = "geometric_sans", ["Arrangement"] = "side_by_side" }
                        },
                        new()
                        {
                            Family = BrandLogoFamilyNames.Monogram,
                            Descriptor = "Single-letter circular monogram with clean monoline construction",
                            Values = new() { ["MonogramType"] = "single_letter", ["FrameStyle"] = "circle_ring", ["StrokeStyle"] = "monoline", ["FontCategory"] = "humanist_sans", ["Arrangement"] = "stacked" }
                        },
                        new()
                        {
                            Family = BrandLogoFamilyNames.Monogram,
                            Descriptor = "Adjacent monogram inside architectural square box frame",
                            Values = new() { ["MonogramType"] = "two_letter_adjacent", ["FrameStyle"] = "square_box", ["StrokeStyle"] = "stencil_split", ["FontCategory"] = "mono", ["Arrangement"] = "side_by_side" }
                        },
                        new()
                        {
                            Family = BrandLogoFamilyNames.Monogram,
                            Descriptor = "Solid disc monogram badge with high-contrast serif lettering",
                            Values = new() { ["MonogramType"] = "two_letter_interlock", ["FrameStyle"] = "solid_disc", ["StrokeStyle"] = "heavy_block", ["FontCategory"] = "high_contrast_serif", ["Arrangement"] = "stacked" }
                        },
                        new()
                        {
                            Family = BrandLogoFamilyNames.Monogram,
                            Descriptor = "Frameless dual-line monogram letterform in slab-serif",
                            Values = new() { ["MonogramType"] = "single_letter", ["FrameStyle"] = "none", ["StrokeStyle"] = "duoline", ["FontCategory"] = "slab_serif", ["Arrangement"] = "side_by_side" }
                        },
                        new()
                        {
                            Family = BrandLogoFamilyNames.Monogram,
                            Descriptor = "Three-letter pyramid monogram badge with balanced type",
                            Values = new() { ["MonogramType"] = "three_letter_pyramid", ["FrameStyle"] = "bracket_corners", ["StrokeStyle"] = "monoline", ["FontCategory"] = "geometric_sans", ["Arrangement"] = "stacked" }
                        }
                    };

                case BrandLogoFamilyNames.Abstract:
                    return new List<BrandLogoConceptParameters>
                    {
                        new()
                        {
                            Family = BrandLogoFamilyNames.Abstract,
                            Descriptor = "Faceted geometric diamond structure expressing precision",
                            Values = new() { ["GeometryType"] = "faceted_diamond", ["StrokeWeight"] = "heavy_bold", ["FontCategory"] = "geometric_sans", ["Arrangement"] = "side_by_side" }
                        },
                        new()
                        {
                            Family = BrandLogoFamilyNames.Abstract,
                            Descriptor = "Tri-fold rotational symmetry emblem with dynamic balance",
                            Values = new() { ["GeometryType"] = "rotational_symmetry_3", ["StrokeWeight"] = "medium", ["FontCategory"] = "humanist_sans", ["Arrangement"] = "side_by_side" }
                        },
                        new()
                        {
                            Family = BrandLogoFamilyNames.Abstract,
                            Descriptor = "Isometric dimensional cube positioned above centered lockup",
                            Values = new() { ["GeometryType"] = "isometric_cube", ["StrokeWeight"] = "heavy_bold", ["FontCategory"] = "mono", ["Arrangement"] = "stacked" }
                        },
                        new()
                        {
                            Family = BrandLogoFamilyNames.Abstract,
                            Descriptor = "Four-axis rotational geometry with solid weight",
                            Values = new() { ["GeometryType"] = "rotational_symmetry_4", ["StrokeWeight"] = "heavy_bold", ["FontCategory"] = "slab_serif", ["Arrangement"] = "side_by_side" }
                        },
                        new()
                        {
                            Family = BrandLogoFamilyNames.Abstract,
                            Descriptor = "Intersecting precision rings in high-contrast editorial styling",
                            Values = new() { ["GeometryType"] = "intersecting_rings", ["StrokeWeight"] = "thin_precision", ["FontCategory"] = "high_contrast_serif", ["Arrangement"] = "stacked" }
                        },
                        new()
                        {
                            Family = BrandLogoFamilyNames.Abstract,
                            Descriptor = "Continuous Mobius fold geometry conveying seamless flow",
                            Values = new() { ["GeometryType"] = "mobius_fold", ["StrokeWeight"] = "medium", ["FontCategory"] = "geometric_sans", ["Arrangement"] = "side_by_side" }
                        }
                    };

                case BrandLogoFamilyNames.Icon:
                    return new List<BrandLogoConceptParameters>
                    {
                        new()
                        {
                            Family = BrandLogoFamilyNames.Icon,
                            Descriptor = "Shield security metaphor constructed from clean geometric lines",
                            Values = new() { ["MetaphorPrimitive"] = "shield_security", ["Construction"] = "monoline_stroke", ["FontCategory"] = "geometric_sans", ["Arrangement"] = "side_by_side" }
                        },
                        new()
                        {
                            Family = BrandLogoFamilyNames.Icon,
                            Descriptor = "Connected node network icon with solid silhouette styling",
                            Values = new() { ["MetaphorPrimitive"] = "node_network", ["Construction"] = "silhouette_solid", ["FontCategory"] = "geometric_sans", ["Arrangement"] = "side_by_side" }
                        },
                        new()
                        {
                            Family = BrandLogoFamilyNames.Icon,
                            Descriptor = "Growth leaf metaphor set above centered typography",
                            Values = new() { ["MetaphorPrimitive"] = "leaf_growth", ["Construction"] = "monoline_stroke", ["FontCategory"] = "humanist_sans", ["Arrangement"] = "stacked" }
                        },
                        new()
                        {
                            Family = BrandLogoFamilyNames.Icon,
                            Descriptor = "Prism focus icon with precision split construction",
                            Values = new() { ["MetaphorPrimitive"] = "prism_focus", ["Construction"] = "split_halves", ["FontCategory"] = "mono", ["Arrangement"] = "side_by_side" }
                        },
                        new()
                        {
                            Family = BrandLogoFamilyNames.Icon,
                            Descriptor = "Architectural pillar metaphor expressing institutional strength",
                            Values = new() { ["MetaphorPrimitive"] = "pillar_foundation", ["Construction"] = "silhouette_solid", ["FontCategory"] = "slab_serif", ["Arrangement"] = "side_by_side" }
                        },
                        new()
                        {
                            Family = BrandLogoFamilyNames.Icon,
                            Descriptor = "Spark intelligence emblem with segmented precision arcs",
                            Values = new() { ["MetaphorPrimitive"] = "spark_intelligence", ["Construction"] = "segmented_arcs", ["FontCategory"] = "high_contrast_serif", ["Arrangement"] = "stacked" }
                        }
                    };

                default: // Minimal
                    return new List<BrandLogoConceptParameters>
                    {
                        new()
                        {
                            Family = BrandLogoFamilyNames.Minimal,
                            Descriptor = "Hairline cross primitive conveying focus and balance",
                            Values = new() { ["Primitive"] = "hairline_cross", ["Orientation"] = "0_deg", ["WeightBalance"] = "monolithic_solid", ["FontCategory"] = "geometric_sans", ["Arrangement"] = "side_by_side" }
                        },
                        new()
                        {
                            Family = BrandLogoFamilyNames.Minimal,
                            Descriptor = "Sliced circle emblem with dual contrast weighting",
                            Values = new() { ["Primitive"] = "sliced_circle", ["Orientation"] = "45_deg", ["WeightBalance"] = "contrast_duo", ["FontCategory"] = "humanist_sans", ["Arrangement"] = "stacked" }
                        },
                        new()
                        {
                            Family = BrandLogoFamilyNames.Minimal,
                            Descriptor = "Offset precision bars in modern monospaced lockup",
                            Values = new() { ["Primitive"] = "offset_bars", ["Orientation"] = "90_deg", ["WeightBalance"] = "monolithic_solid", ["FontCategory"] = "mono", ["Arrangement"] = "side_by_side" }
                        },
                        new()
                        {
                            Family = BrandLogoFamilyNames.Minimal,
                            Descriptor = "Quadrant arc geometry with negative aperture styling",
                            Values = new() { ["Primitive"] = "quadrant_arc", ["Orientation"] = "180_deg", ["WeightBalance"] = "negative_aperture", ["FontCategory"] = "high_contrast_serif", ["Arrangement"] = "side_by_side" }
                        },
                        new()
                        {
                            Family = BrandLogoFamilyNames.Minimal,
                            Descriptor = "Diagonal slash mark positioned over stacked name",
                            Values = new() { ["Primitive"] = "diagonal_slash", ["Orientation"] = "45_deg", ["WeightBalance"] = "contrast_duo", ["FontCategory"] = "slab_serif", ["Arrangement"] = "stacked" }
                        },
                        new()
                        {
                            Family = BrandLogoFamilyNames.Minimal,
                            Descriptor = "Chevron fold linework with solid monolithic weighting",
                            Values = new() { ["Primitive"] = "chevron_fold", ["Orientation"] = "270_deg", ["WeightBalance"] = "monolithic_solid", ["FontCategory"] = "geometric_sans", ["Arrangement"] = "side_by_side" }
                        }
                    };
            }
        }

        private static BrandLogoConceptParameters GenerateDeterministicSingleParameterSet(
            string brandName,
            BrandStrategy strategy,
            BrandDirection direction,
            string family,
            int seed,
            List<string> avoidList)
        {
            var sets = GenerateDeterministicParameterSets(brandName, strategy, direction, null, avoidList, family);
            if (sets != null && sets.Count > 0)
            {
                var index = Math.Abs(seed) % sets.Count;
                return sets[index];
            }

            return new BrandLogoConceptParameters
            {
                Family = family,
                Values = new()
                {
                    ["FontCategory"] = "geometric_sans"
                }
            };
        }

        private async Task<string> SaveSvgAssetAsync(string ideaId, string key, string svgContent)
        {
            var webRoot = _env?.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var relativeFolder = Path.Combine("brand-assets", "logos", ideaId);
            var targetFolder = Path.Combine(webRoot, relativeFolder);

            Directory.CreateDirectory(targetFolder);

            var fileName = $"{key}.svg";
            var targetFilePath = Path.Combine(targetFolder, fileName);

            await File.WriteAllTextAsync(targetFilePath, svgContent);

            return $"/brand-assets/logos/{ideaId}/{fileName}".Replace('\\', '/');
        }
    }
}
