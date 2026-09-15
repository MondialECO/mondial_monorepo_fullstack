using WebApp.Models.DatabaseModels;
using BrandKitModel = WebApp.Models.DatabaseModels.BrandKit;

namespace WebApp.Services.Creator.BrandKit.LogoEngine
{
    public interface ILogoGenerationService
    {
        Task<List<BrandLogoConcept>> GenerateConceptsAsync(CreatorIdea idea, BrandKitModel kit, CancellationToken cancellationToken = default);
        Task<BrandLogoConcept> RegenerateSingleConceptAsync(CreatorIdea idea, BrandKitModel kit, string targetConceptKey, CancellationToken cancellationToken = default);
    }
}
