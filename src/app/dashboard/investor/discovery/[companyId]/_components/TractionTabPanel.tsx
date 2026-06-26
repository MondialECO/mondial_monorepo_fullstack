import { ShieldCheck, Sparkles, BarChart3, Goal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { OpportunityDetail } from "@/types/investor/opportunities";

interface TractionTabPanelProps {
  detail: OpportunityDetail;
}

// Phase-2 traction view — projection of the publicly safe fields on
// OpportunityDetail. KPI baseline is owner-gated on the backend and not
// exposed to investors today; values shown are intentionally limited to
// what is already on the wire.
export default function TractionTabPanel({ detail }: TractionTabPanelProps) {
  const tiles = [
    {
      icon: ShieldCheck,
      label: "Trust Score",
      value: `${detail.trustScore}/100`,
      sub: "Verification + cap-table + financial readiness",
    },
    {
      icon: Sparkles,
      label: "Match Score",
      value: `${detail.matchScore}%`,
      sub: "Against your active thesis",
    },
    {
      icon: BarChart3,
      label: "AI Review Score",
      value: detail.aiReviewScore != null ? `${detail.aiReviewScore}/100` : "—",
      sub:
        detail.aiReviewScore != null
          ? "Latest Phase-7 readiness snapshot"
          : "Pending company-side review",
    },
    {
      icon: Goal,
      label: "Investor-Ready Badge",
      value: detail.isInvestorReady ? "Awarded" : "Not yet",
      sub: detail.isInvestorReady
        ? "Founder cleared Phase-7 readiness gate"
        : "Founder still completing Phase-7",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {tiles.map((t) => (
        <Card key={t.label} className="border-border rounded-2xl">
          <CardContent className="p-5">
            <div className="mb-2 inline-flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10">
                <t.icon className="h-4 w-4 text-primary" aria-hidden />
              </div>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t.label}
              </span>
            </div>
            <div className="text-xl font-bold text-foreground tabular-nums">{t.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{t.sub}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
