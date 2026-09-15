"use client";

import React, { useState } from "react";
import { BrandLogoConcept } from "@/types/creator/brand-kit";
import { Button } from "@/components/ui/button";
import { X, Check, Sun, Moon } from "lucide-react";
import { InvoiceMockHeader } from "./InvoiceMockHeader";
import { MicroScaleViewer } from "./MicroScaleViewer";

interface CompareOverlayProps {
  concepts: BrandLogoConcept[];
  selectedKeys: [string, string];
  onClose: () => void;
  onSelectWinningConcept: (key: string) => void;
}

export function CompareOverlay({
  concepts,
  selectedKeys,
  onClose,
  onSelectWinningConcept,
}: CompareOverlayProps) {
  const [backgroundTheme, setBackgroundTheme] = useState<"light" | "dark">(
    "light"
  );
  const [compareView, setCompareView] = useState<"mark" | "invoice" | "16px">(
    "mark"
  );

  const conceptA = concepts.find((c) => c.key === selectedKeys[0]);
  const conceptB = concepts.find((c) => c.key === selectedKeys[1]);

  if (!conceptA || !conceptB) {
    return null;
  }

  const renderConceptContent = (concept: BrandLogoConcept, label: string) => {
    const markUri = concept.markAssetUri;
    const lockupUri = concept.lockupAssetUri || concept.markAssetUri;

    return (
      <div className="flex-1 flex flex-col rounded-2xl border border-border bg-card p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <span className="font-heading font-semibold text-sm text-foreground">
            {label}: {concept.parameters?.descriptor || concept.parameters?.family || concept.key}
          </span>
          <Button
            size="sm"
            onClick={() => onSelectWinningConcept(concept.key)}
            className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Check className="size-3.5" />
            <span>Select this concept</span>
          </Button>
        </div>

        {/* Display Canvas with light/dark toggle */}
        <div
          className={`flex-1 min-h-[260px] rounded-xl flex items-center justify-center p-6 border transition-colors ${
            backgroundTheme === "dark"
              ? "bg-[#121316] border-[#24262b] text-white"
              : "bg-white border-border/60 text-foreground"
          }`}
        >
          {compareView === "mark" && (
            <div className="size-36 flex items-center justify-center p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={markUri}
                alt={concept.descriptorLine || label}
                className="size-full object-contain filter drop-shadow-xs"
              />
            </div>
          )}

          {compareView === "invoice" && (
            <div className="w-full max-w-[320px]">
              <InvoiceMockHeader lockupUri={lockupUri} conceptName={label} />
            </div>
          )}

          {compareView === "16px" && (
            <MicroScaleViewer markUri={markUri} conceptName={label} />
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center line-clamp-2">
          {concept.descriptorLine || "Parametric vector mark"}
        </p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in-50">
      <div className="w-full max-w-5xl rounded-3xl border border-border bg-background shadow-2xl p-6 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-border/80 pb-4 mb-6">
          <div>
            <h3 className="font-heading font-bold text-lg text-foreground">
              Side-by-Side Concept Comparison
            </h3>
            <p className="text-xs text-muted-foreground">
              Compare mark geometry, context scalability, and contrast between two concepts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Switcher */}
            <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setCompareView("mark")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  compareView === "mark"
                    ? "bg-card font-medium text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Mark
              </button>
              <button
                type="button"
                onClick={() => setCompareView("invoice")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  compareView === "invoice"
                    ? "bg-card font-medium text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Invoice
              </button>
              <button
                type="button"
                onClick={() => setCompareView("16px")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  compareView === "16px"
                    ? "bg-card font-medium text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                16px
              </button>
            </div>

            {/* Background Theme Switcher */}
            <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
              <button
                type="button"
                onClick={() => setBackgroundTheme("light")}
                className={`p-1.5 rounded-md transition-colors ${
                  backgroundTheme === "light"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Preview on Light background"
              >
                <Sun className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setBackgroundTheme("dark")}
                className={`p-1.5 rounded-md transition-colors ${
                  backgroundTheme === "dark"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Preview on Dark background"
              >
                <Moon className="size-4" />
              </button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="size-8 rounded-full"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* 2-Column Comparison Layout */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-1">
          {renderConceptContent(conceptA, "Concept 1")}
          {renderConceptContent(conceptB, "Concept 2")}
        </div>
      </div>
    </div>
  );
}
