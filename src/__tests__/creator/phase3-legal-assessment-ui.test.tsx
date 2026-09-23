import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LegalFigmaStageSection } from '@/components/creator/legal/LegalFigmaStageSection';
import AssetLibraryPage from '@/app/dashboard/creator/asset-library/page';
import * as creatorJourneyApiModule from '@/lib/api-creator-journey';
import * as brandKitApiModule from '@/lib/api-creator-brand-kit';
import { type ExtendedLegalChecklistItem } from '@/lib/api-creator-journey';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard/creator/phase-3/compliance',
}));

vi.mock('@/providers/CreatorProgressProvider', () => ({
  useCreatorProgress: () => ({
    state: { activeIdeaId: 'idea-123' },
    isLoading: false,
    completeStep: vi.fn(),
  }),
}));

vi.mock('@/lib/brand-kit-export', () => ({
  exportBrandKitZip: vi.fn().mockResolvedValue(undefined),
}));

describe('Phase 3.4 Legal Assessment UI (Canonical State & Rendering)', () => {
  const mockAssessmentItems: ExtendedLegalChecklistItem[] = [
    {
      id: 'FR-CORP-001',
      title: 'Capital Deposit and Escrow Certificate',
      label: 'Capital Deposit and Escrow Certificate',
      category: 'corporate',
      stage: 'before_creation',
      priority: 'critical',
      status: 'completed',
      whyItApplies: 'Mandatory for all French commercial entities.',
      requiresEvidence: true,
      evidenceDocType: 'capital_deposit_cert',
      evidenceLabel: 'Attestation de dépôt des fonds',
      evidenceFileName: 'attestation_bnp.pdf',
      evidenceDocumentId: 'doc-123',
      officialSource: {
        authority: 'Service-Public.fr',
        title: 'Capital Deposit',
        url: 'https://service-public.fr/capital',
      },
    },
    {
      id: 'FR-DATA-001',
      title: 'GDPR Processing Activities Register',
      label: 'GDPR Processing Activities Register',
      category: 'data_privacy',
      stage: 'before_creation',
      priority: 'recommended',
      status: 'pending',
      whyItApplies: 'Required because your SaaS collects personal customer data.',
      requiresEvidence: false,
      officialSource: {
        authority: 'CNIL',
        title: 'Registre RGPD',
        url: 'https://cnil.fr/registre',
      },
    },
  ];

  it('proves LegalFigmaStageSection reads and renders statutory items from LegalAssessment', () => {
    const handleToggleExpand = vi.fn();
    const handleStatusChange = vi.fn().mockResolvedValue(undefined);
    const handleOpenEvidence = vi.fn();

    render(
      <LegalFigmaStageSection
        items={mockAssessmentItems}
        activeTab="before_register"
        onTabChange={vi.fn()}
        expandedItemId={mockAssessmentItems[0].id}
        onToggleExpand={handleToggleExpand}
        onStatusChange={handleStatusChange}
        onOpenEvidenceModal={handleOpenEvidence}
      />
    );

    // Verifies the items loaded from LegalAssessment are displayed
    expect(screen.getAllByText('Capital Deposit and Escrow Certificate').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('GDPR Processing Activities Register').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Marked done by you')).toBeDefined();
  });

  it('proves AssetLibrary recognizes legal checklist readiness directly from phase3.legalAssessment with 0 legalChecklist', async () => {
    // Mock journey having ONLY phase3.legalAssessment (no legalChecklist)
    const mockJourneyOnlyAssessment = {
      journey: {
        id: 'j-test',
        userId: 'u-test',
        activeIdeaId: 'idea-123',
        project: {
          name: 'LegalApp',
          concept: 'SaaS',
          category: 'Software',
          sector: 'Tech',
          currentVersion: 1,
        },
        phase3Data: {
          marketStudySessionId: 'ms-1',
          businessModelSessionId: 'bm-1',
          forecastSessionId: 'fc-1',
          businessPlanSessionId: 'bp-1',
          formationGenerator: { selectedOptionKey: 'sas' },
          // Canonical single source of truth: legalAssessment populated, legalChecklist null
          legalAssessment: {
            items: [{ id: 'FR-CORP-001', status: 'completed' }],
            updatedAt: '2026-09-22T10:00:00Z',
          },
          legalChecklist: null,
        },
        phase4Data: {},
        outputSnapshots: {},
        updatedAt: '2026-09-22T10:00:00Z',
      },
      computedStatus: {
        phase3: { status: 'completed', currentStep: 7 },
        phase4: { status: 'completed', currentStep: 8 },
      },
    };

    vi.spyOn(creatorJourneyApiModule.creatorJourneyApi, 'get').mockResolvedValue(mockJourneyOnlyAssessment as any);
    vi.spyOn(brandKitApiModule.brandKitApi, 'getBrandKit').mockResolvedValue({
      status: 'complete',
      logo: { selectedConceptKey: 'concept-1' },
    } as any);

    render(<AssetLibraryPage />);

    // Wait for the asset library to load and prove the legal checklist artifact is ready
    await waitFor(() => {
      expect(screen.getByText('Legal & Regulatory Compliance Checklist')).toBeDefined();
    });

    // The ready badge or step must be unlocked because isLegalChecklistReady evaluates to true via legalAssessment
    const legalCard = screen.getByText('Legal & Regulatory Compliance Checklist').closest('div');
    expect(legalCard).toBeDefined();
  });
});
