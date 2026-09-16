"use client";

import React from "react";
import { Check, Lock, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type StudioStepKey =
  | "strategy"
  | "direction"
  | "logo_type"
  | "logo"
  | "colors"
  | "typography";

export interface StepSegmentMeta {
  key: StudioStepKey;
  stepNumber: number;
  label: string;
  status: "complete" | "active" | "locked";
}

interface BrandStudioProgressBarProps {
  segments: StepSegmentMeta[];
  activeStepKey: StudioStepKey;
  brandName?: string;
  inFlightStatus?: string | null;
  onSelectStep: (stepKey: StudioStepKey) => void;
  onBack: () => void;
}

export function BrandStudioProgressBar({
  segments,
  activeStepKey,
  brandName = "Brand",
  inFlightStatus,
  onSelectStep,
  onBack,
}: BrandStudioProgressBarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border/80 bg-card/95 px-4 md:px-8 backdrop-blur-md">
      {/* Left: Back button + Brand context */}
      <div className="flex items-center gap-3 min-w-[200px]">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground h-8 px-2.5 font-sans cursor-pointer"
        >
          <ArrowLeft className="size-3.5" />
          Back
        </Button>
        <div className="hidden sm:flex flex-col">
          <span className="text-[11px] font-bold text-foreground line-clamp-1 font-heading">
            {brandName}
          </span>
          <span className="text-[10px] text-muted-foreground font-sans">
            Visual Identity Studio
          </span>
        </div>
      </div>

      {/* Center: 6-Segment Progress Track */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {segments.map((seg, idx) => {
          const isSelected = seg.key === activeStepKey;
          const isComplete = seg.status === "complete";
          const isLocked = seg.status === "locked";
          const isActive = seg.status === "active";

          return (
            <React.Fragment key={seg.key}>
              <button
                type="button"
                disabled={isLocked}
                onClick={() => onSelectStep(seg.key)}
                className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all font-sans ${
                  isSelected
                    ? "bg-primary/10 text-foreground border border-primary/30 shadow-2xs font-semibold"
                    : isComplete
                    ? "text-foreground hover:bg-muted/80 cursor-pointer"
                    : isActive
                    ? "text-primary font-semibold hover:bg-primary/5 cursor-pointer"
                    : "text-muted-foreground/60 opacity-60 cursor-not-allowed"
                }`}
                title={
                  isLocked
                    ? `Step ${seg.stepNumber} locked — complete previous steps first`
                    : `${seg.stepNumber}. ${seg.label}`
                }
              >
                {/* Status Indicator Icon */}
                <div
                  className={`flex size-4 items-center justify-center rounded-full text-[9px] ${
                    isComplete
                      ? "bg-emerald-500 text-white"
                      : isSelected || isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isComplete ? (
                    <Check className="size-2.5 stroke-[3]" />
                  ) : isLocked ? (
                    <Lock className="size-2.5" />
                  ) : (
                    <span className="font-mono font-bold">{seg.stepNumber}</span>
                  )}
                </div>

                <span className="hidden md:inline text-xs tracking-tight font-sans">
                  {seg.label}
                </span>
              </button>

              {/* Segment connector line */}
              {idx < segments.length - 1 && (
                <div
                  className={`h-0.5 w-2 sm:w-3 rounded-full transition-colors ${
                    isComplete ? "bg-emerald-500/60" : "bg-border"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Right: What's running now / In-flight status */}
      <div className="flex items-center justify-end min-w-[200px]">
        {inFlightStatus ? (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary animate-pulse">
            <Loader2 className="size-3 animate-spin" />
            <span className="text-[11px] font-medium font-mono line-clamp-1">
              {inFlightStatus}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground font-sans hidden sm:inline">
            Studio Live
          </span>
        )}
      </div>
    </header>
  );
}
