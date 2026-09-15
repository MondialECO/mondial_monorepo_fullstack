import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import Phase2CompletePage from '@/app/dashboard/creator/phase-2/complete/page';
import { creatorJourneyApi } from '@/lib/api-creator-journey';
import { apiCreatorBrandKit } from '@/lib/api-creator-brand-kit';
import { BrandKit } from '@/types/creator/brand-kit';

const mockPush = vi.fn();
const mockAdvancePhase = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockProjectState = {
  id: 'idea_cyber_123',
  name: 'CyberLock',
  tagline: 'Zero-compromise cloud security automation.',
  problem: 'DevOps teams struggle with unauthorized lateral movement.',
  solution: 'Autonomous AI defense engine for microservice meshes.',
  branding: {
    logoType: 'ai',
    logoAsset: null,
  },
  exists: true,
};

vi.mock('@/providers/CreatorProgressProvider', () => ({
  useCreatorProgress: () => ({
    state: {
      project: mockProjectState,
      journeyState: {
        phase3: { status: 'available' },
      },
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    advancePhase: mockAdvancePhase,
  }),
}));

const mockBrandKit: BrandKit = {
  ideaId: 'idea_cyber_123',
  userId: 'user_456',
  status: 'complete',
  currentStep: 6,
  version: 2,
  createdAt: '2026-09-15T00:00:00Z',
  updatedAt: '2026-09-15T00:00:00Z',
  strategy: {
    businessName: 'CyberLock Sentinel',
    nameDisplayForm: 'CyberLock',
    concept: { value: 'Autonomous AI defense system for cloud infrastructure.', provenance: 'stated' },
    positioning: { value: 'Zero-compromise cloud security automation.', provenance: 'stated' },
    personalityTraits: ['Precise', 'Resilient', 'Autonomous'],
    confirmedAt: '2026-09-15T10:00:00Z',
  },
  direction: {
    candidates: [
      {
        key: 'dir_cyber',
        name: 'Technical Precision',
        feelLine: 'Crisp mathematical balance.',
        rationale: 'DevOps appeal.',
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
    logoType: 'wordmark',
    concepts: [],
    selectedConceptKey: 'concept_1',
    variations: {
      primary: {
        svgUri: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#0052FF"/></svg>',
        usageNote: 'Primary master lockup',
      },
    },
    regenerateCount: 0,
    approvedAt: '2026-09-15T11:00:00Z',
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
      { roleName: 'Heading', family: 'Space Grotesk', weight: '700', size: '32px', lineHeight: '1.2', specimenText: 'Heading', isLocked: false, provenance: 'derived' },
      { roleName: 'Body', family: 'Plus Jakarta Sans', weight: '400', size: '16px', lineHeight: '1.5', specimenText: 'Body', isLocked: false, provenance: 'derived' },
    ],
    regenerateCount: 0,
    confirmedAt: '2026-09-15T12:00:00Z',
  },
};

describe('Phase2CompletePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(creatorJourneyApi, 'get').mockResolvedValue({
      computedStatus: {
        phase1: { status: 'completed', currentStep: 7 },
        phase2: { status: 'completed', currentStep: 12 },
        phase3: { status: 'available', currentStep: 1 },
      } as any,
    } as any);
    vi.spyOn(apiCreatorBrandKit, 'getBrandKit').mockResolvedValue(mockBrandKit);
  });

  it('renders real BrandKit data including primary logo, 5 colour swatches, and typography pairing', async () => {
    render(<Phase2CompletePage />);

    await waitFor(() => {
      expect(screen.getByText('Project Identity Ready.')).toBeInTheDocument();
      expect(screen.getByText('CyberLock')).toBeInTheDocument();
      expect(screen.getByText('Zero-compromise cloud security automation.')).toBeInTheDocument();
    });

    // Check typography pairing display
    expect(screen.getByText('Space Grotesk')).toBeInTheDocument();
    expect(screen.getByText('Plus Jakarta Sans')).toBeInTheDocument();

    // Check View full Brand Kit link
    expect(screen.getByText(/View full Brand Kit/i)).toBeInTheDocument();

    // Check Masterplan preview items
    expect(screen.getByText('AI Business Plan')).toBeInTheDocument();
    expect(screen.getByText('AI Financial Forecast')).toBeInTheDocument();
    expect(screen.getByText('Legal & Structural Checklist')).toBeInTheDocument();
    expect(screen.getByText('Formation Generator')).toBeInTheDocument();
  });

  it('routes to Brand Kit Hub when View full Brand Kit link is clicked', async () => {
    render(<Phase2CompletePage />);

    await waitFor(() => {
      expect(screen.getByText(/View full Brand Kit/i)).toBeInTheDocument();
    });

    const hubButton = screen.getByRole('button', { name: /View full Brand Kit/i });
    fireEvent.click(hubButton);

    expect(mockPush).toHaveBeenCalledWith('/dashboard/creator/phase-2/brand-kit?ideaId=idea_cyber_123');
  });

  it('routes to Phase 3 when Launch Masterplan button is clicked', async () => {
    render(<Phase2CompletePage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Launch Masterplan/i })).toBeInTheDocument();
    });

    const launchButton = screen.getByRole('button', { name: /Launch Masterplan/i });
    fireEvent.click(launchButton);

    expect(mockPush).toHaveBeenCalledWith('/dashboard/creator/phase-3');
  });
});
