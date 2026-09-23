import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InvestorReadinessFigmaFlow } from '@/components/creator/readiness/InvestorReadinessFigmaFlow';
import type { InvestorReadinessScore } from '@/lib/api-creator-journey';

describe('InvestorReadinessFigmaFlow (Step 3.7 Figma Node 57160:11404)', () => {
  const mockProject = {
    name: 'AutoInvoice',
    targetUser: 'SMB accounting firms in France',
    country: 'France',
    category: 'B2B SaaS',
    problem: 'Manual invoice tracking takes 15 hours weekly.',
    solution: 'Automated invoice workflow with instant accounting sync.',
  };

  const mockReadiness: InvestorReadinessScore = {
    total: 68,
    label: 'Developing',
    headline: 'A clear starting point, with a few gaps to work through.',
    summary:
      'Your concept is taking shape. Stronger customer evidence, clearer financial assumptions, and a practical support plan will make it easier to explain your business.',
    breakdown: {
      conceptClarity: 17,
      marketEvidence: 12,
      financialModel: 19,
      legalReadiness: 9,
      teamCredibility: 11,
    },
    deductions: [
      {
        dimension: 'ConceptClarity',
        issue: 'Clarity score below 100%',
        pointsLost: 3,
        currentState: 'The problem and proposed solution are described.',
        recommendation:
          'Clarify why your first customers would choose AutoInvoice over their current approach.',
        remediationTitle: 'Refine your concept',
        remediationRoute: '/dashboard/creator/phase-2/clarifier',
      },
      {
        dimension: 'MarketEvidence',
        issue: 'Market evidence incomplete',
        pointsLost: 8,
        currentState: 'An initial customer group (SMB accounting firms in France) is identified.',
        recommendation:
          'Add direct customer feedback and sources that support your market assumptions.',
        remediationTitle: 'Review your market study',
        remediationRoute: '/dashboard/creator/phase-3/market-study',
      },
      {
        dimension: 'FinancialModel',
        issue: 'Assumptions to test',
        pointsLost: 6,
        currentState: 'A forecast is available, with assumptions still to test.',
        recommendation:
          'Explain the main revenue and cost assumptions, and check what happens if sales start more slowly.',
        remediationTitle: 'Review your financial forecast',
        remediationRoute: '/dashboard/creator/phase-3/forecast',
      },
      {
        dimension: 'LegalReadiness',
        issue: 'Checklist incomplete',
        pointsLost: 6,
        currentState: 'A personalised legal roadmap is available.',
        recommendation:
          'Clarify which requirements apply to your activity and when you will handle them.',
        subtext: 'This assesses your planning, not whether your company is already registered.',
        remediationTitle: 'Review your legal roadmap',
        remediationRoute: '/dashboard/creator/phase-3/compliance',
      },
      {
        dimension: 'TeamCredibility',
        issue: 'Solo founder gaps',
        pointsLost: 9,
        currentState: 'The founder’s responsibilities are outlined.',
        recommendation:
          'Explain how you will cover the skills your launch needs, including any outside support.',
        subtext: 'You can plan these responsibilities as a solo founder.',
        remediationTitle: 'Review company setup & team',
        remediationRoute: '/dashboard/creator/phase-3/formation',
      },
    ],
    evaluatedAt: '2026-09-23T23:00:00Z',
  };

  it('renders Section 1 Header with project intelligence, dynamic venture name, and live badge', () => {
    render(
      <InvestorReadinessFigmaFlow
        project={mockProject}
        readiness={mockReadiness}
        loading={false}
        missingPrerequisite={null}
        updateAvailable={false}
        changedSources={[]}
        onRecompute={vi.fn()}
        isRecomputing={false}
        canContinue={true}
        onContinue={vi.fn()}
        isNavigating={false}
        onExportPdf={vi.fn()}
        ideaId="idea_test_123"
      />
    );

    expect(screen.getByText('PROJECT INTELLIGENCE')).toBeInTheDocument();
    expect(screen.getByText('Phase 3.7')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Investor readiness' })).toBeInTheDocument();
    expect(screen.getByText('AutoInvoice')).toBeInTheDocument();
    expect(screen.getByText('Live assessment')).toBeInTheDocument();
    expect(screen.getByText('View business plan')).toBeInTheDocument();
  });

  it('renders Section 2 Hero scorecard with 68/100 and 5 segment breakdown pillars', () => {
    render(
      <InvestorReadinessFigmaFlow
        project={mockProject}
        readiness={mockReadiness}
        loading={false}
        missingPrerequisite={null}
        updateAvailable={false}
        changedSources={[]}
        onRecompute={vi.fn()}
        isRecomputing={false}
        canContinue={true}
        onContinue={vi.fn()}
        isNavigating={false}
        onExportPdf={vi.fn()}
        ideaId="idea_test_123"
      />
    );

    expect(screen.getByText('YOUR PLANNING READINESS')).toBeInTheDocument();
    expect(screen.getByText('68')).toBeInTheDocument();
    expect(screen.getByText('/ 100')).toBeInTheDocument();
    expect(screen.getByText('A clear starting point, with a few gaps to work through.')).toBeInTheDocument();

    // 5 pillars
    expect(screen.getByText('Concept')).toBeInTheDocument();
    expect(screen.getByText('17/20')).toBeInTheDocument();
    expect(screen.getByText('Market')).toBeInTheDocument();
    expect(screen.getByText('12/20')).toBeInTheDocument();
    expect(screen.getByText('Finance')).toBeInTheDocument();
    expect(screen.getByText('19/25')).toBeInTheDocument();
    expect(screen.getByText('Legal')).toBeInTheDocument();
    expect(screen.getByText('9/15')).toBeInTheDocument();
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getByText('11/20')).toBeInTheDocument();
  });

  it('renders Section 3 What to improve with structured cards and marks largest gap with "Start here"', () => {
    render(
      <InvestorReadinessFigmaFlow
        project={mockProject}
        readiness={mockReadiness}
        loading={false}
        missingPrerequisite={null}
        updateAvailable={false}
        changedSources={[]}
        onRecompute={vi.fn()}
        isRecomputing={false}
        canContinue={true}
        onContinue={vi.fn()}
        isNavigating={false}
        onExportPdf={vi.fn()}
        ideaId="idea_test_123"
      />
    );

    expect(screen.getByText('What to improve')).toBeInTheDocument();
    expect(screen.getByText('Concept clarity')).toBeInTheDocument();
    expect(screen.getByText('Market evidence')).toBeInTheDocument();
    expect(screen.getByText('Financial model')).toBeInTheDocument();
    expect(screen.getByText('Legal readiness')).toBeInTheDocument();
    expect(screen.getByText('Team credibility')).toBeInTheDocument();

    // Primary gap badge "Start here"
    expect(screen.getByText('Start here')).toBeInTheDocument();
    expect(screen.getByText('−8 points')).toBeInTheDocument();
    expect(screen.getByText('−3 points')).toBeInTheDocument();
  });

  it('renders Section 4 Project Documents with Business Plan Download button', () => {
    const onExportPdfMock = vi.fn();
    render(
      <InvestorReadinessFigmaFlow
        project={mockProject}
        readiness={mockReadiness}
        loading={false}
        missingPrerequisite={null}
        updateAvailable={false}
        changedSources={[]}
        onRecompute={vi.fn()}
        isRecomputing={false}
        canContinue={true}
        onContinue={vi.fn()}
        isNavigating={false}
        onExportPdf={onExportPdfMock}
        ideaId="idea_test_123"
      />
    );

    expect(screen.getByText('Your project documents')).toBeInTheDocument();
    expect(screen.getByText('Market study')).toBeInTheDocument();
    expect(screen.getByText('Business model')).toBeInTheDocument();
    expect(screen.getByText('Business plan')).toBeInTheDocument();
    expect(screen.getByText('Primary')).toBeInTheDocument();
    expect(screen.getByText('Financial forecast')).toBeInTheDocument();
    expect(screen.getByText('Company setup & team')).toBeInTheDocument();

    const downloadBtn = screen.getByRole('button', { name: /Download/i });
    fireEvent.click(downloadBtn);
    expect(onExportPdfMock).toHaveBeenCalledTimes(1);
  });

  it('renders Section 5 Phase 4 preview cards and Section 6 Footer actions', () => {
    const onContinueMock = vi.fn();
    render(
      <InvestorReadinessFigmaFlow
        project={mockProject}
        readiness={mockReadiness}
        loading={false}
        missingPrerequisite={null}
        updateAvailable={false}
        changedSources={[]}
        onRecompute={vi.fn()}
        isRecomputing={false}
        canContinue={true}
        onContinue={onContinueMock}
        isNavigating={false}
        onExportPdf={vi.fn()}
        ideaId="idea_test_123"
      />
    );

    // Section 5
    expect(screen.getByText('Next: shape your offer')).toBeInTheDocument();
    expect(screen.getByText('STEP 01')).toBeInTheDocument();
    expect(screen.getByText('Pricing')).toBeInTheDocument();
    expect(screen.getByText('STEP 02')).toBeInTheDocument();
    expect(screen.getByText('Resources')).toBeInTheDocument();
    expect(screen.getByText('STEP 03')).toBeInTheDocument();
    expect(screen.getByText('Go-to-market')).toBeInTheDocument();

    // Section 6
    expect(screen.getByText('Back to business plan')).toBeInTheDocument();
    expect(screen.getByText('Save & go to dashboard')).toBeInTheDocument();
    const continueBtn = screen.getByRole('button', { name: /Continue to Phase 4/i });
    expect(continueBtn).toBeEnabled();
    fireEvent.click(continueBtn);
    expect(onContinueMock).toHaveBeenCalledTimes(1);
  });
});
