import { cn } from "@/lib/utils";
import type { OpportunityScoreBreakdown } from "@/types/investor/opportunities";

interface ScoreBreakdownPanelProps {
  breakdown: OpportunityScoreBreakdown;
  className?: string;
}

const ROWS: Array<{ key: keyof OpportunityScoreBreakdown; label: string }> = [
  { key: "sectorFit", label: "Sector Match" },
  { key: "stageFit", label: "Funding Stage" },
  { key: "checkSizeFit", label: "Check Size" },
  { key: "geographyFit", label: "Geography" },
  { key: "equityTypeFit", label: "Equity Type" },
  { key: "investmentHistoryFit", label: "Investment History" },
  { key: "revenueStageScore", label: "Revenue Stage" },
  { key: "marketSizeScore", label: "Market Size" },
  { key: "growthPotentialScore", label: "Growth Potential" },
];

export default function ScoreBreakdownPanel({
  breakdown,
  className,
}: ScoreBreakdownPanelProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-semibold text-foreground">Score Breakdown</h3>
      <ul className="space-y-2">
        {ROWS.map(({ key, label }) => {
          const v = Math.max(0, Math.min(100, Math.round(breakdown[key] ?? 0)));
          return (
            <li key={key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium text-foreground tabular-nums">{v}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${v}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
