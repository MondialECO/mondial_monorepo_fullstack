"use client";

import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Printer, X, Check } from "lucide-react";
import type { MarketStudyOutput } from "@/types/creator/ai";

function formatCurrency(amount?: number | null, currency = "USD"): string {
  if (amount === undefined || amount === null || Number.isNaN(amount)) return "—";
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  if (amount >= 1_000_000_000) {
    const val = amount / 1_000_000_000;
    return `${symbol}${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    const val = amount / 1_000_000;
    return `${symbol}${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    const val = amount / 1_000;
    return `${symbol}${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}K`;
  }
  return `${symbol}${amount.toLocaleString()}`;
}

interface MarketStudyPrintProps {
  open: boolean;
  onClose: () => void;
  projectName?: string;
  logoUrl?: string | null;
  project?: {
    sector?: string;
    geography?: string;
    marketGap?: string;
    targetUser?: string;
  };
  output: MarketStudyOutput | null | undefined;
}

const has = (s?: string | null): s is string => !!s && s.trim().length > 0;
const arr = <T,>(a?: T[] | null): a is T[] => Array.isArray(a) && a.length > 0;

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`print-section mb-8 ${className}`}>{children}</section>;
}

function SectionHeading({ num, title }: { num: string; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-neutral-200">
      <span className="w-6 h-6 rounded bg-neutral-900 text-white flex items-center justify-center text-xs font-mono font-bold shrink-0">
        {num}
      </span>
      <h2 className="text-base font-bold tracking-tight text-neutral-900 uppercase font-heading">{title}</h2>
    </div>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-1 mt-3 text-xs font-bold uppercase tracking-wider text-neutral-500 font-mono">{children}</h3>;
}

export default function MarketStudyPrintView({
  open,
  onClose,
  projectName,
  logoUrl,
  project,
  output,
}: MarketStudyPrintProps) {
  useEffect(() => {
    if (!open) return;
    document.body.classList.add("printing-active");
    return () => document.body.classList.remove("printing-active");
  }, [open]);

  const [logoError, setLogoError] = useState(false);

  // Derived Target Segments List
  const targetSegmentsList = useMemo(() => {
    if (project?.targetUser) {
      const parts = project.targetUser.split(/[,;\n]+/).map(p => p.trim()).filter(Boolean);
      return parts.map((p, idx) => ({
        id: String(idx + 1).padStart(2, "0"),
        title: p,
        description:
          idx === 0 && output?.marketGapValidation?.primaryGap
            ? output.marketGapValidation.primaryGap
            : `Core target customer cohort operating in ${project?.geography || "target territory"}.`,
      }));
    }
    return [
      {
        id: "01",
        title: project?.sector ? `${project.sector} Customers` : "Primary Target Users",
        description: `Core target user segment operating in ${project?.geography || "target territory"}.`,
      },
    ];
  }, [output, project]);

  if (!open || typeof document === "undefined" || !output) return null;

  const today = new Date().toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const safeLogoSrc = logoUrl
    ? logoUrl.trim().startsWith("<svg")
      ? `data:image/svg+xml;utf8,${encodeURIComponent(logoUrl.trim())}`
      : logoUrl
    : null;

  const sizing = output.marketSizing;
  const tam = sizing?.tam;
  const sam = sizing?.sam;
  const som = sizing?.som;

  const competitors = output.competitorLandscape?.directCompetitors || [];
  const competitorSummary = output.competitorLandscape?.summary;
  const indirectCompetitors = output.competitorLandscape?.indirectCompetitors || [];
  const demandSignals = output.demandSignals || [];
  const sizingRisks = output.sizingRisks || [];
  const gapValidation = output.marketGapValidation;

  const tamVal = tam?.value;
  const samVal = sam?.value;
  const somVal = som?.value;

  const samPctOfTam = sam?.percentageOfTam ?? (tamVal && samVal ? (samVal / tamVal) * 100 : 15);
  const somPctOfSam = som?.percentageOfSam ?? (samVal && somVal ? (somVal / samVal) * 100 : 2.5);
  const somPctOfTam = tamVal && somVal ? (somVal / tamVal) * 100 : (samPctOfTam * somPctOfSam) / 100;

  const formatPct = (val: number) =>
    Number.isInteger(val) || Math.round(val * 10) % 10 === 0 ? val.toFixed(0) : val.toFixed(1);

  const displaySector = project?.sector || "Small-business software";
  const displayRegion = project?.geography || "France";
  const displayTargetUser = project?.targetUser || targetSegmentsList[0]?.title || "independent retailers";

  const impactColor = (level?: string) => {
    const l = (level || "").toLowerCase();
    if (l === "high") return "bg-red-50 text-red-800 border-red-200";
    if (l === "medium") return "bg-amber-50 text-amber-800 border-amber-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  return createPortal(
    <div data-print-overlay className="fixed inset-0 z-[100] overflow-auto bg-neutral-200 print:bg-white">
      {/* Toolbar - never printed */}
      <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-neutral-300 bg-neutral-100 px-4 py-3">
        <Button variant="ghost" size="sm" onClick={onClose} className="gap-1.5 text-neutral-700">
          <X className="h-4 w-4" /> Close
        </Button>
        <span className="text-xs text-neutral-500 font-sans">
          Use your browser&apos;s &ldquo;Save as PDF&rdquo; in the print dialog.
        </span>
        <Button
          size="sm"
          onClick={() => window.print()}
          className="gap-2 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
        >
          <Printer className="h-4 w-4" /> Print / Save as PDF
        </Button>
      </div>

      <div className="print-document mx-auto my-8 max-w-[840px] bg-white px-12 py-10 shadow-lg text-neutral-900 font-sans">
        {/* ========== DOCUMENT HEADER ========== */}
        <header className="print-section mb-8 pb-6 border-b-2 border-neutral-900">
          {/* Top meta line */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-neutral-400">
              Mondial · Market Study &amp; Competitive Intelligence
            </span>
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
              Phase 3.1 Output
            </span>
          </div>

          {/* Logo + Project Name Row */}
          <div className="flex items-center gap-5">
            {safeLogoSrc && !logoError ? (
              <div className="shrink-0 min-w-[70px] max-w-[120px] h-14 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={safeLogoSrc}
                  alt={`${has(projectName) ? projectName : "Project"} Logo`}
                  className="w-full h-full object-contain"
                  onError={() => setLogoError(true)}
                />
              </div>
            ) : (
              <div className="size-12 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-xl font-heading shrink-0">
                {(has(projectName) ? projectName : "M").charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 leading-tight font-heading">
                {has(projectName) ? projectName : "Market Study — Executive Report"}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-neutral-500 font-mono">
                <span>{today}</span>
                <span className="text-neutral-300">·</span>
                <span>{displaySector}</span>
                <span className="text-neutral-300">·</span>
                <span>{displayRegion}</span>
              </div>
            </div>
          </div>
        </header>

        {/* ========== SECTION 1: OPPORTUNITY SUMMARY CARD ========== */}
        <Section className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-5 space-y-1.5">
          <div className="text-xs font-heading font-semibold uppercase tracking-wider text-neutral-400">
            YOUR MARKET OPPORTUNITY
          </div>
          <p className="text-sm font-sans font-normal leading-relaxed text-neutral-900">
            Your project operates in the {displaySector.toLowerCase()} market, targeting{" "}
            {displayTargetUser} in {displayRegion}, with an estimated addressable opportunity of{" "}
            <span className="font-mono font-bold text-neutral-950">{formatCurrency(tam?.value, tam?.currency)}</span>.
          </p>
        </Section>

        {/* ========== SECTION 2: MARKET OVERVIEW GRID ========== */}
        <Section>
          <div className="grid grid-cols-4 gap-3">
            <div className="rounded-lg border border-neutral-200 p-3.5 space-y-1">
              <div className="text-xs font-heading font-medium uppercase tracking-wider text-neutral-400">
                INDUSTRY
              </div>
              <div className="text-sm font-sans font-semibold text-neutral-900 truncate">
                {displaySector}
              </div>
            </div>
            <div className="rounded-lg border border-neutral-200 p-3.5 space-y-1">
              <div className="text-xs font-heading font-medium uppercase tracking-wider text-neutral-400">
                MARKET
              </div>
              <div className="text-sm font-sans font-semibold text-neutral-900 truncate">
                {tam?.label || project?.marketGap || `${displaySector} operations tools`}
              </div>
            </div>
            <div className="rounded-lg border border-neutral-200 p-3.5 space-y-1">
              <div className="text-xs font-heading font-medium uppercase tracking-wider text-neutral-400">
                PRIMARY GEOGRAPHY
              </div>
              <div className="text-sm font-sans font-semibold text-neutral-900 truncate">
                {displayRegion}
              </div>
            </div>
            <div className="rounded-lg border border-neutral-200 p-3.5 space-y-1">
              <div className="text-xs font-heading font-medium uppercase tracking-wider text-neutral-400">
                MARKET STAGE
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-sans font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                  Growing
                </span>
              </div>
            </div>
          </div>
        </Section>

        {/* ========== SECTION 3: MARKET SIZING FUNNEL ========== */}
        <Section>
          <SectionHeading num="01" title="Market Sizing Funnel (TAM / SAM / SOM)" />
          
          {/* 3-Card Summary Row */}
          <div className="grid grid-cols-3 gap-3.5 mb-4">
            <div className="rounded-xl border border-neutral-200 p-4 space-y-1.5 bg-white">
              <div className="flex items-center justify-between text-xs font-heading font-semibold uppercase tracking-wider text-neutral-500">
                <span>TAM</span>
                <span className="font-mono text-neutral-400">100%</span>
              </div>
              <div className="text-2xl font-heading font-bold text-neutral-950 font-mono">
                {formatCurrency(tam?.value, tam?.currency)}
              </div>
              <div className="text-xs font-sans text-neutral-500 truncate">
                {tam?.label || "Total addressable market"}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 p-4 space-y-1.5 bg-white">
              <div className="flex items-center justify-between text-xs font-heading font-semibold uppercase tracking-wider text-neutral-500">
                <span>SAM</span>
                <span className="font-mono text-neutral-400">{formatPct(samPctOfTam)}%</span>
              </div>
              <div className="text-2xl font-heading font-bold text-neutral-950 font-mono">
                {formatCurrency(sam?.value, sam?.currency)}
              </div>
              <div className="text-xs font-sans text-neutral-500 truncate">
                {sam?.label || "Serviceable available market"}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 p-4 space-y-1.5 bg-white">
              <div className="flex items-center justify-between text-xs font-heading font-semibold uppercase tracking-wider text-neutral-500">
                <span>SOM</span>
                <span className="font-mono text-neutral-400">
                  {formatPct(somPctOfTam)}% ({formatPct(somPctOfSam)}%)
                </span>
              </div>
              <div className="text-2xl font-heading font-bold text-neutral-950 font-mono">
                {formatCurrency(som?.value, som?.currency)}
              </div>
              <div className="text-xs font-sans text-neutral-500 truncate">
                {som?.label || "Serviceable obtainable market"}
              </div>
            </div>
          </div>

          {/* Nested Horizontal Bar Visual */}
          <div className="rounded-lg border border-neutral-200 p-3.5 space-y-2 mb-4 bg-neutral-50/50">
            <div className="h-3 w-full rounded-full bg-neutral-200 overflow-hidden flex">
              <div
                style={{ width: `${Math.max(somPctOfTam > 0 ? somPctOfTam : 2, 2)}%` }}
                className="h-full bg-neutral-900 shrink-0"
              />
              <div
                style={{ width: `${Math.max(samPctOfTam - somPctOfTam > 0 ? samPctOfTam - somPctOfTam : 6, 6)}%` }}
                className="h-full bg-neutral-400 shrink-0"
              />
              <div className="h-full flex-1 bg-neutral-200" />
            </div>

            <div className="flex flex-wrap items-center gap-5 text-xs font-mono text-neutral-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-neutral-900 shrink-0" />
                <span>SOM {formatCurrency(som?.value, som?.currency)} ({formatPct(somPctOfTam)}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-neutral-400 shrink-0" />
                <span>SAM {formatCurrency(sam?.value, sam?.currency)} ({formatPct(samPctOfTam)}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-neutral-200 border border-neutral-300 shrink-0" />
                <span>TAM {formatCurrency(tam?.value, tam?.currency)} (100%)</span>
              </div>
            </div>
          </div>

          {/* Funnel Data Table */}
          <div className="overflow-hidden rounded-lg border border-neutral-200 mb-3">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 font-mono text-xs text-neutral-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3 font-semibold w-[10%]">Tier</th>
                  <th className="py-2.5 px-3 font-semibold w-[40%]">Scope &amp; Description</th>
                  <th className="py-2.5 px-3 font-semibold text-right w-[15%]">Value ({tam?.currency || "EUR"})</th>
                  <th className="py-2.5 px-3 font-semibold text-right w-[12%]">% Parent</th>
                  <th className="py-2.5 px-3 font-semibold w-[23%]">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-sm">
                <tr>
                  <td className="py-2.5 px-3 font-mono font-bold text-neutral-900">TAM</td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-neutral-900">{tam?.label || "Total Addressable Market"}</div>
                    {tam?.derivation && <div className="text-xs text-neutral-500 mt-0.5 leading-snug">{tam.derivation}</div>}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-900 whitespace-nowrap">
                    {formatCurrency(tam?.value, tam?.currency)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-neutral-500 whitespace-nowrap">100%</td>
                  <td className="py-2.5 px-3 text-xs text-neutral-500 font-mono leading-snug">{tam?.sourceAttribution || "—"}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono font-bold text-neutral-900">SAM</td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-neutral-900">{sam?.label || "Serviceable Addressable Market"}</div>
                    {sam?.derivation && <div className="text-xs text-neutral-500 mt-0.5 leading-snug">{sam.derivation}</div>}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-900 whitespace-nowrap">
                    {formatCurrency(sam?.value, sam?.currency)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-neutral-500 whitespace-nowrap">
                    {formatPct(samPctOfTam)}%
                  </td>
                  <td className="py-2.5 px-3 text-xs text-neutral-500 font-mono leading-snug">{sam?.sourceAttribution || "—"}</td>
                </tr>
                <tr className="bg-emerald-50/30">
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-900">SOM</td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-emerald-900">{som?.label || "Serviceable Obtainable Market"}</div>
                    {som?.derivation && <div className="text-xs text-emerald-700 mt-0.5 leading-snug">{som.derivation}</div>}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-900 whitespace-nowrap">
                    {formatCurrency(som?.value, som?.currency)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-800 whitespace-nowrap">
                    {formatPct(somPctOfTam)}% ({formatPct(somPctOfSam)}% of SAM)
                  </td>
                  <td className="py-2.5 px-3 text-xs text-emerald-700 font-mono leading-snug">{som?.sourceAttribution || "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {has(sizing?.methodology) && (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 space-y-0.5">
              <div className="font-mono text-xs font-semibold uppercase text-neutral-500 tracking-wider">Model Methodology</div>
              <p className="text-neutral-700 text-xs leading-relaxed font-sans">{sizing.methodology}</p>
            </div>
          )}
        </Section>

        {/* ========== SECTION 4: TARGET SEGMENTS ========== */}
        <Section>
          <SectionHeading num="02" title="Target Segments" />
          <div className="space-y-2.5">
            {targetSegmentsList.map((segment) => (
              <div
                key={segment.id}
                className="rounded-lg border border-neutral-200 p-3.5 flex items-start gap-3 bg-white"
              >
                <span className="text-xs font-mono font-bold text-neutral-400 shrink-0 mt-0.5">
                  {segment.id}
                </span>
                <div className="space-y-0.5 min-w-0">
                  <h4 className="text-sm font-semibold text-neutral-900 font-sans">
                    {segment.title}
                  </h4>
                  <p className="text-xs text-neutral-600 font-sans leading-relaxed">
                    {segment.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ========== SECTION 5: COMPETITOR LANDSCAPE ========== */}
        {arr(competitors) && (
          <Section>
            <SectionHeading num="03" title="Competitor Landscape & Benchmark Analysis" />

            {has(competitorSummary) && (
              <p className="text-xs text-neutral-600 mb-3 leading-relaxed font-sans">{competitorSummary}</p>
            )}

            <div className="overflow-hidden rounded-lg border border-neutral-200 mb-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 font-mono text-xs text-neutral-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3 font-semibold w-[20%]">COMPETITOR</th>
                    <th className="py-2.5 px-3 font-semibold w-[20%]">POSITIONING</th>
                    <th className="py-2.5 px-3 font-semibold w-[20%]">STRENGTHS</th>
                    <th className="py-2.5 px-3 font-semibold w-[20%]">WEAKNESSES</th>
                    <th className="py-2.5 px-3 font-semibold w-[20%]">OPPORTUNITY FOR YOU</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs">
                  {competitors.map((comp, idx) => (
                    <tr key={idx}>
                      {/* COMPETITOR */}
                      <td className="py-2.5 px-3 align-top">
                        <div className="font-semibold text-neutral-900">{comp.name}</div>
                        <div className="text-neutral-500 font-sans text-[11px] pt-0.5">
                          {comp.segment || displaySector} · {displayRegion}
                        </div>
                      </td>

                      {/* POSITIONING */}
                      <td className="py-2.5 px-3 text-neutral-600 align-top">
                        {comp.segment || (comp as any).targetSegment || "—"}
                      </td>

                      {/* STRENGTHS */}
                      <td className="py-2.5 px-3 text-neutral-600 align-top">
                        {arr(comp.strengths) ? comp.strengths.join(", ") : "—"}
                      </td>

                      {/* WEAKNESSES */}
                      <td className="py-2.5 px-3 text-neutral-600 align-top">
                        {arr(comp.weaknesses) ? comp.weaknesses.join(", ") : "—"}
                      </td>

                      {/* OPPORTUNITY FOR YOU */}
                      <td className="py-2.5 px-3 font-medium text-neutral-900 align-top">
                        {comp.exploitableGap || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Indirect Competitors (if present) */}
            {arr(indirectCompetitors) && (
              <div className="mt-3">
                <Sub>Indirect Competitors &amp; Alternatives</Sub>
                <div className="overflow-hidden rounded-lg border border-neutral-200 mt-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50 font-mono text-xs text-neutral-500 uppercase tracking-wider">
                        <th className="py-2 px-3 font-semibold w-1/4">Substitute</th>
                        <th className="py-2 px-3 font-semibold w-1/2">Alternative Approach</th>
                        <th className="py-2 px-3 font-semibold w-1/4 text-right">Threat Level</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-xs">
                      {indirectCompetitors.map((alt, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-semibold text-neutral-900">{alt.name}</td>
                          <td className="py-2 px-3 text-neutral-600">{alt.substituteApproach}</td>
                          <td className="py-2 px-3 text-right">
                            <span className="font-mono uppercase font-bold text-neutral-800">{alt.threatLevel}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Section>
        )}

        {/* ========== SECTION 6: DEMAND SIGNALS & MARKET GAPS ========== */}
        {(arr(demandSignals) || arr(sizingRisks)) && (
          <Section>
            <SectionHeading num="04" title="Demand Signals & Market Gaps" />
            <div className="grid grid-cols-2 gap-4">
              {/* Demand Signals */}
              {arr(demandSignals) && (
                <div className="space-y-2">
                  <Sub>Verified Demand Signals</Sub>
                  <div className="space-y-2">
                    {demandSignals.map((sig, idx) => (
                      <div key={idx} className="border border-neutral-200 rounded-lg p-3 bg-white text-xs space-y-1">
                        <div className="font-semibold text-neutral-900 leading-tight">{sig.signal}</div>
                        {sig.evidence && (
                          <div className="text-neutral-600 leading-relaxed font-sans">{sig.evidence}</div>
                        )}
                        {sig.sourceAttribution && (
                          <div className="text-[11px] font-mono text-neutral-400 pt-1 border-t border-neutral-100">
                            Source: {sig.sourceAttribution}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Market Gaps */}
              {arr(sizingRisks) && (
                <div className="space-y-2">
                  <Sub>Market Gaps &amp; Sizing Constraints</Sub>
                  <div className="space-y-2">
                    {sizingRisks.map((r, idx) => (
                      <div key={idx} className="border border-neutral-200 rounded-lg p-3 bg-white text-xs space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-neutral-900 leading-tight">{r.risk}</span>
                          {r.impactOnSom && (
                            <span className={`shrink-0 font-mono uppercase font-bold px-1.5 py-0.5 rounded border text-[10px] ${impactColor(r.impactOnSom)}`}>
                              {r.impactOnSom}
                            </span>
                          )}
                        </div>
                        {r.mitigation && (
                          <div className="text-neutral-600 leading-relaxed font-sans pt-1 border-t border-neutral-100">
                            <span className="font-semibold text-neutral-800">Mitigation:</span> {r.mitigation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ========== SECTION 7: STEP COMPLETE MILESTONES ========== */}
        <Section>
          <SectionHeading num="05" title="Step Completion Milestones" />
          <div className="grid grid-cols-5 gap-2.5 p-3 rounded-lg border border-neutral-200 bg-neutral-50/60">
            {[
              "Market identified",
              "Target users defined",
              "TAM / SAM / SOM generated",
              "Competitor landscape analyzed",
              "Market gaps identified",
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full border border-emerald-600 flex items-center justify-center shrink-0">
                  <Check className="w-2 h-2 text-emerald-600 stroke-[2.5]" />
                </div>
                <span className="text-xs font-sans text-neutral-800 font-medium leading-tight">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* ========== DOCUMENT FOOTER ========== */}
        <footer className="border-t border-neutral-300 pt-4 mt-8 flex items-center justify-between text-xs font-mono text-neutral-400 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            {safeLogoSrc && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={safeLogoSrc} alt="" className="h-4 object-contain opacity-40" />
            )}
            <span>Mondial ECO Platform · Autonomous Startup Synthesis Engine</span>
          </div>
          <div>Verified Confidential · {today}</div>
        </footer>
      </div>
    </div>,
    document.body
  );
}
