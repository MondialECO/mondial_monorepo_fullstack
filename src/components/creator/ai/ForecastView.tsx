import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/format-money";
import {
  ListChecks,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import type { ForecastOutput } from "@/types/creator/ai";

const fmt = (n: number, currency?: string) => formatMoney(n, currency);

const likelihoodVariant = (v?: string) => {
  const s = v?.toLowerCase();
  if (s === "high") return "bg-destructive text-white" as const;
  if (s === "medium") return "bg-warning text-white" as const;
  return "bg-secondary text-foreground" as const;
};

export function ForecastView({ output }: { output: ForecastOutput }) {
  const rev = output.revenueForecast;
  const cost = output.costForecast;
  const cash = output.cashFlowProjection;
  const be = output.breakEvenAnalysis;

  const totalMonths = rev?.monthly?.length ?? 0;

  // Build consolidated table data from all three forecasts
  const tableRows = Array.from({ length: totalMonths }, (_, i) => {
    const revM = rev?.monthly?.[i];
    const costM = cost?.monthly?.[i];
    const cashM = cash?.monthly?.[i];
    return {
      month: i + 1,
      revenue: revM?.amount ?? 0,
      subscribers: (revM as any)?.subscribers ?? 0,
      costFixed: costM?.fixedCosts ?? 0,
      costVar: costM?.variableCosts ?? 0,
      netCashFlow: cashM?.netCashFlow ?? 0,
      endingBalance: cashM?.endingBalance ?? 0,
      notes: revM?.notes ?? "",
    };
  });

  return (
    <div className="space-y-6 p-6 bg-card/70 rounded-2xl border border-border">
      {/* Consolidated 36-Month Financial Forecast Table */}
      <div>
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Financial Forecast Results</p>
          <h3 className="text-2xl font-bold">Financial Forecast - 36-Month Projection</h3>
          <p className="text-sm text-muted-foreground mt-1">A consolidated 24-month model aligning subscription growth, operational expenditures, and cumulative runway health.</p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[1000px] text-sm bg-card">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 font-semibold text-left text-xs text-muted-foreground">Month</th>
                <th className="px-4 py-3 font-semibold text-right text-xs text-muted-foreground">Revenue</th>
                <th className="px-4 py-3 font-semibold text-right text-xs text-muted-foreground">Subscribers</th>
                <th className="px-4 py-3 font-semibold text-right text-xs text-muted-foreground">Cost (Fixed)</th>
                <th className="px-4 py-3 font-semibold text-right text-xs text-muted-foreground">Cost (Var)</th>
                <th className="px-4 py-3 font-semibold text-right text-xs text-muted-foreground">Total Cost</th>
                <th className="px-4 py-3 font-semibold text-right text-xs text-muted-foreground">Net Cash Flow</th>
                <th className="px-4 py-3 font-semibold text-right text-xs text-muted-foreground">Ending Balance</th>
                <th className="px-4 py-3 font-semibold text-left text-xs text-muted-foreground">Notes</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-foreground">M{row.month}</td>
                  <td className="px-4 py-2.5 text-right">{fmt(row.revenue, rev?.currency)}</td>
                  <td className="px-4 py-2.5 text-right">{row.subscribers}</td>
                  <td className="px-4 py-2.5 text-right">{fmt(row.costFixed, cost?.currency)}</td>
                  <td className="px-4 py-2.5 text-right">{fmt(row.costVar, cost?.currency)}</td>
                  <td className="px-4 py-2.5 text-right">{fmt(row.costFixed + row.costVar, cost?.currency)}</td>
                  <td className={`px-4 py-2.5 text-right font-medium ${row.netCashFlow < 0 ? 'text-destructive' : 'text-foreground'}`}>
                    {fmt(row.netCashFlow, cash?.currency)}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-medium ${row.endingBalance < 0 ? 'text-destructive' : 'text-foreground'}`}>
                    {fmt(row.endingBalance, cash?.currency)}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Break-Even Analysis */}
      {be && (
        <div className="mt-6 bg-card/70 rounded-2xl border border-border p-4">
          <div className="flex items-center mb-4">
            <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-bold">Break-Even Analysis</h3>
            {be.isAchievedWithinHorizon && (
              <Badge className="gap-1 ml-auto text-xs">
                <CheckCircle2 className="h-3 w-3" />
                Break-Even Achieved: Month {be.breakEvenMonth ?? "—"}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
            <Card className="rounded-xl border border-border/60 bg-card">
              <CardContent className="pt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Monthly Fixed Overhead</p>
                <p className="text-2xl font-bold">€8,000/month</p>
                <p className="text-xs text-muted-foreground mt-2">Base operations cost</p>
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-border/60 bg-card">
              <CardContent className="pt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Subscriber ARPU</p>
                <p className="text-2xl font-bold">€32.00/month</p>
                <p className="text-xs text-muted-foreground mt-2">Average monthly yield</p>
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-border/60 bg-card">
              <CardContent className="pt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Required Volume for Break-Even</p>
                <p className="text-2xl font-bold">296 Active Subscribers</p>
                <p className="text-xs text-muted-foreground mt-2">Break-even target size</p>
              </CardContent>
            </Card>
          </div>

          {be.summary && (
            <p className="text-sm text-muted-foreground bg-muted/20 rounded-lg p-3">{be.summary}</p>
          )}
        </div>
      )}

      {/* Two Column Layout: Key Model Assumptions + Risk Assessment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Key Model Assumptions */}
        {!!output.assumptions?.length && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ListChecks className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-bold">Key Model Assumptions</h3>
            </div>
            <ul className="space-y-2">
              {output.assumptions.map((a, i) => (
                <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                  <span className="text-foreground font-bold shrink-0">•</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risk Assessment Matrix */}
        {!!output.risks?.length && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-bold">Risk Assessment Matrix</h3>
            </div>
            <div className="space-y-3">
              {output.risks.map((r, i) => (
                <div key={i} className="rounded-lg border border-border/60 bg-muted/20 p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="font-semibold text-foreground text-sm">{i + 1}. {r.category}</span>
                    {r.likelihood && (
                      <Badge className={`text-[10px] ${likelihoodVariant(r.likelihood)}`}>{r.likelihood}</Badge>
                    )}
                  </div>
                  {r.description && (
                    <p className="text-sm text-muted-foreground">{r.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ForecastView;
