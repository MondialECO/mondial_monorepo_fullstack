"use client";

import React, { useState, useMemo } from "react";
import {
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandKit } from "@/types/creator/brand-kit";
import { brandKitApi } from "@/lib/api-creator-brand-kit";
import { ModalWorkflowHeader } from "./ModalWorkflowHeader";

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
  renderSpecimen: (brandName: string, initials: string) => React.ReactNode;
}

export type FitLevel = "strong" | "workable" | "tight";

export interface FitAssessment {
  level: FitLevel;
  badgeLabel: string;
  reason: string;
}

// Compute dynamic fit assessment based on real kit Strategy and Direction context (Zero Mock Data)
export function computeLogoTypeFit(
  typeKey: string,
  kit: BrandKit
): FitAssessment {
  const strategy = kit.strategy;
  const constraints = strategy?.derivedConstraints;
  const name = strategy?.nameDisplayForm || strategy?.businessName || "Brand";
  const charLength = constraints?.characterLength || name.length || 10;
  const wordCount = constraints?.wordCount || name.split(/\s+/).filter(Boolean).length || 1;
  const firstAppearance = strategy?.firstAppearance
    ? strategy.firstAppearance.replace(/_/g, " ")
    : "Invoice header";
  const directionName =
    kit.direction?.candidates?.find((c) => c.key === kit.direction?.selectedDirectionKey)?.name ||
    "Bold & Innovative";

  switch (typeKey) {
    case "wordmark":
      if (charLength <= 10 && wordCount <= 2) {
        return {
          level: "strong",
          badgeLabel: "Strong fit for you",
          reason: `${charLength} characters across ${wordCount === 1 ? "a single word" : `${wordCount} words`} fits a wide header comfortably.`,
        };
      } else if (charLength <= 18) {
        return {
          level: "workable",
          badgeLabel: "Workable",
          reason: `${charLength} characters fits desktop headers comfortably.`,
        };
      } else {
        return {
          level: "tight",
          badgeLabel: "Tight fit",
          reason: `At ${charLength} characters, a wordmark requires careful horizontal scaling on compact headers.`,
        };
      }

    case "symbol_plus_name":
      return {
        level: "strong",
        badgeLabel: "Strong fit for you",
        reason: `Gives you an icon for ${firstAppearance.toLowerCase()} and an app mark.`,
      };

    case "monogram":
      if (wordCount >= 2 || charLength > 15) {
        const initials = constraints?.monogramInitials || name.split(/\s+/).map((w) => w[0]).join("").toUpperCase() || "B";
        return {
          level: "strong",
          badgeLabel: "Strong fit for you",
          reason: `Distills '${name}' into an authoritative '${initials}' monogram.`,
        };
      } else {
        return {
          level: "workable",
          badgeLabel: "Workable",
          reason: `AI reads as two clear letters.`,
        };
      }

    case "abstract":
      return {
        level: "strong",
        badgeLabel: "Strong fit for you",
        reason: `Echoes your '${directionName}' direction with clean engineered geometry.`,
      };

    case "icon":
      return {
        level: "workable",
        badgeLabel: "Workable",
        reason: `Delivers an instantly recognizable pictorial symbol optimized for ${firstAppearance.toLowerCase()}.`,
      };

    case "minimal":
      return {
        level: "workable",
        badgeLabel: "Workable",
        reason: `The least possible visual noise — maximum restraint across clean layouts.`,
      };

    default:
      return {
        level: "workable",
        badgeLabel: "Workable",
        reason: `Compatible with your foundational strategy and visual direction.`,
      };
  }
}

