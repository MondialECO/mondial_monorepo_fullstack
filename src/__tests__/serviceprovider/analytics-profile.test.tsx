import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ProfileFunnelSection, ProfileView, TopServicesSection } from '@/components/serviceprovider/AnalyticsWorkspace';
import type { AnalyticsDashboard, AnalyticsMetric, ProfileAnalytics, ProfileFunnel, TopService } from '@/types/analytics';

// next/link renders through Next's client router, which is not mounted here. Mocked to a
// plain anchor, matching analytics-overview.test.tsx.
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement('a', { href, ...props }, children),
}));

const source = readFileSync(
  resolve(process.cwd(), 'src/components/serviceprovider/AnalyticsWorkspace.tsx'),
  'utf8'
);

/**
 * ProfileView's own slice. Asserting against the whole file is what let the Trust-page
 * link regress unnoticed: the URL also appears in Overview's HeadlineCard, so a
 * file-wide `toContain` passed while ProfileView had no link at all.
 */
const profileView = source.slice(
  source.indexOf('function ProfileView'),
  source.indexOf('function EarningsView')
);

const metric = (over: Partial<AnalyticsMetric> = {}): AnalyticsMetric => ({
  state: 'available', value: 10, previousValue: null, changePercentage: null,
  unit: 'count', reason: null, ...over,
});

const funnel = (over: Partial<ProfileFunnel> = {}): ProfileFunnel => ({
  briefsShown: metric({ value: 10 }),
  proposalsSent: metric({ value: 5 }),
  hired: metric({ value: 1 }),
  proposalRate: metric({ value: 50, unit: 'percent' }),
  hireRate: metric({ value: 20, unit: 'percent' }),
  ...over,
});

const service = (over: Partial<TopService> = {}): TopService =>
  ({ serviceId: 's1', title: 'UX audit', clicks: 20, impressions: 100, ...over });

const profileData = (over: Partial<ProfileAnalytics> = {}): AnalyticsDashboard => ({
  profile: {
    funnel: funnel(), topServices: [], trustScore: metric({ value: 72 }), trustSignals: [],
    disputePenalty: metric({ value: 0 }), profileCompleteness: metric({ value: 80, unit: 'percent' }),
    verificationStatus: 'Verified', tierLevel: 2, tierMeaning: 'Verified providers rank higher in matching.',
    skillsTestsTaken: metric(), skillsTestsPassed: metric(), latestSkillsTestScore: metric(),
    portfolioItems: metric(), publishedServices: metric(), profileViews: metric(),
    searchAppearances: metric(), portfolioViews: metric(), profileSaves: metric(),
    contactRate: metric(), portfolioEngagement: metric(),
    ...over,
  },
} as AnalyticsDashboard);

