import { Phase4Context } from '../Phase4TabbedView';
import { deriveCapTable, fmtNum, TYPE_CHART_VAR } from '../phase4-utils';

interface Event {
  color: string;
  title: string;
  detail: string;
  at: string;
}

function timeLabel(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function Phase4HistoryTab({ ctx }: { ctx: Phase4Context }) {
  const d = deriveCapTable(ctx.snapshot);
  const recordedAt = ctx.snapshot?.recordedAt ?? new Date().toISOString();

  const events: Event[] = [];

  // Ownership history rounds (most recent first).
  [...ctx.history]
    .sort((a, b) => (b.recordedAt > a.recordedAt ? 1 : -1))
    .forEach((h) => {
      events.push({
        color: TYPE_CHART_VAR.investor,
        title: `${h.roundName}`,
        detail: `Founders ${h.founderOwnershipBefore.toFixed(1)}% → ${h.founderOwnershipAfter.toFixed(1)}% · valuation €${Math.round(h.valuation).toLocaleString()}`,
        at: timeLabel(h.recordedAt),
      });
    });

  const esopShares = Math.round(((ctx.snapshot?.totalShares ?? 0) * (ctx.snapshot?.esopPoolPercent ?? 0)) / 100);
  if ((ctx.snapshot?.esopPoolPercent ?? 0) > 0) {
    events.push({
      color: TYPE_CHART_VAR.founder,
      title: 'ESOP pool created',
      detail: `${fmtNum(esopShares)} shares (${ctx.snapshot?.esopPoolPercent}%) reserved for employees`,
      at: timeLabel(recordedAt),
    });
  }

  const investors = d.holders.filter((h) => h.type === 'investor');
  if (investors.length > 0) {
    events.push({
      color: TYPE_CHART_VAR.investor,
      title: 'Existing investors added',
      detail: investors.map((i) => i.name).join(', '),
      at: timeLabel(recordedAt),
    });
  }

  const founders = d.holders.filter((h) => h.type === 'founder');
  if (founders.length > 0) {
    events.push({
      color: TYPE_CHART_VAR.advisor,
      title: 'Founder equity setup',
      detail: founders.map((f) => `${f.name} ${f.ownershipPct.toFixed(0)}%`).join(' · '),
      at: timeLabel(recordedAt),
    });
  }

  events.push({
    color: 'var(--muted-foreground)',
    title: 'Phase 4 started',
    detail: 'Cap table initialised',
    at: timeLabel(recordedAt),
  });

  if (!ctx.snapshot) {
    return (
      <div className="bg-card border border-border rounded-2xl p-10 text-center">
        <p className="text-sm text-muted-foreground">No history yet — submit your cap table to start the timeline.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-bold text-foreground">Cap Table History</h3>
      </div>
      <ul>
        {events.map((e, i) => (
          <li
            key={i}
            className="flex items-center gap-3 px-5 py-3.5 border-b border-border last:border-0 hover:bg-muted/30"
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.color }} />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-foreground">{e.title}</span>
              <span className="text-sm text-muted-foreground"> — {e.detail}</span>
            </div>
            <span className="text-xs text-muted-foreground flex-shrink-0">{e.at}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
