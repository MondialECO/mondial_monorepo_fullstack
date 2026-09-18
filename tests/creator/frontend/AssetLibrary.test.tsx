import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AssetLibraryPage from '@/app/dashboard/creator/asset-library/page';
import * as creatorJourneyApiModule from '@/lib/api-creator-journey';
import * as brandKitApiModule from '@/lib/api-creator-brand-kit';
import * as creatorAiApiModule from '@/lib/api-creator-ai';
import * as brandKitExportModule from '@/lib/brand-kit-export';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@/providers/CreatorProgressProvider', () => ({
  useCreatorProgress: () => ({
    state: { activeIdeaId: 'idea-mock-123' },
    isLoading: false,
  }),
}));

vi.mock('@/lib/brand-kit-export', () => ({
  exportBrandKitZip: vi.fn().mockResolvedValue(undefined),
}));

describe('AssetLibraryPage', () => {
  const mockPopulatedJourney = {
    journey: {
      id: 'j-1',
      userId: 'u-1',
      businessIdeaId: 'idea-mock-123',
      companyId: null,
      activeIdeaId: 'idea-mock-123',
      leveledUpIdeaId: null,
      ideaVersion: 1,
      project: {
        name: 'AutoInvoice',
        tagline: 'Automated ViDA e-invoicing for European SMBs',
        concept: 'SaaS',
        targetUser: 'SMB finance heads',
        problem: 'Complex VAT compliance',
        solution: 'Automated invoice validation',
        marketGap: 'Lack of self-serve PEPPOL integrations',
        sector: 'FinTech',
        geography: 'EU-27',
      },
      phase2Data: {
        clarifierSessionId: 'c-1',
      },
      phase3Data: {
        marketStudySessionId: 'session-ms-123',
        businessModelSessionId: 'session-bm-123',
        businessPlanSessionId: 'session-bp-123',
        forecastSessionId: 'session-fc-123',
        formationGenerator: { selectedOptionKey: 'sas_standard', confirmedAt: '2026-03-14T10:00:00Z' },
        legalChecklist: { items: [{ id: 'company-type', status: 'done' }], updatedAt: '2026-03-14T11:00:00Z' },
      },
      phase4Data: {},
      phase5Data: { chosenPath: null },
      phase6Data: {},
      outputSnapshots: {},
      createdAt: '2026-03-10T10:00:00Z',
      updatedAt: '2026-03-14T12:00:00Z',
    },
    computedStatus: {
      phase1: { status: 'completed', currentStep: 1 },
      phase2: { status: 'completed', currentStep: 3 },
      phase3: { status: 'completed', currentStep: 6 },
      phase4: { status: 'completed', currentStep: 1 },
      phase5: { status: 'available', currentStep: 1 },
      phase6: { status: 'locked', currentStep: 1 },
    },
  };

  const mockBrandKit = {
    isConfirmed: true,
    version: 1,
    updatedAt: '2026-03-12T10:00:00Z',
    strategy: { businessName: 'AutoInvoice' },
    logo: { selectedConceptKey: 'mark-1', variations: {} },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all 8 artifact cards when populated', async () => {
    vi.spyOn(creatorJourneyApiModule.creatorJourneyApi, 'get').mockResolvedValue(mockPopulatedJourney as any);
    vi.spyOn(brandKitApiModule.brandKitApi, 'getBrandKit').mockResolvedValue(mockBrandKit as any);

    render(<AssetLibraryPage />);

    // Header & Freshness notice
    expect(await screen.findByText('Creator Asset Library')).toBeInTheDocument();
    expect(screen.getByText(/All documents and exports are generated on demand from your project's current data./i)).toBeInTheDocument();

    // All 8 cards
    expect(screen.getByText('Brand Identity Kit')).toBeInTheDocument();
    expect(screen.getByText('Market Study & Sizing Funnel')).toBeInTheDocument();
    expect(screen.getByText('Business Model Canvas & Unit Economics')).toBeInTheDocument();
    expect(screen.getByText('Executive Business Plan')).toBeInTheDocument();
    expect(screen.getByText('Financial Forecast & Break-Even Model')).toBeInTheDocument();
    expect(screen.getByText('Corporate Formation & Skill Architecture')).toBeInTheDocument();
    expect(screen.getByText('Legal & Regulatory Compliance Checklist')).toBeInTheDocument();
    expect(screen.getByText('Investor Readiness & Offer Architecture')).toBeInTheDocument();

    // v1 Downloadable cards have action buttons
    expect(screen.getByRole('button', { name: /download zip/i })).toBeInTheDocument();
    const exportPdfButtons = screen.getAllByRole('button', { name: /export pdf/i });
    expect(exportPdfButtons.length).toBe(3); // Market study, Business Plan, Forecast

    // Non-downloadable cards display clear explanatory note
    expect(screen.getByText(/Document generated and accessible in project · Standalone PDF export is not yet supported for this format./i)).toBeInTheDocument();
  });

  it('lazily fetches Market Study and opens print overlay on click', async () => {
    const user = userEvent.setup();
    vi.spyOn(creatorJourneyApiModule.creatorJourneyApi, 'get').mockResolvedValue(mockPopulatedJourney as any);
    vi.spyOn(brandKitApiModule.brandKitApi, 'getBrandKit').mockResolvedValue(mockBrandKit as any);

    const mockStudyDetail = {
      sessionId: 'session-ms-123',
      status: 'Completed',
      output: {
        schemaVersion: 1,
        marketSizing: {
          tam: { value: 4200000000, currency: 'EUR', label: 'European SMBs' },
          sam: { value: 1880000000, currency: 'EUR', label: 'Direct fit' },
          som: { value: 204000000, currency: 'EUR', label: 'Capture cap' },
        },
      },
    };
    const getStudySpy = vi.spyOn(creatorAiApiModule.creatorAiApi, 'getMarketStudy').mockResolvedValue(mockStudyDetail as any);

    render(<AssetLibraryPage />);

    expect(await screen.findByText('Market Study & Sizing Funnel')).toBeInTheDocument();
    expect(getStudySpy).not.toHaveBeenCalled();

    const exportButtons = screen.getAllByRole('button', { name: /export pdf/i });
    await user.click(exportButtons[0]);

    expect(getStudySpy).toHaveBeenCalledWith('session-ms-123');
    expect(await screen.findByText(/Print \/ Save as PDF/i)).toBeInTheDocument();
  });

  it('triggers Brand Kit ZIP export on Download ZIP click', async () => {
    const user = userEvent.setup();
    vi.spyOn(creatorJourneyApiModule.creatorJourneyApi, 'get').mockResolvedValue(mockPopulatedJourney as any);
    vi.spyOn(brandKitApiModule.brandKitApi, 'getBrandKit').mockResolvedValue(mockBrandKit as any);

    render(<AssetLibraryPage />);

    const downloadZipBtn = await screen.findByRole('button', { name: /download zip/i });
    await user.click(downloadZipBtn);

    expect(brandKitExportModule.exportBrandKitZip).toHaveBeenCalledWith(mockBrandKit, 'AutoInvoice');
  });

  it('displays an on-screen error banner if Brand Kit ZIP export fails', async () => {
    const user = userEvent.setup();
    vi.spyOn(creatorJourneyApiModule.creatorJourneyApi, 'get').mockResolvedValue(mockPopulatedJourney as any);
    vi.spyOn(brandKitApiModule.brandKitApi, 'getBrandKit').mockResolvedValue(mockBrandKit as any);
    vi.mocked(brandKitExportModule.exportBrandKitZip).mockRejectedValueOnce(
      new Error('Failed to export brand kit: could not retrieve logo assets for primary (HTTP 404 Not Found).')
    );

    render(<AssetLibraryPage />);

    const downloadZipBtn = await screen.findByRole('button', { name: /download zip/i });
    await user.click(downloadZipBtn);

    expect(await screen.findByText(/Export Notice/i)).toBeInTheDocument();
    expect(screen.getByText(/could not retrieve logo assets for primary/i)).toBeInTheDocument();
  });

  it('renders quiet, informative empty state when no artifacts are produced yet', async () => {
    const emptyJourney = {
      journey: {
        ...mockPopulatedJourney.journey,
        phase3Data: {},
      },
      computedStatus: {
        phase1: { status: 'in_progress', currentStep: 1 },
        phase2: { status: 'locked', currentStep: 1 },
        phase3: { status: 'locked', currentStep: 1 },
        phase4: { status: 'locked', currentStep: 1 },
        phase5: { status: 'locked', currentStep: 1 },
        phase6: { status: 'locked', currentStep: 1 },
      },
    };

    vi.spyOn(creatorJourneyApiModule.creatorJourneyApi, 'get').mockResolvedValue(emptyJourney as any);
    vi.spyOn(brandKitApiModule.brandKitApi, 'getBrandKit').mockResolvedValue(null as any);

    render(<AssetLibraryPage />);

    expect(await screen.findByText('No project artifacts produced yet')).toBeInTheDocument();
    expect(screen.getByText(/Documents appear here automatically as you complete milestones across each phase/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go to active phase/i })).toBeInTheDocument();
  });
});
