using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using WebApp.Models.DatabaseModels;
using WebApp.Services.Ai;
using WebApp.Services.Ai.Providers;
using BrandKitModel = WebApp.Models.DatabaseModels.BrandKit;

namespace WebApp.Services.Creator.BrandKit.TypographyEngine
{
    public class TypographyGenerationService : ITypographyGenerationService
    {
        private readonly IAiProvider? _aiProvider;
        private readonly IModelRouter? _modelRouter;
        private readonly ILogger<TypographyGenerationService> _logger;

        public TypographyGenerationService(
            IAiProvider? aiProvider = null,
            IModelRouter? modelRouter = null,
            ILogger<TypographyGenerationService>? logger = null)
        {
            _aiProvider = aiProvider;
            _modelRouter = modelRouter;
            _logger = logger ?? NullLogger<TypographyGenerationService>.Instance;
        }

        public BrandTypography DeriveInitialTypography(BrandKitModel kit, CreatorIdea idea)
        {
            var logoFamily = ResolveApprovedLogoFamily(kit);
            var selectedCand = kit.Direction?.Candidates?.FirstOrDefault(c => c.Key == kit.Direction?.SelectedDirectionKey)
                               ?? kit.Direction?.Candidates?.FirstOrDefault();

            string headingFamily = !string.IsNullOrWhiteSpace(selectedCand?.DisplayTypeface) && FontMetadataRegistry.IsBundledFont(selectedCand.DisplayTypeface)
                ? selectedCand.DisplayTypeface
                : (logoFamily != "Syne" ? "Syne" : "Space Grotesk");

            string bodyFamily = !string.IsNullOrWhiteSpace(selectedCand?.TextTypeface) && FontMetadataRegistry.IsBundledFont(selectedCand.TextTypeface)
                ? selectedCand.TextTypeface
                : (headingFamily != "Plus Jakarta Sans" ? "Plus Jakarta Sans" : "Space Grotesk");

            return BuildBrandTypography(
                kit,
                idea,
                logoFamily: logoFamily,
                headingFamily: headingFamily,
                bodyFamily: bodyFamily,
                buttonFamily: bodyFamily,
                regenerateCount: 0,
                provenance: "derived");
        }

