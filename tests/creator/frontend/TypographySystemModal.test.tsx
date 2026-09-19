import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { TypographySystemModal } from '@/components/creator/brand-kit/TypographySystemModal';
import { apiCreatorBrandKit, brandKitApi } from '@/lib/api-creator-brand-kit';
import { creatorAiApi } from '@/lib/api-creator-ai';
import { BrandKit } from '@/types/creator/brand-kit';

const mockTypographyKit: BrandKit = {
  ideaId: 'idea_cyber',
  userId: 'user_123',
  status: 'draft',
  currentStep: 6,
  version: 1,
  createdAt: '2026-09-15T00:00:00Z',
  updatedAt: '2026-09-15T00:00:00Z',
  strategy: {
    businessName: 'CyberLock Sentinel',
    nameDisplayForm: 'CyberLock Sentinel',
    concept: { value: 'Autonomous enterprise threat containment and zero-trust verification.', provenance: 'stated' },
    targetAudience: { value: 'Enterprise SecOps engineers', provenance: 'stated' },
    industry: { value: 'Cybersecurity', provenance: 'stated' },
    positioning: { value: 'Zero compromise enterprise infrastructure', provenance: 'stated' },
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
        colorPalette: ['#0F172A', '#3B82F6', '#10B981', '#FFFFFF'],
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
    concepts: [
      {
        key: 'concept_1',
        descriptorLine: 'Sentinel Shield - Precision lattice icon',
        markAssetUri: '<svg></svg>',
        lockupAssetUri: '<svg></svg>',
        regenerateCount: 0,
        parameters: {
          family: 'Space Grotesk',
          descriptor: 'lattice',
          values: { motif: 'lattice', weight: '700' },
        },
      },
    ],
    selectedConceptKey: 'concept_1',
    variations: {},
    regenerateCount: 0,
    approvedAt: '2026-09-15T00:00:00Z',
  },
  colors: {
    roles: [
      { roleName: 'Primary', hex: '#0F172A', rgb: '15, 23, 42', usageNote: 'Dominant tone', contrastRatio: 14.8, contrastVerdict: 'AAA', isLocked: false, provenance: 'derived' },
      { roleName: 'Secondary', hex: '#3B82F6', rgb: '59, 130, 246', usageNote: 'Supporting tint', contrastRatio: 4.6, contrastVerdict: 'AA', isLocked: true, provenance: 'derived' },
      { roleName: 'Accent', hex: '#10B981', rgb: '16, 185, 129', usageNote: 'Action badges', contrastRatio: 3.4, contrastVerdict: 'AA_Large', isLocked: false, provenance: 'derived' },
      { roleName: 'Background', hex: '#FFFFFF', rgb: '255, 255, 255', usageNote: 'Ground canvas', contrastRatio: null, contrastVerdict: null, isLocked: false, provenance: 'derived' },
      { roleName: 'Text', hex: '#0F172A', rgb: '15, 23, 42', usageNote: 'Body copy', contrastRatio: 14.8, contrastVerdict: 'AAA', isLocked: false, provenance: 'derived' },
    ],
    regenerateCount: 0,
    confirmedAt: '2026-09-15T00:00:00Z',
  },
  typography: {
    roles: [
      {
        roleName: 'Logo type',
        family: 'Space Grotesk',
        weight: '700',
        size: '24px',
        lineHeight: '1.1',
        specimenText: 'CyberLock Sentinel',
        isLocked: true,
        provenance: 'stated',
      },
      {
        roleName: 'Heading',
        family: 'Space Grotesk',
        weight: '700',
        size: '32px',
        lineHeight: '1.2',
        specimenText: 'Zero compromise enterprise infrastructure',
        isLocked: false,
        provenance: 'derived',
      },
      {
        roleName: 'Body',
        family: 'Plus Jakarta Sans',
        weight: '400',
        size: '16px',
        lineHeight: '1.5',
        specimenText: 'Crafted specifically for enterprise secops engineers. Autonomous enterprise threat containment.',
        isLocked: false,
        provenance: 'derived',
      },
      {
        roleName: 'Button & label',
        family: 'Plus Jakarta Sans',
        weight: '600',
        size: '14px',
        lineHeight: '1.0',
        specimenText: 'Explore CyberLock Sentinel',
        isLocked: false,
        provenance: 'derived',
      },
    ],
    families: {
      displayFamily: {
        name: 'Space Grotesk',
        license: 'SIL Open Font License 1.1',
        availableWeights: ['400', '500', '700'],
        webWeightKb: 133.5,
      },
      textFamily: {
        name: 'Plus Jakarta Sans',
        license: 'SIL Open Font License 1.1',
        availableWeights: ['400', '500', '600', '700', '800'],
        webWeightKb: 172.1,
      },
    },
    regenerateCount: 0,
    confirmedAt: null,
  },
};

