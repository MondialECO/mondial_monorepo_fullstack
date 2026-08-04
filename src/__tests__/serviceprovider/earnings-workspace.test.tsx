import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  AvailableBalanceHero, EarningsLoading,
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

describe('earnings card grouping', () => {
  const sharedArea = workspaceSource.slice(
    workspaceSource.indexOf('<SpTabBar'),
    workspaceSource.indexOf("{activeTab === 'activity'")
  );

  /**
   * Only the hero survives above the tab content. The lifecycle cards and the chart used to
   * render on every tab, so Payouts and Financial Settings carried six figures and a graph
   * that had nothing to do with what the user had navigated to.
   */
  it('renders nothing but the hero outside the tab content', () => {
    expect(sharedArea).toContain('<AvailableBalanceHero');
    expect(sharedArea).not.toContain('<SpMetricCard');
    expect(sharedArea).not.toContain('<EarningsTrendChart');
  });

  it('puts all six overview figures on the Overview tab', () => {
    for (const label of [
      'Gross earnings', 'Fixed platform commission', 'Net earnings',
      'Pending release', 'On hold', 'Withdrawn',
    ]) {
      expect(activitySource).toContain(`label="${label}"`);
    }
  });

  /** On hold must not sit below the passive figures it is more urgent than. */
  it('keeps On hold among the six rather than trailing them', () => {
    expect(activitySource.indexOf('label="On hold"'))
      .toBeLessThan(activitySource.indexOf('label="Withdrawn"'));
  });

  /**
   * The Held-in-escrow section was removed outright. Work in progress, In review and the
   * protected-escrow total appear nowhere on this page in any form — asserted so a later
   * change cannot reintroduce them as peer cards, which is the double-count the escrow
   * reframe existed to prevent.
   */
  it('no longer surfaces the escrow stages anywhere on the page', () => {
    for (const source of [workspaceSource, activitySource, payoutsSource]) {
      expect(source).not.toContain('workInProgress');
      expect(source).not.toContain('inReview');
      expect(source).not.toContain('protectedEscrow');
    }
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
    expect(activitySource).toContain("from '@/components/serviceprovider/charts/EarningsTrendChart'");
    expect(activitySource).not.toContain('<LineChart');
    expect(activitySource).not.toMatch(/data\.transactions\s*\.\s*reduce/);
  });

  /** The page has a currency selector but no date picker, so the range is fixed. */
  it('requests a fixed 90-day range scoped to the selected currency', () => {
    expect(activitySource).toContain("useProviderAnalytics({ range: 'Last90Days', currency })");
  });

  /**
   * The query lives with the chart, so Payouts and Financial Settings no longer pay for a
   * five-section dashboard computation they never render.
   */
  it('fetches the dashboard only for the tab that draws the chart', () => {
    expect(workspaceSource).not.toContain('useProviderAnalytics');
  });

  /** The chart leads the tab — it is the picture the six figures beneath it describe. */
  it('places the chart above the six figures', () => {
    expect(activitySource.indexOf('<EarningsTrendChart'))
      .toBeLessThan(activitySource.indexOf('label="Gross earnings"'));
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
  it('stands in for what actually renders above the tab content', () => {
    const { container } = render(<EarningsLoading />);
    const skeletons = container.querySelectorAll('[data-slot="skeleton"], .animate-pulse');

    // Header pair, tab bar, hero, tab content. No card row: the cards moved onto the
    // Overview tab, which brings its own loading state.
    expect(skeletons.length).toBeGreaterThanOrEqual(5);
    expect(container.querySelector('.sm\\:grid-cols-3')).toBeNull();
    expect(container.querySelector('.xl\\:grid-cols-4')).toBeNull();
  });

  /** The skeleton must not promise a row the loaded page does not render. */
  it('does not reserve space for cards that no longer sit above the tabs', () => {
    const { container } = render(<EarningsLoading />);
    const sharedArea = workspaceSource.slice(
      workspaceSource.indexOf('<SpTabBar'),
      workspaceSource.indexOf("{activeTab === 'activity'")
    );

    expect(sharedArea).not.toContain('<SpMetricCard');
    expect(container.querySelectorAll('.grid')).toHaveLength(0);
  });
});
