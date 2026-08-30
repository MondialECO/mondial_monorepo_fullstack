import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import Phase6Page from '@/app/dashboard/entrepreneur/(phases)/phase-6/page';
import entrepreneurApi, {
  DataRoomDocumentResponse,
  DataRoomStatusResponse,
} from '@/lib/api-entrepreneur';
import * as providerModule from '@/providers/EntrepreneurProgressProvider';

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => '/dashboard/entrepreneur/phase-6',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/components/entrepreneur/RouteGuard', () => ({
  RouteGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Phase 6 — Founder Data Room Lifecycle & Remediation', () => {
  const mockProgressContext: providerModule.EntrepreneurProgressContextType = {
    progress: {
      companyId: 'comp-666',
      currentPhase: 6,
      currentStep: 1,
      completedPhases: new Set([1, 2, 3, 4, 5]),
      completedSteps: new Set(),
      phaseData: {},
      trustScore: 75,
      lastUpdated: Date.now(),
    },
    isLoading: false,
    backendFetchFailed: false,
    currentPhase: 6,
    currentStep: 1,
    trustScore: 75,
    companies: [
      {
        id: 'comp-666',
        companyName: 'Apex Robotics',
        currentPhase: 6,
        currentStep: 1,
        completedPhases: [1, 2, 3, 4, 5],
        source: 'direct',
        role: 'Founder',
        lastUpdated: Date.now(),
      },
    ],
    activeCompany: {
      id: 'comp-666',
      companyName: 'Apex Robotics',
      currentPhase: 6,
      currentStep: 1,
      completedPhases: [1, 2, 3, 4, 5],
      source: 'direct',
      role: 'Founder',
      lastUpdated: Date.now(),
    },
    activeCompanyId: 'comp-666',
    setActiveCompanyId: vi.fn(),
    canAdvanceToPhase: vi.fn().mockReturnValue(true),
    savePhaseData: vi.fn(),
    getPhaseData: vi.fn().mockReturnValue({ __companyId: 'comp-666' }),
    moveToNextStep: vi.fn(),
    applyBackendResponse: vi.fn(),
    refreshProgress: vi.fn(),
  };

  const initialStatus: DataRoomStatusResponse = {
    isLive: false,
    ndaRequired: true,
    ndaLockedAt: null,
    totalDocuments: 3,
    documents: [
      {
        documentId: 'doc-legal-1',
        title: 'Articles of Incorporation',
        category: 'legal',
        status: 'published',
        uploadedAt: new Date().toISOString(),
        viewCount: 2,
        downloadCount: 1,
        fileName: 'articles.pdf',
        mimeType: 'application/pdf',
        fileSize: 1048576,
      },
      {
        documentId: 'doc-fin-1',
        title: 'Financial Projections 2026',
        category: 'financial',
        status: 'published',
        uploadedAt: new Date().toISOString(),
        viewCount: 5,
        downloadCount: 3,
        fileName: 'projections.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileSize: 2097152,
      },
      {
        documentId: 'doc-biz-1',
        title: 'Business Plan V3',
        category: 'business',
        status: 'published',
        uploadedAt: new Date().toISOString(),
        viewCount: 1,
        downloadCount: 0,
        fileName: 'bizplan.pdf',
        mimeType: 'application/pdf',
        fileSize: 3145728,
      },
    ],
    accessGrants: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(providerModule, 'useEntrepreneurProgress').mockReturnValue(mockProgressContext);
    vi.spyOn(entrepreneurApi, 'getCurrentPhase').mockResolvedValue({
      currentPhase: 6,
      currentStep: 1,
      completedPhases: [1, 2, 3, 4, 5],
      trustScore: 75,
      companyId: 'comp-666',
    } as any);
    vi.spyOn(entrepreneurApi, 'getDataRoom').mockResolvedValue(initialStatus);
    vi.spyOn(entrepreneurApi, 'uploadDataRoomDocument').mockResolvedValue({
      documentId: 'doc-new-1',
      title: 'New Doc',
      category: 'legal',
      status: 'draft',
      uploadedAt: new Date().toISOString(),
      viewCount: 0,
      downloadCount: 0,
      fileName: 'new.pdf',
      fileSize: 1024,
    });
    vi.spyOn(entrepreneurApi, 'deleteDataRoomDocument').mockResolvedValue({
      ...initialStatus,
      totalDocuments: 2,
      documents: initialStatus.documents.filter((d) => d.documentId !== 'doc-legal-1'),
    });
    vi.spyOn(entrepreneurApi, 'replaceDataRoomDocument').mockResolvedValue({
      documentId: 'doc-legal-replaced',
      title: 'Updated Articles',
      category: 'legal',
      status: 'draft',
      uploadedAt: new Date().toISOString(),
      viewCount: 0,
      downloadCount: 0,
      fileName: 'updated_articles.pdf',
      fileSize: 2048,
    });
    vi.spyOn(entrepreneurApi, 'updateNdaRequirement').mockResolvedValue({} as any);
    vi.spyOn(entrepreneurApi, 'publishDataRoom').mockResolvedValue({
      ...initialStatus,
      isLive: true,
    });
    vi.spyOn(entrepreneurApi, 'advancePhase').mockResolvedValue({
      currentPhase: 7,
      currentStep: 1,
      completedPhases: [1, 2, 3, 4, 5, 6],
      trustScore: 80,
    } as any);
  });

  it('renders Phase 6 Data Room dashboard with loaded documents and 100% readiness', async () => {
    render(<Phase6Page />);
    await waitFor(() => {
      expect(screen.getByText(/Data Room Readiness/i)).toBeInTheDocument();
    });
    expect(screen.getAllByText('100%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('articles.pdf')).toBeInTheDocument();
  });

  it('opens confirmation modal and deletes document on confirm', async () => {
    render(<Phase6Page />);
    await waitFor(() => {
      expect(screen.getByText('articles.pdf')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByLabelText(/Delete articles\.pdf/i);
    fireEvent.click(deleteBtn);

    // Confirmation dialog appears with real file name and category
    await waitFor(() => {
      expect(screen.getByText('Delete document?')).toBeInTheDocument();
      expect(screen.getByText(/This document will be removed from the investor data room/i)).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole('button', { name: 'Delete Document' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(entrepreneurApi.deleteDataRoomDocument).toHaveBeenCalledWith('comp-666', 'doc-legal-1');
    });
  });

  it('cancels deletion when Cancel button is clicked', async () => {
    render(<Phase6Page />);
    await waitFor(() => {
      expect(screen.getByText('articles.pdf')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByLabelText(/Delete articles\.pdf/i);
    fireEvent.click(deleteBtn);

    expect(screen.getByText('Delete document?')).toBeInTheDocument();
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByText('Delete document?')).not.toBeInTheDocument();
    });
    expect(entrepreneurApi.deleteDataRoomDocument).not.toHaveBeenCalled();
  });

  it('toggles NDA requirement setting', async () => {
    render(<Phase6Page />);
    await waitFor(() => {
      expect(screen.getByText(/NDA required/i)).toBeInTheDocument();
    });

    const switches = screen.getAllByRole('switch');
    const ndaSwitch = switches[0];
    fireEvent.click(ndaSwitch);

    await waitFor(() => {
      expect(entrepreneurApi.updateNdaRequirement).toHaveBeenCalledWith('comp-666', false);
    });
  });

  it('submits and completes Phase 6 advancing to Phase 7', async () => {
    render(<Phase6Page />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Publish & Complete Phase 6/i })).toBeInTheDocument();
    });

    const completeBtn = screen.getByRole('button', { name: /Publish & Complete Phase 6/i });
    expect(completeBtn).not.toBeDisabled();
    fireEvent.click(completeBtn);

    await waitFor(() => {
      expect(entrepreneurApi.publishDataRoom).toHaveBeenCalledWith('comp-666');
      expect(entrepreneurApi.advancePhase).toHaveBeenCalledWith('comp-666', 6, {});
      expect(mockPush).toHaveBeenCalledWith('/dashboard/entrepreneur/phase-6/complete');
    });
  });

  it('disables complete button when required categories are missing', async () => {
    vi.spyOn(entrepreneurApi, 'getDataRoom').mockResolvedValue({
      isLive: false,
      ndaRequired: true,
      ndaLockedAt: null,
      totalDocuments: 1,
      documents: [
        {
          documentId: 'doc-legal-1',
          title: 'Articles',
          category: 'legal',
          status: 'draft',
          uploadedAt: new Date().toISOString(),
          fileName: 'articles.pdf',
          fileSize: 1024,
        },
      ],
      accessGrants: [],
    });

    render(<Phase6Page />);
    await waitFor(() => {
      expect(screen.getAllByText('33%').length).toBeGreaterThanOrEqual(1);
    });

    const completeBtn = screen.getByRole('button', { name: /Publish & Complete Phase 6/i });
    expect(completeBtn).toBeDisabled();
  });

  it('triggers replacement flow when Replace button is clicked', async () => {
    render(<Phase6Page />);
    await waitFor(() => {
      expect(screen.getByText('articles.pdf')).toBeInTheDocument();
    });

    const replaceBtns = screen.getAllByRole('button', { name: 'Replace' });
    expect(replaceBtns.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(replaceBtns[0]);
  });

  it('shows error message when delete action fails', async () => {
    render(<Phase6Page />);
    await waitFor(() => {
      expect(screen.getByText('articles.pdf')).toBeInTheDocument();
    });

    vi.spyOn(entrepreneurApi, 'deleteDataRoomDocument').mockRejectedValueOnce(new Error('Server deletion failed'));

    const deleteBtn = screen.getByLabelText(/Delete articles\.pdf/i);
    fireEvent.click(deleteBtn);

    const confirmBtn = screen.getByRole('button', { name: 'Delete Document' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText('Server deletion failed')).toBeInTheDocument();
    });
  });
});
