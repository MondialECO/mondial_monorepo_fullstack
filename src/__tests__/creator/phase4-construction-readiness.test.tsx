import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConstructionReadinessView } from '@/components/creator/phase4/ConstructionReadinessView';
import type { ConstructionReadinessReview } from '@/types/creator/construction-readiness';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(''),
  useParams: () => ({}),
  usePathname: () => '/dashboard/creator/phase-4/readiness',
}));

const mockReview: ConstructionReadinessReview = {
  id: 'review-123',
  status: 'Preparation in progress',
  overallScore: null, // Nullable score per canon
  scoreStatus: 'NotCalculated',
  scoreAvailabilityExplanation: 'Review the available work and unresolved items below.',
  positionHeadline: 'Your plans and website draft are available. Technical delivery still needs to be confirmed.',
  currentActionGuidance: 'You can continue preparing customer conversations.',
  dependencyGuidance: 'Product construction depends on confirming suitable technical delivery support.',
  savedArtifactsCount: 6,
  artifacts: [
    {
      id: 'brand_kit',
      title: 'Brand Kit',
      status: 'Available',
      statusColor: 'emerald',
      description: 'Your project’s visual identity is available to use.',
      actionLabel: 'View Brand Kit',
      actionRoute: '/dashboard/creator/phase-2/brand-kit',
    },
    {
      id: 'financial_forecast',
      title: 'Financial Forecast',
      status: 'Generated',
      statusColor: 'blue',
      description: 'A planning forecast is available. Funding is not confirmed.',
      actionLabel: 'View forecast',
      actionRoute: '/dashboard/creator/phase-3/forecast',
    },
    {
      id: 'operational_roadmap',
      title: 'Operational Roadmap',
      status: 'Active',
      statusColor: 'emerald',
      description: 'Your work is organised. Tasks still need to be completed.',
      actionLabel: 'View roadmap',
      actionRoute: '/dashboard/creator/phase-4/roadmap',
    },
    {
      id: 'pricing_decision',
      title: 'Pricing Decision',
      status: 'Selected',
      statusColor: 'blue',
      description: '€15 per business / month. Customer payment evidence is not yet recorded.',
      actionLabel: 'View pricing',
      actionRoute: '/dashboard/creator/phase-4/pricing',
    },
    {
      id: 'launch_strategy',
      title: 'Launch Strategy',
      status: 'Saved',
      statusColor: 'blue',
      description: 'Start with customer conversations. Activities have not been recorded as completed.',
      actionLabel: 'View strategy',
      actionRoute: '/dashboard/creator/phase-4/gtm',
    },
    {
      id: 'launch_website',
      title: 'Launch Website',
      status: 'Draft available',
      statusColor: 'amber',
      description: 'Version 1 needs selection and a CTA destination.',
      actionLabel: 'View draft',
      actionRoute: '/dashboard/creator/phase-4/assets',
    },
  ],
  issues: [
    {
      id: 'issue_technical_delivery',
      priority: 'critical',
      title: 'Confirm how the product will be built',
      subtitle: 'Technical delivery support has not been confirmed.',
      badge: 'Critical priority',
      badgeColor: 'rose',
      whyItMatters: 'ClairDesk needs suitable development capability before product construction can proceed as planned.',
      whatIsAlreadyDecided: 'You selected Delegate for product development.',
      whatIsStillNeeded: 'Confirm suitable capability, availability, and a delivery arrangement that matches the work.',
      whatThisAffects: [
        'Building the initial product.',
        'Producing a usable demo.',
        'Scheduling later product-dependent launch activities.',
      ],
      connectedWork: 'Connected work: Prepare technical delivery brief',
      connectedTaskId: 'task-1',
      sourcesText: 'Sources: Needs & Requirements · Skills & Training · Operational Roadmap',
      actionLabel: 'Review technical delivery need',
      actionRoute: '/dashboard/creator/phase-4/needs',
      secondaryActionLabel: 'Open connected roadmap task',
      secondaryActionRoute: '/dashboard/creator/phase-4/roadmap?taskId=task-1',
    },
    {
      id: 'issue_website_cta',
      priority: 'medium',
      title: 'Connect your website’s main button',
      subtitle: '‘Express interest’ has no destination.',
      badge: 'Asset action',
      badgeColor: 'amber',
      whyItMatters: 'Visitors cannot use this action until a confirmed email address or existing link is added.',
      whatIsAlreadyDecided: 'You included a CTA button.',
      whatIsStillNeeded: 'Provide destination email or link.',
      whatThisAffects: ['Conversion'],
      actionLabel: 'Open Launch Assets',
      actionRoute: '/dashboard/creator/phase-4/assets',
    },
  ],
  nextAction: {
    type: 'Existing roadmap task',
    estimatedEffort: '1.5 hours',
    title: 'Prepare technical delivery brief',
    description:
      'Describe the work and expected result so you can review suitable technical support. This task is actionable and relates to your critical delivery need.',
    primaryActionLabel: 'Open roadmap task',
    primaryActionRoute: '/dashboard/creator/phase-4/roadmap?taskId=task-1',
    secondaryActionLabel: 'View roadmap',
    secondaryActionRoute: '/dashboard/creator/phase-4/roadmap',
    taskId: 'task-1',
  },
  reviewedAt: null,
  evaluatedAt: '2026-09-27T12:00:00Z',
  policyVersion: '2026.1-construction-readiness',
  sourceFingerprint: 'fp-123',
};

