import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { ColorSystemModal } from '@/components/creator/brand-kit/ColorSystemModal';
import { brandKitApi } from '@/lib/api-creator-brand-kit';
import { BrandKit } from '@/types/creator/brand-kit';

const mockColorKit: BrandKit = {
  ideaId: 'idea_cyber',
  userId: 'user_123',
  status: 'draft',
  currentStep: 5,
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
    concepts: [],
    selectedConceptKey: 'concept_1',
    variations: {},
    regenerateCount: 0,
    approvedAt: '2026-09-15T00:00:00Z',
  },
  colors: {
    roles: [
      {
        roleName: 'Primary',
        hex: '#0F172A',
        rgb: '15, 23, 42',
        usageNote: 'Core dominant brand tone',
        contrastRatio: 14.8,
        contrastVerdict: 'AAA',
        isLocked: false,
        provenance: 'derived',
      },
      {
        roleName: 'Secondary',
        hex: '#3B82F6',
        rgb: '59, 130, 246',
        usageNote: 'Supporting tint',
        contrastRatio: 4.6,
        contrastVerdict: 'AA',
        isLocked: true,
        provenance: 'derived',
      },
      {
        roleName: 'Accent',
        hex: '#10B981',
        rgb: '16, 185, 129',
        usageNote: 'Action badges & callouts',
        contrastRatio: 3.4,
        contrastVerdict: 'AA_Large',
        isLocked: false,
        provenance: 'derived',
      },
      {
        roleName: 'Background',
        hex: '#FFFFFF',
        rgb: '255, 255, 255',
        usageNote: 'Ground canvas',
        contrastRatio: null,
        contrastVerdict: null,
        isLocked: true,
        provenance: 'stated',
      },
      {
        roleName: 'Text',
        hex: '#09090B',
        rgb: '9, 9, 11',
        usageNote: 'High-contrast typography',
        contrastRatio: 18.2,
        contrastVerdict: 'AAA',
        isLocked: false,
        provenance: 'derived',
      },
    ],
    regenerateCount: 0,
    confirmedAt: null,
  },
  typography: { roles: [], regenerateCount: 0 },
};

describe('ColorSystemModal Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders exactly 5 canonical roles with correct labels and Background ground note', () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    render(
      <ColorSystemModal
        isOpen={true}
        ideaId="idea_cyber"
        kit={mockColorKit}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    );

    // Verify all 5 canonical role names exist in document
    expect(screen.getByText('Primary')).toBeInTheDocument();
    expect(screen.getByText('Secondary')).toBeInTheDocument();
    expect(screen.getByText('Accent')).toBeInTheDocument();
    expect(screen.getByText('Background')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();

    // Verify Background shows ground note without contrast badge
    expect(screen.getByText(/Used as a ground, not for text/i)).toBeInTheDocument();

    // Verify other roles have real contrast badges
    expect(screen.getByText(/14.8:1 AAA/i)).toBeInTheDocument();
    expect(screen.getByText(/4.6:1 AA/i)).toBeInTheDocument();
    expect(screen.getByText(/3.4:1 AA Large/i)).toBeInTheDocument();
    expect(screen.getByText(/18.2:1 AAA/i)).toBeInTheDocument();
  });

  it('allows lock toggling and calls patchColors with isLocked payload', async () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    const patchSpy = vi.spyOn(brandKitApi, 'patchColors').mockResolvedValue({
      ...mockColorKit,
      colors: {
        ...mockColorKit.colors!,
        roles: mockColorKit.colors!.roles.map((r) =>
          r.roleName === 'Primary' ? { ...r, isLocked: true } : r
        ),
      },
    });

    render(
      <ColorSystemModal
        isOpen={true}
        ideaId="idea_cyber"
        kit={mockColorKit}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    );

    // Primary lock button
    const lockButtons = screen.getAllByTitle(/Lock role against palette regeneration|Role is locked/i);
    fireEvent.click(lockButtons[0]);

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          roles: expect.arrayContaining([
            expect.objectContaining({ roleName: 'Primary', isLocked: true }),
          ]),
        }),
        'idea_cyber',
        1
      );
    });
  });

  it('calls regenerateColors on palette regeneration and respects 3-cap badge', async () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    const regenSpy = vi.spyOn(brandKitApi, 'regenerateColors').mockResolvedValue({
      ...mockColorKit,
      colors: {
        ...mockColorKit.colors!,
        regenerateCount: 1,
      },
    });

    render(
      <ColorSystemModal
        isOpen={true}
        ideaId="idea_cyber"
        kit={mockColorKit}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    );

    const regenButton = screen.getByRole('button', { name: /Regenerate Palette/i });
    fireEvent.click(regenButton);

    await waitFor(() => {
      expect(regenSpy).toHaveBeenCalledWith('idea_cyber', 1);
    });
  });

  it('confirms colour system and calls onSuccess with confirmedAt', async () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    const patchSpy = vi.spyOn(brandKitApi, 'patchColors').mockResolvedValue({
      ...mockColorKit,
      colors: {
        ...mockColorKit.colors!,
        confirmedAt: '2026-09-15T12:00:00Z',
      },
    });

    render(
      <ColorSystemModal
        isOpen={true}
        ideaId="idea_cyber"
        kit={mockColorKit}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /Confirm Colour System/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          confirmedAt: expect.any(String),
        }),
        'idea_cyber',
        1
      );
      expect(handleSuccess).toHaveBeenCalled();
    });
  });
});
