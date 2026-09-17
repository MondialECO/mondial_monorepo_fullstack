"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Sparkles,
  RefreshCw,
  Check,
  AlertCircle,
  ArrowUpRight,
  Sliders,
  X,
  Type,
  Palette,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BrandKit,
  BrandDirection,
  BrandDirectionCandidate,
} from "@/types/creator/brand-kit";
import { brandKitApi } from "@/lib/api-creator-brand-kit";
import creatorAiApi from "@/lib/api-creator-ai";
import { RegenerateCapBadge } from "./RegenerateCapBadge";
import { ModalWorkflowHeader } from "./ModalWorkflowHeader";
import Link from "next/link";

interface DirectionBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  ideaId?: string;
  kit: BrandKit;
  onSuccess: (updatedKit: BrandKit) => void;
}

// Fallback font family mappings
function getFontFamilyCss(fontName: string): string {
  switch (fontName?.toLowerCase().trim()) {
    case "cinzel":
      return "'Cinzel', 'Playfair Display', Georgia, serif";
    case "space grotesk":
      return "'Space Grotesk', var(--font-inter), system-ui, sans-serif";
    case "plus jakarta sans":
      return "'Plus Jakarta Sans', var(--font-dm-sans), system-ui, sans-serif";
    case "syne":
      return "'Syne', var(--font-syne), var(--font-inter), sans-serif";
    case "jetbrains mono":
      return "'JetBrains Mono', 'SFMono-Regular', Menlo, Monaco, Consolas, monospace";
    default:
      return "system-ui, -apple-system, sans-serif";
  }
}

