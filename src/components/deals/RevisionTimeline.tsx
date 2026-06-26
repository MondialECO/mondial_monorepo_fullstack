import DealStatusBadge from "./DealStatusBadge";
import { Separator } from "@/components/ui/separator";
import {
  counterpartyLabel,
  formatCurrency,
  formatRelativeTime,
} from "@/lib/deal-utils";
import type { DealRole, TermSheetRevisionView } from "@/types/deals";

interface RevisionTimelineProps {
  revisions: TermSheetRevisionView[];
}

function proposerLabel(role: string): string {
  if (role === "founder") return "Founder";
  if (role === "investor") return "Investor";
  return counterpartyLabel(role as DealRole);
}

export default function RevisionTimeline({ revisions }: RevisionTimelineProps) {
  if (!revisions?.length) {
    return <p className="text-sm text-muted-foreground">No offers yet.</p>;
  }

  const ordered = [...revisions].sort((a, b) => b.revisionNumber - a.revisionNumber);

  return (
    <ol className="space-y-3">
      {ordered.map((r, idx) => (
        <li key={r.revisionNumber} className="relative pl-5">
          <span
            className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-primary"
            aria-hidden
          />
          {idx < ordered.length - 1 ? (
            <span className="absolute left-[3.5px] top-4 h-full w-px bg-border" aria-hidden />
          ) : null}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-semibold text-foreground">
              Revision {r.revisionNumber}
            </span>
            <DealStatusBadge status={r.status} />
            <span className="text-xs text-muted-foreground">
              by {proposerLabel(r.proposedByRole)} · {formatRelativeTime(r.createdAt)}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground tabular-nums">
            <span>Raise {formatCurrency(r.terms.totalRaiseAmount)}</span>
            <span>Post-money {formatCurrency(r.terms.postMoneyValuation)}</span>
            <span>
              Equity{" "}
              {r.terms.investorEquityPercent ? `${r.terms.investorEquityPercent.toFixed(2)}%` : "—"}
            </span>
          </div>
          {r.note ? (
            <p className="mt-1 text-xs text-foreground/80 italic">“{r.note}”</p>
          ) : null}
          {idx < ordered.length - 1 ? <Separator className="mt-3" /> : null}
        </li>
      ))}
    </ol>
  );
}
