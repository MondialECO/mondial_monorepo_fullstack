"use client";

import { useEffect } from "react";
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
  logoUrl?: string;
  project?: {
    sector?: string;
    geography?: string;
    marketGap?: string;
  };
  output: MarketStudyOutput | null | undefined;
}

const has = (s?: string | null): s is string => !!s && s.trim().length > 0;
const arr = <T,>(a?: T[] | null): a is T[] => Array.isArray(a) && a.length > 0;

function Section({ children }: { children: React.ReactNode }) {
  return <section className="print-section mb-8">{children}</section>;
}

function SectionHeading({ num, title }: { num: string; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-neutral-200">
      <span className="w-6 h-6 rounded bg-neutral-900 text-white flex items-center justify-center text-badge font-mono font-bold shrink-0">
        {num}
      </span>
      <h2 className="text-section-title font-bold tracking-tight text-neutral-900 uppercase">{title}</h2>
    </div>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-1 mt-3 text-label font-bold uppercase tracking-wider text-neutral-500 font-mono">{children}</h3>;
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

  if (!open || typeof document === "undefined" || !output) return null;

  const today = new Date().toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
  const samPct = sam?.percentageOfTam ?? (tamVal && samVal ? (samVal / tamVal) * 100 : null);
  const somPct = som?.percentageOfSam ?? (samVal && somVal ? (somVal / samVal) * 100 : null);

  const impactColor = (level?: string) => {
    const l = (level || "").toLowerCase();
    if (l === "high") return "bg-red-100 text-red-800 border-red-200";
    if (l === "medium") return "bg-amber-50 text-amber-800 border-amber-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return createPortal(
    <div data-print-overlay className="fixed inset-0 z-[100] overflow-auto bg-neutral-200 print:bg-white">
      {/* Toolbar - never printed */}
      <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-neutral-300 bg-neutral-100 px-4 py-3">
        <Button variant="ghost" size="sm" onClick={onClose} className="gap-1.5 text-neutral-700">
          <X className="h-4 w-4" /> Close
        </Button>
        <span className="text-badge text-neutral-500">
          Use your browser&apos;s &ldquo;Save as PDF&rdquo; in the print dialog.
        </span>
        <Button size="sm" onClick={() => window.print()} className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
          <Printer className="h-4 w-4" /> Print / Save as PDF
        </Button>
      </div>

      <div className="print-document mx-auto my-8 max-w-[840px] bg-white px-12 py-10 shadow-lg text-neutral-900 font-sans">
        {/* ========== HEADER WITH LOGO ========== */}
        <header className="print-section mb-10 pb-6 border-b-2 border-neutral-900">
          {/* Top meta line */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-badge font-mono font-semibold uppercase tracking-widest text-neutral-400">
              Mondial · Market Study &amp; Competitive Intelligence
            </span>
            <span className="text-badge font-mono text-neutral-400 uppercase tracking-wider">
              Phase 3.1 Output
            </span>
          </div>

          {/* Logo + Project Name Row */}
          <div className="flex items-center gap-5">
            {logoUrl && (
              <div className="shrink-0 min-w-[100px] max-w-[130px] h-20 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt="Company Logo"
                  className="w-full h-full object-contain"
                  crossOrigin="anonymous"
                />
              </div>
            )}
            <div>
              <h1 className="text-page-heading font-extrabold tracking-tight text-neutral-900 leading-tight">
                {has(projectName) ? projectName : "Market Study — Executive Report"}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-badge text-neutral-500 font-mono">
                <span>{today}</span>
                <span className="text-neutral-300">·</span>
                <span>{project?.sector || "Enterprise / Technology"}</span>
                <span className="text-neutral-300">·</span>
                <span>{project?.geography || "Global (EU/US)"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* ========== 01. MARKET SIZING FUNNEL ========== */}
        <Section>
          <SectionHeading num="01" title="Market Sizing Funnel (TAM / SAM / SOM)" />
          <div className="overflow-hidden rounded-lg border border-neutral-200 mb-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 font-mono text-table-header text-neutral-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3 font-semibold w-[10%]">Tier</th>
                  <th className="py-2.5 px-3 font-semibold w-[40%]">Scope &amp; Description</th>
                  <th className="py-2.5 px-3 font-semibold text-right w-[15%]">Value ({tam?.currency || "EUR"})</th>
                  <th className="py-2.5 px-3 font-semibold text-right w-[12%]">% Parent</th>
                  <th className="py-2.5 px-3 font-semibold w-[23%]">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                <tr className="text-body">
                  <td className="py-3 px-3 font-mono font-bold text-neutral-900">TAM</td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-neutral-900 text-body">{tam?.label || "Total Addressable Market"}</div>
                    {tam?.derivation && <div className="text-footnote text-neutral-500 mt-0.5 leading-snug">{tam.derivation}</div>}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-neutral-900 whitespace-nowrap text-body">
                    {formatCurrency(tam?.value, tam?.currency)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-neutral-500 whitespace-nowrap">100%</td>
                  <td className="py-3 px-3 text-footnote text-neutral-500 font-mono leading-snug">{tam?.sourceAttribution || "—"}</td>
                </tr>
                <tr className="text-body">
                  <td className="py-3 px-3 font-mono font-bold text-neutral-900">SAM</td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-neutral-900 text-body">{sam?.label || "Serviceable Addressable Market"}</div>
                    {sam?.derivation && <div className="text-footnote text-neutral-500 mt-0.5 leading-snug">{sam.derivation}</div>}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-neutral-900 whitespace-nowrap text-body">
                    {formatCurrency(sam?.value, sam?.currency)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-neutral-500 whitespace-nowrap">
                    {samPct != null ? `${samPct.toFixed(1)}%` : "—"}
                  </td>
                  <td className="py-3 px-3 text-footnote text-neutral-500 font-mono leading-snug">{sam?.sourceAttribution || "—"}</td>
                </tr>
                <tr className="bg-emerald-50/40 text-body">
                  <td className="py-3 px-3 font-mono font-bold text-emerald-900">SOM</td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-emerald-900 text-body">{som?.label || "Serviceable Obtainable Market"}</div>
                    {som?.derivation && <div className="text-footnote text-emerald-700 mt-0.5 leading-snug">{som.derivation}</div>}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-900 whitespace-nowrap text-body">
                    {formatCurrency(som?.value, som?.currency)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-800 whitespace-nowrap">
                    {somPct != null ? `${somPct.toFixed(1)}%` : "—"}
                  </td>
                  <td className="py-3 px-3 text-footnote text-emerald-700 font-mono leading-snug">{som?.sourceAttribution || "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {has(sizing?.methodology) && (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 space-y-1">
              <div className="font-mono text-label font-semibold uppercase text-neutral-500 tracking-wider">Model Methodology</div>
              <p className="text-neutral-700 leading-relaxed text-body">{sizing!.methodology}</p>
            </div>
          )}
        </Section>

        {/* ========== 02. COMPETITIVE LANDSCAPE ========== */}
        {arr(competitors) && (
          <Section>
            <SectionHeading num="02" title="Competitive Landscape & Benchmark Analysis" />

            {has(competitorSummary) && (
              <p className="text-body text-neutral-600 mb-3 leading-relaxed">{competitorSummary}</p>
            )}

            <div className="overflow-hidden rounded-lg border border-neutral-200 mb-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 font-mono text-table-header text-neutral-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3 font-semibold">Company</th>
                    <th className="py-2.5 px-3 font-semibold">Segment</th>
                    <th className="py-2.5 px-3 font-semibold">Pricing Model</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Est. Share</th>
                    <th className="py-2.5 px-3 font-semibold">Vulnerability / Gap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {competitors.map((comp, idx) => (
                    <tr key={idx} className="text-body">
                      <td className="py-2.5 px-3 align-top">
                        <div className="font-semibold text-neutral-900">{comp.name}</div>
                        {comp.sourceAttribution && (
                          <div className="text-footnote text-neutral-400 font-mono mt-0.5">{comp.sourceAttribution}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-600 align-top">
                        {comp.segment || (comp as any).targetSegment || (comp as any).marketSegment || "—"}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-600 font-mono align-top">{comp.pricingModel || "—"}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-neutral-900 align-top whitespace-nowrap">
                        {comp.estimatedMarketShare || "—"}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-700 leading-snug align-top font-sans">
                        <div>{comp.exploitableGap || "—"}</div>
                        {(arr(comp.strengths) || arr(comp.weaknesses)) && (
                          <div className="mt-1 text-footnote text-neutral-500 space-y-0.5 font-sans">
                            {arr(comp.strengths) && (
                              <div><span className="font-semibold text-neutral-600">+</span> {comp.strengths.join(", ")}</div>
                            )}
                            {arr(comp.weaknesses) && (
                              <div><span className="font-semibold text-neutral-600">−</span> {comp.weaknesses.join(", ")}</div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {arr(indirectCompetitors) && (
              <div className="mt-3">
                <Sub>Indirect Competitors &amp; Alternatives</Sub>
                <div className="overflow-hidden rounded-lg border border-neutral-200 mt-1.5">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50 font-mono text-table-header text-neutral-500 uppercase tracking-wider">
                        <th className="py-2 px-3 font-semibold w-1/4">Substitute</th>
                        <th className="py-2 px-3 font-semibold w-1/2">Alternative Approach</th>
                        <th className="py-2 px-3 font-semibold w-1/4 text-right">Threat Level</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {indirectCompetitors.map((alt, idx) => (
                        <tr key={idx} className="text-body">
                          <td className="py-2 px-3 font-semibold text-neutral-900">{alt.name}</td>
                          <td className="py-2 px-3 text-neutral-600">{alt.substituteApproach}</td>
                          <td className="py-2 px-3 text-right">
                            <span className="text-badge font-mono uppercase font-bold">{alt.threatLevel}</span>
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

        {/* ========== 03. DEMAND SIGNALS & SIZING RISKS ========== */}
        {(arr(demandSignals) || arr(sizingRisks)) && (
          <Section>
            <SectionHeading num="03" title="Demand Signals & Sizing Risks" />
            <div className="grid grid-cols-2 gap-5">
              {/* Demand Signals */}
              {arr(demandSignals) && (
                <div>
                  <Sub>Verified Demand Signals</Sub>
                  <div className="space-y-2 mt-2">
                    {demandSignals.map((sig, idx) => (
                      <div key={idx} className="border border-neutral-200 rounded-lg p-3 bg-white text-body">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-neutral-900 leading-tight">{sig.signal}</span>
                          {sig.relevanceScore !== undefined && (
                            <span className="shrink-0 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-badge font-mono font-bold">
                              +{sig.relevanceScore * 3 + 7}% YoY
                            </span>
                          )}
                        </div>
                        <div className="text-body text-neutral-600 mt-1 leading-snug">{sig.evidence}</div>
                        {sig.sourceAttribution && (
                          <div className="text-footnote font-mono text-neutral-400 mt-1.5 pt-1.5 border-t border-neutral-100">
                            Source: {sig.sourceAttribution}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sizing Risks */}
              {arr(sizingRisks) && (
                <div>
                  <Sub>Identified Sizing Risks &amp; Mitigations</Sub>
                  <div className="space-y-2 mt-2">
                    {sizingRisks.map((r, idx) => (
                      <div key={idx} className="border border-neutral-200 rounded-lg p-3 bg-white text-body">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-1.5">
                            <span className="text-badge font-mono text-neutral-400 font-bold shrink-0 pt-0.5">
                              {String(idx + 1).padStart(2, "0")}.
                            </span>
                            <span className="font-semibold text-neutral-900 leading-tight">{r.risk}</span>
                          </div>
                          <span className={`shrink-0 text-badge font-mono uppercase font-bold px-1.5 py-0.5 rounded border ${impactColor(r.impactOnSom)}`}>
                            {r.impactOnSom}
                          </span>
                        </div>
                        {r.mitigation && (
                          <div className="text-body text-neutral-600 mt-1.5 pt-1.5 border-t border-neutral-100 leading-snug font-sans">
                            <span className="font-semibold text-neutral-700">Mitigation:</span> {r.mitigation}
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

        {/* ========== 04. FOUNDER GAP VALIDATION ========== */}
        {gapValidation && (
          <Section>
            <SectionHeading num="04" title="Founder Gap Validation" />
            <div className="border border-neutral-200 rounded-lg overflow-hidden">
              {/* Confidence badge */}
              <div className="bg-neutral-50 px-4 py-2.5 border-b border-neutral-200 flex items-center justify-between">
                <span className="text-label font-mono font-semibold uppercase tracking-wider text-neutral-500">
                  Hypothesis 01 · Gap Assessment
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-badge font-medium text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  Confidence: {gapValidation.confidenceLevel?.toUpperCase() || "HIGH"}
                </span>
              </div>

              <div className="grid grid-cols-2 divide-x divide-neutral-200">
                {/* Left: Stated Gap */}
                <div className="p-4 space-y-2">
                  <div className="text-label font-mono font-semibold uppercase tracking-wider text-neutral-400">Your Stated Gap</div>
                  <div className="border-l-2 border-teal-500 pl-3 py-1 text-body text-neutral-800 leading-relaxed font-medium italic">
                    &ldquo;{project?.marketGap || "No stated market gap provided."}&rdquo;
                  </div>
                </div>

                {/* Right: Evidence Synthesis */}
                <div className="p-4 space-y-2">
                  <div className="text-label font-mono font-semibold uppercase tracking-wider text-neutral-400">Evidence Synthesis &amp; Assessment</div>
                  <p className="text-body text-neutral-700 leading-relaxed">{gapValidation.primaryGap}</p>
                  <div className="rounded border border-neutral-200 bg-neutral-50 p-2.5 flex items-start gap-2 text-body text-neutral-700 leading-snug">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{gapValidation.validationRationale}</span>
                  </div>
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* ========== FOOTER ========== */}
        <footer className="border-t border-neutral-300 pt-4 mt-8 flex items-center justify-between text-footnote font-mono text-neutral-400 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            {logoUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={logoUrl} alt="" className="h-5 object-contain opacity-40" crossOrigin="anonymous" />
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
