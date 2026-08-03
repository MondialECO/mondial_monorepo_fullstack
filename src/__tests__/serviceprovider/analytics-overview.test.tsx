import { render, screen } from '@testing-library/react';
import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { HeadlineCard, TrendChart } from '@/components/serviceprovider/AnalyticsWorkspace';
import type { AnalyticsDashboard, AnalyticsMetric, AnalyticsTrendPoint } from '@/types/analytics';

// Recharts is stubbed rather than partially mocked. These tests cover this file's own
// logic — the empty-state branch and the granularity heading — not recharts' SVG output,
// and jsdom reports a 0x0 container so ResponsiveContainer would render nothing anyway.
// next/link renders through Next's client router, which is not mounted here. Mocked to a
// plain anchor, matching the existing suite's approach (see UniversalPhase1.test.tsx).
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement('a', { href, ...props }, children),
}));

vi.mock('recharts', () => {
  const Stub = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return {
    ResponsiveContainer: Stub, LineChart: Stub, Line: Stub, XAxis: Stub,
    YAxis: Stub, CartesianGrid: Stub, Tooltip: Stub, Legend: Stub,
  };
});

const metric = (over: Partial<AnalyticsMetric> = {}): AnalyticsMetric => ({
  state: 'available', value: 42, previousValue: null, changePercentage: null,
  unit: 'count', reason: null, ...over,
});

const card = (over: Partial<Parameters<typeof HeadlineCard>[0]> = {}) =>
  render(<HeadlineCard
    icon={ShieldCheck}
    label="Profile"
    headline={metric()}
    detailLabel="Profile completion"
    detail={metric({ value: 80, unit: 'percent' })}
    linkLabel="View Profile Analytics"
    href="/dashboard/serviceprovider/profile?view=trust"
    {...over}
  />);

const point = (over: Partial<AnalyticsTrendPoint> = {}): AnalyticsTrendPoint => ({
  periodStart: '2026-07-06T00:00:00Z', label: '6 Jul', netEarnings: 0, averageRating: null, ...over,
});

const dashboard = (trend: AnalyticsTrendPoint[], granularity = 'week') =>
  ({ trend, trendGranularity: granularity, currency: 'EUR' }) as AnalyticsDashboard;

/**
 * The three headline cards are the most visually prominent thing on the page, which is
 * exactly why they must not be exempt from the honest-state discipline the rest of the
 * surface follows: no fabricated number, and the server's own reason shown rather than a
 * restated one that can drift.
 */
describe('Overview headline cards', () => {
  it('shows the metric and its link when data exists', () => {
    card();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View Profile Analytics/ }))
      .toHaveAttribute('href', '/dashboard/serviceprovider/profile?view=trust');
  });

  it('shows the server reason instead of a number when there is not enough activity', () => {
    card({ headline: metric({
      state: 'notEnoughActivity', value: null,
      reason: 'Trust score appears after the first qualifying trust signal.',
    }) });

    expect(screen.getByText('Not enough activity')).toBeInTheDocument();
    expect(screen.getByText('Trust score appears after the first qualifying trust signal.')).toBeInTheDocument();
    expect(screen.queryByText('42')).not.toBeInTheDocument();
  });

  it('reports a not-tracked headline honestly', () => {
    card({ headline: metric({ state: 'notTracked', value: null, reason: 'No upstream source exists.' }) });

    expect(screen.getByText('Not tracked yet')).toBeInTheDocument();
    expect(screen.getByText('No upstream source exists.')).toBeInTheDocument();
  });

  /** A real 0 is a fact, not an empty state. */
  it('renders a genuine zero rather than suppressing it', () => {
    card({ headline: metric({ value: 0 }) });
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('degrades the supporting line independently of the headline', () => {
    card({ detail: metric({ state: 'notTracked', value: null }) });

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Not tracked yet')).toBeInTheDocument();
  });
});

describe('Overview trend chart', () => {
  it('explains an empty period rather than drawing an empty chart', () => {
    render(<TrendChart data={dashboard([point(), point({ label: '13 Jul' })])} />);

    expect(screen.getByText('No activity in this period')).toBeInTheDocument();
  });

  it('explains a period with no buckets at all', () => {
    render(<TrendChart data={dashboard([])} />);
    expect(screen.getByText('No activity in this period')).toBeInTheDocument();
  });

  /** Ratings alone are enough to be worth charting, even with no money released. */
  it('draws the chart when only ratings exist', () => {
    render(<TrendChart data={dashboard([point({ averageRating: 4.5 })])} />);

    expect(screen.queryByText('No activity in this period')).not.toBeInTheDocument();
  });

  it('draws the chart when only earnings exist', () => {
    render(<TrendChart data={dashboard([point({ netEarnings: 250 })])} />);

    expect(screen.queryByText('No activity in this period')).not.toBeInTheDocument();
  });

  /** The server picks the bucket width; the heading must report it, not assume weeks. */
  it.each([
    ['day', 'Daily trend'],
    ['week', 'Weekly trend'],
    ['month', 'Monthly trend'],
  ])('labels %s granularity as "%s"', (granularity, expected) => {
    render(<TrendChart data={dashboard([point({ netEarnings: 100 })], granularity)} />);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});
