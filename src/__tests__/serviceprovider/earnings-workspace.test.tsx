import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  AvailableBalanceHero, EarningsLoading, EscrowPanel,
} from '@/components/serviceprovider/EarningsWorkspace';
import { EarningsTrendChart } from '@/components/serviceprovider/charts/EarningsTrendChart';
import { PayoutsPanel } from '@/components/serviceprovider/earnings/PayoutsPanel';
import type { FinancialSummary } from '@/types/workroom';
import type { AnalyticsDashboard, AnalyticsTrendPoint } from '@/types/analytics';

vi.mock('recharts', () => {
  const Stub = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  const Line = ({ dataKey }: { dataKey?: string }) => <div data-testid="series" data-key={dataKey} />;
  return {
    ResponsiveContainer: Stub, LineChart: Stub, Line, XAxis: Stub,
    YAxis: Stub, CartesianGrid: Stub, Tooltip: Stub, Legend: Stub,
  };
});

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement('a', { href, ...props }, children),
}));

vi.mock('@/hooks/queries/workroom', () => ({
  useRequestPayout: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useFinancialStatement: () => ({ data: null, isError: false, isFetching: false, refetch: vi.fn() }),
  useEarnings: () => ({ data: null, isLoading: true, isError: false, refetch: vi.fn() }),
}));

const workspaceSource = readFileSync(
  resolve(process.cwd(), 'src/components/serviceprovider/EarningsWorkspace.tsx'),
  'utf8'
);
const payoutsSource = readFileSync(
  resolve(process.cwd(), 'src/components/serviceprovider/earnings/PayoutsPanel.tsx'),
  'utf8'
);
const activitySource = readFileSync(
  resolve(process.cwd(), 'src/components/serviceprovider/earnings/EarningsActivity.tsx'),
  'utf8'
);

const summary = (over: Partial<FinancialSummary> = {}): FinancialSummary => ({
  workInProgress: 4000, inReview: 1500, pending: 800, available: 2500,
  withdrawn: 9000, onHold: 300, protectedEscrow: 7200,
  grossEarnings: 12000, commissionPaid: 1440, netEarnings: 10560,
  currency: 'EUR', availableCurrencies: ['EUR'],
  transactions: [], payouts: [], invoices: [],
  settings: {
    payoutMethods: [], defaultPayoutMethodId: null,
    accountOnHold: false, minimumPayoutAmount: 50,
  },
  ...over,
} as FinancialSummary);

describe('available balance hero', () => {
  it('shows the balance with a payout call to action', () => {
    render(<AvailableBalanceHero amount={2500} currency="EUR" payoutHref="/dashboard/serviceprovider/earnings?tab=payouts&currency=EUR" />);

    expect(screen.getByText('Available balance')).toBeInTheDocument();
    expect(screen.getByText(/2,500/)).toBeInTheDocument();
  });

  /**
   * The card previously said "Eligible for a payout request" with no way to make one — the
   * form was a tab away. The link is the point of the hero treatment, not decoration.
   */
  it('links to the payouts tab, preserving the selected currency', () => {
    render(<AvailableBalanceHero amount={2500} currency="EUR" payoutHref="/dashboard/serviceprovider/earnings?tab=payouts&currency=EUR" />);

    expect(screen.getByRole('link', { name: /Request a payout/ }))
      .toHaveAttribute('href', '/dashboard/serviceprovider/earnings?tab=payouts&currency=EUR');
  });

  /** A real zero balance is a fact; the CTA stays so the page does not become a dead end. */
  it('renders a zero balance rather than suppressing the card', () => {
    render(<AvailableBalanceHero amount={0} currency="EUR" payoutHref="/x" />);

    expect(screen.getByText(/0/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Request a payout/ })).toBeInTheDocument();
  });
});

