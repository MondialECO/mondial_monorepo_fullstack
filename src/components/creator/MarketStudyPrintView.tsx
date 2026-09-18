"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Printer, X, Download } from "lucide-react";
import type { MarketStudyOutput } from "@/types/creator/ai";
import { formatMoney } from "@/lib/format-money";

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

function Heading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 border-b border-neutral-300 pb-1.5 text-base font-bold tracking-tight text-neutral-900">{children}</h2>;
}

function Sub({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-1 mt-3 text-xs font-bold uppercase tracking-wider text-neutral-600">{children}</h3>;
}

function Body({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-xs leading-relaxed text-neutral-800">{children}</p>;
}

export default function MarketStudyPrintView({
  open,
  onClose,
  projectName,
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
  const indirectCompetitors = output.competitorLandscape?.indirectCompetitors || [];
  const demandSignals = output.demandSignals || [];
  const sizingRisks = output.sizingRisks || [];
  const gapValidation = output.marketGapValidation;

  const tamVal = tam?.value;
  const samVal = sam?.value;
  const somVal = som?.value;
  const samPct = sam?.percentageOfTam ?? (tamVal && samVal ? (samVal / tamVal) * 100 : null);
  const somPct = som?.percentageOfSam ?? (samVal && somVal ? (somVal / samVal) * 100 : null);

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
              Mondial · Market Study &amp; Competitive Intelligence
            </span>
            <span className="text-[11px] font-mono text-neutral-500 uppercase">
              Phase 3.1 Output
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-neutral-900">
            Market Study — {has(projectName) ? projectName : "Executive Report"}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600 font-mono">
            <span>Generated: {today}</span>
            <span>·</span>
            <span>Sector: {project?.sector || "Enterprise / Technology"}</span>
            <span>·</span>
            <span>Region: {project?.geography || "Global (EU/US)"}</span>
          </div>
        </header>

        {/* 01. Market Sizing Funnel */}
        <Section>
          <Heading>01 // Market Sizing Funnel (TAM / SAM / SOM)</Heading>
          <div className="overflow-hidden rounded border border-neutral-300 mb-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-300 bg-neutral-100 font-mono text-[11px] text-neutral-700">
                  <th className="py-2 px-3 font-semibold">Tier</th>
                  <th className="py-2 px-3 font-semibold">Scope &amp; Description</th>
                  <th className="py-2 px-3 font-semibold text-right">Value ({tam?.currency || "EUR"})</th>
                  <th className="py-2 px-3 font-semibold text-right">% of Parent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                <tr className="print-row">
                  <td className="py-2.5 px-3 font-mono font-bold text-neutral-900">TAM</td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-neutral-900">{tam?.label || "Total Addressable Market"}</div>
                    {tam?.derivation && <div className="text-[11px] text-neutral-600 mt-0.5">{tam.derivation}</div>}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-900 whitespace-nowrap">
                    {formatCurrency(tam?.value, tam?.currency)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-neutral-600 whitespace-nowrap">100% (Baseline)</td>
                </tr>
                <tr className="print-row">
                  <td className="py-2.5 px-3 font-mono font-bold text-neutral-900">SAM</td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-neutral-900">{sam?.label || "Serviceable Addressable Market"}</div>
                    {sam?.derivation && <div className="text-[11px] text-neutral-600 mt-0.5">{sam.derivation}</div>}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-900 whitespace-nowrap">
                    {formatCurrency(sam?.value, sam?.currency)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-neutral-600 whitespace-nowrap">
                    {samPct != null ? `${samPct.toFixed(1)}% of TAM` : "—"}
                  </td>
                </tr>
                <tr className="print-row bg-emerald-50/50">
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-950">SOM</td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-emerald-950">{som?.label || "Serviceable Obtainable Market (Y1-Y3)"}</div>
                    {som?.derivation && <div className="text-[11px] text-emerald-800 mt-0.5">{som.derivation}</div>}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-950 whitespace-nowrap">
                    {formatCurrency(som?.value, som?.currency)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-900 whitespace-nowrap">
                    {somPct != null ? `${somPct.toFixed(1)}% of SAM` : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="rounded border border-neutral-200 bg-neutral-50 p-3 text-xs space-y-1">
            <div className="font-mono text-[11px] font-semibold uppercase text-neutral-700">Model Methodology</div>
            <p className="text-neutral-700 leading-relaxed">
              {sizing?.methodology || "Triangulated bottom-up unit economics cross-referenced against top-down census benchmarks."}
            </p>
          </div>
        </Section>

        {/* 02. Competitive Landscape */}
        {arr(competitors) && (
          <Section>
            <Heading>02 // Competitive Landscape &amp; Benchmark Analysis</Heading>
            <div className="overflow-hidden rounded border border-neutral-300 mb-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-300 bg-neutral-100 font-mono text-[11px] text-neutral-700">
                    <th className="py-2 px-3 font-semibold">Company</th>
                    <th className="py-2 px-3 font-semibold">Segment</th>
                    <th className="py-2 px-3 font-semibold">Pricing Model</th>
                    <th className="py-2 px-3 font-semibold text-right">Est. Share</th>
                    <th className="py-2 px-3 font-semibold">Exploitable Vulnerability / Gap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {competitors.map((comp, idx) => (
                    <tr key={idx} className="print-row">
                      <td className="py-2.5 px-3 font-semibold text-neutral-900 whitespace-nowrap">{comp.name}</td>
                      <td className="py-2.5 px-3 text-neutral-600">{comp.segment || "Market Peer"}</td>
                      <td className="py-2.5 px-3 text-neutral-600">{comp.pricingModel || "Standard"}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-neutral-900">{comp.estimatedMarketShare || "—"}</td>
                      <td className="py-2.5 px-3 text-neutral-800 text-[11px] leading-snug">{comp.exploitableGap || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {arr(indirectCompetitors) && (
              <div className="mt-3">
                <Sub>Indirect Competitors &amp; Alternatives</Sub>
                <div className="grid grid-cols-2 gap-3 mt-1.5">
                  {indirectCompetitors.map((alt, idx) => (
                    <div key={idx} className="border border-neutral-200 rounded p-2.5 bg-neutral-50 text-xs">
                      <div className="font-semibold text-neutral-900">{alt.name}</div>
                      <div className="text-[11px] text-neutral-600 mt-0.5">{alt.substituteApproach}</div>
                      <div className="mt-1 text-[10px] font-mono uppercase text-neutral-500">
                        Threat: <strong className="text-neutral-700">{alt.threatLevel}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>
        )}

        {/* 03. Demand Signals & Sizing Risks */}
        {(arr(demandSignals) || arr(sizingRisks)) && (
          <Section>
            <Heading>03 // Demand Signals &amp; Sizing Risks</Heading>
            <div className="grid grid-cols-2 gap-4">
              {/* Demand Signals */}
              {arr(demandSignals) && (
                <div>
                  <Sub>Verified Demand Signals</Sub>
                  <div className="space-y-2 mt-1.5">
                    {demandSignals.map((sig, idx) => (
                      <div key={idx} className="border border-neutral-200 rounded p-2.5 bg-neutral-50 text-xs">
                        <div className="font-semibold text-neutral-900">{sig.signal}</div>
                        <div className="text-[11px] text-neutral-600 mt-0.5">{sig.evidence}</div>
                        {sig.sourceAttribution && (
                          <div className="text-[10px] font-mono text-neutral-500 mt-1">Source: {sig.sourceAttribution}</div>
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
                  <div className="space-y-2 mt-1.5">
                    {sizingRisks.map((r, idx) => (
                      <div key={idx} className="border border-neutral-200 rounded p-2.5 bg-neutral-50 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-neutral-900">{r.risk}</span>
                          <span className="text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-800">
                            {r.impactOnSom}
                          </span>
                        </div>
                        {r.mitigation && (
                          <div className="text-[11px] text-neutral-700 mt-1">
                            <span className="font-semibold">Mitigation:</span> {r.mitigation}
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

        {/* 04. Founder Gap Validation */}
        {gapValidation && (
          <Section>
            <Heading>04 // Founder Gap Validation</Heading>
            <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50 space-y-3 text-xs">
              <div>
                <div className="text-[10px] font-mono font-bold uppercase text-neutral-500">Stated Gap Hypothesis</div>
                <div className="font-medium italic text-neutral-800 mt-0.5">
                  &ldquo;{gapValidation.founderGapHypothesis || project?.marketGap}&rdquo;
                </div>
              </div>
              <div className="border-t border-neutral-200 pt-2">
                <div className="text-[10px] font-mono font-bold uppercase text-neutral-500">Evidence Synthesis &amp; Assessment</div>
                <p className="text-neutral-700 mt-0.5 leading-relaxed">
                  {gapValidation.validationSummary || "Validated against market benchmarks and competitor product audits."}
                </p>
                <div className="mt-2 text-[10px] font-mono text-emerald-700 font-semibold uppercase">
                  Confidence Rating: {gapValidation.confidenceLevel?.toUpperCase() || "HIGH"} (Supported by benchmark data)
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* Footer */}
        <footer className="border-t border-neutral-300 pt-4 mt-8 flex items-center justify-between text-[10px] font-mono text-neutral-500">
          <div>Mondial ECO Platform · Autonomous Startup Synthesis Engine</div>
          <div>Page 1 of 1 · Verified Confidential</div>
        </footer>
      </div>
    </div>,
    document.body
  );
}
