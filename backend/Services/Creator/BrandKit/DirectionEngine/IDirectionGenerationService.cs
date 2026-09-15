using WebApp.Models.DatabaseModels;
using BrandKitModel = WebApp.Models.DatabaseModels.BrandKit;

namespace WebApp.Services.Creator.BrandKit.DirectionEngine
{
    public interface IDirectionGenerationService
    {
        Task<List<BrandDirectionCandidate>> GenerateCandidatesAsync(
            CreatorIdea idea,
            BrandKitModel kit,
            CancellationToken cancellationToken = default);
    }
}
