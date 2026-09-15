import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { VariationSetModal } from '@/components/creator/brand-kit/VariationSetModal';
import { brandKitApi } from '@/lib/api-creator-brand-kit';
import { BrandKit, BrandLogoVariation } from '@/types/creator/brand-kit';

const mockVariations: Record<string, BrandLogoVariation> = {
  primary: {
    svgUri: 'data:image/svg+xml;base64,PHN2Zz48Y2lyY2xlIHI9IjEwIi8+PC9zdmc+',
    pngUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    usageNote: 'Default lockup for hero brand placements and general identity applications.',
  },
  horizontal: {
    svgUri: 'data:image/svg+xml;base64,PHN2Zz48cmVjdCB3aWR0aD0iMjAiIGhlaWdodD0iMTAiLz48L3N2Zz4=',
    pngUri: null,
    usageNote: 'Optimised for navigation bars, email headers and wide horizontal spaces.',
  },
  stacked: {
    svgUri: 'data:image/svg+xml;base64,PHN2Zz48Y2lyY2xlIHI9IjUiLz48L3N2Zz4=',
    pngUri: null,
    usageNote: 'Square formats, app stores, packaging and centered vertical placements.',
  },
  icon_only: {
    svgUri: 'data:image/svg+xml;base64,PHN2Zz48cGF0aCBkPSJNMCAwTDEwIDEwIi8+PC9zdmc+',
    pngUri: null,
    usageNote: 'Favicons, taskbars, social avatars, and ultra-compact UI surfaces.',
  },
  black: {
    svgUri: 'data:image/svg+xml;base64,PHN2Zz48cGF0aCBkPSJNMCAwSDEwVjEwSDBaIiBmaWxsPSIjMDAwMDAwIi8+PC9zdmc+',
    pngUri: null,
    usageNote: 'Single-ink monochrome printing, invoices, and light high-contrast surfaces.',
  },
  white: {
    svgUri: 'data:image/svg+xml;base64,PHN2Zz48cGF0aCBkPSJNMCAwSDEwVjEwSDBaIiBmaWxsPSIjZmZmZmZmIi8+PC9zdmc+',
    pngUri: null,
    usageNote: 'Dark backgrounds, media overlays, and photography backdrops.',
  },
  transparent: {
    svgUri: 'data:image/svg+xml;base64,PHN2Zz48Y2lyY2xlIHI9IjgiLz48L3N2Zz4=',
    pngUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAZelRYdHJhd3RleHQAAA==',
    usageNote: 'Isolated alpha channel for seamless integration across diverse substrates.',
  },
};

const mockBrandKit: BrandKit = {
  ideaId: 'idea_123',
  userId: 'user_456',
  status: 'draft',
  currentStep: 5,
  version: 2,
  createdAt: '2026-09-15T00:00:00Z',
  updatedAt: '2026-09-15T00:00:00Z',
  strategy: {
    businessName: 'CyberLock Sentinel',
    nameDisplayForm: 'CyberLock',
    missionStatement: 'Autonomous AI defense system for cloud infrastructure.',
    coreValues: ['Security', 'Precision', 'Autonomy'],
    targetAudience: 'Enterprise DevOps and SecOps teams',
    positioningStatement: 'Zero-compromise cloud security automation.',
    personalityArchetype: 'The Guardian',
    regenerateCount: 0,
  },
  direction: {
    directions: [],
    selectedDirectionKey: 'dir_cyber',
    regenerateCount: 0,
  },
  logo: {
    concepts: [],
    selectedConceptKey: 'concept_2',
    variations: mockVariations,
    regenerateCount: 0,
    approvedAt: null,
  },
  colors: {
    roles: [],
    regenerateCount: 0,
  },
  typography: {
    roles: [],
    regenerateCount: 0,
  },
  history: [],
};

describe('VariationSetModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all 7 variations correctly with titles and usage notes', async () => {
    render(
      <VariationSetModal
        ideaId="idea_123"
        initialKit={mockBrandKit}
      />
    );

    // Check step pill
    expect(screen.getByText(/STEP 5 OF 7/i)).toBeInTheDocument();
    expect(screen.getByText(/Brand Variation Set/i)).toBeInTheDocument();

    // Check 7 variation titles
    expect(screen.getByText('Primary Logo')).toBeInTheDocument();
    expect(screen.getByText('Horizontal Lockup')).toBeInTheDocument();
    expect(screen.getByText('Stacked Lockup')).toBeInTheDocument();
    expect(screen.getByText('Icon Only')).toBeInTheDocument();
    expect(screen.getByText('Black Monochrome')).toBeInTheDocument();
    expect(screen.getByText('White Monochrome')).toBeInTheDocument();
    expect(screen.getByText('Transparent Background')).toBeInTheDocument();

    // Check usage notes
    expect(
      screen.getAllByText(/Default lockup for hero brand placements/i).length
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText(/Optimised for navigation bars, email headers/i).length
    ).toBeGreaterThanOrEqual(1);
  });

  it('renders icon_only variation with MultiScaleIconViewer at 64px, 32px, and 16px', () => {
    render(
      <VariationSetModal
        ideaId="idea_123"
        initialKit={mockBrandKit}
      />
    );

    expect(screen.getByText('64×64px')).toBeInTheDocument();
    expect(screen.getByText('32×32px')).toBeInTheDocument();
    expect(screen.getByText('16×16px')).toBeInTheDocument();
  });

  it('handles individual asset download click', () => {
    const createElementSpy = vi.spyOn(document, 'createElement');
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');

    render(
      <VariationSetModal
        ideaId="idea_123"
        initialKit={mockBrandKit}
      />
    );

    const downloadButtons = screen.getAllByRole('button', { name: /Download/i });
    expect(downloadButtons.length).toBeGreaterThan(0);

    fireEvent.click(downloadButtons[1]); // First tile download button

    expect(createElementSpy).toHaveBeenCalledWith('a');
  });

  it('approves all seven variations and calls PATCH /logo with approvedAt', async () => {
    const onConfirmMock = vi.fn();
    const patchLogoSpy = vi
      .spyOn(brandKitApi, 'patchLogo')
      .mockResolvedValue({
        ...mockBrandKit,
        logo: {
          ...mockBrandKit.logo,
          approvedAt: '2026-09-15T12:00:00Z',
        },
      });

    render(
      <VariationSetModal
        ideaId="idea_123"
        initialKit={mockBrandKit}
        onConfirm={onConfirmMock}
      />
    );

    const approveButton = screen.getByRole('button', {
      name: /Approve all seven/i,
    });
    expect(approveButton).toBeEnabled();

    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(patchLogoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          approvedAt: expect.any(String),
        }),
        'idea_123',
        2
      );
      expect(onConfirmMock).toHaveBeenCalled();
    });
  });

  it('derives variations automatically when initial kit lacks variations', async () => {
    const kitWithoutVariations: BrandKit = {
      ...mockBrandKit,
      logo: {
        ...mockBrandKit.logo,
        variations: {},
      },
    };

    const deriveVariationsSpy = vi
      .spyOn(brandKitApi, 'deriveVariations')
      .mockResolvedValue({
        ...kitWithoutVariations,
        logo: {
          ...kitWithoutVariations.logo,
          variations: mockVariations,
        },
      });

    render(
      <VariationSetModal
        ideaId="idea_123"
        initialKit={kitWithoutVariations}
      />
    );

    await waitFor(() => {
      expect(deriveVariationsSpy).toHaveBeenCalledWith('idea_123', 2);
      expect(screen.getByText('Primary Logo')).toBeInTheDocument();
    });
  });
});
