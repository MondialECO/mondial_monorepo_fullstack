"use client";

import React, { useState } from "react";
import { Download, RefreshCw, Check, ArrowDownToLine } from "lucide-react";
import { BrandLogoVariation } from "@/types/creator/brand-kit";
import { resolveMediaUrl } from "@/lib/brand-kit-media";

export interface VariationTileProps {
  variationKey: string;
  variation: BrandLogoVariation;
  brandName?: string;
  isWide?: boolean;
  onRedraw?: () => void;
  isRedrawing?: boolean;
}

interface VariationMeta {
  title: string;
  aspectRatio: string;
  subtitle: string;
}

const VARIATION_SPECS: Record<string, VariationMeta> = {
  primary: {
    title: "PRIMARY",
    aspectRatio: "3:1",
    subtitle: "Default — website header, deck cover, documents.",
  },
  horizontal: {
    title: "HORIZONTAL",
    aspectRatio: "4:1",
    subtitle: "Wide spaces — navigation bars, email signatures.",
  },
  stacked: {
    title: "STACKED",
    aspectRatio: "1:1",
    subtitle: "Square spaces — profile images, avatars.",
  },
  icon_only: {
    title: "ICON-ONLY",
    aspectRatio: "1:1",
    subtitle: "Favicon, app icon, social avatar.",
  },
  black: {
    title: "BLACK",
    aspectRatio: "3:1",
    subtitle: "Print, contracts, fax-grade documents.",
  },
  white: {
    title: "WHITE",
    aspectRatio: "3:1",
    subtitle: "Dark backgrounds, photography, merch.",
  },
  transparent: {
    title: "TRANSPARENT",
    aspectRatio: "3:1",
    subtitle: "Overlays and placement on any background.",
  },
};