        public async Task<BrandTypography> RegenerateTypographyAsync(
            BrandKitModel kit,
            CreatorIdea idea,
            CancellationToken cancellationToken = default)
        {
            var brandName = !string.IsNullOrWhiteSpace(kit?.Strategy?.NameDisplayForm)
                ? kit.Strategy.NameDisplayForm
                : (!string.IsNullOrWhiteSpace(kit?.Strategy?.BusinessName)
                    ? kit.Strategy.BusinessName
                    : (idea?.Project?.Name ?? "Brand"));

            var logoFamily = ResolveApprovedLogoFamily(kit);
            var currentHeading = kit?.Typography?.Roles?.FirstOrDefault(r => r.RoleName == BrandTypographyRoleNames.Heading)?.Family
                                 ?? kit?.Typography?.Families?.DisplayFamily?.Name ?? "Syne";
            var currentBody = kit?.Typography?.Roles?.FirstOrDefault(r => r.RoleName == BrandTypographyRoleNames.Body)?.Family
                              ?? kit?.Typography?.Families?.TextFamily?.Name ?? "Plus Jakarta Sans";

            string headingFamily = string.Empty;
            string bodyFamily = string.Empty;
            string provenance = "ai";

            if (_aiProvider != null && _modelRouter != null)
            {
                try
                {
                    var (aiHeading, aiBody) = await QueryAiForTypographyPairingAsync(brandName, kit?.Strategy, kit?.Direction, currentHeading, currentBody, cancellationToken);
                    if (FontMetadataRegistry.IsBundledFont(aiHeading) && FontMetadataRegistry.IsBundledFont(aiBody))
                    {
                        // Ensure it differs from current in at least one family
                        if (!string.Equals(aiHeading, currentHeading, StringComparison.OrdinalIgnoreCase) ||
                            !string.Equals(aiBody, currentBody, StringComparison.OrdinalIgnoreCase))
                        {
                            headingFamily = aiHeading;
                            bodyFamily = aiBody;
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "AI Typography regeneration failed for {BrandName}. Falling back to alternative bundled pairing.", brandName);
                }
            }

            if (string.IsNullOrEmpty(headingFamily) || string.IsNullOrEmpty(bodyFamily))
            {
                provenance = "fallback";
                var (fbHeading, fbBody) = SelectAlternativePairing(currentHeading, currentBody);
                headingFamily = fbHeading;
                bodyFamily = fbBody;
            }

            int nextRegenCount = (kit?.Typography?.RegenerateCount ?? 0) + 1;
            return BuildBrandTypography(
                kit,
                idea,
                logoFamily: logoFamily,
                headingFamily: headingFamily,
                bodyFamily: bodyFamily,
                buttonFamily: bodyFamily,
                regenerateCount: nextRegenCount,
                provenance: provenance);
        }

        private static string ResolveApprovedLogoFamily(BrandKitModel kit)
        {
            if (kit?.Logo?.Concepts != null && kit.Logo.Concepts.Count > 0)
            {
                var targetConcept = !string.IsNullOrEmpty(kit.Logo.SelectedConceptKey)
                    ? kit.Logo.Concepts.FirstOrDefault(c => c.Key == kit.Logo.SelectedConceptKey)
                    : kit.Logo.Concepts.FirstOrDefault();

                if (targetConcept?.Parameters != null && !string.IsNullOrWhiteSpace(targetConcept.Parameters.Family))
                {
                    var fam = targetConcept.Parameters.Family.Trim();
                    if (FontMetadataRegistry.IsBundledFont(fam))
                        return fam;
                }
            }

            // If existing typography already has a stated logo type family
            var existingLogoRole = kit?.Typography?.Roles?.FirstOrDefault(r => r.RoleName == BrandTypographyRoleNames.LogoType);
            if (!string.IsNullOrWhiteSpace(existingLogoRole?.Family) && FontMetadataRegistry.IsBundledFont(existingLogoRole.Family))
            {
                return existingLogoRole.Family;
            }

            return "Plus Jakarta Sans";
        }

        private async Task<(string Heading, string Body)> QueryAiForTypographyPairingAsync(
            string brandName,
            BrandStrategy? strategy,
            BrandDirection? direction,
            string currentHeading,
            string currentBody,
            CancellationToken cancellationToken)
        {
            if (_modelRouter == null)
                throw new InvalidOperationException("IModelRouter is required for typography generation model resolution.");

            var modelId = _modelRouter.Resolve("TypographyGeneration");
            var prompt = BuildPrompt(brandName, strategy, direction, currentHeading, currentBody);

            var request = new AiCompletionRequest
            {
                Model = modelId,
                Messages = new[]
                {
                    new AiMessage("system", "You are an expert typographic identity designer. You select complementary font pairings exclusively from an allowed list of bundled fonts in strict JSON format."),
                    new AiMessage("user", prompt)
                },
                ResponseFormat = "json_object",
                MaxTokens = 600,
                Temperature = 0.7
            };

            var response = await _aiProvider!.CompleteAsync(request, cancellationToken);
            if (string.IsNullOrWhiteSpace(response?.Text)) return (string.Empty, string.Empty);

            // Log token accounting
            _logger.LogInformation(
                "Brand typography regenerated for {BrandName} via model {Model}. OperationType={OperationType}, PromptTokens={PromptTokens}, CompletionTokens={CompletionTokens}, TotalTokens={TotalTokens}, EstimatedCost={EstimatedCost}",
                brandName,
                response.Model,
                "BrandTypographyRegeneration",
                response.Usage.PromptTokens,
                response.Usage.CompletionTokens,
                response.Usage.TotalTokens,
                response.EstimatedCost);

            using var doc = JsonDocument.Parse(response.Text);
            var root = doc.RootElement;
            string? h = root.TryGetProperty("heading_font", out var hEl) ? hEl.GetString() : null;
            string? b = root.TryGetProperty("body_font", out var bEl) ? bEl.GetString() : null;

            return (h?.Trim() ?? string.Empty, b?.Trim() ?? string.Empty);
        }

        private static string BuildPrompt(
            string brandName,
            BrandStrategy? strategy,
            BrandDirection? direction,
            string currentHeading,
            string currentBody)
        {
            var allowedFonts = string.Join(", ", FontMetadataRegistry.BundledFontNames);
            var selectedCand = direction?.Candidates?.FirstOrDefault(c => c.Key == direction.SelectedDirectionKey);

            return $@"Suggest a fresh, distinctive typography pairing for '{brandName}'.

Brand Context:
- Industry: {strategy?.Industry?.Value ?? "Technology"}
- Positioning: {strategy?.Positioning?.Value ?? "Premium innovation"}
- Tone: {(!string.IsNullOrWhiteSpace(strategy?.TonePosition) ? strategy.TonePosition : "Modern, authoritative")}
- Visual Direction: {selectedCand?.Name ?? "Modern Contemporary"} ({selectedCand?.FeelLine ?? ""})

Current Typography Pairing (You MUST pick a pairing differing from this in at least one family):
- Current Heading: {currentHeading}
- Current Body: {currentBody}

Allowed Fonts List (YOU MUST ONLY CHOOSE FROM THESE 5 EXACT NAMES):
[{allowedFonts}]

Requirements:
1. 'heading_font': Must be one of [{allowedFonts}].
2. 'body_font': Must be one of [{allowedFonts}].
3. The pair must differ from the current pairing.

Output MUST be strict JSON:
{{
  ""heading_font"": ""ExactFontName"",
  ""body_font"": ""ExactFontName"",
  ""rationale"": ""Brief reason for this typographic pairing""
}}";
        }

        private static (string Heading, string Body) SelectAlternativePairing(string currentHeading, string currentBody)
        {
            var candidates = new (string Heading, string Body)[]
            {
                ("Syne", "Plus Jakarta Sans"),
                ("Space Grotesk", "Plus Jakarta Sans"),
                ("Cinzel", "Plus Jakarta Sans"),
                ("Plus Jakarta Sans", "Space Grotesk"),
                ("Space Grotesk", "JetBrains Mono"),
                ("Syne", "Space Grotesk")
            };

            foreach (var pair in candidates)
            {
                if (!string.Equals(pair.Heading, currentHeading, StringComparison.OrdinalIgnoreCase) ||
                    !string.Equals(pair.Body, currentBody, StringComparison.OrdinalIgnoreCase))
                {
                    return pair;
                }
            }

            return ("Space Grotesk", "Plus Jakarta Sans");
        }

        private static BrandTypography BuildBrandTypography(
            BrandKitModel kit,
            CreatorIdea idea,
            string logoFamily,
            string headingFamily,
            string bodyFamily,
            string buttonFamily,
            int regenerateCount,
            string provenance)
        {
            var strategy = kit?.Strategy ?? new BrandStrategy();
            var brandName = !string.IsNullOrWhiteSpace(strategy.NameDisplayForm)
                ? strategy.NameDisplayForm
                : (!string.IsNullOrWhiteSpace(strategy.BusinessName)
                    ? strategy.BusinessName
                    : (idea?.Project?.Name ?? "Brand"));

            // Specimen text drawn strictly from confirmed strategy fields
            string logoSpecimen = brandName;
            
            string headingSpecimen = !string.IsNullOrWhiteSpace(strategy.Positioning?.Value)
                ? strategy.Positioning.Value
                : (!string.IsNullOrWhiteSpace(strategy.Concept?.Value) ? strategy.Concept.Value : $"{brandName} — Architecture for Tomorrow");

            string bodySpecimen = !string.IsNullOrWhiteSpace(strategy.TargetAudience?.Value)
                ? $"Crafted specifically for {strategy.TargetAudience.Value.ToLowerInvariant()}. {strategy.Concept?.Value ?? ""}"
                : (!string.IsNullOrWhiteSpace(strategy.Concept?.Value)
                    ? strategy.Concept.Value
                    : $"{brandName} empowers modern organizations with next-generation workflows, intuitive interfaces, and unmatched reliability.");

            string buttonSpecimen = $"Explore {brandName}";

            var roles = new List<BrandTypographyRole>
            {
                new()
                {
                    RoleName = BrandTypographyRoleNames.LogoType,
                    Family = logoFamily,
                    Weight = "700",
                    Size = "24px",
                    LineHeight = "1.1",
                    SpecimenText = logoSpecimen,
                    IsLocked = true, // INVARIANT: Logo type is always locked
                    Provenance = "stated"
                },
                new()
                {
                    RoleName = BrandTypographyRoleNames.Heading,
                    Family = headingFamily,
                    Weight = "700",
                    Size = "32px",
                    LineHeight = "1.2",
                    SpecimenText = headingSpecimen,
                    IsLocked = false,
                    Provenance = provenance
                },
                new()
                {
                    RoleName = BrandTypographyRoleNames.Body,
                    Family = bodyFamily,
                    Weight = "400",
                    Size = "16px",
                    LineHeight = "1.5",
                    SpecimenText = bodySpecimen,
                    IsLocked = false,
                    Provenance = provenance
                },
                new()
                {
                    RoleName = BrandTypographyRoleNames.ButtonAndLabel,
                    Family = buttonFamily,
                    Weight = "600",
                    Size = "14px",
                    LineHeight = "1.0",
                    SpecimenText = buttonSpecimen,
                    IsLocked = false,
                    Provenance = provenance
                }
            };

            var displayMeta = FontMetadataRegistry.GetFontFamily(headingFamily);
            var textMeta = FontMetadataRegistry.GetFontFamily(bodyFamily);

            return new BrandTypography
            {
                Roles = roles,
                Families = new BrandTypographyFamilies
                {
                    DisplayFamily = displayMeta,
                    TextFamily = textMeta
                },
                RegenerateCount = regenerateCount,
                ConfirmedAt = null
            };
        }
    }
}
