import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TrackingGapsNote } from '@/components/serviceprovider/AnalyticsWorkspace';
import type { AnalyticsMetric } from '@/types/analytics';

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

/**
 * These assert placement rather than rendering: the point is that a metric appears in ONE
 * tab, which no single component render can demonstrate.
 */
describe('metric de-duplication', () => {
  it('shows Published services in exactly one tab', () => {
    const occurrences = source.match(/'Published services'|label="Published services"/g) ?? [];
    expect(occurrences).toHaveLength(1);
  });

  it('no longer carries a comparison panel duplicating the headline cards', () => {
    // Removed with the Overview redesign: it restated metrics the three headline cards
    // already show, and the trend chart now covers period movement.
    expect(source).not.toContain('function ComparisonPanel');
    expect(source).not.toContain('<ComparisonPanel');
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
