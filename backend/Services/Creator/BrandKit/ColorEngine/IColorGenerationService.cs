using WebApp.Models.DatabaseModels;
using BrandKitModel = WebApp.Models.DatabaseModels.BrandKit;

namespace WebApp.Services.Creator.BrandKit.ColorEngine
{
    public interface IColorGenerationService
    {
        /// <summary>
        /// Deterministic initial derivation from approved logo and selected visual direction.
        /// Free, instant, zero LLM calls.
        /// </summary>
        BrandColors DeriveInitialColors(BrandKitModel kit, CreatorIdea idea);

        /// <summary>
        /// Generative palette regeneration via ColorGeneration model call.
        /// Produces a genuinely new 5-role color harmony grounded in strategy and logo.
        /// Contrast checks and adjustments remain 100% deterministic.
        /// </summary>
        Task<BrandColors> RegenerateColorsAsync(BrandKitModel kit, CreatorIdea idea, CancellationToken cancellationToken = default);
    }
}
