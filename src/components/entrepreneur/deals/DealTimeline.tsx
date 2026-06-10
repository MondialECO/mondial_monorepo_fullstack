import * as React from 'react';
import { Chip } from '@/components/entrepreneur/phase3/FinancialWidgets';
import { statusTone } from './PipelineBoard';

/**
 * Phase 9 matchmaking / deal activity timeline — built from DealActivityLogResponse.
 * Pure presentational; real events only; honest empty state.
 */

export interface TimelineItem {
  id: string;
  eventType: string;
  fromStatus?: string;
  toStatus?: string;
  occurredAt: string;
  notes?: string;
}

const humanize = (s: string) => (s || '').replace(/_/g, ' ');

export function DealTimeline({ items }: { items: TimelineItem[] }) {
  if (!items.length) {
    return (
      <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20">
        <span className="text-sm italic text-muted-foreground">No activity recorded yet.</span>
      </div>
    );
  }
  return (
    <ol className="space-y-0">
      {items.map((it, i) => (
        <li key={it.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-hidden />
            {i < items.length - 1 && <span className="my-1 w-px flex-1 bg-border" aria-hidden />}
          </div>
          <div className="pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold capitalize text-foreground">{humanize(it.eventType)}</p>
              {it.toStatus && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  {it.fromStatus ? <><span className="capitalize">{humanize(it.fromStatus)}</span> <span aria-hidden>→</span> </> : null}
                  <Chip tone={statusTone(it.toStatus)}>{humanize(it.toStatus)}</Chip>
                </span>
              )}
            </div>
            {it.notes && <p className="mt-0.5 text-sm text-muted-foreground">{it.notes}</p>}
            <p className="mt-0.5 text-xs text-muted-foreground">{it.occurredAt ? new Date(it.occurredAt).toLocaleString() : ''}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default DealTimeline;
