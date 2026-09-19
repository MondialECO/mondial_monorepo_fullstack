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
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-1.5 text-button font-semibold text-muted-foreground hover:text-foreground h-8 px-2 sm:px-2.5 font-sans cursor-pointer shrink-0"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back</span>
        </Button>
        <div className="hidden sm:flex flex-col min-w-0 max-w-[140px] md:max-w-[200px]">
          <span className="text-badge font-bold text-foreground truncate font-heading">
            {brandName}
          </span>
          <span className="text-badge text-muted-foreground font-sans truncate">
            Visual Identity Studio
          </span>
        </div>
      </div>

      {/* Center: 6-Segment Progress Track */}
      <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0 min-w-0">
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
                className={`group flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-badge font-medium transition-all font-sans ${
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
                  className={`flex size-4.5 items-center justify-center rounded-full text-badge font-mono leading-none ${
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

                <span className="hidden xl:inline text-badge tracking-tight font-sans">
                  {seg.label}
                </span>
              </button>

              {/* Segment connector line */}
              {idx < segments.length - 1 && (
                <div
                  className={`h-0.5 w-1 sm:w-2 md:w-3 rounded-full transition-colors shrink-0 ${
                    isComplete ? "bg-emerald-500/60" : "bg-border"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Right: What's running now / In-flight status */}
      <div className="flex items-center justify-end shrink-0 min-w-0">
        {inFlightStatus ? (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary animate-pulse max-w-[120px] sm:max-w-none">
            <Loader2 className="size-3 animate-spin shrink-0" />
            <span className="text-badge font-medium font-mono truncate">
              {inFlightStatus}
            </span>
          </div>
        ) : (
          <span className="text-badge text-muted-foreground font-sans hidden sm:inline">
            Studio Live
          </span>
        )}
      </div>
    </header>
  );
}
