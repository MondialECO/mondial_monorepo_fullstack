import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { LogoCreationModal } from '@/components/creator/brand-kit/LogoCreationModal';
import { brandKitApi } from '@/lib/api-creator-brand-kit';
import { BrandKit, BrandLogoConcept } from '@/types/creator/brand-kit';

const mockConcepts: BrandLogoConcept[] = [
  {
    key: 'concept_1',
    descriptorLine: 'Geometric interlocking letters',
    markAssetUri: '/brand-assets/logos/idea_123/concept_1_mark.svg',
    lockupAssetUri: '/brand-assets/logos/idea_123/concept_1_lockup.svg',
    regenerateCount: 0,
    parameters: { family: 'Monogram', descriptor: 'Alpha Monogram' },
  },
  {
    key: 'concept_2',
    descriptorLine: 'Rotating polygonal geometry',
    markAssetUri: '/brand-assets/logos/idea_123/concept_2_mark.svg',
    lockupAssetUri: '/brand-assets/logos/idea_123/concept_2_lockup.svg',
    regenerateCount: 1,
    parameters: { family: 'Geometric Abstract', descriptor: 'Hex Shield' },
  },
  {
    key: 'concept_3',
    descriptorLine: 'Shield badge with modern crest',
    markAssetUri: '/brand-assets/logos/idea_123/concept_3_mark.svg',
    lockupAssetUri: '/brand-assets/logos/idea_123/concept_3_lockup.svg',
    regenerateCount: 2,
    parameters: { family: 'Emblem', descriptor: 'Apex Emblem' },
  },
  {
    key: 'concept_4',
    descriptorLine: 'High-contrast typography mark',
    markAssetUri: '/brand-assets/logos/idea_123/concept_4_mark.svg',
    lockupAssetUri: '/brand-assets/logos/idea_123/concept_4_lockup.svg',
    regenerateCount: 3, // Exhausted
    parameters: { family: 'Wordmark', descriptor: 'Modern Wordmark' },
  },
  {
    key: 'concept_5',
    descriptorLine: 'Continuous single-weight line',
    markAssetUri: '/brand-assets/logos/idea_123/concept_5_mark.svg',
    lockupAssetUri: '/brand-assets/logos/idea_123/concept_5_lockup.svg',
    regenerateCount: 0,
    parameters: { family: 'Minimal Pictorial', descriptor: 'Zenith Line' },
  },
  {
    key: 'concept_6',
    descriptorLine: 'Fused symbol and typography',
    markAssetUri: '/brand-assets/logos/idea_123/concept_6_mark.svg',
    lockupAssetUri: '/brand-assets/logos/idea_123/concept_6_lockup.svg',
    regenerateCount: 0,
    parameters: { family: 'Combination Mark', descriptor: 'Dual Horizon' },
  },
];

const mockBrandKit: BrandKit = {
  ideaId: 'idea_123',
  userId: 'user_456',
  status: 'draft',
  currentStep: 4,
  version: 1,
  createdAt: '2026-09-15T00:00:00Z',
  updatedAt: '2026-09-15T00:00:00Z',
  logo: {
    concepts: mockConcepts,
    selectedConceptKey: null,
    regenerateCount: 0,
  },
};

vi.mock('@/lib/api-creator-brand-kit', () => ({
  brandKitApi: {
    getBrandKit: vi.fn(),
    generateLogoConcepts: vi.fn(),
    regenerateSingleLogoConcept: vi.fn(),
    patchLogo: vi.fn(),
  },
}));

