import * as React from 'react';
import { cn } from '@/lib/utils';
import { Chip, type Tone } from '@/components/entrepreneur/phase3/FinancialWidgets';

/**
 * Phase 9 pipeline board — kanban-style columns grouped by DealStatus (no drag/drop).
 * Pure presentational; real deals in, honest empty columns. Theme tokens only.
 */

export interface PipelineDeal {
  dealId: string;
  investorName: string;
  status: string;
  committedAmount: number;
  termSheetStatus?: string;
  progressPercent: number;
}

const STAGES: Array<{ key: string; label: string; match: string[] }> = [
  { key: 'interested', label: 'Interested', match: ['initiated', 'contacted', 'interested'] },
  { key: 'discussion', label: 'In discussion', match: ['meeting_scheduled', 'negotiating'] },
  { key: 'dd', label: 'Due diligence', match: ['due_diligence'] },
  { key: 'term_sheet', label: 'Term sheet', match: ['term_sheet', 'agreement_sent'] },
  { key: 'closed', label: 'Closed', match: ['signed', 'completed'] },
  { key: 'inactive', label: 'Inactive', match: ['rejected', 'withdrawn'] },
];

const eur = (n: number) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);

export function statusTone(status: string): Tone {
  const s = (status || '').toLowerCase();
  if (s === 'signed' || s === 'completed') return 'success';
  if (s === 'term_sheet' || s === 'agreement_sent') return 'primary';
  if (s === 'rejected' || s === 'withdrawn') return 'destructive';
  if (s === 'meeting_scheduled' || s === 'negotiating' || s === 'due_diligence') return 'warning';
  return 'muted';
}

const humanize = (s: string) => (s || '').replace(/_/g, ' ');

export function PipelineBoard({
  deals,
  selectedId,
  onSelect,
}: {
  deals: PipelineDeal[];
  selectedId?: string | null;
  onSelect?: (dealId: string) => void;
}) {
  if (!deals.length) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-4 text-center">
        <span className="text-sm italic text-muted-foreground">No deals in the pipeline yet — create one from a matched investor.</span>
      </div>
    );
  }
  const columns = STAGES.map((st) => ({
    ...st,
    items: deals.filter((d) => st.match.includes((d.status || '').toLowerCase())),
  })).filter((c) => c.items.length > 0);

  return (
    <div className="flex gap-4 overflow-x-auto pb-2" role="list" aria-label="Deal pipeline by stage">
      {columns.map((col) => (
        <div key={col.key} role="listitem" className="w-64 shrink-0">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">{col.label}</span>
            <Chip tone="muted">{col.items.length}</Chip>
          </div>
          <div className="space-y-2">
            {col.items.map((d) => {
              const selected = d.dealId === selectedId;
              return (
                <button
                  key={d.dealId}
                  type="button"
                  onClick={() => onSelect?.(d.dealId)}
                  aria-pressed={selected}
                  className={cn(
                    'w-full rounded-xl border bg-card p-3 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selected ? 'border-primary' : 'border-border',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-foreground">{d.investorName}</span>
                    <Chip tone={statusTone(d.status)}>{humanize(d.status)}</Chip>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Committed <span className="font-medium text-foreground">{d.committedAmount > 0 ? eur(d.committedAmount) : '—'}</span>
                    {d.termSheetStatus ? <> · TS {humanize(d.termSheetStatus)}</> : null}
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={`${d.investorName} progress`} aria-valuenow={Math.round(d.progressPercent || 0)} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, d.progressPercent || 0))}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default PipelineBoard;
