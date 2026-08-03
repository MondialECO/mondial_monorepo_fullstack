import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Observations, TrackingGapsNote } from '@/components/serviceprovider/AnalyticsWorkspace';
import type { AnalyticsDashboard, AnalyticsMetric } from '@/types/analytics';

const source = readFileSync(
  resolve(process.cwd(), 'src/components/serviceprovider/AnalyticsWorkspace.tsx'),
  'utf8'
);

const metric = (over: Partial<AnalyticsMetric> = {}): AnalyticsMetric => ({
  state: 'available', value: 1, previousValue: null, changePercentage: null,
  unit: 'count', reason: null, ...over,
});

const untracked = (reason: string) =>
  metric({ state: 'notTracked', value: null, reason });

const dashboard = (over: Partial<AnalyticsDashboard> = {}): AnalyticsDashboard =>
  ({ observations: [], unavailableObservationRuleIds: [], ...over }) as AnalyticsDashboard;

/**
 * Permanently-untracked metrics used to render as a bordered card listing every gap in
 * full, on every visit. The information is retained but de-emphasised — count visible,
 * reasons on hover — because a standing, unactionable caveat should not compete visually
 * with live results.
 */
describe('TrackingGapsNote', () => {
  it('summarises the gaps with each reason available on hover', () => {
    render(<TrackingGapsNote metrics={[
      ['Profile views', untracked('No public browsing surface exists.')],
      ['Contact rate', untracked('No contact events are recorded.')],
    ]} />);

    expect(screen.getByText(/2 metrics await upstream tracking/)).toBeInTheDocument();
    expect(screen.getByText('Profile views')).toHaveAttribute('title', 'No public browsing surface exists.');
    expect(screen.getByText('Contact rate')).toHaveAttribute('title', 'No contact events are recorded.');
  });

  it('lists only the metrics that are actually unavailable', () => {
    render(<TrackingGapsNote metrics={[
      ['Impressions', metric({ value: 400 })],
      ['Enquiries', untracked('No enquiry entity exists.')],
    ]} />);

    expect(screen.getByText(/1 metric awaits upstream tracking/)).toBeInTheDocument();
    expect(screen.queryByText('Impressions')).not.toBeInTheDocument();
  });

  it('renders nothing when every metric is tracked', () => {
    const { container } = render(<TrackingGapsNote metrics={[['Impressions', metric()]]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the metrics are absent entirely', () => {
    const { container } = render(<TrackingGapsNote metrics={[['Enquiries', undefined]]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('Observations', () => {
  it('renders nothing when no rule fired and none are flagged as unavailable', () => {
    const { container } = render(<Observations data={dashboard()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('still renders when rules could not run, because that is worth saying', () => {
    render(<Observations data={dashboard({ unavailableObservationRuleIds: ['a', 'b', 'c'] })} />);
    expect(screen.getByText(/3 observation rules cannot run/)).toBeInTheDocument();
  });

  it('renders a triggered observation', () => {
    render(<Observations data={dashboard({
      observations: [{ ruleId: 'repeat-client-strength', title: 'Strong repeat business', message: 'Over 30% of clients returned.', suggestedActions: ['Offer a retainer'] }],
    } as Partial<AnalyticsDashboard>)} />);

    expect(screen.getByText('Strong repeat business')).toBeInTheDocument();
    expect(screen.getByText('Offer a retainer')).toBeInTheDocument();
  });
});

/**
 * These assert placement rather than rendering: the point is that a metric appears in ONE
 * tab, which no single component render can demonstrate.
 */
describe('metric de-duplication', () => {
  it('shows Published services in exactly one tab', () => {
    const occurrences = source.match(/'Published services'|label="Published services"/g) ?? [];
    expect(occurrences).toHaveLength(1);
  });

  it('keeps the KPI row and the comparison panel disjoint', () => {
    const panel = source.slice(source.indexOf('function ComparisonPanel'), source.indexOf('function hasObservationContent'));
    expect(panel).toContain('Completed engagements');
    expect(panel).toContain('On-time delivery');
    // Both of these sit in the KPI row directly above the panel.
    expect(panel).not.toContain("'Net earnings'");
    expect(panel).not.toContain("'Accepted proposals'");
  });

  it('no longer duplicates the earnings KPI grid that /earnings owns', () => {
    const earnings = source.slice(source.indexOf('function EarningsView'), source.indexOf('function ClientsView'));
    expect(earnings).not.toContain('MetricGrid');
    // The content that is genuinely unique to this tab must survive.
    expect(earnings).toContain('By service');
    expect(earnings).toContain('By month');
    expect(earnings).toContain('By category');
    expect(earnings).toContain('By client');
    expect(earnings).toContain('Open Earnings & Payouts');
  });
});
