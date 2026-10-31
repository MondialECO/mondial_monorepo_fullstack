import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { SkipFollowUpAction } from '@/components/creator/clarifier/SkipFollowUpAction';
import { getClarifierAnswers } from '@/lib/clarifier-answers';
import type { ClarifierChatMessage } from '@/types/creator/journey-api';

const msg = (sender: ClarifierChatMessage['sender'], kind?: ClarifierChatMessage['kind']): ClarifierChatMessage => ({
  id: 'm1', sender, text: 'Which students exactly?', kind, questionIndex: 2,
});

describe('Skip — keep my answer', () => {
  it('shows on an AI follow-up and calls onSkip', () => {
    const onSkip = vi.fn();
    render(<SkipFollowUpAction message={msg('ai', 'followup')} onSkip={onSkip} />);
    fireEvent.click(screen.getByRole('button', { name: 'Skip — keep my answer' }));
    expect(onSkip).toHaveBeenCalledOnce();
  });

  it.each([
    ['a base question', msg('ai', 'question')],
    ['a nudge', msg('ai', 'nudge')],
    ['the closing', msg('ai', 'ack')],
    ['a user answer', msg('user')],
    ['a skip note', msg('system', 'skip')],
    ['no message', undefined],
  ])('is hidden on %s', (_, message) => {
    const { container } = render(<SkipFollowUpAction message={message} onSkip={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('a skip note never counts as a (legacy) answer', () => {
    const answers = getClarifierAnswers({
      chatMessages: [
        { id: 'u1', sender: 'user', text: 'a1' },
        { id: 's1', sender: 'system', kind: 'skip', text: 'Skipped — kept my answer.' },
        { id: 'u2', sender: 'user', text: 'a2' },
      ],
    });
    expect(answers.map((a) => [a.questionIndex, a.rawAnswer])).toEqual([[1, 'a1'], [2, 'a2']]);
  });
});
