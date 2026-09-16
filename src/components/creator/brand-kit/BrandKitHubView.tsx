"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandKit, BrandKitSnapshot, BrandLogoVariation } from "@/types/creator/brand-kit";
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
import JSZip from "jszip";
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

  const brandName =
    kit.strategy?.nameDisplayForm ||
    kit.strategy?.businessName ||
    "Brand";

  const snapshots = kit.snapshots ?? [];

  // 1. Download Brand Kit Bundle (Client-side ZIP with tokens and logos)
  const handleDownloadBrandKit = async () => {
    if (isZipping) return;
    setIsZipping(true);

    try {
      const zip = new JSZip();
      const slug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "brand";
      const rootFolder = zip.folder(`${slug}-brand-kit`) || zip;

      // 1. Logos Folder
      const logosFolder = rootFolder.folder("logos");
      const variations = kit.logo?.variations ?? {};

      for (const [key, variation] of Object.entries(variations)) {
        const fileKey = key.replace(/_/g, "-");
        if (variation.svgUri) {
          if (variation.svgUri.startsWith("data:image/svg+xml;base64,")) {
            const base64Data = variation.svgUri.split(",")[1];
            logosFolder?.file(`${slug}-${fileKey}.svg`, base64Data, { base64: true });
          } else if (variation.svgUri.startsWith("data:image/svg+xml,")) {
            const rawSvg = decodeURIComponent(variation.svgUri.replace("data:image/svg+xml,", ""));
            logosFolder?.file(`${slug}-${fileKey}.svg`, rawSvg);
          } else if (variation.svgUri.startsWith("<svg")) {
            logosFolder?.file(`${slug}-${fileKey}.svg`, variation.svgUri);
          } else if (variation.svgUri.startsWith("/") || variation.svgUri.startsWith("http")) {
            try {
              const fetchUrl = variation.svgUri.startsWith("http")
                ? variation.svgUri
                : `${API_ORIGIN}${variation.svgUri}`;
              const res = await fetch(fetchUrl);
              if (res.ok) {
                const svgText = await res.text();
                if (svgText && svgText.includes("<svg")) {
                  logosFolder?.file(`${slug}-${fileKey}.svg`, svgText);
                }
              }
            } catch (err) {
              console.warn(`Failed to fetch SVG asset for ${fileKey}:`, err);
            }
          }
        }
      }

      // 2. Tokens Folder: colors.json
      const tokensFolder = rootFolder.folder("tokens");
      const colorTokens = {
        brandName,
        paletteName: kit.direction?.candidates?.find((c) => c.key === kit.direction?.selectedDirectionKey)?.name || "Primary Palette",
        roles: (kit.colors?.roles ?? []).map((r) => ({
          role: r.roleName,
          hex: r.hex,
          rgb: r.rgb,
          contrastAgainstGround: r.contrastRatio ? `${r.contrastRatio}:1` : "Ground",
          wcagVerdict: r.contrastVerdict || "N/A",
          usageNote: r.usageNote,
        })),
      };
      tokensFolder?.file("colors.json", JSON.stringify(colorTokens, null, 2));

      // 3. Tokens Folder: typography.json
      const typographyTokens = {
        brandName,
        families: {
          display: kit.typography?.families?.displayFamily || { name: "Syne" },
          text: kit.typography?.families?.textFamily || { name: "Plus Jakarta Sans" },
        },
        roles: (kit.typography?.roles ?? []).map((r) => ({
          role: r.roleName,
          family: r.family,
          weight: r.weight,
          size: r.size,
          lineHeight: r.lineHeight,
          specimenText: r.specimenText,
          isPermanent: r.roleName === "Logo type",
        })),
      };
      tokensFolder?.file("typography.json", JSON.stringify(typographyTokens, null, 2));

      // 4. Tokens Folder: brand-tokens.css
      const cssTokens = `:root {
  /* Brand Colours */
  --brand-primary: ${kit.colors?.roles?.find((r) => r.roleName === "Primary")?.hex || "#0f172a"};
  --brand-secondary: ${kit.colors?.roles?.find((r) => r.roleName === "Secondary")?.hex || "#475569"};
  --brand-accent: ${kit.colors?.roles?.find((r) => r.roleName === "Accent")?.hex || "#3b82f6"};
  --brand-background: ${kit.colors?.roles?.find((r) => r.roleName === "Background")?.hex || "#ffffff"};
  --brand-text: ${kit.colors?.roles?.find((r) => r.roleName === "Text")?.hex || "#09090b"};

  /* Typography Families */
  --font-brand-display: "${kit.typography?.families?.displayFamily?.name || "Syne"}", sans-serif;
  --font-brand-text: "${kit.typography?.families?.textFamily?.name || "Plus Jakarta Sans"}", sans-serif;
}
`;
      tokensFolder?.file("brand-tokens.css", cssTokens);

      // 5. README.md Summary
      const readmeContent = `# ${brandName} — Brand Identity Kit

**Industry**: ${kit.strategy?.industry?.value || "N/A"}
**Positioning**: ${kit.strategy?.positioning?.value || "N/A"}
**Tone**: ${kit.strategy?.tonePosition || "Balanced"}
**Status**: All 6 identity steps confirmed.

---
### Included Assets:
1. \`/logos/\`: 7 production-grade logo mark variations (SVG).
2. \`/tokens/colors.json\`: Harmonized 5-role WCAG contrast color palette.
3. \`/tokens/typography.json\`: Optical typography scales and role assignments.
4. \`/tokens/brand-tokens.css\`: Ready-to-use CSS Custom Properties.
`;
      rootFolder.file("README.md", readmeContent);

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${slug}-brand-kit.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error("ZIP packaging error:", err);
    } finally {
      setIsZipping(false);
    }
  };

  // Restore snapshot handler
  const handleConfirmRestore = async () => {
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
  };

  // Upstream Edit Interceptors
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

  const approvedConcept =
    kit.logo?.concepts?.find((c) => c.key === kit.logo?.selectedConceptKey) ||
    kit.logo?.concepts?.[0];

  const logoVariations = kit.logo?.variations ?? {};

  const canonicalVariationDefinitions = [
    { key: "primary", label: "Primary", description: "Default master brand lockup" },
    { key: "horizontal", label: "Horizontal", description: "Navbars, headers & landscape banners" },
    { key: "stacked", label: "Stacked", description: "Square cards, badges & packaging" },
    { key: "icon_only", label: "Icon-only", description: "Favicons, avatars & app icons" },
    { key: "black", label: "Black", description: "Single-ink monochrome dark" },
    { key: "white", label: "White", description: "Monochrome reverse white" },
    { key: "transparent", label: "Transparent", description: "Alpha channel background" },
  ];

  const colors = kit.colors?.roles ?? [];
  const typographyRoles = kit.typography?.roles ?? [];

  return (
    <div className="flex-1 w-full bg-[#EFEFF1] text-foreground min-h-screen pb-20">
      {/* Feedback Banner */}
      {feedbackMessage && (
        <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-semibold text-center sticky top-0 z-50 shadow-sm">
          {feedbackMessage}
        </div>
      )}

      <main className="mx-auto max-w-5xl px-4 sm:px-6 pt-8 space-y-8">
        {/* =========================================================================
            1. IDENTITY BLOCK (HERO)
           ========================================================================= */}
        <section className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              {/* Approved Mark Thumbnail */}
              <div className="size-16 rounded-2xl bg-zinc-950 flex items-center justify-center p-3 shadow-inner shrink-0 border border-zinc-800">
                {logoVariations.primary?.svgUri || approvedConcept?.markAssetUri ? (
                  <div
                    className="size-full flex items-center justify-center [&_svg]:size-full [&_svg]:max-h-full"
                    dangerouslySetInnerHTML={{
                      __html: logoVariations.primary?.svgUri || approvedConcept?.markAssetUri || "",
                    }}
                  />
                ) : (
                  <Sparkles className="size-8 text-primary" />
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    {brandName}
                  </h1>
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    <Check className="size-3 stroke-[3]" />
                    All six steps complete
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {kit.strategy?.industry?.value || "Enterprise"}
                  </span>
                  <span>·</span>
                  <span>{kit.strategy?.positioning?.value || "Innovation Architecture"}</span>
                </div>
              </div>
            </div>

            {/* Actions: Download Brand Kit (The ONE filled blue button) & Open in Studio */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/dashboard/creator/phase-2/brand-studio")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors"
              >
                <span>Edit in Studio</span>
                <ExternalLink className="size-3.5 text-muted-foreground" />
              </button>

              <button
                type="button"
                onClick={handleDownloadBrandKit}
                disabled={isZipping}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-primary text-white shadow-sm hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                <Download className="size-4" />
                <span>{isZipping ? "Packaging ZIP..." : "Download Brand Kit (.zip)"}</span>
              </button>
            </div>
          </div>

          {/* Metadata Row in JetBrains Mono */}
          <div className="flex flex-wrap items-center justify-between border-t border-border/60 pt-4 font-mono text-[11px] text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>
                CREATED:{" "}
                <strong className="text-foreground">
                  {new Date(kit.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </strong>
              </span>
              <span>·</span>
              <span>
                UPDATED:{" "}
                <strong className="text-foreground">
                  {new Date(kit.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </strong>
              </span>
            </div>
            <div>
              <span>
                VERSION: <strong className="text-foreground font-bold">v{kit.version}</strong>
              </span>
            </div>
          </div>
        </section>

        {/* =========================================================================
            2. LOGO SECTION (ALL 7 CANONICAL VARIATIONS)
           ========================================================================= */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                STEP 4
              </span>
              <h2 className="text-base font-bold text-foreground">
                Logo Concept & 7 Canonical Variations
              </h2>
            </div>

            <button
              type="button"
              onClick={handleOpenLogo}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline"
            >
              Edit Logo →
            </button>
          </div>

          {/* All 7 Canonical Variations Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {canonicalVariationDefinitions.map((item) => {
              const varObj: BrandLogoVariation | undefined = logoVariations[item.key];
              const isDark = item.key === "white";
              const isCheckerboard = item.key === "transparent";
              const assetMarkup = varObj?.svgUri || approvedConcept?.markAssetUri || "";

              const handleCopySvg = (e: React.MouseEvent) => {
                e.stopPropagation();
                if (!assetMarkup) return;
                navigator.clipboard.writeText(assetMarkup);
                setFeedbackMessage(`Copied ${item.label} SVG to clipboard.`);
                setTimeout(() => setFeedbackMessage(null), 3000);
              };

              return (
                <div
                  key={item.key}
                  className="p-4 rounded-xl border border-border bg-muted/10 flex flex-col justify-between gap-3 shadow-xs hover:border-border/80 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-foreground">
                      {item.label}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopySvg}
                      className="font-mono text-[10px] text-muted-foreground hover:text-foreground bg-muted px-2 py-0.5 rounded transition-colors"
                    >
                      Copy SVG
                    </button>
                  </div>

                  {/* Visual Stage */}
                  <div
                    className={`h-24 rounded-lg flex items-center justify-center p-3 border shadow-inner ${
                      isDark
                        ? "bg-[#09090B] border-zinc-800 text-white"
                        : isCheckerboard
                        ? "border-border/80"
                        : "bg-white border-border/60 text-foreground"
                    }`}
                    style={
                      isCheckerboard
                        ? {
                            backgroundImage:
                              "linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)",
                            backgroundSize: "12px 12px",
                            backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0px",
                            backgroundColor: "#ffffff",
                          }
                        : undefined
                    }
                  >
                    {varObj?.svgUri ? (
                      <div
                        className="size-full flex items-center justify-center [&_svg]:max-h-full [&_svg]:max-w-full [&_svg]:object-contain"
                        dangerouslySetInnerHTML={{ __html: varObj.svgUri }}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Sparkles className="size-5 text-primary" />
                        <span className="font-bold text-xs">{brandName}</span>
                      </div>
                    )}
                  </div>

                  <p className="font-mono text-[10px] text-muted-foreground line-clamp-1">
                    {varObj?.usageNote || item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            3. COLOUR SYSTEM SECTION
           ========================================================================= */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                STEP 5
              </span>
              <h2 className="text-base font-bold text-foreground">
                Harmonized 5-Role Colour System
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal("colors")}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline"
            >
              Edit Colours →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {colors.map((role) => {
              const isGround = role.roleName === "Background";
              const verdict = role.contrastVerdict?.toUpperCase();
              const ratio = role.contrastRatio ? `${role.contrastRatio}:1` : "";

              return (
                <div
                  key={role.roleName}
                  className="p-3.5 rounded-xl border border-border bg-muted/10 flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      {role.roleName}
                    </span>
                    {role.isLocked && (
                      <span title="Role Locked">
                        <Lock className="size-3 text-muted-foreground" />
                      </span>
                    )}
                  </div>

                  {/* Swatch */}
                  <div
                    className="h-12 w-full rounded-lg border border-black/10 shadow-inner"
                    style={{ backgroundColor: role.hex }}
                  />

                  {/* Numerals */}
                  <div className="space-y-1 font-mono text-xs">
                    <div className="font-bold text-foreground">{role.hex}</div>
                    <div className="text-[10px] text-muted-foreground">RGB: {role.rgb}</div>
                    
                    {/* Contrast Rating */}
                    <div className="pt-1">
                      {isGround ? (
                        <span className="text-[10px] text-muted-foreground">
                          Ground canvas
                        </span>
                      ) : verdict === "AAA" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          <ShieldCheck className="size-2.5" />
                          {ratio} AAA
                        </span>
                      ) : verdict === "FAIL" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          <AlertTriangle className="size-2.5" />
                          {ratio} FAIL
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 dark:text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20">
                          <ShieldCheck className="size-2.5" />
                          {ratio} {verdict === "AA_LARGE" ? "AA Large" : "AA"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            4. TYPOGRAPHY SYSTEM SECTION
           ========================================================================= */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                STEP 6
              </span>
              <h2 className="text-base font-bold text-foreground">
                Harmonized Typography System
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal("typography")}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline"
            >
              Edit Typography →
            </button>
          </div>

          {/* Families Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-1">
              <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase">
                DISPLAY FAMILY
              </span>
              <div
                className="text-xl font-bold text-foreground"
                style={{ fontFamily: `"${kit.typography?.families?.displayFamily?.name || "Syne"}", sans-serif` }}
              >
                {kit.typography?.families?.displayFamily?.name || "Syne"}
              </div>
              <div className="font-mono text-[10px] text-muted-foreground pt-1">
                {kit.typography?.families?.displayFamily?.license || "SIL Open Font License 1.1"} · {kit.typography?.families?.displayFamily?.webWeightKb || 133.5} KB
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-1">
              <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase">
                TEXT FAMILY
              </span>
              <div
                className="text-xl font-bold text-foreground"
                style={{ fontFamily: `"${kit.typography?.families?.textFamily?.name || "Plus Jakarta Sans"}", sans-serif` }}
              >
                {kit.typography?.families?.textFamily?.name || "Plus Jakarta Sans"}
              </div>
              <div className="font-mono text-[10px] text-muted-foreground pt-1">
                {kit.typography?.families?.textFamily?.license || "SIL Open Font License 1.1"} · {kit.typography?.families?.textFamily?.webWeightKb || 172.1} KB
              </div>
            </div>
          </div>

          {/* 4 Role Specimens */}
          <div className="space-y-3">
            {typographyRoles.map((role) => {
              const isPermanent = role.roleName === "Logo type";

              return (
                <div
                  key={role.roleName}
                  className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{role.roleName}</span>
                      <span className="font-mono text-xs text-muted-foreground">· {role.family}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPermanent ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                          <Lock className="size-2.5" />
                          Permanent
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {role.weight} · {role.size}
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className="text-foreground tracking-tight"
                    style={{
                      fontFamily: `"${role.family}", sans-serif`,
                      fontSize: role.size || "16px",
                      fontWeight: role.weight || "400",
                    }}
                  >
                    {role.specimenText || brandName}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            5. BRAND STRATEGY SECTION (ALL 6 CONFIRMED FACTS)
           ========================================================================= */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                STEP 1
              </span>
              <h2 className="text-base font-bold text-foreground">
                Brand Strategy Foundations (6 Confirmed Facts)
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal("strategy")}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline"
            >
              Edit Strategy →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Fact 1: Industry */}
            <div className="p-3.5 rounded-xl border border-border bg-muted/10 space-y-1">
              <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase">
                1. INDUSTRY
              </span>
              <div className="text-sm font-semibold text-foreground">
                {kit.strategy?.industry?.value || "Cybersecurity"}
              </div>
            </div>

            {/* Fact 2: Audience */}
            <div className="p-3.5 rounded-xl border border-border bg-muted/10 space-y-1">
              <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase">
                2. TARGET AUDIENCE
              </span>
              <div className="text-sm font-semibold text-foreground">
                {kit.strategy?.targetAudience?.value || "Enterprise SecOps"}
              </div>
            </div>

            {/* Fact 3: Concept */}
            <div className="p-3.5 rounded-xl border border-border bg-muted/10 space-y-1">
              <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase">
                3. CORE CONCEPT
              </span>
              <div className="text-sm font-semibold text-foreground line-clamp-2">
                {kit.strategy?.concept?.value || "Autonomous zero-trust threat containment & cloud security operations"}
              </div>
            </div>

            {/* Fact 4: Positioning */}
            <div className="p-3.5 rounded-xl border border-border bg-muted/10 space-y-1">
              <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase">
                4. POSITIONING
              </span>
              <div className="text-sm font-semibold text-foreground line-clamp-2">
                {kit.strategy?.positioning?.value || "Next-generation cryptographic infrastructure protection"}
              </div>
            </div>

            {/* Fact 5: Personality Traits */}
            <div className="p-3.5 rounded-xl border border-border bg-muted/10 space-y-1">
              <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase">
                5. PERSONALITY TRAITS
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(kit.strategy?.personalityTraits && kit.strategy.personalityTraits.length > 0
                  ? kit.strategy.personalityTraits
                  : ["Precise", "Resilient", "Authoritative"]
                ).map((trait) => (
                  <span
                    key={trait}
                    className="text-xs px-2 py-0.5 rounded-md bg-muted font-mono font-medium text-foreground border border-border"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>

            {/* Fact 6: Tone Position */}
            <div className="p-3.5 rounded-xl border border-border bg-muted/10 space-y-1">
              <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase">
                6. TONE POSITION
              </span>
              <div className="text-sm font-semibold text-foreground capitalize">
                {kit.strategy?.tonePosition || "Authoritative"}
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            6. VERSION HISTORY PANEL (UP TO 3 SNAPSHOTS)
           ========================================================================= */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <History className="size-4 text-primary" />
              <h2 className="text-base font-bold text-foreground">
                Version History (Bounded Snapshots)
              </h2>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">
              Max 3 retained
            </span>
          </div>

          {snapshots.length === 0 ? (
            <div className="p-8 rounded-xl border border-dashed border-border text-center space-y-2">
              <Clock className="size-6 text-muted-foreground mx-auto" />
              <p className="text-xs font-semibold text-foreground">
                No previous version snapshots saved yet.
              </p>
              <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
                Snapshots are automatically captured whenever destructive edits (such as changing Visual Direction or core Logo concepts) occur.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {snapshots.map((snap, idx) => {
                const dateStr = new Date(snap.timestamp).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {snap.description || `Snapshot #${idx + 1}`}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          · {dateStr}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Direction: {snap.direction?.candidates?.find((c) => c.key === snap.direction?.selectedDirectionKey)?.name || "Original"} · {snap.colors?.roles?.length || 5} colour roles · {snap.typography?.roles?.length || 4} typography roles
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedSnapshotIndex(idx)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border shrink-0 transition-colors"
                    >
                      <History className="size-3 text-muted-foreground" />
                      <span>Restore this snapshot</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* =========================================================================
            7. "USED BY" DOWNSTREAM GENERATORS SECTION (HONEST ZERO-FABRICATION)
           ========================================================================= */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="border-b border-border/60 pb-3">
            <h2 className="text-base font-bold text-foreground">
              Downstream Platform Integrations
            </h2>
            <p className="text-xs text-muted-foreground">
              Generators that will consume your verified Brand Kit tokens.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* 1. Business Plan */}
            <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-2 flex flex-col justify-between">
              <div className="space-y-1">
                <FileText className="size-4 text-muted-foreground" />
                <h4 className="text-xs font-bold text-foreground">Business Plan</h4>
                <p className="text-[11px] text-muted-foreground">Phase 3 executive summaries & brand narrative.</p>
              </div>
              <span className="inline-block font-mono text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border w-fit">
                Not connected yet
              </span>
            </div>

            {/* 2. Landing Page */}
            <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-2 flex flex-col justify-between">
              <div className="space-y-1">
                <Layers className="size-4 text-muted-foreground" />
                <h4 className="text-xs font-bold text-foreground">Landing Page</h4>
                <p className="text-[11px] text-muted-foreground">Public web storefront and CTA layout system.</p>
              </div>
              <span className="inline-block font-mono text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border w-fit">
                Not connected yet
              </span>
            </div>

            {/* 3. Pitch Deck */}
            <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-2 flex flex-col justify-between">
              <div className="space-y-1">
                <Share2 className="size-4 text-muted-foreground" />
                <h4 className="text-xs font-bold text-foreground">Pitch Deck</h4>
                <p className="text-[11px] text-muted-foreground">Investor slides formatted with brand theme.</p>
              </div>
              <span className="inline-block font-mono text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border w-fit">
                Not connected yet
              </span>
            </div>

            {/* 4. Invoices & Receipts */}
            <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-2 flex flex-col justify-between">
              <div className="space-y-1">
                <FileBox className="size-4 text-muted-foreground" />
                <h4 className="text-xs font-bold text-foreground">Invoices & Receipts</h4>
                <p className="text-[11px] text-muted-foreground">Commercial checkout templates & headers.</p>
              </div>
              <span className="inline-block font-mono text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border w-fit">
                Not connected yet
              </span>
            </div>
          </div>
        </section>

        {/* =========================================================================
            8. COMING SOON MODULES
           ========================================================================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl border border-dashed border-border bg-card/60 space-y-2">
            <span className="inline-block font-mono text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
              COMING SOON
            </span>
            <h3 className="text-sm font-bold text-foreground">Brand Assets Exporter</h3>
            <p className="text-xs text-muted-foreground">
              Social media banner templates, app store icon sets, and favicons tailored to your mark.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-dashed border-border bg-card/60 space-y-2">
            <span className="inline-block font-mono text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
              COMING SOON
            </span>
            <h3 className="text-sm font-bold text-foreground">Brand Guidelines PDF</h3>
            <p className="text-xs text-muted-foreground">
              Downloadable vector PDF manual detailing logo clearspace, color breakdown, and typography scales.
            </p>
          </div>
        </section>
      </main>

      {/* =========================================================================
          MODALS & OVERLAYS
         ========================================================================= */}

      {/* Cascade Warning Modal */}
      {cascadeTarget && (
        <CascadeWarningModal
          isOpen={true}
          targetSection={cascadeTarget}
          onConfirm={handleProceedCascade}
          onClose={() => setCascadeTarget(null)}
        />
      )}

      {/* Restore Snapshot Confirmation Modal */}
      {selectedSnapshotIndex !== null && (
        <RestoreSnapshotModal
          isOpen={true}
          snapshot={snapshots[selectedSnapshotIndex] || null}
          snapshotIndex={selectedSnapshotIndex}
          isRestoring={isRestoring}
          onConfirm={handleConfirmRestore}
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
