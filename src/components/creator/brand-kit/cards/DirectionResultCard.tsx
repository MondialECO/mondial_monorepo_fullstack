"use client";

import React from "react";
import { BrandDirection } from "@/types/creator/brand-kit";
import { CheckCircle2, Edit3, Palette, Type } from "lucide-react";

interface DirectionResultCardProps {
  direction?: BrandDirection;
  onEdit?: () => void;
}

export function DirectionResultCard({ direction, onEdit }: DirectionResultCardProps) {
  if (!direction || (!direction.selectedDirectionKey && !direction.selectedAt)) return null;

  const candidate =
    direction.candidates?.find((c) => c.key === direction.selectedDirectionKey) ||
    direction.candidates?.[0] || {
      name: "Modern Precision",
      feelLine: "Balanced, confident and technically refined.",
      colorPalette: ["#0052FF", "#0F172A", "#38BDF8", "#F8FAFC", "#09090B"],
      displayTypeface: "Space Grotesk",
      textTypeface: "Plus Jakarta Sans",
    };

  return (
    <div
      onClick={onEdit}
      className="group relative w-full max-w-4xl rounded-2xl border border-border/80 bg-white p-6 shadow-sm transition-all duration-200 hover:border-primary/50 hover:shadow-md cursor-pointer"
    >
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-semibold text-primary uppercase tracking-wider">
                STEP 2
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground font-medium">Visual Direction</span>
            </div>
            <h3 className="text-base font-bold text-foreground tracking-tight">
              {candidate.name}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.();
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Edit3 className="size-3.5" />
          Review & Edit
        </button>
      </div>

      {/* Details Row: Feel line + Palette + Typeface */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Feel Line */}
        <div className="rounded-xl bg-muted/20 border border-border/40 p-3.5 flex flex-col justify-between">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Direction Feel
          </span>
          <p className="text-xs text-foreground font-medium leading-relaxed">
            {candidate.feelLine}
          </p>
        </div>

        {/* Color Palette Swatches */}
        <div className="rounded-xl bg-muted/20 border border-border/40 p-3.5 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
            <Palette className="size-3.5 text-primary" />
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">
              Harmonized Palette
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {candidate.colorPalette?.map((hex, idx) => (
              <div
                key={idx}
                className="size-7 rounded-lg border border-black/10 shadow-2xs transition-transform hover:scale-110"
                style={{ backgroundColor: hex }}
                title={hex}
              />
            ))}
          </div>
        </div>

        {/* Typeface Pairing */}
        <div className="rounded-xl bg-muted/20 border border-border/40 p-3.5 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Type className="size-3.5 text-primary" />
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">
              Type Pairing
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-foreground">
              {candidate.displayTypeface}
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">
              Body: {candidate.textTypeface}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
