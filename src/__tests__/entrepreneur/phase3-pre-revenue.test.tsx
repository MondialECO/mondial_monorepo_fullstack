import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Phase3RevenueInputClient } from '@/app/dashboard/entrepreneur/(phases)/phase-3/step-1/revenue-input-client';
import { Phase3FinancialDashboard } from '@/components/entrepreneur/phase3/Phase3FinancialDashboard';
import entrepreneurApi from '@/lib/api-entrepreneur';

// Mock useRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock useEntrepreneurProgress
const mockSavePhaseData = vi.fn();
const mockMoveToNextStep = vi.fn();
const mockApplyBackendResponse = vi.fn();
let mockPhaseData: Record<string, any> = { __companyId: 'comp-test-123' };
let mockActiveCompanyId: string | null = 'comp-test-123';

vi.mock('@/hooks/useEntrepreneurProgress', () => ({
  useEntrepreneurProgress: () => ({
    progress: {
      currentPhase: 3,
      currentStep: 1,
      completedSteps: new Set<string>(),
      completedPhases: [],
      overallProgressPercent: 25,
      isInvestorReady: false,
    },
    activeCompanyId: mockActiveCompanyId,
    savePhaseData: mockSavePhaseData,
    moveToNextStep: mockMoveToNextStep,
    getPhaseData: () => mockPhaseData,
    applyBackendResponse: mockApplyBackendResponse,
    currentPhase: 3,
  }),
}));

// Mock entrepreneurApi
vi.mock('@/lib/api-entrepreneur', () => ({
  default: {
    getCurrentPhase: vi.fn(),
    getFinancialSummary: vi.fn(),
    saveRevenue: vi.fn(),
    calculateValuation: vi.fn(),
    getQuarterlyRevenue: vi.fn(),
    getBeneficialOwners: vi.fn(),
    getKpiBaseline: vi.fn(),
    saveKpiBaseline: vi.fn(),
    saveConcept: vi.fn(),
    getConcept: vi.fn(),
    advancePhase: vi.fn(),
    getMonthlyRevenue: vi.fn(),
  },
}));

