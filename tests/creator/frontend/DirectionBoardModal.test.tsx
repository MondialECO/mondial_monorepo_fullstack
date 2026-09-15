import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { DirectionBoardModal } from '@/components/creator/brand-kit/DirectionBoardModal';
import { brandKitApi } from '@/lib/api-creator-brand-kit';
import { BrandKit, BrandDirectionCandidate } from '@/types/creator/brand-kit';

const mockCandidates: BrandDirectionCandidate[] = [
  {
    key: 'dir_1',
    name: 'Modern Precision',
    feelLine: 'Balanced, confident and technically refined.',
    rationale: 'Aligns with enterprise security positioning with architectural clarity.',
    colorPalette: ['#0F172A', '#2563EB', '#60A5FA', '#F8FAFC'],
    displayTypeface: 'Space Grotesk',
    textTypeface: 'Plus Jakarta Sans',
    motifKey: 'technical_lattice',
    provenance: 'ai',
    avoidListSubstituted: false,
  },
  {
    key: 'dir_2',
    name: 'Organic Vitality',
    feelLine: 'Dynamic, restorative and naturally structured.',
    rationale: 'Emphasizes resilience and continuous growth.',
    colorPalette: ['#064E3B', '#10B981', '#6EE7B7', '#ECFDF5'],
    displayTypeface: 'Syne',
    textTypeface: 'Plus Jakarta Sans',
    motifKey: 'organic_growth',
    provenance: 'ai',
    avoidListSubstituted: false,
  },
  {
    key: 'dir_3',
    name: 'Classic Editorial',
    feelLine: 'Authoritative, timeless and distinguished.',
    rationale: 'Brings high-trust prestige and institutional durability.',
    colorPalette: ['#1C1917', '#B45309', '#FDE68A', '#FFFBEB'],
    displayTypeface: 'Cinzel',
    textTypeface: 'Plus Jakarta Sans',
    motifKey: 'editorial_classic',
    provenance: 'ai',
    avoidListSubstituted: false,
  },
  {
    key: 'dir_4',
    name: 'Monolithic Structure',
    feelLine: 'Bold, resolute and uncompromising.',
    rationale: 'Reinforces zero-trust cryptographic solidity.',
    colorPalette: ['#18181B', '#71717A', '#E4E4E7', '#FAFAFA'],
    displayTypeface: 'JetBrains Mono',
    textTypeface: 'Space Grotesk',
    motifKey: 'geometric_structure',
    provenance: 'ai',
    avoidListSubstituted: false,
  },
];

const mockBrandKit: BrandKit = {
  ideaId: 'idea_cyber',
  userId: 'user_123',
  status: 'draft',
  currentStep: 2,
  version: 1,
  createdAt: '2026-09-15T00:00:00Z',
  updatedAt: '2026-09-15T00:00:00Z',
  strategy: {
    businessName: 'CyberLock Sentinel',
    nameDisplayForm: 'CyberLock Sentinel',
    concept: { value: 'AI security', provenance: 'stated' },
    targetAudience: { value: 'Enterprise SecOps', provenance: 'stated' },
    industry: { value: 'Cybersecurity', provenance: 'stated' },
    positioning: { value: 'Zero compromise', provenance: 'stated' },
    personalityTraits: ['Precise', 'Resilient'],
    avoidList: [],
    tonePosition: 'balanced',
    firstAppearance: 'website',
    symbolFeeling: null,
    confirmedAt: '2026-09-15T00:00:00Z',
  },
  direction: {
    candidates: mockCandidates,
    selectedDirectionKey: 'dir_1',
    adjustmentSettings: {
      paletteVariant: 'default',
      contrastPosition: 'balanced',
      typeWeight: 'medium',
    },
    regenerateCount: 0,
    selectedAt: null,
  },
  logo: {
    concepts: [],
    selectedConceptKey: null,
    variations: {},
    regenerateCount: 0,
    approvedAt: null,
  },
  colors: { roles: [], regenerateCount: 0 },
  typography: { roles: [], regenerateCount: 0 },
  history: [],
};