describe('profile funnel', () => {
  it('shows all three real steps with the rate between each pair', () => {
    render(<ProfileFunnelSection funnel={funnel()} />);

    expect(screen.getByText('Briefs shown')).toBeInTheDocument();
    expect(screen.getByText('Proposals sent')).toBeInTheDocument();
    expect(screen.getByText('Hired')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
  });

  /**
   * Nothing entering a step is not the same as nothing converting, so the rate reports
   * its state and reason rather than a 0% that would read as failure.
   */
  it('reports a rate with no denominator honestly rather than as 0%', () => {
    render(<ProfileFunnelSection funnel={funnel({
      briefsShown: metric({ value: 0 }),
      proposalsSent: metric({ value: 0 }),
      hired: metric({ value: 0 }),
      proposalRate: metric({
        state: 'notEnoughActivity', value: null, unit: 'percent',
        reason: 'No brief was surfaced in this period, so there is no rate to calculate.',
      }),
      hireRate: metric({ state: 'notEnoughActivity', value: null, unit: 'percent' }),
    })} />);

    expect(screen.getAllByText('Not enough activity')).toHaveLength(2);
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
    // Counts stay real zeroes — none were surfaced is a fact worth stating.
    expect(screen.getAllByText('0')).toHaveLength(3);
  });

  it('exposes the server reason for an unavailable rate on hover', () => {
    render(<ProfileFunnelSection funnel={funnel({
      proposalRate: metric({
        state: 'notEnoughActivity', value: null, unit: 'percent',
        reason: 'No brief was surfaced in this period, so there is no rate to calculate.',
      }),
    })} />);

    expect(screen.getByText('Not enough activity'))
      .toHaveAttribute('title', 'No brief was surfaced in this period, so there is no rate to calculate.');
  });

  it('degrades a single step without hiding the others', () => {
    render(<ProfileFunnelSection funnel={funnel({
      hired: metric({ state: 'notTracked', value: null, reason: 'No source.' }),
    })} />);

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Not tracked yet')).toBeInTheDocument();
  });
});

describe('top performing services', () => {
  it('lists services with clicks first and impressions for context', () => {
    render(<TopServicesSection services={[service(), service({ serviceId: 's2', title: 'Brand sprint', clicks: 5, impressions: 400 })]} />);

    expect(screen.getByText('UX audit')).toBeInTheDocument();
    expect(screen.getByText('Brand sprint')).toBeInTheDocument();
    expect(screen.getByText(/20/)).toBeInTheDocument();
    expect(screen.getByText(/100 impressions/)).toBeInTheDocument();
  });

  it('singularises a single click', () => {
    const { container } = render(<TopServicesSection services={[service({ clicks: 1 })]} />);

    // Asserted on the row, not the page: the section description also says "clicked".
    const row = container.querySelector('li');
    expect(row?.textContent).toContain('1 click ·');
    expect(row?.textContent).not.toContain('1 clicks');
  });

  /** No fabricated "0 performance" ranking — an explanation instead. */
  it('explains an empty ranking rather than showing an empty list', () => {
    render(<TopServicesSection services={[]} />);

    expect(screen.getByText(/No listing received a click in this period/)).toBeInTheDocument();
  });
});

describe('profile tab composition', () => {
  /**
   * Audit Item 1: identical data to the real Trust page, with no period scoping.
   *
   * Asserts the CARD is gone, not that the words never appear — prose explaining why it
   * was removed legitimately mentions it, and a bare string match would forbid that.
   */
  it('no longer renders the Trust breakdown card', () => {
    expect(profileView).not.toContain('title="Trust breakdown"');
    expect(profileView).not.toContain('trustSignals');
  });

  /**
   * The Trust breakdown was only safe to remove because this route existed. Scoped to
   * ProfileView specifically — the previous file-wide assertion matched Overview's card
   * and passed for weeks of nothing.
   */
  it('still links to the real Trust page from this tab', () => {
    expect(profileView).toContain('/dashboard/serviceprovider/profile?view=trust');
  });

  /**
   * No trend chart on this tab: no historical snapshot of trust score or profile
   * completeness exists, so "profile strength over time" cannot be drawn honestly.
   */
  it('does not chart profile strength over time', () => {
    expect(profileView).not.toContain('LineChart');
    expect(profileView).not.toContain('TrendChart');
  });

  /**
   * Audit Item 1. Skills tests and portfolio counts carried no period scoping — the server
   * passes null as the previous value for every one — and the real Profile & Trust page
   * shows both far more usefully: per-category attempt status with pass/fail, score and
   * retest date, plus the interactive card to actually take a test. Same reasoning that
   * removed the Trust breakdown.
   */
  it('no longer restates skills-test and portfolio counts from the real Profile page', () => {
    expect(profileView).not.toContain('MetricGrid');
    expect(profileView).not.toContain('skillsTests');
    expect(profileView).not.toContain('portfolioItems');
  });
});

/**
 * Verification and tier are one fact today, not two: the verification paths in
 * ServiceProviderService set ProviderTier = Tier2, and Tier3/Tier4 have no writer
 * anywhere. Two cards implied two independent axes a provider could move along.
 */
describe('merged verification and tier card', () => {
  it('reads verification and tier as one statement for a verified provider', () => {
    render(<ProfileView data={profileData()} />);

    expect(screen.getByText('Verified · Tier 2')).toBeInTheDocument();
    expect(screen.getByText('Verified providers rank higher in matching.')).toBeInTheDocument();
  });

  /**
   * The state that makes the merge safe. An unverified provider is genuinely Tier 1, so
   * the card must not imply the Tier 2 that only verification grants.
   */
  it('does not claim a tier an unverified provider has not earned', () => {
    render(<ProfileView data={profileData({
      verificationStatus: 'Pending', tierLevel: 1,
      tierMeaning: 'Complete verification to reach Tier 2.',
    })} />);

    expect(screen.getByText('Pending · Tier 1')).toBeInTheDocument();
    expect(screen.queryByText('Verified · Tier 2')).not.toBeInTheDocument();
    // The detail line may still MENTION Tier 2 — "Complete verification to reach Tier 2"
    // is guidance toward it, the opposite of claiming it. Only the headline is asserted.
    expect(screen.getByText('Complete verification to reach Tier 2.')).toBeInTheDocument();
  });

  /** Split camelCase status strings stay readable rather than leaking the enum name. */
  it('humanises a multi-word verification status', () => {
    render(<ProfileView data={profileData({ verificationStatus: 'UnderReview', tierLevel: 1 })} />);

    expect(screen.getByText('Under Review · Tier 1')).toBeInTheDocument();
  });

  it('renders one card for the pair, not two', () => {
    render(<ProfileView data={profileData()} />);

    expect(screen.queryByText('Verification')).not.toBeInTheDocument();
    expect(screen.queryByText('Tier')).not.toBeInTheDocument();
    expect(screen.getByText('Verification & tier')).toBeInTheDocument();
  });
});
