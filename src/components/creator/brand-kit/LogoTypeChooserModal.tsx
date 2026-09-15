"use client";

import React, { useState, useMemo } from "react";
import {
  Compass,
  Check,
  CheckCircle2,
  X,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Layers,
  FileText,
  Smartphone,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandKit } from "@/types/creator/brand-kit";
import { brandKitApi } from "@/lib/api-creator-brand-kit";

export interface LogoTypeChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
  ideaId?: string;
  kit: BrandKit;
  onSuccess: (updatedKit: BrandKit) => void;
}

export interface LogoTypeOption {
  key: string;
  name: string;
  categoryTag: string;
  explanation: string;
  goodWhen: string;
  tradeOff: string;
  renderSpecimen: () => React.ReactNode;
}

export type FitLevel = "strong" | "workable" | "tight";

export interface FitAssessment {
  level: FitLevel;
  badgeLabel: string;
  reason: string;
}

// Compute dynamic fit assessment based on real kit Strategy and Direction context
export function computeLogoTypeFit(
  typeKey: string,
  kit: BrandKit
): FitAssessment {
  const strategy = kit.strategy;
  const constraints = strategy?.derivedConstraints;
  const name = strategy?.nameDisplayForm || strategy?.businessName || "Brand";
  const charLength = constraints?.characterLength || name.length || 10;
  const wordCount = constraints?.wordCount || name.split(/\s+/).filter(Boolean).length || 1;
  const isIconViable = constraints?.isIconOnlyViable ?? true;
  const firstAppearance = strategy?.firstAppearance || "website";
  const directionName =
    kit.direction?.candidates?.find((c) => c.key === kit.direction?.selectedDirectionKey)?.name ||
    "Selected Direction";

  switch (typeKey) {
    case "wordmark":
      if (charLength <= 14 && wordCount <= 2) {
        return {
          level: "strong",
          badgeLabel: "Strong fit for you",
          reason: `At ${charLength} characters across ${wordCount === 1 ? "a single word" : `${wordCount} words`}, a clean typographic wordmark delivers instant, punchy brand clarity.`,
        };
      } else if (charLength <= 20) {
        return {
          level: "workable",
          badgeLabel: "Workable",
          reason: `At ${charLength} characters, a wordmark remains legible on desktop headers but requires tracked kerning for smaller screen displays.`,
        };
      } else {
        return {
          level: "tight",
          badgeLabel: "Tight fit",
          reason: `At ${charLength} characters across ${wordCount} words, a standalone wordmark risks becoming unwieldy at compact mobile and favicon scales.`,
        };
      }

    case "symbol_plus_name":
      return {
        level: "strong",
        badgeLabel: "Strong fit for you",
        reason: `Pairs a distinctive standalone mark with your ${charLength}-character name, providing maximum flexibility across ${firstAppearance.replace(/_/g, " ")} and documentation.`,
      };

    case "monogram":
      if (wordCount >= 2 || charLength > 15) {
        const initials = constraints?.monogramInitials || name.split(/\s+/).map((w) => w[0]).join("").toUpperCase() || "B";
        return {
          level: "strong",
          badgeLabel: "Strong fit for you",
          reason: `Distills '${name}' into an authoritative '${initials}' monogram, solving small-scale avatar and mobile icon constraints effortlessly.`,
        };
      } else {
        return {
          level: "workable",
          badgeLabel: "Workable",
          reason: `A single-letter monogram is viable, though short names (${charLength} chars) rarely require severe abbreviation.`,
        };
      }

    case "abstract":
      if (
        directionName.toLowerCase().includes("precision") ||
        directionName.toLowerCase().includes("structure") ||
        directionName.toLowerCase().includes("vitality")
      ) {
        return {
          level: "strong",
          badgeLabel: "Strong fit for you",
          reason: `Echoes your '${directionName}' direction with engineered geometric structure without figurative clichés.`,
        };
      }
      return {
        level: "workable",
        badgeLabel: "Workable",
        reason: `Provides modern geometric distinction that pairs neatly with your business positioning.`,
      };

    case "icon":
      if (isIconViable || firstAppearance === "mobile_app" || firstAppearance === "product_ui") {
        return {
          level: "strong",
          badgeLabel: "Strong fit for you",
          reason: `Delivers an instantly recognizable pictorial symbol optimized for 16px to 32px UI scaling across ${firstAppearance.replace(/_/g, " ")}.`,
        };
      }
      return {
        level: "workable",
        badgeLabel: "Workable",
        reason: `Offers clear symbolic storytelling alongside your primary typography.`,
      };

    case "minimal":
      if (strategy?.tonePosition === "minimal" || directionName.toLowerCase().includes("editorial")) {
        return {
          level: "strong",
          badgeLabel: "Strong fit for you",
          reason: `Understated precision lineform providing maximum clarity across print and digital media with zero visual noise.`,
        };
      }
      return {
        level: "workable",
        badgeLabel: "Workable",
        reason: `Clean reductive aesthetic offering balanced, modern corporate restraint.`,
      };

    default:
      return {
        level: "workable",
        badgeLabel: "Workable",
        reason: `Compatible with your foundational strategy and brand positioning.`,
      };
  }
}

