import { Wallet, Scale, TrendingUp, PieChart } from "lucide-react";
import KPITile from "@/components/investor/KPITile";
import type { OpportunityDetail } from "@/types/investor/opportunities";

interface OpportunityKPIStripProps {
  detail: OpportunityDetail;
}

function formatCurrency(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `€${Math.round(n / 1_000)}K`;
  return `€${n.toLocaleString()}`;
}

export default function OpportunityKPIStrip({ detail }: OpportunityKPIStripProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <KPITile
        icon={Wallet}
        label="Funding Ask"
        value={formatCurrency(detail.fundingAskAmount)}
        sublabel="round target"
      />
      <KPITile
        icon={Scale}
        label="Pre-Money"
        value={formatCurrency(detail.preMoneyValuation)}
        sublabel="valuation"
      />
      <KPITile
        icon={TrendingUp}
        label="Post-Money"
        value={formatCurrency(detail.valuation)}
        sublabel="valuation"
      />
      <KPITile
        icon={PieChart}
        label="Equity Offered"
        value={
          detail.equityOfferedPercent != null
            ? `${detail.equityOfferedPercent.toFixed(2)}%`
            : "—"
        }
        sublabel="of fully-diluted shares"
      />
    </div>
  );
}
