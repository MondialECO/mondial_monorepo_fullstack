"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BrandKit, BrandStrategy } from "@/types/creator/brand-kit";
import { brandKitApi } from "@/lib/api-creator-brand-kit";
import { exportBrandKitZip } from "@/lib/brand-kit-export";
import { resolveMediaUrl } from "@/lib/brand-kit-media";
import { Button } from "@/components/ui/button";
import { StrategyResultCard } from "./cards/StrategyResultCard";
import { DirectionResultCard } from "./cards/DirectionResultCard";
import { ColorsResultCard } from "./cards/ColorsResultCard";
import { TypographyResultCard } from "./cards/TypographyResultCard";
import { LogoCreationModal } from "./LogoCreationModal";
import { VariationSetModal } from "./VariationSetModal";
import { StrategyReviewModal } from "./StrategyReviewModal";
import { DirectionBoardModal } from "./DirectionBoardModal";
import { LogoTypeChooserModal } from "./LogoTypeChooserModal";
import { ColorSystemModal } from "./ColorSystemModal";
import { TypographySystemModal } from "./TypographySystemModal";
import {
  Sparkles,
  AlertCircle,
  Loader2,
  Download,
  ExternalLink,
  Edit3,
  CheckCircle2,
  Layers,
  Palette,
  Type,
  Compass,
  Plus,
  FolderArchive,
} from "lucide-react";

export interface BrandStudioShellProps {
  ideaId?: string;
  initialKit?: BrandKit | null;
}

type StudioModalKey =
  | "strategy"
  | "direction"
  | "logo_type"
  | "logo_creation"
  | "variations"
  | "colors"
  | "typography";

/**
 * Evaluates whether meaningful persisted brand data exists in the BrandKit.
 * Distinguishes a truly empty brand from partially or fully completed brands.
 */
export function hasMeaningfulBrandData(kit: BrandKit | null | undefined): boolean {
  if (!kit) return false;

  // 1. Strategy: Confirmed or any concrete pillar value populated
  const hasStrategy = Boolean(
    kit.strategy?.confirmedAt ||
    kit.strategy?.concept?.value?.trim() ||
    kit.strategy?.targetAudience?.value?.trim() ||
    kit.strategy?.industry?.value?.trim() ||
    kit.strategy?.positioning?.value?.trim() ||
    (kit.strategy?.personalityTraits && kit.strategy.personalityTraits.length > 0)
  );

  // 2. Direction: Confirmed or selected direction key
  const hasDirection = Boolean(
    kit.direction?.selectedAt ||
    kit.direction?.selectedDirectionKey
  );

  // 3. Logo: Approved, concept selected, logoType chosen, or variations exist
  const hasLogo = Boolean(
    kit.logo?.approvedAt ||
    kit.logo?.selectedConceptKey ||
    kit.logo?.logoType ||
    (kit.logo?.variations && Object.keys(kit.logo.variations).length > 0)
  );

  // 4. Colors: Confirmed or color roles populated
  const hasColors = Boolean(
    kit.colors?.confirmedAt ||
    (kit.colors?.roles &&
      kit.colors.roles.length > 0 &&
      kit.colors.roles.some((r) => r.hex && r.hex.trim()))
  );

  // 5. Typography: Confirmed or typography roles populated
  const hasTypography = Boolean(
    kit.typography?.confirmedAt ||
    (kit.typography?.roles && kit.typography.roles.length > 0)
  );

  return hasStrategy || hasDirection || hasLogo || hasColors || hasTypography;
}

