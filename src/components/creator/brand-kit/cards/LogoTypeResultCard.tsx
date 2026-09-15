"use client";

import React from "react";
import { BrandLogo } from "@/types/creator/brand-kit";
import { CheckCircle2, Edit3, Compass } from "lucide-react";

interface LogoTypeResultCardProps {
  logo?: BrandLogo;
  onEdit?: () => void;
}

function formatLogoType(type?: string): string {
  if (!type) return "Custom Mark";
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

export function LogoTypeResultCard({ logo, onEdit }: LogoTypeResultCardProps) {
  if (!logo?.logoType) return null;

  const formattedType = formatLogoType(logo.logoType);

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
                STEP 3
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground font-medium">Logo Type Archetype</span>
            </div>
            <h3 className="text-base font-bold text-foreground tracking-tight">
              {formattedType}
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

      <div className="flex items-center justify-between rounded-xl bg-muted/20 border border-border/40 p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Compass className="size-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-foreground">
              Selected Family: {formattedType}
            </span>
            <p className="text-[11px] text-muted-foreground">
              Directs parametric geometry generation across the 6 candidate concept models.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
