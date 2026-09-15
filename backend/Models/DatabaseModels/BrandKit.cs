using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace WebApp.Models.DatabaseModels
{
    /// <summary>
    /// Root document for the Brand Visual Identity Studio (Phase 2).
    /// Stored in the top-level <c>BrandKits</c> collection.
    /// Exactly one BrandKit document exists per CreatorIdea (unique index on IdeaId).
    /// </summary>
    public class BrandKit
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        /// <summary>The owning CreatorIdea's ID. Unique key across BrandKits.</summary>
        public string IdeaId { get; set; } = string.Empty;

        /// <summary>ApplicationUser.Id (Guid string) denormalized for fast owner-scoping checks.</summary>
        public string UserId { get; set; } = string.Empty;

        /// <summary>"draft" | "complete" — plain string matching Phase 2 status conventions.</summary>
        public string Status { get; set; } = "draft";

        /// <summary>Active Studio step (1 to 6) to resume partially finished sessions.</summary>
        public int CurrentStep { get; set; } = 1;

        /// <summary>Monotonic optimistic-concurrency token incremented on every write.</summary>
        public long Version { get; set; } = 1;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public BrandStrategy Strategy { get; set; } = new();
        public BrandDirection Direction { get; set; } = new();
        public BrandLogo Logo { get; set; } = new();
        public BrandColors Colors { get; set; } = new();
        public BrandTypography Typography { get; set; } = new();

        /// <summary>
        /// Bounded list of up to three snapshots (newest first).
        /// Enforced at write time via atomic push with position 0 and slice 3.
        /// </summary>
        public List<BrandKitSnapshot> Snapshots { get; set; } = new();
    }

    // ---------------- 1. Strategy ----------------

    public class BrandStrategy
    {
        public string BusinessName { get; set; } = string.Empty;
        public string NameDisplayForm { get; set; } = string.Empty;

        public BrandProvenancedText Concept { get; set; } = new();
        public BrandProvenancedText TargetAudience { get; set; } = new();
        public BrandProvenancedText Industry { get; set; } = new();
        public BrandProvenancedText Positioning { get; set; } = new();

        public List<string> PersonalityTraits { get; set; } = new();
        public List<string> AvoidList { get; set; } = new();
        public string TonePosition { get; set; } = string.Empty;
        public string FirstAppearance { get; set; } = string.Empty;
        public string? SymbolFeeling { get; set; }

        public BrandDerivedConstraints DerivedConstraints { get; set; } = new();
        public DateTime? ConfirmedAt { get; set; }
    }

    public class BrandProvenancedText
    {
        public string Value { get; set; } = string.Empty;
        /// <summary>"stated" | "derived"</summary>
        public string Provenance { get; set; } = string.Empty;
        public DateTime? EditedAt { get; set; }
    }

    public class BrandDerivedConstraints
    {
        public int CharacterLength { get; set; }
        public int WordCount { get; set; }
        public string Script { get; set; } = string.Empty;
        public string MonogramInitials { get; set; } = string.Empty;
        public bool IsIconOnlyViable { get; set; }
    }

    // ---------------- 2. Direction ----------------

    public class BrandDirection
    {
        /// <summary>List of exactly four candidates generated for creator selection.</summary>
        public List<BrandDirectionCandidate> Candidates { get; set; } = new();

        /// <summary>Key of the chosen candidate.</summary>
        public string? SelectedDirectionKey { get; set; }

        public BrandDirectionAdjustments AdjustmentSettings { get; set; } = new();
        public int RegenerateCount { get; set; }
        public DateTime? SelectedAt { get; set; }
    }

    public class BrandDirectionCandidate
    {
        public string Key { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string FeelLine { get; set; } = string.Empty;
        public string Rationale { get; set; } = string.Empty;
        /// <summary>List of four hex colour values.</summary>
        public List<string> ColorPalette { get; set; } = new();
        public string DisplayTypeface { get; set; } = string.Empty;
        public string TextTypeface { get; set; } = string.Empty;
        public string MotifKey { get; set; } = string.Empty;
    }

    public class BrandDirectionAdjustments
    {
        public string PaletteVariant { get; set; } = string.Empty;
        public string ContrastPosition { get; set; } = string.Empty;
        public string TypeWeight { get; set; } = string.Empty;
    }

    // ---------------- 3. Logo ----------------

    public class BrandLogo
    {
        public string LogoType { get; set; } = string.Empty;

        /// <summary>List of exactly six logo concepts.</summary>
        public List<BrandLogoConcept> Concepts { get; set; } = new();

        public string? SelectedConceptKey { get; set; }

        /// <summary>
        /// Variations keyed by: primary, horizontal, stacked, icon_only, black, white, transparent.
        /// </summary>
        public Dictionary<string, BrandLogoVariation> Variations { get; set; } = new();

        public BrandLogoRefinementSettings RefinementSettings { get; set; } = new();
        public int RegenerateCount { get; set; }
        public DateTime? ApprovedAt { get; set; }
    }

    public class BrandLogoConcept
    {
        public string Key { get; set; } = string.Empty;
        public string DescriptorLine { get; set; } = string.Empty;
        /// <summary>URI reference on disk (never inlined SVG/base64).</summary>
        public string AssetUri { get; set; } = string.Empty;
        public int RegenerateCount { get; set; }
        /// <summary>Stored parameter set for deterministic redrawing and variation derivation.</summary>
        public BrandLogoConceptParameters? Parameters { get; set; }
    }

    public class BrandLogoConceptParameters
    {
        public string Family { get; set; } = string.Empty;
        public string? Descriptor { get; set; }
        public Dictionary<string, string> Values { get; set; } = new();
    }

    public class BrandLogoVariation
    {
        /// <summary>URI reference on disk (never inlined SVG markup).</summary>
        public string SvgUri { get; set; } = string.Empty;
        /// <summary>Optional URI reference on disk for raster rendering.</summary>
        public string? PngUri { get; set; }
        public string UsageNote { get; set; } = string.Empty;
    }

    public class BrandLogoRefinementSettings
    {
        /// <summary>Five-step scale position (null until creator changes it).</summary>
        public string? SymbolSize { get; set; }

        /// <summary>"tight" | "normal" | "airy" (null until creator changes it).</summary>
        public string? Spacing { get; set; }

        /// <summary>"side_by_side" | "stacked" (null until creator changes it).</summary>
        public string? Arrangement { get; set; }
    }

    public static class BrandLogoVariationKeys
    {
        public const string Primary = "primary";
        public const string Horizontal = "horizontal";
        public const string Stacked = "stacked";
        public const string IconOnly = "icon_only";
        public const string Black = "black";
        public const string White = "white";
        public const string Transparent = "transparent";

        public static readonly IReadOnlyList<string> All = new[]
        {
            Primary, Horizontal, Stacked, IconOnly, Black, White, Transparent
        };
    }

    // ---------------- 4. Colors ----------------

    public class BrandColors
    {
        /// <summary>
        /// List of exactly five roles: Primary, Secondary, Accent, Background, Text.
        /// Background legitimately has null ContrastRatio and null ContrastVerdict.
        /// </summary>
        public List<BrandColorRole> Roles { get; set; } = new();

        public int RegenerateCount { get; set; }
        public DateTime? ConfirmedAt { get; set; }
    }

    public class BrandColorRole
    {
        public string RoleName { get; set; } = string.Empty;
        public string Hex { get; set; } = string.Empty;
        public string Rgb { get; set; } = string.Empty;
        public string UsageNote { get; set; } = string.Empty;

        /// <summary>Optional contrast ratio against ground. Null for Background role.</summary>
        public double? ContrastRatio { get; set; }

        /// <summary>Optional contrast rating/verdict. Null for Background role.</summary>
        public string? ContrastVerdict { get; set; }

        public bool IsLocked { get; set; }
        public string Provenance { get; set; } = string.Empty;
        public DateTime? EditedAt { get; set; }
    }

    public static class BrandColorRoleNames
    {
        public const string Primary = "Primary";
        public const string Secondary = "Secondary";
        public const string Accent = "Accent";
        public const string Background = "Background";
        public const string Text = "Text";

        public static readonly IReadOnlyList<string> All = new[]
        {
            Primary, Secondary, Accent, Background, Text
        };
    }

    // ---------------- 5. Typography ----------------

    public class BrandTypography
    {
        /// <summary>
        /// List of exactly four roles: Logo type, Heading, Body, Button &amp; label.
        /// Logo type is permanently locked (IsLocked = true).
        /// </summary>
        public List<BrandTypographyRole> Roles { get; set; } = new();

        public BrandTypographyFamilies Families { get; set; } = new();
        public int RegenerateCount { get; set; }
        public DateTime? ConfirmedAt { get; set; }
    }

    public class BrandTypographyRole
    {
        public string RoleName { get; set; } = string.Empty;
        public string Family { get; set; } = string.Empty;
        public string Weight { get; set; } = string.Empty;
        public string Size { get; set; } = string.Empty;
        public string LineHeight { get; set; } = string.Empty;
        public string SpecimenText { get; set; } = string.Empty;

        /// <summary>
        /// Whether this role is locked against automated regenerate.
        /// INVARIANT: For RoleName == "Logo type", IsLocked must always be true.
        /// </summary>
        public bool IsLocked { get; set; }

        public string Provenance { get; set; } = string.Empty;
        public DateTime? EditedAt { get; set; }
    }

    public static class BrandTypographyRoleNames
    {
        public const string LogoType = "Logo type";
        public const string Heading = "Heading";
        public const string Body = "Body";
        public const string ButtonAndLabel = "Button & label";

        public static readonly IReadOnlyList<string> All = new[]
        {
            LogoType, Heading, Body, ButtonAndLabel
        };
    }

    public class BrandTypographyFamilies
    {
        public BrandFontFamily DisplayFamily { get; set; } = new();
        public BrandFontFamily TextFamily { get; set; } = new();
    }

    public class BrandFontFamily
    {
        public string Name { get; set; } = string.Empty;
        public string License { get; set; } = string.Empty;
        public List<string> AvailableWeights { get; set; } = new();
        public double WebWeightKb { get; set; }
    }

    // ---------------- 6. History ----------------

    /// <summary>
    /// RETENTION WARNING:
    /// Snapshots store asset URIs pointing at files on disk. Those files must outlive the current version —
    /// if a cleanup job ever deletes assets that are no longer referenced by the live kit, restoring a snapshot
    /// would produce broken images. Any future asset cleanup must treat snapshot-referenced URIs as live.
    /// </summary>
    public class BrandKitSnapshot
    {
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string Description { get; set; } = string.Empty;

        public BrandStrategy Strategy { get; set; } = new();
        public BrandDirection Direction { get; set; } = new();
        public BrandLogo Logo { get; set; } = new();
        public BrandColors Colors { get; set; } = new();
        public BrandTypography Typography { get; set; } = new();
    }
}
