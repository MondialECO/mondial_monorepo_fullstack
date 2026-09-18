"use client";

import { useEffect } from "react";
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
  TrendingUp,
  HelpCircle,
  Layers,
} from "lucide-react";
import type { BusinessModelOutput } from "@/types/creator/ai";

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

interface BusinessModelPrintProps {
  open: boolean;
  onClose: () => void;
  projectName?: string;
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
const arr = <T,>(a?: T[] | null): a is T[] => Array.isArray(a) && a.length > 0;

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`print-section mb-8 ${className}`}>{children}</section>;
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 border-b border-neutral-300 pb-1.5 text-base font-bold tracking-tight text-neutral-900">
      {children}
    </h2>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-1 mt-3 text-xs font-bold uppercase tracking-wider text-neutral-600">
      {children}
    </h3>
  );
}

export default function BusinessModelPrintView({
  open,
  onClose,
  projectName,
  project,
  output,
  version = 1,
  updatedAt,
}: BusinessModelPrintProps) {
  useEffect(() => {
    if (!open) return;
    document.body.classList.add("printing-active");
    return () => document.body.classList.remove("printing-active");
  }, [open]);

  if (!open || typeof document === "undefined" || !output) return null;

  const displayDate = updatedAt
    ? new Date(updatedAt).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  const canvas = output.canvas;
  const unitEconomics = output.unitEconomics;
  const tiers = output.revenueTiers || [];
  const assumptions = output.assumptions || [];

  return createPortal(
    <div data-print-overlay className="fixed inset-0 z-[100] overflow-auto bg-neutral-200 print:bg-white">
      {/* Toolbar - never printed */}
      <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-neutral-300 bg-neutral-100 px-4 py-3">
        <Button variant="ghost" size="sm" onClick={onClose} className="gap-1.5 text-neutral-700">
          <X className="h-4 w-4" /> Close
        </Button>
        <span className="text-xs text-neutral-500">
          Use your browser&apos;s &ldquo;Save as PDF&rdquo; in the print dialog.
        </span>
        <Button size="sm" onClick={() => window.print()} className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
          <Printer className="h-4 w-4" /> Print / Save as PDF
        </Button>
      </div>

      <div className="print-document mx-auto my-8 max-w-[840px] bg-white px-12 py-10 shadow-lg text-neutral-900 font-sans">
        {/* Header / Meta */}
        <header className="print-section mb-8 border-b-2 border-neutral-900 pb-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-neutral-500">
              Mondial · Business Model Canvas &amp; Unit Economics
            </span>
            <span className="text-[11px] font-mono text-neutral-500 uppercase">
              Phase 3.2 Output · Version {version ?? 1}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-neutral-900">
            Business Model — {has(projectName) ? projectName : "Architecture Specification"}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600 font-mono">
            <span>Generated: {displayDate}</span>
            <span>·</span>
            <span>Sector: {project?.sector || "Enterprise / Technology"}</span>
            <span>·</span>
            <span>Region: {project?.geography || "Global (EU/US)"}</span>
          </div>
        </header>

        {/* 01. The 9-Block Osterwalder Canvas */}
        <Section className="break-inside-avoid">
          <Heading>01 // Canonical Osterwalder Business Model Canvas</Heading>
          <div className="overflow-hidden rounded border border-neutral-300 bg-white mb-6">
            {/* Top 5-Column Grid */}
            <div className="grid grid-cols-5 divide-x divide-neutral-300 min-h-[300px]">
              {/* Column 1: Key Partners */}
              <div className="p-3 space-y-2 flex flex-col justify-start">
                <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-800 pb-1 border-b border-neutral-200">
                  <Building className="w-3 h-3 text-neutral-500" />
                  <span>Key Partners</span>
                </div>
                {canvas?.keyPartners && canvas.keyPartners.length > 0 ? (
                  <ul className="text-[10px] text-neutral-700 space-y-1.5 leading-snug pl-3 list-disc">
                    {canvas.keyPartners.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[10px] text-neutral-400 italic">None defined</p>
                )}
              </div>

              {/* Column 2: Key Activities (top) & Key Resources (bottom) */}
              <div className="divide-y divide-neutral-300 flex flex-col">
                {/* Key Activities */}
                <div className="p-3 space-y-2 flex-1">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-800 pb-1 border-b border-neutral-200">
                    <Zap className="w-3 h-3 text-neutral-500" />
                    <span>Key Activities</span>
                  </div>
                  {canvas?.keyActivities && canvas.keyActivities.length > 0 ? (
                    <ul className="text-[10px] text-neutral-700 space-y-1.5 leading-snug pl-3 list-disc">
                      {canvas.keyActivities.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[10px] text-neutral-400 italic">None defined</p>
                  )}
                </div>

                {/* Key Resources */}
                <div className="p-3 space-y-2 flex-1">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-800 pb-1 border-b border-neutral-200">
                    <Key className="w-3 h-3 text-neutral-500" />
                    <span>Key Resources</span>
                  </div>
                  {canvas?.keyResources && canvas.keyResources.length > 0 ? (
                    <ul className="text-[10px] text-neutral-700 space-y-1.5 leading-snug pl-3 list-disc">
                      {canvas.keyResources.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[10px] text-neutral-400 italic">None defined</p>
                  )}
                </div>
              </div>

              {/* Column 3: Value Propositions (Core Center Emphasis) */}
              <div className="p-3 space-y-2 flex flex-col justify-start bg-neutral-50/60 border-l border-r border-neutral-300">
                <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-neutral-900 pb-1 border-b border-neutral-300">
                  <div className="flex items-center gap-1 text-blue-700 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Value Propositions</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1 py-0.2 rounded bg-blue-100 text-blue-800">
                    Core
                  </span>
                </div>
                {canvas?.valuePropositions && canvas.valuePropositions.length > 0 ? (
                  <div className="space-y-2 pt-0.5">
                    {canvas.valuePropositions.map((vp, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="text-[10px] font-bold text-neutral-900 leading-snug">
                          {vp.headline}
                        </div>
                        <p className="text-[9.5px] text-neutral-700 leading-snug">
                          {vp.details}
                        </p>
                        {vp.marketStudyFootnote && (
                          <div className="text-[9px] text-blue-700 font-medium inline-flex items-center gap-0.5 pt-0.5">
                            <span className="text-[8.5px] uppercase tracking-wider text-neutral-500">Ref:</span>
                            {vp.marketStudyFootnote}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-neutral-400 italic">None defined</p>
                )}
              </div>

              {/* Column 4: Customer Relationships (top) & Channels (bottom) */}
              <div className="divide-y divide-neutral-300 flex flex-col">
                {/* Customer Relationships */}
                <div className="p-3 space-y-2 flex-1">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-800 pb-1 border-b border-neutral-200">
                    <HeartHandshake className="w-3 h-3 text-neutral-500" />
                    <span>Customer Relationships</span>
                  </div>
                  {canvas?.customerRelationships && canvas.customerRelationships.length > 0 ? (
                    <ul className="text-[10px] text-neutral-700 space-y-1.5 leading-snug pl-3 list-disc">
                      {canvas.customerRelationships.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[10px] text-neutral-400 italic">None defined</p>
                  )}
                </div>

                {/* Channels */}
                <div className="p-3 space-y-2 flex-1">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-800 pb-1 border-b border-neutral-200">
                    <Truck className="w-3 h-3 text-neutral-500" />
                    <span>Channels</span>
                  </div>
                  {canvas?.channels && canvas.channels.length > 0 ? (
                    <ul className="text-[10px] text-neutral-700 space-y-1.5 leading-snug pl-3 list-disc">
                      {canvas.channels.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[10px] text-neutral-400 italic">None defined</p>
                  )}
                </div>
              </div>

              {/* Column 5: Customer Segments */}
              <div className="p-3 space-y-2 flex flex-col justify-start">
                <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-800 pb-1 border-b border-neutral-200">
                  <Users className="w-3 h-3 text-neutral-500" />
                  <span>Customer Segments</span>
                </div>
                {canvas?.customerSegments && canvas.customerSegments.length > 0 ? (
                  <div className="space-y-2 pt-0.5">
                    {canvas.customerSegments.map((seg, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="text-[10px] font-bold text-neutral-900 leading-snug">
                          {seg.segment}
                        </div>
                        {seg.marketStudyFootnote && (
                          <div className="text-[9px] text-neutral-500 inline-flex items-center gap-0.5">
                            <span className="text-[8.5px] uppercase tracking-wider text-neutral-400">Ref:</span>
                            {seg.marketStudyFootnote}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-neutral-400 italic">None defined</p>
                )}
              </div>
            </div>

            {/* Bottom Row: Cost Structure & Revenue Streams */}
            <div className="grid grid-cols-2 divide-x divide-neutral-300 border-t border-neutral-300 bg-neutral-50/30">
              {/* Cost Structure */}
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-800 pb-1 border-b border-neutral-200">
                  <Scale className="w-3 h-3 text-neutral-500" />
                  <span>Cost Structure</span>
                </div>
                {canvas?.costStructure && canvas.costStructure.length > 0 ? (
                  <ul className="text-[10px] text-neutral-700 space-y-1 leading-snug pl-3 list-disc">
                    {canvas.costStructure.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[10px] text-neutral-400 italic">None defined</p>
                )}
              </div>

              {/* Revenue Streams */}
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-800 pb-1 border-b border-neutral-200">
                  <CreditCard className="w-3 h-3 text-neutral-500" />
                  <span>Revenue Streams</span>
                </div>
                {canvas?.revenueStreams && canvas.revenueStreams.length > 0 ? (
                  <div className="space-y-1.5">
                    {canvas.revenueStreams.map((rev, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="text-[10px] font-bold text-neutral-900 leading-snug">
                          {rev.stream}
                        </div>
                        {rev.marketStudyFootnote && (
                          <div className="text-[9px] text-neutral-500 inline-flex items-center gap-0.5">
                            <span className="text-[8.5px] uppercase tracking-wider text-neutral-400">Ref:</span>
                            {rev.marketStudyFootnote}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-neutral-400 italic">None defined</p>
                )}
              </div>
            </div>
          </div>
        </Section>

        {/* 02. Modelled Unit Economics */}
        {unitEconomics && (
          <Section className="print-row">
            <Heading>02 // Unit Economics &amp; Monetization Baseline</Heading>
            <div className="rounded border border-neutral-300 p-4 bg-neutral-50/40 mb-3 space-y-3">
              <div className="grid grid-cols-5 gap-3 text-center">
                {/* ARPU */}
                <div className="border border-neutral-200 rounded p-2.5 bg-white">
                  <div className="text-[9.5px] font-bold uppercase tracking-wider text-neutral-500">
                    ARPU {unitEconomics.arpu?.period ? `(${unitEconomics.arpu.period})` : ""}
                  </div>
                  <div className="text-sm font-bold font-mono text-neutral-900 mt-1">
                    {formatCurrency(unitEconomics.arpu?.amount, unitEconomics.arpu?.currency)}
                  </div>
                  <div className="text-[8.5px] text-neutral-500 mt-0.5 font-medium">
                    {unitEconomics.arpu?.isModelled ? "Modelled estimate" : "Target baseline"}
                  </div>
                </div>

                {/* CAC */}
                <div className="border border-neutral-200 rounded p-2.5 bg-white">
                  <div className="text-[9.5px] font-bold uppercase tracking-wider text-neutral-500">
                    Blended CAC
                  </div>
                  <div className="text-sm font-bold font-mono text-neutral-900 mt-1">
                    {formatCurrency(unitEconomics.cac?.amount, unitEconomics.cac?.currency)}
                  </div>
                  <div className="text-[8.5px] text-neutral-500 mt-0.5 font-medium">
                    {unitEconomics.cac?.isModelled ? "Modelled acquisition" : "Baseline"}
                  </div>
                </div>

                {/* LTV */}
                <div className="border border-neutral-200 rounded p-2.5 bg-white">
                  <div className="text-[9.5px] font-bold uppercase tracking-wider text-neutral-500">
                    Customer LTV
                  </div>
                  <div className="text-sm font-bold font-mono text-neutral-900 mt-1">
                    {formatCurrency(unitEconomics.ltv?.amount, unitEconomics.ltv?.currency)}
                  </div>
                  <div className="text-[8.5px] text-neutral-500 mt-0.5 font-medium">
                    {unitEconomics.ltv?.isModelled ? "Lifetime value" : "Baseline"}
                  </div>
                </div>

                {/* LTV:CAC Ratio */}
                <div className="border border-neutral-200 rounded p-2.5 bg-white">
                  <div className="text-[9.5px] font-bold uppercase tracking-wider text-neutral-500">
                    LTV : CAC Ratio
                  </div>
                  <div className="text-sm font-bold font-mono text-emerald-700 mt-1">
                    {unitEconomics.ltvToCacRatio !== undefined ? `${unitEconomics.ltvToCacRatio.toFixed(1)}x` : "—"}
                  </div>
                  <div className="text-[8.5px] text-neutral-500 mt-0.5 font-medium">
                    Benchmark ≥ 3.0x
                  </div>
                </div>

                {/* Payback Period */}
                <div className="border border-neutral-200 rounded p-2.5 bg-white">
                  <div className="text-[9.5px] font-bold uppercase tracking-wider text-neutral-500">
                    CAC Payback
                  </div>
                  <div className="text-sm font-bold font-mono text-neutral-900 mt-1">
                    {unitEconomics.paybackPeriodMonths !== undefined ? `${unitEconomics.paybackPeriodMonths} mo` : "—"}
                  </div>
                  <div className="text-[8.5px] text-neutral-500 mt-0.5 font-medium">
                    Recovery velocity
                  </div>
                </div>
              </div>

              {unitEconomics.commentary && (
                <div className="border-t border-neutral-200 pt-2 text-[11px] leading-relaxed text-neutral-700">
                  <span className="font-semibold text-neutral-900">Economic Commentary:</span> {unitEconomics.commentary}
                </div>
              )}
            </div>
          </Section>
        )}

        {/* 03. Pricing Tiers Architecture */}
        {arr(tiers) && (
          <Section className="print-row">
            <Heading>03 // Pricing Tiers &amp; Revenue Architecture</Heading>
            <div className="overflow-hidden rounded border border-neutral-300 mb-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-300 bg-neutral-100 font-mono text-[10.5px] text-neutral-700">
                    <th className="py-2 px-3 font-semibold w-[22%]">Tier Name</th>
                    <th className="py-2 px-3 font-semibold w-[18%]">Pricing Model</th>
                    <th className="py-2 px-3 font-semibold w-[24%]">Target Segment</th>
                    <th className="py-2 px-3 font-semibold w-[26%]">Key Features &amp; Scope</th>
                    <th className="py-2 px-3 font-semibold text-right w-[10%]">Proj. Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {tiers.map((t, idx) => (
                    <tr key={idx} className="print-row align-top text-[10.5px]">
                      <td className="py-2 px-3 font-semibold text-neutral-900">{t.tierName}</td>
                      <td className="py-2 px-3 font-mono font-bold text-neutral-900">{t.pricing}</td>
                      <td className="py-2 px-3 text-neutral-700">{t.targetSegment}</td>
                      <td className="py-2 px-3 text-neutral-600">
                        {t.features && t.features.length > 0 ? (
                          <ul className="list-disc pl-3 space-y-0.5">
                            {t.features.map((f, fIdx) => (
                              <li key={fIdx}>{f}</li>
                            ))}
                          </ul>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono font-medium text-right text-neutral-900">
                        {t.projectedContributionPct !== undefined ? `${t.projectedContributionPct}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* 04. Key Strategic Assumptions & Evidence Register */}
        {arr(assumptions) && (
          <Section className="print-row">
            <Heading>04 // Key Model Assumptions &amp; Evidence Register</Heading>
            <div className="grid grid-cols-2 gap-3 mb-2">
              {assumptions.map((item, idx) => (
                <div key={idx} className="border border-neutral-200 rounded p-2.5 bg-neutral-50/50 flex flex-col justify-between text-xs">
                  <div>
                    <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-500">
                      {item.category}
                    </div>
                    <p className="text-[10.5px] text-neutral-800 mt-1 leading-snug">
                      {item.assumption}
                    </p>
                  </div>
                  <div className="mt-2 pt-1 border-t border-neutral-200/60 flex items-center justify-between">
                    <span className="text-[9px] text-neutral-500">Validation status:</span>
                    <span
                      className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${
                        item.evidenceLevel === "evidenced"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : item.evidenceLevel === "modelled"
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-neutral-200 text-neutral-700 border border-neutral-300"
                      }`}
                    >
                      {item.evidenceLevel || "UNTESTED"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Footer */}
        <footer className="border-t border-neutral-300 pt-4 mt-8 flex items-center justify-between text-[10px] font-mono text-neutral-500">
          <div>Mondial ECO Platform · Autonomous Startup Synthesis Engine</div>
          <div>Verified Confidential</div>
        </footer>
      </div>
    </div>,
    document.body
  );
}
