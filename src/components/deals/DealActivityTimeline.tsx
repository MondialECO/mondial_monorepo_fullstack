import { ACTIVITY_LABEL, formatRelativeTime } from "@/lib/deal-utils";
import type { DealActivityEntry } from "@/types/deals";

interface DealActivityTimelineProps {
  entries: DealActivityEntry[];
  isLoading?: boolean;
}

export default function DealActivityTimeline({ entries, isLoading }: DealActivityTimelineProps) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading activity…</p>;
  }
  if (!entries?.length) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  }

  return (
    <ol className="space-y-2.5">
      {entries.map((e) => (
        <li key={e.id} className="flex items-start gap-2 text-xs">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" aria-hidden />
          <div className="min-w-0">
            <span className="font-medium text-foreground">
              {ACTIVITY_LABEL[e.eventType] ?? e.eventType}
            </span>
            {e.notes ? <span className="text-muted-foreground"> — {e.notes}</span> : null}
            <span className="ml-1 text-muted-foreground">· {formatRelativeTime(e.occurredAt)}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
