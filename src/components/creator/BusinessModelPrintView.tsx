"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Printer,
  X,
  Building,
  Zap,
  Key,
  ShieldCheck,
  HeartHandshake,
  Truck,
  Users,
  Scale,
  CreditCard,
} from "lucide-react";
import type { BusinessModelOutput } from "@/types/creator/ai";

function formatCurrencyAmount(val?: unknown, defaultCurrency = "EUR"): string {
  if (val === undefined || val === null) return "—";
  let currency = defaultCurrency;
  let amount: number;

  if (typeof val === "object" && val !== null && "amount" in val) {
    const obj = val as { amount?: number | null; currency?: string };
    if (obj.currency) currency = obj.currency;
    amount = Number(obj.amount);
  } else if (typeof val === "number") {
    amount = val;
  } else if (typeof val === "string") {
    const cleaned = val.replace(/[^0-9.-]/g, "");
    const parsed = parseFloat(cleaned);
    if (Number.isNaN(parsed)) return val;
    amount = parsed;
    if (val.includes("$")) currency = "USD";
    else if (val.includes("£")) currency = "GBP";
    else if (val.includes("€")) currency = "EUR";
  } else {
    return "—";
  }

  if (Number.isNaN(amount)) return "—";
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  if (amount >= 1_000_000_000) {
    const v = amount / 1_000_000_000;
    return `${symbol}${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    const v = amount / 1_000_000;
    return `${symbol}${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    const v = amount / 1_000;
    return `${symbol}${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}K`;
  }
  return `${symbol}${amount.toLocaleString()}`;
}

interface BusinessModelPrintProps {
  open: boolean;
  onClose: () => void;
  projectName?: string;
  logoUrl?: string | null;
  project?: {
    sector?: string;
    geography?: string;
    targetUser?: string;
    problem?: string;
    solution?: string;
    marketGap?: string;
  };
  output: BusinessModelOutput | null | undefined;
  version?: number | null;
  updatedAt?: string | null;
}

const has = (s?: string | null): s is string => !!s && s.trim().length > 0;

export default function BusinessModelPrintView({
  open,
  onClose,
  projectName,
  logoUrl,
  project,
  output,
  version = 1,
  updatedAt,
}: BusinessModelPrintProps) {
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("printing-active");
    return () => document.body.classList.remove("printing-active");
  }, [open]);

  if (!open || typeof document === "undefined" || !output) return null;

  const displayDate = updatedAt
    ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(
        new Date(updatedAt)
      )
    : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(
        new Date()
      );

  const displayProjectName = has(projectName) ? projectName : "AutoInvoice";
  const displaySector = has(project?.sector) ? project.sector : "Subscription, cost-driven";
  const canvas = output.canvas;
  const unitEconomics = output.unitEconomics;
  const tiers = output.revenueTiers || [];
  const assumptions = output.assumptions || [];

  // Payback and LTV:CAC Ratio extraction with fallback
  const paybackValue =
    unitEconomics?.paybackPeriodMonths ??
    (unitEconomics as Record<string, unknown> | undefined)?.paybackMonths;

  const ltvToCacRatio =
    unitEconomics?.ltvToCacRatio !== undefined
      ? unitEconomics.ltvToCacRatio
      : undefined;

  return createPortal(
    <div
      data-print-overlay
      className="fixed inset-0 z-[100] overflow-y-auto bg-neutral-900/70 backdrop-blur-xs print:bg-white print:p-0"
    >
      {/* Floating Toolbar - Never Printed */}
      <div className="no-print sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur-md px-6 py-3.5 shadow-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="gap-2 text-button font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" /> Close
        </Button>

        <div className="flex items-center gap-2 text-badge text-muted-foreground font-mono">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>A4 Executive View · Browser &ldquo;Save as PDF&rdquo;</span>
        </div>

        <Button
          size="sm"
          onClick={() => window.print()}
          className="gap-2 text-button font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
        >
          <Printer className="h-4 w-4" /> Print / Save as PDF
        </Button>
      </div>

      {/* Printable Sheet Container */}
      <div className="print-document mx-auto my-8 max-w-[880px] bg-card text-foreground px-10 py-9 shadow-xl rounded-xl border border-border print:border-none print:shadow-none print:my-0 print:max-w-none print:px-6 print:py-5 print:rounded-none font-sans">
        {/* Header matching Step 3.2 Eyebrow, Title, Logo and Subtitle */}
        <header className="print-section mb-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between gap-4 mb-3">
            <span className="text-badge font-mono font-semibold uppercase tracking-wider text-muted-foreground">
              3.2 / BUSINESS MODEL
            </span>
            <span className="text-badge font-mono text-muted-foreground uppercase">
              Phase 3.2 Output · Version {version ?? 1}
            </span>
          </div>

          {/* Logo + Project Name Row */}
          <div className="flex items-center gap-5">
            {logoUrl && !logoError ? (
              <div className="shrink-0 min-w-[80px] max-w-[130px] h-16 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    logoUrl.trim().startsWith("<svg")
                      ? `data:image/svg+xml;utf8,${encodeURIComponent(logoUrl.trim())}`
                      : logoUrl
                  }
                  alt={`${displayProjectName} Logo`}
                  className="w-full h-full object-contain"
                  onError={() => setLogoError(true)}
                />
              </div>
            ) : (
              <div className="size-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-2xl font-sans shrink-0">
                {displayProjectName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-page-heading font-extrabold tracking-tight text-foreground leading-tight">
                Business model : {displayProjectName}
              </h1>
              <p className="mt-1 text-caption text-muted-foreground font-sans">
                Derived from market study 3.1 · {displaySector} · Last edited {displayDate}
              </p>
            </div>
          </div>
        </header>

        {/* SECTION 1: THE CANVAS — 9 Osterwalder blocks matching 3.2 page */}
        <section className="print-section mb-6 break-inside-avoid">
          <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            {/* Row 1: 5 Columns with Hairline Dividers */}
            <div className="grid grid-cols-5 divide-x divide-border min-h-[300px]">
              {/* Column 1: Key Partners */}
              <div className="p-4 flex flex-col justify-start space-y-2.5 min-w-0">
                <div className="flex items-center gap-1.5 pb-1 border-b border-border/60">
                  <Building className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <h4 className="text-label font-semibold uppercase tracking-wider text-muted-foreground font-sans truncate">
                    Key Partners
                  </h4>
                </div>
                {canvas?.keyPartners && canvas.keyPartners.length > 0 ? (
                  <ul className="text-body text-foreground/90 space-y-2 leading-snug font-sans list-disc pl-3.5">
                    {canvas.keyPartners.map((item, idx) => (
                      <li key={idx} className="break-words">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-caption text-muted-foreground italic font-sans">None defined</p>
                )}
              </div>

              {/* Column 2: Key Activities (Top) + Key Resources (Bottom) */}
              <div className="flex flex-col divide-y divide-border min-w-0">
                {/* Key Activities */}
                <div className="p-4 flex-1 space-y-2.5 min-w-0">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-border/60">
                    <Zap className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <h4 className="text-label font-semibold uppercase tracking-wider text-muted-foreground font-sans truncate">
                      Key Activities
                    </h4>
                  </div>
                  {canvas?.keyActivities && canvas.keyActivities.length > 0 ? (
                    <ul className="text-body text-foreground/90 space-y-2 leading-snug font-sans list-disc pl-3.5">
                      {canvas.keyActivities.map((item, idx) => (
                        <li key={idx} className="break-words">
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-caption text-muted-foreground italic font-sans">None defined</p>
                  )}
                </div>

                {/* Key Resources */}
                <div className="p-4 flex-1 space-y-2.5 min-w-0">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-border/60">
                    <Key className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <h4 className="text-label font-semibold uppercase tracking-wider text-muted-foreground font-sans truncate">
                      Key Resources
                    </h4>
                  </div>
                  {canvas?.keyResources && canvas.keyResources.length > 0 ? (
                    <ul className="text-body text-foreground/90 space-y-2 leading-snug font-sans list-disc pl-3.5">
                      {canvas.keyResources.map((item, idx) => (
                        <li key={idx} className="break-words">
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-caption text-muted-foreground italic font-sans">None defined</p>
                  )}
                </div>
              </div>

              {/* Column 3: Value Propositions (Center Focal Column, Highlighted Border) */}
              <div className="p-4 flex flex-col justify-start space-y-2.5 border-l-2 border-primary bg-primary/5 min-w-0">
                <div className="flex items-center justify-between gap-1 pb-1 border-b border-primary/20">
                  <div className="flex items-center gap-1.5 text-primary">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <h4 className="text-label font-bold uppercase tracking-wider font-sans truncate">
                      Value Propositions
                    </h4>
                  </div>
                </div>

                {canvas?.valuePropositions && canvas.valuePropositions.length > 0 ? (
                  <div className="space-y-3 pt-0.5">
                    {canvas.valuePropositions.map((vp, idx) => (
                      <div key={idx} className="space-y-1">
                        <h5 className="text-body font-semibold text-foreground leading-snug font-sans break-words">
                          {vp.headline}
                        </h5>
                        <p className="text-caption text-muted-foreground leading-relaxed font-sans break-words">
                          {vp.details}
                        </p>
                        {vp.marketStudyFootnote ? (
                          <div className="text-footnote text-primary font-mono font-medium pt-0.5 break-words">
                            ← {vp.marketStudyFootnote}
                          </div>
                        ) : (
                          <div className="text-footnote text-muted-foreground font-mono pt-0.5 break-words">
                            ← 3.1 §4
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-caption text-muted-foreground italic font-sans">None defined</p>
                )}
              </div>

              {/* Column 4: Customer Relationships (Top) + Channels (Bottom) */}
              <div className="flex flex-col divide-y divide-border min-w-0">
                {/* Customer Relationships */}
                <div className="p-4 flex-1 space-y-2.5 min-w-0">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-border/60">
                    <HeartHandshake className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <h4 className="text-label font-semibold uppercase tracking-wider text-muted-foreground font-sans truncate">
                      Customer Relationships
                    </h4>
                  </div>
                  {canvas?.customerRelationships && canvas.customerRelationships.length > 0 ? (
                    <ul className="text-body text-foreground/90 space-y-2 leading-snug font-sans list-disc pl-3.5">
                      {canvas.customerRelationships.map((item, idx) => (
                        <li key={idx} className="break-words">
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-caption text-muted-foreground italic font-sans">None defined</p>
                  )}
                </div>

                {/* Channels */}
                <div className="p-4 flex-1 space-y-2.5 min-w-0">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-border/60">
                    <Truck className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <h4 className="text-label font-semibold uppercase tracking-wider text-muted-foreground font-sans truncate">
                      Channels
                    </h4>
                  </div>
                  {canvas?.channels && canvas.channels.length > 0 ? (
                    <ul className="text-body text-foreground/90 space-y-2 leading-snug font-sans list-disc pl-3.5">
                      {canvas.channels.map((item, idx) => (
                        <li key={idx} className="break-words">
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-caption text-muted-foreground italic font-sans">None defined</p>
                  )}
                </div>
              </div>

              {/* Column 5: Customer Segments */}
              <div className="p-4 flex flex-col justify-start space-y-2.5 min-w-0">
                <div className="flex items-center gap-1.5 pb-1 border-b border-border/60">
                  <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <h4 className="text-label font-semibold uppercase tracking-wider text-muted-foreground font-sans truncate">
                    Customer Segments
                  </h4>
                </div>
                {canvas?.customerSegments && canvas.customerSegments.length > 0 ? (
                  <div className="space-y-2.5 pt-0.5">
                    {canvas.customerSegments.map((seg, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="text-body font-medium text-foreground/90 font-sans break-words leading-snug">
                          {seg.segment}
                        </div>
                        {seg.marketStudyFootnote ? (
                          <div className="text-footnote text-muted-foreground font-mono break-words">
                            ← {seg.marketStudyFootnote}
                          </div>
                        ) : (
                          <div className="text-footnote text-muted-foreground font-mono break-words">
                            ← 3.1 §2
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-caption text-muted-foreground italic font-sans">None defined</p>
                )}
              </div>
            </div>

            {/* Row 2: Cost Structure and Revenue Streams (Split Full Width) */}
            <div className="grid grid-cols-2 divide-x divide-border border-t border-border bg-muted/20">
              {/* Cost Structure */}
              <div className="p-4 flex flex-col justify-start space-y-2 min-w-0">
                <div className="flex items-center gap-1.5 pb-1 border-b border-border/60">
                  <Scale className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <h4 className="text-label font-semibold uppercase tracking-wider text-muted-foreground font-sans">
                    Cost Structure
                  </h4>
                </div>
                {canvas?.costStructure && canvas.costStructure.length > 0 ? (
                  <ul className="text-body text-foreground/90 space-y-1.5 leading-snug font-sans list-disc pl-3.5">
                    {canvas.costStructure.map((item, idx) => (
                      <li key={idx} className="break-words">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-caption text-muted-foreground italic font-sans">None defined</p>
                )}
              </div>

              {/* Revenue Streams */}
              <div className="p-4 flex flex-col justify-start space-y-2 min-w-0">
                <div className="flex items-center gap-1.5 pb-1 border-b border-border/60">
                  <CreditCard className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <h4 className="text-label font-semibold uppercase tracking-wider text-muted-foreground font-sans">
                    Revenue Streams
                  </h4>
                </div>
                {canvas?.revenueStreams && canvas.revenueStreams.length > 0 ? (
                  <div className="space-y-2">
                    {canvas.revenueStreams.map((rev, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="text-body font-medium text-foreground/90 font-sans break-words leading-snug">
                          {rev.stream}
                        </div>
                        {rev.marketStudyFootnote ? (
                          <div className="text-footnote text-muted-foreground font-mono break-words">
                            ← {rev.marketStudyFootnote}
                          </div>
                        ) : (
                          <div className="text-footnote text-muted-foreground font-mono break-words">
                            ← 3.1 §1
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-caption text-muted-foreground italic font-sans">None defined</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: UNIT ECONOMICS STRIP — 5 metric columns matching 3.2 page */}
        {unitEconomics && (
          <section className="print-section mb-6 break-inside-avoid">
            <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
              <div className="grid grid-cols-5 divide-x divide-border">
                {/* Metric 1: ARPU */}
                <div className="px-3 py-1 space-y-1 flex flex-col justify-between min-w-0">
                  <span className="text-label font-semibold uppercase tracking-wider text-muted-foreground font-sans truncate">
                    ARPU
                  </span>
                  <div className="flex items-baseline gap-1 flex-wrap">
                    <span className="text-xl font-bold font-mono text-foreground tracking-tight">
                      {formatCurrencyAmount(unitEconomics.arpu)}
                    </span>
                    <span className="text-footnote text-muted-foreground font-sans">/ mo</span>
                  </div>
                  <span className="text-caption text-muted-foreground font-sans block truncate leading-tight">
                    {unitEconomics.arpu?.period ? `Tier mix ${unitEconomics.arpu.period}` : "Tier mix 60-30-10"}
                  </span>
                </div>

                {/* Metric 2: CAC */}
                <div className="px-3 py-1 space-y-1 flex flex-col justify-between min-w-0">
                  <span className="text-label font-semibold uppercase tracking-wider text-muted-foreground font-sans truncate">
                    CAC
                  </span>
                  <div className="text-xl font-bold font-mono text-foreground tracking-tight">
                    {formatCurrencyAmount(unitEconomics.cac)}
                  </div>
                  <span className="text-caption text-muted-foreground font-sans block truncate leading-tight">
                    {unitEconomics.cac && typeof unitEconomics.cac === "object" && "isModelled" in unitEconomics.cac && unitEconomics.cac.isModelled
                      ? "Blended, self-serve + content"
                      : "Baseline acquisition"}
                  </span>
                </div>

                {/* Metric 3: LTV */}
                <div className="px-3 py-1 space-y-1 flex flex-col justify-between min-w-0">
                  <span className="text-label font-semibold uppercase tracking-wider text-muted-foreground font-sans truncate">
                    LTV
                  </span>
                  <div className="text-xl font-bold font-mono text-foreground tracking-tight">
                    {formatCurrencyAmount(unitEconomics.ltv)}
                  </div>
                  <span className="text-caption text-muted-foreground font-sans block truncate leading-tight">
                    22-mo avg retention
                  </span>
                </div>

                {/* Metric 4: LTV:CAC (Emerald Highlight) */}
                <div className="px-3 py-1 space-y-1 flex flex-col justify-between min-w-0">
                  <span className="text-label font-semibold uppercase tracking-wider text-muted-foreground font-sans truncate">
                    LTV:CAC
                  </span>
                  <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
                    {ltvToCacRatio !== undefined ? `${Number(ltvToCacRatio).toFixed(1)}x` : "—"}
                  </div>
                  <span className="text-caption text-muted-foreground font-sans block truncate leading-tight">
                    Healthy above 3x
                  </span>
                </div>

                {/* Metric 5: PAYBACK */}
                <div className="px-3 py-1 space-y-1 flex flex-col justify-between min-w-0">
                  <span className="text-label font-semibold uppercase tracking-wider text-muted-foreground font-sans truncate">
                    PAYBACK
                  </span>
                  <div className="text-xl font-bold font-mono text-foreground tracking-tight">
                    {paybackValue !== undefined ? `${paybackValue} mo` : "—"}
                  </div>
                  <span className="text-caption text-muted-foreground font-sans block truncate leading-tight">
                    Gross-margin adjusted
                  </span>
                </div>
              </div>

              {/* Muted Disclaimer Caption */}
              <div className="pt-2.5 border-t border-border/50 text-caption text-muted-foreground font-sans leading-relaxed">
                Modelled from pricing assumptions — not yet validated against real customers.
              </div>

              {unitEconomics.commentary && (
                <div className="pt-2 text-caption text-foreground/80 font-sans border-t border-border/40 leading-relaxed">
                  <span className="font-semibold text-foreground">Economic Commentary:</span>{" "}
                  {unitEconomics.commentary}
                </div>
              )}
            </div>
          </section>
        )}

        {/* SECTION 3: TWO EQUAL SECTIONS — Revenue Model Detail & Model Assumptions to Test */}
        <section className="print-section grid grid-cols-1 md:grid-cols-2 gap-5 items-start break-inside-avoid">
          {/* Left Card: Revenue Model Detail Table */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-border">
              <h3 className="text-card-title font-semibold uppercase tracking-wider text-foreground font-sans">
                Revenue Model Detail
              </h3>
              <span className="text-badge font-mono text-muted-foreground">EUR (€)</span>
            </div>

            {tiers && tiers.length > 0 ? (
              <div className="w-full">
                <table className="w-full text-left text-body table-auto">
                  <thead>
                    <tr className="border-b border-border text-table-header font-semibold uppercase tracking-wider text-muted-foreground font-sans">
                      <th className="pb-2 pr-2 font-semibold">Tier</th>
                      <th className="pb-2 pr-2 font-semibold">Price</th>
                      <th className="pb-2 pr-2 font-semibold">Target Segment</th>
                      <th className="pb-2 font-semibold text-right whitespace-nowrap">% of Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {tiers.map((tier, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 pr-2 align-top">
                          <div className="font-medium text-body text-foreground font-sans break-words leading-snug">
                            {tier.tierName}
                          </div>
                          {tier.features && tier.features.length > 0 && (
                            <div className="text-caption text-muted-foreground/80 font-sans mt-0.5 leading-tight break-words">
                              {tier.features.join(" · ")}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 pr-2 align-top font-mono font-medium text-body text-foreground break-words leading-snug">
                          {tier.pricing}
                        </td>
                        <td className="py-2.5 pr-2 align-top text-body text-muted-foreground font-sans break-words leading-snug">
                          {tier.targetSegment}
                        </td>
                        <td className="py-2.5 align-top text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <span className="font-mono text-body font-medium text-foreground">
                              {tier.projectedContributionPct !== undefined
                                ? `${tier.projectedContributionPct}%`
                                : "—"}
                            </span>
                            {tier.projectedContributionPct !== undefined && (
                              <div className="w-10 h-1.5 bg-muted rounded-full overflow-hidden shrink-0 inline-block align-middle">
                                <div
                                  className="h-full bg-muted-foreground/60 rounded-full"
                                  style={{
                                    width: `${Math.min(100, Math.max(0, tier.projectedContributionPct))}%`,
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-caption text-muted-foreground italic font-sans py-3">
                No pricing tiers defined.
              </p>
            )}
          </div>

          {/* Right Card: Model Assumptions to Test */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-border">
              <h3 className="text-card-title font-semibold uppercase tracking-wider text-foreground font-sans">
                Model Assumptions to Test
              </h3>
              <span className="text-badge font-mono text-muted-foreground">
                {assumptions.length} ACTIVE
              </span>
            </div>

            {assumptions && assumptions.length > 0 ? (
              <div className="space-y-3">
                {assumptions.map((item, idx) => {
                  const isBenchmark = item.evidenceLevel === "evidenced";
                  const isModelled = item.evidenceLevel === "modelled";

                  return (
                    <div
                      key={idx}
                      className="flex items-start justify-between gap-2.5 text-body leading-relaxed min-w-0"
                    >
                      <div className="flex items-start gap-1.5 min-w-0 flex-1">
                        <span className="font-mono text-badge text-muted-foreground shrink-0 pt-0.5">
                          {idx + 1}.
                        </span>
                        <div className="text-body text-foreground/90 font-sans break-words leading-relaxed min-w-0 flex-1">
                          {item.category && (
                            <span className="font-mono text-footnote uppercase font-semibold text-muted-foreground mr-1 break-words">
                              [{item.category}]
                            </span>
                          )}
                          {item.assumption}
                        </div>
                      </div>

                      {/* Right-aligned Mapped Evidence Label */}
                      <div className="shrink-0 pt-0.5 ml-1">
                        {isBenchmark ? (
                          <span className="text-badge font-medium text-teal-600 dark:text-teal-400 font-sans whitespace-nowrap">
                            Benchmark-backed
                          </span>
                        ) : isModelled ? (
                          <span className="text-badge font-medium text-amber-600 dark:text-amber-400 font-sans whitespace-nowrap">
                            Modelled
                          </span>
                        ) : (
                          <span className="text-badge font-medium text-muted-foreground font-sans whitespace-nowrap">
                            Untested
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-caption text-muted-foreground italic font-sans py-3">
                No active assumptions recorded.
              </p>
            )}
          </div>
        </section>

        {/* Document Footer */}
        <footer className="mt-8 pt-3 border-t border-border flex items-center justify-between text-footnote font-mono text-muted-foreground">
          <span>Mondial ECO Platform · Autonomous Startup Synthesis Engine</span>
          <span>Verified Confidential · Phase 3.2</span>
        </footer>
      </div>
    </div>,
    document.body
  );
}
