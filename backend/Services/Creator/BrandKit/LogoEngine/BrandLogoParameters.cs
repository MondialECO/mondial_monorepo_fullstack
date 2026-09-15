namespace WebApp.Services.Creator.BrandKit.LogoEngine
{
    public static class BrandLogoFamilyNames
    {
        public const string Wordmark = "wordmark";
        public const string SymbolPlusName = "symbol_plus_name";
        public const string Monogram = "monogram";
        public const string Abstract = "abstract";
        public const string Icon = "icon";
        public const string Minimal = "minimal";

        public static readonly IReadOnlyList<string> All = new[]
        {
            Wordmark, SymbolPlusName, Monogram, Abstract, Icon, Minimal
        };
    }

    public static class BrandLogoParameterSchema
    {
        public static readonly IReadOnlyDictionary<string, IReadOnlyDictionary<string, IReadOnlyList<string>>> Schemas =
            new Dictionary<string, IReadOnlyDictionary<string, IReadOnlyList<string>>>
            {
                [BrandLogoFamilyNames.Wordmark] = new Dictionary<string, IReadOnlyList<string>>
                {
                    ["Layout"] = new[] { "single_line", "stacked_two_line", "tracked_wide", "tight_bold" },
                    ["LetterCase"] = new[] { "uppercase", "lowercase", "titlecase" },
                    ["AccentElement"] = new[] { "none", "terminal_dot", "baseline_underline", "overscore", "split_dot" },
                    ["FontCategory"] = new[] { "geometric_sans", "humanist_sans", "high_contrast_serif", "slab_serif", "mono" },
                    ["LetterSpacing"] = new[] { "tight", "normal", "wide", "ultra_wide" }
                },
                [BrandLogoFamilyNames.SymbolPlusName] = new Dictionary<string, IReadOnlyList<string>>
                {
                    ["BadgeShape"] = new[] { "circle", "square", "rounded_rect", "shield", "diamond", "hexagon", "cut_corner_rect" },
                    ["BadgeStyle"] = new[] { "solid_fill", "outline_stroke", "double_stroke", "split_negative" },
                    ["InternalGlyph"] = new[] { "initial_letter", "geometric_cut", "diagonal_cross", "concentric_ring", "horizontal_bars" },
                    ["Arrangement"] = new[] { "side_by_side_left", "side_by_side_right", "stacked_top", "stacked_bottom" },
                    ["SymbolToTextRatio"] = new[] { "compact", "balanced", "dominant" }
                },
                [BrandLogoFamilyNames.Monogram] = new Dictionary<string, IReadOnlyList<string>>
                {
                    ["MonogramType"] = new[] { "single_letter", "two_letter_interlock", "two_letter_adjacent", "three_letter_pyramid" },
                    ["FrameStyle"] = new[] { "none", "circle_ring", "square_box", "bracket_corners", "solid_disc" },
                    ["StrokeStyle"] = new[] { "heavy_block", "stencil_split", "monoline", "duoline" },
                    ["InitialsSource"] = new[] { "first_letter", "two_initials", "three_initials" },
                    ["OverlapTreatment"] = new[] { "cutout_gap", "continuous_merge", "stamped" }
                },
                [BrandLogoFamilyNames.Abstract] = new Dictionary<string, IReadOnlyList<string>>
                {
                    ["GeometryType"] = new[] { "intersecting_rings", "nested_polygons", "rotational_symmetry_3", "rotational_symmetry_4", "mobius_fold", "isometric_cube", "wave_frequencies" },
                    ["Symmetry"] = new[] { "radial_3", "radial_4", "bilateral_vertical", "bilateral_horizontal", "asymmetric_dynamic" },
                    ["StrokeWeight"] = new[] { "thin_precision", "medium", "heavy_bold" },
                    ["Density"] = new[] { "minimal_3_elements", "balanced_5_elements", "structured_7_elements" },
                    ["NegativeSpace"] = new[] { "none", "central_cutout", "offset_aperture" }
                },
                [BrandLogoFamilyNames.Icon] = new Dictionary<string, IReadOnlyList<string>>
                {
                    ["MetaphorPrimitive"] = new[] { "shield_security", "leaf_growth", "node_network", "cube_infrastructure", "prism_focus", "arch_gateway", "globe_connected", "spark_intelligence", "pillar_foundation", "wave_flow" },
                    ["Construction"] = new[] { "monoline_stroke", "silhouette_solid", "split_halves", "segmented_arcs" },
                    ["CornerStyle"] = new[] { "sharp", "subtle_round", "full_round" },
                    ["CutoutDetail"] = new[] { "none", "inner_dot", "inner_slash", "negative_core" }
                },
                [BrandLogoFamilyNames.Minimal] = new Dictionary<string, IReadOnlyList<string>>
                {
                    ["Primitive"] = new[] { "sliced_circle", "quadrant_arc", "offset_bars", "chevron_fold", "diagonal_slash", "concentric_arc" },
                    ["Orientation"] = new[] { "0_deg", "45_deg", "90_deg", "180_deg", "270_deg" },
                    ["WeightBalance"] = new[] { "monolithic_solid", "contrast_duo", "negative_aperture" },
                    ["Aspect"] = new[] { "square", "tall", "wide" }
                }
            };
    }
}
