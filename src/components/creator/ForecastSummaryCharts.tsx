"use client";

import React from "react";

export interface ForecastRowCalculated {
  month: number;
  name: string;
  subscribers: number;
  revenue: number;
  fixedCost: number;
  variableCost: number;
  totalCost: number;
  netCashFlow: number;
  cumulative: number;
  cashOnHand: number;
  notes: string;
  isMilestone?: boolean;
  milestoneTag?: string;
}

/* =========================================================================
   Figma Exact Section 3 SVG Components (Node 57157:9348)
   ========================================================================= */

export function RevenueAreaSvg({
  rows,
  breakEvenMonth,
  idPrefix = "page",
}: {
  rows: ForecastRowCalculated[];
  breakEvenMonth: number;
  idPrefix?: string;
}) {
  const width = 341;
  const height = 112;
  const padLeft = 4;
  const padRight = 4;
  const padTop = 14;
  const padBottom = 16;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxRev = Math.max(...rows.map((r) => r.revenue), 1);
  const getX = (m: number) => padLeft + ((m - 1) / 35) * plotW;
  const getY = (v: number) => height - padBottom - (v / maxRev) * plotH;

  const pts = rows.map((r) => `${getX(r.month).toFixed(1)},${getY(r.revenue).toFixed(1)}`);
  const areaPath = `M ${getX(1).toFixed(1)},${height - padBottom} L ${pts.join(" L ")} L ${getX(36).toFixed(1)},${height - padBottom} Z`;
  const solidPath = `M ${pts.slice(0, 12).join(" L ")}`;
  const dashedPath = `M ${pts.slice(11).join(" L ")}`;

  const m12X = getX(12);
  const beIndex = Math.max(1, Math.min(36, breakEvenMonth));
  const beX = getX(beIndex);
  const beY = getY(rows[beIndex - 1]?.revenue ?? 0);
  const gradId = `${idPrefix}RevenueGrad`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-[112px] overflow-visible"
      preserveAspectRatio="none"
      aria-label="Revenue 36-month trajectory"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0D9488" stopOpacity={0.25} />
          <stop offset="100%" stopColor="#0D9488" stopOpacity={0.0} />
        </linearGradient>
      </defs>

      {/* Soft area gradient */}
      <path d={areaPath} fill={`url(#${gradId})`} />

      {/* Modelled solid curve (Months 1–12) */}
      <path d={solidPath} fill="none" stroke="#0D9488" strokeWidth={2.4} strokeLinecap="round" />

      {/* Projected dashed curve (Months 12–36) */}
      <path d={dashedPath} fill="none" stroke="#0D9488" strokeWidth={2.4} strokeDasharray="4 4" strokeLinecap="round" />

      {/* Month 12 divider vertical line */}
      <line
        x1={m12X}
        y1={padTop - 4}
        x2={m12X}
        y2={height - padBottom}
        stroke="currentColor"
        className="text-slate-300 dark:text-slate-700"
        strokeWidth={1.2}
        strokeDasharray="2.5 2.5"
      />
      <text x={m12X - 4} y={height - 2} textAnchor="end" className="text-[9px] fill-slate-400 font-sans">
        Modelled
      </text>
      <text x={m12X + 4} y={height - 2} textAnchor="start" className="text-[9px] fill-slate-400 font-sans">
        Projected
      </text>

      {/* Break-even point marker on curve */}
      <circle cx={beX} cy={beY} r={4.5} fill="#FFFFFF" stroke="#0D9488" strokeWidth={2.4} />

      {/* Break-even floating badge */}
      <g transform={`translate(${Math.max(45, Math.min(width - 45, beX))}, ${Math.max(14, beY - 12)})`}>
        <rect
          x={-42}
          y={-9}
          width={84}
          height={16}
          rx={8}
          fill="#FFFFFF"
          stroke="#0D9488"
          strokeWidth={1}
          className="dark:fill-slate-900 shadow-sm"
        />
        <text x={0} y={2.5} textAnchor="middle" className="text-[9.5px] font-sans font-semibold fill-teal-600 dark:fill-teal-400">
          M{breakEvenMonth} break-even
        </text>
      </g>
    </svg>
  );
}