// 6 Canonical Architectural Form Options (Generic Greyscale ONLY)
const LOGO_TYPE_OPTIONS: LogoTypeOption[] = [
  {
    key: "wordmark",
    name: "Wordmark",
    categoryTag: "Typographic Focus",
    explanation: "A standalone typographic mark where the business name itself forms the primary visual identity.",
    goodWhen: "Distinctive, punchy names where direct name recognition is paramount.",
    tradeOff: "Lacks an independent symbol for standalone app icons and favicons.",
    renderSpecimen: () => (
      <div className="flex flex-col items-center justify-center gap-1.5 h-full w-full">
        <span className="font-mono text-xl sm:text-2xl font-bold tracking-[0.2em] text-neutral-900 select-none">
          NORTHLINE
        </span>
        <div className="h-0.5 w-16 bg-neutral-400 rounded-full"></div>
      </div>
    ),
  },
  {
    key: "symbol_plus_name",
    name: "Symbol + Name",
    categoryTag: "Combination Mark",
    explanation: "A balanced lockup pairing an independent symbol mark alongside the business name typography.",
    goodWhen: "Modular ecosystems requiring both a full header lockup and an isolated icon.",
    tradeOff: "Requires strict spacing guidelines to prevent visual crowding.",
    renderSpecimen: () => (
      <div className="flex items-center justify-center gap-3 h-full w-full select-none">
        <div className="size-10 rounded-xl bg-neutral-900 flex items-center justify-center shadow-xs">
          <svg viewBox="0 0 24 24" className="size-5.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="font-mono text-base font-bold text-neutral-900 tracking-wider">
            NORTHLINE
          </span>
          <span className="text-[10px] text-neutral-500 font-mono tracking-widest uppercase">
            SOLUTIONS
          </span>
        </div>
      </div>
    ),
  },
  {
    key: "monogram",
    name: "Monogram",
    categoryTag: "Initial Lockup",
    explanation: "An interconnected or framed composition created from the primary initials of the business name.",
    goodWhen: "Multi-word or longer names that need compact distillation in avatars and favicons.",
    tradeOff: "Requires repeated market exposure before audiences link the initials to the full name.",
    renderSpecimen: () => (
      <div className="flex items-center justify-center h-full w-full select-none">
        <div className="relative size-14 rounded-2xl border-2 border-neutral-900 bg-neutral-100 flex items-center justify-center">
          <span className="font-mono text-2xl font-black text-neutral-900 tracking-tighter">
            NL
          </span>
          <div className="absolute -bottom-1 -right-1 size-3.5 bg-neutral-900 rounded-full flex items-center justify-center">
            <div className="size-1.5 bg-white rounded-full"></div>
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "abstract",
    name: "Geometric Abstract",
    categoryTag: "Non-Figurative Symbol",
    explanation: "A conceptual, non-representational geometric form communicating precision, technology, or momentum.",
    goodWhen: "Modern tech, finance, and infrastructure brands seeking high distinctiveness without figurative clichés.",
    tradeOff: "Relies on consistent strategic storytelling to build metaphorical meaning.",
    renderSpecimen: () => (
      <div className="flex items-center justify-center h-full w-full select-none">
        <svg viewBox="0 0 60 60" className="size-12" fill="none">
          <rect x="10" y="10" width="40" height="40" rx="8" stroke="#18181B" strokeWidth="2.5" />
          <circle cx="30" cy="30" r="12" stroke="#71717A" strokeWidth="2" strokeDasharray="3 2" />
          <polygon points="30,18 40,36 20,36" fill="#18181B" />
        </svg>
      </div>
    ),
  },
  {
    key: "icon",
    name: "Minimal Pictorial / Icon",
    categoryTag: "Recognizable Glyph",
    explanation: "A stylized visual metaphor conveying core functionality (e.g. shield, leaf, node, gateway) with high legibility.",
    goodWhen: "Brands centered around a clear physical or digital concept with high user recognition.",
    tradeOff: "Risk of industry clichés if the metaphor is not given a unique geometric twist.",
    renderSpecimen: () => (
      <div className="flex items-center justify-center h-full w-full select-none">
        <div className="size-12 rounded-full border border-neutral-300 bg-neutral-50 flex items-center justify-center shadow-2xs">
          <svg viewBox="0 0 24 24" className="size-6 text-neutral-900" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
      </div>
    ),
  },
  {
    key: "minimal",
    name: "Minimal Lineform",
    categoryTag: "Reductive Geometry",
    explanation: "An ultra-clean single-weight line structure stripped of all decorative embellishment.",
    goodWhen: "High-end, architectural, and editorial brands prioritizing timeless subtlety and restraint.",
    tradeOff: "Can feel too understated if the surrounding typography lacks character.",
    renderSpecimen: () => (
      <div className="flex items-center justify-center h-full w-full select-none">
        <svg viewBox="0 0 60 60" className="size-12" fill="none" stroke="#18181B" strokeWidth="2">
          <line x1="12" y1="30" x2="48" y2="30" strokeWidth="3" />
          <circle cx="30" cy="30" r="18" strokeDasharray="4 2" />
          <line x1="30" y1="12" x2="30" y2="48" />
        </svg>
      </div>
    ),
  },
];

export function LogoTypeChooserModal({
  isOpen,
  onClose,
  ideaId,
  kit,
  onSuccess,
}: LogoTypeChooserModalProps) {
  const initialType = kit?.logo?.logoType || "symbol_plus_name";
  const [selectedType, setSelectedType] = useState<string>(initialType);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Strategy & Context Metadata
  const strategy = kit?.strategy;
  const constraints = strategy?.derivedConstraints;
  const businessName =
    strategy?.nameDisplayForm || strategy?.businessName || "Brand";
  const charLength = constraints?.characterLength || businessName.length || 10;
  const wordCount = constraints?.wordCount || businessName.split(/\s+/).filter(Boolean).length || 1;
  const firstAppearance = strategy?.firstAppearance || "website";
  const directionName =
    kit?.direction?.candidates?.find(
      (c) => c.key === kit?.direction?.selectedDirectionKey
    )?.name || "Selected Direction";

  const selectedOption = useMemo(
    () => LOGO_TYPE_OPTIONS.find((opt) => opt.key === selectedType) || LOGO_TYPE_OPTIONS[1],
    [selectedType]
  );

  const handleConfirm = async () => {
    if (!selectedType || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const updatedKit = await brandKitApi.patchLogo(
        {
          logoType: selectedType,
        },
        ideaId,
        kit?.version
      );

      onSuccess(updatedKit);
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save logo type selection."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden bg-white">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Compass className="size-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-semibold text-primary uppercase tracking-wider">
                  STEP 3 OF 7
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs font-medium text-muted-foreground">
                  Architectural Mark Form
                </span>
              </div>
              <h2 className="text-lg font-heading font-bold text-foreground">
                Choose Your Logo Type Archetype
              </h2>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Top Context Strip: Real Strategy & Direction Data */}
        <div className="px-6 py-3 bg-muted/30 border-b border-border/60 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Brand:</span>
            <span className="font-semibold text-foreground font-heading">
              {businessName}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground bg-background px-2 py-0.5 rounded border border-border/60">
              {charLength} chars • {wordCount} {wordCount === 1 ? "word" : "words"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Globe className="size-3.5 text-primary" />
              <span>Target: <strong className="text-foreground capitalize">{firstAppearance.replace(/_/g, " ")}</strong></span>
            </div>
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Layers className="size-3.5 text-primary" />
              <span>Direction: <strong className="text-foreground">{directionName}</strong></span>
            </div>
          </div>
        </div>

        {/* Inline Error Alert */}
        {error && (
          <div className="px-6 py-2.5 bg-destructive/10 border-b border-destructive/20 text-destructive text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="size-4 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* 3x2 Grid of Six Type Cards */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
            {LOGO_TYPE_OPTIONS.map((option) => {
              const isSelected = selectedType === option.key;
              const fit = computeLogoTypeFit(option.key, kit);

              let badgeStyle = "bg-muted text-muted-foreground border-border/60";
              if (fit.level === "strong") {
                badgeStyle = "bg-emerald-500/10 text-emerald-700 border-emerald-500/25";
              } else if (fit.level === "tight") {
                badgeStyle = "bg-amber-500/10 text-amber-700 border-amber-500/25";
              }

              return (
                <div
                  key={option.key}
                  onClick={() => setSelectedType(option.key)}
                  className={`group relative flex flex-col rounded-xl border bg-card text-card-foreground shadow-2xs transition-all duration-200 cursor-pointer overflow-hidden ${
                    isSelected
                      ? "border-primary ring-2 ring-primary/20 shadow-md"
                      : "border-border/80 hover:border-primary/50 hover:shadow-xs"
                  }`}
                >
                  {/* Generic Greyscale Specimen Box (NO real brand name, NO color) */}
                  <div className="relative h-28 w-full bg-neutral-100 border-b border-border/50 flex items-center justify-center p-3 select-none">
                    {option.renderSpecimen()}

                    {/* Top Right Check Badge */}
                    <div
                      className={`absolute top-2.5 right-2.5 size-5.5 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-primary text-white shadow-xs scale-100"
                          : "bg-black/20 text-white/50 border border-white/40 opacity-0 group-hover:opacity-100 scale-90"
                      }`}
                    >
                      <Check className="size-3 stroke-[3]" />
                    </div>
                  </div>

                  {/* Card Content Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      {/* Title & Category */}
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-sm font-heading font-bold text-foreground tracking-tight">
                          {option.name}
                        </h3>
                        <span className="font-mono text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/40">
                          {option.categoryTag}
                        </span>
                      </div>

                      {/* Plain-Language Explanation */}
                      <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                        {option.explanation}
                      </p>

                      {/* Good When & Trade-off */}
                      <div className="space-y-1.5 text-[11px] mb-3">
                        <div className="flex items-start gap-1.5">
                          <span className="font-mono text-[10px] font-semibold text-emerald-600 shrink-0">
                            GOOD WHEN:
                          </span>
                          <span className="text-muted-foreground leading-tight">
                            {option.goodWhen}
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="font-mono text-[10px] font-semibold text-amber-600 shrink-0">
                            TRADE-OFF:
                          </span>
                          <span className="text-muted-foreground leading-tight">
                            {option.tradeOff}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Fit Indicator & Rationale */}
                    <div className="pt-2 border-t border-border/50">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeStyle}`}
                        >
                          {fit.badgeLabel}
                        </span>
                        <span
                          className={`text-[11px] font-medium ${
                            isSelected ? "text-primary font-semibold" : "text-muted-foreground group-hover:text-foreground"
                          }`}
                        >
                          {isSelected ? "Selected" : "Select"}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        {fit.reason}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/60 bg-muted/20 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Selected Type:{" "}
              <strong className="text-foreground font-semibold">
                {selectedOption.name}
              </strong>
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
              disabled={!selectedType || isSubmitting}
              onClick={handleConfirm}
              className="gap-1.5 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Compass className="size-3.5 animate-spin" />
                  <span>Saving Type...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" />
                  <span>Use {selectedOption.name}</span>
                </>
              )}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
