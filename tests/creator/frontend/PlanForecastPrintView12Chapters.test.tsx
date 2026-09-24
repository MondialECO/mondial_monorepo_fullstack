import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import PlanForecastPrintView from '@/components/creator/PlanForecastPrintView';
import type { BusinessPlanOutput, ForecastOutput, LegalRegulatoryFramework } from '@/types/creator/ai';

describe('PlanForecastPrintView - Redesigned 12-Chapter Executive Business Plan Export', () => {
  const mockPlan: BusinessPlanOutput = {
    executiveSummary: {
      overview: 'Executive overview of GreenLogistics AI.',
      valueProposition: 'Decarbonizing freight transport through automated routing.',
      highlights: ['35% fuel reduction', 'Tier-1 enterprise pilots'],
    },
    marketAnalysis: {
      overview: 'Rapidly expanding European logistics market.',
      targetSegments: ['Mid-market Freight Forwarders', 'Enterprise Fleet Operators'],
      marketSizeQualitative: '€14B addressable SAM across France and Germany.',
      trends: ['EU CSRD compliance mandates', 'Rising fuel surcharges'],
    },
    competitorAnalysis: {
      overview: 'Fragmented incumbent software with minimal algorithmic routing.',
      competitors: [
        {
          name: 'LegacyRoute Pro',
          positioning: 'Enterprise ERP Add-on',
          strengths: ['Large installed base'],
          weaknesses: ['No real-time optimization'],
          ourAdvantage: 'Sub-second real-time carbon routing API',
        },
      ],
    },
    revenueModel: {
      summary: 'Tiered B2B SaaS with usage-based route optimization fee.',
      revenueStreams: [
        { name: 'Monthly Fleet Subscription', description: 'Platform tier based on active vehicles' },
        { name: 'Optimization Surcharge', description: 'Variable fee per route recalculated' },
      ],
      pricingStrategy: 'Value-based pricing pegged to 20% of net fuel savings.',
      keyMetrics: ['MRR Growth', 'Net Revenue Retention', 'Fleet Churn < 0.5%'],
    },
    goToMarket: {
      strategy: 'Direct outbound to fleet operations directors backed by ROI pilot calculators.',
      channels: ['Industry Logistics Summits', 'Direct LinkedIn ABM', 'Fleet Management Integrations'],
      phases: [
        { name: 'Phase 1: Founder-Led Pilots', description: 'Onboard 5 flagship regional carriers' },
        { name: 'Phase 2: Channel Alliances', description: 'Partner with telematics providers' },
      ],
    },
    operationsPlan: {
      overview: 'Cloud-native scalable infrastructure with multi-region compliance.',
      keyActivities: ['Algorithmic model training', 'Telematics hardware integrations'],
      resources: ['Senior Cloud Engineers', 'AWS High-Performance Compute'],
      milestones: [
        { title: 'Alpha Release', timeframe: 'Month 3', description: 'Core routing engine tested' },
        { title: 'Pilot Rollout', timeframe: 'Month 6', description: 'Live testing across 50 trucks' },
      ],
    },
    risks: [
      {
        category: 'Regulatory',
        description: 'Changes in European transport telematics standards',
        mitigation: 'Active membership in EU green transport alliances',
      },
    ],
  };

  const mockForecast: ForecastOutput = {
    revenueForecast: {
      currency: 'EUR',
      summary: 'Strong early adoption scaling to €45k MRR by Month 24.',
      monthly: [
        { month: 1, amount: 2000, notes: 'Launch month' },
        { month: 2, amount: 4500, notes: 'First 2 pilots converted' },
        { month: 12, amount: 25000, notes: 'Year 1 run-rate' },
      ],
    },
    costForecast: {
      currency: 'EUR',
      summary: 'Disciplined cloud and contractor expenditure.',
      monthly: [
        { month: 1, fixedCosts: 4000, variableCosts: 1000, notes: 'Hosting & setup' },
        { month: 2, fixedCosts: 4000, variableCosts: 1500, notes: 'Cloud compute' },
        { month: 12, fixedCosts: 8000, variableCosts: 3500, notes: 'Engineering team' },
      ],
    },
    cashFlowProjection: {
      currency: 'EUR',
      summary: 'Cash flow positive within 14 months.',
      monthly: [
        { month: 1, netCashFlow: -3000, endingBalance: 47000 },
        { month: 2, netCashFlow: -1000, endingBalance: 46000 },
        { month: 12, netCashFlow: 13500, endingBalance: 82000 },
      ],
    },
    breakEvenAnalysis: {
      isAchievedWithinHorizon: true,
      breakEvenMonth: 8,
      summary: 'Break-even reached at Month 8 with 12 active enterprise fleets.',
    },
    assumptions: ['15% monthly client retention', 'Standard AWS enterprise tier'],
    advisoryNotice: 'Model relies on verified customer conversion rates from Phase 2 discovery.',
  };

  const mockLegalFramework = {
    jurisdiction: 'France',
    proposedLegalStructure: 'SASU',
    planningReadinessPercentage: 92,
    addressedRequirementsCount: 11,
    totalApplicableRequirementsCount: 12,
    summary: 'Clear statutory roadmap established under French commercial code.',
    subsections: [
      {
        subsectionKey: '12.1',
        title: 'Corporate Formation & Registry',
        status: 'Addressed',
        summary: 'Incorporation with Greffe du Tribunal de Commerce.',
        keyObligations: ['Statuts deposit', 'Capital block verification'],
      },
    ],
    priorityOpenItems: [
      {
        title: 'Finalize corporate bank certificate',
        officialAuthority: 'INPI / Banque de France',
        recommendedAction: 'Obtain capital deposit certificate from escrow bank.',
      },
    ],
    disclaimerNotice: 'Planning guidance only. Formal legal review advised prior to notarization.',
  } as unknown as LegalRegulatoryFramework;

  it('renders all 12 canonical chapters cleanly with dynamic venture data', () => {
    render(
      <PlanForecastPrintView
        open={true}
        projectName="GreenLogistics AI"
        project={{
          problem: 'Freight carriers waste 28% of diesel due to static routing and empty backhauls.',
          solution: 'Real-time algorithmic dispatch matching cargo with available backhauls.',
          targetUser: 'Logistics Operations Managers and Independent Fleet Owners',
          country: 'France',
          category: 'Green Tech Logistics',
        }}
        plan={mockPlan}
        forecast={mockForecast}
        forecastBasis={{
          currency: 'EUR',
          years: [
            { year: 1, revenue: 150000, opex: 90000, netIncome: 60000 },
            { year: 2, revenue: 450000, opex: 220000, netIncome: 230000 },
            { year: 3, revenue: 1200000, opex: 500000, netIncome: 700000 },
          ],
          summary: { breakEvenMonth: 8 },
        }}
        formation={{
          selectedType: 'SASU',
          founderEquity: 85,
          plannedRole: 'Chief Executive Officer & Founder',
          skills: {
            youHave: ['Logistics domain knowledge', 'Algorithmic route optimization'],
            youNeed: ['Senior Enterprise Sales Executive', 'Fullstack React Native Developer'],
          },
        }}
        cross={{
          seedAsk: 350000,
          youNeed: ['Senior Enterprise Sales Executive'],
        }}
        legalFramework={mockLegalFramework}
        onClose={vi.fn()}
      />
    );

    // Verify Cover & Masthead
    expect(screen.getByRole('heading', { level: 1, name: 'GreenLogistics AI' })).toBeInTheDocument();
    expect(screen.getByText(/EXECUTIVE BUSINESS PLAN/i)).toBeInTheDocument();
    expect(screen.getByText(/Sector: Green Tech Logistics/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Jurisdiction: France/i).length).toBeGreaterThanOrEqual(1);

    // Verify all 12 chapters are present
    expect(screen.getByText('1. Executive Summary')).toBeInTheDocument();
    expect(screen.getByText('2. Problem & Solution')).toBeInTheDocument();
    expect(screen.getByText('3. Market & Customers')).toBeInTheDocument();
    expect(screen.getByText('4. Business Model')).toBeInTheDocument();
    expect(screen.getByText('5. Competition & Positioning')).toBeInTheDocument();
    expect(screen.getByText('6. Go-to-Market')).toBeInTheDocument();
    expect(screen.getByText('7. Financial Projections')).toBeInTheDocument();
    expect(screen.getByText('8. Company & Team')).toBeInTheDocument();
    expect(screen.getByText('9. Funding Requirements')).toBeInTheDocument();
    expect(screen.getByText('10. Operations & Milestones')).toBeInTheDocument();
    expect(screen.getByText('11. Risks & Next Steps')).toBeInTheDocument();
    expect(screen.getByText('12. Legal & Compliance')).toBeInTheDocument();

    // Verify dynamic bindings
    expect(screen.getByText('Decarbonizing freight transport through automated routing.')).toBeInTheDocument();
    expect(screen.getByText(/Freight carriers waste 28% of diesel/i)).toBeInTheDocument();
    expect(screen.getByText(/Real-time algorithmic dispatch matching/i)).toBeInTheDocument();
    expect(screen.getByText('LegacyRoute Pro')).toBeInTheDocument();
    expect(screen.getByText('Sub-second real-time carbon routing API')).toBeInTheDocument();
    expect(screen.getByText('Consolidated monthly forecast')).toBeInTheDocument();
    expect(screen.getByText('Chief Executive Officer & Founder')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('€350,000')).toBeInTheDocument();
    expect(screen.getByText('Alpha Release')).toBeInTheDocument();
    expect(screen.getByText('Changes in European transport telematics standards')).toBeInTheDocument();
    expect(screen.getByText(/92% \(11 of 12 met\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Finalize corporate bank certificate/i)).toBeInTheDocument();
  });
});
