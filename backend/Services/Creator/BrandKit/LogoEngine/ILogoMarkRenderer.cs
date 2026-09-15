using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Creator.BrandKit.LogoEngine
{
    public interface ILogoMarkRenderer
    {
        string FamilyName { get; }
        /// <summary>Renders standalone mark (1:1 square, ideal for 16px favicon, app icon, stamp).</summary>
        string RenderMarkSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null);
        /// <summary>Renders full balanced lockup (mark + measured vector typography converted to paths).</summary>
        string RenderLockupSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null);
        /// <summary>Convenience default rendering lockup.</summary>
        string RenderSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null);
    }
}
