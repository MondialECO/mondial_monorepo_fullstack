using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Creator.BrandKit.LogoEngine
{
    public interface ILogoMarkRenderer
    {
        string FamilyName { get; }
        string RenderSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null);
    }
}
