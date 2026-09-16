"use client";

import React from "react";
import { Check, Lock, X } from "lucide-react";

export interface WorkflowStepMeta {
  id: string;
  label: string;
  step: number;
}

export const CANONICAL_WORKFLOW_STEPS: WorkflowStepMeta[] = [
  { id: "strategy", label: "Strategy", step: 1 },
  { id: "direction", label: "Direction", step: 2 },
  { id: "logotype", label: "Logo type", step: 3 },
  { id: "logo", label: "Logo", step: 4 },
  { id: "colour", label: "Colour", step: 5 },
  { id: "typography", label: "Typography", step: 6 },
];

export interface ModalWorkflowHeaderProps {
  title: string;
  subtitle?: string;
  currentStep: number;
  onClose: () => void;
  headerActions?: React.ReactNode;
}

export function ModalWorkflowHeader({
  title,
  subtitle,
  currentStep,
  onClose,
  headerActions,
}: ModalWorkflowHeaderProps) {
  return (
    <div className="px-6 sm:px-8 pt-6 pb-0 border-b border-border/70 bg-card">
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-4 pb-4">
        <div className="space-y-1.5 max-w-2xl">
          <h1 className="text-2xl sm:text-[26px] font-semibold tracking-tight text-foreground font-heading">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground font-sans leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {headerActions}

          {/* Step Counter Pill (Strict Digit Monospace Isolation) */}
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-muted/80 text-foreground/80 border border-border/70 font-sans">
            STEP{" "}
            <span className="font-mono font-semibold text-foreground mx-1">
              {currentStep}
            </span>{" "}
            OF{" "}
            <span className="font-mono font-semibold text-foreground ml-1">
              6
            </span>
          </span>

          {/* Close Dialog Button */}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Nav - 6-Segment Workflow Steps Track (Figma Node 57003:9812) */}
      <div className="grid grid-cols-6 gap-2 sm:gap-3.5 pt-2 pb-3.5">
        {CANONICAL_WORKFLOW_STEPS.map((step) => {
          const isCurrent = step.step === currentStep;
          const isComplete = step.step < currentStep;
          const isLocked = step.step > currentStep;

          return (
            <div
              key={step.id}
              className="flex flex-col gap-1.5 text-center transition-all"
            >
              {/* 6px Rounded Top Pill Bar Indicator */}
              <div
                className={`h-1.5 w-full rounded-full transition-all duration-200 ${
                  isCurrent
                    ? "bg-primary shadow-2xs"
                    : isComplete
                    ? "bg-emerald-500/80"
                    : "bg-muted dark:bg-muted/50 border border-border/40"
                }`}
              />

              {/* Step Label with Status Icon */}
              <div
                className={`flex items-center justify-center gap-1 text-[11px] sm:text-xs font-medium transition-colors font-sans truncate ${
                  isCurrent
                    ? "text-foreground font-semibold"
                    : isComplete
                    ? "text-foreground/80"
                    : "text-muted-foreground/60"
                }`}
              >
                {isComplete && (
                  <Check className="size-3 text-emerald-600 dark:text-emerald-400 stroke-[2.5] shrink-0" />
                )}
                {isLocked && (
                  <Lock className="size-2.5 sm:size-3 text-muted-foreground/50 shrink-0" />
                )}
                <span className="truncate">{step.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
