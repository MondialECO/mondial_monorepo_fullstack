import * as React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { TimelineEventResponse } from '@/lib/api-entrepreneur';

/**
 * Matchmaking Process timeline — round-level events (Phase 5 funding ask, Phase 8
 * AI matches, …). Pure presentational: renders from the `events` prop only, no
 * API calls and no state. Matches the Figma "Matchmaking Process" vertical
 * timeline panel.
 */

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

function dateColorClass(color: string, status: string): string {
  if (color === 'green') return 'text-[var(--p9-timeline-green)]';
  if (color === 'blue') return 'text-primary';
  if (color === 'amber') return 'text-[var(--p9-timeline-amber)]';
  if (status === 'pending') return 'text-[var(--p9-timeline-text-default)]';
  return 'text-[var(--p9-timeline-text-default)]';
}

function Bullet({ color, status }: { color: string; status: string }) {
  if (color === 'green' && status === 'completed') {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white" aria-hidden>
        <CheckCircle2 size={24} className="text-[var(--p9-timeline-green)]" />
      </span>
    );
  }
  if (color === 'blue' && status === 'active') {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-[12px] bg-[var(--p9-timeline-blue-light)]" aria-hidden>
        <span className="h-3 w-3 rounded-full bg-primary" />
      </span>
    );
  }
  if (color === 'amber') {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-[12px] bg-[var(--dr-bg-yellow)]" aria-hidden>
        <span className="h-3 w-3 rounded-full bg-[var(--p9-timeline-amber)]" />
      </span>
    );
  }
  // gray / pending
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-[12px] bg-[var(--p9-bullet-gray)]" aria-hidden>
      <span className="h-3 w-3 rounded-full bg-[var(--p9-bullet-gray-dot)]" />
    </span>
  );
}

export function MatchmakingTimeline({
  events,
  isLoading = false
}: {
  events: TimelineEventResponse[]
  isLoading?: boolean
}) {
  // Completed portion drives the blue overlay height on the connector line.
  const completedCount = events.filter((e) => e.status === 'completed').length;
  const completedPct =
    events.length > 1 ? (completedCount / events.length) * 100 : completedCount > 0 ? 100 : 0;

  return (
    <div className="flex flex-col gap-6 rounded-[16px] border border-border bg-[var(--p9-card-bg)] p-6 shadow-sm">
      <h3 className="text-[20px] font-medium text-[var(--p9-timeline-text-dark)]">Matchmaking Process timeline</h3>

      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-4 bg-muted rounded w-2/3" />
        </div>
      ) : events.length === 0 ? (
        <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20">
          <span className="text-sm italic text-muted-foreground">No matchmaking events yet.</span>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical connector behind the bullet dots */}
          <span
            className="absolute left-[33.5px] top-0 bottom-0 w-[3px] bg-[var(--p9-connector-bg)]"
            aria-hidden
          >
            <span
              className="absolute left-0 top-0 w-full bg-primary opacity-40"
              style={{ height: `${completedPct}%` }}
            />
          </span>

          <ol className="relative flex flex-col gap-6">
            {events.map((ev) => {
              const dimmed = ev.color === 'gray' || ev.status === 'pending';
              return (
                <li
                  key={ev.eventId}
                  className={`flex gap-4 ${dimmed ? 'opacity-50' : ''}`}
                >
                  <Bullet color={ev.color} status={ev.status} />
                  <div className="flex flex-col">
                    <span className={`text-[13px] font-medium ${dateColorClass(ev.color, ev.status)}`}>
                      {formatEventDate(ev.eventDate)}
                    </span>
                    <span className="text-[14px] font-normal text-secondary">{ev.subtitle}</span>
                    <span className="text-[18px] font-medium text-foreground">{ev.title}</span>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}

export default MatchmakingTimeline;
