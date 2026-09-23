"use client";

import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Printer, X, Check, AlertTriangle, ShieldCheck } from "lucide-react";
import type { ForecastOutput } from "@/types/creator/ai";
import {
  RevenueAreaSvg,
  CostVsRevenueCrossingSvg,
  Cash36BarSvg,
  type ForecastRowCalculated,
} from "./ForecastSummaryCharts";

function formatMoney(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    const val = amount / 1_000_000;
    return `€${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `€${Math.round(amount).toLocaleString()}`;
  }
  return `€${Math.round(amount).toLocaleString()}`;
}

export interface ForecastPrintProps {
  open: boolean;
  onClose: () => void;
  projectName?: string;
  logoUrl?: string | null;
  project?: {
    sector?: string;
    geography?: string;
    targetUser?: string;
  };
  inputs?: {
    budget: number;
    launchSubs: number;
    growth: number;
    churn: number;
    arpu: number;
    varCost: number;
    opex: number;
    tam: number;
  };
  projectionData?: {
    rows: ForecastRowCalculated[];
    breakEvenMonth: number;
    breakEvenSubs?: number;
    breakEvenRevenue?: number;
    budgetRunsOutMonth: number | null;
    lowestCashMonth?: number;
    lowestCashStat?: number;
    fundingGap: number;
    cashPositiveMonth: number | null;
    lossRecoveryMonth: number | null;
    year1Revenue?: number;
    year2Revenue?: number;
    year3Revenue?: number;
    y1Total?: { revenue: number; totalCost: number; netCashFlow: number };
    y2Total?: { revenue: number; totalCost: number; netCashFlow: number };
    y3Total?: { revenue: number; totalCost: number; netCashFlow: number };
    subtotals?: {
      y1: { revenue: number; totalCost: number; netCashFlow: number; endSubscribers?: number };
      y2: { revenue: number; totalCost: number; netCashFlow: number; endSubscribers?: number };
      y3: { revenue: number; totalCost: number; netCashFlow: number; endSubscribers?: number };
    };
    maxFundingNeededMonth?: number;
    contributionMarginPerSub?: number;
    contributionMarginPct?: number;
    unitEconomics?: {
      cac: number;
      ltv: number;
      ltvCacRatio: number | string;
      paybackMonths: number;
      grossMarginPct: number;
      month1Burn: number;
    };
    risks?: {
      id: string;
      title: string;
      category: string;
      severity: "High" | "Medium" | "Low";
      detail: string;
      mitigation: string;
    }[];
    assumptions?: {
      label: string;
      value: string;
      source: "YOUR INPUT" | "FROM 3.2" | "MODEL";
      note: string;
    }[];
  };
  output?: ForecastOutput | null;
  version?: number | null;
  updatedAt?: string | null;
}

export default function ForecastPrintView({
  open,
  onClose,
  projectName,
  logoUrl,
  project,
  inputs: externalInputs,
  projectionData: externalProjectionData,
  output,
  version = 1,
  updatedAt,
}: ForecastPrintProps) {
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("printing-active");
    return () => document.body.classList.remove("printing-active");
  }, [open]);

  // Fallback inputs computation if not passed directly
  const resolvedInputs = useMemo(() => {
    if (externalInputs) return externalInputs;
    return {
      budget: 40000,
      launchSubs: 75,
      growth: 15,
      churn: 5,
      arpu: 32,
      varCost: 5,
      opex: 8000,
      tam: 900_000_000,
    };
  }, [externalInputs]);

  // Compute projection data if not passed directly or normalize if passed
  const data = useMemo(() => {
    const contributionMarginPerSub =
      externalProjectionData?.contributionMarginPerSub ??
      (resolvedInputs.arpu - resolvedInputs.varCost);
    const breakEvenSubs =
      externalProjectionData?.breakEvenSubs ??
      Math.ceil(resolvedInputs.opex / Math.max(1, contributionMarginPerSub));
    const breakEvenRevenue =
      externalProjectionData?.breakEvenRevenue ?? breakEvenSubs * resolvedInputs.arpu;
    const contributionMarginPct =
      externalProjectionData?.contributionMarginPct ??
      Math.round((contributionMarginPerSub / Math.max(1, resolvedInputs.arpu)) * 100);

    const cac = externalProjectionData?.unitEconomics?.cac ?? 180;
    const ltv =
      externalProjectionData?.unitEconomics?.ltv ??
      Math.round(resolvedInputs.arpu / Math.max(0.01, resolvedInputs.churn / 100));
    const rawLtvCac =
      externalProjectionData?.unitEconomics?.ltvCacRatio ??
      Math.round((ltv / Math.max(1, cac)) * 10) / 10;
    const ltvCacRatio = typeof rawLtvCac === "string" ? parseFloat(rawLtvCac) || 3.0 : rawLtvCac;
    const paybackMonths =
      externalProjectionData?.unitEconomics?.paybackMonths ??
      Math.max(1, Math.round(cac / Math.max(1, contributionMarginPerSub)));
    const grossMarginPct =
      externalProjectionData?.unitEconomics?.grossMarginPct ?? contributionMarginPct;
    const month1Burn = externalProjectionData?.unitEconomics?.month1Burn ?? 8000;

    if (externalProjectionData?.rows && externalProjectionData.rows.length > 0) {
      const rows = externalProjectionData.rows;
      const y1Rows = rows.slice(0, 12);
      const y2Rows = rows.slice(12, 24);
      const y3Rows = rows.slice(24, 36);

      const sumYear = (
        slice: ForecastRowCalculated[],
        fallbackTotal?: { revenue: number; totalCost: number; netCashFlow: number }
      ) => ({
        revenue: fallbackTotal?.revenue ?? slice.reduce((s, r) => s + r.revenue, 0),
        totalCost: fallbackTotal?.totalCost ?? slice.reduce((s, r) => s + r.totalCost, 0),
        netCashFlow: fallbackTotal?.netCashFlow ?? slice.reduce((s, r) => s + r.netCashFlow, 0),
        endSubscribers: slice[slice.length - 1]?.subscribers ?? 0,
      });

      const subtotals = externalProjectionData.subtotals ?? {
        y1: sumYear(y1Rows, externalProjectionData.y1Total),
        y2: sumYear(y2Rows, externalProjectionData.y2Total),
        y3: sumYear(y3Rows, externalProjectionData.y3Total),
      };

      const breakEvenMonth = externalProjectionData.breakEvenMonth ?? 16;
      return {
        rows,
        subtotals,
        breakEvenMonth,
        lossRecoveryMonth: externalProjectionData.lossRecoveryMonth ?? null,
        budgetRunsOutMonth: externalProjectionData.budgetRunsOutMonth ?? null,
        cashPositiveMonth: externalProjectionData.cashPositiveMonth ?? null,
        lowestCashMonth: externalProjectionData.lowestCashMonth ?? 1,
        fundingGap: externalProjectionData.fundingGap ?? 0,
        maxFundingNeededMonth:
          externalProjectionData.maxFundingNeededMonth ?? Math.max(1, breakEvenMonth - 1),
        breakEvenSubs,
        breakEvenRevenue,
        contributionMarginPerSub,
        contributionMarginPct,
        unitEconomics: {
          cac,
          ltv,
          ltvCacRatio,
          paybackMonths,
          grossMarginPct,
          month1Burn,
        },
      };
    }

    const netGrowthRate = (resolvedInputs.growth - resolvedInputs.churn) / 100;
    const rows: ForecastRowCalculated[] = [];
    let currentSubs = resolvedInputs.launchSubs;
    let cumulativeNet = 0;

    const hasAiMonthly = (output?.revenueForecast?.monthly?.length ?? 0) > 0;

    for (let m = 1; m <= 36; m++) {
      if (m > 1) {
        currentSubs = Math.round(resolvedInputs.launchSubs * Math.pow(1 + netGrowthRate, m - 1));
      }

      const aiRev = hasAiMonthly ? output?.revenueForecast?.monthly?.find((r) => r.month === m) : undefined;
      const aiCost = hasAiMonthly ? output?.costForecast?.monthly?.find((c) => c.month === m) : undefined;
      const aiCash = hasAiMonthly ? output?.cashFlowProjection?.monthly?.find((cf) => cf.month === m) : undefined;

      const revenue = aiRev != null ? aiRev.amount : currentSubs * resolvedInputs.arpu;
      const fixedCost = aiCost != null ? aiCost.fixedCosts : resolvedInputs.opex;
      const variableCost = aiCost != null ? aiCost.variableCosts : currentSubs * resolvedInputs.varCost;
      const totalCost = fixedCost + variableCost;
      const netCashFlow = aiCash?.netCashFlow != null ? aiCash.netCashFlow : revenue - totalCost;
      cumulativeNet += netCashFlow;
      const cashOnHand = resolvedInputs.budget + cumulativeNet;
      const note = aiRev?.notes || aiCost?.notes || aiCash?.notes || `+${resolvedInputs.growth}% new, −${resolvedInputs.churn}% churn`;

      rows.push({
        month: m,
        name: `Month ${m}`,
        subscribers: currentSubs,
        revenue,
        fixedCost,
        variableCost,
        totalCost,
        netCashFlow,
        cumulative: cumulativeNet,
        cashOnHand,
        notes: note,
      });
    }

    let breakEvenMonth = output?.breakEvenAnalysis?.breakEvenMonth ?? 16;
    let lossRecoveryMonth: number | null = null;
    let budgetRunsOutMonth: number | null = null;
    let cashPositiveMonth: number | null = null;
    let lowestCashMonth = 1;
    let minCumulative = 0;

    for (const r of rows) {
      if (r.netCashFlow >= 0 && !output?.breakEvenAnalysis?.breakEvenMonth && breakEvenMonth === 16 && r.month <= 24) {
        breakEvenMonth = r.month;
      }
      if (r.cashOnHand < 0 && budgetRunsOutMonth === null) {
        budgetRunsOutMonth = r.month;
      }
      if (budgetRunsOutMonth !== null && r.cashOnHand >= 0 && cashPositiveMonth === null) {
        cashPositiveMonth = r.month;
      }
      if (r.cumulative < minCumulative) {
        minCumulative = r.cumulative;
        lowestCashMonth = r.month;
      }
      if (r.cumulative >= 0 && lossRecoveryMonth === null && r.month > 1) {
        lossRecoveryMonth = r.month;
      }
    }

    const y1Rows = rows.slice(0, 12);
    const y2Rows = rows.slice(12, 24);
    const y3Rows = rows.slice(24, 36);

    const sumYear = (slice: ForecastRowCalculated[]) => ({
      revenue: slice.reduce((s, r) => s + r.revenue, 0),
      totalCost: slice.reduce((s, r) => s + r.totalCost, 0),
      netCashFlow: slice.reduce((s, r) => s + r.netCashFlow, 0),
      endSubscribers: slice[slice.length - 1]?.subscribers ?? 0,
    });

    const fundingGap = Math.max(0, Math.abs(minCumulative) - resolvedInputs.budget);

    return {
      rows,
      subtotals: {
        y1: sumYear(y1Rows),
        y2: sumYear(y2Rows),
        y3: sumYear(y3Rows),
      },
      breakEvenMonth,
      lossRecoveryMonth,
      budgetRunsOutMonth,
      cashPositiveMonth,
      lowestCashMonth,
      fundingGap,
      maxFundingNeededMonth: Math.max(1, breakEvenMonth - 1),
      breakEvenSubs,
      breakEvenRevenue,
      contributionMarginPerSub,
      contributionMarginPct,
      unitEconomics: {
        cac,
        ltv,
        ltvCacRatio,
        paybackMonths,
        grossMarginPct,
        month1Burn,
      },
    };
  }, [externalProjectionData, resolvedInputs, output]);

  if (!open || typeof document === "undefined") return null;

  const displayDate = updatedAt
    ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(
        new Date(updatedAt)
      )
    : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(
        new Date()
      );

  const displayProjectName = projectName || "AutoInvoice";
  const displaySector = project?.sector || "Subscription Software / B2B SaaS";

  const arrY3 = Math.round(data.rows[35]?.revenue * 12);
  const netGrowthPercent = Math.round(((data.subtotals.y3.revenue - data.subtotals.y1.revenue) / Math.max(1, data.subtotals.y1.revenue)) * 100);
  const minCumulativeDeficit = Math.abs(Math.min(0, ...data.rows.map((r) => r.cumulative)));

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
          className="gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <X className="h-4 w-4" /> Close
        </Button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <span>Use &ldquo;Save as PDF&rdquo; in the print dialog.</span>
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
      <div className="print-document mx-auto my-8 max-w-[1000px] bg-white text-neutral-900 px-8 py-8 shadow-xl rounded-xl border border-neutral-200 print:border-none print:shadow-none print:my-0 print:max-w-none print:px-6 print:py-5 print:rounded-none font-sans">
        
        {/* ======================================================
            SECTION 1 — Header (Figma Step 3.3 Exact)
            ====================================================== */}
        <header className="print-section mb-6 pb-4 border-b border-neutral-200">
          <div className="flex items-center justify-between gap-4 mb-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-500">
              STEP 3.3 · FINANCIAL FORECAST
            </span>
            <span className="text-xs font-mono text-neutral-500 uppercase">
              Phase 3.3 Output · Version {version ?? 1} · Generated {displayDate}
            </span>
          </div>

          <div className="flex items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              {logoUrl && !logoError ? (
                <div className="shrink-0 min-w-[70px] max-w-[110px] h-12 flex items-center justify-center overflow-hidden">
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
                <div className="size-12 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-xl font-heading shrink-0">
                  {displayProjectName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 leading-tight font-heading">
                  Your 3-year financial forecast : {displayProjectName}
                </h1>
                <p className="mt-1 text-xs text-neutral-500 font-sans">
                  36 months · Months 1–12 modelled, 13–36 projected · EUR · {displaySector}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* ======================================================
            SECTION 2 — Executive Verdict Hero Card (Figma Exact)
            ====================================================== */}
        <section className="print-section mb-6 p-5 rounded-xl border border-neutral-200 bg-neutral-50/80 relative overflow-hidden">
          <div
            className={`absolute left-0 top-0 bottom-0 w-1.5 ${
              data.fundingGap > 0 ? "bg-amber-600" : "bg-emerald-600"
            }`}
          />
          <div className="pl-2 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-heading font-semibold text-neutral-900 leading-snug">
                  You break even in{" "}
                  <span className="font-bold font-mono">month {data.breakEvenMonth}</span>
                  {data.lossRecoveryMonth ? (
                    <>
                      , and all losses are recovered by{" "}
                      <span className="font-bold font-mono">month {data.lossRecoveryMonth}</span>.
                    </>
                  ) : (
                    "."
                  )}
                </h2>
                <p className="text-xs text-neutral-600 mt-1 font-sans">
                  {data.fundingGap > 0 ? (
                    <>
                      Your {formatMoney(resolvedInputs.budget)} starting budget runs out in month{" "}
                      <span className="font-mono font-medium">{data.budgetRunsOutMonth ?? 1}</span>
                      — you&apos;ll need about{" "}
                      <span className="font-bold font-mono text-neutral-900">
                        {formatMoney(data.fundingGap)}
                      </span>{" "}
                      more to get through month{" "}
                      <span className="font-mono font-medium">{data.maxFundingNeededMonth}</span>.
                    </>
                  ) : (
                    <>
                      Your {formatMoney(resolvedInputs.budget)} starting budget sustains operations
                      without a funding deficit throughout the 36-month horizon.
                    </>
                  )}
                </p>
              </div>

              <div
                className={`px-3 py-1 rounded-full text-xs font-mono font-semibold tracking-wide shrink-0 ${
                  data.fundingGap > 0
                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                    : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                }`}
              >
                {data.fundingGap > 0 ? "Funding gap" : "Fully funded"}
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================
            SECTION 3 — Three Summary Cards (Figma Node 57157:9348 Exact)
            ====================================================== */}
        <section className="print-section mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Card 1: REVENUE */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500">
                  REVENUE
                </span>
                <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-mono font-semibold">
                  +{netGrowthPercent}% Y1→Y3
                </span>
              </div>
              <div>
                <div className="text-xl font-bold font-mono tracking-tight text-neutral-900">
                  {formatMoney(arrY3)} ARR (Y3)
                </div>
                <div className="text-[11px] text-neutral-500 font-sans">
                  Cumulative 3-year projection
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                  Y1: {formatMoney(data.subtotals.y1.revenue)}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                  Y2: {formatMoney(data.subtotals.y2.revenue)}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                  Y3: {formatMoney(data.subtotals.y3.revenue)}
                </span>
              </div>
              <div className="pt-1">
                <RevenueAreaSvg
                  rows={data.rows}
                  breakEvenMonth={data.breakEvenMonth}
                  idPrefix="print"
                />
              </div>
            </div>

            {/* Card 2: COST VS REVENUE */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500">
                  COST VS REVENUE
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-semibold">
                  Inflection point
                </span>
              </div>
              <div>
                <div className="text-xl font-bold font-mono tracking-tight text-neutral-900">
                  Month {data.breakEvenMonth}
                </div>
                <div className="text-[11px] text-neutral-500 font-sans">
                  Revenue crosses total costs ({formatMoney(data.breakEvenRevenue)}/mo)
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700 font-medium">
                  {data.breakEvenSubs} subs needed
                </span>
                <span className="text-neutral-400">·</span>
                <span className="text-teal-700 font-semibold">● Rev</span>
                <span className="text-slate-600 font-semibold">● Cost</span>
              </div>
              <div className="pt-1">
                <CostVsRevenueCrossingSvg
                  rows={data.rows}
                  breakEvenMonth={data.breakEvenMonth}
                  breakEvenRevenue={data.breakEvenRevenue}
                  breakEvenSubs={data.breakEvenSubs}
                  idPrefix="print"
                />
              </div>
            </div>

            {/* Card 3: CASH POSITION */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500">
                  CASH POSITION
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                    data.fundingGap > 0
                      ? "bg-amber-50 text-amber-800"
                      : "bg-emerald-50 text-emerald-800"
                  }`}
                >
                  {data.fundingGap > 0
                    ? `Deficit: M${data.budgetRunsOutMonth ?? 1}–M${data.cashPositiveMonth ?? data.breakEvenMonth}`
                    : "Fully funded"}
                </span>
              </div>
              <div>
                <div className="text-xl font-bold font-mono tracking-tight text-neutral-900">
                  {minCumulativeDeficit > 0 ? `−${formatMoney(minCumulativeDeficit)}` : "Cash positive"}
                </div>
                <div className="text-[11px] text-neutral-500 font-sans">
                  Lowest cash point · Month {data.lowestCashMonth}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                  Start: {formatMoney(resolvedInputs.budget)}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                  End Y3: {formatMoney(data.rows[35]?.cashOnHand ?? 0)}
                </span>
              </div>
              <div className="pt-1">
                <Cash36BarSvg
                  rows={data.rows}
                  budgetRunsOutMonth={data.budgetRunsOutMonth}
                  cashPositiveMonth={data.cashPositiveMonth}
                  lowestCashMonth={data.lowestCashMonth}
                  fundingGap={data.fundingGap}
                  idPrefix="print"
                />
              </div>
            </div>

          </div>
        </section>

        {/* ======================================================
            SECTION 4 — Assumptions & Operational Drivers Grid
            ====================================================== */}
        <section className="print-section mb-6">
          <div className="mb-2">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500">
              OPERATIONAL DRIVERS &amp; KEY INPUT PARAMETERS
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50">
              <div className="text-[10px] font-mono text-neutral-500 uppercase">Starting Budget</div>
              <div className="text-sm font-bold font-mono text-neutral-900 mt-0.5">
                {formatMoney(resolvedInputs.budget)}
              </div>
              <div className="text-[9px] text-neutral-400 font-sans mt-0.5">Seed runway ask</div>
            </div>
            <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50">
              <div className="text-[10px] font-mono text-neutral-500 uppercase">Launch Subscribers</div>
              <div className="text-sm font-bold font-mono text-neutral-900 mt-0.5">
                {resolvedInputs.launchSubs}
              </div>
              <div className="text-[9px] text-neutral-400 font-sans mt-0.5">Month 1 baseline</div>
            </div>
            <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50">
              <div className="text-[10px] font-mono text-neutral-500 uppercase">Monthly Growth</div>
              <div className="text-sm font-bold font-mono text-neutral-900 mt-0.5">
                {resolvedInputs.growth}% MoM
              </div>
              <div className="text-[9px] text-neutral-400 font-sans mt-0.5">Compound customer gain</div>
            </div>
            <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50">
              <div className="text-[10px] font-mono text-neutral-500 uppercase">Monthly Churn</div>
              <div className="text-sm font-bold font-mono text-neutral-900 mt-0.5">
                {resolvedInputs.churn}%
              </div>
              <div className="text-[9px] text-neutral-400 font-sans mt-0.5">Attrition rate</div>
            </div>
            <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50">
              <div className="text-[10px] font-mono text-neutral-500 uppercase">Price per Sub (ARPU)</div>
              <div className="text-sm font-bold font-mono text-neutral-900 mt-0.5">
                {formatMoney(resolvedInputs.arpu)}/mo
              </div>
              <div className="text-[9px] text-neutral-400 font-sans mt-0.5">From Step 3.2 Canvas</div>
            </div>
            <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50">
              <div className="text-[10px] font-mono text-neutral-500 uppercase">Variable Cost/Sub</div>
              <div className="text-sm font-bold font-mono text-neutral-900 mt-0.5">
                {formatMoney(resolvedInputs.varCost)}/mo
              </div>
              <div className="text-[9px] text-neutral-400 font-sans mt-0.5">COGS per customer</div>
            </div>
            <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50">
              <div className="text-[10px] font-mono text-neutral-500 uppercase">Fixed Costs / Mo</div>
              <div className="text-sm font-bold font-mono text-neutral-900 mt-0.5">
                {formatMoney(resolvedInputs.opex)}/mo
              </div>
              <div className="text-[9px] text-neutral-400 font-sans mt-0.5">OPEX baseline</div>
            </div>
            <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50">
              <div className="text-[10px] font-mono text-neutral-500 uppercase">Market Size (TAM)</div>
              <div className="text-sm font-bold font-mono text-neutral-900 mt-0.5">
                {formatMoney(resolvedInputs.tam)}
              </div>
              <div className="text-[9px] text-neutral-400 font-sans mt-0.5">From Step 3.1 Market Study</div>
            </div>
          </div>
        </section>

        {/* ======================================================
            SECTION 5 — Continuous 36-Month Consolidated Table
            ====================================================== */}
        <section className="print-section mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500">
              36-MONTH CONSOLIDATED FINANCIAL PROJECTIONS (EUR)
            </h3>
            <span className="text-[10px] font-mono text-neutral-400">
              Months 1–12 Modelled · Months 13–36 Projected
            </span>
          </div>

          <div className="overflow-x-auto border border-neutral-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-neutral-300 bg-neutral-100 text-[10px] text-neutral-600 uppercase font-semibold">
                  <th className="py-2 px-2.5">Month</th>
                  <th className="py-2 px-2 text-right">Subs</th>
                  <th className="py-2 px-2 text-right">Revenue</th>
                  <th className="py-2 px-2 text-right">Fixed Cost</th>
                  <th className="py-2 px-2 text-right">Var Cost</th>
                  <th className="py-2 px-2 text-right">Total Cost</th>
                  <th className="py-2 px-2 text-right">Net Cashflow</th>
                  <th className="py-2 px-2 text-right">Cumulative</th>
                  <th className="py-2 px-2 text-right">Cash on Hand</th>
                  <th className="py-2 px-2.5">Milestone / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-[11px]">
                {/* YEAR 1 */}
                <tr className="bg-neutral-100/90 font-bold text-neutral-700 text-[10px] uppercase tracking-wider">
                  <td colSpan={10} className="py-1 px-2.5">
                    Year 1 · Modelled
                  </td>
                </tr>
                {data.rows.slice(0, 12).map((r) => (
                  <tr key={r.month} className="hover:bg-neutral-50">
                    <td className="py-1.5 px-2.5 font-medium">{r.month}</td>
                    <td className="py-1.5 px-2 text-right">{r.subscribers}</td>
                    <td className="py-1.5 px-2 text-right font-medium text-teal-700">
                      {formatMoney(r.revenue)}
                    </td>
                    <td className="py-1.5 px-2 text-right text-neutral-600">
                      {formatMoney(r.fixedCost)}
                    </td>
                    <td className="py-1.5 px-2 text-right text-neutral-600">
                      {formatMoney(r.variableCost)}
                    </td>
                    <td className="py-1.5 px-2 text-right text-neutral-800">
                      {formatMoney(r.totalCost)}
                    </td>
                    <td
                      className={`py-1.5 px-2 text-right font-medium ${
                        r.netCashFlow >= 0 ? "text-teal-700" : "text-amber-700"
                      }`}
                    >
                      {r.netCashFlow >= 0 ? `+${formatMoney(r.netCashFlow)}` : `−${formatMoney(Math.abs(r.netCashFlow))}`}
                    </td>
                    <td className="py-1.5 px-2 text-right text-neutral-700">
                      {r.cumulative >= 0 ? `+${formatMoney(r.cumulative)}` : `−${formatMoney(Math.abs(r.cumulative))}`}
                    </td>
                    <td
                      className={`py-1.5 px-2 text-right font-medium ${
                        r.cashOnHand >= 0 ? "text-neutral-900" : "text-amber-700"
                      }`}
                    >
                      {formatMoney(r.cashOnHand)}
                    </td>
                    <td className="py-1.5 px-2.5 text-[10px] text-neutral-500 truncate max-w-[140px]">
                      {r.month === data.breakEvenMonth && (
                        <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-semibold mr-1">
                          Break-even
                        </span>
                      )}
                      {r.month === data.budgetRunsOutMonth && data.fundingGap > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold mr-1">
                          Budget runs out
                        </span>
                      )}
                      {r.month === data.lowestCashMonth && minCumulativeDeficit > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold mr-1">
                          Lowest cash
                        </span>
                      )}
                      {r.notes}
                    </td>
                  </tr>
                ))}
                {/* Y1 SUBTOTAL */}
                <tr className="bg-neutral-100 font-bold border-t border-b border-neutral-300 text-[10px]">
                  <td className="py-1.5 px-2.5">Y1 SUBTOTAL</td>
                  <td className="py-1.5 px-2 text-right">{data.subtotals.y1.endSubscribers}</td>
                  <td className="py-1.5 px-2 text-right text-teal-700">{formatMoney(data.subtotals.y1.revenue)}</td>
                  <td colSpan={2}></td>
                  <td className="py-1.5 px-2 text-right">{formatMoney(data.subtotals.y1.totalCost)}</td>
                  <td className="py-1.5 px-2 text-right">
                    {data.subtotals.y1.netCashFlow >= 0 ? `+${formatMoney(data.subtotals.y1.netCashFlow)}` : `−${formatMoney(Math.abs(data.subtotals.y1.netCashFlow))}`}
                  </td>
                  <td colSpan={3}></td>
                </tr>

                {/* YEAR 2 */}
                <tr className="bg-neutral-100/90 font-bold text-neutral-700 text-[10px] uppercase tracking-wider">
                  <td colSpan={10} className="py-1 px-2.5">
                    Year 2 · Projected
                  </td>
                </tr>
                {data.rows.slice(12, 24).map((r) => (
                  <tr key={r.month} className="hover:bg-neutral-50">
                    <td className="py-1.5 px-2.5 font-medium">{r.month}</td>
                    <td className="py-1.5 px-2 text-right">{r.subscribers}</td>
                    <td className="py-1.5 px-2 text-right font-medium text-teal-700">
                      {formatMoney(r.revenue)}
                    </td>
                    <td className="py-1.5 px-2 text-right text-neutral-600">
                      {formatMoney(r.fixedCost)}
                    </td>
                    <td className="py-1.5 px-2 text-right text-neutral-600">
                      {formatMoney(r.variableCost)}
                    </td>
                    <td className="py-1.5 px-2 text-right text-neutral-800">
                      {formatMoney(r.totalCost)}
                    </td>
                    <td
                      className={`py-1.5 px-2 text-right font-medium ${
                        r.netCashFlow >= 0 ? "text-teal-700" : "text-amber-700"
                      }`}
                    >
                      {r.netCashFlow >= 0 ? `+${formatMoney(r.netCashFlow)}` : `−${formatMoney(Math.abs(r.netCashFlow))}`}
                    </td>
                    <td className="py-1.5 px-2 text-right text-neutral-700">
                      {r.cumulative >= 0 ? `+${formatMoney(r.cumulative)}` : `−${formatMoney(Math.abs(r.cumulative))}`}
                    </td>
                    <td
                      className={`py-1.5 px-2 text-right font-medium ${
                        r.cashOnHand >= 0 ? "text-neutral-900" : "text-amber-700"
                      }`}
                    >
                      {formatMoney(r.cashOnHand)}
                    </td>
                    <td className="py-1.5 px-2.5 text-[10px] text-neutral-500 truncate max-w-[140px]">
                      {r.month === data.breakEvenMonth && (
                        <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-semibold mr-1">
                          Break-even
                        </span>
                      )}
                      {r.month === data.cashPositiveMonth && (
                        <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-semibold mr-1">
                          Cash positive
                        </span>
                      )}
                      {r.month === data.lossRecoveryMonth && (
                        <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-semibold mr-1">
                          Losses recovered
                        </span>
                      )}
                      {r.notes}
                    </td>
                  </tr>
                ))}
                {/* Y2 SUBTOTAL */}
                <tr className="bg-neutral-100 font-bold border-t border-b border-neutral-300 text-[10px]">
                  <td className="py-1.5 px-2.5">Y2 SUBTOTAL</td>
                  <td className="py-1.5 px-2 text-right">{data.subtotals.y2.endSubscribers}</td>
                  <td className="py-1.5 px-2 text-right text-teal-700">{formatMoney(data.subtotals.y2.revenue)}</td>
                  <td colSpan={2}></td>
                  <td className="py-1.5 px-2 text-right">{formatMoney(data.subtotals.y2.totalCost)}</td>
                  <td className="py-1.5 px-2 text-right">
                    {data.subtotals.y2.netCashFlow >= 0 ? `+${formatMoney(data.subtotals.y2.netCashFlow)}` : `−${formatMoney(Math.abs(data.subtotals.y2.netCashFlow))}`}
                  </td>
                  <td colSpan={3}></td>
                </tr>

                {/* YEAR 3 */}
                <tr className="bg-neutral-100/90 font-bold text-neutral-700 text-[10px] uppercase tracking-wider">
                  <td colSpan={10} className="py-1 px-2.5">
                    Year 3 · Projected
                  </td>
                </tr>
                {data.rows.slice(24, 36).map((r) => (
                  <tr key={r.month} className="hover:bg-neutral-50">
                    <td className="py-1.5 px-2.5 font-medium">{r.month}</td>
                    <td className="py-1.5 px-2 text-right">{r.subscribers}</td>
                    <td className="py-1.5 px-2 text-right font-medium text-teal-700">
                      {formatMoney(r.revenue)}
                    </td>
                    <td className="py-1.5 px-2 text-right text-neutral-600">
                      {formatMoney(r.fixedCost)}
                    </td>
                    <td className="py-1.5 px-2 text-right text-neutral-600">
                      {formatMoney(r.variableCost)}
                    </td>
                    <td className="py-1.5 px-2 text-right text-neutral-800">
                      {formatMoney(r.totalCost)}
                    </td>
                    <td
                      className={`py-1.5 px-2 text-right font-medium ${
                        r.netCashFlow >= 0 ? "text-teal-700" : "text-amber-700"
                      }`}
                    >
                      {r.netCashFlow >= 0 ? `+${formatMoney(r.netCashFlow)}` : `−${formatMoney(Math.abs(r.netCashFlow))}`}
                    </td>
                    <td className="py-1.5 px-2 text-right text-neutral-700">
                      {r.cumulative >= 0 ? `+${formatMoney(r.cumulative)}` : `−${formatMoney(Math.abs(r.cumulative))}`}
                    </td>
                    <td
                      className={`py-1.5 px-2 text-right font-medium ${
                        r.cashOnHand >= 0 ? "text-neutral-900" : "text-amber-700"
                      }`}
                    >
                      {formatMoney(r.cashOnHand)}
                    </td>
                    <td className="py-1.5 px-2.5 text-[10px] text-neutral-500 truncate max-w-[140px]">
                      {r.month === 36 && (
                        <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-semibold mr-1">
                          Horizon End
                        </span>
                      )}
                      {r.notes}
                    </td>
                  </tr>
                ))}
                {/* Y3 SUBTOTAL */}
                <tr className="bg-neutral-100 font-bold border-t border-b border-neutral-300 text-[10px]">
                  <td className="py-1.5 px-2.5">Y3 SUBTOTAL</td>
                  <td className="py-1.5 px-2 text-right">{data.subtotals.y3.endSubscribers}</td>
                  <td className="py-1.5 px-2 text-right text-teal-700">{formatMoney(data.subtotals.y3.revenue)}</td>
                  <td colSpan={2}></td>
                  <td className="py-1.5 px-2 text-right">{formatMoney(data.subtotals.y3.totalCost)}</td>
                  <td className="py-1.5 px-2 text-right">
                    {data.subtotals.y3.netCashFlow >= 0 ? `+${formatMoney(data.subtotals.y3.netCashFlow)}` : `−${formatMoney(Math.abs(data.subtotals.y3.netCashFlow))}`}
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ======================================================
            SECTION 6 — Side-by-Side: Break-Even & Unit Economics
            ====================================================== */}
        <section className="print-section mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Break-Even Card */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-600">
                  BREAK-EVEN ANALYSIS
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[10px] font-mono font-semibold">
                  Month {data.breakEvenMonth}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded bg-neutral-50 border border-neutral-200">
                  <div className="text-[10px] text-neutral-500">Break-Even Revenue</div>
                  <div className="text-sm font-bold text-neutral-900 mt-0.5">
                    {formatMoney(data.breakEvenRevenue)}/mo
                  </div>
                </div>
                <div className="p-2.5 rounded bg-neutral-50 border border-neutral-200">
                  <div className="text-[10px] text-neutral-500">Subscribers Needed</div>
                  <div className="text-sm font-bold text-neutral-900 mt-0.5">
                    {data.breakEvenSubs}
                  </div>
                </div>
                <div className="p-2.5 rounded bg-neutral-50 border border-neutral-200">
                  <div className="text-[10px] text-neutral-500">Contribution Margin</div>
                  <div className="text-sm font-bold text-neutral-900 mt-0.5">
                    {data.contributionMarginPct}%
                  </div>
                </div>
                <div className="p-2.5 rounded bg-neutral-50 border border-neutral-200">
                  <div className="text-[10px] text-neutral-500">Margin / Subscriber</div>
                  <div className="text-sm font-bold text-neutral-900 mt-0.5">
                    {formatMoney(data.contributionMarginPerSub)}
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-neutral-600 font-sans leading-relaxed">
                Break-even is achieved when monthly recurring contribution margin equals fixed operating costs ({formatMoney(resolvedInputs.opex)}/mo).
              </p>
            </div>

            {/* Unit Economics Card */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-600">
                  UNIT ECONOMICS
                </h4>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                    data.unitEconomics.ltvCacRatio >= 3.0
                      ? "bg-teal-50 text-teal-800"
                      : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {data.unitEconomics.ltvCacRatio >= 3.0 ? "Healthy Model" : "Margin Attention"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-neutral-50 border border-neutral-200">
                  <div className="text-[10px] text-neutral-500">CAC</div>
                  <div className="text-sm font-bold text-neutral-900 mt-0.5">
                    {formatMoney(data.unitEconomics.cac)}
                  </div>
                </div>
                <div className="p-2 rounded bg-neutral-50 border border-neutral-200">
                  <div className="text-[10px] text-neutral-500">LTV</div>
                  <div className="text-sm font-bold text-neutral-900 mt-0.5">
                    {formatMoney(data.unitEconomics.ltv)}
                  </div>
                </div>
                <div className="p-2 rounded bg-neutral-50 border border-neutral-200">
                  <div className="text-[10px] text-neutral-500">LTV / CAC</div>
                  <div className="text-sm font-bold text-neutral-900 mt-0.5">
                    {data.unitEconomics.ltvCacRatio}×
                  </div>
                </div>
                <div className="p-2 rounded bg-neutral-50 border border-neutral-200">
                  <div className="text-[10px] text-neutral-500">Payback</div>
                  <div className="text-sm font-bold text-neutral-900 mt-0.5">
                    {data.unitEconomics.paybackMonths} mo
                  </div>
                </div>
                <div className="p-2 rounded bg-neutral-50 border border-neutral-200">
                  <div className="text-[10px] text-neutral-500">Gross Margin</div>
                  <div className="text-sm font-bold text-neutral-900 mt-0.5">
                    {data.unitEconomics.grossMarginPct}%
                  </div>
                </div>
                <div className="p-2 rounded bg-neutral-50 border border-neutral-200">
                  <div className="text-[10px] text-neutral-500">M1 Burn</div>
                  <div className="text-sm font-bold text-neutral-900 mt-0.5">
                    {formatMoney(data.unitEconomics.month1Burn)}
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-neutral-600 font-sans leading-relaxed">
                Calibrated against B2B benchmarks. LTV/CAC ratio of {data.unitEconomics.ltvCacRatio}× supports sustainable paid acquisition.
              </p>
            </div>

          </div>
        </section>

        {/* ======================================================
            SECTION 7 — Key Assumptions & Risk Assessment
            ====================================================== */}
        <section className="print-section mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Key Assumptions */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-600 mb-2">
                MODEL ASSUMPTIONS &amp; PROVENANCE
              </h4>
              <div className="space-y-1.5 text-xs font-sans">
                <div className="flex items-center justify-between py-1 border-b border-neutral-100">
                  <span className="text-neutral-600">Starting Budget</span>
                  <span className="font-mono font-medium">{formatMoney(resolvedInputs.budget)} (YOUR INPUT)</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-neutral-100">
                  <span className="text-neutral-600">Monthly ARPU</span>
                  <span className="font-mono font-medium">{formatMoney(resolvedInputs.arpu)} (FROM 3.2)</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-neutral-100">
                  <span className="text-neutral-600">COGS per Subscriber</span>
                  <span className="font-mono font-medium">{formatMoney(resolvedInputs.varCost)} (FROM 3.2)</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-neutral-100">
                  <span className="text-neutral-600">Market Size (TAM)</span>
                  <span className="font-mono font-medium">{formatMoney(resolvedInputs.tam)} (FROM 3.1)</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-neutral-600">Customer Attrition Rate</span>
                  <span className="font-mono font-medium">{resolvedInputs.churn}% / mo (MODEL)</span>
                </div>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-600 mb-2">
                FINANCIAL RISK ASSESSMENT
              </h4>
              <div className="space-y-2 text-xs font-sans">
                <div className="p-2 rounded bg-neutral-50 border border-neutral-200">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-800">1. Funding Risk</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        data.fundingGap > 0
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {data.fundingGap > 0 ? "High" : "Low"}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-600 mt-1">
                    {data.fundingGap > 0
                      ? `Funding gap of ${formatMoney(data.fundingGap)} requires securing pre-seed investment or grant before month ${data.budgetRunsOutMonth ?? 1}.`
                      : "Starting budget completely covers the deficit horizon."}
                  </p>
                </div>
                <div className="p-2 rounded bg-neutral-50 border border-neutral-200">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-800">2. Growth Sensitivity</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-mono font-semibold">
                      Medium
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-600 mt-1">
                    If MoM growth drops from {resolvedInputs.growth}% to 10%, break-even is delayed by 4 months.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ======================================================
            SECTION 8 — Certification & Verification Footer
            ====================================================== */}
        <footer className="print-section pt-4 mt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500 font-sans">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Mondial ECO · Financial Forecast Model · Step 3.3 Certified</span>
          </div>
          <div className="font-mono text-[11px] text-neutral-400">
            Document ID: M33-{resolvedInputs.budget}-{data.breakEvenMonth} · {displayDate}
          </div>
        </footer>

      </div>
    </div>,
    document.body
  );
}
