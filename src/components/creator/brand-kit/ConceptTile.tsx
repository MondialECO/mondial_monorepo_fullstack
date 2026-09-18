"use client";

import React, { memo } from "react";
import { Check, RefreshCw, AlertCircle, ArrowUpRight, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogoConcept, formatConceptTitle } from "@/types/creator/brand-kit";
import { resolveMediaUrl } from "@/lib/brand-kit-media";
import { InvoiceMockHeader } from "./InvoiceMockHeader";
import { MicroScaleViewer } from "./MicroScaleViewer";
import Link from "next/link";

export interface ConceptTileProps {
  concept: BrandLogoConcept;
  index: number;
  isSelected: boolean;
  isRegenerating: boolean;
  error: { type: "cap" | "credits" | "network"; message: string } | null;
  viewMode: "mark" | "invoice" | "16px";
  businessName?: string;
  onSelect: () => void;
  onRegenerate: () => void;
  isCompareMode: boolean;
  isCompareSelected: boolean;
  onToggleCompare: () => void;
  onInspect?: () => void;
  disabled?: boolean;
}

export const ConceptTile = memo(function ConceptTile({
  concept,
  index,
  isSelected,
  isRegenerating,
  error,
  viewMode,
  businessName = "Brand",
  onSelect,
  onRegenerate,
  isCompareMode,
  isCompareSelected,
  onToggleCompare,
  onInspect,
  disabled = false,
}: ConceptTileProps) {
  const maxRegens = 3;
  const used = concept.regenerateCount ?? 0;
  const remaining = Math.max(0, maxRegens - used);
  const isExhausted = remaining === 0;

  const conceptTag = `CONCEPT 0${index + 1}`;
  const descriptor =
    concept.descriptorLine ||
    concept.parameters?.descriptor ||
    "Parametric vector concept mark";

  return (
    <div
      onClick={() => {
        if (isCompareMode) {
          onToggleCompare();
        } else {
          onSelect();
        }
      }}
      className={`group relative flex flex-col justify-between rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden min-h-[290px] bg-card text-card-foreground ${
        isSelected && !isCompareMode
          ? "border-primary ring-2 ring-primary/25 shadow-md"
          : isCompareSelected
          ? "border-primary/80 ring-2 ring-primary/10 bg-primary/5"
          : "border-border/80 hover:border-primary/50 hover:shadow-xs"
      }`}
    >
      {/* 1. Mark Stage (200px tall, clean neutral background) */}
      <div className="relative h-[200px] w-full bg-muted/20 dark:bg-muted/10 border-b border-border/60 flex flex-col items-center justify-center p-4 select-none overflow-hidden">
        
        {/* Pinned 24px Blue Circular Check Badge */}
        {isSelected && !isCompareMode && (
          <div className="absolute top-3 right-3 size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs z-10">
            <Check className="size-3.5 stroke-[3]" />
          </div>
        )}

        {/* Compare Checkbox Indicator when in Compare Mode */}
        {isCompareMode && (
          <div
            className={`absolute top-3 right-3 size-5 rounded-md border flex items-center justify-center transition-colors z-10 ${
              isCompareSelected
                ? "bg-primary border-primary text-primary-foreground"
                : "border-border/80 bg-card/80 text-transparent"
            }`}
          >
            <Check className="size-3 stroke-[3]" />
          </div>
        )}

        {/* Loading Overlay when this specific tile is regenerating */}
        {isRegenerating && (
          <div className="absolute inset-0 bg-background/85 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20">
            <RefreshCw className="size-6 text-primary animate-spin" />
            <span className="text-xs font-medium text-foreground font-sans">
              Redrawing concept...
            </span>
          </div>
        )}

        {/* Mode 1: Mark Only (Vector mark SVG + Wordmark) */}
        {viewMode === "mark" && (
          <div className="flex flex-col items-center justify-center gap-2 size-full">
            <div className="relative size-24 sm:size-28 flex items-center justify-center p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={`${concept.key}-${concept.regenerateCount ?? 0}-${concept.markAssetUri}`}
                src={resolveMediaUrl(concept.markAssetUri, concept.regenerateCount)}
                alt={descriptor}
                className="size-full object-contain filter drop-shadow-2xs transition-transform duration-200 group-hover:scale-105"
              />
            </div>
            <span className="text-xs font-semibold text-foreground font-heading tracking-tight opacity-90 truncate max-w-[200px]">
              {businessName}
            </span>
          </div>
        )}

        {/* Mode 2: On an Invoice (Header View Mock) */}
        {viewMode === "invoice" && (
          <div className="w-full max-w-[280px]">
            <InvoiceMockHeader
              lockupUri={resolveMediaUrl(concept.lockupAssetUri || concept.markAssetUri, concept.regenerateCount)}
              conceptName={conceptTag}
            />
          </div>
        )}

        {/* Mode 3: At 16px (Micro-Scale Favicon Inspection) */}
        {viewMode === "16px" && (
          <MicroScaleViewer
            markUri={resolveMediaUrl(concept.markAssetUri, concept.regenerateCount)}
            conceptName={conceptTag}
          />
        )}
      </div>

      {/* 2. Tile Inline Error (if any) */}
      {error && (
        <div className="mx-4 mt-3 p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-[11px] flex items-start gap-1.5 shrink-0">
          <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
          <div className="flex-1">
            <span>{error.message}</span>
            {error.type === "credits" && (
              <Link
                href="/dashboard/creator/credits"
                target="_blank"
                className="inline-flex items-center gap-0.5 ml-1 font-semibold underline hover:opacity-80"
                onClick={(e) => e.stopPropagation()}
              >
                Top up <ArrowUpRight className="size-3" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 3. Card Footer (16px padding / p-4) */}
      <div className="p-4 flex items-center justify-between gap-3 shrink-0">
        {/* Left: Concept Tag & Descriptor Line */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {conceptTag}
            </span>
            {isExhausted && (
              <span
                className="font-mono text-[9px] font-semibold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                title="Redraw limit reached for this concept"
              >
                0/3 LEFT
              </span>
            )}
          </div>
          <span className="text-xs font-sans text-foreground/90 font-medium truncate mt-0.5" title={descriptor}>
            {isExhausted ? "Redraw limit reached for this concept" : descriptor}
          </span>
        </div>

        {/* Right: Selected Badge & Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isSelected && !isCompareMode && (
            <span className="font-sans text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-wider">
              SELECTED
            </span>
          )}

          {!isCompareMode && (
            <div className="flex items-center gap-1">
              {/* Optional Quick Expand View */}
              {onInspect && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInspect();
                  }}
                  className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
                  title="Inspect logo mark"
                >
                  <Maximize2 className="size-3.5" />
                </button>
              )}

              {/* Single concept redraw button */}
              <button
                type="button"
                disabled={isRegenerating || isExhausted || disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  onRegenerate();
                }}
                className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-center transition-colors cursor-pointer"
                title={
                  isExhausted
                    ? "Redraw limit reached for this concept (0/3 left)"
                    : `Redraw just this one (Free · ${remaining}/3 left)`
                }
              >
                <RefreshCw className={`size-3.5 ${isRegenerating ? "animate-spin text-primary" : ""}`} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