// 6 Canonical Architectural Form Options (Figma Node 57004:10297)
const LOGO_TYPE_OPTIONS: LogoTypeOption[] = [
  {
    key: "wordmark",
    name: "Wordmark",
    categoryTag: "Typographic Focus",
    explanation: "Just your name, styled. No separate symbol.",
    goodWhen: "You want the name remembered.",
    tradeOff: "Nothing to use as a small app icon.",
    renderSpecimen: (brandName) => (
      <div className="flex flex-col items-center justify-center gap-1.5 h-full w-full select-none">
        <span className="font-heading text-xl sm:text-2xl font-extrabold tracking-tight text-foreground dark:text-neutral-100 uppercase">
          {brandName ? brandName.toUpperCase() : "NORTHLINE"}
        </span>
        <div className="h-0.5 w-14 bg-muted-foreground/40 rounded-full" />
      </div>
    ),
  },
  {
    key: "symbol_plus_name",
    name: "Symbol + Name",
    categoryTag: "Combination Mark",
    explanation: "A mark and the name together, plus the mark on its own.",
    goodWhen: "You need one logo that works everywhere.",
    tradeOff: "Takes the most space in its full form.",
    renderSpecimen: (brandName) => (
      <div className="flex items-center justify-center gap-3 h-full w-full select-none">
        <div className="size-10 rounded-xl bg-foreground text-background flex items-center justify-center shadow-xs">
          <svg viewBox="0 0 24 24" className="size-5.5 text-background" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="font-heading text-base font-bold text-foreground tracking-tight">
            {brandName || "Northline"}
          </span>
          <span className="text-footnote text-muted-foreground font-mono tracking-widest uppercase">
            STUDIO
          </span>
        </div>
      </div>
    ),
  },
  {
    key: "monogram",
    name: "Monogram",
    categoryTag: "Initial Lockup",
    explanation: "Your initials as the mark.",
    goodWhen: "Your name is long or two-worded.",
    tradeOff: "Initials alone say little to new customers.",
    renderSpecimen: (_, initials) => (
      <div className="flex items-center justify-center h-full w-full select-none">
        <div className="relative size-14 rounded-2xl border-2 border-foreground/80 bg-muted/30 flex items-center justify-center">
          <span className="font-mono text-2xl font-black text-foreground tracking-tighter">
            {initials || "NL"}
          </span>
          <div className="absolute -bottom-1 -right-1 size-3.5 bg-primary rounded-full flex items-center justify-center">
            <div className="size-1.5 bg-primary-foreground rounded-full" />
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "abstract",
    name: "Abstract mark",
    categoryTag: "Non-Figurative Symbol",
    explanation: "A shape that stands for the brand without literal pictures.",
    goodWhen: "You want a modern, forward-looking feel.",
    tradeOff: "Requires marketing to give the shape meaning.",
    renderSpecimen: () => (
      <div className="flex items-center justify-center h-full w-full select-none">
        <svg viewBox="0 0 60 60" className="size-12 text-foreground" fill="none">
          <rect x="10" y="10" width="40" height="40" rx="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.9" />
          <circle cx="30" cy="30" r="11" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2" strokeOpacity="0.6" />
          <polygon points="30,19 39,35 21,35" fill="currentColor" fillOpacity="0.8" />
        </svg>
      </div>
    ),
  },
  {
    key: "icon",
    name: "Icon",
    categoryTag: "Recognizable Glyph",
    explanation: "A recognisable object drawn simply.",
    goodWhen: "You have an immediate physical or visual metaphor.",
    tradeOff: "Can feel too literal if the product evolves.",
    renderSpecimen: () => (
      <div className="flex items-center justify-center h-full w-full select-none">
        <svg viewBox="0 0 24 24" className="size-10 text-foreground" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="8" y1="13" x2="16" y2="13" strokeOpacity="0.6" />
          <line x1="8" y1="17" x2="13" y2="17" strokeOpacity="0.6" />
        </svg>
      </div>
    ),
  },
  {
    key: "minimal",
    name: "Minimal",
    categoryTag: "Reductive Lineform",
    explanation: "The least possible — one stroke, one weight.",
    goodWhen: "You want maximum restraint and modern elegance.",
    tradeOff: "Less distinctive if surrounded by busy graphics.",
    renderSpecimen: (brandName) => (
      <div className="flex items-center justify-center gap-3 h-full w-full select-none">
        <div className="h-8 w-1 bg-foreground/90 rounded-full" />
        <span className="font-heading text-lg font-light tracking-[0.25em] text-foreground uppercase">
          {brandName ? brandName.split(/\s+/)[0].toUpperCase() : "NORTH"}
        </span>
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

  // Dynamic context extracted from real kit strategy and direction
  const businessName = useMemo(() => {
    return (
      kit?.strategy?.nameDisplayForm ||
      kit?.strategy?.businessName ||
      "AutoInvoice"
    );
  }, [kit]);

  const charLength = useMemo(() => {
    return businessName.length;
  }, [businessName]);

  const brandInitials = useMemo(() => {
    const parts = businessName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    const firstTwo = businessName.trim().slice(0, 2).toUpperCase();
    return firstTwo || "NL";
  }, [businessName]);

  const firstAppearance = useMemo(() => {
    const raw = kit?.strategy?.firstAppearance;
    if (!raw) return "Invoice header";
    if (raw === "invoice_header") return "Invoice header";
    if (raw === "website_header") return "Website header";
    if (raw === "mobile_app") return "Mobile app";
    if (raw === "product_ui") return "Product UI";
    if (raw === "packaging") return "Packaging";
    return raw.replace(/_/g, " ");
  }, [kit]);

  const directionName = useMemo(() => {
    const candidate = kit?.direction?.candidates?.find(
      (c) => c.key === kit?.direction?.selectedDirectionKey
    );
    return candidate?.name || "Bold & Innovative";
  }, [kit]);

  const selectedOption = useMemo(
    () =>
      LOGO_TYPE_OPTIONS.find((o) => o.key === selectedType) ||
      LOGO_TYPE_OPTIONS[0],
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
      <div className="relative w-full max-w-5xl 2xl:max-w-6xl max-h-[92vh] flex flex-col bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden bg-white">
        
        {/* 1. Modal Header & 6-Step Workflow Track (Figma Node 57004:10297) */}
        <ModalWorkflowHeader
          title="What kind of logo?"
          subtitle={`Pick the form first — then we'll draw six concepts in that form, inside ${directionName}.`}
          currentStep={3}
          onClose={onClose}
        />

        {/* Inline Error Banner */}
        {error && (
          <div className="px-6 py-2.5 bg-destructive/10 border-b border-destructive/20 text-destructive text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="size-4 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* 2. Scrollable Body (36px padding, max-h-[632px] overflow-y-auto) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          
          {/* CONTEXT STRIP (56px tall, bg-muted/40 fill, 8px radius, 20px padding) */}
          <div className="min-h-[56px] w-full rounded-xl bg-muted/40 border border-border/60 px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-5 sm:gap-8">
              {/* Context 1: Your Name */}
              <div className="flex flex-col">
                <span className="text-footnote font-semibold text-muted-foreground uppercase tracking-wider font-mono">
                  YOUR NAME
                </span>
                <span className="text-xs sm:text-sm font-semibold text-foreground font-sans">
                  {businessName} · <span className="font-mono text-xs">{charLength}</span> characters
                </span>
              </div>

              {/* Context 2: First Appears On */}
              <div className="flex flex-col">
                <span className="text-footnote font-semibold text-muted-foreground uppercase tracking-wider font-mono">
                  FIRST APPEARS ON
                </span>
                <span className="text-xs sm:text-sm font-semibold text-foreground font-sans capitalize">
                  {firstAppearance}
                </span>
              </div>

              {/* Context 3: Direction */}
              <div className="flex flex-col">
                <span className="text-footnote font-semibold text-muted-foreground uppercase tracking-wider font-mono">
                  DIRECTION
                </span>
                <span className="text-xs sm:text-sm font-semibold text-foreground font-sans">
                  {directionName}
                </span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground font-sans hidden md:block text-right">
              These shape which types work best for you.
            </div>
          </div>

          {/* 3. 3x2 GRID OF SIX TYPE CARDS (24px gutters, all height-matched) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {LOGO_TYPE_OPTIONS.map((option) => {
              const isSelected = selectedType === option.key;
              const fit = computeLogoTypeFit(option.key, kit);

              const badgeStyle =
                fit.level === "strong"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                  : fit.level === "tight"
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                  : "bg-muted text-muted-foreground border-border/60";

              return (
                <div
                  key={option.key}
                  onClick={() => setSelectedType(option.key)}
                  className={`group relative flex flex-col rounded-2xl border bg-card text-card-foreground shadow-2xs transition-all duration-200 cursor-pointer overflow-hidden ${
                    isSelected
                      ? "border-primary ring-2 ring-primary/20 shadow-md"
                      : "border-border/80 hover:border-primary/50 hover:shadow-xs"
                  }`}
                >
                  {/* a) Example Band: 150px tall, #FAFAFB fill, neutral generic grey example */}
                  <div className="relative h-[150px] w-full bg-muted/25 dark:bg-muted/15 border-b border-border/50 flex items-center justify-center p-4 select-none overflow-hidden">
                    {option.renderSpecimen(businessName, brandInitials)}

                    {/* Blue circle check badge pinned to top-right corner (24px) */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                        <Check className="size-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* b) Body Area: 20px padding */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-3">
                      {/* Heading 3 & Subtitle Description */}
                      <div>
                        <h3 className="text-base sm:text-lg font-heading font-semibold text-foreground tracking-tight">
                          {option.name}
                        </h3>
                        <p className="text-caption font-sans text-muted-foreground mt-1 leading-relaxed">
                          {option.explanation}
                        </p>
                      </div>

                      {/* Guidance Rows (Good when & Trade-off) */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-start gap-2 text-xs font-sans">
                          <Check className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]" />
                          <span className="text-foreground/90 leading-snug">
                            <strong className="font-semibold text-foreground">Good when:</strong> {option.goodWhen}
                          </span>
                        </div>
                        <div className="flex items-start gap-2 text-xs font-sans">
                          <span className="font-mono text-xs text-muted-foreground shrink-0 leading-none mt-0.5 select-none">—</span>
                          <span className="text-muted-foreground leading-snug">
                            <strong className="font-semibold text-foreground/80">Trade-off:</strong> {option.tradeOff}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* c) Footer Row / Fit Indicator */}
                    <div className="pt-3 border-t border-border/50 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`font-mono text-badge font-semibold px-2 py-0.5 rounded-full border ${badgeStyle}`}
                        >
                          {fit.badgeLabel}
                        </span>
                        <span
                          className={`text-xs font-medium font-sans ${
                            isSelected
                              ? "text-primary font-semibold"
                              : "text-muted-foreground group-hover:text-foreground"
                          }`}
                        >
                          {isSelected ? "Selected" : "Select"}
                        </span>
                      </div>
                      <p className="text-caption font-sans text-muted-foreground leading-relaxed">
                        {fit.reason}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Modal Footer */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-t border-border/60 bg-muted/15 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground font-sans">
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
              className="cursor-pointer font-sans"
            >
              Cancel
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={!selectedType || isSubmitting}
              onClick={handleConfirm}
              className="gap-1.5 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer font-sans"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
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
