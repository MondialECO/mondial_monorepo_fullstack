import { ShieldCheck, Sparkles, BarChart3, Goal, LineChart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import EmptyState from "@/components/shared/EmptyState";
import type { OpportunityDetail } from "@/types/investor/opportunities";

interface TractionTabPanelProps {
  detail: OpportunityDetail;
}

// Real traction KPIs (revenue, growth, transaction volume) are owner-gated on
// the backend and not exposed on the investor wire today. Rather than dress up
// scoring/readiness fields as "traction" — or fabricate a chart — we show an
// explicit unavailable state for traction, and present the fields we DO have
// honestly, clearly labelled as platform-derived readiness signals.
export default function TractionTabPanel({ detail }: TractionTabPanelProps) {
  // Match breakdown explanation
  const matchBreakdown = detail.scoreBreakdown ? [
    { dim: "Sector", score: detail.scoreBreakdown.sectorFit, max: 25 },
    { dim: "Funding Stage", score: detail.scoreBreakdown.stageFit, max: 15 },
    { dim: "Check Size", score: detail.scoreBreakdown.checkSizeFit, max: 20 },
    { dim: "Geography", score: detail.scoreBreakdown.geographyFit, max: 10 },
    { dim: "Equity Type", score: detail.scoreBreakdown.equityTypeFit, max: 5 },
    { dim: "Investment History", score: detail.scoreBreakdown.investmentHistoryFit, max: 10 },
    { dim: "Revenue Stage", score: detail.scoreBreakdown.revenueStageScore, max: 7 },
    { dim: "Market Size", score: detail.scoreBreakdown.marketSizeScore, max: 4 },
    { dim: "Growth Potential", score: detail.scoreBreakdown.growthPotentialScore, max: 4 },
  ].filter(d => d.score > 0) : [];

  const signals = [
    {
      icon: Sparkles,
      label: "Match Score",
      value: `${detail.matchScore}%`,
      sub: matchBreakdown.length > 0
        ? `${matchBreakdown.length} of 9 dimensions matched`
        : "Against your active thesis",
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
  ];

  return (
    <div className="space-y-6">
      <EmptyState
        icon={LineChart}
        title="Traction metrics not published"
        message="This founder hasn't shared revenue, growth, or transaction-volume KPIs for this opportunity. Traction charts will appear here once the company publishes them."
      />

      <div>
        <h4 className="text-sm font-semibold text-foreground">Readiness signals</h4>
        <p className="mt-1 mb-3 text-xs text-muted-foreground">
          Platform-derived indicators of investment readiness — not
          company-reported traction.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {signals.map((t) => (
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
                <div className="text-xl font-bold text-foreground tabular-nums">
                  {t.value}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{t.sub}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {matchBreakdown.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">Match breakdown</h4>
          <div className="space-y-2">
            {matchBreakdown.map((item) => (
              <div key={item.dim} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{item.dim}</span>
                <span className="font-medium text-foreground">{item.score}/{item.max} points</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
