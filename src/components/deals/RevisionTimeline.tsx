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
    <ol className="space-y-4">
      {ordered.map((r, idx) => {
        const isLatest = idx === 0;
        return (
          <li key={r.revisionNumber} className="relative pl-5">
            <span
              className={`absolute left-0 top-1.5 h-2 w-2 rounded-full ${isLatest ? "bg-primary" : "bg-muted-foreground/40"}`}
              aria-hidden
            />
            {idx < ordered.length - 1 ? (
              <span className="absolute left-[3.5px] top-4 h-full w-px bg-border" aria-hidden />
            ) : null}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-sm font-semibold text-foreground">
                Revision {r.revisionNumber}
              </span>
              {isLatest && (
                <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  Current
                </span>
              )}
              <DealStatusBadge status={r.status} />
              <span className="text-xs text-muted-foreground">
                Proposed by {proposerLabel(r.proposedByRole)} · {formatRelativeTime(r.createdAt)}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground tabular-nums">
              <span>
                Investment: <strong className="font-semibold text-foreground">{formatCurrency(r.terms.totalRaiseAmount)}</strong>
              </span>
              <span>
                Post-money: <strong className="font-semibold text-foreground">{formatCurrency(r.terms.postMoneyValuation)}</strong>
              </span>
              <span>
                Equity:{" "}
                <strong className="font-semibold text-foreground">
                  {r.terms.investorEquityPercent ? `${r.terms.investorEquityPercent.toFixed(2)}%` : "—"}
                </strong>
              </span>
              {r.terms.equityType ? (
                <span className="capitalize">
                  Type: <strong className="font-semibold text-foreground">{r.terms.equityType}</strong>
                </span>
              ) : null}
            </div>
            {r.note ? (
              <p className="mt-1.5 text-xs text-foreground/90 italic bg-muted/30 rounded-md p-2 border border-border/50">
                “{r.note}”
              </p>
            ) : null}
            {idx < ordered.length - 1 ? <Separator className="mt-4" /> : null}
          </li>
        );
      })}
    </ol>
  );
}

