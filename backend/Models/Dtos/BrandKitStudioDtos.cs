using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using WebApp.Models.DatabaseModels;

namespace WebApp.Models.Dtos
{
    public class BrandStrategyPatchDto
    {
        public string? BusinessName { get; set; }
        public string? NameDisplayForm { get; set; }
        public string? Concept { get; set; }
        public string? TargetAudience { get; set; }
        public string? Industry { get; set; }
        public string? Positioning { get; set; }
        public List<string>? PersonalityTraits { get; set; }
        public List<string>? AvoidList { get; set; }
        public string? TonePosition { get; set; }
        public string? FirstAppearance { get; set; }
        public string? SymbolFeeling { get; set; }
        public DateTime? ConfirmedAt { get; set; }
    }

    public class BrandDirectionPatchDto
    {
        public List<BrandDirectionCandidateDto>? Candidates { get; set; }
        public string? SelectedDirectionKey { get; set; }
        public BrandDirectionAdjustmentsDto? AdjustmentSettings { get; set; }
        public DateTime? SelectedAt { get; set; }
    }

    public class BrandDirectionCandidateDto
    {
        public string Key { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string FeelLine { get; set; } = string.Empty;
        public string Rationale { get; set; } = string.Empty;
        public List<string>? ColorPalette { get; set; }
        public string DisplayTypeface { get; set; } = string.Empty;
        public string TextTypeface { get; set; } = string.Empty;
        public string MotifKey { get; set; } = string.Empty;
        public string? Provenance { get; set; }
        public bool? AvoidListSubstituted { get; set; }
    }

    public class BrandDirectionAdjustmentsDto
    {
        public string? PaletteVariant { get; set; }
        public string? ContrastPosition { get; set; }
        public string? TypeWeight { get; set; }
    }

    public class BrandLogoPatchDto
    {
        public string? LogoType { get; set; }
        public List<BrandLogoConceptDto>? Concepts { get; set; }
        public string? SelectedConceptKey { get; set; }
        public BrandLogoRefinementSettingsDto? RefinementSettings { get; set; }
        public Dictionary<string, BrandLogoVariationDto>? Variations { get; set; }
        public DateTime? ApprovedAt { get; set; }
    }

    public class BrandLogoConceptDto
    {
        public string Key { get; set; } = string.Empty;
        public string DescriptorLine { get; set; } = string.Empty;
        public string MarkAssetUri { get; set; } = string.Empty;
        public string LockupAssetUri { get; set; } = string.Empty;
        public BrandLogoConceptParameters? Parameters { get; set; }
    }

    public class BrandLogoRefinementSettingsDto
    {
        public string? SymbolSize { get; set; }
        public string? Spacing { get; set; }
        public string? Arrangement { get; set; }
    }

    public class BrandLogoVariationDto
    {
        public string SvgUri { get; set; } = string.Empty;
        public string? PngUri { get; set; }
        public string UsageNote { get; set; } = string.Empty;
    }

    public class BrandColorsPatchDto
    {
        public List<BrandColorRolePatchDto>? Roles { get; set; }
        public DateTime? ConfirmedAt { get; set; }
    }

    public class BrandColorRolePatchDto
    {
        [Required]
        public string RoleName { get; set; } = string.Empty;
        public string? Hex { get; set; }
        public string? Rgb { get; set; }
        public double? ContrastRatio { get; set; }
        public string? ContrastVerdict { get; set; }
        public string? UsageNote { get; set; }
        public bool? IsLocked { get; set; }
        public string? Provenance { get; set; }
    }

    public class BrandTypographyPatchDto
    {
        public List<BrandTypographyRolePatchDto>? Roles { get; set; }
        public BrandTypographyFamiliesDto? Families { get; set; }
        public DateTime? ConfirmedAt { get; set; }
    }

    public class BrandTypographyRolePatchDto
    {
        [Required]
        public string RoleName { get; set; } = string.Empty;
        public string? Family { get; set; }
        public string? Weight { get; set; }
        public string? Size { get; set; }
        public string? LineHeight { get; set; }
        public string? SpecimenText { get; set; }
        public bool? IsLocked { get; set; }
        public string? Provenance { get; set; }
    }

    public class BrandTypographyFamiliesDto
    {
        public BrandFontFamilyDto? DisplayFamily { get; set; }
        public BrandFontFamilyDto? TextFamily { get; set; }
    }

    public class BrandFontFamilyDto
    {
        public string Name { get; set; } = string.Empty;
        public string License { get; set; } = string.Empty;
        public List<string> AvailableWeights { get; set; } = new();
        public double WebWeightKb { get; set; }
    }

    public class AdvanceStepRequestDto
    {
        public int? TargetStep { get; set; }
    }

    public class CreateSnapshotRequestDto
    {
        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        public long ExpectedVersion { get; set; }
    }

    public class RestoreSnapshotRequestDto
    {
        [Required]
        public int SnapshotIndex { get; set; }

        public long? ExpectedVersion { get; set; }
    }
}
