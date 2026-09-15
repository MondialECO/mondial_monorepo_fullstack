using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Creator.BrandKit.LogoEngine
{
    public interface ILogoMarkRendererRegistry
    {
        ILogoMarkRenderer GetRenderer(string familyName);
        string RenderSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null);
        bool ValidateParameters(BrandLogoConceptParameters parameters, out string? errorMessage);
    }

    public class LogoMarkRendererRegistry : ILogoMarkRendererRegistry
    {
        private readonly Dictionary<string, ILogoMarkRenderer> _renderers;

        public LogoMarkRendererRegistry()
        {
            _renderers = new Dictionary<string, ILogoMarkRenderer>(StringComparer.OrdinalIgnoreCase)
            {
                [BrandLogoFamilyNames.Wordmark] = new WordmarkLogoRenderer(),
                [BrandLogoFamilyNames.SymbolPlusName] = new SymbolPlusNameLogoRenderer(),
                [BrandLogoFamilyNames.Monogram] = new MonogramLogoRenderer(),
                [BrandLogoFamilyNames.Abstract] = new AbstractLogoRenderer(),
                [BrandLogoFamilyNames.Icon] = new IconLogoRenderer(),
                [BrandLogoFamilyNames.Minimal] = new MinimalLogoRenderer()
            };
        }

        public ILogoMarkRenderer GetRenderer(string familyName)
        {
            if (_renderers.TryGetValue(familyName, out var renderer))
                return renderer;

            // Default fallback is Minimal
            return _renderers[BrandLogoFamilyNames.Minimal];
        }

        public string RenderSvg(BrandLogoConceptParameters parameters, string brandName, string? colorHex = null)
        {
            var family = parameters?.Family ?? BrandLogoFamilyNames.Minimal;
            var renderer = GetRenderer(family);
            return renderer.RenderSvg(parameters ?? new BrandLogoConceptParameters { Family = family }, brandName, colorHex);
        }

        public bool ValidateParameters(BrandLogoConceptParameters parameters, out string? errorMessage)
        {
            if (parameters == null)
            {
                errorMessage = "Parameters object is null.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(parameters.Family) || !_renderers.ContainsKey(parameters.Family))
            {
                errorMessage = $"Invalid logo family: '{parameters.Family}'. Allowed families: {string.Join(", ", BrandLogoFamilyNames.All)}.";
                return false;
            }

            if (BrandLogoParameterSchema.Schemas.TryGetValue(parameters.Family, out var schema))
            {
                foreach (var (paramKey, paramValue) in parameters.Values)
                {
                    if (schema.TryGetValue(paramKey, out var allowedValues))
                    {
                        if (!allowedValues.Contains(paramValue, StringComparer.OrdinalIgnoreCase))
                        {
                            errorMessage = $"Invalid value '{paramValue}' for parameter '{paramKey}' in family '{parameters.Family}'. Allowed: {string.Join(", ", allowedValues)}.";
                            return false;
                        }
                    }
                }
            }

            errorMessage = null;
            return true;
        }
    }
}
