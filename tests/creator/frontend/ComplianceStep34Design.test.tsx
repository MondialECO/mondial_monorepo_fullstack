import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ComplianceWorkspacePage from '@/app/dashboard/creator/phase-3/compliance/page';
import * as creatorJourneyApiModule from '@/lib/api-creator-journey';
import * as creatorDocumentsApiModule from '@/lib/api-creator-documents';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockPush = vi.fn();
const mockCompleteStep = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams('ideaId=idea-123'),
  usePathname: () => '/dashboard/creator/phase-3/compliance',
}));

vi.mock('@/providers/CreatorProgressProvider', () => ({
  useCreatorProgress: () => ({
    state: { activeIdeaId: 'idea-123' },
    isLoading: false,
    completeStep: mockCompleteStep,
  }),
}));

describe('ComplianceWorkspacePage (Figma Node 57156:9158 Alignment)', () => {
  let queryClient: QueryClient;

  const mockOverview: creatorJourneyApiModule.LegalComplianceOverview = {
    hasAssessment: true,
    jurisdiction: 'FR',
    rulesVersion: 'FR-2026.1',
    planningReadinessPct: 75.0,
    isPotentiallyOutdated: false,
    detectedArchetypes: ['SaaS / Software Subscription', 'B2B Enterprise'],
    assessment: {
      id: 'assess-123',
      creatorIdeaId: 'idea-123',
      userId: 'user-123',
      jurisdiction: 'FR',
      rulesVersion: 'FR-2026.1',
      assessmentVersion: 1,
      businessSnapshotHash: 'hash-biz-123',
      isPotentiallyOutdated: false,
      evaluatedAt: new Date().toISOString(),
      planningReadinessPct: 75.0,
      detectedArchetypes: ['SaaS / Software Subscription', 'B2B Enterprise'],
      businessProfile: {
        isSaaS: { value: true, sourceSignal: 'concept' },
        isB2B: { value: true, sourceSignal: 'concept' },
        hasSubscription: { value: true, sourceSignal: 'pricing' },
      } as any,
      stageBreakdown: [
        {
          stage: 'before_creation',
          stageName: 'Before Company Creation',
          totalCount: 2,
          completedCount: 1,
          criticalCount: 1,
        },
        {
          stage: 'company_creation',
          stageName: 'Company Creation',
          totalCount: 1,
          completedCount: 1,
          criticalCount: 1,
        },
        {
          stage: 'ongoing',
          stageName: 'Ongoing Operations',
          totalCount: 1,
          completedCount: 0,
          criticalCount: 0,
        },
      ],
      items: [
        {
          id: 'FR-CORP-001',
          ruleId: 'FR-CORP-001',
          title: 'Deposit share capital into escrow',
          label: 'Deposit share capital into escrow',
          category: 'corporate',
          stage: 'before_creation',
          priority: 'critical',
          status: 'completed',
          whyItApplies: 'Mandatory before filing company incorporation in France.',
          requiresEvidence: true,
          evidenceDocType: 'capital_deposit_cert',
          evidenceLabel: 'Attestation de dépôt des fonds',
          officialSource: {
            authority: 'Service-Public.fr',
            title: 'Dépôt du capital social',
            url: 'https://service-public.fr/capital',
            sourceType: 'portal',
          },
        },
        {
          id: 'FR-IP-001',
          ruleId: 'FR-IP-001',
          title: 'Check business name rights and trademark',
          label: 'Check business name rights and trademark',
          category: 'intellectual_property',
          stage: 'before_creation',
          priority: 'recommended',
          status: 'not_started',
          whyItApplies: 'Verify that your brand name is not already registered in France.',
          requiresEvidence: false,
          officialSource: {
            authority: 'INPI',
            title: 'Base Marques & Noms',
            url: 'https://inpi.fr',
            sourceType: 'portal',
          },
        },
        {
          id: 'FR-CORP-004',
          ruleId: 'FR-CORP-004',
          title: 'Company registration via Guichet Unique (INPI)',
          label: 'Company registration via Guichet Unique (INPI)',
          category: 'corporate',
          stage: 'company_creation',
          priority: 'critical',
          status: 'completed',
          whyItApplies: 'Formal legal immatriculation for obtaining SIREN and Kbis.',
          requiresEvidence: true,
          officialSource: {
            authority: 'INPI Guichet Unique',
            title: 'Formalités d’entreprises',
            url: 'https://formalites.entreprises.gouv.fr',
            sourceType: 'portal',
          },
        },
        {
          id: 'FR-INS-001',
          ruleId: 'FR-INS-001',
          title: 'Underwrite professional liability insurance (RC Pro)',
          label: 'Underwrite professional liability insurance (RC Pro)',
          category: 'operations',
          stage: 'ongoing',
          priority: 'recommended',
          status: 'not_started',
          whyItApplies: 'Protects against operational liabilities and customer disputes.',
          requiresEvidence: false,
          officialSource: {
            authority: 'Service-Public.fr',
            title: 'Assurance professionnelle',
            url: 'https://service-public.fr/rc-pro',
            sourceType: 'portal',
          },
        },
      ],
      evaluationTraces: [],
      evidenceLinks: [],
      evidenceAuditTrail: [],
      disclaimer: 'Planning guidance only.',
    } as any,
    stageBreakdown: [],
    officialSources: [],
    evidenceLinks: [],
    evidenceAuditTrail: [],
    disclaimer: 'Planning guidance only.',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    vi.spyOn(creatorJourneyApiModule.creatorJourneyApi, 'getLegalOverview').mockResolvedValue(
      mockOverview
    );
    vi.spyOn(creatorJourneyApiModule.creatorJourneyApi, 'updateLegalItemStatus').mockResolvedValue({
      itemId: 'FR-IP-001',
      status: 'completed',
      planningReadinessPct: 100,
    });
    vi.spyOn(creatorDocumentsApiModule.creatorDocumentsApi, 'list').mockResolvedValue([]);
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ComplianceWorkspacePage />
      </QueryClientProvider>
    );
  };

  it('renders all 6 canonical sections matching Figma Node 57156:9158', async () => {
    renderComponent();

    // Section 1: Short Introduction
    await waitFor(() => {
      expect(
        screen.getByText(/Let’s make the legal side of your project easier to understand\./i)
      ).toBeDefined();
    });

    // Section 2: Roadmap summary card
    expect(screen.getByText('Your legal roadmap is ready.')).toBeDefined();
    expect(
      screen.getByText(
        /Here’s what to prepare before registration, launch and day-to-day operations/i
      )
    ).toBeDefined();

    // Section 3: Recommended next action card
    expect(screen.getByText('START HERE')).toBeDefined();
    expect(
      screen.getAllByText('Check business name rights and trademark').length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /Review this step/i })).toBeDefined();

    // Section 4: About your project card
    expect(screen.getByText('About your project')).toBeDefined();
    expect(
      screen.getByText(/You’re planning an online subscription service in France/i)
    ).toBeDefined();
    expect(screen.getByRole('button', { name: /Update your project details/i })).toBeDefined();

    // Section 5: Checklist stage section
    expect(screen.getByText('Your steps, organised by stage')).toBeDefined();
    expect(
      screen.getByText(/Open a step to see why it matters, when to handle it and what to do\./i)
    ).toBeDefined();
    expect(screen.getByText('Before you register')).toBeDefined();
    expect(screen.getByText('Register & prepare to launch')).toBeDefined();
    expect(screen.getByText('Running your business')).toBeDefined();
    expect(
      screen.getByText(
        /Checkmarks record your progress; they do not represent legal verification by MBC\./i
      )
    ).toBeDefined();

    // Section 6: Footer reassurance & continuation
    expect(
      screen.getByText(/You can return to this roadmap as your project moves forward\./i)
    ).toBeDefined();
    expect(screen.getByRole('button', { name: /Save and continue/i })).toBeDefined();
  });

  it('renders "Marked done by you" badge for completed tasks', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Deposit share capital into escrow')).toBeDefined();
    });

    // Completed task has "Marked done by you" badge
    expect(screen.getByText('Marked done by you')).toBeDefined();
  });

  it('expands task accordion inline to reveal why, when, what, and official guidance', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText('Check business name rights and trademark').length).toBeGreaterThanOrEqual(2);
    });

    // Click task row inside Section 5 checklist to expand
    const taskTitles = screen.getAllByText('Check business name rights and trademark');
    fireEvent.click(taskTitles[taskTitles.length - 1]);

    // Verify expanded headings
    await waitFor(() => {
      expect(screen.getByText('WHY THIS APPLIES TO YOU')).toBeDefined();
      expect(screen.getByText('WHEN TO DO IT')).toBeDefined();
      expect(screen.getByText('WHAT TO DO')).toBeDefined();
      expect(screen.getByText('OFFICIAL GUIDANCE')).toBeDefined();
      expect(screen.getByText(/INPI — Base Marques & Noms/i)).toBeDefined();
      expect(screen.getByRole('link', { name: /Open the official guide/i })).toBeDefined();
    });
  });

  it('switches stage tabs and displays items filtered by stage', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Register & prepare to launch')).toBeDefined();
    });

    // Switch to "Register & prepare to launch"
    fireEvent.click(screen.getByText('Register & prepare to launch'));

    await waitFor(() => {
      expect(
        screen.getByText('Company registration via Guichet Unique (INPI)')
      ).toBeDefined();
    });

    // Switch to "Running your business"
    fireEvent.click(screen.getByText('Running your business'));

    await waitFor(() => {
      expect(
        screen.getByText('Underwrite professional liability insurance (RC Pro)')
      ).toBeDefined();
    });
  });

  it('advances to Step 3.5 Company Formation on "Save and continue"', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Save and continue/i })).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: /Save and continue/i }));

    expect(mockCompleteStep).toHaveBeenCalledWith(3, 4);
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('/dashboard/creator/phase-3/formation')
    );
  });
});
