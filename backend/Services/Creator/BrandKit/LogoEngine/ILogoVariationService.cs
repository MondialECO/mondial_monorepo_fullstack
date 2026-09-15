using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Creator.BrandKit.LogoEngine
{
    public interface ILogoVariationService
    {
        Task<Dictionary<string, BrandLogoVariation>> DeriveVariationsAsync(
            string ideaId,
            string brandName,
            BrandLogoConcept approvedConcept,
            WebApp.Models.DatabaseModels.BrandKit kit,
            CancellationToken cancellationToken = default);
    }
}
