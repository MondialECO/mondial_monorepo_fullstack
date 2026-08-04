import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ClicksCell, MetricCell } from '@/components/serviceprovider/AnalyticsWorkspace';
import type { AnalyticsMetric, ServiceAnalytics } from '@/types/analytics';

const metric = (over: Partial<AnalyticsMetric> = {}): AnalyticsMetric => ({
  state: 'available',
  value: 0,
  previousValue: null,
  changePercentage: null,
  unit: 'count',
  reason: null,
  ...over,
});

const service = (over: Partial<ServiceAnalytics> = {}): ServiceAnalytics =>
  ({ serviceViews: metric(), clickThroughRate: metric({ unit: 'percent' }), ...over }) as ServiceAnalytics;

/** Cells are <td>, so they need a table ancestor or React warns and jsdom reparents. */
const inRow = (node: React.ReactNode) =>
  render(<table><tbody><tr>{node}</tr></tbody></table>);

/**
 * The service table's funnel columns (Impressions / Clicks+CTR / Conv.) must use the same
 * honest-state discipline as every other cell: a real 0 shows as 0, an unmeasurable metric
 * says so, and no value is ever fabricated.
 *
 * This matters more than usual here. Until this change the Clicks column rendered through
 * a bare NotTrackedInline, which has no 'available' branch — so once the backend started
 * returning real click counts, the column reported "Not enough activity" for every listing
 * that had clicks.
 */
describe('service table funnel cells', () => {
  it('renders a real zero rather than hiding it', () => {
    inRow(<MetricCell metric={metric({ value: 0 })} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders an available value', () => {
    inRow(<MetricCell metric={metric({ value: 1234 })} />);
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it.each([
    ['notTracked', 'Not tracked yet'],
    ['notEnoughActivity', 'Not enough activity'],
  ])('reports %s honestly instead of a number', (state, label) => {
    inRow(<MetricCell metric={metric({ state: state as AnalyticsMetric['state'], value: null })} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('surfaces the metric reason as a tooltip on an unavailable cell', () => {
    inRow(<MetricCell metric={metric({ state: 'notTracked', value: null, reason: 'No ListingId to measure.' })} />);
    expect(screen.getByText('Not tracked yet')).toHaveAttribute('title', 'No ListingId to measure.');
  });

  it('shows clicks with the click-through rate beside them', () => {
    inRow(<ClicksCell service={service({
      serviceViews: metric({ value: 89 }),
      clickThroughRate: metric({ value: 7.2, unit: 'percent' }),
    })} />);
    expect(screen.getByText('89')).toBeInTheDocument();
    expect(screen.getByText(/7\.2%\s*CTR/)).toBeInTheDocument();
  });

  /**
   * CTR is unavailable exactly when there are no impressions, which the Impressions cell
   * to the left already reports. Repeating it here would be noise, not disclosure.
   */
  it('omits the CTR suffix when the rate has no denominator, keeping the click count', () => {
    inRow(<ClicksCell service={service({
      serviceViews: metric({ value: 0 }),
      clickThroughRate: metric({ state: 'notEnoughActivity', value: null, unit: 'percent' }),
    })} />);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.queryByText(/CTR/)).not.toBeInTheDocument();
  });

  /** A Custom/Unattributed row has no listing to measure, so the whole cell is untracked. */
  it('falls back to the untracked label when clicks themselves are untracked', () => {
    inRow(<ClicksCell service={service({
      serviceViews: metric({ state: 'notTracked', value: null }),
      clickThroughRate: metric({ state: 'notTracked', value: null, unit: 'percent' }),
    })} />);
    expect(screen.getByText('Not tracked yet')).toBeInTheDocument();
    expect(screen.queryByText(/CTR/)).not.toBeInTheDocument();
  });
});
