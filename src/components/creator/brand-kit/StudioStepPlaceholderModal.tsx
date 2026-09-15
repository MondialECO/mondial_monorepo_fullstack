"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { X, Clock, ArrowRight } from "lucide-react";

interface StudioStepPlaceholderModalProps {
  stepKey: string;
  stepNumber: number;
  stepTitle: string;
  description: string;
  isOpen: boolean;
  onClose: () => void;
  onAdvanceMock?: () => void;
}

export function StudioStepPlaceholderModal({
  stepKey,
  stepNumber,
  stepTitle,
  description,
  isOpen,
  onClose,
  onAdvanceMock,
}: StudioStepPlaceholderModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl p-6 md:p-8 space-y-6">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close placeholder modal"
          className="absolute top-5 right-5 inline-flex size-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="size-4" />
        </button>

        {/* Badge & Title */}
        <div className="flex flex-col gap-2">
          <span className="inline-flex w-fit items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20 font-mono">
            STEP {stepNumber} OF 6 • {stepKey.toUpperCase().replace(/_/g, " ")}
          </span>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {stepTitle}
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        {/* Development Note */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border/60">
          <Clock className="size-4 text-primary shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-foreground">
              Module Queued in Visual Identity Studio Roadmap
            </span>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              This modal step is scheduled for integration. The active production steps in this build are <strong>Logo Creation (3a)</strong> and <strong>Variation Set (3b)</strong>.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs font-medium"
          >
            Close to Canvas
          </Button>

          {onAdvanceMock && (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onAdvanceMock}
              className="gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Simulate Completion
              <ArrowRight className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