export function CostVsRevenueCrossingSvg({
  rows,
  breakEvenMonth,
  breakEvenRevenue,
  breakEvenSubs,
}: {
  rows: ForecastRowCalculated[];
  breakEvenMonth: number;
  breakEvenRevenue: number;
  breakEvenSubs: number;
  idPrefix?: string;
}) {
  const width = 341;
  const height = 112;
  const padLeft = 4;
  const padRight = 4;
  const padTop = 14;
  const padBottom = 16;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxVal = Math.max(...rows.flatMap((r) => [r.revenue, r.totalCost]), 1);
  const getX = (m: number) => padLeft + ((m - 1) / 35) * plotW;
  const getY = (v: number) => height - padBottom - (v / maxVal) * plotH;

  const costPts = rows.map((r) => `${getX(r.month).toFixed(1)},${getY(r.totalCost).toFixed(1)}`);
  const revPts = rows.map((r) => `${getX(r.month).toFixed(1)},${getY(r.revenue).toFixed(1)}`);

  const costPath = `M ${costPts.join(" L ")}`;
  const revPath = `M ${revPts.join(" L ")}`;

  const beIndex = Math.max(1, Math.min(36, breakEvenMonth));
  const beX = getX(beIndex);
  const beY = getY(breakEvenRevenue);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-[112px] overflow-visible"
      preserveAspectRatio="none"
      aria-label="Cost vs revenue inflection point"
    >
      {/* Total Cost Curve */}
      <path d={costPath} fill="none" stroke="#505C8C" strokeWidth={2} strokeLinecap="round" />

      {/* Revenue Curve */}
      <path d={revPath} fill="none" stroke="#0D9488" strokeWidth={2.5} strokeLinecap="round" />

      {/* Drop line from intersection to baseline */}
      <line
        x1={beX}
        y1={beY}
        x2={beX}
        y2={height - padBottom}
        stroke="#0D9488"
        strokeWidth={1.4}
        strokeDasharray="2 2"
      />

      {/* Outer circle dot */}
      <circle cx={beX} cy={beY} r={4.5} fill="#FFFFFF" stroke="#0D9488" strokeWidth={2.4} />
      {/* Inner teal dot */}
      <circle cx={beX} cy={beY} r={2} fill="#0D9488" />

      {/* Floating pill badge */}
      <g transform={`translate(${Math.max(52, Math.min(width - 52, beX + 4))}, ${Math.max(12, beY - 14)})`}>
        <rect
          x={-50}
          y={-9}
          width={100}
          height={16}
          rx={4}
          fill="#FFFFFF"
          stroke="#CBD5E1"
          strokeWidth={1}
          className="dark:fill-slate-900 dark:stroke-slate-700 shadow-sm"
        />
        <text x={0} y={2.5} textAnchor="middle" className="text-[9.5px] font-sans font-semibold fill-foreground">
          €{Math.round(breakEvenRevenue).toLocaleString()} ({breakEvenSubs} subs)
        </text>
      </g>
    </svg>
  );
}

export function Cash36BarSvg({
  rows,
  budgetRunsOutMonth,
  cashPositiveMonth,
  lowestCashMonth,
  fundingGap,
}: {
  rows: ForecastRowCalculated[];
  budgetRunsOutMonth: number | null;
  cashPositiveMonth: number | null;
  lowestCashMonth: number;
  fundingGap: number;
  idPrefix?: string;
}) {
  const width = 341;
  const height = 112;
  const baselineY = 56;

  const maxPos = Math.max(...rows.map((r) => (r.cashOnHand > 0 ? r.cashOnHand : 0)), 1);
  const maxNeg = Math.max(...rows.map((r) => (r.cashOnHand < 0 ? Math.abs(r.cashOnHand) : 0)), 1);

  const barWidth = 5.7;
  const pitch = 9.47;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-[112px] overflow-visible"
      preserveAspectRatio="none"
      aria-label="36-month cash position bar chart"
    >
      {/* Zero baseline */}
      <line
        x1={0}
        y1={baselineY}
        x2={width}
        y2={baselineY}
        stroke="#CBD5E1"
        strokeWidth={1}
        className="dark:stroke-slate-700"
      />

      {/* 36 individual bars */}
      {rows.map((r, i) => {
        const m = r.month;
        const x = i * pitch + 0.5;
        const cash = r.cashOnHand;
        const isDeficit = cash < 0;

        let barH = 0;
        let barY = baselineY;
        let fill = "#94A3B8";

        if (!isDeficit) {
          barH = Math.max(2.5, Math.min(46, (cash / maxPos) * 46));
          barY = baselineY - barH;
          if (budgetRunsOutMonth && m < budgetRunsOutMonth) {
            fill = "#94A3B8"; // initial budget cash
          } else {
            fill = "#0D9488"; // profitable cash
          }
        } else {
          barH = Math.max(3, Math.min(46, (Math.abs(cash) / maxNeg) * 46));
          barY = baselineY;
          if (m === lowestCashMonth) {
            fill = "#D97706"; // highlight lowest cash
          } else {
            fill = "#965F11"; // deficit amber
          }
        }

        return (
          <rect
            key={m}
            x={x.toFixed(1)}
            y={barY.toFixed(1)}
            width={barWidth}
            height={barH.toFixed(1)}
            rx={1}
            fill={fill}
          >
            <title>{`Month ${m}: €${Math.round(cash).toLocaleString()}`}</title>
          </rect>
        );
      })}

      {/* Callout 1: Budget runs out */}
      {budgetRunsOutMonth && fundingGap > 0 && budgetRunsOutMonth <= 36 && (
        <g>
          {(() => {
            const cx = (budgetRunsOutMonth - 1) * pitch + barWidth / 2;
            const textX = Math.max(2, Math.min(width - 98, cx - 8));
            return (
              <>
                <line
                  x1={cx}
                  y1={baselineY}
                  x2={cx}
                  y2={baselineY + 34}
                  stroke="#965F11"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  className="dark:stroke-amber-400"
                />
                <text
                  x={textX}
                  y={baselineY + 46}
                  className="text-[9px] font-sans font-semibold fill-[#965F11] dark:fill-amber-400"
                >
                  Budget runs out · M{budgetRunsOutMonth}
                </text>
              </>
            );
          })()}
        </g>
      )}

      {/* Callout 2: Cash positive */}
      {cashPositiveMonth && cashPositiveMonth <= 36 && (
        <g>
          {(() => {
            const cx = (cashPositiveMonth - 1) * pitch + barWidth / 2;
            const textX = Math.max(6, Math.min(width - 92, cx - 12));
            return (
              <>
                <line
                  x1={cx}
                  y1={baselineY}
                  x2={cx}
                  y2={baselineY - 30}
                  stroke="#0D9488"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  className="dark:stroke-teal-400"
                />
                <text
                  x={textX}
                  y={baselineY - 36}
                  className="text-[9px] font-sans font-semibold fill-[#0D9488] dark:fill-teal-400"
                >
                  Cash positive · M{cashPositiveMonth}
                </text>
              </>
            );
          })()}
        </g>
      )}
    </svg>
  );
}
