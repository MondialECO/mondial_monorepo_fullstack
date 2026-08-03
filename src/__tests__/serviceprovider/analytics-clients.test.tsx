import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  ActiveClientsTable, ClientOriginationSection, RatingHistogram, TopIndustriesSection,
} from '@/components/serviceprovider/AnalyticsWorkspace';
import type {
  ActiveClientAnalytics, AnalyticsMetric, ClientOriginationAnalytics, IndustryAnalytics,
  RatingBucket,
} from '@/types/analytics';

const source = readFileSync(
  resolve(process.cwd(), 'src/components/serviceprovider/AnalyticsWorkspace.tsx'),
  'utf8'
);

const metric = (over: Partial<AnalyticsMetric> = {}): AnalyticsMetric => ({
  state: 'available', value: 60, previousValue: null, changePercentage: null,
  unit: 'percent', reason: null, ...over,
});

const origination = (over: Partial<ClientOriginationAnalytics> = {}): ClientOriginationAnalytics => ({
  ecosystemMatch: metric({ value: 75 }),
  marketplaceSearch: metric({ value: 25 }),
  ecosystemClients: 3, marketplaceClients: 1, unattributedClients: 0,
  ...over,
});

const buckets = (counts: number[]): RatingBucket[] =>
  counts.map((count, index) => ({ rating: index + 1, count }));

const client = (over: Partial<ActiveClientAnalytics> = {}): ActiveClientAnalytics =>
  ({ clientId: 'cli...ear', completedProjects: 3, netRevenue: 1500, averageRating: 4.5, ...over });

const industry = (over: Partial<IndustryAnalytics> = {}): IndustryAnalytics =>
  ({ industry: 'Fintech', projects: 4, ...over });

const barWidth = (container: HTMLElement, index: number) =>
  (container.querySelectorAll('li div > div')[index] as HTMLElement | undefined)?.style.width;

describe('client origination source', () => {
  it('renders both channels with their share and client count', () => {
    render(<ClientOriginationSection origination={origination()} />);

    expect(screen.getByText('Ecosystem Match')).toBeInTheDocument();
    expect(screen.getByText('Marketplace Search')).toBeInTheDocument();
    expect(screen.getByText(/75%/)).toBeInTheDocument();
    expect(screen.getByText(/3 clients/)).toBeInTheDocument();
  });

  it('singularises a single client', () => {
    render(<ClientOriginationSection origination={origination({ marketplaceClients: 1 })} />);

    expect(screen.getByText(/1 client$/)).toBeInTheDocument();
  });

  /** A 0%-wide bar still draws its track, which reads as a measured zero. */
  it('explains an unavailable split instead of drawing two empty bars', () => {
    const { container } = render(<ClientOriginationSection origination={origination({
      ecosystemMatch: metric({
        state: 'notEnoughActivity', value: null,
        reason: 'No client completed work in this period, so there is no origination split to calculate.',
      }),
      marketplaceSearch: metric({ state: 'notEnoughActivity', value: null }),
      ecosystemClients: 0, marketplaceClients: 0,
    })} />);

    expect(screen.getByText('Not enough activity')).toBeInTheDocument();
    expect(screen.getByText(/no origination split to calculate/)).toBeInTheDocument();
    expect(container.querySelectorAll('li')).toHaveLength(0);
  });

  it('discloses clients that could not be attributed to either channel', () => {
    render(<ClientOriginationSection origination={origination({ unattributedClients: 2 })} />);

    expect(screen.getByText(/2 clients could not be traced back to a proposal/)).toBeInTheDocument();
  });

  it('says nothing about attribution when every client was attributed', () => {
    render(<ClientOriginationSection origination={origination()} />);

    expect(screen.queryByText(/could not be traced/)).not.toBeInTheDocument();
  });
});

describe('rating histogram', () => {
  it('renders one bar per star value, highest first', () => {
    render(<RatingHistogram buckets={buckets([1, 0, 2, 5, 9])} total={17} />);

    const labels = screen.getAllByText(/star$/).map((node) => node.textContent);
    expect(labels).toEqual(['5 star', '4 star', '3 star', '2 star', '1 star']);
  });

  /**
   * The state this section most needs to get right. A missing 2-star bar reads as "no such
   * bar exists" rather than "nobody gave 2 stars".
   */
  it('keeps empty buckets so the shape survives the gaps', () => {
    render(<RatingHistogram buckets={buckets([0, 0, 0, 0, 4])} total={4} />);

    expect(screen.getAllByText(/star$/)).toHaveLength(5);
    expect(screen.getAllByText('0')).toHaveLength(4);
  });

  it('scales each bar against the tallest, not the total', () => {
    const { container } = render(<RatingHistogram buckets={buckets([0, 0, 0, 2, 8])} total={10} />);

    // Sorted 5..1, so the first bar is the 8-count and the second the 2-count.
    expect(barWidth(container, 0)).toBe('100%');
    expect(barWidth(container, 1)).toBe('25%');
  });

  it('explains no reviews rather than drawing five empty bars', () => {
    const { container } = render(<RatingHistogram buckets={buckets([0, 0, 0, 0, 0])} total={0} />);

    expect(screen.getByText(/no rating distribution to show/)).toBeInTheDocument();
    expect(container.querySelectorAll('li')).toHaveLength(0);
  });
});

