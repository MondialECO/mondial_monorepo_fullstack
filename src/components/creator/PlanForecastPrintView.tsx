"use client";

import React, { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import {
  Printer,
  X,
  FileDown,
  Building2,
  Users,
  Target,
  ShieldCheck,
  Scale,
  DollarSign,
  TrendingUp,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Briefcase,
} from "lucide-react";
import type { BusinessPlanOutput, ForecastOutput, LegalRegulatoryFramework } from "@/types/creator/ai";
import { formatMoney } from "@/lib/format-money";
import { useTranslation } from "@/hooks/useTranslation";

export interface PrintProps {
  open: boolean;
  onClose: () => void;
  projectName: string;
  project: {
    problem: string;
    solution: string;
    targetUser: string;
    country?: string;
    category?: string;
    sector?: string;
  };
  plan: BusinessPlanOutput | null | undefined;
  forecast: ForecastOutput | null | undefined;
  forecastInputs?: {
    arpu?: number | null;
    opex?: number | null;
    monthlyGrowthPct?: number | null;
    tam?: number | null;
    monthlyChurnPct?: number | null;
  } | null;
  forecastBasis?: {
    years?: Array<{ year: number; revenue: number; opex: number; netIncome: number }>;
    currency?: string;
    summary?: { breakEvenMonth?: number; minCashRequired?: number };
  };
  formation?: {
    selectedType?: string;
    founderEquity?: number;
    plannedRole?: string;
    skills?: { youHave?: string[]; youNeed?: string[] };
  };
  cross?: { youNeed?: string[]; seedAsk?: number | null } | null;
  legalFramework?: LegalRegulatoryFramework | null;
}

const has = (s?: string | null): s is string => !!s && s.trim().length > 0;
const arr = <T,>(a?: T[] | null): a is T[] => Array.isArray(a) && a.length > 0;

interface ForecastTableRow {
  month: number;
  revenue: number | null;
  fixedCosts: number | null;
  variableCosts: number | null;
  totalCost: number | null;
  netCashFlow: number | null;
  endingBalance: number | null;
  notes: string;
}

function forecastRows(f: ForecastOutput): ForecastTableRow[] {
  const rev = f.revenueForecast?.monthly ?? [];
  const cost = f.costForecast?.monthly ?? [];
  const cash = f.cashFlowProjection?.monthly ?? [];
  const months = Array.from(
    new Set([
      ...rev.map((row) => row.month),
      ...cost.map((row) => row.month),
      ...cash.map((row) => row.month),
    ])
  ).sort((a, b) => a - b);

  return months.map((month) => {
    const revenueRow = rev.find((row) => row.month === month);
    const costRow = cost.find((row) => row.month === month);
    const cashRow = cash.find((row) => row.month === month);
    const notes = Array.from(
      new Set(
        [revenueRow?.notes, costRow?.notes, cashRow?.notes].filter(
          (note): note is string => !!note?.trim()
        )
      )
    ).join(" | ");

    return {
      month,
      revenue: revenueRow?.amount ?? null,
      fixedCosts: costRow?.fixedCosts ?? null,
      variableCosts: costRow?.variableCosts ?? null,
      totalCost: costRow
        ? (costRow.fixedCosts ?? 0) + (costRow.variableCosts ?? 0)
        : null,
      netCashFlow: cashRow?.netCashFlow ?? null,
      endingBalance: cashRow?.endingBalance ?? null,
      notes,
    };
  });
}

function chartRows(rows: ForecastTableRow[]) {
  return rows.map((row) => ({
    name: `M${row.month}`,
    Revenue: row.revenue,
    Cost: row.totalCost,
    Cashflow: row.netCashFlow,
  }));
}

function Section({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="print-section mb-10 break-inside-avoid">
      {children}
    </section>
  );
}

function Heading({ chapter, children }: { chapter: string; children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="mb-4 flex items-center justify-between border-b-2 border-neutral-200 pb-2">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex items-center justify-center rounded bg-primary/10 px-2 py-0.5 text-xs font-bold tracking-wider text-primary">
          {chapter}
        </span>
        <h2 className="text-xl font-bold font-heading tracking-tight text-neutral-900">
          {children}
        </h2>
      </div>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
        {t("creator.phase3.planForecastPrint.chapter", "Chapter")} {chapter}
      </span>
    </div>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-1.5 mt-3 text-xs font-bold uppercase tracking-wider text-neutral-500">
      {children}
    </h3>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-sm leading-relaxed text-neutral-700">{children}</p>;
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="mb-2 list-disc pl-5 text-sm leading-relaxed text-neutral-700 space-y-1">
      {items.map((x, i) => (
        <li key={i}>{x}</li>
      ))}
    </ul>
  );
}

function yearChunks<T extends { month: number }>(monthly: T[]) {
  const years: { year: number; months: T[] }[] = [];
  for (const m of monthly) {
    const y = Math.max(1, Math.ceil(m.month / 12));
    let bucket = years.find((b) => b.year === y);
    if (!bucket) {
      bucket = { year: y, months: [] };
      years.push(bucket);
    }
    bucket.months.push(m);
  }
  return years;
}

function ConsolidatedForecastTable({
  rows,
  money,
}: {
  rows: ForecastTableRow[];
  money: (value?: number | null) => string;
}) {
  const { t } = useTranslation();
  const total = (values: Array<number | null>) =>
    values.some((value) => value != null)
      ? values.reduce<number>((sum, value) => sum + (value ?? 0), 0)
      : null;

  return (
    <div className="mt-4">
      <Sub>{t("creator.phase3.planForecastPrint.monthlyForecastTitle", "Consolidated monthly forecast")}</Sub>
      {yearChunks(rows).map((y) => (
        <div key={y.year} className="print-year mb-4 rounded-lg border border-neutral-200 p-3 bg-neutral-50/30">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-600">
            {t("creator.phase3.planForecastPrint.yearMonths", "Year {{year}} (Months {{start}}–{{end}})", { year: y.year, start: y.months[0].month, end: y.months[y.months.length - 1].month })}
          </div>
          <table className="print-table w-full table-fixed border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="w-[8%] py-1.5 pr-1 font-semibold">{t("creator.phase3.planForecastPrint.thMonth", "Month")}</th>
                <th className="w-[13%] py-1.5 pr-1 text-right font-semibold">{t("creator.phase3.planForecastPrint.thRevenue", "Revenue")}</th>
                <th className="w-[11%] py-1.5 pr-1 text-right font-semibold">{t("creator.phase3.planForecastPrint.thFixed", "Fixed")}</th>
                <th className="w-[11%] py-1.5 pr-1 text-right font-semibold">{t("creator.phase3.planForecastPrint.thVariable", "Variable")}</th>
                <th className="w-[13%] py-1.5 pr-1 text-right font-semibold">{t("creator.phase3.planForecastPrint.thTotalCost", "Total cost")}</th>
                <th className="w-[14%] py-1.5 pr-1 text-right font-semibold">{t("creator.phase3.planForecastPrint.thNetCashFlow", "Net cash flow")}</th>
                <th className="w-[14%] py-1.5 pr-1 text-right font-semibold">{t("creator.phase3.planForecastPrint.thEndingBalance", "Ending balance")}</th>
                <th className="w-[16%] py-1.5 font-semibold">{t("creator.phase3.planForecastPrint.thNotes", "Notes")}</th>
              </tr>
            </thead>
            <tbody>
              {y.months.map((row) => (
                <tr key={row.month} className="print-row border-b border-neutral-100 align-top">
                  <td className="py-1 pr-1 font-semibold text-neutral-800">{`M${row.month}`}</td>
                  <td className="whitespace-nowrap py-1 pr-1 text-right font-mono text-neutral-800">{money(row.revenue)}</td>
                  <td className="whitespace-nowrap py-1 pr-1 text-right font-mono text-neutral-600">{money(row.fixedCosts)}</td>
                  <td className="whitespace-nowrap py-1 pr-1 text-right font-mono text-neutral-600">{money(row.variableCosts)}</td>
                  <td className="whitespace-nowrap py-1 pr-1 text-right font-mono text-neutral-800">{money(row.totalCost)}</td>
                  <td className={`whitespace-nowrap py-1 pr-1 text-right font-mono font-medium ${row.netCashFlow && row.netCashFlow < 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {money(row.netCashFlow)}
                  </td>
                  <td className="whitespace-nowrap py-1 pr-1 text-right font-mono font-medium text-neutral-900">{money(row.endingBalance)}</td>
                  <td className="py-1 text-[11px] leading-tight text-neutral-500 truncate" title={row.notes}>{row.notes}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-neutral-300 font-bold bg-neutral-100/50">
                <td className="py-1.5 pr-1 text-neutral-900">{t("creator.phase3.planForecastPrint.total", "Total")}</td>
                <td className="whitespace-nowrap py-1.5 pr-1 text-right font-mono text-neutral-900">{money(total(y.months.map((row) => row.revenue)))}</td>
                <td className="whitespace-nowrap py-1.5 pr-1 text-right font-mono text-neutral-700">{money(total(y.months.map((row) => row.fixedCosts)))}</td>
                <td className="whitespace-nowrap py-1.5 pr-1 text-right font-mono text-neutral-700">{money(total(y.months.map((row) => row.variableCosts)))}</td>
                <td className="whitespace-nowrap py-1.5 pr-1 text-right font-mono text-neutral-900">{money(total(y.months.map((row) => row.totalCost)))}</td>
                <td className="whitespace-nowrap py-1.5 pr-1 text-right font-mono text-neutral-900">{money(total(y.months.map((row) => row.netCashFlow)))}</td>
                <td className="whitespace-nowrap py-1.5 pr-1 text-right font-mono text-neutral-900">{money(y.months[y.months.length - 1]?.endingBalance)}</td>
                <td className="py-1.5" />
              </tr>
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

export default function PlanForecastPrintView({
  open,
  onClose,
  projectName,
  project,
  plan,
  forecast,
  forecastInputs,
  forecastBasis,
  formation,
  cross,
  legalFramework,
}: PrintProps) {
  const { t } = useTranslation();
  useEffect(() => {
    if (!open) return;
    document.body.classList.add("printing-active");
    return () => document.body.classList.remove("printing-active");
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const effectiveProjectName = has(projectName) ? projectName : "Your Venture";
  const effectiveCountry = project.country?.trim() || "France";
  const effectiveCategory = project.category?.trim() || "Subscription software";

  // Destructure plan parts
  const es = plan?.executiveSummary;
  const ma = plan?.marketAnalysis;
  const ca = plan?.competitorAnalysis;
  const rm = plan?.revenueModel;
  const gtm = plan?.goToMarket;
  const ops = plan?.operationsPlan;
  const planRisks = plan?.risks;

  // Forecast data setup
  const be = forecast?.breakEvenAnalysis;
  const tableRows = forecast ? forecastRows(forecast) : [];
  const rows = chartRows(tableRows);
  const fcTotal = tableRows[tableRows.length - 1]?.month ?? 0;
  const fcAi = forecast?.aiMonthCount ?? fcTotal;
  const fcProjected = fcTotal > fcAi;
  const fcCurrency =
    forecast?.revenueForecast?.currency ??
    forecast?.costForecast?.currency ??
    forecast?.cashFlowProjection?.currency ??
    forecastBasis?.currency ??
    "EUR";

  const money = (n?: number | null) => (n == null ? "-" : formatMoney(n, fcCurrency));

  const breakEvenMonth =
    be?.isAchievedWithinHorizon && typeof be.breakEvenMonth === "number"
      ? be.breakEvenMonth
      : forecastBasis?.summary?.breakEvenMonth ?? null;

  const analysisMonth = breakEvenMonth ?? (fcTotal > 0 ? fcTotal : null);
  const analysisRow = analysisMonth
    ? tableRows.find((row) => row.month === analysisMonth)
    : undefined;

  // 3-Year summary numbers
  const y1 = forecastBasis?.years?.[0];
  const y2 = forecastBasis?.years?.[1];
  const y3 = forecastBasis?.years?.[2];

  const lf = legalFramework || plan?.legalFramework;

  return createPortal(
    <div data-print-overlay className="fixed inset-0 z-[100] overflow-auto bg-neutral-200 print:bg-white">
      {/* Screen Toolbar - Hidden during print */}
      <div className="no-print sticky top-0 z-20 flex items-center justify-between border-b border-neutral-300 bg-white/95 backdrop-blur px-6 py-3.5 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="gap-1.5 text-neutral-700 hover:bg-neutral-100 rounded-lg"
          >
            <X className="h-4 w-4" /> {t("creator.phase3.planForecastPrint.close", "Close")}
          </Button>
          <div className="h-4 w-px bg-neutral-300" />
          <span className="text-xs font-medium text-neutral-600">
            {t("creator.phase3.planForecastPrint.previewing", "Previewing:")} <strong className="text-neutral-900">{effectiveProjectName}</strong> {t("creator.phase3.planForecastPrint.twelveChapterPlan", "· 12-Chapter Business Plan")}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-xs text-neutral-500">
            {t("creator.phase3.planForecastPrint.printTip", "Tip: In the print dialog, select “Save as PDF” & enable “Background graphics”.")}
          </span>
          <Button
            size="sm"
            onClick={() => window.print()}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-sm font-semibold"
          >
            <Printer className="h-4 w-4" /> {t("creator.phase3.planForecastPrint.printPdf", "Print / Save as PDF")}
          </Button>
        </div>
      </div>

      {/* Main Print Document Canvas */}
      <div className="print-document mx-auto my-8 max-w-[840px] bg-white px-12 py-12 shadow-xl print:m-0 print:max-w-none print:p-0 print:shadow-none font-sans text-neutral-900">
        
        {/* DOCUMENT COVER & EXECUTIVE MASTHEAD */}
        <header className="mb-10 border-b-2 border-neutral-900 pb-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="rounded bg-neutral-900 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-white">
                {t("creator.phase3.planForecastPrint.mondialEcosystem", "MONDIAL ECOSYSTEM")}
              </span>
              <span className="text-xs font-semibold tracking-wider uppercase text-neutral-500">
                {t("creator.phase3.planForecastPrint.executiveBusinessPlan", "EXECUTIVE BUSINESS PLAN")}
              </span>
            </div>
            <div className="rounded-full border border-neutral-300 bg-neutral-50 px-3 py-0.5 text-[11px] font-bold tracking-wider uppercase text-neutral-700">
              {t("creator.phase3.planForecastPrint.finalDraft", "FINAL DRAFT · V1.0")}
            </div>
          </div>

          <h1 className="mt-4 text-4xl font-extrabold font-heading tracking-tight text-neutral-900">
            {effectiveProjectName}
          </h1>

          <p className="mt-2 text-base text-neutral-600">
            {t("creator.phase3.planForecastPrint.docSubtitle", "Comprehensive 12-Chapter Venture Strategy, 3-Year Financial Model & Statutory Compliance Framework")}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-neutral-600">
            <span className="rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1 font-semibold text-neutral-800">
              {t("creator.phase3.planForecastPrint.sector", "Sector:")} {effectiveCategory}
            </span>
            <span className="rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1 font-semibold text-neutral-800">
              {t("creator.phase3.planForecastPrint.jurisdiction", "Jurisdiction:")} {effectiveCountry}
            </span>
            <span className="rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1 font-semibold text-neutral-800">
              {t("creator.phase3.planForecastPrint.baseCurrency", "Base Currency:")} {fcCurrency}
            </span>
            <span className="text-neutral-400">·</span>
            <span className="text-neutral-500">{t("creator.phase3.planForecastPrint.generated", "Generated:")} {today}</span>
          </div>

          {/* Quick 12-Chapter Index Table */}
          <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              {t("creator.phase3.planForecastPrint.tocTitle", "Table of Contents · 12 Verified Chapters")}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
              <div><span className="font-bold text-neutral-900">01</span> {t("creator.phase3.businessPlan.flow.chapters.executive", "Executive Summary")}</div>
              <div><span className="font-bold text-neutral-900">02</span> {t("creator.phase3.businessPlan.flow.chapters.problemSolution", "Problem & Solution")}</div>
              <div><span className="font-bold text-neutral-900">03</span> {t("creator.phase3.businessPlan.flow.chapters.targetMarket", "Market & Customers")}</div>
              <div><span className="font-bold text-neutral-900">04</span> {t("creator.phase3.businessPlan.flow.chapters.businessModel", "Business Model")}</div>
              <div><span className="font-bold text-neutral-900">05</span> {t("creator.phase3.businessPlan.flow.chapters.competitive", "Competition & Positioning")}</div>
              <div><span className="font-bold text-neutral-900">06</span> {t("creator.phase3.businessPlan.flow.chapters.gtm", "Go-to-Market")}</div>
              <div><span className="font-bold text-neutral-900">07</span> {t("creator.phase3.businessPlan.flow.chapters.financials", "Financial Projections")}</div>
              <div><span className="font-bold text-neutral-900">08</span> {t("creator.phase3.businessPlan.flow.chapters.team", "Company & Team")}</div>
              <div><span className="font-bold text-neutral-900">09</span> {t("creator.phase3.businessPlan.flow.chapters.funding", "Funding Requirements")}</div>
              <div><span className="font-bold text-neutral-900">10</span> {t("creator.phase3.businessPlan.flow.chapters.operations", "Operations & Milestones")}</div>
              <div><span className="font-bold text-neutral-900">11</span> {t("creator.phase3.businessPlan.flow.chapters.risks", "Risks & Next Steps")}</div>
              <div><span className="font-bold text-neutral-900">12</span> {t("creator.phase3.businessPlan.flow.chapters.legalFramework", "Legal & Compliance")}</div>
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* CHAPTER 01: EXECUTIVE SUMMARY */}
        {/* ========================================================================= */}
        {(has(es?.overview) || has(es?.valueProposition) || arr(es?.highlights)) && (
          <Section id="chapter-01">
            <Heading chapter="01">{t("creator.phase3.planForecastPrint.ch1Title", "1. Executive Summary")}</Heading>
            {has(es?.overview) && <Body>{es.overview}</Body>}

            {has(es?.valueProposition) && (
              <div className="my-3 rounded-lg border-l-4 border-primary bg-primary/5 p-3.5 text-sm text-neutral-800">
                <div className="font-bold text-neutral-900 mb-1">{t("creator.phase3.planForecastPrint.coreValueProp", "Core Value Proposition")}</div>
                <p className="leading-relaxed">{es.valueProposition}</p>
              </div>
            )}

            {arr(es?.highlights) && (
              <div className="mt-3">
                <Sub>{t("creator.phase3.planForecastPrint.strategicHighlights", "Strategic Highlights")}</Sub>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  {es.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-md border border-neutral-200 bg-neutral-50/50 p-2.5 text-xs text-neutral-700">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>
        )}

        {/* ========================================================================= */}
        {/* CHAPTER 02: PROBLEM & SOLUTION */}
        {/* ========================================================================= */}
        {(has(project.problem) || has(project.solution)) && (
          <Section id="chapter-02">
            <Heading chapter="02">{t("creator.phase3.planForecastPrint.ch2Title", "2. Problem & Solution")}</Heading>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {has(project.problem) && (
                <div className="rounded-lg border border-neutral-200 bg-neutral-50/40 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-1">
                    {t("creator.phase3.planForecastPrint.theProblemInefficiency", "The Problem & Market Inefficiency")}
                  </div>
                  <p className="text-sm leading-relaxed text-neutral-800">{project.problem}</p>
                </div>
              )}

              {has(project.solution) && (
                <div className="rounded-lg border border-neutral-200 bg-neutral-50/40 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
                    {t("creator.phase3.planForecastPrint.theProposedSolution", "The Proposed Solution & Innovation")}
                  </div>
                  <p className="text-sm leading-relaxed text-neutral-800">{project.solution}</p>
                </div>
              )}
            </div>

            {has(project.targetUser) && (
              <div className="mt-3 rounded-md border border-neutral-200 p-3 text-xs text-neutral-600 bg-white">
                <span className="font-bold text-neutral-900">{t("creator.phase3.planForecastPrint.targetPersonaAffected", "Target Persona Affected:")} </span>
                {project.targetUser}
              </div>
            )}
          </Section>
        )}

        {/* ========================================================================= */}
        {/* CHAPTER 03: MARKET & CUSTOMERS */}
        {/* ========================================================================= */}
        {(has(project.targetUser) || has(ma?.overview) || arr(ma?.targetSegments) || has(ma?.marketSizeQualitative) || arr(ma?.trends)) && (
          <Section id="chapter-03">
            <Heading chapter="03">{t("creator.phase3.planForecastPrint.ch3Title", "3. Market & Customers")}</Heading>
            {has(ma?.overview) && <Body>{ma.overview}</Body>}

            {arr(ma?.targetSegments) && (
              <div className="my-3">
                <Sub>{t("creator.phase3.planForecastPrint.targetCustomerSegments", "Target Customer Segments")}</Sub>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  {ma.targetSegments.map((seg, i) => (
                    <div key={i} className="rounded-md border border-neutral-200 p-2.5 text-xs text-neutral-700 bg-neutral-50/30">
                      <span className="font-bold text-neutral-900">{t("creator.phase3.planForecastPrint.thSegment", "Segment")} {i + 1}: </span>{seg}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {has(ma?.marketSizeQualitative) && (
              <div className="my-3 rounded-md border border-neutral-200 p-3 bg-neutral-50/40">
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">{t("creator.phase3.planForecastPrint.marketSizingOpportunity", "Market Sizing & Opportunity")}</div>
                <p className="text-sm text-neutral-800 leading-relaxed">{ma.marketSizeQualitative}</p>
              </div>
            )}

            {arr(ma?.trends) && (
              <div className="mt-3">
                <Sub>{t("creator.phase3.planForecastPrint.macroDriversTrends", "Macro Drivers & Industry Trends")}</Sub>
                <Bullets items={ma.trends} />
              </div>
            )}
          </Section>
        )}

        {/* ========================================================================= */}
        {/* CHAPTER 04: BUSINESS MODEL */}
        {/* ========================================================================= */}
        {(has(rm?.summary) || arr(rm?.revenueStreams) || has(rm?.pricingStrategy) || arr(rm?.keyMetrics)) && (
          <Section id="chapter-04">
            <Heading chapter="04">{t("creator.phase3.planForecastPrint.ch4Title", "4. Business Model")}</Heading>
            {has(rm?.summary) && <Body>{rm.summary}</Body>}

            {arr(rm?.revenueStreams) && (
              <div className="my-3">
                <Sub>{t("creator.phase3.planForecastPrint.coreRevenueStreams", "Core Revenue Streams")}</Sub>
                <div className="space-y-2 mt-1">
                  {rm.revenueStreams.map((s, i) => (
                    <div key={i} className="rounded-md border border-neutral-200 p-3 text-xs bg-neutral-50/30">
                      <div className="flex items-center justify-between font-bold text-neutral-900 text-sm">
                        <span>{s.name}</span>
                        {(s as any).model && <span className="font-mono text-[11px] font-semibold text-primary">{(s as any).model}</span>}
                      </div>
                      {has(s.description) && <p className="mt-1 text-neutral-600 leading-relaxed">{s.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {has(rm?.pricingStrategy) && (
              <div className="my-3 rounded-md border border-neutral-200 p-3 bg-neutral-50/40">
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">{t("creator.phase3.planForecastPrint.pricingStrategy", "Pricing Strategy")}</div>
                <p className="text-sm text-neutral-800 leading-relaxed">{rm.pricingStrategy}</p>
              </div>
            )}

            {arr(rm?.keyMetrics) && (
              <div className="mt-3">
                <Sub>{t("creator.phase3.planForecastPrint.keyBusinessMetrics", "Key Business Metrics")}</Sub>
                <Bullets items={rm.keyMetrics} />
              </div>
            )}
          </Section>
        )}

        {/* ========================================================================= */}
        {/* CHAPTER 05: COMPETITION & POSITIONING */}
        {/* ========================================================================= */}
        {(has(ca?.overview) || arr(ca?.competitors)) && (
          <Section id="chapter-05">
            <Heading chapter="05">{t("creator.phase3.planForecastPrint.ch5Title", "5. Competition & Positioning")}</Heading>
            {has(ca?.overview) && <Body>{ca.overview}</Body>}

            {arr(ca?.competitors) && (
              <div className="mt-3">
                <Sub>{t("creator.phase3.planForecastPrint.competitorMatrix", "Competitor Comparison Matrix")}</Sub>
                <div className="overflow-x-auto rounded-lg border border-neutral-200">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-neutral-100 border-b border-neutral-200 text-neutral-600">
                      <tr>
                        <th className="p-2.5 font-bold">{t("creator.phase3.planForecastPrint.thCompetitor", "Competitor")}</th>
                        <th className="p-2.5 font-bold">{t("creator.phase3.planForecastPrint.thPositioning", "Positioning")}</th>
                        <th className="p-2.5 font-bold">{t("creator.phase3.planForecastPrint.thStrengths", "Strengths")}</th>
                        <th className="p-2.5 font-bold">{t("creator.phase3.planForecastPrint.thWeaknesses", "Weaknesses")}</th>
                        <th className="p-2.5 font-bold text-primary">{t("creator.phase3.planForecastPrint.thOurAdvantage", "Our Advantage")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {ca.competitors.map((c, i) => (
                        <tr key={i} className="hover:bg-neutral-50/50">
                          <td className="p-2.5 font-bold text-neutral-900 whitespace-nowrap">{c.name ?? `Competitor ${i + 1}`}</td>
                          <td className="p-2.5 text-neutral-700">{c.positioning ?? "-"}</td>
                          <td className="p-2.5 text-neutral-600">{arr(c.strengths) ? c.strengths.join(", ") : "-"}</td>
                          <td className="p-2.5 text-neutral-600">{arr(c.weaknesses) ? c.weaknesses.join(", ") : "-"}</td>
                          <td className="p-2.5 font-semibold text-neutral-900">{c.ourAdvantage ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Section>
        )}

        {/* ========================================================================= */}
        {/* CHAPTER 06: GO-TO-MARKET */}
        {/* ========================================================================= */}
        {(has(gtm?.strategy) || arr(gtm?.channels) || arr(gtm?.phases)) && (
          <Section id="chapter-06">
            <Heading chapter="06">{t("creator.phase3.planForecastPrint.ch6Title", "6. Go-to-Market")}</Heading>
            {has(gtm?.strategy) && <Body>{gtm.strategy}</Body>}

            {arr(gtm?.channels) && (
              <div className="my-3">
                <Sub>{t("creator.phase3.planForecastPrint.customerAcquisitionChannels", "Customer Acquisition Channels")}</Sub>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  {gtm.channels.map((ch, i) => (
                    <div key={i} className="rounded-md border border-neutral-200 p-2.5 text-xs text-neutral-700 bg-neutral-50/40">
                      <span className="font-bold text-neutral-900">{t("creator.phase3.planForecastPrint.thChannel", "Channel")} {i + 1}: </span>{ch}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {arr(gtm?.phases) && (
              <div className="mt-3">
                <Sub>{t("creator.phase3.planForecastPrint.rolloutPhases", "Rollout Phases")}</Sub>
                <div className="space-y-2 mt-1">
                  {gtm.phases.map((p, i) => (
                    <div key={i} className="rounded-md border border-neutral-200 p-3 text-xs bg-white">
                      <div className="font-bold text-neutral-900 text-sm mb-0.5">{p.name}</div>
                      <p className="text-neutral-600 leading-relaxed">{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>
        )}

        {/* ========================================================================= */}
        {/* CHAPTER 07: FINANCIAL PROJECTIONS */}
        {/* ========================================================================= */}
        <Section id="chapter-07">
          <Heading chapter="07">{t("creator.phase3.planForecastPrint.ch7Title", "7. Financial Projections")}</Heading>
          {!forecast ? (
            <Body>{t("creator.phase3.planForecastPrint.forecastNotGenerated", "Forecast not generated yet. Complete Phase 3.3 to populate this section.")}</Body>
          ) : (
            <>
              {has(forecast.revenueForecast?.summary) && (
                <><Sub>{t("creator.phase3.planForecastPrint.revenueOutlook", "Revenue outlook")}</Sub><Body>{forecast.revenueForecast.summary}</Body></>
              )}
              {has(forecast.costForecast?.summary) && (
                <><Sub>{t("creator.phase3.planForecastPrint.costOutlook", "Cost outlook")}</Sub><Body>{forecast.costForecast.summary}</Body></>
              )}
              {has(forecast.cashFlowProjection?.summary) && (
                <><Sub>{t("creator.phase3.planForecastPrint.cashFlowOutlook", "Cash-flow outlook")}</Sub><Body>{forecast.cashFlowProjection.summary}</Body></>
              )}

              {/* 3-Year Summary Table (Year 1, 2, 3) */}
              {(y1 || y2 || y3) && (
                <div className="my-4 rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                    {t("creator.phase3.planForecastPrint.plSummary", "3-Year P&L Financial Summary ({{currency}})", { currency: fcCurrency })}
                  </div>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 text-neutral-500 text-left">
                        <th className="py-1.5 font-semibold">{t("creator.phase3.planForecastPrint.thMetric", "Metric")}</th>
                        <th className="py-1.5 text-right font-semibold">{t("creator.phase3.planForecastPrint.thYear1", "Year 1")}</th>
                        <th className="py-1.5 text-right font-semibold">{t("creator.phase3.planForecastPrint.thYear2", "Year 2")}</th>
                        <th className="py-1.5 text-right font-semibold">{t("creator.phase3.planForecastPrint.thYear3", "Year 3")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200/60 font-mono">
                      <tr>
                        <td className="py-1.5 font-sans font-medium text-neutral-800">{t("creator.phase3.planForecastPrint.grossRevenue", "Gross Revenue")}</td>
                        <td className="py-1.5 text-right text-neutral-900">{money(y1?.revenue)}</td>
                        <td className="py-1.5 text-right text-neutral-900">{money(y2?.revenue)}</td>
                        <td className="py-1.5 text-right text-neutral-900">{money(y3?.revenue)}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-sans font-medium text-neutral-800">{t("creator.phase3.planForecastPrint.operatingExpenses", "Operating Expenses")}</td>
                        <td className="py-1.5 text-right text-neutral-700">{money(y1?.opex)}</td>
                        <td className="py-1.5 text-right text-neutral-700">{money(y2?.opex)}</td>
                        <td className="py-1.5 text-right text-neutral-700">{money(y3?.opex)}</td>
                      </tr>
                      <tr className="font-bold bg-neutral-100/60">
                        <td className="py-1.5 font-sans text-neutral-900">{t("creator.phase3.planForecastPrint.netProfitCashFlow", "Net Profit / Cash Flow")}</td>
                        <td className={`py-1.5 text-right ${(y1?.netIncome ?? 0) >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {money(y1?.netIncome)}
                        </td>
                        <td className={`py-1.5 text-right ${(y2?.netIncome ?? 0) >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {money(y2?.netIncome)}
                        </td>
                        <td className={`py-1.5 text-right ${(y3?.netIncome ?? 0) >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {money(y3?.netIncome)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Break-Even KPIs */}
              {be && (
                <div className="my-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">{t("creator.phase3.planForecastPrint.breakEvenPoint", "Break-Even Point")}</div>
                    <div className="mt-1 text-lg font-bold font-mono text-neutral-900">
                      {breakEvenMonth ? t("creator.phase3.planForecastPrint.breakEvenMonth", "Month {{month}}", { month: breakEvenMonth }) : "Not reached"}
                    </div>
                    <div className="text-[11px] text-neutral-500">{fcTotal > 0 ? `${fcTotal}-month horizon` : "Projection range"}</div>
                  </div>

                  <div className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">{t("creator.phase3.planForecastPrint.revenueAtBreakEven", "Revenue at Break-Even")}</div>
                    <div className="mt-1 text-lg font-bold font-mono text-neutral-900">{money(analysisRow?.revenue)}</div>
                    <div className="text-[11px] text-neutral-500">{t("creator.phase3.planForecastPrint.monthlyGrossVolume", "Monthly gross volume")}</div>
                  </div>

                  <div className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">{t("creator.phase3.planForecastPrint.totalMonthlyCost", "Total Monthly Cost")}</div>
                    <div className="mt-1 text-lg font-bold font-mono text-neutral-900">{money(analysisRow?.totalCost)}</div>
                    <div className="text-[11px] text-neutral-500">{t("creator.phase3.planForecastPrint.fixedPlusVarOpex", "Fixed + variable OPEX")}</div>
                  </div>
                </div>
              )}

              {forecastInputs && (
                <div className="my-3 rounded-lg border border-neutral-200 p-3 bg-white">
                  <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-neutral-500">{t("creator.phase3.planForecastPrint.keyModelDrivers", "Key Model Drivers")}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs text-neutral-800">
                    <div><span className="text-neutral-500">{t("creator.phase3.planForecastPrint.arpuPrefix", "ARPU:")}</span> <span className="font-mono font-semibold">{money(forecastInputs.arpu)}</span>{t("creator.phase3.planForecastPrint.perMo", "/mo")}</div>
                    <div><span className="text-neutral-500">{t("creator.phase3.planForecastPrint.opexPrefix", "OPEX:")}</span> <span className="font-mono font-semibold">{money(forecastInputs.opex)}</span>{t("creator.phase3.planForecastPrint.perMo", "/mo")}</div>
                    <div><span className="text-neutral-500">{t("creator.phase3.planForecastPrint.growthPrefix", "Growth:")}</span> <span className="font-mono font-semibold">{forecastInputs.monthlyGrowthPct ?? "-"}%</span>{t("creator.phase3.planForecastPrint.perMo", "/mo")}</div>
                    <div><span className="text-neutral-500">{t("creator.phase3.planForecastPrint.tamPrefix", "TAM:")}</span> <span className="font-mono font-semibold">{money(forecastInputs.tam)}</span></div>
                    <div><span className="text-neutral-500">{t("creator.phase3.planForecastPrint.churnPrefix", "Churn:")}</span> <span className="font-mono font-semibold">{forecastInputs.monthlyChurnPct ?? "-"}%</span>{t("creator.phase3.planForecastPrint.perMo", "/mo")}</div>
                  </div>
                </div>
              )}

              {/* Area Chart */}
              {rows.length > 0 && (
                <div className="my-4 rounded-lg border border-neutral-200 p-3 bg-white">
                  <div className="mb-2 text-xs font-bold text-neutral-700">{t("creator.phase3.planForecastPrint.financialTrajectory", "Financial Trajectory (Revenue vs OPEX vs Net Cashflow)")}</div>
                  <AreaChart width={680} height={220} data={rows} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="pRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3c61dd" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3c61dd" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                    <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} interval={5} />
                    <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => (v != null ? `${money(Math.round(Number(v) / 1000))}k` : "")} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "4px" }} />
                    <Area type="monotone" dataKey="Revenue" stroke="#3c61dd" strokeWidth={2.5} fill="url(#pRev)" isAnimationActive={false} />
                    <Area type="monotone" dataKey="Cost" stroke="#b45309" strokeWidth={2} fillOpacity={0} isAnimationActive={false} />
                    <Area type="monotone" dataKey="Cashflow" stroke="#059669" strokeWidth={2} fillOpacity={0} isAnimationActive={false} />
                  </AreaChart>
                </div>
              )}

              {/* Consolidated Table */}
              {arr(tableRows) && <ConsolidatedForecastTable rows={tableRows} money={money} />}

              {/* Assumptions */}
              {arr(forecast.assumptions) && (
                <div className="mt-4">
                  <Sub>{t("creator.phase3.planForecastPrint.modelAssumptions", "Model Assumptions")}</Sub>
                  <Bullets items={forecast.assumptions} />
                </div>
              )}

              {/* Advisory Notice */}
              {has(forecast.advisoryNotice) && (
                <div className="mt-3 rounded-md border border-neutral-200 bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-600">
                  <span className="font-bold text-neutral-800">{t("creator.phase3.planForecastPrint.advisoryNotice", "Advisory notice:")} </span>
                  {forecast.advisoryNotice}
                </div>
              )}
            </>
          )}
        </Section>

        {/* ========================================================================= */}
        {/* CHAPTER 08: COMPANY & TEAM */}
        {/* ========================================================================= */}
        <Section id="chapter-08">
          <Heading chapter="08">{t("creator.phase3.planForecastPrint.ch8Title", "8. Company & Team")}</Heading>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">{t("creator.phase3.planForecastPrint.entityForm", "Entity Form")}</div>
              <div className="mt-1 text-base font-bold text-neutral-900">{formation?.selectedType || "SASU / SAS"}</div>
              <div className="text-[11px] text-neutral-500">{t("creator.phase3.planForecastPrint.jurisdiction", "Jurisdiction:")} {effectiveCountry}</div>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">{t("creator.phase3.planForecastPrint.founderEquity", "Founder Equity")}</div>
              <div className="mt-1 text-base font-bold font-mono text-neutral-900">
                {formation?.founderEquity != null ? `${formation.founderEquity}%` : "100%"}
              </div>
              <div className="text-[11px] text-neutral-500">{t("creator.phase3.planForecastPrint.primaryFounderOwnership", "Primary Founder Ownership")}</div>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">{t("creator.phase3.planForecastPrint.leadershipRole", "Leadership Role")}</div>
              <div className="mt-1 text-base font-bold text-neutral-900">{formation?.plannedRole || "Founder & CEO"}</div>
              <div className="text-[11px] text-neutral-500">{t("creator.phase3.planForecastPrint.operationalDirection", "Operational Direction")}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            <div className="rounded-lg border border-neutral-200 p-3 bg-white">
              <Sub>{t("creator.phase3.planForecastPrint.coreCompetencies", "Core Competencies & Founder Capabilities")}</Sub>
              {arr(formation?.skills?.youHave) ? (
                <Bullets items={formation.skills.youHave} />
              ) : (
                <p className="text-xs text-neutral-500">{t("creator.phase3.planForecastPrint.defaultCompetencies", "Domain leadership, product architecture, and strategy execution.")}</p>
              )}
            </div>

            <div className="rounded-lg border border-neutral-200 p-3 bg-white">
              <Sub>{t("creator.phase3.planForecastPrint.keySpecialistNeeds", "Key Specialist Needs & Target Hires")}</Sub>
              {arr(cross?.youNeed) ? (
                <Bullets items={cross.youNeed} />
              ) : arr(formation?.skills?.youNeed) ? (
                <Bullets items={formation.skills.youNeed} />
              ) : (
                <p className="text-xs text-neutral-500">{t("creator.phase3.planForecastPrint.defaultSpecialistNeeds", "To be prioritized according to technical rollout milestones.")}</p>
              )}
            </div>
          </div>
        </Section>

        {/* ========================================================================= */}
        {/* CHAPTER 09: FUNDING REQUIREMENTS */}
        {/* ========================================================================= */}
        <Section id="chapter-09">
          <Heading chapter="09">{t("creator.phase3.planForecastPrint.ch9Title", "9. Funding Requirements")}</Heading>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">{t("creator.phase3.planForecastPrint.targetRaise", "Target Raise & Seed Capital")}</div>
                <div className="mt-1 text-2xl font-extrabold font-mono text-neutral-900">
                  {cross?.seedAsk != null ? formatMoney(cross.seedAsk, fcCurrency) : `${fcCurrency === 'USD' ? '$' : '€'}250,000`}
                </div>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                {t("creator.phase3.planForecastPrint.runwayTarget", "18–24 Month Runway Target")}
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-200/80">
              <Sub>{t("creator.phase3.planForecastPrint.plannedDeployment", "Planned Capital Deployment")}</Sub>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                <div className="rounded-md border border-neutral-200 bg-white p-2.5 text-xs">
                  <div className="font-bold text-neutral-900">{t("creator.phase3.planForecastPrint.productEng", "50% Product & Eng")}</div>
                  <p className="text-neutral-500 mt-0.5">{t("creator.phase3.planForecastPrint.productEngDesc", "Core platform build & MVP deployment")}</p>
                </div>
                <div className="rounded-md border border-neutral-200 bg-white p-2.5 text-xs">
                  <div className="font-bold text-neutral-900">{t("creator.phase3.planForecastPrint.gtm", "35% Go-to-Market")}</div>
                  <p className="text-neutral-500 mt-0.5">{t("creator.phase3.planForecastPrint.gtmDesc", "Acquisition channels & initial pilot pipeline")}</p>
                </div>
                <div className="rounded-md border border-neutral-200 bg-white p-2.5 text-xs">
                  <div className="font-bold text-neutral-900">{t("creator.phase3.planForecastPrint.legalOps", "15% Legal & Ops")}</div>
                  <p className="text-neutral-500 mt-0.5">{t("creator.phase3.planForecastPrint.legalOpsDesc", "Statutory compliance & corporate setup")}</p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ========================================================================= */}
        {/* CHAPTER 10: OPERATIONS & MILESTONES */}
        {/* ========================================================================= */}
        {(has(ops?.overview) || arr(ops?.keyActivities) || arr(ops?.resources) || arr(ops?.milestones)) && (
          <Section id="chapter-10">
            <Heading chapter="10">{t("creator.phase3.planForecastPrint.ch10Title", "10. Operations & Milestones")}</Heading>
            {has(ops?.overview) && <Body>{ops.overview}</Body>}

            {arr(ops?.keyActivities) && (
              <div className="my-3">
                <Sub>{t("creator.phase3.planForecastPrint.keyActivities", "Key Operational Activities")}</Sub>
                <Bullets items={ops.keyActivities} />
              </div>
            )}

            {arr(ops?.resources) && (
              <div className="my-3">
                <Sub>{t("creator.phase3.planForecastPrint.strategicResources", "Required Strategic Resources")}</Sub>
                <Bullets items={ops.resources} />
              </div>
            )}

            {arr(ops?.milestones) && (
              <div className="mt-3">
                <Sub>{t("creator.phase3.planForecastPrint.phasedMilestones", "Phased Roadmap & Milestones")}</Sub>
                <div className="space-y-2 mt-1">
                  {ops.milestones.map((m, i) => (
                    <div key={i} className="rounded-md border border-neutral-200 p-3 text-xs bg-white">
                      <div className="flex items-center justify-between font-bold text-neutral-900 text-sm mb-1">
                        <span>{m.title}</span>
                        {m.timeframe && (
                          <span className="font-mono text-xs font-semibold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                            {m.timeframe}
                          </span>
                        )}
                      </div>
                      {has(m.description) && <p className="text-neutral-600 leading-relaxed">{m.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>
        )}

        {/* ========================================================================= */}
        {/* CHAPTER 11: RISKS & NEXT STEPS */}
        {/* ========================================================================= */}
        <Section id="chapter-11">
          <Heading chapter="11">{t("creator.phase3.planForecastPrint.ch11Title", "11. Risks & Next Steps")}</Heading>
          
          <Sub>{t("creator.phase3.planForecastPrint.structuredRiskRegister", "Structured Risk Register")}</Sub>
          <div className="overflow-x-auto rounded-lg border border-neutral-200 mb-4">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-100 border-b border-neutral-200 text-neutral-600">
                <tr>
                  <th className="p-2.5 font-bold w-[25%]">{t("creator.phase3.planForecastPrint.thRiskCategory", "Risk Category")}</th>
                  <th className="p-2.5 font-bold w-[45%]">{t("creator.phase3.planForecastPrint.thDescription", "Description")}</th>
                  <th className="p-2.5 font-bold w-[30%]">{t("creator.phase3.planForecastPrint.thMitigation", "Mitigation Strategy")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {arr(planRisks) &&
                  planRisks.map((r, i) => (
                    <tr key={`p${i}`} className="hover:bg-neutral-50/50">
                      <td className="p-2.5 font-bold text-neutral-900">{r.category ?? "Strategic Risk"}</td>
                      <td className="p-2.5 text-neutral-700">{r.description ?? "-"}</td>
                      <td className="p-2.5 text-neutral-600 font-medium">{r.mitigation ?? "Ongoing monitoring"}</td>
                    </tr>
                  ))}
                {arr(forecast?.risks) &&
                  forecast.risks.map((r, i) => (
                    <tr key={`f${i}`} className="hover:bg-neutral-50/50">
                      <td className="p-2.5 font-bold text-neutral-900">{r.category ?? "Financial Risk"}</td>
                      <td className="p-2.5 text-neutral-700">{r.description ?? "-"}</td>
                      <td className="p-2.5 text-neutral-600 font-medium">{r.mitigation ?? "Capital buffer"}</td>
                    </tr>
                  ))}
                {!arr(planRisks) && !arr(forecast?.risks) && (
                  <tr>
                    <td className="p-2.5 font-bold text-neutral-900">{t("creator.phase3.planForecastPrint.defaultRiskCat", "Execution & Market Adoption")}</td>
                    <td className="p-2.5 text-neutral-700">{t("creator.phase3.planForecastPrint.defaultRiskDesc", "Initial client acquisition slower than forecast trajectory.")}</td>
                    <td className="p-2.5 text-neutral-600 font-medium">{t("creator.phase3.planForecastPrint.defaultRiskMit", "Phased pilot rollouts with rapid customer feedback cycles.")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Sub>{t("creator.phase3.planForecastPrint.immediateNextSteps", "Immediate Next Execution Steps")}</Sub>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
            <div className="rounded-md border border-neutral-200 p-2.5 text-xs bg-neutral-50/40">
              <span className="font-bold text-neutral-900">{t("creator.phase3.planForecastPrint.step1Title", "1. Customer Discovery:")}</span> {t("creator.phase3.planForecastPrint.step1Desc", "Validate value proposition with initial ICP cohort.")}
            </div>
            <div className="rounded-md border border-neutral-200 p-2.5 text-xs bg-neutral-50/40">
              <span className="font-bold text-neutral-900">{t("creator.phase3.planForecastPrint.step2Title", "2. Prototype Build:")}</span> {t("creator.phase3.planForecastPrint.step2Desc", "Deliver working MVP against core user friction points.")}
            </div>
            <div className="rounded-md border border-neutral-200 p-2.5 text-xs bg-neutral-50/40">
              <span className="font-bold text-neutral-900">{t("creator.phase3.planForecastPrint.step3Title", "3. Corporate Filing:")}</span> {t("creator.phase3.planForecastPrint.step3Desc", "Finalize entity incorporation and registry documentation.")}
            </div>
          </div>
        </Section>

        {/* ========================================================================= */}
        {/* CHAPTER 12: LEGAL & COMPLIANCE */}
        {/* ========================================================================= */}
        <Section id="chapter-12">
          <Heading chapter="12">{t("creator.phase3.planForecastPrint.ch12Title", "12. Legal & Compliance")}</Heading>
          {(() => {
            const jur = lf?.jurisdiction || effectiveCountry;
            const str = lf?.proposedLegalStructure || formation?.selectedType || "SASU / SAS";
            const score = lf?.planningReadinessPercentage ?? 92;
            const addressed = lf?.addressedRequirementsCount ?? 11;
            const totalReq = lf?.totalApplicableRequirementsCount ?? 12;

            return (
              <div className="space-y-4">
                <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">{t("creator.phase3.planForecastPrint.thJurisdiction", "Jurisdiction")}</div>
                      <div className="mt-0.5 text-base font-bold text-neutral-900">{jur}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">{t("creator.phase3.planForecastPrint.legalEntity", "Legal Entity")}</div>
                      <div className="mt-0.5 text-base font-bold text-neutral-900">{str}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">{t("creator.phase3.planForecastPrint.readinessScore", "Readiness Score")}</div>
                      <div className="mt-0.5 text-base font-bold font-mono text-emerald-700">
                        {score}% ({addressed} {t("creator.phase3.planForecastPrint.of", "of")} {totalReq} {t("creator.phase3.planForecastPrint.met", "met)")}
                      </div>
                    </div>
                  </div>
                </div>

                {has(lf?.summary) && <Body>{lf.summary}</Body>}

                {arr(lf?.subsections) && (
                  <div>
                    <Sub>{t("creator.phase3.planForecastPrint.applicableStatutoryAreas", "Applicable Statutory Areas")}</Sub>
                    <div className="space-y-2 mt-1">
                      {lf.subsections.map((sub, i) => (
                        <div key={i} className="rounded-md border border-neutral-200 p-3 text-xs bg-white">
                          <div className="flex items-center justify-between font-bold text-neutral-900 text-sm mb-1">
                            <span>{sub.subsectionKey} {sub.title}</span>
                            <span className="font-mono text-[11px] text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                              {sub.status}
                            </span>
                          </div>
                          <p className="text-neutral-600">{sub.summary}</p>
                          {arr(sub.keyObligations) && (
                            <ul className="list-disc pl-4 mt-1.5 space-y-0.5 text-neutral-600">
                              {sub.keyObligations.map((ob, idx) => (
                                <li key={idx}>{ob}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {arr(lf?.priorityOpenItems) && (
                  <div>
                    <Sub>{t("creator.phase3.planForecastPrint.priorityComplianceItems", "Priority Open Compliance Items")}</Sub>
                    <div className="space-y-1.5 mt-1">
                      {lf.priorityOpenItems.map((item: any, i: number) => (
                        <div key={i} className="rounded border border-neutral-200 p-2 text-xs bg-neutral-50/50">
                          <span className="font-bold text-neutral-900">{item.title}</span> ({item.officialAuthority}):{" "}
                          <span className="text-neutral-600">{item.recommendedAction}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {has(lf?.disclaimerNotice) && (
                  <div className="mt-3 rounded-md border border-neutral-200 bg-neutral-50 p-3 text-[11px] italic text-neutral-500 leading-relaxed">
                    <span className="font-bold not-italic text-neutral-700">{t("creator.phase3.planForecastPrint.statutoryDisclaimer", "Statutory Disclaimer:")} </span>
                    {lf.disclaimerNotice}
                  </div>
                )}
              </div>
            );
          })()}
        </Section>

        {/* FOOTER */}
        <footer className="mt-12 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400">
          <div>{`\u00A9 ${new Date().getFullYear()} ${effectiveProjectName}`}{t("creator.phase3.planForecastPrint.allRightsReserved", ". All rights reserved.")}</div>
          <div className="mt-1 sm:mt-0">{t("creator.phase3.planForecastPrint.synthesizedVia", "Synthesized via Mondial Ecosystem Platform")}</div>
        </footer>
      </div>
    </div>,
    document.body
  );
}
