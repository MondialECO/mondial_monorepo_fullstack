"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BrandKit, BrandLogoVariation } from "@/types/creator/brand-kit";
import { resolveMediaUrl } from "@/lib/brand-kit-media";
import { apiCreatorBrandKit } from "@/lib/api-creator-brand-kit";
import { API_ORIGIN } from "@/lib/api-config";
import { CascadeWarningModal, CascadeTargetSection } from "./CascadeWarningModal";
import { RestoreSnapshotModal } from "./RestoreSnapshotModal";
import { StrategyReviewModal } from "./StrategyReviewModal";
import { DirectionBoardModal } from "./DirectionBoardModal";
import { LogoTypeChooserModal } from "./LogoTypeChooserModal";
import { LogoCreationModal } from "./LogoCreationModal";
import { VariationSetModal } from "./VariationSetModal";
import { ColorSystemModal } from "./ColorSystemModal";
import { TypographySystemModal } from "./TypographySystemModal";
import { Button } from "@/components/ui/button";
import { exportBrandKitZip } from "@/lib/brand-kit-export";
import {
  Download,
  ExternalLink,
  Check,
  Lock,
  Type,
  Palette,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Clock,
  History,
  Layers,
  ArrowRight,
  Sparkles,
  Info,
  ChevronRight,
  FileBox,
  Share2,
  Copy,
  Layout,
  Presentation,
  Receipt,
  FileCode,
  FolderArchive,
  ArrowUpRight,
  Pencil,
} from "lucide-react";
import Link from "next/link";

export interface BrandKitHubViewProps {
  ideaId?: string;
  initialKit: BrandKit;
}

