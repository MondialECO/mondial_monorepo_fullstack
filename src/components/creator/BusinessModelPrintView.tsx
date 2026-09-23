"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Printer, X, Check } from "lucide-react";
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
          className="gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
        >
          <X className="h-4 w-4" /> Close
        </Button>

        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>A4 Executive View · Browser &ldquo;Save as PDF&rdquo;</span>
        </div>

        <Button
          size="sm"
          onClick={() => window.print()}
          className="gap-2 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm cursor-pointer"
        >
          <Printer className="h-4 w-4" /> Print / Save as PDF
        </Button>
      </div>

      {/* Printable Sheet Container */}
      <div className="print-document mx-auto my-8 max-w-[960px] bg-white text-neutral-900 px-10 py-9 shadow-xl rounded-xl border border-neutral-200 print:border-none print:shadow-none print:my-0 print:max-w-none print:px-6 print:py-5 print:rounded-none font-sans">
        {/* Header matching Step 3.2 Eyebrow, Title, Logo and Subtitle */}
        <header className="print-section mb-6 pb-4 border-b border-neutral-200">
          <div className="flex items-center justify-between gap-4 mb-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-400">
              3.2 / BUSINESS MODEL
            </span>
            <span className="text-xs font-mono text-neutral-400 uppercase">
              Phase 3.2 Output · Version {version ?? 1}
            </span>
          </div>

          {/* Logo + Project Name Row */}
          <div className="flex items-center gap-5">
            {logoUrl && !logoError ? (
              <div className="shrink-0 min-w-[70px] max-w-[120px] h-14 flex items-center justify-center overflow-hidden">
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
              <div className="size-14 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-2xl font-heading shrink-0">
                {displayProjectName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 leading-tight font-heading">
                Business model : {displayProjectName}
              </h1>
              <p className="mt-1 text-xs text-neutral-500 font-sans">
                Derived from market study 3.1 · {displaySector} · Last edited {displayDate}
              </p>
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* SECTION 0: THE CANVAS — 9 Osterwalder blocks matching Figma 3.2 layout */}
        {/* ========================================================================= */}
        <section className="print-section mb-6 break-inside-avoid space-y-3">
          {/* Upper Region: 5 Equal Columns */}
          <div className="grid grid-cols-5 gap-2.5 items-stretch text-neutral-900">
            {/* Column 1: Key Partners (01) */}
            <div className="rounded-lg border border-neutral-300 bg-neutral-50/50 flex flex-col overflow-hidden">
              <div className="px-3 py-2 flex items-center justify-between border-b border-neutral-200 bg-white">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-badge font-semibold text-neutral-400">01</span>
                  <h4 className="font-heading text-badge font-bold uppercase tracking-wider text-neutral-800">
                    Key Partners
                  </h4>
                </div>
                <span className="text-badge font-sans text-neutral-400">
                  {canvas?.keyPartners?.length ?? 0}
                </span>
              </div>
              <div className="p-2.5 flex-1 flex flex-col gap-1.5">
                {canvas?.keyPartners && canvas.keyPartners.length > 0 ? (
                  canvas.keyPartners.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded bg-white border border-neutral-200 p-2 text-caption font-sans text-neutral-800 leading-snug break-words"
                    >
                      {item}
                    </div>
                  ))
                ) : (
                  <p className="text-caption text-neutral-400 italic py-1">None defined</p>
                )}
              </div>
            </div>

            {/* Column 2: Key Activities (02) & Key Resources (03) */}
            <div className="flex flex-col gap-2.5">
              {/* 02 Key Activities */}
              <div className="rounded-lg border border-neutral-300 bg-neutral-50/50 flex-1 flex flex-col overflow-hidden">
                <div className="px-3 py-2 flex items-center justify-between border-b border-neutral-200 bg-white">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-badge font-semibold text-neutral-400">02</span>
                    <h4 className="font-heading text-badge font-bold uppercase tracking-wider text-neutral-800">
                      Key Activities
                    </h4>
                  </div>
                  <span className="text-badge font-sans text-neutral-400">
                    {canvas?.keyActivities?.length ?? 0}
                  </span>
                </div>
                <div className="p-2.5 flex-1 flex flex-col gap-1.5">
                  {canvas?.keyActivities && canvas.keyActivities.length > 0 ? (
                    canvas.keyActivities.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded bg-white border border-neutral-200 p-2 text-caption font-sans text-neutral-800 leading-snug break-words"
                      >
                        {item}
                      </div>
                    ))
                  ) : (
                    <p className="text-caption text-neutral-400 italic py-1">None defined</p>
                  )}
                </div>
              </div>

              {/* 03 Key Resources */}
              <div className="rounded-lg border border-neutral-300 bg-neutral-50/50 flex-1 flex flex-col overflow-hidden">
                <div className="px-3 py-2 flex items-center justify-between border-b border-neutral-200 bg-white">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-badge font-semibold text-neutral-400">03</span>
                    <h4 className="font-heading text-badge font-bold uppercase tracking-wider text-neutral-800">
                      Key Resources
                    </h4>
                  </div>
                  <span className="text-badge font-sans text-neutral-400">
                    {canvas?.keyResources?.length ?? 0}
                  </span>
                </div>
                <div className="p-2.5 flex-1 flex flex-col gap-1.5">
                  {canvas?.keyResources && canvas.keyResources.length > 0 ? (
                    canvas.keyResources.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded bg-white border border-neutral-200 p-2 text-caption font-sans text-neutral-800 leading-snug break-words"
                      >
                        {item}
                      </div>
                    ))
                  ) : (
                    <p className="text-caption text-neutral-400 italic py-1">None defined</p>
                  )}
                </div>
              </div>
            </div>

            {/* Column 3: Value Propositions (04) */}
            <div className="rounded-lg border-2 border-neutral-800 bg-neutral-50/50 flex flex-col overflow-hidden">
              <div className="px-3 py-2 flex items-center justify-between border-b border-neutral-300 bg-white">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-badge font-semibold text-neutral-800">04</span>
                  <h4 className="font-heading text-badge font-bold uppercase tracking-wider text-neutral-900">
                    Value Propositions
                  </h4>
                </div>
                <span className="text-badge font-sans text-neutral-400">
                  {canvas?.valuePropositions?.length ?? 0}
                </span>
              </div>
              <div className="p-2.5 flex-1 flex flex-col gap-1.5">
                {canvas?.valuePropositions && canvas.valuePropositions.length > 0 ? (
                  canvas.valuePropositions.map((vp, idx) => (
                    <div
                      key={idx}
                      className="rounded bg-white border border-neutral-200 p-2 flex flex-col gap-0.5"
                    >
                      <span className="text-caption font-semibold font-sans text-neutral-900 leading-snug break-words">
                        {vp.headline}
                      </span>
                      {vp.details && vp.details !== vp.headline && (
                        <span className="text-caption font-sans text-neutral-500 leading-tight break-words">
                          {vp.details}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-caption text-neutral-400 italic py-1">None defined</p>
                )}
              </div>
            </div>

            {/* Column 4: Customer Relationships (05) & Channels (06) */}
            <div className="flex flex-col gap-2.5">
              {/* 05 Customer Relationships */}
              <div className="rounded-lg border border-neutral-300 bg-neutral-50/50 flex-1 flex flex-col overflow-hidden">
                <div className="px-3 py-2 flex items-center justify-between border-b border-neutral-200 bg-white">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-badge font-semibold text-neutral-400">05</span>
                    <h4 className="font-heading text-badge font-bold uppercase tracking-wider text-neutral-800">
                      Relationships
                    </h4>
                  </div>
                  <span className="text-badge font-sans text-neutral-400">
                    {canvas?.customerRelationships?.length ?? 0}
                  </span>
                </div>
                <div className="p-2.5 flex-1 flex flex-col gap-1.5">
                  {canvas?.customerRelationships && canvas.customerRelationships.length > 0 ? (
                    canvas.customerRelationships.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded bg-white border border-neutral-200 p-2 text-caption font-sans text-neutral-800 leading-snug break-words"
                      >
                        {item}
                      </div>
                    ))
                  ) : (
                    <p className="text-caption text-neutral-400 italic py-1">None defined</p>
                  )}
                </div>
              </div>

              {/* 06 Channels */}
              <div className="rounded-lg border border-neutral-300 bg-neutral-50/50 flex-1 flex flex-col overflow-hidden">
                <div className="px-3 py-2 flex items-center justify-between border-b border-neutral-200 bg-white">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-badge font-semibold text-neutral-400">06</span>
                    <h4 className="font-heading text-badge font-bold uppercase tracking-wider text-neutral-800">
                      Channels
                    </h4>
                  </div>
                  <span className="text-badge font-sans text-neutral-400">
                    {canvas?.channels?.length ?? 0}
                  </span>
                </div>
                <div className="p-2.5 flex-1 flex flex-col gap-1.5">
                  {canvas?.channels && canvas.channels.length > 0 ? (
                    canvas.channels.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded bg-white border border-neutral-200 p-2 text-caption font-sans text-neutral-800 leading-snug break-words"
                      >
                        {item}
                      </div>
                    ))
                  ) : (
                    <p className="text-caption text-neutral-400 italic py-1">None defined</p>
                  )}
                </div>
              </div>
            </div>

            {/* Column 5: Customer Segments (07) */}
            <div className="rounded-lg border border-neutral-300 bg-neutral-50/50 flex flex-col overflow-hidden">
              <div className="px-3 py-2 flex items-center justify-between border-b border-neutral-200 bg-white">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-badge font-semibold text-neutral-400">07</span>
                  <h4 className="font-heading text-badge font-bold uppercase tracking-wider text-neutral-800">
                    Segments
                  </h4>
                </div>
                <span className="text-badge font-sans text-neutral-400">
                  {canvas?.customerSegments?.length ?? 0}
                </span>
              </div>
              <div className="p-2.5 flex-1 flex flex-col gap-1.5">
                {canvas?.customerSegments && canvas.customerSegments.length > 0 ? (
                  canvas.customerSegments.map((seg, idx) => (
                    <div
                      key={idx}
                      className="rounded bg-white border border-neutral-200 p-2 text-caption font-sans text-neutral-800 leading-snug break-words"
                    >
                      {seg.segment}
                    </div>
                  ))
                ) : (
                  <p className="text-caption text-neutral-400 italic py-1">None defined</p>
                )}
              </div>
            </div>
          </div>

          {/* Lower Region: Cost Structure (08) & Revenue Streams (09) */}
          <div className="grid grid-cols-11 gap-2.5 items-stretch">
            {/* Cost Structure (55%) -> 6 of 11 */}
            <div className="col-span-6 rounded-lg border border-neutral-300 bg-neutral-50/50 flex flex-col overflow-hidden">
              <div className="px-3 py-2 flex items-center justify-between border-b border-neutral-200 bg-white">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-badge font-semibold text-neutral-400">08</span>
                  <h4 className="font-heading text-badge font-bold uppercase tracking-wider text-neutral-800">
                    Cost Structure
                  </h4>
                </div>
                <span className="text-badge font-sans text-neutral-400">
                  {canvas?.costStructure?.length ?? 0} items
                </span>
              </div>
              <div className="p-2.5 flex-1">
                {canvas?.costStructure && canvas.costStructure.length > 0 ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    {canvas.costStructure.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded bg-white border border-neutral-200 p-2 text-caption font-sans text-neutral-800 leading-snug break-words"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-caption text-neutral-400 italic py-1">None defined</p>
                )}
              </div>
            </div>

            {/* Revenue Streams (45%) -> 5 of 11 */}
            <div className="col-span-5 rounded-lg border border-neutral-300 bg-neutral-50/50 flex flex-col overflow-hidden">
              <div className="px-3 py-2 flex items-center justify-between border-b border-neutral-200 bg-white">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-badge font-semibold text-neutral-400">09</span>
                  <h4 className="font-heading text-badge font-bold uppercase tracking-wider text-neutral-800">
                    Revenue Streams
                  </h4>
                </div>
                <span className="text-badge font-sans text-neutral-400">
                  {canvas?.revenueStreams?.length ?? 0} items
                </span>
              </div>
              <div className="p-2.5 flex-1 flex flex-col gap-1.5">
                {canvas?.revenueStreams && canvas.revenueStreams.length > 0 ? (
                  canvas.revenueStreams.map((rev, idx) => (
                    <div
                      key={idx}
                      className="rounded bg-white border border-neutral-200 p-2 text-caption font-sans text-neutral-800 leading-snug break-words"
                    >
                      {rev.stream}
                    </div>
                  ))
                ) : (
                  <p className="text-caption text-neutral-400 italic py-1">None defined</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 1: UNIT ECONOMICS STRIP */}
        {/* ========================================================================= */}
        <section className="print-section mb-6 break-inside-avoid">
          <div className="rounded-lg border border-neutral-300 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
              <span className="font-heading text-badge font-bold uppercase tracking-wider text-neutral-500">
                UNIT ECONOMICS
              </span>
              <span className="font-sans text-caption text-neutral-400">
                Calibrated based on benchmarks
              </span>
            </div>

            <div className="grid grid-cols-4 divide-x divide-neutral-200">
              {/* CAC */}
              <div className="pr-4 space-y-1">
                <div className="text-badge font-heading font-semibold uppercase tracking-wider text-neutral-400">
                  CAC
                </div>
                <div className="text-stat-lg font-bold font-mono tracking-tight text-neutral-900">
                  {formatCurrencyAmount(unitEconomics?.cac?.amount, unitEconomics?.cac?.currency)}
                </div>
              </div>

              {/* LTV */}
              <div className="px-4 space-y-1">
                <div className="text-badge font-heading font-semibold uppercase tracking-wider text-neutral-400">
                  LTV
                </div>
                <div className="text-stat-lg font-bold font-mono tracking-tight text-neutral-900">
                  {formatCurrencyAmount(unitEconomics?.ltv?.amount, unitEconomics?.ltv?.currency)}
                </div>
              </div>

              {/* LTV / CAC */}
              <div className="px-4 space-y-1">
                <div className="text-badge font-heading font-semibold uppercase tracking-wider text-neutral-400">
                  LTV / CAC
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-stat-lg font-bold font-mono tracking-tight text-neutral-900">
                    {ltvToCacRatio !== undefined ? `${Number(ltvToCacRatio).toFixed(1)}x` : "—"}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-badge font-sans font-medium bg-emerald-50 text-emerald-800 border border-emerald-300">
                    Healthy
                  </span>
                </div>
              </div>

              {/* ESTIMATED PAYBACK */}
              <div className="pl-4 space-y-1">
                <div className="text-badge font-heading font-semibold uppercase tracking-wider text-neutral-400">
                  ESTIMATED PAYBACK
                </div>
                <div className="text-stat-lg font-bold font-mono tracking-tight text-neutral-900">
                  {paybackValue !== undefined ? `${paybackValue} months` : "—"}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: COMPLETION CHECKLIST */}
        {/* ========================================================================= */}
        <section className="print-section mb-6 break-inside-avoid">
          <div className="rounded-lg border border-neutral-300 bg-neutral-50/50 p-4 space-y-2.5">
            <div className="font-heading text-badge font-bold uppercase tracking-wider text-neutral-500">
              STEP COMPLETE
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                "9 Business Model blocks completed",
                "Revenue model defined",
                "Pricing defined",
                "Cost structure defined",
                "Unit economics generated",
              ].map((text, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 border border-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-emerald-800 stroke-[2.5]" />
                  </div>
                  <span className="text-body font-sans text-neutral-800 font-medium">
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Document Footer */}
        <footer className="mt-8 pt-3 border-t border-neutral-200 flex items-center justify-between text-badge font-mono text-neutral-400">
          <span>Mondial ECO Platform · Autonomous Startup Synthesis Engine</span>
          <span>Verified Confidential · Phase 3.2</span>
        </footer>
      </div>
    </div>,
    document.body
  );
}
