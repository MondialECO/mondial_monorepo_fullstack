import { useTranslation } from "@/hooks/useTranslation";
"use client";

import React from "react";
import { resolveMediaUrl } from "@/lib/brand-kit-media";

interface InvoiceMockHeaderProps {
  lockupUri: string;
  conceptName: string;
}

export function InvoiceMockHeader({ lockupUri,
  conceptName, }: InvoiceMockHeaderProps) {
  const { t } = useTranslation("creator");
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
            {t("modals.invoiceTitle")}
          </div>
          <div className="font-mono text-badge text-muted-foreground tabular-nums">
            {t("modals.invoiceNumber")}
          </div>
        </div>
      </div>

      {/* Mock Billed To & Total */}
      <div className="grid grid-cols-2 gap-2 text-caption text-muted-foreground">
        <div>
          <span className="text-badge uppercase tracking-wider block text-muted-foreground/80">
            {t("modals.invoiceBilledTo")}
          </span>
          <span className="font-medium text-foreground">{t("modals.invoiceAcme")}</span>
        </div>
        <div className="text-right">
          <span className="text-badge uppercase tracking-wider block text-muted-foreground/80">
            {t("modals.invoiceAmountDue")}
          </span>
          <span className="font-mono font-semibold text-foreground tabular-nums text-caption">
            $12,450.00
          </span>
        </div>
      </div>
    </div>
  );
}
