import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  BalancesFooter, CategoryBreakdown, ClientSourceBreakdown,
} from '@/components/serviceprovider/AnalyticsWorkspace';
import { EarningsTrendChart } from '@/components/serviceprovider/charts/EarningsTrendChart';
import type {
  AnalyticsBreakdown, AnalyticsDashboard, AnalyticsMetric, AnalyticsTrendPoint,
  ClientSourceAnalytics, RevenueAnalytics,
} from '@/types/analytics';

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement('a', { href, ...props }, children),
}));

// Recharts is stubbed for the same reason as analytics-overview.test.tsx: jsdom reports a
// 0x0 container, so ResponsiveContainer renders nothing. Line is stubbed to expose its
// dataKey, which is what the earnings-only assertion actually needs to see.
vi.mock('recharts', () => {
  const Stub = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  const Line = ({ dataKey, name }: { dataKey?: string; name?: string }) =>
    <div data-testid="series" data-key={dataKey}>{name}</div>;
  return {
    ResponsiveContainer: Stub, LineChart: Stub, Line, XAxis: Stub,
    YAxis: Stub, CartesianGrid: Stub, Tooltip: Stub, Legend: Stub,
  };
});

const source = readFileSync(
  resolve(process.cwd(), 'src/components/serviceprovider/AnalyticsWorkspace.tsx'),
  'utf8'
);

const earningsView = source.slice(
  source.indexOf('function EarningsView'),
  source.indexOf('function ClientsView')
);

const metric = (over: Partial<AnalyticsMetric> = {}): AnalyticsMetric => ({
  state: 'available', value: 1000, previousValue: null, changePercentage: null,
  unit: 'currency', reason: null, ...over,
});

const split = (over: Partial<ClientSourceAnalytics> = {}): ClientSourceAnalytics => ({
  ecosystemMatch: metric({ value: 60, unit: 'percent' }),
  marketplaceSearch: metric({ value: 40, unit: 'percent' }),
  ecosystemNet: 600, marketplaceNet: 400, unattributedNet: 0,
  ...over,
});

const row = (over: Partial<AnalyticsBreakdown> = {}): AnalyticsBreakdown =>
  ({ key: 'dev', label: 'Development', gross: 1200, commission: 200, net: 1000, count: 3, ...over });

const point = (over: Partial<AnalyticsTrendPoint> = {}): AnalyticsTrendPoint =>
  ({ periodStart: '2026-07-06T00:00:00Z', label: '6 Jul', netEarnings: 0, averageRating: null, ...over });

const dashboard = (trend: AnalyticsTrendPoint[], granularity = 'week') =>
  ({ trend, trendGranularity: granularity, currency: 'EUR' }) as AnalyticsDashboard;

const revenue = (over: Partial<RevenueAnalytics> = {}) =>
  ({ protectedEscrow: metric({ value: 2500 }), availableBalance: metric({ value: 800 }), ...over }) as RevenueAnalytics;

const barWidth = (container: HTMLElement, index: number) =>
  (container.querySelectorAll('li > div > div')[index] as HTMLElement | undefined)?.style.width;

