import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThinAnswersBanner } from '@/components/creator/clarifier/ThinAnswersBanner';
import { UnconfirmedTag } from '@/components/creator/clarifier/UnconfirmedTag';
import { weakTopics } from '@/lib/clarifier-answers';
import type { ClarifierAnswer } from '@/types/creator/journey-api';

const answer = (questionIndex: number, status: ClarifierAnswer['status']): ClarifierAnswer => ({
  questionIndex, status, attempts: 1, rawAnswer: 'x', aiExtracted: {}, userEdited: null, language: 'en', updatedAt: '',
});

let mockAnswers: ClarifierAnswer[] = [];
vi.mock('@/providers/CreatorProgressProvider', () => ({
  useCreatorProgress: () => ({ state: { journeyState: { phase2: { clarifierAnswers: mockAnswers } } } }),
}));

describe('unconfirmed marker', () => {
  beforeEach(() => {
    mockAnswers = [];
  });

  it('banner renders nothing when no topic is weak', () => {
    mockAnswers = [answer(1, 'accepted'), answer(2, 'pending')];
    const { container } = render(<ThinAnswersBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('banner counts weak topics and links to the idea summary', () => {
    mockAnswers = [answer(1, 'accepted_weak'), answer(2, 'accepted'), answer(6, 'accepted_weak')];
    render(<ThinAnswersBanner />);
    expect(screen.getByRole('note')).toHaveTextContent('2 of your answers were thin');
    expect(screen.getByRole('link')).toHaveAttribute('href', '/dashboard/creator/phase-2/idea-summary');
  });

  it('banner uses the singular for one weak topic', () => {
    mockAnswers = [answer(3, 'accepted_weak')];
    render(<ThinAnswersBanner />);
    expect(screen.getByRole('note')).toHaveTextContent('1 of your answers was thin');
  });

  it('a weak topic edited to clear drops out of the live status (no extra sync)', () => {
    const answers = [answer(5, 'accepted_weak'), answer(6, 'accepted_weak')];
    expect(weakTopics(answers)).toEqual([5, 6]);
    answers[0] = { ...answers[0], status: 'accepted' };
    expect(weakTopics(answers)).toEqual([6]);
  });

  it('tag links to the topic edit, including two-field topics', () => {
    render(<UnconfirmedTag topic={6} ideaId="idea-1" />);
    expect(screen.getByText('Unconfirmed — thin answer')).toBeInTheDocument();
    const href = screen.getByRole('link', { name: 'Fix it' }).getAttribute('href')!;
    const params = new URL(href, 'http://x').searchParams;
    expect(href.startsWith('/dashboard/creator/phase-2/clarifier?')).toBe(true);
    expect(params.get('fix')).toBe('6');
    expect(params.get('ideaId')).toBe('idea-1');
  });
});