describe('LogoCreationModal Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(brandKitApi.getBrandKit).mockResolvedValue(mockBrandKit);
  });

  it('renders 6 real concept cards with counters and descriptors', async () => {
    render(<LogoCreationModal ideaId="idea_123" initialKit={mockBrandKit} />);

    expect(screen.getByText('Select Your Brand Mark')).toBeDefined();
    expect(screen.getByText('Concept 1: Alpha Monogram')).toBeDefined();
    expect(screen.getByText('Concept 2: Hex Shield')).toBeDefined();
    expect(screen.getByText('Concept 4: Modern Wordmark')).toBeDefined();

    // Verify remaining counter formats (concepts 1, 5, 6 have 3/3 left)
    expect(screen.getAllByText('3/3 LEFT').length).toBe(3);
    expect(screen.getByText('2/3 LEFT')).toBeDefined(); // Concept 2 (1 used)
    expect(screen.getByText('1/3 LEFT')).toBeDefined(); // Concept 3 (2 used)
    expect(screen.getByText('0/3 LEFT')).toBeDefined(); // Concept 4 (3 used - exhausted amber chip)
  });

  it('switches view modes to invoice and 16px inspection', async () => {
    render(<LogoCreationModal ideaId="idea_123" initialKit={mockBrandKit} />);

    // Default is Mark only
    expect(screen.getByRole('button', { name: /Mark only/i })).toBeDefined();

    // Click "On an invoice"
    const invoiceBtn = screen.getByRole('button', { name: /On an invoice/i });
    fireEvent.click(invoiceBtn);

    await waitFor(() => {
      // Should find invoice context items
      expect(screen.getAllByText(/#INV-2026-0042/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/\$12,450\.00/i).length).toBeGreaterThan(0);
    });

    // Click "At 16px"
    const microBtn = screen.getByRole('button', { name: /At 16px/i });
    fireEvent.click(microBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/16×16px/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/4× Inspection/i).length).toBeGreaterThan(0);
    });
  });

  it('isolates single-concept regeneration and updates only target tile in place', async () => {
    const updatedConcept1: BrandLogoConcept = {
      ...mockConcepts[0],
      descriptorLine: 'Updated Geometric Monogram V2',
      regenerateCount: 1,
      parameters: { family: 'Monogram', descriptor: 'Alpha Monogram V2' },
    };

    const updatedKit: BrandKit = {
      ...mockBrandKit,
      version: 2,
      logo: {
        ...mockBrandKit.logo!,
        concepts: [updatedConcept1, ...mockConcepts.slice(1)],
      },
    };

    vi.mocked(brandKitApi.regenerateSingleLogoConcept).mockResolvedValue(updatedKit);

    render(<LogoCreationModal ideaId="idea_123" initialKit={mockBrandKit} />);

    // Find regenerate buttons
    const regenButtons = screen.getAllByRole('button', { name: /Regenerate/i });
    expect(regenButtons.length).toBe(6);

    // Concept 4 is exhausted, its button should be disabled
    expect(regenButtons[3]).toBeDisabled();

    // Click regenerate on concept 1
    fireEvent.click(regenButtons[0]);

    await waitFor(() => {
      expect(brandKitApi.regenerateSingleLogoConcept).toHaveBeenCalledWith('concept_1', 'idea_123', 1);
      expect(screen.getByText('Concept 1: Alpha Monogram V2')).toBeDefined();
      // Sibling concepts remain untouched
      expect(screen.getByText('Concept 2: Hex Shield')).toBeDefined();
      expect(screen.getByText('Concept 3: Apex Emblem')).toBeDefined();
    });
  });

  it('displays specific inline error message and top-up link on 402 Insufficient Credits', async () => {
    const error402 = {
      response: {
        status: 402,
        data: { message: 'Insufficient AI credits (2 credits required).' },
      },
    };

    vi.mocked(brandKitApi.regenerateSingleLogoConcept).mockRejectedValue(error402);

    render(<LogoCreationModal ideaId="idea_123" initialKit={mockBrandKit} />);

    const regenButtons = screen.getAllByRole('button', { name: /Regenerate/i });
    fireEvent.click(regenButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Insufficient AI credits \(2 credits required\)\./i)).toBeDefined();
      expect(screen.getByRole('link', { name: /Top up/i })).toBeDefined();
    });
  });

  it('selects a concept and enables confirm button to save selectedConceptKey', async () => {
    const onConfirmMock = vi.fn();
    const confirmedKit: BrandKit = {
      ...mockBrandKit,
      version: 2,
      logo: {
        ...mockBrandKit.logo!,
        selectedConceptKey: 'concept_2',
      },
    };

    vi.mocked(brandKitApi.patchLogo).mockResolvedValue(confirmedKit);

    render(
      <LogoCreationModal
        ideaId="idea_123"
        initialKit={mockBrandKit}
        onConfirm={onConfirmMock}
      />
    );

    const confirmBtn = screen.getByRole('button', { name: /Confirm & Continue/i });
    expect(confirmBtn).toBeDisabled();

    // Click concept 2 card
    const concept2Card = screen.getByText('Concept 2: Hex Shield');
    fireEvent.click(concept2Card);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Confirm & Continue with Hex Shield/i })).not.toBeDisabled();
    });

    // Click confirm button
    const confirmBtnWithConcept = screen.getByRole('button', { name: /Confirm & Continue with Hex Shield/i });
    fireEvent.click(confirmBtnWithConcept);

    await waitFor(() => {
      expect(brandKitApi.patchLogo).toHaveBeenCalledWith(
        { selectedConceptKey: 'concept_2' },
        'idea_123',
        1
      );
      expect(onConfirmMock).toHaveBeenCalledWith(confirmedKit);
    });
  });

  it('supports compare two mode and side-by-side overlay', async () => {
    render(<LogoCreationModal ideaId="idea_123" initialKit={mockBrandKit} />);

    const compareToggle = screen.getByRole('button', { name: /Compare two/i });
    fireEvent.click(compareToggle);

    expect(screen.getByText(/Select 2 more concepts to compare/i)).toBeDefined();

    // Click concept 1 and concept 2
    fireEvent.click(screen.getByText('Concept 1: Alpha Monogram'));
    expect(screen.getByText(/Select 1 more concept to compare/i)).toBeDefined();

    fireEvent.click(screen.getByText('Concept 2: Hex Shield'));

    // Comparison overlay should open
    await waitFor(() => {
      expect(screen.getByText('Side-by-Side Concept Comparison')).toBeDefined();
      expect(screen.getAllByText('Concept 1: Alpha Monogram').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Concept 2: Hex Shield').length).toBeGreaterThan(0);
    });
  });
});
