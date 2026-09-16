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

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<{
    type: "credits" | "cap" | "network";
    message: string;
  } | null>(null);

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

  // Selected Candidate object
  const selectedCandidate = useMemo(() => {
    return (
      candidates.find((c) => c.key === selectedKey) ||
      candidates[0] ||
      null
    );
  }, [candidates, selectedKey]);

  // Derive single letterform initial for abstract specimen
  const brandInitial = useMemo(() => {
    const name =
      kit?.strategy?.nameDisplayForm ||
      kit?.strategy?.businessName ||
      "M";
    return name.trim().charAt(0).toUpperCase() || "M";
  }, [kit]);

  // Generate / Regenerate Candidates (Costs 7 credits, capped at 3)
  const handleGenerate = async () => {
    if (isGenerating || isCapExhausted) return;
    setIsGenerating(true);
    setError(null);

    try {
      const updatedKit = await brandKitApi.generateDirections(
        ideaId,
        currentKit?.version ?? kit?.version
      );
      if (updatedKit) {
        setCurrentKit(updatedKit);
        if (updatedKit.direction?.candidates) {
          setCandidates(updatedKit.direction.candidates);
          setSelectedKey(
            updatedKit.direction.selectedDirectionKey ||
              updatedKit.direction.candidates[0]?.key ||
              ""
          );
          setRegenerateCount(updatedKit.direction.regenerateCount || 0);
        }
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Generation failed. Please try again.";

      if (status === 402) {
        setError({
          type: "credits",
          message: "Insufficient AI credits (7 credits required).",
        });
      } else if (status === 400 && msg.toLowerCase().includes("limit")) {
        setError({
          type: "cap",
          message: "Maximum regeneration limit (3/3) reached.",
        });
      } else {
        setError({
          type: "network",
          message: msg,
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
      onClose();
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
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header & 6-Step Workflow Track (Figma Node 57003:9812) */}
        <ModalWorkflowHeader
          title="Select Your Visual Direction"
          subtitle="Four visual concepts with curated type pairings, color roles, and brand tone."
          currentStep={2}
          onClose={onClose}
          headerActions={
            <div className="flex items-center gap-2 bg-background border border-border/80 rounded-xl p-1 px-2.5 shadow-2xs">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isGenerating || isCapExhausted}
                onClick={handleGenerate}
                className="h-7 px-2 text-xs font-medium gap-1.5 hover:bg-muted text-foreground disabled:opacity-50 font-sans cursor-pointer"
                title={
                  isCapExhausted
                    ? "Regeneration cap reached (3/3)"
                    : `Regenerate all 4 directions (7 credits, ${remainingCap} left)`
                }
              >
                <RefreshCw
                  className={`size-3.5 ${isGenerating ? "animate-spin" : ""}`}
                />
                <span>Regenerate all four</span>
              </Button>

              <div className="h-4 w-px bg-border/60" />

              {/* 7 credits chip */}
              <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                <Sparkles className="size-2.5" />
                7 CREDITS
              </span>

              {/* Cap Badge */}
              <RegenerateCapBadge usedCount={regenerateCount} maxCount={3} />
            </div>
          }
        />

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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Loading Skeleton during initial generation */}
          {isGenerating && candidates.length === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 min-h-[440px] items-center justify-center text-center p-12">
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

          {/* 2x2 Direction Boards Grid */}
          {candidates.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {candidates.map((candidate) => {
                const isSelected = selectedKey === candidate.key;
                const palette = candidate.colorPalette || ["#111827", "#3B82F6", "#93C5FD", "#F3F4F6"];
                const baseTone = palette[0] || "#1e293b";
                const accentTone = palette[1] || palette[2] || "#3b82f6";
                const lightTone = palette[3] || palette[2] || "#f8fafc";

                // Adjusted weight for preview if this card is selected
                const fontDisplayWeight =
                  isSelected && adjustments.typeWeight === "bold"
                    ? "700"
                    : isSelected && adjustments.typeWeight === "regular"
                    ? "400"
                    : "600";

                return (
                  <div
                    key={candidate.key}
                    onClick={() => setSelectedKey(candidate.key)}
                    className={`group relative flex flex-col rounded-xl border bg-card text-card-foreground shadow-xs transition-all duration-200 cursor-pointer overflow-hidden ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/20 shadow-md"
                        : "border-border/80 hover:border-primary/50 hover:shadow-sm"
                    }`}
                  >
                    {/* Abstract Specimen Preview Band (Abstract style specimen ONLY — NO logos, NO wordmarks) */}
                    <div
                      className="relative h-36 w-full flex items-center justify-between p-5 overflow-hidden border-b border-border/40 select-none"
                      style={{
                        backgroundColor: baseTone,
                        color: lightTone,
                      }}
                    >
                      {/* Abstract Background Motif */}
                      <div className="absolute right-2 top-0 bottom-0 w-36 pointer-events-none flex items-center justify-center">
                        <AbstractMotifSpecimen
                          motifKey={candidate.motifKey}
                          accentColor={accentTone}
                          baseColor={lightTone}
                        />
                      </div>

                      {/* Large Abstract Letterform Specimen */}
                      <div className="relative z-10 flex flex-col justify-between h-full">
                        <span
                          className="text-4xl sm:text-5xl tracking-tight leading-none"
                          style={{
                            fontFamily: getFontFamilyCss(candidate.displayTypeface),
                            fontWeight: fontDisplayWeight,
                          }}
                        >
                          {brandInitial}
                        </span>

                        {/* Abstract Type Sample Phrase */}
                        <span
                          className="text-[11px] opacity-85 tracking-normal line-clamp-1"
                          style={{
                            fontFamily: getFontFamilyCss(candidate.textTypeface),
                          }}
                        >
                          Aa Bb Gg 123 • {candidate.name}
                        </span>
                      </div>

                      {/* Top Right Selection Badge */}
                      <div
                        className={`size-6 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-sm scale-100"
                            : "bg-black/30 text-white/50 border border-white/20 opacity-0 group-hover:opacity-100 scale-90"
                        }`}
                      >
                        <Check className="size-3.5 stroke-[3]" />
                      </div>
                    </div>

                    {/* 4-Swatch Color Strip */}
                    <div className="grid grid-cols-4 h-5 w-full border-b border-border/40">
                      {palette.slice(0, 4).map((hex, i) => (
                        <div
                          key={i}
                          className="h-full w-full transition-opacity hover:opacity-85"
                          style={{ backgroundColor: hex }}
                          title={`Color swatch: ${hex}`}
                        />
                      ))}
                    </div>

                    {/* Board Content Details */}
                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        {/* Title & Type Pairing Tags */}
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <h3 className="text-base font-heading font-bold text-foreground tracking-tight">
                            {candidate.name}
                          </h3>
                          <span className="font-mono text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/40 shrink-0">
                            {candidate.displayTypeface} + {candidate.textTypeface}
                          </span>
                        </div>

                        {/* Feel Line */}
                        <p className="text-xs font-medium text-foreground/90 leading-relaxed mb-2.5">
                          {candidate.feelLine}
                        </p>

                        {/* "Why this fits" Rationale */}
                        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40">
                          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground block mb-0.5">
                            Why this fits
                          </span>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {candidate.rationale}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Selection Status */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                        <span className="font-mono text-[10px] text-muted-foreground">
                          Motif: {candidate.motifKey?.replace(/_/g, " ")}
                        </span>
                        <span
                          className={`font-semibold text-xs ${
                            isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                          }`}
                        >
                          {isSelected ? "Active Selection" : "Click to Select"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Free "Adjust" Strip for Selected Candidate */}
          {selectedCandidate && (
            <div className="p-4 rounded-xl bg-muted/20 border border-border/60 space-y-3">
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
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/60 bg-muted/20 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
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
            >
              Cancel
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={!selectedCandidate || isSubmitting || isGenerating}
              onClick={handleConfirm}
              className="gap-1.5 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
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
