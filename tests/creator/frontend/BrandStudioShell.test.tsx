import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import {
  BrandStudioShell,
  hasMeaningfulBrandData,
  normalizeModalKey,
} from '@/components/creator/brand-kit/BrandStudioShell';
import { brandKitApi } from '@/lib/api-creator-brand-kit';
import { BrandKit } from '@/types/creator/brand-kit';

const mockPush = vi.fn();

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

const mockFreshDraftKit: BrandKit = {
  ideaId: 'idea_fresh',
  userId: 'user_123',
  status: 'draft',
  currentStep: 1,
  version: 1,
  createdAt: '2026-09-24T00:00:00Z',
  updatedAt: '2026-09-24T00:00:00Z',
  strategy: {
    businessName: 'NovaTech',
    nameDisplayForm: 'NovaTech',
    concept: { value: 'AI cloud automation', provenance: 'derived' },
    targetAudience: { value: 'Engineers', provenance: 'derived' },
    industry: { value: 'SaaS', provenance: 'derived' },
    positioning: { value: 'Smart cloud ops', provenance: 'derived' },
    personalityTraits: ['Precise', 'Resilient', 'Autonomous'],
    symbolFeeling: '',
    avoidList: [],
    confirmedAt: null,
  },
  direction: {
    candidates: [],
    selectedDirectionKey: null,
    selectedAt: null,
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
    roles: [
      { roleName: 'Primary', hex: '#1A1A24', rgb: '26,26,36', usageNote: 'Primary brand role', isLocked: false, provenance: 'stated' },
      { roleName: 'Secondary', hex: '#3C61DD', rgb: '60,97,221', usageNote: 'Secondary role', isLocked: false, provenance: 'derived' },
      { roleName: 'Accent', hex: '#00D084', rgb: '0,208,132', usageNote: 'Accent role', isLocked: false, provenance: 'derived' },
      { roleName: 'Background', hex: '#FFFFFF', rgb: '255,255,255', usageNote: 'Canvas background', isLocked: true, provenance: 'stated' },
      { roleName: 'Text', hex: '#0F172A', rgb: '15,23,42', usageNote: 'High-contrast text', isLocked: false, provenance: 'derived' },
    ],
    confirmedAt: null,
    regenerateCount: 0,
  },
  typography: {
    roles: [
      { roleName: 'Logo type', family: 'Cabinet Grotesk', weight: '800', size: '24px', lineHeight: '1.2', specimenText: 'NovaTech', isLocked: true, provenance: 'stated' },
      { roleName: 'Heading', family: 'Clash Display', weight: '700', size: '32px', lineHeight: '1.2', specimenText: 'Heading sample', isLocked: false, provenance: 'derived' },
      { roleName: 'Body', family: 'Inter', weight: '400', size: '16px', lineHeight: '1.5', specimenText: 'Body sample', isLocked: false, provenance: 'derived' },
      { roleName: 'Button & label', family: 'Inter', weight: '600', size: '14px', lineHeight: '1.4', specimenText: 'Button sample', isLocked: false, provenance: 'derived' },
    ],
    confirmedAt: null,
    regenerateCount: 0,
  },
  snapshots: [],
};