// Mock RouteGuard
vi.mock('@/components/entrepreneur/RouteGuard', () => ({
  RouteGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import Phase3Step3Page from '@/app/dashboard/entrepreneur/(phases)/phase-3/step-3/page';
import Phase3Step4Page from '@/app/dashboard/entrepreneur/(phases)/phase-3/step-4/page';

describe('Entrepreneur Phase 3 — Pre-Revenue Frontend Remediation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPhaseData = { __companyId: 'comp-test-123' };
    (entrepreneurApi.getCurrentPhase as any).mockResolvedValue({
      companyId: 'comp-test-123',
      currentPhase: 3,
      currentStep: 1,
      completedPhases: [],
      completedSteps: [],
      isInvestorReady: false,
    });
    (entrepreneurApi.getFinancialSummary as any).mockResolvedValue({
      totalRevenue: 0,
      finalValuation: 1200000,
      monthlyRecurringRevenue: 0,
      annualRecurringRevenue: 0,
      runwayMonths: 18,
      growthRate: 0,
      confidenceScore: 50,
      riskDiscountRate: 0.05,
      revenueMultiple: 0,
      industry: 'saas',
      lastUpdatedAt: new Date().toISOString(),
    });
    (entrepreneurApi.getQuarterlyRevenue as any).mockResolvedValue([
      { quarter: 'Q1', revenue: 0, monthCount: 3 },
      { quarter: 'Q2', revenue: 0, monthCount: 3 },
      { quarter: 'Q3', revenue: 0, monthCount: 3 },
      { quarter: 'Q4', revenue: 0, monthCount: 3 },
    ]);
    (entrepreneurApi.getMonthlyRevenue as any).mockResolvedValue([]);
    (entrepreneurApi.getBeneficialOwners as any).mockResolvedValue([]);
    (entrepreneurApi.saveRevenue as any).mockResolvedValue({ id: 'comp-test-123' });
    (entrepreneurApi.calculateValuation as any).mockResolvedValue({
      totalRevenue: 0,
      finalValuation: 1200000,
      confidenceScore: 50,
    });
    (entrepreneurApi.getKpiBaseline as any).mockResolvedValue({
      mrr: 0,
      arr: 0,
      cac: 0,
      ltv: 0,
      churnPercent: 0,
      burnRate: 5000,
      nps: 50,
    });
    (entrepreneurApi.saveKpiBaseline as any).mockResolvedValue({
      mrr: 0,
      arr: 0,
      cac: 0,
      ltv: 0,
      churnPercent: 0,
    });
    (entrepreneurApi.saveConcept as any).mockResolvedValue({
      oneLiner: 'Test pitch',
      problemStatement: 'Problem',
      solutionDescription: 'Solution',
    });
    (entrepreneurApi.advancePhase as any).mockResolvedValue({
      companyId: 'comp-test-123',
      currentPhase: 4,
      completedPhases: [1, 2, 3],
      overallProgressPercent: 50,
    });
  });

  it('Phase3_RevenueZero_IsAccepted: submits 0 revenue without error and navigates to Step 2', async () => {
    render(<Phase3RevenueInputClient />);

    // Inputs default to empty (which parses to 0 for pre-revenue)
    const saveButton = screen.getByRole('button', { name: /save & continue/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(entrepreneurApi.saveRevenue).toHaveBeenCalledWith('comp-test-123', {
        q1Revenue: 0,
        q2Revenue: 0,
        q3Revenue: 0,
        q4Revenue: 0,
      });
      expect(entrepreneurApi.calculateValuation).toHaveBeenCalledWith('comp-test-123');
      expect(mockMoveToNextStep).toHaveBeenCalledWith(3, 1);
      expect(mockPush).toHaveBeenCalledWith('/dashboard/entrepreneur/phase-3/step-2');
    });
  });

  it('Phase3_RevenueZero_ShowsPreRevenueState: displays Pre-Revenue Company indicator and helper text', async () => {
    render(<Phase3RevenueInputClient />);

    expect(screen.getByText('Pre-Revenue Company')).toBeDefined();
    expect(
      screen.getByText(/Revenue has not started yet\. You can still complete your financial baseline/i)
    ).toBeDefined();
    expect(screen.getByText('Pre-Revenue Baseline')).toBeDefined();
  });

  it('Phase3_MrrZero_IsAccepted: accepts MRR=0 and saves KPI baseline', async () => {
    render(<Phase3Step3Page />);

    // Wait for initial hydration
    await waitFor(() => {
      expect(screen.getByLabelText(/Monthly Recurring Revenue/i)).toBeDefined();
    });

    const mrrInput = screen.getByLabelText(/Monthly Recurring Revenue/i);
    const burnInput = screen.getByLabelText(/Monthly Burn Rate/i);
    const cacInput = screen.getByLabelText(/Customer Acquisition Cost/i);
    const ltvInput = screen.getByLabelText(/Lifetime Value/i);
    const churnInput = screen.getByLabelText(/Monthly Churn Rate/i);
    const npsInput = screen.getByLabelText(/Net Promoter Score/i);

    fireEvent.change(mrrInput, { target: { value: '0' } });
    fireEvent.change(burnInput, { target: { value: '5000' } });
    fireEvent.change(cacInput, { target: { value: '0' } });
    fireEvent.change(ltvInput, { target: { value: '0' } });
    fireEvent.change(churnInput, { target: { value: '0' } });
    fireEvent.change(npsInput, { target: { value: '50' } });

    const continueBtn = screen.getByRole('button', { name: /concept overview/i });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(entrepreneurApi.saveKpiBaseline).toHaveBeenCalledWith('comp-test-123', expect.objectContaining({
        mrr: 0,
        arr: 0,
        burnRate: 5000,
        cac: 0,
        ltv: 0,
        churnPercent: 0,
        nps: 50,
      }));
      expect(mockMoveToNextStep).toHaveBeenCalledWith(3, 3);
      expect(mockPush).toHaveBeenCalledWith('/dashboard/entrepreneur/phase-3/step-4');
    });
  });

  it('Phase3_NegativeMrr_IsRejected: shows actionable error when MRR is negative', async () => {
    render(<Phase3Step3Page />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Monthly Recurring Revenue/i)).toBeDefined();
    });

    const mrrInput = screen.getByLabelText(/Monthly Recurring Revenue/i);
    const burnInput = screen.getByLabelText(/Monthly Burn Rate/i);
    const cacInput = screen.getByLabelText(/Customer Acquisition Cost/i);
    const ltvInput = screen.getByLabelText(/Lifetime Value/i);
    const churnInput = screen.getByLabelText(/Monthly Churn Rate/i);
    const npsInput = screen.getByLabelText(/Net Promoter Score/i);

    fireEvent.change(mrrInput, { target: { value: '-500' } });
    fireEvent.change(burnInput, { target: { value: '5000' } });
    fireEvent.change(cacInput, { target: { value: '100' } });
    fireEvent.change(ltvInput, { target: { value: '1000' } });
    fireEvent.change(churnInput, { target: { value: '5' } });
    fireEvent.change(npsInput, { target: { value: '50' } });

    const continueBtn = screen.getByRole('button', { name: /concept overview/i });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByText('Monthly Recurring Revenue cannot be negative')).toBeDefined();
      expect(entrepreneurApi.saveKpiBaseline).not.toHaveBeenCalled();
    });
  });

  it('Phase3_DashboardZeroRevenue_ShowsEuroZero: renders €0 with Pre-Revenue chip when financial data exists with 0 revenue', async () => {
    render(<Phase3FinancialDashboard companyId="comp-test-123" />);

    await waitFor(() => {
      expect(screen.getByText('Annual revenue')).toBeDefined();
      expect(screen.getAllByText(/€0/i).length).toBeGreaterThan(0);
      expect(screen.getByText('Pre-Revenue')).toBeDefined();
    });
  });

  it('Phase3_DashboardMissingFinancialData_ShowsUnavailable: shows Data unavailable when financial summary is absent', async () => {
    (entrepreneurApi.getFinancialSummary as any).mockResolvedValue(null);

    render(<Phase3FinancialDashboard companyId="comp-test-123" />);

    await waitFor(() => {
      expect(screen.getAllByText('Data unavailable').length).toBeGreaterThan(0);
    });
  });

  it('Phase3_PreRevenue_CanProceedFromKpiStep: advances smoothly from Step 3 to Step 4 with 0 MRR', async () => {
    render(<Phase3Step3Page />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Monthly Recurring Revenue/i)).toBeDefined();
    });

    const mrrInput = screen.getByLabelText(/Monthly Recurring Revenue/i);
    const burnInput = screen.getByLabelText(/Monthly Burn Rate/i);
    const cacInput = screen.getByLabelText(/Customer Acquisition Cost/i);
    const ltvInput = screen.getByLabelText(/Lifetime Value/i);
    const churnInput = screen.getByLabelText(/Monthly Churn Rate/i);
    const npsInput = screen.getByLabelText(/Net Promoter Score/i);

    fireEvent.change(mrrInput, { target: { value: '0' } });
    fireEvent.change(burnInput, { target: { value: '2000' } });
    fireEvent.change(cacInput, { target: { value: '0' } });
    fireEvent.change(ltvInput, { target: { value: '0' } });
    fireEvent.change(churnInput, { target: { value: '0' } });
    fireEvent.change(npsInput, { target: { value: '80' } });

    const continueBtn = screen.getByRole('button', { name: /concept overview/i });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/entrepreneur/phase-3/step-4');
    });
  });

  it('Phase3_CompletionDoesNotRequirePositiveRevenue: completes Phase 3 and advances to Phase 4 for pre-revenue company', async () => {
    render(<Phase3Step4Page />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Elevator Pitch/i)).toBeDefined();
    });

    const pitch = screen.getByLabelText(/Elevator Pitch/i);
    const problem = screen.getByLabelText(/Problem Statement/i);
    const solution = screen.getByLabelText(/Solution/i);
    const market = screen.getByLabelText(/Target Market/i);
    const modelSelect = screen.getByLabelText(/Business Model/i);

    fireEvent.change(pitch, { target: { value: 'AI co-pilot for pre-revenue startups' } });
    fireEvent.change(problem, { target: { value: 'Founders lack institutional readiness' } });
    fireEvent.change(solution, { target: { value: 'Automated deal rooms and scorecard valuations' } });
    fireEvent.change(market, { target: { value: 'Early stage startups globally' } });
    fireEvent.change(modelSelect, { target: { value: 'B2B SaaS' } });

    const completeBtn = screen.getByRole('button', { name: /complete phase 3/i });
    fireEvent.click(completeBtn);

    await waitFor(() => {
      expect(entrepreneurApi.saveConcept).toHaveBeenCalledWith('comp-test-123', expect.objectContaining({
        oneLiner: 'AI co-pilot for pre-revenue startups',
        businessModel: 'B2B_SaaS',
      }));
      expect(entrepreneurApi.advancePhase).toHaveBeenCalledWith('comp-test-123', 3, {});
      expect(mockApplyBackendResponse).toHaveBeenCalled();
    });
  });

  it('Phase3_Step4_LongElevatorPitch_SucceedsWithout160CharLimit: saves and completes when pitch exceeds 160 characters', async () => {
    render(<Phase3Step4Page />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Elevator Pitch/i)).toBeDefined();
    });

    const pitch = screen.getByLabelText(/Elevator Pitch/i);
    const problem = screen.getByLabelText(/Problem Statement/i);
    const solution = screen.getByLabelText(/Solution/i);
    const market = screen.getByLabelText(/Target Market/i);
    const modelSelect = screen.getByLabelText(/Business Model/i);

    const longPitch = 'Our innovative deep-tech intelligence platform connects early-stage visionary founders with verified institutional investors through automated scorecard valuation algorithms, predictive cap table modelling, and continuous data continuity throughout the startup lifecycle.';
    expect(longPitch.length).toBeGreaterThan(160);

    fireEvent.change(pitch, { target: { value: longPitch } });
    fireEvent.change(problem, { target: { value: 'Founders lack institutional readiness' } });
    fireEvent.change(solution, { target: { value: 'Automated deal rooms and scorecard valuations' } });
    fireEvent.change(market, { target: { value: 'Early stage startups globally' } });
    fireEvent.change(modelSelect, { target: { value: 'B2B SaaS' } });

    // Assert that character counter shows long length without error
    expect(screen.getByText(new RegExp(`${longPitch.length} characters`))).toBeDefined();
    expect(screen.queryByText(/160 characters or fewer/i)).toBeNull();

    const completeBtn = screen.getByRole('button', { name: /complete phase 3/i });
    fireEvent.click(completeBtn);

    await waitFor(() => {
      expect(entrepreneurApi.saveConcept).toHaveBeenCalledWith('comp-test-123', expect.objectContaining({
        oneLiner: longPitch,
        businessModel: 'B2B_SaaS',
      }));
      expect(entrepreneurApi.advancePhase).toHaveBeenCalledWith('comp-test-123', 3, {});
      expect(mockApplyBackendResponse).toHaveBeenCalled();
    });
  });

  it('Phase3_Valuation_RendersBackendScorecardAndConfidence: renders valuation and confidence from API without fabrication', async () => {
    (entrepreneurApi.getFinancialSummary as any).mockResolvedValue({
      totalRevenue: 0,
      finalValuation: 1250000,
      confidenceScore: 55,
      riskDiscountRate: 0.05,
      revenueMultiple: 0,
    });

    render(<Phase3FinancialDashboard companyId="comp-test-123" />);

    await waitFor(() => {
      expect(screen.getAllByText(/€1\.3M/i).length).toBeGreaterThan(0);
    });
  });

  it('Phase3_Step1_DirectHydration: populates saved Q1-Q4 inputs on direct page mount', async () => {
    (entrepreneurApi.getQuarterlyRevenue as any).mockResolvedValue([
      { quarter: 'Q1', revenue: 11111 },
      { quarter: 'Q2', revenue: 22222 },
      { quarter: 'Q3', revenue: 33333 },
      { quarter: 'Q4', revenue: 44444 },
    ]);

    render(<Phase3RevenueInputClient />);

    await waitFor(() => {
      const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
      expect(inputs[0].value).toBe('11111');
      expect(inputs[1].value).toBe('22222');
      expect(inputs[2].value).toBe('33333');
      expect(inputs[3].value).toBe('44444');
    });
  });

  it('Phase3_Step3_DirectHydration: populates saved KPI inputs on direct page mount', async () => {
    (entrepreneurApi.getKpiBaseline as any).mockResolvedValue({
      mrr: 12000,
      arr: 144000,
      cac: 125,
      ltv: 1000,
      churnPercent: 4,
      burnRate: 5000,
      nps: 65,
    });

    render(<Phase3Step3Page />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('12000')).toBeDefined();
      expect(screen.getByDisplayValue('5000')).toBeDefined();
      expect(screen.getByDisplayValue('125')).toBeDefined();
      expect(screen.getByDisplayValue('1000')).toBeDefined();
      expect(screen.getByDisplayValue('4')).toBeDefined();
      expect(screen.getByDisplayValue('65')).toBeDefined();
    });
  });

  it('Phase3_Step4_DirectHydration: populates saved concept inputs on direct page mount', async () => {
    (entrepreneurApi.getConcept as any).mockResolvedValue({
      oneLiner: 'Entrepreneur edited runtime pitch',
      problemStatement: 'Entrepreneur runtime problem',
      solutionDescription: 'Entrepreneur runtime solution',
      sectorTags: ['FinTech', 'SaaS'],
      businessModel: 'B2B SaaS',
      stage: 'growth',
    });

    render(<Phase3Step4Page />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Entrepreneur edited runtime pitch')).toBeDefined();
      expect(screen.getByDisplayValue('Entrepreneur runtime problem')).toBeDefined();
      expect(screen.getByDisplayValue('Entrepreneur runtime solution')).toBeDefined();
    });
  });

  it('Phase3_Step1_ActiveCompanyPrecedence: uses activeCompanyId over stale localStorage __companyId', async () => {
    mockActiveCompanyId = '6a925d2b24449c0d08da4ab7';
    mockPhaseData = { __companyId: '6a92584724449c0d08da4a17' }; // stale old company id

    (entrepreneurApi.getCurrentPhase as any).mockResolvedValue({
      companyId: '6a925d2b24449c0d08da4ab7',
      currentPhase: 3,
      currentStep: 1,
      completedPhases: [],
      completedSteps: [],
      isInvestorReady: false,
    });

    (entrepreneurApi.saveRevenue as any).mockResolvedValue({} as any);
    (entrepreneurApi.calculateValuation as any).mockResolvedValue({} as any);

    render(<Phase3RevenueInputClient />);

    const nextBtn = screen.getByRole('button', { name: /Save & Continue/i });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(entrepreneurApi.saveRevenue).toHaveBeenCalledWith(
        '6a925d2b24449c0d08da4ab7',
        expect.anything()
      );
      expect(entrepreneurApi.saveRevenue).not.toHaveBeenCalledWith(
        '6a92584724449c0d08da4a17',
        expect.anything()
      );
    });
  });
});
