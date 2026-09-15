import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { BrandStudioShell } from '@/components/creator/brand-kit/BrandStudioShell';
import { brandKitApi } from '@/lib/api-creator-brand-kit';
import { BrandKit } from '@/types/creator/brand-kit';

const mockPush = vi.fn();

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockCompletedStrategyAndDirectionKit: BrandKit = {
  ideaId: 'idea_123',
  userId: 'user_456',
  status: 'draft',
  currentStep: 3,
  version: 2,
  createdAt: '2026-09-15T00:00:00Z',
  updatedAt: '2026-09-15T00:00:00Z',
  strategy: {
    businessName: 'CyberLock Sentinel',
    nameDisplayForm: 'CyberLock',
    concept: { value: 'Autonomous AI defense system for cloud infrastructure.', provenance: 'stated' },
    targetAudience: { value: 'Enterprise DevOps and SecOps teams', provenance: 'stated' },
    industry: { value: 'Cybersecurity & Cloud Infrastructure', provenance: 'stated' },
    positioning: { value: 'Zero-compromise cloud security automation.', provenance: 'stated' },
    personalityTraits: ['Precise', 'Resilient', 'Autonomous'],
    symbolFeeling: 'The Guardian',
    avoidList: ['Cliché padlocks', 'Generic shields'],
    confirmedAt: '2026-09-15T10:00:00Z',
  },
  direction: {
    candidates: [
      {
        key: 'dir_cyber',
        name: 'Technical Precision',
        feelLine: 'Engineered authority with crisp mathematical balance.',
        rationale: 'Appeals to technical buyers and DevOps leads.',
        colorPalette: ['#0052FF', '#0F172A', '#38BDF8', '#F8FAFC', '#09090B'],
        displayTypeface: 'Space Grotesk',
        textTypeface: 'Plus Jakarta Sans',
        motifKey: 'offset_bars',
        provenance: 'ai',
        avoidListSubstituted: false,
      },
    ],
    selectedDirectionKey: 'dir_cyber',
    selectedAt: '2026-09-15T10:30:00Z',
    regenerateCount: 0,
  },
  logo: {
    logoType: undefined,
    concepts: [],
    selectedConceptKey: null,
    variations: {},
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
  snapshots: [],
};

describe('BrandStudioShell Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resumes at Logo Type when Strategy and Direction are complete and shows accumulated result cards', async () => {
    vi.spyOn(brandKitApi, 'openStudio').mockResolvedValue(mockCompletedStrategyAndDirectionKit);

    render(
      <BrandStudioShell
        ideaId="idea_123"
        initialKit={mockCompletedStrategyAndDirectionKit}
      />
    );

    // Verify Progress bar segments
    expect(screen.getByText('Strategy')).toBeInTheDocument();
    expect(screen.getByText('Direction')).toBeInTheDocument();
    expect(screen.getByText('Logo Type')).toBeInTheDocument();
    expect(screen.getByText('Logo')).toBeInTheDocument();
    expect(screen.getByText('Colour')).toBeInTheDocument();
    expect(screen.getByText('Typography')).toBeInTheDocument();

    // Verify accumulated Result Cards on canvas
    expect(screen.getByText('Autonomous AI defense system for cloud infrastructure.')).toBeInTheDocument();
    expect(screen.getAllByText('Technical Precision').length).toBeGreaterThan(0);
    expect(screen.getByText('Engineered authority with crisp mathematical balance.')).toBeInTheDocument();


    // Verify resumed active step is Logo Type modal
    expect(screen.getByText(/Choose Your Logo Type Archetype/i)).toBeInTheDocument();
  });

  it('locks subsequent steps and prevents opening locked steps', async () => {
    render(
      <BrandStudioShell
        ideaId="idea_123"
        initialKit={mockCompletedStrategyAndDirectionKit}
      />
    );

    // Step 5 (Colour) should be locked
    const colourButton = screen.getByRole('button', { name: /Colour/i });
    expect(colourButton).toBeDisabled();

    // Step 6 (Typography) should be locked
    const typographyButton = screen.getByRole('button', { name: /Typography/i });
    expect(typographyButton).toBeDisabled();
  });

  it('opens LogoCreationModal (3a) when Logo step is selected without a selected concept', async () => {
    const kitWithLogoType: BrandKit = {
      ...mockCompletedStrategyAndDirectionKit,
      logo: {
        ...mockCompletedStrategyAndDirectionKit.logo,
        logoType: 'wordmark',
        concepts: [],
        selectedConceptKey: null,
      },
    };

    render(
      <BrandStudioShell
        ideaId="idea_123"
        initialKit={kitWithLogoType}
      />
    );

    // Verify Logo Creation Modal renders as overlay
    await waitFor(() => {
      expect(screen.getByText(/Select Your Brand Mark/i)).toBeInTheDocument();
    });
  });

  it('opens VariationSetModal (3b) when Logo step has a selected concept pending approval', async () => {
    const kitWithSelectedConcept: BrandKit = {
      ...mockCompletedStrategyAndDirectionKit,
      logo: {
        ...mockCompletedStrategyAndDirectionKit.logo,
        logoType: 'wordmark',
        selectedConceptKey: 'concept_2',
        variations: {
          primary: {
            svgUri: '<svg><circle/></svg>',
            usageNote: 'Primary mark',
          },
        },
        approvedAt: null,
      },
    };

    render(
      <BrandStudioShell
        ideaId="idea_123"
        initialKit={kitWithSelectedConcept}
      />
    );

    // Verify Variation Set Modal resumes automatically
    await waitFor(() => {
      expect(screen.getByText(/Brand Variation Set/i)).toBeInTheDocument();
      expect(screen.getByText(/Approve all seven/i)).toBeInTheDocument();
    });
  });

  it('navigates to Brand Kit Hub when Typography confirm completes a draft kit for the first time', async () => {
    const draftKitAtTypography: BrandKit = {
      ...mockCompletedStrategyAndDirectionKit,
      status: 'draft',
      currentStep: 6,
      logo: {
        logoType: 'wordmark',
        selectedConceptKey: 'concept_1',
        variations: {
          primary: { svgUri: '<svg></svg>', usageNote: 'Primary' },
        },
        approvedAt: '2026-09-15T11:00:00Z',
        concepts: [],
        regenerateCount: 0,
      },
      colors: {
        roles: [
          { roleName: 'Primary', hex: '#0052FF', isDark: true, provenance: 'stated' },
          { roleName: 'Secondary', hex: '#0F172A', isDark: true, provenance: 'stated' },
          { roleName: 'Accent', hex: '#38BDF8', isDark: false, provenance: 'stated' },
          { roleName: 'Background', hex: '#F8FAFC', isDark: false, provenance: 'stated' },
          { roleName: 'Text', hex: '#09090B', isDark: true, provenance: 'stated' },
        ],
        regenerateCount: 0,
        confirmedAt: '2026-09-15T11:30:00Z',
      },
      typography: {
        roles: [
          { roleName: 'Logo type', family: 'Space Grotesk', weight: '700', size: '24px', lineHeight: '1.2', specimenText: 'CyberLock', isLocked: true, provenance: 'stated' },
          { roleName: 'Heading', family: 'Space Grotesk', weight: '700', size: '32px', lineHeight: '1.2', specimenText: 'Heading sample', isLocked: false, provenance: 'derived' },
          { roleName: 'Body', family: 'Plus Jakarta Sans', weight: '400', size: '16px', lineHeight: '1.5', specimenText: 'Body sample', isLocked: false, provenance: 'derived' },
          { roleName: 'Button & label', family: 'Plus Jakarta Sans', weight: '600', size: '14px', lineHeight: '1.4', specimenText: 'Button sample', isLocked: false, provenance: 'derived' },
        ],
        regenerateCount: 0,
        confirmedAt: null,
      },
    };

    const completedKit: BrandKit = {
      ...draftKitAtTypography,
      status: 'complete',
      currentStep: 6,
      typography: {
        ...draftKitAtTypography.typography!,
        confirmedAt: '2026-09-16T12:00:00Z',
      },
    };

    vi.spyOn(brandKitApi, 'patchTypography').mockResolvedValue(completedKit);
    vi.spyOn(brandKitApi, 'advanceStep').mockResolvedValue(completedKit);

    render(
      <BrandStudioShell
        ideaId="idea_123"
        initialKit={draftKitAtTypography}
      />
    );

    // Click Typography step to open modal
    const typographyButton = screen.getByRole('button', { name: /Typography/i });
    fireEvent.click(typographyButton);

    // Find and click Confirm Typography
    await waitFor(() => {
      expect(screen.getByText(/Confirm & Complete Brand Kit/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /Confirm & Complete Brand Kit/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/creator/phase-2/brand-kit?ideaId=idea_123');
    });
  });

  it('does NOT navigate away when Typography is re-confirmed on an already completed kit', async () => {
    const alreadyCompletedKit: BrandKit = {
      ...mockCompletedStrategyAndDirectionKit,
      status: 'complete',
      currentStep: 6,
      logo: {
        logoType: 'wordmark',
        selectedConceptKey: 'concept_1',
        variations: {
          primary: { svgUri: '<svg></svg>', usageNote: 'Primary' },
        },
        approvedAt: '2026-09-15T11:00:00Z',
        concepts: [],
        regenerateCount: 0,
      },
      colors: {
        roles: [
          { roleName: 'Primary', hex: '#0052FF', isDark: true, provenance: 'stated' },
          { roleName: 'Secondary', hex: '#0F172A', isDark: true, provenance: 'stated' },
          { roleName: 'Accent', hex: '#38BDF8', isDark: false, provenance: 'stated' },
          { roleName: 'Background', hex: '#F8FAFC', isDark: false, provenance: 'stated' },
          { roleName: 'Text', hex: '#09090B', isDark: true, provenance: 'stated' },
        ],
        regenerateCount: 0,
        confirmedAt: '2026-09-15T11:30:00Z',
      },
      typography: {
        roles: [
          { roleName: 'Logo type', family: 'Space Grotesk', weight: '700', size: '24px', lineHeight: '1.2', specimenText: 'CyberLock', isLocked: true, provenance: 'stated' },
          { roleName: 'Heading', family: 'Space Grotesk', weight: '700', size: '32px', lineHeight: '1.2', specimenText: 'Heading sample', isLocked: false, provenance: 'derived' },
          { roleName: 'Body', family: 'Plus Jakarta Sans', weight: '400', size: '16px', lineHeight: '1.5', specimenText: 'Body sample', isLocked: false, provenance: 'derived' },
          { roleName: 'Button & label', family: 'Plus Jakarta Sans', weight: '600', size: '14px', lineHeight: '1.4', specimenText: 'Button sample', isLocked: false, provenance: 'derived' },
        ],
        regenerateCount: 0,
        confirmedAt: '2026-09-15T12:00:00Z',
      },
    };

    vi.spyOn(brandKitApi, 'patchTypography').mockResolvedValue(alreadyCompletedKit);
    vi.spyOn(brandKitApi, 'advanceStep').mockResolvedValue(alreadyCompletedKit);

    render(
      <BrandStudioShell
        ideaId="idea_123"
        initialKit={alreadyCompletedKit}
      />
    );

    // Open Typography step
    const typographyButton = screen.getByRole('button', { name: /Typography/i });
    fireEvent.click(typographyButton);

    await waitFor(() => {
      expect(screen.getByText(/Confirm & Complete Brand Kit/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /Confirm & Complete Brand Kit/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      // Should NOT have navigated
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});

