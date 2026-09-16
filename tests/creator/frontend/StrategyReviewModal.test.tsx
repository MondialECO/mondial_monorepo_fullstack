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
    firstAppearance: 'invoice',
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
  it('renders real pulled Creator data with provenance badges and 6 workflow steps', () => {
    const handleConfirm = vi.fn();
    const handleClose = vi.fn();

    render(
      <StrategyReviewModal
        kit={mockTestKit}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
    );

    // Verify Title & Subtitle per Figma 57003:9780
    expect(screen.getByText('Confirm your brand strategy')).toBeInTheDocument();
    expect(
      screen.getByText(/Pulled from your idea\. Correct anything that's off/i)
    ).toBeInTheDocument();

    // Verify Workflow Steps Tab Bar
    expect(screen.getByText('Strategy')).toBeInTheDocument();
    expect(screen.getByText('Direction')).toBeInTheDocument();
    expect(screen.getByText('Logo type')).toBeInTheDocument();
    expect(screen.getByText('Logo')).toBeInTheDocument();
    expect(screen.getByText('Colour')).toBeInTheDocument();
    expect(screen.getByText('Typography')).toBeInTheDocument();

    // Verify Business Name appears in Header & Fields
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

    // Verify 0 credit cost indicator
    const zeroDigits = screen.getAllByText('0');
    expect(zeroDigits.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/CREDITS/i)).toBeInTheDocument();
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

  it('renders ALL CAPS and distinct casing variants for single-word business names like Instaly', () => {
    const singleWordKit: BrandKit = {
      ...mockTestKit,
      strategy: {
        ...mockTestKit.strategy!,
        businessName: 'Instaly',
        nameDisplayForm: 'Instaly',
      },
    };

    render(
      <StrategyReviewModal
        kit={singleWordKit}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    // Verify TitleCase, ALL CAPS, and lowercase
    expect(screen.getByText('INSTALY')).toBeInTheDocument();
    expect(screen.getByText('instaly')).toBeInTheDocument();
    expect(screen.getAllByText('Instaly').length).toBeGreaterThanOrEqual(1);
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
    const removeBtn = screen.getByLabelText('Remove Precise');
    fireEvent.click(removeBtn);
    expect(screen.queryByText('Precise')).not.toBeInTheDocument();

    // Add a suggested trait
    const suggestedBtn = screen.getByRole('button', { name: 'Technical' });
    fireEvent.click(suggestedBtn);
    expect(screen.getByText('Technical')).toBeInTheDocument();
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
