import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { BrandStudioShell } from '@/components/creator/brand-kit/BrandStudioShell';
import { brandKitApi } from '@/lib/api-creator-brand-kit';
import { BrandKit } from '@/types/creator/brand-kit';

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
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
        displayTypeface: 'Inter',
        textTypeface: 'Inter',
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
  history: [],
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
    expect(screen.getByText('Technical Precision')).toBeInTheDocument();
    expect(screen.getByText('Engineered authority with crisp mathematical balance.')).toBeInTheDocument();

    // Verify resumed active step is Logo Type placeholder modal
    expect(screen.getByText(/STEP 3 OF 6 • LOGO TYPE/i)).toBeInTheDocument();
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
});