describe('top industries', () => {
  it('ranks industries with a proportional bar against the highest', () => {
    const { container } = render(<TopIndustriesSection industries={[
      industry({ projects: 4 }), industry({ industry: 'Healthcare', projects: 1 }),
    ]} />);

    expect(screen.getByText('Fintech')).toBeInTheDocument();
    expect(screen.getByText('4 projects')).toBeInTheDocument();
    expect(barWidth(container, 0)).toBe('100%');
    expect(barWidth(container, 1)).toBe('25%');
  });

  it('singularises a single project', () => {
    render(<TopIndustriesSection industries={[industry({ projects: 1 })]} />);

    expect(screen.getByText('1 project')).toBeInTheDocument();
  });

  /** The counts do not partition the project total, and the description must say so. */
  it('states that a multi-industry brief counts in each industry', () => {
    render(<TopIndustriesSection industries={[industry()]} />);

    expect(screen.getByText(/do not sum to your project total/)).toBeInTheDocument();
  });

  it('renders the Custom/Unattributed fallback as an ordinary row', () => {
    render(<TopIndustriesSection industries={[industry({ industry: 'Custom/Unattributed', projects: 2 })]} />);

    expect(screen.getByText('Custom/Unattributed')).toBeInTheDocument();
  });

  it('explains an empty period rather than rendering an empty list', () => {
    render(<TopIndustriesSection industries={[]} />);

    expect(screen.getByText('No completed project exists in this period.')).toBeInTheDocument();
  });
});

describe('top client relationships table', () => {
  it('renders the four columns with the masked identifier verbatim', () => {
    render(<ActiveClientsTable clients={[client()]} currency="EUR" />);

    expect(screen.getByRole('columnheader', { name: 'Client' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Projects' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Total value' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Avg rating' })).toBeInTheDocument();

    const row = screen.getAllByRole('row')[1];
    expect(within(row).getByText('cli...ear')).toBeInTheDocument();
    expect(within(row).getByText('3')).toBeInTheDocument();
    expect(within(row).getByText('4.5')).toBeInTheDocument();
  });

  /**
   * The mask must reach the DOM exactly as MaskClient produced it. Reformatting in the
   * browser is how a raw identifier gets reconstructed by accident.
   */
  it('does not reformat or truncate the masked identifier', () => {
    render(<ActiveClientsTable clients={[client({ clientId: 'abc...xyz' })]} currency="EUR" />);

    expect(screen.getByText('abc...xyz')).toBeInTheDocument();
  });

  /** An unrated client has not rated you badly. */
  it('reports an unrated client honestly rather than as zero', () => {
    render(<ActiveClientsTable clients={[client({ averageRating: null })]} currency="EUR" />);

    expect(screen.getByText('Not rated')).toBeInTheDocument();
    expect(screen.queryByText('0.0')).not.toBeInTheDocument();
  });

  /** No per-row navigation: the reference design's action column was dropped on purpose. */
  it('offers no per-row action that could deanonymise a client', () => {
    render(<ActiveClientsTable clients={[client()]} currency="EUR" />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('clients tab composition', () => {
  const clientsView = source.slice(source.indexOf('function ClientsView'), source.indexOf('function RatingHistogram'));

  it('renders the masked id straight from the API without further processing', () => {
    // No slice/substring/replace/mask helper anywhere near the client identifier.
    expect(source).not.toMatch(/clientId\.(slice|substring|substr|replace|split)/);
  });

  it('wires every new section into the tab', () => {
    expect(clientsView).toContain('<ClientOriginationSection');
    expect(clientsView).toContain('<TopIndustriesSection');
    expect(clientsView).toContain('<RatingHistogram');
    expect(clientsView).toContain('<ActiveClientsTable');
  });

  /** Replaced by the four-column table. */
  it('no longer renders the flat most-active-clients list', () => {
    expect(clientsView).not.toContain('completed ·');
    expect(clientsView).toContain('Top client relationships');
  });

  /**
   * The eight-item grid predated the redesign and restated counts the new sections carry
   * more usefully. Asserted on the metric references rather than the labels, so prose
   * explaining the removal cannot satisfy the test.
   */
  it('no longer renders the pre-redesign metric grid', () => {
    expect(clientsView).not.toContain('MetricGrid');
    for (const metric of [
      'totalClients', 'newClients', 'returningClients', 'repeatClients',
      'completedEngagements', 'onTimeDeliveryRate', 'averageClientLifetimeValue',
    ]) {
      expect(clientsView).not.toContain(metric);
    }
  });

  /**
   * The three dimension tiles restate the reviews the overall average already summarises,
   * and Verified reviews is the histogram's own total counted twice.
   */
  it('reduces the satisfaction card to the average and the histogram', () => {
    expect(clientsView).toContain('averageClientRating');
    expect(clientsView).toContain('<RatingHistogram');
    for (const metric of ['averageQualityRating', 'averageCommunicationRating', 'averageDeliveryRating', 'reviewCount']) {
      expect(clientsView).not.toContain(metric);
    }
  });

  it('no longer renders the disputes card', () => {
    expect(clientsView).not.toContain('disputesOpened');
    expect(clientsView).not.toContain('disputesResolved');
    expect(clientsView).not.toContain('adverseDisputes');
    expect(clientsView).not.toContain('Client-favoured');
  });

  /**
   * Removing the grid must not take the repeat-client rate out of the product — Overview's
   * headline card is where it actually lives, and this tab was only restating it.
   */
  it('leaves the repeat-client rate on the Overview headline card', () => {
    const overview = source.slice(source.indexOf('function Overview'), source.indexOf('function ServicesView'));
    expect(overview).toContain('data.clients.repeatClientRate');
  });
});
