import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ConceptNamePage from '@/app/dashboard/creator/phase-2/concept-name/page';
import { creatorJourneyApi } from '@/lib/api-creator-journey';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const mockSetState = vi.fn();
const mockRefetch = vi.fn();

const defaultMockState = {
  activeIdeaId: 'idea-1',
  journeyState: {
    phase2: {
      nameSuggestions: ['NovaTech', 'Solaris', 'VentureX'],
      currentStep: 8,
    },
  },
  project: {
    name: '',
    tagline: '',
    concept: 'A cloud software for universities',
    solution: 'Cloud software platform',
    category: 'SaaS',
    exists: true,
  },
};

let mockProgressContext = {
  state: defaultMockState,
  isLoading: false,
  error: null,
  refetch: mockRefetch,
  setState: mockSetState,
};

vi.mock('@/providers/CreatorProgressProvider', () => ({
  useCreatorProgress: () => mockProgressContext,
}));

vi.mock('@/lib/api-creator-journey', () => ({
  creatorJourneyApi: {
    nameSuggestions: vi.fn().mockResolvedValue({ names: ['NovaTech', 'Solaris'] }),
    searchSimilarCompanies: vi.fn(),
    updateProject: vi.fn().mockResolvedValue({ journey: {}, computedStatus: {} }),
  },
}));

describe('ConceptNamePage - Company Search & Naming Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProgressContext = {
      state: JSON.parse(JSON.stringify(defaultMockState)),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      setState: mockSetState,
    };
  });

  it('renders "Check similar names" button disabled when no name is selected', () => {
    render(<ConceptNamePage />);
    const searchButton = screen.getByRole('button', { name: /Check similar names/i });
    expect(searchButton).toBeDisabled();
  });

  it('enables "Check similar names" when a suggested name is chosen', () => {
    render(<ConceptNamePage />);
    const suggestionCard = screen.getByText('NovaTech');
    fireEvent.click(suggestionCard);

    const searchButton = screen.getByRole('button', { name: /Check similar names/i });
    expect(searchButton).not.toBeDisabled();
  });

  it('performs company search and displays up to 5 matches with status, SIREN, and disclaimer', async () => {
    vi.mocked(creatorJourneyApi.searchSimilarCompanies).mockResolvedValueOnce({
      query: 'NovaTech',
      totalResults: 2,
      matches: [
        {
          siren: '123456789',
          name: 'NOVATECH SAS',
          postalCode: '75008',
          city: 'PARIS',
          activityCode: '62.01Z',
          status: 'active',
        },
        {
          siren: '987654321',
          name: 'NOVATECH SERVICES',
          postalCode: '69001',
          city: 'LYON',
          activityCode: '70.22Z',
          status: 'closed',
        },
      ],
    });

    render(<ConceptNamePage />);
    fireEvent.click(screen.getByText('NovaTech'));

    const searchButton = screen.getByRole('button', { name: /Check similar names/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Similar company names in France')).toBeInTheDocument();
      expect(screen.getByText('NOVATECH SAS')).toBeInTheDocument();
      expect(screen.getByText('SIREN: 123456789')).toBeInTheDocument();
      expect(screen.getByText('Location: 75008 PARIS')).toBeInTheDocument();
      expect(screen.getByText('Actif')).toBeInTheDocument();

      expect(screen.getByText('NOVATECH SERVICES')).toBeInTheDocument();
      expect(screen.getByText('Fermé')).toBeInTheDocument();

      expect(
        screen.getByText(
          'This search finds similar company names in France. It does not confirm trademark or name availability.',
        ),
      ).toBeInTheDocument();
    });
  });

  it('displays empty message when search returns 0 matches without blocking progression', async () => {
    vi.mocked(creatorJourneyApi.searchSimilarCompanies).mockResolvedValueOnce({
      query: 'Solaris',
      totalResults: 0,
      matches: [],
    });

    render(<ConceptNamePage />);
    fireEvent.click(screen.getByText('Solaris'));

    const searchButton = screen.getByRole('button', { name: /Check similar names/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('No matching companies were found in this search.')).toBeInTheDocument();
    });

    // Progression button remains enabled
    const continueBtn = screen.getByRole('button', { name: /Continue to Branding/i });
    expect(continueBtn).not.toBeDisabled();
  });

  it('displays error message when search fails, without blocking continuation', async () => {
    vi.mocked(creatorJourneyApi.searchSimilarCompanies).mockRejectedValueOnce(new Error('Network error'));

    render(<ConceptNamePage />);
    fireEvent.click(screen.getByText('NovaTech'));

    const searchButton = screen.getByRole('button', { name: /Check similar names/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(
        screen.getByText('We couldn’t check right now. You can continue and try again later.'),
      ).toBeInTheDocument();
    });

    // Progression button remains enabled
    const continueBtn = screen.getByRole('button', { name: /Continue to Branding/i });
    expect(continueBtn).not.toBeDisabled();
  });

  it('resets search results immediately when active name changes', async () => {
    vi.mocked(creatorJourneyApi.searchSimilarCompanies).mockResolvedValueOnce({
      query: 'NovaTech',
      totalResults: 1,
      matches: [{ siren: '123', name: 'NOVATECH', status: 'active' }],
    });

    render(<ConceptNamePage />);
    fireEvent.click(screen.getByText('NovaTech'));

    const searchButton = screen.getByRole('button', { name: /Check similar names/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('NOVATECH')).toBeInTheDocument();
    });

    // Switch to custom name -> results must clear immediately
    fireEvent.click(screen.getByText('I have my own custom name in mind'));

    expect(screen.queryByText('NOVATECH')).not.toBeInTheDocument();
    expect(screen.queryByTestId('company-search-results')).not.toBeInTheDocument();
  });

  it('allows user to continue without ever clicking check similar names', async () => {
    render(<ConceptNamePage />);
    fireEvent.click(screen.getByText('Solaris'));

    const continueBtn = screen.getByRole('button', { name: /Continue to Branding/i });
    expect(continueBtn).not.toBeDisabled();

    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(creatorJourneyApi.updateProject).toHaveBeenCalledWith({
        name: 'Solaris',
        tagline: expect.any(String),
        category: 'SaaS',
      });
      expect(mockPush).toHaveBeenCalledWith('/dashboard/creator/phase-2/branding');
    });
  });
});
