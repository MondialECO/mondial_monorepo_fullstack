export interface BrandKit {
  id?: string;
  ideaId: string;
  userId: string;
  status: "draft" | "complete" | string;
  currentStep: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  strategy?: BrandStrategy;
  direction?: BrandDirection;
  logo?: BrandLogo;
  colors?: BrandColors;
  typography?: BrandTypography;
  snapshots?: BrandKitSnapshot[];
}

export interface BrandStrategy {
  businessName: string;
  nameDisplayForm?: string;
  concept?: BrandProvenancedText;
  targetAudience?: BrandProvenancedText;
  industry?: BrandProvenancedText;
  positioning?: BrandProvenancedText;
  personalityTraits?: string[];
  avoidList?: string[];
  tonePosition?: string;
  firstAppearance?: string;
  symbolFeeling?: string | null;
  derivedConstraints?: BrandDerivedConstraints;
  confirmedAt?: string | null;
}

export interface BrandProvenancedText {
  value: string;
  provenance: "stated" | "derived" | string;
  editedAt?: string | null;
}

export interface BrandDerivedConstraints {
  characterLength: number;
  wordCount: number;
  script: string;
  monogramInitials: string;
  isIconOnlyViable: boolean;
}

export interface BrandDirection {
  candidates: BrandDirectionCandidate[];
  selectedDirectionKey?: string | null;
  adjustmentSettings?: BrandDirectionAdjustments;
  regenerateCount: number;
  selectedAt?: string | null;
}

export interface BrandDirectionCandidate {
  key: string;
  name: string;
  feelLine: string;
  rationale: string;
  colorPalette: string[];
  displayTypeface: string;
  textTypeface: string;
  motifKey: string;
  provenance: "ai" | "fallback" | string;
  avoidListSubstituted: boolean;
}

export interface BrandDirectionAdjustments {
  paletteVariant?: string;
  contrastPosition?: string;
  typeWeight?: string;
}

export interface BrandLogo {
  logoType?: string;
  concepts: BrandLogoConcept[];
  selectedConceptKey?: string | null;
  variations?: Record<string, BrandLogoVariation>;
  refinementSettings?: BrandLogoRefinementSettings;
  regenerateCount: number;
  approvedAt?: string | null;
}

export interface BrandLogoConcept {
  key: string;
  descriptorLine: string;
  markAssetUri: string;
  lockupAssetUri: string;
  regenerateCount: number;
  parameters?: BrandLogoConceptParameters;
}

export interface BrandLogoConceptParameters {
  family: string;
  descriptor?: string | null;
  values?: Record<string, string>;
}

export interface BrandLogoVariation {
  svgUri: string;
  pngUri?: string | null;
  usageNote: string;
}

export interface BrandLogoRefinementSettings {
  symbolSize?: string | null;
  spacing?: string | null;
  arrangement?: string | null;
}

export interface BrandColors {
  roles: BrandColorRole[];
  regenerateCount: number;
  confirmedAt?: string | null;
}

export interface BrandColorRole {
  roleName: "Primary" | "Secondary" | "Accent" | "Background" | "Text" | string;
  hex: string;
  rgb: string;
  usageNote: string;
  contrastRatio?: number | null;
  contrastVerdict?: string | null;
  isLocked: boolean;
  provenance: string;
  editedAt?: string | null;
}

export interface BrandTypography {
  roles: BrandTypographyRole[];
  families?: BrandTypographyFamilies;
  regenerateCount: number;
  confirmedAt?: string | null;
}

export interface BrandTypographyRole {
  roleName: "Logo type" | "Heading" | "Body" | "Button & label" | string;
  family: string;
  weight: string;
  size: string;
  lineHeight: string;
  specimenText: string;
  isLocked: boolean;
  provenance: string;
  editedAt?: string | null;
}

export interface BrandTypographyFamilies {
  displayFamily: BrandFontFamily;
  textFamily: BrandFontFamily;
}

export interface BrandFontFamily {
  name: string;
  license: string;
  availableWeights: string[];
  webWeightKb: number;
}

export interface BrandKitSnapshot {
  timestamp: string;
  description: string;
  strategy?: BrandStrategy;
  direction?: BrandDirection;
  logo?: BrandLogo;
  colors?: BrandColors;
  typography?: BrandTypography;
}

export function formatLogoFamily(family?: string): string {
  if (!family) return "Mark";
  const map: Record<string, string> = {
    symbol_plus_name: "Symbol + Name",
    combination_mark: "Combination Mark",
    minimal_pictorial: "Minimal Pictorial",
    geometric_abstract: "Geometric Abstract",
    wordmark: "Wordmark",
    monogram: "Monogram",
    emblem: "Emblem",
    minimal: "Minimal",
  };
  const normalized = family.toLowerCase().trim();
  if (map[normalized]) return map[normalized];
  return family
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatConceptTitle(concept: BrandLogoConcept, index: number): string {
  if (concept.parameters?.descriptor) {
    const cleanDescriptor = concept.parameters.descriptor
      .replace(/symbol_plus_name/gi, "Symbol + Name")
      .replace(/combination_mark/gi, "Combination Mark")
      .replace(/minimal_pictorial/gi, "Minimal Pictorial")
      .replace(/geometric_abstract/gi, "Geometric Abstract")
      .replace(/_/g, " ");
    return `Concept ${index + 1}: ${cleanDescriptor}`;
  }
  const familyDisplay = formatLogoFamily(concept.parameters?.family);
  return `Concept ${index + 1} (${familyDisplay})`;
}