export function BrandKitHubView({ ideaId, initialKit }: BrandKitHubViewProps) {
  const router = useRouter();
  const [kit, setKit] = useState<BrandKit>(initialKit);
  const [isZipping, setIsZipping] = useState(false);
  const [selectedVariationKey, setSelectedVariationKey] = useState<string>("primary");
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  // Modals state
  const [activeModal, setActiveModal] = useState<
    | "strategy"
    | "direction"
    | "logo_type"
    | "logo_creation"
    | "variations"
    | "colors"
    | "typography"
    | null
  >(null);

  // Cascade warning modal state
  const [cascadeTarget, setCascadeTarget] = useState<CascadeTargetSection | null>(null);

  // Restore snapshot state
  const [selectedSnapshotIndex, setSelectedSnapshotIndex] = useState<number | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const brandName =
    kit.strategy?.nameDisplayForm ||
    kit.strategy?.businessName ||
    "Brand";

  const brandTagline =
    kit.strategy?.positioning?.value ||
    kit.strategy?.concept?.value ||
    "The modern platform for fast-growing teams.";

  const approvedConcept =
    kit.logo?.concepts?.find((c) => c.key === kit.logo?.selectedConceptKey) ||
    kit.logo?.concepts?.[0];

  const logoVariations = kit.logo?.variations ?? {};

  // Canonical 6 Lockup Variation Definitions (Figma Node 57004:12057)
  const canonicalVariations = [
    {
      key: "primary",
      label: "HORIZONTAL",
      subtitle: "Default lockup",
      uri: logoVariations.horizontal?.svgUri || logoVariations.primary?.svgUri || approvedConcept?.lockupAssetUri || approvedConcept?.markAssetUri,
      isDarkBg: false,
      isCheckerboard: false,
    },
    {
      key: "stacked",
      label: "STACKED",
      subtitle: "Square lockup",
      uri: logoVariations.stacked?.svgUri || logoVariations.secondary?.svgUri || approvedConcept?.lockupAssetUri || approvedConcept?.markAssetUri,
      isDarkBg: false,
      isCheckerboard: false,
    },
    {
      key: "icon_only",
      label: "ICON-ONLY",
      subtitle: "Favicons & Avatars",
      uri: logoVariations.icon_only?.svgUri || logoVariations.monogram?.svgUri || approvedConcept?.markAssetUri,
      isDarkBg: false,
      isCheckerboard: false,
    },
    {
      key: "black",
      label: "BLACK",
      subtitle: "Single-ink dark",
      uri: logoVariations.black?.svgUri || logoVariations.inverted_dark?.svgUri || approvedConcept?.lockupAssetUri,
      isDarkBg: false,
      isCheckerboard: false,
    },
    {
      key: "white",
      label: "WHITE",
      subtitle: "Reverse on dark",
      uri: logoVariations.white?.svgUri || logoVariations.inverted_light?.svgUri || approvedConcept?.lockupAssetUri,
      isDarkBg: true,
      isCheckerboard: false,
    },
    {
      key: "transparent",
      label: "TRANSPARENT",
      subtitle: "Alpha channel",
      uri: logoVariations.transparent?.svgUri || logoVariations.badge_stamp?.svgUri || approvedConcept?.lockupAssetUri,
      isDarkBg: false,
      isCheckerboard: true,
    },
  ];

  const activeLockup = useMemo(() => {
    const found = canonicalVariations.find((v) => v.key === selectedVariationKey);
    return found || canonicalVariations[0];
  }, [selectedVariationKey, canonicalVariations]);

  const colors = kit.colors?.roles ?? [];
  const typographyRoles = kit.typography?.roles ?? [];

  // Dynamic Asset Count Calculation (Figma 14 Files = 7 SVG Variations + 7 PNG Renders)
  const totalAssetFiles = useMemo(() => {
    const vars = kit.logo?.variations ?? {};
    const count = Object.keys(vars).length;
    return count > 0 ? count * 2 : 14;
  }, [kit.logo?.variations]);

  // Dynamic Connected Services / Documents Status
  const integrations = useMemo(() => {
    const isKitReady =
      kit.status === "complete" ||
      (kit.logo?.variations && Object.keys(kit.logo.variations).length > 0);

    return [
      {
        key: "business_plan",
        title: "Business plan",
        icon: FileText,
        isApplied: isKitReady,
      },
      {
        key: "landing_page",
        title: "Landing page",
        icon: Layout,
        isApplied: isKitReady,
      },
      {
        key: "pitch_deck",
        title: "Pitch deck",
        icon: Presentation,
        isApplied: false,
      },
      {
        key: "invoices",
        title: "Invoices",
        icon: Receipt,
        isApplied: false,
      },
    ];
  }, [kit.status, kit.logo?.variations]);

  const connectedCount = integrations.filter((i) => i.isApplied).length;

  // Copy hex helper
  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  // 1. Download Brand Kit Bundle (Client-side ZIP with tokens and logos)
  const handleDownloadBrandKit = async () => {
    if (isZipping) return;
    setIsZipping(true);
    setExportError(null);
    try {
      await exportBrandKitZip(kit, brandName);
    } catch (err: any) {
      console.error("ZIP packaging error:", err);
      setExportError(err?.message || "Failed to package Brand Kit ZIP.");
    } finally {
      setIsZipping(false);
    }
  };

  // Upstream Edit Interceptors & Navigation
  const handleOpenStudio = () => {
    setActiveModal("strategy");
  };

  const handleNext = () => {
    const completeUrl = `/dashboard/creator/phase-2/complete${
      ideaId ? `?ideaId=${encodeURIComponent(ideaId)}` : ""
    }`;
    router.push(completeUrl);
  };

  const handleOpenDirection = () => {
    setCascadeTarget("direction");
  };

  const handleOpenLogo = () => {
    setCascadeTarget("logo_creation");
  };

  const handleProceedCascade = () => {
    const target = cascadeTarget;
    setCascadeTarget(null);
    if (target === "direction") {
      setActiveModal("direction");
    } else if (target === "logo_creation") {
      setActiveModal("logo_creation");
    }
  };

  return (
    <div className="flex-1 w-full bg-[#EFEFF1] dark:bg-[#0c0d0e] text-foreground min-h-screen pb-24">
      {/* Feedback Banner */}
      {feedbackMessage && (
        <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-semibold text-center sticky top-0 z-50 shadow-sm">
          {feedbackMessage}
        </div>
      )}

      {/* Export Error Banner */}
      {exportError && (
        <div className="bg-destructive text-destructive-foreground px-6 py-3 text-xs font-semibold flex items-center justify-between gap-3 sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{exportError}</span>
          </div>
          <button
            type="button"
            onClick={() => setExportError(null)}
            className="hover:underline text-badge uppercase tracking-wider font-mono shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Canonical 1080px Centered Container (Figma Node 57004:12057) */}
      <section aria-label="Brand Kit Hub" className="mx-auto max-w-[1080px] w-full px-4 sm:px-6 pt-10 space-y-10">
        
        {/* =========================================================================
            1. IDENTITY BLOCK (Figma Node 57004:12057)
           ========================================================================= */}
        <section className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6 text-card-foreground">
          {/* Top Row: Avatar + Title + Breadcrumbs + Status + Action Buttons */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              {/* Approved Mark Box: White container with subtle border (Figma matching) */}
              <div className="size-14 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center p-2.5 border border-border/80 shrink-0 shadow-xs">
                {logoVariations.icon_only?.svgUri || logoVariations.primary?.svgUri || approvedConcept?.markAssetUri ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    key={`hub-thumb-${kit.version ?? 0}`}
                    src={resolveMediaUrl(
                      logoVariations.icon_only?.svgUri || logoVariations.primary?.svgUri || approvedConcept?.markAssetUri,
                      kit.version
                    )}
                    alt={`${brandName} Mark`}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-foreground font-bold text-xl">{brandName.charAt(0)}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-bold font-heading text-foreground tracking-tight">
                    {brandName}
                  </h1>
                  <span className="text-sm font-normal text-muted-foreground">
                    {kit.strategy?.industry?.value || "FinTech SaaS"} · Brand Kit
                  </span>
                </div>

                {/* Status Pill Badge */}
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-500/20">
                    <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                    <span>All six steps complete</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Header Actions (Figma: Edit in Studio & Download Brand Kit) */}
            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenStudio}
                className="h-10 px-4 gap-2 text-xs font-semibold rounded-lg border-border/80 bg-background text-foreground shadow-xs hover:bg-muted"
              >
                <Pencil className="size-3.5 text-muted-foreground" />
                <span>Edit in Studio</span>
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={handleDownloadBrandKit}
                disabled={isZipping}
                className="h-10 px-5 gap-2 text-xs font-semibold rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm"
              >
                <Download className="size-3.5" />
                <span>{isZipping ? "Packaging ZIP..." : "Download Brand Kit"}</span>
              </Button>
            </div>
          </div>

          {/* Hairline Divider */}
          <div className="border-t border-border/60" />

          {/* Metadata Metric Row (4 columns split by vertical hairlines - Figma Node 57004:12057) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:divide-x md:divide-border/60 text-xs">
            <div className="space-y-1">
              <span className="text-badge font-mono uppercase tracking-wider text-muted-foreground block">
                CREATED
              </span>
              <p className="font-semibold font-mono text-foreground uppercase">
                {kit.createdAt ? new Date(kit.createdAt).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase() : "12 SEP 2026"}
              </p>
            </div>

            <div className="space-y-1 md:pl-6">
              <span className="text-badge font-mono uppercase tracking-wider text-muted-foreground block">
                UPDATED
              </span>
              <p className="font-semibold font-mono text-foreground uppercase">
                {kit.updatedAt ? new Date(kit.updatedAt).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase() : "15 SEP 2026"}
              </p>
            </div>

            <div className="space-y-1 md:pl-6">
              <span className="text-badge font-mono uppercase tracking-wider text-muted-foreground block">
                VERSION
              </span>
              <p className="font-semibold font-mono text-foreground uppercase">
                V{kit.version || 1}
              </p>
            </div>

            <div className="space-y-1 md:pl-6">
              <span className="text-badge font-mono uppercase tracking-wider text-muted-foreground block">
                ASSETS
              </span>
              <p className="font-semibold font-mono text-foreground uppercase">
                {totalAssetFiles} FILES
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            2. SECTION 1 — LOGO (Figma Node 57004:12057)
           ========================================================================= */}
        <section className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6 text-card-foreground">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-heading text-foreground">
              Logo
            </h2>

            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 rounded-full bg-muted text-badge font-mono font-semibold text-muted-foreground">
                7 VARIATIONS
              </span>
              <button
                type="button"
                onClick={handleOpenLogo}
                className="text-xs font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                <span>Open in Studio</span>
                <ChevronRight className="size-3" />
              </button>
            </div>
          </div>

          {/* Hero Lockup Band */}
          <div
            className={`h-[260px] rounded-xl border border-border/80 p-8 flex items-center justify-center relative shadow-inner overflow-hidden transition-all duration-200 ${
              activeLockup.isDarkBg
                ? "bg-[#0B1220] text-white"
                : activeLockup.isCheckerboard
                ? "bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#ffffff_0%_50%)] bg-[size:16px_16px]"
                : "bg-white dark:bg-zinc-900"
            }`}
          >
            {activeLockup.uri ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={resolveMediaUrl(activeLockup.uri, kit.version)}
                alt={`${brandName} Lockup (${activeLockup.label})`}
                className="max-h-[140px] max-w-[80%] object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Sparkles className="size-8" />
                <span className="text-xs font-mono">Select a lockup to preview</span>
              </div>
            )}

            {/* Active Lockup Tag Pill */}
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-background/90 backdrop-blur-xs border border-border/70 text-badge font-mono font-semibold shadow-xs">
              {activeLockup.label} · SVG
            </div>
          </div>

          {/* 6 Thumbnails Row (Figma matching) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {canonicalVariations.map((v) => {
              const isSelected = selectedVariationKey === v.key;
              return (
                <div key={v.key} className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedVariationKey(v.key)}
                    className={`w-full group flex flex-col rounded-xl border p-2 text-left transition-all duration-150 relative ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary"
                        : "border-border/80 bg-background hover:border-border hover:bg-muted/20"
                    }`}
                  >
                    <div
                      className={`h-20 w-full rounded-lg border border-border/40 flex items-center justify-center p-2 relative overflow-hidden transition-colors ${
                        v.isDarkBg
                          ? "bg-[#0B1220] text-white"
                          : v.isCheckerboard
                          ? "bg-[repeating-conic-gradient(#e2e8f0_0%_25%,#ffffff_0%_50%)] bg-[size:12px_12px]"
                          : "bg-white dark:bg-zinc-900"
                      }`}
                    >
                      {v.uri ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={resolveMediaUrl(v.uri, kit.version)}
                          alt={v.label}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-xs font-bold">{brandName.charAt(0)}</span>
                      )}

                      {/* Download icon inside ICON-ONLY card */}
                      {v.key === "icon_only" && (
                        <div className="absolute bottom-1.5 right-1.5 p-1 rounded-md bg-muted/80 text-muted-foreground">
                          <Download className="size-2.5" />
                        </div>
                      )}
                    </div>
                  </button>

                  <span className="text-badge font-mono uppercase font-semibold text-muted-foreground tracking-wider">
                    {v.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            3. SECTION 2 — COLOUR (Figma Node 57004:12057)
           ========================================================================= */}
        <section className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6 text-card-foreground">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-heading text-foreground">
              Colour
            </h2>

            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 rounded-full bg-muted text-badge font-mono font-semibold text-muted-foreground">
                5 ROLES
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-badge font-mono font-medium flex items-center gap-1 border border-emerald-500/20">
                <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                <span>Contrast checked</span>
              </span>
              <button
                type="button"
                onClick={() => setActiveModal("colors")}
                className="text-xs font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                <span>Open in Studio</span>
                <ChevronRight className="size-3" />
              </button>
            </div>
          </div>

          {/* 5 Swatch Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
            {colors.map((color) => {
              const hex = color.hex || "#000000";
              const isCopied = copiedHex === hex;

              return (
                <div
                  key={color.roleName}
                  className="rounded-xl border border-border/80 bg-background overflow-hidden flex flex-col justify-between shadow-xs transition-shadow hover:shadow-sm"
                >
                  {/* 110px Tall Color Fill with Copy Pill */}
                  <div
                    className="h-28 w-full relative group flex items-center justify-center p-2.5 transition-transform"
                    style={{ backgroundColor: hex }}
                  >
                    <button
                      type="button"
                      onClick={() => handleCopyHex(hex)}
                      className="px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-xs text-white text-badge font-mono font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 shadow-sm cursor-pointer"
                      title="Copy HEX code"
                    >
                      {isCopied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                      <span>{isCopied ? "COPIED" : hex.toUpperCase()}</span>
                    </button>
                  </div>

                  {/* Swatch Details */}
                  <div className="p-3.5 space-y-2 text-xs flex-1 flex flex-col justify-between">
                    <div>
                      <span className="font-semibold text-foreground text-sm block">
                        {color.roleName}
                      </span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-mono font-semibold text-foreground text-xs">
                          {hex.toUpperCase()}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyHex(hex)}
                          className="text-muted-foreground hover:text-foreground transition-colors p-1"
                          title="Copy Hex"
                        >
                          {isCopied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                        </button>
                      </div>
                      <span className="text-badge font-mono text-muted-foreground block mt-0.5">
                        {color.rgb ? `RGB ${color.rgb.replace(/rgb\(|\)/g, "")}` : "RGB 0, 0, 0"}
                      </span>
                    </div>

                    <p className="text-caption text-muted-foreground leading-relaxed pt-2 border-t border-border/50">
                      {color.usageNote || "Design system token"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            4. SECTION 3 — TYPOGRAPHY (Figma Node 57004:12057)
           ========================================================================= */}
        <section className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6 text-card-foreground">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-heading text-foreground">
              Typography
            </h2>

            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 rounded-full bg-muted text-badge font-mono font-semibold text-muted-foreground">
                4 ROLES · 2 FAMILIES
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-badge font-mono font-medium flex items-center gap-1 border border-emerald-500/20">
                <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                <span>Open licence</span>
              </span>
              <button
                type="button"
                onClick={() => setActiveModal("typography")}
                className="text-xs font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                <span>Open in Studio</span>
                <ChevronRight className="size-3" />
              </button>
            </div>
          </div>

          {/* 4 Divided Rows in Single Unified Card */}
          <div className="rounded-xl border border-border/80 bg-background divide-y divide-border/60 overflow-hidden text-xs">
            {/* Row 1: Logo type */}
            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="md:w-56 shrink-0 space-y-0.5">
                <span className="font-semibold text-foreground block text-sm">
                  Logo type
                </span>
                <p className="text-xs font-sans text-muted-foreground">
                  {typographyRoles.find((r) => r.roleName === "Logo type")?.family || "Syne"} Bold · 40px / 44
                </p>
              </div>

              <div className="flex-1">
                <span className="text-3xl sm:text-4xl font-bold font-heading tracking-tight text-foreground">
                  {brandName}
                </span>
              </div>
            </div>

            {/* Row 2: Heading */}
            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="md:w-56 shrink-0 space-y-0.5">
                <span className="font-semibold text-foreground block text-sm">
                  Heading
                </span>
                <p className="text-xs font-sans text-muted-foreground">
                  {typographyRoles.find((r) => r.roleName === "Heading")?.family || "Syne"} {typographyRoles.find((r) => r.roleName === "Heading")?.weight || "Bold"} · 28px / 36
                </p>
              </div>

              <div className="flex-1">
                <h3 className="text-2xl sm:text-3xl font-bold font-heading text-foreground tracking-tight leading-snug">
                  {brandTagline || "Get paid without the awkward email"}
                </h3>
              </div>
            </div>

            {/* Row 3: Body */}
            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="md:w-56 shrink-0 space-y-0.5">
                <span className="font-semibold text-foreground block text-sm">
                  Body
                </span>
                <p className="text-xs font-sans text-muted-foreground">
                  {typographyRoles.find((r) => r.roleName === "Body")?.family || "DM Sans"} · 15px / 24
                </p>
              </div>

              <div className="flex-1">
                <p className="text-sm font-sans text-muted-foreground max-w-2xl leading-relaxed">
                  {kit.strategy?.concept?.value ||
                    "AutoInvoice watches the due date and writes the follow-up."}
                </p>
              </div>
            </div>

            {/* Row 4: Button & label */}
            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="md:w-56 shrink-0 space-y-0.5">
                <span className="font-semibold text-foreground block text-sm">
                  Button & label
                </span>
                <p className="text-xs font-sans text-muted-foreground">
                  {typographyRoles.find((r) => r.roleName === "Button & label")?.family || "DM Sans"} Medium · 14px / 20
                </p>
              </div>

              <div className="flex-1 flex flex-wrap items-center gap-6">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-border/80 bg-white dark:bg-zinc-800 text-foreground text-xs font-semibold shadow-xs"
                >
                  Start free
                </button>
                <span className="text-xs font-mono font-medium tracking-wider text-muted-foreground uppercase">
                  INVOICE NUMBER
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            5. SECTION 4 — STRATEGY (Figma Node 57004:12057)
           ========================================================================= */}
        <section className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6 text-card-foreground">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-heading text-foreground">
              Strategy
            </h2>

            <button
              type="button"
              onClick={() => setActiveModal("strategy")}
              className="text-xs font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <span>Open in Studio</span>
              <ChevronRight className="size-3" />
            </button>
          </div>

          {/* 2-Column 6-Fact Grid (Figma matching) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-xs">
            {/* Left Column: BUSINESS NAME, AUDIENCE, POSITIONING */}
            <div className="space-y-6">
              <div className="space-y-1">
                <span className="text-badge font-mono uppercase tracking-wider text-muted-foreground block">
                  BUSINESS NAME
                </span>
                <p className="font-semibold font-mono text-foreground text-sm">
                  {brandName}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-badge font-mono uppercase tracking-wider text-muted-foreground block">
                  AUDIENCE
                </span>
                <p className="font-sans text-body text-foreground leading-relaxed">
                  {kit.strategy?.targetAudience?.value || "Freelancers and 2-10 person agencies who bill hourly."}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-badge font-mono uppercase tracking-wider text-muted-foreground block">
                  POSITIONING
                </span>
                <p className="font-sans text-body text-foreground leading-relaxed">
                  {kit.strategy?.positioning?.value || "The invoicing tool that does the awkward follow-up for you."}
                </p>
              </div>
            </div>

            {/* Right Column: CONCEPT, INDUSTRY, PERSONALITY */}
            <div className="space-y-6">
              <div className="space-y-1">
                <span className="text-badge font-mono uppercase tracking-wider text-muted-foreground block">
                  CONCEPT
                </span>
                <p className="font-sans text-body text-foreground leading-relaxed">
                  {kit.strategy?.concept?.value || "Automated invoicing and payment chasing for freelance teams."}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-badge font-mono uppercase tracking-wider text-muted-foreground block">
                  INDUSTRY
                </span>
                <div>
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-500/20">
                    {kit.strategy?.industry?.value || "FinTech SaaS"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-badge font-mono uppercase tracking-wider text-muted-foreground block">
                  PERSONALITY
                </span>
                <div className="flex flex-wrap gap-2">
                  {(kit.strategy?.personalityTraits && kit.strategy.personalityTraits.length > 0
                    ? kit.strategy.personalityTraits
                    : ["Direct", "Calm", "Practical", "Modern", "Trustworthy"]
                  ).map((trait) => (
                    <span
                      key={trait}
                      className="px-3 py-0.5 rounded-full bg-muted/70 border border-border/80 text-xs font-normal text-foreground"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            6. SECTION 5 — USED BY (Figma Node 57004:12057)
           ========================================================================= */}
        <section className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6 text-card-foreground">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-heading text-foreground">
              Used by
            </h2>

            <span className="px-2.5 py-0.5 rounded-full bg-muted text-badge font-mono font-semibold text-muted-foreground uppercase">
              {connectedCount} OF 4 CONNECTED
            </span>
          </div>

          {/* 4 Equal Tiles in One Row (Dynamically rendered from journey/kit state) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            {integrations.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  className={`p-4 rounded-xl border bg-background flex flex-col justify-between gap-3 shadow-xs transition-opacity ${
                    item.isApplied ? "border-border/80" : "border-border/60 opacity-75"
                  }`}
                >
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <Icon className="size-4 text-muted-foreground" />
                    <span>{item.title}</span>
                  </div>

                  <div>
                    {item.isApplied ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-badge font-medium flex items-center gap-1 w-fit border border-emerald-500/20">
                        <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Applied</span>
                      </span>
                    ) : (
                      <span className="text-caption font-sans text-muted-foreground">
                        Not generated yet
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            7. SECTION 6 — COMING SOON (Figma Node 57004:12057)
           ========================================================================= */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Brand assets */}
          <div className="p-6 rounded-2xl border border-border/80 bg-card shadow-xs space-y-2 text-card-foreground">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                <h3 className="font-semibold font-heading text-sm text-foreground">
                  Brand assets
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-badge font-sans font-medium text-amber-700 dark:text-amber-400">
                Coming soon
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Business card, invoice header, social covers and presentation cover, generated from this kit.
            </p>
          </div>

          {/* Card 2: Brand guidelines PDF */}
          <div className="p-6 rounded-2xl border border-border/80 bg-card shadow-xs space-y-2 text-card-foreground">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                <h3 className="font-semibold font-heading text-sm text-foreground">
                  Brand guidelines PDF
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-badge font-sans font-medium text-amber-700 dark:text-amber-400">
                Coming soon
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              A shareable document covering logo use, spacing, colour and type.
            </p>
          </div>
        </section>

        {/* =========================================================================
            7b. OPTIONAL VERSION HISTORY (If snapshots exist)
           ========================================================================= */}
        {kit.snapshots && kit.snapshots.length > 0 && (
          <section className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-4 text-card-foreground">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="size-5 text-primary" />
                <h2 className="text-lg font-bold font-heading text-foreground">
                  Version History
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-muted text-badge font-mono font-semibold text-muted-foreground">
                {kit.snapshots.length} SNAPSHOT{kit.snapshots.length > 1 ? "S" : ""}
              </span>
            </div>

            <div className="divide-y divide-border/60 rounded-xl border border-border/70 bg-background overflow-hidden text-xs">
              {kit.snapshots.map((snap, idx) => (
                <div
                  key={snap.timestamp || idx}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground">
                      {snap.description || `Snapshot #${idx + 1}`}
                    </p>
                    <p className="text-caption font-mono text-muted-foreground">
                      {new Date(snap.timestamp).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSnapshotIndex(idx)}
                    className="h-8 text-xs font-semibold gap-1.5"
                  >
                    <History className="size-3" />
                    <span>Restore this snapshot</span>
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* =========================================================================
            8. FOOTER STRIP (Figma Node 57004:12057)
           ========================================================================= */}
        <footer className="p-4 rounded-xl border border-border/70 bg-card/60 flex items-center gap-2.5 text-xs text-muted-foreground shadow-xs">
          <Info className="size-4 text-muted-foreground shrink-0" />
          <span>
            Edits apply the next time a generator runs. Already-generated documents keep the version they were made with.
          </span>
        </footer>

        {/* =========================================================================
            9. NEXT ACTION BAR — NAVIGATE TO COMPLETE PAGE
           ========================================================================= */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl border border-border/80 bg-card shadow-xs text-card-foreground">
          <div>
            <h3 className="font-semibold font-heading text-base text-foreground">
              Ready to proceed with your verified brand?
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Advance to view your completed Phase 2 summary and unlock Phase 3.
            </p>
          </div>

          <Button
            type="button"
            onClick={handleNext}
            className="w-full sm:w-auto h-11 px-6 gap-2 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm cursor-pointer shrink-0"
          >
            <span>Next: Complete Phase 2</span>
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>

      {/* =========================================================================
          MODALS & RE-ENTRY FLOWS
         ========================================================================= */}
      
      {/* Cascade Warning Modal */}
      {cascadeTarget && (
        <CascadeWarningModal
          isOpen={true}
          targetSection={cascadeTarget}
          onClose={() => setCascadeTarget(null)}
          onConfirm={handleProceedCascade}
        />
      )}

      {/* Restore Snapshot Modal */}
      {selectedSnapshotIndex !== null && (
        <RestoreSnapshotModal
          isOpen={true}
          snapshotIndex={selectedSnapshotIndex}
          snapshot={kit.snapshots?.[selectedSnapshotIndex] || null}
          isRestoring={isRestoring}
          onConfirm={async () => {
            if (selectedSnapshotIndex === null) return;
            setIsRestoring(true);
            try {
              const restoredKit = await apiCreatorBrandKit.restoreSnapshot(
                selectedSnapshotIndex,
                kit.version,
                ideaId
              );
              setKit(restoredKit);
              setSelectedSnapshotIndex(null);
              setFeedbackMessage("Brand kit successfully restored to snapshot.");
              setTimeout(() => setFeedbackMessage(null), 4000);
            } catch (err: any) {
              console.error("Restore error:", err);
              setFeedbackMessage("Failed to restore snapshot. Please try again.");
            } finally {
              setIsRestoring(false);
            }
          }}
          onClose={() => setSelectedSnapshotIndex(null)}
        />
      )}

      {/* Step 1: Strategy Review Modal */}
      {activeModal === "strategy" && (
        <StrategyReviewModal
          kit={kit}
          onClose={() => setActiveModal(null)}
          onConfirm={async (updatedStrategy) => {
            try {
              const updatedKit = await apiCreatorBrandKit.patchStrategy(
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
              setKit(updatedKit);
              setActiveModal(null);
            } catch (err) {
              console.error("Failed to update strategy from hub:", err);
            }
          }}
        />
      )}

      {/* Step 2: Visual Direction Board Modal */}
      {activeModal === "direction" && (
        <DirectionBoardModal
          isOpen={true}
          ideaId={ideaId}
          kit={kit}
          onClose={() => setActiveModal(null)}
          onSuccess={(updatedKit) => {
            setKit(updatedKit);
            setActiveModal(null);
          }}
        />
      )}

      {/* Step 3: Logo Type Chooser Modal */}
      {activeModal === "logo_type" && (
        <LogoTypeChooserModal
          isOpen={true}
          ideaId={ideaId}
          kit={kit}
          onClose={() => setActiveModal(null)}
          onSuccess={(updatedKit) => {
            setKit(updatedKit);
            setActiveModal(null);
          }}
        />
      )}

      {/* Step 4a: Logo Creation Modal */}
      {activeModal === "logo_creation" && (
        <LogoCreationModal
          ideaId={ideaId}
          initialKit={kit}
          onConfirm={(updatedKit) => {
            setKit(updatedKit);
            setActiveModal("variations");
          }}
          onBack={() => setActiveModal(null)}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Step 4b: Variation Set Modal */}
      {activeModal === "variations" && (
        <VariationSetModal
          ideaId={ideaId}
          initialKit={kit}
          onConfirm={(updatedKit) => {
            setKit(updatedKit);
            setActiveModal(null);
          }}
          onBack={() => setActiveModal("logo_creation")}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Step 5: Color System Modal */}
      {activeModal === "colors" && (
        <ColorSystemModal
          isOpen={true}
          ideaId={ideaId}
          kit={kit}
          onClose={() => setActiveModal(null)}
          onSuccess={(updatedKit) => {
            setKit(updatedKit);
            setActiveModal(null);
          }}
        />
      )}

      {/* Step 6: Typography System Modal */}
      {activeModal === "typography" && (
        <TypographySystemModal
          isOpen={true}
          ideaId={ideaId}
          kit={kit}
          onClose={() => setActiveModal(null)}
          onSuccess={(updatedKit) => {
            setKit(updatedKit);
            setActiveModal(null);
          }}
        />
      )}
    </div>
  );
}
