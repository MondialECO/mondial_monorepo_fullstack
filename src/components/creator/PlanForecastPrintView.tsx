"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import type { BusinessPlanOutput, ForecastOutput } from "@/types/creator/ai";
import { formatMoney } from "@/lib/format-money";
import { useEffect } from "react";
import { createPortal } from "react-dom";

// Combined Plan + Forecast export document. Rendered as an opt-in full-screen overlay
// (screen preview) and printed via window.print(). All print rules live in globals.css
// under @media print; this component only forces the light token set via .print-document.
// Pure render of already-hydrated output - no AI call, no fetch.

interface PrintProps {
  open: boolean;
  onClose: () => void;
  projectName: string;
  project: { problem: string; solution: string; targetUser: string };
  plan: BusinessPlanOutput | null | undefined;
  forecast: ForecastOutput | null | undefined;
  forecastInputs?: {
    arpu?: number | null;
    opex?: number | null;
    monthlyGrowthPct?: number | null;
    tam?: number | null;
    monthlyChurnPct?: number | null;
  } | null;
  cross: { youNeed: string[]; seedAsk: number | null };
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
  const months = Array.from(new Set([
    ...rev.map((row) => row.month),
    ...cost.map((row) => row.month),
    ...cash.map((row) => row.month),
  ])).sort((a, b) => a - b);

