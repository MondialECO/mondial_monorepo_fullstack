"use client";

import React, { useState } from "react";
import { Download, Check } from "lucide-react";
import { BrandLogoVariation } from "@/types/creator/brand-kit";
import { MultiScaleIconViewer } from "./MultiScaleIconViewer";

export interface VariationTileProps {
  variationKey: string;
  variation: BrandLogoVariation;
  brandName?: string;
  isWide?: boolean;
}

const VARIATION_LABELS: Record<string, { title: string; subtitle: string }> = {
  primary: {
    title: "Primary Logo",
    subtitle: "Default lockup for hero brand placements",
  },
  horizontal: {
    title: "Horizontal Lockup",
    subtitle: "Navbars, headers & landscape banners",
  },
  stacked: {
    title: "Stacked Lockup",
    subtitle: "Square cards, badges & centered packaging",
  },
  icon_only: {
    title: "Icon Only",
    subtitle: "Multi-scale favicons, avatars & app icons",
  },
  black: {
    title: "Black Monochrome",
    subtitle: "Single-ink print, fax & light high-contrast",
  },
  white: {
    title: "White Monochrome",
    subtitle: "Dark backgrounds, photography & video overlays",
  },
  transparent: {
    title: "Transparent Background",
    subtitle: "Alpha channel for overlays & fluid backdrops",
  },
};

export function VariationTile({
  variationKey,
  variation,
  brandName = "Brand",
  isWide = false,
}: VariationTileProps) {
  const [downloaded, setDownloaded] = useState(false);
  const meta = VARIATION_LABELS[variationKey] || {
    title: variationKey.replace(/_/g, " "),
    subtitle: "Brand variation",
  };

  const assetUri = variation.svgUri || variation.pngUri || "";

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!assetUri) return;

    try {
      const isPng = variationKey === "transparent" && variation.pngUri;
      const fileUri = (isPng ? variation.pngUri : variation.svgUri) || assetUri;
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

  const isWhiteStage = variationKey === "white";
  const isTransparentStage = variationKey === "transparent";
  const isIconOnly = variationKey === "icon_only";

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-md ${
        isWide ? "min-h-[220px]" : "min-h-[200px]"
      }`}
    >
      {/* Header with Title and Single-Asset Download */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight text-foreground">
            {meta.title}
          </span>
          <span className="text-[11px] text-muted-foreground line-clamp-1">
            {meta.subtitle}
          </span>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          title={`Download ${meta.title} file`}
          aria-label={`Download ${meta.title}`}
          className="relative inline-flex size-7 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary hover:border-primary/30 active:scale-95"
        >
          {downloaded ? (
            <Check className="size-3.5 text-emerald-500" />
          ) : (
            <Download className="size-3.5" />
          )}
        </button>
      </div>

      {/* Visual Artwork Stage */}
      <div className="flex flex-1 items-center justify-center my-2">
        {isIconOnly ? (
          <MultiScaleIconViewer iconUri={assetUri} brandName={brandName} />
        ) : isWhiteStage ? (
          /* Isolated dark ground for White Monochrome */
          <div className="relative flex h-[100px] w-full items-center justify-center rounded-lg bg-[#0F172A] p-4 shadow-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {assetUri ? (
              <img
                src={assetUri}
                alt={`${brandName} ${meta.title}`}
                className="max-h-full max-w-full object-contain filter drop-shadow-sm"
              />
            ) : null}
          </div>
        ) : isTransparentStage ? (
          /* Real CSS checkerboard for Transparent Background */
          <div
            className="relative flex h-[100px] w-full items-center justify-center rounded-lg border border-border/60 p-4 shadow-inner"
            style={{
              backgroundImage:
                "linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)",
              backgroundSize: "16px 16px",
              backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
              backgroundColor: "#ffffff",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {assetUri ? (
              <img
                src={variation.pngUri || assetUri}
                alt={`${brandName} ${meta.title}`}
                className="max-h-full max-w-full object-contain relative z-10"
              />
            ) : null}
          </div>
        ) : (
          /* Standard Light Stage */
          <div className="relative flex h-[100px] w-full items-center justify-center rounded-lg bg-muted/20 border border-border/40 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {assetUri ? (
              <img
                src={assetUri}
                alt={`${brandName} ${meta.title}`}
                className="max-h-full max-w-full object-contain"
              />
            ) : null}
          </div>
        )}
      </div>

      {/* Usage Note Footer */}
      <div className="mt-2 pt-2.5 border-t border-border/40">
        <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
          {variation.usageNote || meta.subtitle}
        </p>
      </div>
    </div>
  );
}