const mockExistingBrandKit: BrandKit = {
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
    logoType: 'wordmark',
    concepts: [],
    selectedConceptKey: null,
    variations: {},
    regenerateCount: 0,
    approvedAt: null,
  },
  colors: {
    roles: [
      { roleName: 'Primary', hex: '#0052FF', rgb: '0, 82, 255', usageNote: 'Primary mark', isLocked: false, provenance: 'stated' },
      { roleName: 'Secondary', hex: '#0F172A', rgb: '15, 23, 42', usageNote: 'Secondary tone', isLocked: false, provenance: 'stated' },
      { roleName: 'Accent', hex: '#38BDF8', rgb: '56, 189, 248', usageNote: 'Accent highlight', isLocked: false, provenance: 'stated' },
      { roleName: 'Background', hex: '#F8FAFC', rgb: '248, 250, 252', usageNote: 'Light surface', isLocked: false, provenance: 'stated' },
      { roleName: 'Text', hex: '#09090B', rgb: '9, 9, 11', usageNote: 'Deep text', isLocked: false, provenance: 'stated' },
    ],
    confirmedAt: '2026-09-15T11:00:00Z',
    regenerateCount: 0,
  },
  typography: {
    roles: [
      { roleName: 'Logo type', family: 'Space Grotesk', weight: '700', size: '24px', lineHeight: '1.2', specimenText: 'CyberLock', isLocked: true, provenance: 'stated' },
      { roleName: 'Heading', family: 'Space Grotesk', weight: '700', size: '32px', lineHeight: '1.2', specimenText: 'Heading sample', isLocked: false, provenance: 'derived' },
      { roleName: 'Body', family: 'Plus Jakarta Sans', weight: '400', size: '16px', lineHeight: '1.5', specimenText: 'Body sample', isLocked: false, provenance: 'derived' },
      { roleName: 'Button & label', family: 'Plus Jakarta Sans', weight: '600', size: '14px', lineHeight: '1.4', specimenText: 'Button sample', isLocked: false, provenance: 'derived' },
    ],
    confirmedAt: '2026-09-15T11:30:00Z',
    regenerateCount: 0,
  },
  snapshots: [],
};

describe('hasMeaningfulBrandData and normalizeModalKey helpers', () => {
  it('returns false for fresh draft kit where user has not confirmed strategy or steps', () => {
    expect(hasMeaningfulBrandData(mockFreshDraftKit)).toBe(false);
  });

  it('returns true when strategy is confirmed', () => {
    expect(hasMeaningfulBrandData(mockExistingBrandKit)).toBe(true);
  });

  it('returns true when kit status is complete', () => {
    const completedKit: BrandKit = {
      ...mockFreshDraftKit,
      status: 'complete',
    };
    expect(hasMeaningfulBrandData(completedKit)).toBe(true);
  });

  it('normalizes modal step keys correctly', () => {
    expect(normalizeModalKey('strategy')).toBe('strategy');
    expect(normalizeModalKey('direction')).toBe('direction');
    expect(normalizeModalKey('logo')).toBe('logo_type');
    expect(normalizeModalKey('logo_type')).toBe('logo_type');
    expect(normalizeModalKey('logo_creation')).toBe('logo_creation');
    expect(normalizeModalKey('variations')).toBe('variations');
    expect(normalizeModalKey('colors')).toBe('colors');
    expect(normalizeModalKey('colour')).toBe('colors');
    expect(normalizeModalKey('typography')).toBe('typography');
    expect(normalizeModalKey('unknown')).toBeNull();
    expect(normalizeModalKey(null)).toBeNull();
  });
});

