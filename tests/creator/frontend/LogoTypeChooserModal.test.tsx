import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import {
  LogoTypeChooserModal,
  computeLogoTypeFit,
} from '@/components/creator/brand-kit/LogoTypeChooserModal';
import { brandKitApi } from '@/lib/api-creator-brand-kit';
import { BrandKit } from '@/types/creator/brand-kit';

const mockCyberKit: BrandKit = {
  ideaId: 'idea_cyber',
  userId: 'user_123',
  status: 'draft',
  currentStep: 3,
  version: 1,
  createdAt: '2026-09-15T00:00:00Z',
  updatedAt: '2026-09-15T00:00:00Z',
  strategy: {
    businessName: 'CyberLock Sentinel',
    nameDisplayForm: 'CyberLock Sentinel',
    derivedConstraints: {
      characterLength: 18,
      wordCount: 2,
      script: 'Latin',
      monogramInitials: 'CS',
      isIconOnlyViable: true,
    },
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
    candidates: [
      {
        key: 'dir_1',
        name: 'Modern Precision',
        feelLine: 'Balanced and technically refined.',
        rationale: 'Aligns with enterprise security.',
        colorPalette: ['#0F172A', '#2563EB', '#60A5FA', '#F8FAFC'],
        displayTypeface: 'Space Grotesk',
        textTypeface: 'Plus Jakarta Sans',
        motifKey: 'technical_lattice',
        provenance: 'ai',
        avoidListSubstituted: false,
      },
    ],
    selectedDirectionKey: 'dir_1',
    adjustmentSettings: {
      paletteVariant: 'default',
      contrastPosition: 'balanced',
      typeWeight: 'medium',
    },
    regenerateCount: 0,
    selectedAt: '2026-09-15T00:00:00Z',
  },
  logo: {
    logoType: 'symbol_plus_name',
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

const mockShortNameKit: BrandKit = {
  ...mockCyberKit,
  ideaId: 'idea_vera',
  strategy: {
    ...mockCyberKit.strategy!,
    businessName: 'Vera',
    nameDisplayForm: 'Vera',
    derivedConstraints: {
      characterLength: 4,
      wordCount: 1,
      script: 'Latin',
      monogramInitials: 'V',
      isIconOnlyViable: true,
    },
  },
};

describe('LogoTypeChooserModal Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders all 6 architectural type cards with generic greyscale placeholder names', () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    render(
      <LogoTypeChooserModal
        isOpen={true}
        onClose={handleClose}
        ideaId="idea_cyber"
        kit={mockCyberKit}
        onSuccess={handleSuccess}
      />
    );

    // Verify all 6 card titles
    expect(screen.getByText('Wordmark')).toBeInTheDocument();
    expect(screen.getAllByText('Symbol + Name').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Monogram')).toBeInTheDocument();
    expect(screen.getByText('Geometric Abstract')).toBeInTheDocument();
    expect(screen.getByText('Minimal Pictorial / Icon')).toBeInTheDocument();
    expect(screen.getByText('Minimal Lineform')).toBeInTheDocument();

    // Verify generic placeholder name (NORTHLINE) is used in specimen
    const placeholderNames = screen.getAllByText(/NORTHLINE/i);
    expect(placeholderNames.length).toBeGreaterThanOrEqual(2);

    // Verify real business name is in context strip but NOT inside generic specimens
    expect(screen.getByText('CyberLock Sentinel')).toBeInTheDocument();
    expect(screen.getByText('18 chars • 2 words')).toBeInTheDocument();

    // Verify NO credit/cap badge exists
    expect(screen.queryByText(/CREDITS/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/LEFT/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Regenerate/i)).not.toBeInTheDocument();
  });

  it('computes divergent fit assessments between short (4 chars) and multi-word (18 chars) brand names', () => {
    const shortWordmarkFit = computeLogoTypeFit('wordmark', mockShortNameKit);
    const longWordmarkFit = computeLogoTypeFit('wordmark', mockCyberKit);

    // Short name has strong wordmark fit
    expect(shortWordmarkFit.level).toBe('strong');
    expect(shortWordmarkFit.reason).toContain('4 characters across a single word');

    // 18-char name has workable wordmark fit
    expect(longWordmarkFit.level).toBe('workable');
    expect(longWordmarkFit.reason).toContain('18 characters');

    // Monogram fit comparison
    const shortMonogramFit = computeLogoTypeFit('monogram', mockShortNameKit);
    const longMonogramFit = computeLogoTypeFit('monogram', mockCyberKit);

    expect(shortMonogramFit.level).toBe('workable');
    expect(longMonogramFit.level).toBe('strong');
    expect(longMonogramFit.reason).toContain("authoritative 'CS' monogram");
  });

  it('allows selecting another logo type and confirming calls patchLogo with selected type', async () => {
    const patchLogoSpy = vi.spyOn(brandKitApi, 'patchLogo').mockResolvedValue({
      ...mockCyberKit,
      logo: {
        ...mockCyberKit.logo!,
        logoType: 'wordmark',
      },
    });

    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    render(
      <LogoTypeChooserModal
        isOpen={true}
        onClose={handleClose}
        ideaId="idea_cyber"
        kit={mockCyberKit}
        onSuccess={handleSuccess}
      />
    );

    // Click Wordmark card
    const wordmarkCard = screen.getByText('Wordmark');
    fireEvent.click(wordmarkCard);

    // Confirm button should say "Use Wordmark"
    const confirmBtn = screen.getByRole('button', { name: /Use Wordmark/i });
    expect(confirmBtn).toBeInTheDocument();
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(patchLogoSpy).toHaveBeenCalledWith(
        { logoType: 'wordmark' },
        'idea_cyber',
        1
      );
      expect(handleSuccess).toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
