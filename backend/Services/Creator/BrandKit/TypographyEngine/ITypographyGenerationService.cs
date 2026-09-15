using WebApp.Models.DatabaseModels;
using BrandKitModel = WebApp.Models.DatabaseModels.BrandKit;

namespace WebApp.Services.Creator.BrandKit.TypographyEngine
{
    public interface ITypographyGenerationService
    {
        /// <summary>
        /// Deterministic initial derivation from approved logo concept and selected direction.
        /// Strictly locks Logo type to the approved logo concept's typeface.
        /// Free, instant, zero LLM calls.
        /// </summary>
        BrandTypography DeriveInitialTypography(BrandKitModel kit, CreatorIdea idea);

        /// <summary>
        /// Generative typography pairing suggestion via TypographyGeneration model call.
        /// Preserves the locked Logo type role and suggests new Heading/Body/Button pairings
        /// from the bundled fonts that differ from the current pairing in at least one family.
        /// </summary>
        Task<BrandTypography> RegenerateTypographyAsync(BrandKitModel kit, CreatorIdea idea, CancellationToken cancellationToken = default);
    }
}
