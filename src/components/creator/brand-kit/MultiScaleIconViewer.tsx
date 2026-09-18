"use client";

import React from "react";
import { resolveMediaUrl } from "@/lib/brand-kit-media";

interface MultiScaleIconViewerProps {
  iconUri: string;
  brandName?: string;
}

export function MultiScaleIconViewer({
  iconUri,
  brandName = "Brand",
}: MultiScaleIconViewerProps) {
  const resolvedIconUri = resolveMediaUrl(iconUri);

  const scales = [
    { size: 64, label: "64×64px", containerClass: "size-16 p-2 rounded-xl" },
    { size: 32, label: "32×32px", containerClass: "size-8 p-1 rounded-md" },
    { size: 16, label: "16×16px", containerClass: "size-4 p-0.5 rounded-[3px]" },
  ];

  return (
    <div className="flex flex-col items-center justify-center gap-2 py-1 w-full">
      <div className="flex items-end justify-center gap-5 p-3 rounded-xl bg-muted/30 border border-border/50">
        {scales.map(({ size, label, containerClass }) => (
          <div key={size} className="flex flex-col items-center gap-1.5">
            <div
              className={`relative overflow-hidden bg-card border border-border shadow-2xs flex items-center justify-center ${containerClass}`}
            >
              {/* Subtle alignment grid overlay on 64px */}
              {size === 64 && (
                <div
                  className="absolute inset-0 opacity-[0.06] pointer-events-none"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
                    backgroundSize: "8px 8px",
                  }}
                />
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {resolvedIconUri ? (
                <img
                  src={resolvedIconUri}
                  alt={`${brandName} icon ${label}`}
                  className="size-full object-contain relative z-10"
                />
              ) : null}
            </div>
            <span className="text-badge font-mono text-muted-foreground tabular-nums">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
