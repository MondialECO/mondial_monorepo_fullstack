import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ClarifierAnswer, ClarifierChatMessage } from '@/types/creator/journey-api';

const { chatMessage, skipFollowUp } = vi.hoisted(() => ({ chatMessage: vi.fn(), skipFollowUp: vi.fn() }));
let mockMessages: ClarifierChatMessage[] = [];
let mockAnswers: ClarifierAnswer[] = [];

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/dashboard/creator/phase-2/clarifier',
  useSearchParams: () => new URLSearchParams('ideaId=idea-1'),
}));
// One stable object per test: the page syncs local state from `phase2` in an effect, so a new
// object on every render would loop.
let mockProgress: unknown;
vi.mock('@/providers/CreatorProgressProvider', () => ({ useCreatorProgress: () => mockProgress }));
const setProgress = () => {
  mockProgress = {
    state: { activeIdeaId: 'idea-1', project: {}, journeyState: { phase2: { chatMessages: mockMessages, clarifierAnswers: mockAnswers } } },
    setState: vi.fn(),
    refetch: vi.fn(),
  };
};
vi.mock('@/hooks/queries/creator-ai', () => ({
  POLL_INTERVAL_MS: 1, POLL_MAX_ATTEMPTS: 1, POLL_MAX_MS: 1, useAiCredits: () => ({ data: undefined }),
}));
vi.mock('@/lib/realtime/use-signalr-hub', () => ({ useSignalRHub: () => ({ status: 'idle', invoke: vi.fn() }) }));
vi.mock('@/lib/api-creator-ai', () => ({ creatorAiApi: {} }));
vi.mock('@/lib/api-creator-journey', () => ({
  creatorJourneyApi: { chatMessage, skipFollowUp, editClarifierAnswer: vi.fn(), initializeClarifierIdea: vi.fn(), finalizeClarifier: vi.fn() },
  getIdeaVersion: () => 1,
  setIdeaVersion: vi.fn(),
}));

import AIClarifierPage from '@/app/dashboard/creator/phase-2/clarifier/page';

const answer = (questionIndex: number, status: ClarifierAnswer['status'], extra: Partial<ClarifierAnswer> = {}): ClarifierAnswer => ({
  questionIndex, status, attempts: 1, rawAnswer: 'x', aiExtracted: {}, userEdited: null, language: 'en', updatedAt: '', ...extra,
});

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
  chatMessage.mockReset();
  mockAnswers = [answer(1, 'accepted', { aiExtracted: { problem: 'Dorm students cannot find cheap food.' } }), answer(2, 'pending', { followUpUsed: true })];
  mockMessages = [
    { id: 'u1', sender: 'user', text: 'A meal-sharing app', questionIndex: 1 },
    { id: 'f-old', sender: 'ai', kind: 'followup', questionIndex: 2, text: 'Hmm.\n\nWho exactly?', chips: ['old chip'] },
    { id: 'u2', sender: 'user', text: 'Students', questionIndex: 2 },
    { id: 'f-new', sender: 'ai', kind: 'followup', questionIndex: 2, text: "'Students' is a big group.\n\nWhich students feel this most?", chips: ['dorm students', 'night-shift nurses'] },
  ];
});

describe('clarifier page', () => {
  it('shows chips and Skip only on the latest active follow-up', () => {
    setProgress();
    render(<AIClarifierPage />);

    const groups = screen.getAllByRole('group', { name: 'Suggested answers' });
    expect(groups).toHaveLength(1);
    expect(within(groups[0]).getByRole('button', { name: 'dorm students' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'old chip' })).toBeNull();
    expect(screen.getAllByRole('button', { name: 'Skip — keep my answer' })).toHaveLength(1);
    // The older follow-up still shows its acknowledgement and question.
    expect(screen.getByText('Who exactly?')).toBeInTheDocument();
  });

  it('a chip click fills the input and never sends', () => {
    setProgress();
    render(<AIClarifierPage />);

    fireEvent.click(screen.getByRole('button', { name: 'dorm students' }));

    expect(screen.getByRole('textbox')).toHaveValue('dorm students');
    expect(chatMessage).not.toHaveBeenCalled();
    expect(skipFollowUp).not.toHaveBeenCalled();
  });

  it('a base question shows no Skip and no follow-up chips', () => {
    mockAnswers = [answer(1, 'accepted')];
    mockMessages = [
      { id: 'u1', sender: 'user', text: 'A meal-sharing app', questionIndex: 1 },
      { id: 'q2', sender: 'ai', kind: 'question', questionIndex: 2, text: 'Nice.\n\nWho has this problem the most?' },
    ];
    setProgress();
    render(<AIClarifierPage />);

    expect(screen.queryByRole('button', { name: 'Skip — keep my answer' })).toBeNull();
    expect(screen.queryByText('Pick one or write your own')).toBeNull();
  });

  it('panel shows "X / 6 clear" (weak is not clear) and no fixed-question captions anywhere', () => {
    mockAnswers = [...mockAnswers, answer(4, 'accepted_weak', { aiExtracted: { solution: 'Shared meals.' } })];
    setProgress();
    render(<AIClarifierPage />);

    expect(screen.getByText('1 / 6 clear')).toBeInTheDocument();
    expect(screen.getByText('Your idea so far')).toBeInTheDocument();
    const text = document.body.textContent ?? '';
    expect(text).not.toMatch(/Question \d+ of/i);
    expect(text).not.toMatch(/Unlocks after/i);
    expect(text).not.toMatch(/Response to Q/i);
  });

  it('uses the honest intro and header copy, never the fixed-question copy', () => {
    setProgress();
    render(<AIClarifierPage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("Let's sharpen your idea");
    expect(screen.getByText(/The AI asks only about what's still missing/)).toBeInTheDocument();
    expect(screen.getByText('Ask, refine, done. Usually 5 to 9 messages.')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/focused questions/i);
  });
});