describe('TypographySystemModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(creatorAiApi, 'getCredits').mockResolvedValue({
      balance: 100,
      costs: { TypographyGeneration: 2 },
    } as any);
  });

  it('renders all 4 exact canonical roles and bundled family summaries', () => {
    render(
      <TypographySystemModal
        isOpen={true}
        ideaId="idea_cyber"
        kit={mockTypographyKit}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    // Header & Families
    expect(screen.getByText(/Your typography/i)).toBeInTheDocument();
    expect(screen.getByText(/DISPLAY FAMILY/i)).toBeInTheDocument();
    expect(screen.getByText(/TEXT FAMILY/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Space Grotesk/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Plus Jakarta Sans/i).length).toBeGreaterThan(0);

    // 4 Canonical Roles
    expect(screen.getAllByText('Logo type').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Heading')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('Button & label')).toBeInTheDocument();
  });

  it('enforces permanent lock treatment on Logo type role with real Strategy specimen', () => {
    render(
      <TypographySystemModal
        isOpen={true}
        ideaId="idea_cyber"
        kit={mockTypographyKit}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    // Permanent Lock badge
    expect(screen.getByText(/Bound to approved logo concept/i)).toBeInTheDocument();
    // Real Business Name Specimen
    expect(screen.getAllByText(/CyberLock Sentinel/i).length).toBeGreaterThan(0);
  });

  it('allows per-role weight/size tuning via free PATCH calls for unlocked roles', async () => {
    const patchSpy = vi.spyOn(apiCreatorBrandKit, 'patchTypography').mockResolvedValue(mockTypographyKit);

    render(
      <TypographySystemModal
        isOpen={true}
        ideaId="idea_cyber"
        kit={mockTypographyKit}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    const headingWeightSelect = screen.getByLabelText(/Heading font weight/i);
    expect(headingWeightSelect).toBeInTheDocument();

    fireEvent.change(headingWeightSelect, { target: { value: '800' } });

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith(
        {
          roles: [
            {
              roleName: 'Heading',
              weight: '800',
            },
          ],
        },
        'idea_cyber',
        1
      );
    });
  });

  it('handles pairing regeneration and kit completion progression', async () => {
    const regenSpy = vi.spyOn(apiCreatorBrandKit, 'regenerateTypography').mockResolvedValue({
      ...mockTypographyKit,
      typography: {
        ...mockTypographyKit.typography!,
        regenerateCount: 1,
      },
    });

    const patchSpy = vi.spyOn(apiCreatorBrandKit, 'patchTypography').mockResolvedValue(mockTypographyKit);
    const advanceSpy = vi.spyOn(apiCreatorBrandKit, 'advanceStep').mockResolvedValue({
      ...mockTypographyKit,
      currentStep: 6,
      status: 'complete',
    });

    const onSuccess = vi.fn();

    render(
      <TypographySystemModal
        isOpen={true}
        ideaId="idea_cyber"
        kit={mockTypographyKit}
        onClose={vi.fn()}
        onSuccess={onSuccess}
      />
    );

    // Click Suggest pairings
    const regenButton = screen.getByRole('button', { name: /Suggest (other )?pairings/i });
    await waitFor(() => expect(regenButton).not.toBeDisabled());
    fireEvent.click(regenButton);

    await waitFor(() => {
      expect(regenSpy).toHaveBeenCalledWith('idea_cyber', 1);
    });

    // Click Confirm & Complete Brand Kit
    const confirmButton = screen.getByRole('button', { name: /Confirm & Complete Brand Kit/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalled();
      expect(advanceSpy).toHaveBeenCalledWith(6, 'idea_cyber', expect.anything());
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
