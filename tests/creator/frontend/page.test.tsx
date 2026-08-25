import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CreatorDocumentsPage from '@/app/dashboard/creator/documents/page';

const documentsApi = vi.hoisted(() => ({
  list: vi.fn(),
  download: vi.fn(),
}));

const progress = vi.hoisted(() => ({ activeIdeaId: 'idea-a' as string | null }));

vi.mock('@/lib/api-creator-documents', () => ({ creatorDocumentsApi: documentsApi }));
vi.mock('@/providers/CreatorProgressProvider', () => ({
  useCreatorProgress: () => ({ state: { activeIdeaId: progress.activeIdeaId } }),
}));

describe('Creator document vault', () => {
  beforeEach(() => {
    progress.activeIdeaId = 'idea-a';
    documentsApi.list.mockReset();
    documentsApi.download.mockReset();
  });

  it('shows an honest empty state and never the retired fake rows', async () => {
    documentsApi.list.mockResolvedValue([]);

    render(<CreatorDocumentsPage />);

    expect(await screen.findByText('No documents yet')).toBeInTheDocument();
    expect(screen.getByText('Documents generated for this idea will appear here.')).toBeInTheDocument();
    expect(screen.queryByText('B2B_SaaS_Business_Plan.pdf')).not.toBeInTheDocument();
    expect(screen.queryByText('3_Year_Financial_Forecast.xlsx')).not.toBeInTheDocument();
    expect(documentsApi.list).toHaveBeenCalledWith('idea-a');
  });

  it('renders actual document metadata and omits an unknown size', async () => {
    documentsApi.list.mockResolvedValue([{
      id: 'plan-a',
      documentType: 'business_plan',
      title: 'Business plan export',
      fileName: 'business-plan.pdf',
      mimeType: 'application/pdf',
      sizeBytes: null,
      sourceModule: 'business-plan',
      createdAt: '2026-08-25T00:00:00.000Z',
      updatedAt: '2026-08-25T00:00:00.000Z',
      downloadable: true,
    }]);

    render(<CreatorDocumentsPage />);

    expect(await screen.findByText('Business plan export')).toBeInTheDocument();
    const metadata = screen.getByText('Business Plan').parentElement?.textContent ?? '';
    expect(metadata).toContain('Aug 25, 2026');
    expect(metadata).not.toMatch(/\b(?:B|KB|MB)\b/);
  });

  it('shows a retryable error instead of mock documents when the request fails', async () => {
    documentsApi.list.mockRejectedValueOnce(new Error('Network down')).mockResolvedValueOnce([]);

    render(<CreatorDocumentsPage />);

    expect(await screen.findByText('Network down')).toBeInTheDocument();
    expect(screen.queryByText('B2B_SaaS_Business_Plan.pdf')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(documentsApi.list).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('No documents yet')).toBeInTheDocument();
  });
});
