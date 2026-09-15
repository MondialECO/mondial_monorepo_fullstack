"use client";

import React, { memo } from "react";
import { Sparkles, Check, RefreshCw, AlertCircle, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogoConcept, formatConceptTitle } from "@/types/creator/brand-kit";
import { InvoiceMockHeader } from "./InvoiceMockHeader";
import { MicroScaleViewer } from "./MicroScaleViewer";
import { RegenerateCapBadge } from "./RegenerateCapBadge";
import Link from "next/link";

export interface ConceptTileProps {
  concept: BrandLogoConcept;
  index: number;
  isSelected: boolean;
  isRegenerating: boolean;
  error: { type: "cap" | "credits" | "network"; message: string } | null;
  viewMode: "mark" | "invoice" | "16px";
  onSelect: () => void;
  onRegenerate: () => void;
  isCompareMode: boolean;
  isCompareSelected: boolean;
  onToggleCompare: () => void;
  disabled?: boolean;
}

export const ConceptTile = memo(function ConceptTile({
  concept,
  index,
  isSelected,
  isRegenerating,
  error,
  viewMode,
  onSelect,
  onRegenerate,
  isCompareMode,
  isCompareSelected,
  onToggleCompare,
  disabled = false,
}: ConceptTileProps) {
  const maxRegens = 3;
  const used = concept.regenerateCount ?? 0;
  const remaining = Math.max(0, maxRegens - used);
  const isExhausted = remaining === 0;

  const conceptTitle = formatConceptTitle(concept, index);

  return (
    <div
      onClick={() => {
        if (isCompareMode) {
          onToggleCompare();
        } else {
          onSelect();
        }
      }}
      className={`group relative flex flex-col justify-between rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden p-4 min-h-[280px] bg-card ${
        isSelected && !isCompareMode
          ? "border-primary ring-2 ring-primary/20 shadow-sm"
          : isCompareSelected
          ? "border-primary/80 ring-2 ring-primary/10 bg-primary/5"
          : "border-border/80 hover:border-border hover:shadow-xs"
      }`}
    >
      {/* Top Bar: Concept Title & Counter */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-heading font-semibold text-xs text-foreground truncate">
            {conceptTitle}
          </span>
        </div>

        {/* Remaining attempts counter */}
        <RegenerateCapBadge usedCount={concept.regenerateCount || 0} maxCount={3} />
      </div>

      {/* Main Canvas Area according to View Mode */}
      <div className="relative flex-1 flex items-center justify-center py-2 px-1 min-h-[140px]">
        {viewMode === "mark" && (
          <div className="relative size-28 flex items-center justify-center p-2 rounded-xl bg-muted/20 border border-border/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={concept.markAssetUri}
              alt={concept.descriptorLine || `Concept ${index + 1}`}
              className="size-full object-contain filter drop-shadow-2xs transition-transform duration-200 group-hover:scale-105"
            />
          </div>
        )}

        {viewMode === "invoice" && (
          <div className="w-full max-w-[280px]">
            <InvoiceMockHeader
              lockupUri={concept.lockupAssetUri || concept.markAssetUri}
              conceptName={`Concept ${index + 1}`}
            />
          </div>
        )}

        {viewMode === "16px" && (
          <MicroScaleViewer
            markUri={concept.markAssetUri}
            conceptName={`Concept ${index + 1}`}
          />
        )}

        {/* Loading Overlay for this specific tile only */}
        {isRegenerating && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center gap-2 z-20">
            <RefreshCw className="size-6 text-primary animate-spin" />
            <span className="text-xs font-medium text-foreground">
              Regenerating concept...
            </span>
          </div>
        )}
      </div>

      {/* Descriptor Line */}
      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-2 mb-3">
        {concept.descriptorLine || "Parametric vector concept mark"}
      </p>

      {/* Inline Tile Error if present */}
      {error && (
        <div className="mb-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-[11px] flex items-start gap-1.5">
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

      {/* Bottom Footer Actions */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
        {/* Selection indicator / checkbox */}
        <div className="flex items-center gap-1.5">
          <div
            className={`size-4 rounded-full border flex items-center justify-center transition-colors ${
              (isCompareMode ? isCompareSelected : isSelected)
                ? "bg-primary border-primary text-primary-foreground"
                : "border-border bg-card group-hover:border-primary/50"
            }`}
          >
            {(isCompareMode ? isCompareSelected : isSelected) && (
              <Check className="size-2.5 stroke-[3]" />
            )}
          </div>
          <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
            {isCompareMode
              ? isCompareSelected
                ? "Comparing"
                : "Select to compare"
              : isSelected
              ? "Selected"
              : "Select"}
          </span>
        </div>

        {/* Regenerate Control */}
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || isRegenerating || isExhausted}
          onClick={(e) => {
            e.stopPropagation();
            onRegenerate();
          }}
          className="h-7 px-2.5 text-[11px] font-medium gap-1.5 border-border/70 hover:bg-accent disabled:opacity-50"
          title={
            isExhausted
              ? "Regeneration limit reached (3/3)"
              : `Regenerate concept (2 credits, ${remaining} left)`
          }
        >
          <RefreshCw
            className={`size-3 ${isRegenerating ? "animate-spin" : ""}`}
          />
          <span>Regenerate</span>
        </Button>
      </div>
    </div>
  );
});