describe('ConstructionReadinessView', () => {
  it('renders all 7 Figma sections in canonical order', () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);

    render(
      <ConstructionReadinessView
        ideaId="idea-abc"
        projectName="ClairDesk"
        review={mockReview}
        isSaved={false}
        onSaveReview={handleSave}
      />
    );

    // Section 1: Compact Assessment Summary
    expect(screen.getByText('YOUR CURRENT POSITION')).toBeInTheDocument();
    expect(screen.getByText('Score not yet calculated')).toBeInTheDocument();

    // Section 2: What you already have
    expect(screen.getByText('What you already have')).toBeInTheDocument();
    expect(screen.getByText('6 saved artefacts')).toBeInTheDocument();
    expect(screen.getByText('Brand Kit')).toBeInTheDocument();
    expect(screen.getByText('Financial Forecast')).toBeInTheDocument();
    expect(screen.getByText('Operational Roadmap')).toBeInTheDocument();
    expect(screen.getByText('Pricing Decision')).toBeInTheDocument();
    expect(screen.getByText('Launch Strategy')).toBeInTheDocument();
    expect(screen.getByText('Launch Website')).toBeInTheDocument();

    // Section 3: What needs attention
    expect(screen.getByText('What needs attention')).toBeInTheDocument();
    expect(screen.getByText('Confirm how the product will be built')).toBeInTheDocument();
    expect(screen.getByText('Critical priority')).toBeInTheDocument();
    expect(screen.getByText('WHY THIS MATTERS')).toBeInTheDocument();
    expect(screen.getByText('WHAT IS ALREADY DECIDED')).toBeInTheDocument();
    expect(screen.getByText('WHAT IS STILL NEEDED')).toBeInTheDocument();
    expect(screen.getByText('WHAT THIS AFFECTS')).toBeInTheDocument();

    // Section 4: Your next action
    expect(screen.getByText('YOUR NEXT ACTION')).toBeInTheDocument();
    expect(screen.getByText('Prepare technical delivery brief')).toBeInTheDocument();
    expect(screen.getByText(/Estimated effort: 1.5 hours/i)).toBeInTheDocument();

    // Section 5: Why this assessment?
    expect(screen.getByText('Why this assessment?')).toBeInTheDocument();
    expect(screen.getByText('Principle 1')).toBeInTheDocument();
    expect(screen.getByText('Principle 2')).toBeInTheDocument();
    expect(screen.getByText('Principle 3')).toBeInTheDocument();

    // Section 6: Continuing your work
    expect(screen.getByText('Keep building from your dashboard')).toBeInTheDocument();
    expect(screen.getByText('Saving this review does not mark unfinished work complete.')).toBeInTheDocument();

    // Section 7: Footer actions
    expect(screen.getByText('Back to Launch Assets')).toBeInTheDocument();
    expect(screen.getByText('Save review & go to dashboard')).toBeInTheDocument();
  });

  it('toggles the accordion in Section 5 with keyboard accessibility', () => {
    render(
      <ConstructionReadinessView
        ideaId="idea-abc"
        projectName="ClairDesk"
        review={mockReview}
        isSaved={false}
        onSaveReview={vi.fn()}
      />
    );

    const accordionBtn = screen.getByRole('button', { name: /Why this assessment\?/i });
    expect(accordionBtn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Principle 1')).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(accordionBtn);
    expect(accordionBtn).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Principle 1')).not.toBeInTheDocument();

    // Click to expand again
    fireEvent.click(accordionBtn);
    expect(accordionBtn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Principle 1')).toBeInTheDocument();
  });

  it('calls onSaveReview and navigates to dashboard on save click', async () => {
    pushMock.mockClear();
    const handleSave = vi.fn().mockResolvedValue(undefined);

    render(
      <ConstructionReadinessView
        ideaId="idea-abc"
        projectName="ClairDesk"
        review={mockReview}
        isSaved={false}
        onSaveReview={handleSave}
      />
    );

    const saveBtn = screen.getByRole('button', { name: /Save review & go to dashboard/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledTimes(1);
      expect(pushMock).toHaveBeenCalledWith('/dashboard/creator');
    });
  });

  it('displays error gracefully if saving fails and stays on the page', async () => {
    pushMock.mockClear();
    const handleSave = vi.fn().mockRejectedValue(new Error('Concurrency conflict: version changed'));

    render(
      <ConstructionReadinessView
        ideaId="idea-abc"
        projectName="ClairDesk"
        review={mockReview}
        isSaved={false}
        onSaveReview={handleSave}
      />
    );

    const saveBtn = screen.getByRole('button', { name: /Save review & go to dashboard/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledTimes(1);
      expect(pushMock).not.toHaveBeenCalled();
      expect(screen.getByText(/Concurrency conflict: version changed/i)).toBeInTheDocument();
    });
  });

  it('renders clean non-blocking state when no critical issues exist', () => {
    const readyReview: ConstructionReadinessReview = {
      ...mockReview,
      status: 'Ready for construction',
      positionHeadline: 'Your foundational plans, assets, and technical readiness are confirmed.',
      dependencyGuidance: 'No critical delivery blockers identified.',
      issues: [
        {
          id: 'issue_commercial_detail',
          priority: 'medium',
          title: 'Review the details of your offer',
          subtitle: 'Usage limits remain unconfirmed.',
          badge: 'Commercial detail',
          badgeColor: 'gray',
          whyItMatters: 'Review needed.',
          whatIsAlreadyDecided: 'Base price selected.',
          whatIsStillNeeded: 'Confirm terms.',
          whatThisAffects: ['Pricing terms.'],
          actionLabel: 'Review Pricing',
          actionRoute: '/dashboard/creator/phase-4/pricing',
        },
      ],
    };

    render(
      <ConstructionReadinessView
        ideaId="idea-abc"
        projectName="ClairDesk"
        review={readyReview}
        isSaved={true}
        onSaveReview={vi.fn()}
      />
    );

    expect(screen.getByText('Ready for construction')).toBeInTheDocument();
    expect(screen.getByText('No critical delivery blockers identified.')).toBeInTheDocument();
    expect(screen.queryByText('Critical priority')).not.toBeInTheDocument();
  });

  it('preserves ideaId parameter across all artifact and navigation links', () => {
    render(
      <ConstructionReadinessView
        ideaId="idea-999"
        projectName="ClairDesk"
        review={mockReview}
        isSaved={false}
        onSaveReview={vi.fn()}
      />
    );

    const brandLink = screen.getByText('View Brand Kit').closest('a');
    expect(brandLink).toHaveAttribute('href', expect.stringContaining('ideaId=idea-999'));

    const backLink = screen.getByText('Back to Launch Assets').closest('a');
    expect(backLink).toHaveAttribute('href', expect.stringContaining('ideaId=idea-999'));
  });

  it('renders loading placeholder for count and neutral status during loading', () => {
    render(
      <ConstructionReadinessView
        ideaId="idea-loading"
        projectName="LoadingApp"
        review={null}
        isLoading={true}
        isSaved={false}
        onSaveReview={vi.fn()}
      />
    );

    expect(screen.getByText('...')).toBeInTheDocument();
    expect(screen.getByText('Evaluating...')).toBeInTheDocument();
    expect(screen.getByText('Evaluating saved project work and requirements...')).toBeInTheDocument();
  });

  it('renders genuine zero count accurately when review has 0 saved artifacts', () => {
    const zeroReview: ConstructionReadinessReview = {
      ...mockReview,
      savedArtifactsCount: 0,
      artifacts: mockReview.artifacts.map((a) => ({ ...a, status: 'Missing' })),
    };

    render(
      <ConstructionReadinessView
        ideaId="idea-zero"
        projectName="ZeroApp"
        review={zeroReview}
        isSaved={false}
        onSaveReview={vi.fn()}
      />
    );

    expect(screen.getByText('0 saved artefacts')).toBeInTheDocument();
  });

  it('omits estimated effort badge when task effort is null', () => {
    const noEffortReview: ConstructionReadinessReview = {
      ...mockReview,
      nextAction: {
        ...mockReview.nextAction!,
        estimatedEffort: undefined,
      },
    };

    render(
      <ConstructionReadinessView
        ideaId="idea-no-eff"
        projectName="NoEffortApp"
        review={noEffortReview}
        isSaved={false}
        onSaveReview={vi.fn()}
      />
    );

    expect(screen.queryByText(/Estimated effort/i)).not.toBeInTheDocument();
  });
});

