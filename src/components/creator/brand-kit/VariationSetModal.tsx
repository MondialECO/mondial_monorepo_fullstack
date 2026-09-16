"use client";

import React, { useState, useEffect } from "react";
import JSZip from "jszip";
import { BrandKit, BrandLogoVariation } from "@/types/creator/brand-kit";
import { brandKitApi } from "@/lib/api-creator-brand-kit";
import { VariationTile } from "./VariationTile";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Layers,
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
  const [error, setError] = useState<string | null>(null);

  const brandName =
    kit?.strategy?.nameDisplayForm ||
    kit?.strategy?.businessName ||
    "Brand";

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
    if (isZipping || Object.keys(variations).length === 0) return;

    setIsZipping(true);
    setError(null);

    try {
      const zip = new JSZip();
      const slug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "brand";
      const folder = zip.folder(`${slug}-brand-logo-pack`) || zip;

      for (const [key, variation] of Object.entries(variations)) {
        const fileKey = key.replace(/_/g, "-");

        // 1. Add SVG if present
        if (variation.svgUri) {
          if (variation.svgUri.startsWith("data:image/svg+xml;base64,")) {
            const base64Data = variation.svgUri.split(",")[1];
            folder.file(`${slug}-${fileKey}.svg`, base64Data, { base64: true });
          } else if (variation.svgUri.startsWith("data:image/svg+xml,")) {
            const rawSvg = decodeURIComponent(variation.svgUri.replace("data:image/svg+xml,", ""));
            folder.file(`${slug}-${fileKey}.svg`, rawSvg);
          } else if (variation.svgUri.startsWith("<svg")) {
            folder.file(`${slug}-${fileKey}.svg`, variation.svgUri);
          } else {
            try {
              const res = await fetch(variation.svgUri);
              const blob = await res.blob();
              folder.file(`${slug}-${fileKey}.svg`, blob);
            } catch {
              // Ignore fetch error in client bundle
            }
          }
        }

        // 2. Add PNG if present (especially transparent or raster assets)
        if (variation.pngUri) {
          if (variation.pngUri.startsWith("data:image/png;base64,")) {
            const base64Data = variation.pngUri.split(",")[1];
            folder.file(`${slug}-${fileKey}.png`, base64Data, { base64: true });
          } else {
            try {
              const res = await fetch(variation.pngUri);
              const blob = await res.blob();
              folder.file(`${slug}-${fileKey}.png`, blob);
            } catch {
              // Ignore fetch error in client bundle
            }
          }
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${slug}-logo-variations.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error("ZIP Generation error:", err);
      setError("Failed to create ZIP download bundle. Please try again.");
    } finally {
      setIsZipping(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-6xl max-h-[92vh] rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 md:px-8 md:py-6 border-b border-border/80 bg-background/50">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                <span className="font-mono font-semibold mr-1">STEP 4 OF 6 · VARIATIONS</span> • LOGO SET
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {brandName}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Brand Variation Set
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              Seven production-ready variations have been derived from your approved concept.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadAllZip}
              disabled={isZipping || !hasVariations || isLoading}
              className="gap-2 h-9 text-xs font-medium border-border/80 shadow-2xs hover:bg-muted"
            >
              {isZipping ? (
                <Loader2 className="size-3.5 animate-spin text-primary" />
              ) : (
                <Download className="size-3.5 text-primary" />
              )}
              {isZipping ? "Packaging ZIP..." : "Download set (.zip)"}
            </Button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="inline-flex size-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mx-6 md:mx-8 mt-4 flex items-center gap-2 p-3 text-xs text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-xl">
            <AlertCircle className="size-4 shrink-0 text-destructive" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Generating and loading variation assets...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top Row: 3 Wide Lockup Tiles */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="size-3.5 text-muted-foreground" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                    Core Lockup Formats
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      />
                    );
                  })}
                </div>
              </div>

              {/* Bottom Row: 4 Specialized Utility Tiles */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="size-1.5 rounded-full bg-primary/60" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                    Specialized & Contrast Modes
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                className="gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
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
              className="gap-2 px-6 h-10 text-sm font-semibold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
            >
              {isApproving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Approving Variations...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
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
