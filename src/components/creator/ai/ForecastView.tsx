import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/format-money";
import {
  CircleDashed,
  ListChecks,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import type { ForecastOutput } from "@/types/creator/ai";

const fmt = (n?: number | null, currency?: string) => formatMoney(n, currency);

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
  const forecastMonthNumbers = [
    ...(rev?.monthly ?? []).map((month) => month.month),
    ...(cost?.monthly ?? []).map((month) => month.month),
    ...(cash?.monthly ?? []).map((month) => month.month),
  ];
  const forecastHorizon = forecastMonthNumbers.length
    ? Math.max(...forecastMonthNumbers)
    : 0;
  const breakEvenMonth =
    be?.isAchievedWithinHorizon && typeof be.breakEvenMonth === "number"
      ? be.breakEvenMonth
      : null;
  // When break-even is outside the horizon, show the final modeled month so the
  // cards still describe real forecast data rather than invented target values.
  const analysisMonth =
    breakEvenMonth ?? (forecastHorizon > 0 ? forecastHorizon : null);
  const analysisRevenue = analysisMonth
    ? rev?.monthly?.find((month) => month.month === analysisMonth)
    : undefined;
  const analysisCost = analysisMonth
    ? cost?.monthly?.find((month) => month.month === analysisMonth)
    : undefined;
  const totalCostAtAnalysis = analysisCost
    ? analysisCost.fixedCosts + analysisCost.variableCosts
    : null;

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
          <div className="flex items-center gap-2 mb-4">
            {breakEvenMonth ? (
              <CheckCircle2 className="h-5 w-5 text-success-text" />
            ) : (
              <CircleDashed className="h-5 w-5 text-warning" />
            )}
            <h3 className="text-lg font-bold">Break-Even Analysis</h3>
            {breakEvenMonth ? (
              <Badge variant="success" className="gap-1 ml-auto text-xs">
                <CheckCircle2 className="h-3 w-3" />
                Break-Even Achieved: Month {breakEvenMonth}
              </Badge>
            ) : (
              <Badge variant="warning" className="gap-1 ml-auto text-xs">
                <CircleDashed className="h-3 w-3" />
                Not achieved within forecast
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
            <Card className="rounded-xl border border-border/60 bg-card">
              <CardContent className="pt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Break-Even Timing</p>
                <p className="text-2xl font-bold">{breakEvenMonth ? `Month ${breakEvenMonth}` : "Not achieved"}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {forecastHorizon > 0
                    ? `${breakEvenMonth ? "Within" : "Not reached within"} the ${forecastHorizon}-month forecast`
                    : "Forecast horizon unavailable"}
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-border/60 bg-card">
              <CardContent className="pt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  {breakEvenMonth ? "Revenue at Break-Even" : `Revenue at Month ${analysisMonth ?? "—"}`}
                </p>
                <p className="text-2xl font-bold">{fmt(analysisRevenue?.amount, rev?.currency)}</p>
                <p className="text-xs text-muted-foreground mt-2">Forecast monthly revenue</p>
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-border/60 bg-card">
              <CardContent className="pt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  {breakEvenMonth ? "Total Cost at Break-Even" : `Total Cost at Month ${analysisMonth ?? "—"}`}
                </p>
                <p className="text-2xl font-bold">{fmt(totalCostAtAnalysis, cost?.currency)}</p>
                <p className="text-xs text-muted-foreground mt-2">Fixed and variable costs combined</p>
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
