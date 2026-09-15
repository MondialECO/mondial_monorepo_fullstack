using WebApp.Models.DatabaseModels;

namespace WebApp.Services.Creator.BrandKit.TypographyEngine
{
    /// <summary>
    /// Registry of the verified bundled, open-licence fonts with physical file sizes and license info.
    /// Verified against Resources/Fonts/ at HEAD.
    /// </summary>
    public static class FontMetadataRegistry
    {
        public static readonly IReadOnlyList<string> BundledFontNames = new[]
        {
            "Cinzel",
            "Space Grotesk",
            "Plus Jakarta Sans",
            "Syne",
            "JetBrains Mono"
        };

        private static readonly Dictionary<string, BrandFontFamily> Families = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Cinzel"] = new BrandFontFamily
            {
                Name = "Cinzel",
                License = "SIL Open Font License 1.1",
                AvailableWeights = new List<string> { "400", "700" },
                WebWeightKb = 122.5
            },
            ["Space Grotesk"] = new BrandFontFamily
            {
                Name = "Space Grotesk",
                License = "SIL Open Font License 1.1",
                AvailableWeights = new List<string> { "400", "500", "700" },
                WebWeightKb = 133.5
            },
            ["Plus Jakarta Sans"] = new BrandFontFamily
            {
                Name = "Plus Jakarta Sans",
                License = "SIL Open Font License 1.1",
                AvailableWeights = new List<string> { "400", "500", "600", "700", "800" },
                WebWeightKb = 172.1
            },
            ["Syne"] = new BrandFontFamily
            {
                Name = "Syne",
                License = "SIL Open Font License 1.1",
                AvailableWeights = new List<string> { "400", "600", "700", "800" },
                WebWeightKb = 143.5
            },
            ["JetBrains Mono"] = new BrandFontFamily
            {
                Name = "JetBrains Mono",
                License = "Apache License 2.0 / OFL",
                AvailableWeights = new List<string> { "400", "500", "700" },
                WebWeightKb = 182.8
            }
        };

        public static BrandFontFamily GetFontFamily(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                return Families["Plus Jakarta Sans"];

            if (Families.TryGetValue(name.Trim(), out var family))
            {
                return new BrandFontFamily
                {
                    Name = family.Name,
                    License = family.License,
                    AvailableWeights = new List<string>(family.AvailableWeights),
                    WebWeightKb = family.WebWeightKb
                };
            }

            // Default safe fallback if unrecognised
            return new BrandFontFamily
            {
                Name = name.Trim(),
                License = "SIL Open Font License 1.1",
                AvailableWeights = new List<string> { "400", "700" },
                WebWeightKb = 150.0
            };
        }

        public static bool IsBundledFont(string name)
        {
            return !string.IsNullOrWhiteSpace(name) && Families.ContainsKey(name.Trim());
        }
    }
}
