"use client";

import React from "react";

interface MicroScaleViewerProps {
  markUri: string;
  conceptName: string;
}

export function MicroScaleViewer({ markUri, conceptName }: MicroScaleViewerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-2 w-full">
      <div className="flex items-center justify-center gap-6 p-4 rounded-xl bg-muted/40 border border-border/60">
        {/* Actual 16x16 px rendering */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="relative size-[16px] overflow-hidden rounded-[2px] bg-card border border-border shadow-2xs flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={markUri}
              alt={`${conceptName} 16px icon`}
              className="size-full object-contain"
            />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
            16×16px
          </span>
        </div>

        <div className="h-10 w-px bg-border/60" />

        {/* 4x Magnified Inspection Loupe */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="relative size-[64px] rounded-lg bg-card border border-border shadow-xs overflow-hidden flex items-center justify-center p-1.5">
            {/* Pixel / alignment grid overlay */}
            <div
              className="absolute inset-0 opacity-[0.08] pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
                backgroundSize: "8px 8px",
              }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={markUri}
              alt={`${conceptName} magnified inspection`}
              className="size-full object-contain relative z-10 filter drop-shadow-2xs"
            />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
            4× Inspection
          </span>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground text-center">
        Micro-scale favicon and taskbar legibility preview
      </p>
    </div>
  );
}
