import { Wallet, Handshake, PieChart, Scale, TrendingUp } from "lucide-react";
import KPITile from "@/components/investor/KPITile";
import type { OpportunityDetail } from "@/types/investor/opportunities";

interface InvestmentSummaryGridProps {
  detail: OpportunityDetail;
}

function formatCurrency(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2)}M`;
  if (n >= 1_000) return `€${Math.round(n / 1_000)}K`;
  return `€${n.toLocaleString()}`;
}

export default function InvestmentSummaryGrid({ detail }: InvestmentSummaryGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      <KPITile
        icon={Wallet}
        label="Funding Ask"
        value={formatCurrency(detail.fundingAskAmount)}
        sublabel="round target"
      />
      <KPITile
        icon={Handshake}
        label="Offer Amount"
        value={formatCurrency(detail.fundingAskAmount)}
        sublabel="this investor"
      />
      <KPITile
        icon={PieChart}
        label="Equity"
        value={
          detail.equityOfferedPercent != null
            ? `${detail.equityOfferedPercent.toFixed(2)}%`
            : "—"
        }
        sublabel="of post-money"
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
    </div>
  );
}