export function VariationTile({
  variationKey,
  variation,
  brandName = "Brand",
  isWide = false,
  onRedraw,
  isRedrawing = false,
}: VariationTileProps) {
  const [downloaded, setDownloaded] = useState(false);
  const meta = VARIATION_SPECS[variationKey] || {
    title: variationKey.toUpperCase().replace(/_/g, "-"),
    aspectRatio: "3:1",
    subtitle: variation.usageNote || "Brand variation asset.",
  };

  const assetUri = resolveMediaUrl(variation.svgUri || variation.pngUri || "");

  const handleDownload = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!assetUri) return;

    try {
      const isPng = variationKey === "transparent" && variation.pngUri;
      const fileUri = resolveMediaUrl((isPng ? variation.pngUri : variation.svgUri) || assetUri);
      const ext = isPng ? "png" : "svg";
      const slug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "brand";
      const filename = `${slug}-${variationKey.replace(/_/g, "-")}.${ext}`;

      const link = document.createElement("a");
      link.href = fileUri;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } catch (err) {
      console.error("Failed to download asset", err);
    }
  };

  const isPrimary = variationKey === "primary";
  const isWhiteStage = variationKey === "white";
  const isTransparentStage = variationKey === "transparent";
  const isIconOnly = variationKey === "icon_only";
  const isStacked = variationKey === "stacked";

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card transition-all duration-200 hover:border-primary/50 hover:shadow-xs overflow-hidden ${
        isWide ? "w-full" : "w-full"
      }`}
    >
      {/* 1. Artwork Display Stage */}
      <div
        className={`relative flex items-center justify-center border-b border-border/60 select-none overflow-hidden ${
          isIconOnly ? "h-[195px] p-3 flex-col gap-2" : "h-[195px] p-6"
        } ${
          isWhiteStage
            ? "bg-[#0A1128] dark:bg-[#060B18]"
            : isTransparentStage
            ? "bg-muted/10"
            : "bg-muted/15 dark:bg-muted/10"
        }`}
      >
        {/* Transparent Checkerboard / Diamond Graphic Ground */}
        {isTransparentStage && (
          <div
            className="absolute inset-0 pointer-events-none opacity-60 dark:opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)",
              backgroundSize: "16px 16px",
              backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
            }}
          />
        )}

        {/* Primary Green Pill Badge */}
        {isPrimary && (
          <div className="absolute top-3.5 right-3.5 z-10">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-badge font-semibold tracking-wider uppercase">
              PRIMARY
            </span>
          </div>
        )}

        {/* Transparent Alpha Pill Chip */}
        {isTransparentStage && (
          <div className="absolute top-3.5 right-3.5 z-10">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-background/80 dark:bg-background/90 backdrop-blur-xs border border-border/60 text-muted-foreground font-sans text-badge font-semibold tracking-wider">
              PNG · ALPHA
            </span>
          </div>
        )}

        {/* Hover Action Controls (Download & Optional Redraw) */}
        <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {!isPrimary && !isTransparentStage && (
            <button
              type="button"
              onClick={handleDownload}
              className="flex size-7 items-center justify-center rounded-md border border-border/80 bg-background/90 backdrop-blur-xs text-muted-foreground hover:text-foreground hover:border-primary/50 shadow-2xs transition-colors cursor-pointer"
              title="Download this variation"
              aria-label="Download this variation"
            >
              {downloaded ? <Check className="size-3.5 text-emerald-600" /> : <ArrowDownToLine className="size-3.5" />}
            </button>
          )}

          {onRedraw && (
            <div className="relative group/btn">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRedraw();
                }}
                disabled={isRedrawing}
                className="flex size-7 items-center justify-center rounded-md border border-border/80 bg-background/90 backdrop-blur-xs text-muted-foreground hover:text-foreground hover:border-primary/50 shadow-2xs transition-colors cursor-pointer"
                title="Redraw just this variation"
              >
                <RefreshCw className={`size-3.5 ${isRedrawing ? "animate-spin text-primary" : ""}`} />
              </button>
              <div className="absolute right-0 top-full mt-1.5 hidden group-hover/btn:block z-30 whitespace-nowrap px-2 py-1 rounded bg-popover text-popover-foreground text-badge font-mono shadow-md border border-border">
                Redraw just this variation
              </div>
            </div>
          )}
        </div>

        {/* Artwork Render */}
        {isIconOnly ? (
          <div className="flex flex-col items-center justify-center gap-3 size-full">
            {/* Main Center Mark */}
            <div className="size-16 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {assetUri ? (
                <img
                  src={assetUri}
                  alt={`${brandName} mark`}
                  className="max-h-full max-w-full object-contain filter drop-shadow-2xs"
                />
              ) : null}
            </div>

            {/* Scale Fidelity Proofs: 64px, 32px, 16px */}
            <div className="flex items-end justify-center gap-4 pt-1">
              {/* 64px */}
              <div className="flex flex-col items-center gap-1">
                <div className="size-7 rounded border border-border/60 bg-card flex items-center justify-center p-0.5 shadow-2xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {assetUri && (
                    <img src={assetUri} alt="64px proof" className="size-full object-contain" />
                  )}
                </div>
                <span className="font-sans text-badge text-muted-foreground">64px</span>
              </div>

              {/* 32px */}
              <div className="flex flex-col items-center gap-1">
                <div className="size-5 rounded-[3px] border border-border/60 bg-card flex items-center justify-center p-0.5 shadow-2xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {assetUri && (
                    <img src={assetUri} alt="32px proof" className="size-full object-contain" />
                  )}
                </div>
                <span className="font-sans text-badge text-muted-foreground">32px</span>
              </div>

              {/* 16px */}
              <div className="flex flex-col items-center gap-1">
                <div className="size-3.5 rounded-[2px] border border-border/60 bg-card flex items-center justify-center p-[1px] shadow-2xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {assetUri && (
                    <img src={assetUri} alt="16px proof" className="size-full object-contain" />
                  )}
                </div>
                <span className="font-sans text-badge text-muted-foreground">16px</span>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`flex items-center justify-center size-full ${
              isStacked ? "max-h-[140px]" : "max-h-[120px]"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {assetUri ? (
              <img
                src={assetUri}
                alt={`${brandName} ${meta.title}`}
                className="max-h-full max-w-full object-contain transition-transform duration-200 group-hover:scale-102"
              />
            ) : null}
          </div>
        )}
      </div>

      {/* 2. Card Bottom Description & Ratio */}
      <div className="p-4 flex flex-col justify-between bg-card text-card-foreground">
        {/* Title + Ratio Badge */}
        <div className="flex items-center gap-2">
          <span className="font-sans text-badge font-bold text-foreground tracking-wider uppercase">
            {meta.title}
          </span>
          <span className="font-sans text-badge text-muted-foreground bg-muted/70 px-1.5 py-0.2 rounded border border-border/60">
            {meta.aspectRatio}
          </span>
        </div>

        {/* Subtitle / Usage line */}
        <p className="font-sans text-caption text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
          {meta.subtitle}
        </p>
      </div>
    </div>
  );
}
