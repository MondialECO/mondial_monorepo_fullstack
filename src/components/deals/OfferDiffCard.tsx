"use client";

import DealCardBase from "@/components/investor/DealCardBase";
import { formatCurrency } from "@/lib/deal-utils";
import type { TermSheetRevisionView } from "@/types/deals";

interface OfferDiffCardProps {
  current: TermSheetRevisionView;
  previous: TermSheetRevisionView;
}

function DiffValue<T extends string | number>({
  label,
  prev,
  current,
  format = (v) => String(v),
}: {
  label: string;
  prev: T;
  current: T;
  format?: (v: T) => string;
}) {
  const prevStr = format(prev);
  const currStr = format(current);
  const changed = prevStr !== currStr;

  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex gap-2 items-center">
        <span className="text-muted-foreground line-through">{prevStr}</span>
        {changed && (
          <>
            <span className="text-muted-foreground">→</span>
            <span className={`font-medium ${currStr > prevStr ? "text-green-600" : "text-blue-600"}`}>
              {currStr}
            </span>
          </>
        )}
        {!changed && <span className="text-muted-foreground">{currStr}</span>}
      </div>
    </div>
  );
}

export default function OfferDiffCard({ current, previous }: OfferDiffCardProps) {
  const changes = [];

  // Check each term for changes
  if (current.terms.totalRaiseAmount !== previous.terms.totalRaiseAmount) {
    changes.push("raise");
  }
  if (current.terms.postMoneyValuation !== previous.terms.postMoneyValuation) {
    changes.push("valuation");
  }
  if (current.terms.investorEquityPercent !== previous.terms.investorEquityPercent) {
    changes.push("equity");
  }
  if (current.terms.equityType !== previous.terms.equityType) {
    changes.push("type");
  }
  if (current.terms.proRataRights !== previous.terms.proRataRights) {
    changes.push("prorate");
  }

  if (changes.length === 0) {
    return null; // No changes to display
  }

  return (
    <DealCardBase>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">What changed from Offer {previous.revisionNumber}</h3>
          <span className="text-xs text-muted-foreground">{changes.length} change{changes.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="border-t border-border pt-2 space-y-0">
          {changes.includes("raise") && (
            <DiffValue
              label="Raise"
              prev={previous.terms.totalRaiseAmount}
              current={current.terms.totalRaiseAmount}
              format={formatCurrency}
            />
          )}
          {changes.includes("valuation") && (
            <DiffValue
              label="Post-Money"
              prev={previous.terms.postMoneyValuation}
              current={current.terms.postMoneyValuation}
              format={formatCurrency}
            />
          )}
          {changes.includes("equity") && (
            <DiffValue
              label="Investor Equity"
              prev={previous.terms.investorEquityPercent?.toFixed(2) ?? "—"}
              current={current.terms.investorEquityPercent?.toFixed(2) ?? "—"}
              format={(v) => `${v}%`}
            />
          )}
          {changes.includes("type") && (
            <DiffValue
              label="Equity Type"
              prev={previous.terms.equityType ?? "—"}
              current={current.terms.equityType ?? "—"}
            />
          )}
          {changes.includes("prorate") && (
            <DiffValue
              label="Pro-Rata Rights"
              prev={previous.terms.proRataRights ? "Yes" : "No"}
              current={current.terms.proRataRights ? "Yes" : "No"}
            />
          )}
        </div>
      </div>
    </DealCardBase>
  );
}
