"use client";

import React, { useState, useEffect, useMemo } from "react";
import { BrandKit, BrandLogoVariation, formatConceptTitle } from "@/types/creator/brand-kit";
import { brandKitApi } from "@/lib/api-creator-brand-kit";
import { exportBrandKitZip } from "@/lib/brand-kit-export";
import { VariationTile } from "./VariationTile";
import { ModalWorkflowHeader } from "./ModalWorkflowHeader";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";

export interface VariationSetModalProps {
  ideaId?: string;
  initialKit?: BrandKit | null;
  onConfirm?: (kit: BrandKit) => void;
  onBack?: () => void;
  onClose?: () => void;
}

const TOP_ROW_KEYS = ["primary", "horizontal", "stacked"] as const;
const BOTTOM_ROW_KEYS = ["icon_only", "black", "white", "transparent"] as const;

export function VariationSetModal({
  ideaId,
  initialKit,
  onConfirm,
  onBack,
  onClose,
}: VariationSetModalProps) {
  const [kit, setKit] = useState<BrandKit | null>(initialKit ?? null);
  const [variations, setVariations] = useState<Record<string, BrandLogoVariation>>(
    initialKit?.logo?.variations ?? {}
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [redrawingKey, setRedrawingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const brandName =
    kit?.strategy?.nameDisplayForm ||
    kit?.strategy?.businessName ||
    "AutoInvoice";

  const selectedConceptKey = kit?.logo?.selectedConceptKey || "concept_4";
  const selectedConceptIndex = kit?.logo?.concepts?.findIndex((c) => c.key === selectedConceptKey) ?? -1;
  const conceptLabel = useMemo(() => {
    if (selectedConceptIndex >= 0 && kit?.logo?.concepts?.[selectedConceptIndex]) {
      return formatConceptTitle(kit.logo.concepts[selectedConceptIndex], selectedConceptIndex);
    }
    const match = selectedConceptKey.match(/\d+/);
    const num = match ? parseInt(match[0], 10) : 4;
    return `Concept ${num.toString().padStart(2, "0")}`;
  }, [kit?.logo?.concepts, selectedConceptIndex, selectedConceptKey]);

  // Load or derive variations if not present
  useEffect(() => {
    let isMounted = true;

    if (initialKit?.logo?.variations && Object.keys(initialKit.logo.variations).length >= 7) {
      setVariations(initialKit.logo.variations);
      setKit(initialKit);
      return;
    }

    async function loadVariations() {
      setIsLoading(true);
      setError(null);

      try {
        let currentKit = initialKit;
        if (!currentKit) {
          currentKit = await brandKitApi.getBrandKit(ideaId);
        }

        if (!isMounted) return;

        // If variations are still missing or incomplete, trigger derivation
        if (!currentKit.logo?.variations || Object.keys(currentKit.logo.variations).length < 7) {
          currentKit = await brandKitApi.deriveVariations(ideaId, currentKit.version);
        }

        if (!isMounted) return;
        setKit(currentKit);
        if (currentKit.logo?.variations) {
          setVariations(currentKit.logo.variations);
        }
      } catch (err: any) {
        if (!isMounted) return;
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load brand variations.";
        setError(msg);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadVariations();

    return () => {
      isMounted = false;
    };
  }, [ideaId, initialKit]);

  // Client-side ZIP bundle packaging
  const handleDownloadAllZip = async () => {
    if (isZipping) return;

    setIsZipping(true);
    setError(null);

    try {
      const kitToExport: BrandKit = {
        ...initialKit,
        logo: {
          ...initialKit.logo,
          variations,
        },
      };
      await exportBrandKitZip(kitToExport, brandName);
    } catch (err: any) {
      console.error("ZIP Generation error:", err);
      setError(err?.message || "Failed to create ZIP download bundle. Please try again.");
    } finally {
      setIsZipping(false);
    }
  };

  // Handler to redraw single variation (e.g. horizontal)
  const handleRedrawVariation = async (variationKey: string) => {
    if (redrawingKey) return;
    setRedrawingKey(variationKey);
    try {
      const currentKit = await brandKitApi.deriveVariations(ideaId, kit?.version);
      setKit(currentKit);
      if (currentKit.logo?.variations) {
        setVariations(currentKit.logo.variations);
      }
    } catch (err: any) {
      console.error("Failed to redraw variation:", err);
    } finally {
      setRedrawingKey(null);
    }
  };

  // Final Approval Handler
  const handleApproveAll = async () => {
    if (isApproving) return;

    setIsApproving(true);
    setError(null);

    try {
      const updatedKit = await brandKitApi.patchLogo(
        {
          approvedAt: new Date().toISOString(),
        },
        ideaId,
        kit?.version
      );

      setKit(updatedKit);
      if (onConfirm) {
        onConfirm(updatedKit);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to approve logo variations.";
      setError(msg);
      setIsApproving(false);
    }
  };

  const hasVariations = Object.keys(variations).length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-6xl max-h-[94vh] rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
        {/* Modal Header & 6-Step Workflow Track (Figma Node 57004:11208) */}
        <ModalWorkflowHeader
          title="Your logo, in every form"
          subtitle={`Seven variations built from ${conceptLabel}. Same geometry throughout — only arrangement and colour change.`}
          currentStep={4}
          onClose={onClose || onBack || (() => {})}
          headerActions={
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadAllZip}
              disabled={!hasVariations || isZipping}
              className="gap-2 text-sm font-mono cursor-pointer border-border/80 bg-background/80 hover:bg-muted"
            >
              {isZipping ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Download className="size-3.5" />
              )}
              <span>Download set</span>
            </Button>
          }
        />

        {/* Global Error Banner */}
        {error && (
          <div className="mx-6 md:mx-8 mt-4 flex items-center gap-2 p-3 text-xs text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-xl">
            <AlertCircle className="size-4 shrink-0 text-destructive" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-mono">
                Generating and loading variation assets...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Section 1: Batch Summary Metadata Strip */}
              <div className="rounded-xl border border-border/80 bg-card/60 dark:bg-card/40 px-5 py-3 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
                  {/* SOURCE */}
                  <div className="flex items-center">
                    <span className="font-sans text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                      SOURCE
                    </span>
                    <span className="font-mono text-[13px] font-medium text-foreground ml-2">
                      {conceptLabel}
                    </span>
                  </div>

                  <div className="hidden sm:block h-3.5 w-px bg-border/80" />

                  {/* VARIATIONS */}
                  <div className="flex items-center">
                    <span className="font-sans text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                      VARIATIONS
                    </span>
                    <span className="font-sans text-[13px] font-semibold text-foreground ml-2">
                      7
                    </span>
                  </div>

                  <div className="hidden sm:block h-3.5 w-px bg-border/80" />

                  {/* FORMATS */}
                  <div className="flex items-center">
                    <span className="font-sans text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                      FORMATS
                    </span>
                    <span className="font-sans text-[13px] font-semibold text-foreground ml-2">
                      SVG + PNG
                    </span>
                  </div>

                  <div className="hidden sm:block h-3.5 w-px bg-border/80" />

                  {/* COST */}
                  <div className="flex items-center">
                    <span className="font-sans text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                      COST
                    </span>
                    <span className="font-mono text-[13px] text-foreground ml-2">
                      Free, derived
                    </span>
                  </div>
                </div>

                {/* Right Green Outline Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-sans text-xs font-medium">
                  <Check className="size-3.5 stroke-[2.5]" />
                  <span>No credits used</span>
                </div>
              </div>

              {/* Section 2: Logo Variations Matrix */}
              <div className="space-y-5">
                {/* Row 1: 3 Wide Tiles (PRIMARY, HORIZONTAL, STACKED) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {TOP_ROW_KEYS.map((key) => {
                    const variation = variations[key] || {
                      svgUri: "",
                      usageNote: "Core brand lockup.",
                    };
                    return (
                      <VariationTile
                        key={key}
                        variationKey={key}
                        variation={variation}
                        brandName={brandName}
                        isWide={true}
                        onRedraw={key === "horizontal" ? () => handleRedrawVariation("horizontal") : undefined}
                        isRedrawing={redrawingKey === "horizontal"}
                      />
                    );
                  })}
                </div>

                {/* Row 2: 4 Narrower Tiles (ICON-ONLY, BLACK, WHITE, TRANSPARENT) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {BOTTOM_ROW_KEYS.map((key) => {
                    const variation = variations[key] || {
                      svgUri: "",
                      usageNote: "Specialized output mode.",
                    };
                    return (
                      <VariationTile
                        key={key}
                        variationKey={key}
                        variation={variation}
                        brandName={brandName}
                        isWide={false}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 p-5 md:px-8 border-t border-border/80 bg-background/60">
          <div>
            {onBack && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onBack}
                disabled={isApproving}
                className="gap-2 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <ArrowLeft className="size-3.5" />
                Back to Concepts
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="default"
              size="default"
              onClick={handleApproveAll}
              disabled={isApproving || isLoading || !hasVariations}
              className="gap-2 px-6 h-10 text-sm font-semibold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground transition-all cursor-pointer"
            >
              {isApproving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Approving Variations...
                </>
              ) : (
                <>
                  <Check className="size-4 stroke-[2.5]" />
                  Approve all seven
                  <ArrowRight className="size-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

