import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InvestorPhase2Page from '@/app/dashboard/investor/phase-2/page';
import * as financeHooks from '@/hooks/queries/investor-finance';
import type { InvestorFinanceVerification } from '@/types/investor/finance';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/dashboard/investor/phase-2',
}));

// Mock react-query hook
vi.mock('@/hooks/queries/investor-finance', () => ({
  useInvestorFinanceVerification: vi.fn(),
  useSaveInvestorFinanceDraft: vi.fn(),
  useUploadInvestorFinanceDocument: vi.fn(),
  useDeleteInvestorFinanceDocument: vi.fn(),
  useSubmitInvestorFinanceVerification: vi.fn(),
}));

describe('Investor Phase 2 Finance Verification UI', () => {
  const mockRefetch = vi.fn();
  const mockMutateSave = vi.fn();
  const mockMutateUpload = vi.fn();
  const mockMutateDelete = vi.fn();
  const mockMutateSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(financeHooks.useSaveInvestorFinanceDraft).mockReturnValue({
      mutateAsync: mockMutateSave,
      isPending: false,
    } as any);
    vi.mocked(financeHooks.useUploadInvestorFinanceDocument).mockReturnValue({
      mutateAsync: mockMutateUpload,
      isPending: false,
    } as any);
    vi.mocked(financeHooks.useDeleteInvestorFinanceDocument).mockReturnValue({
      mutateAsync: mockMutateDelete,
      isPending: false,
    } as any);
    vi.mocked(financeHooks.useSubmitInvestorFinanceVerification).mockReturnValue({
      mutateAsync: mockMutateSubmit,
      isPending: false,
    } as any);
  });

  it('renders verified view with badge and public ticket range when status is verified', () => {
    const verifiedData: InvestorFinanceVerification = {
      id: 'ver-100',
      userId: 'user-1',
      investorId: 'inv-1',
      status: 'verified',
      financeVerified: true,
      investorType: 'angel',
      declaredAvailableCapital: 500000,
      minTicket: 25000,
      maxTicket: 100000,
      currency: 'EUR',
      deploymentPeriodMonths: 12,
      sourceOfFunds: ['Personal Savings'],
      sourceOfFundsExplanation: '',
      documents: [],
      reviewedAt: '2026-08-20T10:00:00Z',
      createdAt: '2026-08-20T10:00:00Z',
      updatedAt: '2026-08-20T10:00:00Z',
    };

    vi.mocked(financeHooks.useInvestorFinanceVerification).mockReturnValue({
      data: verifiedData,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as any);

    render(<InvestorPhase2Page />);

    expect(screen.getByText('Finance Verified')).toBeInTheDocument();
    expect(screen.getByText('Angel Investor')).toBeInTheDocument();
    expect(screen.getByText('€25,000 – €100,000')).toBeInTheDocument();
    expect(screen.getByText('12 Months')).toBeInTheDocument();
    expect(screen.getByText('Confidentiality Guarantee:')).toBeInTheDocument();
  });

  it('renders under review view when status is under_review', () => {
    const underReviewData: InvestorFinanceVerification = {
      id: 'ver-101',
      userId: 'user-1',
      investorId: 'inv-1',
      status: 'under_review',
      financeVerified: false,
      investorType: 'vc',
      declaredAvailableCapital: 2000000,
      minTicket: 50000,
      maxTicket: 250000,
      currency: 'EUR',
      deploymentPeriodMonths: 18,
      sourceOfFunds: ['Fund Capital'],
      sourceOfFundsExplanation: '',
      documents: [],
      submittedAt: '2026-08-28T14:30:00Z',
      createdAt: '2026-08-28T14:30:00Z',
      updatedAt: '2026-08-28T14:30:00Z',
    };

    vi.mocked(financeHooks.useInvestorFinanceVerification).mockReturnValue({
      data: underReviewData,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as any);

    render(<InvestorPhase2Page />);

    expect(screen.getByText('Finance Verification Under Review')).toBeInTheDocument();
    expect(screen.getByText('Review In Progress')).toBeInTheDocument();
    expect(screen.getByText('What can you do while under review?')).toBeInTheDocument();
  });

  it('renders needs_update view with reviewer note when update requested', () => {
    const needsUpdateData: InvestorFinanceVerification = {
      id: 'ver-102',
      userId: 'user-1',
      investorId: 'inv-1',
      status: 'needs_update',
      financeVerified: false,
      investorType: 'angel',
      declaredAvailableCapital: 300000,
      minTicket: 10000,
      maxTicket: 50000,
      currency: 'EUR',
      deploymentPeriodMonths: 12,
      sourceOfFunds: ['Personal Savings'],
      sourceOfFundsExplanation: '',
      documents: [],
      decisionReason: 'Please attach a bank statement from the last 3 months.',
      createdAt: '2026-08-27T10:00:00Z',
      updatedAt: '2026-08-28T10:00:00Z',
    };

    vi.mocked(financeHooks.useInvestorFinanceVerification).mockReturnValue({
      data: needsUpdateData,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as any);

    render(<InvestorPhase2Page />);

    expect(screen.getByText('Information Update Requested')).toBeInTheDocument();
    expect(screen.getByText('"Please attach a bank statement from the last 3 months."')).toBeInTheDocument();
    expect(screen.getByText('Update Documents & Resubmit')).toBeInTheDocument();
  });

  it('renders rejected view with decision reason when verification rejected', () => {
    const rejectedData: InvestorFinanceVerification = {
      id: 'ver-103',
      userId: 'user-1',
      investorId: 'inv-1',
      status: 'rejected',
      financeVerified: false,
      investorType: 'angel',
      declaredAvailableCapital: 100000,
      minTicket: 10000,
      maxTicket: 20000,
      currency: 'EUR',
      deploymentPeriodMonths: 12,
      sourceOfFunds: ['Personal Savings'],
      sourceOfFundsExplanation: '',
      documents: [],
      decisionReason: 'Uploaded document is unreadable.',
      createdAt: '2026-08-27T10:00:00Z',
      updatedAt: '2026-08-28T10:00:00Z',
    };

    vi.mocked(financeHooks.useInvestorFinanceVerification).mockReturnValue({
      data: rejectedData,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as any);

    render(<InvestorPhase2Page />);

    expect(screen.getByText('Finance Verification Not Approved')).toBeInTheDocument();
    expect(screen.getByText('"Uploaded document is unreadable."')).toBeInTheDocument();
    expect(screen.getByText('Submit New Verification')).toBeInTheDocument();
  });

  it('navigates through 5 steps of the wizard and submits successfully', async () => {
    const draftData: InvestorFinanceVerification = {
      id: 'ver-104',
      userId: 'user-1',
      investorId: 'inv-1',
      status: 'draft',
      financeVerified: false,
      investorType: 'angel',
      declaredAvailableCapital: 500000,
      minTicket: 25000,
      maxTicket: 100000,
      currency: 'EUR',
      deploymentPeriodMonths: 12,
      sourceOfFunds: ['Personal Savings'],
      sourceOfFundsExplanation: '',
      documents: [
        {
          documentId: 'doc-1',
          documentType: 'bank_statement',
          originalFilename: 'statement_july.pdf',
          mimeType: 'application/pdf',
          fileSize: 102400,
          uploadedAt: '2026-08-29T10:00:00Z',
          verificationStatus: 'pending',
        },
      ],
      createdAt: '2026-08-29T10:00:00Z',
      updatedAt: '2026-08-29T10:00:00Z',
    };

    vi.mocked(financeHooks.useInvestorFinanceVerification).mockReturnValue({
      data: draftData,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as any);

    render(<InvestorPhase2Page />);

    // Step 1: Classification
    expect(screen.getByText('Select Your Investor Classification')).toBeInTheDocument();
    const continueBtn = screen.getByText('Continue');
    fireEvent.click(continueBtn);

    // Step 2: Capacity
    expect(screen.getByText('Investment Capacity & Check Sizes')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Continue'));

    // Step 3: Source of Funds
    expect(screen.getByText('Source of Investment Funds')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Continue'));

    // Step 4: Supporting Evidence
    expect(screen.getByText('Supporting Financial Evidence')).toBeInTheDocument();
    expect(screen.getByText('statement_july.pdf')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Continue'));

    // Step 5: Review & Declaration
    expect(screen.getByText('Review & Legal Declaration')).toBeInTheDocument();
    expect(screen.getByText('Submit for Verification')).toBeInTheDocument();

    // Check declaration checkbox
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    // Click Submit
    const submitBtn = screen.getByText('Submit for Verification');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockMutateSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          investorType: 'angel',
          declaredAvailableCapital: 500000,
          minTicket: 25000,
          maxTicket: 100000,
          declarationConfirmed: true,
        })
      );
    });
  });
});
