"use client";

import React from "react";
import { AlertTriangle, ArrowRight, X, RefreshCw, Layers } from "lucide-react";

export type CascadeTargetSection = "direction" | "logo_creation" | "strategy";

interface CascadeWarningModalProps {
  isOpen: boolean;
  targetSection: CascadeTargetSection;
  onConfirm: () => void;
  onClose: () => void;
}

export function CascadeWarningModal({
  isOpen,
  targetSection,
  onConfirm,
  onClose,
}: CascadeWarningModalProps) {
  if (!isOpen) return null;

  const isDirection = targetSection === "direction";
  const isLogo = targetSection === "logo_creation";

  const title = isDirection
    ? "Change Visual Direction?"
    : isLogo
    ? "Modify Core Logo Concept?"
    : "Edit Strategy Foundations?";

  const invalidations = isDirection
    ? [
        "Approved Logo Concept & Mark parameters",
        "All 7 derived Variation lockups & assets",
        "Harmonized 5-role Colour Palette",
        "Heading & Body Typography Pairing",
      ]
    : isLogo
    ? [
        "Current approved Logo Concept lockup",
        "All 7 canonical Variation formats",
        "Permanent Logo type font assignment",
      ]
    : [
        "Brand Strategy baseline facts",
        "Automated specimen text across subsequent studio modals",
      ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cascade-warning-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/60 px-6 py-4 bg-amber-500/10">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="size-5 shrink-0" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider">
              Cascade Invalidation Warning
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <h3 id="cascade-warning-title" className="text-lg font-bold text-foreground">
            {title}
          </h3>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {isDirection
              ? "Because Visual Direction anchors your entire visual identity system, altering it will invalidate and require rebuilding downstream decisions:"
              : isLogo
              ? "Your logo mark anchors your typography and variation assets. Selecting or regenerating a new concept will rebuild:"
              : "Updating your strategy facts will update context across all studio modules:"}
          </p>

          <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2">
            <span className="font-mono text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
              AFFECTED DOWNSTREAM ASSETS
            </span>
            <ul className="space-y-1.5">
              {invalidations.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 text-xs text-foreground font-medium">
                  <RefreshCw className="size-3 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[11px] text-muted-foreground italic">
            A version snapshot of your current brand kit will be automatically saved in Version History before entering Studio.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border/60 px-6 py-3.5 bg-muted/20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-colors"
          >
            <span>Proceed to Studio</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