describe('earnings trend chart', () => {
  /**
   * The rating series belongs to Overview. This tab is only about money, and a second axis
   * on a chart headed "earnings" reads as a claimed relationship that was never made.
   */
  it('charts earnings only, without the Overview rating series', () => {
    render(<EarningsTrendChart data={dashboard([point({ netEarnings: 250 })])} />);

    const series = screen.getAllByTestId('series');
    expect(series).toHaveLength(1);
    expect(series[0]).toHaveAttribute('data-key', 'netEarnings');
  });

  /** The server picks the bucket width; the heading reports it rather than assuming weeks. */
  it.each([
    ['day', 'Daily earnings trend'],
    ['week', 'Weekly earnings trend'],
    ['month', 'Monthly earnings trend'],
  ])('labels %s granularity as "%s"', (granularity, expected) => {
    render(<EarningsTrendChart data={dashboard([point({ netEarnings: 100 })], granularity)} />);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it('explains an empty period rather than drawing an empty chart', () => {
    render(<EarningsTrendChart data={dashboard([point(), point({ label: '13 Jul' })])} />);

    expect(screen.getByText('No earnings in this period')).toBeInTheDocument();
  });

  /**
   * Ratings alone drew the Overview chart. Here they are not plotted, so a period with
   * reviews but no money is still empty — otherwise the chart would render a flat zero line.
   */
  it('stays empty when only ratings exist, since ratings are not plotted here', () => {
    render(<EarningsTrendChart data={dashboard([point({ averageRating: 4.5 })])} />);

    expect(screen.getByText('No earnings in this period')).toBeInTheDocument();
  });
});

describe('client source breakdown', () => {
  it('renders both channels with their share and amount', () => {
    render(<ClientSourceBreakdown source={split()} currency="EUR" />);

    expect(screen.getByText('Ecosystem Match')).toBeInTheDocument();
    expect(screen.getByText('Marketplace Search')).toBeInTheDocument();
    expect(screen.getByText(/60%/)).toBeInTheDocument();
    expect(screen.getByText(/40%/)).toBeInTheDocument();
  });

  it('draws each bar to its own percentage of the split', () => {
    const { container } = render(<ClientSourceBreakdown source={split()} currency="EUR" />);

    expect(barWidth(container, 0)).toBe('60%');
    expect(barWidth(container, 1)).toBe('40%');
  });

  /**
   * The state this section most needs to get right. A 0%-wide bar still draws its track,
   * which reads as a measured zero rather than an absent measurement — so no bars at all.
   */
  it('explains an unavailable split instead of drawing two empty bars', () => {
    const { container } = render(<ClientSourceBreakdown source={split({
      ecosystemMatch: metric({
        state: 'notEnoughActivity', value: null, unit: 'percent',
        reason: 'No revenue was released in this period, so there is no source split to calculate.',
      }),
      marketplaceSearch: metric({ state: 'notEnoughActivity', value: null, unit: 'percent' }),
      ecosystemNet: 0, marketplaceNet: 0,
    })} currency="EUR" />);

    expect(screen.getByText('Not enough activity')).toBeInTheDocument();
    expect(screen.getByText(/no source split to calculate/)).toBeInTheDocument();
    expect(container.querySelectorAll('li')).toHaveLength(0);
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });

  /** A large untraceable remainder must stay visible, not silently skew the split. */
  it('discloses revenue that could not be attributed to either channel', () => {
    render(<ClientSourceBreakdown source={split({ unattributedNet: 700 })} currency="EUR" />);

    expect(screen.getByText(/could not be traced back to a proposal/)).toBeInTheDocument();
  });

  it('says nothing about attribution when everything was attributed', () => {
    render(<ClientSourceBreakdown source={split()} currency="EUR" />);

    expect(screen.queryByText(/could not be traced/)).not.toBeInTheDocument();
  });
});

describe('earnings by category', () => {
  it('draws each bar relative to the highest earner, not to the total', () => {
    const { container } = render(<CategoryBreakdown
      rows={[row({ net: 1000 }), row({ key: 'design', label: 'Design', net: 250 })]}
      currency="EUR"
    />);

    expect(barWidth(container, 0)).toBe('100%');
    expect(barWidth(container, 1)).toBe('25%');
  });

  it('explains an empty period rather than rendering an empty list', () => {
    render(<CategoryBreakdown rows={[]} currency="EUR" />);

    expect(screen.getByText('No released revenue exists in this period.')).toBeInTheDocument();
  });
});

describe('balances footer', () => {
  it('shows both live balances and links to payout settings', () => {
    render(<BalancesFooter revenue={revenue()} />);

    expect(screen.getByText('In escrow')).toBeInTheDocument();
    expect(screen.getByText('Available to withdraw')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go to Payout Settings/ }))
      .toHaveAttribute('href', '/dashboard/serviceprovider/earnings?tab=settings');
  });

  /**
   * revenue.net is already the Total Earnings headline, so a "Released" tile here would
   * restate that exact number lower down the page under a new name. availableBalance
   * answers something the headline does not.
   */
  it('does not restate the headline total under a second label', () => {
    expect(earningsView).not.toContain('label="Released"');
    expect(earningsView).toContain('revenue.availableBalance');
  });
});

describe('earnings tab composition', () => {
  /** Replaced by the more specific payout-settings link. */
  it('no longer offers the generic Earnings & Payouts link', () => {
    expect(earningsView).not.toContain('Open Earnings & Payouts');
    expect(earningsView).not.toContain('tab=activity');
  });

  it('no longer renders the By service, By month or By client breakdowns', () => {
    expect(earningsView).not.toContain('byService');
    expect(earningsView).not.toContain('byMonth');
    expect(earningsView).not.toContain('byClient');
  });

  /** The Breakdown component had no other consumer once these four usages went. */
  it('drops the Breakdown component rather than leaving it dead', () => {
    expect(source).not.toContain('function Breakdown(');
    expect(source).not.toContain('<Breakdown ');
  });
});
