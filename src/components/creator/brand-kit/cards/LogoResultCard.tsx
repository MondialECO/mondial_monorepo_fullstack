import React from "react";
import { BrandLogo } from "@/types/creator/brand-kit";
import { resolveMediaUrl } from "@/lib/brand-kit-media";
import { CheckCircle2, Edit3, Layers } from "lucide-react";

interface LogoResultCardProps {
  logo?: BrandLogo;
  brandName?: string;
  onEdit?: () => void;
}

export function LogoResultCard({ logo, brandName = "Brand", onEdit }: LogoResultCardProps) {
  if (!logo?.approvedAt && !logo?.selectedConceptKey) return null;

  const concept =
    logo.concepts?.find((c) => c.key === logo.selectedConceptKey) ||
    logo.concepts?.[0];

  const primaryVariation = logo.variations?.primary;
  const rawLockupAsset = primaryVariation?.svgUri || concept?.lockupAssetUri || concept?.markAssetUri;
  const lockupAsset = resolveMediaUrl(rawLockupAsset, logo.regenerateCount);
  const variationCount = logo.variations ? Object.keys(logo.variations).length : 0;
  const isApproved = Boolean(logo.approvedAt);

  return (
    <div
      onClick={onEdit}
      className="group relative w-full max-w-4xl rounded-2xl border border-border/80 bg-white p-6 shadow-sm transition-all duration-200 hover:border-primary/50 hover:shadow-md cursor-pointer"
    >
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`flex size-7 items-center justify-center rounded-full ${isApproved ? "bg-emerald-500/10 text-emerald-600" : "bg-blue-500/10 text-blue-600"}`}>
            {isApproved ? <CheckCircle2 className="size-4" /> : <Layers className="size-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-badge font-semibold text-primary uppercase tracking-wider">
                STEP 4
              </span>
              <span className="text-badge text-muted-foreground">•</span>
              <span className="text-caption text-muted-foreground font-medium">Brand Logo & Variations</span>
            </div>
            <h3 className="text-card-title font-bold text-foreground tracking-tight">
              {concept?.descriptorLine || "Approved Vector Mark"}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.();
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 text-button font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <Edit3 className="size-3.5" />
          {isApproved ? "Review Variations" : "Continue Selection"}
        </button>
      </div>

      {/* Visual stage + variations badge */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl bg-muted/20 border border-border/40 p-4">
        <div className="relative flex h-20 w-full sm:w-64 items-center justify-center rounded-lg bg-card border border-border/60 p-3 shadow-2xs">
          {lockupAsset ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={`${logo.selectedConceptKey}-${logo.regenerateCount ?? 0}-${lockupAsset}`}
              src={lockupAsset}
              alt={`${brandName} Approved Logo`}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <span className="text-caption text-muted-foreground">Logo Asset</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-badge font-semibold font-mono">
              <Layers className="size-3" />
              {variationCount >= 7 ? "7/7 VARIATIONS DERIVED" : "CONCEPT SELECTED"}
            </span>
            {isApproved && (
              <span className="text-caption text-emerald-600 font-medium">
                • Production Approved
              </span>
            )}
          </div>
          <p className="text-body text-muted-foreground leading-relaxed">
            {isApproved
              ? "All 7 canonical formats (Primary, Horizontal, Stacked, Icon Only, Black, White, Transparent) verified and synced to Project Branding."
              : "Concept selected. Open Variations review to finalize full 7-asset production set."}
          </p>
        </div>
      </div>
    </div>
  );
}