describe('escrow panel', () => {
  it('presents protected funds as the total with its stages nested inside', () => {
    render(<EscrowPanel data={summary()} currency="EUR" />);

    expect(screen.getByText('Held in escrow')).toBeInTheDocument();
    expect(screen.getByText(/7,200/)).toBeInTheDocument();
    expect(screen.getByText('Included in the amount above')).toBeInTheDocument();
    expect(screen.getByText('Work in progress')).toBeInTheDocument();
    expect(screen.getByText('In review')).toBeInTheDocument();
  });

  /**
   * The whole point of the reframe. Work in progress is a strict subset of protected funds,
   * so the old peer-card layout invited adding two figures that overlap completely.
   */
  it('states that the stages are parts of the total rather than additions to it', () => {
    render(<EscrowPanel data={summary()} currency="EUR" />);

    expect(screen.getByText(/not amounts to add to it/)).toBeInTheDocument();
  });

  /**
   * Protected funds was the ONLY place revision and dispute money appeared. The reframe must
   * not drop it — it stays visible in words, since no sound figure can be computed for it.
   */
  it('keeps the revision and dispute money visible in the new framing', () => {
    render(<EscrowPanel data={summary()} currency="EUR" />);

    expect(screen.getByText(/revision or dispute are also included in the total/)).toBeInTheDocument();
  });

  /** In review is not escrow-filtered upstream, so on-hold money lands elsewhere. */
  it('explains that on-hold escrow is counted under On hold instead', () => {
    render(<EscrowPanel data={summary()} currency="EUR" />);

    expect(screen.getByText(/placed on hold is counted under On hold instead/)).toBeInTheDocument();
  });

  /**
   * protectedEscrow - workInProgress - inReview can legitimately go negative, so no
   * remainder is derived. Every figure on this page stays server-recorded.
   */
  it('derives no remainder figure of its own', () => {
    const panel = workspaceSource.slice(workspaceSource.indexOf('export function EscrowPanel'));
    expect(panel).not.toMatch(/protectedEscrow\s*-\s*/);
    expect(panel).not.toMatch(/-\s*data\.workInProgress/);
  });
});

describe('earnings card grouping', () => {
  const grid = workspaceSource.slice(
    workspaceSource.indexOf('<AvailableBalanceHero'),
    workspaceSource.indexOf("{activeTab === 'activity'")
  );

  /**
   * On hold was in the SMALLER row while Work in progress and Pending release were in the
   * prominent one, inverting their urgency — On hold is the only one of the three a provider
   * can act on. Everything below the hero now carries equal weight.
   */
  it('no longer demotes On hold below the passive lifecycle figures', () => {
    expect(grid).not.toContain('CompactMetric');
    const onHold = grid.indexOf('label="On hold"');
    const withdrawn = grid.indexOf('label="Withdrawn"');
    expect(onHold).toBeGreaterThan(-1);
    expect(onHold).toBeLessThan(withdrawn);
  });

  /** Work in progress and In review moved inside the escrow total they are part of. */
  it('keeps the escrow stages inside the total rather than beside it', () => {
    expect(grid).not.toContain('label="Work in progress"');
    expect(grid).not.toContain('label="In review"');
    expect(grid).toContain('<EscrowPanel');
  });
});

describe('consolidated metric box patterns', () => {
  /**
   * Four near-identical "labelled money value" boxes existed: SpMetricCard, CompactMetric,
   * StatementValue and AmountSummary. Reduced to two — the hero, and the shared SpMetricCard.
   */
  it('leaves only the hero and the shared card', () => {
    for (const source of [workspaceSource, payoutsSource, activitySource]) {
      expect(source).not.toContain('function CompactMetric');
      expect(source).not.toContain('function StatementValue');
      expect(source).not.toContain('function AmountSummary');
    }
  });

  it('renders the statement values through the shared card', () => {
    expect(activitySource).not.toContain('<StatementValue');
    expect(activitySource).toContain('label="Closing balance"');
    expect(activitySource).toContain('<SpMetricCard');
  });
});

describe('payouts panel', () => {
  it('no longer repeats the available balance mid-form', () => {
    render(<PayoutsPanel data={summary()} currency="EUR" />);

    expect(screen.queryByText('Available balance')).not.toBeInTheDocument();
  });

  it('keeps the minimum payout on the shared card', () => {
    render(<PayoutsPanel data={summary()} currency="EUR" />);

    expect(screen.getByText(/Minimum payout/)).toBeInTheDocument();
  });

  /**
   * The confirm dialog's copy is functionally necessary — it states what you are about to
   * spend against at the moment you commit — so only the middle copy was removed.
   */
  it('still states the available balance in the confirmation dialog', () => {
    expect(payoutsSource).toContain('label="Available before request"');
  });
});

