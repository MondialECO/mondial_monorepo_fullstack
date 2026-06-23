import { Award, CheckCircle2, Activity, DollarSign } from "lucide-react";
import KPITile from "@/components/investor/KPITile";
import type { InvestorProfile } from "@/types/investor/profile";

function fmtUsd(n: number): string {
  if (!n || n <= 0) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString()}`;
}

export default function ProfileStatsCard({ profile }: { profile: InvestorProfile }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <KPITile
        icon={Award}
        label="Successful exits"
        value={String(profile.successfulExits ?? 0)}
      />
      <KPITile
        icon={CheckCircle2}
        label="Completed deals"
        value={String(profile.completedDeals ?? 0)}
      />
      <KPITile
        icon={Activity}
        label="Active investments"
        value={String(profile.activeInvestments ?? 0)}
      />
      <KPITile
        icon={DollarSign}
        label="Avg. check size"
        value={fmtUsd(profile.averageCheckSize)}
      />
    </div>
  );
}
