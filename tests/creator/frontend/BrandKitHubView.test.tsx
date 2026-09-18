import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { BrandKitHubView } from '@/components/creator/brand-kit/BrandKitHubView';
import { apiCreatorBrandKit } from '@/lib/api-creator-brand-kit';
import { BrandKit } from '@/types/creator/brand-kit';

// Mock useRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockCompleteKit: BrandKit = {
  ideaId: 'idea_cyber',
  userId: 'user_123',
  status: 'complete',
  currentStep: 6,
  version: 3,
  createdAt: '2026-09-15T00:00:00Z',
  updatedAt: '2026-09-16T00:00:00Z',
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
        colorPalette: ['#0F172A', '#2563EB', '#10B981', '#FFFFFF'],
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
        name: 'Sentinel Shield',
        rationale: 'Precision lattice icon',
        svgMarkup: '<svg><circle cx="12" cy="12" r="10"/></svg>',
        contrastOnLight: 14.5,
        contrastOnDark: 12.0,
        provenance: 'ai',
        parameters: {
          family: 'Space Grotesk',
          motif: 'lattice',
          weight: '700',
        },
      },
    ],
    selectedConceptKey: 'concept_1',
    variations: {
      primary: { svgUri: '<svg></svg>', usageNote: 'Primary' },
      horizontal: { svgUri: '<svg></svg>', usageNote: 'Horizontal' },
      stacked: { svgUri: '<svg></svg>', usageNote: 'Stacked' },
      icon_only: { svgUri: '<svg></svg>', usageNote: 'Icon only' },
      black: { svgUri: '<svg></svg>', usageNote: 'Monochrome black' },
      white: { svgUri: '<svg></svg>', usageNote: 'Reverse white' },
      transparent: { svgUri: '<svg></svg>', usageNote: 'Transparent' },
    },
    regenerateCount: 0,
    approvedAt: '2026-09-15T00:00:00Z',
  },
  colors: {
    roles: [
      { roleName: 'Primary', hex: '#0F172A', rgb: '15, 23, 42', usageNote: 'Dominant tone', contrastRatio: 14.8, contrastVerdict: 'AAA', isLocked: false, provenance: 'derived' },
      { roleName: 'Secondary', hex: '#2563EB', rgb: '37, 99, 235', usageNote: 'Supporting tint', contrastRatio: 4.6, contrastVerdict: 'AA', isLocked: true, provenance: 'derived' },
      { roleName: 'Accent', hex: '#10B981', rgb: '16, 185, 129', usageNote: 'Action badges', contrastRatio: 3.4, contrastVerdict: 'AA_Large', isLocked: false, provenance: 'derived' },
      { roleName: 'Background', hex: '#FFFFFF', rgb: '255, 255, 255', usageNote: 'Ground canvas', contrastRatio: null, contrastVerdict: null, isLocked: false, provenance: 'derived' },
      { roleName: 'Text', hex: '#09090B', rgb: '9, 9, 11', usageNote: 'Body copy', contrastRatio: 18.2, contrastVerdict: 'AAA', isLocked: false, provenance: 'derived' },
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
        specimenText: 'Crafted specifically for enterprise SecOps teams.',
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
    confirmedAt: '2026-09-15T00:00:00Z',
  },
  snapshots: [
    {
      timestamp: '2026-09-15T12:00:00Z',
      description: 'Initial completed identity',
      strategy: {} as any,
      direction: {
        candidates: [{ key: 'dir_1', name: 'Modern Precision' }] as any,
        selectedDirectionKey: 'dir_1',
      } as any,
      logo: {} as any,
      colors: { roles: [] } as any,
      typography: { roles: [] } as any,
    },
  ],
};