function formatLogoType(type?: string): string {
  if (!type) return "Not selected yet";
  const map: Record<string, string> = {
    symbol_plus_name: "Symbol + Name",
    combination_mark: "Combination Mark",
    minimal_pictorial: "Minimal Pictorial",
    geometric_abstract: "Geometric Abstract",
    wordmark: "Wordmark",
    monogram: "Monogram",
    emblem: "Emblem",
  };
  return map[type.toLowerCase().trim()] || type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface IncompleteSectionCardProps {
  stepNumber: number;
  title: string;
  description: string;
  actionLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  onAction: () => void;
}

function IncompleteSectionCard({
  stepNumber,
  title,
  description,
  actionLabel,
  icon: Icon,
  onAction,
}: IncompleteSectionCardProps) {
  return (
    <div className="w-full rounded-2xl border border-dashed border-border/80 bg-card/60 p-6 shadow-2xs text-card-foreground">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="size-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0 mt-0.5 sm:mt-0">
            <Icon className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-badge font-semibold text-muted-foreground uppercase tracking-wider">
                STEP {stepNumber}
              </span>
              <span className="text-badge text-muted-foreground">•</span>
              <span className="text-badge font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                Incomplete
              </span>
            </div>
            <h3 className="font-heading text-card-title font-bold text-foreground tracking-tight mt-0.5">
              {title}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={onAction}
          className="gap-1.5 text-xs font-semibold shrink-0 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="size-3.5" />
          <span>{actionLabel}</span>
        </Button>
      </div>
    </div>
  );
}

export function BrandStudioShell({
  ideaId,
  initialKit,
}: BrandStudioShellProps) {
  const router = useRouter();
  const [kit, setKit] = useState<BrandKit | null>(initialKit ?? null);
  const [activeModal, setActiveModal] = useState<StudioModalKey | null>(null);
  const [isSequentialFlow, setIsSequentialFlow] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const brandName =
    kit?.strategy?.nameDisplayForm ||
    kit?.strategy?.businessName ||
    "Brand";



  // 3. Initial Load: Fetch Brand Kit and branch based on meaningful saved data
  useEffect(() => {
    let isMounted = true;

    async function loadStudioSession() {
      setIsLoading(true);
      setError(null);

      try {
        let currentKit = initialKit;
        if (!currentKit) {
          try {
            currentKit = await brandKitApi.openStudio(ideaId);
          } catch {
            try {
              currentKit = await brandKitApi.getBrandKit(ideaId);
            } catch {
              currentKit = null as any;
            }
          }
          if (!currentKit) {
            try {
              currentKit = await brandKitApi.createBrandKit(ideaId);
            } catch {
              // fallback
            }
          }
        }

        if (!isMounted) return;
        setKit(currentKit ?? null);

        // Branching logic:
        const hasData = hasMeaningfulBrandData(currentKit);
        if (!hasData) {
          // Case A — No Brand Data Exists:
          // Auto-open StrategyReviewModal and activate sequential creation workflow
          setIsSequentialFlow(true);
          setActiveModal("strategy");
        } else {
          // Case B — Existing Brand Data Exists:
          // Open Brand Studio View Mode directly with zero auto-modals
          setIsSequentialFlow(false);
          setActiveModal(null);
        }
      } catch (err: any) {
        if (!isMounted) return;
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load brand visual identity studio session.";
        setError(msg);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadStudioSession();

    return () => {
      isMounted = false;
    };
  }, [ideaId, initialKit]);

  // 4. On-Demand Modal Openers
  const handleOpenModal = useCallback((modalKey: StudioModalKey) => {
    setIsSequentialFlow(false);
    setActiveModal(modalKey);
  }, []);

  // 5. Unified Modal Step Transition Handler
  const handleStepTransition = useCallback(
    (nextModalKey: StudioModalKey | null, updatedKit?: BrandKit) => {
      if (updatedKit) {
        setKit(updatedKit);
      }
      if (nextModalKey === null) {
        setIsSequentialFlow(false);
        setActiveModal(null);
        return;
      }
      setActiveModal(nextModalKey);
    },
    []
  );

  const handleStrategyConfirm = async (updatedStrategy: Partial<BrandStrategy>) => {
    if (!kit) return;
    try {
      setIsLoading(true);
      setError(null);

      const updatedKit = await brandKitApi.patchStrategy(
        {
          businessName: updatedStrategy.businessName,
          nameDisplayForm: updatedStrategy.nameDisplayForm,
          concept: updatedStrategy.concept?.value,
          targetAudience: updatedStrategy.targetAudience?.value,
          industry: updatedStrategy.industry?.value,
          positioning: updatedStrategy.positioning?.value,
          personalityTraits: updatedStrategy.personalityTraits,
          avoidList: updatedStrategy.avoidList,
          tonePosition: updatedStrategy.tonePosition,
          firstAppearance: updatedStrategy.firstAppearance,
          symbolFeeling: updatedStrategy.symbolFeeling,
          confirmedAt: updatedStrategy.confirmedAt || new Date().toISOString(),
        },
        ideaId,
        kit.version
      );

      handleStepTransition(isSequentialFlow ? "direction" : null, updatedKit);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to confirm brand strategy."
      );
    } finally {
      setIsLoading(false);
    }
  };



  const handleExportZip = async () => {
    if (!kit) return;
    setIsExporting(true);
    setError(null);
    try {
      await exportBrandKitZip(kit, brandName);
    } catch (err: any) {
      setError(err?.message || "Failed to export brand assets archive.");
    } finally {
      setIsExporting(false);
    }
  };



  // Section completion status
  const isStrategyComplete = Boolean(kit?.strategy?.confirmedAt);
  const isDirectionComplete = Boolean(
    kit?.direction?.selectedAt || kit?.direction?.selectedDirectionKey
  );
  const isLogoTypeComplete = Boolean(kit?.logo?.logoType);
  const isLogoApproved = Boolean(kit?.logo?.approvedAt);
  const isLogoConceptSelected = Boolean(kit?.logo?.selectedConceptKey);
  const isColorsComplete = Boolean(
    kit?.colors?.confirmedAt || (kit?.colors?.roles && kit.colors.roles.length === 5)
  );
  const isTypographyComplete = Boolean(
    kit?.typography?.confirmedAt || (kit?.typography?.roles && kit.typography.roles.length > 0)
  );

  const variationCount = kit?.logo?.variations ? Object.keys(kit.logo.variations).length : 0;
  const isVariationsComplete = variationCount >= 7 && isLogoApproved;

  // Logo asset resolution
  const approvedConcept =
    kit?.logo?.concepts?.find((c) => c.key === kit?.logo?.selectedConceptKey) ||
    kit?.logo?.concepts?.[0];

  const primaryVariation = kit?.logo?.variations?.primary;
  const rawLockupAsset =
    primaryVariation?.svgUri || approvedConcept?.lockupAssetUri || approvedConcept?.markAssetUri;
  const lockupAsset = resolveMediaUrl(rawLockupAsset, kit?.logo?.regenerateCount);

  // Canonical 6 Lockup Variation Definitions
  const logoVariations = kit?.logo?.variations ?? {};
  const canonicalVariations = useMemo(
    () => [
      {
        key: "primary",
        label: "HORIZONTAL",
        subtitle: "Default lockup",
        uri:
          logoVariations.horizontal?.svgUri ||
          logoVariations.primary?.svgUri ||
          approvedConcept?.lockupAssetUri ||
          approvedConcept?.markAssetUri,
        isDarkBg: false,
        isCheckerboard: false,
      },
      {
        key: "stacked",
        label: "STACKED",
        subtitle: "Square lockup",
        uri:
          logoVariations.stacked?.svgUri ||
          logoVariations.secondary?.svgUri ||
          approvedConcept?.lockupAssetUri ||
          approvedConcept?.markAssetUri,
        isDarkBg: false,
        isCheckerboard: false,
      },
      {
        key: "icon_only",
        label: "ICON-ONLY",
        subtitle: "Favicons & Avatars",
        uri:
          logoVariations.icon_only?.svgUri ||
          logoVariations.monogram?.svgUri ||
          approvedConcept?.markAssetUri,
        isDarkBg: false,
        isCheckerboard: false,
      },
      {
        key: "black",
        label: "BLACK",
        subtitle: "Single-ink dark",
        uri:
          logoVariations.black?.svgUri ||
          logoVariations.inverted_dark?.svgUri ||
          approvedConcept?.lockupAssetUri,
        isDarkBg: false,
        isCheckerboard: false,
      },
      {
        key: "white",
        label: "WHITE",
        subtitle: "Reverse on dark",
        uri:
          logoVariations.white?.svgUri ||
          logoVariations.inverted_light?.svgUri ||
          approvedConcept?.lockupAssetUri,
        isDarkBg: true,
        isCheckerboard: false,
      },
      {
        key: "transparent",
        label: "TRANSPARENT",
        subtitle: "Alpha channel",
        uri:
          logoVariations.transparent?.svgUri ||
          logoVariations.badge_stamp?.svgUri ||
          approvedConcept?.lockupAssetUri,
        isDarkBg: false,
        isCheckerboard: true,
      },
    ],
    [logoVariations, approvedConcept]
  );

  return (
    <div className="relative flex flex-col h-full min-h-0 w-full bg-[#EFEFF1] dark:bg-background overflow-hidden">

      {/* Global Error Banner */}
      {error && (
        <div className="mx-auto mt-4 w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl px-4">
          <div className="flex items-center gap-2 p-3 text-xs text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-xl">
            <AlertCircle className="size-4 shrink-0 text-destructive" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* 2. Full-Bleed Dot-Grid Canvas & Accumulated View Mode Sections */}
      <section
        aria-label="Brand Canvas"
        className="flex-1 w-full px-4 md:px-8 py-8 flex flex-col items-center justify-start gap-6 overflow-y-auto"
        style={{
          backgroundImage:
            "radial-gradient(#d1d5db 1.2px, transparent 1.2px)",
          backgroundSize: "24px 24px",
        }}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Loading Brand Studio...
            </p>
          </div>
        ) : (
          /* View Mode Overview */
          <div className="w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl flex flex-col items-center gap-6">
            {/* Header Banner */}
            <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
              <div>
                <h1 className="text-2xl font-bold font-heading text-foreground tracking-tight">
                  Brand Studio
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Your Visual Identity — Review and manage your complete brand identity.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExportZip}
                  disabled={isExporting || !kit}
                  className="gap-1.5 text-xs font-semibold cursor-pointer"
                >
                  {isExporting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Download className="size-3.5" />
                  )}
                  <span>Download Brand</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    router.push(
                      `/dashboard/creator/phase-2/brand-kit${
                        ideaId ? `?ideaId=${encodeURIComponent(ideaId)}` : ""
                      }`
                    )
                  }
                  className="gap-1.5 text-xs font-semibold cursor-pointer"
                >
                  <ExternalLink className="size-3.5" />
                  <span>View Full Brand Kit</span>
                </Button>
              </div>
            </div>

            {/* 1. Brand Strategy Section */}
            {isStrategyComplete && kit?.strategy ? (
              <StrategyResultCard
                strategy={kit.strategy}
                onEdit={() => handleOpenModal("strategy")}
              />
            ) : (
              <IncompleteSectionCard
                stepNumber={1}
                title="Brand Strategy"
                description="Define your core concept, target audience, industry, positioning, and personality traits."
                actionLabel="Create Strategy"
                icon={Sparkles}
                onAction={() => handleOpenModal("strategy")}
              />
            )}

            {/* 2. Visual Direction Section */}
            {isDirectionComplete && kit?.direction ? (
              <DirectionResultCard
                direction={kit.direction}
                onEdit={() => handleOpenModal("direction")}
              />
            ) : (
              <IncompleteSectionCard
                stepNumber={2}
                title="Visual Direction"
                description="Explore curated aesthetic directions, moodboards, and harmonized color & typography pairings."
                actionLabel="Create Visual Direction"
                icon={Palette}
                onAction={() => handleOpenModal("direction")}
              />
            )}

            {/* 3. Logo System Section */}
            <div className="w-full rounded-2xl border border-border/80 bg-card p-6 shadow-xs text-card-foreground">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-border/60 gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`size-7 rounded-full flex items-center justify-center ${
                      isLogoApproved
                        ? "bg-emerald-500/10 text-emerald-600"
                        : isLogoConceptSelected
                        ? "bg-blue-500/10 text-blue-600"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isLogoApproved ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      <Layers className="size-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-badge font-semibold text-primary uppercase tracking-wider">
                        SECTION 3
                      </span>
                      <span className="text-badge text-muted-foreground">•</span>
                      <span className="text-caption text-muted-foreground font-medium">
                        Logo System
                      </span>
                    </div>
                    <h3 className="font-heading text-card-title font-semibold tracking-tight">
                      Primary Brand Mark & Lockup
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenModal("logo_type")}
                    className="gap-1.5 text-xs font-semibold cursor-pointer"
                  >
                    <Edit3 className="size-3" />
                    <span>
                      {isLogoTypeComplete ? "Edit Logo Type" : "Choose Logo Type"}
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenModal("logo_creation")}
                    className="gap-1.5 text-xs font-semibold cursor-pointer"
                  >
                    <Edit3 className="size-3" />
                    <span>
                      {isLogoConceptSelected || isLogoApproved
                        ? "Edit Logo"
                        : "Create Logo"}
                    </span>
                  </Button>
                </div>
              </div>

              {/* Logo System Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Primary Logo Lockup Preview */}
                <div className="flex flex-col gap-2 rounded-xl bg-muted/20 border border-border/40 p-4">
                  <span className="text-badge font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    Primary Lockup
                  </span>
                  <div className="relative flex h-28 w-full items-center justify-center rounded-lg bg-card border border-border/60 p-3 shadow-2xs">
                    {lockupAsset ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        key={`${kit?.logo?.selectedConceptKey}-${kit?.logo?.regenerateCount ?? 0}-${lockupAsset}`}
                        src={lockupAsset}
                        alt={`${brandName} Approved Logo`}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-2">
                        <Layers className="size-6 text-muted-foreground/40 mb-1" />
                        <span className="text-xs text-muted-foreground">
                          No primary logo selected yet
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Logo Type Archetype */}
                <div className="flex flex-col justify-between rounded-xl bg-muted/20 border border-border/40 p-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                      <Compass className="size-3.5 text-primary" />
                      <span className="text-badge font-mono font-semibold uppercase tracking-wider">
                        Logo Type Archetype
                      </span>
                    </div>
                    <p className="text-body font-semibold text-foreground mt-1">
                      {formatLogoType(kit?.logo?.logoType)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {kit?.logo?.logoType
                        ? "Parametric vector geometry configured according to this structural archetype."
                        : "Archetype not selected yet. Choose a structural family for your brand mark."}
                    </p>
                  </div>
                  <div className="mt-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-badge font-semibold font-mono ${
                        isLogoApproved
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                          : isLogoConceptSelected
                          ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isLogoApproved
                        ? "APPROVED FOR PRODUCTION"
                        : isLogoConceptSelected
                        ? "CONCEPT SELECTED (DRAFT)"
                        : "NOT CREATED YET"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Logo Variations Section */}
            <div className="w-full rounded-2xl border border-border/80 bg-card p-6 shadow-xs text-card-foreground">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-border/60 gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`size-7 rounded-full flex items-center justify-center ${
                      isVariationsComplete
                        ? "bg-emerald-500/10 text-emerald-600"
                        : variationCount > 0
                        ? "bg-blue-500/10 text-blue-600"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isVariationsComplete ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      <Layers className="size-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-badge font-semibold text-primary uppercase tracking-wider">
                        SECTION 4
                      </span>
                      <span className="text-badge text-muted-foreground">•</span>
                      <span className="text-caption text-muted-foreground font-medium">
                        Logo Variations
                      </span>
                    </div>
                    <h3 className="font-heading text-card-title font-semibold tracking-tight">
                      Canonical Multi-Context Variations
                    </h3>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenModal("variations")}
                  className="gap-1.5 text-xs font-semibold self-start sm:self-auto cursor-pointer"
                >
                  <Edit3 className="size-3" />
                  <span>
                    {variationCount > 0 ? "Edit Variations" : "Generate Variations"}
                  </span>
                </Button>
              </div>

              {/* Variations Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {canonicalVariations.map((v) => {
                  const assetUrl = resolveMediaUrl(
                    v.uri,
                    kit?.logo?.regenerateCount
                  );
                  return (
                    <div
                      key={v.key}
                      className="flex flex-col rounded-xl bg-muted/20 border border-border/40 p-2.5 overflow-hidden"
                    >
                      <div
                        className={`relative flex h-20 w-full items-center justify-center rounded-lg border border-border/60 p-2 ${
                          v.isDarkBg
                            ? "bg-slate-900 border-slate-800"
                            : v.isCheckerboard
                            ? "bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%),linear-gradient(-45deg,#f1f5f9_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f5f9_75%),linear-gradient(-45deg,transparent_75%,#f1f5f9_75%)] bg-[size:12px_12px] bg-[position:0_0,0_6px,6px_-6px,-6px_0] bg-white"
                            : "bg-card"
                        }`}
                      >
                        {assetUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={assetUrl}
                            alt={v.label}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-[10px] text-muted-foreground">
                            Pending
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-center">
                        <span className="text-[11px] font-bold font-mono text-foreground block truncate">
                          {v.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground block truncate">
                          {v.subtitle}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. Color System Section */}
            {isColorsComplete && kit?.colors ? (
              <ColorsResultCard
                kit={kit}
                onEdit={() => handleOpenModal("colors")}
              />
            ) : (
              <IncompleteSectionCard
                stepNumber={5}
                title="Color System"
                description="5 harmonized brand roles (Primary, Secondary, Accent, Background, Text) with WCAG contrast verification."
                actionLabel="Create Color System"
                icon={Palette}
                onAction={() => handleOpenModal("colors")}
              />
            )}

            {/* 6. Typography Section */}
            {isTypographyComplete && kit?.typography ? (
              <TypographyResultCard
                kit={kit}
                onEdit={() => handleOpenModal("typography")}
              />
            ) : (
              <IncompleteSectionCard
                stepNumber={6}
                title="Typography System"
                description="Display & Text typefaces, licensing verification, and typographic role specimens."
                actionLabel="Create Typography"
                icon={Type}
                onAction={() => handleOpenModal("typography")}
              />
            )}

            {/* 7. Final Brand Assets & Downloads */}
            <div className="w-full rounded-2xl border border-border/80 bg-card p-6 shadow-xs text-card-foreground">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-border/60 gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <FolderArchive className="size-4" />
                  </div>
                  <div>
                    <h3 className="font-heading text-card-title font-semibold tracking-tight">
                      Final Brand Assets & Production Deliverables
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Access high-resolution vector lockups, brand guide, color tokens, and export packages.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleExportZip}
                    disabled={isExporting || !kit}
                    className="gap-1.5 text-xs font-semibold cursor-pointer"
                  >
                    {isExporting ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Download className="size-3.5" />
                    )}
                    <span>Download Brand</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      router.push(
                        `/dashboard/creator/phase-2/brand-kit${
                          ideaId ? `?ideaId=${encodeURIComponent(ideaId)}` : ""
                        }`
                      )
                    }
                    className="gap-1.5 text-xs font-semibold cursor-pointer"
                  >
                    <ExternalLink className="size-3.5" />
                    <span>View Full Brand Kit</span>
                  </Button>
                </div>
              </div>

              {/* Deliverable Status Checklist */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="rounded-xl bg-muted/20 border border-border/40 p-3 flex flex-col justify-between">
                  <span className="text-badge font-mono text-muted-foreground uppercase">
                    Strategy
                  </span>
                  <span
                    className={`text-xs font-semibold mt-1 ${
                      isStrategyComplete ? "text-emerald-600" : "text-muted-foreground"
                    }`}
                  >
                    {isStrategyComplete ? "✓ 6 Pillars Set" : "Incomplete"}
                  </span>
                </div>
                <div className="rounded-xl bg-muted/20 border border-border/40 p-3 flex flex-col justify-between">
                  <span className="text-badge font-mono text-muted-foreground uppercase">
                    Direction
                  </span>
                  <span
                    className={`text-xs font-semibold mt-1 ${
                      isDirectionComplete ? "text-emerald-600" : "text-muted-foreground"
                    }`}
                  >
                    {isDirectionComplete ? "✓ Board Selected" : "Incomplete"}
                  </span>
                </div>
                <div className="rounded-xl bg-muted/20 border border-border/40 p-3 flex flex-col justify-between">
                  <span className="text-badge font-mono text-muted-foreground uppercase">
                    Primary Logo
                  </span>
                  <span
                    className={`text-xs font-semibold mt-1 ${
                      isLogoApproved
                        ? "text-emerald-600"
                        : isLogoConceptSelected
                        ? "text-blue-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {isLogoApproved
                      ? "✓ Approved"
                      : isLogoConceptSelected
                      ? "Draft"
                      : "Incomplete"}
                  </span>
                </div>
                <div className="rounded-xl bg-muted/20 border border-border/40 p-3 flex flex-col justify-between">
                  <span className="text-badge font-mono text-muted-foreground uppercase">
                    Variations
                  </span>
                  <span
                    className={`text-xs font-semibold mt-1 ${
                      isVariationsComplete
                        ? "text-emerald-600"
                        : variationCount > 0
                        ? "text-blue-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {variationCount >= 7
                      ? "✓ 7/7 Formats"
                      : `${variationCount}/7 Formats`}
                  </span>
                </div>
                <div className="rounded-xl bg-muted/20 border border-border/40 p-3 flex flex-col justify-between">
                  <span className="text-badge font-mono text-muted-foreground uppercase">
                    Color Tokens
                  </span>
                  <span
                    className={`text-xs font-semibold mt-1 ${
                      isColorsComplete ? "text-emerald-600" : "text-muted-foreground"
                    }`}
                  >
                    {isColorsComplete ? "✓ 5 Roles AAA/AA" : "Incomplete"}
                  </span>
                </div>
                <div className="rounded-xl bg-muted/20 border border-border/40 p-3 flex flex-col justify-between">
                  <span className="text-badge font-mono text-muted-foreground uppercase">
                    Typography
                  </span>
                  <span
                    className={`text-xs font-semibold mt-1 ${
                      isTypographyComplete
                        ? "text-emerald-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {isTypographyComplete ? "✓ Dual Typeface" : "Incomplete"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 3. Modal Overlays */}

      {/* Step 1: Strategy Review Modal */}
      {activeModal === "strategy" && kit && (
        <StrategyReviewModal
          kit={kit}
          onClose={() => handleStepTransition(null)}
          onConfirm={handleStrategyConfirm}
          isSubmitting={isLoading}
        />
      )}

      {/* Step 2: Visual Direction Board Modal */}
      {activeModal === "direction" && kit && (
        <DirectionBoardModal
          isOpen={true}
          ideaId={ideaId}
          kit={kit}
          onClose={() => handleStepTransition(null)}
          onSuccess={(updatedKit) =>
            handleStepTransition(isSequentialFlow ? "logo_type" : null, updatedKit)
          }
        />
      )}

      {/* Step 3: Logo Type Chooser Modal */}
      {activeModal === "logo_type" && kit && (
        <LogoTypeChooserModal
          isOpen={true}
          ideaId={ideaId}
          kit={kit}
          onClose={() => handleStepTransition(null)}
          onSuccess={(updatedKit) =>
            handleStepTransition(isSequentialFlow ? "logo_creation" : null, updatedKit)
          }
        />
      )}

      {/* Step 4a: Logo Creation Modal */}
      {activeModal === "logo_creation" && (
        <LogoCreationModal
          ideaId={ideaId}
          initialKit={kit}
          onConfirm={(updatedKit) =>
            handleStepTransition(isSequentialFlow ? "variations" : null, updatedKit)
          }
          onBack={() => handleStepTransition(null)}
          onClose={() => handleStepTransition(null)}
        />
      )}

      {/* Step 4b: Variation Set Modal */}
      {activeModal === "variations" && (
        <VariationSetModal
          ideaId={ideaId}
          initialKit={kit}
          onConfirm={(updatedKit) =>
            handleStepTransition(isSequentialFlow ? "colors" : null, updatedKit)
          }
          onBack={() =>
            handleStepTransition(isSequentialFlow ? "logo_creation" : null)
          }
          onClose={() => handleStepTransition(null)}
        />
      )}

      {/* Step 5: Color System Modal */}
      {activeModal === "colors" && kit && (
        <ColorSystemModal
          isOpen={true}
          ideaId={ideaId}
          kit={kit}
          onClose={() => handleStepTransition(null)}
          onSuccess={(updatedKit) =>
            handleStepTransition(isSequentialFlow ? "typography" : null, updatedKit)
          }
        />
      )}

      {/* Step 6: Typography System Modal */}
      {activeModal === "typography" && kit && (
        <TypographySystemModal
          isOpen={true}
          ideaId={ideaId}
          kit={kit}
          onClose={() => handleStepTransition(null)}
          onSuccess={(updatedKit) => handleStepTransition(null, updatedKit)}
        />
      )}
    </div>
  );
}
