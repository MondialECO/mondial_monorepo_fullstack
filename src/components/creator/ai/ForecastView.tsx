import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatMoney } from "@/lib/format-money";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  ListChecks,
  ShieldAlert,
  Info,
} from "lucide-react";
import type { ForecastOutput } from "@/types/creator/ai";

// Shared formatter (screen + PDF) so currency handling can't drift between them.
const fmt = (n: number, currency?: string) => formatMoney(n, currency);

function ForecastCard({
  icon: Icon,
  title,
  summary,
  children,
}: {
  icon: typeof TrendingUp;
  title: string;
  summary?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-primary" aria-hidden />
          {title}
        </CardTitle>
        {summary && (
          <p className="text-sm text-muted-foreground">{summary}</p>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function MonthTable({
  head,
  rows,
}: {
  head: string[];
  rows: (string | number)[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            {head.map((h, i) => (
              <th
                key={i}
                className={`py-2 pr-4 font-semibold ${i === 0 ? "" : "text-right"}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/50">
              {r.map((c, j) => (
                <td
                  key={j}
                  className={`py-1.5 pr-4 ${
                    j === 0
                      ? "font-medium text-foreground"
                      : "text-right text-muted-foreground"
                  }`}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const likelihoodVariant = (v?: string) => {
  const s = v?.toLowerCase();
  if (s === "high") return "destructive" as const;
  if (s === "medium") return "warning" as const;
  return "secondary" as const;
};

export function ForecastView({ output }: { output: ForecastOutput }) {
  const rev = output.revenueForecast;
  const cost = output.costForecast;
  const cash = output.cashFlowProjection;
  const be = output.breakEvenAnalysis;

  const totalMonths = rev?.monthly?.length ?? 0;
  // Legacy sessions lack aiMonthCount → default to the array length so nothing is
  // flagged projected (those forecasts were genuinely 12-month AI output).
  const aiMonths = output.aiMonthCount ?? totalMonths;
  const hasProjection = totalMonths > aiMonths;

  return (
    <div className="space-y-4">
      {output.advisoryNotice && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>{output.advisoryNotice}</AlertDescription>
        </Alert>
      )}

      {hasProjection && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Months 1–{aiMonths} are AI-generated. Months {aiMonths + 1}–{totalMonths} are
            projected deterministically from your monthly growth rate — not model output.
          </AlertDescription>
        </Alert>
      )}

      {rev && (
        <ForecastCard
          icon={TrendingUp}
          title="Revenue Forecast"
          summary={rev.summary}
        >
          {!!rev.monthly?.length && (
            <MonthTable
              head={["Month", `Revenue${rev.currency ? ` (${rev.currency})` : ""}`, "Notes"]}
              rows={rev.monthly.map((m) => [
                `M${m.month}`,
                fmt(m.amount, rev.currency),
                m.notes ?? "",
              ])}
            />
          )}
        </ForecastCard>
      )}

      {cost && (
        <ForecastCard
          icon={TrendingDown}
          title="Cost Forecast"
          summary={cost.summary}
        >
          {!!cost.monthly?.length && (
            <MonthTable
              head={["Month", "Fixed", "Variable", "Total"]}
              rows={cost.monthly.map((m) => [
                `M${m.month}`,
                fmt(m.fixedCosts, cost.currency),
                fmt(m.variableCosts, cost.currency),
                fmt(m.fixedCosts + m.variableCosts, cost.currency),
              ])}
            />
          )}
        </ForecastCard>
      )}

      {cash && (
        <ForecastCard
          icon={Wallet}
          title="Cash Flow Projection"
          summary={cash.summary}
        >
          {!!cash.monthly?.length && (
            <MonthTable
              head={["Month", "Net Cash Flow", "Ending Balance"]}
              rows={cash.monthly.map((m) => [
                `M${m.month}`,
                fmt(m.netCashFlow, cash.currency),
                fmt(m.endingBalance, cash.currency),
              ])}
            />
          )}
        </ForecastCard>
      )}

      {be && (
        <ForecastCard icon={Target} title="Break-Even Analysis">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {be.isAchievedWithinHorizon ? (
              <Badge variant="success">
                Break-even at month {be.breakEvenMonth ?? "—"}
              </Badge>
            ) : (
              <Badge variant="warning">
                Not reached within {totalMonths || 36}-month horizon
              </Badge>
            )}
          </div>
          {be.summary && (
            <p className="mt-2 text-sm text-muted-foreground">{be.summary}</p>
          )}
        </ForecastCard>
      )}

      {!!output.assumptions?.length && (
        <ForecastCard icon={ListChecks} title="Assumptions">
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {output.assumptions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </ForecastCard>
      )}

      {!!output.risks?.length && (
        <ForecastCard icon={ShieldAlert} title="Risks">
          <div className="space-y-3">
            {output.risks.map((r, i) => (
              <div key={i} className="rounded-lg border border-border p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {r.category}
                  </span>
                  {r.likelihood && (
                    <Badge variant={likelihoodVariant(r.likelihood)}>
                      L: {r.likelihood}
                    </Badge>
                  )}
                  {r.impact && <Badge variant="outline">I: {r.impact}</Badge>}
                </div>
                {r.description && (
                  <p className="mt-1 text-muted-foreground">{r.description}</p>
                )}
                {r.mitigation && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Mitigation:{" "}
                    </span>
                    {r.mitigation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </ForecastCard>
      )}
    </div>
  );
}

export default ForecastView;
