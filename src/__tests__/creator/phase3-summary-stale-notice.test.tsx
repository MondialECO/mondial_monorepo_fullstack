import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { SummaryStaleNotice } from '@/components/creator/phase3/SummaryStaleNotice';
import type { ClarifierAnswer } from '@/types/creator/journey-api';

let phase2: Record<string, unknown> = {};
vi.mock('@/providers/CreatorProgressProvider', () => ({
  useCreatorProgress: () => ({ state: { journeyState: { phase2 } } }),
}));

const answer = (updatedAt: string): ClarifierAnswer => ({
  questionIndex: 1, status: 'accepted', attempts: 1, rawAnswer: 'x', aiExtracted: {}, userEdited: null, language: 'en', updatedAt,
});

describe('SummaryStaleNotice (Phase 3, between Fix it and Regenerate summary)', () => {
  beforeEach(() => {
    phase2 = {};
  });

  it('points to the idea summary and offers no Phase 3 regenerate when an answer changed after the summary', () => {
    phase2 = {
      clarifierSessionId: 'c2-1',
      clarifierSummarizedAt: '2026-10-30T10:00:00Z',
      clarifierAnswers: [answer('2026-10-31T09:00:00Z')],
    };
    render(<SummaryStaleNotice />);

    expect(screen.getByRole('status')).toHaveTextContent('Your answers changed since your summary.');
    expect(screen.getByRole('link', { name: 'Update it first' })).toHaveAttribute('href', '/dashboard/creator/phase-2/idea-summary');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders nothing when the summary is up to date', () => {
    phase2 = {
      clarifierSessionId: 'c2-1',
      clarifierSummarizedAt: '2026-10-31T10:00:00Z',
      clarifierAnswers: [answer('2026-10-30T09:00:00Z')],
    };
    const { container } = render(<SummaryStaleNotice />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing before any summary exists', () => {
    phase2 = { clarifierAnswers: [answer('2026-10-31T09:00:00Z')] };
    const { container } = render(<SummaryStaleNotice />);
    expect(container).toBeEmptyDOMElement();
  });
});
