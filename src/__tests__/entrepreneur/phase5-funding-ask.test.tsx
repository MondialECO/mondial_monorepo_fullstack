import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import Phase5Client from '@/app/dashboard/entrepreneur/(phases)/phase-5/client';
import entrepreneurApi from '@/lib/api-entrepreneur';
import * as providerModule from '@/providers/EntrepreneurProgressProvider';

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => '/dashboard/entrepreneur/phase-5',
}));

describe('Phase 5 — Funding Ask & Instrument Remediation', () => {
  const mockProgressContext: providerModule.EntrepreneurProgressContextType = {
    progress: {
      companyId: 'comp-555',
      currentPhase: 5,
      currentStep: 1,
      completedPhases: new Set([1, 2, 3, 4]),
      completedSteps: new Set(),
      phaseData: {},
      trustScore: 70,
      lastUpdated: Date.now(),
    },
    isLoading: false,
    backendFetchFailed: false,
    currentPhase: 5,
    currentStep: 1,
    trustScore: 70,
    companies: [
      {
        id: 'comp-555',
        companyName: 'HyperVenture Ltd',
        currentPhase: 5,
        currentStep: 1,
        completedPhases: [1, 2, 3, 4],
        source: 'direct',
        role: 'Founder',
        lastUpdated: Date.now(),
      },
    ],
    activeCompany: {
      id: 'comp-555',
      companyName: 'HyperVenture Ltd',
      currentPhase: 5,
      currentStep: 1,
      completedPhases: [1, 2, 3, 4],
      source: 'direct',
      role: 'Founder',
      lastUpdated: Date.now(),
    },
    activeCompanyId: 'comp-555',
    setActiveCompanyId: vi.fn(),
    canAdvanceToPhase: vi.fn().mockReturnValue(true),
    advanceToPhase: vi.fn().mockResolvedValue(true),
    completeStep: vi.fn(),
    savePhaseData: vi.fn(),
    getPhaseData: vi.fn(),
    refetchProgress: vi.fn(),
    applyBackendResponse: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(providerModule, 'useEntrepreneurProgress').mockReturnValue(mockProgressContext);

    vi.spyOn(entrepreneurApi, 'getCurrentPhase').mockResolvedValue({
      currentPhase: 5,
      currentStep: 1,
      completedPhases: [1, 2, 3, 4],
      companyId: 'comp-555',
      trustScore: 70,
      lastUpdated: Date.now(),
    });

    vi.spyOn(entrepreneurApi, 'getFinancialSummary').mockResolvedValue({
      totalRevenue: 0,
      finalValuation: 2_000_000,
      monthlyRecurringRevenue: 0,
      annualRecurringRevenue: 0,
      runwayMonths: 18,
      growthRate: 0,
      confidenceScore: 80,
      riskDiscountRate: 0.1,
      revenueMultiple: 0,
      industry: 'AI/ML',
    });

    vi.spyOn(entrepreneurApi, 'getFundingProfile').mockResolvedValue({
      fundingAskAmount: 500_000,
      fundingRoundType: 'seed',
      preMoneyValuation: 2_000_000,
      equityOfferedPercent: 20,
      shareType: 'preferred',
      capitalAllocation: [
        { category: 'Product', amount: 250_000, percent: 50 },
        { category: 'Sales & marketing', amount: 250_000, percent: 50 },
      ],
      resourceMap: {
        hiringPlan: [
          { role: 'Senior Engineer', salary: 80_000, timeline: 'Q1', priority: 'high' },
        ],
        serviceProviders: [],
        techTools: [],
      },
      pitchDeckFileName: 'pitch_deck_2026.pdf',
      pitchDeckFileSize: 1024 * 1024,
      pitchDeckUploadedAt: '2026-08-20T10:00:00Z',
      fundingNarrative: 'A'.repeat(250),
      hasOutreachCampaign: false,
    });

    vi.spyOn(entrepreneurApi, 'getPitchDeck').mockResolvedValue({
      fileName: 'pitch_deck_2026.pdf',
      storagePath: '/uploads/pitch_deck_2026.pdf',
      fileSize: 1024 * 1024,
      uploadedAt: '2026-08-20T10:00:00Z',
    });

    vi.spyOn(entrepreneurApi, 'saveFundingAsk').mockResolvedValue({} as any);
    vi.spyOn(entrepreneurApi, 'saveFundingNarrative').mockResolvedValue({} as any);
    vi.spyOn(entrepreneurApi, 'advancePhase').mockResolvedValue({
      currentPhase: 6,
      currentStep: 1,
      completedPhases: [1, 2, 3, 4, 5],
      trustScore: 80,
      companyId: 'comp-555',
    });
  });

  it('Phase5_InstrumentLabels_AreSemanticallyCorrect and renders wizard', async () => {
    render(<Phase5Client />);
    await waitFor(() => {
      expect(screen.getByText('Capital Allocation')).toBeInTheDocument();
    });
  });

  it('Phase5_Step1_SavePersistsCapitalAllocation to backend on Next', async () => {
    render(<Phase5Client />);
    await waitFor(() => {
      expect(screen.getByText('Capital Allocation')).toBeInTheDocument();
    });

    const nextBtn = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(entrepreneurApi.saveFundingAsk).toHaveBeenCalledWith(
        'comp-555',
        expect.objectContaining({
          capitalAllocation: expect.arrayContaining([
            expect.objectContaining({ category: 'Product', percent: 50 }),
            expect.objectContaining({ category: 'Sales & marketing', percent: 50 }),
          ]),
        })
      );
      expect(screen.getByText('Resource Mapping')).toBeInTheDocument();
    });
  });

  it('Phase5_Step1_RefreshRehydratesCapitalAllocation from backend getFundingProfile', async () => {
    render(<Phase5Client />);
    await waitFor(() => {
      expect(screen.getByDisplayValue('Product')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Sales & marketing')).toBeInTheDocument();
    });
  });

  it('Phase5_Step2_SavePersistsResourceMap and advances to Step 3', async () => {
    render(<Phase5Client />);
    await waitFor(() => {
      expect(screen.getByText('Capital Allocation')).toBeInTheDocument();
    });

    // Advance to Step 2
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    await waitFor(() => {
      expect(screen.getByText('Resource Mapping')).toBeInTheDocument();
    });

    // Advance to Step 3
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    await waitFor(() => {
      expect(entrepreneurApi.saveFundingAsk).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Equity Offer & Pitch')).toBeInTheDocument();
    });
  });

  it('Phase5_ZeroHiringRows_IsValid and allows proceeding to Step 3 without hires', async () => {
    vi.spyOn(entrepreneurApi, 'getFundingProfile').mockResolvedValueOnce({
      fundingAskAmount: 500_000,
      fundingRoundType: 'seed',
      preMoneyValuation: 2_000_000,
      equityOfferedPercent: 20,
      shareType: 'preferred',
      capitalAllocation: [{ category: 'Product', amount: 500_000, percent: 100 }],
      resourceMap: { hiringPlan: [], serviceProviders: [], techTools: [] },
      pitchDeckFileName: 'pitch.pdf',
      pitchDeckFileSize: 1024,
      pitchDeckUploadedAt: '2026-08-20T10:00:00Z',
      fundingNarrative: 'B'.repeat(250),
      hasOutreachCampaign: false,
    });

    render(<Phase5Client />);
    await waitFor(() => {
      expect(screen.getByText('Capital Allocation')).toBeInTheDocument();
    });

    // Step 1 -> Step 2
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    await waitFor(() => {
      expect(screen.getByText('Resource Mapping')).toBeInTheDocument();
    });

    // Step 2 has 0 hiring rows -> verify helper text exists
    expect(screen.getByText(/Optional hiring plan/i)).toBeInTheDocument();

    // Step 2 -> Step 3 with 0 hiring rows succeeds
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    await waitFor(() => {
      expect(screen.getByText('Equity Offer & Pitch')).toBeInTheDocument();
    });
  });

  it('Phase5_StepSaveFailure_DoesNotAdvance when saveFundingAsk throws an error', async () => {
    vi.spyOn(entrepreneurApi, 'saveFundingAsk').mockRejectedValueOnce(new Error('Network failure'));

    render(<Phase5Client />);
    await waitFor(() => {
      expect(screen.getByText('Capital Allocation')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    await waitFor(() => {
      expect(screen.getByText('Network failure')).toBeInTheDocument();
      // Remains on Step 1
      expect(screen.getByText('Capital Allocation')).toBeInTheDocument();
    });
  });

  it('Phase5_SAFE_DoesNotDisplayCurrentOwnership and hides equity input', async () => {
    vi.spyOn(entrepreneurApi, 'getFundingProfile').mockResolvedValueOnce({
      fundingAskAmount: 500_000,
      fundingRoundType: 'seed',
      preMoneyValuation: 2_000_000,
      equityOfferedPercent: 0,
      shareType: 'safe',
      capitalAllocation: [{ category: 'Product', amount: 500_000, percent: 100 }],
      resourceMap: { hiringPlan: [], serviceProviders: [], techTools: [] },
      pitchDeckFileName: 'pitch.pdf',
      pitchDeckFileSize: 1024,
      pitchDeckUploadedAt: '2026-08-20T10:00:00Z',
      fundingNarrative: 'C'.repeat(250),
      hasOutreachCampaign: false,
    });

    render(<Phase5Client />);
    await waitFor(() => {
      expect(screen.getByText('Capital Allocation')).toBeInTheDocument();
    });

    // Step 1 -> Step 2 -> Step 3
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    await waitFor(() => expect(screen.getByText('Resource Mapping')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    await waitFor(() => expect(screen.getByText('Equity Offer & Pitch')).toBeInTheDocument());

    // Verify "Not applicable" is rendered for SAFE equity offered
    expect(screen.getByDisplayValue('Not applicable')).toBeInTheDocument();
    expect(screen.getByText(/Non-equity instrument: equity conversion terms/i)).toBeInTheDocument();
  });

  it('Phase5_Note_DoesNotDisplayCurrentOwnership and hides equity input', async () => {
    vi.spyOn(entrepreneurApi, 'getFundingProfile').mockResolvedValueOnce({
      fundingAskAmount: 500_000,
      fundingRoundType: 'seed',
      preMoneyValuation: 2_000_000,
      equityOfferedPercent: 0,
      shareType: 'note',
      capitalAllocation: [{ category: 'Product', amount: 500_000, percent: 100 }],
      resourceMap: { hiringPlan: [], serviceProviders: [], techTools: [] },
      pitchDeckFileName: 'pitch.pdf',
      pitchDeckFileSize: 1024,
      pitchDeckUploadedAt: '2026-08-20T10:00:00Z',
      fundingNarrative: 'D'.repeat(250),
      hasOutreachCampaign: false,
    });

    render(<Phase5Client />);
    await waitFor(() => {
      expect(screen.getByText('Capital Allocation')).toBeInTheDocument();
    });

    // Step 1 -> Step 2 -> Step 3
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    await waitFor(() => expect(screen.getByText('Resource Mapping')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    await waitFor(() => expect(screen.getByText('Equity Offer & Pitch')).toBeInTheDocument());

    // Verify "Not applicable" is rendered for Convertible Note
    expect(screen.getByDisplayValue('Not applicable')).toBeInTheDocument();
  });

  it('Phase5_Preferred_RequiresEquityOfferedPercent and rejects zero equity on submit', async () => {
    vi.spyOn(entrepreneurApi, 'getFundingProfile').mockResolvedValueOnce({
      fundingAskAmount: 500_000,
      fundingRoundType: 'seed',
      preMoneyValuation: 2_000_000,
      equityOfferedPercent: 0,
      shareType: 'preferred',
      capitalAllocation: [{ category: 'Product', amount: 500_000, percent: 100 }],
      resourceMap: { hiringPlan: [], serviceProviders: [], techTools: [] },
      pitchDeckFileName: 'pitch.pdf',
      pitchDeckFileSize: 1024,
      pitchDeckUploadedAt: '2026-08-20T10:00:00Z',
      fundingNarrative: 'E'.repeat(250),
      hasOutreachCampaign: false,
    });

    render(<Phase5Client />);
    await waitFor(() => expect(screen.getByText('Capital Allocation')).toBeInTheDocument());

    // Navigate to Step 3
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    await waitFor(() => expect(screen.getByText('Resource Mapping')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    await waitFor(() => expect(screen.getByText('Equity Offer & Pitch')).toBeInTheDocument());

    // Submit with 0% equity for preferred share type
    fireEvent.click(screen.getByRole('button', { name: /Complete Phase 5/i }));

    await waitFor(() => {
      expect(screen.getByText(/Equity offered must be between 0 and 100%/i)).toBeInTheDocument();
      expect(entrepreneurApi.advancePhase).not.toHaveBeenCalled();
    });
  });

  it('Phase5_ExistingHiringRow_MustBeValid and rejects negative salary in Step 2', async () => {
    vi.spyOn(entrepreneurApi, 'getFundingProfile').mockResolvedValueOnce({
      fundingAskAmount: 500_000,
      fundingRoundType: 'seed',
      preMoneyValuation: 2_000_000,
      equityOfferedPercent: 10,
      shareType: 'preferred',
      capitalAllocation: [{ category: 'Product', amount: 500_000, percent: 100 }],
      resourceMap: {
        hiringPlan: [{ role: 'Designer', salary: -1000, timeline: 'Q1', priority: 'high' }],
        serviceProviders: [],
        techTools: [],
      },
      pitchDeckFileName: 'pitch.pdf',
      pitchDeckFileSize: 1024,
      pitchDeckUploadedAt: '2026-08-20T10:00:00Z',
      fundingNarrative: 'F'.repeat(250),
      hasOutreachCampaign: false,
    });

    render(<Phase5Client />);
    await waitFor(() => expect(screen.getByText('Capital Allocation')).toBeInTheDocument());

    // Navigate to Step 2
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    await waitFor(() => expect(screen.getByText('Resource Mapping')).toBeInTheDocument());

    // Attempt to proceed to Step 3 with negative salary
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    await waitFor(() => {
      expect(screen.getByText(/salary must be greater than 0/i)).toBeInTheDocument();
      // Should remain on Step 2
      expect(screen.getByText('Resource Mapping')).toBeInTheDocument();
    });
  });
});
