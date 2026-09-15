using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Ai;
using WebApp.Services.Ai.Providers;
using BrandKitModel = WebApp.Models.DatabaseModels.BrandKit;

namespace WebApp.Services.Creator.BrandKit.LogoEngine
{
    public class LogoGenerationService : ILogoGenerationService
    {
        private readonly ILogoMarkRendererRegistry _rendererRegistry;
        private readonly IAiProvider? _aiProvider;
        private readonly IModelRouter? _modelRouter;
        private readonly IWebHostEnvironment? _env;
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
            _env = env;
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

            List<BrandLogoConceptParameters>? rawParamSets = null;

            if (_aiProvider != null)
            {
                try
                {
                    rawParamSets = await QueryAiForParameterSetsAsync(brandName, strategy, direction, selectedCand, avoidList, cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "AI parameter generation failed for brand '{BrandName}'. Falling back to deterministic generation.", brandName);
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

                var markSvg = _rendererRegistry.RenderMarkSvg(param, brandName);
                var markAssetUri = await SaveSvgAssetAsync(idea.Id, $"{conceptKey}_mark", markSvg);

                var lockupSvg = _rendererRegistry.RenderLockupSvg(param, brandName);
                var lockupAssetUri = await SaveSvgAssetAsync(idea.Id, $"{conceptKey}_lockup", lockupSvg);

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

            var existingConcept = kit.Logo?.Concepts?.FirstOrDefault(c => c.Key == targetConceptKey);
            var existingRegenCount = existingConcept?.RegenerateCount ?? 0;

            var seedIndex = (existingRegenCount + 1) % BrandLogoFamilyNames.All.Count;
            var targetFamily = BrandLogoFamilyNames.All[seedIndex];

            var synthParams = GenerateDeterministicSingleParameterSet(brandName, strategy, direction, targetFamily, existingRegenCount + 1, avoidList);
            var descriptor = $"Regenerated {targetFamily} direction tailored to {selectedCand?.Name ?? "brand identity"}";
            synthParams.Descriptor = descriptor;

            var markSvg = _rendererRegistry.RenderMarkSvg(synthParams, brandName);
            var markAssetUri = await SaveSvgAssetAsync(idea.Id, $"{targetConceptKey}_mark_r{existingRegenCount + 1}", markSvg);

            var lockupSvg = _rendererRegistry.RenderLockupSvg(synthParams, brandName);
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
            CancellationToken cancellationToken)
        {
            var modelId = _modelRouter?.Resolve("LogoParameterSelection") ?? "anthropic/claude-3.5-sonnet";
            var prompt = BuildPrompt(brandName, strategy, direction, candidate, avoidList);

            var request = new AiCompletionRequest
            {
                Model = modelId,
                Messages = new[]
                {
                    new AiMessage("system", "You are a brand visual identity designer selecting logo parameters."),
                    new AiMessage("user", prompt)
                },
                ResponseFormat = "json_object",
                MaxTokens = 1200,
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
2. 'symbol_plus_name': BadgeShape in [circle, square, rounded_rect, shield, diamond, hexagon, cut_corner_rect], BadgeStyle in [solid_fill, outline_stroke, double_stroke, split_negative], InternalGlyph in [initial_letter, geometric_cut, diagonal_cross, concentric_ring, horizontal_bars]
3. 'monogram': MonogramType in [single_letter, two_letter_interlock, two_letter_adjacent, three_letter_pyramid], FrameStyle in [none, circle_ring, square_box, bracket_corners, solid_disc], StrokeStyle in [heavy_block, stencil_split, monoline, duoline], FontCategory in [geometric_sans, humanist_sans, high_contrast_serif, slab_serif, mono]
4. 'abstract': GeometryType in [intersecting_rings, nested_polygons, rotational_symmetry_3, rotational_symmetry_4, mobius_fold, isometric_cube, faceted_diamond], StrokeWeight in [thin_precision, medium, heavy_bold], FontCategory in [geometric_sans, humanist_sans, high_contrast_serif, slab_serif, mono]
5. 'icon': MetaphorPrimitive in [shield_security, leaf_growth, node_network, cube_infrastructure, prism_focus, arch_gateway, spark_intelligence, pillar_foundation, wave_flow], Construction in [monoline_stroke, silhouette_solid, split_halves, segmented_arcs], FontCategory in [geometric_sans, humanist_sans, high_contrast_serif, slab_serif, mono]
6. 'minimal': Primitive in [sliced_circle, quadrant_arc, offset_bars, chevron_fold, diagonal_slash, hairline_cross], Orientation in [0_deg, 45_deg, 90_deg, 180_deg, 270_deg], WeightBalance in [monolithic_solid, contrast_duo, negative_aperture], FontCategory in [geometric_sans, humanist_sans, high_contrast_serif, slab_serif, mono]";
        }

        private static bool ValidateSetDiversity(List<BrandLogoConceptParameters> set, List<string> avoidList)
        {
            if (set == null || set.Count < 6) return false;

            var distinctFamilies = set.Select(s => s.Family).Distinct().Count();
            if (distinctFamilies < 4) return false;

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
            List<string> avoidList)
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
                        ["FontCategory"] = wordmarkFont
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
                        ["LetterCase"] = "uppercase",
                        ["AccentElement"] = "terminal_dot",
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
                        ["FontCategory"] = symbolFont
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
                        ["FrameStyle"] = "square_box",
                        ["StrokeStyle"] = "heavy_block",
                        ["FontCategory"] = monogramFont
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
                        ["FontCategory"] = wordmarkFont
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
                        ["FontCategory"] = wordmarkFont
                    }
                }
            };
        }

        private static BrandLogoConceptParameters GenerateDeterministicSingleParameterSet(
            string brandName,
            BrandStrategy strategy,
            BrandDirection direction,
            string family,
            int seed,
            List<string> avoidList)
        {
            var sets = GenerateDeterministicParameterSets(brandName, strategy, direction, null, avoidList);
            var matching = sets.FirstOrDefault(s => s.Family == family);
            if (matching != null) return matching;

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
