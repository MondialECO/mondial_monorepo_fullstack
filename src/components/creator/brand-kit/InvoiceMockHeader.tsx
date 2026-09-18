"use client";

import React from "react";
import { resolveMediaUrl } from "@/lib/brand-kit-media";

interface InvoiceMockHeaderProps {
  lockupUri: string;
  conceptName: string;
}

export function InvoiceMockHeader({
  lockupUri,
  conceptName,
}: InvoiceMockHeaderProps) {
  return (
    <div className="w-full flex flex-col rounded-xl bg-card border border-border/80 p-3 shadow-2xs text-caption overflow-hidden">
      {/* Mock Invoice Topbar / Header */}
      <div className="flex items-start justify-between border-b border-border/50 pb-2.5 mb-2.5">
        <div className="flex items-center gap-2 max-w-[60%]">
          <div className="relative h-7 max-w-[120px] flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveMediaUrl(lockupUri)}
              alt={`${conceptName} invoice header lockup`}
              className="h-full w-auto object-contain"
            />
          </div>
        </div>
        <div className="text-right">
          <div className="font-semibold text-foreground tracking-tight text-badge uppercase">
            Invoice
          </div>
          <div className="font-mono text-badge text-muted-foreground tabular-nums">
            #INV-2026-0042
          </div>
        </div>
      </div>

      {/* Mock Billed To & Total */}
      <div className="grid grid-cols-2 gap-2 text-caption text-muted-foreground">
        <div>
          <span className="text-badge uppercase tracking-wider block text-muted-foreground/80">
            Billed To
          </span>
          <span className="font-medium text-foreground">Acme Corp Global</span>
        </div>
        <div className="text-right">
          <span className="text-badge uppercase tracking-wider block text-muted-foreground/80">
            Amount Due
          </span>
          <span className="font-mono font-semibold text-foreground tabular-nums text-caption">
            $12,450.00
          </span>
        </div>
      </div>
    </div>
  );
}
