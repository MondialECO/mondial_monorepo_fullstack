"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import DealStatusBadge from "./DealStatusBadge";
import { formatCurrency, isClosed, latestRevision, shortId } from "@/lib/deal-utils";
import type { DealRole, DealStatus } from "@/types/deals";

interface DealInboxItemProps {
  deal: DealStatus;
  myRole: DealRole | null;
  active: boolean;
  onSelect: (id: string) => void;
}

function initials(label: string): string {
  return label.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

export default function DealInboxItem({ deal, myRole, active, onSelect }: DealInboxItemProps) {
  const counterparty =
    myRole === "founder"
      ? deal.investors[0]?.investorName?.trim() || "Investor"
      : `Founder · ${shortId(deal.dealId)}`;

  const latest = latestRevision(deal);
  const myTurn = !!myRole && deal.currentTurn === myRole;

  return (
    <button
      type="button"
      onClick={() => onSelect(deal.dealId)}
      aria-current={active}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors",
        active ? "bg-accent" : "hover:bg-muted/60"
      )}
    >
      <Avatar className="h-10 w-10 shrink-0 border border-border">
        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
          {initials(counterparty)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-foreground">{counterparty}</span>
          {myTurn ? <Badge variant="warning" className="shrink-0">Your move</Badge> : null}
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span className="truncate text-xs text-muted-foreground tabular-nums">
            {formatCurrency(deal.termSheet.totalRaiseAmount)} ·{" "}
            {deal.termSheet.investorEquityPercent
              ? `${deal.termSheet.investorEquityPercent.toFixed(1)}%`
              : "—"}
          </span>
          {isClosed(deal) ? (
            <Badge variant="success">Completed</Badge>
          ) : latest ? (
            <DealStatusBadge status={latest.status} />
          ) : null}
        </div>
      </div>
    </button>
  );
}
