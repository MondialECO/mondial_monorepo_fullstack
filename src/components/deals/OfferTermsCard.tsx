import DealCardBase from "@/components/investor/DealCardBase";
import DealStatusBadge from "./DealStatusBadge";
import { formatCurrency } from "@/lib/deal-utils";
import type { TermSheetView } from "@/types/deals";

interface OfferTermsCardProps {
  terms: TermSheetView;
  title?: string;
}

function Stat({ label, value, prominent = false }: { label: string; value: string; prominent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 font-semibold text-foreground tabular-nums ${prominent ? "text-lg" : "text-base"}`}>{value}</div>
    </div>
  );
}

export default function OfferTermsCard({ terms, title = "Current Terms" }: OfferTermsCardProps) {
  return (
    <DealCardBase>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <DealStatusBadge status={terms.status} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Raise" value={formatCurrency(terms.totalRaiseAmount)} prominent />
        <Stat label="Post-Money" value={formatCurrency(terms.postMoneyValuation)} prominent />
        <Stat
          label="Equity"
          value={terms.investorEquityPercent ? `${terms.investorEquityPercent.toFixed(2)}%` : "—"}
          prominent
        />
        <Stat label="Type" value={terms.equityType || "—"} />
      </div>
      {terms.proRataRights ? (
        <p className="mt-3 text-xs text-muted-foreground">Includes pro-rata rights.</p>
      ) : null}
    </DealCardBase>
  );
}