describe('BrandStudioShell Component Lifecycle & Routing Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('first-time entry: auto-opens the first modal (Strategy Review Modal) when no brand exists', async () => {
    vi.spyOn(brandKitApi, 'openStudio').mockResolvedValue(mockFreshDraftKit);

    render(
      <BrandStudioShell
        ideaId="idea_fresh"
        initialKit={mockFreshDraftKit}
      />
    );

    // Strategy Review Modal (Step 1) must be open
    await waitFor(() => {
      expect(screen.getByText(/Confirm your brand strategy/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Confirm Brand Strategy/i })).toBeInTheDocument();
    });
  });

  it('existing brand kit entry: opens the edit page (View Mode) directly without auto-opening any modal', async () => {
    vi.spyOn(brandKitApi, 'openStudio').mockResolvedValue(mockExistingBrandKit);

    render(
      <BrandStudioShell
        ideaId="idea_123"
        initialKit={mockExistingBrandKit}
      />
    );

    // No modal should be open initially
    expect(screen.queryByText(/Confirm your brand strategy/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Pick a visual direction/i)).not.toBeInTheDocument();

    // Edit page header and action buttons must be visible
    expect(screen.getByRole('heading', { level: 1, name: /Brand Studio/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Download Brand/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('button', { name: /View Full Brand Kit/i }).length).toBeGreaterThanOrEqual(1);

    // Strategy and Direction result cards must be rendered with Edit buttons
    expect(screen.getAllByText('Autonomous AI defense system for cloud infrastructure.').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Technical Precision')).toBeInTheDocument();

    // Verify Edit buttons exist for sections
    expect(screen.getAllByRole('button', { name: /Edit/i }).length).toBeGreaterThanOrEqual(1);

    // Logo, Variations edit buttons must be present
    expect(screen.getByRole('button', { name: /Edit Logo Type/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Logo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate Variations/i })).toBeInTheDocument();
  });

  it('clicking an Edit button on the edit page opens that specific modal in targeted edit mode', async () => {
    render(
      <BrandStudioShell
        ideaId="idea_123"
        initialKit={mockExistingBrandKit}
      />
    );

    // Click the first Edit button (Strategy card Edit button)
    const editButtons = screen.getAllByRole('button', { name: /^Edit$/i });
    fireEvent.click(editButtons[0]);

    // Strategy Review modal opens
    await waitFor(() => {
      expect(screen.getByText(/Confirm your brand strategy/i)).toBeInTheDocument();
    });
  });

  it('navigates to Brand Kit page when View Full Brand Kit is clicked', async () => {
    render(
      <BrandStudioShell
        ideaId="idea_123"
        initialKit={mockExistingBrandKit}
      />
    );

    const viewFullKitBtn = screen.getAllByRole('button', { name: /View Full Brand Kit/i })[0];
    fireEvent.click(viewFullKitBtn);

    expect(mockPush).toHaveBeenCalledWith('/dashboard/creator/phase-2/brand-kit?ideaId=idea_123');
  });

  it('sequential workflow (modal 1 tar por 1 ta asbe): confirming Strategy automatically opens Direction modal', async () => {
    const updatedKitWithConfirmedStrategy: BrandKit = {
      ...mockFreshDraftKit,
      strategy: {
        ...mockFreshDraftKit.strategy!,
        confirmedAt: '2026-09-24T01:00:00Z',
      },
    };

    vi.spyOn(brandKitApi, 'patchStrategy').mockResolvedValue(updatedKitWithConfirmedStrategy);

    render(
      <BrandStudioShell
        ideaId="idea_fresh"
        initialKit={mockFreshDraftKit}
      />
    );

    // Initial modal (Strategy) is open
    await waitFor(() => {
      expect(screen.getByText(/Confirm your brand strategy/i)).toBeInTheDocument();
    });

    // User confirms Strategy
    const confirmStrategyBtn = screen.getByRole('button', { name: /Confirm Brand Strategy/i });
    fireEvent.click(confirmStrategyBtn);

    // Modal 2 (Visual Direction) must automatically open!
    await waitFor(() => {
      expect(screen.getByText(/Pick a visual direction/i)).toBeInTheDocument();
    });
  });

  it('edit mode from edit page (sudhu edit a gele edit page theke oi ta asbe): confirming edit closes modal and returns to edit page without auto-advancing', async () => {
    const patchedStrategyKit: BrandKit = {
      ...mockExistingBrandKit,
      strategy: {
        ...mockExistingBrandKit.strategy!,
        confirmedAt: '2026-09-24T02:00:00Z',
      },
    };

    vi.spyOn(brandKitApi, 'patchStrategy').mockResolvedValue(patchedStrategyKit);

    render(
      <BrandStudioShell
        ideaId="idea_123"
        initialKit={mockExistingBrandKit}
      />
    );

    // Edit page is rendered, no modal open
    expect(screen.queryByText(/Confirm your brand strategy/i)).not.toBeInTheDocument();

    // Click "Edit" on Strategy section
    const editButtons = screen.getAllByRole('button', { name: /^Edit$/i });
    fireEvent.click(editButtons[0]);

    // Strategy modal opens
    await waitFor(() => {
      expect(screen.getByText(/Confirm your brand strategy/i)).toBeInTheDocument();
    });

    // Confirm the edited strategy
    const confirmStrategyBtn = screen.getByRole('button', { name: /Confirm Brand Strategy/i });
    fireEvent.click(confirmStrategyBtn);

    // Modal must close back to edit page and NOT advance to Direction modal!
    await waitFor(() => {
      expect(screen.queryByText(/Confirm your brand strategy/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Pick a visual direction/i)).not.toBeInTheDocument();
    });

    // Edit page is active
    expect(screen.getByRole('heading', { level: 1, name: /Brand Studio/i })).toBeInTheDocument();
  });
});

