"use client";

import React from "react";
import { BrandStrategy } from "@/types/creator/brand-kit";
import { CheckCircle2, Edit3, Shield, Users, Target, Sparkles, Ban } from "lucide-react";

interface StrategyResultCardProps {
  strategy?: BrandStrategy;
  onEdit?: () => void;
}

export function StrategyResultCard({ strategy, onEdit }: StrategyResultCardProps) {
  if (!strategy) return null;

  const concept = strategy.concept?.value || "Core brand vision defined.";
  const audience = strategy.targetAudience?.value || "Primary target demographic identified.";
  const industry = strategy.industry?.value || strategy.positioning?.value || "Market segment positioning.";
  const personality = strategy.personalityTraits?.length
    ? strategy.personalityTraits.join(", ")
    : "Visionary, Trustworthy, Precision";
  const archetype = strategy.symbolFeeling || "The Guardian";
  const avoidList = strategy.avoidList?.length ? strategy.avoidList.join(", ") : "Generic corporate tropes";

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
                STEP 1
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground font-medium">Brand Strategy</span>
            </div>
            <h3 className="text-base font-bold text-foreground tracking-tight">
              {strategy.nameDisplayForm || strategy.businessName || "Brand Foundation"}
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

      {/* 6 Brand Facts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* 1. Core Concept */}
        <div className="rounded-xl bg-muted/20 border border-border/40 p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Sparkles className="size-3.5 text-primary" />
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Concept</span>
          </div>
          <p className="text-xs text-foreground font-medium line-clamp-2">{concept}</p>
        </div>

        {/* 2. Target Audience */}
        <div className="rounded-xl bg-muted/20 border border-border/40 p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Users className="size-3.5 text-blue-500" />
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Audience</span>
          </div>
          <p className="text-xs text-foreground font-medium line-clamp-2">{audience}</p>
        </div>

        {/* 3. Industry / Positioning */}
        <div className="rounded-xl bg-muted/20 border border-border/40 p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Target className="size-3.5 text-purple-500" />
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Positioning</span>
          </div>
          <p className="text-xs text-foreground font-medium line-clamp-2">{industry}</p>
        </div>

        {/* 4. Personality Archetype */}
        <div className="rounded-xl bg-muted/20 border border-border/40 p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Shield className="size-3.5 text-amber-500" />
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Archetype</span>
          </div>
          <p className="text-xs text-foreground font-medium line-clamp-1">{archetype}</p>
        </div>

        {/* 5. Personality Traits */}
        <div className="rounded-xl bg-muted/20 border border-border/40 p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Sparkles className="size-3.5 text-emerald-500" />
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Traits</span>
          </div>
          <p className="text-xs text-foreground font-medium line-clamp-1">{personality}</p>
        </div>

        {/* 6. Avoid List */}
        <div className="rounded-xl bg-muted/20 border border-border/40 p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Ban className="size-3.5 text-rose-500" />
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Avoidances</span>
          </div>
          <p className="text-xs text-foreground font-medium line-clamp-1">{avoidList}</p>
        </div>
      </div>
    </div>
  );
}