  return months.map((month) => {
    const revenueRow = rev.find((row) => row.month === month);
    const costRow = cost.find((row) => row.month === month);
    const cashRow = cash.find((row) => row.month === month);
    const notes = Array.from(new Set([
      revenueRow?.notes,
      costRow?.notes,
      cashRow?.notes,
    ].filter((note): note is string => !!note?.trim()))).join(" | ");

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

function Section({ children }: { children: React.ReactNode }) {
  return <section className="print-section mb-8">{children}</section>;
}
function Heading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 border-b border-border pb-1.5 text-lg font-extrabold tracking-tight text-foreground">{children}</h2>;
}
function Sub({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-1 mt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{children}</h3>;
}
function Body({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[13px] leading-relaxed text-foreground">{children}</p>;
}
function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="mb-2 list-disc pl-5 text-[13px] leading-relaxed text-foreground">
      {items.map((x, i) => <li key={i}>{x}</li>)}
    </ul>
  );
}

// Split a monthly series into 12-month year blocks (Year 1 = months 1-12, …).
function yearChunks<T extends { month: number }>(monthly: T[]) {
  const years: { year: number; months: T[] }[] = [];
  for (const m of monthly) {
    const y = Math.max(1, Math.ceil(m.month / 12));
    let bucket = years.find((b) => b.year === y);
    if (!bucket) { bucket = { year: y, months: [] }; years.push(bucket); }
    bucket.months.push(m);
  }
  return years;
}

// The same consolidated data shown on the forecast page, split into year blocks so
// each 12-month table can paginate cleanly in the PDF.
function ConsolidatedForecastTable({ rows, money }: {
  rows: ForecastTableRow[];
  money: (value?: number | null) => string;
}) {
  const total = (values: Array<number | null>) =>
    values.some((value) => value != null)
      ? values.reduce<number>((sum, value) => sum + (value ?? 0), 0)
      : null;

  return (
    <>
      <Sub>Consolidated monthly forecast</Sub>
      {yearChunks(rows).map((y) => (
        <div key={y.year} className="print-year mb-3">
          <div className="mb-1 text-[11px] font-bold text-muted-foreground">
            Year {y.year} (months {y.months[0].month}-{y.months[y.months.length - 1].month})
          </div>
          <table className="print-table w-full table-fixed border-collapse text-[9px] font-mono">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="w-[7%] py-1 pr-1 font-semibold">Month</th>
                <th className="w-[12%] py-1 pr-1 text-right font-semibold">Revenue</th>
                <th className="w-[11%] py-1 pr-1 text-right font-semibold">Fixed</th>
                <th className="w-[11%] py-1 pr-1 text-right font-semibold">Variable</th>
                <th className="w-[12%] py-1 pr-1 text-right font-semibold">Total cost</th>
                <th className="w-[13%] py-1 pr-1 text-right font-semibold">Net cash flow</th>
                <th className="w-[14%] py-1 pr-1 text-right font-semibold">Ending balance</th>
                <th className="w-[20%] py-1 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {y.months.map((row) => (
                <tr key={row.month} className="print-row border-b border-border/60 align-top">
                  <td className="py-1 pr-1 font-semibold">M{row.month}</td>
                  <td className="whitespace-nowrap py-1 pr-1 text-right">{money(row.revenue)}</td>
                  <td className="whitespace-nowrap py-1 pr-1 text-right">{money(row.fixedCosts)}</td>
                  <td className="whitespace-nowrap py-1 pr-1 text-right">{money(row.variableCosts)}</td>
                  <td className="whitespace-nowrap py-1 pr-1 text-right">{money(row.totalCost)}</td>
                  <td className="whitespace-nowrap py-1 pr-1 text-right">{money(row.netCashFlow)}</td>
                  <td className="whitespace-nowrap py-1 pr-1 text-right">{money(row.endingBalance)}</td>
                  <td className="py-1 text-[8px] leading-tight text-muted-foreground">{row.notes}</td>
                </tr>
              ))}
              <tr className="border-t border-border font-semibold">
                <td className="py-1 pr-1">Total</td>
                <td className="whitespace-nowrap py-1 pr-1 text-right">{money(total(y.months.map((row) => row.revenue)))}</td>
                <td className="whitespace-nowrap py-1 pr-1 text-right">{money(total(y.months.map((row) => row.fixedCosts)))}</td>
                <td className="whitespace-nowrap py-1 pr-1 text-right">{money(total(y.months.map((row) => row.variableCosts)))}</td>
                <td className="whitespace-nowrap py-1 pr-1 text-right">{money(total(y.months.map((row) => row.totalCost)))}</td>
                <td className="whitespace-nowrap py-1 pr-1 text-right">{money(total(y.months.map((row) => row.netCashFlow)))}</td>
                <td className="whitespace-nowrap py-1 pr-1 text-right">{money(y.months[y.months.length - 1]?.endingBalance)}</td>
                <td className="py-1" />
              </tr>
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}

export default function PlanForecastPrintView({ open, onClose, projectName, project, plan, forecast, forecastInputs, cross }: PrintProps) {
  // Scope print-isolation to when the overlay is actually open, so a normal Ctrl+P on
  // any other page is unaffected (globals.css keys the isolation off body.printing-active).
  useEffect(() => {
    if (!open) return;
    document.body.classList.add("printing-active");
    return () => document.body.classList.remove("printing-active");
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const today = new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
  const es = plan?.executiveSummary;
  const ma = plan?.marketAnalysis;
  const ca = plan?.competitorAnalysis;
  const rm = plan?.revenueModel;
  const gtm = plan?.goToMarket;
  const ops = plan?.operationsPlan;
  const planRisks = plan?.risks;

  const be = forecast?.breakEvenAnalysis;
  const tableRows = forecast ? forecastRows(forecast) : [];
  const rows = chartRows(tableRows);
  const fcTotal = tableRows[tableRows.length - 1]?.month ?? 0;
  const fcAi = forecast?.aiMonthCount ?? fcTotal; // legacy sessions: all AI, no projection label
  const fcProjected = fcTotal > fcAi;
  // The forecast's own currency (all three series share it); undefined → bare number,
  // matching the screen. `money` formats every forecast figure with it (no hardcoded €).
  const fcCurrency = forecast?.revenueForecast?.currency ?? forecast?.costForecast?.currency ?? forecast?.cashFlowProjection?.currency ?? undefined;
  const money = (n?: number | null) => n == null ? "-" : formatMoney(n, fcCurrency);
  const breakEvenMonth =
    be?.isAchievedWithinHorizon && typeof be.breakEvenMonth === "number"
      ? be.breakEvenMonth
      : null;
  const analysisMonth = breakEvenMonth ?? (fcTotal > 0 ? fcTotal : null);
  const analysisRow = analysisMonth
    ? tableRows.find((row) => row.month === analysisMonth)
    : undefined;

  return createPortal(
    <div data-print-overlay className="fixed inset-0 z-[100] overflow-auto bg-neutral-200 print:bg-white">
      {/* Toolbar - never printed */}
      <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-neutral-300 bg-neutral-100 px-4 py-3">
        <Button variant="ghost" size="sm" onClick={onClose} className="gap-1.5 text-neutral-700"><X className="h-4 w-4" /> Close</Button>
        <span className="text-xs text-neutral-500">Use your browser&apos;s &ldquo;Save as PDF&rdquo; in the print dialog.</span>
        <Button size="sm" onClick={() => window.print()} className="gap-1.5"><Printer className="h-4 w-4" /> Print / Save as PDF</Button>
      </div>

      <div className="print-document mx-auto my-8 max-w-[820px] bg-white px-14 py-12 shadow-lg">
        {/* Cover / header */}
        <header className="print-section mb-10 border-b-2 border-primary pb-6">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Mondial · Business Plan</div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">{has(projectName) ? projectName : "Business Plan"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Business Plan &amp; Financial Forecast · Generated {today}</p>
        </header>

        {/* 1. Executive Summary */}
        {(has(es?.overview) || has(es?.valueProposition) || arr(es?.highlights)) && (
          <Section>
            <Heading>1. Executive Summary</Heading>
            {has(es?.overview) && <Body>{es!.overview}</Body>}
            {has(es?.valueProposition) && <><Sub>Value proposition</Sub><Body>{es!.valueProposition}</Body></>}
            {arr(es?.highlights) && <><Sub>Highlights</Sub><Bullets items={es!.highlights!} /></>}
          </Section>
        )}

        {/* 2. Problem & Solution */}
        {(has(project.problem) || has(project.solution)) && (
          <Section>
            <Heading>2. Problem &amp; Solution</Heading>
            {has(project.problem) && <><Sub>Problem</Sub><Body>{project.problem}</Body></>}
            {has(project.solution) && <><Sub>Solution</Sub><Body>{project.solution}</Body></>}
          </Section>
        )}

        {/* 3. Target Market */}
        {(has(project.targetUser) || has(ma?.overview) || arr(ma?.targetSegments) || has(ma?.marketSizeQualitative) || arr(ma?.trends)) && (
          <Section>
            <Heading>3. Target Market</Heading>
            {has(project.targetUser) && <Body>{project.targetUser}</Body>}
            {has(ma?.overview) && <Body>{ma!.overview}</Body>}
            {arr(ma?.targetSegments) && <><Sub>Segments</Sub><Bullets items={ma!.targetSegments!} /></>}
            {has(ma?.marketSizeQualitative) && <><Sub>Market size</Sub><Body>{ma!.marketSizeQualitative}</Body></>}
            {arr(ma?.trends) && <><Sub>Trends</Sub><Bullets items={ma!.trends!} /></>}
          </Section>
        )}

        {/* 4. Business Model */}
        {(has(rm?.summary) || arr(rm?.revenueStreams) || has(rm?.pricingStrategy) || arr(rm?.keyMetrics)) && (
          <Section>
            <Heading>4. Business Model</Heading>
            {has(rm?.summary) && <Body>{rm!.summary}</Body>}
            {arr(rm?.revenueStreams) && (
              <><Sub>Revenue streams</Sub>
                <Bullets items={rm!.revenueStreams!.map((s) => [s.name, s.description].filter(Boolean).join(" - "))} /></>
            )}
            {has(rm?.pricingStrategy) && <><Sub>Pricing strategy</Sub><Body>{rm!.pricingStrategy}</Body></>}
            {arr(rm?.keyMetrics) && <><Sub>Key metrics</Sub><Bullets items={rm!.keyMetrics!} /></>}
          </Section>
        )}

        {/* 5. Competitive Landscape */}
        {(has(ca?.overview) || arr(ca?.competitors)) && (
          <Section>
            <Heading>5. Competitive Landscape</Heading>
            {has(ca?.overview) && <Body>{ca!.overview}</Body>}
            {arr(ca?.competitors) && ca!.competitors!.map((c, i) => (
              <div key={i} className="print-row mb-2 rounded-md border border-border p-3">
                <div className="text-[13px] font-bold text-foreground">{c.name ?? "Competitor"}{has(c.positioning) ? ` - ${c.positioning}` : ""}</div>
                {arr(c.strengths) && <div className="text-[12px] text-muted-foreground"><span className="font-semibold">Strengths:</span> {c.strengths!.join(", ")}</div>}
                {arr(c.weaknesses) && <div className="text-[12px] text-muted-foreground"><span className="font-semibold">Weaknesses:</span> {c.weaknesses!.join(", ")}</div>}
                {has(c.ourAdvantage) && <div className="text-[12px] text-foreground"><span className="font-semibold">Our advantage:</span> {c.ourAdvantage}</div>}
              </div>
            ))}
          </Section>
        )}

        {/* 6. Go-to-Market */}
        {(has(gtm?.strategy) || arr(gtm?.channels) || arr(gtm?.phases)) && (
          <Section>
            <Heading>6. Go-to-Market</Heading>
            {has(gtm?.strategy) && <Body>{gtm!.strategy}</Body>}
            {arr(gtm?.channels) && <><Sub>Channels</Sub><Bullets items={gtm!.channels!} /></>}
            {arr(gtm?.phases) && <><Sub>Phases</Sub><Bullets items={gtm!.phases!.map((p) => [p.name, p.description].filter(Boolean).join(" - "))} /></>}
          </Section>
        )}

        {/* 7. Financial Projections - real forecast (replaces the on-screen placeholder) */}
        <Section>
          <Heading>7. Financial Projections</Heading>
          {!forecast ? (
            <Body>Forecast not generated yet. Run the Forecast step (3.3) to populate this section.</Body>
          ) : (
            <>
              {has(forecast.revenueForecast?.summary) && <><Sub>Revenue outlook</Sub><Body>{forecast.revenueForecast!.summary}</Body></>}
              {has(forecast.costForecast?.summary) && <><Sub>Cost outlook</Sub><Body>{forecast.costForecast!.summary}</Body></>}
              {has(forecast.cashFlowProjection?.summary) && <><Sub>Cash-flow outlook</Sub><Body>{forecast.cashFlowProjection!.summary}</Body></>}
              {forecastInputs && (
                <div className="print-row my-3 rounded-md border border-border p-3">
                  <div className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">Inputs used</div>
                  <div className="grid grid-cols-5 gap-2 text-[9px] text-foreground">
                    <div><span className="font-semibold">ARPU:</span> {money(forecastInputs.arpu)}/mo</div>
                    <div><span className="font-semibold">OPEX:</span> {money(forecastInputs.opex)}/mo</div>
                    <div><span className="font-semibold">Growth:</span> {forecastInputs.monthlyGrowthPct ?? "-"}%/mo</div>
                    <div><span className="font-semibold">TAM:</span> {money(forecastInputs.tam)}</div>
                    <div><span className="font-semibold">Churn:</span> {forecastInputs.monthlyChurnPct ?? "-"}%/mo</div>
                  </div>
                </div>
              )}
              {fcProjected && (
                <p className="mb-2 text-[11px] italic text-muted-foreground">
                  Months 1-{fcAi} are AI-generated. Months {fcAi + 1}-{fcTotal} are projected
                  deterministically from your monthly growth rate - not model output.
                </p>
              )}
              {rows.length > 0 && (
                <div className="my-3">
                  <AreaChart width={680} height={240} data={rows} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="pRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} /><stop offset="95%" stopColor="var(--primary)" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} interval={5} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => (v != null ? `${money(Math.round(Number(v) / 1000))}k` : "")} />
                    <Legend iconType="circle" />
                    <Area type="monotone" dataKey="Revenue" stroke="var(--primary)" strokeWidth={2.5} fill="url(#pRev)" isAnimationActive={false} />
                    <Area type="monotone" dataKey="Cost" stroke="var(--warning)" strokeWidth={2} fillOpacity={0} isAnimationActive={false} />
                    <Area type="monotone" dataKey="Cashflow" stroke="var(--success-text)" strokeWidth={2} fillOpacity={0} isAnimationActive={false} />
                  </AreaChart>
                </div>
              )}

              {arr(tableRows) && <ConsolidatedForecastTable rows={tableRows} money={money} />}

              {be && (
                <div className="print-section mt-4">
                  <Sub>Break-even analysis</Sub>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-md border border-border p-2">
                      <div className="text-[9px] font-semibold uppercase text-muted-foreground">Timing</div>
                      <div className="mt-1 text-[13px] font-bold">{breakEvenMonth ? `Month ${breakEvenMonth}` : "Not achieved"}</div>
                      <div className="text-[9px] text-muted-foreground">{fcTotal > 0 ? `${fcTotal}-month forecast` : "Horizon unavailable"}</div>
                    </div>
                    <div className="rounded-md border border-border p-2">
                      <div className="text-[9px] font-semibold uppercase text-muted-foreground">{breakEvenMonth ? "Revenue at break-even" : `Revenue at month ${analysisMonth ?? "-"}`}</div>
                      <div className="mt-1 text-[13px] font-bold">{money(analysisRow?.revenue)}</div>
                      <div className="text-[9px] text-muted-foreground">Forecast monthly revenue</div>
                    </div>
                    <div className="rounded-md border border-border p-2">
                      <div className="text-[9px] font-semibold uppercase text-muted-foreground">{breakEvenMonth ? "Total cost at break-even" : `Total cost at month ${analysisMonth ?? "-"}`}</div>
                      <div className="mt-1 text-[13px] font-bold">{money(analysisRow?.totalCost)}</div>
                      <div className="text-[9px] text-muted-foreground">Fixed and variable costs</div>
                    </div>
                  </div>
                  {has(be.summary) && <div className="mt-2"><Body>{be.summary}</Body></div>}
                </div>
              )}

              {has(forecast.advisoryNotice) && (
                <div className="print-row mt-3 rounded-md border border-border bg-neutral-50 p-3 text-[11px] leading-relaxed text-foreground">
                  <span className="font-semibold">Advisory notice:</span> {forecast.advisoryNotice}
                </div>
              )}
            </>
          )}
        </Section>

        {/* 8. Team Needs */}
        {arr(cross.youNeed) && (
          <Section>
            <Heading>8. Team Needs</Heading>
            <Sub>Key hires</Sub>
            <Bullets items={cross.youNeed} />
          </Section>
        )}

        {/* 9. Funding Requirements */}
        {cross.seedAsk != null && (
          <Section>
            <Heading>9. Funding Requirements</Heading>
            <Body>Target raise: {formatMoney(cross.seedAsk, "EUR")}.</Body>
          </Section>
        )}

        {/* Appendix - operations, assumptions, risk register */}
        {(has(ops?.overview) || arr(ops?.keyActivities) || arr(ops?.resources) || arr(ops?.milestones)) && (
          <Section>
            <Heading>Appendix A · Operations &amp; Milestones</Heading>
            {has(ops?.overview) && <Body>{ops!.overview}</Body>}
            {arr(ops?.keyActivities) && <><Sub>Key activities</Sub><Bullets items={ops!.keyActivities!} /></>}
            {arr(ops?.resources) && <><Sub>Resources</Sub><Bullets items={ops!.resources!} /></>}
            {arr(ops?.milestones) && <><Sub>Milestones</Sub><Bullets items={ops!.milestones!.map((m) => [m.title, m.timeframe, m.description].filter(Boolean).join(" - "))} /></>}
          </Section>
        )}

        {arr(forecast?.assumptions) && (
          <Section>
            <Heading>Appendix B · Forecast Assumptions</Heading>
            <Bullets items={forecast!.assumptions!} />
          </Section>
        )}

        {(arr(planRisks) || arr(forecast?.risks)) && (
          <Section>
            <Heading>Appendix C · Risk Register</Heading>
            {arr(planRisks) && planRisks!.map((r, i) => (
              <div key={`p${i}`} className="print-row mb-1.5 text-[12px] text-foreground">
                <span className="font-semibold">{r.category ?? "Risk"}:</span> {r.description ?? ""}{has(r.mitigation) ? ` - Mitigation: ${r.mitigation}` : ""}
              </div>
            ))}
            {arr(forecast?.risks) && forecast!.risks!.map((r, i) => (
              <div key={`f${i}`} className="print-row mb-1.5 text-[12px] text-foreground">
                <div><span className="font-semibold">{r.category ?? "Risk"}:</span> {r.description ?? ""}</div>
                {(has(r.likelihood) || has(r.impact)) && (
                  <div className="text-[11px] text-muted-foreground">
                    {[has(r.likelihood) ? `Likelihood: ${r.likelihood}` : "", has(r.impact) ? `Impact: ${r.impact}` : ""].filter(Boolean).join(" | ")}
                  </div>
                )}
                {has(r.mitigation) && <div className="text-[11px]"><span className="font-semibold">Mitigation:</span> {r.mitigation}</div>}
              </div>
            ))}
          </Section>
        )}
      </div>
    </div>,
    document.body,
  );
}
