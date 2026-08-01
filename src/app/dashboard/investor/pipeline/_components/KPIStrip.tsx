import { Briefcase, Wallet, Sparkles } from "lucide-react";
import KPITile from "@/components/investor/KPITile";
import type { InvestorPipelineSummary } from "@/types/investor/opportunities";

interface KPIStripProps {
  summary: InvestorPipelineSummary;
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2)}M`;
  if (n >= 1_000) return `€${Math.round(n / 1_000)}K`;
  return `€${n.toLocaleString()}`;
}

export default function KPIStrip({ summary }: KPIStripProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      <KPITile
        icon={Briefcase}
        label="Active Deals"
        value={summary.activeDeals.toString()}
        sublabel="across pipeline stages"
      />
      <KPITile
        icon={Wallet}
        label="Capital Committed"
        value={formatCurrency(summary.capitalCommitted)}
        sublabel="across investments"
      />
      <KPITile
        icon={Sparkles}
        label="Avg Match Score"
        value={`${summary.averageMatchScore.toFixed(1)}%`}
        sublabel="across active matches"
      />
    </div>
  );
}