describe('earnings trend chart on this page', () => {
  const point = (over: Partial<AnalyticsTrendPoint> = {}): AnalyticsTrendPoint =>
    ({ periodStart: '2026-05-04T00:00:00Z', label: '4 May', netEarnings: 0, averageRating: null, ...over });
  const dashboard = (trend: AnalyticsTrendPoint[]) =>
    ({ trend, trendGranularity: 'week', currency: 'EUR' }) as AnalyticsDashboard;

  it('charts released earnings when history exists', () => {
    render(<EarningsTrendChart data={dashboard([point({ netEarnings: 400 })])} title="Earnings trend" description="Net earnings released over the last 90 days, in EUR." />);

    expect(screen.getByText('Earnings trend')).toBeInTheDocument();
    expect(screen.getByTestId('series')).toHaveAttribute('data-key', 'netEarnings');
  });

  /** No history is an honest empty state, never a flat zero line. */
  it('states there are no earnings rather than drawing an empty chart', () => {
    render(<EarningsTrendChart data={dashboard([point(), point({ label: '11 May' })])} />);

    expect(screen.getByText('No earnings in this period')).toBeInTheDocument();
    expect(screen.queryByTestId('series')).not.toBeInTheDocument();
  });

  it('handles a provider with no trend buckets at all', () => {
    render(<EarningsTrendChart data={dashboard([])} />);

    expect(screen.getByText('No earnings in this period')).toBeInTheDocument();
  });

  /**
   * One implementation, two surfaces. Bucketing the ledger loaded on this page would have
   * meant reproducing the refunded-milestone exclusion in the browser, on a page that also
   * prints the gross and net totals such a chart could then contradict.
   */
  it('reuses the shared chart and the server series rather than bucketing locally', () => {
    expect(workspaceSource).toContain("from '@/components/serviceprovider/charts/EarningsTrendChart'");
    expect(workspaceSource).not.toContain('<LineChart');
    expect(workspaceSource).not.toMatch(/data\.transactions\s*\.\s*reduce/);
  });

  /** The page has a currency selector but no date picker, so the range is fixed. */
  it('requests a fixed 90-day range scoped to the selected currency', () => {
    expect(workspaceSource).toContain("useProviderAnalytics({ range: 'Last90Days', currency })");
  });
});

describe('visual token discipline', () => {
  const settingsSource = readFileSync(
    resolve(process.cwd(), 'src/components/serviceprovider/earnings/FinancialSettingsPanel.tsx'),
    'utf8'
  );

  /** The redesign migrated this surface completely; the "deliberate hex" note is retired. */
  it.each([
    ['EarningsWorkspace', () => workspaceSource],
    ['EarningsActivity', () => activitySource],
    ['PayoutsPanel', () => payoutsSource],
    ['FinancialSettingsPanel', () => settingsSource],
  ])('%s carries no hex colour literals', (_name, read) => {
    expect(read()).not.toMatch(/#[0-9A-Fa-f]{6}/);
  });

  /**
   * --success-text is 2.80:1 on --success-light and fails even the 3:1 UI threshold, so
   * green TEXT uses --success-strong (4.78:1). A future "consistency" sweep swapping one
   * for the other would be an accessibility regression, not a cleanup.
   */
  it('uses success-strong for green text rather than the failing success-text', () => {
    expect(workspaceSource).toContain('text-success-strong');
    expect(workspaceSource).not.toContain('text-success-text');
    expect(activitySource).not.toContain('text-success-text');
  });

  /** Amounts align on a shared decimal column, the usual financial-table convention. */
  it('right-aligns ledger amounts on tabular figures', () => {
    expect(activitySource).toContain('text-right text-sm font-semibold tabular-nums');
    expect(payoutsSource).toContain('text-right font-semibold tabular-nums');
  });
});

describe('loading skeleton', () => {
  /**
   * The old skeleton rendered four card blocks and nothing for the second row, so a row
   * appeared unaccounted-for on every load. It now mirrors the real layout block for block.
   */
  it('mirrors the real layout rather than the old four-card row', () => {
    const { container } = render(<EarningsLoading />);
    const skeletons = container.querySelectorAll('[data-slot="skeleton"], .animate-pulse');

    expect(skeletons.length).toBeGreaterThanOrEqual(8);
    expect(container.querySelector('.sm\\:grid-cols-3')).not.toBeNull();
    expect(container.querySelector('.xl\\:grid-cols-4')).toBeNull();
  });

  it('matches the live card row count', () => {
    const { container } = render(<EarningsLoading />);
    const row = container.querySelector('.sm\\:grid-cols-3');

    expect(row?.children).toHaveLength(3);
  });
});