// Abstract geometric motif SVG renderer based on motifKey
function AbstractMotifSpecimen({
  motifKey,
  accentColor,
  baseColor,
}: {
  motifKey: string;
  accentColor: string;
  baseColor: string;
}) {
  const key = motifKey?.toLowerCase().trim() || "geometric_structure";

  switch (key) {
    case "geometric_structure":
      return (
        <svg
          viewBox="0 0 120 120"
          className="size-full opacity-60 transition-transform duration-500 group-hover:scale-105"
          fill="none"
        >
          <polygon
            points="60,15 105,90 15,90"
            stroke={accentColor}
            strokeWidth="2.5"
            strokeDasharray="4 2"
          />
          <polygon
            points="60,35 90,85 30,85"
            stroke={baseColor}
            strokeWidth="1.5"
          />
          <circle cx="60" cy="65" r="14" fill={accentColor} fillOpacity="0.25" />
          <line x1="60" y1="15" x2="60" y2="85" stroke={accentColor} strokeWidth="1.5" />
        </svg>
      );
    case "organic_growth":
      return (
        <svg
          viewBox="0 0 120 120"
          className="size-full opacity-60 transition-transform duration-500 group-hover:scale-105"
          fill="none"
        >
          <path
            d="M20,100 C40,40 80,40 100,20 C100,60 70,90 20,100 Z"
            stroke={accentColor}
            strokeWidth="2"
            fill={accentColor}
            fillOpacity="0.15"
          />
          <circle cx="60" cy="60" r="30" stroke={baseColor} strokeWidth="1.5" strokeDasharray="3 3" />
          <path
            d="M35,85 Q60,40 85,35"
            stroke={accentColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "technical_lattice":
      return (
        <svg
          viewBox="0 0 120 120"
          className="size-full opacity-55 transition-transform duration-500 group-hover:scale-105"
          fill="none"
        >
          <defs>
            <pattern id={`grid-${accentColor.replace('#','')}`} width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke={accentColor} strokeWidth="0.75" strokeOpacity="0.4" />
              <circle cx="10" cy="10" r="1.5" fill={baseColor} fillOpacity="0.8" />
            </pattern>
          </defs>
          <rect width="120" height="120" fill={`url(#grid-${accentColor.replace('#','')})`} />
          <rect x="25" y="25" width="70" height="70" stroke={accentColor} strokeWidth="2" />
          <line x1="15" y1="60" x2="105" y2="60" stroke={accentColor} strokeWidth="1.5" strokeDasharray="2 2" />
          <line x1="60" y1="15" x2="60" y2="105" stroke={accentColor} strokeWidth="1.5" strokeDasharray="2 2" />
        </svg>
      );
    case "editorial_classic":
      return (
        <svg
          viewBox="0 0 120 120"
          className="size-full opacity-60 transition-transform duration-500 group-hover:scale-105"
          fill="none"
        >
          <line x1="15" y1="20" x2="105" y2="20" stroke={accentColor} strokeWidth="2.5" />
          <line x1="25" y1="26" x2="95" y2="26" stroke={baseColor} strokeWidth="1" />
          <line x1="15" y1="100" x2="105" y2="100" stroke={accentColor} strokeWidth="2.5" />
          <line x1="25" y1="94" x2="95" y2="94" stroke={baseColor} strokeWidth="1" />
          <circle cx="60" cy="60" r="24" stroke={accentColor} strokeWidth="1.5" />
          <path d="M48,60 L72,60 M60,48 L60,72" stroke={accentColor} strokeWidth="1.5" />
        </svg>
      );
    case "minimal_monogram":
      return (
        <svg
          viewBox="0 0 120 120"
          className="size-full opacity-60 transition-transform duration-500 group-hover:scale-105"
          fill="none"
        >
          <rect x="20" y="20" width="80" height="80" rx="16" stroke={accentColor} strokeWidth="2" />
          <rect x="32" y="32" width="56" height="56" rx="8" stroke={baseColor} strokeWidth="1.5" strokeDasharray="4 2" />
          <circle cx="60" cy="60" r="16" fill={accentColor} fillOpacity="0.2" />
        </svg>
      );
    case "bold_abstract":
    default:
      return (
        <svg
          viewBox="0 0 120 120"
          className="size-full opacity-60 transition-transform duration-500 group-hover:scale-105"
          fill="none"
        >
          <path d="M15,95 L95,15 L105,25 L25,105 Z" fill={accentColor} fillOpacity="0.6" />
          <path d="M45,105 L105,45 L115,55 L55,115 Z" fill={baseColor} fillOpacity="0.4" />
          <circle cx="35" cy="40" r="18" fill={accentColor} fillOpacity="0.3" />
        </svg>
      );
  }
}

export function DirectionBoardModal({
  isOpen,
  onClose,
  ideaId,
  kit,
  onSuccess,
}: DirectionBoardModalProps) {
  // 1. Core State
  const [currentKit, setCurrentKit] = useState<BrandKit>(kit);
  const initialSelectedKey =
    kit?.direction?.selectedDirectionKey ||
    kit?.direction?.candidates?.[0]?.key ||
    "";

  const [candidates, setCandidates] = useState<BrandDirectionCandidate[]>(
    kit?.direction?.candidates || []
  );
  const [selectedKey, setSelectedKey] = useState<string>(initialSelectedKey);
  const [regenerateCount, setRegenerateCount] = useState<number>(
    kit?.direction?.regenerateCount || 0
  );

  // Adjustment Settings (Palette Variant, Contrast, Type Weight)
  const [adjustments, setAdjustments] = useState({
    paletteVariant:
      kit?.direction?.adjustmentSettings?.paletteVariant || "default",
    contrastPosition:
      kit?.direction?.adjustmentSettings?.contrastPosition || "balanced",
    typeWeight: kit?.direction?.adjustmentSettings?.typeWeight || "medium",
  });

  // Filter state for "SHOW ME" chip bar
  const [activeFilter, setActiveFilter] = useState<
    "all" | "calmer" | "bolder" | "technical"
  >("all");

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [directionCost, setDirectionCost] = useState<number>(7);
  const [error, setError] = useState<{
    type: "credits" | "cap" | "network";
    message: string;
  } | null>(null);

  useEffect(() => {
    creatorAiApi
      .getCredits()
      .then((res) => {
        if (res?.costs?.DirectionGeneration != null) {
          setDirectionCost(res.costs.DirectionGeneration);
        }
      })
      .catch(() => {});
  }, []);

  // Synchronize state when kit updates
  useEffect(() => {
    if (kit) {
      setCurrentKit(kit);
    }
    if (kit?.direction?.candidates && kit.direction.candidates.length > 0) {
      setCandidates(kit.direction.candidates);
      if (!selectedKey || !kit.direction.candidates.some((c) => c.key === selectedKey)) {
        setSelectedKey(
          kit.direction.selectedDirectionKey || kit.direction.candidates[0].key
        );
      }
      setRegenerateCount(kit.direction.regenerateCount || 0);
    }
  }, [kit]);

  // Initial automatic generation if candidates list is empty
  useEffect(() => {
    if (
      isOpen &&
      (!kit?.direction?.candidates || kit.direction.candidates.length === 0) &&
      !isGenerating
    ) {
      handleGenerate();
    }
  }, [isOpen]);

  const remainingCap = Math.max(0, 3 - regenerateCount);
  const isCapExhausted = remainingCap === 0;

  // Filtered / Re-sorted candidates based on SHOW ME filter chip
  const filteredCandidates = useMemo(() => {
    if (activeFilter === "all") return candidates;
    if (activeFilter === "calmer") {
      return [...candidates].sort((a, b) => {
        const aScore =
          (a.feelLine + a.name + a.rationale).toLowerCase().includes("calm") ||
          (a.feelLine + a.name).toLowerCase().includes("minimal")
            ? 1
            : 0;
        const bScore =
          (b.feelLine + b.name + b.rationale).toLowerCase().includes("calm") ||
          (b.feelLine + b.name).toLowerCase().includes("minimal")
            ? 1
            : 0;
        return bScore - aScore;
      });
    }
    if (activeFilter === "bolder") {
      return [...candidates].sort((a, b) => {
        const aScore =
          (a.feelLine + a.name + a.rationale).toLowerCase().includes("bold") ||
          (a.feelLine + a.name).toLowerCase().includes("dynamic")
            ? 1
            : 0;
        const bScore =
          (b.feelLine + b.name + b.rationale).toLowerCase().includes("bold") ||
          (b.feelLine + b.name).toLowerCase().includes("dynamic")
            ? 1
            : 0;
        return bScore - aScore;
      });
    }
    if (activeFilter === "technical") {
      return [...candidates].sort((a, b) => {
        const aScore =
          (a.feelLine + a.name + a.rationale).toLowerCase().includes("tech") ||
          (a.feelLine + a.name).toLowerCase().includes("precision") ||
          (a.feelLine + a.name).toLowerCase().includes("system")
            ? 1
            : 0;
        const bScore =
          (b.feelLine + b.name + b.rationale).toLowerCase().includes("tech") ||
          (b.feelLine + b.name).toLowerCase().includes("precision") ||
          (b.feelLine + b.name).toLowerCase().includes("system")
            ? 1
            : 0;
        return bScore - aScore;
      });
    }
    return candidates;
  }, [candidates, activeFilter]);

  // Selected Candidate object
  const selectedCandidate = useMemo(() => {
    return (
      candidates.find((c) => c.key === selectedKey) ||
      candidates[0] ||
      null
    );
  }, [candidates, selectedKey]);

  // Business Name derived directly from real strategy
  const businessName = useMemo(() => {
    return (
      currentKit?.strategy?.nameDisplayForm ||
      kit?.strategy?.nameDisplayForm ||
      kit?.strategy?.businessName ||
      "Brand"
    );
  }, [currentKit, kit]);

  // Derive letterform pair from real business name (e.g. "Instaly" -> "Ii", "CyberLock" -> "Cc", "AutoInvoice" -> "Aa")
  const brandInitialPair = useMemo(() => {
    const firstChar = businessName.trim().charAt(0).toUpperCase() || "A";
    return `${firstChar}${firstChar.toLowerCase()}`;
  }, [businessName]);

  // Generate / Regenerate Candidates (Costs 7 credits, capped at 3)
  const handleGenerate = async () => {
    if (isGenerating || isCapExhausted) return;

    setIsGenerating(true);
    setError(null);

    try {
      const updatedKit = await brandKitApi.generateDirections(
        ideaId,
        kit?.version
      );

      setCurrentKit(updatedKit);
      if (updatedKit?.direction?.candidates) {
        setCandidates(updatedKit.direction.candidates);
        setSelectedKey(
          updatedKit.direction.selectedDirectionKey ||
            updatedKit.direction.candidates[0]?.key ||
            ""
        );
      }
      setRegenerateCount(updatedKit?.direction?.regenerateCount || 0);
    } catch (err: any) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to generate visual directions.";

      if (status === 402) {
        setError({
          type: "credits",
          message: `Insufficient AI credits (${directionCost} credits required).`,
        });
      } else if (status === 400 && msg.toLowerCase().includes("limit")) {
        setError({
          type: "cap",
          message: "Maximum regeneration limit (3/3) reached.",
        });
      } else {
        setError({
          type: "network",
          message: `Visual Direction generation did not finish. Your ${directionCost} credits have been automatically refunded to your balance.`,
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Confirm selection and land result on Canvas
  const handleConfirm = async () => {
    if (!selectedKey || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const updatedKit = await brandKitApi.patchDirection(
        {
          selectedDirectionKey: selectedKey,
          selectedAt: new Date().toISOString(),
          adjustmentSettings: adjustments,
        },
        ideaId,
        currentKit?.version ?? kit?.version
      );

      onSuccess(updatedKit);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save visual direction.";
      setError({
        type: "network",
        message: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden bg-white">
        {/* Modal Header & 6-Step Workflow Track (Figma Node 57003:9812 / 57012:9066) */}
        <ModalWorkflowHeader
          title="Pick a visual direction"
          subtitle="This sets the visual language. Logos are drawn inside the direction you pick."
          currentStep={2}
          onClose={onClose}
          headerActions={
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isGenerating || isCapExhausted}
                onClick={handleGenerate}
                className="h-8 px-3 text-xs font-medium gap-1.5 hover:bg-muted text-foreground disabled:opacity-50 font-sans cursor-pointer"
                title={
                  isCapExhausted
                    ? "Regeneration cap reached (3/3)"
                    : `Regenerate all 4 directions (${directionCost} credits, ${remainingCap} left)`
                }
              >
                <RefreshCw
                  className={`size-3.5 ${isGenerating ? "animate-spin" : ""}`}
                />
                <span>Regenerate all four</span>
              </Button>

              {/* Dynamic CREDITS chip */}
              <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md border border-border/60">
                <Sparkles className="size-3 text-primary" />
                {directionCost} CREDITS
              </span>

              {/* Amber Cap Badge */}
              <span
                className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 tabular-nums shrink-0"
                title={`${remainingCap} of 3 regenerations left`}
              >
                {`${remainingCap}/3 LEFT`}
              </span>
            </div>
          }
        />

        {/* Section - Visual direction filters (Figma Node 57012:9066) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 sm:px-8 py-3.5 border-b border-border/70 bg-muted/15 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-muted-foreground tracking-wider uppercase font-sans pr-1">
              SHOW ME
            </span>
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors font-sans cursor-pointer ${
                activeFilter === "all"
                  ? "bg-foreground text-background font-semibold shadow-2xs"
                  : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60"
              }`}
            >
              All four
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("calmer")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors font-sans cursor-pointer ${
                activeFilter === "calmer"
                  ? "bg-foreground text-background font-semibold shadow-2xs"
                  : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60"
              }`}
            >
              Calmer
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("bolder")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors font-sans cursor-pointer ${
                activeFilter === "bolder"
                  ? "bg-foreground text-background font-semibold shadow-2xs"
                  : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60"
              }`}
            >
              Bolder
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("technical")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors font-sans cursor-pointer ${
                activeFilter === "technical"
                  ? "bg-foreground text-background font-semibold shadow-2xs"
                  : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60"
              }`}
            >
              More technical
            </button>
          </div>

          <span className="text-xs text-muted-foreground font-sans">
            Filtering re-sorts what you see — it doesn't use a regenerate.
          </span>
        </div>

        {/* Inline Error Alert if any */}
        {error && (
          <div className="px-6 py-2.5 bg-destructive/10 border-b border-destructive/20 text-destructive text-xs flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span className="font-medium">{error.message}</span>
            </div>
            {error.type === "credits" && (
              <Link
                href="/dashboard/creator/credits"
                target="_blank"
                className="inline-flex items-center gap-1 font-semibold underline hover:opacity-85"
              >
                Top up credits <ArrowUpRight className="size-3" />
              </Link>
            )}
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Loading Skeleton during initial generation */}
          {isGenerating && candidates.length === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[440px] items-center justify-center text-center p-12">
              <div className="col-span-full flex flex-col items-center gap-3">
                <RefreshCw className="size-8 text-primary animate-spin" />
                <h3 className="text-base font-semibold text-foreground font-heading">
                  Synthesizing Visual Directions...
                </h3>
                <p className="text-xs text-muted-foreground max-w-md">
                  Crafting 4 divergent design directions tailored to your business strategy, bundled typography, and harmonized color palettes.
                </p>
              </div>
            </div>
          )}

          {/* 2x2 DIRECTION BOARDS GRID (24px gutters, height-matched) */}
          {filteredCandidates.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {filteredCandidates.map((candidate, idx) => {
                const isSelected = selectedKey === candidate.key;
                const palette = candidate.colorPalette || [
                  "#0F172A",
                  "#334155",
                  "#64748B",
                  "#CBD5E1",
                ];
                const baseTone = palette[0] || "#0F172A";
                const accentTone = palette[1] || palette[2] || "#3B82F6";
                const lightTone = palette[3] || palette[2] || "#F8FAFC";

                // Dynamic specimen tags matching Figma design
                const specimenTag =
                  idx === 0
                    ? "SPECIMEN · GRID 01"
                    : idx === 1
                    ? "DIRECTION 02"
                    : idx === 2
                    ? "SPECIMEN · ORGANIC 03"
                    : "SYSTEM // SYS_04";

                const specimenSub =
                  idx === 0
                    ? "DISCIPLINE · BALANCE · CLARITY"
                    : idx === 1
                    ? "DECISIVE · DYNAMIC · ELECTRIC"
                    : idx === 2
                    ? "INVITING · HARMONIC · GROUNDED"
                    : "PRECISION · MODULAR · VELOCITY";

                return (
                  <div
                    key={candidate.key}
                    onClick={() => setSelectedKey(candidate.key)}
                    className={`group relative flex flex-col rounded-2xl border bg-card text-card-foreground shadow-xs transition-all duration-200 cursor-pointer overflow-hidden ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/30 shadow-md"
                        : "border-border/80 hover:border-primary/50 hover:shadow-sm"
                    }`}
                  >
                    {/* a) Preview Band (200px tall, abstract style specimen) */}
                    <div
                      className="relative h-[200px] w-full flex flex-col justify-between p-6 overflow-hidden border-b border-border/40 select-none"
                      style={{
                        backgroundColor: baseTone,
                        color: lightTone,
                      }}
                    >
                      {/* Top Row: Specimen Tag & Pinned Check Badge */}
                      <div className="relative z-10 flex items-center justify-between">
                        <span className="font-mono text-[10px] tracking-wider uppercase font-semibold opacity-75">
                          {specimenTag}
                        </span>

                        {/* Pinned 24px Blue Check Badge in Top-Right Corner */}
                        {isSelected && (
                          <div className="size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                            <Check className="size-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Abstract Background Motif */}
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40">
                        <AbstractMotifSpecimen
                          motifKey={candidate.motifKey}
                          accentColor={accentTone}
                          baseColor={lightTone}
                        />
                      </div>

                      {/* Bottom Row: Large Letterform Specimen & Direction Descriptor */}
                      <div className="relative z-10 flex items-end justify-between gap-4">
                        <div className="flex flex-col">
                          <span
                            className="text-5xl sm:text-6xl font-semibold leading-none tracking-tight"
                            style={{
                              fontFamily: getFontFamilyCss(
                                candidate.displayTypeface
                              ),
                            }}
                          >
                            {brandInitialPair}
                          </span>
                          <span
                            className="text-xs font-medium tracking-wide mt-1.5 opacity-85 truncate max-w-[200px]"
                            style={{
                              fontFamily: getFontFamilyCss(
                                candidate.textTypeface
                              ),
                            }}
                          >
                            {businessName}
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono text-[11px] font-medium tracking-wider uppercase opacity-90 block">
                            {specimenSub}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* b) Four-swatch colour strip (28px tall, edge to edge) */}
                    <div className="grid grid-cols-4 h-7 w-full border-b border-border/40 shrink-0">
                      {palette.slice(0, 4).map((hex, i) => (
                        <div
                          key={i}
                          className="h-full w-full transition-opacity hover:opacity-90"
                          style={{ backgroundColor: hex }}
                          title={`Swatch ${i + 1}: ${hex}`}
                        />
                      ))}
                    </div>

                    {/* c) Body Area (20px padding) */}
                    <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4">
                      <div className="space-y-3">
                        {/* Heading & Active Selection Badge */}
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-lg font-heading font-semibold text-foreground tracking-tight">
                            {candidate.name}
                          </h3>
                          {isSelected && (
                            <span className="font-sans text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-wider">
                              ACTIVE SELECTION
                            </span>
                          )}
                        </div>

                        {/* Feel Line */}
                        <p className="text-sm font-sans text-muted-foreground leading-relaxed">
                          {candidate.feelLine}
                        </p>

                        {/* WHY THIS FITS section */}
                        <div className="pt-3 border-t border-border/50 space-y-1">
                          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground block">
                            WHY THIS FITS
                          </span>
                          <p className="text-[13px] font-sans text-foreground/80 leading-relaxed">
                            {candidate.rationale}
                          </p>
                        </div>
                      </div>

                      {/* d) Footer Row */}
                      <div className="flex items-center justify-between pt-3 border-t border-border/50">
                        {/* Font Pairing Badges */}
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-sans text-xs text-foreground bg-muted/60 px-2.5 py-1 rounded-md border border-border/60">
                            {candidate.displayTypeface}
                          </span>
                          <span className="text-muted-foreground text-xs font-sans">
                            +
                          </span>
                          <span className="font-sans text-xs text-foreground bg-muted/60 px-2.5 py-1 rounded-md border border-border/60">
                            {candidate.textTypeface}
                          </span>
                          <span className="sr-only">
                            {candidate.displayTypeface} + {candidate.textTypeface}
                          </span>
                        </div>

                        {/* Per-card action button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedKey(candidate.key);
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                          title={`Select ${candidate.name}`}
                        >
                          <RefreshCw className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Free "Adjust" Strip for Selected Candidate */}
          {selectedCandidate && (
            <div className="p-4 sm:p-5 rounded-xl bg-muted/20 border border-border/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="size-4 text-primary" />
                  <span className="font-heading text-xs font-bold text-foreground">
                    Fine-tune Selected Direction ({selectedCandidate.name})
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/20">
                    Free / No Credits
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                  Adjustments do not count against your 3/3 regenerate cap
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {/* Palette Variant */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-medium text-muted-foreground">
                    Palette Variant
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {["default", "vibrant", "muted"].map((variant) => (
                      <button
                        key={variant}
                        type="button"
                        onClick={() =>
                          setAdjustments((prev) => ({
                            ...prev,
                            paletteVariant: variant,
                          }))
                        }
                        className={`px-2 py-1 text-xs rounded border capitalize transition-colors ${
                          adjustments.paletteVariant === variant
                            ? "bg-primary text-primary-foreground border-primary font-medium"
                            : "bg-background border-border/80 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {variant}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contrast Position */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-medium text-muted-foreground">
                    Contrast Balance
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {["soft", "balanced", "high"].map((contrast) => (
                      <button
                        key={contrast}
                        type="button"
                        onClick={() =>
                          setAdjustments((prev) => ({
                            ...prev,
                            contrastPosition: contrast,
                          }))
                        }
                        className={`px-2 py-1 text-xs rounded border capitalize transition-colors ${
                          adjustments.contrastPosition === contrast
                            ? "bg-primary text-primary-foreground border-primary font-medium"
                            : "bg-background border-border/80 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {contrast}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type Weight */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-medium text-muted-foreground">
                    Display Weight
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {["regular", "medium", "bold"].map((weight) => (
                      <button
                        key={weight}
                        type="button"
                        onClick={() =>
                          setAdjustments((prev) => ({
                            ...prev,
                            typeWeight: weight,
                          }))
                        }
                        className={`px-2 py-1 text-xs rounded border capitalize transition-colors ${
                          adjustments.typeWeight === weight
                            ? "bg-primary text-primary-foreground border-primary font-medium"
                            : "bg-background border-border/80 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {weight}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-t border-border/60 bg-muted/20 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-sans">
              {selectedCandidate ? (
                <>
                  Selected:{" "}
                  <strong className="text-foreground font-semibold">
                    {selectedCandidate.name}
                  </strong>
                </>
              ) : (
                "Select a direction board above"
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="font-sans cursor-pointer"
            >
              Cancel
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={!selectedCandidate || isSubmitting || isGenerating}
              onClick={handleConfirm}
              className="gap-1.5 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 font-sans cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" />
                  <span>Confirming Direction...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" />
                  <span>
                    Use {selectedCandidate?.name || "Selected Direction"}
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