describe('BrandKitHubView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all 8 hub sections matching Figma Node 57004:12057 with real data', () => {
    render(<BrandKitHubView ideaId="idea_cyber" initialKit={mockCompleteKit} />);

    // 1. Identity Hero Block
    expect(screen.getAllByText('CyberLock Sentinel').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /Download Brand Kit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Edit in Studio/i })).toBeInTheDocument();
    expect(screen.getByText(/All six steps complete/i)).toBeInTheDocument();
    expect(screen.getAllByText(/V3/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Cybersecurity · Brand Kit/i)).toBeInTheDocument();

    // 2. Logo Section (6 canonical lockup thumbnails)
    expect(screen.getByText('7 VARIATIONS')).toBeInTheDocument();
    expect(screen.getByText('HORIZONTAL')).toBeInTheDocument();
    expect(screen.getByText('STACKED')).toBeInTheDocument();
    expect(screen.getByText('ICON-ONLY')).toBeInTheDocument();
    expect(screen.getByText('BLACK')).toBeInTheDocument();
    expect(screen.getByText('WHITE')).toBeInTheDocument();
    expect(screen.getByText('TRANSPARENT')).toBeInTheDocument();

    // 3. Colour System Section (5 canonical roles)
    expect(screen.getByText('5 ROLES')).toBeInTheDocument();
    expect(screen.getByText('Contrast checked')).toBeInTheDocument();
    expect(screen.getByText('Primary')).toBeInTheDocument();
    expect(screen.getByText('Secondary')).toBeInTheDocument();
    expect(screen.getByText('Accent')).toBeInTheDocument();
    expect(screen.getByText('Background')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
    expect(screen.getAllByText('#0F172A').length).toBeGreaterThanOrEqual(1);

    // 4. Typography System Section
    expect(screen.getByText('4 ROLES · 2 FAMILIES')).toBeInTheDocument();
    expect(screen.getByText('Open licence')).toBeInTheDocument();
    expect(screen.getByText('Logo type')).toBeInTheDocument();
    expect(screen.getByText('Heading')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('Button & label')).toBeInTheDocument();
    expect(screen.getByText('Start free')).toBeInTheDocument();
    expect(screen.getByText('INVOICE NUMBER')).toBeInTheDocument();

    // 5. Strategy Section (All 6 confirmed facts)
    expect(screen.getByText('BUSINESS NAME')).toBeInTheDocument();
    expect(screen.getByText('CONCEPT')).toBeInTheDocument();
    expect(screen.getByText('AUDIENCE')).toBeInTheDocument();
    expect(screen.getByText('INDUSTRY')).toBeInTheDocument();
    expect(screen.getByText('POSITIONING')).toBeInTheDocument();
    expect(screen.getByText('PERSONALITY')).toBeInTheDocument();
    expect(screen.getAllByText('Cybersecurity').length).toBeGreaterThan(0);

    // 6. Used By Section
    expect(screen.getByText('2 OF 4 CONNECTED')).toBeInTheDocument();
    expect(screen.getByText('Business plan')).toBeInTheDocument();
    expect(screen.getByText('Landing page')).toBeInTheDocument();
    expect(screen.getByText('Pitch deck')).toBeInTheDocument();
    expect(screen.getByText('Invoices')).toBeInTheDocument();

    // 7. Coming Soon Cards
    expect(screen.getByText('Brand assets')).toBeInTheDocument();
    expect(screen.getByText('Brand guidelines PDF')).toBeInTheDocument();

    // 8. Footer Strip
    expect(screen.getByText(/Edits apply the next time a generator runs/i)).toBeInTheDocument();

    // 9. Next Action Button
    expect(screen.getByRole('button', { name: /Next: Complete Phase 2/i })).toBeInTheDocument();
  });

  it('opens Strategy Review modal when clicking Edit in Studio', async () => {
    render(<BrandKitHubView ideaId="idea_cyber" initialKit={mockCompleteKit} />);

    // Click Edit in Studio button
    const editStudioBtn = screen.getByRole('button', { name: /Edit in Studio/i });
    fireEvent.click(editStudioBtn);

    // Verify Strategy Review Modal is opened
    expect(screen.getByText(/Review what we derived from your idea/i)).toBeInTheDocument();
  });

  it('triggers Cascade Warning modal on upstream edit actions', async () => {
    render(<BrandKitHubView ideaId="idea_cyber" initialKit={mockCompleteKit} />);

    // Click Open in Studio from Logo section
    const logoOpenBtn = screen.getAllByRole('button', { name: /Open in Studio/i })[0];
    fireEvent.click(logoOpenBtn);

    // Verify Cascade Warning Modal is open
    expect(screen.getByText(/Change Visual Direction\?|Modify Core Logo Concept\?/i)).toBeInTheDocument();
  });

  it('navigates to Phase 2 Complete page when clicking Next button', async () => {
    render(<BrandKitHubView ideaId="idea_cyber" initialKit={mockCompleteKit} />);

    const nextBtn = screen.getByRole('button', { name: /Next: Complete Phase 2/i });
    fireEvent.click(nextBtn);

    expect(mockPush).toHaveBeenCalledWith('/dashboard/creator/phase-2/complete?ideaId=idea_cyber');
  });

  it('triggers Restore Snapshot modal and restores snapshot correctly', async () => {
    const restoreSpy = vi.spyOn(apiCreatorBrandKit, 'restoreSnapshot').mockResolvedValue({
      ...mockCompleteKit,
      version: 4,
    });

    render(<BrandKitHubView ideaId="idea_cyber" initialKit={mockCompleteKit} />);

    // Click Restore snapshot
    const restoreBtn = screen.getByRole('button', { name: /Restore this snapshot/i });
    fireEvent.click(restoreBtn);

    // Verify Restore Modal is open
    expect(screen.getByText(/Restore Version Snapshot/i)).toBeInTheDocument();
    expect(screen.getByText(/Restore to: Initial completed identity/i)).toBeInTheDocument();

    // Confirm Restore
    const confirmBtn = screen.getByRole('button', { name: /Confirm Restore/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(restoreSpy).toHaveBeenCalledWith(0, 3, 'idea_cyber');
    });
  });
});
