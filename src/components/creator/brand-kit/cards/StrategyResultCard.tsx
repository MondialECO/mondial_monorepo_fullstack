"use client";

import React from "react";
import { BrandStrategy } from "@/types/creator/brand-kit";
import { CheckCircle2, Edit3, Shield, Users, Target, Lightbulb, Tag, Ban } from "lucide-react";

interface StrategyResultCardProps {
  strategy?: BrandStrategy;
  onEdit?: () => void;
}

export function StrategyResultCard({ strategy, onEdit }: StrategyResultCardProps) {
  if (!strategy) return null;

  const concept = strategy.concept?.value || "Core brand vision defined.";
  const audience = strategy.targetAudience?.value || "Target market specified.";
  const industry = strategy.industry?.value || "Industry sector identified.";
  const positioning = strategy.positioning?.value || "Unique positioning determined.";
  const personality = strategy.personalityTraits?.length
    ? strategy.personalityTraits.join(", ")
    : "Tone defined.";
  const avoid = strategy.avoidList?.length
    ? strategy.avoidList.join(", ")
    : "No explicit exclusions.";

  return (
    <div className="w-full rounded-2xl border border-border/80 bg-card p-6 shadow-xs text-card-foreground">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <CheckCircle2 className="size-3.5" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-semibold tracking-tight">Brand Strategy Foundations</h3>
            <span className="text-[11px] font-mono text-muted-foreground">CONFIRMED · 6 PILLARS</span>
          </div>
        </div>

        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1 text-xs font-sans text-muted-foreground hover:text-primary transition-colors cursor-pointer px-2.5 py-1 rounded-lg hover:bg-muted"
          >
            <Edit3 className="size-3" />
            <span>Edit</span>
          </button>
        )}
      </div>

      {/* 6 Brand Facts Grid Matching Real Modal Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* 1. Core Concept */}
        <div className="rounded-xl bg-muted/20 border border-border/40 p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Lightbulb className="size-3.5 text-primary" />
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

        {/* 3. Industry / Sector */}
        <div className="rounded-xl bg-muted/20 border border-border/40 p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Shield className="size-3.5 text-purple-500" />
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Industry</span>
          </div>
          <p className="text-xs text-foreground font-medium line-clamp-2">{industry}</p>
        </div>

        {/* 4. Market Positioning */}
        <div className="rounded-xl bg-muted/20 border border-border/40 p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Target className="size-3.5 text-amber-500" />
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Positioning</span>
          </div>
          <p className="text-xs text-foreground font-medium line-clamp-2">{positioning}</p>
        </div>

        {/* 5. Personality Traits */}
        <div className="rounded-xl bg-muted/20 border border-border/40 p-3 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Tag className="size-3.5 text-emerald-500" />
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
          <p className="text-xs text-foreground font-medium line-clamp-1">{avoid}</p>
        </div>
      </div>
    </div>
  );
}