describe('DirectionBoardModal Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders all 4 candidate cards with style specimens, rationales, and 4-swatch palettes', () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    render(
      <DirectionBoardModal
        isOpen={true}
        onClose={handleClose}
        ideaId="idea_cyber"
        kit={mockBrandKit}
        onSuccess={handleSuccess}
      />
    );

    // Check all 4 direction names are present
    expect(screen.getAllByText('Modern Precision').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Organic Vitality')).toBeInTheDocument();
    expect(screen.getByText('Classic Editorial')).toBeInTheDocument();
    expect(screen.getByText('Monolithic Structure')).toBeInTheDocument();

    // Check bundled font tags are rendered
    expect(screen.getByText('Space Grotesk + Plus Jakarta Sans')).toBeInTheDocument();
    expect(screen.getByText('Syne + Plus Jakarta Sans')).toBeInTheDocument();
    expect(screen.getByText('Cinzel + Plus Jakarta Sans')).toBeInTheDocument();
    expect(screen.getByText('JetBrains Mono + Space Grotesk')).toBeInTheDocument();

    // Check feel lines
    expect(
      screen.getByText('Balanced, confident and technically refined.')
    ).toBeInTheDocument();

    // Check regenerate cap badge shows 3/3 LEFT
    expect(screen.getByText('3/3 LEFT')).toBeInTheDocument();
    expect(screen.getByText('7 CREDITS')).toBeInTheDocument();
  });

  it('allows selecting another direction and updates active selection', () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    render(
      <DirectionBoardModal
        isOpen={true}
        onClose={handleClose}
        ideaId="idea_cyber"
        kit={mockBrandKit}
        onSuccess={handleSuccess}
      />
    );

    // Click on 2nd candidate card
    const organicCard = screen.getByText('Organic Vitality');
    fireEvent.click(organicCard);

    // Confirm button should say "Use Organic Vitality"
    expect(screen.getByText('Use Organic Vitality')).toBeInTheDocument();
  });

  it('allows adjusting fine-tune settings without calling credit-costing endpoints', async () => {
    const patchDirectionSpy = vi
      .spyOn(brandKitApi, 'patchDirection')
      .mockResolvedValue({
        ...mockBrandKit,
        direction: {
          ...mockBrandKit.direction!,
          selectedDirectionKey: 'dir_1',
          selectedAt: '2026-09-15T00:00:00Z',
          adjustmentSettings: {
            paletteVariant: 'vibrant',
            contrastPosition: 'high',
            typeWeight: 'bold',
          },
        },
      });

    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    render(
      <DirectionBoardModal
        isOpen={true}
        onClose={handleClose}
        ideaId="idea_cyber"
        kit={mockBrandKit}
        onSuccess={handleSuccess}
      />
    );

    // Click vibrant palette variant
    const vibrantBtn = screen.getByRole('button', { name: /vibrant/i });
    fireEvent.click(vibrantBtn);

    // Click bold type weight
    const boldBtn = screen.getByRole('button', { name: /bold/i });
    fireEvent.click(boldBtn);

    // Click Confirm button
    const confirmBtn = screen.getByRole('button', { name: /Use Modern Precision/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(patchDirectionSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedDirectionKey: 'dir_1',
          adjustmentSettings: expect.objectContaining({
            paletteVariant: 'vibrant',
            typeWeight: 'bold',
          }),
        }),
        'idea_cyber',
        1
      );
      expect(handleSuccess).toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('handles 402 Insufficient credits response on regeneration', async () => {
    vi.spyOn(brandKitApi, 'generateDirections').mockRejectedValue({
      response: {
        status: 402,
        data: { message: 'Insufficient AI credits (7 credits required).' },
      },
    });

    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    render(
      <DirectionBoardModal
        isOpen={true}
        onClose={handleClose}
        ideaId="idea_cyber"
        kit={mockBrandKit}
        onSuccess={handleSuccess}
      />
    );

    const regenBtn = screen.getByRole('button', { name: /Regenerate all four/i });
    fireEvent.click(regenBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Insufficient AI credits \(7 credits required\)\./i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Top up credits/i)).toBeInTheDocument();
    });
  });

  it('disables regeneration button and displays 0/3 LEFT when cap is exhausted', () => {
    const exhaustedKit: BrandKit = {
      ...mockBrandKit,
      direction: {
        ...mockBrandKit.direction!,
        regenerateCount: 3,
      },
    };

    render(
      <DirectionBoardModal
        isOpen={true}
        onClose={vi.fn()}
        ideaId="idea_cyber"
        kit={exhaustedKit}
        onSuccess={vi.fn()}
      />
    );

    const regenBtn = screen.getByRole('button', { name: /Regenerate all four/i });
    expect(regenBtn).toBeDisabled();
    expect(screen.getByText('0/3 LEFT')).toBeInTheDocument();
  });
});
