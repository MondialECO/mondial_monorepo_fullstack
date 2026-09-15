using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Ai.Providers;
using BrandKitModel = WebApp.Models.DatabaseModels.BrandKit;

namespace WebApp.Services.Creator.BrandKit.LogoEngine
{
    public class LogoGenerationService : ILogoGenerationService
    {
        private readonly ILogoMarkRendererRegistry _rendererRegistry;
        private readonly IAiProvider? _aiProvider;
        private readonly IModelRouter? _modelRouter;
        private readonly string _webRootPath;
        private readonly ILogger<LogoGenerationService> _logger;

        public LogoGenerationService(
            ILogoMarkRendererRegistry rendererRegistry,
            IAiProvider? aiProvider = null,
            IModelRouter? modelRouter = null,
            IWebHostEnvironment? env = null,
            ILogger<LogoGenerationService>? logger = null)
        {
            _rendererRegistry = rendererRegistry ?? throw new ArgumentNullException(nameof(rendererRegistry));
            _aiProvider = aiProvider;
            _modelRouter = modelRouter;
            _logger = logger ?? NullLogger<LogoGenerationService>.Instance;

            _webRootPath = env?.WebRootPath
                ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
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

            List<BrandLogoConceptParameters>? rawParamSets = null;

            if (_aiProvider != null)
            {
                try
                {
                    rawParamSets = await QueryAiForParameterSetsAsync(brandName, strategy, direction, selectedCand, avoidList, cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "AI model parameter selection call failed. Falling back to deterministic parametric synthesis.");
                }
            }

            if (rawParamSets == null || rawParamSets.Count < 6 || !ValidateSetDiversity(rawParamSets, avoidList))
            {
                rawParamSets = GenerateDeterministicParameterSets(brandName, strategy, direction, selectedCand, avoidList);
            }

            var concepts = new List<BrandLogoConcept>();
            for (int i = 0; i < 6; i++)
            {
                var conceptKey = $"concept_{i + 1}";
                var param = rawParamSets[i];
                var descriptor = param.Descriptor ?? $"Concept {i + 1}: {param.Family} visual direction";

                var svgContent = _rendererRegistry.RenderSvg(param, brandName);
                var assetUri = await SaveSvgAssetAsync(idea.Id, conceptKey, svgContent);

                concepts.Add(new BrandLogoConcept
                {
                    Key = conceptKey,
                    DescriptorLine = descriptor,
                    AssetUri = assetUri,
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

            var existingConcept = kit.Logo?.Concepts?.FirstOrDefault(c => c.Key == targetConceptKey);
            var existingRegenCount = existingConcept?.RegenerateCount ?? 0;

            // Pick an alternative family or distinct parameter variation
            var seedIndex = (existingRegenCount + 1) % BrandLogoFamilyNames.All.Count;
            var targetFamily = BrandLogoFamilyNames.All[seedIndex];

            var synthParams = GenerateDeterministicSingleParameterSet(brandName, targetFamily, existingRegenCount + 1, avoidList);
            var descriptor = $"Regenerated {targetFamily} direction tailored to {selectedCand?.Name ?? "brand identity"}";
            synthParams.Descriptor = descriptor;

            var svgContent = _rendererRegistry.RenderSvg(synthParams, brandName);
            var assetUri = await SaveSvgAssetAsync(idea.Id, targetConceptKey, svgContent);

            return new BrandLogoConcept
            {
                Key = targetConceptKey,
                DescriptorLine = descriptor,
                AssetUri = assetUri,
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
            CancellationToken cancellationToken)
        {
            var modelId = _modelRouter?.Resolve("LogoParameterSelection") ?? "anthropic/claude-3.5-sonnet";
            var prompt = BuildPrompt(brandName, strategy, direction, candidate, avoidList);

            var request = new AiCompletionRequest
            {
                Model = modelId,
                Messages = new[]
                {
                    new AiMessage("system", "You are an expert brand identity designer. You select parameters from bounded geometric design systems for deterministic SVG rendering. Output strictly JSON."),
                    new AiMessage("user", prompt)
                },
                Temperature = 0.4,
                ResponseFormat = "json_object"
            };

            var completion = await _aiProvider!.CompleteAsync(request, cancellationToken);
            if (string.IsNullOrWhiteSpace(completion?.Text))
                return null;

            var jsonText = completion.Text.Trim();
            if (jsonText.StartsWith("```json", StringComparison.OrdinalIgnoreCase))
            {
                jsonText = jsonText.Substring(7);
                if (jsonText.EndsWith("```")) jsonText = jsonText[..^3];
                jsonText = jsonText.Trim();
            }

            var doc = JsonDocument.Parse(jsonText);
            var root = doc.RootElement;
            JsonElement conceptsElem;
            if (root.ValueKind == JsonValueKind.Array)
            {
                conceptsElem = root;
            }
            else if (root.TryGetProperty("concepts", out var cElem) && cElem.ValueKind == JsonValueKind.Array)
            {
                conceptsElem = cElem;
            }
            else
            {
                return null;
            }

            var list = new List<BrandLogoConceptParameters>();
            foreach (var item in conceptsElem.EnumerateArray())
            {
                var family = item.TryGetProperty("family", out var f) ? f.GetString() ?? "" : "";
                var desc = item.TryGetProperty("descriptor", out var d) ? d.GetString() ?? "" : "";
                var dict = new Dictionary<string, string>();

                if (item.TryGetProperty("parameters", out var pElem) && pElem.ValueKind == JsonValueKind.Object)
                {
                    foreach (var prop in pElem.EnumerateObject())
                    {
                        dict[prop.Name] = prop.Value.GetString() ?? "";
                    }
                }

                var param = new BrandLogoConceptParameters
                {
                    Family = family,
                    Descriptor = desc,
                    Values = dict
                };

                if (_rendererRegistry.ValidateParameters(param, out _))
                {
                    list.Add(param);
                }
            }

            return list;
        }

        private static string BuildPrompt(
            string brandName,
            BrandStrategy strategy,
            BrandDirection direction,
            BrandDirectionCandidate? candidate,
            List<string> avoidList)
        {
            var traits = string.Join(", ", strategy.PersonalityTraits ?? new List<string>());
            var avoids = string.Join(", ", avoidList);

            return $@"Select discrete parameters for 6 distinct logo concepts for the brand '{brandName}'.
Brand Personality Traits: {traits}
Selected Direction: {candidate?.Name} ({candidate?.DisplayTypeface} + {candidate?.TextTypeface})
Avoided Elements: {avoids}

You MUST choose parameters for 6 distinct concepts covering at least 4 of the following families:
1. 'wordmark': Layout in [single_line, stacked_two_line, tracked_wide, tight_bold], LetterCase in [uppercase, lowercase, titlecase], AccentElement in [none, terminal_dot, baseline_underline, overscore, split_dot], FontCategory in [geometric_sans, humanist_sans, high_contrast_serif, slab_serif, mono], LetterSpacing in [tight, normal, wide, ultra_wide]
2. 'symbol_plus_name': BadgeShape in [circle, square, rounded_rect, shield, diamond, hexagon, cut_corner_rect], BadgeStyle in [solid_fill, outline_stroke, double_stroke, split_negative], InternalGlyph in [initial_letter, geometric_cut, diagonal_cross, concentric_ring, horizontal_bars], Arrangement in [side_by_side_left, side_by_side_right, stacked_top, stacked_bottom]
3. 'monogram': MonogramType in [single_letter, two_letter_interlock, two_letter_adjacent, three_letter_pyramid], FrameStyle in [none, circle_ring, square_box, bracket_corners, solid_disc], StrokeStyle in [heavy_block, stencil_split, monoline, duoline]
4. 'abstract': GeometryType in [intersecting_rings, nested_polygons, rotational_symmetry_3, rotational_symmetry_4, mobius_fold, isometric_cube, wave_frequencies], StrokeWeight in [thin_precision, medium, heavy_bold]
5. 'icon': MetaphorPrimitive in [shield_security, leaf_growth, node_network, cube_infrastructure, prism_focus, arch_gateway, globe_connected, spark_intelligence, pillar_foundation, wave_flow], Construction in [monoline_stroke, silhouette_solid, split_halves, segmented_arcs]
6. 'minimal': Primitive in [sliced_circle, quadrant_arc, offset_bars, chevron_fold, diagonal_slash, concentric_arc], Orientation in [0_deg, 45_deg, 90_deg, 180_deg, 270_deg], WeightBalance in [monolithic_solid, contrast_duo, negative_aperture]

Output JSON format:
{{
  ""concepts"": [
    {{
      ""family"": ""minimal"",
      ""descriptor"": ""Bold sliced circular gesture representing clarity and momentum"",
      ""parameters"": {{ ""Primitive"": ""sliced_circle"", ""Orientation"": ""0_deg"", ""WeightBalance"": ""monolithic_solid"" }}
    }}
  ]
}}";
        }

        private static bool ValidateSetDiversity(List<BrandLogoConceptParameters> set, List<string> avoidList)
        {
            if (set == null || set.Count < 6) return false;

            var distinctFamilies = set.Select(s => s.Family).Distinct().Count();
            if (distinctFamilies < 4) return false;

            // Check avoid list
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

        private static List<BrandLogoConceptParameters> GenerateDeterministicParameterSets(
            string brandName,
            BrandStrategy strategy,
            BrandDirection direction,
            BrandDirectionCandidate? candidate,
            List<string> avoidList)
        {
            var isTech = strategy.PersonalityTraits.Any(t => t.Contains("tech", StringComparison.OrdinalIgnoreCase) || t.Contains("precision", StringComparison.OrdinalIgnoreCase) || t.Contains("visionary", StringComparison.OrdinalIgnoreCase) || t.Contains("bold", StringComparison.OrdinalIgnoreCase));
            var isOrganic = strategy.PersonalityTraits.Any(t => t.Contains("organic", StringComparison.OrdinalIgnoreCase) || t.Contains("sustainable", StringComparison.OrdinalIgnoreCase) || t.Contains("warm", StringComparison.OrdinalIgnoreCase));

            var iconMetaphor = isOrganic ? "leaf_growth" : (isTech ? "node_network" : "spark_intelligence");
            if (avoidList.Any(a => a.Contains("leaf", StringComparison.OrdinalIgnoreCase)) && iconMetaphor == "leaf_growth")
                iconMetaphor = "spark_intelligence";
            if (avoidList.Any(a => a.Contains("node", StringComparison.OrdinalIgnoreCase)) && iconMetaphor == "node_network")
                iconMetaphor = "arch_gateway";

            var badgeShape = isOrganic ? "circle" : (isTech ? "hexagon" : "rounded_rect");
            if (avoidList.Any(a => a.Contains("shield", StringComparison.OrdinalIgnoreCase)) && badgeShape == "shield")
                badgeShape = "hexagon";

            return new List<BrandLogoConceptParameters>
            {
                // Concept 1: Minimal primitive
                new()
                {
                    Family = BrandLogoFamilyNames.Minimal,
                    Descriptor = "Bold geometric quadrant mark conveying focus and structural momentum",
                    Values = new()
                    {
                        ["Primitive"] = isTech ? "offset_bars" : "sliced_circle",
                        ["Orientation"] = "0_deg",
                        ["WeightBalance"] = "monolithic_solid",
                        ["Aspect"] = "square"
                    }
                },
                // Concept 2: Wordmark typographic structure
                new()
                {
                    Family = BrandLogoFamilyNames.Wordmark,
                    Descriptor = "Refined typographic lockup with geometric letter-spacing and terminal accent",
                    Values = new()
                    {
                        ["Layout"] = "tracked_wide",
                        ["LetterCase"] = "uppercase",
                        ["AccentElement"] = "terminal_dot",
                        ["FontCategory"] = isTech ? "mono" : "geometric_sans",
                        ["LetterSpacing"] = "wide"
                    }
                },
                // Concept 3: Emblem Symbol + Name
                new()
                {
                    Family = BrandLogoFamilyNames.SymbolPlusName,
                    Descriptor = $"Precision {badgeShape} emblem enclosing the brand initial with balanced text",
                    Values = new()
                    {
                        ["BadgeShape"] = badgeShape,
                        ["BadgeStyle"] = "outline_stroke",
                        ["InternalGlyph"] = "initial_letter",
                        ["Arrangement"] = "side_by_side_left",
                        ["SymbolToTextRatio"] = "balanced"
                    }
                },
                // Concept 4: Architectural Monogram
                new()
                {
                    Family = BrandLogoFamilyNames.Monogram,
                    Descriptor = "Interlocking initials framed within a structured geometric enclosure",
                    Values = new()
                    {
                        ["MonogramType"] = "two_letter_interlock",
                        ["FrameStyle"] = "square_box",
                        ["StrokeStyle"] = "heavy_block",
                        ["InitialsSource"] = "two_initials",
                        ["OverlapTreatment"] = "cutout_gap"
                    }
                },
                // Concept 5: Geometric Abstract
                new()
                {
                    Family = BrandLogoFamilyNames.Abstract,
                    Descriptor = "Harmonious rotational geometry expressing innovation and dynamic continuity",
                    Values = new()
                    {
                        ["GeometryType"] = isTech ? "rotational_symmetry_4" : "rotational_symmetry_3",
                        ["Symmetry"] = isTech ? "radial_4" : "radial_3",
                        ["StrokeWeight"] = "heavy_bold",
                        ["Density"] = "balanced_5_elements",
                        ["NegativeSpace"] = "central_cutout"
                    }
                },
                // Concept 6: Semantic Icon
                new()
                {
                    Family = BrandLogoFamilyNames.Icon,
                    Descriptor = $"Stylized {iconMetaphor.Replace('_', ' ')} metaphor constructed from clean geometric lines",
                    Values = new()
                    {
                        ["MetaphorPrimitive"] = iconMetaphor,
                        ["Construction"] = "silhouette_solid",
                        ["CornerStyle"] = "subtle_round",
                        ["CutoutDetail"] = "inner_dot"
                    }
                }
            };
        }

        private static BrandLogoConceptParameters GenerateDeterministicSingleParameterSet(
            string brandName,
            string family,
            int variantSeed,
            List<string> avoidList)
        {
            var p = new BrandLogoConceptParameters { Family = family };
            switch (family)
            {
                case BrandLogoFamilyNames.Wordmark:
                    p.Values = new()
                    {
                        ["Layout"] = (variantSeed % 2 == 0) ? "tight_bold" : "tracked_wide",
                        ["LetterCase"] = "uppercase",
                        ["AccentElement"] = (variantSeed % 3 == 0) ? "baseline_underline" : "terminal_dot",
                        ["FontCategory"] = "geometric_sans",
                        ["LetterSpacing"] = "wide"
                    };
                    break;
                case BrandLogoFamilyNames.SymbolPlusName:
                    p.Values = new()
                    {
                        ["BadgeShape"] = (variantSeed % 2 == 0) ? "circle" : "hexagon",
                        ["BadgeStyle"] = "solid_fill",
                        ["InternalGlyph"] = "initial_letter",
                        ["Arrangement"] = "side_by_side_left",
                        ["SymbolToTextRatio"] = "balanced"
                    };
                    break;
                case BrandLogoFamilyNames.Monogram:
                    p.Values = new()
                    {
                        ["MonogramType"] = "single_letter",
                        ["FrameStyle"] = "circle_ring",
                        ["StrokeStyle"] = "heavy_block",
                        ["InitialsSource"] = "first_letter",
                        ["OverlapTreatment"] = "cutout_gap"
                    };
                    break;
                case BrandLogoFamilyNames.Abstract:
                    p.Values = new()
                    {
                        ["GeometryType"] = (variantSeed % 2 == 0) ? "isometric_cube" : "rotational_symmetry_4",
                        ["Symmetry"] = "radial_4",
                        ["StrokeWeight"] = "heavy_bold",
                        ["Density"] = "balanced_5_elements",
                        ["NegativeSpace"] = "none"
                    };
                    break;
                case BrandLogoFamilyNames.Icon:
                    var primitive = (variantSeed % 2 == 0) ? "node_network" : "spark_intelligence";
                    p.Values = new()
                    {
                        ["MetaphorPrimitive"] = primitive,
                        ["Construction"] = "silhouette_solid",
                        ["CornerStyle"] = "subtle_round",
                        ["CutoutDetail"] = "inner_dot"
                    };
                    break;
                default: // Minimal
                    p.Values = new()
                    {
                        ["Primitive"] = (variantSeed % 2 == 0) ? "concentric_arc" : "offset_bars",
                        ["Orientation"] = "90_deg",
                        ["WeightBalance"] = "monolithic_solid",
                        ["Aspect"] = "square"
                    };
                    break;
            }
            return p;
        }

        private async Task<string> SaveSvgAssetAsync(string ideaId, string conceptKey, string svgContent)
        {
            var dir = Path.Combine(_webRootPath, "brand-assets", "logos", ideaId);
            if (!Directory.Exists(dir))
            {
                Directory.CreateDirectory(dir);
            }

            var timestamp = DateTime.UtcNow.Ticks;
            var fileName = $"{conceptKey}_{timestamp}.svg";
            var filePath = Path.Combine(dir, fileName);

            await File.WriteAllTextAsync(filePath, svgContent, Encoding.UTF8);

            return $"/brand-assets/logos/{ideaId}/{fileName}";
        }
    }
}
