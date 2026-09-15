import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { StrategyReviewModal } from '@/components/creator/brand-kit/StrategyReviewModal';
import { BrandKit } from '@/types/creator/brand-kit';

const mockTestKit: BrandKit = {
  ideaId: 'idea_cyber',
  userId: 'user_123',
  status: 'draft',
  currentStep: 1,
  version: 1,
  createdAt: '2026-09-15T00:00:00Z',
  updatedAt: '2026-09-15T00:00:00Z',
  strategy: {
    businessName: 'CyberLock Sentinel',
    nameDisplayForm: 'CyberLock Sentinel',
    concept: {
      value: 'Autonomous AI defense system for cloud infrastructure.',
      provenance: 'stated',
    },
    targetAudience: {
      value: 'Enterprise DevOps and SecOps teams',
      provenance: 'stated',
    },
    industry: {
      value: 'Cybersecurity & Cloud Infrastructure',
      provenance: 'stated',
    },
    positioning: {
      value: 'Zero-compromise cloud security automation.',
      provenance: 'stated',
    },
    personalityTraits: ['Precise', 'Resilient', 'Autonomous'],
    avoidList: ['Cliché padlocks', 'Generic shields'],
    tonePosition: 'balanced',
    firstAppearance: 'website',
    symbolFeeling: 'The Guardian',
    confirmedAt: null,
  },
  direction: {
    candidates: [],
    regenerateCount: 0,
  },
  logo: {
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

describe('StrategyReviewModal Component', () => {
  it('renders real pulled Creator data with stated provenance chips', () => {
    const handleConfirm = vi.fn();
    const handleClose = vi.fn();

    render(
      <StrategyReviewModal
        kit={mockTestKit}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
    );

    // Verify Business Name appears
    const nameInstances = screen.getAllByText('CyberLock Sentinel');
    expect(nameInstances.length).toBeGreaterThanOrEqual(1);

    expect(
      screen.getByText('Autonomous AI defense system for cloud infrastructure.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Enterprise DevOps and SecOps teams')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Cybersecurity & Cloud Infrastructure')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Zero-compromise cloud security automation.')
    ).toBeInTheDocument();

    // Verify honest provenance chips
    const statedBadges = screen.getAllByText('stated');
    expect(statedBadges.length).toBeGreaterThanOrEqual(4);

    // Verify 0 credit cost indicator
    expect(screen.getByText('0 CREDITS')).toBeInTheDocument();
  });

  it('renders Name Display Form options derived directly from business name', () => {
    render(
      <StrategyReviewModal
        kit={mockTestKit}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    // Verify casing variants derived from "CyberLock Sentinel"
    expect(screen.getAllByText('CyberLock Sentinel').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('CYBERLOCK SENTINEL')).toBeInTheDocument();
    expect(screen.getByText('cyberlock sentinel')).toBeInTheDocument();
  });

  it('allows adding and removing personality trait pills freely', async () => {
    render(
      <StrategyReviewModal
        kit={mockTestKit}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    // Initial traits
    expect(screen.getByText('Precise')).toBeInTheDocument();
    expect(screen.getByText('Resilient')).toBeInTheDocument();
    expect(screen.getByText('Autonomous')).toBeInTheDocument();

    // Remove a trait
    const removeBtn = screen.getByTitle('Remove Precise');
    fireEvent.click(removeBtn);
    expect(screen.queryByText('Precise')).not.toBeInTheDocument();

    // Add a new trait
    const traitInput = screen.getByPlaceholderText('Add trait...');
    fireEvent.change(traitInput, { target: { value: 'Hyper-scalable' } });
    const addButtons = screen.getAllByRole('button', { name: /Add/i });
    fireEvent.click(addButtons[0]);

    expect(screen.getByText('Hyper-scalable')).toBeInTheDocument();
  });

  it('allows adding custom avoidances and picking sector suggestions', async () => {
    render(
      <StrategyReviewModal
        kit={mockTestKit}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    // Initial avoidances
    expect(screen.getByTitle('Remove Cliché padlocks')).toBeInTheDocument();
    expect(screen.getByTitle('Remove Generic shields')).toBeInTheDocument();

    // Remove an avoidance
    const removeBtn = screen.getByTitle('Remove Cliché padlocks');
    fireEvent.click(removeBtn);
    expect(screen.queryByTitle('Remove Cliché padlocks')).not.toBeInTheDocument();

    // Add avoidance via free text
    const avoidInput = screen.getByPlaceholderText('Add avoidance...');
    fireEvent.change(avoidInput, { target: { value: 'Cartoon mascots' } });
    const addButtons = screen.getAllByRole('button', { name: /Add/i });
    fireEvent.click(addButtons[addButtons.length - 1]);

    expect(screen.getByTitle('Remove Cartoon mascots')).toBeInTheDocument();
  });

  it('submits updated strategy payload and sets confirmedAt on confirm', async () => {
    const handleConfirm = vi.fn().mockResolvedValue(undefined);

    render(
      <StrategyReviewModal
        kit={mockTestKit}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
      />
    );

    const confirmBtn = screen.getByRole('button', {
      name: /Confirm Brand Strategy/i,
    });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(handleConfirm).toHaveBeenCalledTimes(1);
      const payload = handleConfirm.mock.calls[0][0];
      expect(payload.businessName).toBe('CyberLock Sentinel');
      expect(payload.confirmedAt).toBeTruthy();
      expect(payload.personalityTraits).toEqual([
        'Precise',
        'Resilient',
        'Autonomous',
      ]);
    });
  });
});
